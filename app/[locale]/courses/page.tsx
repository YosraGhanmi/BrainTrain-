import type { Metadata } from 'next';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import AgeGroupCoverflow from '@/components/carousel/AgeGroupCoverflow';
import CoursesStory, { type PathStep } from '@/components/courses/CoursesStory';
import { readContent } from '@/lib/content/store';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

const METADATA_BY_LOCALE: Record<string, Metadata> = {
  en: {
    title: 'Courses by Age Group | Braintrain Academy',
    description: 'Explore Braintrain Academy courses grouped by age, from 4 to 18 years old.',
  },
  fr: {
    title: 'Cours par tranche d\'âge | Braintrain Academy',
    description: 'Découvrez les cours Braintrain Academy regroupés par âge, de 4 à 18 ans.',
  },
};

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const base = METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
  const url = absoluteUrl(params.locale, '/courses');
  return {
    ...base,
    alternates: { canonical: url, languages: localeAlternates('/courses') },
    openGraph: { title: base.title as string, description: base.description as string, url, type: 'website' },
  };
}

export default async function CoursesPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const params = await props.params;
  const locale = params.locale;
  const content = await readContent();
  const text = (value: { en: string; fr: string }) => value[locale] || value.en;
  // Icons must stay raw string names here (not resolved LucideIcon
  // components): AgeGroupCoverflow is a client component and a resolved
  // component reference can't cross the server/client boundary as a prop.
  const ageGroups = content.ageGroups.map((g) => ({
    slug: g.slug,
    label: text(g.label),
    stage: text(g.stage),
    description: text(g.description),
    icon: g.icon,
    image: g.image,
  }));

  // The path: one step per age group, with its text for parents (or, left
  // empty, the age group's description)
  const story = content.coursesStory;
  const steps: PathStep[] = ageGroups.map((g) => {
    const pitch = story.pathPitches[g.slug];
    return { ...g, description: (pitch && text(pitch)) || g.description };
  });

  const pickHeading = text(story.pickHeading);
  const pickIntro = text(story.pickIntro);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1">
        <CoursesStory story={story} steps={steps} locale={locale} />

        {/* 6. The picker */}
        <section id="choisir" className="scroll-mt-24 px-6 pb-24 pt-20 md:px-10 lg:px-16 lg:pt-28">
          <div className="mx-auto max-w-6xl">
            {pickHeading ? (
              <h2 className="text-center font-display text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">{pickHeading}</h2>
            ) : null}
            {pickIntro ? <p className="mt-4 text-center text-lg text-stone">{pickIntro}</p> : null}

            <div className="mt-14">
              <AgeGroupCoverflow ageGroups={ageGroups} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
