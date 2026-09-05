import Link from 'next/link';
import { Users2, CreditCard, Inbox, AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { readMessages } from '@/lib/messages/store';

export const dynamic = 'force-dynamic';

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
  await requireAdmin();

  const [parentsCount, teachersCount, childrenCount, activeEnrollments, overduePayments, childrenByAgeGroup, totalPayments, paidPayments] =
    await Promise.all([
      prisma.parent.count(),
      prisma.teacher.count(),
      prisma.child.count(),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'OVERDUE' } }),
      prisma.child.groupBy({ by: ['ageGroupSlug'], _count: { _all: true } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PAID' } }),
    ]);

  const countByAgeGroupSlug = new Map(childrenByAgeGroup.map((g) => [g.ageGroupSlug, g._count._all]));
  const ageGroupStats = readContent()
    .ageGroups.map((ageGroup) => ({ ageGroup, count: countByAgeGroupSlug.get(ageGroup.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const maxAgeGroupCount = Math.max(1, ...ageGroupStats.map((s) => s.count));

  const unpaidPayments = totalPayments - paidPayments;
  const paidPct = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

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
          {overduePayments} payment{overduePayments === 1 ? '' : 's'} overdue. Needs attention.
        </Link>
      ) : null}

      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 text-accent">
          <Users2 className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-wide">Children by age group</p>
        </div>

        {ageGroupStats.length === 0 ? (
          <p className="mt-4 text-sm text-stone">No age groups yet.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {ageGroupStats.map(({ ageGroup, count }) => (
              <li key={ageGroup.slug}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{ageGroup.label.en}</p>
                  <p className="text-xs text-stone">{count} child{count === 1 ? '' : 'ren'}</p>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(count / maxAgeGroupCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <CreditCard className="h-4 w-4 text-accent" />
              Payments
            </h2>
            <Link href="/admin/payments" className="text-xs font-semibold text-accent transition hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-6">
            <div
              className="relative h-32 w-32 shrink-0 rounded-full"
              style={
                totalPayments === 0
                  ? { background: '#e2e8f0' }
                  : { background: `conic-gradient(#10b981 0 ${paidPct}%, #f59e0b ${paidPct}% 100%)` }
              }
            >
              <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-white">
                <p className="font-display text-2xl font-black text-ink">{totalPayments === 0 ? '0' : `${paidPct}%`}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone">
                  {totalPayments === 0 ? 'No payments' : 'Paid'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <p className="text-sm text-ink">
                  <span className="font-bold">{paidPayments}</span> paid
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                <p className="text-sm text-ink">
                  <span className="font-bold">{unpaidPayments}</span> remaining
                </p>
              </div>
              <p className="text-xs text-stone">{totalPayments} total payments</p>
            </div>
          </div>
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
