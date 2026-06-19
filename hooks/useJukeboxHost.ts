'use client';

import { useEffect } from 'react';
import {
  acquireJukeboxChannel,
  releaseJukeboxChannel,
  trackFromJukeboxPayload,
  waitForChannel,
  type JukeboxPlayPayload,
} from '@/lib/jukebox-channel';
import { usePlayerStore } from '@/store/player-store';

export function useJukeboxHost() {
  const isHost = usePlayerStore((s) => s.isHost);
  const playHostTrack = usePlayerStore((s) => s.playHostTrack);
  const pausePlayback = usePlayerStore((s) => s.pausePlayback);
  const hydrateIsHost = usePlayerStore((s) => s.hydrateIsHost);

  useEffect(() => {
    hydrateIsHost();
  }, [hydrateIsHost]);

  useEffect(() => {
    if (!isHost) return;

    let cancelled = false;
    const channel = acquireJukeboxChannel();

    const onPlaySong = ({ payload }: { payload: JukeboxPlayPayload }) => {
      playHostTrack(trackFromJukeboxPayload(payload));
    };

    const onPauseSong = () => {
      pausePlayback();
    };

    void waitForChannel(channel).then((readyChannel) => {
      if (cancelled) return;
      readyChannel.on('broadcast', { event: 'PLAY_SONG' }, onPlaySong);
      readyChannel.on('broadcast', { event: 'PAUSE_SONG' }, onPauseSong);
    });

    return () => {
      cancelled = true;
      releaseJukeboxChannel();
    };
  }, [isHost, playHostTrack, pausePlayback]);
}
