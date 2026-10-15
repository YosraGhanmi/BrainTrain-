'use server';

import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminOnly } from '@/lib/admin/guard';
import { hashPassword } from '@/lib/portal-auth/password';
import { revokeAllSessions } from '@/lib/portal-auth/session';
import { DEFAULT_TEACHER_PASSWORD } from '@/lib/admin/teacher-defaults';
import { sendEmail } from '@/lib/email/send';
import { sendSms } from '@/lib/sms/send';
import { absoluteUrl } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { DEFAULT_SESSION_CAPACITY, DEFAULT_SESSION_TERM, sessionsConflict } from '@/lib/scheduling/slots';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { readContent, writeContent } from '@/lib/content/store';
import { parseTeacherCourseSlugs, stringifyTeacherCourseSlugs } from '@/lib/teachers/course-slugs';
import {
  createDbTeacherProfile,
  deleteDbTeacherProfile,
  getDbTeacherProfile,
  updateDbTeacherProfile,
} from '@/lib/db/teachers';
import {
  createDbSecretaryProfile,
  deleteDbSecretaryProfile,
  updateDbSecretaryProfile,
} from '@/lib/db/secretaries';
import {
  deleteDbPortalProfile,
  getDbPortalProfile,
  setDbUserPassword,
  updateDbPortalProfile,
} from '@/lib/db/portal-auth';
import { deleteDbChild, getDbChild } from '@/lib/db/children';
import {
  createDbCourseSession,
  updateDbCourseSession,
  deleteDbCourseSession,
  getDbCourseSession,
  listDbCourseSessionsByTeacher,
} from '@/lib/db/sessions';
import {
  getDbEnrollment,
  listDbEnrollmentsByCourseSession,
  updateDbEnrollmentStatus,
  moveDbEnrollment,
} from '@/lib/db/enrollments';
import { getDbPayment, updateDbPayment } from '@/lib/db/enrollments';
import {
  upsertDbPricingRule,
  deleteDbPricingRulesByAgeGroup,
  deleteDbPricingRulesByCourse,
} from '@/lib/db/pricing';
import {
  markDbNotificationRead,
  markAllDbNotificationsRead,
} from '@/lib/db/notifications';
import { listDbCourseSessions as _listSessions } from '@/lib/db/sessions';
import { getDbTimeSlot } from '@/lib/db/time-slots';
import { prisma } from '@/lib/db/prisma';
import type { EnrollmentStatus, PlanType } from '@/lib/db/enrollments';

const PLAN_TYPES: PlanType[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function createTeacher(formData: FormData): Promise<void> {
  await requireAdmin();
  const fullName = field(formData, 'fullName');
  const email = field(formData, 'email').toLowerCase();
  const phone = field(formData, 'phone');
  const courseSlug = field(formData, 'courseSlug');

  if (!fullName || !email || !phone || !courseSlug) {
    redirect('/admin/teachers?error=1');
  }

  const secretCode = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  const [secretCodeHash] = await Promise.all([hashPassword(secretCode)]);

  try {
    await createDbTeacherProfile({
      email,
      password: DEFAULT_TEACHER_PASSWORD,
      fullName,
      phone,
      courseSlugs: stringifyTeacherCourseSlugs([courseSlug]),
      teacherSecretCodeHash: secretCodeHash,
      teacherSecretCode: secretCode,
    });
  } catch {
    redirect('/admin/teachers?error=exists');
  }

  redirect(`/admin/teachers?saved=1&code=${secretCode}&email=${encodeURIComponent(email)}`);
}

export async function deleteTeacher(userId: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbTeacherProfile(userId);
  redirect('/admin/teachers?saved=1');
}

export async function regenerateTeacherSecretCode(userId: string): Promise<void> {
  await requireAdminOnly();
  const profile = await getDbTeacherProfile(userId);
  if (!profile || profile.role !== 'TEACHER') redirect('/admin/teachers?error=1');

  const secretCode = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  const teacherSecretCodeHash = await hashPassword(secretCode);

  await updateDbTeacherProfile(userId, { teacherSecretCodeHash, teacherSecretCode: secretCode });
  await revokeAllSessions(userId);

  redirect(`/admin/teachers?saved=1&code=${secretCode}&email=${encodeURIComponent(profile!.email)}`);
}

export async function addTeacherCourse(teacherId: string, formData: FormData): Promise<void> {
  await requireAdminOnly();
  const courseSlug = field(formData, 'courseSlug');
  if (!courseSlug) redirect('/admin/teachers?courseError=1');

  const profile = await getDbTeacherProfile(teacherId);
  if (profile) {
    const slugs = parseTeacherCourseSlugs(profile.courseSlugs);
    if (!slugs.includes(courseSlug)) {
      await updateDbTeacherProfile(teacherId, {
        courseSlugs: stringifyTeacherCourseSlugs([...slugs, courseSlug]),
      });
    }
  }
  redirect('/admin/teachers?saved=1');
}

export async function removeTeacherCourse(teacherId: string, courseSlug: string): Promise<void> {
  await requireAdminOnly();
  const profile = await getDbTeacherProfile(teacherId);
  if (profile) {
    const slugs = parseTeacherCourseSlugs(profile.courseSlugs);
    await updateDbTeacherProfile(teacherId, {
      courseSlugs: stringifyTeacherCourseSlugs(slugs.filter((s) => s !== courseSlug)),
    });
  }
  redirect('/admin/teachers?saved=1');
}

export async function setTeacherFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateDbTeacherProfile(userId, { isFrozen });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/teachers?saved=1');
}

