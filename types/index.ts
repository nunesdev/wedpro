export interface Block {
  id: string;
  event_id: string;
  title: string;
  duration: number;
  time_offset: number; // Atualizado de offset para time_offset
  position: number;
}

export interface CalculatedBlock extends Block {
  start: string;
  end: string;
  actualDuration: number;
}

export type ThemeMode = 'light' | 'dark';
export type LayoutMode = 'detailed' | 'clean';
export type ViewMode = 'live' | 'backoffice';