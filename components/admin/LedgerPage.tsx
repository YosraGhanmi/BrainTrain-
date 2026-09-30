import Link from 'next/link';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import RevealForm from '@/components/admin/RevealForm';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

// One month of a money ledger (fixed charges, variable charges, earnings):
// header with the month total, month switcher, add form and the entries table.

export type LedgerRow = {
  id: string;
  date: Date;
  label: string;
  amount: number;
  currency: string;
  createdByName: string;
  note: string | null;
  // Rows that come from elsewhere (e.g. paid tuition) are shown read-only
  source?: string;
  deleteAction?: (formData: FormData) => void;
};

const TONES = {
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
} as const;

const inputClassName =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';

export default function LedgerPage({
  title,
  description,
  basePath,
  icon: Icon,
  tone,
  rows,
  currency,
  month,
  saved,
  error,
  createAction,
  hiddenFields = {},
  labelPlaceholder,
  addLabel,
  emptyLabel,
  showSource = false,
}: {
  title: string;
  description: string;
  basePath: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  rows: LedgerRow[];
  currency: string;
  month: { monthLabel: string; prevMonthParam: string; nextMonthParam: string; isCurrentMonth: boolean };
  saved?: boolean;
  error?: boolean;
  createAction: (formData: FormData) => Promise<void>;
  hiddenFields?: Record<string, string>;
  labelPlaceholder: string;
  addLabel: string;
  emptyLabel: string;
  showSource?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const columnCount = showSource ? 7 : 6;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-stone">{description}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-3 shadow-soft">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Total this month</p>
            <p className="font-display text-xl font-black text-ink">
              {total.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      </div>

      {saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-600">Please fill in a label and a valid amount.</p> : null}

      {/* Form stays open after a failed save so the entry can be retried */}
      <RevealForm
        buttonLabel={addLabel}
        defaultOpen={Boolean(error)}
        toolbar={
          <div className="flex items-center gap-2">
            <Link
              href={`${basePath}?month=${month.prevMonthParam}`}
              aria-label="Previous month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <p className="text-sm font-semibold text-ink">
              {month.monthLabel}
              {month.isCurrentMonth ? <span className="ml-2 text-xs font-normal text-stone">(current)</span> : null}
            </p>
            <Link
              href={`${basePath}?month=${month.nextMonthParam}`}
              aria-label="Next month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        <form action={createAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Label</span>
            <input name="label" required autoFocus placeholder={labelPlaceholder} className={inputClassName} />
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

          <label className="block sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Note (optional)</span>
            <input name="note" placeholder="Any extra detail" className={inputClassName} />
          </label>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <PendingSubmitButton className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:w-auto">
              {addLabel}
            </PendingSubmitButton>
          </div>
        </form>
      </RevealForm>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Label</th>
              {showSource ? <th className="px-5 py-3">Source</th> : null}
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Logged by</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-5 py-6 text-center text-stone">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 text-stone">{row.date.toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{row.label}</td>
                  {showSource ? (
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-stone">{row.source ?? 'Manual'}</span>
                    </td>
                  ) : null}
                  <td className="px-5 py-4 font-semibold text-ink">
                    {row.amount.toFixed(2)} {row.currency}
                  </td>
                  <td className="px-5 py-4 text-stone">{row.createdByName}</td>
                  <td className="max-w-[12rem] truncate px-5 py-4 text-stone">{row.note ?? '-'}</td>
                  <td className="px-5 py-4 text-right">{row.deleteAction ? <DeleteIconButton action={row.deleteAction} /> : null}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
