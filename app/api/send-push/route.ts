import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as webpush from 'web-push';

// 1. Diz explicitamente ao Next.js para não tentar pré-renderizar ou estatizar esta rota no build
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 2. LAZY INITIALIZATION: As variáveis só serão lidas e validadas quando um request real chegar
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configurações de infraestrutura (Supabase Env) ausentes no servidor.' }, 
        { status: 500 }
      );
    }

    // Cria a instância isolada para esta requisição
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Configura o web-push internamente de forma segura
    webpush.setVapidDetails(
      'mailto:suporte@wedi.casa',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );

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
      url: `/` 
    });

    // 3. Dispara em paralelo para todos os dispositivos em lote
    const pushPromises = subscriptions.map((sub: any) => {
      const subJson = typeof sub.subscription_json === 'string' 
        ? JSON.parse(sub.subscription_json) 
        : sub.subscription_json;

      return webpush.sendNotification(subJson, payload)
        .catch((err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            return supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subJson.endpoint);
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