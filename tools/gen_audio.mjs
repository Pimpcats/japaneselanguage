// Pre-generates Japanese audio for every spoken string in the app using a
// local VOICEVOX ENGINE (https://voicevox.hiroshiba.jp/), then writes
// audio/<sha1>.mp3 files plus audio/manifest.json mapping text -> filenames.
//
// The app plays these clips when present and falls back to the browser's
// speechSynthesis when a clip is missing (e.g. a brand-new sentence, or a
// browser that never downloaded the audio). Regenerating is idempotent:
// filenames are content hashes, so unchanged strings keep the same file.
//
// Usage (needs a running local VOICEVOX ENGINE listening on $VOICEVOX):
//   VOICEVOX=http://127.0.0.1:50021 SPEAKER=20 node tools/gen_audio.mjs
// Get the engine from https://github.com/VOICEVOX/voicevox_engine/releases
// (or `docker run -p 50021:50021 voicevox/voicevox_engine`), and ffmpeg on PATH.
//
// SPEAKER=20 is もち子さん (ノーマル). NOTE: clip filenames hash the TEXT only,
// not the voice — so to switch voices you must delete audio/*.mp3 first, or the
// existing clips get reused and the new voice is never synthesized.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "audio");
const BASE = (process.env.VOICEVOX || "http://127.0.0.1:50021").replace(/\/$/, "");
const SPEAKER = Number(process.env.SPEAKER || 20);
const SLOW_SCALE = 0.75; // natural-pitch slow playback for the "slow" button

// ---- Load the exact strings the app will look up -------------------------
// lessons.js assigns to window.*, so evaluate it with a window stub.
function loadLessons() {
  const window = {};
  new Function("window", readFileSync(join(ROOT, "lessons.js"), "utf8"))(window);
  new Function("window", readFileSync(join(ROOT, "kana.js"), "utf8"))(window);
  return window;
}

const { LESSONS, VERBS, MOCHIKO, SCENES, KANA } = loadLessons();

// Sentences get a normal + a slow clip; vocab and fixed UI phrases only normal.
const EXTRA_PHRASES = ["こんにちは。はなしましょう。"]; // voice test / picker preview

const tasks = new Map(); // text -> { slow: bool }
const want = (text, slow) => {
  const t = tasks.get(text) || { slow: false };
  t.slow = t.slow || slow;
  tasks.set(text, t);
};
for (const L of LESSONS) {
  for (const s of L.sentences) {
    want(s.jp, true);
    // Each word/particle chip in the breakdown is tappable — give every one its
    // own clip so taps use the same VOICEVOX voice as the sentence, not the
    // device's TTS fallback (which sounded "old" on bare particles like に/を).
    for (const w of (s.words || [])) want(w.jp, false);
  }
  for (const w of L.vocab) want(w.jp, false);
}
// Verb form families surfaced via the "⚡ forms of …" toggle — give every
// form (ます / ません / ました / て / dictionary / ない / た …) its own clip so
// they all use the same voice as the rest of the app.
for (const v of (VERBS || [])) {
  want(v.masu, false);
  want(v.dict, false);
  for (const f of Object.values(v.forms)) want(f[0], false);
}
for (const p of EXTRA_PHRASES) want(p, false);
// もち子さん's spoken lines: intro greetings, praise, and scene dialogue.
// Scene "you" lines usually duplicate lesson sentences (deduped by the map).
if (MOCHIKO) for (const g of [...(MOCHIKO.greetings || []), ...(MOCHIKO.praise || []), ...(MOCHIKO.reactions || []), ...(MOCHIKO.closings || [])]) want(g.jp, false);
for (const sc of (SCENES || [])) for (const st of (sc.steps || [])) want(st.jp, st.who === "you");
// Single-kana clips for the "New sounds" strips and the Kana practice grid —
// every hiragana and katakana letter is tappable and speaks solo.
for (const row of (KANA && KANA.rows) || []) {
  for (const ch of row.h) want(ch, false);
  for (const ch of row.k) want(ch, false);
}

// ---- VOICEVOX synthesis --------------------------------------------------
async function postJSON(path, params, body) {
  const url = BASE + path + "?" + new URLSearchParams(params).toString();
  // VOICEVOX closes connections between requests; a pooled keep-alive socket
  // gets reused and fails ("other side closed"), so force a fresh connection
  // and retry transient socket errors.
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Connection: "close" },
        body: body ? JSON.stringify(body) : "",
      });
      if (!res.ok) throw new Error(`${path} -> ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function synth(text, speedScale) {
  const query = await (await postJSON("/audio_query", { text, speaker: SPEAKER })).json();
  query.speedScale = speedScale;
  const wav = Buffer.from(await (await postJSON("/synthesis", { speaker: SPEAKER }, query)).arrayBuffer());
  return wav;
}

const sha = (s) => createHash("sha1").update(s, "utf8").digest("hex").slice(0, 16);

// Peak-normalize to -1.5 dB while encoding — raw VOICEVOX output leaves
// 6-18 dB of headroom, which played back far too quiet on phones. Keeping
// every clip at the same peak means no client-side volume knob is needed.
function toMp3(wav, outPath) {
  const tmp = outPath + ".wav";
  writeFileSync(tmp, wav);
  let gainArgs = [];
  // volumedetect prints its report on stderr (ffmpeg exits 0)
  const probe = spawnSync("ffmpeg", ["-y", "-i", tmp, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const m = /max_volume:\s*(-?[\d.]+)\s*dB/.exec(probe.stderr || "");
  if (m) {
    const gain = -1.5 - parseFloat(m[1]);
    if (Math.abs(gain) >= 1) gainArgs = ["-af", `volume=${gain.toFixed(1)}dB`];
  }
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, ...gainArgs, "-codec:a", "libmp3lame", "-q:a", "4", outPath]);
  rmSync(tmp);
}

// ---- Run -----------------------------------------------------------------
mkdirSync(AUDIO_DIR, { recursive: true });

const clips = {};
const keep = new Set(["manifest.json"]);
let made = 0, reused = 0;

for (const [text, { slow }] of tasks) {
  const entry = {};
  const variants = [["n", sha(text), 1.0]];
  if (slow) variants.push(["s", sha("slow:" + text), SLOW_SCALE]);
  for (const [key, name, scale] of variants) {
    const file = name + ".mp3";
    const out = join(AUDIO_DIR, file);
    entry[key] = file;
    keep.add(file);
    if (existsSync(out)) { reused++; continue; }
    const wav = await synth(text, scale);
    toMp3(wav, out);
    made++;
    process.stdout.write(`  ${made + reused}/${[...tasks].reduce((n, [, t]) => n + 1 + (t.slow ? 1 : 0), 0)} ${file}  ${text.slice(0, 18)}\n`);
  }
  clips[text] = entry;
}

// Drop stale clips no longer referenced (keeps the directory in sync).
for (const f of readdirSync(AUDIO_DIR)) {
  if (f.endsWith(".mp3") && !keep.has(f)) { rmSync(join(AUDIO_DIR, f)); }
}

const manifest = { version: 1, speaker: SPEAKER, slowScale: SLOW_SCALE, clips };
writeFileSync(join(AUDIO_DIR, "manifest.json"), JSON.stringify(manifest, null, 0) + "\n");

console.log(`\nDone. ${made} generated, ${reused} reused, ${Object.keys(clips).length} strings -> audio/manifest.json`);
