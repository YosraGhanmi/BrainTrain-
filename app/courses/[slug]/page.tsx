import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { getAgeGroup, getCoursesForAgeGroup } from '@/lib/coursesData';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const group = getAgeGroup(params.slug);
  return {
    title: group ? `${group.label} Courses — BrainTrain` : 'Courses — BrainTrain',
  };
}

export default function AgeGroupCoursesPage({ params }: { params: { slug: string } }) {
  const group = getAgeGroup(params.slug);
  if (!group) notFound();

  const groupCourses = getCoursesForAgeGroup(group);

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

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {group.label}
          </h1>

          <div className="mt-16 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {groupCourses.map(({ slug, title, icon: Icon, color }) => (
              <Link
                key={slug}
                href={`/course/${slug}?age=${group.slug}`}
                className="flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Icon className="h-12 w-12" style={{ color }} strokeWidth={1.75} />
                <h3 className="text-lg font-extrabold text-ink">{title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
