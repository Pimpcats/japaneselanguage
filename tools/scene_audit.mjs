// Scene layout audit: renders every story beat (and every state within it) in
// a phone-sized browser, saves a screenshot of each to ./audit/, and measures
// the four things that keep going wrong:
//
//   SCALE       — every object sized against a standing person
//   GROUND      — everything rests on the one shared floor line, nothing floats
//   CLIPPING    — no sprite (or its tap glow) cut off by a box around it
//   COMPOSITION — content sits low/middle, no dead band under it
//   MODAL       — the overlay is opaque, the card underneath can't bleed through
//
//   npm i --no-save playwright
//   node tools/scene_audit.mjs                 # screenshots + report
//   node tools/scene_audit.mjs --out audit2    # somewhere else
//   node tools/scene_audit.mjs --only shop     # just beats whose key matches
//
// Writes audit/report.json and prints a failure list. Exit 1 if anything fails.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); }
catch { console.log("scene_audit: playwright not installed — skipping (npm i --no-save playwright)"); process.exit(0); }

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};
const OUT = arg("--out", "audit");
const ONLY = arg("--only", null);
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
mkdirSync(OUT, { recursive: true });

// ---- serve the repo -------------------------------------------------------
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json" };
const missing = new Set();
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let buf;
  try { buf = readFileSync(join(process.cwd(), p === "/" ? "/index.html" : p)); }
  catch { missing.add(p); res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" });
  res.end(buf);
});
await new Promise((r) => server.listen(8231, r));

// ---- the beats, read out of the module's private maps ---------------------
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

// ---- what we measure in the page -----------------------------------------
const MEASURE = () => {
  const R = (n) => n.getBoundingClientRect();
  const scene = document.querySelector("#story-break .story-scene");
  const stage = document.querySelector("#story-break .story-stage");
  const panel = document.querySelector("#story-break .story-panel");
  const root = document.getElementById("story-break");
  if (!root || root.hidden || !stage) return null;
  const sr = R(scene || stage);
  const st = R(stage);

  // does anything clip this node? (a scroller doesn't count — its content is reachable)
  const clippedBy = (node) => {
    for (let p = node.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const hides = (v) => v === "hidden" || v === "clip";
      if (cs.overflowX === "auto" || cs.overflowY === "auto" || cs.overflowX === "scroll" || cs.overflowY === "scroll") return null;
      if (hides(cs.overflowX) || hides(cs.overflowY)) return p;
      if (cs.position === "fixed") break;
    }
    return null;
  };
  // the glow is a filter on the element, so it paints OUTSIDE the border box —
  // measure the extra ring we need room for
  const glowPad = (node) => {
    const f = getComputedStyle(node).filter || "";
    const m = /drop-shadow\(([^)]*)\)/.exec(f);
    if (!m) return 0;
    const nums = (m[1].match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat);
    return nums.length ? Math.max(...nums.map(Math.abs)) + (nums[2] || 0) : 0;
  };

  // What the sprite actually PAINTS — not its button box. A sprite positioned
  // absolutely leaves its button zero-sized, and measuring the button would
  // hide exactly the bug we're hunting.
  // NB: build plain objects — spreading a DOMRect gives you {} (its fields
  // live on the prototype), which silently turns every measurement into NaN.
  const plain = (r) => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height });
  const painted = (n) => {
    let b = null;
    const add = (rect) => {
      if (rect.width < 1 || rect.height < 1) return;
      const r = plain(rect);
      if (!b) { b = r; return; }
      b = { top: Math.min(b.top, r.top), bottom: Math.max(b.bottom, r.bottom),
            left: Math.min(b.left, r.left), right: Math.max(b.right, r.right) };
      b.width = b.right - b.left; b.height = b.bottom - b.top;
    };
    add(R(n));
    n.querySelectorAll("img, svg, .obj").forEach((c) => add(R(c)));
    return b || plain(R(n));
  };

  const items = [];
  document.querySelectorAll("#story-break .story-obj, #story-break .count-slot, #story-break .scene-mochiko, #story-break .story-coin-stack").forEach((n) => {
    const own = R(n);
    const r = painted(n);
    if (r.width < 2 || r.height < 2) return;
    const img = n.querySelector("img");
    const pad = glowPad(n) + glowPad(img || n);
    const box = { top: r.top - pad, bottom: r.bottom + pad, left: r.left - pad, right: r.right + pad };
    const c = clippedBy(n);
    let clip = 0;
    if (c) {
      const cr = R(c);
      clip = Math.max(cr.top - box.top, box.bottom - cr.bottom, cr.left - box.left, box.right - cr.right);
    }
    // how much of the IMAGE's box is actually drawing (contain-letterboxing)
    let fill = 1;
    if (img && img.naturalWidth) {
      const ir = R(img);
      const scale = Math.min(ir.width / img.naturalWidth, ir.height / img.naturalHeight);
      fill = (img.naturalHeight * scale) / ir.height;
    }
    // A rotated sprite (the sushi is drawn at -7deg on purpose) has an
    // axis-aligned bounding box bigger than its unrotated button. That is
    // presentation, not a clipped picture — the glow rides the artwork.
    const rotated = [n, ...n.querySelectorAll("*")].some((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !/^matrix\(1, 0, 0, 1/.test(t);
    });
    items.push({
      rotated,
      cls: (n.className || "").toString().slice(0, 60),
      key: n.dataset ? (n.dataset.object || "") : "",
      zone: n.dataset ? (n.dataset.zone || "") : "",
      x: Math.round(r.left - sr.left), y: Math.round(r.top - sr.top),
      w: Math.round(r.width), h: Math.round(r.height),
      bottom: Math.round(r.bottom - sr.top),
      clip: Math.round(clip),
      fill: +fill.toFixed(2),
      // a box that doesn't cover what it draws: the tap glow is a filter on
      // THIS box, so anything outside it gets a hard straight edge
      boxGap: Math.round(Math.max(own.left - r.left, r.right - own.right, own.top - r.top, r.bottom - own.bottom)),
      img: img ? (img.getAttribute("src") || "").split("/").pop() : null,
      broken: !!(img && img.complete && img.naturalWidth === 0),
    });
  });

  const bg = getComputedStyle(root).backgroundColor;
  const alphaM = /rgba?\(([^)]+)\)/.exec(bg);
  const alpha = alphaM ? parseFloat(alphaM[1].split(",")[3] ?? "1") : 1;
  const cta = document.querySelector("#story-break .story-continue:not([hidden])");
  return {
    scene: { w: Math.round(sr.width), h: Math.round(sr.height) },
    stage: { w: Math.round(st.width), h: Math.round(st.height) },
    items,
    overlayAlpha: alpha,
    ctaBelowFold: cta ? Math.round(Math.max(0, R(cta).bottom - innerHeight)) : 0,
    title: (document.querySelector("#story-break .story-title") || {}).textContent || "",
  };
};

