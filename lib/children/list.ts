import { nameTokens } from '@/lib/children/duplicates';
import type { AdminChildRow } from '@/lib/db/children';

// What staff still need to fill in on a child's record ("To complete")
export type MissingDetail = 'birthDate' | 'ageGroup' | 'parent' | 'phone';

export const MISSING_DETAIL_LABELS: Record<MissingDetail, string> = {
  birthDate: 'date of birth',
  ageGroup: 'age group',
  parent: 'parent',
  phone: 'phone',
};

export function missingDetails(child: Pick<AdminChildRow, 'dateOfBirth' | 'ageGroupSlug' | 'parentNames' | 'phones'>): MissingDetail[] {
  const missing: MissingDetail[] = [];
  if (!child.dateOfBirth) missing.push('birthDate');
  if (!child.ageGroupSlug) missing.push('ageGroup');
  if (child.parentNames.length === 0) missing.push('parent');
  if (child.phones.length === 0) missing.push('phone');
  return missing;
}

export function missingDetailsText(missing: MissingDetail[]): string {
  return `Missing: ${missing.map((m) => MISSING_DETAIL_LABELS[m]).join(', ')}`;
}

// The Children page filters, as they appear in its URL (shared with the
// Excel export, which exports what the page shows)
export type ChildrenFilters = {
  q: string;
  // An age group slug, or "none" for children with no group yet
  group: string;
  school: string;
  noCourse: boolean;
  overdue: boolean;
  incomplete: boolean;
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseChildrenFilters(params: Params): ChildrenFilters {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
  };
  return {
    q: get('q'),
    group: get('group'),
    school: get('school'),
    noCourse: get('noCourse') === '1',
    overdue: get('overdue') === '1',
    incomplete: get('incomplete') === '1',
  };
}

export function filtersToQuery(filters: ChildrenFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.group) params.set('group', filters.group);
  if (filters.school) params.set('school', filters.school);
  if (filters.noCourse) params.set('noCourse', '1');
  if (filters.overdue) params.set('overdue', '1');
  if (filters.incomplete) params.set('incomplete', '1');
  return params.toString();
}

export function hasActiveFilters(filters: ChildrenFilters): boolean {
  return filtersToQuery(filters) !== '';
}

// Schools are typed freely, so "Lycée Pilote " and "lycee pilote" are one
export function schoolKey(school: string | null): string {
  return nameTokens(school ?? '').join(' ');
}

// Each school once, as first typed, sorted by name
export function listSchools(children: Pick<AdminChildRow, 'institution'>[]): { key: string; label: string }[] {
  const byKey = new Map<string, string>();
  for (const c of children) {
    const key = schoolKey(c.institution);
    if (key && !byKey.has(key)) byKey.set(key, c.institution!.trim());
  }
  return [...byKey].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

// Name search ignores accents, case and word order; a search with digits
// also matches any of the family's phone numbers.
function matchesSearch(child: AdminChildRow, q: string): boolean {
  const digits = q.replace(/\D/g, '');
  if (digits.length >= 3 && child.phones.some((p) => p.replace(/\D/g, '').includes(digits))) return true;
  const words = nameTokens(q);
  if (words.length === 0) return false;
  const haystack = [child.fullName, ...child.parentNames].flatMap(nameTokens);
  return words.every((w) => haystack.some((t) => t.startsWith(w)));
}

export function filterChildren(children: AdminChildRow[], filters: ChildrenFilters): AdminChildRow[] {
  const school = filters.school;
  return children.filter((c) => {
    if (filters.q && !matchesSearch(c, filters.q)) return false;
    if (filters.group === 'none' ? c.ageGroupSlug !== '' : filters.group && c.ageGroupSlug !== filters.group) return false;
    if (school && schoolKey(c.institution) !== school) return false;
    if (filters.noCourse && c.enrollmentCount > 0) return false;
    if (filters.overdue && !c.hasOverduePayment) return false;
    if (filters.incomplete && missingDetails(c).length === 0) return false;
    return true;
  });
}
