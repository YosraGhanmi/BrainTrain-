import Link from 'next/link';
import { Clock3, X } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { updateEnrollmentStatus, approveEnrollment, moveEnrollment } from '@/lib/admin/portal-actions';
import { getCourseEntryOrThrow, listAgeGroupEntries, listCourseEntriesForAgeGroup } from '@/lib/content/lookup';
import { listTimeSlots, findSlotLabel } from '@/lib/scheduling/time-slots';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import { firestore } from '@/lib/firebase/admin';
import { getFirebaseChild } from '@/lib/firebase/children';
import { type FirebaseChild } from '@/lib/firebase/children';
import { listAllFirebaseEnrollments } from '@/lib/firebase/enrollments';
import { listAllFirebaseSessionsWithCounts, type SessionWithCount } from '@/lib/firebase/read-models';

export const dynamic = 'force-dynamic';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default async function AdminEnrollmentsPage(
  props: {
    searchParams: Promise<{ saved?: string; error?: string; ageGroup?: string; group?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  await requireAdmin();

  const ageGroups = listAgeGroupEntries();
  const timeSlots = await listTimeSlots();

  const selectedAgeGroup = searchParams.ageGroup ?? '';
  const selectedGroup = searchParams.group ?? '';

  let courseSlugFilter: Set<string> | null = null;
  let slotFilter: { dayOfWeek: number; startTime: string; endTime: string } | null = null;
  if (selectedAgeGroup) {
    const slugs = listCourseEntriesForAgeGroup(selectedAgeGroup).map((c) => c.slug);
    courseSlugFilter = new Set(slugs);
  }
  if (selectedGroup) {
    const slot = timeSlots.find((s) => s.label === selectedGroup);
    // An unmatched label (a filter link for a slot since renamed/deleted)
    // should show nothing rather than silently falling back to "all groups."
    slotFilter = { dayOfWeek: slot?.dayOfWeek ?? -1, startTime: slot?.startTime ?? '', endTime: slot?.endTime ?? '' };
  }

  const [rawEnrollments, sessions] = await Promise.all([listAllFirebaseEnrollments(), listAllFirebaseSessionsWithCounts()]);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  type AdminEnrollmentRow = {
    id: string;
    childId: string;
    courseSessionId: string;
    status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
    enrolledAt: Date;
    courseSession: SessionWithCount;
    child: FirebaseChild;
    parentName: string;
  };

  const rows = await Promise.all(
    rawEnrollments.map(async (enrollment): Promise<AdminEnrollmentRow | null> => {
      const courseSession = sessionById.get(enrollment.courseSessionId);
      if (!courseSession) return null;
      if (courseSlugFilter && !courseSlugFilter.has(courseSession.courseSlug)) return null;
      if (
        slotFilter &&
        (courseSession.dayOfWeek !== slotFilter.dayOfWeek ||
          courseSession.startTime !== slotFilter.startTime ||
          courseSession.endTime !== slotFilter.endTime)
      ) {
        return null;
      }
      const child = await getFirebaseChild(enrollment.childId);
      if (!child) return null;
      const parent = await firestore.collection('users').doc(child.parentId).get();
      return { ...enrollment, courseSession, child, parentName: String(parent.data()?.fullName ?? '') };
    }),
  );

  const enrollments = rows
    .filter((row): row is AdminEnrollmentRow => Boolean(row))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'PENDING' ? -1 : b.status === 'PENDING' ? 1 : a.status.localeCompare(b.status);
      return b.enrolledAt.getTime() - a.enrolledAt.getTime();
    });

  const ageGroupLabelBySlug = new Map(ageGroups.map((g) => [g.slug, g.label.en]));
  const pendingCount = enrollments.filter((e) => e.status === 'PENDING').length;
  const hasFilters = Boolean(selectedAgeGroup || selectedGroup);
  const withoutAgeGroupHref = selectedGroup ? `/admin/enrollments?group=${encodeURIComponent(selectedGroup)}` : '/admin/enrollments';
  const withoutGroupHref = selectedAgeGroup ? `/admin/enrollments?ageGroup=${encodeURIComponent(selectedAgeGroup)}` : '/admin/enrollments';

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Enrollments</h1>

      {pendingCount > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <Clock3 className="h-4 w-4 shrink-0" />
          {pendingCount} enrollment{pendingCount > 1 ? 's' : ''} awaiting approval — confirm payment was received, then hit Approve.
        </div>
      ) : null}

      {searchParams.error === 'full' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">That group is full — pick another one.</p>
      ) : searchParams.error === 'duplicate' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">This child is already enrolled in that group.</p>
      ) : searchParams.error === 'conflict' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          This child already has another class at that same day and time — pick a different group.
        </p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Something went wrong.</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div className="mt-6 flex flex-col items-end gap-3">
        <div className="flex w-full justify-end">
          <p className="text-sm text-stone">
            <span className="font-bold text-ink">{enrollments.length}</span> enrollment{enrollments.length === 1 ? '' : 's'}
          </p>
        </div>

        <form className="flex w-full flex-wrap items-end justify-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Age group</span>
            <select
              key={selectedAgeGroup}
              name="ageGroup"
              defaultValue={selectedAgeGroup}
              className="w-full min-w-[10rem] rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">All age groups</option>
              {ageGroups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.label.en}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Group</span>
            <select
              key={selectedGroup}
              name="group"
              defaultValue={selectedGroup}
              className="w-full min-w-[8rem] rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">All groups</option>
              {timeSlots.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <PendingSubmitButton
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
          >
            Apply
          </PendingSubmitButton>
        </form>

        {hasFilters ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone">Active</span>
            {selectedAgeGroup ? (
              <Link
                href={withoutAgeGroupHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
              >
                {ageGroupLabelBySlug.get(selectedAgeGroup) ?? selectedAgeGroup}
                <X className="h-3 w-3" />
              </Link>
            ) : null}
            {selectedGroup ? (
              <Link
                href={withoutGroupHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
              >
                {selectedGroup}
                <X className="h-3 w-3" />
              </Link>
            ) : null}
            <Link href="/admin/enrollments" className="ml-1 text-xs font-semibold text-stone transition hover:text-ink hover:underline">
              Clear all
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Course</th>
              <th className="px-5 py-3">Age group</th>
              <th className="px-5 py-3">Group</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-stone">
                  No enrollments match these filters.
                </td>
              </tr>
            ) : (
              enrollments.map((e) => {
                const course = getCourseEntryOrThrow(e.courseSession.courseSlug);
                const groupLabel = findSlotLabel(
                  timeSlots,
                  e.courseSession.dayOfWeek,
                  e.courseSession.startTime,
                  e.courseSession.endTime
                );
                const otherSessions = sessions.filter(
                  (s) => s.courseSlug === e.courseSession.courseSlug && s.id !== e.courseSessionId
                );
                return (
                  <tr key={e.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-5 py-4 font-semibold text-ink">{e.child.fullName}</td>
                    <td className="px-5 py-4 text-stone">{e.parentName}</td>
                    <td className="px-5 py-4 text-stone">{course.title.en}</td>
                    <td className="px-5 py-4 text-stone">{ageGroupLabelBySlug.get(course.ageGroupSlug) ?? '—'}</td>
                    <td className="px-5 py-4 text-stone">
                      {groupLabel ?? `${DAYS[e.courseSession.dayOfWeek]} ${e.courseSession.startTime}–${e.courseSession.endTime}`}
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
                                const seatsLeft = s.capacity - s.enrollmentCount;
                                const label = findSlotLabel(timeSlots, s.dayOfWeek, s.startTime, s.endTime);
                                return (
                                  <option key={s.id} value={s.id} disabled={seatsLeft <= 0}>
                                    {label ?? `${DAYS[s.dayOfWeek]} ${s.startTime}–${s.endTime}`} ({s.term}){' '}
                                    {seatsLeft <= 0 ? '— Full' : `— ${seatsLeft} left`}
                                  </option>
                                );
                              })}
                            </select>
                            <PendingSubmitButton className="rounded-lg border border-ink/10 px-2 py-1 text-xs font-semibold text-ink transition hover:bg-slate-100">
                              Move
                            </PendingSubmitButton>
                          </form>
                        ) : null}
                        {e.status === 'PENDING' ? (
                          <form action={approveEnrollment.bind(null, e.id)}>
                            <PendingSubmitButton
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Approve
                            </PendingSubmitButton>
                          </form>
                        ) : e.status === 'CANCELLED' ? (
                          <form action={updateEnrollmentStatus.bind(null, e.id, 'ACTIVE')}>
                            <PendingSubmitButton className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                              Reactivate
                            </PendingSubmitButton>
                          </form>
                        ) : null}
                        {e.status !== 'CANCELLED' ? (
                          <form action={updateEnrollmentStatus.bind(null, e.id, 'CANCELLED')}>
                            <PendingSubmitButton className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                              Cancel
                            </PendingSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
