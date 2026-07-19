// Service worker — offline app shell for the Hanasou PWA.
// Bump CACHE when the precached shell list changes to evict the old cache.
const CACHE = "hanasou-v209";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "theme.css",
  "ui-polish.css",
  "subway.css",
  "interactive-learning.css",
  "app.js",
  "theme.js",
  "ui-polish.js",
  "lessons.js",
  "kana.js",
  "emoji.js",
  "interactive-learning.js",
  "assets/sfx-chime.wav",
  "assets/frame.png",
  "assets/sign.png",
  "assets/awning.png",
  "assets/street_soft.jpg",
  "assets/chibi_think.png",
  "assets/chibi_cheer.png",
  "assets/story/aki.png",
  "assets/story/beni.png",
  "assets/story/kai.png",
  "assets/story/yuki.png",
  "assets/story/sushi.png",
  "assets/story/peach.png",
  "assets/story/cup.png",
  "assets/story/water.png",
  "assets/story/coffee.png",
  "assets/story/menu.png",
  "assets/story/dogface.png",
  "assets/story/whitecat.png",
  "assets/story/cat.png",
  "assets/story/cow.png",
  "assets/story/octopus.png",
  "assets/story/bird.png",
  "assets/story/book-window.png",
  "assets/story/book-stripes.png",
  "assets/story/book-circle.png",
  "assets/story/bag.png",
  "assets/story/telephone.png",
  "assets/story/umbrella.png",
  "assets/story/ticket.png",
  "assets/story/chair.png",
  "assets/story/house.png",
  "assets/story/station.png",
  "assets/story/town.png",
  "assets/story/schooldesk.png",
  "assets/story/wc.png",
  "assets/story/signal.png",
  "assets/story/car.png",
  "assets/story/train.png",
  "assets/story/bus.png",
  "assets/story/boat.png",
  "assets/story/sea.png",
  "assets/story/winter.png",
  "assets/story/sakura.png",
  "assets/story/flower.png",
  "assets/story/redflower.png",
  "assets/story/mountain.png",
  "assets/story/sun.png",
  "assets/story/moon.png",
  "assets/story/star.png",
  "assets/story/japanmap.png",
  "assets/story/usflag.png",
  "assets/story/mystery.png",
  "assets/story/clockface.png",
  "assets/story/bigface.png",
  "assets/story/redface.png",
  "assets/story/coin100.png",
  "assets/story/hand.png",
  "assets/story/basket.png",
  "assets/chibi_cry.png",
  "assets/chibi_thumbs.png",
  "assets/star_stamp.png",
  "prompts.js",
  "manifest.webmanifest",
  "audio/manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon-180.png",
];

// Precache every pre-generated audio clip the manifest lists, so the app can
// speak offline right after install (best-effort — missing clips fall back to
// speechSynthesis, and the stale-while-revalidate handler caches the rest).
async function precacheAudio(cache) {
  try {
    const res = await fetch("audio/manifest.json", { cache: "no-cache" });
    if (!res.ok) return;
    const { clips } = await res.json();
    const files = [];
    for (const k in clips) {
      if (clips[k].n) files.push("audio/" + clips[k].n);
      if (clips[k].s) files.push("audio/" + clips[k].s);
    }
    await Promise.all(files.map((f) =>
      fetch(f).then((r) => r.ok && cache.put(f, r.clone())).catch(() => {})
    ));
  } catch {}
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).then(() => precacheAudio(c)))
  );
});

// The page asks us to activate immediately when the user taps "Reload".
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                       // let API writes hit the network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // ignore third-party requests
  if (url.pathname.startsWith("/api/")) return;           // never cache the sync API

  // Audio manifest: network-first so freshly generated clips are discovered
  // without a version bump. The clip files themselves are content-hashed
  // (so never stale) and keep using stale-while-revalidate below.
  if (url.pathname.endsWith("/audio/manifest.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Navigations: network-first so a fresh deploy is picked up, cache as offline
  // fallback. cache:"no-cache" bypasses the HTTP cache (Pages serves index with
  // max-age=600, which made reopen-right-after-a-deploy show the stale page).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("index.html", copy));
          return res;
        })
        .catch(() => caches.match("index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Static assets: stale-while-revalidate — instant from cache, refresh in background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
