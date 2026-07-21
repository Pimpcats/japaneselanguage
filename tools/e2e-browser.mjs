// Browser end-to-end suite for the interactive story layer (48+ assertions).
// Not run in CI (needs Playwright + Chromium). Run locally / in a sandbox:
//   npm i --no-save playwright jsdom     (install together — they evict each other)
//   python3 -m http.server 8099 &        (repo root)
//   node tools/e2e-browser.mjs
// Chromium path below matches the Claude sandbox; adjust locally if needed.
import pkg from "/home/user/japaneselanguage/node_modules/playwright/index.js"; const { chromium } = pkg;
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:8099/index.html";
const SHOTS = "/tmp/claude-0/-home-user-japaneselanguage/279409ab-7b5b-5f7d-8014-27841f52e36e/scratchpad/shots";
mkdirSync(SHOTS, { recursive: true });

const results = [];
const ok = (name, cond) => { results.push([cond ? "PASS" : "FAIL", name]); console.log(cond ? "PASS" : "FAIL", name); };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

async function boot() {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".level-stop, .level-card", { timeout: 10000 });
}
async function openLesson(id, level) {
  await page.locator(".level-stop", { hasText: level || "Foundations" }).first().click();
  await page.waitForSelector('.lesson-card[data-lesson="' + id + '"]', { timeout: 8000 });
  await page.locator('.lesson-card[data-lesson="' + id + '"]').click();
  await page.waitForTimeout(400);
  if (await page.evaluate(() => document.getElementById("drill").hidden)) {
    await page.locator('.lesson-card[data-lesson="' + id + '"]').click();   // soft daily pace: tap again
  }
  await page.waitForSelector("#drill:not([hidden])", { timeout: 8000 });
}

const overlayOpen = () => page.evaluate(() => { const s = document.getElementById("story-break"); return !!s && !s.hidden; });
const beatType = () => page.evaluate(() => { const s = document.getElementById("story-break"); return s ? s.className : ""; });
const pointTarget = () => page.evaluate(() => document.getElementById("story-break").dataset.target || "");
const prompt = () => page.evaluate(() => (document.getElementById("prompt-en").textContent || "").trim());
const isDone = () => page.evaluate(() => !document.getElementById("lesson-done").hidden);
const storyState = () => page.evaluate(() => window.HanasouStory.getState());
const answerJp = () => page.evaluate(() => { const a = document.querySelector(".story-answer .story-line-jp"); return a ? a.textContent : ""; });
const continueHidden = () => page.evaluate(() => document.querySelector(".story-continue").hidden);
const clickContinue = async () => { await page.locator(".story-continue").click(); await page.waitForTimeout(150); };

async function reveal() { await page.evaluate(() => document.getElementById("card").click()); await page.waitForFunction(() => !document.getElementById("grade").hidden, { timeout: 4000 }); }
async function gradeGot() { await page.evaluate(() => document.querySelector('button.grade[data-grade="2"]').click()); await page.waitForTimeout(150); }

