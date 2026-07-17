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

  // ---- the learner's claimable items ---------------------------------------
  const BOOKS = [
    { id: "circle", name: "circle cover" },
    { id: "stripes", name: "striped cover" },
    { id: "window", name: "window cover" },
  ];

  // ---- object library (all CSS-drawn; people use the app's chibi art) ------
  const OBJ_NAME = { book: "book", bag: "bag", clock: "clock", cup: "tea", water: "water", coffee: "coffee", mystery: "mystery bundle", wc: "restroom sign", station: "station", friend: "friend", mochiko: "もち子", menu: "menu", sushi: "sushi", car: "car", house: "house" };
  const OBJ_JP = { book: "ほん", bag: "かばん", clock: "とけい", cup: "おちゃ", water: "みず", coffee: "コーヒー", wc: "トイレ", station: "えき", friend: "ともだち", menu: "メニュー", sushi: "おすし", car: "くるま", house: "いえ" };

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

  const BEFORE_PROMPT = {
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

    // ---- Numbers & age -------------------------------------------------------
    "numbers": {
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

  // ---- object factory (spans inside buttons; all CSS-drawn) -----------------
  function objectFigure(kind) {
    const fig = el("span", "obj obj-" + kind);
    fig.setAttribute("aria-hidden", "true");
    if (kind === "book") {
      const design = (story.inventory.book && story.inventory.book.design) || "circle";
      fig.dataset.design = design;
      fig.append(el("i", "obj-book-mark"), el("i", "obj-book-pages"));
    } else if (kind === "bag") {
      fig.append(el("i", "bag-handle"), el("i", "bag-body"), el("i", "bag-clasp"));
    } else if (kind === "clock") {
      fig.append(el("i", "clock-face"), el("i", "clock-hand-h"), el("i", "clock-hand-m"));
    } else if (kind === "cup") {
      fig.append(el("i", "cup-steam"), el("i", "cup-body"), el("i", "cup-saucer"));
    } else if (kind === "water") {
      fig.append(el("i", "bottle-cap"), el("i", "bottle-body"), el("i", "bottle-label"));
    } else if (kind === "coffee") {
      fig.append(el("i", "cup-steam"), el("i", "coffee-body"), el("i", "cup-saucer"));
    } else if (kind === "mystery") {
      fig.append(el("i", "mystery-lump"), el("i", "mystery-knot"), el("i", "mystery-q"));
    } else if (kind === "wc") {
      fig.append(el("i", "wc-board"), el("i", "wc-pole"));
    } else if (kind === "station") {
      fig.append(el("i", "st-body"), el("i", "st-door"), el("i", "st-sign"));
    } else if (kind === "menu") {
      fig.append(el("i", "menu-board"), el("i", "menu-lines"));
    } else if (kind === "sushi") {
      fig.append(el("i", "sushi-rice"), el("i", "sushi-top"), el("i", "sushi-nori"));
    } else if (kind === "car") {
      fig.append(el("i", "car-body"), el("i", "car-window"), el("i", "car-wheel car-wheel-a"), el("i", "car-wheel car-wheel-b"));
    } else if (kind === "house") {
      fig.append(el("i", "house-roof"), el("i", "house-body"), el("i", "house-door"));
    } else if (kind === "friend" || kind === "mochiko") {
      const img = document.createElement("img");
      img.className = "obj-person-img";
      img.src = kind === "friend" ? "assets/chibi_cheer.png" : "assets/chibi_think.png";
      img.alt = "";
      fig.appendChild(img);
    }
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
    const target = objButton(beat.object, beat.zone, (beat.tag ? "price tag on the " : "") + OBJ_NAME[beat.object]);
    if (beat.tag) { const t = el("i", "obj-tag"); t.appendChild(el("span", "obj-tag-txt", beat.tagText || "?")); target.appendChild(t); }

    if (beat.scene === "shop") {
      scene.appendChild(mochikoImg("assets/chibi_cheer.png", "scene-mochiko scene-mochiko-shop"));
      const counterZone = el("div", "scene-zone scene-zone-counter");
      counterZone.appendChild(target);
      scene.appendChild(counterZone);
    } else if (beat.zone === "partner") {
      const partnerZone = el("div", "scene-zone scene-zone-partner");
      // If もち子 herself is the one you're asking, she IS the tappable.
      if (beat.object !== "mochiko") partnerZone.appendChild(mochikoImg("assets/chibi_think.png"));
      partnerZone.appendChild(target);
      scene.appendChild(partnerZone);
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
      overlay.feedback.textContent = "Hmm… time to ask.";
      overlay.feedback.className = "story-feedback success";
      showContinue("Ask →", finishBeat);
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
      const beat = resolveBeat(BEFORE_PROMPT, info.lessonId, info.en);
      if (shouldSkip(beat)) return false;
      return openBeat(beat, null);
    },
    // Dev helper: clear ONLY the story inventory (not lesson/SRS progress).
    getState: () => JSON.parse(JSON.stringify(story)),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} window.location.reload(); },
  };
})();
