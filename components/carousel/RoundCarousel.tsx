// Round Carousel — Originkit
"use client";

import { useEffect, useRef, useMemo } from "react";

// Combined next/image default deviceSizes + imageSizes (next.config.js sets no override).
const NEXT_IMAGE_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

// Route local uploads through Next's image optimizer so the browser decodes/
// composites a properly-sized asset instead of the raw admin-uploaded file
// (which can be several MB / 2000px+) — that's what made the 3D rotation janky.
function optimizedSrc(src: string, displayWidth: number): string {
  if (!src.startsWith("/")) return src; // remote/absolute URLs pass through untouched
  const target = displayWidth * 2; // headroom for retina without going full-res
  const width = NEXT_IMAGE_WIDTHS.find((w) => w >= target) ?? NEXT_IMAGE_WIDTHS[NEXT_IMAGE_WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=70`;
}

interface RoundCarouselImage {
  src: string;
}

interface RoundCarouselProps {
  images?: RoundCarouselImage[];
  imageWidth?: number;
  imageHeight?: number;
  spacing?: number;
  speed?: number;
  direction?: "right" | "left";
  drag?: boolean;
  sensitivity?: number;
  tilt?: number;
  perspective?: number;
  cornerRadius?: number;
  innerDim?: number;
  background?: string;
  style?: React.CSSProperties;
}

const DEFAULT_IMAGES: RoundCarouselImage[] = [
  { src: "/ach/ALL.jpg" },
  { src: "/ach/h.jpg" },
  { src: "/ach/hh.jpg" },
  { src: "/ach/j.jpg" },
  { src: "/ach/jk.jpg" },
  { src: "/ach/ml.jpg" },
  { src: "/ach/oman.jpg" },
  { src: "/ach/t.jpg" },
  { src: "/ach/w.jpg" },
  { src: "/ach/win.jpg" },
  { src: "/ach/winnn.jpg" },
  { src: "/ach/ww.png" },
];

export default function RoundCarousel({
  images = DEFAULT_IMAGES,
  imageWidth = 300,
  imageHeight = 300,
  spacing = 3,
  speed = 7,
  direction = "right",
  drag = true,
  sensitivity = 5,
  tilt = -7,
  perspective = 3000,
  cornerRadius = 22,
  innerDim = 3.5,
  background = "#000000",
  style = {},
}: RoundCarouselProps) {
  const items = images.length > 0 ? images : DEFAULT_IMAGES;
  const count = items.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const rotYRef = useRef(0);
  const velRef = useRef(0);
  const lastRef = useRef(0);
  const dragRef = useRef({ active: false, x: 0 });
  const visibleRef = useRef(true);

  const angle = 360 / count;
  const factor = 1 + spacing * 0.15;
  const radius = (imageWidth * factor) / (2 * Math.tan(Math.PI / count));
  const radiusPx = cornerRadius;
  const degPerSec = speed * 6 * (direction === "left" ? -1 : 1);

  // Pause the rAF loop entirely while the carousel is scrolled out of view —
  // it otherwise keeps spinning (and burning CPU/GPU) for the whole page lifetime.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const apply = () =>
      (ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`);
    apply();

    const draw = (now: number) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const f = Math.min(dt, 0.1);
      const d = dragRef.current;
      if (!d.active) {
        if (Math.abs(velRef.current) > 0.01) {
          rotYRef.current += velRef.current * f;
          velRef.current *= 0.94;
        } else {
          rotYRef.current += degPerSec * f;
        }
      }
      apply();
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [radius, degPerSec, count]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!drag) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, x: e.clientX };
    velRef.current = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    const k = 0.3 * sensitivity;
    rotYRef.current += dx * k;
    velRef.current = dx * k * 60;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current.active = false;
  };

  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radiusPx,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const resolvedSrcs = useMemo(
    () => items.map((img) => (img?.src ? optimizedSrc(img.src, imageWidth) : undefined)),
    [items, imageWidth]
  );

  return (
    <div
      ref={rootRef}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background,
        perspective: `${perspective}px`,
        cursor: drag ? "grab" : "default",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt}deg)`,
        }}
      >
        <div
          ref={ringRef}
          style={{
            position: "relative",
            width: imageWidth,
            height: imageHeight,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {items.map((img, i) => {
            const src = resolvedSrcs[i];
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    ...faceBase,
                    backgroundColor: src ? "transparent" : "#222",
                    backgroundImage: src ? `url(${src})` : undefined,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                  }}
                />
                <div
                  style={{
                    ...faceBase,
                    transform: "rotateY(180deg)",
                    backgroundColor: src ? "transparent" : "#181818",
                    backgroundImage: src ? `url(${src})` : undefined,
                    filter: `brightness(${innerDim / 10})`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
