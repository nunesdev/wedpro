'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

export const THEME_STORAGE_KEY = 'theme';

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeStoreState {
  theme: ThemeMode;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state.theme);
          state.setHasHydrated(true);
        }
      },
    }
  )
);

/** Migra preferência antiga `wedi_theme` para a chave unificada `theme`. */
export function migrateLegacyThemeKey() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    const legacy = localStorage.getItem('wedi_theme') as ThemeMode | null;
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem(THEME_STORAGE_KEY, legacy);
    }
  } catch {
    /* ignore */
  }
}
