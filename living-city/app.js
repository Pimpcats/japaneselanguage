// Hanasou — The Pop-up Book.
//
// One set of sentences, one review schedule, three ways in:
//
//   BOOK       learn a page: Meet it (picture, sentence, word chips), then four
//              different exercises in one continuous flow —
//              1 Recall (say it) · 2 Listen (tap what you heard) ·
//              3 Pattern Lab (swap a piece) · 4 In the Moment (answer her).
//   ENCOUNTERS someone speaks to you in Japanese; you answer in Japanese, out
//              loud, then see one way to say it and what she meant.
//   DRIVE      keep it on the road, hands-free or by touch. It mixes three
//              directions: say it (meaning → Japanese), understand it
//              (Japanese → meaning) and answer her (her question → your reply).
//
// From the flashcards: every word is a chip with its meaning under it, coloured
// by its role (the main app's colours), tap to hear, ↗ to look it up on Jisho.
//
// Content is real only: ../lessons.js sentences and conversation scenes, the
// hand-authored pop-ups in scenes.js, recorded VOICEVOX clips. Progress lives in
// its own localStorage key and never touches the main app.
(function () {
  "use strict";

  const STORE = "hanasou.book.v1";
  const D = window.BOOK_DATA || {};
  const LEVELS = Array.isArray(window.LEVELS) ? window.LEVELS : [];
  const LESSONS = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const TALK = Array.isArray(window.SCENES) ? window.SCENES : [];
  const POPS = window.BOOK_SCENES || {};
  const MISSING = new Set(window.BOOK_ART_MISSING || []);
  const STORY = "../assets/story/";
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // tests shrink every wait with window.HANASOU_BOOK_SPEED
  const T = (ms) => ms * (Number(window.HANASOU_BOOK_SPEED) || 1);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (items) => { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  // ---- icons: one hand-tuned line set, drawn in the page's ink --------------
  const line = (d) => '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const solid = (d) => '<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + d + "</svg>";
  const ICON = {
    close: line('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: line('<path d="M15 5l-7 7 7 7"/>'),
    next: line('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chevron: line('<path d="M9 5l7 7-7 7"/>'),
    check: line('<path class="draw" d="M5 12.5l4.5 4.5L19 7.5"/>'),
    sound: line('<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    play: solid('<path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z"/>'),
    pause: solid('<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>'),
    prev: solid('<rect x="5" y="5" width="3" height="14" rx="1"/><path d="M20 6.2v11.6a.8.8 0 0 1-1.24.67l-8.7-5.8a.8.8 0 0 1 0-1.34l8.7-5.8A.8.8 0 0 1 20 6.2z"/>'),
    skip: solid('<rect x="16" y="5" width="3" height="14" rx="1"/><path d="M4 6.2v11.6a.8.8 0 0 0 1.24.67l8.7-5.8a.8.8 0 0 0 0-1.34l-8.7-5.8A.8.8 0 0 0 4 6.2z"/>'),
    book: line('<path d="M12 6.5C10.5 5 8.3 4.5 4 4.5v14c4.3 0 6.5.5 8 2 1.5-1.5 3.7-2 8-2v-14c-4.3 0-6.5.5-8 2z"/><path d="M12 6.5v14"/>'),
    car: line('<path d="M5.5 11l1.6-4.4A1.5 1.5 0 0 1 8.5 5.6h7a1.5 1.5 0 0 1 1.4 1L18.5 11"/><rect x="3.5" y="11" width="17" height="6" rx="2"/><path d="M6.5 17v1.8M17.5 17v1.8M7 14h1.5M15.5 14H17"/>'),
    journal: line('<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5v17M12.5 8.5h3.5M12.5 12h3.5"/>'),
    talk: line('<path d="M20 11.5a7.5 7.5 0 0 1-11.2 6.5L4 19.5l1.5-4.3A7.5 7.5 0 1 1 20 11.5z"/><path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01"/>'),
    hand: line('<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10M12 10V4.5a1.5 1.5 0 0 1 3 0V10M15 10V6.5a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.7-2.3L4.5 14a1.5 1.5 0 0 1 2.3-1.9L9 14"/>'),
    ear: line('<path d="M7 9.5a5 5 0 1 1 10 0c0 3-2.5 3.5-3 6s-1.5 4-3.5 4A3 3 0 0 1 8 17"/><path d="M10 10a2 2 0 1 1 3.4 1.4c-.9.8-1.4 1.2-1.4 2.4"/>'),
    jisho: '<svg class="ic ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16l8-8M9.5 8H16v6.5"/></svg>',
  };

  const MEET = { id: "meet", no: 0, name: "Meet the page", verb: "See it, hear it, tap the words" };
  const MODES = [
    { id: "recall", no: 1, name: "Recall", verb: "Say it yourself" },
    { id: "listen", no: 2, name: "Listen & Notice", verb: "Tap what you heard" },
    { id: "patterns", no: 3, name: "Pattern Lab", verb: "Swap a piece, say the new sentence" },
    { id: "moment", no: 4, name: "In the Moment", verb: "She speaks, you answer out loud" },
  ];
  const FLOW = [MEET].concat(MODES);
  const labelOf = (m) => (m.no ? m.no + " · " + m.name : m.name);
  const POS_NAME = { n: "noun", v: "verb", adj: "adjective", adv: "adverb", prt: "particle", cop: "copula", aux: "auxiliary", conj: "conjunction", expr: "expression" };

  // ---- the book's structure: levels are chapters, lessons are their pages ----
  const chapters = LEVELS.map((level, index) => {
    const themes = (level.tiers || []).flatMap((t) => t.themes || []);
    return { level, index, lessons: LESSONS.filter((l) => themes.includes(l.section)) };
  });
  const order = chapters.flatMap((c) => c.lessons);
  const lessonById = (id) => LESSONS.find((l) => l.id === id);
  const chapterOf = (id) => chapters.find((c) => c.lessons.some((l) => l.id === id)) || chapters[0];
  const coverOf = (lesson) => "../assets/covers/" + lesson.id + ".png";
  const folioOf = (lesson) => { const c = chapterOf(lesson.id); return c.index + "–" + (c.lessons.indexOf(lesson) + 1); };

  // ---- state -----------------------------------------------------------------
  const fresh = () => ({ v: 2, cards: {}, readings: {}, met: {}, days: {}, total: 0, history: [], settings: { romaji: "show", cue: "en", driveMode: "hands" }, opened: false });
  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_) { saved = null; }
    const base = fresh();
    if (!saved) {
      // carry the Speaking Studio's review history over once (same card ids)
      try { const studio = JSON.parse(localStorage.getItem("hanasou.studio.v1") || "null"); if (studio && studio.cards) base.cards = Object.assign({}, studio.cards); } catch (_) {}
      return base;
    }
    const out = Object.assign(base, saved, { settings: Object.assign(base.settings, saved.settings || {}) });
    out.met = out.met || {};
    // pages read before "Meet" existed count as met
    Object.keys(out.readings || {}).forEach((id) => { if (Object.keys(out.readings[id] || {}).length) out.met[id] = out.met[id] || 1; });
    return out;
  }
  const state = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) {} }
  const dayKey = (d) => (d || new Date()).toLocaleDateString("en-CA");

  // the Speaking Studio's SRS, unchanged: again resets, hard grows slowly, good doubles
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
  const started = (id) => !!(state.met[id] || doneCount(id));
  // where a lesson picks up: Meet first, then the first exercise not done
  function nextStepFor(id) {
    if (!state.met[id]) return MEET;
    return MODES.find((m) => !readingsOf(id)[m.id]) || MODES[0];
  }
  function nextLesson() { return order.find((l) => !chapterDone(l.id)) || order[0]; }
  const known = (id) => !!(state.cards[id] && state.cards[id].reps > 0);
  // every sentence you've practised in the book: the drive's and the review's pool
  function learnedCards() {
    return Object.keys(state.cards)
      .filter((id) => /#\d+$/.test(id) && state.cards[id].reps > 0)
      .map((id) => ({ id, card: state.cards[id], lesson: lessonById(id.split("#")[0]), index: Number(id.split("#")[1]) }))
      .filter((x) => x.lesson && x.lesson.sentences[x.index])
      .map((x) => Object.assign(x, { sentence: x.lesson.sentences[x.index] }));
  }
  function dueCards() {
    const now = Date.now();
    return learnedCards().filter((x) => (x.card.due || 0) <= now).sort((a, b) => (a.card.due || 0) - (b.card.due || 0));
  }

  // ---- audio: VOICEVOX clips first, the device's Japanese voice as fallback ----
  // body.talking is set while a line plays: もち子 bobs, play buttons ripple.
  let manifest = null, player = null, release = null;
  const manifestReady = (typeof fetch === "function"
    ? fetch("../audio/manifest.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    : Promise.resolve(null)).then((m) => { manifest = m; return m; });
  const plain = (s) => String(s || "").replace(/\[[^\]]*\]/g, "");
  function clipFor(jp) { const c = manifest && manifest.clips; return c ? c[jp] || c[plain(jp)] || null : null; }
  const setTalking = (on) => document.body.classList.toggle("talking", !!on);
  // stops whatever is sounding and lets anything waiting on it carry on
  function stopAudio() {
    if (player) { try { player.pause(); } catch (_) {} player = null; }
    if ("speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (_) {} }
    setTalking(false);
    if (release) { const r = release; release = null; r(); }
  }
  function speakTTS(text, lang, rate) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(guess); resolve(); } };
      const guess = setTimeout(finish, T(800 + text.length * (lang === "en-US" ? 70 : 200)));
      release = finish;
      if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance !== "function") return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
      if (voice) u.voice = voice;
      u.onend = u.onerror = finish;
      window.speechSynthesis.speak(u);
    });
  }
  // resolves when the Japanese line has finished (or was stopped)
  let playToken = 0;
  function play(jp, slow) {
    if (!jp) return Promise.resolve();
    stopAudio();
    const token = ++playToken;
    return manifestReady.then(() => new Promise((resolve) => {
      let finished = false, fellBack = false;
      const finish = () => { if (!finished) { finished = true; if (token === playToken) setTalking(false); resolve(); } };
      const fallback = () => { if (fellBack) return; fellBack = true; speakTTS(plain(jp), "ja-JP", slow ? 0.72 : 0.9).then(finish); };
      if (token !== playToken) { finish(); return; }
      setTalking(true);
      release = finish;
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
  // the hands-free cue: the meaning, spoken by the device's English voice
  function sayEnglish(text) {
    stopAudio();
    return speakTTS(String(text || "").replace(/[()[\]]/g, " ").replace(/\s+/g, " ").trim(), "en-US", 1);
  }
  // a wait that stopAudio() can cut short
  function pauseFor(ms) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(t); resolve(); } };
      const t = setTimeout(finish, T(ms));
      release = finish;
    });
  }
  const sayTime = (jp) => 900 + plain(jp).replace(/\s/g, "").length * 190;

  // ---- Japanese text, the flashcard way ---------------------------------------
  // kanji[reading] → <ruby>
  const rubyHTML = (jp) => esc(jp).replace(/([一-鿿々]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
  const showRomaji = () => state.settings.romaji !== "hide";
  // the sentence itself, each word coloured by its role
  function colorJP(s) {
    const jp = (s && s.jp) || "", words = (s && s.words) || [];
    if (!words.length || /\[/.test(jp)) return rubyHTML(jp);
    let out = "", wi = 0, off = 0, buf = "";
    for (const ch of jp) {
      const w = words[wi];
      if (w && w.jp[off] === ch) {
        buf += ch; off++;
        if (off >= w.jp.length) { out += '<span class="w t-' + esc(w.pos || "expr") + '">' + esc(buf) + "</span>"; buf = ""; off = 0; wi++; }
      } else if (off > 0 && /\s/.test(ch)) buf += ch;   // a phrase break inside one word
      else if (off > 0) return rubyHTML(jp);
      else out += esc(ch);
    }
    return wi < words.length ? rubyHTML(jp) : out;
  }
  // every word as a chip: meaning under it, coloured by role, tap to hear, ↗ Jisho
  function chipHTML(w, cls) {
    const pos = w.pos || "expr";
    return '<span class="wchip pos-' + esc(pos) + (cls ? " " + cls : "") + '">' +
      '<button type="button" class="wc-main" data-say="' + esc(w.jp) + '" title="Hear this word"><b>' + esc(w.jp) + "</b><small>" + esc(w.en) + "</small>" + (POS_NAME[pos] ? "<i>" + POS_NAME[pos] + "</i>" : "") + "</button>" +
      '<a class="wc-jisho" href="https://jisho.org/search/' + encodeURIComponent(plain(w.jp)) + '" target="_blank" rel="noopener noreferrer" aria-label="Look up ' + esc(w.jp) + ' on Jisho">' + ICON.jisho + "</a></span>";
  }
  const chipsHTML = (words, changed) => (words || []).map((w, i) => chipHTML(w, changed && changed.includes(i) ? "changed" : "")).join("");
  // the sentence with each word's meaning set under it (for a quick glance)
  function glossLine(s) {
    const words = (s && s.words) || [];
    if (!words.length) return '<p class="gloss plain">' + rubyHTML((s && s.jp) || "") + "</p>";
    return '<p class="gloss">' + words.map((w) => '<span class="gl"><b class="w t-' + esc(w.pos || "expr") + '">' + esc(w.jp) + "</b><small>" + esc(w.en) + "</small></span>").join("") + "</p>";
  }
  // the answer as the flashcards show it
  function answerHTML(s, opts) {
    const o = opts || {};
    return '<div class="answer">' +
      '<div class="jp">' + colorJP(s) + "</div>" +
      (showRomaji() && s.romaji ? '<div class="romaji">' + esc(s.romaji) + "</div>" : "") +
      (o.en ? '<div class="en">' + esc(s.en) + "</div>" : "") +
      '<div class="answer-tools"><button class="pill" data-say="' + esc(s.jp) + '">' + ICON.sound + 'Hear</button><button class="pill" data-say-slow="' + esc(s.jp) + '">Slowly</button></div>' +
      ((s.words || []).length ? '<div class="chips">' + chipsHTML(s.words, o.changed) + "</div>" : "") +
      (o.note ? '<p class="note">' + esc(o.note) + "</p>" : "") +
      "</div>";
  }

  // ---- which pop-ups appear: hand-authored per lesson and per sentence -----
  // (scenes.js). Every picture literally matches its page. Art that isn't
  // drawn yet is skipped — nothing is ever swapped in for it.
  const sceneOf = (lesson) => (lesson && POPS[lesson.id]) || null;
  const drawn = (list) => (list || []).filter((o) => o && o.art && !MISSING.has(o.art));
  const worldOf = (lesson) => drawn((sceneOf(lesson) || {}).world);
  function propsOf(lesson, i) {
    const page = ((sceneOf(lesson) || {}).pages || []).find((p) => p.i === i);
    return page ? drawn(page.props) : [];
  }
  const indexOfId = (id) => { const m = /#(\d+)$/.exec(String(id || "")); return m ? Number(m[1]) : -1; };
  // a page's story: the lesson's world in the back row, the sentence's own
  // things in front (a world prop the page is about steps forward)
  function storyFor(lesson, index, opts) {
    const front = index >= 0 ? propsOf(lesson, index).slice(0, 3) : [];
    const world = worldOf(lesson).filter((o) => !front.some((f) => f.art === o.art)).slice(0, 2);
    return { world, objects: opts && opts.hideFront ? [] : front };
  }
  // the lesson at a glance: its world, plus its most-used things in front
  function chapterStory(lesson) {
    const world = worldOf(lesson).slice(0, 2);
    const count = {}, first = {};
    ((sceneOf(lesson) || {}).pages || []).forEach((p) => drawn(p.props).forEach((o) => {
      if (world.some((w) => w.art === o.art)) return;
      count[o.art] = (count[o.art] || 0) + 1;
      if (!first[o.art]) first[o.art] = Object.assign({}, o, { count: 1 });
    }));
    return { world, objects: Object.keys(first).sort((a, b) => count[b] - count[a]).slice(0, 2).map((k) => first[k]) };
  }
  // the lesson's postcard: its own, else its section's backdrop
  function postcardOf(lesson) {
    const sc = sceneOf(lesson) || {};
    const section = STORY + ((lesson && D.backdrops && D.backdrops[lesson.section]) || "bg-street.jpg");
    return { bg: sc.postcard && !sc.postcardNew ? STORY + sc.postcard + ".jpg" : section };
  }

  // ---- the pop-up stage --------------------------------------------------------
  // Flat layers in a fixed order so nothing swaps while rising: the painted
  // postcard → the lesson's world → もち子 → this page's props → speech bubbles.
  const AIR = { "bg-street.jpg": "petals", "bg-aquarium.jpg": "bubbles", "bg-onsen.jpg": "steam" };
  function airHTML(bg) {
    const kind = AIR[String(bg || "").split("/").pop()] || "motes";
    let out = '<div class="pop-air air-' + kind + '" aria-hidden="true">';
    for (let i = 0; i < 7; i++) out += '<i style="--x:' + (8 + i * 13 + (i % 2) * 4) + "%;--d:" + (i * 1.3).toFixed(1) + "s;--t:" + (7 + (i % 3) * 2) + 's"></i>';
    return out + "</div>";
  }
  // a prop: {art, say?, size?, count?}. pick: it's an answer you tap (Listen).
  function cutHTML(o, i, pick) {
    const n = Math.max(1, Math.min(5, Number(o.count) || 1));
    const img = '<img src="' + STORY + esc(o.art) + '.png" alt="">';
    const cls = "pop-cut" + (o.size === "big" || o.size === "small" ? " size-" + o.size : "") + (n > 1 ? " multi" : "");
    const inner = n > 1 ? new Array(n).fill(img).join("") : img;
    const style = ' style="--i:' + i + ";--n:" + n + '"';
    if (pick) return '<button type="button" class="' + cls + ' pick" data-pick="' + esc(o.art) + '"' + style + ' aria-label="Choose this picture">' + inner + "</button>";
    return o.say
      ? '<button type="button" class="' + cls + '"' + style + ' data-say="' + esc(o.say) + '" aria-label="Hear ' + esc(o.say) + '">' + inner + "</button>"
      : '<span class="' + cls + '"' + style + ">" + inner + "</span>";
  }
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
    const world = (opts.world || []).slice(0, 3), front = (opts.objects || []).slice(0, 3);
    let i = 0;
    const worldHTML = world.map((o) => cutHTML(o, i++)).join("");
    const guideHTML = opts.guide === false ? "" : '<span class="pop-cut pop-guide" style="--i:' + (i++) + '"><img src="' + STORY + "mochiko-" + (opts.guide || "think") + '.png" alt=""></span>';
    const frontHTML = front.map((o) => cutHTML(o, i++, opts.pick)).join("");
    const bg = opts.bg || STORY + "bg-street.jpg";
    host.innerHTML =
      '<div class="popup' + (front.length ? " has-front" : "") + (opts.pick ? " picking" : "") + (opts.compact ? " compact" : "") + '">' +
        '<div class="pop-tilt">' +
          '<div class="pop-back"><span class="pop-paint" style="background-image:url(\'' + esc(bg) + '\')"></span>' + airHTML(bg) + "</div>" +
          '<div class="pop-floor"></div>' +
          '<div class="pop-row pop-world n' + world.length + '">' + worldHTML + "</div>" +
          guideHTML +
          '<div class="pop-row pop-front n' + front.length + '">' + frontHTML + "</div>" +
          (opts.bubble ? '<div class="pop-bubble her" aria-live="polite" aria-label="' + esc(plain(opts.bubble)) + '"><b>' + rubyHTML(opts.bubble) + "</b></div>" : "") +
          (opts.you ? '<div class="pop-bubble you" aria-live="polite"><b></b></div>' : "") +
        "</div>" +
        (opts.caption ? '<span class="pop-caption">' + esc(opts.caption) + "</span>" : "") +
      "</div>";
    const stage = host.firstChild;
    if (opts.bubble) typeInto(stage.querySelector(".pop-bubble.her b"), opts.bubble, 780);
    if (reduceMotion) { stage.classList.add("is-open"); return stage; }
    // two frames so the flat state is painted before it rises
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("is-open")));
    return stage;
  }
  // a conversation on the page: your line in your bubble, then hers again
  function bubbleSay(host, who, jp) {
    const stage = host && host.querySelector(".popup");
    const bubble = stage && stage.querySelector(".pop-bubble." + who + " b");
    if (!bubble || !jp) return;
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
  function foldStage(host) {
    const stage = host && host.querySelector(".popup");
    if (stage) stage.classList.remove("is-open");
  }
  // washi paper scraps, only when a whole page of the book gets stamped
  function confetti() {
    if (reduceMotion) return;
    const layer = document.createElement("div");
    layer.className = "washi";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#d5412b", "#26355d", "#e2a41f", "#8fa3c8", "#f0c9bf", "#3d8b5f"];
    for (let i = 0; i < 24; i++) {
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
    stage.style.setProperty("--lean", (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + "deg");
  });

  // ---- screens, the page-turn leaf, and the one action bar ---------------------
  const SCREENS = ["cover", "home", "lesson", "reading", "drive", "journal"];
  let currentScreen = null;
  let drive = null;
  // screens push in from the right and pop back to the left, like turning to a page
  function show(id, opts) {
    const from = currentScreen;
    SCREENS.forEach((s) => { const el = $(s); el.classList.toggle("active", s === id); el.classList.remove("enter", "enter-back"); });
    if (from && from !== id && !(opts && opts.instant) && !reduceMotion) { void $(id).offsetWidth; $(id).classList.add(opts && opts.back ? "enter-back" : "enter"); }
    currentScreen = id;
    document.body.dataset.screen = id;
    setDock(null);
    $("ribbons").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.nav === id));
    syncChrome();
    window.scrollTo(0, 0);
  }
  // the tab bar shows on the three main screens; the action bar replaces it
  function syncChrome() {
    const main = currentScreen === "home" || currentScreen === "journal" || (currentScreen === "drive" && !(drive && drive.running));
    $("ribbons").hidden = !main || !$("dock").hidden;
  }
  function turnPage(back) {
    const leaf = $("leaf");
    leaf.classList.remove("turning", "turning-back");
    void leaf.offsetWidth;
    leaf.classList.add(back ? "turning-back" : "turning");
  }
  $("leaf").addEventListener("animationend", () => $("leaf").classList.remove("turning", "turning-back"));
  // buttons: [{label, sub?, on, kind?: "primary"|"tint"|"good"|"warn"|"mid", id?, icon?}]
  function setDock(buttons) {
    const dock = $("dock");
    dock.innerHTML = "";
    dock.hidden = !buttons || !buttons.length;
    (buttons || []).forEach((b) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "btn btn-" + (b.kind || "primary");
      if (b.id) el.id = b.id;
      el.innerHTML = '<span class="btn-label">' + esc(b.label) + (b.sub ? "<small>" + esc(b.sub) + "</small>" : "") + "</span>" + (b.icon === false ? "" : b.icon || "");
      el.addEventListener("click", b.on);
      dock.appendChild(el);
    });
    dock.dataset.count = String((buttons || []).length);
    syncChrome();
  }
  const NEXT = (id, label, on, sub) => ({ id, label, sub, on, icon: ICON.next });

  // ---- cover -------------------------------------------------------------------
  function openBook() {
    state.opened = true; save();
    renderHome();
    if (reduceMotion) { show("home", { instant: true }); return; }
    $("cover").classList.add("opening");
    setTimeout(() => { $("cover").classList.remove("opening"); show("home", { instant: true }); }, 700);
  }

  // ---- the book (home) -----------------------------------------------------------
  // five small ticks: Meet + the four exercises
  function ticksHTML(id) {
    const done = [!!state.met[id]].concat(MODES.map((m) => !!readingsOf(id)[m.id]));
    return '<span class="ticks" role="img" aria-label="' + done.filter(Boolean).length + ' of 5 steps done">' + done.map((d) => "<i" + (d ? ' class="on"' : "") + "></i>").join("") + "</span>";
  }
  function renderHome() {
    const next = nextLesson();
    const ch = chapterOf(next.id);
    const step = nextStepFor(next.id);
    $("continue").innerHTML =
      '<button class="hero-stage stage" id="continue-stage" aria-label="Open ' + esc(next.title) + '"></button>' +
      '<div class="hero-copy"><p class="eyebrow">Chapter ' + ch.index + " · " + esc(ch.level.title) + '<span class="folio">' + folioOf(next) + "</span></p>" +
        "<h2>" + esc(next.title) + "</h2>" + ticksHTML(next.id) + "</div>" +
      '<button class="btn btn-primary" id="continue-btn"><span class="btn-label">' + (started(next.id) ? "Continue" : "Begin") + "<small>" + esc(labelOf(step)) + "</small></span>" + ICON.next + "</button>";
    popup($("continue-stage"), Object.assign({ compact: true, guide: "think" }, postcardOf(next), chapterStory(next)));
    $("continue-stage").addEventListener("click", () => openLesson(next.id));
    $("continue-btn").addEventListener("click", () => startLesson(next.id));

    const plan = drivePlan();
    const pool = encounterPool();
    $("tiles").innerHTML =
      '<button class="tile tile-drive" id="tile-drive"><span class="tile-icon">' + ICON.car + "</span><b>Drive</b><small>" + (plan.learned ? plural(plan.lines, "line") + " ready" : "A first listen") + "</small></button>" +
      '<button class="tile" id="tile-meet"><span class="tile-icon">' + ICON.talk + "</span><b>Encounters</b><small>She asks, you answer</small></button>";
    $("tile-drive").addEventListener("click", () => { renderDrive(); show("drive"); });
    $("tile-meet").addEventListener("click", startEncounters);
    $("tile-meet").disabled = !pool.length;

    const due = dueCards().length;
    $("due-banner").hidden = !due;
    $("due-banner").innerHTML = "<span><b>" + plural(due, "line") + "</b> due for a second look</span>" + ICON.chevron;
    $("home-note").textContent = state.total ? plural(state.total, "line") + " said" : "";

    const toc = $("toc");
    toc.innerHTML = "";
    chapters.forEach((c) => {
      if (!c.lessons.length) return;
      const done = c.lessons.filter((l) => chapterDone(l.id)).length;
      const det = document.createElement("details");
      det.className = "chapter-toc";
      det.open = c.lessons.some((l) => l.id === next.id);
      det.innerHTML =
        '<summary><span class="ch-no">' + c.index + '</span><span class="ch-copy"><b>' + esc(c.level.title) + "</b><small>" + esc(c.level.blurb) + '</small></span><span class="ch-count">' + done + "/" + c.lessons.length + "</span></summary>" +
        '<div class="toc-lines">' + c.lessons.map((l, i) =>
          '<button class="toc-line' + (l.id === next.id ? " here" : "") + (chapterDone(l.id) ? " done" : "") + '" data-lesson="' + esc(l.id) + '">' +
            '<span class="toc-n">' + (i + 1) + '</span><span class="toc-t">' + esc(l.title) + "</span>" + ticksHTML(l.id) +
          "</button>").join("") + "</div>";
      toc.appendChild(det);
    });
    toc.querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => openLesson(b.dataset.lesson)));

    $("trips").innerHTML = (D.sideTrips || []).map((t, i) =>
      '<button class="toc-line" data-trip="' + esc(t.id) + '"><span class="toc-n">' + String.fromCharCode(65 + i) + '</span><span class="toc-t">' + esc(t.title) + '</span><span class="toc-place">' + esc((t.place || "").toLowerCase()) + "</span></button>").join("");
    $("trips").querySelectorAll("[data-trip]").forEach((b) => b.addEventListener("click", () => startSideTrip(b.dataset.trip)));
  }
  function goHome(opts) { renderHome(); show("home", opts); }

  // ---- a lesson (one page of the book) --------------------------------------------
  function openLesson(id, opts) {
    const lesson = lessonById(id);
    if (!lesson) return;
    const c = chapterOf(id);
    $("lesson-kicker").textContent = "Chapter " + c.index + " · " + c.level.title;
    $("lesson-page").textContent = folioOf(lesson);
    $("lesson-title").textContent = lesson.title;
    $("lesson-grammar").innerHTML = '<span class="tape" aria-hidden="true"></span>' + (lesson.grammar ? '<b class="note-jp">' + esc(lesson.grammar) + "</b>" : "") + "<p>" + esc(lesson.grammarNote || lesson.section || "") + "</p>";
    const step = nextStepFor(id);
    const allDone = chapterDone(id);
    $("lesson-readings").innerHTML = FLOW.map((m, i) => {
      const done = m === MEET ? !!state.met[id] : !!readingsOf(id)[m.id];
      const isNext = !allDone && m.id === step.id;
      return '<li style="--i:' + i + '"><button class="step' + (done ? " done" : "") + (isNext ? " next" : "") + '" data-mode="' + m.id + '">' +
        '<span class="step-dot">' + (done ? ICON.check : m.no || ICON.book) + '</span><span class="step-copy"><b>' + esc(m.name) + "</b><small>" + esc(m.verb) + "</small></span>" +
        '<span class="step-go">' + (isNext ? "Next" : "") + ICON.chevron + "</span></button></li>";
    }).join("");
    $("lesson-readings").querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => startLesson(id, b.dataset.mode)));
    show("lesson", opts);
    popup($("lesson-stage"), Object.assign({ caption: lesson.section }, postcardOf(lesson), chapterStory(lesson)));
    setDock([NEXT("lesson-start", allDone ? "Read again" : started(id) ? "Continue" : "Begin", () => startLesson(id), labelOf(allDone ? MODES[0] : step))]);
  }

  // ---- building each exercise from real content -----------------------------------
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
      pairs.push({ kind: "pair", id: b.id, lesson, source: a.sentence, sentence: b.sentence, changed: diff });
    }
    return pairs;
  }
  // wrong answers for a swap: other real words of the same kind from this lesson
  function swapOptions(lesson, target, sourceWord) {
    const pool = [];
    const add = (w) => { if (w && w.jp && w.jp !== target.jp && w.jp !== sourceWord.jp && !pool.some((p) => p.jp === w.jp)) pool.push(w); };
    const all = (lesson.sentences || []).flatMap((s) => s.words || []).concat(lesson.vocab || []);
    all.filter((w) => w.pos === target.pos).forEach(add);
    if (pool.length < 2) all.filter((w) => w.pos !== "prt" && w.pos !== "cop").forEach(add);
    return shuffle([target].concat(shuffle(pool).slice(0, 2)));
  }
  function buildPatterns(lesson) {
    const curated = (D.transforms || []).filter((t) => t.lessonId === lesson.id).map((t) => ({
      kind: "reveal", id: t.id, lesson, note: t.note,
      source: { en: t.sourceEnglish, jp: t.sourceJp }, sentence: { en: t.prompt.replace(/^(Say|Ask):\s*/, ""), jp: t.target, romaji: "", words: [] },
    }));
    const items = curated.concat(shuffle(patternPairs(lesson))).slice(0, 4);
    if (items.length) return items;
    // no swappable pair in this lesson: assemble the sentence from its chips;
    // a lesson of one-word lines (reactions) just says each one fresh
    const buildable = sentenceItems(lesson).filter((x) => (x.sentence.words || []).length >= 3).slice(0, 4);
    if (buildable.length) return buildable.map((x) => Object.assign({ kind: "build" }, x));
    return sentenceItems(lesson).slice(0, 4).map((x) => Object.assign({ kind: "recall" }, x));
  }
  // Listen: when the sentence has a picture, you answer by tapping it among
  // other pictures from the same lesson (no text). Otherwise you pick the meaning.
  function buildListen(lesson) {
    const all = sentenceItems(lesson);
    const chapterLessons = chapterOf(lesson.id).lessons;
    const artPool = (ls) => ls.flatMap((l) => ((sceneOf(l) || {}).pages || []).flatMap((p) => drawn(p.props)));
    return shuffle(all).slice(0, 5).map((x) => {
      const own = propsOf(lesson, indexOfId(x.id));
      if (own.length) {
        const target = own[0], others = [];
        artPool([lesson]).concat(artPool(chapterLessons)).forEach((o) => {
          if (!own.some((p) => p.art === o.art) && !others.some((p) => p.art === o.art)) others.push({ art: o.art, say: o.say });
        });
        if (others.length >= 2) {
          return Object.assign({ kind: "picture", target: target.art, choices: shuffle([{ art: target.art, say: target.say }].concat(shuffle(others).slice(0, 2))) }, x);
        }
      }
      const near = shuffle(all.filter((o) => o.sentence.en !== x.sentence.en)).map((o) => o.sentence.en);
      const far = shuffle(chapterLessons.flatMap(sentenceItems).filter((o) => o.sentence.en !== x.sentence.en)).map((o) => o.sentence.en);
      return Object.assign({ kind: "meaning", choices: shuffle([x.sentence.en].concat(Array.from(new Set(near.concat(far))).slice(0, 2))) }, x);
    });
  }
  // In the Moment: the lesson's hand-written scene as turns of
  // "her line → you answer out loud → a model reply". follow = what she says next.
  function buildMoment(lesson) {
    const scene = TALK.find((s) => s.lesson === lesson.id);
    if (scene) return sceneTurns(scene, lesson);
    const trip = (D.sideTrips || []).find((t) => t.level === "L0") || (D.sideTrips || [])[0];
    return trip ? tripTurns(trip) : null;
  }
  function sceneTurns(scene, lesson) {
    const convo = { title: scene.en || scene.title, sceneTitle: scene.title, lesson, speaker: "もち子さん", turns: [], closing: null };
    let them = null;
    scene.steps.forEach((step) => {
      if (step.who !== "you") {
        them = { jp: step.jp, en: step.en, speaker: convo.speaker };
        const prev = convo.turns[convo.turns.length - 1];
        if (prev && !prev.follow) prev.follow = { jp: step.jp, en: step.en };
        return;
      }
      const taught = (lesson.sentences || []).find((x) => x.jp === step.jp);
      convo.turns.push({
        kind: "turn", id: "scene:" + scene.id + ":" + convo.turns.length, convo,
        them, ctx: step.ctx || "Your turn.",
        model: { jp: step.jp, en: step.en, romaji: step.romaji, words: taught ? taught.words : [] },
        pageIndex: taught ? lesson.sentences.indexOf(taught) : -1,
      });
      them = null;
    });
    const last = scene.steps[scene.steps.length - 1];
    if (last && last.who !== "you") convo.closing = { jp: last.jp, en: last.en };
    return convo;
  }
  function tripTurns(trip) {
    const convo = { title: trip.title, sceneTitle: trip.place, trip, speaker: "", turns: [], closing: null };
    trip.turns.forEach((t, i) => {
      const right = t.choices.find((c) => c.correct) || t.choices[0];
      convo.turns.push({
        kind: "turn", id: "conversation:" + trip.id + ":" + i, convo,
        them: { jp: t.jp, en: t.en, speaker: t.speaker }, ctx: t.speaker + " is talking to you.",
        model: { jp: right.jp, en: right.en, words: [] }, reply: right.replyJp ? { jp: right.replyJp, en: right.replyEn } : null, pageIndex: -1,
      });
    });
    return convo;
  }
  // Encounters: every moment where someone speaks first and you have to answer.
  // From the pages you've started; before that, from the everyday side trips.
  function encounterPool(lessons) {
    const from = lessons || order.filter((l) => started(l.id) || sentenceItems(l).some((x) => known(x.id)));
    const turns = from.flatMap((l) => { const sc = TALK.find((t) => t.lesson === l.id); return sc ? sceneTurns(sc, l).turns.filter((t) => t.them) : []; });
    if (turns.length >= 4 || lessons) return turns;
    return turns.concat((D.sideTrips || []).filter((t) => t.level === "L0" || t.level === "L1").flatMap((t) => tripTurns(t).turns));
  }
  function itemsFor(lesson, modeId) {
    if (modeId === "meet") return sentenceItems(lesson).map((x) => Object.assign({ kind: "meet" }, x));
    if (modeId === "recall") return sentenceItems(lesson).map((x) => Object.assign({ kind: "recall" }, x));
    if (modeId === "listen") return buildListen(lesson);
    if (modeId === "patterns") return buildPatterns(lesson);
    const convo = buildMoment(lesson);
    return convo ? convo.turns : [];
  }

  // ---- a reading session: one continuous flow ---------------------------------------
  // queue: pages, with a short "bridge" between exercises. Finishing the last
  // page of an exercise marks it done, so you can stop anywhere.
  let session = null;
  function startLesson(lessonId, fromId) {
    const lesson = lessonById(lessonId);
    if (!lesson) return;
    const from = fromId ? FLOW.find((m) => m.id === fromId) || MEET : chapterDone(lessonId) ? MODES[0] : nextStepFor(lessonId);
    const queue = [];
    let prev = null;
    for (let k = FLOW.indexOf(from); k < FLOW.length; k++) {
      const mode = FLOW[k];
      const items = itemsFor(lesson, mode.id);
      if (!items.length) continue;
      if (prev) queue.push({ type: "bridge", mode, prev });
      items.forEach((item) => queue.push({ type: "page", mode, item }));
      prev = mode;
    }
    session = { kind: "lesson", lesson, queue, pos: 0, said: 0, strip: [], wasDone: chapterDone(lessonId) };
    beginSession();
  }
  function startReview() {
    const pages = dueCards().slice(0, 10).map((x) => ({ type: "page", mode: MODES[0], item: { kind: "recall", id: x.id, lesson: x.lesson, sentence: x.sentence } }));
    if (!pages.length) return;
    session = { kind: "review", title: "Second look", lesson: null, queue: pages, pos: 0, said: 0, strip: [] };
    beginSession();
  }
  function startSideTrip(id) {
    const trip = (D.sideTrips || []).find((t) => t.id === id);
    if (!trip) return;
    session = { kind: "trip", title: trip.title, lesson: null, queue: tripTurns(trip).turns.map((item) => ({ type: "page", mode: MODES[3], item })), pos: 0, said: 0, strip: [] };
    beginSession();
  }
  function startEncounters() {
    const turns = shuffle(encounterPool()).slice(0, 6);
    if (!turns.length) return;
    session = { kind: "encounter", title: "Encounters", lesson: null, queue: turns.map((item) => ({ type: "page", mode: MODES[3], item })), pos: 0, said: 0, strip: [] };
    beginSession();
  }
  function beginSession() {
    stopDrive();
    const s = session;
    // the progress bar: one segment per exercise in this session
    s.segs = [];
    s.queue.forEach((q) => { if (q.type === "page" && !s.segs.includes(q.mode)) s.segs.push(q.mode); });
    $("segbar").innerHTML = s.segs.map(() => "<i><b></b></i>").join("");
    show("reading");
    renderStep();
  }
  function paintProgress() {
    const s = session;
    const bars = $("segbar").querySelectorAll("b");
    s.segs.forEach((mode, k) => {
      const pages = s.queue.map((q, i) => ({ q, i })).filter((x) => x.q.type === "page" && x.q.mode === mode);
      const done = pages.filter((x) => x.i < s.pos).length;
      if (bars[k]) bars[k].style.width = (pages.length ? (done / pages.length) * 100 : 0) + "%";
    });
  }
  function closeReading() {
    stopAudio();
    const s = session;
    session = null;
    if (s && s.kind === "lesson") openLesson(s.lesson.id, { back: true });
    else goHome({ back: true });
  }
  // an exercise is done once its last page is behind you
  function markBehind(s, pos) {
    const here = s.queue[pos], after = s.queue[pos + 1];
    if (s.kind !== "lesson" || !here || here.type !== "page") return;
    if (after && after.type === "page" && after.mode === here.mode) return;
    if (here.mode === MEET) state.met[s.lesson.id] = Date.now();
    else state.readings[s.lesson.id] = Object.assign({}, readingsOf(s.lesson.id), { [here.mode.id]: Date.now() });
    save();
  }
  // fold the spread flat, turn the page, let the next one rise
  function nextItem() {
    stopAudio();
    const mine = session;
    if (!mine) return;
    const go = () => {
      if (session !== mine) return;
      markBehind(mine, mine.pos);
      mine.pos++;
      if (!reduceMotion) turnPage(false);
      renderStep();
    };
    if (reduceMotion) { go(); return; }
    foldStage($("reading-stage"));
    setTimeout(go, 240);
  }
  function renderStep() {
    const s = session;
    setDock(null);
    paintProgress();
    if (s.pos >= s.queue.length) { finishSession(); return; }
    const step = s.queue[s.pos];
    const mode = step.mode;
    $("reading-title").textContent = s.title || mode.name;
    if (step.type === "bridge") { $("reading-page").textContent = ""; renderBridge(step); return; }
    const same = s.queue.filter((q) => q.type === "page" && q.mode === mode);
    $("reading-page").textContent = (same.indexOf(step) + 1) + "/" + same.length;
    const item = step.item;
    if (item.kind === "meet") renderMeet(item);
    else if (item.kind === "recall") renderRecall(item);
    else if (item.kind === "picture" || item.kind === "meaning") renderListen(item);
    else if (item.kind === "pair") renderSwap(item);
    else if (item.kind === "build") renderBuild(item);
    else if (item.kind === "reveal") renderReveal(item);
    else renderTurn(item);
    window.scrollTo(0, 0);
  }
  const body = () => $("reading-body");
  const stageFor = (item, extra) => popup($("reading-stage"), Object.assign({ guide: "think" }, postcardOf(item.lesson || (session && session.lesson)), extra || {}));
  function bringIn(el) { if (el && el.scrollIntoView && !reduceMotion) { try { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {} } }
  const GRADES = (item, after) => [
    { label: "Not yet", kind: "warn", id: "grade-again", icon: false, on: () => grade(item, "again", after) },
    { label: "Almost", kind: "mid", id: "grade-hard", icon: false, on: () => grade(item, "hard", after) },
    { label: "Got it", kind: "good", id: "grade-good", icon: false, on: () => grade(item, "good", after) },
  ];
  function grade(item, result, after) {
    recordAttempt(item.id, result);
    session.said++;
    setGuide($("reading-stage"), result === "good" ? "thumbs" : "think");
    setDock(null);
    const mine = session;
    const go = after || nextItem;
    if (reduceMotion) go();
    else setTimeout(() => { if (session === mine) go(); }, 280);
  }
  const LABEL = (text) => '<p class="label">' + esc(text) + "</p>";

  // Meet: the page itself — picture, sentence, every word explained. No test.
  function renderMeet(item) {
    const s = item.sentence;
    stageFor(item, storyFor(item.lesson, indexOfId(item.id)));
    body().innerHTML = LABEL("Meet the page") + '<p class="meaning">' + esc(s.en) + "</p>" + answerHTML(s) +
      (s.hint ? '<p class="hint">' + esc(s.hint) + "</p>" : "");
    say(s.jp);
    setDock([NEXT("meet-next", "Next", nextItem)]);
  }

  // 1 · Recall: the meaning → you say it → check yourself.
  function renderRecall(item) {
    const s = item.sentence;
    stageFor(item, storyFor(item.lesson, indexOfId(item.id)));
    body().innerHTML = LABEL("Say it in Japanese") + '<h2 class="prompt">' + esc(s.en) + "</h2>" +
      '<p class="hint">' + esc(s.hint || "Say it out loud first.") + '</p><div id="answer-slot"></div>';
    setDock([{ id: "reveal", label: "I said it", sub: "Show the answer", icon: ICON.next, on: () => {
      $("answer-slot").innerHTML = answerHTML(s);
      say(s.jp);
      setDock(GRADES(item));
      bringIn($("answer-slot"));
    } }]);
  }

  // 2 · Listen: no text. Hear it, tap the picture it's about (or its meaning).
  function renderListen(item) {
    const s = item.sentence;
    const picture = item.kind === "picture";
    stageFor(item, picture ? { objects: item.choices, pick: true } : storyFor(item.lesson, indexOfId(item.id), { hideFront: true }));
    body().innerHTML = LABEL("Listen first") +
      '<div class="listen-row"><button class="big-play" id="listen-play" aria-label="Play again">' + ICON.play + '</button><div><h2 class="prompt small">' + (picture ? "Tap what you heard." : "What did you hear?") + '</h2><button class="pill" data-say-slow="' + esc(s.jp) + '">Slowly</button></div></div>' +
      (picture ? "" : '<div class="choices">' + item.choices.map((c) => '<button class="choice" data-choice="' + esc(c) + '">' + esc(c) + "</button>").join("") + "</div>") +
      '<div id="answer-slot"></div>';
    $("listen-play").addEventListener("click", () => say(s.jp));
    say(s.jp);
    let misses = 0, answered = false;
    const done = () => {
      answered = true;
      recordAttempt(item.id, misses ? "again" : "good");
      session.said++;
      setGuide($("reading-stage"), misses ? "think" : "thumbs");
      $("answer-slot").innerHTML = '<p class="say-back">' + (misses ? "Here's what you heard." : "You caught it.") + " Now say it once, out loud.</p>" + answerHTML(s, { en: true });
      setDock([NEXT("listen-next", "Next", nextItem)]);
      bringIn($("answer-slot"));
    };
    if (picture) {
      $("reading-stage").querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
        if (answered || b.disabled) return;
        const choice = item.choices.find((c) => c.art === b.dataset.pick);
        if (b.dataset.pick !== item.target) {
          misses++;
          b.disabled = true; b.classList.add("wrong");
          if (choice && choice.say) say(choice.say);   // the wrong picture says its own word
          return;
        }
        b.classList.add("right");
        $("reading-stage").querySelectorAll("[data-pick]").forEach((x) => { x.disabled = true; if (x !== b) x.classList.add("fade"); });
        done();
      }));
    } else {
      body().querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
        if (answered || b.disabled) return;
        if (b.dataset.choice !== s.en) { misses++; b.disabled = true; b.classList.add("wrong"); return; }
        b.classList.add("right");
        body().querySelectorAll("[data-choice]").forEach((x) => { x.disabled = true; });
        popup($("reading-stage"), Object.assign({ guide: "think" }, postcardOf(item.lesson), storyFor(item.lesson, indexOfId(item.id))));
        done();
      }));
    }
  }

  // 3 · Pattern Lab: a sentence you know, with one piece to swap.
  function renderSwap(item) {
    const src = item.source, s = item.sentence;
    stageFor(item, storyFor(item.lesson, indexOfId(item.id), { hideFront: true }));
    let slot = 0, misses = 0;
    const lineHTML = () => src.words.map((w, k) => {
      const ci = item.changed.indexOf(k);
      if (ci < 0) return chipHTML(w, "still");
      return ci < slot ? chipHTML(s.words[k], "swapped") : chipHTML(w, ci === slot ? "slot" : "slot waiting");
    }).join("");
    const draw = () => {
      const k = item.changed[slot];
      $("swap-line").innerHTML = lineHTML();
      if (slot >= item.changed.length) {
        $("swap-options").innerHTML = "";
        $("swap-ask").textContent = "Now say the whole sentence.";
        say(s.jp);
        recordAttempt(item.id, misses ? "hard" : "good");
        session.said++;
        popup($("reading-stage"), Object.assign({ guide: "thumbs" }, postcardOf(item.lesson), storyFor(item.lesson, indexOfId(item.id))));
        $("answer-slot").innerHTML = '<div class="answer slim">' + (showRomaji() && s.romaji ? '<div class="romaji">' + esc(s.romaji) + "</div>" : "") + '<div class="answer-tools"><button class="pill" data-say="' + esc(s.jp) + '">' + ICON.sound + 'Hear</button><button class="pill" data-say-slow="' + esc(s.jp) + '">Slowly</button></div></div>';
        setDock([NEXT("swap-next", "Next", nextItem)]);
        return;
      }
      const target = s.words[k];
      $("swap-ask").innerHTML = "Swap <b>" + esc(src.words[k].en) + "</b>. Which piece makes it right?";
      $("swap-options").innerHTML = swapOptions(item.lesson, target, src.words[k]).map((w) =>
        '<button type="button" class="wchip option pos-' + esc(w.pos || "expr") + '" data-option="' + esc(w.jp) + '"><span class="wc-main"><b>' + esc(w.jp) + "</b><small>" + esc(w.en) + "</small></span></button>").join("");
      $("swap-options").querySelectorAll("[data-option]").forEach((b) => b.addEventListener("click", () => {
        say(b.dataset.option);
        if (b.dataset.option !== target.jp) { misses++; b.disabled = true; b.classList.add("wrong"); return; }
        slot++;
        draw();
      }));
    };
    body().innerHTML = LABEL("Change one piece") +
      '<p class="from">You can say <em>' + esc(src.en) + '</em></p><div class="swap-line" id="swap-line"></div>' +
      '<h2 class="prompt small">Now say: ' + esc(s.en) + '</h2><p class="hint" id="swap-ask"></p>' +
      '<div class="swap-options" id="swap-options"></div><div id="answer-slot"></div>';
    draw();
  }
  // Pattern Lab, when a lesson has no swappable pair: put the sentence together.
  function renderBuild(item) {
    const s = item.sentence;
    stageFor(item, storyFor(item.lesson, indexOfId(item.id)));
    const bank = shuffle(s.words.map((w, i) => ({ w, i })));
    let placed = [], tries = 0;
    body().innerHTML = LABEL("Put it together") + '<h2 class="prompt">' + esc(s.en) + "</h2>" +
      '<p class="hint">Say it first, then tap the pieces in order.</p>' +
      '<div class="build-line" id="build-line"></div><div class="swap-options" id="build-bank">' +
      bank.map((b) => '<button type="button" class="wchip option pos-' + esc(b.w.pos || "expr") + '" data-piece="' + b.i + '"><span class="wc-main"><b>' + esc(b.w.jp) + "</b></span></button>").join("") +
      '</div><div id="answer-slot"></div>';
    $("build-bank").querySelectorAll("[data-piece]").forEach((btn) => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.piece);
      say(s.words[i].jp);
      btn.disabled = true; btn.classList.add("used");
      placed.push(i);
      $("build-line").insertAdjacentHTML("beforeend", '<span class="wchip still pos-' + esc(s.words[i].pos || "expr") + '"><span class="wc-main"><b>' + esc(s.words[i].jp) + "</b></span></span>");
      if (placed.length < s.words.length) return;
      tries++;
      if (!placed.every((v, k) => s.words[v].jp === s.words[k].jp)) {
        $("build-line").classList.add("shake");
        setTimeout(() => {
          placed = [];
          $("build-line").classList.remove("shake");
          $("build-line").innerHTML = "";
          $("build-bank").querySelectorAll("[data-piece]").forEach((x) => { x.disabled = false; x.classList.remove("used"); });
        }, T(600));
        return;
      }
      recordAttempt(item.id, tries === 1 ? "good" : "hard");
      session.said++;
      setGuide($("reading-stage"), "thumbs");
      $("answer-slot").innerHTML = answerHTML(s);
      say(s.jp);
      setDock([NEXT("build-next", "Next", nextItem)]);
      bringIn($("answer-slot"));
    }));
  }
  // Pattern Lab, hand-written transforms: start from one sentence, say the new one.
  function renderReveal(item) {
    const src = item.source, s = item.sentence;
    stageFor(item, {});
    body().innerHTML = LABEL("Change one piece") +
      '<div class="source-card"><small>You can say</small><div class="jp">' + rubyHTML(src.jp) + "</div><p>" + esc(src.en) + '</p><button class="pill" data-say="' + esc(src.jp) + '" aria-label="Hear it">' + ICON.sound + "</button></div>" +
      '<h2 class="prompt small">Now say: ' + esc(s.en) + '</h2><div id="answer-slot"></div>';
    setDock([{ id: "reveal", label: "I said it", sub: "Show the answer", icon: ICON.next, on: () => {
      $("answer-slot").innerHTML = answerHTML(s, { note: item.note });
      say(s.jp);
      setDock(GRADES(item));
      bringIn($("answer-slot"));
    } }]);
  }

  // 4 · In the Moment / Encounters: she speaks, you answer in Japanese out loud,
  // then you see one way to say it, and what she meant.
  function renderTurn(turn) {
    const s = session, convo = turn.convo, lesson = convo.lesson || null;
    const running = s.kind === "lesson" || s.kind === "trip";   // one conversation, in order
    popup($("reading-stage"), Object.assign({ guide: "think", you: true, bubble: turn.them ? turn.them.jp : "", caption: convo.sceneTitle },
      lesson ? postcardOf(lesson) : {}, lesson ? storyFor(lesson, turn.pageIndex) : {}));
    const strip = running ? s.strip.slice(-4).map((l) => '<p class="strip-line ' + l.who + '"><span>' + rubyHTML(l.jp) + "</span></p>").join("") : "";
    body().innerHTML = (strip ? '<div class="strip" aria-label="The conversation so far">' + strip + "</div>" : "") +
      (turn.them ? '<div class="them"><span class="who">' + esc(turn.them.speaker || "She") + ' says</span><button class="pill" data-say="' + esc(turn.them.jp) + '">' + ICON.sound + 'Again</button><button class="pill" id="them-en-toggle">What did she say?</button><p class="en" id="them-en" hidden>' + esc(turn.them.en) + "</p></div>" : "") +
      LABEL("Your turn") + '<h2 class="prompt small">' + esc(turn.ctx) + '</h2><p class="hint">Answer in Japanese, out loud.</p><div id="answer-slot"></div>';
    if (turn.them) say(turn.them.jp);
    const toggle = $("them-en-toggle");
    if (toggle) toggle.addEventListener("click", () => { $("them-en").hidden = !$("them-en").hidden; });
    const after = () => {
      if (turn.them) s.strip.push({ who: "her", jp: turn.them.jp });
      s.strip.push({ who: "you", jp: turn.model.jp });
      const nextStep = s.queue[s.pos + 1];
      const last = !nextStep || nextStep.type !== "page" || nextStep.mode !== s.queue[s.pos].mode;
      // in a running conversation her next line opens the next page; alone, show it here
      const reply = turn.reply || (running ? (last ? convo.closing : null) : turn.follow || null);
      if (!reply) { nextItem(); return; }
      bubbleSay($("reading-stage"), "her", reply.jp);
      say(reply.jp);
      s.strip.push({ who: "her", jp: reply.jp });
      $("answer-slot").innerHTML = '<div class="reply"><small>' + esc((turn.them && turn.them.speaker) || convo.speaker || "She") + ' answers</small><div class="jp">' + rubyHTML(reply.jp) + "</div><p>" + esc(reply.en || "") + "</p></div>";
      setDock([NEXT("turn-next", last ? (running ? "Finish the scene" : "Finish") : running ? "Keep talking" : "Next encounter", nextItem)]);
    };
    setDock([{ id: "reveal", label: "I answered", sub: "Show one way to say it", icon: ICON.next, on: () => {
      bubbleSay($("reading-stage"), "you", turn.model.jp);
      if ($("them-en")) $("them-en").hidden = false;   // and what she meant
      $("answer-slot").innerHTML = '<p class="say-back">One way to say it</p>' + answerHTML(turn.model, { en: true });
      say(turn.model.jp);
      setDock([
        { label: "Not quite", kind: "warn", id: "grade-again", icon: false, on: () => grade(turn, "again", after) },
        { label: "That's what I said", kind: "good", id: "grade-good", icon: false, on: () => grade(turn, "good", after) },
      ]);
      bringIn($("answer-slot"));
    } }]);
  }

  // between exercises: what's done, what's next — one tap to carry on
  function renderBridge(step) {
    const s = session;
    popup($("reading-stage"), Object.assign({ guide: "thumbs" }, postcardOf(s.lesson), chapterStory(s.lesson)));
    body().innerHTML = '<div class="bridge"><span class="tick-seal">' + ICON.check + "</span>" +
      '<p class="label">' + esc(step.prev.name) + " done</p><h2>Next: " + esc(step.mode.name) + "</h2><p>" + esc(step.mode.verb) + ".</p></div>" +
      '<button class="text-btn" id="bridge-stop">Stop here for now</button>';
    $("bridge-stop").addEventListener("click", closeReading);
    setDock([NEXT("bridge-next", "Continue", nextItem, labelOf(step.mode))]);
  }

  function finishSession() {
    const s = session;
    stopAudio();
    $("reading-page").textContent = "";
    const lesson = s.lesson;
    const stamped = s.kind === "lesson" && chapterDone(lesson.id) && !s.wasDone;
    popup($("reading-stage"), Object.assign({ guide: "cheer" }, lesson ? postcardOf(lesson) : {}, lesson ? chapterStory(lesson) : {}));
    const after = s.kind === "lesson" ? nextLesson() : null;
    const ready = learnedCards().length;
    body().innerHTML = '<div class="finish' + (stamped ? " big" : "") + '">' +
      (stamped ? '<span class="hanko' + (reduceMotion ? "" : " stamping") + '" aria-hidden="true">済</span>' : '<span class="tick-seal">' + ICON.check + "</span>") +
      '<p class="label">' + (s.kind === "review" ? "Second look done" : s.kind === "trip" ? "Side trip done" : s.kind === "encounter" ? "Encounters done" : stamped ? "Page stamped" : "Done for now") + "</p>" +
      "<h2>" + (stamped ? "よくできました" : "Nicely done.") + "</h2>" +
      "<p>" + (stamped ? "All four readings of " + esc(lesson.title) + ". " : "") +
        (s.said ? "You said " + plural(s.said, "line") + " out loud. " : "") +
        (ready ? plural(ready, "line") + (ready === 1 ? " is" : " are") + " ready for your next drive." : "") + "</p></div>";
    if (stamped) setTimeout(confetti, reduceMotion ? 0 : 500);
    const buttons = [];
    if (after && after !== lesson) buttons.push(NEXT("finish-next", "Next page", () => startLesson(after.id), after.title));
    if (s.kind === "encounter") buttons.push(NEXT("finish-more", "Six more", startEncounters));
    buttons.push({ id: "finish-home", label: buttons.length ? "Done" : "Back to the book", kind: buttons.length ? "tint" : "primary", icon: false, on: () => { session = null; goHome({ back: true }); } });
    setDock(buttons);
  }

  // ---- DRIVE --------------------------------------------------------------------
  // One tap, then it keeps going until you stop:
  //   1. your lines — what the book taught, due first, mixed three ways:
  //        say it        meaning → you say the Japanese
  //        understand it Japanese → you say what it means
  //        answer her    her question → you reply in Japanese
  //   2. then lesson after lesson from the car bookmark (state.drivePos): lines
  //      you know are drilled, new ones are introduced, then the lesson's
  //      conversation. A chime between lessons.
  // Two ways to drive it (state.settings.driveMode):
  //   hands  everything is spoken, with gaps for you to speak. Steering-wheel /
  //          Bluetooth buttons (Media Session): play/pause, next = knew it,
  //          previous = again. The car display shows the Japanese line.
  //   touch  one big card for a mounted phone: tap anywhere to check, then
  //          Again / Got it (or swipe). The Japanese is read aloud as you go.
  const DRIVE_LINES = 12;
  // where the car picks up: the drive's own bookmark, else the reading bookmark
  const carLesson = () => lessonById(state.drivePos) || nextLesson();
  const answerItem = (t) => ({ type: "answer", id: t.id, them: t.them, ctx: t.ctx, sentence: t.model });
  function linesBlock() {
    const learned = learnedCards();
    const now = Date.now();
    const due = learned.filter((x) => (x.card.due || 0) <= now).sort((a, b) => (a.card.due || 0) - (b.card.due || 0));
    const soon = learned.filter((x) => (x.card.due || 0) > now).sort((a, b) => (a.card.due || 0) - (b.card.due || 0));
    const picked = due.concat(soon).slice(0, DRIVE_LINES);
    if (!picked.length) return null;
    // someone speaks to you every few lines, from the same pages
    const asks = shuffle(encounterPool(Array.from(new Set(picked.map((x) => x.lesson)))));
    const queue = [];
    picked.forEach((x, n) => {
      const pair = patternPairs(x.lesson).find((p) => p.id === x.id && p.changed.length === 1);
      const weak = (x.card.reps || 0) <= 2 || (x.card.lapses || 0) > 0;
      const roll = Math.random();
      if (pair && !weak && roll < 0.2) queue.push({ type: "swap", id: x.id, sentence: x.sentence, source: pair.source, word: pair.sentence.words[pair.changed[0]], weak });
      else if (weak || roll < 0.6) queue.push({ type: "recall", id: x.id, sentence: x.sentence, weak });
      else queue.push({ type: "understand", id: x.id, sentence: x.sentence, weak });
      if (n % 3 === 2 && asks.length) queue.push(answerItem(asks.shift()));
    });
    // weak lines come back a few lines later (graduated recall)
    for (let i = 0; i < queue.length; i++) {
      const it = queue[i];
      if (it.weak && it.type === "recall" && !it.rep && !it.again) { it.again = true; queue.splice(Math.min(queue.length, i + 5), 0, Object.assign({}, it, { rep: true })); }
    }
    return { title: "Your lines", sub: plural(picked.length, "line") + " from the book · " + due.length + " due", queue, lines: picked.length, due: due.length };
  }
  // one lesson's worth of driving: its sentences, then its real-life scene
  function lessonBlock(lesson, skip) {
    const queue = sentenceItems(lesson).filter((x) => !(skip && skip.has(x.id))).map((x) => (known(x.id)
      ? { type: Math.random() < 0.6 ? "recall" : "understand", id: x.id, sentence: x.sentence }
      : { type: "learn", id: x.id, sentence: x.sentence, first: true }));
    const scene = TALK.find((t) => t.lesson === lesson.id);
    if (scene) sceneTurns(scene, lesson).turns.forEach((t) => { if (t.them) queue.push(answerItem(t)); });
    const c = chapterOf(lesson.id);
    return { title: lesson.title, sub: "Chapter " + c.index + " · " + c.level.title, lesson, queue };
  }
  const blockMinutes = (queue, cue) => Math.max(1, Math.round(queue.reduce((n, it) => n + driveSteps(it, cue).reduce((m, st) => m + (st.gap || (st.en ? 700 + st.en.length * 70 : sayTime(st.jp) * (st.slow ? 1.35 : 1))) + 350, 0), 0) / 60000));
  function drivePlan() {
    const lines = linesBlock();
    const car = carLesson();
    const block = lines || lessonBlock(car);
    return { block, queue: block.queue, learned: lines ? lines.lines : 0, lines: lines ? lines.lines : 0, due: lines ? lines.due : 0, minutes: blockMinutes(block.queue, state.settings.cue), car };
  }
  // hands-free: what is spoken, in order, with gaps for you
  function driveSteps(it, cue) {
    const s = it.sentence, mine = sayTime(s.jp) * 1.3 + 900;
    if (it.type === "answer") return [{ jp: it.them.jp, label: "She says…", show: true }].concat(cue === "en" && it.ctx ? [{ en: it.ctx, label: "Your turn" }] : [], [
      { gap: mine + 600, label: "Answer her in Japanese" },
      { jp: s.jp, label: "One way to say it", show: true }, { gap: mine, label: "Say it again" },
    ]);
    if (it.type === "swap") return [
      { jp: it.source.jp, label: "Listen", show: true }, { jp: it.word.jp, label: "Now with…", show: true },
      { gap: mine + 400, label: "Say the new sentence" }, { jp: s.jp, label: "The answer", show: true }, { gap: mine, label: "Say it again" },
    ];
    if (it.type === "understand" && cue === "en") return [
      { jp: s.jp, label: "What does it mean?", show: true }, { gap: 1400 + s.en.length * 70, label: "Say it in English" },
      { en: s.en, label: "It means…" }, { jp: s.jp, label: "Once more", show: true }, { gap: mine * 0.8, label: "Say it back" },
    ];
    // a new line, or Japanese-only: introduce it by ear (with its meaning first, if cued)
    if (it.type === "learn" || cue !== "en") return (it.type === "learn" && cue === "en" ? [{ en: s.en, label: "This means…" }] : []).concat([
      { jp: s.jp, label: "Listen", show: true }, { gap: mine, label: "Say it back" },
      { jp: s.jp, slow: true, label: "Once more, slowly", show: true }, { gap: mine, label: "Say it again" },
    ]);
    const steps = [
      { en: s.en, label: "How do you say…" }, { gap: mine + 600, label: "Say it in Japanese" },
      { jp: s.jp, label: "The answer", show: true }, { gap: mine, label: "Say it again" },
    ];
    if (it.weak && !it.rep) steps.push({ jp: s.jp, slow: true, label: "Once more, slowly", show: true }, { gap: mine * 0.8, label: "Say it again" });
    return steps;
  }
  function renderDrive() {
    if (drive && drive.running) return;
    const plan = drivePlan();
    const cue = state.settings.cue === "jp" ? "jp" : "en";
    const touch = state.settings.driveMode === "touch";
    const carC = chapterOf(plan.car.id);
    const how = touch
      ? ["A card appears and the Japanese is read aloud", "Say your answer out loud, then tap anywhere", "Again or Got it — tap, or swipe"]
      : cue === "en" ? ["Hear what to say, or her question", "Answer out loud in the gap", "Hear the answer, say it again"]
      : ["Hear the Japanese", "Say it back in the gap", "Hear it slowly, say it again"];
    $("drive-body").innerHTML =
      '<header class="topbar"><h1 class="page-title">Drive <span lang="ja">車</span></h1></header>' +
      '<p class="lede">One tap, then it keeps going on its own until you stop. Set it up while parked.</p>' +
      '<div class="seg" role="group" aria-label="How you drive it">' +
        '<button type="button" data-drive-mode="hands" aria-pressed="' + !touch + '">' + ICON.ear + "Hands-free</button>" +
        '<button type="button" data-drive-mode="touch" aria-pressed="' + touch + '">' + ICON.hand + "Touch</button></div>" +
      '<div class="drive-card-setup">' +
        '<div class="drive-row"><span class="drive-n">1</span><div>' + (plan.learned
          ? "<b>" + plural(plan.lines, "line") + " from the book</b><small>" + plan.due + " due" + (touch ? "" : " · about " + plan.minutes + " min") + " · say it, understand it, answer her</small>"
          : "<b>A first listen</b><small>Read a page in the book and its lines open your drives.</small>") + "</div></div>" +
        '<div class="drive-row"><span class="drive-n">' + (plan.learned ? 2 : 1) + "</span><div><b>Then lesson after lesson</b><small>from the car bookmark: " + esc(plan.car.title) + " · Chapter " + carC.index + "</small></div></div>" +
        '<ol class="drive-how">' + how.map((h) => "<li>" + h + "</li>").join("") + "</ol>" +
      "</div>" +
      (touch ? '<p class="fine">Made for a mounted phone: one big card, whole-screen taps. No small buttons.</p>'
        : '<div class="seg seg-sub" role="group" aria-label="How lines are cued">' +
          '<button type="button" data-cue="en" aria-pressed="' + (cue === "en") + '">English cue</button>' +
          '<button type="button" data-cue="jp" aria-pressed="' + (cue === "jp") + '">Japanese only</button></div>' +
          '<p class="fine">' + (cue === "en" ? "You hear the meaning in English, then say the Japanese from memory. On the wheel: next = knew it, previous = again, play/pause." : "No English is spoken: you listen, repeat, and answer her questions.") + "</p>") +
      '<button class="btn btn-primary" id="drive-start"><span class="btn-label">Start the drive</span>' + ICON.next + "</button>";
    $("drive-body").querySelectorAll("[data-cue]").forEach((b) => b.addEventListener("click", () => { state.settings.cue = b.dataset.cue; save(); renderDrive(); }));
    $("drive-body").querySelectorAll("[data-drive-mode]").forEach((b) => b.addEventListener("click", () => { state.settings.driveMode = b.dataset.driveMode; save(); renderDrive(); }));
    $("drive-start").addEventListener("click", () => startDrive(plan));
  }
  // steering-wheel buttons, and a silent loop that keeps the phone's media
  // controls ours between clips
  let keepAlive = null;
  function holdMedia(on) {
    const ms = "mediaSession" in navigator ? navigator.mediaSession : null;
    const set = (a, fn) => { if (ms) { try { ms.setActionHandler(a, on ? fn : null); } catch (_) {} } };
    set("play", () => drivePause(false));
    set("pause", () => drivePause(true));
    set("nexttrack", driveGot);
    set("previoustrack", driveAgain);
    set("stop", endDrive);
    try {
      if (!on) {
        if (keepAlive) { keepAlive.pause(); keepAlive = null; }
        if (ms) { ms.metadata = null; ms.playbackState = "none"; }
        return;
      }
      if (ms) ms.playbackState = "playing";
      if (typeof Audio === "function" && typeof btoa === "function" && !window.HANASOU_BOOK_SPEED) {
        const n = 8000, bytes = new Uint8Array(44 + n), view = new DataView(bytes.buffer);
        const put = (at, text) => text.split("").forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
        put(0, "RIFF"); view.setUint32(4, 36 + n, true); put(8, "WAVEfmt "); view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 8000, true); view.setUint32(28, 8000, true);
        view.setUint16(32, 1, true); view.setUint16(34, 8, true); put(36, "data"); view.setUint32(40, n, true);
        bytes.fill(128, 44);
        let bin = ""; bytes.forEach((b) => { bin += String.fromCharCode(b); });
        keepAlive = new Audio("data:audio/wav;base64," + btoa(bin));
        keepAlive.loop = true;
        const p = keepAlive.play(); if (p && p.catch) p.catch(() => {});
      }
    } catch (_) {}
  }
  // the car display: the Japanese line, the lesson, its cover
  function nowPlaying(d, jp) {
    if (!("mediaSession" in navigator) || typeof window.MediaMetadata !== "function") return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: plain(jp), artist: "Hanasou · " + d.block.title, album: "Drive",
        artwork: d.block.lesson ? [{ src: coverOf(d.block.lesson), sizes: "512x512", type: "image/png" }] : [],
      });
    } catch (_) {}
  }
  function chime() {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(t); resolve(); } };
      const t = setTimeout(finish, T(2500));
      release = finish;
      if (typeof Audio !== "function") return;
      try { const a = new Audio("../assets/sfx-chime.wav"); player = a; a.onended = a.onerror = finish; const p = a.play(); if (p && p.catch) p.catch(finish); } catch (_) { finish(); }
    });
  }
  function startDrive(plan) {
    session = null;
    const touch = state.settings.driveMode === "touch";
    drive = { running: true, touch, block: plan.block, queue: plan.block.queue.slice(), blocks: 1, i: 0, s: 0, paused: false, token: {}, grades: {}, done: [], lock: null, cue: state.settings.cue === "jp" ? "jp" : "en" };
    const top = '<div class="drive-top"><button class="drive-end" id="drive-stop">End</button><span class="drive-count" id="drive-count"></span>' +
      (touch ? '<button class="drive-end drive-icon" id="drive-replay" aria-label="Hear it again">' + ICON.sound + "</button>" : '<span class="drive-spacer"></span>') + "</div>" +
      '<p class="drive-lesson" id="drive-lesson"></p>';
    $("drive-body").innerHTML = touch
      ? '<div class="drive-run touch">' + top +
          '<button class="drive-card" id="drive-card" aria-live="polite"></button>' +
          '<div class="drive-pads" id="drive-pads"></div></div>'
      : '<div class="drive-run">' + top +
          '<div class="drive-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<p class="drive-cue" id="drive-cue" aria-live="polite">Starting…</p><div class="drive-line" id="drive-line"></div>' +
          '<div class="drive-pads"><button id="drive-again">' + ICON.prev + '<small>Again</small></button><button id="drive-pause">' + ICON.pause + '<small>Pause</small></button><button id="drive-got">' + ICON.skip + "<small>Knew it</small></button></div>" +
          '<p class="fine">Eyes on the road. Everything is spoken, and your steering-wheel buttons work too.</p></div>';
    $("drive-stop").addEventListener("click", endDrive);
    if (touch) {
      $("drive-replay").addEventListener("click", touchReplay);
      wireTouchCard($("drive-card"));
    } else {
      $("drive-again").addEventListener("click", driveAgain);
      $("drive-got").addEventListener("click", driveGot);
      $("drive-pause").addEventListener("click", () => drivePause(!drive.paused));
    }
    document.body.classList.add("driving");
    syncChrome();
    window.scrollTo(0, 0);
    holdMedia(true);
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then((l) => { if (drive) drive.lock = l; else l.release(); }).catch(() => {}); } catch (_) {}
    if (touch) touchShow(); else runDrive();
  }
  const paintBlock = (d) => { $("drive-lesson").innerHTML = "<b>" + esc(d.block.title) + "</b><small>" + esc(d.block.sub) + "</small>"; };
  // a block played through: move the car bookmark on (once), then load the next lesson
  function turnBlock(d) {
    if (!d.turned && d.block.lesson) {
      const at = order.indexOf(d.block.lesson);
      state.drivePos = order[(at + 1) % order.length].id;
      state.driven = state.driven || {};
      state.driven[d.block.lesson.id] = (state.driven[d.block.lesson.id] || 0) + 1;
      save();
    }
    d.turned = true;
  }
  function loadNextBlock(d) {
    for (let guard = 0; guard < order.length; guard++) {
      d.block = lessonBlock(carLesson(), new Set(d.done.map((x) => x.id)));
      d.queue = d.block.queue.slice();
      d.i = 0; d.s = 0; d.turned = false; d.blocks++;
      if (d.queue.length) return;
      turnBlock(d);
    }
  }
  function noteDone(d, it) {
    if (!it.id) return;
    const seen = d.done.find((x) => x.id === it.id);
    if (!seen) d.done.push({ id: it.id, sentence: it.sentence, first: !!it.first });
  }

  // --- hands-free runner
  async function runDrive() {
    const d = drive;
    if (!d) return;
    const token = d.token = {};
    const alive = () => drive === d && d.token === token && !d.paused;
    for (;;) {
      paintBlock(d);
      while (alive() && d.i < d.queue.length) {
        const it = d.queue[d.i];
        const steps = driveSteps(it, d.cue);
        $("drive-count").textContent = (d.i + 1) + " / " + d.queue.length;
        let s = d.s;
        d.skip = false;
        while (s < steps.length && !d.skip) {
          const st = steps[s];
          d.s = s;
          $("drive-cue").textContent = st.label;
          $("drive-line").innerHTML = st.en ? '<span class="en">' + esc(st.en) + "</span>"
            : st.show ? (st.jp === it.sentence.jp ? colorJP(it.sentence) : rubyHTML(st.jp))
            : '<span class="dots"><i></i><i></i><i></i></span>';
          if (st.jp) nowPlaying(d, st.jp);
          if (st.en) await sayEnglish(st.en);
          else if (st.jp) await play(st.jp, st.slow);
          else await pauseFor(st.gap);
          if (!alive()) return;
          if (!d.skip) await pauseFor(350);
          if (!alive()) return;
          s++;
        }
        settleDriveItem(d, it);
        d.i++; d.s = 0;
      }
      if (!alive()) return;
      turnBlock(d);
      $("drive-cue").textContent = "Next lesson";
      $("drive-line").innerHTML = "";
      await chime();
      if (!alive()) return;
      await pauseFor(600);
      if (!alive()) return;
      loadNextBlock(d);
    }
  }
  // a line is recorded once it won't come round again this drive
  function settleDriveItem(d, it) {
    noteDone(d, it);
    if (!it.id || it.first) return;
    if (d.queue.slice(d.i + 1).some((x) => x.id === it.id)) return;
    recordAttempt(it.id, d.grades[it.id] || "hard");
  }
  function requeue(d, it) {
    if (!d.queue.slice(d.i + 1).some((x) => x.id === it.id)) d.queue.splice(Math.min(d.queue.length, d.i + 4), 0, Object.assign({}, it, { rep: true }));
  }
  function driveGot() {
    const d = drive;
    if (!d || !d.running) return;
    if (d.touch) { if (d.phase === "ask") touchReveal(); else touchGrade("good"); return; }
    const it = d.queue[d.i];
    if (it && it.id) {
      d.grades[it.id] = "good";
      // known: it doesn't need to come round again
      for (let k = d.queue.length - 1; k > d.i; k--) if (d.queue[k].id === it.id) d.queue.splice(k, 1);
    }
    d.skip = true;
    if (d.paused) drivePause(false); else stopAudio();
  }
  function driveAgain() {
    const d = drive;
    if (!d || !d.running) return;
    if (d.touch) { if (d.phase === "ask") touchReplay(); else touchGrade("again"); return; }
    const it = d.queue[d.i];
    if (!it || !it.id) return;
    if (!it.first) d.grades[it.id] = "again";
    requeue(d, it);
    const pad = $("drive-again");
    if (pad) { pad.classList.add("flash"); setTimeout(() => pad.classList.remove("flash"), 500); }
  }
  function drivePause(on) {
    const d = drive;
    if (!d || !d.running) return;
    if (d.touch) { touchReplay(); return; }
    if (d.paused === on) return;
    d.paused = on;
    const pad = $("drive-pause");
    if (pad) pad.innerHTML = (on ? ICON.play + "<small>Resume</small>" : ICON.pause + "<small>Pause</small>");
    if ("mediaSession" in navigator) { try { navigator.mediaSession.playbackState = on ? "paused" : "playing"; } catch (_) {} }
    if (on) { d.token = {}; stopAudio(); $("drive-cue").textContent = "Paused"; } else runDrive();
  }

  // --- touch runner: one big card, tap to check, then Again / Got it
  const touchLabel = { recall: "Say it in Japanese", swap: "Say it in Japanese", understand: "What does it mean?", answer: "Answer her in Japanese", learn: "A new line" };
  function touchShow() {
    const d = drive;
    if (!d || !d.running) return;
    if (d.i >= d.queue.length) { touchNextBlock(d); return; }
    const it = d.queue[d.i];
    const card = $("drive-card");
    d.phase = it.type === "learn" ? "shown" : "ask";
    paintBlock(d);
    $("drive-count").textContent = (d.i + 1) + " / " + d.queue.length;
    card.className = "drive-card kind-" + it.type;
    if (!reduceMotion) { void card.offsetWidth; card.classList.add("enter"); }
    const face = it.type === "recall" || it.type === "swap" ? '<p class="tc-main tc-en">' + esc(it.sentence.en) + "</p>"
      : it.type === "answer" ? '<p class="tc-bubble">' + rubyHTML(it.them.jp) + "</p>" + (it.ctx ? '<p class="tc-ctx">' + esc(it.ctx) + "</p>" : "")
      : '<p class="tc-main tc-jp">' + colorJP(it.sentence) + "</p>";
    card.innerHTML = '<span class="tc-label">' + touchLabel[it.type] + "</span>" + face + '<div class="tc-answer" id="tc-answer"></div>' +
      '<span class="tc-tap" id="tc-tap">Tap anywhere to check</span>';
    if (it.type === "learn") { $("tc-answer").innerHTML = glossLine(it.sentence) + '<p class="tc-en2">' + esc(it.sentence.en) + "</p>"; $("tc-tap").textContent = ""; }
    paintTouchPads();
    const heard = it.type === "answer" ? it.them.jp : it.type === "understand" || it.type === "learn" ? it.sentence.jp : null;
    if (heard) { nowPlaying(d, heard); say(heard); } else stopAudio();
  }
  function paintTouchPads() {
    const d = drive, it = d.queue[d.i];
    const pads = $("drive-pads");
    if (d.phase === "ask") { pads.className = "drive-pads one"; pads.innerHTML = '<button id="drive-check">' + ICON.check + "<small>Check</small></button>"; $("drive-check").addEventListener("click", touchReveal); return; }
    if (it && it.type === "learn") { pads.className = "drive-pads one"; pads.innerHTML = '<button id="drive-next">' + ICON.next + "<small>Next</small></button>"; $("drive-next").addEventListener("click", () => touchGrade("seen")); return; }
    pads.className = "drive-pads two";
    pads.innerHTML = '<button id="drive-again">' + ICON.prev + '<small>Again</small></button><button id="drive-got" class="good">' + ICON.check + "<small>Got it</small></button>";
    $("drive-again").addEventListener("click", () => touchGrade("again"));
    $("drive-got").addEventListener("click", () => touchGrade("good"));
  }
  function touchReveal() {
    const d = drive;
    if (!d || !d.running || d.phase !== "ask") return;
    const it = d.queue[d.i];
    d.phase = "shown";
    const s = it.sentence;
    $("tc-answer").innerHTML = it.type === "understand"
      ? '<p class="tc-main tc-en">' + esc(s.en) + "</p>" + glossLine(s)
      : glossLine(s) + (it.type === "answer" ? '<p class="tc-en2">' + esc(s.en) + '</p><p class="tc-meant">She said: ' + esc(it.them.en) + "</p>" : "");
    $("drive-card").classList.add("shown");
    $("tc-tap").textContent = "Tap to hear it again";
    paintTouchPads();
    nowPlaying(d, s.jp);
    say(s.jp);
  }
  function touchReplay() {
    const d = drive;
    if (!d || !d.running || d.i >= d.queue.length) return;
    const it = d.queue[d.i];
    say(d.phase === "ask" && it.type === "answer" ? it.them.jp : it.sentence.jp);
  }
  function touchGrade(result) {
    const d = drive;
    if (!d || !d.running || d.phase !== "shown") return;
    const it = d.queue[d.i];
    noteDone(d, it);
    if (it.id && !it.first && result !== "seen") {
      d.grades[it.id] = result;
      recordAttempt(it.id, result === "good" ? "good" : "again");
      if (result === "again") requeue(d, it);
    }
    const card = $("drive-card");
    const go = () => { if (drive !== d) return; d.i++; touchShow(); };
    if (reduceMotion) { go(); return; }
    card.classList.remove("enter");
    card.classList.add(result === "again" ? "leave-left" : "leave-right");
    setTimeout(go, 200);
  }
  async function touchNextBlock(d) {
    turnBlock(d);
    d.phase = "between";
    $("drive-card").className = "drive-card between";
    $("drive-card").innerHTML = '<span class="tc-label">Next lesson</span>';
    $("drive-pads").innerHTML = "";
    await chime();
    if (drive !== d || !d.running) return;
    loadNextBlock(d);
    touchShow();
  }
  // tap the card to check (or hear it again); swipe right = got it, left = again
  function wireTouchCard(card) {
    let x0 = null, moved = false;
    card.addEventListener("pointerdown", (e) => { x0 = e.clientX; moved = false; });
    card.addEventListener("pointermove", (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 12) moved = true; });
    card.addEventListener("pointerup", (e) => {
      const dx = x0 == null ? 0 : e.clientX - x0;
      x0 = null;
      const d = drive;
      if (!d || !d.running || Math.abs(dx) < 60 || d.phase !== "shown") return;
      const it = d.queue[d.i];
      touchGrade(it && it.type === "learn" ? "seen" : dx > 0 ? "good" : "again");
    });
    card.addEventListener("click", () => {
      if (moved) { moved = false; return; }
      const d = drive;
      if (!d || !d.running) return;
      if (d.phase === "ask") touchReveal(); else if (d.phase === "shown") touchReplay();
    });
  }

  function releaseDrive() {
    const d = drive;
    if (!d) return;
    if (d.lock && d.lock.release) { try { d.lock.release(); } catch (_) {} }
    d.token = {}; d.running = false;
    holdMedia(false);
    document.body.classList.remove("driving");
    stopAudio();
  }
  function stopDrive() { if (drive) { releaseDrive(); drive = null; } }
  // parked again: what you practised, with one tap to flag a hard one
  function endDrive() {
    const d = drive;
    if (!d) return;
    // a line you graded but didn't finish still counts as practised
    const cur = d.queue[d.i];
    if (!d.touch && cur && cur.id && d.grades[cur.id]) settleDriveItem(d, cur);
    releaseDrive();
    drive = null;
    const lines = d.done;
    const car = carLesson();
    $("drive-body").innerHTML =
      '<header class="topbar"><h1 class="page-title">' + (lines.length ? plural(lines.length, "line") : "Drive ended") + "</h1></header>" +
      '<p class="lede">' + (lines.length ? "said on the road. " : "") + (lines.some((x) => !x.first) ? "Tap any line that felt hard and it comes back sooner. " : "") + "Next drive picks up at <b>" + esc(car.title) + "</b>.</p>" +
      '<div class="drive-review">' + lines.map((x, i) =>
        '<button class="review-line' + (d.grades[x.id] === "again" ? " hard" : "") + (x.first ? " new" : "") + '" data-review="' + i + '"' + (x.first ? " disabled" : "") + ">" +
          '<span class="jp">' + colorJP(x.sentence) + '</span><span class="en">' + esc(x.sentence.en) + '</span><span class="flag">' + (x.first ? "new" : d.grades[x.id] === "again" ? "hard" : d.grades[x.id] === "good" ? "knew it" : "") + "</span></button>").join("") + "</div>" +
      '<button class="btn btn-primary" id="drive-done"><span class="btn-label">Back to the book</span>' + ICON.next + "</button>";
    $("drive-body").querySelectorAll("[data-review]").forEach((b) => b.addEventListener("click", () => {
      const x = lines[Number(b.dataset.review)];
      if (b.classList.contains("hard")) return;
      b.classList.add("hard");
      b.querySelector(".flag").textContent = "hard";
      recordAttempt(x.id, "again");
    }));
    $("drive-done").addEventListener("click", () => goHome({ back: true }));
    syncChrome();
    window.scrollTo(0, 0);
  }

  // ---- journal ----------------------------------------------------------------------
  function renderJournal() {
    // this week, Monday-first; a forgiving rhythm, not a streak
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const names = ["M", "T", "W", "T", "F", "S", "S"];
    $("week").innerHTML = '<p class="label">This week</p><div class="week-dots">' + names.map((n, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      return '<span class="day' + (state.days[dayKey(d)] ? " on" : "") + (dayKey(d) === dayKey() ? " today" : "") + '"><i></i><small>' + n + "</small></span>";
    }).join("") + "</div>";
    const stamped = order.filter((l) => chapterDone(l.id));
    $("tallies").innerHTML =
      "<div><b>" + state.total + "</b><small>lines said out loud</small></div>" +
      "<div><b>" + learnedCards().length + "</b><small>lines in your drives</small></div>" +
      "<div><b>" + stamped.length + "</b><small>pages stamped</small></div>";
    $("stamp-count").textContent = stamped.length + " of " + order.length;
    $("stamps").innerHTML = stamped.length
      ? stamped.map((l) => '<button class="stamp" data-lesson="' + esc(l.id) + '"><img src="' + coverOf(l) + '" alt=""><span class="hanko small" aria-hidden="true">済</span><small>' + esc(l.title) + "</small></button>").join("")
      : '<p class="fine">Finish all four readings of a page and its stamp lands here.</p>';
    $("stamps").querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => openLesson(b.dataset.lesson)));
    $("legend").innerHTML = ["n", "v", "adj", "adv", "prt", "expr", "aux", "conj"].map((p) => '<span class="wchip pos-' + p + ' still"><span class="wc-main"><b>' + POS_NAME[p] + "</b></span></span>").join("");
    $("romaji-setting").value = state.settings.romaji;
  }

  // ---- global wiring -------------------------------------------------------------------
  document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ""; });
  $("lesson-back").innerHTML = ICON.back;
  $("reading-back").innerHTML = ICON.close;
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b.dataset.say) {
      say(b.dataset.say);
      if (reduceMotion) return;
      const pop = b.classList.contains("pop-cut") ? "flip-over" : b.classList.contains("wc-main") ? "tapped" : "";
      const el = pop === "tapped" ? b.parentNode : b;
      if (pop) { el.classList.remove(pop); void el.offsetWidth; el.classList.add(pop); setTimeout(() => el.classList.remove(pop), 800); }
    } else if (b.dataset.saySlow) say(b.dataset.saySlow, true);
  });
  $("open-book").addEventListener("click", openBook);
  $("to-cover").addEventListener("click", () => show("cover", { back: true }));
  $("lesson-back").addEventListener("click", () => goHome({ back: true }));
  $("reading-back").addEventListener("click", closeReading);
  $("due-banner").addEventListener("click", startReview);
  $("romaji-setting").addEventListener("change", (e) => { state.settings.romaji = e.target.value; save(); });
  $("reset-book").addEventListener("click", () => {
    if (!window.confirm("Reset this pop-up book's progress? Your main Hanasou app is not affected.")) return;
    const keep = state.settings;
    Object.assign(state, fresh(), { settings: keep, opened: true });
    save(); renderJournal();
  });
  $("ribbons").querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => {
    if (drive && drive.running) return;
    if (b.dataset.nav === "home") goHome();
    else if (b.dataset.nav === "journal") { renderJournal(); show("journal"); }
    else { renderDrive(); show("drive"); }
  }));

  // /living-city/#drive is a home-screen shortcut: straight to the drive, one
  // tap from driving. Otherwise the first visit opens on the cover.
  if (/^#drive\b/.test(window.location.hash || "")) { state.opened = true; save(); renderDrive(); show("drive", { instant: true }); }
  else if (state.opened) goHome({ instant: true });
  else show("cover", { instant: true });

  // for the smoke test
  window.HanasouBook = { state, chapters, order, patternPairs, buildPatterns, buildMoment, buildListen, encounterPool, drivePlan, driveSteps, colorJP, session: () => session, drive: () => drive };
})();
