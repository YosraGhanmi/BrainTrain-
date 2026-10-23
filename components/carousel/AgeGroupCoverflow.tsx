// Age group coverflow — flat-slat cover flow carousel for the age group cards.
// Adapted from an Originkit Coverflow Carousel pattern: the active item is a
// big card centered in the stage, every other item is a thin flat slat, and
// stepping is always a single-slat move driven by one rAF loop.
'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getIcon } from '@/lib/content/icons';
import ArrowRevealButton from '@/components/buttons/ArrowRevealButton';

type AgeGroupCard = { slug: string; label: string; stage: string; description: string; icon: string; image: string };

type Sizing = {
  restWidth: number;
  restHeight: number;
  activeWidth: number;
  activeHeight: number;
};

const GAP = 24;
const RADIUS = 28;
// Last age group opened in this tab: the fallback when /courses is reached
// without ?age= (e.g. from the navbar), so the visitor still lands on it.
const LAST_GROUP_KEY = 'braintrain:last-age-group';

// The age group to open on: ?age= from the URL, else the last one opened in
// this tab. Read straight from window.location rather than useSearchParams,
// which would need a Suspense boundary around this statically rendered page.
function rememberedIndex(groups: AgeGroupCard[]): number {
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(LAST_GROUP_KEY);
  } catch {
    // storage blocked (private mode, disabled site data): URL only
  }
  const slug = new URLSearchParams(window.location.search).get('age') ?? stored;
  return Math.max(0, groups.findIndex((g) => g.slug === slug));
}

const subscribeToNothing = () => () => {};

// Card `index`'s signed distance from centre at position `pos`, wrapped into
// (-count/2, count/2] so stepping is always a single-slat move either way.
function relOf(index: number, pos: number, count: number): number {
  let rel = (((index - pos) % count) + count) % count;
  if (rel > count / 2) rel -= count;
  return rel;
}

function xForRel(rel: number, s: Sizing, gap: number): number {
  const ar = Math.abs(rel);
  const c1 = s.activeWidth / 2 + gap + s.restWidth / 2;
  const pitch = s.restWidth + gap;
  const mag = ar <= 1 ? ar * c1 : c1 + (ar - 1) * pitch;
  return (rel < 0 ? -1 : 1) * mag;
}

function blendForRel(rel: number): number {
  return Math.min(Math.abs(rel), 1);
}

