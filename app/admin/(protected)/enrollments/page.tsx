import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { updateEnrollmentStatus, moveEnrollment } from '@/lib/admin/portal-actions';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';

export const dynamic = 'force-dynamic';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default async function AdminEnrollmentsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  await requireAdmin();
  const [enrollments, sessions] = await Promise.all([
    prisma.enrollment.findMany({
      include: { child: { include: { parent: { include: { user: true } } } }, courseSession: true },
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.courseSession.findMany({
      include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Enrollments</h1>

      {searchParams.error === 'full' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">That group is full — pick another one.</p>
      ) : searchParams.error === 'duplicate' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">This child is already enrolled in that group.</p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Something went wrong.</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Group</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const course = getCourseEntryOrThrow(e.courseSession.courseSlug);
              const otherSessions = sessions.filter(
                (s) => s.courseSlug === e.courseSession.courseSlug && s.id !== e.courseSessionId
              );
              return (
                <tr key={e.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{e.child.fullName}</td>
                  <td className="px-5 py-4 text-stone">{e.child.parent.user.fullName}</td>
                  <td className="px-5 py-4 text-stone">{course.title.en}</td>
                  <td className="px-5 py-4 text-stone">
                    {DAYS[e.courseSession.dayOfWeek]} {e.courseSession.startTime}–{e.courseSession.endTime} · {e.courseSession.term}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {otherSessions.length > 0 ? (
                        <form action={moveEnrollment.bind(null, e.id)} className="flex items-center gap-1.5">
                          <select
                            name="courseSessionId"
                            required
                            defaultValue=""
                            className="rounded-lg border border-ink/10 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-accent"
                          >
                            <option value="" disabled>
                              Move to group…
                            </option>
                            {otherSessions.map((s) => {
                              const seatsLeft = s.capacity - s._count.enrollments;
                              return (
                                <option key={s.id} value={s.id} disabled={seatsLeft <= 0}>
                                  {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime} ({s.term}) {seatsLeft <= 0 ? '— Full' : `— ${seatsLeft} left`}
                                </option>
                              );
                            })}
                          </select>
                          <button type="submit" className="rounded-lg border border-ink/10 px-2 py-1 text-xs font-semibold text-ink transition hover:bg-slate-100">
                            Move
                          </button>
                        </form>
                      ) : null}
                      {e.status !== 'ACTIVE' ? (
                        <form action={updateEnrollmentStatus.bind(null, e.id, 'ACTIVE')}>
                          <button type="submit" className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                            Activate
                          </button>
                        </form>
                      ) : null}
                      {e.status !== 'CANCELLED' ? (
                        <form action={updateEnrollmentStatus.bind(null, e.id, 'CANCELLED')}>
                          <button type="submit" className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                            Cancel
                          </button>
                        </form>
                      ) : null}
                    </div>
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
