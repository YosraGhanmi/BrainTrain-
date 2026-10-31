'use client';

import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

// A card that flips in 3D between photos (after Originkit's Flip Gallery):
// click its right half for the next photo, its left half for the previous
// one, or focus it and use the arrow keys. The card tilts away from the
// cursor. Two faces, front and back, each
// get the photo that should show next, so any number of photos flips with
// just two images in the DOM.

const HALF_TURN = 180;
const TILT_LIMIT = 10; // degrees
// Kept small so the tilted card doesn't hide the pulsing border around it
const TILT_SCALE = 1.02;

export default function FlipGallery({ images, label }: { images: string[]; label: string }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [angle, setAngle] = useState(0);
  const [index, setIndex] = useState(0);
  const [faces, setFaces] = useState({ a: 0, b: 0 });
  const count = images.length;

  // Which face is towards the viewer at a given rotation
  const facing = (deg: number) => (Math.abs(Math.round(deg / HALF_TURN)) % 2 === 0 ? 'a' : 'b');

  const flip = (dir: 1 | -1) => {
    if (count < 2) return;
    const next = (index + dir + count) % count;
    const nextAngle = angle + dir * HALF_TURN;
    setFaces((f) => ({ ...f, [facing(nextAngle)]: next }));
    setIndex(next);
    setAngle(nextAngle);
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    flip(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
  };

  // Tilt away from the cursor; mouse only, and not for reduced motion
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    const { width, height, top, left } = el.getBoundingClientRect();
    const tiltX = -((e.clientY - top) / height - 0.5) * TILT_LIMIT * 2;
    const tiltY = ((e.clientX - left) / width - 0.5) * TILT_LIMIT * 2;
    el.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${TILT_SCALE}, ${TILT_SCALE}, ${TILT_SCALE})`;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      flip(e.key === 'ArrowRight' ? 1 : -1);
    }
  };

  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = '';
  };

  const face = (slot: number, back: boolean) => (
    <div
      className="absolute inset-0 overflow-hidden rounded-[2rem] bg-[#0b1a3a] shadow-[0_40px_80px_-30px_rgba(11,26,58,0.45)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
      style={back ? { transform: 'rotateY(180deg)' } : undefined}
    >
      <Image
        src={images[slot % count]}
        alt=""
        fill
        priority={slot === 0}
        draggable={false}
        sizes="(min-width: 1024px) 460px, 90vw"
        className="pointer-events-none select-none object-cover"
      />
    </div>
  );

  return (
    // Landscape, the shape of the photos themselves, inside a border that
    // pulses blue to red (.about-pulse in globals.css)
    <div className="relative aspect-[3/2] [perspective:900px]">
      <div aria-hidden="true" className="about-pulse pointer-events-none absolute -inset-2 rounded-[2.4rem] border-2 sm:-inset-2.5" />
      <div
        ref={tiltRef}
        role={count > 1 ? 'group' : undefined}
        aria-label={count > 1 ? label : undefined}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={onKeyDown}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        className={`relative h-full w-full rounded-[2rem] transition-transform duration-200 ease-out [transform-style:preserve-3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[14px] focus-visible:outline-[#0b1a3a] ${count > 1 ? 'cursor-pointer' : ''}`}
      >
        <motion.div
          animate={{ rotateY: angle }}
          transition={reduceMotion ? { duration: 0 } : { type: 'tween', duration: 0.6, ease: 'easeInOut' }}
          className="relative h-full w-full [transform-style:preserve-3d]"
        >
          {face(faces.a, false)}
          {face(faces.b, true)}
        </motion.div>
        {/* Tells screen readers which photo is showing after a flip */}
        {count > 1 ? (
          <p aria-live="polite" className="sr-only">
            {index + 1} / {count}
          </p>
        ) : null}
      </div>
    </div>
  );
}
