import { Link } from '@/i18n/navigation';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function TeacherDashboardPage({ params }: { params: { locale: AppLocale } }) {
  const teacher = await requireTeacher(params.locale);
  const sessions = await prisma.courseSession.findMany({
    where: { teacherId: teacher.teacherId },
    include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
    orderBy: { term: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">My assigned sessions</h1>

      {sessions.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No sessions assigned yet — check back once the admin schedules one for you.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sessions.map((session) => {
            const course = getCourseEntryOrThrow(session.courseSlug);
            return (
              <Link
                key={session.id}
                href={`/teacher/sessions/${session.id}`}
                className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft transition hover:border-accent/40"
              >
                <h2 className="font-display text-lg font-bold text-ink">{course.title.en}</h2>
                <p className="mt-1 text-sm text-stone">{session.term}</p>
                <div className="mt-4 space-y-1.5 text-sm text-stone">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    {session.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" />
                    {session._count.enrollments} / {session.capacity} students
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
