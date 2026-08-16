'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks whether the tab is actually being looked at.
 *
 * The live screens (kitchen, cashier, waiter, notifications, monitoring) all
 * polled on a fixed interval that kept running while the tab sat in the
 * background, so a day-long open tab generated thousands of pointless
 * authenticated requests.
 */
export function useIsDocumentVisible(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const update = () => setIsVisible(document.visibilityState === 'visible');
    update();

    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return isVisible;
}

/**
 * Poll interval for react-query that pauses when the tab is hidden.
 *
 * Pass the result straight to `refetchInterval`. Returns `false` while hidden,
 * which react-query treats as "do not poll"; polling resumes on return, and
 * the query refetches once immediately because the data has gone stale.
 */
export function useVisiblePollInterval(intervalMs: number): number | false {
  const isVisible = useIsDocumentVisible();
  return isVisible ? intervalMs : false;
}
