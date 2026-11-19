// Unit tests for src/calc.js. Run: node --test test/
const test = require("node:test");
const assert = require("node:assert/strict");

require("./fixtures/four-boards.js");
const C = require("../src/calc.js");

const DATA = globalThis.PYRAMID;
const person = (name) => DATA.people.find((p) => p.name === name);
const near = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 0.001, `${msg}: ${actual} vs ${expected}`);
const clone = (x) => JSON.parse(JSON.stringify(x));

test("totals match the whiteboards", () => {
  const expected = {
    Matt: [112, 199, 139, 450],
    Julie: [76, 126, 105, 307],
    Sanna: [79, 112, 102, 293],
    Anto: [61, 106, 104, 271],
  };
  for (const [name, [echo, row, ski, total]] of Object.entries(expected)) {
    const s = C.summarise(person(name).tests.week1);
    assert.equal(s.machines.echo.total, echo, `${name} echo`);
    assert.equal(s.machines.row.total, row, `${name} row`);
    assert.equal(s.machines.ski.total, ski, `${name} ski`);
    assert.equal(s.total, total, `${name} total`);
    assert.equal(s.total, person(name).tests.week1.boardTotal, `${name} board total`);
    assert.equal(s.complete, true, `${name} complete`);
  }
});

test("tested count is 4 of 9", () => {
  assert.deepEqual(C.testedCount(DATA.people, "week1"), { tested: 4, of: 9 });
});

test("kick compares 1-min rate with 4-min rate", () => {
  const k = C.kick(person("Matt").tests.week1);
  near(k.echo, -1 / 12, "Matt echo");
  near(k.row, 0.05, "Matt row");
  near(k.ski, 14 / 14.25 - 1, "Matt ski");
  const s = C.kick(person("Sanna").tests.week1);
  near(s.echo, 0.125, "Sanna echo");
});

test("group median shares use tested people only", () => {
  const m = C.groupMedianShares(DATA.people, "week1");
  near(m.echo, (76 / 307 + 112 / 450) / 2, "echo median");
  near(m.row, (106 / 271 + 126 / 307) / 2, "row median");
  near(m.ski, (105 / 307 + 102 / 293) / 2, "ski median");
});

test("balance names the weak link, or none when within 0.5pp", () => {
  const medians = C.groupMedianShares(DATA.people, "week1");
  const weak = (name) => C.balance(person(name).tests.week1, medians).weakLink;
  assert.equal(weak("Matt"), "ski");
  assert.equal(weak("Sanna"), "row");
  assert.equal(weak("Anto"), "echo");
  assert.equal(weak("Julie"), null);
  const b = C.balance(person("Matt").tests.week1, medians);
  near(b.shares.ski, 139 / 450, "Matt ski share");
});

test("targets are ceil(+5%) per machine and sum to the overall target", () => {
  const t = C.targets(person("Matt"), DATA.flatUplift, {});
  assert.equal(t.echo.value, 118);
  assert.equal(t.row.value, 209);
  assert.equal(t.ski.value, 146);
  assert.equal(t.echo.source, "uplift");
  assert.equal(t.total, 473);
});

test("targets do not overshoot on floating-point products", () => {
  const p = { name: "Round", tests: { week1: { order: ["echo", "row", "ski"], pieces: { echo: [40, 30, 20, 10], row: [40, 30, 20, 10], ski: [40, 30, 20, 10] } } } };
  const t = C.targets(p, 0.05, {});
  assert.equal(t.echo.value, 105, "100 x 1.05 is 105, not 106");
});

test("an override replaces that machine's target and feeds the total", () => {
  const t = C.targets(person("Julie"), DATA.flatUplift, { Julie: { week8: { row: 140 } } });
  assert.equal(t.row.value, 140);
  assert.equal(t.row.source, "override");
  assert.equal(t.echo.value, 80);
  assert.equal(t.ski.value, 111);
  assert.equal(t.total, 331);
});

test("a missing piece marks the test incomplete and is skipped by insights", () => {
  const t = clone(person("Matt").tests.week1);
  t.pieces.ski[2] = null;
  const s = C.summarise(t);
  assert.equal(s.complete, false);
  assert.equal(s.machines.ski.complete, false);
  assert.equal(s.machines.echo.complete, true);
  assert.equal(C.kick(t).ski, null);
  const medians = C.groupMedianShares(DATA.people, "week1");
  assert.notEqual(C.balance(t, medians).weakLink, "ski");
});

test("programme minutes per week", () => {
  const rows = C.programmeMinutes();
  const byWeek = Object.fromEntries(rows.map((r) => [r.week, [r.target, r.recovery, r.rest]]));
  assert.deepEqual(byWeek[2], [12, 12, 12]);
  assert.deepEqual(byWeek[3], [15, 12, 12]);
  assert.deepEqual(byWeek[4], [18, 12, 12]);
  assert.deepEqual(byWeek[5], [15, 9, 10]);
  assert.deepEqual(byWeek[6], [18, 6, 10]);
  assert.deepEqual(byWeek[7], [24, 3, 2]);
});

