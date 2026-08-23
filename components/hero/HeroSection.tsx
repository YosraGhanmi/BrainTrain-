'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowDown } from 'lucide-react';
import TextMorph from '@/components/text/TextMorph';
import Typewriter from '@/components/text/Typewriter';
import InteractiveMesh from '@/components/hero/InteractiveMesh';
import OrbitBorderButton from '@/components/buttons/OrbitBorderButton';

// Three.js/react-three-fiber is a heavy bundle — load it only in the browser,
// off the critical rendering path, instead of shipping it in the main chunk.
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[2rem] bg-ink/5" />,
});

gsap.registerPlugin(ScrollTrigger);

const robotBubbles = [
  {
    text: "Hello! you're finally here!",
    side: 'left' as const,
    top: '20%',
  },
  {
    prefix: 'We transform kids into ',
    typed: ['entrepreneurs', 'innovators', 'problem solvers', "winners"],
    side: 'right' as const,
    top: '36%',
  },
];

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

      gsap.utils.toArray<HTMLElement>('.hero-bubble').forEach((bubble, i) => {
        const fromX = bubble.dataset.side === 'left' ? -24 : 24;
        gsap.fromTo(
          bubble,
          { opacity: 0, y: 16, x: fromX, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration: 0.7,
            ease: 'back.out(1.6)',
            delay: 1.8 + i * 0.9,
          }
        );
      });
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
              words="Brain,Train"
              color="#0f2d81"
              font={{
                fontFamily: 'var(--font-comfortaa)',
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
              <OrbitBorderButton label="Register your child" href="/register" />
            </div>
          </div>
        </div>

        <div className="relative h-[520px] w-full max-w-3xl lg:h-[800px]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
            <HeroScene />
          </div>

          <div className="pointer-events-none absolute inset-0">
            {robotBubbles.map((bubble, i) => (
              <div
                key={i}
                data-side={bubble.side}
                className={`hero-bubble absolute z-20 rounded-2xl border border-[#0b1a3a]/20 bg-white/95 px-4 py-3 text-sm font-medium leading-snug text-ink shadow-soft ${
                  'text' in bubble
                    ? `max-w-[210px] whitespace-normal ${
                        bubble.side === 'left'
                          ? 'left-[-8%] sm:left-[-14%] lg:left-[-20%]'
                          : 'right-[-8%] sm:right-[-14%] lg:right-[-20%]'
                      }`
                    : 'left-[58%] sm:left-[64%] lg:left-[68%] w-[220px] sm:w-[280px] lg:w-[320px] whitespace-nowrap'
                }`}
                style={{ top: bubble.top }}
              >
                {'text' in bubble ? (
                  bubble.text
                ) : (
                  <>
                    {bubble.prefix}
                    <Typewriter texts={bubble.typed} startDelay={2700} showCursor={false} />
                  </>
                )}
                <span
                  className={`absolute bottom-3 h-3 w-3 rotate-45 border-[#0b1a3a]/20 bg-white/95 ${
                    bubble.side === 'left' ? '-right-1 border-r border-t' : '-left-1 border-b border-l'
                  }`}
                />
              </div>
            ))}
          </div>
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
