'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin/guard';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { chooseAgeGroup } from '@/lib/content/age-range';
import { findPossibleDuplicates, nameTokens, type DuplicateReason } from '@/lib/children/duplicates';
import { MAX_IMPORT_ROWS, parseChildrenFile, type ParsedChildRow } from '@/lib/children/excel';
import { IMPORT_FIELDS, type ColumnMapping, type ImportColumn } from '@/lib/children/import-fields';
import { birthDateProblem, birthDateProblemText, NAME_MAX_LENGTH, nameTooLong } from '@/lib/children/validation';
import { createDbChild, generateUniqueClaimCode, phoneDigits } from '@/lib/db/children';
import { createDbFamily, familyIsEmpty, familyPhones, PARENT_RELATIONS, type FamilyFields } from '@/lib/db/families';
import { prisma } from '@/lib/db/prisma';

// Importing children from an Excel file, in two steps: a preview that saves
// nothing (with warnings for each row), then the rows staff kept. Admin only.

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Why a row can't be imported as it is (fixed in the file, then imported
// again), or null
function rowProblem(row: Pick<ParsedChildRow, 'fullName' | 'dateOfBirth' | 'family'>): string | null {
  if (!row.fullName) return 'No name: this row will be skipped';
  if (nameTooLong(row.fullName)) return `Name longer than ${NAME_MAX_LENGTH} characters: shorten it in the file`;
  if (nameTooLong(row.family.parent1Name) || nameTooLong(row.family.parent2Name)) {
    return `A parent's name is longer than ${NAME_MAX_LENGTH} characters: shorten it in the file`;
  }
  const problem = row.dateOfBirth ? birthDateProblem(new Date(row.dateOfBirth)) : null;
  if (problem) return birthDateProblemText(problem).replace('This date makes', 'The date of birth makes');
  return null;
}

export type ImportPreviewRow = ParsedChildRow & {
  // Why this row can't be imported, or null
  blocked: string | null;
  // Children already here who may be the same one
  duplicates: { id: string; fullName: string; reason: DuplicateReason }[];
  // Lines of the other rows that will share this child's family
  familyWith: number[];
};

export type ImportPreview =
  | { ok: true; rows: ImportPreviewRow[]; columns: ImportColumn[]; headerless: boolean }
  | { ok: false; error: string };

async function isAdmin(): Promise<boolean> {
  return (await getAdminSession())?.kind === 'admin';
}

// Rows sharing a phone number or an email are brothers and sisters: returns,
// for each row, the index of the first row of its family
function groupFamilies(rows: Pick<ParsedChildRow, 'family'>[]): number[] {
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const seen = new Map<string, number>();
  rows.forEach((row, i) => {
    const keys = [
      ...familyPhones(row.family)
        .map(phoneDigits)
        .filter((d) => d.length >= 6)
        .map((d) => `tel:${d.slice(-8)}`),
      ...(row.family.email ? [`mail:${row.family.email.toLowerCase()}`] : []),
    ];
    for (const key of keys) {
      const other = seen.get(key);
      if (other === undefined) seen.set(key, i);
      else parent[find(i)] = find(other);
    }
  });
  return rows.map((_, i) => find(i));
}

// Staff corrections from the import screen, as JSON { column: field | "" }
function parseMapping(value: FormDataEntryValue | null): ColumnMapping {
  if (typeof value !== 'string' || !value) return {};
  try {
    const raw = JSON.parse(value) as Record<string, unknown>;
    const mapping: ColumnMapping = {};
    for (const [col, field] of Object.entries(raw)) {
      const n = Number(col);
      if (Number.isInteger(n) && n > 0 && (field === '' || IMPORT_FIELDS.includes(field as never))) mapping[n] = field as ColumnMapping[number];
    }
    return mapping;
  } catch {
    return {};
  }
}

