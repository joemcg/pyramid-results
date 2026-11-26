---
name: session-report
description: Regenerate a cycle week's session report on the Pyramid results page from the results Google Sheet. Use when Joe says more results are in, asks to update or refresh the week N report, or to add a new week's report (weeks 2 to 7).
---

# Session report

The page has a "Week N" tab per entry in `sessions` in `data/scores.js`: a summary, an against-the-plan chart, group notes and a card per person. The rows and notes are a snapshot; this skill refreshes them from the Sheet. Spec: `docs/specs/2026-11-26-week-2-report.md`.

## 1. Read the Sheet
- Sheet: "Pyramid Session Results", id `1YLL-ieWoHkRyTOhfCJqb6Vpz_s4w8OaFKFjI4Tb-g_8`, tab `Results` (columns: received, name, week, set, machine, calories, comment). If the id stops working, search Drive for the title.
- Read it with the Google Sheets connector (`get_values`, range `Results!A1:G2000`). Save the result as JSON in the scratchpad, not the repo.
- Which week: the one Joe names; otherwise the latest week in the Sheet. Refresh every week whose rows changed.

## 2. Convert and analyse
```bash
node scripts/sheet-to-session.js <values.json> <week>
```
It prints the `week`, `date` and `rows` to paste into the week's `sessions` entry (replace that entry's rows wholesale; add a new entry for a new week, newest last). It also prints each person against plan, the group summary and who has not logged. A re-save wins over earlier rows for the same section. Look at any "SKIPPED" rows (unknown name, bad machine) and ask Joe rather than guessing; a new person must be added to the roster first.

The plan for a section is its target minutes at target pace plus its recovery minutes at recovery pace, from the person's own paces (`sectionPlan` in `src/calc.js`). A tough minute (week 7) has no plan and shows no status.

## 3. Write the notes
`notes` in the entry: `group` (2 to 4 bullets) and one note per person who logged. Rewrite them from the printed analysis each time, keeping notes for people whose numbers did not change unless the new group picture changes them.
- Base every claim on the numbers or the person's own comments. Quote figures as the script prints them (rounded whole %).
- Useful angles: on/over/under plan and by how much; whether comments agree with the numbers ("too easy" and over plan); set 2 against set 1 (fade or hold); recovery comments as the likely source of over-plan totals; where the week 1 test order may have set a pace low; one practical point for next week. Look at what the week's session is for (`PROGRAMME` in `src/calc.js`).
- Plain, short sentences. Refer to people by name, never he/she.
- Do not invent advice that changes the programme or paces; suggest, and say when the week 8 retest will tell.

## 4. Check
- `node --test test/*.test.js`. If a test pins the old snapshot (for example "week 2 sheet of 2026-11-26" in `test/data.test.js`), update it to the new date and counts from the script's summary line.
- Serve the page (`python3 -m http.server 8766`) and screenshot `http://localhost:8766/#week-<N>` at 400px wide with Playwright. Check the chart, the cards and that nothing overflows. Send Joe the screenshot.

## 5. Ship
Commit on the session's branch, push, and open a draft PR titled "Week N report: <who was added>" with the summary line and a short list of what the notes now say. The tab goes live when Joe merges.
