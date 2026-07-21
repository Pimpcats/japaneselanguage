// Service worker — offline app shell for the Hanasou PWA.
// Bump CACHE when the precached shell list changes to evict the old cache.
const CACHE = "hanasou-v225";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "theme.css",
  "ui-polish.css",
  "subway.css",
  "interactive-learning.css",
  "stampbook.js",
  "stampbook.css",
  "app.js",
  "theme.js",
  "ui-polish.js",
  "lessons.js",
  "kana.js",
  "emoji.js",
  "interactive-learning.js",
  "assets/sfx-chime.wav",
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
  "assets/story/mochiko-cheer.png",
  "assets/story/mochiko-think.png",
  "assets/story/mochiko-cry.png",
  "assets/story/mochiko-thumbs.png",
  "assets/story/bg-room.png",
  "assets/story/bg-street.png",
  "assets/story/bg-shop.png",
  "assets/story/shelf.png",
  "assets/story/table.png",
  "assets/covers/activities.png",
  "assets/covers/adj-negative.png",
  "assets/covers/adj-noun.png",
  "assets/covers/adjectives.png",
  "assets/covers/age.png",
  "assets/covers/because.png",
  "assets/covers/business-keigo.png",
  "assets/covers/but-kedo.png",
  "assets/covers/cafe.png",
  "assets/covers/can-do.png",
  "assets/covers/causative-passive.png",
  "assets/covers/causative.png",
  "assets/covers/coming-going.png",
  "assets/covers/comparing.png",
  "assets/covers/conditionals.png",
  "assets/covers/counters.png",
  "assets/covers/directions.png",
  "assets/covers/does-this-go.png",
  "assets/covers/even-though.png",
  "assets/covers/experience.png",
  "assets/covers/favors.png",
  "assets/covers/frequency.png",
  "assets/covers/greetings.png",
  "assets/covers/had-better.png",
  "assets/covers/have-to.png",
  "assets/covers/how-far.png",
  "assets/covers/i-think.png",
  "assets/covers/intend.png",
  "assets/covers/intro.png",
  "assets/covers/kagiri.png",
  "assets/covers/kenjougo.png",
  "assets/covers/l0-a.png",
  "assets/covers/l0-dakuten.png",
  "assets/covers/l0-ha.png",
  "assets/covers/l0-ka.png",
  "assets/covers/l0-ma.png",
  "assets/covers/l0-na.png",
  "assets/covers/l0-ra.png",
  "assets/covers/l0-sa.png",
  "assets/covers/l0-ta.png",
  "assets/covers/l0-wa.png",
  "assets/covers/l0-ya.png",
  "assets/covers/lets.png",
  "assets/covers/likes.png",
  "assets/covers/making-plans.png",
  "assets/covers/money.png",
  "assets/covers/monono.png",
  "assets/covers/na-adj.png",
  "assets/covers/negative.png",
  "assets/covers/ni-oite.png",
  "assets/covers/numbers.png",
  "assets/covers/object.png",
  "assets/covers/passive.png",
  "assets/covers/past-1.png",
  "assets/covers/past-negative.png",
  "assets/covers/permission.png",
  "assets/covers/plain-form.png",
  "assets/covers/potential.png",
  "assets/covers/quoting.png",
  "assets/covers/reactions.png",
  "assets/covers/routine.png",
  "assets/covers/seems.png",
  "assets/covers/sequence-te.png",
  "assets/covers/sequence.png",
  "assets/covers/shop.png",
  "assets/covers/should-supposed.png",
  "assets/covers/sonkeigo.png",
  "assets/covers/te-form.png",
  "assets/covers/te-iru.png",
  "assets/covers/te-please.png",
  "assets/covers/telling-time.png",
  "assets/covers/this-that.png",
  "assets/covers/tickets.png",
  "assets/covers/timing.png",
  "assets/covers/transport.png",
  "assets/covers/travel-trouble.png",
  "assets/covers/try-doing.png",
  "assets/covers/verbs.png",
  "assets/covers/wake.png",
  "assets/covers/wants.png",
  "assets/covers/was-were.png",
  "assets/covers/where.png",
  "assets/covers/you-ni.png",
  "assets/covers/zaru-o-enai.png",
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