async function run() {
  await boot();
  ok("app boots with story module", await page.evaluate(() => typeof window.HanasouStory === "object"));

  // ===== THIS-THAT: the room =====
  await openLesson("this-that");
  let sawClaim = false, sawPlace = false, sawIdentify = false;
  const sawPoint = {}, askAnswers = [];

  for (let step = 0; step < 90; step++) {
    if (await overlayOpen()) {
      const cls = await beatType();
      if (cls.includes("story-claim")) {
        sawClaim = true;
        await page.screenshot({ path: SHOTS + "/1-book-selection.png" });
        await page.locator(".story-choice").first().click();
        await page.waitForSelector(".story-continue:not([hidden])");
        await clickContinue();
        ok("claim chains into place (one scene)", (await beatType()).includes("story-place"));
      } else if (cls.includes("story-place")) {
        sawPlace = true;
        await page.locator('.story-slot[data-slot="2"]').click();
        await page.waitForSelector(".story-continue:not([hidden])");
        ok("tap placement saves slot", (await storyState()).inventory.book.slot === 2);
        await clickContinue();
      } else if (cls.includes("story-ask")) {
        if (askAnswers.length === 0) await page.screenshot({ path: SHOTS + "/6-ask-mystery.png" });
        await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click());
        await page.waitForSelector(".story-continue:not([hidden])");
        askAnswers.push(await answerJp());
        if (askAnswers.length === 1) await page.screenshot({ path: SHOTS + "/6-ask-mystery-tapped.png" });
        await clickContinue();
      } else if (cls.includes("story-point")) {
        const target = await pointTarget();
        sawPoint[target] = true;
        await page.waitForTimeout(180);   // let the scale system settle
        await page.screenshot({ path: SHOTS + "/5-point-" + target + ".png" });
        const zones = await page.evaluate(() => [...document.querySelectorAll(".story-obj[data-zone]")].map((n) => n.dataset.zone));
        const wrongZone = zones.find((z) => z !== target);
        await page.locator(`.story-obj[data-zone="${wrongZone}"]`).click({ force: true });
        await page.waitForTimeout(250);
        const fb = await page.evaluate(() => document.querySelector(".story-feedback").textContent);
        ok("point(" + target + "): wrong zone teaches the zone word", /これ|それ|あれ/.test(fb));
        ok("point(" + target + "): wrong zone does not advance", await continueHidden());
        await page.locator(`.story-obj[data-zone="${target}"]`).click({ force: true });
        await page.waitForSelector(".story-continue:not([hidden])");
        const ans = await answerJp();
        const expected = target === "partner" ? "それは かばんです" : "あれは わたしの かばんです";
        ok("point(" + target + "): tied answer attached (" + expected + ")", ans.includes(expected));
        await page.screenshot({ path: SHOTS + "/5-point-" + target + "-correct.png" });
        await clickContinue();
      } else if (cls.includes("story-identify")) {
        sawIdentify = true;
        ok("identify appears before its card", (await prompt()) === "This is my book.");
        const chosen = (await storyState()).inventory.book.design;
        await page.locator(`.story-identify-choice:not([data-design="${chosen}"])`).first().click();
        await page.waitForTimeout(250);
        ok("identify: wrong choice does not advance", (await overlayOpen()) && await continueHidden());
        await page.locator(`.story-identify-choice[data-design="${chosen}"]`).click();
        await page.waitForSelector(".story-continue:not([hidden])");
        ok("identify: tied answer attached (これは わたしの ほんです)", (await answerJp()).includes("これは わたしの ほんです"));
        await clickContinue();
        await page.waitForTimeout(150);
        ok("normal card appears after identify", !(await overlayOpen()) && (await prompt()) === "This is my book." && await page.evaluate(() => !document.getElementById("card").hidden));
        await reveal();
        ok("word breakdown chips render on the card", await page.evaluate(() => document.querySelectorAll("#word-breakdown .word-chip").length > 0));
        await gradeGot();
      }
      continue;
    }
    if (await isDone()) { ok("this-that lesson reaches completion", true); break; }
    await reveal();
    await gradeGot();
  }
  ok("claim beat shown", sawClaim);
  ok("place beat shown", sawPlace);
  ok("point-それ and point-あれ beats shown", !!sawPoint.partner && !!sawPoint.far);
  ok("identify beat shown", sawIdentify);
  ok("both ask beats shown with tied questions",
    askAnswers.length === 2 && askAnswers.some((a) => a.includes("これは なんですか")) && askAnswers.some((a) => a.includes("それは ほんですか")));

  // ===== SHOP: the counter =====
  await page.evaluate(() => { if (window.__hanaGoHome) window.__hanaGoHome(); });
  await page.waitForSelector(".level-stop", { timeout: 8000 });
  await openLesson("shop");
  let shopAsk = false, orderWrongTaught = false, orderAnswers = [];
  for (let step = 0; step < 90; step++) {
    if (await overlayOpen()) {
      const cls = await beatType();
      if (cls.includes("story-ask")) {
        shopAsk = true;
        await page.screenshot({ path: SHOTS + "/7-shop-tag.png" });
        await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click());
        await page.waitForSelector(".story-continue:not([hidden])");
        ok("shop tag → これは いくらですか attached", (await answerJp()).includes("これは いくらですか"));
        await clickContinue();
      } else if (cls.includes("story-order")) {
        const target = await pointTarget();   // "water" | "coffee" | "free"
        if (target !== "free") {
          const wrongKind = target === "water" ? "coffee" : "water";
          await page.locator(`.story-obj[data-object="${wrongKind}"]`).click({ force: true });
          await page.waitForTimeout(250);
          const fb = await page.evaluate(() => document.querySelector(".story-feedback").textContent);
          if (/みず|コーヒー|おちゃ/.test(fb) && await continueHidden()) orderWrongTaught = true;
          await page.locator(`.story-obj[data-object="${target}"]`).click({ force: true });
        } else {
          await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click());
        }
        await page.waitForSelector(".story-continue:not([hidden])");
        orderAnswers.push(await answerJp());
        await page.screenshot({ path: SHOTS + "/8-shop-order-" + target + ".png" });
        await clickContinue();
      }
      continue;
    }
    if (await isDone()) { ok("shop lesson reaches completion", true); break; }
    await reveal();
    await gradeGot();
  }
  ok("shop ask beat shown", shopAsk);
  ok("order wrong item teaches the object word", orderWrongTaught);
  ok("order answers tied (みずを ください / コーヒーを ください / これを ください)",
    orderAnswers.some((a) => a.includes("みずを ください")) &&
    orderAnswers.some((a) => a.includes("コーヒーを ください")) &&
    orderAnswers.some((a) => a.includes("これを ください")));

  // ===== WHERE IS IT: the street (ここ・そこ・あそこ) =====
  await page.evaluate(() => { if (window.__hanaGoHome) window.__hanaGoHome(); });
  await page.waitForSelector(".level-stop", { timeout: 8000 });
  await openLesson("where");
  const whereAnswers = [];
  let placeWordTaught = false, askBlockSeen = false, whereShot = 0;
  for (let step = 0; step < 90; step++) {
    if (await overlayOpen()) {
      const cls = await beatType();
      if (cls.includes("story-ask")) {
        if (whereShot === 0) { await page.screenshot({ path: SHOTS + "/9-street-ask.png" }); whereShot++; }
        await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click());
        await page.waitForSelector(".story-continue:not([hidden])");
        whereAnswers.push(await answerJp());
        await clickContinue();
      } else if (cls.includes("story-point")) {
        const target = await pointTarget();
        if (whereShot === 1) { await page.screenshot({ path: SHOTS + "/9-street-scene.png" }); whereShot++; }
        await page.waitForTimeout(180);   // let the scale system settle
        if (await page.evaluate(() => !!document.querySelector(".story-panel > .story-ask"))) askBlockSeen = true;
        const zones2 = await page.evaluate(() => [...document.querySelectorAll(".story-obj[data-zone]")].map((n) => n.dataset.zone));
        const wrongZone = zones2.find((z) => z !== target);
        if (wrongZone) {
          await page.locator(`.story-obj[data-zone="${wrongZone}"]`).click({ force: true });
          await page.waitForTimeout(250);
          const fb = await page.evaluate(() => document.querySelector(".story-feedback").textContent);
          if (/ここ|そこ|あそこ/.test(fb) && await continueHidden()) placeWordTaught = true;
        }
        await page.locator(`.story-obj[data-zone="${target}"]`).click({ force: true });
        await page.waitForSelector(".story-continue:not([hidden])");
        whereAnswers.push(await answerJp());
        if (whereShot === 2) { await page.screenshot({ path: SHOTS + "/9-street-correct.png" }); whereShot++; }
        await clickContinue();
      }
      continue;
    }
    if (await isDone()) { ok("where lesson reaches completion", true); break; }
    await reveal();
    await gradeGot();
  }
  ok("street ask → トイレは どこですか attached", whereAnswers.some((a) => a.includes("トイレは どこですか")));
  ok("street points tie place answers (あそこです / えきは ここです / ここに あります / ともだちは あそこに います)",
    whereAnswers.some((a) => a.includes("あそこです")) &&
    whereAnswers.some((a) => a.includes("えきは ここです")) &&
    whereAnswers.some((a) => a.includes("ここに あります")) &&
    whereAnswers.some((a) => a.includes("ともだちは あそこに います")));
  ok("wrong taps teach ここ/そこ/あそこ", placeWordTaught);
  ok("Q→A beat shows もち子's question block", askBlockSeen);


  // ===== GENERIC CRAWLER: the 9 newly authored lessons =====
  async function handleBeatGeneric() {
    const cls = await beatType();
    await page.waitForTimeout(180);   // let the scale system settle before clicking
    if (cls.includes("story-info")) {   // a teaching panel — just advance it
      await page.waitForSelector(".story-continue:not([hidden])", { timeout: 5000 });
      await clickContinue();
      return "(info)";
    }
    // in-page clicks bypass Playwright actionability, which fights the dynamic
    // scale system (elements briefly resize as scaleScene settles)
    const tap = (sel) => page.evaluate((s) => { const n = document.querySelector(s); if (n) n.click(); return !!n; }, sel);
    if (cls.includes("story-pick")) {
      const t = await pointTarget();
      await tap(`.story-obj[data-mod="${t}"]`);
    } else if (cls.includes("story-point")) {
      const t = await pointTarget();
      await tap(`.story-obj[data-zone="${t}"]`);
    } else if (cls.includes("story-order")) {
      const t = await pointTarget();
      if (t !== "free" && t !== "multi") await tap(`.story-obj[data-object="${t}"]`);
      else for (let i = 0; i < 8; i++) {
        if (!(await continueHidden())) break;
        const n = await page.evaluate(() => document.querySelectorAll(".story-obj:not([disabled])").length);
        if (!n) break;
        await page.evaluate((k) => document.querySelectorAll(".story-obj:not([disabled])")[k % document.querySelectorAll(".story-obj:not([disabled])").length].click(), i);
        await page.waitForTimeout(200);
      }
    } else if (cls.includes("story-count")) {
      for (let i = 0; i < 12; i++) {
        if (!(await continueHidden())) break;
        const n = await page.evaluate(() => document.querySelectorAll(".count-slot:not(.counted)").length);
        if (!n) break;
        await page.evaluate(() => document.querySelector(".count-slot:not(.counted)").click());
        await page.waitForTimeout(110);
      }
    } else if (cls.includes("story-coins")) {
      for (let i = 0; i < 4; i++) {
        if (!(await continueHidden())) break;
        const btns = page.locator(".story-coin-stack:not([disabled])");
        const n = await btns.count(); if (!n) break;
        await btns.nth(i % n).click(); await page.waitForTimeout(200);
      }
    } else if (cls.includes("story-numberTap") || cls.includes("story-sounds")) {
      const n = await page.locator(".story-num").count();
      for (let i = 0; i < n; i++) { await page.locator(".story-num").nth(i).click(); await page.waitForTimeout(150); }
    } else if (cls.includes("story-build")) {
      const order = await page.evaluate(() => [...document.querySelectorAll(".story-bchip")].map((c) => Number(c.dataset.pos)).sort((a, b) => a - b));
      for (const pos of order) {
        await page.locator('.story-bchip[data-pos="' + pos + '"]').click();
        await page.waitForTimeout(150);
      }
    } else if (cls.includes("story-ask")) {
      await tap(".story-obj");
    } else if (cls.includes("story-claim")) {
      await page.locator(".story-choice").first().click();
    } else if (cls.includes("story-place")) {
      await page.locator('.story-slot[data-slot="1"]').click();
    } else if (cls.includes("story-identify")) {
      const chosen = (await storyState()).inventory.book.design;
      await page.locator(`.story-identify-choice[data-design="${chosen}"]`).click();
    }
    await page.waitForSelector(".story-continue:not([hidden])", { timeout: 5000 });
    const ans = (await answerJp()) || "(no answer block)";
    await clickContinue();
    return ans;
  }

  const NEW_LESSONS = [
    ["counters", 6, "Foundations"], ["cafe", 3, "Foundations"], ["money", 4, "Foundations"],
    ["object", 3, "Foundations"], ["likes", 2, "Foundations"], ["wants", 1, "Foundations"],
    ["adj-noun", 2, "Foundations"], ["numbers", 2, "Foundations"], ["te-please", 1, "Connecting"],
  ];
  for (const [id, expected, level] of NEW_LESSONS) {
    await page.evaluate(() => { if (window.__hanaGoHome) window.__hanaGoHome(); });
    await page.waitForSelector(".level-stop", { timeout: 8000 });
    await openLesson(id, level);
    let fired = 0; let allTied = true;
    let shot = false;
    for (let step = 0; step < 90; step++) {
      if (await overlayOpen()) {
        if (id === "counters" && !shot) { await page.screenshot({ path: SHOTS + "/10-" + id + ".png" }); shot = true; }
        if (id === "adj-noun" && !shot) { await page.screenshot({ path: SHOTS + "/10-" + id + ".png" }); shot = true; }
        const ans = await handleBeatGeneric();
        if (ans === "(info)") continue;   // teaching panels don't count as tied beats
        fired += 1;
        if (!ans || ans === "(no answer block)") allTied = false;
        continue;
      }
      if (await isDone()) break;
      await reveal(); await gradeGot();
    }
    ok(id + ": " + expected + " beats fired, all with tied sentences", fired === expected && allTied);
  }

  // ===== DRIVE MODE: scenes must not appear =====
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("hanasou.settings") || "{}");
    st.driveMode = true;
    localStorage.setItem("hanasou.settings", JSON.stringify(st));
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".level-stop");
  await openLesson("this-that");
  await page.waitForTimeout(500);
  ok("drive mode ON: no scene on first card, plain flashcard shows",
    !(await overlayOpen()) && await page.evaluate(() => !document.getElementById("card").hidden));
  await reveal(); await gradeGot();
  await page.waitForTimeout(400);
  ok("drive mode ON: no scene after grading either", !(await overlayOpen()));
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("hanasou.settings") || "{}");
    st.driveMode = false;
    localStorage.setItem("hanasou.settings", JSON.stringify(st));
  });

  // ===== persistence / replay / guards =====
  await page.goto(BASE, { waitUntil: "networkidle" });
  const before = await storyState();
  await page.reload({ waitUntil: "networkidle" });
  const after = await page.evaluate(() => window.HanasouStory.getState());
  ok("story persists across reload", after.inventory.book && after.inventory.book.design === before.inventory.book.design);

  await page.waitForSelector(".level-stop, .level-card", { timeout: 8000 });
  await openLesson("this-that");
  let claimRepeated = false, placeReplayed = false, pointReplayed = false;
  for (let step = 0; step < 90; step++) {
    if (await overlayOpen()) {
      const cls = await beatType();
      if (cls.includes("story-claim")) { claimRepeated = true; await page.locator(".story-choice").first().click(); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-place")) { placeReplayed = true; await page.locator('.story-slot[data-slot="0"]').click(); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-ask")) { await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click()); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-point")) { pointReplayed = true; const t = await pointTarget(); await page.locator(`.story-obj[data-zone="${t}"]`).click({ force: true }); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-identify")) { const chosen = (await storyState()).inventory.book.design; await page.locator(`.story-identify-choice[data-design="${chosen}"]`).click(); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
    }
    if (await isDone()) break;
    await reveal(); await gradeGot();
  }
  ok("claim does NOT repeat on restart (once)", !claimRepeated);
  ok("placement replays on restart (resolver)", placeReplayed);
  ok("point beats replay on restart", pointReplayed);

  // drag placement (fresh story): ask → claim → chained place → drag to slot 1
  await page.evaluate(() => localStorage.removeItem("hanasou.story.v1"));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".level-stop");
  await openLesson("this-that");
  let dragOk = false;
  for (let step = 0; step < 90; step++) {
    if (await overlayOpen()) {
      const cls = await beatType();
      if (cls.includes("story-ask")) { await page.waitForTimeout(160); await page.evaluate(() => document.querySelector(".story-obj").click()); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-claim")) { await page.locator(".story-choice").first().click(); await page.waitForSelector(".story-continue:not([hidden])"); await clickContinue(); continue; }
      if (cls.includes("story-place")) {
        const piece = page.locator(".story-place-piece");
        const slot = page.locator('.story-slot[data-slot="1"]');
        const pb = await piece.boundingBox(); const sb = await slot.boundingBox();
        await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
        await page.mouse.down();
        await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        dragOk = (await page.evaluate(() => window.HanasouStory.getState().inventory.book.slot)) === 1;
        break;
      }
    } else {
      if (await isDone()) break;
      await reveal(); await gradeGot();
    }
  }
  ok("drag placement works (pointer drag)", dragOk);

  // guards: review mode and other-lesson warmup rides never trigger beats
  await page.evaluate(() => localStorage.removeItem("hanasou.story.v1"));
  const guards = await page.evaluate(() => {
    const base = { en: "This is a book.", jp: "これは ほんです。", lessonId: "this-that", mode: "lesson", build: false };
    const review = window.HanasouStory.afterGrade({ ...base, mode: "review" }, () => {}) === false;
    const otherLesson = window.HanasouStory.afterGrade({ ...base, lessonId: "shop" }, () => {}) === false;
    const beforeOther = window.HanasouStory.beforeCard({ ...base, en: "Water, please.", lessonId: "this-that" }) === false;
    return review && otherLesson && beforeOther;
  });
  ok("beats never fire in review or outside their home lesson", guards);

  ok("no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

  console.log("\n===== RESULTS =====");
  for (const [s, n] of results) console.log(s, "-", n);
  const failed = results.filter((r) => r[0] === "FAIL").length;
  console.log("\n" + (failed ? failed + " FAILED" : "ALL PASSED"));
  await browser.close();
  process.exit(failed ? 1 : 0);
}
run().catch(async (e) => { console.log("ERROR", e.message); try { await page.screenshot({ path: SHOTS + "/error.png" }); } catch {} await browser.close(); process.exit(2); });
