'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, List, Music2, PlayCircle } from 'lucide-react';
import type { CalculatedBlock, CalculatedTimelineResult, Category, LayoutMode } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import OffsetDropdown, { type OffsetSelectValue } from '@/components/OffsetDropdown';
import { ChevronDownIcon, PlayIcon } from '@/components/icons';
import { usePlayerStore } from '@/store/player-store';
import { blockToPlayerTrack, isMusicBlock } from '@/utils/player-track';
import { buildCategorySections } from '@/utils/category-helpers';
import { cn } from '@/utils/cn';

interface LiveViewProps {
  layout: LayoutMode;
  baseTime: string;
  timeline: CalculatedTimelineResult;
  categories: Category[];
  onAdjustOffset: (id: string, value: OffsetSelectValue) => void | Promise<void>;
  onStartBlockNow: (id: string) => void;
  currentBlockIndex: number;
  isPending: (key: string) => boolean;
  visibleHistoryCount: number;
  showAllHistory: boolean;
  onLoadPreviousBlock: () => void;
  onShowAllHistory: () => void;
  onHideCompleted: () => void;
}

const ITEM_TYPE_BADGE: Record<string, string> = {
  music: '🎵',
  music_local: '🔊',
  task: '✓',
};

function getLinearIndex(timeline: CalculatedTimelineResult, blockId: string): number {
  return timeline.linearBlocks.findIndex((block) => block.id === blockId);
}

function isRootCompleted(
  root: CalculatedBlock,
  timeline: CalculatedTimelineResult,
  currentBlockIndex: number
): boolean {
  const children = timeline.childrenByParentId[root.id] ?? [];

  if (children.length === 0) {
    const index = getLinearIndex(timeline, root.id);
    return index >= 0 && index < currentBlockIndex;
  }

  return children.every((child) => {
    const index = getLinearIndex(timeline, child.id);
    return index >= 0 && index < currentBlockIndex;
  });
}

interface HistoryControlsProps {
  completedCount: number;
  visibleCompletedCount: number;
  onLoadPreviousBlock: () => void;
  onShowAllHistory: () => void;
  onHideCompleted: () => void;
}

