# Session card and results entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each tested person's tab shows this week's session as machine blocks with their paces, and lets them save a calorie total and comment per section to a Google Sheet.

**Architecture:** Pure logic (weeks, sections, validation, payload) goes in `src/calc.js` with unit tests; rendering and browser state go in `src/ui.js`; the Sheet side is a standalone Apps Script file in `apps-script/` whose core function is tested in Node against a fake sheet. No new page scripts: the bundle test expects exactly three.

**Tech Stack:** Plain ES5-style browser JS, Node's built-in test runner, Google Apps Script.

**Spec:** `docs/specs/2026-11-23-this-weeks-session-card.md` and `docs/specs/2026-11-23-session-results-entry.md` (both accepted).

## Global Constraints
- Week 2 starts Monday 23 November 2026; each week starts 7 days after the one before.
- Card hidden in weeks 1 and 8+, and for people with no paces. Before 23 Nov it shows week 2 headed "Next session".
- Blocks in each person's week-1 machine order (`C.machineOrder`). Heading "Week N". Pace ranges only, no calories per piece.
- Units: Echo `W`, Row and Ski `cal/hr` (existing `PACE_UNITS`).
- Calories: whole number 1 to 999 for the whole block, recovery included. Comment optional, plain text, max 280 characters.
- Row: received time, person, week (number), set (1 to 2, or round 1 to 3 in week 7), machine (`echo|row|ski`), calories, comment.
- Save is all or nothing. Reply `{"ok":true}` or `{"ok":false,"error":"..."}`.
- Entry hidden when `PYRAMID.resultsUrl` is null. `globalThis.PYRAMID_RESULTS_URL`, if set before the page scripts, overrides it (tests only).
- UK English, no em dashes in page copy.
- Lindsay's paces arrive with PR #3. Rebase onto main once it merges, before the UI checks in Tasks 2 and 5.

## Review Focus
1. Phone's local date near midnight: the week must follow the phone's local calendar date, not UTC. Test in Task 1.
2. Storage blocked (private browsing): entry still works, only drafts are lost. Test in Task 5 (UI check with storage throwing).
3. Double tap on Save: one request only; Save disabled while a save is in flight. Check in Task 5.
4. Typed values like " 45 ", "045", "45.5", "4e1": trim, accept plain digits only. Test in Task 3.
5. Comment starting with "=" or longer than 280 characters: stored as text, cut to 280. Test in Task 4.

---

### Task 1: Session data and current week

**Files:**
- Modify: `src/calc.js` (`PROGRAMME` entries for weeks 2 to 7, new functions, `api`)
- Modify: `data/scores.js` (add `cycleStart: "2026-11-23"`, `resultsUrl: null` beside `flatUplift`)
- Test: `test/calc.test.js`, `test/data.test.js`

**Interfaces:**
- Produces: `sessionWeek(today: Date, cycleStart: "YYYY-MM-DD") -> { week: number, upcoming: boolean }` (week 2 with `upcoming:true` before the start; otherwise 2 + whole weeks elapsed, uncapped, so 8+ is possible). Uses `today`'s local year/month/day.
- Produces: `session(week) -> null | { week, sets, setRest, machineRest, pattern, sections: [{ set, label, block }] }`. `null` for weeks other than 2 to 7. `sections` lists one entry per set (or round) for a single machine; the card repeats it per machine.

Values to add to `PROGRAMME` as a `session` field:

| Week | sets | pattern | block | machineRest | setRest |
|---|---|---|---|---|---|
| 2 | 2 | 1:00 target, 1:00 recovery, twice | 4:00 | 1:00 | 4:00 |
| 3 | 2 | 1:30 target, 1:00 recovery, 1:00 target, 1:00 recovery | 4:30 | 1:00 | 4:00 |
| 4 | 2 | 1:30 target, 1:00 recovery, twice | 5:00 | 1:00 | 4:00 |
| 5 | 2 | 1:30 target, 1:00 recovery, 1:00 target, 0:30 recovery | 4:00 | none | 5:00 |
| 6 | 2 | 2:00 target, 0:30 recovery, 1:00 target, 0:30 recovery | 4:00 | none | 5:00 |
| 7 | 1 | rounds: 4:00 target + 0:30 recovery (4:30); 3:00 target + 0:30 recovery (3:30); 1:00 tough minute (1:00) | per round | 1:00 after each round | none |

