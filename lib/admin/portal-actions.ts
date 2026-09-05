'use server';

import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { hashPassword } from '@/lib/portal-auth/password';
import { revokeAllSessions } from '@/lib/portal-auth/session';
import { DEFAULT_TEACHER_PASSWORD } from '@/lib/admin/teacher-defaults';
import { sendEmail } from '@/lib/email/send';
import { SCHOOL_TIME_SLOTS, DEFAULT_SESSION_CAPACITY, DEFAULT_SESSION_TERM } from '@/lib/scheduling/slots';
import { Prisma } from '@prisma/client';
import type { PlanType, EnrollmentStatus, PaymentStatus } from '@prisma/client';

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

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) redirect('/admin/teachers?error=exists');

  const secretCode = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  const [passwordHash, teacherSecretCodeHash] = await Promise.all([
    hashPassword(DEFAULT_TEACHER_PASSWORD),
    hashPassword(secretCode),
  ]);

  await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      role: 'TEACHER',
      teacherSecretCodeHash,
      teacher: { create: { courseSlugs: [courseSlug] } },
    },
  });

  redirect(`/admin/teachers?saved=1&code=${secretCode}&email=${encodeURIComponent(email)}`);
}

export async function deleteTeacher(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  redirect('/admin/teachers?saved=1');
}

export async function addTeacherCourse(teacherId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const courseSlug = field(formData, 'courseSlug');
  if (!courseSlug) redirect('/admin/teachers?courseError=1');

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (teacher && !teacher.courseSlugs.includes(courseSlug)) {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { courseSlugs: [...teacher.courseSlugs, courseSlug] },
    });
  }
  redirect('/admin/teachers?saved=1');
}

export async function removeTeacherCourse(teacherId: string, courseSlug: string): Promise<void> {
  await requireAdmin();
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (teacher) {
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { courseSlugs: teacher.courseSlugs.filter((s) => s !== courseSlug) },
    });
  }
  redirect('/admin/teachers?saved=1');
}

export async function setTeacherFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isFrozen } });
  // Freezing kicks the account out of any active session immediately.
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/teachers?saved=1');
}

// ---------------------------------------------------------------------------
// Secretaries
// ---------------------------------------------------------------------------

export async function createSecretary(formData: FormData): Promise<void> {
  await requireAdmin();
  const fullName = field(formData, 'fullName');
  const email = field(formData, 'email').toLowerCase();
  const phone = field(formData, 'phone');
  const password = field(formData, 'password');

  if (!fullName || !email || !phone || password.length < 8) {
    redirect('/admin/secretaries?error=1');
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) redirect('/admin/secretaries?error=exists');

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { fullName, email, phone, passwordHash, role: 'SECRETARY' },
  });

  redirect('/admin/secretaries?saved=1');
}

export async function deleteSecretary(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  redirect('/admin/secretaries?saved=1');
}

export async function setSecretaryFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isFrozen } });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/secretaries?saved=1');
}

// ---------------------------------------------------------------------------
// Parents / children (admin: view + prune, not full self-registration)
// ---------------------------------------------------------------------------

export async function deleteParent(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  redirect('/admin/parents?saved=1');
}

export async function setParentFrozen(userId: string, isFrozen: boolean): Promise<void> {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isFrozen } });
  if (isFrozen) await revokeAllSessions(userId);
  redirect('/admin/parents?saved=1');
}

export async function approveParent(userId: string): Promise<void> {
  await requireAdmin();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { parent: { update: { status: 'APPROVED' } } },
  });
  await sendEmail({
    to: user.email,
    subject: 'Your BrainTrain account has been approved',
    text: 'Your account is accepted, you can log in now.',
  }).catch(() => undefined);
  redirect('/admin/parents?saved=1');
}

export async function rejectParent(userId: string): Promise<void> {
  await requireAdmin();
  // Left in place (not deleted) so a future login attempt shows the
  // "see the admin" message instead of a generic "wrong email/password".
  await prisma.user.update({
    where: { id: userId },
    data: { parent: { update: { status: 'REJECTED' } } },
  });
  redirect('/admin/parents?saved=1');
}

