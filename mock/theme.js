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
  // (Home greeting removed: the world-map already shows Kōhai standing on your
  // current stop, so a second floating Kōhai on home was redundant.)
  void HELLOS;

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

  // A short, soft reverb so the reward chime rings out instead of clicking.
  let reverb = null;
  function getReverb() {
    const a = audio();
    if (reverb) return reverb;
    reverb = a.createConvolver();
    const len = Math.floor(a.sampleRate * 1.0);
    const buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    reverb.buffer = buf;
    const wet = a.createGain(); wet.gain.value = 0.32;
    reverb.connect(wet).connect(master);
    return reverb;
  }
  // bell-like tone: a stack of sine partials with a smooth exponential decay.
  function bell(freq, start, dur, vol, bus) {
    const a = audio(), t = a.currentTime + start;
    const partials = [[1, 1], [2, 0.45], [3, 0.22], [4.6, 0.1]]; // ratio, gain
    for (const [ratio, g] of partials) {
      const osc = a.createOscillator(), env = a.createGain();
      osc.type = "sine"; osc.frequency.value = freq * ratio;
      osc.detune.value = (Math.random() - 0.5) * 5;            // tiny warmth
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(vol * g, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(env).connect(bus);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
  }
  // rewarding bright chime for a correct answer (major arpeggio + sparkle)
  function jingle() {
    try {
      const a = audio();
      const bus = a.createGain(); bus.gain.value = 0.9;
      bus.connect(master); bus.connect(getReverb());
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.07, 0.95 - i * 0.07, 0.42, bus));
      bell(2093, 0.26, 0.5, 0.14, bus);                        // high sparkle
    } catch (e) {}
  }

  // ---- recorded reward sounds (mp3 assets) with synth fallback ------------
  // Real produced sounds the user drops into assets/. If a file is missing or
  // can't play (offline before first fetch), we fall back to the synth jingle.
  const SFX = {
    correct:  { url: A + "sfx-correct.mp3",         vol: 0.6 },
    complete: { url: A + "sfx-lesson-complete.mp3", vol: 0.65 },
  };
  function playSample(spec, fallback) {
    let fell = false;
    const fb = () => { if (fell) return; fell = true; if (fallback) fallback(); };
    try {
      const a = new Audio(spec.url);
      a.volume = spec.vol;
      a.addEventListener("error", fb, { once: true });
      const pr = a.play();
      if (pr && pr.catch) pr.catch(fb);
    } catch (e) { fb(); }
  }
  const playCorrect  = () => playSample(SFX.correct, jingle);
  const playComplete = () => playSample(SFX.complete, jingle);

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
      if (g === 2) { stampCard(); playCorrect(); confetti(); }   // got it → upgrade sound
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
        stampCard(); playCorrect(); confetti(); react("cheer", "かんせい！|Kansei!");
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

  // progress circle: fill the counter ring from its "X/N" text
  const counter = document.getElementById("card-counter");
  if (counter) {
    const syncRing = () => {
      const m = (counter.textContent || "").match(/(\d+)\s*\/\s*(\d+)/);
      if (m && +m[2]) counter.style.setProperty("--p", Math.round((+m[1] / +m[2]) * 100));
    };
    new MutationObserver(syncRing).observe(counter, { childList: true, characterData: true, subtree: true });
    syncRing();
  }

  // lesson-complete screen → big celebration
  const done = document.getElementById("lesson-done");
  if (done) {
    new MutationObserver(() => {
      if (!done.hidden) { confetti(40); playComplete(); setTimeout(() => confetti(24), 380); }
    }).observe(done, { attributes: true, attributeFilter: ["hidden"] });
  }

  // ---------------------------- painted header on every screen -------------
  // Persistent banner (sign + awning overlay) at the very top that reads the
  // current level / lesson in English. The top-bar controls are moved into it
  // so it doubles as the title bar (saves the separate strip below).
  const appEl = document.getElementById("app");
  if (appEl && !document.getElementById("app-banner")) {
    const banner = document.createElement("div");
    banner.id = "app-banner";
    banner.innerHTML =
      '<span class="ab-text"></span>' +
      '<img class="ab-awning" src="' + A + 'awning.png" alt="">';

    // Control bar under the banner — Back / Home / the 1/6 counter / Settings
    // all live together here (off the decorative sign).
    const ctrl = document.createElement("div");
    ctrl.id = "ctrl-bar";
    const cbLeft = document.createElement("div"); cbLeft.className = "cb-left";
    const cbMid = document.createElement("div"); cbMid.className = "cb-mid";
    const cbRight = document.createElement("div"); cbRight.className = "cb-right";
    ctrl.append(cbLeft, cbMid, cbRight);

    const homeScreen = document.getElementById("home");
    const drillScreen = document.getElementById("drill");
    const back = document.getElementById("back-btn");
    const right = document.getElementById("topbar-right");
    const counter = document.getElementById("card-counter");

    const homeBtn = document.createElement("button");
    homeBtn.id = "home-btn"; homeBtn.className = "icon-btn"; homeBtn.setAttribute("aria-label", "Home");
    homeBtn.textContent = "🏠";
    homeBtn.addEventListener("click", () => { if (window.__hanaGoHome) window.__hanaGoHome(); });

    if (back) cbLeft.appendChild(back);
    cbLeft.appendChild(homeBtn);
    if (counter) cbMid.appendChild(counter);   // the 1/6 progress circle
    if (right) cbRight.appendChild(right);

    // wrap banner + control bar in one sticky header
    const header = document.createElement("div");
    header.id = "app-header";
    header.append(banner, ctrl);
    appEl.insertBefore(header, appEl.firstChild);

    const toggleNav = () => { homeBtn.style.display = (homeScreen && homeScreen.hidden) ? "" : "none"; };
    if (homeScreen) new MutationObserver(toggleNav).observe(homeScreen, { attributes: true, attributeFilter: ["hidden"] });
    toggleNav();

    // the 1/6 counter only applies during a drill
    if (counter && drillScreen) {
      const toggleCounter = () => { counter.style.display = drillScreen.hidden ? "none" : ""; };
      new MutationObserver(toggleCounter).observe(drillScreen, { attributes: true, attributeFilter: ["hidden"] });
      toggleCounter();
    }

    const abText = banner.querySelector(".ab-text");
    const isVis = (id) => { const e = document.getElementById(id); return e && !e.hidden; };
    const levelOf = (title) => {
      const L = (window.LESSONS || []).find((x) => x.title === title);
      if (!L) return "";
      const lv = (window.LEVELS || []).find((v) => v.tiers.some((t) => t.themes.includes(L.section)));
      return lv ? lv.name : "";
    };
    let lastLesson = "";
    function bannerText() {
      if (isVis("settings")) return "Settings";
      if (isVis("reader")) return "Reader";
      if (isVis("mine-form")) return "Add a sentence";
      if (isVis("import-form")) return "Import sentences";
      if (isVis("lesson-done")) return "Lesson complete!";
      if (isVis("lesson-intro") || isVis("drill")) {
        const cur = (document.getElementById("lesson-title") || {}).textContent || "";
        if (cur) lastLesson = cur;
        const lv = levelOf(lastLesson);
        return (lv ? lv + " · " : "") + (lastLesson || "Practice");
      }
      if (isVis("home")) {
        const det = document.querySelector(".level-detail-title");
        return det ? det.textContent : "Choose a level";
      }
      return "はなそう";
    }
    const updateBanner = () => { abText.textContent = bannerText(); };
    updateBanner();
    const mo = new MutationObserver(updateBanner);
    document.querySelectorAll(".screen").forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["hidden"] }));
    const lt = document.getElementById("lesson-title"); if (lt) mo.observe(lt, { childList: true, characterData: true, subtree: true });
    const lm = document.getElementById("lesson-map"); if (lm) mo.observe(lm, { childList: true, subtree: true });
  }

  // expose the juicy effects so collection.js (and anything else) can reuse them
  window.HanaFX = { confetti, jingle, pop };
})();
