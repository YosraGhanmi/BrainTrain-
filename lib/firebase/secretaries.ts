import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore, firebaseAdminAuth } from '@/lib/firebase/admin';

export type FirebaseSecretaryProfile = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'SECRETARY';
  isFrozen: boolean;
  passwordHash: string;
};

function mapSecretary(id: string, data: DocumentData): FirebaseSecretaryProfile {
  return {
    id,
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    fullName: String(data.fullName ?? ''),
    role: 'SECRETARY',
    isFrozen: data.isFrozen === true,
    passwordHash: String(data.passwordHash ?? ''),
  };
}

export async function createFirebaseSecretaryProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  passwordHash: string;
}): Promise<string> {
  const user = await firebaseAdminAuth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.fullName,
  });
  await firestore.collection('users').doc(user.uid).set({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    role: 'SECRETARY',
    isFrozen: false,
    passwordHash: input.passwordHash,
    createdAt: FieldValue.serverTimestamp(),
  });
  return user.uid;
}

export async function listFirebaseSecretaries(): Promise<FirebaseSecretaryProfile[]> {
  const snapshot = await firestore.collection('users').where('role', '==', 'SECRETARY').get();
  return snapshot.docs.map((doc) => mapSecretary(doc.id, doc.data()));
}

export async function getFirebaseSecretaryByEmail(email: string): Promise<FirebaseSecretaryProfile | null> {
  const snapshot = await firestore.collection('users').where('role', '==', 'SECRETARY').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapSecretary(doc.id, doc.data());
}

export async function getFirebaseSecretaryProfile(uid: string): Promise<FirebaseSecretaryProfile | null> {
  const doc = await firestore.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data() ?? {};
  if (data.role !== 'SECRETARY') return null;
  return mapSecretary(doc.id, data);
}

export async function updateFirebaseSecretaryProfile(uid: string, data: Partial<Omit<FirebaseSecretaryProfile, 'id' | 'role'>>): Promise<void> {
  await firestore.collection('users').doc(uid).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteFirebaseSecretaryProfile(uid: string): Promise<void> {
  await firestore.collection('users').doc(uid).delete();
  await firebaseAdminAuth.deleteUser(uid).catch(() => undefined);
}
