'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';

export type EventsHeroData = {
  eyebrow: string;
  // Words in *stars* show in gold
  heading: string;
  intro: string;
  images: string[];
  galleryLabel: string;
  zoomLabel: string;
};

const NAVY = '#0b1a3a';
const GOLD = '#f5c542';

// Drift speed, px per second, before each card's own multiplier
const DRIFT = 34;
// A picked card grows to at most this share of the hero, and never past this scale
const FIT_W = 0.8;
const FIT_H = 0.82;
const MAX_SCALE = 3.2;
// The shape of a card before its photo has loaded: width x height at full size
const SLOTS = [
  { w: 170, h: 215 },
  { w: 205, h: 155 },
  { w: 155, h: 200 },
  { w: 185, h: 185 },
  { w: 170, h: 230 },
  { w: 140, h: 170 },
];
const GOLDEN = 0.6180339887;
const PHONE = 700;

type Card = {
  // Drift position, px, in hero space
  x: number;
  y: number;
  // 0 = floating, 1 = picked (centred and enlarged); one progress drives both
  z: number;
  targetZ: number;
  w: number;
  h: number;
  mult: number;
};

// Deterministic 0..1 from an index, so the server and the browser agree
const hash01 = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const frac = (v: number) => v - Math.floor(v);

// Photos drifting down the hero, each at its own pace. Click one and it
// travels to the middle and enlarges; click again (or press Escape) and it
// goes back. All per-frame work runs in one animation loop that writes the
// transforms straight to the DOM: no React state per frame.
function FloatingPhotos({ images, label, zoomLabel, onZoom }: { images: string[]; label: string; zoomLabel: string; onZoom: (open: boolean) => void }) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Card[]>([]);
  const nodesRef = useRef<Array<HTMLDivElement | null>>([]);
  const ratiosRef = useRef<number[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const anims = useRef<Array<{ stop: () => void } | null>>([]);
  const active = useActiveWhileVisible(rootRef, '0px', true);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const zoomedRef = useRef<number | null>(null);
  // Phones get fewer cards: the same drift would otherwise cover the title
  const [shown, setShown] = useState(images.length);
  const count = Math.min(images.length, shown);

  useEffect(() => {
    zoomedRef.current = zoomed;
    onZoom(zoomed !== null);
  }, [zoomed, onZoom]);

  const seed = useCallback(() => {
    const { w: W, h: H } = sizeRef.current;
    if (!W || !H) return;
    const scale = Math.max(0.62, Math.min(1.1, W / 1400));
    cardsRef.current = Array.from({ length: count }, (_, i) => {
      const slot = SLOTS[i % SLOTS.length];
      // Same area as its slot, but the photo's own shape once it is known
      const area = slot.w * slot.h * scale * scale;
      const ratio = ratiosRef.current[i] ?? slot.h / slot.w;
      const w = Math.sqrt(area / ratio);
      const h = w * ratio;
      const prev = cardsRef.current[i];
      const node = nodesRef.current[i];
      if (node) {
        node.style.width = `${w}px`;
        node.style.height = `${h}px`;
        node.style.borderRadius = `${Math.round(16 * scale)}px`;
      }
      return {
        x: frac(i * GOLDEN + 0.08) * (W - w * 0.6) - w * 0.2,
        // Keep vertical progress across a resize so a reflow doesn't snap
        y: prev ? prev.y : frac(i * 0.7548776 + 0.31) * (H + h) - h,
        z: prev ? prev.z : 0,
        targetZ: prev ? prev.targetZ : 0,
        w,
        h,
        mult: 0.65 + hash01(i) * 0.7,
      };
    });
  }, [count]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      sizeRef.current = { w: root.offsetWidth, h: root.offsetHeight };
      setShown(root.offsetWidth < PHONE ? 9 : images.length);
      seed();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [seed, images.length]);

  useEffect(() => {
    if (zoomed === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomed(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // Clamp dt: a backgrounded tab returns a huge delta and teleports everything
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w: W, h: H } = sizeRef.current;
      if (!W || !H) return;
      const picked = zoomedRef.current;

      for (let i = 0; i < cardsRef.current.length; i++) {
        const a = cardsRef.current[i];
        const node = nodesRef.current[i];
        if (!node) continue;
        const frozen = picked === i;

        if (!frozen && !reduce) {
          a.y += DRIFT * a.mult * dt;
          // Seamless wrap: recycle a full height above the top edge
          const span = H + a.h;
          if (a.y > H) a.y -= span;
        }

        // Picking is a state change, so a short tween owns the travel and the
        // loop only reads `a.z`
        const targetZ = frozen ? 1 : 0;
        if (a.targetZ !== targetZ) {
          a.targetZ = targetZ;
          anims.current[i]?.stop();
          const from = a.z;
          const delta = targetZ - from;
          anims.current[i] = animate(0, 1, {
            type: 'tween',
            duration: reduce ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (t: number) => {
              a.z = from + delta * t;
            },
            onComplete: () => {
              anims.current[i] = null;
            },
          });
        }

        // A picked card lands on the middle of the hero as it grows: scale()
        // is about the box's own centre, so its top-left goes to ((W-w)/2, (H-h)/2)
        const z = a.z;
        const px = a.x + ((W - a.w) / 2 - a.x) * z;
        const py = a.y + ((H - a.h) / 2 - a.y) * z;
        const fit = Math.min(MAX_SCALE, (W * FIT_W) / Math.max(1, a.w), (H * FIT_H) / Math.max(1, a.h));
        const s = 1 + (fit - 1) * z;
        node.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${s})`;
        // The picked card owns the stack while it is in flight, not only while open
        node.style.zIndex = z > 0.001 ? '999' : '1';
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      onClick={() => zoomed !== null && setZoomed(null)}
      // pan-y: the page still scrolls when a finger starts on the photos
      style={{ touchAction: 'pan-y' }}
      className="absolute inset-0 overflow-hidden [isolation:isolate]"
    >
      {/* Dims everything but the picked photo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#060d20] transition-opacity duration-300"
        style={{ opacity: zoomed !== null ? 0.78 : 0, zIndex: 500 }}
      />
      {images.map((src, i) => {
        const open = zoomed === i;
        const activate = (e: React.SyntheticEvent) => {
          // A card settles its own click, so the root only ever sees the background
          e.stopPropagation();
          setZoomed(zoomed !== null ? null : i);
        };
        return (
          <div
            key={src}
            ref={(n) => {
              nodesRef.current[i] = n;
            }}
            role="button"
            tabIndex={i < count ? 0 : -1}
            aria-pressed={open}
            aria-label={zoomLabel}
            hidden={i >= count}
            onClick={activate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate(e);
              }
            }}
            // transform and zIndex belong to the animation loop
            style={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
            className={`cursor-pointer select-none overflow-hidden bg-white/10 transition-shadow duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              open ? 'shadow-[0_30px_60px_rgba(0,0,0,0.55)]' : 'shadow-[0_10px_24px_rgba(0,0,0,0.35)]'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
                if (!nw || !nh) return;
                ratiosRef.current[i] = Math.max(0.66, Math.min(1.5, nh / nw));
                seed();
              }}
              className="pointer-events-none block h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}

// The top of the Events page: navy, with the photos floating behind the
// title. The title fades out while a photo is open so it can't cover it.
export default function EventsHero({ data }: { data: EventsHeroData }) {
  const [open, setOpen] = useState(false);
  const onZoom = useCallback((v: boolean) => setOpen(v), []);

  return (
    <section className="relative isolate h-[88svh] min-h-[640px] max-h-[940px] overflow-hidden text-white" style={{ backgroundColor: NAVY }}>
      {data.images.length > 0 ? <FloatingPhotos images={data.images} label={data.galleryLabel} zoomLabel={data.zoomLabel} onZoom={onZoom} /> : null}

      <div className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`}>
        {/* A soft navy cloud behind the words, so photos passing under stay quiet */}
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[120%] w-[min(1100px,130%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(11,26,58,0.94),rgba(11,26,58,0.8)_55%,rgba(11,26,58,0)_100%)]" />
        <div className="relative max-w-3xl text-center">
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-[38px] rounded-full bg-[#e8303a]" />
            <span className="h-1.5 w-[38px] rounded-full bg-white" />
            <span className="h-1.5 w-[38px] rounded-full" style={{ backgroundColor: GOLD }} />
          </div>
          {data.eyebrow ? (
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.32em]" style={{ color: GOLD }}>
              {data.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-balance font-display text-[3rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl xl:text-8xl">
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
          {data.intro ? <p className="mx-auto mt-5 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-white/80 sm:text-[1.1rem]">{data.intro}</p> : null}
        </div>
      </div>

      {/* Wavy bottom edge into the page (same colour as its background) */}
      <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 w-full translate-y-px sm:h-12 lg:h-14">
        <path d="M0 30 C180 0 360 60 540 30 S900 0 1080 30 S1260 60 1440 30 V60 H0 Z" fill="#f6f7f9" />
      </svg>
    </section>
  );
}
