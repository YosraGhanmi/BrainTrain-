'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';
import { FIRST_PLACE_VIEWBOX, GLYPH_ONE, GLYPH_RE } from '@/components/palmares/firstPlaceGlyphs';

export type PalmaresHeroData = {
  // Words in *stars* show in gold
  heading: string;
  intro: string;
  captionTitle: string;
  // Line breaks are kept
  captionText: string;
  photos: string[];
};

const NAVY = '#0b1a3a';
const GOLD = '#f5c542';
// How long each photo stays in the letters
const SLIDE_MS = 5000;
// Where the bursts of sparks go off around the "1re", as fractions of its box
const SPARK_POINTS = [
  [0.18, 0.12],
  [0.55, 0.06],
  [0.88, 0.18],
  [0.62, 0.95],
  [0.05, 0.32],
  [0.95, 0.45],
];

// The outline of "1re" (French) or "1st". The big "1" and the French "re" are
// drawn outlines; "st" is set in the same font as text, which the browser can
// stroke and clip to just as well.
function Letters({ suffix, ...shape }: { suffix: 're' | 'st' } & React.SVGProps<SVGPathElement> & React.SVGProps<SVGTextElement>) {
  return (
    <>
      <path pathLength={1000} d={GLYPH_ONE} {...(shape as React.SVGProps<SVGPathElement>)} />
      {suffix === 're' ? (
        <path pathLength={1000} d={GLYPH_RE} {...(shape as React.SVGProps<SVGPathElement>)} />
      ) : (
        <text
          x="240"
          y="302"
          fontSize="205"
          fontWeight="800"
          letterSpacing="-4"
          style={{ fontFamily: 'var(--font-display)' }}
          {...(shape as React.SVGProps<SVGTextElement>)}
        >
          st
        </text>
      )}
    </>
  );
}

