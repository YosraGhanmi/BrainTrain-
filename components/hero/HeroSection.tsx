'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useReducedMotion } from 'framer-motion';
import { ArrowDown, Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import OrbitBorderButton from '@/components/buttons/OrbitBorderButton';
import VideoModal from '@/components/hero/VideoModal';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';
import type { HeroText, HeroVideo } from '@/lib/content/types';

// The logo's blue (#283880) and red (#c83030), lifted so they still read on
// the darkened video, where the logo's own navy would disappear
const ACCENTS = ['#7b91f4', '#ef4b4b'];

// One line per line break; *starred* words take the accents in turn
function Headline({ text }: { text: string }) {
  let accent = 0;
  return (
    <h1 className="font-display text-[clamp(1.8rem,6vw,4.4rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
      {text.split('\n').map((line, i) => (
        <span key={i} className="block">
          {line.split(/\*(.+?)\*/).map((part, j) =>
            j % 2 === 1 ? (
              <span key={j} style={{ color: ACCENTS[accent++ % ACCENTS.length] }}>
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      ))}
    </h1>
  );
}

export default function HeroSection({
  registerHref = '/courses',
  video,
  text,
}: {
  registerHref?: string;
  video: HeroVideo;
  text: HeroText;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watching, setWatching] = useState(false);
  const t = useTranslations('hero');
  const locale = useLocale() as keyof HeroText['headline'];
  // The video and the scroll hint hold still once the hero is scrolled away.
  // Assumed on screen until observed, matching the SSR markup.
  const onScreen = useActiveWhileVisible(sectionRef, '0px', true);
  const reducedMotion = useReducedMotion();
  const ambientMotion = { animationPlayState: onScreen ? 'running' : 'paused' } as const;

  // Played from here rather than with `autoPlay`, so it can pause off screen
  // (and while the popup plays it with sound), and never starts for
  // reduced-motion visitors (they keep the poster). `muted` is set on the
  // element too: React doesn't render the attribute, and browsers only
  // autoplay video they know is muted.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    if (onScreen && !reducedMotion && !watching) {
      el.play().catch(() => {
        // Autoplay refused (e.g. data saver): the poster stays up instead
      });
    } else {
      el.pause();
    }
  }, [onScreen, reducedMotion, watching, video.src]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(textRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="top" className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink">
      <video
        ref={videoRef}
        key={video.src}
        src={video.src}
        poster={video.poster || undefined}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Shade the top for the transparent navbar and the bottom for the
          headline: the footage is bright, white text needs a dark backing */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 sm:pb-24 xl:px-8">
        <div ref={textRef} className="max-w-5xl">
          <Headline text={text.headline[locale]} />
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{text.lead[locale]}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <OrbitBorderButton label={t('register')} href={registerHref} fill="#ffffff" textColor="#0b1a3a" size="lg" cornerRadius={12} />
            <button
              type="button"
              onClick={() => setWatching(true)}
              className="inline-flex items-center gap-3 rounded-xl border border-white/45 bg-white/10 py-3.5 pl-4 pr-6 text-sm font-bold sm:pr-7 sm:text-base uppercase tracking-[0.2em] text-white transition hover:border-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b1a3a]">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
              {t('watchVideo')}
            </button>
          </div>
        </div>
      </div>

      <a
        href="#philosophy"
        className="absolute bottom-10 right-6 z-10 hidden flex-col items-center gap-2 text-white/70 transition hover:text-white sm:flex xl:right-8"
        aria-label={t('scroll')}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.35em]">{t('scroll')}</span>
        <ArrowDown className="h-4 w-4 animate-bounce" style={ambientMotion} />
      </a>

      <VideoModal
        open={watching}
        onClose={() => setWatching(false)}
        src={video.src}
        poster={video.poster}
        closeLabel={t('closeVideo')}
      />
    </section>
  );
}
