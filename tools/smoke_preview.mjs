import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const html = readFileSync("studio-preview/index.html", "utf8");
const dom = new JSDOM(html, {
  url: "https://example.com/studio-preview/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;
window.scrollTo = () => {};
window.speechSynthesis = { cancel() {}, getVoices() { return []; }, speak() {} };
window.SpeechSynthesisUtterance = function () {};
window.fetch = () => new Promise(() => {});
window.Audio = function () {
  return { play() { return Promise.resolve(); }, pause() {}, addEventListener() {} };
};

let failed = 0;
const check = (name, condition) => {
  console.log((condition ? "ok  " : "FAIL"), name);
  if (!condition) failed++;
};
for (const file of ["lessons.js", "studio-preview/content-overrides.js", "studio-preview/app.js"]) {
  try {
    const source = readFileSync(file, "utf8");
    window.eval(source);
    check("load " + file, true);
  } catch (error) {
    check("load " + file + ": " + error.message, false);
  }
}
check("four guided stops render", document.querySelectorAll(".route-node").length === 4);
const canDoLesson = window.LESSONS.find((lesson) => lesson.id === "can-do");
check("language ability uses natural spoken Japanese",
  canDoLesson.sentences.some((sentence) => sentence.en === "I can speak Japanese." && sentence.jp === "にほんごが はなせます。"));
const platformLesson = window.LESSONS.find((lesson) => lesson.id === "does-this-go");
check("platform question matches its English meaning",
  platformLesson.sentences.some((sentence) => sentence.en === "Is this the platform for Shibuya?" && sentence.jp === "しぶやいきは この ホームですか？"));
document.getElementById("start-session").click();
check("guided start opens Recall", document.getElementById("practice-view").classList.contains("active") &&
  /SAY IT IN JAPANESE/.test(document.getElementById("prompt-type").textContent));
check("Recall explicitly asks learner to speak first",
  /Say your answer out loud before revealing it/.test(document.getElementById("prompt-hint").textContent));
document.getElementById("back-home").click();
document.querySelector('[data-mode="scenes"]').click();
check("conversation opens with the Japanese line", !!document.querySelector(".conversation-jp"));
check("reply choices are initially hidden", document.getElementById("conversation-choice-list")?.hidden === true);
document.getElementById("conversation-show-choices").click();
check("learner can reveal choices after speaking", document.getElementById("conversation-choice-list")?.hidden === false);
check("every visible reply has an audio control",
  document.querySelectorAll("#conversation-choice-list .choice-with-audio .mini-audio").length ===
  document.querySelectorAll("#conversation-choice-list .conversation-choice").length);
document.querySelector("#conversation-choice-list .conversation-choice").click();
check("conversation choice produces feedback", !document.getElementById("conversation-feedback").hidden);
document.querySelector('[data-mode="patterns"]').click();
check("Pattern Lab presents a sentence transformation", !!document.querySelector(".challenge-source") &&
  !!document.querySelector(".challenge-task"));
if (failed) {
  console.error("\n" + failed + " preview smoke test(s) failed");
  process.exit(1);
}
console.log("\npreview smoke OK");
