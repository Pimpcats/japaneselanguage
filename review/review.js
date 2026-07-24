(function () {
  "use strict";
  var DATA = window.REVIEW || { levels: [], counts: {}, version: "", builtAt: "" };
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
      LESSONS.push({ lv: lv, L: L, hay: hay.join(" ").toLowerCase() });
    });
  });
  var lessonById = {};
  LESSONS.forEach(function (o) { lessonById[o.L.id] = o.L; });

  var kL = function (id) { return "L:" + id; };
  var kS = function (id, i) { return "S:" + id + ":" + i; };
  var kV = function (id, i) { return "V:" + id + ":" + i; };
  function flagged(k) { return !!state.flags[k]; }
  function noted(k) { return !!state.notes[k]; }
  function marked(k) { return flagged(k) || noted(k); }

  // does a lesson have ANY mark (itself, a sentence, or a vocab word)?
  function lessonMarks(L) {
    if (marked(kL(L.id))) return true;
    for (var i = 0; i < L.sentences.length; i++) if (marked(kS(L.id, i))) return true;
    for (var j = 0; j < L.vocab.length; j++) if (marked(kV(L.id, j))) return true;
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
  var filterFlag = false, query = "";

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

  function bodyHTML(L) {
    var h = "";
    if (L.grammarNote) h += '<div class="gnote">' + esc(L.grammarNote) + '</div>';
    if (L.sentences.length) {
      h += '<div class="grp">Phrasing sentences · ' + L.sentences.length + '</div>';
      L.sentences.forEach(function (s, i) {
        var m = '<div class="i-en">' + esc(s.en) + '</div><div class="i-jp">' + esc(s.jp) + '</div>' +
          (s.romaji ? '<div class="i-ro">' + esc(s.romaji) + '</div>' : '');
        h += itemRow("i-sent", kS(L.id, i), m);
      });
    }
    if (L.vocab.length) {
      h += '<div class="grp">Vocabulary · ' + L.vocab.length + '</div>';
      L.vocab.forEach(function (v, i) {
        var m = '<span class="i-jp">' + esc(v.jp) + '</span><span class="i-en">' + esc(v.en) +
          (v.romaji ? ' · ' + esc(v.romaji) : '') + '</span>' + (v.pos ? '<span class="pos">' + esc(v.pos) + '</span>' : '');
        h += itemRow("i-vocab", kV(L.id, i), m);
      });
    }
    return h;
  }

  function lessonCard(o, idx) {
    var L = o.L, lk = kL(L.id), fl = flagged(lk), lnote = state.notes[lk] || "";
    var card = document.createElement("article");
    card.className = "lesson" + (lessonMarks(L) ? " flagged" : "");
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
        '<button class="lflag' + (fl ? " on" : "") + '" data-act="flag" data-key="' + lk + '" aria-label="flag card">⚑</button>' +
      '</div>' +
      '<div class="lbody"></div>';
    return card;
  }

  function render() {
    list.innerHTML = "";
    var shownLevels = 0, shownLessons = 0, frag = document.createDocumentFragment();
    DATA.levels.forEach(function (lv) {
      var head = null, count = 0;
      lv.lessons.forEach(function (L) {
        var o = { L: L, lv: lv };
        if (filterFlag && !lessonMarks(L)) return;
        if (query) {
          var hay = LESSONS.find(function (x) { return x.L.id === L.id; }).hay;
          if (hay.indexOf(query) === -1) return;
        }
        if (!head) { head = document.createElement("div"); head.className = "levhead"; head.textContent = (lv.name ? lv.name + " · " : "") + lv.title; frag.appendChild(head); shownLevels++; }
        var idx = LESSONS.findIndex(function (x) { return x.L.id === L.id; });
        var card = lessonCard({ L: L }, idx);
        // auto-open when actively filtering so matches are visible
        if (query || filterFlag) { card.classList.add("open"); card.querySelector(".lbody").innerHTML = bodyHTML(L); card.dataset.built = "1"; }
        frag.appendChild(card);
        count++; shownLessons++;
      });
    });
    if (!shownLessons) { list.innerHTML = '<p class="empty">' + (filterFlag ? "Nothing flagged yet — tap ⚑ on a card, sentence, or word." : "No matches.") + '</p>'; }
    else list.appendChild(frag);
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
    // update the row / card flagged styling
    var row = btn && btn.closest(".item"); if (row) row.classList.toggle("flagged", marked(key));
    var card = btn && btn.closest(".lesson"); if (card) card.classList.toggle("flagged", lessonMarks(lessonById[card.dataset.id]));
    refreshCount();
  }

  // ---------- note editor ----------
  var curKey = null;
  function labelFor(key) {
    var p = key.split(":");
    if (p[0] === "L") { var L = lessonById[p[1]]; return { title: "Card · " + (L ? L.title : p[1]), sent: L ? L.grammar : "" }; }
    if (p[0] === "S") { var L2 = lessonById[p[1]], s = L2 && L2.sentences[+p[2]]; return { title: "Sentence · " + (L2 ? L2.title : p[1]) + " #" + (+p[2] + 1), sent: s ? (s.en + "  →  " + s.jp) : "" }; }
    var L3 = lessonById[p[1]], v = L3 && L3.vocab[+p[2]]; return { title: "Word · " + (L3 ? L3.title : p[1]), sent: v ? (v.jp + "  " + v.en) : "" };
  }
  function openNote(key) {
    curKey = key;
    var lb = labelFor(key);
    $("nm-title").textContent = lb.title;
    $("nm-sent").textContent = lb.sent;
    $("nm-text").value = state.notes[key] || "";
    $("nm-flag").classList.toggle("on", flagged(key));
    openModal("noteModal");
    setTimeout(function () { $("nm-text").focus(); }, 60);
  }
  $("nm-flag").addEventListener("click", function () {
    if (curKey == null) return;
    if (state.flags[curKey]) delete state.flags[curKey]; else state.flags[curKey] = 1;
    this.classList.toggle("on", flagged(curKey));
  });
  $("nm-cancel").addEventListener("click", function () { closeModal("noteModal"); });
  $("nm-save").addEventListener("click", function () {
    if (curKey == null) return;
    var v = $("nm-text").value.trim();
    if (v) { state.notes[curKey] = v; if (!state.flags[curKey]) state.flags[curKey] = 1; }
    else delete state.notes[curKey];
    save(); closeModal("noteModal"); render();
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
  $("sub").textContent = (DATA.counts.lessons || 0) + " cards · " + (DATA.counts.sentences || 0) + " sentences · " + (DATA.counts.vocab || 0) + " words · built v" + (DATA.version || "?");
  render();
})();
