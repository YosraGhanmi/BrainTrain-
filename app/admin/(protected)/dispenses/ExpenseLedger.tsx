import { Landmark, Wallet } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createExpense, deleteExpense } from '@/lib/admin/expenses';
import { listDbExpenses, type ExpenseChargeType } from '@/lib/db/expenses';
import { monthNav } from '@/lib/admin/month';
import LedgerPage from '@/components/admin/LedgerPage';

const COPY = {
  FIXED: {
    title: 'Fixed charges',
    description: 'Recurring costs, e.g. rent, salaries, subscriptions.',
    basePath: '/admin/dispenses/fixed',
    icon: Landmark,
    tone: 'blue',
    labelPlaceholder: 'e.g. Rent, salaries...',
  },
  VARIABLE: {
    title: 'Variable charges',
    description: 'One-off or fluctuating costs, e.g. supplies, repairs.',
    basePath: '/admin/dispenses/variable',
    icon: Wallet,
    tone: 'amber',
    labelPlaceholder: 'e.g. Supplies, repairs...',
  },
} as const;

export default async function ExpenseLedger({
  chargeType,
  searchParams,
}: {
  chargeType: ExpenseChargeType;
  searchParams: { saved?: string; error?: string; month?: string };
}) {
  const session = await requireAdmin();
  const canDelete = session.kind === 'admin';
  const copy = COPY[chargeType];

  const month = monthNav(searchParams.month);
  const allExpenses = await listDbExpenses();
  const expenses = allExpenses.filter(
    (e) => e.chargeType === chargeType && e.date >= month.monthStart && e.date < month.monthEnd,
  );
  const currency = expenses[0]?.currency ?? allExpenses[0]?.currency ?? 'TND';

  return (
    <LedgerPage
      {...copy}
      rows={expenses.map((e) => ({
        ...e,
        deleteAction: canDelete ? deleteExpense.bind(null, e.id) : undefined,
      }))}
      currency={currency}
      month={month}
      saved={Boolean(searchParams.saved)}
      error={Boolean(searchParams.error)}
      createAction={createExpense}
      hiddenFields={{ chargeType }}
      addLabel={`Add ${copy.title.toLowerCase().replace(/s$/, '')}`}
      emptyLabel={`No ${copy.title.toLowerCase()} logged for this month.`}
    />
  );
}
