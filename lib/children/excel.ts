import ExcelJS from 'exceljs';
import { ageOn, parseAgeRange } from '@/lib/content/age-range';
import { formatClaimCode, registrationDate, type AdminChildRow } from '@/lib/db/children';
import { PARENT_RELATION_LABELS, type FamilyFields, type ParentRelation } from '@/lib/db/families';
import { missingDetails, MISSING_DETAIL_LABELS } from '@/lib/children/list';
import type { AgeGroupEntry } from '@/lib/content/types';
import { IMPORT_FIELDS, type ColumnMapping, type ColumnSource, type ImportColumn, type ImportField } from '@/lib/children/import-fields';

// Excel files for the Children page: the import template, the export (whose
// first columns are the template's, so an export can be edited and imported
// again elsewhere), and reading a file staff fill in, which may use these
// headers or their own (French or English).

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

// The template's columns, in order, with their header
const TEMPLATE_COLUMNS: { field: ImportField; header: string; width: number; date?: boolean }[] = [
  { field: 'fullName', header: 'Full name', width: 28 },
  { field: 'dateOfBirth', header: 'Date of birth', width: 14, date: true },
  { field: 'ageGroup', header: 'Age group', width: 14 },
  { field: 'school', header: 'School', width: 24 },
  { field: 'registeredAt', header: 'Registration date', width: 16, date: true },
  { field: 'specialNeeds', header: 'Special accommodations', width: 24 },
  { field: 'parent1Relation', header: 'Parent 1 relation', width: 16 },
  { field: 'parent1Name', header: 'Parent 1 name', width: 24 },
  { field: 'parent1Phone', header: 'Parent 1 phone', width: 16 },
  { field: 'parent1Phone2', header: 'Parent 1 phone 2', width: 16 },
  { field: 'parent2Relation', header: 'Parent 2 relation', width: 16 },
  { field: 'parent2Name', header: 'Parent 2 name', width: 24 },
  { field: 'parent2Phone', header: 'Parent 2 phone', width: 16 },
  { field: 'parent2Phone2', header: 'Parent 2 phone 2', width: 16 },
  { field: 'email', header: 'Email', width: 28 },
];

