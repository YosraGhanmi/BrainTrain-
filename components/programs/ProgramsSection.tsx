'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import DoodleBackdrop from '@/components/effects/DoodleBackdrop';
import { PROGRAM_KEYS, type LocalizedString, type ProgramCard, type ProgramKey } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

// One accent per card: the hero's blue and red, the site's orange for summer
// and a teal for events. The light shade fills the badge and the button's
// arrow; titles on the white card take the deep one (the logo's own blue and
// red), since the light shades are too pale to read as text on white.
const CARD_STYLE: Record<ProgramKey, { accent: string; deep: string; href: string }> = {
  yearRound: { accent: '#7b91f4', deep: '#283880', href: '/courses' },
  summer: { accent: '#ff8c42', deep: '#d9560f', href: '/preinscription?program=summer' },
  competitions: { accent: '#ef4b4b', deep: '#c83030', href: '/#stats' },
  events: { accent: '#2ec4b6', deep: '#0f7f74', href: '/#timeline' },
};

gsap.registerPlugin(ScrollTrigger);

export default function ProgramsSection({ programs }: { programs: Record<ProgramKey, ProgramCard> }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('programs');
  const locale = useLocale() as AppLocale;

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.programs-heading',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.program-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          // Hand the transform back to CSS so the hover lift still works
          clearProps: 'transform',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="programs"
      ref={sectionRef}
      className="relative overflow-hidden bg-surface px-6 py-20 md:px-10 lg:px-16"
    >
      <DoodleBackdrop />

      <div className="relative">
        {/* Anchored to the section's left padding, not the centred column
            below: the one-line heading is wider than that column, so inside it
            it started a third of the way in and ran off the right edge. */}
        <h2 className="programs-heading text-display font-semibold leading-[0.9] text-[#0b1a3a] md:whitespace-nowrap sm:text-[clamp(2.5rem,5vw,5.5rem)]">
          {t('heading')}
        </h2>

        <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PROGRAM_KEYS.map((key) => {
            const { accent, deep, href } = CARD_STYLE[key];
            const card = programs[key];
            const text = (value: LocalizedString) => value[locale] || value.en;
            return (
              <div
                key={key}
                className="program-card group relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 focus-within:-translate-y-2"
              >
                {/* A faint navy outline and soft navy shadow set the white card
                    off the light section. On hover (or when its button has
                    focus) the card lifts, the shadow deepens and the outline
                    takes the card's colour. Both shadows have the same two
                    layers so the change animates smoothly. */}
                <article
                  style={{ '--accent': accent } as CSSProperties}
                  className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-[#0b1a3a]/[0.07] bg-white text-[#0b1a3a] shadow-[0_2px_4px_rgba(11,26,58,0.05),0_18px_40px_-14px_rgba(11,26,58,0.20)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:border-[color:var(--accent)] group-focus-within:shadow-[0_4px_8px_rgba(11,26,58,0.06),0_34px_60px_-18px_rgba(11,26,58,0.34)] group-hover:border-[color:var(--accent)] group-hover:shadow-[0_4px_8px_rgba(11,26,58,0.06),0_34px_60px_-18px_rgba(11,26,58,0.34)]"
                >
                  <div className="p-3 pb-0">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-[#0b1a3a]/5">
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, 90vw"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                      />
                      {text(card.badge) ? (
                        <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#0b1a3a] shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                          {text(card.badge)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <h3 className="font-display text-2xl font-extrabold leading-[1.05] tracking-tight" style={{ color: deep }}>
                      {text(card.title)}
                    </h3>
                    {text(card.subtitle) ? (
                      <p className="mt-1 text-sm font-semibold text-[#0b1a3a]/55">{text(card.subtitle)}</p>
                    ) : null}
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-[#0b1a3a]/75">{text(card.body)}</p>

                    <div className="mt-auto pt-5">
                      {text(card.details) ? (
                        <div className="mb-5 border-t border-[#0b1a3a]/10 pt-4">
                          {text(card.detailsLabel) ? (
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[#0b1a3a]/50">
                              {text(card.detailsLabel)}
                            </p>
                          ) : null}
                          <p className="mt-1.5 text-sm font-semibold leading-snug text-[#0b1a3a]/80">{text(card.details)}</p>
                        </div>
                      ) : null}

                      {/* Navy on the white card, the card's accent on hover, where
                          the arrow swaps to a white disc so it still stands out */}
                      <Link
                        href={href}
                        className="group/btn relative inline-flex items-center gap-3 self-start rounded-full bg-[#0b1a3a] py-2.5 pl-5 pr-2.5 text-[0.8rem] font-bold uppercase tracking-wide text-white transition-all duration-200 hover:gap-4 hover:bg-[var(--accent)] hover:text-[#0b1a3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]"
                      >
                        {t(key)}
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-[var(--accent)]">
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
