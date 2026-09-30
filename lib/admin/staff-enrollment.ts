import { listAgeGroupEntries, listCourseEntries } from '@/lib/content/lookup';
import { listTimeSlots } from '@/lib/scheduling/time-slots';
import { listAllFirebaseSessionsWithCounts } from '@/lib/firebase/read-models';
import type { StaffEnrollmentOptions } from '@/components/admin/StaffEnrollmentFields';
import type { AgeGroupOption } from '@/components/portal/BirthDateAgeGroupFields';

export function adminAgeGroupOptions(): AgeGroupOption[] {
  return listAgeGroupEntries().map((g) => ({ slug: g.slug, label: g.label.en, minAge: g.minAge, maxAge: g.maxAge }));
}

export const ADMIN_BIRTH_DATE_LABELS = {
  dateOfBirth: 'Date of birth',
  ageGroup: 'Age group',
  empty: 'Detected from the date of birth',
  detected: 'Age {age} this school year · updates automatically',
  noMatch: 'No age group covers age {age}: pick one',
  select: 'Select an age group',
};

// Everything the staff enrollment picker needs: courses (by age group), the
// weekly timetable slots, and the groups already running with their seats.
export async function loadStaffEnrollmentOptions(): Promise<StaffEnrollmentOptions> {
  const [sessions, timeSlots] = await Promise.all([listAllFirebaseSessionsWithCounts(), listTimeSlots()]);
  return {
    ageGroups: listAgeGroupEntries().map((g) => ({ slug: g.slug, label: g.label.en })),
    courses: listCourseEntries().map((c) => ({ slug: c.slug, title: c.title.en, ageGroupSlug: c.ageGroupSlug })),
    timeSlots: timeSlots.map((s) => ({ id: s.id, label: s.label, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
    sessions: sessions.map((s) => ({
      courseSlug: s.courseSlug,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      seatsLeft: s.capacity - s.enrollmentCount,
    })),
  };
}
