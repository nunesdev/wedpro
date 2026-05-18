import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Inicializa o Supabase com a Service Role Key (para contornar RLS se necessário no backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configura o web-push com as chaves geradas
webpush.setVapidDetails(
  'mailto:suporte@wedi.casa', // Pode ser qualquer email seu
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { eventId, title, message } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId é obrigatório' }, { status: 400 });
    }

    // 1. Busca todas as assinaturas push daquele casamento no Supabase
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription_json')
      .eq('event_id', eventId);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum dispositivo registrado para este evento.' });
    }

    // 2. Prepara o payload que o sw.js vai receber
    const payload = JSON.stringify({
      title: title || 'wedi.casa Live',
      body: message || 'O cronograma sofreu alterações.',
      url: `/live` // Opcional: para onde o usuário vai ao clicar
    });

    // 3. Dispara em paralelo para todos os dispositivos em lote
    const pushPromises = subscriptions.map((sub: any) => {
      return webpush.sendNotification(sub.subscription_json, payload)
        .catch((err) => {
          // Se o token expirou ou o usuário desinstalou o PWA, removemos do banco para limpar lixo
          if (err.statusCode === 410 || err.statusCode === 404) {
            return supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.subscription_json.endpoint);
          }
          console.error('Erro ao enviar para um dispositivo específico:', err);
        });
    });

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true, dispatchedCount: subscriptions.length });

  } catch (error: any) {
    console.error('Erro na rota de push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}