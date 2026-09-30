'use client';

import { useState, type ReactNode } from 'react';
import { Plus, X } from 'lucide-react';

// A toolbar row with an "Add …" button that reveals a form panel below it.
// `toolbar` sits on the left of the same row (e.g. the month switcher).
export default function RevealForm({
  buttonLabel,
  toolbar,
  defaultOpen = false,
  children,
}: {
  buttonLabel: string;
  toolbar?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {toolbar ?? <span />}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
            open ? 'border border-ink/10 bg-white text-ink hover:bg-slate-100' : 'bg-ink text-white hover:bg-accent'
          }`}
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? 'Close' : buttonLabel}
        </button>
      </div>

      {open ? (
        <div className="mt-4 animate-[step-in_300ms_ease-out] rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          {children}
        </div>
      ) : null}
    </>
  );
}
