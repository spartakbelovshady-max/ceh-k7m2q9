/* ЦЕХ — офлайн-кэш. Меняйте номер версии при каждом обновлении приложения. */
const VERSION = "ceh-v50";
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(FILES.map(f =>
        fetch(new Request(f, {cache: "reload"})).then(r => r.ok ? c.put(f, r) : null)
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Сначала кэш — в магазине связи почти нет. Сеть только для внешних ссылок. */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      /* Что уже в кэше — отдаём сразу и в сеть не идём: иначе телефон при каждом
         открытии тянет весь index.html заново. Новая версия приезжает при смене
         VERSION и по кнопке «Проверить обновление». */
      if (hit) return hit;
      return fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