// ---------------------------------------------------------------------------
// Secretaries
// ---------------------------------------------------------------------------

export async function createSecretary(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const fullName = field(formData, 'fullName');
  const email = field(formData, 'email').toLowerCase();
  const phone = field(formData, 'phone');
  const password = field(formData, 'password');

  if (!fullName || !email || !phone || password.length < 8) {
    redirect('/admin/secretaries?error=1');
  }

  const passwordHash = await hashPassword(password);
  try {
    await createDbSecretaryProfile({ email, fullName, phone, passwordHash });
  } catch {
    redirect('/admin/secretaries?error=exists');
  }

  redirect('/admin/secretaries?saved=1');
}

export async function deleteSecretary(userId: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbSecretaryProfile(userId);
  redirect('/admin/secretaries?saved=1');
}

export async function setSecretaryFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateDbSecretaryProfile(userId, { isFrozen });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/secretaries?saved=1');
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

const PASSWORD_PAGES = ['/admin/teachers', '/admin/parents', '/admin/secretaries'];

// Sets a new password on a parent, teacher or reception account, e.g. for
// someone locked out, and signs them out everywhere. The admin passes the new
// password on to them.
export async function setAccountPassword(userId: string, formData: FormData): Promise<void> {
  await requireAdminOnly();
  const returnTo = PASSWORD_PAGES.includes(field(formData, 'returnTo')) ? field(formData, 'returnTo') : '/admin';
  const password = field(formData, 'password');
  if (password.length < 8 || !(await getDbPortalProfile(userId))) redirect(`${returnTo}?passwordError=1`);

  await setDbUserPassword(userId, password);
  await revokeAllSessions(userId);
  redirect(`${returnTo}?saved=password`);
}

// ---------------------------------------------------------------------------
// Parents / children (admin: view + prune)
// ---------------------------------------------------------------------------

export async function deleteParent(userId: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbPortalProfile(userId);
  redirect('/admin/parents?saved=1');
}

export async function setParentFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateDbPortalProfile(userId, { isFrozen });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/parents?saved=1');
}

export async function approveParent(userId: string): Promise<void> {
  await requireAdmin();
  const user = await getDbPortalProfile(userId);
  if (!user) redirect('/admin/parents?error=1');
  await updateDbPortalProfile(userId, { parentStatus: 'APPROVED' });
  const loginUrl = absoluteUrl(routing.defaultLocale, '/parent-portal/login');
  await sendEmail({
    to: user!.email,
    subject: 'Welcome to the BrainTrain family!',
    text: `Hello ${user!.fullName}, welcome to the BrainTrain family! Your account is ready now. Sign in here: ${loginUrl}`,
  }).catch(() => undefined);
  redirect('/admin/parents?saved=1');
}

export async function rejectParent(userId: string): Promise<void> {
  await requireAdmin();
  await updateDbPortalProfile(userId, { parentStatus: 'REJECTED' });
  redirect('/admin/parents?saved=1');
}

export async function deleteChild(childId: string): Promise<void> {
  await requireAdmin();
  await deleteDbChild(childId);
  redirect('/admin/children?saved=1');
}

// ---------------------------------------------------------------------------
// Course sessions
// ---------------------------------------------------------------------------

export async function upsertCourseSession(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const id = field(formData, 'id');
  const courseSlug = field(formData, 'courseSlug');
  const teacherId = field(formData, 'teacherId');
  const location = field(formData, 'location');
  const timeSlotId = field(formData, 'timeSlotId');

  const { getDbTimeSlot: getSlot } = await import('@/lib/db/time-slots');
  const slot = timeSlotId ? await getSlot(timeSlotId) : null;

  // Summer groups are managed on the Summer school page
  const summerCourse = (await readContent()).courses.some((c) => c.slug === courseSlug && c.summer);
  if (!courseSlug || !location || !slot || summerCourse) {
    redirect('/admin/sessions?error=1');
  }

  // Teacher conflict check
  if (teacherId) {
    const teacherSessions = await listDbCourseSessionsByTeacher(teacherId);
    const others = id ? teacherSessions.filter((s) => s.id !== id) : teacherSessions;
    if (others.some((s) => sessionsConflict(slot!, s))) {
      redirect('/admin/sessions?error=teacherConflict');
    }
  }

  const data = {
    courseSlug,
    teacherId: teacherId || null,
    dayOfWeek: slot!.dayOfWeek,
    extraDays: [],
    label: '',
    summer: false,
    startTime: slot!.startTime,
    endTime: slot!.endTime,
    location,
    capacity: DEFAULT_SESSION_CAPACITY,
    term: DEFAULT_SESSION_TERM,
  };

  if (id) {
    await updateDbCourseSession(id, data);
  } else {
    await createDbCourseSession(data);
  }

  redirect('/admin/sessions?saved=1');
}

