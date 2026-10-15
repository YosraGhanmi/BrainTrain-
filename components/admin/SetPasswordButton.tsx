'use client';

import { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

// Key icon that opens a small dialog to set a new password on an account
export default function SetPasswordButton({
  action,
  accountName,
  returnTo,
}: {
  action: (formData: FormData) => void;
  accountName: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Set new password"
        title="Set new password"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg border border-ink/10 p-1.5 text-stone transition hover:bg-slate-100 hover:text-ink"
      >
        <LockKeyhole className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <form action={action} className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-6 text-left shadow-soft">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Set new password</h2>
                <p className="mt-1 text-sm text-stone">
                  For {accountName}. They&apos;re signed out everywhere; give them the new password.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone transition hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <input
                name="password"
                type="text"
                placeholder="At least 8 characters"
                minLength={8}
                required
                autoComplete="off"
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <PendingSubmitButton className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                Save password
              </PendingSubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
