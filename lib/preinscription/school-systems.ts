// Choices for "the child's school system" on the preinscription form. The
// code is what's stored; labels are for the form and the admin table.
export const SCHOOL_SYSTEMS = [
  { code: 'public', fr: 'Public', en: 'Public' },
  { code: 'private', fr: 'Privé', en: 'Private' },
  { code: 'french_mission', fr: 'Mission française', en: 'French mission' },
  { code: 'international', fr: 'Système international / anglais', en: 'International / English system' },
  { code: 'other', fr: 'Autre', en: 'Other' },
] as const;

export type SchoolSystem = (typeof SCHOOL_SYSTEMS)[number]['code'];

export function isSchoolSystem(value: string): value is SchoolSystem {
  return SCHOOL_SYSTEMS.some((s) => s.code === value);
}

export function schoolSystemLabel(code: string | null | undefined, locale: 'fr' | 'en'): string | null {
  const entry = SCHOOL_SYSTEMS.find((s) => s.code === code);
  return entry ? entry[locale] : null;
}
