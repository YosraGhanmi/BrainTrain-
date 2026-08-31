// Age group coverflow — flat-slat cover flow carousel for the age group cards.
// Adapted from an Originkit Coverflow Carousel pattern: the active item is a
// big card centered in the stage, every other item is a thin flat slat, and
// stepping is always a single-slat move driven by one rAF loop.
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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

type AgeGroupCard = { slug: string; label: string; description: string; icon: string; image: string };

type Sizing = {
  restWidth: number;
  restHeight: number;
  activeWidth: number;
  activeHeight: number;
};

const GAP = 24;
const RADIUS = 28;

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

function Card({
  group,
  index,
  pos,
  count,
  sizing,
  onSelect,
}: {
  group: AgeGroupCard;
  index: number;
  pos: MotionValue<number>;
  count: number;
  sizing: Sizing;
  onSelect: (index: number) => void;
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
  const boxShadow = useTransform(pos, (p: number) =>
    Math.abs(relOf(index, p, count)) < 0.5
      ? '0 24px 60px rgba(11,26,58,0.35)'
      : '0 12px 30px rgba(11,26,58,0.2)'
  );

  return (
    <motion.div
      onClick={() => onSelect(index)}
      style={{ position: 'absolute', left: '50%', top: '50%', x, zIndex, opacity }}
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

        <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-x-0 bottom-0 p-6">
          <Icon className="h-7 w-7 text-[#ff8c42]" strokeWidth={1.75} />
          <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">{group.label}</h3>
          <p className="mt-2 line-clamp-2 max-w-sm text-sm text-white/70">{group.description}</p>
          <ArrowRevealButton
            label={t('seeCourses')}
            href={`/courses/${group.slug}`}
            onClick={(e) => e.stopPropagation()}
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

  const sizing: Sizing = useMemo(
    () => ({ activeWidth: 560, activeHeight: 360, restWidth: 160, restHeight: 240 }),
    []
  );

  const pos = useMotionValue(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);
  const reducedRef = useRef(prefersReducedMotion);
  reducedRef.current = prefersReducedMotion;

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

  const ensureRunning = useCallback(() => {
    if (rafRef.current == null) {
      lastTRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const goNext = useCallback(() => {
    targetRef.current += 1;
    ensureRunning();
  }, [ensureRunning]);
  const goPrev = useCallback(() => {
    targetRef.current -= 1;
    ensureRunning();
  }, [ensureRunning]);
  const goTo = useCallback(
    (index: number) => {
      const cur = targetRef.current;
      let d = index - cur;
      d = ((d % count) + count) % count;
      if (d > count / 2) d -= count;
      targetRef.current = cur + d;
      ensureRunning();
    },
    [ensureRunning, count]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-[440px] w-full select-none overflow-hidden sm:h-[480px]">
      <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
        {groups.map((group, i) => (
          <Card key={group.slug} group={group} index={i} pos={pos} count={count} sizing={sizing} onSelect={goTo} />
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
