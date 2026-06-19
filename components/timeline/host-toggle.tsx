'use client';

import { MonitorSpeaker } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { usePlayerStore } from '@/store/player-store';
import { cn } from '@/utils/cn';

export function HostToggle({ className }: { className?: string }) {
  const isHost = usePlayerStore((s) => s.isHost);
  const setIsHost = usePlayerStore((s) => s.setIsHost);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
        isHost
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MonitorSpeaker
          size={18}
          className={cn('shrink-0', isHost ? 'text-emerald-500' : 'text-zinc-400')}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Jukebox remoto</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isHost
              ? 'Este dispositivo reproduz o áudio para a mesa de som.'
              : 'Controlo remoto — o áudio toca no computador Host.'}
          </p>
        </div>
      </div>

      <Toggle
        id="jukebox-host-toggle"
        checked={isHost}
        onChange={setIsHost}
        label="Sou o Host"
        className="shrink-0"
      />
    </div>
  );
}
