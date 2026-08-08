// Visual regression net: drives the real app in a phone-sized browser and
// reports the class of bug that keeps reaching the owner's screen —
// something drawn OUTSIDE the box that clips it (a TV taller than its stage,
// a counter chip hanging off the frame, five sushi wrapped onto a row that
// isn't there), an overlay you can see through, or art that 404s.
//
// It walks every app screen and every story beat, and — the part a static
// check can't do — it PLAYS each beat (taps the targets, counts the items)
// and re-measures after every step, because most of these bugs only appear
// once something has been tapped.
//
//   npm i --no-save playwright && node tools/ui_audit.mjs
//   node tools/ui_audit.mjs --shots /tmp/shots     # also save screenshots
//
// Exits non-zero when it finds something. Skips (exit 0) without playwright.
import { readFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); }
catch { console.log("ui_audit: playwright not installed — skipping (npm i --no-save playwright)"); process.exit(0); }

const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SHOTS = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json" };
const ROOT = process.cwd();
const missing = new Set();
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const f = join(ROOT, p === "/" ? "/index.html" : p);
  let buf;
  try { buf = readFileSync(f); } catch { missing.add(p); res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(f)] || "application/octet-stream" });
  res.end(buf);
});
await new Promise((r) => server.listen(8123, r));

// ---- the in-page measurer -------------------------------------------------
// An element is "clipped" when it sticks out of an ancestor that hides
// overflow. That single rule catches every one of the bugs above.
const MEASURE = () => {
  const out = [];
  // The clipper is the first ancestor that HIDES what leaves it. A scroller
  // (the level page's card rail, the overlay itself) doesn't count — its
  // offscreen content is reachable, that's the whole point of a rail.
  const clipper = (node) => {
    for (let p = node.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const hides = (v) => v === "hidden" || v === "clip";
      const scrolls = (v) => v === "auto" || v === "scroll";
      if (scrolls(cs.overflowX) || scrolls(cs.overflowY)) return null;
      if (hides(cs.overflowX) || hides(cs.overflowY)) return p;
      if (cs.position === "fixed") break;
    }
    return null;
  };
  const seen = new Set();
  document.querySelectorAll(
    ".story-obj, .count-slot, .count-chip, .obj-tag, .scene-mochiko, .story-coin-stack," +
    " .snd-pair, .story-num, .story-ask, .story-answer, .story-continue, .lesson-card, .kana-chip," +
    " .word-chip, .qc-opt, .grade, #prompt-en, #answer-kana",
  ).forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;                 // not rendered
    const c = clipper(n);
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const over = Math.max(cr.top - r.top, r.bottom - cr.bottom, cr.left - r.left, r.right - cr.right);
    if (over > 3) {
      const key = n.className + "|" + Math.round(over);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ what: (n.className || n.id || n.tagName).toString().slice(0, 44), over: Math.round(over),
                 inside: (c.className || c.id || c.tagName).toString().slice(0, 30) });
    }
  });
  // an overlay you can see through
  const sb = document.getElementById("story-break");
  if (sb && !sb.hidden) {
    const bg = getComputedStyle(sb).backgroundColor;
    const m = /rgba?\(([^)]+)\)/.exec(bg);
    const a = m ? parseFloat(m[1].split(",")[3] ?? "1") : 1;
    if (a < 0.99) out.push({ what: "#story-break background", over: 0, inside: "see-through: " + bg });
  }
  // The action you're meant to press has to be ON SCREEN. The panel grows when
  // a beat attaches its answer, and the button can slide under the fold —
  // technically scrollable, in practice invisible.
  document.querySelectorAll(".story-continue:not([hidden]), #lesson-done:not([hidden]) .review-btn:not([hidden])").forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.height > 2 && (r.bottom > innerHeight + 2 || r.top < -2))
      out.push({ what: (b.className || "").toString().slice(0, 40), over: Math.round(Math.max(r.bottom - innerHeight, -r.top)), inside: "below the fold — primary action off screen" });
  });
  // the page itself must never scroll sideways
  if (document.documentElement.scrollWidth > innerWidth + 2)
    out.push({ what: "page", over: document.documentElement.scrollWidth - innerWidth, inside: "viewport (sideways scroll)" });
  // art that failed to load
  document.querySelectorAll("img").forEach((im) => {
    if (im.complete && im.naturalWidth === 0 && im.getAttribute("src"))
      out.push({ what: "broken img " + im.getAttribute("src").slice(-40), over: 0, inside: "did not load" });
  });
  return out;
};

