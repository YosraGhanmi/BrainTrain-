import { requireAdmin } from '@/lib/admin/guard';
import { listTimeSlots } from '@/lib/scheduling/time-slots';
import { upsertTimeSlot, deleteTimeSlot } from '@/lib/admin/time-slots-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import type { TimeSlot } from '@prisma/client';

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

function TimeSlotForm({ slot, isNew }: { slot: TimeSlot; isNew: boolean }) {
  return (
    <details className={`group rounded-2xl border bg-white ${isNew ? 'border-dashed border-ink/30' : 'border-ink/10'}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-ink">
        {isNew ? '+ New time slot' : `${slot.label} — ${DAYS[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}`}
        <span className="flex items-center gap-3">
          {!isNew ? <DeleteIconButton action={deleteTimeSlot.bind(null, slot.id)} /> : null}
          <span className="text-stone transition group-open:rotate-180">▾</span>
        </span>
      </summary>

      <form action={upsertTimeSlot} className="grid grid-cols-1 gap-4 border-t border-ink/10 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="id" value={isNew ? '' : slot.id} />

        <Field label="Label (e.g. G1)">
          <input
            name="label"
            defaultValue={isNew ? '' : slot.label}
            placeholder="G1"
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <Field label="Day">
          <select
            name="dayOfWeek"
            defaultValue={isNew ? '' : slot.dayOfWeek}
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
            defaultValue={isNew ? '' : slot.startTime}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <Field label="End time">
          <input
            name="endTime"
            type="time"
            defaultValue={isNew ? '' : slot.endTime}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        <div className="flex justify-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            {isNew ? 'Add time slot' : 'Save'}
          </button>
        </div>
      </form>
    </details>
  );
}

export default async function AdminTimeSlotsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  await requireAdmin();
  const slots = await listTimeSlots();

  const blank: TimeSlot = {
    id: '',
    label: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Time slots</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        The named groups (G1, G2, …) every course picks its sessions from on the{' '}
        <a href="/admin/sessions" className="underline">
          Course sessions
        </a>{' '}
        page. Editing or deleting a slot here only affects sessions created from it afterwards — it never changes the
        day/time of a session that was already scheduled from the old definition.
      </p>

      {searchParams.error === 'duplicate' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">A time slot with that label already exists.</p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          Please fill in every field — start time must be before end time.
        </p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div className="mt-6 space-y-4">
        <TimeSlotForm slot={blank} isNew />

        {slots.map((slot) => (
          <TimeSlotForm key={slot.id} slot={slot} isNew={false} />
        ))}
      </div>
    </div>
  );
}
