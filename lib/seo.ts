import { routing, type AppLocale } from '@/i18n/routing';

// No canonical domain was configured anywhere in the codebase (no env var,
// no constant) — braintrain.tn is the real domain (it's already used for the
// contact email and admin login placeholder). Override via
// NEXT_PUBLIC_SITE_URL if the deployed domain ever differs.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://braintrain.tn').replace(/\/+$/, '');

// `localePrefix: 'as-needed'` (i18n/routing.ts) means the default locale
// ('en') is served with no prefix at all, so URLs must match that.
export function localePath(locale: AppLocale, path = ''): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${prefix}${suffix}` || '/';
}

export function absoluteUrl(locale: AppLocale, path = ''): string {
  return `${SITE_URL}${localePath(locale, path)}`;
}

export function localeAlternates(path = ''): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, absoluteUrl(locale, path)]));
}
