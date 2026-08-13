'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Trophy } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { label: 'TROPHIES WON', value: 19, suffix: '', caption: 'Across national and international competitions.' },
  { label: 'INTERNATIONAL VICTORIES', value: 3, suffix: '×', caption: 'Global wins carrying the Tunisian flag.' },
  { label: 'STUDENT AGE RANGE', value: 6, suffix: '–18', caption: 'Curious minds, every stage of growing up.' },
];

const countries = ['Greece', 'Jordan'];

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    if (!sectionRef.current) return;

    const values = { ...stats.reduce((acc, _stat, index) => ({ ...acc, [index]: 0 }), {} as Record<number, number>) };

    const timeline = gsap.to(values, {
      duration: 1.9,
      ease: 'power2.out',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
      },
      onUpdate() {
        setCounts(stats.map((_, index) => Math.round(values[index] ?? 0)));
      },
      ...stats.reduce((acc, stat, index) => ({ ...acc, [index]: stat.value }), {} as Record<string, number>),
    });

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <section id="stats" ref={sectionRef} className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-gold/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-gold">
            <Trophy className="h-3.5 w-3.5" />
            Proof, not promises
          </span>
          <h2 className="text-display font-display font-semibold leading-[0.9] text-ink sm:text-[clamp(3.5rem,6vw,6rem)]">
            Results that show up <span className="text-gradient-gold">on the world stage.</span>
          </h2>
          <p className="text-lg leading-relaxed text-stone sm:text-xl">
            BrainTrain students don&apos;t just finish courses — they represent Tunisia at international competitions
            and come home with trophies to prove it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className="glass group rounded-[1.75rem] p-8 transition hover:border-gold/30 hover:shadow-goldglow">
              <p className="text-xs uppercase tracking-[0.3em] text-stone">{stat.label}</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="font-display text-6xl font-semibold leading-none text-ink sm:text-7xl">
                  {counts[index]}
                </span>
                <span className="font-display text-3xl font-semibold text-ink">{stat.suffix}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone">{stat.caption}</p>
            </div>
          ))}
        </div>

        <div className="glass mt-6 flex flex-col items-start gap-5 rounded-[1.75rem] p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone">On the international stage</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              BrainTrain teams have competed abroad, representing Tunisia in:
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {countries.map((country) => (
              <span
                key={country}
                className="rounded-full border border-ink/10 bg-ink/5 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-ink"
              >
                {country}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
