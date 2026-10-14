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
- **Every pop-up matches its page** (`scenes.js`, hand-authored per lesson
  and per sentence — never guessed from words). Layers, back to front, in a
  fixed order so nothing swaps while rising:
  1. The lesson's postcard. If it isn't drawn yet, the section's backdrop
     stands in.
  2. The lesson's world: props for its situation.
  3. もち子, the only character.
  4. What this sentence literally names, with its attributes: a blue house
     only when it says blue, a big house bigger, "two coffees" as two cups.

  Pictures not drawn yet simply don't appear, never a wrong substitute.
  `docs/LIVING_CITY_ART_PROMPTS.md` lists each one as a ready-to-paste
  green-screen prompt. Rebuild both files with
  `node tools/build_living_city_scenes.mjs <dir of scene JSON>`.
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
