import { routing, type AppLocale } from '@/i18n/routing';

// No canonical domain was configured anywhere in the codebase (no env var,
// no constant) — braintrain.tn is the real domain (it's already used for the
// contact email and admin login placeholder). Override via
// NEXT_PUBLIC_SITE_URL if the deployed domain ever differs.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://braintrain.tn').replace(/\/+$/, '');

// The official name, as used in structured data and social share previews
export const SITE_NAME = 'Braintrain Academy';

// Structured data wants the international form: "tel:+21658996112" ->
// "+216 58 996 112". Falls back to the number as shown on the site.
export function internationalPhone(phone: { value: string; href: string }): string {
  const digits = phone.href.replace(/^tel:/i, '').replace(/[^\d+]/g, '');
  const tunisian = /^\+216(\d{2})(\d{3})(\d{3})$/.exec(digits);
  if (tunisian) return `+216 ${tunisian[1]} ${tunisian[2]} ${tunisian[3]}`;
  return digits.startsWith('+') ? digits : phone.value;
}

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
