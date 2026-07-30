// Build the printable curriculum-review document from lessons.js.
//
//   node tools/gen_curriculum_review.mjs                 → writes review.html next to it
//   node tools/gen_curriculum_review.mjs --pdf out.pdf   → also renders a PDF
//
// The PDF is what gets handed to a Japanese teacher: every lesson in teaching
// order with its grammar point, vocab and sentences, plus a ruled notes column
// beside each lesson and OK/Fix tickboxes so corrections land next to the thing
// they refer to. Lives in the repo (not a temp dir) so it stays reproducible.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

// lessons.js is a browser file: give it a window and eval it.
globalThis.window = {};
new Function(readFileSync(resolve(ROOT, "lessons.js"), "utf8"))();
const { LEVELS, LESSONS } = globalThis.window;
const ALL = Array.isArray(LESSONS) ? LESSONS : Object.values(LESSONS);

const esc = (s) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// kanji[reading] → kanji（reading）
const furi = (s) =>
  esc(String(s || "").replace(/([一-鿿々〆ヶ぀-ゟ゠-ヿ]+)\[([^\]]+)\]/g, "$1（$2）"));
const POS = { n: "noun", v: "verb", adj: "adj", adv: "adv", prt: "particle",
              cop: "copula", expr: "expr", aux: "aux", conj: "conj" };

let vocabCount = 0, sentenceCount = 0;
for (const l of ALL) {
  vocabCount += (l.vocab || []).length;
  sentenceCount += (l.sentences || []).length;
}

const out = [];
const w = (s) => out.push(s);

w('<!doctype html><html lang="en"><head><meta charset="utf-8">');
w('<meta name="viewport" content="width=device-width,initial-scale=1">');
w("<title>はなそう · Curriculum Review</title>");
w("<style>" + css() + "</style></head><body>");

// ---- cover ---------------------------------------------------------------
w('<section class="cover">');
w('<p class="eyebrow">Curriculum review</p>');
w('<h1><span class="jp-mark">はなそう</span><span class="rom">Hanasou</span></h1>');
w('<p class="lede">A speaking-first Japanese course. The learner reads the <strong>English</strong>, says it aloud in <strong>Japanese</strong>, then reveals the answer and self-grades. Every lesson follows, in teaching order.</p>');
w('<div class="reviewer-note"><span class="rn-label">How to use this document</span>');
w("<p>Please flag anything that reads wrong: unnatural phrasing, an inconsistent or incorrect politeness level, particle mistakes, wrong readings (romaji / furigana), or vocabulary that doesn’t belong to the lesson’s grammar point. Each lesson teaches <em>one</em> grammar point; its sentences should only recombine that point with its listed vocab.</p>");
w('<p class="rn-how">Every lesson has a <strong>notes column</strong> on the right. Tick <strong>OK</strong> if it reads fine or <strong>Fix</strong> if something needs changing, and write the correction beside it — numbers in the notes refer to the numbered sentences. There is a page for general comments at the end. Kanji readings appear in parentheses, e.g. 会議（かいぎ）.</p></div>');
w('<dl class="scope"><div><dt>Levels</dt><dd>8</dd></div><div><dt>Lessons</dt><dd>' + ALL.length + "</dd></div><div><dt>Vocab</dt><dd>" + vocabCount + "</dd></div><div><dt>Sentences</dt><dd>" + sentenceCount + "</dd></div></dl>");
w('<table class="toc"><tbody>');
LEVELS.forEach((lv, i) => {
  const count = (lv.tiers || []).reduce(
    (a, t) => a + (t.themes || []).reduce((b, th) => b + ALL.filter((x) => x.section === th).length, 0), 0);
  w('<tr><td class="tl">Level ' + i + "</td><td>" + esc(lv.title || lv.name || "") + '</td><td class="tc">' + count + " lessons</td></tr>");
});
w("</tbody></table></section>");

