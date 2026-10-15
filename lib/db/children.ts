import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { ageGroupSlugForBirthDate, listAgeGroupEntries } from '@/lib/content/lookup';
import type { Child as ChildRow } from '@/lib/generated/prisma/client';
import type { AgeGroupEntry } from '@/lib/content/types';

// A class the child took before the portal existed (from the paper records).
export type PastClass = { schoolYear: string; course: string; note: string | null };

export type DbChild = {
  id: string;
  // '' while a child imported from the paper records has not been claimed by
  // a parent yet (stored as null)
  parentId: string;
  fullName: string;
  dateOfBirth: Date;
  ageGroupSlug: string;
  institution: string | null;
  specialNeeds: string | null;
  photoUrl: string | null;
  photoColor: string | null;
  // One-time code the front desk hands to the parent to link this child
  claimCode: string | null;
  pastClasses: PastClass[];
  // Parent contact from the paper records, for children with no linked
  // account yet. Once linked, the account's own details take precedence.
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  // Original registration date from the paper records (null = createdAt)
  registeredAt: Date | null;
  createdAt: Date;
};

// Front-desk details staff can set on an imported child
export type ChildContactFields = Pick<DbChild, 'contactName' | 'contactPhone' | 'contactEmail' | 'registeredAt'>;

function parsePastClasses(value: unknown): PastClass[] {
  if (!Array.isArray(value)) return [];
  return value.map((c) => ({
    schoolYear: String(c?.schoolYear ?? ''),
    course: String(c?.course ?? ''),
    note: c?.note ? String(c.note) : null,
  }));
}

// The age group is derived from the date of birth on every read, so children
// move up automatically each school year. The stored slug is only a fallback
// for ages no group covers.
function mapChild(row: ChildRow, ageGroups: AgeGroupEntry[]): DbChild {
  return {
    id: row.id,
    parentId: row.parentId ?? '',
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    ageGroupSlug: ageGroupSlugForBirthDate(row.dateOfBirth, ageGroups) ?? row.ageGroupSlug,
    institution: row.institution,
    specialNeeds: row.specialNeeds,
    photoUrl: row.photoUrl,
    photoColor: row.photoColor,
    claimCode: row.claimCode,
    pastClasses: parsePastClasses(row.pastClasses),
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    registeredAt: row.registeredAt,
    createdAt: row.createdAt,
  };
}

export async function listDbChildren(parentId: string): Promise<DbChild[]> {
  const [rows, ageGroups] = await Promise.all([
    prisma.child.findMany({ where: { parentId }, orderBy: { createdAt: 'asc' } }),
    listAgeGroupEntries(),
  ]);
  return rows.map((row) => mapChild(row, ageGroups));
}

export async function getDbChild(childId: string): Promise<DbChild | null> {
  if (!childId) return null;
  const [row, ageGroups] = await Promise.all([prisma.child.findUnique({ where: { id: childId } }), listAgeGroupEntries()]);
  return row ? mapChild(row, ageGroups) : null;
}

export async function createDbChild(
  data: Omit<DbChild, 'id' | 'createdAt' | 'photoUrl' | 'photoColor' | 'claimCode' | 'pastClasses' | keyof ChildContactFields> &
    Partial<Pick<DbChild, 'claimCode' | 'pastClasses'> & ChildContactFields>,
): Promise<string> {
  const row = await prisma.child.create({
    data: {
      parentId: data.parentId || null,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      ageGroupSlug: data.ageGroupSlug,
      institution: data.institution,
      specialNeeds: data.specialNeeds,
      claimCode: data.claimCode ?? null,
      pastClasses: data.pastClasses ?? [],
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      registeredAt: data.registeredAt ?? null,
    },
  });
  return row.id;
}

// ---------------------------------------------------------------------------
// Claim codes: children imported from the paper records are created without a
// parent; the parent types the code the front desk gives them to link it.
// ---------------------------------------------------------------------------

// No 0/O, 1/I/L so codes can be read out loud or copied from paper safely
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function normalizeClaimCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatClaimCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function generateUniqueClaimCode(): Promise<string> {
  for (;;) {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    const clash = await prisma.child.findUnique({ where: { claimCode: code }, select: { id: true } });
    if (!clash) return code;
  }
}

// Links the child to the parent and burns the code. Returns null when the
// code does not match an unclaimed child.
export async function claimDbChild(rawCode: string, parentId: string): Promise<DbChild | null> {
  const code = normalizeClaimCode(rawCode);
  if (code.length !== CODE_LENGTH) return null;

  const target = await prisma.child.findUnique({ where: { claimCode: code }, select: { id: true } });
  if (!target) return null;

  // Conditional update: only one parent can win a code, even if two submit
  // it at the same moment
  const { count } = await prisma.child.updateMany({
    where: { id: target.id, claimCode: code, parentId: null },
    data: { parentId, claimCode: null, claimedAt: new Date() },
  });
  if (count === 0) return null;

  return getDbChild(target.id);
}

export async function updateDbChild(childId: string, data: Partial<Omit<DbChild, 'id' | 'parentId' | 'createdAt'>>): Promise<void> {
  const { pastClasses, ...rest } = data;
  await prisma.child.update({
    where: { id: childId },
    data: { ...rest, ...(pastClasses ? { pastClasses } : {}) },
  });
}

export async function deleteDbChild(childId: string): Promise<void> {
  await prisma.child.delete({ where: { id: childId } });
}

export type AdminChildRow = DbChild & {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrollmentCount: number;
};

// Oldest registration first, like the paper register. Parent columns come
// from the linked account, falling back to the contact typed in by staff.
export async function listAllDbChildren(): Promise<AdminChildRow[]> {
  const [rows, ageGroups] = await Promise.all([
    prisma.child.findMany({
      include: {
        parent: { select: { fullName: true, phone: true, email: true } },
        _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } },
      },
    }),
    listAgeGroupEntries(),
  ]);
  const children = rows.map((row) => {
    const child = mapChild(row, ageGroups);
    return {
      ...child,
      parentName: row.parent?.fullName || child.contactName || '',
      parentPhone: row.parent?.phone || child.contactPhone || '',
      parentEmail: row.parent?.email || child.contactEmail || '',
      enrollmentCount: row._count.enrollments,
    };
  });
  const registered = (c: DbChild) => (c.registeredAt ?? c.createdAt).getTime();
  return children.sort((a, b) => registered(a) - registered(b));
}
