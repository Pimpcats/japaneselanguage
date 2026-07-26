# Action & object art — ChatGPT prompts (Anki import wave)

Art needed for the sentences imported from the owner's Anki deck, which lean
heavily on **eating, drinking, buying, and trying things** — actions. One
green-screen sheet feeds many sentences; cut with `tools/cut_sheet.py`.

Already in the app (do NOT regenerate): sushi, coffee, water, cup, umbrella,
ticket, bag, coin100, train, bus, car, station, chair, schooldesk.

## Style anchors
- **Props / objects** — sketchbook manga-ink: loose pen lines + light diagonal
  hatch shading, black ink on white, **NO colour fill** (red ink only where a
  sentence claims red). Cute, simple. Flat chroma-key green background
  (#00b140), even light, no cast shadow, no ground line. Single object centred;
  on a sheet, one horizontal row, evenly spaced, identical size and style.
- **Avatar actions** — coloured, same character/outfit as the attached
  `assets/story/people/<id>-adult.png` (Aki red · Beni amber · Kai blue ·
  Yuki purple), skin & hair black-ink line art, green screen. See ART_PROMPTS.md
  for the base style; keep face/hair/outfit identical across the row.

---

## PROP SHEET 1 — Drinks
> Sketchbook manga-ink style, loose pen lines + light hatch shading, black ink
> on white, NO colour, chroma-key green background #00b140, no shadows. One
> horizontal row of 7 evenly-spaced objects, identical size, clean gaps:
> (1) a beer mug with foam; (2) a glass of red wine (the wine filled with RED
> ink — the only colour); (3) a glass of white wine (pale, no fill); (4) a
> Japanese tea cup (yunomi) of green tea with steam; (5) a tall iced-tea glass
> with ice cubes and a straw; (6) a glass of cola with ice and bubbles; (7) a
> sake set (tokkuri flask + small ochoko cup).

    python3 tools/cut_sheet.py drinks-sheet.png 7x1 beer,redwine,whitewine,greentea,icedtea,cola,sake assets/story

## PROP SHEET 2 — Foods
> [same style line] … One row of 8 objects: (1) a sukiyaki hot-pot (nabe) with
> steam; (2) a Japanese breakfast tray (bowl of rice, grilled fish, miso soup);
> (3) three yakitori skewers; (4) a plate of curry rice; (5) a slice of cake on
> a plate; (6) a wagashi sweet (dango skewer or mochi); (7) a plate of karaage
> (fried-chicken pieces); (8) a whole grilled fish on a plate.

    python3 tools/cut_sheet.py foods-sheet.png 8x1 sukiyaki,breakfast,yakitori,curry,cake,wagashi,karaage,grilledfish assets/story

## PROP SHEET 3 — Shop & travel objects
> [same style line] … One row of 6 objects: (1) a pair of gloves; (2) a pair of
> shoes (side view, for taking off); (3) a wallet (open, a bill peeking out);
> (4) a packet of medicine (pill sheet + small box); (5) a folded paper travel
> map; (6) a credit card.

    python3 tools/cut_sheet.py objs-sheet.png 6x1 gloves,shoes,wallet,medicine,map,card assets/story

## AVATAR SHEET 2 — new actions (attach each `<id>-adult.png`, one sheet per character)
> [coloured-avatar style line] … Same character in ONE row of 5 full-body poses,
> identical face/hair/outfit: (1) toast — raising a glass up for kanpai,
> cheerful; (2) pay — holding out money/a card toward the viewer; (3) try-on —
> holding a shirt up in front of themselves, considering it; (4) study — sitting
> at a small desk, pencil in hand over an open book; (5) wait — standing,
> glancing at a wristwatch.

    python3 tools/cut_sheet.py aki-adult2-sheet.png 5x1 aki-adult-toast,aki-adult-pay,aki-adult-tryon,aki-adult-study,aki-adult-wait assets/story/people
    # …repeat for beni / kai / yuki

## Optional backdrops (full rectangular scenes, not cut — like bg-room.png)
> Sketchbook manga-ink backdrop, black ink on white, faint hatch shading, no
> green screen: (a) a steaming outdoor hot spring (onsen) with rocks;
> (b) an aquarium hall with a large glass tank of fish.
> Save as `bg-onsen.png`, `bg-aquarium.png`.

---

## After the sheets land
Send the raw sheets to Claude, or cut them yourself. Then, to wire them in:
1. Add each new object key → PNG in `OBJ_IMG` (interactive-learning.js).
2. Add every new file to the SW `SHELL` list (sw.js) and bump `CACHE`/`?v=NN`.
3. Author the action beats (AFTER_PROMPT/BEFORE_PROMPT) for the imported
   sentences that perform an action (drink/eat/try-on/pay/toast…).
