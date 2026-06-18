import type { Block, BlockFormInput, BlockItemType, BlockMetadata, Category } from '@/types';

/** Normaliza campos vindos do Supabase para o shape da aplicação. */
export function normalizeBlock(raw: Record<string, unknown>): Block {
  const metadata = raw.metadata as BlockMetadata | null | undefined;
  const categoryRaw = raw.category as Category | null | undefined;

  return {
    id: raw.id as string,
    event_id: raw.event_id as string,
    title: raw.title as string,
    duration: Number(raw.duration),
    time_offset: Number(raw.time_offset ?? 0),
    position: Number(raw.position),
    responsibles: (raw.responsibles as string | null) ?? null,
    parent_id: (raw.parent_id as string | null) ?? null,
    category_id: (raw.category_id as string | null) ?? null,
    category:
      categoryRaw && typeof categoryRaw === 'object' && categoryRaw.id
        ? { id: categoryRaw.id, name: categoryRaw.name, position: categoryRaw.position }
        : null,
    item_type: (raw.item_type as Block['item_type']) ?? 'event',
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
  };
}

export function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    id: raw.id as string,
    name: raw.name as string,
    position: raw.position !== undefined ? Number(raw.position) : undefined,
  };
}

/** Extrai o ID do Spotify de URI, URL ou ID puro. */
export function parseSpotifyUri(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const trackMatch = trimmed.match(/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) return trackMatch[1];

  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  return trimmed;
}

export function buildBlockMetadata(
  itemType: BlockItemType,
  options: {
    spotifyUri?: string;
    audioUrl?: string;
    startTime?: number;
  }
): BlockMetadata | null {
  if (itemType === 'music') {
    const trimmed = parseSpotifyUri(options.spotifyUri ?? '');
    return trimmed ? { spotify_uri: trimmed } : null;
  }

  if (itemType === 'music_local' && options.audioUrl) {
    return {
      audio_url: options.audioUrl,
      start_time: Math.max(0, options.startTime ?? 0),
    };
  }

  return null;
}

export function buildFormInput(
  title: string,
  duration: number,
  responsibles: string,
  parentId: string,
  itemType: BlockItemType,
  categoryId: string | null,
  metadataOptions: {
    spotifyUri?: string;
    audioUrl?: string;
    startTime?: number;
  }
): BlockFormInput {
  return {
    title: title.trim(),
    duration,
    responsibles: responsibles.trim() || null,
    parent_id: parentId || null,
    category_id: categoryId,
    item_type: itemType,
    metadata: buildBlockMetadata(itemType, metadataOptions),
  };
}
