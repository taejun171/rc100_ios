/*
 * RC-100 QR 로더 오프라인 저장 (Service Worker)
 *
 * 처음 한 번 인터넷으로 QR 을 열 때 로더 (index.html) 를 휴대폰에 저장해 두고,
 * 그 다음부터는 저장한 로더를 바로 띄웁니다. 앱은 QR 주소의 # 뒤에 들어 있으므로
 * 로더만 있으면 인터넷 없이 (비행기 모드에서도) 동작합니다. 새 QR 을 만들어도 그대로 열립니다.
 *
 * 인터넷이 되면 뒤에서 로더를 새로 받아 저장해 둡니다.
 */
const CACHE = "rc100-qr";
const LOADER = new URL("./", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(LOADER)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const page = url.origin + url.pathname;
  if (event.request.mode !== "navigate" || (page !== LOADER && page !== LOADER + "index.html")) return;

  const fresh = fetch(LOADER, { cache: "no-cache" }).then(async (res) => {
    if (res.ok) await (await caches.open(CACHE)).put(LOADER, res.clone());
    return res;
  });
  event.waitUntil(fresh.catch(() => {}));
  // 저장한 로더를 먼저 씁니다. 학교 와이파이처럼 인터넷이 안 되는데 연결은 된 경우에도 기다리지 않습니다.
  event.respondWith(caches.match(LOADER).then((cached) => cached || fresh));
});
