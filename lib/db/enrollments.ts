import { prisma } from '@/lib/db/prisma';
import { mapSession, type DbCourseSession } from '@/lib/db/sessions';
import { sessionsConflict } from '@/lib/scheduling/slots';
import type { PlanType } from '@/lib/db/pricing';
import type { Enrollment, Payment, PaymentPlan, Prisma } from '@/lib/generated/prisma/client';

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED';
export type { PlanType };
export type PaymentMethod = 'CASH' | 'CARD' | 'CHEQUE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED';

export type DbPaymentPlan = {
  id: string;
  enrollmentId: string;
  type: PlanType;
  method: PaymentMethod;
  amount: number;
  currency: string;
  // Family (siblings) discount already included in amount, 0 when none
  discountPercent: number;
  startDate: Date;
  createdAt: Date;
};

export type DbPayment = {
  id: string;
  paymentPlanId: string;
  enrollmentId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: PaymentStatus;
  paidAt: Date | null;
  parentNotifiedAt: Date | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: Date;
};

export type DbEnrollment = {
  id: string;
  // '' once the child or the group has been deleted
  childId: string;
  courseSessionId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
};

function mapEnrollment(row: Enrollment): DbEnrollment {
  return {
    id: row.id,
    childId: row.childId ?? '',
    courseSessionId: row.courseSessionId ?? '',
    status: row.status,
    enrolledAt: row.enrolledAt,
  };
}

export function mapPlan(row: PaymentPlan): DbPaymentPlan {
  return { ...row, amount: Number(row.amount), discountPercent: Number(row.discountPercent) };
}

export function mapPayment(row: Payment): DbPayment {
  return { ...row, amount: Number(row.amount) };
}

const OPEN: EnrollmentStatus[] = ['PENDING', 'ACTIVE'];

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function getDbEnrollment(id: string): Promise<DbEnrollment | null> {
  if (!id) return null;
  const row = await prisma.enrollment.findUnique({ where: { id } });
  return row ? mapEnrollment(row) : null;
}

export async function listDbEnrollmentsByChild(childId: string): Promise<DbEnrollment[]> {
  const rows = await prisma.enrollment.findMany({ where: { childId } });
  return rows.map(mapEnrollment);
}

export async function listDbEnrollmentsByCourseSession(courseSessionId: string): Promise<DbEnrollment[]> {
  const rows = await prisma.enrollment.findMany({ where: { courseSessionId } });
  return rows.map(mapEnrollment);
}

export async function getDbEnrollmentByChildAndSession(childId: string, courseSessionId: string): Promise<DbEnrollment | null> {
  const row = await prisma.enrollment.findFirst({ where: { childId, courseSessionId } });
  return row ? mapEnrollment(row) : null;
}

export async function countDbEnrollmentsByCourseSession(
  courseSessionId: string,
  statuses: EnrollmentStatus[] = OPEN,
): Promise<number> {
  return prisma.enrollment.count({
    where: { courseSessionId, ...(statuses.length > 0 ? { status: { in: statuses } } : {}) },
  });
}

export async function listAllDbEnrollments(): Promise<DbEnrollment[]> {
  const rows = await prisma.enrollment.findMany({ orderBy: { enrolledAt: 'desc' } });
  return rows.map(mapEnrollment);
}

export async function countPendingDbEnrollments(): Promise<number> {
  return prisma.enrollment.count({ where: { status: 'PENDING' } });
}

export async function listAllDbPayments(): Promise<DbPayment[]> {
  const rows = await prisma.payment.findMany({ orderBy: { dueDate: 'desc' } });
  return rows.map(mapPayment);
}

export async function listDbPaymentsByChild(childId: string): Promise<DbPayment[]> {
  const rows = await prisma.payment.findMany({ where: { enrollment: { childId } }, orderBy: { dueDate: 'desc' } });
  return rows.map(mapPayment);
}

export async function getDbPaymentPlan(id: string): Promise<DbPaymentPlan | null> {
  if (!id) return null;
  const row = await prisma.paymentPlan.findUnique({ where: { id } });
  return row ? mapPlan(row) : null;
}

export async function updateDbEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  await prisma.enrollment.update({ where: { id }, data: { status } });
}

// ---------------------------------------------------------------------------
// Payment plans
// ---------------------------------------------------------------------------

export async function getDbPaymentPlanByEnrollment(enrollmentId: string): Promise<DbPaymentPlan | null> {
  const row = await prisma.paymentPlan.findFirst({ where: { enrollmentId } });
  return row ? mapPlan(row) : null;
}

