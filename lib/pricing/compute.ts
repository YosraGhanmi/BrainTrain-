import { prisma } from '@/lib/db/prisma';
import type { PlanType } from '@prisma/client';

// Resolves a course-specific override if one exists, else the plan type's
// default rule (courseSlug === ''). See prisma/schema.prisma's PricingRule
// comment for why '' is used instead of null as the "default" sentinel.
export async function resolvePrice(planType: PlanType, courseSlug: string): Promise<{ amount: number; currency: string }> {
  const override = await prisma.pricingRule.findUnique({
    where: { planType_courseSlug: { planType, courseSlug } },
  });
  if (override) return { amount: Number(override.amount), currency: override.currency };

  const fallback = await prisma.pricingRule.findUnique({
    where: { planType_courseSlug: { planType, courseSlug: '' } },
  });
  if (fallback) return { amount: Number(fallback.amount), currency: fallback.currency };

  throw new Error(`No pricing rule found for plan type "${planType}" and no default rule is configured.`);
}
