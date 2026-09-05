import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTeacherSecretCode } from '@/lib/portal-auth/actions';
import { verifyPendingTeacherToken, PENDING_TEACHER_COOKIE_NAME } from '@/lib/portal-auth/session';
import { localizedPath } from '@/lib/portal-auth/guard';
import AuthCard from '@/components/portal/AuthCard';
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
    <AuthCard eyebrow="Teacher Portal" title="Enter your code">
      <p className="mt-2 text-sm text-stone">
        Enter the 4-digit secret code your admin gave you along with your password.
      </p>

      <form action={verifyTeacherSecretCode} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">Secret code</label>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            required
            autoFocus
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-accent"
          />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">Incorrect code. Try again.</p> : null}

        <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          Confirm
        </button>
      </form>

      <a href={localizedPath(params.locale, '/teacher/login')} className="mt-6 block text-center text-sm text-stone transition hover:text-ink">
        ← Back to login
      </a>
    </AuthCard>
  );
}
