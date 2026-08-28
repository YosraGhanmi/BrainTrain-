import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

// PLACEHOLDER PRICING — no BrainTrain pricing document was available when
// this system was built. These defaults exist so the enroll → pay flow is
// runnable end-to-end; replace them from /admin/pricing (or re-seed) once
// the real pricing sheet is available. All amounts in TND.
const DEFAULT_PRICING: { planType: PlanType; amount: number }[] = [
  { planType: 'MONTHLY', amount: 120 },
  { planType: 'SEASONAL', amount: 600 },
  { planType: 'COURSE', amount: 90 },
];

async function main() {
  for (const rule of DEFAULT_PRICING) {
    await prisma.pricingRule.upsert({
      where: { planType_courseSlug: { planType: rule.planType, courseSlug: '' } },
      update: {},
      create: { planType: rule.planType, courseSlug: '', amount: rule.amount, currency: 'TND' },
    });
  }
  console.log('Seeded placeholder pricing rules.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
