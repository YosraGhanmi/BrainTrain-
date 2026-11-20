import { prisma } from '@/lib/db/prisma';

export type DbTimeSlot = {
  id: string;
  label: string;
  // Part of the Ramadan timetable rather than the school-year one
  ramadan: boolean;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
};

type SlotInput = Omit<DbTimeSlot, 'id' | 'createdAt' | 'updatedAt'>;

// A label can be used once per timetable: G1 in the school year and G1 in
// Ramadan are the same group at its two times
async function labelTaken(label: string, ramadan: boolean, exceptId?: string): Promise<boolean> {
  const existing = await prisma.timeSlot.findUnique({ where: { label_ramadan: { label, ramadan } }, select: { id: true } });
  return Boolean(existing && existing.id !== exceptId);
}

export async function createDbTimeSlot(input: SlotInput): Promise<string> {
  if (await labelTaken(input.label, input.ramadan)) throw new Error('LABEL_TAKEN');
  const row = await prisma.timeSlot.create({ data: input });
  return row.id;
}

export async function updateDbTimeSlot(id: string, input: Partial<SlotInput>): Promise<void> {
  if (input.label !== undefined) {
    const current = await prisma.timeSlot.findUnique({ where: { id }, select: { ramadan: true } });
    if (current && (await labelTaken(input.label, input.ramadan ?? current.ramadan, id))) throw new Error('LABEL_TAKEN');
  }
  await prisma.timeSlot.update({ where: { id }, data: input });
}

export async function deleteDbTimeSlot(id: string): Promise<void> {
  await prisma.timeSlot.delete({ where: { id } });
}

export async function getDbTimeSlot(id: string): Promise<DbTimeSlot | null> {
  if (!id) return null;
  return prisma.timeSlot.findUnique({ where: { id } });
}

export async function listDbTimeSlots(ramadan = false): Promise<DbTimeSlot[]> {
  return prisma.timeSlot.findMany({ where: { ramadan }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
}

// Puts each default slot back at its default day and time, re-adding any
// that were deleted. Slots with other labels are left alone.
export async function restoreDbDefaultTimeSlots(
  ramadan: boolean,
  defaults: ReadonlyArray<Pick<DbTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>>,
): Promise<void> {
  await prisma.$transaction(
    defaults.map((slot) =>
      prisma.timeSlot.upsert({
        where: { label_ramadan: { label: slot.label, ramadan } },
        create: { ...slot, ramadan },
        update: { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
      }),
    ),
  );
}

const RAMADAN_SETTING = 'ramadanTimetable';

export async function getDbRamadanTimetableActive(): Promise<boolean> {
  const row = await prisma.setting.findUnique({ where: { key: RAMADAN_SETTING } });
  const value = row?.value as { active?: unknown } | null | undefined;
  return value?.active === true;
}

export async function setDbRamadanTimetableActive(active: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: RAMADAN_SETTING },
    create: { key: RAMADAN_SETTING, value: { active } },
    update: { value: { active } },
  });
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
