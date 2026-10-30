import type { Metadata } from 'next';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import ContactSection from '@/components/contact/ContactSection';
import { readContent } from '@/lib/content/store';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 300;

const METADATA_BY_LOCALE: Record<string, Metadata> = {
  en: {
    title: 'Contact | BrainTrain',
    description: 'Questions about a programme or enrolment? Reach BrainTrain Academy in Sousse on WhatsApp, by phone, by email or with a message.',
  },
  fr: {
    title: 'Contact | BrainTrain',
    description: 'Une question sur un programme ou une inscription ? Contactez BrainTrain Academy à Sousse sur WhatsApp, par téléphone, par e-mail ou par message.',
  },
};

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const base = METADATA_BY_LOCALE[params.locale] ?? METADATA_BY_LOCALE.en;
  const url = absoluteUrl(params.locale, '/contact');
  return {
    ...base,
    alternates: { canonical: url, languages: localeAlternates('/contact') },
    openGraph: { title: base.title as string, description: base.description as string, url, type: 'website' },
  };
}

export default async function ContactPage() {
  const { contact } = await readContent();

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <Navbar />
      {/* pt clears the fixed navbar; the section brings its own bottom padding */}
      <main className="flex-1 pt-12">
        <ContactSection contact={contact} />
      </main>
      <Footer />
    </div>
  );
}
