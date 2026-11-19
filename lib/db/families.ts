import { prisma } from '@/lib/db/prisma';
import type { Family as FamilyRow } from '@/lib/generated/prisma/client';

export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN';
export const PARENT_RELATIONS: ParentRelation[] = ['FATHER', 'MOTHER', 'GUARDIAN'];
export const PARENT_RELATION_LABELS: Record<ParentRelation, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
};

// The parents' details from the paper records, shared by brothers and sisters
export type DbFamily = {
  id: string;
  parent1Name: string | null;
  parent1Relation: ParentRelation | null;
  parent1Phone: string | null;
  parent1Phone2: string | null;
  parent2Name: string | null;
  parent2Relation: ParentRelation | null;
  parent2Phone: string | null;
  parent2Phone2: string | null;
  email: string | null;
};

export type FamilyFields = Omit<DbFamily, 'id'>;

const FIELD_NAMES: (keyof FamilyFields)[] = [
  'parent1Name',
  'parent1Relation',
  'parent1Phone',
  'parent1Phone2',
  'parent2Name',
  'parent2Relation',
  'parent2Phone',
  'parent2Phone2',
  'email',
];

export const EMPTY_FAMILY: FamilyFields = Object.fromEntries(FIELD_NAMES.map((k) => [k, null])) as FamilyFields;

export function mapFamily(row: FamilyRow): DbFamily {
  return {
    id: row.id,
    parent1Name: row.parent1Name,
    parent1Relation: row.parent1Relation,
    parent1Phone: row.parent1Phone,
    parent1Phone2: row.parent1Phone2,
    parent2Name: row.parent2Name,
    parent2Relation: row.parent2Relation,
    parent2Phone: row.parent2Phone,
    parent2Phone2: row.parent2Phone2,
    email: row.email,
  };
}

function pickFields(family: FamilyFields): FamilyFields {
  return Object.fromEntries(FIELD_NAMES.map((k) => [k, family[k] ?? null])) as FamilyFields;
}

// A relation alone (no name, no phone) doesn't count as details
export function familyIsEmpty(family: FamilyFields | null | undefined): boolean {
  if (!family) return true;
  return FIELD_NAMES.every((k) => k.endsWith('Relation') || !family[k]);
}

// Every phone number in the family, in the order they were typed
export function familyPhones(family: FamilyFields | null | undefined): string[] {
  if (!family) return [];
  return [family.parent1Phone, family.parent1Phone2, family.parent2Phone, family.parent2Phone2].filter((p): p is string => Boolean(p));
}

// Fills the blanks of `into` with what `from` has, field by field, so merging
// two families never erases a detail either side had
function fillBlanks(into: FamilyFields, from: FamilyFields): FamilyFields {
  return Object.fromEntries(FIELD_NAMES.map((k) => [k, into[k] ?? from[k] ?? null])) as FamilyFields;
}

export async function getDbFamily(familyId: string | null | undefined): Promise<DbFamily | null> {
  if (!familyId) return null;
  const row = await prisma.family.findUnique({ where: { id: familyId } });
  return row ? mapFamily(row) : null;
}

// Saves the parents' details typed on a child's form. They go to the family
// the child shares with its brothers and sisters; a child with no family yet
// gets one, unless nothing was typed.
export async function saveDbChildFamily(childId: string, fields: FamilyFields): Promise<void> {
  const child = await prisma.child.findUnique({ where: { id: childId }, select: { familyId: true } });
  if (!child) return;
  const data = pickFields(fields);
  if (child.familyId) {
    await prisma.family.update({ where: { id: child.familyId }, data });
  } else if (!familyIsEmpty(data) || data.parent1Relation || data.parent2Relation) {
    // A relation alone is kept too: e.g. "Father" for the linked account holder
    const family = await prisma.family.create({ data });
    await prisma.child.update({ where: { id: childId }, data: { familyId: family.id } });
  }
}

