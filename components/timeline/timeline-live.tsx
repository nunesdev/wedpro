'use client';

import { useTimelineStore } from '@/store/timeline-store';
import { useToast } from '@/components/ToastProvider';
import LiveView from '@/components/LiveView';
import type { OffsetSelectValue } from '@/components/OffsetDropdown';

export function TimelineLive() {
  const { showToast } = useToast();
  const theme = useTimelineStore((s) => s.theme);
  const layout = useTimelineStore((s) => s.layout);
  const baseTime = useTimelineStore((s) => s.baseTime);
  const currentBlockIndex = useTimelineStore((s) => s.currentBlockIndex);
  const getCalculatedTimeline = useTimelineStore((s) => s.getCalculatedTimeline);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const adjustOffset = useTimelineStore((s) => s.adjustOffset);
  const setConfirmStartBlockId = useTimelineStore((s) => s.setConfirmStartBlockId);
  const startBlockNow = useTimelineStore((s) => s.startBlockNow);
  const blocks = useTimelineStore((s) => s.blocks);

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
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
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
    <LiveView
      theme={theme}
      layout={layout}
      baseTime={baseTime}
      timelineData={getCalculatedTimeline()}
      onAdjustOffset={handleAdjustOffset}
      onStartBlockNow={handleStartBlockNow}
      currentBlockIndex={currentBlockIndex}
      isPending={isPending}
    />
  );
}
