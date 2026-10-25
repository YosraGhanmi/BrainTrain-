'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import {
  createDbPreinscription,
  createDbPreinscriptionNotification,
  getDbPreinscriptionSetting,
  setDbPreinscriptionSetting,
} from '@/lib/db/preinscriptions';
import { getAgeGroup, getCourse } from '@/lib/coursesData';
import { isSchoolSystem } from '@/lib/preinscription/school-systems';
import type { AppLocale } from '@/i18n/routing';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// Same check as an <input type="email">: something@domain.tld, no spaces
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLocale(formData: FormData): AppLocale {
  return field(formData, 'locale') === 'fr' ? 'fr' : 'en';
}

export async function getRegisterHref(): Promise<'/courses' | '/preinscription'> {
  return (await getDbPreinscriptionSetting()) ? '/preinscription' : '/courses';
}

export async function updatePreinscriptionRouting(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const routeRegisterToForm = field(formData, 'routeRegisterToForm') === 'on';

  await setDbPreinscriptionSetting(routeRegisterToForm);

  revalidatePath('/[locale]', 'layout');
  revalidatePath('/admin/preinscriptions');
  redirect('/admin/preinscriptions?saved=1');
}

export async function submitPreinscription(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const childFullName = field(formData, 'childFullName');
  const childAge = Math.round(Number(field(formData, 'childAge')));
  const institution = field(formData, 'institution');
  const rawSchoolSystem = field(formData, 'schoolSystem');
  // Optional; anything outside the list is dropped rather than stored
  const schoolSystem = isSchoolSystem(rawSchoolSystem) ? rawSchoolSystem : null;
  const parentFullName = field(formData, 'parentFullName');
  const parentPhone = field(formData, 'parentPhone');
  const parentEmail = field(formData, 'parentEmail').toLowerCase();
  const parentPhone2 = field(formData, 'parentPhone2') || null;
  // Only a course that actually exists is recorded, never a free-form value.
  const course = await getCourse(field(formData, 'courseSlug'), locale);
  const courseQuery = course ? `&course=${encodeURIComponent(course.slug)}` : '';

  if (!childFullName || !Number.isFinite(childAge) || childAge < 1 || childAge > 25 || !institution || !parentFullName || !parentPhone || !EMAIL_PATTERN.test(parentEmail)) {
    redirect(`/${locale}/preinscription?error=1${courseQuery}`);
  }

  const ageGroup = course ? await getAgeGroup(course.ageGroupSlug, locale) : undefined;
  const courseTitle = course ? (ageGroup ? `${course.title} (${ageGroup.label})` : course.title) : null;
  await createDbPreinscription({
    childFullName,
    childAge,
    institution,
    schoolSystem,
    parentFullName,
    parentPhone,
    parentEmail,
    parentPhone2,
    courseSlug: course?.slug ?? null,
    courseTitle,
  });
  await createDbPreinscriptionNotification(childFullName, parentFullName, courseTitle);

  revalidatePath('/admin/preinscriptions');
  revalidatePath('/admin');
  redirect(`/${locale}/preinscription?sent=1`);
}

export async function requirePreinscriptionAccess() {
  return requireAdmin();
}
