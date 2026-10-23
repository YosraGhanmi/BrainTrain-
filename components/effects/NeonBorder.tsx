'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';

type Movement = 'continuous' | 'step';

type Props = {
  color?: string;
  rounded?: number;
  thickness?: number;
  borderSize?: number;
  glow?: number;
  movement?: Movement;
  speed?: number;
  style?: React.CSSProperties;
};

const DEFAULTS = {
  color: '#3d7fff',
  rounded: 24,
  thickness: 6,
  borderSize: 50,
  glow: 100,
  movement: 'continuous' as const,
  speed: 16,
};

const EDGE_COPIES = 2;
const GLOW_LAYERS = [
  { blur: 8, opacity: 0.5, reach: 0.3 },
  { blur: 15, opacity: 0.3, reach: 0.6 },
  { blur: 57, opacity: 0.18, reach: 1 },
];
const MAX_GLOW_BLUR = Math.max(...GLOW_LAYERS.map((l) => l.blur));
const MAX_GLOW_REACH = 36;

function parseRgb(input: string): string {
  if (typeof input !== 'string') return '0,0,0';
  const s = input.trim();

  const hex = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const n = parseInt(h.slice(0, 6), 16);
    if (!Number.isFinite(n)) return '0,0,0';
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  const rgb = s.match(/^rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(',').map((v) => parseFloat(v));
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return `${parts[0]},${parts[1]},${parts[2]}`;
    }
  }
  return '0,0,0';
}

// buildArcs runs on every animation update and needs ~50 colour stops each
// time; parse each colour string once rather than re-running the regexes.
const rgbCache = new Map<string, string>();

function withAlpha(input: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));
  let rgb = rgbCache.get(input);
  if (rgb === undefined) {
    rgb = parseRgb(input);
    rgbCache.set(input, rgb);
  }
  return `rgba(${rgb},${a})`;
}

function perimeterPoint(u: number, w: number, h: number): [number, number] {
  const d = (((u % 1) + 1) % 1) * 2 * (w + h);
  if (d < w) return [d, 0];
  if (d < w + h) return [w, d - w];
  if (d < w * 2 + h) return [w - (d - w - h), h];
  return [0, h - (d - w * 2 - h)];
}

function cornerLap(k: number, w: number, h: number) {
  const p = 2 * (w + h);
  const at = [0, w / p, (w + h) / p, (w * 2 + h) / p];
  return Math.floor(k / 4) + at[((k % 4) + 4) % 4];
}

function perimeterAngle(u: number, w: number, h: number) {
  const [x, y] = perimeterPoint(u, w, h);
  return (Math.atan2(x - w / 2, h / 2 - y) * 180) / Math.PI;
}

const ARC_SAMPLES = 24;
const MIN_ARC = 0.015;

type Stop = [alpha: number, deg: number];

// One arc's alpha stops, in degrees clockwise from where it starts (`base`).
function arcStops(lap: number, lengthPct: number, w: number, h: number) {
  const fw = w > 0 ? w : 100;
  const fh = h > 0 ? h : 100;

  const len = Math.max(0, Math.min(100, lengthPct));
  const span = Math.max(MIN_ARC, (len / 100) * 0.5);
  const solidT = len / 100;

  const stops: Stop[] = [];
  let base = 0;
  let prev = 0;
  let acc = 0;

  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const f = i / ARC_SAMPLES;
    const angle = perimeterAngle(lap + (f - 0.5) * span, fw, fh);
    if (i === 0) {
      base = angle;
    } else {
      let d = angle - prev;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      acc += d;
    }
    prev = angle;

    const t = Math.abs(f - 0.5) * 2;
    const k = solidT >= 1 ? 1 : t <= solidT ? 1 : 1 - (t - solidT) / (1 - solidT);
    stops.push([k * k * (3 - 2 * k), acc]);
  }

  return { base, end: acc, stops };
}

// Both arcs (the one at `lap` and its twin half a lap behind) in a single
// gradient. They sit on opposite sides of the border and never overlap (and
// the layers blend additively), so one stack of blurred, blended layers draws
// both exactly as two separate stacks did, with half the elements.
function buildArcs(lap: number, lengthPct: number, w: number, h: number, color: string) {
  const a = arcStops(lap, lengthPct, w, h);
  const b = arcStops(lap + 0.5, lengthPct, w, h);
  // Where the twin starts, in degrees clockwise from the first arc's start
  const offset = (((b.base - a.base) % 360) + 360) % 360;
  const at = (alpha: number, deg: number) => `${withAlpha(color, alpha)} ${deg.toFixed(2)}deg`;

  const stops = [
    ...a.stops.map(([alpha, deg]) => at(alpha, deg)),
    at(0, a.end),
    at(0, offset),
    ...b.stops.map(([alpha, deg]) => at(alpha, offset + deg)),
    at(0, offset + b.end),
    at(0, 360),
  ];

  return `conic-gradient(from ${a.base.toFixed(2)}deg at 50% 50%, ${stops.join(', ')})`;
}

const SLOWEST_CYCLE = 30;
const FASTEST_CYCLE = 4;
const SLOWEST_STEP = 3;
const FASTEST_STEP = 0.35;
const STEP_EASE = [0.72, 0.16, 0.18, 1.05];
const GLIDE_EASE = [0.65, 0, 0.35, 1];

function makeEaseFn(pts: number[]) {
  const [x1, y1, x2, y2] = pts;
  if (x1 === y1 && x2 === y2) return (t: number) => t;
  const bez = (a: number, b: number, t: number) => {
    const u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  };
  return (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    let s = x;
    for (let i = 0; i < 8; i++) {
      const cx = bez(x1, x2, s) - x;
      const u = 1 - s;
      const dx = 3 * u * u * x1 + 6 * u * s * (x2 - x1) + 3 * s * s * (1 - x2);
      if (Math.abs(dx) < 1e-6) break;
      s -= cx / dx;
      s = Math.max(0, Math.min(1, s));
    }
    return bez(y1, y2, s);
  };
}

