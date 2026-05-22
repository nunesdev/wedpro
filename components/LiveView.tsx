'use client';

import { CalculatedBlock, LayoutMode } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import OffsetDropdown, { type OffsetSelectValue } from '@/components/OffsetDropdown';
import { PlayIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface LiveViewProps {
  layout: LayoutMode;
  baseTime: string;
  timelineData: CalculatedBlock[];
  onAdjustOffset: (id: string, value: OffsetSelectValue) => void | Promise<void>;
  onStartBlockNow: (id: string) => void;
  currentBlockIndex: number;
  isPending: (key: string) => boolean;
}

export default function LiveView({
  layout,
  baseTime,
  timelineData,
  onAdjustOffset,
  onStartBlockNow,
  currentBlockIndex,
  isPending,
}: LiveViewProps) {
  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Casamento Paolla e Bruno
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Cronograma ativo com inicio previsto para {baseTime}
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 animate-pulse dark:text-emerald-400">
            ● Ao vivo
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {timelineData.map((block, index) => {
          const isPast = index < currentBlockIndex;
          const isActive = index === currentBlockIndex;
          const hasDelay = block.time_offset > 0;
          const isStarting = isPending(`start:${block.id}`);
          const isAdjusting = isPending(`adjust:${block.id}`);

          return (
            <div
              key={block.id}
              className={cn(
                'rounded-xl border p-4 transition-all duration-200',
                isPast && 'border-zinc-200/80 bg-zinc-100/50 opacity-35 dark:border-zinc-800/40 dark:bg-zinc-900/10',
                isActive &&
                  'border-emerald-500 bg-emerald-500/[0.04] shadow-[0_0_15px_rgba(16,185,129,0.08)] dark:bg-emerald-500/[0.02]',
                !isPast &&
                  !isActive &&
                  (hasDelay
                    ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40')
              )}
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={cn(
                      'shrink-0 rounded-md border px-2.5 py-1 font-mono text-base font-bold tracking-tight sm:text-lg',
                      isPast
                        ? 'border-zinc-300/80 bg-zinc-200/50 text-zinc-500 dark:border-zinc-500/10 dark:bg-zinc-500/5'
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                    )}
                  >
                    {block.start}{' '}
                    <span className="block font-normal text-zinc-500 dark:text-zinc-400 sm:ml-1 sm:inline">
                      → {block.end}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={cn(
                        'truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-base',
                        isPast && 'text-zinc-500 line-through'
                      )}
                    >
                      {block.title}
                      {isActive && (
                        <span className="ml-2 animate-pulse rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Em Andamento
                        </span>
                      )}
                    </h3>
                    {block.responsibles && (
                      <p className="mt-1 text-xs text-emerald-400">
                        👤 Resp: {block.responsibles}
                      </p>
                    )}
                    {layout === 'detailed' && (
                      <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Base: {block.duration}m
                        {hasDelay && (
                          <span className="ml-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-500">
                            (+{block.time_offset}m extra)
                          </span>
                        )}
                        {isPast && <span className="ml-1.5 font-normal">(Encerrado)</span>}
                      </p>
                    )}
                  </div>
                </div>

                {layout === 'detailed' ? (
                  <div className="flex w-full items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800/40 md:w-auto md:border-t-0 md:pt-0">
                    {!isPast && !isActive && (
                      <button
                        type="button"
                        onClick={() => onStartBlockNow(block.id)}
                        disabled={isStarting}
                        title="Iniciar bloco"
                        aria-label="Iniciar bloco"
                        className="flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-600/10 p-2 text-emerald-600 transition hover:bg-emerald-600 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400"
                      >
                        {isStarting ? <LoadingSpinner size="sm" /> : <PlayIcon />}
                      </button>
                    )}

                    <OffsetDropdown
                      disabled={isPast || isAdjusting}
                      onSelect={(value) => onAdjustOffset(block.id, value)}
                    />
                  </div>
                ) : (
                  <div className="shrink-0 border-t border-zinc-200 pt-2 text-left md:border-t-0 md:pt-0 md:text-right dark:border-zinc-800/40">
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider',
                        isPast
                          ? 'bg-zinc-200 text-zinc-500 line-through dark:bg-zinc-800/20'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      )}
                    >
                      {block.actualDuration} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