// "1re" filled with photos of the students and their trophies. Only this
// moves: the outline draws itself, the photos open inside the letters and
// cross-fade, a light runs round the edge, sparks go off around it, and the
// whole thing tilts towards the pointer. Reduced motion: one still photo.
function FirstPlace({ photos, label }: { photos: string[]; label: string }) {
  const suffix = useLocale() === 'fr' ? 're' : 'st';
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<HTMLDivElement>(null);
  const active = useActiveWhileVisible(boxRef, '0px', true);
  const [slide, setSlide] = useState(0);
  const animated = active && !reduce;

  useEffect(() => {
    if (!animated || photos.length < 2) return;
    const timer = window.setInterval(() => setSlide((i) => (i + 1) % photos.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [animated, photos.length]);

  // Tilt towards the pointer; with no pointer over the hero (or on a touch
  // screen) it sways gently on its own
  useEffect(() => {
    const box = boxRef.current;
    const tilt = tiltRef.current;
    const hero = box?.closest('section');
    if (!animated || !box || !tilt || !hero) return;

    const touch = window.matchMedia('(hover: none)').matches;
    // Where the pointer is over the hero, or null when it isn't
    let pointer: [number, number] | null = null;
    let x = 0;
    let y = 0;
    let frame = 0;
    const start = performance.now();
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      pointer = [clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 1.2)), clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 1.2))];
    };
    const onLeave = () => {
      pointer = null;
    };
    if (!touch) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
    }

    const loop = (now: number) => {
      const s = (now - start) / 1000;
      const [targetX, targetY] = touch
        ? [Math.sin(s * 0.9) * 0.7, Math.cos(s * 0.7) * 0.5]
        : (pointer ?? [Math.sin(s * 0.6) * 0.25, Math.cos(s * 0.5) * 0.18]);
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      tilt.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
      tilt.style.setProperty('--rx', `${(-y * 11).toFixed(2)}deg`);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, [animated]);

  // Bursts of gold sparks, each spark removed once it has faded
  useEffect(() => {
    const box = boxRef.current;
    const layer = sparksRef.current;
    if (!animated || !box || !layer) return;
    let burstIndex = 0;

    const burst = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      const [px, py] = SPARK_POINTS[burstIndex++ % SPARK_POINTS.length];
      for (let i = 0; i < 22; i++) {
        const spark = document.createElement('i');
        if (i % 3 === 0) spark.className = 'dot';
        spark.style.left = `${px * w}px`;
        spark.style.top = `${py * h}px`;
        layer.appendChild(spark);
        const angle = Math.random() * Math.PI * 2;
        const distance = (50 + Math.random() * 120) * (w / 470);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const scale = 0.6 + Math.random() * 1.1;
        const turn = Math.random() * 360;
        spark.animate(
          [
            { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(${scale}) rotate(${turn / 2}deg)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${dx}px,${dy + 18}px) scale(0) rotate(${turn}deg)`, opacity: 0 },
          ],
          { duration: 1900 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.3,1)' }
        ).onfinish = () => spark.remove();
      }
    };

    // The first burst waits for the outline to finish drawing
    let interval = 0;
    const first = window.setTimeout(() => {
      burst();
      interval = window.setInterval(burst, 2200);
    }, 1900);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      layer.replaceChildren();
    };
  }, [animated]);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={label}
      className="palmares-first relative aspect-[470/490] w-[300px] [perspective:1100px] sm:w-[380px] xl:w-[470px]"
    >
      <div
        ref={tiltRef}
        className="absolute inset-0 will-change-transform [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
      >
        {/* Behind: the gold outline, set back and slightly offset so the
            photo layer in front reads as raised */}
        <svg viewBox={FIRST_PLACE_VIEWBOX} aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible [transform:translateZ(-40px)_scale(1.04)]">
          <defs>
            <filter id="palmares-first-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(26 20)">
            <Letters suffix={suffix} className="palmares-first-draw" fill="none" stroke={GOLD} strokeWidth="3.5" strokeLinejoin="round" />
            <g filter="url(#palmares-first-glow)">
              <Letters suffix={suffix} className="palmares-first-run" fill="none" stroke="#fff4c2" strokeWidth="4" strokeLinecap="round" />
              <Letters suffix={suffix} className="palmares-first-run palmares-first-run-2" fill="none" stroke="#ffd65a" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>
        </svg>

        {/* In front: the photos, cut to the letters */}
        <svg
          viewBox={FIRST_PLACE_VIEWBOX}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-visible [filter:drop-shadow(0_24px_40px_rgba(0,0,0,0.45))] [transform:translateZ(40px)]"
        >
          <defs>
            <clipPath id="palmares-first-letters">
              <Letters suffix={suffix} />
            </clipPath>
            <linearGradient id="palmares-first-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".45" stopColor="#fff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
              <stop offset=".55" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="palmares-first-tint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={NAVY} stopOpacity="0" />
              <stop offset="1" stopColor={NAVY} stopOpacity=".35" />
            </linearGradient>
            <mask id="palmares-first-reveal" maskUnits="userSpaceOnUse" x="-50" y="100" width="600" height="600">
              <circle className="palmares-first-iris" cx="180" cy="420" r="420" fill="#fff" />
            </mask>
          </defs>
          <g clipPath="url(#palmares-first-letters)">
            <g mask="url(#palmares-first-reveal)">
              <rect x="-30" y="110" width="530" height="560" fill="#13265a" />
              {photos.map((src, i) => (
                <image
                  key={src}
                  href={src}
                  x="-30"
                  y="110"
                  width="530"
                  height="560"
                  preserveAspectRatio="xMidYMid slice"
                  className={`palmares-first-slide ${i === slide ? 'is-on' : ''}`}
                />
              ))}
              <rect x="-30" y="110" width="530" height="560" fill="url(#palmares-first-tint)" />
              <rect className="palmares-first-sheen" x="-560" y="60" width="560" height="660" fill="url(#palmares-first-sheen)" transform="skewX(-18)" />
            </g>
          </g>
          <Letters suffix={suffix} className="palmares-first-edge" fill="none" stroke="rgba(255,229,138,.55)" strokeWidth="1.5" />
        </svg>

        <div ref={sparksRef} className="palmares-first-sparks pointer-events-none absolute inset-0 [transform:translateZ(80px)]" />
      </div>
    </div>
  );
}

// The top of the Palmarès page. The text is still; only the "1re" moves.
export default function PalmaresHero({ data }: { data: PalmaresHeroData }) {
  const t = useTranslations('palmares');

  return (
    <section
      className="relative isolate overflow-x-clip px-6 pb-24 pt-28 text-white md:px-10 lg:flex lg:min-h-[720px] lg:items-center lg:px-16 lg:pb-28 lg:pt-32"
      style={{ backgroundColor: NAVY }}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
        {/* On phones the "1re" comes first, then its caption, then the title */}
        <div className="order-2 lg:order-1">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-[38px] rounded-full bg-[#e8303a]" />
            <span className="h-1.5 w-[38px] rounded-full bg-white" />
            <span className="h-1.5 w-[38px] rounded-full" style={{ backgroundColor: GOLD }} />
          </div>
          <p className="mt-6 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.32em]" style={{ color: GOLD }}>
            <span className="h-0.5 w-7 rounded-full bg-current" aria-hidden="true" />
            {t('eyebrow')}
          </p>
          <h1 className="mt-4 max-w-[720px] text-balance font-display text-[2.4rem] font-extrabold leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">
            {data.heading.split(/\*(.+?)\*/).map((part, i) =>
              i % 2 === 1 ? (
                <span key={i} style={{ color: GOLD }}>
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-white/75 sm:text-[1.05rem]">{data.intro}</p>
        </div>

        <div className="order-1 lg:order-2">
          <FirstPlace photos={data.photos} label={t('firstPlaceAlt')} />
          {data.captionTitle || data.captionText ? (
            <p className="mt-6 text-sm leading-normal text-white/75 lg:mt-2 lg:text-right">
              {data.captionTitle ? (
                <strong className="block font-display text-[1.4rem] font-extrabold" style={{ color: GOLD }}>
                  {data.captionTitle}
                </strong>
              ) : null}
              <span className="whitespace-pre-line">{data.captionText}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Wavy bottom edge into the awards section (same colour as its top),
          mirroring the footer's top */}
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full translate-y-px sm:h-12 lg:h-14">
        <path d="M0 30 C180 0 360 60 540 30 S900 0 1080 30 S1260 60 1440 30 V60 H0 Z" fill="#eef0ff" />
      </svg>
    </section>
  );
}
