// Lessons — each lesson pairs a small vocab set with ONE grammar point,
// then drills sentences that recombine those words as much as naturally possible.
//
// Shape:
//   { id, title, grammar, grammarNote,
//     vocab: [{jp, romaji, en, pos}],
//     sentences: [{ en, jp, romaji, hint?, words:[{jp,en,pos}] }] }
//
// pos values (shared with prompts.js, used for color coding):
//   n=noun, v=verb, adj=adjective, adv=adverb, prt=particle,
//   cop=copula, expr=expression, aux=auxiliary, conj=conjunction

window.LESSONS = [
  {
    id: "past-1",
    title: "What did you do yesterday?",
    grammar: "Past tense 〜ました  ·  を / に / と",
    grammarNote:
      "To say what you did, the polite verb ending becomes 〜ました. Mark the thing you act on with を, the person you meet with に, and “together with” someone with と.",
    vocab: [
      { jp: "きのう", romaji: "kinou", en: "yesterday", pos: "n" },
      { jp: "ともだち", romaji: "tomodachi", en: "friend", pos: "n" },
      { jp: "えいが", romaji: "eiga", en: "movie", pos: "n" },
      { jp: "ごはん", romaji: "gohan", en: "meal / food", pos: "n" },
      { jp: "なに", romaji: "nani", en: "what", pos: "n" },
      { jp: "だれ", romaji: "dare", en: "who", pos: "n" },
      { jp: "みました", romaji: "mimashita", en: "watched / saw  (見る)", pos: "v" },
      { jp: "あいました", romaji: "aimashita", en: "met  (会う)", pos: "v" },
      { jp: "たべました", romaji: "tabemashita", en: "ate  (食べる)", pos: "v" },
    ],
    sentences: [
      {
        en: "Yesterday I watched a movie.",
        jp: "きのう えいがを みました。",
        romaji: "kinou eiga o mimashita.",
        hint: "を marks the thing you watched",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "えいが", en: "movie", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "みました", en: "watched", pos: "v" },
        ],
      },
      {
        en: "Yesterday I met a friend.",
        jp: "きのう ともだちに あいました。",
        romaji: "kinou tomodachi ni aimashita.",
        hint: "あう takes に for the person you meet",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "ともだち", en: "friend", pos: "n" },
          { jp: "に", en: "[with person]", pos: "prt" },
          { jp: "あいました", en: "met", pos: "v" },
        ],
      },
      {
        en: "Yesterday I ate a meal.",
        jp: "きのう ごはんを たべました。",
        romaji: "kinou gohan o tabemashita.",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "ごはん", en: "meal / food", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "たべました", en: "ate", pos: "v" },
        ],
      },
      {
        en: "I watched a movie with a friend.",
        jp: "ともだちと えいがを みました。",
        romaji: "tomodachi to eiga o mimashita.",
        hint: "と = (together) with",
        words: [
          { jp: "ともだち", en: "friend", pos: "n" },
          { jp: "と", en: "with", pos: "prt" },
          { jp: "えいが", en: "movie", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "みました", en: "watched", pos: "v" },
        ],
      },
      {
        en: "I ate a meal with a friend.",
        jp: "ともだちと ごはんを たべました。",
        romaji: "tomodachi to gohan o tabemashita.",
        words: [
          { jp: "ともだち", en: "friend", pos: "n" },
          { jp: "と", en: "with", pos: "prt" },
          { jp: "ごはん", en: "meal / food", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "たべました", en: "ate", pos: "v" },
        ],
      },
      {
        en: "What did you watch yesterday?",
        jp: "きのう なにを みましたか？",
        romaji: "kinou nani o mimashita ka?",
        hint: "なに = what; か makes it a question",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "なに", en: "what", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "みました", en: "watched", pos: "v" },
          { jp: "か", en: "[?]", pos: "prt" },
        ],
      },
      {
        en: "What did you eat yesterday?",
        jp: "きのう なにを たべましたか？",
        romaji: "kinou nani o tabemashita ka?",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "なに", en: "what", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "たべました", en: "ate", pos: "v" },
          { jp: "か", en: "[?]", pos: "prt" },
        ],
      },
      {
        en: "Who did you meet yesterday?",
        jp: "きのう だれに あいましたか？",
        romaji: "kinou dare ni aimashita ka?",
        hint: "だれ = who; あう takes に for the person",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "だれ", en: "who", pos: "n" },
          { jp: "に", en: "[with person]", pos: "prt" },
          { jp: "あいました", en: "met", pos: "v" },
          { jp: "か", en: "[?]", pos: "prt" },
        ],
      },
      {
        en: "Yesterday I watched a movie with a friend.",
        jp: "きのう ともだちと えいがを みました。",
        romaji: "kinou tomodachi to eiga o mimashita.",
        hint: "putting it all together",
        words: [
          { jp: "きのう", en: "yesterday", pos: "n" },
          { jp: "ともだち", en: "friend", pos: "n" },
          { jp: "と", en: "with", pos: "prt" },
          { jp: "えいが", en: "movie", pos: "n" },
          { jp: "を", en: "[object]", pos: "prt" },
          { jp: "みました", en: "watched", pos: "v" },
        ],
      },
    ],
  },
];
