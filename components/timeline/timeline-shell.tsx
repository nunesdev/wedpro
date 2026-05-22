'use client';

import { type ReactNode } from 'react';
import { useTimelineSync } from '@/hooks/useTimelineSync';
import { useTimelineStore } from '@/store/timeline-store';
import { useToast } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';

function TimelineChrome({ children }: { children: ReactNode }) {
  useTimelineSync();
  const { showToast } = useToast();

  const initialLoading = useTimelineStore((s) => s.initialLoading);
  const confirmStartBlockId = useTimelineStore((s) => s.confirmStartBlockId);
  const setConfirmStartBlockId = useTimelineStore((s) => s.setConfirmStartBlockId);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const startBlockNow = useTimelineStore((s) => s.startBlockNow);

  return (
    <>
      {initialLoading && (
        <div className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-white/75 backdrop-blur-md dark:bg-zinc-950/75">
          <LoadingSpinner size="lg" className="text-emerald-500" />
        </div>
      )}

      {children}

      <ConfirmModal
        open={confirmStartBlockId !== null}
        title="⚠️ Iniciar bloco agora?"
        message="Ao iniciar este bloco imediatamente, o(s) bloco(s) anterior(es) será(ão) considerado(s) concluído(s) e os horários seguintes mudarão em cascata."
        loading={
          confirmStartBlockId !== null && isPending(`start:${confirmStartBlockId}`)
        }
        onConfirm={() => {
          if (!confirmStartBlockId) return;
          void runWithLoading(`start:${confirmStartBlockId}`, async () => {
            const result = await startBlockNow(confirmStartBlockId);
            if (result.ok) showToast('Bloco iniciado', 'success');
            else showToast(result.error, 'error');
            setConfirmStartBlockId(null);
          });
        }}
        onCancel={() => setConfirmStartBlockId(null)}
      />
    </>
  );
}

export function TimelineShell({ children }: { children: ReactNode }) {
  return <TimelineChrome>{children}</TimelineChrome>;
}
