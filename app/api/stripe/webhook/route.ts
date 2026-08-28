import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getStripeClient } from '@/lib/payments/stripe';

// The one place in the app allowed to mark a Payment PAID from an online
// transaction — verifies Stripe's signature server-side rather than trusting
// the client-side redirect back from checkout.
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
    const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });

    // Idempotent: a re-delivered webhook for an already-paid payment is a no-op.
    if (payment && payment.status !== 'PAID') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: new Date(), stripePaymentIntentId: session.payment_intent ?? undefined },
        }),
        prisma.enrollment.updateMany({
          where: { id: payment.enrollmentId, status: { not: 'ACTIVE' } },
          data: { status: 'ACTIVE' },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
