import Navbar from '@/components/navbar/Navbar';
import HeroSection from '@/components/hero/HeroSection';
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
import { getRegisterHref } from '@/lib/preinscription/actions';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function Home(props: { params: Promise<{ locale: AppLocale }> }) {
  const params = await props.params;
  const [content, courseKinds] = await Promise.all([readContent(), getCourseKinds(params.locale)]);
  const registerHref = await getRegisterHref();

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar overHero />
      <main>
        <HeroSection registerHref={registerHref} video={content.heroVideo} text={content.heroText} />
        <PhilosophySection />
        <QuickStats quickStats={content.stats} />
        <CoursesSection
          courses={courseKinds.map(({ slug, title, icon, color }) => ({ slug, title, icon, color }))}
        />
        <StatsSection achievementsImages={content.achievementsImages} />
        <MilestonesSection milestones={content.timeline} />
        <PartnersSection logos={content.sponsors} />
        <ValuesSection />
        <ContactSection contact={content.contact} />
      </main>
      <Footer />
    </div>
  );
}
