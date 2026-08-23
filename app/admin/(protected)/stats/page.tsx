import { readContent } from '@/lib/content/store';
import { updateStats } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

export default function AdminStatsPage() {
  const { stats } = readContent();
  // A couple of blank rows so the admin can add more counters, not just edit
  // the existing three.
  const rows = [...stats, { label: '', value: 0 }, { label: '', value: 0 }];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Statistics</h1>
      <p className="mt-2 text-stone">The counters shown in the homepage "Statistics" section. Leave a label blank to remove that row.</p>

      <form action={updateStats} className="mt-8 max-w-lg space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
        {rows.map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              name="label"
              defaultValue={stat.label}
              placeholder="Label (e.g. Students)"
              className="flex-1 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <input
              name="value"
              type="number"
              min={0}
              defaultValue={stat.value}
              placeholder="Value"
              className="w-28 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Save
        </button>
      </form>
    </div>
  );
}
