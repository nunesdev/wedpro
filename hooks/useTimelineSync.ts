'use client';

import { useEffect } from 'react';
import { TIMELINE_EVENT_ID } from '@/lib/timeline/constants';
import { supabase } from '@/lib/supabase';
import { useTimelineStore } from '@/store/timeline-store';
import type { ThemeMode } from '@/types';

/** Supabase realtime + initial snapshot for timeline domain only. */
export function useTimelineSync() {
  const fetchSnapshot = useTimelineStore((s) => s.fetchSnapshot);
  const setInitialLoading = useTimelineStore((s) => s.setInitialLoading);
  const setTheme = useTimelineStore((s) => s.setTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('wedi_theme') as ThemeMode | null;
    if (savedTheme) setTheme(savedTheme);

    const load = async () => {
      setInitialLoading(true);
      try {
        await fetchSnapshot();
      } finally {
        setInitialLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`timeline-${TIMELINE_EVENT_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${TIMELINE_EVENT_ID}`,
        },
        () => {
          void fetchSnapshot();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `event_id=eq.${TIMELINE_EVENT_ID}`,
        },
        () => {
          void fetchSnapshot();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSnapshot, setInitialLoading, setTheme]);
}
