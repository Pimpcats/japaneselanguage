# Hanasou — The Pop-up Book (`/living-city/`)

Learn each page in the book, keep it on the drive. One set of sentences, one
review schedule, two ways in. No build step.

## Book (eyes on)
Home is one **Continue** button on your next page, a Drive tile, a Second look
tile (due lines), and the contents (Levels 0–7 = chapters, lessons = pages,
nothing locked). Side trips (the 15 Speaking Studio conversations) are folded
under the contents.

A page is **one continuous flow** with one action bar at the bottom. A short
stamp card bridges the steps, and you can stop at any of them.

| Step | What you do |
|---|---|
| Meet the page | See the picture, hear the sentence, tap the words. No test. |
| 1 · Recall | Read the meaning, say it, reveal, grade yourself. |
| 2 · Listen & Notice | No text: hear it, tap the picture it's about. A wrong picture says its own word. Sentences with no picture offer three meanings. |
| 3 · Pattern Lab | A sentence you know as chips with one slot lit: pick the piece that makes the new sentence, then say it. Only pairs of real sentences from the same lesson. Lessons with no pair assemble a sentence from its chips. |
| 4 · In the Moment | The lesson's hand-written scene: she speaks, you answer out loud, then a model reply appears in your bubble. No multiple choice. |

## From the flashcards
- Every word is a chip with **its meaning under it** and its role named.
- Chips and the sentence itself are **colour-coded by word role**, with the
  main app's exact colours (blue = noun everywhere). The key is in the Journal.
- Tap a chip to hear the word; **↗ opens it on Jisho**.

## Drive (eyes off)
Built only from lines you've practised in the book, due ones first (12 a
drive). Nothing learned yet: it plays a first listen of your next page.

- **English cue** (default): hear the meaning → a gap to say the Japanese →
  hear the answer → say it again. Weak lines get a slow replay and come back a
  few lines later.
- **Japanese only**: listen → say it back → slowly → again.
- Some lines become a swap drill (sentence, then the new word, you say the new
  sentence). A drive ends with a short conversation from a finished page.
- **Grading without touching the phone:** media keys. ⏭ = knew it (it won't
  repeat), ⏮ = again (it comes back). No input counts as "almost". A silent
  loop holds the media session so wheel buttons reach the page. Not yet tested
  on a real phone or car.
- When you park: the lines you practised, tap one to flag it hard.

The English cue uses the device's English voice and is the one place English
is spoken. The main app's rule (English is never spoken) is unchanged.

## Pictures
`scenes.js` is hand-authored per lesson and per sentence, so every pop-up
matches its page. Layers are flat and in a fixed order (postcard, the
lesson's world, もち子, the page's props, bubbles), so nothing swaps while
rising. Art not drawn yet is skipped. `docs/LIVING_CITY_ART_PROMPTS.md` lists
it as ready-to-paste prompts. Rebuild both with
`node tools/build_living_city_scenes.mjs docs/living-city-scenes`.

## Engine
- Content: `../lessons.js`, `../studio-preview/content-overrides.js`,
  `data.js` (Studio transforms + conversations, section backdrops).
- Audio: recorded VOICEVOX clips via `../audio/manifest.json`, falling back to
  the device's Japanese voice.
- Progress: the Studio's SRS in `localStorage` under `hanasou.book.v1`. The
  main app's `hanasou.v4` is never read or written.

## Tests and deploys
`node tools/smoke_living_city.mjs` plays a whole page, a side trip and two
drives in jsdom. It is part of the deploy gate.

The root service worker also caches `/living-city/` files and serves them
cache-first. When you change `app.js`, `data.js`, `scenes.js` or `styles.css`,
bump their `?v=` stamp in `index.html`.
