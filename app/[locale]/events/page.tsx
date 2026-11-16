import { jsonLdScript } from '@/lib/json-ld';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import EventsView, { type EventsViewData } from '@/components/events/EventsView';
import { readContent } from '@/lib/content/store';
import type { LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';
import { SITE_NAME, SITE_URL, absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

const PATH = '/events';

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await props.params;
  const { events } = await readContent();
  const title = events.seoTitle[locale] || events.seoTitle.en;
  const description = events.seoDescription[locale] || events.seoDescription.en;
  const url = absoluteUrl(locale, PATH);
  const image = events.upcoming.image || events.events.find((e) => e.poster)?.poster;
  return {
    title,
    description,
    alternates: { canonical: url, languages: localeAlternates(PATH) },
    openGraph: { title, description, url, type: 'website', siteName: SITE_NAME, ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  };
}

// Blank-line separated paragraphs
const paragraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

// "Name | Role": the role is optional
function parseSpeaker(line: string) {
  const [name, ...role] = line.split('|');
  return { name: name.trim(), role: role.join('|').trim() };
}

export default async function EventsPage(props: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await props.params;
  const { events } = await readContent();
  const t = await getTranslations({ locale, namespace: 'eventsPage' });
  const text = (value: LocalizedString) => value[locale] || value.en;

  const up = events.upcoming;
  const data: EventsViewData = {
    eyebrow: text(events.mastheadTagline),
    heading: text(events.mastheadTitle),
    intro: text(events.intro),
    heroImages: events.heroImages,
    // No title: the block is hidden
    upcoming: text(up.title)
      ? {
          eyebrow: text(up.eyebrow),
          title: text(up.title),
          tagline: text(up.tagline),
          paragraphs: paragraphs(text(up.text)),
          dateLabel: text(up.dateLabel),
          image: up.image,
          imageAlt: text(up.imageAlt),
          facebookUrl: up.facebookUrl,
          videoFile: up.videoFile,
          poster: up.poster,
          portrait: up.portrait,
        }
      : null,
    stories: events.events
      .filter((e) => text(e.title))
      .map((e) => ({
        id: e.id,
        kicker: text(e.kicker),
        title: text(e.title),
        date: text(e.date),
        standfirst: text(e.standfirst),
        paragraphs: paragraphs(text(e.body)),
        speakers: e.speakers.map(text).filter(Boolean).map(parseSpeaker),
        facebookUrl: e.facebookUrl,
        videoFile: e.videoFile,
        poster: e.poster,
        portrait: e.portrait,
        postUrl: e.postUrl,
      })),
    labels: {
      playVideo: t('playVideo'),
      closeVideo: t('closeVideo'),
      galleryLabel: t('heroAlt'),
      zoomPhoto: t('zoomPhoto'),
      viewPost: t('viewPost'),
      speakers: t('speakers'),
    },
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: text(events.seoTitle),
    description: text(events.seoDescription),
    url: absoluteUrl(locale, PATH),
    isPartOf: { '@type': 'WebSite', url: SITE_URL, name: SITE_NAME },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.stories.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'CreativeWork', name: s.title, description: s.standfirst || undefined, publisher: { '@id': `${SITE_URL}/#organization` } },
      })),
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <Navbar overHero lightLogo />
      <main className="flex-1">
        <EventsView data={data} />
      </main>
      <Footer />
    </div>
  );
}
