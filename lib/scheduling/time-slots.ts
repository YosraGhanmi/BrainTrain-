import { listDbTimeSlots, findDbSlotLabel, getDbRamadanTimetableActive } from '@/lib/db/time-slots';
import type { DbTimeSlot } from '@/lib/db/time-slots';

export type { DbTimeSlot as TimeSlot };

type SlotTimes = Pick<DbTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>;

const bySlotTime = (a: DbTimeSlot, b: DbTimeSlot) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime);

// The school-year slots: the ones groups are created from, and whose day and
// time a group stores
export async function listTimeSlots(): Promise<DbTimeSlot[]> {
  return (await listDbTimeSlots(false)).sort(bySlotTime);
}

export async function listRamadanTimeSlots(): Promise<DbTimeSlot[]> {
  return (await listDbTimeSlots(true)).sort(bySlotTime);
}

// Takes an already-fetched slot list (rather than querying itself) so
// call sites that label many sessions at once — a table, a schedule list —
// fetch the slot set once instead of once per row.
export function findSlotLabel(
  slots: SlotTimes[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): string | null {
  return findDbSlotLabel(slots, dayOfWeek, startTime, endTime);
}

// A group's display name: its own label (summer groups) or else the weekly
// time slot it runs in
export function sessionGroupLabel(
  slots: SlotTimes[],
  session: { label?: string; dayOfWeek: number; startTime: string; endTime: string },
): string | null {
  return session.label || findDbSlotLabel(slots, session.dayOfWeek, session.startTime, session.endTime);
}

export type ActiveTimetable = {
  ramadanActive: boolean;
  slots: DbTimeSlot[];
  ramadanSlots: DbTimeSlot[];
};

export async function getActiveTimetable(): Promise<ActiveTimetable> {
  const [ramadanActive, slots, ramadanSlots] = await Promise.all([
    getDbRamadanTimetableActive(),
    listTimeSlots(),
    listRamadanTimeSlots(),
  ]);
  return { ramadanActive, slots, ramadanSlots };
}

type GroupTimes = { label: string; summer: boolean; dayOfWeek: number; extraDays: number[]; startTime: string; endTime: string };

// When a group actually meets right now. Groups store their school-year day
// and time; while the Ramadan timetable is switched on, a school-year group
// meets at the Ramadan slot with the same label instead (G1 at G1's Ramadan
// time). The returned copy carries that label, so sessionGroupLabel() still
// names it. For display only: never save it, and check clashes on the stored
// times.
export function currentSessionTimes<T extends GroupTimes>(session: T, timetable: ActiveTimetable): T {
  if (!timetable.ramadanActive || session.summer) return session;
  const label = session.label || findDbSlotLabel(timetable.slots, session.dayOfWeek, session.startTime, session.endTime);
  const ramadan = label ? timetable.ramadanSlots.find((slot) => slot.label === label) : undefined;
  if (!ramadan) return session;
  return { ...session, label: ramadan.label, dayOfWeek: ramadan.dayOfWeek, extraDays: [], startTime: ramadan.startTime, endTime: ramadan.endTime };
}
