import { supabase } from '@/lib/supabase';

export interface PushNotificationPayload {
  eventId: string;
  title: string;
  message: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushActionResult = { ok: true } | { ok: false; error: string };

export async function subscribeWebPush(
  registration: ServiceWorkerRegistration,
  eventId: string
): Promise<PushActionResult> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { ok: false, error: 'Chave VAPID pública não configurada' };
  }

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      }));

    const subscriptionRaw = subscription.toJSON();
    if (!subscriptionRaw.endpoint) {
      return { ok: false, error: 'Assinatura de push inválida' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        event_id: eventId,
        endpoint: subscriptionRaw.endpoint,
        subscription_json: subscriptionRaw,
      },
      { onConflict: 'endpoint' }
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao ativar push';
    return { ok: false, error: message };
  }
}

export async function unsubscribeWebPush(
  registration: ServiceWorkerRegistration,
  eventId: string
): Promise<PushActionResult> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return { ok: true };

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('event_id', eventId)
      .eq('endpoint', endpoint);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao desativar push';
    return { ok: false, error: message };
  }
}

/**
 * Dispara uma notificação Web Push para todos os usuários inscritos no evento.
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
      console.error(
        `Falha na API de Push (Status: ${response.status}):`,
        errorData.error || response.statusText
      );
      return;
    }

    const data = await response.json();
    console.log('Push disparado com sucesso.', data);
  } catch (err) {
    console.error('Erro de rede ao tentar disparar Web Push:', err);
  }
};
