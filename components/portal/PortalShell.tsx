import { Link } from '@/i18n/navigation';
import { logoutPortal } from '@/lib/portal-auth/actions';
import { LogOut, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PortalTopbar from '@/components/portal/PortalTopbar';
import PortalNavLinks from '@/components/portal/PortalNavLinks';
import TextMorph from '@/components/text/TextMorph';

export default function PortalShell({
  homeHref,
  brandLabel,
  fullName,
  email,
  settingsHref,
  navLinks,
  loginHref,
  childSwitcher,
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
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 shrink-0 flex-col bg-[#0b1a3a] text-white">
        <div className="px-6 py-6">
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
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/70">{brandLabel}</p>
        </div>

        <PortalNavLinks
          navLinks={navLinks.map(({ label, href, icon: Icon }) => ({
            label,
            href,
            icon: Icon ? <Icon className="h-4 w-4" /> : null,
          }))}
        />

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <div className="truncate px-3 py-2 text-xs font-semibold text-white/60">{fullName}</div>
          <form action={logoutPortal.bind(null, loginHref)}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar fullName={fullName} email={email} settingsHref={settingsHref} childSwitcher={childSwitcher} />
        <div className="flex flex-1 flex-col px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
