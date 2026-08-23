import { readContent } from '@/lib/content/store';
import { upsertCourse, deleteCourse } from '@/lib/admin/actions';
import { ICON_NAMES } from '@/lib/content/icons';
import type { CourseEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

function CourseForm({ course, isNew }: { course: CourseEntry; isNew: boolean }) {
  return (
    <form action={upsertCourse} className="space-y-3 rounded-2xl border border-ink/10 bg-white p-6">
      <input type="hidden" name="existingSlug" value={isNew ? '' : course.slug} />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="title"
          defaultValue={course.title}
          placeholder="Course title"
          required
          className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
        <input
          name="sessions"
          type="number"
          min={0}
          defaultValue={course.sessions}
          placeholder="Sessions"
          className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </div>

      <textarea
        name="description"
        defaultValue={course.description}
        placeholder="Description"
        rows={3}
        className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />

      <input
        name="videoUrl"
        defaultValue={course.videoUrl ?? ''}
        placeholder="Video link (YouTube or Facebook — optional)"
        className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          name="icon"
          defaultValue={course.icon}
          className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        >
          {ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-slate-50 px-4 py-2">
          <label htmlFor={`color-${course.slug || 'new'}`} className="text-xs font-semibold uppercase tracking-wide text-stone">
            Color
          </label>
          <input
            id={`color-${course.slug || 'new'}`}
            name="color"
            type="color"
            defaultValue={course.color}
            className="h-8 w-14 cursor-pointer rounded border-none bg-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          {isNew ? 'Add course' : 'Save'}
        </button>
        {!isNew ? (
          <button
            type="submit"
            formAction={deleteCourse.bind(null, course.slug)}
            className="rounded-full border border-red-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function AdminCoursesPage() {
  const { courses } = readContent();
  const blank: CourseEntry = { slug: '', title: '', icon: 'Bot', color: '#3d7fff', description: '', sessions: 0 };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Courses</h1>
      <p className="mt-2 text-stone">
        Manage every course — title, description, session count and video link. To choose which age groups a
        course appears under, use the{' '}
        <a href="/admin/age-groups" className="underline">
          age groups
        </a>{' '}
        page.
      </p>

      <div className="mt-8 space-y-6">
        {courses.map((course) => (
          <CourseForm key={course.slug} course={course} isNew={false} />
        ))}

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone">New course</h2>
          <CourseForm course={blank} isNew />
        </div>
      </div>
    </div>
  );
}
