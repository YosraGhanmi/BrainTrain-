'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import DoodleBackdrop from '@/components/effects/DoodleBackdrop';
import { METHOD_ILLUSTRATIONS } from '@/components/method/MethodIllustrations';
import type { LocalizedString, MethodContent } from '@/lib/content/types';
import type { AppLocale } from '@/i18n/routing';

gsap.registerPlugin(ScrollTrigger);

// One colour per card, matched to its illustration and taken from the
// programme cards' palette: blue (magnifying glass), lavender (laptop),
// orange (bricks), teal (trophy). `color` draws the sparkle and the bottom
// bar, `tint` the soft blob behind the illustration.
const CARD_STYLES: { color: string; tint: string }[] = [
  { color: '#3d7fff', tint: '#dfe9ff' },
  { color: '#7b91f4', tint: '#e6e9ff' },
  { color: '#ff8c42', tint: '#ffe6d4' },
  { color: '#2ec4b6', tint: '#d5f3ef' },
];

// Dock-style magnify: the card under the cursor grows by up to MAGNIFY_SCALE
// and lifts MAGNIFY_LIFT px, its neighbours less the further they are. A
// clicked card is "focused": it grows by FOCUS_SCALE while the others blur.
const MAGNIFY_SCALE = 0.07;
const MAGNIFY_LIFT = 8;
const FOCUS_SCALE = 0.1;
const FOCUS_MS = 400;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function MethodSection({ method }: { method: MethodContent }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('method');
  const locale = useLocale() as AppLocale;
  const text = (value: LocalizedString) => value[locale] || value.en;
  const intro = text(method.intro);

  // The magnify runs outside React: each frame eases every card's current
  // factor toward its target and writes the transform straight to the DOM,
  // so it follows the cursor smoothly without re-rendering the section.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetRef = useRef<number[]>([]);
  const curRef = useRef<number[]>([]);
  const rafRef = useRef(0);
  const [open, setOpen] = useState<number | null>(null);
  // True for the length of the focus transition after closing, so the
  // cards ease back instead of snapping
  const [settling, setSettling] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const paint = useCallback(() => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const f = curRef.current[i] ?? 0;
      el.style.transform = f ? `translateY(${-MAGNIFY_LIFT * f}px) scale(${1 + MAGNIFY_SCALE * f})` : '';
    });
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current) return;
    const step = () => {
      let moving = false;
      cardRefs.current.forEach((_, i) => {
        const target = targetRef.current[i] ?? 0;
        const cur = curRef.current[i] ?? 0;
        const d = target - cur;
        if (Math.abs(d) > 0.001) {
          curRef.current[i] = cur + d * 0.2;
          moving = true;
        } else {
          curRef.current[i] = target;
        }
      });
      paint();
      rafRef.current = moving ? requestAnimationFrame(step) : 0;
    };
    rafRef.current = requestAnimationFrame(step);
  }, [paint]);

  const onCardsMove = (e: React.MouseEvent) => {
    if (open !== null || settling) return;
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    // Only while the four cards sit in one row: on two-column layouts the
    // falloff would spill into the other row
    const slots = cardRefs.current.map((el) => el?.parentElement?.getBoundingClientRect());
    if (slots.some((r) => !r || Math.abs(r.top - slots[0]!.top) > 2)) return;
    targetRef.current = slots.map((r) => {
      // Measured on the list items, which never scale, so the peak tracks
      // the cursor without feedback jitter
      const dist = Math.abs(e.clientX - (r!.left + r!.width / 2));
      const f = Math.max(0, 1 - dist / (r!.width * 2));
      return f * f * (3 - 2 * f); // smoothstep falloff
    });
    startLoop();
  };

  const onCardsLeave = () => {
    if (open !== null) return;
    targetRef.current = [];
    startLoop();
  };

  const close = useCallback(() => {
    setOpen(null);
    setSettling(true);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettling(false), FOCUS_MS);
  }, []);

  const toggle = (i: number) => (open === i ? close() : setOpen(i));

  // Focus and unfocus: the transform eases through the CSS transition that is
  // switched on while a card is open or settling
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    curRef.current = cardRefs.current.map((_, i) => (i === open ? FOCUS_SCALE / MAGNIFY_SCALE : 0));
    targetRef.current = [...curRef.current];
    paint();
  }, [open, paint]);

  // While a card is open, a click anywhere else or Escape closes it
  useEffect(() => {
    if (open === null) return;
    const onPointer = (e: PointerEvent) => {
      if (!cardRefs.current.some((el) => el?.contains(e.target as Node))) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(settleTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.method-intro',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.method-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          // Leave no inline transform on the list items once they are in
          clearProps: 'transform',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-surface px-6 py-24 md:px-10 lg:px-16">
      <DoodleBackdrop />
      <div className="relative mx-auto max-w-7xl">
        <h2 className="method-intro text-center font-display text-4xl font-extrabold leading-tight tracking-tight text-[#0b1a3a] sm:text-6xl">
          {text(method.heading)}
        </h2>
        {intro ? (
          <p className="method-intro mx-auto mt-5 max-w-2xl text-balance text-center text-lg leading-snug text-[#0b1a3a]/70 sm:text-2xl">
            {intro.split(/\*(.+?)\*/).map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-bold text-[#0b1a3a]">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        ) : null}

        <ol
          className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:gap-3"
          onMouseMove={onCardsMove}
          onMouseLeave={onCardsLeave}
        >
          {method.steps.map((step, i) => {
            const { color, tint } = CARD_STYLES[i % CARD_STYLES.length];
            const Illustration = METHOD_ILLUSTRATIONS[i % METHOD_ILLUSTRATIONS.length];
            const focused = open === i;
            const dimmed = open !== null && !focused;
            return (
              <Fragment key={i}>
                {i > 0 ? (
                  <li aria-hidden="true" className="hidden items-center text-[#0b1a3a]/25 xl:flex">
                    <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                  </li>
                ) : null}
                <li className="method-card relative flex">
                  <div
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={focused}
                    onClick={() => toggle(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(i);
                      }
                    }}
                    style={{
                      transition:
                        `filter ${FOCUS_MS}ms ${EASE}, opacity ${FOCUS_MS}ms ${EASE}, box-shadow 300ms ${EASE}` +
                        (open !== null || settling ? `, transform ${FOCUS_MS}ms ${EASE}` : ''),
                      filter: dimmed ? 'blur(2px)' : undefined,
                      opacity: dimmed ? 0.55 : undefined,
                    }}
                    className={`group relative flex w-full cursor-pointer flex-col items-center rounded-[1.75rem] border-2 border-[#0b1a3a]/10 bg-white px-6 pb-7 pt-6 text-center will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b1a3a] ${focused ? 'z-10 shadow-[0_34px_70px_rgba(11,26,58,0.24)]' : 'shadow-[0_18px_40px_rgba(11,26,58,0.10)] hover:shadow-[0_26px_50px_rgba(11,26,58,0.16)]'}`}
                  >
                    {/* The illustration on a soft blob in the card's tint, with a
                        little three-stroke sparkle off its top right */}
                    <div className="relative mt-2 flex h-36 w-full items-center justify-center" aria-hidden="true">
                      <div className="absolute h-24 w-44 rounded-[50%] blur-lg" style={{ backgroundColor: tint }} />
                      <Illustration className="relative h-32 w-32 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:scale-105" />
                      <svg viewBox="0 0 24 24" className="absolute right-[18%] top-1 h-6 w-6" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
                        <path d="M8 10L6 3M12 13l6-6M14 18l7-1" />
                      </svg>
                    </div>

                    <h3 className="mt-5 font-display text-xl font-extrabold leading-tight text-[#0b1a3a]">{text(step.title)}</h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-[#0b1a3a]/65">{text(step.body)}</p>
                    {/* Pinned to the bottom so the bars line up across cards */}
                    <div className="mt-auto pt-7">
                      <span className="block h-1 w-20 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ol>

        <div className="mt-12 flex justify-center">
          <Link
            href="/parent-portal/login"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#0b1a3a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
