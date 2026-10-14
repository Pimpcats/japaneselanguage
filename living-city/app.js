// Hanasou — The Pop-up Book.
//
// Every lesson in ../lessons.js is a chapter, and every chapter is read four
// ways (the four readings): Recall · Listen & Notice · Pattern Lab · In the
// Moment. The engine underneath is the Speaking Studio's: real VOICEVOX clips
// from ../audio, a light SRS, and branching conversations — but the content is
// the real curriculum (sentences, the 73 hand-written scenes) and Pattern Lab
// only ever pairs two sentences that already exist, so it never invents
// Japanese. Nothing is locked. Progress lives in its own localStorage key and
// never touches the main app.
(function () {
  "use strict";

  const STORE = "hanasou.book.v1";
  const D = window.BOOK_DATA || {};
  const LEVELS = Array.isArray(window.LEVELS) ? window.LEVELS : [];
  const LESSONS = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const SCENES = Array.isArray(window.SCENES) ? window.SCENES : [];
  const STORY = "../assets/story/";
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (items) => { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad = (n) => String(n).padStart(2, "0");

  const MODES = [
    { id: "recall", no: 1, name: "Recall", verb: "Say it yourself", color: "red", hint: "Say it out loud first — then pull the tab." },
    { id: "listen", no: 2, name: "Listen & Notice", verb: "Catch the meaning", color: "teal", hint: "Listen without reading, then pick what you heard." },
    { id: "patterns", no: 3, name: "Pattern Lab", verb: "Make it your own", color: "gold", hint: "Change one piece of a sentence you know." },
    { id: "moment", no: 4, name: "In the Moment", verb: "Use it out there", color: "purple", hint: "Answer out loud before you look at the choices." },
  ];
  const modeOf = (id) => MODES.find((m) => m.id === id) || MODES[0];

  // ---- the book's structure: levels are chapters, lessons are their pages ----
  const chapters = LEVELS.map((level, index) => {
    const themes = (level.tiers || []).flatMap((t) => t.themes || []);
    return { level, index, lessons: LESSONS.filter((l) => themes.includes(l.section)) };
  });
  const order = chapters.flatMap((c) => c.lessons);
  const lessonById = (id) => LESSONS.find((l) => l.id === id);
  const chapterOf = (id) => chapters.find((c) => c.lessons.some((l) => l.id === id)) || chapters[0];
  const coverOf = (lesson) => "../assets/covers/" + lesson.id + ".png";

  // ---- state -----------------------------------------------------------------
  const fresh = () => ({ v: 1, cards: {}, readings: {}, days: {}, total: 0, history: [], settings: { romaji: "show", drive: false }, opened: false });
  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_) { saved = null; }
    const base = fresh();
    if (!saved) {
      // carry the Speaking Studio's review history over once (same card ids)
      try { const studio = JSON.parse(localStorage.getItem("hanasou.studio.v1") || "null"); if (studio && studio.cards) base.cards = Object.assign({}, studio.cards); } catch (_) {}
      return base;
    }
    return Object.assign(base, saved, { settings: Object.assign(base.settings, saved.settings || {}) });
  }
  const state = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) {} }
  const dayKey = (d) => (d || new Date()).toLocaleDateString("en-CA");

  // Studio's SRS, unchanged: again resets, hard grows slowly, good doubles.
  function recordAttempt(id, grade) {
    const now = Date.now();
    const card = state.cards[id] || { interval: 0, ease: 2.3, reps: 0, lapses: 0 };
    let interval = card.interval || 0;
    if (grade === "again") { interval = 0; card.lapses = (card.lapses || 0) + 1; }
    else if (grade === "hard") interval = Math.max(10 * 60 * 1000, interval ? interval * 1.35 : 12 * 60 * 60 * 1000);
    else interval = Math.max(24 * 60 * 60 * 1000, interval ? interval * 2.1 : 24 * 60 * 60 * 1000);
    card.interval = interval;
    card.ease = grade === "hard" ? Math.max(1.3, (card.ease || 2.3) - 0.08) : grade === "good" ? Math.min(2.8, (card.ease || 2.3) + 0.04) : (card.ease || 2.3);
    card.reps = (card.reps || 0) + 1;
    card.due = now + interval;
    state.cards[id] = card;
    state.days[dayKey()] = (state.days[dayKey()] || 0) + 1;
    state.total++;
    state.history.push({ id, grade, at: now });
    state.history = state.history.slice(-300);
    save();
  }
  const readingsOf = (id) => state.readings[id] || {};
  const doneCount = (id) => MODES.filter((m) => readingsOf(id)[m.id]).length;
  const chapterDone = (id) => doneCount(id) === MODES.length;
  const nextModeFor = (id) => MODES.find((m) => !readingsOf(id)[m.id]) || MODES[0];
  function nextLesson() { return order.find((l) => !chapterDone(l.id)) || order[0]; }
  function dueCards() {
    const now = Date.now();
    return Object.keys(state.cards)
      .filter((id) => /#\d+$/.test(id) && state.cards[id].reps > 0 && (state.cards[id].due || 0) <= now)
      .map((id) => ({ id, card: state.cards[id], lesson: lessonById(id.split("#")[0]), index: Number(id.split("#")[1]) }))
      .filter((x) => x.lesson && x.lesson.sentences[x.index])
      .sort((a, b) => (a.card.due || 0) - (b.card.due || 0));
  }

  // ---- audio: VOICEVOX clips first, the device's Japanese voice as fallback ----
  let manifest = null, player = null;
  const manifestReady = (typeof fetch === "function"
    ? fetch("../audio/manifest.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    : Promise.resolve(null)).then((m) => { manifest = m; return m; });
  const plain = (s) => String(s || "").replace(/\[[^\]]*\]/g, "");
  function clipFor(jp) { const c = manifest && manifest.clips; return c ? c[jp] || c[plain(jp)] || null : null; }
  // body.talking is set while a line plays: もち子 bobs, the listen button ripples
  const setTalking = (on) => document.body.classList.toggle("talking", !!on);
  function stopAudio() {
    if (player) { try { player.pause(); } catch (_) {} player = null; }
    if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (_) {} }
    setTalking(false);
  }
  function speakTTS(jp, slow) {
    return new Promise((resolve) => {
      const text = plain(jp);
      const guess = setTimeout(resolve, 900 + text.length * (slow ? 260 : 190));
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance !== "function") return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP"; u.rate = slow ? 0.72 : 0.9;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("ja"));
      if (voice) u.voice = voice;
      u.onend = u.onerror = () => { clearTimeout(guess); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }
  // Resolves when the line has finished playing (used by driving mode's gaps).
  let playToken = 0;
  function play(jp, slow) {
    if (!jp) return Promise.resolve();
    stopAudio();
    const token = ++playToken;
    return manifestReady.then(() => new Promise((resolve) => {
      let finished = false, fellBack = false;
      const finish = () => { if (!finished) { finished = true; if (token === playToken) setTalking(false); resolve(); } };
      const fallback = () => { if (fellBack) return; fellBack = true; speakTTS(jp, slow).then(finish); };
      if (token !== playToken) { finish(); return; }
      setTalking(true);
      const clip = clipFor(jp);
      const file = clip && (slow && clip.s ? clip.s : clip.n);
      if (!file || typeof Audio !== "function") { fallback(); return; }
      let audio;
      try { audio = new Audio("../audio/" + file); } catch (_) { fallback(); return; }
      player = audio;
      if (slow && !clip.s) audio.playbackRate = 0.82;
      audio.onended = finish;
      audio.onerror = fallback;
      setTimeout(finish, 15000);
      try { const p = audio.play(); if (p && p.catch) p.catch(fallback); } catch (_) { fallback(); }
    }));
  }
  const say = (jp, slow) => { play(jp, slow); };

  // ---- Japanese text helpers -------------------------------------------------
  // kanji[reading] → <ruby>
  const rubyHTML = (jp) => esc(jp).replace(/([一-鿿々]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
  const showRomaji = () => state.settings.romaji !== "hide";
  function chipsHTML(words, changed) {
    return (words || []).map((w, i) => '<button type="button" class="chip pos-' + esc(w.pos || "expr") + (changed && changed.includes(i) ? " changed" : "") + '" data-say="' + esc(w.jp) + '"><b>' + esc(w.jp) + "</b><small>" + esc(w.en) + "</small></button>").join("");
  }

  // ---- which pop-ups appear: hand-authored per lesson and per sentence -----
  // (scenes.js). Every picture literally matches its page: a blue house only
  // when the sentence says blue house. A sentence that names nothing drawable
  // shows just the lesson's world. Art that isn't drawn yet simply doesn't
  // appear — nothing is ever swapped in for it.
  const BOOK_SCENES = window.BOOK_SCENES || {};
  const sceneOf = (lesson) => (lesson && BOOK_SCENES[lesson.id]) || null;
  const worldOf = (lesson) => { const sc = sceneOf(lesson); return (sc && sc.world) || []; };
  function propsOf(lesson, i) {
    const sc = sceneOf(lesson);
    const page = sc && sc.pages && sc.pages.find((p) => p.i === i);
    return page ? page.props || [] : [];
  }
  const indexOfId = (id) => { const m = /#(\d+)$/.exec(String(id || "")); return m ? Number(m[1]) : -1; };
  // a page's story: the lesson's world in the back row, the sentence's own
  // things in front (a world prop the page is about steps forward)
  function storyFor(lesson, index, opts) {
    const front = index >= 0 ? propsOf(lesson, index).slice(0, 3) : [];
    const world = worldOf(lesson).filter((o) => !front.some((f) => f.art === o.art)).slice(0, 2);
    return { world, objects: opts && opts.hideFront ? [] : front };
  }
  // the chapter opener: the world, plus the lesson's most-used things in front
  function chapterStory(lesson) {
    const world = worldOf(lesson).slice(0, 2);
    const count = {};
    const first = {};
    ((sceneOf(lesson) || {}).pages || []).forEach((p) => (p.props || []).forEach((o) => {
      if (world.some((w) => w.art === o.art)) return;
      count[o.art] = (count[o.art] || 0) + 1;
      if (!first[o.art]) first[o.art] = Object.assign({}, o, { count: 1 });
    }));
    const front = Object.keys(first).sort((a, b) => count[b] - count[a]).slice(0, 2).map((k) => first[k]);
    return { world, objects: front };
  }
  // the lesson's postcard: its own once drawn, else its section's backdrop
  function postcardOf(lesson) {
    const sc = sceneOf(lesson) || {};
    const section = STORY + ((lesson && D.backdrops && D.backdrops[lesson.section]) || "bg-street.jpg");
    if (!sc.postcard) return { bg: section };
    if (!sc.postcardNew) return { bg: STORY + sc.postcard + ".jpg" };
    return { bg: section, bgTry: STORY + sc.postcard + ".jpg" };
  }

  // ---- the pop-up stage --------------------------------------------------------
  // Layers, back to front, in a fixed stacking order so nothing can swap
  // places while it rises: the painted postcard → the lesson's world props →
  // you and もち子 → this page's props → speech bubbles. Each layer stands up
  // from the fold in turn, then settles into a slow sway. The painting drifts
  // very slowly and a little weather floats in front of it. With reduced
  // motion it all just appears, still.
  const AIR = { "bg-street.jpg": "petals", "bg-aquarium.jpg": "bubbles", "bg-onsen.jpg": "steam", "bg-shop.jpg": "motes", "bg-room.jpg": "motes" };
  function airHTML(bg) {
    const kind = AIR[String(bg || "").split("/").pop()] || "motes";
    let out = '<div class="pop-air air-' + kind + '" aria-hidden="true">';
    for (let i = 0; i < 7; i++) out += '<i style="--x:' + (8 + i * 13 + (i % 2) * 4) + "%;--d:" + (i * 1.3).toFixed(1) + "s;--t:" + (7 + (i % 3) * 2) + 's"></i>';
    return out + "</div>";
  }
  // a prop: {art, say?, size?: "big"|"small", count?: 2..5}. If its picture
  // hasn't been drawn yet the cut-out removes itself.
  const GONE = ' onerror="var c=this.closest(&quot;.pop-cut&quot;);if(c)c.remove()"';
  function cutHTML(o, i) {
    const n = Math.max(1, Math.min(5, Number(o.count) || 1));
    const img = '<img src="' + STORY + esc(o.art) + '.png" alt=""' + GONE + ">";
    const cls = "pop-cut" + (o.size === "big" || o.size === "small" ? " size-" + o.size : "") + (n > 1 ? " multi" : "");
    const inner = n > 1 ? new Array(n).fill(img).join("") : img;
    return o.say
      ? '<button type="button" class="' + cls + '" style="--i:' + i + ";--n:" + n + '" data-say="' + esc(o.say) + '" aria-label="Hear ' + esc(o.say) + '">' + inner + "</button>"
      : '<span class="' + cls + '" style="--i:' + i + ";--n:" + n + '">' + inner + "</span>";
  }
  const norm = (list) => (list || []).map((o) => (typeof o === "string" ? { art: o } : o));
  let bubbleTimer = null;
  function typeInto(el, text, delay) {
    clearInterval(bubbleTimer);
    if (!el) return;
    if (reduceMotion || /\[/.test(text)) { el.innerHTML = rubyHTML(text); return; }
    const t = plain(text);
    el.textContent = "";
    let n = 0;
    setTimeout(() => {
      clearInterval(bubbleTimer);
      bubbleTimer = setInterval(() => { n++; el.textContent = t.slice(0, n); if (n >= t.length) clearInterval(bubbleTimer); }, 60);
    }, delay || 0);
  }
  function popup(host, opts) {
    clearInterval(bubbleTimer);
    const world = norm(opts.world).slice(0, 3);
    const front = norm(opts.objects).slice(0, 3);
    // opts.you: there's a conversation, so keep a bubble for your replies
    const you = !!opts.you;
    let i = 0;
    const worldHTML = world.map((o) => cutHTML(o, i++)).join("");
    const guideHTML = opts.guide === false ? "" : '<span class="pop-cut pop-guide" style="--i:' + (i++) + '"><img src="' + STORY + "mochiko-" + (opts.guide || "think") + '.png" alt=""></span>';
    const frontHTML = front.map((o) => cutHTML(o, i++)).join("");
    const bg = opts.bg || STORY + "bg-street.jpg";
    host.innerHTML =
      '<div class="popup' + (front.length ? " has-front" : "") + '">' +
        '<div class="pop-tilt">' +
          '<div class="pop-back"><span class="pop-paint" style="background-image:url(\'' + esc(bg) + '\')"></span>' + airHTML(bg) + "</div>" +
          '<div class="pop-floor"></div>' +
          '<div class="pop-row pop-world n' + world.length + '">' + worldHTML + "</div>" +
          guideHTML +
          '<div class="pop-row pop-front n' + front.length + '">' + frontHTML + "</div>" +
          (opts.bubble ? '<div class="pop-bubble her" aria-live="polite" aria-label="' + esc(plain(opts.bubble)) + '"><b>' + rubyHTML(opts.bubble) + "</b></div>" : "") +
          (you ? '<div class="pop-bubble you" aria-live="polite"><b></b></div>' : "") +
        "</div>" +
        (opts.caption ? '<span class="pop-caption">' + esc(opts.caption) + "</span>" : "") +
      "</div>";
    const stage = host.firstChild;
    // a lesson's own postcard, once it has been drawn
    if (opts.bgTry && typeof Image === "function") {
      const im = new Image();
      im.onload = () => { const paint = stage.querySelector(".pop-paint"); if (paint) paint.style.backgroundImage = "url('" + opts.bgTry + "')"; };
      im.src = opts.bgTry;
    }
    if (opts.bubble) typeInto(stage.querySelector(".pop-bubble.her b"), opts.bubble, 780);
    if (reduceMotion) { stage.classList.add("is-open"); return stage; }
    // two frames so the flat state is painted before it rises
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("is-open")));
    return stage;
  }
  // a conversation on the page: your line in your bubble, then hers again
  function bubbleSay(host, who, jp) {
    const stage = host && host.querySelector(".popup");
    if (!stage || !jp) return;
    const bubble = stage.querySelector(".pop-bubble." + who + " b");
    if (!bubble) return;
    stage.classList.toggle("you-turn", who === "you");
    bubble.parentNode.setAttribute("aria-label", plain(jp));
    typeInto(bubble, jp, reduceMotion ? 0 : 160);
  }
  // もち子 turns edge-on like a paper cut-out, changes pose, turns back
  function setGuide(host, pose) {
    const cut = host.querySelector(".pop-guide");
    const img = cut && cut.querySelector("img");
    if (!img) return;
    const apply = () => { img.src = STORY + "mochiko-" + pose + ".png"; };
    if (reduceMotion) { apply(); return; }
    cut.classList.remove("turn", "lift");
    void cut.offsetWidth;
    cut.classList.add("turn");
    setTimeout(apply, 200);
    if (pose === "thumbs" || pose === "cheer") setTimeout(() => cut.classList.add("lift"), 420);
    setTimeout(() => cut.classList.remove("turn", "lift"), 1100);
  }
  // fold the spread flat before the page turns
  function foldStage(host) {
    const stage = host && host.querySelector(".popup");
    if (stage) stage.classList.remove("is-open");
  }
  // washi paper scraps, only for the rare moment a chapter page gets stamped
  function confetti() {
    if (reduceMotion) return;
    const layer = document.createElement("div");
    layer.className = "washi";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#b94e43", "#d9a8a0", "#397e7e", "#b68a32", "#69518a", "#e8dcc4"];
    for (let i = 0; i < 22; i++) {
      const p = document.createElement("i");
      p.style.left = Math.round(4 + Math.random() * 92) + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      p.style.setProperty("--spin", Math.round(Math.random() * 540 - 270) + "deg");
      p.style.setProperty("--drift", Math.round(Math.random() * 90 - 45) + "px");
      layer.appendChild(p);
    }
    $("book").appendChild(layer);
    setTimeout(() => layer.remove(), 3200);
  }
  // gentle parallax: the spread leans toward your finger/cursor
  document.addEventListener("pointermove", (e) => {
    if (reduceMotion) return;
    const stage = e.target.closest && e.target.closest(".popup");
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    stage.style.setProperty("--lean", (x * 6).toFixed(2) + "deg");
  });

  // ---- screens & page turns ----------------------------------------------------
  const SCREENS = ["cover", "contents", "chapter", "reading", "journal"];
  let currentScreen = null;
  function show(id, opts) {
    const turn = !(opts && opts.instant) && !reduceMotion && currentScreen && currentScreen !== id;
    const swap = () => {
      SCREENS.forEach((s) => $(s).classList.toggle("active", s === id));
      currentScreen = id;
      document.body.dataset.screen = id;
      const nav = $("ribbons");
      nav.hidden = !(id === "contents" || id === "journal");
      nav.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.nav === id));
      window.scrollTo(0, 0);
    };
    if (turn) turnPage(opts && opts.back);
    swap();
  }
  // a blank leaf sweeps across while the new page is already underneath it
  function turnPage(back) {
    const leaf = $("leaf");
    leaf.classList.remove("turning", "turning-back");
    void leaf.offsetWidth;
    leaf.classList.add(back ? "turning-back" : "turning");
  }
  $("leaf").addEventListener("animationend", () => $("leaf").classList.remove("turning", "turning-back"));

  // ---- cover -------------------------------------------------------------------
  function openBook() {
    state.opened = true; save();
    renderContents();
    if (reduceMotion) { show("contents", { instant: true }); return; }
    $("cover").classList.add("opening");
    setTimeout(() => { $("cover").classList.remove("opening"); show("contents", { instant: true }); }, 720);
  }

  // ---- contents ------------------------------------------------------------------
  function dotsHTML(id) {
    return '<span class="four">' + MODES.map((m) => '<i class="' + m.color + (readingsOf(id)[m.id] ? " on" : "") + '" title="' + m.name + '"></i>').join("") + "</span>";
  }
  function renderContents() {
    const drive = !!state.settings.drive;
    $("drive-toggle").setAttribute("aria-pressed", String(drive));
    $("drive-label").textContent = drive ? "Driving" : "Drive";
    $("drive-note").hidden = !drive;

    const next = nextLesson();
    const ch = chapterOf(next.id);
    const mode = nextModeFor(next.id);
    $("bookmark").innerHTML =
      '<span class="ribbon" aria-hidden="true"></span>' +
      '<img class="plate" src="' + coverOf(next) + '" alt="">' +
      '<div class="bookmark-copy"><span class="kicker">栞 · Your page</span>' +
        "<small>Chapter " + ch.index + " · " + esc(ch.level.title) + "</small>" +
        "<h2>" + esc(next.title) + "</h2>" +
        "<p>Next: " + mode.no + " · " + esc(mode.name) + "</p>" + dotsHTML(next.id) +
      "</div>" +
      '<button class="primary" id="bookmark-open">' + (drive ? "🚗 Play this page" : "Open to this page") + " <b>→</b></button>";
    $("bookmark-open").addEventListener("click", () => (drive ? startReading(next.id, mode.id) : openChapter(next.id)));

    const due = dueCards().length;
    $("due-line").hidden = !due;
    $("due-line").innerHTML = due ? due + " page" + (due === 1 ? "" : "s") + ' want a second look. <button class="link" id="due-review">Review →</button>' : "";
    if (due) $("due-review").addEventListener("click", startReview);

    const toc = $("toc");
    toc.innerHTML = "";
    chapters.forEach((c) => {
      if (!c.lessons.length) return;
      const done = c.lessons.filter((l) => chapterDone(l.id)).length;
      const det = document.createElement("details");
      det.className = "chapter-toc";
      det.open = c.lessons.some((l) => l.id === next.id);
      det.innerHTML =
        "<summary><span class=\"ch-no\">" + c.index + '</span><span class="ch-copy"><b>' + esc(c.level.title) + "</b><small>" + esc(c.level.blurb) + '</small></span><span class="ch-count">' + done + "/" + c.lessons.length + "</span></summary>" +
        '<div class="toc-lines">' + c.lessons.map((l, i) =>
          '<button class="toc-line' + (l.id === next.id ? " here" : "") + (chapterDone(l.id) ? " done" : "") + '" data-lesson="' + esc(l.id) + '">' +
            '<span class="toc-n">' + c.index + "-" + (i + 1) + '</span><span class="toc-t">' + esc(l.title) + '</span><span class="toc-dots"></span>' + dotsHTML(l.id) +
          "</button>").join("") + "</div>";
      toc.appendChild(det);
    });
    toc.querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => openChapter(b.dataset.lesson)));

    $("trips").innerHTML = (D.sideTrips || []).map((t, i) =>
      '<button class="toc-line" data-trip="' + esc(t.id) + '"><span class="toc-n">' + String.fromCharCode(65 + i) + '</span><span class="toc-t">' + esc(t.title) + '</span><span class="toc-dots"></span><span class="toc-place">' + esc((t.place || "").toLowerCase()) + "</span></button>").join("");
    $("trips").querySelectorAll("[data-trip]").forEach((b) => b.addEventListener("click", () => startSideTrip(b.dataset.trip)));
  }

  // ---- chapter opener ------------------------------------------------------------
  let chapterLesson = null;
  function openChapter(id, opts) {
    const lesson = lessonById(id);
    if (!lesson) return;
    chapterLesson = lesson;
    const c = chapterOf(id);
    const pos = c.lessons.indexOf(lesson) + 1;
    $("chapter-kicker").textContent = "CHAPTER " + c.index + " · " + c.level.title.toUpperCase();
    $("chapter-page").textContent = c.index + "-" + pos;
    $("chapter-title").textContent = lesson.title;
    $("chapter-grammar").innerHTML = (lesson.grammar ? '<span class="grammar-jp">' + esc(lesson.grammar) + "</span>" : "") + "<p>" + esc(lesson.grammarNote || lesson.section || "") + "</p>";
    const next = nextModeFor(id);
    $("chapter-readings").innerHTML = MODES.map((m) => {
      const done = readingsOf(id)[m.id];
      return '<button class="reading-row ' + m.color + (done ? " done" : "") + (m.id === next.id && !chapterDone(id) ? " next" : "") + '" data-mode="' + m.id + '" style="--i:' + m.no + '">' +
        '<span class="r-no">' + m.no + '</span><span class="r-copy"><b>' + esc(m.name) + "</b><small>" + esc(m.verb) + "</small></span>" +
        '<span class="r-state">' + (done ? "✓" : m.id === next.id ? "next" : "") + "</span></button>";
    }).join("");
    $("chapter-readings").querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => startReading(id, b.dataset.mode)));
    const startMode = chapterDone(id) ? MODES[0] : next;
    $("chapter-start").innerHTML = (state.settings.drive ? "🚗 Play " : chapterDone(id) ? "Read again: " : "Begin reading " + startMode.no + ": ") + esc(startMode.name) + " <b>→</b>";
    $("chapter-start").onclick = () => startReading(id, startMode.id);
    show("chapter", opts);
    popup($("chapter-stage"), Object.assign({ caption: lesson.section }, postcardOf(lesson), chapterStory(lesson)));
  }

  // ---- building each reading from real content -----------------------------------
  const sentenceItems = (lesson) => (lesson.sentences || []).map((s, i) => ({ id: lesson.id + "#" + i, lesson, sentence: s })).filter((x) => x.sentence.en && x.sentence.jp);

  // Pattern Lab: two sentences from the same lesson that differ in one or two
  // content words. Both are authored, so the "new" sentence is always real.
  function patternPairs(lesson) {
    const items = sentenceItems(lesson).filter((x) => (x.sentence.words || []).length >= 2);
    const pairs = [], usedTargets = new Set();
    for (const a of items) for (const b of items) {
      if (a === b || usedTargets.has(b.id)) continue;
      const wa = a.sentence.words, wb = b.sentence.words;
      if (wa.length !== wb.length) continue;
      const diff = [];
      for (let k = 0; k < wa.length; k++) if (wa[k].jp !== wb[k].jp) diff.push(k);
      if (!diff.length || diff.length > 2) continue;
      if (diff.some((k) => wa[k].pos === "prt" || wb[k].pos === "prt" || wa[k].pos !== wb[k].pos)) continue;
      usedTargets.add(b.id);
      pairs.push({ kind: "pair", id: b.id, lesson, source: a.sentence, sentence: b.sentence, changed: diff, swaps: diff.map((k) => [wa[k], wb[k]]) });
    }
    return pairs;
  }
  function buildPatterns(lesson) {
    const curated = (D.transforms || []).filter((t) => t.lessonId === lesson.id).map((t) => ({
      kind: "transform", id: t.id, lesson, note: t.note,
      source: { en: t.sourceEnglish, jp: t.sourceJp }, sentence: { en: t.prompt.replace(/^(Say|Ask):\s*/, ""), jp: t.target, romaji: "", words: [] },
    }));
    const items = curated.concat(shuffle(patternPairs(lesson))).slice(0, 6);
    if (items.length) return items;
    // no swappable pair in this lesson: assemble the sentence from its chips;
    // a lesson of one-word lines (reactions) just says each one fresh
    const buildable = sentenceItems(lesson).filter((x) => (x.sentence.words || []).length >= 3).slice(0, 5);
    if (buildable.length) return buildable.map((x) => Object.assign({ kind: "build" }, x));
    return sentenceItems(lesson).map((x) => Object.assign({ kind: "recall" }, x));
  }
  function buildListen(lesson) {
    const items = shuffle(sentenceItems(lesson)).slice(0, 8);
    const chapterPool = chapterOf(lesson.id).lessons.flatMap(sentenceItems);
    return items.map((x) => {
      const near = shuffle(sentenceItems(lesson).filter((o) => o.sentence.en !== x.sentence.en)).map((o) => o.sentence.en);
      const far = shuffle(chapterPool.filter((o) => o.sentence.en !== x.sentence.en)).map((o) => o.sentence.en);
      const wrong = Array.from(new Set(near.concat(far))).slice(0, 3);
      return Object.assign({ kind: "listen", choices: shuffle([x.sentence.en].concat(wrong)) }, x);
    });
  }
  // In the Moment: the lesson's hand-written scene, turned into turns of
  // "her line → your reply". Distractors are other real lines, never invented.
  function buildMoment(lesson) {
    const scene = SCENES.find((s) => s.lesson === lesson.id);
    if (scene) return sceneTurns(scene, lesson);
    const trip = (D.sideTrips || []).find((t) => t.level === "L0") || (D.sideTrips || [])[0];
    return trip ? tripTurns(trip) : null;
  }
  function sceneTurns(scene, lesson) {
    const turns = [];
    let them = null;
    const youLines = scene.steps.filter((s) => s.who === "you");
    const lessonLines = sentenceItems(lesson).map((x) => x.sentence);
    scene.steps.forEach((step) => {
      if (step.who !== "you") { them = { jp: step.jp, en: step.en, speaker: "もち子さん" }; return; }
      const others = youLines.filter((s) => s.jp !== step.jp).concat(shuffle(lessonLines).filter((s) => s.jp !== step.jp));
      const wrong = [];
      for (const o of others) if (!wrong.some((w) => w.jp === o.jp) && o.jp !== step.jp) wrong.push(o);
      turns.push({
        id: "scene:" + scene.id + ":" + turns.length,
        them, ctx: step.ctx || "Your turn.",
        choices: shuffle([{ jp: step.jp, en: step.en, romaji: step.romaji, correct: true }].concat(wrong.slice(0, 2).map((w) => ({ jp: w.jp, en: w.en, romaji: w.romaji })))),
      });
      them = null;
    });
    const last = scene.steps[scene.steps.length - 1];
    return { title: scene.en || scene.title, sceneTitle: scene.title, lesson, turns, closing: last && last.who !== "you" ? { jp: last.jp, en: last.en } : null, speaker: "もち子さん" };
  }
  function tripTurns(trip) {
    return {
      title: trip.title, sceneTitle: trip.place, trip: true, closing: null,
      turns: trip.turns.map((t, i) => ({
        id: "conversation:" + trip.id + ":" + i,
        them: { jp: t.jp, en: t.en, speaker: t.speaker }, ctx: t.speaker + " is talking to you. What do you say?",
        choices: shuffle(t.choices.map((c) => ({ jp: c.jp, en: c.en, correct: !!c.correct, replyJp: c.replyJp, replyEn: c.replyEn }))),
      })),
    };
  }

  // ---- a reading session ---------------------------------------------------------
  let session = null;
  function startReading(lessonId, modeId) {
    const lesson = lessonById(lessonId);
    if (!lesson) return;
    const mode = modeOf(modeId);
    let items, convo = null;
    if (mode.id === "recall") items = sentenceItems(lesson).map((x) => Object.assign({ kind: "recall" }, x));
    else if (mode.id === "listen") items = buildListen(lesson);
    else if (mode.id === "patterns") items = buildPatterns(lesson);
    else { convo = buildMoment(lesson); items = convo ? convo.turns : []; }
    session = { lesson, mode, items, convo, index: 0, said: 0, firstTry: true, review: false };
    beginSession();
  }
  function startReview() {
    const items = dueCards().slice(0, 10).map((x) => ({ kind: "recall", id: x.id, lesson: x.lesson, sentence: x.lesson.sentences[x.index] }));
    if (!items.length) return;
    session = { lesson: null, mode: MODES[0], items, convo: null, index: 0, said: 0, review: true };
    beginSession();
  }
  function startSideTrip(id) {
    const trip = (D.sideTrips || []).find((t) => t.id === id);
    if (!trip) return;
    const convo = tripTurns(trip);
    session = { lesson: null, mode: MODES[3], items: convo.turns, convo, index: 0, said: 0, review: false, trip };
    beginSession();
  }
  function beginSession() {
    stopDrive();
    const s = session;
    $("reading-title").textContent = s.review ? "REVIEW · SECOND LOOK" : s.trip ? "SIDE TRIP · " + s.trip.title.toUpperCase() : s.mode.no + " · " + s.mode.name.toUpperCase();
    document.body.dataset.mode = s.mode.color;
    show("reading");
    if (state.settings.drive) { startDrive(); return; }
    renderItem();
  }
  function closeReading() {
    stopDrive(); stopAudio();
    const s = session;
    session = null;
    if (s && s.lesson) openChapter(s.lesson.id, { back: true });
    else { renderContents(); show("contents", { back: true }); }
  }
  function renderDots() {
    const s = session, n = s.items.length;
    $("reading-page").textContent = n ? pad(Math.min(s.index + 1, n)) + " / " + pad(n) : "";
    $("reading-dots").innerHTML = s.items.map((_, i) => '<i class="' + (i < s.index ? "past" : i === s.index ? "now" : "") + '"></i>').join("");
  }
  function itemStory(item) {
    if (session.mode.id === "moment") return { world: [], objects: [] };
    // Listen & Notice keeps this page's props hidden until you answer
    return storyFor(item.lesson, indexOfId(item.id), { hideFront: item.kind === "listen" });
  }
  function renderItem() {
    const s = session;
    if (!s.items.length) { $("reading-body").innerHTML = '<p class="empty">This chapter has nothing for this reading yet.</p><button class="primary" id="empty-back">Back <b>→</b></button>'; $("empty-back").onclick = closeReading; $("reading-stage").innerHTML = ""; return; }
    if (s.index >= s.items.length) { finishSession(); return; }
    renderDots();
    const item = s.items[s.index];
    const lesson = item.lesson || s.lesson;
    if (s.mode.id === "moment") return renderTurn(item);
    popup($("reading-stage"), Object.assign({ guide: "think" }, postcardOf(lesson), itemStory(item)));
    if (item.kind === "recall") renderRecall(item);
    else if (item.kind === "listen") renderListen(item);
    else if (item.kind === "build") renderBuild(item);
    else renderPattern(item);
  }
  // fold the spread flat, turn the page, let the next one rise
  function nextItem() {
    stopAudio();
    const mine = session;
    const go = () => {
      if (session !== mine) return;
      session.index++;
      if (!reduceMotion) turnPage(false);
      renderItem();
    };
    if (reduceMotion) { go(); return; }
    foldStage($("reading-stage"));
    setTimeout(go, 240);
  }

  // the pull-tab: the answer slides out from behind the illustration
  function pullTabHTML(label) {
    return '<div class="slip-wrap"><div class="slip" id="slip"></div></div><button class="pull-tab" id="pull-tab"><span>' + esc(label) + '</span><i aria-hidden="true">▾</i></button>';
  }
  function wirePullTab(onPull) {
    const tab = $("pull-tab");
    let startY = null, pulled = false;
    const pull = () => { if (pulled) return; pulled = true; tab.classList.add("pulled"); $("slip").parentNode.classList.add("open"); onPull(); };
    tab.addEventListener("click", pull);
    tab.addEventListener("pointerdown", (e) => { startY = e.clientY; });
    tab.addEventListener("pointermove", (e) => { if (startY != null && e.clientY - startY > 24) { startY = null; pull(); } });
    tab.addEventListener("pointerup", () => { startY = null; });
  }
  function answerHTML(sentence, changed) {
    return '<div class="jp">' + rubyHTML(sentence.jp) + "</div>" +
      (showRomaji() && sentence.romaji ? '<div class="romaji">' + esc(sentence.romaji) + "</div>" : "") +
      '<div class="en">' + esc(sentence.en) + "</div>" +
      '<div class="slip-tools"><button data-say="' + esc(sentence.jp) + '">▶ Hear</button><button data-say-slow="' + esc(sentence.jp) + '">Slowly</button>' +
      ((sentence.words || []).length ? '<button id="chips-toggle">Words ＋</button>' : "") + "</div>" +
      ((sentence.words || []).length ? '<div class="chips" id="chips" hidden>' + chipsHTML(sentence.words, changed) + "</div>" : "");
  }
  const gradesHTML = '<div class="grades" id="grades" hidden><button data-grade="again">Not yet</button><button data-grade="hard">Almost</button><button data-grade="good">Got it</button></div>';
  function wireGrades(item) {
    $("grades").querySelectorAll("[data-grade]").forEach((b) => b.addEventListener("click", () => {
      recordAttempt(item.id, b.dataset.grade);
      session.said++;
      if (b.dataset.grade === "good") setGuide($("reading-stage"), "thumbs");
      else if (b.dataset.grade === "again") setGuide($("reading-stage"), "think");
      // advance only the reading this grade belongs to (Back may have closed it)
      const mine = session;
      if (reduceMotion) nextItem();
      else setTimeout(() => { if (session === mine && !drive) nextItem(); }, 260);
    }));
  }

  function renderRecall(item) {
    const s = item.sentence;
    $("reading-body").innerHTML =
      '<span class="kicker">Say it in Japanese</span>' +
      '<h2 class="prompt">' + esc(s.en) + "</h2>" +
      (s.hint ? '<p class="hint">' + esc(s.hint) + "</p>" : '<p class="hint">' + esc(MODES[0].hint) + "</p>") +
      pullTabHTML("I said it — pull the tab") + gradesHTML;
    wirePullTab(() => { $("slip").innerHTML = answerHTML(s); $("grades").hidden = false; say(s.jp); });
    wireGrades(item);
  }

  function renderPattern(item) {
    const src = item.source, s = item.sentence;
    const swapLine = item.kind === "pair"
      ? "Swap " + item.swaps.map((p) => "<b>" + esc(p[0].en) + "</b> → <b>" + esc(p[1].en) + "</b>").join(" and ")
      : "Keep the frame, change what the new meaning needs.";
    $("reading-body").innerHTML =
      '<span class="kicker">Change one piece</span>' +
      '<div class="source-card"><small>You can already say</small><div class="jp">' + rubyHTML(src.jp) + '</div><p>' + esc(src.en) + '</p><button class="mini" data-say="' + esc(src.jp) + '">▶</button></div>' +
      '<h2 class="prompt">Now say: ' + esc(s.en) + "</h2>" +
      '<p class="hint">' + swapLine + "</p>" +
      pullTabHTML("I said it — pull the tab") + gradesHTML;
    wirePullTab(() => {
      $("slip").innerHTML = answerHTML(s, item.changed) + (item.note ? '<p class="note">' + esc(item.note) + "</p>" : "");
      $("grades").hidden = false;
      say(s.jp);
    });
    wireGrades(item);
  }

  function renderListen(item) {
    const s = item.sentence;
    $("reading-body").innerHTML =
      '<span class="kicker">Listen first</span>' +
      '<div class="listen-row"><button class="big-play" id="listen-play" aria-label="Play">▶</button><button class="mini" data-say-slow="' + esc(s.jp) + '">Slowly</button></div>' +
      '<h2 class="prompt small">What did you hear?</h2>' +
      '<div class="choices">' + item.choices.map((c) => '<button class="choice" data-choice="' + esc(c) + '">' + esc(c) + "</button>").join("") + "</div>" +
      '<div class="feedback" id="feedback" hidden></div>';
    $("listen-play").addEventListener("click", () => say(s.jp));
    say(s.jp);
    $("reading-body").querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
      const ok = b.dataset.choice === s.en;
      $("reading-body").querySelectorAll("[data-choice]").forEach((x) => { x.disabled = true; if (x.dataset.choice === s.en) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      recordAttempt(item.id, ok ? "good" : "again");
      session.said++;
      popup($("reading-stage"), Object.assign({ guide: ok ? "thumbs" : "think" }, postcardOf(item.lesson), storyFor(item.lesson, indexOfId(item.id))));
      $("feedback").hidden = false;
      $("feedback").className = "feedback " + (ok ? "good" : "again");
      $("feedback").innerHTML = "<strong>" + (ok ? "You caught it." : "Here's what you heard.") + '</strong><div class="jp">' + rubyHTML(s.jp) + "</div>" +
        (showRomaji() && s.romaji ? '<div class="romaji">' + esc(s.romaji) + "</div>" : "") +
        '<p class="say-back">Now say it back once, out loud.</p><button class="primary" id="listen-next">Next page <b>→</b></button>';
      $("listen-next").addEventListener("click", nextItem);
    }));
  }

  function renderBuild(item) {
    const s = item.sentence;
    const bank = shuffle(s.words.map((w, i) => ({ w, i })));
    let placed = [], tries = 0;
    $("reading-body").innerHTML =
      '<span class="kicker">Put it together</span>' +
      '<h2 class="prompt">' + esc(s.en) + "</h2>" +
      '<p class="hint">Say it first, then tap the pieces in order.</p>' +
      '<div class="build-line" id="build-line"></div><div class="build-bank" id="build-bank">' +
        bank.map((b) => '<button class="chip pos-' + esc(b.w.pos || "expr") + '" data-piece="' + b.i + '"><b>' + esc(b.w.jp) + "</b></button>").join("") +
      '</div><div class="feedback" id="feedback" hidden></div>';
    $("build-bank").querySelectorAll("[data-piece]").forEach((btn) => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.piece);
      say(s.words[i].jp);
      btn.disabled = true; btn.classList.add("used");
      placed.push(i);
      $("build-line").insertAdjacentHTML("beforeend", '<span class="chip pos-' + esc(s.words[i].pos || "expr") + '"><b>' + esc(s.words[i].jp) + "</b></span>");
      if (placed.length < s.words.length) return;
      const ok = placed.every((v, k) => s.words[v].jp === s.words[k].jp);
      tries++;
      if (!ok) {
        $("build-line").classList.add("shake");
        setTimeout(() => {
          placed = [];
          $("build-line").classList.remove("shake");
          $("build-line").innerHTML = "";
          $("build-bank").querySelectorAll("[data-piece]").forEach((x) => { x.disabled = false; x.classList.remove("used"); });
        }, 600);
        return;
      }
      recordAttempt(item.id, tries === 1 ? "good" : "hard");
      session.said++;
      setGuide($("reading-stage"), "thumbs");
      $("feedback").hidden = false;
      $("feedback").className = "feedback good";
      $("feedback").innerHTML = "<strong>That's the sentence.</strong>" + answerHTML(s) + '<button class="primary" id="build-next">Next page <b>→</b></button>';
      say(s.jp);
      $("build-next").addEventListener("click", nextItem);
    }));
  }

  // In the Moment: her line in a speech bubble, then your turn.
  function renderTurn(turn) {
    const s = session, convo = s.convo;
    let wrongTries = 0;
    const right = turn.choices.find((c) => c.correct);
    const taught = right && s.lesson ? (s.lesson.sentences || []).findIndex((x) => x.jp === right.jp) : -1;
    popup($("reading-stage"), {
      ...(s.lesson ? postcardOf(s.lesson) : { bg: STORY + "bg-street.jpg" }),
      ...(s.lesson ? storyFor(s.lesson, taught) : {}),
      you: true, guide: "think", bubble: turn.them ? turn.them.jp : "",
      caption: convo.sceneTitle,
    });
    $("reading-body").innerHTML =
      (turn.them
        ? '<div class="them"><small>' + esc(turn.them.speaker || convo.speaker || "") + '</small><div class="them-tools"><button class="mini" data-say="' + esc(turn.them.jp) + '">▶ Again</button><button class="mini" id="them-en-toggle">English</button></div><p class="en" id="them-en" hidden>' + esc(turn.them.en) + "</p></div>"
        : "") +
      '<span class="kicker">Your turn</span><h2 class="prompt small">' + esc(turn.ctx) + "</h2>" +
      '<p class="hint">Say your reply out loud first.</p>' +
      '<button class="pull-tab" id="show-choices"><span>I said it — show the choices</span><i aria-hidden="true">▾</i></button>' +
      '<div class="choices jp-choices" id="turn-choices" hidden>' + turn.choices.map((c, i) =>
        '<div class="choice-line"><button class="choice" data-pick="' + i + '"><b>' + rubyHTML(c.jp) + "</b>" + (showRomaji() && c.romaji ? "<small>" + esc(c.romaji) + "</small>" : "") + '</button><button class="mini" data-say="' + esc(c.jp) + '" aria-label="Hear it">▶</button></div>').join("") + "</div>" +
      '<div class="feedback" id="feedback" hidden></div>';
    if (turn.them) say(turn.them.jp);
    const toggle = $("them-en-toggle");
    if (toggle) toggle.addEventListener("click", () => { $("them-en").hidden = !$("them-en").hidden; });
    $("show-choices").addEventListener("click", () => { $("show-choices").hidden = true; $("turn-choices").hidden = false; });
    $("turn-choices").querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
      const choice = turn.choices[Number(b.dataset.pick)];
      const fb = $("feedback");
      fb.hidden = false;
      if (!choice.correct) {
        wrongTries++;
        b.disabled = true; b.classList.add("wrong");
        b.insertAdjacentHTML("beforeend", "<em>" + esc(choice.en) + "</em>");
        fb.className = "feedback again";
        fb.innerHTML = choice.replyJp
          ? "<strong>They'd answer:</strong><div class=\"jp\">" + rubyHTML(choice.replyJp) + "</div><p>" + esc(choice.replyEn || "") + "</p><p class=\"say-back\">That doesn't fit the moment — try another.</p>"
          : "<strong>That doesn't answer her.</strong><p class=\"say-back\">Listen to her line again, then try another.</p>";
        if (choice.replyJp) say(choice.replyJp);
        setGuide($("reading-stage"), "think");
        return;
      }
      $("turn-choices").querySelectorAll("[data-pick]").forEach((x) => { x.disabled = true; });
      b.classList.add("right");
      b.insertAdjacentHTML("beforeend", "<em>" + esc(choice.en) + "</em>");
      recordAttempt(turn.id, wrongTries ? "again" : "good");
      session.said++;
      setGuide($("reading-stage"), "thumbs");
      const lastTurn = s.index === s.items.length - 1;
      const reply = choice.replyJp ? { jp: choice.replyJp, en: choice.replyEn } : lastTurn ? convo.closing : null;
      fb.className = "feedback good";
      fb.innerHTML = "<strong>That fits the moment.</strong>" +
        (reply ? '<div class="reply"><small>' + esc(turn.them && turn.them.speaker || convo.speaker || "They say") + '</small><div class="jp">' + rubyHTML(reply.jp) + "</div><p>" + esc(reply.en || "") + "</p></div>" : "") +
        '<button class="primary" id="turn-next">' + (lastTurn ? "Finish the scene" : "Keep talking") + " <b>→</b></button>";
      bubbleSay($("reading-stage"), "you", choice.jp);
      play(choice.jp).then(() => {
        if (!reply || !session || session.items[session.index] !== turn) return;
        bubbleSay($("reading-stage"), "her", reply.jp);
        say(reply.jp);
      });
      $("turn-next").addEventListener("click", nextItem);
    }));
  }

  // ---- end of a reading ------------------------------------------------------------
  function finishSession() {
    const s = session;
    stopAudio();
    $("reading-dots").innerHTML = s.items.map(() => '<i class="past"></i>').join("");
    $("reading-page").textContent = "";
    let chapterStamped = false;
    if (s.lesson && !s.review && !s.trip) {
      const had = chapterDone(s.lesson.id);
      state.readings[s.lesson.id] = Object.assign({}, readingsOf(s.lesson.id), { [s.mode.id]: Date.now() });
      save();
      chapterStamped = !had && chapterDone(s.lesson.id);
    }
    popup($("reading-stage"), Object.assign({ guide: "cheer" }, s.lesson ? postcardOf(s.lesson) : { bg: STORY + "bg-street.jpg" }, s.lesson ? chapterStory(s.lesson) : {}));
    const nextMode = s.lesson && !chapterDone(s.lesson.id) ? nextModeFor(s.lesson.id) : null;
    const after = chapterStamped ? nextLesson() : null;
    $("reading-body").innerHTML =
      '<div class="finish' + (chapterStamped ? " big" : "") + (reduceMotion ? "" : " press") + '">' +
        '<span class="hanko' + (reduceMotion ? "" : " stamping") + '" aria-hidden="true">' + (chapterStamped ? "済" : s.mode.no) + "</span>" +
        "<span class=\"kicker\">" + (s.review ? "Second look done" : s.trip ? "Side trip done" : chapterStamped ? "Chapter page stamped" : "Reading " + s.mode.no + " done") + "</span>" +
        "<h2>" + (chapterStamped ? "よくできました！" : s.mode.id === "moment" ? "You kept it moving." : "Page finished.") + "</h2>" +
        "<p>" + (chapterStamped ? "All four readings of " + esc(s.lesson.title) + " — it's in your journal now."
          : s.said ? "You said " + s.said + " line" + (s.said === 1 ? "" : "s") + " out loud. Say the hardest one once more."
          : "Say your favourite line once more, out loud.") + "</p>" +
      "</div>" +
      (nextMode ? '<button class="primary" id="finish-next">Next: ' + nextMode.no + " · " + esc(nextMode.name) + " <b>→</b></button>" : "") +
      (after ? '<button class="primary" id="finish-after">Turn to: ' + esc(after.title) + " <b>→</b></button>" : "") +
      '<button class="quiet" id="finish-back">' + (s.lesson && !s.review && !s.trip ? "Back to the chapter" : "Back to contents") + "</button>";
    if (chapterStamped) setTimeout(confetti, reduceMotion ? 0 : 500);
    if (nextMode) $("finish-next").onclick = () => startReading(s.lesson.id, nextMode.id);
    if (after) $("finish-after").onclick = () => openChapter(after.id);
    $("finish-back").onclick = closeReading;
  }

  // ---- driving mode: Japanese audio only, hands-free ------------------------------
  // listen → say it back in the gap → hear it again slowly. English is never
  // spoken aloud (project rule) and nothing is graded while you drive.
  let drive = null;
  function drivePlaylist() {
    const s = session;
    if (s.mode.id === "moment" && s.convo) {
      const out = [];
      s.convo.turns.forEach((t) => {
        if (t.them) out.push({ jp: t.them.jp, en: t.them.en, cue: "Listen" });
        const right = t.choices.find((c) => c.correct);
        if (right) { out.push({ gap: 4200, cue: "Your turn — reply out loud" }); out.push({ jp: right.jp, en: right.en, cue: "One way to say it" }); }
      });
      if (s.convo.closing) out.push({ jp: s.convo.closing.jp, en: s.convo.closing.en, cue: "Listen" });
      return out;
    }
    const lines = s.items.map((x) => x.sentence).filter(Boolean);
    return lines.flatMap((l) => [
      { jp: l.jp, en: l.en, cue: "Listen" },
      { shadow: true, cue: "Say it back" },
      { jp: l.jp, en: l.en, slow: true, cue: "Once more, slowly" },
      { gap: 1600, cue: "Say it again" },
    ]);
  }
  function startDrive() {
    const list = drivePlaylist();
    drive = { list, i: 0, paused: false, token: {}, lastMs: 2500, lock: null };
    $("reading-stage").innerHTML = "";
    $("reading-dots").innerHTML = "";
    $("reading-page").textContent = "";
    $("reading-body").innerHTML =
      '<div class="drive-panel"><span class="kicker">🚗 Driving mode · Japanese only</span>' +
        '<div class="drive-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<p class="drive-cue" id="drive-cue">Starting…</p><div class="drive-jp" id="drive-jp"></div>' +
        '<div class="drive-count" id="drive-count"></div>' +
        '<div class="drive-buttons"><button class="drive-big" id="drive-pause">Pause</button><button class="quiet" id="drive-stop">Stop</button></div>' +
        '<p class="fine">Set this up while parked. Eyes on the road — everything is spoken.</p></div>';
    $("drive-pause").addEventListener("click", () => {
      if (!drive) return;
      drive.paused = !drive.paused;
      $("drive-pause").textContent = drive.paused ? "Resume" : "Pause";
      if (drive.paused) { drive.token = {}; stopAudio(); } else runDrive();
    });
    $("drive-stop").addEventListener("click", closeReading);
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then((l) => { if (drive) drive.lock = l; }).catch(() => {}); } catch (_) {}
    runDrive();
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runDrive() {
    const d = drive;
    if (!d) return;
    const token = d.token = {};
    const alive = () => drive === d && d.token === token && !d.paused;
    while (alive() && d.i < d.list.length) {
      const step = d.list[d.i];
      const line = $("drive-cue");
      if (line) line.textContent = step.cue || "";
      const lines = d.list.filter((x) => x.jp && !x.slow).length;
      const at = d.list.slice(0, d.i + 1).filter((x) => x.jp && !x.slow).length;
      if ($("drive-count")) $("drive-count").textContent = at + " / " + lines;
      if (step.jp) {
        $("drive-jp").innerHTML = rubyHTML(step.jp);
        const t0 = Date.now();
        await play(step.jp, step.slow);
        if (!step.slow) d.lastMs = Math.max(900, Date.now() - t0);
        await wait(350);
      } else if (step.shadow) {
        await wait(Math.min(9000, d.lastMs * 1.4 + 1400));
      } else {
        await wait(step.gap || 1500);
      }
      if (alive()) d.i++;
    }
    if (alive() && d.i >= d.list.length) {
      if ($("drive-cue")) $("drive-cue").textContent = "Page finished — great listening.";
      $("drive-pause").textContent = "Play again";
      d.i = 0; d.paused = true;
    }
  }
  function stopDrive() {
    if (!drive) return;
    if (drive.lock && drive.lock.release) { try { drive.lock.release(); } catch (_) {} }
    drive.token = {}; drive = null;
    stopAudio();
  }

  // ---- journal ----------------------------------------------------------------------
  function renderJournal() {
    // this week, Monday-first; a forgiving rhythm, not a streak
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const names = ["M", "T", "W", "T", "F", "S", "S"];
    $("week").innerHTML = '<span class="kicker">This week</span><div class="week-dots">' + names.map((n, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const count = state.days[dayKey(d)] || 0;
      return '<span class="day' + (count ? " on" : "") + (dayKey(d) === dayKey() ? " today" : "") + '"><i></i><small>' + n + "</small></span>";
    }).join("") + "</div>";
    const readings = Object.values(state.readings).reduce((n, r) => n + MODES.filter((m) => r[m.id]).length, 0);
    const stamped = order.filter((l) => chapterDone(l.id));
    $("tallies").innerHTML =
      "<div><b>" + state.total + "</b><small>lines said out loud</small></div>" +
      "<div><b>" + readings + "</b><small>readings finished</small></div>" +
      "<div><b>" + stamped.length + "</b><small>chapter pages stamped</small></div>";
    const due = dueCards().length;
    $("review-due").hidden = !due;
    $("review-due").innerHTML = "Second look: " + due + " page" + (due === 1 ? "" : "s") + " <b>→</b>";
    $("stamp-count").textContent = stamped.length + " of " + order.length;
    $("stamps").innerHTML = stamped.length
      ? stamped.map((l) => '<button class="stamp" data-lesson="' + esc(l.id) + '"><img src="' + coverOf(l) + '" alt=""><span class="hanko small">済</span><small>' + esc(l.title) + "</small></button>").join("")
      : '<p class="fine">Finish all four readings of a page and its stamp lands here.</p>';
    $("stamps").querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => openChapter(b.dataset.lesson)));
    $("romaji-setting").value = state.settings.romaji;
  }

  // ---- global wiring -------------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.dataset.say) {
      say(b.dataset.say);
      if (b.classList.contains("pop-cut") && !reduceMotion) {
        b.classList.remove("flip-over"); void b.offsetWidth; b.classList.add("flip-over");
        setTimeout(() => b.classList.remove("flip-over"), 800);
      }
    }
    else if (b.dataset.saySlow) say(b.dataset.saySlow, true);
    else if (b.id === "chips-toggle") { const c = $("chips"); c.hidden = !c.hidden; b.textContent = c.hidden ? "Words ＋" : "Words −"; }
  });
  $("open-book").addEventListener("click", openBook);
  $("to-cover").addEventListener("click", () => show("cover", { back: true }));
  $("drive-toggle").addEventListener("click", () => { state.settings.drive = !state.settings.drive; save(); renderContents(); });
  $("chapter-back").addEventListener("click", () => { renderContents(); show("contents", { back: true }); });
  $("reading-back").addEventListener("click", closeReading);
  $("review-due").addEventListener("click", startReview);
  $("romaji-setting").addEventListener("change", (e) => { state.settings.romaji = e.target.value; save(); });
  $("reset-book").addEventListener("click", () => {
    if (!window.confirm("Reset this pop-up book's progress? Your main Hanasou app is not affected.")) return;
    const keep = state.settings;
    Object.assign(state, fresh(), { settings: keep, opened: true });
    save(); renderJournal();
  });
  $("ribbons").querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.nav === "contents") { renderContents(); show("contents"); }
    else if (b.dataset.nav === "journal") { renderJournal(); show("journal"); }
    else { const l = nextLesson(); openChapter(l.id); }
  }));

  // first visit opens on the cover; after that, straight to the contents
  if (state.opened) { renderContents(); show("contents", { instant: true }); }
  else show("cover", { instant: true });

  // for the smoke test
  window.HanasouBook = { state, chapters, order, patternPairs, buildPatterns, buildMoment, buildListen, drivePlaylist: () => (session ? drivePlaylist() : []), session: () => session };
})();
