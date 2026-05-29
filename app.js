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

  // Merge two progress blobs without losing reps made on another device.
  function mergeProgress(local, remote) {
    if (!remote) return local;
    const out = {
      cards: {},
      streak: Object.assign({ current: 0, longest: 0, lastDay: null }, local.streak),
      reviews: Math.max(local.reviews || 0, remote.reviews || 0),
      daily: mergeDaily(local.daily, remote.daily),
      mined: mergeMined(local.mined, remote.mined),
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
    home: $("home"), stats: $("stats"), reviewBtn: $("review-btn"), lessonMap: $("lesson-map"), mining: $("mining"),
    mineForm: $("mine-form"), mineJp: $("mine-jp"), mineEn: $("mine-en"), mineRomaji: $("mine-romaji"),
    mineHint: $("mine-hint"), mineError: $("mine-error"),
    mineSaveBtn: $("mine-save-btn"), mineCancelBtn: $("mine-cancel-btn"), minePreviewBtn: $("mine-preview-btn"),
    intro: $("lesson-intro"), lessonTitle: $("lesson-title"), lessonGrammar: $("lesson-grammar"),
    lessonNote: $("lesson-note"), vocabList: $("vocab-list"), startBtn: $("start-btn"),
    drill: $("drill"), progressFill: $("progress-fill"),
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
    resetBtn: $("reset-btn"), goalSelect: $("goal-select"),
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
  const screens = [el.home, el.intro, el.drill, el.done, el.settings, el.mineForm];
  function show(screen, { back = false } = {}) {
    speechSynthesis.cancel();
    stopAudio();
    screens.forEach((s) => (s.hidden = s !== screen));
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
      t.appendChild(Object.assign(document.createElement("div"), { className: "mine-item-jp", textContent: m.jp }));
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

  function openMineForm() {
    el.mineJp.value = ""; el.mineEn.value = ""; el.mineRomaji.value = ""; el.mineHint.value = "";
    el.mineError.hidden = true;
    show(el.mineForm, { back: true });
    el.mineJp.focus();
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

    renderMining();

    el.lessonMap.innerHTML = "";
    for (const tier of window.TIERS) {
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
      tierBlock.appendChild(tHead);

      if (!tierLessons.length) {
        tierBlock.appendChild(Object.assign(document.createElement("div"), { className: "tier-soon", textContent: "Coming soon" }));
        el.lessonMap.appendChild(tierBlock);
        continue;
      }

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
        tierBlock.appendChild(block);
      }
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

  function startSession(cards, mode, lessonId) {
    session = { queue: cards.slice(), total: cards.length, cleared: 0, mode, lessonId };
    show(el.drill, { back: true });
    nextCard();
  }

  function startLesson(L) {
    const cards = CARDS.filter((c) => c.lessonId === L.id);
    startSession(cards, "lesson", L.id);
  }
  function startReview() {
    const cards = dueCards();
    if (!cards.length) return;
    startSession(cards, "review", null);
  }

  let current = null;
  function nextCard() {
    if (session.cleared >= session.total || session.queue.length === 0) { finish(); return; }
    current = session.queue.shift();
    renderCard();
    el.progressFill.style.width = Math.round((session.cleared / session.total) * 100) + "%";
  }

  function renderCard() {
    const s = current.s;
    el.promptEn.textContent = s.en;
    el.answerKana.textContent = s.jp;
    el.answerRomaji.textContent = s.romaji;
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
    el.wordBreakdown.innerHTML = "";
    for (const w of s.words || []) {
      const chip = document.createElement("div");
      chip.className = "word-chip pos-" + (w.pos || "n");
      chip.appendChild(span("wc-jp", w.jp));
      chip.appendChild(span("wc-en", w.en));
      el.wordBreakdown.appendChild(chip);
    }
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
  el.restartBtn.addEventListener("click", () => {
    if (session && session.mode === "review") startReview();
    else if (session && session.mode === "mined") startMined();
    else startLesson(activeLesson);
  });

  el.mineSaveBtn.addEventListener("click", saveMined);
  el.mineCancelBtn.addEventListener("click", renderHome);
  el.minePreviewBtn.addEventListener("click", () => {
    const jp = el.mineJp.value.trim();
    if (jp) speak(jp, { lang: "ja-JP" });
  });

  el.revealBtn.addEventListener("click", reveal);
  el.replayBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP" }));
  el.slowBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP", rate: 0.7 }));
  el.mineThisBtn.addEventListener("click", mineCurrent);
  el.playEnBtn.addEventListener("click", () => speak(current.s.en, { lang: "en-US" }));
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
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (el.grade.hidden) reveal(); }
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

// Register the service worker for offline / installable PWA support.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
