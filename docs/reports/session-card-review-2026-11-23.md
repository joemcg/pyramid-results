# Session card and results entry: review findings (2026-11-23)

Branch `feat/session-card`, commits 31685d0..e2a3dcb. Two fresh reviews: a spec judge and a correctness review (both Opus, read-only). Tests 42/42; calc also passes under three far-apart timezones. No Critical findings. No XSS path found. Nothing is exposed yet: entry is hidden while `resultsUrl` is null.

## Recommend fixing (one pass, each with a failing test or check first)
| # | Finding | Where | What a person gets | Fix |
|---|---|---|---|---|
| A | Week worked out once at page load | src/ui.js:213 | Tab left open over Sunday night shows last week's card and saves under the old week | Recompute on `pageshow` and when the page becomes visible; re-render if the week changed |
| B | No timeout on the save | src/ui.js:293 | Weak gym signal: stuck on "Saving…", Save disabled, no retry | 20 s timeout into the "Not saved" path |
| C | Week 7 with entry on loses the piece list; subline says "1 round per machine" | src/ui.js:225-230 | Mid-session in week 7 the card hides the 4:00 / 3:00 target lengths and miscounts rounds | Always show "4:00 target, 3:00 target, tough minute"; subline "3 rounds, 1:00 rest after each round" |
| D | Week 2 pattern lacks "per machine" (spec text) | src/calc.js:177 | "twice" is ambiguous | Use the spec's wording |
| E | Sheet turns comments like "3:00", "45", "1/2" into times, numbers, dates | apps-script/Code.js:18-21 | Comment column corrupted for analysis | Store every comment as text |
| F | Rows appended one by one | apps-script/Code.js:41-43 | A quota error mid-save leaves a partial save | One `setValues` write per save |
| G | Every failure says "Check your signal" | src/ui.js:302 | A rejected save (e.g. roster mismatch) sends people round a retry loop that never works | Show the script's reason when it replies |
| H | Script accepts a string week, unlimited rows, duplicate sections in one save | apps-script/Code.js:23-34 | Split pivots; anyone could flood the Sheet | Number check, row cap, reject duplicates |
| I | Local stub skips Google's redirect | scripts/results-stub.js | The real endpoint is untested until deploy | Add a post-deploy smoke check to apps-script/README.md |

## Needs your decision (the spec says otherwise or is silent)
| # | Finding | Options | My pick |
|---|---|---|---|
| J | Entry boxes inside each machine block make the card several times longer; the next machine's ranges fall below the fold, which works against the glance goal | (1) Ranges stay together at the top; a separate "Log your results" section below with the boxes per machine. (2) Keep boxes in blocks but collapsed behind a "Log results" toggle. (3) Leave as is | (1): the glance view stays exactly as designed; entry is used once, after the session |
| K | A comment with no calories is dropped ("skipped Ski, cramp" never reaches the Sheet) | Allow comment-only rows with blank calories, or keep dropping | Allow them |
| L | Specs marked "implemented" while nobody can save until the script is deployed | Add "live once resultsUrl is set" to the status line, or leave | Add the note |

## Deferring (minor)
- Private browsing: switching to last week and back wipes typed values (only drafts were meant to be lost).
- Switching week during an in-flight save allows a second save (harmless duplicate rows).
- A tested person with no paces would see a lone last-week link (nobody today).
- Cutting a comment at 280 can split an emoji.
- "Saved HH:MM" has no date, ambiguous days later in the last-week view.
