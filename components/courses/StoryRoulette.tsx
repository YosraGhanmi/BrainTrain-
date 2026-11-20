'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { two } from '@/components/courses/story-parts';
import { puzzleGrid } from '@/components/courses/puzzle';

type Item = { title: string; body: string };

// The wheel: a large circle whose right-hand arc shows at the left of the
// screen, the numbers set around it STEP degrees apart. How much of it shows
// is --wheel-x, set on the stage.
const RADIUS = 430;
const STEP = 32;
const LABEL_GAP = 30;
// Scroll distance per item, in screen heights
const SCROLL_PER_ITEM = 0.8;
// How far an item one step away sits from the middle, in screen heights:
// past the bottom edge (coming) or the top edge (gone)
const TRAVEL = 0.62;
// On the way in, the text under a title trails behind it by this much more
const BODY_LAG = 0.45;
// Each item's colour, bright enough to read on navy; they repeat past six
const PALETTE = ['#5b8cff', '#ff8c42', '#2ec4b6', '#ff5d73', '#ffc145', '#a78bfa'];
// Each puzzle piece is drawn, line by line, over this share of the scroll
// leading up to its item, so it is finished when its text arrives. The
// first is drawn as the section comes into view.
const DRAW = 0.8;
// Items to screen heights of scroll
const TRAVEL_TO_SCROLL = SCROLL_PER_ITEM;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// A story section on larger screens, like a roulette: it stays on screen
// while you scroll and the wheel turns. Each item rides up with the scroll,
// from the bottom of the screen to the middle (when its number reaches the
// dot) and on out of the top; the text under its title follows a moment
// behind. Behind it on the right, a puzzle is drawn in fine lines, one
// piece per item. A
// number can be clicked to turn to it. The section's heading sits above it,
// outside. `dark` is for a section on the navy background.
export default function StoryRoulette({ items, dark = false }: { items: Item[]; dark?: boolean }) {
  const line = dark ? '255,255,255' : '15,31,77';
  const sectionRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<SVGSVGElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const spokeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pieceRefs = useRef<(SVGGElement | null)[]>([]);
  const edgeRefs = useRef<(SVGPathElement | null)[]>([]);
  const numberRefs = useRef<(SVGTextElement | null)[]>([]);
  const penRefs = useRef<(SVGCircleElement | null)[]>([]);
  const count = items.length;
  const colorOf = (i: number) => PALETTE[i % PALETTE.length];
  const puzzle = useMemo(() => puzzleGrid(count), [count]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;

    // A line `d` items away from the middle: where it sits and how clear
    const place = (el: HTMLElement | null, d: number) => {
      if (!el) return;
      const y = d * TRAVEL * window.innerHeight;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      // Sharp and clear around the middle, blurring and fading out towards
      // the screen edges
      el.style.opacity = String(Math.max(0, Math.min(1, 1.6 - Math.abs(d) * 1.6)));
      const blur = Math.min(12, Math.max(0, Math.abs(d) - 0.08) * 16);
      el.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
    };

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight, 1);
      // Where the wheel is, in items: 0 = the first at the dot. `ahead`
      // runs on below 0 while the section is still coming into view.
      const ahead = (-rect.top / travel) * Math.max(count - 1, 0);
      const pos = Math.min(Math.max(ahead, 0), Math.max(count - 1, 0));
      const current = Math.round(pos);
      if (dialRef.current) dialRef.current.style.transform = `rotate(${-pos * STEP}deg)`;
      if (dotRef.current) {
        const c = colorOf(current);
        dotRef.current.style.backgroundColor = c;
        dotRef.current.style.boxShadow = `0 0 0 6px ${c}40, 0 0 24px ${c}`;
      }
      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const near = 1 - Math.min(Math.abs(d), 1);
        const spoke = spokeRefs.current[i];
        if (spoke) spoke.style.transform = `rotate(${d * STEP}deg)`;
        const label = labelRefs.current[i];
        if (label) {
          label.style.transform = `translateY(-50%) scale(${0.78 + 0.42 * near})`;
          label.style.opacity = String(0.3 + 0.7 * near);
        }
        place(titleRefs.current[i], d);
        // Coming up from below, the text trails its title; once in place
        // they leave together
        place(bodyRefs.current[i], d > 0 ? d * (1 + BODY_LAG) : d);
        // The glow behind the puzzle takes the colour of the item in view
        const glow = glowRefs.current[i];
        if (glow) glow.style.opacity = String(near);

        // The piece, drawn along its outline with a pen dot at the tip
        const t =
          i === 0
            ? clamp((ahead * TRAVEL_TO_SCROLL + 0.5) / 0.5)
            : clamp((pos - (i - 1) - (1 - DRAW)) / DRAW);
        const on = i === current;
        const edge = edgeRefs.current[i];
        if (edge) {
          edge.style.strokeDashoffset = String(1 - t);
          edge.style.opacity = t > 0 ? '1' : '0';
        }
        const piece = pieceRefs.current[i];
        if (piece) piece.style.opacity = on ? '0.9' : '0.38';
        const number = numberRefs.current[i];
        if (number) number.style.opacity = String(clamp((t - 0.75) / 0.25));
        const pen = penRefs.current[i];
        if (pen && edge) {
          const drawing = t > 0.005 && t < 0.98;
          pen.style.opacity = drawing ? '1' : '0';
          if (drawing) {
            const pt = edge.getPointAtLength(t * edge.getTotalLength());
            pen.setAttribute('cx', String(pt.x));
            pen.setAttribute('cy', String(pt.y));
          }
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [count]);

  // Scroll to the point where item i sits at the dot
  const goTo = useCallback(
    (i: number) => {
      const section = sectionRef.current;
      if (!section || count < 2) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const travel = section.offsetHeight - window.innerHeight;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: top + (i / (count - 1)) * travel, behavior: smooth ? 'smooth' : 'auto' });
    },
    [count],
  );

  return (
    <div ref={sectionRef} className="relative" style={{ height: `${100 + Math.max(count - 1, 0) * SCROLL_PER_ITEM * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden" style={{ '--wheel-x': 'min(22vw, 360px)' } as React.CSSProperties}>
        {/* One glow per item, behind the puzzle, crossfading as you scroll */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {items.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                glowRefs.current[i] = el;
              }}
              className="absolute -right-48 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, ${colorOf(i)}55, transparent 62%)`, opacity: i === 0 ? 1 : 0 }}
            />
          ))}
        </div>

        {/* The puzzle, faint in the background: each piece's outline is
            drawn in as its item comes up */}
        <svg
          aria-hidden
          viewBox={puzzle.viewBox}
          className="pointer-events-none absolute right-[4vw] top-1/2 w-[min(40vw,38rem)] -translate-y-1/2 overflow-visible"
        >
          {puzzle.pieces.map((p, i) => (
            <g
              key={i}
              ref={(el) => {
                pieceRefs.current[i] = el;
              }}
              className="transition-opacity duration-500"
              style={{ opacity: 0.38 }}
            >
              <path
                ref={(el) => {
                  edgeRefs.current[i] = el;
                }}
                d={p.d}
                pathLength={1}
                fill="none"
                stroke={colorOf(i)}
                strokeWidth={0.7}
                strokeLinejoin="round"
                strokeDasharray="1 1"
                style={{ strokeDashoffset: 1, opacity: 0 }}
              />
              <text
                ref={(el) => {
                  numberRefs.current[i] = el;
                }}
                x={p.cx}
                y={p.cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-display"
                fontSize={34}
                fontWeight={600}
                fill="none"
                stroke={colorOf(i)}
                strokeWidth={0.5}
                style={{ opacity: 0 }}
              >
                {two(i + 1)}
              </text>
              <circle
                ref={(el) => {
                  penRefs.current[i] = el;
                }}
                r={1.6}
                fill="#ffffff"
                style={{ opacity: 0, filter: `drop-shadow(0 0 3px ${colorOf(i)})` }}
              />
            </g>
          ))}
        </svg>

        {/* The wheel, drawn for the eye only: the items are read out below */}
        <div aria-hidden>
          <svg
            ref={dialRef}
            viewBox={`${-RADIUS} ${-RADIUS} ${2 * RADIUS} ${2 * RADIUS}`}
            className="absolute overflow-visible will-change-transform"
            style={{ left: `calc(var(--wheel-x) - ${2 * RADIUS}px)`, top: `calc(50% - ${RADIUS}px)`, width: 2 * RADIUS, height: 2 * RADIUS }}
          >
            <circle r={RADIUS} fill="none" stroke={`rgba(${line},${dark ? 0.28 : 0.18})`} strokeWidth={1.25} />
          </svg>
          <span
            ref={dotRef}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,box-shadow] duration-300"
            style={{ left: 'var(--wheel-x)', top: '50%', backgroundColor: colorOf(0) }}
          />
          {items.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                spokeRefs.current[i] = el;
              }}
              className="absolute h-0 w-0 will-change-transform"
              style={{ left: `calc(var(--wheel-x) - ${RADIUS}px)`, top: '50%', transform: `rotate(${i * STEP}deg)` }}
            >
              <button
                type="button"
                tabIndex={-1}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                onClick={() => goTo(i)}
                className="absolute origin-left whitespace-nowrap font-display text-5xl font-semibold tabular-nums"
                style={{ left: RADIUS + LABEL_GAP, top: 0, transform: 'translateY(-50%)', color: colorOf(i) }}
              >
                {two(i + 1)}
              </button>
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center gap-12 pr-[5vw] xl:gap-16" style={{ left: 'calc(var(--wheel-x) + 9rem)' }}>
          {/* The items riding up through the middle */}
          <div aria-hidden className="relative h-full min-w-0 flex-1">
            {items.map((p, i) => (
              <div key={i} className="absolute inset-x-0 top-1/2 max-w-2xl -translate-y-1/2">
                <h3
                  ref={(el) => {
                    titleRefs.current[i] = el;
                  }}
                  className={`text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight will-change-transform xl:text-5xl ${dark ? 'text-white' : 'text-navy'}`}
                  style={{ transform: `translate3d(0, ${i * TRAVEL * 100}vh, 0)` }}
                >
                  <span className="mb-5 block h-1.5 w-14 rounded-full" style={{ backgroundColor: colorOf(i) }} />
                  {p.title}
                </h3>
                {p.body ? (
                  <p
                    ref={(el) => {
                      bodyRefs.current[i] = el;
                    }}
                    className={`mt-6 max-w-xl text-lg leading-relaxed will-change-transform xl:text-xl ${dark ? 'text-white/75' : 'text-stone'}`}
                    style={{ transform: `translate3d(0, ${i * TRAVEL * (1 + BODY_LAG) * 100}vh, 0)` }}
                  >
                    {p.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Every item, for screen readers */}
          <ol className="sr-only">
            {items.map((p, i) => (
              <li key={i}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
