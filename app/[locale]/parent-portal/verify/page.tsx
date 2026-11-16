import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { verifyParentTwoFactor } from '@/lib/portal-auth/actions';
import { verifyPendingParentToken, PENDING_PARENT_COOKIE_NAME } from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import BrandedAuthPanel from '@/components/portal/BrandedAuthPanel';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { AppLocale } from '@/i18n/routing';

// Reads the session cookie / URL parameters on every request
export const dynamic = 'force-dynamic';

// Second step of signing in for parents who turned on two-factor
// authentication: the code emailed after the password was accepted.
export default async function ParentVerifyPage(
  props: {
    params: Promise<{ locale: AppLocale }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const userId = verifyPendingParentToken((await cookies()).get(PENDING_PARENT_COOKIE_NAME)?.value);
  if (!userId) redirect(localizedPath(params.locale, '/parent-portal/login'));
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.verify' });

  return (
    <BrandedAuthPanel
      eyebrow={t('eyebrow')}
      title={t('title')}
      backHref="/parent-portal/login"
      backLabel={t('backToLogin')}
      heading={[t('headingTop'), t('headingAccent')]}
      tagline={t('tagline')}
    >
      <p className="mt-6 text-sm text-stone">{t('body')}</p>

      <form action={verifyParentTwoFactor} className="mt-8 space-y-7">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-2">
          <label htmlFor="parent-verify-code" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
            {t('code')}
          </label>
          <input
            id="parent-verify-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 text-center text-2xl font-bold tracking-[0.4em] text-ink outline-none transition focus:border-accent"
          />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">{t('incorrectCode')}</p> : null}

        <PendingSubmitButton
          className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
        >
          {t('confirm')}
        </PendingSubmitButton>
      </form>
    </BrandedAuthPanel>
  );
}
