'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowDown, ArrowRight } from 'lucide-react';
import HeroScene from '@/components/3d/HeroScene';
import TextMorph from '@/components/text/TextMorph';
import InteractiveMesh from '@/components/hero/InteractiveMesh';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (textRef.current) {
        tl.fromTo(
          textRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9 },
          0
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" className="relative overflow-hidden px-6 pb-24 pt-32 md:px-10 lg:px-16">
      {/* Static dot-grid texture */}
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" />

      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-accent/15 blur-[120px] animate-aurora" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent2/15 blur-[120px] animate-aurora [animation-delay:-6s]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-gold/10 blur-[130px] animate-aurora [animation-delay:-11s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(255,255,255,0.4)_60%,_#ffffff_100%)]" />
      </div>

      {/* Interactive mesh — sits above the aurora wash so the hover glow stays visible */}
      <InteractiveMesh />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center gap-14 pt-8 lg:flex-row lg:items-center lg:gap-16">
        <div className="relative z-10 flex w-full max-w-2xl -translate-y-6 flex-col gap-2 lg:-translate-y-16">
          <div className="h-auto w-full max-w-2xl">
            <TextMorph
              words="BRAIN,TRAIN"
              color="#0f2d81"
              font={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 120,
                lineHeight: '1.1',
                letterSpacing: '-0.08em',
                textAlign: 'left',
              }}
              transition={{
                duration: 0.4,
                delay: 2,
                ease: 'easeInOut',
              }}
              tag="div"
            />
          </div>

          <div ref={textRef} className="max-w-xl space-y-8">
            <p className="text-lg leading-relaxed text-stone sm:text-xl">
              We are a future-skills academy where students turn technology, AI, and entrepreneurship into real-world innovation.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="/join"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-bg shadow-glow transition hover:scale-[1.02] hover:bg-accent"
              >
                Join us
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-ink transition hover:text-accent"
              >
                Register your child
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="relative h-[520px] w-full max-w-3xl overflow-hidden rounded-[2rem] lg:h-[800px]">
          <HeroScene />
        </div>
      </div>

      <a
        href="#philosophy"
        className="relative z-10 mx-auto mt-4 flex w-fit flex-col items-center gap-2 text-stone transition hover:text-ink"
        aria-label="Scroll to explore"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.35em]">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
}
