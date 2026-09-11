import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { readContent } from '@/lib/content/store';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

function parseMonth(value: string | undefined): { year: number; month: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  if (!match) return { year: now.getFullYear(), month: now.getMonth() };
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export default async function ParentSchedulePage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { month?: string };
}) {
  const parent = await requireParent(params.locale);
  const tp = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.schedule' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const WEEKDAYS = tc.raw('daysShort') as string[];
  const MONTH_NAMES = tc.raw('months') as string[];
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        {tp('noChildren')}
      </p>
    );
  }

  const child = await prisma.child.findUnique({
    where: { id: selected.id },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { courseSession: true },
      },
    },
  });
  if (!child) return null;

  const byDayOfWeek = new Map<number, typeof child.enrollments>();
  for (const e of child.enrollments) {
    const list = byDayOfWeek.get(e.courseSession.dayOfWeek) ?? [];
    list.push(e);
    byDayOfWeek.set(e.courseSession.dayOfWeek, list);
  }
  for (const list of byDayOfWeek.values()) {
    list.sort((a, b) => a.courseSession.startTime.localeCompare(b.courseSession.startTime));
  }

  const enrolledCourseSlugs = new Set(child.enrollments.map((e) => e.courseSession.courseSlug));
  const { calendarEvents } = readContent();
  const visibleEvents = calendarEvents.filter(
    (event) =>
      (event.targetAgeGroups.length === 0 || event.targetAgeGroups.includes(child.ageGroupSlug)) &&
      (event.targetCourses.length === 0 || event.targetCourses.some((slug) => enrolledCourseSlugs.has(slug)))
  );

  const { year, month } = parseMonth(searchParams.month);
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const eventsByDayOfMonth = new Map<number, typeof visibleEvents>();
  for (const event of visibleEvents) {
    const eventDate = new Date(`${event.date}T00:00:00`);
    if (eventDate.getFullYear() !== year || eventDate.getMonth() !== month) continue;
    const list = eventsByDayOfMonth.get(eventDate.getDate()) ?? [];
    list.push(event);
    eventsByDayOfMonth.set(eventDate.getDate(), list);
  }

  const hasAny = child.enrollments.length > 0;

  // Distinct courses on this child's schedule, for the color/icon legend.
  const legend = [...new Set(child.enrollments.map((e) => e.courseSession.courseSlug))].map((slug) =>
    getCourseEntryOrThrow(slug)
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
          {MONTH_NAMES[month]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/parent-portal/schedule?month=${monthParam(prevMonth.year, prevMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-sm transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
            aria-label={t('previousMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/parent-portal/schedule?month=${monthParam(nextMonth.year, nextMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-sm transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
            aria-label={t('nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center text-stone">
          {t('noActiveSessions')}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {legend.map((course) => {
            const Icon = getIcon(course.icon);
            return (
              <div key={course.slug} className="flex items-center gap-1.5 text-xs font-semibold text-stone">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${course.color}1f` }}
                >
                  <Icon className="h-3 w-3" style={{ color: course.color }} strokeWidth={2.25} />
                </span>
                {localized(course.title, params.locale)}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-slate-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-stone">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayOfWeek = i % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const sessionEvents = day ? byDayOfWeek.get(dayOfWeek) ?? [] : [];
            const pinnedEvents = day ? eventsByDayOfMonth.get(day) ?? [] : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={i}
                className={`min-h-[5rem] min-w-0 border-b border-r border-ink/5 p-1.5 transition-colors sm:min-h-[7rem] sm:p-2 [&:nth-child(7n)]:border-r-0 ${
                  !day ? 'bg-slate-50/40' : isToday ? 'bg-accent/[0.04]' : isWeekend ? 'bg-slate-50/60' : 'bg-white'
                }`}
              >
                {day ? (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition ${
                        isToday ? 'bg-accent text-white shadow-[0_4px_10px_-2px_rgba(61,127,255,0.6)]' : 'text-ink/70'
                      }`}
                    >
                      {day}
                    </span>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {pinnedEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold leading-none"
                          style={{ backgroundColor: `${event.color}1f`, color: event.color }}
                          title={event.label}
                        >
                          <Pin className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                          <span className="max-w-[3.5rem] truncate sm:max-w-[4.5rem]">{event.label}</span>
                        </div>
                      ))}
                      {sessionEvents.map((e) => {
                        const course = getCourseEntryOrThrow(e.courseSession.courseSlug);
                        const Icon = getIcon(course.icon);
                        return (
                          <Link
                            key={e.id}
                            href={`/parent-portal/courses/${course.slug}`}
                            className="group flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold leading-none transition hover:shadow-md sm:max-w-[9rem]"
                            style={{ backgroundColor: `${course.color}1a`, color: course.color }}
                            title={`${localized(course.title, params.locale)} · ${e.courseSession.startTime}–${e.courseSession.endTime} · ${e.courseSession.location}`}
                          >
                            <Icon className="h-3 w-3 shrink-0 transition group-hover:scale-110" strokeWidth={2.5} />
                            <span className="min-w-0 truncate">{localized(course.title, params.locale)}</span>
                            <span className="shrink-0 opacity-70">{e.courseSession.startTime}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
