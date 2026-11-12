'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Landmark, Mic, Newspaper, Plane, Play, Star, Tv } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BrickDecor, Laurel, TrophyPodium } from '@/components/palmares/AwardsArt';
import { Link } from '@/i18n/navigation';

export type PalmaresAward = { place: string; prize: string; rank: number | null };

export type PalmaresViewData = {
  heading: string;
  intro: string;
  awardsEyebrow: string;
  awardsHeading: string;
  awardsIntro: string;
  competitions: { title: string; intro: string; awards: PalmaresAward[]; image: string; imageAlt: string }[];
  videosHeading: string;
  videos: { title: string; highlight: string; description: string; url: string; image: string }[];
  mediaHeading: string;
  mediaIntro: string;
  media: { name: string; badge: string; description: string; url: string; image: string; logo: boolean }[];
  statsHeading: string;
  stats: { value: number; label: string }[];
  photos: { src: string; alt: string }[];
};

const NAVY = '#0b1a3a';
const EASE = [0.22, 1, 0.36, 1] as const;

// Gold, silver, bronze, each on a ribbon in one of the site's colours;
// anything else gets the site blue. light/mid/dark shade the metal disc.
type MedalLook = { light: string; mid: string; dark: string; text: string; ribbon: string; ribbonDark: string; glow: string };
const MEDALS: Record<number, MedalLook> = {
  1: { light: '#fff3b0', mid: '#f5c542', dark: '#a8740a', text: '#6b4500', ribbon: '#3d5bd9', ribbonDark: '#243c9e', glow: 'rgba(245,197,66,0.55)' },
  2: { light: '#ffffff', mid: '#d3d9e3', dark: '#7d8696', text: '#343b49', ribbon: '#ef4b4b', ribbonDark: '#b52a2a', glow: 'rgba(160,172,190,0.5)' },
  3: { light: '#ffd9b8', mid: '#e3955c', dark: '#8f4a1c', text: '#4a2306', ribbon: '#2ec4b6', ribbonDark: '#178f84', glow: 'rgba(227,149,92,0.5)' },
};
const OTHER_MEDAL: MedalLook = { light: '#dfe7ff', mid: '#7b91f4', dark: '#2f4fd6', text: '#ffffff', ribbon: '#ff8c42', ribbonDark: '#d9560f', glow: 'rgba(61,127,255,0.4)' };

const MEDIA_ICONS = [Mic, Landmark, Newspaper, Tv];

// The gold separator above the footer: four gentle swells across the page
const GOLD_WAVE = 'M0 20 C120 2 240 38 360 20 S600 2 720 20 S960 38 1080 20 S1320 2 1440 20';

// Stage lights hung along the top of the hero, each swinging on its own
// rhythm (the negative delays start them mid-swing, out of step)
const BEAMS = [
  { position: '6%', color: '#7b91f4', width: 'w-72', animation: 'animate-[palmares-beam-left_11s_ease-in-out_infinite]', delay: '0s' },
  { position: '28%', color: '#ffffff', width: 'w-44', animation: 'animate-[palmares-beam-left_8s_ease-in-out_infinite]', delay: '-3s' },
  { position: '72%', color: '#ffe58a', width: 'w-44', animation: 'animate-[palmares-beam-right_9s_ease-in-out_infinite]', delay: '-5s' },
  { position: '94%', color: '#f5c542', width: 'w-72', animation: 'animate-[palmares-beam-right_13s_ease-in-out_infinite]', delay: '-1s' },
];

// Sparkle positions in the hero, fixed so server and client render the same
const SPARKLES = [
  { top: '14%', left: '8%', size: 3, delay: 0 },
  { top: '22%', left: '86%', size: 4, delay: 1.2 },
  { top: '38%', left: '18%', size: 2, delay: 2.1 },
  { top: '64%', left: '92%', size: 3, delay: 0.6 },
  { top: '72%', left: '6%', size: 4, delay: 1.8 },
  { top: '12%', left: '58%', size: 2, delay: 2.6 },
  { top: '50%', left: '74%', size: 2, delay: 0.3 },
  { top: '82%', left: '38%', size: 3, delay: 1.5 },
  { top: '30%', left: '44%', size: 2, delay: 3 },
  { top: '58%', left: '28%', size: 3, delay: 2.4 },
];

