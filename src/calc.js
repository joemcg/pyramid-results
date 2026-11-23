// Pure calculations for the Pyramid results page. Plain script: sets globalThis.PyramidCalc
// and also exports for Node (tests). No DOM.
(function () {
  "use strict";

  var MACHINES = ["echo", "row", "ski"];
  var NAMES = { echo: "Echo", row: "Row", ski: "Ski" };
  var MINUTES = [4, 3, 2, 1];
  var EVEN_PP = 0.005; // weak link only reported if a machine is more than 0.5 points below the group median

  function hasNull(a) { return a.some(function (v) { return v == null; }); }
  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function median(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function ceilTarget(total, uplift) { return Math.ceil(Number((total * (1 + uplift)).toFixed(6))); }

  // Totals for one test. A machine is complete only if all four pieces are recorded.
  // total is the sum of complete machines; complete is true only when all machines are.
  function summarise(test) {
    var machines = {}, total = 0, complete = true;
    MACHINES.forEach(function (m) {
      var pcs = (test && test.pieces && test.pieces[m]) || [null, null, null, null];
      var ok = !hasNull(pcs);
      machines[m] = { key: m, name: NAMES[m], pieces: pcs, total: ok ? sum(pcs) : null, complete: ok };
      if (ok) total += machines[m].total; else complete = false;
    });
    return { machines: machines, total: total, complete: complete, order: (test && test.order) || [] };
  }

  // The order the person used the machines. Falls back to Echo, Row, Ski if missing or not a full set.
  function machineOrder(test) {
    var o = test && test.order;
    var valid = Array.isArray(o) && o.length === MACHINES.length &&
      MACHINES.every(function (m) { return o.indexOf(m) >= 0; });
    return valid ? o.slice() : MACHINES.slice();
  }

  // Machine-mix segments in the order the machines were used. Empty if the test is incomplete.
  function mixSegments(test) {
    var s = summarise(test);
    if (!s.complete || s.total <= 0) return [];
    return machineOrder(test).map(function (m) {
      return { machine: m, name: NAMES[m], total: s.machines[m].total, share: s.machines[m].total / s.total };
    });
  }

  // People for the group list: tested first, then untested, each alphabetical by name.
  function groupOrder(people, testKey) {
    function tested(p) { return !!(p.tests && p.tests[testKey]); }
    return people.slice().sort(function (a, b) {
      return (tested(b) ? 1 : 0) - (tested(a) ? 1 : 0) || a.name.localeCompare(b.name);
    });
  }

  // Training paces from the official calculator, in the order the machines were used. null if none recorded.
  var PACE_UNITS = { echo: "W", row: "cal/hr", ski: "cal/hr" };
  function paceRows(person) {
    if (!person || !person.paces) return null;
    var w1 = person.tests && person.tests.week1;
    return machineOrder(w1).filter(function (m) { return person.paces[m]; }).map(function (m) {
      return { machine: m, name: NAMES[m], unit: PACE_UNITS[m], target: person.paces[m].target, recovery: person.paces[m].recovery };
    });
  }

  // People tabs: everyone alphabetical by name.
  function tabOrder(people) {
    return people.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  // Week-8 goal if the person held the bottom of their Target range for all 13 minutes.
  // Row and Ski paces are cal/hr; Echo is watts, at 3 cal/hr per watt (the calculator's own pattern).
  var TEST_MINUTES = 13, CALHR_PER_WATT = 3;
  function paceGoals(person) {
    if (!person || !person.paces) return null;
    var out = { total: 0 };
    MACHINES.forEach(function (m) {
      var pace = person.paces[m] && person.paces[m].target && person.paces[m].target[0];
      if (pace == null) { out[m] = null; return; }
      var calhr = m === "echo" ? pace * CALHR_PER_WATT : pace;
      out[m] = Math.round(calhr * TEST_MINUTES / 60);
      out.total += out[m];
    });
    return out;
  }

  function testedCount(people, testKey) {
    var n = people.filter(function (p) { return p.tests && p.tests[testKey]; }).length;
    return { tested: n, of: people.length };
  }

  // Kick: 1-minute calories per minute against the 4-minute rate, as a fraction. null if the machine is incomplete.
  function kick(test) {
    var s = summarise(test), out = {};
    MACHINES.forEach(function (m) {
      var mm = s.machines[m], p = mm.pieces;
      out[m] = mm.complete && p[0] > 0 ? p[3] / (p[0] / 4) - 1 : null;
    });
    return out;
  }

  // Each complete machine's share of the complete machines' total. Incomplete machines are null.
  function shares(test) {
    var s = summarise(test), out = { echo: null, row: null, ski: null };
    if (s.total > 0) MACHINES.forEach(function (m) { if (s.machines[m].complete) out[m] = s.machines[m].total / s.total; });
    return out;
  }

  // Median share of total per machine, from people whose test is complete.
  function groupMedianShares(people, testKey) {
    var out = {};
    var rows = people.filter(function (p) { return p.tests && p.tests[testKey] && summarise(p.tests[testKey]).complete; })
      .map(function (p) { return shares(p.tests[testKey]); });
    MACHINES.forEach(function (m) { out[m] = median(rows.map(function (r) { return r[m]; })); });
    return out;
  }

  // Balance: weak link is the machine furthest below the group median share, if more than 0.5 points below.
  // Incomplete machines are skipped; the group medians are rescaled to the machines that remain.
  function balance(test, medians) {
    var sh = shares(test), used = MACHINES.filter(function (m) { return sh[m] != null && medians && medians[m] != null; });
    // Only rescale when a machine is set aside; the three medians need not sum to exactly 1.
    var medSum = used.length === MACHINES.length ? 1 : used.reduce(function (t, m) { return t + medians[m]; }, 0);
    var med = {}, deltas = {}, weak = null;
    MACHINES.forEach(function (m) {
      med[m] = used.indexOf(m) >= 0 && medSum > 0 ? medians[m] / medSum : null;
      deltas[m] = med[m] != null && used.length > 1 ? sh[m] - med[m] : null;
      if (deltas[m] != null && (weak == null || deltas[m] < deltas[weak])) weak = m;
    });
    if (weak != null && !(deltas[weak] < -EVEN_PP)) weak = null;
    return { shares: used.length > 1 ? sh : { echo: null, row: null, ski: null }, medians: med, deltas: deltas, weakLink: weak };
  }

  // Week-8 targets: per-machine override, else ceil(week-1 total x (1 + uplift)).
  function targets(person, flatUplift, overrides) {
    var s = summarise(person.tests.week1);
    var ov = (overrides && overrides[person.name] && overrides[person.name].week8) || {};
    var out = {}, total = 0;
    MACHINES.forEach(function (m) {
      var custom = ov[m] != null, mm = s.machines[m];
      var v = custom ? ov[m] : (mm.complete ? ceilTarget(mm.total, flatUplift || 0) : null);
      out[m] = { value: v, source: custom ? "override" : "uplift" };
      if (v != null) total += v;
    });
    out.total = total;
    out.complete = MACHINES.every(function (m) { return out[m].value != null; });
    return out;
  }

  // Fractional change from week 1 to week 8, per machine and overall. null with no complete retest.
  function improvement(person) {
    var t1 = person.tests && person.tests.week1, t8 = person.tests && person.tests.week8;
    if (!t1 || !t8) return null;
    var a = summarise(t1), b = summarise(t8), out = {};
    function change(x, y) { return x > 0 ? y / x - 1 : null; }
    MACHINES.forEach(function (m) {
      out[m] = a.machines[m].complete && b.machines[m].complete ? change(a.machines[m].total, b.machines[m].total) : null;
    });
    out.total = a.complete && b.complete ? change(a.total, b.total) : null;
    return out;
  }

  function improvementRanking(people) {
    return people.map(function (p) { var i = improvement(p); return i && i.total != null ? { name: p.name, pct: i.total } : null; })
      .filter(Boolean)
      .sort(function (x, y) { return y.pct - x.pct; });
  }

  // The programme, in our own words. Minutes are target / recovery / rest.
  var PROGRAMME = [
    { week: 1, kind: "test", target: 30, recovery: 0, rest: 3,
      structure: "The test: 4, 3, 2 and 1 minute max-calorie efforts on Echo, Row and Ski in turn.",
      purpose: "Set your baseline. Your score is total calories.",
      details: ["Do 4, 3, 2 and 1 minute efforts for as many calories as you can on one machine.", "Rest 1 minute after each round, then move to the next machine.", "The clock runs for 33 minutes in all.", "Score: total calories across all 12 efforts."] },
    { week: 2, kind: "cycle", session: { sets: 2, pattern: "1:00 target, 1:00 recovery, twice", machineRest: "1:00", setRest: "4:00", sections: [{ set: 1, label: "Set 1", block: "4:00" }, { set: 2, label: "Set 2", block: "4:00" }] }, target: 12, recovery: 12, rest: 12,
      structure: "2 sets. On each machine: 1 min target pace, 1 min recovery pace, twice.",
      purpose: "Learn your paces and keep moving during recovery.",
      details: ["On each machine: 1 min target pace, 1 min recovery pace, 1 min target pace, 1 min recovery pace.", "1 min rest between machines.", "4 min rest after each set, then repeat."] },
    { week: 3, kind: "cycle", session: { sets: 2, pattern: "1:30 target, 1:00 recovery, 1:00 target, 1:00 recovery", machineRest: "1:00", setRest: "4:00", sections: [{ set: 1, label: "Set 1", block: "4:30" }, { set: 2, label: "Set 2", block: "4:30" }] }, target: 15, recovery: 12, rest: 12,
      structure: "As week 2, but the first target piece on each machine is 1:30.",
      purpose: "More time above target pace.",
      details: ["On each machine: 1:30 target, 1 min recovery, 1 min target, 1 min recovery.", "1 min rest between machines.", "4 min rest after each set, 2 sets in all."] },
    { week: 4, kind: "cycle", session: { sets: 2, pattern: "1:30 target, 1:00 recovery, twice", machineRest: "1:00", setRest: "4:00", sections: [{ set: 1, label: "Set 1", block: "5:00" }, { set: 2, label: "Set 2", block: "5:00" }] }, target: 18, recovery: 12, rest: 12,
      structure: "Both target pieces on each machine are 1:30.",
      purpose: "More time above target pace again.",
      details: ["On each machine: 1:30 target, 1 min recovery, 1:30 target, 1 min recovery.", "1 min rest between machines.", "4 min rest after each set, 2 sets in all."] },
    { week: 5, kind: "cycle", session: { sets: 2, pattern: "1:30 target, 1:00 recovery, 1:00 target, 0:30 recovery", machineRest: "none", setRest: "5:00", sections: [{ set: 1, label: "Set 1", block: "4:00" }, { set: 2, label: "Set 2", block: "4:00" }] }, target: 15, recovery: 9, rest: 10,
      structure: "2 sets with no rest between machines: 1:30 target, 1 min recovery, 1 min target, 30s recovery.",
      purpose: "Practise transitions and getting back to working pace fast.",
      details: ["Go straight from one machine to the next with no rest.", "On each machine: 1:30 target, 1 min recovery, 1 min target, 30s recovery.", "5 min rest after each set, 2 sets in all."] },
    { week: 6, kind: "cycle", session: { sets: 2, pattern: "2:00 target, 0:30 recovery, 1:00 target, 0:30 recovery", machineRest: "none", setRest: "5:00", sections: [{ set: 1, label: "Set 1", block: "4:00" }, { set: 2, label: "Set 2", block: "4:00" }] }, target: 18, recovery: 6, rest: 10,
      structure: "On each machine: 2 min target, 30s recovery, 1 min target, 30s recovery.",
      purpose: "Less recovery and more sustained work.",
      details: ["Go straight from one machine to the next with no rest.", "On each machine: 2 min target, 30s recovery, 1 min target, 30s recovery.", "5 min rest after each set, 2 sets in all."] },
    { week: 7, kind: "cycle", session: { sets: 1, pattern: "4:00 target + 0:30 recovery, then 3:00 target + 0:30 recovery, then 1 tough minute", machineRest: "1:00 after each round", setRest: "none", sections: [{ set: 1, label: "Round 1, 4:00", block: "4:30" }, { set: 2, label: "Round 2, 3:00", block: "3:30" }, { set: 3, label: "Tough minute", block: "1:00" }] }, target: 24, recovery: 3, rest: 2,
      structure: "1 set: 4 min then 3 min target pieces on each machine, then 1 tough minute on each.",
      purpose: "The last hard push before the retest, ending with a burnout like the end of the test.",
      details: ["4 min target plus 30s recovery on each machine, then 1 min rest.", "3 min target plus 30s recovery on each machine, then 1 min rest.", "Finish with 1 tough minute on each machine. The 3 tough minutes count as target time."] },
    { week: 8, kind: "test", target: 30, recovery: 0, rest: 3,
      structure: "The retest: same as week 1.",
      purpose: "Compare with your week 1.",
      details: ["Same format as week 1: 4, 3, 2 and 1 minute efforts on each machine, 1 min rest after each round.", "Compare each machine and your total with week 1."] }
  ];


  // Session week from the phone's local calendar date. cycleStart is the Monday week 2 begins.
  var DAY_MS = 86400000;
  function sessionWeek(today, cycleStart) {
    var p = String(cycleStart).split("-").map(Number);
    var start = Date.UTC(p[0], p[1] - 1, p[2]);
    var day = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var days = Math.round((day - start) / DAY_MS);
    if (days < 0) return { week: 2, upcoming: true };
    return { week: 2 + Math.floor(days / 7), upcoming: false };
  }
  // A cycle week's session (weeks 2 to 7), or null.
  function session(week) {
    var w = PROGRAMME.filter(function (x) { return x.week === week && x.session; })[0];
    if (!w) return null;
    var s = w.session;
    return { week: week, sets: s.sets, pattern: s.pattern, machineRest: s.machineRest, setRest: s.setRest,
      sections: s.sections.map(function (x) { return { set: x.set, label: x.label, block: x.block }; }) };
  }


  // Session results entry. Calories: whole number 1 to 999 for the whole block; blank means not entered.
  var COMMENT_MAX = 280;
  function parseCalories(text) {
    var t = String(text == null ? "" : text).trim();
    if (t === "") return { ok: true, value: null };
    if (!/^\d+$/.test(t)) return { ok: false };
    var v = parseInt(t, 10);
    return v >= 1 && v <= 999 ? { ok: true, value: v } : { ok: false };
  }
  // entries: { "<set>-<machine>": { calories, comment } }. Blank sections are dropped; any bad value rejects all.
  function buildPayload(name, week, entries) {
    var rows = [], bad = [];
    Object.keys(entries).forEach(function (key) {
      var e = entries[key] || {}, c = parseCalories(e.calories);
      if (!c.ok) { bad.push(key); return; }
      if (c.value == null) return;
      var parts = key.split("-");
      rows.push({ set: Number(parts[0]), machine: parts[1], calories: c.value, comment: String(e.comment || "").trim().slice(0, COMMENT_MAX) });
    });
    return bad.length ? { ok: false, bad: bad } : { ok: true, body: { name: name, week: week, rows: rows } };
  }

  function programme() { return PROGRAMME; }
  // Longest week in minutes, so the programme chart scales to fit.
  function programmeScaleMax(rows) {
    return rows.reduce(function (mx, r) { return Math.max(mx, r.target + r.recovery + r.rest); }, 0);
  }
  // Tab id from a URL hash. Case-insensitive; unknown or malformed hashes fall back to "group".
  function routeFromHash(hash, ids) {
    var h;
    try { h = decodeURIComponent(String(hash || "").replace(/^#/, "")).toLowerCase(); } catch (e) { return "group"; }
    return ids.indexOf(h) >= 0 ? h : "group";
  }
  function programmeMinutes() {
    return PROGRAMME.map(function (w) { return { week: w.week, target: w.target, recovery: w.recovery, rest: w.rest }; });
  }

  // Insight text. Fractions in, strings out. Whole percentages round to nearest, halves away from zero (12.5 reads as 13).
  function pctWhole(frac) { return Math.round(Math.abs(frac) * 100); }
  function signed(frac) {
    var w = pctWhole(frac);
    return (frac > 0 && w > 0 ? "+" : frac < 0 && w > 0 ? "-" : "") + w + "%";
  }
  function signedExact(frac) {
    var v = Math.round(frac * 1000) / 10;
    return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v) + "%";
  }

  function kickInsight(k) {
    var best = null, any = false, allNeg = true;
    MACHINES.forEach(function (m) {
      if (k[m] == null) return;
      any = true;
      if (k[m] >= 0) allNeg = false;
      if (best == null || k[m] > k[best]) best = m;
    });
    if (!any) return { best: null, headline: "Not enough data to measure your finish", detail: "A machine needs all four pieces before its finish can be measured." };
    var explain = "Kick compares your 1-min pace with your 4-min pace. Above zero means you finished stronger.";
    if (allNeg) return { best: best, headline: "You faded on every machine", detail: explain + " Your best finish was the " + NAMES[best] + " at " + signed(k[best]) + "." };
    return { best: best, headline: "Strongest finish: " + NAMES[best] + ", " + signed(k[best]), detail: explain };
  }

  function balanceInsight(bal, medians) {
    var explain = "Each machine's share of your total, against the group median share.";
    var any = MACHINES.some(function (m) { return bal.shares[m] != null; });
    if (!any) return { weak: null, headline: "Not enough data to measure your balance", detail: "Balance needs every piece recorded." };
    if (bal.weakLink == null) return { weak: null, headline: "Evenly balanced", detail: explain + " No machine is more than half a percentage point below the group." };
    var w = bal.weakLink;
    return { weak: w, headline: "Weak link: " + NAMES[w],
      detail: explain + " " + NAMES[w] + " is " + (bal.shares[w] * 100).toFixed(1) + "% of your total against " + (bal.medians[w] * 100).toFixed(1) + "% for the group." };
  }

  var api = {
    MACHINES: MACHINES, NAMES: NAMES, MINUTES: MINUTES,
    summarise: summarise, testedCount: testedCount,
    machineOrder: machineOrder, mixSegments: mixSegments, groupOrder: groupOrder, tabOrder: tabOrder, paceRows: paceRows, paceGoals: paceGoals, kick: kick, shares: shares,
    groupMedianShares: groupMedianShares, balance: balance, targets: targets,
    improvement: improvement, improvementRanking: improvementRanking,
    programme: programme, sessionWeek: sessionWeek, session: session, parseCalories: parseCalories, buildPayload: buildPayload, programmeMinutes: programmeMinutes, programmeScaleMax: programmeScaleMax, routeFromHash: routeFromHash,
    pctWhole: pctWhole, signed: signed, signedExact: signedExact,
    kickInsight: kickInsight, balanceInsight: balanceInsight
  };
  globalThis.PyramidCalc = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
