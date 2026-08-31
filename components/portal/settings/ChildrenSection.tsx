import { Link } from '@/i18n/navigation';
import { GraduationCap, BookOpen } from 'lucide-react';
import { editChild } from '@/lib/children/actions';
import { getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import type { AppLocale } from '@/i18n/routing';
import type { AgeGroupEntry } from '@/lib/content/types';
import type { Prisma } from '@prisma/client';

type ChildWithEnrollments = Prisma.ChildGetPayload<{
  include: { enrollments: { include: { courseSession: true } } };
}>;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

export default function ChildrenSection({
  locale,
  kids,
  ageGroups,
  selectedChildId,
}: {
  locale: AppLocale;
  kids: ChildWithEnrollments[];
  ageGroups: AgeGroupEntry[];
  selectedChildId: string;
}) {
  const selected = kids.find((c) => c.id === selectedChildId) ?? kids[0] ?? null;

  if (kids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center">
        <p className="text-sm text-stone">You haven&apos;t added any children yet.</p>
        <Link href="/parent-portal/children/new" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          Add a child
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="w-56 shrink-0 space-y-1">
        {kids.map((child) => {
          const isActive = selected?.id === child.id;
          const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);
          return (
            <Link
              key={child.id}
              href={`/parent-portal/account?tab=children&child=${child.id}`}
              className={`block rounded-xl px-4 py-3 transition ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <p className="text-sm font-semibold text-ink">{child.fullName}</p>
              <p className="text-xs text-stone">{ageGroup.label.en}</p>
            </Link>
          );
        })}
        <Link
          href="/parent-portal/children/new"
          className="block rounded-xl px-4 py-3 text-sm font-semibold text-accent transition hover:bg-slate-50"
        >
          + Add a child
        </Link>
      </div>

      {selected ? (
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
            <h2 className="font-display text-lg font-bold text-ink">{selected.fullName}</h2>
            <form action={editChild} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="childId" value={selected.id} />

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-stone">Full name</label>
                <input
                  name="fullName"
                  required
                  defaultValue={selected.fullName}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone">Date of birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  defaultValue={selected.dateOfBirth.toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone">Age group</label>
                <select
                  name="ageGroupSlug"
                  required
                  defaultValue={selected.ageGroupSlug}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                >
                  {ageGroups.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-stone">Disabilities / special accommodations (optional)</label>
                <textarea
                  name="specialNeeds"
                  rows={3}
                  defaultValue={selected.specialNeeds ?? ''}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                  Save changes
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-8 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <BookOpen className="h-5 w-5 text-accent" />
              Courses
            </h2>
            {selected.enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Not enrolled in any course yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {selected.enrollments.map((enrollment) => {
                  const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
                  return (
                    <li key={enrollment.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <GraduationCap className="h-4 w-4 text-accent" />
                        {course.title.en}
                        <span className="font-normal text-stone">· {enrollment.courseSession.term}</span>
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[enrollment.status]}`}>
                        {enrollment.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
