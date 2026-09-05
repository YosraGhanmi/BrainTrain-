import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import type { PortalRole } from '@prisma/client';

// Node's crypto module (not Edge-compatible) — server-only, same constraint
// as lib/auth/session.ts for the admin panel.
export const PORTAL_SESSION_COOKIE_NAME = 'braintrain_portal_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// DB-backed (unlike the admin panel's stateless HMAC cookie) so a session can
// be revoked on logout or password change instead of just expiring.
export async function createPortalSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  cookies().set(PORTAL_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroyPortalSession(): Promise<void> {
  const token = cookies().get(PORTAL_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }
  cookies().delete(PORTAL_SESSION_COOKIE_NAME);
}

// Revokes every existing session for a user — called on password change so
// stolen/old cookies stop working immediately.
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Teacher secret-code step — after password login, a teacher's userId is
// held in this short-lived signed cookie (not yet a real session) until they
// enter their 4-digit code on /teacher/verify. Mirrors the admin panel's
// stateless HMAC token (lib/auth/session.ts) rather than a DB row, since it
// only needs to survive a couple of minutes.
export const PENDING_TEACHER_COOKIE_NAME = 'braintrain_teacher_pending';
const PENDING_TEACHER_TTL_MS = 10 * 60 * 1000; // 10 minutes

function pendingSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'braintrain-dev-secret-change-me';
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

  const expectedSig = signPending(encoded);
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
  role: PortalRole;
  parentId: string | null;
  teacherId: string | null;
};

export async function getPortalSessionUser(): Promise<PortalSessionUser | null> {
  const token = cookies().get(PORTAL_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { parent: true, teacher: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    secondaryPhone: user.secondaryPhone,
    backupEmail: user.backupEmail,
    twoFactorEnabled: user.twoFactorEnabled,
    fullName: user.fullName,
    role: user.role,
    parentId: user.parent?.id ?? null,
    teacherId: user.teacher?.id ?? null,
  };
}
