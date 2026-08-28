import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { updateEnrollmentStatus } from '@/lib/admin/portal-actions';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default async function AdminEnrollmentsPage() {
  requireAdmin();
  const enrollments = await prisma.enrollment.findMany({
    include: { child: { include: { parent: { include: { user: true } } } }, courseSession: true },
    orderBy: { enrolledAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Enrollments</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Term</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const course = getCourseEntryOrThrow(e.courseSession.courseSlug);
              return (
                <tr key={e.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{e.child.fullName}</td>
                  <td className="px-5 py-4 text-stone">{e.child.parent.user.fullName}</td>
                  <td className="px-5 py-4 text-stone">{course.title.en}</td>
                  <td className="px-5 py-4 text-stone">{e.courseSession.term}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
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
