// Boots the pop-up book (living-city/) in jsdom and reads through it: cover →
// contents → a chapter → all four readings → a side trip → journal → driving
// mode. Runs with reduced motion so page turns are instant.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(read("audio/manifest.json"));
// scripts may carry a ?v= cache-buster (the root service worker caches /living-city/ too)
const inline = (src, file) => src.replace(new RegExp('<script src="' + file.replace(/^living-city\//, "").replace(/\./g, "\\.") + '(\\?v=[^"]*)?"></script>'), () => "<script>" + read(file.replace(/^\.\.\//, "")) + "</script>");
let html = read("living-city/index.html").replace(/<link[^>]+>/g, "");
for (const f of ["../lessons.js", "../studio-preview/content-overrides.js", "living-city/data.js", "living-city/app.js"]) html = inline(html, f);
assert.ok(!/<script src=/.test(html), "every script should be inlined for the test");

const played = [];
const scriptErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => { if (!/Not implemented/.test(e.message)) scriptErrors.push(e.message); });
const dom = new JSDOM(html, {
  virtualConsole,
  url: "https://hanasou.test/living-city/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.scrollTo = () => {};
    window.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) });
    window.confirm = () => true;
    window.Audio = class { constructor(src) { this.src = src; played.push(src); } play() { setTimeout(() => this.onended && this.onended(), 5); return Promise.resolve(); } pause() {} };
  },
});
const { window } = dom;
const { document } = window;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const active = () => $(".screen.active").id;
const click = (selector) => { const el = $(selector); assert.ok(el, "Expected element " + selector); el.click(); };
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const B = window.HanasouBook;
assert.ok(B, "app.js should expose window.HanasouBook");

// ---- cover → contents
assert.equal(active(), "cover", "First visit opens on the cover");
click("#open-book");
assert.equal(active(), "contents", "Opening the book shows the contents");
assert.equal($$(".chapter-toc").length, 8, "Eight chapters (Levels 0–7)");
assert.equal($$("#toc [data-lesson]").length, 84, "Every lesson is in the contents");
assert.equal($$("#trips [data-trip]").length, 15, "All Speaking Studio conversations are side trips");
assert.ok($$("#toc [data-lesson]").every((b) => !b.disabled), "Nothing is locked");

// ---- content overrides from the Speaking Studio are applied
const canDo = window.LESSONS.find((l) => l.id === "can-do");
assert.ok(canDo.sentences.some((s) => s.jp === "にほんごが はなせます。"), "Studio language corrections load before the book");

// ---- bookmark → chapter opener
click("#bookmark-open");
assert.equal(active(), "chapter", "The bookmark opens its chapter page");
assert.equal($$("#chapter-readings [data-mode]").length, 4, "Four readings per chapter");
assert.ok($("#chapter-stage .popup .pop-back"), "The chapter opens on a pop-up scene");
assert.ok($("#chapter-stage .pop-you img") && $("#chapter-stage .pop-guide img"), "Every scene has you and もち子 in it");
// the layers sit in a fixed back-to-front order so nothing swaps while rising
const layerOrder = [...$("#chapter-stage .pop-tilt").children].map((el) => el.className.split(" ").find((c) => /^pop-(back|floor|row|you|guide|bubble)$/.test(c)) + (el.classList.contains("pop-world") ? ":world" : el.classList.contains("pop-front") ? ":front" : ""));
assert.deepEqual(layerOrder.filter((x) => !/floor|bubble/.test(x)), ["pop-back", "pop-row:world", "pop-you", "pop-guide", "pop-row:front"], "Postcard, world, characters, front props — in that order");

// the back row: the lesson's world
const worldOf = () => $$("#reading-stage .pop-world img").map((im) => im.getAttribute("src")).join("|");
// ---- reading 1: Recall (first lesson)
const first = B.order[0];
click('#chapter-readings [data-mode="recall"]');
assert.equal(active(), "reading");
assert.equal($(".prompt").textContent, first.sentences[0].en, "Recall shows the English prompt");
click("#pull-tab");
assert.equal($("#slip .jp").textContent, first.sentences[0].jp, "The pull-tab reveals the model Japanese");
for (let i = 0; i < first.sentences.length; i++) {
  if (!$(".finish")) {
    const back = worldOf().split("|").filter(Boolean);
    const frontSrc = $$("#reading-stage .pop-front img").map((im) => im.getAttribute("src"));
    assert.ok(frontSrc.every((f) => !back.includes(f)), "A prop the page is about steps forward instead of appearing twice");
  }
  if ($("#pull-tab") && !$("#pull-tab").classList.contains("pulled")) click("#pull-tab");
  click('[data-grade="good"]');
  await tick(5);
}
assert.ok($(".finish"), "Finishing every page ends the reading");
assert.ok(B.state.readings[first.id].recall, "Recall is recorded for the lesson");
assert.equal(B.state.cards[first.id + "#0"].reps, 1, "Grades feed the SRS");
const saved = JSON.parse(window.localStorage.getItem("hanasou.book.v1"));
assert.ok(saved.readings[first.id].recall, "Progress is saved in the book's own key");
assert.equal(window.localStorage.getItem("hanasou.v4"), null, "The main app's progress is never touched");

