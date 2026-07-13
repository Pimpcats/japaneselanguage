# はなそう (Hanasou) — Project Bible

Read this before touching anything. It applies to any AI agent or human working
on this repo. It encodes decisions already made with the owner — don't relitigate
them, extend them.

## What this is

A kawaii-themed Japanese speaking PWA for one learner (the owner), built around
**speaking out loud**: English prompt → say it in Japanese → reveal, hear the
model answer, self-grade into a light SRS. Static site, no build step, no
framework — plain HTML/CSS/JS served from GitHub Pages, installable, works
fully offline.

**The product's soul:** a cozy Japanese shop-street. Warm, hand-drawn, playful —
never corporate, never noisy. Learning is the point; charm is the vehicle.

## Non-negotiable principles

1. **Speaking first.** Every feature should push the learner to produce Japanese
   out loud. Reading/tapping is support, not the goal.
2. **Fun, not gamified.** Rewards are *meaning made visible* (stamps for places
   visited, a street that comes alive), never points-for-points' sake. No XP,
   no leaderboards, no lives, no countdown timers, no artificial scarcity.
   Celebrations are rare enough to stay special.
3. **Japanese accuracy over convenience.** Grammar function-words (です, ます,
   から, ください, まで, とき…) are taught as grammar points, NOT added to vocab
   lists. Any word *named in a lesson's description* must actually appear in its
   taught vocab. Sentences follow the lesson's single grammar point.
4. **Quiet UI.** One idea per screen. Condense, nest, remove. The owner has
   repeatedly asked for fewer labels, fewer bars, tighter spacing. When in
   doubt, remove the element.
5. **Nothing breaks.** The app is live and used daily. Deploys must never leave
   the site broken or silent (see the audio re-voice procedure below).

## Architecture (all vanilla, no build)

| File | Role |
|---|---|
| `index.html` | All screens as `<section class="screen">`, shown/hidden by `app.js` |
| `app.js` | Core logic: cards, SRS, drill, build mode, speaking quiz, mining, reader, sync. One IIFE; init runs at the bottom (`renderHome()`), so declaration order matters |
| `lessons.js` | ALL content: `window.LEVELS` (levels→tiers→themes) + `window.LESSONS` (vocab + sentences with word breakdowns) + `window.VERBS` |
| `theme.js` | Additive kawaii layer: header banner + control bar (moves `#back-btn`, `#card-counter`, `#mastery`, `#topbar-right` into `#ctrl-bar`), confetti/jingle FX (`window.HanaFX`), MP3 reward sounds with synth fallback. Uses MutationObservers on screen `[hidden]` attrs — it never patches app.js functions |
| `theme.css` | The entire visual theme, layered over `styles.css` base. `styles.css` is the old plain look; prefer overriding in `theme.css` |
| `collection.js` | Self-contained sticker/stamp add-on; listens to the `hanasou:finish` CustomEvent |
| `sw.js` | Service worker: `CACHE = "hanasou-vNN"`, precaches shell + all audio, network-first for navigations & `audio/manifest.json`, SWR for the rest |
| `tools/gen_audio.mjs` | Build-time VOICEVOX synthesis (see Audio) |
| `mock/` | A copy of the theme for design preview; `mock/theme.css` is GENERATED from `theme.css` (see deploy ritual) |

State: everything in `localStorage` (`hanasou.v4` progress, `hanasou.settings`),
optional token-based blob sync to a VPS at `/api/progress` with field-level merge.

## The deploy ritual (do all of it, every visual/JS change)

1. Edit `theme.css` / `app.js` / etc.
2. `node --check app.js` (and any other JS you touched), AND the runtime smoke
   test: `npm i --no-save jsdom && node tools/smoke.mjs` — it boots the app in
   jsdom and clicks through home → lesson → talk. A v93 deploy shipped a
   ReferenceError that node --check can't catch; the smoke test exists so that
   never happens again.
3. Sync the mock: `sed 's#url("assets/#url("../assets/#g' theme.css > mock/theme.css`
4. Bump the version **everywhere it appears**: `?v=NN` in `index.html` (6 places)
   and `hanasou-vNN` in `sw.js`. They move together.
5. Commit with a plain, descriptive message. Push to the working branch AND the
   deploy branch (see Branches).

