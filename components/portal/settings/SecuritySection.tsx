import { ShieldCheck, ShieldOff } from 'lucide-react';
import { changePassword, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import type { AppLocale } from '@/i18n/routing';

export default function SecuritySection({
  locale,
  twoFactorEnabled,
  verifying2fa,
}: {
  locale: AppLocale;
  twoFactorEnabled: boolean;
  verifying2fa: boolean;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
        <h2 className="font-display text-lg font-bold text-ink">Password</h2>
        <p className="mt-1 text-sm text-stone">Changing your password signs you out everywhere else.</p>
        <form action={changePassword} className="mt-5 max-w-sm space-y-4">
          <input type="hidden" name="locale" value={locale} />
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

      <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-stone'}`}>
            {twoFactorEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-stone">
              {twoFactorEnabled
                ? 'Enabled — a 6-digit code is emailed to you as an extra check.'
                : 'Add an extra layer of security. A 6-digit code will be emailed to you to confirm sign-ins.'}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
              Coming soon — not yet required at login.
            </p>
          </div>
        </div>

        <div className="mt-5 max-w-sm">
          {twoFactorEnabled ? (
            <form action={disableTwoFactor} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="text-sm font-semibold text-stone">Confirm your password to turn this off</label>
              <PasswordInput name="currentPassword" autoComplete="current-password" />
              <button type="submit" className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-red-300 hover:text-red-600">
                Turn off
              </button>
            </form>
          ) : verifying2fa ? (
            <form action={confirmTwoFactorEnable} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="text-sm font-semibold text-stone">Enter the 6-digit code we emailed you</label>
              <input
                name="code"
                inputMode="numeric"
                maxLength={6}
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 tracking-[0.4em] outline-none focus:border-accent"
                placeholder="000000"
              />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                Verify & enable
              </button>
            </form>
          ) : (
            <form action={requestTwoFactorEnable}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                Activate two-factor authentication
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
