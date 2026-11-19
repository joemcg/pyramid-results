// Shared calculations and icons for the three Pyramid design options.
// Plain script. Needs scores.js loaded first. Exposes window.PyramidCalc.
(function () {
  "use strict";
  var NAMES = { echo: "Echo", row: "Row", ski: "Ski" };
  var MINUTES = [4, 3, 2, 1];
  var EVEN_PP = 0.5; // weak link only reported if a machine sits more than this many points below the group

  function sumKnown(a) { return a.reduce(function (s, v) { return v == null ? s : s + v; }, 0); }
  function hasNull(a) { return a.some(function (v) { return v == null; }); }
  function median(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  // Whole-number percentage, halves round towards zero so 12.5 reads as 12.
  function pctWhole(frac) { return Math.ceil(Math.abs(frac) * 100 - 0.5); }
  function signed(frac) {
    var w = pctWhole(frac);
    return (frac > 0 && w > 0 ? "+" : frac < 0 && w > 0 ? "-" : "") + w + "%";
  }
  function signedExact(frac) { // one decimal, used in detail panels
    var v = Math.round(frac * 1000) / 10;
    return (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v) + "%";
  }
  function ceilTarget(total, uplift) { return Math.ceil(Number((total * (1 + uplift)).toFixed(6))); }

  function compute() {
    var P = window.PYRAMID, M = P.machines, uplift = P.flatUplift || 0;
    var people = P.people.map(function (p, idx) {
      var t = p.tests && p.tests.week1;
      var o = { name: p.name, index: idx, tested: !!t, machines: {}, order: t ? t.order : [] };
      if (!t) return o;
      var incomplete = false, total = 0;
      M.forEach(function (m) {
        var pcs = t.pieces[m], miss = hasNull(pcs);
        var mt = miss ? null : sumKnown(pcs);
        if (miss) incomplete = true; else total += mt;
        var kick = null;
        if (!miss && pcs[0] > 0) kick = (pcs[3] / 1) / (pcs[0] / 4) - 1;
        o.machines[m] = { key: m, name: NAMES[m], pieces: pcs, total: mt, complete: !miss, kick: kick, share: null, groupShare: null, delta: null };
      });
      o.total = total; o.incomplete = incomplete; o.boardTotal = t.boardTotal;
      if (!incomplete && t.boardTotal != null && total !== t.boardTotal) {
        console.warn("Pyramid: " + p.name + " computed total " + total + " differs from board total " + t.boardTotal);
      }
      if (!incomplete) M.forEach(function (m) { o.machines[m].share = o.machines[m].total / total; });
      return o;
    });
    var tested = people.filter(function (p) { return p.tested; });
    var medians = {};
    M.forEach(function (m) {
      medians[m] = median(tested.filter(function (p) { return !p.incomplete; }).map(function (p) { return p.machines[m].share; }));
    });

    tested.forEach(function (o) {
      var ov = (P.overrides && P.overrides[o.name] && P.overrides[o.name].week8) || {};
      o.targets = {}; o.targetTotal = 0;
      M.forEach(function (m) {
        var mm = o.machines[m], custom = ov[m] != null;
        var v = custom ? ov[m] : (mm.total == null ? null : ceilTarget(mm.total, uplift));
        o.targets[m] = { value: v, custom: custom, label: custom ? "your target" : "+" + Math.round(uplift * 100) + "% on week 1" };
        if (v != null) o.targetTotal += v;
        if (mm.share != null) { mm.groupShare = medians[m]; mm.delta = mm.share - medians[m]; }
      });

      // Kick insight: strongest finish among complete machines.
      var ks = M.filter(function (m) { return o.machines[m].kick != null; });
      var best = null;
      ks.forEach(function (m) { if (best == null || o.machines[m].kick > o.machines[best].kick) best = m; });
      o.kickBest = best;
      if (best == null) {
        o.kickInsight = "Not enough data yet to measure your finish.";
      } else {
        var k = o.machines[best].kick, w = pctWhole(k), nm = NAMES[best];
        if (k > 0 && w > 0) o.kickInsight = "You finished strongest on the " + nm + ": 1-min pace " + w + "% above your 4-min pace.";
        else if (w === 0) o.kickInsight = "Your best finish was the " + nm + ": 1-min pace level with your 4-min pace.";
        else o.kickInsight = "You faded on every machine. Your best finish was the " + nm + ": 1-min pace " + w + "% below your 4-min pace.";
      }

      // Balance insight: furthest below group median share.
      var weak = null;
      if (!o.incomplete) M.forEach(function (m) { if (weak == null || o.machines[m].delta < o.machines[weak].delta) weak = m; });
      if (weak == null) {
        o.weak = null; o.balanceInsight = "Not enough data yet to measure your balance.";
      } else if (o.machines[weak].delta * 100 > -EVEN_PP) {
        o.weak = null; o.balanceInsight = "Evenly balanced: no machine sits more than half a percentage point below the group.";
      } else {
        o.weak = weak;
        o.balanceInsight = NAMES[weak] + " is your weak link: " + Math.round(o.machines[weak].share * 100) + "% of your total vs " + Math.round(medians[weak] * 100) + "% for the group.";
      }
    });

    var testedCount = tested.length;
    var sorted = people.slice().sort(function (a, b) { return (b.tested ? 1 : 0) - (a.tested ? 1 : 0) || a.index - b.index; });
    return { people: sorted, tested: tested, testedCount: testedCount, count: people.length, medians: medians,
             machines: M, names: NAMES, minutes: MINUTES, uplift: uplift };
  }

  var ICONS = {
    echo: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9.5 8h5l4 9M9.5 8 8 5.5H6M14.5 8l1-3h2.5M9.5 8l3 9"/>',
    row: '<path d="M2.5 20h19"/><circle cx="15" cy="5.5" r="1.7"/><path d="M14 8 10.5 14M10.5 14h5M10.5 14 8 17.5H6M14 9.5l4.5 1.5"/><path d="M5 17.5v2.5"/>',
    ski: '<path d="M12 3v14M8 20h8M12 17v3"/><path d="M6 5c-1 5 1.500 9 6 10M18 5c1 5-1.500 9-6 10"/><circle cx="6" cy="4.500" r="1"/><circle cx="18" cy="4.500" r="1"/>',
    kick: '<path d="M3 18l5.500-5.500 3.500 3.500L20 7.500"/><path d="M14.500 7H20.500v6"/>',
    balance: '<path d="M12 4v16M7.500 20h9M5 7h14"/><path d="M5 7 2.500 13.500a2.500 2.500 0 0 0 5 0zM19 7l-2.500 6.500a2.500 2.500 0 0 0 5 0z"/>',
    target: '<path d="M6 21V3.500"/><path d="M6 4.500h12l-2.500 3.500 2.500 3.500H6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.500l3.500 2"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || "") + '" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || "") + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fig(v) { return v == null ? "–" : String(v); }

  window.PyramidCalc = { compute: compute, icon: icon, esc: esc, fig: fig, signed: signed, signedExact: signedExact,
                         pctWhole: pctWhole, median: median, NAMES: NAMES, MINUTES: MINUTES };
})();
