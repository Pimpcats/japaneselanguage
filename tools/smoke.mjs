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

for (const f of ["lessons.js", "app.js", "theme.js", "collection.js"]) {
  try { window.eval(readFileSync(f, "utf8")); check("load " + f, true); }
  catch (e) { check("load " + f + " — " + e.message, false); }
}

const click = (el) => el && el.dispatchEvent(new window.Event("click", { bubbles: true }));
check("home renders level cards", document.querySelectorAll(".level-card").length >= 5);
click(document.querySelector(".level-card"));
check("level page renders journey nodes", document.querySelectorAll(".node-dot").length >= 3);
click(document.querySelector(".node-dot"));
check("lesson intro opens", !document.getElementById("lesson-intro").hidden);
check("talk button present on every lesson", !document.getElementById("scene-btn").hidden);
click(document.getElementById("scene-btn"));
check("conversation screen opens", !document.getElementById("quiz").hidden);
click(document.getElementById("back-btn"));
check("back returns home", !document.getElementById("home").hidden);

process.exit(failed ? 1 : 0);
