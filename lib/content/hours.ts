import type { DayHours } from './types';
import type { AppLocale } from '@/i18n/routing';

// Index 0 is Monday, matching ContactContent.hours
const DAY_NAMES: Record<AppLocale, string[]> = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
};

const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type HoursGroup = { days: number[]; opens: string; closes: string };

function isOpen(day: DayHours): boolean {
  return Boolean(day.opens && day.closes);
}

// Days that share the same hours, open groups first (in the order their first
// day comes in the week), closed days last
function groupHours(hours: DayHours[]): HoursGroup[] {
  const groups: HoursGroup[] = [];
  hours.forEach((day, i) => {
    const opens = isOpen(day) ? day.opens : '';
    const closes = isOpen(day) ? day.closes : '';
    const group = groups.find((g) => g.opens === opens && g.closes === closes);
    if (group) group.days.push(i);
    else groups.push({ days: [i], opens, closes });
  });
  return [...groups.filter((g) => g.opens), ...groups.filter((g) => !g.opens)];
}

// "09:00" -> "9h00" (fr) or "9:00 am" (en)
function formatTime(time: string, locale: AppLocale): string {
  const [h, m] = time.split(':').map(Number);
  if (locale === 'fr') return `${h}h${String(m).padStart(2, '0')}`;
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Two days read "X et Y", more read "X, Y, Z"
function joinDays(names: string[], locale: AppLocale): string {
  const joined = names.length === 2 ? names.join(locale === 'fr' ? ' et ' : ' and ') : names.join(', ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

// e.g. [{ days: 'Mercredi, vendredi, samedi', time: '9h00 – 18h00' }, ...]
export function formatOpeningHours(hours: DayHours[], locale: AppLocale, closedLabel: string): { days: string; time: string }[] {
  return groupHours(hours).map((group) => ({
    days: joinDays(group.days.map((i) => DAY_NAMES[locale][i]), locale),
    time: group.opens ? `${formatTime(group.opens, locale)} – ${formatTime(group.closes, locale)}` : closedLabel,
  }));
}

// schema.org openingHoursSpecification, one entry per set of hours
export function openingHoursSpecification(hours: DayHours[]) {
  return groupHours(hours)
    .filter((group) => group.opens)
    .map((group) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: group.days.map((i) => SCHEMA_DAYS[i]),
      opens: group.opens,
      closes: group.closes,
    }));
}
