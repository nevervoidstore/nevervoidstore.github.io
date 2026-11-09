// NevervoidStore mug design engine, shared by /custom-mug/, /team/ and the employee team links.
// A design is {name, mode:"traits"|"msg", traits:[keys], msg, theme}. Output: 2550x1140 print (Printrove mug print area) + real-mug preview.
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
  var BAD = /\b(fuck|fck|shit|bitch|bastard|asshole|dick|cunt|slut|whore|porn|sex|nude|rape|nigg|chutiya|chutia|madarchod|bhenchod|behenchod|bhosdi|gaand|gandu|lund|randi|harami|kutta|kamina)\w*/i;

  var FONTS = [["NVPlayfair", "playfair-display-latin-900-normal.woff2", "900"], ["NVPlayfairB", "playfair-display-latin-700-normal.woff2", "700"],
               ["NVScript", "pacifico-latin-400-normal.woff2", "400"], ["NVSans", "dm-sans-latin-600-normal.woff2", "600"],
               ["NVDancing", "dancing-script-latin-700-normal.woff2", "700"], ["NVModern", "montserrat-latin-800-normal.woff2", "800"],
               ["NVHand", "caveat-latin-700-normal.woff2", "700"], ["NVFestive", "mountains-of-christmas-latin-700-normal.woff2", "700"]];
  // name styles: max = starting size; the name is then shrunk until its ink fits the name box on the mug
  var NAME_FONTS = {
    classic: { label: "Classic", family: "NVPlayfair, Georgia, serif", weight: 900, max: 180 },
    script:  { label: "Script", family: "NVDancing, cursive", weight: 700, max: 200 },
    modern:  { label: "Modern", family: "NVModern, Arial, sans-serif", weight: 800, max: 165 },
    hand:    { label: "Handwritten", family: "NVHand, cursive", weight: 700, max: 220 },
    festive: { label: "Festive", family: "NVFestive, Georgia, serif", weight: 700, max: 190 }
  };
  // Printrove mug colours: the handle and the inside take the colour; the printed body stays white
  var MUG_COLORS = {
    white:  { label: "White", hex: "#ffffff" },
    black:  { label: "Black", hex: "#202020" },
    red:    { label: "Red", hex: "#ce051f" },
    orange: { label: "Orange", hex: "#ec692c" },
    yellow: { label: "Yellow", hex: "#f4b63f" },
    green:  { label: "Green", hex: "#93dc63" },
    blue:   { label: "Light blue", hex: "#1bcefa" },
    navy:   { label: "Dark blue", hex: "#112c47" }
  };
  var NAME_BOX = { w: 610, h: 200, cy: 352, min: 96 }; // ink box above the flourish (y 495), face-on zone
  var fontsReady = Promise.all(FONTS.map(function (f) {
    try { var ff = new FontFace(f[0], "url(/assets/fonts/" + f[1] + ")", { weight: f[2] }); return ff.load().then(function (x) { document.fonts.add(x); }); }
    catch (e) { return Promise.resolve(); }
  })).catch(function () {});

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

  // draw a design onto a 2550x1140 canvas
  function drawPrint(print, d) {
    var th = THEMES[d.theme] || THEMES.classic, ctx = print.getContext("2d"), name = d.name || "Your Name", traits = d.traits || [], msg = d.msg || "";
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = th.name;
    var nf = NAME_FONTS[d.font] || NAME_FONTS.classic, fit = fitName(ctx, name, nf);
    ctx.textAlign = "left"; ctx.fillText(name, FRONT - fit.w / 2 + fit.left, NAME_BOX.cy + fit.h / 2 - fit.desc); ctx.textAlign = "center";
    flourish(ctx, FRONT, 495, 230, th.line);
    var jobs = [];
    if (d.mode === "msg") {
      var text = msg.trim() || "Your message here", lines, size;
      for (size = 66; size >= 40; size -= 2) { ctx.font = "400 " + size + "px NVScript, cursive"; lines = wrap(ctx, text, 600); if (lines.length * size * 1.45 <= 400) break; }
      ctx.fillStyle = msg.trim() ? th.accent : "#c9c2b6"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var lh = size * 1.45, top = 640 + (400 - lines.length * lh) / 2 - 40;
      lines.forEach(function (ln, i) { ctx.fillText(ln, FRONT, top + lh * (i + 0.5)); });
    } else {
      var items = traits.slice(), ROW = 100, FS = 46; ctx.font = "600 " + FS + "px NVSans, sans-serif";
      var maxw = 0; items.forEach(function (k) { maxw = Math.max(maxw, ctx.measureText(byKey[k] ? byKey[k].l : k).width); });
      if (!items.length) maxw = 260;
      var blockW = Math.min(610, 84 + 26 + maxw), left = FRONT - blockW / 2, y0 = 585;
      for (var i = 0; i < 4; i++) {
        var y = y0 + i * ROW, k = items[i], cxI = left + 42;
        if (k && byKey[k]) {
          ctx.fillStyle = th.accent; ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(cxI, y, 42, 0, 7); ctx.fill(); ctx.globalAlpha = 0.6; ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1;
          ctx.fillStyle = th.text; ctx.textAlign = "left"; ctx.textBaseline = "middle"; fitFont(ctx, byKey[k].l, "NVSans, sans-serif", 600, FS, 30, blockW - 110); ctx.fillText(byKey[k].l, left + 110, y + 2);
          (function (kk, cx, cy) { jobs.push(icon(kk, th.icon).then(function (im) { if (im) ctx.drawImage(im, cx - 29, cy - 29, 58, 58); })); })(k, cxI, y);
        } else { ctx.setLineDash([8, 8]); ctx.strokeStyle = "#d6cfc2"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cxI, y, 38, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#e7e1d6"; ctx.fillRect(left + 102, y - 8, Math.max(120, maxw * 0.7), 16); }
      }
    }
    var ini = ((d.name || "").trim()[0] || "N").toUpperCase();
    ctx.textAlign = "center";
    ctx.strokeStyle = th.line; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(BACK, 545, 235, 0, 7); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(BACK, 545, 213, 0, 7); ctx.stroke();
    // centre the letter on its ink, not its font box: Playfair capitals sit low on "middle"
    ctx.fillStyle = th.name; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    for (var ms = 280; ms > 120; ms -= 10) { ctx.font = nf.weight + " " + ms + "px " + nf.family; var mt = ctx.measureText(ini); if (mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight <= 290 && mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent <= 250) break; }
    var mi = ctx.measureText(ini), inkW = mi.actualBoundingBoxLeft + mi.actualBoundingBoxRight, inkH = mi.actualBoundingBoxAscent + mi.actualBoundingBoxDescent;
    ctx.fillText(ini, BACK - inkW / 2 + mi.actualBoundingBoxLeft, 545 + inkH / 2 - mi.actualBoundingBoxDescent); ctx.textAlign = "center";
    [-1, 1].forEach(function (dd) { ctx.save(); ctx.translate(BACK + dd * 235, 545); ctx.rotate(Math.PI / 4); ctx.fillStyle = th.line; ctx.fillRect(-11, -11, 22, 22); ctx.restore(); });
    ctx.fillStyle = th.accent; ctx.textBaseline = "alphabetic"; fitFont(ctx, "made for " + name, "NVScript, cursive", 400, 70, 40, 600); ctx.fillText("made for " + name, BACK, 920);
    ctx.fillStyle = th.line; ctx.fillRect(0, 1048, PW, 5); ctx.fillRect(0, 1064, PW, 2);
    return Promise.all(jobs);
  }
  // largest size at which the name's actual ink fits the name box; reports how much it had to shrink
  function fitName(ctx, name, nf) {
    var size = nf.max, m;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; // measure with the same alignment we draw with
    for (; size >= 60; size -= 4) {
      ctx.font = nf.weight + " " + size + "px " + nf.family; m = ctx.measureText(name);
      if (m.actualBoundingBoxLeft + m.actualBoundingBoxRight <= NAME_BOX.w && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent <= NAME_BOX.h) break;
    }
    return { size: size, left: m.actualBoundingBoxLeft, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, desc: m.actualBoundingBoxDescent, small: size < NAME_BOX.min };
  }
  // for pages: does this name print at a comfortable size in this style?
  function nameFit(name, font) { var c = document.createElement("canvas").getContext("2d"); return fitName(c, name || "Name", NAME_FONTS[font] || NAME_FONTS.classic); }
  function newPrint() { var c = document.createElement("canvas"); c.width = PW; c.height = PH; return c; }
  function render(print, d) { return fontsReady.then(function () { return drawPrint(print, d); }); }

  // real-mug preview: Printrove's mug photo with the print wrapped using the measured cylinder maps
  var MUGS = {}, small = document.createElement("canvas"); small.width = 1020; small.height = 456;
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function pixels(img) { var c = document.createElement("canvas"); c.width = img.width; c.height = img.height; var x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; }
  var mugsP = null;
  function mugsReady() {
    if (!mugsP) mugsP = Promise.all(["a", "b"].map(function (v) {
      return Promise.all([loadImg("/assets/custommug/mug-" + v + ".jpg"), loadImg("/assets/custommug/map-" + v + "-s.png"), loadImg("/assets/custommug/map-" + v + "-v.png"), loadImg("/assets/custommug/tint-" + v + ".png")]).then(function (r) {
        var base = pixels(r[0]), ms = pixels(r[1]), mv = pixels(r[2]), tn = pixels(r[3]), n = 620 * 620, S = new Float32Array(n), V = new Float32Array(n), E = new Float32Array(n);
        for (var i = 0; i < n; i++) { S[i] = (ms[i * 4] * 256 + ms[i * 4 + 1]) / 65535; V[i] = (mv[i * 4] * 256 + mv[i * 4 + 1]) / 65535; E[i] = ms[i * 4 + 2] / 255; }
        MUGS[v] = { base: base, S: S, V: V, E: E, tint: tn }; // tint: R = shading, A = handle/inside coverage
      });
    }));
    return mugsP;
  }
  // view "r" = handle right (name side), "l" = handle left (monogram side). out: a 620x620 canvas
  function wrapMug(print, view, out, color) {
    return mugsReady().then(function () {
      var m = MUGS[view === "l" ? "a" : "b"], sc = small.getContext("2d");
      sc.imageSmoothingQuality = "high"; sc.clearRect(0, 0, 1020, 456); sc.drawImage(print, 0, 0, 1020, 456);
      var src = sc.getImageData(0, 0, 1020, 456).data, ctx = out.getContext("2d"), img = ctx.createImageData(620, 620), o = img.data, b = m.base;
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
      var mc = MUG_COLORS[color];
      if (mc && color !== "white") {
        var cr = parseInt(mc.hex.slice(1, 3), 16), cg = parseInt(mc.hex.slice(3, 5), 16), cb = parseInt(mc.hex.slice(5, 7), 16), t = m.tint;
        for (var j = 0, nn = 620 * 620; j < nn; j++) {
          var q = j * 4, a = t[q + 3] / 255; if (!a) continue;
          var L = t[q] / 255 * 1.3; // shading of Printrove's coloured-mug photo, soft edges in the alpha
          o[q] = o[q] * (1 - a) + Math.min(255, cr * L) * a; o[q + 1] = o[q + 1] * (1 - a) + Math.min(255, cg * L) * a; o[q + 2] = o[q + 2] * (1 - a) + Math.min(255, cb * L) * a;
        }
      }
      ctx.putImageData(img, 0, 0);
      return out;
    });
  }

  // typed traits -> icons (dictionary first, then icon names and tags), fallback sparkles
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
  // register a typed trait; resolves to its key ("_icon_label")
  function addCustom(label, iconName) {
    return loadIndex().then(function (ix) {
      var icn = iconName && ix.icons[iconName] ? iconName : findIcon(ix, label), k = "_" + icn + "_" + encodeURIComponent(label);
      if (!byKey[k]) byKey[k] = { k: k, l: label, svg: ix.icons[icn].s, custom: true };
      return k;
    });
  }
  // a typed word -> a preset trait key if the label matches, else a custom key
  function traitFor(word) {
    var w = word.trim().toLowerCase();
    for (var i = 0; i < TRAITS.length; i++) if (TRAITS[i].l.toLowerCase() === w) return Promise.resolve(TRAITS[i].k);
    return addCustom(titleCase(word.trim()));
  }

  // validation shared by every page
  function titleCase(s) { return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function cleanName(v) { return v.replace(/[^A-Za-z .'-]/g, "").replace(/\s{2,}/g, " ").replace(/^[ .'-]+/, ""); }
  function nameError(v) {
    var t = v.trim(), letters = t.replace(/[^A-Za-z]/g, "").length;
    if (!t) return "Name is missing"; if (t.length > 14) return "Name is over 14 characters"; if (/[^A-Za-z .'-]/.test(t)) return "Name can only have letters, spaces, . ' and -";
    if (letters < 2) return "Name needs at least 2 letters"; if (/([.'-])\1|[.'-]{2,}/.test(t) || t.split(" ").length > 3) return "That doesn't look like a name"; if (/(.)\1\1/i.test(t)) return "That doesn't look like a name";
    if (BAD.test(t)) return "Please use a real name"; return "";
  }
  function wordError(raw) {
    var v = raw.replace(/[^A-Za-z &'-]/g, "").replace(/\s{2,}/g, " ").trim();
    if (!v) return "Empty word"; if (/[.!?,]/.test(raw) || v.split(" ").length > 2 || v.length > 16) return "“" + raw.trim() + "” is too long (1–2 words)";
    if (v.length < 3) return "“" + raw.trim() + "” is too short"; if (BAD.test(v)) return "Let's keep it friendly"; return "";
  }
  function cleanMsg(v) { return v.replace(/[^A-Za-z0-9 \n.,!?'&:\-❤]/g, "").replace(/\n{2,}/g, "\n"); }
  function msgError(v) { var t = v.trim(); if (t.length < 3) return "Message is too short"; if (t.length > 120) return "Message is over 120 characters"; if (BAD.test(t)) return "Let's keep it friendly"; return ""; }

  // design link codec: Name~k1.k2.k3.k4~theme  or  Name~m:message~theme
  function encode(d) { return encodeURIComponent(d.name) + "~" + (d.mode === "msg" ? "m:" + encodeURIComponent((d.msg || "").trim()) : (d.traits || []).join(".")) + "~" + d.theme + (d.color && d.color !== "white" && MUG_COLORS[d.color] ? "~" + (NAME_FONTS[d.font] ? d.font : "classic") + "~" + d.color : d.font && d.font !== "classic" && NAME_FONTS[d.font] ? "~" + d.font : ""); }
  // resolves to a design with any custom traits registered
  function decode(s) {
    var p = String(s || "").split("~"), d = { name: decodeURIComponent(p[0] || "").slice(0, 14), mode: "traits", traits: [], msg: "", theme: THEMES[p[2]] ? p[2] : "classic", font: NAME_FONTS[p[3]] ? p[3] : "classic", color: MUG_COLORS[p[4]] ? p[4] : "white" };
    if ((p[1] || "").indexOf("m:") === 0) { d.mode = "msg"; d.msg = decodeURIComponent(p[1].slice(2)).slice(0, 120); return Promise.resolve(d); }
    var ent = (p[1] || "").split(".").filter(Boolean).slice(0, 4);
    return Promise.all(ent.map(function (k) {
      if (byKey[k]) return k;
      if (k[0] === "_") { var bits = k.split("_"); return addCustom(decodeURIComponent(bits.slice(2).join("_")), bits[1]); }
      return null;
    })).then(function (ks) { d.traits = ks.filter(Boolean); return d; });
  }
  function labels(d) { return d.mode === "msg" ? "Message: “" + (d.msg || "").trim() + "”" : (d.traits || []).map(function (k) { return byKey[k] ? byKey[k].l : k; }).join(", "); }

  // tiny ZIP writer (stored, no compression: PNGs are already compressed)
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xffffffff; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(files) { // files: [{name, data:Uint8Array}] -> Blob
    var parts = [], central = [], off = 0, enc = new TextEncoder(), n = new Date(), DT = [(n.getHours() << 11) | (n.getMinutes() << 5) | (n.getSeconds() >> 1), ((n.getFullYear() - 1980) << 9) | ((n.getMonth() + 1) << 5) | n.getDate()];
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length, h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, DT[0], true); h.setUint16(12, DT[1], true); h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
      parts.push(h.buffer, nm, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, DT[0], true); c.setUint16(14, DT[1], true); c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(c.buffer, nm); off += 30 + nm.length + sz;
    });
    var csize = central.reduce(function (a, b) { return a + b.byteLength; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [e.buffer]), { type: "application/zip" });
  }
  function canvasPNG(c) { return new Promise(function (ok) { c.toBlob(function (b) { b.arrayBuffer().then(function (ab) { ok(new Uint8Array(ab)); }); }, "image/png"); }); }
  function fileName(d, i) { return (i != null ? String(i + 1).padStart(3, "0") + "-" : "") + (d.name || "mug").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-2550x1140.png"; }

  window.NVMug = { PW: PW, PH: PH, THEMES: THEMES, NAME_FONTS: NAME_FONTS, MUG_COLORS: MUG_COLORS, nameFit: nameFit, TRAITS: TRAITS, byKey: byKey, BAD: BAD, fontsReady: fontsReady,
    newPrint: newPrint, render: render, wrapMug: wrapMug, loadIndex: loadIndex, addCustom: addCustom, traitFor: traitFor,
    titleCase: titleCase, cleanName: cleanName, nameError: nameError, wordError: wordError, cleanMsg: cleanMsg, msgError: msgError,
    encode: encode, decode: decode, labels: labels, zip: zip, canvasPNG: canvasPNG, fileName: fileName };
})();
