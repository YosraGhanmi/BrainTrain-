import Link from 'next/link';
import { Users2, CreditCard, Wallet, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';

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
      className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-soft ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-10px_rgba(11,12,16,0.2)] sm:p-8 ${t.ring}`}
    >
      <span className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-300 group-hover:scale-125 ${t.glow}`} />

      <p className={`relative bg-gradient-to-br bg-clip-text font-display text-5xl font-black leading-none tracking-tight text-transparent sm:text-6xl ${t.number}`}>
        {value}
      </p>
      <p className="relative mt-3 text-sm font-semibold text-stone">{label}</p>
    </Link>
  );
}

function MoneyStatCard({
  label,
  amount,
  currency,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  amount: number;
  currency: string;
  href: string;
  icon: typeof Wallet;
  tone: 'emerald' | 'amber';
}) {
  const toneClasses =
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_16px_36px_-10px_rgba(11,12,16,0.2)] sm:p-8"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-black text-ink sm:text-3xl">
          {amount.toFixed(2)} <span className="text-base font-bold text-stone">{currency}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-stone">{label}</p>
      </div>
    </Link>
  );
}

// Fixed, CVD-validated 4-hue categorical set for the age-group bars (blue,
// amber, teal, purple — passes scripts/validate_palette.js under the
// dataviz skill: lightness band, chroma floor, CVD separation, normal-vision
// floor, and contrast vs. a white surface all pass). Colors are assigned by
// each age group's position in its *declared* order, never by its rank in
// the sorted-by-count display order — otherwise a group's color would shift
// as enrollment counts change, which breaks "color follows the entity."
const AGE_GROUP_COLORS = ['#2563eb', '#d97706', '#0d9488', '#9333ea'];

// "YYYY-MM" <-> the first-of-month Date it names, used to scope the
// Payments card to one month at a time via the ?month= query param.
function parseMonthParam(month: string | undefined): { year: number; monthIndex: number } {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) return { year, monthIndex };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function monthParamFor(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  await requireAdmin();

  const { year, monthIndex } = parseMonthParam(searchParams.month);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthParam = monthParamFor(monthIndex === 0 ? year - 1 : year, monthIndex === 0 ? 11 : monthIndex - 1);
  const nextMonthParam = monthParamFor(monthIndex === 11 ? year + 1 : year, monthIndex === 11 ? 0 : monthIndex + 1);
  const isCurrentMonth = monthParamFor(year, monthIndex) === monthParamFor(new Date().getFullYear(), new Date().getMonth());

  const [
    parentsCount,
    teachersCount,
    childrenCount,
    activeEnrollments,
    childrenByAgeGroup,
    paidPayments,
    unpaidPayments,
    earningsResult,
    dispensesResult,
  ] = await Promise.all([
    prisma.parent.count(),
    prisma.teacher.count(),
    prisma.child.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.child.groupBy({ by: ['ageGroupSlug'], _count: { _all: true } }),
    // A yearly/quarterly plan's single Payment row keeps the dueDate it was
    // created with, so a parent who pays in a later month than they were
    // billed would never show up under "paid" for the month the money
    // actually came in if this went by dueDate — paidAt is when it happened.
    prisma.payment.count({ where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } } }),
    // Still-outstanding bills, by contrast, only make sense scoped to when
    // they're due — a payment already marked PAID (however late) is no
    // longer "remaining" in the month it was originally due.
    prisma.payment.count({ where: { status: { not: 'PAID' }, dueDate: { gte: monthStart, lt: monthEnd } } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalEarnings = Number(earningsResult._sum.amount ?? 0);
  const totalDispenses = Number(dispensesResult._sum.amount ?? 0);

  const countByAgeGroupSlug = new Map(childrenByAgeGroup.map((g) => [g.ageGroupSlug, g._count._all]));
  const allAgeGroups = readContent().ageGroups;
  const colorByAgeGroupSlug = new Map(allAgeGroups.map((g, i) => [g.slug, AGE_GROUP_COLORS[i % AGE_GROUP_COLORS.length]]));
  const ageGroupStats = allAgeGroups
    .map((ageGroup) => ({ ageGroup, count: countByAgeGroupSlug.get(ageGroup.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const maxAgeGroupCount = Math.max(1, ...ageGroupStats.map((s) => s.count));

  const totalPayments = paidPayments + unpaidPayments;
  const paidPct = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyStatCard label="Total earnings" amount={totalEarnings} currency="TND" href="/admin/payments" icon={TrendingUp} tone="emerald" />
        <MoneyStatCard label="Total dispenses" amount={totalDispenses} currency="TND" href="/admin/dispenses" icon={Wallet} tone="amber" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-accent">
            <Users2 className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-wide">Children by age group</p>
          </div>

          {ageGroupStats.length === 0 ? (
            <p className="mt-4 text-sm text-stone">No age groups yet.</p>
          ) : (
            <div className="mt-6">
              <div className="flex h-40 items-end gap-3 border-b border-ink/10 sm:gap-6">
                {ageGroupStats.map(({ ageGroup, count }) => {
                  const heightPct = maxAgeGroupCount > 0 ? (count / maxAgeGroupCount) * 100 : 0;
                  const color = colorByAgeGroupSlug.get(ageGroup.slug) ?? AGE_GROUP_COLORS[0];
                  return (
                    <div key={ageGroup.slug} className="relative flex h-full flex-1 items-end justify-center">
                      <span
                        className="absolute text-xs font-bold text-ink"
                        style={{ bottom: `calc(${heightPct}% + 6px)` }}
                      >
                        {count}
                      </span>
                      <div
                        title={`${ageGroup.label.en}: ${count} child${count === 1 ? '' : 'ren'}`}
                        className="w-full max-w-[24px] rounded-t-[4px] transition-[height]"
                        style={{ height: `${heightPct}%`, backgroundColor: color }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2 sm:gap-6">
                {ageGroupStats.map(({ ageGroup }) => (
                  <p key={ageGroup.slug} className="flex flex-1 items-center justify-center gap-1.5 text-center text-xs font-semibold text-stone">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorByAgeGroupSlug.get(ageGroup.slug) ?? AGE_GROUP_COLORS[0] }}
                    />
                    {ageGroup.label.en}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <CreditCard className="h-4 w-4 text-accent" />
              Payments
            </h2>
            <Link href="/admin/payments" className="text-xs font-semibold text-accent transition hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              href={`/admin?month=${prevMonthParam}`}
              aria-label="Previous month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <p className="text-sm font-semibold text-ink">
              {monthLabel}
              {isCurrentMonth ? <span className="ml-2 text-xs font-normal text-stone">(current)</span> : null}
            </p>
            <Link
              href={`/admin?month=${nextMonthParam}`}
              aria-label="Next month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-slate-100 hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6">
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
      </div>
    </div>
  );
}