// "Date de naissance (jj/mm/aaaa)" -> "datedenaissance"
function normalizeHeader(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// "Tél. du père (GSM)" -> ["tel", "du", "pere"]: no accents, no case, and
// what's in brackets (formats, hints) left out
function headerWords(text: string): string[] {
  return text
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const TEMPLATE_HEADERS = new Map(TEMPLATE_COLUMNS.map((c) => [normalizeHeader(c.header), c.field]));

// A generic phone or parent name column takes the next free parent slot
type Slot = ImportField | 'phone' | 'parentName';
const PHONE_SLOTS: ImportField[] = ['parent1Phone', 'parent1Phone2', 'parent2Phone', 'parent2Phone2'];
const NAME_SLOTS: ImportField[] = ['parent1Name', 'parent2Name'];

const has = (words: string[], ...options: string[]) => words.some((w) => options.includes(w));

// What a header means, from its words, in French or English. Order matters:
// "Tél. père" is the father's phone, not a name; "Nom et prénom" is the
// child's full name, not a first name.
function fieldFromHeader(header: string): Slot | null {
  const exact = TEMPLATE_HEADERS.get(normalizeHeader(header));
  if (exact) return exact;

  const words = headerWords(header);
  if (words.length === 0) return null;
  const joined = words.join('');

  const father = has(words, 'pere', 'papa', 'father', 'fathers', 'dad');
  const mother = has(words, 'mere', 'maman', 'mother', 'mothers', 'mom', 'mum');
  const parent2 = /parent2/.test(joined);
  const parent1 = /parent1/.test(joined);
  const parent = parent1 || parent2 || has(words, 'parent', 'parents', 'tuteur', 'tutrice', 'guardian', 'responsable');
  // "Tel 2", "Autre téléphone", "Second phone" (the 2 of "Parent 2" doesn't count)
  const second =
    has(words, 'autre', 'second', 'secondaire', 'other', 'alternatif', 'alternative') ||
    /(?<!parent)2$/.test(joined) ||
    (words.includes('2') && !parent2);

  if (has(words, 'mail', 'email', 'courriel') || /e?mail/.test(joined)) return 'email';
  if (has(words, 'naissance', 'birth', 'birthday', 'birthdate', 'dob', 'ne', 'nee', 'neele') || /datenaissance|dateofbirth/.test(joined)) {
    return 'dateOfBirth';
  }
  if (has(words, 'inscription', 'inscrit', 'inscrite', 'registration', 'registered', 'enrolled', 'enrollment')) return 'registeredAt';

  const phone = has(words, 'tel', 'telephone', 'phone', 'gsm', 'mobile', 'portable', 'numero', 'num', 'cell', 'cellphone') || /telephone|phone/.test(joined);
  if (phone) {
    if (father) return second ? 'fatherPhone2' : 'fatherPhone';
    if (mother) return second ? 'motherPhone2' : 'motherPhone';
    if (parent2) return second ? 'parent2Phone2' : 'parent2Phone';
    if (parent1) return second ? 'parent1Phone2' : 'parent1Phone';
    return 'phone';
  }
  if (has(words, 'lien', 'relation', 'relationship', 'qualite')) return parent2 ? 'parent2Relation' : 'parent1Relation';

  const name = has(words, 'nom', 'name', 'prenom', 'firstname', 'lastname', 'noms');
  if (father && (name || words.length <= 2)) return 'fatherName';
  if (mother && (name || words.length <= 2)) return 'motherName';
  if (parent2) return 'parent2Name';
  if (parent1) return 'parent1Name';
  if (parent && (name || words.length <= 2)) return 'parentName';

  if (has(words, 'ecole', 'school', 'etablissement', 'lycee', 'college', 'institution', 'institut')) return 'school';
  if ((has(words, 'groupe', 'group', 'tranche') && !name) || /agegroup|groupedage|tranchedage/.test(joined)) return 'ageGroup';
  if (has(words, 'besoin', 'besoins', 'handicap', 'amenagement', 'amenagements', 'special', 'accommodations', 'allergie', 'allergies', 'sante', 'health')) {
    return 'specialNeeds';
  }

  if (
    /nomcomplet|nometprenom|nomprenom|prenometnom|prenomnom|fullname|childname|studentname|nomdelenfant|nomenfant/.test(joined) ||
    has(words, 'enfant', 'eleve', 'child', 'student', 'kid')
  ) {
    return 'fullName';
  }
  if (has(words, 'prenom', 'firstname') || (words.includes('first') && name)) return 'firstName';
  if (/nomdefamille|lastname|surname|familyname/.test(joined) || (words.length === 1 && words[0] === 'nom')) return 'lastName';
  if (words.length === 1 && has(words, 'name', 'nom', 'noms')) return 'fullName';
  return null;
}

const RELATION_LIST = Object.values(PARENT_RELATION_LABELS).join(',');

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  row.alignment = { vertical: 'middle' };
  row.height = 22;
}

async function toBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export async function buildImportTemplate(ageGroups: AgeGroupEntry[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Children', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({
    header: c.header,
    key: c.field,
    width: c.width,
    style: c.date ? { numFmt: 'dd/mm/yyyy' } : c.field.endsWith('Phone') || c.field.endsWith('Phone2') ? { numFmt: '@' } : {},
  }));
  styleHeader(sheet.getRow(1));

  // Drop-down lists on the first rows, so relations and groups are typed the
  // way the import reads them (other values are still accepted)
  const groupList = ageGroups.map((g) => g.label.en.replace(/,/g, ' ')).join(',');
  const columnOf = (field: ImportField) => TEMPLATE_COLUMNS.findIndex((c) => c.field === field) + 1;
  for (let r = 2; r <= 500; r++) {
    for (const field of ['parent1Relation', 'parent2Relation'] as const) {
      sheet.getCell(r, columnOf(field)).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: false,
        formulae: [`"${RELATION_LIST}"`],
      };
    }
    if (groupList.length < 250) {
      sheet.getCell(r, columnOf('ageGroup')).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: false,
        formulae: [`"${groupList}"`],
      };
    }
  }

  const help = workbook.addWorksheet('Instructions');
  help.columns = [{ width: 110 }];
  [
    'One row per child, in the "Children" sheet. Only the full name is required.',
    'Dates: day/month/year (e.g. 14/03/2017), or an Excel date.',
    'Age group: leave empty to place the child from the date of birth. A group typed here is kept even if it does not match the age (the import warns you).',
    `Relation: ${RELATION_LIST.replace(/,/g, ', ')} (Père, Mère and Tuteur are read too).`,
    'Brothers and sisters: rows with the same phone number or email are put in the same family automatically, with one parent code for all of them.',
    'Your own file works too: headers like Nom, Prénom, Date de naissance, Tél. père, Nom de la mère, E-mail are understood, in French or English. Columns with no clear header are guessed from their values (dates, phone numbers, emails).',
    'The import screen lists every column with how it was read and a few of its values; any column can be corrected or ignored there.',
    'Before anything is saved, the import shows every row with its warnings (possible duplicates, unreadable dates) so you can untick rows.',
  ].forEach((line, i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = line;
    cell.alignment = { wrapText: true, vertical: 'top' };
  });

  return toBuffer(workbook);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function buildChildrenExport(children: AdminChildRow[], ageGroups: AgeGroupEntry[]): Promise<Buffer> {
  const groupLabel = new Map(ageGroups.map((g) => [g.slug, g.label.en]));
  const relation = (r: ParentRelation | null) => (r ? PARENT_RELATION_LABELS[r] : '');
  const today = new Date();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Children', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    ...TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.field, width: c.width, style: c.date ? { numFmt: 'dd/mm/yyyy' } : {} })),
    { header: 'Age', key: 'age', width: 7 },
    { header: 'Age group picked by hand', key: 'manual', width: 12 },
    { header: 'Parent account', key: 'account', width: 24 },
    { header: 'Parent account phone', key: 'accountPhone', width: 18 },
    { header: 'Parent account email', key: 'accountEmail', width: 28 },
    { header: 'Parent code', key: 'code', width: 13 },
    { header: 'Courses this year', key: 'courses', width: 10 },
    { header: 'Payment overdue', key: 'overdue', width: 10 },
    { header: 'To complete', key: 'missing', width: 26 },
  ];
  styleHeader(sheet.getRow(1));

  for (const c of children) {
    const f: Partial<FamilyFields> = c.family ?? {};
    const missing = missingDetails(c);
    sheet.addRow({
      fullName: c.fullName,
      dateOfBirth: c.dateOfBirth ?? null,
      ageGroup: c.ageGroupSlug ? (groupLabel.get(c.ageGroupSlug) ?? c.ageGroupSlug) : '',
      school: c.institution ?? '',
      registeredAt: registrationDate(c) ?? null,
      specialNeeds: c.specialNeeds ?? '',
      parent1Relation: relation(f.parent1Relation ?? null),
      parent1Name: f.parent1Name ?? '',
      parent1Phone: f.parent1Phone ?? '',
      parent1Phone2: f.parent1Phone2 ?? '',
      parent2Relation: relation(f.parent2Relation ?? null),
      parent2Name: f.parent2Name ?? '',
      parent2Phone: f.parent2Phone ?? '',
      parent2Phone2: f.parent2Phone2 ?? '',
      email: f.email ?? '',
      age: c.dateOfBirth ? ageOn(c.dateOfBirth, today) : null,
      manual: c.ageGroupManual ? 'Yes' : '',
      account: c.account?.fullName ?? '',
      accountPhone: [c.account?.phone, c.account?.secondaryPhone].filter(Boolean).join(' / '),
      accountEmail: c.account?.email ?? '',
      code: !c.parentId && c.claimCode ? formatClaimCode(c.claimCode) : '',
      courses: c.enrollmentCount,
      overdue: c.hasOverduePayment ? 'Yes' : '',
      missing: missing.map((m) => MISSING_DETAIL_LABELS[m]).join(', '),
    });
  }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
  return toBuffer(workbook);
}