const problems = [];
const note = (where, list) => list.forEach((p) => problems.push({ where, ...p }));

const browser = await chromium.launch({ executablePath: CHROME }).catch(() => chromium.launch());
const ctx = await browser.newContext({ ...devices["iPhone 13 Pro"], isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
await page.addInitScript(() => {
  // A real service worker would take control mid-run and reload the page out
  // from under us. Hand the app an inert one — NOT undefined, since it tests
  // `"serviceWorker" in navigator` and would then throw on a live phone path.
  const inert = { addEventListener() {}, register: () => new Promise(() => {}), getRegistration: () => Promise.resolve(null), ready: new Promise(() => {}) };
  Object.defineProperty(navigator, "serviceWorker", { get: () => inert });
  localStorage.setItem("hanasou.story.v1", JSON.stringify({ inventory: { avatar: { id: "kai", stage: "adult" } }, beats: {}, soundsSeen: {} }));
});
await page.goto("http://localhost:8123/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const check = async (name) => { note(name, await page.evaluate(MEASURE)); await shot(name); };

// ---- 1. the app's own screens --------------------------------------------
await check("home");
await page.evaluate(() => document.querySelector(".level-stop:not(:disabled), .level-card").dispatchEvent(new Event("click", { bubbles: true })));
await page.waitForTimeout(300);
await check("level-page");
await page.evaluate(() => document.querySelector(".lesson-rail .lesson-card").dispatchEvent(new Event("click", { bubbles: true })));
await page.waitForTimeout(400);
await page.evaluate(() => { const c = document.querySelector(".coach-layer .coach-next"); if (c) c.click(); });
await page.waitForTimeout(200);
await check("drill-card");
await page.evaluate(() => document.getElementById("card").click());
await page.waitForTimeout(300);
await check("drill-revealed");
await page.evaluate(() => document.getElementById("back-btn").click());
await page.waitForTimeout(300);
await page.evaluate(() => { const b = document.getElementById("kana-btn"); if (b) b.click(); });
await page.waitForTimeout(350);
await check("kana-grid");
await page.evaluate(() => { const b = document.getElementById("back-btn"); if (b && !b.hidden) b.click(); });
await page.waitForTimeout(250);
// the hubs behind the bottom nav, then settings (the gear TOGGLES, so it has
// to come last — clicking a hub tab while it's open leaves settings on screen)
for (const hub of ["library", "progress"]) {
  await page.evaluate((h) => { const b = document.querySelector('.tab-item[data-hub="' + h + '"]'); if (b) b.click(); }, hub);
  await page.waitForTimeout(400);
  await check("hub-" + hub);
}
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /スタンプ|stamp/i.test(x.textContent || "")); if (b) b.click(); });
await page.waitForTimeout(500);
await check("stampbook");
await page.evaluate(() => { document.querySelectorAll(".sb-close, .stamp-close, #back-btn").forEach((b) => { if (b && !b.hidden) b.click(); }); });
await page.waitForTimeout(300);
// Talk with もち子さん — the scene player, now 73 hand-written conversations
await page.evaluate(() => { const b = document.querySelector('.tab-item[data-hub="lessons"]'); if (b) b.click(); });
await page.waitForTimeout(350);
await page.evaluate(() => {
  const lv = document.querySelector(".level-stop:not(:disabled), .level-card");
  if (lv) lv.dispatchEvent(new Event("click", { bubbles: true }));
});
await page.waitForTimeout(300);
const talked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /🎭|Talk with/.test(x.textContent || ""));
  if (!b) return false;
  b.click();
  return true;
});
if (talked) {
  await page.waitForTimeout(600);
  await check("talk-scene");
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const n = document.getElementById("quiz-next-btn"); if (n && !n.hidden) n.click(); });
    await page.waitForTimeout(320);
    note("talk-scene+step" + (i + 1), await page.evaluate(MEASURE));
  }
  await shot("talk-scene-played");
}
await page.evaluate(() => { const b = document.getElementById("back-btn"); if (b && !b.hidden) b.click(); });
await page.waitForTimeout(300);
await page.evaluate(() => { const b = document.getElementById("settings-btn"); if (b) b.click(); });
await page.waitForTimeout(350);
await check("settings");
await page.evaluate(() => { const b = document.getElementById("settings-btn"); if (b) b.click(); });
await page.waitForTimeout(300);

