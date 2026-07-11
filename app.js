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
  prog.practice = prog.practice || {};    // {"YYYY-MM-DD": reviews that day} — drives the weekly rhythm
  prog.kana = prog.kana || {};            // {kana char: strength} — introduced/practiced letters (drives romaji fade)
  prog.kanaMastery = prog.kanaMastery || {}; // {kana char: 0..5} — successful practice answers; drives the per-letter mastery bar
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
  // Romaji modes: auto (fade per word as its kana are learned) / always / never.
  if (!settings.kanaMode) settings.kanaMode = settings.romaji === false ? "never" : "auto";
  settings.voiceURI = settings.voiceURI || "";
  if (!settings.dailyGoal) settings.dailyGoal = 20;
  settings.collapsedTiers = settings.collapsedTiers || {};
  // Home cards (immersion log, My sentences) start collapsed into drop-down tabs.
  settings.collapsedHome = settings.collapsedHome || { immersion: true, mining: true };
  // One-time: force "My sentences" closed for users who had it expanded before
  // (a big imported deck makes it dominate the home screen). The toggle still works.
  if (!settings.miningCollapseMigrated) {
    settings.collapsedHome.mining = true;
    settings.miningCollapseMigrated = true;
    saveSettings();
  }
  settings.activeLevel = settings.activeLevel || (window.LEVELS[0] && window.LEVELS[0].id);
  settings.direction = settings.direction || "produce";   // produce | recognize | both
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  function applyRomaji() { document.body.classList.toggle("no-romaji", settings.kanaMode === "never"); }

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
      practice: mergeImmersion(local.practice, remote.practice),
      kana: mergeImmersion(local.kana, remote.kana),
      kanaMastery: mergeImmersion(local.kanaMastery, remote.kanaMastery),
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
        prog.practice = merged.practice || {};
        prog.kana = merged.kana || {};
        prog.kanaMastery = merged.kanaMastery || {};
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
    // gear is a toggle: if we're already on settings, resume the page we left
    if (!el.settings.hidden) {
      show(visibleScreen || el.home, { back: visibleBack });
      return;
    }
    el.romajiMode.value = settings.kanaMode;
    el.goalSelect.value = String(settings.dailyGoal);
    el.directionSelect.value = settings.direction;
    populateVoiceSelect();
    renderSyncSettings();
    show(el.settings, { back: false });
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

  // ---- Scheduling -----------------------------------------------------------
  // The interval comes straight from the card's correct-answer count (reps,
  // which resets on nope): got it = 5d, 10d, 15d…; kinda = 2d, 4d, 6d…;
  // nope = always 1d.
  function nextInterval(c, grade) {
    if (grade === 0) return 1;
    const n = (c.reps || 0) + 1;             // counting this pass
    return grade === 1 ? 2 * n : 5 * n;
  }
  function srsUpdate(cardId, grade) {
    const c = prog.cards[cardId] || { reps: 0, ease: 2.5, interval: 0, lapses: 0 };
    c.interval = nextInterval(c, grade);
    if (grade === 0) { c.reps = 0; c.lapses += 1; }
    else c.reps += 1;
    c.lastGrade = grade;                     // drives the Nope/Kinda review buckets
    c.due = Date.now() + c.interval * DAY;
    prog.cards[cardId] = c;
    prog.reviews += 1;
    const t = todayStr();
    if (prog.daily.day !== t) prog.daily = { day: t, count: 0 };
    prog.daily.count += 1;
    prog.practice[t] = (prog.practice[t] || 0) + 1;
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
    return CARDS.filter((c) => {
      const p = prog.cards[c.id];
      if (p && p.reps) return p.due <= now;
      return c.mined; // mined sentences join the review rotation right away
    });
  }

  // ---- Kana: introduction order, seen-tracking, romaji fade ----------------
  // Each lesson "introduces" the kana its vocab/sentences use for the first
  // time (curriculum order). Once every kana in a word has been introduced —
  // by finishing lessons or nailing them in Kana practice — that word's romaji
  // quietly stops rendering (settings.kanaMode === "auto").
  const KANA_INDEX = new Map();   // char -> { romaji, script: "h"|"k" }
  (function () {
    for (const row of (window.KANA && window.KANA.rows) || []) {
      for (let i = 0; i < row.r.length; i++) {
        KANA_INDEX.set(row.h[i], { romaji: row.r[i], script: "h" });
        KANA_INDEX.set(row.k[i], { romaji: row.r[i], script: "k" });
      }
    }
  })();
  // Small forms count as their base letter for reading purposes.
  const SMALL_KANA = { "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "っ": "つ", "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お",
                       "ャ": "ヤ", "ュ": "ユ", "ョ": "ヨ", "ッ": "ツ", "ァ": "ア", "ィ": "イ", "ゥ": "ウ", "ェ": "エ", "ォ": "オ" };
  function kanaChars(text) {
    const out = [];
    for (const ch of String(text || "")) {
      const c = SMALL_KANA[ch] || ch;
      if (KANA_INDEX.has(c)) out.push(c);
    }
    return out;
  }
  const kanaSeen = (ch) => (prog.kana[ch] || 0) > 0;
  function markKanaSeen(ch, strength) {
    prog.kana[ch] = Math.max(prog.kana[ch] || 0, strength || 1);
  }
  // Show romaji for this text? auto → only while it contains unlearned kana.
  function needRomaji(text) {
    if (settings.kanaMode === "always") return true;
    if (settings.kanaMode === "never") return false;
    return kanaChars(text).some((ch) => !kanaSeen(ch));
  }
  // Which kana does each lesson introduce (not seen in any earlier lesson)?
  const LESSON_NEW_KANA = {};
  const LESSON_ALL_KANA = {};
  (function () {
    const seen = new Set();
    for (const L of window.LESSONS) {
      const all = new Set();
      for (const w of L.vocab || []) for (const c of kanaChars(w.jp)) all.add(c);
      for (const s of L.sentences || []) for (const c of kanaChars(s.jp)) all.add(c);
      LESSON_ALL_KANA[L.id] = [...all];
      LESSON_NEW_KANA[L.id] = [...all].filter((c) => !seen.has(c));
      for (const c of all) seen.add(c);
    }
  })();
  // Which vocab does each lesson teach for the FIRST time? Review words that
  // earlier lessons already taught don't repeat in the intro's word list.
  const LESSON_NEW_VOCAB = {};
  (function () {
    const taught = new Set();
    for (const L of window.LESSONS) {
      LESSON_NEW_VOCAB[L.id] = (L.vocab || []).filter((w) => !taught.has(w.jp));
      for (const w of L.vocab || []) taught.add(w.jp);
    }
  })();

  function markLessonKanaSeen(lessonId) {
    for (const c of LESSON_ALL_KANA[lessonId] || []) markKanaSeen(c, 1);
  }
  // Backfill: lessons you already worked through introduced their kana.
  (function () {
    for (const c of CARDS) {
      const p = prog.cards[c.id];
      if (p && (p.reps || p.lapses)) markLessonKanaSeen(c.lessonId);
    }
  })();

  // Transliterate a kana run to romaji (digraphs きゃ→kya/しゃ→sha, っ
  // gemination, ー long vowels) — powers the romaji-above-Japanese ruby in
  // lesson notes and hints, so explanations never need hand-written readings.
  const SMALL_Y = { "ゃ": "ya", "ゅ": "yu", "ょ": "yo", "ャ": "ya", "ュ": "yu", "ョ": "yo" };
  const SMALL_V = { "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o", "ァ": "a", "ィ": "i", "ゥ": "u", "ェ": "e", "ォ": "o" };
  function kanaToRomaji(run) {
    let out = "";
    const chars = [...run];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === "っ" || ch === "ッ") {
        const r = i + 1 < chars.length ? (KANA_INDEX.get(chars[i + 1]) || {}).romaji || "" : "";
        out += r.startsWith("ch") ? "t" : r ? r[0] : "";
        continue;
      }
      if (ch === "ー") { const m = /[aeiou]$/.exec(out); out += m ? m[0] : ""; continue; }
      if (SMALL_Y[ch]) {
        out = out.replace(/i$/, "");
        out += /(sh|ch|j)$/.test(out) ? SMALL_Y[ch].slice(1) : SMALL_Y[ch];
        continue;
      }
      if (SMALL_V[ch]) { out = out.replace(/[aeiou]$/, "") + SMALL_V[ch]; continue; }
      if (ch === "は" && i === chars.length - 1 && chars.length > 1) { out += out ? " wa" : "wa"; continue; }
      const info = KANA_INDEX.get(ch);
      out += info ? info.romaji : ch;
    }
    return out;
  }
  // Render English teaching text with romaji above any embedded Japanese —
  // the notes stay readable before the learner can read kana.
  function renderAnnotated(container, text) {
    container.textContent = "";
    const re = /[ぁ-ゖァ-ヶー]+/g;
    let last = 0, m;
    text = String(text || "");
    while ((m = re.exec(text))) {
      if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
      const ruby = document.createElement("ruby");
      ruby.appendChild(document.createTextNode(m[0]));
      const rt = document.createElement("rt");
      rt.textContent = kanaToRomaji(m[0]);
      ruby.appendChild(rt);
      container.appendChild(ruby);
      last = m.index + m[0].length;
    }
    if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
  }

  // ---- Elements ------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const el = {
    backBtn: $("back-btn"),
    dailyRing: $("daily-ring"), ringFill: document.querySelector(".ring-fill"), ringLabel: document.querySelector(".ring-label"),
    mastery: $("mastery"), masteryFill: $("mastery-fill"), masteryPct: $("mastery-pct"),
    home: $("home"), stats: $("stats"), reviewBtn: $("review-btn"), reviewSub: $("review-sub"), focusBtn: $("focus-btn"), lessonMap: $("lesson-map"), mining: $("mining"), immersion: $("immersion"),
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
    kanaSound: $("kana-sound"), kanaSoundChar: $("kana-sound-char"), kanaSoundOpts: $("kana-sound-opts"),
    drill: $("drill"), progressFill: $("progress-fill"), combo: $("combo"), cardCounter: $("card-counter"),
    retireBtn: $("retire-btn"), buildHardBtn: $("build-hard-btn"),
    promptLabel: $("prompt-label"), revealLabel: $("reveal-label"),
    promptEn: $("prompt-en"), answerKana: $("answer-kana"), answerRomaji: $("answer-romaji"),
    wordBreakdown: $("word-breakdown"), revealArea: $("reveal-area"),
    hintRow: $("hint-row"), showHintBtn: $("show-hint-btn"), hint: $("hint"),
    revealBtn: $("reveal-btn"), replayBtn: $("replay-btn"),
    grade: $("grade"),
    done: $("lesson-done"), doneSummary: $("done-summary"), restartBtn: $("restart-btn"), doneHomeBtn: $("done-home-btn"),
    voiceWarn: $("voice-warn"), syncBtn: $("sync-btn"),
    settingsBtn: $("settings-btn"), settings: $("settings"), romajiToggle: $("romaji-toggle"),
    voiceSelect: $("voice-select"), voiceTestBtn: $("voice-test-btn"),
    syncStatus: $("sync-status"), syncConnectBtn: $("sync-connect-btn"), syncDisconnectBtn: $("sync-disconnect-btn"),
    resetBtn: $("reset-btn"), goalSelect: $("goal-select"), directionSelect: $("direction-select"),
    kanaBtn: $("kana-btn"), kana: $("kana"), kanaTabH: $("kana-tab-h"), kanaTabK: $("kana-tab-k"),
    kanaGrid: $("kana-grid"), kanaPracticeBtn: $("kana-practice-btn"), kanaQuiz: $("kana-quiz"),
    kqChar: $("kq-char"), kqOptions: $("kq-options"), kqProgress: $("kq-progress"), kqStop: $("kq-stop"),
    newKana: $("new-kana"), newKanaChips: $("new-kana-chips"), romajiMode: $("romaji-mode"),
    sentenceList: $("sentence-list"), vocabLabel: $("vocab-label"), sentenceLabel: $("sentence-label"),
    doneQuizBtn: $("done-quiz-btn"), quiz: $("quiz"),
    quizCard: $("quiz-card"), quizControls: $("quiz-controls"), quizLabel: $("quiz-label"),
    quizMochiko: $("quiz-mochiko"), quizMochikoJp: $("quiz-mochiko-jp"), quizMochikoEn: $("quiz-mochiko-en"),
    doneMission: $("done-mission"),
    quizProgress: $("quiz-progress"), quizEn: $("quiz-en"), quizHintBtn: $("quiz-hint-btn"), quizHint: $("quiz-hint"),
    quizHeard: $("quiz-heard"), quizVerdict: $("quiz-verdict"), quizAnswer: $("quiz-answer"),
    quizKana: $("quiz-kana"), quizRomaji: $("quiz-romaji"),
    quizMicBtn: $("quiz-mic-btn"), quizPlayBtn: $("quiz-play-btn"), quizRevealBtn: $("quiz-reveal-btn"),
    quizSkipBtn: $("quiz-skip-btn"), quizNextBtn: $("quiz-next-btn"), quizUnsupported: $("quiz-unsupported"),
    quizSummary: $("quiz-summary"), quizScore: $("quiz-score"), quizBackBtn: $("quiz-back-btn"), quizAgainBtn: $("quiz-again-btn"),
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
  // Like furiganaHTML, but tints each word's characters with the same
  // part-of-speech color as its breakdown chip, so the sentence visually maps
  // onto the chips below it.
  function coloredFuriganaHTML(s, words) {
    if (!words || !words.length) return furiganaHTML(s);
    s = String(s || "");
    let out = "", cursor = 0;
    for (const w of words) {
      const i = s.indexOf(w.jp, cursor);
      if (i < 0) continue;
      let end = i + w.jp.length;
      while (s[end] === "[") {                 // keep furigana inside the tint
        const close = s.indexOf("]", end);
        if (close < 0) break;
        end = close + 1;
      }
      out += furiganaHTML(s.slice(cursor, i));
      out += '<span class="ck pos-' + escHTML(w.pos || "n") + '">' + furiganaHTML(s.slice(i, end)) + "</span>";
      cursor = end;
    }
    return out + furiganaHTML(s.slice(cursor));
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
  const screens = [el.home, el.intro, el.drill, el.done, el.quiz, el.kana, el.settings, el.mineForm, el.importForm, el.reader];
  // last non-settings screen, so the gear can toggle back to exactly where you were
  let visibleScreen = el.home, visibleBack = false;
  function show(screen, { back = false } = {}) {
    speechSynthesis.cancel();
    stopAudio();
    if (quizRec) { recGraded = true; stopListening(true); }   // navigation cancels recording (no late grade)
    screens.forEach((s) => (s.hidden = s !== screen));
    if (el.readerPop) el.readerPop.hidden = true;
    el.backBtn.hidden = !back;
    // the gear is always visible now — it toggles settings on/off
    if (el.settingsBtn) {
      el.settingsBtn.hidden = false;
      el.settingsBtn.classList.toggle("active", screen === el.settings);
    }
    el.mastery.hidden = !(screen === el.home || screen === el.intro);
    if (screen !== el.settings) { visibleScreen = screen; visibleBack = back; }
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

    const collapsed = !!settings.collapsedHome.immersion;
    const card = document.createElement("div");
    card.className = "imm-card";
    const head = document.createElement("div"); head.className = "imm-head";
    head.appendChild(span("imm-total", fmtHours(total)));
    head.appendChild(span("imm-unit", "hours immersed"));
    if (streak > 0) head.appendChild(span("imm-streak", "🎧 " + streak + "d"));
    head.appendChild(span("tier-chevron", "▾"));
    head.setAttribute("role", "button");
    head.tabIndex = 0;
    head.setAttribute("aria-expanded", String(!collapsed));
    card.appendChild(head);

    const body = document.createElement("div"); body.className = "imm-body";
    body.hidden = collapsed;
    card.classList.toggle("collapsed", collapsed);

    const today_row = document.createElement("div"); today_row.className = "imm-today";
    today_row.textContent = today > 0 ? "Today: " + today + " min" : "No immersion logged today";
    body.appendChild(today_row);

    if (prog.known.length > 0) {
      const g = knownGrowth(7);
      const kr = document.createElement("div"); kr.className = "imm-known";
      kr.appendChild(span("imm-known-n", "📚 " + prog.known.length));
      kr.appendChild(span("imm-known-l", "words known" + (g > 0 ? " · +" + g + " this week" : "")));
      body.appendChild(kr);
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
    body.appendChild(actions);
    card.appendChild(body);

    const toggle = () => {
      const now = !settings.collapsedHome.immersion;
      settings.collapsedHome.immersion = now;
      saveSettings();
      body.hidden = now;
      card.classList.toggle("collapsed", now);
      head.setAttribute("aria-expanded", String(!now));
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

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
    const collapsed = !!settings.collapsedHome.mining;
    const block = document.createElement("div");
    block.className = "tier-block";

    const head = document.createElement("div");
    head.className = "tier-head";
    const text = document.createElement("div"); text.className = "tier-text";
    text.appendChild(Object.assign(document.createElement("h2"), { className: "tier-name", textContent: "My sentences" }));
    text.appendChild(Object.assign(document.createElement("div"), { className: "tier-blurb", textContent: "Mine lines you meet in the wild" }));
    head.appendChild(text);
    const read = Object.assign(document.createElement("button"), { className: "mine-add mine-import", textContent: "📖 Read" });
    read.addEventListener("click", (e) => { e.stopPropagation(); openReader(); });
    head.appendChild(read);
    const imp = Object.assign(document.createElement("button"), { className: "mine-add mine-import", textContent: "⤓ Import" });
    imp.addEventListener("click", (e) => { e.stopPropagation(); openImportForm(); });
    head.appendChild(imp);
    const add = Object.assign(document.createElement("button"), { className: "mine-add", textContent: "＋ Add" });
    add.addEventListener("click", (e) => { e.stopPropagation(); openMineForm(); });
    head.appendChild(add);
    head.appendChild(span("tier-chevron", "▾"));
    head.setAttribute("role", "button");
    head.tabIndex = 0;
    head.setAttribute("aria-expanded", String(!collapsed));
    block.appendChild(head);

    const body = document.createElement("div"); body.className = "tier-body";
    body.hidden = collapsed;
    block.classList.toggle("collapsed", collapsed);
    const toggle = () => {
      const now = !settings.collapsedHome.mining;
      settings.collapsedHome.mining = now;
      saveSettings();
      body.hidden = now;
      block.classList.toggle("collapsed", now);
      head.setAttribute("aria-expanded", String(!now));
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    const cards = minedCards();
    if (!cards.length) {
      body.appendChild(Object.assign(document.createElement("div"), {
        className: "mine-empty",
        textContent: "Heard or read a sentence you liked? Add it and drill it with spaced repetition — audio included.",
      }));
      block.appendChild(body);
      el.mining.appendChild(block);
      return;
    }

    const now = Date.now();
    const due = cards.filter((c) => { const p = prog.cards[c.id]; return !p || !p.reps || p.due <= now; }).length;
    if (due > 0) head.insertBefore(span("tier-count", due + " due"), head.lastChild);

    // Mined sentences review alongside lesson cards — no separate drill.
    body.appendChild(Object.assign(document.createElement("div"), {
      className: "mine-note",
      textContent: "These come up with your due cards in 🔁 Review.",
    }));

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
    body.appendChild(list);
    block.appendChild(body);
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

  // ---- Home ----------------------------------------------------------------
  // Two views: a short level overview (just the level cards), and a per-level
  // page with that level's tiers/lessons. openLevelId === null → overview.
  let openLevelId = null;
  const levelHasLessons = (lv) => window.LESSONS.some((L) => lv.tiers.some((t) => t.themes.includes(L.section)));
  // Jump straight to the level overview (used by the banner Home button).
  window.__hanaGoHome = function () { openLevelId = null; renderHome(); window.scrollTo(0, 0); };

  function renderHome() {
    renderDailyRing();
    renderMastery();
    el.stats.hidden = true;
    el.stats.innerHTML = "";

    const reviewN = reviewCards().length;
    el.reviewSub.hidden = true;
    el.focusBtn.hidden = true;
    const howit = document.getElementById("howit");
    const structure = document.getElementById("structure");
    const colors = document.getElementById("colors");

    if (!window.LEVELS.some((l) => l.id === settings.activeLevel)) settings.activeLevel = window.LEVELS[0].id;
    el.lessonMap.innerHTML = "";

    if (openLevelId == null) {
      // ---- Level overview: just the level cards (short, no long scroll) ----
      el.kanaBtn.hidden = false;
      if (howit) howit.hidden = false;
      if (structure) structure.hidden = false;
      if (colors) colors.hidden = false;
      el.reviewBtn.hidden = reviewN === 0;
      el.reviewBtn.textContent = `⚡ Review ${reviewN} card${reviewN === 1 ? "" : "s"}`;

      // Weekly rhythm — practice as a 7-day pattern, not a streak to break.
      // A rest day leaves a gap; nothing resets, nothing scolds.
      let practiced = 0;
      const dots = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
        const on = (prog.practice[d] || 0) > 0 || (prog.immersion[d] || 0) > 0;
        if (on) practiced += 1;
        dots.push('<span class="wr-dot' + (on ? " on" : "") + (i === 0 ? " today" : "") + '"></span>');
      }
      el.stats.hidden = false;
      el.stats.innerHTML = '<div class="week-rhythm">' + dots.join("") +
        '<span class="wr-text">' + (practiced
          ? practiced + " day" + (practiced === 1 ? "" : "s") + " of practice this week"
          : "fresh week — say something today") + "</span></div>";

      const grid = document.createElement("div");
      grid.className = "level-grid";
      window.LEVELS.forEach((lv, i) => {
        const lessons = window.LESSONS.filter((L) => lv.tiers.some((t) => t.themes.includes(L.section)));
        const card = document.createElement("button");
        card.className = "level-card lv-" + (i % 5) + (lessons.length ? "" : " soon");
        card.appendChild(span("level-card-name", lv.name));
        card.appendChild(span("level-card-title", lv.title));
        if (lessons.length) {
          const done = lessons.filter((L) => { const s = lessonStats(L); return s.passed >= s.total; }).length;
          card.appendChild(span("level-card-count", done + " / " + lessons.length + " lessons"));
          card.addEventListener("click", () => {
            openLevelId = lv.id; settings.activeLevel = lv.id; saveSettings();
            renderHome(); window.scrollTo(0, 0);
          });
        } else {
          card.appendChild(span("level-card-soon", "coming soon"));
          card.disabled = true;
        }
        grid.appendChild(card);
      });
      el.lessonMap.appendChild(grid);
      show(el.home);
      return;
    }

    // ---- Level detail: the chosen level's tiers/lessons + a back button ----
    el.kanaBtn.hidden = true;
    if (howit) howit.hidden = true;
    if (structure) structure.hidden = true;
    if (colors) colors.hidden = true;
    el.reviewBtn.hidden = true;

    const level = window.LEVELS.find((l) => l.id === openLevelId) || window.LEVELS[0];
    const back = document.createElement("button");
    back.className = "level-back";
    back.textContent = "← All levels";
    back.addEventListener("click", () => { openLevelId = null; renderHome(); window.scrollTo(0, 0); });
    el.lessonMap.appendChild(back);

    const head = document.createElement("div");
    head.className = "level-detail-head";
    head.appendChild(Object.assign(document.createElement("h2"), { className: "level-detail-title", textContent: level.name + " · " + level.title }));
    if (level.blurb) head.appendChild(Object.assign(document.createElement("div"), { className: "level-blurb", textContent: level.blurb }));
    el.lessonMap.appendChild(head);

    renderJourney(el.lessonMap, level);
    show(el.home);
  }

  // ---- Level page: condensed lesson cards -----------------------------------
  // The Japan-map + road-of-nodes journey was retired (too much scrolling, too
  // much room). Themes are compact headers; lessons are a wrapped grid of small
  // cards. Every lesson stays tappable — "ahead" is styling, never a lock.
  const REGION_ICONS = ["⛩️", "🏯", "🗻", "🌸", "🏮", "🍵", "🚉", "🌊", "🦊", "🎋", "🏔️", "🛤️"];

  function renderJourney(container, level) {
    const wrap = document.createElement("div");
    wrap.className = "lesson-list";

    const isDoneL = (L) => { const s = lessonStats(L); return s.passed >= s.total; };
    const regionList = [];
    for (const tier of level.tiers) for (const theme of tier.themes) {
      const lessons = window.LESSONS.filter((L) => L.section === theme);
      if (lessons.length) regionList.push({ theme, tier, lessons, done: lessons.every(isDoneL) });
    }
    // Frontier = first not-done lesson across the level: that's where you are.
    let frontierId = null;
    outer: for (const r of regionList) for (const L of r.lessons) if (!isDoneL(L)) { frontierId = L.id; break outer; }

    let lastTier = null, regionIdx = 0;
    for (const r of regionList) {
      if (r.tier !== lastTier && level.tiers.length > 1) {
        lastTier = r.tier;
        const tierLessons = window.LESSONS.filter((L) => r.tier.themes.includes(L.section));
        const chapter = document.createElement("div");
        chapter.className = "map-chapter";
        chapter.appendChild(span("map-chapter-name", r.tier.name));
        chapter.appendChild(span("map-chapter-count", tierLessons.filter(isDoneL).length + " / " + tierLessons.length));
        wrap.appendChild(chapter);
      }

      const head = document.createElement("div");
      head.className = "theme-head" + (r.done ? " theme-done" : "");
      head.appendChild(span("theme-ico", REGION_ICONS[regionIdx % REGION_ICONS.length]));
      head.appendChild(span("theme-name", r.theme));
      if (r.done) {
        const stamp = document.createElement("img");
        stamp.className = "theme-stamp"; stamp.src = "assets/star_stamp.png"; stamp.alt = "done";
        head.appendChild(stamp);
      } else {
        head.appendChild(span("theme-count", r.lessons.filter(isDoneL).length + "/" + r.lessons.length));
      }
      wrap.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "lesson-grid";
      r.lessons.forEach((L) => {
        const st = lessonStats(L);
        const isDone = st.passed >= st.total;
        const current = !isDone && L.id === frontierId;
        const chip = document.createElement("button");
        chip.className = "lesson-chip" + (isDone ? " chip-done" : current ? " chip-current" : " chip-ahead");
        chip.dataset.lesson = L.id;          // so Back can scroll home to this card
        chip.setAttribute("aria-label", L.title);
        const mark = span("chip-mark", current ? "▶" : "");
        if (isDone) mark.innerHTML = '<img src="assets/star_stamp.png" alt="">';
        chip.appendChild(mark);
        chip.appendChild(span("chip-title", L.title));
        if (current && st.due > 0) chip.appendChild(span("chip-due", st.due + " due"));
        chip.addEventListener("click", () => openIntro(L));
        grid.appendChild(chip);
      });
      wrap.appendChild(grid);
      regionIdx++;
    }
    container.appendChild(wrap);
  }

  // ---- Lesson intro --------------------------------------------------------
  let activeLesson = null;

  // もち子さん greets you at the door — tap the bubble to hear her say it.
  // The line rotates by lesson and day so she doesn't repeat herself.
  function renderMochikoGreeting(L) {
    const M = window.MOCHIKO;
    let bubble = document.getElementById("mochiko-intro");
    if (!M || !M.greetings || !M.greetings.length) { if (bubble) bubble.hidden = true; return; }
    if (!bubble) {
      bubble = document.createElement("button");
      bubble.id = "mochiko-intro";
      bubble.innerHTML =
        '<img class="mb-art" src="assets/chibi_cheer.png" alt="もち子さん" />' +
        '<span class="mb-bubble"><b class="mb-jp"></b><small class="mb-en"></small></span>';
      bubble.addEventListener("click", () => { if (bubble.dataset.jp) speak(bubble.dataset.jp, { lang: "ja-JP" }); });
      el.intro.insertBefore(bubble, el.intro.firstChild);
    }
    bubble.hidden = false;
    const idx = (Math.max(0, window.LESSONS.findIndex((x) => x.id === L.id)) + new Date().getDate()) % M.greetings.length;
    const g = M.greetings[idx];
    bubble.dataset.jp = g.jp;
    bubble.querySelector(".mb-jp").textContent = g.jp;
    bubble.querySelector(".mb-en").textContent = g.en;
  }

  function renderNewKana(L) {
    // Show every kana the lesson uses: the ones INTRODUCED here come first at
    // full strength; letters from earlier lessons trail behind, greyed — so
    // the new sounds stay obvious but tapped words can always fully light up.
    const newSet = new Set(LESSON_NEW_KANA[L.id] || []);
    const rest = (LESSON_ALL_KANA[L.id] || []).filter((c) => !newSet.has(c));
    const chars = [...newSet, ...rest];
    el.newKana.hidden = !chars.length;
    el.newKanaChips.innerHTML = "";
    for (const ch of chars) {
      const info = KANA_INDEX.get(ch);
      const chip = document.createElement("button");
      chip.className = "kana-chip" + (kanaSeen(ch) ? " seen" : "") + (newSet.has(ch) ? "" : " kold");
      chip.dataset.kana = ch;
      chip.appendChild(span("kc-char", ch));
      chip.appendChild(span("kc-romaji", info ? info.romaji : ""));
      chip.addEventListener("click", () => {
        speakLetter(ch);
        markKanaSeen(ch, 1); save();          // hearing it counts as meeting it
        chip.classList.add("seen");
      });
      el.newKanaChips.appendChild(chip);
    }
  }

  // Tapping a vocab word lights up its letters in the New-sounds strip —
  // tapping the next word clears the old highlights and lights the new ones.
  function highlightWordKana(jp) {
    const chars = new Set(kanaChars(jp));
    for (const chip of el.newKanaChips.children) {
      chip.classList.toggle("hl", chars.has(chip.dataset.kana));
    }
  }

  function openIntro(L) {
    activeLesson = L;
    renderMochikoGreeting(L);
    renderNewKana(L);
    // Every lesson is a conversation: a hand-written scene when one exists,
    // otherwise one auto-built from the lesson's own sentences.
    const scene = (window.SCENES || []).find((s) => s.lesson === L.id);
    let sceneBtn = document.getElementById("scene-btn");
    if (!sceneBtn) {
      sceneBtn = document.createElement("button");
      sceneBtn.id = "scene-btn";
      sceneBtn.className = "secondary";
      const actions = document.querySelector(".intro-actions");
      actions.insertBefore(sceneBtn, document.getElementById("build-btn"));
      sceneBtn.addEventListener("click", () => startTalk(activeLesson));
    }
    sceneBtn.hidden = false;
    sceneBtn.textContent = scene
      ? "🎭 " + scene.title + " — talk with もち子さん"
      : "🎭 Talk with もち子さん";
    el.lessonTitle.textContent = L.title;
    el.lessonGrammar.textContent = L.grammar;
    renderAnnotated(el.lessonNote, L.grammarNote || "");
    el.vocabList.innerHTML = "";
    const newVocab = LESSON_NEW_VOCAB[L.id] || L.vocab;
    el.vocabLabel.hidden = !newVocab.length;
    for (const w of newVocab) {
      const row = document.createElement("button");
      row.className = "vocab-row pos-" + (w.pos || "n");
      row.appendChild(span("v-jp", w.jp));
      row.appendChild(span("v-romaji", needRomaji(w.jp) ? w.romaji : ""));
      const en = document.createElement("span");
      en.className = "v-en";
      en.appendChild(span("v-en-text", w.en));
      if (POS_NAME[w.pos]) en.appendChild(span("v-pos", POS_NAME[w.pos]));
      row.appendChild(en);
      row.addEventListener("click", () => { speak(w.jp, { lang: "ja-JP" }); highlightWordKana(w.jp); });
      el.vocabList.appendChild(row);
    }
    // The lesson's sentences, right here on the intro — tap one to hear it
    // and light up every letter it uses in the (sticky) sound strip above.
    el.sentenceList.innerHTML = "";
    // A "sentence" that is just one vocab word (たべます。) would duplicate the
    // word row above — skip those; real sentences only.
    const vocabJP = new Set((L.vocab || []).map((w) => w.jp));
    const realSentences = L.sentences.filter((s) => !vocabJP.has(plainJP(s.jp).replace(/[。！？\s]/g, "")));
    el.sentenceLabel.hidden = !realSentences.length;
    for (const s of realSentences) {
      const row = document.createElement("button");
      row.className = "sentence-row";
      const jp = document.createElement("span");
      jp.className = "sr-jp";
      jp.innerHTML = furiganaHTML(s.jp);
      row.appendChild(jp);
      if (needRomaji(s.jp) && s.romaji) row.appendChild(span("sr-romaji", s.romaji));
      row.appendChild(span("sr-en", s.en));
      row.addEventListener("click", () => { speak(s.jp, { lang: "ja-JP" }); highlightWordKana(s.jp); });
      el.sentenceList.appendChild(row);
    }
    show(el.intro, { back: true });
  }

  // ---- Drill ---------------------------------------------------------------
  let session = null; // { queue, total, cleared, mode, lessonId }

  function startSession(cards, mode, lessonId, opts) {
    session = {
      queue: cards.slice(), total: cards.length, cleared: 0, mode, lessonId, flip: false,
      build: !!(opts && opts.build), hard: !!(opts && opts.hard), combo: 0, bestCombo: 0,
    };
    renderCombo();
    show(el.drill, { back: true });
    nextCard();
  }

  // Learning a sentence and its alphabet hand in hand: after each sentence in
  // a lesson run, a quick "spell it" — tap the hiragana/katakana of a word you
  // just used, in order. Only appears while the word still contains letters
  // the learner hasn't mastered (strength < 2), so it naturally phases out as
  // kana strengthens — no level cutoff needed.
  function pickSpellWord(s) {
    const seen = new Set();
    const cands = (s.words || []).filter((w) => {
      if (["prt", "cop", "aux"].includes(w.pos)) return false;
      if (seen.has(w.jp)) return false;
      seen.add(w.jp);
      const chars = [...w.jp];
      if (chars.length < 2 || chars.length > 6) return false;
      if (!chars.every((c) => KANA_INDEX.has(c))) return false;   // clean kana only
      return chars.some((c) => (prog.kana[c] || 0) < 2);          // still learning it
    });
    if (!cands.length) return null;
    // most unlearned letters first, longer words break ties
    const unlearned = (w) => [...w.jp].filter((c) => (prog.kana[c] || 0) < 2).length;
    cands.sort((a, b) => unlearned(b) - unlearned(a) || b.jp.length - a.jp.length);
    return cands[0];
  }

  function startLesson(L, opts) {
    const cards = CARDS.filter((c) => c.lessonId === L.id);
    let queue = cards;
    if (!(opts && opts.build)) {
      // New letters this lesson still worth drilling by sound — the old journey
      // road-stop, now dealt out as interludes between sentences and phased out
      // once a letter is mastered.
      const soundLetters = (LESSON_NEW_KANA[L.id] || []).filter((c) => kanaMastery(c) < KANA_MAX);
      let si = 0;
      queue = [];
      for (const c of cards) {
        queue.push(c);
        if (si < soundLetters.length)
          queue.push({ id: c.id + "~snd", lessonId: L.id, kanaSound: true, soundChar: soundLetters[si++] });
        const w = pickSpellWord(c.s);
        if (w) queue.push({ id: c.id + "~kana", lessonId: L.id, kanaBuild: true, word: w });
      }
      while (si < soundLetters.length)          // more new letters than sentences → tack on
        queue.push({ id: L.id + "~snd" + si, lessonId: L.id, kanaSound: true, soundChar: soundLetters[si++] });
    }
    startSession(queue, "lesson", L.id, opts);
  }
  // The unified review bucket = cards last graded Nope/Kinda that are due
  // (same set focusCards() computes). Surfaced on SRS schedule; "Got it"
  // graduates a card out of the bucket and back to its lesson.
  function reviewCards() {
    // Freshly mined sentences have no grade history yet, so focusCards()
    // skips them — include them here or they'd never surface anywhere.
    const freshMined = CARDS.filter((c) => {
      const p = prog.cards[c.id];
      return c.mined && (!p || (!p.reps && !p.lapses));
    });
    return focusCards().concat(freshMined);
  }
  function startReview() {
    const cards = reviewCards();
    if (!cards.length) return;
    startSession(cards, "review", null);
  }
  function lastGradeOf(p) {
    if (!p) return 0;
    if (typeof p.lastGrade === "number") return p.lastGrade;
    return p.reps ? 2 : 0;
  }
  // ---- Focus: weak cards (last graded nope / kind of) ----------------------
  // Cards you last missed live here until you nail them. Due ones surface today;
  // grading "nope" or "kind of" reschedules for tomorrow (stays in the section),
  // "got it" promotes the card out of the section entirely.
  function focusCards() {
    const now = Date.now();
    return CARDS.filter((c) => {
      const p = prog.cards[c.id];
      if (!p || !p.reps && !p.lapses) return false;
      const lg = lastGradeOf(p);
      return (lg === 0 || lg === 1) && (p.due || 0) <= now;
    });
  }
  function focusUpdate(cardId, grade) {
    const c = prog.cards[cardId] || { reps: 0, ease: 2.5, interval: 0, lapses: 0 };
    c.lastGrade = grade;
    if (grade === 2) {                        // got it — leaves the focus section
      c.reps = (c.reps || 0) + 1;
      c.interval = 5 * c.reps;
      c.due = Date.now() + c.interval * DAY;
    } else {                                  // nope / kind of — back tomorrow
      if (grade === 0) c.lapses = (c.lapses || 0) + 1;
      c.interval = 1;
      c.due = Date.now() + DAY;
    }
    prog.cards[cardId] = c;
    prog.reviews += 1;
    const t = todayStr();
    if (prog.daily.day !== t) prog.daily = { day: t, count: 0 };
    prog.daily.count += 1;
    prog.practice[t] = (prog.practice[t] || 0) + 1;
    bumpStreak();
    save();
  }
  function startFocus() {
    const cards = focusCards();
    if (!cards.length) return;
    startSession(cards, "focus", null);
  }

  // ---- Verb forms (〜ます ⇄ 〜ません ⇄ 〜ました…) ---------------------------
  const TF_FORMS = [
    { key: "masen",        label: "〜ません (don't)" },
    { key: "mashita",      label: "〜ました (did)" },
    { key: "masendeshita", label: "〜ませんでした (didn't)" },
    { key: "te",           label: "〜て (connector)" },
    { key: "plain",        label: "dictionary form" },
    { key: "nai",          label: "〜ない (don't, casual)" },
    { key: "ta",           label: "〜た (did, casual)" },
  ];
  // Find VERBS entries present in a sentence, matching whole word-chips only
  // (a chip equal to a known form, or a stem chip followed by a ます-family aux).
  function verbsInSentence(s) {
    if (!s.words || !s.words.length || !window.VERBS) return [];
    const toks = s.words.map((w) => w.jp);
    const found = [];
    for (const v of window.VERBS) {
      const formVals = [v.masu, v.dict, ...Object.values(v.forms).map((f) => f[0])];
      const hit = toks.some((t, i) =>
        formVals.includes(t) || (v.masu === t + "ます" && /^ま/.test(toks[i + 1] || "")));
      if (hit) found.push(v);
    }
    return found;
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
    if (kanaNextBtn) kanaNextBtn.hidden = true;
    if (session.cleared >= session.total || session.queue.length === 0) { finish(); return; }
    current = session.queue.shift();
    current.dir = cardDirection();
    renderCard();
    el.progressFill.style.width = Math.round((session.cleared / session.total) * 100) + "%";
    el.cardCounter.textContent = Math.min(session.cleared + 1, session.total) + "/" + session.total;
  }

  function renderCard() {
    el.kanaSound.hidden = true;                       // off unless it's a sound interlude
    if (current.kanaSound) { renderKanaSoundCard(); return; }
    if (current.kanaBuild) { renderKanaBuildCard(); return; }
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
    else el.answerKana.innerHTML = coloredFuriganaHTML(s.jp, s.words);
    el.answerRomaji.textContent = needRomaji(s.jp) ? s.romaji : "";
    renderAnnotated(el.hint, s.hint || "");
    el.hintRow.hidden = !s.hint;
    el.hint.hidden = true;
    el.showHintBtn.hidden = false;
    el.revealArea.hidden = true;
    el.replayBtn.hidden = true;
    el.retireBtn.hidden = true;
    el.grade.hidden = true;
    el.revealBtn.disabled = false;
    el.revealBtn.hidden = doBuild;       // no manual reveal — solving the puzzle reveals it
    el.buildArea.hidden = !doBuild;
    el.promptEn.classList.toggle("tap-replay", doBuild && session.hard);
    if (doBuild && session.hard) {       // hard mode: no English — rebuild from audio
      el.promptLabel.textContent = "Build what you hear";
      el.promptEn.textContent = "🔈 Listen, then rebuild it";
      el.promptEn.title = "Tap to hear it again";
      speak(s.jp, { lang: "ja-JP" });
    }
    renderWordChips(s);
    if (doBuild) startBuild(s);
  }

  // Spell-it interlude: assemble the word letter by letter from a small bank
  // (its letters + two decoys from this lesson's kana), tapping in order.
  function renderKanaBuildCard() {
    const w = current.word;
    current.doBuild = true;                    // keyboard/space guards
    el.promptLabel.textContent = "🔤 Spell what you just said";
    el.promptEn.textContent = w.en + " · " + kanaToRomaji(w.jp);
    el.promptEn.classList.remove("jp");
    el.promptEn.classList.add("tap-replay");
    el.promptEn.title = "Tap to hear the word";
    el.hintRow.hidden = true;
    el.revealArea.hidden = true;
    el.replayBtn.hidden = true;
    el.retireBtn.hidden = true;
    el.grade.hidden = true;
    el.revealBtn.hidden = true;
    el.buildArea.hidden = false;
    el.wordBreakdown.innerHTML = "";
    const letters = [...w.jp];
    const items = letters.map((ch, i) => ({ tok: ch, pos: "expr", uid: i }));
    const pool = (LESSON_ALL_KANA[current.lessonId] || []).filter((c) => !letters.includes(c));
    for (let d = 0; d < 2 && pool.length; d++) {
      const j = Math.floor(Math.random() * pool.length);
      items.push({ tok: pool.splice(j, 1)[0], pos: "expr", uid: "d" + d });
    }
    let bank = items.slice();
    for (let tries = 0; tries < 12; tries++) {
      for (let i = bank.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bank[i], bank[j]] = [bank[j], bank[i]];
      }
      if (bank.some((it, i) => it.tok !== letters[i])) break;
    }
    build = { correct: letters, placed: [], bank, solved: false };
    renderBuild();
  }

  // Sound-recognition interlude: hear a letter, pick its romaji from four. Rolled
  // in from the old journey road-stop; notches the same per-letter mastery.
  function renderKanaSoundCard() {
    const ch = current.soundChar;
    current.doBuild = true;                    // reuse the space/reveal guards
    el.promptLabel.textContent = "🔊 Which sound is this?";
    el.promptEn.textContent = "tap the letter to hear it";
    el.promptEn.classList.remove("jp");
    el.hintRow.hidden = true; el.revealArea.hidden = true; el.replayBtn.hidden = true;
    el.retireBtn.hidden = true; el.grade.hidden = true; el.revealBtn.hidden = true;
    el.buildArea.hidden = true; el.kanaSound.hidden = false;
    el.kanaSoundChar.textContent = ch;
    el.kanaSoundChar.onclick = () => speakLetter(ch);
    speakLetter(ch);                           // play it on arrival
    const script = ch.charCodeAt(0) >= 0x30a0 ? "k" : "h";
    const answer = (KANA_INDEX.get(ch) || {}).romaji || "";
    const poolR = kanaList(script).map((x) => x.romaji).filter((r) => r && r !== answer);
    const opts = [answer];
    while (opts.length < 4 && poolR.length) {
      const r = poolR.splice(Math.floor(Math.random() * poolR.length), 1)[0];
      if (!opts.includes(r)) opts.push(r);
    }
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    el.kanaSoundOpts.innerHTML = "";
    let answered = false;
    for (const r of opts) {
      const b = document.createElement("button");
      b.className = "kq-opt"; b.textContent = r;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        speakLetter(ch);
        const ok = r === answer;
        b.classList.add(ok ? "ok" : "bad");
        if (!ok) [...el.kanaSoundOpts.children].find((x) => x.textContent === answer).classList.add("ok");
        if (ok) {
          prog.kanaMastery[ch] = Math.min(KANA_MAX, (prog.kanaMastery[ch] || 0) + 1);
          markKanaSeen(ch, 2);
          try { window.HanaFX && HanaFX.pop && HanaFX.pop(); } catch (e) {}
        } else {
          markKanaSeen(ch, 1);
        }
        save();
        ensureKanaNextBtn().hidden = false;
      });
      el.kanaSoundOpts.appendChild(b);
    }
  }

  // The learner advances the spell-it card themselves — no auto-jump.
  let kanaNextBtn = null;
  function ensureKanaNextBtn() {
    if (kanaNextBtn) return kanaNextBtn;
    kanaNextBtn = document.createElement("button");
    kanaNextBtn.id = "kana-next-btn";
    kanaNextBtn.className = "primary";
    kanaNextBtn.textContent = "next →";
    kanaNextBtn.hidden = true;
    document.getElementById("controls").appendChild(kanaNextBtn);
    kanaNextBtn.addEventListener("click", () => {
      kanaNextBtn.hidden = true;
      session.cleared += 1;
      nextCard();
    });
    return kanaNextBtn;
  }

  function kanaBuildSolved() {
    for (const ch of build.correct) markKanaSeen(ch, (prog.kana[ch] || 0) + 1);
    save();
    speak(current.word.jp, { lang: "ja-JP" });
    try { window.HanaFX && HanaFX.pop && HanaFX.pop(); } catch (e) {}
    ensureKanaNextBtn().hidden = false;   // admire the finished word, move on when ready
  }

  // ---- Build-the-sentence mode --------------------------------------------
  let build = null; // { correct:[tok], placed:[item], bank:[item], solved }

  function startBuild(s) {
    const items = s.words.map((w, i) => ({ tok: w.jp, pos: w.pos || "n", uid: i }));
    const correct = s.words.map((w) => w.jp);
    let bank = items.slice();
    if (session.hard) {
      // Hard mode: mix in decoy words from the same lesson's other sentences.
      const used = new Set(correct);
      const decoys = [];
      const L = lessonById[session.lessonId];
      if (L) for (const sen of L.sentences) for (const w of (sen.words || [])) {
        if (!used.has(w.jp)) { used.add(w.jp); decoys.push({ tok: w.jp, pos: w.pos || "n", uid: "d" + decoys.length }); }
      }
      for (let i = decoys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [decoys[i], decoys[j]] = [decoys[j], decoys[i]];
      }
      bank = bank.concat(decoys.slice(0, 3));
    }
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
        speakWord(item.tok, item.pos);
        if (!build.solved) { build.bank.push(build.placed.splice(idx, 1)[0]); renderBuild(); }
      });
      el.buildAnswer.appendChild(chip);
    });

    el.buildBank.innerHTML = "";
    build.bank.forEach((item) => {
      const chip = buildChip(item, "bank");
      chip.addEventListener("click", () => {
        speakWord(item.tok, item.pos);
        if (build.solved) return;        // leftover (decoy) chips just speak after solving
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
      if (current.kanaBuild) kanaBuildSolved(); else reveal();
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
  // Written-out role names, so the colour coding actually teaches: every word
  // shows its category under the translation until the colours sink in.
  const POS_NAME = { n: "noun", v: "verb", adj: "adjective", adv: "adverb", prt: "particle", cop: "copula", aux: "auxiliary", conj: "conjunction", expr: "expression" };
  // は as the topic particle is written "ha" but pronounced "wa" (へ → "e").
  // Chips must SAY the real pronunciation, not the letter reading.
  const PRT_SOUND = { "は": "わ", "へ": "え" };
  // The reverse trap: VOICEVOX reads a LONE hiragana は as the particle ("wa"),
  // so letter contexts (grid, strips, spelling) play the katakana twin, which
  // reads as the plain letter sound ("ha" / "he").
  const LETTER_ALIAS = { "は": "ハ", "へ": "ヘ" };
  const speakLetter = (ch) => speak(LETTER_ALIAS[ch] || ch, { lang: "ja-JP" });
  const speakWord = (jp, pos) => {
    if (pos === "prt" && PRT_SOUND[jp]) return speak(PRT_SOUND[jp], { lang: "ja-JP" });
    if (jp.length === 1 && LETTER_ALIAS[jp]) return speakLetter(jp);   // spell-it letter chips
    speak(jp, { lang: "ja-JP" });
  };

  function makeWordChip({ jp, reading, gloss, pos, term }) {
    const chip = document.createElement("div");
    chip.className = "word-chip pos-" + (pos || "n");
    const main = document.createElement("button");
    main.className = "wc-main";
    main.appendChild(span("wc-jp", jp));
    if (reading && reading !== jp) main.appendChild(span("wc-read", reading));
    if (gloss) main.appendChild(span("wc-en", gloss));
    if (POS_NAME[pos]) main.appendChild(span("wc-pos", POS_NAME[pos]));
    main.title = "Hear this word";
    main.addEventListener("click", () => speakWord(jp, pos));
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
  // A sentence verb's whole form family, shown behind a "⚡ forms of …" toggle.
  function renderFormChipsInto(holder, v) {
    const items = [{ jp: v.masu, lbl: "polite (〜ます)" }];
    for (const f of TF_FORMS) if (v.forms[f.key]) items.push({ jp: v.forms[f.key][0], lbl: f.label });
    for (const it of items) {
      const chip = document.createElement("button");
      chip.className = "tf-chip";
      chip.appendChild(span("tf-jp", it.jp));
      chip.appendChild(span("tf-lbl", it.lbl));
      chip.addEventListener("click", () => speak(it.jp, { lang: "ja-JP" }));
      holder.appendChild(chip);
    }
  }
  function renderVerbForms(s) {
    for (const v of verbsInSentence(s)) {
      const btn = document.createElement("button");
      btn.className = "wc-analyze";
      btn.textContent = "⚡ forms of " + v.masu;
      const holder = document.createElement("div");
      holder.className = "tf-row";
      holder.hidden = true;
      btn.addEventListener("click", () => {
        if (holder.hidden && !holder.childNodes.length) renderFormChipsInto(holder, v);
        holder.hidden = !holder.hidden;
      });
      el.wordBreakdown.appendChild(btn);
      el.wordBreakdown.appendChild(holder);
    }
  }
  function renderWordChips(s) {
    el.wordBreakdown.innerHTML = "";
    if (s.words && s.words.length) {
      for (const w of s.words) el.wordBreakdown.appendChild(makeWordChip({ jp: w.jp, reading: w.pos === "prt" && w.jp === "は" ? "wa" : undefined, gloss: w.en, pos: w.pos, term: w.jp }));
      renderVerbForms(s);
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
    // In a review, a card can be retired — sent back to its lesson as new.
    el.retireBtn.hidden = !(session.mode === "review" && !current.mined);
    // Show when each grade would bring this card back. In focus mode it's a
    // daily loop (nope / kind of = tomorrow, got it = promoted out).
    const c = prog.cards[current.id] || { reps: 0, ease: 2.5, interval: 0 };
    document.querySelectorAll("#grade .grade").forEach((b) => {
      const d = b.querySelector(".grade-days");
      if (!d) return;
      const g = Number(b.dataset.grade);
      if (session.mode === "focus") d.textContent = g === 2 ? "✓ done" : "1d";
      else d.textContent = nextInterval(c, g) + "d";
    });
    el.grade.hidden = false;
    el.revealBtn.disabled = true;
    speak(current.s.jp, { lang: "ja-JP" });
  }

  function grade(g) {
    if (session.mode === "focus") {           // day-based loop, no in-session repeats
      focusUpdate(current.id, g);
      if (g === 2) { session.combo += 1; session.bestCombo = Math.max(session.bestCombo, session.combo); }
      else session.combo = 0;
      renderCombo();
      session.cleared += 1;
      renderDailyRing();
      nextCard();
      return;
    }
    srsUpdate(current.id, g);
    if (g === 2) { session.combo += 1; session.bestCombo = Math.max(session.bestCombo, session.combo); }
    else session.combo = 0;
    renderCombo();
    if (g === 0) session.queue.push(current); else session.cleared += 1;
    renderDailyRing();
    nextCard();
  }

  function renderCombo() {
    const c = session ? session.combo : 0;
    el.combo.hidden = c < 2;
    el.combo.textContent = "🔥 " + c;
    if (c >= 2) { el.combo.classList.remove("pop"); void el.combo.offsetWidth; el.combo.classList.add("pop"); }
  }

  function finish() {
    el.progressFill.style.width = "100%";
    const due = dueCards().length;
    let msg;
    if (session.mode === "focus") {
      const left = focusCards().length;
      msg = left > 0
        ? `${left} weak card${left === 1 ? "" : "s"} still to go.`
        : "Weak cards cleared for today. The ones you missed come back tomorrow.";
    } else if (session.mode === "review") {
      msg = "Review session done. Nice work keeping things fresh.";
    } else {
      msg = due > 0 ? `You've got ${due} card${due === 1 ? "" : "s"} due across all lessons.` : "Every sentence drilled. Come back tomorrow to lock it in.";
    }
    if (session.bestCombo >= 3) msg += ` Best streak: 🔥 ${session.bestCombo} in a row.`;
    // Finishing a lesson introduces its kana — romaji for them fades from here on.
    if (session.mode === "lesson" && session.lessonId) { markLessonKanaSeen(session.lessonId); save(); }
    el.doneSummary.textContent = msg;
    // Real-world mission — a tiny transfer task, because the point is using
    // Japanese out in your day, not in the app.
    let mission = "";
    if (session.mode === "lesson" && session.lessonId && window.MISSIONS) {
      const MM = window.MISSIONS;
      mission = MM[session.lessonId] ||
        (MM._generic ? MM._generic[[...session.lessonId].reduce((a, c) => a + c.charCodeAt(0), 0) % MM._generic.length] : "");
    }
    el.doneMission.hidden = !mission;
    if (mission) el.doneMission.textContent = "🌱 Real-world mission: " + mission;
    // Let add-on layers (sticker/stamp collection) award rewards for this run.
    try {
      window.dispatchEvent(new CustomEvent("hanasou:finish", { detail: {
        lessonId: session.lessonId || null, mode: session.mode,
        cleared: session.cleared, total: session.total, bestCombo: session.bestCombo,
      } }));
    } catch (e) {}
    show(el.done, { back: true });
  }

  // ---- Speaking quiz -------------------------------------------------------
  // Shows an English prompt; you say the Japanese out loud and the browser's
  // speech recognition (ja-JP) transcribes it. We compare by READING: both the
  // target sentence and what you said are reduced to bare hiragana (kanji in the
  // transcript are read via the kuromoji dictionary), then scored by edit
  // distance — so "私はトムです" spoken matches "わたしは トムです。" on the card.
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let quiz = null;       // { items, idx, results:[], target, listening }
  let quizRec = null;    // live SpeechRecognition instance

  // Reduce any Japanese text to a bare-hiragana "reading" for comparison:
  // katakana → hiragana (reusing kataToHira above), then drop everything that
  // isn't a hiragana mora (spaces, punctuation, the ー long mark, latin).
  function normReading(s) { return kataToHira(s).replace(/[^ぁ-ゖ]/g, ""); }
  // Recognizers write numbers as digits (500円です) while cards are kana
  // (ごひゃくえんです) — digits carry no kana and would be dropped from the
  // comparison, tanking the score of a perfectly spoken answer. Spell them
  // out, with the usual sound changes (さんびゃく, ろっぴゃく, はっせん…).
  const KANA_DIGITS = ["ぜろ", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
  function kanaNumber(numStr) {
    const n = parseInt(numStr, 10);
    if (!isFinite(n)) return numStr;
    if (n === 0) return "ぜろ";
    if (n >= 10000) return String(n).split("").map((d) => KANA_DIGITS[+d]).join("");
    let out = "";
    const th = Math.floor(n / 1000), hu = Math.floor(n / 100) % 10, te = Math.floor(n / 10) % 10, un = n % 10;
    if (th) out += (th === 1 ? "" : th === 3 ? "さん" : th === 8 ? "はっ" : KANA_DIGITS[th]) + (th === 3 ? "ぜん" : "せん");
    if (hu) out += (hu === 1 ? "" : hu === 3 ? "さん" : hu === 6 ? "ろっ" : hu === 8 ? "はっ" : KANA_DIGITS[hu]) + (hu === 3 ? "びゃく" : (hu === 6 || hu === 8) ? "ぴゃく" : "ひゃく");
    if (te) out += (te === 1 ? "" : KANA_DIGITS[te]) + "じゅう";
    if (un) out += KANA_DIGITS[un];
    return out;
  }
  // Counter words read irregularly — 4つ is よっつ, not よん+つ. Handle the
  // families the lessons use (〜つ, 時, 分, 人) before the generic digits pass.
  const NATIVE_COUNT = ["", "ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ", "ここのつ", "とお"];
  const HOUR_KANA = { 4: "よ", 7: "しち", 9: "く" };
  const MIN_KANA = { 1: "いっぷん", 3: "さんぷん", 4: "よんぷん", 6: "ろっぷん", 8: "はっぷん", 10: "じゅっぷん" };
  const normalizeDigits = (s) => String(s || "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/(10|[1-9])つ/g, (m, d) => NATIVE_COUNT[+d] || m)
    .replace(/(\d+)時/g, (m, d) => (HOUR_KANA[+d] || kanaNumber(d)) + "じ")
    .replace(/(\d+)分/g, (m, d) => MIN_KANA[+d] || (kanaNumber(d) + "ふん"))
    .replace(/(\d+)人/g, (m, d) => +d === 1 ? "ひとり" : +d === 2 ? "ふたり" : kanaNumber(d) + "にん")
    .replace(/\d+/g, kanaNumber);
  function readingOf(text) {
    text = normalizeDigits(text);
    if (kuroTok) {
      try {
        return normReading(kuroTok.tokenize(text)
          .map((t) => (t.reading && t.reading !== "*") ? t.reading : t.surface_form).join(""));
      } catch (e) {}
    }
    return normReading(text);
  }
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++)
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function similarity(a, b) {
    const max = Math.max(a.length, b.length);
    return max ? 1 - levenshtein(a, b) / max : (a === b ? 1 : 0);
  }

  // Every lesson can be talked through: もち子さん greets you, asks for each of
  // the lesson's sentences (she reacts between your lines), then says goodbye.
  // Hand-written SCENES override this generated flow for their lessons.
  function buildAutoScene(L) {
    const M = window.MOCHIKO || {};
    const pick = (arr, i) => (arr && arr.length ? arr[i % arr.length] : null);
    const seed = new Date().getDate() + L.title.length;
    const steps = [];
    const g = pick(M.greetings, seed);
    if (g) steps.push({ who: "m", jp: g.jp, en: g.en });
    const sentences = L.sentences.slice();
    for (let i = sentences.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
    }
    // React to what was actually said: questions get a thinking noise, bad
    // news gets sympathy, everything else gets the upbeat pool — so she never
    // chirps いいですね！ at "I lost my wallet".
    const isQuestion = (s) => /(か|\?|？)[。！]?\s*$/.test(s.jp);
    const isTrouble = (s) =>
      /(ませんでした|ません|なかった|なくし|まよい|のりおくれ|ぬすまれ|おこられ|またされ|やらされ|させられ|こまって|わすれ|ざるを得|むり|だめ|いたい|たすけて|ふられた|きらい|つかれ|おちた)/.test(s.jp) &&
      !/ほめられ/.test(s.jp);
    sentences.forEach((s, i) => {
      steps.push({ who: "you", ctx: "もち子さん asks — how do you say…", en: s.en, jp: s.jp, romaji: s.romaji, hint: s.hint });
      if (i >= sentences.length - 1) return;                  // closing follows
      const pool = isQuestion(s) ? M.ponder : isTrouble(s) ? M.sympathy : M.reactions;
      const r = pick(pool, seed + i);
      if (r) steps.push({ who: "m", jp: r.jp, en: r.en });
    });
    const c = pick(M.closings, seed);
    if (c) steps.push({ who: "m", jp: c.jp, en: c.en });
    return { id: "auto-" + L.id, lesson: L.id, title: L.title, auto: true, steps };
  }

  // Curriculum order across every level → tier → theme → its lessons.
  function orderedLessons() {
    const ord = [];
    for (const lv of (window.LEVELS || []))
      for (const tier of lv.tiers)
        for (const theme of tier.themes)
          for (const x of window.LESSONS.filter((y) => y.section === theme)) ord.push(x);
    return ord;
  }
  // How many recent-lesson questions to ask — grows as you get deeper into the
  // course: 3 early, 5 through the middle, 7 in the late lessons.
  function refresherCountFor(idx, total) {
    if (idx < 0) return 3;
    const frac = idx / Math.max(1, total - 1);
    return frac < 1 / 3 ? 3 : frac < 2 / 3 ? 5 : 7;
  }

  // Every lesson past the first opens its talk with a quick spoken refresher —
  // もち子さん randomly asks "how do you say…?" the way a coworker might. It draws
  // from the lesson(s) just behind this one, reaching back only as far as needed
  // to hit the target count (a single lesson holds ~5 sentences, so late lessons
  // sweep the last couple). Old content stays warm; the lesson's own practice
  // follows.
  function buildRefresher(L) {
    const ord = orderedLessons();
    const idx = ord.findIndex((x) => x.id === L.id);
    if (idx <= 0) return [];                                   // the very first lesson gets none
    const target = refresherCountFor(idx, ord.length);
    const pool = [];
    for (let k = idx - 1; k >= 0 && pool.length < target; k--) {
      const les = ord[k];
      if (les.sentences && les.sentences.length) pool.push(...les.sentences);
    }
    if (!pool.length) return [];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picks = pool.slice(0, Math.min(target, pool.length));
    const M = window.MOCHIKO || {};
    const steps = [];
    const cue = (M.review && M.review.length) ? M.review[Math.floor(Math.random() * M.review.length)] : null;
    if (cue) steps.push({ who: "m", jp: cue.jp, en: cue.en });
    picks.forEach((s) => {
      steps.push({ who: "you", ctx: "おさらい・review — how do you say…", en: s.en, jp: s.jp, romaji: s.romaji, hint: s.hint });
    });
    return steps;
  }

  function startTalk(L) {
    if (!L) return;
    const sc = (window.SCENES || []).find((s) => s.lesson === L.id);
    const base = sc || buildAutoScene(L);
    const refresher = buildRefresher(L);
    let steps = base.steps;
    if (refresher.length) {
      // Slip the refresher in right after her opening greeting, never before it,
      // and never mutate a hand-written SCENES object.
      const at = (steps[0] && steps[0].who === "m") ? 1 : 0;
      steps = steps.slice(0, at).concat(refresher, steps.slice(at));
    }
    startScene(Object.assign({}, base, { steps }));
  }

  function setMic(listening) {
    el.quizMicBtn.classList.toggle("listening", listening);
    el.quizMicBtn.textContent = listening ? "● listening — tap to check ✓" : "🎤 Tap & speak";
  }

  // Shared per-card reset for both quiz cards and scene steps.
  function resetQuizCard() {
    el.quizCard.hidden = false; el.quizControls.hidden = false;
    el.quizProgress.hidden = false; el.quizSummary.hidden = true;
    el.quizMochiko.hidden = true; el.quizMochiko.classList.remove("echo");
    el.quizHintBtn.hidden = true; el.quizHint.hidden = true;
    el.quizHeard.hidden = true; el.quizHeard.textContent = "";
    el.quizVerdict.hidden = true; el.quizVerdict.className = "quiz-verdict";
    el.quizAnswer.hidden = true; el.quizKana.innerHTML = ""; el.quizRomaji.textContent = "";
    el.quizPlayBtn.hidden = true; el.quizNextBtn.hidden = true;
    el.quizUnsupported.hidden = true;
    setMic(false);
  }

  function showMicControls() {
    el.quizMicBtn.hidden = false; el.quizMicBtn.disabled = !SpeechRec;
    el.quizRevealBtn.hidden = false; el.quizSkipBtn.hidden = false;
    el.quizUnsupported.hidden = !!SpeechRec;
    if (!SpeechRec) el.quizUnsupported.textContent =
      "Speech recognition isn't available here. On iPhone open this in Safari (not an in-app browser); on a computer use Chrome. You can still reveal the answer and hear it.";
  }

  // ---- Conversation scenes (もち子さん dialogues) ---------------------------
  // Same speak-and-match mechanics as the quiz, strung into a little story:
  // her lines play aloud, your lines run the mic flow.
  function startScene(sc) {
    quiz = { scene: sc, steps: sc.steps, idx: 0, results: [], listening: false };
    loadTokenizer().catch(() => {});
    show(el.quiz, { back: true });
    renderSceneStep();
  }

  function renderSceneStep() {
    const st = quiz.steps[quiz.idx];
    resetQuizCard();
    el.quizProgress.textContent = (quiz.idx + 1) + " / " + quiz.steps.length;
    if (st.who === "m") {                       // もち子さん speaks
      quiz.target = null;
      el.quizLabel.textContent = "もち子さん:";
      el.quizEn.hidden = true; el.quizEn.textContent = "";
      el.quizMochiko.hidden = false;
      el.quizMochikoJp.textContent = st.jp;
      el.quizMochikoEn.textContent = st.en || "";
      el.quizMicBtn.hidden = true;
      el.quizNextBtn.hidden = false;
      el.quizNextBtn.textContent = (quiz.idx >= quiz.steps.length - 1) ? "finish →" : "reply →";
      speak(st.jp, { lang: "ja-JP" });          // reached via a tap, so audio is allowed
    } else {                                    // your line
      quiz.target = st;
      // Echo her last line above your prompt so it reads as a reply, not a
      // flashcard — the heart of the conversation feel.
      const prev = quiz.steps[quiz.idx - 1];
      if (prev && prev.who === "m") {
        el.quizMochiko.hidden = false;
        el.quizMochiko.classList.add("echo");
        el.quizMochikoJp.textContent = prev.jp;
        el.quizMochikoEn.textContent = prev.en || "";
      } else {
        el.quizMochiko.classList.remove("echo");
      }
      el.quizLabel.textContent = st.ctx ? "↳ " + st.ctx : "Your turn — reply to her";
      el.quizEn.hidden = false;
      el.quizEn.textContent = st.en;
      if (st.hint) {
        el.quizHintBtn.hidden = false;
        el.quizHintBtn.textContent = "show hint";
        renderAnnotated(el.quizHint, st.hint);
      }
      showMicControls();
    }
  }

  let recStopTimer = 0, recMaxTimer = 0, recGraded = false;
  let recDoneText = "", recSessFinal = "", recInterim = "", recAlts = [];
  let recWantStop = false, recRestarts = 0;
  const standalone = () => window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;

  // iOS only lets audio auto-play after a user-gesture play. The mic tap IS a
  // gesture — play a silent wav then so the graded answer can speak later.
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    try {
      const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=");
      a.volume = 0;
      a.play().then(() => { audioUnlocked = true; }).catch(() => {});
    } catch (e) {}
  }

  function startListening() {
    if (!SpeechRec) return;
    if (quiz.listening) { stopListening(false); return; }   // tap again = submit & check
    recDoneText = ""; recSessFinal = ""; recInterim = ""; recAlts = [];
    recGraded = false; recWantStop = false; recRestarts = 0;
    quiz.listening = true; setMic(true);
    unlockAudio();
    el.quizHeard.hidden = true; el.quizVerdict.hidden = true;
    beginRec();
    // Cap an attempt at 10s — plenty for a sentence, then auto-check.
    clearTimeout(recMaxTimer);
    recMaxTimer = setTimeout(() => stopListening(false), 10000);
  }

  // One engine session. iOS ends the session at every pause, which used to
  // grade you mid-stumble — so on a self-end we silently start a fresh session
  // and keep collecting. Nothing is checked until YOU tap the mic again.
  function beginRec() {
    try { quizRec = new SpeechRec(); } catch (e) { quizRec = null; recDone(); return; }
    quizRec.lang = "ja-JP"; quizRec.maxAlternatives = 5;
    quizRec.continuous = true;        // don't finalize the attempt at the first pause
    quizRec.interimResults = true;    // live feedback + iOS surfaces speech here
    quizRec.onresult = (e) => {
      let fin = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) { if (res[0]) fin += res[0].transcript; }
        else if (res[0]) interim += res[0].transcript;
      }
      // Recognizer alternatives only line up when the whole attempt is one
      // final segment — keep them for that case, drop them otherwise.
      if (!recDoneText && e.results.length === 1 && e.results[0].isFinal) {
        recAlts = [];
        for (let j = 1; j < e.results[0].length; j++) recAlts.push(e.results[0][j].transcript);
      } else if (fin || interim) recAlts = recDoneText ? [] : recAlts;
      recSessFinal = fin; recInterim = interim;
      const soFar = recDoneText + fin + interim;
      if (soFar) {
        el.quizHeard.hidden = false;
        el.quizHeard.innerHTML = "hearing: <b>" + escHTML(soFar) + "</b>…";
      }
    };
    quizRec.onerror = (ev) => {
      // Hard failures stop the attempt; pauses/aborts are normal while
      // accumulating and are handled by onend (resume or finish).
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") {
        recWantStop = true;
        const msg = ev.error === "audio-capture"
          ? "No microphone found on this device."
          : standalone()
            ? "🎤 The installed home-screen app can't use speech recognition on iPhone — open the site in Safari itself to quiz."
            : "🎤 Microphone is blocked — allow mic access for this site, then tap again.";
        el.quizVerdict.hidden = false; el.quizVerdict.className = "quiz-verdict miss"; el.quizVerdict.textContent = msg;
      }
    };
    quizRec.onend = () => {
      recDoneText += recSessFinal + recInterim;   // fold this session's text in
      recSessFinal = ""; recInterim = "";
      // The engine gave up (pause, hiccup) but the learner didn't tap check —
      // resume seamlessly so a rough start is never a dead stop.
      if (!recWantStop && quiz && quiz.listening && !el.quiz.hidden && recRestarts < 12) {
        recRestarts += 1;
        beginRec();
        return;
      }
      recDone();
    };
    try { quizRec.start(); } catch (e) { recDone(); }
  }

  // Ask the engine to stop; if its onend never fires (a real iOS Safari bug),
  // force-abort so the UI can never stay stuck on "listening…".
  function stopListening(force) {
    recWantStop = true;
    const rec = quizRec;
    if (!rec) { recDone(); return; }
    try { force ? rec.abort() : rec.stop(); } catch (e) {}
    clearTimeout(recStopTimer);
    recStopTimer = setTimeout(() => {
      if (quizRec === rec) { try { rec.abort(); } catch (e) {} recDone(); }
    }, force ? 300 : 1500);
  }

  // Single idempotent teardown — every path (submit, error, end, watchdog,
  // navigation) funnels here, so the mic state can't get stuck.
  function recDone() {
    clearTimeout(recStopTimer); clearTimeout(recMaxTimer);
    quizRec = null;
    if (quiz) quiz.listening = false;
    setMic(false);
    if (!recGraded && quiz && !el.quiz.hidden) {
      const full = recDoneText + recSessFinal + recInterim;
      if (full) {
        recGraded = true;
        const cands = [full];
        if (recAlts.length) cands.push(...recAlts);
        gradeSpoken(cands);
      } else if (recWantStop) {
        el.quizVerdict.hidden = false; el.quizVerdict.className = "quiz-verdict miss";
        el.quizVerdict.textContent = "Didn't catch anything — tap the mic and try again.";
      }
    }
    recDoneText = ""; recSessFinal = ""; recInterim = ""; recAlts = []; recRestarts = 0;
  }

  async function gradeSpoken(alts) {
    // Recognizers return kanji (私はトムです) while cards are kana — reading
    // them needs the tokenizer. Load it before scoring kanji output, or 私
    // would be dropped from the comparison and tank the score.
    if (!kuroTok && alts.some((a) => hasKanji(a))) { try { await loadTokenizer(); } catch (e) {} }
    const target = readingOf(plainJP(quiz.target.jp));
    let best = { score: -1, heard: alts[0] || "", reading: "" };
    for (const a of alts) {
      const r = readingOf(a);
      const sc = similarity(r, target);
      if (sc > best.score) best = { score: sc, heard: a, reading: r };
    }
    const pct = Math.max(0, Math.round(best.score * 100));
    quiz.results[quiz.idx] = Math.max(quiz.results[quiz.idx] || 0, best.score);

    // In a conversation, keep it light — a warm reaction, her reply as the
    // reward, and the detailed pronunciation match tucked behind a tap. The
    // full scorecard is only for standalone drilling.
    if (quiz.scene) {
      const M = window.MOCHIKO || {};
      el.quizVerdict.hidden = false;
      if (best.score >= 0.6) {
        const praise = (M.praise && M.praise.length) ? M.praise[Math.floor(Math.random() * M.praise.length)] : { jp: "いいね！", en: "Nice!" };
        el.quizVerdict.className = "quiz-verdict pass"; el.quizVerdict.textContent = "✓ " + praise.jp + " " + (praise.en || "");
        try { window.HanaFX && HanaFX.pop && HanaFX.pop(); } catch (e) {}
      } else if (best.score >= 0.4) {
        el.quizVerdict.className = "quiz-verdict close"; el.quizVerdict.textContent = "◐ Almost — she caught most of that.";
      } else {
        el.quizVerdict.className = "quiz-verdict miss"; el.quizVerdict.textContent = "△ Hmm — say it once more, or tap ▷ to hear it.";
      }
      // Show the pronunciation match inline — what you said and the kana-by-kana
      // green/red — so the feedback is right there, not hidden behind a tap.
      el.quizHeard.hidden = false;
      el.quizHeard.innerHTML =
        "you said: <b>" + escHTML(best.heard) + "</b>" +
        '<div class="quiz-diff">' + kanaDiffHTML(best.reading, target) + " (" + pct + "%)</div>";
      // Controls: hear your line, retry if you want, or move to HER reply.
      el.quizAnswer.hidden = true;
      el.quizPlayBtn.hidden = false;
      el.quizRevealBtn.hidden = true; el.quizSkipBtn.hidden = true;
      el.quizMicBtn.hidden = false; el.quizMicBtn.disabled = !SpeechRec;   // tap to try again
      el.quizNextBtn.hidden = false;
      el.quizNextBtn.textContent = (quiz.idx >= quiz.steps.length - 1) ? "finish →" : "reply →";
      return;
    }

    el.quizHeard.hidden = false;
    el.quizHeard.innerHTML =
      "you said: <b>" + escHTML(best.heard) + "</b>" +
      '<div class="quiz-diff">' + kanaDiffHTML(best.reading, target) + "</div>";
    el.quizVerdict.hidden = false;
    if (best.score >= 0.7) {
      const M = window.MOCHIKO;
      const praise = M && M.praise && M.praise.length ? M.praise[Math.floor(Math.random() * M.praise.length)].jp + " " : "";
      el.quizVerdict.className = "quiz-verdict pass"; el.quizVerdict.textContent = "✓ " + praise + "Perfect! (" + pct + "% match)";
      try { window.HanaFX && HanaFX.pop && HanaFX.pop(); } catch (e) {}
    } else if (best.score >= 0.45) {
      el.quizVerdict.className = "quiz-verdict close"; el.quizVerdict.textContent = "◐ Close — got the gist (" + pct + "% match)";
    } else {
      el.quizVerdict.className = "quiz-verdict miss"; el.quizVerdict.textContent = "✗ Not quite (" + pct + "% match) — try again, or show the answer";
    }
    showQuizAnswer();
  }

  // Character-level alignment of what you said against the target kana, so
  // the check is visible: each target kana lights green if you produced it.
  function kanaDiffHTML(said, target) {
    if (!target) return "";
    const m = said.length, n = target.length;
    const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (said[i - 1] === target[j - 1] ? 0 : 1));
    const marks = new Array(n).fill(false);
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (said[i - 1] === target[j - 1] && d[i][j] === d[i - 1][j - 1]) { marks[j - 1] = true; i--; j--; }
      else if (d[i][j] === d[i - 1][j - 1] + 1) { i--; j--; }
      else if (d[i][j] === d[i][j - 1] + 1) j--;
      else i--;
    }
    let out = '<span class="qd-label">match:</span> ';
    for (let k = 0; k < n; k++)
      out += '<span class="qd-ch ' + (marks[k] ? "qd-ok" : "qd-bad") + '">' + escHTML(target[k]) + "</span>";
    return out;
  }

  function showQuizAnswer() {
    el.quizAnswer.hidden = false;
    el.quizKana.innerHTML = furiganaHTML(quiz.target.jp);
    if (quiz.target.romaji && needRomaji(quiz.target.jp)) { el.quizRomaji.hidden = false; el.quizRomaji.textContent = quiz.target.romaji; }
    else el.quizRomaji.hidden = true;
    el.quizPlayBtn.hidden = false; el.quizRevealBtn.hidden = true; el.quizSkipBtn.hidden = true;
    el.quizNextBtn.hidden = false;
    el.quizNextBtn.textContent = (quiz.idx >= quiz.steps.length - 1) ? "see results →" : "next →";
    speak(quiz.target.jp, { lang: "ja-JP" });   // always hear the correct version
  }

  function quizNext() {
    if (!quiz) return;
    if (quiz.idx >= quiz.steps.length - 1) { finishQuiz(); return; }
    quiz.idx += 1;
    renderSceneStep();
  }

  function finishQuiz() {
    el.quizCard.hidden = true; el.quizControls.hidden = true; el.quizProgress.hidden = true;
    el.quizSummary.hidden = false;
    // Only your lines count — もち子さん's don't grade you.
    const yourLines = quiz.steps.filter((s) => s.who === "you").length;
    const passed = quiz.results.filter((s) => s >= 0.45).length;
    el.quizScore.textContent = `You spoke ${passed} of ${yourLines} line${yourLines === 1 ? "" : "s"} clearly. ` +
      (passed === yourLines ? "もち子さん is delighted! 🎉" : "She's here every day — talk it through again anytime.");
    if (passed >= Math.ceil(yourLines * 0.8)) { try { window.HanaFX && HanaFX.confetti && HanaFX.confetti(); } catch (e) {} }
  }

  // Back from a lesson (intro / drill / scene / done) lands on the level page
  // scrolled to that lesson's card — not the top of the page.
  function backToMap() {
    renderHome();
    if (openLevelId && activeLesson) {
      requestAnimationFrame(() => {
        const chip = document.querySelector('.lesson-chip[data-lesson="' + activeLesson.id + '"]');
        if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: "center" });
      });
    }
  }

  // ---- Kana review & practice ----------------------------------------------
  // Browse the full gojūon in either script (tap = hear + counts as met), and
  // a practice drill: see the letter, pick its sound from four choices.
  // Correct answers raise that letter's strength, which also fades romaji.
  let kanaScript = "h";
  let kq = null;   // { queue, idx, right }

  const KANA_MAX = 5;   // a letter is "mastered" after 5 correct practice answers
  const kanaMastery = (ch) => Math.min(prog.kanaMastery[ch] || 0, KANA_MAX);

  function kanaList(script) {
    const out = [];
    for (const row of (window.KANA && window.KANA.rows) || [])
      for (let i = 0; i < row.r.length; i++) out.push({ ch: row[script][i], romaji: row.r[i] });
    return out;
  }

  // A 0/5 mastery bar (five pips) for one letter.
  function masteryBar(ch) {
    const wrap = document.createElement("span");
    wrap.className = "kc-mastery";
    const m = kanaMastery(ch);
    for (let i = 0; i < KANA_MAX; i++) {
      const pip = document.createElement("i");
      if (i < m) pip.className = "on";
      wrap.appendChild(pip);
    }
    return wrap;
  }

  // Every gojūon row is its own practice set (5, or fewer for や/わ/ん).
  function renderKanaGrid() {
    el.kanaTabH.classList.toggle("active", kanaScript === "h");
    el.kanaTabK.classList.toggle("active", kanaScript === "k");
    el.kanaGrid.innerHTML = "";
    for (const row of (window.KANA && window.KANA.rows) || []) {
      const chars = [...row[kanaScript]];
      const card = document.createElement("div");
      card.className = "kana-set";

      const head = document.createElement("div");
      head.className = "kana-set-head";
      const done = chars.filter((c) => kanaMastery(c) >= KANA_MAX).length;
      head.appendChild(span("kana-set-name", chars.join("") ));
      head.appendChild(span("kana-set-count", done + "/" + chars.length + " mastered"));
      const pb = document.createElement("button");
      pb.className = "kana-set-practice" + (done >= chars.length ? " done" : "");
      pb.textContent = done >= chars.length ? "✓ review" : "▶ practice";
      pb.addEventListener("click", () => startKanaPractice(chars));
      head.appendChild(pb);
      card.appendChild(head);

      const line = document.createElement("div");
      line.className = "kana-row";
      for (let i = 0; i < row.r.length; i++) {
        const ch = row[kanaScript][i];
        const chip = document.createElement("button");
        chip.className = "kana-chip" + (kanaSeen(ch) ? " seen" : "") + (kanaMastery(ch) >= KANA_MAX ? " mastered" : "");
        chip.appendChild(span("kc-char", ch));
        chip.appendChild(span("kc-romaji", row.r[i]));
        chip.appendChild(masteryBar(ch));
        chip.addEventListener("click", () => {
          speakLetter(ch);
          markKanaSeen(ch, 1); save();
          chip.classList.add("seen");
        });
        line.appendChild(chip);
      }
      card.appendChild(line);
      el.kanaGrid.appendChild(card);
    }
  }

  function openKana() {
    el.kanaQuiz.hidden = true;
    el.kanaGrid.hidden = false;
    el.kanaPracticeBtn.hidden = false;
    renderKanaGrid();
    show(el.kana, { back: true });
  }

  // Practice a specific set of letters (a lesson's new kana), launched from
  // the practice nodes on the journey. Falls back to the whole current script.
  function practiceLessonKana(chars) {
    show(el.kana, { back: true });
    startKanaPractice(chars, { oneNotch: true });   // a journey stop = at most +1 per letter
  }

  function startKanaPractice(restrictChars, opts) {
    let pool;
    if (restrictChars && restrictChars.length) {
      // match the distractor script to the letters (Level 0 is all hiragana)
      kanaScript = [...restrictChars][0].charCodeAt(0) >= 0x30a0 ? "k" : "h";
      pool = restrictChars
        .map((ch) => ({ ch, romaji: (KANA_INDEX.get(ch) || {}).romaji || "" }))
        .filter((x) => x.romaji);
    } else {
      pool = kanaList(kanaScript);
    }
    // Weight by how far each letter is from mastery, so weak letters recur.
    const weighted = [];
    for (const item of pool) {
      const w = Math.max(1, KANA_MAX - kanaMastery(item.ch));   // 0/5 → 5×, 4/5 → 1×
      for (let i = 0; i < w; i++) weighted.push(item);
    }
    // A full round: ~2 questions per letter, min 4, max 12; repeats allowed
    // (never the same letter twice running) so mastery can climb in one sitting.
    const N = Math.max(pool.length, Math.min(12, pool.length * 2));
    const queue = [];
    let prev = null;
    let guard = 0;
    while (queue.length < N && guard++ < 400) {
      const pick = weighted[Math.floor(Math.random() * weighted.length)];
      if (pool.length > 1 && pick.ch === prev) continue;
      queue.push(pick); prev = pick.ch;
    }
    kq = { queue, idx: 0, right: 0, oneNotch: !!(opts && opts.oneNotch), notched: new Set() };
    el.kanaGrid.hidden = true;
    el.kanaPracticeBtn.hidden = true;
    el.kanaQuiz.hidden = false;
    renderKanaQuestion();
  }

  function renderKanaQuestion() {
    const q = kq.queue[kq.idx];
    el.kqProgress.textContent = (kq.idx + 1) + " / " + kq.queue.length;
    el.kqChar.textContent = q.ch;
    // Four sound choices: the answer + three other romaji from this script.
    const pool = kanaList(kanaScript).map((x) => x.romaji).filter((r) => r !== q.romaji);
    const opts = [q.romaji];
    while (opts.length < 4 && pool.length) {
      const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!opts.includes(r)) opts.push(r);
    }
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    el.kqOptions.innerHTML = "";
    let answered = false;
    for (const r of opts) {
      const b = document.createElement("button");
      b.className = "kq-opt";
      b.textContent = r;
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        speakLetter(q.ch);                    // hear it the moment you answer
        const ok = r === q.romaji;
        b.classList.add(ok ? "ok" : "bad");
        if (!ok) [...el.kqOptions.children].find((x) => x.textContent === q.romaji).classList.add("ok");
        if (ok) {
          kq.right += 1;
          // Journey stops grant at most one notch per letter for the whole
          // stop; the Kana section's own practice notches every correct answer.
          if (!kq.oneNotch || !kq.notched.has(q.ch)) {
            prog.kanaMastery[q.ch] = Math.min(KANA_MAX, (prog.kanaMastery[q.ch] || 0) + 1);
            kq.notched.add(q.ch);
          }
          markKanaSeen(q.ch, 2);                 // solid enough to fade its romaji
        } else if (!kq.oneNotch) {
          prog.kanaMastery[q.ch] = Math.max(0, (prog.kanaMastery[q.ch] || 0) - 1);
        }
        save();
        setTimeout(() => {
          kq.idx += 1;
          if (kq.idx >= kq.queue.length) {
            if (kq.right >= 8) { try { window.HanaFX && HanaFX.pop && HanaFX.pop(); } catch (e) {} }
            openKana();                        // back to the grid, tints refreshed
          } else renderKanaQuestion();
        }, ok ? 650 : 1400);
      });
      el.kqOptions.appendChild(b);
    }
  }

  // ---- Wire up -------------------------------------------------------------
  el.backBtn.addEventListener("click", backToMap);
  el.doneHomeBtn.addEventListener("click", backToMap);
  el.reviewBtn.addEventListener("click", startReview);
  el.focusBtn.addEventListener("click", startFocus);
  el.startBtn.addEventListener("click", () => startLesson(activeLesson));
  el.doneQuizBtn.addEventListener("click", () => startTalk(activeLesson));
  el.kanaBtn.addEventListener("click", openKana);
  el.kanaTabH.addEventListener("click", () => { kanaScript = "h"; el.kanaQuiz.hidden = true; el.kanaGrid.hidden = false; el.kanaPracticeBtn.hidden = false; renderKanaGrid(); });
  el.kanaTabK.addEventListener("click", () => { kanaScript = "k"; el.kanaQuiz.hidden = true; el.kanaGrid.hidden = false; el.kanaPracticeBtn.hidden = false; renderKanaGrid(); });
  el.kanaPracticeBtn.addEventListener("click", startKanaPractice);
  el.kqStop.addEventListener("click", openKana);
  el.quizMicBtn.addEventListener("click", startListening);
  el.quizPlayBtn.addEventListener("click", () => { if (quiz && quiz.target) speak(quiz.target.jp, { lang: "ja-JP" }); });
  el.quizRevealBtn.addEventListener("click", () => { if (!quiz) return; quiz.results[quiz.idx] = quiz.results[quiz.idx] || 0; showQuizAnswer(); });
  el.quizSkipBtn.addEventListener("click", () => { if (!quiz) return; quiz.results[quiz.idx] = quiz.results[quiz.idx] || 0; quizNext(); });
  el.quizNextBtn.addEventListener("click", quizNext);
  el.quizHintBtn.addEventListener("click", () => { el.quizHint.hidden = !el.quizHint.hidden; el.quizHintBtn.textContent = el.quizHint.hidden ? "show hint" : "hide hint"; });
  el.quizBackBtn.addEventListener("click", () => { if (activeLesson) openIntro(activeLesson); else renderHome(); });
  el.quizAgainBtn.addEventListener("click", () => {
    if (quiz && quiz.scene && !quiz.scene.auto) startScene(quiz.scene);
    else startTalk(activeLesson);          // auto-scenes rebuild fresh (reshuffled)
  });
  el.quizMochiko.addEventListener("click", () => {   // tap her bubble to hear it again
    const st = quiz && quiz.scene && quiz.steps[quiz.idx];
    if (st && st.who === "m") speak(st.jp, { lang: "ja-JP" });
  });
  el.buildBtn.addEventListener("click", () => startLesson(activeLesson, { build: true }));
  el.buildHardBtn.addEventListener("click", () => startLesson(activeLesson, { build: true, hard: true }));
  el.buildReset.addEventListener("click", () => { if (build && !build.solved) startBuild(current.s); });
  el.retireBtn.addEventListener("click", () => {
    delete prog.cards[current.id];     // back to "new" — only its lesson drills it now
    save();
    session.cleared += 1;
    nextCard();
  });
  el.restartBtn.addEventListener("click", () => {
    if (session && session.mode === "focus") startFocus();
    else if (session && session.mode === "review") startReview();
    else startLesson(activeLesson, { build: session && session.build, hard: session && session.hard });
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
  el.promptEn.addEventListener("click", () => {
    if (current && current.kanaSound) speakLetter(current.soundChar);
    else if (current && current.kanaBuild) speak(current.word.jp, { lang: "ja-JP" });
    else if (current && current.doBuild && session.hard) speak(current.s.jp, { lang: "ja-JP" });
  });
  el.showHintBtn.addEventListener("click", () => { el.hint.hidden = false; el.showHintBtn.hidden = true; });
  document.querySelectorAll("button.grade").forEach((b) => b.addEventListener("click", () => grade(Number(b.dataset.grade))));
  if (el.syncBtn) el.syncBtn.addEventListener("click", onSyncClick);

  el.settingsBtn.addEventListener("click", openSettings);
  el.dailyRing.addEventListener("click", renderHome);
  el.romajiMode.addEventListener("change", () => {
    settings.kanaMode = el.romajiMode.value || "auto";
    settings.romaji = settings.kanaMode !== "never";   // legacy flag, kept in sync
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
    // updateViaCache:"none" forces a fresh network fetch of sw.js on every
    // update check, so a new deploy is noticed on the very next open instead
    // of waiting for the browser's HTTP cache of sw.js to expire (which made
    // the reload prompt take a couple of reopens to show up).
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      const notify = (worker) => {
        if (worker && navigator.serviceWorker.controller) showUpdateBanner(worker);
      };
      const track = (worker) => {
        if (!worker) return;
        if (worker.state === "installed") notify(worker);
        else worker.addEventListener("statechange", () => { if (worker.state === "installed") notify(worker); });
      };
      if (reg.waiting) notify(reg.waiting);
      track(reg.installing);                                  // an update may already be in flight
      reg.addEventListener("updatefound", () => track(reg.installing));
      reg.update().catch(() => {});                           // check right now, on every open
      // Re-check whenever the app regains focus (e.g. you reopen it on mobile).
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
      setInterval(() => reg.update().catch(() => {}), 15 * 60 * 1000);
    }).catch(() => {});
  });
}

// Manual update check — the version comes from the stylesheet's ?v= param so
// there's no extra place to bump; the button force-fetches the newest deploy
// when iOS is slow to surface the automatic reload banner.
(function () {
  const btn = document.getElementById("update-btn");
  if (!btn) return;
  const m = ((document.querySelector('link[href*="theme.css"]') || {}).href || "").match(/v=(\d+)/);
  const APP_V = m ? "v" + m[1] : "";
  const label = () => { btn.textContent = "↻ " + (APP_V ? APP_V + " · " : "") + "check for update"; };
  label();
  // Expose the running version for the header chip (theme.js renders it).
  window.HANASOU_VERSION = APP_V;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "↻ checking…";
    try {
      const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) {
        await reg.update();
        if (reg.waiting) {                      // fresh version downloaded → swap in
          btn.textContent = "↻ updating…";
          reg.waiting.postMessage({ type: "SKIP_WAITING" });   // controllerchange reloads
          return;
        }
      }
    } catch (e) {}
    // No new service worker — plain reload still refetches index.html
    // network-first, so a stuck page comes back current.
    setTimeout(() => window.location.reload(), 350);
  });
})();

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
