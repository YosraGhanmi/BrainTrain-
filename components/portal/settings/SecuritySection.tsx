import { ShieldCheck, ShieldOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { changePassword, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import type { AppLocale } from '@/i18n/routing';

export default async function SecuritySection({
  locale,
  twoFactorEnabled,
  verifying2fa,
}: {
  locale: AppLocale;
  twoFactorEnabled: boolean;
  verifying2fa: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'parentPortal.security' });
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink">{t('password')}</h2>
        <p className="mt-1 text-sm text-stone">{t('passwordHint')}</p>
        <form action={changePassword} className="mt-5 max-w-sm space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">{t('currentPassword')}</label>
            <PasswordInput name="currentPassword" autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">{t('newPassword')}</label>
            <PasswordInput name="newPassword" autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone">{t('confirmNewPassword')}</label>
            <PasswordInput name="confirmPassword" autoComplete="new-password" />
          </div>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            {t('changePassword')}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-stone'}`}>
            {twoFactorEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{t('twoFactor')}</h2>
            <p className="mt-1 text-sm text-stone">{twoFactorEnabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-600">{t('comingSoon')}</p>
          </div>
        </div>

        <div className="mt-5 max-w-sm">
          {twoFactorEnabled ? (
            <form action={disableTwoFactor} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="text-sm font-semibold text-stone">{t('confirmToTurnOff')}</label>
              <PasswordInput name="currentPassword" autoComplete="current-password" />
              <button type="submit" className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-red-300 hover:text-red-600">
                {t('turnOff')}
              </button>
            </form>
          ) : verifying2fa ? (
            <form action={confirmTwoFactorEnable} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="text-sm font-semibold text-stone">{t('enterCode')}</label>
              <input
                name="code"
                inputMode="numeric"
                maxLength={6}
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 tracking-[0.4em] outline-none focus:border-accent"
                placeholder="000000"
              />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                {t('verifyAndEnable')}
              </button>
            </form>
          ) : (
            <form action={requestTwoFactorEnable}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                {t('activate')}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
