# Hanasou — Speaking Studio

A separate, speaking-first Japanese course prototype. The original subway/transit Hanasou app is unchanged.

## Open it

- App path: `/studio/` after the branch is deployed to a static host.
- Uses the existing root `lessons.js` curriculum and `audio/manifest.json` + audio clips.
- No build step, framework, bundler, or npm install is required.

## The course path

The Studio now uses the existing `window.LEVELS` curriculum, in order:

- **Level 0 — First Sounds:** build kana and recognize words.
- **Level 1 — Foundations:** greetings, introductions, shopping, daily actions, past tense, wants, and descriptions.
- **Level 2 — Connecting & Doing:** て-form, requests, ongoing actions, and linking ideas.
- **Level 3 — Getting Around:** directions, transport, tickets, and travel trouble.
- **Level 4 — Real Conversations:** casual speech, plans, opinions, reactions, and relating to others.
- **Level 5 — Nuance & Plans:** conditions, ability, intentions, and impressions.
- **Level 6 — Expert:** passive/causative forms and explaining nuance.
- **Level 7 — Master:** keigo and native-level connectives.

The home screen displays level progress and an expandable lesson sequence. Lessons unlock in order as all the lesson's recall cards have been reviewed at least once. Completing a level unlocks the next one. A lesson can be replayed at any time after it unlocks.

## Four distinct practice loops

- **Recall:** English-to-Japanese retrieval, reveal, self-grade, and spaced repetition.
- **Pattern Lab:** for curated grammar lessons, produce a transformed sentence and compare it with the model; at early sound/word lessons it becomes a word-building choice task appropriate to that stage.
- **In the Moment:** respond to a short scenario by selecting a context-appropriate Japanese reply. The dialogue continues with follow-up turns; wrong choices get corrective context. This is a curated branching-choice prototype, not open-ended speech recognition or AI roleplay.
- **Listen & Notice:** audio plays before the choices appear. Choose the meaning from distractors, then compare the Japanese transcript and replay slowly.

The listening and conversation modes record performance; pattern challenges compare the typed kana/romaji answer to the target. Self-rating and exact text matching are practice signals, not a formal pronunciation assessment.

## Progress and privacy

Studio progress is stored separately under `hanasou.studio.v1` in localStorage. It does not overwrite the original app's `hanasou.v4` progress or Anki. Progress is local to the browser/device, so it does not automatically sync between devices.

## Current scope

This is a usable static prototype, not a promise of fluency or a finished adaptive tutor. It has a guided route through the existing curriculum, eight curated sentence transformations, and three curated conversation scenarios. Future work should expand conversation branches, add more transformation pairs for each grammar point, and validate the curriculum unlock logic and mobile/audio behavior with real learner testing.
