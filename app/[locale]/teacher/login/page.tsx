import { getTranslations } from 'next-intl/server';
import { loginTeacher } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import BrandedAuthPanel from '@/components/portal/BrandedAuthPanel';
import type { AppLocale } from '@/i18n/routing';

export default async function TeacherLoginPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.login' });
  return (
    <BrandedAuthPanel
      eyebrow={t('eyebrow')}
      title={t('signIn')}
      backHref="/"
      backLabel={t('returnToWebsite')}
      heading={[t('welcome'), t('welcomeAccent')]}
      tagline={t('tagline')}
    >
      <form action={loginTeacher} className="mt-12 space-y-7">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-2">
          <label htmlFor="teacher-login-email" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
            {t('email')}
          </label>
          <input
            id="teacher-login-email"
            name="email"
            type="email"
            required
            autoFocus
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 text-base text-ink outline-none transition focus:border-accent"
            placeholder="you@braintrain.tn"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">{t('password')}</label>
          <PasswordInput name="password" autoComplete="current-password" />
        </div>

        {searchParams.error === 'frozen' ? (
          <p className="text-sm font-semibold text-red-600">{t('accountSuspended')}</p>
        ) : searchParams.error ? (
          <p className="text-sm font-semibold text-red-600">{t('incorrectCredentials')}</p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
        >
          {t('logIn')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone">{t('accountsCreatedByStaff')}</p>
    </BrandedAuthPanel>
  );
}
