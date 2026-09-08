import { prisma } from '@/lib/db/prisma';
import type { TimeSlot } from '@prisma/client';

export async function listTimeSlots(): Promise<TimeSlot[]> {
  return prisma.timeSlot.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
}

// Takes an already-fetched slot list (rather than querying itself) so
// call sites that label many sessions at once — a table, a schedule list —
// fetch the slot set once instead of once per row.
export function findSlotLabel(
  slots: Pick<TimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  dayOfWeek: number,
  startTime: string,
  endTime: string
): string | null {
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime && s.endTime === endTime);
  return slot?.label ?? null;
}
