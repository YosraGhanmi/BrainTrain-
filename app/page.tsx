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

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar />
      <main>
        <HeroImageTransition />
        <PartnersSection />
        <PhilosophySection />
        <QuickStats />
        <CoursesSection />
        <StatsSection />
        <MilestonesSection />
        <ValuesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
