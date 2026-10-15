import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/portal-auth/password';
import type { Prisma, User } from '@/lib/generated/prisma/client';

export type DbPortalRole = 'PARENT' | 'TEACHER' | 'SECRETARY';

export type DbPortalProfile = {
  id: string;
  email: string;
  phone: string;
  secondaryPhone: string | null;
  backupEmail: string | null;
  twoFactorEnabled: boolean;
  twoFactorCodeHash: string | null;
  twoFactorCodeExpiresAt: Date | null;
  fullName: string;
  role: DbPortalRole;
  // A parent's own id / a teacher's own id, null for the other roles
  parentId: string | null;
  teacherId: string | null;
  isFrozen: boolean;
  parentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

export function mapPortalProfile(row: User): DbPortalProfile {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondaryPhone,
    backupEmail: row.backupEmail,
    twoFactorEnabled: row.twoFactorEnabled,
    twoFactorCodeHash: row.twoFactorCodeHash,
    twoFactorCodeExpiresAt: row.twoFactorCodeExpiresAt,
    fullName: row.fullName,
    role: row.role,
    parentId: row.role === 'PARENT' ? row.id : null,
    teacherId: row.role === 'TEACHER' ? row.id : null,
    isFrozen: row.isFrozen,
    parentStatus: row.parentStatus,
  };
}

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

// The id of the account with this email and password, or null. Accounts
// with no password yet (imported from Firebase) can't sign in until they
// reset it, or the admin sets one.
export async function verifyDbUserPassword(email: string, password: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user?.passwordHash || !password) return null;
  return (await verifyPassword(password, user.passwordHash)) ? user.id : null;
}

export async function setDbUserPassword(userId: string, password: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createDbParentProfile(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<void> {
  await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phone: input.phone,
      role: 'PARENT',
      parentStatus: 'PENDING',
      passwordHash: await hashPassword(input.password),
    },
  });
}

export async function getDbPortalProfile(uid: string): Promise<DbPortalProfile | null> {
  if (!uid) return null;
  const row = await prisma.user.findUnique({ where: { id: uid } });
  return row ? mapPortalProfile(row) : null;
}

export async function getDbParentByPhone(phone: string): Promise<DbPortalProfile | null> {
  const row = await prisma.user.findFirst({ where: { phone, role: 'PARENT' } });
  return row ? mapPortalProfile(row) : null;
}

export async function listDbParentProfiles(): Promise<Array<DbPortalProfile & { childCount: number }>> {
  const rows = await prisma.user.findMany({
    where: { role: 'PARENT' },
    include: { _count: { select: { children: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => ({ ...mapPortalProfile(row), childCount: row._count.children }));
}

// Account fields a parent or the admin can change
export type PortalProfileUpdate = Pick<
  Prisma.UserUpdateInput,
  | 'phone'
  | 'secondaryPhone'
  | 'backupEmail'
  | 'isFrozen'
  | 'parentStatus'
  | 'twoFactorEnabled'
  | 'twoFactorCodeHash'
  | 'twoFactorCodeExpiresAt'
  | 'passwordResetCodeHash'
  | 'passwordResetCodeExpiresAt'
>;

export async function updateDbPortalProfile(uid: string, data: PortalProfileUpdate): Promise<void> {
  await prisma.user.update({ where: { id: uid }, data });
}

export async function getDbPasswordReset(uid: string): Promise<{ codeHash: string | null; expiresAt: Date | null }> {
  const row = await prisma.user.findUnique({
    where: { id: uid },
    select: { passwordResetCodeHash: true, passwordResetCodeExpiresAt: true },
  });
  return { codeHash: row?.passwordResetCodeHash ?? null, expiresAt: row?.passwordResetCodeExpiresAt ?? null };
}

export async function deleteDbPortalProfile(uid: string): Promise<void> {
  await prisma.user.delete({ where: { id: uid } });
}
