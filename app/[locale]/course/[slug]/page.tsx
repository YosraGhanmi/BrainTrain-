import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import VideoEmbed from '@/components/video/VideoEmbed';
import ArrowRevealButton from '@/components/buttons/ArrowRevealButton';
import { Link } from '@/i18n/navigation';
import { readContent } from '@/lib/content/store';
import { getCourse } from '@/lib/coursesData';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

export function generateStaticParams() {
  return readContent().courses.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string; locale: AppLocale } }): Metadata {
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

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string; locale: AppLocale };
  searchParams: { age?: string };
}) {
  const course = getCourse(params.slug, params.locale);
  if (!course) notFound();

  // Arrived from a specific age group's course list — send "All courses" back
  // there instead of the top-level age-group picker.
  const backHref = searchParams.age ? `/courses/${searchParams.age}` : '/courses';
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });

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
      <main className="flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href={backHref}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('allCourses')}
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
                {course.title}
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-stone">{course.description}</p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-white px-5 py-3">
                <CalendarClock className="h-5 w-5 text-[#ff8c42]" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-ink">{course.sessions} {t('sessions')}</span>
              </div>

              <div className="mt-10 flex justify-end">
                <ArrowRevealButton label={t('enrollInCourse')} href="/parent-portal/register" />
              </div>
            </div>

            <VideoEmbed
              url={course.videoUrl}
              title={course.title}
              className="mb-[50px] max-w-md translate-x-[50px] justify-self-end"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
