import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow, getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import { addTeacherNote, awardBadge } from '@/lib/teacher/actions';
import { BADGE_STICKERS } from '@/lib/badges/stickers';
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
  const session = await prisma.courseSession.findUnique({ where: { id: params.sessionId } });
  if (!session || session.teacherId !== teacher.teacherId) notFound();
  const course = getCourseEntryOrThrow(session.courseSlug);

  const enrollment = await prisma.enrollment.findUnique({
    where: { childId_courseSessionId: { childId: params.childId, courseSessionId: session.id } },
    include: {
      child: {
        include: {
          badges: { orderBy: { awardedAt: 'desc' } },
        },
      },
    },
  });
  if (!enrollment || !['PENDING', 'ACTIVE'].includes(enrollment.status)) notFound();
  const child = enrollment.child;
  const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);

  const notes = await prisma.teacherNote.findMany({
    where: { childId: child.id, courseSessionId: session.id },
    orderBy: { createdAt: 'desc' },
  });

  const returnTo = `/teacher/sessions/${session.id}/students/${child.id}`;

  return (
    <div>
      <Link
        href={`/teacher/sessions/${session.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {course.title.en} roster
      </Link>

      <div className="mt-4 flex items-center gap-4">
        {child.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={child.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: child.photoColor ?? course.color }}
          >
            {initials(child.fullName)}
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{child.fullName}</h1>
          <p className="text-sm text-stone">
            {ageGroup.label.en} · {course.title.en}
          </p>
        </div>
      </div>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Remark added.</p> : null}
      {searchParams.error ? <p className="mt-4 text-sm font-semibold text-red-600">Please enter a remark.</p> : null}
      {searchParams.badgeSaved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Badge awarded.</p> : null}
      {searchParams.badgeError ? <p className="mt-4 text-sm font-semibold text-red-600">Please enter a badge title.</p> : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold text-ink">Badges</h2>
          {child.badges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {child.badges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.note ?? undefined}
                  className="flex items-center gap-1.5 rounded-full bg-amber-50 py-1 pl-1 pr-3 text-xs font-semibold text-amber-800"
                >
                  {badge.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={badge.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <span>{badge.emoji}</span>
                  )}
                  {badge.title}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone">No badges yet.</p>
          )}

          <form action={awardBadge} className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="childId" value={child.id} />
            <input type="hidden" name="courseSessionId" value={session.id} />
            <input type="hidden" name="returnTo" value={returnTo} />

            <div className="flex flex-wrap gap-2">
              {BADGE_STICKERS.map((sticker, i) => (
                <label key={sticker.url} className="cursor-pointer">
                  <input type="radio" name="imageUrl" value={sticker.url} defaultChecked={i === 0} required className="peer sr-only" />
                  <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-transparent p-1 peer-checked:border-accent">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sticker.url} alt={sticker.label} className="h-12 w-12 rounded-full object-cover" />
                    <span className="text-[0.6rem] font-semibold text-stone">{sticker.label}</span>
                  </span>
                </label>
              ))}
            </div>

            <input
              name="title"
              required
              placeholder="Badge title (e.g. Top Builder)"
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              name="note"
              placeholder="Note (optional)"
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600"
            >
              Award badge
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold text-ink">Remarks</h2>
          {notes.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm text-ink">
                  <p>{note.content}</p>
                  <p className="mt-1 text-xs text-stone">{note.createdAt.toDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone">No remarks yet.</p>
          )}

          <form action={addTeacherNote} className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="childId" value={child.id} />
            <input type="hidden" name="courseSessionId" value={session.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <textarea
              name="content"
              required
              rows={3}
              placeholder="Add a remark for this student..."
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              Add remark
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
