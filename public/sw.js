// public/sw.js

// Escuta o evento de Push enviado pelo servidor (Apple/Google Push Services)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Alteração no cronograma',
      icon: '/images/icon-192x192.png',
      badge: '/images/icon-192x192.png', // Ícone que aparece na barra de status do Android
      vibrate: [200, 100, 200],    // Faz o celular vibrar no bolso da cerimonialista
      data: {
        url: data.url || '/'       // URL para onde o usuário vai ao clicar
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'wedi.WE PRO', options)
    );
  } catch (err) {
    console.error('Erro ao processar payload do push:', err);
  }
});

// Redireciona o usuário ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});