'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function AddTeacherDialog({
  children,
  defaultOpen = false,
  closeKey,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  // A value (e.g. the freshly generated secret code) that changes each time
  // the create-teacher action succeeds. The dialog is a client component
  // that survives the post-submit redirect (same instance, new
  // searchParams), so `defaultOpen` alone can't tell it to close — its
  // `false` value after a success is indistinguishable from its `false`
  // value before the dialog was ever opened.
  closeKey?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
    else if (closeKey) setOpen(false);
  }, [defaultOpen, closeKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
      >
        <Plus className="h-4 w-4" />
        Add teacher
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink">Add teacher</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone transition hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
