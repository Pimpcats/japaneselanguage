# Content Roadmap — はなそう (Hanasou)

A plan for growing the lessons from "most of N5" up through N1, organized
around **what you can actually say**, not grammar for its own sake.

## The one rule

> Every sentence has to pass the **"would I actually say this?"** test.

We are not building a textbook. We're building a phrasebook with a spine of
grammar underneath it. If a sentence is grammatically tidy but you'd never say
it in real life (the infamous *"It's better to put your valuables in the
safe"*), it doesn't go in. When a grammar point needs an example, we reach for
the most common real-life situation that uses it.

**Flavor priority** (what "useful" means here, in order):

1. **Daily life & travel** — restaurants, shops, trains, hotels, asking for
   help, getting around, dealing with small problems on the ground in Japan.
2. **Casual social / friends** — making plans, giving opinions, reacting,
   small talk, the natural spoken register you'd use with people you know.

Work/formal and media/anime flavors are welcome later but are not the focus.

## Where we are today

- **Lessons** (`lessons.js`): 29 lessons across 7 themes.
- **Prompts** (`prompts.js`): 180 standalone drill sentences, levels 1–5.
- **Coverage:** most of **N5**, edging into N4.

The home screen is organised into **Levels** (the tabs, `window.LEVELS` in
`lessons.js`); each level nests difficulty **tiers**, each tier nests **themes**,
and lessons attach to a theme via their `section`. One stage = one level.

| Level | Stage | Themes | Status |
|-------|-------|--------|--------|
| Level 1 — Foundations | 1 | First contact, Getting things, Doing things, Daily life, The past, Wants & plans, Describing things | **built** (37→29 lessons) |
| Level 2 — Connecting & doing | 2 | The て-form, Linking ideas | **built** (te-form, 8 lessons) |
| Level 3 — Getting around | 3 | Getting around | coming soon |
| Level 4 — Real conversations | 4 | Real conversations | coming soon |

**The て-form gap is now closed** — Level 2 added it (requests, "I'm doing X",
because/but, permission, chaining, when/before/after). It was the single
biggest gateway to natural speech and is the foundation everything above builds on.

## The stages

Each stage maps loosely to a JLPT level but leads with capability. Stages 2–4
fill the existing empty themes; Stages 5–7 add new tiers.

### Stage 1 — Survival & basics · ≈ N5 · DONE
Greetings, introductions, this/that, numbers & money, ordering, location
(あります/います), polite verbs (ます/ません), past (ました/ませんでした), でした,
wants (たい/ほしい), let's (ましょう/ませんか), likes (すき/きらい), can (できます),
い- and な-adjectives, daily routine, time, frequency, places (で/に/へ).

---

### Stage 2 — Connecting & doing · ≈ N5→N4 · ✅ BUILT (Level 2)
**Now live as Level 2**, split into two tier-themes: *The て-form* (basics,
requests, in-progress) and *Linking ideas* (because/but, permission, sequences,
timing). Introduces the て-form and the words that join thoughts together.

| Lesson | Grammar | Example useful sentence |
|--------|---------|-------------------------|
| The て-form | verb → て | (mechanics; taught through the lessons below) |
| Please do X | 〜てください | ちょっと まってください。— *Wait a sec, please.* |
| I'm doing X / ongoing | 〜ています | いま、ばんごはんを たべています。— *I'm eating dinner now.* / とうきょうに すんでいます。— *I live in Tokyo.* |
| Because / so | 〜から・〜ので | つかれたから、かえります。— *I'm tired, so I'm heading home.* |
| But / though | 〜が・〜けど | たかいけど、かいます。— *It's pricey, but I'll buy it.* |
| May I? / Don't | 〜てもいいですか・〜ては だめ | ここで しゃしんを とっても いいですか？— *Can I take a photo here?* |
| Do A, then B | 〜て、〜・〜たり〜たり | おきて、コーヒーを のんで、でかけます。— *I get up, drink coffee, and head out.* |
| When / before / after | 〜とき・〜まえに・〜あとで | ねるまえに、はを みがきます。— *I brush my teeth before bed.* |

---

### Stage 3 — Getting around · ≈ N4 · fills *Getting around* theme
Pure daily-life-and-travel. Navigation and the small problems that come with it.

| Lesson | Grammar / focus | Example useful sentence |
|--------|-----------------|-------------------------|
| Directions | まっすぐ・みぎ・ひだり・つぎの〜で | つぎの しんごうを みぎに まがってください。— *Turn right at the next light.* |
| Transport | 〜で いきます・〜から〜まで | でんしゃで いきます。— *I'll go by train.* |
| Does this go to…? | この〜は 〜に いきますか | この バスは えきに いきますか？— *Does this bus go to the station?* |
| How far / how long | どのくらい・どれくらい | えきまで どのくらい かかりますか？— *How long does it take to the station?* |
| Buying tickets | 〜まで いちまい | しんじゅくまで いちまい おねがいします。— *One to Shinjuku, please.* |
| Trouble | みちに まよう・のりおくれる | みちに まよいました。— *I'm lost.* / でんしゃに のりおくれました。— *I missed the train.* |
| You'd better… | 〜たほうがいい | はやく いったほうが いいですよ。— *You'd better go soon.* |

---

### Stage 4 — Real conversations · ≈ N4→N3 · fills *Real conversations* theme
Where speaking gets natural. **Plain/casual form** plus the social glue of
opinions, favors, comparisons, and reactions. Heavy on the casual-social flavor.

| Lesson | Grammar / focus | Example useful sentence |
|--------|-----------------|-------------------------|
| Casual / plain form | だ・casual verbs (する→する, いく→いく) | きょう、なにする？— *What are you doing today?* |
| I think… | 〜と おもいます | あした あめだと おもう。— *I think it'll rain tomorrow.* |
| They said… / quoting | 〜と いいました | あした こないって いってた。— *They said they're not coming tomorrow.* |
| Favors (give/receive) | あげる・くれる・もらう | ともだちに かしてもらった。— *A friend lent it to me.* |
| Comparing | 〜より・〜のほうが・いちばん | でんしゃより バスの ほうが やすい。— *The bus is cheaper than the train.* |
| Reactions / aizuchi | そうですね・なるほど・まじで | え、まじで！？— *Wait, seriously!?* |
| Making plans | 〜ない？・〜よう | こんど ごはん いかない？— *Wanna grab food sometime?* |

---

### Stage 5 — Nuance & plans · ≈ N3 · new tier
| Focus | Grammar | Example useful sentence |
|-------|---------|-------------------------|
| If / when | 〜たら・〜ば・〜と・〜なら | やすかったら、かう。— *If it's cheap, I'll buy it.* |
| Have to / don't have to | 〜なければ ならない・〜なくてもいい | あした はやく おきなきゃ。— *I've gotta get up early tomorrow.* |
| Potential ("can") | 〜られる・〜える | にほんごが はなせる。— *I can speak Japanese.* |
| Plan / intend to | 〜つもり・〜よてい | らいしゅう かえる つもり。— *I plan to go home next week.* |
| Seems like | 〜そう・〜みたい・〜らしい | おいしそう！— *Looks delicious!* |
| Try doing / end up | 〜てみる・〜てしまう | いちど たべてみて。— *Try eating it once.* |
| Have you ever…? | 〜たことがある | すしを たべたことが ある？— *Have you ever had sushi?* |

---

### Stage 6 — Expressing yourself · ≈ N2 · new tier
Passive & causative (real uses: "I was told to…", "let me…"), connectives
(のに / ても / ば〜ほど / によって), explaining (はず / わけ / べき), and softeners
for slightly more formal situations.

---

### Stage 7 — Native polish · ≈ N1 · new tier
Keigo (sonkeigo / kenjougo) for work and service, formal/written connectives
(において / にあたって / ものの), nuance particles, and idiomatic, discourse-level
fluency drawn from native content.

---

## How content is authored (for whoever builds the lessons)

Lessons live in `lessons.js`. A lesson pairs a small vocab set with **one**
grammar point, then drills sentences that recombine those words:

```js
{
  id: "te-please",
  section: "Connecting ideas",        // must match a theme in window.TIERS
  title: "Please do X (〜てください)",
  grammar: "〜てください",
  grammarNote: "Plain-language explanation of the one grammar point.",
  vocab: [{ jp, romaji, en, pos }],
  sentences: [
    { en, jp, romaji, hint?, words: [{ jp, en, pos }] },
  ],
}
```

- `pos` color codes: `n` noun, `v` verb, `adj` adjective, `adv` adverb,
  `prt` particle, `cop` copula, `expr` expression, `aux` auxiliary,
  `conj` conjunction.
- New tiers (Stages 5–7) require adding entries to `window.TIERS` with their
  theme names before lessons in those themes will appear.
- Standalone practice lines can also go in `prompts.js` (`{ id, level, en, jp,
  romaji, hint?, words }`).
- No build step — save the file and refresh.

## Suggested build order

1. ~~**Stage 2** — te-form (Level 2).~~ ✅ done — biggest unlock.
2. **Stage 3** — *Getting around* / Level 3 (daily-life/travel payoff). **← next**
3. **Stage 4** — *Real conversations* / Level 4 (casual register).
4. **Stages 5–7** — add Levels 5+ as the lower levels fill in.
