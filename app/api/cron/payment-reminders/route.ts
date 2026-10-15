import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendSms } from '@/lib/sms/send';
import { flipOverduePayments } from '@/lib/db/enrollments';

const REMINDER_WINDOW_DAYS = 3;

// No cron infra exists in this project — this endpoint is meant to be hit by
// an external scheduler (OVH cron, GitHub Actions, etc.) on a daily schedule,
// authenticated with a shared secret header rather than a user session.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Flip anything past its due date from PENDING to OVERDUE
  const flipped = await flipOverduePayments();

  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Find payments due within the reminder window (or already overdue)
  const payments = await prisma.payment.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lte: windowEnd } },
    include: { enrollment: { select: { child: { select: { parent: { select: { id: true, phone: true } } } } } } },
  });

  let sent = 0;
  let failed = 0;

  for (const payment of payments) {
    const parent = payment.enrollment.child?.parent;
    if (!parent?.phone) continue;
    const parentId = parent.id;
    const phone = parent.phone;

    const amount = Number(payment.amount);
    const message =
      payment.status === 'OVERDUE'
        ? `BrainTrain: your payment of ${amount} ${payment.currency} is overdue. Please pay via the parent portal to avoid interruption.`
        : `BrainTrain: your payment of ${amount} ${payment.currency} is due soon (${payment.dueDate.toDateString()}). Pay via the parent portal.`;

    try {
      await sendSms({
        parentId,
        phone,
        message,
        purpose: 'PAYMENT_REMINDER',
        relatedPaymentId: payment.id,
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ flipped, checked: payments.length, sent, failed });
}
