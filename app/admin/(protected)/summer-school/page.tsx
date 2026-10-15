import Link from 'next/link';
import { Pencil, Plus, Sun } from 'lucide-react';
import { requireAdminOnly } from '@/lib/admin/guard';
import { readContent } from '@/lib/content/store';
import { loadSummerSheet, setSummerOpen, updateSummerSettings, upsertSummerGroup, deleteSummerGroup } from '@/lib/admin/summer-actions';
import { deleteCourse } from '@/lib/admin/actions';
import { formatSessionDays } from '@/lib/scheduling/slots';
import { listAllDbSessionsWithCounts, type SessionWithCount } from '@/lib/db/read-models';
import { listDbPricingRules } from '@/lib/db/pricing';
import { listDbTeachers, type DbTeacherProfile } from '@/lib/db/teachers';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import type { CourseEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Week shown Monday first, like the summer programme sheet
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const inputClassName =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30';
const buttonClassName =
  'rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {children}
    </label>
  );
}

const ERRORS: Record<string, string> = {
  settings: 'Check the dates (the end must be after the start) and the discount (0 to 100).',
  group: 'Each group needs a name, at least one day, a start time before its end time, and at least one seat.',
  teacherConflict: 'This teacher already has another group at that same day and time. Pick a different teacher or time.',
};

