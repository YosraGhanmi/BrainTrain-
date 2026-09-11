import { getTranslations } from 'next-intl/server';
import { confirmPasswordReset } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import AuthCard from '@/components/portal/AuthCard';
import type { AppLocale } from '@/i18n/routing';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { phone?: string; error?: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.resetPassword' });
  return (
    <AuthCard eyebrow={t('eyebrow')} title={t('title')}>
      <p className="mt-3 text-sm text-stone">
        {t('body', { phone: searchParams.phone ?? t('yourPhone') })}
      </p>
      <form action={confirmPasswordReset} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={params.locale} />
        <input type="hidden" name="phone" value={searchParams.phone ?? ''} />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('resetCode')}</label>
          <input name="code" required maxLength={6} autoFocus className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 text-center text-2xl tracking-[0.5em] outline-none focus:border-accent" placeholder="000000" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('newPassword')}</label>
          <PasswordInput name="newPassword" autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">{t('confirmNewPassword')}</label>
          <PasswordInput name="confirmPassword" autoComplete="new-password" />
        </div>

        {searchParams.error ? (
          <p className="text-sm font-semibold text-red-600">{t('error')}</p>
        ) : null}

        <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          {t('submit')}
        </button>
      </form>
    </AuthCard>
  );
}
