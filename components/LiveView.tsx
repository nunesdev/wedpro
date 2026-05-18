'use client';

import React, { useState, useEffect } from 'react';
import { CalculatedBlock, ThemeMode, LayoutMode } from '@/types';

interface LiveViewProps {
  theme: ThemeMode;
  layout: LayoutMode;
  baseTime: string;
  timelineData: CalculatedBlock[];
  onAdjustOffset: (id: string, minutes: number) => void;
  onStartBlockNow: (id: string) => void;
  currentBlockIndex: number; // <-- Nova Prop recebida
}

export default function LiveView({
  theme,
  layout,
  baseTime,
  timelineData,
  onAdjustOffset,
  onStartBlockNow,
  currentBlockIndex,
}: LiveViewProps) {
  return (
    <div className={`p-4 sm:p-6 rounded-xl border max-w-4xl mx-auto ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-800/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Acompanhamento Operacional</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Cronograma ativo ancorado às {baseTime}</p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
            ● Modo Evento Vivo
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {timelineData.map((block, index) => {
          // MAPEAMENTO DOS ESTADOS DO BLOCO
          const isPast = index < currentBlockIndex;
          const isActive = index === currentBlockIndex;
          const hasDelay = block.time_offset > 0;
          
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
                  <div className="flex items-center gap-1.5 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800/40 w-full md:w-auto flex-wrap sm:flex-nowrap">
                    
                    {/* BOTÃO PLAY (Esconde ou desativa se for do passado) */}
                    <button 
                      onClick={() => onStartBlockNow(block.id)}
                      disabled={isPast || isActive}
                      className={`w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white cursor-default'
                          : isPast
                            ? 'bg-zinc-800/50 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                            : 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 active:scale-95'
                      }`}>
                      <span>{isActive ? '✓' : '▶'}</span> {isActive ? 'Ativo' : 'Iniciar'}
                    </button>

                    <span className="text-zinc-700 dark:text-zinc-800 mx-1 hidden sm:inline">|</span>

                    {/* AJUSTES MANUAIS (disabled se for passado) */}
                    <button 
                      onClick={() => onAdjustOffset(block.id, 5)}
                      disabled={isPast}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 text-xs font-mono font-bold rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 transition">
                      +5m
                    </button>
                    <button 
                      onClick={() => onAdjustOffset(block.id, 15)}
                      disabled={isPast}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 text-xs font-mono font-bold rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 transition">
                      +15m
                    </button>
                    {hasDelay && (
                      <button 
                        onClick={() => onAdjustOffset(block.id, -block.time_offset)}
                        disabled={isPast}
                        className="px-2 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition">
                        Reset
                      </button>
                    )}
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