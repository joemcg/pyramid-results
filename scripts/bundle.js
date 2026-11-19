// Builds dist/pyramid-results.html: index.html with its local scripts inlined, so the one file can be shared.
// Run: node scripts/bundle.js
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

let inlined = 0;
const out = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, src) => {
  if (/^[a-z]+:\/\//i.test(src)) return tag; // leave remote scripts alone
  const code = fs.readFileSync(path.join(root, src), "utf8").replace(/<\/script/gi, "<\\/script");
  inlined++;
  return "<script>\n" + code + "\n</script>";
});

if (inlined === 0) throw new Error("bundle: no local scripts found in index.html");
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const dest = path.join(root, "dist", "pyramid-results.html");
fs.writeFileSync(dest, out);
console.log("bundle: inlined " + inlined + " scripts into " + path.relative(root, dest) + " (" + Buffer.byteLength(out) + " bytes)");
