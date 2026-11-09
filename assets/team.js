// NevervoidStore team name mugs: one list in, a real mug preview for every person, one quote request out.
(function () {
  "use strict";
  var M = window.NVMug, byKey = M.byKey, CFG = window.NV_TEAM || {};
  var TIERS = CFG.tiers || [[25, 379], [50, 349], [100, 319]], SMALL = CFG.small || 649, WA = CFG.wa || "919880000990";
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = { theme: "classic", font: "classic", color: "white", mode: "traits", traits: [], msg: "", text: "" };
  var listIn = $("#tm-list"), grid = $("#tm-grid"), chips = $("#tm-traits"), q = new URLSearchParams(location.search), ADMIN = q.get("admin") === "1";
  var rows = [], thumbs = {}, renderSeq = 0;

  // ---------- team defaults (what goes under every name) ----------
  chips.innerHTML = M.TRAITS.map(chipHtml).join("");
  function chipHtml(t) { return '<button type="button" class="cm-chip' + (t.custom ? " custom" : "") + '" data-k="' + t.k + '" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.svg + "</svg><span>" + t.l.replace(/[<>&"]/g, "") + "</span></button>"; }
  function syncChips() { $$("#tm-traits .cm-chip").forEach(function (b) { var on = st.traits.indexOf(b.dataset.k) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.classList.toggle("full", !on && st.traits.length >= 4); }); $("#tm-count").textContent = st.traits.length + " of 4 chosen"; }
  function addChip(k) { if (!chips.querySelector('[data-k="' + CSS.escape(k) + '"]')) chips.insertAdjacentHTML("afterbegin", chipHtml(byKey[k])); }
  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".cm-chip"); if (!b) return; var k = b.dataset.k, i = st.traits.indexOf(k);
    if (i >= 0) st.traits.splice(i, 1); else if (st.traits.length < 4) st.traits.push(k); else { flash("#tm-def-hint", "You can pick 4. Tap one to remove it first."); return; }
    syncChips(); update();
  });
  var ownIn = $("#tm-own");
  function addOwn() {
    var raw = ownIn.value, err = M.wordError(raw); if (err) { flash("#tm-def-hint", err === "Empty word" ? "Type a word first." : err + "."); return; }
    if (st.traits.length >= 4) { flash("#tm-def-hint", "You've picked 4. Tap one to remove it, then add yours."); return; }
    M.traitFor(raw.replace(/[^A-Za-z &'-]/g, "").trim()).then(function (k) { addChip(k); if (st.traits.indexOf(k) < 0) st.traits.push(k); ownIn.value = ""; syncChips(); update(); });
  }
  $("#tm-own-add").addEventListener("click", addOwn);
  ownIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addOwn(); } });
  ownIn.addEventListener("focus", M.loadIndex, { once: true });
  $$(".tm-mode").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.m); update(); }); });
  function setMode(m) { st.mode = m; $$(".tm-mode").forEach(function (x) { var on = x.dataset.m === m; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); }); $("#tm-pane-traits").hidden = m !== "traits"; $("#tm-pane-msg").hidden = m !== "msg"; }
  var msgIn = $("#tm-msg");
  msgIn.addEventListener("input", function () { var v = M.cleanMsg(msgIn.value).slice(0, 120); if (v !== msgIn.value) msgIn.value = v; $("#tm-msg-count").textContent = v.length + "/120"; st.msg = v.replace(/\n/g, " "); update(); });
  $$("[name=tm-theme]").forEach(function (r) { r.addEventListener("change", function () { st.theme = r.value; update(); }); });
  listIn.addEventListener("input", function () { st.text = listIn.value; update(); });
  var fontBox = $("#tm-fonts");
  fontBox.innerHTML = Object.keys(M.NAME_FONTS).map(function (k) { var f = M.NAME_FONTS[k]; return '<button type="button" class="cm-font' + (k === "classic" ? " on" : "") + '" data-f="' + k + '" role="radio" aria-checked="' + (k === "classic") + '"><span class="cm-font-name" style="font-family:' + f.family.replace(/"/g, "") + ';font-weight:' + f.weight + '">Priya</span><small>' + f.label + "</small></button>"; }).join("");
  fontBox.addEventListener("click", function (e) { var b = e.target.closest(".cm-font"); if (b) { setFont(b.dataset.f); update(); } });
  var colorBox = $("#tm-colors");
  colorBox.innerHTML = Object.keys(M.MUG_COLORS).map(function (k) { var c = M.MUG_COLORS[k]; return '<button type="button" class="cm-color' + (k === "white" ? " on" : "") + '" data-c="' + k + '" role="radio" aria-checked="' + (k === "white") + '"><i style="background:' + c.hex + '"></i><small>' + c.label + "</small></button>"; }).join("");
  colorBox.addEventListener("click", function (e) { var b = e.target.closest(".cm-color"); if (b) { setColor(b.dataset.c); update(); } });
  function setColor(k) { st.color = M.MUG_COLORS[k] ? k : "white"; $$("#tm-colors .cm-color").forEach(function (b) { var on = b.dataset.c === st.color; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); $("#tm-color-name").textContent = M.MUG_COLORS[st.color].label + (st.color === "white" ? "" : " handle & inside"); }
  function setFont(k) { st.font = M.NAME_FONTS[k] ? k : "classic"; $$("#tm-fonts .cm-font").forEach(function (b) { var on = b.dataset.f === st.font; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); }

  // ---------- the list: one person per line ----------
  // Priya                                   -> team's 4 things / message
  // Rahul, Cricket, Coffee lover, Music lover, Traveller  -> his own 4 things
  // Anita: Thank you for an amazing year!   -> her own message
  // Excel paste (tabs) or the template: Name | Thing 1..4 | Message
  function splitLine(line) {
    if (line.indexOf("\t") >= 0) return { cells: line.split("\t") };
    var ci = line.indexOf(":"), cm = line.indexOf(",");
    if (ci > 0 && (cm < 0 || ci < cm)) return { cells: [line.slice(0, ci)], msg: line.slice(ci + 1) };
    return { cells: csvCells(line) };
  }
  function csvCells(line) { var out = [], cur = "", qd = false; for (var i = 0; i < line.length; i++) { var c = line[i]; if (qd) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') qd = false; else cur += c; } else if (c === '"') qd = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; }
  function parse(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (line, ln) {
      if (!line.trim()) return;
      var sp = splitLine(line), cells = sp.cells.map(function (c) { return c.trim(); });
      if (!out.length && /^name$/i.test(cells[0])) return; // header row
      var name = cells[0] || "", things = cells.slice(1, 5).filter(Boolean), msg = sp.msg != null ? sp.msg.trim() : (cells[5] || "");
      if (!name && !things.length && !msg) return;
      out.push({ line: ln + 1, raw: { name: name, things: things, msg: msg } });
    });
    return out;
  }
  // resolve a parsed row into a design (async: typed words need the icon index)
  function resolve(r) {
    var raw = r.raw, d = { name: "", mode: st.mode, traits: st.traits.slice(), msg: st.msg, theme: st.theme, font: st.font, color: st.color }, errs = [], own = "";
    var nm = raw.name.replace(/\s{2,}/g, " ").trim(), ne = M.nameError(nm);
    if (ne) errs.push(ne); d.name = ne ? nm.slice(0, 14) : M.titleCase(nm);
    r.note = !ne && M.nameFit(d.name, d.font).small ? "Long name: prints a little smaller" : "";
    if (raw.msg) {
      own = "msg"; d.mode = "msg"; d.msg = M.cleanMsg(raw.msg).replace(/\n/g, " ").slice(0, 120); var me = M.msgError(raw.msg); if (me) errs.push(me);
      return Promise.resolve(fin());
    }
    if (raw.things.length) {
      own = "traits"; d.mode = "traits";
      if (raw.things.length < 4) errs.push("Has " + raw.things.length + " of 4 things. Add " + (4 - raw.things.length) + " more, or leave them all blank to use the team's");
      var bad = raw.things.map(M.wordError).filter(Boolean); if (bad.length) errs.push(bad[0]);
      return Promise.all(raw.things.map(function (w) { return M.traitFor(w.replace(/[^A-Za-z &'-]/g, "").trim() || "Star"); })).then(function (ks) { d.traits = ks; return fin(); });
    }
    if (st.mode === "msg" && M.msgError(st.msg)) errs.push("Team message is missing");
    if (st.mode === "traits" && st.traits.length < 4) errs.push("Pick the team's 4 things above");
    return Promise.resolve(fin());
    function fin() { r.d = d; r.errs = errs; r.own = own; r.key = M.encode(d); return r; }
  }

  // ---------- previews ----------
  var print = M.newPrint(), big = document.createElement("canvas"), thumb = document.createElement("canvas");
  big.width = big.height = 620; thumb.width = thumb.height = 360;
  function preview(d, view) {
    var id = M.encode(d) + "|" + view; if (thumbs[id]) return Promise.resolve(thumbs[id]);
    return M.render(print, d).then(function () { return M.wrapMug(print, view, big, d.color); }).then(function () {
      var t = thumb.getContext("2d"); t.imageSmoothingQuality = "high"; t.drawImage(big, 0, 0, 360, 360);
      return (thumbs[id] = thumb.toDataURL("image/jpeg", 0.82));
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function card(r, i) {
    var lab = r.d.mode === "msg" ? "“" + r.d.msg + "”" : r.d.traits.map(function (k) { return byKey[k] ? byKey[k].l : ""; }).join(" · ");
    return '<figure class="tm-card' + (r.errs.length ? " bad" : "") + '" data-i="' + i + '"><button type="button" class="tm-img" aria-label="Turn ' + esc(r.d.name || "this mug") + '’s mug"><img alt="" src="' + (thumbs[r.key + "|r"] || "") + '"><span class="tm-turn">↻</span></button>' +
      '<figcaption><b>' + (i + 1) + ". " + esc(r.d.name || "(no name)") + "</b><span>" + esc(lab) + (r.own ? ' <em class="tm-own-tag">own</em>' : "") + "</span>" + (r.note && !r.errs.length ? '<span class="tm-note">' + r.note + "</span>" : "") +
      (r.errs.length ? '<span class="tm-err">Line ' + r.line + ": " + esc(r.errs.join(". ")) + "</span>" : "") +
      (ADMIN && !r.errs.length ? '<button type="button" class="tm-dl1">Print file</button>' : "") + "</figcaption></figure>";
  }
  grid.addEventListener("click", function (e) {
    var fig = e.target.closest(".tm-card"); if (!fig) return; var r = rows[+fig.dataset.i]; if (!r) return;
    if (e.target.closest(".tm-dl1")) { M.render(print, r.d).then(function () { var a = document.createElement("a"); a.download = M.fileName(r.d, +fig.dataset.i); a.href = print.toDataURL("image/png"); a.click(); }); return; }
    if (e.target.closest(".tm-img")) { var v = fig.dataset.v === "l" ? "r" : "l"; fig.dataset.v = v; preview(r.d, v).then(function (src) { fig.querySelector("img").src = src; }); }
  });

  var timer = null;
  function update() { clearTimeout(timer); timer = setTimeout(rebuild, 350); }
  function rebuild() {
    var seq = ++renderSeq, parsed = parse(st.text);
    return Promise.all(parsed.map(resolve)).then(function (rs) {
      if (seq !== renderSeq) return;
      rows = rs; grid.innerHTML = rows.map(card).join(""); summary();
      // fill previews one at a time so the page stays responsive
      var i = 0, figs = grid.querySelectorAll(".tm-card");
      (function next() {
        if (seq !== renderSeq || i >= rows.length) { if (seq === renderSeq) $("#tm-progress").textContent = ""; return; }
        var r = rows[i], fig = figs[i]; i++;
        if (rows.length > 3) $("#tm-progress").textContent = "Preparing mug " + i + " of " + rows.length + "…";
        preview(r.d, "r").then(function (src) { if (seq === renderSeq) fig.querySelector("img").src = src; setTimeout(next, 0); }, function () { setTimeout(next, 0); });
      })();
    });
  }
  function rupee(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function priceFor(n) { var p = SMALL; TIERS.forEach(function (t) { if (n >= t[0]) p = t[1]; }); return p; }
  function summary() {
    var ok = rows.filter(function (r) { return !r.errs.length; }).length, bad = rows.length - ok, n = rows.length, each = priceFor(n), box = $("#tm-sum");
    $("#tm-empty").hidden = n > 0; box.hidden = n === 0;
    if (!n) return;
    var next = null; TIERS.forEach(function (t) { if (!next && n < t[0]) next = t; });
    $("#tm-n").textContent = n + " mug" + (n === 1 ? "" : "s");
    $("#tm-each").textContent = rupee(each) + " each";
    $("#tm-total").textContent = rupee(each * n);
    $("#tm-tier").textContent = n < TIERS[0][0] ? "Team pricing starts at " + TIERS[0][0] + " mugs (" + rupee(TIERS[0][1]) + " each). Add " + (TIERS[0][0] - n) + " more to get it." : next ? "Add " + (next[0] - n) + " more for " + rupee(next[1]) + " each." : "Best price unlocked.";
    $("#tm-bad").hidden = !bad; $("#tm-bad").textContent = bad ? bad + " mug" + (bad === 1 ? " needs" : "s need") + " a fix (marked in red below). Edit the list and the preview updates." : "";
    $("#tm-send").disabled = bad > 0;
    if (ADMIN) $("#tm-zip").disabled = bad > 0;
  }

  // ---------- upload: CSV or Excel (.xlsx read in the browser) ----------
  $("#tm-file").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return; e.target.value = "";
    var p = /\.xlsx$/i.test(f.name) ? f.arrayBuffer().then(xlsxRows) : f.text().then(function (t) { return t.replace(/^﻿/, "").split(/\r?\n/).map(csvCells); });
    p.then(function (table) {
      var lines = table.map(function (cells) { return cells.map(function (c) { return String(c == null ? "" : c).replace(/[\t\r\n]+/g, " ").trim(); }).join("\t").replace(/\t+$/, ""); }).filter(function (l) { return l.replace(/\t/g, "").trim(); });
      listIn.value = lines.join("\n"); st.text = listIn.value; update(); flash("#tm-list-hint", "Loaded " + Math.max(0, lines.length - (/^name\b/i.test(lines[0] || "") ? 1 : 0)) + " people from " + f.name + ".", true);
    }).catch(function () { flash("#tm-list-hint", "Couldn't read that file. Save it as .xlsx or .csv and try again."); });
  });
  function unzipEntry(buf, want) { // minimal ZIP reader for one entry
    var dv = new DataView(buf), u8 = new Uint8Array(buf), eocd = -1;
    for (var i = u8.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject();
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true), name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      if (name === want) {
        var start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), data = u8.subarray(start, start + csz);
        if (method === 0) return Promise.resolve(dec.decode(data));
        return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
      }
      p += 46 + nl + el + cl;
    }
    return Promise.resolve(null);
  }
  function xlsxRows(buf) {
    return Promise.all([unzipEntry(buf, "xl/sharedStrings.xml"), unzipEntry(buf, "xl/worksheets/sheet1.xml")]).then(function (r) {
      var P = new DOMParser(), ss = [];
      if (r[0]) Array.prototype.forEach.call(P.parseFromString(r[0], "application/xml").getElementsByTagName("si"), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName("t"), function (t) { return t.textContent; }).join("")); });
      var sheet = P.parseFromString(r[1], "application/xml"), out = [];
      Array.prototype.forEach.call(sheet.getElementsByTagName("row"), function (row) {
        var cells = [];
        Array.prototype.forEach.call(row.getElementsByTagName("c"), function (c) {
          var ref = c.getAttribute("r") || "", col = 0, m = ref.match(/^[A-Z]+/); if (m) for (var i = 0; i < m[0].length; i++) col = col * 26 + m[0].charCodeAt(i) - 64;
          var t = c.getAttribute("t"), v = c.getElementsByTagName("v")[0], is = c.getElementsByTagName("is")[0];
          var val = t === "s" && v ? ss[+v.textContent] : t === "inlineStr" && is ? is.textContent : v ? v.textContent : "";
          cells[(col || cells.length + 1) - 1] = val;
        });
        out.push(Array.prototype.slice.call(cells).map(function (x) { return x == null ? "" : x; }));
      });
      return out;
    });
  }

  // ---------- share: a link that rebuilds every mug ----------
  function b64u(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function packState() {
    var json = JSON.stringify({ v: 1, th: st.theme, f: st.font, mc: st.color, m: st.mode, t: st.traits.map(function (k) { return byKey[k] && byKey[k].custom ? "_" + k.split("_")[1] + "_" + encodeURIComponent(byKey[k].l) : k; }), g: st.msg, l: st.text.trim(), c: $("#tm-co").value.trim() });
    var bytes = new TextEncoder().encode(json);
    if (window.CompressionStream) return new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer().then(function (ab) { return "z" + b64u(new Uint8Array(ab)); });
    return Promise.resolve("j" + b64u(bytes));
  }
  function unpack(s) {
    var bytes = unb64u(s.slice(1));
    var p = s[0] === "z" ? new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text() : Promise.resolve(new TextDecoder().decode(bytes));
    return p.then(JSON.parse);
  }
  function link() { return packState().then(function (z) { return location.origin + "/team/#t=" + z; }); }

  $("#tm-send").addEventListener("click", function () {
    var co = $("#tm-co").value.trim(), who = $("#tm-who").value.trim(), pin = $("#tm-pin").value.trim(), when = $("#tm-when").value, ship = ($("[name=tm-ship]:checked") || {}).value || "office";
    if (!co || !who) { flash("#tm-send-hint", "Add your company and your name so we know who the quote is for."); ($("#tm-co").value ? $("#tm-who") : $("#tm-co")).focus(); return; }
    if (ship === "office" && !/^5[6-9]\d{4}$/.test(pin)) { flash("#tm-send-hint", "Add the office pincode (Karnataka, starts with 56–59)."); $("#tm-pin").focus(); return; }
    var n = rows.length, each = priceFor(n), own = rows.filter(function (r) { return r.own; }).length;
    var win = window.open("about:blank", "_blank");
    link().then(function (url) {
      var txt = "Hi NevervoidStore, I'd like a quote for team name mugs.\n\n" +
        "Company: " + co + "\nName: " + who + "\nMugs: " + n + " (" + rupee(each) + " each, about " + rupee(each * n) + " before delivery)\n" +
        "Style: " + M.THEMES[st.theme].label + ", " + M.NAME_FONTS[st.font].label + " lettering, " + (st.color === "white" ? "white mug" : M.MUG_COLORS[st.color].label.toLowerCase() + " handle & inside") + "\nUnder each name: " + (st.mode === "msg" ? "message “" + st.msg.trim() + "”" : "4 things: " + st.traits.map(function (k) { return byKey[k].l; }).join(", ")) + (own ? " (" + own + " people have their own)" : "") + "\n" +
        "Delivery: " + (ship === "office" ? "one office, pincode " + pin : "to each person's home (I'll share addresses)") + (when ? "\nNeeded by: " + when : "") + "\n\nAll " + n + " designs: " + url;
      var wa = "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt);
      if (window.nvTrack) window.nvTrack("Lead", { content_name: "Team mug quote", value: each * n, currency: "INR", num_items: n });
      if (win) win.location.href = wa; else location.href = wa;
    });
  });
  $("#tm-copy").addEventListener("click", function () { link().then(function (url) { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { flash("#tm-send-hint", "Link copied. Anyone with it sees these exact mugs.", true); }, function () { prompt("Copy this link:", url); }); }); });
  $("#tm-csv").addEventListener("click", function () {
    var lines = [["#", "Name", "Thing 1", "Thing 2", "Thing 3", "Thing 4", "Message", "Style", "Needs a fix"]].concat(rows.map(function (r, i) { var t = r.d.mode === "traits" ? r.d.traits.map(function (k) { return byKey[k] ? byKey[k].l : ""; }) : []; while (t.length < 4) t.push(""); return [i + 1, r.d.name].concat(t, [r.d.mode === "msg" ? r.d.msg : "", M.THEMES[r.d.theme].label, r.errs.join(". ")]); }));
    var csv = "﻿" + lines.map(function (l) { return l.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.download = "team-mugs.csv"; a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.click();
  });

  // ---------- owner: every print file in one zip ----------
  if (ADMIN) {
    $("#tm-admin").hidden = false;
    $("#tm-zip").addEventListener("click", function () {
      var btn = this, files = [], i = 0, co = ($("#tm-co").value.trim() || "team").replace(/[^A-Za-z0-9]+/g, "-");
      btn.disabled = true;
      (function next() {
        if (i >= rows.length) {
          var man = "#,Name,Under the name,Style,File\r\n" + rows.map(function (r, j) { return [j + 1, r.d.name, M.labels(r.d), M.THEMES[r.d.theme].label, M.fileName(r.d, j)].map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
          files.push({ name: "list.csv", data: new TextEncoder().encode("﻿" + man) });
          var a = document.createElement("a"); a.download = "NevervoidStore-" + co + "-" + rows.length + "-mugs.zip"; a.href = URL.createObjectURL(M.zip(files)); a.click();
          btn.disabled = false; btn.textContent = "Download all print files (.zip)"; return;
        }
        var r = rows[i], j = i++; btn.textContent = "Preparing " + i + " of " + rows.length + "…";
        M.render(print, r.d).then(function () { return M.canvasPNG(print); }).then(function (png) { files.push({ name: M.fileName(r.d, j), data: png }); setTimeout(next, 0); });
      })();
    });
  }

  function flash(sel, t, good) { var h = $(sel); h.textContent = t; h.classList.toggle("warn", !good); h.classList.toggle("good", !!good); clearTimeout(h._t); h._t = setTimeout(function () { h.classList.remove("warn", "good"); }, 2600); }

  // ---------- collect: one link, each person designs their own (Google Sheet backend) ----------
  var API = CFG.api, TEAM = q.get("t"), KEY = q.get("k");
  function api(body) { return fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
  function joinUrl() { return location.origin + "/team/join/?t=" + TEAM; }
  function dashUrl() { return location.origin + "/team/?t=" + TEAM + "&k=" + KEY; }
  function lineFor(d) { return d.mode === "msg" ? d.name + ": " + d.msg : d.name + ", " + d.traits.map(function (k) { return byKey[k] ? byKey[k].l : ""; }).join(", "); }
  var teamOpen = true;
  function loadTeam() {
    $("#tm-c-msg").textContent = "Loading your team…";
    return fetch(API + "?a=list&t=" + encodeURIComponent(TEAM) + "&k=" + encodeURIComponent(KEY)).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) { $("#tm-c-msg").textContent = "This private link isn't valid. Check you copied all of it."; return; }
      var t = res.team; teamOpen = t.open;
      $("#tm-c-title").textContent = t.company + " team mugs";
      $("#tm-c-count").textContent = res.entries.length + " designed";
      $("#tm-c-state").textContent = t.open ? "· collecting" : "· closed";
      $("#tm-c-toggle").textContent = t.open ? "Stop collecting" : "Start collecting again";
      $("#tm-co").value = $("#tm-co").value || t.company; $("#tm-who").value = $("#tm-who").value || t.organiser;
      st.theme = M.THEMES[t.theme] ? t.theme : "classic"; var r = document.querySelector("[name=tm-theme][value=" + st.theme + "]"); if (r) r.checked = true;
      document.querySelector(".tm-setup .cm-themes").closest(".cm-step").classList.add("tm-locked");
      return Promise.all(res.entries.map(function (e) { return M.decode(e.d); })).then(function (ds) {
        listIn.value = st.text = ds.map(lineFor).join("\n");
        $("#tm-c-msg").textContent = ds.length ? "The list below is everyone who has designed a mug so far. You can edit it before you send it." : "No one has designed a mug yet. Share the link above with your team.";
        rebuild();
      });
    }).catch(function () { $("#tm-c-msg").textContent = "Couldn't load your team. Please refresh."; });
  }
  function showLive() {
    $("#tm-c-intro").hidden = true; $("#tm-c-form").hidden = true; $("#tm-c-live").hidden = false;
    $("#tm-c-join").value = joinUrl(); $("#tm-c-dash").value = dashUrl();
    $("#tm-c-wa").href = "https://wa.me/?text=" + encodeURIComponent("Design your own mug for our team gift. It takes a minute: " + joinUrl());
  }
  if (API) {
    $("#tm-c-start").addEventListener("click", function () { $("#tm-c-form").hidden = false; $("#tm-c-co").focus(); });
    $("#tm-c-create").addEventListener("click", function () {
      var co = $("#tm-c-co").value.trim(), who = $("#tm-c-who").value.trim(), ph = $("#tm-c-ph").value.replace(/[^\d+]/g, ""), b = this;
      if (!co || !who) { flash("#tm-c-hint", "Add your company and your name."); return; }
      if (ph.replace(/\D/g, "").length < 10) { flash("#tm-c-hint", "Add your WhatsApp number so we can reach you."); return; }
      b.disabled = true; b.textContent = "Creating…";
      api({ a: "create", company: co, organiser: who, phone: ph, theme: st.theme }).then(function (res) {
        b.disabled = false; b.textContent = "Create team link";
        if (!res.ok) { flash("#tm-c-hint", "Couldn't create the link. Please try again."); return; }
        TEAM = res.id; KEY = res.key; history.replaceState(null, "", "/team/?t=" + TEAM + "&k=" + KEY);
        try { localStorage.setItem("nv-team-dash", dashUrl()); } catch (e) {}
        showLive(); loadTeam();
      }).catch(function () { b.disabled = false; b.textContent = "Create team link"; flash("#tm-c-hint", "Couldn't create the link. Check your connection."); });
    });
    $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { var i = $(b.dataset.copy); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); }, function () { document.execCommand("copy"); }); }); });
    $("#tm-c-refresh").addEventListener("click", function () { loadTeam(); });
    $("#tm-c-toggle").addEventListener("click", function () { api({ a: "open", t: TEAM, k: KEY, open: !teamOpen }).then(function (res) { if (res.ok) loadTeam(); }); });
    if (TEAM && KEY) { showLive(); loadTeam(); }
    else { var mine = null; try { mine = localStorage.getItem("nv-team-dash"); } catch (e) {} if (mine) $("#tm-c-intro").insertAdjacentHTML("beforeend", ' <a class="linkbtn" href="' + mine.replace(/"/g, "") + '">Open my team page →</a>'); }
  }

  // ---------- open a shared team link ----------
  var h = location.hash.match(/[#&]t=([\w-]+)/);
  if (h) {
    unpack(h[1]).then(function (s) {
      st.theme = M.THEMES[s.th] ? s.th : "classic"; var r = document.querySelector("[name=tm-theme][value=" + st.theme + "]"); if (r) r.checked = true;
      setFont(s.f); setColor(s.mc); setMode(s.m === "msg" ? "msg" : "traits"); st.msg = s.g || ""; msgIn.value = st.msg; $("#tm-msg-count").textContent = st.msg.length + "/120";
      st.text = s.l || ""; listIn.value = st.text; if (s.c) $("#tm-co").value = s.c;
      return Promise.all((s.t || []).map(function (k) { if (byKey[k]) return k; if (k[0] === "_") { var b = k.split("_"); return M.addCustom(decodeURIComponent(b.slice(2).join("_")), b[1]); } return null; }));
    }).then(function (ks) { st.traits = ks.filter(Boolean); st.traits.forEach(function (k) { if (byKey[k].custom) addChip(k); }); syncChips(); $("#tm-shared").hidden = false; rebuild(); })
      .catch(function () { flash("#tm-list-hint", "That team link looks incomplete. Ask for it again, or paste your list below."); });
  } else {
    st.traits = ["rocket", "brain", "laugh", "heart"].filter(function (k) { return byKey[k]; }); st.traits.slice().reverse().forEach(function (k) { var b = chips.querySelector('[data-k="' + k + '"]'); if (b) chips.insertBefore(b, chips.firstChild); }); syncChips();
  }
})();
