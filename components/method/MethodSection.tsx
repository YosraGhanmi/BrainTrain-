'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { LocalizedString, MethodContent } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

gsap.registerPlugin(ScrollTrigger);

// Each card's number tile, in turn: the site's blue, the programme cards'
// orange and red, then the navy of the dark sections
const TILE_COLORS = ['#3d7fff', '#ff8c42', '#ef4b4b', '#0b1a3a'];

export default function MethodSection({ method }: { method: MethodContent }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('method');
  const locale = useLocale() as AppLocale;
  const text = (value: LocalizedString) => value[locale] || value.en;

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.method-intro',
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
        '.method-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
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
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0b1a3a] px-6 py-24 md:px-10 lg:px-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 0.6px, transparent 0.6px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        <h2 className="method-intro text-center font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-6xl">
          {text(method.heading)}
        </h2>

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {method.steps.map((step, i) => {
            const color = TILE_COLORS[i % TILE_COLORS.length];
            return (
              <li
                key={i}
                className="method-card flex flex-col items-center rounded-[2rem] bg-white px-7 py-10 text-center shadow-[0_30px_60px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1"
              >
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-2xl font-extrabold text-white"
                  style={{ backgroundColor: color, boxShadow: `0 10px 24px ${color}40` }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-7 font-display text-xl font-extrabold leading-tight text-[#0b1a3a]">{text(step.title)}</h3>
                <p className="mt-3 text-base leading-relaxed text-[#0b1a3a]/60">{text(step.body)}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 flex justify-center">
          <Link
            href="/parent-portal/login"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent2"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
