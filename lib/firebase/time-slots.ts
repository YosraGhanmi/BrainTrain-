import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebaseTimeSlot = {
  id: string;
  label: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapSlot(id: string, data: DocumentData): FirebaseTimeSlot {
  return {
    id,
    label: String(data.label ?? ''),
    dayOfWeek: Number(data.dayOfWeek ?? 0),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('time_slots');

export async function createFirebaseTimeSlot(input: Omit<FirebaseTimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  // Enforce unique label
  const existing = await col().where('label', '==', input.label).limit(1).get();
  if (!existing.empty) throw new Error('LABEL_TAKEN');
  const ref = await col().add({ ...input, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function updateFirebaseTimeSlot(id: string, input: Partial<Omit<FirebaseTimeSlot, 'id' | 'createdAt'>>): Promise<void> {
  await col().doc(id).update({ ...input, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteFirebaseTimeSlot(id: string): Promise<void> {
  await col().doc(id).delete();
}

export async function getFirebaseTimeSlot(id: string): Promise<FirebaseTimeSlot | null> {
  const doc = await col().doc(id).get();
  if (!doc.exists) return null;
  return mapSlot(doc.id, doc.data() ?? {});
}

export async function listFirebaseTimeSlots(): Promise<FirebaseTimeSlot[]> {
  const snapshot = await col().orderBy('dayOfWeek').get();
  return snapshot.docs.map((doc) => mapSlot(doc.id, doc.data()));
}

// Helper used by schedule pages: find the label matching a session's day+time
export function findFirebaseSlotLabel(
  slots: Pick<FirebaseTimeSlot, 'label' | 'dayOfWeek' | 'startTime' | 'endTime'>[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
): string | null {
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime && s.endTime === endTime);
  return slot?.label ?? null;
}
