# Hanasou — The Pop-up Book (`/living-city/`)

The Living City preview, rebuilt as an illustrated pop-up book on top of the
Speaking Studio's engine. Open it at `/living-city/` on GitHub Pages. No build
step.

## The book
- **Cover → Contents.** The cover shows on the first visit only. After that the
  book opens at the contents: a bookmark ribbon on your next page, then the
  table of contents (Levels 0–7 = chapters, lessons = pages). There's also an
  appendix, **Side trips**, with the 15 Speaking Studio conversations.
- **Every page is read four ways** (in order, but nothing is locked):
  1. **Recall** — English prompt → say it → pull the tab → hear it → grade.
  2. **Listen & Notice** — audio first. Pick the meaning. The picture only
     pops up after you answer, so it can't give the answer away.
  3. **Pattern Lab** — start from a sentence you know and swap a piece. It only
     pairs two sentences that already exist in the same lesson (differing in
     1–2 content words of the same part of speech), so it never invents
     Japanese. The Studio's two lesson-tagged transforms are included. Lessons
     with no such pair fall back to assembling the sentence from its chips.
  4. **In the Moment** — the lesson's hand-written scene from `window.SCENES`.
     Her line plays in a speech bubble, you answer out loud, then pick from
     real lines. Level 0 uses the Studio's "First meeting".
- **Paper Mario art, drawn in code** (`paper-art.js`). Every picture is flat
  SVG paper: 85 cut-outs (one for every `data.js → art` target), five
  papercraft scenes (street, shop, room, station, park; picked per lesson
  section in `data.js → backdrops`) and もち子 as a poseable paper puppet. No
  raster art and no AI art, so every piece matches. A new object is one
  `add(key, viewBox, size, markup)` entry with `class="o"` ink outlines. The
  CSS adds the white die-cut edge.
- **What moves.** The scene stands up from the fold and the cut-outs spring
  up after it, then wobble on their paper tabs. Before each page turn they
  fold flat, and a leaf sweeps across. もち子 breathes, blinks and flips
  edge-on to change pose (think / thumbs / cheer / wave), and hops when you
  get one. Her mouth flaps whenever Japanese audio plays. Speech bubbles pop
  and type out. Tapping a cut-out twirls it and says its word. Every scene has
  ambient life: drifting clouds, steam, a swinging lantern, trains passing,
  spinning clock hands, a wagging tail, rain, falling petals. The answer slip
  slides out with a wobble, wrong choices shake and right ones hop. The hanko
  slams down. Paper confetti falls only when a chapter page gets stamped.
  Reduced motion turns all of it off.
- **Driving mode** (🚗 on the contents). The page plays hands-free and
  Japanese-only: listen → say it back → hear it again slowly. Conversations
  go her line → your reply gap → a model reply. English is never spoken and
  nothing is graded.
- **Journal.** A forgiving week of dots (no streak), real tallies, a second
  look at due cards, and a stamp for every page you finish all four readings
  of.

## Engine
- Content: `../lessons.js` + `../studio-preview/content-overrides.js` (the
  Studio's language QA fixes) + `data.js` (Studio transforms + conversations,
  the art map, the backdrop map).
- Audio: the recorded VOICEVOX clips via `../audio/manifest.json`, falling back
  to the device's Japanese voice.
- Progress: the Studio's SRS, stored in `localStorage` under
  `hanasou.book.v1`. Your Studio review history is copied in once on the first
  visit. The main app's `hanasou.v4` is never read or written.

## Tests
`node tools/smoke_living_city.mjs` (jsdom) reads through the whole book. It is
part of the deploy gate in `.github/workflows/deploy.yml`.

## Deploying changes
The root app's service worker also caches `/living-city/` files, and it serves
them from the cache first. When you change `app.js`, `data.js` or
`styles.css`, bump their `?v=` stamp in `index.html`. Otherwise the first load
after a deploy can pair the new page with the old script.
