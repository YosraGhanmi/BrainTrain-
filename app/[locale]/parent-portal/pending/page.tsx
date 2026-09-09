import { Link } from '@/i18n/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import type { AppLocale } from '@/i18n/routing';

export default function ParentPendingPage({ params }: { params: { locale: AppLocale } }) {
  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0b1a3a] px-5 py-20">
      <Link
        href="/"
        className="absolute left-4 top-4 z-30 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition hover:text-white xs:left-6 xs:top-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to website
      </Link>

      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ff8c42]/15">
          <Clock className="h-8 w-8 text-[#ff8c42]" />
        </div>

        <span className="mt-8 block text-sm font-bold uppercase tracking-[0.3em] text-[#ff8c42]">BrainTrain Parent</span>
        <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Account created!</h1>

        <p className="mt-6 text-lg leading-relaxed text-white/70">
          Thanks for signing up. An admin needs to review your account before you can log in — this usually doesn&apos;t
          take long.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-white/70">
          We&apos;ll email you as soon as it&apos;s approved, with a link to sign in.
        </p>

        <Link
          href="/parent-portal/login"
          className="mt-10 inline-block rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b1a3a] transition hover:bg-[#ff8c42] hover:text-white"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
