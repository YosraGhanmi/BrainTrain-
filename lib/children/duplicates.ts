// Spotting a child that may already be in the system, when staff add one by
// hand or import a list. Pure, so the import preview and the form share it.

export type DuplicateReason = 'sameName' | 'similarName' | 'closeBirthDate';

export const DUPLICATE_REASON_LABELS: Record<DuplicateReason, string> = {
  sameName: 'Same name',
  similarName: 'Similar name',
  closeBirthDate: 'Shares a name, born within a few days',
};

type Candidate = { fullName: string; dateOfBirth: Date | null };
export type DuplicateMatch<T> = { child: T; reason: DuplicateReason };

const CLOSE_BIRTH_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

// "Élise  BEN-ALI" -> ["ali", "ben", "elise"]: no accents, no case, no
// punctuation, and word order doesn't matter ("Ben Ali Elise" is the same)
export function nameTokens(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

function compare(a: Candidate, b: Candidate): DuplicateReason | null {
  const ta = nameTokens(a.fullName);
  const tb = nameTokens(b.fullName);
  if (ta.length === 0 || tb.length === 0) return null;
  const ja = ta.join(' ');
  const jb = tb.join(' ');
  if (ja === jb) return 'sameName';

  // A typo or two ("Mohamed" / "Mohammed"), on names long enough for that
  // not to match everyone
  if (Math.min(ja.length, jb.length) >= 6 && editDistance(ja, jb) <= 2) return 'similarName';
  // A name with a word missing ("Ahmed Ben Ali" / "Ahmed Ali")
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shorter.length >= 2 && shorter.every((t) => longer.includes(t))) return 'similarName';

  // Born a few days apart and sharing a first or last name: the date may
  // have been mistyped once (or they are twins, which staff will know)
  if (a.dateOfBirth && b.dateOfBirth) {
    const days = Math.abs(a.dateOfBirth.getTime() - b.dateOfBirth.getTime()) / DAY;
    const sharesName = ta.some((t) => t.length >= 3 && tb.includes(t));
    if (days <= CLOSE_BIRTH_DAYS && sharesName) return 'closeBirthDate';
  }
  return null;
}

const ORDER: Record<DuplicateReason, number> = { sameName: 0, similarName: 1, closeBirthDate: 2 };

export function findPossibleDuplicates<T extends Candidate>(candidate: Candidate, existing: T[], limit = 5): DuplicateMatch<T>[] {
  return existing
    .map((child) => ({ child, reason: compare(candidate, child) }))
    .filter((m): m is DuplicateMatch<T> => m.reason !== null)
    .sort((a, b) => ORDER[a.reason] - ORDER[b.reason])
    .slice(0, limit);
}
