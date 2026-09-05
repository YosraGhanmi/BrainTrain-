// The school's fixed weekly timetable — every course picks its groups from
// these same 10 slots (see the "Les horaires scolaires" flyer). dayOfWeek
// follows CourseSession's convention: 0 = Sunday ... 6 = Saturday.
export const SCHOOL_TIME_SLOTS = [
  { label: 'G1', dayOfWeek: 3, startTime: '14:00', endTime: '16:00' }, // Wednesday
  { label: 'G2', dayOfWeek: 3, startTime: '16:00', endTime: '18:00' },
  { label: 'G3', dayOfWeek: 5, startTime: '14:00', endTime: '16:00' }, // Friday
  { label: 'G4', dayOfWeek: 5, startTime: '16:00', endTime: '18:00' },
  { label: 'G5', dayOfWeek: 6, startTime: '09:00', endTime: '11:00' }, // Saturday
  { label: 'G6', dayOfWeek: 6, startTime: '11:00', endTime: '13:00' },
  { label: 'G7', dayOfWeek: 6, startTime: '14:00', endTime: '16:00' },
  { label: 'G8', dayOfWeek: 6, startTime: '16:00', endTime: '18:00' },
  { label: 'G9', dayOfWeek: 0, startTime: '09:00', endTime: '11:00' }, // Sunday
  { label: 'G10', dayOfWeek: 0, startTime: '11:00', endTime: '13:00' },
] as const;

export type SchoolTimeSlot = (typeof SCHOOL_TIME_SLOTS)[number];

// Every course runs the same school year — admins don't set a start date per
// course/session, and every group seats the same 12 children.
export const DEFAULT_SESSION_TERM = '15 Sep – 15 Jun';
export const DEFAULT_SESSION_CAPACITY = 12;

export function findSlotLabel(dayOfWeek: number, startTime: string, endTime: string): string | null {
  const slot = SCHOOL_TIME_SLOTS.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime && s.endTime === endTime);
  return slot?.label ?? null;
}
