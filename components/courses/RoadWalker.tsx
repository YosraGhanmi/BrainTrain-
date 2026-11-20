'use client';

import { useEffect, useRef, useState } from 'react';
import { ROAD_BOX, roadSamples } from '@/components/courses/road';

// Walking pace, in pixels per second
const SPEED = 28;
// The figure's size, and the invisible margin around it that also catches a
// tap (a 24px figure alone is too small a target)
const FIG_W = 24;
const FIG_H = 40;
const HIT = 12;
// How far beyond the screen's edges he starts and turns back
const OFFSCREEN = 40;

// A little stick figure walking the Courses page road, from the left edge of
// the screen to the right, then again from the left. Tap or click him and he
// trips, falls flat, and gets back up. He passes behind the stops' circles. Decorative only, so hidden from screen
// readers; visitors who ask for less motion see him standing still.
export default function RoadWalker({ count, roadHeight }: { count: number; roadHeight: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLDivElement>(null);
  const fallingRef = useRef(false);
  const reducedRef = useRef(false);
  const [falling, setFalling] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const walker = walkerRef.current;
    if (!box || !walker) return;
    const samples = roadSamples(count);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = reduce.matches;

    // The road box (the content width) and the gaps out to the screen edges
    let width = 0;
    let leftGap = 0;
    let rightGap = 0;
    const measure = () => {
      const rect = box.getBoundingClientRect();
      width = rect.width;
      leftGap = rect.left;
      rightGap = document.documentElement.clientWidth - rect.right;
    };

    // The road's height under a point px pixels from the box's left edge:
    // level outside the box, else read from the curve's samples
    const roadY = (px: number) => {
      const x = (px / Math.max(width, 1)) * ROAD_BOX.width;
      if (x <= 0 || x >= ROAD_BOX.width) return ROAD_BOX.mid;
      let lo = 0;
      let hi = samples.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (samples[mid][0] < x) lo = mid;
        else hi = mid;
      }
      const [x0, y0] = samples[lo];
      const [x1, y1] = samples[hi];
      return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    };

    const startPos = () => -leftGap - OFFSCREEN;
    let pos = 0;
    // Feet on the road's centre line, a touch below it
    const place = () => {
      const y = (roadY(pos) / ROAD_BOX.height) * roadHeight;
      walker.style.transform = `translate3d(${pos - FIG_W / 2 - HIT}px, ${y - FIG_H - HIT + 4}px, 0)`;
    };

    let raf = 0;
    let last = 0;
    let visible = false;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!fallingRef.current) {
        pos += SPEED * dt;
        if (pos > width + rightGap + OFFSCREEN) pos = startPos();
      }
      place();
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (raf || reduce.matches || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    measure();
    pos = reduce.matches ? width * 0.06 : startPos();
    place();
    walker.style.visibility = 'visible';

    const onResize = () => {
      measure();
      place();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(box);
    window.addEventListener('resize', onResize);
    // Only walk while the road is on screen
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
      else stop();
    });
    intersection.observe(box);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [count, roadHeight]);

  const trip = () => {
    if (fallingRef.current || reducedRef.current) return;
    fallingRef.current = true;
    setFalling(true);
  };

  return (
    <div ref={boxRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: roadHeight }}>
      <div
        ref={walkerRef}
        onPointerDown={trip}
        className="pointer-events-auto invisible absolute left-0 top-0 cursor-pointer touch-manipulation select-none will-change-transform"
        style={{ padding: HIT }}
      >
        <svg
          width={FIG_W}
          height={FIG_H}
          viewBox="0 0 24 40"
          className={`walker overflow-visible ${falling ? 'walker-falling' : ''}`}
          style={{ transformOrigin: '50% 100%' }}
          onAnimationEnd={(e) => {
            if (e.animationName === 'walker-fall') {
              fallingRef.current = false;
              setFalling(false);
            }
          }}
        >
          <g fill="none" stroke="#ff8c42" strokeWidth={3} strokeLinecap="round">
            <line className="walker-leg" x1={12} y1={24} x2={12} y2={38} />
            <line className="walker-leg walker-leg-back" x1={12} y1={24} x2={12} y2={38} />
            <line x1={12} y1={11} x2={12} y2={24} />
            <line className="walker-arm" x1={12} y1={14} x2={12} y2={22} />
            <line className="walker-arm walker-arm-back" x1={12} y1={14} x2={12} y2={22} />
          </g>
          <circle cx={13} cy={6} r={4.5} fill="#ff8c42" />
        </svg>
      </div>
    </div>
  );
}
