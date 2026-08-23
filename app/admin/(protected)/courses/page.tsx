import { readContent } from '@/lib/content/store';
import { upsertCourse, deleteCourse } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import CourseIconPreview from '@/components/admin/CourseIconPreview';
import type { AgeGroupEntry, CourseEntry } from '@/lib/content/types';

export const dynamic = 'force-dynamic';

// One pastel per age group, cycling if there are ever more than four.
const AGE_GROUP_PASTELS = ['#a78bfa', '#fdba74', '#7dd3fc', '#86efac', '#f9a8d4', '#fcd34d'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {children}
    </label>
  );
}

function CourseForm({
  course,
  ageGroups,
  isNew,
  accentColor,
}: {
  course: CourseEntry;
  ageGroups: AgeGroupEntry[];
  isNew: boolean;
  accentColor?: string;
}) {
  return (
    <details
      className={`group rounded-2xl border bg-white ${isNew ? 'border-dashed border-ink/30' : 'border-ink/10'}`}
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 5 } : undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-ink">
        {isNew ? '+ New course' : course.title || 'Untitled course'}
        <span className="flex items-center gap-3">
          {!isNew ? <DeleteIconButton action={deleteCourse.bind(null, course.slug)} /> : null}
          <span className="text-stone transition group-open:rotate-180">▾</span>
        </span>
      </summary>

      <form action={upsertCourse} className="space-y-4 border-t border-ink/10 p-6">
        <input type="hidden" name="existingSlug" value={isNew ? '' : course.slug} />

        <Field label="Course title">
          <input
            name="title"
            defaultValue={course.title}
            placeholder="Course title"
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Age group (this exact course — content, sessions and price — only applies to this age group)">
          <select
            name="ageGroupSlug"
            defaultValue={course.ageGroupSlug || ageGroups[0]?.slug}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          >
            {ageGroups.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sessions (number of sessions in the course)">
          <input
            name="sessions"
            type="number"
            min={0}
            defaultValue={course.sessions}
            placeholder="Sessions"
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Price (TND)">
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={course.price}
            placeholder="Price"
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            defaultValue={course.description}
            placeholder="Description"
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <Field label="Video link (YouTube or Facebook — optional)">
          <input
            name="videoUrl"
            defaultValue={course.videoUrl ?? ''}
            placeholder="Video link (YouTube or Facebook — optional)"
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>

        <CourseIconPreview initialIcon={course.icon} initialColor={course.color} image={course.image} />

        <Field label="Illustration image (overrides the icon above on the age group's course grid — optional)">
          <div className="flex items-center gap-4">
            {course.image ? (
              <img src={course.image} alt="" className="h-16 w-16 rounded-xl border border-ink/10 object-cover" />
            ) : null}
            <input
              name="image"
              type="file"
              accept="image/*"
              className="block flex-1 text-sm text-ink"
            />
          </div>
        </Field>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            {isNew ? 'Add course' : 'Save'}
          </button>
        </div>
      </form>
    </details>
  );
}

export default function AdminCoursesPage() {
  const { courses, ageGroups } = readContent();
  const blank: CourseEntry = {
    slug: '',
    title: '',
    icon: 'Bot',
    color: '#3d7fff',
    description: '',
    sessions: 0,
    price: 0,
    ageGroupSlug: ageGroups[0]?.slug ?? '',
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Courses</h1>
      <p className="mt-2 text-stone">
        Each course belongs to a single age group, with its own description, session count and price — the same
        course name can appear under multiple age groups as separate entries below, each edited independently.
      </p>

      <div className="mt-8 space-y-10">
        <CourseForm course={blank} ageGroups={ageGroups} isNew />

        {ageGroups.map((group, i) => {
          const groupCourses = courses.filter((c) => c.ageGroupSlug === group.slug);
          if (groupCourses.length === 0) return null;
          const color = AGE_GROUP_PASTELS[i % AGE_GROUP_PASTELS.length];

          return (
            <div key={group.slug}>
              <h2
                className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-ink"
                style={{ backgroundColor: `${color}40` }}
              >
                {group.label}
              </h2>
              <div className="space-y-6">
                {groupCourses.map((course) => (
                  <CourseForm key={course.slug} course={course} ageGroups={ageGroups} isNew={false} accentColor={color} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