Week 2 to 6 section labels: "Set 1", "Set 2". Week 7: "Round 1, 4:00", "Round 2, 3:00", "Tough minute".

- [ ] **Step 1: Write failing tests** in `test/calc.test.js`:
  - `sessionWeek`: `new Date(2026,10,22,23,59)` → `{week:2, upcoming:true}`; `new Date(2026,10,23,0,1)` → `{week:2, upcoming:false}`; `new Date(2026,10,29,23,59)` → week 2; `new Date(2026,10,30,0,0)` → week 3; `new Date(2026,11,28)` → 7; `new Date(2027,0,4)` → 8.
  - `session(2).sections.length === 2`, `session(2).sections[0].block === "4:00"`; `session(7).sections.length === 3`, labels as above; `session(1) === null`, `session(8) === null`.
  - In `test/data.test.js`: `cycleStart` matches `/^\d{4}-\d{2}-\d{2}$/` and is a real date; `resultsUrl` is `null` or starts with `https://script.google.com/`.
- [ ] **Step 2:** `node --test test/*.test.js` → new tests FAIL (`sessionWeek is not a function`).
- [ ] **Step 3:** Implement both functions and the data fields; export via `api`.
- [ ] **Step 4:** Same command → all PASS.
- [ ] **Step 5:** Commit `Add session weeks and per-week section data`.

### Task 2: Session card on the tab

**Files:**
- Modify: `src/ui.js` (new `sessionBlock(p, view)`; call it in `personPanel` straight after the header readout, so it is the first thing on the tab)
- Modify: `index.html` (`<style>`: `.ses` card, large range type at least 1.6rem for the numbers)

**Interfaces:**
- Consumes: `C.sessionWeek`, `C.session`, `C.paceRows`, `D.cycleStart`.
- Produces: `sessionBlock(p, view) -> string` where `view = { week, upcoming, lastWeek }`; returns `""` when `C.session(week)` is null or `C.paceRows(p.raw)` is null. Each machine block carries `data-machine` and `data-week` for Task 5.

Card copy: heading "Week N" (or "Next session: week 2", or "Week N, last week"); one line with pattern, "N sets, setRest rest between" (week 7: "1 round per machine, 1:00 rest after each round"); per machine: name, TARGET range, RECOVERY range, unit. Week 7 blocks list the three rounds under the ranges.

- [ ] **Step 1:** Rebase onto main if PR #3 has merged (`git fetch && git rebase origin/main`), so Lindsay has paces.
- [ ] **Step 2:** Implement `sessionBlock` and styles.
- [ ] **Step 3:** `node --test test/*.test.js` → PASS (bundle test still three scripts).
- [ ] **Step 4:** Browser pane (`preview_start` name `pyramid`) at 375x812, `#lindsay`: card shows Ski 806–883 / 576–653 cal/hr, Echo 231–253 / 143–165 W, Row 945–1035 / 675–765 cal/hr, in that order. `#joel`: no card. Screenshot.
- [ ] **Step 5:** Commit `Show this week's session card on each tab`.

### Task 3: Entry validation and payload

**Files:**
- Modify: `src/calc.js`, Test: `test/calc.test.js`

**Interfaces:**
- Produces: `parseCalories(text) -> { ok: true, value: number } | { ok: false } | { ok: true, value: null }` (blank or whitespace is `value:null`).
- Produces: `buildPayload(name, week, entries) -> { ok: true, body: { name, week, rows: [{ set, machine, calories, comment }] } } | { ok: false, bad: ["<set>-<machine>", ...] }`. `entries` is `{ "<set>-<machine>": { calories: string, comment: string } }`. Rows with blank calories are dropped; a comment without calories is dropped too. Comments trimmed and cut to 280.

- [ ] **Step 1: Failing tests:** `parseCalories`: `" 45 "`→45, `"045"`→45, `"999"`→999, `""`→null; `"0"`, `"1000"`, `"45.5"`, `"4e1"`, `"-3"`, `"abc"` → `ok:false`. `buildPayload("Lindsay", 2, {"1-ski":{calories:"51",comment:" felt good "}, "2-ski":{calories:"",comment:""}})` → one row `{set:1, machine:"ski", calories:51, comment:"felt good"}`. A bad value anywhere → `{ok:false, bad:["1-echo"]}`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `Validate session entries and build the save payload`.

