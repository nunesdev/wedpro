'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { TimerDisplay } from '@/components/queue/timer-display';
import { useQueueActions, useQueueState } from '@/hooks/useQueueActions';
import { cn } from '@/utils/cn';

export function QueueOperator() {
  const { queue, activeGuest, status, secondsLeft, hasHydrated } = useQueueState();
  const {
    joinQueue,
    removeFromQueue,
    callNext,
    skip,
    startPreparing,
    finish,
    addMinutes,
    resetAll,
  } = useQueueActions();

  const [nameInput, setNameInput] = useState('');

  const handleAddName = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    joinQueue(trimmed);
    setNameInput('');
  };

  if (!hasHydrated) {
    return <p className="text-sm text-zinc-500">Carregando fila…</p>;
  }

  const timerActive = status !== 'idle';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Ativo no balcão */}
      <section
        className={cn(
          'rounded-xl border p-4 transition-colors',
          status === 'called' && 'border-amber-500/40 bg-amber-500/[0.04]',
          status === 'preparing' && 'border-emerald-500/40 bg-emerald-500/[0.04]',
          status === 'idle' && 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40'
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                status === 'called' && 'border-amber-500/30 text-amber-400 animate-pulse',
                status === 'preparing' && 'border-emerald-500/30 text-emerald-400 animate-pulse',
                status === 'idle' && 'border-zinc-700 text-zinc-500'
              )}
            >
              {status === 'called'
                ? '● Chamado (2 min)'
                : status === 'preparing'
                  ? '● Em preparo (5 min)'
                  : 'Guichê livre'}
            </span>

            {activeGuest ? (
              <>
                {timerActive && (
                  <TimerDisplay
                    seconds={secondsLeft}
                    size="md"
                    className="mt-3 items-start"
                  />
                )}
                <h2 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">{activeGuest.name}</h2>
                <p className="text-xs text-zinc-500">
                  {status === 'called'
                    ? 'Aguardando o convidado chegar ao balcão'
                    : 'Preparando o drink'}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-lg font-semibold text-zinc-500">Ninguém no balcão</h2>
                <p className="text-xs text-zinc-500">
                  {queue.length > 0
                    ? 'Pronto para chamar o próximo'
                    : 'Adicione nomes à fila abaixo'}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!activeGuest && queue.length > 0 && (
              <Button variant="amber" onClick={callNext}>
                Chamar próximo
              </Button>
            )}
            {activeGuest && status === 'called' && (
              <>
                <Button onClick={startPreparing}>Iniciar preparo</Button>
                <Button variant="outline" onClick={skip}>
                  Pular
                </Button>
              </>
            )}
            {activeGuest && status === 'preparing' && (
              <>
                <Button onClick={finish}>Terminei / Próximo</Button>
                <Button variant="outline" onClick={skip}>
                  Pular
                </Button>
              </>
            )}
          </div>
        </div>

        {timerActive && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ajustar tempo
            </span>
            {[5, 10, 15].map((min) => (
              <Button key={min} size="sm" variant="secondary" onClick={() => addMinutes(min)}>
                +{min} min
              </Button>
            ))}
          </div>
        )}
      </section>

      {/* Adicionar à fila */}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Entrar na fila
        </h3>
        <form onSubmit={handleAddName} className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nome do convidado"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <Button type="submit" disabled={!nameInput.trim()}>
            Adicionar
          </Button>
        </form>
      </section>

      {/* Fila de espera */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Fila de espera ({queue.length})
        </h3>
        {queue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            Ninguém na fila
          </p>
        ) : (
          <ul className="space-y-2">
            {queue.map((guest, index) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 font-mono text-sm font-bold text-zinc-500">
                    #{index + 1}
                  </span>
                  <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{guest.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromQueue(guest.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button variant="danger" onClick={resetAll}>
        Resetar fila
      </Button>
    </div>
  );
}
