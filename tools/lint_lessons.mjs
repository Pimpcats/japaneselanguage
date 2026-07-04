// Content + release lint. Catches the mistakes that break the app without
// breaking syntax: lessons invisible because their section matches no theme,
// bad pos tags (they drive colour-coding), scenes pointing at missing lessons,
// and version stamps that drifted apart (index.html ?v= vs sw.js CACHE).
// Run from the repo root: node tools/lint_lessons.mjs   (exit 1 on findings)
import { readFileSync } from "node:fs";

const win = {};
new Function("window", readFileSync("lessons.js", "utf8"))(win);
const { LEVELS, LESSONS, SCENES, MOCHIKO, MISSIONS } = win;

let bad = 0;
const fail = (msg) => { console.log("FAIL", msg); bad++; };
const POS = new Set(["n", "v", "adj", "adv", "prt", "cop", "expr", "aux", "conj"]);

// -- lessons ----------------------------------------------------------------
const themes = new Set(LEVELS.flatMap((lv) => lv.tiers.flatMap((t) => t.themes)));
const ids = new Set();
for (const L of LESSONS) {
  if (ids.has(L.id)) fail(`duplicate lesson id "${L.id}"`);
  ids.add(L.id);
  if (!themes.has(L.section)) fail(`lesson "${L.id}": section "${L.section}" matches no level theme — lesson is INVISIBLE`);
  if (!L.title || !L.grammar) fail(`lesson "${L.id}": missing title/grammar`);
  for (const w of L.vocab || []) {
    if (!w.jp || !w.en || !w.romaji) fail(`lesson "${L.id}": vocab entry missing jp/romaji/en (${w.jp || "?"})`);
    if (w.pos && !POS.has(w.pos)) fail(`lesson "${L.id}": vocab "${w.jp}" has unknown pos "${w.pos}"`);
  }
  if (!L.sentences || !L.sentences.length) fail(`lesson "${L.id}": no sentences`);
  for (const s of L.sentences || []) {
    if (!s.jp || !s.en || !s.romaji) fail(`lesson "${L.id}": sentence missing jp/romaji/en ("${(s.en || s.jp || "?").slice(0, 30)}")`);
    if (!s.words || !s.words.length) fail(`lesson "${L.id}": sentence "${(s.jp || "").slice(0, 20)}" has no words[] breakdown (word taps will use device TTS)`);
    for (const w of s.words || []) if (w.pos && !POS.has(w.pos)) fail(`lesson "${L.id}": word "${w.jp}" has unknown pos "${w.pos}"`);
  }
}

// -- scenes / character content ----------------------------------------------
for (const sc of SCENES || []) {
  if (!ids.has(sc.lesson)) fail(`scene "${sc.id}": lesson "${sc.lesson}" does not exist`);
  for (const st of sc.steps || []) {
    if (!st.jp) fail(`scene "${sc.id}": step missing jp`);
    if (st.who !== "m" && st.who !== "you") fail(`scene "${sc.id}": step has who="${st.who}"`);
    if (st.who === "you" && (!st.en || !st.romaji)) fail(`scene "${sc.id}": your line "${st.jp}" missing en/romaji`);
  }
}
for (const key of Object.keys(MISSIONS || {})) {
  if (key !== "_generic" && !ids.has(key)) fail(`mission key "${key}" is not a lesson id`);
}
for (const pool of ["greetings", "praise", "reactions", "closings"]) {
  for (const l of (MOCHIKO || {})[pool] || []) if (!l.jp || !l.en) fail(`MOCHIKO.${pool}: entry missing jp/en`);
}

// -- release consistency: every ?v= in index.html equal, and sw.js matches ----
const idx = readFileSync("index.html", "utf8");
const vs = [...idx.matchAll(/\?v=(\d+)/g)].map((m) => m[1]);
const sw = /hanasou-v(\d+)/.exec(readFileSync("sw.js", "utf8"));
if (new Set(vs).size !== 1) fail(`index.html has mixed ?v= stamps: ${[...new Set(vs)].join(", ")}`);
if (!sw || sw[1] !== vs[0]) fail(`version drift: index.html ?v=${vs[0]} but sw.js CACHE is hanasou-v${sw && sw[1]}`);

console.log(bad ? `\n${bad} problem${bad === 1 ? "" : "s"} found` : `lint OK — ${LESSONS.length} lessons, ${(SCENES || []).length} scenes, v${vs[0]}`);
process.exit(bad ? 1 : 0);
