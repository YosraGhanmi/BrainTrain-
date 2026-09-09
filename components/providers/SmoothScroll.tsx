'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Sections with their own fixed-sidebar app shell (a `main` with its own
// `overflow-y-auto`, not the window) rather than a normal scrolling page.
// Lenis hijacks wheel events to smooth-scroll the window/html, which starves
// these internal scroll containers of wheel input — scrollbar dragging still
// works, but the mouse wheel appears dead. Locale-prefixed routes (e.g.
// `/fr/parent-portal/...`) need the locale segment stripped before matching.
const APP_SHELL_PREFIXES = ['/admin', '/parent-portal', '/teacher'];

function hasAppShell(pathname: string | null): boolean {
  if (!pathname) return false;
  const unlocalized = pathname.replace(/^\/(en|fr)(?=\/|$)/, '') || '/';
  return APP_SHELL_PREFIXES.some((prefix) => unlocalized.startsWith(prefix));
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell = hasAppShell(pathname);

  useEffect(() => {
    if (isAppShell) return;
    // Scroll-jacking is exactly the kind of motion prefers-reduced-motion
    // asks sites to skip — native scroll remains fully functional without it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(update);
    };
  }, [isAppShell]);

  return <>{children}</>;
}
