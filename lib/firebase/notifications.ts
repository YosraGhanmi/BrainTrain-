import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type NotificationType = 'EXPENSE_ADDED' | 'PREINSCRIPTION_SUBMITTED';

export type FirebaseNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function mapNotification(id: string, data: DocumentData): FirebaseNotification {
  return {
    id,
    type: (data.type as NotificationType) ?? 'EXPENSE_ADDED',
    title: String(data.title ?? ''),
    body: data.body ? String(data.body) : null,
    link: data.link ? String(data.link) : null,
    readAt: data.readAt?.toDate?.() ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

const col = () => firestore.collection('notifications');

export async function createFirebaseNotification(input: Omit<FirebaseNotification, 'id' | 'readAt' | 'createdAt'>): Promise<void> {
  await col().add({ ...input, readAt: null, createdAt: FieldValue.serverTimestamp() });
}

export async function markFirebaseNotificationRead(id: string): Promise<void> {
  await col().doc(id).update({ readAt: FieldValue.serverTimestamp() });
}

export async function markAllFirebaseNotificationsRead(): Promise<void> {
  const snapshot = await col().where('readAt', '==', null).get();
  const batch = firestore.batch();
  const now = FieldValue.serverTimestamp();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { readAt: now }));
  await batch.commit();
}

export async function listUnreadFirebaseNotifications(type?: NotificationType): Promise<FirebaseNotification[]> {
  let query = col().where('readAt', '==', null) as FirebaseFirestore.Query;
  if (type) query = query.where('type', '==', type);
  const snapshot = await query.orderBy('createdAt', 'desc').limit(20).get();
  return snapshot.docs.map((doc) => mapNotification(doc.id, doc.data()));
}
