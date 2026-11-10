/**
 * NevervoidStore backend: lives in your own Google Sheet, free.
 *   1. Checkout: creates Razorpay orders at the right price, verifies payments, logs every order in the "Orders" tab.
 *   2. Team links: each employee designs their own mug ("Teams" and "Entries" tabs).
 *
 * Setup (once):
 *   Extensions > Apps Script, paste this whole file, Save.
 *   Project Settings (gear) > Script properties > add:
 *       RZP_KEY_ID      your Razorpay Key ID     (rzp_test_... first, rzp_live_... later)
 *       RZP_KEY_SECRET  your Razorpay Key Secret (never share it anywhere else)
 *   Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > Deploy.
 *   Send the /exec URL to be added to the website.
 */
var SITE = "https://nevervoidstore.com";
var NOTIFY_EMAIL = "nevervoidstore@gmail.com";   // gets an email for every paid order ("" to turn off)

function doGet(e) {
  var p = e.parameter || {};
  if (p.a === "team" || p.a === "list") return teamGet_(e);
  return out_({ ok: true, service: "nevervoidstore" });
}
function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, err: "bad request" }); }
  if (d.a === "order") return createOrder_(d);
  if (d.a === "verify") return verifyPayment_(d);
  return teamPost_(e);
}

// ---------- checkout ----------
function orders_() { return sheet_("Orders", ["Created", "Order ID", "Status", "Product", "Options", "Price (Rs)", "Name", "Phone", "Address", "City", "Pincode", "Design link", "Payment ID", "Paid at", "Email"]); }
function prices_() {
  var c = CacheService.getScriptCache(), hit = c.get("prices");
  if (hit) return JSON.parse(hit);
  var txt = UrlFetchApp.fetch(SITE + "/prices.json?t=" + Date.now(), { muteHttpExceptions: true }).getContentText();
  c.put("prices", txt, 600);
  return JSON.parse(txt);
}
function rzp_(method, path, body) {
  var pr = PropertiesService.getScriptProperties(), id = pr.getProperty("RZP_KEY_ID"), sec = pr.getProperty("RZP_KEY_SECRET");
  if (!id || !sec) throw new Error("Razorpay keys are not set in Script properties");
  var res = UrlFetchApp.fetch("https://api.razorpay.com/v1" + path, { method: method, contentType: "application/json", payload: body ? JSON.stringify(body) : null,
    headers: { Authorization: "Basic " + Utilities.base64Encode(id + ":" + sec) }, muteHttpExceptions: true });
  var j = JSON.parse(res.getContentText());
  if (res.getResponseCode() >= 300) throw new Error((j.error && j.error.description) || "Razorpay error");
  return j;
}
function createOrder_(d) {
  try {
    var price = prices_()[d.id];
    if (!price) return out_({ ok: false, err: "Unknown product" });
    var c = d.customer || {}, email = clean_(c.email, 100), name = clean_(c.name, 60), phone = String(c.phone || "").replace(/\D/g, "").slice(-10), addr = clean_(c.address, 250), city = clean_(c.city, 60), pin = String(c.pincode || "").replace(/\D/g, "");
    if (!name || !/^[6-9]\d{9}$/.test(phone) || addr.length < 8 || !city || !/^5[6-9]\d{4}$/.test(pin)) return out_({ ok: false, err: "Please check your delivery details" });
    var product = clean_(d.product, 120), options = clean_(d.options, 250), design = clean_(d.design, 250), model = clean_(d.model, 60);
    var notes = { product: product, ship_name: name, phone: "+91 " + phone, email: email, address: addr, city: city, pincode: pin };
    if (options) notes.options = options;
    if (model) notes.phone_model = model;
    if (design) notes.design_link = design;
    var receipt = "NV" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyMMddHHmmss") + Math.floor(Math.random() * 90 + 10);
    var o = rzp_("post", "/orders", { amount: price * 100, currency: "INR", receipt: receipt, notes: notes });
    orders_().appendRow([new Date(), o.id, "created", product, [options, model].filter(String).join(" | "), price, name, "+91 " + phone, addr, city, pin, design, "", "", email]);
    return out_({ ok: true, order_id: o.id, amount: o.amount, key: PropertiesService.getScriptProperties().getProperty("RZP_KEY_ID") });
  } catch (err) { return out_({ ok: false, err: String(err.message || err) }); }
}
function verifyPayment_(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sec = PropertiesService.getScriptProperties().getProperty("RZP_KEY_SECRET");
    var sig = Utilities.computeHmacSha256Signature(d.order_id + "|" + d.payment_id, sec).map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
    if (sig !== d.signature) return out_({ ok: false, err: "Payment could not be verified" });
    var s = orders_(), rows = s.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][1] !== d.order_id) continue;
      s.getRange(i + 1, 3).setValue("paid"); s.getRange(i + 1, 13, 1, 2).setValues([[d.payment_id, new Date()]]);
      if (NOTIFY_EMAIL) try {
        MailApp.sendEmail(NOTIFY_EMAIL, "New order: " + rows[i][3] + " (Rs " + rows[i][5] + ")",
          ["Product: " + rows[i][3], "Options: " + rows[i][4], "Price: Rs " + rows[i][5], "", "Ship to: " + rows[i][6] + ", " + rows[i][8] + ", " + rows[i][9] + " " + rows[i][10], "Phone: " + rows[i][7],
           rows[i][11] ? "Design link (add &admin=1 for the print file): " + rows[i][11] : "", "", "Razorpay payment: " + d.payment_id, "Order: " + d.order_id].join("\n"));
      } catch (x) {}
      var to = rows[i][14];
      if (to && /@/.test(to)) try {
        var first = String(rows[i][6]).split(" ")[0];
        MailApp.sendEmail({ to: to, name: "NevervoidStore", replyTo: NOTIFY_EMAIL || undefined, subject: "Your NevervoidStore order is confirmed",
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a201c;max-width:520px">' +
            "<p>Hi " + first + ",</p><p>Thank you! We’ve received your order and payment. It’s made to order and usually reaches you in 5–7 days.</p>" +
            '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
            '<tr><td style="padding:6px 0;color:#5f665f">Product</td><td style="padding:6px 0"><b>' + rows[i][3] + "</b></td></tr>" +
            (rows[i][4] ? '<tr><td style="padding:6px 0;color:#5f665f">Your choices</td><td style="padding:6px 0">' + rows[i][4] + "</td></tr>" : "") +
            '<tr><td style="padding:6px 0;color:#5f665f">Paid</td><td style="padding:6px 0">Rs ' + rows[i][5] + "</td></tr>" +
            '<tr><td style="padding:6px 0;color:#5f665f">Delivering to</td><td style="padding:6px 0">' + rows[i][6] + ", " + rows[i][8] + ", " + rows[i][9] + " " + rows[i][10] + "</td></tr>" +
            '<tr><td style="padding:6px 0;color:#5f665f">Order ID</td><td style="padding:6px 0">' + d.order_id + "</td></tr></table>" +
            "<p>Questions? Just reply to this email or WhatsApp us on +91 98800 00990.</p><p>NevervoidStore<br>A brand by Nevervoid Photography, Bengaluru</p></div>" });
      } catch (x) {}
      return out_({ ok: true });
    }
    return out_({ ok: true, note: "order row not found" });
  } catch (err) { return out_({ ok: false, err: String(err.message || err) }); }
  finally { lock.releaseLock(); }
}

// ---------- team links ----------
var OWNER_EMAIL = NOTIFY_EMAIL;  // note when a company creates a team link
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

function teamGet_(e) {
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

function teamPost_(e) {
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
