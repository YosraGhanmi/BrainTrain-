import type { Metadata } from 'next';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PalmaresView, { type PalmaresViewData } from '@/components/palmares/PalmaresView';
import { readContent } from '@/lib/content/store';
import type { LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';
import { SITE_NAME, SITE_URL, absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

const PATH = '/palmares';

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await props.params;
  const { palmares } = await readContent();
  const title = palmares.seoTitle[locale] || palmares.seoTitle.en;
  const description = palmares.seoDescription[locale] || palmares.seoDescription.en;
  const url = absoluteUrl(locale, PATH);
  const image = palmares.photos[0]?.src;
  return {
    title,
    description,
    alternates: { canonical: url, languages: localeAlternates(PATH) },
    openGraph: { title, description, url, type: 'website', siteName: SITE_NAME, ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  };
}

// "1re place – Prix" -> place + prize, with the rank for the medal colour.
// A line with no " – " (or " - ") is a note, e.g. a qualification.
function parseAward(line: string) {
  const match = /^(.+?)\s+[–—-]\s+(.+)$/.exec(line);
  if (!match) return { place: '', prize: line, rank: null };
  const rank = Number(/^\s*(\d+)/.exec(match[1])?.[1]);
  return { place: match[1], prize: match[2], rank: rank >= 1 && rank <= 3 ? rank : null };
}

export default async function PalmaresPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await props.params;
  const { palmares } = await readContent();
  const text = (value: LocalizedString) => value[locale] || value.en;

  const data: PalmaresViewData = {
    heading: text(palmares.heading),
    intro: text(palmares.intro),
    awardsEyebrow: text(palmares.awardsEyebrow),
    awardsHeading: text(palmares.awardsHeading),
    awardsIntro: text(palmares.awardsIntro),
    // Competitions waiting for their results stay hidden
    competitions: palmares.competitions
      .map((c) => ({
        title: text(c.title),
        intro: text(c.intro),
        awards: c.awards.map(text).filter(Boolean).map(parseAward),
        image: c.image,
        imageAlt: text(c.imageAlt),
      }))
      .filter((c) => c.title && c.awards.length > 0),
    videosHeading: text(palmares.videosHeading),
    videos: palmares.videos
      .map((v) => ({ title: text(v.title), highlight: text(v.highlight), description: text(v.description), url: v.url, image: v.image }))
      .filter((v) => v.title && v.url),
    mediaHeading: text(palmares.mediaHeading),
    mediaIntro: text(palmares.mediaIntro),
    media: palmares.media
      .map((m) => ({ name: text(m.name), badge: text(m.badge), description: text(m.description), url: m.url, image: m.image, logo: m.logo }))
      .filter((m) => m.name && m.url),
    statsHeading: text(palmares.statsHeading),
    stats: palmares.stats.map((s) => ({ value: s.value, label: text(s.label) })).filter((s) => s.label),
    photos: palmares.photos.map((p) => ({ src: p.src, alt: text(p.alt) })),
  };

  // The awards as a list Google can read, tied to the organization in the
  // site-wide structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: text(palmares.seoTitle),
    description: text(palmares.seoDescription),
    url: absoluteUrl(locale, PATH),
    about: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      award: data.competitions.flatMap((c) =>
        c.awards.filter((a) => a.place).map((a) => `${a.place}: ${a.prize} (${c.title})`)
      ),
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* The page opens on the dark hero, like the home page's video */}
      <Navbar overHero />
      <main className="flex-1">
        <PalmaresView data={data} />
      </main>
      <Footer />
    </div>
  );
}
