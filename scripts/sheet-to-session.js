// Turns the results Sheet's rows into a `sessions` entry for data/scores.js and prints each person against plan.
// Run: node scripts/sheet-to-session.js <values.json> <week>
// values.json: the Sheet's "Results" tab as an array of rows, header first
// (received, name, week, set, machine, calories, comment), or an object with a `values` array.
// A person who saved more than once has one row per save; the last row for each section wins.
const fs = require("node:fs");
const path = require("node:path");

require(path.join(__dirname, "..", "data", "scores.js"));
const C = require(path.join(__dirname, "..", "src", "calc.js"));
const D = globalThis.PYRAMID;

function parseDate(s) {
  const t = String(s || "").trim();
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); // dd/mm/yyyy, as the UK-locale Sheet shows it
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function sessionFromValues(values, week) {
  const [head, ...body] = values;
  const col = (n) => head.indexOf(n);
  const need = ["received", "name", "week", "set", "machine", "calories", "comment"];
  need.forEach((n) => { if (col(n) < 0) throw new Error("missing column " + n); });
  const names = D.people.map((p) => p.name), latest = new Map(), skipped = [], dates = [];
  body.forEach((r, i) => {
    const get = (n) => (r[col(n)] == null ? "" : String(r[col(n)]).trim());
    if (Number(get("week")) !== week) return;
    const name = get("name"), machine = get("machine").toLowerCase(), set = Number(get("set"));
    const cal = get("calories") === "" ? null : Number(get("calories"));
    if (!names.includes(name) || !D.machines.includes(machine) || !Number.isInteger(set) || (cal != null && !Number.isInteger(cal))) {
      skipped.push(`row ${i + 2}: ${JSON.stringify(r)}`);
      return;
    }
    const d = parseDate(get("received"));
    if (d) dates.push(d);
    latest.set(`${name}|${set}|${machine}`, { name, set, machine, calories: cal, comment: get("comment") });
  });
  dates.sort();
  return { week, date: dates.length ? dates[dates.length - 1] : null, firstDate: dates[0] || null, rows: [...latest.values()], skipped };
}

function rowsSource(rows) {
  return rows.map((r) => `        { name: ${JSON.stringify(r.name)}, set: ${r.set}, machine: "${r.machine}", calories: ${r.calories == null ? "null" : r.calories}, comment: ${JSON.stringify(r.comment)} }`).join(",\n");
}

function main() {
  const [file, weekArg] = process.argv.slice(2);
  if (!file || !weekArg) { console.error("usage: node scripts/sheet-to-session.js <values.json> <week>"); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const values = Array.isArray(raw) ? raw : raw.values;
  const ses = sessionFromValues(values, Number(weekArg));
  if (!ses.rows.length) { console.error("no rows for week " + weekArg); process.exit(1); }

  console.log(`// week ${ses.week}: ${ses.rows.length} rows, received ${ses.firstDate} to ${ses.date}`);
  if (ses.skipped.length) console.log("// SKIPPED (check these):\n// " + ses.skipped.join("\n// "));
  console.log("      week: " + ses.week + ', date: "' + ses.date + '",\n      rows: [\n' + rowsSource(ses.rows) + "\n      ],");

  const reports = D.people.map((p) => C.sessionReport(p, ses.week, ses.rows)).filter(Boolean);
  console.log("\n// Against plan (calories per section; plan = target minutes at target pace + recovery minutes at recovery pace)");
  reports.forEach((r) => {
    console.log("// " + r.name);
    r.machines.forEach((m) => {
      const sets = m.sets.map((x) => `set ${x.set} ${x.calories}${x.plan ? ` (plan ${Math.round(x.plan.lo)}-${Math.round(x.plan.hi)}, ${x.status})` : ""}`).join("; ");
      console.log(`//   ${m.name.padEnd(4)} ${m.vsPlan == null ? "  -  " : C.signed(m.vsPlan).padStart(5)} ${m.status || "-"} | ${sets}${m.comments.length ? " | " + m.comments.map((c) => JSON.stringify(c)).join(" ") : ""}`);
    });
  });
  const missing = D.people.filter((p) => !reports.some((r) => r.name === p.name)).map((p) => p.name);
  console.log("// Summary: " + JSON.stringify(C.sessionSummary(reports)) + (missing.length ? " | not logged: " + missing.join(", ") : ""));
}

if (require.main === module) main();
module.exports = { sessionFromValues, parseDate };
