import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { upsertCourseSession, deleteCourseSession } from '@/lib/admin/portal-actions';
import { SCHOOL_TIME_SLOTS, findSlotLabel } from '@/lib/scheduling/slots';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function AdminSessionsPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  await requireAdmin();
  const [sessions, teachers, content] = await Promise.all([
    prisma.courseSession.findMany({
      include: { teacher: { include: { user: true } }, _count: { select: { enrollments: true } } },
      orderBy: { term: 'desc' },
    }),
    prisma.user.findMany({ where: { role: 'TEACHER' }, include: { teacher: true } }),
    Promise.resolve(readContent()),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Course sessions</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Every group runs on the school's fixed weekly timetable, seats 12 children, and follows the same school year
        (15 Sep – 15 Jun) — just pick the course, the slot, and who's teaching it.
      </p>

      {searchParams.error ? <p className="mt-4 text-sm font-semibold text-red-600">Please fill in every required field.</p> : null}
      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <form action={upsertCourseSession} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <select name="courseSlug" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="">Course</option>
          {content.courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title.en} ({c.ageGroupSlug})
            </option>
          ))}
        </select>
        <select name="teacherId" className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="">No teacher assigned yet</option>
          {teachers.map((t) => (
            <option key={t.teacher!.id} value={t.teacher!.id}>
              {t.fullName}
            </option>
          ))}
        </select>
        <select name="slotIndex" required defaultValue="" className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="" disabled>
            Time slot
          </option>
          {SCHOOL_TIME_SLOTS.map((slot, i) => (
            <option key={slot.label} value={i}>
              {slot.label} · {DAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
            </option>
          ))}
        </select>
        <input name="location" placeholder="Location" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2 lg:col-span-4">
          Add session
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Group</th>
              <th className="px-5 py-3">Schedule</th>
              <th className="px-5 py-3">Teacher</th>
              <th className="px-5 py-3">Seats</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const course = content.courses.find((c) => c.slug === s.courseSlug);
              const slotLabel = findSlotLabel(s.dayOfWeek, s.startTime, s.endTime);
              return (
                <tr key={s.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{course?.title.en ?? s.courseSlug}</td>
                  <td className="px-5 py-4 text-stone">{slotLabel ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">
                    {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime} · {s.location}
                  </td>
                  <td className="px-5 py-4 text-stone">{s.teacher?.user.fullName ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">
                    {s._count.enrollments} / {s.capacity}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DeleteIconButton action={deleteCourseSession.bind(null, s.id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
