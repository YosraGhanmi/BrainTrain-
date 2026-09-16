import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import { getStripeClient } from '@/lib/payments/stripe';

// The one place in the app allowed to mark a Payment PAID from an online
// transaction — verifies Stripe's signature server-side rather than trusting
// the client-side redirect back from checkout.
//
// NOTE: Stripe does not settle in TND (Tunisian Dinar) for standard accounts.
// For a Tunisia-based production deployment, swap the Stripe client for a
// TND-capable local gateway (Flouci, Konnect, Paymee) before going live.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripeClient();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string; payment_intent: string | null };

    // Find the payment by Stripe session ID
    const paymentSnap = await firestore.collection('payments').where('stripeSessionId', '==', session.id).limit(1).get();
    if (!paymentSnap.empty) {
      const paymentDoc = paymentSnap.docs[0];
      const payment = paymentDoc.data();

      // Idempotent: re-delivered webhook for an already-paid payment is a no-op.
      if (payment.status !== 'PAID') {
        const batch = firestore.batch();
        batch.update(paymentDoc.ref, {
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId: session.payment_intent ?? null,
          parentNotifiedAt: null,
        });

        // Activate the enrollment if not already active
        const enrollmentSnap = await firestore
          .collection('enrollments')
          .where('__name__', '==', payment.enrollmentId)
          .limit(1)
          .get();
        if (!enrollmentSnap.empty && enrollmentSnap.docs[0].data().status !== 'ACTIVE') {
          batch.update(enrollmentSnap.docs[0].ref, { status: 'ACTIVE' });
        }

        await batch.commit();
      }
    }
  }

  return NextResponse.json({ received: true });
}
