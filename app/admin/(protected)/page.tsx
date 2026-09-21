import Link from 'next/link';
import { Users2, CreditCard, Wallet, Landmark, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { firestore } from '@/lib/firebase/admin';
import { monthNav } from '@/lib/admin/month';

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
  tone: 'emerald' | 'amber' | 'blue' | 'violet';
}) {
  const TONE_CLASSES = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
  } as const;
  const toneClasses = TONE_CLASSES[tone];
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

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await requireAdmin();
  const isSecretary = session.kind === 'secretary';

  const { monthStart, monthEnd, monthLabel, prevMonthParam, nextMonthParam, isCurrentMonth } = monthNav(searchParams.month);

  const [parentSnap, teacherSnap, childSnap, enrollmentSnap, childGroupSnap, paidSnap, unpaidSnap, earningsSnap, dispensesSnap] =
    await Promise.all([
      firestore.collection('users').where('role', '==', 'PARENT').count().get(),
      firestore.collection('users').where('role', '==', 'TEACHER').count().get(),
      firestore.collection('children').count().get(),
      firestore.collection('enrollments').where('status', '==', 'ACTIVE').count().get(),
      firestore.collection('children').get(),
      firestore.collection('payments').where('status', '==', 'PAID').where('paidAt', '>=', monthStart).where('paidAt', '<', monthEnd).count().get(),
      firestore.collection('payments').where('status', '!=', 'PAID').where('dueDate', '>=', monthStart).where('dueDate', '<', monthEnd).count().get(),
      firestore.collection('payments').where('status', '==', 'PAID').where('paidAt', '>=', monthStart).where('paidAt', '<', monthEnd).get(),
      firestore.collection('expenses').where('date', '>=', monthStart).where('date', '<', monthEnd).get(),
    ]);

  const parentsCount = parentSnap.data().count;
  const teachersCount = teacherSnap.data().count;
  const childrenCount = childSnap.data().count;
  const activeEnrollments = enrollmentSnap.data().count;
  const paidPayments = paidSnap.data().count;
  const unpaidPayments = unpaidSnap.data().count;

  const totalEarnings = earningsSnap.docs.reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const fixedDispenses = dispensesSnap.docs
    .filter((doc) => doc.data().chargeType === 'FIXED')
    .reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const variableDispenses = dispensesSnap.docs
    .filter((doc) => doc.data().chargeType !== 'FIXED')
    .reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const totalDispenses = fixedDispenses + variableDispenses;

  // Build age group breakdown from the children collection
  const countByAgeGroupSlug = new Map<string, number>();
  childGroupSnap.docs.forEach((doc) => {
    const slug = String(doc.data().ageGroupSlug ?? '');
    countByAgeGroupSlug.set(slug, (countByAgeGroupSlug.get(slug) ?? 0) + 1);
  });
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

      <div className={`mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 ${isSecretary ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <StatCard label="Parent accounts" value={parentsCount} href="/admin/parents" theme="blue" />
        {isSecretary ? (
          <StatCard label="Teacher accounts" value={teachersCount} href="/admin/teachers" theme="violet" />
        ) : null}
        <StatCard label="Children enrolled" value={childrenCount} href="/admin/children" theme="emerald" />
        <StatCard label="Active enrollments" value={activeEnrollments} href="/admin/enrollments" theme="amber" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-stone">Earnings &amp; dispenses</p>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyStatCard label="Total earnings" amount={totalEarnings} currency="TND" href="/admin/payments" icon={TrendingUp} tone="emerald" />
        <MoneyStatCard label="Fixed charges" amount={fixedDispenses} currency="TND" href="/admin/dispenses" icon={Landmark} tone="blue" />
        <MoneyStatCard label="Variable charges" amount={variableDispenses} currency="TND" href="/admin/dispenses" icon={Wallet} tone="violet" />
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
