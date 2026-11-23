// Local stand-in for the Apps Script web app, for checking the entry UI in a browser.
// Run via .claude/launch.json ("results-stub"). POST /ok saves, /fail errors (500), /reject replies ok:false,
// /hang never replies. GET /log lists what was received.
const http = require("node:http");

const PORT = Number(process.env.PORT || 8767);
const received = [];

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Headers": "Content-Type" }); return res.end(); }
  if (req.method === "GET" && req.url === "/log") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(received)); }
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    if (req.url === "/hang") return; // leave the request open
    setTimeout(() => {
      if (req.url === "/ok") {
        received.push({ contentType: req.headers["content-type"], body: JSON.parse(body) });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } else if (req.url === "/reject") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "unknown name" }));
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "stub failure" }));
      }
    }, 400);
  });
}).listen(PORT, () => console.log("results stub on " + PORT));
