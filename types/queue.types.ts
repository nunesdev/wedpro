export type QueueStatus = 'idle' | 'called' | 'preparing';

export interface QueueGuest {
  id: string;
  name: string;
  joinedAt: number;
}

export interface QueueSnapshot {
  queue: QueueGuest[];
  activeGuest: QueueGuest | null;
  status: QueueStatus;
  secondsLeft: number;
}

export const QUEUE_TIMER_DURATIONS = {
  called: 2 * 60,
  preparing: 5 * 60,
} as const;

export type JoinQueueResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'duplicate_name' | 'failed' };
