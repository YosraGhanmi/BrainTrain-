'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PartnersGridProps {
  logos: string[];
  perPage: number;
}

const SLIDE_MS = 450;

// Logo filenames are the only readable label we have for each partner (e.g.
// "/partners/American corner.png" -> "American corner") — used as alt text
// since these logos carry real information (who the partners are), not
// decoration.
function labelFromSrc(src: string): string {
  const file = src.split('/').pop() ?? '';
  return file.replace(/\.[a-zA-Z0-9]+$/, '');
}

// A row of `perPage` logos that the arrows slide one logo at a time, looping
// in both directions.
export default function PartnersGrid({ logos, perPage }: PartnersGridProps) {
  const count = logos.length;
  const canSlide = count > perPage;
  // The first `perPage` logos are repeated after the last one, so sliding past
  // the end shows the start again. Once that slide finishes, the track jumps
  // back to the real start with no transition: the same logos are on screen,
  // so the jump is invisible.
  const track = canSlide ? [...logos, ...logos.slice(0, perPage)] : logos;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  // One step at a time: clicks during a slide are ignored rather than queued.
  const sliding = useRef(false);

  // After an instant jump, turn transitions back on only once the jump has
  // been painted, so the next step slides instead of also jumping.
  useEffect(() => {
    if (animate) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setAnimate(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  const goNext = () => {
    if (!canSlide || sliding.current) return;
    sliding.current = true;
    setIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (!canSlide || sliding.current) return;
    sliding.current = true;
    if (index > 0) {
      setIndex(index - 1);
      return;
    }
    // At the real start: jump to the copy of it at the end, then slide back
    // one step from there.
    setAnimate(false);
    setIndex(count);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        setIndex(count - 1);
      })
    );
  };

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Ignore transitions bubbling up from the logos (their hover zoom)
    if (e.target !== e.currentTarget) return;
    sliding.current = false;
    if (index >= count) {
      setAnimate(false);
      setIndex(index - count);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
        {/* bg-surface: the transform makes this track its own layer, and the
            logos' mix-blend-multiply (which hides their white backgrounds)
            blends against this layer, so it must carry the page colour. */}
        <div
          className="flex items-center bg-surface"
          onTransitionEnd={onTransitionEnd}
          style={{
            transform: `translateX(-${(index * 100) / perPage}%)`,
            transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
          }}
        >
          {track.map((src, i) => {
            const isCopy = i >= count;
            return (
              <div
                key={`${src}-${i}`}
                aria-hidden={isCopy || undefined}
                className="flex shrink-0 justify-center px-3"
                style={{ width: `${100 / perPage}%` }}
              >
                <div className="relative h-24 w-full max-w-[160px] sm:h-32 sm:max-w-[190px]">
                  <Image
                    src={src}
                    alt={isCopy ? '' : labelFromSrc(src)}
                    fill
                    draggable={false}
                    sizes="190px"
                    className="object-contain mix-blend-multiply transition duration-300 hover:scale-105"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canSlide && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous partners"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0b1a3a]/15 text-ink transition hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next partners"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0b1a3a]/15 text-ink transition hover:border-accent hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