// ---- reading 2: Listen & Notice
click("#finish-next");
assert.equal(active(), "reading");
const listenItem = B.session().items[0];
assert.equal($$("#reading-stage .pop-front .pop-cut").length, 0, "Listen hides this page's props until you answer");
assert.ok(!/-(drink|eat|read|study|wake|walk)\.png/.test($("#reading-stage .pop-you img").getAttribute("src")), "Listen hides your action until you answer");
const correct = $$("[data-choice]").find((b) => b.dataset.choice === listenItem.sentence.en);
assert.ok(correct && $$("[data-choice]").length === 4, "Listen offers four meanings including the right one");
correct.click();
assert.ok($("#feedback").classList.contains("good"), "Picking what you heard is marked right");
click("#reading-back");
assert.equal(active(), "chapter");

// ---- reading 3: Pattern Lab pairs only real sentences
const cafe = window.LESSONS.find((l) => l.id === "cafe");
const pairs = B.patternPairs(cafe);
assert.ok(pairs.length > 0, "Café has swappable sentence pairs");
const real = new Set(window.LESSONS.flatMap((l) => l.sentences.map((s) => s.jp)));
for (const l of B.order) for (const item of B.buildPatterns(l)) {
  if (item.kind === "pair") assert.ok(real.has(item.source.jp) && real.has(item.sentence.jp), "Pattern pairs never invent Japanese (" + l.id + ")");
}
assert.ok(B.order.every((l) => B.buildPatterns(l).length > 0), "Every lesson has Pattern Lab pages");
$$("details").forEach((d) => (d.open = true));
click("#chapter-back");
click('#toc [data-lesson="cafe"]');
click('#chapter-readings [data-mode="patterns"]');
assert.ok($(".source-card .jp"), "Pattern Lab starts from a sentence you already know");
click("#pull-tab");
assert.ok($("#slip .jp").textContent.length > 0, "Pattern Lab reveals the changed sentence");
click('[data-grade="hard"]');
click("#reading-back");

// ---- reading 4: In the Moment uses the lesson's hand-written scene
assert.ok(B.order.every((l) => B.buildMoment(l)), "Every lesson has an In the Moment conversation");
click('#chapter-readings [data-mode="moment"]');
const convo = B.session().convo;
assert.ok(!convo.trip && convo.turns.length > 0, "Café's moment is its hand-written scene");
for (let t = 0; t < convo.turns.length; t++) {
  click("#show-choices");
  const turn = B.session().items[B.session().index];
  const wrongIndex = turn.choices.findIndex((c) => !c.correct);
  if (wrongIndex >= 0) {
    click('[data-pick="' + wrongIndex + '"]');
    assert.ok($("#feedback").classList.contains("again"), "A reply that doesn't fit asks you to try again");
    assert.ok($("#turn-next") === null, "A wrong reply does not advance");
  }
  click('[data-pick="' + turn.choices.findIndex((c) => c.correct) + '"]');
  assert.ok($("#feedback").classList.contains("good"));
  click("#turn-next");
}
assert.ok($(".finish"), "Finishing the scene ends the reading");
assert.ok(B.state.readings.cafe.moment, "The moment is recorded");
click("#finish-back");
assert.equal(active(), "chapter");

// ---- side trip (Speaking Studio conversation with authored replies)
click("#chapter-back");
click('#trips [data-trip="taxi"]');
assert.ok(B.session().convo.trip, "Side trips run the Studio's branching conversations");
click("#show-choices");
assert.equal($$("#turn-choices [data-pick]").length, 2);
click("#reading-back");
assert.equal(active(), "contents");

// ---- tapping a cut-out says its word
click('[data-nav="contents"]');
click('#toc [data-lesson="cafe"]');
const cut = $("#chapter-stage .pop-row button.pop-cut[data-say]");
assert.ok(cut, "Cut-outs that stand for a word are tappable");
const before = played.length;
cut.click();
await tick(20);
assert.ok(played.length > before, "Tapping a cut-out plays its word");
click("#chapter-back");

// ---- journal
click('[data-nav="journal"]');
assert.equal(active(), "journal");
assert.ok(Number($(".tallies b").textContent) > 0, "Journal counts real lines said");
assert.equal($$(".week .day").length, 7, "A forgiving week of dots, not a streak");
assert.ok(!/streak/i.test($("#journal").textContent), "No streak pressure");

// ---- driving mode: Japanese audio only
click('[data-nav="contents"]');
click("#drive-toggle");
assert.equal($("#drive-toggle").getAttribute("aria-pressed"), "true", "Driving mode turns on");
click("#bookmark-open");
assert.equal(active(), "reading", "In driving mode the bookmark plays the page");
assert.ok($(".drive-panel"), "Driving mode shows the hands-free panel");
const list = B.drivePlaylist();
assert.ok(list.length > 0, "Driving mode builds a playlist");
assert.ok(list.filter((x) => x.jp).every((x) => /[ぁ-んァ-ン一-龯]/.test(x.jp)), "Driving mode only ever speaks Japanese");
await tick(60);
assert.ok(played.some((src) => /\.\.\/audio\/.+\.mp3$/.test(src)), "Driving mode plays the recorded VOICEVOX clips");
click("#drive-stop");
click("#drive-toggle");
assert.equal($("#drive-toggle").getAttribute("aria-pressed"), "false", "Driving mode turns off");

await tick(40);
assert.deepEqual(scriptErrors, [], "No uncaught script errors");
console.log("Living City pop-up book smoke test passed: cover, contents, all four readings, side trip, journal, driving mode.");
window.close();
