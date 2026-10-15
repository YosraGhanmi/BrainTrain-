import { prisma } from '@/lib/db/prisma';
import { ageGroupSlugForBirthDate, listAgeGroupEntries } from '@/lib/content/lookup';
import { getDbChild, listDbChildren, type DbChild, type PastClass } from '@/lib/db/children';
import { mapPayment, mapPlan, type DbEnrollment, type DbPayment, type DbPaymentPlan, type EnrollmentStatus } from '@/lib/db/enrollments';
import { mapSession, type DbCourseSession } from '@/lib/db/sessions';
import { listDbTeacherNotesByChild, listDbTeacherNotesByCourseSession, listDbTeacherNotesByEnrollment, type DbTeacherNote } from '@/lib/db/teacher-notes';
import { listDbBadgesForTeacherAndChild, type DbBadge } from '@/lib/db/badges';
import type { AgeGroupEntry } from '@/lib/content/types';
import type { Child, CourseSession, Enrollment, Prisma } from '@/lib/generated/prisma/client';

export type EnrollmentWithSession = DbEnrollment & { courseSession: DbCourseSession };
export type SessionWithCount = DbCourseSession & { enrollmentCount: number };
export type ChildWithEnrollments = DbChild & { enrollments: EnrollmentWithSession[] };
export type PaymentWithRelations = DbPayment & {
  paymentPlan: DbPaymentPlan | null;
  enrollment: EnrollmentWithSession | null;
  child: DbChild | null;
  parentName: string;
};
export type TeacherNoteWithDisplay = DbTeacherNote & { teacherName: string; courseSlug: string };

const OPEN: EnrollmentStatus[] = ['PENDING', 'ACTIVE'];

// Enrollments whose group was deleted have no session and are left out, as
// they were before
function withSession(row: Enrollment & { courseSession: CourseSession | null }): EnrollmentWithSession | null {
  if (!row.courseSession) return null;
  return {
    id: row.id,
    childId: row.childId ?? '',
    courseSessionId: row.courseSessionId ?? '',
    status: row.status,
    enrolledAt: row.enrolledAt,
    courseSession: mapSession(row.courseSession),
  };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

// Same mapping as lib/db/children, for rows already loaded through a join
function mapJoinedChild(row: Child, ageGroups: AgeGroupEntry[]): DbChild {
  return {
    id: row.id,
    parentId: row.parentId ?? '',
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    ageGroupSlug: ageGroupSlugForBirthDate(row.dateOfBirth, ageGroups) ?? row.ageGroupSlug,
    institution: row.institution,
    specialNeeds: row.specialNeeds,
    photoUrl: row.photoUrl,
    photoColor: row.photoColor,
    claimCode: row.claimCode,
    pastClasses: Array.isArray(row.pastClasses) ? (row.pastClasses as PastClass[]) : [],
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    registeredAt: row.registeredAt,
    createdAt: row.createdAt,
  };
}

async function withCounts(sessions: CourseSession[]): Promise<SessionWithCount[]> {
  const counts = await prisma.enrollment.groupBy({
    by: ['courseSessionId'],
    where: { courseSessionId: { in: sessions.map((s) => s.id) }, status: { in: OPEN } },
    _count: { _all: true },
  });
  const countBySession = new Map(counts.map((c) => [c.courseSessionId, c._count._all]));
  return sessions.map((s) => ({ ...mapSession(s), enrollmentCount: countBySession.get(s.id) ?? 0 }));
}

const bySchedule = (a: DbCourseSession, b: DbCourseSession) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime);

export async function listDbChildrenWithEnrollments(parentId: string): Promise<ChildWithEnrollments[]> {
  const children = await listDbChildren(parentId);
  return Promise.all(
    children.map(async (child) => ({ ...child, enrollments: await listDbEnrollmentsWithSessionsByChild(child.id) })),
  );
}

export async function listDbEnrollmentsWithSessionsByChild(
  childId: string,
  statuses?: EnrollmentStatus[],
): Promise<EnrollmentWithSession[]> {
  const rows = await prisma.enrollment.findMany({
    where: { childId, ...(statuses ? { status: { in: statuses } } : {}) },
    include: { courseSession: true },
  });
  return rows.map(withSession).filter(isPresent);
}

export async function listDbSessionsWithCountsByCourse(courseSlug: string): Promise<SessionWithCount[]> {
  const sessions = await prisma.courseSession.findMany({ where: { courseSlug } });
  return (await withCounts(sessions)).sort(bySchedule);
}

export async function listDbSessionsWithCountsByTeacher(teacherId: string): Promise<SessionWithCount[]> {
  const sessions = await prisma.courseSession.findMany({ where: { teacherId } });
  return (await withCounts(sessions)).sort(bySchedule);
}

export async function listAllDbSessionsWithCounts(): Promise<SessionWithCount[]> {
  const sessions = await prisma.courseSession.findMany({ orderBy: { courseSlug: 'asc' } });
  return withCounts(sessions);
}

