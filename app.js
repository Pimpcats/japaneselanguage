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

  // ---- Persistence ---------------------------------------------------------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }
  const prog = load();
  prog.cards = prog.cards || {};          // {cardId: {reps, ease, interval, due, lapses}}
  prog.streak = prog.streak || { current: 0, longest: 0, lastDay: null };
  prog.reviews = prog.reviews || 0;
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

  // Merge two progress blobs without losing reps made on another device.
  function mergeProgress(local, remote) {
    if (!remote) return local;
    const out = {
      cards: {},
      streak: Object.assign({ current: 0, longest: 0, lastDay: null }, local.streak),
      reviews: Math.max(local.reviews || 0, remote.reviews || 0),
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
    backBtn: $("back-btn"), streak: $("streak"),
    home: $("home"), stats: $("stats"), reviewBtn: $("review-btn"), lessonMap: $("lesson-map"),
    intro: $("lesson-intro"), lessonTitle: $("lesson-title"), lessonGrammar: $("lesson-grammar"),
    lessonNote: $("lesson-note"), vocabList: $("vocab-list"), startBtn: $("start-btn"),
    drill: $("drill"), progressFill: $("progress-fill"),
    promptEn: $("prompt-en"), answerKana: $("answer-kana"), answerRomaji: $("answer-romaji"),
    wordBreakdown: $("word-breakdown"), revealArea: $("reveal-area"),
    hintRow: $("hint-row"), showHintBtn: $("show-hint-btn"), hint: $("hint"),
    revealBtn: $("reveal-btn"), replayBtn: $("replay-btn"), slowBtn: $("slow-btn"), playEnBtn: $("play-en-btn"),
    grade: $("grade"),
    done: $("lesson-done"), doneSummary: $("done-summary"), restartBtn: $("restart-btn"), doneHomeBtn: $("done-home-btn"),
    voiceWarn: $("voice-warn"), syncBtn: $("sync-btn"),
    settingsBtn: $("settings-btn"), settings: $("settings"), romajiToggle: $("romaji-toggle"),
    voiceSelect: $("voice-select"), voiceTestBtn: $("voice-test-btn"),
    syncStatus: $("sync-status"), syncConnectBtn: $("sync-connect-btn"), syncDisconnectBtn: $("sync-disconnect-btn"),
    resetBtn: $("reset-btn"),
  };

  function span(cls, text) { const s = document.createElement("span"); s.className = cls; s.textContent = text; return s; }

  // ---- Voice ---------------------------------------------------------------
  let jaVoice = null, enVoice = null, jaVoices = [];
  function pickVoices() {
    const v = speechSynthesis.getVoices();
    jaVoices = v.filter((x) => x.lang && x.lang.toLowerCase().startsWith("ja"));
    const chosen = settings.voiceURI ? jaVoices.find((x) => x.voiceURI === settings.voiceURI) : null;
    jaVoice = chosen || jaVoices.find((x) => /google/i.test(x.name)) || jaVoices.find((x) => x.lang === "ja-JP") || jaVoices[0] || null;
    enVoice = v.find((x) => x.lang.startsWith("en") && x.default) || v.find((x) => x.lang.startsWith("en")) || null;
    el.voiceWarn.hidden = !!jaVoice;
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
  function speak(text, { lang = "ja-JP", rate = 1.0 } = {}) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = rate;
    if (lang.startsWith("ja") && jaVoice) u.voice = jaVoice;
    if (lang.startsWith("en") && enVoice) u.voice = enVoice;
    speechSynthesis.speak(u);
  }

  // ---- Navigation ----------------------------------------------------------
  const screens = [el.home, el.intro, el.drill, el.done, el.settings];
  function show(screen, { back = false } = {}) {
    speechSynthesis.cancel();
    screens.forEach((s) => (s.hidden = s !== screen));
    el.backBtn.hidden = !back;
    if (el.settingsBtn) el.settingsBtn.hidden = screen === el.settings;
  }

  function renderStreak() {
    el.streak.hidden = prog.streak.current <= 0;
    el.streak.textContent = "🔥 " + prog.streak.current;
  }

  // ---- Home ----------------------------------------------------------------
  function renderHome() {
    renderStreak();
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

    el.lessonMap.innerHTML = "";
    for (const section of window.SECTIONS) {
      const lessons = window.LESSONS.filter((L) => L.section === section);
      if (!lessons.length) continue;
      const block = document.createElement("div");
      block.className = "section-block";
      const head = document.createElement("div");
      head.className = "section-head";
      head.appendChild(Object.assign(document.createElement("h3"), { className: "section-title", textContent: section }));
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
      el.lessonMap.appendChild(block);
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
    el.grade.hidden = false;
    el.revealBtn.disabled = true;
    speak(current.s.jp, { lang: "ja-JP" });
  }

  function grade(g) {
    srsUpdate(current.id, g);
    if (g === 0) session.queue.push(current); else session.cleared += 1;
    renderStreak();
    nextCard();
  }

  function finish() {
    el.progressFill.style.width = "100%";
    const due = dueCards().length;
    el.doneSummary.textContent = session.mode === "review"
      ? "Review session done. Nice work keeping things fresh."
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
    else startLesson(activeLesson);
  });

  el.revealBtn.addEventListener("click", reveal);
  el.replayBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP" }));
  el.slowBtn.addEventListener("click", () => speak(current.s.jp, { lang: "ja-JP", rate: 0.7 }));
  el.playEnBtn.addEventListener("click", () => speak(current.s.en, { lang: "en-US" }));
  el.showHintBtn.addEventListener("click", () => { el.hint.hidden = false; el.showHintBtn.hidden = true; });
  document.querySelectorAll("button.grade").forEach((b) => b.addEventListener("click", () => grade(Number(b.dataset.grade))));
  if (el.syncBtn) el.syncBtn.addEventListener("click", onSyncClick);

  el.settingsBtn.addEventListener("click", openSettings);
  el.romajiToggle.addEventListener("change", () => {
    settings.romaji = el.romajiToggle.checked;
    saveSettings();
    applyRomaji();
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
