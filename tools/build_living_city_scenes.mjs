// Builds living-city/scenes.js + docs/LIVING_CITY_ART_PROMPTS.md from the
// hand-authored scene JSON (one file per batch of lessons).
//
//   node tools/build_living_city_scenes.mjs <dir-with-out-*.json>
//
// Validates every lesson/page against lessons.js, keeps only props whose art
// exists in assets/story or is described for drawing, and writes a ready-to-
// paste ChatGPT prompt for every picture that still needs to be made.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2];
if (!dir) { console.error("usage: node tools/build_living_city_scenes.mjs <dir>"); process.exit(1); }

globalThis.window = {};
new Function(readFileSync(path.join(root, "lessons.js"), "utf8"))();
const LESSONS = window.LESSONS;
const story = path.join(root, "assets", "story");
const have = (art) => existsSync(path.join(story, art + ".png"));
const haveBg = (key) => existsSync(path.join(story, key + ".jpg"));

const merged = {};
for (const f of readdirSync(dir).filter((f) => /^out-\d+\.json$/.test(f)).sort()) {
  Object.assign(merged, JSON.parse(readFileSync(path.join(dir, f), "utf8")));
}

const problems = [];
const newArt = new Map();   // key -> { desc, uses: [{lesson, i, say}] }
const newBg = new Map();    // key -> { desc, lessons: [] }
const out = {};
const clean = (p, where) => {
  if (!p || !p.art) { problems.push(where + ": prop without art"); return null; }
  const art = String(p.art).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!have(art)) {
    if (!p.new && !newArt.has(art)) { problems.push(where + ": unknown art '" + art + "' with no description"); return null; }
    const entry = newArt.get(art) || { desc: p.new, uses: [] };
    if (!entry.desc && p.new) entry.desc = p.new;
    entry.uses.push(where + (p.say ? " (" + p.say + ")" : ""));
    newArt.set(art, entry);
  }
  const o = { art };
  if (p.say) o.say = p.say;
  if (p.size === "big" || p.size === "small") o.size = p.size;
  if (Number(p.count) > 1) o.count = Math.min(5, Number(p.count));
  return o;
};

for (const lesson of LESSONS) {
  const sc = merged[lesson.id];
  if (!sc) { problems.push(lesson.id + ": no scene authored"); continue; }
  const entry = {};
  // postcard
  const pc = sc.postcard;
  if (typeof pc === "string") {
    entry.postcard = pc.replace(/\.jpg$/, "");
    if (!haveBg(entry.postcard)) {
      // a new postcard described by another lesson in the same place
      entry.postcardNew = true;
      const b = newBg.get(entry.postcard) || { desc: "", lessons: [] };
      b.lessons.push(lesson.id);
      newBg.set(entry.postcard, b);
    }
  } else if (pc && pc.new_key) {
    const key = pc.new_key.replace(/\.jpg$/, "");
    entry.postcard = key;
    if (!haveBg(key)) {
      entry.postcardNew = true;
      const b = newBg.get(key) || { desc: pc.new, lessons: [] };
      if (!b.desc && pc.new) b.desc = pc.new;
      b.lessons.push(lesson.id);
      newBg.set(key, b);
    }
  }
  entry.world = (sc.world || []).map((p) => clean(p, lesson.id + " world")).filter(Boolean).slice(0, 2);
  const pages = sc.pages || [];
  if (pages.length !== lesson.sentences.length) problems.push(lesson.id + ": " + pages.length + " pages for " + lesson.sentences.length + " sentences");
  entry.pages = [];
  for (const page of pages) {
    const s = lesson.sentences[page.i];
    if (!s) { problems.push(lesson.id + "#" + page.i + ": no such sentence"); continue; }
    const props = (page.props || []).map((p) => clean(p, lesson.id + "#" + page.i)).filter(Boolean).slice(0, 3);
    for (const p of props) {
      if (p.say && !(s.words || []).some((w) => w.jp === p.say) && !s.jp.includes(p.say)) problems.push(lesson.id + "#" + page.i + ": say '" + p.say + "' not in the sentence");
    }
    if (props.length) entry.pages.push({ i: page.i, props });
  }
  out[lesson.id] = entry;
}

