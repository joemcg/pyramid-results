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

test("pace goal: calories from holding the bottom of the target range for 13 minutes", () => {
  const p = clone(person("Matt"));
  p.paces = { echo: { target: [235, 258], recovery: [146, 168] }, row: { target: [1254, 1373], recovery: [896, 1015] }, ski: { target: [876, 959], recovery: [626, 709] } };
  const g = C.paceGoals(p);
  assert.equal(g.row, 272, "1254 cal/hr x 13/60 = 271.7");
  assert.equal(g.ski, 190, "876 x 13/60 = 189.8");
  assert.equal(g.echo, 153, "235 W x 3 x 13/60 = 152.75");
  assert.equal(g.total, 615);
  assert.equal(C.paceGoals(person("Matt")), null, "no paces, no goal");
});

test("sessionWeek follows the phone's local date from the 23 Nov 2026 start", () => {
  const S = "2026-11-23";
  assert.deepEqual(C.sessionWeek(new Date(2026, 10, 22, 23, 59), S), { week: 2, upcoming: true });
  assert.deepEqual(C.sessionWeek(new Date(2026, 10, 23, 0, 1), S), { week: 2, upcoming: false });
  assert.equal(C.sessionWeek(new Date(2026, 10, 29, 23, 59), S).week, 2);
  assert.equal(C.sessionWeek(new Date(2026, 10, 30, 0, 0), S).week, 3);
  assert.equal(C.sessionWeek(new Date(2026, 11, 28), S).week, 7);
  assert.equal(C.sessionWeek(new Date(2027, 0, 4), S).week, 8);
});

test("session gives the sections per machine for cycle weeks only", () => {
  const w2 = C.session(2);
  assert.equal(w2.sets, 2);
  assert.equal(w2.pattern, "1:00 target, 1:00 recovery, twice per machine");
  assert.equal(C.session(4).pattern, "1:30 target, 1:00 recovery, twice per machine");
  assert.deepEqual(w2.sections.map((s) => [s.set, s.label, s.block]), [[1, "Set 1", "4:00"], [2, "Set 2", "4:00"]]);
  assert.deepEqual(C.session(4).sections.map((s) => s.block), ["5:00", "5:00"]);
  const w7 = C.session(7);
  assert.deepEqual(w7.sections.map((s) => [s.set, s.label, s.block]), [[1, "Round 1, 4:00", "4:30"], [2, "Round 2, 3:00", "3:30"], [3, "Tough minute", "1:00"]]);
  assert.deepEqual(w7.sections.map((s) => s.piece), ["4:00 target", "3:00 target", "1:00 tough minute"]);
  assert.equal(w7.machineRest, "1:00 rest after each round");
  assert.equal(C.session(1), null);
  assert.equal(C.session(8), null);
});

test("parseCalories accepts whole numbers 1 to 999 and treats blank as no entry", () => {
  assert.deepEqual(C.parseCalories(" 45 "), { ok: true, value: 45 });
  assert.deepEqual(C.parseCalories("045"), { ok: true, value: 45 });
  assert.deepEqual(C.parseCalories("999"), { ok: true, value: 999 });
  assert.deepEqual(C.parseCalories(""), { ok: true, value: null });
  assert.deepEqual(C.parseCalories("   "), { ok: true, value: null });
  for (const bad of ["0", "1000", "45.5", "4e1", "-3", "abc", "+5"]) assert.equal(C.parseCalories(bad).ok, false, bad);
});

test("buildPayload keeps filled sections and comment-only sections, trims and caps comments, and rejects any bad value", () => {
  const good = C.buildPayload("Lindsay", 2, {
    "1-ski": { calories: "51", comment: " felt good " },
    "2-ski": { calories: "", comment: "" },
    "2-row": { calories: "", comment: "comment without calories" },
  });
  assert.deepEqual(good, { ok: true, body: { name: "Lindsay", week: 2, rows: [{ set: 1, machine: "ski", calories: 51, comment: "felt good" }, { set: 2, machine: "row", calories: null, comment: "comment without calories" }] } });
  const long = C.buildPayload("Lindsay", 2, { "1-echo": { calories: "44", comment: "x".repeat(300) } });
  assert.equal(long.body.rows[0].comment.length, 280);
  assert.deepEqual(C.buildPayload("Lindsay", 2, { "1-echo": { calories: "44.5", comment: "" }, "1-row": { calories: "60", comment: "" } }), { ok: false, bad: ["1-echo"] });
});

