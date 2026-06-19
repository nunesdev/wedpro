'use client';

import { create } from 'zustand';
import {
  broadcastPauseSong,
  broadcastPlaySong,
  jukeboxPayloadFromTrack,
} from '@/lib/jukebox-channel';

export type PlayerTrackType = 'music_spotify' | 'music_local';

export interface PlayerTrack {
  id: string;
  title: string;
  type: PlayerTrackType;
  spotify_uri: string | null;
  audio_url: string | null;
  start_time: number;
}

export type PlaybackIntent = 'idle' | 'play' | 'pause';

interface PlayerStoreState {
  currentTrack: PlayerTrack | null;
  isOpen: boolean;
  isFloating: boolean;
  isHost: boolean;
  remoteOnly: boolean;
  isPlaybackActive: boolean;
  playbackIntent: PlaybackIntent;
  playbackNonce: number;
  audioUnlockNonce: number;
  playTrack: (track: PlayerTrack, options?: { remoteOnly?: boolean }) => void;
  playHostTrack: (track: PlayerTrack) => void;
  playRemoteTrack: (track: PlayerTrack) => void;
  requestPlay: (track: PlayerTrack) => void;
  requestPause: (trackId?: string) => void;
  pausePlayback: () => void;
  closePlayer: () => void;
  setIsFloating: (value: boolean) => void;
  toggleIsFloating: () => void;
  setIsHost: (value: boolean) => void;
  hydrateIsHost: () => void;
  triggerHostUnlock: () => void;
  setPlaybackActive: (active: boolean) => void;
  acknowledgePlaybackIntent: () => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  currentTrack: null,
  isOpen: false,
  isFloating: false,
  isHost: false,
  remoteOnly: false,
  isPlaybackActive: false,
  playbackIntent: 'idle',
  playbackNonce: 0,
  audioUnlockNonce: 0,

  playTrack: (track, options) => {
    const remoteOnly = options?.remoteOnly ?? false;
    set((state) => ({
      currentTrack: track,
      isOpen: true,
      remoteOnly,
      playbackIntent: 'play',
      playbackNonce: state.playbackNonce + 1,
      isPlaybackActive: true,
    }));
  },

  playHostTrack: (track) => {
    set((state) => ({
      currentTrack: track,
      isOpen: true,
      remoteOnly: false,
      playbackIntent: 'play',
      playbackNonce: state.playbackNonce + 1,
      isPlaybackActive: true,
    }));
  },

  playRemoteTrack: (track) => {
    get().playTrack(track, { remoteOnly: true });
  },

  requestPlay: (track) => {
    const { isHost } = get();
    if (isHost) {
      get().playHostTrack(track);
      return;
    }

    get().playRemoteTrack(track);
    void broadcastPlaySong(jukeboxPayloadFromTrack(track));
  },

  requestPause: (trackId) => {
    const { isHost } = get();

    if (isHost) {
      get().pausePlayback();
      return;
    }

    set((state) => ({
      playbackIntent: 'pause',
      playbackNonce: state.playbackNonce + 1,
      isPlaybackActive: false,
    }));
    void broadcastPauseSong(trackId);
  },

  pausePlayback: () => {
    set((state) => ({
      playbackIntent: 'pause',
      playbackNonce: state.playbackNonce + 1,
      isPlaybackActive: false,
    }));
  },

  closePlayer: () =>
    set({
      currentTrack: null,
      isOpen: false,
      remoteOnly: false,
      isPlaybackActive: false,
      playbackIntent: 'idle',
    }),

  setIsFloating: (value) => set({ isFloating: value }),

  toggleIsFloating: () => set((state) => ({ isFloating: !state.isFloating })),

  setIsHost: (value) => {
    try {
      localStorage.setItem('jukebox_is_host', value ? 'true' : 'false');
    } catch {
      /* ignore */
    }
    set({ isHost: value, remoteOnly: false });
    if (value) {
      get().triggerHostUnlock();
    }
  },

  hydrateIsHost: () => {
    try {
      const stored = localStorage.getItem('jukebox_is_host') === 'true';
      if (stored !== get().isHost) {
        get().setIsHost(stored);
      }
    } catch {
      /* ignore */
    }
  },

  triggerHostUnlock: () =>
    set((state) => ({
      audioUnlockNonce: state.audioUnlockNonce + 1,
    })),

  setPlaybackActive: (active) => set({ isPlaybackActive: active }),

  acknowledgePlaybackIntent: () => set({ playbackIntent: 'idle' }),
}));
