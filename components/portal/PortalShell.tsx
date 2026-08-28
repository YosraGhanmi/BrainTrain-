import { Link } from '@/i18n/navigation';
import { logoutPortal } from '@/lib/portal-auth/actions';

export default function PortalShell({
  homeHref,
  brandLabel,
  fullName,
  navLinks,
  loginHref,
  children,
}: {
  homeHref: string;
  brandLabel: string;
  fullName: string;
  navLinks: { label: string; href: string }[];
  loginHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href={homeHref} className="font-display text-lg font-bold text-ink">
              BrainTrain <span className="text-accent">{brandLabel}</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold text-stone">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-ink">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone">{fullName}</span>
            <form action={logoutPortal.bind(null, loginHref)}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
