'use client';

import { useState, useRef, useEffect } from 'react';
import { ThemeMode } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

export type OffsetSelectValue = number | 'reset';

const OFFSET_OPTIONS: { label: string; value: OffsetSelectValue }[] = [
  { label: 'Remover atrasos', value: 'reset' },
  { label: '5 minutos', value: 5 },
  { label: '10 minutos', value: 10 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '1 hora', value: 60 },
];

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface OffsetDropdownProps {
  theme: ThemeMode;
  disabled?: boolean;
  onSelect: (value: OffsetSelectValue) => void | Promise<void>;
}

export default function OffsetDropdown({
  theme,
  disabled = false,
  onSelect,
}: OffsetDropdownProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const loading = busy;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = async (value: OffsetSelectValue) => {
    setOpen(false);
    setBusy(true);
    try {
      await onSelect(value);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 sm:flex-initial min-w-0">
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !loading && setOpen((prev) => !prev)}
        className={`w-full sm:w-auto sm:min-w-[10.5rem] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          open
            ? isDark
              ? 'border-emerald-500/40 bg-zinc-800 text-zinc-100'
              : 'border-emerald-500/50 bg-white text-zinc-900 shadow-sm'
            : isDark
              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800'
              : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-white'
        }`}
      >
        <span className="truncate">{loading ? 'Aplicando…' : 'Atrasar em…'}</span>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <ChevronDownIcon
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && !loading && (
        <ul
          role="listbox"
          className={`absolute left-0 right-0 sm:right-auto sm:min-w-full mt-1.5 z-30 py-1 rounded-lg border shadow-xl overflow-hidden ${
            isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'
          }`}
        >
          {OFFSET_OPTIONS.map((option) => (
            <li key={String(option.value)} role="option">
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-3 sm:py-2.5 text-sm transition cursor-pointer ${
                  option.value === 'reset'
                    ? isDark
                      ? 'font-medium text-red-400 hover:bg-red-500/10 active:bg-red-500/15'
                      : 'font-medium text-red-600 hover:bg-red-50 active:bg-red-100'
                    : isDark
                      ? 'font-mono font-semibold text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700'
                      : 'font-mono font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
