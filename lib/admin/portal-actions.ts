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
import { parseTeacherCourseSlugs, stringifyTeacherCourseSlugs } from '@/lib/teachers/course-slugs';
import {
  createFirebaseTeacherProfile,
  deleteFirebaseTeacherProfile,
  getFirebaseTeacherProfile,
  updateFirebaseTeacherProfile,
} from '@/lib/firebase/teachers';
import {
  createFirebaseSecretaryProfile,
  deleteFirebaseSecretaryProfile,
  updateFirebaseSecretaryProfile,
} from '@/lib/firebase/secretaries';
import {
  deleteFirebasePortalProfile,
  getFirebasePortalProfile,
  isFirebaseConfigured,
  updateFirebasePortalProfile,
} from '@/lib/firebase/portal-auth';
import { deleteFirebaseChild } from '@/lib/firebase/children';
import {
  createFirebaseCourseSession,
  updateFirebaseCourseSession,
  deleteFirebaseCourseSession,
  getFirebaseCourseSession,
  listFirebaseCourseSessionsByTeacher,
} from '@/lib/firebase/sessions';
import {
  getFirebaseEnrollment,
  listFirebaseEnrollmentsByCourseSession,
  updateFirebaseEnrollmentStatus,
  moveFirebaseEnrollment,
} from '@/lib/firebase/enrollments';
import { getFirebasePayment, updateFirebasePayment } from '@/lib/firebase/enrollments';
import {
  upsertFirebasePricingRule,
  deleteFirebasePricingRulesByAgeGroup,
  deleteFirebasePricingRulesByCourse,
} from '@/lib/firebase/pricing';
import {
  markFirebaseNotificationRead,
  markAllFirebaseNotificationsRead,
} from '@/lib/firebase/notifications';
import { listFirebaseCourseSessions as _listSessions } from '@/lib/firebase/sessions';
import { getFirebaseTimeSlot } from '@/lib/firebase/time-slots';
import { firestore, firebaseAdminAuth } from '@/lib/firebase/admin';
import type { EnrollmentStatus, PlanType } from '@/lib/firebase/enrollments';

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
    await createFirebaseTeacherProfile({
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
  await deleteFirebaseTeacherProfile(userId);
  redirect('/admin/teachers?saved=1');
}

export async function regenerateTeacherSecretCode(userId: string): Promise<void> {
  await requireAdminOnly();
  const profile = await getFirebaseTeacherProfile(userId);
  if (!profile || profile.role !== 'TEACHER') redirect('/admin/teachers?error=1');

  const secretCode = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  const teacherSecretCodeHash = await hashPassword(secretCode);

  await updateFirebaseTeacherProfile(userId, { teacherSecretCodeHash, teacherSecretCode: secretCode });
  await revokeAllSessions(userId);

  redirect(`/admin/teachers?saved=1&code=${secretCode}&email=${encodeURIComponent(profile!.email)}`);
}

export async function addTeacherCourse(teacherId: string, formData: FormData): Promise<void> {
  await requireAdminOnly();
  const courseSlug = field(formData, 'courseSlug');
  if (!courseSlug) redirect('/admin/teachers?courseError=1');

  const profile = await getFirebaseTeacherProfile(teacherId);
  if (profile) {
    const slugs = parseTeacherCourseSlugs(profile.courseSlugs);
    if (!slugs.includes(courseSlug)) {
      await updateFirebaseTeacherProfile(teacherId, {
        courseSlugs: stringifyTeacherCourseSlugs([...slugs, courseSlug]),
      });
    }
  }
  redirect('/admin/teachers?saved=1');
}

export async function removeTeacherCourse(teacherId: string, courseSlug: string): Promise<void> {
  await requireAdminOnly();
  const profile = await getFirebaseTeacherProfile(teacherId);
  if (profile) {
    const slugs = parseTeacherCourseSlugs(profile.courseSlugs);
    await updateFirebaseTeacherProfile(teacherId, {
      courseSlugs: stringifyTeacherCourseSlugs(slugs.filter((s) => s !== courseSlug)),
    });
  }
  redirect('/admin/teachers?saved=1');
}

export async function setTeacherFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateFirebaseTeacherProfile(userId, { isFrozen });
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
    await createFirebaseSecretaryProfile({ email, password, fullName, phone, passwordHash });
  } catch {
    redirect('/admin/secretaries?error=exists');
  }

  redirect('/admin/secretaries?saved=1');
}

export async function deleteSecretary(userId: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebaseSecretaryProfile(userId);
  redirect('/admin/secretaries?saved=1');
}

export async function setSecretaryFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateFirebaseSecretaryProfile(userId, { isFrozen });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/secretaries?saved=1');
}

// ---------------------------------------------------------------------------
// Parents / children (admin: view + prune)
// ---------------------------------------------------------------------------

