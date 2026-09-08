'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { acknowledgePaymentConfirmation } from '@/lib/payments/actions';
import type { AppLocale } from '@/i18n/routing';

export default function PaymentConfirmedModal({
  paymentId,
  locale,
  courseTitle,
  amount,
  currency,
}: {
  paymentId: string;
  locale: AppLocale;
  courseTitle: string;
  amount: number;
  currency: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 text-center shadow-soft sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">Payment confirmed!</h2>
        <p className="mt-2 text-sm text-stone">
          Your payment of {amount} {currency} for {courseTitle} has been confirmed. Your child is all set!
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            startTransition(() => {
              acknowledgePaymentConfirmation(paymentId, locale);
            });
          }}
          className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-bold text-white transition hover:bg-accent"
        >
          Great, thanks!
        </button>
      </div>
    </div>
  );
}
