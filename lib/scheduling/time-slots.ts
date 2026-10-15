import { listDbTimeSlots, findDbSlotLabel } from '@/lib/db/time-slots';
import type { DbTimeSlot } from '@/lib/db/time-slots';

export type { DbTimeSlot as TimeSlot };

export async function listTimeSlots(): Promise<DbTimeSlot[]> {
  const slots = await listDbTimeSlots();
  return slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

// Takes an already-fetched slot list (rather than querying itself) so
// call sites that label many sessions at once — a table, a schedule list —
// fetch the slot set once instead of once per row.
export function findSlotLabel(
  slots: Pick<DbTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): string | null {
  return findDbSlotLabel(slots, dayOfWeek, startTime, endTime);
}

// A group's display name: its own label (summer groups) or else the weekly
// time slot it runs in
export function sessionGroupLabel(
  slots: Pick<DbTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  session: { label?: string; dayOfWeek: number; startTime: string; endTime: string },
): string | null {
  return session.label || findDbSlotLabel(slots, session.dayOfWeek, session.startTime, session.endTime);
}
