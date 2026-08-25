import Navbar from '@/components/navbar/Navbar';
import HeroImageTransition from '@/components/hero/HeroImageTransition';
import PartnersSection from '@/components/partners/PartnersSection';
import PhilosophySection from '@/components/philosophy/PhilosophySection';
import QuickStats from '@/components/stats/QuickStats';
import CoursesSection from '@/components/courses/CoursesSection';
import StatsSection from '@/components/stats/StatsSection';
import MilestonesSection from '@/components/timeline/MilestonesSection';
import ValuesSection from '@/components/values/ValuesSection';
import ContactSection from '@/components/contact/ContactSection';
import Footer from '@/components/footer/Footer';
import { readContent } from '@/lib/content/store';
import { getCourseKinds } from '@/lib/coursesData';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default function Home({ params }: { params: { locale: AppLocale } }) {
  const content = readContent();

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar />
      <main>
        <HeroImageTransition />
        <PartnersSection logos={content.sponsors} />
        <PhilosophySection />
        <QuickStats quickStats={content.stats} />
        <CoursesSection
          courses={getCourseKinds(params.locale).map(({ slug, title, icon, color }) => ({ slug, title, icon, color }))}
        />
        <StatsSection achievementsImages={content.achievementsImages} />
        <MilestonesSection milestones={content.timeline} />
        <ValuesSection />
        <ContactSection contact={content.contact} />
      </main>
      <Footer />
    </div>
  );
}
