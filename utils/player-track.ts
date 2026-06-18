import type { CalculatedBlock } from '@/types';
import type { PlayerTrack } from '@/store/player-store';

export function blockToPlayerTrack(block: CalculatedBlock): PlayerTrack | null {
  if (block.item_type === 'music' && block.metadata?.spotify_uri) {
    return {
      id: block.id,
      title: block.title,
      type: 'music_spotify',
      spotify_uri: block.metadata.spotify_uri,
      audio_url: null,
      start_time: 0,
    };
  }

  if (block.item_type === 'music_local' && block.metadata?.audio_url) {
    return {
      id: block.id,
      title: block.title,
      type: 'music_local',
      spotify_uri: null,
      audio_url: block.metadata.audio_url,
      start_time: block.metadata.start_time ?? 0,
    };
  }

  return null;
}

export function isMusicBlock(block: CalculatedBlock): boolean {
  return block.item_type === 'music' || block.item_type === 'music_local';
}
