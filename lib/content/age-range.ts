// Pure helpers (no fs), so client components can detect the age group live
// while a date of birth is typed.

export type AgeRange = { slug: string; minAge: number | null; maxAge: number | null };

// "6-9 years", "6–9 ans", "6-9" → { minAge: 6, maxAge: 9 }
export function parseAgeRange(text: string): { minAge: number; maxAge: number } | null {
  const match = /(\d{1,2})\s*[-–]\s*(\d{1,2})/.exec(text);
  if (!match) return null;
  const minAge = Number(match[1]);
  const maxAge = Number(match[2]);
  return minAge <= maxAge ? { minAge, maxAge } : null;
}

// Groups follow the school year, so a child moves up once a year (on
// September 1st) rather than on their birthday in the middle of the year.
export function schoolYearStart(today: Date = new Date()): Date {
  const year = today.getUTCMonth() >= 8 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 8, 1));
}

export function ageOn(dateOfBirth: Date, on: Date): number {
  const age = on.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const hadBirthday =
    on.getUTCMonth() > dateOfBirth.getUTCMonth() ||
    (on.getUTCMonth() === dateOfBirth.getUTCMonth() && on.getUTCDate() >= dateOfBirth.getUTCDate());
  return hadBirthday ? age : age - 1;
}

// Age at the start of the current school year
export function schoolYearAge(dateOfBirth: Date, today: Date = new Date()): number {
  return ageOn(dateOfBirth, schoolYearStart(today));
}

// null when the date is invalid or no group covers that age
export function detectAgeGroupSlug(groups: AgeRange[], dateOfBirth: Date, today: Date = new Date()): string | null {
  if (Number.isNaN(dateOfBirth.getTime())) return null;
  const age = schoolYearAge(dateOfBirth, today);
  const group = groups.find((g) => g.minAge !== null && g.maxAge !== null && age >= g.minAge && age <= g.maxAge);
  return group?.slug ?? null;
}

// How a group picked by hand fits the child's age, for a warning shown next
// to it (staff may still keep it: it's never refused). null when there is no
// date of birth or the group has no age range.
export function ageGroupFit(
  group: AgeRange | undefined,
  dateOfBirth: Date | null,
  today: Date = new Date(),
): { age: number; fits: boolean } | null {
  if (!group || !dateOfBirth || Number.isNaN(dateOfBirth.getTime())) return null;
  if (group.minAge === null || group.maxAge === null) return null;
  const age = schoolYearAge(dateOfBirth, today);
  return { age, fits: age >= group.minAge && age <= group.maxAge };
}

// The group to store for a child staff edited. `picked` is the group chosen
// in the form, "" for automatic. A pick that matches what the date of birth
// gives is not "by hand", so that child keeps moving up each year.
export function chooseAgeGroup(
  groups: AgeRange[],
  dateOfBirth: Date | null,
  picked: string,
  today: Date = new Date(),
): { ageGroupSlug: string; ageGroupManual: boolean } {
  const detected = dateOfBirth ? detectAgeGroupSlug(groups, dateOfBirth, today) : null;
  const valid = picked && groups.some((g) => g.slug === picked) ? picked : '';
  if (!valid) return { ageGroupSlug: detected ?? '', ageGroupManual: false };
  return { ageGroupSlug: valid, ageGroupManual: valid !== detected };
}
