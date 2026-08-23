'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { CalendarDays, Facebook, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TimelineEntry } from '@/lib/content/types';

gsap.registerPlugin(ScrollTrigger);

const NAVY = '#0b1a3a';

export default function MilestonesSection({ milestones }: { milestones: TimelineEntry[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // A one-time fill-in when the section enters view — not tied to scroll
      // progress (scrub), since the timeline now scrolls horizontally and a
      // vertical-scroll-driven fill made the line look stuck/cut off
      // depending on how far the row had been dragged.
      gsap.fromTo(
        '.milestone-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.utils.toArray('.milestone-node').forEach((node, index) => {
        const el = node as HTMLElement;
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Touch/pen already get smooth native momentum scrolling from
    // overflow-x-auto — only mouse users need a manual drag-to-scroll.
    if (e.pointerType !== 'mouse') return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    drag.current = { active: true, startX: e.clientX, startScroll: scroller.scrollLeft, moved: false };

    // Track the drag via window-level listeners rather than
    // setPointerCapture — capturing the pointer on the scroller redirects
    // the eventual click's target to the scroller itself instead of the
    // card under the cursor, which silently broke selecting any card.
    const handleMove = (ev: PointerEvent) => {
      if (!drag.current.active) return;
      const delta = ev.clientX - drag.current.startX;
      // A real drag moves well past normal mouse-click jitter (a few px is
      // common even on a "still" click) — too small a threshold here was
      // marking ordinary clicks as drags and blocking selection.
      if (Math.abs(delta) > 12) drag.current.moved = true;
      scroller.scrollLeft = drag.current.startScroll - delta;
    };
    const handleUp = () => {
      drag.current.active = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const scrollByCards = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 340, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 pb-40 pt-28 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-gold/10 blur-[130px]" />

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Scroll timeline left"
          className="absolute left-6 top-8 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-soft transition hover:bg-ink hover:text-white sm:flex md:left-10 lg:left-16"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Scroll timeline right"
          className="absolute right-6 top-8 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-soft transition hover:bg-ink hover:text-white sm:flex md:right-10 lg:right-16"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          className="relative left-1/2 w-screen -translate-x-1/2 cursor-grab overflow-x-auto scroll-smooth px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing md:px-10 lg:px-16 [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative w-max">
            <div className="milestone-line absolute left-0 top-[58px] hidden h-px w-full origin-left bg-ink/10 sm:block" />

            <div className="flex gap-6">
              {milestones.map((milestone, index) => {
                const isActive = active === index;
                return (
                  <div key={milestone.title} className="flex w-72 shrink-0 flex-col items-center gap-2 sm:w-80">
                    <span className="inline-flex items-center gap-2 text-sm font-display font-bold text-ink sm:text-base">
                      <CalendarDays className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
                      {milestone.date}
                    </span>
                    <span className="h-4 w-px bg-ink/15" />
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      className="relative z-10 mb-3 h-[18px] w-[18px] shrink-0 rounded-full border-4 bg-white transition"
                      style={{ borderColor: isActive ? NAVY : 'rgba(11,12,16,0.15)' }}
                      aria-label={`Show ${milestone.title}`}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!drag.current.moved) setActive(index);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setActive(index);
                      }}
                      className={`milestone-node relative flex h-64 w-full cursor-pointer select-none flex-col rounded-2xl border bg-white p-6 ${
                        milestone.logo ? 'pt-10' : ''
                      } text-left shadow-soft transition ${isActive ? 'border-ink/20' : 'border-ink/5'}`}
                      style={isActive ? { boxShadow: `0 0 0 2px ${NAVY}` } : undefined}
                    >
                      {milestone.logo ? (
                        <span className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white shadow-md">
                          <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" width={28} height={28} className="object-contain" />
                        </span>
                      ) : null}

                      <h3 className="shrink-0 font-display text-xl font-semibold text-ink sm:text-2xl">{milestone.title}</h3>

                      <div className="mt-3 flex-1 overflow-y-auto pr-1">
                        <p className="text-sm leading-relaxed text-stone">{isActive ? milestone.detail : milestone.summary}</p>
                      </div>

                      {milestone.facebookUrl ? (
                        <a
                          href={milestone.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="relative z-10 mt-3 inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#1877f2] transition hover:underline"
                        >
                          <Facebook className="h-3.5 w-3.5" />
                          View the post
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
