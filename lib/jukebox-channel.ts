import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PlayerTrack } from '@/store/player-store';

export const JUKEBOX_CHANNEL_NAME = 'jukebox';

export interface JukeboxPlayPayload {
  id: string;
  url: string | null;
  name: string;
  startAt: number;
  type: PlayerTrack['type'];
  spotify_uri: string | null;
}

let channel: RealtimeChannel | null = null;
let subscriberCount = 0;
let subscribePromise: Promise<RealtimeChannel> | null = null;

export function waitForChannel(channelRef: RealtimeChannel): Promise<RealtimeChannel> {
  if (channelRef.state === 'joined') {
    return Promise.resolve(channelRef);
  }

  if (!subscribePromise) {
    subscribePromise = new Promise((resolve, reject) => {
      channelRef.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve(channelRef);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Jukebox channel failed: ${status}`));
        }
      });
    });
  }

  return subscribePromise;
}

export function jukeboxPayloadFromTrack(track: PlayerTrack): JukeboxPlayPayload {
  return {
    id: track.id,
    url: track.audio_url,
    name: track.title,
    startAt: track.start_time,
    type: track.type,
    spotify_uri: track.spotify_uri,
  };
}

export function trackFromJukeboxPayload(payload: JukeboxPlayPayload): PlayerTrack {
  return {
    id: payload.id,
    title: payload.name,
    type: payload.type,
    spotify_uri: payload.spotify_uri,
    audio_url: payload.url,
    start_time: payload.startAt,
  };
}

export function acquireJukeboxChannel(): RealtimeChannel {
  if (!channel) {
    channel = supabase.channel(JUKEBOX_CHANNEL_NAME, {
      config: { broadcast: { ack: false, self: false } },
    });
    subscribePromise = null;
  }
  subscriberCount += 1;
  return channel;
}

export function releaseJukeboxChannel(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0 && channel) {
    void supabase.removeChannel(channel);
    channel = null;
    subscribePromise = null;
  }
}

async function withReadyChannel<T>(fn: (ch: RealtimeChannel) => Promise<T>): Promise<T> {
  const ch = acquireJukeboxChannel();
  try {
    const ready = await waitForChannel(ch);
    return await fn(ready);
  } finally {
    releaseJukeboxChannel();
  }
}

export async function broadcastPlaySong(payload: JukeboxPlayPayload): Promise<void> {
  await withReadyChannel((ch) =>
    ch.send({
      type: 'broadcast',
      event: 'PLAY_SONG',
      payload,
    })
  );
}

export async function broadcastPauseSong(trackId?: string): Promise<void> {
  await withReadyChannel((ch) =>
    ch.send({
      type: 'broadcast',
      event: 'PAUSE_SONG',
      payload: { id: trackId ?? null },
    })
  );
}
