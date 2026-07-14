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

  if (!home || !lessonMap || !reviewBtn || !stats || !immersion || !mining) return;

  const topLevelScreens = {};
  let activeHub = "lessons";
  let refreshQueued = false;

  const svg = {
    lessons: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 4.25h10.5A1.75 1.75 0 0 1 19 6v12.25a.75.75 0 0 1-1.08.67L12 15.96l-5.92 2.96A.75.75 0 0 1 5 18.25V6a1.75 1.75 0 0 1 1.75-1.75Z"/><path d="M8.5 8h7M8.5 11h5"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.25 8.5A7.5 7.5 0 1 0 20 12"/><path d="M19.25 4.75V8.5H15.5"/><path d="M12 8.25V12l2.5 1.5"/></svg>',
    library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.25 5.25h5.5v13.5h-5.5zM13.25 5.25h5.5v13.5h-5.5z"/><path d="M7.25 8h1.5M15.25 8h1.5"/></svg>',
    progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18.75V13.5h3v5.25zM10.5 18.75V9h3v9.75zM16 18.75V5.25h3v13.5z"/></svg>',
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
    const lastId = localStorage.getItem(LAST_LESSON_KEY);
    const lastIndex = Math.max(0, lessons.findIndex((lesson) => lesson.id === lastId));
    const last = lessons[lastIndex];

    if (last && lessonProgress(last, progress).passed < (last.sentences || []).length) return last;

    for (let offset = 1; offset <= lessons.length; offset += 1) {
      const candidate = lessons[(lastIndex + offset) % lessons.length];
      const state = lessonProgress(candidate, progress);
      if (state.passed < state.total) return candidate;
    }
    return last || lessons[0];
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
    lessonsHub.appendChild(lessonMap);
    // The standalone あア Kana button is replaced by the Kana tab in the nav.
    const kanaBtn = $("kana-btn");
    if (kanaBtn) kanaBtn.style.display = "none";

    const reviewHub = make("div", "home-hub");
    reviewHub.id = "hub-review";
    reviewHub.hidden = true;
    reviewHub.appendChild(sectionHeading("Daily practice", "Review what matters now.", "Spaced repetition brings back sentences just before they fade."));
    const reviewOverview = make("div", "review-overview");
    reviewOverview.id = "review-overview";
    reviewHub.appendChild(reviewOverview);
    reviewHub.appendChild(reviewBtn);
    const reviewEmpty = make("div", "empty-card");
    reviewEmpty.id = "review-empty";
    reviewEmpty.innerHTML = '<span class="empty-icon">✓</span><h3>You are caught up</h3><p>No reviews are due right now. Starting another lesson will add new sentences to your rotation.</p>';
    reviewHub.appendChild(reviewEmpty);

    const libraryHub = make("div", "home-hub");
    libraryHub.id = "hub-library";
    libraryHub.hidden = true;
    libraryHub.appendChild(sectionHeading("Your Japanese", "Build a personal library.", "Save sentences you hear, import study material, or read Japanese in context."));
    libraryHub.appendChild(mining);

    const progressHub = make("div", "home-hub");
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
      ["review", "Kana"],
      ["library", "Library"],
      ["progress", "Progress"],
    ].forEach(([name, label]) => {
      const button = make("button", "tab-item");
      button.type = "button";
      button.dataset.hub = name;
      button.setAttribute("aria-label", label === "Kana" ? "Kana review" : label);
      button.innerHTML = '<span class="tab-icon">' + svg[name] + '</span><span class="tab-label">' + label + '</span>';
      button.addEventListener("click", () => {
        // The "Kana" tab isn't a hub — it jumps straight into Kana practice.
        if (name === "review") { if (typeof window.__hanaOpenKana === "function") window.__hanaOpenKana(); return; }
        if (activeHub === name) window.scrollTo({ top: 0, behavior: "smooth" });
        else activateHub(name, true);
      });
      nav.appendChild(button);
    });

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
    const lesson = resumeLesson();
    if (!lesson) { slot.hidden = true; return; }

    const progress = getProgress();
    const state = lessonProgress(lesson, progress);
    const percent = Math.round(state.pct * 100);
    const started = state.passed > 0;

    slot.hidden = false;
    slot.innerHTML = "";
    const button = make("button", "continue-card");
    button.type = "button";
    button.setAttribute("aria-label", (started ? "Continue " : "Start ") + lesson.title);

    const glyph = make("span", "continue-glyph", "話");
    button.appendChild(glyph);
    const content = make("span", "continue-content");
    content.appendChild(make("span", "continue-kicker", started ? "Continue learning" : "Recommended next"));
    content.appendChild(make("strong", "continue-title", lesson.title));
    content.appendChild(make("span", "continue-subtitle", lesson.grammar || "Speaking practice"));
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

  function renderReviewOverview() {
    const wrap = $("review-overview");
    const empty = $("review-empty");
    if (!wrap || !empty) return;

    const progress = getProgress();
    const settings = getSettings();
    const due = dueCount(progress);
    const done = progress.daily.day === today() ? (progress.daily.count || 0) : 0;
    const goal = settings.dailyGoal || 20;
    const dailyPct = Math.min(100, Math.round((done / goal) * 100));

    wrap.innerHTML = "";
    const dueCard = make("section", "review-count-card");
    dueCard.appendChild(make("div", "card-kicker", "Ready now"));
    const numberRow = make("div", "review-number-row");
    numberRow.appendChild(make("strong", "review-number", String(due)));
    numberRow.appendChild(make("span", "review-unit", due === 1 ? "sentence due" : "sentences due"));
    dueCard.appendChild(numberRow);
    dueCard.appendChild(make("p", "review-note", due ? "A focused session usually takes only a few minutes." : "Your memory queue is clear for now."));
    wrap.appendChild(dueCard);

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

    empty.hidden = due > 0;
    reviewBtn.classList.add("review-launch");
  }

  function syncChrome() {
    const tabBar = $("bottom-nav");
    const homeVisible = !home.hidden;
    document.body.classList.toggle("has-tabbar", homeVisible);
    document.body.classList.toggle("subscreen", !homeVisible);
    if (tabBar) tabBar.hidden = !homeVisible;

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
    });
  }

  buildShell();
  buildTabBar();
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
  [home, $("lesson-intro"), $("drill"), $("settings"), $("mine-form"), $("import-form"), $("reader"), $("lesson-done")]
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
