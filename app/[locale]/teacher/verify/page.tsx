import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTeacherSecretCode } from '@/lib/portal-auth/actions';
import { verifyPendingTeacherToken, PENDING_TEACHER_COOKIE_NAME } from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import BrandedAuthPanel from '@/components/portal/BrandedAuthPanel';
import type { AppLocale } from '@/i18n/routing';

export default function TeacherVerifyPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  const userId = verifyPendingTeacherToken(cookies().get(PENDING_TEACHER_COOKIE_NAME)?.value);
  if (!userId) {
    redirect(localizedPath(params.locale, '/teacher/login'));
  }

  return (
    <BrandedAuthPanel
      eyebrow="BrainTrain Teacher"
      title="Enter your code"
      backHref="/teacher/login"
      backLabel="Back to login"
      heading={['One more', 'step to go!']}
      tagline="A quick 4-digit code keeps your students' notes and grades secure."
    >
      <p className="mt-6 text-sm text-stone">Enter the 4-digit secret code your admin gave you along with your password.</p>

      <form action={verifyTeacherSecretCode} className="mt-8 space-y-7">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Secret code</label>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            required
            autoFocus
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] text-ink outline-none transition focus:border-accent"
          />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">Incorrect code. Try again.</p> : null}

        <button
          type="submit"
          className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
        >
          Confirm
        </button>
      </form>
    </BrandedAuthPanel>
  );
}