// ---------------------------------------------------------------------------
// Reading a file
// ---------------------------------------------------------------------------

// One child read from a row, before it's saved. Dates are yyyy-mm-dd.
export type ParsedChildRow = {
  line: number;
  fullName: string;
  dateOfBirth: string | null;
  // A group slug, or "" to place the child from the date of birth
  ageGroupSlug: string;
  institution: string | null;
  registeredAt: string | null;
  specialNeeds: string | null;
  family: FamilyFields;
  warnings: string[];
};

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((r) => r.text).join('').trim();
    // Hyperlink text can itself be rich text
    if ('text' in value) return typeof value.text === 'string' ? value.text.trim() : cellText(value.text as ExcelJS.CellValue);
    // Formulas: their last computed value (an error value reads as empty)
    if ('result' in value) return cellText((value.result ?? null) as ExcelJS.CellValue);
    return '';
  }
  return String(value).trim();
}

const isoDate = (y: number, m: number, d: number): string | null => {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
};

// An Excel date, a date serial number, or text like 14/03/2017, 14-3-17 or
// 2017-03-14. Day first, as written in Tunisia and France.
function cellDate(value: ExcelJS.CellValue): { date: string | null; raw: string } {
  if (value && typeof value === 'object' && !(value instanceof Date) && 'result' in value) {
    return cellDate((value.result ?? null) as ExcelJS.CellValue);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? { date: null, raw: '' }
      : { date: isoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()), raw: '' };
  }
  if (typeof value === 'number') {
    if (value < 1 || value > 80000) return { date: null, raw: String(value) };
    const date = new Date(Math.round((value - 25569) * 86400000));
    return { date: isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()), raw: String(value) };
  }
  const raw = cellText(value);
  if (!raw) return { date: null, raw };
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(raw);
  if (m) return { date: isoDate(+m[1], +m[2], +m[3]), raw };
  m = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/.exec(raw);
  if (m) {
    let year = +m[3];
    if (m[3].length === 2) year += year <= new Date().getFullYear() % 100 ? 2000 : 1900;
    return { date: isoDate(year, +m[2], +m[1]), raw };
  }
  return { date: null, raw };
}

