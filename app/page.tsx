import Navbar from '@/components/navbar/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import PhilosophySection from '@/components/philosophy/PhilosophySection';
import CoursesSection from '@/components/courses/CoursesSection';
import StatsSection from '@/components/stats/StatsSection';
import ContactSection from '@/components/contact/ContactSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar />
      <main>
        <HeroSection />
        <PhilosophySection />
        <CoursesSection />
        <StatsSection />
        <ContactSection />
      </main>
    </div>
  );
}
