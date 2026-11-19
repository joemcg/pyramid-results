# Spec judge: week-1 results page

Date: 2026-11-18. Spec: `docs/specs/2026-11-18-week-1-results-page.md`.

## Verdict: ready with fixes

The calculations meet every numeric criterion: totals, kick, balance, targets, overrides, programme minutes and week-8 maths. `node --test test/` passes 17 of 17. The gaps are in the UI and data shape. The person grid does not order machines as they were done, the Group table's order reads as a ranking, the week-8 Group view is a separate list rather than a column, the balance insight on an incomplete test drops every machine rather than one, and the test is explained more than once. None of these is a calculation error. Browser checks are unverified (no browser available).

## Note: calc.js changed during the review

`src/calc.js` changed on disk mid-review (22:30). It adds three helpers, `machineOrder` (`src/calc.js:34-39`), `mixSegments` (`src/calc.js:42-48`) and `groupOrder` (`src/calc.js:51-56`), each with a test (`test/calc.test.js:124-145`). `groupOrder` sorts tested people first, then alphabetically. These target deviations 1, 2 and 10 below. `src/ui.js` (22:27) does not call any of them yet, so the rendered page still shows those deviations. The calc.js line references in this report are for the new file. Re-judge once ui.js is wired up.

## Method

- Ran `node --test test/`: 17 pass, 0 fail (re-run after calc.js changed mid-review).
- Rendered `src/ui.js` against a stub DOM (scratchpad script, not in repo) with live data, the four-board fixture, Julie's Row override at 140, Matt with a null Ski piece, and Matt with a made-up week-8 test. The findings below come from that rendered HTML.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Tabs | met | Sticky strip `index.html:40`. Group, Programme and 9 people `src/ui.js:246-247`. Untested dimmed `src/ui.js:253`, `index.html:44`. Deep link via `currentId` `src/ui.js:264-267`. Click or arrow key sets the hash `src/ui.js:282-296`. `hashchange` `src/ui.js:298`. |
| 2a | "4 of 9 tested" | met | `testedCount` `src/calc.js:58-61`, header pill `src/ui.js:251`. Fixture gives "4 of 9", live gives "5 of 9" (Rich). Test at `test/calc.test.js:31-33`. The pill is in the header, so it shows on every tab, not only Group. |
| 2b | Table, machine colours, tested first in name order, no rank | partly | Tested people come first but in data-array order (`a.index - b.index`, `src/ui.js:209`), not name order. The fixture order Matt 450, Julie 307, Sanna 293, Anto 271 is exactly descending total, so it reads as a ranking. The cell colour `td.m` (`index.html:57`) is removed for every row with a bar (`index.html:59`), so in practice only the header chips are coloured. |
| 2c | "Not tested yet" | met | `src/ui.js:212`, and `src/ui.js:194` on the person tab. |
| 2d | Stacked bar per tested person | partly | `mixBar` `src/ui.js:48-57`. Returns `""` when any machine is incomplete (`src/ui.js:50`), so an incomplete tested person gets no bar. |
| 3 | Totals equal board totals | met | `summarise` `src/calc.js:22-31`. Test at `test/calc.test.js:13-29` and the rendered Group table both match all four boards. |
| 4 | Person tab contents | partly | LCD readout `src/ui.js:200`. Pace chart `paceChart` `src/ui.js:59-102`. Insights `src/ui.js:203-204`. Targets `src/ui.js:173-180`. Grid: rows are always Echo, Row, Ski (`M.map`, `src/ui.js:156`), with a badge giving the order the person did them (`src/ui.js:157-158`). The machines are not shown in the order they were done. For Matt that renders "3 Echo, 1 Row, 2 Ski". |
| 5 | Kick | met | `kick` `src/calc.js:64-71`, `kickInsight` `src/calc.js:186-198`. Renders Matt as "Strongest finish: Row, +5%" with Echo -8.3%, Row +5%, Ski -1.8% (spec's rounded values: -8% / +5% / -2%). Julie renders "You faded on every machine". Test at `test/calc.test.js:35-42`. |
| 6 | Balance | met | `balance` `src/calc.js:90-98`, threshold `EVEN_PP` `src/calc.js:9`. Fixture gives Matt Ski, Sanna Row, Anto Echo, Julie "Evenly balanced" (`test/calc.test.js:51-60`). Live data with Rich gives the same four results (Julie's Echo is 24.8% against 24.9%). |
| 7a | +5% targets | met | `targets` / `ceilTarget` `src/calc.js:18,101-113`. Matt 118/209/146 = 473 (`test/calc.test.js:62-69`). Label at `src/ui.js:178`. |
| 7b | Override | met | `src/calc.js:103-108`. Renders 140 "set by you", total 331 (`test/calc.test.js:77-84`). |
| 8 | Incomplete test | partly | The cell shows "–" (`fig`, `src/ui.js:9`). The total is marked incomplete (`src/ui.js:199-200,216`). Kick skips that machine (`src/calc.js:68`). Balance does not skip only that machine. `shares` returns all nulls when the test is incomplete (`src/calc.js:75`), so the insight becomes "Not enough data to measure your balance" (`src/calc.js:203`). The test at `test/calc.test.js:95` only checks `weakLink != "ski"`, which a null result passes trivially. |
| 9a | Test explained once | partly | It is explained in "The test" panel (`src/ui.js:238`), again in the week-1 row and its breakdown (`src/calc.js:136-139`), and a third time in the week-8 breakdown (`src/calc.js:164-167`). |
| 9b | One row per week with structure, purpose and expandable breakdown | met | `PROGRAMME` `src/calc.js:135-168`, rendered at `src/ui.js:231-237`. |
| 9c | Minutes chart | met | `programmeMinutes` `src/calc.js:171-173`, `programmeChart` `src/ui.js:130-151`. Test at `test/calc.test.js:98-107`. Values match the spec, with the tough minutes counted as target. |
| 10 | Week-8 retest | partly | Person tab: before, after and % change plus a slope chart (`week8Block` `src/ui.js:182-190`, `slopeChart` `src/ui.js:104-128`). Hidden with no data (`src/ui.js:205,220`). Group tab: a separate "Week 8 improvement" ranked list is added below the table (`src/ui.js:220-224`), not a % column in the table. Maths test at `test/calc.test.js:109-122`. |
| 11 | Browser checks | partly, unverified | Visible focus `index.html:21-22`. Reduced motion handled for the animation (`index.html:142-145`) and for smooth tab scrolling (`src/ui.js:262,270`). Console errors and 375px layout not checked in a browser. The stub-DOM render threw no errors. `body { overflow-x: hidden }` (`index.html:18`) would hide horizontal overflow rather than prove there is none. |

## Deviations from spec intent (severity-ranked)

1. **High:** Person grid keeps a fixed Echo/Row/Ski row order and only numbers the order the person did them (`src/ui.js:156-158`). The spec asks for machines in the order done.
2. **Medium:** Group table sorts by position in the data array (`src/ui.js:209`), not name order. The data order is by descending total for the four boards (`data/scores.js:9-12`), which implies the ranking the spec forbids (Constraints: "no ranking of week-1 scores").
3. **Medium:** Week-8 improvement is a separate ranked list (`src/ui.js:220-224`) rather than a % improvement column in the Group table.
4. **Medium:** An incomplete test suppresses the whole balance insight instead of skipping one machine (`src/calc.js:75`, `src/calc.js:203`). The code also decides, without spec cover, that incomplete people are left out of the group medians (`src/calc.js:82`). The matching test is vacuous (`test/calc.test.js:95`).
5. **Medium:** The data has no `tests.week8` slot. Tested people have only `week1`, and untested people have `tests: {}` (`data/scores.js:9-17`). The spec says both slots exist "from day one".
6. **Low:** The test is explained up to three times on the Programme tab (`src/ui.js:238`, `src/calc.js:136-139,164-167`).
7. **Low:** Machine colours on table cells are switched off for rows with a bar (`index.html:59`), so the body cells are not coloured by machine.
8. **Low:** A stored `boardTotal` field (`data/scores.js:9-13`) cuts against "totals are always calculated, never entered". It is only used as a transcription check (`test/data.test.js:9-16`) and is never displayed.
9. **Low:** For an incomplete machine the target shows "–" but is still labelled "+5% on week 1" (`src/ui.js:178`). The overall target silently sums only the complete machines and is not marked incomplete (`src/calc.js:109-111`). The incomplete total likewise sums complete machines only (`src/calc.js:28`); for Matt with a null Ski piece it shows 311.
10. **Low:** No mix bar for an incomplete tested person (`src/ui.js:50`).
11. **Low:** Kick rounding is inconsistent on one card. The headline rounds halves towards zero (`pctWhole` / `signed`, `src/calc.js:176-180`), so Sanna's is "+12%", while the list beside it shows "+12.5%" (`signedExact`, `src/ui.js:164`).
12. **Low:** Web fonts load from Google (`index.html:7-9`), a network dependency for a page meant to open from disk. There are system fallbacks, so it still renders offline. Separately, the pace chart joins its line across a null piece (`src/ui.js:80-83`), which draws a pace that was never recorded.

Not deviations: the tested count is "5 of 9" because Rich was added after the spec, and the four-board expectations are held by `test/fixtures/four-boards.js`. The +5% uplift comes from `flatUplift` in the data (`data/scores.js:7`), and overrides are keyed by exact person name. Neither contradicts the spec.

## Unsure, and what would settle it

- Whether "name order" means alphabetical or the order the Goal lists the names. The Goal's list matches the data order, so the code may be what the user meant. A one-line answer from the user settles it, but the implied ranking stands either way.
- Whether each person tab fits in one phone screenshot at 375x812, and whether there are console errors. Settle with the spec's UI test plan in the browser pane.
- Whether the programme copy is in our own words. I did not compare it against the source page.

## Coverage

Read in full: the spec, `index.html`, `src/calc.js`, `src/ui.js`, `data/scores.js`, `test/calc.test.js`, `test/data.test.js` and `test/fixtures/four-boards.js`. Skimmed the design tokens in `design/options/option-b-console.html`; they match. Ran the unit tests and stub-DOM renders. Skipped: real browser checks, `design/options/*` beyond the tokens, and the external source page. All cited symbols (`summarise`, `testedCount`, `kick`, `shares`, `groupMedianShares`, `balance`, `targets`, `improvement`, `improvementRanking`, `programmeMinutes`, `kickInsight`, `balanceInsight`, `pctWhole`, `signed`, `signedExact`, `EVEN_PP`, `mixBar`, `paceChart`, `slopeChart`, `programmeChart`, `pieceRows`, `targetsBlock`, `week8Block`, `personPanel`, `groupPanel`, `currentId`, `fig`) exist at the cited lines.
