import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { upsertPricingRule, deletePricingRule } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage({ searchParams }: { searchParams: { saved?: string } }) {
  requireAdmin();
  const [rules, content] = await Promise.all([
    prisma.pricingRule.findMany({ orderBy: [{ planType: 'asc' }, { courseSlug: 'asc' }] }),
    Promise.resolve(readContent()),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Pricing</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        These amounts are placeholders; no official BrainTrain pricing document was available when this system was
        built. Replace them here with real prices; each plan type needs a default (leave "Course" blank), plus any
        course-specific overrides.
      </p>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={upsertPricingRule} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <select name="planType" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="MONTHLY">Monthly</option>
          <option value="SEASONAL">Seasonal</option>
          <option value="COURSE">Full course</option>
        </select>
        <select name="courseSlug" className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="">Default (all courses)</option>
          {content.courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title.en} ({c.ageGroupSlug})
            </option>
          ))}
        </select>
        <input name="amount" type="number" min={0} step="0.01" placeholder="Amount" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="currency" defaultValue="TND" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2 lg:col-span-4">
          Save pricing rule
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => {
              const course = content.courses.find((c) => c.slug === r.courseSlug);
              return (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{r.planType}</td>
                  <td className="px-5 py-4 text-stone">{course ? course.title.en : 'Default (all courses)'}</td>
                  <td className="px-5 py-4 text-stone">
                    {Number(r.amount)} {r.currency}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {r.courseSlug ? <DeleteIconButton action={deletePricingRule.bind(null, r.id)} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