// ---- run ------------------------------------------------------------------
const browser = await chromium.launch({ executablePath: CHROME }).catch(() => chromium.launch());
const ctx = await browser.newContext({ ...devices["iPhone 13 Pro"], isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  const inert = { addEventListener() {}, register: () => new Promise(() => {}), getRegistration: () => Promise.resolve(null), ready: new Promise(() => {}) };
  Object.defineProperty(navigator, "serviceWorker", { get: () => inert });
  localStorage.setItem("hanasou.story.v1", JSON.stringify({ inventory: { avatar: { id: "kai", stage: "adult" }, friend: { id: "yuki", stage: "adult" } }, friendName: "ユキ", beats: {}, soundsSeen: {} }));
});
await page.goto("http://localhost:8231/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const report = [];
const seen = new Set();
for (const [lessonId, en] of beats) {
  const key = lessonId + "|" + en;
  if (seen.has(key)) continue;
  seen.add(key);
  const name = (lessonId + "__" + en).replace(/[^a-zA-Z0-9]+/g, "_").replace(/_+$/, "").slice(0, 52);
  if (ONLY && !name.toLowerCase().includes(ONLY.toLowerCase())) continue;
  const opened = await page.evaluate(([lessonId, en]) => {
    const n = document.getElementById("story-break");
    if (n) { n.hidden = true; n.classList.remove("open"); document.body.classList.remove("story-open"); }
    window.HanasouStory.onSession("lesson", lessonId, false);
    return window.HanasouStory.beforeCard({ mode: "lesson", lessonId, en, drive: false, build: false, warmup: false, lastGrade: null, words: [] });
  }, [lessonId, en]);
  if (!opened) continue;
  for (let step = 0; step < 14; step++) {
    await page.waitForTimeout(step === 0 ? 420 : 260);
    const m = await page.evaluate(MEASURE);
    if (m) {
      const file = `${name}${step ? "-tap" + step : ""}.png`;
      await page.screenshot({ path: join(OUT, file) });
      report.push({ lesson: lessonId, en, step, file, ...m });
    }
    const acted = await page.evaluate(() => {
      const sb = document.getElementById("story-break");
      if (!sb || sb.hidden) return false;
      const t = sb.querySelector(".count-slot:not(.counted), .story-obj:not(:disabled):not(.dimmed), .story-num:not(.done), .story-coin-stack:not([disabled]), .story-people-opt");
      if (!t) return false;
      t.click();
      return true;
    });
    if (!acted) break;
  }
}
await browser.close();
server.close();

// ---- rules ----------------------------------------------------------------
// A standing person is the yardstick. These are the categories the scenes use.
const PERSON = new Set(["mochiko", "friend", "avatar", "friendchar"]);
const fails = [];
for (const s of report) {
  const where = s.file;
  const people = s.items.filter((i) => PERSON.has(i.key));
  for (const it of s.items) {
    if (it.clip > 3) fails.push({ where, rule: "CLIPPING", detail: `${it.key || it.cls} cut off by ${it.clip}px (glow included)` });
    if (it.boxGap > 6 && !it.rotated)
      fails.push({ where, rule: "CLIPPING", detail: `${it.key || it.cls}: sprite paints ${it.boxGap}px outside its own box — the tap glow will cut it` });
    if (it.broken) fails.push({ where, rule: "ART", detail: `${it.img} failed to load` });
    // (count slots are deliberately square cells, so a landscape item
    // letterboxes inside them — that isn't the untrimmed-art bug)
    if (it.fill < 0.7 && it.img && !/count-slot/.test(it.cls))
      fails.push({ where, rule: "FILL", detail: `${it.key}: drawing fills only ${Math.round(it.fill * 100)}% of its box — renders small and floats` });
  }
  // ground line: everything on the floor shares it. Only the sky (sun, moon,
  // stars) is exempt — it is drawn overhead on purpose.
  const grounded = s.items.filter((i) => /grounded|float-item|scene-mochiko/.test(i.cls) && !/sky-item|count-slot/.test(i.cls));
  if (grounded.length > 1) {
    const bots = grounded.map((i) => i.bottom);
    const spread = Math.max(...bots) - Math.min(...bots);
    if (spread > Math.max(14, s.scene.h * 0.06)) fails.push({ where, rule: "GROUND", detail: `feet differ by ${Math.round(spread)}px across ${grounded.length} grounded items` });
  }
  // person is the yardstick: nothing handheld may out-size a person
  if (people.length) {
    const ph = Math.max(...people.map((i) => i.h));
    for (const it of s.items) {
      if (PERSON.has(it.key) || !it.key) continue;
      const HANDHELD = ["cup", "water", "coffee", "book", "sushi", "peach", "ticket", "coin100", "gohan", "natto", "meat", "cake", "wallet", "bill", "toothbrush", "emptyplate", "alarmclock"];
      if (HANDHELD.includes(it.key) && it.h > ph * 0.45)
        fails.push({ where, rule: "SCALE", detail: `${it.key} is ${Math.round((it.h / ph) * 100)}% of a person's height` });
    }
  }
  // composition: don't leave a dead band under the content
  const drawn = s.items.filter((i) => !/count-slot/.test(i.cls));
  if (drawn.length) {
    const lowest = Math.max(...drawn.map((i) => i.bottom));
    const gap = s.scene.h - lowest;
    if (gap > s.scene.h * 0.3) fails.push({ where, rule: "COMPOSITION", detail: `${Math.round((gap / s.scene.h) * 100)}% of the panel is empty below the content` });
    const highest = Math.min(...drawn.map((i) => i.y));
    if (highest < 0) fails.push({ where, rule: "COMPOSITION", detail: `content starts ${-highest}px above the panel` });
    // ...and the subject has to be worth looking at: a figure drawn at a
    // fraction of the frame reads as lost in an empty box, which is what the
    // old fixed 30%-of-frame person rule produced.
    const tallest = Math.max(...drawn.map((i) => i.h));
    if (tallest < s.scene.h * 0.34 && !drawn.every((i) => /sky-item/.test(i.cls)))
      fails.push({ where, rule: "COMPOSITION", detail: `biggest thing on stage is only ${Math.round((tallest / s.scene.h) * 100)}% of the panel — subject lost in empty space` });
  }
  if (s.overlayAlpha < 0.99) fails.push({ where, rule: "MODAL", detail: `overlay background is see-through (${s.overlayAlpha})` });
  if (s.ctaBelowFold > 2) fails.push({ where, rule: "COMPOSITION", detail: `the CTA sits ${s.ctaBelowFold}px below the fold` });
}

writeFileSync(join(OUT, "report.json"), JSON.stringify({ states: report, fails }, null, 1));
console.log(`${report.length} states from ${seen.size} beats → ${OUT}/`);
if (missing.size) { console.log("\nmissing files:"); [...missing].forEach((p) => console.log("  404", p)); }
if (errors.length) { console.log("\nJS errors:"); [...new Set(errors)].forEach((e) => console.log("  ", e)); }
const byRule = {};
fails.forEach((f) => { (byRule[f.rule] = byRule[f.rule] || []).push(f); });
if (fails.length) {
  console.log(`\n${fails.length} failures:`);
  for (const [rule, list] of Object.entries(byRule)) {
    console.log(`\n  ${rule} (${list.length})`);
    list.slice(0, 40).forEach((f) => console.log(`    ${f.where}: ${f.detail}`));
    if (list.length > 40) console.log(`    …and ${list.length - 40} more`);
  }
} else console.log("\nall scenes pass");
process.exit(fails.length || missing.size || errors.length ? 1 : 0);
