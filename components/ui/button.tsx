'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'amber'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-600',
  secondary:
    'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  ghost:
    'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent',
  danger:
    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30',
  amber:
    'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-amber-950 border border-amber-500/25',
  outline:
    'bg-transparent text-zinc-300 hover:bg-zinc-800 border border-zinc-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      type = 'button',
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 font-medium transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
