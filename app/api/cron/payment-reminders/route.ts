import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendSms } from '@/lib/sms/send';

const REMINDER_WINDOW_DAYS = 3;

// No cron infra exists in this project — this endpoint is meant to be hit by
// an external scheduler (Vercel Cron, a system cron job, GitHub Actions,
// etc.) on e.g. a daily schedule, authenticated with a shared secret header
// rather than a user session.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Flip anything past its due date from PENDING to OVERDUE first, so the
  // reminder query below (and /admin/payments) reflects current state.
  await prisma.payment.updateMany({
    where: { status: 'PENDING', dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  });

  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const duePayments = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lte: windowEnd },
    },
    include: {
      paymentPlan: { include: { enrollment: { include: { child: { include: { parent: { include: { user: true } } } } } } } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const payment of duePayments) {
    const parent = payment.paymentPlan.enrollment.child.parent;
    const isOverdue = payment.status === 'OVERDUE';
    const message = isOverdue
      ? `BrainTrain: your payment of ${payment.amount} ${payment.currency} is overdue. Please pay via the parent portal to avoid interruption.`
      : `BrainTrain: your payment of ${payment.amount} ${payment.currency} is due soon (${payment.dueDate.toDateString()}). Pay via the parent portal.`;

    try {
      await sendSms({
        parentId: parent.id,
        phone: parent.user.phone,
        message,
        purpose: 'PAYMENT_REMINDER',
        relatedPaymentId: payment.id,
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ checked: duePayments.length, sent, failed });
}
