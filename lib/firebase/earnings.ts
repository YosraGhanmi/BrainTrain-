import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

// Income logged by hand (e.g. workshop fees, sponsorships, desk sales).
// Tuition payments marked PAID live in `payments` and are not duplicated here.
export type FirebaseEarning = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  note: string | null;
  date: Date;
  createdByName: string;
  createdByRole: string;
  createdAt: Date;
};

function mapEarning(id: string, data: DocumentData): FirebaseEarning {
  return {
    id,
    label: String(data.label ?? ''),
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'TND'),
    note: data.note ? String(data.note) : null,
    date: data.date?.toDate?.() ?? new Date(data.date ?? 0),
    createdByName: String(data.createdByName ?? ''),
    createdByRole: String(data.createdByRole ?? ''),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('earnings');

export async function createFirebaseEarning(input: Omit<FirebaseEarning, 'id' | 'createdAt'>): Promise<string> {
  const ref = await col().add({ ...input, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function deleteFirebaseEarning(id: string): Promise<void> {
  await col().doc(id).delete();
}

export async function listFirebaseEarningsBetween(start: Date, end: Date): Promise<FirebaseEarning[]> {
  const snapshot = await col().where('date', '>=', start).where('date', '<', end).orderBy('date', 'desc').get();
  return snapshot.docs.map((doc) => mapEarning(doc.id, doc.data()));
}
