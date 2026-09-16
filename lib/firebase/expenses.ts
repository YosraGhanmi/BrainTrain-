import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseExpense = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  category: string | null;
  note: string | null;
  date: Date;
  createdByName: string;
  createdByRole: string;
  createdAt: Date;
};

function mapExpense(id: string, data: DocumentData): FirebaseExpense {
  return {
    id,
    label: String(data.label ?? ''),
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'TND'),
    category: data.category ? String(data.category) : null,
    note: data.note ? String(data.note) : null,
    date: data.date?.toDate?.() ?? new Date(data.date ?? 0),
    createdByName: String(data.createdByName ?? ''),
    createdByRole: String(data.createdByRole ?? ''),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('expenses');

export async function createFirebaseExpense(input: Omit<FirebaseExpense, 'id' | 'createdAt'>): Promise<string> {
  const ref = await col().add({ ...input, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function deleteFirebaseExpense(id: string): Promise<void> {
  await col().doc(id).delete();
}

export async function listFirebaseExpenses(): Promise<FirebaseExpense[]> {
  const snapshot = await col().orderBy('date', 'desc').get();
  return snapshot.docs.map((doc) => mapExpense(doc.id, doc.data()));
}
