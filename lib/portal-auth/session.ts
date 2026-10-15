import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { mapPortalProfile } from '@/lib/db/portal-auth';

// Node's crypto module (not Edge-compatible) — server-only.
export const PORTAL_SESSION_COOKIE_NAME = 'braintrain_portal_session';
const PORTAL_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

// The cookie holds a random token; the database only keeps its sha256, so a
// leaked database dump can't be replayed as a login.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPortalSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url');
  await prisma.portalSession.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + PORTAL_SESSION_TTL_MS) },
  });
  (await cookies()).set(PORTAL_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PORTAL_SESSION_TTL_MS / 1000,
  });
}

export async function destroyPortalSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.portalSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(PORTAL_SESSION_COOKIE_NAME);
}

// Signs a user out everywhere — called on password change and when an
// account is frozen, so old cookies stop working immediately.
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.portalSession.deleteMany({ where: { userId } });
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

  const session = await prisma.portalSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.isFrozen) return null;
  return mapPortalProfile(session.user);
}
