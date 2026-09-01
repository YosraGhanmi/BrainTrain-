'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getStripeClient } from '@/lib/payments/stripe';
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

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { paymentPlan: { include: { enrollment: { include: { child: true } } } } },
  });

  const ownsPayment = payment && payment.paymentPlan.enrollment.child.parentId === parent.parentId;
  if (!ownsPayment) redirect(localizedPath(locale, '/parent-portal?error=1'));
  if (payment!.status === 'PAID') {
    redirect(localizedPath(locale, `/parent-portal/children/${childId}/payments`));
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const successPath = localizedPath(locale, `/parent-portal/children/${childId}/payments?paid=1`);
  const cancelPath = localizedPath(locale, `/parent-portal/children/${childId}/payments?cancelled=1`);

  const stripe = getStripeClient();
  // NOTE: Stripe does not settle in TND (Tunisian Dinar) in most accounts —
  // a production deployment for a Tunisia-based business will likely need a
  // local gateway (Flouci/Konnect) or to bill in a Stripe-supported currency.
  // Kept as Stripe here per the approved plan; swap this client if needed.
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: payment!.currency.toLowerCase(),
          unit_amount: Math.round(Number(payment!.amount) * 100),
          product_data: { name: `BrainTrain: ${payment!.paymentPlan.type} payment` },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}${cancelPath}`,
    metadata: { paymentId: payment!.id },
  });

  await prisma.payment.update({ where: { id: payment!.id }, data: { stripeSessionId: checkoutSession.id } });

  redirect(checkoutSession.url!);
}
