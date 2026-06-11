// はなそう theme preview — additive behaviour only. Adds the floating Kōhai
// helper that reacts to grading + screen changes. Touches nothing in app.js;
// it only listens to the DOM the real app already renders.
(() => {
  "use strict";
  const A = "assets/"; // resolved against <base href="../"> → repo root

  const POSES = {
    idle:  ["chibi_think.png",  "がんばろう！|Ganbarou!"],
    happy: ["chibi_thumbs.png", "いいね！|Ii ne!"],
    cheer: ["chibi_cheer.png",  "すごーい！|Sugoi!"],
    sad:   ["chibi_cry.png",    "つぎはできるよ！|Tsugi wa dekiru yo!"],
    think: ["chibi_think.png",  "きいてみて！|Kiite mite!"],
  };

  // build the helper
  const helper = document.createElement("div");
  helper.id = "kohai-helper";
  const bubble = document.createElement("div");
  bubble.className = "kh-bubble";
  const img = document.createElement("img");
  img.alt = "Kōhai";
  helper.append(bubble, img);
  document.body.appendChild(helper);

  // painted sign + awning header on the home screen (real app only fills
  // child containers of #home, so a prepended banner survives re-renders)
  const home = document.getElementById("home");
  if (home && !document.getElementById("home-banner")) {
    const banner = document.createElement("div");
    banner.id = "home-banner";
    banner.innerHTML =
      '<div class="hb-sign"><img src="' + A + 'sign.png" alt=""><span>はなそう！</span></div>' +
      '<img class="hb-awning" src="' + A + 'awning.png" alt="">';
    home.prepend(banner);
  }

  // Hidden by default so she never covers controls; she pops in to react to a
  // grade, then fades out on her own.
  helper.style.opacity = "0";
  let hideTimer = null;
  function react(pose) {
    const [file, say] = POSES[pose] || POSES.idle;
    const [jp, rj] = say.split("|");
    img.src = A + file;
    bubble.innerHTML = jp + '<span class="romaji">' + rj + "</span>";
    helper.classList.remove("pop"); void helper.offsetWidth; helper.classList.add("pop");
    helper.style.opacity = "1";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { helper.style.opacity = "0"; }, 3000);
  }

  // grade buttons → mood. nope=0 sad, kinda=1 think, got=2 cheer
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-grade]");
    if (g) react(["sad", "think", "cheer"][+g.dataset.grade] || "happy");
  });
})();
