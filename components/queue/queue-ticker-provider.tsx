'use client';

import { useEffect, type ReactNode } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { useQueueStore } from '@/store/queue-store';

function QueueTicker() {
  useCountdown();
  return null;
}

export function QueueTickerProvider({ children }: { children: ReactNode }) {
  const setHasHydrated = useQueueStore((s) => s.setHasHydrated);

  useEffect(() => {
    const finish = () => setHasHydrated(true);

    if (useQueueStore.persist.hasHydrated()) {
      finish();
    }

    const unsub = useQueueStore.persist.onFinishHydration(finish);
    void useQueueStore.persist.rehydrate();

    return unsub;
  }, [setHasHydrated]);

  return (
    <>
      <QueueTicker />
      {children}
    </>
  );
}
