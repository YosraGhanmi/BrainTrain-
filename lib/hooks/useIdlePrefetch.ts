'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * Prefetches a list of routes during browser idle time, one at a time, so
 * navigating the app later feels instant without competing with the current
 * page's own load. Falls back to setTimeout on browsers without
 * requestIdleCallback (Safari).
 */
export default function useIdlePrefetch(hrefs: string[]) {
  const router = useRouter();

  useEffect(() => {
    if (hrefs.length === 0) return;

    let cancelled = false;
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1000);
    const cancelSchedule =
      typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback : window.clearTimeout;

    let handle: number;
    let index = 0;

    const prefetchNext = () => {
      if (cancelled || index >= hrefs.length) return;
      router.prefetch(hrefs[index]);
      index += 1;
      handle = schedule(prefetchNext);
    };

    handle = schedule(prefetchNext);

    return () => {
      cancelled = true;
      cancelSchedule(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrefs.join('|')]);
}