// True once the image has failed to load, so it can be hidden. An image that
// fails before hydration fires onError before the component has mounted, and
// setting state then makes React warn, so early errors are ignored and the
// mount effect reads the image's own state instead.
function useBrokenImage() {
  const ref = useRef<HTMLImageElement>(null);
  const mounted = useRef(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    mounted.current = true;
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  const onError = () => {
    if (mounted.current) setBroken(true);
  };

  return { ref, broken, onError };
}

// A soft light that follows the pointer across a card
function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onPointerMove = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };
  return { ref, onPointerMove };
}

const spotlightLayer =
  'pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(420px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),var(--spot-color,rgba(61,127,255,0.12)),transparent_70%)]';

function SectionHeading({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`text-balance font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl ${light ? 'text-white' : 'text-[#0b1a3a]'}`}
    >
      {children}
    </motion.h2>
  );
}

function Hero({ heading, intro }: { heading: string; intro: string }) {
  const t = useTranslations('palmares');
  const reduce = useReducedMotion();
  const words = heading.split(' ');

  return (
    <section className="relative isolate overflow-x-clip px-6 pb-36 pt-44 text-white md:px-10 lg:px-16 lg:pb-44 lg:pt-56" style={{ backgroundColor: NAVY }}>
      {/* Stage lighting: two beams sweeping from the top corners, a warm
          glow behind the title, the same dot grid as the footer */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 0.6px, transparent 0.6px)', backgroundSize: '18px 18px' }}
        />
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5c542]/20 blur-[120px] animate-[palmares-breathe_7s_ease-in-out_infinite] motion-reduce:animate-none" />
        {/* Where the beams land: a pool of light behind the title */}
        <div className="absolute bottom-16 left-1/2 h-40 w-[48rem] max-w-full -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,229,138,0.28),transparent_70%)] blur-2xl" />
        {BEAMS.map((beam) => (
          <Fragment key={beam.position}>
            {/* The lamp the beam comes from */}
            <span
              className="absolute -top-3 size-6 -translate-x-1/2 rounded-full blur-[6px]"
              style={{ left: beam.position, backgroundColor: beam.color, boxShadow: `0 0 40px 14px ${beam.color}` }}
            />
            {/* The blur sits on the wrapper so it softens the clipped cone's edges */}
            <div
              className={`absolute -top-2 h-[44rem] -translate-x-1/2 origin-top mix-blend-screen blur-lg motion-reduce:animate-none ${beam.width} ${beam.animation}`}
              style={{ left: beam.position, animationDelay: beam.delay }}
            >
              <div
                className="h-full w-full [clip-path:polygon(44%_0,56%_0,100%_100%,0_100%)]"
                style={{ backgroundImage: `linear-gradient(to bottom, ${beam.color}cc, ${beam.color}40 45%, transparent 90%)` }}
              />
            </div>
          </Fragment>
        ))}
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#ffe58a] shadow-[0_0_12px_3px_rgba(255,229,138,0.7)] animate-[palmares-twinkle_3.6s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="text-xs font-bold uppercase tracking-[0.35em] text-[#f5c542]"
        >
          {t('eyebrow')}
        </motion.p>

        <h1 className="mt-5 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          {/* The space sits between the spans: inside an inline-block it
              would collapse */}
          {words.map((word, i) => (
            <Fragment key={`${word}-${i}`}>
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.25 + i * 0.07, ease: EASE }}
                className="inline-block bg-[linear-gradient(110deg,#ffffff_35%,#ffe58a_50%,#ffffff_65%)] bg-[length:250%_100%] bg-clip-text text-transparent animate-[palmares-shimmer_6s_linear_infinite] motion-reduce:animate-none"
              >
                {word}
              </motion.span>
              {i < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 + words.length * 0.07, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-white/75 sm:text-xl"
        >
          {intro}
        </motion.p>
      </div>

      {/* Wavy bottom edge into the awards section (same colour as its top),
          mirroring the footer's top */}
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full translate-y-px sm:h-12 lg:h-14">
        <path d="M0 30 C180 0 360 60 540 30 S900 0 1080 30 S1260 60 1440 30 V60 H0 Z" fill="#eef0ff" />
      </svg>
    </section>
  );
}

