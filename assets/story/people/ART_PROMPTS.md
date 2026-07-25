# Avatar action art — ChatGPT prompts

Goal: illustrate each of the 4 avatars doing 5 actions (drink · eat · read ·
wake · walk) = 20 sprites, matching the existing standing avatars.

Fastest path: generate ONE green-screen **sheet per avatar** with the 5 poses
in a single row, then cut it into named sprites with `tools/cut_sheet.py`.

For best likeness, ATTACH that avatar's existing picture
(assets/story/aki.png, beni.png, kai.png, yuki.png) to the ChatGPT message
and say "same character, same outfit."

---

## STYLE ANCHOR (already baked into each prompt below)
Sketchbook manga-ink style: loose hand-drawn pen/pencil lines, light diagonal
hatch shading, **monochrome black ink on white only — no color at all**. Cute
children's-book proportions (slightly large head), clean simple linework, full
body. Flat solid **chroma-key green background (#00b140)**, evenly lit, no cast
shadows, no ground line. Keep the face, hair, and outfit IDENTICAL across every
pose in the sheet.

## THE 5 POSES (left → right, this exact order)
1. **drink** — drinking from a cup/glass held up to the mouth, sipping
2. **eat** — eating: food (a rice ball / chopsticks with a bite) held to the open mouth, happy
3. **read** — standing, holding an open book in both hands, eyes down, reading
4. **wake** — just waking up: both arms stretched overhead in a big yawn, sleepy-happy, slightly messy hair
5. **walk** — walking mid-stride, one foot forward, arms swinging, cheerful

---

## PROMPT — AKI  (attach aki.png)
> Sketchbook manga-ink style, monochrome black ink on white only (NO color),
> loose pen lines + light diagonal hatch shading, cute children's-book
> proportions, full body. Flat solid chroma-key green background (#00b140), no
> shadows. Draw a character sheet of the SAME single girl in ONE horizontal row
> of 5 full-body poses, evenly spaced with clear gaps, all identical size and
> style. Character: a young girl with shoulder-length wavy bob hair (no hair
> accessory), wide cheerful smile, plain short-sleeve t-shirt, loose shorts,
> ankle socks and sneakers. The 5 poses, left to right: (1) drinking from a cup
> held to her mouth; (2) eating food held to her mouth; (3) reading an open book
> held in both hands; (4) waking up, both arms stretched overhead in a yawn;
> (5) walking mid-stride. Identical face, hair and outfit in all five.

## PROMPT — BENI  (attach beni.png)
> [same style sentence as above] … Character: a young girl with hair in a high
> SIDE PONYTAIL tied with a small bow, soft closed-eye smile with blushed
> cheeks, short-sleeve t-shirt, flared A-line skirt, ankle socks and sneakers.
> The 5 poses, left to right: (1) drinking from a cup; (2) eating food held to
> her mouth; (3) reading an open book in both hands; (4) waking up, arms
> stretched overhead in a yawn; (5) walking mid-stride. Identical face, hair and
> outfit in all five.

## PROMPT — KAI  (attach kai.png)
> [same style sentence] … Character: a young boy with short spiky tousled hair,
> big open grin, short-sleeve t-shirt, loose shorts, ankle socks and sneakers.
> The 5 poses, left to right: (1) drinking from a cup; (2) eating food held to
> his mouth; (3) reading an open book in both hands; (4) waking up, arms
> stretched overhead in a yawn; (5) walking mid-stride. Identical face, hair and
> outfit in all five.

## PROMPT — YUKI  (attach yuki.png)
> [same style sentence] … Character: a young child with tousled wavy hair,
> gentle closed-eye smile, long-sleeve HENLEY shirt with sleeves rolled to the
> elbow, cuffed long pants, sneakers. The 5 poses, left to right: (1) drinking
> from a cup; (2) eating food held to the mouth; (3) reading an open book in
> both hands; (4) waking up, arms stretched overhead in a yawn; (5) walking
> mid-stride. Identical face, hair and outfit in all five.

---

## CUTTING THE SHEETS (after you download each 5-pose sheet)
Save each sheet, then run one command per avatar (5 columns × 1 row):

    python3 tools/cut_sheet.py aki-sheet.png  5x1 aki-drink,aki-eat,aki-read,aki-wake,aki-walk   assets/story/people
    python3 tools/cut_sheet.py beni-sheet.png 5x1 beni-drink,beni-eat,beni-read,beni-wake,beni-walk assets/story/people
    python3 tools/cut_sheet.py kai-sheet.png  5x1 kai-drink,kai-eat,kai-read,kai-wake,kai-walk   assets/story/people
    python3 tools/cut_sheet.py yuki-sheet.png 5x1 yuki-drink,yuki-eat,yuki-read,yuki-wake,yuki-walk assets/story/people

(Or just send me the raw sheets and I'll cut + place them.)

## If you'd rather do ONE pose per image
Generate individually with the same style + character, one action each, and
name the file directly: `<id>-<action>.png` (e.g. `aki-drink.png`). No cutting
needed — drop straight into assets/story/people/.
