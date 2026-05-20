'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TimerDisplay } from '@/components/queue/timer-display';
import { useQueueActions, useQueueState } from '@/hooks/useQueueActions';
import { cn } from '@/utils/cn';

export function GuestActiveView() {
  const { activeGuest, status, secondsLeft, hasHydrated } = useQueueState();
  const { finish, startPreparing } = useQueueActions();

  if (!hasHydrated) {
    return <p className="text-center text-sm text-zinc-500">Carregando…</p>;
  }

  if (!activeGuest) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Ninguém no balcão</p>
        <p className="text-sm text-zinc-500">
          Aguarde ser chamado. A equipa gere a fila em{' '}
          <Link href="/selfbar/operacao" className="text-emerald-400 underline underline-offset-2">
            Operação
          </Link>
          .
        </p>
      </div>
    );
  }

  const isPreparing = status === 'preparing';
  const isCalled = status === 'called';

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {isPreparing ? 'Prepare o seu drink' : isCalled ? 'Foi chamado' : 'Aguarde'}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{activeGuest.name}</h1>
      </div>

      {(isCalled || isPreparing) && (
        <TimerDisplay
          seconds={secondsLeft}
          label={isPreparing ? 'Tempo restante' : 'Tolerância para chegar'}
          size="xl"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {isCalled && (
          <Button size="lg" onClick={startPreparing} className="min-w-[200px]">
            Cheguei — iniciar preparo
          </Button>
        )}
        {isPreparing && (
          <Button size="lg" onClick={finish} className="min-w-[200px]">
            Terminei
          </Button>
        )}
      </div>

      {isCalled && (
        <p className={cn('text-sm text-amber-400/90')}>
          Tem 2 minutos para chegar ao balcão.
        </p>
      )}
    </div>
  );
}
