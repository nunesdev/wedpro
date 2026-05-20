'use client';

import { cn } from '@/utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  className,
}: ToggleProps) {
  const toggleId = id ?? 'toggle';

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full border transition-colors',
            checked
              ? 'bg-emerald-600 border-emerald-500'
              : 'bg-zinc-200 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </span>
      {label && <span className="text-sm text-zinc-400">{label}</span>}
    </label>
  );
}
