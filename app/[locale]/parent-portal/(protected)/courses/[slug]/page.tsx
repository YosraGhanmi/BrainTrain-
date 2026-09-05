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
import { findSlotLabel } from '@/lib/scheduling/slots';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CurriculumTimeline from '@/components/course/CurriculumTimeline';
import EnrollWizard from '@/components/portal/EnrollWizard';
import type { AppLocale } from '@/i18n/routing';
import type { PlanType, PaymentMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PLAN_INFO: { type: PlanType; label: string; hint: string }[] = [
  { type: 'MONTHLY', label: 'Monthly', hint: 'Billed every month' },
  { type: 'QUARTERLY', label: '3 months', hint: 'Billed once for 3 months' },
  { type: 'YEARLY', label: 'Full year', hint: 'One payment, 15 Sep – 15 Jun' },
];

const PAYMENT_METHOD_INFO: { type: PaymentMethod; label: string }[] = [
  { type: 'CASH', label: 'Cash' },
  { type: 'CARD', label: 'Card' },
  { type: 'CHEQUE', label: 'Cheque' },
];

const ERROR_MESSAGES: Record<string, string> = {
  plan: 'Please choose a payment plan.',
  method: 'Please choose a payment method.',
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
    label: findSlotLabel(s.dayOfWeek, s.startTime, s.endTime) ?? `G${i + 1}`,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    seatsLeft: s.capacity - s._count.enrollments,
    enrolled: enrolledSessionIds.has(s.id),
  }));

  const dayNumbers = Array.from(new Set(groups.map((g) => g.dayOfWeek))).sort((a, b) => a - b);

  const prices = await Promise.all(
    PLAN_INFO.map(async (plan) => ({ ...plan, ...(await resolvePrice(plan.type, params.slug, course.ageGroupSlug)) }))
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
          <h2 className="font-display text-lg font-bold text-ink">Starting from</h2>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {prices[0].amount} {prices[0].currency}
            <span className="text-base font-semibold text-stone"> / month</span>
          </p>
          <p className="mt-1 text-sm text-stone">3 months and full-year plans available at enrollment.</p>
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

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Enroll: group, plan &amp; payment</h2>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          No sessions are currently scheduled for this course.
        </p>
      ) : (
        <EnrollWizard
          action={enrollChild}
          locale={params.locale}
          childId={child.id}
          courseSlug={params.slug}
          groups={groups}
          dayNumbers={dayNumbers}
          dayNames={DAYS}
          plans={prices}
          methods={PAYMENT_METHOD_INFO}
          showSuccess={searchParams.saved === '1'}
        />
      )}
    </div>
  );
}
