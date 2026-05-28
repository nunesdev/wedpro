'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TimerDisplay } from '@/components/queue/timer-display';
import { useSupabaseSelfBar } from '@/hooks/useSupabaseSelfBar';
import { TropicalLottieOverlay } from "@/components/queue/tropical-lottie";


import { cn } from '@/utils/cn';

export function QueueMonitor() {
  const { activeGuest, status, secondsLeft, queue, hasHydrated } = useSupabaseSelfBar();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen();
    else await document.exitFullscreen();
  };

  const hasCalledGuest = status === 'called';
  const emptyQueue = !activeGuest;

  const monitorBg =
    status === 'called'
      ? 'bg-amber-500 text-amber-950 animate-pulse'
      : status === 'preparing'
        ? 'bg-emerald-600 text-white'
        : 'bg-zinc-950 text-zinc-100';

  const statusLabel =
    status === 'called'
      ? 'Chamando — venha ao bar'
      : status === 'preparing'
        ? 'Preparando drink'
        : 'Aguardando convidados';

  if (!hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-zinc-500">
        Carregando monitor…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex min-h-dvh flex-col items-center justify-center p-8 transition-colors duration-500',
        monitorBg
      )}
    >
      <TropicalLottieOverlay isCalled={hasCalledGuest} isEmpty={emptyQueue} />

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg bg-black/20 px-4 py-2 text-sm font-medium backdrop-blur-sm cursor-pointer hover:bg-black/30"
        >
          {isFullscreen ? 'Sair' : 'Tela cheia'}
        </button>
        <Link
          href="/selfbar/operacao"
          className="rounded-lg bg-black/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-black/30"
        >
          Operação
        </Link>
      </div>

      <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] opacity-80 sm:text-base">
        Self-bar
      </p>

      {activeGuest ? (
        <>
          <p className="mb-2 text-lg font-medium opacity-90 sm:text-2xl">{statusLabel}</p>
          <h1 className="mb-8 max-w-[90vw] break-words text-center text-5xl font-black leading-tight sm:text-7xl md:text-8xl">
            {activeGuest.name}
          </h1>
          <TimerDisplay seconds={secondsLeft} size="xl" />
        </>
      ) : (
        <>
          <h1 className="mb-6 text-center text-4xl font-black opacity-90 sm:text-6xl">
            Aguarde a sua vez
          </h1>
          {queue.length > 0 ? (
            <p className="text-xl opacity-80 sm:text-2xl">
              Próximo: <span className="font-bold">{queue[0].name}</span>
            </p>
          ) : (
            <p className="text-xl opacity-70">Fila vazia</p>
          )}
        </>
      )}

      {queue.length > 0 && activeGuest && (
        <p className="mt-12 max-w-2xl px-4 text-center text-base opacity-70 sm:text-lg">
          Na fila:{' '}
          {queue
            .slice(0, 5)
            .map((g) => g.name)
            .join(' · ')}
          {queue.length > 5 ? ` +${queue.length - 5}` : ''}
        </p>
      )}
    </div>
  );
}
