import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = readFileSync(path.join(root, "living-city", "index.html"), "utf8");
const app = readFileSync(path.join(root, "living-city", "app.js"), "utf8");
const runnableHtml = html.replace(/<link rel="stylesheet" href="styles\.css">/, "")
  .replace('<script src="app.js"></script>', "<script>" + app + "</script>");
const dom = new JSDOM(runnableHtml, {
  url: "https://hanasou.test/living-city/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) { window.scrollTo = () => {}; }
});
const { document } = dom.window;
const click = selector => {
  const element = document.querySelector(selector);
  assert.ok(element, "Expected element " + selector);
  element.click();
};
assert.ok(document.querySelector("#welcome").classList.contains("active"), "Welcome should be the initial screen");
click('#welcome [data-go="home"]');
assert.ok(document.querySelector("#home").classList.contains("active"), "Start journey should open home");
click("#drive-mode");
assert.equal(document.querySelector("#drive-mode").getAttribute("aria-pressed"), "true", "Driving mode toggle should activate");
click('[data-mode="recall"]');
assert.ok(document.querySelector("#practice").classList.contains("active"), "Choosing Recall should open practice");
assert.equal(document.querySelector("#driving-banner").hidden, false, "Driving mode banner should be visible");
assert.equal(document.querySelector("#practice-scene").hidden, true, "Driving mode should hide the scene artwork during practice");
click("#visual-mode");
assert.equal(document.querySelector("#visual-mode").getAttribute("aria-pressed"), "true", "Visual mode toggle should activate");
assert.equal(document.querySelector("#practice-scene").hidden, true, "Mode switch changes future lesson setup; current session remains in its selected mode");
click("#reveal");
assert.equal(document.querySelector("#jp").textContent, "コーヒーをお願いします。", "Model phrase should be correct");
assert.equal(document.querySelector("#answer").hidden, false, "Reveal should show the model answer");
click('[data-go="journey"]');
assert.ok(document.querySelector("#journey").classList.contains("active"), "Journey navigation should open map");
click('[data-go="lesson"]');
assert.ok(document.querySelector("#lesson").classList.contains("active"), "Selecting a lesson should open lesson list");
console.log("Living City smoke test passed: navigation, mode toggle, driving layout, and phrase reveal.");
dom.window.close();
