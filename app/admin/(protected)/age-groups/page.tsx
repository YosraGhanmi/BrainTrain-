import { readContent } from '@/lib/content/store';
import { updateAgeGroup } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

export default function AdminAgeGroupsPage() {
  const { ageGroups, courses } = readContent();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Age groups</h1>
      <p className="mt-2 text-stone">
        Edit each age group's blurb and pick which courses show up under it. To create a new course first, use the{' '}
        <a href="/admin/courses" className="underline">
          courses
        </a>{' '}
        page.
      </p>

      <div className="mt-8 space-y-6">
        {ageGroups.map((group) => (
          <form key={group.slug} action={updateAgeGroup} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-6">
            <input type="hidden" name="slug" value={group.slug} />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="label"
                defaultValue={group.label}
                placeholder="Label (e.g. 6-9 years)"
                className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
              />
              <p className="flex items-center px-2 text-xs uppercase tracking-wide text-stone/70">Slug: {group.slug}</p>
            </div>

            <textarea
              name="description"
              defaultValue={group.description}
              rows={2}
              className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
            />

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone">Courses in this age group</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {courses.map((course) => (
                  <label key={course.slug} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="courseTitles"
                      value={course.title}
                      defaultChecked={group.courseTitles.includes(course.title)}
                      className="h-4 w-4"
                    />
                    {course.title}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
