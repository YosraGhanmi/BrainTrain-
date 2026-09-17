import { firestore } from '@/lib/firebase/admin';
import { listFirebaseBadgesByChild } from '@/lib/firebase/badges';
import { getFirebaseChild, listFirebaseChildren, type FirebaseChild } from '@/lib/firebase/children';
import {
  countFirebaseEnrollmentsByCourseSession,
  getFirebaseEnrollment,
  getFirebaseEnrollmentByChildAndSession,
  getFirebasePaymentPlan,
  listFirebaseEnrollmentsByChild,
  listFirebaseEnrollmentsByCourseSession,
  listFirebasePaymentsByChild,
  listFirebasePaymentsByEnrollment,
  type EnrollmentStatus,
  type FirebaseEnrollment,
  type FirebasePayment,
  type FirebasePaymentPlan,
} from '@/lib/firebase/enrollments';
import { getFirebaseCourseSession, listFirebaseCourseSessions, listFirebaseCourseSessionsByCourse, listFirebaseCourseSessionsByTeacher, type FirebaseCourseSession } from '@/lib/firebase/sessions';
import { listFirebaseTeacherNotesByChild, listFirebaseTeacherNotesByCourseSession, listFirebaseTeacherNotesByEnrollment, type FirebaseTeacherNote } from '@/lib/firebase/teacher-notes';
import { getFirebaseTeacherProfile } from '@/lib/firebase/teachers';

export type EnrollmentWithSession = FirebaseEnrollment & { courseSession: FirebaseCourseSession };
export type SessionWithCount = FirebaseCourseSession & { enrollmentCount: number };
export type ChildWithEnrollments = FirebaseChild & { enrollments: EnrollmentWithSession[] };
export type PaymentWithRelations = FirebasePayment & {
  paymentPlan: FirebasePaymentPlan | null;
  enrollment: EnrollmentWithSession | null;
  child: FirebaseChild | null;
  parentName: string;
};
export type TeacherNoteWithDisplay = FirebaseTeacherNote & { teacherName: string; courseSlug: string };

async function enrollmentWithSession(enrollment: FirebaseEnrollment): Promise<EnrollmentWithSession | null> {
  const courseSession = await getFirebaseCourseSession(enrollment.courseSessionId);
  return courseSession ? { ...enrollment, courseSession } : null;
}

export async function listFirebaseChildrenWithEnrollments(parentId: string): Promise<ChildWithEnrollments[]> {
  const children = await listFirebaseChildren(parentId);
  return Promise.all(
    children.map(async (child) => {
      const enrollments = await listFirebaseEnrollmentsWithSessionsByChild(child.id);
      return { ...child, enrollments };
    }),
  );
}

export async function listFirebaseEnrollmentsWithSessionsByChild(
  childId: string,
  statuses?: EnrollmentStatus[],
): Promise<EnrollmentWithSession[]> {
  const enrollments = await listFirebaseEnrollmentsByChild(childId);
  const filtered = statuses ? enrollments.filter((enrollment) => statuses.includes(enrollment.status)) : enrollments;
  const rows = await Promise.all(filtered.map(enrollmentWithSession));
  return rows.filter((row): row is EnrollmentWithSession => Boolean(row));
}

