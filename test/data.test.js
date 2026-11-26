// Integrity checks on the live data in data/scores.js. Catches transcription slips from board photos.
const test = require("node:test");
const assert = require("node:assert/strict");

require("../data/scores.js");
const C = require("../src/calc.js");
const DATA = globalThis.PYRAMID;

test("every tested person's computed total matches their board total", () => {
  for (const p of DATA.people) {
    for (const [key, t] of Object.entries(p.tests)) {
      if (!t || t.boardTotal == null) continue;
      assert.equal(C.summarise(t).total, t.boardTotal, `${p.name} ${key}`);
    }
  }
});

test("every test has four pieces per machine and a full machine order", () => {
  for (const p of DATA.people) {
    for (const [key, t] of Object.entries(p.tests)) {
      if (!t) continue;
      assert.deepEqual([...t.order].sort(), [...DATA.machines].sort(), `${p.name} ${key} order`);
      for (const m of DATA.machines) assert.equal(t.pieces[m].length, 4, `${p.name} ${key} ${m}`);
    }
  }
});

test("Rich's board: Echo 138, Row 144, Ski 123", () => {
  const s = C.summarise(DATA.people.find((p) => p.name === "Rich").tests.week1);
  assert.deepEqual([s.machines.echo.total, s.machines.row.total, s.machines.ski.total, s.total], [138, 144, 123, 405]);
});

test("every person has a week1 and a week8 slot", () => {
  for (const p of DATA.people) assert.deepEqual(Object.keys(p.tests).sort(), ["week1", "week8"], p.name);
});

test("spreadsheet of 2026-11-19: machine totals for Jay, Jo and Joe", () => {
  const expected = { Jay: [152, 159, 151, 462], Jo: [104, 123, 103, 330], Joe: [123, 201, 136, 460] };
  for (const [name, want] of Object.entries(expected)) {
    const s = C.summarise(DATA.people.find((p) => p.name === name).tests.week1);
    assert.deepEqual([s.machines.echo.total, s.machines.row.total, s.machines.ski.total, s.total], want, name);
  }
});

test("every copied pace fits the calculator's pattern (catches copying slips)", () => {
  const band = { target: [1.365, 1.495], recovery: { echo: [0.845, 0.977], row: [0.976, 1.105], ski: [0.976, 1.105] } };
  let checked = 0;
  for (const p of DATA.people) {
    if (!p.paces) continue;
    const s = C.summarise(p.tests.week1);
    for (const m of DATA.machines) {
      const avg = s.machines[m].total / 13 * 60;
      const toUnit = (calhr) => (m === "echo" ? calhr / 3 : calhr);
      const want = { target: band.target, recovery: band.recovery[m] };
      for (const kind of ["target", "recovery"]) {
        p.paces[m][kind].forEach((v, i) => {
          const expect = toUnit(avg * want[kind][i]);
          assert.ok(Math.abs(v - expect) / expect < 0.015, `${p.name} ${m} ${kind}[${i}]: ${v} vs ~${expect.toFixed(0)}`);
          checked++;
        });
      }
    }
  }
  assert.equal(checked, 10 * 3 * 4, "paces present for all 10 tested people");
});

test("Lindsay's week 1 (2026-11-23): Echo 110, Row 150, Ski 128, started on the Ski", () => {
  const t = DATA.people.find((p) => p.name === "Lindsay").tests.week1;
  const s = C.summarise(t);
  assert.deepEqual([s.machines.echo.total, s.machines.row.total, s.machines.ski.total, s.total], [110, 150, 128, 388]);
  assert.equal(t.order[0], "ski");
});

test("Joel's week 1: Echo 131, Row 156, Ski 145", () => {
  const s = C.summarise(DATA.people.find((p) => p.name === "Joel").tests.week1);
  assert.deepEqual([s.machines.echo.total, s.machines.row.total, s.machines.ski.total, s.total], [131, 156, 145, 432]);
});

test("roster is the ten people in the group, Joel included", () => {
  assert.deepEqual(DATA.people.map((p) => p.name).sort(),
    ["Anto", "Jay", "Jo", "Joe", "Joel", "Julie", "Lindsay", "Matt", "Rich", "Sanna"]);
  assert.deepEqual(C.testedCount(DATA.people, "week1"), { tested: 10, of: 10 });
});

test("cycleStart is a real ISO date and resultsUrl is null or an Apps Script URL", () => {
  assert.match(DATA.cycleStart, /^\d{4}-\d{2}-\d{2}$/);
  const [y, m, d] = DATA.cycleStart.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  assert.deepEqual([dt.getFullYear(), dt.getMonth() + 1, dt.getDate()], [y, m, d]);
  assert.ok(DATA.resultsUrl === null || DATA.resultsUrl.startsWith("https://script.google.com/"), String(DATA.resultsUrl));
});