function parseRelation(text: string): ParentRelation | null {
  const t = normalizeHeader(text);
  if (!t) return null;
  if (/^(pere|father|papa|dad)/.test(t)) return 'FATHER';
  if (/^(mere|mother|maman|mum|mom)/.test(t)) return 'MOTHER';
  if (/^(tuteur|tutrice|guardian|tutor)/.test(t)) return 'GUARDIAN';
  return null;
}

function matchAgeGroup(text: string, ageGroups: AgeGroupEntry[]): string | null {
  const t = normalizeHeader(text);
  if (!t) return '';
  const byName = ageGroups.find(
    (g) => normalizeHeader(g.slug) === t || normalizeHeader(g.label.en) === t || normalizeHeader(g.label.fr) === t,
  );
  if (byName) return byName.slug;
  const range = parseAgeRange(text);
  if (range) {
    const byRange = ageGroups.find((g) => g.minAge === range.minAge && g.maxAge === range.maxAge);
    if (byRange) return byRange.slug;
  }
  return null;
}

export type ParsedChildrenFile =
  | { ok: true; rows: ParsedChildRow[]; columns: ImportColumn[]; headerless: boolean }
  | { ok: false; error: string };

export const MAX_IMPORT_ROWS = 2000;

// What a column holds, from its values, for columns whose header says
// nothing: emails, dates or phone numbers (most values must agree)
function fieldFromValues(values: ExcelJS.CellValue[]): 'email' | 'date' | 'phone' | 'name' | null {
  const filled = values.filter((v) => cellText(v));
  if (filled.length === 0) return null;
  const share = (test: (v: ExcelJS.CellValue) => boolean) => filled.filter(test).length / filled.length >= 0.8;
  if (share((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cellText(v)))) return 'email';
  // Excel keeps dates as day numbers: only realistic ones (years 1970 to
  // 2060) count, so a "N°" column of 1, 2, 3... isn't taken for dates
  const isDate = (v: ExcelJS.CellValue) =>
    typeof v === 'number' ? v > 25569 && v < 58440 && cellDate(v).date !== null : cellDate(v).date !== null && !/^\d+$/.test(cellText(v));
  if (share(isDate)) return 'date';
  if (share((v) => /^[+\d][\d\s.\-()/]*$/.test(cellText(v)) && cellText(v).replace(/\D/g, '').length >= 8)) return 'phone';
  // Two words or more, letters only: a person's name
  if (share((v) => /^[\p{L}'’-]+(\s+[\p{L}'’-]+)+$/u.test(cellText(v)))) return 'name';
  return null;
}

