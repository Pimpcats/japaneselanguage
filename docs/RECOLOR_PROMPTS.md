# Recolour pass — B&W art → colour (ChatGPT prompts)

Goal: bring every remaining black-and-white sketchbook-ink asset up to the
**coloured** style now used by the drinks/foods/objects sprites and the avatars.

**Method = colourise, don't redraw.** Attach the existing B&W file to ChatGPT
and ask it to add colour while keeping the exact linework and composition. This
preserves the drawings the app already positions and sizes (and, for covers, the
whole scene). Only redraw from scratch if a colourise result is bad.

## Shared style anchor (paste into every prompt)
> Keep the existing hand-drawn ink linework and composition EXACTLY — do not
> redraw or move anything. Add natural colour in a clean manga / children's-book
> style: flat cel fills with light watercolour shading and the black ink lines
> kept on top. Warm, cheerful, not neon. Paper-white where the original is
> white. Match this palette where it applies: vermillion/red accents, warm
> wood browns, soft sky blues, fresh greens.

Two flavours of the prompt follow — one for cut-out **objects**, one for
**covers/backdrops**.

---

## A · OBJECTS  (assets/story/*.png — cut-out sprites)
These become transparent sprites, so put them on green for the existing cutter.

**Prompt (attach ONE B&W sprite):**
> [shared style anchor] … Place the finished coloured object on a flat solid
> chroma-key green background (#00b140), evenly lit, no shadow. Single object,
> centred.

Then I cut/trim/place each (or you run `tools/cut_sheet.py <file> 1x1 <name> assets/story`).

**Colour hints (only where it matters — otherwise let it choose):**
- train = green & silver body · bus = white/blue · car = red · boat = white
- signal = red/amber/green lights · station/house/town = warm wood + tile roofs
- sun = warm yellow · moon = pale · star = soft gold · sea = blue · mountain = green/blue
- sakura = pink · flower = (varies) · winter = white snowman · cow = black-and-white
- octopus = red · bird = brown · cat/whitecat = keep coats · dogface = brown
- coffee = brown in white cup · cup/water = keep · sushi = rice-white + salmon/tuna
- coin100 = silver · ticket = pale · umbrella = (any) · usflag = red/white/blue
- japanmap = green land/blue sea · bag = brown · books = keep their three cover patterns

**Object list to recolour (~49):**
food/drink: sushi, peach, coffee, cup, water, menu
animals: cat, whitecat, dogface, cow, octopus, bird
nature/sky: sun, moon, star, mountain, sea, sakura, flower, winter
town/transport: house, station, town, train, bus, car, boat, signal, wc
objects: book-window, book-stripes, book-circle, bag, basket, telephone,
  umbrella, ticket, coin100, japanmap, usflag, mystery, hand, chair,
  schooldesk, shelf, table, clockface
faces: bigface, redface

---

## B · COVERS & BACKDROPS  (keep the paper background)
Lesson covers (assets/covers/<id>.png) and the room/street/shop backdrops.

**Prompt (attach ONE B&W cover or backdrop):**
> [shared style anchor] … Keep the paper-white background (do NOT make it green).
> Return the same size and framing as the original.

Save the result straight back as `assets/covers/<id>.png` (or `bg-<name>.png`).

**Covers by level** (do Level 0 & 1 first — they're seen most):
- **Level 0 (11):** l0-a, l0-ka, l0-sa, l0-ta, l0-na, l0-ha, l0-ma, l0-ya, l0-ra, l0-wa, l0-dakuten
- **Level 1 (29, numbers already colour):** intro, greetings, this-that, age, shop, money, counters, where, cafe, verbs, object, negative, coming-going, routine, telling-time, frequency, activities, past-1, past-negative, was-were, sequence, wants, lets, likes, can-do, adjectives, adj-noun, na-adj, adj-negative
- **Level 2 (8):** te-form, te-please, te-iru, because, but-kedo, permission, sequence-te, timing
- **Level 3 (7):** directions, transport, does-this-go, how-far, tickets, travel-trouble, had-better
- **Level 4 (7):** plain-form, making-plans, i-think, quoting, favors, comparing, reactions
- **Level 5 (7):** conditionals, have-to, potential, intend, seems, try-doing, experience
- **Level 6 (7):** passive, causative, causative-passive, should-supposed, even-though, you-ni, wake
- **Level 7 (7):** sonkeigo, kenjougo, business-keigo, zaru-o-enai, ni-oite, monono, kagiri
- **Backdrops (3):** bg-room, bg-street, bg-shop  (onsen + aquarium already colour)

---

## C · MOCHIKO  (the mascot — 4 poses)
Attach all four together so her colours stay consistent:
mochiko-think, mochiko-cheer, mochiko-cry, mochiko-thumbs. Same colourise prompt
as objects (green background), keep her design identical across the four.

## Skip / handled in code
- **Legacy avatars** aki.png, beni.png, kai.png, yuki.png — superseded by the
  coloured `people/<id>-<stage>.png`; don't bother.
- **clock hands, cat paw** — these are CSS-driven SVG groups in
  interactive-learning.js (they animate). Claude recolours those directly in
  code, no ChatGPT needed. (clockface.png above is just the dial.)

## Handing results back
Send batches of the coloured files (any grouping). Claude cuts/trims the
objects, drops covers/backdrops straight in, updates OBJ_IMG if needed, adds any
new files to the SW shell, and bumps the version. Nothing else to wire.
