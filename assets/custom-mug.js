// NevervoidStore "Your Name Mug" builder: name + 4 traits -> print-ready design (2550x1140, Printrove's mug print area) + live mug preview.
(function () {
  "use strict";
  var M = window.NVMug, THEMES = M.THEMES, BAD = M.BAD, byKey = M.byKey, TRAITS = M.TRAITS;
  var state = { name: "", traits: [], theme: "classic", font: "classic", color: "white", view: "r", approved: false, mode: "traits", msg: "", nameErr: "" };
  var $ = function (s) { return document.querySelector(s); };
  var print = M.newPrint();
  var mug = $("#cm-mug"), nameIn = $("#cm-name"), chips = $("#cm-traits");
  function drawPrint() { return M.render(print, state); }
  function drawMug() { return M.wrapMug(print, state.view, mug, state.color).then(function () { var pimg = $("#pimg"); if (pimg) pimg.src = mug.toDataURL("image/jpeg", 0.85); }).catch(function () {}); }
  var pending = 0;
  function render() {
    var seq = ++pending;
    drawPrint().then(function () { if (seq === pending) { drawMug(); var flat = $("#cm-flat"); if (flat) { var fc = flat.getContext("2d"); fc.drawImage(print, 0, 0, flat.width, flat.height); } } });
    var n = state.traits.length; $("#cm-count").textContent = n + " of 4 chosen";
    var mlen = state.msg.trim().length, ok = state.name.trim().length > 0 && !state.nameErr && (state.mode === "msg" ? mlen >= 3 : n === 4); $("#cm-approve").disabled = !ok;
    nameStatus();
    $("#cm-hint").textContent = state.nameErr ? "Fix the name first: " + state.nameErr.toLowerCase() + "." : !state.name.trim() ? "Type a name to start." : state.mode === "msg" ? (mlen < 3 ? "Write a short message for the mug." : "Looks good? Approve the design to order.") : n < 4 ? "Pick " + (4 - n) + " more thing" + (4 - n === 1 ? "" : "s") + " that describe them." : "Looks good? Approve the design to order.";
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
  var loadIndex = M.loadIndex;
  function addCustom(label, iconName, select) {
    return M.addCustom(label, iconName).then(function (k) {
      if (!chips.querySelector('[data-k="' + CSS.escape(k) + '"]')) {
        var b = document.createElement("button"); b.type = "button"; b.className = "cm-chip custom"; b.dataset.k = k; b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + byKey[k].svg + "</svg><span>" + label.replace(/[<>&"]/g, "") + "</span>";
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
  // name: letters only, 2-14 characters; the note under the box says why when something's off
  var typedBadAt = 0;
  nameIn.addEventListener("input", function () {
    var raw = nameIn.value, c = M.cleanName(raw), v = c.slice(0, 14);
    typedBadAt = !raw ? 0 : c !== raw ? Date.now() : typedBadAt;
    if (v !== raw) nameIn.value = v;
    if (BAD.test(v)) { nameIn.value = ""; state.name = ""; state.nameErr = ""; flash("Please use a real name."); render(); return; }
    state.name = v.trim() ? M.titleCase(v.trim()) : ""; state.nameErr = v.trim() ? M.nameError(v) : "";
    fontLabels(); render();
  });
  function nameStatus() {
    var w = $("#cm-name-warn"); if (!w) return; var t = "", bad = false;
    if (state.nameErr) { t = state.nameErr + "."; bad = true; }
    else if (Date.now() - typedBadAt < 4000) { t = "Only letters, spaces and . ' - can be used, so we left out the rest."; clearTimeout(nameStatus.t); nameStatus.t = setTimeout(nameStatus, 4100); }
    else if (state.name && M.nameFit(state.name, state.font).small) {
      var best = Object.keys(M.NAME_FONTS).reduce(function (a, k) { return M.nameFit(state.name, k).size > M.nameFit(state.name, a).size ? k : a; }, state.font);
      t = "This is a long name, so it prints a little smaller." + (best !== state.font && !M.nameFit(state.name, best).small ? " The " + M.NAME_FONTS[best].label + " style fits it bigger." : " A first name or nickname will look bigger.");
    }
    w.textContent = t; w.hidden = !t; w.classList.toggle("bad", bad);
  }
  // name style picker: each button shows the typed name in that font
  var fontBox = $("#cm-fonts");
  if (fontBox) {
    fontBox.innerHTML = Object.keys(M.NAME_FONTS).map(function (k) { var f = M.NAME_FONTS[k]; return '<button type="button" class="cm-font' + (k === "classic" ? " on" : "") + '" data-f="' + k + '" role="radio" aria-checked="' + (k === "classic") + '"><span class="cm-font-name" style="font-family:' + f.family.replace(/"/g, "") + ';font-weight:' + f.weight + '">Priya</span><small>' + f.label + "</small></button>"; }).join("");
    fontBox.addEventListener("click", function (e) { var b = e.target.closest(".cm-font"); if (!b) return; setFont(b.dataset.f); render(); });
  }
  function setFont(k) { state.font = M.NAME_FONTS[k] ? k : "classic"; if (fontBox) fontBox.querySelectorAll(".cm-font").forEach(function (b) { var on = b.dataset.f === state.font; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); }
  // mug colour: handle and inside
  var colorBox = $("#cm-colors");
  if (colorBox) {
    colorBox.innerHTML = Object.keys(M.MUG_COLORS).map(function (k) { var c = M.MUG_COLORS[k]; return '<button type="button" class="cm-color' + (k === "white" ? " on" : "") + '" data-c="' + k + '" role="radio" aria-checked="' + (k === "white") + '" title="' + c.label + '"><i style="background:' + c.hex + '"></i><small>' + c.label + "</small></button>"; }).join("");
    colorBox.addEventListener("click", function (e) { var b = e.target.closest(".cm-color"); if (!b) return; setColor(b.dataset.c); if (state.view === "r" || state.view === "l") render(); });
  }
  function setColor(k) { state.color = M.MUG_COLORS[k] ? k : "white"; if (colorBox) colorBox.querySelectorAll(".cm-color").forEach(function (b) { var on = b.dataset.c === state.color; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); var lab = $("#cm-color-name"); if (lab) lab.textContent = M.MUG_COLORS[state.color].label + (state.color === "white" ? "" : " handle & inside"); }
  function colorText() { return state.color === "white" ? "White mug" : M.MUG_COLORS[state.color].label + " handle & inside"; }
  function fontLabels() { if (fontBox) fontBox.querySelectorAll(".cm-font-name").forEach(function (sp) { sp.textContent = state.name || "Priya"; }); }
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
    state.name = ""; state.nameErr = ""; state.traits = []; nameIn.value = ""; fontLabels(); syncChips(); unapprove(); render(); nameIn.focus(); window.scrollTo({ top: $(".cm").offsetTop - 70, behavior: "smooth" });
  });
  function spec() { return M.encode(state); }
  function unapprove() { state.approved = false; $("#cm-order").hidden = true; $("#cm-approve").hidden = false; }
  $("#cm-approve").addEventListener("click", function () {
    if (JOIN) { submitJoin(); return; }
    state.approved = true; $("#cm-approve").hidden = true; var box = $("#cm-order"); box.hidden = false;
    var btn = box.querySelector("[data-order]"), labels = state.mode === "msg" ? "Message: \u201c" + state.msg.trim() + "\u201d" : state.traits.map(function (k) { return byKey[k].l; }).join(", ");
    btn.dataset.name = "Custom Name Mug: " + state.name + " | " + labels + " | " + THEMES[state.theme].label + " | " + M.NAME_FONTS[state.font].label + " lettering | " + colorText() + " | design nevervoidstore.com/custom-mug/?d=" + spec();
    $("#cm-summary").textContent = state.name + " · " + labels + " · " + THEMES[state.theme].label + " · " + M.NAME_FONTS[state.font].label + " lettering · " + colorText();
    drawMug(); box.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  // prefill from a design link (?d=Name~k1.k2.k3.k4~theme); ?admin=1 adds a download of the print file for Printrove
  var q = new URLSearchParams(location.search), d = q.get("d");
  function loadSpec(d) { var p = d.split("~"); state.traits = []; setFont(p[3]); setColor(p[4]); state.name = M.cleanName(decodeURIComponent(p[0] || "")).slice(0, 14).trim(); nameIn.value = state.name; state.nameErr = state.name ? M.nameError(state.name) : ""; fontLabels(); if ((p[1] || "").indexOf("m:") === 0) { state.mode = "msg"; state.msg = decodeURIComponent(p[1].slice(2)).slice(0, 120); if (msgIn) msgIn.value = state.msg; var mb = document.querySelector('.cm-mode[data-m="msg"]'); if (mb) mb.click(); } else { var ent = (p[1] || "").split(".").filter(Boolean).slice(0, 4); state.traits = ent.filter(function (k) { return byKey[k]; }); ent.forEach(function (k) { if (k[0] === "_") { var bits = k.split("_"); addCustom(decodeURIComponent(bits.slice(2).join("_")), bits[1], true); } }); } if (THEMES[p[2]]) { state.theme = p[2]; var r = document.querySelector("[name=cm-theme][value=" + p[2] + "]"); if (r) r.checked = true; } syncChips(); if (JOIN && JOIN.team && THEMES[JOIN.team.theme]) state.theme = JOIN.team.theme; syncChips(); render(); }
  if (d && !window.NV_JOIN) loadSpec(d);
  if (q.get("admin") === "1") {
    var dl = document.createElement("button"); dl.type = "button"; dl.className = "buy"; dl.textContent = "Download print file (2550 × 1140)";
    dl.addEventListener("click", function () { var a = document.createElement("a"); a.download = "NevervoidStore-custom-" + (state.name || "mug").replace(/\s+/g, "-") + "-2550x1140.png"; a.href = print.toDataURL("image/png"); a.click(); });
    $("#cm-reset").after(dl);
  }
  // ---------- team link: each employee designs their own mug, the organiser pays once ----------
  var JOIN = window.NV_JOIN || null;
  function submitJoin() {
    var btn = $("#cm-approve"), key = "nv-join-" + JOIN.t, saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
    btn.disabled = true; btn.textContent = "Sending…";
    fetch(JOIN.api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ a: "submit", t: JOIN.t, name: state.name, d: spec(), id: saved.id, token: saved.token }) })
      .then(function (r) { return r.json(); }).then(function (res) {
        btn.textContent = "Submit my mug";
        if (!res.ok) { btn.disabled = false; flash(res.err === "closed" ? "This team link is closed. Please ask your organiser." : res.err === "full" ? "This team is full. Please ask your organiser." : "Couldn't send. Please try again."); return; }
        try { localStorage.setItem(key, JSON.stringify({ id: res.id, token: res.token, d: spec() })); } catch (e) {}
        state.approved = true; btn.hidden = true; var box = $("#cm-joined"); box.hidden = false;
        $("#cm-joined-msg").textContent = (res.updated ? "Updated! " : "Done! ") + "Your mug is with " + (JOIN.team.organiser || "your organiser") + ". You'll get it with the rest of the team.";
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      }).catch(function () { btn.disabled = false; btn.textContent = "Submit my mug"; flash("Couldn't send. Check your connection and try again."); });
  }
  if (JOIN) {
    unapprove = function () { state.approved = false; $("#cm-joined").hidden = true; $("#cm-approve").hidden = false; $("#cm-approve").textContent = "Submit my mug"; };
    $("#cm-approve").textContent = "Submit my mug";
    $("#cm-again").addEventListener("click", function () { unapprove(); render(); nameIn.focus(); });
    fetch(JOIN.api + "?a=team&t=" + encodeURIComponent(JOIN.t)).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) { $(".cm").innerHTML = '<div class="tm-empty" style="margin:40px 0">This team link isn’t valid any more. Please check the link with whoever sent it.</div>'; return; }
      JOIN.team = res.team; $("#cm-join-co").textContent = res.team.company;
      if (THEMES[res.team.theme]) { state.theme = res.team.theme; }
      if (!res.team.open) { $("#cm-approve").disabled = true; flash("This team link is closed. Please ask your organiser."); }
      var saved = {}; try { saved = JSON.parse(localStorage.getItem("nv-join-" + JOIN.t) || "{}"); } catch (e) {}
      if (saved.d) { $("#cm-join-back").hidden = false; loadSpec(saved.d); } else render();
    }).catch(function () { flash("Couldn't load your team. Please refresh the page."); });
  }
  if (!JOIN) render();
})();
