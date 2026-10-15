import { readContent } from './store';
import { detectAgeGroupSlug } from './age-range';
import type { CourseEntry, AgeGroupEntry } from './types';

// Validates references from the database (Child.ageGroupSlug,
// CourseSession.courseSlug) against the site content, instead of duplicating
// course/age-group data into their own tables.

// Synchronous lookups over content already loaded, for loops and JSX: load
// once with `const courseOf = await courseLookup()`, then call courseOf(slug)
export async function courseLookup(): Promise<(slug: string) => CourseEntry> {
  const bySlug = new Map((await readContent()).courses.map((c) => [c.slug, c]));
  return (slug) => {
    const course = bySlug.get(slug);
    if (!course) throw new Error(`Unknown course slug "${slug}"`);
    return course;
  };
}

export async function ageGroupLookup(): Promise<(slug: string) => AgeGroupEntry> {
  const bySlug = new Map((await readContent()).ageGroups.map((g) => [g.slug, g]));
  return (slug) => {
    const group = bySlug.get(slug);
    if (!group) throw new Error(`Unknown age group slug "${slug}"`);
    return group;
  };
}

export async function getCourseEntryOrThrow(slug: string): Promise<CourseEntry> {
  return (await courseLookup())(slug);
}

export async function getAgeGroupEntryOrThrow(slug: string): Promise<AgeGroupEntry> {
  return (await ageGroupLookup())(slug);
}

export async function listAgeGroupEntries(): Promise<AgeGroupEntry[]> {
  return (await readContent()).ageGroups;
}

// The age group a child belongs to this school year, or null when no group
// covers their age
export function ageGroupSlugForBirthDate(dateOfBirth: Date, ageGroups: AgeGroupEntry[]): string | null {
  return detectAgeGroupSlug(ageGroups, dateOfBirth);
}

export async function listCourseEntries(): Promise<CourseEntry[]> {
  return (await readContent()).courses;
}

export async function listCourseEntriesForAgeGroup(ageGroupSlug: string): Promise<CourseEntry[]> {
  return (await readContent()).courses.filter((c) => c.ageGroupSlug === ageGroupSlug);
}
