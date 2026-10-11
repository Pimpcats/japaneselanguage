import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const htmlPath = path.join(root, "living-city", "index.html");
const html = readFileSync(htmlPath, "utf8");
const app = readFileSync(path.join(root, "living-city", "app.js"), "utf8");
const withoutRemoteStyles = html.replace(/<link rel="stylesheet" href="styles\.css">/, "");
const runnableHtml = withoutRemoteStyles.replace('<script src="app.js"></script>', "<script>" + app + "</script>");
const dom = new JSDOM(runnableHtml, {
  url: "https://hanasou.test/living-city/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) { window.scrollTo = () => {}; }
});
const { document } = dom.window;
const click = (selector) => {
  const element = document.querySelector(selector);
  assert.ok(element, "Expected element " + selector);
  element.click();
};
assert.ok(document.querySelector("#home-view").classList.contains("active"), "Home should be the initial view");
click("#start-journey");
assert.ok(document.querySelector("#practice-view").classList.contains("active"), "Start journey should open practice");
click("#reveal-answer");
assert.equal(document.querySelector("#jp-text").textContent, "コーヒーをお願いします。", "The first model phrase should be correct");
assert.equal(document.querySelector("#jp-answer").hidden, false, "Revealing should show the model answer");
click("#next-question");
assert.equal(document.querySelector("#prompt-title").textContent, "Listen for the destination.", "Next should advance the practice sequence");
click('[data-view="explore"]');
assert.ok(document.querySelector("#explore-view").classList.contains("active"), "Explore navigation should open the map");
click('[data-mode="scene"]');
assert.ok(document.querySelector("#practice-view").classList.contains("active"), "Selecting a place should open its practice");
assert.equal(document.querySelector("#prompt-title").textContent, "The server asks what you'd like.", "Place selection should load the matching scenario");
console.log("Living City smoke test passed: navigation, speaking-first reveal, sequence, and scene selection.");
dom.window.close();
