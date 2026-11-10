# Hanasou — The Pop-up Book (`/living-city/`)

Learn each page in the book, answer when someone speaks to you, keep it on the
drive. One set of sentences, one review schedule, three ways in. No build step.

## The look
A hardcover Japanese book with paper engineering inside: indigo cloth cover
with a pasted title slip, warm white paper, sumi ink, one vermilion seal.
English is set in a book face (Alegreya / Alegreya Sans), Japanese in a
textbook pen hand (Klee One), both from Google Fonts with system fallbacks
offline. Paper details carry the "book": the grammar point is a note taped to
the page, the answer is a slip pulled out from under it, finished pages get a
済 seal and a perforated stamp in the Journal. Controls stay quiet: one frosted
action bar, a floating tab bar, soft shadows, spring presses, screens that push
and pop, and the page-turn leaf between pages. The watercolor pop-up stage and
the word colours are unchanged.

## Book (eyes on)
Home is one **Continue** card on your next page, two tiles (Drive,
Encounters), a slim banner when lines are due for a second look, and the
contents (Levels 0–7 = chapters, lessons = pages, nothing locked). Side trips
(the 15 Speaking Studio conversations) are folded under the contents.

A page is **one continuous flow** with one action bar at the bottom and a
segmented progress bar at the top. A short card bridges the steps, and you can
stop at any of them.

| Step | What you do |
|---|---|
| Meet the page | See the picture, hear the sentence, tap the words. No test. |
| 1 · Recall | Read the meaning, say it, reveal, grade yourself. |
| 2 · Listen & Notice | No text: hear it, tap the picture it's about. A wrong picture says its own word. Sentences with no picture offer three meanings. |
| 3 · Pattern Lab | A sentence you know as chips with one slot lit: pick the piece that makes the new sentence, then say it. Only pairs of real sentences from the same lesson. Lessons with no pair assemble a sentence from its chips. |
| 4 · In the Moment | The lesson's hand-written scene: she speaks, you answer out loud, then a model reply appears in your bubble. No multiple choice. |

## Encounters (forming sentences on the spot)
Someone speaks to you in Japanese first. You answer in Japanese, out loud.
Then you see one way to say it, **and what she meant in English**. Six at a
time, shuffled, drawn from the hand-written scenes of every page you've
started (the everyday side trips fill in before that). Her English stays
hidden until you've answered, with a "What did she say?" button if you're
stuck.

## From the flashcards
- Every word is a chip with **its meaning under it** and its role named.
- Chips and the sentence itself are **colour-coded by word role**, with the
  main app's exact colours (blue = noun everywhere). The key is in the Journal.
- Tap a chip to hear the word; **↗ opens it on Jisho**.

## Drive
One tap, then it keeps going on its own until you stop.

1. **Your lines first:** up to 12 lines you've practised in the book, due
   ones first, mixed three ways:
   - **Say it** — the meaning → you say the Japanese.
   - **Understand it** — the Japanese → you say what it means.
   - **Answer her** — her line → you reply in Japanese (every third card).
2. **Then lesson after lesson** from the car bookmark (`state.drivePos`),
   with a chime between lessons. Lines you know are drilled, new ones are
   introduced, then the lesson's conversation. It picks up there next time.

Two ways to drive it (`state.settings.driveMode`, remembered):

- **Hands-free** (default): everything is spoken, with gaps for you to
  speak. *English cue* (default) speaks the meaning or what to answer;
  *Japanese only* speaks no English. Weak lines get a slow replay and come
  back a few lines later. Steering-wheel and Bluetooth buttons work (Media
  Session API): play/pause, ⏭ = knew it, ⏮ = again. No input counts as
  "almost". The car display shows the Japanese line. A silent loop holds the
  media session between clips.
- **Touch** (for a mounted phone): one big dark card. The Japanese is read
  aloud; say your answer; **tap anywhere** to check (each word appears with
  its meaning under it); then **Again / Got it**, by big pad or by swipe
  (← again, → got it). New lines are shown with their words explained and a
  single Next. Nothing is spoken in English. The wheel buttons work here too
  (⏭ = check / got it, ⏮ = hear it / again).

When you end the drive: the lines you practised, tap one to flag it hard.
`/living-city/#drive` opens straight on the Drive screen, one tap from
driving, so it works as a home-screen shortcut.

The hands-free English cue uses the device's English voice and is the one
place English is spoken. The main app's rule (English is never spoken) is
unchanged. Not yet tested on a real phone or car.

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
- Icons are one inline SVG line set in `app.js` (`ICON`). No emoji, no icon
  font.

## Tests and deploys
`node tools/smoke_living_city.mjs` plays a whole page, a side trip, an
encounter, two hands-free drives and a touch drive in jsdom. It is part of
the deploy gate.

The root service worker also caches `/living-city/` files and serves them
cache-first. When you change `app.js`, `data.js`, `scenes.js` or `styles.css`,
bump their `?v=` stamp in `index.html`.
