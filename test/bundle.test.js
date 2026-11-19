// The shareable single file: data and scripts inlined, nothing local left to load.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist", "pyramid-results.html");

test("bundle writes one self-contained html file", () => {
  execFileSync(process.execPath, [path.join(root, "scripts", "bundle.js")], { cwd: root });
  const html = fs.readFileSync(out, "utf8");
  assert.doesNotMatch(html, /<script[^>]*\bsrc=/, "no external or local script files");
  assert.match(html, /globalThis\.PYRAMID\s*=/, "data inlined");
  assert.match(html, /globalThis\.PyramidCalc\s*=/, "calc inlined");
  assert.match(html, /getElementById\("app"\)/, "ui inlined");
  assert.ok(html.indexOf("globalThis.PYRAMID =") < html.indexOf("globalThis.PyramidCalc ="), "data before calc");
  assert.ok(html.indexOf("globalThis.PyramidCalc =") < html.indexOf('getElementById("app")'), "calc before ui");
  assert.doesNotMatch(html, /<\/script>[\s\S]*<\/script>[\s\S]*<\/script>[\s\S]*<\/script>/, "exactly three script blocks");
});
