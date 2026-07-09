# The Card Game — Handoff

> **Working title only.** "百鬼夜市 / night market" is a placeholder used
> throughout the prototype and this doc — the **final name is TBD** and it will
> **not** ship as "night market." Rename freely; it's just a label on a theme.

A Japanese-teaching, Inscryption-style roguelike card game being prototyped as a
**standalone mode** alongside the main はなそう app. This doc is the single
pick-up point: what it is, every decision made, every file, and what's next.

- **Branch:** `claude/night-market-game` (off the `sleepy-hopper` tip).
- **Lives in:** `game/*.html` (self-contained prototypes) + `docs/GAME_*.md`.
- **Not yet wired** into the live app (`index.html`/`app.js`/`sw.js`). GitHub
  Pages deploys `main` only, so these branch files don't touch the live site.
- **Companion doc:** `docs/GAME_ART_DIRECTION.md` (theme & art bible).

---

## 1. The concept

A cozy-dark card game where **you learn Japanese by playing it**. Inscryption is
the north star: a run of traveling map nodes, deckbuilding, a creepy host, small
readable fights, a rule-bending boss. The twist that keeps it a *language* game:

> **Grammar is the mechanic, not a label.** A card game already needs a cost, a
> resource, a combo system, and a win condition — each maps onto a real act of
> producing or understanding Japanese.

## 2. THE core battle mechanic (locked): "the lane is the sentence"

The board **is** the sentence. You build it by playing cards; no overlays, no
spelling quizzes, no flow interruption.

- **Noun → a creature** you play into a lane (tap to summon; spelling was removed).
- **Adjective → attaches to a creature** (a buff *and* it joins the sentence:
  くま → **つよい くま**).
- **Verb → attaches into the lane** (the predicate).
- **Particles appear automatically** (が) — shown + spoken, never hand-picked.
- Each lane shows a live **sentence strip** (kana + romaji + English) and もち子
  **reads it aloud on the bell**, which resolves it as the attack.
- **Grammar = mechanics:** the verb decides the action (attack, or まもる =
  guard/shield), the adjective decides power; a *completed* sentence grants a
  verb bonus. Word strength = Inscryption card values (くま=4, とり=2…).

Difficulty ramp = **grammatical complexity**. Current stage is `(形) 名 が 動`.
The next planned growth is an **object slot** → `つよい くま が さかな を たべる`
(teaches を + longer structure). "Lanes expand to greater size" = the curriculum.

## 3. The roguelike / meta layer

- **Traveling map** (Inscryption Act-1 style): a 10-row branching parade road,
  reachable nodes glow, you pick your path to the boss.
- **Frankenstein creature-upgrades** (persist across the run, carry into battle):
  - **Graft an adjective** (permanent buff + identity), **teach a verb** (innate
    action), **temper** (+stats), **stitch two creatures into one monster**
    (stats add, words combine).
- **Every node teaches** ("we learn off everything"):
  | Node | Role |
  |---|---|
  | 👺 Duel | a normal battle |
  | ☠️ Elite (named yōkai) | tougher fight, 16 HP foe with adj+verb; win → free graft |
  | 🔥 Forge (tsukumogami) | graft / teach / temper / stitch |
  | ⛩️ Shrine (rest) | small offering: +1⚔/+1♥ |
  | 🦊 Riddle (spirit) | vocab quiz → claim the exact word |
  | 🏮 Peddler (shop) | buy a new noun-creature (new word) |
  | 🎁 Omen (treasure) | choose one of three boons |
  | 👹 Boss | a named yōkai that **builds its own sentences and hurls them** |
- **Boss** = big HP + a banner where it **assembles a sentence word-by-word
  across turns** (telegraphed adj → noun → を → verb), then speaks it as a heavy
  attack. You race to chip its HP with your own sentences.

## 4. Design laws (do not violate — from CLAUDE.md + decisions this session)

1. **Speaking/producing first**; comprehension second. Reading/tapping supports.
2. **No flow interruption** in battle — particles auto-insert; speaking is the
   *reward*, not a gate. (This replaced earlier spell-to-summon / particle-pick.)
