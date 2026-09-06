import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

// Static split-screen shell shared by the teacher auth pages, matching the
// branded look already used by /admin/login and the parent-portal sign-in
// screen (navy diagonal panel, orange accent, uppercase eyebrow) instead of
// the generic centered AuthCard.
export default function BrandedAuthPanel({
  eyebrow,
  title,
  backHref,
  backLabel,
  heading,
  tagline,
  children,
}: {
  eyebrow: string;
  title: string;
  backHref: string;
  backLabel: string;
  heading: [string, string];
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-screen w-full overflow-hidden bg-[#0b1a3a]">
      <div className="absolute inset-y-0 left-0 z-0 w-full bg-white lg:w-[calc(50%+6rem)]" />

      <div
        className="absolute inset-y-0 right-0 z-10 hidden w-[55%] flex-col items-center justify-center bg-[#0b1a3a] px-12 text-center lg:flex"
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#ff8c42]">BrainTrain</span>
        <h2 className="mt-5 font-display text-7xl font-bold leading-[0.95] text-white xl:text-8xl">
          {heading[0]}
          <br />
          <span className="text-[#ff8c42]">{heading[1]}</span>
        </h2>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-white/60">{tagline}</p>
      </div>

      <Link
        href={backHref}
        className="absolute left-8 top-8 z-30 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink sm:left-16"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="relative z-20 flex w-full items-center px-8 py-16 sm:px-16 lg:w-1/2 lg:pl-24">
        <div className="w-full max-w-md">
          <span className="block text-sm font-bold uppercase tracking-[0.3em] text-stone">{eyebrow}</span>
          <h1 className="mt-4 inline-block border-b-4 border-[#ff8c42] pb-3 font-display text-6xl font-bold text-ink">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
