'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type BarStatus = 'waiting' | 'called' | 'preparing' | 'completed';

export interface BarRequest {
  id: string;
  name: string;
  status: BarStatus;
  created_at: string;
  expires_at: string | null;
}

export function useSupabaseSelfBar() {
  const [queue, setQueue] = useState<BarRequest[]>([]);
  const [activeGuest, setActiveGuest] = useState<BarRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);

  const status = activeGuest ? activeGuest.status : 'idle';

  // 1. Busca inicial e Inscrição no Realtime
  useEffect(() => {
    const fetchQueue = async () => {
      const { data } = await supabase
        .from('bar_requests')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: true });

      if (data) {
        setQueue(data.filter((d) => d.status === 'waiting'));
        setActiveGuest(data.find((d) => d.status === 'called' || d.status === 'preparing') || null);
      }
      setHasHydrated(true);
    };

    fetchQueue();

    const channel = supabase
      .channel('bar_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_requests' }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- FUNÇÕES DE MUTAÇÃO ---

  // Função blindada contra Race Conditions (Múltiplas telas zerando o timer ao mesmo tempo)
  const callNext = async (currentGuestId?: string) => {
    const targetId = currentGuestId || activeGuest?.id;
    
    // 1. Completa o atual
    if (targetId) {
      await supabase.from('bar_requests').update({ status: 'completed' }).eq('id', targetId);
    }
    
    // 2. Busca o primeiro da fila fresquinho direto do banco para evitar duplicidade
    const { data: freshQueue } = await supabase
      .from('bar_requests')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1);

    // 3. Chama o próximo
    if (freshQueue && freshQueue.length > 0) {
      const next = freshQueue[0];
      const expires = new Date(Date.now() + 2 * 60000).toISOString(); 
      await supabase.from('bar_requests').update({ status: 'called', expires_at: expires }).eq('id', next.id);
    }
  };

  // 2. Motor do Cronômetro com Auto-Skip
  useEffect(() => {
    if (!activeGuest || !activeGuest.expires_at) {
      setSecondsLeft(0);
      return;
    }

    let isExpired = false; // Trava de segurança para não disparar várias vezes

    const interval = setInterval(() => {
      if (isExpired) return; 

      const now = new Date().getTime();
      const expires = new Date(activeGuest.expires_at!).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      
      setSecondsLeft(diff);
      
      // ZEROU O CRONÔMETRO!
      if (diff === 0) {
        isExpired = true;
        clearInterval(interval);
        
        // Regra de Negócio: Só pula automaticamente se o convidado foi chamado e não apareceu.
        // Se estiver "preparando", o cronômetro trava no 0 esperando o bartender apertar "Terminei".
        if (activeGuest.status === 'called') {
          callNext(activeGuest.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGuest]);


  const joinQueue = async (name: string) => {
    await supabase.from('bar_requests').insert([{ name, status: 'waiting' }]);
  };

  const removeFromQueue = async (id: string) => {
    await supabase.from('bar_requests').update({ status: 'completed' }).eq('id', id);
  };

  const skip = () => callNext();
  const finish = () => callNext();

  const startPreparing = async () => {
    if (!activeGuest) return;
    const expires = new Date(Date.now() + 5 * 60000).toISOString(); 
    await supabase.from('bar_requests').update({ status: 'preparing', expires_at: expires }).eq('id', activeGuest.id);
  };

  const addMinutes = async (minutes: number) => {
    if (!activeGuest || !activeGuest.expires_at) return;
    const currentExpires = new Date(activeGuest.expires_at).getTime();
    const newExpires = new Date(currentExpires + minutes * 60000).toISOString();
    await supabase.from('bar_requests').update({ expires_at: newExpires }).eq('id', activeGuest.id);
  };

  const resetAll = async () => {
    await supabase.from('bar_requests').update({ status: 'completed' }).neq('status', 'completed');
  };

  return {
    queue, activeGuest, status, secondsLeft, hasHydrated,
    joinQueue, removeFromQueue, callNext, skip, finish, startPreparing, addMinutes, resetAll
  };
}