import type { BlockItemType } from '@/types';

export const TIMELINE_EVENT_ID = '560f0e54-c0c2-49d7-8268-896b6fd03816';

export const BLOCK_ITEM_TYPE_OPTIONS: { value: BlockItemType; label: string }[] = [
  { value: 'event', label: 'Evento' },
  { value: 'music', label: 'Música' },
  { value: 'music_local', label: 'Música - Arquivo Local' },
  { value: 'task', label: 'Tarefa' },
];
