# Week-1 results page

Status: accepted (2026-11-18)

## Goal
Ten friends (Matt, Julie, Sanna, Anto, Rich, Joe, Jo, Jay, Joel, Lindsay) are doing the 8-week Pyramid erg programme: a test in week 1, cycle sessions in weeks 2 to 7, then a retest in week 8. Today their results live in whiteboard photos. This page puts everyone's week-1 test in one place, figures first, with a couple of plain-English insights each, a week-8 target, and an explanation of the programme. Its main use is screenshots on a phone, posted to the group chat.

## Constraints
- A static page opened from disk (phase 1). No server, no build step, no frameworks, and no charting library. Charts are hand-drawn inline SVG.
- The visual design follows design option B, "Monitor" (`design/options/option-b-console.html`): LCD panels on a dark housing, with Echo / Row / Ski as colour accents. It is designed for phone portrait first, and each person tab fits in one phone screenshot.
- Data lives in one file shaped like JSON, `data/scores.js`, which sets `window.PYRAMID`. It is a `.js` file because browsers block loading `.json` next to a page opened from disk. Phase 2 uploads will write the same shape.
- Each test stores all 12 pieces (calories for the 4, 3, 2 and 1 minute efforts on each machine), the machine order, and an optional date. Totals are always calculated, never entered.
- The data has a slot for each test, `tests.week1` and `tests.week8`, from day one. An empty slot is `null`.
- For sharing, `node scripts/bundle.js` writes `dist/pyramid-results.html`: one file with the data and scripts inlined, which works when opened on its own from any folder or chat download. Only the web fonts load from outside, and without a connection the page falls back to system fonts.
- Hosting: GitHub Pages from the public repo `joemcg/pyramid-results`, at https://joemcg.github.io/pyramid-results/. On every push to `main`, a GitHub Action runs the tests, builds the bundle, and deploys only `dist/pyramid-results.html` as the site's `index.html`. If the tests fail, nothing is deployed. Specs, mock-ups and reports stay in the repo and are not served by the site.
- Machines are called Echo, Row and Ski everywhere.
- There is no bodyweight or sex normalisation, and no ranking of week-1 scores.
- The copy is UK English and in our own words. The programme text is summarised, not copied, and links to the source.
- Out of scope: self-service uploads, logging the weekly training sessions (parked), and the 5 untested people's data (to be added later from photos).

## Acceptance criteria
- [ ] **Tabs:** Given the page is open, there is a sticky tab strip with tabs for Group, Programme and each of the 10 people, the people in alphabetical order (Anto, Jay, Jo, Joe, Joel, Julie, Lindsay, Matt, Rich, Sanna). Untested people's tabs are dimmed. Opening `index.html#julie` shows Julie's tab, and switching tabs updates the hash. An unknown or malformed hash (for example `#%E0`) shows the Group tab.
- [ ] **Group tab:**
  - The page shows how many have tested out of everyone ("8 of 10 tested" with the current data; the frozen four-board test fixture shows "4 of 9").
  - There is a list of everyone with their total, tested people first and no rank, plus an Echo / Row / Ski colour key.
  - Untested people show "Not tested yet".
  - Each tested person has a stacked bar showing their machine mix, with segments left to right in the order they used the machines (Matt: Row, Ski, Echo). Each segment shows that machine's calories inside it, so the numbers line up with the colours. There are no separate per-machine number columns.
  - Tested people are sorted alphabetically by name (Anto, Julie, Matt, Rich, Sanna).
- [ ] **Totals:** Given the four boards, the machine and overall totals equal the board totals: Matt 112/199/139 = 450, Julie 76/126/105 = 307, Sanna 79/112/102 = 293, Anto 61/106/104 = 271.
- [ ] **Person tab:** Given a tested person, their tab shows:
  - the total as an LCD readout
  - the 4x3 grid of pieces, with machine rows top to bottom in the order they used them, numbered 1 to 3 (Matt: Row, Ski, Echo; Anto: Ski, Echo, Row)
  - a pace-profile chart: cal/min for each piece, one line per machine
  - the kick and balance insights
  - their week-8 targets