export async function listDbPaymentPlansByEnrollment(enrollmentId: string): Promise<DbPaymentPlan[]> {
  const rows = await prisma.paymentPlan.findMany({ where: { enrollmentId } });
  return rows.map(mapPlan);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function getDbPayment(id: string): Promise<DbPayment | null> {
  if (!id) return null;
  const row = await prisma.payment.findUnique({ where: { id } });
  return row ? mapPayment(row) : null;
}

export async function getDbPaymentByStripeSession(stripeSessionId: string): Promise<DbPayment | null> {
  const row = await prisma.payment.findUnique({ where: { stripeSessionId } });
  return row ? mapPayment(row) : null;
}

export async function listDbPaymentsByEnrollment(enrollmentId: string): Promise<DbPayment[]> {
  const rows = await prisma.payment.findMany({ where: { enrollmentId }, orderBy: { dueDate: 'asc' } });
  return rows.map(mapPayment);
}

export async function updateDbPayment(id: string, data: Partial<Omit<DbPayment, 'id' | 'createdAt'>>): Promise<void> {
  await prisma.payment.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Atomic enrollment creation — enrollment + plan + payments in one transaction
// ---------------------------------------------------------------------------

export type CreateEnrollmentInput = {
  childId: string;
  courseSessionId: string;
  session: DbCourseSession;
  planType: PlanType;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  discountPercent?: number;
  // Staff entering an existing enrollment (paper records) activate it directly
  forceActive?: boolean;
  // Due dates of the plan's later payments (monthly summer plans), each for
  // the same amount as the first one
  laterDueDates?: Date[];
};

// Locks the group's row so two parents can't both take its last seat
async function lockSession(tx: Prisma.TransactionClient, courseSessionId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM course_sessions WHERE id = ${courseSessionId} FOR UPDATE`;
}

// Throws DUPLICATE / SCHEDULE_CONFLICT when the child is already in this
// group or in another one at the same day and time
async function assertNoClash(
  tx: Prisma.TransactionClient,
  childId: string,
  session: DbCourseSession,
  ignoreEnrollmentId?: string,
): Promise<void> {
  const others = await tx.enrollment.findMany({
    where: { childId, status: { in: OPEN }, ...(ignoreEnrollmentId ? { id: { not: ignoreEnrollmentId } } : {}) },
    include: { courseSession: true },
  });
  for (const other of others) {
    if (other.courseSessionId === session.id) throw new Error('DUPLICATE');
    if (other.courseSession && sessionsConflict(session, mapSession(other.courseSession))) throw new Error('SCHEDULE_CONFLICT');
  }
}

export async function createDbEnrollment(input: CreateEnrollmentInput): Promise<{ enrollmentId: string; paymentId: string }> {
  return prisma.$transaction(async (tx) => {
    await lockSession(tx, input.courseSessionId);

    const taken = await tx.enrollment.count({ where: { courseSessionId: input.courseSessionId, status: { in: OPEN } } });
    if (taken >= input.session.capacity) throw new Error('CAPACITY_FULL');
    await assertNoClash(tx, input.childId, input.session);

    // Cash/cheque parents just declare they'll pay at the desk, so the seat is
    // theirs right away and the payment stays PENDING until staff mark it paid.
    // Card enrollments stay PENDING until the Stripe webhook activates them.
    const enrollment = await tx.enrollment.create({
      data: {
        childId: input.childId,
        courseSessionId: input.courseSessionId,
        status: input.paymentMethod === 'CARD' && !input.forceActive ? 'PENDING' : 'ACTIVE',
      },
    });

    const plan = await tx.paymentPlan.create({
      data: {
        enrollmentId: enrollment.id,
        type: input.planType,
        method: input.paymentMethod,
        amount: input.amount,
        currency: input.currency,
        discountPercent: input.discountPercent ?? 0,
      },
    });

    const payment = (dueDate: Date) => ({
      paymentPlanId: plan.id,
      enrollmentId: enrollment.id,
      amount: input.amount,
      currency: input.currency,
      dueDate,
    });
    const first = await tx.payment.create({ data: payment(new Date()) });
    if (input.laterDueDates?.length) {
      await tx.payment.createMany({ data: input.laterDueDates.map(payment) });
    }

    return { enrollmentId: enrollment.id, paymentId: first.id };
  });
}

export async function moveDbEnrollment(enrollmentId: string, newCourseSessionId: string, newSession: DbCourseSession): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || !enrollment.childId) throw new Error('NOT_FOUND');

    await lockSession(tx, newCourseSessionId);
    const taken = await tx.enrollment.count({ where: { courseSessionId: newCourseSessionId, status: { in: OPEN } } });
    if (taken >= newSession.capacity) throw new Error('CAPACITY_FULL');
    await assertNoClash(tx, enrollment.childId, newSession, enrollmentId);

    await tx.enrollment.update({ where: { id: enrollmentId }, data: { courseSessionId: newCourseSessionId } });
  });
}

// ---------------------------------------------------------------------------
// Overdue payment flip — called by the cron job
// ---------------------------------------------------------------------------

export async function flipOverduePayments(): Promise<number> {
  const { count } = await prisma.payment.updateMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });
  return count;
}