test("sessionSteps spells out a two-set week in the person's machine order", () => {
  const T = (time) => ({ kind: "target", time }), R = (time) => ({ kind: "recovery", time });
  const p2 = [T("1:00"), R("1:00"), T("1:00"), R("1:00")];
  const m = (machine, parts) => ({ type: "machine", machine, parts });
  const set = (n) => [{ type: "heading", text: "Set " + n }, m("ski", p2), { type: "rest", time: "1:00" }, m("echo", p2), { type: "rest", time: "1:00" }, m("row", p2)];
  assert.deepEqual(C.sessionSteps(2, ["ski", "echo", "row"]), [...set(1), { type: "rest", time: "4:00" }, ...set(2)]);
  const w5 = C.sessionSteps(5, ["echo", "row", "ski"]);
  assert.deepEqual(w5.slice(0, 4), [{ type: "heading", text: "Set 1" }, m("echo", [T("1:30"), R("1:00"), T("1:00"), R("0:30")]), m("row", [T("1:30"), R("1:00"), T("1:00"), R("0:30")]), m("ski", [T("1:30"), R("1:00"), T("1:00"), R("0:30")])]);
  assert.deepEqual(w5[4], { type: "rest", time: "5:00" });
  assert.deepEqual(C.sessionSteps(6, ["echo", "row", "ski"])[1].parts, [T("2:00"), R("0:30"), T("1:00"), R("0:30")]);
});

test("sessionSteps spells out week 7 round by round", () => {
  const steps = C.sessionSteps(7, ["row", "ski", "echo"]);
  assert.deepEqual(steps.filter((s) => s.type === "heading").map((s) => s.text), ["Round 1", "Round 2", "Round 3: tough minute"]);
  assert.deepEqual(steps[1], { type: "machine", machine: "row", parts: [{ kind: "target", time: "4:00" }, { kind: "recovery", time: "0:30" }] });
  assert.deepEqual(steps[4], { type: "rest", time: "1:00" });
  assert.deepEqual(steps[steps.length - 1], { type: "machine", machine: "echo", parts: [{ kind: "tough", time: "1:00" }] });
  assert.equal(steps.filter((s) => s.type === "rest").length, 2);
  assert.equal(C.sessionSteps(1, ["row", "ski", "echo"]), null);
});

test("sectionPlan: week 2 block is 2 min at target plus 2 min at recovery; Echo watts x3; none for a tough minute", () => {
  const p = { name: "X", tests: { week1: null }, paces: { echo: { target: [166, 182], recovery: [103, 119] }, row: { target: [706, 773], recovery: [504, 571] } } };
  const e = C.sectionPlan(p, 2, 1, "echo");
  assert.equal(e.lo.toFixed(2), ((166 + 103) * 3 / 30).toFixed(2));
  assert.equal(e.hi.toFixed(2), ((182 + 119) * 3 / 30).toFixed(2));
  assert.equal(C.sectionPlan(p, 2, 2, "row").lo, (706 + 504) / 30);
  assert.equal(C.sectionPlan(p, 2, 1, "ski"), null, "no paces for that machine");
  assert.equal(C.sectionPlan(p, 7, 3, "row"), null, "tough minute has no plan");
  assert.equal(C.sectionPlan(p, 3, 1, "row").lo, (1.5 * 706 + 1 * 504 + 1 * 706 + 1 * 504) / 60);
});

test("sessionReport: per machine in the person's order, status from the plan, comments de-duplicated; summary counts", () => {
  const p = { name: "X", tests: { week1: { order: ["row", "ski", "echo"] } }, paces: { echo: { target: [100, 110], recovery: [60, 70] }, row: { target: [600, 660], recovery: [360, 420] }, ski: { target: [600, 660], recovery: [360, 420] } } };
  // Plans: echo 16-18, row and ski 32-36 calories per block.
  const rows = [
    { name: "X", set: 1, machine: "echo", calories: 17, comment: "" }, { name: "X", set: 2, machine: "echo", calories: 16, comment: "" },
    { name: "X", set: 1, machine: "row", calories: 40, comment: "easy" }, { name: "X", set: 2, machine: "row", calories: 41, comment: "easy" },
    { name: "X", set: 1, machine: "ski", calories: 30, comment: "" }, { name: "X", set: 2, machine: "ski", calories: 31, comment: "" },
    { name: "Y", set: 1, machine: "row", calories: 99, comment: "" }
  ];
  const r = C.sessionReport(p, 2, rows);
  assert.deepEqual(r.machines.map((m) => m.machine), ["row", "ski", "echo"]);
  assert.deepEqual(r.machines.map((m) => m.status), ["above", "below", "on"]);
  assert.deepEqual(r.machines[0].comments, ["easy"]);
  assert.equal(r.machines[0].vsPlan.toFixed(4), (40.5 / 34 - 1).toFixed(4));
  assert.equal(C.sessionReport({ name: "Z", paces: p.paces }, 2, rows), null);
  assert.deepEqual(C.sessionSummary([r]), { people: 1, on: 1, above: 1, below: 1, machines: 3, held: 2, pairs: 3 });
});
