import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { changeTeacherPassword } from '@/lib/portal-auth/actions';
import { getPortalSessionUser } from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import BrandedAuthPanel from '@/components/portal/BrandedAuthPanel';
import PasswordInput from '@/components/portal/PasswordInput';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { AppLocale } from '@/i18n/routing';

// Reads the session cookie / URL parameters on every request
export const dynamic = 'force-dynamic';

// Where a teacher lands while still on the password staff picked for them
// (see requireTeacher): the portal opens once they have chosen their own.
export default async function TeacherChangePasswordPage(
  props: {
    params: Promise<{ locale: AppLocale }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const user = await getPortalSessionUser();
  if (!user || user.role !== 'TEACHER') redirect(localizedPath(params.locale, '/teacher/login'));
  if (!user.mustChangePassword) redirect(localizedPath(params.locale, '/teacher'));
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.changePassword' });

  return (
    <BrandedAuthPanel
      eyebrow={t('eyebrow')}
      title={t('title')}
      backHref="/teacher/login"
      backLabel={t('backToLogin')}
      heading={[t('headingTop'), t('headingAccent')]}
      tagline={t('tagline')}
    >
      <p className="mt-6 text-sm text-stone">{t('body')}</p>

      <form action={changeTeacherPassword} className="mt-8 space-y-7">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">{t('newPassword')}</label>
          <PasswordInput name="newPassword" autoComplete="new-password" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">{t('confirmPassword')}</label>
          <PasswordInput name="confirmPassword" autoComplete="new-password" />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">{t('error')}</p> : null}

        <PendingSubmitButton
          className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
        >
          {t('submit')}
        </PendingSubmitButton>
      </form>
    </BrandedAuthPanel>
  );
}
