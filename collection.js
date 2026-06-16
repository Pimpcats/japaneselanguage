// はなそう — Sticker & Stamp collection (add-on layer).
// Self-contained: persists its own progress, listens to the app's
// "hanasou:finish" event + the daily-goal ring, awards a stamp per lesson
// cleared and milestone stickers, and shows a stamp-book you open from the
// top bar. Art is placeholder for now (existing chibi art + inline SVGs);
// swap real sticker art in later by changing ART entries to a file path.
(() => {
  "use strict";
  const A = "assets/";
  const KEY = "hanasou.collection.v1";
  const FX = () => window.HanaFX || { confetti() {}, jingle() {} };

  // ---- storage -------------------------------------------------------------
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let data = load();
  data.stamps = data.stamps || {};      // lessonId -> ISO date earned
  data.stickers = data.stickers || {};  // stickerId -> ISO date earned
  data.stats = data.stats || { sessions: 0, bestCombo: 0, daily: 0, lastGoalDay: "" };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  // ---- placeholder art -----------------------------------------------------
  const svg = (s) => "data:image/svg+xml;utf8," + encodeURIComponent(s.replace(/\s+/g, " "));
  const badge = (inner, bg) => svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="${bg || "#fff6e6"}" stroke="#4a3328" stroke-width="5"/>${inner}</svg>`);
  const ART = {
    torii: badge('<g fill="#c5453b"><rect x="24" y="34" width="52" height="9"/><rect x="22" y="44" width="56" height="6"/><rect x="30" y="50" width="8" height="34"/><rect x="62" y="50" width="8" height="34"/></g>', "#ffe9ec"),
    star: badge('<path d="M50 24l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" fill="#f2be45" stroke="#4a3328" stroke-width="3" stroke-linejoin="round"/>'),
    fire: badge('<path d="M50 22c10 14 16 18 16 30a16 16 0 0 1-32 0c0-6 3-9 6-13 1 5 4 6 6 6-4-8 2-16 4-23z" fill="#ef6f4a" stroke="#4a3328" stroke-width="3"/>', "#fff0e6"),
    sun: badge('<g stroke="#f2be45" stroke-width="4" stroke-linecap="round"><path d="M50 14v10M50 76v10M14 50h10M76 50h10M25 25l7 7M68 68l7 7M75 25l-7 7M32 68l-7 7"/></g><circle cx="50" cy="50" r="16" fill="#f2be45" stroke="#4a3328" stroke-width="3"/>', "#fff8e0"),
    flag: badge('<rect x="40" y="22" width="5" height="56" fill="#4a3328"/><path d="M45 26h28l-7 9 7 9H45z" fill="#ef6fa7" stroke="#4a3328" stroke-width="3" stroke-linejoin="round"/>', "#ffe9f1"),
    medal: badge('<circle cx="50" cy="56" r="20" fill="#f2be45" stroke="#4a3328" stroke-width="3"/><path d="M40 20l10 18 10-18" fill="none" stroke="#ef6fa7" stroke-width="6"/><text x="50" y="62" font-size="18" text-anchor="middle" fill="#4a3328" font-family="sans-serif">★</text>'),
  };
  const artFor = (a) => a.endsWith(".png") ? A + a : (ART[a] || ART.star);

  // ---- milestone stickers --------------------------------------------------
  const STICKERS = [
    { id: "first",   name: "はじめのいっぽ", en: "First Step",     hint: "Clear your first lesson",   art: "chibi_thumbs.png", test: c => c.lessons >= 1 },
    { id: "five",    name: "コツコツ",       en: "Steady",         hint: "Clear 5 lessons",           art: "chibi_think.png",  test: c => c.lessons >= 5 },
    { id: "ten",     name: "たびびと",       en: "Traveler",       hint: "Clear 10 lessons",          art: "torii",            test: c => c.lessons >= 10 },
    { id: "twenty5", name: "せんせいのほこり", en: "Sensei's Pride", hint: "Clear 25 lessons",          art: "chibi_cheer.png",  test: c => c.lessons >= 25 },
    { id: "combo3",  name: "ノってきた",     en: "On a Roll",      hint: "Get a 3-combo",             art: "star",             test: c => c.combo >= 3 },
    { id: "combo7",  name: "ねっせん",       en: "Hot Streak",     hint: "Get a 7-combo",             art: "fire",             test: c => c.combo >= 7 },
    { id: "combo10", name: "むてき",         en: "Unstoppable",    hint: "Get a 10-combo",            art: "medal",            test: c => c.combo >= 10 },
    { id: "regular", name: "じょうれんさん", en: "Regular",        hint: "Finish 10 practice runs",   art: "star",             test: c => c.sessions >= 10 },
    { id: "region",  name: "せいは",         en: "Region Cleared", hint: "Clear every lesson in a theme", art: "flag",         test: c => c.regionDone },
  ];

  // ---- lessons grouped into "passport pages" by section --------------------
  const LESSONS = window.LESSONS || [];
  const sections = [];
  const bySection = new Map();
  for (const L of LESSONS) {
    if (!bySection.has(L.section)) { bySection.set(L.section, []); sections.push(L.section); }
    bySection.get(L.section).push(L);
  }
  const lessonTitle = (id) => { const L = LESSONS.find(x => x.id === id); return L ? L.title : id; };

  // ---- award logic ---------------------------------------------------------
  function ctx() {
    let regionDone = false;
    for (const sec of sections) {
      const ls = bySection.get(sec);
      if (ls.length && ls.every(L => data.stamps[L.id])) { regionDone = true; break; }
    }
    return {
      lessons: Object.keys(data.stamps).length,
      combo: data.stats.bestCombo, sessions: data.stats.sessions,
      daily: data.stats.daily, regionDone,
    };
  }
  const queue = [];
  function evaluate() {
    const c = ctx();
    for (const s of STICKERS) {
      if (!data.stickers[s.id] && s.test(c)) {
        data.stickers[s.id] = new Date().toISOString();
        queue.push({ type: "sticker", art: s.art, name: s.name, en: s.en });
      }
    }
    save();
    drainToasts();
  }

  window.addEventListener("hanasou:finish", (e) => {
    const d = (e && e.detail) || {};
    data.stats.sessions += 1;
    if (typeof d.bestCombo === "number") data.stats.bestCombo = Math.max(data.stats.bestCombo, d.bestCombo);
    if (d.lessonId && !data.stamps[d.lessonId]) {
      data.stamps[d.lessonId] = new Date().toISOString();
      queue.push({ type: "stamp", art: "star_stamp.png", name: lessonTitle(d.lessonId), en: "Stamp earned!" });
    }
    save();
    evaluate();
    refreshBadge();
  });

  // daily-goal ring → count once per day
  const ring = document.getElementById("daily-ring");
  if (ring) {
    const check = () => {
      if (!ring.classList.contains("complete")) return;
      const day = new Date().toISOString().slice(0, 10);
      if (data.stats.lastGoalDay === day) return;
      data.stats.lastGoalDay = day; data.stats.daily += 1; save(); evaluate();
    };
    new MutationObserver(check).observe(ring, { attributes: true, attributeFilter: ["class"] });
    check();
  }

  // ---- earn toast ----------------------------------------------------------
  let toasting = false;
  function drainToasts() {
    if (toasting || !queue.length) return;
    toasting = true;
    const item = queue.shift();
    const t = document.createElement("div");
    t.className = "earn-toast";
    t.innerHTML =
      '<div class="earn-card">' +
      '<div class="earn-kicker">' + (item.type === "stamp" ? "あたらしいスタンプ！" : "あたらしいステッカー！") + "</div>" +
      '<img class="earn-art" src="' + artFor(item.art) + '" alt="">' +
      '<div class="earn-name">' + item.name + "</div>" +
      '<div class="earn-en">' + item.en + "</div>" +
      "</div>";
    document.body.appendChild(t);
    FX().confetti(28); FX().jingle();
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => { t.remove(); toasting = false; drainToasts(); }, 350);
    }, 1900);
  }

  // ---- collection screen (lazy modal) --------------------------------------
  function openCollection() {
    const c = ctx();
    let ov = document.getElementById("collection-overlay");
    if (ov) ov.remove();
    ov = document.createElement("div");
    ov.id = "collection-overlay";

    const stickerCells = STICKERS.map(s => {
      const got = !!data.stickers[s.id];
      return '<div class="col-sticker' + (got ? " got" : "") + '">' +
        '<img src="' + artFor(s.art) + '" alt="">' +
        '<div class="cs-name">' + (got ? s.name : "？？？") + "</div>" +
        '<div class="cs-hint">' + (got ? s.en : s.hint) + "</div></div>";
    }).join("");

    const pages = sections.map(sec => {
      const ls = bySection.get(sec);
      const cells = ls.map(L => {
        const got = !!data.stamps[L.id];
        return '<div class="stamp-slot' + (got ? " got" : "") + '" title="' + L.title.replace(/"/g, "") + '">' +
          (got ? '<img src="' + A + 'star_stamp.png" alt="">' : '<span class="slot-dot"></span>') +
          '<span class="slot-label">' + L.title + "</span></div>";
      }).join("");
      const done = ls.filter(L => data.stamps[L.id]).length;
      return '<div class="passport-page"><div class="pp-head">' + sec +
        ' <span class="pp-count">' + done + " / " + ls.length + "</span></div>" +
        '<div class="stamp-grid">' + cells + "</div></div>";
    }).join("");

    ov.innerHTML =
      '<div class="col-sheet">' +
      '<button class="col-close" aria-label="Close">✕</button>' +
      '<h2 class="col-title">コレクション</h2>' +
      '<div class="col-sub">Collection</div>' +
      '<div class="col-progress"><span>⭐ ' + Object.keys(data.stickers).length + " / " + STICKERS.length + " stickers</span>" +
      "<span>🗾 " + c.lessons + " / " + LESSONS.length + " stamps</span></div>" +
      '<div class="col-section-title">Stickers</div>' +
      '<div class="col-sticker-grid">' + stickerCells + "</div>" +
      '<div class="col-section-title">Stamp book</div>' +
      pages +
      "</div>";
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("show"));
    const close = () => { ov.classList.remove("show"); setTimeout(() => ov.remove(), 300); };
    ov.querySelector(".col-close").addEventListener("click", close);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
  }

  // ---- top-bar entry button ------------------------------------------------
  let badgeEl = null;
  function refreshBadge() {
    if (!badgeEl) return;
    const n = Object.keys(data.stamps).length + Object.keys(data.stickers).length;
    badgeEl.textContent = n ? String(n) : "";
    badgeEl.hidden = !n;
  }
  function mountButton() {
    const right = document.getElementById("topbar-right");
    if (!right || document.getElementById("collection-btn")) return;
    const btn = document.createElement("button");
    btn.id = "collection-btn";
    btn.className = "icon-btn";
    btn.setAttribute("aria-label", "Collection");
    btn.innerHTML = '📖<span class="col-badge" hidden></span>';
    btn.addEventListener("click", openCollection);
    right.insertBefore(btn, right.firstChild);
    badgeEl = btn.querySelector(".col-badge");
    refreshBadge();
  }
  mountButton();
})();
