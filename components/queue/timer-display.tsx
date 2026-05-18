'use client';

import { secondsToMMSS } from '@/utils/time-formatter';
import { cn } from '@/utils/cn';

export interface TimerDisplayProps {
  seconds: number;
  label?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl sm:text-9xl',
};

export function TimerDisplay({
  seconds,
  label,
  size = 'lg',
  className,
}: TimerDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          {label}
        </span>
      )}
      <time
        dateTime={`PT${Math.max(0, seconds)}S`}
        className={cn('font-mono font-bold tabular-nums tracking-tight', sizeClasses[size])}
      >
        {secondsToMMSS(seconds)}
      </time>
    </div>
  );
}
