import type { Metadata } from 'next';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import AboutSection from '@/components/about/AboutSection';
import { readContent } from '@/lib/content/store';
import { getRegisterHref } from '@/lib/preinscription/actions';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

const METADATA_BY_LOCALE: Record<string, Metadata> = {
  en: {
    title: 'About us | BrainTrain',
    description: 'Founded in Sousse in October 2023, BrainTrain is a multidisciplinary academy for ages 4 to 18 where curiosity becomes skill, from real projects to international competitions.',
  },
  fr: {
    title: 'À propos | BrainTrain',
    description: 'Créée à Sousse en octobre 2023, BrainTrain est une académie pluridisciplinaire pour les 4 à 18 ans où la curiosité devient compétence, des projets concrets aux compétitions internationales.',
  },
};

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const base = METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
  const url = absoluteUrl(params.locale, '/about');
  return {
    ...base,
    alternates: { canonical: url, languages: localeAlternates('/about') },
    openGraph: { title: base.title as string, description: base.description as string, url, type: 'website' },
  };
}

export default async function AboutPage() {
  const { about } = await readContent();
  const registerHref = await getRegisterHref();

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      {/* pt clears the fixed navbar; the section brings its own bottom padding */}
      <main className="flex-1 pt-12">
        <AboutSection about={about} registerHref={registerHref} />
      </main>
      <Footer />
    </div>
  );
}
