# Generation queue — self-contained ChatGPT prompts (one per conversation)

Every prompt below is complete on its own (style baked in). For the avatar
sheets, attaching that character's current sprite
(`assets/story/people/<id>-adult.png`) improves likeness but isn't required.
After each sheet comes back, cut it with the command shown.

---

## 1 · AVATAR ACTIONS — AKI (adult)
Coloured manga-ink style: clean hand-drawn pen linework with soft grey pencil hatch shading. Only the CLOTHING is coloured (skin and hair stay black-ink line art on white). Full body, cute children's-book proportions. Flat solid chroma-key green background #00b140, even light, no cast shadows, no ground line. Draw a character sheet of the SAME young woman in ONE horizontal row of SIX evenly-spaced full-body poses, identical size and style, clean gaps between them. Character: shoulder-length wavy bob hair, warm smile, a RED / vermillion short-sleeve t-shirt with matching RED shorts, barefoot. Poses left to right: (1) DRINK — sipping from a cup held to her mouth; (2) EAT — food (chopsticks or a rice ball) to an open happy mouth; (3) READ — holding an open book in both hands, eyes down; (4) WAKE — both arms stretched overhead in a big yawn, sleepy-happy; (5) WALK — walking mid-stride, arms swinging; (6) STUDY — sitting at a small desk, pencil in hand over an open book, focused. Keep her face, hair and red outfit IDENTICAL in all six.

`python3 tools/cut_sheet.py aki-adult-actions.png 6x1 aki-adult-drink,aki-adult-eat,aki-adult-read,aki-adult-wake,aki-adult-walk,aki-adult-study assets/story/people`

---

## 2 · AVATAR ACTIONS — BENI (adult)
Coloured manga-ink style: clean hand-drawn pen linework with soft grey pencil hatch shading. Only the CLOTHING is coloured (skin and hair stay black-ink line art on white). Full body, cute children's-book proportions. Flat solid chroma-key green background #00b140, even light, no cast shadows, no ground line. Draw a character sheet of the SAME young woman in ONE horizontal row of SIX evenly-spaced full-body poses, identical size and style, clean gaps between them. Character: a young woman with a high SIDE PONYTAIL, soft smile with blushed cheeks, a GOLDEN-AMBER / yellow short-sleeve A-line dress, flat shoes. Poses left to right: (1) DRINK — sipping from a cup held to her mouth; (2) EAT — food to an open happy mouth; (3) READ — holding an open book in both hands, eyes down; (4) WAKE — both arms stretched overhead in a big yawn, sleepy-happy; (5) WALK — walking mid-stride, arms swinging; (6) STUDY — sitting at a small desk, pencil in hand over an open book, focused. Keep her face, hair and amber dress IDENTICAL in all six.

`python3 tools/cut_sheet.py beni-adult-actions.png 6x1 beni-adult-drink,beni-adult-eat,beni-adult-read,beni-adult-wake,beni-adult-walk,beni-adult-study assets/story/people`

---

## 3 · AVATAR ACTIONS — KAI (adult)
Coloured manga-ink style: clean hand-drawn pen linework with soft grey pencil hatch shading. Only the CLOTHING is coloured (skin and hair stay black-ink line art on white). Full body, cute children's-book proportions. Flat solid chroma-key green background #00b140, even light, no cast shadows, no ground line. Draw a character sheet of the SAME young man in ONE horizontal row of SIX evenly-spaced full-body poses, identical size and style, clean gaps between them. Character: a young man with short spiky tousled hair, big open grin, a BLUE short-sleeve t-shirt with matching BLUE shorts, sneakers. Poses left to right: (1) DRINK — sipping from a cup held to his mouth; (2) EAT — food to an open happy mouth; (3) READ — holding an open book in both hands, eyes down; (4) WAKE — both arms stretched overhead in a big yawn, sleepy-happy; (5) WALK — walking mid-stride, arms swinging; (6) STUDY — sitting at a small desk, pencil in hand over an open book, focused. Keep his face, hair and blue outfit IDENTICAL in all six.

`python3 tools/cut_sheet.py kai-adult-actions.png 6x1 kai-adult-drink,kai-adult-eat,kai-adult-read,kai-adult-wake,kai-adult-walk,kai-adult-study assets/story/people`

---

