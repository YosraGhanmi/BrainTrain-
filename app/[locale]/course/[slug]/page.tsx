import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Baby, Banknote, CalendarDays, Check, Clock, Coins, PiggyBank, Sun, Target, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import CourseRobotShowcase from '@/components/course/CourseRobotShowcase';
import CourseTagline from '@/components/course/CourseTagline';
import CoursePaymentRow from '@/components/pricing/CoursePaymentRow';
import { Link } from '@/i18n/navigation';
import { courseRegisterHref } from '@/lib/preinscription/course-link';
import { getDbPreinscriptionSetting } from '@/lib/db/preinscriptions';
import { readContent } from '@/lib/content/store';
import { getAgeGroup, getCourse } from '@/lib/coursesData';
import { getIcon } from '@/lib/content/icons';
import { formatSummerDates } from '@/lib/content/summer';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

// Reads ?age= (the age group the visitor came from) on every request
export const dynamic = 'force-dynamic';

// 2 -> "2h", 1.5 -> "1h30"
function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes ? `${whole}h${String(minutes).padStart(2, '0')}` : `${whole}h`;
}

// Icon bubble colors for the floating labels around the robot, in order
const HIGHLIGHT_TINTS = ['bg-[#fff4d6] text-[#d99a00]', 'bg-[#e8efff] text-accent', 'bg-[#efeaff] text-accent2'];

// Where each highlight floats around the robot
const CHIP_POSITIONS = ['-right-4 top-[2%]', '-left-8 top-[58%]', '-right-4 bottom-[16%]'];