for (const [key, b] of newBg) if (!b.desc) problems.push("postcard '" + key + "' (" + b.lessons.join(", ") + ") has no description");
const header = "// The pop-up pictures for every page of the Living City book, chosen by hand\n" +
  "// so each one literally matches its sentence (built by\n" +
  "// tools/build_living_city_scenes.mjs). Per lesson: postcard (backdrop key in\n" +
  "// assets/story; postcardNew = not drawn yet, the section backdrop stands in),\n" +
  "// world (props behind, for the lesson's situation) and pages[i].props (what\n" +
  "// sentence i shows). A prop is {art, say?, size?, count?}; art not drawn yet\n" +
  "// simply doesn't appear. See docs/LIVING_CITY_ART_PROMPTS.md.\n";
writeFileSync(path.join(root, "living-city", "scenes.js"), header + "window.BOOK_SCENES = " + JSON.stringify(out, null, 1) + ";\n");

// ---- the prompts doc -------------------------------------------------------------
const OBJ = "Clean bold hand-inked outlines, refined cel + gouache shading, muted natural palette. A single object on flat chroma-key green (#00b140), no shadows: ";
const BG = "Hand-drawn coloured manga / children's-book illustration: confident hand-inked outlines, light hatching, soft hand-painted shading, warm and cosy, genuinely hand-drawn. NOT flat clip-art. NO uniform/grid-like all-over texture, no stamped paper-grain. Wide 3:2. ";
// "an empty office, no people." → "An empty office" (the prompt adds its own ending)
const tidy = (d) => { const t = String(d || "").trim().replace(/[,;]?\s*no people\.?$/i, "").replace(/\s*\.?\s*$/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };
const sentenceFor = (where) => {
  const m = /^([a-z0-9-]+)#(\d+)/.exec(where);
  if (!m) return "";
  const s = (LESSONS.find((l) => l.id === m[1]) || {}).sentences?.[Number(m[2])];
  return s ? s.jp + " — " + s.en : "";
};
const arts = [...newArt.entries()].sort((a, b) => b[1].uses.length - a[1].uses.length || a[0].localeCompare(b[0]));
let md = "# Living City — art still to draw\n\n" +
  "Every pop-up in the Living City book is chosen by hand to match its sentence\n" +
  "(`living-city/scenes.js`). These pictures are referenced but not drawn yet — until\n" +
  "they exist, those pages simply show fewer pop-ups (never a wrong one).\n\n" +
  "**How to add one:** paste the prompt into ChatGPT, cut the green-screen result with\n" +
  "`python3 tools/cut_sheet.py <image> 1x1 <name> assets/story` (objects), or save a\n" +
  "backdrop as `assets/story/<name>.jpg`, then push. It appears automatically.\n\n" +
  "Generated by `tools/build_living_city_scenes.mjs` — " + arts.length + " objects, " + newBg.size + " postcards.\n\n";
md += "## Postcards (backdrops)\n\n";
for (const [key, b] of newBg) {
  md += "### `" + key + ".jpg`  — " + b.lessons.join(", ") + "\n```\n" + BG + tidy(b.desc) + ". No people.\n```\n\n";
}
md += "## Objects (green screen → cut)\n\n";
for (const [key, a] of arts) {
  const uses = a.uses.slice(0, 3).map((u) => { const s = sentenceFor(u); return s ? "`" + u.replace(/ \(.*\)$/, "") + "` " + s : "`" + u + "`"; });
  md += "### `" + key + ".png`  — used " + a.uses.length + "×\n" + uses.map((u) => "- " + u).join("\n") + "\n```\n" + OBJ + String(a.desc || "").trim().replace(/\s*\.?\s*$/, "") + ".\n```\n\n";
}
writeFileSync(path.join(root, "docs", "LIVING_CITY_ART_PROMPTS.md"), md);

const pagesWith = Object.values(out).reduce((n, e) => n + e.pages.length, 0);
console.log("lessons:", Object.keys(out).length, "| pages with props:", pagesWith, "| new objects:", arts.length, "| new postcards:", newBg.size);
console.log(problems.length ? "PROBLEMS:\n- " + problems.join("\n- ") : "no problems");
