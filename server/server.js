"use strict";
// Tiny single-user progress-sync API for Hanasou. Zero dependencies.
// Stores the whole progress blob as one JSON file. Auth: one shared bearer token.
//
// Env:
//   HANASOU_TOKEN  (required) — shared secret; clients send "Authorization: Bearer <token>"
//   PORT           (default 8787)
//   HANASOU_DATA   (default ./data) — directory for progress.json

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 8787;
const TOKEN = process.env.HANASOU_TOKEN;
const DATA_DIR = process.env.HANASOU_DATA || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "progress.json");
const MAX_BODY = 2 * 1024 * 1024; // 2 MB cap

if (!TOKEN) {
  console.error("Refusing to start: set the HANASOU_TOKEN environment variable.");
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });

function readStore() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { progress: null, updatedAt: 0 }; }
}
function writeStore(obj) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, DATA_FILE); // atomic replace
}

function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!url.startsWith("/api/progress")) return send(res, 404, { error: "not found" });

  if ((req.headers["authorization"] || "") !== "Bearer " + TOKEN) {
    return send(res, 401, { error: "unauthorized" });
  }

  if (req.method === "GET") return send(res, 200, readStore());

  if (req.method === "PUT") {
    let body = "", aborted = false;
    req.on("data", (c) => {
      body += c;
      if (body.length > MAX_BODY) { aborted = true; send(res, 413, { error: "too large" }); req.destroy(); }
    });
    req.on("end", () => {
      if (aborted) return;
      let parsed;
      try { parsed = JSON.parse(body); } catch { return send(res, 400, { error: "bad json" }); }
      const store = { progress: parsed.progress, updatedAt: Date.now() };
      writeStore(store);
      send(res, 200, { updatedAt: store.updatedAt });
    });
    return;
  }

  send(res, 405, { error: "method not allowed" });
});

server.listen(PORT, "127.0.0.1", () => console.log("hanasou-api listening on 127.0.0.1:" + PORT));
