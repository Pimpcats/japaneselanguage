// Boots the pop-up book (living-city/) in jsdom and uses it the way a learner
// would: cover → book → a whole page (Meet + the four exercises) → side trip →
// journal → a drive. Runs with reduced motion and shrunken waits.
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
for (const f of ["../lessons.js", "../studio-preview/content-overrides.js", "living-city/data.js", "living-city/scenes.js", "living-city/app.js"]) html = inline(html, f);
assert.ok(!/<script src=/.test(html), "every script should be inlined for the test");

const played = [], spoken = [], scriptErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => { if (!/Not implemented/.test(e.message)) scriptErrors.push(e.message); });
const dom = new JSDOM(html, {
  url: "https://hanasou.test/living-city/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.HANASOU_BOOK_SPEED = 0.002;
    window.scrollTo = () => {};
    window.matchMedia = (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} });
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) });
    window.confirm = () => true;
    window.Audio = class { constructor(src) { this.src = src; played.push(src); } play() { setTimeout(() => this.onended && this.onended(), 2); return Promise.resolve(); } pause() {} };
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.speechSynthesis = { getVoices: () => [], cancel() {}, speak(u) { spoken.push({ text: u.text, lang: u.lang }); setTimeout(() => u.onend && u.onend(), 2); } };
    window.__media = {};
    Object.defineProperty(window.navigator, "mediaSession", { value: { setActionHandler: (a, fn) => { window.__media[a] = fn; }, metadata: null, playbackState: "none" } });
    window.MediaMetadata = class { constructor(o) { Object.assign(this, o); } };
  },
});
const { window } = dom;
const { document } = window;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const active = () => $(".screen.active").id;
const click = (selector) => { const el = $(selector); assert.ok(el, "Expected element " + selector); el.click(); };
const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const until = async (test, what) => { for (let i = 0; i < 400; i++) { if (test()) return; await tick(10); } assert.fail("Timed out waiting for " + what); };
const B = window.HanasouBook;
assert.ok(B, "app.js should expose window.HanasouBook");
const step = () => { const s = B.session(); return s ? s.queue[s.pos] : null; };

// ---- cover → the book
assert.equal(active(), "cover", "First visit opens on the cover");
click("#open-book");
assert.equal(active(), "home", "Opening the book shows the book");
assert.equal($$(".chapter-toc").length, 8, "Eight chapters (Levels 0–7)");
assert.equal($$("#toc [data-lesson]").length, 84, "Every lesson is in the contents");
assert.equal($$("#trips [data-trip]").length, 15, "All Speaking Studio conversations are side trips");
assert.ok($$("#toc [data-lesson]").every((b) => !b.disabled), "Nothing is locked");
assert.ok($("#continue-stage .popup .pop-guide img"), "The Continue card shows the page's pop-up with もち子");
assert.equal($$("img[src*='/people/']").length, 0, "もち子 is the only character");
assert.ok(!$("#ribbons").hidden, "The bottom nav shows on the book");
assert.equal(Object.keys(window.BOOK_SCENES).length, window.LESSONS.length, "Every lesson has an authored scene");
const canDo = window.LESSONS.find((l) => l.id === "can-do");
assert.ok(canDo.sentences.some((s) => s.jp === "にほんごが はなせます。"), "Studio language corrections load before the book");

// ---- a lesson page
$$("details").forEach((d) => (d.open = true));
click('#toc [data-lesson="cafe"]');
assert.equal(active(), "lesson");
assert.equal($$("#lesson-readings [data-mode]").length, 5, "Meet + four exercises");
const layers = [...$("#lesson-stage .pop-tilt").children].map((el) => (el.classList.contains("pop-world") ? "world" : el.classList.contains("pop-front") ? "front" : el.classList.contains("pop-guide") ? "guide" : el.classList.contains("pop-back") ? "back" : "")).filter(Boolean);
assert.deepEqual(layers, ["back", "world", "guide", "front"], "Postcard, world, もち子, front props — in that order");
assert.ok($("#dock #lesson-start"), "One action bar with the next step");
assert.ok($("#ribbons").hidden, "The action bar replaces the nav");

