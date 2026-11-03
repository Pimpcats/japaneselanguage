# Scene expansion — animating more of the deck (2026-07)

## Why this doc exists
An honest audit of scene coverage, so we stop re-listing the same handful of
missing art files and instead grow the number of **animated cards**.

## The numbers (measured, not guessed)
- **503 cards** across **84 lessons**.
- Before this sweep: ~103 animated moments across 47 lessons — roughly **1 in 5
  cards**, and usually only ONE sentence per "scene" lesson was animated.
- **37 lessons had zero scenes** (every card text-only).

## Two buckets among the un-animated
**Keep as plain cards (~22 lessons)** — abstract grammar you can't stage:
because · i-think · quoting · plain-form · have-to · potential · passive ·
causative · causative-passive · should-supposed · even-though · you-ni ·
わけ(wake) · sonkeigo · kenjougo · business-keigo · ざるを得ない · において ·
ものの · かぎり · intend · try-doing. (Design bible: abstract sentences stay
as normal cards.)

**Should animate — the concrete tier (15 lessons)** — handled below.

---

## Part A — 13 scenes added now (no new art; shipped v258)
Each reuses art already on disk. Avatar `act:` poses fall back to the standing
avatar until the action sheets (Part C) land — exactly how verbs/routine/
coming-going already behave.

| Lesson | Sentence | Beat | Art reused |
|---|---|---|---|
| activities | I study at home. | ask · avatar `act:study` | (standing avatar) |
| negative | No, I don't drink. | ask · coffee | coffee.png |
| frequency | I sometimes drink coffee. | order · `act:drink` | coffee.png |
| past-1 | Yesterday I ate a meal. | order · `act:eat` | breakfast.png |
| sequence | I woke up at 7. | ask · avatar `act:wake` | (standing avatar) |
| sequence-te | I get up in the morning and drink coffee. | order · `act:drink` | coffee.png |
| adjectives | It's very delicious. | ask · sushi | sushi.png |
| timing | I'll call you later. | ask · telephone | telephone.png |
| making-plans | Let's meet at the station. | ask · station | station.png |
| favors | A friend lent it to me. | ask · book | book art |
| conditionals | If it rains, I won't go. | ask · umbrella | umbrella.png |
| age | The child is five years old. | ask · cake | cake.png |
| travel-trouble | I lost my wallet. | ask · wallet | wallet.png |

## Part B — 2 concrete lessons still pending
- **past-negative** — "I didn't eat anything." Needs an **empty plate** prop
  (see Part D). Beat: ask · emptyplate → なにも たべませんでした。
- **reactions** — aizuchi (そうなんだ・まじで・すごい). This is a *dialogue*,
  not an object beat; it belongs in `window.SCENES` (もち子 says news, you pick
  a reaction), not the beat engine. Author as a light scene later.

---

## Part C — Avatar ACTION sprites (the keystone)
Today the learner's avatar has NO action art, so every `act:` beat shows the
standing sprite. These sheets make the character actually DO the verb.

**Filename scheme:** `assets/story/people/<id>-<stage>-<action>.png`
(id = aki·beni·kai·yuki · stage = kid·teen·adult·old). The engine already
falls back action → stage-standing → adult-standing, so any subset works.

**Core action set (6):** eat · drink · read · wake · walk · study.

**Full matrix:** 6 actions × 4 characters × 4 stages = **16 sheets**
(one row of 6 per character-stage). Recommended rollout, each wave fully
functional on its own:
1. Wave 1 — **adult** ×4 characters (4 sheets)  ← start here
2. Wave 2 — teen ×4
3. Wave 3 — kid ×4
4. Wave 4 — old ×4

### Prompt (one template; attach the matching base sprite, set the filename)
> Attach `people/<id>-<stage>.png`. Draw THIS exact character — identical face,
> hair, outfit, age and colour palette — in ONE horizontal row of SIX full-body
> action poses on a flat chroma-key green background (#00b140), even light, no
> cast shadow, no ground line, evenly spaced with clean gaps, all the same size.
> Style: clean confident hand-inked outlines + refined soft cel/gouache shading,
> muted natural palette (match the attached sprite), genuinely hand-drawn, no
> neon, no flat vector look. The six poses, left to right:
> (1) **eat** — holding chopsticks to the mouth over a rice bowl, mid-bite, happy;
> (2) **drink** — tipping a cup to the lips, drinking;
> (3) **read** — holding an open book in both hands, looking down at it;
> (4) **wake** — just waking: sitting up, one arm stretching in a yawn, sleepy;
> (5) **walk** — mid-stride in profile, one foot forward, arms swinging;
> (6) **study** — sitting at a small desk, pencil in hand over an open book.

**Cut command (per sheet):**
```
python3 tools/cut_sheet.py <id>-<stage>-actions.png 6x1 \
  <id>-<stage>-eat,<id>-<stage>-drink,<id>-<stage>-read,<id>-<stage>-wake,<id>-<stage>-walk,<id>-<stage>-study \
  assets/story/people
# e.g. aki-adult-actions.png → aki-adult-eat.png … aki-adult-study.png
```

### Optional Action Sheet 2 (later — for imported Anki sentences)
sleep · pay · toast · try-on · wait · write. Same template/row-of-6 per
character-stage.

---

## Part D — One remaining PROP (colour object style)
The drinks/foods/objects prop sheets are already cut and on disk. The only
object still missing for the concrete sweep:

> Clean hand-inked manga / children's-book illustration matching the object
> sheets: confident bold ink outlines, refined soft cel + gouache shading, muted
> natural palette (not neon, not washed-out). A single **empty white dinner
> plate**, front-on, nothing on it (for なにも たべませんでした — "I didn't eat
> anything"). Flat chroma-key green background #00b140, even light, no shadow,
> centred.

```
python3 tools/cut_sheet.py emptyplate.png 1x1 emptyplate assets/story
```
Then add `emptyplate: "emptyplate"` to `OBJ_IMG` + `OBJ_NAME`, add it to the SW
SHELL list, author the past-negative beat, bump the version.

---

## Wiring checklist when art lands
1. Cut with the command above → files land in `assets/story[/people]`.
2. Action sprites need NO code change (resolver already builds the path).
   New props: add key→basename in `OBJ_IMG` + a label in `OBJ_NAME`.
3. Add every new file to the SW `SHELL` list (sw.js).
4. Bump `?v=NN` (index.html ×6) and `hanasou-vNN` (sw.js) together.
5. `node --check` + `node tools/smoke.mjs` + `node tools/lint_lessons.mjs`.
6. `sed 's#url("assets/#url("../assets/#g' theme.css > mock/theme.css`.
7. Commit + push to main.
