// はなそう theme mockup — display only. Tabs, the reactive Kōhai mascot
// (SRS answer swaps her sticker + speech bubble, the user's own mechanic),
// a filled stamp card, confetti, and a live inventory of assets/.
(() => {
  "use strict";

  const A = "../assets/";

  // Files the theme uses, for the inventory tab.
  const INVENTORY = [
    ["chibi_think.png", "Kōhai thinking — drill idle / recall"],
    ["chibi_thumbs.png", "Kōhai thumbs-up — home + “OK” grade"],
    ["chibi_cheer.png", "Kōhai cheering — “easy” grade + lesson clear"],
    ["chibi_cry.png", "Kōhai crying — “again” grade"],
    ["chibi_sheet.png", "All four poses on one sheet (source)"],
    ["sign.png", "Painted cat shop-sign — home header"],
    ["awning.png", "Striped shop awning — under the sign"],
    ["frame.png", "Gold star frame — drill vocab card"],
    ["stampcard.png", "Streak stamp card — home"],
    ["star_stamp.png", "Gold star stamp — streak / tier / tiles"],
    ["street_soft.jpg", "Blurred pink street — app background"],
    ["street_full.png", "Sharp street art (unused spare)"],
  ];

  // ---- Tabs ----
  const tabs = document.getElementById("mock-tabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (!btn) return;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll("[data-screen]").forEach((s) => (s.hidden = s.dataset.screen !== btn.dataset.tab));
  });

  // ---- Reactive Kōhai on the drill card ----
  const mascot = document.getElementById("drill-mascot");
  const bubble = document.getElementById("drill-bubble");
  document.querySelectorAll(".srs button").forEach((btn) =>
    btn.addEventListener("click", () => {
      const [jp, rj] = btn.dataset.say.split("|");
      mascot.src = A + "chibi_" + btn.dataset.mood + ".png";
      bubble.innerHTML = jp + '<span class="romaji">' + rj + "</span>";
      mascot.classList.remove("pop-anim");
      void mascot.offsetWidth;
      mascot.classList.add("pop-anim");
    })
  );

  // ---- Streak stamp card: 5 filled gold stars, 2 faded slots ----
  // Circle centers measured from the painted card art.
  const X = [15.4, 27, 38.4, 50, 61.5, 72.9, 84.5];
  const wrap = document.getElementById("stamp-wrap");
  X.forEach((x, i) => {
    const s = document.createElement("img");
    s.className = "st" + (i >= 5 ? " empty" : "");
    s.src = A + "star_stamp.png";
    s.alt = "";
    s.style.left = x + "%";
    wrap.appendChild(s);
  });

  // ---- Confetti (gold stars) on the celebrate screen ----
  const confetti = document.getElementById("confetti");
  for (let i = 0; i < 18; i++) {
    const img = document.createElement("img");
    img.src = A + "star_stamp.png";
    img.alt = "";
    img.style.left = Math.random() * 100 + "%";
    img.style.width = 16 + Math.random() * 18 + "px";
    img.style.animationDuration = 2.6 + Math.random() * 2.4 + "s";
    img.style.animationDelay = Math.random() * 2.8 + "s";
    confetti.appendChild(img);
  }

  // ---- Inventory tab: live-probe each file ----
  const list = document.getElementById("art-list");
  for (const [file, note] of INVENTORY) {
    const row = document.createElement("div");
    row.className = "art-row";
    row.innerHTML = `<img class="art-thumb" alt="" src="${A}${file}">
      <div class="art-info"><div class="art-file">assets/${file}</div><div class="art-note">${note}</div></div>
      <span class="art-status missing">checking…</span>`;
    list.appendChild(row);
    const probe = new Image();
    const s = row.querySelector(".art-status");
    probe.onload = () => { s.textContent = "✓ found"; s.className = "art-status found"; };
    probe.onerror = () => { s.textContent = "missing"; s.className = "art-status missing"; };
    probe.src = A + file + "?ts=" + Date.now();
  }
})();
