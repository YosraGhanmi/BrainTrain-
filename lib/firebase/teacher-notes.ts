import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseTeacherNote = {
  id: string;
  teacherId: string;
  childId: string;
  courseSessionId: string;
  enrollmentId: string | null;
  content: string;
  createdAt: Date;
};

function mapNote(id: string, data: DocumentData): FirebaseTeacherNote {
  return {
    id,
    teacherId: String(data.teacherId ?? ''),
    childId: String(data.childId ?? ''),
    courseSessionId: String(data.courseSessionId ?? ''),
    enrollmentId: data.enrollmentId ? String(data.enrollmentId) : null,
    content: String(data.content ?? ''),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('teacher_notes');

export async function createFirebaseTeacherNote(input: Omit<FirebaseTeacherNote, 'id' | 'createdAt'>): Promise<string> {
  const ref = await col().add({ ...input, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function listFirebaseTeacherNotesByChild(childId: string): Promise<FirebaseTeacherNote[]> {
  const snapshot = await col().where('childId', '==', childId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => mapNote(doc.id, doc.data()));
}

export async function listFirebaseTeacherNotesByEnrollment(enrollmentId: string): Promise<FirebaseTeacherNote[]> {
  const snapshot = await col().where('enrollmentId', '==', enrollmentId).orderBy('createdAt', 'asc').get();
  return snapshot.docs.map((doc) => mapNote(doc.id, doc.data()));
}

export async function listFirebaseTeacherNotesByCourseSession(courseSessionId: string, childId: string): Promise<FirebaseTeacherNote[]> {
  const snapshot = await col()
    .where('courseSessionId', '==', courseSessionId)
    .where('childId', '==', childId)
    .orderBy('createdAt', 'asc')
    .get();
  return snapshot.docs.map((doc) => mapNote(doc.id, doc.data()));
}
