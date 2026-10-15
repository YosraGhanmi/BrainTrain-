import { prisma } from '@/lib/db/prisma';
import type { User } from '@/lib/generated/prisma/client';

export type DbSecretaryProfile = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'SECRETARY';
  isFrozen: boolean;
};

function mapSecretary(row: User): DbSecretaryProfile {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.fullName,
    role: 'SECRETARY',
    isFrozen: row.isFrozen,
  };
}

export async function createDbSecretaryProfile(input: {
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
}): Promise<string> {
  const row = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phone: input.phone,
      role: 'SECRETARY',
      passwordHash: input.passwordHash,
    },
  });
  return row.id;
}

export async function listDbSecretaries(): Promise<DbSecretaryProfile[]> {
  const rows = await prisma.user.findMany({ where: { role: 'SECRETARY' }, orderBy: { fullName: 'asc' } });
  return rows.map(mapSecretary);
}

export async function getDbSecretaryByEmail(email: string): Promise<DbSecretaryProfile | null> {
  const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return row?.role === 'SECRETARY' ? mapSecretary(row) : null;
}

export async function getDbSecretaryProfile(uid: string): Promise<DbSecretaryProfile | null> {
  if (!uid) return null;
  const row = await prisma.user.findUnique({ where: { id: uid } });
  return row?.role === 'SECRETARY' ? mapSecretary(row) : null;
}

export async function updateDbSecretaryProfile(uid: string, data: Partial<Pick<DbSecretaryProfile, 'isFrozen'>>): Promise<void> {
  await prisma.user.update({ where: { id: uid }, data });
}

export async function deleteDbSecretaryProfile(uid: string): Promise<void> {
  await prisma.user.delete({ where: { id: uid } });
}
