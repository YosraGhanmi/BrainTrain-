import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
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

export default async function ParentSchedulePage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { month?: string };
}) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        No children yet. Add a child to start enrolling in courses.
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

  const hasAny = child.enrollments.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          {MONTH_NAMES[month]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/parent-portal/schedule?month=${monthParam(prevMonth.year, prevMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/parent-portal/schedule?month=${monthParam(nextMonth.year, nextMonth.month)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!hasAny ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-center text-stone">
          No active sessions scheduled yet — the calendar below will fill in once an enrollment is activated.
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-slate-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-stone">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayOfWeek = i % 7;
            const events = day ? byDayOfWeek.get(dayOfWeek) ?? [] : [];
            const isToday = isCurrentMonth && day === today.getDate();
            return (
              <div
                key={i}
                className={`min-h-[6.5rem] border-b border-r border-ink/5 p-2 [&:nth-child(7n)]:border-r-0 ${
                  day ? 'bg-white' : 'bg-slate-50/40'
                }`}
              >
                {day ? (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? 'bg-accent text-white' : 'text-ink'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {events.map((e) => {
                        const course = getCourseEntryOrThrow(e.courseSession.courseSlug);
                        return (
                          <div
                            key={e.id}
                            className="truncate rounded-md bg-accent/10 px-1.5 py-1 text-[0.65rem] font-semibold text-accent"
                            title={`${course.title.en} · ${e.courseSession.startTime}–${e.courseSession.endTime} · ${e.courseSession.location}`}
                          >
                            {e.courseSession.startTime} {course.title.en}
                          </div>
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
