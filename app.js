// Hanasou — lesson-based speaking drill (sample: one lesson).
// Flow: show lesson vocab + grammar point -> drill sentences that recombine
// those words -> speak aloud -> reveal model answer (TTS + word breakdown) -> self-grade.

(function () {
  "use strict";

  const lesson = window.LESSONS && window.LESSONS[0];

  const el = {
    progress: document.getElementById("progress"),
    cardNum: document.getElementById("card-num"),
    cardTotal: document.getElementById("card-total"),
    // intro
    lessonIntro: document.getElementById("lesson-intro"),
    lessonTitle: document.getElementById("lesson-title"),
    lessonGrammar: document.getElementById("lesson-grammar"),
    lessonNote: document.getElementById("lesson-note"),
    vocabList: document.getElementById("vocab-list"),
    startBtn: document.getElementById("start-btn"),
    // drill
    card: document.getElementById("card"),
    promptEn: document.getElementById("prompt-en"),
    answerKana: document.getElementById("answer-kana"),
    answerRomaji: document.getElementById("answer-romaji"),
    wordBreakdown: document.getElementById("word-breakdown"),
    revealArea: document.getElementById("reveal-area"),
    hintRow: document.getElementById("hint-row"),
    showHintBtn: document.getElementById("show-hint-btn"),
    hint: document.getElementById("hint"),
    controls: document.getElementById("controls"),
    revealBtn: document.getElementById("reveal-btn"),
    replayBtn: document.getElementById("replay-btn"),
    slowBtn: document.getElementById("slow-btn"),
    playEnBtn: document.getElementById("play-en-btn"),
    grade: document.getElementById("grade"),
    // done
    lessonDone: document.getElementById("lesson-done"),
    restartBtn: document.getElementById("restart-btn"),
    reviewVocabBtn: document.getElementById("review-vocab-btn"),
    // misc
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

  // ---- Intro / vocab -------------------------------------------------------
  function span(cls, text) {
    const s = document.createElement("span");
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function renderIntro() {
    el.lessonTitle.textContent = lesson.title;
    el.lessonGrammar.textContent = lesson.grammar;
    el.lessonNote.textContent = lesson.grammarNote || "";
    el.vocabList.innerHTML = "";
    for (const w of lesson.vocab) {
      const row = document.createElement("button");
      row.className = `vocab-row pos-${w.pos || "n"}`;
      row.appendChild(span("v-jp", w.jp));
      row.appendChild(span("v-romaji", w.romaji));
      row.appendChild(span("v-en", w.en));
      row.addEventListener("click", () => speak(w.jp, { lang: "ja-JP" }));
      el.vocabList.appendChild(row);
    }
  }

  function showIntro() {
    el.lessonIntro.hidden = false;
    el.card.hidden = true;
    el.controls.hidden = true;
    el.grade.hidden = true;
    el.lessonDone.hidden = true;
    el.progress.hidden = true;
    speechSynthesis.cancel();
  }

  // ---- Drill ---------------------------------------------------------------
  const total = lesson ? lesson.sentences.length : 0;
  let queue = [];
  let current = null;
  let cleared = 0;

  function startPractice() {
    queue = lesson.sentences.slice();
    cleared = 0;
    el.lessonIntro.hidden = true;
    el.lessonDone.hidden = true;
    el.card.hidden = false;
    el.controls.hidden = false;
    el.progress.hidden = false;
    el.cardTotal.textContent = total;
    nextCard();
  }

  function renderCard() {
    el.promptEn.textContent = current.en;
    el.answerKana.textContent = current.jp;
    el.answerRomaji.textContent = current.romaji;
    el.hint.textContent = current.hint || "";
    el.hintRow.hidden = !current.hint;
    el.hint.hidden = true;
    el.showHintBtn.hidden = false;
    el.revealArea.hidden = true;
    el.replayBtn.hidden = true;
    el.slowBtn.hidden = true;
    el.grade.hidden = true;
    el.revealBtn.disabled = false;
    el.cardNum.textContent = Math.min(cleared + 1, total);
    renderWordBreakdown(current);
  }

  function renderWordBreakdown(prompt) {
    el.wordBreakdown.innerHTML = "";
    if (!prompt.words || !prompt.words.length) return;
    for (const w of prompt.words) {
      const chip = document.createElement("div");
      chip.className = `word-chip pos-${w.pos || "n"}`;
      chip.appendChild(span("wc-jp", w.jp));
      chip.appendChild(span("wc-en", w.en));
      el.wordBreakdown.appendChild(chip);
    }
  }

  function nextCard() {
    if (cleared >= total || queue.length === 0) {
      finishLesson();
      return;
    }
    current = queue.shift();
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
    // nope: send to the back to try again. kinda/got it: cleared.
    if (g === 0) queue.push(current);
    else cleared += 1;
    nextCard();
  }

  function finishLesson() {
    el.card.hidden = true;
    el.controls.hidden = true;
    el.grade.hidden = true;
    el.progress.hidden = true;
    el.lessonDone.hidden = false;
    speechSynthesis.cancel();
  }

  // ---- Wire up -------------------------------------------------------------
  el.startBtn.addEventListener("click", startPractice);
  el.restartBtn.addEventListener("click", startPractice);
  el.reviewVocabBtn.addEventListener("click", showIntro);

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

  // Keyboard shortcuts for desktop testing.
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (el.card.hidden) return;
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

  // First screen
  if (!lesson) {
    el.lessonTitle.textContent = "No lesson found.";
  } else {
    renderIntro();
    showIntro();
  }
})();
