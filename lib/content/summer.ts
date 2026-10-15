import type { CourseEntry, SiteContent, SummerSchoolSettings } from './types';
import type { PlanType } from '@/lib/db/pricing';
import { formatDate } from '@/lib/i18n/format';
import type { AppLocale } from '@/i18n/routing';

// School-year courses bill monthly, per term or for the full year; summer
// courses bill monthly or once for the whole season.
export const SCHOOL_YEAR_PLAN_TYPES: PlanType[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
export const SUMMER_PLAN_TYPES: PlanType[] = ['MONTHLY', 'SEASON'];

export function planTypesForCourse(course: Pick<CourseEntry, 'summer'>): PlanType[] {
  return course.summer ? SUMMER_PLAN_TYPES : SCHOOL_YEAR_PLAN_TYPES;
}

// Summer courses only exist for parents and visitors while the admin has the
// summer school open; school-year courses are always offered.
export function isCourseOffered(course: Pick<CourseEntry, 'summer'>, content: Pick<SiteContent, 'summerSchool'>): boolean {
  return !course.summer || content.summerSchool.enabled;
}

export function offeredCourses(content: Pick<SiteContent, 'courses' | 'summerSchool'>): CourseEntry[] {
  return content.courses.filter((course) => isCourseOffered(course, content));
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function summerStart(settings: SummerSchoolSettings): Date {
  return parseIsoDate(settings.startDate);
}

export function summerEnd(settings: SummerSchoolSettings): Date {
  return parseIsoDate(settings.endDate);
}

// "15 Jun – 30 Aug", stored on summer groups as their term
export function summerTerm(settings: SummerSchoolSettings): string {
  const format = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${format(summerStart(settings))} – ${format(summerEnd(settings))}`;
}

// Season dates for parents and visitors: "June 15 – August 30, 2027"
export function formatSummerDates(settings: SummerSchoolSettings, locale: AppLocale): string {
  const start = formatDate(summerStart(settings), locale, { day: 'numeric', month: 'long' });
  const end = formatDate(summerEnd(settings), locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${start} – ${end}`;
}

// True when a calendar day falls inside the summer season
export function isInSummer(settings: SummerSchoolSettings, date: Date): boolean {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return day >= summerStart(settings) && day <= summerEnd(settings);
}

// A monthly summer plan bills once per calendar month of the season: the
// first payment is due on enrollment, the next ones on the 1st of every
// later month the season still runs in.
export function summerLaterDueDates(settings: SummerSchoolSettings, enrolledAt: Date): Date[] {
  const end = summerEnd(settings);
  const from = enrolledAt > summerStart(settings) ? enrolledAt : summerStart(settings);
  const dates: Date[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  while (cursor <= end) {
    dates.push(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return dates;
}
