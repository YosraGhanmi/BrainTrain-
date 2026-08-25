import { readContent } from '@/lib/content/store';
import { upsertTimelineEntry, deleteTimelineEntry, reorderTimeline } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import TimelineDragList from '@/components/admin/TimelineDragList';
import { CalendarDays, Image as ImageIcon, Facebook } from 'lucide-react';
import type { TimelineEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const NAVY = '#0b1a3a';

function EntryForm({ entry, index, isNew }: { entry: TimelineEntry; index: number; isNew: boolean }) {
  return (
    <div className="relative pl-12">
      <span
        className="absolute left-0 top-6 h-5 w-5 rounded-full border-4 bg-white"
        style={{ borderColor: isNew ? 'rgba(11,12,16,0.2)' : NAVY }}
      />

      <details className={`group rounded-2xl border bg-white shadow-soft ${isNew ? 'border-dashed border-ink/30' : 'border-ink/10'}`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone">
              <CalendarDays className="h-3.5 w-3.5" style={{ color: NAVY }} />
              {isNew ? 'New milestone' : entry.date.en || 'No date'}
              {entry.logo ? <ImageIcon className="h-3.5 w-3.5 text-stone/60" /> : null}
              {entry.facebookUrl ? <Facebook className="h-3.5 w-3.5 text-[#1877f2]" /> : null}
            </p>
            <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">
              {isNew ? '+ Add a milestone' : entry.title.en || 'Untitled milestone'}
            </h3>
          </div>
          <span className="flex shrink-0 items-center gap-3">
            {!isNew ? <DeleteIconButton action={deleteTimelineEntry.bind(null, index)} /> : null}
            <span className="text-stone transition group-open:rotate-180">▾</span>
          </span>
        </summary>

        <form action={upsertTimelineEntry} className="space-y-3 border-t border-ink/10 p-6">
          <input type="hidden" name="index" value={index} />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="date_en"
              defaultValue={entry.date.en}
              placeholder="Date — English (e.g. October 2023)"
              className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <input
              name="date_fr"
              defaultValue={entry.date.fr}
              placeholder="Date — French (ex. Octobre 2023)"
              className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <input
              name="title_en"
              defaultValue={entry.title.en}
              placeholder="Title — English"
              className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
            <input
              name="title_fr"
              defaultValue={entry.title.fr}
              placeholder="Title — French"
              className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />
          </div>
          <textarea
            name="summary_en"
            defaultValue={entry.summary.en}
            placeholder="Description — English"
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
          <textarea
            name="summary_fr"
            defaultValue={entry.summary.fr}
            placeholder="Description — French"
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
          <input
            name="facebookUrl"
            type="url"
            defaultValue={entry.facebookUrl ?? ''}
            placeholder="Facebook post link (optional)"
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="logo" defaultChecked={entry.logo} className="h-4 w-4" />
            Show the BrainTrain logo badge on this entry
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
            >
              {isNew ? 'Add milestone' : 'Save'}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

export default function AdminTimelinePage() {
  const { timeline } = readContent();
  const blank: TimelineEntry = {
    date: { en: '', fr: '' },
    title: { en: '', fr: '' },
    logo: false,
    summary: { en: '', fr: '' },
  };

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Timeline</h1>

      <div className="relative mt-10 space-y-6">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-ink/10" />

        <TimelineDragList
          key={timeline.map((e) => `${e.date.en}|${e.title.en}`).join('~')}
          onReorder={reorderTimeline}
        >
          {timeline.map((entry, i) => (
            <EntryForm key={i} entry={entry} index={i} isNew={false} />
          ))}
        </TimelineDragList>

        <EntryForm entry={blank} index={-1} isNew />
      </div>
    </div>
  );
}
