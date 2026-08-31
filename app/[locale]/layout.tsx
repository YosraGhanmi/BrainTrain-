import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import localFont from 'next/font/local';
import SmoothScroll from '@/components/providers/SmoothScroll';
import StringTuneProvider from '@/components/providers/StringTuneProvider';
import SocialSidebar from '@/components/social/SocialSidebar';
import AdminShortcut from '@/components/admin/AdminShortcut';
import { readContent } from '@/lib/content/store';
import { routing, type AppLocale } from '@/i18n/routing';
import { SITE_URL, absoluteUrl, localeAlternates } from '@/lib/seo';
import '../globals.css';

// Content is admin-editable at runtime, but ISR + on-demand revalidation
// (lib/admin/actions.ts calls revalidatePath on every save) keeps this cache
// fresh without paying a filesystem read + full render on every request.
export const revalidate = 300;

// Self-hosted (not next/font/google) — fetching from Google's font CDN during
// compilation was intermittently timing out on this network and crashing the
// dev/build worker process ("Jest worker encountered child process
// exceptions"). These are the same variable-font files Google would have
// served, just bundled locally so compilation has no network dependency.
const display = localFont({
  src: '../../fonts/baloo2/Baloo2-Variable.woff2',
  weight: '600 800',
  variable: '--font-display',
  display: 'swap',
});

const comfortaa = localFont({
  src: '../../fonts/comfortaa/Comfortaa-Variable.woff2',
  weight: '600 700',
  variable: '--font-comfortaa',
  display: 'swap',
});

const body = localFont({
  src: '../../fonts/space-grotesk/SpaceGrotesk-Variable.woff2',
  weight: '500 700',
  variable: '--font-body',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const METADATA_BY_LOCALE: Record<string, { tagline: string; description: string }> = {
  en: {
    tagline: 'BrainTrain — Don\'t Just Prepare For The Future. Build It.',
    description: 'BrainTrain is a Tunisian academy where curious kids become creators — robotics, AI, 3D design and entrepreneurship, built through real projects and international competitions.',
  },
  fr: {
    tagline: 'BrainTrain — Ne vous contentez pas de préparer l\'avenir. Construisez-le.',
    description: 'BrainTrain est une académie tunisienne où des enfants curieux deviennent des créateurs — robotique, IA, design 3D et entrepreneuriat, à travers des projets concrets et des compétitions internationales.',
  },
};

export function generateMetadata({ params }: { params: { locale: AppLocale } }): Metadata {
  const base = METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
  const url = absoluteUrl(params.locale);
  return {
    // Keep the browser tab / window title short — the full tagline still
    // shows up in social share previews (openGraph/twitter) below.
    title: 'BrainTrain',
    description: base.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: localeAlternates(),
    },
    openGraph: {
      title: base.tagline,
      description: base.description,
      url,
      siteName: 'BrainTrain',
      locale: params.locale,
      type: 'website',
      images: ['/ID BRAINTRAIN.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: base.tagline,
      description: base.description,
      images: ['/ID BRAINTRAIN.png'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const { socials, contact } = readContent();

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'BrainTrain',
    url: SITE_URL,
    logo: `${SITE_URL}/ID BRAINTRAIN.png`,
    email: contact.email.value,
    telephone: contact.phone.value,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.location.value,
    },
    sameAs: socials.map((s) => s.href),
  };

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${comfortaa.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <StringTuneProvider />
          <AdminShortcut />
          <SocialSidebar socials={socials} />
          <SmoothScroll>{children}</SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