Skipping the bump means users keep the stale cached version. Skipping the mock
sync makes the design preview drift.

## Branches & hosting

- **`main`** is canonical (site + CI). GitHub Pages publishes via the
  **test-gated deploy workflow** (`.github/workflows/deploy.yml`): every push
  to main runs node --check + the jsdom smoke test + the lessons linter, and
  only publishes if all pass — a broken build leaves the site on the last good
  version. The repo is private (owner has Pro).
- Legacy branches `claude/*` are being retired; `claude/amazing-cannon-PPvmw`
  was the old Pages/deploy branch. Don't create new long-lived branches.
- The "art assets" commits on `claude/inspiring-carson-712EI` are CORRUPTED
  (binaries pushed through a text pipeline — every high byte is EF BF BD, same
  pixel dimensions as current art). Verified 2026-07-02: nothing mergeable;
  the branch is safe to delete.
- Live URL: https://pimpcats.github.io/japaneselanguage/
- The GitHub MCP/API in cloud sessions can't delete branches or change repo
  settings — those are owner dashboard actions. Say so instead of retrying.

## Audio (the part that's easiest to break)

Pipeline: `lessons.js` strings → `tools/gen_audio.mjs` → VOICEVOX engine →
`audio/<sha1-of-text>.mp3` + `audio/manifest.json` → `speak()` in app.js plays
the clip, falling back to device `speechSynthesis` if missing.

- **Voice:** もち子さん, VOICEVOX speaker **20** (set in `gen-audio.yml` and the
  script default). The owner picks the voice — never change it unprompted.
- **Clip filenames hash the TEXT ONLY.** Changing the voice does NOT regenerate
  clips — you must delete `audio/*.mp3` first, or the old voice is silently
  reused. This is the #1 trap.
- CI (`.github/workflows/gen-audio.yml`) runs on pushes to `main` touching
  `lessons.js` / the tool / the workflow: spins up VOICEVOX in Docker,
  synthesizes only missing clips, auto-bumps `sw.js`, commits with `[skip ci]`.
  A full re-voice of ~1,470 clips takes ~30–45 min.
- **Re-voice procedure (zero-downtime):** change speaker + delete clips on a
  branch the live site is NOT serving, let CI regenerate there, only then point
  the site at it. Never leave the live branch with deleted clips.
- Every tappable word chip has its own clip so taps never fall back to the
  robotic device voice. New sentences must come with `words:[]` breakdowns.
- English is NEVER spoken aloud. Japanese audio only.

## Kana & the beginner road (kana.js + app.js)

