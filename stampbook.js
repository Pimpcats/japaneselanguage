// スタンプ帳 — the station stamp book.
// A self-contained add-on (like the retired collection.js): finishing every
// lesson in a level earns that level's station stamp, pressed live on the
// lesson-complete moment and kept in a flip-book styled after the stamp
// books carried for temple 御朱印 and JR station stamps. Reads app progress
// from localStorage; its own state lives in hanasou.stamps.v1. Never touches
// SRS data.
(() => {
  "use strict";
  const KEY = "hanasou.stamps.v1";
  const PROGRESS_KEY = "hanasou.v4";
  const INK = "#b5372a";
  // mirrors app.js line identity (letter per level, by index)
  const LINE_LETTERS = ["G", "M", "H", "T", "C", "N", "Y", "Z", "F", "I"];

  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {}; } };
  const stamps = () => read(KEY);
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

  function levels() { return window.LEVELS || []; }
  function lessonsOf(level) {
    const themes = (level.tiers || []).flatMap((t) => t.themes || []);
    return (window.LESSONS || []).filter((l) => themes.includes(l.section));
  }
  function levelComplete(level) {
    const prog = read(PROGRESS_KEY);
    const cards = prog.cards || {};
    const ls = lessonsOf(level);
    if (!ls.length) return false;
    return ls.every((l) => (l.sentences || []).every((_, i) => {
      const st = cards[l.id + "#" + i];
      return st && st.reps && (st.interval || 0) >= 1;
    }));
  }

  // ---- the stamp itself: a circular vermillion station stamp (SVG) ---------
  function stampSVG(level, idx, size) {
    const letter = LINE_LETTERS[idx] || "?";
    const title = (level.title || "").toUpperCase();
    const uid = "st" + idx + Math.floor(size);
    return '<svg viewBox="0 0 200 200" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<defs>' +
      '<filter id="rough-' + uid + '"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="' + (idx + 3) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>' +
      '<feComponentTransfer><feFuncA type="table" tableValues="0 0.92"/></feComponentTransfer></filter>' +
      '<path id="arc-top-' + uid + '" d="M 30 100 A 70 70 0 0 1 170 100"/>' +
      '<path id="arc-bot-' + uid + '" d="M 26 100 A 74 74 0 0 0 174 100"/>' +
      '</defs>' +
      '<g filter="url(#rough-' + uid + ')" fill="' + INK + '" stroke="' + INK + '">' +
      '<circle cx="100" cy="100" r="94" fill="none" stroke-width="7"/>' +
      '<circle cx="100" cy="100" r="82" fill="none" stroke-width="2.5"/>' +
      '<text font-size="17" font-weight="700" letter-spacing="3" stroke="none">' +
      '<textPath href="#arc-top-' + uid + '" startOffset="50%" text-anchor="middle">は な そ う ・ 話</textPath></text>' +
      '<text font-size="13" font-weight="700" letter-spacing="2" stroke="none">' +
      '<textPath href="#arc-bot-' + uid + '" startOffset="50%" text-anchor="middle">' + title + '</textPath></text>' +
      '<rect x="72" y="58" width="56" height="56" rx="10" fill="none" stroke-width="5"/>' +
      '<text x="100" y="102" font-size="40" font-weight="800" text-anchor="middle" stroke="none">' + letter + '</text>' +
      '<text x="100" y="140" font-size="26" font-weight="800" text-anchor="middle" stroke="none">' + idx + '</text>' +
      '</g></svg>';
  }

  // ---- book overlay --------------------------------------------------------
  let overlay = null;
  function buildBook() {
    if (overlay) { refreshBook(); return overlay; }
    overlay = document.createElement("div");
    overlay.id = "stampbook-overlay";
    overlay.innerHTML =
      '<button class="sb-close" aria-label="Close">✕</button>' +
      '<div class="sb-book"><div class="sb-sheets"></div></div>' +
      '<div class="sb-hint">tap the pages to turn</div>';
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeBook(); });
    overlay.querySelector(".sb-close").addEventListener("click", closeBook);
    document.body.appendChild(overlay);
    refreshBook();
    return overlay;
  }
  function slotHTML(level, idx) {
    const got = stamps()[level.id];
    let inner;
    if (got) {
      const date = new Date(got);
      const d = date.getFullYear() + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getDate()).padStart(2, "0");
      inner = '<div class="sb-stamped" style="--tilt:' + (((idx * 47) % 9) - 4) + 'deg">' + stampSVG(level, idx, 148) + '</div>' +
        '<div class="sb-date">' + d + '</div>';
    } else {
      inner = '<div class="sb-empty"><span class="sb-empty-num">' + idx + '</span></div>' +
        '<div class="sb-date sb-date-locked">この先の駅</div>';
    }
    return '<div class="sb-slot">' + inner +
      '<div class="sb-slot-title">' + level.title + '</div></div>';
  }
  function refreshBook() {
    const holder = overlay.querySelector(".sb-sheets");
    holder.innerHTML = "";
    const lv = levels();
    // sheet 0 = the cover; then one level per face (front/back per sheet)
    const faces = ['<div class="sb-cover"><i class="sb-cover-band"></i><b>スタンプ帳</b><small>STAMP BOOK</small></div>',
      '<div class="sb-inside"><p>Clear every station on a line and its stamp is pressed here — the way travellers collect them from stations and temples across Japan.</p></div>'];
    lv.forEach((level, i) => faces.push(slotHTML(level, i)));
    if (faces.length % 2) faces.push('<div class="sb-blank"></div>');
    const sheetCount = faces.length / 2;
    for (let s = 0; s < sheetCount; s++) {
      const sheet = document.createElement("div");
      sheet.className = "sb-sheet" + (s === 0 ? " sb-sheet-cover" : "");
      sheet.style.zIndex = String(sheetCount - s);
      sheet.innerHTML = '<div class="sb-face sb-front">' + faces[s * 2] + '</div>' +
        '<div class="sb-face sb-back">' + faces[s * 2 + 1] + '</div>';
      sheet.addEventListener("click", () => {
        const turned = sheet.classList.toggle("turned");
        sheet.style.zIndex = String(turned ? s : sheetCount - s);
      });
      holder.appendChild(sheet);
    }
  }
  function openBook() { buildBook(); overlay.classList.add("open"); document.body.classList.add("sb-open"); }
  function closeBook() { if (overlay) overlay.classList.remove("open"); document.body.classList.remove("sb-open"); }

  // ---- the award moment: the stamp is pressed onto the done screen ---------
  function pressStamp(level, idx) {
    const wrap = document.createElement("div");
    wrap.id = "stamp-award";
    wrap.innerHTML =
      '<div class="sa-card">' +
      '<div class="sa-kicker">' + level.title + ' — all stations cleared!</div>' +
      '<div class="sa-pad"><div class="sa-stamp">' + stampSVG(level, idx, 190) + '</div></div>' +
      '<div class="sa-line">スタンプ、おします…</div>' +
      '<button class="sa-view" type="button">スタンプ帳を見る →</button>' +
      '</div>';
    wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector(".sa-view").addEventListener("click", () => { wrap.remove(); openBook(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("show"));
  }

  function check() {
    const s = stamps();
    let changed = false;
    levels().forEach((level, i) => {
      if (!s[level.id] && levelComplete(level)) {
        s[level.id] = new Date().toISOString();
        changed = true;
        save(s);
        setTimeout(() => pressStamp(level, i), 650);
      }
    });
    if (changed) { if (overlay) refreshBook(); updateEntry(); }
  }
  window.addEventListener("hanasou:finish", (e) => {
    if (!e.detail || e.detail.mode !== "lesson") return;
    setTimeout(check, 400);
  });

  // ---- entry card on the Progress hub --------------------------------------
  let entryCard = null;
  function updateEntry() {
    if (!entryCard) return;
    const small = entryCard.querySelector("small");
    if (small) small.textContent = Object.keys(stamps()).length + " / " + levels().length + " station stamps collected";
  }
  function mountCard() {
    const hub = document.getElementById("hub-progress");
    if (!hub) { setTimeout(mountCard, 600); return; }
    if (hub.querySelector(".sb-entry")) return;
    const got = Object.keys(stamps()).length;
    const total = levels().length;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "sb-entry";
    card.innerHTML = '<span class="sb-entry-book" aria-hidden="true"><i></i></span>' +
      '<span class="sb-entry-text"><b>スタンプ帳 · Stamp Book</b>' +
      '<small>' + got + ' / ' + total + ' station stamps collected</small></span><span class="sb-entry-go">→</span>';
    card.addEventListener("click", openBook);
    entryCard = card;
    const heading = hub.firstElementChild;   // the hub's section heading block
    if (heading && heading.nextSibling) hub.insertBefore(card, heading.nextSibling);
    else hub.appendChild(card);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountCard);
  else mountCard();

  window.HanasouStamps = { open: openBook, check, reset: () => { localStorage.removeItem(KEY); if (overlay) refreshBook(); } };
})();
