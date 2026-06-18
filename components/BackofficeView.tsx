'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Block, BlockFormInput, BlockItemType, Category } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { uploadAudioFile } from '@/lib/audio-upload';
import { BLOCK_ITEM_TYPE_OPTIONS } from '@/lib/timeline/constants';
import { getChildBlocks, getRootBlocks } from '@/utils/timeline-calculations';
import { buildFormInput } from '@/utils/block-helpers';
import { getCategoryLabel, resolveCategoryIdForBlock } from '@/utils/category-helpers';
import { cn } from '@/utils/cn';

interface BackofficeViewProps {
  baseTime: string;
  setBaseTime: (time: string) => void;
  blocks: Block[];
  categories: Category[];
  onAddBlock: (input: BlockFormInput) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, input: BlockFormInput) => void;
  onResetOffsets: () => void;
  onReorderBlocks: (updatedBlocks: Block[]) => void;
  isPending: (key: string) => boolean;
}

const ITEM_TYPE_LABELS: Record<BlockItemType, string> = {
  event: 'Evento',
  music: 'Música',
  music_local: 'Música - Arquivo Local',
  task: 'Tarefa',
};

function buildHierarchicalList(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const root of getRootBlocks(blocks)) {
    result.push(root);
    result.push(...getChildBlocks(blocks, root.id));
  }
  return result;
}

function ParentBlockSelect({
  value,
  onChange,
  blocks,
  excludeId,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  blocks: Block[];
  excludeId?: string;
  className?: string;
}) {
  const parentOptions = blocks.filter((b) => !b.parent_id && b.id !== excludeId);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">Nenhum (bloco principal)</option>
      {parentOptions.map((block) => (
        <option key={block.id} value={block.id}>
          {block.title}
        </option>
      ))}
    </select>
  );
}

