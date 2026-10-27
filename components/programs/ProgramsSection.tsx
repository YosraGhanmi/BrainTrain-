'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import {
  X,
  Pin,
  CheckCircle2,
  TreePine,
  Ghost,
  Circle,
  Mic,
  Leaf,
  MoonStar,
  Dices,
  Scissors,
  Droplet,
  Sparkles,
  Star,
  Heart,
  Feather,
  Puzzle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { PROGRAM_KEYS, type ProgramCard, type ProgramKey } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

const decorativeIcons: { icon: LucideIcon; top: string; left: string; size: number; rotate: number }[] = [
  { icon: X, top: '6%', left: '8%', size: 28, rotate: -8 },
  { icon: Pin, top: '4%', left: '22%', size: 34, rotate: 6 },
  { icon: CheckCircle2, top: '8%', left: '42%', size: 30, rotate: 0 },
  { icon: TreePine, top: '10%', left: '62%', size: 32, rotate: 10 },
  { icon: Circle, top: '18%', left: '52%', size: 14, rotate: 0 },
  { icon: Ghost, top: '12%', left: '90%', size: 32, rotate: -6 },

  { icon: Mic, top: '26%', left: '18%', size: 28, rotate: -4 },
  { icon: Heart, top: '52%', left: '15%', size: 20, rotate: 10 },
  { icon: Dices, top: '72%', left: '20%', size: 30, rotate: -8 },

  { icon: Feather, top: '20%', left: '4%', size: 24, rotate: 10 },
  { icon: Puzzle, top: '44%', left: '6%', size: 26, rotate: -6 },
  { icon: Circle, top: '64%', left: '2%', size: 14, rotate: 0 },
  { icon: TreePine, top: '88%', left: '5%', size: 26, rotate: -10 },

  { icon: MoonStar, top: '24%', left: '81%', size: 28, rotate: -10 },
  { icon: Sparkles, top: '48%', left: '78%', size: 24, rotate: 12 },
  { icon: Star, top: '74%', left: '80%', size: 20, rotate: -8 },

  { icon: Scissors, top: '18%', left: '95%', size: 24, rotate: 8 },
  { icon: Droplet, top: '38%', left: '97%', size: 20, rotate: -12 },
  { icon: X, top: '60%', left: '94%', size: 22, rotate: 6 },
  { icon: Leaf, top: '84%', left: '96%', size: 24, rotate: 10 },
];

// One accent per card: the hero's blue and red, plus the site's orange for summer
const CARD_STYLE: Record<ProgramKey, { accent: string; href: string }> = {
  yearRound: { accent: '#7b91f4', href: '/courses' },
  summer: { accent: '#ff8c42', href: '/preinscription?program=summer' },
  competitions: { accent: '#ef4b4b', href: '/#stats' },
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
      className="relative overflow-hidden bg-[#0b1a3a] px-6 py-20 md:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0">
        {decorativeIcons.map(({ icon: Icon, top, left, size, rotate }, i) => (
          <Icon
            key={i}
            className="absolute text-white opacity-10"
            style={{
              top,
              left,
              width: size,
              height: size,
              transform: `rotate(${rotate}deg)`,
            }}
            strokeWidth={2}
          />
        ))}
      </div>

      <div className="relative">
        {/* Anchored to the section's left padding, not the centred column
            below: the one-line heading is wider than that column, so inside it
            it started a third of the way in and ran off the right edge. */}
        <h2 className="programs-heading text-display font-semibold leading-[0.9] text-white md:whitespace-nowrap sm:text-[clamp(2.5rem,5vw,5.5rem)]">
          {t('heading')}
        </h2>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
          {PROGRAM_KEYS.map((key) => {
            const { accent, href } = CARD_STYLE[key];
            return (
              <div key={key} className="program-card group relative transition duration-300 hover:-translate-y-1">
                <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_30px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition duration-300 group-hover:border-white/25 group-hover:bg-white/[0.09] md:p-10 lg:min-h-[27rem]">
                  <h3
                    className="mt-2 font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-5xl lg:text-4xl"
                    style={{ color: accent, textShadow: `0 0 40px ${accent}59` }}
                  >
                    {programs[key].title[locale] || programs[key].title.en}
                  </h3>
                  <p className="relative mb-8 mt-5 text-base leading-relaxed text-white/75 md:text-lg">
                    {programs[key].body[locale] || programs[key].body.en}
                  </p>

                  {/* White at rest, the card's accent on hover, where the arrow
                      swaps to a white disc so it still stands out */}
                  <Link
                    href={href}
                    style={{ '--accent': accent } as CSSProperties}
                    className="group/btn relative mt-auto inline-flex items-center gap-3 self-start rounded-full bg-white py-3 pl-6 pr-3 text-sm font-bold uppercase tracking-wide text-[#0b1a3a] transition-all duration-200 hover:gap-4 hover:bg-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t(key)}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-[var(--accent)]">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