// ---- Meet: the flashcard values
click("#dock #lesson-start");
assert.equal(active(), "reading");
assert.equal(step().mode.id, "meet", "A new page starts with Meet");
const cafe = window.LESSONS.find((l) => l.id === "cafe");
assert.ok($$(".chips .wchip").length === cafe.sentences[0].words.length, "Every word is a chip");
const chip = $(".chips .wchip");
assert.ok(chip.querySelector("small").textContent.length > 0, "Each chip shows its meaning under the word");
assert.match(chip.className, /pos-(n|v|adj|adv|prt|cop|expr|aux|conj)/, "Chips are colour-coded by word role");
assert.match(chip.querySelector("a.wc-jisho").href, /^https:\/\/jisho\.org\/search\//, "Each chip links to Jisho");
assert.ok($$(".answer .jp .w").length > 0, "The sentence itself is colour-coded");
const before = played.length;
chip.querySelector(".wc-main").click();
await tick();
assert.ok(played.length > before, "Tapping a chip plays its word");
let coloured = 0, total = 0;
for (const l of window.LESSONS) for (const s of l.sentences) { total++; if (/class="w t-/.test(B.colorJP(s))) coloured++; }
assert.ok(coloured / total > 0.98, "Nearly every sentence is colour-coded (" + coloured + "/" + total + ")");

// ---- play the whole page: one continuous flow through all four exercises
const seen = new Set();
async function playPage() {
  for (let guard = 0; guard < 200; guard++) {
    if ($("#dock #finish-home")) return;
    const st = step();
    assert.ok(st, "A step is showing");
    if (st.type === "bridge") { click("#dock #bridge-next"); continue; }
    seen.add(st.mode.id);
    const item = st.item;
    if (item.kind === "meet") { click("#dock #meet-next"); continue; }
    if (item.kind === "recall" || item.kind === "reveal") {
      assert.equal($$(".answer").length, 0, "The answer is hidden until you've said it");
      click("#dock #reveal");
      assert.ok($(".answer .jp"), "Reveal shows the answer");
      click("#dock #grade-good");
      continue;
    }
    if (item.kind === "picture") {
      assert.equal($$("#reading-body .choice").length, 0, "Picture listening has no text choices");
      const picks = $$("#reading-stage [data-pick]");
      assert.equal(picks.length, 3, "Three pictures to choose from");
      const wrong = picks.find((b) => b.dataset.pick !== item.target);
      wrong.click();
      assert.ok(!$("#dock #listen-next"), "A wrong picture does not advance");
      picks.find((b) => b.dataset.pick === item.target).click();
      click("#dock #listen-next");
      continue;
    }
    if (item.kind === "meaning") {
      $$("[data-choice]").find((b) => b.dataset.choice === item.sentence.en).click();
      click("#dock #listen-next");
      continue;
    }
    if (item.kind === "pair") {
      for (const k of item.changed) {
        const opts = $$("[data-option]");
        assert.ok(opts.length >= 2, "A swap offers real alternatives");
        opts.find((o) => o.dataset.option === item.sentence.words[k].jp).click();
      }
      assert.ok($$("#swap-line .wchip.swapped").length === item.changed.length, "The swapped piece lands in the sentence");
      click("#dock #swap-next");
      continue;
    }
    if (item.kind === "build") {
      const want = item.sentence.words.map((w) => w.jp);
      for (const jp of want) $$("[data-piece]").find((b) => !b.disabled && item.sentence.words[Number(b.dataset.piece)].jp === jp).click();
      click("#dock #build-next");
      continue;
    }
    // a conversation turn
    assert.equal($$("#reading-body .choice").length, 0, "In the Moment has no multiple choice");
    click("#dock #reveal");
    assert.ok($(".answer .jp"), "A model reply appears after you've spoken");
    click("#dock #grade-good");
    if ($("#dock #turn-next")) click("#dock #turn-next");
  }
  assert.fail("The page never finished");
}
await playPage();
assert.deepEqual([...seen].sort(), ["listen", "meet", "moment", "patterns", "recall"], "One flow covers Meet and all four exercises");
assert.ok(["recall", "listen", "patterns", "moment"].every((m) => B.state.readings.cafe[m]), "All four exercises are recorded");
assert.ok(B.state.met.cafe, "Meet is recorded");
assert.ok($(".finish.big"), "Finishing the fourth exercise stamps the page");
assert.ok(B.state.cards["cafe#0"].reps >= 1, "Grades feed the review schedule");
const saved = JSON.parse(window.localStorage.getItem("hanasou.book.v1"));
assert.ok(saved.readings.cafe.recall, "Progress is saved in the book's own key");
assert.equal(window.localStorage.getItem("hanasou.v4"), null, "The main app's progress is never touched");
click("#dock #finish-home");
assert.equal(active(), "home");

// ---- content rules
const real = new Set(window.LESSONS.flatMap((l) => l.sentences.map((s) => s.jp)));
for (const l of B.order) {
  const pats = B.buildPatterns(l);
  assert.ok(pats.length > 0, "Every lesson has Pattern Lab pages (" + l.id + ")");
  for (const item of pats) if (item.kind === "pair") assert.ok(real.has(item.source.jp) && real.has(item.sentence.jp), "Pattern pairs never invent Japanese (" + l.id + ")");
  assert.ok(B.buildMoment(l), "Every lesson has a conversation (" + l.id + ")");
  for (const item of B.buildListen(l)) {
    if (item.kind === "picture") assert.ok(item.choices.some((c) => c.art === item.target) && item.choices.every((c) => !window.BOOK_ART_MISSING.includes(c.art)), "Picture choices are drawn art and include the answer");
    else assert.ok(item.choices.includes(item.sentence.en), "Meaning choices include the answer");
  }
}
click('#toc [data-lesson="l0-a"]');
assert.equal($$("#lesson-stage img[src*='/sea']").length, 0, "No random wave on the あいうえお page");
click("#lesson-back");

// ---- side trip
$("details.trips-wrap").open = true;
click('#trips [data-trip="taxi"]');
assert.equal(active(), "reading");
click("#dock #reveal");
click("#dock #grade-good");
assert.ok($("#dock #turn-next"), "A side trip answers back");
click("#reading-back");
assert.equal(active(), "home");

// ---- journal
click('[data-nav="journal"]');
assert.equal(active(), "journal");
assert.ok(Number($(".tallies b").textContent) > 0, "Journal counts real lines said");
assert.equal($$(".week .day").length, 7, "A forgiving week of dots, not a streak");
assert.ok(!/streak/i.test($("#journal").textContent), "No streak pressure");
assert.equal($$("#legend .wchip").length, 8, "The colour key is in the journal");

// ---- drive: one tap, then it keeps going
click('[data-nav="drive"]');
assert.equal(active(), "drive");
B.state.drivePos = B.order[0].id;
const plan = B.drivePlan();
assert.ok(plan.learned > 0, "Lines read in the book open the drive");
assert.ok(plan.queue.filter((x) => x.id).every((x) => B.state.cards[x.id] && B.state.cards[x.id].reps > 0), "The first block only uses lines you've learned");
const enSteps = B.driveSteps(plan.queue.find((x) => x.type === "recall"), "en");
assert.ok(enSteps[0].en && enSteps[1].gap && enSteps[2].jp, "English cue: meaning → a gap to say it → the answer");
const jpSteps = B.driveSteps(plan.queue.find((x) => x.type === "recall"), "jp");
assert.ok(jpSteps.every((s) => !s.en), "Japanese only: no English is spoken");
const newSteps = B.driveSteps({ type: "learn", sentence: B.order[0].sentences[0] }, "en");
assert.ok(newSteps[0].en && newSteps[1].jp && newSteps[2].gap, "A new line is introduced: its meaning, the Japanese, a gap to say it back");
assert.equal($('[data-cue="en"]').getAttribute("aria-pressed"), "true", "English cue is the default, and it's a visible choice");
const repsBefore = Object.fromEntries(plan.queue.filter((x) => x.id).map((x) => [x.id, B.state.cards[x.id].reps]));
spoken.length = 0; played.length = 0;
click("#drive-start");
assert.ok(B.drive() && B.drive().running, "The drive starts");
assert.ok($("#ribbons").hidden, "No nav to mis-tap while driving");
assert.equal($$(".drive-pads button").length, 3, "Three big pads: again, pause, knew it");
for (const a of ["play", "pause", "nexttrack", "previoustrack"]) assert.equal(typeof window.__media[a], "function", "Steering-wheel " + a + " is wired");
window.__media.pause();
assert.ok(B.drive().paused, "Steering-wheel pause pauses");
window.__media.play();
assert.ok(!B.drive().paused, "Steering-wheel play resumes");
const firstBlock = B.drive().block;
const firstId = B.drive().queue[0].id;
window.__media.nexttrack();
// the first block plays through, then the drive moves on to the car bookmark by itself
await until(() => B.drive() && B.drive().block !== firstBlock, "the drive to move on to the next block");
assert.equal(B.drive().block.lesson, B.order[0], "After your lines, it carries on from the car bookmark");
assert.ok(!B.drive().paused, "…and keeps playing without a tap");
assert.ok(spoken.some((u) => u.lang === "en-US"), "The cue is spoken in English");
assert.ok(played.some((src) => src.endsWith(".mp3") && src.startsWith("../audio/")), "Answers play the recorded Japanese clips");
assert.ok(played.some((src) => src.includes("sfx-chime")), "A chime between blocks");
assert.ok(window.navigator.mediaSession.metadata && /[ぁ-んァ-ン]/.test(window.navigator.mediaSession.metadata.title), "The car display shows the Japanese line");
assert.ok(Object.keys(repsBefore).every((id) => B.state.cards[id].reps > repsBefore[id]), "Every learned line driven is recorded for review");
assert.ok(B.state.cards[firstId].interval >= 24 * 60 * 60 * 1000, "Knew it on the wheel: the line comes back later");
// a whole lesson by ear moves the car bookmark on
const lessonBlock = B.drive().block;
await until(() => B.drive() && B.drive().block !== lessonBlock, "the lesson block to finish");
assert.equal(B.state.drivePos, B.order[1].id, "The car bookmark moves on, lesson after lesson");
assert.ok(B.drive().running && !B.drive().paused, "The drive keeps going");
click("#drive-stop");
assert.equal(B.drive(), null, "End stops the drive");
assert.equal(window.__media.play, null, "…and releases the steering-wheel buttons");
assert.ok($$(".review-line").length > 0, "After the drive: the lines you practised");
assert.ok($$(".review-line .flag").some((f) => f.textContent.includes("knew it")), "Knew it is remembered");
const hard = $$(".review-line").find((b) => !b.disabled && !b.classList.contains("hard"));
hard.click();
assert.ok(hard.classList.contains("hard"), "Tap a line after the drive to flag it hard");
click("#drive-done");
assert.equal(active(), "home");

// Japanese-only drive speaks no English
click('[data-nav="drive"]');
click('[data-cue="jp"]');
spoken.length = 0;
click("#drive-start");
const jpBlock = B.drive().block;
await until(() => B.drive() && B.drive().block !== jpBlock, "the Japanese-only block to finish");
assert.ok(!spoken.some((u) => u.lang === "en-US"), "Japanese only: no English voice");
click("#drive-stop");
click("#drive-done");

// /living-city/#drive is a home-screen shortcut: one tap from driving
const dom2 = new JSDOM(html, { url: "https://hanasou.test/living-city/#drive", runScripts: "dangerously", pretendToBeVisual: true, beforeParse(w) { w.HANASOU_BOOK_SPEED = 0.002; w.scrollTo = () => {}; w.matchMedia = (q) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }); w.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) }); } });
assert.equal(dom2.window.document.querySelector(".screen.active").id, "drive", "#drive skips the cover and opens the drive");
assert.ok(dom2.window.document.getElementById("drive-start"), "#drive is one tap from driving");
dom2.window.close();

await tick(40);
assert.deepEqual(scriptErrors, [], "No uncaught script errors");
console.log("Living City pop-up book smoke test passed: book, Meet + four exercises, flashcard chips, side trip, journal, drive.");
window.close();