export async function previewChildrenImport(formData: FormData): Promise<ImportPreview> {
  if (!(await isAdmin())) return { ok: false, error: 'Only the Admin can import children.' };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an Excel file first.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'This file is larger than 5 MB.' };
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, error: 'Only Excel workbooks (.xlsx) can be imported. In Excel, use "Save as" and pick the .xlsx format.' };
  }

  const ageGroups = await listAgeGroupEntries();
  const parsed = await parseChildrenFile(await file.arrayBuffer(), ageGroups, parseMapping(formData.get('mapping')));
  if (!parsed.ok) return parsed;
  if (parsed.rows.length === 0) return { ok: false, error: 'No children were found under the headers.' };

  const existing = await prisma.child.findMany({ select: { id: true, fullName: true, dateOfBirth: true } });
  const families = groupFamilies(parsed.rows);

  const rows: ImportPreviewRow[] = parsed.rows.map((row, i) => {
    const warnings = [...row.warnings];
    const blocked = rowProblem(row);

    // Same child twice in the file
    const tokens = nameTokens(row.fullName).join(' ');
    const earlier = tokens ? parsed.rows.slice(0, i).find((r) => nameTokens(r.fullName).join(' ') === tokens) : undefined;
    if (earlier) warnings.push(`Same name as line ${earlier.line} of the file`);

    const duplicates = row.fullName
      ? findPossibleDuplicates({ fullName: row.fullName, dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null }, existing, 3).map(
          ({ child, reason }) => ({ id: child.id, fullName: child.fullName, reason }),
        )
      : [];

    // A group typed by hand that doesn't match the age: kept, with a warning
    if (row.ageGroupSlug && row.dateOfBirth) {
      const { ageGroupManual } = chooseAgeGroup(ageGroups, new Date(row.dateOfBirth), row.ageGroupSlug);
      if (ageGroupManual) warnings.push("The age group doesn't match the date of birth: kept as typed");
    }

    return {
      ...row,
      blocked,
      warnings,
      duplicates,
      familyWith: parsed.rows.filter((_, j) => j !== i && families[j] === families[i]).map((r) => r.line),
    };
  });

  return { ok: true, rows, columns: parsed.columns, headerless: parsed.headerless };
}

// The rows come back from the browser, so every value is checked again
const str = (value: unknown, max = 200): string | null => {
  const text = typeof value === 'string' ? value.trim().slice(0, max) : '';
  return text || null;
};
const isoDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const relation = (value: unknown) => (PARENT_RELATIONS.includes(value as never) ? (value as FamilyFields['parent1Relation']) : null);

function cleanFamily(value: unknown): FamilyFields {
  const f = (value ?? {}) as Record<string, unknown>;
  return {
    parent1Name: str(f.parent1Name),
    parent1Relation: relation(f.parent1Relation),
    parent1Phone: str(f.parent1Phone, 40),
    parent1Phone2: str(f.parent1Phone2, 40),
    parent2Name: str(f.parent2Name),
    parent2Relation: relation(f.parent2Relation),
    parent2Phone: str(f.parent2Phone, 40),
    parent2Phone2: str(f.parent2Phone2, 40),
    email: str(f.email)?.toLowerCase() ?? null,
  };
}

// Brothers and sisters share one family: each detail comes from the first
// row that has it
function mergeFamilies(families: FamilyFields[]): FamilyFields {
  const merged = { ...families[0] };
  for (const f of families.slice(1)) {
    for (const key of Object.keys(merged) as (keyof FamilyFields)[]) {
      if (!merged[key] && f[key]) (merged as Record<string, unknown>)[key] = f[key];
    }
  }
  return merged;
}

export async function commitChildrenImport(
  input: Omit<ParsedChildRow, 'warnings'>[],
): Promise<{ ok: true; created: number; families: number; skipped: number } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: 'Only the Admin can import children.' };
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'No rows were selected.' };
  if (input.length > MAX_IMPORT_ROWS) return { ok: false, error: `At most ${MAX_IMPORT_ROWS} children at a time.` };

  const ageGroups = await listAgeGroupEntries();
  const rows = input
    .map((r) => ({
      fullName: str(r?.fullName)?.replace(/\s+/g, ' ') ?? '',
      dateOfBirth: isoDate(r?.dateOfBirth),
      ageGroupSlug: typeof r?.ageGroupSlug === 'string' ? r.ageGroupSlug : '',
      institution: str(r?.institution),
      registeredAt: isoDate(r?.registeredAt),
      specialNeeds: str(r?.specialNeeds, 500),
      family: cleanFamily(r?.family),
    }))
    .filter((r) => r.fullName && !rowProblem({ ...r, dateOfBirth: r.dateOfBirth?.toISOString().slice(0, 10) ?? null }));
  const skipped = input.length - rows.length;
  if (rows.length === 0) return { ok: false, error: 'None of the selected rows can be imported (missing name, name too long or age outside 4 to 18).' };

  const groups = groupFamilies(rows);
  const familyIdByGroup = new Map<number, string | null>();
  let families = 0;
  for (const [i, row] of rows.entries()) {
    const group = groups[i];
    if (!familyIdByGroup.has(group)) {
      const family = mergeFamilies(rows.filter((_, j) => groups[j] === group).map((r) => r.family));
      const id = familyIsEmpty(family) ? null : await createDbFamily(family);
      if (id) families++;
      familyIdByGroup.set(group, id);
    }
    await createDbChild({
      parentId: '',
      familyId: familyIdByGroup.get(group) ?? null,
      fullName: row.fullName,
      dateOfBirth: row.dateOfBirth,
      ...chooseAgeGroup(ageGroups, row.dateOfBirth, row.ageGroupSlug),
      institution: row.institution,
      specialNeeds: row.specialNeeds,
      claimCode: await generateUniqueClaimCode(),
      registeredAt: row.registeredAt,
    });
  }

  revalidatePath('/admin/children');
  return { ok: true, created: rows.length, families, skipped };
}