// ---- levels --------------------------------------------------------------
let n = 0;
LEVELS.forEach((lv, i) => {
  w('<section class="level">');
  w('<div class="level-band"><span class="level-num">Level ' + i + "</span><h2>" + esc(lv.title || lv.name || "") + "</h2></div>");
  (lv.tiers || []).forEach((t) => {
    w('<h3 class="tier">' + esc(t.title || t.name || "") + "</h3>");
    (t.themes || []).forEach((theme) => {
      const lessons = ALL.filter((x) => x.section === theme);
      if (!lessons.length) return;
      w('<p class="theme">' + esc(theme) + "</p>");
      for (const l of lessons) {
        n++;
        w('<article class="lesson"><div class="lbody">');
        w('<div class="lh"><span class="lnum">' + n + '</span><h4>' + esc(l.title) + "</h4><code>" + esc(l.id) + "</code></div>");
        if (l.grammar) w('<p class="grammar"><span class="g-label">Grammar</span> <span class="g-point">' + furi(l.grammar) + "</span></p>");
        if (l.grammarNote) w('<p class="gnote">' + furi(l.grammarNote) + "</p>");
        if ((l.vocab || []).length) {
          w('<table class="vocab"><thead><tr><th>Japanese</th><th>Reading</th><th>English</th><th>POS</th></tr></thead><tbody>');
          for (const v of l.vocab)
            w('<tr><td class="jp">' + furi(v.jp) + '</td><td class="rom">' + esc(v.romaji) + "</td><td>" + esc(v.en) + '</td><td class="pos">' + esc(POS[v.pos] || v.pos || "") + "</td></tr>");
          w("</tbody></table>");
        }
        if ((l.sentences || []).length) {
          w('<ol class="sentences">');
          for (const s of l.sentences)
            w('<li><span class="en">' + esc(s.en) + '</span><span class="jp">' + furi(s.jp) + '</span><span class="rom">' + esc(s.romaji) + "</span></li>");
          w("</ol>");
        }
        w("</div>");
        w('<aside class="notes"><div class="n-head"><span class="n-label">Notes</span>' +
          '<span class="n-ticks"><span class="tick"></span>OK <span class="tick"></span>Fix</span></div>' +
          '<div class="n-lines"></div></aside>');
        w("</article>");
      }
    });
  });
  w("</section>");
});

// ---- general comments ----------------------------------------------------
w('<section class="general"><h2>General comments</h2>');
w('<p class="gsub">Anything that applies across the course — pacing, level ordering, register, romaji style, words you would add or cut.</p>');
w('<div class="g-lines"></div></section>');
w("</body></html>");

const htmlPath = resolve(HERE, "curriculum-review.html");
writeFileSync(htmlPath, out.join("\n"));
console.log("html:", htmlPath, "— lessons:", n, "vocab:", vocabCount, "sentences:", sentenceCount);

