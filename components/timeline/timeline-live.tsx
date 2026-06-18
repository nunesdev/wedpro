'use client';

import { useState } from 'react';
import { useTimelineStore } from '@/store/timeline-store';
import { useToast } from '@/components/ToastProvider';
import LiveView from '@/components/LiveView';
import { AddBlockFab } from '@/components/timeline/add-block-fab';
import type { OffsetSelectValue } from '@/components/OffsetDropdown';
import { getLinearBlockIndex } from '@/utils/timeline-calculations';

export function TimelineLive() {
  const { showToast } = useToast();
  const layout = useTimelineStore((s) => s.layout);
  const baseTime = useTimelineStore((s) => s.baseTime);
  const currentBlockIndex = useTimelineStore((s) => s.currentBlockIndex);
  const getCalculatedTimelineResult = useTimelineStore((s) => s.getCalculatedTimelineResult);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const adjustOffset = useTimelineStore((s) => s.adjustOffset);
  const setConfirmStartBlockId = useTimelineStore((s) => s.setConfirmStartBlockId);
  const startBlockNow = useTimelineStore((s) => s.startBlockNow);
  const blocks = useTimelineStore((s) => s.blocks);
  const categories = useTimelineStore((s) => s.categories);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const handleAdjustOffset = (id: string, value: OffsetSelectValue) =>
    runWithLoading(`adjust:${id}`, async () => {
      const result = await adjustOffset(id, value);
      if (!result.ok) {
        showToast('Não foi possível atualizar o bloco', 'error');
        return;
      }
      if (value === 'reset') showToast('Atrasos removidos', 'success');
      else if (typeof value === 'number') {
        const label = value === 60 ? '1 hora' : `${value} minutos`;
        showToast(`Atraso de ${label} aplicado`, 'info');
      }
    });

  const handleStartBlockNow = (targetBlockId: string) => {
    const targetIndex = getLinearBlockIndex(blocks, targetBlockId);
    if (targetIndex === -1) return;

    if (targetIndex > currentBlockIndex) {
      setConfirmStartBlockId(targetBlockId);
      return;
    }

    void runWithLoading(`start:${targetBlockId}`, async () => {
      const result = await startBlockNow(targetBlockId);
      if (result.ok) showToast('Bloco iniciado', 'success');
      else showToast(result.error, 'error');
    });
  };

  return (
    <div className="pb-20 sm:pb-6">
      <LiveView
        layout={layout}
        baseTime={baseTime}
        timeline={getCalculatedTimelineResult()}
        categories={categories}
        onAdjustOffset={handleAdjustOffset}
        onStartBlockNow={handleStartBlockNow}
        currentBlockIndex={currentBlockIndex}
        isPending={isPending}
        visibleHistoryCount={visibleHistoryCount}
        showAllHistory={showAllHistory}
        onLoadPreviousBlock={() => setVisibleHistoryCount((prev) => prev + 1)}
        onShowAllHistory={() => setShowAllHistory(true)}
        onHideCompleted={() => {
          setVisibleHistoryCount(0);
          setShowAllHistory(false);
        }}
      />
      <AddBlockFab />
    </div>
  );
}
