# Hanasou — Speaking Studio

A separate experimental app for speaking-first Japanese practice. It intentionally does not replace the original subway/transit-themed Hanasou app.

## Open it

- GitHub Pages path: `/studio/` after the branch is deployed.
- It reuses the root `lessons.js` curriculum and `audio/manifest.json` + clips.
- No build step, framework, bundler, or npm install is required.

## Practice modes

- **Recall:** produce the Japanese answer before revealing it.
- **Pattern lab:** practice examples grouped by the grammar/theme section.
- **In the moment:** practice sentences drawn from everyday and travel themes.
- **Listen & notice:** hear a sentence first, repeat it, then reveal its meaning.

The studio's progress is stored separately under `hanasou.studio.v1` in localStorage. It does not overwrite the original app's `hanasou.v4` progress or Anki.

## Design direction

The original app's subway system remains available and unchanged. This experiment uses a calm editorial studio aesthetic instead: warm paper, deep green, restrained color, clear typography, and a single speaking-first path. The color-coded grammar breakdown appears after recall so it explains the answer instead of giving it away.

## Prototype scope / next work

This is a first usable prototype, not the finished adaptive tutor. Pattern Lab currently reuses real curriculum examples grouped by lesson section; it does not yet generate and validate arbitrary conjugations. Scene mode is a contextual sentence drill rather than open-ended AI roleplay. Next iterations should add curated transformation pairs, robust SRS tests, and conversation turns while preserving honest scoring and the offline-friendly static architecture.