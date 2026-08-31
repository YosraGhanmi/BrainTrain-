import {
  changePhone,
  addSecondaryPhone,
  deleteSecondaryPhone,
  deletePrimaryPhone,
  updateBackupEmail,
  deleteBackupEmail,
} from '@/lib/portal-auth/actions';
import type { AppLocale } from '@/i18n/routing';

function Row({
  title,
  value,
  placeholder,
  children,
}: {
  title: string;
  value: string | null;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink/10 py-5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-sm text-stone">{value || placeholder}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditToggle({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group w-full sm:w-auto">
      <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50">
        {label}
      </summary>
      <div className="mt-4 w-full max-w-sm rounded-xl bg-slate-50 p-4">{children}</div>
    </details>
  );
}

export default function PersonalInfoSection({
  locale,
  phone,
  secondaryPhone,
  backupEmail,
}: {
  locale: AppLocale;
  phone: string;
  secondaryPhone: string | null;
  backupEmail: string | null;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
      <h2 className="font-display text-lg font-bold text-ink">Contact information</h2>
      <p className="mt-1 text-sm text-stone">Manage the phone numbers and backup email on your account.</p>

      <div className="mt-6">
        <Row title="Primary phone number" value={phone} placeholder="Not set">
          <div className="flex flex-wrap gap-2">
            <EditToggle label="Edit">
              <form action={changePhone} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="phone"
                  type="tel"
                  required
                  defaultValue={phone}
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  Save
                </button>
              </form>
            </EditToggle>
            <form action={deletePrimaryPhone}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                disabled={!secondaryPhone}
                title={secondaryPhone ? undefined : 'Add a secondary phone number first'}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition enabled:hover:border-red-300 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete
              </button>
            </form>
          </div>
        </Row>

        <Row title="Secondary phone number" value={secondaryPhone} placeholder="Not set">
          {secondaryPhone ? (
            <form action={deleteSecondaryPhone}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition hover:border-red-300 hover:text-red-600">
                Delete
              </button>
            </form>
          ) : (
            <EditToggle label="Add phone number">
              <form action={addSecondaryPhone} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="secondaryPhone"
                  type="tel"
                  required
                  placeholder="e.g. +216 20 000 000"
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  Save
                </button>
              </form>
            </EditToggle>
          )}
        </Row>

        <Row title="Backup email" value={backupEmail} placeholder="Not set">
          <div className="flex flex-wrap gap-2">
            <EditToggle label={backupEmail ? 'Edit' : 'Add backup email'}>
              <form action={updateBackupEmail} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input
                  name="backupEmail"
                  type="email"
                  required
                  defaultValue={backupEmail ?? ''}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent">
                  Save
                </button>
              </form>
            </EditToggle>
            {backupEmail ? (
              <form action={deleteBackupEmail}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-stone transition hover:border-red-300 hover:text-red-600">
                  Delete
                </button>
              </form>
            ) : null}
          </div>
        </Row>
      </div>
    </div>
  );
}
