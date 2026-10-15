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
  IdCard,
  GraduationCap,
  CalendarClock,
  Clock4,
  ClipboardList,
  FilePenLine,
  CreditCard,
  Tag,
  Megaphone,
  CalendarDays,
  Receipt,
  TrendingUp,
  Landmark,
  CalendarRange,
  Sun,
} from 'lucide-react';

const customizationItems = [
  { label: 'Partners', href: '/admin/sponsors', icon: Handshake },
  { label: 'Statistics', href: '/admin/stats', icon: BarChart3 },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Age groups', href: '/admin/age-groups', icon: Users },
  { label: 'Contact', href: '/admin/contact', icon: Mail },
  { label: 'Social media links', href: '/admin/socials', icon: Share2 },
  { label: 'Achievements gallery', href: '/admin/achievements', icon: ImageIcon },
  { label: 'Timeline', href: '/admin/timeline', icon: Milestone },
];

// Reception gets a short, flat menu: just the day-to-day front-desk pages.
// Admin-only pages stay gated server-side by requireAdminOnly().
const secretaryAccountItems = [
  { label: 'Parents', href: '/admin/parents', icon: UserSquare2 },
  { label: 'Children', href: '/admin/children', icon: Users },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
];

const portalSections = [
  {
    key: 'accounts',
    title: 'Accounts',
    icon: UserSquare2,
    items: [
      { label: 'Parents', href: '/admin/parents', icon: UserSquare2 },
      { label: 'Children', href: '/admin/children', icon: Users },
      { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
      { label: 'Reception', href: '/admin/secretaries', icon: IdCard },
    ],
  },
  {
    key: 'classes',
    title: 'Classes',
    icon: CalendarClock,
    items: [
      { label: 'Course sessions', href: '/admin/sessions', icon: CalendarClock },
      { label: 'Summer school', href: '/admin/summer-school', icon: Sun },
      { label: 'Time slots', href: '/admin/time-slots', icon: Clock4 },
      { label: 'Enrollments', href: '/admin/enrollments', icon: ClipboardList },
      { label: 'Preinscriptions', href: '/admin/preinscriptions', icon: FilePenLine },
      { label: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
      { label: 'Group timetable', href: '/admin/timetable', icon: CalendarRange },
    ],
  },
  {
    key: 'payments',
    title: 'Payments',
    icon: CreditCard,
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Earnings', href: '/admin/earnings', icon: TrendingUp },
      { label: 'Fixed charges', href: '/admin/dispenses/fixed', icon: Landmark },
      { label: 'Variable charges', href: '/admin/dispenses/variable', icon: Receipt },
      { label: 'Pricing', href: '/admin/pricing', icon: Tag },
    ],
  },
  {
    key: 'news',
    title: 'News',
    icon: Megaphone,
    items: [{ label: 'News', href: '/admin/news', icon: Megaphone }],
  },
];

export default function SidebarNav({
  role = 'admin',
  unreadMessages = 0,
  pendingEnrollments = 0,
  noticeBadges = {},
}: {
  role?: 'admin' | 'secretary';
  unreadMessages?: number;
  pendingEnrollments?: number;
  // Unread bell notifications per page href (payments, earnings, charges)
  noticeBadges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const isChildActive = customizationItems.some((item) => pathname?.startsWith(item.href));
  const [open, setOpen] = useState(true);
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) =>
    setClosedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const badgeFor = (href: string) => (href === '/admin/enrollments' ? pendingEnrollments : (noticeBadges[href] ?? 0));

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

  // Website customization and Parent portal each get their own tint (reusing
  // the accent2/emerald already used for teacher/children stats elsewhere on
  // the dashboard) so the two sections read as distinct at a glance instead
  // of the same pale gray as everything else.
  const sectionIconClass = (active: boolean, tint: 'violet' | 'emerald') => {
    if (active) return 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-white transition';
    const tintClasses =
      tint === 'violet'
        ? 'bg-accent2/10 text-accent2 group-hover:bg-accent2/15'
        : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200';
    return `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${tintClasses}`;
  };

  if (role === 'secretary') {
    const flatLink = (href: string, label: string, Icon: typeof Inbox, badge = 0, badgeClass = 'bg-amber-500') => {
      const active = href === '/admin' ? pathname === '/admin' : (pathname?.startsWith(href) ?? false);
      return (
        <Link key={href} href={href} className={linkClass(active)}>
          <span className={iconClass(active)}>
            <Icon className="h-4 w-4" />
          </span>
          {label}
          {badge > 0 ? (
            <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${badgeClass}`}>
              {badge}
            </span>
          ) : null}
        </Link>
      );
    };

    return (
      <nav className="mt-6 flex flex-col gap-1">
        {flatLink('/admin', 'Dashboard', LayoutDashboard)}
        {flatLink('/admin/messages', 'Messages', Inbox, unreadMessages, 'bg-accent')}
        {flatLink('/admin/payments', 'Payments', CreditCard, badgeFor('/admin/payments'))}
        {flatLink('/admin/enrollments', 'Enrollments', ClipboardList, pendingEnrollments)}
        {flatLink('/admin/preinscriptions', 'Preinscriptions', FilePenLine, badgeFor('/admin/preinscriptions'))}

        <p className="mt-4 flex items-center gap-2 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-emerald-700/80">
          <UserSquare2 className="h-3.5 w-3.5" />
          Accounts
        </p>
        <div className="flex flex-col gap-1 border-l border-emerald-200 pl-2">
          {secretaryAccountItems.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <span className={sectionIconClass(active, 'emerald')}>
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4">{flatLink('/admin/timetable', 'Calendar', CalendarDays)}</div>
      </nav>
    );
  }

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

      {role === 'admin' ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`mt-6 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.15em] transition ${
              isChildActive ? 'bg-accent2/10 text-accent2' : 'text-accent2/80 hover:bg-accent2/10 hover:text-accent2'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5" />
              Website customization
            </span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="mt-1 flex flex-col gap-1 border-l border-accent2/20 pl-2">
              {customizationItems.map((item) => {
                const active = pathname?.startsWith(item.href) ?? false;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={linkClass(active)}>
                    <span className={sectionIconClass(active, 'violet')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {portalSections.map((section) => {
        const sectionOpen = !closedSections.has(section.key);
        const sectionActive = section.items.some((item) => pathname?.startsWith(item.href));
        // While collapsed, surface the section's unread count on its header
        const sectionBadge = section.items.reduce((sum, item) => sum + badgeFor(item.href), 0);
        const SectionIcon = section.icon;
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              className={`mt-6 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[0.65rem] font-bold uppercase tracking-[0.15em] transition ${
                sectionActive ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-700/80 hover:bg-emerald-100 hover:text-emerald-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <SectionIcon className="h-3.5 w-3.5" />
                {section.title}
              </span>
              <span className="flex items-center gap-2">
                {!sectionOpen && sectionBadge > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold tracking-normal text-white">
                    {sectionBadge}
                  </span>
                ) : null}
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${sectionOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {sectionOpen && (
              <div className="mt-1 flex flex-col gap-1 border-l border-emerald-200 pl-2">
                {section.items.map((item) => {
                  const active = pathname?.startsWith(item.href) ?? false;
                  const Icon = item.icon;
                  const badge = badgeFor(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(active)}>
                      <span className={sectionIconClass(active, 'emerald')}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.label}
                      {badge > 0 ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
