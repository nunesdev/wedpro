'use client';

import { useEffect } from 'react';
import { CheckinReception } from '@/components/checkin/checkin-reception';
import { useCheckinStore } from '@/store/checkin-store';

export default function CheckinPage() {
  const setHasHydrated = useCheckinStore((s) => s.setHasHydrated);

  useEffect(() => {
    const unsub = useCheckinStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    useCheckinStore.persist.rehydrate();
    return unsub;
  }, [setHasHydrated]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Portaria — Check-in
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Pesquise na lista abaixo e confirme a presença dos convidados.
      </p>
      <CheckinReception />
    </div>
  );
}
