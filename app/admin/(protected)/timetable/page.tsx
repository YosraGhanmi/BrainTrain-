import Link from 'next/link';
import { Clock, MapPin, Pin, UserRound, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { getIcon } from '@/lib/content/icons';
import { listTimeSlots, sessionGroupLabel } from '@/lib/scheduling/time-slots';
import { sessionDays } from '@/lib/scheduling/slots';
import { listDbCourseSessions } from '@/lib/db/sessions';
import { listDbTeachers } from '@/lib/db/teachers';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// School week starts on Monday; Sunday goes last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Read-only weekly timetable of every group, for Reception (and Admin) to
// answer "when does this group meet / who teaches it / is there a seat".
// Editing groups stays on the admin-only Course sessions page. School-year
// and summer groups never run at the same time, so they're shown apart.
export default async function AdminTimetablePage(props: { searchParams: Promise<{ season?: string }> }) {
  const summerView = (await props.searchParams).season === 'summer';
  await requireAdmin();
  const [allSessions, teachers, timeSlots, seatCounts, content] = await Promise.all([
    listDbCourseSessions(),
    listDbTeachers(),
    listTimeSlots(),
    // Same statuses the capacity check counts as a taken seat
    prisma.enrollment.groupBy({ by: ['courseSessionId'], where: { status: { in: ['PENDING', 'ACTIVE'] } }, _count: { _all: true } }),
    (await readContent()),
  ]);
  const { courses, ageGroups, calendarEvents } = content;
  const sessions = allSessions.filter((s) => s.summer === summerView);

  const seatsBySession = new Map(seatCounts.map((row) => [row.courseSessionId ?? '', row._count._all]));
  const teacherById = new Map(teachers.map((t) => [t.id, t]));
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const ageGroupBySlug = new Map(ageGroups.map((g) => [g.slug, g]));

  const sessionsByDay = new Map<number, typeof sessions>();
  for (const s of sessions) {
    for (const day of sessionDays(s)) {
      const list = sessionsByDay.get(day) ?? [];
      list.push(s);
      sessionsByDay.set(day, list);
    }
  }
  for (const list of sessionsByDay.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const days = DAY_ORDER.filter((day) => sessionsByDay.has(day));

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = calendarEvents
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Group timetable</h1>
      <p className="mt-1 text-sm text-stone">Every group&apos;s weekly day and time, with its teacher, room and seats taken.</p>

      <div className="mt-4 inline-flex rounded-full border border-ink/10 bg-white p-1 text-xs font-semibold">
        {[
          { href: '/admin/timetable', label: 'School year', active: !summerView },
          { href: '/admin/timetable?season=summer', label: 'Summer school', active: summerView },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-1.5 transition ${tab.active ? 'bg-ink text-white' : 'text-stone hover:text-ink'}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {days.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
          No groups scheduled yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => (
            <section key={day} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
              <h2 className="px-1 font-display text-lg font-bold text-ink">{DAYS[day]}</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {(sessionsByDay.get(day) ?? []).map((s) => {
                  const course = courseBySlug.get(s.courseSlug);
                  const ageGroup = course ? ageGroupBySlug.get(course.ageGroupSlug) : undefined;
                  const teacher = s.teacherId ? teacherById.get(s.teacherId) : null;
                  const groupLabel = sessionGroupLabel(timeSlots, s);
                  const seats = seatsBySession.get(s.id) ?? 0;
                  const isFull = seats >= s.capacity;
                  const color = course?.color ?? '#64748b';
                  const Icon = getIcon(course?.icon ?? '');
                  return (
                    <li
                      key={s.id}
                      className="rounded-xl border border-ink/10 bg-slate-50 p-3"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${color}1f` }}
                          >
                            <Icon className="h-4 w-4" style={{ color }} strokeWidth={2.25} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-ink">{course?.title.en ?? s.courseSlug}</p>
                            <p className="truncate text-xs text-stone">
                              {[groupLabel, ageGroup?.label.en].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                            isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isFull ? 'Full' : `${s.capacity - seats} free`}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone">
                        <p className="flex items-center gap-1.5 font-semibold text-ink">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-stone" />
                          {s.startTime}–{s.endTime}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {seats} / {s.capacity} seats
                        </p>
                        <p className="flex min-w-0 items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{teacher?.fullName ?? 'No teacher yet'}</span>
                        </p>
                        <p className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.location || '—'}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {upcomingEvents.length > 0 ? (
        <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Pin className="h-4 w-4 text-accent" />
            Upcoming dates
          </h2>
          <ul className="mt-3 divide-y divide-ink/5">
            {upcomingEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
                <span className="w-28 shrink-0 font-semibold text-ink">
                  {new Date(`${event.date}T00:00:00`).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-stone">{event.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
