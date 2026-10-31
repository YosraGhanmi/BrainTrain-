import Navbar from '@/components/navbar/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import PartnersSection from '@/components/partners/PartnersSection';
import QuickStats from '@/components/stats/QuickStats';
import ProgramsSection from '@/components/programs/ProgramsSection';
import StatsSection from '@/components/stats/StatsSection';
import MilestonesSection from '@/components/timeline/MilestonesSection';
import MethodSection from '@/components/method/MethodSection';
import ContactSection from '@/components/contact/ContactSection';
import Footer from '@/components/footer/Footer';
import { readContent } from '@/lib/content/store';
import { getRegisterHref } from '@/lib/preinscription/actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await readContent();
  const registerHref = await getRegisterHref();

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Navbar overHero />
      <main>
        <HeroSection registerHref={registerHref} video={content.heroVideo} text={content.heroText} />
        <ProgramsSection programs={content.programs} />
        <QuickStats quickStats={content.stats} />
        <StatsSection achievementsImages={content.achievementsImages} />
        <MilestonesSection milestones={content.timeline} />
        <MethodSection method={content.method} />
        <PartnersSection logos={content.sponsors} />
        <ContactSection contact={content.contact} />
      </main>
      <Footer />
    </div>
  );
}
