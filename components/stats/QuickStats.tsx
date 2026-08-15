'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const quickStats = [
  { value: 7, label: 'Courses' },
  { value: 1500, label: 'Students' },
  { value: 19, label: 'Trophies' },
];

export default function QuickStats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState(quickStats.map(() => 0));

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
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-display font-bold text-ink sm:text-4xl">Statistics</h2>

        <div className="mt-12 grid grid-cols-3 gap-8">
          {quickStats.map((stat, index) => (
            <div key={stat.label}>
              <p className="font-display text-5xl font-extrabold leading-none text-[#0f2d81] sm:text-6xl">
                {counts[index]}
              </p>
              <p className="mt-3 text-base font-bold text-ink sm:text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
