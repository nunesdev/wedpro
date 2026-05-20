'use client';

import { useEffect, type ReactNode } from 'react';
import {
  applyThemeToDocument,
  migrateLegacyThemeKey,
  useThemeStore,
} from '@/store/theme-store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const setHasHydrated = useThemeStore((s) => s.setHasHydrated);

  useEffect(() => {
    migrateLegacyThemeKey();

    const syncDom = () => {
      applyThemeToDocument(useThemeStore.getState().theme);
      setHasHydrated(true);
    };

    if (useThemeStore.persist.hasHydrated()) {
      syncDom();
    }

    const unsub = useThemeStore.persist.onFinishHydration(syncDom);
    void useThemeStore.persist.rehydrate();

    return unsub;
  }, [setHasHydrated]);

  return <>{children}</>;
}
