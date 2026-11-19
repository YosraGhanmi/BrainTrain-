// What a column of an imported Excel file can hold. Pure (no exceljs), so the
// import screen can list the choices when staff correct a column.

export type ImportField =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'ageGroup'
  | 'school'
  | 'registeredAt'
  | 'specialNeeds'
  | 'parent1Relation'
  | 'parent1Name'
  | 'parent1Phone'
  | 'parent1Phone2'
  | 'parent2Relation'
  | 'parent2Name'
  | 'parent2Phone'
  | 'parent2Phone2'
  | 'fatherName'
  | 'fatherPhone'
  | 'fatherPhone2'
  | 'motherName'
  | 'motherPhone'
  | 'motherPhone2'
  | 'email';

export const IMPORT_FIELD_GROUPS: { label: string; fields: { field: ImportField; label: string }[] }[] = [
  {
    label: 'Child',
    fields: [
      { field: 'fullName', label: 'Full name' },
      { field: 'firstName', label: 'First name' },
      { field: 'lastName', label: 'Last name' },
      { field: 'dateOfBirth', label: 'Date of birth' },
      { field: 'ageGroup', label: 'Age group' },
      { field: 'school', label: 'School' },
      { field: 'registeredAt', label: 'Registration date' },
      { field: 'specialNeeds', label: 'Special accommodations' },
    ],
  },
  {
    label: 'Father / mother',
    fields: [
      { field: 'fatherName', label: "Father's name" },
      { field: 'fatherPhone', label: "Father's phone" },
      { field: 'fatherPhone2', label: "Father's second phone" },
      { field: 'motherName', label: "Mother's name" },
      { field: 'motherPhone', label: "Mother's phone" },
      { field: 'motherPhone2', label: "Mother's second phone" },
    ],
  },
  {
    label: 'Parent 1 / Parent 2',
    fields: [
      { field: 'parent1Name', label: 'Parent 1 name' },
      { field: 'parent1Relation', label: 'Parent 1 relation' },
      { field: 'parent1Phone', label: 'Parent 1 phone' },
      { field: 'parent1Phone2', label: 'Parent 1 second phone' },
      { field: 'parent2Name', label: 'Parent 2 name' },
      { field: 'parent2Relation', label: 'Parent 2 relation' },
      { field: 'parent2Phone', label: 'Parent 2 phone' },
      { field: 'parent2Phone2', label: 'Parent 2 second phone' },
      { field: 'email', label: 'Email' },
    ],
  },
];

export const IMPORT_FIELD_LABELS = Object.fromEntries(
  IMPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.field, f.label])),
) as Record<ImportField, string>;

export const IMPORT_FIELDS = Object.keys(IMPORT_FIELD_LABELS) as ImportField[];

// How a column's meaning was found: from its header, from what it holds, or
// picked by staff on the import screen
export type ColumnSource = 'header' | 'values' | 'manual';

export type ImportColumn = {
  // 1-based column number in the sheet
  col: number;
  header: string;
  field: ImportField | null;
  source: ColumnSource | null;
  // A few values from the column, to help staff check it
  samples: string[];
};

// Staff corrections: column number -> field, or "" to ignore the column
export type ColumnMapping = Record<number, ImportField | ''>;
