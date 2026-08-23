// Orbit border button — adapted from an Originkit "Orbit Border Button" pattern.
// A pill button with a travelling "comet" of light that orbits its border ring
// continuously, and flares into a solid glowing ring on hover.
'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAnimate, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

type Props = {
  label: string;
  href: string;
  fill?: string;
  textColor?: string;
  borderColor?: string;
  cometColor?: string;
  showArrow?: boolean;
  className?: string;
};

const BAND_MASK: React.CSSProperties = {
  maskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  maskClip: 'border-box, content-box',
  maskComposite: 'exclude',
  WebkitMaskImage: 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)',
  WebkitMaskClip: 'border-box, content-box',
  WebkitMaskComposite: 'xor',
} as React.CSSProperties;

const BAND_WIDTH = 1.5;
const IDLE_ARC_DEG = 70; // slice of the ring lit at rest
const HOVER_ARC_DEG = 360; // full ring lit on hover
const DEG_PER_SEC = 90; // orbit rate
const GLOW_BLUR = 10;
const CORE_OPACITY = 0.5;
const ARC_VAR = '--comet-arc';
const SOLID_VAR = '--comet-solid';

const solidOf = (arcDeg: number) => (arcDeg * arcDeg) / 360;

export default function OrbitBorderButton({
  label,
  href,
  fill = '#0b1a3a',
  textColor = '#ffffff',
  borderColor = 'rgba(11,26,58,0.2)',
  cometColor = '#ff8c42',
  showArrow = true,
  className,
}: Props) {
  const [scope, animate] = useAnimate();
  const btnRef = useRef<HTMLAnchorElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const cometRef = useRef<HTMLDivElement>(null);
  const arcDegRef = useRef(IDLE_ARC_DEG);
  const arcAnimRef = useRef<{ stop: () => void } | null>(null);
  const reducedMotion = useReducedMotion();
  const [side, setSide] = useState(0);
  const [radius, setRadius] = useState(999);

  // Radius = a true pill at any size (half the shorter side), matched on the
  // button and its ring so the comet's mask hugs the face exactly.
  useLayoutEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const applyRadius = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const r = Math.min(w, h) / 2;
      el.style.borderRadius = `${r}px`;
      if (bandRef.current) bandRef.current.style.borderRadius = `${r}px`;
      setRadius(r - BAND_WIDTH);
      setSide(Math.ceil(Math.hypot(w, h) * 1.02));
    };
    applyRadius();
    const ro = new ResizeObserver(applyRadius);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Continuous rotation, driven by rAF so it never depends on React state.
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    let last = 0;
    let angle = 0;
    const tick = (t: number) => {
      if (!last) last = t;
      angle = (angle + (DEG_PER_SEC * (t - last)) / 1000) % 360;
      last = t;
      const el = cometRef.current;
      if (el) el.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  useEffect(() => {
    const el = cometRef.current;
    if (el) {
      el.style.setProperty(ARC_VAR, `${IDLE_ARC_DEG}deg`);
      el.style.setProperty(SOLID_VAR, `${solidOf(IDLE_ARC_DEG)}deg`);
    }
  }, []);

  const animateArc = useCallback(
    (targetDeg: number) => {
      arcAnimRef.current?.stop();
      if (reducedMotion) {
        arcDegRef.current = targetDeg;
        const el = cometRef.current;
        if (el) {
          el.style.setProperty(ARC_VAR, `${targetDeg}deg`);
          el.style.setProperty(SOLID_VAR, `${solidOf(targetDeg)}deg`);
        }
        return;
      }
      const startDeg = arcDegRef.current;
      const duration = 0.45;
      const startTime = performance.now();
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      let running = true;
      let rafId = 0;

      const run = () => {
        if (!running) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        arcDegRef.current = startDeg + (targetDeg - startDeg) * easeOut(t);
        const el = cometRef.current;
        if (el) {
          el.style.setProperty(ARC_VAR, `${arcDegRef.current}deg`);
          el.style.setProperty(SOLID_VAR, `${solidOf(arcDegRef.current)}deg`);
        }
        if (t < 1) rafId = requestAnimationFrame(run);
      };
      rafId = requestAnimationFrame(run);
      arcAnimRef.current = {
        stop: () => {
          running = false;
          cancelAnimationFrame(rafId);
        },
      };
    },
    [reducedMotion]
  );

  useEffect(() => () => arcAnimRef.current?.stop(), []);

  const onEnter = () => {
    if (btnRef.current) animate(btnRef.current, { scale: 1.04 }, { duration: 0.4, ease: [0.44, 0, 0.56, 1] });
    animateArc(HOVER_ARC_DEG);
  };
  const onLeave = () => {
    if (btnRef.current) animate(btnRef.current, { scale: 1 }, { duration: 0.4, ease: [0.44, 0, 0.56, 1] });
    animateArc(IDLE_ARC_DEG);
  };

  const arcVar = `var(${ARC_VAR}, ${IDLE_ARC_DEG}deg)`;
  const solidVar = `var(${SOLID_VAR}, ${solidOf(IDLE_ARC_DEG)}deg)`;
  // Counter-clockwise rotation reads correctly with a ramp that peaks at 12
  // o'clock and fades clockwise behind it — that keeps the comet's bright head
  // leading the direction of travel instead of dragging at the back.
  const cometBackground = `conic-gradient(from 0deg, ${cometColor} 0deg, ${cometColor} ${solidVar}, rgba(0,0,0,0) ${arcVar}, rgba(0,0,0,0) 360deg)`;

  return (
    <span ref={scope} onPointerEnter={onEnter} onPointerLeave={onLeave} className={`relative inline-flex ${className ?? ''}`}>
      <Link
        ref={btnRef}
        href={href}
        className="relative box-border inline-flex items-center text-sm font-bold uppercase tracking-[0.2em]"
        style={{ background: borderColor, padding: BAND_WIDTH }}
      >
        {/* ring — masked to the padding band so the comet is confined to a
            thin outline instead of flooding the whole pill */}
        <div
          ref={bandRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 box-border"
          style={{ padding: BAND_WIDTH, ...BAND_MASK }}
        >
          <div
            ref={cometRef}
            className="absolute left-1/2 top-1/2"
            style={{ width: side, height: side, marginLeft: -side / 2, marginTop: -side / 2, transformOrigin: 'center' }}
          >
            <div className="absolute inset-0" style={{ background: cometBackground, filter: `blur(${GLOW_BLUR}px)` }} />
            <div className="absolute inset-0" style={{ background: cometBackground, opacity: CORE_OPACITY }} />
          </div>
        </div>

        {/* face */}
        <span
          className="relative z-[1] flex w-full items-center justify-center gap-2 px-6 py-2.5"
          style={{ background: fill, color: textColor, borderRadius: radius }}
        >
          {label}
          {showArrow && <ArrowRight className="h-4 w-4" />}
        </span>
      </Link>
    </span>
  );
}
