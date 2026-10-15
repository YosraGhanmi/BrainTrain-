import { prisma } from '@/lib/db/prisma';

// SEASON: one payment for the whole summer school
export type PlanType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'SEASON';

export type DbPricingRule = {
  id: string;
  planType: PlanType;
  ageGroupSlug: string | null;
  courseSlug: string | null;
  amount: number;
  currency: string;
};

export async function listDbPricingRules(): Promise<DbPricingRule[]> {
  const rows = await prisma.pricingRule.findMany();
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

// Upsert a rule by planType + ageGroupSlug or planType + courseSlug
export async function upsertDbPricingRule(input: {
  planType: PlanType;
  ageGroupSlug?: string | null;
  courseSlug?: string | null;
  amount: number;
  currency: string;
}): Promise<void> {
  const data = { amount: input.amount, currency: input.currency };
  if (input.ageGroupSlug) {
    await prisma.pricingRule.upsert({
      where: { planType_ageGroupSlug: { planType: input.planType, ageGroupSlug: input.ageGroupSlug } },
      create: { planType: input.planType, ageGroupSlug: input.ageGroupSlug, ...data },
      update: data,
    });
  } else if (input.courseSlug) {
    await prisma.pricingRule.upsert({
      where: { planType_courseSlug: { planType: input.planType, courseSlug: input.courseSlug } },
      create: { planType: input.planType, courseSlug: input.courseSlug, ...data },
      update: data,
    });
  }
}

export async function deleteDbPricingRulesByAgeGroup(ageGroupSlug: string): Promise<void> {
  await prisma.pricingRule.deleteMany({ where: { ageGroupSlug } });
}

export async function deleteDbPricingRulesByCourse(courseSlug: string): Promise<void> {
  await prisma.pricingRule.deleteMany({ where: { courseSlug } });
}

export async function resolveDbPrice(
  planType: PlanType,
  courseSlug: string,
  ageGroupSlug: string,
): Promise<{ amount: number; currency: string }> {
  // Course-specific override takes priority over age-group default
  const rule =
    (await prisma.pricingRule.findUnique({ where: { planType_courseSlug: { planType, courseSlug } } })) ??
    (await prisma.pricingRule.findUnique({ where: { planType_ageGroupSlug: { planType, ageGroupSlug } } }));
  if (!rule) {
    throw new Error(`No pricing rule found for plan type "${planType}" (course "${courseSlug}", age group "${ageGroupSlug}").`);
  }
  return { amount: Number(rule.amount), currency: rule.currency };
}