// ---- 2. every story beat, played to the end ------------------------------
const screensOnly = process.argv.includes("--screens");   // skip the slow half
// The maps live inside the module, so read them out of the source.
const src = readFileSync("interactive-learning.js", "utf8");
const beats = [];
for (const mapName of ["AFTER_PROMPT", "BEFORE_PROMPT"]) {
  const i = src.indexOf("const " + mapName + " = {");
  if (i < 0) continue;
  let d = 0, j = src.indexOf("{", i);
  const start = j;
  for (; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}") { d--; if (!d) break; } }
  const body = src.slice(start, j);
  const re = /\n    "([a-z0-9-]+)":\s*\{/g;
  let m;
  while ((m = re.exec(body))) {
    let k = m.index + m[0].length - 1, dd = 0, e = k;
    for (; e < body.length; e++) { if (body[e] === "{") dd++; else if (body[e] === "}") { dd--; if (!dd) break; } }
    const block = body.slice(k, e);
    const pre = /"([^"\n]{4,})":\s*\{/g;
    let p;
    while ((p = pre.exec(block))) {
      if (/^(answer|ask|next)$/.test(p[1]) || !/[a-zA-Z]/.test(p[1])) continue;
      beats.push([m[1], p[1]]);
    }
  }
}
const seenBeat = new Set();
let played = 0;
for (const [lessonId, en] of (screensOnly ? [] : beats)) {
  const key = lessonId + "|" + en;
  if (seenBeat.has(key)) continue;
  seenBeat.add(key);
  const opened = await page.evaluate(([lessonId, en]) => {
    const n = document.getElementById("story-break");
    if (n) { n.hidden = true; n.classList.remove("open"); document.body.classList.remove("story-open"); }
    window.HanasouStory.onSession("lesson", lessonId, false);
    return window.HanasouStory.beforeCard({ mode: "lesson", lessonId, en, drive: false, build: false, warmup: false, lastGrade: null, words: [] });
  }, [lessonId, en]);
  if (!opened) continue;
  played++;
  const label = (lessonId + "__" + en).replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 46);
  await page.waitForTimeout(260);
  await check("beat/" + label);
  // play it: tap targets until the beat is answered, measuring each step
  for (let step = 0; step < 12; step++) {
    const acted = await page.evaluate(() => {
      const sb = document.getElementById("story-break");
      if (!sb || sb.hidden) return false;
      const t = sb.querySelector(".count-slot:not(.counted), .story-obj:not(:disabled):not(.dimmed), .story-num:not(.done), .story-coin-stack:not([disabled]), .story-people-opt");
      if (!t) return false;
      t.click();
      return true;
    });
    if (!acted) break;
    await page.waitForTimeout(190);
    note("beat/" + label + "+tap" + (step + 1), await page.evaluate(MEASURE));
  }
  await shot("beat/" + label + "-played");
}

await browser.close();
server.close();

// ---- report ---------------------------------------------------------------
console.log(`screens + ${played} beats audited`);
if (missing.size) { console.log("\nmissing files requested by the app:"); [...missing].forEach((p) => console.log("  404", p)); }
if (pageErrors.length) { console.log("\nJS errors:"); [...new Set(pageErrors)].forEach((e) => console.log("  ", e)); }
if (problems.length) {
  console.log(`\n${problems.length} clipped / see-through / broken element(s):`);
  for (const p of problems) console.log(`  ${p.where}: ${p.what} — ${p.over ? p.over + "px outside" : ""} ${p.inside}`);
} else {
  console.log("\nnothing clipped, nothing see-through, no broken art");
}
const bad = problems.length + missing.size + pageErrors.length;
process.exit(bad ? 1 : 0);
