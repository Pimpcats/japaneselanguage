(function () {
  "use strict";
  const STORE = "hanasou.studio.v1";
  const $ = (id) => document.getElementById(id);
  const allLessons = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const allCards = allLessons.flatMap((lesson) => (lesson.sentences || []).map((sentence, index) => ({
    id: lesson.id + "#" + index, lessonId: lesson.id, lessonTitle: lesson.title,
    section: lesson.section || "", grammar: lesson.grammar || "", level: lesson.id.startsWith("l0") ? "FIRST SOUNDS" : lesson.id.startsWith("l1") ? "FOUNDATIONS" : "EVERYDAY JAPANESE",
    sentence
  }))).filter((card) => card.sentence && card.sentence.en && card.sentence.jp);
  const transforms = [
    { id: "transform-past-sushi", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I eat sushi.", sourceJp: "すしを たべます。", sentence: { en: "I ate sushi yesterday.", jp: "きのう、すしを たべました。", romaji: "kinou, sushi o tabemashita.", words: [{jp:"きのう",en:"yesterday",pos:"adv"},{jp:"すし",en:"sushi",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"たべました",en:"ate",pos:"v"}] } },
    { id: "transform-past-station", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I go to the station.", sourceJp: "えきに いきます。", sentence: { en: "I went to the station yesterday.", jp: "きのう、えきに いきました。", romaji: "kinou, eki ni ikimashita.", words: [{jp:"きのう",en:"yesterday",pos:"adv"},{jp:"えき",en:"station",pos:"n"},{jp:"に",en:"destination marker",pos:"prt"},{jp:"いきました",en:"went",pos:"v"}] } },
    { id: "transform-negative-coffee", section: "NEGATIVE", lessonTitle: "Negative forms", sourceEnglish: "I drink coffee.", sourceJp: "コーヒーを のみます。", sentence: { en: "I don't drink coffee.", jp: "コーヒーを のみません。", romaji: "koohii o nomimasen.", words: [{jp:"コーヒー",en:"coffee",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"のみません",en:"don't drink",pos:"v"}] } },
    { id: "transform-past-negative-breakfast", section: "PAST NEGATIVE", lessonTitle: "Past negative", sourceEnglish: "I eat breakfast.", sourceJp: "あさごはんを たべます。", sentence: { en: "I didn't eat breakfast.", jp: "あさごはんを たべませんでした。", romaji: "asagohan o tabemasen deshita.", words: [{jp:"あさごはん",en:"breakfast",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"たべませんでした",en:"didn't eat",pos:"v"}] } },
    { id: "transform-past-ticket", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I buy a ticket.", sourceJp: "きっぷを かいます。", sentence: { en: "I bought a ticket.", jp: "きっぷを かいました。", romaji: "kippu o kaimashita.", words: [{jp:"きっぷ",en:"ticket",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"かいました",en:"bought",pos:"v"}] } },
    { id: "transform-past-water", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I drink water.", sourceJp: "みずを のみます。", sentence: { en: "I drank water.", jp: "みずを のみました。", romaji: "mizu o nomimashita.", words: [{jp:"みず",en:"water",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"のみました",en:"drank",pos:"v"}] } },
    { id: "transform-past-movie", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I watch a movie.", sourceJp: "えいがを みます。", sentence: { en: "I watched a movie.", jp: "えいがを みました。", romaji: "eiga o mimashita.", words: [{jp:"えいが",en:"movie",pos:"n"},{jp:"を",en:"object marker",pos:"prt"},{jp:"みました",en:"watched",pos:"v"}] } },
    { id: "transform-past-live", section: "PAST TENSE", lessonTitle: "Past tense", sourceEnglish: "I live in Tokyo.", sourceJp: "とうきょうに すんでいます。", sentence: { en: "I lived in Tokyo.", jp: "とうきょうに すんでいました。", romaji: "toukyou ni sunde imashita.", words: [{jp:"とうきょう",en:"Tokyo",pos:"n"},{jp:"に",en:"location marker",pos:"prt"},{jp:"すんでいました",en:"lived",pos:"v"}] } }
  ];
  const defaults = { cards: {}, total: 0, wins: 0, daily: {}, settings: { goal: 10, romaji: "auto" }, history: [] };
  function load() { try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (_) { return Object.assign({}, defaults); } }
  const state = load();
  state.cards = state.cards || {}; state.daily = state.daily || {}; state.history = state.history || [];
  state.settings = Object.assign({}, defaults.settings, state.settings || {});
  const dayKey = () => new Date().toLocaleDateString("en-CA");
  const today = () => state.daily[dayKey()] || { attempts: 0, wins: 0 };
  function save() { localStorage.setItem(STORE, JSON.stringify(state)); renderStats(); }
  let mode = "recall", queue = [], queueIndex = 0, current = null, revealed = false, sessionAttempts = 0;
  let manifest = null, audioPlayer = null;
  const views = ["home-view", "practice-view", "settings-view"];
  function showView(id) { views.forEach((view) => $(view).classList.toggle("active", view === id)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
  function speak(jp, slow) {
    if (!jp) return;
    if (audioPlayer) { audioPlayer.pause(); audioPlayer = null; }
    const clip = manifest && manifest.clips && manifest.clips[jp];
    const file = clip && (slow && clip.s ? clip.s : clip.n);
    if (file) {
      audioPlayer = new Audio("../audio/" + file);
      audioPlayer.playbackRate = slow ? 0.82 : 1;
      audioPlayer.play().catch(() => browserSpeak(jp, slow));
    } else browserSpeak(jp, slow);
  }
  function browserSpeak(jp, slow) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(jp.replace(/\[[^\]]*\]/g, ""));
    utterance.lang = "ja-JP"; utterance.rate = slow ? 0.78 : 0.92;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ja")) || null;
    window.speechSynthesis.speak(utterance);
  }
  fetch("../audio/manifest.json").then((r) => r.ok ? r.json() : null).then((m) => { manifest = m; }).catch(() => {});

  function renderStats() {
    const t = today(); const goal = Number(state.settings.goal) || 10;
    $("today-count").innerHTML = t.attempts + ' <small>sentences</small>';
    $("today-bar").style.width = Math.min(100, t.attempts / goal * 100) + "%";
    const due = allCards.filter((card) => !state.cards[card.id] || (state.cards[card.id].due || 0) <= Date.now()).length;
    $("due-count").innerHTML = due + ' <small>due</small>';
    $("due-note").textContent = due ? "A few good reps go a long way" : "You're caught up for now";
    const recent = state.history.slice(-50);
    const wins = recent.filter((x) => x.grade === "good").length;
    $("win-rate").innerHTML = (recent.length ? Math.round(wins / recent.length * 100) : "—") + '<small>%</small>';
    $("today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  }
  function start(nextMode) {
    mode = nextMode || "recall"; queueIndex = 0; sessionAttempts = 0; revealed = false;
    $("next-button").onclick = nextCard; $("next-button").textContent = "Next sentence →"; $("replay-button").hidden = false;
    let candidates = allCards.slice();
    if (mode === "patterns") {
      candidates = transforms.map((item) => Object.assign({ transform: true, section: item.section, lessonTitle: item.lessonTitle }, item));
      $("session-mode").textContent = "PATTERN LAB · CHANGE THE SENTENCE";
    } else if (mode === "scenes") {
      const groups = [
        { name: "GETTING AROUND", test: /direction|transport|finding your way|tickets|trouble/i },
        { name: "EVERYDAY LIFE", test: /daily life|doing things|getting things|first contact/i },
        { name: "REAL CONVERSATIONS", test: /talking casually|reacting|relating|plans/i }
      ];
      const group = groups[Math.floor(Math.random() * groups.length)];
      const matching = candidates.filter((c) => group.test.test(c.section + " " + c.lessonTitle));
      if (matching.length) candidates = matching;
      $("session-mode").textContent = "IN THE MOMENT · " + group.name;
    } else if (mode === "listen") {
      $("session-mode").textContent = "LISTEN & NOTICE";
    } else $("session-mode").textContent = "SPEAKING PRACTICE";
    if (mode === "recall" || mode === "listen") {
      const due = candidates.filter((c) => !state.cards[c.id] || (state.cards[c.id].due || 0) <= Date.now());
      const fresh = candidates.filter((c) => state.cards[c.id] && (state.cards[c.id].due || 0) > Date.now()).sort(() => Math.random() - .5);
      candidates = due.concat(fresh);
    }
    queue = shuffle(candidates).slice(0, 10);
    if (!queue.length) queue = allCards.slice(0, 10);
    $("prompt-type").textContent = mode === "listen" ? "LISTEN FIRST · THEN SAY IT" : mode === "patterns" ? "TRANSFORM THE SENTENCE" : mode === "scenes" ? "YOU'RE IN THE SCENE" : "SAY IT IN JAPANESE";
    $("prompt-hint").textContent = mode === "listen" ? "Listen once. What did you hear? Repeat it aloud before checking the meaning." : mode === "patterns" ? "Use the same sentence pattern to express a new time or meaning. Say the full Japanese sentence before revealing it." : mode === "scenes" ? "Imagine you're there. Answer like a person, not a textbook." : "Say your answer out loud. Take your time — the answer is hidden.";
    showView("practice-view"); renderCard();
  }
  function shuffle(items) { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function renderCard() {
    if (queueIndex >= queue.length) { finishSession(); return; }
    current = queue[queueIndex]; revealed = false;
    const s = current.sentence;
    $("session-count").textContent = String(queueIndex + 1).padStart(2, "0") + " / " + String(queue.length).padStart(2, "0");
    $("session-progress-fill").style.width = (queueIndex / queue.length * 100) + "%";
    $("level-pill").textContent = current.section ? current.section.toUpperCase() : current.level;
    $("scenario-tag").hidden = mode !== "scenes" && mode !== "patterns";
    $("scenario-tag").textContent = mode === "patterns" ? "START HERE · " + current.sourceEnglish + "  /  " + current.sourceJp : mode === "scenes" ? "SITUATION · " + current.lessonTitle : "";
    $("prompt-en").textContent = s.en;
    $("think-copy").textContent = mode === "listen" ? "Listen first, then repeat from memory." : "Your turn. Say it before you tap.";
    $("answer-jp").textContent = s.jp;
    $("answer-romaji").textContent = state.settings.romaji === "hide" ? "" : (s.romaji || "");
    $("answer-en").textContent = s.en;
    $("answer-panel").hidden = true; $("before-actions").hidden = false; $("grade-area").hidden = true; $("listen-actions").hidden = true;
    $("breakdown-toggle").innerHTML = 'Show sentence structure <span>＋</span>'; $("token-row").hidden = true;
    renderTokens(s.words || []);
    if (mode === "listen") { speak(s.jp, false); $("think-copy").textContent = "Listen carefully. Now say it back."; }
  }
  function renderTokens(words) {
    const row = $("token-row"); row.innerHTML = "";
    words.forEach((word) => {
      const chip = document.createElement("span"); chip.className = "token pos-" + (word.pos || "expr");
      const jp = document.createElement("span"); jp.className = "token-jp"; jp.textContent = word.jp;
      const en = document.createElement("span"); en.className = "token-en"; en.textContent = word.en;
      chip.append(jp, en); row.appendChild(chip);
    });
  }
  function reveal() {
    if (!current || revealed) return;
    revealed = true;
    const s = current.sentence;
    $("answer-panel").hidden = false; $("before-actions").hidden = true;
    $("grade-area").hidden = false; $("listen-actions").hidden = true;
    $("think-copy").textContent = "Listen, notice the structure, and try saying it once more.";
    speak(s.jp, false);
  }
  function grade(result) {
    if (!current || !revealed) return;
    const now = Date.now(); const old = state.cards[current.id] || { interval: 0, ease: 2.3, reps: 0, lapses: 0 };
    let interval = old.interval || 0;
    if (result === "again") { interval = 0; old.lapses = (old.lapses || 0) + 1; }
    else if (result === "hard") interval = Math.max(10 * 60 * 1000, interval ? interval * 1.35 : 12 * 60 * 60 * 1000);
    else interval = Math.max(24 * 60 * 60 * 1000, interval ? interval * 2.1 : 24 * 60 * 60 * 1000);
    old.interval = interval; old.ease = result === "hard" ? Math.max(1.3, (old.ease || 2.3) - .08) : result === "good" ? Math.min(2.8, (old.ease || 2.3) + .04) : (old.ease || 2.3);
    old.reps = (old.reps || 0) + 1; old.due = now + interval; state.cards[current.id] = old;
    const d = today(); d.attempts += 1; if (result === "good") { d.wins += 1; state.wins += 1; }
    state.daily[dayKey()] = d; state.total += 1; sessionAttempts += 1;
    state.history.push({ id: current.id, grade: result, at: now }); state.history = state.history.slice(-300);
    save();
    $("grade-area").hidden = true; $("listen-actions").hidden = false;
    $("session-progress-fill").style.width = ((queueIndex + 1) / queue.length * 100) + "%";
    $("think-copy").textContent = result === "good" ? "That came out on your own. Nice work." : result === "hard" ? "Nearly there. We'll bring this pattern back." : "This one needs another pass. That's useful information.";
  }
  function finishSession() {
    $("session-progress-fill").style.width = "100%";
    $("session-mode").textContent = "SESSION COMPLETE";
    $("prompt-type").textContent = "YOU SHOWED UP";
    $("scenario-tag").hidden = true;
    $("prompt-en").textContent = "Every attempt makes the next one easier.";
    $("prompt-hint").textContent = "You tried " + sessionAttempts + " sentences. Take one last breath and say your hardest sentence once more.";
    $("think-copy").textContent = "Progress is what you can retrieve tomorrow.";
    $("answer-panel").hidden = true; $("before-actions").hidden = true; $("grade-area").hidden = true; $("listen-actions").hidden = false;
    $("replay-button").hidden = true; $("next-button").textContent = "Back to your studio →";
    $("next-button").onclick = () => { $("replay-button").hidden = false; $("next-button").textContent = "Next sentence →"; $("next-button").onclick = nextCard; showView("home-view"); };
  }
  function nextCard() { queueIndex++; renderCard(); }
  function renderBreakdown() {
    const row = $("token-row"); const hidden = !row.hidden;
    row.hidden = hidden;
    $("breakdown-toggle").innerHTML = hidden ? 'Show sentence structure <span>＋</span>' : 'Hide sentence structure <span>−</span>';
  }
  function openSettings() {
    $("daily-goal").value = String(state.settings.goal || 10);
    $("romaji-setting").value = state.settings.romaji || "auto";
    showView("settings-view");
  }
  $("start-session").addEventListener("click", () => start("recall"));
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => start(button.dataset.mode)));
  $("back-home").addEventListener("click", () => showView("home-view"));
  $("settings-button").addEventListener("click", openSettings);
  $("settings-back").addEventListener("click", () => showView("home-view"));
  $("reveal-button").addEventListener("click", reveal);
  $("skip-button").addEventListener("click", nextCard);
  $("breakdown-toggle").addEventListener("click", renderBreakdown);
  $("replay-button").addEventListener("click", () => current && speak(current.sentence.jp, false));
  $("next-button").addEventListener("click", nextCard);
  document.querySelectorAll("[data-grade]").forEach((button) => button.addEventListener("click", () => grade(button.dataset.grade)));
  $("daily-goal").addEventListener("change", (e) => { state.settings.goal = Number(e.target.value); save(); });
  $("romaji-setting").addEventListener("change", (e) => { state.settings.romaji = e.target.value; save(); });
  $("reset-progress").addEventListener("click", () => {
    if (!window.confirm("Reset only the new Speaking Studio's review history? Your original Hanasou app and Anki are not affected.")) return;
    state.cards = {}; state.total = 0; state.wins = 0; state.daily = {}; state.history = []; save(); showView("home-view");
  });
  renderStats();
})();