// ---- optional PDF --------------------------------------------------------
const pdfFlag = process.argv.indexOf("--pdf");
if (pdfFlag !== -1) {
  const pdfPath = resolve(process.cwd(), process.argv[pdfFlag + 1] || "curriculum-review.pdf");
  const { chromium } = await import("playwright");
  // This sandbox ships a Chromium build that may not match playwright's pinned
  // revision, so use the installed binary rather than downloading one.
  const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
  const launch = {};
  try { readFileSync(CHROME); launch.executablePath = CHROME; } catch {}
  const browser = await chromium.launch(launch);
  const page = await browser.newPage();
  await page.goto("file://" + htmlPath, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0.7in", bottom: "0.75in", left: "0.6in", right: "0.6in" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:8pt;color:#7d766c;padding:0 0.6in;display:flex;justify-content:space-between;">' +
      "<span>はなそう · Hanasou — curriculum review</span>" +
      '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  });
  await browser.close();
  console.log("pdf:", pdfPath);
}

function css() {
  return `
@page { size: Letter; margin: 0.7in 0.6in 0.75in; }
:root{
  --paper:#ffffff; --ink:#1c1a17; --muted:#55504a; --faint:#7d766c;
  --rule:#d9d3c6; --line:#cfc8ba; --tint:#f5f1e8; --accent:#a5301f;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  --sans:"Helvetica Neue",Helvetica,Arial,sans-serif;
  --jp:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",YuGothic,Meiryo,"Noto Sans JP","MS PGothic",IPAPGothic,IPAGothic,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:10pt;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.jp,.jp-mark{font-family:var(--jp);}

.cover{break-after:page;padding-top:1.1in;}
.eyebrow{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:700;margin:0 0 .5rem;}
h1{font-family:var(--serif);font-weight:600;margin:0 0 1rem;line-height:1.05;display:flex;flex-direction:column;gap:.1rem;}
h1 .jp-mark{font-size:34pt;}
h1 .rom{font-size:13pt;letter-spacing:.22em;text-transform:uppercase;color:var(--faint);font-family:var(--sans);font-weight:400;}
.lede{font-size:11pt;max-width:34em;margin:0 0 1.1rem;}
.reviewer-note{background:var(--tint);border:1px solid var(--rule);border-left:3px solid var(--accent);padding:.75rem .9rem;margin:0 0 1.2rem;max-width:40em;}
.rn-label{display:block;font-size:7.5pt;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:.35rem;}
.reviewer-note p{margin:0 0 .5rem;font-size:9.5pt;color:var(--muted);}
.reviewer-note p:last-child{margin-bottom:0;}
.reviewer-note em{color:var(--ink);}
.rn-how{border-top:1px solid var(--rule);padding-top:.5rem;}
.scope{display:flex;gap:2.4rem;margin:0 0 1.5rem;padding:.7rem 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);}
.scope div{display:flex;flex-direction:column;}
.scope dt{font-size:7.5pt;letter-spacing:.13em;text-transform:uppercase;color:var(--faint);}
.scope dd{margin:0;font-family:var(--serif);font-size:16pt;color:var(--accent);font-variant-numeric:tabular-nums;}
table.toc{width:100%;border-collapse:collapse;max-width:34em;}
table.toc td{padding:.3rem 0;border-bottom:1px dotted var(--rule);font-size:10pt;vertical-align:baseline;}
table.toc .tl{white-space:nowrap;color:var(--accent);font-weight:700;font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;width:5.5em;}
table.toc .tc{text-align:right;color:var(--faint);white-space:nowrap;font-variant-numeric:tabular-nums;}

.level{break-before:page;}
.level-band{border-bottom:2px solid var(--ink);padding-bottom:.35rem;margin-bottom:.9rem;}
.level-num{display:block;font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:700;}
.level-band h2{font-family:var(--serif);font-weight:600;font-size:19pt;margin:.1rem 0 0;line-height:1.1;}
.tier{font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:1.1rem 0 .1rem;break-after:avoid;}
.theme{font-family:var(--serif);font-style:italic;font-size:11pt;color:var(--faint);margin:.5rem 0 .2rem;break-after:avoid;}

/* lesson + its notes column ride in one unbreakable block */
.lesson{display:grid;grid-template-columns:1fr 1.55in;gap:.55rem;
  border:1px solid var(--rule);border-radius:5px;padding:.6rem .7rem;margin:.5rem 0;break-inside:avoid;}
.lh{display:flex;align-items:baseline;gap:.45rem;flex-wrap:wrap;margin-bottom:.25rem;}
.lnum{font-family:var(--serif);font-size:8.5pt;color:#fff;background:var(--accent);min-width:1.35em;height:1.35em;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums;}
.lh h4{font-family:var(--serif);font-weight:600;font-size:12.5pt;margin:0;flex:1;}
.lh code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:7.5pt;color:var(--faint);}
.grammar{margin:.1rem 0 .15rem;font-size:9.5pt;}
.g-label{font-size:7.5pt;letter-spacing:.13em;text-transform:uppercase;color:var(--faint);margin-right:.35rem;}
.g-point{font-family:var(--jp);color:var(--accent);font-weight:600;}
.gnote{margin:.1rem 0 .5rem;font-size:9pt;color:var(--muted);}

table.vocab{width:100%;border-collapse:collapse;font-size:9pt;margin:.25rem 0 .5rem;}
table.vocab th{text-align:left;font-size:7pt;letter-spacing:.11em;text-transform:uppercase;color:var(--faint);font-weight:700;border-bottom:1px solid var(--rule);padding:.15rem .45rem .15rem 0;}
table.vocab td{padding:.14rem .45rem .14rem 0;border-bottom:1px solid #eeeae0;vertical-align:top;}
table.vocab tr:last-child td{border-bottom:0;}
table.vocab td.jp{font-family:var(--jp);font-size:10.5pt;white-space:nowrap;}
table.vocab td.rom{color:var(--muted);font-style:italic;white-space:nowrap;}
table.vocab td.pos{color:var(--faint);font-size:8pt;white-space:nowrap;}

ol.sentences{list-style:none;counter-reset:s;margin:.2rem 0 0;padding:0;}
ol.sentences li{counter-increment:s;position:relative;padding:.32rem 0 .32rem 1.5em;border-top:1px dotted var(--rule);break-inside:avoid;}
ol.sentences li:first-child{border-top:1px solid var(--rule);}
ol.sentences li::before{content:counter(s);position:absolute;left:0;top:.32rem;font-size:8pt;color:var(--faint);font-variant-numeric:tabular-nums;}
ol.sentences .en{display:block;color:var(--muted);font-size:9.5pt;}
ol.sentences .jp{display:block;font-family:var(--jp);font-size:12.5pt;line-height:1.45;margin:.02rem 0;}
ol.sentences .rom{display:block;color:var(--faint);font-style:italic;font-size:8.5pt;}

/* ---- notes column ---- */
.notes{border-left:1px dashed var(--rule);padding-left:.5rem;display:flex;flex-direction:column;min-height:1.1in;}
.n-head{display:flex;flex-direction:column;gap:.12rem;margin-bottom:.2rem;}
.n-label{font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);font-weight:700;}
.n-ticks{font-size:7.5pt;color:var(--muted);display:flex;align-items:center;gap:.25rem;}
.tick{display:inline-block;width:8pt;height:8pt;border:0.75pt solid var(--muted);border-radius:1.5pt;}
.n-lines{flex:1;min-height:.75in;
  background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(0.2in - 0.5pt),var(--line) calc(0.2in - 0.5pt),var(--line) 0.2in);}

/* ---- general comments page ---- */
.general{break-before:page;}
.general h2{font-family:var(--serif);font-weight:600;font-size:19pt;margin:0;border-bottom:2px solid var(--ink);padding-bottom:.35rem;}
.gsub{font-size:9.5pt;color:var(--muted);margin:.5rem 0 .8rem;max-width:36em;}
.g-lines{height:8.2in;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(0.28in - 0.5pt),var(--line) calc(0.28in - 0.5pt),var(--line) 0.28in);}
`;
}
