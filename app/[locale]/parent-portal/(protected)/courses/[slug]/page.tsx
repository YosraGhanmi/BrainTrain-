import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { readContent } from '@/lib/content/store';
import { getIcon } from '@/lib/content/icons';
import { resolvePrice } from '@/lib/pricing/compute';
import { enrollChild } from '@/lib/enrollment/actions';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CurriculumTimeline from '@/components/course/CurriculumTimeline';
import type { AppLocale } from '@/i18n/routing';
import type { PlanType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PLAN_INFO: { type: PlanType; label: string; hint: string }[] = [
  { type: 'MONTHLY', label: 'Monthly', hint: 'Billed every month' },
  { type: 'SEASONAL', label: 'Seasonal', hint: 'Billed once per season' },
  { type: 'COURSE', label: 'Full course', hint: 'One-time payment for the whole course' },
];

const ERROR_MESSAGES: Record<string, string> = {
  plan: 'Please choose a payment plan.',
  session: 'Please pick a group.',
  ineligible: "That course isn't offered for this child's age group.",
  capacity: 'That group is full. Please pick another.',
  duplicate: 'This child is already enrolled in that group.',
};

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; slug: string };
  searchParams: { saved?: string; error?: string };
}) {
  const parent = await requireParent(params.locale);
  const children = await prisma.child.findMany({
    where: { parentId: parent.parentId },
    orderBy: { createdAt: 'asc' },
  });
  const selected = resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        No children yet. Add a child to start enrolling in courses.
      </p>
    );
  }

  const child = await prisma.child.findUnique({ where: { id: selected.id } });
  if (!child) return null;

  const course = readContent().courses.find((c) => c.slug === params.slug);
  if (!course) notFound();

  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const curriculum = course.curriculum?.map((phase) => ({
    title: phase.title[params.locale] || phase.title.en,
    points: phase.points.map((point) => point[params.locale] || point.en),
  }));

  const sessions = await prisma.courseSession.findMany({
    where: { courseSlug: params.slug },
    include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'ACTIVE'] } } } } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  const enrolledSessionIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: { childId: child.id, status: { in: ['PENDING', 'ACTIVE'] }, courseSession: { courseSlug: params.slug } },
        select: { courseSessionId: true },
      })
    ).map((e) => e.courseSessionId)
  );

  const groups = sessions.map((s, i) => ({
    id: s.id,
    label: `G${i + 1}`,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    seatsLeft: s.capacity - s._count.enrollments,
    enrolled: enrolledSessionIds.has(s.id),
  }));

  const dayNumbers = Array.from(new Set(groups.map((g) => g.dayOfWeek))).sort((a, b) => a - b);

  const prices = await Promise.all(
    PLAN_INFO.map(async (plan) => ({ ...plan, ...(await resolvePrice(plan.type, params.slug)) }))
  );

  const media = course.image ? (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl">
      <Image src={course.image} alt={course.title.en} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
    </div>
  ) : (
    <CourseIllustration icon={getIcon(course.icon)} color={course.color} className="h-56 w-full rounded-2xl" />
  );

  return (
    <div>
      <Link href="/parent-portal/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      {searchParams.saved ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Enrolled. Thank you!</p>
      ) : null}
      {searchParams.error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {ERROR_MESSAGES[searchParams.error] ?? 'Something went wrong. Please try again.'}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          {media}
          <h1 className="mt-5 font-display text-2xl font-bold text-ink">{course.title.en}</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">{course.description.en}</p>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-ink">Payment options</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {prices.map((p) => (
              <div key={p.type} className="rounded-2xl border border-ink/10 bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-stone">{p.label}</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">
                  {p.amount} {p.currency}
                </p>
                <p className="mt-1 text-xs text-stone">{p.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {curriculum && curriculum.length > 0 ? (
        <CurriculumTimeline
          curriculum={curriculum}
          color={course.color}
          heading={t('curriculum')}
          phaseLabels={curriculum.map((_, i) => t('phase', { number: i + 1 }))}
        />
      ) : null}

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Emploi du temps: choose a group</h2>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No sessions are currently scheduled for this course.
        </p>
      ) : (
        <form action={enrollChild} className="mt-4">
          <input type="hidden" name="locale" value={params.locale} />
          <input type="hidden" name="childId" value={child.id} />
          <input type="hidden" name="courseSlug" value={params.slug} />

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#0b1a3a]/20 bg-[#0b1a3a] p-6 sm:grid-cols-3 lg:grid-cols-4">
            {dayNumbers.map((day) => (
              <div key={day}>
                <h3 className="text-center text-sm font-bold uppercase tracking-wide text-white">{DAYS[day]}</h3>
                <div className="mt-3 space-y-2">
                  {groups
                    .filter((g) => g.dayOfWeek === day)
                    .map((g) => {
                      const disabled = g.enrolled || g.seatsLeft <= 0;
                      return (
                        <label key={g.id} className={disabled ? 'block cursor-not-allowed opacity-50' : 'block cursor-pointer'}>
                          <input
                            type="radio"
                            name="courseSessionId"
                            value={g.id}
                            required
                            disabled={disabled}
                            className="peer sr-only"
                          />
                          <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-center transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white">
                            <p className="text-sm font-bold text-white">{g.label}</p>
                            <p className="mt-0.5 text-xs text-white/80">
                              {g.startTime}–{g.endTime}
                            </p>
                            <p className="mt-0.5 text-[0.65rem] text-white/60">
                              {g.enrolled ? 'Already enrolled' : g.seatsLeft > 0 ? `${g.seatsLeft} seats left` : 'Full'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-stone">Payment plan</label>
              <select
                name="planType"
                required
                className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent"
              >
                {PLAN_INFO.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              Enroll
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
