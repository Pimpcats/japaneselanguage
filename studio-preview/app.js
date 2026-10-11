(function () {
  "use strict";
  const STORE = "hanasou.studio.v1";
  const $ = (id) => document.getElementById(id);
  const allLessons = Array.isArray(window.LESSONS) ? window.LESSONS : [];
  const levels = Array.isArray(window.LEVELS) ? window.LEVELS : [];
  const allCards = allLessons.flatMap((lesson) => (lesson.sentences || []).map((sentence, index) => ({
    id: lesson.id + "#" + index, lessonId: lesson.id, lessonTitle: lesson.title,
    section: lesson.section || "", grammar: lesson.grammar || "", grammarNote: lesson.grammarNote || "",
    level: lesson.id.startsWith("l0") ? "FIRST SOUNDS" : "FOUNDATIONS", sentence
  }))).filter((card) => card.sentence && card.sentence.en && card.sentence.jp);
  const transforms = [
    { id:"t-past-sushi", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I ate sushi yesterday.", sourceEnglish:"I eat sushi.", sourceJp:"すしを たべます。", target:"きのう、すしを たべました。", note:"Add きのう (yesterday) and change たべます to たべました for the past." },
    { id:"t-past-station", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I went to the station yesterday.", sourceEnglish:"I go to the station.", sourceJp:"えきに いきます。", target:"きのう、えきに いきました。", note:"Keep に for the destination; change いきます to いきました." },
    { id:"t-negative-coffee", lessonId:"negative", section:"NEGATIVE", prompt:"Say: I don't drink coffee.", sourceEnglish:"I drink coffee.", sourceJp:"コーヒーを のみます。", target:"コーヒーを のみません。", note:"For polite negative, change the verb ending from ます to ません." },
    { id:"t-past-negative", lessonId:"past-negative", section:"PAST NEGATIVE", prompt:"Say: I didn't eat breakfast.", sourceEnglish:"I eat breakfast.", sourceJp:"あさごはんを たべます。", target:"あさごはんを たべませんでした。", note:"Past negative uses ませんでした." },
    { id:"t-past-ticket", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I bought a ticket.", sourceEnglish:"I buy a ticket.", sourceJp:"きっぷを かいます。", target:"きっぷを かいました。", note:"かいます becomes かいました in the polite past." },
    { id:"t-past-water", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I drank water.", sourceEnglish:"I drink water.", sourceJp:"みずを のみます。", target:"みずを のみました。", note:"のみます becomes のみました in the polite past." },
    { id:"t-past-movie", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I watched a movie.", sourceEnglish:"I watch a movie.", sourceJp:"えいがを みます。", target:"えいがを みました。", note:"みます becomes みました in the polite past." },
    { id:"t-past-live", lessonId:"past-1", section:"PAST TENSE", prompt:"Say: I lived in Tokyo.", sourceEnglish:"I live in Tokyo.", sourceJp:"とうきょうに すんでいます。", target:"とうきょうに すんでいました。", note:"For the past state, います changes to いました." }
  ];
  const conversations = [
    { id:"hello", title:"First meeting", level:"L0", place:"MEETING SOMEONE", turns:[
      { speaker:"A new friend", jp:"こんにちは！", en:"Hello!", choices:[{jp:"こんにちは！",en:"Hello!",correct:true,replyJp:"こんにちは。はじめまして！",replyEn:"Hello. Nice to meet you!"},{jp:"さようなら。",en:"Goodbye.",replyJp:"あれ、もう かえるんですか？",replyEn:"Oh, are you leaving already?"},{jp:"みず。",en:"Water.",replyJp:"みずが ほしいんですか？",replyEn:"Would you like some water?"}] },
      { speaker:"Your new friend", jp:"はじめまして。", en:"Nice to meet you.", choices:[{jp:"はじめまして。",en:"Nice to meet you.",correct:true,replyJp:"よろしく おねがいします！",replyEn:"It's a pleasure!"},{jp:"おやすみなさい。",en:"Good night.",replyJp:"まだ ひるですよ！",replyEn:"It's still daytime!"}] },
      { speaker:"Your new friend", jp:"おなまえは？", en:"What's your name?", choices:[{jp:"わたしは ___ です。",en:"I'm ___.",correct:true,replyJp:"よろしく おねがいします。",replyEn:"Nice to meet you."},{jp:"コーヒーを のみます。",en:"I drink coffee.",replyJp:"コーヒーが すきなんですね。",replyEn:"So you like coffee."}] }
    ]},
    { id:"cafe", title:"At the café", level:"L1", place:"ORDERING", turns:[
      {speaker:"Staff",jp:"いらっしゃいませ。",en:"Welcome.",choices:[{jp:"こんにちは。",en:"Hello.",correct:true,replyJp:"ごちゅうもんは？",replyEn:"What would you like to order?"},{jp:"さようなら。",en:"Goodbye.",replyJp:"あ、もう おかえりですか？",replyEn:"Oh, are you leaving already?"}]},
      {speaker:"Staff",jp:"なにを のみますか？",en:"What would you like to drink?",choices:[{jp:"コーヒーを ください。",en:"Coffee, please.",correct:true,replyJp:"はい、コーヒーですね。",replyEn:"Certainly, one coffee."},{jp:"えきに いきます。",en:"I go to the station.",replyJp:"えきは あちらですよ。",replyEn:"The station is over there."},{jp:"みずを のみません。",en:"I don't drink water.",replyJp:"そうですか。",replyEn:"I see."}]},
      {speaker:"Staff",jp:"ほかに なにか？",en:"Anything else?",choices:[{jp:"だいじょうぶです。",en:"I'm all set, thanks.",correct:true,replyJp:"かしこまりました。",replyEn:"Certainly."},{jp:"きのう たべました。",en:"I ate yesterday.",replyJp:"そうなんですね。",replyEn:"Oh, I see."}]}
    ]},
    { id:"station", title:"Finding the station", level:"L1", place:"GETTING AROUND", turns:[
      {speaker:"Local person",jp:"どうしましたか？",en:"What's wrong?",choices:[{jp:"えきは どこですか？",en:"Where is the station?",correct:true,replyJp:"まっすぐ いって みぎです。",replyEn:"Go straight, then turn right."},{jp:"コーヒーを ください。",en:"Coffee, please.",replyJp:"カフェなら あちらです。",replyEn:"The café is over there."}]},
      {speaker:"Local person",jp:"わかりましたか？",en:"Did you understand?",choices:[{jp:"はい、ありがとうございます。",en:"Yes, thank you.",correct:true,replyJp:"どういたしまして。",replyEn:"You're welcome."},{jp:"おはようございます。",en:"Good morning.",replyJp:"おはようございます。",replyEn:"Good morning."}]}
    ]}
  ];
  const routeModes = ["recall","listen","patterns","scenes"];
  const routeLabels = {recall:"Recall",listen:"Listen & notice",patterns:"Pattern lab",scenes:"In the moment"};
  const routeDescriptions = {recall:"Try it from memory.",listen:"Hear it, catch the meaning.",patterns:"Change the sentence.",scenes:"Choose what to say next."};
  const defaults = { cards:{}, total:0, wins:0, daily:{}, settings:{goal:10,romaji:"auto"}, history:[], lessonDone:{}, lessonAttempts:{}, routeStep:0 };
  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(STORE)||"{}"));}catch(_){return Object.assign({},defaults);}}
  const state=load(); state.cards=state.cards||{};state.daily=state.daily||{};state.history=state.history||[];state.lessonDone=state.lessonDone||{};state.lessonAttempts=state.lessonAttempts||{};state.routeStep=Number.isInteger(state.routeStep)?((state.routeStep%4)+4)%4:0;state.settings=Object.assign({},defaults.settings,state.settings||{});
  const dayKey=()=>new Date().toLocaleDateString("en-CA");
  const today=()=>state.daily[dayKey()]||{attempts:0,wins:0};
  function save(){localStorage.setItem(STORE,JSON.stringify(state));renderStats();renderCourse();renderRoute();renderRoute();}
  let mode="recall",queue=[],queueIndex=0,current=null,revealed=false,sessionAttempts=0,sessionFinished=false,lessonId=null,conversationIndex=0,conversationTurn=0,conversationLocked=false,conversationLastCorrect=false,listenAnswered=false;
  let manifest=null,audioPlayer=null;
  const views=["home-view","practice-view","settings-view"];
  function showView(id){views.forEach(v=>$(v).classList.toggle("active",v===id));window.scrollTo({top:0,behavior:"smooth"});}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function playJapanese(jp,slow){
    if(!jp)return;
    const clip=manifest&&manifest.clips&&manifest.clips[jp];
    const file=clip&&(slow&&clip.s?clip.s:clip.n);
    if(file){audioPlayer=new Audio("../audio/"+file);audioPlayer.playbackRate=slow?.82:1;audioPlayer.play().catch(()=>browserSpeak(jp,slow));}
    else browserSpeak(jp,slow);
  }
  function speak(jp,slow){
    if(!jp)return;
    if(audioPlayer){audioPlayer.pause();audioPlayer=null;}
    if(manifest){playJapanese(jp,slow);return;}
    manifestReady.then(()=>playJapanese(jp,slow)).catch(()=>browserSpeak(jp,slow));
  }
  function browserSpeak(jp,slow){if(!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(jp.replace(/\[[^\]]*\]/g,""));u.lang="ja-JP";u.rate=slow?.78:.92;const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang&&v.lang.toLowerCase().startsWith("ja"))||null;window.speechSynthesis.speak(u);}
  const manifestReady=fetch("../audio/manifest.json").then(r=>r.ok?r.json():null).then(m=>{manifest=m;return m;});
  function renderRoute(){
    const host=$("route-nodes");if(!host)return;host.innerHTML="";
    const step=state.routeStep%routeModes.length;
    $("route-step-count").textContent="STOP "+(step+1)+" OF "+routeModes.length;
    routeModes.forEach((routeMode,index)=>{
      const b=document.createElement("button");b.type="button";b.className="route-node"+(index===step?" is-next":"");
      b.setAttribute("aria-label",(index===step?"Start here: ":"Practice ")+routeLabels[routeMode]);
      b.innerHTML='<span class="route-node-top"><span class="route-node-number">'+String(index+1).padStart(2,"0")+'</span><span class="route-node-state">'+(index===step?"START HERE":index<step?"UP NEXT":"ON THE PATH")+'</span></span><span class="route-node-icon">'+({recall:"↗",listen:"◖))",patterns:"＋",scenes:"↔"}[routeMode])+'</span><strong>'+routeLabels[routeMode]+'</strong><span class="route-node-description">'+routeDescriptions[routeMode]+'</span><span class="route-node-action">'+(index===step?"Begin this stop":"Go to this practice")+' →</span>';
      b.addEventListener("click",()=>start(routeMode));host.appendChild(b);
    });
  }
  function startGuidedPath(){start(routeModes[state.routeStep%routeModes.length]);}
  function advanceGuidedPath(){state.routeStep=(state.routeStep+1)%routeModes.length;localStorage.setItem(STORE,JSON.stringify(state));renderRoute();}
  function levelForLesson(l){if(l.id.startsWith("l0"))return 0;const s=l.section||"";if(["First Contact","Getting Things","Doing Things","Daily Life","The Past","Wants & Plans","Describing Things"].includes(s))return 1;if(["The て-form","Linking Ideas"].includes(s))return 2;if(["Finding Your Way","Tickets & Trouble"].includes(s))return 3;if(["Talking Casually","Reacting & Relating"].includes(s))return 4;if(["If & Necessity","Plans & Impressions"].includes(s))return 5;if(["Things Happen to You","Explaining & Nuance"].includes(s))return 6;if(["Keigo & Politeness","Native Connectives"].includes(s))return 7;return 1;}
  const lessonCards=(id)=>allCards.filter(c=>c.lessonId===id);
  const lessonComplete=(l)=>{const cards=lessonCards(l.id);return cards.length>0&&cards.every(c=>state.cards[c.id]&&state.cards[c.id].reps>0);};
  function unlockedLevel(){let max=0;for(let n=0;n<levels.length-1;n++){const ls=allLessons.filter(l=>levelForLesson(l)===n);if(ls.length&&ls.every(lessonComplete))max=n+1;else break;}return max;}
  function isLessonUnlocked(l){const n=levelForLesson(l),u=unlockedLevel();if(n<u)return true;if(n>u)return false;const inLevel=allLessons.filter(x=>levelForLesson(x)===n);const i=inLevel.findIndex(x=>x.id===l.id);return i<=0||inLevel.slice(0,i).every(lessonComplete);}
  function renderCourse(){
    const host=$("course-levels");if(!host)return;host.innerHTML="";const unlocked=unlockedLevel();
    levels.forEach((lv,idx)=>{const ls=allLessons.filter(l=>levelForLesson(l)===idx);const done=ls.filter(lessonComplete).length;const open=idx<=unlocked;const card=document.createElement("div");card.className="course-level"+(open?"":" locked")+(done===ls.length&&ls.length?" completed":"");
      card.innerHTML='<div class="course-level-top"><span class="course-index">'+esc(lv.name)+'</span><span class="course-status">'+(done===ls.length&&ls.length?"COMPLETE":open?"IN PROGRESS":"LOCKED")+'</span></div><h3>'+esc(lv.title)+'</h3><p>'+esc(lv.blurb)+'</p><div class="course-progress"><i style="width:'+(ls.length?done/ls.length*100:0)+'%"></i></div><div class="course-count">'+done+' / '+ls.length+' lessons complete</div>';
      if(ls.length){const details=document.createElement("details");details.className="course-syllabus";const summary=document.createElement("summary");summary.textContent="View lesson sequence ("+ls.length+")";details.appendChild(summary);const list=document.createElement("div");list.className="course-syllabus-list";ls.forEach((l,i)=>{const b=document.createElement("button");b.className="lesson-row";b.disabled=!isLessonUnlocked(l);const mark=lessonComplete(l)?"✓ ":isLessonUnlocked(l)?"→ ":"🔒 ";b.textContent=mark+(i+1)+". "+l.title;b.addEventListener("click",()=>startLesson(l.id,"recall"));list.appendChild(b);});details.appendChild(list);card.appendChild(details);}
      if(open&&ls.length){const next=ls.find(l=>!lessonComplete(l))||ls[0];const b=document.createElement("button");b.className="course-start";b.textContent=lessonComplete(next)?"Review level →":"Continue: "+next.title+" →";b.addEventListener("click",()=>startLesson(next.id,"recall"));card.appendChild(b);}else if(!ls.length){const note=document.createElement("div");note.className="course-count";note.textContent="Curriculum content coming soon";card.appendChild(note);}
      host.appendChild(card);
    });
    const next=allLessons.find(l=>isLessonUnlocked(l)&&!lessonComplete(l));
    $("course-overall").textContent="LEVEL "+unlocked;
    $("course-next").innerHTML=next?'<span class="eyebrow">NEXT LESSON</span><strong>'+esc(next.title)+'</strong><p>'+esc(next.grammarNote||next.section||"Build your Japanese step by step.")+'</p><button class="course-start primary-course" id="course-next-button">Start this lesson →</button>':'<strong>Great progress.</strong><p>Review completed lessons or keep practising to strengthen recall.</p>';
    const b=$("course-next-button");if(b&&next)b.addEventListener("click",()=>startLesson(next.id,"recall"));
  }
  function renderStats(){const t=today(),goal=Number(state.settings.goal)||10;$("today-count").innerHTML=t.attempts+' <small>attempts</small>';$("today-bar").style.width=Math.min(100,t.attempts/goal*100)+"%";const due=allCards.filter(c=>!state.cards[c.id]||(state.cards[c.id].due||0)<=Date.now()).length;$("due-count").innerHTML=due+' <small>due</small>';$("due-note").textContent=due?"A few good reps go a long way":"You're caught up for now";const recent=state.history.slice(-50),wins=recent.filter(x=>x.grade==="good").length;$("win-rate").innerHTML=(recent.length?Math.round(wins/recent.length*100):"—")+'<small>%</small>';$("today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();}
  function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function recordAttempt(id,grade){const now=Date.now(),old=state.cards[id]||{interval:0,ease:2.3,reps:0,lapses:0};let interval=old.interval||0;if(grade==="again"){interval=0;old.lapses=(old.lapses||0)+1;}else if(grade==="hard")interval=Math.max(10*60*1000,interval?interval*1.35:12*60*60*1000);else interval=Math.max(24*60*60*1000,interval?interval*2.1:24*60*60*1000);old.interval=interval;old.ease=grade==="hard"?Math.max(1.3,(old.ease||2.3)-.08):grade==="good"?Math.min(2.8,(old.ease||2.3)+.04):(old.ease||2.3);old.reps=(old.reps||0)+1;old.due=now+interval;state.cards[id]=old;const d=today();d.attempts++;if(grade==="good"){d.wins++;state.wins++;}state.daily[dayKey()]=d;state.total++;sessionAttempts++;state.history.push({id,grade,at:now});state.history=state.history.slice(-300);if(current&&current.lessonId){state.lessonAttempts[current.lessonId]=(state.lessonAttempts[current.lessonId]||0)+1;}save();}
  function start(nextMode){const next=allLessons.find(l=>isLessonUnlocked(l)&&!lessonComplete(l));lessonId=next?next.id:null;begin(nextMode,lessonId);}
  function startLesson(id,nextMode){lessonId=id;begin(nextMode||"recall",id);}
  function begin(nextMode,id){
    mode=nextMode||"recall";queueIndex=0;sessionAttempts=0;revealed=false;sessionFinished=false;conversationIndex=0;conversationTurn=0;conversationLocked=false;listenAnswered=false;
    $("next-button").textContent="Next →";$("replay-button").hidden=false;$("mode-extra").hidden=true;$("mode-extra").innerHTML="";
    const lesson=id&&allLessons.find(l=>l.id===id);let candidates=id?lessonCards(id):allCards.slice();
    if(mode==="patterns"){
      const relevant=id?transforms.filter(t=>t.lessonId===id):transforms;
      if(relevant.length)candidates=relevant.map(t=>Object.assign({},t,{transform:true,sentence:{en:t.prompt,jp:t.target,romaji:"",words:[]}}));
      else if(lesson)candidates=(lesson.vocab||[]).map((v,i)=>({id:lesson.id+"#word#"+i,lessonId:lesson.id,section:lesson.section,level:lesson.id.startsWith("l0")?"FIRST SOUNDS":"FOUNDATIONS",sentence:{en:v.en,jp:v.jp,romaji:v.romaji,words:[v]}}));
      else candidates=transforms.map(t=>Object.assign({},t,{transform:true,sentence:{en:t.prompt,jp:t.target,romaji:"",words:[]}}));
      $("session-mode").textContent="PATTERN LAB · BUILD & CHANGE";
    }else if(mode==="scenes"){$("session-mode").textContent="IN THE MOMENT · CONVERSATION";queue=[];}
    else if(mode==="listen"){$("session-mode").textContent="LISTEN & NOTICE · UNDERSTAND";candidates=shuffle(candidates).slice(0,10);}
    else {$("session-mode").textContent="RECALL · RETRIEVE FROM MEMORY";const due=candidates.filter(c=>!state.cards[c.id]||(state.cards[c.id].due||0)<=Date.now());const fresh=candidates.filter(c=>state.cards[c.id]&&(state.cards[c.id].due||0)>Date.now()).sort(()=>Math.random()-.5);candidates=due.concat(fresh);}
    if(mode!=="scenes")queue=(lessonId&&mode==="recall"?candidates:shuffle(candidates)).slice(0,10);
    if(!queue.length&&mode!=="scenes")queue=allCards.slice(0,10);
    $("prompt-type").textContent=mode==="listen"?"LISTEN FIRST · CHOOSE WHAT YOU HEARD":mode==="patterns"?"MAKE A NEW SENTENCE":mode==="scenes"?"YOUR TURN IN THE CONVERSATION":"SAY IT IN JAPANESE";
    $("prompt-hint").textContent=mode==="listen"?"Listen without reading. Choose the meaning you actually heard.":mode==="patterns"?"Use the grammar pattern to express a changed meaning. Speak first, then type if you want to check yourself.":mode==="scenes"?"Listen to the other person, then choose the reply that fits the moment. The conversation continues after your answer.":"Say your answer out loud before revealing it. Take your time — the answer is hidden.";
    if(lesson){$("session-mode").textContent=lesson.title.toUpperCase()+" · "+(mode==="recall"?"RECALL":mode==="patterns"?"PATTERN LAB":mode==="listen"?"LISTENING":"CONVERSATION");$("level-pill").textContent="LEVEL "+levelForLesson(lesson)+" · "+lesson.section.toUpperCase();}
    showView("practice-view");
    if(mode==="scenes"){startConversation();return;}
    renderCard();
  }
  function renderCard(){
    if(queueIndex>=queue.length){finishSession();return;}
    current=queue[queueIndex];revealed=false;listenAnswered=false;const s=current.sentence;
    $("session-count").textContent=String(queueIndex+1).padStart(2,"0")+" / "+String(queue.length).padStart(2,"0");$("session-progress-fill").style.width=(queueIndex/queue.length*100)+"%";
    $("level-pill").textContent=lessonId?"LEVEL "+levelForLesson(allLessons.find(l=>l.id===lessonId)||{id:lessonId})+" · "+(current.section||current.level||"LESSON").toUpperCase():(current.section||current.level||"FOUNDATIONS").toUpperCase();
    $("scenario-tag").hidden=true;$("prompt-en").textContent=mode==="listen"?"What did you hear?":s.en;
    $("think-copy").textContent=mode==="listen"?"Listen for the words and ending — don't peek at the text.":"Your turn. Say it before you tap.";
    $("answer-jp").textContent=s.jp;$("answer-romaji").textContent=state.settings.romaji==="hide"?"":(s.romaji||"");$("answer-en").textContent=s.en;
    $("answer-panel").hidden=true;$("before-actions").hidden=mode==="listen"||mode==="patterns";$("reveal-button").hidden=mode==="listen"||mode==="patterns";$("skip-button").hidden=mode==="listen"||mode==="patterns";$("grade-area").hidden=true;$("listen-actions").hidden=mode==="listen"||mode==="patterns";$("replay-button").hidden=false;$("next-button").textContent="Next sentence →";
    $("breakdown-toggle").innerHTML='Show sentence structure <span>＋</span>';$("token-row").hidden=true;renderTokens(s.words||[]);
    const extra=$("mode-extra");extra.innerHTML="";extra.hidden=true;
    if(mode==="listen")renderListenChoice();
    else if(mode==="patterns")renderPatternTask();
    else if(mode==="recall"){ $("think-copy").textContent=lessonId?"Try this lesson's sentence from memory.":"Your turn. Say it before you tap."; }
  }
  function renderTokens(words){const row=$("token-row");row.innerHTML="";words.forEach(w=>{const chip=document.createElement("span");chip.className="token pos-"+(w.pos||"expr");chip.innerHTML='<span class="token-jp">'+esc(w.jp)+'</span><span class="token-en">'+esc(w.en)+'</span>';row.appendChild(chip);});}
  function reveal(){if(!current||revealed)return;revealed=true;const s=current.sentence;$("answer-panel").hidden=false;$("before-actions").hidden=true;$("grade-area").hidden=false;$("listen-actions").hidden=true;$("think-copy").textContent="Listen, notice the structure, and try saying it once more.";speak(s.jp,false);}
  function grade(result){if(!current||!revealed)return;recordAttempt(current.id,result);$("grade-area").hidden=true;$("listen-actions").hidden=false;$("session-progress-fill").style.width=((queueIndex+1)/queue.length*100)+"%";$("think-copy").textContent=result==="good"?"That came out on your own. Nice work.":result==="hard"?"Nearly there. We'll bring this pattern back.":"This one needs another pass. That's useful information.";}
  function renderPatternTask(){
    const extra=$("mode-extra");extra.hidden=false;
    const t=current&&current.transform?current:transforms.find(x=>x.id===current.id);
    if(t){extra.innerHTML='<div class="challenge-source"><span class="eyebrow">STARTING SENTENCE</span><strong>'+esc(t.sourceEnglish)+'</strong><span class="challenge-jp">'+esc(t.sourceJp)+'</span><button type="button" class="mini-audio" data-speak="'+esc(t.sourceJp)+'" aria-label="Hear starting sentence">▶ Hear it</button></div><div class="challenge-task"><span class="eyebrow">YOUR CHALLENGE</span><strong>'+esc(t.prompt||t.sentence&&t.sentence.en||"Change the sentence")+'</strong><label for="pattern-answer">Try it in Japanese (optional)</label><input id="pattern-answer" type="text" autocomplete="off" autocapitalize="off" placeholder="Type kana or romaji after speaking"><button class="reveal-button" id="check-pattern">Check my sentence →</button><div id="pattern-feedback" class="mode-feedback" hidden></div></div>';}
    else {
      const vocab=(allLessons.find(l=>l.id===current.lessonId)||{}).vocab||[];const answer=(vocab.find(v=>v.en===current.sentence.en)||vocab[0]||{}).jp;
      const opts=shuffle([answer,...vocab.filter(v=>v.jp!==answer).slice(0,3).map(v=>v.jp)]);extra.innerHTML='<div class="challenge-task"><span class="eyebrow">WORD BUILDER</span><strong>Which Japanese word matches this meaning?</strong><p class="word-builder-meaning">'+esc(current.sentence.en)+'</p><div class="choice-list">'+opts.map(v=>'<div class="choice-with-audio"><button class="choice-button word-choice" data-answer="'+esc(v)+'">'+esc(v)+'</button><button type="button" class="mini-audio" data-speak="'+esc(v)+'" aria-label="Hear '+esc(v)+'">▶</button></div>').join("")+'</div><div id="pattern-feedback" class="mode-feedback" hidden></div></div>';
    }
    $("before-actions").hidden=true;$("listen-actions").hidden=true;$("grade-area").hidden=true;
  }
  function norm(s){return String(s||"").normalize("NFKC").replace(/[、。！？!?.,\s・]/g,"").toLowerCase();}
  function checkPattern(){
    const t=current&&current.transform?current:transforms.find(x=>x.id===current.id);if(!t)return;
    const val=$("pattern-answer").value.trim(),ok=norm(val)===norm(t.target);const box=$("pattern-feedback");box.hidden=false;box.className="mode-feedback "+(ok?"success":"try-again");box.innerHTML=(ok?"<strong>Good construction.</strong>":"<strong>Compare and try again.</strong>")+'<div class="answer-jp">'+esc(t.target)+'</div><p>'+esc(t.note||"Notice what changed in the sentence.")+'</p><button class="secondary-button" id="pattern-reveal">Hear the model</button><button class="reveal-button" id="pattern-next">Next challenge →</button>';
    speak(t.target,false);if(current.id)recordAttempt(current.id,ok?"good":"hard");
  }
  function renderListenChoice(){
    const extra=$("mode-extra");extra.hidden=false;const correct=current.sentence.en;const others=shuffle(allCards.filter(c=>c.id!==current.id&&c.sentence.en!==correct)).slice(0,3).map(c=>c.sentence.en);const opts=shuffle([correct,...others]);
    extra.innerHTML='<div class="listening-prompt"><span class="eyebrow">AUDIO ONLY · LISTEN FOR MEANING</span><button class="secondary-button" id="listen-replay">↻ Replay audio</button><p>What did the speaker say?</p><div class="choice-list">'+opts.map(v=>'<button class="choice-button listen-choice" data-answer="'+esc(v)+'">'+esc(v)+'</button>').join("")+'</div><div id="listen-feedback" class="mode-feedback" hidden></div></div>';
    $("answer-panel").hidden=true;$("before-actions").hidden=true;$("listen-actions").hidden=true;speak(current.sentence.jp,false);
  }
  function chooseListen(button){
    if(listenAnswered)return;listenAnswered=true;const ok=button.dataset.answer===current.sentence.en;document.querySelectorAll(".listen-choice").forEach(b=>{b.disabled=true;if(b.dataset.answer===current.sentence.en)b.classList.add("correct-choice");});
    if(!ok)button.classList.add("wrong-choice");const box=$("listen-feedback");box.hidden=false;box.className="mode-feedback "+(ok?"success":"try-again");box.innerHTML='<strong>'+(ok?"You caught it.":"Not quite — here's what you heard.")+'</strong><div class="answer-jp">'+esc(current.sentence.jp)+'</div><p>'+esc(current.sentence.en)+'</p>'+(state.settings.romaji==="hide"?"":'<small>'+esc(current.sentence.romaji||"")+'</small>')+'<div><button class="secondary-button" id="listen-slow">Play slowly</button><button class="reveal-button" id="listen-next">Next listening →</button></div>';
    recordAttempt(current.id,ok?"good":"again");$("think-copy").textContent=ok?"You understood the message.":"Listen again and notice the ending.";
  }
  function startConversation(){const available=conversations.filter(c=>c.level==="L0"||unlockedLevel()>=1);conversationIndex=available.length>1?Math.floor(Math.random()*available.length):0;const convo=available[conversationIndex%available.length];current={conversation:convo};conversationTurn=0;renderConversationTurn();}
  function renderConversationTurn(){
    const convo=current.conversation;if(conversationTurn>=convo.turns.length){finishConversation();return;}
    conversationLocked=false;const turn=convo.turns[conversationTurn];$("session-count").textContent=String(conversationTurn+1).padStart(2,"0")+" / "+String(convo.turns.length).padStart(2,"0");$("session-progress-fill").style.width=(conversationTurn/convo.turns.length*100)+"%";$("level-pill").textContent=convo.level+" · "+convo.place;$("prompt-type").textContent="LISTEN · UNDERSTAND · RESPOND";$("scenario-tag").hidden=false;$("scenario-tag").textContent=convo.title.toUpperCase()+" · TURN "+(conversationTurn+1);$("prompt-en").textContent=turn.speaker+" says…";$("prompt-hint").textContent="Listen to the Japanese. Choose a reply that makes sense in this situation.";$("answer-panel").hidden=true;$("before-actions").hidden=true;$("grade-area").hidden=true;$("listen-actions").hidden=true;$("think-copy").textContent="What would you say next?";const extra=$("mode-extra");extra.hidden=false;
    extra.innerHTML='<div class="conversation-line"><span class="eyebrow">'+esc(turn.speaker.toUpperCase())+'</span><div class="conversation-jp">'+esc(turn.jp)+'</div><button class="text-button" id="conversation-audio">▶ Listen again</button><button class="text-button" id="conversation-translation">Show translation</button><p id="conversation-en" class="conversation-en" hidden>'+esc(turn.en)+'</p></div><div class="conversation-choices"><span class="eyebrow">YOUR REPLY</span><div class="choice-list">'+turn.choices.map((ch,i)=>'<div class="choice-with-audio"><button class="choice-button conversation-choice" data-choice="'+i+'"><strong>'+esc(ch.jp)+'</strong><small>'+esc(ch.en)+'</small></button><button type="button" class="mini-audio" data-speak="'+esc(ch.jp)+'" aria-label="Hear '+esc(ch.jp)+'">▶</button></div>').join("")+'</div><div id="conversation-feedback" class="mode-feedback" hidden></div></div>';
    $("replay-button").hidden=true;speak(turn.jp,false);
  }
  function chooseConversation(button){
    if(conversationLocked)return;const convo=current.conversation,turn=convo.turns[conversationTurn],choice=turn.choices[Number(button.dataset.choice)];conversationLastCorrect=!!choice.correct;conversationLocked=true;
    document.querySelectorAll(".conversation-choice").forEach(b=>{b.disabled=true;if(turn.choices[Number(b.dataset.choice)].correct)b.classList.add("correct-choice");});if(!choice.correct)button.classList.add("wrong-choice");
    const box=$("conversation-feedback");box.hidden=false;box.className="mode-feedback "+(choice.correct?"success":"try-again");box.innerHTML='<strong>'+(choice.correct?"That fits the moment.":"That reply doesn't quite fit — compare the meanings, then try again.")+'</strong><div class="answer-jp">'+esc(choice.replyJp||"")+'</div><p>'+esc(choice.replyEn||"")+'</p><button class="reveal-button" id="conversation-next">'+(choice.correct?(conversationTurn===convo.turns.length-1?"Finish conversation":"Keep talking"):"Try again")+' →</button>';
    recordAttempt("conversation:"+convo.id+":"+conversationTurn,choice.correct?"good":"again");speak(choice.replyJp||"",false);
  }
  function finishConversation(){const convo=current.conversation;advanceGuidedPath();$("session-progress-fill").style.width="100%";$("prompt-type").textContent="CONVERSATION COMPLETE";$("scenario-tag").hidden=true;$("prompt-en").textContent="You kept the conversation moving."; $("prompt-hint").textContent="Try the exchange once more aloud, without looking at the choices."; $("think-copy").textContent="A real conversation is a chain of small, useful responses.";$("mode-extra").hidden=false;$("mode-extra").innerHTML='<div class="mode-feedback success"><strong>'+esc(convo.title)+' complete.</strong><p>Replay the phrases and say both sides aloud. Next time, try answering before reading the choices.</p><button class="secondary-button" id="conversation-restart">Replay this conversation</button><button class="reveal-button" id="conversation-home">Back to studio →</button></div>';$("before-actions").hidden=true;$("grade-area").hidden=true;$("listen-actions").hidden=true;}
  function finishSession(){sessionFinished=true;advanceGuidedPath();$("session-progress-fill").style.width="100%";$("session-mode").textContent="SESSION COMPLETE";$("prompt-type").textContent="YOU SHOWED UP";$("scenario-tag").hidden=true;$("prompt-en").textContent="Every attempt makes the next one easier.";$("prompt-hint").textContent="You tried "+sessionAttempts+" prompts. Say your hardest one once more."; $("think-copy").textContent="Progress is what you can retrieve tomorrow.";$("answer-panel").hidden=true;$("before-actions").hidden=true;$("grade-area").hidden=true;$("mode-extra").hidden=true;$("listen-actions").hidden=false;$("replay-button").hidden=true;$("next-button").textContent="Back to your studio →";}
  function nextCard(){if(mode==="listen"&&!listenAnswered){$("think-copy").textContent="Choose an answer first so the listening practice can help you.";return;}queueIndex++;renderCard();}
  function renderBreakdown(){const row=$("token-row"),hidden=!row.hidden;row.hidden=hidden;$("breakdown-toggle").innerHTML=hidden?'Show sentence structure <span>＋</span>':'Hide sentence structure <span>−</span>';}
  function openSettings(){$("daily-goal").value=String(state.settings.goal||10);$("romaji-setting").value=state.settings.romaji||"auto";showView("settings-view");}
  document.addEventListener("click",e=>{
    const b=e.target.closest("button");if(!b)return;
    if(b.dataset.speak){speak(b.dataset.speak,false);}
    else if(b.id==="check-pattern"){checkPattern();}
    else if(b.id==="pattern-reveal"){const t=current&&current.transform?current:transforms.find(x=>x.id===current.id);if(t)speak(t.target,false);}
    else if(b.id==="pattern-next"){queueIndex++;renderCard();}
    else if(b.classList.contains("word-choice")){document.querySelectorAll(".word-choice").forEach(x=>x.disabled=true);const ok=b.dataset.answer===((allLessons.find(l=>l.id===current.lessonId)||{}).vocab||[]).find(v=>v.en===current.sentence.en)?.jp;b.classList.add(ok?"correct-choice":"wrong-choice");const box=$("pattern-feedback");box.hidden=false;box.className="mode-feedback "+(ok?"success":"try-again");box.innerHTML='<strong>'+(ok?"Correct word.":"Not quite.")+'</strong><p>'+esc(current.sentence.en)+' → '+esc(b.dataset.answer)+'</p><button class="reveal-button" id="pattern-next">Next word →</button>';recordAttempt(current.id,ok?"good":"again");}
    else if(b.id==="listen-replay")speak(current.sentence.jp,false);
    else if(b.classList.contains("listen-choice"))chooseListen(b);
    else if(b.id==="listen-slow")speak(current.sentence.jp,true);
    else if(b.id==="listen-next"){queueIndex++;renderCard();}
    else if(b.id==="conversation-audio")speak(current.conversation.turns[conversationTurn].jp,false);
    else if(b.id==="conversation-translation")$("conversation-en").hidden=!$("conversation-en").hidden;
    else if(b.classList.contains("conversation-choice"))chooseConversation(b);
    else if(b.id==="conversation-next"){if(conversationLastCorrect){conversationTurn++;renderConversationTurn();}else renderConversationTurn();}
    else if(b.id==="conversation-restart"){conversationTurn=0;renderConversationTurn();}
    else if(b.id==="conversation-home")showView("home-view");
  });
  $("start-session").addEventListener("click",startGuidedPath);
  document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>start(b.dataset.mode)));
  $("back-home").addEventListener("click",()=>showView("home-view"));$("settings-button").addEventListener("click",openSettings);$("settings-back").addEventListener("click",()=>showView("home-view"));
  $("reveal-button").addEventListener("click",reveal);$("skip-button").addEventListener("click",nextCard);$("breakdown-toggle").addEventListener("click",renderBreakdown);$("replay-button").addEventListener("click",()=>current&&current.sentence&&speak(current.sentence.jp,false));
  $("next-button").addEventListener("click",()=>{if(sessionFinished){showView("home-view");}else nextCard();});
  document.querySelectorAll("[data-grade]").forEach(b=>b.addEventListener("click",()=>grade(b.dataset.grade)));
  $("daily-goal").addEventListener("change",e=>{state.settings.goal=Number(e.target.value);save();});$("romaji-setting").addEventListener("change",e=>{state.settings.romaji=e.target.value;save();});
  $("reset-progress").addEventListener("click",()=>{if(!window.confirm("Reset only the new Speaking Studio's review history? Your original Hanasou app and Anki are not affected."))return;state.cards={};state.total=0;state.wins=0;state.daily={};state.history=[];state.lessonDone={};state.lessonAttempts={};save();showView("home-view");});
  renderStats();renderCourse();
})();