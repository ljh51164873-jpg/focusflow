// FocusFlow 오프라인 캐시: 앱 화면 + AI 모델을 폰에 저장해서 다음부터 빨리 켜지게
const CACHE = "focusflow-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const isModel = url.hostname.includes("jsdelivr.net") || url.hostname.includes("storage.googleapis.com");
  if (isModel) {
    // AI 모델·라이브러리: 한 번 받으면 저장해두고 재사용
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    })));
  } else if (url.origin === location.origin) {
    // 앱 화면: 새 버전을 먼저 시도하고, 안 되면 저장본 사용
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request)));
  }
});
