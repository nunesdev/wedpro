'use client';

import { usePlayerStore } from '@/store/player-store';
import { cn } from '@/utils/cn';

export function PlayerMainOffset({ children }: { children: React.ReactNode }) {
  const isOpen = usePlayerStore((s) => s.isOpen);
  const isFloating = usePlayerStore((s) => s.isFloating);

  return (
    <div className={cn('min-h-0 flex-1', isOpen && !isFloating && 'pb-32 sm:pb-28')}>
      {children}
    </div>
  );
}
