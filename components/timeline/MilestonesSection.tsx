'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { CalendarDays } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const NAVY = '#0b1a3a';

const milestones = [
  {
    date: 'October 2023',
    title: 'BrainTrain is Founded',
    logo: true,
    summary: 'A Tunisian academy opens its doors with one idea: let kids learn by building.',
    detail:
      'BrainTrain launches in Tunisia as a multidisciplinary academy for young minds, built around robotics, programming, AI, 3D design and entrepreneurship, learned hands-on rather than from a textbook.',
  },
  {
    date: '2025',
    title: 'FIRST® LEGO® League World Competition',
    logo: false,
    summary: 'Barely two years in, BrainTrain students take the international stage.',
    detail:
      'BrainTrain proudly represents Tunisia at the FIRST® LEGO® League 2025 world competition, putting robots and ideas built in Tunisian classrooms up against teams from around the globe.',
  },
  {
    date: 'December 2025',
    title: 'Arab Championship — 3 Prizes',
    logo: false,
    summary: 'The season closes with three wins at the Arab level.',
    detail:
      'At the Arab competition in December 2025, BrainTrain students win 3 prizes at the Arab level, adding another chapter to a young academy already competing far beyond its size.',
  },
];

export default function MilestonesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.milestone-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.6,
          },
        }
      );

      gsap.utils.toArray('.milestone-node').forEach((node, index) => {
        const el = node as HTMLElement;
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-gold/10 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="relative">
          {/* year row + connecting line + dots */}
          <div className="hidden sm:grid sm:grid-cols-3">
            {milestones.map((milestone, index) => (
              <div key={milestone.date} className="flex flex-col items-center gap-3">
                <span className="inline-flex items-center gap-2 text-lg font-display font-bold text-ink">
                  <CalendarDays className="h-4 w-4" style={{ color: NAVY }} />
                  {milestone.date}
                </span>
                <span className="h-8 w-px bg-ink/15" />
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className="h-4 w-4 rounded-full border-4 bg-white transition"
                  style={{ borderColor: active === index ? NAVY : 'rgba(11,12,16,0.15)' }}
                  aria-label={`Show ${milestone.title}`}
                />
              </div>
            ))}
          </div>

          <div className="milestone-line absolute left-0 top-[3.1rem] hidden h-px w-full origin-left bg-ink/10 sm:block" />

          <div className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-6">
            {milestones.map((milestone, index) => {
              const isActive = active === index;
              return (
                <button
                  key={milestone.title}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`milestone-node relative rounded-2xl border bg-white p-6 ${
                    milestone.logo ? 'pt-10' : ''
                  } text-left shadow-soft transition ${isActive ? 'border-ink/20' : 'border-ink/5'}`}
                  style={isActive ? { boxShadow: `0 0 0 2px ${NAVY}` } : undefined}
                >
                  {milestone.logo ? (
                    <span className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white shadow-md">
                      <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" width={28} height={28} className="object-contain" />
                    </span>
                  ) : null}

                  <p className="text-xs uppercase tracking-[0.3em] text-stone sm:hidden">{milestone.date}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-ink sm:mt-0 sm:text-2xl">
                    {milestone.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-stone">
                    {isActive ? milestone.detail : milestone.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
