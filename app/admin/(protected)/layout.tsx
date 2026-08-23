import Link from 'next/link';
import { logout } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/guard';

const navItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Sponsors', href: '/admin/sponsors' },
  { label: 'Statistics', href: '/admin/stats' },
  { label: 'Courses', href: '/admin/courses' },
  { label: 'Age groups', href: '/admin/age-groups' },
  { label: 'Contact', href: '/admin/contact' },
  { label: 'Social media links', href: '/admin/socials' },
  { label: 'Achievements gallery', href: '/admin/achievements' },
  { label: 'Timeline', href: '/admin/timeline' },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50 text-ink">
      <aside className="w-64 shrink-0 border-r border-ink/10 bg-white px-4 py-6">
        <p className="px-2 text-sm font-bold uppercase tracking-[0.2em] text-ink">BrainTrain Admin</p>
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-stone transition hover:bg-slate-100 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-xl border border-ink/10 px-3 py-2 text-sm font-semibold text-stone transition hover:border-ink/30 hover:text-ink"
          >
            Log out
          </button>
        </form>

        <Link
          href="/"
          className="mt-2 block rounded-xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-stone/70 transition hover:text-ink"
        >
          ← Back to site
        </Link>
      </aside>

      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