export async function deleteCourseSession(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbCourseSession(id);
  redirect('/admin/sessions?saved=1');
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  await requireAdmin();
  await updateDbEnrollmentStatus(id, status);
  revalidatePath('/admin/enrollments');
}

export async function approveEnrollment(enrollmentId: string): Promise<void> {
  await requireAdmin();

  const enrollment = await getDbEnrollment(enrollmentId);
  if (!enrollment) redirect('/admin/enrollments?error=1');

  const [session, child] = await Promise.all([getDbCourseSession(enrollment!.courseSessionId), getDbChild(enrollment!.childId)]);
  const parent = await getDbPortalProfile(child?.parentId ?? '');

  // Mark enrollment active
  await updateDbEnrollmentStatus(enrollmentId, 'ACTIVE');

  // Mark the enrollment's unpaid payments that are already due as PAID; a
  // monthly summer plan's later months stay pending until their own date
  const now = new Date();
  await prisma.payment.updateMany({
    where: { enrollmentId, status: { not: 'PAID' }, dueDate: { lte: now } },
    data: { status: 'PAID', paidAt: now, parentNotifiedAt: null },
  });

  // Send SMS
  const course = await getCourseEntryOrThrow(session?.courseSlug ?? '');
  if (parent && child) {
    try {
      await sendSms({
        parentId: parent.id,
        phone: parent.phone,
        message: `BrainTrain: ${child.fullName}'s enrollment in ${course.title.en} is confirmed! See the parent portal for details.`,
        purpose: 'ENROLLMENT_APPROVED',
      });
    } catch {
      // Best-effort — parent sees unlocked course regardless
    }
  }

  revalidatePath('/admin/enrollments');
  redirect('/admin/enrollments?saved=1');
}

export async function moveEnrollment(enrollmentId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const newCourseSessionId = field(formData, 'courseSessionId');
  if (!newCourseSessionId) redirect('/admin/enrollments?error=1');

  const newSession = await getDbCourseSession(newCourseSessionId);
  if (!newSession) redirect('/admin/enrollments?error=1');

  try {
    await moveDbEnrollment(enrollmentId, newCourseSessionId, newSession);
  } catch (err) {
    if (err instanceof Error && err.message === 'CAPACITY_FULL') redirect('/admin/enrollments?error=full');
    if (err instanceof Error && err.message === 'SCHEDULE_CONFLICT') redirect('/admin/enrollments?error=conflict');
    throw err;
  }
  redirect('/admin/enrollments?saved=1');
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function setPaymentStatus(id: string, status: 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED'): Promise<void> {
  await requireAdmin();
  await updateDbPayment(id, {
    status,
    paidAt: status === 'PAID' ? new Date() : null,
    parentNotifiedAt: status === 'PAID' ? null : undefined,
  });
  revalidatePath('/admin/payments');
}

// ---------------------------------------------------------------------------
// Pricing rules
// ---------------------------------------------------------------------------

export async function upsertAgeGroupPricing(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const ageGroupSlug = field(formData, 'ageGroupSlug');
  if (!ageGroupSlug) redirect('/admin/pricing?error=1');

  const currency = field(formData, 'currency') || 'TND';
  await Promise.all(
    PLAN_TYPES.map((planType) => {
      const amount = Math.max(0, Number(formData.get(`amount_${planType}`)) || 0);
      return upsertDbPricingRule({ planType, ageGroupSlug, amount, currency });
    }),
  );

  revalidatePath('/[locale]', 'layout');
  redirect('/admin/pricing?saved=1');
}

// Class format and family discount shown on the course pages; the
// discount percent is also what enrollments apply to a family's later children.
export async function updatePricingSettings(formData: FormData): Promise<void> {
  await requireAdminOnly();
  const positive = (name: string) => {
    const value = Number(formData.get(name));
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const sessionHours = positive('sessionHours');
  const maxGroupSize = positive('maxGroupSize');
  const discount = Number(formData.get('familyDiscountPercent'));
  if (!sessionHours || !maxGroupSize || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    redirect('/admin/pricing?error=1');
  }

  const content = (await readContent());
  content.classFormat = {
    sessionHours: sessionHours!,
    maxGroupSize: maxGroupSize!,
  };
  content.familyDiscountPercent = discount;
  await writeContent(content);

  revalidatePath('/[locale]', 'layout');
  redirect('/admin/pricing?saved=1');
}

export async function clearCoursePricingOverride(courseSlug: string): Promise<void> {
  await requireAdminOnly();
  await deleteDbPricingRulesByCourse(courseSlug);
  redirect('/admin/pricing?saved=1');
}

// ---------------------------------------------------------------------------
// Notifications (bell)
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string): Promise<void> {
  await requireAdmin();
  await markDbNotificationRead(id);
  revalidatePath('/admin');
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireAdmin();
  await markAllDbNotificationsRead();
  revalidatePath('/admin');
}
