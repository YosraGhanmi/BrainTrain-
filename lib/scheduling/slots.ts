// The school's weekly timetable used to be this hardcoded list; it now lives
// in the TimeSlot table, editable from /admin/time-slots (see
// lib/scheduling/time-slots.ts for the DB-backed lookup/CRUD). This literal
// copy survives only as the initial seed data — see prisma/seed.ts — so a
// fresh database starts with the same 10 groups the school has always used.
export const DEFAULT_TIME_SLOTS = [
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

// Every course runs the same school year — admins don't set a start date per
// course/session, and every group seats the same 12 children.
export const DEFAULT_SESSION_TERM = '15 Sep – 15 Jun';
export const DEFAULT_SESSION_CAPACITY = 12;

// "HH:MM" strings compare correctly with plain string comparison since every
// slot is zero-padded 24h time — no need to parse them into minutes.
export function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type WeeklyTimeRange = { dayOfWeek: number; startTime: string; endTime: string };

// True when two course sessions would ask the same child to be in two
// places at once — same weekday, overlapping time range. Different courses
// can otherwise reuse the exact same time slot (e.g. two unrelated groups
// both scheduled "G1"), so this has to be checked per enrollment, not
// prevented at the slot level.
export function sessionsConflict(a: WeeklyTimeRange, b: WeeklyTimeRange): boolean {
  return a.dayOfWeek === b.dayOfWeek && timeRangesOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
}