test("week-8 improvement and ranking appear only for people with a retest", () => {
  const people = clone(DATA.people);
  people.find((p) => p.name === "Matt").tests.week8 = { order: ["row", "ski", "echo"], pieces: { echo: [50, 34, 22, 12], row: [82, 60, 41, 22], ski: [58, 43, 27, 15] } };
  people.find((p) => p.name === "Julie").tests.week8 = { order: ["row", "ski", "echo"], pieces: { echo: [33, 23, 16, 8], row: [52, 38, 24, 12], ski: [42, 32, 21, 10] } };

  const matt = C.improvement(people.find((p) => p.name === "Matt"));
  near(matt.total, 466 / 450 - 1, "Matt total");
  near(matt.echo, 118 / 112 - 1, "Matt echo");
  assert.equal(C.improvement(people.find((p) => p.name === "Sanna")), null);

  const ranking = C.improvementRanking(people);
  assert.deepEqual(ranking.map((r) => r.name), ["Matt", "Julie"]);
  near(ranking[1].pct, 311 / 307 - 1, "Julie pct");
});

test("machine order follows the order the person used the machines", () => {
  assert.deepEqual(C.machineOrder(person("Matt").tests.week1), ["row", "ski", "echo"]);
  assert.deepEqual(C.machineOrder(person("Anto").tests.week1), ["ski", "echo", "row"]);
  assert.deepEqual(C.machineOrder({ pieces: {} }), ["echo", "row", "ski"], "missing order falls back to Echo, Row, Ski");
  assert.deepEqual(C.machineOrder({ order: ["row", "row", "ski"] }), ["echo", "row", "ski"], "invalid order falls back");
});

test("mix segments run in the order the machines were used", () => {
  const seg = C.mixSegments(person("Matt").tests.week1);
  assert.deepEqual(seg.map((s) => s.machine), ["row", "ski", "echo"]);
  near(seg[0].share, 199 / 450, "Matt row share");
  assert.deepEqual(C.mixSegments(person("Anto").tests.week1).map((s) => s.machine), ["ski", "echo", "row"]);
});

test("group order: tested people first, each group alphabetical", () => {
  assert.deepEqual(C.groupOrder(DATA.people, "week1").map((p) => p.name),
    ["Anto", "Julie", "Matt", "Sanna", "Jay", "Jo", "Joe", "Lindsay", "Rich"]);
});

test("balance skips an incomplete machine and compares the rest on rescaled medians", () => {
  const t = clone(person("Matt").tests.week1);
  t.pieces.ski[2] = null;
  const medians = C.groupMedianShares(DATA.people, "week1");
  const b = C.balance(t, medians);
  assert.equal(b.shares.ski, null);
  near(b.shares.echo, 112 / 311, "echo share of complete machines");
  assert.equal(b.weakLink, "echo", "Echo is furthest below once Ski is set aside");
});

test("a machine with no target marks the overall target incomplete", () => {
  const p = clone(person("Matt"));
  p.tests.week1.pieces.echo[0] = null;
  const t = C.targets(p, 0.05, {});
  assert.equal(t.echo.value, null);
  assert.equal(t.complete, false);
  assert.equal(t.total, 209 + 146);
  assert.equal(C.targets(person("Matt"), 0.05, {}).complete, true);
});

test("whole percentages round halves away from zero", () => {
  assert.equal(C.signed(0.125), "+13%");
  assert.equal(C.signed(-0.125), "-13%");
  assert.equal(C.signed(-1 / 12), "-8%");
});

test("balance explanation shows shares to one decimal place", () => {
  const medians = C.groupMedianShares(DATA.people, "week1");
  const bi = C.balanceInsight(C.balance(person("Matt").tests.week1, medians), medians);
  assert.match(bi.detail, /Ski is 30\.9% of your total against 34\.5% for the group/);
});

test("route from hash: known ids, case-insensitive, malformed falls back to group", () => {
  const ids = ["group", "programme", "matt"];
  assert.equal(C.routeFromHash("#Matt", ids), "matt");
  assert.equal(C.routeFromHash("#%E0", ids), "group");
  assert.equal(C.routeFromHash("#nobody", ids), "group");
  assert.equal(C.routeFromHash("", ids), "group");
});

test("programme chart scale comes from the longest week", () => {
  assert.equal(C.programmeScaleMax(C.programmeMinutes().filter((r) => r.week >= 2 && r.week <= 7)), 42);
  assert.equal(C.programmeScaleMax([{ week: 9, target: 40, recovery: 10, rest: 5 }]), 55);
});

test("pace rows follow machine order with units, or null without paces", () => {
  const p = clone(person("Matt"));
  p.paces = { echo: { target: [235, 258], recovery: [146, 168] }, row: { target: [1254, 1373], recovery: [896, 1015] }, ski: { target: [876, 959], recovery: [626, 709] } };
  const rows = C.paceRows(p);
  assert.deepEqual(rows.map((r) => r.machine), ["row", "ski", "echo"]);
  assert.deepEqual(rows[0], { machine: "row", name: "Row", unit: "cal/hr", target: [1254, 1373], recovery: [896, 1015] });
  assert.equal(rows[2].unit, "W");
  assert.equal(C.paceRows(person("Matt")), null);
});

test("tab order: everyone alphabetical by name, tested or not", () => {
  assert.deepEqual(C.tabOrder(DATA.people).map((p) => p.name),
    ["Anto", "Jay", "Jo", "Joe", "Julie", "Lindsay", "Matt", "Rich", "Sanna"]);
});
