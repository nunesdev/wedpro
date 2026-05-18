'use client';

import React, { useState, useEffect } from 'react';
import { Block, CalculatedBlock, ThemeMode, LayoutMode, ViewMode } from '@/types';
import { supabase } from '@/lib/supabase'; // Importação do seu client Supabase
import Header from '@/components/Header';
import BackofficeView from '@/components/BackofficeView';
import LiveView from '@/components/LiveView';
import ConfirmModal from '@/components/ConfirmModal';
import { dispatchWebPush } from '@/lib/push';

// Substitua pelo UUID gerado na tabela 'events' do seu painel Supabase
const HARDCODED_EVENT_ID = '560f0e54-c0c2-49d7-8268-896b6fd03816';

export default function WediCasa() {
  // Configurações Locais de Interface (Mantidas no estado/localStorage local do app)
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [layout, setLayout] = useState<LayoutMode>('detailed');
  const [view, setView] = useState<ViewMode>('live');
  const [confirmStart, setConfirmStart] = useState<{ blockId: string } | null>(null);

  // ESTADOS SINCRONIZADOS COM O SUPABASE
  const [baseTime, setBaseTime] = useState<string>('16:00');
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(-1);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // 1. Defina a função fora ou dentro do componente (fora do useEffect)
  const triggerLocalPush = (title: string, message: string) => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { 
        body: message, 
        icon: '/logo.png' // Substitua pelo ícone do wedi.casa
      });
    }
  };

  // 2. CARREGAMENTO INICIAL E ASSINATURA REALTIME (WebSockets)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    
      // 1. Registra o arquivo sw.js
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
          
          // 2. Solicita permissão para notificações
          return Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              // Aqui vamos gerar a assinatura de Push para salvar no Supabase posteriormente
              getPushSubscription(registration);
            }
          });
        })
        .catch((err) => console.error('Erro ao registrar Service Worker:', err));
    }

    // Solicita permissão ao usuário logo que a página carrega
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Carrega preferências visuais do cliente
    const savedTheme = localStorage.getItem('wedi_theme');
    if (savedTheme) setTheme(savedTheme as ThemeMode);

    // FUNÇÃO PARA BUSCAR ESTADO ATUAL DO BANCO (Snapshot Inicial)
    const fetchEventData = async () => {
      // Busca dados centrais do Evento
      const { data: event } = await supabase
        .from('events')
        .select('base_time, current_block_index')
        .eq('id', HARDCODED_EVENT_ID)
        .single();
      
      if (event) {
        setBaseTime(event.base_time);
        setCurrentBlockIndex(event.current_block_index);
      }

      // Busca os blocos associados e ordena por posição do Drag & Drop
      const { data: fetchedBlocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('event_id', HARDCODED_EVENT_ID)
        .order('position', { ascending: true });

      if (fetchedBlocks) setBlocks(fetchedBlocks);
    };

    fetchEventData();

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

        // 🚀 QUEM CHAMA O PUSH EM CASO DE AJUSTE DE TEMPO:
        if (payload.new) {
          triggerLocalPush(
            "⚠️ Ajuste no Cronograma", 
            `O bloco "${payload.new.title}" sofreu uma alteração no tempo.`
          );
        }
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

  const handleSetBaseTime = async (time: string) => {
    const { error } = await supabase
      .from('events')
      .update({ base_time: time })
      .eq('id', HARDCODED_EVENT_ID);

    if (!error) {
      dispatchWebPush({
        eventId: HARDCODED_EVENT_ID,
        title: "🕰️ Nova Hora de Início",
        message: `A hora base do evento foi reprogramada para as ${time}.`
      });
    }
  };

  const handleAddBlock = async (title: string, duration: number) => {
    // A nova posição será o fim da fila atual
    const nextPosition = blocks.length;
    
    await supabase
      .from('blocks')
      .insert({
        event_id: HARDCODED_EVENT_ID,
        title,
        duration,
        position: nextPosition,
        time_offset: 0
      });
  };

  const handleRemoveBlock = async (id: string) => {
    await supabase
      .from('blocks')
      .delete()
      .eq('id', id);
  };

  const handleResetOffsets = async () => {
    // 1. Zera a linha do tempo master do evento
    await supabase
      .from('events')
      .update({ current_block_index: -1 })
      .eq('id', HARDCODED_EVENT_ID);

    // 2. Zera o offset de todos os blocos do casamento de uma vez só
    await supabase
      .from('blocks')
      .update({ time_offset: 0 })
      .eq('event_id', HARDCODED_EVENT_ID);
  };

  const handleAdjustOffset = async (id: string, minutes: number) => {
  const targetBlock = blocks.find(b => b.id === id);
  if (!targetBlock) return;

  const { error } = await supabase
    .from('blocks')
    .update({ time_offset: targetBlock.time_offset + minutes })
    .eq('id', id);

  if (!error) {
    // Alerta de ajuste fino
    const tipoAjuste = minutes > 0 ? 'atraso' : 'adiantamento';
    dispatchWebPush({
      eventId: HARDCODED_EVENT_ID,
      title: "⏱️ Ajuste no Cronograma",
      message: `Houve um ${tipoAjuste} de ${Math.abs(minutes)} min no bloco "${targetBlock.title}".`
    });
  }
};

  const handleReorderBlocks = async (updatedBlocks: Block[]) => {
    // Prepara o payload remapeando as novas posições inteiras do array ordenado
    const payload = updatedBlocks.map((block, index) => ({
      id: block.id,
      event_id: HARDCODED_EVENT_ID,
      title: block.title,
      duration: block.duration,
      time_offset: block.time_offset ?? 0,
      position: index // Nova propriedade de ordenação do Drag and Drop
    }));

    // Realiza o Upsert em lote baseado na Primary Key (id)
    await supabase
      .from('blocks')
      .upsert(payload);
  };

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
      await handleSetBaseTime(nowStr);
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

  const handleStartBlockNow = (targetBlockId: string) => {
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
    if (targetIndex === -1) return;

    if (targetIndex > currentBlockIndex) {
      setConfirmStart({ blockId: targetBlockId });
      return;
    }

    const nextBlock = blocks[targetIndex];

    // Aciona o utilitário assíncrono (sem o 'await' para não travar a UI visual)
    dispatchWebPush({
      eventId: HARDCODED_EVENT_ID,
      title: "▶️ Bloco Iniciado",
      message: `Atenção Equipe: O bloco "${nextBlock.title}" começou agora.`
    });

    executeStartBlockNow(targetBlockId);
    
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
      />

      <main className="px-4 sm:px-6 mt-6">
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
          />
        )}
      </main>

      <ConfirmModal
        open={confirmStart !== null}
        theme={theme}
        title="⚠️ Iniciar bloco agora?"
        message="Ao iniciar este bloco imediatamente, o(s) bloco(s) anterior(es) será(ão) considerado(s) concluído(s)/cancelado(s) e travado(s). Os horários seguintes mudarão em cascata."
        onConfirm={() => {
          if (confirmStart) executeStartBlockNow(confirmStart.blockId);
          setConfirmStart(null);
        }}
        onCancel={() => setConfirmStart(null)}
      />
    </div>
  );
}