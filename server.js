// odak-push-server/server.js
const express    = require('express');
const bodyParser = require('body-parser');
const webPush    = require('web-push');
const fetch      = require('node-fetch');
const xml2js     = require('xml2js');

const { publicKey, privateKey } = require('./vapid-keys.json');
webPush.setVapidDetails('mailto:your-email@domain.com', publicKey, privateKey);

const app = express();
app.use(bodyParser.json());

// Hafızada tutulan abonelik listesi (prod’da DB kullanın)
let subscriptions = [];

// 1) Abonelik kaydetme endpoint’i
app.post('/api/save-subscription', (req, res) => {
  const { subscription, feeds } = req.body;
  // Aynı aboneliği tekrar ekleme
  subscriptions = subscriptions.filter(s =>
    JSON.stringify(s.subscription) !== JSON.stringify(subscription)
  );
  subscriptions.push({ subscription, feeds, lastDates: {} });
  res.sendStatus(201);
});

// 2) RSS kontrol + push gönderme fonksiyonu
async function checkFeeds() {
  for (let entry of subscriptions) {
    for (let feedUrl of entry.feeds) {
      try {
        const hostname = new URL(feedUrl).hostname.replace(/^www\./,'');
        const resp = await fetch(feedUrl);
        const xml  = await resp.text();
        const json = await xml2js.parseStringPromise(xml);
        const items = json.rss.channel[0].item;
        if (!items || !items.length) continue;

        // En yeni haber
        const first = items[0];
        const pubDate = new Date(first.pubDate[0]).toISOString();
        if (entry.lastDates[hostname] !== pubDate) {
          entry.lastDates[hostname] = pubDate;
          const title = first.title[0];
          const link  = first.link[0];
          const payload = JSON.stringify({
            title: `Yeni haber: ${hostname}`,
            body: title,
            url: link
          });
          await webPush.sendNotification(entry.subscription, payload);
          console.log(`Sent push for ${hostname}: ${title}`);
        }
      } catch(err) {
        console.error('Feed error', feedUrl, err);
      }
    }
  }
}

// Her 5 dakikada bir çalıştır
setInterval(checkFeeds, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Push server listening on ${PORT}`));