- **Level 0 · First sounds** is the true-beginner on-ramp: 11 micro-lessons,
  one gojūon row each (5 letters + ≤10 words a day — the owner's pacing rule),
  every word/sentence spellable with ONLY letters taught so far (a checker
  enforced this at authoring time — keep the constraint when editing), building
  letters → words → adjective exclamations → は-sentences → これは とり。 →
  the てんてん lesson that unlocks です and hands off to Level 1.

- `kana.js` holds the full gojūon (hiragana + katakana + dakuten rows) with
  romaji; every letter has its own もち子さん clip.
- Each lesson INTRODUCES the kana its content uses for the first time
  (computed from curriculum order, never hand-authored) — shown as a tappable
  "New sounds" strip on the lesson intro.
- `prog.kana` tracks letter strength: finishing a lesson (or tapping/answering
  in Kana practice) marks its letters seen.
- **Romaji fades automatically** (settings.kanaMode = "auto", the default): a
  word shows romaji only while it contains a letter the learner hasn't met.
  "always"/"never" override. Never remove this weaning mechanic.
- The あア Kana section (Home) has the browse grid (tap to hear) and a
  practice drill (letter → pick the sound, weak letters weighted heavier).
- **Alphabet-over-letters** (2026-07, replaces the in-drill interludes): in car
  mode (the only mode now) the model answer draws each kana's romaji right over
  it as ruby (`driveAnswerHTML` → `moraRunHTML`, grouped by mora: きょ→kyo,
  っか→kka), so the alphabet is taught in place as the sentence is read. This
  superseded the old spell-it / sound interludes, which were removed when car
  mode became universal (`startLesson` no longer inserts `kanaBuild`/`kanaSound`
  cards; those renderers remain only for the standalone あア Kana practice).

## Content rules (lessons.js)

- Shape: `{ id, section, title, grammar, grammarNote, vocab:[{jp,romaji,en,pos}],
  sentences:[{en, jp, romaji, hint?, words:[{jp,en,pos}]}] }`. A lesson teaches
  ONE grammar point; sentences recombine its vocab.
- Sentence `jp` is kana-first (spaces between phrases). Kanji only with
  `kanji[reading]` furigana brackets.
- Every content word used in sentences should exist in some lesson's vocab
  (orphan check), and every word the grammarNote names must be taught. Grammar
  glue (です/ます/particles) stays out of vocab — it's taught by the note.
- `pos` values: n, v, adj, adv, prt, cop, expr, aux, conj — they drive the
  colour-coding; get them right.
- Adding/renaming lessons: `section` must match a theme listed in some level's
  `tiers[].themes`, or the lesson is invisible.

## Visual language (hard-won — do not rediscover these by trial and error)

- Ink-outlined "pop" style: `border: 2.5–3px solid var(--ink)` + hard drop
  shadow `0 3–4px 0 var(--ink)`; press = translateY + shadow collapse. ALL
  interactive elements get this treatment, including header icon buttons.
- The drill card frame is a `border-image` 9-slice (`assets/frame.png`). The
  cream fill must be `background-color` + `background-clip: padding-box` on the
  card itself — NOT a `::before` layer (negative z-index children paint OVER
  border-image; padding-box is what keeps fill inside the frame, no bleed).
- The header is one painted sign (`assets/sign.png` stretched over
  `#app-header`): title text in the top band, striped awning divider, controls
  (back/home · progress/mastery · gear) inside the lower band. It is NOT sticky —
  it scrolls with the page. Everything must fit inside the sign's white area.
- The gear is a toggle: opens Settings, tapping again returns to the exact
  previous screen. Collection 📖 lives on Home only.
- Preload any new hero asset in `index.html` (`<link rel="preload">`) and add it
  to the SW SHELL list — assets visibly popping in reads cheap.
- Muted text must stay readable: `--muted` is intentionally dark (#6b5847);
  don't lighten text on the translucent street background.
- Reward sounds are real MP3s (`assets/sfx-correct.mp3`,
  `assets/sfx-lesson-complete.mp3`) with a synth fallback in theme.js. Don't
  replace them with pure synthesis — it was tried and sounded cheap.

## Sentence practice = car mode ONLY (app.js)

The lesson drill runs in ONE mode now (owner decision, 2026-07): **car mode**.
There is no toggle, no other layout — `startSession` forces `session.drive`
(except the opt-in 🧩 Build puzzle). Full-bleed one-viewport sheet, the painted
`assets/frame.png` wrapping the whole edge (`body.drive-mode #app`), no buttons:
tap the sheet to reveal + hear (tap again to replay), swipe ← nope / → got it to
grade and advance. Produce-only (English → say it in Japanese), screen kept
awake, word-breakdown chips kept, alphabet drawn over each letter. It NEVER
touches the drive-vs-not distinction anymore; don't reintroduce a toggle or a
"normal" drill. (The `keepAwake`/wake-lock and swipe handlers on `#card` power it.)

## Speaking practice = "Talk with もち子さん" (app.js)

The 🎭 talk launcher — one of the four buttons on every lesson card, and a
button on the lesson-complete screen — is the single speaking entry point; the
standalone speaking-quiz and listen-and-repeat buttons were removed at the
owner's request (2026-07). Hand-written
`window.SCENES` override; every other lesson auto-builds a conversation
(`buildAutoScene`): her greeting → each lesson sentence as your line, with her
reactions (`MOCHIKO.reactions`) between → a closing. Under the hood it's the
same speech engine, but scenes are kept LIGHT so they read as dialogue not a
test: her previous line echoes above your reply prompt, feedback is a warm
in-character reaction (the % / kana-diff detail is tucked behind a "how did I
sound?" tap), and her reply is the reward — no full scorecard per turn.

Under the hood:

English prompt → Web Speech API (`ja-JP`) transcription → compare by READING:
both sides reduced to bare hiragana (kanji read via the vendored kuromoji
tokenizer, digits spelled out to kana — 500円→ごひゃくえん), scored by edit
distance. Thresholds: ≥70% pass, ≥45% close — deliberately forgiving, the
recognizer mishears a mora or two even on clean speech. Quiz is
pure practice — it must NEVER touch SRS scheduling (owner decision).
Speech recognition needs real Safari/Chrome (not webviews); the quiz degrades
to reveal-and-listen when unavailable.

## Working with the owner

- Ship small and iterate from screenshots; they test on an iPhone (Safari PWA)
  and reply with photos. Expect "a bit more / too high / bleed" refinement
  loops — that's the workflow, not scope creep.
- Report honestly: if you couldn't visually verify (no browser in the sandbox),
  say so and ask for a screenshot.
- Big changes to live behaviour (SRS, deploy targets, voice): confirm first.
  Styling/layout polish: just do it and deploy.
- The owner's stack outside this repo: GitHub Pages + a local VOICEVOX for
  auditioning voices. Keep everything runnable without Node build tooling.

## The character & journey layer (owner-approved direction)

- **もち子さん is a character, not just a voice**: she asks the quiz prompts,
  praises perfect spoken answers, reacts between your lines, and stars in **conversation scenes**
  (`window.SCENES` — her lines play aloud, your lines run the quiz mic flow).
  She also greets on the lesson-intro reference (`window.MOCHIKO.greetings`,
  bubble in `openIntro`), now reached opt-in via the card's 📖 Words button.
  New scene lines for her need clips; reuse existing lesson sentences for the
  learner's lines so their clips already exist (the lint enforces learner lines
  are real lesson sentences). ALL of Level 1 (29 lessons) has hand-written
  scenes — her lines genuinely respond (she answers prices, reacts to news,
  asks follow-ups). Levels 2-7 still use the auto-built flow; converting them
  is the standing direction: reinforce what was learned through natural
  conversation.
- **The level page is a rail of framed picture cards** (2026-07, owner
  decision): compact theme headers, then each theme is a horizontal scroll-snap
  `.lesson-rail` of `.lesson-card`s. A card is a framed picture — the painted
  `assets/frame.png` IS its border (9-slice `border-image`, `background-clip:
  padding-box` so the cover fills inside it), the cover is a per-lesson emoji
  (or `L.image`) chosen from what the lesson teaches (`lessonCover`: keyword
  match on title/section/grammar/vocab, stable per-id fallback) on a per-theme
  wash, with the title on a soft bottom caption and a ▶/✓ corner flag. Covers
  are heuristic and OVERRIDABLE — `L.cover` (emoji) or `L.image` (a real photo
  path) pins any lesson. Along the bottom of each card is a **four-launcher row**
  (owner: "a great way to jump into the different ways to practice", 2026-07):
  📖 Words · ▶ Practice · 🎭 Talk · 🧩 Build. Tapping the *picture* jumps
  straight into Practice; the buttons launch each activity. The lesson-intro
  screen (`openIntro`/`#lesson-intro`) is now **opt-in behind 📖 Words only** —
  never force it on a card tap (that was the owner's complaint: it used to gate
  every tap). The old `.lesson-chip` grid and the Japan-map/road-of-nodes
  journey are RETIRED. "Ahead" cards are styling only — every lesson stays tappable.
- The Donkey-Kong-style map plan (`docs/ART_ROADMAP.md`, panels for
  `assets/map/`) is ON HOLD pending the owner rethinking the map — ask before
  doing any map/journey work. Don't generate placeholder scenery art unprompted.
- **Real-world missions** (`window.MISSIONS`, shown on lesson complete) and the
  **weekly rhythm dots** (7 forgiving days, `prog.practice`) replace
  streak-guilt. Do not add streak pressure back.
- Rewards-as-content (unlockable voice styles / scenes) is the approved future
  direction for rewards — never points or XP.

## Known debt / open items (keep this list honest)

- The three 〜ざるを得ない sentences contain the kanji 得 without furigana.
- `resetProgress` says "erase all progress" but keeps mined/immersion/known.
- Speech recognition is unavailable in the installed iOS home-screen app
  (WebKit limitation) — the quiz explains this and degrades gracefully.
- Legacy `claude/*` branches await owner deletion; higher-res art sits unmerged
  on `claude/inspiring-carson-712EI` (owner hasn't decided).
- `_headers` is Cloudflare-only (harmless on Pages).
