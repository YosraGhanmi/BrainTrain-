import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { ageGroupSlugForBirthDate, listAgeGroupEntries } from '@/lib/content/lookup';
import { familyPhones, mapFamily, type DbFamily } from '@/lib/db/families';
import type { Child as ChildRow } from '@/lib/generated/prisma/client';
import type { AgeGroupEntry } from '@/lib/content/types';

// A class the child took before the portal existed (from the paper records).
export type PastClass = { schoolYear: string; course: string; note: string | null };

export type DbChild = {
  id: string;
  // '' while a child imported from the paper records has not been claimed by
  // a parent yet (stored as null)
  parentId: string;
  // Brothers and sisters share a family, which holds the parents' details
  // from the paper records
  familyId: string | null;
  fullName: string;
  // null when staff don't know it yet
  dateOfBirth: Date | null;
  // '' = still to fill in (no date of birth and no group picked)
  ageGroupSlug: string;
  // Staff picked the group by hand: it no longer follows the date of birth
  ageGroupManual: boolean;
  institution: string | null;
  specialNeeds: string | null;
  photoUrl: string | null;
  photoColor: string | null;
  // One-time code the front desk hands to the parent to link this child
  claimCode: string | null;
  // When a parent linked this staff-added child to their account
  claimedAt: Date | null;
  pastClasses: PastClass[];
  // Original registration date from the paper records (null = see registrationDate)
  registeredAt: Date | null;
  createdAt: Date;
};

// The date to show as "Registered". A child a parent registered online was
// registered the day it was added; a child staff added (it got a parent code)
// has only the date typed in, which the Admin may leave empty: then null.
export function registrationDate(child: Pick<DbChild, 'registeredAt' | 'createdAt' | 'claimCode' | 'claimedAt'>): Date | null {
  if (child.registeredAt) return child.registeredAt;
  const addedByStaff = Boolean(child.claimCode || child.claimedAt);
  return addedByStaff ? null : child.createdAt;
}

// The group a child is in: the one staff picked by hand, else the one their
// date of birth puts them in this school year (so children move up on their
// own each September), else the stored fallback for ages no group covers.
export function resolveAgeGroupSlug(
  row: Pick<ChildRow, 'dateOfBirth' | 'ageGroupSlug' | 'ageGroupManual'>,
  ageGroups: AgeGroupEntry[],
): string {
  if (row.ageGroupManual || !row.dateOfBirth) return row.ageGroupSlug;
  return ageGroupSlugForBirthDate(row.dateOfBirth, ageGroups) ?? row.ageGroupSlug;
}

function parsePastClasses(value: unknown): PastClass[] {
  if (!Array.isArray(value)) return [];
  return value.map((c) => ({
    schoolYear: String(c?.schoolYear ?? ''),
    course: String(c?.course ?? ''),
    note: c?.note ? String(c.note) : null,
  }));
}

