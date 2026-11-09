// Send a Wish: live mug preview of the customer's wish + name + chosen artwork, then the store's normal checkout.
(function () {
  "use strict";
  var M = window.NVMug, CFG = window.NV_WISH || { occ: {} };
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = { kind: "wish", occ: "christmas", wish: "", by: "", art: "reindeer", color: "white", view: "r", wishErr: "", byErr: "" };
  var print = M.newPrint(), mug = $("#w-mug"), wishIn = $("#w-wish"), byIn = $("#w-by"), btn = $("#w-order [data-order]"), q = new URLSearchParams(location.search);
  var BAD = M.BAD, symAt = 0;

  // ---------- validation ----------
  function cleanWish(v) { return v.replace(/[^A-Za-z0-9 \n.,!?'’&:\-❤]/g, "").replace(/\n{2,}/g, "\n").replace(/^\s+/, ""); }
  function wishError(v) {
    var t = v.trim(); if (!t) return "Write your wish";
    if (t.replace(/[^A-Za-z]/g, "").length < 3) return "Your wish needs a few words";
    if (t.split("\n").length > 4) return "Please keep it to 4 lines";
    if (/(.)\1{3,}/.test(t)) return "That doesn't look like a wish";
    if (BAD.test(t)) return "Let's keep it friendly";
    return "";
  }
  function cleanBy(v) { return v.replace(/[^A-Za-z .'&-]/g, "").replace(/\s{2,}/g, " ").replace(/^[ .'&-]+/, ""); }
  function byError(v) {
    var t = v.trim(); if (!t) return "Add your name";
    if (t.replace(/[^A-Za-z]/g, "").length < 2) return "Your name needs at least 2 letters";
    if (/(.)\1\1/i.test(t) || /[.'&-]{2,}/.test(t)) return "That doesn't look like a name";
    if (BAD.test(t)) return "Please use your real name";
    return "";
  }
  function warn(el, t, bad) { el.textContent = t; el.hidden = !t; el.classList.toggle("bad", !!bad); }

  // ---------- inputs ----------
  wishIn.addEventListener("input", function () {
    var raw = wishIn.value, v = cleanWish(raw).slice(0, 100);
    if (v !== raw) { wishIn.value = v; if (cleanWish(raw) !== raw) symAt = Date.now(); }
    st.wish = v; st.view = "r"; update();
  });
  byIn.addEventListener("input", function () {
    var raw = byIn.value, v = cleanBy(raw).slice(0, 20);
    if (v !== raw) byIn.value = v;
    st.by = v.trim() ? M.titleCase(v.trim()) : ""; st.view = "r"; update();
  });
  function sugg() {
    var o = CFG.occ[st.occ] || { wishes: [] };
    $("#w-sugg").innerHTML = o.wishes.map(function (w) { return '<button type="button">' + w.replace(/[<&]/g, "") + "</button>"; }).join("");
  }
  $("#w-sugg").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; wishIn.value = b.textContent; st.wish = b.textContent; st.view = "r"; update(); wishIn.focus(); });
  $$(".sw-occ .cm-mode").forEach(function (b) { b.addEventListener("click", function () { setOcc(b.dataset.o); update(); }); });
  function setOcc(k) { st.occ = CFG.occ[k] ? k : "christmas"; $$(".sw-occ .cm-mode").forEach(function (x) { var on = x.dataset.o === st.occ; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); }); sugg(); }
  $("#w-arts").addEventListener("click", function (e) { var b = e.target.closest(".sw-art"); if (!b) return; setArt(b.dataset.a); st.view = "l"; update(); });
  function setArt(k) { st.art = M.WISH_ART[k] ? k : "reindeer"; $$(".sw-art").forEach(function (x) { var on = x.dataset.a === st.art; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); }); }
  var colorBox = $("#w-colors");
  colorBox.innerHTML = Object.keys(M.MUG_COLORS).map(function (k) { var c = M.MUG_COLORS[k]; return '<button type="button" class="cm-color' + (k === "white" ? " on" : "") + '" data-c="' + k + '" role="radio" aria-checked="' + (k === "white") + '"><i style="background:' + c.hex + '"></i><small>' + c.label + "</small></button>"; }).join("");
  colorBox.addEventListener("click", function (e) { var b = e.target.closest(".cm-color"); if (b) { setColor(b.dataset.c); update(); } });
  function setColor(k) { st.color = M.MUG_COLORS[k] ? k : "white"; $$("#w-colors .cm-color").forEach(function (b) { var on = b.dataset.c === st.color; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); $("#w-color-name").textContent = M.MUG_COLORS[st.color].label + (st.color === "white" ? "" : " handle & inside"); }
  $$(".sw-stage .cm-view").forEach(function (b) { b.addEventListener("click", function () { st.view = b.dataset.v; draw(); }); });

  // ---------- design link: wish~by~art~colour~occasion ----------
  function spec() { return [encodeURIComponent(st.wish.trim()), encodeURIComponent(st.by), st.art, st.color, st.occ].join("~"); }
  function load(d) {
    var p = String(d).split("~");
    var w = cleanWish(decodeURIComponent(p[0] || "")).slice(0, 100); wishIn.value = w; st.wish = w;
    var b = cleanBy(decodeURIComponent(p[1] || "")).slice(0, 20).trim(); byIn.value = b; st.by = b ? M.titleCase(b) : "";
    setArt(p[2]); setColor(p[3]); setOcc(p[4]);
  }

  // ---------- render ----------
  var seq = 0;
  function draw() {
    var my = ++seq;
    $$(".sw-stage .cm-view").forEach(function (b) { b.classList.toggle("on", b.dataset.v === st.view); });
    M.render(print, st).then(function () { if (my === seq) return M.wrapMug(print, st.view, mug, st.color); }).then(function () {
      if (my === seq) { var pimg = $("#pimg"); if (pimg) pimg.src = mug.toDataURL("image/jpeg", 0.85); }
    }).catch(function () {});
  }
  var t = null;
  function update() {
    $("#w-count").textContent = st.wish.length + "/100";
    st.wishErr = st.wish.trim() ? wishError(st.wish) : ""; st.byErr = st.by ? byError(st.by) : "";
    var fit = st.wish.trim() && !st.wishErr ? M.wishFit(st.wish) : null;
    var recentSym = Date.now() - symAt < 4000; if (recentSym) { clearTimeout(update.t); update.t = setTimeout(update, 4100); }
    warn($("#w-wish-warn"), st.wishErr ? st.wishErr + "." : recentSym ? "Emojis and special symbols can't be printed, so we left them out." : fit && fit.small ? "This is a long wish, so it prints a little smaller. Shorter wishes look bigger and bolder." : "", !!st.wishErr);
    warn($("#w-by-warn"), st.byErr ? st.byErr + "." : "", true);
    var ok = st.wish.trim() && !wishError(st.wish) && st.by && !byError(st.by);
    btn.disabled = !ok;
    $("#w-hint").textContent = ok ? "Looks lovely. Check the preview, then create your mug." : !st.wish.trim() ? "Write your wish to start." : st.wishErr ? "Fix the wish first." : !st.by ? "Add your name so they know it’s from you." : "Fix your name first.";
    var colour = st.color === "white" ? "White mug" : M.MUG_COLORS[st.color].label + " handle & inside";
    btn.dataset.name = "Send a Wish Mug (" + CFG.occ[st.occ].label + "): “" + st.wish.trim().replace(/\n/g, " / ") + "” | By: " + st.by + " | Design: " + M.WISH_ART[st.art].label + " | " + colour + " | design nevervoidstore.com/send-a-wish/?d=" + spec();
    clearTimeout(t); t = setTimeout(draw, 60);
  }

  // owner: print file from a design link (?d=...&admin=1)
  if (q.get("admin") === "1") {
    $("#w-admin").hidden = false;
    $("#w-dl").addEventListener("click", function () { M.render(print, st).then(function () { var a = document.createElement("a"); a.download = "SendAWish-" + (st.by || "mug").replace(/[^A-Za-z0-9]+/g, "-") + "-2550x1140.png"; a.href = print.toDataURL("image/png"); a.click(); }); });
  }

  // the store script relabels order buttons; this one keeps its own words
  function labels() { btn.textContent = "Create My Mug · " + btn.textContent.replace(/^.*·\s*/, ""); var bar = document.querySelector(".buybar .buy"); if (bar) bar.textContent = "Create My Mug"; }
  labels();
  sugg();
  if (q.get("d")) load(q.get("d")); else { st.wish = ""; }
  update();
})();
