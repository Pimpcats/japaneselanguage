// Hanasou interactive visual-learning breaks.
//
// A modular add-on that sits BESIDE app.js — it never touches the sentence
// engine, SRS, audio, or word cards. app.js calls three optional hooks
// (window.HanasouStory.onSession / afterGrade / beforeCard) at the natural
// seams of the drill; this module renders short, touch-friendly story moments
// as a full-screen overlay and remembers objects the learner claims.
//
// Its whole state lives under one localStorage key (hanasou.story.v1), separate
// from lesson/SRS progress, so it can be reset or removed without side effects.
(function () {
  "use strict";

  const STORAGE_KEY = "hanasou.story.v1";

  const BOOKS = [
    { id: "circle", name: "circle cover" },
    { id: "stripes", name: "striped cover" },
    { id: "window", name: "window cover" },
  ];

  // Data-driven story beats keyed by a card's English prompt. Future items
  // (umbrella, bag, ticket, drink…) slot in here without touching app.js.
  const AFTER_PROMPT = {
    "This is a book.": { id: "claim-book", type: "claim", item: "book", once: true },
    "That over there is my bag.": { id: "place-book", type: "place", item: "book" },
  };
  // The action IS the answer: picking your book sets up the exact sentence the
  // learner then produces. Keyed on the card whose Japanese the act yields.
  const BEFORE_PROMPT = {
    "This is my book.": {
      id: "answer-my-book", type: "identify", item: "book",
      ask: { jp: "どれが あなたの ほんですか？", romaji: "dore ga anata no hon desu ka", en: "Which one is your book?" },
      answer: { jp: "これは わたしの ほんです。", romaji: "kore wa watashi no hon desu", en: "This is my book." },
    },
  };

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

  function buildOverlay() {
    const root = document.createElement("section");
    root.id = "story-break";
    root.className = "story-break";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");

    const panel = document.createElement("div");
    panel.className = "story-panel";

    const kicker = document.createElement("div");
    kicker.className = "story-kicker";
    kicker.textContent = "Your story";

    const title = document.createElement("h2");
    title.className = "story-title";

    const copy = document.createElement("p");
    copy.className = "story-copy";

    const stage = document.createElement("div");
    stage.className = "story-stage";

    const feedback = document.createElement("p");
    feedback.className = "story-feedback";
    feedback.setAttribute("role", "status");

    const actions = document.createElement("div");
    actions.className = "story-actions";
    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "primary story-continue";
    continueBtn.textContent = "Continue →";
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
    overlay.root.hidden = false;
    overlay.root.className = "story-break open story-" + beat.type;
    overlay.stage.className = "story-stage story-stage-" + beat.type;
    overlay.stage.innerHTML = "";
    overlay.feedback.textContent = "";
    overlay.feedback.className = "story-feedback";
    overlay.continueBtn.hidden = true;
    overlay.continueBtn.disabled = false;
    overlay.continueBtn.onclick = null;
    overlay.root.scrollTop = 0;

    const finishBeat = () => {
      markBeatDone(beat);
      closeOverlay();
      if (typeof onDone === "function") onDone();
    };

    if (beat.type === "claim") renderClaimBeat(beat, finishBeat);
    else if (beat.type === "place") renderPlaceBeat(beat, finishBeat);
    else if (beat.type === "identify") renderIdentifyBeat(beat, finishBeat);
    return true;
  }

  function bookButton(book, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "story-book " + (className || "");
    button.dataset.design = book.id;
    button.setAttribute("aria-label", book.name + " book");
    const cover = document.createElement("span");
    cover.className = "story-book-cover";
    const mark = document.createElement("i");
    mark.className = "story-book-mark";
    const pages = document.createElement("i");
    pages.className = "story-book-pages";
    cover.append(mark, pages);
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
  function showContinue(text, finishBeat) {
    overlay.continueBtn.textContent = text || "Continue →";
    overlay.continueBtn.hidden = false;
    overlay.continueBtn.onclick = finishBeat;
    requestAnimationFrame(() => { try { overlay.continueBtn.focus({ preventScroll: true }); } catch {} });
  }

  function renderClaimBeat(_beat, finishBeat) {
    overlay.title.textContent = "Choose your book";
    overlay.copy.textContent = "Pick one cover. The app remembers it and brings it back in later scenes.";
    const shelf = document.createElement("div");
    shelf.className = "story-book-row story-choice-row";
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

  function renderPlaceBeat(_beat, finishBeat) {
    const book = ensureBook();
    overlay.title.textContent = "Put your book on the desk";
    overlay.copy.textContent = "Drag your book onto a space — or just tap the space where you want it.";
    const desk = document.createElement("div");
    desk.className = "story-desk";
    const slots = [];
    for (let index = 0; index < 3; index += 1) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "story-slot";
      slot.dataset.slot = String(index);
      slot.setAttribute("aria-label", ["left", "middle", "right"][index] + " side of desk");
      desk.appendChild(slot);
      slots.push(slot);
    }
    const tray = document.createElement("div");
    tray.className = "story-tray";
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

  function sentenceBlock(cls, label, sentence) {
    const box = document.createElement("div");
    box.className = cls;
    if (label) box.appendChild(span2("story-line-label", label));
    box.appendChild(span2("story-line-jp", sentence.jp));
    if (sentence.romaji) box.appendChild(span2("story-line-romaji", sentence.romaji));
    if (sentence.en) box.appendChild(span2("story-line-en", sentence.en));
    return box;
  }
  function span2(cls, text) {
    const s = document.createElement("span");
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function renderIdentifyBeat(beat, finishBeat) {
    const chosen = ensureBook();
    const chosenSlot = Number.isInteger(story.inventory.book.slot) ? story.inventory.book.slot : 1;
    const ask = beat.ask || { en: "Which one is your book?", jp: "", romaji: "" };
    overlay.title.textContent = ask.en;
    overlay.copy.textContent = "Tap the book you chose earlier — that answers the question.";
    // The question the learner is answering, heard/read (not produced here).
    if (ask.jp) overlay.stage.appendChild(sentenceBlock("story-ask", "もち子 asks", ask));

    const row = document.createElement("div");
    row.className = "story-book-row story-identify-row";
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
        // The act IS the answer — attach the exact sentence to say next.
        if (beat.answer && !overlay.stage.querySelector(".story-answer")) {
          overlay.stage.appendChild(sentenceBlock("story-answer", "Now say it:", beat.answer));
        }
        overlay.feedback.textContent = "That's your book!";
        overlay.feedback.className = "story-feedback success";
        showContinue("Say it →", finishBeat);
      });
      row.appendChild(button);
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
    // replayable beats (place / identify) reappear on a fresh run.
    onSession: function (_mode, _lessonId, _build) {
      if (overlayOpen) closeOverlay();
      shownThisSession.clear();
    },
    // After a successful self-grade. Returns true if it takes over the flow
    // (it will call `done` when the learner finishes); false to advance now.
    afterGrade: function (info, done) {
      if (!info || info.mode !== "lesson" || info.build) return false;
      const beat = AFTER_PROMPT[normalize(info.en)];
      if (shouldSkip(beat)) return false;
      return openBeat(beat, done);
    },
    // Before a matching card is acted on. Overlays the just-rendered card;
    // dismissing reveals the intact card underneath.
    beforeCard: function (info) {
      if (!info || info.mode !== "lesson" || info.build) return false;
      const beat = BEFORE_PROMPT[normalize(info.en)];
      if (shouldSkip(beat)) return false;
      return openBeat(beat, null);
    },
    // Dev helper: clear ONLY the story inventory (not lesson/SRS progress).
    getState: () => JSON.parse(JSON.stringify(story)),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} window.location.reload(); },
  };
})();
