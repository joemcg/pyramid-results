// The helper that turns the results Sheet's rows into a sessions entry.
const test = require("node:test");
const assert = require("node:assert/strict");
const { sessionFromValues, parseDate } = require("../scripts/sheet-to-session.js");

const HEAD = ["received", "name", "week", "set", "machine", "calories", "comment"];

test("keeps one week, the last save per section wins, unknown names are skipped, date is the latest", () => {
  const v = [HEAD,
    ["26/11/2026", "Joe", "2", "1", "row", "77"],
    ["26/11/2026", "Joe", "3", "1", "row", "70"],
    ["27/11/2026", "Joe", "2", "1", "row", "80", "resaved"],
    ["26/11/2026", "Sanna", "2", "2", "Ski", "", "skipped, cramp"],
    ["26/11/2026", "Nobody", "2", "1", "row", "5"]];
  const s = sessionFromValues(v, 2);
  assert.deepEqual(s.rows, [
    { name: "Joe", set: 1, machine: "row", calories: 80, comment: "resaved" },
    { name: "Sanna", set: 2, machine: "ski", calories: null, comment: "skipped, cramp" }]);
  assert.equal(s.skipped.length, 1);
  assert.equal(s.date, "2026-11-27");
});

test("dates read as dd/mm/yyyy or ISO", () => {
  assert.equal(parseDate("3/12/2026"), "2026-12-03");
  assert.equal(parseDate("2026-12-03T10:00:00Z"), "2026-12-03");
  assert.equal(parseDate(""), null);
});
