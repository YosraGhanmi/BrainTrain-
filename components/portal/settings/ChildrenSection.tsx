import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { GraduationCap, BookOpen } from 'lucide-react';
import { editChild } from '@/lib/children/actions';
import { getAgeGroupEntryOrThrow, getCourseEntryOrThrow } from '@/lib/content/lookup';
import { localized } from '@/lib/i18n/format';
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

export default async function ChildrenSection({
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
  const t = await getTranslations({ locale, namespace: 'parentPortal.childrenSection' });
  const selected = kids.find((c) => c.id === selectedChildId) ?? kids[0] ?? null;

  if (kids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center">
        <p className="text-sm text-stone">{t('none')}</p>
        <Link href="/parent-portal/children/new" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          {t('addChild')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:space-y-1 lg:pb-0">
        {kids.map((child) => {
          const isActive = selected?.id === child.id;
          const ageGroup = getAgeGroupEntryOrThrow(child.ageGroupSlug);
          return (
            <Link
              key={child.id}
              href={`/parent-portal/account?tab=children&child=${child.id}`}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-3 transition lg:block lg:w-full lg:whitespace-normal ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <p className="text-sm font-semibold text-ink">{child.fullName}</p>
              <p className="text-xs text-stone">{localized(ageGroup.label, locale)}</p>
            </Link>
          );
        })}
        <Link
          href="/parent-portal/children/new"
          className="shrink-0 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-accent transition hover:bg-slate-50 lg:block lg:w-full lg:whitespace-normal"
        >
          + {t('addChild')}
        </Link>
      </div>

      {selected ? (
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
            <h2 className="font-display text-lg font-bold text-ink">{selected.fullName}</h2>
            <form action={editChild} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="childId" value={selected.id} />

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-stone">{t('fullName')}</label>
                <input
                  name="fullName"
                  required
                  defaultValue={selected.fullName}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone">{t('dateOfBirth')}</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  defaultValue={selected.dateOfBirth.toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone">{t('ageGroup')}</label>
                <select
                  name="ageGroupSlug"
                  required
                  defaultValue={selected.ageGroupSlug}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                >
                  {ageGroups.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {localized(g.label, locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone">{t('institution')}</label>
                <input
                  name="institution"
                  defaultValue={selected.institution ?? ''}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-stone">{t('specialNeeds')}</label>
                <textarea
                  name="specialNeeds"
                  rows={3}
                  defaultValue={selected.specialNeeds ?? ''}
                  className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3 outline-none focus:border-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <BookOpen className="h-5 w-5 text-accent" />
              {t('courses')}
            </h2>
            {selected.enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-stone">{t('notEnrolled')}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {selected.enrollments.map((enrollment) => {
                  const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
                  return (
                    <li key={enrollment.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <GraduationCap className="h-4 w-4 text-accent" />
                        {localized(course.title, locale)}
                        <span className="font-normal text-stone">· {enrollment.courseSession.term}</span>
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[enrollment.status]}`}>
                        {t(`status.${enrollment.status}`)}
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
