/**
 * NevervoidStore team mug links: a tiny backend that lives in your own Google Sheet.
 * Sheet "Teams":   one row per team link (organiser, company, style).
 * Sheet "Entries": one row per person who designed their mug.
 * Deploy: Extensions > Apps Script, paste this file, Deploy > New deployment > Web app,
 *         Execute as: Me, Who has access: Anyone. Copy the /exec URL into the website config.
 */
var OWNER_EMAIL = "";          // optional: your email, to get a note when a new team link is created
var MAX_ENTRIES = 500;         // per team
var THEMES = ["classic", "navy", "sage", "rose"];

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActive(), s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(header); s.setFrozenRows(1); }
  return s;
}
function teams_() { return sheet_("Teams", ["Team", "Key", "Company", "Organiser", "Phone", "Theme", "Created", "Open"]); }
function entries_() { return sheet_("Entries", ["Team", "Entry", "Token", "Name", "Design", "Created", "Updated"]); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function id_(n) { var c = "abcdefghjkmnpqrstuvwxyz23456789", s = ""; for (var i = 0; i < n; i++) s += c.charAt(Math.floor(Math.random() * c.length)); return s; }
function clean_(v, max) { return String(v == null ? "" : v).replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, max); }
function findTeam_(id) {
  if (!id) return null;
  var rows = teams_().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (rows[i][0] === id) return { row: i + 1, id: rows[i][0], key: rows[i][1], company: rows[i][2], organiser: rows[i][3], phone: rows[i][4], theme: rows[i][5], created: rows[i][6], open: rows[i][7] !== false && rows[i][7] !== "FALSE" };
  return null;
}
function pub_(t) { return { id: t.id, company: t.company, organiser: t.organiser, theme: t.theme, open: t.open }; }

function doGet(e) {
  var p = e.parameter || {};
  try {
    if (p.a === "team") { var t = findTeam_(p.t); return out_(t ? { ok: true, team: pub_(t) } : { ok: false, err: "notfound" }); }
    if (p.a === "list") {
      var tm = findTeam_(p.t); if (!tm || tm.key !== p.k) return out_({ ok: false, err: "denied" });
      var rows = entries_().getDataRange().getValues(), list = [];
      for (var i = 1; i < rows.length; i++) if (rows[i][0] === tm.id) list.push({ id: rows[i][1], name: rows[i][3], d: rows[i][4], at: rows[i][6] });
      return out_({ ok: true, team: pub_(tm), entries: list });
    }
    return out_({ ok: true, service: "nevervoid-team" });
  } catch (err) { return out_({ ok: false, err: String(err) }); }
}

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.a === "create") {
      var company = clean_(d.company, 60), organiser = clean_(d.organiser, 40), phone = clean_(d.phone, 15).replace(/[^\d+]/g, ""), theme = THEMES.indexOf(d.theme) >= 0 ? d.theme : "classic";
      if (!company || !organiser) return out_({ ok: false, err: "missing" });
      var id = id_(8), key = id_(16);
      teams_().appendRow([id, key, company, organiser, phone, theme, new Date(), true]);
      if (OWNER_EMAIL) try { MailApp.sendEmail(OWNER_EMAIL, "New team mug link: " + company, organiser + " (" + phone + ") created a team link for " + company + ".\nDashboard: https://nevervoidstore.com/team/?t=" + id + "&k=" + key); } catch (x) {}
      return out_({ ok: true, id: id, key: key });
    }
    if (d.a === "submit") {
      var t = findTeam_(d.t); if (!t) return out_({ ok: false, err: "notfound" }); if (!t.open) return out_({ ok: false, err: "closed" });
      var name = clean_(d.name, 14), design = clean_(d.d, 700);
      if (!name || !design || design.split("~").length !== 3) return out_({ ok: false, err: "invalid" });
      var s = entries_(), rows = s.getDataRange().getValues(), count = 0, now = new Date();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] !== t.id) continue; count++;
        if (d.id && rows[i][1] === d.id && rows[i][2] === d.token) { s.getRange(i + 1, 4, 1, 4).setValues([[name, design, rows[i][5], now]]); return out_({ ok: true, id: d.id, token: d.token, updated: true }); }
      }
      if (count >= MAX_ENTRIES) return out_({ ok: false, err: "full" });
      var eid = id_(10), token = id_(16);
      s.appendRow([t.id, eid, token, name, design, now, now]);
      return out_({ ok: true, id: eid, token: token });
    }
    if (d.a === "open") {
      var tt = findTeam_(d.t); if (!tt || tt.key !== d.k) return out_({ ok: false, err: "denied" });
      teams_().getRange(tt.row, 8).setValue(!!d.open); return out_({ ok: true, open: !!d.open });
    }
    if (d.a === "remove") {
      var to = findTeam_(d.t); if (!to || to.key !== d.k) return out_({ ok: false, err: "denied" });
      var es = entries_(), er = es.getDataRange().getValues();
      for (var j = er.length - 1; j >= 1; j--) if (er[j][0] === to.id && er[j][1] === d.id) es.deleteRow(j + 1);
      return out_({ ok: true });
    }
    return out_({ ok: false, err: "unknown" });
  } catch (err) { return out_({ ok: false, err: String(err) }); }
  finally { lock.releaseLock(); }
}
