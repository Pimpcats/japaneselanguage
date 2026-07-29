# Level-by-level animation map (2026-07)

The whole curriculum, 8 levels (0–7), audited for what can be animated. After
the 2026-07 sweep **76 of 84 lessons have an interactive beat**. The headline:
**almost nothing needs new ChatGPT art** — each remaining scene anchors to an
object already on disk or an avatar action. The only real generation jobs are
(1) the avatar ACTION sprites (used everywhere) and (2) one empty-plate prop.

Legend:  ✅ animated · 🆕 added this sweep · 🎴 stays a plain card (on purpose)

---

## LEVEL 0 · First Sounds  — ✅ fully animated (11/11)
All kana lessons already have "ask" beats (bird, stars, sushi, cow, cat's paw…).
**New art: none.**

## LEVEL 1 · Foundations — 30/31 animated
✅ intro, greetings, this-that, numbers, age, shop, money, counters, where,
cafe, verbs, object, negative, coming-going, routine, telling-time, frequency,
activities, past-1, was-were, sequence, wants, lets, likes, can-do, adjectives,
adj-noun, na-adj, adj-negative
🆕 (this sweep) activities, negative, frequency, past-1, sequence, adjectives, age
🆕 **past-negative** — "I didn't eat anything" → needs the **empty-plate** prop
   (only missing art in Levels 0–1). Beat is ready to author the moment it lands.
**New art: empty-plate (below).**

## LEVEL 2 · Connecting & Doing — ✅ fully animated (8/8)
✅ te-form, te-please, te-iru, but-kedo, permission, sequence-te, timing
🆕 **because** — "I'm tired, so I'm going home" → avatar `walk`
🆕 **sequence-te**, **timing** (earlier sweep)
**New art: none** (reuses coffee, umbrella, phone, avatar-walk).

## LEVEL 3 · Getting Around — ✅ fully animated (7/7)
✅ directions (traffic light), transport (train/bus), does-this-go (bus),
how-far (station), tickets (ticket), travel-trouble (wallet), had-better (umbrella)
**New art: none.**

## LEVEL 4 · Real Conversations — ✅ fully animated (7/7)
✅ making-plans (station), favors (book), comparing (price tags)
🆕 **plain-form** — "What do you wanna eat?" → sushi
🆕 **i-think** — "I think it'll rain tomorrow" → umbrella
🆕 **quoting** — "They said they're not coming" → telephone
🆕 **reactions** — "Wow, that's awesome!" → もち子 (react to her news)
**New art: none.**

## LEVEL 5 · Nuance & Plans — ✅ fully animated (7/7)
✅ conditionals (umbrella), seems (sushi), experience
🆕 **have-to** — "I gotta get up early" → avatar `wake`
🆕 **potential** — "Can you read kanji?" → book
🆕 **intend** — "I'm set to go to Japan in summer" → japan map
🆕 **try-doing** — "Try eating it once" → sushi + `eat`
**New art: none.**

## LEVEL 6 · Expert — ✅ fully animated (7/7)
🆕 **passive** — "My wallet was stolen" → wallet
🆕 **causative** — "Let me pay today" → credit card
🆕 **causative-passive** — "I was made to wait an hour" → clock
🆕 **should-supposed** — "The train should arrive soon" → train
🆕 **even-though** — "Even if it rains, I'll go" → umbrella
🆕 **you-ni** — "I make a point of walking every day" → avatar `walk`
🆕 **wake (わけ)** — "So that's why it's expensive" → price-tag on sushi
**New art: none.**

## LEVEL 7 · Master — 🎴 kept as plain cards (0/7, by design)
- **Keigo** (sonkeigo, kenjougo, business-keigo): the lesson is a *politeness
  register*, not a new physical action. Animating "please eat (めしあがる)" would
  teach eating, not the honorific. Best taught as spoken cards + もち子 scenes.
- **Native connectives** (ざるを得ない, において, ものの, かぎり): pure abstract
  linkers with no scene to stage. These stay cards (design bible rule).
- If we ever animate keigo, do it as a **conversation scene** (もち子 as the
  customer/superior), not an object beat.

---

# The ONLY new art the whole curriculum still needs

## 1. Avatar ACTION sprites  — the big one (used in every level)
Powers every `act:` beat (eat/drink/read/wake/walk/study). Today they fall back
to the standing sprite. Full matrix = **16 sheets** (6 actions × 4 characters ×
4 life-stages). Prompt + cut commands are in **docs/SCENE_EXPANSION.md → Part C**.
Rollout: adult ×4 first (fully usable), then teen/kid/old.

## 2. Empty-plate prop  — unlocks the last Level-1 lesson (past-negative)
> Clean hand-inked manga / children's-book illustration matching the object
> sheets: bold ink outlines, soft cel + gouache shading, muted natural palette
> (not neon, not washed-out). A single **empty white dinner plate**, front-on,
> nothing on it. Flat chroma-key green background #00b140, even light, no shadow,
> centred.
```
python3 tools/cut_sheet.py emptyplate.png 1x1 emptyplate assets/story
```

---

# Optional per-level art UPGRADES (nice-to-have, not required)
Each scene above works today with a reused object. If you want a scene to read
more specifically, these dedicated props would replace the generic reuse. Purely
optional polish — generate any, none, or all.

- **L2 because / L4 i-think** — a **rain cloud** (grey cloud + a few drops) so
  "because it's raining / I think it'll rain" shows weather, not just an umbrella.
- **L4 quoting** — a **speech-bubble / phone-message** prop (a chat bubble with
  a … inside) for "they said…".
- **L5 potential** — **natto** (sticky fermented beans, chopstick pull) for the
  real line "Can you eat natto?" (currently anchored to kanji/book instead).
- **L6 passive** — a **shadow hand / pickpocket** motif so "my wallet was stolen"
  shows the theft, not just a wallet.
- **L6 causative** — a **hand holding out a bill** for "let me pay".

Prompt template for any of these (single object, object-sheet style):
> Clean hand-inked manga illustration matching the object sheets: bold ink
> outlines, soft cel + gouache shading, muted natural palette. A single
> [OBJECT], front-on, centred. Flat chroma-key green background #00b140, even
> light, no cast shadow. → save as `<name>.png`, cut with
> `python3 tools/cut_sheet.py <name>.png 1x1 <name> assets/story`.
