export type BlockItemType = 'event' | 'music' | 'music_local' | 'task';

export interface Category {
  id: string;
  name: string;
  position?: number;
}

export interface BlockMetadata {
  spotify_uri?: string;
  audio_url?: string;
  start_time?: number;
}

export interface Block {
  id: string;
  event_id: string;
  title: string;
  duration: number;
  time_offset: number;
  position: number;
  responsibles?: string | null;
  parent_id: string | null;
  category_id?: string | null;
  category?: Category | null;
  item_type: BlockItemType;
  metadata: BlockMetadata | null;
}

export interface CalculatedBlock extends Block {
  start: string;
  end: string;
  actualDuration: number;
}

export interface CalculatedTimelineResult {
  /** Blocos raiz na ordem de exibição (parent_id === null). */
  roots: CalculatedBlock[];
  /** Filhos calculados agrupados por parent_id. */
  childrenByParentId: Record<string, CalculatedBlock[]>;
  /** Sequência linear usada para tempos e current_block_index. */
  linearBlocks: CalculatedBlock[];
  /** Lookup por id. */
  byId: Record<string, CalculatedBlock>;
}

export type ThemeMode = 'light' | 'dark';
export type LayoutMode = 'detailed' | 'clean';
export type ViewMode = 'live' | 'backoffice';

export interface BlockFormInput {
  title: string;
  duration: number;
  responsibles: string | null;
  parent_id: string | null;
  category_id: string | null;
  item_type: BlockItemType;
  metadata: BlockMetadata | null;
}
