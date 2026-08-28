'use server';

import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { resolvePrice } from '@/lib/pricing/compute';
import type { AppLocale } from '@/i18n/routing';
import type { PlanType } from '@prisma/client';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

const PLAN_TYPES: PlanType[] = ['MONTHLY', 'SEASONAL', 'COURSE'];

export async function enrollChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const childId = field(formData, 'childId');
  const courseSessionId = field(formData, 'courseSessionId');
  const planType = field(formData, 'planType') as PlanType;

  const fail = (reason: string) =>
    redirect(localizedPath(locale, `/parent-portal/children/${childId}/enroll?error=${reason}`));

  if (!PLAN_TYPES.includes(planType)) fail('plan');

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }

  const session = await prisma.courseSession.findUnique({ where: { id: courseSessionId } });
  if (!session) fail('session');

  const course = getCourseEntryOrThrow(session!.courseSlug);
  if (course.ageGroupSlug !== child!.ageGroupSlug) fail('ineligible');

  try {
    await prisma.$transaction(async (tx) => {
      const activeCount = await tx.enrollment.count({
        where: { courseSessionId, status: { in: ['PENDING', 'ACTIVE'] } },
      });
      if (activeCount >= session!.capacity) {
        throw new Error('CAPACITY_FULL');
      }

      const { amount, currency } = await resolvePrice(planType, session!.courseSlug);

      const enrollment = await tx.enrollment.create({
        data: { childId: childId, courseSessionId, status: 'PENDING' },
      });

      const paymentPlan = await tx.paymentPlan.create({
        data: { enrollmentId: enrollment.id, type: planType, amount, currency },
      });

      // Only the first payment is generated here — for MONTHLY plans,
      // subsequent months' Payment rows are created from /admin/payments as
      // each billing period opens, keeping this transaction fast and simple.
      await tx.payment.create({
        data: { paymentPlanId: paymentPlan.id, enrollmentId: enrollment.id, amount, currency, dueDate: new Date(), status: 'PENDING' },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'CAPACITY_FULL') fail('capacity');
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') fail('duplicate');
    throw err;
  }

  redirect(localizedPath(locale, `/parent-portal/children/${childId}?saved=1`));
}
