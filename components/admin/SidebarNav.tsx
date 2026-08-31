'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ChevronDown,
  Handshake,
  BarChart3,
  BookOpen,
  Users,
  Mail,
  Share2,
  Image as ImageIcon,
  Milestone,
  Settings2,
  Inbox,
  UserSquare2,
  GraduationCap,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Tag,
  Megaphone,
} from 'lucide-react';

const customizationItems = [
  { label: 'Sponsors', href: '/admin/sponsors', icon: Handshake },
  { label: 'Statistics', href: '/admin/stats', icon: BarChart3 },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Age groups', href: '/admin/age-groups', icon: Users },
  { label: 'Contact', href: '/admin/contact', icon: Mail },
  { label: 'Social media links', href: '/admin/socials', icon: Share2 },
  { label: 'Achievements gallery', href: '/admin/achievements', icon: ImageIcon },
  { label: 'Timeline', href: '/admin/timeline', icon: Milestone },
];

const portalItems = [
  { label: 'Parents', href: '/admin/parents', icon: UserSquare2 },
  { label: 'Children', href: '/admin/children', icon: Users },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { label: 'Course sessions', href: '/admin/sessions', icon: CalendarClock },
  { label: 'Enrollments', href: '/admin/enrollments', icon: ClipboardList },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Pricing', href: '/admin/pricing', icon: Tag },
  { label: 'News', href: '/admin/news', icon: Megaphone },
];

export default function SidebarNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const isChildActive = customizationItems.some((item) => pathname?.startsWith(item.href));
  const isPortalActive = portalItems.some((item) => pathname?.startsWith(item.href));
  const [open, setOpen] = useState(true);
  const [portalOpen, setPortalOpen] = useState(true);

  const linkClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-semibold tracking-wide transition ${
      active
        ? 'bg-ink text-white shadow-[0_8px_24px_-8px_rgba(11,12,16,0.5)]'
        : 'text-ink/60 hover:bg-slate-100 hover:text-ink'
    }`;

  const iconClass = (active: boolean) =>
    `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
      active ? 'bg-white/15 text-white' : 'bg-slate-100 text-ink/40 group-hover:text-ink/70'
    }`;

  return (
    <nav className="mt-6 flex flex-col gap-1">
      <Link href="/admin" className={linkClass(pathname === '/admin')}>
        <span className={iconClass(pathname === '/admin')}>
          <LayoutDashboard className="h-4 w-4" />
        </span>
        Dashboard
      </Link>

      <Link href="/admin/messages" className={linkClass(pathname?.startsWith('/admin/messages') ?? false)}>
        <span className={iconClass(pathname?.startsWith('/admin/messages') ?? false)}>
          <Inbox className="h-4 w-4" />
        </span>
        Messages
        {unreadMessages > 0 ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
            {unreadMessages}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`mt-6 flex w-full items-center justify-between gap-2 px-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.15em] transition hover:text-ink ${
          isChildActive ? 'text-ink' : 'text-stone/70'
        }`}
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5" />
          Website customization
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-1 border-l border-ink/10 pl-2">
          {customizationItems.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <span className={iconClass(active)}>
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPortalOpen((v) => !v)}
        className={`mt-6 flex w-full items-center justify-between gap-2 px-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.15em] transition hover:text-ink ${
          isPortalActive ? 'text-ink' : 'text-stone/70'
        }`}
      >
        <span className="flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5" />
          Parent portal
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${portalOpen ? 'rotate-180' : ''}`} />
      </button>

      {portalOpen && (
        <div className="mt-1 flex flex-col gap-1 border-l border-ink/10 pl-2">
          {portalItems.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <span className={iconClass(active)}>
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