const columnLetter = (col: number): string => {
  let s = '';
  for (let n = col; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// Reads a filled-in file. Each column's meaning comes, in order, from the
// staff's corrections (`mapping`), its header, then its values; the screen
// shows how every column was read so staff can correct it.
export async function parseChildrenFile(data: ArrayBuffer, ageGroups: AgeGroupEntry[], mapping: ColumnMapping = {}): Promise<ParsedChildrenFile> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(Buffer.from(data) as unknown as ExcelJS.Buffer);
  } catch {
    return { ok: false, error: 'This file could not be read. Save it as an Excel workbook (.xlsx) and try again.' };
  }

  // The sheet and header row: the row (among the first 10 of a sheet) whose
  // cells read most like headers. A file with no header row at all is read
  // from its first row, columns named A, B, C...
  let best: { sheet: ExcelJS.Worksheet; row: number; score: number; hasName: boolean } | null = null;
  for (const sheet of workbook.worksheets) {
    for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
      let score = 0;
      let hasName = false;
      sheet.getRow(r).eachCell((cell) => {
        const text = cellText(cell.value);
        const slot = text && !/^\d/.test(text) ? fieldFromHeader(text) : null;
        if (slot) score++;
        if (slot === 'fullName' || slot === 'firstName' || slot === 'lastName') hasName = true;
      });
      if (score > (best?.score ?? 0)) best = { sheet, row: r, score, hasName };
    }
  }
  // One recognised header is enough if it's the name; a lone "School"-like
  // cell is more likely a value in a file with no headers
  const headerless = !best || (best.score < 2 && !best.hasName);
  const sheet = best && !headerless ? best.sheet : workbook.worksheets.find((s) => s.actualRowCount > 0);
  if (!sheet) return { ok: false, error: 'This file is empty.' };
  const headerRow = headerless ? 0 : best!.row;
  let firstDataRow = headerRow + 1;
  if (headerless) while (firstDataRow <= sheet.rowCount && sheet.getRow(firstDataRow).actualCellCount === 0) firstDataRow++;

  const columnCount = sheet.columnCount;
  const dataRows: ExcelJS.Row[] = [];
  for (let r = firstDataRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    let filled = false;
    row.eachCell((cell) => {
      if (cellText(cell.value)) filled = true;
    });
    if (filled) dataRows.push(row);
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `The file has more than ${MAX_IMPORT_ROWS} children. Split it into smaller files.` };
  }

  const columns: ImportColumn[] = [];
  for (let col = 1; col <= columnCount; col++) {
    const header = headerRow ? cellText(sheet.getRow(headerRow).getCell(col).value) : '';
    const values = dataRows.map((row) => row.getCell(col).value);
    if (!header && !values.some((v) => cellText(v))) continue;
    columns.push({
      col,
      header: header || `Column ${columnLetter(col)}`,
      field: null,
      source: null,
      samples: [...new Set(values.map(cellText).filter(Boolean))].slice(0, 3).map((s) => s.slice(0, 40)),
    });
  }

  const taken = new Set<ImportField>();
  const assign = (column: ImportColumn, field: ImportField, source: ColumnSource) => {
    column.field = field;
    column.source = source;
    taken.add(field);
  };
  const nextFree = (slots: ImportField[]) => slots.find((s) => !taken.has(s));
  const resolve = (slot: Slot): ImportField | undefined => {
    if (slot === 'phone') return nextFree(PHONE_SLOTS);
    if (slot === 'parentName') return nextFree(NAME_SLOTS);
    // A second "Tél. père" column is the father's second phone
    if (taken.has(slot) && slot === 'fatherPhone') return nextFree(['fatherPhone2']);
    if (taken.has(slot) && slot === 'motherPhone') return nextFree(['motherPhone2']);
    return taken.has(slot) ? undefined : slot;
  };

  // 1. Staff corrections
  for (const column of columns) {
    const picked = mapping[column.col];
    if (picked === '') column.source = 'manual';
    else if (picked && IMPORT_FIELDS.includes(picked)) assign(column, picked, 'manual');
  }
  // 2. Headers
  for (const column of columns) {
    if (column.source || headerless) continue;
    const slot = fieldFromHeader(column.header);
    const field = slot ? resolve(slot) : undefined;
    if (field) assign(column, field, 'header');
  }
  // 3. Values, for columns still unknown
  const hasName = () => taken.has('fullName') || taken.has('firstName') || taken.has('lastName');
  for (const column of columns) {
    if (column.source) continue;
    const kind = fieldFromValues(dataRows.map((row) => row.getCell(column.col).value));
    const field =
      kind === 'email'
        ? resolve('email')
        : kind === 'date'
          ? (resolve('dateOfBirth') ?? resolve('registeredAt'))
          : kind === 'phone'
            ? resolve('phone')
            : kind === 'name' && !hasName()
              ? 'fullName'
              : undefined;
    if (field) assign(column, field, 'values');
  }

  const columnsOf = new Map<ImportField, number[]>();
  for (const c of columns) if (c.field) columnsOf.set(c.field, [...(columnsOf.get(c.field) ?? []), c.col]);

  const rows: ParsedChildRow[] = dataRows.map((row) => {
    // A field read from several columns takes the first one filled in
    const value = (field: ImportField): ExcelJS.CellValue => {
      for (const col of columnsOf.get(field) ?? []) {
        const v = row.getCell(col).value;
        if (cellText(v)) return v;
      }
      return null;
    };
    const text = (field: ImportField) => cellText(value(field)).slice(0, 200);
    const warnings: string[] = [];

    // A full name column, or separate first name (Prénom) and last name (Nom)
    let fullName = text('fullName');
    if (!fullName) fullName = [text('firstName'), text('lastName')].filter(Boolean).join(' ');
    fullName = fullName.replace(/\s+/g, ' ').trim();

    const dob = cellDate(value('dateOfBirth'));
    if (!dob.date && dob.raw) warnings.push(`Date of birth "${dob.raw}" not understood: left empty`);
    const registered = cellDate(value('registeredAt'));
    if (!registered.date && registered.raw) warnings.push(`Registration date "${registered.raw}" not understood: left empty`);

    const groupText = text('ageGroup');
    const group = matchAgeGroup(groupText, ageGroups);
    if (group === null) warnings.push(`Unknown age group "${groupText}": placed from the date of birth instead`);

    const family: FamilyFields = {
      parent1Name: text('parent1Name') || null,
      parent1Relation: parseRelation(text('parent1Relation')),
      parent1Phone: text('parent1Phone') || null,
      parent1Phone2: text('parent1Phone2') || null,
      parent2Name: text('parent2Name') || null,
      parent2Relation: parseRelation(text('parent2Relation')),
      parent2Phone: text('parent2Phone') || null,
      parent2Phone2: text('parent2Phone2') || null,
      email: text('email').toLowerCase() || null,
    };
    // Father and mother columns go to the first free parent block
    for (const [who, relationValue] of [
      ['father', 'FATHER'],
      ['mother', 'MOTHER'],
    ] as const) {
      const name = text(`${who}Name`);
      const phone = text(`${who}Phone`);
      const phone2 = text(`${who}Phone2`);
      if (!name && !phone && !phone2) continue;
      // A block with no name takes this parent; a phone already there (from a
      // generic "Téléphone" column) stays with them if they bring none
      const fits = (n: 1 | 2) =>
        !family[`parent${n}Name`] && !family[`parent${n}Relation`] && (!family[`parent${n}Phone`] || (!phone && !phone2));
      const slot = fits(1) ? 1 : fits(2) ? 2 : null;
      if (!slot) {
        warnings.push(`No room left for the ${who}'s details (both parent blocks are filled)`);
        continue;
      }
      family[`parent${slot}Name`] = name || null;
      family[`parent${slot}Relation`] = relationValue;
      family[`parent${slot}Phone`] = phone || family[`parent${slot}Phone`];
      family[`parent${slot}Phone2`] = phone2 || family[`parent${slot}Phone2`];
    }

    return {
      line: row.number,
      fullName,
      dateOfBirth: dob.date,
      ageGroupSlug: group ?? '',
      institution: text('school') || null,
      registeredAt: registered.date,
      specialNeeds: text('specialNeeds') || null,
      family,
      warnings,
    };
  });

  return { ok: true, rows, columns, headerless };
}
