// Hanasou interactive visual-learning breaks.
//
// A modular add-on that sits BESIDE app.js — it never touches the sentence
// engine, SRS, audio, or word cards. app.js calls three optional hooks
// (window.HanasouStory.onSession / afterGrade / beforeCard) at the natural
// seams of the drill; this module renders short, touch-friendly story moments
// as a full-screen overlay: little CSS-drawn environments where the learner
// answers by DOING — choosing, placing, pointing, asking, ordering.
//
// The rule (owner, 2026-07): the act must PRODUCE the exact sentence the
// learner then says. Interaction establishes meaning; the untouched speaking
// card that follows still does the work.
//
// State lives under one localStorage key (hanasou.story.v1), separate from
// lesson/SRS progress, so it can be reset or removed without side effects.
(function () {
  "use strict";

  const STORAGE_KEY = "hanasou.story.v1";
  let builtThisSession = false;

  // ---- the learner's claimable items ---------------------------------------
  const PEOPLE = [
    { id: "aki", name: "Aki", svg: "P_aki" },
    { id: "beni", name: "Beni", svg: "P_beni" },
    { id: "kai", name: "Kai", svg: "P_kai" },
    { id: "yuki", name: "Yuki", svg: "P_yuki" },
  ];
  const BOOKS = [
    { id: "circle", name: "circle cover" },
    { id: "stripes", name: "striped cover" },
    { id: "window", name: "window cover" },
  ];

  // ---- object library (all CSS-drawn; people use the app's chibi art) ------
  const OBJ_NAME = { book: "book", bag: "bag", clock: "clock", cup: "tea", water: "water", coffee: "coffee", mystery: "mystery bundle", wc: "restroom sign", station: "station", friend: "friend", mochiko: "もち子", menu: "menu", sushi: "sushi", car: "car", house: "house", bigface: "big face", persimmon: "persimmon", dogface: "dog", redflower: "flower", boat: "boat", sea: "sea", town: "town", winter: "snowman", sakura: "cherry tree", whitecat: "white cat", japanmap: "Japan", telephone: "telephone", mountain: "mountain", sun: "sun", moon: "moon", chair: "chair", signal: "traffic light", train: "train", bus: "bus", umbrella: "umbrella", ticket: "ticket", cow: "cow", octopus: "octopus", cat: "cat", star: "stars", peach: "peach", bird: "bird", flower: "flower" };
  const OBJ_JP = { book: "ほん", bag: "かばん", clock: "とけい", cup: "おちゃ", water: "みず", coffee: "コーヒー", wc: "トイレ", station: "えき", friend: "ともだち", menu: "メニュー", sushi: "おすし", car: "くるま", house: "いえ", bigface: "かお", persimmon: "かき", dogface: "いぬ", redflower: "はな", boat: "ふね", sea: "うみ", town: "まち", winter: "ふゆ", sakura: "さくら", whitecat: "ねこ", japanmap: "にほん", telephone: "でんわ", mountain: "やま", sun: "たいよう", moon: "つき", chair: "いす", signal: "しんごう", train: "でんしゃ", bus: "バス", umbrella: "かさ", ticket: "きっぷ", cow: "うし", octopus: "たこ", cat: "ねこ", star: "ほし", peach: "もも", bird: "とり", flower: "はな" };

  // ---- zones: distance IS the grammar --------------------------------------
  // things: これ・それ・あれ  ·  places: ここ・そこ・あそこ
  const WORDSETS = {
    thing: { near: "これ", partner: "それ", far: "あれ" },
    place: { near: "ここ", partner: "そこ", far: "あそこ" },
  };
  const WORDSET_COPY = {
    thing: "これ = near you · それ = by them · あれ = far away.",
    place: "ここ = right here · そこ = there, by them · あそこ = way over there.",
  };
  const ZONE_DESC = {
    near: "right by your hand",
    partner: "next to もち子",
    far: "far away over there",
  };

  // ---- story beats, per lesson ----------------------------------------------
  // Keyed by the card's English prompt. Each beat carries its home lesson so a
  // card riding another lesson's warmup never triggers it there. Types:
  //   claim    choose a persistent item (once)
  //   place    drag/tap it into position
  //   point    pick the object at the right DISTANCE (これ/それ/あれ)
  //   identify find YOUR item among decoys
  //   ask      tap the unknown thing — the act of curiosity IS the question
  //   order    tap what you want on the counter — it drops into your basket
  // `next` chains beats; a map value may be a function resolved at fire time.
  const PLACE_BEAT = { id: "place-book", type: "place", item: "book" };
  const CLAIM_BEAT = { id: "claim-book", type: "claim", item: "book", once: true, next: PLACE_BEAT };

  // Counter words for the count act (tap items one by one).
  const COUNTS = ["ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ"];

  const AFTER_PROMPT = {
    "this-that": {
      // First time: choose your book, then put it on the desk — one flowing
      // scene. Later runs remember the cover, so only the placement replays.
      "This is a book.": () => (story.completed["claim-book"] ? PLACE_BEAT : CLAIM_BEAT),
    },
  };

  const HOUSE_BEAT = { id: "l0-ie", type: "ask", scene: "street", zone: "partner", object: "house",
    askLabel: "Call it out:", cta: "Say it →", feedback: "いい = nice. いえ = house.",
    instruction: "Look at that house",
    copy: "What a place. Tap it, then call it out.",
    answer: { jp: "いい いえ！", romaji: "ii ie", en: "What a nice house!" } };
  // The welcome tour, composed at fire time so today's sound tiles can slot
  // in AFTER it (owner: intro first, then the letters). Panel 3 is the live
  // card walkthrough — it teaches subject→object→verb on a working example.
  const TOUR_PANELS = [
    { id: "tour-1", type: "info", once: true,
      instruction: "ようこそ — welcome!",
      copy: "はなそう teaches you to SPEAK. Every card shows English — you say it in Japanese out loud, then tap to hear もち子 say it for real.",
      art: "mochiko", cta: "Next →" },
    { id: "tour-2", type: "info",
      instruction: "One symbol, one sound",
      copy: "Japanese is written in kana. Each symbol is always the same sound — no surprises. This level teaches five a day, and the abc letters stay above every kana until you know it. They fade as you learn.",
      cta: "Next →" },
    { id: "tour-demo", type: "cardDemo",
      instruction: "Here's a card" },
    { id: "tour-4", type: "info",
      instruction: "The world taps back",
      copy: "Sometimes the room comes alive — a shop, a street, a thing to point at. Do the action, then say the line. Acting it out is how words stick.",
      cta: "Start →" },
  ];
  const chainBeats = (panels, tail) =>
    panels.reduceRight((next, p) => Object.assign({}, p, { next }), tail);

  const BEFORE_PROMPT = {
    // ---- Level 0 · か row: see the remarkable thing, call it out ----------
    "l0-ka": {
      "A big face!": {
        id: "l0-bigface", type: "ask",
        scene: "room", zone: "partner", object: "bigface",
        askLabel: "Call it out:", cta: "Say it →", feedback: "You can't NOT say something.",
        instruction: "Whoa — that guy…",
        copy: "That is quite a face. Tap it, then call it out.",
        answer: { jp: "おおきい かお！", romaji: "ookii kao", en: "A big face!" },
      },
      "A red persimmon!": {
        id: "l0-kaki", type: "ask",
        scene: "room", zone: "table", object: "persimmon",
        askLabel: "Call it out:", cta: "Say it →", feedback: "So red. Say it!",
        instruction: "On the table — small, round, red",
        copy: "A persimmon, perfectly ripe. Tap it, then call it out.",
        answer: { jp: "あかい かき！", romaji: "akai kaki", en: "A red persimmon!" },
      },
    },

    // ---- Level 0 · more see-it-say-it moments -----------------------------
    "l0-sa": {
      "Tasty sushi!": { id: "l0-sushi", type: "ask", scene: "room", zone: "near", object: "sushi",
        askLabel: "Call it out:", cta: "Say it →", feedback: "Mmm. Say it!",
        instruction: "Fresh sushi, right in front of you",
        copy: "It looks perfect. Tap it, then call it out.",
        answer: { jp: "おいしい すし！", romaji: "oishii sushi", en: "Tasty sushi!" } },
      "A big cow!": { id: "l0-cow", type: "ask", scene: "room", zone: "partner", object: "cow",
        askLabel: "Call it out:", cta: "Say it →", feedback: "It is ENORMOUS.",
        instruction: "There is a cow indoors",
        copy: "A very large cow. Tap it, then call it out.",
        answer: { jp: "おおきい うし！", romaji: "ookii ushi", en: "A big cow!" } },
    },
    "l0-ta": {
      "An expensive clock!": { id: "l0-clock", type: "ask", scene: "room", zone: "table", object: "clock", tag: true, tagText: "98,000円",
        askLabel: "Call it out:", cta: "Say it →", feedback: "That price…!",
        instruction: "Look at that price tag",
        copy: "98,000 yen?! Tap the clock and call it out.",
        answer: { jp: "たかい とけい！", romaji: "takai tokei", en: "An expensive clock!" } },
      "A small octopus!": { id: "l0-tako", type: "ask", scene: "room", zone: "table", object: "octopus",
        askLabel: "Call it out:", cta: "Say it →", feedback: "Tiny!",
        instruction: "Something small on the table",
        copy: "A very small octopus. Tap it, then call it out.",
        answer: { jp: "ちいさい たこ！", romaji: "chiisai tako", en: "A small octopus!" } },
    },
    "l0-na": {
      "The dog's face!": { id: "l0-inu", type: "ask", scene: "room", zone: "near", object: "dogface",
        askLabel: "Call it out:", cta: "Say it →", feedback: "の — the dog's.",
        instruction: "A dog, right up close",
        copy: "That is one happy face. Tap it and call it out.",
        answer: { jp: "いぬの かお！", romaji: "inu no kao", en: "The dog's face!" } },
      "The cat's foot!": { id: "l0-neko", type: "ask", scene: "room", zone: "partner", object: "cat",
        askLabel: "Call it out:", cta: "Say it →", feedback: "の links owner to thing: cat's foot.",
        instruction: "The cat is showing you its paw",
        copy: "Tap the raised paw — の makes it the cat's.",
        answer: { jp: "ねこの あし！", romaji: "neko no ashi", en: "The cat's foot!" } },
    },
    "l0-ha": {
      "The flower is red.": { id: "l0-akahana", type: "ask", scene: "room", zone: "wall", object: "redflower",
        askLabel: "Say it:", cta: "Say it →", feedback: "あかい — red, and nothing but.",
        instruction: "One enormous red flower",
        copy: "It fills the room. Tap it and say its colour.",
        answer: { jp: "はなは あかい。", romaji: "hana wa akai", en: "The flower is red." } },
      "The boat is big.": { id: "l0-fune", type: "ask", scene: "street", zone: "near", object: "boat",
        askLabel: "Call it out:", cta: "Say it →", feedback: "ふね — boat. A big one.",
        instruction: "Down at the water — a boat",
        copy: "It barely fits in view. Tap it and say it.",
        answer: { jp: "ふねは おおきい。", romaji: "fune wa ookii", en: "The boat is big." } },
      "The stars are far away.": { id: "l0-hoshi", type: "ask", scene: "street", zone: "far", object: "star", night: true,
        askLabel: "Say it:", cta: "Say it →", feedback: "So far — とおい.",
        instruction: "Way up there — stars",
        copy: "Tiny with distance. Tap them and say it.",
        answer: { jp: "ほしは とおい。", romaji: "hoshi wa tooi", en: "The stars are far away." } },
    },
    "l0-ma": {
      "The sea is blue.": { id: "l0-umi", type: "ask", scene: "street", zone: "wall", object: "sea",
        askLabel: "Say it:", cta: "Say it →", feedback: "あおい — blue, edge to edge.",
        instruction: "The sea, all the way out",
        copy: "Blue to the horizon. Tap it and say its colour.",
        answer: { jp: "うみは あおい。", romaji: "umi wa aoi", en: "The sea is blue." } },
      "The town is small.": { id: "l0-machi", type: "ask", scene: "street", zone: "far", object: "town",
        askLabel: "Say it:", cta: "Say it →", feedback: "ちいさい — small with distance.",
        instruction: "A little town, way out there",
        copy: "From up here it looks tiny. Tap it and say it.",
        answer: { jp: "まちは ちいさい。", romaji: "machi wa chiisai", en: "The town is small." } },
      "The peach is tasty.": { id: "l0-momo", type: "ask", scene: "room", zone: "table", object: "peach",
        askLabel: "Say it:", cta: "Say it →", feedback: "Perfectly ripe.",
        instruction: "One perfect peach",
        copy: "You had a bite already. Tap it and say it.",
        answer: { jp: "ももは おいしい。", romaji: "momo wa oishii", en: "The peach is tasty." } },
    },
    "l0-ra": {
      "The cherry blossoms are white.": { id: "l0-sakura", type: "ask", scene: "street", zone: "partner", object: "sakura",
        askLabel: "Say it:", cta: "Say it →", feedback: "しろい — white petals everywhere.",
        instruction: "The trees are in bloom",
        copy: "White petals drifting down. Tap the tree and say it.",
        answer: { jp: "さくらは しろい。", romaji: "sakura wa shiroi", en: "The cherry blossoms are white." } },
      "This is a bird. (casual)": { id: "l0-tori", type: "ask", scene: "room", zone: "near", object: "bird",
        askLabel: "Say it:", cta: "Say it →", feedback: "これ — right by you.",
        instruction: "A little bird landed next to you",
        copy: "Right by your hand — これ. Tap it and say it, casual style.",
        answer: { jp: "これは とり。", romaji: "kore wa tori", en: "This is a bird. (casual)" } },
      "That is a car. (casual)": { id: "l0-kuruma", type: "ask", scene: "street", zone: "partner", object: "car",
        askLabel: "Say it:", cta: "Say it →", feedback: "それ — by her.",
        instruction: "A car pulled up next to もち子",
        copy: "By her, not you — それ. Tap it and say it.",
        answer: { jp: "それは くるま。", romaji: "sore wa kuruma", en: "That is a car. (casual)" } },
    },
    "l0-wa": {
      "My cat is white.": { id: "l0-shironeko", type: "ask", scene: "room", zone: "partner", object: "whitecat",
        askLabel: "Say it:", cta: "Say it →", feedback: "わたしの — yours. しろい — white.",
        instruction: "Your cat wandered in",
        copy: "White from ears to tail. Tap it — の makes it yours.",
        answer: { jp: "わたしの ねこは しろい。", romaji: "watashi no neko wa shiroi", en: "My cat is white." } },
      "Japan is far away.": { id: "l0-nihon", type: "ask", scene: "street", zone: "far", object: "japanmap",
        askLabel: "Say it:", cta: "Say it →", feedback: "とおい — far. For now.",
        instruction: "Across the whole ocean — Japan",
        copy: "A little chain of islands, a long way off. Tap it and say it.",
        answer: { jp: "にほんは とおい。", romaji: "nihon wa tooi", en: "Japan is far away." } },
      "My book!": { id: "l0-myhon", type: "ask", scene: "room", zone: "table", object: "book",
        askLabel: "Call it out:", cta: "Say it →", feedback: "わたしの — mine!",
        instruction: "Someone left YOUR book on the table",
        copy: "That one is yours. Tap it and claim it out loud.",
        answer: { jp: "わたしの ほん！", romaji: "watashi no hon", en: "My book!" } },
    },
    "l0-dakuten": {
      "My friend's telephone.": { id: "claim-friend", type: "claimPerson", role: "friend", once: true,
        instruction: "Time to meet your friend",
        copy: "Pick your friend. They'll be with you the whole way — every ともだち is them.",
        feedback: "Good choice. And look — they have an old telephone.",
        cta: "Continue →",
        next: { id: "friend-phone", type: "ask", scene: "room", zone: "partner", object: "friendchar", prop: "telephone",
          askLabel: "Call it out:", cta: "Say it →", feedback: "の — the friend's.",
          instruction: "Your friend and their telephone",
          copy: "A proper old rotary phone. Tap them — の makes it theirs.",
          answer: { jp: "ともだちの でんわ。", romaji: "tomodachi no denwa", en: "My friend's telephone." } } },
      "This is a book.": { id: "l0-desu", type: "ask", scene: "room", zone: "near", object: "book", otherBook: true,
        askLabel: "Now with です:", cta: "Say it →", feedback: "Your first polite sentence.",
        instruction: "A book — but not yours",
        copy: "Different cover — someone else's. So it is just a book: ほん. Tap it and say it politely with です.",
        answer: { jp: "これは ほんです。", romaji: "kore wa hon desu", en: "This is a book." } },
    },

    // ---- Telling time: read the clock ------------------------------------
    "telling-time": {
      "It's 7 o'clock.": { id: "time-7", type: "ask", scene: "room", zone: "wall", object: "clock", clock: "t7",
        askLabel: "Read it:", cta: "Say it →", feedback: "Both hands say 7:00.",
        instruction: "What does the clock say?",
        copy: "Hour hand on 7, minute hand at 12. Tap it and read it out.",
        answer: { jp: "しちじです。", romaji: "shichi-ji desu", en: "It's 7 o'clock." } },
      "It's half past 8.": { id: "time-830", type: "ask", scene: "room", zone: "wall", object: "clock", clock: "t830",
        askLabel: "Read it:", cta: "Say it →", feedback: "はん = half past.",
        instruction: "And now?",
        copy: "Hour hand past 8, minute hand at 6. Tap it and read it out.",
        answer: { jp: "はちじはんです。", romaji: "hachi-ji-han desu", en: "It's half past 8." } },
    },

    // ---- な-adjectives ----------------------------------------------------
    "na-adj": {
      "It's a pretty flower.": { id: "na-hana", type: "ask", scene: "room", zone: "table", object: "flower",
        askLabel: "Say it:", cta: "Say it →", feedback: "な links きれい to the noun.",
        instruction: "Someone left a flower out",
        copy: "きれい takes な before a noun. Tap it and say it.",
        answer: { jp: "きれいな はなです。", romaji: "kirei na hana desu", en: "It's a pretty flower." } },
    },

    // ---- The very first lesson: welcome tour, then the nice house ----------
    "l0-a": {
      "What a nice house!": () => (story.completed["tour-1"] ? HOUSE_BEAT : chainBeats(TOUR_PANELS, HOUSE_BEAT)),
    },

    // ---- The tall mountain --------------------------------------------------
    "l0-ya": {
      "Winter is cold.": { id: "l0-fuyu", type: "ask", scene: "street", zone: "partner", object: "winter", night: true,
        askLabel: "Say it (brr):", cta: "Say it →", feedback: "さむい — cold. The word even shivers.",
        instruction: "Snow is falling",
        copy: "Someone built a snowman. Tap it and say what winter is.",
        answer: { jp: "ふゆは さむい。", romaji: "fuyu wa samui", en: "Winter is cold." } },
      "The mountain is tall.": { id: "l0-yama", type: "ask", scene: "street", zone: "far", object: "mountain",
        askLabel: "Say it:", cta: "Say it →", feedback: "たかい — it stands above the whole town.",
        instruction: "Beyond the town — a mountain",
        copy: "It rises over everything. Tap it and say it.",
        answer: { jp: "やまは たかい。", romaji: "yama wa takai", en: "The mountain is tall." } },
    },

    // ---- Introductions: who ARE you? ---------------------------------------
    "intro": {
      "Nice to meet you.": { id: "claim-avatar", type: "claimPerson", role: "avatar", once: true,
        instruction: "First — who are you?",
        copy: "Pick yourself. This is YOU from now on — every わたし in the app.",
        feedback: "Looking good. Now introduce yourself.",
        askLabel: "Bow and say it:", cta: "Say it →",
        answer: { jp: "はじめまして。", romaji: "hajimemashite", en: "Nice to meet you." } },
      "I'm American.": { id: "intro-flag", type: "ask", scene: "room", zone: "near", object: "avatar", prop: "usflag",
        askLabel: "Say it:", cta: "Say it →", feedback: "わたしは — as for me.",
        instruction: "That's you, flag and all",
        copy: "Tap yourself and say where you're from.",
        answer: { jp: "わたしは アメリカじんです。", romaji: "watashi wa amerika-jin desu", en: "I'm American." } },
      "I'm a student.": { id: "intro-desk", type: "ask", scene: "room", zone: "near", object: "avatar", prop: "schooldesk",
        askLabel: "Say it:", cta: "Say it →", feedback: "がくせい — student.",
        instruction: "You, at your desk",
        copy: "Class is in session. Tap yourself and say what you are.",
        answer: { jp: "わたしは がくせいです。", romaji: "watashi wa gakusei desu", en: "I'm a student." } },
      "What's your name?": { id: "intro-name", type: "nameInput",
        instruction: "Your friend needs a name",
        copy: "This is the friend you chose. Type their name — the app remembers it everywhere.",
        answer: { jp: "おなまえは なんですか？", romaji: "onamae wa nan desu ka", en: "What's your name?" } },
      "My friend is a student.": { id: "intro-friend-desk", type: "ask", scene: "room", zone: "near", object: "friendchar", prop: "schooldesk",
        askLabel: "Say it:", cta: "Say it →", feedback: "ともだち — your friend.",
        instruction: "Your friend, same classroom",
        copy: "There they are at their desk. Tap them and say it.",
        answer: { jp: "ともだちは がくせいです。", romaji: "tomodachi wa gakusei desu", en: "My friend is a student." } },
    },

    // ---- Greetings: the sky tells you which one -----------------------------
    "greetings": {
      "Good morning.": { id: "greet-sun", type: "ask", scene: "street", zone: "far", sky: true, object: "sun",
        askLabel: "Greet the day:", cta: "Say it →", feedback: "Morning sun → おはよう.",
        instruction: "The sun is up",
        copy: "A new morning. Tap the sun and greet it.",
        answer: { jp: "おはよう ございます。", romaji: "ohayou gozaimasu", en: "Good morning." } },
      "Good evening.": { id: "greet-moon", type: "ask", scene: "street", zone: "far", sky: true, night: true, object: "moon",
        askLabel: "Greet the night:", cta: "Say it →", feedback: "After dark → こんばんは.",
        instruction: "The moon is out",
        copy: "The day is done. Tap the moon and greet the evening.",
        answer: { jp: "こんばんは。", romaji: "konbanwa", en: "Good evening." } },
    },

    // ---- First verbs: the act IS the verb -----------------------------------
    "verbs": {
      "I'll eat.": { id: "verb-eat", type: "order", scene: "room", dest: "hand",
        items: ["sushi", "water"], target: "sushi",
        instruction: "You're hungry — take the food",
        copy: "たべます is for eating. Take the food, not the drink.",
        answer: { jp: "たべます。", romaji: "tabemasu", en: "I'll eat." } },
      "I'll drink.": { id: "verb-drink", type: "order", scene: "room", dest: "hand",
        items: ["water", "peach"], target: "water",
        instruction: "You're thirsty — take the drink",
        copy: "のみます is for drinking. Take the drink, not the food.",
        answer: { jp: "のみます。", romaji: "nomimasu", en: "I'll drink." } },
    },

    // ---- Coming & going: home is down the road ------------------------------
    "coming-going": {
      "I'm going home.": { id: "go-home", type: "ask", scene: "street", zone: "far", object: "house",
        askLabel: "Say it:", cta: "Say it →", feedback: "うち = home. かえります = head back.",
        instruction: "Home is down the road",
        copy: "You can see your house from here. Tap it and head back.",
        answer: { jp: "うちに かえります。", romaji: "uchi ni kaerimasu", en: "I'm going home." } },
    },

    // ---- Routine: the wall clock says get up --------------------------------
    "routine": {
      "I wake up at seven.": { id: "routine-7", type: "ask", scene: "room", zone: "wall", object: "clock", clock: "t7",
        askLabel: "Read it:", cta: "Say it →", feedback: "しちじ — 7:00, time to get up.",
        instruction: "The clock says it's morning",
        copy: "Both hands say 7:00. Tap the clock — that's when you wake.",
        answer: { jp: "しちじに おきます。", romaji: "shichi-ji ni okimasu", en: "I wake up at seven." } },
    },

    // ---- でした: the tag says what it WAS -----------------------
    "was-were": {
      "It was 500 yen.": { id: "was-500", type: "ask", scene: "shop", object: "sushi", tag: true, tagText: "500円",
        askLabel: "Say what it cost:", cta: "Say it →", feedback: "でした — it WAS.",
        instruction: "You bought this earlier",
        copy: "The tag still shows what you paid. Tap it and say what it was.",
        answer: { jp: "ごひゃくえんでした。", romaji: "gohyaku-en deshita", en: "It was 500 yen." } },
    },

    // ---- けど: both things are true --------------------------------
    "but-kedo": {
      "It's pricey, but tasty.": { id: "kedo-sushi", type: "ask", scene: "shop", object: "sushi", tag: true, tagText: "3,000円",
        askLabel: "Worth it?", cta: "Say it →", feedback: "けど joins both truths.",
        instruction: "Expensive — but look at it",
        copy: "That price hurts, but you know it's good. Tap it and admit both.",
        answer: { jp: "たかいけど、おいしい。", romaji: "takai kedo, oishii", en: "It's pricey, but tasty." } },
    },

    // ---- Permission: ask before you sit -------------------------------------
    "permission": {
      "May I sit here?": { id: "perm-chair", type: "ask", scene: "room", zone: "partner", object: "chair",
        askLabel: "Ask her:", cta: "Ask →", feedback: "〜てもいいですか — you asked first.",
        instruction: "One empty chair, next to もち子",
        copy: "You'd like to sit. Tap the chair to ask if it's okay.",
        answer: { jp: "ここに すわっても いいですか？", romaji: "koko ni suwatte mo ii desu ka", en: "May I sit here?" } },
    },

    // ---- Directions: the light, and the right side --------------------------
    "directions": {
      "Turn right at the next light.": { id: "dir-signal", type: "ask", scene: "street", zone: "partner", object: "signal",
        askLabel: "Give the direction:", cta: "Say it →", feedback: "しんごう = the light. みぎ = right.",
        instruction: "There's the traffic light",
        copy: "That's where you turn. Tap the light and give the direction.",
        answer: { jp: "つぎの しんごうを みぎに まがって ください。", romaji: "tsugi no shingou o migi ni magatte kudasai", en: "Turn right at the next light." } },
      "It's on the right.": { id: "dir-right", type: "ask", scene: "street", zone: "far", object: "station",
        askLabel: "Point it out:", cta: "Say it →", feedback: "みぎ — on the right.",
        instruction: "The station came into view",
        copy: "Down the street, on the right side. Tap it and point it out.",
        answer: { jp: "みぎに あります。", romaji: "migi ni arimasu", en: "It's on the right." } },
    },

    // ---- Transport: で marks the ride -----------------------------------
    "transport": {
      "I'll go by train.": { id: "trans-train", type: "ask", scene: "street", zone: "partner", object: "train",
        askLabel: "Say how:", cta: "Say it →", feedback: "で marks the ride.",
        instruction: "Your ride is here",
        copy: "で marks how you travel. Tap the train and say how you'll go.",
        answer: { jp: "でんしゃで いきます。", romaji: "densha de ikimasu", en: "I'll go by train." } },
      "I'll take the bus to the airport.": { id: "trans-bus", type: "ask", scene: "street", zone: "partner", object: "bus", tag: true, tagText: "くうこう",
        askLabel: "Say the plan:", cta: "Say it →", feedback: "まで — as far as the airport.",
        instruction: "This bus goes to the airport",
        copy: "The sign shows where it ends up. Tap the bus and say the plan.",
        answer: { jp: "くうこうまで バスで いきます。", romaji: "kuukou made basu de ikimasu", en: "I'll take the bus to the airport." } },
    },

    // ---- Does this go…?: この = right here ---------------------
    "does-this-go": {
      "Does this bus go to the station?": { id: "go-bus", type: "ask", scene: "street", zone: "near", object: "bus", tag: true, tagText: "えき？",
        askLabel: "Ask the driver:", cta: "Ask →", feedback: "この バス — the one right here.",
        instruction: "A bus pulled up in front of you",
        copy: "この = this one, right here. Tap it to ask where it goes.",
        answer: { jp: "この バスは えきに いきますか？", romaji: "kono basu wa eki ni ikimasu ka", en: "Does this bus go to the station?" } },
    },

    // ---- You'd better…: rain is coming ---------------------------------
    "had-better": {
      "You'd better take an umbrella.": { id: "better-kasa", type: "ask", scene: "room", zone: "near", object: "umbrella",
        askLabel: "Give the advice:", cta: "Say it →", feedback: "〜た ほうが いい — better to.",
        instruction: "Those clouds look bad",
        copy: "Rain is coming. Tap the umbrella by the door and give the advice.",
        answer: { jp: "かさを もっていった ほうが いいです。", romaji: "kasa o motteitta hou ga ii desu", en: "You'd better take an umbrella." } },
    },

    // ---- Comparing: read the tags, take the cheapest ------------------------
    "comparing": {
      "This one's the cheapest.": { id: "comp-cheap", type: "order",
        items: ["sushi", "coffee", "water"], target: "water",
        tags: { sushi: "1,000円", coffee: "500円", water: "100円" },
        instruction: "Find the cheapest one",
        copy: "Read the tags — take the one that costs least.",
        answer: { jp: "これが いちばん やすい。", romaji: "kore ga ichiban yasui", en: "This one's the cheapest." } },
    },

    // ---- 〜そう: it LOOKS good, before you taste ----------------
    "seems": {
      "That looks delicious!": { id: "seems-oishi", type: "ask", scene: "shop", object: "sushi",
        askLabel: "Say the impression:", cta: "Say it →", feedback: "〜そう — looks like, before you taste.",
        instruction: "Behind the counter — fresh sushi",
        copy: "You haven't tasted it — it just LOOKS good. Tap it and say so.",
        answer: { jp: "おいしそう！", romaji: "oishisou", en: "That looks delicious!" } },
    },

    // ---- Tickets: one flat thing to Shinjuku --------------------------------
    "tickets": {
      "One ticket to Shinjuku, please.": { id: "tick-one", type: "ask", scene: "shop", object: "ticket", tag: true, tagText: "しんじゅく",
        askLabel: "At the window:", cta: "Ask →", feedback: "いちまい — one flat thing.",
        instruction: "The ticket window",
        copy: "One ticket, to しんじゅく. Tap it to ask for it.",
        answer: { jp: "しんじゅくまで いちまい おねがいします。", romaji: "shinjuku made ichi-mai onegaishimasu", en: "One ticket to Shinjuku, please." } },
    },

    // ---- Let's…: she's already at the table --------------------------
    "lets": {
      "Let's eat together.": { id: "lets-eat", type: "ask", scene: "room", zone: "partner", object: "sushi",
        askLabel: "Invite her:", cta: "Say it →", feedback: "いっしょに — together.",
        instruction: "Lunch for two",
        copy: "もち子 is here and so is the food. Tap it and invite her.",
        answer: { jp: "いっしょに たべましょう。", romaji: "issho ni tabemashou", en: "Let's eat together." } },
    },

    // ---- て-form: something worth pointing at ---------------------------
    "te-form": {
      "Look!": { id: "te-mite", type: "ask", scene: "room", zone: "near", object: "bird",
        askLabel: "Call it:", cta: "Say it →", feedback: "みて — casual, quick.",
        instruction: "A bird just landed",
        copy: "Right there, right now — tap it and get her to look.",
        answer: { jp: "みて！", romaji: "mite", en: "Look!" } },
    },

    // ---- ている: caught mid-action ----------------------------
    "te-iru": {
      "I'm reading a book.": { id: "teiru-book", type: "ask", scene: "room", zone: "near", object: "book",
        askLabel: "Say what you're doing:", cta: "Say it →", feedback: "〜て います — in progress, right now.",
        instruction: "Your book is open",
        copy: "You're in the middle of it. Tap the book and say what you're doing.",
        answer: { jp: "ほんを よんで います。", romaji: "hon o yonde imasu", en: "I'm reading a book." } },
    },

    // ---- Experience: ask about hers ----------------------------------------
    "experience": {
      "Have you ever had sushi?": { id: "exp-sushi", type: "ask", scene: "room", zone: "partner", object: "sushi",
        askLabel: "Ask her:", cta: "Ask →", feedback: "たこと ある — ever done it?",
        instruction: "もち子 eyes the sushi",
        copy: "Has she ever tried it? Tap the sushi and ask.",
        answer: { jp: "すし たべたこと ある？", romaji: "sushi tabeta koto aru?", en: "Have you ever had sushi?" } },
    },

    // ---- How far: the station is a dot on the horizon -----------------------
    "how-far": {
      "Is it far?": { id: "far-eki", type: "ask", scene: "street", zone: "far", object: "station",
        askLabel: "Ask:", cta: "Ask →", feedback: "とおい — far. It looks it.",
        instruction: "The station is way down there",
        copy: "Tiny with distance. Tap it and ask.",
        answer: { jp: "とおいですか？", romaji: "tooi desu ka", en: "Is it far?" } },
    },

    // ---- Not expensive: the same clock, humbled ------------------------------
    "adj-negative": {
      "It's not expensive.": { id: "neg-clock", type: "ask", scene: "shop", object: "clock", tag: true, tagText: "100円",
        askLabel: "Say it:", cta: "Say it →", feedback: "たかくない — い drops, くない steps in.",
        instruction: "That clock again — look at the tag now",
        copy: "Once 98,000円. Today: 100円. Tap it and say what it isn't.",
        answer: { jp: "たかくないです。", romaji: "takakunai desu", en: "It's not expensive." } },
    },

    // ---- Can't do: the car you can't drive -----------------------------------
    "can-do": {
      "I can't drive.": { id: "cando-car", type: "ask", scene: "street", zone: "near", object: "car",
        askLabel: "Admit it:", cta: "Say it →", feedback: "できません — can't (yet).",
        instruction: "Here's a car. There's a problem.",
        copy: "No licence. Tap the car and admit it.",
        answer: { jp: "うんてんが できません。", romaji: "unten ga dekimasen", en: "I can't drive." } },
    },

    // ---- This, that & whose: a room you point around --------------------
    "this-that": {
      "What is this?": {
        id: "ask-what", type: "ask",
        scene: "room", zone: "near", object: "mystery",
        instruction: "Something is sitting right in front of you",
        copy: "You've never seen it before. Tap it to ask what it is.",
        answer: { jp: "これは なんですか？", romaji: "kore wa nan desu ka", en: "What is this?" },
      },
      "That (by you) is a bag.": {
        id: "point-sore", type: "point", target: "partner",
        layout: { near: "book", partner: "bag", far: "clock" },
        instruction: "Point at the bag next to もち子",
        answer: { jp: "それは かばんです。", romaji: "sore wa kaban desu", en: "That (by you) is a bag." },
      },
      "That over there is my bag.": {
        id: "point-are", type: "point", target: "far",
        layout: { near: "book", partner: "cup", far: "bag" },
        instruction: "Point at your bag on the far shelf",
        answer: { jp: "あれは わたしの かばんです。", romaji: "are wa watashi no kaban desu", en: "That over there is my bag." },
      },
      "This is my book.": {
        id: "answer-my-book", type: "identify", item: "book",
        ask: { jp: "どれが あなたの ほんですか？", romaji: "dore ga anata no hon desu ka", en: "Which one is your book?" },
        answer: { jp: "これは わたしの ほんです。", romaji: "kore wa watashi no hon desu", en: "This is my book." },
      },
      "Is that (by you) a book?": {
        id: "ask-book", type: "ask",
        scene: "room", zone: "partner", object: "mystery",
        instruction: "もち子 is holding something…",
        copy: "It's about the size of a book — but you can't tell. Tap it to ask her.",
        answer: { jp: "それは ほんですか？", romaji: "sore wa hon desu ka", en: "Is that (by you) a book?" },
      },
    },

    // ---- At a shop: a counter you order across ---------------------------
    "shop": {
      "How much is this?": {
        id: "shop-howmuch", type: "ask",
        scene: "shop", zone: "counter", object: "clock", tag: true,
        instruction: "This one has no price",
        copy: "Tap the tag to ask how much it is.",
        answer: { jp: "これは いくらですか？", romaji: "kore wa ikura desu ka", en: "How much is this?" },
      },
      "Water, please.": {
        id: "shop-water", type: "order",
        items: ["water", "coffee", "cup"], target: "water",
        instruction: "You're thirsty — get the water",
        copy: "Tap what you want and もち子 will hand it over.",
        answer: { jp: "みずを ください。", romaji: "mizu o kudasai", en: "Water, please." },
      },
      "Coffee, please.": {
        id: "shop-coffee", type: "order",
        items: ["cup", "water", "coffee"], target: "coffee",
        instruction: "Long day — you need the coffee",
        copy: "Tap what you want and もち子 will hand it over.",
        answer: { jp: "コーヒーを ください。", romaji: "koohii o kudasai", en: "Coffee, please." },
      },
      "This one, please.": {
        id: "shop-this-one", type: "order",
        items: ["water", "coffee", "cup"], target: null,
        instruction: "Your turn — pick anything",
        copy: "Whichever you tap becomes これ — the one right in front of you.",
        answer: { jp: "これを ください。", romaji: "kore o kudasai", en: "This one, please." },
      },
    },

    // ---- Where is it?: a street — ここ・そこ・あそこ are PLACE distance ----
    "where": {
      "Where is the restroom?": {
        id: "where-ask-toilet", type: "ask",
        scene: "street", zone: "partner", object: "mochiko", askLabel: "Ask her:",
        instruction: "You really need the restroom…",
        copy: "You have no idea where it is. Tap もち子 and ask.",
        answer: { jp: "トイレは どこですか？", romaji: "toire wa doko desu ka", en: "Where is the restroom?" },
      },
      "It's over there.": {
        id: "where-spot-wc", type: "point", words: "place", scene: "street", target: "far",
        layout: { near: "water", partner: "mochiko", far: "wc" },
        instruction: "There it is! Point at the restroom sign",
        answer: { jp: "あそこです。", romaji: "asoko desu", en: "It's over there." },
      },
      "The station is here.": {
        id: "where-station-here", type: "point", words: "place", scene: "street", target: "near",
        layout: { near: "station", partner: "mochiko", far: "wc" },
        instruction: "You're standing right at the station",
        answer: { jp: "えきは ここです。", romaji: "eki wa koko desu", en: "The station is here." },
      },
      "Yes, it's here.": {
        id: "where-water-here", type: "point", words: "place", scene: "street", target: "near",
        ask: { jp: "みずは ありますか？", romaji: "mizu wa arimasu ka", en: "Is there (any) water?" },
        layout: { near: "water", partner: "mochiko", far: "wc" },
        instruction: "もち子 wants water — you have some!",
        answer: { jp: "はい、ここに あります。", romaji: "hai, koko ni arimasu", en: "Yes, it's here." },
      },
      "My friend is over there.": {
        id: "where-friend", type: "point", words: "place", scene: "street", target: "far",
        layout: { near: "water", partner: "mochiko", far: "friend" },
        instruction: "Your friend is waving — spot them!",
        answer: { jp: "ともだちは あそこに います。", romaji: "tomodachi wa asoko ni imasu", en: "My friend is over there." },
      },
    },

    // ---- Counting things: tap them one by one — the count IS the word ----
    "counters": {
      "One, please.": {
        id: "count-one", type: "count", item: "cup", n: 1,
        instruction: "Just one tea — tap it",
        answer: { jp: "ひとつ ください。", romaji: "hitotsu kudasai", en: "One, please." },
      },
      "Two coffees, please.": {
        id: "count-two", type: "count", item: "coffee", n: 2,
        instruction: "Two coffees — tap them one at a time",
        answer: { jp: "コーヒーを ふたつ ください。", romaji: "koohii o futatsu kudasai", en: "Two coffees, please." },
      },
      "Three waters, please.": {
        id: "count-three", type: "count", item: "water", n: 3,
        instruction: "Three waters — count them off",
        answer: { jp: "みずを みっつ ください。", romaji: "mizu o mittsu kudasai", en: "Three waters, please." },
      },
      "All of it, please.": {
        id: "count-all", type: "count", item: "sushi", n: 4, finalWord: "ぜんぶ",
        instruction: "You want every last one — tap them all",
        answer: { jp: "ぜんぶ ください。", romaji: "zenbu kudasai", en: "All of it, please." },
      },
    },

    // ---- At the café ------------------------------------------------------
    "cafe": {
      "The menu, please.": {
        id: "cafe-menu", type: "order",
        items: ["menu"], target: "menu",
        instruction: "You just sat down",
        copy: "Catch もち子's eye and ask for the menu.",
        answer: { jp: "メニューを おねがいします。", romaji: "menyuu o onegaishimasu", en: "The menu, please." },
      },
      "A coffee and a tea, please.": {
        id: "cafe-both", type: "order",
        items: ["coffee", "water", "cup"], targets: ["coffee", "cup"],
        instruction: "One coffee AND one tea",
        copy: "You're ordering for two — tap both drinks.",
        answer: { jp: "コーヒーと おちゃを ください。", romaji: "koohii to ocha o kudasai", en: "A coffee and a tea, please." },
      },
      "Two teas, please.": {
        id: "cafe-two-teas", type: "count", item: "cup", n: 2,
        instruction: "Two teas — count them off",
        answer: { jp: "おちゃを ふたつ ください。", romaji: "ocha o futatsu kudasai", en: "Two teas, please." },
      },
    },

    // ---- Money & prices: read the tag, say the price ----------------------
    "money": {
      "It's 100 yen.": { id: "coins-100", type: "coins", options: [100, 300, 500], target: 100,
        instruction: "Which stack is 100円?",
        copy: "Count the coins — each one is 100円.",
        answer: { jp: "ひゃくえんです。", romaji: "hyaku-en desu", en: "It's 100 yen." } },
      "It's 500 yen.": { id: "coins-500", type: "coins", options: [100, 300, 500], target: 500,
        instruction: "And which stack is 500円?",
        copy: "Count again — ひゃく, にひゃく…",
        answer: { jp: "ごひゃくえんです。", romaji: "gohyaku-en desu", en: "It's 500 yen." } },
      "The coffee is 300 yen.": {
        id: "money-coffee", type: "order",
        items: ["coffee", "water"], target: "coffee",
        tags: { coffee: "300円", water: "100円" },
        instruction: "Check the coffee's price tag",
        copy: "Tap the coffee, then say what it costs.",
        answer: { jp: "コーヒーは さんびゃくえんです。", romaji: "koohii wa sanbyaku-en desu", en: "The coffee is 300 yen." },
      },
      "The water is 100 yen.": {
        id: "money-water", type: "order",
        items: ["coffee", "water"], target: "water",
        tags: { coffee: "300円", water: "100円" },
        instruction: "Now check the water",
        copy: "Tap the water, then say what it costs.",
        answer: { jp: "みずは ひゃくえんです。", romaji: "mizu wa hyaku-en desu", en: "The water is 100 yen." },
      },
    },

    // ---- What you do it to (を): use the object -----------------------------
    "object": {
      "I drink water.": {
        id: "obj-drink-water", type: "order", scene: "room", dest: "hand",
        items: ["water", "coffee", "book"], target: "water",
        instruction: "You're thirsty",
        copy: "Pick up the thing you DRINK.",
        answer: { jp: "みずを のみます。", romaji: "mizu o nomimasu", en: "I drink water." },
      },
      "I read a book.": {
        id: "obj-read-book", type: "order", scene: "room", dest: "hand",
        items: ["book", "cup", "clock"], target: "book",
        instruction: "Quiet evening",
        copy: "Pick up the thing you READ.",
        answer: { jp: "ほんを よみます。", romaji: "hon o yomimasu", en: "I read a book." },
      },
      "I drink coffee.": {
        id: "obj-drink-coffee", type: "order", scene: "room", dest: "hand",
        items: ["coffee", "book", "bag"], target: "coffee",
        instruction: "Morning fuel",
        copy: "Pick up the thing you DRINK.",
        answer: { jp: "コーヒーを のみます。", romaji: "koohii o nomimasu", en: "I drink coffee." },
      },
    },

    // ---- Likes: tap what you love ------------------------------------------
    "likes": {
      "I like sushi.": {
        id: "like-sushi", type: "order", scene: "room", dest: "hand",
        items: ["sushi", "water", "clock"], target: "sushi",
        instruction: "Your favourite thing here?",
        copy: "Tap the one you LIKE — おすし, obviously.",
        answer: { jp: "おすしが すきです。", romaji: "osushi ga suki desu", en: "I like sushi." },
      },
      "Do you like coffee?": {
        id: "like-coffee-q", type: "ask",
        scene: "room", zone: "partner", object: "coffee", tag: true,
        instruction: "もち子 is eyeing your coffee…",
        copy: "Maybe she wants one too. Tap it and ask her.",
        answer: { jp: "コーヒーが すきですか？", romaji: "koohii ga suki desu ka", en: "Do you like coffee?" },
      },
    },

    // ---- Wants -------------------------------------------------------------
    "wants": {
      "I want a car.": {
        id: "want-car", type: "order", scene: "room", dest: "hand",
        items: ["car", "book", "cup"], target: "car",
        instruction: "If you could have anything…",
        copy: "Tap the one you've been dreaming of.",
        answer: { jp: "くるまが ほしいです。", romaji: "kuruma ga hoshii desu", en: "I want a car." },
      },
    },

    // ---- Adjective + noun: pick the right-sized one --------------------------
    "adj-noun": {
      "It's a big house.": {
        id: "pick-big-house", type: "pick", kind: "house", target: "big",
        options: [{ mod: "big", jp: "おおきい" }, { mod: "small", jp: "ちいさい" }],
        instruction: "Two houses — tap the BIG one",
        answer: { jp: "おおきい いえです。", romaji: "ookii ie desu", en: "It's a big house." },
      },
      "It's a small car.": {
        id: "pick-small-car", type: "pick", kind: "car", target: "small",
        options: [{ mod: "small", jp: "ちいさい" }, { mod: "big", jp: "おおきい" }],
        instruction: "Two cars — tap the SMALL one",
        answer: { jp: "ちいさい くるまです。", romaji: "chiisai kuruma desu", en: "It's a small car." },
      },
    },

    // ---- Numbers: tap them, hear them, say the run --------------------------
    "numbers": {
      "One, two, three, four, five.": { id: "num-15", type: "numberTap",
        nums: [[1, "いち"], [2, "に"], [3, "さん"], [4, "よん"], [5, "ご"]],
        instruction: "Count with your ears first",
        copy: "Tap each number — もち子 says it. Then you say all five.",
        answer: { jp: "いち、に、さん、よん、ご。", romaji: "ichi, ni, san, yon, go", en: "One, two, three, four, five." } },
      "Six, seven, eight, nine, ten.": { id: "num-610", type: "numberTap",
        nums: [[6, "ろく"], [7, "なな"], [8, "はち"], [9, "きゅう"], [10, "じゅう"]],
        instruction: "The second half",
        copy: "Same again — tap each one, then say the run.",
        answer: { jp: "ろく、なな、はち、きゅう、じゅう。", romaji: "roku, nana, hachi, kyuu, juu", en: "Six, seven, eight, nine, ten." } },
    },

    // ---- Age: さい — ask もち子 hers -------------
    "age": {
      "How old are you?": {
        id: "age-ask", type: "ask",
        scene: "room", zone: "partner", object: "mochiko", askLabel: "Ask her:",
        instruction: "How old IS もち子, anyway?",
        copy: "Only one way to find out. Tap her and ask.",
        answer: { jp: "なんさいですか？", romaji: "nan-sai desu ka", en: "How old are you?" },
      },
    },

    // ---- Please do X ----------------------------------------------------------
    "te-please": {
      "Please wait a moment.": {
        id: "matte", type: "ask",
        scene: "street", zone: "partner", object: "mochiko", askLabel: "Call out:",
        instruction: "もち子 is walking off without you!",
        copy: "Quick — tap her before she disappears.",
        answer: { jp: "ちょっと まって ください。", romaji: "chotto matte kudasai", en: "Please wait a moment." },
      },
    },
  };

  // A map value may be a function (resolved at fire time) so a key can serve
  // different beats depending on what the learner already owns.
  function resolveBeat(map, lessonId, en) {
    const perLesson = map[lessonId];
    let beat = perLesson && perLesson[normalize(en)];
    if (typeof beat === "function") beat = beat();
    return beat;
  }

  const story = loadStory();
  story.inventory = story.inventory || {};
  story.completed = story.completed || {};
  story.soundsSeen = story.soundsSeen || {};

  let overlayOpen = false;
  const shownThisSession = new Set();
  const overlay = buildOverlay();
  document.body.appendChild(overlay.root);

  function loadStory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveStory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(story)); } catch {}
  }
  function normalize(text) { return String(text || "").replace(/\s+/g, " ").trim(); }

  function markBeatDone(beat) {
    shownThisSession.add(beat.id);
    if (beat.once) story.completed[beat.id] = true;
    saveStory();
  }
  function shouldSkip(beat) {
    if (!beat) return true;
    if (shownThisSession.has(beat.id)) return true;
    if (beat.once && story.completed[beat.id]) return true;
    return false;
  }

  // ---- overlay scaffolding ---------------------------------------------------
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildOverlay() {
    const root = el("section", "story-break");
    root.id = "story-break";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");

    const panel = el("div", "story-panel");
    const kicker = el("div", "story-kicker", "Your story");
    const title = el("h2", "story-title");
    const copy = el("p", "story-copy");
    const stage = el("div", "story-stage");
    const feedback = el("p", "story-feedback");
    feedback.setAttribute("role", "status");
    const actions = el("div", "story-actions");
    const continueBtn = el("button", "primary story-continue", "Continue →");
    continueBtn.type = "button";
    continueBtn.hidden = true;
    actions.appendChild(continueBtn);

    panel.append(kicker, title, copy, stage, feedback, actions);
    root.appendChild(panel);
    return { root, panel, title, copy, stage, feedback, continueBtn };
  }

  function closeOverlay() {
    overlay.root.hidden = true;
    overlay.root.classList.remove("open");
    overlayOpen = false;
    document.body.classList.remove("story-open");
  }

  function openBeat(beat, onDone) {
    if (!beat || overlayOpen) return false;
    overlayOpen = true;
    document.body.classList.add("story-open");
    renderBeat(beat, onDone);
    return true;
  }

  function renderBeat(beat, onDone) {
    overlay.root.hidden = false;
    overlay.root.className = "story-break open story-" + beat.type;
    if (beat.target) overlay.root.dataset.target = beat.target;
    else if (beat.type === "order") overlay.root.dataset.target = beat.targets ? "multi" : "free";
    else delete overlay.root.dataset.target;
    if (beat.type === "count") overlay.root.dataset.count = String(beat.n);
    else delete overlay.root.dataset.count;
    overlay.stage.className = "story-stage story-stage-" + beat.type;
    overlay.stage.innerHTML = "";
    overlay.stage.hidden = false;
    overlay.panel.querySelectorAll(":scope > .story-answer, :scope > .story-ask").forEach((node) => node.remove());
    overlay.feedback.textContent = "";
    overlay.feedback.className = "story-feedback";
    overlay.continueBtn.hidden = true;
    overlay.continueBtn.disabled = false;
    overlay.continueBtn.onclick = null;
    overlay.root.scrollTop = 0;

    const finishBeat = () => {
      markBeatDone(beat);
      // A beat can flow straight into the next one (claim → place).
      if (beat.next && !shouldSkip(beat.next)) { renderBeat(beat.next, onDone); return; }
      closeOverlay();
      if (typeof onDone === "function") onDone();
    };

    if (beat.type === "claim") renderClaimBeat(beat, finishBeat);
    else if (beat.type === "place") renderPlaceBeat(beat, finishBeat);
    else if (beat.type === "identify") renderIdentifyBeat(beat, finishBeat);
    else if (beat.type === "point") renderPointBeat(beat, finishBeat);
    else if (beat.type === "ask") renderAskBeat(beat, finishBeat);
    else if (beat.type === "order") renderOrderBeat(beat, finishBeat);
    else if (beat.type === "count") renderCountBeat(beat, finishBeat);
    else if (beat.type === "pick") renderPickBeat(beat, finishBeat);
    else if (beat.type === "coins") renderCoinsBeat(beat, finishBeat);
    else if (beat.type === "info") renderInfoBeat(beat, finishBeat);
    else if (beat.type === "claimPerson") renderClaimPersonBeat(beat, finishBeat);
    else if (beat.type === "nameInput") renderNameInputBeat(beat, finishBeat);
    else if (beat.type === "numberTap") renderNumberTapBeat(beat, finishBeat);
    else if (beat.type === "sounds") renderSoundsBeat(beat, finishBeat);
    else if (beat.type === "build") renderBuildBeat(beat, finishBeat);
    else if (beat.type === "cardDemo") renderCardDemoBeat(beat, finishBeat);
  }

  function showContinue(text, finishBeat) {
    overlay.continueBtn.textContent = text || "Continue →";
    overlay.continueBtn.hidden = false;
    overlay.continueBtn.onclick = finishBeat;
    requestAnimationFrame(() => { try { overlay.continueBtn.focus({ preventScroll: true }); } catch {} });
  }

  function sentenceBlock(cls, label, sentence) {
    const box = el("div", cls);
    if (label) box.appendChild(el("span", "story-line-label", label));
    box.appendChild(el("span", "story-line-jp", sentence.jp));
    if (sentence.romaji) box.appendChild(el("span", "story-line-romaji", sentence.romaji));
    if (sentence.en) box.appendChild(el("span", "story-line-en", sentence.en));
    return box;
  }
  function attachAnswer(beat, label) {
    if (beat.answer && !overlay.stage.parentElement.querySelector(".story-answer")) {
      overlay.stage.insertAdjacentElement("afterend", sentenceBlock("story-answer", label, beat.answer));
    }
  }

  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- the environments: a room / a shop counter, CSS 3D -------------------
  function buildScene(kind) {
    const scene = el("div", "story-scene story-scene-" + kind);
    scene.append(el("div", "scene-wall"), el("div", "scene-floor"));
    if (kind === "shop") scene.append(el("div", "scene-counter"));
    if (kind === "street") scene.append(el("div", "scene-skyline"));
    return scene;
  }
  function mochikoImg(src, cls) {
    const img = document.createElement("img");
    img.className = cls || "scene-mochiko";
    img.src = src;
    img.alt = "もち子";
    return img;
  }

  // Hand-drawn SVG art for every object — a few KB each, crisp at any zone
  // scale, same ink-outline language as the painted frames. (Interim art
  // until real illustrations land — owner, 2026-07.)
  const OBJ_SVG = {
    P_aki: '<svg viewBox="0 0 90 130" preserveAspectRatio="xMidYMax meet"><path d="M24 96 Q22 74 45 74 Q68 74 66 96 L64 122 Q63 126 58 126 L32 126 Q27 126 26 122 Z" fill="#74a25f" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><circle cx="45" cy="42" r="28" fill="#f8d4ac" stroke="#243352" stroke-width="4.5"/><path d="M18 40 Q14 16 34 12 L38 22 L46 10 L54 22 L60 12 Q74 18 72 40 Q60 24 45 24 Q30 24 18 40 Z" fill="#d97b3c" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><ellipse cx="36" cy="44" rx="3" ry="4.4" fill="#243352"/><ellipse cx="54" cy="44" rx="3" ry="4.4" fill="#243352"/><path d="M38 56 Q45 61 52 56" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    P_beni: '<svg viewBox="0 0 90 130" preserveAspectRatio="xMidYMax meet"><path d="M26 94 Q24 74 45 74 Q66 74 64 94 L70 122 Q71 126 65 126 L25 126 Q19 126 20 122 Z" fill="#d95f5f" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><circle cx="45" cy="42" r="28" fill="#f6cea2" stroke="#243352" stroke-width="4.5"/><path d="M16 52 Q10 14 45 12 Q80 14 74 52 Q72 34 66 30 Q68 44 62 26 Q56 40 45 24 Q34 40 28 26 Q22 44 24 30 Q18 34 16 52 Z" fill="#3b3040" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><ellipse cx="36" cy="46" rx="3" ry="4.4" fill="#243352"/><ellipse cx="54" cy="46" rx="3" ry="4.4" fill="#243352"/><path d="M38 58 Q45 63 52 58" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    P_kai: '<svg viewBox="0 0 90 130" preserveAspectRatio="xMidYMax meet"><path d="M24 96 Q22 74 45 74 Q68 74 66 96 L64 122 Q63 126 58 126 L32 126 Q27 126 26 122 Z" fill="#4a7fb5" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><circle cx="45" cy="44" r="27" fill="#eab98a" stroke="#243352" stroke-width="4.5"/><path d="M16 40 Q16 14 45 14 Q74 14 74 40 L74 34 Q74 44 66 42 Q60 26 45 26 Q30 26 24 42 Q16 44 16 34 Z" fill="#5c86bd" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M70 30 Q86 28 88 36 Q84 42 72 40 Z" fill="#5c86bd" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="36" cy="48" rx="3" ry="4.4" fill="#243352"/><ellipse cx="54" cy="48" rx="3" ry="4.4" fill="#243352"/><path d="M38 60 Q45 65 52 60" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    P_yuki: '<svg viewBox="0 0 90 130" preserveAspectRatio="xMidYMax meet"><path d="M26 94 Q24 74 45 74 Q66 74 64 94 L68 122 Q69 126 63 126 L27 126 Q21 126 22 122 Z" fill="#9b8ec4" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><path d="M14 60 Q8 100 20 112 Q28 104 26 84 M76 60 Q82 100 70 112 Q62 104 64 84" fill="#f2dc9b" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><circle cx="45" cy="42" r="28" fill="#f8d4ac" stroke="#243352" stroke-width="4.5"/><path d="M14 54 Q10 12 45 12 Q80 12 76 54 Q72 30 62 28 Q52 26 45 22 Q38 26 28 28 Q18 30 14 54 Z" fill="#f2dc9b" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><ellipse cx="36" cy="44" rx="3" ry="4.4" fill="#243352"/><ellipse cx="54" cy="44" rx="3" ry="4.4" fill="#243352"/><path d="M38 56 Q45 61 52 56" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    usflag: '<svg viewBox="0 0 90 110" preserveAspectRatio="xMidYMax meet"><rect x="10" y="4" width="6" height="102" rx="3" fill="#8a6642" stroke="#243352" stroke-width="3.5"/><path d="M16 8 L82 8 L82 52 L16 52 Z" fill="#fdf6ea" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M16 15 L82 15 M16 26 L82 26 M16 37 L82 37 M16 48 L82 48" stroke="#d95f5f" stroke-width="5"/><rect x="16" y="8" width="28" height="22" fill="#4a7fb5" stroke="#243352" stroke-width="3"/><g fill="#fff"><circle cx="23" cy="14" r="1.8"/><circle cx="31" cy="14" r="1.8"/><circle cx="39" cy="14" r="1.8"/><circle cx="27" cy="20" r="1.8"/><circle cx="35" cy="20" r="1.8"/><circle cx="23" cy="26" r="1.8"/><circle cx="31" cy="26" r="1.8"/><circle cx="39" cy="26" r="1.8"/></g></svg>',
    schooldesk: '<svg viewBox="0 0 130 90" preserveAspectRatio="xMidYMax meet"><rect x="6" y="8" width="118" height="14" rx="4" fill="#d9a568" stroke="#243352" stroke-width="4.5"/><path d="M18 22 L18 84 M112 22 L112 84" stroke="#243352" stroke-width="9" stroke-linecap="round"/><path d="M18 22 L18 84 M112 22 L112 84" stroke="#8a8f99" stroke-width="5" stroke-linecap="round"/><rect x="30" y="26" width="70" height="8" rx="3" fill="#c98f4e" stroke="#243352" stroke-width="3.5"/><rect x="40" y="2" width="30" height="8" rx="2" fill="#5c86bd" stroke="#243352" stroke-width="3" transform="rotate(-4 55 6)"/></svg>',
    dogface: '<svg viewBox="0 0 130 120" preserveAspectRatio="xMidYMax meet"><path d="M28 30 L12 8 Q34 2 42 20 Z" fill="#eec98f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M102 30 L118 8 Q96 2 88 20 Z" fill="#eec98f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M22 34 Q42 12 65 12 Q88 12 108 34 Q120 50 114 76 Q106 106 65 108 Q24 106 16 76 Q10 50 22 34 Z" fill="#eec98f" stroke="#243352" stroke-width="5.5" stroke-linejoin="round"/><path d="M42 44 Q47 38 52 44" fill="none" stroke="#243352" stroke-width="5" stroke-linecap="round"/><path d="M78 44 Q83 38 88 44" fill="none" stroke="#243352" stroke-width="5" stroke-linecap="round"/><path d="M44 62 Q65 52 86 62 Q92 84 65 88 Q38 84 44 62 Z" fill="#fdf6ea" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><ellipse cx="65" cy="66" rx="7" ry="5.5" fill="#243352"/><path d="M65 71 L65 78 M65 78 Q58 84 51 80 M65 78 Q72 84 79 80" fill="none" stroke="#243352" stroke-width="4" stroke-linecap="round"/></svg>',
    redflower: '<svg viewBox="0 0 110 150" preserveAspectRatio="xMidYMax meet"><path d="M55 74 L55 142" stroke="#567f45" stroke-width="7" stroke-linecap="round"/><path d="M55 104 Q38 100 32 86 Q50 86 55 98 Z" fill="#74a25f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M55 122 Q72 118 78 104 Q60 104 55 116 Z" fill="#74a25f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><g stroke="#243352" stroke-width="4" fill="#e05a48"><ellipse cx="55" cy="20" rx="13" ry="17"/><ellipse cx="30" cy="38" rx="13" ry="17" transform="rotate(-70 30 38)"/><ellipse cx="80" cy="38" rx="13" ry="17" transform="rotate(70 80 38)"/><ellipse cx="38" cy="62" rx="13" ry="17" transform="rotate(-140 38 62)"/><ellipse cx="72" cy="62" rx="13" ry="17" transform="rotate(140 72 62)"/></g><circle cx="55" cy="44" r="14" fill="#f2cf5b" stroke="#243352" stroke-width="4"/></svg>',
    boat: '<svg viewBox="0 0 170 110" preserveAspectRatio="xMidYMax meet"><path d="M0 96 Q12 88 24 96 Q36 104 48 96 Q60 88 72 96 Q84 104 96 96 Q108 88 120 96 Q132 104 144 96 Q156 88 170 96 L170 110 L0 110 Z" fill="#7fa8d9" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M16 74 L154 74 Q148 96 128 98 L44 98 Q24 96 16 74 Z" fill="#d95f5f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="56" y="46" width="58" height="28" rx="5" fill="#fdf6ea" stroke="#243352" stroke-width="4.5"/><rect x="66" y="54" width="12" height="10" rx="2" fill="#9fc4e0" stroke="#243352" stroke-width="3"/><rect x="90" y="54" width="12" height="10" rx="2" fill="#9fc4e0" stroke="#243352" stroke-width="3"/><rect x="78" y="26" width="9" height="20" fill="#e8b04b" stroke="#243352" stroke-width="3.5"/><path d="M82 26 Q84 16 82 10" stroke="#b9c7d8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    sea: '<svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMax meet"><rect x="0" y="30" width="300" height="90" rx="8" fill="#5f93c9" stroke="#243352" stroke-width="4"/><path d="M0 52 Q20 44 40 52 Q60 60 80 52 Q100 44 120 52 Q140 60 160 52 Q180 44 200 52 Q220 60 240 52 Q260 44 280 52 Q290 56 300 52" fill="none" stroke="#9fc4e0" stroke-width="5" stroke-linecap="round"/><path d="M20 78 Q40 70 60 78 Q80 86 100 78 M150 82 Q170 74 190 82 Q210 90 230 82" fill="none" stroke="#7fa8d9" stroke-width="5" stroke-linecap="round"/><path d="M226 30 L226 12 L252 20 L226 28 Z" fill="#fdf6ea" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><path d="M222 30 L234 30" stroke="#243352" stroke-width="4" stroke-linecap="round"/><circle cx="64" cy="40" r="2.5" fill="#fff" opacity=".8"/><circle cx="120" cy="66" r="2.5" fill="#fff" opacity=".6"/><circle cx="260" cy="64" r="2.5" fill="#fff" opacity=".7"/></svg>',
    town: '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMax meet"><path d="M8 62 L34 40 L60 62 Z" fill="#d95f5f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><rect x="14" y="62" width="40" height="44" fill="#fdf6ea" stroke="#243352" stroke-width="4"/><rect x="28" y="80" width="12" height="26" fill="#8a6642" stroke="#243352" stroke-width="3"/><rect x="62" y="46" width="34" height="60" fill="#e8ddc4" stroke="#243352" stroke-width="4"/><path d="M60 46 L98 46" stroke="#243352" stroke-width="5" stroke-linecap="round"/><rect x="68" y="56" width="8" height="8" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="82" y="56" width="8" height="8" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="68" y="72" width="8" height="8" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="82" y="72" width="8" height="8" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><path d="M100 66 L124 48 L148 66 Z" fill="#6f8f7c" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><rect x="106" y="66" width="36" height="40" fill="#fdf6ea" stroke="#243352" stroke-width="4"/><rect x="118" y="84" width="12" height="22" fill="#8a6642" stroke="#243352" stroke-width="3"/><rect x="152" y="56" width="40" height="50" fill="#f2c9a4" stroke="#243352" stroke-width="4"/><path d="M150 56 L194 56" stroke="#243352" stroke-width="5" stroke-linecap="round"/><rect x="160" y="66" width="9" height="9" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="175" y="66" width="9" height="9" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="160" y="82" width="9" height="9" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/><rect x="175" y="82" width="9" height="9" fill="#9fc4e0" stroke="#243352" stroke-width="2.5"/></svg>',
    winter: '<svg viewBox="0 0 130 140" preserveAspectRatio="xMidYMax meet"><g fill="#fff" stroke="#b9c7d8" stroke-width="1.5"><circle cx="16" cy="22" r="4"/><circle cx="108" cy="14" r="3.4"/><circle cx="122" cy="52" r="4"/><circle cx="10" cy="72" r="3"/><circle cx="98" cy="88" r="3.4"/><circle cx="30" cy="108" r="3"/></g><circle cx="65" cy="102" r="34" fill="#fdfdfb" stroke="#243352" stroke-width="5"/><circle cx="65" cy="52" r="25" fill="#fdfdfb" stroke="#243352" stroke-width="5"/><path d="M44 30 L60 14 L74 22 L72 32 Z" fill="#4a7fb5" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><path d="M44 66 Q65 78 86 66 L88 74 Q65 86 42 74 Z" fill="#d95f5f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><ellipse cx="56" cy="48" rx="3.2" ry="4.4" fill="#243352"/><ellipse cx="76" cy="48" rx="3.2" ry="4.4" fill="#243352"/><path d="M62 58 L74 55 L64 62 Z" fill="#f0a33c" stroke="#243352" stroke-width="3" stroke-linejoin="round"/><circle cx="65" cy="94" r="3" fill="#243352"/><circle cx="65" cy="108" r="3" fill="#243352"/></svg>',
    sakura: '<svg viewBox="0 0 150 160" preserveAspectRatio="xMidYMax meet"><path d="M70 156 L70 96 Q70 78 52 66 M70 108 Q72 88 94 76" fill="none" stroke="#8a6642" stroke-width="9" stroke-linecap="round"/><path d="M70 156 L70 96 Q70 78 52 66 M70 108 Q72 88 94 76" fill="none" stroke="#a97e54" stroke-width="5" stroke-linecap="round"/><g stroke="#243352" stroke-width="4"><path d="M22 56 Q14 34 36 26 Q44 10 64 18 Q84 8 94 26 Q112 30 108 50 Q118 66 100 74 Q94 90 74 84 Q56 94 44 78 Q24 76 22 56 Z" fill="#fdfbf7"/><path d="M96 66 Q96 50 114 46 Q124 34 138 44 Q148 54 140 66 Q144 80 128 84 Q112 88 106 78 Q96 76 96 66 Z" fill="#faf5ef"/></g><g fill="#f7c2d4"><circle cx="46" cy="42" r="4"/><circle cx="74" cy="34" r="4"/><circle cx="94" cy="52" r="4"/><circle cx="64" cy="62" r="4"/><circle cx="122" cy="62" r="4"/></g><g fill="#fdfbf7" stroke="#e8b7c8" stroke-width="1.5"><circle cx="30" cy="120" r="4"/><circle cx="116" cy="108" r="4"/><circle cx="94" cy="136" r="3.4"/></g></svg>',
    whitecat: '<svg viewBox="0 0 120 112" preserveAspectRatio="xMidYMax meet"><path d="M24 102 Q12 98 14 80 Q16 62 34 58 L84 58 Q102 62 104 80 Q106 98 94 102 Z" fill="#fdfdfb" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M104 86 Q118 82 116 68 Q114 58 104 58" fill="none" stroke="#243352" stroke-width="5" stroke-linecap="round"/><path d="M52 18 L44 4 Q58 2 62 12 Z" fill="#fdfdfb" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M84 18 L92 4 Q78 2 74 12 Z" fill="#fdfdfb" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><circle cx="68" cy="34" r="26" fill="#fdfdfb" stroke="#243352" stroke-width="5"/><path d="M56 32 Q60 28 64 32 M74 32 Q78 28 82 32" fill="none" stroke="#243352" stroke-width="4" stroke-linecap="round"/><ellipse cx="69" cy="40" rx="3" ry="2.4" fill="#d97878"/><path d="M64 46 Q69 50 74 46" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/><path d="M40 82 Q48 78 56 82 M64 82 Q72 78 80 82" fill="none" stroke="rgba(36,51,82,.25)" stroke-width="3" stroke-linecap="round"/></svg>',
    japanmap: '<svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMax meet"><g fill="#6f8f7c" stroke="#243352" stroke-width="4" stroke-linejoin="round"><path d="M112 10 Q132 6 138 22 Q142 36 128 42 Q116 46 108 36 Q102 20 112 10 Z"/><path d="M118 54 Q130 60 122 76 Q108 100 84 112 Q64 122 52 116 Q44 110 50 100 Q60 88 76 78 Q96 66 104 56 Q110 50 118 54 Z"/><path d="M62 122 Q72 120 72 128 Q70 138 58 136 Q52 132 56 126 Z"/><path d="M28 128 Q42 122 46 132 Q48 142 34 148 Q20 150 18 140 Q18 132 28 128 Z"/></g><circle cx="86" cy="88" r="4" fill="#d95f5f" stroke="#243352" stroke-width="2.5"/></svg>',
    telephone: '<svg viewBox="0 0 120 100" preserveAspectRatio="xMidYMax meet"><path d="M18 92 Q10 92 12 78 Q16 52 42 44 L78 44 Q104 52 108 78 Q110 92 102 92 Z" fill="#3f4650" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="70" r="20" fill="#fdf6ea" stroke="#243352" stroke-width="4"/><g fill="#3f4650"><circle cx="60" cy="56" r="3.4"/><circle cx="72" cy="60" r="3.4"/><circle cx="76" cy="72" r="3.4"/><circle cx="70" cy="82" r="3.4"/><circle cx="48" cy="60" r="3.4"/><circle cx="44" cy="72" r="3.4"/><circle cx="50" cy="82" r="3.4"/></g><path d="M14 34 Q12 20 26 20 Q34 20 38 28 Q48 24 60 24 Q72 24 82 28 Q86 20 94 20 Q108 20 106 34 Q105 42 96 42 Q90 42 86 36 Q74 32 60 32 Q46 32 34 36 Q30 42 24 42 Q15 42 14 34 Z" fill="#d95f5f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 90 110" preserveAspectRatio="xMidYMax meet"><path d="M14 4 L74 4 Q80 4 80 10 L80 96 Q80 102 74 102 L14 102 Q8 102 8 96 L8 10 Q8 4 14 4 Z" fill="#5c86bd" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M18 6 L18 100" stroke="#243352" stroke-width="3" opacity=".45"/><g class="bd bd-circle"><circle cx="50" cy="48" r="17" fill="#fdf6ea" stroke="#243352" stroke-width="4"/></g><g class="bd bd-stripes"><path d="M28 30 L72 30 M28 46 L72 46 M28 62 L72 62" stroke="#fdf6ea" stroke-width="7" stroke-linecap="round"/></g><g class="bd bd-window"><rect x="33" y="31" width="34" height="34" rx="4" fill="#fdf6ea" stroke="#243352" stroke-width="4"/><path d="M50 31 L50 65 M33 48 L67 48" stroke="#243352" stroke-width="3"/></g></svg>',
    bag: '<svg viewBox="0 0 100 112" preserveAspectRatio="xMidYMax meet"><path d="M32 32 Q32 10 50 10 Q68 10 68 32" fill="none" stroke="#243352" stroke-width="6" stroke-linecap="round"/><path d="M18 34 Q14 32 16 42 L22 98 Q23 106 32 106 L68 106 Q77 106 78 98 L84 42 Q86 32 82 34 Z" fill="#d29a66" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="42" y="60" width="16" height="14" rx="3" fill="#fff1c9" stroke="#243352" stroke-width="4"/></svg>',
    clock: '<svg viewBox="0 0 100 108" preserveAspectRatio="xMidYMax meet"><circle cx="50" cy="54" r="46" fill="#fffdf5" stroke="#243352" stroke-width="7"/><circle cx="50" cy="54" r="37" fill="none" stroke="#f0e7d2" stroke-width="3"/><circle cx="50" cy="18" r="2.6" fill="#243352"/><circle cx="86" cy="54" r="2.6" fill="#243352"/><circle cx="50" cy="90" r="2.6" fill="#243352"/><circle cx="14" cy="54" r="2.6" fill="#243352"/><g class="clock-hand-h"><rect x="47" y="30" width="6" height="24" rx="3" fill="#243352"/></g><g class="clock-hand-m"><rect x="47.5" y="20" width="5" height="34" rx="2.5" fill="#243352"/></g><circle cx="50" cy="54" r="4.5" fill="#243352"/></svg>',
    cup: '<svg viewBox="0 0 110 100" preserveAspectRatio="xMidYMax meet"><ellipse cx="48" cy="88" rx="38" ry="7" fill="#e8ddc4" stroke="#243352" stroke-width="4"/><path d="M32 16 Q36 8 32 2 M48 18 Q52 10 48 4" stroke="#b9c7d8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 36 L82 36 Q86 68 62 78 L34 78 Q10 68 14 36 Z" fill="#fdf6ea" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><ellipse cx="48" cy="36" rx="34" ry="7" fill="#8ab89b" stroke="#243352" stroke-width="4"/><path d="M84 42 Q100 42 98 54 Q96 66 79 63" fill="none" stroke="#243352" stroke-width="5"/></svg>',
    water: '<svg viewBox="0 0 70 118" preserveAspectRatio="xMidYMax meet"><rect x="24" y="2" width="22" height="13" rx="3" fill="#5c86bd" stroke="#243352" stroke-width="4"/><path d="M21 21 Q16 30 16 44 L16 100 Q16 112 28 112 L42 112 Q54 112 54 100 L54 44 Q54 30 49 21 Q45 15 35 15 Q25 15 21 21 Z" fill="#cfe4f4" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="17" y="60" width="36" height="22" fill="#fdf6ea" stroke="#243352" stroke-width="3.5"/><path d="M25 32 Q23 40 23 48" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></svg>',
    coffee: '<svg viewBox="0 0 110 100" preserveAspectRatio="xMidYMax meet"><ellipse cx="48" cy="88" rx="38" ry="7" fill="#e8ddc4" stroke="#243352" stroke-width="4"/><path d="M32 16 Q36 8 32 2 M48 18 Q52 10 48 4" stroke="#b9c7d8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 36 L82 36 Q86 68 62 78 L34 78 Q10 68 14 36 Z" fill="#8a5a3b" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><ellipse cx="48" cy="36" rx="34" ry="7" fill="#5d3a24" stroke="#243352" stroke-width="4"/><path d="M84 42 Q100 42 98 54 Q96 66 79 63" fill="none" stroke="#243352" stroke-width="5"/></svg>',
    mystery: '<svg viewBox="0 0 100 110" preserveAspectRatio="xMidYMax meet"><path d="M14 96 Q8 74 26 60 Q40 48 60 50 Q86 54 90 78 Q92 98 74 102 Q40 108 14 96 Z" fill="#9b8ec4" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M44 52 Q38 32 52 26 Q60 22 64 30 Q74 24 78 34 Q82 44 70 48 Q56 54 44 52 Z" fill="#8577b5" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><text x="52" y="90" font-size="32" font-weight="800" fill="#fdf6ea" text-anchor="middle" font-family="sans-serif">?</text></svg>',
    wc: '<svg viewBox="0 0 90 130" preserveAspectRatio="xMidYMax meet"><rect x="41" y="42" width="8" height="84" rx="3" fill="#8a8f99" stroke="#243352" stroke-width="4"/><rect x="10" y="6" width="70" height="44" rx="9" fill="#4a7fb5" stroke="#243352" stroke-width="5"/><text x="45" y="38" font-size="24" font-weight="800" fill="#fff" text-anchor="middle" font-family="sans-serif">WC</text></svg>',
    station: '<svg viewBox="0 0 130 112" preserveAspectRatio="xMidYMax meet"><path d="M8 44 L65 12 L122 44 Z" fill="#d95f5f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="18" y="44" width="94" height="62" fill="#fdf6ea" stroke="#243352" stroke-width="5"/><rect x="52" y="68" width="26" height="38" rx="3" fill="#8a6642" stroke="#243352" stroke-width="4"/><rect x="26" y="54" width="18" height="16" rx="2" fill="#cfe4f4" stroke="#243352" stroke-width="3.5"/><rect x="86" y="54" width="18" height="16" rx="2" fill="#cfe4f4" stroke="#243352" stroke-width="3.5"/><rect x="42" y="22" width="46" height="15" rx="4" fill="#fdf6ea" stroke="#243352" stroke-width="3.5"/><text x="65" y="34" font-size="11" font-weight="800" fill="#243352" text-anchor="middle" font-family="sans-serif">えき</text></svg>',
    menu: '<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet"><path d="M22 112 L36 62 M78 112 L64 62" stroke="#8a6642" stroke-width="6" stroke-linecap="round"/><rect x="18" y="8" width="64" height="78" rx="6" fill="#3f4a3c" stroke="#243352" stroke-width="5"/><text x="50" y="30" font-size="14" font-weight="800" fill="#fdf6ea" text-anchor="middle" font-family="sans-serif">メニュー</text><path d="M28 46 L72 46 M28 58 L64 58 M28 70 L70 70" stroke="#fdf6ea" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>',
    sushi: '<svg viewBox="0 0 130 92" preserveAspectRatio="xMidYMax meet"><path d="M18 60 Q16 46 32 42 L98 38 Q114 40 114 52 Q114 66 98 70 L36 74 Q20 72 18 60 Z" fill="#fdf6ea" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M28 54 Q32 50 36 54 M48 60 Q52 56 56 60 M72 56 Q76 52 80 56" stroke="rgba(36,51,82,.25)" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M12 40 Q10 28 26 24 L100 18 Q118 18 120 30 Q121 40 108 44 L30 50 Q14 50 12 40 Z" fill="#f4845f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M28 32 Q46 26 62 28 M44 42 Q64 36 82 34 M92 26 Q104 24 110 28" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/><path d="M56 22 L74 20 L78 54 L60 56 Z" fill="#2f4032" stroke="#243352" stroke-width="4" stroke-linejoin="round"/></svg>',
    car: '<svg viewBox="0 0 150 88" preserveAspectRatio="xMidYMax meet"><path d="M14 60 Q10 38 30 36 L40 22 Q44 14 54 14 L96 14 Q106 14 112 24 L120 36 Q140 38 136 60 Q134 68 124 68 L26 68 Q16 68 14 60 Z" fill="#d96b6b" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M48 22 L92 22 Q98 22 102 30 L106 36 L44 36 Z" fill="#cfe4f4" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><circle cx="42" cy="68" r="13" fill="#3b3f4a" stroke="#243352" stroke-width="4"/><circle cx="42" cy="68" r="5" fill="#c8ccd6"/><circle cx="108" cy="68" r="13" fill="#3b3f4a" stroke="#243352" stroke-width="4"/><circle cx="108" cy="68" r="5" fill="#c8ccd6"/></svg>',
    house: '<svg viewBox="0 0 120 112" preserveAspectRatio="xMidYMax meet"><path d="M8 50 L60 8 L112 50 Z" fill="#d95f5f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="50" width="80" height="56" fill="#fdf6ea" stroke="#243352" stroke-width="5"/><rect x="48" y="70" width="24" height="36" rx="3" fill="#8a6642" stroke="#243352" stroke-width="4"/><circle cx="66" cy="88" r="2.5" fill="#243352"/><rect x="28" y="58" width="14" height="13" rx="2" fill="#cfe4f4" stroke="#243352" stroke-width="3.5"/><rect x="78" y="58" width="14" height="13" rx="2" fill="#cfe4f4" stroke="#243352" stroke-width="3.5"/></svg>',
    bigface: '<svg viewBox="0 0 110 130" preserveAspectRatio="xMidYMax meet"><rect x="38" y="98" width="34" height="28" rx="8" fill="#7f9ec0" stroke="#243352" stroke-width="4.5"/><circle cx="55" cy="54" r="48" fill="#f8d4ac" stroke="#243352" stroke-width="5"/><ellipse cx="38" cy="50" rx="4.5" ry="7" fill="#243352"/><ellipse cx="72" cy="50" rx="4.5" ry="7" fill="#243352"/><path d="M40 74 Q55 86 70 74" fill="none" stroke="#243352" stroke-width="5" stroke-linecap="round"/><circle cx="28" cy="64" r="7" fill="rgba(240,138,69,.3)"/><circle cx="82" cy="64" r="7" fill="rgba(240,138,69,.3)"/></svg>',
    persimmon: '<svg viewBox="0 0 90 98" preserveAspectRatio="xMidYMax meet"><path d="M45 22 Q42 8 30 6 Q44 2 50 10 Q54 2 66 6 Q56 10 53 22 Z" fill="#74a25f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M12 56 Q12 26 45 26 Q78 26 78 56 Q78 92 45 92 Q12 92 12 56 Z" fill="#f08a45" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M28 40 Q24 50 26 60" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/></svg>',
    cow: '<svg viewBox="0 0 150 104" preserveAspectRatio="xMidYMax meet"><path d="M30 88 L30 74 Q22 68 24 52 Q26 34 48 30 L96 28 Q118 30 121 48 Q123 62 116 70 L116 88 Q116 92 111 92 L106 92 Q102 92 102 88 L102 76 L52 78 L52 88 Q52 92 47 92 L35 92 Q30 92 30 88 Z" fill="#fdfaf2" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><path d="M40 47 Q52 40 60 50 Q64 62 52 66 Q40 68 38 58 Q37 51 40 47 Z" fill="#4a4433"/><path d="M78 58 Q90 54 94 64 Q95 73 84 74 Q74 73 75 64 Q76 60 78 58 Z" fill="#4a4433"/><path d="M104 22 Q124 18 132 32 Q138 44 130 54 Q122 62 108 60 Q96 57 96 44 Q96 28 104 22 Z" fill="#fdfaf2" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><path d="M100 18 Q94 8 104 8 Q112 9 110 18 Z" fill="#e8ddc4" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><path d="M130 20 Q136 10 142 16 Q146 22 136 26 Z" fill="#e8ddc4" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="110" cy="38" rx="3.4" ry="4.2" fill="#243352"/><ellipse cx="126" cy="38" rx="3.4" ry="4.2" fill="#243352"/><path d="M104 50 Q118 46 130 50 Q134 58 126 61 Q112 64 104 58 Q101 53 104 50 Z" fill="#f2b8c3" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><circle cx="113" cy="55" r="1.8" fill="#243352"/><circle cx="122" cy="55" r="1.8" fill="#243352"/><path d="M30 60 Q20 64 22 74" fill="none" stroke="#243352" stroke-width="4" stroke-linecap="round"/><circle cx="21" cy="77" r="4" fill="#4a4433" stroke="#243352" stroke-width="2.5"/></svg>',
    octopus: '<svg viewBox="0 0 100 96" preserveAspectRatio="xMidYMax meet"><path d="M26 62 Q22 76 12 80 M40 64 Q40 78 32 86 M60 64 Q60 78 68 86 M74 62 Q78 76 88 80" fill="none" stroke="#243352" stroke-width="13" stroke-linecap="round"/><path d="M26 62 Q22 76 12 80 M40 64 Q40 78 32 86 M60 64 Q60 78 68 86 M74 62 Q78 76 88 80" fill="none" stroke="#e8756f" stroke-width="8" stroke-linecap="round"/><path d="M20 44 Q18 10 50 10 Q82 10 80 44 Q79 58 68 62 L32 62 Q21 58 20 44 Z" fill="#e8756f" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><ellipse cx="38" cy="40" rx="4" ry="6" fill="#243352"/><ellipse cx="62" cy="40" rx="4" ry="6" fill="#243352"/><path d="M44 50 Q50 54 56 50" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    cat: '<svg viewBox="0 0 120 112" preserveAspectRatio="xMidYMax meet"><path d="M24 102 Q12 98 14 80 Q16 62 34 58 L84 58 Q102 62 104 80 Q106 98 94 102 Z" fill="#e8c891" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M104 86 Q118 82 116 68 Q114 58 104 58" fill="none" stroke="#243352" stroke-width="5" stroke-linecap="round"/><g class="cat-paw"><path d="M30 62 Q18 50 22 36 Q24 28 32 32 Q42 38 42 54 Z" fill="#f2d9ab" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/></g><path d="M52 18 L44 4 Q58 2 62 12 Z" fill="#e8c891" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M84 18 L92 4 Q78 2 74 12 Z" fill="#e8c891" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><circle cx="68" cy="34" r="26" fill="#eccf9d" stroke="#243352" stroke-width="5"/><path d="M56 32 Q60 28 64 32 M74 32 Q78 28 82 32" fill="none" stroke="#243352" stroke-width="4" stroke-linecap="round"/><ellipse cx="69" cy="40" rx="3" ry="2.4" fill="#d97878"/><path d="M64 46 Q69 50 74 46" fill="none" stroke="#243352" stroke-width="3.5" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMax meet"><path d="M30 10 L36 26 L52 32 L36 38 L30 54 L24 38 L8 32 L24 26 Z" fill="#f2cf5b" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><path d="M82 4 L86 15 L98 20 L86 25 L82 36 L78 25 L66 20 L78 15 Z" fill="#f7dc7d" stroke="#243352" stroke-width="3" stroke-linejoin="round"/><path d="M96 52 L99 60 L108 64 L99 68 L96 76 L93 68 L84 64 L93 60 Z" fill="#f7dc7d" stroke="#243352" stroke-width="3" stroke-linejoin="round"/></svg>',
    peach: '<svg viewBox="0 0 90 98" preserveAspectRatio="xMidYMax meet"><path d="M52 22 Q58 10 72 8 Q64 20 58 26 Z" fill="#74a25f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M45 26 Q20 26 14 52 Q10 80 45 92 Q80 80 76 52 Q70 26 45 26 Z" fill="#f8b7a0" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M45 30 Q42 60 45 88" stroke="rgba(36,51,82,.3)" stroke-width="3" fill="none"/><path d="M26 42 Q22 52 24 62" stroke="#fff" stroke-width="4" opacity=".55" fill="none" stroke-linecap="round"/></svg>',
    bird: '<svg viewBox="0 0 110 92" preserveAspectRatio="xMidYMax meet"><path d="M96 30 L108 34 L95 40 Z" fill="#f0a33c" stroke="#243352" stroke-width="3.5" stroke-linejoin="round"/><path d="M18 48 Q18 20 46 18 Q74 16 80 38 Q84 62 66 70 L38 72 Q18 68 18 48 Z" fill="#9fc4e0" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M34 42 Q28 54 40 58 Q52 60 54 48 Q54 40 46 38 Q37 37 34 42 Z" fill="#6f9cc4" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><circle cx="66" cy="34" r="3.5" fill="#243352"/><path d="M44 72 L44 84 M56 70 L56 82" stroke="#243352" stroke-width="4" stroke-linecap="round"/></svg>',
    flower: '<svg viewBox="0 0 90 120" preserveAspectRatio="xMidYMax meet"><path d="M45 58 L45 84" stroke="#567f45" stroke-width="5" stroke-linecap="round"/><g stroke="#243352" stroke-width="3.5" fill="#f5a8c0"><ellipse cx="45" cy="18" rx="9" ry="12"/><ellipse cx="27" cy="32" rx="9" ry="12" transform="rotate(-70 27 32)"/><ellipse cx="63" cy="32" rx="9" ry="12" transform="rotate(70 63 32)"/><ellipse cx="33" cy="50" rx="9" ry="12" transform="rotate(-140 33 50)"/><ellipse cx="57" cy="50" rx="9" ry="12" transform="rotate(140 57 50)"/></g><circle cx="45" cy="36" r="10" fill="#f2cf5b" stroke="#243352" stroke-width="3.5"/><path d="M24 84 L66 84 L60 112 Q59 116 54 116 L36 116 Q31 116 30 112 Z" fill="#c97f4e" stroke="#243352" stroke-width="4.5" stroke-linejoin="round"/><rect x="20" y="80" width="50" height="10" rx="4" fill="#b06a3c" stroke="#243352" stroke-width="4"/></svg>',
    mountain: '<svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMax meet"><path d="M10 118 L78 34 L146 118 Z" fill="#8fac97" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M80 118 L150 20 L214 118 Z" fill="#6f8f7c" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M150 20 L178 62 L166 56 L158 66 L148 54 L138 64 L128 54 L122 62 Z" fill="#fff" stroke="#243352" stroke-width="4" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 110 110" preserveAspectRatio="xMidYMax meet"><g stroke="#f2b83c" stroke-width="7" stroke-linecap="round"><path d="M55 4 L55 18 M55 92 L55 106 M4 55 L18 55 M92 55 L106 55 M19 19 L29 29 M81 81 L91 91 M91 19 L81 29 M29 81 L19 91"/></g><circle cx="55" cy="55" r="30" fill="#f7c948" stroke="#243352" stroke-width="5"/><path d="M44 52 Q48 48 52 52 M60 52 Q64 48 68 52" stroke="#243352" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M48 62 Q55 68 62 62" stroke="#243352" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet"><path d="M62 6 Q34 14 34 48 Q34 82 62 90 Q40 96 22 82 Q4 66 8 42 Q12 20 32 10 Q46 4 62 6 Z" fill="#f5e8b8" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><circle cx="26" cy="40" r="4" fill="rgba(36,51,82,.15)"/><circle cx="34" cy="62" r="6" fill="rgba(36,51,82,.12)"/></svg>',
    chair: '<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax meet"><rect x="20" y="6" width="60" height="52" rx="10" fill="#cd9459" stroke="#243352" stroke-width="5"/><path d="M22 74 L22 124 M78 74 L78 124" stroke="#243352" stroke-width="10" stroke-linecap="round"/><path d="M22 74 L22 124 M78 74 L78 124" stroke="#a2703f" stroke-width="5" stroke-linecap="round"/><rect x="12" y="58" width="76" height="16" rx="6" fill="#d9a568" stroke="#243352" stroke-width="5"/></svg>',
    signal: '<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax meet"><rect x="46" y="36" width="8" height="90" rx="3" fill="#8a8f99" stroke="#243352" stroke-width="4"/><rect x="6" y="6" width="88" height="34" rx="10" fill="#3f4650" stroke="#243352" stroke-width="5"/><circle cx="26" cy="23" r="11" fill="#e05a48" stroke="#243352" stroke-width="3.5"/><circle cx="50" cy="23" r="11" fill="#8f8a5e" stroke="#243352" stroke-width="3.5" opacity=".55"/><circle cx="74" cy="23" r="11" fill="#5b8f86" stroke="#243352" stroke-width="3.5" opacity=".55"/></svg>',
    train: '<svg viewBox="0 0 170 86" preserveAspectRatio="xMidYMax meet"><circle cx="38" cy="74" r="9" fill="#3b3f4a" stroke="#243352" stroke-width="3.5"/><circle cx="132" cy="74" r="9" fill="#3b3f4a" stroke="#243352" stroke-width="3.5"/><path d="M8 62 L8 24 Q8 8 26 8 L156 8 Q162 8 162 16 L162 62 Q162 70 154 70 L16 70 Q8 70 8 62 Z" fill="#f0f3f0" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="10" y="46" width="150" height="12" fill="#3f8f5f"/><path d="M10 46 L160 46 M10 58 L160 58" stroke="#243352" stroke-width="2.5"/><rect x="22" y="18" width="24" height="18" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="58" y="18" width="24" height="18" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="94" y="18" width="24" height="18" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="130" y="18" width="24" height="18" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/></svg>',
    bus: '<svg viewBox="0 0 160 92" preserveAspectRatio="xMidYMax meet"><circle cx="42" cy="80" r="10" fill="#3b3f4a" stroke="#243352" stroke-width="4"/><circle cx="120" cy="80" r="10" fill="#3b3f4a" stroke="#243352" stroke-width="4"/><path d="M10 72 L10 22 Q10 10 24 10 L136 10 Q150 10 150 22 L150 72 Q150 78 144 78 L16 78 Q10 78 10 72 Z" fill="#f2c14e" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="22" width="26" height="20" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="56" y="22" width="26" height="20" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="92" y="22" width="26" height="20" rx="4" fill="#9fc4e0" stroke="#243352" stroke-width="4"/><rect x="126" y="22" width="16" height="36" rx="3" fill="#cfe4f4" stroke="#243352" stroke-width="4"/><rect x="24" y="54" width="80" height="13" rx="4" fill="#fdf6ea" stroke="#243352" stroke-width="3.5"/></svg>',
    umbrella: '<svg viewBox="0 0 110 122" preserveAspectRatio="xMidYMax meet"><path d="M55 12 L55 2" stroke="#243352" stroke-width="5" stroke-linecap="round"/><path d="M7 54 Q13 16 55 14 Q97 16 103 54 Q92 44 82 54 Q72 44 62 54 Q58 48 55 48 Q52 48 48 54 Q38 44 28 54 Q18 44 7 54 Z" fill="#5c86bd" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M55 14 L55 48" stroke="rgba(36,51,82,.4)" stroke-width="2.5"/><path d="M55 54 L55 104 Q55 116 44 116 Q35 116 35 106" fill="none" stroke="#243352" stroke-width="10" stroke-linecap="round"/><path d="M55 54 L55 104 Q55 116 44 116 Q35 116 35 106" fill="none" stroke="#8a6642" stroke-width="6" stroke-linecap="round"/></svg>',
    ticket: '<svg viewBox="0 0 110 64" preserveAspectRatio="xMidYMax meet"><path d="M14 6 L96 6 Q102 6 102 12 L102 52 Q102 58 96 58 L14 58 Q8 58 8 52 L8 12 Q8 6 14 6 Z" fill="#fdf6ea" stroke="#243352" stroke-width="5" stroke-linejoin="round"/><path d="M14 6 L26 6 L26 58 L14 58 Q8 58 8 52 L8 12 Q8 6 14 6 Z" fill="#d95f5f" stroke="#243352" stroke-width="4" stroke-linejoin="round"/><path d="M36 22 L88 22 M36 33 L74 33 M36 44 L82 44" stroke="rgba(36,51,82,.4)" stroke-width="3.5" stroke-linecap="round"/><circle cx="92" cy="16" r="4" fill="#fff" stroke="#243352" stroke-width="3"/></svg>',
  };
  // ---- object factory: SVG from the library; chibi images for people --------
  function objectFigure(kind) {
    const fig = el("span", "obj obj-" + kind);
    fig.setAttribute("aria-hidden", "true");
    if (kind === "friend" || kind === "mochiko") {
      const img = document.createElement("img");
      img.className = "obj-person-img";
      img.src = kind === "friend" ? "assets/chibi_cheer.png" : "assets/chibi_think.png";
      img.alt = "";
      fig.appendChild(img);
      return fig;
    }
    if (kind === "book") {
      fig.dataset.design = (story.inventory.book && story.inventory.book.design) || "circle";
    }
    if (kind === "avatar" || kind === "friendchar") {
      const slot = kind === "avatar" ? story.inventory.avatar : story.inventory.friend;
      const fallback = kind === "avatar" ? PEOPLE[0] : PEOPLE[1];
      const person = PEOPLE.find((p) => slot && p.id === slot.id) || fallback;
      fig.innerHTML = OBJ_SVG[person.svg] || "";
      if (kind === "friendchar" && story.friendName) {
        const tag = el("i", "obj-name");
        tag.textContent = story.friendName;
        fig.appendChild(tag);
      }
      return fig;
    }
    fig.innerHTML = OBJ_SVG[kind] || "";
    return fig;
  }
  function objButton(kind, zone, label) {
    const button = el("button", "story-obj");
    button.type = "button";
    if (zone) button.dataset.zone = zone;
    button.dataset.object = kind;
    button.setAttribute("aria-label", label || (OBJ_NAME[kind] + (zone && ZONE_DESC[zone] ? " " + ZONE_DESC[zone] : "")));
    button.appendChild(objectFigure(kind));
    return button;
  }

  // ---- claim: choose your book ----------------------------------------------
  function bookButton(book, className) {
    const button = el("button", "story-book " + (className || ""));
    button.type = "button";
    button.dataset.design = book.id;
    button.setAttribute("aria-label", book.name + " book");
    const cover = el("span", "story-book-cover");
    cover.append(el("i", "story-book-mark"), el("i", "story-book-pages"));
    button.appendChild(cover);
    return button;
  }
  function selectedBook() {
    const id = story.inventory.book && story.inventory.book.design;
    return BOOKS.find((book) => book.id === id) || BOOKS[0];
  }
  function ensureBook() {
    if (!story.inventory.book) { story.inventory.book = { design: BOOKS[0].id, slot: 1 }; saveStory(); }
    return selectedBook();
  }

  function renderClaimBeat(_beat, finishBeat) {
    overlay.title.textContent = "Choose your book";
    overlay.copy.textContent = "Pick one cover. The app remembers it and brings it back in later scenes.";
    const shelf = el("div", "story-book-row story-choice-row");
    for (const book of BOOKS) {
      const button = bookButton(book, "story-choice");
      button.addEventListener("click", () => {
        shelf.querySelectorAll(".story-book").forEach((node) => node.classList.remove("selected"));
        button.classList.add("selected");
        story.inventory.book = {
          design: book.id,
          slot: story.inventory.book && Number.isInteger(story.inventory.book.slot) ? story.inventory.book.slot : 1,
        };
        saveStory();
        overlay.feedback.textContent = "This is now your book. Remember its cover.";
        overlay.feedback.className = "story-feedback success";
        showContinue("Keep this book →", finishBeat);
      });
      shelf.appendChild(button);
    }
    overlay.stage.appendChild(shelf);
  }

  // ---- place: put it on the desk (drag or tap) -------------------------------
  function renderPlaceBeat(_beat, finishBeat) {
    const book = ensureBook();
    overlay.title.textContent = "Put your book on the desk";
    overlay.copy.textContent = "Drag your book onto a space — or just tap the space where you want it.";
    const desk = el("div", "story-desk");
    const slots = [];
    for (let index = 0; index < 3; index += 1) {
      const slot = el("button", "story-slot");
      slot.type = "button";
      slot.dataset.slot = String(index);
      slot.setAttribute("aria-label", ["left", "middle", "right"][index] + " side of desk");
      desk.appendChild(slot);
      slots.push(slot);
    }
    const tray = el("div", "story-tray");
    const piece = bookButton(book, "story-place-piece");
    piece.setAttribute("aria-label", "Your book. Drag it to the desk, or tap a desk space.");
    tray.appendChild(piece);

    const settle = (slot) => {
      slots.forEach((node) => node.classList.remove("filled"));
      slot.classList.add("filled");
      clearDraggedStyles(piece);
      slot.appendChild(piece);
      story.inventory.book.slot = Number(slot.dataset.slot);
      saveStory();
      overlay.feedback.textContent = "Placed. This position now belongs to your book.";
      overlay.feedback.className = "story-feedback success";
      showContinue("Leave it there →", finishBeat);
    };
    slots.forEach((slot) => slot.addEventListener("click", () => settle(slot)));
    attachPointerDrag(piece, slots, settle);
    overlay.stage.append(desk, tray);
  }

  function attachPointerDrag(piece, slots, settle) {
    piece.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      const startParent = piece.parentElement;
      const startNext = piece.nextSibling;
      const rect = piece.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      piece.classList.add("dragging");
      piece.style.position = "fixed";
      piece.style.zIndex = "10020";
      piece.style.width = rect.width + "px";
      piece.style.height = rect.height + "px";
      piece.style.left = rect.left + "px";
      piece.style.top = rect.top + "px";
      piece.style.pointerEvents = "none";
      document.body.appendChild(piece);
      const move = (moveEvent) => {
        piece.style.left = moveEvent.clientX - offsetX + "px";
        piece.style.top = moveEvent.clientY - offsetY + "px";
        slots.forEach((slot) => slot.classList.remove("drop-target"));
        const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const slot = target && target.closest && target.closest(".story-slot");
        if (slot) slot.classList.add("drop-target");
      };
      const putBack = () => {
        clearDraggedStyles(piece);
        if (startNext) startParent.insertBefore(piece, startNext); else startParent.appendChild(piece);
      };
      const up = (upEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        slots.forEach((slot) => slot.classList.remove("drop-target"));
        const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const slot = target && target.closest && target.closest(".story-slot");
        if (slot) settle(slot); else putBack();
      };
      const cancel = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        slots.forEach((slot) => slot.classList.remove("drop-target"));
        putBack();
      };
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up, { once: true });
      window.addEventListener("pointercancel", cancel, { once: true });
    });
  }
  function clearDraggedStyles(piece) {
    piece.classList.remove("dragging");
    piece.style.position = "";
    piece.style.zIndex = "";
    piece.style.width = "";
    piece.style.height = "";
    piece.style.left = "";
    piece.style.top = "";
    piece.style.pointerEvents = "";
  }

  // ---- identify: find YOUR book among decoys ---------------------------------
  function renderIdentifyBeat(beat, finishBeat) {
    const chosen = ensureBook();
    const chosenSlot = Number.isInteger(story.inventory.book.slot) ? story.inventory.book.slot : 1;
    const ask = beat.ask || { en: "Which one is your book?", jp: "", romaji: "" };
    overlay.title.textContent = ask.en;
    overlay.copy.textContent = "Tap the book you chose earlier — that answers the question.";
    if (ask.jp) overlay.stage.appendChild(sentenceBlock("story-ask", "もち子 asks", ask));

    const row = el("div", "story-book-row story-identify-row");
    const ordered = new Array(3);
    ordered[chosenSlot] = chosen;
    const decoys = BOOKS.filter((book) => book.id !== chosen.id);
    let decoyIndex = 0;
    for (let index = 0; index < ordered.length; index += 1) {
      if (!ordered[index]) ordered[index] = decoys[decoyIndex++];
    }
    ordered.forEach((book) => {
      const button = bookButton(book, "story-identify-choice");
      button.addEventListener("click", () => {
        if (button.classList.contains("correct")) return;
        if (book.id !== chosen.id) {   // wrong: do NOT advance, no auto-reveal
          button.classList.remove("wrong");
          void button.offsetWidth;
          button.classList.add("wrong");
          overlay.feedback.textContent = "Not that one — look for the cover you chose.";
          overlay.feedback.className = "story-feedback try-again";
          return;
        }
        row.querySelectorAll(".story-book").forEach((node) => {
          node.disabled = true;
          if (node !== button) node.classList.add("dimmed");
        });
        button.classList.add("correct");
        attachAnswer(beat, "Now say it:");
        overlay.feedback.textContent = "That's your book!";
        overlay.feedback.className = "story-feedback success";
        showContinue("Say it →", finishBeat);
      });
      row.appendChild(button);
    });
    overlay.stage.appendChild(row);
  }

  // ---- point: the object at the right DISTANCE -------------------------------
  // Wrong taps TEACH the zone word instead of just refusing.
  function renderPointBeat(beat, finishBeat) {
    const words = WORDSETS[beat.words || "thing"];
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = WORDSET_COPY[beat.words || "thing"];
    // A beat can carry the question this act answers (もち子 asks it first).
    if (beat.ask) overlay.stage.insertAdjacentElement("beforebegin", sentenceBlock("story-ask", "もち子 asks", beat.ask));

    const sceneKind = beat.scene || "room";
    const scene = buildScene(sceneKind);
    const layout = beat.layout || { near: "book", partner: "bag", far: "clock" };

    const farZone = el("div", "scene-zone scene-zone-far");
    farZone.appendChild(objButton(layout.far, "far"));
    if (sceneKind === "room") farZone.appendChild(el("i", "scene-shelf-board"));
    const partnerZone = el("div", "scene-zone scene-zone-partner");
    // If もち子 herself is the partner-zone tappable, don't draw her twice.
    if (layout.partner !== "mochiko") partnerZone.appendChild(mochikoImg("assets/chibi_think.png"));
    partnerZone.appendChild(objButton(layout.partner, "partner"));
    const nearZone = el("div", "scene-zone scene-zone-near");
    const hand = el("div", "story-hand");
    hand.setAttribute("aria-hidden", "true");
    nearZone.append(objButton(layout.near, "near"), hand);
    scene.append(farZone, partnerZone, nearZone);
    overlay.stage.appendChild(scene);

    // "the かばん" for things; "もち子 herself" for the person
    const named = (kind) => (kind === "mochiko" ? "もち子 herself" : "the " + (OBJ_JP[kind] || OBJ_NAME[kind]));
    const desc = (kind, zone) => (kind === "mochiko" ? "right beside you" : ZONE_DESC[zone]);

    scene.querySelectorAll(".story-obj").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const zone = btn.dataset.zone;
        const kind = btn.dataset.object;
        if (zone !== beat.target) {   // wrong distance: teach it, don't advance
          btn.classList.remove("wrong");
          void btn.offsetWidth;
          btn.classList.add("wrong");
          overlay.feedback.textContent = "That's " + named(kind) + " " + desc(kind, zone) +
            " — " + words[zone] + ". Find " + named(layout[beat.target]) + " " + ZONE_DESC[beat.target] + ".";
          overlay.feedback.className = "story-feedback try-again";
          return;
        }
        scene.querySelectorAll(".story-obj").forEach((node) => {
          node.disabled = true;
          if (node !== btn) node.classList.add("dimmed");
        });
        btn.classList.add("correct");
        hand.dataset.aim = zone;
        attachAnswer(beat, words[beat.target] + " — now say it:");
        overlay.feedback.textContent = "You're pointing right at it!";
        overlay.feedback.className = "story-feedback success";
        showContinue("Say it →", finishBeat);
      });
    });
  }

  // ---- ask: tap the unknown thing — curiosity IS the question ----------------
  function renderAskBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "";

    const scene = buildScene(beat.scene || "room");
    if (beat.night) scene.classList.add("night");
    const target = objButton(beat.object, beat.zone, (beat.tag ? "price tag on the " : "") + OBJ_NAME[beat.object]);
    if (beat.tag) { const t = el("i", "obj-tag"); t.appendChild(el("span", "obj-tag-txt", beat.tagText || "?")); target.appendChild(t); }
    if (beat.clock) target.dataset.clock = beat.clock;   // clock-hand positions for time beats
    if (beat.prop) {   // a second object carried by / beside the target
      const prop = objectFigure(beat.prop);
      prop.classList.add("obj-prop");
      target.appendChild(prop);
    }
    if (beat.otherBook) {   // NOT your book — someone else's cover, so これは ほんです stays "a book"
      const mine = (story.inventory.book && story.inventory.book.design) || BOOKS[0].id;
      const fig = target.querySelector(".obj-book");
      if (fig) fig.dataset.design = (BOOKS.find((b) => b.id !== mine) || BOOKS[0]).id;
    }

    if (beat.scene === "shop") {
      scene.appendChild(mochikoImg("assets/chibi_cheer.png", "scene-mochiko scene-mochiko-shop"));
      const counterZone = el("div", "scene-zone scene-zone-counter");
      counterZone.appendChild(target);
      scene.appendChild(counterZone);
    } else if (beat.zone === "table") {
      const tableZone = el("div", "scene-zone scene-zone-table");
      const table = el("div", "scene-table");
      table.setAttribute("aria-hidden", "true");
      tableZone.append(target, table);
      scene.appendChild(tableZone);
    } else if (beat.zone === "partner") {
      const partnerZone = el("div", "scene-zone scene-zone-partner");
      // If もち子 herself is the one you're asking, she IS the tappable.
      if (beat.object !== "mochiko") partnerZone.appendChild(mochikoImg("assets/chibi_think.png"));
      partnerZone.appendChild(target);
      scene.appendChild(partnerZone);
    } else if (beat.zone === "wall") {
      const wallZone = el("div", "scene-zone scene-zone-wall");
      wallZone.appendChild(target);
      scene.appendChild(wallZone);
    } else if (beat.zone === "far") {
      const farZone = el("div", "scene-zone scene-zone-far");
      if (beat.object === "star" || beat.sky) farZone.classList.add("in-sky");   // stars/sun/moon hang in the sky
      farZone.appendChild(target);
      scene.appendChild(farZone);
    } else {
      const nearZone = el("div", "scene-zone scene-zone-near");
      const hand = el("div", "story-hand");
      hand.setAttribute("aria-hidden", "true");
      nearZone.append(target, hand);
      scene.appendChild(nearZone);
    }
    overlay.stage.appendChild(scene);

    target.addEventListener("click", () => {
      if (target.disabled) return;
      target.disabled = true;
      target.classList.add("noticed");
      attachAnswer(beat, beat.askLabel || "Ask it:");
      overlay.feedback.textContent = beat.feedback || "Hmm… time to ask.";
      overlay.feedback.className = "story-feedback success";
      showContinue(beat.cta || "Ask →", finishBeat);
    });
  }

  // ---- order: tap what you want — it drops into your basket ------------------
  // Wrong taps teach the OBJECT word (それは コーヒーです — you want みず).
  function renderOrderBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "";

    const sceneKind = beat.scene || "shop";
    const scene = buildScene(sceneKind);
    if (sceneKind === "shop") scene.appendChild(mochikoImg("assets/chibi_cheer.png", "scene-mochiko scene-mochiko-shop"));
    const counterZone = el("div", "scene-zone scene-zone-counter");
    for (const kind of beat.items) {
      const btn = objButton(kind, "counter");
      if (beat.tags && beat.tags[kind]) {
        const t = el("i", "obj-tag");
        t.appendChild(el("span", "obj-tag-txt", beat.tags[kind]));
        btn.appendChild(t);
      }
      counterZone.appendChild(btn);
    }
    scene.appendChild(counterZone);
    // where taken items land: your basket (shop) or your hand (room)
    let dest;
    if (beat.dest === "hand") {
      dest = el("div", "story-hand scene-dest-hand");
      dest.setAttribute("aria-hidden", "true");
    } else {
      dest = el("div", "scene-basket");
      dest.setAttribute("aria-hidden", "true");
    }
    scene.appendChild(dest);
    overlay.stage.appendChild(scene);

    const wanted = beat.targets ? beat.targets.slice() : (beat.target ? [beat.target] : null);
    const taken = new Set();
    const flyTo = (btn) => {
      if (reducedMotion) return;
      const a = btn.getBoundingClientRect();
      const b = dest.getBoundingClientRect();
      btn.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1)";
      btn.style.transform = "translate(" + (b.left + b.width / 2 - (a.left + a.width / 2)) + "px, " +
        (b.top + b.height / 2 - (a.top + a.height / 2)) + "px) scale(0.75)";
      btn.style.zIndex = "6";
    };
    const complete = () => {
      counterZone.querySelectorAll(".story-obj").forEach((node) => {
        node.disabled = true;
        if (!node.classList.contains("correct")) node.classList.add("dimmed");
      });
      attachAnswer(beat, "Now say it:");
      overlay.feedback.textContent = wanted ? "It's yours." : "Good pick — that one is これ now.";
      overlay.feedback.className = "story-feedback success";
      showContinue("Say it →", finishBeat);
    };

    counterZone.querySelectorAll(".story-obj").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled || taken.has(btn.dataset.object)) return;
        const kind = btn.dataset.object;
        if (wanted && !wanted.includes(kind)) {   // wrong item: teach the word
          btn.classList.remove("wrong");
          void btn.offsetWidth;
          btn.classList.add("wrong");
          const want = wanted.filter((w) => !taken.has(w)).map((w) => OBJ_JP[w] + " (" + OBJ_NAME[w] + ")").join(" and ");
          overlay.feedback.textContent = "That's the " + OBJ_JP[kind] + " (" + OBJ_NAME[kind] + "). You're after the " + want + ".";
          overlay.feedback.className = "story-feedback try-again";
          return;
        }
        taken.add(kind);
        btn.classList.add("correct");
        btn.disabled = true;
        flyTo(btn);
        if (!wanted || wanted.every((w) => taken.has(w))) complete();
        else {
          overlay.feedback.textContent = "Got it — now the other one.";
          overlay.feedback.className = "story-feedback success";
        }
      });
    });
  }

  // ---- count: tap them one at a time — the counting IS the word --------------
  function renderCountBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = "Tap one at a time. The counter word appears with every tap.";
    const scene = buildScene("shop");
    scene.appendChild(mochikoImg("assets/chibi_cheer.png", "scene-mochiko scene-mochiko-shop"));
    const counterZone = el("div", "scene-zone scene-zone-counter scene-zone-count");
    // ぜんぶ (finalWord) means ALL of them — the row must hold exactly n, so
    // nothing is left behind. Counted beats get spares to choose from.
    const total = beat.finalWord ? beat.n : Math.max(beat.n + 1, 4);
    for (let i = 0; i < total; i += 1) counterZone.appendChild(objButton(beat.item, "counter"));
    scene.appendChild(counterZone);
    overlay.stage.appendChild(scene);

    let counted = 0;
    counterZone.querySelectorAll(".story-obj").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled || counted >= beat.n) return;
        btn.disabled = true;
        btn.classList.add("correct");
        const isLast = counted === beat.n - 1;
        const word = (isLast && beat.finalWord) ? beat.finalWord : COUNTS[counted] || String(counted + 1);
        btn.appendChild(el("span", "count-chip", word));
        counted += 1;
        if (counted >= beat.n) {
          counterZone.querySelectorAll(".story-obj").forEach((node) => {
            node.disabled = true;
            if (!node.classList.contains("correct")) node.classList.add("dimmed");
          });
          attachAnswer(beat, (beat.finalWord || COUNTS[beat.n - 1]) + " — now say it:");
          overlay.feedback.textContent = "Counted!";
          overlay.feedback.className = "story-feedback success";
          showContinue("Say it →", finishBeat);
        } else {
          overlay.feedback.textContent = word + "… keep going.";
          overlay.feedback.className = "story-feedback success";
        }
      });
    });
  }

  // ---- pick: two of the same thing, different SIZE — tap the right one -------
  // Wrong taps teach the opposite adjective.
  // ---- coins: count the money — the stack you can SEE is the amount --------
  const HUNDREDS = ["ひゃく", "にひゃく", "さんびゃく", "よんひゃく", "ごひゃく"];
  const COIN_JP = { 100: "ひゃくえん", 300: "さんびゃくえん", 500: "ごひゃくえん", 1000: "せんえん" };
  function coinStack(n) {
    const fig = el("span", "obj obj-coins");
    fig.setAttribute("aria-hidden", "true");
    for (let i = 0; i < n; i += 1) fig.appendChild(el("i", "coin" + (i === n - 1 ? " coin-top" : "")));
    return fig;
  }
  function renderCoinsBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "Count the coins — each one is 100円.";
    const row = el("div", "story-coins-row");
    beat.options.forEach((amount) => {
      const n = Math.round(amount / 100);
      const btn = el("button", "story-coin-stack");
      btn.type = "button";
      btn.setAttribute("aria-label", n + " hundred-yen coin" + (n > 1 ? "s" : ""));
      btn.appendChild(coinStack(n));
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        if (amount !== beat.target) {   // wrong stack: count it out loud — the error teaches
          btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong");
          overlay.feedback.textContent = "Count them: " + HUNDREDS.slice(0, n).join("、") +
            " — that’s " + (COIN_JP[amount] || amount + "円") + ". Find " + (COIN_JP[beat.target] || beat.target + "円") + ".";
          overlay.feedback.className = "story-feedback try-again";
          return;
        }
        row.querySelectorAll(".story-coin-stack").forEach((node) => { node.disabled = true; if (node !== btn) node.classList.add("dimmed"); });
        btn.classList.add("correct");
        attachAnswer(beat, "Now say it:");
        overlay.feedback.textContent = (COIN_JP[beat.target] || "") + " — you counted it.";
        overlay.feedback.className = "story-feedback success";
        showContinue("Say it →", finishBeat);
      });
      row.appendChild(btn);
    });
    overlay.stage.appendChild(row);
  }

  // ---- claimPerson: choose yourself / choose your friend --------------------
  function renderClaimPersonBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "";
    // you can't be your own friend — each role excludes the other's pick
    const other = beat.role === "friend" ? story.inventory.avatar : story.inventory.friend;
    const taken = other ? other.id : null;
    const row = el("div", "story-people-row");
    PEOPLE.filter((p) => p.id !== taken).forEach((person) => {
      const btn = el("button", "story-person-choice");
      btn.type = "button";
      btn.setAttribute("aria-label", person.name);
      const fig = el("span", "obj obj-person");
      fig.innerHTML = OBJ_SVG[person.svg];
      btn.appendChild(fig);
      btn.addEventListener("click", () => {
        row.querySelectorAll(".story-person-choice").forEach((node) => node.classList.remove("selected"));
        btn.classList.add("selected");
        story.inventory[beat.role] = { id: person.id };
        saveStory();
        attachAnswer(beat, beat.askLabel || "Now say it:");
        overlay.feedback.textContent = beat.feedback || "";
        overlay.feedback.className = "story-feedback success";
        showContinue(beat.cta || "Continue →", finishBeat);
      });
      row.appendChild(btn);
    });
    overlay.stage.appendChild(row);
  }

  // ---- nameInput: type your friend's name — it sticks forever ---------------
  function renderNameInputBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "";
    const wrap = el("div", "story-name-wrap");
    wrap.appendChild(objectFigure("friendchar"));
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 12;
    input.placeholder = "Their name…";
    input.className = "story-name-input";
    input.value = story.friendName || "";
    const ok = el("button", "primary story-name-ok", "That's their name →");
    ok.type = "button";
    ok.addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      story.friendName = v;
      saveStory();
      wrap.querySelector(".obj-name")?.remove();
      const tag = el("i", "obj-name");
      tag.textContent = v;
      wrap.querySelector(".obj").appendChild(tag);
      attachAnswer(beat, "Now ask it out loud:");
      overlay.feedback.textContent = v + " it is.";
      overlay.feedback.className = "story-feedback success";
      showContinue("Say it →", finishBeat);
    });
    wrap.append(input, ok);
    overlay.stage.appendChild(wrap);
  }

  // ---- numberTap: tap each number, hear it, then say the run ----------------
  function renderNumberTapBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "Tap each number to hear it.";
    const row = el("div", "story-num-row");
    const doneSet = new Set();
    beat.nums.forEach(([digit, kana]) => {
      const btn = el("button", "story-num");
      btn.type = "button";
      btn.setAttribute("aria-label", String(digit));
      btn.appendChild(el("span", "num-digit", String(digit)));
      btn.appendChild(el("span", "num-kana", kana));
      btn.addEventListener("click", () => {
        btn.classList.add("heard");
        if (window.HanasouSpeak) window.HanasouSpeak(kana);
        if (!doneSet.has(digit)) {
          doneSet.add(digit);
          if (doneSet.size === beat.nums.length) {
            attachAnswer(beat, "All of them — now say the run:");
            overlay.feedback.textContent = "You heard every one.";
            overlay.feedback.className = "story-feedback success";
            showContinue("Say them →", finishBeat);
          }
        }
      });
      row.appendChild(btn);
    });
    overlay.stage.appendChild(row);
  }

  // ---- sounds: this lesson's new kana, tap to hear (the folded-in Words) ---
  function renderSoundsBeat(beat, finishBeat) {
    overlay.title.textContent = "New sounds today";
    overlay.copy.textContent = "Tap each one — もち子 says it. The abc stays over every kana until you know it.";
    const row = el("div", "story-num-row");
    const heard = new Set();
    beat.tiles.forEach(([kana, romaji]) => {
      const btn = el("button", "story-num");
      btn.type = "button";
      btn.setAttribute("aria-label", romaji || kana);
      btn.appendChild(el("span", "num-kana num-kana-above", romaji));
      btn.appendChild(el("span", "num-digit", kana));
      btn.addEventListener("click", () => {
        btn.classList.add("heard");
        if (window.HanasouSpeak) window.HanasouSpeak(kana);
        heard.add(kana);
        if (heard.size === beat.tiles.length) {
          story.soundsSeen[beat.lessonId] = true;
          saveStory();
          overlay.feedback.textContent = "That's all of today's sounds.";
          overlay.feedback.className = "story-feedback success";
          showContinue("Start →", finishBeat);
        }
      });
      row.appendChild(btn);
    });
    overlay.stage.appendChild(row);
  }

  // ---- build: assemble the sentence you missed, chip by chip ----------------
  function renderBuildBeat(beat, finishBeat) {
    overlay.title.textContent = "Rebuild this one";
    overlay.copy.textContent = "You missed it last time. Tap the words in order — then say it.";
    const line = el("div", "story-build-line");
    const bank = el("div", "story-build-bank");
    let nextIdx = 0, misses = 0;
    const chips = beat.words.map((w, i) => {
      const chip = el("button", "story-bchip", w.jp);
      chip.type = "button";
      chip.dataset.pos = String(i);
      chip.addEventListener("click", () => {
        if (chip.disabled) return;
        if (i !== nextIdx) {              // wrong order: shake; repeated misses point at the next chip
          chip.classList.remove("wrong"); void chip.offsetWidth; chip.classList.add("wrong");
          misses += 1;
          if (misses >= 2) {
            const hint = chips[nextIdx];
            hint.classList.remove("hint"); void hint.offsetWidth; hint.classList.add("hint");
          }
          return;
        }
        misses = 0;
        chip.disabled = true;
        chip.classList.add("placed");
        line.appendChild(el("span", "story-bword", w.jp));
        nextIdx += 1;
        if (nextIdx === beat.words.length) {
          attachAnswer(beat, "Rebuilt — now say it:");
          overlay.feedback.textContent = "That's the shape of it.";
          overlay.feedback.className = "story-feedback success";
          showContinue("Say it →", finishBeat);
        }
      });
      return chip;
    });
    chips.map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).forEach(([, c]) => bank.appendChild(c));
    overlay.stage.append(line, bank);
  }

  // ---- cardDemo: a working example card, walked through region by region.
  // Teaches subject → object → verb on a real sentence while showing how the
  // card itself is used. Everything but the focused region dims.
  function renderCardDemoBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction || "Here's a card";
    overlay.copy.textContent = "";
    const card = el("div", "demo-card");
    const rPrompt = el("div", "demo-region demo-prompt");
    rPrompt.append(el("span", "demo-label", "SAY THIS IN JAPANESE"), el("div", "demo-en", "I drink water."));
    const rAnswer = el("div", "demo-region demo-answer");
    rAnswer.appendChild(el("span", "demo-label", "MODEL ANSWER"));
    const jpLine = el("div", "demo-jp");
    const WORDS = [
      ["watashi wa", "わたしは", "s"],
      ["mizu o", "みずを", "o"],
      ["nomimasu", "のみます", "v"],
    ];
    for (const [rom, jp, role] of WORDS) {
      const wSpan = el("span", "demo-w demo-role-" + role);
      wSpan.append(el("i", "demo-rom", rom), document.createTextNode(jp));
      jpLine.appendChild(wSpan);
    }
    rAnswer.appendChild(jpLine);
    const rGrade = el("div", "demo-region demo-grade");
    rGrade.append(el("span", "", "← nope"), el("span", "demo-dot", "·"), el("span", "", "got it →"));
    card.append(rPrompt, rAnswer, rGrade);
    const bubble = el("div", "demo-bubble");
    overlay.stage.append(card, bubble);

    const STEPS = [
      { focus: [rPrompt], html: "The card asks in English. Say it in Japanese <b>out loud</b> first — then tap the card to check." },
      { focus: [rAnswer], html: "Tap and もち子 says the answer. The little letters ride above each kana until you know it — then they fade." },
      { focus: [rAnswer], role: "s", html: "<b>わたしは</b> — <i>I</i>. The one doing it comes first. は marks it (written ha, said <b>wa</b>)." },
      { focus: [rAnswer], role: "o", html: "<b>みずを</b> — <i>water</i>. The thing it happens to. を marks the object." },
      { focus: [rAnswer], role: "v", html: "<b>のみます</b> — <i>drink</i>. The verb comes <b>LAST</b>. Subject → object → verb, every time." },
      { focus: [rGrade], html: "Got it? Swipe right. Missed it? Swipe left and it comes back sooner. No streaks, no timers." },
    ];
    let step = 0;
    const show = () => {
      const st = STEPS[step];
      [rPrompt, rAnswer, rGrade].forEach((r) => r.classList.toggle("demo-dim", !st.focus.includes(r)));
      jpLine.querySelectorAll(".demo-w").forEach((wEl) => {
        wEl.classList.toggle("demo-lit", !!st.role && wEl.classList.contains("demo-role-" + st.role));
        wEl.classList.toggle("demo-faded", !!st.role && !wEl.classList.contains("demo-role-" + st.role));
      });
      bubble.innerHTML = st.html;
      showContinue(step < STEPS.length - 1 ? "Next →" : "Continue →", () => {
        if (step < STEPS.length - 1) { step += 1; show(); }
        else finishBeat();
      });
    };
    show();
  }

  // ---- info: onboarding panels — no interaction, just orientation ----------
  function renderInfoBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = beat.copy || "";
    overlay.stage.hidden = !beat.art;   // text-only panels: no empty scene box
    if (beat.art) {
      const stageArt = el("div", "story-info-art");
      stageArt.appendChild(objectFigure(beat.art));
      overlay.stage.appendChild(stageArt);
    }
    showContinue(beat.cta || "Next →", finishBeat);
  }

  function renderPickBeat(beat, finishBeat) {
    overlay.title.textContent = beat.instruction;
    overlay.copy.textContent = "Same thing, different size — the adjective is the difference.";
    const row = el("div", "story-pick-row");
    const wordFor = {};
    beat.options.forEach((opt) => { wordFor[opt.mod] = opt.jp; });
    beat.options.forEach((opt) => {
      const btn = objButton(beat.kind, null, opt.jp + " " + OBJ_NAME[beat.kind]);
      btn.classList.add("pick-" + opt.mod);
      btn.dataset.mod = opt.mod;
      row.appendChild(btn);
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        if (opt.mod !== beat.target) {   // wrong size: teach the opposite word
          btn.classList.remove("wrong");
          void btn.offsetWidth;
          btn.classList.add("wrong");
          overlay.feedback.textContent = "That one is " + opt.jp + " (" + opt.mod + "). You want the " +
            wordFor[beat.target] + " (" + beat.target + ") one.";
          overlay.feedback.className = "story-feedback try-again";
          return;
        }
        row.querySelectorAll(".story-obj").forEach((node) => {
          node.disabled = true;
          if (node !== btn) node.classList.add("dimmed");
        });
        btn.classList.add("correct");
        attachAnswer(beat, wordFor[beat.target] + " — now say it:");
        overlay.feedback.textContent = "That's the one!";
        overlay.feedback.className = "story-feedback success";
        showContinue("Say it →", finishBeat);
      });
    });
    overlay.stage.appendChild(row);
  }

    // Block Space/Enter (and any key) from reaching the drill's reveal handler
  // while a beat is open — buttons inside the beat still get their key events.
  document.addEventListener("keydown", (event) => {
    if (!overlayOpen) return;
    if (event.target && event.target.closest && event.target.closest("#story-break")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  // ---- Hooks called by app.js at the drill's natural seams -----------------
  window.HanasouStory = {
    // A new drill session started — reset the per-run "already shown" set so
    // replayable beats reappear on a fresh run.
    onSession: function (_mode, _lessonId, _build) {
      if (overlayOpen) closeOverlay();
      shownThisSession.clear();
      builtThisSession = false;
    },
    // After a successful self-grade. Returns true if it takes over the flow
    // (it will call `done` when the learner finishes); false to advance now.
    afterGrade: function (info, done) {
      if (!info || info.mode !== "lesson" || info.build || info.drive) return false;   // 🚗 drive = flashcards only
      const beat = resolveBeat(AFTER_PROMPT, info.lessonId, info.en);
      if (shouldSkip(beat)) return false;
      return openBeat(beat, done);
    },
    // Before a matching card is acted on. Overlays the just-rendered card;
    // dismissing reveals the intact card underneath.
    beforeCard: function (info) {
      if (!info || info.mode !== "lesson" || info.build || info.drive) return false;   // 🚗 drive = flashcards only
      let beat = resolveBeat(BEFORE_PROMPT, info.lessonId, info.en);
      if (shouldSkip(beat)) beat = null;
      // Build-as-repair (owner: Build is folded into the flow, 2026-07): a
      // sentence you MISSED last time comes back as an assemble-it-first
      // puzzle, then the untouched speaking card. Never on first sight, never
      // on warmup rides, at most one per session.
      if (!beat && !info.warmup && info.lastGrade !== null && info.lastGrade <= 1 &&
          info.words && info.words.length >= 3 && !builtThisSession) {
        builtThisSession = true;
        beat = { id: "build:" + info.jp, type: "build",
          words: info.words, answer: { jp: info.jp, romaji: info.romaji, en: info.en } };
      }
      // Folded-in alphabet (owner: the Words section is gone, 2026-07): the
      // first time a Level 0 lesson runs, its NEW sounds appear as tap-to-hear
      // tiles before the first card. Romaji-over-kana handles "during";
      // this is the "before".
      if (/^l0-/.test(info.lessonId) && !story.soundsSeen[info.lessonId] &&
          window.__hanaNewKana) {
        const tiles = window.__hanaNewKana(info.lessonId);
        if (tiles.length) {
          const soundsBeat = { id: "sounds:" + info.lessonId, type: "sounds",
            lessonId: info.lessonId, tiles: tiles };
          if (beat && beat.id === "tour-1") {
            // very first lesson: welcome tour FIRST, then today's letters
            soundsBeat.next = HOUSE_BEAT;
            beat = chainBeats(TOUR_PANELS, soundsBeat);
          } else {
            soundsBeat.next = beat || undefined;
            beat = soundsBeat;
          }
        }
      }
      if (!beat) return false;
      return openBeat(beat, null);
    },
    // Dev helper: clear ONLY the story inventory (not lesson/SRS progress).
    getState: () => JSON.parse(JSON.stringify(story)),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} window.location.reload(); },
  };
})();
