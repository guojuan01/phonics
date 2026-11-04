/* 拼读打卡离线缓存 Service Worker */
const CACHE = 'phonics-v1';
const ASSETS = ['./', './index.html', './sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 发音音频与有道接口：始终走网络，不缓存（保证真人发音），失败由页面回退合成语音
  if (url.hostname.includes('youdao.com')) return;
  // 页面与静态资源：网络优先，失败用缓存（离线可打开）
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok && (e.request.method === 'GET')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then(r => r || caches.match('./'))
    )
  );
});