function CategorySelect({
  value,
  onChange,
  categories,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    >
      <option value="">Selecione uma categoria</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

function ItemTypeSelect({
  value,
  onChange,
  className,
}: {
  value: BlockItemType;
  onChange: (value: BlockItemType) => void;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as BlockItemType)} className={className}>
      {BLOCK_ITEM_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function BackofficeView({
  baseTime,
  setBaseTime,
  blocks,
  categories,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onResetOffsets,
  onReorderBlocks,
  isPending,
}: BackofficeViewProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(15);
  const [responsibles, setResponsibles] = useState('');
  const [parentId, setParentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [itemType, setItemType] = useState<BlockItemType>('event');
  const [spotifyUri, setSpotifyUri] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const hierarchicalBlocks = useMemo(() => buildHierarchicalList(blocks), [blocks]);
  const [orderedBlocks, setOrderedBlocks] = useState<Block[]>(hierarchicalBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(15);
  const [editResponsibles, setEditResponsibles] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editItemType, setEditItemType] = useState<BlockItemType>('event');
  const [editSpotifyUri, setEditSpotifyUri] = useState('');
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [editAudioStartTime, setEditAudioStartTime] = useState(0);

  useEffect(() => {
    if (draggedIndex === null) setOrderedBlocks(hierarchicalBlocks);
  }, [hierarchicalBlocks, draggedIndex]);

  useEffect(() => {
    if (editingBlock) {
      setEditTitle(editingBlock.title);
      setEditDuration(editingBlock.duration);
      setEditResponsibles(editingBlock.responsibles || '');
      setEditParentId(editingBlock.parent_id || '');
      setEditCategoryId(editingBlock.category_id || '');
      setEditItemType(editingBlock.item_type ?? 'event');
      setEditSpotifyUri(editingBlock.metadata?.spotify_uri || '');
      setEditAudioFile(null);
      setEditAudioStartTime(editingBlock.metadata?.start_time ?? 0);
    }
  }, [editingBlock]);

  useEffect(() => {
    if (!parentId) return;
    const parent = blocks.find((block) => block.id === parentId);
    if (parent?.category_id) setCategoryId(parent.category_id);
  }, [parentId, blocks]);

  useEffect(() => {
    if (!editParentId) return;
    const parent = blocks.find((block) => block.id === editParentId);
    if (parent?.category_id) setEditCategoryId(parent.category_id);
  }, [editParentId, blocks]);

  const resetAddForm = () => {
    setTitle('');
    setResponsibles('');
    setParentId('');
    setCategoryId('');
    setItemType('event');
    setSpotifyUri('');
    setAudioFile(null);
    setAudioStartTime(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isUploading) return;

    if (itemType === 'music_local') {
      if (!audioFile) {
        showToast('Selecione um arquivo de áudio (MP3)', 'warning');
        return;
      }

      setIsUploading(true);
      try {
        const upload = await uploadAudioFile(audioFile);
        if (!upload.ok) {
          showToast(upload.error, 'error');
          return;
        }

        onAddBlock(
          buildFormInput(
            title,
            duration,
            responsibles,
            parentId,
            itemType,
            resolveCategoryIdForBlock(blocks, parentId || null, categoryId),
            { audioUrl: upload.url, startTime: audioStartTime }
          )
        );
        resetAddForm();
      } finally {
        setIsUploading(false);
      }
      return;
    }

    onAddBlock(
      buildFormInput(
        title,
        duration,
        responsibles,
        parentId,
        itemType,
        resolveCategoryIdForBlock(blocks, parentId || null, categoryId),
        { spotifyUri }
      )
    );
    resetAddForm();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock || !editTitle.trim() || isUploading) return;

    const hasChildren = getChildBlocks(blocks, editingBlock.id).length > 0;
    const resolvedParentId = hasChildren ? null : editParentId || null;

    if (editItemType === 'music_local') {
      let audioUrl = editingBlock.metadata?.audio_url;

      if (editAudioFile) {
        setIsUploading(true);
        try {
          const upload = await uploadAudioFile(editAudioFile);
          if (!upload.ok) {
            showToast(upload.error, 'error');
            return;
          }
          audioUrl = upload.url;
        } finally {
          setIsUploading(false);
        }
      }

      if (!audioUrl) {
        showToast('Selecione um arquivo de áudio (MP3)', 'warning');
        return;
      }

      onUpdateBlock(
        editingBlock.id,
        buildFormInput(
          editTitle,
          editDuration,
          editResponsibles,
          resolvedParentId ?? '',
          editItemType,
          resolveCategoryIdForBlock(blocks, resolvedParentId, editCategoryId),
          { audioUrl, startTime: editAudioStartTime }
        )
      );
      setEditingBlock(null);
      return;
    }

    onUpdateBlock(
      editingBlock.id,
      buildFormInput(
        editTitle,
        editDuration,
        editResponsibles,
        resolvedParentId ?? '',
        editItemType,
        resolveCategoryIdForBlock(blocks, resolvedParentId, editCategoryId),
        { spotifyUri: editSpotifyUri }
      )
    );
    setEditingBlock(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const block = orderedBlocks[index];
    if (block.parent_id) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    const draggedBlock = orderedBlocks[draggedIndex];
    const overBlock = orderedBlocks[overIndex];
    if (draggedBlock.parent_id || overBlock.parent_id) return;

    const roots = orderedBlocks.filter((b) => !b.parent_id);
    const draggedRootIndex = roots.findIndex((b) => b.id === draggedBlock.id);
    const overRootIndex = roots.findIndex((b) => b.id === overBlock.id);
    if (draggedRootIndex === -1 || overRootIndex === -1) return;

    const reorderedRoots = [...roots];
    const [moved] = reorderedRoots.splice(draggedRootIndex, 1);
    reorderedRoots.splice(overRootIndex, 0, moved);

    let position = 0;
    const updated: Block[] = [];
    for (const root of reorderedRoots) {
      updated.push({ ...root, position: position++ });
      for (const child of getChildBlocks(blocks, root.id)) {
        updated.push({ ...child, position: position++ });
      }
    }

    const newDraggedIndex = updated.findIndex((b) => b.id === draggedBlock.id);
    setDraggedIndex(newDraggedIndex);
    setOrderedBlocks(updated);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      onReorderBlocks(orderedBlocks);
    }
    setDraggedIndex(null);
  };

  const inputClass =
    'rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500';

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Grade Horária Original
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monte o cronograma. Clique em um bloco para editar. Arraste apenas blocos principais.
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

      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Novo bloco</h3>
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Bloco pai</label>
            <ParentBlockSelect
              value={parentId}
              onChange={setParentId}
              blocks={blocks}
              className={cn(inputClass, 'w-full')}
            />
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
              categories={categories}
              disabled={Boolean(parentId)}
              className={cn(inputClass, 'w-full disabled:cursor-not-allowed disabled:opacity-60')}
            />
            {parentId && (
              <p className="mt-1 text-[11px] text-zinc-500">
                Herdada do bloco pai selecionado
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Tipo de item</label>
            <ItemTypeSelect value={itemType} onChange={setItemType} className={cn(inputClass, 'w-full')} />
          </div>
          <div>
            <label className={labelClass}>Duração (min)</label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={cn(inputClass, 'w-full font-mono')}
            />
          </div>
        </div>
        {itemType === 'music' && (
          <div>
            <label className={labelClass}>Spotify URI</label>
            <input
              type="text"
              placeholder="57bgtoPSgt236PdNGIcL ou URL do Spotify"
              value={spotifyUri}
              onChange={(e) => setSpotifyUri(e.target.value)}
              className={cn(inputClass, 'w-full font-mono text-xs')}
            />
          </div>
        )}
        {itemType === 'music_local' && (
          <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <div>
              <label className={labelClass}>Arquivo de áudio (MP3)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className={cn(inputClass, 'w-full file:mr-3 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-xs file:text-white')}
              />
            </div>
            <div>
              <label className={labelClass}>Segundo de início</label>
              <input
                type="number"
                min={0}
                value={audioStartTime}
                onChange={(e) => setAudioStartTime(Math.max(0, Number(e.target.value)))}
                placeholder="75 para 1m15s"
                className={cn(inputClass, 'w-full font-mono')}
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Ex: 75 = começa em 1min15s do arquivo
              </p>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending('addBlock') || isUploading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending('addBlock') || isUploading ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            'Adicionar Bloco'
          )}
        </button>
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
          const isUpdating = isPending(`update:${block.id}`);
          const isChild = Boolean(block.parent_id);
          const childCount = getChildBlocks(blocks, block.id).length;

          return (
            <div
              key={block.id}
              draggable={!isPending('reorder') && !isChild}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setEditingBlock(block)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-all duration-150',
                isChild && 'ml-6 border-l-2 border-l-emerald-500/30',
                isDragging
                  ? 'border-dashed border-emerald-500 bg-emerald-500/5 opacity-40'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 hover:border-emerald-500/50 dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/60 dark:hover:border-emerald-500/50'
              )}
            >
              <div className="pointer-events-none mr-2 flex min-w-0 items-center gap-3 truncate">
                {!isChild ? (
                  <div className="shrink-0 select-none text-xs font-bold tracking-widest text-zinc-400 cursor-grab active:cursor-grabbing">
                    ⋮⋮
                  </div>
                ) : (
                  <div className="w-4 shrink-0" />
                )}
                <div className="truncate">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {block.title}
                    {childCount > 0 && (
                      <span className="ml-2 text-[10px] font-normal text-zinc-500">
                        ({childCount} sub-itens)
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    {ITEM_TYPE_LABELS[block.item_type ?? 'event']}
                    {!isChild && getCategoryLabel(block, categories) && (
                      <> · {getCategoryLabel(block, categories)}</>
                    )}
                    {block.responsibles && ` · 👤 ${block.responsibles}`}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <span className="font-mono text-xs text-zinc-500 pointer-events-none">{block.duration}m</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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

      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
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
                <label className={labelClass}>Título do Bloco</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={cn(inputClass, 'w-full')}
                />
              </div>

              <div>
                <label className={labelClass}>Responsáveis</label>
                <input
                  type="text"
                  value={editResponsibles}
                  onChange={(e) => setEditResponsibles(e.target.value)}
                  className={cn(inputClass, 'w-full')}
                />
              </div>

              {getChildBlocks(blocks, editingBlock.id).length === 0 && (
                <div>
                  <label className={labelClass}>Bloco pai</label>
                  <ParentBlockSelect
                    value={editParentId}
                    onChange={setEditParentId}
                    blocks={blocks}
                    excludeId={editingBlock.id}
                    className={cn(inputClass, 'w-full')}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Categoria</label>
                <CategorySelect
                  value={editCategoryId}
                  onChange={setEditCategoryId}
                  categories={categories}
                  disabled={Boolean(editParentId)}
                  className={cn(inputClass, 'w-full disabled:cursor-not-allowed disabled:opacity-60')}
                />
                {editParentId && (
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Herdada do bloco pai selecionado
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo de item</label>
                  <ItemTypeSelect
                    value={editItemType}
                    onChange={setEditItemType}
                    className={cn(inputClass, 'w-full')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Duração (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className={cn(inputClass, 'w-full font-mono')}
                  />
                </div>
              </div>

              {editItemType === 'music' && (
                <div>
                  <label className={labelClass}>Spotify URI</label>
                  <input
                    type="text"
                    placeholder="57bgtoPSgt236PdNGIcL"
                    value={editSpotifyUri}
                    onChange={(e) => setEditSpotifyUri(e.target.value)}
                    className={cn(inputClass, 'w-full font-mono text-xs')}
                  />
                </div>
              )}

              {editItemType === 'music_local' && (
                <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                  <div>
                    <label className={labelClass}>Arquivo de áudio (MP3)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setEditAudioFile(e.target.files?.[0] ?? null)}
                      className={cn(inputClass, 'w-full file:mr-3 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-xs file:text-white')}
                    />
                    {editingBlock.metadata?.audio_url && !editAudioFile && (
                      <p className="mt-1 truncate text-[11px] text-emerald-600 dark:text-emerald-400">
                        Arquivo atual mantido. Selecione outro para substituir.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Segundo de início</label>
                    <input
                      type="number"
                      min={0}
                      value={editAudioStartTime}
                      onChange={(e) => setEditAudioStartTime(Math.max(0, Number(e.target.value)))}
                      className={cn(inputClass, 'w-full font-mono')}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <button type="button" onClick={() => setEditingBlock(null)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending(`update:${editingBlock.id}`) || isUploading}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending(`update:${editingBlock.id}`) || isUploading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
