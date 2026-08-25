import type { LucideIcon } from 'lucide-react';
import { readContent } from './content/store';
import { getIcon } from './content/icons';
import type { AppLocale } from '@/i18n/routing';

export type Course = {
  slug: string;
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
  sessions: number;
  price: number;
  ageGroupSlug: string;
  videoUrl?: string;
  image?: string;
};

export type AgeGroup = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  image: string;
};

// A "kind" of course — e.g. "Robotique" — collapsed across every age group
// that offers it, since each age group has its own independent Course entry
// (own description, sessions, price) sharing only the title/icon/color.
// `icon` stays a raw string name (not a resolved component) since CourseKind
// values get passed as props into client components — a resolved LucideIcon
// component reference can't cross the server/client boundary.
export type CourseKind = {
  slug: string;
  title: string;
  icon: string;
  color: string;
  variants: Course[];
};

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Content is admin-editable at runtime (see lib/content/store.ts), so these
// are read fresh on every call rather than exported as static constants —
// pages that render them must opt into dynamic rendering (`export const
// dynamic = 'force-dynamic'`) so a saved edit shows up without a rebuild.

export function getCourses(locale: AppLocale): Course[] {
  return readContent().courses.map((c) => ({
    ...c,
    title: c.title[locale] || c.title.en,
    description: c.description[locale] || c.description.en,
    icon: getIcon(c.icon),
  }));
}

export function getAgeGroups(locale: AppLocale): AgeGroup[] {
  return readContent().ageGroups.map((g) => ({
    ...g,
    label: g.label[locale] || g.label.en,
    description: g.description[locale] || g.description.en,
    icon: getIcon(g.icon),
  }));
}

export function getCourse(slug: string, locale: AppLocale): Course | undefined {
  return getCourses(locale).find((course) => course.slug === slug);
}

export function getAgeGroup(slug: string, locale: AppLocale): AgeGroup | undefined {
  return getAgeGroups(locale).find((group) => group.slug === slug);
}

export function getCoursesForAgeGroup(group: AgeGroup, locale: AppLocale): Course[] {
  return getCourses(locale).filter((c) => c.ageGroupSlug === group.slug);
}

export function getCourseKinds(locale: AppLocale): CourseKind[] {
  const kinds = new Map<string, CourseKind>();
  const resolved = getCourses(locale);
  readContent().courses.forEach((raw, i) => {
    // Slugs are generated from the English title so they stay stable across
    // locales regardless of which language is currently being viewed.
    const slug = slugifyTitle(raw.title.en);
    const existing = kinds.get(slug);
    if (existing) {
      existing.variants.push(resolved[i]);
    } else {
      kinds.set(slug, { slug, title: resolved[i].title, icon: raw.icon, color: raw.color, variants: [resolved[i]] });
    }
  });
  return Array.from(kinds.values());
}

export function getCourseKind(slug: string, locale: AppLocale): CourseKind | undefined {
  return getCourseKinds(locale).find((kind) => kind.slug === slug);
}
