import { X } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { createTeacher, deleteTeacher, setTeacherFrozen, addTeacherCourse, removeTeacherCourse } from '@/lib/admin/portal-actions';
import { readContent } from '@/lib/content/store';
import { DEFAULT_TEACHER_PASSWORD } from '@/lib/admin/teacher-defaults';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import FreezeToggleButton from '@/components/admin/FreezeToggleButton';
import AddTeacherDialog from '@/components/admin/AddTeacherDialog';
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

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: { error?: string; courseError?: string; saved?: string; code?: string; email?: string };
}) {
  await requireAdmin();
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    include: { teacher: { include: { sessions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const content = readContent();
  const { courses, ageGroups } = content;
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const ageGroupLabelBySlug = new Map(ageGroups.map((g) => [g.slug, g.label.en]));

  const selectClassName = 'rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent';

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Teachers</h1>
        <AddTeacherDialog defaultOpen={Boolean(searchParams.error)}>
          <form action={createTeacher} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input name="fullName" placeholder="Full name" required className={selectClassName} />
            <input name="email" type="email" placeholder="Email" required className={selectClassName} />
            <input name="phone" type="tel" placeholder="Phone" required className={selectClassName} />
            <CourseSelect name="courseSlug" courses={courses} ageGroups={ageGroups} className={selectClassName} />
            <p className="text-xs text-stone sm:col-span-2">
              A default password (<span className="font-mono">{DEFAULT_TEACHER_PASSWORD}</span>) and a random 4-digit secret code are generated automatically — you&apos;ll see the code once, right after creating the account. They can be assigned more courses below once the account exists.
            </p>
            {searchParams.error === 'exists' ? (
              <p className="text-sm font-semibold text-red-600 sm:col-span-2">A user with that email or phone already exists.</p>
            ) : searchParams.error ? (
              <p className="text-sm font-semibold text-red-600 sm:col-span-2">Please fill in every field.</p>
            ) : null}
            <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2">
              Create teacher account
            </button>
          </form>
        </AddTeacherDialog>
      </div>

      {searchParams.code ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">
            Account created for {searchParams.email}. Give them these credentials — the secret code won&apos;t be shown again:
          </p>
          <div className="mt-3 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Password</p>
              <p className="font-mono text-lg font-bold text-emerald-900">{DEFAULT_TEACHER_PASSWORD}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Secret code</p>
              <p className="font-mono text-lg font-bold text-emerald-900">{searchParams.code}</p>
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
              <th className="px-5 py-3">Courses</th>
              <th className="px-5 py-3">Sessions</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
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
                  <div className="flex flex-col gap-1.5">
                    {(t.teacher?.courseSlugs ?? []).length === 0 ? (
                      <span className="text-stone">—</span>
                    ) : (
                      t.teacher!.courseSlugs.map((slug) => {
                        const course = courseBySlug.get(slug);
                        const ageGroupLabel = course ? ageGroupLabelBySlug.get(course.ageGroupSlug) : undefined;
                        return (
                          <span
                            key={slug}
                            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-semibold text-ink"
                          >
                            {course?.title.en ?? slug}
                            {ageGroupLabel ? <span className="text-stone">· {ageGroupLabel}</span> : null}
                            <form action={removeTeacherCourse.bind(null, t.teacher!.id, slug)}>
                              <button type="submit" aria-label="Remove course" className="rounded-full p-0.5 text-stone transition hover:bg-white hover:text-red-600">
                                <X className="h-3 w-3" />
                              </button>
                            </form>
                          </span>
                        );
                      })
                    )}
                    <form action={addTeacherCourse.bind(null, t.teacher!.id)} className="mt-1 flex items-center gap-1.5">
                      <CourseSelect
                        name="courseSlug"
                        courses={courses.filter((c) => !(t.teacher?.courseSlugs ?? []).includes(c.slug))}
                        ageGroups={ageGroups}
                        className="rounded-lg border border-ink/10 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-accent"
                      />
                      <button type="submit" className="rounded-lg border border-ink/10 px-2 py-1 text-xs font-semibold text-ink transition hover:bg-slate-100">
                        Add
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-5 py-4 text-stone align-top">{t.teacher?.sessions.length ?? 0}</td>
                <td className="px-5 py-4 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <FreezeToggleButton action={setTeacherFrozen.bind(null, t.id, !t.isFrozen)} isFrozen={t.isFrozen} />
                    <DeleteIconButton action={deleteTeacher.bind(null, t.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
