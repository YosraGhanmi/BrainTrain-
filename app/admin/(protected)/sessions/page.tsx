import { requireAdminOnly } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { upsertCourseSession, deleteCourseSession } from '@/lib/admin/portal-actions';
import { listTimeSlots, findSlotLabel } from '@/lib/scheduling/time-slots';
import { listFirebaseCourseSessions } from '@/lib/firebase/sessions';
import { listFirebaseTeachers } from '@/lib/firebase/teachers';
import { firestore } from '@/lib/firebase/admin';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function AdminSessionsPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const [sessions, teachers, content, timeSlots] = await Promise.all([
    listFirebaseCourseSessions(),
    listFirebaseTeachers(),
    Promise.resolve(readContent()),
    listTimeSlots(),
  ]);

  // Get enrollment count per session
  const enrollmentCountBySession = new Map<string, number>();
  await Promise.all(
    sessions.map(async (s) => {
      const snap = await firestore.collection('enrollments').where('courseSessionId', '==', s.id).count().get();
      enrollmentCountBySession.set(s.id, snap.data().count);
    }),
  );
  const teacherById = new Map(teachers.map((t) => [t.id, t]));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Course sessions</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Every group runs on the school's weekly timetable, seats 12 children, and follows the same school year
        (15 Sep – 15 Jun) — just pick the course, the slot, and who's teaching it. Manage what each slot's day/time
        actually is on the{' '}
        <a href="/admin/time-slots" className="underline">
          Time slots
        </a>{' '}
        page.
      </p>

      {searchParams.error === 'teacherConflict' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          This teacher already has another group at that same day and time — pick a different slot or teacher.
        </p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in every required field.</p>
      ) : null}
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
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </select>
        <select name="timeSlotId" required defaultValue="" className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent">
          <option value="" disabled>
            Time slot
          </option>
          {timeSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label} · {DAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
            </option>
          ))}
        </select>
        <input name="location" placeholder="Location" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2 lg:col-span-4">
          Add session
        </PendingSubmitButton>
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
              const slotLabel = findSlotLabel(timeSlots, s.dayOfWeek, s.startTime, s.endTime);
              const teacher = s.teacherId ? teacherById.get(s.teacherId) : null;
              const enrollmentCount = enrollmentCountBySession.get(s.id) ?? 0;
              return (
                <tr key={s.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{course?.title.en ?? s.courseSlug}</td>
                  <td className="px-5 py-4 text-stone">{slotLabel ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">
                    {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime} · {s.location}
                  </td>
                  <td className="px-5 py-4 text-stone">{teacher?.fullName ?? '—'}</td>
                  <td className="px-5 py-4 text-stone">
                    {enrollmentCount} / {s.capacity}
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
