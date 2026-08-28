import { requireParent } from '@/lib/portal-auth/guard';
import { changePhone, changePassword } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { saved?: string; error?: string };
}) {
  const parent = await requireParent(params.locale);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="font-display text-3xl font-bold text-ink">Account settings</h1>

      {searchParams.saved ? <p className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Saved.</p> : null}
      {searchParams.error === 'phone-taken' ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">That phone number is already in use.</p>
      ) : searchParams.error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">Please check the form and try again.</p>
      ) : null}

      <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
        <h2 className="font-display text-lg font-bold text-ink">Phone number</h2>
        <form action={changePhone} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="locale" value={params.locale} />
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-semibold text-stone">New phone number</label>
            <input
              name="phone"
              type="tel"
              required
              defaultValue={parent.phone}
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
            />
          </div>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            Update
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
        <h2 className="font-display text-lg font-bold text-ink">Password</h2>
        <form action={changePassword} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={params.locale} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">Current password</label>
            <PasswordInput name="currentPassword" autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">New password</label>
            <PasswordInput name="newPassword" autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">Confirm new password</label>
            <PasswordInput name="confirmPassword" autoComplete="new-password" />
          </div>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            Change password
          </button>
        </form>
      </section>
    </div>
  );
}
