'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Block, CalculatedBlock, ThemeMode, LayoutMode, ViewMode } from '@/types';
import { supabase } from '@/lib/supabase'; // Importação do seu client Supabase
import Header from '@/components/Header';
import BackofficeView from '@/components/BackofficeView';
import LiveView from '@/components/LiveView';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import type { OffsetSelectValue } from '@/components/OffsetDropdown';
import { dispatchWebPush, unsubscribeWebPush } from '@/lib/push';

// Substitua pelo UUID gerado na tabela 'events' do seu painel Supabase
const HARDCODED_EVENT_ID = '560f0e54-c0c2-49d7-8268-896b6fd03816';

function formatDelayLabel(value: number): string {
  if (value === 60) return '1 hora';
  return `${value} minutos`;
}

export default function WediCasa() {
  return (
    <ToastProvider>
      <WediCasaApp />
    </ToastProvider>
  );
}

function WediCasaApp() {
  const { showToast } = useToast();
  // Configurações Locais de Interface (Mantidas no estado/localStorage local do app)
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [layout, setLayout] = useState<LayoutMode>('detailed');
  const [view, setView] = useState<ViewMode>('live');
  const [confirmStart, setConfirmStart] = useState<{ blockId: string } | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ESTADOS SINCRONIZADOS COM O SUPABASE
  const [baseTime, setBaseTime] = useState<string>('16:00');
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(-1);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const runWithLoading = useCallback(async (key: string, fn: () => Promise<void>) => {
    setPending((prev) => new Set(prev).add(key));
    try {
      await fn();
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const isPending = useCallback((key: string) => pending.has(key), [pending]);

  // 2. CARREGAMENTO INICIAL E ASSINATURA REALTIME (WebSockets)
  useEffect(() => {
    // 1. Só executa no lado do cliente
    if (typeof window === 'undefined') return;

    // 2. BLINDAGEM DO MOBILE: Verifica se o navegador suporta Notificações normais
    const supportsNotifications = 'Notification' in window;
    const supportsServiceWorker = 'serviceWorker' in navigator;
    const supportsPush = 'PushManager' in window;

    // Registro do Service Worker e Push Subscription com checagem rígida
    if (supportsServiceWorker && supportsPush) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope);

          swRegistrationRef.current = registration;

          if (
            supportsNotifications &&
            window.Notification.permission === 'granted' &&
            localStorage.getItem('wedi_notifications') !== 'false'
          ) {
            getPushSubscription(registration);
          }
        })
        .catch((err) => console.error('Erro ao registrar Service Worker:', err));
    }
    
    // Carrega preferências visuais do cliente
    const savedTheme = localStorage.getItem('wedi_theme');
    if (savedTheme) setTheme(savedTheme as ThemeMode);

    // FUNÇÃO PARA BUSCAR ESTADO ATUAL DO BANCO (Snapshot Inicial)
    const fetchEventData = async (showInitialLoader = false) => {
      if (showInitialLoader) setInitialLoading(true);
      try {
        const { data: event } = await supabase
          .from('events')
          .select('base_time, current_block_index')
          .eq('id', HARDCODED_EVENT_ID)
          .single();

        if (event) {
          setBaseTime(event.base_time);
          setCurrentBlockIndex(event.current_block_index);
        }

        const { data: fetchedBlocks } = await supabase
          .from('blocks')
          .select('*')
          .eq('event_id', HARDCODED_EVENT_ID)
          .order('position', { ascending: true });

        if (fetchedBlocks) setBlocks(fetchedBlocks);
      } finally {
        if (showInitialLoader) setInitialLoading(false);
      }
    };

    fetchEventData(true);

    // ASSINATURA REALTIME DO CANAL DO EVENTO
    const channel = supabase
      .channel(`live-wedding-${HARDCODED_EVENT_ID}`)
      // Ouve alterações na tabela de eventos
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${HARDCODED_EVENT_ID}` }, (payload: any) => {
        if (payload.new) {
          setBaseTime(payload.new.base_time);
          setCurrentBlockIndex(payload.new.current_block_index);
          
        }
      })
      // Ouve alterações em qualquer bloco do casamento
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks', filter: `event_id=eq.${HARDCODED_EVENT_ID}` }, (payload: any) => {
        // Recarrega os blocos para garantir ordenação correta pós-mutação alheia
        fetchEventData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPushSubscription = async (registration: ServiceWorkerRegistration) => {
    try {
      const YOUR_PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; 

      // 1. Gera a assinatura nativa do navegador
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: YOUR_PUBLIC_VAPID_KEY
      });

      // Converte para objeto simples para extrairmos os dados
      const subscriptionRaw = subscription.toJSON();
      
      if (!subscriptionRaw.endpoint) return;

      // 2. Salva ou atualiza (upsert) no Supabase baseado no endpoint único
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          event_id: HARDCODED_EVENT_ID,
          endpoint: subscriptionRaw.endpoint,
          subscription_json: subscriptionRaw
        }, {
          onConflict: 'endpoint' // Se o endpoint já existir, ele apenas atualiza o registro
        });

      if (error) {
        console.error('Erro ao salvar assinatura no Supabase:', error.message);
      } else {
        console.log('🚀 Dispositivo registrado para Web Push com sucesso!');
      }

    } catch (err) {
      console.error('Erro ao obter assinatura de push:', err);
    }
  };

  // 2. MUTACÕES ASSÍNCRONAS (Updates direcionados ao Supabase)

  const handleSetBaseTime = (time: string) =>
    runWithLoading('baseTime', async () => {
      const { error } = await supabase
        .from('events')
        .update({ base_time: time })
        .eq('id', HARDCODED_EVENT_ID);

      if (error) {
        showToast('Não foi possível atualizar a hora base', 'error');
        return;
      }

      showToast(`Hora base atualizada para ${time}`, 'info');
      dispatchWebPush({
        eventId: HARDCODED_EVENT_ID,
        title: "🕰️ Nova Hora de Início",
        message: `A hora base do evento foi reprogramada para as ${time}.`,
      });
    });

  const handleAddBlock = (title: string, duration: number) =>
    runWithLoading('addBlock', async () => {
      const nextPosition = blocks.length;

      const { error } = await supabase.from('blocks').insert({
        event_id: HARDCODED_EVENT_ID,
        title,
        duration,
        position: nextPosition,
        time_offset: 0,
      });

      if (error) {
        showToast('Não foi possível adicionar o bloco', 'error');
        return;
      }

      showToast(`Bloco "${title}" adicionado`, 'success');
    });

  const handleRemoveBlock = (id: string) =>
    runWithLoading(`remove:${id}`, async () => {
      const block = blocks.find((b) => b.id === id);
      const { error } = await supabase.from('blocks').delete().eq('id', id);

      if (error) {
        showToast('Não foi possível remover o bloco', 'error');
        return;
      }

      showToast(
        block ? `Bloco "${block.title}" removido` : 'Bloco removido',
        'warning'
      );
    });

  const handleResetOffsets = () =>
    runWithLoading('resetOffsets', async () => {
      const { error: eventError } = await supabase
        .from('events')
        .update({ current_block_index: -1 })
        .eq('id', HARDCODED_EVENT_ID);

      const { error: blocksError } = await supabase
        .from('blocks')
        .update({ time_offset: 0 })
        .eq('event_id', HARDCODED_EVENT_ID);

      if (eventError || blocksError) {
        showToast('Não foi possível zerar os atrasos', 'error');
        return;
      }

      showToast('Tempos extras zerados no cronograma', 'warning');
    });

  const handleAdjustOffset = (id: string, value: OffsetSelectValue) =>
    runWithLoading(`adjust:${id}`, async () => {
      const targetBlock = blocks.find((b) => b.id === id);
      if (!targetBlock) return;

      const newOffset =
        value === 'reset' ? 0 : targetBlock.time_offset + value;

      const { error } = await supabase
        .from('blocks')
        .update({ time_offset: newOffset })
        .eq('id', id);

      if (error) {
        showToast('Não foi possível atualizar o bloco', 'error');
        return;
      }

      if (value === 'reset') {
        showToast(`Atrasos removidos de "${targetBlock.title}"`, 'success');
        return;
      }

      showToast(
        `Atraso de ${formatDelayLabel(value)} em "${targetBlock.title}"`,
        'info'
      );
      dispatchWebPush({
        eventId: HARDCODED_EVENT_ID,
        title: "⏱️ Ajuste no Cronograma",
        message: `Houve um atraso de ${formatDelayLabel(value)} no bloco "${targetBlock.title}".`,
      });
    });

  const handleReorderBlocks = (updatedBlocks: Block[]) =>
    runWithLoading('reorder', async () => {
      const payload = updatedBlocks.map((block, index) => ({
        id: block.id,
        event_id: HARDCODED_EVENT_ID,
        title: block.title,
        duration: block.duration,
        time_offset: block.time_offset ?? 0,
        position: index,
      }));

      const { error } = await supabase.from('blocks').upsert(payload);

      if (error) {
        showToast('Não foi possível reordenar os blocos', 'error');
        return;
      }

      showToast('Ordem dos blocos atualizada', 'info');
    });

  // ENGINE DO EFEITO CASCATA NA EXECUÇÃO LIVE
  const executeStartBlockNow = async (targetBlockId: string) => {
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
    if (targetIndex === -1) return;

    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowInMinutes = parseTimeToMinutes(nowStr);

    const timeline = calculateTimeline();
    const projectedStartInMinutes = parseTimeToMinutes(timeline[targetIndex].start);
    const difference = nowInMinutes - projectedStartInMinutes;

    if (targetIndex === 0) {
      await supabase
        .from('events')
        .update({ base_time: nowStr })
        .eq('id', HARDCODED_EVENT_ID);
    } else if (difference !== 0) {
      const previousBlock = blocks[targetIndex - 1];
      await supabase
        .from('blocks')
        .update({ time_offset: previousBlock.time_offset + difference })
        .eq('id', previousBlock.id);
    }

    // Trava o estado do bloco ativo diretamente no Supabase
    await supabase
      .from('events')
      .update({ current_block_index: targetIndex })
      .eq('id', HARDCODED_EVENT_ID);
  };

  const startBlockWithPush = (targetBlockId: string) => {
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
    const nextBlock = blocks[targetIndex];

    return runWithLoading(`start:${targetBlockId}`, async () => {
      await executeStartBlockNow(targetBlockId);

      if (nextBlock) {
        showToast(`Bloco "${nextBlock.title}" iniciado`, 'success');
        dispatchWebPush({
          eventId: HARDCODED_EVENT_ID,
          title: "▶️ Bloco Iniciado",
          message: `Atenção Equipe: O bloco "${nextBlock.title}" começou agora.`,
        });
      }
    });
  };

  const handleStartBlockNow = (targetBlockId: string) => {
    const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
    if (targetIndex === -1) return;

    if (targetIndex > currentBlockIndex) {
      setConfirmStart({ blockId: targetBlockId });
      return;
    }

    startBlockWithPush(targetBlockId);
  };

  // 3. ENGINES AUXILIARES DE CÁLCULO VISUAL (Calculados em memória em tempo de render)
  const calculateTimeline = (): CalculatedBlock[] => {
    let currentTotalMinutes = parseTimeToMinutes(baseTime);
    
    return blocks.map((block) => {
      const startTimeStr = formatMinutesToTime(currentTotalMinutes);
      const blockTotalDuration = block.duration + (block.time_offset ?? 0); // Lê a nova propriedade do banco
      currentTotalMinutes += blockTotalDuration;
      const endTimeStr = formatMinutesToTime(currentTotalMinutes);

      return {
        ...block,
        start: startTimeStr,
        end: endTimeStr,
        actualDuration: blockTotalDuration
      };
    });
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const formatMinutesToTime = (totalMins: number): string => {
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const timelineData = calculateTimeline();

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-12 ${
      theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <Header 
        theme={theme} 
        toggleTheme={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); localStorage.setItem('wedi_theme', next); }}
        layout={layout}
        toggleLayout={() => setLayout(layout === 'detailed' ? 'clean' : 'detailed')}
        view={view}
        setView={setView}
        onPermissionGranted={async () => {
          if (swRegistrationRef.current) {
            await getPushSubscription(swRegistrationRef.current);
            showToast('Notificações ativadas', 'success');
          }
        }}
        onNotificationsDisabled={async () => {
          if (swRegistrationRef.current) {
            await unsubscribeWebPush(swRegistrationRef.current, HARDCODED_EVENT_ID);
          }
          showToast('Notificações desativadas', 'warning');
        }}
      />

      {initialLoading && (
        <div className="fixed inset-0 z-[60] flex h-full min-h-screen items-center justify-center bg-white/75 backdrop-blur-md">
          <LoadingSpinner size="lg" className="text-emerald-500" />
        </div>
      )}

      <main className="relative px-4 sm:px-6 mt-6">
        {view === 'backoffice' ? (
          <BackofficeView
            theme={theme}
            baseTime={baseTime}
            setBaseTime={handleSetBaseTime}
            blocks={blocks}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
            onResetOffsets={handleResetOffsets}
            onReorderBlocks={handleReorderBlocks}
            isPending={isPending}
          />
        ) : (
          <LiveView
            theme={theme}
            layout={layout}
            baseTime={baseTime}
            timelineData={timelineData}
            onAdjustOffset={handleAdjustOffset}
            onStartBlockNow={handleStartBlockNow}
            currentBlockIndex={currentBlockIndex}
            isPending={isPending}
          />
        )}
      </main>

      <ConfirmModal
        open={confirmStart !== null}
        theme={theme}
        title="⚠️ Iniciar bloco agora?"
        message="Ao iniciar este bloco imediatamente, o(s) bloco(s) anterior(es) será(ão) considerado(s) concluído(s)/cancelado(s) e travado(s). Os horários seguintes mudarão em cascata."
        loading={confirmStart !== null && isPending(`start:${confirmStart.blockId}`)}
        onConfirm={() => {
          if (confirmStart) {
            startBlockWithPush(confirmStart.blockId).then(() => setConfirmStart(null));
          }
        }}
        onCancel={() => setConfirmStart(null)}
      />
    </div>
  );
}