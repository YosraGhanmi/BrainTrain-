import { Link } from '@/i18n/navigation';
import { requestPasswordResetOtp } from '@/lib/portal-auth/actions';
import AuthCard from '@/components/portal/AuthCard';
import type { AppLocale } from '@/i18n/routing';

export default function ForgotPasswordPage({ params }: { params: { locale: AppLocale } }) {
  return (
    <AuthCard eyebrow="Parent Portal" title="Reset your password">
      <p className="mt-3 text-sm text-stone">
        Enter the phone number on your account and we'll text you a reset code.
      </p>
      <form action={requestPasswordResetOtp} className="mt-8 space-y-5">
        <input type="hidden" name="locale" value={params.locale} />
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone">Phone number</label>
          <input name="phone" type="tel" required autoFocus className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 outline-none focus:border-accent" placeholder="+216 ..." />
        </div>
        <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          Send reset code
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone">
        <Link href="/parent-portal/login" className="font-semibold text-accent">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
