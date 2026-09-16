'use server';

import { redirect } from 'next/navigation';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getStripeClient } from '@/lib/payments/stripe';
import { getFirebasePayment, updateFirebasePayment } from '@/lib/firebase/enrollments';
import { getFirebaseChild } from '@/lib/firebase/children';
import { firestore } from '@/lib/firebase/admin';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function payNow(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);
  const paymentId = field(formData, 'paymentId');
  const childId = field(formData, 'childId');

  const payment = await getFirebasePayment(paymentId);
  if (!payment) redirect(localizedPath(locale, '/parent-portal?error=1'));

  // Ownership: resolve childId through enrollment → child → parentId
  const enrollmentDoc = await firestore.collection('enrollments').doc(payment!.enrollmentId).get();
  const enrollmentChildId = String(enrollmentDoc.data()?.childId ?? '');
  const child = await getFirebaseChild(enrollmentChildId);

  const ownsPayment = child && child.parentId === parent.parentId;
  if (!ownsPayment) redirect(localizedPath(locale, '/parent-portal?error=1'));

  if (payment!.status === 'PAID') {
    redirect(localizedPath(locale, `/parent-portal/children/${childId}/payments`));
  }

  // Resolve plan type for label from payment plan
  const planSnap = await firestore.collection('payment_plans').doc(payment!.paymentPlanId).get();
  const planType = String(planSnap.data()?.type ?? 'MONTHLY');

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const successPath = localizedPath(locale, `/parent-portal/children/${childId}/payments?paid=1`);
  const cancelPath = localizedPath(locale, `/parent-portal/children/${childId}/payments?cancelled=1`);

  const stripe = getStripeClient();
  // NOTE: Stripe does not settle in TND (Tunisian Dinar) in most accounts —
  // a production deployment for a Tunisia-based business will likely need a
  // local gateway (Flouci/Konnect) or to bill in a Stripe-supported currency.
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: payment!.currency.toLowerCase(),
          unit_amount: Math.round(payment!.amount * 100),
          product_data: { name: `BrainTrain: ${planType} payment` },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}${cancelPath}`,
    metadata: { paymentId: payment!.id },
  });

  await updateFirebasePayment(paymentId, { stripeSessionId: checkoutSession.id });
  redirect(checkoutSession.url!);
}

export async function acknowledgePaymentConfirmation(paymentId: string, locale: AppLocale): Promise<void> {
  const parent = await requireParent(locale);

  const payment = await getFirebasePayment(paymentId);
  if (!payment) return;

  const enrollmentDoc = await firestore.collection('enrollments').doc(payment.enrollmentId).get();
  const enrollmentChildId = String(enrollmentDoc.data()?.childId ?? '');
  const child = await getFirebaseChild(enrollmentChildId);
  if (!child || child.parentId !== parent.parentId) return;

  await updateFirebasePayment(paymentId, { parentNotifiedAt: new Date() });
}
