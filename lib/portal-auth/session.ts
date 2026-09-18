import crypto from 'crypto';
import { cookies } from 'next/headers';
import { firebaseAdminAuth } from '@/lib/firebase/admin';
import { getFirebasePortalProfile, isFirebaseConfigured } from '@/lib/firebase/portal-auth';

// Node's crypto module (not Edge-compatible) — server-only.
export const PORTAL_SESSION_COOKIE_NAME = 'braintrain_portal_session';
const FIREBASE_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

// DB-backed sessions are gone — all sessions are now Firebase session cookies,
// which are verified server-side via the Firebase Admin SDK and can be revoked
// immediately by calling revokeRefreshTokens (see revokeAllSessions below).
export async function createPortalSession(userId: string, firebaseIdToken?: string): Promise<void> {
  if (firebaseIdToken) {
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(firebaseIdToken, { expiresIn: FIREBASE_SESSION_TTL_MS });
    (await cookies()).set(PORTAL_SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: FIREBASE_SESSION_TTL_MS / 1000,
    });
    return;
  }
  // No idToken provided — this should not happen in production; log a warning.
  console.warn('[session] createPortalSession called without a Firebase idToken for userId:', userId);
}

export async function destroyPortalSession(): Promise<void> {
  (await cookies()).delete(PORTAL_SESSION_COOKIE_NAME);
}

// Revokes every existing session for a user — called on password change so
// stolen/old cookies stop working immediately. Firebase session cookies are
// derived from the user's refresh token; revoking refresh tokens invalidates
// all outstanding session cookies immediately.
export async function revokeAllSessions(userId: string): Promise<void> {
  await firebaseAdminAuth.revokeRefreshTokens(userId).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Teacher secret-code step — after password login, a teacher's uid is
// held in this short-lived signed cookie (not yet a real session) until they
// enter their 4-digit PIN on /teacher/verify.
// ---------------------------------------------------------------------------
export const PENDING_TEACHER_COOKIE_NAME = 'braintrain_teacher_pending';
const PENDING_TEACHER_TTL_MS = 10 * 60 * 1000; // 10 minutes

function pendingSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  return secret;
}

function signPending(payload: string): string {
  return crypto.createHmac('sha256', pendingSecret()).update(payload).digest('hex');
}

export function createPendingTeacherToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + PENDING_TEACHER_TTL_MS });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${signPending(encoded)}`;
}

export function verifyPendingTeacherToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  let expectedSig: string;
  try {
    expectedSig = signPending(encoded);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export type PortalSessionUser = {
  id: string;
  email: string;
  phone: string;
  secondaryPhone: string | null;
  backupEmail: string | null;
  twoFactorEnabled: boolean;
  fullName: string;
  role: 'PARENT' | 'TEACHER' | 'SECRETARY';
  parentId: string | null;
  teacherId: string | null;
};

export async function getPortalSessionUser(): Promise<PortalSessionUser | null> {
  const token = (await cookies()).get(PORTAL_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = await firebaseAdminAuth.verifySessionCookie(token, true);
    const profile = await getFirebasePortalProfile(decoded.uid);
    if (!profile || profile.isFrozen) return null;
    return profile;
  } catch {
    return null;
  }
}