function Medal({ rank, place }: { rank: number | null; place: string }) {
  if (!place) {
    return (
      <span className="mx-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e8efff] text-accent shadow-[0_0_0_6px_rgba(61,127,255,0.08)]">
        <Plane className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
    );
  }
  const m = (rank && MEDALS[rank]) || OTHER_MEDAL;
  const id = `medal-${rank ?? 0}`;
  return (
    <span
      className="relative block h-[4.35rem] w-14 shrink-0 transition-transform duration-300 group-hover/award:-rotate-6 group-hover/award:scale-110"
      style={{ filter: `drop-shadow(0 8px 10px ${m.glow})` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 58" className="h-full w-full">
        <defs>
          <radialGradient id={`${id}-face`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor={m.light} />
            <stop offset="0.55" stopColor={m.mid} />
            <stop offset="1" stopColor={m.dark} />
          </radialGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={m.dark} />
            <stop offset="0.5" stopColor={m.light} />
            <stop offset="1" stopColor={m.dark} />
          </linearGradient>
        </defs>
        {/* Ribbon: two straps meeting behind the medal, with a white stripe */}
        <path d="M8 0 H20 L28 24 L18 27 Z" fill={m.ribbonDark} />
        <path d="M40 0 H28 L20 24 L30 27 Z" fill={m.ribbon} />
        <path d="M33 0 H35.5 L26.5 25.5 L25 24.5 Z" fill="#ffffff" opacity="0.55" />
        {/* The metal disc: a raised rim, an inner engraved ring, the number */}
        <circle cx="24" cy="38" r="18" fill={`url(#${id}-rim)`} />
        <circle cx="24" cy="38" r="15" fill={`url(#${id}-face)`} />
        <circle cx="24" cy="38" r="12" fill="none" stroke={m.dark} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M14 31 A12 12 0 0 1 26 25.5" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
        <text x="24" y="43.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={m.text} className="font-display">
          {rank ?? '★'}
        </text>
      </svg>
      {/* A glint crossing the disc every few seconds */}
      <span className="absolute left-[12.5%] top-[34.5%] size-[75%] overflow-hidden rounded-full">
        <span className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[palmares-glint_4.5s_ease-in-out_infinite] motion-reduce:hidden" />
      </span>
    </span>
  );
}

function CompetitionCard({ competition, index }: { competition: PalmaresViewData['competitions'][number]; index: number }) {
  const { ref, onPointerMove } = useSpotlight<HTMLDivElement>();
  const image = useBrokenImage();
  const first = index === 0;

  return (
    <li className="relative pl-14 sm:pl-16">
      {/* Timeline node, lighting up as the card comes into view: a glowing
          star for the latest competition, a gold ring for the others */}
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 0.5, ease: EASE }}
        className={
          first
            ? 'absolute left-[-1px] top-5 flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd75e] to-[#f59e0b] text-white shadow-[0_0_0_7px_rgba(245,197,66,0.22),0_0_34px_rgba(245,158,11,0.75)] sm:left-[3px]'
            : 'absolute left-[11px] top-9 flex size-5 items-center justify-center rounded-full border-[3px] border-[#f5a524] bg-white shadow-[0_0_0_5px_rgba(245,165,36,0.15),0_0_18px_rgba(245,165,36,0.55)] sm:left-[15px]'
        }
        aria-hidden="true"
      >
        {first ? (
          <>
            <span className="absolute inset-0 rounded-full bg-[#ffd75e]/60 animate-ping motion-reduce:animate-none" />
            <Star className="relative size-5 fill-current" strokeWidth={1.5} />
          </>
        ) : null}
      </motion.span>

      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        initial={{ opacity: 0, x: 40, y: 16 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="group relative overflow-hidden rounded-[1.75rem] border border-[#f3e4c4]/70 bg-gradient-to-br from-[#fff7e6] via-white to-white p-5 shadow-[0_24px_60px_-28px_rgba(40,56,128,0.35)] [--spot-color:rgba(245,197,66,0.18)] sm:p-7"
      >
        <span className={spotlightLayer} />
        {/* Corner decorations, alternating from card to card */}
        {index % 2 === 0 ? (
          <Laurel className="pointer-events-none absolute right-4 top-3 h-20 w-auto opacity-80 sm:right-6" />
        ) : (
          <BrickDecor className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-auto opacity-55 transition duration-700 group-hover:-translate-y-1 group-hover:rotate-3" />
        )}

        <div className="relative">
          {/* The competition's name on a navy plate with a gold edge, a
              sheen crossing it when the card is hovered */}
          <div className="relative inline-block max-w-[calc(100%-3.5rem)] overflow-hidden rounded-2xl border-l-4 border-[#f5c542] bg-gradient-to-br from-[#0b1a3a] via-[#16265e] to-[#283880] px-5 py-3.5 shadow-[0_16px_34px_-14px_rgba(11,26,58,0.65),0_0_0_1px_rgba(245,197,66,0.25)]">
            <span className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-[#f5c542]/25 blur-2xl" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-1000 group-hover:left-[130%]" aria-hidden="true" />
            <h3 className="relative text-pretty font-display text-lg font-extrabold leading-snug tracking-tight text-white sm:text-xl">
              {competition.title}
            </h3>
          </div>
          {competition.intro ? <p className="mt-4 px-1 text-stone">{competition.intro}</p> : null}

          <ul className="mt-4 space-y-1.5 sm:mt-5">
              {competition.awards.map((award, i) => (
                <motion.li
                  key={`${award.place}-${award.prize}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE }}
                  className={`group/award flex items-center gap-4 rounded-2xl px-3 py-2 transition ${award.place ? 'hover:bg-[#fff8e6]' : 'bg-[#f2f6ff] py-2.5'}`}
                >
                  <Medal rank={award.rank} place={award.place} />
                  <span className="min-w-0">
                    {award.place ? (
                      <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#b8860b]">{award.place}</span>
                    ) : null}
                    <span className={`block text-pretty leading-snug ${award.place ? 'font-semibold text-[#0b1a3a]' : 'font-semibold text-accent'}`}>
                      {award.prize}
                    </span>
                  </span>
                </motion.li>
              ))}
          </ul>

          {competition.image && !image.broken ? (
            <div className="mt-5 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={image.ref}
                src={competition.image}
                alt={competition.imageAlt}
                loading="lazy"
                onError={image.onError}
                className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
          ) : null}
        </div>
      </motion.div>
    </li>
  );
}

// "Notre *parcours*, nos victoires": the starred words in colour
function AccentHeading({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*(.+?)\*/).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-[#2f4fd6]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

function Competitions({ data }: { data: PalmaresViewData }) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const { competitions } = data;

  if (competitions.length === 0) return null;

  return (
    <section className="relative isolate overflow-x-clip bg-gradient-to-b from-[#eef0ff] via-[#f4f5ff] to-surface px-6 py-20 md:px-10 lg:px-16 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#c9d3ff]/50 blur-[110px]" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-[#ffe9b8]/50 blur-[100px]" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Stays in view beside the timeline on wide screens */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.25em] text-[#0b1a3a]/70"
          >
            {data.awardsEyebrow}
            <span className="h-px w-24 bg-gradient-to-r from-[#2f4fd6]/60 to-transparent" aria-hidden="true" />
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            className="mt-4 max-w-md text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#0b1a3a] sm:text-6xl"
          >
            <AccentHeading text={data.awardsHeading} />
          </motion.h2>
          {/* A brushed orange underline drawing itself in */}
          <svg viewBox="0 0 220 14" className="mt-3 h-3.5 w-52" aria-hidden="true">
            <motion.path
              d="M3 9 C60 3 120 3 217 7"
              fill="none"
              stroke="#ff8c42"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
            />
          </svg>
          {data.awardsIntro ? (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="mt-5 max-w-sm text-pretty leading-relaxed text-stone"
            >
              {data.awardsIntro}
            </motion.p>
          ) : null}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
            className="mx-auto mt-8 max-w-sm lg:mx-0 lg:-ml-6 lg:max-w-[30rem]"
          >
            <TrophyPodium className="h-auto w-full drop-shadow-[0_30px_40px_rgba(40,56,128,0.25)]" />
          </motion.div>
        </div>

        <ol ref={listRef} className="relative space-y-8">
          {/* The rail, and the golden light that runs down it as you scroll */}
          <span className="absolute bottom-4 left-5 top-8 w-0.5 rounded-full bg-[#0b1a3a]/10 sm:left-6" aria-hidden="true" />
          <motion.span
            style={{ scaleY: reduce ? 1 : fill }}
            className="absolute bottom-4 left-5 top-8 w-0.5 origin-top rounded-full bg-gradient-to-b from-[#f5c542] via-[#ff8c42] to-[#2f4fd6] shadow-[0_0_14px_rgba(245,197,66,0.8)] sm:left-6"
            aria-hidden="true"
          />
          {competitions.map((competition, i) => (
            <CompetitionCard key={competition.title} competition={competition} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function VideoCard({ video, index }: { video: PalmaresViewData['videos'][number]; index: number }) {
  const t = useTranslations('palmares');
  const image = useBrokenImage();

  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: (index % 2) * 0.12, ease: EASE }}
    >
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-[#0b1a3a] text-white shadow-[0_24px_60px_-20px_rgba(11,26,58,0.5)] ring-1 ring-white/10 transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-20px_rgba(61,127,255,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
      >
        <div className="relative aspect-video overflow-hidden">
          {video.image && !image.broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={image.ref}
              src={video.image}
              alt=""
              loading="lazy"
              onError={image.onError}
              className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-100"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#283880] to-[#0b1a3a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a3a] via-[#0b1a3a]/30 to-transparent" />
          {/* Play button with a pulsing halo */}
          <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white/40 animate-ping motion-reduce:animate-none" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-white text-[#0b1a3a] shadow-[0_0_40px_rgba(255,255,255,0.5)] transition duration-300 group-hover:scale-110 group-hover:bg-[#f5c542]">
              <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
            </span>
          </span>
          {video.highlight ? (
            <span className="absolute left-4 top-4 max-w-[85%] rounded-full bg-[#f5c542] px-3.5 py-1.5 text-xs font-bold leading-snug text-[#5a3d00] shadow-[0_0_24px_rgba(245,197,66,0.6)]">
              {video.highlight}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="text-balance font-display text-xl font-bold leading-snug">{video.title}</h3>
          <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-white/70">{video.description}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f5c542]">
            {t('watchVideo')}
            <ArrowUpRight className="size-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </a>
    </motion.li>
  );
}

// Same colours, in the same order, as the home page's programme cards
// (components/programs/ProgramsSection.tsx): the badge and arrow take the
// accent, the title the deeper shade
const MEDIA_COLORS = [
  { accent: '#7b91f4', deep: '#283880' },
  { accent: '#ff8c42', deep: '#d9560f' },
  { accent: '#ef4b4b', deep: '#c83030' },
  { accent: '#2ec4b6', deep: '#0f7f74' },
];

// Built like a programme card: a picture framed inside a white card, a
// coloured label on it, the title in the card's colour, a navy pill button
function MediaCard({ item, index }: { item: PalmaresViewData['media'][number]; index: number }) {
  const t = useTranslations('palmares');
  const image = useBrokenImage();
  const Icon = MEDIA_ICONS[index % MEDIA_ICONS.length];
  const { accent, deep } = MEDIA_COLORS[index % MEDIA_COLORS.length];
  const showImage = Boolean(item.image) && !image.broken;

  return (
    <motion.li
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      className="group relative transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 focus-within:-translate-y-2"
    >
      {/* A faint navy outline and soft shadow; on hover (or when the button
          has focus) the card lifts, the shadow deepens and the outline takes
          the card's colour */}
      <article
        style={{ '--accent': accent } as React.CSSProperties}
        className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-[#0b1a3a]/[0.07] bg-white text-[#0b1a3a] shadow-[0_2px_4px_rgba(11,26,58,0.05),0_18px_40px_-14px_rgba(11,26,58,0.20)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:border-[color:var(--accent)] group-focus-within:shadow-[0_4px_8px_rgba(11,26,58,0.06),0_34px_60px_-18px_rgba(11,26,58,0.34)] group-hover:border-[color:var(--accent)] group-hover:shadow-[0_4px_8px_rgba(11,26,58,0.06),0_34px_60px_-18px_rgba(11,26,58,0.34)]"
      >
        <div className="p-3 pb-0">
          <div
            className={`relative aspect-[16/10] overflow-hidden rounded-[1.5rem] ${
              showImage && item.logo ? 'flex items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#ffffff,#eef1fb)] p-8' : 'bg-[#0b1a3a]/5'
            }`}
          >
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={image.ref}
                src={item.image}
                alt=""
                loading="lazy"
                onError={image.onError}
                className={
                  item.logo
                    ? 'max-h-14 w-auto max-w-[80%] object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]'
                    : 'h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]'
                }
              />
            ) : (
              <span className="flex h-full items-center justify-center" style={{ color: deep }}>
                <Icon className="size-12" strokeWidth={1.5} aria-hidden="true" />
              </span>
            )}
            {item.badge ? (
              <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#0b1a3a] shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                {item.badge}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
          <h3 className="font-display text-2xl font-extrabold leading-[1.05] tracking-tight" style={{ color: deep }}>
            {item.name}
          </h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[#0b1a3a]/75">{item.description}</p>

          {/* Navy on the white card, the card's colour on hover, where the
              arrow swaps to a white disc so it still stands out */}
          <div className="mt-auto pt-6">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative inline-flex items-center gap-3 self-start rounded-full bg-[#0b1a3a] py-2.5 pl-5 pr-2.5 text-[0.8rem] font-bold uppercase tracking-wide text-white transition-all duration-200 hover:gap-4 hover:bg-[var(--accent)] hover:text-[#0b1a3a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1a3a]"
            >
              {t('viewPost')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors duration-200 group-hover/btn:bg-white group-hover/btn:text-[var(--accent)]">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}

function PhotoTile({ photo, index }: { photo: PalmaresViewData['photos'][number]; index: number }) {
  const image = useBrokenImage();
  if (image.broken) return null;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE }}
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-[1.5rem] ring-1 ring-white/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={image.ref}
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        onError={image.onError}
        className="w-full transition duration-700 group-hover:scale-105"
      />
      {/* A sheen sweeping across on hover */}
      <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-1000 group-hover:left-[150%]" />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[#0b1a3a]/90 to-transparent px-4 pb-3 pt-10 text-sm font-medium leading-snug text-white transition duration-500 group-hover:translate-y-0">
        {photo.alt}
      </figcaption>
    </motion.figure>
  );
}

function NumbersAndPhotos({ data }: { data: PalmaresViewData }) {
  const t = useTranslations('palmares');

  return (
    <section className="relative isolate overflow-x-clip px-6 pb-24 pt-28 text-white md:px-10 lg:px-16" style={{ backgroundColor: NAVY }}>
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full -translate-y-px rotate-180 sm:h-12 lg:h-14">
        <path d="M0 30 C180 0 360 60 540 30 S900 0 1080 30 S1260 60 1440 30 V60 H0 Z" className="fill-surface" />
      </svg>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-24 h-80 w-80 rounded-full bg-[#7b91f4]/25 blur-[110px] animate-[palmares-glow_8s_ease-in-out_infinite] motion-reduce:animate-none" />
        <div className="absolute right-[8%] top-40 h-80 w-80 rounded-full bg-[#f5c542]/20 blur-[110px] animate-[palmares-glow_9s_ease-in-out_1.5s_infinite] motion-reduce:animate-none" />
      </div>

      <div className="mx-auto max-w-6xl">
        {data.stats.length > 0 ? (
          <div className="text-center">
            <SectionHeading light>{data.statsHeading}</SectionHeading>
            <dl className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
              {data.stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
                  className="flex flex-col items-center"
                >
                  <dd className="font-display text-7xl font-extrabold leading-none text-[#ffe58a] [text-shadow:0_0_40px_rgba(245,197,66,0.55)] lg:text-8xl">
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-3 text-lg font-semibold uppercase tracking-[0.25em] text-white/75">{stat.label}</dt>
                </motion.div>
              ))}
            </dl>
          </div>
        ) : null}

        {data.photos.length > 0 ? (
          <div className="mt-20 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {data.photos.map((photo, i) => (
              <PhotoTile key={photo.src} photo={photo} index={i} />
            ))}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-16 flex justify-center"
        >
          <Link
            href="/courses"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-cta px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0b1a3a] shadow-[0_10px_40px_rgba(255,140,66,0.45)] transition hover:bg-[#f97b2b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cta/50"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[palmares-glint_3.5s_ease-in-out_infinite] motion-reduce:hidden" />
            <span className="relative">{t('cta')}</span>
            <ArrowRight className="relative size-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </motion.div>

        {/* A faint gold wave closing the page above the footer, running the
            full width of the screen (the section clips the overflow), with a
            soft spark drifting along it. The stroke keeps its width however
            far the drawing is stretched. */}
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
          className="pointer-events-none relative left-1/2 mt-20 h-8 w-screen -translate-x-1/2 overflow-visible"
        >
          <path d={GOLD_WAVE} fill="none" stroke="#f5c542" strokeOpacity="0.22" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path
            d={GOLD_WAVE}
            pathLength={1000}
            fill="none"
            stroke="#ffe58a"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="60 940"
            vectorEffect="non-scaling-stroke"
            className="animate-[palmares-wave-spark_9s_linear_infinite] motion-reduce:hidden"
          />
        </motion.svg>
      </div>
    </section>
  );
}

export default function PalmaresView({ data }: { data: PalmaresViewData }) {
  return (
    <>
      <Hero heading={data.heading} intro={data.intro} />
      <Competitions data={data} />

      {data.videos.length > 0 ? (
        <section className="px-6 py-20 md:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading>{data.videosHeading}</SectionHeading>
            <ul className="mt-12 grid gap-6 md:grid-cols-2">
              {data.videos.map((video, i) => (
                <VideoCard key={video.url} video={video} index={i} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {data.media.length > 0 ? (
        <section className="px-6 pb-36 pt-12 md:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeading>{data.mediaHeading}</SectionHeading>
            {data.mediaIntro ? (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                className="mt-4 max-w-2xl text-lg text-stone"
              >
                {data.mediaIntro}
              </motion.p>
            ) : null}
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {data.media.map((item, i) => (
                <MediaCard key={item.url} item={item} index={i} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <NumbersAndPhotos data={data} />
    </>
  );
}
