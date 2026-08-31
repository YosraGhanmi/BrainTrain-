import Link from 'next/link';
import { TrendingUp, TrendingDown, CreditCard, Inbox, AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { readMessages } from '@/lib/messages/store';

export const dynamic = 'force-dynamic';

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

const STAT_THEMES = {
  blue: {
    glow: 'bg-accent/25',
    ring: 'group-hover:ring-accent/30',
    number: 'from-ink to-accent',
  },
  violet: {
    glow: 'bg-accent2/25',
    ring: 'group-hover:ring-accent2/30',
    number: 'from-ink to-accent2',
  },
  emerald: {
    glow: 'bg-emerald-400/25',
    ring: 'group-hover:ring-emerald-400/30',
    number: 'from-ink to-emerald-600',
  },
  amber: {
    glow: 'bg-amber-400/25',
    ring: 'group-hover:ring-amber-400/30',
    number: 'from-ink to-orange-500',
  },
} as const;

function StatCard({
  label,
  value,
  href,
  theme,
}: {
  label: string;
  value: number;
  href: string;
  theme: keyof typeof STAT_THEMES;
}) {
  const t = STAT_THEMES[theme];
  return (
    <Link
      href={href}
      className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-soft ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-10px_rgba(11,12,16,0.2)] ${t.ring}`}
    >
      <span className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-300 group-hover:scale-125 ${t.glow}`} />

      <p className={`relative bg-gradient-to-br bg-clip-text font-display text-6xl font-black leading-none tracking-tight text-transparent ${t.number}`}>
        {value}
      </p>
      <p className="relative mt-3 text-sm font-semibold text-stone">{label}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  requireAdmin();

  const [parentsCount, teachersCount, childrenCount, activeEnrollments, overduePayments, courseSessions, recentPayments] =
    await Promise.all([
      prisma.parent.count(),
      prisma.teacher.count(),
      prisma.child.count(),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'OVERDUE' } }),
      prisma.courseSession.findMany({ include: { _count: { select: { enrollments: true } } } }),
      prisma.payment.findMany({
        include: {
          paymentPlan: { include: { enrollment: { include: { child: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

  const enrollmentByCourseSlug = new Map<string, number>();
  for (const session of courseSessions) {
    enrollmentByCourseSlug.set(session.courseSlug, (enrollmentByCourseSlug.get(session.courseSlug) ?? 0) + session._count.enrollments);
  }
  const courseStats = readContent().courses.map((course) => ({
    course,
    count: enrollmentByCourseSlug.get(course.slug) ?? 0,
  }));
  const mostEnrolled = courseStats.length ? courseStats.reduce((a, b) => (b.count > a.count ? b : a)) : null;
  const leastEnrolled = courseStats.length ? courseStats.reduce((a, b) => (b.count < a.count ? b : a)) : null;

  const unreadMessages = readMessages().filter((m) => !m.read);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-stone">An overview of parent-portal accounts, enrollments and activity.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Parent accounts" value={parentsCount} href="/admin/parents" theme="blue" />
        <StatCard label="Teacher accounts" value={teachersCount} href="/admin/teachers" theme="violet" />
        <StatCard label="Children enrolled" value={childrenCount} href="/admin/children" theme="emerald" />
        <StatCard label="Active enrollments" value={activeEnrollments} href="/admin/enrollments" theme="amber" />
      </div>

      {overduePayments > 0 ? (
        <Link
          href="/admin/payments"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {overduePayments} payment{overduePayments === 1 ? '' : 's'} overdue — needs attention.
        </Link>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-wide">Most enrolled course</p>
          </div>
          {mostEnrolled ? (
            <>
              <p className="mt-3 font-display text-xl font-bold text-ink">{mostEnrolled.course.title.en}</p>
              <p className="mt-1 text-sm text-stone">{mostEnrolled.count} enrollment{mostEnrolled.count === 1 ? '' : 's'}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-stone">No courses yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-amber-700">
            <TrendingDown className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-wide">Least enrolled course</p>
          </div>
          {leastEnrolled ? (
            <>
              <p className="mt-3 font-display text-xl font-bold text-ink">{leastEnrolled.course.title.en}</p>
              <p className="mt-1 text-sm text-stone">{leastEnrolled.count} enrollment{leastEnrolled.count === 1 ? '' : 's'}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-stone">No courses yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <CreditCard className="h-4 w-4 text-accent" />
              Recent payments
            </h2>
            <Link href="/admin/payments" className="text-xs font-semibold text-accent transition hover:underline">
              View all
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="mt-4 text-sm text-stone">No payments recorded yet.</p>
          ) : (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{p.paymentPlan.enrollment.child.fullName}</p>
                    <p className="text-xs text-stone">
                      {Number(p.amount)} {p.currency} · {p.dueDate.toDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STATUS_STYLES[p.status]}`}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Inbox className="h-4 w-4 text-accent" />
              Messages
            </h2>
            {unreadMessages.length > 0 ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">{unreadMessages.length} new</span>
            ) : null}
          </div>

          {unreadMessages.length === 0 ? (
            <p className="mt-4 text-sm text-stone">No unread messages.</p>
          ) : (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {unreadMessages.map((m) => (
                <li key={m.id}>
                  <Link href="/admin/messages" className="block rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-xs text-stone">{m.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
