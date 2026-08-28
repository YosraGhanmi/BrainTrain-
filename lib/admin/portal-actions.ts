'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { hashPassword } from '@/lib/portal-auth/password';
import type { PlanType, EnrollmentStatus, PaymentStatus } from '@prisma/client';

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function createTeacher(formData: FormData): Promise<void> {
  requireAdmin();
  const fullName = field(formData, 'fullName');
  const email = field(formData, 'email').toLowerCase();
  const phone = field(formData, 'phone');
  const password = field(formData, 'password');

  if (!fullName || !email || !phone || password.length < 8) {
    redirect('/admin/teachers?error=1');
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) redirect('/admin/teachers?error=exists');

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { fullName, email, phone, passwordHash, role: 'TEACHER', teacher: { create: {} } },
  });

  redirect('/admin/teachers?saved=1');
}

export async function deleteTeacher(userId: string): Promise<void> {
  requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  redirect('/admin/teachers?saved=1');
}

// ---------------------------------------------------------------------------
// Parents / children (admin: view + prune, not full self-registration)
// ---------------------------------------------------------------------------

export async function deleteParent(userId: string): Promise<void> {
  requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  redirect('/admin/parents?saved=1');
}

export async function deleteChild(childId: string): Promise<void> {
  requireAdmin();
  await prisma.child.delete({ where: { id: childId } });
  redirect('/admin/children?saved=1');
}

// ---------------------------------------------------------------------------
// Course sessions (schedule / capacity / teacher assignment)
// ---------------------------------------------------------------------------

export async function upsertCourseSession(formData: FormData): Promise<void> {
  requireAdmin();
  const id = field(formData, 'id');
  const courseSlug = field(formData, 'courseSlug');
  const teacherId = field(formData, 'teacherId');
  const dayOfWeek = Math.min(6, Math.max(0, Math.round(Number(formData.get('dayOfWeek')) || 0)));
  const startTime = field(formData, 'startTime');
  const endTime = field(formData, 'endTime');
  const location = field(formData, 'location');
  const capacity = Math.max(1, Math.round(Number(formData.get('capacity')) || 1));
  const term = field(formData, 'term');

  if (!courseSlug || !startTime || !endTime || !location || !term) {
    redirect('/admin/sessions?error=1');
  }

  const data = {
    courseSlug,
    teacherId: teacherId || null,
    dayOfWeek,
    startTime,
    endTime,
    location,
    capacity,
    term,
  };

  if (id) {
    await prisma.courseSession.update({ where: { id }, data });
  } else {
    await prisma.courseSession.create({ data });
  }

  redirect('/admin/sessions?saved=1');
}

export async function deleteCourseSession(id: string): Promise<void> {
  requireAdmin();
  await prisma.courseSession.delete({ where: { id } });
  redirect('/admin/sessions?saved=1');
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  requireAdmin();
  await prisma.enrollment.update({ where: { id }, data: { status } });
  revalidatePath('/admin/enrollments');
}

// ---------------------------------------------------------------------------
// Payments (manual override — e.g. a cash/offline payment recorded by staff)
// ---------------------------------------------------------------------------

export async function setPaymentStatus(id: string, status: PaymentStatus): Promise<void> {
  requireAdmin();
  await prisma.payment.update({
    where: { id },
    data: { status, paidAt: status === 'PAID' ? new Date() : null },
  });
  revalidatePath('/admin/payments');
}

// ---------------------------------------------------------------------------
// Pricing rules
// ---------------------------------------------------------------------------

export async function upsertPricingRule(formData: FormData): Promise<void> {
  requireAdmin();
  const planType = field(formData, 'planType') as PlanType;
  const courseSlug = field(formData, 'courseSlug'); // '' = default rule for this plan type
  const amount = Math.max(0, Number(formData.get('amount')) || 0);
  const currency = field(formData, 'currency') || 'TND';

  await prisma.pricingRule.upsert({
    where: { planType_courseSlug: { planType, courseSlug } },
    update: { amount, currency },
    create: { planType, courseSlug, amount, currency },
  });

  redirect('/admin/pricing?saved=1');
}

export async function deletePricingRule(id: string): Promise<void> {
  requireAdmin();
  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  // The default (courseSlug === '') rule for each plan type must always
  // exist — resolvePrice() falls back to it whenever no course-specific
  // override is set, and deleting it would break every enrollment on that
  // plan type.
  if (rule && rule.courseSlug !== '') {
    await prisma.pricingRule.delete({ where: { id } });
  }
  redirect('/admin/pricing?saved=1');
}
