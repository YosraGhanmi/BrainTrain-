import crypto from 'crypto';
import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';
import { ageGroupSlugForBirthDate, listAgeGroupEntries } from '@/lib/content/lookup';
import type { AgeGroupEntry } from '@/lib/content/types';

// A class the child took before the portal existed (from the paper records).
export type PastClass = { schoolYear: string; course: string; note: string | null };

export type FirebaseChild = {
  id: string;
  // '' while a child imported from the paper records has not been claimed by
  // a parent yet (stored as null in Firestore)
  parentId: string;
  fullName: string;
  dateOfBirth: Date;
  ageGroupSlug: string;
  institution: string | null;
  specialNeeds: string | null;
  photoUrl: string | null;
  photoColor: string | null;
  // One-time code the front desk hands to the parent to link this child
  claimCode: string | null;
  pastClasses: PastClass[];
  // Parent contact from the paper records, for children with no linked
  // account yet. Once linked, the account's own details take precedence.
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Original registration date from the paper records (null = createdAt)
  registeredAt: Date | null;
  createdAt: Date;
};

// Front-desk details staff can set on an imported child
export type ChildContactFields = Pick<FirebaseChild, 'contactName' | 'contactPhone' | 'contactEmail' | 'registeredAt'>;

function optionalString(value: unknown): string | null {
  return value ? String(value) : null;
}

const children = () => firestore.collection('children');

// The age group is derived from the date of birth on every read, so children
// move up automatically each school year. The stored slug is only a fallback
// for ages no group covers.
function mapChild(id: string, data: DocumentData, ageGroups: AgeGroupEntry[] = listAgeGroupEntries()): FirebaseChild {
  const dateOfBirth: Date = data.dateOfBirth?.toDate?.() ?? new Date(data.dateOfBirth ?? 0);
  return {
    id,
    parentId: data.parentId ? String(data.parentId) : '',
    fullName: String(data.fullName ?? ''),
    dateOfBirth,
    ageGroupSlug: ageGroupSlugForBirthDate(dateOfBirth, ageGroups) ?? String(data.ageGroupSlug ?? ''),
    institution: data.institution ? String(data.institution) : null,
    specialNeeds: data.specialNeeds ? String(data.specialNeeds) : null,
    photoUrl: data.photoUrl ? String(data.photoUrl) : null,
    photoColor: data.photoColor ? String(data.photoColor) : null,
    claimCode: data.claimCode ? String(data.claimCode) : null,
    pastClasses: Array.isArray(data.pastClasses)
      ? data.pastClasses.map((c: DocumentData) => ({
          schoolYear: String(c?.schoolYear ?? ''),
          course: String(c?.course ?? ''),
          note: c?.note ? String(c.note) : null,
        }))
      : [],
    contactName: optionalString(data.contactName),
    contactPhone: optionalString(data.contactPhone),
    contactEmail: optionalString(data.contactEmail),
    registeredAt: data.registeredAt ? (data.registeredAt.toDate?.() ?? new Date(data.registeredAt)) : null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt ?? 0),
  };
}

export async function listFirebaseChildren(parentId: string): Promise<FirebaseChild[]> {
  const snapshot = await children().where('parentId', '==', parentId).get();
  const ageGroups = listAgeGroupEntries();
  return snapshot.docs.map((doc) => mapChild(doc.id, doc.data(), ageGroups)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getFirebaseChild(childId: string): Promise<FirebaseChild | null> {
  const snapshot = await children().doc(childId).get();
  return snapshot.exists ? mapChild(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function createFirebaseChild(
  data: Omit<FirebaseChild, 'id' | 'createdAt' | 'photoUrl' | 'photoColor' | 'claimCode' | 'pastClasses' | keyof ChildContactFields> &
    Partial<Pick<FirebaseChild, 'claimCode' | 'pastClasses'> & ChildContactFields>,
): Promise<string> {
  const reference = await children().add({
    ...data,
    parentId: data.parentId || null,
    claimCode: data.claimCode ?? null,
    pastClasses: data.pastClasses ?? [],
    contactName: data.contactName ?? null,
    contactPhone: data.contactPhone ?? null,
    contactEmail: data.contactEmail ?? null,
    registeredAt: data.registeredAt ?? null,
    photoUrl: null,
    photoColor: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return reference.id;
}

// ---------------------------------------------------------------------------
// Claim codes: children imported from the paper records are created without a
// parent; the parent types the code the front desk gives them to link it.
// ---------------------------------------------------------------------------

// No 0/O, 1/I/L so codes can be read out loud or copied from paper safely
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function normalizeClaimCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatClaimCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function generateUniqueClaimCode(): Promise<string> {
  for (;;) {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    const clash = await children().where('claimCode', '==', code).limit(1).get();
    if (clash.empty) return code;
  }
}

// Links the child to the parent and burns the code. Returns null when the
// code does not match an unclaimed child.
export async function claimFirebaseChild(rawCode: string, parentId: string): Promise<FirebaseChild | null> {
  const code = normalizeClaimCode(rawCode);
  if (code.length !== CODE_LENGTH) return null;

  return firestore.runTransaction(async (tx) => {
    const snapshot = await tx.get(children().where('claimCode', '==', code).limit(1));
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    if (doc.data().parentId) return null;
    tx.update(doc.ref, { parentId, claimCode: null, claimedAt: FieldValue.serverTimestamp() });
    return mapChild(doc.id, { ...doc.data(), parentId, claimCode: null });
  });
}

export async function updateFirebaseChild(childId: string, data: Partial<Omit<FirebaseChild, 'id' | 'parentId' | 'createdAt'>>): Promise<void> {
  await children().doc(childId).update(data);
}

export async function deleteFirebaseChild(childId: string): Promise<void> {
  await children().doc(childId).delete();
}

export type AdminChildRow = FirebaseChild & {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrollmentCount: number;
};

// Oldest registration first, like the paper register. Parent columns come
// from the linked account, falling back to the contact typed in by staff.
export async function listAllFirebaseChildren(): Promise<AdminChildRow[]> {
  const snapshot = await children().get();
  const ageGroups = listAgeGroupEntries();
  const rows = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const child = mapChild(doc.id, doc.data(), ageGroups);
      const [parent, enrollments] = await Promise.all([
        child.parentId ? firestore.collection('users').doc(child.parentId).get() : null,
        firestore.collection('enrollments').where('childId', '==', child.id).where('status', 'in', ['PENDING', 'ACTIVE']).count().get(),
      ]);
      const account = parent?.data();
      return {
        ...child,
        parentName: String(account?.fullName || child.contactName || ''),
        parentPhone: String(account?.phone || child.contactPhone || ''),
        parentEmail: String(account?.email || child.contactEmail || ''),
        enrollmentCount: enrollments.data().count,
      };
    }),
  );
  const registered = (c: FirebaseChild) => (c.registeredAt ?? c.createdAt).getTime();
  return rows.sort((a, b) => registered(a) - registered(b));
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIREBASE_CONFIG ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE,
  );
}
