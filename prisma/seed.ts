import { PrismaClient, PlanType } from '@prisma/client';
import { readContent } from '../lib/content/store';
import { DEFAULT_TIME_SLOTS, DEFAULT_SESSION_CAPACITY, DEFAULT_SESSION_TERM } from '../lib/scheduling/slots';

const prisma = new PrismaClient();

// Default monthly / 3-months / full-year (15 Sep – 15 Jun) pricing per age
// group. A course rides its age group's rate unless the admin sets a
// course-specific override on the Courses page — see resolvePrice(). All
// amounts in TND.
const AGE_GROUP_PRICING: Record<string, Record<PlanType, number>> = {
  '4-5': { MONTHLY: 90, QUARTERLY: 240, YEARLY: 700 },
  '6-9': { MONTHLY: 110, QUARTERLY: 300, YEARLY: 810 },
  '10-13': { MONTHLY: 110, QUARTERLY: 300, YEARLY: 810 },
  '14-18': { MONTHLY: 150, QUARTERLY: 420, YEARLY: 1200 },
};

async function main() {
  for (const [ageGroupSlug, prices] of Object.entries(AGE_GROUP_PRICING)) {
    for (const [planType, amount] of Object.entries(prices) as [PlanType, number][]) {
      await prisma.pricingRule.upsert({
        where: { planType_ageGroupSlug: { planType, ageGroupSlug } },
        update: { amount },
        create: { planType, ageGroupSlug, amount, currency: 'TND' },
      });
    }
  }
  console.log('Seeded default age-group pricing rules.');

  // The named time slots (G1, G2, ...) course sessions are picked from —
  // editable afterwards from /admin/time-slots.
  for (const slot of DEFAULT_TIME_SLOTS) {
    await prisma.timeSlot.upsert({
      where: { label: slot.label },
      update: { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
      create: { label: slot.label, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
    });
  }
  console.log(`Seeded ${DEFAULT_TIME_SLOTS.length} time slot(s).`);

  // Every course opens with all 10 of the school's standard groups (same
  // fixed timetable, 12-seat capacity, 15 Sep – 15 Jun term for every
  // course) — admins can delete/edit individual groups afterwards from
  // /admin/sessions, this just gives every course a full schedule to start.
  const { courses } = readContent();
  const existingSessions = await prisma.courseSession.findMany({
    select: { courseSlug: true, dayOfWeek: true, startTime: true, endTime: true },
  });
  const existingKey = (s: { courseSlug: string; dayOfWeek: number; startTime: string; endTime: string }) =>
    `${s.courseSlug}|${s.dayOfWeek}|${s.startTime}|${s.endTime}`;
  const existingKeys = new Set(existingSessions.map(existingKey));

  let created = 0;
  for (const course of courses) {
    for (const slot of DEFAULT_TIME_SLOTS) {
      const key = existingKey({ courseSlug: course.slug, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime });
      if (existingKeys.has(key)) continue;

      await prisma.courseSession.create({
        data: {
          courseSlug: course.slug,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: 'BrainTrain Center',
          capacity: DEFAULT_SESSION_CAPACITY,
          term: DEFAULT_SESSION_TERM,
        },
      });
      existingKeys.add(key);
      created++;
    }
  }
  console.log(`Seeded ${created} course session group(s) across ${courses.length} course(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
