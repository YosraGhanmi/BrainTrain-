import Navbar from '@/components/navbar/Navbar';
import HeroImageTransition from '@/components/hero/HeroImageTransition';
import PhilosophySection from '@/components/philosophy/PhilosophySection';
import QuickStats from '@/components/stats/QuickStats';
import CoursesSection from '@/components/courses/CoursesSection';
import StatsSection from '@/components/stats/StatsSection';
import ContactSection from '@/components/contact/ContactSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar />
      <main>
        <HeroImageTransition />
        <PhilosophySection />
        <QuickStats />
        <CoursesSection />
        <StatsSection />
        <ContactSection />
      </main>
    </div>
  );
}