- [ ] **Training paces:** Given a person has `paces` in the data (copied from the official calculator), their tab shows a Training paces block: for each machine, in the order they used them, the Target and Recovery ranges. Echo is in watts and Row and Ski are in cal/hr, as the machines display them (Matt: Row target 1254–1373 cal/hr, recovery 896–1015; Echo target 235–258 W, recovery 146–168). A person with no paces shows no block. A data test checks every copied pace against the calculator's pattern: test average cal/hr x 1.365–1.495 for target; Row and Ski recovery x 0.976–1.105; Echo recovery x 0.845–0.977, with Echo watts = cal/hr / 3; all within 1.5%.
- [ ] **Kick insight:** The kick for a machine is the 1-min rate compared with the 4-min rate. The insight names the machine with the strongest finish, or says the person faded on every machine (Julie). Matt: Echo -8%, Row +5%, Ski -2%. Whole percentages round to nearest, halves away from zero (Sanna's Echo 12.5% reads +13%).
- [ ] **Balance insight:** The insight names the weak link: the machine whose share of the person's total is furthest below the group median share. Matt is Ski, Sanna is Row, Anto is Echo, and Julie is "Evenly balanced" (no machine more than 0.5 percentage points below the median). The explanation shows shares to one decimal place (Matt: Ski 30.9% of your total against 34.5% for the group).
- [ ] **Targets:**
  - Given no override, each machine's week-8 target is ceil(week-1 total x 1.05) and is labelled "+5% on week 1". For Matt that gives 118 / 209 / 146 = 473.
  - Given an override in `overrides` (for example Julie's Row at 140), that machine shows 140 labelled "set by you", and the overall target is the sum of the machine targets.
  - Given a machine with no target (an incomplete machine with no override), it shows "–" and the overall target is marked incomplete.
  - Given a person has paces, a second row labelled "At target pace" shows the calories each machine would give if they held the bottom of their Target range for all 13 minutes. That is Row and Ski cal/hr x 13 / 60, and Echo watts x 3 x 13 / 60, rounded to the nearest calorie, plus a total (Matt: Row 272, Ski 190, Echo 153, total 615). The Echo watts-to-calories factor of 3 comes from the calculator's own pattern, not a published formula. The +5% row stays as it is. A person without paces shows only the +5% row.
- [ ] **Incomplete test:** Given a piece is null, that cell shows "–", the total is marked incomplete, and the insights skip that machine. Balance compares the complete machines only: their shares of the complete machines' total against the group medians rescaled to the same machines (Matt with a Ski piece missing: weak link Echo).
- [ ] **Programme tab:**
  - The test is explained once.
  - There is one row per week (1 to 8), each with a one-line structure, its purpose and an expandable breakdown.
  - A stacked bar chart, scaled to the longest week, shows minutes per week at target / recovery / rest: wk2 12/12/12, wk3 15/12/12, wk4 18/12/12, wk5 15/9/10, wk6 18/6/10, wk7 24/3/2 (the 3 "tough" minutes count as target).
- [ ] **Week-8 retest:** Given a `tests.week8` entry, the person tab adds before / after / % change for each machine plus a slope chart, and the Group tab adds a "Week 8 improvement" list of % change in total, ranked high to low. With no week-8 data, none of this shows.
- [ ] **Browser checks:** The page renders with no console errors, keyboard focus is visible, reduced motion is respected, and there is no horizontal scroll at 375px wide, checked without anything hiding overflow (no `overflow-x: hidden` on the page).

## Test plan
- **Unit (calculations):** `node --test` against `src/calc.js`, which is a plain script that also exports for Node. It covers totals, kick, balance, targets, overrides, incomplete tests and the programme minutes, using the board data as fixtures. Red state: the tests fail before `calc.js` exists or while a function returns the wrong value.
- **Unit (week 8):** A fixture person with a made-up week-8 test checks the % change and the improvement ranking.
- **UI:** Open the page in the browser pane at 375x812 (served locally). Check every tab, the `#hash` deep link, an untested tab, the console for errors, and that each person tab fits in about one screenshot. Then repeat at desktop width.

## Open questions
- Logging the weekly sessions (what to capture, and the how-it-felt comment) is parked by the user.
- Joel's and Lindsay's scores are still to come.
- Phase 2 (self-upload, self-service target overrides) is not yet designed. GitHub Pages is static, so self-upload will need a form or backend service.
