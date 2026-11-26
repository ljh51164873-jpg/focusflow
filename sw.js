// FocusFlow 오프라인 캐시 v2
// - 앱 화면(index.html 등): 항상 서버의 최신 파일을 먼저 받음 (브라우저 캐시도 건너뜀), 인터넷이 없을 때만 저장본 사용
// - AI 모델·라이브러리: 한 번 받으면 폰에 저장해두고 재사용 (빠른 실행)
const CACHE = "focusflow-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isModel = url.hostname.includes("jsdelivr.net") || url.hostname.includes("storage.googleapis.com");
  if (isModel) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    })));
  } else if (url.origin === location.origin) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request)));
  }
});
