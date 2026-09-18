import { FieldValue } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type FirebasePreinscription = {
  id: string;
  childFullName: string;
  childAge: number;
  institution: string;
  parentFullName: string;
  parentPhone: string;
  createdAt: Date;
};

const preinscriptions = () => firestore.collection('preinscriptions');

function hasFirebaseConfig(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.FIREBASE_CONFIG ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE,
  );
}

export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig();
}

export async function createFirebasePreinscription(data: Omit<FirebasePreinscription, 'id' | 'createdAt'>): Promise<void> {
  await preinscriptions().add({ ...data, createdAt: FieldValue.serverTimestamp() });
}

export async function listFirebasePreinscriptions(): Promise<FirebasePreinscription[]> {
  const snapshot = await preinscriptions().orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      childFullName: String(data.childFullName),
      childAge: Number(data.childAge),
      institution: String(data.institution),
      parentFullName: String(data.parentFullName),
      parentPhone: String(data.parentPhone),
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function getFirebasePreinscriptionSetting(): Promise<boolean> {
  const snapshot = await firestore.collection('settings').doc('preinscription').get();
  return snapshot.data()?.routeRegisterToForm === true;
}

export async function setFirebasePreinscriptionSetting(routeRegisterToForm: boolean): Promise<void> {
  await firestore.collection('settings').doc('preinscription').set({ routeRegisterToForm }, { merge: true });
}

export async function createFirebasePreinscriptionNotification(childFullName: string, parentFullName: string): Promise<void> {
  await firestore.collection('notifications').add({
    type: 'PREINSCRIPTION_SUBMITTED',
    title: 'New preinscription received',
    body: `${childFullName} - ${parentFullName}`,
    link: '/admin/preinscriptions',
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
}