// One form for adding or editing a group: name, weekdays, time, seats, room, teacher
function GroupForm({
  course,
  group,
  teachers,
  defaultCapacity,
}: {
  course: CourseEntry;
  group?: SessionWithCount;
  teachers: DbTeacherProfile[];
  defaultCapacity: number;
}) {
  const days = group ? [group.dayOfWeek, ...group.extraDays] : [];
  return (
    <form action={upsertSummerGroup} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="courseSlug" value={course.slug} />
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <Field label="Group name">
        <input name="label" required defaultValue={group?.label ?? ''} placeholder="e.g. GRP1" className={inputClassName} />
      </Field>
      <Field label="Starts">
        <input name="startTime" type="time" required defaultValue={group?.startTime ?? '09:00'} className={inputClassName} />
      </Field>
      <Field label="Ends">
        <input name="endTime" type="time" required defaultValue={group?.endTime ?? '11:00'} className={inputClassName} />
      </Field>
      <Field label="Seats">
        <input name="capacity" type="number" min={1} required defaultValue={group?.capacity ?? defaultCapacity} className={inputClassName} />
      </Field>

      <fieldset className="sm:col-span-2 lg:col-span-4">
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone">Days</legend>
        <div className="flex flex-wrap gap-2">
          {WEEK_ORDER.map((day) => (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1.5 text-sm text-ink has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input type="checkbox" name="days" value={day} defaultChecked={days.includes(day)} className="accent-accent" />
              {DAYS[day]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Classroom" className="sm:col-span-2">
        <input name="location" defaultValue={group?.location ?? ''} placeholder="e.g. Room 2" className={inputClassName} />
      </Field>
      <Field label="Teacher" className="sm:col-span-2">
        <select name="teacherId" defaultValue={group?.teacherId ?? ''} className={inputClassName}>
          <option value="">No teacher assigned yet</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex justify-end sm:col-span-2 lg:col-span-4">
        <PendingSubmitButton className={buttonClassName}>{group ? 'Save group' : 'Add group'}</PendingSubmitButton>
      </div>
    </form>
  );
}

export default async function AdminSummerSchoolPage(props: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdminOnly();
  const content = (await readContent());
  const settings = content.summerSchool;
  const summerCourses = content.courses.filter((c) => c.summer);

  const [sessions, rules, teachers] = await Promise.all([
    listAllDbSessionsWithCounts(),
    listDbPricingRules(),
    listDbTeachers(),
  ]);
  const teacherName = new Map(teachers.map((t) => [t.id, t.fullName]));
  const priceOf = (courseSlug: string, planType: 'MONTHLY' | 'SEASON') =>
    rules.find((r) => r.courseSlug === courseSlug && r.planType === planType);

  const byAgeGroup = content.ageGroups
    .map((group) => ({ group, courses: summerCourses.filter((c) => c.ageGroupSlug === group.slug) }))
    .filter((g) => g.courses.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Sun className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Summer school</h1>
            <p className="text-sm text-stone">Summer courses, their groups and prices, and when parents can see them.</p>
          </div>
        </div>

        <form action={setSummerOpen.bind(null, !settings.enabled)} className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              settings.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {settings.enabled ? 'Open: visible to parents' : 'Closed: hidden from parents'}
          </span>
          <PendingSubmitButton className={buttonClassName}>{settings.enabled ? 'Close summer school' : 'Open summer school'}</PendingSubmitButton>
        </form>
      </div>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}
      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</p>
      ) : null}

      <form action={updateSummerSettings} className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg font-bold text-ink">Season</h2>
        <p className="mt-1 text-sm text-stone">
          Shown on every summer course page. Monthly plans bill once for each month of the season; the full-season plan bills
          once.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="First day">
            <input name="startDate" type="date" required defaultValue={settings.startDate} className={inputClassName} />
          </Field>
          <Field label="Last day">
            <input name="endDate" type="date" required defaultValue={settings.endDate} className={inputClassName} />
          </Field>
          <Field label="Sibling discount (%)">
            <input
              name="familyDiscountPercent"
              type="number"
              min={0}
              max={100}
              step="0.5"
              required
              defaultValue={settings.familyDiscountPercent}
              className={inputClassName}
            />
          </Field>
          <Field label="Introduction (English)" className="sm:col-span-3 lg:col-span-1">
            <textarea name="intro_en" rows={5} defaultValue={settings.intro.en} className={`${inputClassName} resize-none`} />
          </Field>
          <Field label="Introduction (French)" className="sm:col-span-3 lg:col-span-1">
            <textarea name="intro_fr" rows={5} defaultValue={settings.intro.fr} className={`${inputClassName} resize-none`} />
          </Field>
          <div className="space-y-4 sm:col-span-3 lg:col-span-1">
            <Field label="Closing note (English)">
              <textarea name="closingNote_en" rows={2} defaultValue={settings.closingNote.en} className={`${inputClassName} resize-none`} />
            </Field>
            <Field label="Closing note (French)">
              <textarea name="closingNote_fr" rows={2} defaultValue={settings.closingNote.fr} className={`${inputClassName} resize-none`} />
            </Field>
          </div>
        </div>
        <p className="mt-2 text-xs text-stone">The sibling discount applies to every child after a family&apos;s first enrolled child (0 turns it off).</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="h-4 w-4 accent-accent" />
            Open: summer courses are visible on the site and in the parent portal
          </label>
          <PendingSubmitButton className={buttonClassName}>Save</PendingSubmitButton>
        </div>
      </form>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">Courses and groups</h2>
        <Link
          href="/admin/courses?new=summer"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-accent hover:text-accent"
        >
          <Plus className="h-4 w-4" />
          New summer course
        </Link>
      </div>

      {summerCourses.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-center">
          <p className="text-sm text-stone">
            No summer courses yet. Load the summer programme sheet (6-9 and 10+ groups, their days, times and prices) and adjust
            it from here, or create courses one by one.
          </p>
          <form action={loadSummerSheet} className="mt-4">
            <PendingSubmitButton className={buttonClassName}>Load the summer programme</PendingSubmitButton>
          </form>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {byAgeGroup.map(({ group, courses }) => (
            <section key={group.slug}>
              <h3 className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
                {group.label.en}
              </h3>
              <div className="space-y-4">
                {courses.map((course) => {
                  const groups = sessions
                    .filter((s) => s.courseSlug === course.slug)
                    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
                  const monthly = priceOf(course.slug, 'MONTHLY');
                  const season = priceOf(course.slug, 'SEASON');
                  return (
                    <div key={course.slug} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{course.title.en}</p>
                          <p className="mt-0.5 text-xs text-stone">
                            {monthly ? `${monthly.amount} ${monthly.currency} / month` : 'No monthly price'} ·{' '}
                            {season ? `${season.amount} ${season.currency} for the season` : 'No season price'} · {course.sessions}{' '}
                            sessions
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/courses?edit=${encodeURIComponent(course.slug)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit course and prices
                          </Link>
                          <DeleteIconButton action={deleteCourse.bind(null, course.slug)} />
                        </div>
                      </div>

                      {groups.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-stone">No groups yet: parents can&apos;t enroll until you add one.</p>
                      ) : (
                        <ul>
                          {groups.map((g) => (
                            <li key={g.id} className="border-t border-ink/5 first:border-t-0">
                              <details className="group/edit">
                                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3 text-sm">
                                  <span className="w-28 font-semibold text-ink">{g.label || '—'}</span>
                                  <span className="min-w-0 flex-1 text-stone">
                                    {formatSessionDays(g, DAYS)} · {g.startTime}–{g.endTime}
                                    {g.location ? ` · ${g.location}` : ''}
                                  </span>
                                  <span className="text-stone">{(g.teacherId && teacherName.get(g.teacherId)) || 'No teacher'}</span>
                                  <span className="w-20 text-stone">
                                    {g.enrollmentCount} / {g.capacity} seats
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="flex items-center rounded-lg border border-ink/10 p-1.5 text-stone transition group-open/edit:bg-slate-100 group-open/edit:text-ink">
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit group</span>
                                    </span>
                                    <DeleteIconButton action={deleteSummerGroup.bind(null, g.id)} />
                                  </span>
                                </summary>
                                <div className="border-t border-ink/10 bg-slate-50/50">
                                  <GroupForm course={course} group={g} teachers={teachers} defaultCapacity={g.capacity} />
                                </div>
                              </details>
                            </li>
                          ))}
                        </ul>
                      )}

                      <details className="border-t border-ink/10">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-accent">
                          <Plus className="h-4 w-4" />
                          Add a group
                        </summary>
                        <div className="border-t border-ink/10 bg-slate-50/50">
                          <GroupForm course={course} teachers={teachers} defaultCapacity={content.classFormat.maxGroupSize} />
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
