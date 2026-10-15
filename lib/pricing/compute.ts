import { resolveDbPrice, type PlanType } from '@/lib/db/pricing';
import { readContent } from '@/lib/content/store';
import { summerLaterDueDates } from '@/lib/content/summer';
import { applyDiscount, getFamilyDiscountPercent } from '@/lib/pricing/family-discount';
import type { CourseEntry } from '@/lib/content/types';

// Resolves a course-specific override if the course opted into one, else the
// price its age group defaults to.
export async function resolvePrice(
  planType: PlanType,
  courseSlug: string,
  ageGroupSlug: string,
): Promise<{ amount: number; currency: string }> {
  return resolveDbPrice(planType, courseSlug, ageGroupSlug);
}

// The sibling discount that applies to a course: summer school has its own
export async function familyDiscountSettingFor(course: Pick<CourseEntry, 'summer'>): Promise<number> {
  const content = (await readContent());
  return course.summer ? content.summerSchool.familyDiscountPercent : content.familyDiscountPercent;
}

// What enrolling a child in a course on a plan bills: the discounted amount
// of each payment, and for a monthly summer plan the due dates of the
// season's later months.
export async function quoteEnrollment(
  course: CourseEntry,
  planType: PlanType,
  child: { id: string; parentId: string },
): Promise<{ amount: number; currency: string; discountPercent: number; laterDueDates: Date[] }> {
  const [price, discountPercent] = await Promise.all([
    resolvePrice(planType, course.slug, course.ageGroupSlug),
    familyDiscountSettingFor(course).then((percent) => getFamilyDiscountPercent(child, percent)),
  ]);
  const laterDueDates =
    course.summer && planType === 'MONTHLY' ? summerLaterDueDates((await readContent()).summerSchool, new Date()) : [];
  return { amount: applyDiscount(price.amount, discountPercent), currency: price.currency, discountPercent, laterDueDates };
}
