'use server';

import { redirect } from 'next/navigation';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { quoteEnrollment } from '@/lib/pricing/compute';
import { readContent } from '@/lib/content/store';
import { isCourseOffered, planTypesForCourse } from '@/lib/content/summer';
import {
  createDbEnrollment,
  updateDbEnrollmentStatus,
  getDbEnrollment,
} from '@/lib/db/enrollments';
import { getDbCourseSession } from '@/lib/db/sessions';
import { getDbChild } from '@/lib/db/children';
import { createDbNotification } from '@/lib/db/notifications';
import type { AppLocale } from '@/i18n/routing';
import type { PlanType, PaymentMethod } from '@/lib/db/enrollments';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'CHEQUE'];

export async function enrollChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const childId = field(formData, 'childId');
  const courseSessionId = field(formData, 'courseSessionId');
  const courseSlug = field(formData, 'courseSlug');
  const planType = field(formData, 'planType') as PlanType;
  const paymentMethod = field(formData, 'paymentMethod') as PaymentMethod;

  const detailPath = courseSlug ? `/parent-portal/courses/${courseSlug}` : '/parent-portal/courses';
  const fail = (reason: string) => redirect(localizedPath(locale, `${detailPath}?error=${reason}`));

  if (!PAYMENT_METHODS.includes(paymentMethod)) fail('method');

  const child = await getDbChild(childId);
  if (!child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }

  const session = await getDbCourseSession(courseSessionId);
  if (!session) fail('session');

  const course = await getCourseEntryOrThrow(session!.courseSlug);
  if (course.ageGroupSlug !== child!.ageGroupSlug) fail('ineligible');
  if (!isCourseOffered(course, (await readContent()))) fail('closed');
  if (!planTypesForCourse(course).includes(planType)) fail('plan');

  const { amount, currency, discountPercent, laterDueDates } = await quoteEnrollment(course, planType, child!);

  let enrollmentId = '';
  try {
    const result = await createDbEnrollment({
      childId,
      courseSessionId,
      session: session!,
      planType,
      paymentMethod,
      amount,
      currency,
      discountPercent,
      laterDueDates,
    });
    enrollmentId = result.enrollmentId;
  } catch (err) {
    if (err instanceof Error && err.message === 'CAPACITY_FULL') fail('capacity');
    if (err instanceof Error && err.message === 'SCHEDULE_CONFLICT') fail('conflict');
    if (err instanceof Error && err.message === 'DUPLICATE') fail('duplicate');
    throw err;
  }

  if (paymentMethod !== 'CARD') {
    const methodLabel = paymentMethod === 'CASH' ? 'cash' : 'cheque';
    try {
      await createDbNotification({
        type: 'OFFLINE_PAYMENT_DECLARED',
        title: `${parent.fullName} will pay in ${methodLabel}`,
        body: `${child!.fullName}, ${course.title.en}: ${amount.toFixed(2)} ${currency}${discountPercent ? ` (-${discountPercent}% sibling discount)` : ''} (added to payments as pending)`,
        link: '/admin/payments',
      });
    } catch {
      // Best-effort: the pending payment row is already in the payments table
    }
  }

  redirect(localizedPath(locale, `/parent-portal/children/${childId}/courses/${enrollmentId}?saved=1`));
}

export async function unenrollChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const enrollmentId = field(formData, 'enrollmentId');
  const childId = field(formData, 'childId');

  const detailPath = `/parent-portal/children/${childId}/courses/${enrollmentId}`;

  const enrollment = await getDbEnrollment(enrollmentId);
  const child = enrollment ? await getDbChild(enrollment.childId) : null;
  if (!enrollment || !child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }
  if (enrollment!.status === 'CANCELLED') {
    redirect(localizedPath(locale, `${detailPath}?error=already`));
  }

  await updateDbEnrollmentStatus(enrollmentId, 'CANCELLED');
  redirect(localizedPath(locale, '/parent-portal/courses?unsubscribed=1'));
}
