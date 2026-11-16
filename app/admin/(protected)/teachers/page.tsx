import Link from 'next/link';
import { X, AlertTriangle } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import {
  createTeacher,
  deleteTeacher,
  setTeacherFrozen,
  addTeacherCourse,
  removeTeacherCourse,
  regenerateTeacherSecretCode, setAccountPassword,
} from '@/lib/admin/portal-actions';
import { readContent } from '@/lib/content/store';
import { cookies } from 'next/headers';
import { TEACHER_CREDENTIALS_COOKIE, parseTeacherCredentialsNotice } from '@/lib/admin/teacher-credentials';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import FreezeToggleButton from '@/components/admin/FreezeToggleButton';
import RegenerateCodeButton from '@/components/admin/RegenerateCodeButton';
import SetPasswordButton from '@/components/admin/SetPasswordButton';
import AddTeacherDialog from '@/components/admin/AddTeacherDialog';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import { parseTeacherCourseSlugs } from '@/lib/teachers/course-slugs';
import { listDbTeachers } from '@/lib/db/teachers';
import { listDbCourseSessionsByTeacher } from '@/lib/db/sessions';
import type { CourseEntry, AgeGroupEntry } from '@/lib/content/types';

function CourseSelect({
  name,
  courses,
  ageGroups,
  className,
}: {
  name: string;
  courses: CourseEntry[];
  ageGroups: AgeGroupEntry[];
  className?: string;
}) {
  const coursesByAgeGroup = ageGroups.map((ageGroup) => ({
    ageGroup,
    courses: courses.filter((c) => c.ageGroupSlug === ageGroup.slug),
  }));
  const orphanCourses = courses.filter((c) => !ageGroups.some((g) => g.slug === c.ageGroupSlug));

  return (
    <select name={name} required defaultValue="" className={className}>
      <option value="" disabled>
        Course they&apos;ll teach
      </option>
      {coursesByAgeGroup.map(
        ({ ageGroup, courses: groupCourses }) =>
          groupCourses.length > 0 && (
            <optgroup key={ageGroup.slug} label={ageGroup.label.en}>
              {groupCourses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title.en}
                </option>
              ))}
            </optgroup>
          )
      )}
      {orphanCourses.length > 0 && (
        <optgroup label="Other">
          {orphanCourses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title.en}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export const dynamic = 'force-dynamic';

export default async function AdminTeachersPage(
  props: {
    searchParams: Promise<{ error?: string; courseError?: string; saved?: string; passwordError?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await requireAdmin();
  const canEdit = session.kind === 'admin';
  const credentials = parseTeacherCredentialsNotice((await cookies()).get(TEACHER_CREDENTIALS_COOKIE)?.value);
  const content = (await readContent());
  const { courses, ageGroups } = content;
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const ageGroupLabelBySlug = new Map(ageGroups.map((g) => [g.slug, g.label.en]));

  const teacherProfiles = await listDbTeachers();
  const teachersWithSessionCount = await Promise.all(
    teacherProfiles.map(async (t) => {
      const sessions = await listDbCourseSessionsByTeacher(t.id);
      return { ...t, sessionCount: sessions.length };
    }),
  );

  const selectClassName = 'rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Teachers</h1>
        <AddTeacherDialog defaultOpen={Boolean(searchParams.error)} closeKey={credentials?.code}>
          <form action={createTeacher} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input name="fullName" placeholder="Full name" required className={selectClassName} />
            <input name="email" type="email" placeholder="Email" required className={selectClassName} />
            <input name="phone" type="tel" placeholder="Phone" required className={selectClassName} />
            <CourseSelect name="courseSlug" courses={courses} ageGroups={ageGroups} className={selectClassName} />
            <p className="text-xs text-stone sm:col-span-2">
              A password and a 6-digit secret code are generated for this teacher. You&apos;ll see both once, right after creating the account, and the teacher picks their own password at the first sign-in. They can be assigned more courses below once the account exists.
            </p>
            {searchParams.error === 'exists' ? (
              <p className="text-sm font-semibold text-red-600 sm:col-span-2">A user with that email or phone already exists.</p>
            ) : searchParams.error ? (
              <p className="text-sm font-semibold text-red-600 sm:col-span-2">Please fill in every field.</p>
            ) : null}
            <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2">
              Create teacher account
            </PendingSubmitButton>
          </form>
        </AddTeacherDialog>
      </div>

      {searchParams.passwordError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Password not saved: use at least 8 characters.</p>
      ) : null}
      {credentials ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">
            {credentials.password ? 'Account created' : 'New secret code'} for {credentials.email}. Write this down and give it to
            them now: it is shown for two minutes and can&apos;t be looked up afterwards.
          </p>
          <div className="mt-3 flex flex-wrap gap-6">
            {credentials.password ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Temporary password</p>
                <p data-testid="teacher-password" className="font-mono text-lg font-bold text-emerald-900">{credentials.password}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Secret code</p>
              <p data-testid="teacher-secret-code" className="font-mono text-lg font-bold text-emerald-900">{credentials.code}</p>
            </div>
          </div>
        </div>
      ) : searchParams.courseError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Pick a course to add.</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Secret code</th>
              <th className="px-5 py-3">Courses</th>
              <th className="px-5 py-3">Sessions</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {teachersWithSessionCount.map((t) => {
              const teacherCourseSlugs = parseTeacherCourseSlugs(t.courseSlugs);

              return (
              <tr key={t.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink align-top">
                  <div className="flex items-center gap-2">
                    {t.fullName}
                    {t.isFrozen ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Frozen
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-stone align-top">{t.email}</td>
                <td className="px-5 py-4 text-stone align-top">{t.phone}</td>
                <td className="px-5 py-4 align-top">
                  {t.teacherSecretCodeHash ? (
                    <span className="text-xs text-stone">Set. Regenerate if forgotten.</span>
                  ) : (
                    <span className="text-xs text-stone">Not set. Regenerate.</span>
                  )}
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex flex-col gap-1.5">
                    {teacherCourseSlugs.length === 0 ? (
                      <span className="text-stone">—</span>
                    ) : (
                      teacherCourseSlugs.map((slug) => {
                        const course = courseBySlug.get(slug);
                        const ageGroupLabel = course ? ageGroupLabelBySlug.get(course.ageGroupSlug) : undefined;
                        return (
                          <span
                            key={slug}
                            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-semibold text-ink"
                          >
                            {course?.title.en ?? slug}
                            {ageGroupLabel ? <span className="text-stone">· {ageGroupLabel}</span> : null}
                            {canEdit ? (
                              <form action={removeTeacherCourse.bind(null, t.id, slug)}>
                                <PendingSubmitButton aria-label="Remove course" spinnerClassName="h-3 w-3" className="rounded-full p-0.5 text-stone transition hover:bg-white hover:text-red-600">
                                  <X className="h-3 w-3" />
                                </PendingSubmitButton>
                              </form>
                            ) : null}
                          </span>
                        );
                      })
                    )}
                    {canEdit ? (
                      <form action={addTeacherCourse.bind(null, t.id)} className="mt-1 flex items-center gap-1.5">
                        <CourseSelect
                          name="courseSlug"
                          courses={courses.filter((c) => !teacherCourseSlugs.includes(c.slug))}
                          ageGroups={ageGroups}
                          className="rounded-lg border border-ink/10 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-accent"
                        />
                        <PendingSubmitButton className="rounded-lg border border-ink/10 px-2 py-1 text-xs font-semibold text-ink transition hover:bg-slate-100">
                          Add
                        </PendingSubmitButton>
                      </form>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-stone align-top">
                  {t.sessionCount}
                  {teacherCourseSlugs.length > 0 && t.sessionCount === 0 ? (
                    <Link
                      href="/admin/sessions"
                      title="Listing a course here doesn't put them on any group — assign them as the teacher on a specific group in Course sessions."
                      className="mt-1 flex w-fit items-center gap-1 text-[11px] font-semibold text-amber-600 hover:underline"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      No group assigned
                    </Link>
                  ) : null}
                </td>
                <td className="px-5 py-4 align-top">
                  {canEdit ? (
                    <div className="flex items-center justify-end gap-2">
                      <SetPasswordButton action={setAccountPassword.bind(null, t.id)} accountName={t.fullName} returnTo="/admin/teachers" />
                      <RegenerateCodeButton action={regenerateTeacherSecretCode.bind(null, t.id)} />
                      <FreezeToggleButton action={setTeacherFrozen.bind(null, t.id, !t.isFrozen)} isFrozen={t.isFrozen} />
                      <DeleteIconButton action={deleteTeacher.bind(null, t.id)} />
                    </div>
                  ) : null}
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
