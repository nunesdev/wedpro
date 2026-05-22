'use client';

import { create } from 'zustand';
import type { Block, CalculatedBlock, LayoutMode } from '@/types';
import { TIMELINE_EVENT_ID } from '@/lib/timeline/constants';
import { supabase } from '@/lib/supabase';
import { calculateTimeline } from '@/utils/timeline-calculations';
import { parseTimeToMinutes } from '@/utils/time-formatter';
import { dispatchWebPush } from '@/lib/push';

type MutationResult = { ok: true } | { ok: false; error: string };

interface TimelineStoreState {
  blocks: Block[];
  baseTime: string;
  currentBlockIndex: number;
  layout: LayoutMode;
  initialLoading: boolean;
  pendingKeys: string[];
  confirmStartBlockId: string | null;

  setLayout: (layout: LayoutMode) => void;
  toggleLayout: () => void;
  setInitialLoading: (loading: boolean) => void;
  setBlocks: (blocks: Block[]) => void;
  setBaseTime: (time: string) => void;
  setCurrentBlockIndex: (index: number) => void;
  setConfirmStartBlockId: (id: string | null) => void;

  isPending: (key: string) => boolean;
  runWithLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
  getCalculatedTimeline: () => CalculatedBlock[];

  fetchSnapshot: () => Promise<void>;
  updateBaseTime: (time: string) => Promise<MutationResult>;
  addBlock: (title: string, duration: number) => Promise<MutationResult>;
  removeBlock: (id: string) => Promise<MutationResult>;
  resetOffsets: () => Promise<MutationResult>;
  adjustOffset: (id: string, value: number | 'reset') => Promise<MutationResult>;
  reorderBlocks: (updatedBlocks: Block[]) => Promise<MutationResult>;
  startBlockNow: (targetBlockId: string) => Promise<MutationResult>;
  executeStartBlockNow: (targetBlockId: string) => Promise<void>;
}

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  blocks: [],
  baseTime: '16:00',
  currentBlockIndex: -1,
  layout: 'detailed',
  initialLoading: true,
  pendingKeys: [],
  confirmStartBlockId: null,

  setLayout: (layout) => set({ layout }),
  toggleLayout: () =>
    set({ layout: get().layout === 'detailed' ? 'clean' : 'detailed' }),
  setInitialLoading: (initialLoading) => set({ initialLoading }),
  setBlocks: (blocks) => set({ blocks }),
  setBaseTime: (baseTime) => set({ baseTime }),
  setCurrentBlockIndex: (currentBlockIndex) => set({ currentBlockIndex }),
  setConfirmStartBlockId: (confirmStartBlockId) => set({ confirmStartBlockId }),

  isPending: (key) => get().pendingKeys.includes(key),

  runWithLoading: async (key, fn) => {
    set((s) => ({ pendingKeys: [...s.pendingKeys, key] }));
    try {
      return await fn();
    } finally {
      set((s) => ({
        pendingKeys: s.pendingKeys.filter((k) => k !== key),
      }));
    }
  },

  getCalculatedTimeline: () => calculateTimeline(get().blocks, get().baseTime),

  fetchSnapshot: async () => {
    const { data: event } = await supabase
      .from('events')
      .select('base_time, current_block_index')
      .eq('id', TIMELINE_EVENT_ID)
      .single();

    if (event) {
      set({
        baseTime: event.base_time,
        currentBlockIndex: event.current_block_index,
      });
    }

    const { data: fetchedBlocks } = await supabase
      .from('blocks')
      .select('*')
      .eq('event_id', TIMELINE_EVENT_ID)
      .order('position', { ascending: true });

    if (fetchedBlocks) set({ blocks: fetchedBlocks });
  },

  updateBaseTime: async (time) => {
    const { error } = await supabase
      .from('events')
      .update({ base_time: time })
      .eq('id', TIMELINE_EVENT_ID);

    if (error) return { ok: false, error: error.message };

    await dispatchWebPush({
      eventId: TIMELINE_EVENT_ID,
      title: '🕰️ Nova Hora de Início',
      message: `A hora base do evento foi reprogramada para as ${time}.`,
    });

    return { ok: true };
  },

  addBlock: async (title, duration) => {
    const blocks = get().blocks;
    const { error } = await supabase.from('blocks').insert({
      event_id: TIMELINE_EVENT_ID,
      title,
      duration,
      position: blocks.length,
      time_offset: 0,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  removeBlock: async (id) => {
    const { error } = await supabase.from('blocks').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  resetOffsets: async () => {
    const { error: eventError } = await supabase
      .from('events')
      .update({ current_block_index: -1 })
      .eq('id', TIMELINE_EVENT_ID);

    const { error: blocksError } = await supabase
      .from('blocks')
      .update({ time_offset: 0 })
      .eq('event_id', TIMELINE_EVENT_ID);

    if (eventError || blocksError) {
      return { ok: false, error: eventError?.message ?? blocksError?.message ?? 'Erro' };
    }
    return { ok: true };
  },

  adjustOffset: async (id, value) => {
    const targetBlock = get().blocks.find((b) => b.id === id);
    if (!targetBlock) return { ok: false, error: 'Bloco não encontrado' };

    const newOffset = value === 'reset' ? 0 : targetBlock.time_offset + value;

    const { error } = await supabase
      .from('blocks')
      .update({ time_offset: newOffset })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    if (value !== 'reset' && typeof value === 'number') {
      const label = value === 60 ? '1 hora' : `${value} minutos`;
      await dispatchWebPush({
        eventId: TIMELINE_EVENT_ID,
        title: '⏱️ Ajuste no Cronograma',
        message: `Houve um atraso de ${label} no bloco "${targetBlock.title}".`,
      });
    }

    return { ok: true };
  },

  reorderBlocks: async (updatedBlocks) => {
    const payload = updatedBlocks.map((block, index) => ({
      id: block.id,
      event_id: TIMELINE_EVENT_ID,
      title: block.title,
      duration: block.duration,
      time_offset: block.time_offset ?? 0,
      position: index,
    }));

    const { error } = await supabase.from('blocks').upsert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  executeStartBlockNow: async (targetBlockId) => {
    const { blocks } = get();
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
    if (targetIndex === -1) return;

    const nowStr = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const nowInMinutes = parseTimeToMinutes(nowStr);
    const timeline = calculateTimeline(blocks, get().baseTime);
    const projectedStartInMinutes = parseTimeToMinutes(timeline[targetIndex].start);
    const difference = nowInMinutes - projectedStartInMinutes;

    if (targetIndex === 0) {
      await supabase
        .from('events')
        .update({ base_time: nowStr })
        .eq('id', TIMELINE_EVENT_ID);
    } else if (difference !== 0) {
      const previousBlock = blocks[targetIndex - 1];
      await supabase
        .from('blocks')
        .update({ time_offset: previousBlock.time_offset + difference })
        .eq('id', previousBlock.id);
    }

    await supabase
      .from('events')
      .update({ current_block_index: targetIndex })
      .eq('id', TIMELINE_EVENT_ID);
  },

  startBlockNow: async (targetBlockId) => {
    await get().executeStartBlockNow(targetBlockId);

    const targetIndex = get().blocks.findIndex((b) => b.id === targetBlockId);
    const nextBlock = get().blocks[targetIndex];

    if (nextBlock) {
      await dispatchWebPush({
        eventId: TIMELINE_EVENT_ID,
        title: '▶️ Bloco Iniciado',
        message: `Atenção Equipe: O bloco "${nextBlock.title}" começou agora.`,
      });
    }

    return { ok: true };
  },

  updateBlock: (id: string, title: string, duration: number, responsibles: string | null) => {
    return get().runWithLoading(`update:${id}`, async () => {
      try {
        const { error } = await supabase
          .from('blocks')
          .update({ 
            title, 
            duration, 
            responsibles 
          })
          .eq('id', id);

        if (error) throw error;

        // Atualiza o estado local do Zustand na memória para refletir na tela imediatamente
        set((state) => ({
          blocks: state.blocks.map((b) => 
            b.id === id ? { ...b, title, duration, responsibles } : b
          )
        }));

        return { ok: true };
      } catch (err: any) {
        console.error('Erro ao atualizar bloco no Supabase:', err);
        return { ok: false, error: err.message || 'Erro ao atualizar bloco.' };
      }
    });
  },
}));
