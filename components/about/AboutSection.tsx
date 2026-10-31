'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FlipGallery from '@/components/about/FlipGallery';
import type { AboutContent, LocalizedString } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

gsap.registerPlugin(ScrollTrigger);

// The highlighter strokes, taking the logo's colours in turn
const HIGHLIGHTS = [
  'bg-[linear-gradient(transparent_58%,rgba(61,127,255,0.22)_58%,rgba(61,127,255,0.22)_90%,transparent_90%)]',
  'bg-[linear-gradient(transparent_58%,rgba(239,75,75,0.2)_58%,rgba(239,75,75,0.2)_90%,transparent_90%)]',
];

// Words wrapped in *stars* get a soft highlighter stroke under them,
// alternating blue and red. `offset` carries the alternation on from the
// previous block, so it runs through the whole story.
function Highlighted({ text, className, offset = 0 }: { text: string; className: string; offset?: number }) {
  return (
    <>
      {text.split(/\*(.+?)\*/).map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className={`${className} ${HIGHLIGHTS[(offset + (i - 1) / 2) % HIGHLIGHTS.length]} [box-decoration-break:clone] [-webkit-box-decoration-break:clone]`}
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

const starCount = (text: string) => text.split(/\*(.+?)\*/).length >> 1;

// The "À propos" page: a flip gallery that opens like a curtain beside the
// academy's story, told paragraph by paragraph like a film's title cards.
export default function AboutSection({ about, registerHref }: { about: AboutContent; registerHref: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('about');
  const tHero = useTranslations('hero');
  const locale = useLocale() as AppLocale;
  const text = (value: LocalizedString) => value[locale] || value.en;
  const paragraphs = text(about.story)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const eyebrow = text(about.eyebrow);
  const closing = text(about.closing);
  const heading = text(about.heading);
  // Where each paragraph's highlights start in the blue/red alternation,
  // carrying on after the heading's
  const counts = [starCount(heading), ...paragraphs.map(starCount)];
  const offsets = paragraphs.map((_, i) => counts.slice(0, i + 1).reduce((sum, n) => sum + n, 0));

  useEffect(() => {
    if (!sectionRef.current) return;
    const mm = gsap.matchMedia(sectionRef);

    // Motion only for visitors who haven't asked their system to reduce it;
    // everyone else sees the finished layout straight away
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // The gallery opens from the bottom like a curtain. The clip is
      // removed afterwards: it would otherwise cut off the card's corners
      // when it tilts or flips past the frame.
      gsap.fromTo(
        '.about-frame',
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath' }
      );

      gsap.fromTo(
        '.about-title',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', stagger: 0.15, delay: 0.3 }
      );

      // Each paragraph comes into focus as it scrolls in, like a title card
      gsap.utils.toArray<HTMLElement>('.about-scene').forEach((scene) => {
        gsap.fromTo(
          scene,
          { opacity: 0, y: 28, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: scene, start: 'top 88%', once: true },
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-20 md:px-10 lg:px-16 lg:py-28">
      {/* Stacked on phones and tablets (gallery on top, both in a readable
          column), side by side in two equal halves from small PCs up */}
      <div className="mx-auto grid max-w-2xl items-start gap-12 lg:max-w-7xl lg:grid-cols-2 lg:gap-12 xl:gap-20">
        {/* The gallery, sticky beside the story on large screens */}
        <div className="relative lg:sticky lg:top-28">
          <div className="about-frame relative z-10">
            <FlipGallery images={about.images} label={t('gallery')} />
          </div>
        </div>

        <div>
          {eyebrow ? (
            <p className="about-title flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#c83030]">
              <span aria-hidden="true" className="h-px w-10 bg-[#ef4b4b]" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="about-title mt-5 text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b1a3a] sm:text-5xl xl:text-6xl">
            <Highlighted text={heading} className="" />
          </h1>

          <div className="mt-8 space-y-6 sm:mt-10">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`about-scene ${i === 0 ? 'text-lg leading-relaxed text-[#0b1a3a] sm:text-xl xl:text-2xl' : 'text-base leading-relaxed text-[#0b1a3a]/70 sm:text-lg'}`}
              >
                <Highlighted text={p} offset={offsets[i]} className="font-semibold text-[#0b1a3a]" />
              </p>
            ))}
          </div>

          {closing ? (
            <p className="about-scene mt-10 flex items-start gap-4 font-display text-lg font-extrabold leading-snug text-[#0b1a3a] sm:text-2xl">
              <span aria-hidden="true" className="mt-[0.65em] h-1 w-10 shrink-0 rounded-full bg-[#ef4b4b]" />
              {closing}
            </p>
          ) : null}

          {/* The key facts beside the sign-up button; stacked on phones */}
          <div className="about-scene mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <dl className="grid flex-1 grid-cols-2 divide-x divide-[#0b1a3a]/10 rounded-[1.5rem] border-2 border-[#0b1a3a]/[0.07] bg-white py-5 shadow-[0_18px_40px_-14px_rgba(11,26,58,0.20)] sm:py-6">
              {about.facts.map((fact, i) => (
                <div key={i} className="flex flex-col-reverse items-center px-2 text-center sm:px-3">
                  <dt className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#0b1a3a]/50 sm:text-xs sm:tracking-[0.25em]">{text(fact.label)}</dt>
                  <dd className="font-display text-lg font-extrabold text-[#0b1a3a] sm:text-2xl xl:text-3xl">{text(fact.value)}</dd>
                </div>
              ))}
            </dl>
            {/* Same label and destination as the hero's button */}
            <Link
              href={registerHref}
              className="group/btn inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#0b1a3a] py-3.5 pl-7 pr-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-200 hover:gap-4 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]"
            >
              {tHero('register')}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4b4b] transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-accent">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
