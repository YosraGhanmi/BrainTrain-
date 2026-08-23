// Arrow reveal button — adapted from an Originkit "Arrow Reveal Button" pattern.
// A pill with a small circular arrow badge that, on hover, expands to cover the
// whole pill while the arrow glides to center and the label nudges aside.
'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useAnimate, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

type Props = {
  label: string;
  href: string;
  fill?: string;
  textColor?: string;
  badgeColor?: string;
  iconColor?: string;
  badgeSize?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export default function ArrowRevealButton({
  label,
  href,
  fill = '#ffffff',
  textColor = '#0b1a3a',
  badgeColor = '#ff8c42',
  iconColor = '#ffffff',
  badgeSize = 32,
  className,
  onClick,
}: Props) {
  const [scope, animate] = useAnimate();
  const btnRef = useRef<HTMLAnchorElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const hoverScale = useRef(1);
  const reducedMotion = useReducedMotion();

  // Measures the pill, places the badge at the slot's in-flow position, and
  // works out how far it must scale to cover the farthest corner from there —
  // so the reveal always fully floods the button regardless of label length.
  useLayoutEffect(() => {
    const btn = btnRef.current;
    const slot = slotRef.current;
    const badge = badgeRef.current;
    const arrow = arrowRef.current;
    if (!btn || !slot || !badge || !arrow) return;

    const measure = () => {
      const w = btn.offsetWidth;
      const h = btn.offsetHeight;
      if (!w || !h) return;
      const rb = badgeSize / 2;
      const cx = slot.offsetLeft + slot.offsetWidth / 2;
      const cy = slot.offsetTop + slot.offsetHeight / 2;
      const far = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      hoverScale.current = badgeSize > 0 ? (2 * far * 1.02) / badgeSize : 1;

      badge.style.left = `${cx}px`;
      badge.style.top = `${cy}px`;
      badge.style.marginLeft = `${-rb}px`;
      badge.style.marginTop = `${-rb}px`;

      const arrowSize = badgeSize * 0.55;
      arrow.style.left = `${cx}px`;
      arrow.style.top = `${cy}px`;
      arrow.style.marginLeft = `${-arrowSize / 2}px`;
      arrow.style.marginTop = `${-arrowSize / 2}px`;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(btn);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [badgeSize]);

  const opts = reducedMotion ? { duration: 0 } : { duration: 0.46, ease: [0.44, 0, 0.56, 1] as const };

  const onEnter = () => {
    if (badgeRef.current) animate(badgeRef.current, { scale: hoverScale.current }, opts);
    if (arrowRef.current) animate(arrowRef.current, { rotate: -45 }, opts);
    if (textRef.current) animate(textRef.current, { x: 8 }, opts);
  };
  const onLeave = () => {
    if (badgeRef.current) animate(badgeRef.current, { scale: 1 }, opts);
    if (arrowRef.current) animate(arrowRef.current, { rotate: 0 }, opts);
    if (textRef.current) animate(textRef.current, { x: 0 }, opts);
  };

  return (
    <span ref={scope} className={`relative inline-flex ${className ?? ''}`}>
      <Link
        ref={btnRef}
        href={href}
        onClick={onClick}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        className="relative flex items-center gap-3 overflow-hidden rounded-full py-2 pl-5 pr-2 text-xs font-bold uppercase tracking-wide"
        style={{ background: fill, boxShadow: '0 10px 24px rgba(0,0,0,0.16)' }}
      >
        <span ref={textRef} className="relative z-[1]" style={{ color: textColor }}>
          {label}
        </span>

        {/* footprint in flow — the badge itself is absolute and scales past it */}
        <span ref={slotRef} aria-hidden className="block flex-none" style={{ width: badgeSize, height: badgeSize }} />

        <span
          ref={badgeRef}
          aria-hidden
          className="pointer-events-none absolute z-[2] rounded-full"
          style={{ width: badgeSize, height: badgeSize, background: badgeColor }}
        />

        <span
          ref={arrowRef}
          aria-hidden
          className="pointer-events-none absolute z-[3] flex items-center justify-center"
          style={{ width: badgeSize * 0.55, height: badgeSize * 0.55, color: iconColor }}
        >
          <ArrowRight className="h-full w-full" strokeWidth={2.25} />
        </span>
      </Link>
    </span>
  );
}
