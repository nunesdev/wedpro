'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { TimerDisplay } from '@/components/queue/timer-display';

import { useQueueActions, useQueueState } from '@/hooks/useQueueActions';
import { useSupabaseSelfBar } from '@/hooks/useSupabaseSelfBar';
import { cn } from '@/utils/cn';

export function QueueOperator() {
  const {
    queue, activeGuest, status, secondsLeft, hasHydrated,
    joinQueue, removeFromQueue, callNext, skip, startPreparing, finish, addMinutes, resetAll
  } = useSupabaseSelfBar();

  const [nameInput, setNameInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listener para detectar quando o navegador entra ou sai da tela cheia
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(console.error);
    } else {
      await document.exitFullscreen().catch(console.error);
    }
  };

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

  // 🧮 Cálculo de Tempo Estimado:
  // 7 min por pessoa na fila (2 min chamada + 5 min preparo) + os minutos restantes de quem já está no balcão
  const baseQueueTime = queue.length * 7;
  const currentActiveTime = secondsLeft > 0 ? Math.ceil(secondsLeft / 60) : 0;
  const estimatedWaitMinutes = baseQueueTime + currentActiveTime;

  return (
    <div
      ref={containerRef}
      className={cn(
        'mx-auto w-full transition-colors duration-300',
        isFullscreen
          ? 'max-w-none min-h-screen bg-zinc-950 text-zinc-50 p-6 sm:p-10 flex flex-col overflow-y-auto'
          : 'max-w-4xl space-y-6'
      )}
    >
      {isFullscreen ? (
        /* =========================================
           🖥️ MODO TELA CHEIA (DASHBOARD)
           ========================================= */
        <div className="flex flex-col h-full gap-8">
          {/* Cabeçalho Tela Cheia */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">Operação Self-bar</h2>
              <p className="mt-2 text-lg text-zinc-400">
                Tempo de espera na fila:{' '}
                <span className="font-bold text-amber-500">~{estimatedWaitMinutes} min</span>
              </p>
            </div>
            <Button variant="outline" onClick={toggleFullscreen} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0">
              Sair da Tela Cheia
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
            {/* Esquerda: Balcão Ativo */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center shadow-2xl relative">
              <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-zinc-500">No Balcão</span>
              
              {activeGuest ? (
                <>
                  <h1 className="mb-6 text-5xl sm:text-6xl font-black text-white">{activeGuest.name}</h1>
                  <span
                    className={cn(
                      'mb-8 rounded-full px-6 py-2 text-sm font-bold uppercase tracking-widest',
                      status === 'called' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                    )}
                  >
                    {status === 'called' ? 'Aguardando Retirada' : 'Preparando Drink'}
                  </span>

                  {timerActive && <TimerDisplay seconds={secondsLeft} size="xl" />}

                  <div className="mt-10 flex flex-wrap justify-center gap-4">
                    {status === 'called' && (
                      <Button size="lg" onClick={startPreparing} className="h-16 px-8 text-lg bg-emerald-600 hover:bg-emerald-500 text-white">
                        Iniciar Preparo
                      </Button>
                    )}
                    {status === 'preparing' && (
                      <Button size="lg" variant="amber" onClick={finish} className="h-16 px-8 text-lg">
                        Terminei / Próximo
                      </Button>
                    )}
                    <Button size="lg" variant="outline" onClick={skip} className="h-16 px-8 text-lg border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                      Pular
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-8 text-3xl font-medium text-zinc-600">Ninguém no balcão</p>
                  {queue.length > 0 && (
                    <Button size="lg" variant="amber" onClick={callNext} className="h-20 px-12 text-2xl animate-bounce">
                      Chamar Próximo
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Direita: Fila de Espera */}
            <div className="flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Próximos da Fila ({queue.length})
              </h3>
              
              <ul className="flex-1 space-y-3 overflow-y-auto pr-2">
                {queue.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-800">
                    <p className="text-lg text-zinc-600">A fila está vazia</p>
                  </div>
                ) : (
                  queue.map((guest, index) => (
                    <li key={guest.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xl font-bold text-zinc-600">#{index + 1}</span>
                        <span className="text-2xl font-bold text-zinc-200">{guest.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFromQueue(guest.id)} className="text-red-500/50 hover:text-red-400 hover:bg-red-500/10">
                        Remover
                      </Button>
                    </li>
                  ))
                )}
              </ul>

              {/* Form de Adicionar na Tela Cheia */}
              <form onSubmit={handleAddName} className="mt-6 flex gap-3 pt-6 border-t border-zinc-800">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nome do próximo convidado..."
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-4 text-lg text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <Button type="submit" disabled={!nameInput.trim()} className="px-8 text-lg h-auto">
                  Adicionar
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================
           📱 MODO NORMAL (LISTA)
           ========================================= */
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Controle do Balcão</h2>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              Tela Cheia
            </Button>
          </div>

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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Entrar na fila
              </h3>
              <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
                Espera est.: ~{estimatedWaitMinutes} min
              </span>
            </div>
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
        </>
      )}
    </div>
  );
}