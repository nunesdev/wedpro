'use client';

import { useEffect, useRef } from 'react';
import { useQueueStore } from '@/store/queue-store';

/**
 * Single stable interval while a phase is active (called / preparing).
 * Does not re-create the interval on every tick.
 */
export function useCountdown() {
  const status = useQueueStore((s) => s.status);
  const onTimerExpire = useQueueStore((s) => s.onTimerExpire);
  const prevSecondsRef = useRef(-1);

  useEffect(() => {
    if (status === 'idle') return;

    const intervalId = window.setInterval(() => {
      const state = useQueueStore.getState();
      if (state.status === 'idle' || state.secondsLeft <= 0) return;
      state.tick();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const secondsLeft = useQueueStore((s) => s.secondsLeft);

  useEffect(() => {
    if (secondsLeft !== 0) {
      prevSecondsRef.current = secondsLeft;
      return;
    }
    if (status === 'idle' || prevSecondsRef.current <= 0) return;

    prevSecondsRef.current = 0;
    onTimerExpire();
  }, [secondsLeft, status, onTimerExpire]);
}