export async function deleteParent(userId: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebasePortalProfile(userId);
  redirect('/admin/parents?saved=1');
}

export async function setParentFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdminOnly();
  await updateFirebasePortalProfile(userId, { isFrozen });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/parents?saved=1');
}

export async function approveParent(userId: string): Promise<void> {
  await requireAdmin();
  const user = await getFirebasePortalProfile(userId);
  if (!user) redirect('/admin/parents?error=1');
  await updateFirebasePortalProfile(userId, { parentStatus: 'APPROVED' });
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
  await updateFirebasePortalProfile(userId, { parentStatus: 'REJECTED' });
  redirect('/admin/parents?saved=1');
}

export async function deleteChild(childId: string): Promise<void> {
  await requireAdmin();
  await deleteFirebaseChild(childId);
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

  const { getFirebaseTimeSlot: getSlot } = await import('@/lib/firebase/time-slots');
  const slot = timeSlotId ? await getSlot(timeSlotId) : null;

  if (!courseSlug || !location || !slot) {
    redirect('/admin/sessions?error=1');
  }

  // Teacher conflict check
  if (teacherId) {
    const teacherSessions = await listFirebaseCourseSessionsByTeacher(teacherId);
    const others = id ? teacherSessions.filter((s) => s.id !== id) : teacherSessions;
    if (others.some((s) => sessionsConflict(slot!, s))) {
      redirect('/admin/sessions?error=teacherConflict');
    }
  }

  const data = {
    courseSlug,
    teacherId: teacherId || null,
    dayOfWeek: slot!.dayOfWeek,
    startTime: slot!.startTime,
    endTime: slot!.endTime,
    location,
    capacity: DEFAULT_SESSION_CAPACITY,
    term: DEFAULT_SESSION_TERM,
  };

  if (id) {
    await updateFirebaseCourseSession(id, data);
  } else {
    await createFirebaseCourseSession(data);
  }

  redirect('/admin/sessions?saved=1');
}

export async function deleteCourseSession(id: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebaseCourseSession(id);
  redirect('/admin/sessions?saved=1');
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  await requireAdmin();
  await updateFirebaseEnrollmentStatus(id, status);
  revalidatePath('/admin/enrollments');
}

export async function approveEnrollment(enrollmentId: string): Promise<void> {
  await requireAdmin();

  const enrollment = await getFirebaseEnrollment(enrollmentId);
  if (!enrollment) redirect('/admin/enrollments?error=1');

  const sessionDoc = await firestore.collection('course_sessions').doc(enrollment!.courseSessionId).get();
  const childDoc = await firestore.collection('children').doc(enrollment!.childId).get();
  const parentId = childDoc.data()?.parentId as string | undefined;
  const parentDoc = parentId ? await firestore.collection('users').doc(parentId).get() : null;

  // Mark enrollment active
  await updateFirebaseEnrollmentStatus(enrollmentId, 'ACTIVE');

  // Mark all unpaid payments for this enrollment as PAID
  const paymentsSnap = await firestore
    .collection('payments')
    .where('enrollmentId', '==', enrollmentId)
    .where('status', '!=', 'PAID')
    .get();
  const batch = firestore.batch();
  const now = new Date();
  paymentsSnap.docs.forEach((doc) => batch.update(doc.ref, { status: 'PAID', paidAt: now, parentNotifiedAt: null }));
  await batch.commit();

  // Send SMS
  const course = getCourseEntryOrThrow(String(sessionDoc.data()?.courseSlug ?? ''));
  if (parentId && parentDoc) {
    try {
      await sendSms({
        parentId,
        phone: String(parentDoc.data()?.phone ?? ''),
        message: `BrainTrain: ${childDoc.data()?.fullName}'s enrollment in ${course.title.en} is confirmed! See the parent portal for details.`,
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

  const newSession = await getFirebaseCourseSession(newCourseSessionId);
  if (!newSession) redirect('/admin/enrollments?error=1');

  try {
    await moveFirebaseEnrollment(enrollmentId, newCourseSessionId, newSession);
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
  await updateFirebasePayment(id, {
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
      return upsertFirebasePricingRule({ planType, ageGroupSlug, amount, currency });
    }),
  );

  redirect('/admin/pricing?saved=1');
}

export async function clearCoursePricingOverride(courseSlug: string): Promise<void> {
  await requireAdminOnly();
  await deleteFirebasePricingRulesByCourse(courseSlug);
  redirect('/admin/pricing?saved=1');
}

// ---------------------------------------------------------------------------
// Notifications (bell)
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string): Promise<void> {
  await requireAdmin();
  await markFirebaseNotificationRead(id);
  revalidatePath('/admin');
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireAdmin();
  await markAllFirebaseNotificationsRead();
  revalidatePath('/admin');
}
