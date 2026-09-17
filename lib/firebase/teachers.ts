import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore, firebaseAdminAuth } from '@/lib/firebase/admin';

// Teacher profiles are stored in the shared 'users' collection with role: 'TEACHER'.
// The PIN second-factor fields live alongside the profile rather than in a
// separate collection — consistent with how parents store their 2FA fields.

export type FirebaseTeacherProfile = {
  id: string;
  email: string;
  phone: string;
  secondaryPhone: string | null;
  fullName: string;
  role: 'TEACHER';
  teacherId: string; // same as uid — stored for convenience
  // JSON-stringified course slugs assigned to this teacher.
  courseSlugs: string;
  teacherSecretCodeHash: string | null;
  teacherSecretCode: string | null; // plaintext, staff-visible in admin panel
  isFrozen: boolean;
  twoFactorEnabled: boolean;
};

function mapTeacher(id: string, data: DocumentData): FirebaseTeacherProfile {
  return {
    id,
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    secondaryPhone: data.secondaryPhone ? String(data.secondaryPhone) : null,
    fullName: String(data.fullName ?? ''),
    role: 'TEACHER',
    teacherId: id,
    courseSlugs: String(data.courseSlugs ?? '[]'),
    teacherSecretCodeHash: data.teacherSecretCodeHash ? String(data.teacherSecretCodeHash) : null,
    teacherSecretCode: data.teacherSecretCode ? String(data.teacherSecretCode) : null,
    isFrozen: data.isFrozen === true,
    twoFactorEnabled: data.twoFactorEnabled === true,
  };
}

export async function createFirebaseTeacherProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  courseSlugs: string;
  teacherSecretCodeHash: string;
  teacherSecretCode: string;
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
    secondaryPhone: null,
    role: 'TEACHER',
    teacherId: user.uid,
    courseSlugs: input.courseSlugs,
    teacherSecretCodeHash: input.teacherSecretCodeHash,
    teacherSecretCode: input.teacherSecretCode,
    isFrozen: false,
    twoFactorEnabled: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return user.uid;
}

export async function getFirebaseTeacherProfile(uid: string): Promise<FirebaseTeacherProfile | null> {
  const doc = await firestore.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data() ?? {};
  if (data.role !== 'TEACHER') return null;
  return mapTeacher(doc.id, data);
}

export async function getFirebaseTeacherByEmail(email: string): Promise<FirebaseTeacherProfile | null> {
  const snapshot = await firestore.collection('users').where('role', '==', 'TEACHER').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapTeacher(doc.id, doc.data());
}

export async function listFirebaseTeachers(): Promise<FirebaseTeacherProfile[]> {
  const snapshot = await firestore.collection('users').where('role', '==', 'TEACHER').get();
  return snapshot.docs.map((doc) => mapTeacher(doc.id, doc.data()));
}

export async function updateFirebaseTeacherProfile(uid: string, data: Partial<Omit<FirebaseTeacherProfile, 'id' | 'role'>>): Promise<void> {
  await firestore.collection('users').doc(uid).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteFirebaseTeacherProfile(uid: string): Promise<void> {
  await firestore.collection('users').doc(uid).delete();
  await firebaseAdminAuth.deleteUser(uid).catch(() => undefined);
}
