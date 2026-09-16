import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import { sendSms } from '@/lib/sms/send';
import { flipOverduePayments } from '@/lib/firebase/enrollments';

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
  const paymentsSnap = await firestore
    .collection('payments')
    .where('status', 'in', ['PENDING', 'OVERDUE'])
    .where('dueDate', '<=', windowEnd)
    .get();

  let sent = 0;
  let failed = 0;

  for (const doc of paymentsSnap.docs) {
    const payment = doc.data();
    // Resolve child → parent chain
    const enrollmentDoc = await firestore.collection('enrollments').doc(String(payment.enrollmentId)).get();
    const childId = enrollmentDoc.data()?.childId as string | undefined;
    if (!childId) continue;

    const childDoc = await firestore.collection('children').doc(childId).get();
    const parentId = childDoc.data()?.parentId as string | undefined;
    if (!parentId) continue;

    const parentDoc = await firestore.collection('users').doc(parentId).get();
    const phone = String(parentDoc.data()?.phone ?? '');
    if (!phone) continue;

    const isOverdue = payment.status === 'OVERDUE';
    const dueDate = payment.dueDate?.toDate?.() ?? new Date(payment.dueDate ?? 0);
    const message = isOverdue
      ? `BrainTrain: your payment of ${payment.amount} ${payment.currency} is overdue. Please pay via the parent portal to avoid interruption.`
      : `BrainTrain: your payment of ${payment.amount} ${payment.currency} is due soon (${dueDate.toDateString()}). Pay via the parent portal.`;

    try {
      await sendSms({
        parentId,
        phone,
        message,
        purpose: 'PAYMENT_REMINDER',
        relatedPaymentId: doc.id,
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ flipped, checked: paymentsSnap.size, sent, failed });
}
