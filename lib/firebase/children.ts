import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseChild = {
  id: string;
  parentId: string;
  fullName: string;
  dateOfBirth: Date;
  ageGroupSlug: string;
  institution: string | null;
  specialNeeds: string | null;
  photoUrl: string | null;
  photoColor: string | null;
  createdAt: Date;
};

const children = () => firestore.collection('children');

function mapChild(id: string, data: DocumentData): FirebaseChild {
  return {
    id,
    parentId: String(data.parentId),
    fullName: String(data.fullName ?? ''),
    dateOfBirth: data.dateOfBirth?.toDate?.() ?? new Date(data.dateOfBirth ?? 0),
    ageGroupSlug: String(data.ageGroupSlug ?? ''),
    institution: data.institution ? String(data.institution) : null,
    specialNeeds: data.specialNeeds ? String(data.specialNeeds) : null,
    photoUrl: data.photoUrl ? String(data.photoUrl) : null,
    photoColor: data.photoColor ? String(data.photoColor) : null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt ?? 0),
  };
}

export async function listFirebaseChildren(parentId: string): Promise<FirebaseChild[]> {
  const snapshot = await children().where('parentId', '==', parentId).get();
  return snapshot.docs.map((doc) => mapChild(doc.id, doc.data())).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getFirebaseChild(childId: string): Promise<FirebaseChild | null> {
  const snapshot = await children().doc(childId).get();
  return snapshot.exists ? mapChild(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function createFirebaseChild(data: Omit<FirebaseChild, 'id' | 'createdAt' | 'photoUrl' | 'photoColor'>): Promise<string> {
  const reference = await children().add({ ...data, photoUrl: null, photoColor: null, createdAt: FieldValue.serverTimestamp() });
  return reference.id;
}

export async function updateFirebaseChild(childId: string, data: Partial<Omit<FirebaseChild, 'id' | 'parentId' | 'createdAt'>>): Promise<void> {
  await children().doc(childId).update(data);
}

export async function deleteFirebaseChild(childId: string): Promise<void> {
  await children().doc(childId).delete();
}

export async function listAllFirebaseChildren(): Promise<Array<FirebaseChild & { parentName: string; enrollmentCount: number }>> {
  const snapshot = await children().orderBy('createdAt', 'desc').get();
  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const child = mapChild(doc.id, doc.data());
      const [parent, enrollments] = await Promise.all([
        firestore.collection('users').doc(child.parentId).get(),
        firestore.collection('enrollments').where('childId', '==', child.id).count().get(),
      ]);
      return { ...child, parentName: String(parent.data()?.fullName ?? ''), enrollmentCount: enrollments.data().count };
    }),
  );
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIREBASE_CONFIG ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE,
  );
}
