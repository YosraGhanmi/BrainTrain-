import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ChevronRight, CalendarDays, MapPin, Users, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import { estimateCompletedSessions, percentFromCompleted } from '@/lib/progress';
import StudentRoster, { type RosterStudent } from '@/components/portal/teacher/StudentRoster';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

function ageFromDateOfBirth(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export default async function TeacherSessionRosterPage({
  params,
}: {
  params: { locale: AppLocale; sessionId: string };
}) {
  const teacher = await requireTeacher(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.roster' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const DAYS = tc.raw('days') as string[];
  const session = await prisma.courseSession.findUnique({
    where: { id: params.sessionId },
    include: {
      enrollments: {
        where: { status: { in: ['PENDING', 'ACTIVE'] } },
        include: {
          child: { include: { badges: true } },
        },
        orderBy: { enrolledAt: 'asc' },
      },
    },
  });

  if (!session || session.teacherId !== teacher.teacherId) notFound();
  const course = getCourseEntryOrThrow(session.courseSlug);
  const Icon = getIcon(course.icon);

  const students: RosterStudent[] = session.enrollments.map((enrollment) => {
    const child = enrollment.child;
    const completed = estimateCompletedSessions(enrollment.enrolledAt, course.sessions);
    return {
      childId: child.id,
      fullName: child.fullName,
      photoUrl: child.photoUrl,
      photoColor: child.photoColor,
      age: ageFromDateOfBirth(child.dateOfBirth),
      status: enrollment.status as 'PENDING' | 'ACTIVE',
      progressPercent: percentFromCompleted(completed, course.sessions),
      badges: child.badges.map((b) => ({ id: b.id, emoji: b.emoji, imageUrl: b.imageUrl, title: b.title })),
    };
  });

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-stone">
        <Link href="/teacher" className="text-accent hover:underline">
          {t('myGroups')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">{localized(course.title, params.locale)}</span>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#eef1ff] via-[#f3edfb] to-[#fdf0f5] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-14 h-48 w-48 rounded-full bg-white/50 blur-2xl" />
          <div className="absolute -bottom-16 right-10 h-44 w-44 animate-float rounded-full bg-white/40 blur-2xl" />
          <Sparkles className="absolute right-10 top-6 h-5 w-5 text-accent2/60" />
        </div>

        <div className="relative flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${course.color}1a` }}
          >
            <Icon className="h-7 w-7" style={{ color: course.color }} strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{localized(course.title, params.locale)}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-ink/60">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {DAYS[session.dayOfWeek]} ·{' '}
                {session.startTime}–{session.endTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {session.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t('studentsEnrolled', { count: students.length })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          {t('noStudentsYet')}
        </p>
      ) : (
        <div className="mt-6">
          <StudentRoster sessionId={session.id} students={students} courseColor={course.color} />
        </div>
      )}
    </div>
  );
}
