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

// Keeps a comment as plain text. Sheets reads written strings as if typed, so "=..." becomes a formula
// and "3:00", "45" or "1/2" become a time, number or date; a leading apostrophe stops that and is not shown.
function asText(comment) {
  var c = String(comment == null ? "" : comment).slice(0, COMMENT_MAX);
  return c ? "'" + c : "";
}

function check(body) {
  if (!body || ROSTER.indexOf(body.name) < 0) return "unknown name";
  if (typeof body.week !== "number" || !SECTIONS.hasOwnProperty(body.week)) return "week must be 2 to 7";
  if (!Array.isArray(body.rows) || body.rows.length === 0) return "no sections to save";
  if (body.rows.length > SECTIONS[body.week] * MACHINES.length) return "too many sections";
  var seen = {};
  for (var i = 0; i < body.rows.length; i++) {
    var r = body.rows[i];
    if (!isWhole(r.set, 1, SECTIONS[body.week])) return "bad set in row " + (i + 1);
    if (MACHINES.indexOf(r.machine) < 0) return "bad machine in row " + (i + 1);
    if (seen[r.set + "-" + r.machine]) return "the same section twice in row " + (i + 1);
    seen[r.set + "-" + r.machine] = true;
    var hasComment = typeof r.comment === "string" && r.comment.trim() !== "";
    if (r.calories == null ? !hasComment : !isWhole(r.calories, 1, 999)) return "calories must be 1 to 999 in row " + (i + 1);
  }
  return null;
}

// All or nothing: nothing is written unless every row is valid, and everything goes in one write.
function handleSave(body, sheet, now) {
  var error = check(body);
  if (error) return { ok: false, error: error };
  var last = sheet.getLastRow();
  var values = last === 0 ? [HEADER.slice()] : [];
  body.rows.forEach(function (r) {
    values.push([now, body.name, body.week, r.set, r.machine, r.calories == null ? "" : r.calories, asText(r.comment)]);
  });
  sheet.getRange(last + 1, 1, values.length, HEADER.length).setValues(values);
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
