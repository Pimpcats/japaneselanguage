// Presentation shell for Hanasou.
// Keeps the lesson engine and audio pipeline intact while providing a cleaner,
// mobile-first navigation layer around the existing screens.
(function () {
  "use strict";

  const PROGRESS_KEY = "hanasou.v4";
  const SETTINGS_KEY = "hanasou.settings";
  const LAST_LESSON_KEY = "hanasou.lastLessonId";

  const $ = (id) => document.getElementById(id);
  const home = $("home");
  const lessonMap = $("lesson-map");
  const reviewBtn = $("review-btn");
  const stats = $("stats");
  const immersion = $("immersion");
  const mining = $("mining");
  const mastery = $("mastery");
  const appTitle = $("app-title");
  const settingsBtn = $("settings-btn");
  const dailyRing = $("daily-ring");
  const footer = document.querySelector("#app > footer");
  const drill = $("drill");
  let practiceNav = null;

  if (!home || !lessonMap || !reviewBtn || !stats || !immersion || !mining) return;

  const topLevelScreens = {};
  let activeHub = "lessons";
  let refreshQueued = false;

  const svg = {
    lessons: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 4.25h10.5A1.75 1.75 0 0 1 19 6v12.25a.75.75 0 0 1-1.08.67L12 15.96l-5.92 2.96A.75.75 0 0 1 5 18.25V6a1.75 1.75 0 0 1 1.75-1.75Z"/><path d="M8.5 8h7M8.5 11h5"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.25 8.5A7.5 7.5 0 1 0 20 12"/><path d="M19.25 4.75V8.5H15.5"/><path d="M12 8.25V12l2.5 1.5"/></svg>',
    kana: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 7.25h9"/><path d="M11 4.75c0 5-1.2 9.4-4.4 12.1"/><path d="M9.6 9.4c3.4-.5 5.6 1 5.6 3.6 0 2.4-1.9 4-4.6 4.3"/><path d="M17.4 5.6v12.8"/></svg>',
    library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.25 5.25h5.5v13.5h-5.5zM13.25 5.25h5.5v13.5h-5.5z"/><path d="M7.25 8h1.5M15.25 8h1.5"/></svg>',
    progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18.75V13.5h3v5.25zM10.5 18.75V9h3v9.75zM16 18.75V5.25h3v13.5z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.1"/><circle cx="12" cy="12" r="2.3"/><path d="M12 3.3v2.6M12 18.1v2.6M20.7 12h-2.6M5.9 12H3.3M18.1 5.9l-1.8 1.8M7.7 16.3l-1.8 1.8M18.1 18.1l-1.8-1.8M7.7 7.7L5.9 5.9"/></svg>',
  };

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch { return {}; }
  }

  function getProgress() {
    const p = readJSON(PROGRESS_KEY);
    p.cards = p.cards || {};
    p.daily = p.daily || { day: null, count: 0 };
    p.streak = p.streak || { current: 0 };
    p.mined = p.mined || [];
    return p;
  }

  function getSettings() {
    const s = readJSON(SETTINGS_KEY);
    if (!s.dailyGoal) s.dailyGoal = 20;
    return s;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function lessonProgress(lesson, progress) {
    const cards = lesson.sentences || [];
    let passed = 0;
    let due = 0;
    const now = Date.now();
    cards.forEach((_, i) => {
      const state = progress.cards[lesson.id + "#" + i];
      if (state && state.reps) {
        if ((state.interval || 0) >= 1) passed += 1;
        if ((state.due || 0) <= now) due += 1;
      }
    });
    return { total: cards.length, passed, due, pct: cards.length ? passed / cards.length : 0 };
  }

  function allCardIds(progress) {
    const ids = [];
    (window.LESSONS || []).forEach((lesson) => {
      (lesson.sentences || []).forEach((_, index) => ids.push(lesson.id + "#" + index));
    });
    (progress.mined || []).forEach((sentence) => ids.push("mined#" + sentence.id));
    return ids;
  }

  function dueCount(progress) {
    const now = Date.now();
    return allCardIds(progress).reduce((count, id) => {
      const state = progress.cards[id];
      return count + (state && state.reps && (state.due || 0) <= now ? 1 : 0);
    }, 0);
  }

  function resumeLesson() {
    const lessons = window.LESSONS || [];
    if (!lessons.length) return null;
    const progress = getProgress();
    // "Done" = you went through it (the engine's cleared flag) OR every card is
    // mastered. The owner considers a lesson done once they've ridden it, not
    // only when all cards pass — so a 4/6 lesson you finished shouldn't pin the
    // banner. Matches app.js finish() writing prog.cleared[id].
    const cleared = progress.cleared || {};
    const notDone = (lesson) =>
      !cleared[lesson.id] && lessonProgress(lesson, progress).passed < (lesson.sentences || []).length;

    const lastId = localStorage.getItem(LAST_LESSON_KEY);
    const lastIndex = lessons.findIndex((lesson) => lesson.id === lastId);

    // 1) Still mid-lesson where you left off → keep going in it.
    if (lastIndex >= 0 && notDone(lessons[lastIndex])) return lessons[lastIndex];
    // 2) Otherwise the next lesson you haven't done, scanning forward from there.
    for (let i = (lastIndex >= 0 ? lastIndex + 1 : 0); i < lessons.length; i += 1) {
      if (notDone(lessons[i])) return lessons[i];
    }
    // 3) Nothing ahead — the earliest lesson anywhere you still haven't done
    //    (covers an earlier one you skipped past).
    for (let i = 0; i < lessons.length; i += 1) if (notDone(lessons[i])) return lessons[i];
    // 4) Everything's done — leave the banner on the final lesson.
    return lessons[lessons.length - 1];
  }

  function sectionHeading(eyebrow, title, body) {
    const wrap = make("header", "hub-heading");
    wrap.appendChild(make("div", "hub-eyebrow", eyebrow));
    wrap.appendChild(make("h2", "hub-title", title));
    if (body) wrap.appendChild(make("p", "hub-copy", body));
    return wrap;
  }

  function buildShell() {
    const shell = make("div", "home-shell");

    const lessonsHub = make("div", "home-hub");
    lessonsHub.id = "hub-lessons";
    // Condensed: no big hub heading or "All lessons" bar — the continue card and
    // the lesson cards sit right under the banner (owner: keep everything but the
    // banner and the cards tight).
    const continueSlot = make("div", "continue-slot");
    continueSlot.id = "continue-slot";
    lessonsHub.appendChild(continueSlot);
    // Straight under "what's next": the pile you swiped ← nope, on your terms.
    const homeReview = make("button", "home-review-btn");
    homeReview.id = "home-review-btn";
    homeReview.type = "button";
    homeReview.hidden = true;
    homeReview.addEventListener("click", () => {
      if (typeof window.__hanaStartMissed === "function") window.__hanaStartMissed();
    });
    lessonsHub.appendChild(homeReview);
    lessonsHub.appendChild(lessonMap);
    // The standalone あア Kana button is replaced by the Kana tab in the nav.
    const kanaBtn = $("kana-btn");
    if (kanaBtn) kanaBtn.style.display = "none";
    // Hide the kawaii onboarding explainer so nothing but the banner + cards shows.
    const howit = $("howit");
    if (howit) howit.style.display = "none";

    // ---- Review: the sentences you swiped ← nope --------------------------
    // They already ride along as warmups, but that's the app's timing. This is
    // yours: the whole miss pile in one place, drillable whenever you like.
    const reviewHub = make("div", "home-hub");
    reviewHub.id = "hub-review";
    reviewHub.hidden = true;
    reviewHub.appendChild(sectionHeading("Your misses", "The ones that got away.", "Every sentence you swiped ← nope, waiting for you to come back to it."));
    const reviewOverview = make("div", "review-overview");
    reviewOverview.id = "review-overview";
    reviewHub.appendChild(reviewOverview);
    const missStart = make("button", "primary review-btn miss-start");
    missStart.id = "miss-start-btn";
    missStart.type = "button";
    missStart.hidden = true;
    missStart.addEventListener("click", () => {
      if (typeof window.__hanaStartMissed === "function") window.__hanaStartMissed();
    });
    reviewHub.appendChild(missStart);
    const missList = make("div", "miss-list");
    missList.id = "miss-list";
    reviewHub.appendChild(missList);
    const reviewEmpty = make("div", "empty-card");
    reviewEmpty.id = "review-empty";
    reviewEmpty.innerHTML = '<span class="empty-icon">✓</span><h3>Nothing missed</h3><p>Sentences you swipe ← nope during a lesson collect here, so you can come back to them on your own time.</p>';
    reviewHub.appendChild(reviewEmpty);
    // app.js's hero button keeps living here (it's the engine's own "continue"
    // and app.js writes to it), but it stays hidden: home already has the
    // station Continue card, and this screen is about the miss pile.
    reviewBtn.classList.add("hero-elsewhere");
    reviewHub.appendChild(reviewBtn);

    const libraryHub = make("div", "home-hub");
    libraryHub.id = "hub-library";
    libraryHub.hidden = true;
    libraryHub.appendChild(sectionHeading("Your Japanese", "Build a personal library.", "Save sentences you hear, import study material, or read Japanese in context."));
    libraryHub.appendChild(mining);

    const progressHub = make("div", "home-hub");
    progressHub.id = "hub-progress";
    progressHub.id = "hub-progress";
    progressHub.hidden = true;
    progressHub.appendChild(sectionHeading("Your activity", "Progress without the pressure.", "A simple view of consistency, mastery, and time spent with Japanese."));
    const masteryCard = make("section", "mastery-card");
    masteryCard.appendChild(make("div", "card-kicker", "Course mastery"));
    if (mastery) masteryCard.appendChild(mastery);
    progressHub.appendChild(masteryCard);
    progressHub.appendChild(stats);
    progressHub.appendChild(immersion);
    if (footer) progressHub.appendChild(footer);

    shell.appendChild(lessonsHub);
    shell.appendChild(reviewHub);
    shell.appendChild(libraryHub);
    shell.appendChild(progressHub);
    home.appendChild(shell);

    topLevelScreens.lessons = lessonsHub;
    topLevelScreens.review = reviewHub;
    topLevelScreens.library = libraryHub;
    topLevelScreens.progress = progressHub;
  }

  function buildTabBar() {
    const nav = make("nav", "bottom-nav");
    nav.id = "bottom-nav";
    nav.setAttribute("aria-label", "Main navigation");

    [
      ["lessons", "Lessons"],
      ["review", "Review"],
      ["kana", "Kana"],
      ["library", "Library"],
      ["progress", "Progress"],
      ["settings", "Settings"],
    ].forEach(([name, label]) => {
      const button = make("button", "tab-item");
      button.type = "button";
      button.dataset.hub = name;
      button.setAttribute("aria-label", name === "review" ? "Review your misses" : label);
      button.innerHTML = '<span class="tab-icon">' + svg[name] + '</span>' +
        '<span class="tab-label">' + label + '</span>' +
        (name === "review" ? '<span class="tab-badge" hidden></span>' : "");
      button.addEventListener("click", () => {
        // Neither "Kana" nor "Settings" is a hub — each jumps straight to its screen.
        if (name === "settings") { if (typeof window.__hanaOpenSettings === "function") window.__hanaOpenSettings(); return; }
        if (name === "kana") { if (typeof window.__hanaOpenKana === "function") window.__hanaOpenKana(); return; }
        if (activeHub === name) window.scrollTo({ top: 0, behavior: "smooth" });
        else activateHub(name, true);
      });
      nav.appendChild(button);
    });

    document.body.appendChild(nav);
    return nav;
  }

  function buildPracticeNav() {
    const nav = make("nav", "practice-nav");
    nav.id = "practice-nav";
    nav.hidden = true;
    nav.setAttribute("aria-label", "Practice navigation");

    const back = make("button", "practice-nav-btn practice-back");
    back.type = "button";
    back.setAttribute("aria-label", "Back to lesson");
    back.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M14.5 5 7.5 12l7 7"/>' +
      "</svg>";
    back.addEventListener("click", () => {
      const originalBack = $("back-btn");
      if (originalBack) originalBack.click();
    });

    const homeButton = make("button", "practice-nav-btn practice-home");
    homeButton.type = "button";
    homeButton.setAttribute("aria-label", "All levels");
    homeButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="m4.5 10.5 7.5-6 7.5 6"/>' +
      '<path d="M6.5 9.5v9h11v-9M9.5 18.5v-5h5v5"/>' +
      "</svg>";
    homeButton.addEventListener("click", () => {
      if (typeof window.__hanaGoHome === "function") {
        window.__hanaGoHome();
      } else {
        const originalBack = $("back-btn");
        if (originalBack) originalBack.click();
      }
    });

    nav.append(back, homeButton);
    document.body.appendChild(nav);
    return nav;
  }

  const titleByHub = {
    lessons: "Lessons",
    review: "Review",
    library: "Library",
    progress: "Progress",
  };

  function activateHub(name, scrollTop) {
    if (!topLevelScreens[name]) return;
    activeHub = name;
    Object.entries(topLevelScreens).forEach(([key, screen]) => {
      screen.hidden = key !== name;
    });
    document.querySelectorAll(".tab-item").forEach((button) => {
      const selected = button.dataset.hub === name;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-current", selected ? "page" : "false");
    });
    document.body.dataset.hub = name;
    if (!home.hidden) appTitle.textContent = titleByHub[name];
    if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
    queueRefresh();
  }

  function syncPracticeNav() {
    if (!practiceNav) return;
    // Talk with もち子さん needs the escape hatch as much as the drill does:
    // its own back button only appears on the end-of-scene summary, so without
    // this you're stuck in the conversation until the last line.
    const talk = $("quiz");
    practiceNav.hidden = (!drill || drill.hidden) && (!talk || talk.hidden);
  }

  function findLevelIndex(lesson) {
    return (window.LEVELS || []).findIndex((level) =>
      (level.tiers || []).some((tier) => (tier.themes || []).includes(lesson.section))
    );
  }

  function clickLessonTile(lesson) {
    const tile = Array.from(lessonMap.querySelectorAll("button.lesson-tile")).find((button) => {
      const title = button.querySelector(".tile-title");
      return title && title.textContent.trim() === lesson.title;
    });
    if (tile) tile.click();
  }

  function openLesson(lesson) {
    if (!lesson) return;
    localStorage.setItem(LAST_LESSON_KEY, lesson.id);
    // Drive the real engine directly — it opens the lesson's level and starts
    // practice (car mode). Avoids guessing at DOM tiles the app doesn't render.
    if (typeof window.__hanaStartLesson === "function") window.__hanaStartLesson(lesson);
  }

  function renderContinue() {
    const slot = $("continue-slot");
    if (!slot) return;
    // Inside a level (the big card rail is showing), hide the Continue card so
    // the cards sit right at the top and fill the screen.
    const inLevel = !!lessonMap.querySelector(".lesson-rail");
    const hrb = $("home-review-btn");
    if (hrb) hrb.classList.toggle("in-level-hidden", inLevel);
    if (inLevel) { slot.hidden = true; return; }
    const lesson = resumeLesson();
    if (!lesson) { slot.hidden = true; return; }

    const progress = getProgress();
    const state = lessonProgress(lesson, progress);
    const percent = Math.round(state.pct * 100);
    const started = state.passed > 0;

    slot.hidden = false;
    slot.innerHTML = "";
    // Replicate the station-sign card this leads to, so you can see where in the
    // line you are: line-coloured badge (letter + station number), station name,
    // and progress — a light banner, not the old dark card.
    const info = (window.__hanaStationInfo && window.__hanaStationInfo(lesson.id)) || null;
    const button = make("button", "continue-card continue-station");
    button.type = "button";
    button.setAttribute("aria-label", (started ? "Continue " : "Start ") + lesson.title);
    if (info) button.style.setProperty("--stline", info.lineColor);

    if (info) {
      const badge = make("span", "cs-badge");
      badge.appendChild(make("span", "cs-line", info.lineLetter));
      badge.appendChild(make("span", "cs-num", info.stationNum));
      button.appendChild(badge);
    } else {
      button.appendChild(make("span", "continue-glyph", "話"));
    }

    const content = make("span", "continue-content");
    content.appendChild(make("span", "continue-kicker", started ? "Continue learning" : "Recommended next"));
    content.appendChild(make("strong", "continue-title", info ? info.name : lesson.title));
    if (info && info.romaji) content.appendChild(make("span", "continue-subtitle", info.romaji));
    const progressRow = make("span", "continue-progress-row");
    const bar = make("span", "continue-progress");
    const fill = make("i");
    fill.style.width = percent + "%";
    bar.appendChild(fill);
    progressRow.appendChild(bar);
    progressRow.appendChild(make("span", "continue-count", state.passed + " of " + state.total));
    content.appendChild(progressRow);
    button.appendChild(content);
    button.appendChild(make("span", "continue-arrow", "›"));
    button.addEventListener("click", () => openLesson(lesson));
    slot.appendChild(button);
  }

  // The Review hub + the home Review button both read one source: the app's
  // miss pile (every card whose last self-grade was ← nope or "kind of").
  function missedCards() {
    if (typeof window.__hanaMissed !== "function") return [];
    try { return window.__hanaMissed() || []; } catch { return []; }
  }

  function renderReviewOverview() {
    const wrap = $("review-overview");
    const empty = $("review-empty");
    const list = $("miss-list");
    const startBtn = $("miss-start-btn");
    if (!wrap || !empty) return;

    const missed = missedCards();
    const nope = missed.filter((m) => m.grade === 0).length;
    const progress = getProgress();
    const settings = getSettings();
    const done = progress.daily.day === today() ? (progress.daily.count || 0) : 0;
    const goal = settings.dailyGoal || 20;
    const dailyPct = Math.min(100, Math.round((done / goal) * 100));

    wrap.innerHTML = "";
    const missCard = make("section", "review-count-card");
    missCard.appendChild(make("div", "card-kicker", "Waiting for you"));
    const numberRow = make("div", "review-number-row");
    numberRow.appendChild(make("strong", "review-number", String(missed.length)));
    numberRow.appendChild(make("span", "review-unit", missed.length === 1 ? "sentence missed" : "sentences missed"));
    missCard.appendChild(numberRow);
    missCard.appendChild(make("p", "review-note", missed.length
      ? (nope ? nope + " you swiped ← nope" + (missed.length > nope ? ", " + (missed.length - nope) + " you marked “kind of”." : ".") : "All marked “kind of”.")
      : "Nothing to catch up on."));
    wrap.appendChild(missCard);

    const goalCard = make("section", "daily-card");
    const goalTop = make("div", "daily-top");
    goalTop.appendChild(make("span", "card-kicker", "Today"));
    goalTop.appendChild(make("strong", "daily-value", done + " / " + goal));
    goalCard.appendChild(goalTop);
    const bar = make("div", "daily-bar");
    const fill = make("i");
    fill.style.width = dailyPct + "%";
    bar.appendChild(fill);
    goalCard.appendChild(bar);
    goalCard.appendChild(make("div", "daily-caption", progress.streak.current ? "🔥 " + progress.streak.current + " day streak" : "Complete a review to begin a streak"));
    wrap.appendChild(goalCard);

    if (startBtn) {
      startBtn.hidden = !missed.length;
      startBtn.textContent = "↻ Review " + missed.length + " sentence" + (missed.length === 1 ? "" : "s");
    }
    // Show what's actually waiting — a miss you can read is a miss you can
    // decide to work on. Tapping one drills that single sentence.
    if (list) {
      list.innerHTML = "";
      list.hidden = !missed.length;
      missed.slice(0, 40).forEach((m) => {
        const row = make("button", "miss-row" + (m.grade === 0 ? " miss-nope" : " miss-kinda"));
        row.type = "button";
        const txt = make("span", "miss-txt");
        txt.appendChild(make("span", "miss-jp", m.jp || ""));
        txt.appendChild(make("span", "miss-en", m.en || ""));
        row.appendChild(txt);
        const meta = make("span", "miss-meta");
        meta.appendChild(make("span", "miss-mark", m.grade === 0 ? "← nope" : "kind of"));
        if (m.lesson) meta.appendChild(make("span", "miss-lesson", m.lesson));
        row.appendChild(meta);
        row.addEventListener("click", () => {
          if (typeof window.__hanaStartMissed === "function") window.__hanaStartMissed([m.id]);
        });
        list.appendChild(row);
      });
      if (missed.length > 40) {
        list.appendChild(make("p", "miss-more", "…and " + (missed.length - 40) + " more in the queue."));
      }
    }
    empty.hidden = missed.length > 0;

    // The tab badge and the home button follow the same count.
    const badge = document.querySelector('.tab-item[data-hub="review"] .tab-badge');
    if (badge) {
      badge.hidden = !missed.length;
      badge.textContent = missed.length > 99 ? "99+" : String(missed.length);
    }
    const homeBtn = $("home-review-btn");
    if (homeBtn) {
      homeBtn.hidden = !missed.length;
      homeBtn.innerHTML = '<span class="hrb-ico">↻</span><span class="hrb-txt"><b>Review your misses</b>' +
        '<small>' + missed.length + " sentence" + (missed.length === 1 ? "" : "s") + " you swiped ← nope</small></span>";
    }
  }

  function syncChrome() {
    const tabBar = $("bottom-nav");
    const homeVisible = !home.hidden;
    document.body.classList.toggle("has-tabbar", homeVisible);
    document.body.classList.toggle("subscreen", !homeVisible);
    if (tabBar) tabBar.hidden = !homeVisible;
    // Inside a level's cards, drop the top banner — the "← All levels" back
    // button is the only chrome; the banner stays on the home/overview page.
    document.body.classList.toggle("in-level", homeVisible && !!lessonMap.querySelector(".lesson-rail"));

    if (homeVisible) {
      appTitle.textContent = titleByHub[activeHub];
      if (settingsBtn) settingsBtn.style.visibility = "visible";
      if (dailyRing) dailyRing.style.visibility = "visible";
      return;
    }

    if (settingsBtn) settingsBtn.style.visibility = "hidden";
    if (dailyRing) dailyRing.style.visibility = "hidden";

    const labels = [
      [$("lesson-intro"), "Lesson"],
      [$("drill"), "Practice"],
      [$("settings"), "Settings"],
      [$("mine-form"), "Add sentence"],
      [$("import-form"), "Import"],
      [$("reader"), "Reader"],
      [$("lesson-done"), "Complete"],
    ];
    const visible = labels.find(([screen]) => screen && !screen.hidden);
    if (visible) appTitle.textContent = visible[1];
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      renderContinue();
      renderReviewOverview();
      syncChrome();
      syncPracticeNav();
    });
  }

  buildShell();
  buildTabBar();
  practiceNav = buildPracticeNav();
  activateHub("lessons", false);

  lessonMap.addEventListener("click", (event) => {
    const tile = event.target.closest("button.lesson-tile");
    if (!tile || !lessonMap.contains(tile)) return;
    const title = tile.querySelector(".tile-title");
    const lesson = title && (window.LESSONS || []).find((item) => item.title === title.textContent.trim());
    if (lesson) localStorage.setItem(LAST_LESSON_KEY, lesson.id);
  });

  if (dailyRing) dailyRing.addEventListener("click", () => activateHub("progress", true));

  const screenObserver = new MutationObserver(queueRefresh);
  [home, $("lesson-intro"), $("drill"), $("quiz"), $("settings"), $("mine-form"), $("import-form"), $("reader"), $("lesson-done")]
    .filter(Boolean)
    .forEach((screen) => screenObserver.observe(screen, { attributes: true, attributeFilter: ["hidden"] }));

  const contentObserver = new MutationObserver(queueRefresh);
  contentObserver.observe(lessonMap, { childList: true, subtree: true });
  contentObserver.observe(reviewBtn, { attributes: true, childList: true, subtree: true, attributeFilter: ["hidden"] });
  contentObserver.observe(stats, { childList: true, subtree: true });
  contentObserver.observe(mining, { childList: true, subtree: true });

  window.addEventListener("storage", queueRefresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) queueRefresh(); });
  queueRefresh();
})();
