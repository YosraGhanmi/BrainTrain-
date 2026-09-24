import { TrendingUp } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createEarning, deleteEarning } from '@/lib/admin/earnings';
import { listFirebaseEarningsBetween } from '@/lib/firebase/earnings';
import { firestore } from '@/lib/firebase/admin';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { monthNav } from '@/lib/admin/month';
import LedgerPage, { type LedgerRow } from '@/components/admin/LedgerPage';

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = { CASH: 'Cash', CHEQUE: 'Cheque', CARD: 'Card' };

// Tuition payments marked PAID in the month, shown read-only next to the
// manual entries so this page adds up to the dashboard's "Total earnings".
async function listPaidTuitionRows(monthStart: Date, monthEnd: Date): Promise<LedgerRow[]> {
  const snapshot = await firestore
    .collection('payments')
    .where('status', '==', 'PAID')
    .where('paidAt', '>=', monthStart)
    .where('paidAt', '<', monthEnd)
    .get();

  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const [enrollmentDoc, planDoc] = await Promise.all([
        firestore.collection('enrollments').doc(String(data.enrollmentId ?? '')).get(),
        firestore.collection('payment_plans').doc(String(data.paymentPlanId ?? '')).get(),
      ]);
      const childId = String(enrollmentDoc.data()?.childId ?? '');
      const sessionId = String(enrollmentDoc.data()?.courseSessionId ?? '');
      const [childDoc, sessionDoc] = await Promise.all([
        childId ? firestore.collection('children').doc(childId).get() : null,
        sessionId ? firestore.collection('course_sessions').doc(sessionId).get() : null,
      ]);

      let courseTitle: string | null = null;
      try {
        courseTitle = getCourseEntryOrThrow(String(sessionDoc?.data()?.courseSlug ?? '')).title.en;
      } catch {
        courseTitle = null;
      }

      const method = String(planDoc.data()?.method ?? '');
      return {
        id: `payment-${doc.id}`,
        date: data.paidAt?.toDate?.() ?? new Date(),
        label: String(childDoc?.data()?.fullName ?? 'Tuition payment'),
        amount: Number(data.amount ?? 0),
        currency: String(data.currency ?? 'TND'),
        createdByName: method === 'CARD' ? 'Online' : 'Front desk',
        note: [courseTitle, METHOD_LABELS[method]].filter(Boolean).join(', ') || null,
        source: 'Tuition',
      };
    }),
  );
}

export default async function AdminEarningsPage(props: {
  searchParams: Promise<{ saved?: string; error?: string; month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await requireAdmin();
  const canDelete = session.kind === 'admin';

  const month = monthNav(searchParams.month);
  const [earnings, tuitionRows] = await Promise.all([
    listFirebaseEarningsBetween(month.monthStart, month.monthEnd),
    listPaidTuitionRows(month.monthStart, month.monthEnd),
  ]);

  const manualRows: LedgerRow[] = earnings.map((e) => ({
    ...e,
    source: 'Manual',
    deleteAction: canDelete ? deleteEarning.bind(null, e.id) : undefined,
  }));
  const rows = [...manualRows, ...tuitionRows].sort((a, b) => b.date.getTime() - a.date.getTime());
  const currency = rows[0]?.currency ?? 'TND';

  return (
    <LedgerPage
      title="Earnings"
      description="Income for the month: paid tuition is added automatically, anything else can be logged here."
      basePath="/admin/earnings"
      icon={TrendingUp}
      tone="emerald"
      rows={rows}
      currency={currency}
      month={month}
      saved={Boolean(searchParams.saved)}
      error={Boolean(searchParams.error)}
      createAction={createEarning}
      labelPlaceholder="e.g. Workshop fees, sponsorship..."
      addLabel="Add earning"
      emptyLabel="No earnings for this month."
      showSource
    />
  );
}
