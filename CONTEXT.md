# はなそう (Hanasou) — context primer

## What it is
A mobile-first **Japanese speaking-practice web app**. The core loop is
Pimsleur-style: you see an English prompt, **say the Japanese out loud**, then
reveal the model answer + hear it, and **self-grade** (nope / kinda / got it).
A small spaced-repetition system (SRS) decides when each sentence comes back.
It has since grown into a broader immersion tool.

It's a **personal project** for one learner — not a commercial product. Design
priority: *practical, real sentences you'd actually say* (travel + casual
conversation), not stiff textbook lines. See ROADMAP.md for the content plan.

## How it's built (constraints worth knowing before critiquing)
- **Plain static site. No build step, no framework, no bundler, no npm.** Just
  hand-written HTML/CSS/vanilla JS loaded with `<script>` tags. This is
  intentional — edits are save-and-refresh.
- **All state is client-side** in `localStorage` (progress, streak, known words,
  mined sentences, settings). Optional self-hosted sync API exists but most
  users have no backend/accounts.
- **PWA**: installable, works offline via a service worker (`sw.js`) that
  precaches the shell + audio. Cache is versioned; `index.html` references
  assets with a `?v=NN` query string so a new deploy busts the old cache.
- **Deployed via GitHub Pages** (static hosting).
- **Audio**: pre-generated TTS clips for lesson sentences; falls back to the
  device's `speechSynthesis` voice for anything without a clip (e.g. single
  words/particles).
- Aesthetic: a warm cream/yellow pastel theme, forced regardless of OS dark mode.

## File map (what's in this zip)
- **index.html** — markup for every screen (home, lesson intro, drill, settings,
  mining, import, reader, done).
- **app.js** — *all* the logic: lesson/drill engine, SRS scheduling, audio,
  the word-chip color coding, the reader, sentence mining/import, PWA update
  prompt, and the new **Build-the-sentence** game mode.
- **lessons.js** — all content + structure. `window.LEVELS` defines the
  top-level tabs (Level 1–5, ≈ JLPT N5→N3) → tiers → themes; `window.LESSONS`
  is 58 lessons, each = one grammar point + a small vocab set + sentences. Every
  sentence is pre-tokenized into `words: [{jp, en, pos}]` (pos drives chip
  colors AND powers the Build game).
- **styles.css** — styling, including the level tabs and build chips.
- **sw.js** — service worker (offline cache + versioning).
- **manifest.webmanifest** — PWA manifest.
- **ROADMAP.md** — the N5→N1 content plan and the "useful over textbook"
  philosophy.

*Not included (irrelevant to a code/design review):* `vendor/` (third-party
Kuromoji tokenizer + JMdict dictionary + Leeds frequency list, ~21 MB), `audio/`
(~7 MB of clips), icons, and `prompts.js` (an older standalone-drill data file
still in the repo but no longer loaded by index.html).

## Main features
- **Levels → tiers → themes → lessons** map on the home screen (tabs).
- **Drill** with SRS; two directions (produce / recognize / both).
- **Build-the-sentence** game mode (newest feature): from a lesson, instead of
  recalling from memory, you assemble the answer by tapping its words from a
  scrambled chip bank into order — green when a chip is in the right spot, red +
  shake when wrong; tapping a chip also speaks it; solving reveals + plays the
  sentence and feeds the same SRS grade.
- **Reader**: paste any Japanese text; words are colored known/unknown; tap to
  look up, mark known, or mine the sentence into reviews.
- **Sentence mining + import** (Migaku/Anki/CSV) into your own SRS deck.
- **Immersion-hours tracker**, **known-word count + weekly growth**, daily-goal
  ring, streak, mastery %.

## What kind of feedback would help
Open-ended — but especially: the learning-design soundness (does the loop build
real speaking ability?), UX of the Build mode, code structure/maintainability of
the single big `app.js`, and any engagement/gamification ideas. Keep in mind the
hard constraint: it must stay a buildless, dependency-free static site.
