// Hanasou — Prompt & Respond drill.
// Flow: show English -> user speaks Japanese aloud -> reveal model answer (TTS) -> self-grade.
// Grading drives a tiny SRS-lite queue within the session, plus long-term ease in localStorage.

(function () {
  "use strict";

  const STORAGE_KEY = "hanasou.v1";

  const el = {
    promptEn: document.getElementById("prompt-en"),
    answerKana: document.getElementById("answer-kana"),
    answerRomaji: document.getElementById("answer-romaji"),
    revealArea: document.getElementById("reveal-area"),
    hintRow: document.getElementById("hint-row"),
    showHintBtn: document.getElementById("show-hint-btn"),
    hint: document.getElementById("hint"),
    revealBtn: document.getElementById("reveal-btn"),
    replayBtn: document.getElementById("replay-btn"),
    slowBtn: document.getElementById("slow-btn"),
    playEnBtn: document.getElementById("play-en-btn"),
    grade: document.getElementById("grade"),
    cardNum: document.getElementById("card-num"),
    cardTotal: document.getElementById("card-total"),
    resetBtn: document.getElementById("reset-btn"),
    voiceWarn: document.getElementById("voice-warn"),
  };

  // ---- Voice picking -------------------------------------------------------
  let jaVoice = null;
  let enVoice = null;

  function pickVoices() {
    const voices = speechSynthesis.getVoices();
    jaVoice =
      voices.find((v) => v.lang === "ja-JP" && /google/i.test(v.name)) ||
      voices.find((v) => v.lang === "ja-JP") ||
      voices.find((v) => v.lang.startsWith("ja")) ||
      null;
    enVoice =
      voices.find((v) => v.lang.startsWith("en") && v.default) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    el.voiceWarn.hidden = !!jaVoice;
  }
  pickVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = pickVoices;
  }

  function speak(text, { lang = "ja-JP", rate = 1.0 } = {}) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    if (lang.startsWith("ja") && jaVoice) u.voice = jaVoice;
    if (lang.startsWith("en") && enVoice) u.voice = enVoice;
    speechSynthesis.speak(u);
  }

  // ---- Persistence ---------------------------------------------------------
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  const state = loadState();
  state.ease = state.ease || {}; // {id: {seen, mistakes, lastGrade}}

  // ---- Queue building ------------------------------------------------------
  // Bias toward cards the user has flubbed before; shuffle the rest.
  function buildQueue() {
    const all = window.PROMPTS.slice();
    const weighted = all.map((p) => {
      const e = state.ease[p.id] || { seen: 0, mistakes: 0 };
      // Weight: brand-new and previously-missed cards bubble up.
      const noveltyBoost = e.seen === 0 ? 0.3 : 0;
      const mistakeBoost = e.mistakes * 0.4;
      const jitter = Math.random();
      return { p, score: noveltyBoost + mistakeBoost + jitter };
    });
    weighted.sort((a, b) => b.score - a.score);
    return weighted.map((w) => w.p);
  }

  let queue = buildQueue();
  let current = null;
  let cardIndex = 0;

  el.cardTotal.textContent = queue.length;

  // ---- Render --------------------------------------------------------------
  function renderCard() {
    if (!current) return;
    el.promptEn.textContent = current.en;
    el.answerKana.textContent = current.jp;
    el.answerRomaji.textContent = current.romaji;
    el.hint.textContent = current.hint || "";
    el.hintRow.hidden = !current.hint;
    el.hint.hidden = true;
    el.revealArea.hidden = true;
    el.replayBtn.hidden = true;
    el.slowBtn.hidden = true;
    el.grade.hidden = true;
    el.revealBtn.disabled = false;
    el.cardNum.textContent = cardIndex + 1;
  }

  function nextCard() {
    if (queue.length === 0) {
      queue = buildQueue();
      cardIndex = 0;
    }
    current = queue.shift();
    cardIndex++;
    renderCard();
  }

  function revealAndSpeak() {
    el.revealArea.hidden = false;
    el.replayBtn.hidden = false;
    el.slowBtn.hidden = false;
    el.grade.hidden = false;
    el.revealBtn.disabled = true;
    speak(current.jp, { lang: "ja-JP" });
  }

  function grade(g) {
    const id = current.id;
    const prev = state.ease[id] || { seen: 0, mistakes: 0 };
    prev.seen += 1;
    prev.lastGrade = g;
    if (g === 0) prev.mistakes += 1;
    state.ease[id] = prev;
    saveState(state);

    // Re-insertion: nope = bring back in 2-3, kinda = 6-8, got it = drop for now.
    if (g === 0) queue.splice(Math.min(2, queue.length), 0, current);
    else if (g === 1) queue.splice(Math.min(7, queue.length), 0, current);
    // g === 2: do not re-insert this session.

    nextCard();
  }

  // ---- Wire up -------------------------------------------------------------
  el.revealBtn.addEventListener("click", revealAndSpeak);
  el.replayBtn.addEventListener("click", () => speak(current.jp, { lang: "ja-JP" }));
  el.slowBtn.addEventListener("click", () => speak(current.jp, { lang: "ja-JP", rate: 0.7 }));
  el.playEnBtn.addEventListener("click", () => speak(current.en, { lang: "en-US" }));

  el.showHintBtn.addEventListener("click", () => {
    el.hint.hidden = false;
    el.showHintBtn.hidden = true;
  });

  document.querySelectorAll("button.grade").forEach((b) =>
    b.addEventListener("click", () => grade(Number(b.dataset.grade)))
  );

  el.resetBtn.addEventListener("click", () => {
    if (!confirm("Clear learning progress and start over?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // Keyboard shortcuts for desktop testing.
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (el.grade.hidden) revealAndSpeak();
    } else if (e.key === "1") grade(0);
    else if (e.key === "2") grade(1);
    else if (e.key === "3") grade(2);
    else if (e.key.toLowerCase() === "r") {
      if (!el.replayBtn.hidden) speak(current.jp, { lang: "ja-JP" });
    } else if (e.key.toLowerCase() === "s") {
      if (!el.slowBtn.hidden) speak(current.jp, { lang: "ja-JP", rate: 0.7 });
    }
  });

  // First card
  nextCard();
})();
