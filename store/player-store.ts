'use client';

import { create } from 'zustand';

export type PlayerTrackType = 'music_spotify' | 'music_local';

export interface PlayerTrack {
  id: string;
  title: string;
  type: PlayerTrackType;
  spotify_uri: string | null;
  audio_url: string | null;
  start_time: number;
}

interface PlayerStoreState {
  currentTrack: PlayerTrack | null;
  isOpen: boolean;
  isFloating: boolean;
  playTrack: (track: PlayerTrack) => void;
  closePlayer: () => void;
  setIsFloating: (value: boolean) => void;
  toggleIsFloating: () => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  currentTrack: null,
  isOpen: false,
  isFloating: false,

  playTrack: (track) =>
    set({
      currentTrack: track,
      isOpen: true,
    }),

  closePlayer: () =>
    set({
      currentTrack: null,
      isOpen: false,
    }),

  setIsFloating: (value) => set({ isFloating: value }),

  toggleIsFloating: () => set((state) => ({ isFloating: !state.isFloating })),
}));
