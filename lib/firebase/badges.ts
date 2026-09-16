import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseBadge = {
  id: string;
  childId: string;
  teacherId: string;
  courseSessionId: string | null;
  title: string;
  note: string | null;
  emoji: string;
  imageUrl: string | null;
  awardedAt: Date;
};

function mapBadge(id: string, data: DocumentData): FirebaseBadge {
  return {
    id,
    childId: String(data.childId ?? ''),
    teacherId: String(data.teacherId ?? ''),
    courseSessionId: data.courseSessionId ? String(data.courseSessionId) : null,
    title: String(data.title ?? ''),
    note: data.note ? String(data.note) : null,
    emoji: String(data.emoji ?? '🏅'),
    imageUrl: data.imageUrl ? String(data.imageUrl) : null,
    awardedAt: data.awardedAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('badges');

export async function createFirebaseBadge(input: Omit<FirebaseBadge, 'id' | 'awardedAt'>): Promise<string> {
  const ref = await col().add({ ...input, awardedAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function listFirebaseBadgesByChild(childId: string): Promise<FirebaseBadge[]> {
  const snapshot = await col().where('childId', '==', childId).orderBy('awardedAt', 'desc').get();
  return snapshot.docs.map((doc) => mapBadge(doc.id, doc.data()));
}

export async function listFirebaseBadgesByCourseSession(courseSessionId: string): Promise<FirebaseBadge[]> {
  const snapshot = await col().where('courseSessionId', '==', courseSessionId).get();
  return snapshot.docs.map((doc) => mapBadge(doc.id, doc.data()));
}
