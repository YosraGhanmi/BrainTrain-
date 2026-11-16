import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
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
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      payment_intent: string | null;
      payment_status?: string;
      amount_total?: number | null;
      currency?: string | null;
      metadata?: { paymentId?: string } | null;
    };

    // The checkout the parent last opened, or failing that the payment named
    // when the checkout was created (an earlier checkout for the same payment)
    const payment =
      (await prisma.payment.findUnique({ where: { stripeSessionId: session.id } })) ??
      (session.metadata?.paymentId ? await prisma.payment.findUnique({ where: { id: session.metadata.paymentId } }) : null);

    // Only money that actually arrived, for the amount that was due
    const settled =
      payment !== null &&
      session.payment_status === 'paid' &&
      session.amount_total === Math.round(Number(payment.amount) * 100) &&
      session.currency?.toLowerCase() === payment.currency.toLowerCase();
    if (payment && !settled) {
      console.error(`[stripe:webhook] checkout ${session.id} does not match payment ${payment.id}; left unpaid`);
    }

    // Idempotent: re-delivered webhook for an already-paid payment is a no-op.
    if (payment && settled && payment.status !== 'PAID') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: new Date(), stripeSessionId: session.id, stripePaymentIntentId: session.payment_intent ?? null, parentNotifiedAt: null },
        }),
        // Activate the enrollment if not already active
        prisma.enrollment.updateMany({
          where: { id: payment.enrollmentId, status: { not: 'ACTIVE' } },
          data: { status: 'ACTIVE' },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