export async function deleteChild(childId: string): Promise<void> {
  await requireAdmin();
  await prisma.child.delete({ where: { id: childId } });
  redirect('/admin/children?saved=1');
}

// ---------------------------------------------------------------------------
// Course sessions (schedule / capacity / teacher assignment)
// ---------------------------------------------------------------------------

export async function upsertCourseSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = field(formData, 'id');
  const courseSlug = field(formData, 'courseSlug');
  const teacherId = field(formData, 'teacherId');
  const location = field(formData, 'location');
  const slotIndex = Number(formData.get('slotIndex'));
  const slot = SCHOOL_TIME_SLOTS[slotIndex];

  if (!courseSlug || !location || !slot) {
    redirect('/admin/sessions?error=1');
  }

  // Every group runs on the school's fixed timetable, the same 12-seat
  // capacity, and the same 15 Sep – 15 Jun school year — none of that is set
  // per session, only which slot and which room/teacher.
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
    await prisma.courseSession.update({ where: { id }, data });
  } else {
    await prisma.courseSession.create({ data });
  }

  redirect('/admin/sessions?saved=1');
}

export async function deleteCourseSession(id: string): Promise<void> {
  await requireAdmin();
  await prisma.courseSession.delete({ where: { id } });
  redirect('/admin/sessions?saved=1');
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  await requireAdmin();
  await prisma.enrollment.update({ where: { id }, data: { status } });
  revalidatePath('/admin/enrollments');
}

// Moves a child from one group (CourseSession) to another for the same
// course — e.g. a scheduling conflict comes up after enrollment. Blocked if
// the destination is already at capacity.
export async function moveEnrollment(enrollmentId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const newCourseSessionId = field(formData, 'courseSessionId');
  if (!newCourseSessionId) redirect('/admin/enrollments?error=1');

  const [enrollment, destination] = await Promise.all([
    prisma.enrollment.findUnique({ where: { id: enrollmentId } }),
    prisma.courseSession.findUnique({
      where: { id: newCourseSessionId },
      include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
    }),
  ]);
  if (!enrollment || !destination) redirect('/admin/enrollments?error=1');
  if (destination!._count.enrollments >= destination!.capacity) {
    redirect('/admin/enrollments?error=full');
  }

  try {
    await prisma.enrollment.update({ where: { id: enrollmentId }, data: { courseSessionId: newCourseSessionId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect('/admin/enrollments?error=duplicate');
    }
    throw err;
  }
  redirect('/admin/enrollments?saved=1');
}

// ---------------------------------------------------------------------------
// Payments (manual override — e.g. a cash/offline payment recorded by staff)
// ---------------------------------------------------------------------------

export async function setPaymentStatus(id: string, status: PaymentStatus): Promise<void> {
  await requireAdmin();
  await prisma.payment.update({
    where: { id },
    data: { status, paidAt: status === 'PAID' ? new Date() : null },
  });
  revalidatePath('/admin/payments');
}

// ---------------------------------------------------------------------------
// Pricing rules
// ---------------------------------------------------------------------------

export async function upsertAgeGroupPricing(formData: FormData): Promise<void> {
  await requireAdmin();
  const ageGroupSlug = field(formData, 'ageGroupSlug');
  if (!ageGroupSlug) redirect('/admin/pricing?error=1');

  const currency = field(formData, 'currency') || 'TND';
  await Promise.all(
    PLAN_TYPES.map((planType) => {
      const amount = Math.max(0, Number(formData.get(`amount_${planType}`)) || 0);
      return prisma.pricingRule.upsert({
        where: { planType_ageGroupSlug: { planType, ageGroupSlug } },
        update: { amount, currency },
        create: { planType, ageGroupSlug, amount, currency },
      });
    })
  );

  redirect('/admin/pricing?saved=1');
}

// Reverts a course back to its age group's default pricing — same effect as
// checking "use default" in the Courses admin form, offered here too since
// this is where all the course-specific overrides are visible at a glance.
export async function clearCoursePricingOverride(courseSlug: string): Promise<void> {
  await requireAdmin();
  await prisma.pricingRule.deleteMany({ where: { courseSlug } });
  redirect('/admin/pricing?saved=1');
}
