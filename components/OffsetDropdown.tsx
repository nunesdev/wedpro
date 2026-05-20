'use client';

import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/utils/cn';

export type OffsetSelectValue = number | 'reset';

const OFFSET_OPTIONS: { label: string; value: OffsetSelectValue }[] = [
  { label: 'Remover atrasos', value: 'reset' },
  { label: '+ 5 minutos', value: 5 },
  { label: '+ 10 minutos', value: 10 },
  { label: '+ 15 minutos', value: 15 },
  { label: '+ 30 minutos', value: 30 },
  { label: '+ 1 hora', value: 60 },
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
  disabled?: boolean;
  onSelect: (value: OffsetSelectValue) => void | Promise<void>;
}

export default function OffsetDropdown({
  disabled = false,
  onSelect,
}: OffsetDropdownProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div ref={containerRef} className="relative min-w-0 flex-1 sm:flex-initial">
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !loading && setOpen((prev) => !prev)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[10.5rem] sm:w-auto',
          open
            ? 'border-emerald-500/50 bg-white text-zinc-900 shadow-sm dark:border-emerald-500/40 dark:bg-zinc-800 dark:text-zinc-100'
            : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
        )}
      >
        <span className="truncate">{loading ? 'Aplicando…' : 'Atrasar esse bloco'}</span>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <ChevronDownIcon className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && !loading && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:right-auto sm:min-w-full"
        >
          {OFFSET_OPTIONS.map((option) => (
            <li key={String(option.value)} role="option">
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full cursor-pointer px-3 py-3 text-left text-sm transition sm:py-2.5',
                  option.value === 'reset'
                    ? 'font-medium text-red-600 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10 dark:active:bg-red-500/15'
                    : 'font-mono font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-700'
                )}
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
