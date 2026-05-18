'use client';

import { CalculatedBlock, ThemeMode, LayoutMode } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import OffsetDropdown, { type OffsetSelectValue } from '@/components/OffsetDropdown';
import { PlayIcon } from '@/components/icons';

interface LiveViewProps {
  theme: ThemeMode;
  layout: LayoutMode;
  baseTime: string;
  timelineData: CalculatedBlock[];
  onAdjustOffset: (id: string, value: OffsetSelectValue) => void | Promise<void>;
  onStartBlockNow: (id: string) => void;
  currentBlockIndex: number;
  isPending: (key: string) => boolean;
}

export default function LiveView({
  theme,
  layout,
  baseTime,
  timelineData,
  onAdjustOffset,
  onStartBlockNow,
  currentBlockIndex,
  isPending,
}: LiveViewProps) {
  return (
    <div className={`p-4 sm:p-6 rounded-xl border max-w-4xl mx-auto ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-800/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Casamento Paolla e Bruno</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Cronograma ativo com inicio previsto para {baseTime}</p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
            ● Ao vivo
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {timelineData.map((block, index) => {
          // MAPEAMENTO DOS ESTADOS DO BLOCO
          const isPast = index < currentBlockIndex;
          const isActive = index === currentBlockIndex;
          const hasDelay = block.time_offset > 0;
          const isStarting = isPending(`start:${block.id}`);
          const isAdjusting = isPending(`adjust:${block.id}`);
          
          return (
            <div 
              key={block.id} 
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isPast 
                  ? 'opacity-35 bg-zinc-800/5 dark:bg-zinc-900/10 border-zinc-800/40' // Estado Inativo/Passado
                  : isActive
                    ? 'border-emerald-500 bg-emerald-500/[0.02] shadow-[0_0_15px_rgba(16,185,129,0.05)]' // Estado Ativo Atual
                    : theme === 'dark'
                      ? `${hasDelay ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950/40'}` // Futuro Padrão Escuro
                      : `${hasDelay ? 'border-amber-200 bg-amber-50/40' : 'border-zinc-200 bg-white'}` // Futuro Padrão Claro
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Lado Esquerdo: Horário e Descrição */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`font-mono text-base sm:text-lg font-bold tracking-tight shrink-0 px-2.5 py-1 rounded-md border ${
                    isPast 
                      ? 'text-zinc-500 bg-zinc-500/5 border-zinc-500/10' 
                      : 'text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10'
                  }`}>
                    {block.start} <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs block sm:inline sm:ml-1">→ {block.end}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${isPast ? 'line-through text-zinc-500' : ''}`}>
                      {block.title}
                      {isActive && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse">Em Andamento</span>}
                    </h3>
                    {layout === 'detailed' && (
                      <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                        Base: {block.duration}m 
                        {hasDelay && <span className="text-amber-500 ml-1.5 bg-amber-500/10 px-1.5 py-0.5 rounded">(+{block.time_offset}m extra)</span>}
                        {isPast && <span className="text-zinc-500 ml-1.5 font-normal">(Encerrado)</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Modificadores de Tempo */}
                {layout === 'detailed' ? (
                  <div className="flex items-center gap-2 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/40 w-full md:w-auto">
                    
                    {!isPast && !isActive && (
                      <button
                        type="button"
                        onClick={() => onStartBlockNow(block.id)}
                        disabled={isStarting}
                        title="Iniciar bloco"
                        aria-label="Iniciar bloco"
                        className="p-2 rounded-md flex items-center justify-center bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 active:scale-95 transition shrink-0 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isStarting ? <LoadingSpinner size="sm" /> : <PlayIcon />}
                      </button>
                    )}

                    <OffsetDropdown
                      theme={theme}
                      disabled={isPast || isAdjusting}
                      onSelect={(value) => onAdjustOffset(block.id, value)}
                    />
                  </div>
                ) : (
                  // Layout Limpo Estilo Aeroporto
                  <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-zinc-800/40">
                    <span className={`inline-block text-xs font-mono font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      isPast 
                        ? 'bg-zinc-800/20 text-zinc-500 line-through' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
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