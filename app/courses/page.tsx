import type { Metadata } from 'next';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import AgeGroupCoverflow from '@/components/carousel/AgeGroupCoverflow';
import { readContent } from '@/lib/content/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Courses by Age Group — BrainTrain',
  description: 'Explore BrainTrain courses grouped by age, from 4 to 18 years old.',
};

export default function CoursesPage() {
  const { ageGroups } = readContent();

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="whitespace-nowrap font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Pick an age group to see its courses.
          </h1>

          <div className="mt-16">
            <AgeGroupCoverflow ageGroups={ageGroups} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