3. **Training wheels fade:** romaji, then English, are shown now and are meant to
   auto-fade as the learner grows (mirrors the app's romaji-fade / kanaMode).
4. **Everything teaches** — enemies build & read their own sentences too.
5. **Fun, not gamified:** no XP, no points, no lives, no countdown timers.
   Rewards = content/meaning (stamps, unlocks, new words), never points.
6. **Particles are grammar glue, never collectible cards.**
7. Game is **separate from SRS** — it must never touch SRS scheduling.

## 5. Files (all on `game/`)

| File | What it is | Status |
|---|---|---|
| `run-map.html` | **THE integrated game** — yōkai-themed map + real battles (using your party) + forge + sentence-building boss | current main build |
| `sentence-lanes.html` | The battle in isolation (lane-is-sentence, translations, enemy sentences) | the proven battle core |
| `night-market.html` | The original creature-combat fight (tap-to-summon, adjective buffs, bell) | the rolled-back "basics" |
| `sentence-crawl.html` | Abandoned exploration: sentence-as-weapon vs a single crawler | reference only |
| `lane-crawl.html` | Abandoned exploration: sentence-as-weapon vs 3 descending lanes | reference only |
| `docs/GAME_ART_DIRECTION.md` | Theme & art bible (百鬼夜市) | brief for art |
| `docs/GAME_HANDOFF.md` | this doc | — |

## 6. Theme: 百鬼夜市 — the Hundred-Demon Night Market

Weird & dark like Inscryption, but Japanese **yōkai lore**. The shop-street's
shadow twin — the market after midnight. もち子 is your kitsune guide; foes are
bake-creatures; bosses are named yōkai (ぬらりひょん, 鬼, ろくろ首, 山姥…).
Palette: sumi-black lacquer, vermilion, gold leaf, ghost-fire blue, bone washi.
Style: ukiyo-e woodblock ink; cards as ofuda/hanafuda talismans. The prototype
ships a **CSS treatment** evoking this; **final illustration is the owner's** to
produce into `assets/game/` behind the stable DOM (see art doc).

## 7. Live prototype links (claude.ai artifacts, private to the owner)

- **The game (map + battles + boss):** https://claude.ai/code/artifact/4525ba3b-596e-434f-b4a2-2d919894af48
- Battle only: https://claude.ai/code/artifact/62e5cef7-4037-4778-b116-4239903d90b2
- Original creature fight: https://claude.ai/code/artifact/4eaabfd0-fce4-49d0-a9d9-09f7bd5d86a0
- (Abandoned) sentence-crawl: https://claude.ai/code/artifact/71bb8ccd-bc8d-4495-b8ef-d5b20ceb4582
- (Abandoned) lane-crawl: https://claude.ai/code/artifact/cdc766cf-3c7b-4a76-9aaf-5a19f81e5e50

## 8. Known limitations / open items

- **Boss battle verified by code review only** — the headless test harness is
  too slow to auto-play a full run to it; needs a human playtest.
- **Visual reskin not visually verified** (no browser in the build env) — needs
  a screenshot pass; expect contrast/spacing tuning.
- **Balance is untuned.** Enemy damage, hearts (12), elite HP (16), boss HP (22),
  verb bonuses — all one-line knobs in `run-map.html`.
- **Placeholder vocab** — 5 nouns / 4 adjectives / 4 verbs, all hiragana. Needs
  wiring to real `lessons.js` vocab (and katakana words when added).
- **Object/adverb slots not built** (the next grammar-growth step).
- **Audio is device TTS fallback.** Real もち子 (VOICEVOX speaker 20) clips are
  not generated for game strings; the audio pipeline (`tools/gen_audio.mjs`)
  would need the game's sentence strings.
- **Not integrated** into the app shell; no service-worker caching; standalone
  files only.
- Particles shown are が (subject); を arrives with the object slot.

## 9. Suggested next steps (in rough priority)

1. **Playtest the boss** on device; fix anything that surfaces.
2. **Screenshot + tune the visual theme** (owner's iterate-from-photos loop).
3. **Balance pass** on the knobs above.
4. **Object slot** → longer sentences (`名 を 名 が 動`), teaching を.
5. **Wire real vocab** from `lessons.js`; make node/battle content pull from a
   lesson theme so a "district" maps to real curriculum.
6. **Art hooks:** drop illustrated yōkai/lantern/card panels into `assets/game/`
   behind the current DOM.
7. Later: real もち子 audio for game lines; run-level rewards (stamps via
   `collection.js`); decide if/how this integrates into the main app.

## 10. How to run / verify locally

Open any `game/*.html` directly in a browser (no build step). For a headless
smoke check (the repo's convention):

```
npm i --no-save jsdom
node -e "const {JSDOM}=require('jsdom');new JSDOM(require('fs').readFileSync('game/run-map.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true})"
```

Speech recognition/synthesis needs a real browser (Safari/Chrome), not the
installed iOS PWA (WebKit limitation — same caveat as the main app's quiz).
