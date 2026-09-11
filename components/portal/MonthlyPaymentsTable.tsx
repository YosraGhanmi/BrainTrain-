'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { payNow } from '@/lib/payments/actions';
import { formatDate } from '@/lib/i18n/format';
import type { AppLocale } from '@/i18n/routing';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

export type MonthlyPaymentRow = {
  id: string;
  courseTitle: string;
  plan?: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string, locale: AppLocale): string {
  const [year, month] = key.split('-').map(Number);
  return formatDate(new Date(year, month - 1, 1), locale, { month: 'long', year: 'numeric' });
}

export default function MonthlyPaymentsTable({
  payments,
  childId,
  locale,
  showPlan = false,
}: {
  payments: MonthlyPaymentRow[];
  childId: string;
  locale: AppLocale;
  showPlan?: boolean;
}) {
  const t = useTranslations('parentPortal.payments');
  const byMonth = useMemo(() => {
    const map = new Map<string, MonthlyPaymentRow[]>();
    for (const payment of payments) {
      const key = monthKey(new Date(payment.dueDate));
      const bucket = map.get(key);
      if (bucket) bucket.push(payment);
      else map.set(key, [payment]);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }
    return map;
  }, [payments]);

  const months = useMemo(() => Array.from(byMonth.keys()).sort((a, b) => (a < b ? 1 : -1)), [byMonth]);

  const currentKey = monthKey(new Date());
  const defaultIndex = useMemo(() => {
    const idx = months.indexOf(currentKey);
    if (idx !== -1) return idx;
    const nextIdx = months.findIndex((key) => key < currentKey);
    return nextIdx === -1 ? 0 : nextIdx;
  }, [months, currentKey]);

  const [index, setIndex] = useState(defaultIndex);

  if (months.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">{t('empty')}</p>
    );
  }

  const activeKey = months[Math.min(index, months.length - 1)];
  const activePayments = byMonth.get(activeKey) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(i + 1, months.length - 1))}
          disabled={index >= months.length - 1}
          aria-label={t('previousMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg font-bold text-ink">{monthLabel(activeKey, locale)}</p>
          {activeKey === currentKey ? (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
              {t('current')}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index <= 0}
          aria-label={t('nextMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">{t('course')}</th>
              {showPlan ? <th className="px-5 py-3">{t('plan')}</th> : null}
              <th className="px-5 py-3">{t('amount')}</th>
              <th className="px-5 py-3">{t('due')}</th>
              <th className="px-5 py-3">{t('status')}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {activePayments.map((payment) => (
              <tr key={payment.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">{payment.courseTitle}</td>
                {showPlan ? <td className="px-5 py-4 text-stone">{payment.plan}</td> : null}
                <td className="px-5 py-4 text-stone">
                  {payment.amount} {payment.currency}
                </td>
                <td className="px-5 py-4 text-stone">{formatDate(payment.dueDate, locale)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[payment.status]}`}>
                    {t(`statuses.${payment.status}`)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {payment.status !== 'PAID' ? (
                    <form action={payNow}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input type="hidden" name="childId" value={childId} />
                      <button
                        type="submit"
                        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
                      >
                        {t('payNow')}
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
