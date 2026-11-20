import { requireAdmin } from '@/lib/admin/guard';
import { getActiveTimetable } from '@/lib/scheduling/time-slots';
import { upsertTimeSlot, deleteTimeSlot, restoreDefaultTimeSlots, setRamadanTimetable } from '@/lib/admin/time-slots-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { TimeSlot } from '@/lib/scheduling/time-slots';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {children}
    </label>
  );
}

function TimeSlotForm({ slot, isNew, ramadan }: { slot: TimeSlot | null; isNew: boolean; ramadan: boolean }) {
  return (
    <details className={`group rounded-2xl border bg-white ${isNew ? 'border-dashed border-ink/30' : 'border-ink/10'}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-ink">
        {slot ? `${slot.label} · ${DAYS[slot.dayOfWeek]} ${slot.startTime} to ${slot.endTime}` : '+ New time slot'}
        <span className="flex items-center gap-3">
          {slot ? <DeleteIconButton action={deleteTimeSlot.bind(null, slot.id)} /> : null}
          <span className="text-stone transition group-open:rotate-180">▾</span>
        </span>
      </summary>

      <form action={upsertTimeSlot} className="grid grid-cols-1 gap-4 border-t border-ink/10 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="id" value={slot?.id ?? ''} />
        <input type="hidden" name="ramadan" value={ramadan ? '1' : ''} />

        <Field label="Label (e.g. G1)">
          <input
            name="label"
            defaultValue={slot?.label ?? ''}
            placeholder="G1"
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <Field label="Day">
          <select
            name="dayOfWeek"
            defaultValue={slot?.dayOfWeek ?? ''}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="" disabled>
              Day
            </option>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Start time">
          <input
            name="startTime"
            type="time"
            defaultValue={slot?.startTime ?? ''}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <Field label="End time">
          <input
            name="endTime"
            type="time"
            defaultValue={slot?.endTime ?? ''}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <div className="flex justify-end sm:col-span-2 lg:col-span-4">
          <PendingSubmitButton className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
            {isNew ? 'Add time slot' : 'Save'}
          </PendingSubmitButton>
        </div>
      </form>
    </details>
  );
}

function TimetableSection({
  title,
  description,
  slots,
  ramadan,
  live,
}: {
  title: string;
  description: string;
  slots: TimeSlot[];
  ramadan: boolean;
  live: boolean;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            {title}
            {live ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                In use now
              </span>
            ) : null}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-stone">{description}</p>
        </div>
        <form action={restoreDefaultTimeSlots.bind(null, ramadan)}>
          <PendingSubmitButton className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50">
            Restore defaults
          </PendingSubmitButton>
        </form>
      </div>

      <div className="mt-4 space-y-4">
        <TimeSlotForm slot={null} isNew ramadan={ramadan} />
        {slots.map((slot) => (
          <TimeSlotForm key={slot.id} slot={slot} isNew={false} ramadan={ramadan} />
        ))}
      </div>
    </section>
  );
}

export default async function AdminTimeSlotsPage(props: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const { ramadanActive, slots, ramadanSlots } = await getActiveTimetable();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Time slots</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        The named groups (G1, G2, …) every course picks its sessions from on the{' '}
        <a href="/admin/sessions" className="underline">
          Course sessions
        </a>{' '}
        page. Editing or deleting a school-year slot only affects groups created from it afterwards. It never changes
        the day or time of a group that already exists.
      </p>

      {searchParams.error === 'duplicate' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">That timetable already has a time slot with this label.</p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          Please fill in every field. The start time must be before the end time.
        </p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${
          ramadanActive ? 'border-amber-300 bg-amber-50' : 'border-ink/10 bg-white'
        }`}
      >
        <div className="max-w-xl">
          <p className="font-display text-base font-semibold text-ink">
            Ramadan timetable: {ramadanActive ? 'on' : 'off'}
          </p>
          <p className="mt-1 text-sm text-stone">
            {ramadanActive
              ? 'Every group meets at its Ramadan time (G1 at the Ramadan G1 slot, and so on). Parents, teachers and the group timetable all show these times. Turn it off when Ramadan ends to go back to the school-year times.'
              : 'Groups meet at their school-year times. Turn this on when Ramadan starts: every group then moves to the Ramadan slot with the same label, for parents, teachers and the group timetable.'}
          </p>
        </div>
        <form action={setRamadanTimetable.bind(null, !ramadanActive)}>
          <PendingSubmitButton
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition ${
              ramadanActive ? 'bg-ink hover:bg-stone/90' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {ramadanActive ? 'Back to school-year times' : 'Switch to Ramadan times'}
          </PendingSubmitButton>
        </form>
      </div>

      <TimetableSection
        title="School year"
        description="New groups are created from these slots. Restore defaults puts G1 to G10 back at the school's usual times and keeps any other slots you added."
        slots={slots}
        ramadan={false}
        live={!ramadanActive}
      />

      <TimetableSection
        title="Ramadan"
        description="Each group moves to the Ramadan slot with its label while the Ramadan timetable is on. A group whose label has no Ramadan slot keeps its school-year time. Restore defaults puts G1 to G10 back at the Ramadan poster times."
        slots={ramadanSlots}
        ramadan
        live={ramadanActive}
      />
    </div>
  );
}
