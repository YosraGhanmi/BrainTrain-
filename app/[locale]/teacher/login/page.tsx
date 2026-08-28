import { loginTeacher } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import AuthCard from '@/components/portal/AuthCard';
import type { AppLocale } from '@/i18n/routing';

export default function TeacherLoginPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  return (
    <AuthCard eyebrow="Teacher Portal" title="Sign in">
      <form action={loginTeacher} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">Email</label>
          <input name="email" type="email" required autoFocus className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">Password</label>
          <PasswordInput name="password" autoComplete="current-password" />
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">Incorrect email or password.</p> : null}

        <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone">Teacher accounts are created by BrainTrain staff.</p>
    </AuthCard>
  );
}
