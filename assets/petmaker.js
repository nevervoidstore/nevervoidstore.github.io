// NevervoidStore pet maker: the shopper uploads a pet photo and sees it on the real mug / case photo straight away.
// Runs entirely in the browser (the photo is not uploaded anywhere while previewing).
// Mug: builds a 2550x1140 print and wraps it on the mug photo with NVMug.wrapMug. Case: builds a print and lays it in the
// phone frame of the model the shopper picked (same frames as the design pages).
(function () {
  var root = document.querySelector("[data-petmaker]");
  if (!root) return;
  var KIND = root.dataset.petmaker, WA = root.dataset.wa || "";
  var gallery = document.querySelector(".gallery"), pimg = document.getElementById("pimg");
  var STYLES = KIND === "mug"
    ? [["photo", "Photo"], ["circle", "Circle"], ["wrap", "Full wrap"]]
    : [["full", "Full photo"], ["circle", "Circle"]];
  var BGS = [["#ffffff", "White"], ["#f6efe4", "Cream"], ["#f7dcdc", "Blush"], ["#dde9da", "Sage"], ["#d9e6f4", "Sky"], ["#f6e3b4", "Honey"], ["#1f2a44", "Navy"], ["#1d1d1f", "Black"]];
  var FONTS = [["classic", "Classic", "900 1em NVPlayfair, Georgia, serif"], ["script", "Script", "700 1em NVDancing, cursive"], ["modern", "Modern", "800 1em NVModern, Arial, sans-serif"], ["hand", "Handwritten", "700 1em NVHand, cursive"]];
  var S = { img: null, w: 0, h: 0, style: STYLES[0][0], bg: BGS[0][0], name: "", font: "classic", zoom: 1, ox: 0, oy: 0, both: true, view: "r", edit: false, model: "iphone-16-pro", ref: "" };

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function track(n, d) { try { if (window.nvTrack) window.nvTrack(n, d || {}); } catch (e) {} }

  // ---- styles ----
  var css = el("style");
  css.textContent =
    ".pm{margin:14px 0 0;display:grid;gap:14px}" +
    ".pm-up{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 16px;border:2px dashed #b9ad98;border-radius:18px;background:#fffdf8;cursor:pointer;text-align:center;font:inherit;color:inherit;width:100%}" +
    ".pm-up b{font-size:18px}.pm-up span{color:#6b6358;font-size:14px}.pm-up .pm-ic{font-size:30px;line-height:1}" +
    ".pm-up:hover,.pm-up:focus-visible{border-color:#2f5d46;background:#f4f8f4}" +
    ".pm-row{display:grid;gap:8px}.pm-row>b{font-size:14px}" +
    ".pm-chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".pm-chip{border:1px solid #d8d0c2;background:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;cursor:pointer}" +
    ".pm-chip[aria-pressed=true]{border-color:#2f5d46;background:#eef6f1;box-shadow:0 0 0 1px #2f5d46;font-weight:600}" +
    ".pm-sw{width:34px;height:34px;border-radius:50%;border:1px solid #cfc6b6;cursor:pointer;padding:0}" +
    ".pm-sw[aria-pressed=true]{box-shadow:0 0 0 2px #fff,0 0 0 4px #2f5d46}" +
    ".pm input[type=text]{width:100%;padding:12px 14px;border:1px solid #d8d0c2;border-radius:12px;font:inherit;font-size:16px;background:#fff}" +
    ".pm input[type=range]{width:100%;accent-color:#2f5d46}" +
    ".pm-small{font-size:13px;color:#6b6358}.pm-warn{font-size:13px;color:#9a4b12;background:#fff4e5;border-radius:10px;padding:8px 10px}" +
    ".pm-links{display:flex;gap:16px;flex-wrap:wrap}.pm-links button{background:none;border:0;padding:0;font:inherit;font-size:14px;text-decoration:underline;cursor:pointer;color:inherit}" +
    ".pm-hint{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:rgba(20,20,20,.72);color:#fff;font-size:12px;padding:5px 10px;border-radius:999px;pointer-events:none;white-space:nowrap}" +
    ".gallery.pm-on{cursor:grab;touch-action:none}.gallery.pm-on:active{cursor:grabbing}" +
    "#pmcanvas{position:absolute;inset:28px;width:calc(100% - 56px);height:calc(100% - 56px);object-fit:contain}" +
    ".pm-gup{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#2f5d46;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer}" +
    ".pm-up[hidden],.pm-gup[hidden],.pm[hidden]{display:none}" +
    ".pm-need{outline:3px solid #c0392b;outline-offset:3px;border-radius:18px}";
  document.head.appendChild(css);

  // ---- UI ----
  var file = el("input"); file.type = "file"; file.accept = "image/*"; file.hidden = true;
  var up = el("button", "pm-up", '<span class="pm-ic" aria-hidden="true">📷</span><b>Upload your pet\'s photo</b><span>See it on the ' + (KIND === "mug" ? "mug" : "case") + ' instantly. Your photo stays on your phone until you order.</span>');
  up.type = "button";
  var gup = el("button", "pm-gup", "📷 Add your pet's photo"); gup.type = "button";
  if (gallery) { gallery.style.position = "relative"; gallery.appendChild(gup); }
  var ctrls = el("div", "pm"); ctrls.hidden = true;
  root.appendChild(file); root.appendChild(up); root.appendChild(ctrls);
  [up, gup].forEach(function (b) { b.addEventListener("click", function () { file.click(); }); });

  function chips(list, key, cls) {
    return list.map(function (x) { return '<button type="button" class="' + (cls || "pm-chip") + '" data-k="' + key + '" data-v="' + x[0] + '" aria-pressed="' + (S[key] === x[0]) + '"' + (cls ? ' style="background:' + x[0] + '" aria-label="' + x[1] + '" title="' + x[1] + '"' : "") + ">" + (cls ? "" : x[1]) + "</button>"; }).join("");
  }
  function drawCtrls() {
    var bgOn = S.style !== "wrap" && S.style !== "full";
    ctrls.innerHTML =
      '<div class="pm-row"><b>Add their name <span class="pm-small">(optional)</span></b><input type="text" maxlength="14" placeholder="e.g. Bruno" value="' + esc(S.name) + '" aria-label="Name"></div>' +
      '<span class="pm-small">' + (KIND === "mug" ? "Drag the picture to move it. Printed on both sides, so it looks right in either hand." : "Drag the picture to move it.") + '</span>' +
      (S.w && Math.min(S.w, S.h) < 900 ? '<div class="pm-warn">This photo is quite small, so the print may look soft. A larger, sharper photo will look better.</div>' : "") +
      '<div class="pm-links"><button type="button" data-a="edit" aria-expanded="' + S.edit + '">' + (S.edit ? "Hide options ▴" : "✏️ Edit design ▾") + '</button><button type="button" data-a="change">Change photo</button></div>' +
      (S.edit ?
        '<div class="pm-row"><b>Style</b><div class="pm-chips">' + chips(STYLES, "style") + "</div></div>" +
        (bgOn ? '<div class="pm-row"><b>Background</b><div class="pm-chips">' + chips(BGS, "bg", "pm-sw") + "</div></div>" : "") +
        (S.name ? '<div class="pm-row"><b>Lettering</b><div class="pm-chips">' + chips(FONTS, "font") + "</div></div>" : "") +
        '<div class="pm-row"><b>Zoom</b><input type="range" min="1" max="3" step="0.01" value="' + S.zoom + '" aria-label="Zoom"></div>' +
        '<div class="pm-links"><button type="button" data-a="reset">Reset position</button></div>' : "");
    var name = ctrls.querySelector("input[type=text]");
    name.addEventListener("input", function () { var had = !!S.name; S.name = name.value.replace(/[^\p{L}\p{N} .'&-]/gu, "").slice(0, 14); if (had !== !!S.name && S.edit) { var pos = name.selectionStart; drawCtrls(); var n2 = ctrls.querySelector("input[type=text]"); n2.focus(); try { n2.setSelectionRange(pos, pos); } catch (e) {} } schedule(); });
    var z = ctrls.querySelector("input[type=range]"); if (z) z.addEventListener("input", function (e) { S.zoom = +e.target.value; schedule(); });
  }
  ctrls.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.k) { S[b.dataset.k] = b.dataset.v; drawCtrls(); schedule(); }
    else if (b.dataset.a === "change") file.click();
    else if (b.dataset.a === "edit") { S.edit = !S.edit; drawCtrls(); }
    else if (b.dataset.a === "reset") { S.zoom = 1; S.ox = 0; S.oy = 0; drawCtrls(); schedule(); }
  });

  // ---- photo in ----
  file.addEventListener("change", function () {
    var f = file.files && file.files[0]; if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { alert("Please choose a photo (JPG or PNG)."); return; }
    var url = URL.createObjectURL(f), im = new Image();
    im.onload = function () {
      // keep up to 2400 px on the long side: plenty for print, light enough for phones
      var k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      S.img = c; S.w = im.naturalWidth; S.h = im.naturalHeight; S.zoom = 1; S.ox = 0; S.oy = 0;
      S.ref = "PET-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      up.hidden = true; gup.hidden = true; ctrls.hidden = false; root.classList.remove("pm-need");
      if (gallery) gallery.classList.add("pm-on");
      drawCtrls(); schedule(); track("CustomizeProduct", { content_name: "pet_" + KIND });
    };
    im.onerror = function () { URL.revokeObjectURL(url); alert("Sorry, that photo couldn't be opened. Please try a JPG or PNG."); };
    im.src = url; file.value = "";
  });

  // ---- drawing ----
  function cover(ctx, x, y, w, h) {   // the pet photo, cover-fit into the box, with zoom and drag offset
    var r = Math.max(w / S.img.width, h / S.img.height) * S.zoom, dw = S.img.width * r, dh = S.img.height * r;
    var mx = Math.max(0, (dw - w) / 2), my = Math.max(0, (dh - h) / 2);
    var cx = x + (w - dw) / 2 + Math.max(-mx, Math.min(mx, S.ox * dw)), cy = y + (h - dh) / 2 + Math.max(-my, Math.min(my, S.oy * dh));
    ctx.imageSmoothingQuality = "high"; ctx.drawImage(S.img, cx, cy, dw, dh);
  }
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  function fontFor(px) { var f = FONTS.filter(function (x) { return x[0] === S.font; })[0] || FONTS[0]; return f[2].replace("1em", px + "px"); }
  function nameText(ctx, cx, cy, maxW, maxPx, color, shadow) {
    if (!S.name) return;
    var px = maxPx; ctx.font = fontFor(px);
    while (ctx.measureText(S.name).width > maxW && px > 40) { px -= 4; ctx.font = fontFor(px); }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (shadow) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = px * 0.18; }
    ctx.fillStyle = color; ctx.fillText(S.name, cx, cy); ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
  }
  function shape(ctx, kind, cx, cy, d) {
    ctx.beginPath();
    if (kind === "circle") ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    else ctx.roundRect ? ctx.roundRect(cx - d / 2, cy - d / 2, d, d, d * 0.09) : ctx.rect(cx - d / 2, cy - d / 2, d, d);
  }
  function portrait(ctx, kind, cx, cy, d, ring) {
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = d * 0.04; ctx.shadowOffsetY = d * 0.012;
    shape(ctx, kind, cx, cy, d + ring * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.restore();
    ctx.save(); shape(ctx, kind, cx, cy, d); ctx.clip(); cover(ctx, cx - d / 2, cy - d / 2, d, d); ctx.restore();
  }
  // mug print: 2550 x 1140, the handle-right view shows the area around x = 0.78 * width
  var mugPrint = document.createElement("canvas"); mugPrint.width = 2550; mugPrint.height = 1140;
  function drawMug() {
    var c = mugPrint.getContext("2d"), W = 2550, H = 1140, F = Math.round(0.78 * W), B = Math.round(0.205 * W);
    c.clearRect(0, 0, W, H);
    if (S.style === "wrap") {
      c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); cover(c, 0, 0, W, H);
      if (S.name) { var g = c.createLinearGradient(0, H * 0.62, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = g; c.fillRect(0, H * 0.62, W, H * 0.38);
        nameText(c, F, H - 120, 900, 170, "#fff", true); nameText(c, B, H - 120, 900, 170, "#fff", true); }
      return;
    }
    c.fillStyle = S.bg; c.fillRect(0, 0, W, H);
    var ink = lum(S.bg) > 0.55 ? "#2b2622" : "#ffffff";
    [F, B].forEach(function (x) {
      if (S.style === "photo") {   // a large rounded photo filling the side of the mug
        var w = 860, h = S.name ? 790 : 1000, y = S.name ? 50 : 70;
        c.save(); c.beginPath(); c.roundRect ? c.roundRect(x - w / 2, y, w, h, 46) : c.rect(x - w / 2, y, w, h); c.clip(); cover(c, x - w / 2, y, w, h); c.restore();
        nameText(c, x, 990, 900, 170, ink);
      } else {
        var d = S.name ? 660 : 760, cy = S.name ? 440 : 570;
        portrait(c, "circle", x, cy, d, 16); nameText(c, x, 990, 900, 165, ink);
      }
    });
  }
  // case print: 1000 x 2080 (the case print area's shape)
  var casePrint = document.createElement("canvas"); casePrint.width = 1000; casePrint.height = 2080;
  function drawCase() {
    var c = casePrint.getContext("2d"), W = 1000, H = 2080;
    c.clearRect(0, 0, W, H);
    if (S.style === "full") {
      c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); cover(c, 0, 0, W, H);
      if (S.name) { var g = c.createLinearGradient(0, H * 0.7, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); c.fillStyle = g; c.fillRect(0, H * 0.7, W, H * 0.3); nameText(c, W / 2, H - 230, 820, 170, "#fff", true); }
      return;
    }
    c.fillStyle = S.bg; c.fillRect(0, 0, W, H);
    var ink = lum(S.bg) > 0.55 ? "#2b2622" : "#ffffff";
    portrait(c, "circle", W / 2, S.name ? 1080 : 1160, 720, 16); nameText(c, W / 2, 1600, 840, 160, ink);
  }

  // preview surfaces
  var mugOut = document.createElement("canvas"); mugOut.width = 620; mugOut.height = 620;
  var mugL = document.createElement("canvas"); mugL.width = 620; mugL.height = 620;
  var two = document.createElement("canvas"); two.width = 620; two.height = 620;
  var pv = null, RECTS = null, IM = {};
  function loadImg(src) { if (!IM[src]) IM[src] = new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); return IM[src]; }
  function preview() {
    if (!S.img) return Promise.resolve();
    if (KIND === "mug") {
      drawMug();
      return window.NVMug.wrapMug(mugPrint, "l", mugL, "white").then(function () { return window.NVMug.wrapMug(mugPrint, "r", mugOut, "white"); }).then(function () {
        var t = two.getContext("2d"); t.globalCompositeOperation = "source-over"; t.fillStyle = "#fff"; t.fillRect(0, 0, 620, 620);
        t.globalCompositeOperation = "multiply"; t.drawImage(mugL, -14, 150, 330, 330); t.drawImage(mugOut, 304, 150, 330, 330); t.globalCompositeOperation = "source-over";
        if (pimg) { pimg.src = two.toDataURL("image/jpeg", 0.9); pimg.removeAttribute("srcset"); }
        var vw = document.querySelector(".gal-col .views"); if (vw) vw.style.display = "none";
        var m3d = document.getElementById("m3d"); if (m3d) m3d.hidden = true;
      });
    }
    drawCase();
    if (!pv) { pv = el("canvas"); pv.id = "pmcanvas"; pv.width = 900; pv.height = 1200; gallery.appendChild(pv); if (pimg) pimg.style.visibility = "hidden"; var ph = gallery.querySelector("img.photo"); if (ph) ph.style.visibility = "hidden"; }
    var slug = S.model, v = "?v=8";
    return Promise.all([RECTS || fetch("/images/cases/frames/rects.json" + v).then(function (r) { return r.json(); }).then(function (j) { RECTS = j; return j; }),
      loadImg("/images/cases/frames/" + slug + "-frame.webp" + v), loadImg("/images/cases/frames/" + slug + "-mask.png" + v)]).then(function (r) {
      var R = r[0][slug], fr = r[1], mk = r[2], k = pv.width / 1200, ctx = pv.getContext("2d");
      ctx.clearRect(0, 0, pv.width, pv.height);
      var rw = (R[2] - R[0]) * k, rh = (R[3] - R[1]) * k, s = Math.max(rw / 1000, rh / 2080), dw = 1000 * s, dh = 2080 * s;
      ctx.drawImage(casePrint, R[0] * k + (rw - dw) / 2, R[1] * k + (rh - dh) / 2, dw, dh);
      ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mk, 0, 0, pv.width, pv.height);
      ctx.globalCompositeOperation = "source-over"; ctx.drawImage(fr, 0, 0, pv.width, pv.height);
    });
  }
  var queued = false, busy = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; if (busy) { schedule(); return; } busy = true; preview().catch(function () {}).then(function () { busy = false; }); }); }

  // drag to move
  if (gallery) {
    var drag = null;
    gallery.addEventListener("pointerdown", function (e) { if (!S.img || e.target.closest("button,a")) return; drag = { x: e.clientX, y: e.clientY, ox: S.ox, oy: S.oy }; gallery.setPointerCapture(e.pointerId); });
    gallery.addEventListener("pointermove", function (e) {
      if (!drag) return; var r = gallery.getBoundingClientRect(), f = KIND === "mug" ? 1.6 : 1.1;
      S.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (e.clientX - drag.x) / r.width / S.zoom * f));
      S.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (e.clientY - drag.y) / r.height / S.zoom * f)); schedule();
    });
    ["pointerup", "pointercancel"].forEach(function (t) { gallery.addEventListener(t, function () { drag = null; }); });
    // stop the design swipe from treating this as "next design"
    ["touchstart", "touchmove"].forEach(function (t) { gallery.addEventListener(t, function (e) { if (S.img) e.stopPropagation(); }, { passive: true }); });
  }

  // case: follow the phone model the shopper picks
  document.querySelectorAll("select.model").forEach(function (sel) {
    /* one clean preview frame for every model (iPhone 16 Pro) */
  });

  // ---- order: a photo is needed, and the design goes along with the order ----
  function summary() {
    var st = STYLES.filter(function (x) { return x[0] === S.style; })[0][1];
    return [st, S.name ? "Name: " + S.name : "", S.style !== "wrap" && S.style !== "full" ? "Background: " + (BGS.filter(function (x) { return x[0] === S.bg; })[0] || [0, S.bg])[1] : "", "Ref " + S.ref].filter(Boolean).join(" | ");
  }
  function printBlob() {
    var src = KIND === "mug" ? (drawMug(), mugPrint) : (drawCase(), casePrint);
    return new Promise(function (ok) { src.toBlob(function (b) { ok(b); }, "image/jpeg", 0.95); });
  }
  var sent = false;
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-order]");
    if (!btn || btn.dataset.pmGo) return;
    if (!S.img) {
      e.preventDefault(); e.stopImmediatePropagation();
      root.classList.add("pm-need"); root.scrollIntoView({ behavior: "smooth", block: "center" });
      up.querySelector("b").textContent = "First, upload your pet's photo";
      return;
    }
    var base = btn.dataset.pmBase || (btn.dataset.pmBase = btn.dataset.name);
    btn.dataset.name = base + " | " + summary();
    if (sent) return;   // photo already on its way: carry on to checkout
    e.preventDefault(); e.stopImmediatePropagation();
    sendSheet(btn);
  }, true);

  // the design file has to reach us with the order.
  // With the site backend on (data-api), it uploads quietly. Without it, two taps: save the design, then send it in our WhatsApp chat.
  var API = root.dataset.api || "";
  function upload() {
    return printBlob().then(function (blob) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(blob); }); })
      .then(function (data) { return fetch(API, { method: "POST", body: JSON.stringify({ a: "petdesign", ref: S.ref, kind: KIND, summary: summary(), image: data }) }); })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error("upload"); });
  }
  function sendSheet(btn) {
    if (API) {   // quiet upload, then straight on to checkout; fall back to WhatsApp if it fails
      btn.disabled = true; var t = btn.textContent; btn.textContent = "Saving your design…";
      upload().then(function () { sent = true; btn.disabled = false; btn.textContent = t; btn.click(); })
        .catch(function () { btn.disabled = false; btn.textContent = t; waSheet(btn); });
      return;
    }
    waSheet(btn);
  }
  function waSheet(btn) {
    var wrap = el("div", "co-wrap open"), msg = "Hi Antony! Here is my pet design for NevervoidStore, " + S.ref + " (" + summary() + "). Attaching the image:";
    wrap.innerHTML = '<div class="co-back" data-x></div><div class="co" role="dialog" aria-modal="true" aria-labelledby="pm-t"><button class="co-x" type="button" data-x aria-label="Close">×</button>' +
      '<h2 id="pm-t">Send us your design</h2><p class="pm-small" style="font-size:15px;margin:-4px 0 14px">We print from this image, so it needs to reach us with your order.</p>' +
      '<img alt="" style="width:100%;max-height:240px;object-fit:contain;border-radius:12px;background:#f3eee6;margin-bottom:14px">' +
      '<ol style="margin:0 0 14px;padding-left:20px;display:grid;gap:10px">' +
      '<li><button class="buy" type="button" data-save style="width:100%">1. Save design to your phone</button></li>' +
      '<li><button class="ask" type="button" data-send style="width:100%">2. Open our WhatsApp chat and attach it</button></li></ol>' +
      '<button class="ask" type="button" data-next style="width:100%">I\'ve sent it, continue to payment</button>' +
      '<p class="pm-small" style="margin-top:10px">Your photo is used only to print your order.</p></div>';
    document.body.appendChild(wrap); document.body.classList.add("co-lock");
    wrap.querySelector("img").src = KIND === "mug" ? two.toDataURL("image/jpeg", 0.85) : pv.toDataURL("image/jpeg", 0.85);
    function close() { wrap.remove(); document.body.classList.remove("co-lock"); }
    function swap(on, off) { wrap.querySelector(on).className = "buy"; wrap.querySelector(off).className = "ask"; }
    wrap.querySelectorAll("[data-x]").forEach(function (x) { x.addEventListener("click", close); });
    wrap.querySelector("[data-save]").addEventListener("click", function () {
      printBlob().then(function (blob) {
        var f = new File([blob], "nevervoid-" + S.ref + ".jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/.test(navigator.userAgent)) {
          navigator.share({ files: [f] }).catch(function () {});   // phones: "Save Image" / "Save to Photos"
        } else { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }
        swap("[data-send]", "[data-save]");
      });
    });
    wrap.querySelector("[data-send]").addEventListener("click", function () {
      track("Contact", { content_name: "pet_design_" + KIND });
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      swap("[data-next]", "[data-send]");
    });
    wrap.querySelector("[data-next]").addEventListener("click", function () { sent = true; close(); btn.click(); });
  }
})();
