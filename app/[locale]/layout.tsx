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
import { routing } from '@/i18n/routing';
import '../globals.css';

export const dynamic = 'force-dynamic';

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

const METADATA_BY_LOCALE: Record<string, Metadata> = {
  en: {
    title: 'BrainTrain — Don\'t Just Prepare For The Future. Build It.',
    description: 'BrainTrain is a Tunisian academy where curious kids become creators — robotics, AI, 3D design and entrepreneurship, built through real projects and international competitions.',
  },
  fr: {
    title: 'BrainTrain — Ne vous contentez pas de préparer l\'avenir. Construisez-le.',
    description: 'BrainTrain est une académie tunisienne où des enfants curieux deviennent des créateurs — robotique, IA, design 3D et entrepreneuriat, à travers des projets concrets et des compétitions internationales.',
  },
};

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
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
  const { socials } = readContent();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${comfortaa.variable}`}>
      <body className="bg-bg text-ink antialiased">
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
