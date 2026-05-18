'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { CheckinReception } from '@/components/checkin/checkin-reception';
import { useCheckinStore } from '@/store/checkin-store';
import { DomainNav } from '@/components/timeline/domain-nav';

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
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
                src="/images/icon-256x256.png"
                alt="Ceria"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </Link>
            <DomainNav theme="dark" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold">Portaria — Check-in</h1>
        <p className="mb-8 text-sm text-zinc-400">
          Pesquise na lista mestra e confirme a presença dos convidados.
        </p>
        <CheckinReception />
      </main>
    </div>
  );
}
