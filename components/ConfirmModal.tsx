'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/utils/cn';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
        onClick={onCancel}
        disabled={loading}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        <h2 id="confirm-modal-title" className="mb-2 text-lg font-bold tracking-tight">
          {title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoadingSpinner size="sm" className="text-white" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
