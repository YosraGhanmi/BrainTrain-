'use client';

import { useLayoutEffect, useRef } from 'react';
import { useAnimate, useReducedMotion, type AnimationPlaybackControls, type Transition } from 'framer-motion';

const DEFAULT_TRANSITION: Transition = { type: 'tween', ease: 'easeInOut', duration: 0.45 };

type RadialRevealProps = {
  href?: string;
  boxClassName?: string;
  faceClassName?: string;
  restColorClassName?: string;
  hoverColorClassName?: string;
  transition?: Transition;
  children: React.ReactNode;
};

export default function RadialReveal({
  href,
  boxClassName = '',
  faceClassName = '',
  restColorClassName = '',
  hoverColorClassName = '',
  transition = DEFAULT_TRANSITION,
  children,
}: RadialRevealProps) {
  const [scope, animate] = useAnimate();
  const overlayRef = useRef<HTMLSpanElement>(null);
  const clipCtrl = useRef<AnimationPlaybackControls | null>(null);
  const reducedMotion = useReducedMotion();
  const clip = useRef({ r: 0, x: 100, y: 100, max: 160 });

  const applyClip = () => {
    const el = overlayRef.current;
    if (!el) return;
    const { r, x, y } = clip.current;
    el.style.clipPath = `circle(${r}% at ${x}% ${y}%)`;
  };

  const anchorTo = (e: React.PointerEvent) => {
    const el = overlayRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const unit = Math.hypot(r.width, r.height) / Math.SQRT2;
    const far = Math.max(
      Math.hypot(px, py),
      Math.hypot(r.width - px, py),
      Math.hypot(px, r.height - py),
      Math.hypot(r.width - px, r.height - py)
    );
    clip.current.x = (px / r.width) * 100;
    clip.current.y = (py / r.height) * 100;
    clip.current.max = (far / unit) * 100 + 2;
  };

  const growTo = (to: number) => {
    clipCtrl.current?.stop();
    if (reducedMotion) {
      clip.current.r = to;
      applyClip();
      return;
    }
    clipCtrl.current = animate(clip.current.r, to, {
      ...(transition as any),
      onUpdate: (v: number) => {
        clip.current.r = v;
        applyClip();
      },
    });
  };

  const onEnter = (e: React.PointerEvent) => {
    anchorTo(e);
    applyClip();
    growTo(clip.current.max);
  };

  const onLeave = (e: React.PointerEvent) => {
    if (clip.current.r >= clip.current.max - 0.5) {
      anchorTo(e);
      clip.current.r = clip.current.max;
      applyClip();
    }
    growTo(0);
  };

  useLayoutEffect(() => {
    applyClip();
    return () => clipCtrl.current?.stop();
  }, []);

  const Tag = (href ? 'a' : 'button') as 'a' | 'button';

  return (
    <Tag
      ref={scope as any}
      href={href}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={`relative inline-flex overflow-hidden ${boxClassName}`}
    >
      <span className={`relative ${faceClassName} ${restColorClassName}`}>{children}</span>
      <span
        ref={overlayRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${faceClassName} justify-center ${hoverColorClassName}`}
        style={{ clipPath: 'circle(0% at 100% 100%)' }}
      >
        {children}
      </span>
    </Tag>
  );
}
