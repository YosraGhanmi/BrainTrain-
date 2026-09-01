import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarClock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { Link } from '@/i18n/navigation';
import { getCourseKind, getAgeGroup, getCourseKinds } from '@/lib/coursesData';
import { getIcon } from '@/lib/content/icons';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

export function generateStaticParams() {
  // Kind slugs are derived from the English title (see coursesData.ts), so
  // they're the same regardless of which locale generates the list.
  return getCourseKinds('en').map((kind) => ({ slug: kind.slug }));
}

export function generateMetadata({ params }: { params: { slug: string; locale: AppLocale } }): Metadata {
  const kind = getCourseKind(params.slug, params.locale);
  if (!kind) return { title: 'Course | BrainTrain' };

  const title = `${kind.title} | BrainTrain`;
  const path = `/course/kind/${params.slug}`;
  const url = absoluteUrl(params.locale, path);

  return {
    title,
    alternates: { canonical: url, languages: localeAlternates(path) },
    openGraph: { title, url, type: 'website' },
  };
}

export default async function CourseKindPage({ params }: { params: { slug: string; locale: AppLocale } }) {
  const kind = getCourseKind(params.slug, params.locale);
  if (!kind) notFound();

  const Icon = getIcon(kind.icon);
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/courses"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('allAgeGroups')}
          </Link>

          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Icon className="h-8 w-8" style={{ color: kind.color }} strokeWidth={1.75} />
            </span>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {kind.title}
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone">
            {kind.title} {t('kindIntro')}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kind.variants.map((variant) => {
              const group = getAgeGroup(variant.ageGroupSlug, params.locale);
              return (
                <Link
                  key={variant.slug}
                  href={`/course/${variant.slug}?age=${variant.ageGroupSlug}`}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">{group?.label ?? variant.ageGroupSlug}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone">{variant.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                      <CalendarClock className="h-4 w-4 text-[#ff8c42]" strokeWidth={1.75} />
                      {variant.sessions} {t('sessions')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-stone transition group-hover:translate-x-1 group-hover:text-ink" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
