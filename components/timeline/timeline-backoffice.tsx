'use client';

import { useTimelineStore } from '@/store/timeline-store';
import { useToast } from '@/components/ToastProvider';
import BackofficeView from '@/components/BackofficeView';
import type { BlockFormInput } from '@/types';

export function TimelineBackoffice() {
  const { showToast } = useToast();
  const baseTime = useTimelineStore((s) => s.baseTime);
  const blocks = useTimelineStore((s) => s.blocks);
  const categories = useTimelineStore((s) => s.categories);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const updateBaseTime = useTimelineStore((s) => s.updateBaseTime);
  const addBlock = useTimelineStore((s) => s.addBlock);
  const removeBlock = useTimelineStore((s) => s.removeBlock);
  const resetOffsets = useTimelineStore((s) => s.resetOffsets);
  const reorderBlocks = useTimelineStore((s) => s.reorderBlocks);
  const updateBlock = useTimelineStore((s) => s.updateBlock);

  return (
    <BackofficeView
      baseTime={baseTime}
      setBaseTime={(time) =>
        runWithLoading('baseTime', async () => {
          const result = await updateBaseTime(time);
          if (result.ok) showToast(`Hora base: ${time}`, 'info');
          else showToast(result.error || 'Erro desconhecido', 'error');
        })
      }
      blocks={blocks}
      categories={categories}
      onAddBlock={(input: BlockFormInput) =>
        runWithLoading('addBlock', async () => {
          const result = await addBlock(input);
          if (result.ok) showToast(`Bloco "${input.title}" adicionado`, 'success');
          else showToast(result.error || 'Erro desconhecido', 'error');
        })
      }
      onRemoveBlock={(id) =>
        runWithLoading(`remove:${id}`, async () => {
          const result = await removeBlock(id);
          if (result.ok) showToast('Bloco removido', 'warning');
          else showToast(result.error || 'Erro desconhecido', 'error');
        })
      }
      onResetOffsets={() =>
        runWithLoading('resetOffsets', async () => {
          const result = await resetOffsets();
          if (result.ok) showToast('Tempos extras zerados', 'warning');
          else showToast(result.error || 'Erro desconhecido', 'error');
        })
      }
      onReorderBlocks={(updated) =>
        runWithLoading('reorder', async () => {
          const result = await reorderBlocks(updated);
          if (result.ok) showToast('Ordem atualizada', 'info');
          else showToast(result.error || 'Erro desconhecido', 'error');
        })
      }
      onUpdateBlock={(id, input) =>
        runWithLoading(`update:${id}`, async () => {
          const result = await updateBlock(id, input);
          if (result.ok) showToast('Bloco atualizado com sucesso!', 'success');
          else showToast(result.error || 'Erro desconhecido ao atualizar', 'error');
        })
      }
      isPending={isPending}
    />
  );
}
