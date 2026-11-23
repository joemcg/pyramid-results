// The Apps Script that saves session results, run in Node against a fake sheet.
const test = require("node:test");
const assert = require("node:assert/strict");

require("../data/scores.js");
const C = require("../src/calc.js");
const S = require("../apps-script/Code.js");
const DATA = globalThis.PYRAMID;
const NOW = new Date("2026-11-23T18:42:00Z");

function fakeSheet(rows = []) {
  return { rows, getLastRow() { return this.rows.length; }, appendRow(r) { this.rows.push(r); } };
}
const row = (over = {}) => ({ set: 1, machine: "ski", calories: 51, comment: "", ...over });

test("a good save writes the header once, then one row per section", () => {
  const sheet = fakeSheet();
  const res = S.handleSave({ name: "Lindsay", week: 2, rows: [row(), row({ set: 2, machine: "echo", calories: 44, comment: "legs gone" })] }, sheet, NOW);
  assert.deepEqual(res, { ok: true });
  assert.deepEqual(sheet.rows, [S.HEADER, [NOW, "Lindsay", 2, 1, "ski", 51, ""], [NOW, "Lindsay", 2, 2, "echo", 44, "legs gone"]]);
  S.handleSave({ name: "Lindsay", week: 2, rows: [row()] }, sheet, NOW);
  assert.equal(sheet.rows.filter((r) => r === S.HEADER).length, 1, "header written once");
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
  ];
  for (const body of bad) {
    const sheet = fakeSheet();
    const res = S.handleSave(body, sheet, NOW);
    assert.equal(res.ok, false, JSON.stringify(body));
    assert.equal(typeof res.error, "string");
    assert.equal(sheet.rows.length, 0, JSON.stringify(body));
  }
});

test("comments are kept as text and cut to 280 characters", () => {
  const sheet = fakeSheet();
  S.handleSave({ name: "Lindsay", week: 2, rows: [row({ comment: "=SUM(A1)" }), row({ machine: "row", comment: "y".repeat(300) })] }, sheet, NOW);
  assert.equal(sheet.rows[1][6], "'=SUM(A1)");
  assert.equal(sheet.rows[2][6].length, 280);
});

test("the script's roster and sections match the page data", () => {
  assert.deepEqual([...S.ROSTER].sort(), DATA.people.map((p) => p.name).sort());
  for (let w = 2; w <= 7; w++) assert.equal(S.SECTIONS[w], C.session(w).sections.length, `week ${w}`);
  assert.deepEqual(Object.keys(S.SECTIONS).map(Number), [2, 3, 4, 5, 6, 7]);
});
