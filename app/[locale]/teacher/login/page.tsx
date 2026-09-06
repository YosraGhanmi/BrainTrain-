import { loginTeacher } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import BrandedAuthPanel from '@/components/portal/BrandedAuthPanel';
import type { AppLocale } from '@/i18n/routing';

export default function TeacherLoginPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { error?: string };
}) {
  return (
    <BrandedAuthPanel
      eyebrow="BrainTrain Teacher"
      title="Sign in"
      backHref="/"
      backLabel="Return to website"
      heading={['Welcome', 'back, Teacher!']}
      tagline="Your classes, your students, their progress — all in one place."
    >
      <form action={loginTeacher} className="mt-12 space-y-7">
        <input type="hidden" name="locale" value={params.locale} />

        <div className="space-y-2">
          <label htmlFor="teacher-login-email" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
            Email
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
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Password</label>
          <PasswordInput name="password" autoComplete="current-password" />
        </div>

        {searchParams.error === 'frozen' ? (
          <p className="text-sm font-semibold text-red-600">This account has been suspended. Contact BrainTrain for help.</p>
        ) : searchParams.error ? (
          <p className="text-sm font-semibold text-red-600">Incorrect email or password.</p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone">Teacher accounts are created by BrainTrain staff.</p>
    </BrandedAuthPanel>
  );
}
