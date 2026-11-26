# Week 2 session report

Status: implemented (2026-11-26)

## Goal
Joe wants the results people logged for a cycle session shown back on the page as a report: how each person did against their own plan, what their comments say, and a chart.

## Approach
- Results are copied from the "Pyramid Session Results" Sheet into `data/scores.js` under `sessions`, one row per section, as a snapshot. The page stays static; it does not read the Sheet live.
- The plan for a section comes from the person's paces: its target minutes at target pace plus its recovery minutes at recovery pace (`sectionPlan`). Week 2 is 2 minutes of each per 4-minute block. Echo watts convert at 3 cal/hr per watt, as for the pace goals. A tough minute has no plan.
- A section is "on plan" inside that range, "over" or "under" outside it. A machine's status and its "vs plan" figure use both sets together against the plan midpoint.
- Written notes (group and per person) live with the session data, so they can be edited without touching code.

## Page
A "Week N" tab per session, after Programme:
- Summary: people logged, machines on and over plan, how often set 2 matched or beat set 1, who has not logged.
- "Against the plan" chart: one row per person and machine, plan range as a band, set 1 as a ring, set 2 as a dot, as % against the plan midpoint.
- "What stands out": the group notes.
- "By person": sets, plan range and % per machine, their comments, and the note for them.

## Out of scope
Reading the Sheet live; reports for tests (weeks 1 and 8).
