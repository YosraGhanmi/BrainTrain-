import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseCourseSession = {
  id: string;
  courseSlug: string;
  teacherId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  term: string;
  createdAt: Date;
};

function mapSession(id: string, data: DocumentData): FirebaseCourseSession {
  return {
    id,
    courseSlug: String(data.courseSlug ?? ''),
    teacherId: data.teacherId ? String(data.teacherId) : null,
    dayOfWeek: Number(data.dayOfWeek ?? 0),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    location: String(data.location ?? ''),
    capacity: Number(data.capacity ?? 12),
    term: String(data.term ?? ''),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('course_sessions');

export async function createFirebaseCourseSession(data: Omit<FirebaseCourseSession, 'id' | 'createdAt'>): Promise<string> {
  const ref = await col().add({ ...data, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function updateFirebaseCourseSession(id: string, data: Partial<Omit<FirebaseCourseSession, 'id' | 'createdAt'>>): Promise<void> {
  await col().doc(id).update(data);
}

export async function deleteFirebaseCourseSession(id: string): Promise<void> {
  await col().doc(id).delete();
}

export async function getFirebaseCourseSession(id: string): Promise<FirebaseCourseSession | null> {
  const doc = await col().doc(id).get();
  if (!doc.exists) return null;
  return mapSession(doc.id, doc.data() ?? {});
}

export async function listFirebaseCourseSessions(): Promise<FirebaseCourseSession[]> {
  const snapshot = await col().orderBy('courseSlug').get();
  return snapshot.docs.map((doc) => mapSession(doc.id, doc.data()));
}

export async function listFirebaseCourseSessionsByTeacher(teacherId: string): Promise<FirebaseCourseSession[]> {
  const snapshot = await col().where('teacherId', '==', teacherId).get();
  return snapshot.docs.map((doc) => mapSession(doc.id, doc.data()));
}

export async function listFirebaseCourseSessionsByCourse(courseSlug: string): Promise<FirebaseCourseSession[]> {
  const snapshot = await col().where('courseSlug', '==', courseSlug).get();
  return snapshot.docs.map((doc) => mapSession(doc.id, doc.data()));
}