// Each update repaints several large blurred, masked, additively blended
// layers (measured at roughly a full CPU core in the GPU process at 60fps for
// two visible borders). The arcs glide along long soft fades, so 30 updates a
// second reads as the same smooth drift at about half the cost.
const UPDATE_INTERVAL = 1 / 30;

const stepEase = makeEaseFn(STEP_EASE);
const glideEase = makeEaseFn(GLIDE_EASE);

const BAND_MASK: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  WebkitMaskClip: 'content-box, border-box',
  WebkitMaskComposite: 'xor',
  maskImage: 'linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)',
  maskClip: 'content-box, border-box',
  maskComposite: 'exclude',
};

export default function NeonBorder(props: Props) {
  const {
    color = DEFAULTS.color,
    rounded = DEFAULTS.rounded,
    thickness = DEFAULTS.thickness,
    borderSize = DEFAULTS.borderSize,
    glow = DEFAULTS.glow,
    movement = DEFAULTS.movement,
    speed = DEFAULTS.speed,
    style,
  } = props;

  const groupRef = useRef<HTMLDivElement>(null);

  const live = useRef({ speed, movement, borderSize, color });
  live.current = { speed, movement, borderSize, color };

  const rootRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Where the arcs are along the border, kept across pauses so the glow
  // resumes where it stopped instead of jumping back to the start.
  const progress = useRef({ corner: 0, stepT: 0 });
  const reducedMotion = useReducedMotion();
  // Every update repaints several blurred, masked, blended layers, so the
  // loop only runs while the border is actually on screen.
  const active = useActiveWhileVisible(rootRef);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width === sizeRef.current.w && r.height === sizeRef.current.h) return;
      sizeRef.current = { w: r.width, h: r.height };
      setSize(sizeRef.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) return;
    let raf = 0;
    let last = performance.now();
    let lap = 0;
    let { corner, stepT } = progress.current;
    let pending = 0;

    const frame = (now: number) => {
      pending += Math.max(0, (now - last) / 1000);
      last = now;
      // Small tolerance so a 60Hz display reliably lands on every other frame
      if (pending < UPDATE_INTERVAL - 0.004) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, pending);
      pending = 0;
      const p = live.current;
      const s = Math.max(0, Math.min(20, p.speed));

      if (s > 0) {
        const step = p.movement === 'step';
        const beat = step
          ? SLOWEST_STEP + ((FASTEST_STEP - SLOWEST_STEP) * (s - 1)) / 19
          : (SLOWEST_CYCLE + ((FASTEST_CYCLE - SLOWEST_CYCLE) * (s - 1)) / 19) / 4;

        stepT += dt / beat;
        while (stepT >= 1) {
          stepT -= 1;
          corner += 1;
        }
        progress.current.corner = corner;
        progress.current.stepT = stepT;
        const eased = step ? stepEase(Math.min(1, stepT * 2)) : glideEase(stepT);

        const { w, h } = sizeRef.current;
        const fw = w > 0 ? w : 100;
        const fh = h > 0 ? h : 100;
        const from = cornerLap(corner, fw, fh);
        const to = cornerLap(corner + 1, fw, fh);
        lap = from + (to - from) * eased;

        const group = groupRef.current;
        if (group) {
          group.style.setProperty('--arc', buildArcs(lap, p.borderSize, w, h, p.color));
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [active, reducedMotion]);

  const thick = Math.max(1, Math.min(10, thickness));

  const radius = (Math.max(0, Math.min(100, rounded)) / 100) * (Math.min(size.w, size.h) / 2);

  const amount = Math.max(0, Math.min(100, glow)) / 100;

  const ringAt = (share: number) => thick + amount * MAX_GLOW_REACH * share;
  const glowOuter = 10 + MAX_GLOW_REACH + MAX_GLOW_BLUR * 2;

  const band = (r: number, offset = 0) => (
    <div
      style={{
        position: 'absolute',
        inset: offset - r,
        boxSizing: 'border-box',
        padding: r,
        borderRadius: radius > 0 ? radius + r : 0,
        background: 'var(--arc)',
        ...BAND_MASK,
      }}
    />
  );

  const glowLayer = (key: string, r: number, blurPx: number, opacity: number) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        inset: -glowOuter,
        boxSizing: 'border-box',
        padding: glowOuter,
        borderRadius: radius > 0 ? radius + glowOuter : 0,
        opacity,
        mixBlendMode: 'plus-lighter',
        filter: blurPx ? `blur(${blurPx.toFixed(1)}px)` : 'none',
        WebkitFilter: blurPx ? `blur(${blurPx.toFixed(1)}px)` : 'none',
        ...BAND_MASK,
      }}
    >
      {band(r, glowOuter)}
    </div>
  );

  const glowGroup = (
    <div
      ref={groupRef}
      style={
        {
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none',
          '--arc': buildArcs(0, borderSize, size.w, size.h, color),
        } as React.CSSProperties
      }
    >
      {amount > 0 && GLOW_LAYERS.map((l, i) => glowLayer(`glow-${i}`, ringAt(l.reach), l.blur, l.opacity))}
      {Array.from({ length: EDGE_COPIES }).map((_, i) => (
        <div
          key={`edge-${i}`}
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'plus-lighter',
          }}
        >
          {band(thick)}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flexShrink: 0,
        borderRadius: radius,
        ...style,
      }}
    >
      {glowGroup}
    </div>
  );
}
