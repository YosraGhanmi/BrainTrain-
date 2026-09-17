import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Atom,
  BookOpen,
  Bot,
  CircuitBoard,
  Code2,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Puzzle,
  Rocket,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import PreinscriptionForm from '@/components/preinscription/PreinscriptionForm';
import { submitPreinscription } from '@/lib/preinscription/actions';
import type { AppLocale } from '@/i18n/routing';
import { absoluteUrl, localeAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const params = await props.params;
  const title = params.locale === 'fr' ? 'Preinscription | BrainTrain' : 'Pre-registration | BrainTrain';
  const description =
    params.locale === 'fr'
      ? "Remplissez le formulaire de preinscription BrainTrain pour votre enfant."
      : 'Fill out the BrainTrain pre-registration form for your child.';
  const url = absoluteUrl(params.locale, '/preinscription');
  return {
    title,
    description,
    alternates: { canonical: url, languages: localeAlternates('/preinscription') },
    openGraph: { title, description, url, type: 'website' },
  };
}

export default async function PreinscriptionPage(
  props: {
    params: Promise<{ locale: AppLocale }>;
    searchParams: Promise<{ sent?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const isFr = params.locale === 'fr';
  const backgroundIcons = [
    { Icon: Atom, className: 'left-[5%] top-[18%] rotate-[-18deg]' },
    { Icon: Bot, className: 'left-[18%] top-[42%] rotate-[12deg]' },
    { Icon: Code2, className: 'left-[6%] top-[72%] rotate-[8deg]' },
    { Icon: Rocket, className: 'left-[28%] top-[14%] rotate-[-12deg]' },
    { Icon: Puzzle, className: 'left-[35%] top-[78%] rotate-[16deg]' },
    { Icon: CircuitBoard, className: 'right-[7%] top-[17%] rotate-[15deg]' },
    { Icon: Lightbulb, className: 'right-[20%] top-[40%] rotate-[-14deg]' },
    { Icon: FlaskConical, className: 'right-[6%] top-[70%] rotate-[10deg]' },
    { Icon: GraduationCap, className: 'right-[30%] top-[12%] rotate-[-8deg]' },
    { Icon: BookOpen, className: 'right-[34%] top-[80%] rotate-[12deg]' },
    { Icon: Sparkles, className: 'left-[48%] top-[7%] rotate-[-10deg]' },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface text-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(61,127,255,0.08),transparent_42%)]" />
        {backgroundIcons.map(({ Icon, className }, index) => (
          <Icon
            key={index}
            aria-hidden="true"
            strokeWidth={1.5}
            className={`absolute h-10 w-10 text-[#0b1a3a]/10 sm:h-14 sm:w-14 ${className}`}
          />
        ))}
      </div>
      <Navbar />
      <main className="relative z-10 flex flex-1 px-6 pb-24 pt-32 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-3xl">
          {searchParams.sent ? (
            <section className="mt-6 rounded-[2rem] border border-ink/10 bg-white px-6 py-12 text-center shadow-soft md:px-12 md:py-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Sparkles className="h-8 w-8" aria-hidden="true" />
              </div>
              <h1 className="mt-7 font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
                {isFr ? 'Bienvenue chez les heros de BrainTrain !' : 'Welcome to the BrainTrain heroes!'}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone md:text-lg">
                {isFr
                  ? 'Votre demande a bien ete envoyee. Notre equipe vous contactera tres bientot.'
                  : 'Your request has been sent. Our team will contact you very soon.'}
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={`/${params.locale}/preinscription`} className="rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent">
                  {isFr ? 'Inscrire un autre enfant' : 'Register another child'}
                </Link>
                <Link href={`/${params.locale}`} className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:border-accent hover:text-accent">
                  {isFr ? 'Retour au site' : 'Back to website'}
                </Link>
              </div>
            </section>
          ) : (
            <>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
                {isFr ? 'Inscrire votre enfant' : 'Register your child'}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone md:text-lg">
                {isFr
                  ? "Laissez-nous les informations essentielles, et l'equipe BrainTrain vous contactera pour finaliser l'inscription."
                  : 'Leave the essential information, and the BrainTrain team will contact you to finalize registration.'}
              </p>

              {searchParams.error ? (
                <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {isFr ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.'}
                </p>
              ) : null}

              <PreinscriptionForm locale={params.locale} isFr={isFr} submitAction={submitPreinscription} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