### Task 4: Apps Script

**Files:**
- Create: `apps-script/Code.js`, `apps-script/README.md` (deploy steps for Joe: new Sheet, Extensions > Apps Script, paste, Deploy as web app, execute as me, access "Anyone", copy URL into `data/scores.js` `resultsUrl`)
- Test: `test/apps-script.test.js`

**Interfaces:**
- Produces in `Code.js`: `ROSTER` (array of names), `SECTIONS` (`{ 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 3 }` sets or rounds per week), `HEADER = ["received", "name", "week", "set", "machine", "calories", "comment"]`, `handleSave(body, sheet, now) -> { ok, error? }`, `doPost(e)` (parses `e.postData.contents`, calls `handleSave` on tab "Results", returns JSON via `ContentService`). End with `if (typeof module !== "undefined") module.exports = { ROSTER, SECTIONS, HEADER, handleSave };`.
- `sheet` is anything with `getLastRow()` and `appendRow(array)`; `handleSave` writes `HEADER` first if `getLastRow() === 0`. Comments are written prefixed with `'` when they start with `= + - @`, so Sheets keeps them as text.

- [ ] **Step 1: Failing tests** with a fake sheet (`rows` array): good body with 2 rows → 2 rows appended after the header, `ok:true`; unknown name, week 1, week 8, set 3 in week 2, round 4 in week 7, machine `bike`, calories 0 or 1000 or 45.5 → `ok:false` and nothing appended (one bad row in a batch of three appends nothing); comment `"=SUM(A1)"` stored as `"'=SUM(A1)"`; 300-character comment stored as 280. Drift guard: `ROSTER` sorted equals the names in `data/scores.js`; `SECTIONS[w]` equals `C.session(w).sections.length` for weeks 2 to 7.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `Add the Apps Script that saves session results to the Sheet`.

### Task 5: Entry on the card

**Files:**
- Modify: `src/ui.js` (inputs in `sessionBlock`, save handling, drafts, last-week link), `index.html` (styles), `.claude/launch.json` (add `results-stub` config)
- Create: `scripts/results-stub.js` (local Node server for UI checks: POST `/ok` replies `{"ok":true}`, POST `/fail` replies 500; sends `Access-Control-Allow-Origin: *`)

**Interfaces:**
- Consumes: `C.parseCalories`, `C.buildPayload`, Task 2's `data-machine`/`data-week`.
- Drafts in `localStorage` key `pyramid-draft:<slug>:<week>`; last success in `pyramid-saved:<slug>:<week>` (time string). Every storage call in try/catch.
- Save: `fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })`, read JSON reply; success needs `ok === true`.

Behaviour (from the spec): per machine block one calories box per section (`inputmode="numeric"`, label "Set 1, 4:00 total") and an optional comment box; one Save per card; invalid boxes marked and nothing sent; on success "Saved HH:MM", Save disabled until an edit; on failure "Not saved. Check your signal and try again.", entries kept; Save disabled while in flight; "Log last week's session instead" shown whenever `C.session(week - 1)` is not null (so weeks 3 to 8; in week 8 it stands alone, as the card is hidden, and opens week 7), switching the card to that week; whole entry hidden when no URL.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** `node --test test/*.test.js` → PASS.
- [ ] **Step 3:** UI check at 375px against the stub (set `PYRAMID_RESULTS_URL` via a small inline script in a scratch copy of `index.html`, not in the repo): save success, failure, double tap, reload keeps draft, invalid value blocks send, last-week link switches week, `localStorage` throwing (override in console) still saves. Screenshot of a saved card.
- [ ] **Step 4:** Commit `Let people save session results from the card`.

### Task 6: Finish

- [ ] Run gate: `set -o pipefail; node --test test/*.test.js 2>&1 | tee "$TMPDIR/gate.log"` and `node scripts/bundle.js`; confirm the test count went up.
- [ ] Set both spec status lines to `implemented (<date>)`; tick their criteria.
- [ ] Push `feat/session-card`, open the PR (spec judge and `/code-review` reviews per CLAUDE.md).
