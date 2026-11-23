# This week's session card on each person's tab

Status: accepted (2026-11-23)

## Goal
The group is starting the cycle sessions (weeks 2 to 7). Mid-session, between machines, people need their own target and recovery paces for the next machine without working anything out. Each tested person's tab gets a "this week's session" card they can glance at on their phone: the week's pattern in one line, then one large block per machine with that person's target and recovery ranges.

## Constraints
- Built for a glance on a phone between machines: large type, no tapping or step tracking needed, still useful after the screen locks and wakes.
- Layout is machine blocks (chosen 2026-11-23). Considered and rejected: a step-through view with a Next button (taps with sweaty hands, loses place on reload) and a full stage list (about 26 lines, too long to scan).
- Week pattern comes from the existing `PROGRAMME` in `src/calc.js`; paces come from each person's `paces` in `data/scores.js`. No new per-person data.
- The current week is worked out from a programme start date held in the data, so the card moves on without a code change. Week 2 starts Monday 23 November 2026; each later week starts 7 days after the one before (week 7 on 28 December, week 8 on 4 January 2027).
- Ranges are shown in the units the monitors show: cal/hr for Row and Ski, watts for Echo.
- Out of scope: a running timer (the gym clock does this), logging session results, editing the session on the page.

## Acceptance criteria
- [ ] Given a cycle week (2 to 6) and a person with paces, when their tab opens, then the card shows the week number, a one-line pattern (for week 2: "1:00 target, 1:00 recovery, twice per machine", with sets and rest between sets), and one block per machine giving the target and recovery ranges with units.
- [ ] Given Lindsay in week 2, when her tab opens, then the Ski block reads target 806–883 cal/hr and recovery 576–653 cal/hr, Echo 231–253 W and 143–165 W, Row 945–1035 cal/hr and 675–765 cal/hr.
- [ ] Given week 7, when a tab opens, then each machine block lists the pieces done on that machine (4:00 target, 3:00 target, 1:00 tough minute) with the target range.
- [ ] Given today's date and the programme start date, when the page loads, then the card shows the week that date falls in: 23 to 29 November 2026 is week 2, 30 November is week 3.

## Test plan
- Unit (`test/calc.test.js`): the current-week function for dates before, on, inside and after each week boundary; the per-machine session rows for week 2 and week 7 from a fixture person.
- Unit (`test/data.test.js`): the start date is present and a valid ISO date.
- UI: the bundled page in the Browser pane at phone width (375px), checking Lindsay's card for week 2 against the second criterion.
- Run with `node --test test/*.test.js`. Before the change the new tests fail because the functions do not exist.

## Decisions (accepted 2026-11-23)
- Block order: each person's own week-1 machine order.
- Before week 2 starts, show week 2 headed "Next session"; in week 8 and after, hide the card (the retest has its own block).
- Heading: "Week 2", as the programme tab numbers it.
- No calories per piece; pace ranges only.
- People with no paces: hide the card.

## Open questions
- None.
