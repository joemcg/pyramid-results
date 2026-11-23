// Saves Pyramid session results to the "Results" tab of the Sheet this script is bound to.
// Deploy steps: apps-script/README.md. Tested in Node by test/apps-script.test.js.
// The page posts JSON as text/plain: { name, week, rows: [{ set, machine, calories, comment }] }.
// Reply: { ok: true } or { ok: false, error }.

var ROSTER = ["Anto", "Jay", "Jo", "Joe", "Joel", "Julie", "Lindsay", "Matt", "Rich", "Sanna"];
var SECTIONS = { 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 3 }; // sets (or rounds in week 7) per machine
var MACHINES = ["echo", "row", "ski"];
var HEADER = ["received", "name", "week", "set", "machine", "calories", "comment"];
var COMMENT_MAX = 280;
var TAB = "Results";

function isWhole(v, lo, hi) {
  return typeof v === "number" && Math.floor(v) === v && v >= lo && v <= hi;
}

// Keeps a comment as plain text: Sheets would treat a leading = + - @ as a formula.
function asText(comment) {
  var c = String(comment == null ? "" : comment).slice(0, COMMENT_MAX);
  return /^[=+\-@]/.test(c) ? "'" + c : c;
}

function check(body) {
  if (!body || ROSTER.indexOf(body.name) < 0) return "unknown name";
  if (!SECTIONS.hasOwnProperty(body.week)) return "week must be 2 to 7";
  if (!Array.isArray(body.rows) || body.rows.length === 0) return "no sections to save";
  for (var i = 0; i < body.rows.length; i++) {
    var r = body.rows[i];
    if (!isWhole(r.set, 1, SECTIONS[body.week])) return "bad set in row " + (i + 1);
    if (MACHINES.indexOf(r.machine) < 0) return "bad machine in row " + (i + 1);
    if (!isWhole(r.calories, 1, 999)) return "calories must be 1 to 999 in row " + (i + 1);
  }
  return null;
}

// All or nothing: nothing is appended unless every row is valid.
function handleSave(body, sheet, now) {
  var error = check(body);
  if (error) return { ok: false, error: error };
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
  body.rows.forEach(function (r) {
    sheet.appendRow([now, body.name, body.week, r.set, r.machine, r.calories, asText(r.comment)]);
  });
  return { ok: true };
}

function doPost(e) {
  var result;
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
    result = handleSave(JSON.parse(e.postData.contents), sheet, new Date());
  } catch (err) {
    result = { ok: false, error: "could not save" };
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

if (typeof module !== "undefined") module.exports = { ROSTER: ROSTER, SECTIONS: SECTIONS, HEADER: HEADER, handleSave: handleSave };
