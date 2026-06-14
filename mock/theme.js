// はなそう theme preview — additive playful behaviour. Touches no app logic;
// it only watches the DOM the real app renders and decorates it:
//   1. Kōhai reacts to grades, combo milestones, daily-goal completion, home
//   2. star stamp-press on the card when you nail one ("got it")
//   3. pop sound on button taps + sticker card-flip on reveal
//   4. tier emblem slots: assets/tier-<name>.png, star_stamp until drawn
(() => {
  "use strict";
  const A = "assets/"; // resolved against <base href="../"> → repo root

  // ---------------------------------------------------------------- Kōhai --
  const POSES = {
    happy: "chibi_thumbs.png",
    cheer: "chibi_cheer.png",
    sad:   "chibi_cry.png",
    think: "chibi_think.png",
  };
  const helper = document.createElement("div");
  helper.id = "kohai-helper";
  const bubble = document.createElement("div");
  bubble.className = "kh-bubble";
  const img = document.createElement("img");
  img.alt = "Kōhai";
  helper.append(bubble, img);
  document.body.appendChild(helper);
  helper.style.opacity = "0";

  let hideTimer = null;
  function react(pose, say, ms = 3000) {
    img.src = A + (POSES[pose] || POSES.happy);
    const [jp, rj] = say.split("|");
    bubble.innerHTML = jp + (rj ? '<span class="romaji">' + rj + "</span>" : "");
    helper.classList.remove("pop"); void helper.offsetWidth; helper.classList.add("pop");
    helper.style.opacity = "1";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { helper.style.opacity = "0"; }, ms);
  }

  // grades → mood (got it also stamps the card, below)
  const GRADE_REACT = [
    ["sad",   "つぎはできるよ！|Tsugi wa dekiru yo!"],
    ["think", "おしい！|Oshii!"],
    ["cheer", "すごーい！|Sugoi!"],
  ];

  // greetings when you land on home
  const HELLOS = [
    "おかえり！|Okaeri!",
    "きょうもがんばろう！|Kyō mo ganbarou!",
    "いっしょにれんしゅうしよう！|Issho ni renshū shiyou!",
  ];
  const home = document.getElementById("home");
  let greeted = false;
  function maybeGreet() {
    if (!home || home.hidden || greeted) return;
    greeted = true; // once per visit to home (resets when you leave)
    react("happy", HELLOS[Math.floor(Math.random() * HELLOS.length)], 2600);
  }
  if (home) {
    new MutationObserver(() => { if (home.hidden) greeted = false; else maybeGreet(); })
      .observe(home, { attributes: true, attributeFilter: ["hidden"] });
    setTimeout(maybeGreet, 900); // first load
  }

  // combo milestones: the app writes "🔥 N" into #combo on hot streaks
  const combo = document.getElementById("combo");
  let lastCombo = 0;
  if (combo) {
    new MutationObserver(() => {
      const n = parseInt((combo.textContent || "").replace(/\D+/g, ""), 10) || 0;
      if (n > lastCombo && n >= 3 && (n === 3 || n % 5 === 0)) {
        react("cheer", "コンボ ×" + n + "！|Combo ×" + n + "!");
      }
      lastCombo = n;
    }).observe(combo, { childList: true, characterData: true, subtree: true });
  }

  // daily goal ring completing → celebration
  const ring = document.getElementById("daily-ring");
  if (ring) {
    let wasComplete = ring.classList.contains("complete");
    new MutationObserver(() => {
      const now = ring.classList.contains("complete");
      if (now && !wasComplete) react("cheer", "きょうのもくひょうたっせい！|Daily goal done!", 4000);
      wasComplete = now;
    }).observe(ring, { attributes: true, attributeFilter: ["class"] });
  }

  // ------------------------------------------------------------ pop sound --
  // Tiny WebAudio sounds — no assets. A master gain keeps these UI sounds
  // gentle and *consistent* with the spoken-sentence playback (which plays at
  // full volume), so taps no longer feel louder/harsher than the voice.
  let actx = null, master = null;
  const UI_VOL = 0.14;
  function audio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = UI_VOL; master.connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  // one soft note (triangle = mellow, eased in/out so there's no harsh click)
  function note(freq, start, dur = 0.12, vol = 1) {
    const a = audio(), t = a.currentTime + start;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = "triangle"; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function pop(freq = 560) { try { note(freq, 0, 0.1, 0.55); } catch (e) {} }
  // rewarding ascending arpeggio for a correct answer
  function jingle() {
    try { [[660, 0], [880, 0.09], [1320, 0.18]].forEach(([f, d]) => note(f, d, 0.16, 0.85)); } catch (e) {}
  }

  // ------------------------------------------------------------- confetti --
  const COLORS = ["#ef6fa7", "#f8a8c6", "#f2be45", "#79c8ec", "#3e8e41", "#fff"];
  function confetti(n = 26) {
    let layer = document.getElementById("confetti-layer");
    if (!layer) { layer = document.createElement("div"); layer.id = "confetti-layer"; document.body.appendChild(layer); }
    for (let i = 0; i < n; i++) {
      const star = i % 6 === 0;
      const c = document.createElement("div");
      c.className = "cf" + (star ? " star" : "");
      c.style.left = Math.random() * 100 + "%";
      const dur = 1.1 + Math.random() * 1.1;
      c.style.animationDuration = dur + "s";
      if (star) c.style.background = "url(" + A + "star_stamp.png) center/contain no-repeat";
      else c.style.background = COLORS[i % COLORS.length];
      layer.appendChild(c);
      setTimeout(() => c.remove(), dur * 1000 + 80);
    }
  }

  // ------------------------------------------------- stamp press & flip ----
  const card = document.getElementById("card");
  function stampCard() {
    if (!card) return;
    const st = document.createElement("img");
    st.className = "stamp-hit";
    st.src = A + "star_stamp.png";
    st.alt = "";
    card.appendChild(st);
    setTimeout(() => st.remove(), 1400);
  }
  function flipCard() {
    if (!card) return;
    card.classList.remove("card-flip"); void card.offsetWidth; card.classList.add("card-flip");
  }

  // ------------------------------------------------------- click wiring ----
  document.addEventListener("click", (e) => {
    const grade = e.target.closest("[data-grade]");
    if (grade) {
      const g = +grade.dataset.grade;
      const [pose, say] = GRADE_REACT[g] || GRADE_REACT[1];
      react(pose, say);
      if (g === 2) { stampCard(); jingle(); confetti(); }     // got it → reward!
      else pop(g === 0 ? 300 : 480);
      return;
    }
    if (e.target.closest("#reveal-btn")) { flipCard(); pop(740); return; }
    // generic light pop on tappy things; skip text links
    if (e.target.closest("button.primary, button.secondary, .build-chip, .lesson-tile, .level-tab, .wc-main")) pop();
  });

  // build-mode: correct chip placement gets the high pop via the .ok class
  const buildAnswer = document.getElementById("build-answer");
  if (buildAnswer) {
    new MutationObserver((muts) => {
      for (const m of muts) {
        if ([...m.addedNodes].some((n) => n.nodeType === 1)) pop(820);
      }
      if (buildAnswer.classList.contains("solved") && !buildAnswer.dataset.cheered) {
        buildAnswer.dataset.cheered = "1";
        stampCard(); jingle(); confetti(); react("cheer", "かんせい！|Kansei!");
      }
      if (!buildAnswer.classList.contains("solved")) delete buildAnswer.dataset.cheered;
    }).observe(buildAnswer, { childList: true, attributes: true, attributeFilter: ["class"] });
  }

  // --------------------------------------------------------- tier emblems --
  // Slot an emblem into every tier header: assets/tier-<tiername>.png
  // (e.g. tier-beginner.png). Until that file exists the gold star stands in,
  // so dropping art in assets/ lights up automatically.
  function emblemize(root) {
    root.querySelectorAll(".tier-head").forEach((head) => {
      if (head.querySelector(".tier-emblem")) return;
      const nameEl = head.querySelector(".tier-name");
      const slug = (nameEl ? nameEl.textContent : "").trim().toLowerCase().split(/\s+/)[0] || "tier";
      const em = document.createElement("img");
      em.className = "tier-emblem";
      em.alt = "";
      em.onerror = () => { em.onerror = null; em.src = A + "star_stamp.png"; };
      em.src = A + "tier-" + slug + ".png";
      head.prepend(em);
    });
  }
  const map = document.getElementById("lesson-map");
  if (map) {
    emblemize(map);
    new MutationObserver(() => emblemize(map)).observe(map, { childList: true, subtree: true });
  }

  // lesson-complete screen → big celebration
  const done = document.getElementById("lesson-done");
  if (done) {
    new MutationObserver(() => {
      if (!done.hidden) { confetti(40); jingle(); setTimeout(() => confetti(24), 380); }
    }).observe(done, { attributes: true, attributeFilter: ["hidden"] });
  }

  // ------------------------------------------------- painted home header ---
  if (home && !document.getElementById("home-banner")) {
    const banner = document.createElement("div");
    banner.id = "home-banner";
    banner.innerHTML =
      '<div class="hb-sign"><img src="' + A + 'sign.png" alt=""><span>はなそう！</span></div>' +
      '<img class="hb-awning" src="' + A + 'awning.png" alt="">';
    home.prepend(banner);
  }
})();
