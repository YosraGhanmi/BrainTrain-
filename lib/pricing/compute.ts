import { prisma } from '@/lib/db/prisma';
import type { PlanType } from '@prisma/client';

// Resolves a course-specific override if the course opted into one, else the
// price its age group defaults to. See prisma/schema.prisma's PricingRule
// comment for how the two are distinguished.
export async function resolvePrice(
  planType: PlanType,
  courseSlug: string,
  ageGroupSlug: string
): Promise<{ amount: number; currency: string }> {
  const override = await prisma.pricingRule.findUnique({
    where: { planType_courseSlug: { planType, courseSlug } },
  });
  if (override) return { amount: Number(override.amount), currency: override.currency };

  const ageGroupDefault = await prisma.pricingRule.findUnique({
    where: { planType_ageGroupSlug: { planType, ageGroupSlug } },
  });
  if (ageGroupDefault) return { amount: Number(ageGroupDefault.amount), currency: ageGroupDefault.currency };

  throw new Error(`No pricing rule found for plan type "${planType}" (course "${courseSlug}", age group "${ageGroupSlug}").`);
}
