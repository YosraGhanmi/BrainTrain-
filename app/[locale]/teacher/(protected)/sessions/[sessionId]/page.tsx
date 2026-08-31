import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireTeacher } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { addTeacherNote, awardBadge } from '@/lib/teacher/actions';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const BADGE_EMOJIS = ['🏅', '⭐', '🏆', '🚀', '🧠', '🔥', '🎯', '💡'];

export default async function TeacherSessionRosterPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; sessionId: string };
  searchParams: { error?: string; saved?: string; badgeError?: string; badgeSaved?: string };
}) {
  const teacher = await requireTeacher(params.locale);
  const session = await prisma.courseSession.findUnique({
    where: { id: params.sessionId },
    include: {
      enrollments: {
        where: { status: { in: ['PENDING', 'ACTIVE'] } },
        include: {
          child: { include: { badges: { orderBy: { awardedAt: 'desc' } } } },
          notes: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { enrolledAt: 'asc' },
      },
    },
  });

  if (!session || session.teacherId !== teacher.teacherId) notFound();
  const course = getCourseEntryOrThrow(session.courseSlug);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">{course.title.en}</h1>
      <p className="mt-1 text-sm text-stone">{session.term} · {session.location}</p>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Remark added.</p> : null}
      {searchParams.error ? <p className="mt-4 text-sm font-semibold text-red-600">Please enter a remark.</p> : null}
      {searchParams.badgeSaved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Badge awarded.</p> : null}
      {searchParams.badgeError ? <p className="mt-4 text-sm font-semibold text-red-600">Please enter a badge title.</p> : null}

      <div className="mt-8 space-y-5">
        {session.enrollments.map((enrollment) => (
          <div key={enrollment.id} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-ink">{enrollment.child.fullName}</h2>

            {enrollment.child.badges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {enrollment.child.badges.map((badge) => (
                  <span
                    key={badge.id}
                    title={badge.note ?? undefined}
                    className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                  >
                    <span>{badge.emoji}</span>
                    {badge.title}
                  </span>
                ))}
              </div>
            ) : null}

            {enrollment.notes.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {enrollment.notes.map((note) => (
                  <li key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm text-ink">
                    <p>{note.content}</p>
                    <p className="mt-1 text-xs text-stone">{note.createdAt.toDateString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-stone">No remarks yet.</p>
            )}

            <form action={addTeacherNote} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="locale" value={params.locale} />
              <input type="hidden" name="childId" value={enrollment.child.id} />
              <input type="hidden" name="courseSessionId" value={session.id} />
              <textarea
                name="content"
                required
                rows={2}
                placeholder="Add a remark for this student..."
                className="min-w-[240px] flex-1 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                Add remark
              </button>
            </form>

            <form action={awardBadge} className="mt-3 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4">
              <input type="hidden" name="locale" value={params.locale} />
              <input type="hidden" name="childId" value={enrollment.child.id} />
              <input type="hidden" name="courseSessionId" value={session.id} />
              <select
                name="emoji"
                defaultValue={BADGE_EMOJIS[0]}
                className="rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                {BADGE_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </select>
              <input
                name="title"
                required
                placeholder="Badge title (e.g. Top Builder)"
                className="min-w-[180px] flex-1 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                name="note"
                placeholder="Note (optional)"
                className="min-w-[180px] flex-1 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button type="submit" className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600">
                Award badge
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
