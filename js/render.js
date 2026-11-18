// Desenarea: hartă izometrică, clădiri, oameni, ceață, harta mică. Totul e desenat din cod.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var R = G.R = {};
  var cam = G.cam = { x: 36, y: 36, z: 1.1 };
  var cv, ctx, W = 800, H = 400, DPR = 1, SS = 2;
  var spr = {}, tileSpr = null, clock = 0, lastFogT = -1;
  R.marks = [];

  var PAL = {
    mol: { wall: '#ece3cd', wood: '#8a5d34', roof: '#5b3b2a', red: '#9c3a25', stone: '#cdc4af', paint: '#2c5fae', dome: '#5b3b2a' },
    oto: { wall: '#f1e4c2', wood: '#93693d', roof: '#b4573a', red: '#b0402c', stone: '#dacda9', paint: '#f2ede0', dome: '#8798ab' }
  };
  var SKIN = '#e8c096';

  // ---------- culori ----------
  function rgb(c) {
    if (c[0] === '#') { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    var m = c.match(/\d+/g); return [+m[0], +m[1], +m[2]];
  }
  function shade(c, f) {
    var a = rgb(c), r = a[0], g = a[1], b = a[2];
    if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  R.shade = shade;

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * SS); c.height = Math.ceil(h * SS);
    var g = c.getContext('2d'); g.scale(SS, SS);
    return { c: c, g: g, w: w, h: h, ax: 0, ay: 0 };
  }

  // ---------- inițializare ----------
  R.init = function (canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    R.resize();
  };
  R.resize = function () {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || window.innerWidth; H = cv.clientHeight || window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    R.W = W; R.H = H; R.DPR = DPR;
  };
  R.w2s = function (x, y) { return [(x - y - cam.x + cam.y) * 32 * cam.z + W / 2, (x + y - cam.x - cam.y) * 16 * cam.z + H / 2]; };
  R.s2w = function (sx, sy) {
    var a = (sx - W / 2) / (32 * cam.z) + cam.x - cam.y, b = (sy - H / 2) / (16 * cam.z) + cam.x + cam.y;
    return [(a + b) / 2, (b - a) / 2];
  };
  R.clampCam = function () {
    var N = G.S ? G.S.N : 72;
    cam.x = Math.max(0, Math.min(N, cam.x)); cam.y = Math.max(0, Math.min(N, cam.y));
    cam.z = Math.max(0.55, Math.min(2.2, cam.z));
  };
  // pune punctul (x, y) în mijlocul zonei care nu e acoperită de bare
  R.center = function (x, y) {
    var top = 32, bot = (document.getElementById('bottom') || {}).offsetHeight || 104;
    var dy = H / 2 - (top + (H - bot)) / 2, k = dy / (32 * cam.z);
    cam.x = x + k; cam.y = y + k; R.clampCam();
  };

  // ---------- pătrățelele de teren ----------
  function buildTiles() {
    var out = [];
    var bases = [
      ['#6c9a3b', '#69963a', '#72a040', '#6b993c'],
      ['#a08759', '#9b8255', '#a58c5e', '#9d8457'],
      ['#3b6ea5', '#3a6ca2', '#3c70a8', '#3b6ea5'],
      ['#5f95bf', '#5c92bc', '#6299c2', '#5f95bf'],
      ['#8b6a42', '#8b6a42', '#8b6a42', '#8b6a42']
    ];
    for (var k = 0; k < 5; k++) {
      out[k] = [];
      for (var v = 0; v < 4; v++) {
        var s = mk(64, 32), g = s.g, Rn = G.rng(k * 100 + v * 7 + 3);
        g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath();
        g.save(); g.clip();
        g.fillStyle = bases[k][v]; g.fillRect(0, 0, 64, 32);
        var i, x, y;
        if (k === 0) {
          for (i = 0; i < 46; i++) {
            x = Rn() * 64; y = Rn() * 32;
            g.fillStyle = Rn() < 0.55 ? 'rgba(38,70,20,0.28)' : 'rgba(178,214,112,0.25)';
            g.fillRect(x, y, 2.2, 1.1);
          }
          for (i = 0; i < 7; i++) {
            x = Rn() * 60 + 2; y = Rn() * 28 + 2;
            g.strokeStyle = 'rgba(40,80,25,0.4)'; g.lineWidth = 0.8;
            g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 3); g.moveTo(x + 1, y); g.lineTo(x + 2, y - 3); g.stroke();
          }
          if (v === 3) for (i = 0; i < 4; i++) { g.fillStyle = Rn() < 0.5 ? '#f2e36a' : '#f4f1ea'; g.fillRect(Rn() * 56 + 4, Rn() * 24 + 4, 1.6, 1.6); }
        } else if (k === 1) {
          for (i = 0; i < 40; i++) { g.fillStyle = Rn() < 0.5 ? 'rgba(90,70,40,0.3)' : 'rgba(200,180,140,0.3)'; g.fillRect(Rn() * 64, Rn() * 32, 2, 1.2); }
          for (i = 0; i < 3; i++) { g.fillStyle = 'rgba(120,110,95,0.6)'; g.beginPath(); g.ellipse(Rn() * 56 + 4, Rn() * 24 + 4, 1.6, 1, 0, 0, 6.3); g.fill(); }
        } else if (k === 2 || k === 3) {
          g.strokeStyle = k === 2 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.2)'; g.lineWidth = 1;
          for (i = 0; i < 4; i++) { x = Rn() * 50 + 7; y = Rn() * 22 + 5; g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x, y - 2, x + 6, y); g.stroke(); }
          if (k === 3) for (i = 0; i < 12; i++) { g.fillStyle = 'rgba(210,195,140,0.45)'; g.fillRect(Rn() * 64, Rn() * 32, 2, 1.4); }
        } else {
          g.fillStyle = '#3b6ea5'; g.fillRect(0, 0, 64, 32);
          g.fillStyle = '#8f6d44'; g.beginPath(); g.moveTo(32, 1); g.lineTo(63, 16); g.lineTo(32, 31); g.lineTo(1, 16); g.closePath(); g.fill();
          g.strokeStyle = '#6a4e30'; g.lineWidth = 1;
          for (y = 3; y < 32; y += 3.2) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
        }
        g.restore();
        out[k][v] = s;
      }
    }
    return out;
  }

  // ---------- ajutoare izometrice pentru sprite-uri ----------
  function iso(g, ox, oy) {
    function P(ix, iy, z) { return [ox + (ix - iy) * 32, oy + (ix + iy) * 16 - (z || 0)]; }
    function poly(pts, fill, stroke, lw) {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.7; g.stroke(); }
    }
    var EDGE = 'rgba(40,25,15,0.35)';
    function box(x0, y0, x1, y1, z0, h, top, left, right) {
      poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], left, EDGE);
      poly([P(x1, y1, z0), P(x1, y0, z0), P(x1, y0, z0 + h), P(x1, y1, z0 + h)], right, EDGE);
      if (top) poly([P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], top, EDGE);
    }
    function wbox(x0, y0, x1, y1, z0, h, c) { box(x0, y0, x1, y1, z0, h, shade(c, 0.12), c, shade(c, -0.22)); }
    function hip(x0, y0, x1, y1, z, h, c) {
      var A = P((x0 + x1) / 2, (y0 + y1) / 2, z + h);
      poly([P(x0, y0, z), P(x1, y0, z), A], shade(c, -0.3));
      poly([P(x0, y0, z), P(x0, y1, z), A], shade(c, -0.18));
      poly([P(x0, y1, z), P(x1, y1, z), A], shade(c, 0.1), EDGE);
      poly([P(x1, y1, z), P(x1, y0, z), A], shade(c, -0.12), EDGE);
    }
    function gableX(x0, y0, x1, y1, z, h, c, wall) {
      var ym = (y0 + y1) / 2, R0 = P(x0, ym, z + h), R1 = P(x1, ym, z + h);
      poly([P(x0, y0, z), P(x1, y0, z), R1, R0], shade(c, -0.25));
      poly([P(x0, y1, z), P(x1, y1, z), R1, R0], shade(c, 0.08), EDGE);
      poly([P(x1, y0, z), P(x1, y1, z), R1], wall || shade(c, -0.1), EDGE);
    }
    function gableY(x0, y0, x1, y1, z, h, c, wall) {
      var xm = (x0 + x1) / 2, R0 = P(xm, y0, z + h), R1 = P(xm, y1, z + h);
      poly([P(x0, y0, z), P(x0, y1, z), R1, R0], shade(c, -0.25));
      poly([P(x1, y0, z), P(x1, y1, z), R1, R0], shade(c, -0.08), EDGE);
      poly([P(x0, y1, z), P(x1, y1, z), R1], wall || shade(c, 0.05), EDGE);
    }
    function cyl(cx, cy, z, r, h, c) {
      var p = P(cx, cy, z), q = P(cx, cy, z + h), rx = r * 45, ry = r * 22.6;
      var grd = g.createLinearGradient(p[0] - rx, 0, p[0] + rx, 0);
      grd.addColorStop(0, shade(c, 0.12)); grd.addColorStop(0.45, c); grd.addColorStop(1, shade(c, -0.32));
      g.beginPath(); g.moveTo(q[0] - rx, q[1]); g.lineTo(p[0] - rx, p[1]);
      g.ellipse(p[0], p[1], rx, ry, 0, Math.PI, 0, true);
      g.lineTo(q[0] + rx, q[1]); g.closePath(); g.fillStyle = grd; g.fill();
      g.strokeStyle = EDGE; g.lineWidth = 0.6; g.stroke();
      g.beginPath(); g.ellipse(q[0], q[1], rx, ry, 0, 0, Math.PI * 2); g.fillStyle = shade(c, 0.08); g.fill();
    }
    function cone(cx, cy, z, r, h, c) {
      var p = P(cx, cy, z), rx = r * 45, ry = r * 22.6;
      var grd = g.createLinearGradient(p[0] - rx, 0, p[0] + rx, 0);
      grd.addColorStop(0, shade(c, 0.15)); grd.addColorStop(0.5, c); grd.addColorStop(1, shade(c, -0.35));
      g.beginPath(); g.moveTo(p[0] - rx, p[1]); g.lineTo(p[0], p[1] - h); g.lineTo(p[0] + rx, p[1]);
      g.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI, false); g.closePath();
      g.fillStyle = grd; g.fill(); g.strokeStyle = EDGE; g.lineWidth = 0.6; g.stroke();
    }
    function dome(cx, cy, z, r, c) {
      var p = P(cx, cy, z), rx = r * 45;
      var grd = g.createRadialGradient(p[0] - rx * 0.35, p[1] - rx * 0.6, rx * 0.1, p[0], p[1] - rx * 0.3, rx * 1.1);
      grd.addColorStop(0, shade(c, 0.35)); grd.addColorStop(1, shade(c, -0.3));
      g.beginPath(); g.ellipse(p[0], p[1], rx, rx * 0.95, 0, Math.PI, 0, false);
      g.ellipse(p[0], p[1], rx, rx * 0.5, 0, 0, Math.PI, false);
      g.closePath(); g.fillStyle = grd; g.fill(); g.strokeStyle = EDGE; g.lineWidth = 0.6; g.stroke();
      return [p[0], p[1] - rx * 0.95];
    }
    function flag(px, py, h, col) {
      g.strokeStyle = '#4a3a2a'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - h); g.stroke();
      g.fillStyle = col; g.beginPath(); g.moveTo(px, py - h); g.lineTo(px + 11, py - h + 3); g.lineTo(px, py - h + 7); g.closePath(); g.fill();
    }
    function shadowD(x0, y0, x1, y1) { poly([P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0)], 'rgba(0,0,0,0.2)'); }
    function line(a, b, col, lw) { g.strokeStyle = col; g.lineWidth = lw || 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    return { P: P, poly: poly, box: box, wbox: wbox, hip: hip, gableX: gableX, gableY: gableY, cyl: cyl, cone: cone, dome: dome, flag: flag, shadowD: shadowD, line: line, g: g };
  }

  var HEAD = { cetate: 128, turn: 120, manastire: 110, moara: 92, casa: 62, cazarma: 74, grajd: 74, poligon: 62, fierarie: 92, joagar: 56, mina: 56, ogor: 6 };

  var bakedB = {};
  function bldSprite(t, civ) {
    var key = 'b_' + t + '_' + civ, B = G.BAKED && G.BAKED[key];
    if (B) {
      var o = bakedB[key];
      if (!o) { var img = new Image(); img.src = 'assets/' + key + '.png'; o = bakedB[key] = { c: img, w: B.W / B.k, h: B.H / B.k, ax: B.ax / B.k, ay: B.ay / B.k, hub: B.hub, chimney: B.chimney, baked: 1 }; }
      if (o.c.complete && o.c.naturalWidth) return o;
    }
    return G.Spr.bld(t, civ);
  }
  R.bakedBldReady = function () { return !G.BAKED || Object.keys(G.BAKED).filter(function (k) { return k.indexOf('b_') === 0; }).every(function (k) { var o = bakedB[k]; return o && o.c.complete && o.c.naturalWidth; }); };
  R.preloadBld = function () { Object.keys(G.BLDS).forEach(function (t) { bldSprite(t, 'mol'); bldSprite(t, 'oto'); }); };
  function bldSpriteOld(t, civ) {
    var key = t + '_' + civ;
    if (spr[key]) return spr[key];
    var n = G.BLDS[t].n, head = HEAD[t] || 64;
    var w = n * 64 + 24, h = n * 32 + head + 10;
    var s = mk(w, h), I = iso(s.g, w / 2, head), P = I.P, pal = PAL[civ], team = G.CIVS[civ].color, g = s.g;
    s.ax = w / 2; s.ay = head;
    if (t !== 'ogor') I.shadowD(0.12, 0.12, n - 0.05, n - 0.05);
    var st = pal.stone;
    switch (t) {
      case 'casa':
        I.box(0.35, 0.4, 1.65, 1.6, 0, 19, null, pal.wall, shade(pal.wall, -0.2));
        I.box(0.35, 0.4, 1.65, 1.6, 0, 3.5, null, shade(pal.wood, -0.1), shade(pal.wood, -0.3));
        I.poly([P(0.85, 1.6, 0), P(1.15, 1.6, 0), P(1.15, 1.6, 12), P(0.85, 1.6, 12)], '#5a3a22');
        I.poly([P(1.65, 0.75, 8), P(1.65, 1.05, 8), P(1.65, 1.05, 14), P(1.65, 0.75, 14)], civ === 'mol' ? '#3d6fb0' : '#6b4a2a');
        if (civ === 'mol') I.hip(0.2, 0.25, 1.8, 1.75, 19, 22, pal.roof);
        else I.hip(0.28, 0.33, 1.72, 1.67, 19, 10, pal.roof);
        break;
      case 'cetate': {
        var HW = 24;
        I.poly([P(0.3, 0.3), P(3.7, 0.3), P(3.7, 3.7), P(0.3, 3.7)], '#ab9c78');
        var tower = function (cx, cy) {
          I.cyl(cx, cy, 0, 0.42, 42, st);
          if (civ === 'mol') I.cone(cx, cy, 42, 0.52, 28, pal.red);
          else { var top = I.dome(cx, cy, 42, 0.44, pal.dome); I.line(top, [top[0], top[1] - 9], '#c9a43a', 1.4); }
          var w0 = P(cx + 0.3, cy + 0.3, 26); I.poly([[w0[0] - 1.2, w0[1]], [w0[0] + 1.2, w0[1]], [w0[0] + 1.2, w0[1] + 6], [w0[0] - 1.2, w0[1] + 6]], '#2d2318');
        };
        tower(0.45, 0.45);
        I.wbox(0.3, 0.3, 3.7, 0.62, 0, HW, st);
        I.wbox(0.3, 0.62, 0.62, 3.7, 0, HW, st);
        tower(3.55, 0.45); tower(0.45, 3.55);
        I.box(1.25, 1.25, 2.75, 2.75, 0, 48, null, shade(st, 0.06), shade(st, -0.2));
        [[1.6, 2.75], [2.3, 2.75]].forEach(function (q) { var a = P(q[0], q[1], 30); I.poly([[a[0] - 2, a[1]], [a[0] + 2, a[1] + 1], [a[0] + 2, a[1] + 8], [a[0] - 2, a[1] + 7]], '#2d2318'); });
        if (civ === 'mol') {
          I.hip(1.1, 1.1, 2.9, 2.9, 48, 32, pal.red);
          var ap = P(2, 2, 80); I.flag(ap[0], ap[1], 16, team);
        } else {
          var top2 = I.dome(2, 2, 48, 0.8, pal.dome);
          I.line(top2, [top2[0], top2[1] - 10], '#c9a43a', 1.6);
          I.cyl(2.95, 1.05, 0, 0.13, 74, '#f3eee2'); I.cyl(2.95, 1.05, 52, 0.19, 3, '#e6e0d0'); I.cone(2.95, 1.05, 74, 0.15, 18, pal.dome);
          var fp = P(2, 2, 48); I.flag(fp[0] - 22, fp[1] + 8, 20, team);
        }
        I.wbox(0.62, 3.38, 3.38, 3.7, 0, HW, st);
        I.wbox(3.38, 0.62, 3.7, 3.38, 0, HW, st);
        for (var ci = 0.7; ci < 3.3; ci += 0.34) { I.wbox(ci, 3.38, ci + 0.17, 3.7, HW, 5, st); I.wbox(3.38, ci, 3.7, ci + 0.17, HW, 5, st); }
        I.poly([P(1.7, 3.7, 0), P(2.3, 3.7, 0), P(2.3, 3.7, 14), P(2.0, 3.7, 19), P(1.7, 3.7, 14)], '#3a2a1c');
        tower(3.55, 3.55);
        break;
      }
      case 'turn':
        I.cyl(1, 1, 0, 0.56, 58, st);
        I.cyl(1, 1, 58, 0.64, 7, shade(st, 0.05));
        [[1.4, 1.4, 36], [1.4, 1.4, 18]].forEach(function (q) { var a = P(q[0], q[1], q[2]); I.poly([[a[0] - 1.2, a[1]], [a[0] + 1.2, a[1]], [a[0] + 1.2, a[1] + 6], [a[0] - 1.2, a[1] + 6]], '#2d2318'); });
        if (civ === 'mol') I.cone(1, 1, 65, 0.68, 32, pal.red); else I.cone(1, 1, 65, 0.62, 38, pal.dome);
        var tp = P(1, 1, civ === 'mol' ? 97 : 103); I.flag(tp[0], tp[1], 14, team);
        break;
      case 'joagar':
        I.wbox(0.85, 0.35, 1.7, 0.55, 0, 17, pal.wood);
        I.wbox(1.5, 0.55, 1.7, 1.25, 0, 17, pal.wood);
        [[0.9, 1.15], [1.5, 1.15]].forEach(function (q) { I.wbox(q[0], q[1], q[0] + 0.1, q[1] + 0.1, 0, 17, shade(pal.wood, -0.1)); });
        I.gableX(0.75, 0.28, 1.8, 1.32, 17, 11, shade(pal.roof, 0.05), shade(pal.wood, -0.15));
        for (var li = 0; li < 3; li++) for (var lj = 0; lj < 3 - li; lj++) {
          var a0 = P(0.3 + lj * 0.0, 1.3 + lj * 0.17 + li * 0.08, 3 + li * 4.5), a1 = P(1.25, 1.3 + lj * 0.17 + li * 0.08, 3 + li * 4.5);
          I.line(a0, a1, '#7a5130', 4.2); g.fillStyle = '#c99a62'; g.beginPath(); g.ellipse(a0[0], a0[1], 1.9, 2.1, 0, 0, 6.3); g.fill();
        }
        break;
      case 'mina':
        I.box(0.95, 0.35, 1.7, 1.05, 0, 15, null, pal.wood, shade(pal.wood, -0.25));
        I.gableY(0.88, 0.28, 1.77, 1.12, 15, 11, pal.roof, shade(pal.wood, 0.1));
        I.box(0.35, 1.2, 0.85, 1.55, 3, 6, '#5a4a3a', '#6b5038', '#4f3a28');
        [[0.45, 1.6], [0.8, 1.6]].forEach(function (q) { var a = P(q[0], q[1], 2.5); g.fillStyle = '#2b2018'; g.beginPath(); g.ellipse(a[0], a[1], 2.6, 2.6, 0, 0, 6.3); g.fill(); });
        var op = P(1.35, 1.5, 0); g.fillStyle = '#857a6a'; g.beginPath(); g.ellipse(op[0], op[1] - 3, 12, 6, 0, Math.PI, 0); g.fill();
        for (var oi = 0; oi < 7; oi++) { g.fillStyle = oi % 2 ? '#e2c04a' : '#b9b3a8'; g.fillRect(op[0] - 9 + oi * 2.7, op[1] - 5 - (oi % 3) * 1.5, 2.2, 1.8); }
        break;
      case 'moara':
        I.box(0.55, 0.55, 1.45, 1.45, 0, 36, null, civ === 'mol' ? pal.wood : pal.wall, shade(civ === 'mol' ? pal.wood : pal.wall, -0.25));
        I.poly([P(0.85, 1.45, 0), P(1.1, 1.45, 0), P(1.1, 1.45, 11), P(0.85, 1.45, 11)], '#3a2818');
        I.hip(0.45, 0.45, 1.55, 1.55, 36, 18, pal.roof);
        s.hub = P(1.5, 1.5, 34);
        break;
      case 'ogor':
        I.poly([P(0.06, 0.06), P(2.94, 0.06), P(2.94, 2.94), P(0.06, 2.94)], '#8a6a3b', '#6e5230', 1);
        for (var fi = 0.3; fi < 2.8; fi += 0.3) I.line(P(0.15, fi), P(2.85, fi), '#73562f', 1.4);
        for (var fy = 0.3; fy < 2.8; fy += 0.3) for (var fx = 0.25; fx < 2.8; fx += 0.24) {
          var q = P(fx, fy); g.strokeStyle = (fx * 7 + fy * 3) % 1 > 0.5 ? '#a9c24a' : '#d4bf52'; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] - 0.5, q[1] - 4); g.stroke();
        }
        break;
      case 'cazarma':
        if (civ === 'mol') {
          I.box(0.4, 0.7, 2.6, 2.3, 0, 21, null, pal.wood, shade(pal.wood, -0.28));
          I.box(0.4, 0.7, 2.6, 2.3, 14, 7, null, pal.wall, shade(pal.wall, -0.22));
          I.poly([P(1.25, 2.3, 0), P(1.75, 2.3, 0), P(1.75, 2.3, 13), P(1.25, 2.3, 13)], '#3a2818');
          I.gableX(0.28, 0.58, 2.72, 2.42, 21, 19, pal.roof, shade(pal.wall, -0.15));
          for (var si = 0; si < 4; si++) { var b0 = P(2.85, 0.85 + si * 0.28, 0), b1 = P(2.85, 0.85 + si * 0.28, 24); I.line(b0, b1, '#6b4a2a', 1.3); I.poly([[b1[0] - 1.4, b1[1]], [b1[0], b1[1] - 4.5], [b1[0] + 1.4, b1[1]]], '#c8ccd2'); }
          [[0.8, 2.3], [2.2, 2.3]].forEach(function (q) { var a = P(q[0], q[1], 9); g.fillStyle = team; g.beginPath(); g.ellipse(a[0], a[1], 3.6, 3.6, 0, 0, 6.3); g.fill(); g.strokeStyle = '#d8c070'; g.lineWidth = 0.8; g.stroke(); });
        } else {
          I.box(0.5, 0.5, 2.5, 2.5, 0, 12, null, '#efe6d0', shade('#efe6d0', -0.2));
          I.hip(0.42, 0.42, 2.58, 2.58, 12, 36, '#c8352a');
          var apx = P(1.5, 1.5, 48);
          [[0.42, 2.58], [2.58, 2.58], [2.58, 0.42], [1.5, 2.58], [2.58, 1.5]].forEach(function (q) { I.line(apx, P(q[0], q[1], 12), 'rgba(255,240,220,0.7)', 1.2); });
          I.poly([P(1.3, 2.5, 0), P(1.7, 2.5, 0), P(1.7, 2.5, 10), P(1.3, 2.5, 10)], '#5a2018');
          I.flag(apx[0], apx[1], 14, '#2f7d4a');
        }
        break;
      case 'poligon':
        I.poly([P(0.1, 0.1), P(2.9, 0.1), P(2.9, 2.9), P(0.1, 2.9)], 'rgba(150,125,80,0.45)');
        I.box(0.35, 0.35, 1.45, 1.3, 0, 16, null, pal.wall, shade(pal.wall, -0.22));
        I.gableX(0.25, 0.25, 1.55, 1.4, 16, 12, pal.roof, shade(pal.wall, -0.1));
        [[2.25, 2.3], [2.5, 1.2]].forEach(function (q) {
          var a = P(q[0], q[1], 0), b = P(q[0], q[1], 12);
          I.line(a, [b[0], b[1]], '#6b4a2a', 1.4);
          [[6, '#f0ead8'], [4.3, '#c0392b'], [2.6, '#f0ead8'], [1.1, '#c0392b']].forEach(function (r) { g.fillStyle = r[1]; g.beginPath(); g.ellipse(b[0], b[1] - 3, r[0] * 0.8, r[0], 0, 0, 6.3); g.fill(); });
        });
        for (var pi = 0.2; pi < 2.9; pi += 0.45) I.line(P(2.9, pi, 0), P(2.9, pi, 7), '#6b4a2a', 1.2);
        break;
      case 'grajd':
        I.box(0.4, 0.5, 2.6, 2.25, 0, 22, null, pal.wood, shade(pal.wood, -0.28));
        I.poly([P(1.1, 2.25, 0), P(1.9, 2.25, 0), P(1.9, 2.25, 16), P(1.1, 2.25, 16)], '#3a2818');
        I.line(P(1.1, 2.25, 0), P(1.9, 2.25, 16), '#7a5530', 1.3); I.line(P(1.9, 2.25, 0), P(1.1, 2.25, 16), '#7a5530', 1.3);
        I.gableY(0.3, 0.4, 2.7, 2.35, 22, 20, pal.roof, shade(pal.wood, 0.12));
        var hp2 = P(2.55, 2.6, 0); g.fillStyle = '#d9b44a'; g.beginPath(); g.ellipse(hp2[0], hp2[1] - 2, 10, 6, 0, Math.PI, 0); g.fill();
        g.strokeStyle = '#b8932f'; g.lineWidth = 0.7; for (var hi = -6; hi < 7; hi += 3) { g.beginPath(); g.moveTo(hp2[0] + hi, hp2[1] - 2); g.lineTo(hp2[0] + hi + 1, hp2[1] - 7); g.stroke(); }
        break;
      case 'fierarie':
        I.box(0.5, 0.6, 2.5, 2.4, 0, 20, null, shade(st, -0.05), shade(st, -0.3));
        I.poly([P(1.2, 2.4, 0), P(1.7, 2.4, 0), P(1.7, 2.4, 12), P(1.2, 2.4, 12)], '#2a1e14');
        I.hip(0.4, 0.5, 2.6, 2.5, 20, 18, pal.roof);
        I.box(1.75, 0.75, 2.1, 1.1, 18, 30, '#3a3430', '#8f8678', '#6d6559');
        s.chimney = P(1.92, 0.92, 50);
        var an = P(1.5, 2.85, 0);
        I.poly([[an[0] - 6, an[1] - 4], [an[0] + 6, an[1] - 4], [an[0] + 4, an[1] - 1], [an[0] + 2, an[1] - 1], [an[0] + 2, an[1] + 2], [an[0] - 2, an[1] + 2], [an[0] - 2, an[1] - 1], [an[0] - 4, an[1] - 1]], '#3b3d42');
        break;
      case 'manastire':
        if (civ === 'mol') {
          I.box(0.7, 1.0, 2.4, 2.0, 0, 26, null, pal.paint, shade(pal.paint, -0.25));
          I.box(0.7, 1.0, 2.4, 2.0, 19, 4, null, '#e8e0cc', '#c9c0aa');
          for (var mi = 0.95; mi < 2.3; mi += 0.35) { var a = P(mi, 2.0, 7); I.poly([[a[0] - 1.6, a[1] - 7], [a[0] + 1.6, a[1] - 6], [a[0] + 1.6, a[1] + 1], [a[0] - 1.6, a[1]]], 'rgba(240,230,200,0.55)'); }
          I.poly([P(2.4, 1.3, 0), P(2.4, 1.7, 0), P(2.4, 1.7, 13), P(2.4, 1.5, 16), P(2.4, 1.3, 13)], '#3a2416');
          I.hip(0.52, 0.82, 2.58, 2.18, 26, 22, '#4b3a30');
          I.cyl(1.55, 1.5, 40, 0.3, 18, pal.paint);
          var tt = I.dome(1.55, 1.5, 58, 0.31, '#4b3a30');
          I.line(tt, [tt[0], tt[1] - 12], '#e4c04e', 1.6); I.line([tt[0] - 4, tt[1] - 8], [tt[0] + 4, tt[1] - 8], '#e4c04e', 1.4);
        } else {
          I.box(0.6, 0.6, 2.4, 2.4, 0, 22, null, pal.paint, shade(pal.paint, -0.2));
          I.poly([P(1.25, 2.4, 0), P(1.75, 2.4, 0), P(1.75, 2.4, 12), P(1.5, 2.4, 16), P(1.25, 2.4, 12)], '#3a5a6a');
          var dt2 = I.dome(1.5, 1.5, 22, 0.86, pal.dome);
          I.line(dt2, [dt2[0], dt2[1] - 10], '#c9a43a', 1.6);
          I.cyl(2.7, 0.5, 0, 0.16, 66, '#f4efe2'); I.cyl(2.7, 0.5, 46, 0.22, 3, '#e3dccb'); I.cone(2.7, 0.5, 66, 0.18, 20, pal.dome);
        }
        break;
    }
    spr[key] = s;
    return s;
  }
  R.bldSprite = bldSprite;

  // ---------- copaci și resurse ----------
  function resSprite(t, v) {
    var key = 'r_' + t + '_' + v;
    if (spr[key]) return spr[key];
    var s, g, Rn = G.rng(700 + v * 13 + t.length * 31), ax, ay;
    if (t === 'tree') {
      s = mk(50, 82); g = s.g; ax = 25; ay = 72;
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(ax + 4, ay, 15, 6, 0, 0, 6.3); g.fill();
      if (v < 2) {
        g.fillStyle = '#5b3a1e'; g.fillRect(ax - 2.5, ay - 12, 5, 12);
        var base = v ? '#2f6230' : '#2b5a2b';
        for (var i = 0; i < 4; i++) {
          var y0 = ay - 8 - i * 13, wv = 19 - i * 3.6;
          g.fillStyle = shade(base, i * 0.05);
          g.beginPath(); g.moveTo(ax - wv, y0); g.lineTo(ax + wv, y0); g.lineTo(ax, y0 - 23); g.closePath(); g.fill();
          g.fillStyle = 'rgba(170,215,120,0.17)';
          g.beginPath(); g.moveTo(ax - wv, y0); g.lineTo(ax - 1, y0); g.lineTo(ax, y0 - 23); g.closePath(); g.fill();
          g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(ax - wv + 2, y0 - 1.5, wv * 2 - 4, 1.5);
        }
      } else {
        g.fillStyle = '#5e3d20'; g.fillRect(ax - 3, ay - 22, 6, 22);
        var cs = v === 2 ? ['#3f6f27', '#4f8530', '#67a03e'] : ['#4a6b25', '#5d8530', '#7aa042'];
        [[0, -36, 16], [-10, -29, 11], [10, -28, 11], [-5, -47, 11], [6, -45, 10]].forEach(function (c) {
          g.fillStyle = cs[1]; g.beginPath(); g.arc(ax + c[0], ay + c[1], c[2], 0, 6.3); g.fill();
        });
        [[3, -30, 13], [10, -25, 8]].forEach(function (c) { g.fillStyle = 'rgba(30,50,15,0.3)'; g.beginPath(); g.arc(ax + c[0], ay + c[1], c[2], 0, 6.3); g.fill(); });
        [[-5, -42, 7], [-11, -32, 5], [2, -50, 5]].forEach(function (c) { g.fillStyle = cs[2]; g.beginPath(); g.arc(ax + c[0], ay + c[1], c[2], 0, 6.3); g.fill(); });
      }
    } else if (t === 'gold' || t === 'stone') {
      s = mk(60, 42); g = s.g; ax = 30; ay = 30;
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(ax, ay, 22, 9, 0, 0, 6.3); g.fill();
      var rc = t === 'gold' ? '#8d7d5d' : '#9c9b95';
      [[-11, -2, 11], [9, -1, 12], [-1, -9, 13], [12, -10, 8], [-13, -11, 7]].forEach(function (r, i) {
        var cx = ax + r[0], cy = ay + r[1], rr = r[2];
        g.fillStyle = shade(rc, (i % 3) * 0.08 - 0.05);
        g.beginPath();
        for (var k = 0; k < 7; k++) { var a = k / 7 * Math.PI * 2, d = rr * (0.75 + Rn() * 0.3); g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.62); }
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(cx - rr * 0.3, cy - rr * 0.25, rr * 0.4, rr * 0.18, -0.3, 0, 6.3); g.fill();
      });
      for (var j = 0; j < 14; j++) {
        g.fillStyle = t === 'gold' ? (j % 2 ? '#f3d257' : '#d9aa2c') : (j % 2 ? '#d8d6cf' : '#7d7c77');
        g.beginPath(); g.ellipse(ax + (Rn() - 0.5) * 34, ay - 4 - Rn() * 14, 1.8 + Rn() * 1.2, 1.3, 0, 0, 6.3); g.fill();
      }
    } else if (t === 'berry') {
      s = mk(44, 36); g = s.g; ax = 22; ay = 29;
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(ax, ay, 15, 6, 0, 0, 6.3); g.fill();
      [[-7, -7, 8], [7, -7, 8], [0, -12, 9], [0, -5, 9]].forEach(function (c, i) { g.fillStyle = i === 2 ? '#4f8f3a' : '#3d7a30'; g.beginPath(); g.arc(ax + c[0], ay + c[1], c[2], 0, 6.3); g.fill(); });
      for (var b = 0; b < 16; b++) { g.fillStyle = b % 3 ? '#2a1236' : '#5a2a66'; g.beginPath(); g.arc(ax + (Rn() - 0.5) * 24, ay - 3 - Rn() * 15, 1.5, 0, 6.3); g.fill(); }
    }
    s.ax = ax; s.ay = ay;
    spr[key] = s;
    return s;
  }

  // ---------- oamenii ----------
  var OUTL = false;
  function outl(g) { if (OUTL) { g.lineWidth = 0.7; g.strokeStyle = 'rgba(28,18,10,0.72)'; g.stroke(); } }
  function ell(g, x, y, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.3); g.fill(); outl(g); }
  function grad(g, col, x0, x1) { var gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, shade(col, 0.2)); gr.addColorStop(1, shade(col, -0.28)); return gr; }
  function ln(g, x0, y0, x1, y1, col, lw) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function rr(g, x, y, w, h, r, col) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.fill(); outl(g);
  }
  function vilTool(u) {
    var T = u.task; if (!T) return null;
    if (T.k === 'bld') return 'hammer';
    var k = T.k === 'gat' ? T.kind : (T.k === 'ret' && T.back ? T.back.kind : null);
    return k === 'tree' ? 'axe' : (k === 'gold' || k === 'stone') ? 'pick' : k ? 'sickle' : null;
  }
  function hatFoot(g, t, civ) {
    if (civ === 'mol') {
      if (t === 'vil') { rr(g, -3.7, -24.4, 7.4, 4.6, 2, '#3e2b1d'); }
      else if (t === 'arc') { g.fillStyle = '#4f6a2a'; g.beginPath(); g.arc(0, -20.6, 3.7, Math.PI, 0); g.fill(); ln(g, -2, -23, -5.5, -27.5, '#b03030', 1.2); }
      else { g.fillStyle = '#9aa1a8'; g.beginPath(); g.arc(0, -20.4, 3.8, Math.PI, 0); g.fill(); ln(g, -4, -20.4, 4, -20.4, '#6d7379', 1); if (t === 'spr') ln(g, 0, -24, 0, -27.5, '#8a9096', 1.2); }
    } else {
      if (t === 'vil') ell(g, 0, -21.8, 3.9, 2.5, '#f0ece2');
      else if (t === 'mil') { g.fillStyle = '#f3efe4'; g.beginPath(); g.moveTo(-3.3, -21); g.lineTo(3.3, -21); g.lineTo(1.4, -31.5); g.lineTo(-2.8, -30.5); g.closePath(); g.fill(); rr(g, -3.5, -22.4, 7, 1.8, 0.6, '#c9a43a'); }
      else if (t === 'spr') rr(g, -3, -25.2, 6, 4.8, 1.5, '#b0302a');
      else { ell(g, 0, -22, 4, 2.6, '#f0ece2'); ell(g, 0, -24, 1.8, 1.4, '#b0302a'); }
    }
  }
  function drawFoot(g, u, civ, moving, working, swing) {
    var t = u.an, step = moving ? Math.sin(t * 11) : 0, team = G.CIVS[civ].color, teamD = G.CIVS[civ].dark;
    g.translate(0, moving ? -Math.abs(Math.sin(t * 11)) * 0.8 : 0);
    g.lineCap = 'round';
    ln(g, -1.3, -7, -1.3 + step * 2.4, 0, '#3a2a1e', 2.2);
    ln(g, 1.3, -7, 1.3 - step * 2.4, 0, '#3a2a1e', 2.2);
    if (u.carry && u.carry.n > 0.5) {
      var cc = { w: '#7a5130', f: '#b8433a', g: '#e6c24a', s: '#a7a59e' }[u.carry.r];
      rr(g, -7.5, -16, 4.5, 6, 1.5, cc);
      if (u.carry.r === 'w') { ln(g, -7.5, -14, -3, -14, '#5a3a20', 0.6); ln(g, -7.5, -12, -3, -12, '#5a3a20', 0.6); }
    }
    var tunic = u.t === 'vil' ? (civ === 'mol' ? '#ece6d6' : '#d9c9a2') : team;
    rr(g, -4, -16.5, 8, 10.5, 2.6, grad(g, tunic, -4, 4));
    if (u.t === 'vil') rr(g, -4, -10.6, 8, 1.8, 0.5, team);
    else { rr(g, -4, -10.6, 8, 1.4, 0.5, teamD); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(-4, -16.5, 2.2, 10.5); }
    ell(g, 0, -19.4, 3.3, 3.3, SKIN);
    hatFoot(g, u.t, civ);
    g.save(); g.translate(2.4, -13.4);
    if (u.t === 'vil') {
      var tool = vilTool(u);
      if (!tool || (!working && u.task && u.task.k !== 'bld' && !moving)) { ln(g, 0, 0, 1.6, 5.5, SKIN, 1.8); }
      else {
        g.rotate(working ? -0.9 + Math.sin(t * 9) * 0.9 : 0.7);
        ln(g, 0, 0, 4, 0, SKIN, 1.8);
        if (tool === 'sickle') { g.strokeStyle = '#c9cdd2'; g.lineWidth = 1.2; g.beginPath(); g.arc(7, -1, 3.2, -1.2, 1.6); g.stroke(); ln(g, 3, 0, 5, 0, '#6b4a2a', 1.4); }
        else {
          ln(g, 2, 0, 10.5, 0, '#6b4a2a', 1.4);
          if (tool === 'axe') { g.fillStyle = '#b9bec4'; g.beginPath(); g.moveTo(9, -0.5); g.lineTo(12, -3); g.lineTo(12.5, 1.8); g.lineTo(9, 1); g.fill(); }
          else if (tool === 'pick') ln(g, 9.2, -3.2, 11.2, 3.2, '#9aa0a6', 1.6);
          else rr(g, 9, -2, 3, 4, 0.5, '#4a4a4a');
        }
      }
    } else if (u.t === 'mil') {
      g.rotate(swing > 0 ? -1.7 + swing * 2.7 : 0.25);
      ln(g, 0, 0, 4, 0, SKIN, 1.8); ln(g, 3, 0, 13, 0, '#dde1e6', 1.7); ln(g, 3.5, -1.8, 3.5, 1.8, '#a07a2a', 1.2);
    } else if (u.t === 'spr') {
      var th = swing > 0 ? Math.sin(swing * Math.PI) * 4 : 0;
      g.rotate(-0.4);
      ln(g, -7 + th, 0, 14 + th, 0, '#7a5a34', 1.4);
      g.fillStyle = '#c8ccd2'; g.beginPath(); g.moveTo(14 + th, -1.5); g.lineTo(18.5 + th, 0); g.lineTo(14 + th, 1.5); g.fill();
    } else if (u.t === 'arc') {
      var pull = swing > 0 ? Math.sin(swing * Math.PI) * 3 : 0;
      g.strokeStyle = '#6b4423'; g.lineWidth = 1.6; g.beginPath(); g.arc(1.5, 0, 7, -1.15, 1.15); g.stroke();
      var e1x = 1.5 + Math.cos(-1.15) * 7, e1y = Math.sin(-1.15) * 7, e2y = Math.sin(1.15) * 7;
      g.strokeStyle = '#ddd'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(e1x, e1y); g.lineTo(e1x - 2 - pull, 0); g.lineTo(e1x, e2y); g.stroke();
      if (swing > 0) ln(g, e1x - 2 - pull, 0, e1x + 7, 0, '#8a6a40', 0.9);
    }
    g.restore();
    if (u.t === 'mil' || u.t === 'spr') { ell(g, -0.5, -11.5, 3.6, 3.9, teamD); g.strokeStyle = '#d8c070'; g.lineWidth = 0.8; g.stroke(); }
  }
  function drawCav(g, u, civ, moving, swing) {
    var t = u.an, gal = t * 12, team = G.CIVS[civ].color, hero = u.t === 'hero';
    var horse = hero ? (civ === 'mol' ? '#efebe2' : '#4a3426') : u.t === 'kni' ? '#3b2a1e' : '#8a5a33';
    g.translate(0, moving ? -Math.abs(Math.sin(gal)) * 1.2 : 0);
    g.lineCap = 'round';
    var lx = [-6.5, -4, 4, 6.5], ph = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];
    for (var i = 0; i < 4; i++) { var sw = moving ? Math.sin(gal + ph[i]) * 2.6 : 0; ln(g, lx[i], -7.5, lx[i] + sw, 0, shade(horse, -0.35), 2); }
    ln(g, -9, -11, -12.5, -5, shade(horse, -0.4), 2.2);
    var hb = g.createRadialGradient(-3, -13, 1, 0, -10.8, 10); hb.addColorStop(0, shade(horse, 0.25)); hb.addColorStop(1, shade(horse, -0.3));
    ell(g, 0, -10.8, 9.6, 4.6, hb);
    if (u.t === 'kni' || hero) {
      g.fillStyle = team; g.beginPath(); g.moveTo(-8.5, -11.5); g.lineTo(8.5, -11.5); g.lineTo(7.5, -6); g.lineTo(-7.5, -6); g.closePath(); g.fill();
      ln(g, -7.5, -6.2, 7.5, -6.2, '#e0c060', 0.9);
    }
    g.fillStyle = horse; g.beginPath(); g.moveTo(5, -12.5); g.lineTo(9.2, -19.5); g.lineTo(12.2, -18.4); g.lineTo(9.4, -11); g.closePath(); g.fill();
    g.save(); g.translate(12.6, -17.6); g.rotate(0.45); ell(g, 0, 0, 3.8, 2.1, horse); g.restore();
    ln(g, 9.6, -19.6, 10.4, -22, shade(horse, -0.3), 1.2);
    if (hero) {
      g.fillStyle = civ === 'mol' ? '#a32222' : '#2f7d4a';
      g.beginPath(); g.moveTo(-2.5, -24); g.lineTo(-11, -13.5 + (moving ? Math.sin(gal) : 0)); g.lineTo(-5.5, -12.5); g.lineTo(1, -18); g.closePath(); g.fill();
    }
    ln(g, 0, -15.5, 1.5, -9.5, '#3a2a1e', 2);
    rr(g, -3.4, -23.6, 6.8, 9.5, 2.4, grad(g, hero && civ === 'mol' ? '#8a1e1e' : team, -3.4, 3.4));
    ell(g, 0, -26.6, 3.1, 3.1, SKIN);
    if (civ === 'mol') {
      if (hero) { g.fillStyle = '#e8c242'; g.beginPath(); g.moveTo(-3.4, -28); g.lineTo(-3.6, -32.5); g.lineTo(-1.8, -30); g.lineTo(0, -33.5); g.lineTo(1.8, -30); g.lineTo(3.6, -32.5); g.lineTo(3.4, -28); g.closePath(); g.fill(); }
      else if (u.t === 'kni') { g.fillStyle = '#9aa1a8'; g.beginPath(); g.arc(0, -27.4, 3.7, Math.PI, 0); g.fill(); ln(g, 0, -31, -3, -35, G.CIVS.mol.light, 1.8); }
      else rr(g, -3.6, -31.6, 7.2, 4.6, 2, '#3e2b1d');
    } else {
      if (hero) { ell(g, 0, -30, 5.2, 3.7, '#f4f1ea'); ell(g, 0, -31.5, 1.8, 1.8, '#b0302a'); ln(g, 0, -33, 2, -38, '#f4f1ea', 1.3); }
      else if (u.t === 'kni') { ell(g, 0, -28.8, 4.2, 2.4, '#f0ece2'); g.fillStyle = '#9aa1a8'; g.beginPath(); g.arc(0, -29.5, 3, Math.PI, 0); g.fill(); ln(g, 0, -32.5, 0, -35.5, '#9aa1a8', 1.1); }
      else { rr(g, -3, -32, 6, 4.6, 1.5, '#b0302a'); ln(g, -3, -28.6, 3, -28.6, '#f0ece2', 1.3); }
    }
    g.save(); g.translate(2.2, -21);
    if (u.t === 'kni') {
      var th = swing > 0 ? Math.sin(swing * Math.PI) * 4 : 0;
      g.rotate(-0.32); ln(g, -4 + th, 0, 19 + th, 0, '#7a5a34', 1.6);
      g.fillStyle = '#c8ccd2'; g.beginPath(); g.moveTo(19 + th, -1.4); g.lineTo(23 + th, 0); g.lineTo(19 + th, 1.4); g.fill();
    } else {
      g.rotate(swing > 0 ? -1.8 + swing * 2.8 : 0.3);
      ln(g, 0, 0, 3.5, 0, SKIN, 1.8); ln(g, 3, 0, 13, hero ? 0 : 1, '#e1e5ea', 1.7);
      ln(g, 3.5, -1.8, 3.5, 1.8, hero ? '#e8c242' : '#a07a2a', 1.3);
    }
    g.restore();
  }
  function drawSiege(g, u, civ, swing) {
    var team = G.CIVS[civ].color;
    if (u.t === 'ram') {
      var push = swing > 0 ? Math.sin(swing * Math.PI) * 4 : 0;
      rr(g, 7 + push, -11, 11, 3.6, 1.5, '#6b4a2a'); rr(g, 16 + push, -11.6, 3.5, 4.8, 1, '#6d6d6d');
      g.fillStyle = '#7a5530'; g.fillRect(-11, -13, 22, 7);
      g.fillStyle = '#5e3f22'; g.beginPath(); g.moveTo(-12.5, -13); g.lineTo(12.5, -13); g.lineTo(6, -22); g.lineTo(-6, -22); g.closePath(); g.fill();
      ln(g, -10, -15.5, 10, -15.5, team, 1.8);
      [-7, 7].forEach(function (x) { ell(g, x, -3.5, 3.4, 3.4, '#4a3320'); ln(g, x - 2.4, -3.5, x + 2.4, -3.5, '#8a6a40', 0.8); ln(g, x, -5.9, x, -1.1, '#8a6a40', 0.8); });
    } else {
      g.fillStyle = '#6b4a2a'; g.beginPath(); g.moveTo(-12, -4); g.lineTo(5, -4); g.lineTo(7, -8); g.lineTo(-10, -9.5); g.closePath(); g.fill();
      ln(g, -11, -6, 4, -6, team, 1.4);
      g.save(); g.translate(1, -10); g.rotate(-0.2 - (swing > 0 ? Math.sin(swing * Math.PI) * 0.08 : 0));
      rr(g, -7, -2.8, 21, 5.6, 2.6, '#3c3f44'); rr(g, 12, -3.3, 2.5, 6.6, 1, '#2a2c30'); g.restore();
      ell(g, -2.5, -4.5, 4.8, 4.8, '#4a3320'); ell(g, -2.5, -4.5, 1.4, 1.4, '#8a6a40');
    }
  }
  function drawUnitAt(g, u, civ, sx, sy, k) {
    var d = G.UNITS[u.t], moving = u.mv > 0, working = u.wk > 0, swing = u.sw > 0 ? 1 - u.sw / 0.4 : 0;
    g.save(); g.translate(sx, sy); g.scale(k, k);
    ell(g, 0, 0, d.cls === 'cav' ? 10.5 : d.cls === 'sie' ? 13 : 6.2, d.cls === 'cav' ? 3.8 : d.cls === 'sie' ? 4.4 : 2.6, 'rgba(0,0,0,0.26)');
    g.scale(u.face || 1, 1);
    OUTL = true;
    if (d.cls === 'cav') drawCav(g, u, civ, moving, swing);
    else if (d.cls === 'sie') drawSiege(g, u, civ, swing);
    else drawFoot(g, u, civ, moving, working, swing);
    OUTL = false;
    g.restore();
  }
  function drawSheep(g, e, sx, sy, k) {
    g.save(); g.translate(sx, sy); g.scale(k * (e.id % 2 ? 1 : -1), k);
    ell(g, 0, 0, 7, 2.6, 'rgba(0,0,0,0.22)');
    g.lineCap = 'round';
    [-3, -1, 2, 4].forEach(function (x) { ln(g, x, -3, x, 0, '#3b3530', 1.4); });
    ell(g, 0, -5.5, 5.8, 3.8, '#f2f0ea');
    ell(g, -2.5, -7.5, 2.6, 2, '#ffffff'); ell(g, 1.5, -8, 2.6, 2, '#fbfaf6');
    var bob = Math.sin(clock * 1.4 + e.id) * 0.9;
    ell(g, 5.6, -6.3 + bob, 2.3, 1.7, '#2d2a28');
    g.restore();
  }

  // ---------- un cadru ----------
  var ghostAlpha = 0.55;
  R.frame = function (dt) {
    var S = G.S; if (!S) return;
    clock += dt;
    var C = G.C, N = S.N, z = cam.z, sel = G.UI ? G.UI.selSet() : {};
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#14120e'; ctx.fillRect(0, 0, W, H);
    var c0 = R.s2w(0, 0), c1 = R.s2w(W, 0), c2 = R.s2w(0, H), c3 = R.s2w(W, H);
    var minX = Math.max(0, Math.floor(Math.min(c0[0], c2[0])) - 2), maxX = Math.min(N - 1, Math.ceil(Math.max(c1[0], c3[0])) + 3);
    var minY = Math.max(0, Math.floor(Math.min(c0[1], c1[1])) - 2), maxY = Math.min(N - 1, Math.ceil(Math.max(c2[1], c3[1])) + 3);
    var tw = 64 * z, th = 32 * z, ox = W / 2 - (cam.x - cam.y) * 32 * z, oy = H / 2 - (cam.x + cam.y) * 16 * z;
    var exp = S.exp, vis = C.vis, ter = S.ter;
    var x, y, k, sx, sy;
    // teren (calculat pe bucăți) și apa vie
    G.Terrain.draw(ctx, cam, W, H, DPR);
    G.Terrain.water(ctx, cam, W, H, clock);
    if (clock - lastFogT > 0.2 || lastFogT > clock) { G.Terrain.fogUpdate(); lastFogT = clock; }

    // obiecte vizibile
    var list = [], ground = [];
    var ents = S.ents;
    for (var i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.dead || e.x < minX - 3 || e.x > maxX + 4 || e.y < minY - 3 || e.y > maxY + 4) continue;
      var ek = Math.floor(e.y) * N + Math.floor(e.x);
      if (!exp[ek]) continue;
      if (e.k === 'u' && e.o !== 0 && !vis[ek]) continue;
      if (e.k === 'b' && G.BLDS[e.t].walk) { ground.push(e); continue; }
      list.push(e);
    }
    // pe sol: ogoare, ruine, morți, cioturi
    ground.forEach(function (b) { drawBld(b, sel[b.id]); });
    S.fx.forEach(function (f) {
      var p = R.w2s(f.x, f.y), age = S.t - f.t;
      if (p[0] < -80 || p[0] > W + 80 || p[1] < -80 || p[1] > H + 80) return;
      if (!exp[Math.floor(f.y) * N + Math.floor(f.x)]) return;
      if (f.k === 'corpse') {
        ctx.globalAlpha = Math.max(0, Math.min(1, (14 - age) / 4));
        var csh = bakedSheet(f.ut + '_' + S.players[f.o].civ);
        if (csh) { var dA = csh.B.actions.die; bakedFrame(ctx, csh, 'die', Math.min(dA.frames - 1, Math.floor(age / 0.14)), f.d8 || 0, p[0], p[1], z * USCALE / csh.B.k); ctx.globalAlpha = 1; return; }
        var cav = G.UNITS[f.ut].cls === 'cav';
        if (cav) ell(ctx, p[0], p[1] - 3 * z, 10 * z, 3.6 * z, '#5a3d28');
        ell(ctx, p[0] + (f.face || 1) * 2 * z, p[1] - (cav ? 6 : 2) * z, 6.5 * z, 2.4 * z, G.UNITS[f.ut].cls === 'vil' ? '#d8cfbd' : G.CIVS[S.players[f.o].civ].color);
        ell(ctx, p[0] - (f.face || 1) * 5 * z, p[1] - (cav ? 6 : 2) * z, 2.4 * z, 2.2 * z, SKIN);
        ctx.globalAlpha = 1;
      } else if (f.k === 'rubble') {
        ctx.globalAlpha = Math.max(0, 1 - age / 30);
        var n = f.n, hw = n * 32 * z * 0.85, hh = n * 16 * z * 0.85;
        ctx.fillStyle = '#5c544a'; ctx.beginPath(); ctx.moveTo(p[0], p[1] - hh); ctx.lineTo(p[0] + hw, p[1]); ctx.lineTo(p[0], p[1] + hh); ctx.lineTo(p[0] - hw, p[1]); ctx.closePath(); ctx.fill();
        var Rn = G.rng(Math.floor(f.x * 31 + f.y * 17));
        for (var q = 0; q < 6 + n * 3; q++) ell(ctx, p[0] + (Rn() - 0.5) * hw * 1.4, p[1] + (Rn() - 0.5) * hh * 1.2, (2 + Rn() * 3) * z, (1.5 + Rn() * 2) * z, Rn() < 0.5 ? '#8a8174' : '#3a3028');
        ctx.globalAlpha = 1;
      } else if (f.k === 'stump') {
        ell(ctx, p[0], p[1] - 1 * z, 3.5 * z, 2 * z, '#6b4a2a'); ell(ctx, p[0], p[1] - 1.8 * z, 2.6 * z, 1.3 * z, '#c99a62');
      }
    });
    // marcaje de comandă
    R.marks = R.marks.filter(function (m) { return clock - m.t < 0.7; });
    R.marks.forEach(function (m) {
      var p = R.w2s(m.x, m.y), a = (clock - m.t) / 0.7;
      ctx.strokeStyle = m.c || 'rgba(120,255,120,0.9)'; ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.ellipse(p[0], p[1], (14 - a * 8) * z, (7 - a * 4) * z, 0, 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1;
    });

    list.sort(function (a, b) {
      var da = a.k === 'b' ? a.tx + a.ty + a.n : a.x + a.y, db = b.k === 'b' ? b.tx + b.ty + b.n : b.x + b.y;
      return da - db;
    });
    for (var j = 0; j < list.length; j++) {
      var o = list[j];
      if (o.k === 'r') drawRes(o);
      else if (o.k === 'b') drawBld(o, sel[o.id]);
      else drawUnit(o, sel[o.id]);
    }
    // oamenii ascunși după copaci și clădiri rămân vizibili ca siluete străvezii, ca în AoE
    ctx.globalAlpha = 0.34;
    for (var jg = 0; jg < list.length; jg++) { var og = list[jg]; if (og.k === 'u') ghostUnit(og); }
    ctx.globalAlpha = 1;

    // proiectile
    S.proj.forEach(function (p) {
      var px = p.sx + (p.tx - p.sx) * p.p, py = p.sy + (p.ty - p.sy) * p.p;
      if (!vis[Math.floor(py) * N + Math.floor(px)]) return;
      var hgt = ((p.h0 || 0.8) * 22 * (1 - p.p) + 30 * 4 * p.p * (1 - p.p) + 8) * z;
      var a = R.w2s(px, py), p2 = Math.min(1, p.p + 0.03);
      var b = R.w2s(p.sx + (p.tx - p.sx) * p2, p.sy + (p.ty - p.sy) * p2), hgt2 = ((p.h0 || 0.8) * 22 * (1 - p2) + 30 * 4 * p2 * (1 - p2) + 8) * z;
      if (p.k === 'ball') { ell(ctx, a[0], a[1] - hgt, 2.4 * z, 2.4 * z, '#1d1d1f'); return; }
      var dx = b[0] - a[0], dy = (b[1] - hgt2) - (a[1] - hgt), dl = Math.sqrt(dx * dx + dy * dy) || 1;
      ln(ctx, a[0] - dx / dl * 4 * z, a[1] - hgt - dy / dl * 4 * z, a[0] + dx / dl * 4 * z, a[1] - hgt + dy / dl * 4 * z, '#3a2a18', 1.2 * z);
    });
    // efecte în aer
    S.fx.forEach(function (f) {
      var age = S.t - f.t;
      if (f.k !== 'dust' && f.k !== 'boom' && f.k !== 'smoke') return;
      if (!vis[Math.floor(f.y) * N + Math.floor(f.x)]) return;
      var p = R.w2s(f.x, f.y);
      if (f.k === 'dust') { ctx.globalAlpha = Math.max(0, 0.6 - age * 0.4); ell(ctx, p[0], p[1], (f.n * 22 + age * 30) * z, (f.n * 11 + age * 15) * z, '#d8c8a0'); }
      else if (f.k === 'boom') { ctx.globalAlpha = Math.max(0, 1 - age / 0.8); ell(ctx, p[0], p[1] - 6 * z, (6 + age * 20) * z, (4 + age * 12) * z, age < 0.25 ? '#ffb030' : '#6a625a'); }
      else { ctx.globalAlpha = Math.max(0, 0.7 - age * 0.6); ell(ctx, p[0] + age * 8 * z, p[1] - (14 + age * 16) * z, (5 + age * 8) * z, (4 + age * 6) * z, '#b8b2a8'); }
      ctx.globalAlpha = 1;
    });

    // umbre de nori, apoi ceața cu margini moi
    G.Terrain.clouds(ctx, cam, W, H, clock);
    G.Terrain.fogDraw(ctx, cam, W, H, DPR);
    // margini în afara hărții
    drawEdge(ox, oy, z, N);
    G.Terrain.vignette(ctx, W, H);

    // clădirea de pus
    var pl = G.UI && G.UI.place;
    if (pl && pl.tx !== undefined) {
      var d = G.BLDS[pl.t], ok = G.canPlace(0, pl.t, pl.tx, pl.ty);
      for (var py2 = pl.ty; py2 < pl.ty + d.n; py2++) for (var px2 = pl.tx; px2 < pl.tx + d.n; px2++) {
        var tp = R.w2s(px2, py2);
        ctx.fillStyle = ok ? 'rgba(90,230,110,0.35)' : 'rgba(240,70,60,0.4)';
        ctx.beginPath(); ctx.moveTo(tp[0], tp[1]); ctx.lineTo(tp[0] + 32 * z, tp[1] + 16 * z); ctx.lineTo(tp[0], tp[1] + 32 * z); ctx.lineTo(tp[0] - 32 * z, tp[1] + 16 * z); ctx.closePath(); ctx.fill();
      }
      var s2 = bldSprite(pl.t, 'mol'), top = R.w2s(pl.tx, pl.ty);
      ctx.globalAlpha = ghostAlpha;
      ctx.drawImage(s2.c, top[0] - s2.ax * z, top[1] - s2.ay * z, s2.w * z, s2.h * z);
      ctx.globalAlpha = 1;
    }
    // punctul de adunare
    if (G.UI) {
      var one = G.UI.selOne();
      if (one && one.k === 'b' && one.o === 0 && one.rally) {
        var a1 = R.w2s(one.x, one.y), a2 = R.w2s(one.rally.x, one.rally.y);
        ctx.setLineDash([4, 4]); ln(ctx, a1[0], a1[1], a2[0], a2[1], 'rgba(255,255,255,0.6)', 1.2); ctx.setLineDash([]);
        ln(ctx, a2[0], a2[1], a2[0], a2[1] - 18 * z, '#4a3a2a', 1.5);
        ctx.fillStyle = G.CIVS.mol.color; ctx.beginPath(); ctx.moveTo(a2[0], a2[1] - 18 * z); ctx.lineTo(a2[0] + 10 * z, a2[1] - 15 * z); ctx.lineTo(a2[0], a2[1] - 11 * z); ctx.fill();
      }
    }
    // dreptunghiul de selecție
    var bx = G.Input && G.Input.box;
    if (bx) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
      var rx = Math.min(bx.x0, bx.x1), ry = Math.min(bx.y0, bx.y1), rw = Math.abs(bx.x1 - bx.x0), rh = Math.abs(bx.y1 - bx.y0);
      ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh);
    }
  };
  function drawEdge(ox, oy, z, N) {
    // umbrește ce e în afara hărții
    ctx.fillStyle = '#0d0c0a';
    var T = [ox, oy], Rr = [ox + N * 32 * z, oy + N * 16 * z], B = [ox, oy + N * 32 * z], L = [ox - N * 32 * z, oy + N * 16 * z];
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.moveTo(T[0], T[1]); ctx.lineTo(L[0], L[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(Rr[0], Rr[1]); ctx.closePath();
    ctx.fill('evenodd');
  }

  function hpBar(e, x, y, w) {
    var mx = G.def(e).hp, f = Math.max(0, Math.min(1, e.hp / mx));
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 4.5);
    ctx.fillStyle = f > 0.6 ? '#4cd964' : f > 0.3 ? '#f5c542' : '#ff4b3e';
    ctx.fillRect(x - w / 2, y, w * f, 2.5);
  }
  var natC = {};
  function natSprite(kind, v) {
    var key = 'n_' + kind + v, B = G.BAKED && G.BAKED[key];
    if (!B) return null;
    var o = natC[key];
    if (!o) { var img = new Image(); img.src = 'assets/' + key + '.png'; o = natC[key] = { c: img, w: B.W / B.k, h: B.H / B.k, ax: B.ax / B.k, ay: B.ay / B.k }; }
    return o.c.complete && o.c.naturalWidth ? o : null;
  }
  R.preloadNature = function () { for (var v = 0; v < 8; v++) natSprite('tree', v); ['gold', 'stone', 'berry'].forEach(function (k) { natSprite(k, 0); }); natSprite('sheep', 0); natSprite('sheep', 1); };
  function drawRes(e) {
    var p = R.w2s(e.x, e.y), z = cam.z;
    if (p[0] < -90 || p[0] > W + 90 || p[1] < -20 || p[1] > H + 140) return;
    if (e.t === 'sheep') {
      var sp = natSprite('sheep', Math.sin(clock * 0.7 + e.id * 1.7) > 0.3 ? 1 : 0);
      if (!sp) { drawSheep(ctx, e, p[0], p[1], z); return; }
      var ks = z * 1.1;
      if (e.id % 2) { ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(-1, 1); ctx.drawImage(sp.c, -sp.ax * ks, -sp.ay * ks, sp.w * ks, sp.h * ks); ctx.restore(); }
      else ctx.drawImage(sp.c, p[0] - sp.ax * ks, p[1] - sp.ay * ks, sp.w * ks, sp.h * ks);
      return;
    }
    var s, scl;
    if (e.t === 'tree') { s = natSprite('tree', (G.hash2(e.tx, e.ty, 3) * 8) | 0) || G.Spr.tree((G.hash2(e.tx, e.ty, 3) * 8) | 0); scl = 0.86 + G.hash2(e.tx, e.ty, 4) * 0.28; }
    else { s = natSprite(e.t, 0) || G.Spr.res(e.t); scl = Math.max(0.6, Math.min(1, 0.5 + e.amt / G.RESD[e.t].amt * 0.5)); }
    var k = z * scl;
    ctx.drawImage(s.c, p[0] - s.ax * k, p[1] - s.ay * k, s.w * k, s.h * k);
    if (G.UI && G.UI.selSet()[e.id]) { ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p[0], p[1], 14 * z, 7 * z, 0, 0, 6.3); ctx.stroke(); }
  }
  function drawBld(b, selected) {
    var S = G.S, z = cam.z, civ = S.players[b.o].civ, s = bldSprite(b.t, civ), top = R.w2s(b.tx, b.ty), n = b.n;
    if (selected) {
      ctx.strokeStyle = b.o === 0 ? '#ffffff' : '#ff6a5a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(top[0], top[1] - 2); ctx.lineTo(top[0] + n * 32 * z + 3, top[1] + n * 16 * z); ctx.lineTo(top[0], top[1] + n * 32 * z + 2); ctx.lineTo(top[0] - n * 32 * z - 3, top[1] + n * 16 * z); ctx.closePath(); ctx.stroke();
    }
    var dx = top[0] - s.ax * z, dy = top[1] - s.ay * z, dw = s.w * z, dh = s.h * z;
    if (b.built) ctx.drawImage(s.c, dx, dy, dw, dh);
    else {
      // fundația și clădirea care „crește”
      ctx.fillStyle = 'rgba(120,95,60,0.75)';
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(top[0] + n * 32 * z, top[1] + n * 16 * z); ctx.lineTo(top[0], top[1] + n * 32 * z); ctx.lineTo(top[0] - n * 32 * z, top[1] + n * 16 * z); ctx.closePath(); ctx.fill();
      var showH = (s.ay + n * 16) * z * Math.max(0.08, b.prog) + n * 16 * z;
      ctx.save(); ctx.beginPath(); ctx.rect(dx, dy + dh - showH, dw, showH); ctx.clip();
      ctx.globalAlpha = 0.9; ctx.drawImage(s.c, dx, dy, dw, dh); ctx.globalAlpha = 1; ctx.restore();
      ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 1.4 * z;
      [[0, 0], [n, 0], [n, n], [0, n]].forEach(function (c) {
        var p = R.w2s(b.tx + c[0], b.ty + c[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - (8 + 26 * b.prog) * z); ctx.stroke();
      });
    }
    if (b.built && b.t === 'moara' && s.hub) {
      var hx = dx + s.hub[0] * z, hy = dy + s.hub[1] * z, ang = clock * 1.4, sl = s.baked ? 30 : 22;
      for (var i = 0; i < 4; i++) {
        var a = ang + i * Math.PI / 2, ex = hx + Math.cos(a) * sl * z, ey = hy + Math.sin(a) * sl * z;
        ln(ctx, hx, hy, ex, ey, '#5a4028', 1.6 * z);
        var nx = -Math.sin(a) * 4 * z, ny = Math.cos(a) * 4 * z;
        ctx.fillStyle = 'rgba(240,232,210,0.92)'; ctx.beginPath();
        ctx.moveTo(hx + Math.cos(a) * 7 * z, hy + Math.sin(a) * 7 * z); ctx.lineTo(ex, ey); ctx.lineTo(ex + nx, ey + ny); ctx.lineTo(hx + Math.cos(a) * 7 * z + nx, hy + Math.sin(a) * 7 * z + ny); ctx.closePath(); ctx.fill();
      }
      ell(ctx, hx, hy, 2.2 * z, 2.2 * z, '#3a2a18');
    }
    if (b.built && b.t === 'fierarie' && s.chimney) {
      for (var k = 0; k < 3; k++) {
        var ph = (clock * 0.5 + k / 3) % 1, cx = dx + s.chimney[0] * z + ph * 6 * z, cy = dy + s.chimney[1] * z - ph * 22 * z;
        ctx.globalAlpha = 0.5 * (1 - ph); ell(ctx, cx, cy, (3 + ph * 5) * z, (2.5 + ph * 4) * z, '#9a958d'); ctx.globalAlpha = 1;
      }
    }
    var mx = G.BLDS[b.t].hp;
    if (b.built && b.hp < mx * 0.55 && !G.BLDS[b.t].walk) {
      var Rn = G.rng(b.id * 7), fires = b.hp < mx * 0.25 ? 3 : 1;
      for (var f = 0; f < fires; f++) {
        var fx = top[0] + (Rn() - 0.5) * n * 30 * z, fy = top[1] + (n * 16 - 18 - Rn() * 20) * z, fl = 0.75 + Math.sin(clock * 13 + f * 2) * 0.25;
        ell(ctx, fx, fy, 5 * z * fl, 8 * z * fl, 'rgba(255,120,30,0.85)'); ell(ctx, fx, fy + 2 * z, 3 * z * fl, 5 * z * fl, 'rgba(255,220,90,0.9)');
        var sp = (clock * 0.6 + f * 0.3) % 1; ctx.globalAlpha = 0.45 * (1 - sp); ell(ctx, fx + sp * 8 * z, fy - (10 + sp * 26) * z, (4 + sp * 7) * z, (3 + sp * 5) * z, '#57524c'); ctx.globalAlpha = 1;
      }
    }
    if (selected || (b.hit && G.S.t - b.hit < 3)) hpBar(b, top[0], top[1] - (s.ay - 6) * z * 0.85, 40);
    if (selected && b.q && b.q.length && b.o === 0) {
      var it = b.q[0], pr = 1 - Math.max(0, it.left) / it.tot, by = top[1] - (s.ay - 6) * z * 0.85 + 6;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(top[0] - 21, by - 1, 42, 4.5); ctx.fillStyle = '#7fb6ff'; ctx.fillRect(top[0] - 20, by, 40 * pr, 2.5);
    }
  }
  // ---------- oamenii randați 3D (assets/u_*.png) ----------
  var bakedImgs = {};
  function bakedSheet(key) {
    var B = G.BAKED && G.BAKED[key]; if (!B) return null;
    var img = bakedImgs[key];
    if (!img) { img = bakedImgs[key] = new Image(); img.src = 'assets/u_' + key + '.png'; }
    return img.complete && img.naturalWidth ? { B: B, img: img } : null;
  }
  function unitKeys() { return G.BAKED ? Object.keys(G.BAKED).filter(function (k) { return !/^[bijn]_/.test(k); }) : []; }
  R.preloadBaked = function () { unitKeys().forEach(bakedSheet); };
  R.bakedReady = function () { return unitKeys().every(function (k) { return !!bakedSheet(k); }); };
  var TOOLACT = { axe: 'axe', pick: 'pick', hammer: 'hammer', sickle: 'sickle' };
  function unitAction(u, A) {
    if (u.sw > 0) {
      var at = A.atk ? 'atk' : 'hammer', p = 1 - u.sw / 0.4;
      return [at, Math.min(A[at].frames - 1, Math.floor(p * A[at].frames))];
    }
    if (u.t === 'vil' && u.wk > 0) { var nm = TOOLACT[vilTool(u)]; if (nm && A[nm]) return [nm, Math.floor(u.an * 5.5) % A[nm].frames]; }
    if (u.mv > 0 && A.walk) return ['walk', Math.floor(u.an * G.UNITS[u.t].spd * (G.UNITS[u.t].cls === 'cav' ? 5 : 7)) % A.walk.frames];
    return ['idle', 0];
  }
  function bakedFrame(g, sh, act, frame, d8, sx, sy, scale) {
    var B = sh.B, A = B.actions[act] || B.actions.idle, d = d8 <= 4 ? d8 : 8 - d8;
    var cx = Math.min(frame, A.frames - 1) * B.W, cy = (A.row + d) * B.H, w = B.W * scale, h = B.H * scale;
    if (d8 > 4) { g.save(); g.translate(sx, sy); g.scale(-1, 1); g.drawImage(sh.img, cx, cy, B.W, B.H, -B.ax * scale, -B.ay * scale, w, h); g.restore(); }
    else g.drawImage(sh.img, cx, cy, B.W, B.H, sx - B.ax * scale, sy - B.ay * scale, w, h);
  }
  R.bakedFrame = function (g, key, act, frame, d8, sx, sy, scale) { var sh = bakedSheet(key); if (!sh) return false; bakedFrame(g, sh, act, frame, d8, sx, sy, scale); return true; };
  var USCALE = 1.1;
  function ghostUnit(u) {
    var p = R.w2s(u.x, u.y);
    if (p[0] < -40 || p[0] > W + 40 || p[1] < -10 || p[1] > H + 50) return;
    var civ = G.S.players[u.o].civ, sh = bakedSheet(u.t + '_' + civ);
    if (!sh) return;
    var ua = unitAction(u, sh.B.actions);
    bakedFrame(ctx, sh, ua[0], ua[1], u.dir8 || 0, p[0], p[1], cam.z * USCALE * (G.UNITS[u.t].hero ? 1.08 : 1) / sh.B.k);
  }
  function drawUnit(u, selected) {
    var S = G.S, z = cam.z, p = R.w2s(u.x, u.y), d = G.UNITS[u.t], civ = S.players[u.o].civ;
    if (p[0] < -40 || p[0] > W + 40 || p[1] < -10 || p[1] > H + 50) return;
    if (selected) {
      ctx.strokeStyle = u.o === 0 ? '#ffffff' : '#ff6a5a'; ctx.lineWidth = 1.5;
      var rx = (d.cls === 'cav' ? 12 : d.cls === 'sie' ? 14 : 8) * z;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, rx * 0.5, 0, 0, 6.3); ctx.stroke();
    }
    else if (G.UI && G.UI.hover === u.id) {
      ctx.strokeStyle = u.o === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,110,90,0.6)'; ctx.lineWidth = 1.2;
      var hr = (d.cls === 'cav' ? 12 : d.cls === 'sie' ? 14 : 8) * z;
      ctx.beginPath(); ctx.ellipse(p[0], p[1], hr, hr * 0.5, 0, 0, 6.3); ctx.stroke();
    }
    if (d.hero) { ctx.fillStyle = 'rgba(255,215,90,0.18)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 15 * z, 7.5 * z, 0, 0, 6.3); ctx.fill(); }
    var sh = bakedSheet(u.t + '_' + civ);
    if (sh) {
      var ua = unitAction(u, sh.B.actions);
      bakedFrame(ctx, sh, ua[0], ua[1], u.dir8 || 0, p[0], p[1], z * USCALE * (d.hero ? 1.08 : 1) / sh.B.k);
      if (u.carry && u.carry.n > 0.5) {
        var cc = { w: '#7a5130', f: '#b8433a', g: '#e6c24a', s: '#a7a59e' }[u.carry.r], bk = (u.dir8 || 0) > 4 ? 1 : -1;
        ctx.fillStyle = cc; ctx.strokeStyle = 'rgba(20,12,6,0.7)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(p[0] + bk * 3.5 * z, p[1] - 16 * z, 2.2 * z, 1.8 * z, 0, 0, 6.3); ctx.fill(); ctx.stroke();
      }
    } else drawUnitAt(ctx, u, civ, p[0], p[1], z * 1.1 * (d.hero ? 1.1 : 1));
    if (selected || (u.hit && S.t - u.hit < 2.5)) hpBar(u, p[0], p[1] - (d.cls === 'cav' ? 40 : d.cls === 'sie' ? 28 : 33) * z, d.cls === 'vil' ? 16 : 20);
  }

  R.clock = function () { return clock; };
  // ce se află sub deget: oamenii au prioritate, apoi clădirile, apoi resursele
  R.pick = function (sx, sy) {
    var S = G.S, z = cam.z, w = R.s2w(sx, sy), best = null, bs = -1e9, N = S.N, C = G.C;
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead || Math.abs(e.x - w[0]) > 6 || Math.abs(e.y - w[1]) > 6) continue;
      var k = Math.floor(e.y) * N + Math.floor(e.x);
      if (!S.exp[k]) continue;
      if (e.k === 'u' && e.o !== 0 && !C.vis[k]) continue;
      var p = R.w2s(e.x, e.y), score = -1e9;
      if (e.k === 'u') {
        var d = G.UNITS[e.t], hy = p[1] - (d.cls === 'cav' ? 17 : 12) * z, dd = Math.hypot(sx - p[0], sy - hy);
        if (dd < Math.max(18, 15 * z)) score = 3000 - dd;
      } else if (e.k === 'b') {
        var n = e.n;
        if (w[0] >= e.tx && w[0] <= e.tx + n && w[1] >= e.ty && w[1] <= e.ty + n) score = 1000 + e.tx + e.ty;
        else {
          var s = bldSprite(e.t, S.players[e.o].civ), top = R.w2s(e.tx, e.ty);
          if (sx > top[0] - n * 26 * z && sx < top[0] + n * 26 * z && sy > top[1] - (s.ay - 10) * z && sy < top[1] + n * 16 * z) score = 900 + e.tx + e.ty;
        }
        if (G.BLDS[e.t].walk && score > -1e9) score -= 600;
      } else if (e.t === 'sheep') {
        var ds = Math.hypot(sx - p[0], sy - (p[1] - 5 * z)); if (ds < Math.max(16, 11 * z)) score = 2000 - ds;
      } else if (e.t === 'tree') {
        var dx = Math.abs(sx - p[0]), dy = p[1] - sy;
        if (dx < 11 * z + 4 && dy > -6 * z && dy < 58 * z) score = 500 - dx - Math.abs(dy - 14 * z) * 0.3;
      } else {
        var dm = Math.hypot(sx - p[0], sy - (p[1] - 7 * z)); if (dm < Math.max(17, 18 * z)) score = 800 - dm;
      }
      if (score > bs) { bs = score; best = e; }
    }
    return best;
  };

  // ---------- harta mică ----------
  var mc, mctx, moff, mimg;
  R.initMini = function (canvas) {
    mc = canvas; mctx = mc.getContext('2d');
    moff = document.createElement('canvas'); moff.width = moff.height = G.N;
    mimg = moff.getContext('2d').createImageData(G.N, G.N);
  };
  R.resizeMini = function () {
    if (!mc) return;
    var d = Math.min(window.devicePixelRatio || 1, 2);
    mc.width = Math.round(mc.clientWidth * d); mc.height = Math.round(mc.clientHeight * d);
  };
  var TCOL = [[96, 140, 58], [152, 128, 88], [50, 96, 150], [88, 138, 178], [128, 98, 60]];
  var RCOL = { tree: [36, 78, 34], gold: [232, 196, 70], stone: [176, 176, 170], berry: [130, 60, 140], sheep: [240, 240, 236] };
  var TEAM = [[70, 140, 255], [235, 70, 55]];
  R.drawMini = function () {
    var S = G.S; if (!S || !mc) return;
    var C = G.C, N = S.N, d = mimg.data, exp = S.exp, vis = C.vis;
    for (var i = 0; i < N * N; i++) {
      var j = i * 4, col;
      if (!exp[i]) { d[j] = 14; d[j + 1] = 12; d[j + 2] = 10; d[j + 3] = 255; continue; }
      col = TCOL[S.ter[i]];
      var oid = C.occ[i];
      if (oid) { var e = C.byId.get(oid); if (e) col = e.k === 'r' ? RCOL[e.t] : TEAM[e.o]; }
      var m = vis[i] ? 1 : 0.55;
      d[j] = col[0] * m; d[j + 1] = col[1] * m; d[j + 2] = col[2] * m; d[j + 3] = 255;
    }
    C.units.forEach(function (u) {
      var k = Math.floor(u.y) * N + Math.floor(u.x);
      if (u.o !== 0 && !vis[k]) return;
      var col = TEAM[u.o], j = k * 4;
      d[j] = Math.min(255, col[0] + 40); d[j + 1] = Math.min(255, col[1] + 40); d[j + 2] = Math.min(255, col[2] + 40);
    });
    moff.getContext('2d').putImageData(mimg, 0, 0);
    var M = mc.width, Hh = mc.height, s = Math.min(M / (2 * N), Hh / N), offY = (Hh - s * N) / 2;
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, M, Hh);
    mctx.setTransform(s, s / 2, -s, s / 2, M / 2, offY);
    mctx.imageSmoothingEnabled = false;
    mctx.drawImage(moff, 0, 0);
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    var cs = [R.s2w(0, 0), R.s2w(W, 0), R.s2w(W, H), R.s2w(0, H)];
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.2; mctx.beginPath();
    cs.forEach(function (c, i2) { var mx = M / 2 + (c[0] - c[1]) * s, my = offY + (c[0] + c[1]) * s / 2; if (i2) mctx.lineTo(mx, my); else mctx.moveTo(mx, my); });
    mctx.closePath(); mctx.stroke();
    R.miniS = s; R.miniOff = offY;
  };
  R.miniToWorld = function (cx, cy) {
    var d = mc.width / mc.clientWidth, mx = cx * d, my = cy * d, M = mc.width, s = R.miniS || 1;
    var a = (mx - M / 2) / s, b = (my - (R.miniOff || 0)) * 2 / s;
    return [(a + b) / 2, (b - a) / 2];
  };

  // ---------- iconițe pentru butoane ----------
  // imaginile randate se folosesc direct ca fișiere: copierea lor printr-un canvas e interzisă când jocul rulează din file://
  var icons = {};
  R.icon = function (kind, t, civ) {
    if (G.BAKED) {
      if (kind === 'u' && G.BAKED['i_' + t + '_' + civ]) return 'assets/i_' + t + '_' + civ + '.png';
      if (kind === 'b' && G.BAKED['j_' + t + '_' + civ]) return 'assets/j_' + t + '_' + civ + '.png';
    }
    var key = kind + t + civ;
    if (icons[key]) return icons[key];
    var c = document.createElement('canvas'); c.width = c.height = 96;
    var g = c.getContext('2d');
    if (kind === 'u') {
      var fake = { t: t, o: 0, face: 1, an: 0, mv: 0, wk: 0, sw: 0, carry: null, task: null };
      var cls = G.UNITS[t].cls;
      drawUnitAt(g, fake, civ, cls === 'sie' ? 44 : 46, cls === 'cav' ? 86 : 84, cls === 'cav' ? 2.15 : cls === 'sie' ? 2.6 : 2.7);
    } else {
      var s = G.Spr.bld(t, civ), sc = Math.min(92 / s.w, 92 / s.h);
      g.drawImage(s.c, (96 - s.w * sc) / 2, (96 - s.h * sc) / 2, s.w * sc, s.h * sc);
    }
    return icons[key] = c.toDataURL();
  };
})();