export async function getDbEnrollmentWithRelations(enrollmentId: string): Promise<{
  enrollment: EnrollmentWithSession;
  child: DbChild;
  teacherName: string | null;
  notes: DbTeacherNote[];
  payments: Array<DbPayment & { paymentPlan: DbPaymentPlan | null }>;
} | null> {
  const row = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      courseSession: { include: { teacher: { select: { fullName: true } } } },
      payments: { include: { paymentPlan: true }, orderBy: { dueDate: 'asc' } },
    },
  });
  const enrollment = row ? withSession(row) : null;
  if (!row || !enrollment || !row.childId) return null;

  const [child, notes] = await Promise.all([getDbChild(row.childId), listDbTeacherNotesByEnrollment(row.id)]);
  if (!child) return null;
  return {
    enrollment,
    child,
    teacherName: row.courseSession?.teacher?.fullName ?? null,
    notes,
    payments: row.payments.map((p) => ({ ...mapPayment(p), paymentPlan: mapPlan(p.paymentPlan) })),
  };
}

const PAYMENT_RELATIONS = {
  paymentPlan: true,
  enrollment: {
    include: {
      courseSession: true,
      child: { include: { parent: { select: { fullName: true } } } },
    },
  },
} as const;

async function listPaymentsWithRelations(where: Prisma.PaymentWhereInput): Promise<PaymentWithRelations[]> {
  const [rows, ageGroups] = await Promise.all([
    prisma.payment.findMany({ where, include: PAYMENT_RELATIONS, orderBy: { dueDate: 'desc' } }),
    listAgeGroupEntries(),
  ]);
  return rows.map((row) => {
    const child = row.enrollment.child;
    return {
      ...mapPayment(row),
      paymentPlan: mapPlan(row.paymentPlan),
      enrollment: withSession(row.enrollment),
      child: child ? mapJoinedChild(child, ageGroups) : null,
      parentName: child?.parent?.fullName ?? '',
    };
  });
}

export async function listDbPaymentsWithRelationsByChild(childId: string): Promise<PaymentWithRelations[]> {
  return listPaymentsWithRelations({ enrollment: { childId } });
}

export async function listAllDbPaymentsWithRelations(): Promise<PaymentWithRelations[]> {
  return listPaymentsWithRelations({});
}

export async function listTeacherNotesForDashboard(childId: string): Promise<TeacherNoteWithDisplay[]> {
  const notes = (await listDbTeacherNotesByChild(childId)).slice(0, 10);
  const [teachers, sessions] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: notes.map((n) => n.teacherId).filter(Boolean) } }, select: { id: true, fullName: true } }),
    prisma.courseSession.findMany({
      where: { id: { in: notes.map((n) => n.courseSessionId).filter(Boolean) } },
      select: { id: true, courseSlug: true },
    }),
  ]);
  const teacherName = new Map(teachers.map((t) => [t.id, t.fullName]));
  const courseSlug = new Map(sessions.map((s) => [s.id, s.courseSlug]));
  return notes.map((note) => ({
    ...note,
    teacherName: teacherName.get(note.teacherId) ?? '',
    courseSlug: courseSlug.get(note.courseSessionId) ?? '',
  }));
}

export async function listBadgesForTeacherAndChild(childId: string, teacherId: string): Promise<DbBadge[]> {
  return listDbBadgesForTeacherAndChild(childId, teacherId);
}

export async function getDbRosterForSession(
  sessionId: string,
): Promise<Array<EnrollmentWithSession & { child: DbChild; badges: DbBadge[] }>> {
  const [rows, ageGroups] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseSessionId: sessionId, status: { in: OPEN } },
      include: { courseSession: true, child: { include: { badges: { orderBy: { awardedAt: 'desc' } } } } },
    }),
    listAgeGroupEntries(),
  ]);
  return rows
    .map((row) => {
      const enrollment = withSession(row);
      if (!enrollment || !row.child) return null;
      const badges = row.child.badges.map((b) => ({ ...b, teacherId: b.teacherId ?? '' }));
      return { ...enrollment, child: mapJoinedChild(row.child, ageGroups), badges };
    })
    .filter(isPresent);
}

export async function getDbStudentSessionProfile(childId: string, sessionId: string) {
  const row = await prisma.enrollment.findFirst({
    where: { childId, courseSessionId: sessionId, status: { in: OPEN } },
    include: { courseSession: true },
  });
  const enrollment = row ? withSession(row) : null;
  if (!enrollment) return null;
  const session = enrollment.courseSession;
  const [child, notes, badges] = await Promise.all([
    getDbChild(childId),
    listDbTeacherNotesByCourseSession(sessionId, childId),
    listDbBadgesForTeacherAndChild(childId, session.teacherId ?? ''),
  ]);
  if (!child) return null;
  return { session, enrollment, child, notes, badges };
}
