import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';
import type { FirebaseCourseSession } from '@/lib/firebase/sessions';
import { sessionsConflict } from '@/lib/scheduling/slots';

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED';
export type PlanType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type PaymentMethod = 'CASH' | 'CARD' | 'CHEQUE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'FAILED';

export type FirebasePaymentPlan = {
  id: string;
  enrollmentId: string;
  type: PlanType;
  method: PaymentMethod;
  amount: number;
  currency: string;
  startDate: Date;
  createdAt: Date;
};

export type FirebasePayment = {
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

export type FirebaseEnrollment = {
  id: string;
  childId: string;
  courseSessionId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
};

function mapEnrollment(id: string, data: DocumentData): FirebaseEnrollment {
  return {
    id,
    childId: String(data.childId ?? ''),
    courseSessionId: String(data.courseSessionId ?? ''),
    status: (data.status as EnrollmentStatus) ?? 'PENDING',
    enrolledAt: data.enrolledAt?.toDate?.() ?? new Date(),
  };
}

function mapPlan(id: string, data: DocumentData): FirebasePaymentPlan {
  return {
    id,
    enrollmentId: String(data.enrollmentId ?? ''),
    type: (data.type as PlanType) ?? 'MONTHLY',
    method: (data.method as PaymentMethod) ?? 'CASH',
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'TND'),
    startDate: data.startDate?.toDate?.() ?? new Date(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

function mapPayment(id: string, data: DocumentData): FirebasePayment {
  return {
    id,
    paymentPlanId: String(data.paymentPlanId ?? ''),
    enrollmentId: String(data.enrollmentId ?? ''),
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'TND'),
    dueDate: data.dueDate?.toDate?.() ?? new Date(),
    status: (data.status as PaymentStatus) ?? 'PENDING',
    paidAt: data.paidAt?.toDate?.() ?? null,
    parentNotifiedAt: data.parentNotifiedAt?.toDate?.() ?? null,
    stripeSessionId: data.stripeSessionId ? String(data.stripeSessionId) : null,
    stripePaymentIntentId: data.stripePaymentIntentId ? String(data.stripePaymentIntentId) : null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const enrollments = () => firestore.collection('enrollments');
const paymentPlans = () => firestore.collection('payment_plans');
const payments = () => firestore.collection('payments');

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function getFirebaseEnrollment(id: string): Promise<FirebaseEnrollment | null> {
  const doc = await enrollments().doc(id).get();
  if (!doc.exists) return null;
  return mapEnrollment(doc.id, doc.data() ?? {});
}

export async function listFirebaseEnrollmentsByChild(childId: string): Promise<FirebaseEnrollment[]> {
  const snapshot = await enrollments().where('childId', '==', childId).get();
  return snapshot.docs.map((doc) => mapEnrollment(doc.id, doc.data()));
}

export async function listFirebaseEnrollmentsByCourseSession(courseSessionId: string): Promise<FirebaseEnrollment[]> {
  const snapshot = await enrollments().where('courseSessionId', '==', courseSessionId).get();
  return snapshot.docs.map((doc) => mapEnrollment(doc.id, doc.data()));
}

export async function listAllFirebaseEnrollments(): Promise<FirebaseEnrollment[]> {
  const snapshot = await enrollments().orderBy('enrolledAt', 'desc').get();
  return snapshot.docs.map((doc) => mapEnrollment(doc.id, doc.data()));
}

export async function updateFirebaseEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<void> {
  await enrollments().doc(id).update({ status });
}

// ---------------------------------------------------------------------------
// Payment plans
// ---------------------------------------------------------------------------

export async function getFirebasePaymentPlanByEnrollment(enrollmentId: string): Promise<FirebasePaymentPlan | null> {
  const snapshot = await paymentPlans().where('enrollmentId', '==', enrollmentId).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapPlan(doc.id, doc.data());
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function getFirebasePayment(id: string): Promise<FirebasePayment | null> {
  const doc = await payments().doc(id).get();
  if (!doc.exists) return null;
  return mapPayment(doc.id, doc.data() ?? {});
}

export async function getFirebasePaymentByStripeSession(stripeSessionId: string): Promise<FirebasePayment | null> {
  const snapshot = await payments().where('stripeSessionId', '==', stripeSessionId).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapPayment(doc.id, doc.data());
}

export async function listFirebasePaymentsByEnrollment(enrollmentId: string): Promise<FirebasePayment[]> {
  const snapshot = await payments().where('enrollmentId', '==', enrollmentId).orderBy('dueDate', 'asc').get();
  return snapshot.docs.map((doc) => mapPayment(doc.id, doc.data()));
}

export async function listOverdueFirebasePayments(): Promise<Array<FirebasePayment & { parentPhone: string; parentId: string; childName: string }>> {
  const snapshot = await payments().where('status', 'in', ['PENDING', 'OVERDUE']).get();
  const all = snapshot.docs.map((doc) => mapPayment(doc.id, doc.data()));
  // Enrich with parent phone and child name by fetching related docs
  const enriched = await Promise.all(
    all.map(async (payment) => {
      const enrollmentDoc = await enrollments().doc(payment.enrollmentId).get();
      const childId = enrollmentDoc.data()?.childId as string | undefined;
      const childDoc = childId ? await firestore.collection('children').doc(childId).get() : null;
      const parentId = childDoc?.data()?.parentId as string | undefined;
      const parentDoc = parentId ? await firestore.collection('users').doc(parentId).get() : null;
      return {
        ...payment,
        parentPhone: String(parentDoc?.data()?.phone ?? ''),
        parentId: parentId ?? '',
        childName: String(childDoc?.data()?.fullName ?? ''),
      };
    }),
  );
  return enriched;
}

export async function updateFirebasePayment(id: string, data: Partial<Omit<FirebasePayment, 'id' | 'createdAt'>>): Promise<void> {
  await payments().doc(id).update(data);
}

// ---------------------------------------------------------------------------
// Atomic enrollment creation — enrollment + plan + first payment in one batch
// ---------------------------------------------------------------------------

export type CreateEnrollmentInput = {
  childId: string;
  courseSessionId: string;
  session: FirebaseCourseSession;
  planType: PlanType;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
};

export async function createFirebaseEnrollment(input: CreateEnrollmentInput): Promise<{ enrollmentId: string; paymentId: string }> {
  // Capacity check
  const existing = await enrollments()
    .where('courseSessionId', '==', input.courseSessionId)
    .where('status', 'in', ['PENDING', 'ACTIVE'])
    .get();
  if (existing.size >= input.session.capacity) throw new Error('CAPACITY_FULL');

  // Schedule-conflict check: can this child join this session?
  const childEnrollments = await enrollments()
    .where('childId', '==', input.childId)
    .where('status', 'in', ['PENDING', 'ACTIVE'])
    .get();

  for (const doc of childEnrollments.docs) {
    const data = doc.data();
    if (data.courseSessionId === input.courseSessionId) throw new Error('DUPLICATE');
    const otherSessionDoc = await firestore.collection('course_sessions').doc(String(data.courseSessionId)).get();
    if (otherSessionDoc.exists && sessionsConflict(input.session, otherSessionDoc.data() as FirebaseCourseSession)) {
      throw new Error('SCHEDULE_CONFLICT');
    }
  }

  const batch = firestore.batch();

  const enrollmentRef = enrollments().doc();
  batch.set(enrollmentRef, {
    childId: input.childId,
    courseSessionId: input.courseSessionId,
    status: 'PENDING',
    enrolledAt: FieldValue.serverTimestamp(),
  });

  const planRef = paymentPlans().doc();
  batch.set(planRef, {
    enrollmentId: enrollmentRef.id,
    type: input.planType,
    method: input.paymentMethod,
    amount: input.amount,
    currency: input.currency,
    startDate: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  const paymentRef = payments().doc();
  batch.set(paymentRef, {
    paymentPlanId: planRef.id,
    enrollmentId: enrollmentRef.id,
    amount: input.amount,
    currency: input.currency,
    dueDate: new Date(),
    status: 'PENDING',
    paidAt: null,
    parentNotifiedAt: null,
    stripeSessionId: null,
    stripePaymentIntentId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { enrollmentId: enrollmentRef.id, paymentId: paymentRef.id };
}

export async function moveFirebaseEnrollment(enrollmentId: string, newCourseSessionId: string, newSession: FirebaseCourseSession): Promise<void> {
  const enrollment = await getFirebaseEnrollment(enrollmentId);
  if (!enrollment) throw new Error('NOT_FOUND');

  // Capacity check on destination
  const destEnrollments = await enrollments()
    .where('courseSessionId', '==', newCourseSessionId)
    .where('status', 'in', ['PENDING', 'ACTIVE'])
    .get();
  if (destEnrollments.size >= newSession.capacity) throw new Error('CAPACITY_FULL');

  // Schedule-conflict check (excluding this enrollment)
  const childEnrollments = await enrollments()
    .where('childId', '==', enrollment.childId)
    .where('status', 'in', ['PENDING', 'ACTIVE'])
    .get();
  for (const doc of childEnrollments.docs) {
    if (doc.id === enrollmentId) continue;
    const otherSessionDoc = await firestore.collection('course_sessions').doc(String(doc.data().courseSessionId)).get();
    if (otherSessionDoc.exists && sessionsConflict(newSession, otherSessionDoc.data() as FirebaseCourseSession)) {
      throw new Error('SCHEDULE_CONFLICT');
    }
  }

  await enrollments().doc(enrollmentId).update({ courseSessionId: newCourseSessionId });
}

// ---------------------------------------------------------------------------
// Overdue payment flip — called by the cron job
// ---------------------------------------------------------------------------

export async function flipOverduePayments(): Promise<number> {
  const now = new Date();
  const snapshot = await payments()
    .where('status', '==', 'PENDING')
    .where('dueDate', '<', now)
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { status: 'OVERDUE' }));
  await batch.commit();
  return snapshot.size;
}
