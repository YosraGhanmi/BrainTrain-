'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const customizationItems = [
  { label: 'Sponsors', href: '/admin/sponsors' },
  { label: 'Statistics', href: '/admin/stats' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Age groups', href: '/admin/age-groups' },
  { label: 'Contact', href: '/admin/contact' },
  { label: 'Social media links', href: '/admin/socials' },
  { label: 'Achievements gallery', href: '/admin/achievements' },
  { label: 'Timeline', href: '/admin/timeline' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const isChildActive = customizationItems.some((item) => pathname?.startsWith(item.href));
  const [open, setOpen] = useState(true);

  const linkClass = (active: boolean) =>
    `relative rounded-xl px-3 py-2.5 font-display text-sm font-semibold tracking-wide transition ${
      active
        ? 'bg-accent/10 text-accent before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-accent'
        : 'text-ink/60 hover:bg-slate-100 hover:text-ink'
    }`;

  return (
    <nav className="mt-6 flex flex-col gap-1">
      <Link href="/admin" className={linkClass(pathname === '/admin')}>
        Dashboard
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`mt-4 flex items-center justify-between px-3 text-xs font-bold uppercase tracking-[0.2em] transition hover:text-ink ${
          isChildActive ? 'text-ink' : 'text-stone/70'
        }`}
      >
        Website customization
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-1">
          {customizationItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(pathname?.startsWith(item.href) ?? false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
