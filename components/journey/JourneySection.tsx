'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { Lightbulb, Wrench, Box, Flame, Medal, Globe2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { icon: Lightbulb, title: 'Curiosity', copy: 'A kid asks "how does this work?" — and we hand them the tools to find out.' },
  { icon: Wrench, title: 'Skills', copy: 'Robotics, code, AI and 3D design, learned by doing rather than memorizing.' },
  { icon: Box, title: 'Creation', copy: 'Real projects take shape — prototypes, robots, apps, ideas worth showing off.' },
  { icon: Flame, title: 'Confidence', copy: 'Presenting, defending and improving their own work in front of a team.' },
  { icon: Medal, title: 'Competition', copy: 'Structured challenges raise the stakes and sharpen the work.' },
  { icon: Globe2, title: 'International Exposure', copy: 'Representing Tunisia on stages in Greece, Jordan and beyond.' },
];

export default function JourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.journey-line',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.6,
          },
        }
      );

      gsap.utils.toArray('.journey-step').forEach((step) => {
        const el = step as HTMLElement;
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="journey" ref={sectionRef} className="relative overflow-hidden px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-20 space-y-6 text-center">
          <span className="inline-flex rounded-full border border-ink/10 bg-ink/5 px-4 py-2 text-[0.7rem] uppercase tracking-[0.35em] text-stone">
            The BrainTrain journey
          </span>
          <h2 className="text-display font-display font-semibold leading-[0.9] text-ink sm:text-[clamp(3rem,6vw,5.5rem)]">
            Imagine what your child <span className="text-gradient">could become.</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-stone">
            Every BrainTrain student walks the same path — from a simple question to standing on an international stage.
          </p>
        </div>

        <div className="relative">
          <div className="journey-line absolute left-6 top-2 h-full w-px origin-top bg-gradient-to-b from-accent via-accent2 to-gold sm:left-8" />

          <div className="flex flex-col gap-14">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="journey-step relative flex gap-6 pl-0 sm:gap-8">
                  <div className="glass relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16">
                    <Icon className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
                  </div>
                  <div className="pt-1 sm:pt-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-stone">Step {index + 1}</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">{step.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-stone sm:text-base">{step.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
