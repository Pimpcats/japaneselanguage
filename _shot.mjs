import { chromium, devices } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(ROOT, p === "/" ? "/index.html" : p);
  fs.readFile(f, (e, buf) => {
    if (e) { res.writeHead(404); res.end("nf"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(8099, r));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ ...devices["iPhone 13 Pro"], isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.addInitScript(() => {
  // no service worker interference
  Object.defineProperty(navigator, "serviceWorker", { get: () => undefined });
});
await page.goto("http://localhost:8099/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const OUT = process.env.OUT || "/tmp/shots";
fs.mkdirSync(OUT, { recursive: true });

// Drive into a real lesson drill so a card is rendered behind the overlay,
// then ask the story module for the beat exactly as app.js does.
async function beat(lessonId, en, name) {
  await page.evaluate(([lessonId, en]) => {
    const S = window.HanasouStory;
    if (document.getElementById("story-break")) {
      const n = document.getElementById("story-break");
      n.hidden = true; n.classList.remove("open"); document.body.classList.remove("story-open");
    }
    S.onSession("lesson", lessonId, false);
    S.beforeCard({ mode: "lesson", lessonId, en, drive: false, build: false, warmup: false, lastGrade: null, words: [] });
  }, [lessonId, en]);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  // measure the stage vs its content
  const m = await page.evaluate(() => {
    const stage = document.querySelector("#story-break .story-stage");
    if (!stage) return null;
    const sr = stage.getBoundingClientRect();
    const kids = [...stage.querySelectorAll(".count-row, .story-scene")].map((n) => {
      const r = n.getBoundingClientRect();
      return { cls: n.className, w: Math.round(r.width), h: Math.round(r.height), sw: n.scrollWidth, sh: n.scrollHeight };
    });
    const objs = [...stage.querySelectorAll(".count-slot, .story-obj, .scene-zone")].map((n) => {
      const r = n.getBoundingClientRect();
      return { cls: n.className.slice(0, 46), top: Math.round(r.top - sr.top), bottom: Math.round(r.bottom - sr.top), left: Math.round(r.left - sr.left), right: Math.round(r.right - sr.left), h: Math.round(r.height) };
    });
    return { stage: { w: Math.round(sr.width), h: Math.round(sr.height) }, kids, objs };
  });
  console.log("\n==", name, JSON.stringify(m, null, 1));
}

await beat("frequency", "I often watch TV.", "tv");
await beat("counters", "Three waters, please.", "water3");
await beat("counters", "Five, please.", "sushi5");
await beat("counters", "All of it, please.", "sushi10");
await beat("coming-going", "I'm going home.", "walkhome");
await beat("activities", "I study at home.", "study");

await browser.close();
server.close();
console.log("done");
