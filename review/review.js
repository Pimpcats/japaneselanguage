(function () {
  "use strict";
  var DATA = window.REVIEW || { levels: [], counts: {}, version: "", builtAt: "" };
  var PANELS = window.REVIEW_PANELS || [];
  var panelsByLesson = {};
  PANELS.forEach(function (p) { (panelsByLesson[p.lessonId] = panelsByLesson[p.lessonId] || []).push(p); });
  var KEY = "hanasou.review.content.v1";
  var state = { flags: {}, notes: {} };
  try { var s = JSON.parse(localStorage.getItem(KEY)); if (s) { state.flags = s.flags || {}; state.notes = s.notes || {}; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var esc = function (t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var $ = function (id) { return document.getElementById(id); };
  var list = $("list");

  // flatten a per-lesson index for lookups + search
  var LESSONS = [];   // {lv, L, hay}
  DATA.levels.forEach(function (lv) {
    lv.lessons.forEach(function (L) {
      var hay = [L.id, L.title, L.section, L.grammar, L.grammarNote];
      L.sentences.forEach(function (s) { hay.push(s.en, s.jp, s.romaji, s.hint); });
      L.vocab.forEach(function (v) { hay.push(v.jp, v.romaji, v.en); });
      (panelsByLesson[L.id] || []).forEach(function (p) { hay.push(p.en, "image", "illustration"); });
      LESSONS.push({ lv: lv, L: L, hay: hay.join(" ").toLowerCase() });
    });
  });
  var lessonById = {};
  LESSONS.forEach(function (o) { lessonById[o.L.id] = o.L; });

  var kL = function (id) { return "L:" + id; };
  var kS = function (id, i) { return "S:" + id + ":" + i; };
  var kV = function (id, i) { return "V:" + id + ":" + i; };
  var kP = function (i) { return "P:" + i; };
  function flagged(k) { return !!state.flags[k]; }
  function noted(k) { return !!state.notes[k]; }
  function marked(k) { return flagged(k) || noted(k); }

  // does a lesson have ANY mark (itself, a sentence, or a vocab word)?
  function lessonMarks(L) {
    if (marked(kL(L.id))) return true;
    for (var i = 0; i < L.sentences.length; i++) if (marked(kS(L.id, i))) return true;
    for (var j = 0; j < L.vocab.length; j++) if (marked(kV(L.id, j))) return true;
    var ps = panelsByLesson[L.id] || [];
    for (var q = 0; q < ps.length; q++) if (marked(kP(ps[q].i))) return true;
    return false;
  }
  function totalMarked() {
    var n = 0, seen = {};
    Object.keys(state.flags).forEach(function (k) { seen[k] = 1; });
    Object.keys(state.notes).forEach(function (k) { seen[k] = 1; });
    for (var k in seen) n++;
    return n;
  }

  // ---------- rendering ----------
  var filterFlag = false, query = "", typeFilter = "all";

  function itemRow(kind, key, mainHTML) {
    var fl = flagged(key), nt = state.notes[key] || "";
    return '<div class="item ' + kind + (marked(key) ? " flagged" : "") + '" data-key="' + key + '">' +
      '<div class="itext">' + mainHTML + '</div>' +
      '<div class="iact">' +
        '<button class="ibtn flag' + (fl ? " on" : "") + '" data-act="flag" data-key="' + key + '" aria-label="flag">⚑</button>' +
        '<button class="ibtn note' + (nt ? " has" : "") + '" data-act="note" data-key="' + key + '" aria-label="note">✏</button>' +
      '</div>' +
      (nt ? '<div class="notepv">' + esc(nt) + '</div>' : '') +
    '</div>';
  }

  // Build a lesson's body honoring the active content-type filter (all / pics /
  // sentences / words) and, when "Flagged" is on, only the flagged items.
  function bodyHTML(L) {
    var h = "", onlyFlag = filterFlag;
    var showP = typeFilter === "all" || typeFilter === "panels";
    var showS = typeFilter === "all" || typeFilter === "sentences";
    var showV = typeFilter === "all" || typeFilter === "vocab";
    if (showP) {
      var pics = (panelsByLesson[L.id] || []).filter(function (p) { return !onlyFlag || marked(kP(p.i)); });
      if (pics.length) {
        h += '<div class="grp">Illustrations · ' + pics.length + '</div>';
        pics.forEach(function (p) {
          var m = '<div class="pimg"><img loading="lazy" alt="' + esc(p.en) + '" src="data:image/png;base64,' + p.img + '"></div>' +
            '<div class="i-en">' + esc(p.en) + '</div>';
          h += itemRow("i-panel", kP(p.i), m);
        });
      }
    }
    if (showS) {
      if (typeFilter === "all" && !onlyFlag && L.grammarNote) h += '<div class="gnote">' + esc(L.grammarNote) + '</div>';
      var sents = L.sentences.map(function (s, i) { return { s: s, i: i }; }).filter(function (o) { return !onlyFlag || marked(kS(L.id, o.i)); });
      if (sents.length) {
        h += '<div class="grp">Phrasing sentences · ' + sents.length + '</div>';
        sents.forEach(function (o) {
          var s = o.s;
          var m = '<div class="i-en">' + esc(s.en) + '</div><div class="i-jp">' + esc(s.jp) + '</div>' +
            (s.romaji ? '<div class="i-ro">' + esc(s.romaji) + '</div>' : '');
          h += itemRow("i-sent", kS(L.id, o.i), m);
        });
      }
    }
    if (showV) {
      var vocab = L.vocab.map(function (v, i) { return { v: v, i: i }; }).filter(function (o) { return !onlyFlag || marked(kV(L.id, o.i)); });
      if (vocab.length) {
        h += '<div class="grp">Vocabulary · ' + vocab.length + '</div>';
        vocab.forEach(function (o) {
          var v = o.v;
          var m = '<span class="i-jp">' + esc(v.jp) + '</span><span class="i-en">' + esc(v.en) +
            (v.romaji ? ' · ' + esc(v.romaji) : '') + '</span>' + (v.pos ? '<span class="pos">' + esc(v.pos) + '</span>' : '');
          h += itemRow("i-vocab", kV(L.id, o.i), m);
        });
      }
    }
    return h;
  }

  function lessonCard(o, idx) {
    var L = o.L, lk = kL(L.id), fl = flagged(lk), lnote = state.notes[lk] || "", cc = lessonChildCount(L);
    var card = document.createElement("article");
    card.className = "lesson" + (fl ? " flagged" : "");   // full red = the CARD itself is flagged
    card.dataset.id = L.id;
    card.dataset.idx = idx;
    var sub = esc(L.section) + " · " + L.sentences.length + " sentences · " + L.vocab.length + " words";
    card.innerHTML =
      '<div class="lhead" data-toggle>' +
        '<span class="caret">▸</span>' +
        '<div class="lmeta">' +
          '<div class="ltitle">' + esc(L.title) + '</div>' +
          '<div class="lsub">' + sub + '</div>' +
          (L.grammar ? '<div class="lgrammar">' + esc(L.grammar) + '</div>' : '') +
          (lnote ? '<div class="lnotepv">card note: ' + esc(lnote) + '</div>' : '') +
        '</div>' +
        '<span class="lcount"' + (cc ? '' : ' hidden') + '>⚑ ' + cc + '</span>' +
        '<button class="lflag' + (fl ? " on" : "") + '" data-act="flag" data-key="' + lk + '" aria-label="flag whole card">⚑</button>' +
      '</div>' +
      '<div class="lbody"></div>';
    return card;
  }
  // how many items inside a lesson are flagged/noted (drives the header badge)
  function lessonChildCount(L) {
    var n = 0, i;
    for (i = 0; i < L.sentences.length; i++) if (marked(kS(L.id, i))) n++;
    for (i = 0; i < L.vocab.length; i++) if (marked(kV(L.id, i))) n++;
    var ps = panelsByLesson[L.id] || [];
    for (i = 0; i < ps.length; i++) if (marked(kP(ps[i].i))) n++;
    return n;
  }
  // refresh a lesson card's own-flag red + its flagged-items badge, in place
  function updateLessonMark(card) {
    var L = lessonById[card.dataset.id];
    if (!L) return;
    card.classList.toggle("flagged", flagged(kL(L.id)));
    var badge = card.querySelector(".lcount"), n = lessonChildCount(L);
    if (badge) { badge.textContent = "⚑ " + n; badge.hidden = n === 0; }
  }
  // update ONE item row (and its lesson badge) without rebuilding the list —
  // rebuilding collapsed open lessons and threw off scroll after saving a note
  function applyItemDom(key) {
    var row = list.querySelector('.item[data-key="' + key + '"]');
    if (row) {
      row.classList.toggle("flagged", marked(key));
      var fb = row.querySelector(".ibtn.flag"); if (fb) fb.classList.toggle("on", flagged(key));
      var nb = row.querySelector(".ibtn.note"); if (nb) nb.classList.toggle("has", noted(key));
      var pv = row.querySelector(".notepv"), nt = state.notes[key] || "";
      if (nt) { if (!pv) { pv = document.createElement("div"); pv.className = "notepv"; row.appendChild(pv); } pv.textContent = nt; }
      else if (pv) { pv.parentNode.removeChild(pv); }
      var card = row.closest(".lesson"); if (card) updateLessonMark(card);
    }
    refreshCount();
  }

  function render() {
    list.innerHTML = "";
    // any filter narrows the view → auto-open cards so the matching items show
    var active = typeFilter !== "all" || filterFlag || !!query;
    var shownLessons = 0, frag = document.createDocumentFragment();
    DATA.levels.forEach(function (lv) {
      var head = null;
      lv.lessons.forEach(function (L) {
        if (query) {
          var hay = LESSONS.find(function (x) { return x.L.id === L.id; }).hay;
          if (hay.indexOf(query) === -1) return;
        }
        var body = active ? bodyHTML(L) : "";
        // in a narrowed view, keep only lessons that actually have matching items
        // (a card flagged only at card-level still shows in the Flagged view)
        if (active && !body && !(filterFlag && marked(kL(L.id)))) return;
        if (!head) { head = document.createElement("div"); head.className = "levhead"; head.textContent = (lv.name ? lv.name + " · " : "") + lv.title; frag.appendChild(head); }
        var idx = LESSONS.findIndex(function (x) { return x.L.id === L.id; });
        var card = lessonCard({ L: L }, idx);
        if (active && body) { card.classList.add("open"); card.querySelector(".lbody").innerHTML = body; card.dataset.built = "1"; }
        frag.appendChild(card);
        shownLessons++;
      });
    });
    if (!shownLessons) {
      var msg = query ? "No matches." : filterFlag ? "Nothing flagged yet — tap ⚑ on a card, sentence, image, or word."
        : typeFilter === "panels" ? "No illustrations match." : "No matches.";
      list.innerHTML = '<p class="empty">' + msg + '</p>';
    } else list.appendChild(frag);
    refreshCount();
  }

  function refreshCount() {
    var n = totalMarked();
    $("cnt").innerHTML = n ? ("<b>" + n + "</b> item" + (n === 1 ? "" : "s") + " flagged") : "Nothing flagged yet";
    $("sync").disabled = n === 0;
  }

  // ---------- interactions ----------
  list.addEventListener("click", function (e) {
    var act = e.target.closest("[data-act]");
    if (act) {
      e.stopPropagation();
      var key = act.getAttribute("data-key");
      if (act.getAttribute("data-act") === "flag") toggleFlag(key, act);
      else openNote(key);
      return;
    }
    var tog = e.target.closest("[data-toggle]");
    if (tog) {
      var card = tog.closest(".lesson");
      if (!card.dataset.built) { card.querySelector(".lbody").innerHTML = bodyHTML(lessonById[card.dataset.id]); card.dataset.built = "1"; }
      card.classList.toggle("open");
    }
  });

  function toggleFlag(key, btn) {
    if (state.flags[key]) delete state.flags[key]; else state.flags[key] = 1;
    save();
    if (btn) btn.classList.toggle("on", !!state.flags[key]);
    var row = btn && btn.closest(".item"); if (row) row.classList.toggle("flagged", marked(key));
    var card = btn && btn.closest(".lesson"); if (card) updateLessonMark(card);
    refreshCount();
  }

  // ---------- note editor ----------
  var curKey = null, pendingFlag = false;
  function labelFor(key) {
    var p = key.split(":");
    if (p[0] === "L") { var L = lessonById[p[1]]; return { title: "Card · " + (L ? L.title : p[1]), sent: L ? L.grammar : "" }; }
    if (p[0] === "S") { var L2 = lessonById[p[1]], s = L2 && L2.sentences[+p[2]]; return { title: "Sentence · " + (L2 ? L2.title : p[1]) + " #" + (+p[2] + 1), sent: s ? (s.en + "  →  " + s.jp) : "" }; }
    if (p[0] === "P") { var pan = null; for (var z = 0; z < PANELS.length; z++) if (PANELS[z].i === +p[1]) { pan = PANELS[z]; break; } return { title: "Illustration #" + p[1], sent: pan ? pan.en : "", img: pan ? pan.img : "" }; }
    var L3 = lessonById[p[1]], v = L3 && L3.vocab[+p[2]]; return { title: "Word · " + (L3 ? L3.title : p[1]), sent: v ? (v.jp + "  " + v.en) : "" };
  }
  function openNote(key) {
    curKey = key;
    var lb = labelFor(key);
    $("nm-title").textContent = lb.title;
    $("nm-sent").textContent = lb.sent;
    $("nm-img").innerHTML = lb.img ? '<img src="data:image/png;base64,' + lb.img + '" alt="">' : "";
    $("nm-text").value = state.notes[key] || "";
    pendingFlag = flagged(key);
    $("nm-flag").classList.toggle("on", pendingFlag);
    openModal("noteModal");
    setTimeout(function () { $("nm-text").focus(); }, 60);
  }
  // stage the flag change; commit only on Save (Cancel discards it)
  $("nm-flag").addEventListener("click", function () {
    if (curKey == null) return;
    pendingFlag = !pendingFlag;
    this.classList.toggle("on", pendingFlag);
  });
  $("nm-cancel").addEventListener("click", function () { closeModal("noteModal"); });
  $("nm-save").addEventListener("click", function () {
    if (curKey == null) return;
    var v = $("nm-text").value.trim(), key = curKey;
    if (v) state.notes[key] = v; else delete state.notes[key];
    // a written note implies a flag; otherwise honor the staged flag toggle
    if (v || pendingFlag) state.flags[key] = 1; else delete state.flags[key];
    save(); closeModal("noteModal"); applyItemDom(key);   // in-place — no rebuild, no scroll jump
  });

  // ---------- sync ----------
  function buildPayload() {
    var lines = ["はなそう content review — built v" + (DATA.version || "?") + " · synced " + new Date().toISOString().slice(0, 10)];
    lines.push("(" + totalMarked() + " items flagged — apply to main)");
    lines.push("========================================");
    DATA.levels.forEach(function (lv) {
      lv.lessons.forEach(function (L) {
        if (!lessonMarks(L)) return;
        var lk = kL(L.id), head = "CARD [" + L.id + "] " + L.title + (flagged(lk) ? "  ⚑" : "");
        var block = [head];
        if (state.notes[lk]) block.push("   note: " + state.notes[lk]);
        L.sentences.forEach(function (s, i) {
          var k = kS(L.id, i);
          if (!marked(k)) return;
          block.push("   " + (flagged(k) ? "⚑ " : "") + "SENTENCE #" + (i + 1) + ": \"" + s.en + "\" | " + s.jp);
          if (state.notes[k]) block.push("      note: " + state.notes[k]);
        });
        L.vocab.forEach(function (v, i) {
          var k = kV(L.id, i);
          if (!marked(k)) return;
          block.push("   " + (flagged(k) ? "⚑ " : "") + "WORD: " + v.jp + " (" + v.en + ")");
          if (state.notes[k]) block.push("      note: " + state.notes[k]);
        });
        (panelsByLesson[L.id] || []).forEach(function (p) {
          var k = kP(p.i);
          if (!marked(k)) return;
          block.push("   " + (flagged(k) ? "⚑ " : "") + "IMAGE panel #" + p.i + ": \"" + p.en + "\"");
          if (state.notes[k]) block.push("      note: " + state.notes[k]);
        });
        lines.push(block.join("\n"));
      });
    });
    return lines.join("\n");
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function () { legacyCopy(); });
    else legacyCopy();
  }
  function legacyCopy() { var t = $("sy-text"); t.focus(); t.select(); try { document.execCommand("copy"); } catch (e) {} }
  $("sync").addEventListener("click", function () {
    if (totalMarked() === 0) { toast("Flag something first"); return; }
    var txt = buildPayload();
    $("sy-text").value = txt;
    openModal("syncModal");
    copyText(txt); toast("Copied — paste to Claude");
  });
  $("sy-copy").addEventListener("click", function () { copyText($("sy-text").value); toast("Copied"); });
  $("sy-share").addEventListener("click", function () {
    var txt = $("sy-text").value;
    if (navigator.share) navigator.share({ title: "はなそう review", text: txt }).catch(function () {});
    else { copyText(txt); toast("Copied — paste to Claude"); }
  });
  $("sy-close").addEventListener("click", function () { closeModal("syncModal"); });
  // clear-after-sync
  var clr = $("sy-clear");
  clr.innerHTML = 'Done? <a href="#" id="sy-clearlink" class="focusable">Clear all my notes</a> to start a fresh round.';
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "sy-clearlink") {
      e.preventDefault();
      if (confirm("Clear every flag and note on this device? Do this only after you've pasted them to Claude.")) {
        state.flags = {}; state.notes = {}; save(); closeModal("syncModal"); render(); toast("Cleared");
      }
    }
  });

  // ---------- filters ----------
  // content-type chips (All / Pictures / Sentences / Words) — mutually exclusive
  var typeChips = [].slice.call(document.querySelectorAll("[data-type]"));
  typeChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      typeFilter = chip.getAttribute("data-type");
      typeChips.forEach(function (c) { c.classList.toggle("on", c === chip); });
      render();
    });
  });
  $("f-flag").addEventListener("click", function () {
    filterFlag = !filterFlag;
    this.classList.toggle("on", filterFlag);
    this.setAttribute("aria-pressed", filterFlag ? "true" : "false");
    render();
  });
  var searchTO;
  $("search").addEventListener("input", function () {
    var v = this.value.trim().toLowerCase();
    clearTimeout(searchTO);
    searchTO = setTimeout(function () { query = v; render(); }, 140);
  });

  // ---------- modal plumbing ----------
  function openModal(id) { $(id).classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeModal(id) { $(id).classList.remove("open"); document.body.style.overflow = ""; }
  ["noteModal", "syncModal"].forEach(function (id) {
    $(id).addEventListener("click", function (e) { if (e.target === this) closeModal(id); });
  });
  var toEl = $("toast"), toT;
  function toast(m) { toEl.textContent = m; toEl.classList.add("show"); clearTimeout(toT); toT = setTimeout(function () { toEl.classList.remove("show"); }, 1800); }

  // ---------- boot ----------
  $("sub").textContent = (DATA.counts.lessons || 0) + " cards · " + (DATA.counts.sentences || 0) + " sentences · " + (DATA.counts.vocab || 0) + " words · " + PANELS.length + " images · built v" + (DATA.version || "?");
  render();
})();
