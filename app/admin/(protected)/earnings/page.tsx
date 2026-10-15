import { TrendingUp } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createEarning, deleteEarning } from '@/lib/admin/earnings';
import { listDbEarningsBetween } from '@/lib/db/earnings';
import { prisma } from '@/lib/db/prisma';
import { listCourseEntries } from '@/lib/content/lookup';
import { monthNav } from '@/lib/admin/month';
import LedgerPage, { type LedgerRow } from '@/components/admin/LedgerPage';

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = { CASH: 'Cash', CHEQUE: 'Cheque', CARD: 'Card' };

// Tuition payments marked PAID in the month, shown read-only next to the
// manual entries so this page adds up to the dashboard's "Total earnings".
async function listPaidTuitionRows(monthStart: Date, monthEnd: Date): Promise<LedgerRow[]> {
  const rows = await prisma.payment.findMany({
    where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
    include: {
      paymentPlan: { select: { method: true } },
      enrollment: { select: { child: { select: { fullName: true } }, courseSession: { select: { courseSlug: true } } } },
    },
  });
  const courses = await listCourseEntries();
  const courseTitle = new Map(courses.map((c) => [c.slug, c.title.en]));

  return rows.map((row) => {
    const method = row.paymentPlan.method;
    const slug = row.enrollment.courseSession?.courseSlug;
    return {
      id: `payment-${row.id}`,
      date: row.paidAt ?? new Date(),
      label: row.enrollment.child?.fullName ?? 'Tuition payment',
      amount: Number(row.amount),
      currency: row.currency,
      createdByName: method === 'CARD' ? 'Online' : 'Front desk',
      note: [slug ? courseTitle.get(slug) : null, METHOD_LABELS[method]].filter(Boolean).join(', ') || null,
      source: 'Tuition',
    };
  });
}

export default async function AdminEarningsPage(props: {
  searchParams: Promise<{ saved?: string; error?: string; month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await requireAdmin();
  const canDelete = session.kind === 'admin';

  const month = monthNav(searchParams.month);
  const [earnings, tuitionRows] = await Promise.all([
    listDbEarningsBetween(month.monthStart, month.monthEnd),
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
