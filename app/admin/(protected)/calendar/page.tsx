import { readContent } from '@/lib/content/store';
import { addCalendarEvent, deleteCalendarEvent } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default function AdminCalendarPage({ searchParams }: { searchParams: { error?: string } }) {
  const { calendarEvents, ageGroups, courses } = readContent();
  const sorted = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Calendar</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone">
        Pin a date and it shows up in the matching parents&apos; schedule calendars. Leave age groups / classes
        unchecked to target everyone.
      </p>

      <form
        action={addCalendarEvent}
        className="mt-8 space-y-5 rounded-2xl border border-dashed border-ink/30 bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-2">
            <label htmlFor="label" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              Label
            </label>
            <input
              id="label"
              name="label"
              type="text"
              required
              placeholder="e.g. School closed"
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="color" className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              Color
            </label>
            <input
              id="color"
              name="color"
              type="color"
              defaultValue="#3d7fff"
              className="h-[42px] w-16 rounded-xl border border-ink/10 bg-slate-50 p-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Target age groups</p>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((g) => (
                <label
                  key={g.slug}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <input type="checkbox" name="targetAgeGroups" value={g.slug} className="accent-accent" />
                  {g.label.en}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Target classes</p>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <label
                  key={c.slug}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <input type="checkbox" name="targetCourses" value={c.slug} className="accent-accent" />
                  {c.title.en}
                </label>
              ))}
            </div>
          </div>
        </div>

        {searchParams.error ? <p className="text-sm font-semibold text-red-600">Fill in both a label and a date.</p> : null}
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Pin date
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
            No dates pinned yet.
          </p>
        ) : (
          sorted.map((event) => {
            const groupLabels = event.targetAgeGroups
              .map((slug) => ageGroups.find((g) => g.slug === slug)?.label.en ?? slug)
              .join(', ');
            const courseLabels = event.targetCourses
              .map((slug) => courses.find((c) => c.slug === slug)?.title.en ?? slug)
              .join(', ');
            const targeting = [groupLabels && `Age: ${groupLabels}`, courseLabels && `Class: ${courseLabels}`]
              .filter(Boolean)
              .join(' · ');

            return (
              <div key={event.id} className="relative flex items-start gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                  aria-hidden
                />
                <div className="flex-1 pr-10">
                  <h2 className="font-display text-lg font-bold text-ink">{event.label}</h2>
                  <p className="mt-1 text-xs text-stone">
                    {new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    · {targeting || 'All parents'}
                  </p>
                </div>
                <div className="absolute right-4 top-4">
                  <DeleteIconButton action={deleteCalendarEvent.bind(null, event.id)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
