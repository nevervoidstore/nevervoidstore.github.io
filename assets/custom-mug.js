// NevervoidStore "Your Name Mug" builder: name + 4 traits -> print-ready design (2550x1140, Printrove's mug print area) + live mug preview.
(function () {
  "use strict";
  var PW = 2550, PH = 1140, FRONT = Math.round(0.78 * PW), BACK = Math.round(0.205 * PW);
  var TRAITS = window.NV_TRAITS || [], byKey = {};
  TRAITS.forEach(function (t) { byKey[t.k] = t; });
  var THEMES = {
    classic: { label: "Christmas Classic", name: "#c41826", accent: "#1c603a", line: "#c9a24a", icon: "#1c603a", text: "#3a3f3c" },
    navy:    { label: "Navy & Gold",       name: "#162c54", accent: "#b88c3c", line: "#b88c3c", icon: "#162c54", text: "#46505e" },
    sage:    { label: "Charcoal & Sage",   name: "#2b2f33", accent: "#6e8c78", line: "#6e8c78", icon: "#2b2f33", text: "#55605a" },
    rose:    { label: "Rose",              name: "#a8445e", accent: "#c9877a", line: "#c9a24a", icon: "#a8445e", text: "#5e4a50" }
  };
  var state = { name: "", traits: [], theme: "classic", view: "r", approved: false };
  var $ = function (s) { return document.querySelector(s); };
  var print = document.createElement("canvas"); print.width = PW; print.height = PH;
  var mug = $("#cm-mug"), nameIn = $("#cm-name"), chips = $("#cm-traits");

  // fonts used on the mug (self-hosted)
  var FONTS = [["NVPlayfair", "playfair-display-latin-900-normal.woff2", "900"], ["NVPlayfairB", "playfair-display-latin-700-normal.woff2", "700"],
               ["NVScript", "pacifico-latin-400-normal.woff2", "400"], ["NVSans", "dm-sans-latin-600-normal.woff2", "600"]];
  var fontsReady = Promise.all(FONTS.map(function (f) {
    try { var ff = new FontFace(f[0], "url(/assets/fonts/" + f[1] + ")", { weight: f[2] }); return ff.load().then(function (x) { document.fonts.add(x); }); }
    catch (e) { return Promise.resolve(); }
  })).catch(function () {});

  // icons: Lucide line icons drawn as SVG images in the theme colour
  var iconCache = {};
  function icon(key, color) {
    var id = key + color; if (iconCache[id]) return iconCache[id];
    var t = byKey[key]; if (!t) return Promise.resolve(null);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + t.svg + "</svg>";
    iconCache[id] = new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    return iconCache[id];
  }
  function fitFont(ctx, text, family, weight, max, min, maxw) {
    var s = max; ctx.font = weight + " " + s + "px " + family;
    while (s > min && ctx.measureText(text).width > maxw) { s -= 4; ctx.font = weight + " " + s + "px " + family; }
    return s;
  }
  function flourish(ctx, cx, y, w, color) {
    ctx.fillStyle = color;
    [-1, 1].forEach(function (dir) {
      ctx.beginPath(); ctx.moveTo(cx + dir * 38, y - 3); ctx.lineTo(cx + dir * w, y); ctx.lineTo(cx + dir * 38, y + 3); ctx.closePath(); ctx.fill();
      [56, 74].forEach(function (d, i) { ctx.beginPath(); ctx.arc(cx + dir * (w + d - 30), y, 5 - i * 1.5, 0, 7); ctx.fill(); });
    });
    ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-12, -12, 24, 24); ctx.restore();
    ctx.fillStyle = "#fff"; ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
  }
  function label(ctx, text, x, y, color) {
    var t = text.toUpperCase(); ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var s = fitFont(ctx, t, "NVSans, sans-serif", 600, 36, 34, 152);
    if (ctx.measureText(t).width <= 152) { ctx.fillText(t, x, y); return; }
    if (t.indexOf(" ") < 0) { ctx.font = "600 34px NVSans, sans-serif"; ctx.fillText(t, x, y, 158); return; }
    var w = t.split(" "); var a = w.slice(0, Math.ceil(w.length / 2)).join(" "), b = w.slice(Math.ceil(w.length / 2)).join(" ");
    fitFont(ctx, a.length > b.length ? a : b, "NVSans, sans-serif", 600, 34, 28, 156); ctx.fillText(a, x, y - 20); ctx.fillText(b, x, y + 20);
  }
  function drawPrint() {
    var th = THEMES[state.theme], ctx = print.getContext("2d"), name = state.name || "Your Name";
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
    // front: name, flourish, four icons with labels
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = th.name;
    fitFont(ctx, name, "NVPlayfair, Georgia, serif", 900, 200, 90, 610); ctx.fillText(name, FRONT, 500);
    flourish(ctx, FRONT, 585, 230, th.line);
    var xs = [-237, -79, 79, 237], jobs = [], IY = 730;
    state.traits.forEach(function (k, i) {
      var x = FRONT + xs[i];
      ctx.strokeStyle = th.accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, IY, 72, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      label(ctx, byKey[k] ? byKey[k].l : k, x, 878, th.text);
      jobs.push(icon(k, th.icon).then(function (im) { if (im) ctx.drawImage(im, x - 52, IY - 52, 104, 104); }));
    });
    for (var i = state.traits.length; i < 4; i++) { var x = FRONT + xs[i]; ctx.setLineDash([10, 10]); ctx.strokeStyle = "#cfc8bb"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, IY, 72, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    // back: monogram seal + "made for"
    var ini = (state.name.trim()[0] || "N").toUpperCase();
    ctx.strokeStyle = th.line; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(BACK, 545, 235, 0, 7); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(BACK, 545, 213, 0, 7); ctx.stroke();
    ctx.fillStyle = th.name; ctx.textBaseline = "middle"; ctx.font = "900 300px NVPlayfair, Georgia, serif"; ctx.fillText(ini, BACK, 558);
    [-1, 1].forEach(function (d) { ctx.save(); ctx.translate(BACK + d * 235, 545); ctx.rotate(Math.PI / 4); ctx.fillStyle = th.line; ctx.fillRect(-11, -11, 22, 22); ctx.restore(); });
    ctx.fillStyle = th.accent; ctx.textBaseline = "alphabetic"; fitFont(ctx, "made for " + name, "NVScript, cursive", 400, 70, 40, 600); ctx.fillText("made for " + name, BACK, 920);
    // fine double line round the base (wraps the whole mug)
    ctx.fillStyle = th.line; ctx.fillRect(0, 1048, PW, 5); ctx.fillRect(0, 1064, PW, 2);
    return Promise.all(jobs);
  }
  // 2D mug preview: the print wrapped on a cylinder (same geometry as the real 11oz mug)
  function drawMug() {
    var c = mug.getContext("2d"), W = mug.width, H = mug.height; c.clearRect(0, 0, W, H);
    var right = state.view === "r", R = 190, cx = W / 2 + (right ? -50 : 50), x0 = cx - R, x1 = cx + R, y0 = 110, y1 = 590, rim = 34;
    var centre = right ? FRONT : BACK, pxPerRad = 487.5, printTop = y0 + 14, printH = (y1 - y0) - 26;
    // shadow
    c.save(); c.filter = "blur(14px)"; c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(cx + (right ? 30 : -30), y1 + 8, R * 1.05, 22, 0, 0, 7); c.fill(); c.restore();
    // handle
    var hx = right ? x1 + 58 : x0 - 58;
    c.save(); c.lineWidth = 40; var hg = c.createLinearGradient(hx - 90, 0, hx + 90, 0); hg.addColorStop(0, "#d9d9d9"); hg.addColorStop(0.5, "#fbfbfb"); hg.addColorStop(1, "#c9c9c9");
    c.strokeStyle = hg; c.beginPath(); c.ellipse(hx, (y0 + y1) / 2 - 10, 78, 132, 0, 0, 7); c.stroke(); c.restore();
    // body
    c.save(); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.ellipse(cx, y1, R, 20, 0, 0, Math.PI); c.closePath(); c.clip();
    c.fillStyle = "#fff"; c.fillRect(x0, y0 - rim, 2 * R, y1 - y0 + 60);
    for (var i = 0; i < 2 * R; i++) {
      var t = (i + 0.5 - R) / R, th = Math.asin(t), sx = centre + th * pxPerRad, sw = Math.max(1, pxPerRad / (R * Math.sqrt(Math.max(0.02, 1 - t * t))));
      if (sx < 0 || sx + sw > PW) continue;
      c.drawImage(print, sx, 0, sw, PH, x0 + i, printTop, 1.4, printH);
    }
    var g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "rgba(0,0,0,.24)"); g.addColorStop(0.18, "rgba(0,0,0,.06)"); g.addColorStop(0.35, "rgba(255,255,255,0)"); g.addColorStop(0.42, "rgba(255,255,255,.35)");
    g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(0.82, "rgba(0,0,0,.08)"); g.addColorStop(1, "rgba(0,0,0,.28)");
    c.fillStyle = g; c.fillRect(x0, y0, 2 * R, y1 - y0 + 30); c.restore();
    // rim
    c.save(); c.beginPath(); c.ellipse(cx, y0, R, rim, 0, 0, 7); var rg = c.createLinearGradient(0, y0 - rim, 0, y0 + rim); rg.addColorStop(0, "#e9e9e9"); rg.addColorStop(1, "#bdbdbd"); c.fillStyle = rg; c.fill();
    c.beginPath(); c.ellipse(cx, y0 + 3, R - 12, rim - 8, 0, 0, 7); var ig = c.createLinearGradient(0, y0 - rim, 0, y0 + rim); ig.addColorStop(0, "#9a9a9a"); ig.addColorStop(1, "#e6e6e6"); c.fillStyle = ig; c.fill(); c.restore();
    var pimg = $("#pimg"); if (pimg) pimg.src = mug.toDataURL("image/jpeg", 0.82);
  }
  var pending = 0;
  function render() {
    var seq = ++pending;
    fontsReady.then(drawPrint).then(function () { if (seq === pending) { drawMug(); var flat = $("#cm-flat"); if (flat) { var fc = flat.getContext("2d"); fc.drawImage(print, 0, 0, flat.width, flat.height); } } });
    var n = state.traits.length; $("#cm-count").textContent = n + " of 4 chosen";
    var ok = state.name.trim().length > 0 && n === 4; $("#cm-approve").disabled = !ok;
    $("#cm-hint").textContent = !state.name.trim() ? "Type a name to start." : n < 4 ? "Pick " + (4 - n) + " more thing" + (4 - n === 1 ? "" : "s") + " that describe them." : "Looks good? Approve the design to order.";
    if (state.approved) unapprove();
  }
  // chips
  chips.innerHTML = TRAITS.map(function (t) {
    return '<button type="button" class="cm-chip" data-k="' + t.k + '" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.svg + "</svg><span>" + t.l + "</span></button>";
  }).join("");
  chips.addEventListener("click", function (e) {
    var b = e.target.closest(".cm-chip"); if (!b) return; var k = b.dataset.k, i = state.traits.indexOf(k);
    if (i >= 0) state.traits.splice(i, 1); else if (state.traits.length < 4) state.traits.push(k); else { flash("You can pick 4. Tap one to remove it first."); return; }
    syncChips(); render();
  });
  function syncChips() { chips.querySelectorAll(".cm-chip").forEach(function (b) { var on = state.traits.indexOf(b.dataset.k) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.classList.toggle("full", !on && state.traits.length >= 4); }); }
  function flash(t) { var h = $("#cm-hint"); h.textContent = t; h.classList.add("warn"); setTimeout(function () { h.classList.remove("warn"); }, 1600); }
  nameIn.addEventListener("input", function () {
    var v = nameIn.value.replace(/[^A-Za-zÀ-ɏ .'-]/g, "").replace(/\s{2,}/g, " ").slice(0, 14);
    if (v !== nameIn.value) nameIn.value = v;
    state.name = v.trim() ? v.trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : ""; render();
  });
  document.querySelectorAll("[name=cm-theme]").forEach(function (r) { r.addEventListener("change", function () { state.theme = r.value; render(); }); });
  document.querySelectorAll(".cm-view").forEach(function (b) { b.addEventListener("click", function () { state.view = b.dataset.v; document.querySelectorAll(".cm-view").forEach(function (x) { x.classList.toggle("on", x === b); }); drawMug(); }); });
  $("#cm-reset").addEventListener("click", function () {
    state.name = ""; state.traits = []; nameIn.value = ""; syncChips(); unapprove(); render(); nameIn.focus(); window.scrollTo({ top: $(".cm").offsetTop - 70, behavior: "smooth" });
  });
  function spec() { return encodeURIComponent(state.name) + "~" + state.traits.join(".") + "~" + state.theme; }
  function unapprove() { state.approved = false; $("#cm-order").hidden = true; $("#cm-approve").hidden = false; }
  $("#cm-approve").addEventListener("click", function () {
    state.approved = true; $("#cm-approve").hidden = true; var box = $("#cm-order"); box.hidden = false;
    var btn = box.querySelector("[data-order]"), labels = state.traits.map(function (k) { return byKey[k].l; }).join(", ");
    btn.dataset.name = "Custom Name Mug: " + state.name + " | " + labels + " | " + THEMES[state.theme].label + " | design nevervoidstore.com/custom-mug/?d=" + spec();
    $("#cm-summary").textContent = state.name + " · " + labels + " · " + THEMES[state.theme].label;
    drawMug(); box.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  // prefill from a design link (?d=Name~k1.k2.k3.k4~theme); ?admin=1 adds a download of the print file for Printrove
  var q = new URLSearchParams(location.search), d = q.get("d");
  if (d) { var p = d.split("~"); state.name = decodeURIComponent(p[0] || "").slice(0, 14); nameIn.value = state.name; state.traits = (p[1] || "").split(".").filter(function (k) { return byKey[k]; }).slice(0, 4); if (THEMES[p[2]]) { state.theme = p[2]; var r = document.querySelector("[name=cm-theme][value=" + p[2] + "]"); if (r) r.checked = true; } syncChips(); }
  if (q.get("admin") === "1") {
    var dl = document.createElement("button"); dl.type = "button"; dl.className = "buy"; dl.textContent = "Download print file (2550 × 1140)";
    dl.addEventListener("click", function () { var a = document.createElement("a"); a.download = "NevervoidStore-custom-" + (state.name || "mug").replace(/\s+/g, "-") + "-2550x1140.png"; a.href = print.toDataURL("image/png"); a.click(); });
    $("#cm-reset").after(dl);
  }
  render();
})();
