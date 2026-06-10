// はなそう art mockup — no app logic, no storage. Three jobs:
//  1. resolve every art slot: use ../assets/<file> when it exists, else a
//     built-in placeholder sketch (inline SVG) so the design still reads
//  2. render the art checklist from the same manifest
//  3. tiny demo interactivity (tabs, mascot reactions, confetti)
(() => {
  "use strict";

  // ---- The art manifest: one entry per file the artist needs to deliver ----
  const ASSETS = [
    { file: "mascot-hello.png", ph: "hello",
      note: "Mascot waving / welcoming — home hero banner. ~600×600, transparent PNG." },
    { file: "mascot-think.png", ph: "think",
      note: "Mascot thinking (hand on chin) — drill card while you recall. ~600×600, transparent PNG." },
    { file: "mascot-cheer.png", ph: "cheer",
      note: "Mascot celebrating, arms up — “got it” + lesson complete. ~600×600, transparent PNG." },
    { file: "mascot-oops.png", ph: "oops",
      note: "Mascot sheepish / encouraging (sweat drop) — “nope” grade. ~600×600, transparent PNG." },
    { file: "mascot-listen.png", ph: "listen",
      note: "Mascot listening (hand to ear / headphones) — hard-mode audio build. ~600×600, transparent PNG." },
    { file: "hero-bg.png", ph: "hero",
      note: "Wide soft landscape (torii, Fuji, sunrise…) behind the home banner. ~1200×480, PNG or JPG is fine." },
    { file: "tier-beginner.png", ph: "sprout",
      note: "Beginner tier emblem — e.g. a sprout. 256×256, transparent PNG." },
    { file: "tier-intermediate.png", ph: "fan",
      note: "Intermediate tier emblem — e.g. a folding fan. 256×256, transparent PNG." },
    { file: "tier-advanced.png", ph: "daruma",
      note: "Advanced tier emblem — e.g. a daruma. 256×256, transparent PNG." },
    { file: "tier-master.png", ph: "fuji",
      note: "Master tier emblem — e.g. Fuji + rising sun. 256×256, transparent PNG." },
  ];

  // ---- Placeholder sketches -------------------------------------------------
  // Simple hand-coded SVGs in the app palette so every slot shows *something*
  // with roughly the right silhouette until the real art lands.
  const chibi = (pose) => {
    const mouth = {
      hello: '<path d="M92 118 Q100 126 108 118" stroke="#7a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>',
      think: '<circle cx="100" cy="121" r="3.5" fill="#7a4a3a"/>',
      cheer: '<path d="M90 116 Q100 130 110 116 Z" fill="#7a4a3a"/>',
      oops:  '<path d="M92 122 Q100 117 108 122" stroke="#7a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>',
      listen:'<path d="M94 119 Q100 124 106 119" stroke="#7a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>',
    }[pose];
    const eyes = pose === "cheer"
      ? '<path d="M76 100 q6 -7 12 0 M112 100 q6 -7 12 0" stroke="#4a2e24" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : '<circle cx="82" cy="102" r="4.5" fill="#4a2e24"/><circle cx="118" cy="102" r="4.5" fill="#4a2e24"/>';
    const arms = {
      hello: '<path d="M66 150 Q48 140 44 118" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M134 150 Q150 158 158 168" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/>',
      think: '<path d="M134 150 Q126 132 112 126" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M66 150 Q56 160 54 172" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/>',
      cheer: '<path d="M66 148 Q46 130 42 112" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M134 148 Q154 130 158 112" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/>',
      oops:  '<path d="M66 150 Q58 162 58 174" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M134 150 Q142 162 142 174" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/>',
      listen:'<path d="M134 150 Q142 128 128 112" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M66 150 Q58 162 58 174" stroke="#e8a0b4" stroke-width="13" fill="none" stroke-linecap="round"/>',
    }[pose];
    const extra = {
      hello: '<g stroke="#e0a92e" stroke-width="3" stroke-linecap="round"><path d="M36 96 l-7 -7 M40 84 l-9 -3 M48 74 l-5 -9"/></g>',
      think: '<circle cx="146" cy="66" r="4" fill="#cbbd96"/><circle cx="158" cy="54" r="6" fill="#cbbd96"/><circle cx="172" cy="38" r="8" fill="#cbbd96"/>',
      cheer: '<g fill="#e0a92e"><rect x="30" y="40" width="7" height="10" rx="2" transform="rotate(20 33 45)"/><rect x="160" y="34" width="7" height="10" rx="2" transform="rotate(-25 163 39)"/><rect x="146" y="62" width="6" height="8" rx="2" fill="#c5453b" transform="rotate(40 149 66)"/><rect x="48" y="60" width="6" height="8" rx="2" fill="#3e8e41" transform="rotate(-35 51 64)"/></g>',
      oops:  '<path d="M134 78 q8 12 0 18 q-8 -6 0 -18" fill="#7ec3e8"/>',
      listen:'<path d="M58 82 a44 44 0 0 1 84 0" stroke="#5a4632" stroke-width="9" fill="none"/><rect x="48" y="80" width="16" height="26" rx="7" fill="#5a4632"/><rect x="136" y="80" width="16" height="26" rx="7" fill="#5a4632"/><text x="166" y="60" font-size="26" fill="#e0a92e">♪</text>',
    }[pose];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <ellipse cx="100" cy="186" rx="44" ry="8" fill="rgba(120,90,20,0.12)"/>
      <rect x="74" y="138" width="52" height="46" rx="16" fill="#fff" stroke="#d9c89a" stroke-width="3"/>
      <rect x="74" y="138" width="52" height="14" fill="#e0a92e" rx="7"/>
      ${arms}
      <circle cx="100" cy="96" r="46" fill="#e8a0b4"/>
      <circle cx="100" cy="104" r="36" fill="#ffe9dc"/>
      <path d="M62 92 q10 -28 38 -28 q28 0 38 28 q-12 -12 -38 -12 q-26 0 -38 12" fill="#e8a0b4"/>
      <circle cx="56" cy="104" r="10" fill="#e8a0b4"/><circle cx="144" cy="104" r="10" fill="#e8a0b4"/>
      ${eyes}
      <circle cx="74" cy="114" r="6" fill="#f7b2a0" opacity="0.7"/><circle cx="126" cy="114" r="6" fill="#f7b2a0" opacity="0.7"/>
      ${mouth}${extra}
    </svg>`;
  };

  const badge = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="88" fill="#fff6cc" stroke="#e0a92e" stroke-width="8"/>
    <circle cx="100" cy="100" r="72" fill="none" stroke="#f2c75a" stroke-width="3" stroke-dasharray="4 7"/>
    ${inner}
  </svg>`;

  const PLACEHOLDERS = {
    hello: chibi("hello"), think: chibi("think"), cheer: chibi("cheer"),
    oops: chibi("oops"), listen: chibi("listen"),
    hero: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fde8b8"/><stop offset="1" stop-color="#f6c98e"/>
      </linearGradient></defs>
      <rect width="600" height="240" fill="url(#sky)"/>
      <circle cx="470" cy="74" r="38" fill="#f29e5f" opacity="0.9"/>
      <path d="M170 200 L300 70 L430 200 Z" fill="#b9aed1"/>
      <path d="M268 102 L300 70 L332 102 Q300 118 268 102" fill="#fffdf4"/>
      <rect y="196" width="600" height="44" fill="#9ec79b"/>
      <g fill="#c5453b">
        <rect x="64" y="108" width="12" height="92"/><rect x="136" y="108" width="12" height="92"/>
        <rect x="46" y="96" width="120" height="13" rx="4"/><rect x="58" y="122" width="96" height="9"/>
      </g>
      <g fill="#fffdf4" opacity="0.85">
        <ellipse cx="150" cy="56" rx="36" ry="12"/><ellipse cx="190" cy="64" rx="26" ry="10"/>
        <ellipse cx="520" cy="130" rx="40" ry="11"/>
      </g>
    </svg>`,
    sprout: badge('<path d="M100 142 V96 M100 104 Q72 100 66 70 Q96 72 100 96 M100 92 Q128 88 134 58 Q104 60 100 84" stroke="#3e8e41" stroke-width="9" fill="none" stroke-linecap="round"/>'),
    fan: badge('<g stroke="#c5453b" stroke-width="5" fill="#fde8b8"><path d="M100 144 L58 76 A52 52 0 0 1 142 76 Z"/><path d="M100 144 L78 68 M100 144 L100 60 M100 144 L122 68" fill="none"/></g>'),
    daruma: badge('<circle cx="100" cy="104" r="42" fill="#c5453b"/><ellipse cx="100" cy="110" rx="26" ry="22" fill="#ffe9dc"/><circle cx="90" cy="106" r="4" fill="#3e3526"/><circle cx="110" cy="106" r="4" fill="#3e3526"/><path d="M92 122 Q100 127 108 122" stroke="#3e3526" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    fuji: badge('<circle cx="128" cy="74" r="16" fill="#e0584a"/><path d="M48 140 L100 72 L152 140 Z" fill="#8d80b5"/><path d="M86 90 L100 72 L114 90 Q100 100 86 90" fill="#fffdf4"/>'),
  };

  const svgURI = (svg) => "data:image/svg+xml;utf8," + encodeURIComponent(svg.replace(/\s+/g, " "));

  // ---- Resolve slots + build checklist --------------------------------------
  // Try the real asset first; fall back to the placeholder on 404. The
  // checklist rows reuse the same resolved URL so thumb and slot always match.
  const status = new Map(); // file -> Promise<{url, found}>
  const resolve = (spec) => {
    if (!status.has(spec.file)) {
      status.set(spec.file, new Promise((done) => {
        const probe = new Image();
        const url = "../assets/" + spec.file + "?ts=" + Date.now();
        probe.onload = () => done({ url, found: true });
        probe.onerror = () => done({ url: svgURI(PLACEHOLDERS[spec.ph]), found: false });
        probe.src = url;
      }));
    }
    return status.get(spec.file);
  };

  document.querySelectorAll("img.art").forEach((img) => {
    const spec = ASSETS.find((a) => a.file === img.dataset.asset);
    if (spec) resolve(spec).then(({ url }) => { img.src = url; });
  });

  const list = document.getElementById("art-list");
  for (const spec of ASSETS) {
    const row = document.createElement("div");
    row.className = "art-row";
    row.innerHTML = `<img class="art-thumb" alt="">
      <div class="art-info"><div class="art-file">assets/${spec.file}</div><div class="art-note">${spec.note}</div></div>
      <span class="art-status missing">placeholder</span>`;
    list.appendChild(row);
    resolve(spec).then(({ url, found }) => {
      row.querySelector(".art-thumb").src = url;
      const s = row.querySelector(".art-status");
      if (found) { s.textContent = "✓ found"; s.className = "art-status found"; }
    });
  }

  // ---- Demo interactivity ----------------------------------------------------
  const tabs = document.getElementById("mock-tabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (!btn) return;
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll("[data-screen]").forEach((s) => (s.hidden = s.dataset.screen !== btn.dataset.tab));
  });

  // grade buttons swap the drill mascot's pose
  const drillMascot = document.getElementById("drill-mascot");
  document.querySelectorAll("button.grade").forEach((b) =>
    b.addEventListener("click", () => {
      const spec = ASSETS.find((a) => a.file === b.dataset.react);
      resolve(spec).then(({ url }) => {
        drillMascot.src = url;
        drillMascot.classList.remove("pop");
        void drillMascot.offsetWidth;
        drillMascot.classList.add("pop");
      });
    })
  );

  // confetti for the celebrate screen
  const confetti = document.querySelector(".confetti");
  const colors = ["#e0a92e", "#f2c75a", "#c5453b", "#3e8e41", "#7ec3e8", "#e8a0b4"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 2.4 + Math.random() * 2.2 + "s";
    p.style.animationDelay = Math.random() * 2.5 + "s";
    confetti.appendChild(p);
  }
})();
