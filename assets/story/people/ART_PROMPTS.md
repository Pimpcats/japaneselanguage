# Avatar action art — ChatGPT prompts

Goal: illustrate each avatar performing 5 actions (drink · eat · read · wake ·
walk) so the story beats show "you" doing the thing instead of standing.

The avatars are now **coloured** and drawn at **four life-stages** each
(kid · teen · adult · old). The engine loads action poses from:

    assets/story/people/<id>-<stage>-<action>.png      e.g. aki-adult-drink.png

If a pose is missing it falls back to that stage's **standing** sprite
(`<id>-<stage>.png`), so scenes never break mid-rollout.

## Scope — start with ADULT only (owner decision, 2026-07)
`adult` is the default stage, and the missing-pose fallback shows the correct
age standing, so other stages lose nothing by waiting. Adult = 4 sheets / 20
poses. The SAME prompts work for any other stage later — just attach that
stage's sheet (`<id>-<stage>.png`) instead and name the outputs
`<id>-<stage>-<action>`.

Fastest path: one green-screen **sheet per avatar** with the 5 poses in a row,
then cut with `tools/cut_sheet.py`. ATTACH that avatar's current adult sprite
(`assets/story/people/<id>-adult.png`) for likeness and say "same character,
same colours."

---

## STYLE ANCHOR (baked into each prompt below)
Coloured manga-ink style: clean hand-drawn pen linework with soft grey pencil
hatch shading. **Only the clothing is coloured** (the character's signature
colour) — skin and hair stay black-ink line art on white. Full body, cute
children's-book proportions. Flat solid **chroma-key green background
(#00b140)**, even light, no cast shadows, no ground line. Keep the face, hair,
and outfit IDENTICAL across every pose in the sheet.

Signature colours: **Aki = red/vermillion**, **Beni = golden-amber/yellow**,
**Kai = blue**, **Yuki = purple**.

## THE 5 POSES (left → right, this exact order)
1. **drink** — sipping from a cup/glass held to the mouth
2. **eat** — food (rice ball / chopsticks with a bite) to an open happy mouth
3. **read** — holding an open book in both hands, eyes down, reading
4. **wake** — both arms stretched overhead in a big yawn, sleepy-happy
5. **walk** — walking mid-stride, arms swinging, cheerful

---

## PROMPT — AKI  (attach aki-adult.png)
> Coloured manga-ink style, clean pen linework + soft grey hatch shading, only
> clothing coloured (skin & hair stay black-ink on white), full body,
> chroma-key green background #00b140, no shadows. Draw a character sheet of the
> SAME young woman in ONE horizontal row of 5 evenly-spaced full-body poses,
> identical size and style. Character: shoulder-length wavy bob hair, warm
> smile, a RED/vermillion short-sleeve t-shirt with matching RED shorts,
> barefoot. Poses left to right: (1) drinking from a cup at her mouth;
> (2) eating food held to her mouth; (3) reading an open book in both hands;
> (4) waking with both arms stretched overhead in a yawn; (5) walking
> mid-stride. Identical face, hair and red outfit in all five.

## PROMPT — BENI  (attach beni-adult.png)
> [same style sentence] … Character: a young woman with a high SIDE PONYTAIL,
> soft smile with blushed cheeks, a GOLDEN-AMBER/yellow short-sleeve A-line
> dress, flat shoes. Poses left to right: (1) drinking from a cup; (2) eating
> food held to her mouth; (3) reading an open book in both hands; (4) waking,
> arms stretched overhead in a yawn; (5) walking mid-stride. Identical face,
> hair and amber dress in all five.

## PROMPT — KAI  (attach kai-adult.png)
> [same style sentence] … Character: a young man with short spiky tousled hair,
> big open grin, a BLUE short-sleeve t-shirt with matching BLUE shorts,
> sneakers. Poses left to right: (1) drinking from a cup; (2) eating food to his
> mouth; (3) reading an open book in both hands; (4) waking, arms stretched
> overhead in a yawn; (5) walking mid-stride. Identical face, hair and blue
> outfit in all five.

## PROMPT — YUKI  (attach yuki-adult.png)
> [same style sentence] … Character: a young man with curly tousled hair, gentle
> smile, a PURPLE henley shirt with matching PURPLE long pants, sneakers. Poses
> left to right: (1) drinking from a cup; (2) eating food to the mouth;
> (3) reading an open book in both hands; (4) waking, arms stretched overhead in
> a yawn; (5) walking mid-stride. Identical face, hair and purple outfit in all
> five.

---

## CUTTING THE SHEETS (after you download each 5-pose sheet)
One command per avatar (5 columns × 1 row). Note the **stage in the name**:

    python3 tools/cut_sheet.py aki-adult-sheet.png  5x1 aki-adult-drink,aki-adult-eat,aki-adult-read,aki-adult-wake,aki-adult-walk   assets/story/people
    python3 tools/cut_sheet.py beni-adult-sheet.png 5x1 beni-adult-drink,beni-adult-eat,beni-adult-read,beni-adult-wake,beni-adult-walk assets/story/people
    python3 tools/cut_sheet.py kai-adult-sheet.png  5x1 kai-adult-drink,kai-adult-eat,kai-adult-read,kai-adult-wake,kai-adult-walk   assets/story/people
    python3 tools/cut_sheet.py yuki-adult-sheet.png 5x1 yuki-adult-drink,yuki-adult-eat,yuki-adult-read,yuki-adult-wake,yuki-adult-walk assets/story/people

(Or send me the raw sheets and I'll cut + place + add them to the SW shell + bump the version.)

## If you'd rather do ONE pose per image
Same style + character, one action each, named directly:
`<id>-<stage>-<action>.png` (e.g. `aki-adult-drink.png`). No cutting needed —
drop straight into assets/story/people/.
