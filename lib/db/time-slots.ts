import { prisma } from '@/lib/db/prisma';

export type DbTimeSlot = {
  id: string;
  label: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createDbTimeSlot(input: Omit<DbTimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  // Enforce unique label
  const existing = await prisma.timeSlot.findUnique({ where: { label: input.label }, select: { id: true } });
  if (existing) throw new Error('LABEL_TAKEN');
  const row = await prisma.timeSlot.create({ data: input });
  return row.id;
}

export async function updateDbTimeSlot(id: string, input: Partial<Omit<DbTimeSlot, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await prisma.timeSlot.update({ where: { id }, data: input });
}

export async function deleteDbTimeSlot(id: string): Promise<void> {
  await prisma.timeSlot.delete({ where: { id } });
}

export async function getDbTimeSlot(id: string): Promise<DbTimeSlot | null> {
  if (!id) return null;
  return prisma.timeSlot.findUnique({ where: { id } });
}

export async function listDbTimeSlots(): Promise<DbTimeSlot[]> {
  return prisma.timeSlot.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
}

// Helper used by schedule pages: find the label matching a session's day+time
export function findDbSlotLabel(
  slots: Pick<DbTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): string | null {
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime && s.endTime === endTime);
  return slot?.label ?? null;
}
