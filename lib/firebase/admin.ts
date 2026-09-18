import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function readFirebaseConfigProjectId(): string | undefined {
  const rawConfig = process.env.FIREBASE_CONFIG;
  if (!rawConfig) return undefined;

  try {
    const parsed = JSON.parse(rawConfig) as { projectId?: string };
    return parsed.projectId;
  } catch {
    return undefined;
  }
}

function createFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_PROJECT_ID ?? readFirebaseConfigProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export const firebaseAdminApp = createFirebaseAdminApp();
export const firebaseAdminAuth = getAuth(firebaseAdminApp);
export const firestore = getFirestore(firebaseAdminApp);
