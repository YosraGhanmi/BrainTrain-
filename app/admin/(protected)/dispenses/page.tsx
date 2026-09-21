import { Wallet, Landmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createExpense, deleteExpense } from '@/lib/admin/expenses';
import { listFirebaseExpenses, type FirebaseExpense, type ExpenseChargeType } from '@/lib/firebase/expenses';
import { monthNav } from '@/lib/admin/month';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const inputClassName =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';

function ExpenseSection({
  title,
  description,
  chargeType,
  icon: Icon,
  tone,
  expenses,
  total,
  currency,
  today,
  canDelete,
}: {
  title: string;
  description: string;
  chargeType: ExpenseChargeType;
  icon: typeof Wallet;
  tone: 'amber' | 'blue';
  expenses: FirebaseExpense[];
  total: number;
  currency: string;
  today: string;
  canDelete: boolean;
}) {
  const toneClasses = tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-stone">{description}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-2.5 shadow-soft">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone">Total this month</p>
            <p className="font-display text-lg font-black text-ink">
              {total.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      </div>

      <form action={createExpense} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="chargeType" value={chargeType} />

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Label</span>
          <input name="label" required placeholder="e.g. Rent, supplies..." className={inputClassName} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Amount</span>
          <input name="amount" type="number" min={0} step="0.01" required className={inputClassName} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Currency</span>
          <input name="currency" defaultValue="TND" required className={inputClassName} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Date</span>
          <input name="date" type="date" defaultValue={today} required className={inputClassName} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Category (optional)</span>
          <input name="category" placeholder="e.g. Utilities" className={inputClassName} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Note (optional)</span>
          <input name="note" placeholder="Any extra detail" className={inputClassName} />
        </label>

        <div className="flex items-end sm:col-span-2">
          <PendingSubmitButton
            className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:w-auto"
          >
            Add {title.toLowerCase()}
          </PendingSubmitButton>
        </div>
      </form>

      <div className="mt-5 max-h-[19rem] overflow-y-auto overflow-x-auto rounded-2xl border border-ink/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-ink/10 bg-white text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Logged by</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-stone">
                  No {title.toLowerCase()} logged for this month.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-4 text-stone">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-semibold text-ink">{e.label}</td>
                  <td className="px-4 py-4 text-stone">{e.category ?? '—'}</td>
                  <td className="px-4 py-4 font-semibold text-ink">
                    {Number(e.amount).toFixed(2)} {e.currency}
                  </td>
                  <td className="px-4 py-4 text-stone">{e.createdByName}</td>
                  <td className="max-w-[12rem] truncate px-4 py-4 text-stone">{e.note ?? '—'}</td>
                  <td className="px-4 py-4 text-right">
                    {canDelete ? <DeleteIconButton action={deleteExpense.bind(null, e.id)} /> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminDispensesPage(
  props: {
    searchParams: Promise<{ saved?: string; error?: string; month?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await requireAdmin();
  const canDelete = session.kind === 'admin';

  const { monthStart, monthEnd, monthLabel, prevMonthParam, nextMonthParam, isCurrentMonth } = monthNav(searchParams.month);

  const allExpenses = await listFirebaseExpenses();
  const monthExpenses = allExpenses.filter((e) => e.date >= monthStart && e.date < monthEnd);
  const fixedExpenses = monthExpenses.filter((e) => e.chargeType === 'FIXED');
  const variableExpenses = monthExpenses.filter((e) => e.chargeType === 'VARIABLE');

  const fixedTotal = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const variableTotal = variableExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = fixedTotal + variableTotal;

  const currency = monthExpenses[0]?.currency ?? allExpenses[0]?.currency ?? 'TND';
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Dispenses</h1>
          <p className="mt-1 text-sm text-stone">Fixed and variable expenses logged by the secretariat, kept as a running ledger.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-3 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Total this month</p>
            <p className="font-display text-xl font-black text-ink">
              {grandTotal.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start">
        <a
          href={`/admin/dispenses?month=${prevMonthParam}`}
          aria-label="Previous month"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
        <p className="text-sm font-semibold text-ink">
          {monthLabel}
          {isCurrentMonth ? <span className="ml-2 text-xs font-normal text-stone">(current)</span> : null}
        </p>
        <a
          href={`/admin/dispenses?month=${nextMonthParam}`}
          aria-label="Next month"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}
      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in a label and a valid amount.</p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ExpenseSection
          title="Fixed charges"
          description="Recurring costs, e.g. rent, salaries, subscriptions."
          chargeType="FIXED"
          icon={Landmark}
          tone="blue"
          expenses={fixedExpenses}
          total={fixedTotal}
          currency={currency}
          today={today}
          canDelete={canDelete}
        />
        <ExpenseSection
          title="Variable charges"
          description="One-off or fluctuating costs, e.g. supplies, repairs."
          chargeType="VARIABLE"
          icon={Wallet}
          tone="amber"
          expenses={variableExpenses}
          total={variableTotal}
          currency={currency}
          today={today}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