function HistoryControls({
  completedCount,
  visibleCompletedCount,
  onLoadPreviousBlock,
  onShowAllHistory,
  onHideCompleted,
}: HistoryControlsProps) {
  const hiddenCount = completedCount - visibleCompletedCount;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
      {hiddenCount > 0 && (
        <>
          <button
            type="button"
            onClick={onLoadPreviousBlock}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <ChevronUp size={14} aria-hidden />
            Carregar bloco anterior
          </button>
          <button
            type="button"
            onClick={onShowAllHistory}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <List size={14} aria-hidden />
            Carregar todos
          </button>
        </>
      )}
      {visibleCompletedCount > 0 && (
        <button
          type="button"
          onClick={onHideCompleted}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <ChevronDown size={14} aria-hidden />
          Ocultar concluídos
        </button>
      )}
      {hiddenCount > 0 && (
        <span className="ml-auto text-[11px] text-zinc-400">
          {hiddenCount} bloco{hiddenCount === 1 ? '' : 's'} oculto{hiddenCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

function LoadMusicButton({ block }: { block: CalculatedBlock }) {
  const requestPlay = usePlayerStore((s) => s.requestPlay);
  const requestPause = usePlayerStore((s) => s.requestPause);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaybackActive = usePlayerStore((s) => s.isPlaybackActive);
  const remoteOnly = usePlayerStore((s) => s.remoteOnly);
  const track = blockToPlayerTrack(block);
  if (!track) return null;

  const isActive = currentTrack?.id === block.id && isPlaybackActive;

  return (
    <button
      type="button"
      onClick={() => {
        if (isActive) requestPause(block.id);
        else requestPlay(track);
      }}
      className={cn(
        'mt-2 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'border-emerald-400/40 bg-emerald-400/20 text-emerald-300'
          : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
      )}
    >
      {isActive ? <Music2 size={16} aria-hidden /> : <PlayCircle size={16} aria-hidden />}
      {isActive
        ? remoteOnly
          ? 'A tocar no Host'
          : 'Tocando no player'
        : 'Carregar Música'}
    </button>
  );
}

function TimelineBlockRow({
  block,
  linearIndex,
  currentBlockIndex,
  layout,
  isPending,
  onAdjustOffset,
  onStartBlockNow,
  nested = false,
}: {
  block: CalculatedBlock;
  linearIndex: number;
  currentBlockIndex: number;
  layout: LayoutMode;
  isPending: (key: string) => boolean;
  onAdjustOffset: (id: string, value: OffsetSelectValue) => void | Promise<void>;
  onStartBlockNow: (id: string) => void;
  nested?: boolean;
}) {
  const isPast = linearIndex >= 0 && linearIndex < currentBlockIndex;
  const isActive = linearIndex === currentBlockIndex;
  const hasDelay = block.time_offset > 0;
  const isStarting = isPending(`start:${block.id}`);
  const isAdjusting = isPending(`adjust:${block.id}`);
  const isTimingBlock = linearIndex >= 0;
  const showMusicButton = isMusicBlock(block);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        nested && 'ml-6 border-l-2 border-l-emerald-500/25',
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
              {ITEM_TYPE_BADGE[block.item_type] && (
                <span className="mr-1.5">{ITEM_TYPE_BADGE[block.item_type]}</span>
              )}
              {block.title}
              {isActive && (
                <span className="ml-2 animate-pulse rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Em Andamento
                </span>
              )}
            </h3>
            {block.responsibles && (
              <p className="mt-1 text-xs text-emerald-400">👤 Resp: {block.responsibles}</p>
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
            {showMusicButton && <LoadMusicButton block={block} />}
          </div>
        </div>

        {layout === 'detailed' && isTimingBlock ? (
          <div className="flex w-full flex-col gap-2 border-t border-zinc-200 pt-3 sm:flex-row sm:items-center sm:justify-end dark:border-zinc-800/40 md:w-auto md:border-t-0 md:pt-0">
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
        ) : layout === 'clean' && isTimingBlock ? (
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
        ) : null}
      </div>
    </div>
  );
}

export default function LiveView({
  layout,
  baseTime,
  timeline,
  categories,
  onAdjustOffset,
  onStartBlockNow,
  currentBlockIndex,
  isPending,
  visibleHistoryCount,
  showAllHistory,
  onLoadPreviousBlock,
  onShowAllHistory,
  onHideCompleted,
}: LiveViewProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { completedBlocks, activeBlocks, visibleCompletedBlocks } = useMemo(() => {
    const completed = timeline.roots.filter((root) =>
      isRootCompleted(root, timeline, currentBlockIndex)
    );
    const active = timeline.roots.filter(
      (root) => !isRootCompleted(root, timeline, currentBlockIndex)
    );

    const visible = showAllHistory
      ? completed
      : visibleHistoryCount > 0
        ? completed.slice(-visibleHistoryCount)
        : [];

    return {
      completedBlocks: completed,
      activeBlocks: active,
      visibleCompletedBlocks: visible,
    };
  }, [timeline, currentBlockIndex, showAllHistory, visibleHistoryCount]);

  const categorySections = useMemo(
    () => buildCategorySections(categories, visibleCompletedBlocks, activeBlocks),
    [categories, visibleCompletedBlocks, activeBlocks]
  );

  const parentsWithChildren = useMemo(
    () =>
      timeline.roots.filter(
        (root) => (timeline.childrenByParentId[root.id]?.length ?? 0) > 0
      ),
    [timeline]
  );

  useEffect(() => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.size === 0) {
        for (const root of parentsWithChildren) next.add(root.id);
      }
      for (const root of parentsWithChildren) {
        const children = timeline.childrenByParentId[root.id] ?? [];
        const rootLinearIndex = getLinearIndex(timeline, root.id);
        const hasActiveChild = children.some(
          (child) => getLinearIndex(timeline, child.id) === currentBlockIndex
        );
        if (rootLinearIndex === currentBlockIndex || hasActiveChild) {
          next.add(root.id);
        }
      }
      return next;
    });
  }, [currentBlockIndex, parentsWithChildren, timeline]);

  useEffect(() => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      for (const section of categorySections) {
        if (section.active.length > 0) next.add(section.id);
      }
      if (next.size === 0) {
        for (const section of categorySections) next.add(section.id);
      }
      return next;
    });
  }, [categorySections]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const renderRootBlock = (root: CalculatedBlock, historyMuted = false) => {
    const children = timeline.childrenByParentId[root.id] ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = historyMuted ? true : expandedParents.has(root.id);
    const rootLinearIndex = getLinearIndex(timeline, root.id);

    const content = !hasChildren ? (
      <TimelineBlockRow
        key={root.id}
        block={root}
        linearIndex={rootLinearIndex}
        currentBlockIndex={currentBlockIndex}
        layout={layout}
        isPending={isPending}
        onAdjustOffset={onAdjustOffset}
        onStartBlockNow={onStartBlockNow}
      />
    ) : (
      <div key={root.id} className="space-y-2">
        <div
          className={cn(
            'rounded-xl border p-4 transition-all duration-200',
            historyMuted
              ? 'cursor-default border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60'
              : 'cursor-pointer border-zinc-200 bg-zinc-50 hover:border-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-950/60'
          )}
          onClick={historyMuted ? undefined : () => toggleParent(root.id)}
          onKeyDown={
            historyMuted
              ? undefined
              : (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleParent(root.id);
                  }
                }
          }
          role={historyMuted ? undefined : 'button'}
          tabIndex={historyMuted ? undefined : 0}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!historyMuted) toggleParent(root.id);
              }}
              disabled={historyMuted}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 transition dark:border-zinc-700',
                isExpanded && 'rotate-180',
                historyMuted && 'opacity-60'
              )}
              aria-label={isExpanded ? 'Recolher sub-itens' : 'Expandir sub-itens'}
            >
              <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-500">
                  {root.start} → {root.end}
                </span>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                  {root.title}
                </h3>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {children.length} sub-itens · {root.actualDuration}m
                </span>
              </div>
              {root.responsibles && (
                <p className="mt-1 text-xs text-emerald-400">👤 Resp: {root.responsibles}</p>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 border-l-2 border-emerald-500/20 pl-2">
              {children.map((child) => (
                <TimelineBlockRow
                  key={child.id}
                  block={child}
                  linearIndex={getLinearIndex(timeline, child.id)}
                  currentBlockIndex={currentBlockIndex}
                  layout={layout}
                  isPending={isPending}
                  onAdjustOffset={onAdjustOffset}
                  onStartBlockNow={onStartBlockNow}
                  nested
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    if (!historyMuted) return content;

    return (
      <div key={root.id} className="opacity-60 grayscale-[0.35] transition-opacity">
        {content}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-zinc-200 bg-white p-3 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800/40 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">
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
        {completedBlocks.length > 0 && (
          <HistoryControls
            completedCount={completedBlocks.length}
            visibleCompletedCount={visibleCompletedBlocks.length}
            onLoadPreviousBlock={onLoadPreviousBlock}
            onShowAllHistory={onShowAllHistory}
            onHideCompleted={onHideCompleted}
          />
        )}

        {categorySections.map((section) => {
          const isCategoryExpanded = expandedCategories.has(section.id);
          const blockCount = section.visibleCompleted.length + section.active.length;

          return (
            <div key={section.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleCategory(section.id)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-3 text-left transition hover:border-emerald-500/30 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
                aria-expanded={isCategoryExpanded}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    size={18}
                    className={cn(
                      'shrink-0 text-zinc-500 transition-transform duration-200',
                      isCategoryExpanded && 'rotate-180'
                    )}
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-base">
                      {section.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {blockCount} bloco{blockCount === 1 ? '' : 's'}
                      {section.active.length > 0 && (
                        <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">
                          · {section.active.length} ativo{section.active.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>

              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  isCategoryExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-3 border-l-2 border-emerald-500/15 pl-3">
                    {section.visibleCompleted.map((root) => renderRootBlock(root, true))}
                    {section.active.map((root) => renderRootBlock(root, false))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
