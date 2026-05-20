'use client';

import React, { useState, useEffect } from 'react';
import { Block } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/utils/cn';

interface BackofficeViewProps {
  baseTime: string;
  setBaseTime: (time: string) => void;
  blocks: Block[];
  onAddBlock: (title: string, duration: number) => void;
  onRemoveBlock: (id: string) => void;
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
  onResetOffsets,
  onReorderBlocks,
  isPending,
}: BackofficeViewProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [orderedBlocks, setOrderedBlocks] = useState<Block[]>(blocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (draggedIndex === null) setOrderedBlocks(blocks);
  }, [blocks, draggedIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddBlock(title, duration);
    setTitle('');
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
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Grade Horária Original
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monte e ordene o cronograma arrastando os blocos.
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

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Nome do bloco (ex: Brinde dos Noivos)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(inputClass, 'flex-1')}
        />
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
            {isPending('addBlock') ? <LoadingSpinner size="sm" className="text-white" /> : 'Adicionar'}
          </button>
        </div>
      </form>

      <div className={cn('relative space-y-2 select-none', isPending('reorder') && 'opacity-70')}>
        {isPending('reorder') && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner size="md" className="text-emerald-500" />
          </div>
        )}
        {orderedBlocks.map((block, index) => {
          const isDragging = index === draggedIndex;
          const isRemoving = isPending(`remove:${block.id}`);

          return (
            <div
              key={block.id}
              draggable={!isPending('reorder')}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex cursor-grab items-center justify-between rounded-lg border p-3 text-sm transition-all duration-150 active:cursor-grabbing',
                isDragging
                  ? 'border-dashed border-emerald-500 bg-emerald-500/5 opacity-40'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60'
              )}
            >
              <div className="pointer-events-none mr-2 flex min-w-0 items-center gap-3 truncate">
                <div className="shrink-0 select-none text-xs font-bold tracking-widest text-zinc-400">
                  ⋮⋮
                </div>
                <span className="hidden font-mono text-xs text-zinc-500 sm:inline">#{index + 1}</span>
                <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{block.title}</span>
              </div>

              <div className="pointer-events-none flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-zinc-500">{block.duration}m</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBlock(block.id);
                  }}
                  disabled={isRemoving}
                  className="pointer-events-auto flex cursor-pointer items-center gap-1 p-1 text-xs text-zinc-500 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-red-400"
                >
                  {isRemoving ? <LoadingSpinner size="sm" /> : 'Remover'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
