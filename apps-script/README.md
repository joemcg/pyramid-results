# Session results script

Saves what people enter on their session card to a Google Sheet. One row per section: received, name, week, set, machine, calories, comment.

## Deploy (once)
1. Create a Google Sheet, for example "Pyramid session results".
2. Extensions > Apps Script. Replace the contents of `Code.gs` with `apps-script/Code.js` from this repo. Save.
3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, and allow the permissions it asks for.
4. Copy the web app URL (starts `https://script.google.com/macros/s/`).
5. Put it in `data/scores.js` as `resultsUrl: "<url>"` and open a PR. The entry boxes appear once that is live.

The script creates the "Results" tab and its header row on the first save.

## After changing the script
Deploy > Manage deployments > edit the existing deployment > Version: New version. This keeps the same URL.

## Roster changes
`ROSTER` in `Code.js` must match the names in `data/scores.js`; `test/apps-script.test.js` fails if they drift. Redeploy after changing it.
