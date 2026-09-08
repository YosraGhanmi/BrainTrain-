import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { logoutPortal } from '@/lib/portal-auth/actions';
import { LogOut, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PortalNavLinks from '@/components/portal/PortalNavLinks';
import PortalShellChrome from '@/components/portal/PortalShellChrome';
import TextMorph from '@/components/text/TextMorph';
import AdminBackground from '@/components/admin/AdminBackground';

export default function PortalShell({
  homeHref,
  brandLabel,
  fullName,
  email,
  settingsHref,
  navLinks,
  loginHref,
  childSwitcher,
  theme = 'dark',
  children,
}: {
  homeHref: string;
  brandLabel: string;
  fullName: string;
  email: string;
  settingsHref?: string;
  navLinks: { label: string; href: string; icon?: LucideIcon }[];
  loginHref: string;
  childSwitcher?: { children: { id: string; fullName: string }[]; selectedChildId: string };
  theme?: 'dark' | 'light';
  children: React.ReactNode;
}) {
  const isLight = theme === 'light';

  const logoBlock = (
    <>
      {isLight ? (
        <Link href={homeHref} className="relative block h-10 w-full">
          <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill className="object-contain object-left" />
        </Link>
      ) : (
        <Link href={homeHref} className="block h-10 w-full">
          <TextMorph
            words="Train,Brain"
            color="#ffffff"
            font={{
              fontFamily: 'var(--font-comfortaa)',
              fontWeight: 700,
              fontSize: 30,
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              textAlign: 'left',
            }}
            transition={{ duration: 0.4, delay: 2, ease: 'easeInOut' }}
          />
        </Link>
      )}
      <p className={`mt-2 text-xs font-semibold uppercase tracking-wide ${isLight ? 'text-stone/70' : 'text-white/70'}`}>
        {brandLabel}
      </p>
    </>
  );

  const navLinksBlock = (
    <PortalNavLinks
      theme={theme}
      navLinks={navLinks.map(({ label, href, icon: Icon }) => ({
        label,
        href,
        icon: Icon ? <Icon className="h-4 w-4" /> : null,
      }))}
    />
  );

  const footerBlock = (
    <div className={`mt-auto space-y-1 border-t px-3 py-4 ${isLight ? 'border-ink/10' : 'border-white/10'}`}>
      <div className={`truncate px-3 py-2 text-xs font-semibold ${isLight ? 'text-stone/70' : 'text-white/60'}`}>
        {fullName}
      </div>
      <form action={logoutPortal.bind(null, loginHref)}>
        <button
          type="submit"
          className={
            isLight
              ? 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink/70 transition hover:bg-slate-100 hover:text-ink'
              : 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white'
          }
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
      <Link
        href="/"
        className={
          isLight
            ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-slate-100 hover:text-ink'
            : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white'
        }
      >
        <ArrowLeft className="h-4 w-4" />
        Back to website
      </Link>
    </div>
  );

  return (
    <PortalShellChrome
      isLight={isLight}
      logoBlock={logoBlock}
      navLinksBlock={navLinksBlock}
      footerBlock={footerBlock}
      fullName={fullName}
      email={email}
      settingsHref={settingsHref}
      childSwitcher={childSwitcher}
    >
      {isLight ? (
        <div className="relative isolate flex flex-1 flex-col overflow-x-hidden bg-gradient-to-br from-[#bcd4ff] via-[#cddaff] to-[#a9c6ff] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-0 lg:left-64">
            <AdminBackground />
          </div>
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      )}
    </PortalShellChrome>
  );
}