export async function createDbFamily(fields: FamilyFields): Promise<string> {
  const family = await prisma.family.create({ data: pickFields(fields) });
  return family.id;
}

export type LinkSiblingResult = 'ok' | 'same' | 'accounts';

// Puts two children (and the brothers and sisters each already had) in one
// family. Parent details are merged, the first child's winning where both
// have one. A child linked to a parent account brings the others onto that
// account too; two different accounts can't be merged here.
export async function linkDbSiblings(childId: string, siblingId: string): Promise<LinkSiblingResult> {
  if (childId === siblingId) return 'same';
  return prisma.$transaction(async (tx) => {
    const [a, b] = await Promise.all([
      tx.child.findUnique({ where: { id: childId }, include: { family: true } }),
      tx.child.findUnique({ where: { id: siblingId }, include: { family: true } }),
    ]);
    if (!a || !b) return 'same';
    if (a.familyId && a.familyId === b.familyId && a.parentId === b.parentId) return 'ok';

    // Everyone already grouped with either child moves together
    const memberWhere = (c: typeof a) => [
      { id: c.id },
      ...(c.familyId ? [{ familyId: c.familyId }] : []),
      ...(c.parentId ? [{ parentId: c.parentId }] : []),
    ];
    const members = await tx.child.findMany({
      where: { OR: [...memberWhere(a), ...memberWhere(b)] },
      select: { id: true, parentId: true },
    });
    const accounts = new Set(members.map((m) => m.parentId).filter(Boolean));
    if (accounts.size > 1) return 'accounts';
    const parentId = [...accounts][0] ?? null;

    const merged = fillBlanks(
      a.family ? pickFields(mapFamily(a.family)) : EMPTY_FAMILY,
      b.family ? pickFields(mapFamily(b.family)) : EMPTY_FAMILY,
    );
    let familyId = a.familyId ?? b.familyId;
    if (familyId) {
      await tx.family.update({ where: { id: familyId }, data: merged });
    } else {
      familyId = (await tx.family.create({ data: merged })).id;
    }

    const ids = members.map((m) => m.id);
    await tx.child.updateMany({ where: { id: { in: ids } }, data: { familyId } });
    if (parentId) {
      // Children joining a parent account no longer need their own code
      await tx.child.updateMany({
        where: { id: { in: ids }, parentId: null },
        data: { parentId, claimCode: null, claimedAt: new Date() },
      });
    }

    // The family the second child came from is now empty
    if (b.familyId && b.familyId !== familyId) {
      const left = await tx.child.count({ where: { familyId: b.familyId } });
      if (left === 0) await tx.family.delete({ where: { id: b.familyId } });
    }
    return 'ok';
  });
}

// Takes a child out of its family. It keeps a copy of the parents' details,
// so its contact isn't lost. Its parent account, if any, stays linked.
export async function detachDbChildFromFamily(childId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const child = await tx.child.findUnique({ where: { id: childId }, include: { family: true } });
    if (!child?.family) return;
    const others = await tx.child.count({ where: { familyId: child.familyId, id: { not: childId } } });
    if (others === 0) return;
    const copy = await tx.family.create({ data: pickFields(mapFamily(child.family)) });
    await tx.child.update({ where: { id: childId }, data: { familyId: copy.id } });
  });
}

// Brothers and sisters: children in the same family or on the same parent
// account
export async function listDbSiblings(child: { id: string; familyId: string | null; parentId: string }) {
  const or = [
    ...(child.familyId ? [{ familyId: child.familyId }] : []),
    ...(child.parentId ? [{ parentId: child.parentId }] : []),
  ];
  if (or.length === 0) return [];
  return prisma.child.findMany({
    where: { OR: or, id: { not: child.id } },
    select: { id: true, fullName: true, dateOfBirth: true, familyId: true },
    orderBy: { createdAt: 'asc' },
  });
}
