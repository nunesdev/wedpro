'use client';

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQueueStore } from '@/store/queue-store';
import { minutesToSeconds } from '@/utils/time-formatter';

export function useQueueActions() {
  const joinQueue = useQueueStore((s) => s.joinQueue);
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue);
  const callNext = useQueueStore((s) => s.callNext);
  const skip = useQueueStore((s) => s.skip);
  const startPreparing = useQueueStore((s) => s.startPreparing);
  const finish = useQueueStore((s) => s.finish);
  const addTime = useQueueStore((s) => s.addTime);
  const resetAll = useQueueStore((s) => s.resetAll);

  const addMinutes = useCallback(
    (minutes: number) => addTime(minutesToSeconds(minutes)),
    [addTime]
  );

  return {
    joinQueue,
    removeFromQueue,
    callNext,
    skip,
    startPreparing,
    finish,
    addTime,
    addMinutes,
    resetAll,
  };
}

export function useQueueState() {
  return useQueueStore(
    useShallow((s) => ({
      queue: s.queue,
      activeGuest: s.activeGuest,
      status: s.status,
      secondsLeft: s.secondsLeft,
      hasHydrated: s._hasHydrated,
    }))
  );
}
