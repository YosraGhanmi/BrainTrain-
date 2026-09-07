import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseMonth(value: string | undefined): { year: number; month: number } {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  if (!match) return { year: now.getFullYear(), month: now.getMonth() };
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export default async function TeacherCalendarPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { month?: string };
}) {
  const teacher = await requireTeacher(params.locale);
  const sessions = await prisma.courseSession.findMany({
    where: { teacherId: teacher.teacherId },
    include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
  });

  const byDayOfWeek = new Map<number, typeof sessions>();
  for (const s of sessions) {
    const list = byDayOfWeek.get(s.dayOfWeek) ?? [];
    list.push(s);
    byDayOfWeek.set(s.dayOfWeek, list);
  }
  for (const list of byDayOfWeek.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

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

  const hasAny = sessions.length > 0;

  // Distinct courses on this teacher's timetable, for the color/icon legend.
  const legend = [...new Set(sessions.map((s) => s.courseSlug))].map((slug) => getCourseEntryOrThrow(slug));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          {MONTH_NAMES[month]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/calendar?month=${monthParam(prevMonth.year, prevMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-sm transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/teacher/calendar?month=${monthParam(nextMonth.year, nextMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-sm transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center text-stone">
          No groups assigned yet — your working hours will fill in once the admin assigns you a session.
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
                {course.title.en}
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
            const daySessions = day ? byDayOfWeek.get(dayOfWeek) ?? [] : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={i}
                className={`min-h-[7rem] border-b border-r border-ink/5 p-2 transition-colors [&:nth-child(7n)]:border-r-0 ${
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
                      {daySessions.map((s) => {
                        const course = getCourseEntryOrThrow(s.courseSlug);
                        const Icon = getIcon(course.icon);
                        return (
                          <Link
                            key={s.id}
                            href={`/teacher/sessions/${s.id}`}
                            className="group flex max-w-[9rem] items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold leading-none transition hover:shadow-md"
                            style={{ backgroundColor: `${course.color}1a`, color: course.color }}
                            title={`${course.title.en} · ${s.startTime}–${s.endTime} · ${s.location} · ${s._count.enrollments} students`}
                          >
                            <Icon className="h-3 w-3 shrink-0 transition group-hover:scale-110" strokeWidth={2.5} />
                            <span className="min-w-0 truncate">{course.title.en}</span>
                            <span className="shrink-0 opacity-70">{s.startTime}</span>
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

      {hasAny ? (
        <div className="mt-6 space-y-2">
          {[...sessions]
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
            .map((s) => {
              const course = getCourseEntryOrThrow(s.courseSlug);
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: course.color }}
                    aria-hidden
                  />
                  <span className="font-semibold text-ink">{WEEKDAYS[s.dayOfWeek]}</span>
                  <span className="text-stone">
                    {s.startTime}–{s.endTime}
                  </span>
                  <span className="font-semibold text-ink">{course.title.en}</span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-stone">
                    <MapPin className="h-3.5 w-3.5" />
                    {s.location}
                  </span>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
