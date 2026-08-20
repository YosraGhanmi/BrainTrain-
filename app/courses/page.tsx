import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { ageGroups } from '@/lib/coursesData';

export const metadata: Metadata = {
  title: 'Courses by Age Group — BrainTrain',
  description: 'Explore BrainTrain courses grouped by age, from 4 to 18 years old.',
};

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <h1 className="whitespace-nowrap font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
              Pick an age group to see its courses.
            </h1>
            <svg
              aria-hidden
              viewBox="0 0 60 40"
              className="hidden h-9 w-14 shrink-0 text-[#ff8c42] sm:block"
              fill="none"
            >
              <path
                d="M2 6C14 2 24 14 18 22C12 30 24 34 30 26"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M22 22L30 26L26 34"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {ageGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.slug}
                  className="rounded-3xl bg-white p-8 shadow-sm"
                >
                  <Icon className="h-9 w-9 text-ink" strokeWidth={1.75} />
                  <h2 className="mt-6 text-xl font-semibold text-ink">
                    {group.label}
                  </h2>
                  <p className="mt-3 text-ink/70">{group.description}</p>
                  <Link
                    href={`/courses/${group.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 font-semibold text-ink underline underline-offset-4"
                  >
                    See courses
                    <ArrowRight className="h-4 w-4 text-[#ff8c42]" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
