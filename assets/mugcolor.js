// Mug colour picker for ready-made mug pages: recolours the handle and inside of the product photos
// (same Printrove photo geometry as /custom-mug/) and adds the colour to the order.
(function () {
  "use strict";
  var COLORS = { white: ["White", "#ffffff"], black: ["Black", "#202020"], red: ["Red", "#ce051f"], orange: ["Orange", "#ec692c"], yellow: ["Yellow", "#f4b63f"],
                 green: ["Green", "#93dc63"], blue: ["Light blue", "#1bcefa"], navy: ["Dark blue", "#112c47"] };
  var row = document.querySelector("[data-mugcolors]"); if (!row) return;
  var box = row.closest(".buybox"), btns = box ? box.querySelectorAll("[data-order]") : [], cur = "white", tints = {}, cache = {};
  btns.forEach(function (b) { b.dataset.baseName = b.dataset.name; });
  row.querySelector(".mc-list").innerHTML = Object.keys(COLORS).map(function (k) { return '<button type="button" class="cm-color' + (k === "white" ? " on" : "") + '" data-c="' + k + '" role="radio" aria-checked="' + (k === "white") + '"><i style="background:' + COLORS[k][1] + '"></i><small>' + COLORS[k][0] + "</small></button>"; }).join("");
  function label(k) { return k === "white" ? "White" : COLORS[k][0] + " handle & inside"; }
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function tint(v) { if (!tints[v]) tints[v] = loadImg("/assets/custommug/tint-" + v + ".png").then(function (im) { var c = document.createElement("canvas"); c.width = c.height = 620; var x = c.getContext("2d"); x.drawImage(im, 0, 0); return x.getImageData(0, 0, 620, 620).data; }); return tints[v]; }
  // product photos are 620x620 crops of the same Printrove photo: -a = handle left, -b = handle right
  function recolour(src, k) {
    var m = /-(a|b)\.webp(\?.*)?$/.exec(src); if (!m || k === "white") return Promise.resolve(src);
    var id = src + "|" + k; if (cache[id]) return cache[id];
    return (cache[id] = Promise.all([loadImg(src), tint(m[1])]).then(function (r) {
      var c = document.createElement("canvas"); c.width = c.height = 620; var x = c.getContext("2d"); x.drawImage(r[0], 0, 0, 620, 620);
      var img = x.getImageData(0, 0, 620, 620), o = img.data, t = r[1], h = COLORS[k][1], cr = parseInt(h.slice(1, 3), 16), cg = parseInt(h.slice(3, 5), 16), cb = parseInt(h.slice(5, 7), 16);
      for (var q = 0; q < o.length; q += 4) { var a = t[q + 3] / 255; if (!a) continue; var L = t[q] / 255 * 1.3; o[q] = o[q] * (1 - a) + Math.min(255, cr * L) * a; o[q + 1] = o[q + 1] * (1 - a) + Math.min(255, cg * L) * a; o[q + 2] = o[q + 2] * (1 - a) + Math.min(255, cb * L) * a; }
      x.putImageData(img, 0, 0); return c.toDataURL("image/jpeg", 0.9);
    }));
  }
  var imgs = function () { return document.querySelectorAll("#pimg, .views .view img"); };
  function paint(el) {
    var orig = el.dataset.orig && el.src.indexOf("data:") === 0 ? el.dataset.orig : el.getAttribute("src");
    if (orig.indexOf("data:") === 0) return; el.dataset.orig = orig;
    var k = cur; recolour(orig, k).then(function (s) { if (k === cur && el.dataset.orig === orig) { el.dataset.painting = "1"; el.src = s; } });
  }
  function apply() { imgs().forEach(paint); btns.forEach(function (b) { b.dataset.name = b.dataset.baseName + (cur === "white" ? "" : " | " + label(cur)); }); row.querySelector(".mc-name").textContent = label(cur); }
  row.addEventListener("click", function (e) { var b = e.target.closest(".cm-color"); if (!b) return; cur = b.dataset.c; row.querySelectorAll(".cm-color").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); }); apply(); });
  // when the page swaps the photo (view buttons, letter picker), colour the new one too
  var mo = new MutationObserver(function (list) { list.forEach(function (m) { var el = m.target; if (el.dataset.painting) { delete el.dataset.painting; return; } if (el.src.indexOf("data:") !== 0) { el.dataset.orig = el.getAttribute("src"); if (cur !== "white") paint(el); } }); });
  imgs().forEach(function (el) { mo.observe(el, { attributes: true, attributeFilter: ["src"] }); });
  // names in the order may also be changed by other scripts (initial letter): keep the colour on the end
  btns.forEach(function (b) { new MutationObserver(function () { var n = b.dataset.name, suf = cur === "white" ? "" : " | " + label(cur); if (suf && n.slice(-suf.length) === suf) return; b.dataset.baseName = n.replace(/ \| [A-Za-z ]+ handle & inside$/, ""); b.dataset.name = b.dataset.baseName + suf; }).observe(b, { attributes: true, attributeFilter: ["data-name"] }); });
})();
