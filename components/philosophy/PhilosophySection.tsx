'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const words = [
  { word: 'LEARN', caption: 'By exploring, questioning and getting hands-on from day one.' },
  { word: 'BUILD', caption: 'Real robots, real code, real prototypes — not worksheets.' },
  { word: 'COMPETE', caption: 'Teams train with strategy, deadlines and real stakes.' },
  { word: 'WIN', caption: '19 trophies. 3 international victories. And counting.' },
];

export default function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !stageRef.current) return;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.philosophy-word') as HTMLElement[];

      gsap.set(panels, { opacity: 0, y: 50, scale: 0.92 });
      gsap.set(panels[0], { opacity: 1, y: 0, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${panels.length * 90}%`,
          scrub: 0.6,
          pin: stageRef.current,
          anticipatePin: 1,
        },
      });

      panels.forEach((panel, index) => {
        if (index === 0) return;
        tl.to(panels[index - 1], { opacity: 0, y: -50, scale: 0.92, duration: 0.5 })
          .fromTo(panel, { opacity: 0, y: 50, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, '<');
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="philosophy" ref={sectionRef} className="relative overflow-hidden px-6 md:px-10 lg:px-16">
      <div ref={stageRef} className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center py-28">
        <div className="mb-14 space-y-6">
          <span className="inline-flex rounded-full border border-ink/10 bg-ink/5 px-4 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-stone">
            Philosophy &amp; approach
          </span>
          <h2 className="max-w-3xl text-display font-display font-semibold leading-[0.9] text-ink">
            LEARNING ISN&apos;T ABOUT MEMORIZING. <span className="text-gradient">IT&apos;S ABOUT BUILDING.</span>
          </h2>
        </div>

        <div className="relative h-[260px] sm:h-[300px]">
          {words.map((item) => (
            <div key={item.word} className="philosophy-word absolute inset-0 flex flex-col justify-center gap-4">
              <p className="text-7xl font-display font-semibold uppercase tracking-[-0.08em] text-ink sm:text-[clamp(4.5rem,10vw,8rem)]">
                {item.word}
              </p>
              <p className="max-w-lg text-base text-stone sm:text-lg">{item.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
