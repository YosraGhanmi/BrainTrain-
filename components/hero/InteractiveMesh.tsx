'use client';

import { useEffect, useRef } from 'react';
import useActiveWhileVisible from '@/lib/hooks/useActiveWhileVisible';

// Dot grid settings
const DOT_SIZE = 0.7;
const SPACING = 26;
const GLOW_RADIUS = 50;
const MAX_DOT_RADIUS = DOT_SIZE + 1.4;
// Farthest from the cursor that a lit dot or the cursor wash paints. Moving
// the cursor only changes pixels inside this box around its old and new
// positions, so only those two boxes are ever repainted, never the whole grid.
const REACH = GLOW_RADIUS + MAX_DOT_RADIUS + 1;

type Point = { x: number; y: number };

function paintDots(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, glow: Point | null) {
  const fromX = Math.max(0, Math.ceil((x0 - MAX_DOT_RADIUS) / SPACING)) * SPACING;
  const fromY = Math.max(0, Math.ceil((y0 - MAX_DOT_RADIUS) / SPACING)) * SPACING;
  const lit: [number, number, number][] = [];

  // Every unlit dot shares one colour and size, so they go out as a single
  // path and a single fill instead of one fill per dot.
  ctx.fillStyle = 'rgba(11, 12, 16, 0.12)';
  ctx.beginPath();
  for (let x = fromX; x <= x1 + MAX_DOT_RADIUS; x += SPACING) {
    for (let y = fromY; y <= y1 + MAX_DOT_RADIUS; y += SPACING) {
      const proximity = glow ? Math.max(0, 1 - Math.hypot(x - glow.x, y - glow.y) / GLOW_RADIUS) : 0;
      if (proximity > 0) {
        lit.push([x, y, proximity * proximity]);
        continue;
      }
      ctx.moveTo(x + DOT_SIZE, y);
      ctx.arc(x, y, DOT_SIZE, 0, Math.PI * 2);
    }
  }
  ctx.fill();

  for (const [x, y, eased] of lit) {
    const radius = DOT_SIZE + eased * 1.4;
    const alpha = 0.12 + eased * 0.88;

    // Interpolate dot color from neutral ink to a vivid accent blue
    const r = Math.round(11 + (61 - 11) * eased);
    const g = Math.round(12 + (140 - 12) * eased);
    const b = Math.round(16 + (255 - 16) * eased);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (glow) {
    // Faint, tight ambient wash around the cursor
    const washRadius = GLOW_RADIUS * 0.9;
    const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, washRadius);
    gradient.addColorStop(0, 'rgba(61, 140, 255, 0.22)');
    gradient.addColorStop(1, 'rgba(61, 140, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(glow.x - washRadius, glow.y - washRadius, washRadius * 2, washRadius * 2);
  }
}

// Repaints just the box around `center`, with the glow at `glow`.
function paintBox(ctx: CanvasRenderingContext2D, center: Point, glow: Point | null) {
  const x = center.x - REACH;
  const y = center.y - REACH;
  const size = REACH * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.clearRect(x, y, size, size);
  paintDots(ctx, x, y, x + size, y + size, glow);
  ctx.restore();
}

export default function InteractiveMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Canvas-space position of the glow currently painted, kept across
  // resizes and across the hero leaving and re-entering the screen.
  const glowRef = useRef<Point | null>(null);
  const active = useActiveWhileVisible(canvasRef);

  // Size the backing store to the element and paint the whole grid. This is
  // the only full repaint; cursor movement after it touches two small boxes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      paintDots(ctx, 0, 0, canvas.width, canvas.height, glowRef.current);
    };
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Follow the cursor only while the hero is on screen, at most once per
  // frame, and only when it actually moved. Nothing runs while it's still.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;

    let pointer: Point | null = null;
    let frame = 0;

    const draw = () => {
      frame = 0;
      if (!pointer) return;
      const rect = canvas.getBoundingClientRect();
      const next = { x: pointer.x - rect.left, y: pointer.y - rect.top };
      const prev = glowRef.current;
      if (prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5) return;
      glowRef.current = next;
      if (prev) paintBox(ctx, prev, next);
      paintBox(ctx, next, next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const handleMouseMove = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    // Scrolling moves the grid under a still cursor, so the glow follows.
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame);
    };
  }, [active]);

  // Explicit w/h: `inset-0` alone doesn't stretch a replaced element like
  // <canvas>, it would stay at its 300x150 intrinsic size.
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}
