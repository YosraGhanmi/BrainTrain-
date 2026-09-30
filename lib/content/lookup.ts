import { readContent } from './store';
import { detectAgeGroupSlug } from './age-range';
import type { CourseEntry, AgeGroupEntry } from './types';

// Validates references from the new relational system (Child.ageGroupSlug,
// CourseSession.courseSlug) against the existing JSON content store, instead
// of duplicating course/age-group data into the database.

export function getCourseEntryOrThrow(slug: string): CourseEntry {
  const course = readContent().courses.find((c) => c.slug === slug);
  if (!course) throw new Error(`Unknown course slug "${slug}"`);
  return course;
}

export function getAgeGroupEntryOrThrow(slug: string): AgeGroupEntry {
  const group = readContent().ageGroups.find((g) => g.slug === slug);
  if (!group) throw new Error(`Unknown age group slug "${slug}"`);
  return group;
}

export function listAgeGroupEntries(): AgeGroupEntry[] {
  return readContent().ageGroups;
}

// The age group a child belongs to this school year, or null when no group
// covers their age
export function ageGroupSlugForBirthDate(dateOfBirth: Date, ageGroups: AgeGroupEntry[] = listAgeGroupEntries()): string | null {
  return detectAgeGroupSlug(ageGroups, dateOfBirth);
}

export function listCourseEntries(): CourseEntry[] {
  return readContent().courses;
}

export function listCourseEntriesForAgeGroup(ageGroupSlug: string): CourseEntry[] {
  return readContent().courses.filter((c) => c.ageGroupSlug === ageGroupSlug);
}
