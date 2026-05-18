'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeMode } from '@/types';

const CALLED_SECONDS = 2 * 60;
const PREP_SECONDS = 5 * 60;
const STORAGE_KEY = 'wedi_selfbar';

type BarStatus = 'idle' | 'called' | 'preparing';

interface PersistedState {
  queue: string[];
  currentGuest: string | null;
  status: BarStatus;
  secondsLeft: number;
}

interface SelfBarQueueProps {
  theme: ThemeMode;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    return { queue: [], currentGuest: null, status: 'idle', secondsLeft: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* ignore */
  }
  return { queue: [], currentGuest: null, status: 'idle', secondsLeft: 0 };
}

export default function SelfBarQueue({ theme }: SelfBarQueueProps) {
  const [queue, setQueue] = useState<string[]>([]);
  const [currentGuest, setCurrentGuest] = useState<string | null>(null);
  const [status, setStatus] = useState<BarStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [nameInput, setNameInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef(queue);
  const hydrated = useRef(false);
  const isDark = theme === 'dark';

  queueRef.current = queue;

  useEffect(() => {
    const saved = loadState();
    setQueue(saved.queue);
    setCurrentGuest(saved.currentGuest);
    setStatus(saved.status);
    setSecondsLeft(saved.secondsLeft);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ queue, currentGuest, status, secondsLeft })
    );
  }, [queue, currentGuest, status, secondsLeft]);

  const callNextFromQueue = useCallback(() => {
    const waiting = queueRef.current;
    if (waiting.length === 0) {
      setCurrentGuest(null);
      setStatus('idle');
      setSecondsLeft(0);
      return;
    }
    const [next, ...rest] = waiting;
    setQueue(rest);
    setCurrentGuest(next);
    setStatus('called');
    setSecondsLeft(CALLED_SECONDS);
  }, []);

  const callNext = () => callNextFromQueue();

  const skipCurrent = () => callNextFromQueue();

  const finishAndNext = () => callNextFromQueue();

  const startPreparing = () => {
    setStatus('preparing');
    setSecondsLeft(PREP_SECONDS);
  };

  useEffect(() => {
    if (status === 'idle' || secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [status, currentGuest, secondsLeft > 0]);

  const prevSecondsRef = useRef(-1);

  useEffect(() => {
    if (secondsLeft !== 0) {
      prevSecondsRef.current = secondsLeft;
      return;
    }
    if (status === 'idle' || prevSecondsRef.current <= 0) return;
    prevSecondsRef.current = 0;
    callNextFromQueue();
  }, [secondsLeft, status, callNextFromQueue]);

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setQueue((prev) => [...prev, name]);
    setNameInput('');
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const monitorBg =
    status === 'called'
      ? 'bg-amber-500 text-amber-950'
      : status === 'preparing'
        ? 'bg-emerald-600 text-white'
        : 'bg-zinc-900 text-zinc-100';

  const statusLabel =
    status === 'called'
      ? 'Chamado — venha à barra'
      : status === 'preparing'
        ? 'Preparando drink'
        : 'Aguardando convidados';

  return (
    <div ref={containerRef}>
      {isFullscreen ? (
      <div
        className={`fixed inset-0 z-[300] flex flex-col items-center justify-center p-8 transition-colors duration-500 ${monitorBg}`}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-sm font-medium cursor-pointer backdrop-blur-sm"
        >
          Sair do monitor
        </button>

        <p className="text-sm sm:text-base uppercase tracking-[0.3em] font-bold opacity-80 mb-4">
          Self-bar
        </p>

        {currentGuest ? (
          <>
            <p className="text-lg sm:text-2xl font-medium opacity-90 mb-2">{statusLabel}</p>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-center leading-tight mb-8 max-w-[90vw] break-words">
              {currentGuest}
            </h1>
            <div className="text-7xl sm:text-9xl font-mono font-black tabular-nums tracking-tight">
              {formatTime(secondsLeft)}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl sm:text-6xl font-black text-center mb-6 opacity-90">
              Aguarde sua vez
            </h1>
            {queue.length > 0 ? (
              <p className="text-xl sm:text-2xl opacity-80">
                Próximo: <span className="font-bold">{queue[0]}</span>
              </p>
            ) : (
              <p className="text-xl opacity-70">Fila vazia</p>
            )}
          </>
        )}

        {queue.length > 0 && currentGuest && (
          <p className="mt-12 text-base sm:text-lg opacity-70 text-center px-4">
            Na fila: {queue.slice(0, 4).join(' · ')}
            {queue.length > 4 ? ` +${queue.length - 4}` : ''}
          </p>
        )}
      </div>
      ) : (
    <div
      className={`p-4 sm:p-6 rounded-xl border max-w-4xl mx-auto ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-800/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Self-bar</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {queue.length === 0
              ? 'Nenhum convidado na fila'
              : `${queue.length} na fila de espera`}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              status === 'called'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                : status === 'preparing'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}
          >
            {status === 'called'
              ? '● Chamado'
              : status === 'preparing'
                ? '● Em preparo'
                : 'Guichê livre'}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
              isDark
                ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Monitor
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className={`p-4 rounded-xl border transition-all duration-200 ${
            status === 'called'
              ? 'border-amber-500 bg-amber-500/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.05)]'
              : status === 'preparing'
                ? 'border-emerald-500 bg-emerald-500/[0.02] shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : isDark
                  ? 'border-zinc-800 bg-zinc-950/40'
                  : 'border-zinc-200 bg-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              {currentGuest ? (
                <>
                  <div
                    className={`inline-block font-mono text-base font-bold tracking-tight px-2.5 py-1 rounded-md border mb-2 ${
                      status === 'called'
                        ? 'text-amber-500 bg-amber-500/5 border-amber-500/10'
                        : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10'
                    }`}
                  >
                    {formatTime(secondsLeft)}
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base tracking-tight">
                    {currentGuest}
                    {status === 'preparing' && (
                      <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse">
                        Em Andamento
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    {status === 'called'
                      ? 'Aguardando o convidado no guichê'
                      : 'Preparando o drink'}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-sm sm:text-base tracking-tight text-zinc-500">
                    Guichê disponível
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {queue.length > 0 ? 'Pronto para chamar o próximo' : 'Adicione convidados à fila'}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800/40 w-full sm:w-auto">
              {currentGuest && status === 'called' && (
                <>
                  <button
                    type="button"
                    onClick={startPreparing}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 cursor-pointer transition active:scale-95"
                  >
                    Iniciar
                  </button>
                  <button
                    type="button"
                    onClick={skipCurrent}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    Pular
                  </button>
                </>
              )}
              {currentGuest && status === 'preparing' && (
                <button
                  type="button"
                  onClick={finishAndNext}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition active:scale-95"
                >
                  Terminei
                </button>
              )}
              {!currentGuest && queue.length > 0 && (
                <button
                  type="button"
                  onClick={callNext}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-amber-950 border border-amber-500/20 cursor-pointer transition active:scale-95"
                >
                  Chamar próximo
                </button>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAddName}
          className={`p-4 rounded-xl border ${
            isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50/50'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-3">
            Entrar na fila
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nome do convidado"
              className={`flex-1 px-3 py-2 rounded-md border text-sm focus:outline-none focus:border-emerald-500 ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium cursor-pointer transition shrink-0 active:scale-95"
            >
              Adicionar
            </button>
          </div>
        </form>

        {queue.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`font-mono text-base font-bold tracking-tight shrink-0 px-2.5 py-1 rounded-md border ${
                    isDark
                      ? 'text-zinc-500 bg-zinc-500/5 border-zinc-500/10'
                      : 'text-zinc-400 bg-zinc-100 border-zinc-200'
                  }`}
                >
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base tracking-tight truncate">
                    {name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">Na fila de espera</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFromQueue(index)}
                className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 cursor-pointer transition shrink-0"
                aria-label={`Remover ${name} da fila`}
              >
                Remover
              </button>
            </div>
          </div>
        ))}

        {queue.length === 0 && !currentGuest && (
          <p className="text-sm text-zinc-500 py-6 text-center border border-dashed border-zinc-800/60 rounded-xl">
            Ninguém na fila
          </p>
        )}
      </div>
    </div>
      )}
    </div>
  );
}
