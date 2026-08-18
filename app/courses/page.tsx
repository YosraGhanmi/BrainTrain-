import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
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

          <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {ageGroups.map((group) => (
              <Link
                key={group.slug}
                href={`/courses/${group.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-ink/10 bg-[#eaf2ff] shadow-sm"
              >
                <Image
                  src={group.image}
                  alt={group.label}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover opacity-0 transition duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
                />
                <span className="absolute inset-0 flex items-center justify-center text-center text-xl font-extrabold text-accent transition duration-300 group-hover:opacity-0 sm:text-2xl">
                  {group.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
