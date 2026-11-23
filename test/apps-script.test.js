// The Apps Script that saves session results, run in Node against a fake sheet.
const test = require("node:test");
const assert = require("node:assert/strict");

require("../data/scores.js");
const C = require("../src/calc.js");
const S = require("../apps-script/Code.js");
const DATA = globalThis.PYRAMID;
const NOW = new Date("2026-11-23T18:42:00Z");

// Mimics the two Sheet calls the script uses; counts writes so a save is one write.
function fakeSheet(rows = []) {
  return {
    rows, writes: 0,
    getLastRow() { return this.rows.length; },
    getRange(row, col, n, m) {
      const sheet = this;
      return { setValues(vals) {
        assert.equal(row, sheet.rows.length + 1, "writes start on the next empty row");
        assert.equal(col, 1); assert.equal(vals.length, n); vals.forEach((v) => assert.equal(v.length, m));
        sheet.writes++; sheet.rows.push(...vals);
      } };
    },
  };
}
const row = (over = {}) => ({ set: 1, machine: "ski", calories: 51, comment: "", ...over });

test("a good save writes the header once, then one row per section", () => {
  const sheet = fakeSheet();
  const res = S.handleSave({ name: "Lindsay", week: 2, rows: [row(), row({ set: 2, machine: "echo", calories: 44, comment: "legs gone" })] }, sheet, NOW);
  assert.deepEqual(res, { ok: true });
  assert.deepEqual(sheet.rows, [S.HEADER, [NOW, "Lindsay", 2, 1, "ski", 51, ""], [NOW, "Lindsay", 2, 2, "echo", 44, "'legs gone"]]);
  assert.equal(sheet.writes, 1, "header and rows in one write");
  S.handleSave({ name: "Lindsay", week: 2, rows: [row()] }, sheet, NOW);
  assert.equal(sheet.rows.filter((r) => r[0] === "received").length, 1, "header written once");
  assert.equal(sheet.rows.length, 4, "saving the same section again adds another row");
});

test("week 7 takes rounds 1 to 3", () => {
  const sheet = fakeSheet();
  assert.deepEqual(S.handleSave({ name: "Joe", week: 7, rows: [row({ set: 3 })] }, sheet, NOW), { ok: true });
});

test("any invalid part rejects the whole save and appends nothing", () => {
  const bad = [
    { name: "Nobody", week: 2, rows: [row()] },
    { name: "Lindsay", week: 1, rows: [row()] },
    { name: "Lindsay", week: 8, rows: [row()] },
    { name: "Lindsay", week: 2, rows: [row({ set: 3 })] },
    { name: "Lindsay", week: 7, rows: [row({ set: 4 })] },
    { name: "Lindsay", week: 2, rows: [row({ machine: "bike" })] },
    { name: "Lindsay", week: 2, rows: [row({ calories: 0 })] },
    { name: "Lindsay", week: 2, rows: [row({ calories: 1000 })] },
    { name: "Lindsay", week: 2, rows: [row({ calories: 45.5 })] },
    { name: "Lindsay", week: 2, rows: [] },
    { name: "Lindsay", week: 2, rows: [row(), row({ machine: "row" }), row({ machine: "bike" })] },
    { name: "Lindsay", week: "2", rows: [row()] },
    { name: "Lindsay", week: 2, rows: [row(), row()] },
    { name: "Lindsay", week: 2, rows: Array.from({ length: 7 }, (_, i) => row({ set: (i % 2) + 1, machine: ["echo", "row", "ski", "echo", "row", "ski", "ski"][i] })) },
    { name: "Lindsay", week: 2, rows: [row({ calories: null, comment: "" })] },
  ];
  for (const body of bad) {
    const sheet = fakeSheet();
    const res = S.handleSave(body, sheet, NOW);
    assert.equal(res.ok, false, JSON.stringify(body));
    assert.equal(typeof res.error, "string");
    assert.equal(sheet.rows.length, 0, JSON.stringify(body));
  }
});

test("comments are kept as text, never formulas, numbers, times or dates, and cut to 280 characters", () => {
  const sheet = fakeSheet();
  const comments = ["=SUM(A1)", "3:00", "45", "1/2", "y".repeat(300)];
  const rows = comments.map((c, i) => row({ set: (i % 2) + 1, machine: ["echo", "row", "ski", "echo", "row"][i], comment: c }));
  assert.deepEqual(S.handleSave({ name: "Lindsay", week: 2, rows }, sheet, NOW), { ok: true });
  assert.deepEqual(sheet.rows.slice(1, 5).map((r) => r[6]), ["'=SUM(A1)", "'3:00", "'45", "'1/2"]);
  assert.equal(sheet.rows[5][6], "'" + "y".repeat(280));
});

test("a comment alone saves with calories left blank", () => {
  const sheet = fakeSheet();
  assert.deepEqual(S.handleSave({ name: "Lindsay", week: 2, rows: [row({ calories: null, comment: "skipped Ski, cramp" })] }, sheet, NOW), { ok: true });
  assert.deepEqual(sheet.rows[1], [NOW, "Lindsay", 2, 1, "ski", "", "'skipped Ski, cramp"]);
});

test("the script's roster and sections match the page data", () => {
  assert.deepEqual([...S.ROSTER].sort(), DATA.people.map((p) => p.name).sort());
  for (let w = 2; w <= 7; w++) assert.equal(S.SECTIONS[w], C.session(w).sections.length, `week ${w}`);
  assert.deepEqual(Object.keys(S.SECTIONS).map(Number), [2, 3, 4, 5, 6, 7]);
});
