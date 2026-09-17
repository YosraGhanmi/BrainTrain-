import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { readContent } from '@/lib/content/store';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import { resolvePrice } from '@/lib/pricing/compute';
import { enrollChild } from '@/lib/enrollment/actions';
import { sessionsConflict } from '@/lib/scheduling/slots';
import { findSlotLabel, listTimeSlots } from '@/lib/scheduling/time-slots';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CurriculumTimeline from '@/components/course/CurriculumTimeline';
import EnrollWizard from '@/components/portal/EnrollWizard';
import type { AppLocale } from '@/i18n/routing';
import { listFirebaseChildren } from '@/lib/firebase/children';
import { listFirebaseEnrollmentsWithSessionsByChild, listFirebaseSessionsWithCountsByCourse } from '@/lib/firebase/read-models';
import type { PlanType, PaymentMethod } from '@/lib/firebase/enrollments';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage(
  props: {
    params: Promise<{ locale: AppLocale; slug: string }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const tp = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const td = await getTranslations({ locale: params.locale, namespace: 'parentPortal.courseDetail' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const DAYS = tc.raw('days') as string[];
  const PLAN_INFO: { type: PlanType; label: string; hint: string }[] = [
    { type: 'MONTHLY', label: td('plans.monthly.label'), hint: td('plans.monthly.hint') },
    { type: 'QUARTERLY', label: td('plans.quarterly.label'), hint: td('plans.quarterly.hint') },
    { type: 'YEARLY', label: td('plans.yearly.label'), hint: td('plans.yearly.hint') },
  ];
  const PAYMENT_METHOD_INFO: { type: PaymentMethod; label: string }[] = [
    { type: 'CASH', label: td('methods.cash') },
    { type: 'CARD', label: td('methods.card') },
    { type: 'CHEQUE', label: td('methods.cheque') },
  ];
  const ERROR_MESSAGES: Record<string, string> = {
    plan: td('errors.plan'),
    method: td('errors.method'),
    session: td('errors.session'),
    ineligible: td('errors.ineligible'),
    capacity: td('errors.capacity'),
    duplicate: td('errors.duplicate'),
    conflict: td('errors.conflict'),
  };
  const children = await listFirebaseChildren(parent.parentId);
  const selected = await resolveSelectedChild(children);

  if (!selected) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-stone">
        {tp('noChildren')}
      </p>
    );
  }

  const child = children.find((entry) => entry.id === selected.id) ?? null;
  if (!child) return null;

  const course = readContent().courses.find((c) => c.slug === params.slug);
  if (!course) notFound();

  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const curriculum = course.curriculum?.map((phase) => ({
    title: phase.title[params.locale] || phase.title.en,
    points: phase.points.map((point) => point[params.locale] || point.en),
  }));

  const [sessions, timeSlots] = await Promise.all([
    listFirebaseSessionsWithCountsByCourse(params.slug),
    listTimeSlots(),
  ]);

  const otherEnrollments = await listFirebaseEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']);
  const enrolledSessionIds = new Set(
    otherEnrollments.filter((enrollment) => enrollment.courseSession.courseSlug === params.slug).map((e) => e.courseSessionId)
  );

  // This child's whole schedule (every course, not just this one) — used to
  // flag groups here that would double-book them at the same day/time.
  const groups = sessions.map((s, i) => {
    const conflict = otherEnrollments.find(
      (e) => e.courseSessionId !== s.id && sessionsConflict(s, e.courseSession)
    );
    return {
      id: s.id,
      label: findSlotLabel(timeSlots, s.dayOfWeek, s.startTime, s.endTime) ?? `G${i + 1}`,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      seatsLeft: s.capacity - s.enrollmentCount,
      enrolled: enrolledSessionIds.has(s.id),
      conflictLabel: conflict ? localized(getCourseEntryOrThrow(conflict.courseSession.courseSlug).title, params.locale) : null,
    };
  });

  const dayNumbers = Array.from(new Set(groups.map((g) => g.dayOfWeek))).sort((a, b) => a - b);

  const prices = await Promise.all(
    PLAN_INFO.map(async (plan) => ({ ...plan, ...(await resolvePrice(plan.type, params.slug, course.ageGroupSlug)) }))
  );

  const media = course.image ? (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl">
      <Image src={course.image} alt={localized(course.title, params.locale)} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
    </div>
  ) : (
    <CourseIllustration icon={getIcon(course.icon)} color={course.color} className="h-56 w-full rounded-2xl" />
  );

  return (
    <div>
      <Link href="/parent-portal/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        {td('backToCourses')}
      </Link>

      {searchParams.error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {ERROR_MESSAGES[searchParams.error] ?? td('errors.generic')}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          {media}
          <h1 className="mt-5 font-display text-2xl font-bold text-ink">{localized(course.title, params.locale)}</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">{localized(course.description, params.locale)}</p>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-ink">{td('startingFrom')}</h2>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {prices[0].amount} {prices[0].currency}
            <span className="text-base font-semibold text-stone"> {td('perMonth')}</span>
          </p>
          <p className="mt-1 text-sm text-stone">{td('otherPlansHint')}</p>
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

      <h2 className="mt-10 font-display text-lg font-bold text-ink">{td('enrollHeading')}</h2>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-white p-8 text-center text-stone">
          {td('noSessions')}
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
        />
      )}
    </div>
  );
}
