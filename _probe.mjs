import { chromium, devices } from "playwright";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = process.cwd();
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".mp3":"audio/mpeg",".wav":"audio/wav",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{const p=decodeURIComponent(req.url.split("?")[0]);const f=path.join(ROOT,p==="/"?"/index.html":p);fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);res.end("nf");return;}res.writeHead(200,{"Content-Type":MIME[path.extname(f)]||"application/octet-stream"});res.end(b);});});
await new Promise(r=>server.listen(8099,r));
const browser=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
const ctx=await browser.newContext({...devices["iPhone 13 Pro"],isMobile:true,hasTouch:true});
const page=await ctx.newPage();
await page.goto("http://localhost:8099/index.html",{waitUntil:"networkidle"});
await page.waitForTimeout(500);
const info=await page.evaluate(()=>{
  window.HanasouStory.beforeCard({mode:"lesson",lessonId:"frequency",en:"I often watch TV.",drive:false,build:false,warmup:false,lastGrade:null,words:[]});
  const root=document.getElementById("story-break");
  const cs=getComputedStyle(root);
  const rs=getComputedStyle(document.documentElement);
  const bs=getComputedStyle(document.body);
  return {
    bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0,60), zIndex: cs.zIndex, pos: cs.position,
    paperVar: rs.getPropertyValue("--paper"), bgVar: rs.getPropertyValue("--bg"),
    paperOnBody: bs.getPropertyValue("--paper"),
    supportsColorMix: CSS.supports("background", "color-mix(in srgb, #fff 92%, #000 8%)"),
    parent: root.parentElement.tagName + "#" + root.parentElement.id,
  };
});
console.log(JSON.stringify(info,null,1));
await browser.close(); server.close();
