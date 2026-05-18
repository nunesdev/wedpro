'use client';

import React from 'react';
import { ThemeMode } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  theme: ThemeMode;
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
  theme,
  confirmLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer disabled:cursor-not-allowed"
        onClick={onCancel}
        disabled={loading}
        aria-label="Fechar"
      />
      <div
        className={`relative w-full max-w-md rounded-xl border p-6 shadow-2xl ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <h2
          id="confirm-modal-title"
          className="text-lg font-bold tracking-tight mb-2"
        >
          {title}
        </h2>
        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
              isDark
                ? 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 min-w-[7rem] cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" className="text-white" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
