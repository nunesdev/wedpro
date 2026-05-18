'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownOption<T extends string | number> {
  label: string;
  value: T;
}

export interface DropdownProps<T extends string | number> {
  label: string;
  options: DropdownOption<T>[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function Dropdown<T extends string | number>({
  label,
  options,
  onSelect,
  disabled = false,
  className,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-600 cursor-pointer disabled:opacity-50"
      >
        <span className="truncate">{label}</span>
        <svg
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
        >
          <path
            d="M3.5 5.25 7 8.75l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
          {options.map((option) => (
            <li key={String(option.value)}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
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
