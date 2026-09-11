import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow, getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import { addTeacherNote, awardBadge } from '@/lib/teacher/actions';
import { rotateHue } from '@/lib/color';
import { localized, formatDate } from '@/lib/i18n/format';
import StudentNotesPanel from '@/components/portal/teacher/StudentNotesPanel';
import StudentBadgesPanel from '@/components/portal/teacher/StudentBadgesPanel';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function TeacherStudentProfilePage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; sessionId: string; childId: string };
  searchParams: { error?: string; saved?: string; badgeError?: string; badgeSaved?: string };
}) {
  const teacher = await requireTeacher(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'teacherPortal.studentProfile' });
  const session = await prisma.courseSession.findUnique({ where: { id: params.sessionId } });
  if (!session || session.teacherId !== teacher.teacherId) notFound();
  const course = getCourseEntryOrThrow(session.courseSlug);

  const enrollment = await prisma.enrollment.findUnique({
    where: { childId_courseSessionId: { childId: params.childId, courseSessionId: session.id } },
    include: { child: true },
  });
  if (!enrollment || !['PENDING', 'ACTIVE'].includes(enrollment.status)) notFound();
  const child = enrollment.child;
  const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);

  const notes = await prisma.teacherNote.findMany({
    where: { childId: child.id, courseSessionId: session.id },
    orderBy: { createdAt: 'desc' },
  });

  // Only badges this teacher personally awarded this child — not every
  // teacher's badges across every course the child is enrolled in.
  const badges = await prisma.badge.findMany({
    where: { childId: child.id, teacherId: teacher.teacherId },
    orderBy: { awardedAt: 'desc' },
  });

  const returnTo = `/teacher/sessions/${session.id}/students/${child.id}`;
  const baseColor = child.photoColor ?? course.color;
  const bannerBackground = `linear-gradient(to right, ${rotateHue(baseColor, -25)}, ${baseColor}, ${rotateHue(baseColor, 35)})`;

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="relative pb-12 pt-5" style={{ background: bannerBackground }}>
        <div className="px-6">
          <Link
            href={`/teacher/sessions/${session.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToRoster', { course: localized(course.title, params.locale) })}
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between px-6">
          <p className="text-sm font-semibold text-white/90">
            {localized(course.title, params.locale)} <span className="text-white/60">·</span> {session.term}
          </p>
          <p className="text-sm font-semibold text-white/90">{localized(ageGroup.label, params.locale)}</p>
        </div>
      </div>

      <div className="relative z-10 -mt-8 flex flex-col items-center">
        {child.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={child.photoUrl}
            alt=""
            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-soft"
          />
        ) : (
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-bold text-white shadow-soft"
            style={{ backgroundColor: baseColor }}
          >
            {initials(child.fullName)}
          </span>
        )}
        <h1 className="mt-2 font-display text-xl font-bold text-ink">{child.fullName}</h1>
      </div>

      {searchParams.saved ? <p className="mt-3 text-center text-sm font-semibold text-emerald-600">{t('remarkAdded')}</p> : null}
      {searchParams.error ? <p className="mt-3 text-center text-sm font-semibold text-red-600">{t('enterRemark')}</p> : null}
      {searchParams.badgeSaved ? <p className="mt-3 text-center text-sm font-semibold text-emerald-600">{t('badgeAwarded')}</p> : null}
      {searchParams.badgeError ? <p className="mt-3 text-center text-sm font-semibold text-red-600">{t('enterBadgeTitle')}</p> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-ink/10">
        <div className="px-6 pb-6 lg:pr-6">
          <StudentNotesPanel
            notes={notes.map((note) => ({ id: note.id, content: note.content, createdAt: formatDate(note.createdAt, params.locale) }))}
            addNote={addTeacherNote}
            locale={params.locale}
            childId={child.id}
            courseSessionId={session.id}
            returnTo={returnTo}
          />
        </div>

        <div className="px-6 pb-6 lg:pl-6">
          <StudentBadgesPanel
            badges={badges}
            awardBadge={awardBadge}
            locale={params.locale}
            childId={child.id}
            courseSessionId={session.id}
            returnTo={returnTo}
          />
        </div>
      </div>
    </div>
  );
}
