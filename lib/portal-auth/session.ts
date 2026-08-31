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
