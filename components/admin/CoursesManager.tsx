'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { upsertCourse, deleteCourse } from '@/lib/admin/actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import CourseIconPreview from '@/components/admin/CourseIconPreview';
import { getIcon } from '@/lib/content/icons';
import type { AgeGroupEntry, CourseEntry } from '@/lib/content/types';

const NEW_KEY = '__new__';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      {children}
    </label>
  );
}

function CourseFormFields({ course, ageGroups, isNew }: { course: CourseEntry; ageGroups: AgeGroupEntry[]; isNew: boolean }) {
  return (
    <form action={upsertCourse} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="existingSlug" value={isNew ? '' : course.slug} />

      <Field label="Course title — English">
        <input
          name="title_en"
          defaultValue={course.title.en}
          placeholder="Course title — English"
          required
          className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </Field>

      <Field label="Course title — French">
        <input
          name="title_fr"
          defaultValue={course.title.fr}
          placeholder="Course title — French"
          className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Age group (this exact course — content, sessions and price — only applies to this age group)">
          <select
            name="ageGroupSlug"
            defaultValue={course.ageGroupSlug || ageGroups[0]?.slug}
            required
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          >
            {ageGroups.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.label.en}
              </option>
            ))}
          </select>
        </Field>
      </div>

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

      <Field label="Description — English">
        <textarea
          name="description_en"
          defaultValue={course.description.en}
          placeholder="Description — English"
          rows={4}
          className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </Field>

      <Field label="Description — French">
        <textarea
          name="description_fr"
          defaultValue={course.description.fr}
          placeholder="Description — French"
          rows={4}
          className="w-full resize-none rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Video link (YouTube or Facebook — optional)">
          <input
            name="videoUrl"
            defaultValue={course.videoUrl ?? ''}
            placeholder="Video link (YouTube or Facebook — optional)"
            className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <CourseIconPreview initialIcon={course.icon} initialColor={course.color} image={course.image} />
      </div>

      <div className="sm:col-span-2">
        <Field label="Illustration image (overrides the icon above on the age group's course grid — optional)">
          <div className="flex items-center gap-4">
            {course.image ? (
              <img src={course.image} alt="" className="h-16 w-16 rounded-xl border border-ink/10 object-cover" />
            ) : null}
            <input name="image" type="file" accept="image/*" className="block flex-1 text-sm text-ink" />
          </div>
        </Field>
      </div>

      <div className="flex justify-end sm:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          {isNew ? 'Add course' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function CourseSquare({
  course,
  accentColor,
  onOpen,
}: {
  course: CourseEntry;
  accentColor: string;
  onOpen: () => void;
}) {
  const Icon = getIcon(course.icon);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className="flex aspect-square w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-t-4 border-ink/10 bg-white p-4 pt-6 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
        style={{ borderTopColor: accentColor }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${course.color}1f`, color: course.color }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <span className="line-clamp-3 break-words text-sm font-semibold leading-snug text-ink">{course.title.en || 'Untitled course'}</span>
      </button>
      <div className="absolute right-2 top-2">
        <DeleteIconButton action={deleteCourse.bind(null, course.slug)} />
      </div>
    </div>
  );
}

export default function CoursesManager({
  ageGroups,
  groupedCourses,
  blank,
}: {
  ageGroups: AgeGroupEntry[];
  groupedCourses: { group: AgeGroupEntry; color: string; courses: CourseEntry[] }[];
  blank: CourseEntry;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const openCourse =
    openKey === NEW_KEY ? blank : groupedCourses.flatMap((g) => g.courses).find((c) => c.slug === openKey) ?? null;
  const isNew = openKey === NEW_KEY;

  return (
    <>
      <div className="mt-8 space-y-10">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          <button
            type="button"
            onClick={() => setOpenKey(NEW_KEY)}
            className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 text-sm font-semibold text-stone transition hover:border-accent/50 hover:text-accent"
          >
            <Plus className="h-6 w-6" />
            New course
          </button>
        </div>

        {groupedCourses.map(({ group, color, courses }) => {
          if (courses.length === 0) return null;
          return (
            <div key={group.slug}>
              <h2
                className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-ink"
                style={{ backgroundColor: `${color}40` }}
              >
                {group.label.en}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                {courses.map((course) => (
                  <CourseSquare key={course.slug} course={course} accentColor={color} onOpen={() => setOpenKey(course.slug)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {openCourse ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpenKey(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">
                {isNew ? 'New course' : openCourse.title.en || 'Untitled course'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone transition hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <CourseFormFields course={openCourse} ageGroups={ageGroups} isNew={isNew} />
          </div>
        </div>
      ) : null}
    </>
  );
}
