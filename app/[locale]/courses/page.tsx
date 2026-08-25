import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import AgeGroupCoverflow from '@/components/carousel/AgeGroupCoverflow';
import { readContent } from '@/lib/content/store';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const METADATA_BY_LOCALE: Record<string, Metadata> = {
  en: {
    title: 'Courses by Age Group — BrainTrain',
    description: 'Explore BrainTrain courses grouped by age, from 4 to 18 years old.',
  },
  fr: {
    title: 'Cours par tranche d\'âge — BrainTrain',
    description: 'Découvrez les cours BrainTrain regroupés par âge, de 4 à 18 ans.',
  },
};

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
}

export default async function CoursesPage({ params }: { params: { locale: AppLocale } }) {
  // Icons must stay raw string names here (not resolved LucideIcon
  // components) — AgeGroupCoverflow is a client component and a resolved
  // component reference can't cross the server/client boundary as a prop.
  const ageGroups = readContent().ageGroups.map((g) => ({
    slug: g.slug,
    label: g.label[params.locale] || g.label.en,
    description: g.description[params.locale] || g.description.en,
    icon: g.icon,
    image: g.image,
  }));
  const t = await getTranslations({ locale: params.locale, namespace: 'courses' });

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="whitespace-nowrap font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {t('pickAgeGroup')}
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
