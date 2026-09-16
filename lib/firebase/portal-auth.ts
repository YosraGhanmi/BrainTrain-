import { firebaseAdminAuth, firestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type FirebasePortalRole = 'PARENT' | 'TEACHER' | 'SECRETARY';

export type FirebasePortalProfile = {
  id: string;
  email: string;
  phone: string;
  secondaryPhone: string | null;
  backupEmail: string | null;
  twoFactorEnabled: boolean;
  twoFactorCodeHash?: string | null;
  twoFactorCodeExpiresAt?: string | Date | null;
  fullName: string;
  role: FirebasePortalRole;
  parentId: string | null;
  teacherId: string | null;
  isFrozen: boolean;
  parentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

export async function signInWithFirebasePassword(email: string, password: string): Promise<{ idToken: string; uid: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { idToken?: string; localId?: string };
  return data.idToken && data.localId ? { idToken: data.idToken, uid: data.localId } : null;
}

export async function createFirebaseParentProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<void> {
  const user = await firebaseAdminAuth.createUser({ email: input.email, password: input.password, displayName: input.fullName });
  await firestore.collection('users').doc(user.uid).set({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    role: 'PARENT',
    parentId: user.uid,
    parentStatus: 'PENDING',
    isFrozen: false,
    secondaryPhone: null,
    backupEmail: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
  });
}

export async function getFirebasePortalProfile(uid: string): Promise<FirebasePortalProfile | null> {
  const snapshot = await firestore.collection('users').doc(uid).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  return {
    id: uid,
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    secondaryPhone: data.secondaryPhone ? String(data.secondaryPhone) : null,
    backupEmail: data.backupEmail ? String(data.backupEmail) : null,
    twoFactorEnabled: data.twoFactorEnabled === true,
    twoFactorCodeHash: data.twoFactorCodeHash ? String(data.twoFactorCodeHash) : null,
    twoFactorCodeExpiresAt: data.twoFactorCodeExpiresAt ? (data.twoFactorCodeExpiresAt.toDate ? data.twoFactorCodeExpiresAt.toDate() : data.twoFactorCodeExpiresAt) : null,
    fullName: String(data.fullName ?? ''),
    role: data.role as FirebasePortalRole,
    parentId: data.parentId ? String(data.parentId) : null,
    teacherId: data.teacherId ? String(data.teacherId) : null,
    isFrozen: data.isFrozen === true,
    parentStatus: data.parentStatus ?? null,
  };
}

export async function listFirebaseParentProfiles(): Promise<Array<FirebasePortalProfile & { childCount: number }>> {
  const snapshot = await firestore.collection('users').where('role', '==', 'PARENT').get();
  const profiles = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const profile = await getFirebasePortalProfile(doc.id);
      if (!profile) return null;
      const children = await firestore.collection('children').where('parentId', '==', doc.id).get();
      return { ...profile, childCount: children.size };
    }),
  );
  return profiles.filter((profile): profile is FirebasePortalProfile & { childCount: number } => profile !== null);
}

export async function updateFirebasePortalProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  await firestore.collection('users').doc(uid).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteFirebasePortalProfile(uid: string): Promise<void> {
  await firestore.collection('users').doc(uid).delete();
  await firebaseAdminAuth.deleteUser(uid).catch(() => undefined);
}