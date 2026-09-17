'use server';

import { redirect } from 'next/navigation';
import { requireParent, localizedPath } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { resolvePrice } from '@/lib/pricing/compute';
import {
  createFirebaseEnrollment,
  updateFirebaseEnrollmentStatus,
  getFirebaseEnrollment,
} from '@/lib/firebase/enrollments';
import { getFirebaseCourseSession } from '@/lib/firebase/sessions';
import { getFirebaseChild } from '@/lib/firebase/children';
import type { AppLocale } from '@/i18n/routing';
import type { PlanType, PaymentMethod } from '@/lib/firebase/enrollments';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

const PLAN_TYPES: PlanType[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
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

  if (!PLAN_TYPES.includes(planType)) fail('plan');
  if (!PAYMENT_METHODS.includes(paymentMethod)) fail('method');

  const child = await getFirebaseChild(childId);
  if (!child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }

  const session = await getFirebaseCourseSession(courseSessionId);
  if (!session) fail('session');

  const course = getCourseEntryOrThrow(session!.courseSlug);
  if (course.ageGroupSlug !== child!.ageGroupSlug) fail('ineligible');

  const { amount, currency } = await resolvePrice(planType, session!.courseSlug, course.ageGroupSlug);

  let enrollmentId = '';
  try {
    const result = await createFirebaseEnrollment({
      childId,
      courseSessionId,
      session: session!,
      planType,
      paymentMethod,
      amount,
      currency,
    });
    enrollmentId = result.enrollmentId;
  } catch (err) {
    if (err instanceof Error && err.message === 'CAPACITY_FULL') fail('capacity');
    if (err instanceof Error && err.message === 'SCHEDULE_CONFLICT') fail('conflict');
    if (err instanceof Error && err.message === 'DUPLICATE') fail('duplicate');
    throw err;
  }

  redirect(localizedPath(locale, `/parent-portal/children/${childId}/courses/${enrollmentId}?saved=1`));
}

export async function unenrollChild(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const parent = await requireParent(locale);

  const enrollmentId = field(formData, 'enrollmentId');
  const childId = field(formData, 'childId');

  const detailPath = `/parent-portal/children/${childId}/courses/${enrollmentId}`;

  const enrollment = await getFirebaseEnrollment(enrollmentId);
  const child = enrollment ? await getFirebaseChild(enrollment.childId) : null;
  if (!enrollment || !child || child.parentId !== parent.parentId) {
    redirect(localizedPath(locale, '/parent-portal?error=1'));
  }
  if (enrollment!.status === 'CANCELLED') {
    redirect(localizedPath(locale, `${detailPath}?error=already`));
  }

  await updateFirebaseEnrollmentStatus(enrollmentId, 'CANCELLED');
  redirect(localizedPath(locale, '/parent-portal/courses?unsubscribed=1'));
}
