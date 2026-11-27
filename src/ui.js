// Rendering for the Pyramid results page. Needs data/scores.js and src/calc.js loaded first.
(function () {
  "use strict";
  var C = globalThis.PyramidCalc, D = globalThis.PYRAMID;
  var M = C.MACHINES, NAMES = C.NAMES;
  var SOURCE_URL = "https://programs.trainingthinktank.com/pyramid-pace-calculator";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fig(v) { return v == null ? "–" : String(v); }
  function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  function rate(v) { return String(Math.round(v * 10) / 10); }
  function chip(m) { return '<span class="chip ' + m + '"><i></i>' + NAMES[m] + "</span>"; }

  var ICONS = {
    kick: '<path d="M3 18l5.5-5.5 3.5 3.5L20 7.5"/><path d="M14.5 7H20.5v6"/>',
    balance: '<path d="M12 4v16M7.5 20h9M5 7h14"/><path d="M5 7 2.5 13.5a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6.5a2.5 2.5 0 0 0 5 0z"/>',
    target: '<path d="M6 21V3.5"/><path d="M6 4.5h12l-2.5 3.5 2.5 3.5H6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  function icon(name) {
    return '<svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || "") + "</svg>";
  }

  var people = D.people.map(function (p, i) {
    var t1 = p.tests && p.tests.week1, t8 = p.tests && p.tests.week8;
    return { name: p.name, slug: slug(p.name), index: i, raw: p, tested: !!t1,
      s1: t1 ? C.summarise(t1) : null, s8: t8 ? C.summarise(t8) : null, imp: C.improvement(p) };
  });
  var medians = C.groupMedianShares(D.people, "week1");
  var count = C.testedCount(D.people, "week1");
  var ranking = C.improvementRanking(D.people);
  var hasWeek8 = ranking.length > 0;

  // ---------- small SVG helpers ----------
  // Push label positions apart so they stay readable.
  function spread(items, gap) {
    items.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
  }
  function niceStep(range, maxTicks) {
    var c = [1, 2, 5, 10, 20, 50];
    for (var i = 0; i < c.length; i++) if (range / c[i] <= maxTicks) return c[i];
    return 100;
  }

  // Machine mix as a labelled bar: segments in the order the machines were used, calories inside each.
  function mixBar(p) {
    var seg = C.mixSegments(p.raw.tests.week1);
    if (!seg.length) return "";
    var label = seg.map(function (q) { return q.name + " " + q.total + " (" + Math.round(q.share * 100) + "%)"; }).join(", ");
    return '<div class="mix" role="img" aria-label="' + esc(p.name) + ", in the order used: " + esc(label) + '">' +
      seg.map(function (q) { return '<span class="seg ' + q.machine + '" style="flex-grow:' + q.total + '" aria-hidden="true">' + q.total + "</span>"; }).join("") + "</div>";
  }

  function paceChart(s) {
    var W = 340, H = 168, L = 62, R = 34, T = 28, B = 38, pw = W - L - R, ph = H - T - B;
    var lines = M.map(function (m) {
      return { m: m, pts: s.machines[m].pieces.map(function (v, i) { return v == null ? null : { i: i, r: v / C.MINUTES[i] }; }) };
    });
    var all = [];
    lines.forEach(function (l) { l.pts.forEach(function (q) { if (q) all.push(q.r); }); });
    if (!all.length) return "";
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    var step = niceStep(Math.max(mx - mn, 1), 4), lo = Math.floor(mn / step) * step, hi = Math.ceil(mx / step) * step;
    if (hi === lo) hi = lo + step;
    function X(i) { return L + i * pw / 3; }
    function Y(v) { return T + ph - (v - lo) / (hi - lo) * ph; }
    var g = "";
    for (var v = lo; v <= hi + 1e-9; v += step) {
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="grid"/><text x="2" y="' + (Y(v) + 4).toFixed(1) + '" class="ax tick">' + v + "</text>";
    }
    C.MINUTES.forEach(function (mi, i) { g += '<text x="' + X(i).toFixed(1) + '" y="' + (T + ph + 16) + '" class="ax mid">' + mi + " min</text>"; });
    var body = "", lefts = [], rights = [];
    lines.forEach(function (l) {
      var d = "", first = null, last = null;
      l.pts.forEach(function (q) {
        if (!q) return;
        d += (d ? "L" : "M") + X(q.i).toFixed(1) + " " + Y(q.r).toFixed(1);
        if (!first) first = q; last = q;
      });
      if (!first) return;
      body += '<path d="' + d + '" class="ln s-' + l.m + '"/>';
      l.pts.forEach(function (q) { if (q) body += '<circle cx="' + X(q.i).toFixed(1) + '" cy="' + Y(q.r).toFixed(1) + '" r="3" class="f-' + l.m + '"/>'; });
      lefts.push({ y: Y(first.r) + 4, t: rate(first.r), m: l.m });
      rights.push({ y: Y(last.r) + 4, t: rate(last.r), m: l.m });
    });
    spread(lefts, 14); spread(rights, 14);
    lefts.forEach(function (o) { body += '<text x="' + (L - 7) + '" y="' + o.y.toFixed(1) + '" class="val end c-' + o.m + '">' + o.t + "</text>"; });
    rights.forEach(function (o) { body += '<text x="' + (W - R + 7) + '" y="' + o.y.toFixed(1) + '" class="val c-' + o.m + '">' + o.t + "</text>"; });
    var legend = "", lx = 112;
    M.forEach(function (m) { legend += '<rect x="' + lx + '" y="7" width="8" height="12" rx="2" class="f-' + m + '"/><text x="' + (lx + 12) + '" y="17" class="ax">' + NAMES[m] + "</text>"; lx += 62; });
    var desc = M.map(function (m) {
      return NAMES[m] + ": " + s.machines[m].pieces.map(function (v, i) { return v == null ? "none" : rate(v / C.MINUTES[i]); }).join(", ");
    }).join(". ");
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Pace profile in calories per minute for the 4, 3, 2 and 1 minute pieces. ' + esc(desc) + '">' +
      '<text x="2" y="17" class="ax">cal/min</text>' + legend + g + body +
      '<text x="' + (L + pw / 2) + '" y="' + (H - 4) + '" class="ax mid">Piece length</text></svg>';
  }

  function slopeChart(p) {
    var W = 340, H = 150, T = 30, B = 12, x1 = 120, x2 = 220, ph = H - T - B;
    var vals = [];
    M.forEach(function (m) { vals.push(p.s1.machines[m].total, p.s8.machines[m].total); });
    vals = vals.filter(function (v) { return v != null; });
    if (!vals.length) return "";
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi === lo) hi = lo + 1;
    function Y(v) { return T + ph - (v - lo) / (hi - lo) * ph; }
    var body = "", ls = [], rs = [], desc = [];
    M.forEach(function (m) {
      var a = p.s1.machines[m].total, b = p.s8.machines[m].total;
      if (a == null || b == null) return;
      body += '<line x1="' + x1 + '" y1="' + Y(a).toFixed(1) + '" x2="' + x2 + '" y2="' + Y(b).toFixed(1) + '" class="ln s-' + m + '"/>' +
        '<circle cx="' + x1 + '" cy="' + Y(a).toFixed(1) + '" r="3.5" class="f-' + m + '"/><circle cx="' + x2 + '" cy="' + Y(b).toFixed(1) + '" r="3.5" class="f-' + m + '"/>';
      ls.push({ y: Y(a) + 4, t: NAMES[m] + " " + a, m: m });
      rs.push({ y: Y(b) + 4, t: b + "  " + C.signedExact(b / a - 1), m: m });
      desc.push(NAMES[m] + " " + a + " to " + b);
    });
    spread(ls, 13); spread(rs, 13);
    ls.forEach(function (o) { body += '<text x="' + (x1 - 10) + '" y="' + o.y.toFixed(1) + '" class="val end c-' + o.m + '">' + o.t + "</text>"; });
    rs.forEach(function (o) { body += '<text x="' + (x2 + 10) + '" y="' + o.y.toFixed(1) + '" class="val c-' + o.m + '">' + o.t + "</text>"; });
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Calories by machine, week 1 to week 8. ' + esc(desc.join(". ")) + '">' +
      '<text x="' + x1 + '" y="18" class="ax mid">Week 1</text><text x="' + x2 + '" y="18" class="ax mid">Week 8</text>' + body + "</svg>";
  }

  function programmeChart() {
    var rows = C.programmeMinutes().filter(function (r) { return r.week >= 2 && r.week <= 7; });
    var W = 340, L = 40, R = 40, T = 30, rh = 24, H = T + rows.length * rh + 22, max = C.programmeScaleMax(rows) || 1, pw = W - L - R, sc = pw / max;
    var cols = [["target", "Target"], ["recovery", "Recovery"], ["rest", "Rest"]], body = "", legend = "", lx = 4;
    cols.forEach(function (c) { legend += '<rect x="' + lx + '" y="6" width="12" height="12" rx="2" class="pm-' + c[0] + '"/><text x="' + (lx + 16) + '" y="16" class="ax">' + c[1] + "</text>"; lx += 86; });
    var desc = [];
    rows.forEach(function (r, i) {
      var y = T + i * rh, x = L;
      body += '<text x="' + (L - 6) + '" y="' + (y + 15) + '" class="ax end">Wk ' + r.week + "</text>";
      cols.forEach(function (c) {
        var v = r[c[0]], w = v * sc;
        if (!v) return;
        body += '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="19" class="pm-' + c[0] + '"/>';
        if (w >= 15) body += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + 14) + '" class="seg ' + c[0] + '">' + v + "</text>";
        x += w;
      });
      body += '<text x="' + (x + 5).toFixed(1) + '" y="' + (y + 14) + '" class="val">' + (r.target + r.recovery + r.rest) + "</text>";
      desc.push("Week " + r.week + ": " + r.target + " target, " + r.recovery + " recovery, " + r.rest + " rest");
    });
    body += '<text x="' + (L + pw / 2) + '" y="' + (H - 4) + '" class="ax mid">Minutes</text>';
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Minutes per week at target, recovery and rest. ' + esc(desc.join(". ")) + '">' + legend + body + "</svg>";
  }

  // ---------- panels ----------
  function pieceRows(s) {
    var h = '<div class="r hd"><span></span>' + C.MINUTES.map(function (m) { return "<span>" + m + " min</span>"; }).join("") + "<span>Total</span></div>";
    return h + C.machineOrder({ order: s.order }).map(function (m, i) {
      var mm = s.machines[m], o = i + 1;
      return '<div class="r ' + m + '"><span class="nm"><span class="seq" aria-label="Done number ' + o + '">' + o + "</span>" + mm.name + "</span>" +
        mm.pieces.map(function (v) { return '<span class="p">' + fig(v) + "</span>"; }).join("") + '<span class="t">' + fig(mm.total) + "</span></div>";
    }).join("");
  }

  function kickList(k) {
    return "<ul>" + M.map(function (m) { return "<li>" + chip(m) + " <b>" + (k[m] == null ? "–" : C.signedExact(k[m])) + "</b></li>"; }).join("") + "</ul>";
  }
  function balList(bal) {
    return "<ul>" + M.map(function (m) {
      return "<li>" + chip(m) + " <b>" + (bal.shares[m] == null ? "–" : (bal.shares[m] * 100).toFixed(1) + "%") + "</b> vs " +
        (bal.medians[m] == null ? "–" : (bal.medians[m] * 100).toFixed(1) + "%") + "</li>";
    }).join("") + "</ul>";
  }

  function targetsBlock(p) {
    var t = C.targets(p.raw, D.flatUplift, D.overrides), pct = Math.round((D.flatUplift || 0) * 100);
    return '<div class="tg"><div class="hd2">' + icon("target") + "Week 8 targets</div><div class=\"tr\">" +
      C.machineOrder(p.raw.tests.week1).map(function (m) {
        var custom = t[m].source === "override";
        return '<div class="' + m + '"><span class="v">' + fig(t[m].value) + '</span><span class="l' + (custom ? " set" : "") + '">' + (custom ? "set by you" : "+" + pct + "% on week 1") + "</span></div>";
      }).join("") + '<div class="tot"><span class="v">' + t.total + '</span><span class="l">' + (t.complete ? "total" : "total, incomplete") + "</span></div></div>" +
      paceGoalRow(p) + "</div>";
  }

  // Second targets row: what holding target pace for the whole test would give.
  function paceGoalRow(p) {
    var g = C.paceGoals(p.raw);
    if (!g) return "";
    return '<div class="tr pg">' + C.machineOrder(p.raw.tests.week1).map(function (m) {
      return '<div class="' + m + '"><span class="v">' + fig(g[m]) + '</span><span class="l">at target pace</span></div>';
    }).join("") + '<div class="tot"><span class="v">' + g.total + '</span><span class="l">total</span></div></div>' +
      '<p class="foot">Top row: 5% up on week 1. Bottom row: holding the bottom of your target pace for all 13 minutes. A stretch goal.</p>';
  }

  function pacesBlock(p) {
    var rows = C.paceRows(p.raw);
    if (!rows || !rows.length) return "";
    function rng(r) { return r[0] + "–" + r[1]; }
    return '<div class="tg"><div class="hd2">' + icon("clock") + 'Training paces</div><div class="pc hd"><span></span><span>Target</span><span>Recovery</span></div>' +
      rows.map(function (r) {
        return '<div class="pc ' + r.machine + '"><span class="nm">' + r.name + '<small>' + r.unit + "</small></span><span>" + rng(r.target) + "</span><span>" + rng(r.recovery) + "</span></div>";
      }).join("") + '<p class="foot">From the official pace calculator, using your week 1 test.</p></div>';
  }

  function week8Block(p) {
    var imp = p.imp;
    var rows = C.machineOrder(p.raw.tests.week1).map(function (m) {
      var a = p.s1.machines[m].total, b = p.s8.machines[m].total;
      return '<div class="w8 ' + m + '"><span class="nm">' + NAMES[m] + "</span><span>" + fig(a) + "</span><span>" + fig(b) + "</span><span>" + (imp && imp[m] != null ? C.signedExact(imp[m]) : "–") + "</span></div>";
    }).join("");
    rows += '<div class="w8 sum"><span class="nm">Total</span><span>' + p.s1.total + "</span><span>" + p.s8.total + "</span><span>" + (imp && imp.total != null ? C.signedExact(imp.total) : "–") + "</span></div>";
    return '<div class="tg"><div class="hd2">' + icon("clock") + 'Week 8 retest</div><div class="w8 hd"><span></span><span>Week 1</span><span>Week 8</span><span>Change</span></div>' + rows + '<div class="scope">' + slopeChart(p) + "</div></div>";
  }


  // ---------- this week's session ----------
  var nowView = C.sessionWeek(new Date(), D.cycleStart);
  var SAVE_TIMEOUT_MS = 20000;
  var onWeekChange = []; // each mounted card re-renders when the phone's date moves into a new week
  function checkWeek() {
    var v = C.sessionWeek(new Date(), D.cycleStart);
    if (v.week === nowView.week && v.upcoming === nowView.upcoming) return;
    nowView = v;
    onWeekChange.forEach(function (f) { f(); });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") checkWeek(); });
  window.addEventListener("pageshow", checkWeek);
  window.addEventListener("focus", checkWeek);
  var RESULTS_URL = globalThis.PYRAMID_RESULTS_URL || D.resultsUrl || null;
  function canEnter(view) { return !!RESULTS_URL && !view.upcoming; }
  function lastWeekView(view) { return !view.upcoming && C.session(view.week - 1) ? { week: view.week - 1, upcoming: false, lastWeek: true } : null; }

  function sessionBlock(p, view) {
    var ses = C.session(view.week), rows = C.paceRows(p.raw);
    if (!ses || !rows || !rows.length) return "";
    function rng(r) { return r[0] + "–" + r[1]; }
    var head = view.upcoming ? "Next session: week " + view.week : "Week " + view.week + (view.lastWeek ? ", last week" : "");
    var sub = ses.sets > 1 ? ses.sets + " sets, " + ses.setRest + " rest between" + (ses.machineRest === "none" ? ", no rest between machines" : ", " + ses.machineRest + " rest between machines")
      : ses.sections.length + " rounds, " + ses.machineRest;
    // The blocks hold only what is needed at a glance between machines.
    var blocks = rows.map(function (r) {
      var pieces = ses.sets === 1 ? '<ul class="rounds">' + ses.sections.map(function (x) { return "<li>" + esc(x.piece || x.label) + "</li>"; }).join("") + "</ul>" : "";
      return '<div class="mb ' + r.machine + '" data-machine="' + r.machine + '" data-week="' + view.week + '"><h3>' + r.name + '</h3>' +
        '<div class="rg"><span class="k">Target</span><span class="v">' + rng(r.target) + '</span><span class="u">' + r.unit + "</span></div>" +
        '<div class="rg rec"><span class="k">Recovery</span><span class="v">' + rng(r.recovery) + '</span><span class="u">' + r.unit + "</span></div>" + pieces + "</div>";
    }).join("");
    // The whole session step by step, collapsed so the blocks stay the first thing seen.
    var byMachine = {};
    rows.forEach(function (r) { byMachine[r.machine] = r; });
    var steps = C.sessionSteps(view.week, rows.map(function (r) { return r.machine; })).map(function (st) {
      if (st.type === "heading") return "<h4>" + esc(st.text) + "</h4>";
      if (st.type === "rest") return '<p class="rest">Rest ' + st.time + "</p>";
      var r = byMachine[st.machine];
      return '<div class="stp ' + st.machine + '"><b>' + r.name + "</b><ul>" + st.parts.map(function (pt) {
        var what = pt.kind === "tough" ? "tough minute" : pt.kind;
        var pace = pt.kind === "target" ? rng(r.target) + " " + r.unit : pt.kind === "recovery" ? rng(r.recovery) + " " + r.unit : "all out";
        return '<li class="' + pt.kind + '"><span>' + pt.time + " " + what + "</span><span>" + pace + "</span></li>";
      }).join("") + "</ul></div>";
    }).join("");
    var full = '<details class="full"><summary>Full workout, step by step</summary><div class="steps">' + steps + "</div></details>";
    // Entry sits below all three blocks, so it never pushes the next machine's ranges off screen.
    var log = "";
    if (canEnter(view)) {
      log = '<details class="log"' + (view.lastWeek ? " open" : "") + '><summary>Log your results<span class="ls"></span></summary>' + rows.map(function (r) {
        return '<div class="lg ' + r.machine + '"><h4>' + r.name + "</h4>" + ses.sections.map(function (x) {
          var key = x.set + "-" + r.machine, id = "in-" + p.slug + "-" + view.week + "-" + key;
          var name = ses.sets === 1 ? x.label.replace(/, .*$/, "") : x.label;
          return '<div class="en"><label for="' + id + '">' + esc(name) + ", " + x.block + ' total</label>' +
            '<input id="' + id + '" class="cal" data-key="' + key + '" data-field="calories" inputmode="numeric" autocomplete="off" placeholder="cal">' +
            '<input class="cm" data-key="' + key + '" data-field="comment" maxlength="280" autocomplete="off" placeholder="Comment (optional)" aria-label="' + esc(name) + " comment, " + r.name + '"></div>';
        }).join("") + "</div>";
      }).join("") + '<div class="sv"><button type="button" class="save">Save</button><p class="st" role="status" aria-live="polite"></p></div></details>';
    }
    return '<section class="lcd ses" aria-label="' + esc(head) + '"><h2>' + esc(head) + '</h2><p class="pat">' + esc(ses.pattern) + '</p><p class="foot">' + esc(sub) + ".</p>" + full + blocks + log + "</section>";
  }

  // Browser storage is a convenience: every call may throw (private browsing) and the card still works.
  function store(key, value) {
    try { if (value === undefined) { var v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); } localStorage.setItem(key, JSON.stringify(value)); } catch (e) { return null; }
    return null;
  }
  function hhmm(d) { return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }

  // Renders and wires one person's session box; view switches between this week and last week.
  function mountSession(p, box) {
    var lw = null;
    function render(view) {
      lw = RESULTS_URL ? lastWeekView(nowView) : null;
      var card = sessionBlock(p, view);
      var link = "";
      if (lw && !view.lastWeek) link = '<button type="button" class="lnk" data-go="last">Log last week\'s session instead</button>';
      if (view.lastWeek) link = '<button type="button" class="lnk" data-go="now">Back to this week</button>';
      box.innerHTML = card ? card.replace(/<\/section>$/, link ? '<p class="sw">' + link + "</p></section>" : "</section>") : (link ? '<section class="lcd ses"><p class="sw">' + link + "</p></section>" : "");
      var go = box.querySelector(".lnk");
      if (go) go.addEventListener("click", function () { render(go.getAttribute("data-go") === "last" ? lw : nowView); var b = box.querySelector(".lnk"); if (b) b.focus(); });
      if (card && canEnter(view)) wire(view);
    }
    function wire(view) {
      var draftKey = "pyramid-draft:" + p.slug + ":" + view.week, savedKey = "pyramid-saved:" + p.slug + ":" + view.week;
      var inputs = Array.prototype.slice.call(box.querySelectorAll("input[data-key]"));
      var btn = box.querySelector(".save"), st = box.querySelector(".st"), busy = false, memSaved = null;
      var logEl = box.querySelector("details.log"), ls = box.querySelector(".ls");
      function entries() {
        var e = {};
        inputs.forEach(function (i) { var k = i.getAttribute("data-key"); e[k] = e[k] || { calories: "", comment: "" }; e[k][i.getAttribute("data-field")] = i.value; });
        return e;
      }
      function refresh() {
        var saved = store(savedKey) || memSaved, dirty = !saved || saved.entries !== JSON.stringify(entries());
        btn.disabled = busy || !dirty;
        if (!busy && saved && !dirty) st.textContent = "Saved " + saved.time;
        else if (!busy && saved && dirty) st.textContent = "Changed since you saved at " + saved.time + ".";
        var hasEntries = inputs.some(function (i) { return i.value.trim() !== ""; });
        ls.textContent = saved && !dirty ? "Saved " + saved.time : hasEntries ? "Not saved yet" : "";
      }
      var draft = store(draftKey);
      if (draft) inputs.forEach(function (i) { var d = draft[i.getAttribute("data-key")]; if (d) i.value = d[i.getAttribute("data-field")] || ""; });
      if (draft && inputs.some(function (i) { return i.value.trim() !== ""; })) {
        var was = store(savedKey) || memSaved;
        if (!was || was.entries !== JSON.stringify(entries())) logEl.open = true;
      }
      inputs.forEach(function (i) {
        i.addEventListener("input", function () { i.classList.remove("bad"); i.removeAttribute("aria-invalid"); store(draftKey, entries()); refresh(); });
      });
      btn.addEventListener("click", function () {
        if (busy) return;
        var e = entries(), pay = C.buildPayload(p.name, view.week, e);
        inputs.forEach(function (i) { i.classList.remove("bad"); i.removeAttribute("aria-invalid"); });
        if (!pay.ok) {
          inputs.forEach(function (i) { if (i.getAttribute("data-field") === "calories" && pay.bad.indexOf(i.getAttribute("data-key")) >= 0) { i.classList.add("bad"); i.setAttribute("aria-invalid", "true"); } });
          st.textContent = "Check the marked boxes: whole calories from 1 to 999.";
          return;
        }
        if (!pay.body.rows.length) { st.textContent = "Nothing to save yet. Enter calories for at least one section."; return; }
        busy = true; btn.disabled = true; st.textContent = "Saving…";
        var sent = JSON.stringify(e);
        var ctl = typeof AbortController === "function" ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, SAVE_TIMEOUT_MS);
        fetch(RESULTS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(pay.body), signal: ctl ? ctl.signal : undefined })
          .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
          .then(function (res) {
            clearTimeout(timer);
            if (res && res.ok === false && typeof res.error === "string") {
              busy = false; st.textContent = "Not saved: " + res.error + ". Tell Joe if this keeps happening."; btn.disabled = false;
              return;
            }
            if (!res || res.ok !== true) throw new Error("not saved");
            memSaved = { time: hhmm(new Date()), entries: sent };
            store(savedKey, memSaved);
            busy = false; refresh();
          })
          .catch(function () { clearTimeout(timer); busy = false; st.textContent = "Not saved. Check your signal and try again."; btn.disabled = false; });
      });
      refresh();
    }
    onWeekChange.push(function () { render(nowView); });
    render(nowView);
  }

  function personPanel(p) {
    if (!p.tested) {
      return '<section class="lcd off"><h2>' + esc(p.name) + "</h2><p>Not tested yet. Send your board photo to add your scores.</p></section>";
    }
    var s = p.s1, k = C.kick(p.raw.tests.week1), bal = C.balance(p.raw.tests.week1, medians);
    var ki = C.kickInsight(k), bi = C.balanceInsight(bal, medians);
    var digits = String(s.total).length, ghost = "888".slice(0, Math.max(3, digits));
    return '<div class="sesbox" data-slug="' + p.slug + '"></div>' + '<section class="lcd"><div class="top"><div><h2>' + esc(p.name) + '</h2><div class="sub">Week 1 test' + (s.complete ? "" : ", incomplete") + "</div></div>" +
      '<div class="readout" role="img" aria-label="Total ' + s.total + " calories" + (s.complete ? "" : ", incomplete") + '"><span class="unit">cal</span><span class="ghost" aria-hidden="true">' + ghost + '</span><span class="val">' + s.total + "</span></div></div>" +
      '<div class="rows" role="group" aria-label="Calories by machine and effort">' + pieceRows(s) + "</div>" +
      '<div class="scope">' + paceChart(s) + "</div>" +
      '<div class="ins"><details><summary>' + icon("kick") + "<span>" + esc(ki.headline) + '</span></summary><div class="more">' + esc(ki.detail) + kickList(k) + "</div></details>" +
      "<details><summary>" + icon("balance") + "<span>" + esc(bi.headline) + '</span></summary><div class="more">' + esc(bi.detail) + balList(bal) + "</div></details></div>" +
      pacesBlock(p) + (p.s8 ? week8Block(p) : "") + targetsBlock(p) + "</section>";
  }

  function groupPanel() {
    var byName = {};
    people.forEach(function (p) { byName[p.name] = p; });
    var rows = C.groupOrder(D.people, "week1").map(function (raw) {
      var p = byName[raw.name];
      var link = '<a href="#' + p.slug + '">' + esc(p.name) + "</a>";
      if (!p.tested) return '<tr class="offrow"><td>' + link + '</td><td colspan="2">Not tested yet</td></tr>';
      var bar = mixBar(p);
      return "<tr><td>" + link + '</td><td class="mixcell">' + (bar || '<span class="flag">Mix needs every piece</span>') + "</td>" +
        "<td>" + p.s1.total + (p.s1.complete ? "" : '<span class="flag">incomplete</span>') + "</td></tr>";
    }).join("");
    var rank = "";
    if (hasWeek8) {
      rank = '<section class="lcd"><h2>Week 8 improvement</h2><ol class="rank">' + ranking.map(function (r) {
        return "<li><span>" + esc(r.name) + '</span><b class="num">' + C.signedExact(r.pct) + "</b></li>";
      }).join("") + '</ol><p class="foot">Change in total calories, week 1 to week 8, highest first.</p></section>';
    }
    return '<section class="lcd"><h2>Everyone so far</h2><table><thead><tr><th scope="col">Name</th>' +
      '<th scope="col" class="key"><span class="sr">Calories by machine</span>' + M.map(chip).join("") + '</th><th scope="col">Total</th></tr></thead><tbody>' + rows +
      '</tbody></table><p class="foot">Calories from the week 1 test, left to right in the order each person used the machines. Tap a name for their page.</p></section>' + rank;
  }

  function programmePanel() {
    var weeks = C.programme().map(function (w) {
      var mins = w.target + " target, " + w.recovery + " recovery, " + w.rest + " rest";
      return '<article class="wk"><div class="wkh"><span class="wn num">' + w.week + '</span><div><h3>' + (w.kind === "test" ? "Week " + w.week + (w.week === 1 ? ", test" : ", retest") : "Week " + w.week) + "</h3>" +
        "<p>" + esc(w.structure) + '</p><p class="why"><b>Purpose:</b> ' + esc(w.purpose) + "</p></div></div>" +
        "<details><summary>Breakdown</summary><div class=\"more\"><ul>" + w.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" +
        (w.kind === "cycle" ? '<p class="mins">Minutes: ' + mins + ".</p>" : "") + "</div></details></article>";
    }).join("");
    return '<section class="lcd"><h2>The test</h2><p>In week 1 you do 4, 3, 2 and 1 minute efforts for maximum calories on Echo, Row and Ski in turn, with 1 minute of rest after each round. The clock runs for 33 minutes and your score is your total calories. Weeks 2 to 7 are cycle sessions, and week 8 repeats the test so you can compare.</p>' +
      '<p class="soon">Target pace and recovery pace come from the <a href="' + SOURCE_URL + '" target="_blank" rel="noopener">official pace calculator</a>. Your own paces are on your tab.</p></section>' +
      '<section class="lcd"><h2>Week by week</h2>' + weeks + "</section>" +
      '<section class="lcd"><h2>Minutes per week</h2><div class="scope">' + programmeChart() + '</div><p class="foot">Weeks 2 to 7. The 3 tough minutes in week 7 count as target time.</p></section>' +
      '<p class="src">' + icon("link") + '<a href="' + SOURCE_URL + '" target="_blank" rel="noopener">Source: Pyramid pace calculator</a></p>';
  }

  // ---------- session reports ----------
  var STATUS_TEXT = { on: "on plan", above: "over plan", below: "under plan" };
  function pctLabel(f) { return C.signed(f); }
  function sessionReports(ses) {
    return C.tabOrder(D.people).map(function (raw) { return C.sessionReport(raw, ses.week, ses.rows); }).filter(Boolean);
  }

  // Every logged machine as a row: the plan range as a band, set 1 as a ring, set 2 as a dot, all as % against the plan midpoint.
  function planChart(reports) {
    var rows = [];
    reports.forEach(function (r, gi) {
      r.machines.forEach(function (m, mi) {
        if (!m.sets.length || !m.sets[0].plan) return;
        var mid = m.sets[0].plan.mid;
        rows.push({ person: mi === 0 ? r.name : "", gap: gi > 0 && mi === 0, m: m, mid: mid,
          lo: m.sets[0].plan.lo / mid - 1, hi: m.sets[0].plan.hi / mid - 1,
          pts: m.sets.map(function (x) { return { set: x.set, v: x.calories / x.plan.mid - 1 }; }) });
      });
    });
    if (!rows.length) return "";
    var all = [];
    rows.forEach(function (r) { all.push(r.lo, r.hi); r.pts.forEach(function (q) { all.push(q.v); }); });
    var lo = Math.min(-0.1, Math.floor(Math.min.apply(null, all) * 10) / 10), hi = Math.max(0.2, Math.ceil(Math.max.apply(null, all) * 10) / 10);
    var W = 340, L = 96, R = 44, T = 30, rh = 17, gap = 8, pw = W - L - R;
    var H = T + rows.length * rh + rows.filter(function (r) { return r.gap; }).length * gap + 28;
    function X(v) { return L + (v - lo) / (hi - lo) * pw; }
    var g = "", body = "", y = T, desc = [];
    var gridBottom = H - 26;
    for (var t = Math.round(lo * 10); t <= Math.round(hi * 10); t++) {
      var x = X(t / 10).toFixed(1);
      g += '<line x1="' + x + '" x2="' + x + '" y1="' + (T - 4) + '" y2="' + gridBottom + '" class="grid"' + (t === 0 ? ' style="stroke:#8E978C"' : "") + '/>' +
        '<text x="' + x + '" y="' + (gridBottom + 13) + '" class="ax mid tick">' + (t > 0 ? "+" : "") + t * 10 + "%</text>";
    }
    rows.forEach(function (r) {
      if (r.gap) y += gap;
      var cy = y + rh / 2;
      if (r.person) body += '<text x="2" y="' + (cy + 4).toFixed(1) + '" class="val">' + esc(r.person) + "</text>";
      body += '<text x="' + (L - 8) + '" y="' + (cy + 4).toFixed(1) + '" class="ax end c-' + r.m.machine + '">' + r.m.name + "</text>";
      body += '<rect x="' + X(r.lo).toFixed(1) + '" y="' + (cy - 6).toFixed(1) + '" width="' + (X(r.hi) - X(r.lo)).toFixed(1) + '" height="12" rx="2" class="pm-rest"/>';
      var xs = r.pts.map(function (q) { return X(q.v); });
      if (xs.length > 1) body += '<line x1="' + Math.min.apply(null, xs).toFixed(1) + '" x2="' + Math.max.apply(null, xs).toFixed(1) + '" y1="' + cy.toFixed(1) + '" y2="' + cy.toFixed(1) + '" class="ln s-' + r.m.machine + '" style="stroke-width:2"/>';
      r.pts.forEach(function (q, i) {
        body += i === 0 && r.pts.length > 1
          ? '<circle cx="' + X(q.v).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.6" fill="#1E2124" stroke-width="2" class="s-' + r.m.machine + '"/>'
          : '<circle cx="' + X(q.v).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4" class="f-' + r.m.machine + '"/>';
      });
      body += '<text x="' + (W - 2) + '" y="' + (cy + 4).toFixed(1) + '" class="val end c-' + r.m.machine + '">' + pctLabel(r.m.vsPlan) + "</text>";
      desc.push((r.person || "") + " " + r.m.name + ": " + r.pts.map(function (q) { return "set " + q.set + " " + pctLabel(q.v); }).join(", ") + ", " + STATUS_TEXT[r.m.status]);
      y += rh;
    });
    var legend = '<rect x="2" y="7" width="16" height="10" rx="2" class="pm-rest"/><text x="22" y="16" class="ax">Plan range</text>' +
      '<circle cx="104" cy="12" r="3.6" fill="#1E2124" stroke="#E8EDE5" stroke-width="2"/><text x="112" y="16" class="ax">Set 1</text>' +
      '<circle cx="160" cy="12" r="4" fill="#E8EDE5"/><text x="168" y="16" class="ax">Set 2</text>' +
      '<text x="' + (W - 2) + '" y="16" class="ax end">Average</text>';
    return '<svg class="chart" style="max-height:none" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Calories per block against the plan midpoint, by person and machine. ' + esc(desc.join(". ")) + '">' +
      legend + g + body + '<text x="' + (L + pw / 2) + '" y="' + (H - 2) + '" class="ax mid">Against the middle of the plan</text></svg>';
  }

  function reportCard(r, ses) {
    var person = D.people.filter(function (p) { return p.name === r.name; })[0];
    var counts = { on: [], above: [], below: [] };
    r.machines.forEach(function (m) { if (m.status) counts[m.status].push(m.name); });
    var head = counts.on.length === r.machines.length ? "On plan on all three"
      : counts.above.length === r.machines.length ? "Over plan on all three"
      : ["above", "below", "on"].filter(function (k) { return counts[k].length; }).map(function (k) { return (k === "on" ? "On plan" : k === "above" ? "Over" : "Under") + ": " + counts[k].join(", "); }).join(". ");
    var rows = '<div class="rp hd"><span></span><span>Set 1</span><span>Set 2</span><span>Plan</span><span>vs plan</span></div>' + r.machines.map(function (m) {
      var plan = m.sets[0] && m.sets[0].plan;
      function cell(i) { var x = m.sets[i]; return x ? '<span class="' + (x.status || "") + '">' + x.calories + "</span>" : "<span>–</span>"; }
      return '<div class="rp ' + m.machine + '"><span class="nm">' + m.name + "</span>" + cell(0) + cell(1) +
        "<span class=\"pl\">" + (plan ? Math.round(plan.lo) + "–" + Math.round(plan.hi) : "–") + "</span><span>" + (m.vsPlan == null ? "–" : pctLabel(m.vsPlan)) + "</span></div>";
    }).join("");
    var quotes = [];
    r.machines.forEach(function (m) { m.comments.forEach(function (c) { quotes.push("<li>" + chip(m.machine) + " “" + esc(c) + "”</li>"); }); });
    var note = ses.notes && ses.notes[r.name];
    return '<article class="rc"><div class="top"><h3><a href="#' + slug(r.name) + '">' + esc(r.name) + '</a></h3><span class="sub">' + esc(head) + "</span></div>" + rows +
      (quotes.length ? '<ul class="qt">' + quotes.join("") + "</ul>" : "") + (note ? '<p class="nt">' + esc(note) + "</p>" : "") + "</article>";
  }

  function reportPanel(ses) {
    var reports = sessionReports(ses), sum = C.sessionSummary(reports);
    var w = C.programme().filter(function (x) { return x.week === ses.week; })[0];
    var d = ses.date.split("-").map(Number), when = new Date(d[0], d[1] - 1, d[2]).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    var missing = D.people.filter(function (p) { return !reports.some(function (r) { return r.name === p.name; }); }).map(function (p) { return p.name; });
    var stats = '<div class="tr rs"><div><span class="v">' + sum.people + '</span><span class="l">logged</span></div>' +
      '<div><span class="v">' + sum.on + '</span><span class="l">on plan</span></div><div><span class="v">' + sum.above + '</span><span class="l">over plan</span></div>' +
      '<div><span class="v">' + sum.held + "/" + sum.pairs + '</span><span class="l">set 2 ≥ set 1</span></div></div>';
    return '<section class="lcd"><h2>Week ' + ses.week + " results</h2><p>Logged up to " + esc(when) + ". " + esc(w ? w.session.pattern : "") + ', 2 sets.</p>' + stats +
      '<p class="foot">Each 4-minute block is 2 minutes at target pace and 2 at recovery pace, so each person\'s plan for a block is a calorie range from their own paces. Counts are per machine, ' + sum.machines + " in all." +
      (missing.length ? " Not logged yet: " + esc(missing.join(", ")) + "." : "") + "</p></section>" +
      '<section class="lcd"><h2>Against the plan</h2><div class="scope">' + planChart(reports) + '</div><p class="foot">Grey band: the plan range for one block. Right: the average of both sets against the middle of the plan.</p></section>' +
      (ses.notes && ses.notes.group ? '<section class="lcd"><h2>What stands out</h2><ul class="ko">' + ses.notes.group.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></section>" : "") +
      '<section class="lcd"><h2>By person</h2>' + reports.map(function (r) { return reportCard(r, ses); }).join("") + '<p class="foot">Calories per 4-minute block. Plan: the range from 2 minutes at target pace plus 2 at recovery pace.</p></section>';
  }

  // ---------- tabs ----------
  var tabs = [{ id: "group", label: "Group", html: groupPanel() }, { id: "programme", label: "Programme", html: programmePanel() }];
  (D.sessions || []).slice().sort(function (a, b) { return b.week - a.week; }).forEach(function (ses) {
    tabs.push({ id: "week-" + ses.week, label: "Week " + ses.week, html: reportPanel(ses) });
  });
  var byTabName = {};
  people.forEach(function (p) { byTabName[p.name] = p; });
  C.tabOrder(D.people).forEach(function (raw) { var p = byTabName[raw.name]; tabs.push({ id: p.slug, label: p.name, dim: !p.tested, html: personPanel(p) }); });

  var root = document.getElementById("app");
  root.innerHTML = '<header><h1>Pyramid</h1><p>Week 1 test. Max calories over 4, 3, 2 and 1 minutes on each machine.</p>' +
    '<div class="pill">' + icon("clock") + count.tested + " of " + count.of + " tested</div></header>" +
    '<div class="tabbar"><div class="tabs" role="tablist" aria-label="Pages">' + tabs.map(function (t) {
      return '<button type="button" role="tab" class="tab' + (t.dim ? " dim" : "") + '" id="tab-' + t.id + '" aria-controls="panel-' + t.id + '" aria-selected="false" tabindex="-1" data-id="' + t.id + '">' + esc(t.label) + "</button>";
    }).join("") + "</div></div>" +
    tabs.map(function (t) {
      return '<div role="tabpanel" class="panel" id="panel-' + t.id + '" aria-labelledby="tab-' + t.id + '" tabindex="0" hidden>' + t.html + "</div>";
    }).join("");

  people.forEach(function (p) { var box = root.querySelector('.sesbox[data-slug="' + p.slug + '"]'); if (box) mountSession(p, box); });
  var tabEls = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panelEls = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  var strip = root.querySelector(".tabs");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function currentId() {
    return C.routeFromHash(location.hash, tabs.map(function (t) { return t.id; }));
  }
  function centreTab(el, smooth) {
    var left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
    if (strip.scrollTo) strip.scrollTo({ left: left, behavior: smooth && !reduce ? "smooth" : "auto" }); else strip.scrollLeft = left;
  }
  function show(id, scrollTop, smooth) {
    tabEls.forEach(function (el) {
      var on = el.getAttribute("data-id") === id;
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
      if (on) centreTab(el, smooth);
    });
    panelEls.forEach(function (el) { el.hidden = el.id !== "panel-" + id; });
    if (scrollTop) window.scrollTo(0, 0);
  }
  function go(id) { if (location.hash !== "#" + id) location.hash = id; else show(id); }

  tabEls.forEach(function (el) { el.addEventListener("click", function () { go(el.getAttribute("data-id")); }); });
  strip.addEventListener("keydown", function (e) {
    var i = tabEls.indexOf(document.activeElement);
    if (i < 0) return;
    var n = tabEls.length, j = null;
    if (e.key === "ArrowRight") j = (i + 1) % n;
    else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = n - 1;
    if (j == null) return;
    e.preventDefault();
    tabEls[j].focus();
    go(tabEls[j].getAttribute("data-id"));
  });
  window.addEventListener("hashchange", function () { show(currentId(), true, true); });
  show(currentId(), false, false);
  // Tab widths change once the web fonts arrive, so centre the deep-linked tab again.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { show(currentId(), false, false); });
})();
