import { readContent } from '@/lib/content/store';
import { upsertTimelineEntry, deleteTimelineEntry } from '@/lib/admin/actions';
import type { TimelineEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

function EntryForm({ entry, index }: { entry: TimelineEntry; index: number }) {
  return (
    <form action={upsertTimelineEntry} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-6">
      <input type="hidden" name="index" value={index} />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="date"
          defaultValue={entry.date}
          placeholder="Date (e.g. October 2023)"
          className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
        <input
          name="title"
          defaultValue={entry.title}
          placeholder="Title"
          className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </div>
      <textarea
        name="summary"
        defaultValue={entry.summary}
        placeholder="Short summary (shown by default)"
        rows={2}
        className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />
      <textarea
        name="detail"
        defaultValue={entry.detail}
        placeholder="Full detail (shown when selected)"
        rows={3}
        className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="logo" defaultChecked={entry.logo} className="h-4 w-4" />
        Show the BrainTrain logo badge on this entry
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Save
        </button>
        {index >= 0 ? (
          <button
            type="submit"
            formAction={deleteTimelineEntry.bind(null, index)}
            className="rounded-full border border-red-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function AdminTimelinePage() {
  const { timeline } = readContent();
  const blank: TimelineEntry = { date: '', title: '', logo: false, summary: '', detail: '' };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Timeline</h1>
      <p className="mt-2 text-stone">Milestones shown in the achievements timeline, in order.</p>

      <div className="mt-8 space-y-6">
        {timeline.map((entry, i) => (
          <EntryForm key={i} entry={entry} index={i} />
        ))}

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone">New milestone</h2>
          <EntryForm entry={blank} index={-1} />
        </div>
      </div>
    </div>
  );
}
