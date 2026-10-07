import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Baby, CalendarCheck, CalendarDays, CalendarRange, Check, Clock, Target, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import CourseRobotShowcase from '@/components/course/CourseRobotShowcase';
import CourseTagline from '@/components/course/CourseTagline';
import CoursePaymentRow from '@/components/pricing/CoursePaymentRow';
import { Link } from '@/i18n/navigation';
import { readContent } from '@/lib/content/store';
import { getAgeGroup, getCourse } from '@/lib/coursesData';
import { getIcon } from '@/lib/content/icons';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

// 2 -> "2h", 1.5 -> "1h30"
function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes ? `${whole}h${String(minutes).padStart(2, '0')}` : `${whole}h`;
}

// Icon bubble colors for the three payment plans and floating highlights, in order
const HIGHLIGHT_TINTS = ['bg-[#fff4d6] text-[#d99a00]', 'bg-[#e8efff] text-accent', 'bg-[#efeaff] text-[#6c5ce7]'];

// Where each highlight floats around the robot
const CHIP_POSITIONS = ['right-0 top-[8%]', 'left-0 top-[46%]', 'right-2 bottom-[18%]'];

export function generateStaticParams() {
  return readContent().courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string; locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const course = getCourse(params.slug, params.locale);
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
  const course = getCourse(params.slug, params.locale);
  if (!course) notFound();

  // Arrived from a specific age group's course list — send "All courses" back
  // there instead of the top-level age-group picker.
  const backHref = searchParams.age ? `/courses/${searchParams.age}` : '/courses';
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });
  const tp = await getTranslations({ locale: params.locale, namespace: 'pricing' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'coursePage' });
  const { classFormat, familyDiscountPercent } = readContent();
  const ageLabel = getAgeGroup(course.ageGroupSlug, params.locale)?.label ?? '';

  const plans = [
    { Icon: CalendarDays, title: tc('planMonthly'), text: tc('planMonthlyText') },
    { Icon: CalendarRange, title: tc('planTerm'), text: tc('planTermText') },
    { Icon: CalendarCheck, title: tc('planYearly'), text: tc('planYearlyText') },
  ];

  const facts = [
    {
      Icon: CalendarDays,
      tint: 'bg-[#e8efff] text-accent',
      value: `${course.sessions} ${t('sessions')}`,
      sub: tp('perWeek', { count: classFormat.sessionsPerWeek }),
    },
    {
      Icon: Clock,
      tint: 'bg-[#efeaff] text-[#6c5ce7]',
      value: tp('hours', { hours: formatHours(course.sessionHours ?? classFormat.sessionHours) }),
      sub: tc('hoursSub'),
    },
    {
      Icon: Users,
      tint: 'bg-emerald-50 text-emerald-600',
      value: tc('groupValue', { count: classFormat.maxGroupSize }),
      sub: tc('groupSub'),
    },
    ...(ageLabel ? [{ Icon: Baby, tint: 'bg-[#fff1e6] text-[#ff8c42]', value: ageLabel, sub: tc('ageSub') }] : []),
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
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <Navbar />
      <main className="relative flex-1 overflow-hidden px-6 pb-16 pt-28 md:px-10 lg:flex lg:min-h-screen lg:items-center lg:px-16 lg:pb-4 lg:pt-[5.5rem] xl:pb-6 xl:pt-[5.5rem]">
        <div className="pointer-events-none absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full bg-[#e8efff]/70 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone transition hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('allCourses')}
              </Link>
            </div>

            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[#0f1f4d] lg:mt-3 lg:text-4xl xl:text-[2.6rem]">
              {course.title}
            </h1>
            {course.tagline ? <CourseTagline text={course.tagline} /> : null}
            <p className="mt-5 max-w-2xl leading-relaxed text-stone lg:mt-3 lg:line-clamp-2 lg:text-sm xl:line-clamp-3">{course.description}</p>

            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:mt-4 lg:gap-4 xl:mt-5">
              {plans.map(({ Icon, title, text }, i) => (
                <li key={title} className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:h-9 lg:w-9 ${HIGHLIGHT_TINTS[i % HIGHLIGHT_TINTS.length]}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block font-semibold text-[#0f1f4d] lg:text-sm">{title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-stone">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <ul className="mt-8 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:mt-4 lg:gap-2.5 xl:mt-5 xl:grid-cols-4">
              {facts.map(({ Icon, tint, value, sub }) => (
                <li key={value} className="flex min-w-0 items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft lg:gap-2.5 lg:p-3 xl:flex-col xl:items-start xl:gap-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:h-8 lg:w-8 ${tint}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-tight text-[#0f1f4d] lg:text-[13px]">{value}</span>
                    <span className="block text-xs text-stone lg:text-[11px] lg:leading-tight">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            {course.outcome || course.skills.length > 0 ? (
              <div className="mt-4 grid gap-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:grid-cols-[1.2fr_1fr] lg:mt-3 lg:gap-4 lg:px-4 lg:py-3 xl:p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Target className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display font-bold text-[#0f1f4d]">{tc('outcomeHeading')}</p>
                    {course.outcome ? <p className="mt-1.5 text-sm leading-relaxed text-ink/80 lg:mt-1 lg:text-[13px] lg:leading-snug">{course.outcome}</p> : null}
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
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
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
                    href="/parent-portal/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff8c42] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(255,140,66,0.35)] transition hover:bg-[#f97b2b] sm:w-auto lg:py-2.5 xl:py-3"
                  >
                    {t('enrollInCourse')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            </div>
          </div>

          <div className="relative mx-auto h-[380px] w-full max-w-md sm:h-[460px] lg:h-[min(520px,calc(100vh-9rem))]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#e8efff] via-white to-[#efeaff]" />
            <CourseRobotShowcase description={course.description} locale={params.locale} />
            {course.highlights.map((highlight, i) => {
              const Icon = getIcon(highlight.icon);
              return (
                <span
                  key={highlight.title}
                  className={`pointer-events-none absolute z-10 hidden items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-[#0f1f4d] shadow-soft backdrop-blur animate-bob sm:inline-flex ${CHIP_POSITIONS[i % CHIP_POSITIONS.length]}`}
                  style={{ animationDelay: `${i * -2.5}s` }}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${HIGHLIGHT_TINTS[i % HIGHLIGHT_TINTS.length]}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
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
