# Session results entry

Status: implemented (2026-11-23)

## Goal
Joe wants every cycle session's results saved in one place so the group's progress can be analysed. Each person enters their own results from their tab, on their phone, straight after (or during) the session: a calorie total for each section and an optional comment. A section is one machine within one set; in week 2 the 4 minutes on the Echo in set 1 is one section. Results go to a Google Sheet Joe owns. Showing results back on the page is not needed.

## Approaches
- **Chosen (2026-11-23): Google Sheet, saved from the card.** The session card gains inputs and a Save button that posts to a Google Apps Script web app bound to the Sheet, which appends rows. No accounts for the group; the Sheet is readable for analysis through Joe's Google Sheets connection.
- Rejected: a prefilled Google Form link (two screens and an extra tap mid-session).
- Rejected: a hosted database such as Supabase or Firebase (setup, keys and upkeep out of proportion for ten people).

## Constraints
- The page stays a static GitHub Pages site. The only server piece is the Apps Script web app; its URL lives in `data/scores.js` (it is not a secret, anyone can read the page source).
- The Apps Script source is kept in the repo (`apps-script/`) so it is reviewed like the rest; Joe deploys it himself and pastes the URL.
- One row per section: received time (set by the script), person, week, set, machine, calories, comment. Long format so it pivots and filters directly.
- No login. Anyone with the page could save as anyone else; accepted for a group of ten friends.
- Entry lives inside the session card's machine blocks (spec `2026-11-23-this-weeks-session-card.md`), so it sits where people already look.
- Sections per week, taken from `PROGRAMME`: weeks 2 to 6, 2 sets x 3 machines = 6; week 7, 3 rounds (4:00, 3:00, tough minute) x 3 machines = 9. Weeks 1 and 8 are tests, recorded as now, not here.
- Depends on Lindsay's paces from PR #3 (branch `feat/lindsay-week-1`) being merged; until then her card, and so her entry boxes, are hidden.
- Out of scope: showing saved results on the page, editing or deleting saved rows from the page, analysis itself.

## Acceptance criteria
- [x] Given Lindsay's tab in week 2, when it opens, then each machine block shows one calories box per set (set 1, set 2) and an optional comment box per section, plus one Save button for the session.
- [x] Given she fills in some sections and taps Save, when the save succeeds, then the Sheet gains one row per filled section (empty sections are skipped) and the card says "Saved" with the time.
- [x] Given a calories value that is not a whole number from 1 to 999, when she taps Save, then nothing is sent and the box is marked.
- [x] Given the save fails (no signal, script error), when she taps Save, then the card says it was not saved, her entries stay on screen, and Save can be tapped again.
- [x] Given she reloads the page before saving, when the tab opens again, then her unsaved entries are still there (kept in this phone's storage until a save succeeds).
- [x] Given she saves the same section twice, when the Sheet is read, then both rows are present; analysis takes the latest by received time.
- [x] Given week 3 or later, when Lindsay taps "Log last week's session instead" under Save, then the card switches to the previous week's blocks, headed with that week and "last week", and Save records rows for that week. Unsaved entries are kept per week.
- [x] Given week 8 (card hidden), when Lindsay's tab opens, then the "Log last week's session" link is still shown and opens week 7. In week 2 there is no link (week 1 was the test).
- [x] Given the script receives a name not in the roster, a week outside 2 to 7, or a set or machine that week does not have, then it rejects the request and appends nothing.

## Test plan
- Unit (`test/calc.test.js`): `sessionSections(week)` returns 6 sections for weeks 2 to 6 and 9 for week 7; validation of calorie values; building the payload from entries (empty sections dropped).
- Unit (`test/apps-script.test.js`): the script's validate-and-append function run in Node against a fake sheet: good payload appends rows, each bad case appends nothing.
- UI: Browser pane at 375px with the script URL pointed at a local stub server; check save success, failure and reload cases.
- Run with `node --test test/*.test.js`. Before the change the new tests fail because the functions do not exist.

## Builder's calls (from the builder check, 2026-11-23)
- Row values: `week` is a number (2 to 7); `set` is 1 or 2, and in week 7 it is the round number 1 to 3 (4:00, 3:00, tough minute); `machine` is `echo`, `row` or `ski`.
- The script keeps its own roster and sections table; a unit test checks they match `data/scores.js` and `PROGRAMME`, so a roster change cannot silently reject saves.
- A save is all or nothing: one invalid section rejects the whole request.
- Transport: plain-text POST of JSON to the web app, reply `{"ok":true}` or `{"ok":false,"error":"..."}`; the page reads the reply to decide saved or not saved.
- After a successful save the boxes stay filled and the card shows "Saved HH:MM" (kept on the phone, so it survives a reload). Save stays disabled until something changes; saving again sends every filled section again.
- With no script URL in `data/scores.js`, the entry boxes are hidden. Tests set the URL through a global set before the page scripts load.
- Sheet: tab "Results"; the script writes the header row if the tab is empty; comments are stored as plain text (never evaluated as formulas) and cut to 280 characters.

## Decisions (2026-11-23)
- A section's calories are the whole block on that machine, recovery included: what the monitor shows at the end (4 minutes in week 2). Boxes are labelled with the block length, for example "Set 1, 4:00 total".
- Catch-up: a "Log last week's session instead" link under Save; only the previous week, nothing further back.

## Open questions
- None.
