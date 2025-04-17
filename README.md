
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Haberci Güvercin</title>
  <link rel="manifest" href="/manifest.json" />
</head>
<body>
  <title>Haberci Güvercin</title>
  <!-- Bootstrap ve stil dosyaları -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="assets/css/style.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
  <!-- Manifest (PWA için gerekli) -->
  <link rel="manifest" href="/manifest.json" />
  <!-- jQuery ve Bootstrap JS -->
  <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <!-- responsiveVoice kütüphanesi (TTS fallback) -->
  <script src="https://code.responsivevoice.org/responsivevoice.js"></script>
  <script type="text/javascript">
    atOptions = {
      'key': '072c2397ac9ce3f48e24f537bf3911b4',
      'format': 'iframe',
      'height': 600,
      'width': 160,
      'params': {}
    };
  </script>
  <meta name="theme-color" content="#ff4500" />

  <!-- Inline Service Worker ve Push Bildirim Entegrasyonu -->
  <script>
    // Service Worker kodunu string olarak tanımlıyoruz:
    const swCode = `
      // Takip edilecek RSS feed URL’leri (örnek, kullanıcı seçimine göre dinamik hale getirilebilir)
      const feedUrls = [
        "https://www.hurriyet.com.tr/rss/gundem",
        "https://www.cumhuriyet.com.tr/rss"
      ];
      // Her feed için son görülen haberin benzersiz kimliğini saklamak için (örneğin, guid veya title)
      let latestItems = {};

      self.addEventListener('install', event => {
        console.log("Service Worker yüklendi");
        self.skipWaiting();
      });

      self.addEventListener('activate', event => {
        console.log("Service Worker aktif");
      });

      // Periyodik Senkronizasyon (destek varsa)
      self.addEventListener('periodicsync', event => {
        if (event.tag === 'rss-sync') {
          console.log("Arka planda RSS kontrol etkinliği başladı...");
          event.waitUntil(checkFeedsAndNotify());
        }
      });

      // Bildirime tıklama: Kullanıcı bildirime tıkladığında ana sayfayı veya ilgili URL’i aç
      self.addEventListener('notificationclick', event => {
        event.notification.close();
        event.waitUntil(
          clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
              return clientList[0].focus();
            }
            return clients.openWindow('/index.html');
          })
        );
      });

      // RSS feedlerini kontrol edip, yeni haber varsa bildirim oluşturacak fonksiyon
      async function checkFeedsAndNotify() {
        for (const feedUrl of feedUrls) {
          try {
            const res = await fetch(feedUrl);
            if (!res.ok) {
              console.error("Feed çekilemedi:", feedUrl, res.status);
              continue;
            }
            const xmlText = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, "application/xml");
            const firstItem = doc.querySelector("item");
            if (!firstItem) continue;
            const title = firstItem.querySelector("title")?.textContent || "Yeni Haber";
            const link = firstItem.querySelector("link")?.textContent || "#";
            const guid = firstItem.querySelector("guid")?.textContent || title;
            
            if (latestItems[feedUrl] === guid) {
              console.log(feedUrl, "için yeni haber yok.");
            } else {
              latestItems[feedUrl] = guid;
              const notifTitle = "Yeni Haber: " + title;
              const notifOptions = {
                body: \`Kaynak: \${feedUrl}\`,
                icon: "icon-192.png",
                data: { url: link }
              };
              self.registration.showNotification(notifTitle, notifOptions);
              console.log("Bildirim gösterildi:", notifTitle);
            }
          } catch (e) {
            console.error("Feed kontrolünde hata:", e);
          }
        }
      }
    `;
    // Blob oluşturarak inline SW için bir URL elde ediyoruz:
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    // Service Worker'ı inline olarak kaydediyoruz:
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swUrl)
        .then(() => console.log("✅ Inline Service Worker başarıyla kaydedildi."))
        .catch(err => console.error("❌ Inline Service Worker kaydı hatası:", err));
    }

    // Bildirim izni ve Periodic Sync kaydı için yardımcı fonksiyonlar:
    async function askNotificationPermission() {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const result = await Notification.requestPermission();
      return result === 'granted';
    }

    async function registerPeriodicSync(swRegistration) {
      if ('periodicSync' in swRegistration) {
        try {
          await swRegistration.periodicSync.register('rss-sync', {
            minInterval: 15 * 60 * 1000  // Örneğin en az 15 dakika
          });
          console.log("Periodic background sync 'rss-sync' kaydedildi.");
        } catch(e) {
          console.error("Periodic Sync kaydedilemedi veya desteklenmiyor:", e);
        }
      } else {
        console.log("Periodic Sync API desteklenmiyor. Alternatif yöntem kullanılabilir.");
      }
    }

    // Service Worker hazır olduktan sonra bildirim izni ve senkronizasyon kaydını yapıyoruz.
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(reg => {
        console.log("Service Worker hazır. Kayıt kapsamı:", reg.scope);
        askNotificationPermission().then(granted => {
          if (granted) {
            registerPeriodicSync(reg);
          } else {
            console.warn("Bildirim izni verilmedi.");
          }
        });
      });
    }
  </script>

  <style>
    /* Genel stiller */
    html, body {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
      touch-action: manipulation;
      background-color: #ffffff;
      color: #121212;
      font-family: 'Poppins', sans-serif;
      transition: background 0.3s, color 0.3s;
    }
    body.dark-mode {
      background-color: #121212;
      color: #fff;
    }
    .container {
      max-width: 100%;
      margin: 20px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: background 0.3s;
    }
    body.dark-mode .container {
      background: #1e1e1e;
      box-shadow: 0 4px 15px rgba(255,255,255,0.1);
    }
    /* Yükleniyor Spinner – Dönen Dünya */
    .loading-spinner {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 60px;
      color: #ff4500;
      display: none;
      z-index: 2000;
    }
    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
    }
    .menu-btn {
      width: 40px;
      height: 40px;
      font-size: 18px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(45deg, #007bff, #00d4ff);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-logo {
      flex: 1;
      text-align: center;
    }
    .header-logo img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    .hamburger {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 24px;
      height: 18px;
    }
    .hamburger span {
      display: block;
      height: 3px;
      background: white;
      border-radius: 1px;
    }
    /* Üst Hikaye Alanı (Stories) */
    .story-container {
      display: flex;
      overflow-x: auto;
      padding: 10px;
      gap: 10px;
      background: #fff;
    }
    body.dark-mode .story-container {
      background: #1e1e1e;
    }
    .story-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 70px;
      flex: 0 0 auto;
      cursor: pointer;
    }
    .story-circle {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(45deg, #0000ff, #00bfff);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .story-circle-inner {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      overflow: hidden;
      background: #fff;
    }
    .story-circle-inner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .story-source-label {
      margin-top: 5px;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 70px;
    }
    /* Haber Kartları */
    .rss-item {
      position: relative;
      display: block;
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 10px 0;
      padding: 15px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      transition: transform 0.3s, background 0.3s;
      cursor: pointer;
      background-color: #ffffff;
    }
    .rss-item:hover {
      background: #f0f0f0;
      transform: scale(1.02);
    }
    body.dark-mode .rss-item {
      background: #2a2a2a;
      border-color: #444;
    }
    .rss-item img {
      width: 100%;
      height: 130px;
      border-radius: 10px;
      object-fit: cover;
      margin-bottom: 10px;
    }
    .no-image {
      width: 100%;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: bold;
      color: #fff;
      background: linear-gradient(45deg, #FF0000, #FF4500);
      white-space: normal;
      word-wrap: break-word;
      border-radius: 8px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    .news-header {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .news-story {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 8px;
      border: 2px solid red;
      flex-shrink: 0;
    }
    .news-story img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .news-source {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 16px;
    }
    .news-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    .news-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
    .save-btn {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      border: none;
      cursor: pointer;
      font-size: 16px;
      transition: opacity 0.3s;
    }
    .save-btn:hover {
      opacity: 0.8;
    }
    .share-btn {
      background-color: transparent;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
    .share-icon {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .news-date {
      font-size: 12px;
      color: #888;
      text-align: center;
      flex: 1;
    }
    .ok-indicator {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: bold;
      font-size: 24px;
      color: green;
      display: none;
    }
    .rss-item.read, .rss-item.read-news {
      opacity: 0.5;
    }
    .rss-item.read .ok-indicator {
      display: block;
    }
    /* News Modal */
    .modal-dialog-scrollable {
      max-height: 100vh;
    }
    .modal-dialog {
      margin: 0;
      width: 100vw;
      height: 100vh;
    }
    .modal-content {
      height: 100%;
      width: 100%;
      border: none;
      border-radius: 0;
      background: #ffffff;
      color: #121212;
      position: relative;
    }
    body.dark-mode .modal-content {
      background: #1e1e1e;
      color: #fff;
    }
    .modal-header, .modal-footer {
      padding: 10px;
    }
    .modal-body {
      padding: 0 15px 15px;
      height: calc(100% - 60px);
      overflow: auto;
    }
    .news-main {
      text-align: center;
      max-width: 90%;
    }
    .modal-footer {
      text-align: center;
    }
    .btn-close {
      margin-left: 10px;
    }
    .load-more {
      text-align: center;
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    .toggle-btn {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #007bff, #00d4ff);
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      z-index: 1600;
      transition: none;
    }
    /* Plus Hint Overlay */
    #plus-hint-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.7);
      z-index: 1500;
      display: none;
    }
    #plus-hint-highlight {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      z-index: 1600;
      display: none;
      color: #000;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5px;
      animation: breath 2s infinite;
    }
    @keyframes breath {
      0% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.1); }
      100% { transform: translateX(-50%) scale(1); }
    }
    /* Slide Menü */
    .side-menu {
      position: fixed;
      top: 0;
      left: -250px;
      width: 250px;
      height: 100%;
      background: #fff;
      color: #000;
      padding: 20px;
      box-shadow: 2px 0 10px rgba(0,0,0,0.3);
      transition: left 0.3s ease-in-out, background 0.3s, color 0.3s;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    body.dark-mode .side-menu {
      background: #000;
      color: #fff;
    }
    .side-menu.open {
      left: 0;
    }
    #theme-switch {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    #theme-toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 28px;
      color: inherit;
    }
    .menu-buttons-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      flex: 1;
      justify-content: center;
    }
    .menu-item {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      width: 100%;
      text-align: left;
      font-size: 16px;
      cursor: pointer;
    }
    /* Arama Kutusu */
    #search-box {
      position: fixed;
      top: 60px;
      right: 20px;
      width: 250px;
      background: #222;
      color: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      z-index: 1000;
      display: none;
    }
    #search-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    #search-btn {
      width: 100%;
      padding: 8px;
      background: #FF4500;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    /* Modern Kaynak Seçim Overlay */
    #source-container.modern-selection {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      background: rgba(255,255,255,0.95);
      z-index: 1100;
      overflow-y: auto;
      overflow-x: hidden;
    }
    body.dark-mode #source-container.modern-selection {
      background: rgba(18,18,18,0.95);
      color: #fff;
    }
    .overlay-header {
      flex: 0 0 auto;
      padding: 10px;
      text-align: right;
    }
    .overlay-header .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }
    #source-search-container {
      flex: 0 0 auto;
      padding: 10px;
    }
    .overlay-content {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 20px;
      position: relative;
      overflow-x: hidden;
    }
    .overlay-content .category-section {
      margin-bottom: 20px;
    }
    .overlay-content .category-section h3 {
      margin-bottom: 10px;
      font-size: 18px;
      background: linear-gradient(45deg, #0066ff, #00ccff);
      color: #fff;
      padding: 5px;
      border-radius: 4px;
    }
    .sources-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .source-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 5px;
      cursor: pointer;
    }
    .source-item .source-info {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .source-item .source-info span {
      font-size: 14px;
      color: inherit;
    }
    #source-container .source-item .add-btn {
      background: #808080;
      color: #fff;
      font-weight: bold;
      padding: 3px 6px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .source-item.added .add-btn {
      background: #808080;
      cursor: default;
    }
    .source-item.added .add-btn::after {
      content: "eklendi";
      font-size: 14px;
      color: #fff;
    }
    .scroll-indicator {
      position: absolute;
      right: 10px;
      bottom: 10px;
      font-size: 28px;
      font-weight: bold;
      color: #888;
    }
    .overlay-footer {
      flex: 0 0 auto;
      padding: 10px;
      text-align: center;
      background: #fff;
      border-top: 1px solid #ccc;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 1110;
    }
    .overlay-footer .apply-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(45deg, #0066ff, #00ccff);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .overlay-footer .apply-btn:hover {
      background: linear-gradient(45deg, #0055dd, #00bbee);
    }
    .hidden {
      display: none;
    }
    .read-news {
      opacity: 0.5;
    }
    .modal-image {
      width: 100%;
      height: 300px;
      overflow: hidden;
      border: 1px solid #ddd;
      position: relative;
    }
    .modal-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* ---------- EKSTRA: Hikaye Özelliği Stilleri ---------- */
    .story-modal {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease;
    }
    .story-modal.show {
      opacity: 1;
      visibility: visible;
    }
    .story-modal-content {
      background: #fff;
      width: 100%;
      height: 100%;
      border-radius: 0;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      animation: storyOpen 0.5s ease;
      padding-top: 10px;
    }
    body.dark-mode .story-modal-content {
      background: #1e1e1e;
      color: #fff;
    }
    @keyframes storyOpen {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .story-progress-container {
      padding: 10px;
    }
    .story-progress {
      display: flex;
      gap: 5px;
    }
    .story-progress .progress-segment {
      flex: 1;
      height: 4px;
      background: #ddd;
      border-radius: 2px;
    }
    .story-progress .progress-segment.active {
      background: linear-gradient(45deg, blue, lightblue);
    }
    .story-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin-top: -10px;
    }
    .story-header .story-source,
    .story-header .story-time {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .story-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5px 10px 10px;
    }
    .story-image-container {
      width: 100%;
      height: 200px;
      overflow: hidden;
    }
    .story-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .story-description {
      padding: 10px;
    }
    .story-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 10px;
      border-top: 1px solid #ccc;
      background: #fff;
      z-index: 2100;
    }
    .story-read-btn,
    .story-close-btn {
      background: linear-gradient(45deg, #007bff, #00d4ff);
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      transition: transform 0.2s;
      width: 40%;
    }
    .story-read-btn:hover,
    .story-close-btn:hover {
      transform: scale(1.05);
    }
    /* Hikaye modalındaki navigasyon okları (aynı stil, soluk, yarı saydam, tam kenara yaslanmış) */
    .story-nav {
      background: linear-gradient(45deg, rgba(0,123,255,0.5), rgba(0,212,255,0.5));
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      transition: transform 0.3s;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
    .story-prev {
      left: 0;
    }
    .story-next {
      right: 0;
    }
    .story-nav:hover {
      transform: translateY(-50%) scale(1.1);
    }
    /* Haber Modal Carousel: Navigasyon okları güncellendi – hikaye modalındaki .story-nav sınıfı kullanılıyor ve içerik olarak Font Awesome ikonları ekleniyor */
    .carousel-indicators [data-bs-target] {
      background-color: #007bff;
    }
  </style>
</head>
<body>
  <!-- Yükleniyor Göstergesi -->
  <div id="loading-spinner" class="loading-spinner">
    <i class="fa-solid fa-globe fa-spin"></i>
  </div>
  <div id="plus-hint-overlay" class="hidden"></div>
  <div id="plus-hint-highlight" class="hidden">Kaynak Seçiniz</div>
  
  <!-- Header -->
  <div class="header">
    <button id="menu-toggle" class="menu-btn">
      <div class="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
    <div class="header-logo">
      <img src="https://i.hizliresim.com/4owktob.jpeg?_gl=1*1rp8wtb*_ga*MTMwMjI3MjE4OC4xNzQxMjQyNTI5*_ga_M9ZRXYS2YN*MTc0MjQ0Njg3MS4zLjEuMTc0MjQ0Njg5MC40MS4wLjA." alt="Logo">
    </div>
    <button id="search-toggle" class="menu-btn">🔍</button>
  </div>
  
  <!-- Üst Hikaye Alanı (Story Container) -->
  <div id="story-container" class="story-container"></div>
  
  <button id="toggle-sources-btn" class="toggle-btn">➕</button>
  <div id="side-menu" class="side-menu">
    <button id="close-menu" class="close-btn">✖</button>
    <div id="theme-switch">
      <button id="theme-toggle-btn" style="background: none; border: none; cursor: pointer; font-size: 28px;">
        <i id="theme-icon" class="fas fa-moon"></i>
      </button>
    </div>
    <div class="menu-buttons-container">
      <button id="favorite-news-btn" class="menu-item">
        <i class="fas fa-star" style="color: yellow; margin-right: 10px;"></i> Favoriler
      </button>
      <button id="share-app-btn" class="menu-item" onclick="window.open('http://action_share','_blank');">
        <i class="fas fa-share-alt" style="color: yellow; margin-right: 10px;"></i> Uygulamayı Paylaş
      </button>
      <button id="contact-us-btn" class="menu-item" onclick="window.open('http://action_offices','_blank');">
        <i class="fas fa-envelope" style="color: yellow; margin-right: 10px;"></i> Bize Ulaşın
      </button>
    </div>
  </div>
  
  <div id="search-box" class="hidden">
    <input type="text" id="search-input" placeholder="Haberlerde ara..." />
    <button id="search-btn">🔍 Ara</button>
  </div>
  
  <div id="source-container" class="modern-selection hidden">
    <div class="overlay-header">
      <button id="close-source-container" class="close-btn">✖</button>
    </div>
    <div id="source-search-container">
      <input type="text" id="source-search-input" placeholder="Kaynak ara..." />
      <button id="source-search-btn">Ara</button>
    </div>
    <div class="overlay-content">
      <!-- Kategori: GÜNDEM -->
      <div class="category-section">
        <h3>GÜNDEM</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.hurriyet.com.tr/rss/gundem">
            <div class="source-info">
              <span>HÜRRİYET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="http://www.acikgazete.com/feed/">
            <div class="source-info">
              <span>ACIKGAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.aksam.com.tr/rss/rss.asp">
            <div class="source-info">
              <span>AKŞAM</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.cumhuriyet.com.tr/rss">
            <div class="source-info">
              <span>CUMHURİYET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.trthaber.com/sondakika_articles.rss">
            <div class="source-info">
              <span>TRT HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.birgazete.com/feed">
            <div class="source-info">
              <span>BİR GAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haberturk.com/rss">
            <div class="source-info">
              <span>HABERTÜRK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ntv.com.tr/son-dakika.rss">
            <div class="source-info">
              <span>NTV</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ensonhaber.com/rss/ensonhaber.xml">
            <div class="source-info">
              <span>EN SON HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://bianet.org/rss/bianet">
            <div class="source-info">
              <span>BİANET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.cnnturk.com/feed/rss/all/news">
            <div class="source-info">
              <span>CNN TÜRK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.odatv.com/export/rss">
            <div class="source-info">
              <span>ODA TV</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.veryansintv.com/feed">
            <div class="source-info">
              <span>VERYANSIN TV</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gazeteabc.com/rss.xml">
            <div class="source-info">
              <span>GAZETE ABC</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gzt.com/rss">
            <div class="source-info">
              <span>GZT</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sabah.com.tr/rss/gundem.xml">
            <div class="source-info">
              <span>SABAH</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://halktv.com.tr/service/rss.php">
            <div class="source-info">
              <span>HALK TV</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ahaber.com.tr/rss/gundem.xml">
            <div class="source-info">
              <span>A HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.nethaber.com/export/rss">
            <div class="source-info">
              <span>NET HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.oncevatan.com.tr/rss">
            <div class="source-info">
              <span>ÖNCE VATAN</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gundemkibris.com/rss">
            <div class="source-info">
              <span>GÜNDEM KIBRIS</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.diyanethaber.com.tr/rss">
            <div class="source-info">
              <span>DİYANET HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.star.com.tr/rss/rss.asp">
            <div class="source-info">
              <span>STAR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://anayurtgazetesi.com/rss.xml">
            <div class="source-info">
              <span>ANAYURT</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.demokrathaber.org/rss">
            <div class="source-info">
              <span>DEMOKRAT HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.diken.com.tr/feed/">
            <div class="source-info">
              <span>DİKEN</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.dirilispostasi.com/rss">
            <div class="source-info">
              <span>DİRİLİŞ POSTASI</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gazeteduvar.com.tr/export/rss">
            <div class="source-info">
              <span>GAZETE DUVAR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gercekgundem.com/rss">
            <div class="source-info">
              <span>GERÇEK GÜNDEM</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haber3.com/rss">
            <div class="source-info">
              <span>HABER 3</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.internethaber.com/rss">
            <div class="source-info">
              <span>İNTERNET HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://kisadalga.net/service/rss.php">
            <div class="source-info">
              <span>KISA DALGA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.medyagazete.com/rss/genel-0">
            <div class="source-info">
              <span>MEDYA GAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.muhalif.com.tr/rss/categorynews/gundem">
            <div class="source-info">
              <span>MUHALİF</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yeniasir.com.tr/rss/gundem.xml">
            <div class="source-info">
              <span>YENİ ASIR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://yesilgazete.org/feed/">
            <div class="source-info">
              <span>YEŞİL GAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yenisafak.com/rss-feeds?category=gundem">
            <div class="source-info">
              <span>YENİ ŞAFAK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yurtgazetesi.com.tr/service/rss.php">
            <div class="source-info">
              <span>YURT GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.milatgazetesi.com/rss">
            <div class="source-info">
              <span>MİLAT GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.cumhuriyet.com.tr/rss/son_dakika.xml">
            <div class="source-info">
              <span>CUMHURİYET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://feedfry.com/rss/11f009fdb85e287ea48f3d07d165c2ae">
            <div class="source-info">
              <span>SÖZCÜ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yeniakit.com.tr/rss/haber/gundem">
            <div class="source-info">
              <span>YENİ AKİT</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.takvim.com.tr/rss/guncel">
            <div class="source-info">
              <span>TAKVİM</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://t24.com.tr/rss/haber/gundem">
            <div class="source-info">
              <span>T24</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.milliyet.com.tr/rss/rssnew/gundem.xml">
            <div class="source-info">
              <span>MİLLİYET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://beetekno.com/feed/">
            <div class="source-info">
              <span>BEEKTEKNO</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://onedio.com/Publisher/publisher-gundem.rss">
            <div class="source-info">
              <span>ONEDİO</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://shiftdelete.net/feed">
            <div class="source-info">
              <span>SHİFTDELETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
      <!-- Kategori: SPOR -->
      <div class="category-section">
        <h3>SPOR</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.fotomac.com.tr/rss/futbol.xml">
            <div class="source-info">
              <span>Fotomac</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://ajansspor.com/rss">
            <div class="source-info">
              <span>AJANSSPOR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ntvspor.net/rss">
            <div class="source-info">
              <span>NTV SPOR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.spormaraton.com/rss/">
            <div class="source-info">
              <span>SPOR MARATON</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://spor264.com.tr/rss.xml">
            <div class="source-info">
              <span>SPOR 264</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sporx.com/son-dakika-rss">
            <div class="source-info">
              <span>SPOR X</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.futboo.com/rss.xml">
            <div class="source-info">
              <span>FUTBOO</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.aspor.com.tr/rss/spor-toto-super-lig.xml">
            <div class="source-info">
              <span>A Spor</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
      <!-- Kategori: EKONOMİ -->
      <div class="category-section">
        <h3>EKONOMİ</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.bloomberght.com/rss">
            <div class="source-info">
              <span>Bloomberg HT</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://bigpara.hurriyet.com.tr/rss/">
            <div class="source-info">
              <span>BİGPARA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ekonomidunya.com/rss.xml">
            <div class="source-info">
              <span>EKONOMİ DÜNYA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://dergipark.org.tr/tr/pub/epfad/rss/lastissue/en">
            <div class="source-info">
              <span>DERGİPARK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.paramedya.com/feed/">
            <div class="source-info">
              <span>PARAMEDYA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.girisimhaber.com/rss">
            <div class="source-info">
              <span>GİRİŞİM HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ekonomist.com.tr/rss">
            <div class="source-info">
              <span>EKONOMİST</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
      <!-- Kategori: YEREL -->
      <div class="category-section">
        <h3>YEREL</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.haber32.com.tr/rss">
            <div class="source-info">
              <span>HABER 32</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.antalyahurses.com/rss">
            <div class="source-info">
              <span>ANTALYA HÜRSES</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.akdenizmanset.com.tr/rss.xml">
            <div class="source-info">
              <span>AKDENİZ MANŞET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yenialanya.com/rss.xml">
            <div class="source-info">
              <span>YENİ ALANYA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.marasposta.com/rss">
            <div class="source-info">
              <span>MARAŞ POSTA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.kanalmaras.com/rss">
            <div class="source-info">
              <span>KANAL MARAŞ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haber46.com.tr/rss">
            <div class="source-info">
              <span>HABER 46</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.elbistaninsesi.com/rss.xml">
            <div class="source-info">
              <span>ELBİSTANIN SESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.batiakdeniztv.com/rss">
            <div class="source-info">
              <span>BATI AKDENİZ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.muglagazetesi.com.tr/rss">
            <div class="source-info">
              <span>MUĞLA GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.erzurumajans.com/rss.xml">
            <div class="source-info">
              <span>ERZURUM AJANS</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.karsmanset.com/service/rss.php">
            <div class="source-info">
              <span>KARS MANŞET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.wanhaber.com/rss">
            <div class="source-info">
              <span>WAN HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.elazigsonhaber.com/rss">
            <div class="source-info">
              <span>ELAZIĞ SON HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.vangazetesi.com/rss.xml">
            <div class="source-info">
              <span>VAN GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bitlishaber13.net/rss">
            <div class="source-info">
              <span>BİTLİS HABER13</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sehrivangazetesi.com/rss">
            <div class="source-info">
              <span>ŞEHRİVAN HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gazetekars.com/rss/">
            <div class="source-info">
              <span>GAZETEKARS</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.elazighakimiyethaber.com/rss/">
            <div class="source-info">
              <span>ELAZIĞ HAKİMİYET HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.aydinpost.com/rss">
            <div class="source-info">
              <span>AYDINLIK POST</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sesgazetesi.com.tr/rss">
            <div class="source-info">
              <span>AYDIN SES GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.egedesonsoz.com/rss">
            <div class="source-info">
              <span>EGEDE SON SES</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.egemeclisi.com/rss">
            <div class="source-info">
              <span>EGE MECLİSİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.denizliyeniolay.com/rss">
            <div class="source-info">
              <span>DENİZLİ YENİ OLAY</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.afyonhaber.com/rss">
            <div class="source-info">
              <span>AFYON HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.kutahyaninsesi.com/rss.xml">
            <div class="source-info">
              <span>KÜTAHYANIN SESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.manisahaberleri.com/rss">
            <div class="source-info">
              <span>MANİSA HABERLERİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.denizlikenthaber.com/rss.xml">
            <div class="source-info">
              <span>DENİZLİ KENT HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.dokuzeylul.com/rss">
            <div class="source-info">
              <span>GAZETE 9 EYLÜL</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.pamukkalehaber.com/rss">
            <div class="source-info">
              <span>PAMUKKALE HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://usakhabergazetesi.com.tr/rss">
            <div class="source-info">
              <span>UŞAK HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.izgazete.net/rss">
            <div class="source-info">
              <span>İZ GAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gaziantep27.net/rss">
            <div class="source-info">
              <span>GAZİANTEP27</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.konyayenigun.com/rss">
            <div class="source-info">
              <span>KONYA YENİGÜN</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://mardinhaber.com.tr/rss.xml">
            <div class="source-info">
              <span>MARDİN HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.memohaber.com/rss/genel-0">
            <div class="source-info">
              <span>MEMO HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.aydintelgraf.com/rss">
            <div class="source-info">
              <span>AYDIN TELGRAF</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.urfanatik.com/rss">
            <div class="source-info">
              <span>URFANATİK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haberurfa.com/rss">
            <div class="source-info">
              <span>HABER URFA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.artisiirt.com/rss/">
            <div class="source-info">
              <span>ARTI SİİRT HABER AJANSI</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.konhaber.com/rss/">
            <div class="source-info">
              <span>KONHBABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://sonsoz.com.tr/rss">
            <div class="source-info">
              <span>SONSÖZ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haberci18.com/rss.xml">
            <div class="source-info">
              <span>HABERCİ 18</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haber18.com/rss/">
            <div class="source-info">
              <span>ÇANKIRI HABER 18</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.kayseriolay.com/rss/">
            <div class="source-info">
              <span>KAYSERİOLAY GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.esgazete.com/rss">
            <div class="source-info">
              <span>ES GAZETE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.merhabahaber.com/service/rss.php">
            <div class="source-info">
              <span>MERHABA HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.lalehaber.com/rss.xml">
            <div class="source-info">
              <span>LALE HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://ankarahabergundemi.com/rss/category/ankara-66">
            <div class="source-info">
              <span>ANKARA HABER GÜNDEMİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bizimankara.com.tr/rss">
            <div class="source-info">
              <span>BİZİM ANKARA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.denizpostasi.com/rss">
            <div class="source-info">
              <span>KAYSERİ DENİZ POSTASI</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sivasbulteni.com/rss.xml">
            <div class="source-info">
              <span>SİVAS BÜLTENİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bizimsivas.com.tr/rss">
            <div class="source-info">
              <span>BİZİM SİVAS GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.buyuksivas.com/feed/">
            <div class="source-info">
              <span>BÜYÜK SİVAS</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gazeteanadolu.com/rss.xml">
            <div class="source-info">
              <span>GAZETE ANADOLU</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.sakaryagazetesi.com.tr/rss">
            <div class="source-info">
              <span>SAKARYA GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ekonomiankara.com/rss.xml">
            <div class="source-info">
              <span>EKONOMİANKARA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.eskisehir.net/rss">
            <div class="source-info">
              <span>ESKİŞEHİR NET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bursabasin.com/rss">
            <div class="source-info">
              <span>BURSA BASIN</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://medyabar.com/rss.xml">
            <div class="source-info">
              <span>MEDYABAR</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ozgurkocaeli.com.tr/rss.xml">
            <div class="source-info">
              <span>ÖZGÜR KOCAELİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.yenimarmaragazetesi.com/rss">
            <div class="source-info">
              <span>YENİ MARMARA</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.canakkalehaber.com/rss">
            <div class="source-info">
              <span>ÇANAKKALE HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.kocaelikoz.com/rss.xml">
            <div class="source-info">
              <span>KOCAELİ KOZ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bursasporx.com/rss">
            <div class="source-info">
              <span>BURSA SPOR X</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.olay.com.tr/feed">
            <div class="source-info">
              <span>BURSA OLAY</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.gazetegebze.com.tr/feed">
            <div class="source-info">
              <span>GAZETE GEBZE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bursahakimiyet.com.tr/rss">
            <div class="source-info">
              <span>BURSA HAKİMİYET</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.haber61.net/service/rss.php">
            <div class="source-info">
              <span>HABER 61</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.61saat.com/rss">
            <div class="source-info">
              <span>61 SAAT</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.orduolay.com/rss.xml">
            <div class="source-info">
              <span>ORDU OLAY GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.karabuknethaber.com/rss">
            <div class="source-info">
              <span>KARABÜK NET HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.pusulagazetesi.com.tr/rss">
            <div class="source-info">
              <span>PUSULA GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.oncurtv.com/rss">
            <div class="source-info">
              <span>ÖNCÜ RTV</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.bartinolay.com/rss">
            <div class="source-info">
              <span>BARTIN OLAY GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.samsunhaber.com/rss">
            <div class="source-info">
              <span>SAMSUN HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.samsunhaberajansi.com/rss.xml">
            <div class="source-info">
              <span>SAMSUN HABER AJANSI</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.samsunetikhaber3.com/rss.xml">
            <div class="source-info">
              <span>SAMSUN ETİK HABER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ereglionder.com.tr/rss">
            <div class="source-info">
              <span>EREĞLİ ÖNDER</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://karadenizgazete.com.tr/rss/gundem">
            <div class="source-info">
              <span>KARADENİZ GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.olay53.com/service/rss.php">
            <div class="source-info">
              <span>OLAY 53</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.takagazete.com.tr/rss">
            <div class="source-info">
              <span>TAKA GAZETESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://ajanstekirdag.com/feed/">
            <div class="source-info">
              <span>AJANS TEKİRDAĞ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://amerikabulteni.com/feed/">
            <div class="source-info">
              <span>AMERİKA BÜLTENİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
      <!-- Kategori: ULUSAL -->
      <div class="category-section">
        <h3>ULUSAL</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.timeturk.com/rss/">
            <div class="source-info">
              <span>TIME TURK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.voaturkce.com/api/">
            <div class="source-info">
              <span>AMERİKANIN SESİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.fortuneturkey.com/feed">
            <div class="source-info">
              <span>FORTUNE TÜRKİYE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.cgtnturk.com/rss">
            <div class="source-info">
              <span>CGTN TÜRK</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://kronos38.news/feed/">
            <div class="source-info">
              <span>KRONOS</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
      <!-- Kategori: SAĞLIK -->
      <div class="category-section">
        <h3>SAĞLIK</h3>
        <div class="sources-grid">
          <div class="source-item" data-url="https://www.saglikliturkiye.org/rss">
            <div class="source-info">
              <span>SAĞLIKLI TÜRKİYE</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.ailemizdergisi.com/feed/">
            <div class="source-info">
              <span>AİLEMİZ DERGİSİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.saglikpersoneli.com.tr/rss">
            <div class="source-info">
              <span>SAĞLIK PERSONELİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
          <div class="source-item" data-url="https://www.saglikpersoneli.com.tr/rss">
            <div class="source-info">
              <span>SAĞLIK PERSONELİ</span>
            </div>
            <button class="add-btn">+</button>
          </div>
        </div>
      </div>
  
      <div class="scroll-indicator"></div>
    </div>
    <div class="overlay-footer">
      <button id="apply-sources" class="apply-btn">Haberleri Göster</button>
    </div>
  </div>
  
  <div id="rss-container"></div>
  <div class="load-more">
    <button id="load-more-btn" class="btn btn-secondary"></button>
  </div>
  
  <!-- Haber Modal (News Modal) -->
  <div class="modal fade" id="newsModal" tabindex="-1" aria-labelledby="newsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="newsModalLabel"></h5>
          <div class="ms-auto d-flex align-items-center" style="gap: 20px;">
            <i id="open-full-news" class="fas fa-globe" style="font-size: 24px; background: linear-gradient(45deg, #007bff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer;"></i>
            <i id="read-aloud" class="fas fa-microphone" style="font-size: 24px; background: linear-gradient(45deg, #007bff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer;"></i>
            <i id="adjust-font" class="fas fa-text-height" style="font-size: 24px; background: linear-gradient(45deg, #007bff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer;"></i>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          <div id="font-adjuster" style="display:none; position: absolute; top: 60px; left: 20px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 5px; z-index: 2100; border: 1px solid #ccc;">
            <button id="decrease-font" style="border: none; background: none; font-size: 16px; cursor: pointer;">A-</button>
            <span id="font-size-value" style="margin: 0 10px;">16</span>
            <button id="increase-font" style="border: none; background: none; font-size: 16px; cursor: pointer;">A+</button>
          </div>
        </div>
        <div class="modal-body" id="newsContent">
          <div class="news-main">
            <p>Haber yükleniyor...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal" style="background: linear-gradient(45deg, #007bff, #00d4ff); border: none;">Kapat</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Hikaye Modal (Story Modal) -->
  <div id="story-modal" class="story-modal hidden">
    <div class="story-modal-content">
      <div class="story-progress-container">
        <div class="story-progress" id="story-progress"></div>
      </div>
      <div class="story-header">
        <span class="story-source"></span>
        <span class="story-time"></span>
        <button class="story-fav-btn">☆</button>
      </div>
      <div class="story-content">
        <h2 class="story-title"></h2>
        <div class="story-image-container">
          <img class="story-image" src="" alt="Haber Görseli">
        </div>
        <p class="story-description"></p>
      </div>
      <div class="story-footer">
        <button class="story-read-btn" data-url="">Haberi Oku</button>
        <button class="story-close-btn">Kapat</button>
      </div>
      <button class="story-nav story-prev"> 
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="story-nav story-next">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
  
  <script>
    // Tema ayarı
    $(document).ready(function(){
      if(localStorage.getItem("theme") === "dark"){
         $("body").addClass("dark-mode");
         $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
      } else {
         $("body").removeClass("dark-mode");
         $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
      }
      $("#theme-toggle-btn").click(function(){
         $("body").toggleClass("dark-mode");
         if($("body").hasClass("dark-mode")){
             localStorage.setItem("theme", "dark");
             $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
         } else {
             localStorage.setItem("theme", "light");
             $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
         }
      });
    });
  </script>
  
  <script>
    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
  
    function fetchCachedRSS(urlWithApi) {
      const cacheKey = 'cache_' + urlWithApi;
      const cacheExpiry = 5 * 60 * 1000;
      const cached = localStorage.getItem(cacheKey);
      if(cached) {
         try {
           const parsed = JSON.parse(cached);
           if(new Date().getTime() - parsed.timestamp < cacheExpiry) {
              return Promise.resolve(parsed.data);
           }
         } catch(e) { }
      }
      return fetch(urlWithApi)
         .then(response => response.json())
         .then(data => {
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: new Date().getTime(), data: data }));
            return data;
         });
    }
  
    function lazyLoadImages() {
      const lazyImages = document.querySelectorAll('img.lazy');
      const imageObserver = new IntersectionObserver((entries, observer) => {
         entries.forEach(entry => {
            if(entry.isIntersecting) {
               const img = entry.target;
               img.src = img.getAttribute('data-src');
               img.classList.remove('lazy');
               observer.unobserve(img);
            }
         });
      });
      lazyImages.forEach(img => {
         imageObserver.observe(img);
      });
    }
  </script>
  
  <script>
    const API_KEY = "tp44fmyf4axvjswejeqnwxqymawlnhw7ycnvhatv";
    
    function deduplicateNews(newsArray) {
      let unique = {};
      newsArray.forEach(item => { unique[item.link] = item; });
      return Object.values(unique);
    }
  
    function timeAgo(date) {
      const now = new Date();
      let adjustedDate = new Date(date);
      adjustedDate.setHours(adjustedDate.getHours() + 3);
      const diff = Math.floor((now - adjustedDate) / 1000);
      if (diff < 60) return "Birkaç saniye önce";
      if (diff < 3600) return Math.floor(diff / 60) + " dakika önce";
      if (diff < 86400) return Math.floor(diff / 3600) + " saat önce";
      return Math.floor(diff / 86400) + " gün önce";
    }
  
    function fetchNews(selectedRssUrls, callback) {
      let promises = selectedRssUrls.map(url => {
        let apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=${API_KEY}`;
        return fetchCachedRSS(apiUrl)
          .then(data => data.items.map(item => ({
            ...item,
            source: new URL(url).hostname.replace('www.', '').split('.')[0],
            feedUrl: url
          })))
          .catch(() => []); 
      });
      Promise.all(promises).then(results => {
        let allNewsResult = results.flat();
        allNewsResult = deduplicateNews(allNewsResult);
        allNewsResult.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        callback(allNewsResult);
      });
    }
  
    // Global değişkenler
    let allNews = [];
    let newsPerPage = 20;
    let currentIndex = 0;
    const storageKey = 'selectedRssFeeds';
    const favoriteKey = 'favoriteNews';
    let favoriteNews = JSON.parse(localStorage.getItem(favoriteKey)) || [];
  
    $(document).ready(function() {
      let savedFeedsStr = localStorage.getItem(storageKey);
      let savedFeeds = savedFeedsStr ? JSON.parse(savedFeedsStr) : [];
  
      $("#loading-spinner").show();
  
      if(!localStorage.getItem("hasSeenPlusHint")){
        $("#plus-hint-overlay, #plus-hint-highlight").removeClass("hidden").show();
      } else {
        $("#plus-hint-overlay, #plus-hint-highlight").hide().addClass("hidden");
      }
  
      if (savedFeeds.length > 0) {
        $(".source-item").each(function() {
          let url = $(this).data("url");
          if (savedFeeds.indexOf(url) !== -1) {
            $(this).addClass("selected added");
            $(this).find(".add-btn").text("");
          }
        });
        fetchNews(savedFeeds, function(news) {
          allNews = news;
          currentIndex = 0;
          displayNews();
          $("#loading-spinner").hide();
          loadStoryCards();
        });
      } else {
        $("#loading-spinner").hide();
      }
  
      $("#apply-sources").click(function(e) {
        e.preventDefault();
        let selectedSources = [];
        $(".source-item.selected").each(function() {
          selectedSources.push($(this).data("url"));
        });
        if (selectedSources.length === 0) {
          alert("Lütfen en az bir kaynak seçin!");
          return;
        }
        localStorage.setItem(storageKey, JSON.stringify(selectedSources));
        $("#source-container").hide().addClass("hidden");
        $("#toggle-sources-btn").show();
        $("#loading-spinner").show();
        fetchNews(selectedSources, function(news) {
          allNews = news;
          currentIndex = 0;
          displayNews();
          $("#loading-spinner").hide();
          loadStoryCards();
        });
      });
  
      $("#toggle-sources-btn").click(function(e) {
        e.preventDefault();
        if ($("#source-container").is(":visible")) return;
        $("#source-container").css("display", "flex").show();
        $(this).hide();
        setTimeout(function() {
          let currentFeeds = JSON.parse(localStorage.getItem(storageKey) || "[]");
          $(".source-item").each(function() {
            let url = $(this).data("url");
            if (currentFeeds.includes(url)) {
              $(this).addClass("selected added").find(".add-btn").text("");
            } else {
              $(this).removeClass("selected added").find(".add-btn").text("+");
            }
          });
        }, 50);
        if(!localStorage.getItem("hasSeenPlusHint")){
          $("#plus-hint-overlay, #plus-hint-highlight").fadeOut(300, function(){
            $(this).addClass("hidden");
          });
          localStorage.setItem("hasSeenPlusHint", "true");
        }
      });
  
      $("#close-source-container").click(function(e) {
        e.preventDefault();
        $("#source-container").hide().addClass("hidden");
        $("#toggle-sources-btn").show();
      });
  
      $("#source-search-btn").click(function(){
         let query = $("#source-search-input").val().toLowerCase();
         $(".sources-grid .source-item").each(function(){
            let text = $(this).text().toLowerCase();
            $(this).toggle(text.indexOf(query) > -1);
         });
      });
      $("#source-search-input").keypress(function(e){
         if(e.which === 13) $("#source-search-btn").click();
      });
  
      $(document).on('click', '.source-item', function(e) {
         if($(e.target).hasClass("add-btn")) return;
         $(this).toggleClass("selected");
         let url = $(this).data("url");
         let currentFeeds = JSON.parse(localStorage.getItem(storageKey) || "[]");
         if ($(this).hasClass("selected")) {
           if (!currentFeeds.includes(url)) {
             currentFeeds.push(url);
           }
           $(this).addClass("added").find(".add-btn").text("");
         } else {
           currentFeeds = currentFeeds.filter(item => item !== url);
           $(this).removeClass("added").find(".add-btn").text("+");
         }
         localStorage.setItem(storageKey, JSON.stringify(currentFeeds));
         $("#source-search-input").val("");
      });
      $(document).on('click', '.add-btn', function(e) {
        e.stopPropagation();
        let parent = $(this).closest('.source-item');
        parent.toggleClass("selected");
        let url = parent.data("url");
        let currentFeeds = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (parent.hasClass("selected")) {
          if (!currentFeeds.includes(url)) {
            currentFeeds.push(url);
          }
          parent.addClass("added").find(".add-btn").text("");
        } else {
          currentFeeds = currentFeeds.filter(item => item !== url);
          parent.removeClass("added").find(".add-btn").text("+");
        }
        localStorage.setItem(storageKey, JSON.stringify(currentFeeds));
        $("#source-search-input").val("");
      });
  
      $("#load-more-btn").click(function() {
        displayNews(true);
      });
  
      $(window).on("scroll", debounce(function() {
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
          if (currentIndex < allNews.length) {
            displayNews(true);
          }
        }
      }, 200));
  
      // Haber kartına tıklayınca haber detay modalı açılıyor.
      $(document).on('click', '.rss-item', function() {
        document.getElementById('story-modal').classList.remove('show');
  
        let index = $(this).attr('data-index');
        let item;
        if(index !== undefined) {
          item = allNews[index];
        } else {
          let link = $(this).data('url');
          item = allNews.find(n => n.link === link);
        }
       
        // Çoklu fotoğraf desteği: içerikten tüm <img> etiketlerini toplayıp,
        // 1’den fazla varsa Bootstrap Carousel oluşturuyoruz.
        let parser = new DOMParser();
        let contentHtml = item.content ? item.content : (item.description ? item.description : "<p>İçerik bulunamadı.</p>");
        let doc = parser.parseFromString(contentHtml, "text/html");
        let images = [];
        if(item.enclosure && item.enclosure.link) {
            images.push(item.enclosure.link);
        }
        doc.querySelectorAll("img").forEach(img => {
            let src = img.getAttribute("src");
            if(src && !images.includes(src)) {
               images.push(src);
            }
        });
        let modalMediaHtml = "";
        if(images.length > 1) {
          modalMediaHtml = `<div id="newsCarousel" class="carousel slide modal-image" data-bs-ride="carousel">
              <div class="carousel-indicators">
              ${images.map((img, idx) => `<button type="button" data-bs-target="#newsCarousel" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${idx+1}"></button>`).join('')}
              </div>
              <div class="carousel-inner">
              ${images.map((img, idx) => `<div class="carousel-item ${idx === 0 ? 'active' : ''}">
                  <img src="${img}" class="d-block w-100" alt="Haber Görseli">
              </div>`).join('')}
              </div>
              <button class="story-nav story-prev" type="button" data-bs-target="#newsCarousel" data-bs-slide="prev">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="story-nav story-next" type="button" data-bs-target="#newsCarousel" data-bs-slide="next">
                <i class="fas fa-chevron-right"></i>
              </button>
          </div>`;
        } else if(images.length === 1) {
          modalMediaHtml = `<div class="modal-image"><img src="${images[0]}" alt="Haber Görseli"></div>`;
        } else {
          modalMediaHtml = `<div class="modal-image no-image">
                              <span>${item.source.toUpperCase()}</span>
                             </div>`;
        }
  
        // İçerikteki tüm img etiketlerini kaldırıyoruz
        doc.querySelectorAll("img").forEach(img => img.remove());
        let remainingContent = doc.body.innerHTML;
  
        let modalHtml = `
          ${modalMediaHtml}
          <div class="news-main" style="padding:15px;">
            <h2>${item.title}</h2>
            ${remainingContent}
            <div style="text-align:center; margin-top:15px;">
              <button id="show-full-news" data-url="${item.link}" style="padding:10px 20px; border:none; background: linear-gradient(45deg, #808080, #A9A9A9); color:#fff; border-radius:5px; cursor:pointer; transition: background 0.3s;">
                Haberin tamamı için tıkla
              </button>
            </div>
          </div>
        `;
        $('#newsContent').html(modalHtml);
        $("#newsModalLabel").html('<span class="news-source">' + item.source.toUpperCase() + '</span>');
  
        var savedFontSize = localStorage.getItem("fontSize");
        if(savedFontSize) {
          $('.news-main').css('font-size', savedFontSize + 'px');
          $('#font-size-value').text(savedFontSize);
        }
        $('#newsModal').modal('show');
        history.pushState({modalOpen: true}, "");
        let readNews = JSON.parse(localStorage.getItem('readNews')) || [];
        if (readNews.indexOf(item.link) === -1) {
          readNews.push(item.link);
          localStorage.setItem('readNews', JSON.stringify(readNews));
        }
        $(this).addClass('read-news');
        $("#toggle-sources-btn").hide();
      });
  
      // Haber kartındaki hikaye ikonuna tıklanınca hikaye modalı açılıyor.
      $(document).on('click', '.news-story', function(e) {
        e.stopPropagation();
        $('#newsModal').modal('hide');
        let feedUrl = $(this).data("feed-url");
        openStoryModal(feedUrl);
      });
  
      $('#newsModal').on('hidden.bs.modal', function () {
        $("#toggle-sources-btn").show();
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
        }
        if (typeof responsiveVoice !== "undefined") {
          responsiveVoice.cancel();
        }
        var audio = document.getElementById('tts-audio');
        if(audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
  
      window.addEventListener('popstate', function(event) {
        if ($('#newsModal').hasClass('show')) {
          $('#newsModal').modal('hide');
        }
      });
  
      $(document).on('click', '#show-full-news', function(event) {
        event.stopPropagation();
        let newsUrl = $(this).data('url');
        $('#newsModal .modal-body').html(`<iframe src="${newsUrl}" width="100%" height="100%" style="border:none;"></iframe>`);
      });
  
      function displayNews(loadMore = false) {
        let storedRead = JSON.parse(localStorage.getItem('readNews')) || [];
        let content = '';
        let endIndex = Math.min(currentIndex + newsPerPage, allNews.length);
        for (let i = currentIndex; i < endIndex; i++) {
          let item = allNews[i];
          let readClass = (storedRead.indexOf(item.link) !== -1) ? " read" : "";
          let newsImageHtml = "";
          if(item.enclosure && item.enclosure.link) {
            newsImageHtml = `<img data-src="${item.enclosure.link}" alt="Haber Görseli" class="img-fluid lazy">`;
          } else {
            newsImageHtml = `<div class="no-image">${item.source.toUpperCase()}</div>`;
          }
          let isFavorite = favoriteNews.indexOf(item.link) !== -1 ? '⭐' : '☆';
          content += `
            <div class="rss-item${readClass}" data-index="${i}" data-url="${item.link}">
              <div class="news-header">
                <span class="news-story" data-feed-url="${item.feedUrl}">
                  <img src="${item.enclosure && item.enclosure.link ? item.enclosure.link : 'https://via.placeholder.com/30'}" alt="${item.source}" />
                </span>
                <span class="news-source">${item.source.toUpperCase()}</span>
              </div>
              <div class="news-body">
                <h5 class="news-title">${item.title}</h5>
              </div>
              <div class="news-image">
                ${newsImageHtml}
              </div>
              <div class="news-footer">
                <button class="save-btn" data-news="${item.link}">${isFavorite}</button>
                <span class="news-date" style="flex: 1; text-align: center; white-space: nowrap;">${timeAgo(item.pubDate)}</span>
                <button class="share-btn" data-url="${item.link}"><i class="fas fa-share-alt share-icon"></i></button>
              </div>
            </div>
          `;
        }
        if (loadMore) {
          $('#rss-container').append(content);
        } else {
          $('#rss-container').html(content);
        }
        currentIndex = endIndex;
        $('#load-more-btn').toggle(currentIndex < allNews.length);
        lazyLoadImages();
      }
  
      $(document).on('click', '.save-btn', function(event) {
        event.stopPropagation();
        let newsId = $(this).data('news');
        let index = favoriteNews.indexOf(newsId);
        if (index === -1) {
          favoriteNews.push(newsId);
          alert("Haber favorilere eklendi!");
          $(this).addClass("favorited").text('⭐');
        } else {
          favoriteNews.splice(index, 1);
          $(this).removeClass("favorited").text('☆');
        }
        localStorage.setItem(favoriteKey, JSON.stringify(favoriteNews));
      });
  
      $(document).on('click', '.share-btn', function(event) {
        event.stopPropagation();
        let newsUrl = $(this).data('url');
        let modalUrl = window.location.origin + "?haber=" + encodeURIComponent(newsUrl);
        let shareText = `Bu haberi okumak ister misin? ${modalUrl}`;
        $('.share-options').remove();
        let shareOptions = `
          <div class="share-options">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(modalUrl)}" target="_blank">📘 Facebook</a>
            <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(modalUrl)}&text=${encodeURIComponent(shareText)}" target="_blank">🐦 Twitter</a>
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}" target="_blank">💬 WhatsApp</a>
            <button class="close-share">❌ Kapat</button>
          </div>
        `;
        $(this).after(shareOptions);
      });
  
      $(document).on('click', '.close-share', function(event) {
        event.stopPropagation();
        $('.share-options').remove();
      });
  
      $("#menu-toggle").click(function() {
        $("#side-menu").toggleClass("open");
      });
  
      $("#close-menu").click(function() {
        $("#side-menu").removeClass("open");
      });
  
      $("#favorite-news-btn").click(function() {
        let favoriteList = JSON.parse(localStorage.getItem("favoriteNews")) || [];
        let modalContent = "<h3>Favori Haberler</h3><ul>";
        if (favoriteList.length > 0) {
          favoriteList.forEach(link => {
            modalContent += `<li><a href="#" class="favorite-news-item" data-url="${link}">${link}</a></li>`;
          });
        } else {
          modalContent += "<li>Henüz favori haber eklenmedi.</li>";
        }
        modalContent += "</ul>";
        $("#newsModal .modal-body").html(modalContent);
        $("#newsModal").modal("show");
        $("#side-menu").removeClass("open");
      });
  
      $(document).on("click", ".favorite-news-item", function(event) {
        event.preventDefault();
        let newsUrl = $(this).data("url");
        $("#newsModal .modal-body").html(`<iframe src="${newsUrl}" width="100%" height="100%" style="border:none;"></iframe>`);
      });
  
      $("#search-toggle").click(function() {
        $("#search-box").toggle();
      });
      $("#search-btn").click(function() {
        let query = $("#search-input").val().toLowerCase();
        if (query.length <= 1) {
          currentIndex = 0;
          displayNews();
          return;
        }
        searchNews(query);
        $("#search-box").hide();
      });
      $("#search-input").keypress(function(event) {
        if (event.which == 13) {
          $("#search-btn").click();
        }
      });
      function searchNews(query) {
        let filteredNews = allNews.filter(news =>
          news.title.toLowerCase().includes(query) ||
          news.description.toLowerCase().includes(query)
        );
        if (filteredNews.length === 0) {
          $("#rss-container").html("<p class='text-center'>🔍 Hiçbir haber bulunamadı.</p>");
        } else {
          displayFilteredNews(filteredNews);
          $("#source-search-input").val("");
        }
      }
      function displayFilteredNews(filteredNews) {
        let content = '';
        filteredNews.forEach(item => {
          let newsImageHtml = "";
          if(item.enclosure && item.enclosure.link) {
            newsImageHtml = `<img data-src="${item.enclosure.link}" alt="Haber Görseli" class="lazy">`;
          } else {
            newsImageHtml = `<div class="no-image">${item.source.toUpperCase()}</div>`;
          }
          let isFavorite = favoriteNews.indexOf(item.link) !== -1 ? '⭐' : '☆';
          content += `
            <div class="rss-item" data-url="${item.link}">
              <div class="news-header">
                <span class="news-story" data-feed-url="${item.feedUrl}">
                  <img src="${item.enclosure && item.enclosure.link ? item.enclosure.link : 'https://via.placeholder.com/30'}" alt="${item.source}" />
                </span>
                <span class="news-source">${item.source.toUpperCase()}</span>
              </div>
              <div class="news-body">
                <h5 class="news-title">${item.title}</h5>
              </div>
              <div class="news-image">
                ${newsImageHtml}
              </div>
              <div class="news-footer">
                <button class="save-btn" data-news="${item.link}">${isFavorite}</button>
                <span class="news-date" style="flex: 1; text-align: center; white-space: nowrap;">${timeAgo(item.pubDate)}</span>
                <button class="share-btn" data-url="${item.link}"><i class="fas fa-share-alt share-icon"></i></button>
              </div>
            </div>
          `;
        });
        $("#rss-container").html(content);
        lazyLoadImages();
      }
  
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `.read-news { opacity: 0.5; }`;
      document.head.appendChild(styleEl);
    });
  
    // Ekstra Modal Özellikleri: Sesli okuma, font ayarı vb.
    if(localStorage.getItem("fontSize")){
      var savedFontSize = localStorage.getItem("fontSize");
      document.getElementById('font-size-value').innerText = savedFontSize;
      $('.news-main').css('font-size', savedFontSize + 'px');
    }
    
    document.getElementById('open-full-news').addEventListener('click', function() {
      var btn = document.getElementById('show-full-news');
      if(btn) {
        btn.click();
      } else {
        alert("Haberin tamamı için buton bulunamadı!");
      }
    });
    
    function speakText() {
      var modalBody = document.getElementById('newsContent');
      var text = modalBody.innerText;
      if(!text.trim()) return;
      
      if ('speechSynthesis' in window) {
        var speak = function() {
          var voices = speechSynthesis.getVoices();
          var utterance = new SpeechSynthesisUtterance(text);
          var trVoice = voices.find(function(voice) { return voice.lang && voice.lang.indexOf('tr') > -1; });
          if(trVoice) {
            utterance.voice = trVoice;
          }
          utterance.lang = 'tr-TR';
          speechSynthesis.speak(utterance);
        };
        var voices = speechSynthesis.getVoices();
        if(!voices || voices.length === 0) {
          speechSynthesis.onvoiceschanged = function() {
            speak();
            speechSynthesis.onvoiceschanged = null;
          };
        } else {
          speak();
        }
      } else if (typeof responsiveVoice !== "undefined") {
        responsiveVoice.speak(text, "Turkish Female");
      } else {
        var ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&tl=tr&client=tw-ob&q=" + encodeURIComponent(text);
        var audio = new Audio(ttsUrl);
        audio.play().catch(function(err){
          console.error("Google TTS oynatma hatası:", err);
        });
      }
    }
    
    var readAloudEl = document.getElementById('read-aloud');
    readAloudEl.addEventListener('click', speakText);
    readAloudEl.addEventListener('touchstart', function(e) {
      e.preventDefault();
      speakText();
    });
    
    document.getElementById('adjust-font').addEventListener('click', function() {
      var adjuster = document.getElementById('font-adjuster');
      if (adjuster.style.display === 'none' || adjuster.style.display === '') {
        adjuster.style.display = 'block';
      } else {
        adjuster.style.display = 'none';
      }
    });
    
    document.getElementById('increase-font').addEventListener('click', function() {
      var fontSizeElem = document.getElementById('font-size-value');
      var currentSize = parseInt(fontSizeElem.innerText);
      currentSize++;
      fontSizeElem.innerText = currentSize;
      $('.news-main').css('font-size', currentSize + 'px');
      localStorage.setItem("fontSize", currentSize);
    });
    document.getElementById('decrease-font').addEventListener('click', function() {
      var fontSizeElem = document.getElementById('font-size-value');
      var currentSize = parseInt(fontSizeElem.innerText);
      if (currentSize > 10) {
        currentSize--;
        fontSizeElem.innerText = currentSize;
        $('.news-main').css('font-size', currentSize + 'px');
        localStorage.setItem("fontSize", currentSize);
      }
    });
  
    // Hikaye Modal JS
    let currentStories = [];
    let currentStoryIndex = 0;
    window.currentSourceUrl = null;
  
    function loadStoryCards() {
      let savedFeeds = JSON.parse(localStorage.getItem(storageKey)) || [];
      let container = document.getElementById('story-container');
      container.innerHTML = "";
      savedFeeds.forEach(url => {
        let sourceNews = allNews.filter(n => {
          let feedHostname = new URL(url).hostname.replace('www.','');
          return n.link.includes(feedHostname);
        });
        if(sourceNews.length === 0) return;
        let lastNews = sourceNews[0];
        let card = document.createElement('div');
        card.className = "story-card";
        card.setAttribute('data-url', url);
        card.setAttribute('data-source', lastNews.source);
        card.innerHTML = `
          <div class="story-circle">
            <div class="story-circle-inner">
              <img src="${lastNews.enclosure && lastNews.enclosure.link ? lastNews.enclosure.link : 'https://via.placeholder.com/70'}" alt="${lastNews.source}">
            </div>
          </div>
          <div class="story-source-label">${lastNews.source.substring(0,7)}</div>
        `;
        container.appendChild(card);
      });
    }
  
    document.getElementById('story-container').addEventListener('click', function(e) {
      let card = e.target.closest('.story-card');
      if (!card) return;
      let sourceUrl = card.getAttribute('data-url');
      openStoryModal(sourceUrl);
    });
  
    function openStoryModal(sourceUrl) {
      $('#newsModal').modal('hide');
      window.currentSourceUrl = sourceUrl;
      let sourceNews = allNews.filter(n => {
        let feedHostname = new URL(sourceUrl).hostname.replace('www.','');
        return n.link.includes(feedHostname);
      });
      sourceNews.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
      // Sadece ilk 10 haber yüklensin
      let stories = sourceNews.slice(0,10);
      if(stories.length === 0) return;
      currentStoryIndex = 0;
      currentStories = stories;
      showStory(currentStoryIndex);
      document.getElementById('story-modal').classList.remove('hidden');
      document.getElementById('story-modal').classList.add('show');
    }
  
    function showStory(index) {
      let story = currentStories[index];
      let cleanDesc = "";
      if(story.description){
        let parser = new DOMParser();
        let doc = parser.parseFromString(story.description, "text/html");
        let imgs = doc.querySelectorAll("img");
        imgs.forEach(img => img.remove());
        cleanDesc = doc.body.innerHTML;
      }
      let progressContainer = document.getElementById('story-progress');
      progressContainer.innerHTML = "";
      for(let i = 0; i < currentStories.length; i++){
        let seg = document.createElement('div');
        seg.className = "progress-segment" + (i <= index ? " active" : "");
        progressContainer.appendChild(seg);
      }
      document.querySelector('.story-source').innerText = story.source.toUpperCase();
      document.querySelector('.story-time').innerText = timeAgo(story.pubDate);
      document.querySelector('.story-read-btn').setAttribute('data-url', story.link);
      document.querySelector('.story-title').innerText = story.title;
      document.querySelector('.story-image').src = story.enclosure && story.enclosure.link ? story.enclosure.link : 'https://via.placeholder.com/400x200';
      document.querySelector('.story-description').innerHTML = cleanDesc;
      let favBtn = document.querySelector('.story-fav-btn');
      favBtn.innerText = favoriteNews.indexOf(story.link) !== -1 ? '⭐' : '☆';
    }
  
    document.querySelector('.story-next').addEventListener('click', function() {
      if(currentStoryIndex < currentStories.length - 1) {
        currentStoryIndex++;
        showStory(currentStoryIndex);
      } else {
         // Eğer 10 hikaye varsa, diğer kaynağın hikayesine geç
         if(currentStories.length === 10) {
             let savedFeeds = JSON.parse(localStorage.getItem(storageKey)) || [];
             let currentIdx = savedFeeds.indexOf(window.currentSourceUrl);
             if(currentIdx !== -1 && currentIdx < savedFeeds.length - 1) {
                let nextSourceUrl = savedFeeds[currentIdx + 1];
                openStoryModal(nextSourceUrl);
                return;
             }
         }
         document.getElementById('story-modal').classList.remove('show');
      }
    });
  
    document.querySelector('.story-prev').addEventListener('click', function() {
      if(currentStoryIndex > 0) {
        currentStoryIndex--;
        showStory(currentStoryIndex);
      }
    });
  
    document.querySelector('.story-fav-btn').addEventListener('click', function() {
      let story = currentStories[currentStoryIndex];
      let idx = favoriteNews.indexOf(story.link);
      if(idx === -1) {
        favoriteNews.push(story.link);
        this.innerText = '⭐';
      } else {
        favoriteNews.splice(idx, 1);
        this.innerText = '☆';
      }
      localStorage.setItem(favoriteKey, JSON.stringify(favoriteNews));
    });
  
    document.querySelector('.story-read-btn').addEventListener('click', function() {
      let url = this.getAttribute('data-url');
      window.open(url, '_blank');
    });
  
    document.querySelector('.story-close-btn').addEventListener('click', function() {
      document.getElementById('story-modal').classList.remove('show');
    });
  
    // Hikaye modalında, kontrol düğümleri dışındaki alana tıklayınca sonraki hikayeye geçiş
    document.querySelector('.story-modal-content').addEventListener('click', function(e) {
      if(!e.target.closest('.story-fav-btn, .story-nav, .story-read-btn, .story-close-btn')) {
        if(currentStoryIndex < currentStories.length - 1) {
          currentStoryIndex++;
          showStory(currentStoryIndex);
        } else {
          // Eğer 10 hikaye varsa, diğer kaynağın hikayesine geçiş
          if(currentStories.length === 10) {
             let savedFeeds = JSON.parse(localStorage.getItem(storageKey)) || [];
             let currentIdx = savedFeeds.indexOf(window.currentSourceUrl);
             if(currentIdx !== -1 && currentIdx < savedFeeds.length - 1) {
                let nextSourceUrl = savedFeeds[currentIdx + 1];
                openStoryModal(nextSourceUrl);
                return;
             }
          }
          document.getElementById('story-modal').classList.remove('show');
        }
      }
    });
  </script>
</body>
</html>
