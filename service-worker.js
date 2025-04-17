// odak/service-worker.js

// PUSH geldiğinde bildirim göster
self.addEventListener('push', event => {
  let data = { title: 'Yeni Haber', body: 'Detay yükleniyor…', url: '/' };
  try { data = event.data.json(); } catch(e){}

  const options = {
    body: data.body,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-192x192.png',
    data: { url: data.url }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Bildirime tıklanınca pencereyi aç
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Zaten açık bir client varsa ona odaklan
        for (let client of windowClients) {
          if (client.url === targetUrl && 'focus' in client)
            return client.focus();
        }
        // Yoksa yenisini aç
        if (clients.openWindow)
          return clients.openWindow(targetUrl);
      })
  );
});
