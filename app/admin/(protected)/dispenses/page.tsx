import { Wallet } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { createExpense, deleteExpense } from '@/lib/admin/expenses';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

const inputClassName =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';

export default async function AdminDispensesPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const session = await requireAdmin();
  const canDelete = session.kind === 'admin';

  const [expenses, totalResult] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: 'desc' } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const total = Number(totalResult._sum.amount ?? 0);
  const currency = expenses[0]?.currency ?? 'TND';
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Dispenses</h1>
          <p className="mt-1 text-sm text-stone">Expenses logged by the secretariat, kept as a running ledger.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-3 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Total dispenses</p>
            <p className="font-display text-xl font-black text-ink">
              {total.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      </div>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}
      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in a label and a valid amount.</p>
      ) : null}

      <form
        action={createExpense}
        className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:grid-cols-2 sm:p-6 lg:grid-cols-4"
      >
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

        <label className="block sm:col-span-2 lg:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Note (optional)</span>
          <input name="note" placeholder="Any extra detail" className={inputClassName} />
        </label>

        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:w-auto"
          >
            Add dispense
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Label</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Logged by</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-stone">
                  No dispenses logged yet.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 text-stone">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{e.label}</td>
                  <td className="px-5 py-4 text-stone">{e.category ?? '—'}</td>
                  <td className="px-5 py-4 font-semibold text-ink">
                    {Number(e.amount).toFixed(2)} {e.currency}
                  </td>
                  <td className="px-5 py-4 text-stone">{e.createdByName}</td>
                  <td className="max-w-[16rem] truncate px-5 py-4 text-stone">{e.note ?? '—'}</td>
                  <td className="px-5 py-4 text-right">
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
