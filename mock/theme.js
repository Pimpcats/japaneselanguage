// はなそう theme preview — additive playful behaviour. Touches no app logic;
// it only watches the DOM the real app renders and decorates it:
//   1. Kōhai reacts to grades, combo milestones, daily-goal completion, home
//   2. star stamp-press on the card when you nail one ("got it")
//   3. pop sound on button taps + sticker card-flip on reveal
//   4. tier emblem slots: assets/tier-<name>.png, star_stamp until drawn
(() => {
  "use strict";
  const A = "assets/"; // resolved against <base href="../"> → repo root

  // ----------------------------------------------- nicer English voice ----
  // The app speaks the English prompt with the device's *default* en voice,
  // which is often the stiff "compact" one. Upgrade it: prefer a natural /
  // enhanced / Siri / Google voice and soften the prosody a touch. Preview-
  // only (wraps speechSynthesis.speak); the live app is untouched.
  if ("speechSynthesis" in window) {
    const bestEnglish = () => {
      const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
      const score = (v) => {
        const n = (v.name || "").toLowerCase();
        let s = 0;
        if (/natural|neural|enhanced|premium/.test(n)) s += 6;
        if (/siri/.test(n)) s += 6;
        if (/google/.test(n)) s += 4;
        if (v.localService === false) s += 3;       // remote voices tend to sound better
        if (/compact/.test(n)) s -= 4;
        if (/^en-us/i.test(v.lang)) s += 1;
        if (/samantha|aria|jenny|libby|sonia|ava|nora|evan/.test(n)) s += 1;
        return s;
      };
      return vs.sort((a, b) => score(b) - score(a))[0] || null;
    };
    const realSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => {
      if (u && u.lang && /^en/i.test(u.lang)) {
        const v = bestEnglish();
        if (v) u.voice = v;
        u.pitch = 1.06;   // a hair brighter, less robotic
        u.rate = 0.97;    // ease off the clipped default cadence
      }
      return realSpeak(u);
    };
  }

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
  // Tiny WebAudio blip — no asset, volume kept low. Context unlocks on the
  // first user gesture (browser autoplay rules).
  let actx = null;
  function pop(freq = 660, drop = 0.45) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * drop, t + 0.09);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(actx.destination);
      osc.start(t); osc.stop(t + 0.13);
    } catch (e) {}
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
      if (g === 2) { stampCard(); pop(880, 0.6); } else pop(g === 0 ? 320 : 520);
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
        if ([...m.addedNodes].some((n) => n.nodeType === 1)) pop(820, 0.7);
      }
      if (buildAnswer.classList.contains("solved")) { stampCard(); react("cheer", "かんせい！|Kansei!"); }
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
