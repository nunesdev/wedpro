import { supabase } from '@/lib/supabase';

export interface PushNotificationPayload {
  eventId: string;
  title: string;
  message: string;
}

export async function unsubscribeWebPush(
  registration: ServiceWorkerRegistration,
  eventId: string
): Promise<void> {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;

  await subscription.unsubscribe();

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('event_id', eventId)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Erro ao remover push_subscriptions:', error.message);
  }
}

/**
 * Dispara uma notificação Web Push para todos os usuários inscritos no evento.
 * O disparo é assíncrono (fire-and-forget), ele não trava o front-end enquanto a request processa.
 */
export const dispatchWebPush = async (payload: PushNotificationPayload): Promise<void> => {
  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Falha na API de Push (Status: ${response.status}):`, errorData.error || response.statusText);
      return;
    }

    const data = await response.json();
    console.log(`Push disparado com sucesso. Status:`, data);
  } catch (err) {
    console.error('Erro de rede ao tentar disparar Web Push:', err);
  }
};