function useResponsiveSizing(): Sizing {
  const [width, setWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return useMemo(() => {
    if (width < 420) return { activeWidth: 220, activeHeight: 250, restWidth: 54, restHeight: 160 };
    if (width < 640) return { activeWidth: 280, activeHeight: 280, restWidth: 72, restHeight: 190 };
    if (width < 1024) return { activeWidth: 420, activeHeight: 320, restWidth: 120, restHeight: 220 };
    return { activeWidth: 560, activeHeight: 360, restWidth: 160, restHeight: 240 };
  }, [width]);
}

function Card({
  group,
  index,
  pos,
  count,
  sizing,
  onSelect,
  onOpen,
}: {
  group: AgeGroupCard;
  index: number;
  pos: MotionValue<number>;
  count: number;
  sizing: Sizing;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}) {
  const Icon = getIcon(group.icon);
  const t = useTranslations('courses');

  const x = useTransform(pos, (p: number) => xForRel(relOf(index, p, count), sizing, GAP));
  const opacity = useTransform(pos, (p: number) => {
    const ar = Math.abs(relOf(index, p, count));
    return ar <= 1.5 ? 1 : ar >= 2.5 ? 0 : 1 - (ar - 1.5);
  });
  const zIndex = useTransform(pos, (p: number) =>
    Math.round(1000 - Math.abs(relOf(index, p, count)) * 100)
  );
  const width = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count));
    return sizing.activeWidth + (sizing.restWidth - sizing.activeWidth) * a;
  });
  const height = useTransform(pos, (p: number) => {
    const a = blendForRel(relOf(index, p, count));
    return sizing.activeHeight + (sizing.restHeight - sizing.activeHeight) * a;
  });
  const overlayOpacity = useTransform(pos, (p: number) => {
    const ar = Math.abs(relOf(index, p, count));
    return Math.max(0, 1 - ar * 1.4);
  });
  // Only the centred card's text and button take clicks. On a side card
  // they're invisible, and a click there should centre the card, not open it.
  const overlayPointerEvents = useTransform(pos, (p: number) =>
    Math.abs(relOf(index, p, count)) < 0.5 ? 'auto' : 'none'
  );
  const boxShadow = useTransform(pos, (p: number) =>
    Math.abs(relOf(index, p, count)) < 0.5
      ? '0 24px 60px rgba(11,26,58,0.35)'
      : '0 12px 30px rgba(11,26,58,0.2)'
  );

  return (
    <motion.div
      onClick={() => onSelect(index)}
      // Zero-size anchor at the stage centre: the card itself is offset by
      // the inner div's -50% translate. Left at its natural size, this box
      // sat down-right of the card and (with the higher z-index) swallowed
      // clicks meant for the next card along.
      style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, x, zIndex, opacity }}
      className="cursor-pointer"
    >
      <motion.div
        style={{ x: '-50%', y: '-50%', width, height, borderRadius: RADIUS, boxShadow }}
        className="relative overflow-hidden bg-[#0b1a3a]"
      >
        <Image
          src={group.image}
          alt={group.label}
          fill
          draggable={false}
          sizes="(min-width: 640px) 560px, 90vw"
          className="pointer-events-none select-none object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1a3a]/90 via-[#0b1a3a]/10 to-transparent" />

        <motion.div style={{ opacity: overlayOpacity, pointerEvents: overlayPointerEvents }} className="absolute inset-x-0 bottom-0 p-6">
          <Icon className="h-7 w-7 text-[#ff8c42]" strokeWidth={1.75} />
          {group.stage ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8c42]">{group.stage}</p>
          ) : null}
          <h3 className={`${group.stage ? 'mt-1' : 'mt-3'} text-xl font-bold text-white sm:text-2xl`}>{group.label}</h3>
          <p className="mt-2 line-clamp-2 max-w-sm text-sm text-white/70">{group.description}</p>
          <ArrowRevealButton
            label={t('seeCourses')}
            href={`/courses/${group.slug}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(index);
            }}
            className="mt-4"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function AgeGroupCoverflow({ ageGroups }: { ageGroups: AgeGroupCard[] }) {
  const groups = ageGroups;
  const count = Math.max(1, groups.length);
  const prefersReducedMotion = useReducedMotion();

  const sizing = useResponsiveSizing();

  // True only while hydrating server-rendered HTML (React renders with the
  // server snapshot then). Any other mount (coming back with the arrow, the
  // browser's back button, the navbar) can start on the remembered card
  // straight away, so it's right from the first frame with nothing to fix up.
  const hydrating = useSyncExternalStore(subscribeToNothing, () => false, () => true);
  const [startIndex] = useState(() => (hydrating ? 0 : rememberedIndex(groups)));
  const pos = useMotionValue(startIndex);
  const targetRef = useRef(startIndex);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);
  const reducedRef = useRef(prefersReducedMotion);
  reducedRef.current = prefersReducedMotion;
  // Bumped once the position is restored from the URL, to re-render the cards
  // (they recompute their layout from `pos` on every render).
  const [, setRestoredIndex] = useState(0);

  const tick = useCallback(
    (t: number) => {
      const last = lastTRef.current ?? t;
      const dt = Math.min((t - last) / 1000, 1 / 30);
      lastTRef.current = t;

      const cur = pos.get();
      const diff = targetRef.current - cur;
      const dur = 0.45;
      const step = (1 / dur) * dt;
      const arriving = reducedRef.current || Math.abs(diff) <= step;

      if (arriving) {
        pos.set(targetRef.current);
        rafRef.current = null;
        lastTRef.current = null;
        return;
      }

      pos.set(cur + Math.sign(diff) * step);
      rafRef.current = requestAnimationFrame(tick);
    },
    [pos]
  );

  // After a full page load the first render has to match the server HTML
  // (first card), so the remembered card is applied right after hydration,
  // in a layout effect so it's still before the first paint.
  useLayoutEffect(() => {
    const index = rememberedIndex(groups);
    if (index === targetRef.current) return;
    let cancelled = false;
    // Applied in a microtask (still before the first paint) and followed by
    // a re-render: set synchronously here, the cards' change subscription can
    // miss it (React's dev-mode double effect run, or hydration timing).
    queueMicrotask(() => {
      if (cancelled) return;
      targetRef.current = index;
      pos.set(index);
      setRestoredIndex(index);
    });
    return () => {
      cancelled = true;
    };
  }, [groups, pos]);

  // Keep the centred (or just opened) age group in the URL and in this tab's
  // session, so coming back to this page by any route (the arrow on an age
  // group's page, the browser's back button, the navbar) lands on it.
  const rememberCard = useCallback(
    (target: number) => {
      const slug = groups[((Math.round(target) % count) + count) % count]?.slug;
      if (!slug) return;
      const url = new URL(window.location.href);
      url.searchParams.set('age', slug);
      window.history.replaceState(null, '', url);
      try {
        window.sessionStorage.setItem(LAST_GROUP_KEY, slug);
      } catch {
        // storage blocked: the URL still carries it
      }
    },
    [groups, count]
  );

  const ensureRunning = useCallback(() => {
    if (rafRef.current == null) {
      lastTRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const goNext = useCallback(() => {
    targetRef.current += 1;
    rememberCard(targetRef.current);
    ensureRunning();
  }, [ensureRunning, rememberCard]);
  const goPrev = useCallback(() => {
    targetRef.current -= 1;
    rememberCard(targetRef.current);
    ensureRunning();
  }, [ensureRunning, rememberCard]);
  const goTo = useCallback(
    (index: number) => {
      const cur = targetRef.current;
      let d = index - cur;
      d = ((d % count) + count) % count;
      if (d > count / 2) d -= count;
      targetRef.current = cur + d;
      rememberCard(targetRef.current);
      ensureRunning();
    },
    [ensureRunning, rememberCard, count]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-[320px] w-full select-none overflow-hidden xs:h-[360px] sm:h-[480px]">
      <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
        {groups.map((group, i) => (
          <Card key={group.slug} group={group} index={i} pos={pos} count={count} sizing={sizing} onSelect={goTo} onOpen={rememberCard} />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-[2000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0b1a3a] shadow-lg transition hover:scale-105 sm:left-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-[2000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0b1a3a] shadow-lg transition hover:scale-105 sm:right-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
