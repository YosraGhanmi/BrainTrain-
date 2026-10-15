import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Sun } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { requireParent } from '@/lib/portal-auth/guard';
import { resolveSelectedChild } from '@/lib/portal-auth/selected-child';
import { readContent } from '@/lib/content/store';
import { courseLookup } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { localized } from '@/lib/i18n/format';
import { familyDiscountSettingFor, resolvePrice } from '@/lib/pricing/compute';
import { applyDiscount, getFamilyDiscountPercent } from '@/lib/pricing/family-discount';
import { formatSummerDates, isCourseOffered } from '@/lib/content/summer';
import { enrollChild } from '@/lib/enrollment/actions';
import { formatSessionDays, sessionDays, sessionsConflict } from '@/lib/scheduling/slots';
import { sessionGroupLabel, listTimeSlots } from '@/lib/scheduling/time-slots';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import CurriculumTimeline from '@/components/course/CurriculumTimeline';
import EnrollWizard from '@/components/portal/EnrollWizard';
import type { AppLocale } from '@/i18n/routing';
import { listDbChildren } from '@/lib/db/children';
import { listDbEnrollmentsWithSessionsByChild, listDbSessionsWithCountsByCourse } from '@/lib/db/read-models';
import type { PlanType, PaymentMethod } from '@/lib/db/enrollments';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage(
  props: {
    params: Promise<{ locale: AppLocale; slug: string }>;
    searchParams: Promise<{ error?: string }>;
  }
) {
  const courseOf = await courseLookup();
  const searchParams = await props.searchParams;
  const params = await props.params;
  const parent = await requireParent(params.locale);
  const tp = await getTranslations({ locale: params.locale, namespace: 'parentPortal' });
  const td = await getTranslations({ locale: params.locale, namespace: 'parentPortal.courseDetail' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const DAYS = tc.raw('days') as string[];
  const content = (await readContent());
  const summerDates = formatSummerDates(content.summerSchool, params.locale);
  const SCHOOL_YEAR_PLANS: { type: PlanType; label: string; hint: string }[] = [
    { type: 'MONTHLY', label: td('plans.monthly.label'), hint: td('plans.monthly.hint') },
    { type: 'QUARTERLY', label: td('plans.quarterly.label'), hint: td('plans.quarterly.hint') },
    { type: 'YEARLY', label: td('plans.yearly.label'), hint: td('plans.yearly.hint') },
  ];
  const SUMMER_PLANS: { type: PlanType; label: string; hint: string }[] = [
    { type: 'MONTHLY', label: td('plans.summerMonthly.label'), hint: td('plans.summerMonthly.hint') },
    { type: 'SEASON', label: td('plans.season.label'), hint: td('plans.season.hint', { dates: summerDates }) },
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
    closed: td('errors.closed'),
  };
  const children = await listDbChildren(parent.parentId);
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

  const course = content.courses.find((c) => c.slug === params.slug);
  if (!course || !isCourseOffered(course, content)) notFound();
  const PLAN_INFO = course.summer ? SUMMER_PLANS : SCHOOL_YEAR_PLANS;

  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const curriculum = course.curriculum?.map((phase) => ({
    title: phase.title[params.locale] || phase.title.en,
    points: phase.points.map((point) => point[params.locale] || point.en),
  }));

  const [sessions, timeSlots] = await Promise.all([
    listDbSessionsWithCountsByCourse(params.slug),
    listTimeSlots(),
  ]);

  const otherEnrollments = await listDbEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']);
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
      label: sessionGroupLabel(timeSlots, s) ?? `G${i + 1}`,
      dayOfWeek: s.dayOfWeek,
      daysLabel: sessionDays(s).length > 1 ? formatSessionDays(s, DAYS) : null,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      seatsLeft: s.capacity - s.enrollmentCount,
      enrolled: enrolledSessionIds.has(s.id),
      conflictLabel: conflict ? localized(courseOf(conflict.courseSession.courseSlug).title, params.locale) : null,
    };
  });

  const dayNumbers = Array.from(new Set(groups.map((g) => g.dayOfWeek))).sort((a, b) => a - b);

  const [basePrices, discountPercent] = await Promise.all([
    Promise.all(
      PLAN_INFO.map(async (plan) => ({ ...plan, ...(await resolvePrice(plan.type, params.slug, course.ageGroupSlug)) }))
    ),
    familyDiscountSettingFor(course).then((percent) => getFamilyDiscountPercent(child, percent)),
  ]);
  // Same discount enrollChild applies, so the wizard shows what will be billed
  const prices = basePrices.map((plan) => ({ ...plan, amount: applyDiscount(plan.amount, discountPercent) }));

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
          {course.summer ? (
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              <Sun className="h-3.5 w-3.5" />
              {td('summerBadge')} · {summerDates}
            </p>
          ) : null}
          <h1 className="mt-5 font-display text-2xl font-bold text-ink">{localized(course.title, params.locale)}</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">{localized(course.description, params.locale)}</p>
          {course.summer ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-relaxed text-ink/80">
              {localized(content.summerSchool.intro, params.locale) ? <p>{localized(content.summerSchool.intro, params.locale)}</p> : null}
              {localized(content.summerSchool.closingNote, params.locale) ? (
                <p className="font-semibold text-ink">{localized(content.summerSchool.closingNote, params.locale)}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-ink">{td('startingFrom')}</h2>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {discountPercent ? (
              <span className="mr-2 text-xl font-semibold text-stone line-through">{basePrices[0].amount}</span>
            ) : null}
            {prices[0].amount} {prices[0].currency}
            <span className="text-base font-semibold text-stone"> {td('perMonth')}</span>
          </p>
          {discountPercent ? (
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {td('familyDiscount', { percent: discountPercent })}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-stone">{course.summer ? td('summerOtherPlansHint') : td('otherPlansHint')}</p>
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
