'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  JoinQueueResult,
  QueueGuest,
  QueueSnapshot,
  QueueStatus,
} from '@/types/queue.types';
import { QUEUE_TIMER_DURATIONS } from '@/types/queue.types';
import { isDuplicateWaitingName } from '@/utils/queue-name';

const STORAGE_KEY = 'ceria-queue-v1';

function createGuest(name: string): QueueGuest {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    joinedAt: Date.now(),
  };
}

interface QueueStoreState extends QueueSnapshot {
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  joinQueue: (name: string) => JoinQueueResult;
  removeFromQueue: (guestId: string) => void;
  callNext: () => void;
  skip: () => void;
  startPreparing: () => void;
  finish: () => void;
  addTime: (seconds: number) => void;
  resetAll: () => void;
  tick: () => void;
  onTimerExpire: () => void;
}

const idleState: QueueSnapshot = {
  queue: [],
  activeGuest: null,
  status: 'idle',
  secondsLeft: 0,
};

export const useQueueStore = create<QueueStoreState>()(
  persist(
    (set, get) => ({
      ...idleState,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      joinQueue: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, reason: 'empty' };

        const { queue } = get();
        if (isDuplicateWaitingName(trimmed, queue)) {
          return { ok: false, reason: 'duplicate_name' };
        }

        set((state) => ({
          queue: [...state.queue, createGuest(trimmed)],
        }));
        return { ok: true };
      },

      removeFromQueue: (guestId) => {
        set((state) => ({
          queue: state.queue.filter((g) => g.id !== guestId),
        }));
      },

      callNext: () => {
        const { queue } = get();
        if (queue.length === 0) {
          set({ ...idleState });
          return;
        }
        const [next, ...rest] = queue;
        set({
          queue: rest,
          activeGuest: next,
          status: 'called',
          secondsLeft: QUEUE_TIMER_DURATIONS.called,
        });
      },

      skip: () => get().callNext(),

      startPreparing: () => {
        if (!get().activeGuest) return;
        set({
          status: 'preparing',
          secondsLeft: QUEUE_TIMER_DURATIONS.preparing,
        });
      },

      finish: () => get().callNext(),

      addTime: (seconds) => {
        const { status, secondsLeft } = get();
        if (status === 'idle') return;
        set({ secondsLeft: secondsLeft + seconds });
      },

      resetAll: () => set({ ...idleState }),

      tick: () => {
        const { status, secondsLeft } = get();
        if (status === 'idle' || secondsLeft <= 0) return;
        set({ secondsLeft: secondsLeft - 1 });
      },

      onTimerExpire: () => {
        const { status } = get();
        if (status === 'called' || status === 'preparing') {
          get().callNext();
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue,
        activeGuest: state.activeGuest,
        status: state.status,
        secondsLeft: state.secondsLeft,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