export async function listFirebaseSessionsWithCountsByCourse(courseSlug: string): Promise<SessionWithCount[]> {
  const sessions = await listFirebaseCourseSessionsByCourse(courseSlug);
  const rows = await Promise.all(
    sessions.map(async (session) => ({
      ...session,
      enrollmentCount: await countFirebaseEnrollmentsByCourseSession(session.id),
    })),
  );
  return rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

export async function listFirebaseSessionsWithCountsByTeacher(teacherId: string): Promise<SessionWithCount[]> {
  const sessions = await listFirebaseCourseSessionsByTeacher(teacherId);
  const rows = await Promise.all(
    sessions.map(async (session) => ({
      ...session,
      enrollmentCount: await countFirebaseEnrollmentsByCourseSession(session.id),
    })),
  );
  return rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

export async function listAllFirebaseSessionsWithCounts(): Promise<SessionWithCount[]> {
  const sessions = await listFirebaseCourseSessions();
  return Promise.all(
    sessions.map(async (session) => ({
      ...session,
      enrollmentCount: await countFirebaseEnrollmentsByCourseSession(session.id),
    })),
  );
}

export async function getFirebaseEnrollmentWithRelations(enrollmentId: string): Promise<{
  enrollment: EnrollmentWithSession;
  child: FirebaseChild;
  teacherName: string | null;
  notes: FirebaseTeacherNote[];
  payments: Array<FirebasePayment & { paymentPlan: FirebasePaymentPlan | null }>;
} | null> {
  const enrollment = await getFirebaseEnrollment(enrollmentId);
  if (!enrollment) return null;
  const [child, courseSession, notes, payments] = await Promise.all([
    getFirebaseChild(enrollment.childId),
    getFirebaseCourseSession(enrollment.courseSessionId),
    listFirebaseTeacherNotesByEnrollment(enrollment.id),
    listFirebasePaymentsByEnrollment(enrollment.id),
  ]);
  if (!child || !courseSession) return null;
  const [teacher, paymentRows] = await Promise.all([
    courseSession.teacherId ? getFirebaseTeacherProfile(courseSession.teacherId) : null,
    Promise.all(payments.map(async (payment) => ({ ...payment, paymentPlan: await getFirebasePaymentPlan(payment.paymentPlanId) }))),
  ]);
  return {
    enrollment: { ...enrollment, courseSession },
    child,
    teacherName: teacher?.fullName ?? null,
    notes,
    payments: paymentRows,
  };
}

export async function listFirebasePaymentsWithRelationsByChild(childId: string): Promise<PaymentWithRelations[]> {
  const payments = await listFirebasePaymentsByChild(childId);
  const rows = await Promise.all(
    payments.map(async (payment) => {
      const [paymentPlan, enrollment] = await Promise.all([
        getFirebasePaymentPlan(payment.paymentPlanId),
        getFirebaseEnrollment(payment.enrollmentId),
      ]);
      const withSession = enrollment ? await enrollmentWithSession(enrollment) : null;
      const child = withSession ? await getFirebaseChild(withSession.childId) : null;
      const parent = child ? await firestore.collection('users').doc(child.parentId).get() : null;
      return {
        ...payment,
        paymentPlan,
        enrollment: withSession,
        child,
        parentName: String(parent?.data()?.fullName ?? ''),
      };
    }),
  );
  return rows;
}

export async function listAllFirebasePaymentsWithRelations(): Promise<PaymentWithRelations[]> {
  const snapshot = await firestore.collection('payments').orderBy('dueDate', 'desc').get();
  const payments = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      paymentPlanId: String(data.paymentPlanId ?? ''),
      enrollmentId: String(data.enrollmentId ?? ''),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? 'TND'),
      dueDate: data.dueDate?.toDate?.() ?? new Date(),
      status: data.status ?? 'PENDING',
      paidAt: data.paidAt?.toDate?.() ?? null,
      parentNotifiedAt: data.parentNotifiedAt?.toDate?.() ?? null,
      stripeSessionId: data.stripeSessionId ? String(data.stripeSessionId) : null,
      stripePaymentIntentId: data.stripePaymentIntentId ? String(data.stripePaymentIntentId) : null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as FirebasePayment;
  });
  return Promise.all(payments.map(async (payment) => (await listFirebasePaymentsWithRelationsByChild((await getFirebaseEnrollment(payment.enrollmentId))?.childId ?? '')).find((row) => row.id === payment.id) ?? {
    ...payment,
    paymentPlan: null,
    enrollment: null,
    child: null,
    parentName: '',
  }));
}

export async function listTeacherNotesForDashboard(childId: string): Promise<TeacherNoteWithDisplay[]> {
  const notes = await listFirebaseTeacherNotesByChild(childId);
  return Promise.all(
    notes.slice(0, 10).map(async (note) => {
      const [teacher, session] = await Promise.all([
        getFirebaseTeacherProfile(note.teacherId),
        getFirebaseCourseSession(note.courseSessionId),
      ]);
      return { ...note, teacherName: teacher?.fullName ?? '', courseSlug: session?.courseSlug ?? '' };
    }),
  );
}

export async function listBadgesForTeacherAndChild(childId: string, teacherId: string) {
  const snapshot = await firestore
    .collection('badges')
    .where('childId', '==', childId)
    .where('teacherId', '==', teacherId)
    .orderBy('awardedAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      childId: String(data.childId ?? ''),
      teacherId: String(data.teacherId ?? ''),
      courseSessionId: data.courseSessionId ? String(data.courseSessionId) : null,
      title: String(data.title ?? ''),
      note: data.note ? String(data.note) : null,
      emoji: String(data.emoji ?? '🏅'),
      imageUrl: data.imageUrl ? String(data.imageUrl) : null,
      awardedAt: data.awardedAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function getFirebaseRosterForSession(sessionId: string): Promise<Array<EnrollmentWithSession & { child: FirebaseChild; badges: Awaited<ReturnType<typeof listFirebaseBadgesByChild>> }>> {
  const session = await getFirebaseCourseSession(sessionId);
  if (!session) return [];
  const enrollments = await listFirebaseEnrollmentsByCourseSession(sessionId);
  const active = enrollments.filter((enrollment) => ['PENDING', 'ACTIVE'].includes(enrollment.status));
  const rows = await Promise.all(
    active.map(async (enrollment) => {
      const [child, badges] = await Promise.all([getFirebaseChild(enrollment.childId), listFirebaseBadgesByChild(enrollment.childId)]);
      return child ? { ...enrollment, courseSession: session, child, badges } : null;
    }),
  );
  return rows.filter((row): row is EnrollmentWithSession & { child: FirebaseChild; badges: Awaited<ReturnType<typeof listFirebaseBadgesByChild>> } => Boolean(row));
}

export async function getFirebaseStudentSessionProfile(childId: string, sessionId: string) {
  const [session, enrollment] = await Promise.all([
    getFirebaseCourseSession(sessionId),
    getFirebaseEnrollmentByChildAndSession(childId, sessionId),
  ]);
  if (!session || !enrollment || !['PENDING', 'ACTIVE'].includes(enrollment.status)) return null;
  const [child, notes, badges] = await Promise.all([
    getFirebaseChild(childId),
    listFirebaseTeacherNotesByCourseSession(sessionId, childId),
    listBadgesForTeacherAndChild(childId, session.teacherId ?? ''),
  ]);
  if (!child) return null;
  return { session, enrollment, child, notes, badges };
}
