// Family nickname mug: the word your family really uses (Ajji, Paati, Nani, Amma...), their own line, and who it's from.
// Draws a 2550x1140 print and wraps it on the mug photo with NVMug.wrapMug. The design lives in the page address, so
// the order carries a link that rebuilds the exact print (add &admin=1 to download the print file).
(function () {
  var M = window.NVMug; if (!M) return;
  var $ = function (s) { return document.querySelector(s); };
  var WHO = [
    ["Grandma", ["Ajji", "Paati", "Ammamma", "Nani", "Dadi", "Aaji", "Ammachi", "Grandma"]],
    ["Grandpa", ["Ajja", "Thatha", "Nana", "Dadu", "Appachan", "Grandpa"]],
    ["Mum & Dad", ["Amma", "Appa", "Mummy", "Papa", "Maa", "Baba", "Mom", "Dad"]],
    ["Siblings", ["Akka", "Anna", "Chechi", "Chetta", "Didi", "Bhaiya", "Tangi", "Thambi"]],
    ["Aunts & uncles", ["Chikkamma", "Chithi", "Athai", "Mausi", "Bua", "Mama", "Chikkappa", "Chacha"]]
  ];
  var LINES = ["Best filter coffee in town", "Queen of the kitchen", "Chief Pampering Officer", "World's best storyteller", "Home is wherever you are", "Forever my favourite", "Champion of second helpings", "The real boss of the house"];
  var THEMES = {
    xmas: { label: "Christmas", ink: "#b3122a", sub: "#1c603a", soft: "#7a6440", gold: "#c9a24a", foot: "Merry Christmas" },
    home: { label: "Everyday", ink: "#1f2a44", sub: "#b4583a", soft: "#6b6358", gold: "#d8a25a", foot: "" }
  };
  var q = new URLSearchParams(location.search);
  var S = { who: q.get("n") || "Ajji", line: q.get("l") != null ? q.get("l") : "Best filter coffee in town", from: q.get("f") || "", theme: THEMES[q.get("t")] ? q.get("t") : "xmas", view: "r" };
  var ADMIN = q.get("admin") === "1";
  var OK = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,13}$/u, OKLINE = /^[\p{L}\p{M}\p{N} .,'!&?-]{0,32}$/u;

  // ---------- drawing ----------
  var print = document.createElement("canvas"); print.width = M.PW; print.height = M.PH;
  var holly = new Image(); holly.src = "/assets/wish/holly.svg";
  var hollyReady = new Promise(function (ok) { holly.onload = ok; holly.onerror = ok; });
  function fit(ctx, text, font, max, min, w) { var s = max; ctx.font = font.replace("#", s); while (ctx.measureText(text).width > w && s > min) { s -= 4; ctx.font = font.replace("#", s); } return s; }
  function spaced(ctx, text, x, y, track) {   // centred text with letter spacing
    var chars = Array.from(text), w = chars.reduce(function (a, c) { return a + ctx.measureText(c).width; }, 0) + track * (chars.length - 1), cx = x - w / 2;
    ctx.textAlign = "left"; chars.forEach(function (c) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + track; }); ctx.textAlign = "center";
    return w;
  }
  function star(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function heart(ctx, x, y, s, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35); ctx.fill();
  }
  function side(ctx, cx, T) {
    var W = 1000, who = S.who.trim() || "Ajji", line = S.line.trim(), from = S.from.trim();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    if (S.theme === "xmas") { ctx.save(); ctx.translate(cx, 175); ctx.rotate(-0.08); ctx.drawImage(holly, -150, -110, 300, 220); ctx.restore(); }
    else heart(ctx, cx, 205, 90, T.sub);
    // the nickname, big
    var sz = fit(ctx, who, "700 #px NVDancing, cursive", 330, 120, W);
    ctx.fillStyle = T.ink; ctx.fillText(who, cx, 300 + sz * 0.78);
    var y = 300 + sz * 0.78 + 125;
    if (line) {
      var ls = fit(ctx, line.toUpperCase(), "800 #px NVModern, Arial, sans-serif", 66, 36, W - 120);
      ctx.fillStyle = T.sub; spaced(ctx, line.toUpperCase(), cx, y, ls * 0.14); y += 105;
    }
    // little gold divider
    [-1, 1].forEach(function (d) { ctx.fillStyle = T.gold; ctx.fillRect(cx + d * 60 - (d < 0 ? 150 : 0), y - 34, 150, 4); });
    star(ctx, cx, y - 32, 22, T.gold);
    var foot = [T.foot, from ? "love, " + from : ""].filter(Boolean).join(" · ");
    if (foot) { fit(ctx, foot, "700 #px NVDancing, cursive", 76, 44, W); ctx.fillStyle = T.soft; ctx.fillText(foot, cx, y + 80); }
    if (S.theme === "xmas") [[-430, 330, 16], [450, 300, 13], [-470, 720, 12], [470, 760, 17], [-400, 980, 10], [420, 1010, 11]].forEach(function (p) { star(ctx, cx + p[0], p[1], p[2], T.gold); });
  }
  function draw() {
    var ctx = print.getContext("2d"), T = THEMES[S.theme];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, M.PW, M.PH);
    side(ctx, Math.round(0.78 * M.PW), T); side(ctx, Math.round(0.205 * M.PW), T);
  }

  // ---------- preview ----------
  var mug = $("#fm-mug"), flat = $("#fm-flat"), busy = false, again = false;
  function render() {
    if (busy) { again = true; return; } busy = true;
    Promise.all([M.fontsReady, hollyReady]).then(function () {
      draw();
      var f = flat.getContext("2d"); f.drawImage(print, 0, 0, flat.width, flat.height);
      return M.wrapMug(print, S.view, mug, "white");
    }).then(function () {
      var pimg = $("#pimg"); if (pimg) pimg.src = mug.toDataURL("image/jpeg", 0.85);
      busy = false; if (again) { again = false; render(); }
    }).catch(function () { busy = false; });
    sync();
  }
  function link() {
    var p = new URLSearchParams({ n: S.who.trim(), l: S.line.trim(), t: S.theme }); if (S.from.trim()) p.set("f", S.from.trim());
    return location.origin + location.pathname + "?" + p.toString();
  }
  function sync() {
    var ok = OK.test(S.who.trim()) && OKLINE.test(S.line.trim()) && (!S.from.trim() || OK.test(S.from.trim()));
    var btn = $("#fm-order [data-order]"), warn = $("#fm-warn");
    warn.hidden = ok; warn.textContent = ok ? "" : "Please use letters only for names (up to 14), and up to 32 simple characters for the line.";
    btn.disabled = !ok;
    btn.dataset.name = "Family Nickname Mug | For: " + S.who.trim() + (S.line.trim() ? " | Line: " + S.line.trim() : "") + (S.from.trim() ? " | Love: " + S.from.trim() : "") + " | " + THEMES[S.theme].label + " | Design: " + link();
    try { history.replaceState(null, "", link().replace(location.origin, "")); } catch (e) {}
  }

  // ---------- controls ----------
  function chip(v, on) { return '<button type="button" class="cm-chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-v="' + v.replace(/"/g, "&quot;") + '">' + v + "</button>"; }
  var tabs = $("#fm-tabs"), words = $("#fm-words"), g = 0;
  WHO.forEach(function (x, i) { if (x[1].indexOf(S.who) >= 0) g = i; });
  function drawWho() {
    tabs.innerHTML = WHO.map(function (x, i) { return '<button type="button" class="cm-mode' + (i === g ? " on" : "") + '" data-g="' + i + '">' + x[0] + "</button>"; }).join("");
    words.innerHTML = WHO[g][1].map(function (w) { return chip(w, w === S.who); }).join("");
  }
  tabs.addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (b) { g = +b.dataset.g; drawWho(); } });
  words.addEventListener("click", function (e) { var b = e.target.closest("[data-v]"); if (!b) return; S.who = b.dataset.v; $("#fm-own").value = ""; drawWho(); render(); });
  $("#fm-own").addEventListener("input", function (e) { var v = e.target.value.slice(0, 14); if (v.trim()) { S.who = v; drawWho(); render(); } });
  var lineIn = $("#fm-line"); lineIn.value = S.line;
  $("#fm-lines").innerHTML = LINES.map(function (l) { return chip(l, false); }).join("");
  $("#fm-lines").addEventListener("click", function (e) { var b = e.target.closest("[data-v]"); if (!b) return; S.line = lineIn.value = b.dataset.v; render(); });
  lineIn.addEventListener("input", function () { S.line = lineIn.value.slice(0, 32); render(); });
  var fromIn = $("#fm-from"); fromIn.value = S.from; fromIn.addEventListener("input", function () { S.from = fromIn.value.slice(0, 14); render(); });
  document.querySelectorAll("input[name=fm-theme]").forEach(function (r) { r.checked = r.value === S.theme; r.addEventListener("change", function () { S.theme = r.value; render(); }); });
  document.querySelectorAll(".fm-view").forEach(function (b) { b.addEventListener("click", function () { document.querySelectorAll(".fm-view").forEach(function (x) { x.classList.toggle("on", x === b); }); S.view = b.dataset.v; render(); }); });
  if (WHO.every(function (x) { return x[1].indexOf(S.who) < 0; })) $("#fm-own").value = S.who;
  if (ADMIN) {
    var d = document.createElement("button"); d.type = "button"; d.className = "ask"; d.textContent = "Download print file";
    d.addEventListener("click", function () { Promise.all([M.fontsReady, hollyReady]).then(function () { draw(); var a = document.createElement("a"); a.href = print.toDataURL("image/png"); a.download = "family-mug-" + S.who.trim() + ".png"; a.click(); }); });
    $("#fm-order").prepend(d);
  }
  drawWho(); render();
})();