## 4 · AVATAR ACTIONS — YUKI (adult)
Coloured manga-ink style: clean hand-drawn pen linework with soft grey pencil hatch shading. Only the CLOTHING is coloured (skin and hair stay black-ink line art on white). Full body, cute children's-book proportions. Flat solid chroma-key green background #00b140, even light, no cast shadows, no ground line. Draw a character sheet of the SAME young man in ONE horizontal row of SIX evenly-spaced full-body poses, identical size and style, clean gaps between them. Character: a young man with curly tousled hair, gentle smile, a PURPLE henley shirt with matching PURPLE long pants, sneakers. Poses left to right: (1) DRINK — sipping from a cup held to his mouth; (2) EAT — food to an open happy mouth; (3) READ — holding an open book in both hands, eyes down; (4) WAKE — both arms stretched overhead in a big yawn, sleepy-happy; (5) WALK — walking mid-stride, arms swinging; (6) STUDY — sitting at a small desk, pencil in hand over an open book, focused. Keep his face, hair and purple outfit IDENTICAL in all six.

`python3 tools/cut_sheet.py yuki-adult-actions.png 6x1 yuki-adult-drink,yuki-adult-eat,yuki-adult-read,yuki-adult-wake,yuki-adult-walk,yuki-adult-study assets/story/people`

> Teen / kid / old later: paste the SAME prompt but say "draw them as a
> child / a teenager / an elderly person," and name the outputs
> `<id>-kid-…`, `<id>-teen-…`, `<id>-old-…`.

---

## 5 · POLISH SHEET 1 — everyday objects
Clean hand-inked manga / children's-book illustration matching a detailed object sheet: confident bold hand-drawn ink outlines, refined soft cel + gouache shading inside each form, a muted natural palette (never neon, never washed-out), genuinely hand-drawn (no flat clip-art or vector look). Flat solid chroma-key green background #00b140, even light, no cast shadow, no ground line. Draw ONE horizontal row of SIX objects, evenly spaced, identical size and style, clean gaps: (1) a flat-screen TV on a low stand, screen showing a tiny simple picture; (2) a bowl of white rice (chawan) with a pair of chopsticks resting on top; (3) a small bowl of nattō — sticky fermented soybeans, chopsticks lifting a clump with fine sticky strands stretching up; (4) an empty white dinner plate, front-on, nothing on it; (5) a toothbrush with a small dab of toothpaste on the bristles; (6) a ringing bedside alarm clock with two bells on top and little motion marks.

`python3 tools/cut_sheet.py polish1.png 6x1 tv,gohan,natto,emptyplate,toothbrush,alarmclock assets/story`

---

## 6 · POLISH SHEET 2 — situation props
Clean hand-inked manga / children's-book illustration matching a detailed object sheet: confident bold hand-drawn ink outlines, refined soft cel + gouache shading inside each form, a muted natural palette (never neon, never washed-out), genuinely hand-drawn (no flat clip-art or vector look). Flat solid chroma-key green background #00b140, even light, no cast shadow, no ground line. Draw ONE horizontal row of FIVE objects, evenly spaced, identical size and style, clean gaps: (1) a grey rain cloud with several blue rain streaks falling beneath it; (2) a chat / speech bubble (rounded rectangle with a small tail) with three dots "…" inside, as if someone just messaged; (3) a travel suitcase / carry-on standing upright, with a pull handle and a small round luggage tag; (4) a sneaky pickpocket hand — a shadowy hand reaching in and lifting a wallet, with a couple of motion lines; (5) a hand holding out a folded ¥1000 note toward the viewer.

`python3 tools/cut_sheet.py polish2.png 5x1 raincloud,chatbubble,suitcase,thief,bill assets/story`

---

## 7 · CLOCK (single object)
Clean hand-inked manga / children's-book illustration matching a detailed object sheet: confident bold hand-drawn ink outlines, refined soft cel + gouache shading, a muted natural palette (never neon, never washed-out), genuinely hand-drawn. Flat solid chroma-key green background #00b140, even light, no cast shadow. A single round analog WALL CLOCK, front-on, centred: cream face, dark ink numerals 1–12, a slim rim. IMPORTANT: draw the dial and numerals ONLY — NO hour or minute hands (the app overlays its own moving hands).

`python3 tools/cut_sheet.py clock.png 1x1 clock assets/story`

---

## 8 · PERSIMMON (single object — re-angle)
Clean hand-inked manga / children's-book illustration matching a detailed object sheet: confident bold hand-drawn ink outlines, refined soft cel + gouache shading, a muted natural palette (never neon, never washed-out), genuinely hand-drawn. Flat solid chroma-key green background #00b140, even light, no cast shadow. A single ripe PERSIMMON (kaki) shown from a natural FRONT three-quarter angle (not top-down): warm orange fruit with a small green-brown calyx (the four-leaf cap) at the top, slightly glossy. Centred.

`python3 tools/cut_sheet.py persimmon.png 1x1 persimmon assets/story`

---

## Also available (separate workstream): the 142 kana browse cards
24 grids of hiragana/katakana in the splash style live in
`docs/KANA_ART_PROMPTS.md`, ready to paste the same way. Not scene art — they're
for the あア Kana browse screen.
