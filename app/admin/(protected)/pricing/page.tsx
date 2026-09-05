import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { upsertAgeGroupPricing, clearCoursePricingOverride } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import type { PlanType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const PLAN_FIELDS: { type: PlanType; label: string }[] = [
  { type: 'MONTHLY', label: 'Monthly' },
  { type: 'QUARTERLY', label: '3 months' },
  { type: 'YEARLY', label: 'Full year (15 Sep – 15 Jun)' },
];

export default async function AdminPricingPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  await requireAdmin();
  const [rules, content] = await Promise.all([prisma.pricingRule.findMany(), Promise.resolve(readContent())]);

  const ageGroupDefaults: Record<string, Partial<Record<PlanType, number>> & { currency: string }> = {};
  const courseOverrides: Record<string, Partial<Record<PlanType, number>> & { currency: string }> = {};
  for (const r of rules) {
    if (r.ageGroupSlug) {
      const entry = (ageGroupDefaults[r.ageGroupSlug] ??= { currency: r.currency });
      entry[r.planType] = Number(r.amount);
    } else if (r.courseSlug) {
      const entry = (courseOverrides[r.courseSlug] ??= { currency: r.currency });
      entry[r.planType] = Number(r.amount);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Pricing</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Every course bills at its age group's default rate unless it has its own pricing set on the{' '}
        <a href="/admin/courses" className="underline">Courses</a> page.
      </p>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}
      {searchParams.error ? <p className="mt-4 text-sm font-semibold text-red-600">Something went wrong.</p> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {content.ageGroups.map((group) => {
          const defaults = ageGroupDefaults[group.slug];
          return (
            <form
              key={group.slug}
              action={upsertAgeGroupPricing}
              className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft"
            >
              <input type="hidden" name="ageGroupSlug" value={group.slug} />
              <h2 className="font-display text-lg font-bold text-ink">{group.label.en}</h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLAN_FIELDS.map((p) => (
                  <label key={p.type} className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{p.label}</span>
                    <input
                      name={`amount_${p.type}`}
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={defaults?.[p.type] ?? ''}
                      className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone">
                  Currency
                  <input
                    name="currency"
                    defaultValue={defaults?.currency ?? 'TND'}
                    required
                    className="w-20 rounded-lg border border-ink/10 bg-slate-50 px-2 py-1.5 text-sm outline-none focus:border-accent"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
                >
                  Save
                </button>
              </div>
            </form>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink">Course-specific pricing</h2>
      <p className="mt-1 text-sm text-stone">
        These courses opted out of their age group's default. Set or remove overrides from the{' '}
        <a href="/admin/courses" className="underline">Courses</a> page.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Monthly</th>
              <th className="px-5 py-3">3 months</th>
              <th className="px-5 py-3">Full year</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {Object.keys(courseOverrides).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-stone">
                  No course-specific overrides — every course uses its age group's default.
                </td>
              </tr>
            ) : (
              Object.entries(courseOverrides).map(([courseSlug, amounts]) => {
                const course = content.courses.find((c) => c.slug === courseSlug);
                return (
                  <tr key={courseSlug} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-4 font-semibold text-ink">{course?.title.en ?? courseSlug}</td>
                    <td className="px-5 py-4 text-stone">{amounts.MONTHLY ?? '—'} {amounts.currency}</td>
                    <td className="px-5 py-4 text-stone">{amounts.QUARTERLY ?? '—'} {amounts.currency}</td>
                    <td className="px-5 py-4 text-stone">{amounts.YEARLY ?? '—'} {amounts.currency}</td>
                    <td className="px-5 py-4 text-right">
                      <DeleteIconButton action={clearCoursePricingOverride.bind(null, courseSlug)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