export async function generateMetadata(props: { params: Promise<{ slug: string; locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const course = await getCourse(params.slug, params.locale);
  if (!course) return { title: 'Course | BrainTrain' };

  const title = `${course.title} | BrainTrain`;
  const path = `/course/${params.slug}`;
  const url = absoluteUrl(params.locale, path);

  return {
    title,
    description: course.description,
    alternates: {
      canonical: url,
      languages: localeAlternates(path),
    },
    openGraph: {
      title,
      description: course.description,
      url,
      type: 'website',
      ...(course.image ? { images: [course.image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: course.description,
      ...(course.image ? { images: [course.image] } : {}),
    },
  };
}

export default async function CourseDetailPage(
  props: {
    params: Promise<{ slug: string; locale: AppLocale }>;
    searchParams: Promise<{ age?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const course = await getCourse(params.slug, params.locale);
  if (!course) notFound();

  // Arrived from a specific age group's course list — send "All courses" back
  // there instead of the top-level age-group picker.
  const backHref = searchParams.age ? `/courses/${searchParams.age}` : '/courses';
  const enrollHref = courseRegisterHref(
    await getDbPreinscriptionSetting(),
    course.slug,
    `/course/${params.slug}${searchParams.age ? `?age=${searchParams.age}` : ''}`
  );
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'coursePage' });
  const { classFormat, familyDiscountPercent: schoolYearDiscount, summerSchool } = (await readContent());
  const familyDiscountPercent = course.summer ? summerSchool.familyDiscountPercent : schoolYearDiscount;
  const ageLabel = (await getAgeGroup(course.ageGroupSlug, params.locale))?.label ?? '';

  const plans = course.summer
    ? [
        { Icon: Banknote, title: tc('planMonthly'), text: tc('planSummerMonthlyText') },
        { Icon: PiggyBank, title: tc('planSeason'), text: tc('planSeasonText') },
      ]
    : [
        { Icon: Banknote, title: tc('planMonthly'), text: tc('planMonthlyText') },
        { Icon: Coins, title: tc('planTerm'), text: tc('planTermText') },
        { Icon: PiggyBank, title: tc('planYearly'), text: tc('planYearlyText') },
      ];

  // "6-9 ans" -> big "6-9" over "ans"
  const ageMatch = /^([\d\s–-]+?)\s+(\S.*)$/.exec(ageLabel);
  const facts = [
    { Icon: CalendarDays, tint: 'bg-[#e8efff] text-accent', value: String(course.sessions), label: t('sessions') },
    {
      Icon: Clock,
      tint: 'bg-[#efeaff] text-accent2',
      value: formatHours(course.sessionHours ?? classFormat.sessionHours).toUpperCase(),
      label: tc('lengthLabel'),
    },
    { Icon: Users, tint: 'bg-emerald-50 text-emerald-600', value: String(classFormat.maxGroupSize), label: tc('groupLabel') },
    ...(ageLabel
      ? [{ Icon: Baby, tint: 'bg-[#fff1e6] text-cta', value: ageMatch?.[1] ?? ageLabel, label: ageMatch?.[2] ?? '' }]
      : []),
  ];

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'BrainTrain',
      sameAs: absoluteUrl(params.locale),
    },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <Navbar />
      <main className="relative flex-1 overflow-hidden px-6 pb-16 pt-28 md:px-10 lg:flex lg:min-h-dvh lg:items-center lg:px-16 lg:pb-4 lg:pt-[5.5rem] xl:pb-6 xl:pt-[5.5rem]">
        <div className="pointer-events-none absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full bg-[#e8efff]/70 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone transition hover:text-ink"
              >
                <ArrowLeft className="size-4" />
                {t('allCourses')}
              </Link>
              {course.summer ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                  <Sun className="size-3.5" />
                  {tc('summerBadge')} · {formatSummerDates(summerSchool, params.locale)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-navy lg:mt-3 lg:text-4xl xl:text-[2.6rem]">
              {course.title}
            </h1>
            {course.tagline ? <CourseTagline text={course.tagline} /> : null}
            <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-stone lg:mt-3 lg:line-clamp-2 lg:text-sm xl:line-clamp-3">{course.description}</p>

            <ul className={`mt-8 grid grid-cols-1 gap-5 lg:mt-4 lg:gap-4 xl:mt-5 ${plans.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {plans.map(({ Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full lg:size-9 bg-[#e8efff] text-accent`}>
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block font-semibold text-navy lg:text-sm">{title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-stone">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <ul className="mt-8 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:mt-4 lg:gap-2.5 xl:mt-5 xl:grid-cols-4">
              {facts.map(({ Icon, tint, value, label }) => (
                <li key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-ink/5 bg-white px-4 py-3 shadow-soft lg:gap-2.5 lg:px-3 lg:py-2.5">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full lg:size-8 ${tint}`}>
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 text-center">
                    <span className="block font-display text-2xl font-bold leading-none tabular-nums text-navy lg:text-xl xl:text-2xl">{value}</span>
                    <span className="mt-1 block text-sm leading-tight text-ink/80 lg:text-xs xl:text-sm">{label}</span>
                  </span>
                </li>
              ))}
            </ul>

            {course.outcome || course.skills.length > 0 ? (
              <div className="mt-4 grid gap-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:grid-cols-[1.2fr_1fr] lg:mt-3 lg:gap-4 lg:px-4 lg:py-3 xl:p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Target className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-navy">{course.summer ? tc('outcomeHeadingSummer') : tc('outcomeHeading')}</h2>
                    {course.outcome ? <p className="mt-1.5 text-pretty text-sm leading-relaxed text-ink/80 lg:mt-1 lg:text-[13px] lg:leading-snug">{course.outcome}</p> : null}
                    {course.tools.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2 lg:mt-2 lg:gap-1.5 xl:gap-2">
                        {course.tools.map((tool) => (
                          <li key={tool} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink lg:px-2.5 lg:py-0.5 lg:text-[11px] xl:px-3 xl:py-1 xl:text-xs">
                            {tool}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                {course.skills.length > 0 ? (
                  <ul className="space-y-2 self-center lg:space-y-1">
                    {course.skills.map((skill) => (
                      <li key={skill} className="flex items-start gap-2 text-sm text-ink/80 lg:text-[13px] lg:leading-snug">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 lg:mt-3">
              <CoursePaymentRow
                familyDiscountPercent={familyDiscountPercent}
                action={
                  <Link
                    href={enrollHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-3 text-xs font-bold uppercase tracking-wide text-navy shadow-[0_10px_30px_rgba(255,140,66,0.35)] transition hover:bg-[#f97b2b] sm:w-auto lg:py-2.5 xl:py-3"
                  >
                    {t('enrollInCourse')}
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            </div>
          </div>

          <div className="relative mx-auto h-[380px] w-full max-w-md sm:h-[460px] lg:h-[min(520px,calc(100dvh-9rem))]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#e8efff] via-white to-[#efeaff]" />
            <CourseRobotShowcase description={course.description} locale={params.locale} />
            {course.highlights.map((highlight, i) => {
              const Icon = getIcon(highlight.icon);
              return (
                <span
                  key={highlight.title}
                  className={`pointer-events-none absolute z-10 hidden items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 text-xs font-semibold text-navy shadow-soft animate-bob motion-reduce:animate-none sm:inline-flex ${CHIP_POSITIONS[i % CHIP_POSITIONS.length]}`}
                  style={{ animationDelay: `${i * -2.5}s` }}
                >
                  <span className={`flex size-6 items-center justify-center rounded-full ${HIGHLIGHT_TINTS[i % HIGHLIGHT_TINTS.length]}`}>
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  {highlight.title}
                </span>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