// Also used for children loaded through a join (lib/db/read-models)
export function mapChild(row: ChildRow, ageGroups: AgeGroupEntry[]): DbChild {
  return {
    id: row.id,
    parentId: row.parentId ?? '',
    familyId: row.familyId,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    ageGroupSlug: resolveAgeGroupSlug(row, ageGroups),
    ageGroupManual: row.ageGroupManual,
    institution: row.institution,
    specialNeeds: row.specialNeeds,
    photoUrl: row.photoUrl,
    photoColor: row.photoColor,
    claimCode: row.claimCode,
    claimedAt: row.claimedAt,
    pastClasses: parsePastClasses(row.pastClasses),
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
  data: Pick<DbChild, 'parentId' | 'fullName' | 'dateOfBirth' | 'ageGroupSlug' | 'institution' | 'specialNeeds'> &
    Partial<Pick<DbChild, 'familyId' | 'ageGroupManual' | 'claimCode' | 'pastClasses' | 'registeredAt'>>,
): Promise<string> {
  const row = await prisma.child.create({
    data: {
      parentId: data.parentId || null,
      familyId: data.familyId ?? null,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      ageGroupSlug: data.ageGroupSlug,
      ageGroupManual: data.ageGroupManual ?? false,
      institution: data.institution,
      specialNeeds: data.specialNeeds,
      claimCode: data.claimCode ?? null,
      pastClasses: data.pastClasses ?? [],
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

// Links the child to the parent and burns the code. Brothers and sisters
// staff put in the same family and that no parent has linked yet come along,
// so one code links the whole family. Returns null when the code does not
// match an unclaimed child.
export async function claimDbChild(rawCode: string, parentId: string): Promise<{ child: DbChild; siblings: number } | null> {
  const code = normalizeClaimCode(rawCode);
  if (code.length !== CODE_LENGTH) return null;

  const target = await prisma.child.findUnique({ where: { claimCode: code }, select: { id: true, familyId: true } });
  if (!target) return null;

  // Conditional update: only one parent can win a code, even if two submit
  // it at the same moment
  const { count } = await prisma.child.updateMany({
    where: { id: target.id, claimCode: code, parentId: null },
    data: { parentId, claimCode: null, claimedAt: new Date() },
  });
  if (count === 0) return null;

  let siblings = 0;
  if (target.familyId) {
    ({ count: siblings } = await prisma.child.updateMany({
      where: { familyId: target.familyId, parentId: null, id: { not: target.id } },
      data: { parentId, claimCode: null, claimedAt: new Date() },
    }));
  }

  const child = await getDbChild(target.id);
  return child ? { child, siblings } : null;
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
  family: DbFamily | null;
  // The linked parent account, if any
  account: { fullName: string; phone: string; secondaryPhone: string | null; email: string } | null;
  // The names to show: the account holder first, then the family's parents
  parentNames: string[];
  // Every phone number, account first, without repeats
  phones: string[];
  parentEmail: string;
  enrollmentCount: number;
  // A payment past its due date and still not paid
  hasOverduePayment: boolean;
};

// Digits only, so "+216 22 333 444" and "22333444" compare equal
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Every child with what the Children page shows and filters on. Parent
// columns come from the linked account, then the family typed in by staff.
export async function listAllDbChildren(): Promise<AdminChildRow[]> {
  const now = new Date();
  const [rows, ageGroups] = await Promise.all([
    prisma.child.findMany({
      include: {
        parent: { select: { fullName: true, phone: true, secondaryPhone: true, email: true } },
        family: true,
        _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } },
        // At most one row: only whether a payment is overdue matters here
        enrollments: {
          where: {
            status: { not: 'CANCELLED' },
            payments: { some: { OR: [{ status: 'OVERDUE' }, { status: 'PENDING', dueDate: { lt: now } }] } },
          },
          select: { id: true },
          take: 1,
        },
      },
    }),
    listAgeGroupEntries(),
  ]);
  const children = rows.map((row): AdminChildRow => {
    const child = mapChild(row, ageGroups);
    const family = row.family ? mapFamily(row.family) : null;
    const account = row.parent;
    return {
      ...child,
      family,
      account,
      parentNames: uniqueBy(
        [account?.fullName, family?.parent1Name, family?.parent2Name].filter((n): n is string => Boolean(n?.trim())),
        (n) => n.trim().toLowerCase(),
      ),
      phones: uniqueBy(
        [account?.phone, account?.secondaryPhone, ...familyPhones(family)].filter((p): p is string => Boolean(p?.trim())),
        phoneDigits,
      ),
      parentEmail: account?.email || family?.email || '',
      enrollmentCount: row._count.enrollments,
      hasOverduePayment: row.enrollments.length > 0,
    };
  });
  // Newest first, by when the child was added to the system: imported
  // children often have no registration date, so it can't drive the order
  return children.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Light list for the "brother or sister of" pickers: name plus enough to
// tell two children with the same name apart
export async function listDbChildPickerOptions(): Promise<{ id: string; fullName: string; detail: string }[]> {
  const rows = await prisma.child.findMany({
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      parent: { select: { fullName: true } },
      family: { select: { parent1Name: true, parent2Name: true } },
    },
    orderBy: { fullName: 'asc' },
  });
  return rows.map((r) => {
    const parent = r.parent?.fullName || r.family?.parent1Name || r.family?.parent2Name;
    const detail = [r.dateOfBirth ? `born ${r.dateOfBirth.getUTCFullYear()}` : null, parent ? `parent ${parent}` : null]
      .filter(Boolean)
      .join(' · ');
    return { id: r.id, fullName: r.fullName, detail };
  });
}
