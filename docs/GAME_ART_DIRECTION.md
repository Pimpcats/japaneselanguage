# 百鬼夜市 — Hyakki Yaichi · Art & World Direction

*The card-game mode's visual bible. Weird, dark, and unmistakably Japanese —
Inscryption's analog dread in a sumi-ink key. This is the shop-street's
**shadow twin**: where the main app (はなそう) is warm daylight kawaii, this is
the market after midnight, when the spirits take it over.*

## The world

**百鬼夜市 — the Hundred-Demon Night Market.** A pun on the 百鬼夜行 (Hyakki
Yagyō, the Night Parade of One Hundred Demons) crossed with 夜市 (night market).
After dark the shop-street becomes a **yōkai bazaar**. You — a mortal who
wandered in — must play your way through the parade to reach dawn. Every stall
is run by a spirit; every duel is settled by **speaking Japanese** well enough
to satisfy them.

- **もち子さん is your guide** — reframed here as a **kitsune (fox) in a paper
  mask**, the one friendly face who walks you through. Warm, but she knows what
  lives here. (Her voice/clips stay canon.)
- **The foes are yōkai.** Common-noun creatures are their *bake-* (化け,
  "changed") forms — a cat is a **化け猫 bakeneko**, a bird a **鴉天狗**-tinged
  crow — so the vocab stays honest (ねこ, とり…) while the art turns eerie.
- **Bosses are named yōkai** from the lore: **ぬらりひょん (Nurarihyon)** the
  sly "supreme commander" who slips into your home; **鬼 (Oni)**; **ろくろ首
  (Rokurokubi)**; **山姥 (Yamauba)**; **大百足 (Ōmukade)**. Each is a real
  folklore figure the learner meets and remembers.

## Tone

Folk-horror, not gore. Beautiful *and* unsettling. Candle-lit, paper-thin,
rotting-gold. The dread of being a small warm thing in a night full of old,
patient, playful spirits. Charm survives — but it's the charm of a fox smiling
at you, not a plush toy.

## Palette (the whole identity hangs here)

| Token | Hex | Use |
|---|---|---|
| 墨 sumi (night ink) | `#15111c` | the board, the dark |
| 漆 urushi (lacquer) | `#1e1622` | panels/surfaces over the dark |
| 骨 bone / washi | `#efe6d0` | card & talisman faces (glow against the night) |
| 朱 shu (vermilion) | `#d1341f` | torii red — primary accent, danger, buttons |
| 金 kin (gold leaf) | `#e8b64b` | rims, the bell, rewards, kintsugi cracks |
| 人魂 hitodama (ghost-fire) | `#6ad0e0` | spirit glow, highlights, "reachable" pulse |
| 提灯 lantern amber | `#f2a63b` | warm light sources, embers |

The move: a **dark lacquer table lit by lanterns, with bone-white paper cards
glowing on it** — Inscryption's lit-table framing, done in ukiyo-e.

## Style & materials

- **Line:** sumi-e / woodblock brush ink — thick, confident, slightly ragged.
  Reference **Toriyama Sekien's *Gazu Hyakki Yagyō*** (the classic yōkai
  woodblock encyclopedia) for the creatures.
- **Texture:** aged **washi** paper grain on every card face; gold-leaf flecks;
  ink bleed at the edges. Nothing flat or vector-clean.
- **Cards = talismans.** Style creature/word cards as **お札 (ofuda) / 花札
  (hanafuda)** — narrow, bordered, bold single motif, a vertical kanji/kana
  spine. They should read as *charms you're playing against spirits.*
- **Frame:** the whole play area is a **lacquered tray / a torii gate**;
  the header is a **painted noren or a fox-mask sign** in vermilion.
- **Map:** a **night-parade scroll** — a winding lantern-lit road up through the
  market, nodes as **paper lanterns / stall signs / torii**, the trail an
  ink-brush stroke. Boss node = a large mask looming at the top.
- **Motifs to sprinkle:** torii ⛩, fox masks, paper lanterns 提灯, hitodama
  ghost-flames, moths, spider-lilies (彼岸花), crows, ink splatter, kintsugi
  gold cracks on damaged things.

## Node identities (each a spirit, each teaches)

| Node | Yōkai dressing |
|---|---|
| ⚔️ Duel | a wandering yōkai bars the road |
| ☠️ Elite | a **named lesser yōkai** — harder, richer reward |
| 🔥 Forge | **付喪神 (tsukumogami)**, tool-spirits, graft words onto your creature |
| ⛩️ Shrine (rest) | a roadside **祠**; a small offering, a small boon |
| 🦊 Spirit (quiz) | a **のっぺらぼう / kitsune** riddle — answer to claim the word |
| 🏮 Merchant | a **狸/貉 (tanuki/mujina)** peddler sells a new word-creature |
| 🎁 Mystery | a **地蔵** blessing or a cursed chest — a gamble |
| 👹 Boss | a **named yōkai** who builds its own sentences and hurls them |

## What "the art stands out" means here

Final illustration is the **owner's** to produce (same as `ART_ROADMAP.md`).
This doc is the brief; the prototype ships a **CSS treatment that evokes it**
(dark lacquer, bone talisman cards, vermilion/gold/ghost-fire, mask header) so
the direction is legible before a single panel is painted. Panels drop into
`assets/game/` behind the stable DOM, exactly like the map art plan.
