# Optional polish art — dedicated props (ChatGPT prompts)

These REPLACE a reused generic object in a scene that already works, making it
read as the exact sentence. All optional — generate any, none, or all. Every
scene keeps its current art until the dedicated prop lands, so nothing breaks
mid-rollout.

**Style anchor (same as every object on disk):**
> Clean hand-inked manga / children's-book illustration matching a detailed
> object sheet: confident bold ink outlines, refined soft cel + gouache shading
> inside each form, a muted natural palette (never neon, never washed-out),
> genuinely hand-drawn (no flat clip-art / vector look). Flat chroma-key green
> background #00b140, even light, no cast shadow, no ground line. On a sheet:
> ONE horizontal row, evenly spaced, identical size and style, clean gaps.

---

## Batch as two sheets (efficient) — or one object at a time

### POLISH SHEET 1 — everyday objects (6)
> [style anchor] One row of SIX objects, left to right:
> (1) a **flat-screen TV** on a low stand, screen showing a tiny simple picture;
> (2) a **bowl of white rice** (chawan) with a pair of chopsticks resting on top;
> (3) a small bowl of **nattō** — sticky fermented soybeans, chopsticks lifting
> a clump with fine sticky strands stretching up;
> (4) an **empty white dinner plate**, front-on, nothing on it;
> (5) a **toothbrush** with a small dab of toothpaste on the bristles;
> (6) a **ringing bedside alarm clock** (two bells on top, little motion marks).

```
python3 tools/cut_sheet.py polish1.png 6x1 tv,gohan,natto,emptyplate,toothbrush,alarmclock assets/story
```

### POLISH SHEET 2 — situation props (5)
> [style anchor] One row of FIVE objects, left to right:
> (1) a **grey rain cloud** with several blue rain streaks falling beneath it;
> (2) a **chat / speech bubble** (rounded rectangle with a tail) with three dots
> "…" inside, as if someone just messaged;
> (3) a **travel suitcase / carry-on** standing upright, with a pull handle and
> a small round luggage tag;
> (4) a **sneaky pickpocket hand** — a shadowy hand reaching in and lifting a
> wallet, a couple of motion lines (for "my wallet was stolen");
> (5) a **hand holding out paper money** — a hand offering a folded ¥1000 note
> toward the viewer (for "let me pay").

```
python3 tools/cut_sheet.py polish2.png 5x1 raincloud,chatbubble,suitcase,thief,bill assets/story
```

---

## What each upgrades (and the sentence it makes literal)

### LEVEL 1
| Prop | Lesson → sentence | Replaces |
|---|---|---|
| **tv** | frequency → "I often watch TV" (よく テレビを みます) | coffee |
| **gohan** | past-1 → "Yesterday I ate a meal" (ごはんを たべました) | breakfast tray |
| **emptyplate** | past-negative → "I didn't eat anything" (なにも たべませんでした) | *(unblocks — currently no scene)* |
| **alarmclock** | routine / have-to → "get up early / at seven" | wall clock |

### LEVEL 2
| Prop | Lesson → sentence | Replaces |
|---|---|---|
| **raincloud** | because → "It's raining, so I'm not going" (あめだから…) | avatar-walk |
| **toothbrush** | timing → "I brush my teeth before bed" (ねるまえに、はを みがきます) | telephone |

### LEVEL 4
| Prop | Lesson → sentence | Replaces |
|---|---|---|
| **chatbubble** | quoting → "They said they're not coming" (こないって いってた) | telephone |
| **tv** | (also L1 frequency; L4 has none needing it) | — |

### LEVEL 5
| Prop | Lesson → sentence | Replaces |
|---|---|---|
| **natto** | potential → switch anchor to "Can you eat natto?" (なっとう たべられる？) | book (kanji line) |
| **suitcase** | intend → "I'm set to go to Japan in summer" (にほんに いく よてい) | japan map |

### LEVEL 6
| Prop | Lesson → sentence | Replaces |
|---|---|---|
| **thief** | passive → "My wallet was stolen" (さいふを ぬすまれた) | wallet |
| **bill** | causative → "Let me pay today" (きょうは はらわせて) | credit card |
| **raincloud** | even-though → "Even if it rains, I'll go" (あめでも、いく) | umbrella |

---

## Wiring each prop when it lands (per object)
1. Cut with the command above → `assets/story/<key>.png`.
2. Add `<key>: "<key>",` to **OBJ_IMG** and a label to **OBJ_NAME** (interactive-learning.js).
3. Point the beat at it: change that lesson's `object:` (and for **natto**, swap
   the beat's prompt key + answer to the なっとう sentence; for **raincloud**/
   **thief**/**bill**, just change `object:`).
4. Add the file to the SW **SHELL** list (sw.js).
5. Bump `?v=NN` (index.html ×6) + `hanasou-vNN` (sw.js).
6. `node --check` + `node tools/smoke.mjs` + `node tools/lint_lessons.mjs`, then
   sync the mock and commit.
