import { readContent } from '@/lib/content/store';
import { updateStats } from '@/lib/admin/actions';
import StatsEditor from '@/components/admin/StatsEditor';

export const dynamic = 'force-dynamic';

export default function AdminStatsPage() {
  const { stats } = readContent();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Statistics</h1>

      <form action={updateStats} className="mt-8 rounded-2xl border border-ink/10 bg-white p-6">
        <StatsEditor initial={stats} />

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
