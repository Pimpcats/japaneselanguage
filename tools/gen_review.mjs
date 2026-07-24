// Bakes all lesson content (cards + phrasing sentences + vocab) into
// review/data.js for the standalone review PWA. Re-run after editing lessons.js:
//   node tools/gen_review.mjs
import { readFileSync, writeFileSync } from "node:fs";

// load lessons.js in a minimal window shim
const g = globalThis;
g.window = g.window || {};
await import("../lessons.js");
const LEVELS = g.window.LEVELS || [];
const LESSONS = g.window.LESSONS || [];

// pull the site version stamp so the review tool shows what it was built against
let version = "";
try { version = (readFileSync(new URL("../sw.js", import.meta.url), "utf8").match(/hanasou-v(\d+)/) || [])[1] || ""; } catch {}

const themeLevel = {};
for (const lv of LEVELS) for (const t of (lv.tiers || [])) for (const th of (t.themes || [])) themeLevel[th] = lv;

const levelsOut = LEVELS.map((lv) => ({ id: lv.id, name: lv.name, title: lv.title, lessons: [] }));
const byId = Object.fromEntries(levelsOut.map((l) => [l.id, l]));
const orphan = { id: "_other", name: "", title: "Unsorted", lessons: [] };

for (const L of LESSONS) {
  const lv = themeLevel[L.section];
  const bucket = (lv && byId[lv.id]) || orphan;
  bucket.lessons.push({
    id: L.id,
    section: L.section || "",
    title: L.title || "",
    grammar: L.grammar || "",
    grammarNote: L.grammarNote || "",
    vocab: (L.vocab || []).map((v) => ({ jp: v.jp, romaji: v.romaji || "", en: v.en || "", pos: v.pos || "" })),
    sentences: (L.sentences || []).map((s) => ({ en: s.en || "", jp: s.jp || "", romaji: s.romaji || "", hint: s.hint || "" })),
  });
}

const out = levelsOut.filter((l) => l.lessons.length);
if (orphan.lessons.length) out.push(orphan);

const data = {
  version,
  builtAt: new Date().toISOString().slice(0, 10),
  counts: {
    lessons: LESSONS.length,
    sentences: LESSONS.reduce((n, L) => n + (L.sentences || []).length, 0),
    vocab: LESSONS.reduce((n, L) => n + (L.vocab || []).length, 0),
  },
  levels: out,
};

writeFileSync(new URL("../review/data.js", import.meta.url),
  "window.REVIEW = " + JSON.stringify(data) + ";\n");
console.log(`review/data.js — ${data.counts.lessons} lessons · ${data.counts.sentences} sentences · ${data.counts.vocab} vocab · built against v${version}`);
