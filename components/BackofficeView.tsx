'use client';

import React, { useState, useEffect } from 'react';
import { Block } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/utils/cn';

interface BackofficeViewProps {
  baseTime: string;
  setBaseTime: (time: string) => void;
  blocks: Block[];
  onAddBlock: (title: string, duration: number, responsibles: string | null) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, title: string, duration: number, responsibles: string | null) => void; // 🚀 NOVA PROP
  onResetOffsets: () => void;
  onReorderBlocks: (updatedBlocks: Block[]) => void;
  isPending: (key: string) => boolean;
}

export default function BackofficeView({
  baseTime,
  setBaseTime,
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock, // 🚀 Recebendo a nova prop
  onResetOffsets,
  onReorderBlocks,
  isPending,
}: BackofficeViewProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [responsibles, setResponsibles] = useState('');
  const [orderedBlocks, setOrderedBlocks] = useState<Block[]>(blocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 📁 Estados para o Modal de Edição
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(15);
  const [editResponsibles, setEditResponsibles] = useState('');

  useEffect(() => {
    if (draggedIndex === null) setOrderedBlocks(blocks);
  }, [blocks, draggedIndex]);

  // Preenche os campos do modal quando um bloco for selecionado para edição
  useEffect(() => {
    if (editingBlock) {
      setEditTitle(editingBlock.title);
      setEditDuration(editingBlock.duration);
      setEditResponsibles(editingBlock.responsibles || '');
    }
  }, [editingBlock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddBlock(title, duration, responsibles.trim() || null);
    setTitle('');
    setResponsibles('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock || !editTitle.trim()) return;
    
    onUpdateBlock(editingBlock.id, editTitle.trim(), editDuration, editResponsibles.trim() || null);
    setEditingBlock(null); // Fecha o modal
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    const updatedBlocks = [...orderedBlocks];
    const draggedItem = updatedBlocks[draggedIndex];
    updatedBlocks.splice(draggedIndex, 1);
    updatedBlocks.splice(overIndex, 0, draggedItem);
    setDraggedIndex(overIndex);
    setOrderedBlocks(updatedBlocks);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      onReorderBlocks(orderedBlocks);
    }
    setDraggedIndex(null);
  };

  const inputClass =
    'rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Grade Horária Original
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monte o cronograma. Clique em um bloco para editar suas informações.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetOffsets}
          disabled={isPending('resetOffsets')}
          className="flex cursor-pointer items-center gap-1.5 self-start text-xs text-red-600 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300 sm:self-auto"
        >
          {isPending('resetOffsets') && <LoadingSpinner size="sm" />}
          Zerar tempos extras live
        </button>
      </div>

      {/* Âncora de Início */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
          Âncora de Início:
        </label>
        <div className="relative w-full sm:w-auto">
          <input
            type="time"
            value={baseTime}
            onChange={(e) => setBaseTime(e.target.value)}
            disabled={isPending('baseTime')}
            className={cn(inputClass, 'w-full sm:w-auto disabled:opacity-50')}
          />
          {isPending('baseTime') && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" className="text-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Form de Adicionar */}
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Nome do bloco (ex: Brinde dos Noivos)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(inputClass, 'flex-1')}
          />
          <input
            type="text"
            placeholder="Responsável (ex: Cerimonial)"
            value={responsibles}
            onChange={(e) => setResponsibles(e.target.value)}
            className={cn(inputClass, 'w-full sm:w-1/3')}
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            type="number"
            placeholder="Minutos"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={cn(inputClass, 'w-1/2 sm:w-24')}
          />
          <button
            type="submit"
            disabled={isPending('addBlock')}
            className="flex w-1/2 cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending('addBlock') ? <LoadingSpinner size="sm" className="text-white" /> : 'Adicionar Bloco'}
          </button>
        </div>
      </form>

      {/* Lista de Blocos */}
      <div className={cn('relative space-y-2 select-none', isPending('reorder') && 'opacity-70')}>
        {isPending('reorder') && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner size="md" className="text-emerald-500" />
          </div>
        )}
        {orderedBlocks.map((block, index) => {
          const isDragging = index === draggedIndex;
          const isRemoving = isPending(`remove:${block.id}`);
          const isUpdating = isPending(`update:${block.id}`);

          return (
            <div
              key={block.id}
              draggable={!isPending('reorder')}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setEditingBlock(block)} // 🚀 ABRE O MODAL AO CLICAR NO CARD
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-all duration-150',
                isDragging
                  ? 'border-dashed border-emerald-500 bg-emerald-500/5 opacity-40'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 dark:hover:border-emerald-500/50'
              )}
            >
              <div className="pointer-events-none mr-2 flex min-w-0 items-center gap-3 truncate">
                <div className="shrink-0 select-none text-xs font-bold tracking-widest text-zinc-400 cursor-grab active:cursor-grabbing">
                  ⋮⋮
                </div>
                <span className="hidden font-mono text-xs text-zinc-500 sm:inline">#{index + 1}</span>
                <div className="truncate">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">{block.title}</span>
                  {block.responsibles && (
                    <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                      👤 {block.responsibles}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-zinc-500 pointer-events-none">{block.duration}m</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // 🚀 Importante: Não abre o modal ao clicar em remover
                    onRemoveBlock(block.id);
                  }}
                  disabled={isRemoving || isUpdating}
                  className="flex cursor-pointer items-center gap-1 p-1 text-xs text-zinc-500 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-red-400"
                >
                  {isRemoving ? <LoadingSpinner size="sm" /> : 'Remover'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================
         🖥️ MODAL DE EDIÇÃO DE BLOCO (DARK/LIGHT)
         ========================================= */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()} // Evita fechar o modal clicando dentro dele
          >
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Editar Bloco</h3>
              <button 
                type="button"
                onClick={() => setEditingBlock(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Título do Bloco
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={cn(inputClass, 'w-full')}
                  placeholder="Ex: Entrada dos Padrinhos"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Responsáveis
                </label>
                <input
                  type="text"
                  value={editResponsibles}
                  value={editResponsibles}
                  onChange={(e) => setEditResponsibles(e.target.value)}
                  className={cn(inputClass, 'w-full')}
                  placeholder="Ex: Banda, Cerimonial, Noivo"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Duração Original (minutos)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className={cn(inputClass, 'w-full font-mono')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingBlock(null)}
                  className="border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending(`update:${editingBlock.id}`)}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending(`update:${editingBlock.id}`) ? <LoadingSpinner size="sm" /> : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}