import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CalendarDays, Clock, MapPin, Users, ChevronRight, Sparkles, BookOpen, PenTool, Bot } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import { findSlotLabel, listTimeSlots } from '@/lib/scheduling/time-slots';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage({ params }: { params: { locale: AppLocale } }) {
  const teacher = await requireTeacher(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.dashboard' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const DAYS = tc.raw('days') as string[];
  const [sessions, timeSlots] = await Promise.all([
    prisma.courseSession.findMany({
      where: { teacherId: teacher.teacherId },
      include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    listTimeSlots(),
  ]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#eef1ff] via-[#f3edfb] to-[#fdf0f5] p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
          <div className="absolute -bottom-20 right-16 h-52 w-52 animate-float rounded-full bg-white/40 blur-2xl" />
          <Sparkles className="absolute right-[26%] top-6 h-5 w-5 text-accent2/60" />
          <BookOpen className="absolute right-[16%] top-1/2 h-7 w-7 -translate-y-1/2 animate-float text-accent/40" style={{ animationDelay: '0.8s' }} />
          <PenTool className="absolute right-[6%] top-8 h-6 w-6 animate-float text-accent2/50" style={{ animationDelay: '1.4s' }} />
          <Bot className="absolute right-[6%] bottom-6 h-10 w-10 text-accent/50" />
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t('brand')}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-sm text-ink/60">{t('subtitle')}</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          {t('noSessions')}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {sessions.map((session) => {
            const course = getCourseEntryOrThrow(session.courseSlug);
            const Icon = getIcon(course.icon);
            const groupLabel = findSlotLabel(timeSlots, session.dayOfWeek, session.startTime, session.endTime);
            return (
              <Link
                key={session.id}
                href={`/teacher/sessions/${session.id}`}
                className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${course.color}1a` }}
                >
                  <Icon className="h-6 w-6" style={{ color: course.color }} strokeWidth={2} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold text-ink">{localized(course.title, params.locale)}</h2>
                    {groupLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-stone">
                        {groupLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {session.term}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-ink/5 pt-2.5 text-xs font-medium text-stone">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      {DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-accent" />
                      {t('studentsCount', { enrolled: session._count.enrollments, capacity: session.capacity })}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-stone/40" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
