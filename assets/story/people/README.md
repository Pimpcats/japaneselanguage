# Avatar action art

Illustrations of the learner's chosen avatar performing an action. The engine
(interactive-learning.js → objectFigure, `beat.act`) loads these; until a file
exists it falls back to the plain standing avatar (assets/story/<id>.png), so
scenes never break.

## Naming
    assets/story/people/<avatarId>-<action>.png

avatarId ∈ aki · beni · kai · yuki
action   ∈ drink · eat · read · wake · walk

## Full list (20 files)
    aki-drink.png   beni-drink.png   kai-drink.png   yuki-drink.png
    aki-eat.png     beni-eat.png     kai-eat.png     yuki-eat.png
    aki-read.png    beni-read.png    kai-read.png    yuki-read.png
    aki-wake.png    beni-wake.png    kai-wake.png    yuki-wake.png
    aki-walk.png    beni-walk.png    kai-walk.png    yuki-walk.png

## What each pose shows
- drink : the avatar drinking from a glass/cup (covers water & coffee)
- eat   : the avatar eating (food/chopsticks to mouth)
- read  : the avatar reading an open book
- wake  : the avatar just waking up / getting up (morning)
- walk  : the avatar walking (heading home)

## Style
Same character + ink style as the existing avatar (assets/story/<id>.png),
full-body, green-screen or transparent, then cut with tools/cut_sheet.py.
