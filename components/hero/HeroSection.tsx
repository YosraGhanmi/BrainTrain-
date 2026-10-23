'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import TextMorph from '@/components/text/TextMorph';
import Typewriter from '@/components/text/Typewriter';
import InteractiveMesh from '@/components/hero/InteractiveMesh';
import OrbitBorderButton from '@/components/buttons/OrbitBorderButton';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';

// Three.js/react-three-fiber is a heavy bundle — load it only in the browser,
// off the critical rendering path, instead of shipping it in the main chunk.
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[2rem] bg-ink/5" />,
});

gsap.registerPlugin(ScrollTrigger);

// Each aurora glow used to be a solid disc under a huge CSS blur, which the
// GPU had to re-blur on every frame of its drift. These are the same
// Gaussian-blurred-disc falloffs, precomputed as gradient stops (alpha
// fraction at a fraction of the blurred extent), so the glows look the same
// but are painted once and only moved by the compositor afterwards.
type AuroraGlow = { rgb: string; alpha: number; extentPx: number; falloff: [number, number][] };

const AURORA_GLOWS: Record<'accent' | 'accent2' | 'gold', AuroraGlow> = {
  // 32rem disc, blur(120px)
  accent: {
    rgb: '61,127,255',
    alpha: 0.15,
    extentPx: 516,
    falloff: [[0, 0.897], [15, 0.848], [30, 0.699], [45, 0.476], [60, 0.252], [75, 0.099], [90, 0.028], [100, 0]],
  },
  // 28rem disc, blur(120px)
  accent2: {
    rgb: '108,92,231',
    alpha: 0.15,
    extentPx: 482,
    falloff: [[0, 0.825], [15, 0.77], [30, 0.617], [45, 0.409], [60, 0.215], [75, 0.087], [90, 0.026], [100, 0]],
  },
  // 24rem disc, blur(130px)
  gold: {
    rgb: '184,134,11',
    alpha: 0.1,
    extentPx: 467,
    falloff: [[0, 0.664], [15, 0.613], [30, 0.478], [45, 0.31], [60, 0.164], [75, 0.07], [90, 0.023], [100, 0]],
  },
};

function AuroraGlowFill({ glow }: { glow: AuroraGlow }) {
  const stops = glow.falloff.map(([at, a]) => `rgba(${glow.rgb},${+(glow.alpha * a).toFixed(4)}) ${at}%`).join(', ');
  const size = glow.extentPx * 2;
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: `radial-gradient(circle closest-side, ${stops})` }}
    />
  );
}

export default function HeroSection({ registerHref = '/courses' }: { registerHref?: string }) {
  const textRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations('hero');
  // The ambient drift and the scroll hint hold still once the hero is
  // scrolled away. Assumed on screen until observed, matching the SSR markup.
  const onScreen = useActiveWhileVisible(sectionRef, '0px', true);
  const ambientMotion = { animationPlayState: onScreen ? 'running' : 'paused' } as const;

  const robotBubbles = [
    {
      text: t('bubbleGreeting'),
      side: 'left' as const,
      top: '20%',
    },
    {
      prefix: t('bubblePrefix'),
      typed: t.raw('bubbleWords') as string[],
      side: 'right' as const,
      top: '36%',
    },
  ];

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
    <section ref={sectionRef} id="top" className="relative overflow-hidden px-6 pb-24 pt-32 md:px-10 lg:px-16">
      {/* Static dot-grid texture */}
      <div className="dot-grid pointer-events-none absolute inset-0 z-0" />

      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] animate-aurora" style={ambientMotion}>
          <AuroraGlowFill glow={AURORA_GLOWS.accent} />
        </div>
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] animate-aurora [animation-delay:-6s]" style={ambientMotion}>
          <AuroraGlowFill glow={AURORA_GLOWS.accent2} />
        </div>
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] animate-aurora [animation-delay:-11s]" style={ambientMotion}>
          <AuroraGlowFill glow={AURORA_GLOWS.gold} />
        </div>
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
                fontSize: 'clamp(2.75rem, 13vw, 7.5rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.08em',
                textAlign: 'left',
              }}
              transition={{
                duration: 0.4,
                delay: 2,
                ease: 'easeInOut',
              }}
              tag="h1"
            />
          </div>

          <div ref={textRef} className="max-w-xl space-y-8">
            <p className="text-lg leading-relaxed text-stone sm:text-xl">
              {t('lead')}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <OrbitBorderButton label={t('register')} href={registerHref} />
            </div>
          </div>
        </div>

        <div className="relative h-[300px] w-full max-w-3xl xs:h-[360px] sm:h-[440px] lg:h-[800px]">
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
                    ? `max-w-[230px] whitespace-normal text-balance ${
                        bubble.side === 'left'
                          ? 'left-[-8%] sm:left-[-14%] lg:left-[-20%]'
                          : 'right-[-8%] sm:right-[-14%] lg:right-[-20%]'
                      }`
                    : 'left-[58%] sm:left-[64%] lg:left-[68%] w-max max-w-[70vw] sm:max-w-[360px] lg:max-w-[420px] whitespace-nowrap'
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
        aria-label={t('scroll')}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.35em]">{t('scroll')}</span>
        <ArrowDown className="h-4 w-4 animate-bounce" style={ambientMotion} />
      </a>
    </section>
  );
}
