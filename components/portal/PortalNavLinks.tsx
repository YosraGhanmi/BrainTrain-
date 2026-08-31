'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export default function PortalNavLinks({
  navLinks,
}: {
  navLinks: { label: string; href: string; icon?: ReactNode }[];
}) {
  const pathname = usePathname();

  // Pick the single longest-matching href instead of testing each link in
  // isolation — otherwise a parent route like "/parent-portal" (Dashboard)
  // would also match while on "/parent-portal/courses" since it's a prefix.
  const activeHref = navLinks
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex-1 space-y-1 px-3">
      {navLinks.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'border-accent bg-white/10 text-white'
                : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
