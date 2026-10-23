'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the element is on (or within `rootMargin` of) the screen and the
 * tab is visible. Continuous animation loops gate on this so they stop
 * costing CPU/GPU when nobody can see them (requestAnimationFrame keeps
 * firing for off-screen elements, and timers keep firing in hidden tabs).
 */
export default function useActiveWhileVisible(
  ref: RefObject<Element | null>,
  rootMargin = '0px',
  // What to assume before the first observation. Pass true for content
  // that's server-rendered mid-animation (above the fold), so the SSR markup
  // isn't frozen until hydration.
  initiallyInView = false
): boolean {
  // A browser without IntersectionObserver (very old) is treated as on
  // screen, so animations still run rather than silently freezing. Only in a
  // browser: during SSR it's always missing, and assuming "on screen" there
  // would render lazily-gated content (e.g. image URLs) into the HTML.
  const [inView, setInView] = useState(
    () => initiallyInView || (typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined')
  );
  // Starts true to match the server render; a tab opened in the background
  // has its rAF and CSS animations suspended by the browser until it's shown
  // anyway, and every later change arrives through visibilitychange.
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  useEffect(() => {
    const onChange = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return inView && pageVisible;
}
