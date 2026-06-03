// Hanasou — lesson-based Japanese speaking drill.
// Home (lesson map by difficulty) -> lesson intro (vocab + grammar) ->
// drill (speak, reveal w/ TTS + word breakdown, self-grade) -> complete.
// Progress is a lightweight SM-2 spaced-repetition system in localStorage.

(function () {
  "use strict";

  const STORAGE_KEY = "hanasou.v4";
  const DAY = 86400000;

  // Flatten every sentence into an addressable card.
  const CARDS = [];
  const cardById = {};
  window.LESSONS.forEach((L) => {
    L.sentences.forEach((s, i) => {
      const card = { id: L.id + "#" + i, lessonId: L.id, lessonTitle: L.title, s };
      CARDS.push(card);
      cardById[card.id] = card;
    });
  });
  const lessonById = Object.fromEntries(window.LESSONS.map((L) => [L.id, L]));

  // Mined sentences (user-added) flatten into the same card pool, so the SRS,
  // review queue, audio and drill all treat them like any lesson sentence.
  const MINED_LESSON = "__mined";
  function rebuildMined() {
    for (let i = CARDS.length - 1; i >= 0; i--) {
      if (CARDS[i].mined) { delete cardById[CARDS[i].id]; CARDS.splice(i, 1); }
    }
    for (const m of prog.mined) {
      const card = { id: "mined#" + m.id, lessonId: MINED_LESSON, lessonTitle: "My sentences", s: m, mined: true };
      CARDS.push(card);
      cardById[card.id] = card;
    }
  }

  // ---- Persistence ---------------------------------------------------------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }
  const prog = load();
  prog.cards = prog.cards || {};          // {cardId: {reps, ease, interval, due, lapses}}
  prog.streak = prog.streak || { current: 0, longest: 0, lastDay: null };
  prog.reviews = prog.reviews || 0;
  prog.daily = prog.daily || { day: null, count: 0 };   // reviews done today
  prog.mined = prog.mined || [];          // [{id, en, jp, romaji, hint, added}]
  prog.immersion = prog.immersion || {};  // {"YYYY-MM-DD": minutes}
  prog.known = prog.known || [];          // [base_form] words marked known
  prog.knownHistory = prog.knownHistory || {}; // {"YYYY-MM-DD": known count}
  rebuildMined();
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
    schedulePush();
  }

  // ---- Local settings (device-specific, not synced) ------------------------
  const SETTINGS_KEY = "hanasou.settings";
  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  }
  const settings = loadSettings();
  if (settings.romaji === undefined) settings.romaji = true;
  settings.voiceURI = settings.voiceURI || "";
  if (!settings.dailyGoal) settings.dailyGoal = 20;
  settings.collapsedTiers = settings.collapsedTiers || {};
  settings.activeLevel = settings.activeLevel || (window.LEVELS[0] && window.LEVELS[0].id);
  settings.direction = settings.direction || "produce";   // produce | recognize | both
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  function applyRomaji() { document.body.classList.toggle("no-romaji", !settings.romaji); }

  // ---- Optional cross-device sync (VPS API) --------------------------------
  // Local-only until a token is entered; then GET/PUT a single progress blob.
  const TOKEN_KEY = "hanasou.token";
  const API = "/api/progress";
  let pushTimer = null;
  let syncState = "off"; // off | syncing | ok | error

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

  function setSync(state) { syncState = state; renderSyncBtn(); renderSyncSettings(); }
  function renderSyncBtn() {
    if (!el.syncBtn) return;
    const label = { off: "☁ set up sync", syncing: "☁ syncing…", ok: "☁ synced ✓", error: "☁ sync error — tap to retry" };
    el.syncBtn.textContent = label[syncState] || label.off;
  }
  function renderSyncSettings() {
    if (!el.syncStatus) return;
    const connected = !!getToken();
    const status = {
      off: "Not connected — progress stays only on this device.",
      syncing: "Connected — syncing…",
      ok: "Connected and syncing across your devices.",
      error: "Connected, but the last sync failed. Tap to retry.",
    };
    el.syncStatus.textContent = connected ? (status[syncState] || status.ok) : status.off;
    el.syncConnectBtn.hidden = connected;
    el.syncDisconnectBtn.hidden = !connected;
  }

  function schedulePush() {
    if (!getToken()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1200);
  }

  async function push() {
    const t = getToken();
    if (!t) return;
    setSync("syncing");
    try {
      const r = await fetch(API, {
        method: "PUT",
        headers: { "Authorization": "Bearer " + t, "Content-Type": "application/json" },
        body: JSON.stringify({ progress: prog }),
      });
      if (!r.ok) throw new Error(r.status);
      setSync("ok");
    } catch { setSync("error"); }
  }

  // Same-day counts merge to the higher tally; otherwise the later day wins.
  function mergeDaily(a, b) {
    a = a || { day: null, count: 0 };
    b = b || { day: null, count: 0 };
    if (a.day === b.day) return { day: a.day, count: Math.max(a.count || 0, b.count || 0) };
    return (b.day || "") > (a.day || "") ? b : a;
  }

  // Union mined sentences from both devices, keyed by id (first seen wins).
  function mergeMined(a, b) {
    const map = {};
    for (const m of a || []) map[m.id] = m;
    for (const m of b || []) if (!map[m.id]) map[m.id] = m;
    return Object.values(map);
  }

  // Immersion minutes per day — keep the higher tally for each date.
  function mergeImmersion(a, b) {
    const out = Object.assign({}, a || {});
    for (const [k, v] of Object.entries(b || {})) out[k] = Math.max(out[k] || 0, v);
    return out;
  }

  // Merge two progress blobs without losing reps made on another device.
  function mergeProgress(local, remote) {
    if (!remote) return local;
    const out = {
      cards: {},
      streak: Object.assign({ current: 0, longest: 0, lastDay: null }, local.streak),
      reviews: Math.max(local.reviews || 0, remote.reviews || 0),
      daily: mergeDaily(local.daily, remote.daily),
      mined: mergeMined(local.mined, remote.mined),
      immersion: mergeImmersion(local.immersion, remote.immersion),
      known: Array.from(new Set([...(local.known || []), ...(remote.known || [])])),
      knownHistory: mergeImmersion(local.knownHistory, remote.knownHistory),
    };
    const ids = new Set([...Object.keys(local.cards || {}), ...Object.keys(remote.cards || {})]);
    for (const id of ids) {
      const a = local.cards && local.cards[id];
      const b = remote.cards && remote.cards[id];
      if (!a) out.cards[id] = b;
      else if (!b) out.cards[id] = a;
      else out.cards[id] = (b.reps > a.reps || (b.reps === a.reps && (b.due || 0) > (a.due || 0))) ? b : a;
    }
    const rs = remote.streak || {};
    if ((rs.current || 0) > (out.streak.current || 0)) out.streak.current = rs.current;
    out.streak.longest = Math.max(out.streak.longest || 0, rs.longest || 0);
    if ((rs.lastDay || "") > (out.streak.lastDay || "")) out.streak.lastDay = rs.lastDay;
    return out;
  }

  async function pull() {
    const t = getToken();
    if (!t) return;
    setSync("syncing");
    try {
      const r = await fetch(API, { headers: { "Authorization": "Bearer " + t } });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      if (data && data.progress) {
        const merged = mergeProgress(prog, data.progress);
        prog.cards = merged.cards;
        prog.streak = merged.streak;
        prog.reviews = merged.reviews;
        prog.daily = merged.daily;
        prog.mined = merged.mined;
        prog.immersion = merged.immersion;
        prog.known = merged.known;
        prog.knownHistory = merged.knownHistory;
        rebuildMined();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
      }
      setSync("ok");
      renderHome();
      push(); // write the merged result back
    } catch { setSync("error"); }
  }

  function onSyncClick() {
    if (!getToken()) {
      const t = prompt("Paste your sync token (the HANASOU_TOKEN from your server):");
      if (t && t.trim()) { setToken(t.trim()); pull(); }
    } else {
      pull(); // manual re-sync / retry
    }
  }

  function disconnectSync() {
    if (!confirm("Disconnect sync on this device? Your progress stays here, but it will stop syncing until you re-enter the token.")) return;
    clearTimeout(pushTimer);
    setToken("");
    setSync("off");
  }

  function resetProgress() {
    const msg = getToken()
      ? "Erase all progress on this device? Because sync is on, this also clears your saved progress on the server."
      : "Erase all progress on this device? This can't be undone.";
    if (!confirm(msg)) return;
    prog.cards = {};
    prog.streak = { current: 0, longest: 0, lastDay: null };
    prog.reviews = 0;
    save();
    renderHome();
  }

  function openSettings() {
    el.romajiToggle.checked = settings.romaji;
    el.goalSelect.value = String(settings.dailyGoal);
    el.directionSelect.value = settings.direction;
    populateVoiceSelect();
    renderSyncSettings();
    show(el.settings, { back: true });
  }

  const todayStr = () => new Date().toISOString().slice(0, 10);

  function bumpStreak() {
    const t = todayStr();
    const s = prog.streak;
    if (s.lastDay === t) return;
    const y = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    s.current = s.lastDay === y ? s.current + 1 : 1;
    s.longest = Math.max(s.longest, s.current);
    s.lastDay = t;
  }

  // ---- SM-2-lite -----------------------------------------------------------
  function srsUpdate(cardId, grade) {
    const c = prog.cards[cardId] || { reps: 0, ease: 2.5, interval: 0, lapses: 0 };
    if (grade === 0) {                       // nope
      c.reps = 0; c.interval = 0; c.lapses += 1;
      c.ease = Math.max(1.3, c.ease - 0.2);
    } else if (grade === 1) {                // kinda
      c.reps += 1;
      c.ease = Math.max(1.3, c.ease - 0.05);
      c.interval = c.interval < 1 ? 1 : Math.round(c.interval * 1.25);
    } else {                                 // got it
      c.reps += 1;
      c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(c.interval * c.ease);
      c.ease += 0.05;
    }
    c.due = Date.now() + c.interval * DAY;
    prog.cards[cardId] = c;
    prog.reviews += 1;
    const t = todayStr();
    if (prog.daily.day !== t) prog.daily = { day: t, count: 0 };
    prog.daily.count += 1;
    bumpStreak();
    save();
  }

  function lessonStats(L) {
    const cards = CARDS.filter((c) => c.lessonId === L.id);
    let passed = 0, due = 0, fresh = 0;
    const now = Date.now();
    for (const c of cards) {
      const p = prog.cards[c.id];
      if (!p || !p.reps) fresh += 1;
      else { if (p.interval >= 1) passed += 1; if (p.due <= now) due += 1; }
    }
    return { total: cards.length, passed, due, fresh, pct: cards.length ? passed / cards.length : 0 };
  }

  function dueCards() {
    const now = Date.now();
    return CARDS.filter((c) => { const p = prog.cards[c.id]; return p && p.reps && p.due <= now; });
  }

  // ---- Elements ------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    backBtn: $("back-btn"),
    dailyRing: $("daily-ring"), ringFill: document.querySelector(".ring-fill"), ringLabel: document.querySelector(".ring-label"),
    mastery: $("mastery"), masteryFill: $("mastery-fill"), masteryPct: $("mastery-pct"),
    home: $("home"), stats: $("stats"), reviewBtn: $("review-btn"), lessonMap: $("lesson-map"), mining: $("mining"), immersion: $("immersion"),
    mineForm: $("mine-form"), mineJp: $("mine-jp"), mineEn: $("mine-en"), mineRomaji: $("mine-romaji"),
    mineHint: $("mine-hint"), mineError: $("mine-error"),
    mineSaveBtn: $("mine-save-btn"), mineCancelBtn: $("mine-cancel-btn"), minePreviewBtn: $("mine-preview-btn"),
    mineFuriBtn: $("mine-furi-btn"),
    importForm: $("import-form"), importText: $("import-text"), importStatus: $("import-status"),
    importError: $("import-error"), importCancelBtn: $("import-cancel-btn"), importDoBtn: $("import-do-btn"),
    reader: $("reader"), readerInput: $("reader-input"), readerError: $("reader-error"),
    readerAnalyzeBtn: $("reader-analyze-btn"), readerClearBtn: $("reader-clear-btn"),
    readerResult: $("reader-result"), readerCoverage: $("reader-coverage"), readerText: $("reader-text"),
    readerLearn: $("reader-learn"), readerPop: $("reader-pop"),
    intro: $("lesson-intro"), lessonTitle: $("lesson-title"), lessonGrammar: $("lesson-grammar"),
    lessonNote: $("lesson-note"), vocabList: $("vocab-list"), startBtn: $("start-btn"), buildBtn: $("build-btn"),
    buildArea: $("build-area"), buildAnswer: $("build-answer"), buildBank: $("build-bank"), buildReset: $("build-reset"),
    drill: $("drill"), progressFill: $("progress-fill"),
    promptLabel: $("prompt-label"), revealLabel: $("reveal-label"),
    promptEn: $("prompt-en"), answerKana: $("answer-kana"), answerRomaji: $("answer-romaji"),
    wordBreakdown: $("word-breakdown"), revealArea: $("reveal-area"),
    hintRow: $("hint-row"), showHintBtn: $("show-hint-btn"), hint: $("hint"),
    revealBtn: $("reveal-btn"), replayBtn: $("replay-btn"), slowBtn: $("slow-btn"), playEnBtn: $("play-en-btn"),
    mineThisBtn: $("mine-this-btn"),
    grade: $("grade"),
    done: $("lesson-done"), doneSummary: $("done-summary"), restartBtn: $("restart-btn"), doneHomeBtn: $("done-home-btn"),
    voiceWarn: $("voice-warn"), syncBtn: $("sync-btn"),
    settingsBtn: $("settings-btn"), settings: $("settings"), romajiToggle: $("romaji-toggle"),
    voiceSelect: $("voice-select"), voiceTestBtn: $("voice-test-btn"),
    syncStatus: $("sync-status"), syncConnectBtn: $("sync-connect-btn"), syncDisconnectBtn: $("sync-disconnect-btn"),
    resetBtn: $("reset-btn"), goalSelect: $("goal-select"), directionSelect: $("direction-select"),
  };

  function span(cls, text) { const s = document.createElement("span"); s.className = cls; s.textContent = text; return s; }

  // ---- Voice ---------------------------------------------------------------
  let jaVoice = null, enVoice = null, jaVoices = [];
  let clips = null; // pre-generated VOICEVOX clips, loaded below: { "<jp>": {n, s?} }
  function pickVoices() {
    const v = speechSynthesis.getVoices();
    jaVoices = v.filter((x) => x.lang && x.lang.toLowerCase().startsWith("ja"));
    const chosen = settings.voiceURI ? jaVoices.find((x) => x.voiceURI === settings.voiceURI) : null;
    jaVoice = chosen || jaVoices.find((x) => /google/i.test(x.name)) || jaVoices.find((x) => x.lang === "ja-JP") || jaVoices[0] || null;
    enVoice = v.find((x) => x.lang.startsWith("en") && x.default) || v.find((x) => x.lang.startsWith("en")) || null;
    el.voiceWarn.hidden = !!jaVoice || !!clips;
    populateVoiceSelect();
  }
  function populateVoiceSelect() {
    if (!el.voiceSelect) return;
    el.voiceSelect.innerHTML = "";
    if (!jaVoices.length) {
      el.voiceSelect.appendChild(Object.assign(document.createElement("option"), { value: "", textContent: "No Japanese voice available" }));
      el.voiceSelect.disabled = true;
      return;
    }
    el.voiceSelect.disabled = false;
    el.voiceSelect.appendChild(Object.assign(document.createElement("option"), { value: "", textContent: "Automatic (best available)" }));
    for (const v of jaVoices) {
      const opt = Object.assign(document.createElement("option"), { value: v.voiceURI, textContent: v.name + " (" + v.lang + ")" });
      if (v.voiceURI === settings.voiceURI) opt.selected = true;
      el.voiceSelect.appendChild(opt);
    }
  }
  pickVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = pickVoices;

  // Pre-generated VOICEVOX clips (audio/manifest.json) play a clear, consistent
  // Japanese voice on every device. Anything missing — a brand-new sentence, or
  // a clip the browser never downloaded — falls back to speechSynthesis.
  fetch("audio/manifest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => { if (m && m.clips) { clips = m.clips; el.voiceWarn.hidden = true; } })
    .catch(() => {});

  let curAudio = null;
  function stopAudio() { if (curAudio) { curAudio.pause(); curAudio = null; } }

  // Furigana via Anki-style "kanji[reading]" annotations.
  function escHTML(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function plainJP(s) { return String(s || "").replace(/\[[^\]]*\]/g, ""); }

  // ---- Tokenizer (Kuromoji, vendored) for auto-furigana --------------------
  let kuroTok = null, kuroLoading = null;
  function loadTokenizer() {
    if (kuroTok) return Promise.resolve(kuroTok);
    if (kuroLoading) return kuroLoading;
    kuroLoading = new Promise((resolve, reject) => {
      const build = () => {
        if (!window.kuromoji) { reject(new Error("tokenizer script missing")); return; }
        window.kuromoji.builder({ dicPath: "vendor/kuromoji/dict/" }).build((err, tok) => {
          if (err) { kuroLoading = null; reject(err); return; }
          kuroTok = tok; resolve(tok);
        });
      };
      if (window.kuromoji) { build(); return; }
      const s = document.createElement("script");
      s.src = "vendor/kuromoji/kuromoji.js";
      s.onload = build;
      s.onerror = () => { kuroLoading = null; reject(new Error("could not load tokenizer")); };
      document.head.appendChild(s);
    });
    return kuroLoading;
  }
  // ---- Word frequency (University of Leeds corpus, CC BY) -----------------
  let freqRank = null, freqLoading = null;
  function loadFreq() {
    if (freqRank) return Promise.resolve(freqRank);
    if (freqLoading) return freqLoading;
    freqLoading = fetch("vendor/freq/leeds-ja.txt")
      .then((r) => { if (!r.ok) throw new Error("freq " + r.status); return r.text(); })
      .then((txt) => {
        freqRank = new Map();
        let rank = 0;
        for (const line of txt.split("\n")) { const w = line.trim(); if (!w) continue; rank += 1; if (!freqRank.has(w)) freqRank.set(w, rank); }
        return freqRank;
      })
      .catch((e) => { freqLoading = null; throw e; });
    return freqLoading;
  }
  const freqOf = (term) => (freqRank ? freqRank.get(term) || null : null);
  function freqTier(rank) {
    if (rank == null) return { label: "rare", cls: "rare" };
    if (rank <= 1500) return { label: "very common", cls: "vcommon" };
    if (rank <= 5000) return { label: "common", cls: "common" };
    if (rank <= 15000) return { label: "uncommon", cls: "uncommon" };
    return { label: "rare", cls: "rare" };
  }

  // ---- Definitions (JMdict common subset, CC BY-SA) -----------------------
  let glossMap = null, glossLoading = null;
  function loadGloss() {
    if (glossMap) return Promise.resolve(glossMap);
    if (glossLoading) return glossLoading;
    glossLoading = fetch("vendor/dict/jmdict-min.json")
      .then((r) => { if (!r.ok) throw new Error("gloss " + r.status); return r.json(); })
      .then((m) => { glossMap = m; return m; })
      .catch((e) => { glossLoading = null; throw e; });
    return glossLoading;
  }
  const glossOf = (term, surface) => (glossMap ? (glossMap[term] || (surface ? glossMap[surface] : null) || null) : null);

  const kataToHira = (s) => String(s || "").replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const hasKanji = (s) => /[㐀-鿿]/.test(s || "");
  const isKana = (ch) => /[぀-ヿｦ-ﾝー]/.test(ch);
  // Build "kanji[reading]" for one token, peeling shared okurigana off both ends.
  function tokenFurigana(surface, readingKata) {
    if (!hasKanji(surface) || !readingKata || readingKata === "*") return surface;
    let s = surface, r = kataToHira(readingKata), pre = "", suf = "";
    while (s && r && isKana(s[0]) && s[0] === r[0]) { pre += s[0]; s = s.slice(1); r = r.slice(1); }
    while (s && r && isKana(s[s.length - 1]) && s[s.length - 1] === r[r.length - 1]) { suf = s[s.length - 1] + suf; s = s.slice(0, -1); r = r.slice(0, -1); }
    if (!s || !r) return surface;
    return pre + s + "[" + r + "]" + suf;
  }
  function autoFurigana(text) {
    return loadTokenizer().then((tok) =>
      tok.tokenize(plainJP(text)).map((t) => tokenFurigana(t.surface_form, t.reading)).join("")
    );
  }
  function furiganaHTML(s) {
    s = String(s || "");
    const re = /([^\s[\]]+)\[([^\]]*)\]/g;
    let out = "", i = 0, m;
    while ((m = re.exec(s))) {
      out += escHTML(s.slice(i, m.index));
      out += "<ruby>" + escHTML(m[1]) + "<rt>" + escHTML(m[2]) + "</rt></ruby>";
      i = m.index + m[0].length;
    }
    return out + escHTML(s.slice(i));
  }

  function speakTTS(text, lang, rate) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = rate;
    if (lang.startsWith("ja") && jaVoice) u.voice = jaVoice;
    if (lang.startsWith("en") && enVoice) u.voice = enVoice;
    speechSynthesis.speak(u);
  }

  function speak(text, { lang = "ja-JP", rate = 1.0 } = {}) {
    text = plainJP(text);
    speechSynthesis.cancel();
    stopAudio();
    const clip = lang.startsWith("ja") && clips && clips[text];
    if (clip) {
      const slow = rate < 1;
      const a = new Audio("audio/" + (slow && clip.s ? clip.s : clip.n));
      a.playbackRate = slow && !clip.s ? rate : 1.0; // a slow clip is already slowed
      curAudio = a;
      let fell = false;
      const fallback = () => { if (fell) return; fell = true; if (curAudio === a) curAudio = null; speakTTS(text, lang, rate); };
      a.addEventListener("error", fallback, { once: true });
      a.play().catch(fallback);
      return;
    }
    speakTTS(text, lang, rate);
  }

  // ---- Navigation ----------------------------------------------------------
  const screens = [el.home, el.intro, el.drill, el.done, el.settings, el.mineForm, el.importForm, el.reader];
  function show(screen, { back = false } = {}) {
    speechSynthesis.cancel();
    stopAudio();
    screens.forEach((s) => (s.hidden = s !== screen));
    if (el.readerPop) el.readerPop.hidden = true;
    el.backBtn.hidden = !back;
    if (el.settingsBtn) el.settingsBtn.hidden = screen === el.settings;
    el.mastery.hidden = !(screen === el.home || screen === el.intro);
  }

  const reviewsToday = () => (prog.daily.day === todayStr() ? prog.daily.count : 0);

  function masteryStats() {
    let passed = 0;
    for (const c of CARDS) { const p = prog.cards[c.id]; if (p && p.reps && p.interval >= 1) passed += 1; }
    return { passed, total: CARDS.length, pct: CARDS.length ? passed / CARDS.length : 0 };
  }

  // Daily-goal ring: fill = today's reviews / goal, center = 🔥streak, gold when met.
  function renderDailyRing() {
    const goal = settings.dailyGoal || 20;
    const done = reviewsToday();
    const pct = Math.max(0, Math.min(1, goal ? done / goal : 0));
    el.ringFill.style.strokeDasharray = (pct * 100).toFixed(1) + " 100";
    const complete = done >= goal && goal > 0;
    el.dailyRing.classList.toggle("complete", complete);
    const s = prog.streak.current;
    el.ringLabel.textContent = s > 0 ? "🔥" + s : String(done);
    el.dailyRing.hidden = false;
    el.dailyRing.setAttribute("aria-label", done + " of " + goal + " reviews today · " + s + "-day streak");
    el.dailyRing.title = el.dailyRing.getAttribute("aria-label");
  }

  function renderMastery() {
    const m = masteryStats();
    el.masteryFill.style.width = Math.round(m.pct * 100) + "%";
    el.masteryPct.textContent = Math.round(m.pct * 100) + "%";
    el.mastery.title = m.passed + " of " + m.total + " sentences mastered";
  }

  // ---- Immersion log -------------------------------------------------------
  function fmtHours(min) {
    const h = min / 60;
    return (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10).toString();
  }
  function immersionStreak() {
    let n = 0;
    for (let i = 0; ; i++) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      if ((prog.immersion[d] || 0) > 0) n += 1;
      else if (i === 0) continue;       // today not logged yet doesn't break a prior streak
      else break;
    }
    return n;
  }
  function addImmersion(min) {
    const t = todayStr();
    prog.immersion[t] = Math.max(0, (prog.immersion[t] || 0) + min);
    if (prog.immersion[t] === 0) delete prog.immersion[t];
    save();
    renderImmersion();
  }
  function editImmersion() {
    const t = todayStr();
    const cur = prog.immersion[t] || 0;
    const v = prompt("Minutes immersed today:", String(cur));
    if (v === null) return;
    const n = Math.max(0, Math.round(Number(v)) || 0);
    if (n === 0) delete prog.immersion[t]; else prog.immersion[t] = n;
    save();
    renderImmersion();
  }
  function renderImmersion() {
    el.immersion.innerHTML = "";
    const today = prog.immersion[todayStr()] || 0;
    const total = Object.values(prog.immersion).reduce((a, b) => a + b, 0);
    const streak = immersionStreak();

    const card = document.createElement("div");
    card.className = "imm-card";
    const head = document.createElement("div"); head.className = "imm-head";
    head.appendChild(span("imm-total", fmtHours(total)));
    head.appendChild(span("imm-unit", "hours immersed"));
    if (streak > 0) head.appendChild(span("imm-streak", "🎧 " + streak + "d"));
    card.appendChild(head);

    const today_row = document.createElement("div"); today_row.className = "imm-today";
    today_row.textContent = today > 0 ? "Today: " + today + " min" : "No immersion logged today";
    card.appendChild(today_row);

    if (prog.known.length > 0) {
      const g = knownGrowth(7);
      const kr = document.createElement("div"); kr.className = "imm-known";
      kr.appendChild(span("imm-known-n", "📚 " + prog.known.length));
      kr.appendChild(span("imm-known-l", "words known" + (g > 0 ? " · +" + g + " this week" : "")));
      card.appendChild(kr);
    }

    const actions = document.createElement("div"); actions.className = "imm-actions";
    for (const m of [15, 30, 60]) {
      const b = Object.assign(document.createElement("button"), { className: "imm-add", textContent: "+" + m + "m" });
      b.addEventListener("click", () => addImmersion(m));
      actions.appendChild(b);
    }
    const edit = Object.assign(document.createElement("button"), { className: "imm-edit", textContent: "edit" });
    edit.addEventListener("click", editImmersion);
    actions.appendChild(edit);
    card.appendChild(actions);

    el.immersion.appendChild(card);
  }

  function knownGrowth(days) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    let base = 0;
    for (const d of Object.keys(prog.knownHistory).sort()) {
      if (d <= cutoff) base = prog.knownHistory[d]; else break;
    }
    return prog.known.length - base;
  }

  // ---- Mining: user-added sentences ---------------------------------------
  function minedCards() { return CARDS.filter((c) => c.mined); }

  function renderMining() {
    el.mining.innerHTML = "";
    const block = document.createElement("div");
    block.className = "tier-block";

    const head = document.createElement("div");
    head.className = "tier-head";
    const text = document.createElement("div"); text.className = "tier-text";
    text.appendChild(Object.assign(document.createElement("h2"), { className: "tier-name", textContent: "My sentences" }));
    text.appendChild(Object.assign(document.createElement("div"), { className: "tier-blurb", textContent: "Mine lines you meet in the wild" }));
    head.appendChild(text);
    const read = Object.assign(document.createElement("button"), { className: "mine-add mine-import", textContent: "📖 Read" });
    read.addEventListener("click", openReader);
    head.appendChild(read);
    const imp = Object.assign(document.createElement("button"), { className: "mine-add mine-import", textContent: "⤓ Import" });
    imp.addEventListener("click", openImportForm);
    head.appendChild(imp);
    const add = Object.assign(document.createElement("button"), { className: "mine-add", textContent: "＋ Add" });
    add.addEventListener("click", openMineForm);
    head.appendChild(add);
    block.appendChild(head);

    const cards = minedCards();
    if (!cards.length) {
      block.appendChild(Object.assign(document.createElement("div"), {
        className: "mine-empty",
        textContent: "Heard or read a sentence you liked? Add it and drill it with spaced repetition — audio included.",
      }));
      el.mining.appendChild(block);
      return;
    }

    const now = Date.now();
    const due = cards.filter((c) => { const p = prog.cards[c.id]; return p && p.reps && p.due <= now; }).length;
    const fresh = cards.filter((c) => { const p = prog.cards[c.id]; return !p || !p.reps; }).length;

    const tile = document.createElement("button");
    tile.className = "lesson-tile";
    const top = document.createElement("div"); top.className = "tile-top";
    const left = document.createElement("div");
    left.appendChild(Object.assign(document.createElement("div"), { className: "tile-title", textContent: "Drill my sentences" }));
    left.appendChild(Object.assign(document.createElement("div"), { className: "tile-grammar", textContent: cards.length + " sentence" + (cards.length === 1 ? "" : "s") }));
    top.appendChild(left);
    const badge = document.createElement("span");
    if (due > 0) { badge.className = "tile-badge badge-due"; badge.textContent = due + " due"; }
    else if (fresh > 0) { badge.className = "tile-badge badge-new"; badge.textContent = fresh + " new"; }
    else { badge.className = "tile-badge badge-done"; badge.textContent = "✓ fresh"; }
    top.appendChild(badge);
    tile.appendChild(top);
    tile.addEventListener("click", startMined);
    block.appendChild(tile);

    const list = document.createElement("div"); list.className = "mine-list";
    for (const m of prog.mined) {
      const item = document.createElement("div"); item.className = "mine-item";
      const t = document.createElement("div"); t.className = "mine-item-text";
      t.appendChild(Object.assign(document.createElement("div"), { className: "mine-item-jp", innerHTML: furiganaHTML(m.jp) }));
      t.appendChild(Object.assign(document.createElement("div"), { className: "mine-item-en", textContent: m.en }));
      item.appendChild(t);
      const play = Object.assign(document.createElement("button"), { className: "mine-del", textContent: "🔈", title: "Hear it" });
      play.setAttribute("aria-label", "Hear sentence");
      play.addEventListener("click", () => speak(m.jp, { lang: "ja-JP" }));
      item.appendChild(play);
      const del = Object.assign(document.createElement("button"), { className: "mine-del", textContent: "×", title: "Delete" });
      del.setAttribute("aria-label", "Delete sentence");
      del.addEventListener("click", () => deleteMined(m.id));
      item.appendChild(del);
      list.appendChild(item);
    }
    block.appendChild(list);
    el.mining.appendChild(block);
  }

  function openMineForm(prefillJp) {
    el.mineJp.value = prefillJp || ""; el.mineEn.value = ""; el.mineRomaji.value = ""; el.mineHint.value = "";
    el.mineError.hidden = true;
    show(el.mineForm, { back: true });
    if (prefillJp) { el.mineFuriBtn.click(); el.mineEn.focus(); }
    else el.mineJp.focus();
  }

  function saveMined() {
    const jp = el.mineJp.value.trim();
    const en = el.mineEn.value.trim();
    if (!jp || !en) {
      el.mineError.textContent = "Please fill in both the Japanese and its meaning.";
      el.mineError.hidden = false;
      return;
    }
    const m = {
      id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      jp, en,
      romaji: el.mineRomaji.value.trim(),
      hint: el.mineHint.value.trim(),
      added: Date.now(),
    };
    prog.mined.unshift(m);
    rebuildMined();
    save();
    renderHome();
  }

  // ---- Import (Migaku / Anki / spreadsheet exports) -----------------------
  function splitRow(line) {
    if (line.indexOf("\t") !== -1) return line.split("\t");
    return line.split(",");
  }
  // Parse pasted text into {jp, en, romaji} rows, skipping blanks/incomplete lines.
  function parseImport(text) {
    const rows = [];
    let skipped = 0;
    for (const raw of String(text).split(/\r?\n/)) {
      if (!raw.trim()) continue;
      const cols = splitRow(raw).map((c) => c.trim());
      const jp = cols[0] || "", en = cols[1] || "";
      if (!jp || !en) { skipped += 1; continue; }
      rows.push({ jp, en, romaji: cols[2] || "" });
    }
    return { rows, skipped };
  }
  function refreshImportStatus() {
    const { rows, skipped } = parseImport(el.importText.value);
    const have = new Set(prog.mined.map((m) => m.jp + "" + m.en));
    let fresh = 0;
    const seen = new Set();
    for (const r of rows) {
      const key = r.jp + "" + r.en;
      if (have.has(key) || seen.has(key)) continue;
      seen.add(key); fresh += 1;
    }
    const dup = rows.length - fresh;
    const parts = [];
    if (fresh) parts.push(fresh + " new sentence" + (fresh === 1 ? "" : "s"));
    if (dup) parts.push(dup + " already saved");
    if (skipped) parts.push(skipped + " line" + (skipped === 1 ? "" : "s") + " skipped (need 2 columns)");
    el.importStatus.textContent = parts.length ? "Ready: " + parts.join(" · ") : "";
    el.importDoBtn.disabled = fresh === 0;
    return fresh;
  }
  function openImportForm() {
    el.importText.value = "";
    el.importStatus.textContent = "";
    el.importError.hidden = true;
    el.importDoBtn.disabled = true;
    show(el.importForm, { back: true });
    el.importText.focus();
  }
  function doImport() {
    const { rows } = parseImport(el.importText.value);
    const have = new Set(prog.mined.map((m) => m.jp + "" + m.en));
    const fresh = [];
    for (const r of rows) {
      const key = r.jp + "" + r.en;
      if (have.has(key)) continue;
      have.add(key);
      fresh.push({
        id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        jp: r.jp, en: r.en, romaji: r.romaji, hint: "", added: Date.now(),
      });
    }
    if (!fresh.length) {
      el.importError.textContent = "Nothing new to import.";
      el.importError.hidden = false;
      return;
    }
    prog.mined = fresh.concat(prog.mined);
    rebuildMined();
    save();
    renderHome();
  }

  // ---- Reader (paste text, color by known/unknown, tap to mine) -----------
  const READER_KEY = "hanasou.reader";
  const POS_EN = { "名詞": "noun", "動詞": "verb", "形容詞": "adjective", "副詞": "adverb", "助詞": "particle", "助動詞": "aux. verb", "接続詞": "conjunction", "連体詞": "adnominal", "感動詞": "interjection", "記号": "symbol", "接頭詞": "prefix", "フィラー": "filler", "その他": "other" };
  const CONTENT_POS = /^(名詞|動詞|形容詞|副詞)$/;
  const tokTerm = (t) => (t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form);
  let readerSpans = [];   // [{el, term}] content-word spans, for live recolor

  function openReader() {
    el.readerInput.value = localStorage.getItem(READER_KEY) || "";
    el.readerError.hidden = true;
    el.readerResult.hidden = true;
    el.readerPop.hidden = true;
    readerSpans = [];
    show(el.reader, { back: true });
    if (!el.readerInput.value) el.readerInput.focus();
  }

  function analyzeReader() {
    const text = el.readerInput.value.trim();
    if (!text) return;
    localStorage.setItem(READER_KEY, text);
    const btn = el.readerAnalyzeBtn;
    btn.disabled = true;
    btn.textContent = kuroTok ? "analyzing…" : "⏳ loading dictionary…";
    el.readerError.hidden = true;
    Promise.all([loadTokenizer(), loadFreq().catch(() => null), loadGloss().catch(() => null)])
      .then(([tok]) => renderReader(tok, text))
      .catch((e) => {
        el.readerError.textContent = "Word analysis needs the dictionary, which downloads once while online. (" + e.message + ")";
        el.readerError.hidden = false;
      })
      .finally(() => { btn.disabled = false; btn.textContent = "analyze"; });
  }

  function renderReader(tok, text) {
    el.readerPop.hidden = true;
    readerSpans = [];
    const wrap = el.readerText;
    wrap.innerHTML = "";
    const lines = text.split(/\r?\n/);
    lines.forEach((line, li) => {
      if (li) wrap.appendChild(document.createElement("br"));
      if (!line.trim()) return;
      for (const sentence of line.split(/(?<=[。．.!?！？])/)) {
        if (!sentence) continue;
        for (const t of tok.tokenize(plainJP(sentence))) {
          const isContent = CONTENT_POS.test(t.pos);
          const node = document.createElement(isContent ? "button" : "span");
          node.className = "rt-tok";
          node.textContent = t.surface_form;
          if (isContent) {
            const term = tokTerm(t);
            node.classList.add(isKnown(term) ? "known" : "unknown");
            node.addEventListener("click", () => openReaderPop(t, sentence, node));
            readerSpans.push({ el: node, term, t, sentence });
          } else {
            node.classList.add("plain");
          }
          wrap.appendChild(node);
        }
      }
    });
    refreshReaderCoverage();
    el.readerResult.hidden = false;
  }

  function renderLearnList() {
    const wrap = el.readerLearn;
    wrap.innerHTML = "";
    const uniq = new Map();
    for (const s of readerSpans) { if (isKnown(s.term) || uniq.has(s.term)) continue; uniq.set(s.term, s); }
    const items = [...uniq.values()].map((s) => Object.assign({ rank: freqOf(s.term) }, s));
    items.sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9));
    if (!items.length) return;
    wrap.appendChild(span("rl-title", "Words to learn here — most common first"));
    const row = document.createElement("div"); row.className = "rl-row";
    for (const it of items.slice(0, 24)) {
      const tier = freqTier(it.rank);
      const chip = document.createElement("button");
      chip.className = "rl-chip freq-" + tier.cls;
      chip.appendChild(span("rl-word", it.t.surface_form));
      chip.appendChild(span("rl-tier", tier.label));
      chip.addEventListener("click", () => openReaderPop(it.t, it.sentence, it.el));
      row.appendChild(chip);
    }
    wrap.appendChild(row);
  }

  function refreshReaderCoverage() {
    let known = 0;
    for (const s of readerSpans) {
      const k = isKnown(s.term);
      s.el.classList.toggle("known", k);
      s.el.classList.toggle("unknown", !k);
      if (k) known += 1;
    }
    const total = readerSpans.length;
    const pct = total ? Math.round((known / total) * 100) : 0;
    el.readerCoverage.innerHTML = "";
    const lab = document.createElement("div");
    lab.className = "rc-label";
    lab.appendChild(span("rc-pct", pct + "%"));
    lab.appendChild(span("rc-text", "comprehension · " + known + " / " + total + " content words known"));
    el.readerCoverage.appendChild(lab);
    const bar = document.createElement("div"); bar.className = "rc-bar";
    const fill = document.createElement("i"); fill.style.width = pct + "%";
    bar.appendChild(fill);
    el.readerCoverage.appendChild(bar);
    renderLearnList();
  }

  function openReaderPop(t, sentence, node) {
    document.querySelectorAll(".rt-tok.active").forEach((n) => n.classList.remove("active"));
    node.classList.add("active");
    const term = tokTerm(t);
    const reading = t.reading && t.reading !== "*" ? kataToHira(t.reading) : "";
    const pop = el.readerPop;
    pop.innerHTML = "";

    const close = Object.assign(document.createElement("button"), { className: "rp-close", textContent: "×" });
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => { pop.hidden = true; node.classList.remove("active"); });
    pop.appendChild(close);

    const head = document.createElement("div"); head.className = "rp-head";
    head.appendChild(span("rp-jp", t.surface_form));
    if (reading && reading !== t.surface_form) head.appendChild(span("rp-read", reading));
    head.appendChild(span("rp-pos", POS_EN[t.pos] || t.pos));
    pop.appendChild(head);

    const rank = freqOf(term);
    const tier = freqTier(rank);
    pop.appendChild(span("rp-freq freq-" + tier.cls, tier.label + (rank ? " · #" + rank : "")));

    const def = glossOf(term, t.surface_form);
    if (def) pop.appendChild(span("rp-gloss", def));

    const row = document.createElement("div"); row.className = "rp-actions";
    const knownBtn = document.createElement("button");
    knownBtn.className = "secondary small";
    const setLbl = () => { knownBtn.textContent = isKnown(term) ? "✓ known" : "mark known"; };
    setLbl();
    knownBtn.addEventListener("click", () => { toggleKnown(term); setLbl(); refreshReaderCoverage(); });
    row.appendChild(knownBtn);

    const jisho = document.createElement("a");
    jisho.className = "secondary small"; jisho.textContent = "Jisho ↗";
    jisho.href = "https://jisho.org/search/" + encodeURIComponent(term);
    jisho.target = "_blank"; jisho.rel = "noopener noreferrer";
    row.appendChild(jisho);

    const hear = Object.assign(document.createElement("button"), { className: "secondary small", textContent: "🔈" });
    hear.addEventListener("click", () => speak(t.surface_form, { lang: "ja-JP" }));
    row.appendChild(hear);

    const mineBtn = Object.assign(document.createElement("button"), { className: "primary small", textContent: "★ mine sentence" });
    mineBtn.addEventListener("click", () => { pop.hidden = true; node.classList.remove("active"); mineSentenceFromReader(sentence.trim()); });
    row.appendChild(mineBtn);

    pop.appendChild(row);
    pop.hidden = false;
  }

  function mineSentenceFromReader(sentence) {
    openMineForm(sentence);
  }

  function deleteMined(id) {
    const m = prog.mined.find((x) => x.id === id);
    if (m && !confirm("Delete this sentence?\n\n" + m.jp)) return;
    prog.mined = prog.mined.filter((x) => x.id !== id);
    delete prog.cards["mined#" + id];
    rebuildMined();
    save();
    renderHome();
  }

  function startMined() {
    const cards = minedCards();
    if (!cards.length) return;
    startSession(cards, "mined", null);
  }

  // ---- Home ----------------------------------------------------------------
  function renderHome() {
    renderDailyRing();
    renderMastery();
    const due = dueCards().length;
    const learned = Object.values(prog.cards).filter((p) => p.reps).length;
    el.stats.innerHTML = "";
    const tiles = [
      { num: prog.streak.current, lbl: "day streak" },
      { num: learned, lbl: "cards learned" },
      { num: prog.reviews, lbl: "total reviews" },
    ];
    for (const t of tiles) {
      const tile = document.createElement("div");
      tile.className = "stat-tile";
      tile.appendChild(span("stat-num", String(t.num)));
      tile.appendChild(span("stat-lbl", t.lbl));
      el.stats.appendChild(tile);
    }

    el.reviewBtn.hidden = due === 0;
    el.reviewBtn.textContent = `🔁 Review ${due} due card${due === 1 ? "" : "s"}`;

    renderImmersion();
    renderMining();

    el.lessonMap.innerHTML = "";

    // Level tabs — each level nests its own difficulty tiers.
    const levelLessons = (lv) =>
      window.LESSONS.filter((L) => lv.tiers.some((t) => t.themes.includes(L.section)));
    if (!window.LEVELS.some((l) => l.id === settings.activeLevel))
      settings.activeLevel = window.LEVELS[0].id;

    const tabs = document.createElement("div");
    tabs.className = "level-tabs";
    for (const lv of window.LEVELS) {
      const tab = document.createElement("button");
      tab.className = "level-tab" + (lv.id === settings.activeLevel ? " active" : "");
      tab.appendChild(span("level-tab-name", lv.name));
      tab.appendChild(span("level-tab-title", lv.title));
      if (!levelLessons(lv).length) tab.appendChild(span("level-tab-soon", "soon"));
      tab.addEventListener("click", () => {
        settings.activeLevel = lv.id; saveSettings(); renderHome();
      });
      tabs.appendChild(tab);
    }
    el.lessonMap.appendChild(tabs);

    const level = window.LEVELS.find((l) => l.id === settings.activeLevel);
    if (level.blurb)
      el.lessonMap.appendChild(Object.assign(document.createElement("div"),
        { className: "level-blurb", textContent: level.blurb }));

    for (const tier of level.tiers) {
      const tierLessons = window.LESSONS.filter((L) => tier.themes.includes(L.section));

      const tierBlock = document.createElement("div");
      tierBlock.className = "tier-block";
      const tHead = document.createElement("div");
      tHead.className = "tier-head";
      const tText = document.createElement("div"); tText.className = "tier-text";
      tText.appendChild(Object.assign(document.createElement("h2"), { className: "tier-name", textContent: tier.name }));
      if (tier.blurb) tText.appendChild(Object.assign(document.createElement("div"), { className: "tier-blurb", textContent: tier.blurb }));
      tHead.appendChild(tText);
      if (tierLessons.length) {
        const done = tierLessons.filter((L) => { const s = lessonStats(L); return s.passed >= s.total; }).length;
        tHead.appendChild(span("tier-count", done + "/" + tierLessons.length));
      }

      if (!tierLessons.length) {
        tierBlock.appendChild(tHead);
        tierBlock.appendChild(Object.assign(document.createElement("div"), { className: "tier-soon", textContent: "Coming soon" }));
        el.lessonMap.appendChild(tierBlock);
        continue;
      }

      const collapsed = !!settings.collapsedTiers[tier.name];
      tHead.appendChild(span("tier-chevron", "▾"));
      tHead.setAttribute("role", "button");
      tHead.tabIndex = 0;
      tHead.setAttribute("aria-expanded", String(!collapsed));
      tierBlock.appendChild(tHead);

      const body = document.createElement("div");
      body.className = "tier-body";
      body.hidden = collapsed;
      tierBlock.classList.toggle("collapsed", collapsed);

      const toggleTier = () => {
        const now = !settings.collapsedTiers[tier.name];
        settings.collapsedTiers[tier.name] = now;
        saveSettings();
        body.hidden = now;
        tierBlock.classList.toggle("collapsed", now);
        tHead.setAttribute("aria-expanded", String(!now));
      };
      tHead.addEventListener("click", toggleTier);
      tHead.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTier(); }
      });

      for (const theme of tier.themes) {
        const lessons = window.LESSONS.filter((L) => L.section === theme);
        if (!lessons.length) continue;
        const block = document.createElement("div");
        block.className = "section-block";
        const head = document.createElement("div");
        head.className = "section-head";
        head.appendChild(Object.assign(document.createElement("h3"), { className: "section-title", textContent: theme }));
        const rule = document.createElement("div"); rule.className = "section-rule"; head.appendChild(rule);
        block.appendChild(head);

        for (const L of lessons) {
          const st = lessonStats(L);
          const tile = document.createElement("button");
          tile.className = "lesson-tile";
          const top = document.createElement("div"); top.className = "tile-top";
          const left = document.createElement("div");
          left.appendChild(Object.assign(document.createElement("div"), { className: "tile-title", textContent: L.title }));
          left.appendChild(Object.assign(document.createElement("div"), { className: "tile-grammar", textContent: L.grammar }));
          top.appendChild(left);

          const badge = document.createElement("span");
          if (st.passed >= st.total) { badge.className = "tile-badge badge-done"; badge.textContent = "✓ done"; }
          else if (st.due > 0) { badge.className = "tile-badge badge-due"; badge.textContent = st.due + " due"; }
          else if (st.fresh === st.total) { badge.className = "tile-badge badge-new"; badge.textContent = "new"; }
          else { badge.className = "tile-badge badge-due"; badge.textContent = st.passed + "/" + st.total; }
          top.appendChild(badge);
          tile.appendChild(top);

          const bar = document.createElement("div"); bar.className = "tile-bar";
          const fill = document.createElement("i"); fill.style.width = Math.round(st.pct * 100) + "%";
          bar.appendChild(fill); tile.appendChild(bar);

          tile.addEventListener("click", () => openIntro(L));
          block.appendChild(tile);
        }
        body.appendChild(block);
      }
      tierBlock.appendChild(body);
      el.lessonMap.appendChild(tierBlock);
    }
    show(el.home);
  }

  // ---- Lesson intro --------------------------------------------------------
  let activeLesson = null;
  function openIntro(L) {
    activeLesson = L;
    el.lessonTitle.textContent = L.title;
    el.lessonGrammar.textContent = L.grammar;
    el.lessonNote.textContent = L.grammarNote || "";
    el.vocabList.innerHTML = "";
    for (const w of L.vocab) {
      const row = document.createElement("button");
      row.className = "vocab-row pos-" + (w.pos || "n");
      row.appendChild(span("v-jp", w.jp));
      row.appendChild(span("v-romaji", w.romaji));
      row.appendChild(span("v-en", w.en));
      row.addEventListener("click", () => speak(w.jp, { lang: "ja-JP" }));
      el.vocabList.appendChild(row);
    }
    show(el.intro, { back: true });
  }

  // ---- Drill ---------------------------------------------------------------
  let session = null; // { queue, total, cleared, mode, lessonId }

  function startSession(cards, mode, lessonId, opts) {
    session = { queue: cards.slice(), total: cards.length, cleared: 0, mode, lessonId, flip: false, build: !!(opts && opts.build) };
    show(el.drill, { back: true });
    nextCard();
  }

  function startLesson(L, opts) {
    const cards = CARDS.filter((c) => c.lessonId === L.id);
    startSession(cards, "lesson", L.id, opts);
  }
  function startReview() {
    const cards = dueCards();
    if (!cards.length) return;
    startSession(cards, "review", null);
  }

  // produce = see English, say Japanese · recognize = see Japanese, recall meaning
  function cardDirection() {
    const d = settings.direction;
    if (d === "recognize") return "recognize";
    if (d === "both") { session.flip = !session.flip; return session.flip ? "recognize" : "produce"; }
    return "produce";
  }

  let current = null;
  function nextCard() {
    if (session.cleared >= session.total || session.queue.length === 0) { finish(); return; }
    current = session.queue.shift();
    current.dir = cardDirection();
    renderCard();
    el.progressFill.style.width = Math.round((session.cleared / session.total) * 100) + "%";
  }

  function renderCard() {
    const s = current.s;
    // Build mode needs at least one word chip; single-word set phrases just get
    // tapped into place so every card in a build session behaves the same way.
    const doBuild = session.build && s.words && s.words.length >= 1;
    current.doBuild = doBuild;
    const recognize = !doBuild && current.dir === "recognize";
    el.promptLabel.textContent = doBuild ? "Build the sentence" : (recognize ? "What does this mean?" : "Say this in Japanese");
    if (recognize) el.promptEn.innerHTML = furiganaHTML(s.jp);
    else el.promptEn.textContent = s.en;
    el.promptEn.classList.toggle("jp", recognize);
    el.revealLabel.textContent = recognize ? "Meaning" : "Model answer";
    if (recognize) el.answerKana.textContent = s.en;
    else el.answerKana.innerHTML = furiganaHTML(s.jp);
    el.answerRomaji.textContent = s.romaji;
    el.playEnBtn.textContent = recognize ? "🔈 hear" : "🔈 prompt";
    el.playEnBtn.title = recognize ? "Hear the Japanese prompt" : "Hear the English prompt";
    el.hint.textContent = s.hint || "";
    el.hintRow.hidden = !s.hint;
    el.hint.hidden = true;
    el.showHintBtn.hidden = false;
    el.revealArea.hidden = true;
    el.replayBtn.hidden = true;
    el.slowBtn.hidden = true;
    el.mineThisBtn.hidden = true;
    el.grade.hidden = true;
    el.revealBtn.disabled = false;
    el.revealBtn.hidden = doBuild;       // no manual reveal — solving the puzzle reveals it
    el.buildArea.hidden = !doBuild;
    renderWordChips(s);
    if (doBuild) startBuild(s);
  }

  // ---- Build-the-sentence mode --------------------------------------------
  let build = null; // { correct:[tok], placed:[item], bank:[item], solved }

  function startBuild(s) {
    const items = s.words.map((w, i) => ({ tok: w.jp, pos: w.pos || "n", uid: i }));
    const correct = s.words.map((w) => w.jp);
    const bank = items.slice();
    // Shuffle, but avoid handing back the already-correct order.
    for (let tries = 0; tries < 12; tries++) {
      for (let i = bank.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bank[i], bank[j]] = [bank[j], bank[i]];
      }
      if (bank.some((it, i) => it.tok !== correct[i])) break;
    }
    build = { correct, placed: [], bank, solved: false };
    renderBuild();
  }

  function buildChip(item, cls) {
    const c = document.createElement("button");
    c.className = "build-chip pos-" + item.pos + (cls ? " " + cls : "");
    c.textContent = item.tok;
    return c;
  }

  function renderBuild() {
    const full = build.placed.length === build.correct.length;
    const allOk = full && build.placed.every((it, i) => it.tok === build.correct[i]);

    el.buildAnswer.innerHTML = "";
    if (!build.placed.length) el.buildAnswer.appendChild(span("build-ph", "tap the words below, in order"));
    build.placed.forEach((item, idx) => {
      let cls = "placed";
      if (full) cls += item.tok === build.correct[idx] ? " ok" : " bad";
      const chip = buildChip(item, cls);
      chip.addEventListener("click", () => {
        speak(item.tok, { lang: "ja-JP" });
        if (!build.solved) { build.bank.push(build.placed.splice(idx, 1)[0]); renderBuild(); }
      });
      el.buildAnswer.appendChild(chip);
    });

    el.buildBank.innerHTML = "";
    build.bank.forEach((item) => {
      const chip = buildChip(item, "bank");
      chip.addEventListener("click", () => {
        speak(item.tok, { lang: "ja-JP" });
        build.bank.splice(build.bank.indexOf(item), 1);
        build.placed.push(item);
        renderBuild();
      });
      el.buildBank.appendChild(chip);
    });

    el.buildReset.hidden = allOk || !build.placed.length;
    if (allOk && !build.solved) {
      build.solved = true;
      el.buildAnswer.classList.add("solved");
      reveal();
    } else {
      el.buildAnswer.classList.remove("solved");
    }
  }

  // ---- Word chips + known-words tracking ----------------------------------
  const isKnown = (term) => prog.known.includes(term);
  function toggleKnown(term) {
    const i = prog.known.indexOf(term);
    if (i >= 0) prog.known.splice(i, 1); else prog.known.push(term);
    prog.knownHistory[todayStr()] = prog.known.length;
    save();
  }
  const POS_MAP = { "名詞": "n", "動詞": "v", "形容詞": "adj", "副詞": "adv", "助詞": "prt", "助動詞": "aux", "接続詞": "conj", "連体詞": "adj", "感動詞": "expr" };
  function makeWordChip({ jp, reading, gloss, pos, term }) {
    const chip = document.createElement("div");
    chip.className = "word-chip pos-" + (pos || "n");
    if (isKnown(term)) chip.classList.add("known");
    const main = document.createElement("button");
    main.className = "wc-main";
    main.appendChild(span("wc-jp", jp));
    if (reading && reading !== jp) main.appendChild(span("wc-read", reading));
    if (gloss) main.appendChild(span("wc-en", gloss));
    main.addEventListener("click", () => { toggleKnown(term); chip.classList.toggle("known", isKnown(term)); });
    chip.appendChild(main);
    const jisho = document.createElement("a");
    jisho.className = "wc-jisho"; jisho.textContent = "↗";
    jisho.href = "https://jisho.org/search/" + encodeURIComponent(term);
    jisho.target = "_blank"; jisho.rel = "noopener noreferrer";
    jisho.title = "Look up “" + term + "” on Jisho";
    chip.appendChild(jisho);
    return chip;
  }
  function renderTokenChips(s) {
    el.wordBreakdown.innerHTML = "";
    let unknownContent = 0;
    for (const t of kuroTok.tokenize(plainJP(s.jp))) {
      if (/記号|フィラー|その他/.test(t.pos)) continue;
      const term = t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form;
      const reading = t.reading && t.reading !== "*" ? kataToHira(t.reading) : "";
      const gloss = glossOf(term, t.surface_form);
      el.wordBreakdown.appendChild(makeWordChip({ jp: t.surface_form, reading, gloss, pos: POS_MAP[t.pos] || "n", term }));
      if (CONTENT_POS.test(t.pos) && !isKnown(term)) unknownContent += 1;
    }
    if (unknownContent === 1) {
      const badge = span("ip1-badge", "i+1 — one new word");
      el.wordBreakdown.insertBefore(badge, el.wordBreakdown.firstChild);
    }
  }
  function renderWordChips(s) {
    el.wordBreakdown.innerHTML = "";
    if (s.words && s.words.length) {
      for (const w of s.words) el.wordBreakdown.appendChild(makeWordChip({ jp: w.jp, gloss: w.en, pos: w.pos, term: w.jp }));
      return;
    }
    if (!current.mined) return;
    if (kuroTok) { loadGloss().catch(() => null).then(() => renderTokenChips(s)); return; }
    const btn = document.createElement("button");
    btn.className = "wc-analyze"; btn.textContent = "🔤 break into words";
    btn.addEventListener("click", () => {
      btn.disabled = true; btn.textContent = "⏳ loading dictionary…";
      Promise.all([loadTokenizer(), loadGloss().catch(() => null)])
        .then(() => renderTokenChips(s))
        .catch(() => { btn.disabled = false; btn.textContent = "word breakdown unavailable offline"; });
    });
    el.wordBreakdown.appendChild(btn);
  }

  function reveal() {
    el.revealArea.hidden = false;
    el.replayBtn.hidden = false;
    el.slowBtn.hidden = false;
    if (!current.mined) {
      const already = prog.mined.some((m) => m.jp === current.s.jp && m.en === current.s.en);
      el.mineThisBtn.hidden = false;
      el.mineThisBtn.disabled = already;
      el.mineThisBtn.textContent = already ? "✓ mined" : "★ mine";
    }
    el.grade.hidden = false;
    el.revealBtn.disabled = true;
    speak(current.s.jp, { lang: "ja-JP" });
  }

  function mineCurrent() {
    const s = current.s;
    if (!prog.mined.some((m) => m.jp === s.jp && m.en === s.en)) {
      prog.mined.unshift({
        id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        jp: s.jp, en: s.en,
        romaji: s.romaji || "",
        hint: s.hint || "",
        words: s.words ? JSON.parse(JSON.stringify(s.words)) : undefined,
        added: Date.now(),
      });
      rebuildMined();
      save();
    }
    el.mineThisBtn.disabled = true;
    el.mineThisBtn.textContent = "✓ mined";
  }

  function grade(g) {
    srsUpdate(current.id, g);
    if (g === 0) session.queue.push(current); else session.cleared += 1;
    renderDailyRing();
    nextCard();
  }

  function finish() {
    el.progressFill.style.width = "100%";
    const due = dueCards().length;
    el.doneSummary.textContent = session.mode === "review"
      ? "Review session done. Nice work keeping things fresh."
      : session.mode === "mined"
        ? "Your sentences are in the rotation now — they'll resurface in your reviews."
        : (due > 0 ? `You've got ${due} card${due === 1 ? "" : "s"} due across all lessons.` : "Every sentence drilled. Come back tomorrow to lock it in.");
    show(el.done, { back: true });
  }

  // ---- Wire up -------------------------------------------------------------
  el.backBtn.addEventListener("click", renderHome);
  el.doneHomeBtn.addEventListener("click", renderHome);
  el.reviewBtn.addEventListener("click", startReview);
  el.startBtn.addEventListener("click", () => startLesson(activeLesson));
  el.buildBtn.addEventListener("click", () => startLesson(activeLesson, { build: true }));
  el.buildReset.addEventListener("click", () => { if (build && !build.solved) startBuild(current.s); });
  el.restartBtn.addEventListener("click", () => {
    if (session && session.mode === "review") startReview();
    else if (session && session.mode === "mined") startMined();
    else startLesson(activeLesson, { build: session && session.build });
  });

  el.mineSaveBtn.addEventListener("click", saveMined);
  el.mineCancelBtn.addEventListener("click", renderHome);
  el.minePreviewBtn.addEventListener("click", () => {
    const jp = el.mineJp.value.trim();
    if (jp) speak(jp, { lang: "ja-JP" });
  });
  el.mineFuriBtn.addEventListener("click", () => {
    const jp = el.mineJp.value.trim();
    if (!jp) return;
    const btn = el.mineFuriBtn;
    btn.disabled = true;
    btn.textContent = kuroTok ? "✨ …" : "⏳ loading dict";
    el.mineError.hidden = true;
    autoFurigana(jp)
      .then((out) => { el.mineJp.value = out; })
      .catch((e) => {
        el.mineError.textContent = "Furigana unavailable offline until the dictionary has loaded once. (" + e.message + ")";
        el.mineError.hidden = false;
      })
      .finally(() => { btn.disabled = false; btn.textContent = "✨ furigana"; });
  });

  el.importText.addEventListener("input", refreshImportStatus);
  el.importDoBtn.addEventListener("click", doImport);
  el.importCancelBtn.addEventListener("click", renderHome);

  el.readerAnalyzeBtn.addEventListener("click", analyzeReader);
  el.readerClearBtn.addEventListener("click", () => {
    el.readerInput.value = ""; el.readerResult.hidden = true; el.readerPop.hidden = true;
    readerSpans = []; localStorage.removeItem(READER_KEY); el.readerInput.focus();
  });

  el.revealBtn.addEventListener("click", reveal);
  el.replayBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP" }));
  el.slowBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP", rate: 0.7 }));
  el.mineThisBtn.addEventListener("click", mineCurrent);
  el.playEnBtn.addEventListener("click", () => {
    if (current.dir === "recognize") speak(current.s.jp, { lang: "ja-JP" });
    else speak(current.s.en, { lang: "en-US" });
  });
  el.showHintBtn.addEventListener("click", () => { el.hint.hidden = false; el.showHintBtn.hidden = true; });
  document.querySelectorAll("button.grade").forEach((b) => b.addEventListener("click", () => grade(Number(b.dataset.grade))));
  if (el.syncBtn) el.syncBtn.addEventListener("click", onSyncClick);

  el.settingsBtn.addEventListener("click", openSettings);
  el.dailyRing.addEventListener("click", renderHome);
  el.romajiToggle.addEventListener("change", () => {
    settings.romaji = el.romajiToggle.checked;
    saveSettings();
    applyRomaji();
  });
  el.goalSelect.addEventListener("change", () => {
    settings.dailyGoal = Number(el.goalSelect.value) || 20;
    saveSettings();
    renderDailyRing();
  });
  el.directionSelect.addEventListener("change", () => {
    settings.direction = el.directionSelect.value || "produce";
    saveSettings();
  });
  el.voiceSelect.addEventListener("change", () => {
    settings.voiceURI = el.voiceSelect.value;
    saveSettings();
    pickVoices();
    speak("こんにちは。はなしましょう。", { lang: "ja-JP" });
  });
  el.voiceTestBtn.addEventListener("click", () => speak("こんにちは。はなしましょう。", { lang: "ja-JP" }));
  el.syncConnectBtn.addEventListener("click", onSyncClick);
  el.syncDisconnectBtn.addEventListener("click", disconnectSync);
  el.resetBtn.addEventListener("click", resetProgress);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (el.drill.hidden) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (el.grade.hidden && !(current && current.doBuild)) reveal(); }
    else if (e.key === "1") grade(0);
    else if (e.key === "2") grade(1);
    else if (e.key === "3") grade(2);
    else if (e.key.toLowerCase() === "r") { if (!el.replayBtn.hidden) speak(current.s.jp, { lang: "ja-JP" }); }
    else if (e.key.toLowerCase() === "s") { if (!el.slowBtn.hidden) speak(current.s.jp, { lang: "ja-JP", rate: 0.7 }); }
  });

  applyRomaji();
  renderHome();
  renderSyncBtn();
  if (getToken()) pull();
})();

// Register the service worker for offline / installable PWA support, and prompt
// to reload when a freshly deployed version is ready (so updates never get stuck
// behind a stale cache).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("sw.js").then((reg) => {
      const notify = (worker) => {
        if (worker && navigator.serviceWorker.controller) showUpdateBanner(worker);
      };
      if (reg.waiting) notify(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener("statechange", () => { if (nw.state === "installed") notify(nw); });
      });
      // Check for a new deploy whenever the app regains focus (e.g. you reopen
      // it on mobile) — not just on full reload — so updates surface promptly.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
  });
}

function showUpdateBanner(worker) {
  if (document.getElementById("sw-update")) return;
  const bar = document.createElement("div");
  bar.id = "sw-update";
  bar.className = "sw-update";
  const text = document.createElement("span");
  text.className = "sw-update-text";
  text.textContent = "A new version is ready.";
  bar.appendChild(text);
  const btn = document.createElement("button");
  btn.className = "sw-update-btn";
  btn.textContent = "Reload";
  btn.addEventListener("click", () => { btn.disabled = true; worker.postMessage({ type: "SKIP_WAITING" }); });
  bar.appendChild(btn);
  document.body.appendChild(bar);
}
