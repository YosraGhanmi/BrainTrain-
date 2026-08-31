'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export default function PortalNavLinks({
  navLinks,
  theme = 'dark',
}: {
  navLinks: { label: string; href: string; icon?: ReactNode }[];
  theme?: 'dark' | 'light';
}) {
  const pathname = usePathname();

  // Pick the single longest-matching href instead of testing each link in
  // isolation — otherwise a parent route like "/parent-portal" (Dashboard)
  // would also match while on "/parent-portal/courses" since it's a prefix.
  const activeHref = navLinks
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isLight = theme === 'light';

  return (
    <nav className="mt-6 flex-1 space-y-1 px-3">
      {navLinks.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={
              isLight
                ? `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-ink text-white shadow-[0_8px_24px_-8px_rgba(11,12,16,0.5)]'
                      : 'text-ink/60 hover:bg-slate-100 hover:text-ink'
                  }`
                : `flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'border-accent bg-white/10 text-white'
                      : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'
                  }`
            }
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
