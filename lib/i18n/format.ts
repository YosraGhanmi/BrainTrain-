import type { AppLocale } from '@/i18n/routing';
import type { LocalizedString } from '@/lib/content/types';

// Every date shown in the parent/teacher portals should route through this
// instead of ad hoc toDateString()/toLocaleDateString() calls, which always
// render in English regardless of the active locale.
const DATE_LOCALE: Record<AppLocale, string> = { en: 'en-US', fr: 'fr-FR' };

export function formatDate(
  date: Date | string,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(DATE_LOCALE[locale], options);
}

// Short form for compact table/list rows — "Oct 2, 2026" / "2 oct. 2026".
export function formatShortDate(date: Date | string, locale: AppLocale): string {
  return formatDate(date, locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function localized(value: LocalizedString, locale: AppLocale): string {
  return value[locale] || value.en;
}
