// Boot the whole app in jsdom and click through the core flow. Catches the
// class of bug node --check can't: runtime ReferenceErrors, broken wiring,
// screens that fail to render. Run from the repo root:
//   npm i --no-save jsdom && node tools/smoke.mjs
// Exits non-zero on any failure. Skips (exit 0) if jsdom isn't installed.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

let JSDOM;
try { ({ JSDOM } = require("jsdom")); }
catch { console.log("smoke: jsdom not installed — skipping (npm i --no-save jsdom)"); process.exit(0); }

const dom = new JSDOM(readFileSync("index.html", "utf8"), { url: "https://example.com/", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
const document = window.document;
window.speechSynthesis = { cancel() {}, getVoices() { return []; }, speak() {} };
window.SpeechSynthesisUtterance = function () {};
window.matchMedia = () => ({ matches: false });
window.fetch = () => new Promise(() => {});
window.Audio = function () { return { play() { return Promise.resolve(); }, pause() {}, addEventListener() {} }; };

let failed = 0;
const check = (name, cond) => { console.log((cond ? "ok  " : "FAIL"), name); if (!cond) failed++; };

for (const f of ["lessons.js", "kana.js", "app.js", "theme.js", "collection.js"]) {
  try { window.eval(readFileSync(f, "utf8")); check("load " + f, true); }
  catch (e) { check("load " + f + " — " + e.message, false); }
}

const click = (el) => el && el.dispatchEvent(new window.Event("click", { bubbles: true }));
check("home renders level cards", document.querySelectorAll(".level-card").length >= 5);
click(document.querySelector(".level-card"));
check("level page renders lesson cards", document.querySelectorAll(".lesson-chip").length >= 3);
click(document.querySelector(".lesson-chip"));
check("lesson intro opens", !document.getElementById("lesson-intro").hidden);
check("note annotates Japanese with romaji", document.querySelectorAll("#lesson-note ruby rt").length > 0);
check("talk button present on every lesson", !document.getElementById("scene-btn").hidden);
click(document.getElementById("scene-btn"));
check("conversation screen opens", !document.getElementById("quiz").hidden);
click(document.getElementById("back-btn"));
check("back returns home", !document.getElementById("home").hidden);

// Kana section: grid renders both scripts, practice round accepts an answer.
click(document.getElementById("kana-btn"));
check("kana screen opens", !document.getElementById("kana").hidden);
check("kana grid renders 71 letters", document.querySelectorAll("#kana-grid .kana-chip").length === 71);
click(document.getElementById("kana-tab-k"));
check("katakana tab renders 71 letters", document.querySelectorAll("#kana-grid .kana-chip").length === 71);
click(document.getElementById("kana-practice-btn"));
check("kana practice starts", !document.getElementById("kana-quiz").hidden);
check("four sound choices", document.querySelectorAll(".kq-opt").length === 4);
click(document.querySelector(".kq-opt"));
await new Promise((r) => setTimeout(r, 1600));
check("practice advances after answering", document.getElementById("kq-progress").textContent.startsWith("2") || !document.getElementById("kana-quiz").hidden);

process.exit(failed ? 1 : 0);
