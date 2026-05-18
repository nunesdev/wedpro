'use client';

import { useTimelineStore } from '@/store/timeline-store';
import { useToast } from '@/components/ToastProvider';
import BackofficeView from '@/components/BackofficeView';

export function TimelineBackoffice() {
  const { showToast } = useToast();
  const theme = useTimelineStore((s) => s.theme);
  const baseTime = useTimelineStore((s) => s.baseTime);
  const blocks = useTimelineStore((s) => s.blocks);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const updateBaseTime = useTimelineStore((s) => s.updateBaseTime);
  const addBlock = useTimelineStore((s) => s.addBlock);
  const removeBlock = useTimelineStore((s) => s.removeBlock);
  const resetOffsets = useTimelineStore((s) => s.resetOffsets);
  const reorderBlocks = useTimelineStore((s) => s.reorderBlocks);

  return (
    <BackofficeView
      theme={theme}
      baseTime={baseTime}
      setBaseTime={(time) =>
        runWithLoading('baseTime', async () => {
          const result = await updateBaseTime(time);
          if (result.ok) showToast(`Hora base: ${time}`, 'info');
          else showToast(result.error, 'error');
        })
      }
      blocks={blocks}
      onAddBlock={(title, duration) =>
        runWithLoading('addBlock', async () => {
          const result = await addBlock(title, duration);
          if (result.ok) showToast(`Bloco "${title}" adicionado`, 'success');
          else showToast(result.error, 'error');
        })
      }
      onRemoveBlock={(id) =>
        runWithLoading(`remove:${id}`, async () => {
          const result = await removeBlock(id);
          if (result.ok) showToast('Bloco removido', 'warning');
          else showToast(result.error, 'error');
        })
      }
      onResetOffsets={() =>
        runWithLoading('resetOffsets', async () => {
          const result = await resetOffsets();
          if (result.ok) showToast('Tempos extras zerados', 'warning');
          else showToast(result.error, 'error');
        })
      }
      onReorderBlocks={(updated) =>
        runWithLoading('reorder', async () => {
          const result = await reorderBlocks(updated);
          if (result.ok) showToast('Ordem atualizada', 'info');
          else showToast(result.error, 'error');
        })
      }
      isPending={isPending}
    />
  );
}
