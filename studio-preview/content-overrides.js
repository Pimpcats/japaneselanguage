// Speaking Studio-only language QA corrections.
// Keep the legacy Hanasou curriculum untouched; apply natural spoken forms
// only inside this preview, before app.js builds its lesson cards.
(function () {
  "use strict";
  const lessons = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const lesson = (id) => lessons.find((item) => item.id === id);
  const updateSentence = (lessonId, english, updates) => {
    const item = lesson(lessonId);
    const sentence = item && (item.sentences || []).find((entry) => entry.en === english);
    if (sentence) Object.assign(sentence, updates);
  };
  const addVocab = (lessonId, word) => {
    const item = lesson(lessonId);
    if (item && !(item.vocab || []).some((entry) => entry.jp === word.jp)) item.vocab.push(word);
  };

  const canDo = lesson("can-do");
  if (canDo) {
    canDo.grammarNote = "できます means “can do / be able to” for activities such as cooking or driving. For speaking a language, はなせます is the natural everyday verb: にほんごが はなせます = “I can speak Japanese.”";
    addVocab("can-do", { jp: "はなせます", romaji: "hanasemasu", en: "can speak", pos: "v" });
  }
  updateSentence("can-do", "I can (speak) Japanese.", {
    en: "I can speak Japanese.",
    jp: "にほんごが はなせます。",
    romaji: "nihongo ga hanasemasu.",
    words: [
      { jp: "にほんご", en: "Japanese", pos: "n" },
      { jp: "が", en: "[subject]", pos: "prt" },
      { jp: "はなせます", en: "can speak", pos: "v" }
    ]
  });
  updateSentence("can-do", "I can speak a little English.", {
    jp: "えいごが すこし はなせます。",
    romaji: "eigo ga sukoshi hanasemasu.",
    words: [
      { jp: "えいご", en: "English", pos: "n" },
      { jp: "が", en: "[subject]", pos: "prt" },
      { jp: "すこし", en: "a little", pos: "adv" },
      { jp: "はなせます", en: "can speak", pos: "v" }
    ]
  });

  addVocab("but-kedo", { jp: "したい", romaji: "shitai", en: "want to do", pos: "v" });
  updateSentence("but-kedo", "I want to, but there's no time.", {
    jp: "したいけど、じかんが ない。",
    romaji: "shitai kedo, jikan ga nai.",
    words: [
      { jp: "したい", en: "want to do", pos: "v" },
      { jp: "けど", en: "but", pos: "conj" },
      { jp: "じかん", en: "time", pos: "n" },
      { jp: "が", en: "[subject]", pos: "prt" },
      { jp: "ない", en: "there isn't", pos: "adj" }
    ]
  });

  updateSentence("does-this-go", "Is Shibuya this platform?", {
    en: "Is this the platform for Shibuya?",
    jp: "しぶやいきは この ホームですか？",
    romaji: "shibuya-iki wa kono hoomu desu ka?",
    words: [
      { jp: "しぶや", en: "Shibuya", pos: "n" },
      { jp: "いき", en: "bound for", pos: "expr" },
      { jp: "は", en: "[topic]", pos: "prt" },
      { jp: "この", en: "this", pos: "adj" },
      { jp: "ホーム", en: "platform", pos: "n" },
      { jp: "です", en: "is", pos: "cop" },
      { jp: "か", en: "[?]", pos: "prt" }
    ]
  });

  updateSentence("ni-oite", "Opinions were exchanged at the meeting.", {
    en: "Opinions were expressed at the meeting."
  });
  updateSentence("ni-oite", "Please take care on your departure.", {
    en: "Please be careful when setting out."
  });
})();
