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
  var state = { name: "", traits: [], theme: "classic", view: "r", approved: false, mode: "traits", msg: "" };
  var BAD = /\b(fuck|fck|shit|bitch|bastard|asshole|dick|cunt|slut|whore|porn|sex|nude|rape|nigg|chutiya|chutia|madarchod|bhenchod|behenchod|bhosdi|gaand|gandu|lund|randi|harami|kutta|kamina)\w*/i;
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
  function wrap(ctx, text, maxw) { var words = text.split(/\s+/), lines = [], cur = ""; words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxw && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
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
    if (t.indexOf(" ") < 0) { fitFont(ctx, t, "NVSans, sans-serif", 600, 34, 22, 160); ctx.fillText(t, x, y); return; }
    var w = t.split(" "); var a = w.slice(0, Math.ceil(w.length / 2)).join(" "), b = w.slice(Math.ceil(w.length / 2)).join(" ");
    fitFont(ctx, a.length > b.length ? a : b, "NVSans, sans-serif", 600, 34, 28, 156); ctx.fillText(a, x, y - 20); ctx.fillText(b, x, y + 20);
  }
  function drawPrint() {
    var th = THEMES[state.theme], ctx = print.getContext("2d"), name = state.name || "Your Name";
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
    // front: name, flourish, four icons with labels
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = th.name;
    fitFont(ctx, name, "NVPlayfair, Georgia, serif", 900, 180, 90, 610); ctx.fillText(name, FRONT, 420);
    flourish(ctx, FRONT, 495, 230, th.line);
    var jobs = [];
    if (state.mode === "msg") {
      var text = state.msg.trim() || "Your message here", lines, size;
      for (size = 66; size >= 40; size -= 2) { ctx.font = "400 " + size + "px NVScript, cursive"; lines = wrap(ctx, text, 600); if (lines.length * size * 1.45 <= 400) break; }
      ctx.fillStyle = state.msg.trim() ? th.accent : "#c9c2b6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var lh = size * 1.45, top = 640 + (400 - lines.length * lh) / 2 - 40;
      lines.forEach(function (ln, i) { ctx.fillText(ln, FRONT, top + lh * (i + 0.5)); });
    } else {
      // centred list: icon in a soft circle, word beside it; every word the same readable size
      var items = state.traits.slice(), ROW = 100, FS = 46; ctx.font = "600 " + FS + "px NVSans, sans-serif";
      var maxw = 0; items.forEach(function (k) { maxw = Math.max(maxw, ctx.measureText(byKey[k] ? byKey[k].l : k).width); });
      if (!items.length) maxw = 260;
      var blockW = Math.min(610, 84 + 26 + maxw), left = FRONT - blockW / 2, y0 = 585;
      for (var i = 0; i < 4; i++) {
        var y = y0 + i * ROW, k = items[i], cxI = left + 42;
        if (k) {
          ctx.fillStyle = th.accent; ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(cxI, y, 42, 0, 7); ctx.fill(); ctx.globalAlpha = 0.6; ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1;
          ctx.fillStyle = th.text; ctx.textAlign = "left"; ctx.textBaseline = "middle"; fitFont(ctx, byKey[k].l, "NVSans, sans-serif", 600, FS, 30, blockW - 110); ctx.fillText(byKey[k].l, left + 110, y + 2);
          (function (kk, cx, cy) { jobs.push(icon(kk, th.icon).then(function (im) { if (im) ctx.drawImage(im, cx - 29, cy - 29, 58, 58); })); })(k, cxI, y);
        } else { ctx.setLineDash([8, 8]); ctx.strokeStyle = "#d6cfc2"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cxI, y, 38, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#e7e1d6"; ctx.fillRect(left + 102, y - 8, Math.max(120, maxw * 0.7), 16); }
      }
    }
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
  // real-mug preview: Printrove's own mug photo with the print wrapped using the measured cylinder maps
  var MUGS = {}, small = document.createElement("canvas"); small.width = 1020; small.height = 456;
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function pixels(img) { var c = document.createElement("canvas"); c.width = img.width; c.height = img.height; var x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; }
  var mugsReady = Promise.all(["a", "b"].map(function (v) {
    return Promise.all([loadImg("/assets/custommug/mug-" + v + ".jpg"), loadImg("/assets/custommug/map-" + v + "-s.png"), loadImg("/assets/custommug/map-" + v + "-v.png")]).then(function (r) {
      var base = pixels(r[0]), ms = pixels(r[1]), mv = pixels(r[2]), n = 620 * 620, S = new Float32Array(n), V = new Float32Array(n), E = new Float32Array(n);
      for (var i = 0; i < n; i++) { S[i] = (ms[i * 4] * 256 + ms[i * 4 + 1]) / 65535; V[i] = (mv[i * 4] * 256 + mv[i * 4 + 1]) / 65535; E[i] = ms[i * 4 + 2] / 255; }
      MUGS[v] = { base: base, S: S, V: V, E: E };
    });
  }));
  function drawMug() {
    return mugsReady.then(function () {
      var m = MUGS[state.view === "r" ? "b" : "a"], sc = small.getContext("2d");
      sc.imageSmoothingQuality = "high"; sc.drawImage(print, 0, 0, 1020, 456);
      var src = sc.getImageData(0, 0, 1020, 456).data, ctx = mug.getContext("2d"), out = ctx.createImageData(620, 620), o = out.data, b = m.base;
      for (var i = 0, n = 620 * 620; i < n; i++) {
        var p = i * 4, e = m.E[i];
        if (e > 0) {
          var fx = m.S[i] * 1019, fy = m.V[i] * 455, x0 = fx | 0, y0 = fy | 0, x1 = Math.min(x0 + 1, 1019), y1 = Math.min(y0 + 1, 455), ax = fx - x0, ay = fy - y0;
          for (var ch = 0; ch < 3; ch++) {
            var c = (src[(y0 * 1020 + x0) * 4 + ch] * (1 - ax) + src[(y0 * 1020 + x1) * 4 + ch] * ax) * (1 - ay) + (src[(y1 * 1020 + x0) * 4 + ch] * (1 - ax) + src[(y1 * 1020 + x1) * 4 + ch] * ax) * ay;
            o[p + ch] = b[p + ch] * (1 - e) + b[p + ch] * c / 255 * e;
          }
        } else { o[p] = b[p]; o[p + 1] = b[p + 1]; o[p + 2] = b[p + 2]; }
        o[p + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
      var pimg = $("#pimg"); if (pimg) pimg.src = mug.toDataURL("image/jpeg", 0.85);
    }).catch(function () {});
  }
  var pending = 0;
  function render() {
    var seq = ++pending;
    fontsReady.then(drawPrint).then(function () { if (seq === pending) { drawMug(); var flat = $("#cm-flat"); if (flat) { var fc = flat.getContext("2d"); fc.drawImage(print, 0, 0, flat.width, flat.height); } } });
    var n = state.traits.length; $("#cm-count").textContent = n + " of 4 chosen";
    var mlen = state.msg.trim().length, ok = state.name.trim().length > 0 && (state.mode === "msg" ? mlen >= 3 : n === 4); $("#cm-approve").disabled = !ok;
    $("#cm-hint").textContent = !state.name.trim() ? "Type a name to start." : state.mode === "msg" ? (mlen < 3 ? "Write a short message for the mug." : "Looks good? Approve the design to order.") : n < 4 ? "Pick " + (4 - n) + " more thing" + (4 - n === 1 ? "" : "s") + " that describe them." : "Looks good? Approve the design to order.";
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
  // their own words: match a typed trait to an icon (dictionary first, then icon names and tags), fallback sparkles
  var INDEX = null;
  function loadIndex() { if (!INDEX) INDEX = fetch("/assets/custommug/iconindex.json").then(function (r) { return r.json(); }); return INDEX; }
  function findIcon(ix, text) {
    var words = text.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean), best = null, score = 0;
    words.forEach(function (w) { var w2 = w.replace(/(ing|er|ers|s)$/, ""); if (!best && (ix.syn[w] || ix.syn[w2])) { best = ix.syn[w] || ix.syn[w2]; score = 9; } });
    if (best) return best;
    Object.keys(ix.icons).forEach(function (k) {
      var t = " " + ix.icons[k].t + " ", sc = 0;
      words.forEach(function (w) { if (w.length < 3) return; if (k === w) sc += 6; else if ((" " + k.replace(/-/g, " ") + " ").indexOf(" " + w + " ") >= 0) sc += 4; else if (t.indexOf(" " + w + " ") >= 0) sc += 3; else if (t.indexOf(w) >= 0) sc += 1; });
      if (sc > score || (sc === score && sc > 0 && k.length < best.length)) { best = k; score = sc; }
    });
    return best || "sparkles";
  }
  function addCustom(label, iconName, select) {
    return loadIndex().then(function (ix) {
      var icn = iconName && ix.icons[iconName] ? iconName : findIcon(ix, label), k = "_" + icn + "_" + encodeURIComponent(label);
      if (!byKey[k]) {
        byKey[k] = { k: k, l: label, svg: ix.icons[icn].s };
        var b = document.createElement("button"); b.type = "button"; b.className = "cm-chip custom"; b.dataset.k = k; b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ix.icons[icn].s + "</svg><span>" + label.replace(/[<>&"]/g, "") + "</span>";
        chips.insertBefore(b, chips.firstChild);
      }
      if (select && state.traits.indexOf(k) < 0) { if (state.traits.length < 4) state.traits.push(k); else flash("You can pick 4. Tap one to remove it first."); }
      syncChips(); render(); return k;
    });
  }
  var ownIn = $("#cm-own"), ownBtn = $("#cm-own-add");
  function addOwn() {
    var raw = ownIn.value.trim(), v = raw.replace(/[^A-Za-z &'-]/g, "").replace(/\s{2,}/g, " ").trim();
    if (!v) { ownIn.focus(); return; }
    if (v.split(" ").length > 2 || v.length > 16 || /[.!?,]/.test(raw)) { flash("Keep it to 1–2 words, e.g. Yoga or Chai lover."); ownIn.focus(); return; }
    if (v.length < 3) { flash("That's a bit short. Try a word like Yoga or Cricket."); return; }
    if (BAD.test(v)) { flash("Let's keep it friendly. Please try another word."); ownIn.value = ""; return; }
    if (state.traits.length >= 4) { flash("You've picked 4. Tap one to remove it, then add yours."); return; }
    v = v.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); ownBtn.disabled = true; ownBtn.textContent = "Adding…";
    addCustom(v, null, true).then(function () { ownIn.value = ""; ownBtn.disabled = false; ownBtn.textContent = "Add"; }, function () { ownBtn.disabled = false; ownBtn.textContent = "Add"; flash("Couldn't add that. Please try again."); });
  }
  if (ownBtn) { ownBtn.addEventListener("click", addOwn); ownIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addOwn(); } }); ownIn.addEventListener("focus", loadIndex, { once: true }); }
  function syncChips() { chips.querySelectorAll(".cm-chip").forEach(function (b) { var on = state.traits.indexOf(b.dataset.k) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.classList.toggle("full", !on && state.traits.length >= 4); }); }
  function flash(t) { var h = $("#cm-hint"); h.textContent = t; h.classList.add("warn"); setTimeout(function () { h.classList.remove("warn"); }, 1600); }
  nameIn.addEventListener("input", function () {
    var v = nameIn.value.replace(/[^A-Za-zÀ-ɏ .'-]/g, "").replace(/\s{2,}/g, " ").slice(0, 14);
    if (v !== nameIn.value) nameIn.value = v;
    if (BAD.test(v)) { nameIn.value = ""; state.name = ""; flash("Please use a real name."); render(); return; }
    state.name = v.trim() ? v.trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : ""; render();
  });
  document.querySelectorAll(".cm-mode").forEach(function (b) { b.addEventListener("click", function () {
    state.mode = b.dataset.m; document.querySelectorAll(".cm-mode").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    $("#cm-pane-traits").hidden = state.mode !== "traits"; $("#cm-pane-msg").hidden = state.mode !== "msg"; render(); }); });
  var msgIn = $("#cm-msg");
  if (msgIn) msgIn.addEventListener("input", function () {
    var v = msgIn.value.replace(/[^A-Za-z0-9 \n.,!?'&:\-❤]/g, "").replace(/\n{2,}/g, "\n").slice(0, 120);
    if (v.split("\n").length > 5) v = v.split("\n").slice(0, 5).join("\n");
    if (v !== msgIn.value) msgIn.value = v;
    $("#cm-msg-count").textContent = v.length + "/120";
    if (BAD.test(v)) { state.msg = ""; flash("Let's keep it friendly. Please rephrase."); } else state.msg = v.replace(/\n/g, " ");
    render();
  });
  document.querySelectorAll("[name=cm-theme]").forEach(function (r) { r.addEventListener("change", function () { state.theme = r.value; render(); }); });
  document.querySelectorAll(".cm-view").forEach(function (b) { b.addEventListener("click", function () { state.view = b.dataset.v; document.querySelectorAll(".cm-view").forEach(function (x) { x.classList.toggle("on", x === b); }); drawMug(); }); });
  $("#cm-reset").addEventListener("click", function () {
    state.name = ""; state.traits = []; nameIn.value = ""; syncChips(); unapprove(); render(); nameIn.focus(); window.scrollTo({ top: $(".cm").offsetTop - 70, behavior: "smooth" });
  });
  function spec() { return encodeURIComponent(state.name) + "~" + (state.mode === "msg" ? "m:" + encodeURIComponent(state.msg.trim()) : state.traits.join(".")) + "~" + state.theme; }
  function unapprove() { state.approved = false; $("#cm-order").hidden = true; $("#cm-approve").hidden = false; }
  $("#cm-approve").addEventListener("click", function () {
    state.approved = true; $("#cm-approve").hidden = true; var box = $("#cm-order"); box.hidden = false;
    var btn = box.querySelector("[data-order]"), labels = state.mode === "msg" ? "Message: \u201c" + state.msg.trim() + "\u201d" : state.traits.map(function (k) { return byKey[k].l; }).join(", ");
    btn.dataset.name = "Custom Name Mug: " + state.name + " | " + labels + " | " + THEMES[state.theme].label + " | design nevervoidstore.com/custom-mug/?d=" + spec();
    $("#cm-summary").textContent = state.name + " · " + labels + " · " + THEMES[state.theme].label;
    drawMug(); box.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  // prefill from a design link (?d=Name~k1.k2.k3.k4~theme); ?admin=1 adds a download of the print file for Printrove
  var q = new URLSearchParams(location.search), d = q.get("d");
  if (d) { var p = d.split("~"); state.name = decodeURIComponent(p[0] || "").slice(0, 14); nameIn.value = state.name; if ((p[1] || "").indexOf("m:") === 0) { state.mode = "msg"; state.msg = decodeURIComponent(p[1].slice(2)).slice(0, 120); if (msgIn) msgIn.value = state.msg; var mb = document.querySelector('.cm-mode[data-m="msg"]'); if (mb) mb.click(); } else { var ent = (p[1] || "").split(".").filter(Boolean).slice(0, 4); state.traits = ent.filter(function (k) { return byKey[k]; }); ent.forEach(function (k) { if (k[0] === "_") { var bits = k.split("_"); addCustom(decodeURIComponent(bits.slice(2).join("_")), bits[1], true); } }); } if (THEMES[p[2]]) { state.theme = p[2]; var r = document.querySelector("[name=cm-theme][value=" + p[2] + "]"); if (r) r.checked = true; } syncChips(); }
  if (q.get("admin") === "1") {
    var dl = document.createElement("button"); dl.type = "button"; dl.className = "buy"; dl.textContent = "Download print file (2550 × 1140)";
    dl.addEventListener("click", function () { var a = document.createElement("a"); a.download = "NevervoidStore-custom-" + (state.name || "mug").replace(/\s+/g, "-") + "-2550x1140.png"; a.href = print.toDataURL("image/png"); a.click(); });
    $("#cm-reset").after(dl);
  }
  render();
})();
