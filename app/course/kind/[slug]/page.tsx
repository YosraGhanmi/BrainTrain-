import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarClock } from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { getCourseKind, getAgeGroup } from '@/lib/coursesData';
import { getIcon } from '@/lib/content/icons';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const kind = getCourseKind(params.slug);
  return {
    title: kind ? `${kind.title} — BrainTrain` : 'Course — BrainTrain',
  };
}

export default function CourseKindPage({ params }: { params: { slug: string } }) {
  const kind = getCourseKind(params.slug);
  if (!kind) notFound();

  const Icon = getIcon(kind.icon);

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
            All age groups
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
            {kind.title} is taught differently for every age group — its own content, pace and session count. Pick an
            age group below to see the details.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kind.variants.map((variant) => {
              const group = getAgeGroup(variant.ageGroupSlug);
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
                      {variant.sessions} sessions
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
