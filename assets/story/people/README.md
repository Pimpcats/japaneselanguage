# Avatar action art

Illustrations of the learner's chosen avatar performing an action. The engine
(interactive-learning.js → objectFigure, `beat.act`) loads these; until a file
exists it falls back to that stage's standing sprite
(`assets/story/people/<id>-<stage>.png`, then legacy `assets/story/<id>.png`),
so scenes never break.

## Naming
    assets/story/people/<avatarId>-<stage>-<action>.png     e.g. aki-adult-drink.png

avatarId ∈ aki · beni · kai · yuki
stage    ∈ kid · teen · adult · old   (default shown = adult)
action   ∈ drink · eat · read · wake · walk

## Full list — ADULT stage first (20 files)
    aki-adult-drink.png   beni-adult-drink.png   kai-adult-drink.png   yuki-adult-drink.png
    aki-adult-eat.png     beni-adult-eat.png     kai-adult-eat.png     yuki-adult-eat.png
    aki-adult-read.png    beni-adult-read.png    kai-adult-read.png    yuki-adult-read.png
    aki-adult-wake.png    beni-adult-wake.png    kai-adult-wake.png    yuki-adult-wake.png
    aki-adult-walk.png    beni-adult-walk.png    kai-adult-walk.png    yuki-adult-walk.png

Other stages (kid/teen/old) are optional — the missing-pose fallback shows the
correct-age standing sprite until they exist.

## What each pose shows
- drink : the avatar drinking from a glass/cup (covers water & coffee)
- eat   : the avatar eating (food/chopsticks to mouth)
- read  : the avatar reading an open book
- wake  : the avatar just waking up / getting up (morning)
- walk  : the avatar walking (heading home)

## Style
Same coloured character + manga-ink style as the current stage sprite
(`assets/story/people/<id>-<stage>.png`): clothing in the signature colour
(Aki red · Beni amber · Kai blue · Yuki purple), skin & hair as black-ink line
art. Full-body, green-screen (#00b140), then cut with tools/cut_sheet.py. See
ART_PROMPTS.md for the ready-to-paste ChatGPT prompts.
