'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useLocale, useTranslations } from 'next-intl';
import type { LocalizedString } from '@/lib/content/types';

gsap.registerPlugin(ScrollTrigger);

export default function QuickStats({ quickStats }: { quickStats: { value: number; label: LocalizedString }[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState(quickStats.map(() => 0));
  const locale = useLocale() as 'en' | 'fr';
  const t = useTranslations('stats');

  useEffect(() => {
    if (!sectionRef.current) return;

    const values = { ...quickStats.reduce((acc, _stat, index) => ({ ...acc, [index]: 0 }), {} as Record<number, number>) };

    const timeline = gsap.to(values, {
      duration: 1.9,
      ease: 'power2.out',
      overwrite: 'auto',
      paused: true,
      onUpdate() {
        setCounts(quickStats.map((_, index) => Math.round(values[index] ?? 0)));
      },
      ...quickStats.reduce((acc, stat, index) => ({ ...acc, [index]: stat.value }), {} as Record<string, number>),
    });

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => timeline.restart(true),
      onEnterBack: () => timeline.restart(true),
    });

    return () => {
      trigger.kill();
      timeline.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-20 md:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-display font-bold text-ink sm:text-5xl">{t('heading')}</h2>

        <div className="mt-16 grid grid-cols-3 gap-8">
          {quickStats.map((stat, index) => (
            <div key={stat.label.en}>
              <p className="font-display text-7xl font-extrabold leading-none text-[#0f2d81] sm:text-8xl">
                {counts[index]}
              </p>
              <p className="mt-4 text-lg font-bold text-ink sm:text-xl">{stat.label[locale] || stat.label.en}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
