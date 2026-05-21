# はなそう (Hanasou) — speaking drill

Audio-first Japanese practice. Designed for a Pimsleur-style "prompt → you speak → check" loop, with a tiny SRS so cards you miss come back sooner.

## Run it

It's a plain static site — no build, no install.

- **Easiest:** open `index.html` in Chrome (best Japanese TTS) or Safari on iOS.
- **Localhost (recommended on desktop):**
  ```sh
  python3 -m http.server 8000
  ```
  Then go to http://localhost:8000.

iOS Safari note: tap **prompt** once on the first card so iOS unlocks audio for the session.

## How a card works

1. You see an English situation: *"Ask what time it is now."*
2. **Say the Japanese out loud.** Don't tap anything yet.
3. Tap **reveal & hear** — the model answer appears and the phone speaks it.
4. **Self-grade**: `nope` / `kinda` / `got it`. Honest grading is the whole point — the SRS uses it to decide when this card comes back.

Keyboard shortcuts (desktop): space = reveal, `1`/`2`/`3` = grade, `r` = replay, `s` = slow.

## Adding / editing prompts

All content lives in `prompts.js`. Each entry needs:

```js
{
  id: 99,
  en: "What you'd say in English",
  jp: "model answer in kana",
  romaji: "romaji of the same",
  hint: "optional grammar nudge",
  tags: ["optional", "buckets"],
}
```

No build step — save the file, refresh the page.

## What's intentionally not here yet

- No speech recognition (self-grading is more honest at this stage).
- No kanji (per your call).
- No backend, no accounts — progress lives in `localStorage` on the device you use.

Next experiments to try once the loop feels right: grammar transformation drills (past/negative/question), conversation roleplay via the Claude API, sentence-builder chunk mode.
