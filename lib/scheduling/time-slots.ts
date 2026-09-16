import { listFirebaseTimeSlots, findFirebaseSlotLabel } from '@/lib/firebase/time-slots';
import type { FirebaseTimeSlot } from '@/lib/firebase/time-slots';

export type { FirebaseTimeSlot as TimeSlot };

export async function listTimeSlots(): Promise<FirebaseTimeSlot[]> {
  const slots = await listFirebaseTimeSlots();
  return slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

// Takes an already-fetched slot list (rather than querying itself) so
// call sites that label many sessions at once — a table, a schedule list —
// fetch the slot set once instead of once per row.
export function findSlotLabel(
  slots: Pick<FirebaseTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): string | null {
  return findFirebaseSlotLabel(slots, dayOfWeek, startTime, endTime);
}
