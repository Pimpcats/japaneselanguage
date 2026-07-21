// Visual-learning layer: a curated Japanese→emoji map for the word-chips.
// Philosophy: only CONCRETE, unambiguous words get a glyph. An approximate or
// wrong emoji teaches the wrong meaning, so anything we're unsure about stays
// blank. Grammar glue (particles, copula, auxiliaries) never gets one.
//
// Public API:  window.HanaEmoji.for({ jp, en, pos }) -> "🍣" | ""
(function () {
  "use strict";

  // Precise per-word overrides, keyed by the Japanese dictionary form. Use for
  // homophones the English gloss can't disambiguate, or where the gloss is
  // unreliable. (Kept small on purpose — the gloss handles most cases.)
  // (はし bridge/chopsticks, はな flower/nose are homophones — we deliberately
  // leave them to the English gloss, which carries the sentence's real meaning.)
  const JP = {
    "ふじさん": "🗻", "ふじ": "🗻",
    "にほん": "🗾", "日本": "🗾",
  };

  // Base English lemma → emoji. The lookup stems inflections (ate→eat,
  // buying→buy, dogs→dog) so we only list base forms here. Two-word keys are
  // matched against the whole normalised gloss as well as single tokens.
  const BASE = {
    // ── food & drink ──────────────────────────────────────────────
    sushi: "🍣", rice: "🍚", bread: "🍞", meat: "🥩", fish: "🐟", egg: "🥚",
    cake: "🍰", sweets: "🍬", candy: "🍬", coffee: "☕", tea: "🍵",
    water: "💧", sake: "🍶", alcohol: "🍶", beer: "🍺", salt: "🧂",
    vegetable: "🥬", fruit: "🍎", apple: "🍎", peach: "🍑", persimmon: "🍊",
    natto: "🫘", meal: "🍱", food: "🍱", breakfast: "🍳", lunch: "🍱",
    dinner: "🍽️", cooking: "🍳", menu: "📋", chopsticks: "🥢",
    // ── animals & nature ──────────────────────────────────────────
    cat: "🐈", dog: "🐕", cow: "🐄", bird: "🐦", octopus: "🐙",
    insect: "🐛", bug: "🐛", flower: "🌸", "cherry blossom": "🌸",
    blossom: "🌸", tree: "🌳", mountain: "⛰️",
    sea: "🌊", ocean: "🌊", pond: "🏞️", river: "🏞️", star: "⭐",
    rain: "🌧️", snow: "❄️", sky: "🌤️",
    // ── time & seasons ────────────────────────────────────────────
    morning: "🌅", night: "🌙", summer: "☀️", winter: "❄️",
    // ── places ────────────────────────────────────────────────────
    airport: "✈️", bank: "🏦", school: "🏫", company: "🏢", office: "🏢",
    shop: "🏪", store: "🏪", market: "🏪", park: "🏞️", home: "🏠", house: "🏠",
    station: "🚉", hospital: "🏥", library: "📚", restaurant: "🍴",
    hotel: "🏨", garden: "🌷", island: "🏝️",
    town: "🏘️", exit: "🚪", platform: "🚉", road: "🛣️", bridge: "🌉",
    toilet: "🚽", restroom: "🚻", trip: "🧳", travel: "🧳", "traffic light": "🚦",
    "green tea": "🍵", gift: "🎁", present: "🎁", party: "🎉", birthday: "🎂",
    // ── objects ───────────────────────────────────────────────────
    book: "📖", bag: "👜", wallet: "👛", umbrella: "☂️", phone: "📞",
    telephone: "📞", camera: "📷", photo: "📷", movie: "🎬", tv: "📺",
    television: "📺", music: "🎵", ticket: "🎫", clock: "🕐",
    window: "🪟", chair: "🪑", table: "🪑", light: "💡", key: "🔑",
    money: "💰", yen: "💴", letter: "✉️", newspaper: "📰",
    // ── transport ─────────────────────────────────────────────────
    train: "🚆", bus: "🚌", car: "🚗", taxi: "🚕", boat: "⛵", ship: "⛵",
    bicycle: "🚲", bike: "🚲", plane: "✈️", airplane: "✈️",
    // ── body ──────────────────────────────────────────────────────
    face: "😀", hand: "✋", foot: "🦶", leg: "🦶", teeth: "🦷", tooth: "🦷",
    eye: "👁️", ear: "👂", mouth: "👄", nose: "👃", voice: "🗣️", heart: "❤️",
    // ── people ────────────────────────────────────────────────────
    person: "🧑", child: "🧒", kid: "🧒", friend: "👫", teacher: "🧑‍🏫",
    student: "🧑‍🎓", doctor: "🧑‍⚕️", baby: "👶", family: "👪",
    // ── places / proper nouns (a little flavour) ─────────────────
    japan: "🗾", tokyo: "🗼", kyoto: "⛩️", osaka: "🏯", fuji: "🗻",
    // ── verbs (clear physical / everyday actions only) ────────────
    eat: "🍽️", drink: "🥤", sleep: "😴", wake: "⏰", buy: "🛒", sell: "🏷️",
    read: "📖", write: "✍️", see: "👀", look: "👀", watch: "👀",
    listen: "👂", hear: "👂", speak: "💬", talk: "💬", say: "💬",
    swim: "🏊", walk: "🚶", run: "🏃", go: "🚶", come: "🙋", wash: "🧼",
    wait: "⏳", meet: "🤝", study: "📚", work: "💼", sit: "🪑",
    stand: "🧍", laugh: "😄", cry: "😢", rest: "😌", climb: "🧗",
    hurry: "🏃", pay: "💳", teach: "🧑‍🏫", learn: "📚", touch: "👆",
    drive: "🚗", ride: "🚃", fly: "✈️", sing: "🎤", dance: "💃",
    help: "🤝", call: "📞", open: "🔓", close: "🔒", turn: "↩️",
    arrive: "🛬", lend: "🤲", apologize: "🙇", live: "🏠", cook: "🍳",
    "get up": "⏰", "wake up": "⏰", "give up": "🏳️", "try hard": "💪",
    // ── adjectives (literal colours / temperature / clear feelings) ─
    red: "🔴", blue: "🔵", white: "⚪", black: "⚫", green: "🟢",
    hot: "🔥", cold: "🥶", warm: "☀️", delicious: "😋", tasty: "😋",
    love: "❤️", like: "👍", sleepy: "😴", tired: "😫", fun: "🎉",
    busy: "😵", famous: "⭐", expensive: "💰", quiet: "🤫", strong: "💪",
    cute: "🥰", pretty: "🥰", scary: "😱", fast: "💨", loud: "📢",
  };

  // Irregular past/participle → lemma, so stemming reaches the base verb.
  const IRREG = {
    ate: "eat", eaten: "eat", drank: "drink", drunk: "drink", bought: "buy",
    went: "go", gone: "go", came: "come", said: "say", saw: "see", seen: "see",
    woke: "wake", woken: "wake", ran: "run", swam: "swim", slept: "sleep",
    sat: "sit", stood: "stand", wrote: "write", written: "write",
    taught: "teach", paid: "pay", took: "take", spoke: "speak",
    spoken: "speak", heard: "hear", knew: "know", known: "know",
    thought: "think", lost: "lose", left: "leave", felt: "feel", read: "read",
  };

  // Words that must never trigger a glyph on their own (grammar / pronouns /
  // helpers). Real content verbs like "go", "do" stay OUT of this list.
  const STOP = new Set([
    "to", "for", "me", "you", "it", "its", "a", "an", "the", "of", "and",
    "or", "i", "we", "he", "she", "they", "is", "am", "are", "be", "will",
    "can", "cant", "want", "not", "no", "my", "your", "this", "that", "up",
    "on", "in", "at", "s", "t", "let", "lets", "don", "dont", "did", "does",
    "was", "were", "one", "two", "three", "polite", "casual", "honorific",
    "humble", "acts", "act",
  ]);

  // Candidate lemmas for a token — try several de-inflections and let the
  // caller pick whichever hits the map (vegetables→vegetable, driving→drive).
  function variants(t) {
    const out = [t];
    if (IRREG[t]) out.push(IRREG[t]);
    if (t.length > 4 && t.endsWith("ing")) { out.push(t.slice(0, -3), t.slice(0, -3) + "e"); }
    if (t.length > 3 && t.endsWith("ed")) { out.push(t.slice(0, -2), t.slice(0, -2) + "e"); }
    if (t.length > 3 && t.endsWith("es")) out.push(t.slice(0, -2));
    if (t.length > 3 && t.endsWith("s")) out.push(t.slice(0, -1));
    return out;
  }

  function fromGloss(gloss) {
    let g = String(gloss || "").toLowerCase();
    g = g.replace(/（[^）]*）/g, " ").replace(/\([^)]*\)/g, " "); // drop readings/notes
    g = g.replace(/[^a-z\s/]/g, " ");
    // whole-phrase attempts first (so two-word keys can win), then per-token
    const phrases = [g.replace(/\//g, " ").replace(/\s+/g, " ").trim()]
      .concat(g.split("/").map((s) => s.trim()).filter(Boolean));
    for (const p of phrases) {
      if (BASE[p]) return BASE[p];
      for (const raw of p.split(/\s+/)) {
        const t = raw.trim();
        if (!t || STOP.has(t)) continue;
        for (const v of variants(t)) if (BASE[v]) return BASE[v];
      }
    }
    return "";
  }

  window.HanaEmoji = {
    // word: { jp, en, pos } — returns an emoji string or "" (no confident match)
    for: function (word) {
      if (!word) return "";
      const pos = word.pos;
      if (pos && !/^(n|v|adj)$/.test(pos)) return ""; // content words only
      if (word.jp && Object.prototype.hasOwnProperty.call(JP, word.jp)) return JP[word.jp];
      return fromGloss(word.en);
    },
  };
})();
