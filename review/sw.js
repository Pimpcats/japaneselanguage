// Review PWA service worker — precache the shell so it installs and runs
// offline on the home screen. Bump CACHE (and the ?v= query in index.html)
// whenever review/data.js or the app files change.
const CACHE = "hanasou-review-v6";
const SHELL = [
  "./",
  "./index.html",
  "./review.css?v=6",
  "./review.js?v=6",
  "./data.js?v=6",
  "./panels.js?v=6",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  // do NOT auto-skipWaiting — a fresh version waits until the in-app Reload
  // button tells it to activate, so the user is never yanked mid-review.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith("hanasou-review")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // network-first for navigations (pick up new deploys), cache-first for the rest
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", cp)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => hit)));
});
