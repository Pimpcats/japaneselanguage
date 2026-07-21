// Kana reference data — the full gojūon for hiragana and katakana, including
// dakuten/handakuten rows. Drives the per-lesson "New sounds" strip, the
// automatic romaji fade, and the Kana practice section. Each row pairs the
// hiragana and katakana forms with their romaji, position for position.
// (Small っ/ゃ/ゅ/ょ and combo sounds like きゃ are read inside words rather
// than practiced solo — a single っ has no pronunciation of its own.)
window.KANA = {
  rows: [
    { name: "あ", h: "あいうえお", k: "アイウエオ", r: ["a", "i", "u", "e", "o"] },
    { name: "か", h: "かきくけこ", k: "カキクケコ", r: ["ka", "ki", "ku", "ke", "ko"] },
    { name: "さ", h: "さしすせそ", k: "サシスセソ", r: ["sa", "shi", "su", "se", "so"] },
    { name: "た", h: "たちつてと", k: "タチツテト", r: ["ta", "chi", "tsu", "te", "to"] },
    { name: "な", h: "なにぬねの", k: "ナニヌネノ", r: ["na", "ni", "nu", "ne", "no"] },
    { name: "は", h: "はひふへほ", k: "ハヒフヘホ", r: ["ha", "hi", "fu", "he", "ho"] },
    { name: "ま", h: "まみむめも", k: "マミムメモ", r: ["ma", "mi", "mu", "me", "mo"] },
    { name: "や", h: "やゆよ", k: "ヤユヨ", r: ["ya", "yu", "yo"] },
    { name: "ら", h: "らりるれろ", k: "ラリルレロ", r: ["ra", "ri", "ru", "re", "ro"] },
    { name: "わ", h: "わを", k: "ワヲ", r: ["wa", "o"] },
    { name: "ん", h: "ん", k: "ン", r: ["n"] },
    { name: "が", h: "がぎぐげご", k: "ガギグゲゴ", r: ["ga", "gi", "gu", "ge", "go"] },
    { name: "ざ", h: "ざじずぜぞ", k: "ザジズゼゾ", r: ["za", "ji", "zu", "ze", "zo"] },
    { name: "だ", h: "だぢづでど", k: "ダヂヅデド", r: ["da", "ji", "zu", "de", "do"] },
    { name: "ば", h: "ばびぶべぼ", k: "バビブベボ", r: ["ba", "bi", "bu", "be", "bo"] },
    { name: "ぱ", h: "ぱぴぷぺぽ", k: "パピプペポ", r: ["pa", "pi", "pu", "pe", "po"] },
  ],
};
