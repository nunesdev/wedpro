'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MasterGuest } from '@/types/checkin.types';

const STORAGE_KEY = 'ceria-checkin-v1';

const SEED_GUESTS: MasterGuest[] = [
  { id: '1', name: 'Maria Silva', table: 'Mesa 12', partySize: 2, checkedInAt: null },
  { id: '2', name: 'João Santos', table: 'Mesa 4', partySize: 1, checkedInAt: null },
  { id: '3', name: 'Ana Costa', table: 'Mesa 8', partySize: 3, checkedInAt: null },
  { id: '4', name: 'Pedro Oliveira', table: 'Mesa 2', partySize: 2, checkedInAt: null },
  { id: '5', name: 'Família Mendes', table: 'Mesa 15', partySize: 5, checkedInAt: null },
];

interface CheckinStoreState {
  guests: MasterGuest[];
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  checkIn: (guestId: string) => void;
  undoCheckIn: (guestId: string) => void;
  importGuests: (guests: MasterGuest[]) => void;
}

export const useCheckinStore = create<CheckinStoreState>()(
  persist(
    (set) => ({
      guests: SEED_GUESTS,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      checkIn: (guestId) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId ? { ...g, checkedInAt: Date.now() } : g
          ),
        }));
      },

      undoCheckIn: (guestId) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId ? { ...g, checkedInAt: null } : g
          ),
        }));
      },

      importGuests: (guests) => set({ guests }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ guests: state.guests }),
      onRehydrateStorage: () => (state) => {
        if (state && state.guests.length === 0) {
          state.importGuests(SEED_GUESTS);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
