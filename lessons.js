// Lessons — each pairs a small vocab set with ONE grammar point, then drills
// sentences that recombine those words as much as naturally possible.
// Lessons are grouped into sections (ordered = increasing difficulty).
//
// Shape:
//   { id, section, title, grammar, grammarNote,
//     vocab: [{jp, romaji, en, pos}],
//     sentences: [{ en, jp, romaji, hint?, words:[{jp,en,pos}] }] }
//
// pos (color coding): n=noun v=verb adj=adjective adv=adverb
//                     prt=particle cop=copula expr=expression
//                     aux=auxiliary conj=conjunction

window.SECTIONS = ["Basics", "Everyday life", "Describing things"];

window.LESSONS = [
  // ============================================================
  // BASICS
  // ============================================================
  {
    id: "intro",
    section: "Basics",
    title: "Hello & introductions",
    grammar: "X は Y です  ·  か",
    grammarNote:
      "は marks the topic (what you're talking about); です means is/am. Add か at the very end to turn a statement into a question.",
    vocab: [
      { jp: "わたし", romaji: "watashi", en: "I / me", pos: "n" },
      { jp: "がくせい", romaji: "gakusei", en: "student", pos: "n" },
      { jp: "アメリカじん", romaji: "amerika-jin", en: "American", pos: "n" },
      { jp: "ともだち", romaji: "tomodachi", en: "friend", pos: "n" },
      { jp: "なまえ", romaji: "namae", en: "name  (お = polite)", pos: "n" },
      { jp: "なん", romaji: "nan", en: "what", pos: "n" },
    ],
    sentences: [
      { en: "Nice to meet you.", jp: "はじめまして。", romaji: "hajimemashite.",
        words: [{jp:"はじめまして",en:"nice to meet you",pos:"expr"}] },
      { en: "I'm Tom.", jp: "わたしは トムです。", romaji: "watashi wa Tomu desu.", hint: "は marks the topic",
        words: [{jp:"わたし",en:"I",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"トム",en:"Tom",pos:"n"},{jp:"です",en:"am",pos:"cop"}] },
      { en: "I'm American.", jp: "わたしは アメリカじんです。", romaji: "watashi wa amerika-jin desu.",
        words: [{jp:"わたし",en:"I",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"アメリカじん",en:"American",pos:"n"},{jp:"です",en:"am",pos:"cop"}] },
      { en: "I'm a student.", jp: "わたしは がくせいです。", romaji: "watashi wa gakusei desu.",
        words: [{jp:"わたし",en:"I",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"がくせい",en:"student",pos:"n"},{jp:"です",en:"am",pos:"cop"}] },
      { en: "My friend is a student.", jp: "ともだちは がくせいです。", romaji: "tomodachi wa gakusei desu.",
        words: [{jp:"ともだち",en:"friend",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"がくせい",en:"student",pos:"n"},{jp:"です",en:"is",pos:"cop"}] },
      { en: "What's your name?", jp: "おなまえは なんですか？", romaji: "onamae wa nan desu ka?", hint: "か makes it a question",
        words: [{jp:"おなまえ",en:"(your) name",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"なん",en:"what",pos:"n"},{jp:"です",en:"is",pos:"cop"},{jp:"か",en:"[?]",pos:"prt"}] },
    ],
  },
  {
    id: "shop",
    section: "Basics",
    title: "At a shop — ordering & prices",
    grammar: "〜を ください  ·  〜は いくらですか",
    grammarNote:
      "を marks the thing you want; add ください to politely ask for it. To ask a price: [thing] は いくらですか？",
    vocab: [
      { jp: "これ", romaji: "kore", en: "this", pos: "n" },
      { jp: "いくら", romaji: "ikura", en: "how much", pos: "n" },
      { jp: "みず", romaji: "mizu", en: "water", pos: "n" },
      { jp: "コーヒー", romaji: "koohii", en: "coffee", pos: "n" },
      { jp: "ひとつ", romaji: "hitotsu", en: "one (item)", pos: "n" },
      { jp: "ください", romaji: "kudasai", en: "please give me", pos: "aux" },
    ],
    sentences: [
      { en: "How much is this?", jp: "これは いくらですか？", romaji: "kore wa ikura desu ka?",
        words: [{jp:"これ",en:"this",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"いくら",en:"how much",pos:"n"},{jp:"です",en:"is",pos:"cop"},{jp:"か",en:"[?]",pos:"prt"}] },
      { en: "Water, please.", jp: "みずを ください。", romaji: "mizu o kudasai.", hint: "を marks what you want",
        words: [{jp:"みず",en:"water",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"ください",en:"please give me",pos:"aux"}] },
      { en: "Coffee, please.", jp: "コーヒーを ください。", romaji: "koohii o kudasai.",
        words: [{jp:"コーヒー",en:"coffee",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"ください",en:"please give me",pos:"aux"}] },
      { en: "One coffee, please.", jp: "コーヒーを ひとつ ください。", romaji: "koohii o hitotsu kudasai.",
        words: [{jp:"コーヒー",en:"coffee",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"ひとつ",en:"one",pos:"n"},{jp:"ください",en:"please give me",pos:"aux"}] },
      { en: "This one, please.", jp: "これを ください。", romaji: "kore o kudasai.",
        words: [{jp:"これ",en:"this",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"ください",en:"please give me",pos:"aux"}] },
      { en: "How much is the water?", jp: "みずは いくらですか？", romaji: "mizu wa ikura desu ka?",
        words: [{jp:"みず",en:"water",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"いくら",en:"how much",pos:"n"},{jp:"です",en:"is",pos:"cop"},{jp:"か",en:"[?]",pos:"prt"}] },
    ],
  },

  // ============================================================
  // EVERYDAY LIFE
  // ============================================================
  {
    id: "routine",
    section: "Everyday life",
    title: "My daily routine",
    grammar: "present 〜ます  ·  time に  ·  で (by)",
    grammarNote:
      "〜ます is the polite present — also used for habits and the near future. Put に after a clock time, and で after a means of transport.",
    vocab: [
      { jp: "まいあさ", romaji: "maiasa", en: "every morning", pos: "n" },
      { jp: "しちじ", romaji: "shichi-ji", en: "7 o'clock", pos: "n" },
      { jp: "でんしゃ", romaji: "densha", en: "train", pos: "n" },
      { jp: "しごと", romaji: "shigoto", en: "work", pos: "n" },
      { jp: "コーヒー", romaji: "koohii", en: "coffee", pos: "n" },
      { jp: "おきます", romaji: "okimasu", en: "wake up  (起きる)", pos: "v" },
      { jp: "のみます", romaji: "nomimasu", en: "drink  (飲む)", pos: "v" },
      { jp: "いきます", romaji: "ikimasu", en: "go  (行く)", pos: "v" },
    ],
    sentences: [
      { en: "I wake up at seven.", jp: "しちじに おきます。", romaji: "shichi-ji ni okimasu.", hint: "に after a clock time",
        words: [{jp:"しちじ",en:"7 o'clock",pos:"n"},{jp:"に",en:"[at time]",pos:"prt"},{jp:"おきます",en:"wake up",pos:"v"}] },
      { en: "I drink coffee every morning.", jp: "まいあさ コーヒーを のみます。", romaji: "maiasa koohii o nomimasu.",
        words: [{jp:"まいあさ",en:"every morning",pos:"n"},{jp:"コーヒー",en:"coffee",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"のみます",en:"drink",pos:"v"}] },
      { en: "I go to work by train.", jp: "でんしゃで しごとに いきます。", romaji: "densha de shigoto ni ikimasu.", hint: "で = by means of",
        words: [{jp:"でんしゃ",en:"train",pos:"n"},{jp:"で",en:"[by means of]",pos:"prt"},{jp:"しごと",en:"work",pos:"n"},{jp:"に",en:"[to]",pos:"prt"},{jp:"いきます",en:"go",pos:"v"}] },
      { en: "I go to work at seven.", jp: "しちじに しごとに いきます。", romaji: "shichi-ji ni shigoto ni ikimasu.",
        words: [{jp:"しちじ",en:"7 o'clock",pos:"n"},{jp:"に",en:"[at time]",pos:"prt"},{jp:"しごと",en:"work",pos:"n"},{jp:"に",en:"[to]",pos:"prt"},{jp:"いきます",en:"go",pos:"v"}] },
      { en: "Every morning I go by train.", jp: "まいあさ でんしゃで いきます。", romaji: "maiasa densha de ikimasu.",
        words: [{jp:"まいあさ",en:"every morning",pos:"n"},{jp:"でんしゃ",en:"train",pos:"n"},{jp:"で",en:"[by means of]",pos:"prt"},{jp:"いきます",en:"go",pos:"v"}] },
      { en: "I drink coffee.", jp: "コーヒーを のみます。", romaji: "koohii o nomimasu.",
        words: [{jp:"コーヒー",en:"coffee",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"のみます",en:"drink",pos:"v"}] },
    ],
  },
  {
    id: "past-1",
    section: "Everyday life",
    title: "What did you do yesterday?",
    grammar: "past 〜ました  ·  を / に / と",
    grammarNote:
      "For the past, the polite ending becomes 〜ました. Mark the thing you act on with を, the person you meet with に, and “together with” someone with と.",
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
      { en: "Yesterday I watched a movie.", jp: "きのう えいがを みました。", romaji: "kinou eiga o mimashita.", hint: "を marks the thing you watched",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"えいが",en:"movie",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"みました",en:"watched",pos:"v"}] },
      { en: "Yesterday I met a friend.", jp: "きのう ともだちに あいました。", romaji: "kinou tomodachi ni aimashita.", hint: "あう takes に for the person",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"ともだち",en:"friend",pos:"n"},{jp:"に",en:"[with person]",pos:"prt"},{jp:"あいました",en:"met",pos:"v"}] },
      { en: "Yesterday I ate a meal.", jp: "きのう ごはんを たべました。", romaji: "kinou gohan o tabemashita.",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"ごはん",en:"meal / food",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"たべました",en:"ate",pos:"v"}] },
      { en: "I watched a movie with a friend.", jp: "ともだちと えいがを みました。", romaji: "tomodachi to eiga o mimashita.", hint: "と = (together) with",
        words: [{jp:"ともだち",en:"friend",pos:"n"},{jp:"と",en:"with",pos:"prt"},{jp:"えいが",en:"movie",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"みました",en:"watched",pos:"v"}] },
      { en: "I ate a meal with a friend.", jp: "ともだちと ごはんを たべました。", romaji: "tomodachi to gohan o tabemashita.",
        words: [{jp:"ともだち",en:"friend",pos:"n"},{jp:"と",en:"with",pos:"prt"},{jp:"ごはん",en:"meal / food",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"たべました",en:"ate",pos:"v"}] },
      { en: "What did you watch yesterday?", jp: "きのう なにを みましたか？", romaji: "kinou nani o mimashita ka?", hint: "なに = what",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"なに",en:"what",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"みました",en:"watched",pos:"v"},{jp:"か",en:"[?]",pos:"prt"}] },
      { en: "Who did you meet yesterday?", jp: "きのう だれに あいましたか？", romaji: "kinou dare ni aimashita ka?", hint: "だれ = who",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"だれ",en:"who",pos:"n"},{jp:"に",en:"[with person]",pos:"prt"},{jp:"あいました",en:"met",pos:"v"},{jp:"か",en:"[?]",pos:"prt"}] },
      { en: "Yesterday I watched a movie with a friend.", jp: "きのう ともだちと えいがを みました。", romaji: "kinou tomodachi to eiga o mimashita.", hint: "putting it all together",
        words: [{jp:"きのう",en:"yesterday",pos:"n"},{jp:"ともだち",en:"friend",pos:"n"},{jp:"と",en:"with",pos:"prt"},{jp:"えいが",en:"movie",pos:"n"},{jp:"を",en:"[object]",pos:"prt"},{jp:"みました",en:"watched",pos:"v"}] },
    ],
  },
  {
    id: "wants",
    section: "Everyday life",
    title: "What I want to do",
    grammar: "〜たい (want to)  ·  〜が ほしい (want a thing)",
    grammarNote:
      "Verb-stem + たい says you want to DO something (のむ → のみたい). For wanting a THING (a noun), use [thing] が ほしい.",
    vocab: [
      { jp: "にほん", romaji: "nihon", en: "Japan", pos: "n" },
      { jp: "おすし", romaji: "osushi", en: "sushi", pos: "n" },
      { jp: "くるま", romaji: "kuruma", en: "car", pos: "n" },
      { jp: "いきたい", romaji: "ikitai", en: "want to go", pos: "v" },
      { jp: "たべたい", romaji: "tabetai", en: "want to eat", pos: "v" },
      { jp: "やすみたい", romaji: "yasumitai", en: "want to rest", pos: "v" },
      { jp: "ほしい", romaji: "hoshii", en: "want (a thing)", pos: "adj" },
    ],
    sentences: [
      { en: "I want to go to Japan.", jp: "にほんに いきたいです。", romaji: "nihon ni ikitai desu.", hint: "に marks the destination",
        words: [{jp:"にほん",en:"Japan",pos:"n"},{jp:"に",en:"[to]",pos:"prt"},{jp:"いきたい",en:"want to go",pos:"v"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "I want to eat sushi.", jp: "おすしが たべたいです。", romaji: "osushi ga tabetai desu.",
        words: [{jp:"おすし",en:"sushi",pos:"n"},{jp:"が",en:"[subject]",pos:"prt"},{jp:"たべたい",en:"want to eat",pos:"v"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "I want to rest.", jp: "やすみたいです。", romaji: "yasumitai desu.",
        words: [{jp:"やすみたい",en:"want to rest",pos:"v"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "I want a car.", jp: "くるまが ほしいです。", romaji: "kuruma ga hoshii desu.", hint: "が ほしい = want a thing",
        words: [{jp:"くるま",en:"car",pos:"n"},{jp:"が",en:"[subject]",pos:"prt"},{jp:"ほしい",en:"want (a thing)",pos:"adj"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "I want to eat sushi in Japan.", jp: "にほんで おすしが たべたいです。", romaji: "nihon de osushi ga tabetai desu.", hint: "で = at/in (where it happens)",
        words: [{jp:"にほん",en:"Japan",pos:"n"},{jp:"で",en:"[in / at]",pos:"prt"},{jp:"おすし",en:"sushi",pos:"n"},{jp:"が",en:"[subject]",pos:"prt"},{jp:"たべたい",en:"want to eat",pos:"v"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "I want to go by car.", jp: "くるまで いきたいです。", romaji: "kuruma de ikitai desu.",
        words: [{jp:"くるま",en:"car",pos:"n"},{jp:"で",en:"[by means of]",pos:"prt"},{jp:"いきたい",en:"want to go",pos:"v"},{jp:"です",en:"[polite]",pos:"cop"}] },
    ],
  },

  // ============================================================
  // DESCRIBING THINGS
  // ============================================================
  {
    id: "adjectives",
    section: "Describing things",
    title: "Describing things (い-adjectives)",
    grammar: "い-adjectives  ·  past 〜かった",
    grammarNote:
      "い-adjectives end in 〜い (たかい = expensive). For the past, drop the い and add 〜かった (たかかった = was expensive). とても = very.",
    vocab: [
      { jp: "えいが", romaji: "eiga", en: "movie", pos: "n" },
      { jp: "りょこう", romaji: "ryokou", en: "trip", pos: "n" },
      { jp: "とても", romaji: "totemo", en: "very", pos: "adv" },
      { jp: "たかい", romaji: "takai", en: "expensive / high", pos: "adj" },
      { jp: "おいしい", romaji: "oishii", en: "delicious", pos: "adj" },
      { jp: "たのしい", romaji: "tanoshii", en: "fun / enjoyable", pos: "adj" },
    ],
    sentences: [
      { en: "It's very delicious.", jp: "とても おいしいです。", romaji: "totemo oishii desu.", hint: "とても = very",
        words: [{jp:"とても",en:"very",pos:"adv"},{jp:"おいしい",en:"delicious",pos:"adj"},{jp:"です",en:"is",pos:"cop"}] },
      { en: "The movie is fun.", jp: "えいがは たのしいです。", romaji: "eiga wa tanoshii desu.",
        words: [{jp:"えいが",en:"movie",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"たのしい",en:"fun",pos:"adj"},{jp:"です",en:"is",pos:"cop"}] },
      { en: "The trip was fun.", jp: "りょこうは たのしかったです。", romaji: "ryokou wa tanoshikatta desu.", hint: "past: い → かった",
        words: [{jp:"りょこう",en:"trip",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"たのしかった",en:"was fun",pos:"adj"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "The movie was expensive.", jp: "えいがは たかかったです。", romaji: "eiga wa takakatta desu.",
        words: [{jp:"えいが",en:"movie",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"たかかった",en:"was expensive",pos:"adj"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "It was very delicious.", jp: "とても おいしかったです。", romaji: "totemo oishikatta desu.",
        words: [{jp:"とても",en:"very",pos:"adv"},{jp:"おいしかった",en:"was delicious",pos:"adj"},{jp:"です",en:"[polite]",pos:"cop"}] },
      { en: "The trip was very fun.", jp: "りょこうは とても たのしかったです。", romaji: "ryokou wa totemo tanoshikatta desu.", hint: "putting it all together",
        words: [{jp:"りょこう",en:"trip",pos:"n"},{jp:"は",en:"[topic]",pos:"prt"},{jp:"とても",en:"very",pos:"adv"},{jp:"たのしかった",en:"was fun",pos:"adj"},{jp:"です",en:"[polite]",pos:"cop"}] },
    ],
  },
];
