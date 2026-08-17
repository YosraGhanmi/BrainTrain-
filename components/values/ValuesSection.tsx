'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight, Puzzle, Search, Sparkles, Target, Trophy, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const values = [
  { label: 'Curiosity', Icon: Search },
  { label: 'Innovation', Icon: Sparkles },
  { label: 'Problem Solving', Icon: Puzzle },
  { label: 'Collaboration', Icon: Users },
  { label: 'Excellence', Icon: Trophy },
  { label: 'Impact', Icon: Target },
];

export default function ValuesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.values-intro',
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
        '.value-card',
        { opacity: 0, y: 40, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
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
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0b1a3a] px-6 py-24 md:px-10 lg:px-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 0.6px, transparent 0.6px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-[130px]" />

      <div className="relative">
        <div className="values-intro flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
          <div className="flex flex-col items-start gap-5">
            <h2 className="font-display text-4xl font-semibold leading-[0.95] text-white sm:text-5xl">
              Our Values &amp; Mission
            </h2>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent2"
            >
              Join BrainTrain Academy
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="max-w-4xl text-lg leading-relaxed text-white/80 sm:text-xl">
            At <span className="font-semibold text-white">BrainTrain</span>, we believe young minds learn best when
            they <span className="font-semibold text-white">explore, create, and take on real challenges</span>. We
            give children the tools, confidence, and freedom to turn curiosity into skills, ideas into projects, and
            challenges into opportunities.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {values.map(({ label, Icon }) => (
            <div
              key={label}
              className="value-card flex flex-col items-center gap-4 rounded-2xl bg-white/10 p-6 text-center transition hover:bg-white/15"
            >
              <Icon className="h-9 w-9 text-white" strokeWidth={1.5} />
              <div>
                <p className="font-display text-lg font-semibold text-white">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
