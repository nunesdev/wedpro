'use client';

import React, { useState } from 'react';
import { Block, ThemeMode } from '@/types';

interface BackofficeViewProps {
  theme: ThemeMode;
  baseTime: string;
  setBaseTime: (time: string) => void;
  blocks: Block[];
  onAddBlock: (title: string, duration: number) => void;
  onRemoveBlock: (id: string) => void;
  onResetOffsets: () => void;
  onReorderBlocks: (updatedBlocks: Block[]) => void; // Nova Prop
}

export default function BackofficeView({
  theme,
  baseTime,
  setBaseTime,
  blocks,
  onAddBlock,
  onRemoveBlock,
  onResetOffsets,
  onReorderBlocks,
}: BackofficeViewProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  
  // Estado para controlar o index do item sendo arrastado
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddBlock(title, duration);
    setTitle('');
  };

  // LÓGICA DE DRAG AND DROP NATIVA
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Define o efeito visual do mapeamento nativo
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault(); // Obrigatório para permitir o drop
    
    if (draggedIndex === null || draggedIndex === overIndex) return;

    // Cria uma cópia e reordena os blocos reativamente
    const updatedBlocks = [...blocks];
    const draggedItem = updatedBlocks[draggedIndex];
    
    updatedBlocks.splice(draggedIndex, 1); // Remove da posição antiga
    updatedBlocks.splice(overIndex, 0, draggedItem); // Insere na nova posição
    
    setDraggedIndex(overIndex); // Atualiza o index do que está sendo arrastado
    onReorderBlocks(updatedBlocks); // Notifica o componente pai
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={`p-4 sm:p-6 rounded-xl border max-w-3xl mx-auto ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/40">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Grade Horária Original</h2>
          <p className="text-xs text-zinc-400">Monte e ordene o cronograma arrastando os blocos.</p>
        </div>
        <button onClick={onResetOffsets} className="text-xs text-red-400 hover:text-red-300 self-start sm:self-auto transition">
          Zerar tempos extras live
        </button>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-xs sm:text-sm font-medium text-zinc-400">Âncora de Início:</label>
        <input 
          type="time" 
          value={baseTime} 
          onChange={(e) => setBaseTime(e.target.value)}
          className={`w-full sm:w-auto px-3 py-2 rounded-md border text-sm focus:outline-none focus:border-emerald-500 ${
            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
          }`}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input 
          type="text"
          placeholder="Nome do bloco (ex: Brinde dos Noivos)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`flex-1 px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-emerald-500 ${
            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
          }`}
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="number"
            placeholder="Minutos"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`w-1/2 sm:w-24 px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-emerald-500 ${
              theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300'
            }`}
          />
          <button type="submit" className="w-1/2 sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition active:scale-95">
            Adicionar
          </button>
        </div>
      </form>

      {/* LISTA COM DRAG AND DROP */}
      <div className="space-y-2 select-none">
        {blocks.map((block, index) => {
          const isDragging = index === draggedIndex;

          return (
            <div 
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all duration-150 cursor-grab active:cursor-grabbing ${
                isDragging 
                  ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-500/5' 
                  : theme === 'dark' 
                    ? 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800/60' 
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate mr-2 pointer-events-none">
                {/* Ícone Minimalista de Drag Handle (6 pontinhos) */}
                <div className="text-zinc-500 text-xs tracking-widest font-bold select-none shrink-0">
                  ⋮⋮
                </div>
                <span className="text-zinc-500 font-mono text-xs hidden sm:inline">#{index + 1}</span>
                <span className="font-medium truncate">{block.title}</span>
              </div>
              
              <div className="flex items-center gap-4 shrink-0 pointer-events-none">
                <span className="text-zinc-400 font-mono text-xs">{block.duration}m</span>
                <button 
                  type="button"
                  onClick={(e) => {
                    // Evita disparar qualquer evento do container pai
                    e.stopPropagation();
                    onRemoveBlock(block.id);
                  }} 
                  // Forçamos o pointer-events para o botão continuar clicável dentro do container nativo
                  className="text-zinc-500 hover:text-red-400 transition text-xs pointer-events-auto cursor-pointer p-1">
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}