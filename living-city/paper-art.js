// Paper-cut art for the pop-up book, drawn in code (Paper Mario style): flat
// colour, a 3px ink outline (class "o", 2px "o2", open lines "ln"), and a
// white die-cut edge + shadow added in CSS. Nothing here is AI-generated, so
// every piece matches and any new object is a few shapes away.
//
// objects[key] = [viewBox, markup, size]  size: "big" | "mid" | "small"
//   keys are the names data.js → art maps English glosses to.
// Elements with an a-* class animate (see styles.css "ambient life").
(function () {
  "use strict";
  const O = {};
  const add = (key, vb, size, body) => { O[key] = [vb, body, size]; };

  // ---- food & drink -------------------------------------------------------------
  add("coffee", "0 0 120 110", "mid", `
    <g class="a-steam"><path d="M46 26 Q38 14 46 2 Q54 12 50 24 Z" fill="#fff" class="o2"/><path d="M70 24 Q62 10 72 0 Q78 10 74 22 Z" fill="#fff" class="o2"/></g>
    <ellipse cx="58" cy="94" rx="50" ry="11" fill="#fff" class="o"/>
    <path d="M20 38 L96 38 L88 84 Q58 94 28 84 Z" fill="#fff" class="o"/>
    <ellipse cx="58" cy="38" rx="38" ry="8" fill="#7a4524" class="o2"/>
    <path d="M94 46 Q116 46 110 64 Q104 74 90 72" fill="none" class="o"/>
    <path d="M34 50 L38 72" stroke="#e5483b" stroke-width="6" stroke-linecap="round"/>`);
  add("greentea", "0 0 110 110", "mid", `
    <g class="a-steam"><path d="M44 28 Q36 16 44 4 Q52 14 48 26 Z" fill="#fff" class="o2"/><path d="M64 26 Q56 12 66 2 Q72 12 68 24 Z" fill="#fff" class="o2"/></g>
    <path d="M18 36 L92 36 L86 96 Q55 104 24 96 Z" fill="#7fbf6a" class="o"/>
    <ellipse cx="55" cy="36" rx="37" ry="7" fill="#c8e6a0" class="o2"/>
    <path d="M24 58 L88 58" stroke="#5a9a4c" stroke-width="4"/><path d="M26 74 L86 74" stroke="#5a9a4c" stroke-width="4"/>`);
  add("cup", "0 0 100 110", "mid", `
    <path d="M14 22 L86 22 L80 100 Q50 108 20 100 Z" fill="#7fc4ff" class="o"/>
    <ellipse cx="50" cy="22" rx="36" ry="7" fill="#d8f0ff" class="o2"/>
    <path d="M26 36 L30 86" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`);
  add("water", "0 0 90 120", "mid", `
    <path d="M10 10 L80 10 L72 112 L18 112 Z" fill="#e8f7ff" class="o"/>
    <path d="M14 44 L76 44 L72 108 L18 108 Z" fill="#7fc4ff"/>
    <path d="M10 10 L80 10 L72 112 L18 112 Z" fill="none" class="o"/>
    <rect x="30" y="34" width="22" height="20" rx="4" fill="#fff" class="o2" transform="rotate(-12 41 44)"/>
    <path d="M22 60 L26 96" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`);
  add("gohan", "0 0 130 110", "mid", `
    <g class="a-steam"><path d="M54 20 Q46 10 54 0 Q62 8 58 18 Z" fill="#fff" class="o2"/><path d="M74 20 Q66 10 76 0 Q82 8 78 18 Z" fill="#fff" class="o2"/></g>
    <path d="M24 46 Q30 18 65 18 Q100 18 106 46 Z" fill="#fff" class="o"/>
    <circle cx="48" cy="34" r="2" fill="#2a2320"/><circle cx="66" cy="28" r="2" fill="#2a2320"/><circle cx="82" cy="36" r="2" fill="#2a2320"/>
    <path d="M14 46 L116 46 Q112 92 65 96 Q18 92 14 46 Z" fill="#e5483b" class="o"/>
    <path d="M30 60 Q65 70 100 60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <rect x="46" y="96" width="38" height="10" rx="3" fill="#b8362b" class="o2"/>
    <path d="M86 8 L122 44 M94 4 L126 38" class="ln"/>`);
  add("sushi", "0 0 150 100", "mid", `
    <rect x="6" y="70" width="138" height="16" rx="4" fill="#c98a4b" class="o"/>
    <rect x="22" y="86" width="12" height="10" fill="#a96a2c" class="o2"/><rect x="116" y="86" width="12" height="10" fill="#a96a2c" class="o2"/>
    <rect x="18" y="44" width="52" height="28" rx="12" fill="#fff" class="o"/>
    <path d="M14 46 Q44 22 74 44 Q72 54 44 52 Q16 54 14 46 Z" fill="#ff8a5c" class="o"/>
    <path d="M30 38 L36 48 M44 34 L48 46 M58 36 L60 46" stroke="#ffd2bf" stroke-width="3" stroke-linecap="round"/>
    <rect x="80" y="44" width="52" height="28" rx="12" fill="#fff" class="o"/>
    <path d="M76 46 Q106 22 136 44 Q134 54 106 52 Q78 54 76 46 Z" fill="#e5483b" class="o"/>`);
  add("cake", "0 0 120 110", "mid", `
    <ellipse cx="60" cy="96" rx="54" ry="10" fill="#fff" class="o"/>
    <path d="M14 56 L94 30 L106 50 L106 90 L14 90 Z" fill="#ffe2a8" class="o"/>
    <path d="M14 56 L106 50 L106 62 L14 68 Z" fill="#fff" class="o2"/>
    <path d="M14 74 L106 70" stroke="#e5483b" stroke-width="5"/>
    <path d="M14 56 L94 30 L106 50 Z" fill="#fff" class="o"/>
    <path d="M70 26 Q74 10 86 16 Q96 22 84 32 Q74 36 70 26 Z" fill="#e5483b" class="o2"/>
    <path d="M80 14 L84 6" class="ln"/>`);
  add("wagashi", "0 0 70 130", "small", `
    <path d="M35 4 L35 126" stroke="#c98a4b" stroke-width="5" stroke-linecap="round"/>
    <path d="M35 4 L35 126" fill="none" class="o2" opacity=".5"/>
    <circle cx="35" cy="28" r="20" fill="#ff9fb5" class="o"/>
    <circle cx="35" cy="64" r="20" fill="#fff" class="o"/>
    <circle cx="35" cy="100" r="20" fill="#9fd67a" class="o"/>`);
  add("meat", "0 0 140 100", "mid", `
    <path d="M10 60 Q10 18 60 16 Q104 14 108 50 Q110 84 62 88 Q14 92 10 60 Z" fill="#c9553d" class="o"/>
    <path d="M30 56 Q36 36 58 34" fill="none" stroke="#e98a6a" stroke-width="6" stroke-linecap="round"/>
    <rect x="98" y="40" width="30" height="14" fill="#fff4dc" class="o2"/>
    <circle cx="128" cy="40" r="9" fill="#fff4dc" class="o2"/><circle cx="128" cy="56" r="9" fill="#fff4dc" class="o2"/>`);
  add("breakfast", "0 0 140 100", "mid", `
    <ellipse cx="70" cy="70" rx="64" ry="22" fill="#fff" class="o"/>
    <path d="M14 56 L14 30 Q14 12 34 14 Q54 12 54 30 L54 70 L14 70 Z" fill="#f2c98a" class="o"/>
    <path d="M20 58 L20 32 Q22 22 34 22 Q48 22 48 32 L48 64" fill="#fff4dc" class="o2"/>
    <path d="M68 66 Q66 46 90 46 Q118 44 118 64 Q118 80 92 80 Q68 82 68 66 Z" fill="#fff" class="o"/>
    <circle cx="92" cy="63" r="11" fill="#ffc93c" class="o2"/>`);
  add("bread", "0 0 120 110", "mid", `
    <path d="M14 104 L14 48 Q8 20 34 16 Q50 6 62 18 Q76 6 92 16 Q116 20 106 48 L106 104 Z" fill="#e2a35f" class="o"/>
    <path d="M24 98 L24 52 Q20 30 40 28 Q54 22 62 32 Q72 22 86 28 Q102 32 96 52 L96 98 Z" fill="#fff4dc" class="o2"/>`);
  add("vegetables", "0 0 130 120", "mid", `
    <path d="M30 40 Q30 10 46 30 Q50 6 60 32 L70 40 Z" fill="#3fae5b" class="o2"/>
    <path d="M22 40 L78 40 L52 116 Z" fill="#ff8a3c" class="o"/>
    <path d="M38 58 L50 58 M44 76 L56 76 M48 94 L56 94" class="ln"/>
    <circle cx="96" cy="78" r="30" fill="#9fd67a" class="o"/>
    <path d="M96 52 Q84 78 96 106 M96 52 Q110 78 96 106" fill="none" class="o2"/>`);
  add("beer", "0 0 120 120", "mid", `
    <path d="M18 34 L84 34 L84 112 L18 112 Z" fill="#ffc93c" class="o"/>
    <path d="M84 50 Q110 50 110 72 Q110 94 84 94" fill="none" stroke="#2a2320" stroke-width="12"/>
    <path d="M84 50 Q110 50 110 72 Q110 94 84 94" fill="none" stroke="#fff" stroke-width="6"/>
    <path d="M12 38 Q10 16 30 18 Q38 4 54 12 Q70 2 80 16 Q96 14 92 38 Z" fill="#fff" class="o"/>
    <path d="M32 54 L32 100 M50 54 L50 100 M68 54 L68 100" stroke="#e8a920" stroke-width="5" stroke-linecap="round"/>`);
  add("sake", "0 0 120 120", "mid", `
    <path d="M30 4 L50 4 L50 20 Q70 34 70 70 Q70 110 40 112 Q10 110 10 70 Q10 34 30 20 Z" fill="#fff" class="o"/>
    <path d="M14 62 L66 62" stroke="#2f4a8a" stroke-width="8"/>
    <path d="M10 70 Q10 34 30 20 L30 4 L50 4 L50 20 Q70 34 70 70 Q70 110 40 112 Q10 110 10 70 Z" fill="none" class="o"/>
    <path d="M80 84 L114 84 L108 112 L86 112 Z" fill="#fff" class="o"/>
    <ellipse cx="97" cy="84" rx="17" ry="4" fill="#d8f0ff" class="o2"/>`);
  add("peach", "0 0 110 110", "small", `
    <path d="M55 22 Q96 14 100 58 Q102 100 55 104 Q8 100 10 58 Q14 14 55 22 Z" fill="#ffaa9a" class="o"/>
    <path d="M55 24 Q46 60 58 102" fill="none" class="o2"/>
    <path d="M56 22 Q66 4 86 10 Q76 26 56 22 Z" fill="#3fae5b" class="o2"/>
    <ellipse cx="34" cy="54" rx="8" ry="12" fill="#fff" opacity=".6"/>`);

  // ---- buildings & places -------------------------------------------------------
  add("station", "0 0 170 130", "big", `
    <path d="M6 48 L85 8 L164 48 Z" fill="#4a5a7a" class="o"/>
    <rect x="18" y="48" width="134" height="80" fill="#fff4dc" class="o"/>
    <circle cx="85" cy="32" r="11" fill="#fff" class="o2"/>
    <g class="a-clock"><path d="M85 32 L85 24" class="ln"/></g><path d="M85 32 L91 32" class="ln"/>
    <rect x="44" y="54" width="82" height="22" rx="4" fill="#fff" class="o2"/>
    <rect x="44" y="70" width="82" height="6" fill="#3fae5b"/>
    <text x="85" y="68" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="14" fill="#2a2320">えき</text>
    <rect x="66" y="88" width="38" height="40" fill="#7fc4ff" class="o2"/>
    <rect x="26" y="88" width="28" height="24" fill="#7fc4ff" class="o2"/><rect x="116" y="88" width="28" height="24" fill="#7fc4ff" class="o2"/>`);
  add("house", "0 0 140 130", "big", `
    <path d="M6 60 L70 8 L134 60 Z" fill="#e5483b" class="o"/>
    <rect x="96" y="20" width="16" height="30" fill="#c9553d" class="o2"/>
    <rect x="20" y="58" width="100" height="70" fill="#fff4dc" class="o"/>
    <rect x="58" y="86" width="26" height="42" fill="#8a5a2b" class="o2"/><circle cx="78" cy="108" r="2.5" fill="#ffc93c"/>
    <rect x="30" y="72" width="22" height="22" fill="#7fc4ff" class="o2"/><path d="M41 72 L41 94 M30 83 L52 83" class="ln"/>
    <rect x="92" y="72" width="22" height="22" fill="#7fc4ff" class="o2"/><path d="M103 72 L103 94 M92 83 L114 83" class="ln"/>`);
  add("office", "0 0 100 150", "big", `
    <rect x="10" y="6" width="80" height="142" fill="#9fb4d8" class="o"/>
    ${[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 22}" y="${16 + r * 24}" width="16" height="16" fill="#e8f7ff" class="o2"/>`).join("")).join("")}
    <rect x="38" y="128" width="24" height="20" fill="#2f4a8a" class="o2"/>`);
  add("school", "0 0 110 130", "mid", `
    <path d="M14 30 Q14 10 34 10 L76 10 Q96 10 96 30 L96 118 Q96 126 88 126 L22 126 Q14 126 14 118 Z" fill="#e5483b" class="o"/>
    <path d="M14 34 Q55 50 96 34 L96 64 Q55 80 14 64 Z" fill="#c9372c" class="o"/>
    <rect x="48" y="58" width="14" height="16" rx="3" fill="#ffc93c" class="o2"/>
    <path d="M30 10 Q30 -6 55 -2 Q80 -6 80 10" fill="none" class="o"/>
    <path d="M14 90 L4 120 M96 90 L106 120" class="ln"/>`);
  add("cinema", "0 0 130 120", "mid", `
    <rect x="12" y="46" width="106" height="68" rx="4" fill="#2a2320" class="o"/>
    <g class="a-clap"><path d="M10 22 L114 6 L118 30 L14 46 Z" fill="#fff" class="o"/>
    <path d="M30 19 L22 43 M54 15 L46 39 M78 11 L70 35 M102 8 L94 31" stroke="#2a2320" stroke-width="8"/></g>
    <path d="M12 46 L118 46" class="ln"/>
    <path d="M24 66 L106 66 M24 84 L90 84 M24 100 L70 100" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`);
  add("town", "0 0 170 120", "big", `
    <rect x="8" y="50" width="48" height="68" fill="#ffd75e" class="o"/><path d="M4 52 L32 24 L60 52 Z" fill="#3fae5b" class="o"/>
    <rect x="58" y="22" width="52" height="96" fill="#7fc4ff" class="o"/>
    <rect x="112" y="40" width="50" height="78" fill="#ff9fb5" class="o"/><path d="M108 42 L137 14 L166 42 Z" fill="#8a5a2b" class="o"/>
    ${[0, 1, 2].map((r) => `<rect x="68" y="${32 + r * 26}" width="12" height="14" fill="#fff" class="o2"/><rect x="88" y="${32 + r * 26}" width="12" height="14" fill="#fff" class="o2"/>`).join("")}
    <rect x="22" y="66" width="20" height="18" fill="#fff" class="o2"/><rect x="126" y="58" width="20" height="18" fill="#fff" class="o2"/>
    <rect x="24" y="96" width="16" height="22" fill="#8a5a2b" class="o2"/><rect x="128" y="94" width="18" height="24" fill="#8a5a2b" class="o2"/>`);
  add("park", "0 0 150 130", "big", `
    <g class="a-sway"><rect x="40" y="70" width="16" height="56" fill="#8a5a2b" class="o"/>
    <circle cx="48" cy="46" r="34" fill="#3fae5b" class="o"/><circle cx="30" cy="62" r="18" fill="#3fae5b" class="o"/><circle cx="68" cy="60" r="20" fill="#3fae5b" class="o"/></g>
    <rect x="80" y="92" width="64" height="10" rx="3" fill="#e5483b" class="o2"/><rect x="80" y="80" width="64" height="8" rx="3" fill="#e5483b" class="o2"/>
    <path d="M86 102 L86 124 M138 102 L138 124" class="ln"/>`);
  add("airport", "0 0 170 100", "big", `
    <g class="a-bob"><path d="M10 50 Q10 36 30 36 L140 36 Q168 40 166 54 Q164 64 140 64 L30 64 Q10 64 10 50 Z" fill="#fff" class="o"/>
    <path d="M60 50 L96 50 L70 96 L52 96 Z" fill="#7fc4ff" class="o"/>
    <path d="M70 40 L96 40 L80 6 L66 6 Z" fill="#7fc4ff" class="o"/>
    <path d="M14 46 L4 22 L22 22 L34 40 Z" fill="#e5483b" class="o"/>
    <circle cx="120" cy="48" r="4" fill="#2f4a8a"/><circle cx="106" cy="48" r="4" fill="#2f4a8a"/><circle cx="134" cy="48" r="4" fill="#2f4a8a"/></g>`);
  add("mountain", "0 0 170 110", "big", `
    <path d="M4 106 L70 14 Q85 4 100 14 L166 106 Z" fill="#7fb3e6" class="o"/>
    <path d="M52 40 L70 14 Q85 4 100 14 L118 40 L104 34 L94 44 L84 32 L72 44 L64 34 Z" fill="#fff" class="o2"/>`);
  add("sea", "0 0 160 90", "big", `
    <g class="a-bob"><path d="M4 40 Q24 20 44 40 T84 40 T124 40 T164 40 L164 86 L4 86 Z" fill="#3c8ee6" class="o"/>
    <path d="M4 58 Q24 40 44 58 T84 58 T124 58 T164 58 L164 86 L4 86 Z" fill="#7fc4ff" class="o2"/>
    <path d="M30 32 Q40 24 48 34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`);
  add("bridge", "0 0 170 90", "big", `
    <path d="M6 80 Q85 6 164 80" fill="none" stroke="#e5483b" stroke-width="16"/>
    <path d="M6 80 Q85 6 164 80" fill="none" class="o" stroke-width="3" opacity=".9"/>
    <path d="M30 56 L30 84 M58 38 L58 84 M112 38 L112 84 M140 56 L140 84" class="ln"/>`);
  add("crossing", "0 0 170 90", "mid", `
    <path d="M8 84 L36 26 L134 26 L162 84 Z" fill="#6b6b78" class="o"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${30 + i * 24} 84 L${46 + i * 20} 26 L${58 + i * 20} 26 L${46 + i * 24} 84 Z" fill="#fff"/>`).join("")}
    <path d="M8 84 L36 26 L134 26 L162 84 Z" fill="none" class="o"/>`);
  add("platform", "0 0 130 140", "mid", `
    <rect x="58" y="60" width="12" height="78" fill="#9a9a9a" class="o2"/>
    <rect x="8" y="8" width="112" height="56" rx="8" fill="#fff" class="o"/>
    <circle cx="36" cy="36" r="18" fill="#3c8ee6" class="o2"/>
    <text x="36" y="44" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#fff">1</text>
    <text x="88" y="42" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="13" fill="#2a2320">ばんせん</text>`);
  add("wc", "0 0 120 120", "small", `
    <rect x="6" y="6" width="108" height="108" rx="14" fill="#fff" class="o"/>
    <circle cx="38" cy="32" r="9" fill="#3c8ee6"/><path d="M28 46 L48 46 L48 76 L44 76 L42 100 L34 100 L32 76 L28 76 Z" fill="#3c8ee6"/>
    <circle cx="82" cy="32" r="9" fill="#e5483b"/><path d="M74 46 L90 46 L98 80 L88 80 L86 100 L78 100 L76 80 L66 80 Z" fill="#e5483b"/>
    <path d="M60 22 L60 102" class="ln"/>`);
  add("japanmap", "0 0 100 140", "mid", `
    <path d="M10 6 L10 136" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>
    <path d="M10 6 L10 136" fill="none" class="o2" opacity=".4"/>
    <g class="a-flag"><path d="M12 10 Q50 2 92 12 L92 70 Q50 60 12 68 Z" fill="#fff" class="o"/>
    <circle cx="52" cy="38" r="15" fill="#e5483b"/></g>`);
  add("usflag", "0 0 110 140", "mid", `
    <path d="M10 6 L10 136" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>
    <g class="a-flag"><path d="M12 10 L102 10 L102 72 L12 72 Z" fill="#fff" class="o"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="13" y="${12 + i * 16}" width="88" height="8" fill="#e5483b"/>`).join("")}
    <rect x="13" y="11" width="40" height="32" fill="#2f4a8a"/>
    ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<circle cx="${21 + c * 12}" cy="${19 + r * 9}" r="2" fill="#fff"/>`).join("")).join("")}
    <path d="M12 10 L102 10 L102 72 L12 72 Z" fill="none" class="o"/></g>`);

  // ---- transport ---------------------------------------------------------------
  add("train", "0 0 150 112", "big", `
    <rect x="8" y="14" width="134" height="72" rx="18" fill="#fff4dc" class="o"/>
    <rect x="8" y="58" width="134" height="12" fill="#3fae5b" class="o2"/>
    <rect x="22" y="26" width="26" height="24" rx="5" fill="#7fc4ff" class="o2"/><rect x="62" y="26" width="26" height="24" rx="5" fill="#7fc4ff" class="o2"/><rect x="102" y="26" width="26" height="24" rx="5" fill="#7fc4ff" class="o2"/>
    <g class="a-spin"><circle cx="38" cy="92" r="12" fill="#2a2320"/><path d="M30 92 L46 92" stroke="#c9c9c9" stroke-width="3"/></g>
    <g class="a-spin"><circle cx="112" cy="92" r="12" fill="#2a2320"/><path d="M104 92 L120 92" stroke="#c9c9c9" stroke-width="3"/></g>
    <rect x="62" y="4" width="26" height="10" rx="3" fill="#ffc93c" class="o2"/>`);
  add("subway", "0 0 120 130", "big", `
    <rect x="10" y="8" width="100" height="108" rx="22" fill="#c3a6ff" class="o"/>
    <rect x="22" y="22" width="76" height="44" rx="8" fill="#7fc4ff" class="o2"/>
    <path d="M30 30 L44 30" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="30" cy="90" r="9" fill="#fff7b0" class="o2"/><circle cx="90" cy="90" r="9" fill="#fff7b0" class="o2"/>
    <rect x="46" y="84" width="28" height="12" rx="3" fill="#2a2320"/>
    <path d="M22 116 L10 128 M98 116 L110 128" class="ln"/>`);
  add("bus", "0 0 160 110", "big", `
    <rect x="6" y="12" width="148" height="76" rx="14" fill="#3fae5b" class="o"/>
    <rect x="6" y="56" width="148" height="12" fill="#fff4dc" class="o2"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${18 + i * 30}" y="22" width="22" height="24" rx="4" fill="#d8f0ff" class="o2"/>`).join("")}
    <rect x="134" y="22" width="14" height="30" rx="3" fill="#d8f0ff" class="o2"/>
    <g class="a-spin"><circle cx="38" cy="92" r="13" fill="#2a2320"/><path d="M30 92 L46 92" stroke="#c9c9c9" stroke-width="3"/></g>
    <g class="a-spin"><circle cx="122" cy="92" r="13" fill="#2a2320"/><path d="M114 92 L130 92" stroke="#c9c9c9" stroke-width="3"/></g>`);
  add("car", "0 0 150 100", "big", `
    <path d="M10 64 L10 50 Q12 40 28 38 L44 16 Q50 10 62 10 L96 10 Q108 10 114 18 L128 38 Q144 40 144 54 L144 64 Q144 72 136 72 L18 72 Q10 72 10 64 Z" fill="#e5483b" class="o"/>
    <path d="M52 20 L70 20 L70 38 L40 38 Z" fill="#d8f0ff" class="o2"/><path d="M78 20 L100 20 L114 38 L78 38 Z" fill="#d8f0ff" class="o2"/>
    <circle cx="140" cy="52" r="5" fill="#fff7b0" class="o2"/>
    <g class="a-spin"><circle cx="40" cy="74" r="14" fill="#2a2320"/><circle cx="40" cy="74" r="5" fill="#c9c9c9"/><path d="M32 74 L48 74" stroke="#c9c9c9" stroke-width="2"/></g>
    <g class="a-spin"><circle cx="114" cy="74" r="14" fill="#2a2320"/><circle cx="114" cy="74" r="5" fill="#c9c9c9"/><path d="M106 74 L122 74" stroke="#c9c9c9" stroke-width="2"/></g>`);
  add("taxi", "0 0 150 110", "big", `
    <rect x="58" y="4" width="36" height="16" rx="4" fill="#fff" class="o2"/>
    <text x="76" y="16" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="10" fill="#2a2320">TAXI</text>
    <path d="M10 74 L10 60 Q12 50 28 48 L44 26 Q50 20 62 20 L96 20 Q108 20 114 28 L128 48 Q144 50 144 64 L144 74 Q144 82 136 82 L18 82 Q10 82 10 74 Z" fill="#ffc93c" class="o"/>
    <path d="M52 30 L70 30 L70 48 L40 48 Z" fill="#d8f0ff" class="o2"/><path d="M78 30 L100 30 L114 48 L78 48 Z" fill="#d8f0ff" class="o2"/>
    <path d="M12 62 L142 62" stroke="#2a2320" stroke-width="4" stroke-dasharray="6 6"/>
    <g class="a-spin"><circle cx="40" cy="84" r="14" fill="#2a2320"/><path d="M32 84 L48 84" stroke="#c9c9c9" stroke-width="2"/></g>
    <g class="a-spin"><circle cx="114" cy="84" r="14" fill="#2a2320"/><path d="M106 84 L122 84" stroke="#c9c9c9" stroke-width="2"/></g>`);
  add("bicycle", "0 0 150 100", "mid", `
    <g class="a-spin"><circle cx="34" cy="66" r="28" fill="none" class="o"/><path d="M34 40 L34 92 M8 66 L60 66" class="ln" opacity=".5"/></g>
    <g class="a-spin"><circle cx="116" cy="66" r="28" fill="none" class="o"/><path d="M116 40 L116 92 M90 66 L142 66" class="ln" opacity=".5"/></g>
    <path d="M34 66 L62 30 L104 30 L116 66 M62 30 L76 66 L104 30 M76 66 L34 66" fill="none" stroke="#3c8ee6" stroke-width="6" stroke-linejoin="round"/>
    <path d="M56 22 L72 22 M98 30 L94 14 L110 12" class="ln"/>`);
  add("boat", "0 0 140 120", "big", `
    <g class="a-bob"><path d="M66 6 L66 80" class="ln"/><path d="M70 10 L120 72 L70 72 Z" fill="#fff" class="o"/><path d="M62 22 L22 72 L62 72 Z" fill="#ffc93c" class="o"/>
    <path d="M8 80 L132 80 L114 110 L26 110 Z" fill="#e5483b" class="o"/></g>`);
  add("ticket", "0 0 140 90", "small", `
    <path d="M8 14 L132 14 L132 36 Q122 45 132 54 L132 76 L8 76 L8 54 Q18 45 8 36 Z" fill="#ffd75e" class="o"/>
    <path d="M100 18 L100 72" stroke="#2a2320" stroke-width="2" stroke-dasharray="4 4"/>
    <path d="M22 34 L84 34 M22 50 L70 50" stroke="#2a2320" stroke-width="4" stroke-linecap="round"/>
    <circle cx="116" cy="45" r="8" fill="#e5483b" class="o2"/>`);
  add("signal", "0 0 70 150", "mid", `
    <rect x="29" y="84" width="12" height="64" fill="#6b6b78" class="o2"/>
    <rect x="8" y="6" width="54" height="84" rx="12" fill="#3a3550" class="o"/>
    <circle class="a-sig1" cx="35" cy="24" r="10" fill="#e5483b"/><circle class="a-sig2" cx="35" cy="48" r="10" fill="#ffc93c"/><circle class="a-sig3" cx="35" cy="72" r="10" fill="#3fae5b"/>`);
  add("map", "0 0 140 110", "mid", `
    <path d="M8 18 L48 8 L92 18 L132 8 L132 96 L92 106 L48 96 L8 106 Z" fill="#fff4dc" class="o"/>
    <path d="M48 8 L48 96 M92 18 L92 106" class="ln" opacity=".5"/>
    <path d="M20 80 Q50 60 70 72 T118 40" fill="none" stroke="#e5483b" stroke-width="4" stroke-dasharray="6 6" stroke-linecap="round"/>
    <g class="a-hop"><path d="M110 10 Q96 10 96 26 Q96 38 110 50 Q124 38 124 26 Q124 10 110 10 Z" fill="#e5483b" class="o"/><circle cx="110" cy="26" r="5" fill="#fff"/></g>`);
  add("suitcase", "0 0 110 130", "mid", `
    <path d="M40 22 L40 8 L70 8 L70 22" fill="none" class="o"/>
    <rect x="14" y="22" width="82" height="92" rx="12" fill="#c3a6ff" class="o"/>
    <path d="M38 22 L38 114 M72 22 L72 114" stroke="#8a5cd6" stroke-width="5"/>
    <rect x="44" y="56" width="22" height="16" rx="3" fill="#ffd75e" class="o2" transform="rotate(-8 55 64)"/>
    <circle cx="30" cy="120" r="7" fill="#2a2320"/><circle cx="80" cy="120" r="7" fill="#2a2320"/>`);

  // ---- things -------------------------------------------------------------------
  add("book-circle", "0 0 100 130", "mid", `
    <rect x="10" y="8" width="80" height="114" rx="6" fill="#e5483b" class="o"/>
    <rect x="10" y="8" width="14" height="114" fill="#b8362b" class="o2"/>
    <circle cx="57" cy="56" r="20" fill="#ffc93c" class="o2"/>
    <path d="M38 94 L76 94 M38 104 L66 104" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
  add("menu", "0 0 100 130", "mid", `
    <rect x="10" y="6" width="80" height="118" rx="6" fill="#8a2a24" class="o"/>
    <rect x="18" y="14" width="64" height="102" rx="3" fill="none" stroke="#ffc93c" stroke-width="2"/>
    <text x="50" y="58" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="14" fill="#ffc93c">メニュー</text>
    <path d="M30 74 L70 74" stroke="#ffc93c" stroke-width="2"/>`);
  add("schooldesk", "0 0 150 120", "mid", `
    <rect x="8" y="46" width="134" height="14" rx="3" fill="#c98a4b" class="o"/>
    <path d="M22 60 L22 116 M128 60 L128 116" stroke="#2a2320" stroke-width="8"/>
    <path d="M22 60 L22 116 M128 60 L128 116" stroke="#9a9a9a" stroke-width="4"/>
    <path d="M30 46 L36 24 L84 24 L80 46 Z" fill="#fff" class="o2"/><path d="M42 32 L74 32 M40 38 L70 38" stroke="#7fc4ff" stroke-width="2"/>
    <g class="a-write"><path d="M96 42 L124 12 L130 18 L102 46 L94 48 Z" fill="#ffd75e" class="o2"/></g>`);
  add("bed", "0 0 170 100", "big", `
    <rect x="6" y="20" width="16" height="76" rx="4" fill="#8a5a2b" class="o"/>
    <rect x="148" y="44" width="16" height="52" rx="4" fill="#8a5a2b" class="o"/>
    <rect x="16" y="56" width="140" height="22" fill="#fff" class="o"/>
    <rect x="26" y="36" width="44" height="22" rx="10" fill="#fff" class="o"/>
    <path d="M62 50 Q100 36 154 50 L154 78 L62 78 Z" fill="#7fc4ff" class="o"/>
    <g class="a-zzz"><text x="96" y="30" font-family="Fredoka, sans-serif" font-weight="700" font-size="18" fill="#2f4a8a">z</text><text x="112" y="18" font-family="Fredoka, sans-serif" font-weight="700" font-size="13" fill="#2f4a8a">z</text></g>`);
  add("bathtub", "0 0 160 110", "big", `
    <g class="a-bubbles"><circle cx="50" cy="30" r="12" fill="#fff" class="o2"/><circle cx="74" cy="22" r="16" fill="#fff" class="o2"/><circle cx="100" cy="32" r="11" fill="#fff" class="o2"/></g>
    <path d="M8 44 L152 44 L144 88 Q140 98 128 98 L32 98 Q20 98 16 88 Z" fill="#fff" class="o"/>
    <path d="M14 58 L146 58" stroke="#7fc4ff" stroke-width="6"/>
    <path d="M36 98 L30 108 M124 98 L130 108" class="ln"/>`);
  add("toothbrush", "0 0 150 70", "small", `
    <rect x="6" y="38" width="96" height="14" rx="7" fill="#3c8ee6" class="o"/>
    <rect x="96" y="40" width="46" height="10" rx="4" fill="#fff" class="o2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${100 + i * 8}" y="22" width="6" height="18" rx="2" fill="#fff" class="o2"/>`).join("")}
    <path d="M100 18 Q120 6 140 18" fill="#d8f0ff" class="o2"/>`);
  add("clockface", "0 0 120 120", "mid", `
    <circle cx="60" cy="60" r="52" fill="#ffd75e" class="o"/>
    <circle cx="60" cy="60" r="40" fill="#fff" class="o2"/>
    ${[0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 2; return `<circle cx="${60 + 32 * Math.sin(a)}" cy="${60 - 32 * Math.cos(a)}" r="3.5" fill="#2a2320"/>`; }).join("")}
    <g class="a-clock-slow"><path d="M60 60 L60 38" class="ln" stroke-width="5"/></g>
    <g class="a-clock"><path d="M60 60 L60 28" class="ln"/></g>
    <circle cx="60" cy="60" r="4" fill="#e5483b"/>`);
  add("alarmclock", "0 0 120 120", "mid", `
    <g class="a-ring"><circle cx="30" cy="24" r="14" fill="#e5483b" class="o"/><circle cx="90" cy="24" r="14" fill="#e5483b" class="o"/>
    <circle cx="60" cy="64" r="44" fill="#e5483b" class="o"/><circle cx="60" cy="64" r="32" fill="#fff" class="o2"/>
    <path d="M60 64 L60 42 M60 64 L74 64" class="ln"/>
    <path d="M30 104 L22 116 M90 104 L98 116" class="ln"/></g>`);
  add("tv", "0 0 140 130", "mid", `
    <path d="M50 30 L32 6 M90 30 L108 6" class="ln"/>
    <rect x="8" y="28" width="124" height="90" rx="14" fill="#c98a4b" class="o"/>
    <rect x="20" y="40" width="80" height="66" rx="10" fill="#7fc4ff" class="o2"/>
    <g class="a-flicker"><path d="M30 54 L62 54" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
    <circle cx="116" cy="56" r="7" fill="#ffc93c" class="o2"/><circle cx="116" cy="80" r="7" fill="#ffc93c" class="o2"/>`);
  add("smartphone", "0 0 70 120", "small", `
    <rect x="8" y="4" width="54" height="112" rx="10" fill="#3a3550" class="o"/>
    <rect x="14" y="16" width="42" height="82" rx="4" fill="#7fc4ff"/>
    <g class="a-flicker"><rect x="20" y="26" width="30" height="8" rx="3" fill="#fff"/><rect x="20" y="40" width="22" height="8" rx="3" fill="#fff"/></g>
    <circle cx="35" cy="107" r="4" fill="#9a9a9a"/>`);
  add("telephone", "0 0 140 110", "mid", `
    <path d="M14 34 Q10 14 30 12 L110 12 Q130 14 126 34 L110 40 L100 26 L40 26 L30 40 Z" fill="#e5483b" class="o"/>
    <path d="M30 48 L110 48 L124 100 L16 100 Z" fill="#e5483b" class="o"/>
    <circle cx="70" cy="74" r="18" fill="#fff" class="o2"/><circle cx="70" cy="74" r="6" fill="#e5483b"/>`);
  add("camera", "0 0 140 110", "small", `
    <rect x="44" y="12" width="36" height="16" rx="4" fill="#3a3550" class="o2"/>
    <rect x="8" y="26" width="124" height="76" rx="12" fill="#3a3550" class="o"/>
    <circle cx="70" cy="64" r="28" fill="#fff" class="o"/><circle cx="70" cy="64" r="16" fill="#3c8ee6" class="o2"/>
    <g class="a-flash"><circle cx="112" cy="42" r="7" fill="#fff7b0" class="o2"/></g>`);
  add("headphones", "0 0 130 120", "small", `
    <path d="M22 74 Q16 10 65 10 Q114 10 108 74" fill="none" stroke="#2a2320" stroke-width="14" stroke-linecap="round"/>
    <path d="M22 74 Q16 10 65 10 Q114 10 108 74" fill="none" stroke="#c3a6ff" stroke-width="8" stroke-linecap="round"/>
    <rect x="8" y="66" width="30" height="46" rx="12" fill="#8a5cd6" class="o"/><rect x="92" y="66" width="30" height="46" rx="12" fill="#8a5cd6" class="o"/>
    <g class="a-notes"><text x="56" y="70" font-family="Fredoka, sans-serif" font-weight="700" font-size="24" fill="#e5483b">♪</text></g>`);
  add("bag", "0 0 120 120", "mid", `
    <path d="M38 40 Q38 10 60 10 Q82 10 82 40" fill="none" class="o" stroke-width="6"/>
    <path d="M14 40 L106 40 L98 112 L22 112 Z" fill="#ff9fb5" class="o"/>
    <path d="M14 40 L106 40 L104 56 L16 56 Z" fill="#e5708f" class="o2"/>
    <circle cx="60" cy="56" r="6" fill="#ffc93c" class="o2"/>`);
  add("wallet", "0 0 130 100", "small", `
    <rect x="8" y="20" width="114" height="72" rx="10" fill="#8a5a2b" class="o"/>
    <path d="M8 40 L122 40" class="ln"/>
    <path d="M78 40 L122 40 L122 72 L78 72 Q66 72 66 56 Q66 40 78 40 Z" fill="#a96a2c" class="o2"/>
    <circle cx="84" cy="56" r="5" fill="#ffc93c" class="o2"/>
    <rect x="20" y="8" width="44" height="22" rx="3" fill="#9fd67a" class="o2"/>`);
  add("umbrella", "0 0 130 140", "mid", `
    <path d="M65 40 L65 118 Q65 132 52 132 Q42 132 42 122" fill="none" class="o" stroke-width="5"/>
    <path d="M8 60 Q10 10 65 10 Q120 10 122 60 Q108 50 94 60 Q80 50 65 60 Q50 50 36 60 Q22 50 8 60 Z" fill="#e5483b" class="o"/>
    <path d="M36 60 Q42 24 65 10 Q88 24 94 60" fill="none" class="o2"/>`);
  add("coin100", "0 0 110 110", "small", `
    <circle cx="55" cy="55" r="48" fill="#d9d9de" class="o"/>
    <circle cx="55" cy="55" r="38" fill="none" stroke="#a9a9b2" stroke-width="3"/>
    <text x="55" y="66" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="30" fill="#5a5a66">100</text>
    <path d="M28 34 Q34 24 44 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`);
  add("chair", "0 0 100 130", "mid", `
    <rect x="14" y="8" width="72" height="56" rx="10" fill="#e2a35f" class="o"/>
    <rect x="10" y="62" width="80" height="14" rx="4" fill="#c98a4b" class="o"/>
    <path d="M20 76 L18 124 M80 76 L82 124" stroke="#2a2320" stroke-width="9" stroke-linecap="round"/><path d="M20 76 L18 124 M80 76 L82 124" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>`);
  add("window", "0 0 130 120", "mid", `
    <rect x="12" y="10" width="106" height="96" fill="#bfe8ff" class="o"/>
    <path d="M30 40 Q34 30 44 32 Q50 22 60 30 Q70 28 68 40 Z" fill="#fff" class="o2"/>
    <path d="M65 10 L65 106 M12 58 L118 58" class="ln"/>
    <g class="a-sway"><path d="M4 4 L40 4 Q30 60 44 112 L4 112 Z" fill="#ff9fb5" class="o"/></g>
    <g class="a-sway2"><path d="M126 4 L90 4 Q100 60 86 112 L126 112 Z" fill="#ff9fb5" class="o"/></g>`);
  add("chatbubble", "0 0 130 110", "small", `
    <path d="M10 46 Q10 10 65 10 Q120 10 120 46 Q120 80 66 82 L40 104 L44 80 Q10 76 10 46 Z" fill="#fff" class="o"/>
    <g class="a-dots"><circle cx="42" cy="46" r="7" fill="#2a2320"/><circle cx="65" cy="46" r="7" fill="#2a2320"/><circle cx="88" cy="46" r="7" fill="#2a2320"/></g>`);
  add("cigarette", "0 0 140 100", "small", `
    <g class="a-steam"><path d="M110 50 Q100 34 112 22 Q122 10 112 0" fill="none" stroke="#bbb" stroke-width="5" stroke-linecap="round"/></g>
    <ellipse cx="70" cy="84" rx="62" ry="12" fill="#9fb4d8" class="o"/>
    <rect x="22" y="58" width="90" height="14" rx="4" fill="#fff" class="o2" transform="rotate(-10 67 65)"/>
    <rect x="22" y="62" width="26" height="14" rx="3" fill="#ffa95c" class="o2" transform="rotate(-10 35 69)"/>
    <circle cx="112" cy="56" r="5" fill="#e5483b"/>`);
  add("thief", "0 0 110 150", "mid", `
    <circle cx="70" cy="96" r="34" fill="#c9b08a" class="o"/><path d="M60 64 L84 64 L80 72 L64 72 Z" fill="#8a5a2b" class="o2"/>
    <text x="62" y="108" font-family="Fredoka, sans-serif" font-weight="700" font-size="20" fill="#5a4a2a">¥</text>
    <rect x="22" y="70" width="36" height="66" rx="12" fill="#3a3550" class="o"/>
    <circle cx="40" cy="44" r="26" fill="#ffd9b8" class="o"/>
    <rect x="16" y="34" width="48" height="12" rx="4" fill="#2a2320"/>
    <circle cx="30" cy="40" r="3" fill="#fff"/><circle cx="50" cy="40" r="3" fill="#fff"/>
    <path d="M14 30 Q40 6 66 30" fill="#3a3550" class="o2"/>`);

  // ---- nature & animals --------------------------------------------------------------
  add("sun", "0 0 130 130", "mid", `
    <g class="a-spin-slow">${Array.from({ length: 10 }, (_, i) => `<path d="M65 6 L72 26 L58 26 Z" fill="#ffc93c" class="o2" transform="rotate(${i * 36} 65 65)"/>`).join("")}</g>
    <circle cx="65" cy="65" r="36" fill="#ffd75e" class="o"/>
    <ellipse cx="54" cy="62" rx="4" ry="6" fill="#2a2320"/><ellipse cx="76" cy="62" rx="4" ry="6" fill="#2a2320"/>
    <path d="M56 76 Q65 84 74 76" fill="none" class="o2"/>
    <ellipse cx="46" cy="74" rx="5" ry="3" fill="#ff8fa0"/><ellipse cx="84" cy="74" rx="5" ry="3" fill="#ff8fa0"/>`);
  add("raincloud", "0 0 140 130", "mid", `
    <g class="a-rain"><path d="M38 84 L32 100 M66 88 L60 104 M94 84 L88 100 M52 108 L46 124 M80 108 L74 124" stroke="#3c8ee6" stroke-width="5" stroke-linecap="round"/></g>
    <path d="M20 74 Q4 72 6 54 Q8 36 28 38 Q30 14 56 14 Q76 12 84 30 Q96 18 112 26 Q132 34 128 54 Q136 74 116 76 Z" fill="#c9d4e6" class="o"/>`);
  add("winter", "0 0 110 140", "mid", `
    <circle cx="55" cy="100" r="34" fill="#fff" class="o"/>
    <circle cx="55" cy="46" r="24" fill="#fff" class="o"/>
    <path d="M30 64 Q55 74 80 64 L82 74 Q55 84 28 74 Z" fill="#e5483b" class="o2"/><path d="M70 72 L76 96 L64 96 Z" fill="#e5483b" class="o2"/>
    <circle cx="47" cy="42" r="3" fill="#2a2320"/><circle cx="63" cy="42" r="3" fill="#2a2320"/><path d="M55 48 L70 52 L55 54 Z" fill="#ff8a3c"/>
    <path d="M36 26 L74 26 L68 4 L42 4 Z" fill="#3a3550" class="o2"/>
    <g class="a-snow"><circle cx="12" cy="20" r="3" fill="#fff" class="o2"/><circle cx="98" cy="40" r="3" fill="#fff" class="o2"/><circle cx="96" cy="8" r="2.5" fill="#fff" class="o2"/></g>`);
  add("flower", "0 0 100 140", "small", `
    <g class="a-sway"><path d="M50 60 L50 108" stroke="#3fae5b" stroke-width="6"/>
    <path d="M50 90 Q30 74 22 88 Q36 98 50 92" fill="#3fae5b" class="o2"/>
    ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="50" cy="22" rx="11" ry="17" fill="#ffd75e" class="o2" transform="rotate(${i * 60} 50 40)"/>`).join("")}
    <circle cx="50" cy="40" r="11" fill="#e2a35f" class="o2"/></g>
    <path d="M26 104 L74 104 L68 136 L32 136 Z" fill="#c9553d" class="o"/>`);
  add("redflower", "0 0 90 140", "small", `
    <g class="a-sway"><path d="M45 50 L45 112" stroke="#3fae5b" stroke-width="6"/>
    <path d="M45 96 Q24 78 18 96 Q32 104 45 98" fill="#3fae5b" class="o2"/>
    <path d="M20 22 L32 34 L45 14 L58 34 L70 22 L68 48 Q45 66 22 48 Z" fill="#e5483b" class="o"/></g>
    <path d="M22 108 L68 108 L62 136 L28 136 Z" fill="#7fc4ff" class="o"/>`);
  add("sakura", "0 0 150 110", "mid", `
    <path d="M6 96 Q60 70 100 40 Q120 26 144 22" fill="none" stroke="#8a5a2b" stroke-width="8" stroke-linecap="round"/>
    ${[[40, 70], [76, 46], [112, 28], [96, 70]].map(([x, y]) => Array.from({ length: 5 }, (_, i) => `<ellipse cx="${x}" cy="${y - 10}" rx="7" ry="11" fill="#ffc4d6" class="o2" transform="rotate(${i * 72} ${x} ${y})"/>`).join("") + `<circle cx="${x}" cy="${y}" r="4" fill="#e5708f"/>`).join("")}
    <g class="a-petals"><ellipse cx="60" cy="96" rx="4" ry="6" fill="#ffc4d6" class="o2"/><ellipse cx="128" cy="70" rx="4" ry="6" fill="#ffc4d6" class="o2"/></g>`);
  add("star", "0 0 120 120", "small", `
    <g class="a-spin-slow"><path d="M60 6 L74 42 L114 44 L82 68 L94 108 L60 86 L26 108 L38 68 L6 44 L46 42 Z" fill="#ffd75e" class="o"/></g>
    <circle cx="50" cy="60" r="4" fill="#2a2320"/><circle cx="70" cy="60" r="4" fill="#2a2320"/>`);
  add("cat", "0 0 120 130", "mid", `
    <g class="a-tail"><path d="M84 112 Q116 104 110 70" fill="none" stroke="#2a2320" stroke-width="14" stroke-linecap="round"/><path d="M84 112 Q116 104 110 70" fill="none" stroke="#ffa95c" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M24 124 Q18 70 50 66 Q86 66 86 124 Z" fill="#ffa95c" class="o"/>
    <path d="M22 30 L26 6 L44 22 Z M78 30 L74 6 L56 22 Z" fill="#ffa95c" class="o"/>
    <circle cx="50" cy="42" r="28" fill="#ffa95c" class="o"/>
    <ellipse cx="40" cy="40" rx="3.5" ry="5" fill="#2a2320"/><ellipse cx="60" cy="40" rx="3.5" ry="5" fill="#2a2320"/>
    <path d="M45 52 Q50 56 55 52" fill="none" class="o2"/>
    <path d="M18 46 L34 48 M18 54 L34 52 M82 46 L66 48 M82 54 L66 52" class="ln" stroke-width="2"/>`);
  add("whitecat", "0 0 120 130", "mid", `
    <g class="a-tail"><path d="M84 112 Q116 104 110 70" fill="none" stroke="#2a2320" stroke-width="14" stroke-linecap="round"/><path d="M84 112 Q116 104 110 70" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M24 124 Q18 70 50 66 Q86 66 86 124 Z" fill="#fff" class="o"/>
    <path d="M22 30 L26 6 L44 22 Z M78 30 L74 6 L56 22 Z" fill="#fff" class="o"/>
    <circle cx="50" cy="42" r="28" fill="#fff" class="o"/>
    <ellipse cx="40" cy="40" rx="3.5" ry="5" fill="#2a2320"/><ellipse cx="60" cy="40" rx="3.5" ry="5" fill="#2a2320"/>
    <path d="M45 52 Q50 56 55 52" fill="none" class="o2"/><ellipse cx="34" cy="50" rx="5" ry="3" fill="#ff8fa0"/><ellipse cx="66" cy="50" rx="5" ry="3" fill="#ff8fa0"/>`);
  add("dogface", "0 0 120 110", "mid", `
    <path d="M18 40 L22 6 L46 26 Z M102 40 L98 6 L74 26 Z" fill="#e2a35f" class="o"/>
    <ellipse cx="60" cy="58" rx="46" ry="42" fill="#e2a35f" class="o"/>
    <ellipse cx="60" cy="74" rx="26" ry="20" fill="#fff4dc" class="o2"/>
    <ellipse cx="42" cy="50" rx="4" ry="6" fill="#2a2320"/><ellipse cx="78" cy="50" rx="4" ry="6" fill="#2a2320"/>
    <ellipse cx="60" cy="66" rx="7" ry="5" fill="#2a2320"/><path d="M52 78 Q60 86 68 78" fill="none" class="o2"/>`);
  add("bird", "0 0 120 100", "small", `
    <ellipse cx="58" cy="56" rx="38" ry="30" fill="#7fc4ff" class="o"/>
    <g class="a-flap"><path d="M48 52 Q30 20 70 32 Q72 50 48 52 Z" fill="#3c8ee6" class="o2"/></g>
    <path d="M94 50 L114 56 L94 62 Z" fill="#ffc93c" class="o2"/>
    <circle cx="82" cy="48" r="4" fill="#2a2320"/>
    <path d="M22 60 L6 50 L8 70 Z" fill="#3c8ee6" class="o2"/>
    <path d="M50 86 L46 96 M66 86 L66 96" class="ln"/>`);
  add("octopus", "0 0 130 120", "mid", `
    <g class="a-wiggle">${[18, 38, 58, 78, 98].map((x, i) => `<path d="M${x + 6} 70 Q${x - 4 + (i % 2) * 8} 96 ${x + 6} 112" fill="none" stroke="#2a2320" stroke-width="14" stroke-linecap="round"/><path d="M${x + 6} 70 Q${x - 4 + (i % 2) * 8} 96 ${x + 6} 112" fill="none" stroke="#e5483b" stroke-width="8" stroke-linecap="round"/>`).join("")}</g>
    <ellipse cx="64" cy="48" rx="46" ry="40" fill="#e5483b" class="o"/>
    <ellipse cx="50" cy="52" rx="5" ry="7" fill="#2a2320"/><ellipse cx="78" cy="52" rx="5" ry="7" fill="#2a2320"/>
    <ellipse cx="64" cy="70" rx="7" ry="5" fill="#b8362b" class="o2"/>`);
  add("cow", "0 0 150 120", "mid", `
    <rect x="20" y="40" width="104" height="54" rx="22" fill="#fff" class="o"/>
    <path d="M40 46 Q56 40 60 56 Q54 70 40 64 Z M88 60 Q104 52 110 68 Q100 82 88 74 Z" fill="#2a2320"/>
    <path d="M32 92 L32 116 M50 92 L50 116 M96 92 L96 116 M114 92 L114 116" stroke="#2a2320" stroke-width="10" stroke-linecap="round"/>
    <circle cx="124" cy="42" r="22" fill="#fff" class="o"/>
    <ellipse cx="132" cy="52" rx="14" ry="10" fill="#ffb3c1" class="o2"/>
    <circle cx="120" cy="36" r="3" fill="#2a2320"/>
    <path d="M110 22 L106 10 M134 20 L140 10" class="ln"/>`);
  add("bigface", "0 0 120 120", "mid", `
    <circle cx="60" cy="60" r="52" fill="#ffd9b8" class="o"/>
    <path d="M10 52 Q12 6 60 8 Q108 6 110 52 Q96 30 60 30 Q24 30 10 52 Z" fill="#2a2320"/>
    <ellipse cx="42" cy="62" rx="5" ry="8" fill="#2a2320"/><ellipse cx="78" cy="62" rx="5" ry="8" fill="#2a2320"/>
    <path d="M44 84 Q60 98 76 84" fill="#e5483b" class="o2"/>
    <ellipse cx="30" cy="78" rx="8" ry="5" fill="#ff8fa0"/><ellipse cx="90" cy="78" rx="8" ry="5" fill="#ff8fa0"/>`);

  // ---- the rest of the art map's targets ----------------------------------------------
  add("onigiri", "0 0 110 104", "small", `
    <path d="M55 6 Q66 6 76 24 L100 70 Q108 92 86 96 L24 96 Q2 92 10 70 L34 24 Q44 6 55 6 Z" fill="#fff" class="o"/>
    <rect x="34" y="62" width="42" height="34" rx="3" fill="#24352c" class="o2"/>`);
  add("curry", "0 0 140 100", "mid", `
    <ellipse cx="70" cy="62" rx="64" ry="30" fill="#fff" class="o"/>
    <path d="M18 58 Q20 36 60 36 Q72 50 60 74 Q30 80 18 58 Z" fill="#fff" class="o2"/>
    <path d="M60 36 Q110 30 122 56 Q118 80 60 74 Q72 54 60 36 Z" fill="#c9862b" class="o2"/>
    <circle cx="84" cy="52" r="6" fill="#ff8a3c" class="o2"/><circle cx="102" cy="60" r="5" fill="#ffd75e" class="o2"/>`);
  add("grilledfish", "0 0 150 90", "mid", `
    <ellipse cx="75" cy="66" rx="70" ry="18" fill="#fff" class="o"/>
    <path d="M22 50 Q50 24 96 34 Q112 38 120 48 Q112 58 96 62 Q50 72 22 50 Z" fill="#b9b9c4" class="o"/>
    <path d="M118 48 L140 32 L136 48 L140 64 Z" fill="#9a9aa6" class="o2"/>
    <circle cx="36" cy="46" r="3" fill="#2a2320"/><path d="M60 42 L64 58 M76 40 L80 58 M92 40 L94 56" stroke="#5a5a66" stroke-width="3" stroke-linecap="round"/>`);
  add("medicine", "0 0 120 110", "small", `
    <rect x="8" y="40" width="70" height="28" rx="14" fill="#fff" class="o" transform="rotate(-25 43 54)"/>
    <path d="M20 66 Q10 52 22 40 L40 30 L56 56 L38 68 Q28 74 20 66 Z" fill="#e5483b" class="o2"/>
    <circle cx="90" cy="76" r="22" fill="#fff" class="o"/><path d="M76 76 L104 76" class="ln"/>`);
  add("hospital", "0 0 140 130", "big", `
    <rect x="12" y="30" width="116" height="98" fill="#fff" class="o"/>
    <rect x="50" y="6" width="40" height="40" rx="6" fill="#fff" class="o"/>
    <path d="M70 14 L70 38 M58 26 L82 26" stroke="#e5483b" stroke-width="8" stroke-linecap="round"/>
    ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${24 + c * 34}" y="${56 + r * 24}" width="22" height="16" fill="#bfe8ff" class="o2"/>`).join("")).join("")}
    <rect x="56" y="104" width="28" height="24" fill="#7fc4ff" class="o2"/>`);
  add("moon", "0 0 110 110", "small", `
    <path d="M70 8 Q20 14 18 56 Q20 100 70 102 Q40 84 40 56 Q40 26 70 8 Z" fill="#ffd75e" class="o"/>
    <circle cx="34" cy="50" r="3" fill="#2a2320"/><path d="M30 64 Q36 68 40 64" fill="none" class="o2"/>`);
  add("bill", "0 0 120 140", "small", `
    <path d="M14 6 L106 6 L106 134 L94 126 L82 134 L70 126 L58 134 L46 126 L34 134 L22 126 L14 134 Z" fill="#fff" class="o"/>
    <path d="M28 30 L92 30 M28 50 L80 50 M28 70 L86 70" stroke="#9a9aa6" stroke-width="4" stroke-linecap="round"/>
    <path d="M28 98 L92 98" class="ln"/>`);

  // ---- もち子さん: a paper puppet with poseable arms, blinking eyes, a talking mouth ----
  // Pose classes on the root: pose-think | pose-thumbs | pose-cheer | pose-wave.
  const mochiko = `
    <g class="m-body">
      <rect x="44" y="160" width="11" height="44" rx="4" fill="#3a3550" class="o2"/><rect x="65" y="160" width="11" height="44" rx="4" fill="#3a3550" class="o2"/>
      <ellipse cx="47" cy="208" rx="11" ry="6" fill="#2a2320"/><ellipse cx="73" cy="208" rx="11" ry="6" fill="#2a2320"/>
      <path d="M34 138 L86 138 L94 170 L26 170 Z" fill="#2f4a8a" class="o"/>
      <g class="m-arm m-arm-l"><path d="M30 98 Q20 120 22 140" fill="none" stroke="#2a2320" stroke-width="15" stroke-linecap="round"/><path d="M30 98 Q20 120 22 140" fill="none" stroke="#2f4a8a" stroke-width="9" stroke-linecap="round"/><circle cx="22" cy="144" r="7" fill="#ffd9b8" class="o2"/></g>
      <path d="M30 96 Q60 84 90 96 L92 146 L28 146 Z" fill="#2f4a8a" class="o"/>
      <path d="M50 92 L70 92 L60 114 Z" fill="#fff" class="o2"/>
      <path d="M57 96 L63 96 L65 118 L60 124 L55 118 Z" fill="#e5483b" class="o2"/>
      <circle cx="42" cy="118" r="2.5" fill="#ffc93c"/><circle cx="42" cy="132" r="2.5" fill="#ffc93c"/>
      <g class="m-head">
        <circle cx="60" cy="58" r="31" fill="#ffd9b8" class="o"/>
        <path d="M27 62 Q24 26 60 26 Q96 26 93 62 L94 82 Q86 80 84 66 Q78 48 60 46 Q42 48 36 66 Q34 80 26 82 Z" fill="#7a4524" class="o"/>
        <path d="M30 38 Q60 8 90 38 L90 44 L30 44 Z" fill="#2f4a8a" class="o"/>
        <ellipse cx="60" cy="45" rx="35" ry="6" fill="#1f2f5a" class="o2"/>
        <circle cx="60" cy="31" r="5" fill="#ffc93c" class="o2"/>
        <g class="m-eyes"><ellipse cx="48" cy="63" rx="4.5" ry="6.5" fill="#2a2320"/><ellipse cx="72" cy="63" rx="4.5" ry="6.5" fill="#2a2320"/><circle cx="49.5" cy="60" r="1.8" fill="#fff"/><circle cx="73.5" cy="60" r="1.8" fill="#fff"/></g>
        <ellipse cx="40" cy="74" rx="6" ry="3.5" fill="#ff8fa0" opacity=".8"/><ellipse cx="80" cy="74" rx="6" ry="3.5" fill="#ff8fa0" opacity=".8"/>
        <path class="m-mouth-shut" d="M53 76 Q60 83 67 76" fill="none" stroke="#2a2320" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse class="m-mouth-open" cx="60" cy="79" rx="6" ry="5" fill="#e5483b" stroke="#2a2320" stroke-width="2"/>
      </g>
      <g class="m-arm m-arm-r"><path d="M90 98 Q100 120 98 140" fill="none" stroke="#2a2320" stroke-width="15" stroke-linecap="round"/><path d="M90 98 Q100 120 98 140" fill="none" stroke="#2f4a8a" stroke-width="9" stroke-linecap="round"/><circle cx="98" cy="144" r="7" fill="#ffd9b8" class="o2"/><rect class="m-thumb" x="95" y="132" width="6" height="12" rx="3" fill="#ffd9b8" class="o2"/></g>
    </g>`;

  // ---- scenes: the back page of each spread (viewBox 0 0 350 210) ----------------------
  const clouds = `<g class="a-drift"><path d="M30 44 Q30 30 46 32 Q52 18 68 26 Q80 20 84 34 Q98 34 94 46 Z" fill="#fff" class="o2"/></g>
    <g class="a-drift2"><path d="M250 34 Q250 22 264 24 Q270 12 284 20 Q296 16 298 28 Q310 30 306 40 Z" fill="#fff" class="o2"/></g>`;
  const S = {
    street: { floor: "#e2a35f", plank: "#c4843f", body: `
      <rect width="350" height="210" fill="#8fd3ff"/>${clouds}
      <path d="M-10 120 Q40 70 90 112 Q140 60 200 108 Q260 64 360 110 L360 210 L-10 210 Z" fill="#7fcf6b" class="o2"/>
      <rect x="40" y="70" width="270" height="140" fill="#f2c98a" class="o"/>
      <path d="M26 72 L175 30 L324 72 Z" fill="#4a5a7a" class="o"/>
      <path d="M40 72 L310 72 L300 92 L50 92 Z" fill="#fff" class="o2"/>
      <path d="M68 72 L92 72 L86 92 L62 92 Z M116 72 L140 72 L134 92 L110 92 Z M164 72 L188 72 L182 92 L158 92 Z M212 72 L236 72 L230 92 L206 92 Z M260 72 L284 72 L278 92 L254 92 Z" fill="#e5483b"/>
      <rect x="108" y="36" width="134" height="30" rx="6" fill="#8a5a2b" class="o2"/>
      <text x="175" y="57" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="15" fill="#fff4dc">しょうてんがい</text>
      <rect x="64" y="112" width="78" height="56" rx="6" fill="#bfe8ff" class="o"/><path d="M103 112 L103 168 M64 140 L142 140" class="o2"/>
      <rect x="196" y="108" width="80" height="102" fill="#6b3f24" class="o"/>
      <g class="a-noren"><path d="M196 108 L276 108 L276 146 L196 146 Z" fill="#2f4a8a" class="o2"/><path d="M222 108 L222 146 M250 108 L250 146" class="o2"/></g>
      <g class="a-lantern"><path d="M160 96 L160 104" class="ln"/><ellipse cx="160" cy="116" rx="10" ry="13" fill="#e5483b" class="o2"/></g>` },
    shop: { floor: "#e2a35f", plank: "#c4843f", body: `
      <rect width="350" height="210" fill="#f7d9a8"/>
      <path d="M0 18 L350 18 M0 52 L350 52 M0 86 L350 86 M0 120 L350 120" stroke="#e8c088" stroke-width="3"/>
      <rect x="26" y="26" width="120" height="78" rx="6" fill="#3d5a4a" class="o"/>
      <text x="86" y="56" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="14" fill="#fff4dc">メニュー</text>
      <path d="M44 72 L128 72 M44 86 L110 86" stroke="#fff4dc" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <rect x="180" y="58" width="150" height="10" rx="3" fill="#8a5a2b" class="o2"/>
      <path d="M194 58 L196 40 L212 40 L214 58 Z" fill="#fff" class="o2"/><path d="M228 58 L230 36 L250 36 L252 58 Z" fill="#7fc4ff" class="o2"/>
      <path d="M268 58 L270 42 L284 42 L286 58 Z" fill="#ff7b6b" class="o2"/><path d="M300 58 L302 38 L318 38 L320 58 Z" fill="#ffc93c" class="o2"/>
      <g class="a-lamp"><path d="M250 0 L250 82" class="ln"/><path d="M234 96 Q234 80 250 80 Q266 80 266 96 Z" fill="#ffd75e" class="o2"/></g>
      <rect x="0" y="150" width="350" height="60" fill="#c4843f" class="o"/><path d="M0 164 L350 164" stroke="#a96a2c" stroke-width="3"/>` },
    room: { floor: "#d9c27a", plank: "#b9a35a", body: `
      <rect width="350" height="210" fill="#fff0d0"/>
      <path d="M0 150 L350 150" class="ln"/><rect x="0" y="150" width="350" height="60" fill="#f2d8a8"/>
      <rect x="40" y="30" width="110" height="90" fill="#8fd3ff" class="o"/>
      <g class="a-drift"><path d="M56 60 Q56 50 68 52 Q72 42 84 48 Q94 44 96 54 Q106 56 102 64 Z" fill="#fff" class="o2"/></g>
      <path d="M95 30 L95 120 M40 75 L150 75" class="o2"/>
      <g class="a-sway"><path d="M32 22 L62 22 Q54 70 64 128 L32 128 Z" fill="#ff9fb5" class="o"/></g>
      <g class="a-sway2"><path d="M158 22 L128 22 Q136 70 126 128 L158 128 Z" fill="#ff9fb5" class="o"/></g>
      <rect x="210" y="40" width="70" height="52" fill="#fff" class="o"/><path d="M220 82 L240 60 L254 74 L264 64 L272 82 Z" fill="#7fcf6b" class="o2"/><circle cx="262" cy="54" r="6" fill="#ffc93c"/>
      <rect x="200" y="118" width="110" height="10" rx="3" fill="#8a5a2b" class="o2"/>
      <rect x="214" y="98" width="14" height="20" fill="#e5483b" class="o2"/><rect x="230" y="102" width="12" height="16" fill="#3c8ee6" class="o2"/><rect x="244" y="96" width="14" height="22" fill="#3fae5b" class="o2"/>` },
    station: { floor: "#b9b9c4", plank: "#9a9aa6", body: `
      <rect width="350" height="210" fill="#8fd3ff"/>${clouds}
      <path d="M-10 130 Q60 96 140 124 Q220 92 360 126 L360 210 L-10 210 Z" fill="#7fcf6b" class="o2"/>
      <g class="a-train"><rect x="40" y="110" width="200" height="54" rx="14" fill="#fff4dc" class="o"/><rect x="40" y="144" width="200" height="10" fill="#3fae5b" class="o2"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${54 + i * 36}" y="120" width="24" height="18" rx="4" fill="#7fc4ff" class="o2"/>`).join("")}</g>
      <path d="M0 170 L350 170" stroke="#6b6b78" stroke-width="6"/><path d="M0 184 L350 184" stroke="#6b6b78" stroke-width="6"/>
      <rect x="-4" y="20" width="358" height="22" fill="#4a5a7a" class="o"/>
      <path d="M40 42 L40 168 M310 42 L310 168" stroke="#2a2320" stroke-width="10"/><path d="M40 42 L40 168 M310 42 L310 168" stroke="#9a9aa6" stroke-width="5"/>
      <rect x="130" y="50" width="90" height="34" rx="6" fill="#fff" class="o"/><rect x="130" y="74" width="90" height="10" fill="#3fae5b"/>
      <text x="175" y="70" text-anchor="middle" font-family="M PLUS Rounded 1c, sans-serif" font-weight="800" font-size="15" fill="#2a2320">えき</text>` },
    park: { floor: "#9fd67a", plank: "#7fbf5a", body: `
      <rect width="350" height="210" fill="#8fd3ff"/>${clouds}
      <g class="a-spin-slow" style="transform-origin: 300px 50px"><circle cx="300" cy="50" r="22" fill="#ffd75e" class="o2"/></g>
      <path d="M-10 110 Q60 60 130 100 Q200 50 360 96 L360 210 L-10 210 Z" fill="#7fcf6b" class="o2"/>
      <path d="M-10 150 Q90 120 180 146 Q260 120 360 140 L360 210 L-10 210 Z" fill="#5fbf55" class="o2"/>
      <g class="a-sway"><rect x="54" y="100" width="12" height="54" fill="#8a5a2b" class="o2"/><circle cx="60" cy="86" r="28" fill="#3fae5b" class="o"/></g>
      <g class="a-sway2"><rect x="256" y="104" width="12" height="50" fill="#8a5a2b" class="o2"/><circle cx="262" cy="92" r="24" fill="#ffb3c8" class="o"/></g>
      <ellipse cx="170" cy="168" rx="58" ry="14" fill="#7fc4ff" class="o2"/>
      <g class="a-flapfly"><path d="M150 60 Q156 52 162 60 Q168 52 174 60" fill="none" class="ln"/></g>` },
  };

  window.PAPER_ART = { objects: O, mochiko, scenes: S };
})();
