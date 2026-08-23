import type { LucideIcon } from 'lucide-react';
import { readContent } from './content/store';
import { getIcon } from './content/icons';

export type Course = {
  slug: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
  sessions: number;
  price?: { perSession?: number; perMonth?: number; currency?: string };
  videoUrl?: string;
};

export type AgeGroup = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  image: string;
  courseTitles: string[];
};

// Content is admin-editable at runtime (see lib/content/store.ts), so these
// are read fresh on every call rather than exported as static constants —
// pages that render them must opt into dynamic rendering (`export const
// dynamic = 'force-dynamic'`) so a saved edit shows up without a rebuild.

export function getCourses(): Course[] {
  return readContent().courses.map((c) => ({ ...c, icon: getIcon(c.icon) }));
}

export function getAgeGroups(): AgeGroup[] {
  return readContent().ageGroups.map((g) => ({ ...g, icon: getIcon(g.icon) }));
}

export function getCourse(slug: string): Course | undefined {
  return getCourses().find((course) => course.slug === slug);
}

export function getAgeGroup(slug: string): AgeGroup | undefined {
  return getAgeGroups().find((group) => group.slug === slug);
}

export function getCoursesForAgeGroup(group: AgeGroup): Course[] {
  const all = getCourses();
  return group.courseTitles.map((title) => all.find((c) => c.title === title)).filter((c): c is Course => Boolean(c));
}

export function getAgeGroupsForCourse(course: Course): AgeGroup[] {
  return getAgeGroups().filter((group) => group.courseTitles.includes(course.title));
}
