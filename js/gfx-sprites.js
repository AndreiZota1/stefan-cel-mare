// Clădirile, copacii și resursele, desenate o singură dată cu texturi, lumină și umbre, apoi refolosite.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var Spr = G.Spr = {};
  var SS = 3, cache = {};

  function rgb(c) {
    if (c[0] === '#') { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    var m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }
  function shade(c, f) {
    var a = rgb(c), r = a[0], g = a[1], b = a[2];
    if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  Spr.shade = shade;
  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * SS); c.height = Math.ceil(h * SS);
    var g = c.getContext('2d'); g.scale(SS, SS); g.lineJoin = 'round'; g.lineCap = 'round';
    return { c: c, g: g, w: w, h: h, ax: 0, ay: 0 };
  }

  // ---------- trusa de desen izometric ----------
  function kit(g, ox, oy, seed) {
    var K = {}, Rn = G.rng(seed || 1);
    var OUT = 'rgba(32,20,10,0.55)';
    function P(ix, iy, z) { return [ox + (ix - iy) * 32, oy + (ix + iy) * 16 - (z || 0)]; }
    function path(pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
    function fill(pts, col) { path(pts); g.fillStyle = col; g.fill(); }
    function stroke(pts, col, lw) { path(pts); g.strokeStyle = col; g.lineWidth = lw || 0.6; g.stroke(); }
    function line(a, b, col, lw) { g.strokeStyle = col; g.lineWidth = lw || 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    K.P = P; K.fill = fill; K.stroke = stroke; K.line = line; K.lerp = lerp; K.g = g; K.R = Rn;
    K.clip = function (pts, fn) { g.save(); path(pts); g.clip(); fn(); g.restore(); };

    K.shadow = function (x0, y0, x1, y1, h, al) {
      var sx = h * 0.95, sy = h * 0.42;
      var A = P(x0, y0), B = P(x1, y0), C = P(x1, y1), D = P(x0, y1);
      g.save(); g.filter = 'blur(2px)';
      fill([D, A, [A[0] + sx, A[1] + sy], [B[0] + sx, B[1] + sy], [C[0] + sx, C[1] + sy], C], 'rgba(20,13,6,' + (al || 0.3) + ')');
      g.restore();
    };
    K.ground = function (x0, y0, x1, y1, col) { fill([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], col); };

    // o față verticală: pts = [stânga-jos, dreapta-jos, dreapta-sus, stânga-sus]
    function face(pts, col, tex, h) {
      var BL = pts[0], BR = pts[1], len = Math.hypot(BR[0] - BL[0], BR[1] - BL[1]);
      var grd = g.createLinearGradient(0, BL[1] - h, 0, BL[1]);
      grd.addColorStop(0, shade(col, 0.07)); grd.addColorStop(1, shade(col, -0.07));
      fill(pts, grd);
      g.save(); path(pts); g.clip();
      function at(sAlong, z) { var t = sAlong / len; return [BL[0] + (BR[0] - BL[0]) * t, BL[1] + (BR[1] - BL[1]) * t - z]; }
      var z, sA, row;
      if (tex === 'stone') {
        for (z = 0, row = 0; z < h; z += 5.2, row++) {
          for (sA = (row % 2) * -4.5; sA < len; sA += 9) {
            var a = at(sA, z), b = at(sA + 9, z), c = at(sA + 9, z + 5.2), d = at(sA, z + 5.2), v = Rn();
            fill([a, b, c, d], v < 0.5 ? 'rgba(0,0,0,' + (0.03 + v * 0.1).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.16).toFixed(3) + ')');
            line(a, d, 'rgba(70,60,48,0.35)', 0.45);
          }
          line(at(0, z), at(len, z), 'rgba(70,60,48,0.4)', 0.5);
        }
      } else if (tex === 'logs') {
        for (z = 0; z < h; z += 4.3) {
          var tint = Rn();
          fill([at(0, z), at(len, z), at(len, z + 4.3), at(0, z + 4.3)], tint < 0.5 ? 'rgba(0,0,0,' + (tint * 0.12).toFixed(3) + ')' : 'rgba(255,230,190,' + ((tint - 0.5) * 0.12).toFixed(3) + ')');
          line(at(0, z + 3.6), at(len, z + 3.6), 'rgba(255,230,190,0.22)', 0.6);
          line(at(0, z + 0.3), at(len, z + 0.3), 'rgba(30,14,4,0.5)', 0.8);
        }
      } else if (tex === 'plaster') {
        for (var i = 0; i < len * h / 9; i++) {
          var p = at(Rn() * len, Rn() * h);
          g.fillStyle = Rn() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.12)';
          g.fillRect(p[0], p[1], 1.1, 0.8);
        }
        for (var gi = 0; gi < 5; gi++) line(at(0, gi), at(len, gi), 'rgba(110,85,50,' + (0.16 - gi * 0.03).toFixed(3) + ')', 1);
      } else if (tex === 'planks') {
        for (sA = 0; sA < len; sA += 3.4) { line(at(sA, 0), at(sA, h), 'rgba(40,22,8,0.35)', 0.5); if (Rn() < 0.4) fill([at(sA, 0), at(sA + 3.4, 0), at(sA + 3.4, h), at(sA, h)], 'rgba(255,220,170,0.06)'); }
      } else if (tex === 'paint') {
        // pereții pictați ai mănăstirilor din Moldova: șiruri de chenare cu sfinți
        for (z = 3, row = 0; z < h - 3; z += 6.5, row++) {
          for (sA = 1.5; sA < len - 3; sA += 4.6) {
            var q0 = at(sA, z), q1 = at(sA + 3.6, z), q2 = at(sA + 3.6, z + 5.2), q3 = at(sA, z + 5.2);
            fill([q0, q1, q2, q3], 'rgba(255,240,200,0.16)');
            var hd = at(sA + 1.8, z + 4.2); g.fillStyle = 'rgba(230,190,90,0.55)'; g.beginPath(); g.arc(hd[0], hd[1], 0.9, 0, 6.3); g.fill();
            var bd = at(sA + 1.8, z + 1.6); g.fillStyle = row % 2 ? 'rgba(170,60,40,0.45)' : 'rgba(240,235,220,0.35)'; g.fillRect(bd[0] - 0.8, bd[1] - 1.6, 1.6, 2.4);
          }
        }
      }
      // umbra de la bază
      for (var k = 0; k < 6; k++) line(at(0, k), at(len, k), 'rgba(0,0,0,' + (0.14 - k * 0.022).toFixed(3) + ')', 1.05);
      g.restore();
      stroke(pts, OUT, 0.6);
    }
    K.face = face;
    K.faceL = function (x0, x1, y1, z0, h, col, tex) { face([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], col, tex, h); };
    K.faceR = function (y0, y1, x1, z0, h, col, tex) { face([P(x1, y1, z0), P(x1, y0, z0), P(x1, y0, z0 + h), P(x1, y1, z0 + h)], shade(col, -0.2), tex, h); };
    K.box = function (x0, y0, x1, y1, z0, h, col, tex, top) {
      K.faceL(x0, x1, y1, z0, h, col, tex);
      K.faceR(y0, y1, x1, z0, h, col, tex);
      if (top) { fill([P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], top); stroke([P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], OUT, 0.5); }
    };
    // o pantă de acoperiș: streașina a-b, coama c-d
    function roofPlane(a, b, c, d, col, tex) {
      var pts = c === d ? [a, b, c] : [a, b, c, d];
      var grd = g.createLinearGradient((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, c[0], c[1]);
      grd.addColorStop(0, shade(col, -0.1)); grd.addColorStop(1, shade(col, 0.06));
      fill(pts, grd);
      g.save(); path(pts); g.clip();
      var len = Math.hypot((a[0] + b[0]) / 2 - (c[0] + d[0]) / 2, (a[1] + b[1]) / 2 - (c[1] + d[1]) / 2), rows = Math.max(3, Math.round(len / (tex === 'tiles' ? 3.2 : 3.6)));
      for (var i = 0; i <= rows; i++) {
        var t = i / rows, L = lerp(a, d, t), Rr = lerp(b, c, t);
        line(L, Rr, tex === 'tiles' ? 'rgba(60,20,8,0.32)' : 'rgba(10,6,2,0.3)', 0.55);
        var seg = Math.hypot(Rr[0] - L[0], Rr[1] - L[1]), step = tex === 'tiles' ? 3 : 3.8;
        for (var s = (i % 2) * step / 2; s < seg; s += step) {
          var p = lerp(L, Rr, s / seg), up = lerp(lerp(a, d, Math.min(1, t + 1 / rows)), lerp(b, c, Math.min(1, t + 1 / rows)), s / seg);
          line(p, [p[0] + (up[0] - p[0]) * 0.9, p[1] + (up[1] - p[1]) * 0.9], tex === 'tiles' ? 'rgba(255,190,150,0.18)' : 'rgba(0,0,0,0.16)', 0.5);
        }
      }
      line(a, b, 'rgba(0,0,0,0.35)', 1.2);
      g.restore();
      stroke(pts, OUT, 0.6);
    }
    K.roofPlane = roofPlane;
    K.hip = function (x0, y0, x1, y1, z, h, col, tex) {
      var w = x1 - x0, d = y1 - y0, A = P(x0, y0, z), B = P(x1, y0, z), C = P(x1, y1, z), D = P(x0, y1, z), R0, R1;
      if (w >= d) { var ym = (y0 + y1) / 2, hd = d / 2; R0 = P(x0 + hd, ym, z + h); R1 = P(x1 - hd, ym, z + h);
        roofPlane(A, B, R1, R0, shade(col, -0.25), tex); roofPlane(D, A, R0, R0, shade(col, 0.1), tex);
        roofPlane(D, C, R1, R0, shade(col, 0.03), tex); roofPlane(C, B, R1, R1, shade(col, -0.2), tex);
      } else { var xm = (x0 + x1) / 2, hw = w / 2; R0 = P(xm, y0 + hw, z + h); R1 = P(xm, y1 - hw, z + h);
        roofPlane(A, B, R0, R0, shade(col, -0.25), tex); roofPlane(D, A, R0, R1, shade(col, 0.1), tex);
        roofPlane(D, C, R1, R1, shade(col, 0.03), tex); roofPlane(C, B, R0, R1, shade(col, -0.2), tex);
      }
      line(R0, R1, 'rgba(255,240,220,0.25)', 0.8);
      return [R0, R1];
    };
    K.gableX = function (x0, y0, x1, y1, z, h, col, tex, wall, wallTex) {
      var ym = (y0 + y1) / 2, R0 = P(x0, ym, z + h), R1 = P(x1, ym, z + h);
      roofPlane(P(x0, y0, z), P(x1, y0, z), R1, R0, shade(col, -0.25), tex);
      roofPlane(P(x0, y1, z), P(x1, y1, z), R1, R0, shade(col, 0.04), tex);
      if (wall) { var tri = [P(x1, y1, z), P(x1, y0, z), R1]; fill(tri, shade(wall, -0.22)); if (wallTex === 'planks') K.clip(tri, function () { for (var i = 0; i < 12; i++) line(lerp(tri[0], tri[1], i / 12), [lerp(tri[0], tri[1], i / 12)[0], lerp(tri[0], tri[1], i / 12)[1] - 30], 'rgba(40,22,8,0.3)', 0.5); }); stroke(tri, OUT, 0.6); }
      line(R0, R1, 'rgba(255,240,220,0.25)', 0.8);
    };
    K.gableY = function (x0, y0, x1, y1, z, h, col, tex, wall) {
      var xm = (x0 + x1) / 2, R0 = P(xm, y0, z + h), R1 = P(xm, y1, z + h);
      roofPlane(P(x0, y1, z), P(x0, y0, z), R0, R1, shade(col, 0.1), tex);
      roofPlane(P(x1, y1, z), P(x1, y0, z), R0, R1, shade(col, -0.2), tex);
      if (wall) { var tri = [P(x0, y1, z), P(x1, y1, z), R1]; fill(tri, wall); stroke(tri, OUT, 0.6); }
      line(R0, R1, 'rgba(255,240,220,0.25)', 0.8);
    };
    K.cyl = function (cx, cy, z, r, h, col, tex) {
      var p = P(cx, cy, z), q = P(cx, cy, z + h), rx = r * 45, ry = r * 22.6;
      var grd = g.createLinearGradient(p[0] - rx, 0, p[0] + rx, 0);
      grd.addColorStop(0, shade(col, 0.16)); grd.addColorStop(0.42, col); grd.addColorStop(1, shade(col, -0.36));
      g.beginPath(); g.moveTo(q[0] - rx, q[1]); g.lineTo(p[0] - rx, p[1]); g.ellipse(p[0], p[1], rx, ry, 0, Math.PI, 0, true); g.lineTo(q[0] + rx, q[1]); g.closePath();
      g.fillStyle = grd; g.fill();
      if (tex === 'stone') {
        g.save(); g.clip();
        for (var zz = 0, row = 0; zz < h; zz += 5.2, row++) {
          g.strokeStyle = 'rgba(70,60,48,0.4)'; g.lineWidth = 0.5;
          g.beginPath(); g.ellipse(p[0], p[1] - zz, rx, ry, 0, 0, Math.PI); g.stroke();
          for (var a = (row % 2) * 0.2; a < Math.PI; a += 0.4) {
            var xx = p[0] + Math.cos(a) * rx, yy = p[1] - zz + Math.sin(a) * ry;
            line([xx, yy], [xx, yy - 5.2], 'rgba(70,60,48,0.3)', 0.45);
          }
        }
        for (var kk = 0; kk < 6; kk++) { g.strokeStyle = 'rgba(0,0,0,' + (0.14 - kk * 0.022).toFixed(3) + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(p[0], p[1] - kk, rx, ry, 0, 0, Math.PI); g.stroke(); }
        g.restore();
      }
      g.strokeStyle = OUT; g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(q[0] - rx, q[1]); g.lineTo(p[0] - rx, p[1]); g.ellipse(p[0], p[1], rx, ry, 0, Math.PI, 0, true); g.lineTo(q[0] + rx, q[1]); g.stroke();
      g.beginPath(); g.ellipse(q[0], q[1], rx, ry, 0, 0, Math.PI * 2); g.fillStyle = shade(col, 0.05); g.fill(); g.stroke();
      return q;
    };
    K.cone = function (cx, cy, z, r, h, col, tex) {
      var p = P(cx, cy, z), rx = r * 45, ry = r * 22.6, ap = [p[0], p[1] - h];
      var grd = g.createLinearGradient(p[0] - rx, 0, p[0] + rx, 0);
      grd.addColorStop(0, shade(col, 0.18)); grd.addColorStop(0.45, col); grd.addColorStop(1, shade(col, -0.38));
      g.beginPath(); g.moveTo(p[0] - rx, p[1]); g.lineTo(ap[0], ap[1]); g.lineTo(p[0] + rx, p[1]); g.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI, false); g.closePath();
      g.fillStyle = grd; g.fill();
      g.save(); g.clip();
      for (var i = 1; i < 9; i++) {
        var t = i / 9;
        g.strokeStyle = tex === 'tiles' ? 'rgba(60,20,8,0.3)' : 'rgba(0,0,0,0.25)'; g.lineWidth = 0.55;
        g.beginPath(); g.ellipse(p[0], p[1] - h * t, rx * (1 - t), ry * (1 - t), 0, 0, Math.PI); g.stroke();
      }
      g.restore();
      g.strokeStyle = OUT; g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(p[0] - rx, p[1]); g.lineTo(ap[0], ap[1]); g.lineTo(p[0] + rx, p[1]); g.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI, false); g.stroke();
      return ap;
    };
    K.dome = function (cx, cy, z, r, col) {
      var p = P(cx, cy, z), rx = r * 45, ry = rx * 0.5, hh = rx * 0.95;
      var grd = g.createRadialGradient(p[0] - rx * 0.4, p[1] - hh * 0.75, rx * 0.08, p[0], p[1] - hh * 0.3, rx * 1.15);
      grd.addColorStop(0, shade(col, 0.45)); grd.addColorStop(0.5, col); grd.addColorStop(1, shade(col, -0.38));
      g.beginPath(); g.ellipse(p[0], p[1], rx, hh, 0, Math.PI, 0, false); g.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI, false); g.closePath();
      g.fillStyle = grd; g.fill();
      g.save(); g.clip();
      for (var i = -3; i <= 3; i++) { g.strokeStyle = 'rgba(30,40,55,0.25)'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(p[0], p[1], Math.abs(i) / 3.5 * rx + 0.1, hh, 0, Math.PI, 0, i < 0); g.stroke(); }
      g.restore();
      g.strokeStyle = OUT; g.lineWidth = 0.6; g.beginPath(); g.ellipse(p[0], p[1], rx, hh, 0, Math.PI, 0, false); g.stroke();
      return [p[0], p[1] - hh];
    };
    K.flag = function (px, py, h, col, emblem) {
      line([px + 0.6, py], [px + 0.6, py - h], 'rgba(0,0,0,0.3)', 1.6);
      line([px, py], [px, py - h], '#5a4630', 1.3);
      g.fillStyle = '#d9b44a'; g.beginPath(); g.arc(px, py - h - 1, 1.3, 0, 6.3); g.fill();
      var grd = g.createLinearGradient(px, 0, px + 14, 0); grd.addColorStop(0, shade(col, 0.15)); grd.addColorStop(1, shade(col, -0.25));
      g.fillStyle = grd; g.beginPath(); g.moveTo(px, py - h + 1); g.bezierCurveTo(px + 5, py - h - 1, px + 9, py - h + 3, px + 14, py - h + 2); g.lineTo(px + 12, py - h + 6); g.bezierCurveTo(px + 8, py - h + 8, px + 4, py - h + 5, px, py - h + 8); g.closePath(); g.fill();
      g.strokeStyle = OUT; g.lineWidth = 0.5; g.stroke();
      if (emblem) { g.fillStyle = '#e8c454'; g.beginPath(); g.arc(px + 6, py - h + 4, 1.4, 0, 6.3); g.fill(); }
    };
    // ușă sau fereastră pe o față: side 'L' (de-a lungul lui x, la y fix) sau 'R' (de-a lungul lui y, la x fix)
    K.hole = function (side, a, b, fixed, z0, z1, col, frame, arch) {
      var pts = side === 'L' ? [P(a, fixed, z0), P(b, fixed, z0), P(b, fixed, z1), P(a, fixed, z1)] : [P(fixed, b, z0), P(fixed, a, z0), P(fixed, a, z1), P(fixed, b, z1)];
      if (arch) { var m = lerp(pts[3], pts[2], 0.5); pts = [pts[0], pts[1], pts[2], [m[0], m[1] - arch], pts[3]]; }
      fill(pts, col);
      if (frame) stroke(pts, frame, 0.9);
      return pts;
    };
    K.shutters = function (side, a, b, fixed, z0, z1, col) {
      var w = (b - a) * 0.55;
      K.hole(side, a - w, a, fixed, z0, z1, col, 'rgba(0,0,0,0.4)');
      K.hole(side, b, b + w, fixed, z0, z1, col, 'rgba(0,0,0,0.4)');
    };
    K.merlons = function (side, from, to, fixed, z, col) {
      for (var s = from; s < to - 0.05; s += 0.34) {
        if (side === 'L') K.box(s, fixed - 0.3, s + 0.17, fixed, z, 5, col, null, shade(col, 0.12));
        else K.box(fixed - 0.3, s, fixed, s + 0.17, z, 5, col, null, shade(col, 0.12));
      }
    };
    return K;
  }

  var HEAD = { cetate: 150, turn: 132, manastire: 120, moara: 108, casa: 72, cazarma: 86, grajd: 84, poligon: 72, fierarie: 104, joagar: 66, mina: 66, ogor: 8 };
  var PAL = {
    mol: { wall: '#efe7d4', logs: '#8a5c33', roof: '#5c4636', tile: '#a84a2c', stone: '#d0c8b5', paint: '#2f62ad', shut: '#3d6fb0', dome: '#5c4636' },
    oto: { wall: '#f1e2bd', logs: '#946a3e', roof: '#b85b3a', tile: '#b85b3a', stone: '#dccfab', paint: '#f0eadb', shut: '#2f7d4a', dome: '#8797a8' }
  };

  Spr.bld = function (t, civ) {
    var key = t + '_' + civ;
    if (cache[key]) return cache[key];
    var n = G.BLDS[t].n, head = HEAD[t] || 72, mr = 40;
    var w = n * 64 + 26 + mr, h = n * 32 + head + 22;
    var s = mk(w, h), ox = 13 + n * 32, oy = head;
    var K = kit(s.g, ox, oy, t.length * 31 + (civ === 'mol' ? 7 : 13)), P = K.P, g = s.g, pal = PAL[civ], team = G.PCOL[civ === 'oto' ? 1 : 0].color, mol = civ === 'mol';
    s.ax = ox; s.ay = oy;
    var st = pal.stone;
    switch (t) {
      case 'casa':
        K.ground(0.12, 0.12, n - 0.08, n - 0.04, 'rgba(118,94,60,0.35)');
        K.shadow(0.35, 0.4, 1.7, 1.75, mol ? 40 : 28, 0.3);
        if (mol) {
          K.box(0.4, 0.45, 1.6, 1.5, 0, 18, pal.wall, 'plaster');
          K.box(0.4, 0.45, 1.6, 1.5, 0, 4, pal.logs, 'planks');
          K.hole('L', 0.62, 0.88, 1.5, 0, 12, '#4a2f1a', '#2a1a0c');
          K.hole('L', 1.12, 1.36, 1.5, 7, 13, '#2a3a4a', '#f4efe4'); K.shutters('L', 1.12, 1.36, 1.5, 7, 13, pal.shut);
          K.hole('R', 0.75, 0.98, 1.6, 7, 13, '#2a3a4a', '#f4efe4'); K.shutters('R', 0.75, 0.98, 1.6, 7, 13, pal.shut);
          [0.48, 1.0, 1.52].forEach(function (x) { K.box(x, 1.68, x + 0.07, 1.75, 0, 17, '#7a5230', null); });
          K.ground(0.4, 1.5, 1.6, 1.78, 'rgba(110,80,50,0.35)');
          K.hip(0.2, 0.25, 1.8, 1.92, 17, 21, pal.roof, 'shingle');
        } else {
          K.box(0.4, 0.45, 1.6, 1.55, 0, 17, pal.wall, 'plaster');
          K.hole('L', 0.62, 0.86, 1.55, 0, 12, '#5a3a22', '#3a2412', 3);
          K.hole('L', 1.12, 1.34, 1.55, 7, 13, '#2a2a30', '#f4efe4', 2.5);
          K.hole('R', 0.8, 1.02, 1.6, 7, 13, '#2a2a30', '#f4efe4', 2.5);
          K.hip(0.3, 0.35, 1.7, 1.65, 17, 10, pal.tile, 'tiles');
          K.box(1.25, 0.6, 1.4, 0.75, 22, 9, '#d8c8a8', null, '#4a3a2a');
        }
        break;
      case 'cetate': {
        var HW = 24;
        K.shadow(0.25, 0.25, 3.75, 3.75, 66, 0.3);
        K.ground(0.3, 0.3, 3.7, 3.7, '#9e9072');
        K.clip([P(0.6, 0.6), P(3.4, 0.6), P(3.4, 3.4), P(0.6, 3.4)], function () { for (var i = 0; i < 70; i++) { var q = P(0.6 + K.R() * 2.8, 0.6 + K.R() * 2.8); g.fillStyle = 'rgba(70,60,40,0.18)'; g.fillRect(q[0], q[1], 3, 1.4); } });
        var tower = function (cx, cy) {
          var top = K.cyl(cx, cy, 0, 0.44, 44, st, 'stone');
          K.cyl(cx, cy, 44, 0.5, 6, shade(st, 0.04), 'stone');
          var sl = P(cx + 0.3, cy + 0.3, 24); K.fill([[sl[0] - 1.1, sl[1]], [sl[0] + 1.1, sl[1]], [sl[0] + 1.1, sl[1] + 7], [sl[0] - 1.1, sl[1] + 7]], '#231a12');
          if (mol) { var ap = K.cone(cx, cy, 50, 0.56, 32, pal.tile, 'tiles'); K.line(ap, [ap[0], ap[1] - 6], '#d9b44a', 1.2); }
          else { var dt = K.dome(cx, cy, 50, 0.46, pal.dome); K.line(dt, [dt[0], dt[1] - 8], '#c9a43a', 1.3); g.strokeStyle = '#d9b44a'; g.lineWidth = 0.9; g.beginPath(); g.arc(dt[0] + 0.8, dt[1] - 9.5, 1.8, 0.6, 5.2); g.stroke(); }
        };
        tower(0.45, 0.45);
        K.box(0.3, 0.3, 3.7, 0.62, 0, HW, st, 'stone', shade(st, 0.12));
        K.box(0.3, 0.62, 0.62, 3.7, 0, HW, st, 'stone', shade(st, 0.12));
        tower(3.55, 0.45); tower(0.45, 3.55);
        // donjonul
        K.box(1.3, 1.3, 2.7, 2.7, 0, 50, shade(st, 0.04), 'stone');
        K.hole('L', 1.6, 1.82, 2.7, 30, 38, '#231a12', 'rgba(255,255,255,0.3)', 2);
        K.hole('L', 2.15, 2.37, 2.7, 30, 38, '#231a12', 'rgba(255,255,255,0.3)', 2);
        K.hole('R', 1.7, 1.92, 2.7, 30, 38, '#231a12', 'rgba(255,255,255,0.3)', 2);
        if (mol) {
          var rg = K.hip(1.15, 1.15, 2.85, 2.85, 50, 32, pal.tile, 'tiles');
          K.flag(rg[0][0], rg[0][1], 18, team, true);
        } else {
          var d2 = K.dome(2, 2, 50, 0.82, pal.dome); K.line(d2, [d2[0], d2[1] - 12], '#c9a43a', 1.6);
          g.strokeStyle = '#d9b44a'; g.lineWidth = 1.1; g.beginPath(); g.arc(d2[0] + 1, d2[1] - 14, 2.4, 0.6, 5.2); g.stroke();
          K.cyl(2.95, 1.05, 0, 0.13, 76, '#f3eee2'); K.cyl(2.95, 1.05, 54, 0.2, 3, '#e6e0d0'); K.cone(2.95, 1.05, 76, 0.15, 20, pal.dome);
        }
        K.box(0.62, 3.38, 3.38, 3.7, 0, HW, st, 'stone', shade(st, 0.12));
        K.box(3.38, 0.62, 3.7, 3.38, 0, HW, st, 'stone', shade(st, 0.12));
        K.merlons('L', 0.66, 3.38, 3.7, HW, st);
        K.merlons('R', 0.66, 3.38, 3.7, HW, st);
        // poarta
        K.hole('L', 1.62, 2.38, 3.7, 0, 15, '#5a3a20', '#3a2a1a', 6);
        var gp = [P(1.62, 3.7, 0), P(2.38, 3.7, 0)];
        for (var gi = 1; gi < 4; gi++) { var a0 = K.lerp(gp[0], gp[1], gi / 4); K.line(a0, [a0[0], a0[1] - 15], 'rgba(20,12,6,0.6)', 0.6); }
        K.line(P(1.62, 3.7, 7), P(2.38, 3.7, 7), '#2a2a2a', 0.8);
        [[1.0, 3.7], [3.0, 3.7]].forEach(function (q) {
          var a = P(q[0], q[1], 20), b = P(q[0] + 0.18, q[1], 20);
          K.fill([a, b, [b[0], b[1] + 14], [(a[0] + b[0]) / 2, b[1] + 17], [a[0], a[1] + 14]], team);
          g.fillStyle = '#e8c454'; g.beginPath(); g.arc((a[0] + b[0]) / 2, a[1] + 6, 1.5, 0, 6.3); g.fill();
        });
        tower(3.55, 3.55);
        break;
      }
      case 'turn': {
        K.shadow(0.5, 0.5, 1.5, 1.5, 88, 0.3);
        K.ground(0.35, 0.35, 1.65, 1.65, 'rgba(120,100,70,0.3)');
        K.cyl(1, 1, 0, 0.56, 60, st, 'stone');
        [[1.4, 1.4, 38], [1.4, 1.4, 18], [1.55, 0.85, 30]].forEach(function (q) { var a = P(q[0], q[1], q[2]); K.fill([[a[0] - 1.1, a[1]], [a[0] + 1.1, a[1]], [a[0] + 1.1, a[1] + 7], [a[0] - 1.1, a[1] + 7]], '#231a12'); });
        K.cyl(1, 1, 60, 0.66, 8, shade(st, 0.05), 'stone');
        for (var mi = 0; mi < 7; mi++) { var ang = Math.PI * (0.08 + mi / 6.6), q = P(1, 1, 68); var xm = q[0] + Math.cos(ang) * 0.6 * 45, ym = q[1] + Math.sin(ang) * 0.6 * 22.6; K.fill([[xm - 2.2, ym], [xm + 2.2, ym], [xm + 2.2, ym - 4], [xm - 2.2, ym - 4]], shade(st, (Math.cos(ang) * -0.15))); }
        var ap2 = mol ? K.cone(1, 1, 68, 0.7, 34, pal.tile, 'tiles') : K.cone(1, 1, 68, 0.64, 40, pal.dome);
        K.flag(ap2[0], ap2[1] + 2, 15, team, mol);
        break;
      }
      case 'joagar':
        K.ground(0.1, 0.1, 1.95, 1.95, 'rgba(120,96,60,0.4)');
        K.clip([P(0.1, 0.1), P(1.95, 0.1), P(1.95, 1.95), P(0.1, 1.95)], function () { for (var i = 0; i < 40; i++) { var q = P(0.2 + K.R() * 1.7, 0.2 + K.R() * 1.7); g.fillStyle = 'rgba(210,170,110,0.5)'; g.fillRect(q[0], q[1], 1.6, 0.8); } });
        K.shadow(0.8, 0.3, 1.75, 1.3, 34, 0.28);
        K.box(0.85, 0.35, 1.7, 0.52, 0, 17, pal.logs, 'logs');
        K.box(1.55, 0.52, 1.7, 1.2, 0, 17, pal.logs, 'logs');
        [[0.88, 1.12], [1.55, 1.12]].forEach(function (q) { K.box(q[0], q[1], q[0] + 0.09, q[1] + 0.09, 0, 17, shade(pal.logs, -0.1)); });
        K.gableX(0.72, 0.26, 1.82, 1.32, 17, 11, pal.roof, 'shingle', pal.logs, 'planks');
        for (var li = 0; li < 3; li++) for (var lj = 0; lj < 3 - li; lj++) {
          var a0 = P(0.28, 1.28 + lj * 0.17 + li * 0.085, 3 + li * 4.4), a1 = P(1.25, 1.28 + lj * 0.17 + li * 0.085, 3 + li * 4.4);
          K.line(a0, a1, '#3e2814', 5.2); K.line(a0, a1, '#7c5332', 4.2); K.line([a0[0], a0[1] - 1.2], [a1[0], a1[1] - 1.2], 'rgba(255,220,170,0.25)', 1);
          g.fillStyle = '#c99a62'; g.beginPath(); g.ellipse(a0[0], a0[1], 2, 2.2, 0, 0, 6.3); g.fill(); g.strokeStyle = '#8a6038'; g.lineWidth = 0.5; g.stroke();
        }
        var sh = P(1.55, 1.6, 0); K.fill([[sh[0] - 4, sh[1]], [sh[0] + 4, sh[1]], [sh[0] + 3, sh[1] - 4], [sh[0] - 3, sh[1] - 4]], '#7a5332');
        K.line([sh[0], sh[1] - 4], [sh[0] + 5, sh[1] - 10], '#6b4a2a', 1.2); K.fill([[sh[0] + 4, sh[1] - 11], [sh[0] + 8, sh[1] - 12], [sh[0] + 7, sh[1] - 8]], '#b9bec4');
        break;
      case 'mina':
        K.ground(0.1, 0.1, 1.95, 1.95, 'rgba(110,100,85,0.4)');
        K.shadow(0.9, 0.3, 1.75, 1.15, 30, 0.28);
        K.box(0.95, 0.35, 1.7, 1.05, 0, 15, pal.logs, 'planks');
        K.hole('L', 1.15, 1.4, 1.05, 0, 10, '#1e150e', '#3a2a1a');
        K.gableY(0.88, 0.28, 1.77, 1.12, 15, 11, pal.roof, 'shingle', shade(pal.logs, 0.12));
        K.box(0.32, 1.2, 0.85, 1.55, 3, 6, '#6b5038', 'planks', '#4a3a2a');
        var oc = P(0.58, 1.38, 9); for (var o2 = 0; o2 < 8; o2++) { g.fillStyle = o2 % 3 ? '#a8a194' : '#e6c24a'; g.beginPath(); g.ellipse(oc[0] + (o2 - 4) * 2.2, oc[1] - (o2 % 2) * 1.6, 2, 1.4, 0, 0, 6.3); g.fill(); }
        [[0.42, 1.6], [0.78, 1.6]].forEach(function (q) { var a = P(q[0], q[1], 2.6); g.fillStyle = '#2b2018'; g.beginPath(); g.ellipse(a[0], a[1], 2.8, 2.8, 0, 0, 6.3); g.fill(); g.strokeStyle = '#7a6040'; g.lineWidth = 0.6; g.stroke(); });
        var op = P(1.4, 1.55, 0);
        var og = g.createRadialGradient(op[0] - 3, op[1] - 7, 1, op[0], op[1] - 3, 13); og.addColorStop(0, '#a49a8a'); og.addColorStop(1, '#5e564a');
        g.fillStyle = og; g.beginPath(); g.ellipse(op[0], op[1] - 2, 13, 7, 0, Math.PI, 0); g.closePath(); g.fill();
        for (var oi = 0; oi < 9; oi++) { g.fillStyle = oi % 2 ? '#f0cf55' : '#c8c2b6'; g.fillRect(op[0] - 10 + oi * 2.4, op[1] - 4 - (oi % 3) * 1.7, 2, 1.6); }
        break;
      case 'moara':
        K.shadow(0.5, 0.5, 1.5, 1.5, 70, 0.28);
        K.ground(0.2, 0.2, 1.8, 1.8, 'rgba(118,94,60,0.35)');
        if (mol) {
          K.box(0.55, 0.55, 1.45, 1.45, 0, 38, pal.logs, 'logs');
          K.hole('L', 0.85, 1.1, 1.45, 0, 12, '#2e1e10', '#1a0f06');
          K.hole('R', 0.85, 1.05, 1.45, 22, 28, '#2a2018', 'rgba(255,255,255,0.3)');
          K.hip(0.45, 0.45, 1.55, 1.55, 38, 20, pal.roof, 'shingle');
        } else {
          K.cyl(1, 1, 0, 0.5, 38, pal.wall, 'stone');
          K.hole('L', 0.9, 1.1, 1.48, 0, 12, '#3a2818', '#2a1a0c', 3);
          K.cone(1, 1, 38, 0.56, 22, pal.tile, 'tiles');
        }
        s.hub = P(1.52, 1.52, 33);
        break;
      case 'ogor':
        K.fill([P(0.05, 0.05), P(2.95, 0.05), P(2.95, 2.95), P(0.05, 2.95)], '#7e5f34');
        K.clip([P(0.05, 0.05), P(2.95, 0.05), P(2.95, 2.95), P(0.05, 2.95)], function () {
          for (var fi = 0.18; fi < 2.9; fi += 0.24) {
            K.line(P(0.1, fi), P(2.9, fi), 'rgba(60,40,18,0.55)', 1.6);
            K.line(P(0.1, fi + 0.08), P(2.9, fi + 0.08), 'rgba(170,130,80,0.3)', 0.8);
          }
          for (var fy = 0.3; fy < 2.85; fy += 0.24) for (var fx = 0.2; fx < 2.85; fx += 0.15) {
            var q = P(fx + (K.R() - 0.5) * 0.06, fy), hgt = 3.5 + K.R() * 2.5, ripe = K.R();
            g.strokeStyle = ripe < 0.55 ? '#c9b24a' : ripe < 0.85 ? '#a8b845' : '#e0c25a'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] - 0.6, q[1] - hgt); g.stroke();
            g.fillStyle = 'rgba(240,210,110,0.7)'; g.fillRect(q[0] - 1.1, q[1] - hgt - 1.3, 1.2, 1.8);
          }
        });
        K.stroke([P(0.05, 0.05), P(2.95, 0.05), P(2.95, 2.95), P(0.05, 2.95)], 'rgba(60,45,20,0.6)', 1.2);
        break;
      case 'cazarma':
        K.shadow(0.4, 0.6, 2.65, 2.4, 44, 0.3);
        K.ground(0.15, 0.15, 2.9, 2.9, 'rgba(118,94,60,0.38)');
        if (mol) {
          for (var pi2 = 0.25; pi2 < 2.8; pi2 += 0.16) { K.box(pi2, 0.12, pi2 + 0.12, 0.24, 0, 12, '#7a5332'); }
          for (var pj = 0.36; pj < 2.8; pj += 0.16) { K.box(0.12, pj, 0.24, pj + 0.12, 0, 12, '#7a5332'); }
          K.box(0.45, 0.72, 2.6, 2.3, 0, 20, pal.logs, 'logs');
          K.hole('L', 1.3, 1.75, 2.3, 0, 13, '#3a2412', '#24160a');
          K.hole('R', 1.2, 1.45, 2.6, 9, 15, '#2a2018', 'rgba(255,255,255,0.25)');
          K.gableX(0.3, 0.58, 2.75, 2.44, 20, 20, pal.roof, 'shingle', pal.logs, 'planks');
          [[0.7, 2.3], [2.2, 2.3]].forEach(function (q) { var a = P(q[0], q[1], 9); var gr = g.createRadialGradient(a[0] - 1, a[1] - 1, 0.5, a[0], a[1], 4); gr.addColorStop(0, shade(team, 0.3)); gr.addColorStop(1, shade(team, -0.3)); g.fillStyle = gr; g.beginPath(); g.ellipse(a[0], a[1], 3.6, 4, 0, 0, 6.3); g.fill(); g.strokeStyle = '#d8c070'; g.lineWidth = 0.9; g.stroke(); });
          for (var si = 0; si < 5; si++) { var b0 = P(2.88, 0.8 + si * 0.25, 0), b1 = P(2.88, 0.8 + si * 0.25, 25); K.line(b0, b1, '#6b4a2a', 1.3); K.fill([[b1[0] - 1.4, b1[1]], [b1[0], b1[1] - 5], [b1[0] + 1.4, b1[1]]], '#c8ccd2'); }
          K.line(P(2.88, 0.75, 10), P(2.88, 1.9, 10), '#5a3c22', 1.2);
        } else {
          var tentP = function (x0, y0, x1, y1, hw, hr, col) {
            K.box(x0, y0, x1, y1, 0, hw, '#efe6d0', null);
            var rg2 = K.hip(x0 - 0.08, y0 - 0.08, x1 + 0.08, y1 + 0.08, hw, hr, col, 'none');
            var apx = K.P((x0 + x1) / 2, (y0 + y1) / 2, hw + hr);
            [[x0, y1], [x1, y1], [x1, y0], [(x0 + x1) / 2, y1], [x1, (y0 + y1) / 2]].forEach(function (q) { K.line(apx, K.P(q[0], q[1], hw), 'rgba(255,245,225,0.75)', 1.1); });
            return apx;
          };
          tentP(0.3, 0.35, 1.05, 1.1, 8, 18, '#c8352a');
          var ap3 = tentP(0.6, 0.55, 2.5, 2.45, 12, 36, '#c8352a');
          K.hole('L', 1.3, 1.75, 2.45, 0, 10, '#5a2018', '#3a1008');
          K.flag(ap3[0], ap3[1], 15, '#2f7d4a', false);
        }
        break;
      case 'poligon':
        K.ground(0.08, 0.08, 2.92, 2.92, 'rgba(150,125,80,0.45)');
        K.shadow(0.35, 0.35, 1.45, 1.3, 30, 0.28);
        K.box(0.35, 0.35, 1.45, 1.3, 0, 16, mol ? pal.logs : pal.wall, mol ? 'logs' : 'plaster');
        K.hole('L', 0.7, 0.95, 1.3, 0, 10, '#2e1e10', '#1a0f06');
        K.gableX(0.25, 0.25, 1.55, 1.4, 16, 12, mol ? pal.roof : pal.tile, mol ? 'shingle' : 'tiles', mol ? pal.logs : pal.wall);
        [[2.25, 2.3], [2.5, 1.2]].forEach(function (q) {
          var a = P(q[0], q[1], 0), b = P(q[0], q[1], 12);
          K.line([a[0] - 3, a[1]], [b[0] - 1, b[1]], '#6b4a2a', 1.3); K.line([a[0] + 3, a[1]], [b[0] + 1, b[1]], '#6b4a2a', 1.3);
          [[6.2, '#e9dfc4'], [4.6, '#c0392b'], [3, '#e9dfc4'], [1.4, '#c0392b']].forEach(function (r) { g.fillStyle = r[1]; g.beginPath(); g.ellipse(b[0], b[1] - 3, r[0] * 0.78, r[0], 0, 0, 6.3); g.fill(); });
          g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(b[0], b[1] - 3, 6.2 * 0.78, 6.2, 0, 0, 6.3); g.stroke();
          K.line([b[0] - 1, b[1] - 4], [b[0] - 6, b[1] - 6], '#4a3020', 0.7);
        });
        [[1.9, 0.5], [2.4, 0.6]].forEach(function (q) { var a = P(q[0], q[1], 0); g.fillStyle = '#d9b44a'; g.beginPath(); g.ellipse(a[0], a[1] - 3, 6, 4, 0, 0, 6.3); g.fill(); g.strokeStyle = '#a8862a'; g.lineWidth = 0.6; g.stroke(); });
        break;
      case 'grajd':
        K.shadow(0.4, 0.5, 2.6, 2.25, 44, 0.3);
        K.ground(0.12, 0.12, 2.9, 2.9, 'rgba(118,94,60,0.38)');
        K.box(0.4, 0.5, 2.6, 2.25, 0, 22, pal.logs, 'logs');
        K.hole('L', 1.05, 1.95, 2.25, 0, 17, '#2e1e10', '#4a3018');
        K.line(P(1.05, 2.25, 0), P(1.95, 2.25, 17), '#8a6038', 1.3); K.line(P(1.95, 2.25, 0), P(1.05, 2.25, 17), '#8a6038', 1.3);
        K.gableY(0.3, 0.4, 2.7, 2.35, 22, 20, mol ? pal.roof : pal.tile, mol ? 'shingle' : 'tiles', shade(pal.logs, 0.1));
        var hp = P(2.6, 2.65, 0), hg = g.createRadialGradient(hp[0] - 3, hp[1] - 6, 1, hp[0], hp[1] - 2, 11);
        hg.addColorStop(0, '#f0d070'); hg.addColorStop(1, '#b8902e');
        g.fillStyle = hg; g.beginPath(); g.ellipse(hp[0], hp[1] - 2, 10, 6.5, 0, Math.PI, 0); g.closePath(); g.fill();
        for (var hi = -7; hi < 8; hi += 2.5) K.line([hp[0] + hi, hp[1] - 2], [hp[0] + hi + 1, hp[1] - 6], 'rgba(150,110,30,0.6)', 0.6);
        for (var fp = 0.3; fp < 2.8; fp += 0.5) K.box(fp, 2.75, fp + 0.06, 2.81, 0, 7, '#6b4a2a');
        K.line(P(0.3, 2.78, 6), P(2.8, 2.78, 6), '#6b4a2a', 1); K.line(P(0.3, 2.78, 3), P(2.8, 2.78, 3), '#6b4a2a', 1);
        break;
      case 'fierarie':
        K.shadow(0.5, 0.6, 2.5, 2.4, 50, 0.3);
        K.ground(0.15, 0.15, 2.9, 2.9, 'rgba(90,80,70,0.38)');
        K.box(0.5, 0.6, 2.5, 2.4, 0, 20, shade(st, -0.06), 'stone');
        var fd = K.hole('L', 1.2, 1.75, 2.4, 0, 13, '#2a1a0c', '#3a2a1a', 3);
        var fc = K.lerp(fd[0], fd[1], 0.5), fg = g.createRadialGradient(fc[0], fc[1] - 3, 0.5, fc[0], fc[1] - 3, 9); fg.addColorStop(0, 'rgba(255,170,60,0.95)'); fg.addColorStop(1, 'rgba(255,90,20,0)');
        g.fillStyle = fg; g.beginPath(); g.arc(fc[0], fc[1] - 3, 9, 0, 6.3); g.fill();
        K.hip(0.4, 0.5, 2.6, 2.5, 20, 18, mol ? pal.roof : pal.tile, mol ? 'shingle' : 'tiles');
        K.box(1.75, 0.75, 2.1, 1.1, 18, 32, '#8f8678', 'stone', '#2a2420');
        s.chimney = P(1.92, 0.92, 52);
        var an = P(1.4, 2.9, 0);
        K.fill([[an[0] - 7, an[1] - 5], [an[0] + 7, an[1] - 5], [an[0] + 4.5, an[1] - 2], [an[0] + 2, an[1] - 2], [an[0] + 2, an[1] + 2], [an[0] - 2, an[1] + 2], [an[0] - 2, an[1] - 2], [an[0] - 4.5, an[1] - 2]], '#3b3d42');
        K.line([an[0] - 6, an[1] - 5.2], [an[0] + 6, an[1] - 5.2], 'rgba(255,255,255,0.35)', 0.6);
        break;
      case 'manastire':
        K.shadow(0.6, 0.85, 2.5, 2.2, 70, 0.3);
        K.ground(0.15, 0.15, 2.9, 2.9, 'rgba(118,104,80,0.35)');
        if (mol) {
          for (var wx = 0.15; wx < 2.85; wx += 0.34) K.box(wx, 0.15, wx + 0.3, 0.3, 0, 7, st, 'stone', shade(st, 0.1));
          K.box(0.7, 1.0, 2.4, 2.0, 0, 26, pal.paint, 'paint');
          K.box(0.7, 1.0, 2.4, 2.0, 20, 5, '#ece4cf', null);
          K.hole('R', 1.3, 1.7, 2.4, 0, 14, '#3a2416', '#d9b44a', 4);
          K.hole('L', 1.0, 1.2, 2.0, 12, 18, '#1e1a2a', '#d9b44a', 2);
          K.hole('L', 1.9, 2.1, 2.0, 12, 18, '#1e1a2a', '#d9b44a', 2);
          K.hip(0.5, 0.8, 2.6, 2.2, 26, 24, '#4e3e33', 'shingle');
          K.cyl(1.55, 1.5, 40, 0.3, 20, pal.paint, null);
          K.cyl(1.55, 1.5, 54, 0.33, 4, '#ece4cf', null);
          var tt = K.dome(1.55, 1.5, 58, 0.32, '#4e3e33');
          K.line(tt, [tt[0], tt[1] - 13], '#e6c24e', 1.6); K.line([tt[0] - 4.2, tt[1] - 9], [tt[0] + 4.2, tt[1] - 9], '#e6c24e', 1.4);
          K.line([tt[0] - 3, tt[1] - 4.5], [tt[0] + 3, tt[1] - 3.5], '#e6c24e', 1.1);
        } else {
          K.box(0.6, 0.6, 2.4, 2.4, 0, 22, pal.paint, 'plaster');
          K.hole('L', 1.25, 1.75, 2.4, 0, 13, '#2f5a6a', '#d9b44a', 4);
          [0.85, 2.05].forEach(function (x) { K.hole('L', x, x + 0.2, 2.4, 9, 16, '#2a3a4a', '#d9b44a', 2.5); });
          var dt3 = K.dome(1.5, 1.5, 22, 0.86, pal.dome);
          K.line(dt3, [dt3[0], dt3[1] - 11], '#c9a43a', 1.6);
          g.strokeStyle = '#d9b44a'; g.lineWidth = 1.1; g.beginPath(); g.arc(dt3[0] + 1, dt3[1] - 13, 2.4, 0.6, 5.2); g.stroke();
          K.cyl(2.7, 0.5, 0, 0.16, 68, '#f4efe2'); K.cyl(2.7, 0.5, 48, 0.23, 3, '#e3dccb'); K.cone(2.7, 0.5, 68, 0.18, 22, pal.dome);
        }
        break;
    }
    cache[key] = s;
    return s;
  };

  // ---------- copaci ----------
  Spr.tree = function (v) {
    var key = 'tree' + v;
    if (cache[key]) return cache[key];
    var con = v < 4, R = G.rng(900 + v * 17), w = 70, h = con ? 104 : 96, s = mk(w, h), g = s.g, ax = 28, ay = h - 12;
    g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(15,10,5,0.3)'; g.beginPath(); g.ellipse(ax + 17, ay + 4, 21, 7.5, 0.18, 0, 6.3); g.fill(); g.restore();
    if (con) {
      var tg = g.createLinearGradient(ax - 3, 0, ax + 3, 0); tg.addColorStop(0, '#7a5232'); tg.addColorStop(1, '#3e2814');
      g.fillStyle = tg; g.fillRect(ax - 2.6, ay - 14, 5.2, 14);
      var layers = 5 + (v % 2), baseW = 19 + R() * 4, topY = ay - 80 - R() * 8;
      var hue = [['#447f3c', '#2d5d2c', '#1c3d1d'], ['#3f7a3e', '#2a582d', '#193a1c'], ['#4a8440', '#30612f', '#1e401f'], ['#3c7438', '#28522a', '#183519']][v];
      for (var i = 0; i < layers; i++) {
        var t = i / layers, y0 = ay - 9 - t * (ay - 9 - topY - 14), wv = baseW * (1 - t * 0.8), hh = 21 - t * 6;
        var gr = g.createLinearGradient(ax - wv, 0, ax + wv, 0);
        gr.addColorStop(0, hue[0]); gr.addColorStop(0.45, hue[1]); gr.addColorStop(1, hue[2]);
        g.fillStyle = gr; g.beginPath();
        g.moveTo(ax - wv, y0);
        for (var j = 1; j <= 5; j++) { var f = j / 5; g.lineTo(ax - wv * (1 - f) + (j % 2 ? -2 : 1.5) * (1 - f), y0 - (hh + 5) * f + (j % 2 ? 2.5 : 0)); }
        for (var j2 = 1; j2 <= 5; j2++) { var f2 = j2 / 5; g.lineTo(ax + wv * f2 + (j2 % 2 ? 2 : -1.5) * f2, y0 - (hh + 5) * (1 - f2) + (j2 % 2 ? 2.5 : 0)); }
        g.lineTo(ax + wv * 0.55, y0 + 2.4); g.lineTo(ax, y0 - 0.5); g.lineTo(ax - wv * 0.55, y0 + 2.4);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(15,30,12,0.55)'; g.lineWidth = 0.6; g.stroke();
        for (var nd = 0; nd < 9; nd++) { var nx = ax - wv * 0.8 + R() * wv * 0.9, ny = y0 - R() * hh * 0.8; g.strokeStyle = 'rgba(160,210,120,0.28)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx - 2.5, ny + 1.5); g.stroke(); }
      }
    } else {
      var bark = g.createLinearGradient(ax - 4, 0, ax + 4, 0); bark.addColorStop(0, '#806040'); bark.addColorStop(1, '#3e2a18');
      g.fillStyle = bark; g.beginPath(); g.moveTo(ax - 4, ay); g.lineTo(ax - 2.6, ay - 28); g.lineTo(ax + 2.6, ay - 28); g.lineTo(ax + 4, ay); g.closePath(); g.fill();
      g.strokeStyle = '#4a3220'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax, ay - 22); g.lineTo(ax - 8, ay - 34); g.moveTo(ax + 1, ay - 25); g.lineTo(ax + 9, ay - 36); g.stroke();
      var pal = [['#2f5a20', '#4d8130', '#86b84c'], ['#3a5e1e', '#5a8a2c', '#98c050'], ['#2c5424', '#467a32', '#7cb052'], ['#41601f', '#62902e', '#a6c654']][v - 4];
      var cx = ax, cy = ay - 48, blobs = [];
      for (var b = 0; b < 26; b++) {
        var a = R() * Math.PI * 2, rr = Math.sqrt(R());
        blobs.push([cx + Math.cos(a) * rr * 20, cy + Math.sin(a) * rr * 16 - 2, 6 + R() * 5]);
      }
      blobs.sort(function (p, q) { return (p[1] + p[0] * 0.3) - (q[1] + q[0] * 0.3); });
      g.fillStyle = pal[0]; g.beginPath(); g.ellipse(cx + 2, cy + 3, 23, 18, 0, 0, 6.3); g.fill();
      blobs.forEach(function (p) {
        var lg = g.createRadialGradient(p[0] - p[2] * 0.4, p[1] - p[2] * 0.45, p[2] * 0.1, p[0], p[1], p[2] * 1.05);
        lg.addColorStop(0, pal[2]); lg.addColorStop(0.55, pal[1]); lg.addColorStop(1, pal[0]);
        g.fillStyle = lg; g.beginPath(); g.arc(p[0], p[1], p[2], 0, 6.3); g.fill();
      });
      for (var sp = 0; sp < 14; sp++) { g.fillStyle = 'rgba(210,240,150,0.35)'; g.beginPath(); g.arc(cx - 14 + R() * 18, cy - 14 + R() * 12, 0.9 + R(), 0, 6.3); g.fill(); }
      g.strokeStyle = 'rgba(20,35,10,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(cx + 1, cy + 2, 23.5, 18.5, 0, 0.2, 3.0); g.stroke();
    }
    s.ax = ax; s.ay = ay;
    cache[key] = s;
    return s;
  };

  // ---------- aur, piatră, mure ----------
  Spr.res = function (t) {
    var key = 'res' + t;
    if (cache[key]) return cache[key];
    var s, g, R = G.rng(t.length * 101 + 7), ax, ay;
    if (t === 'gold' || t === 'stone') {
      s = mk(66, 48); g = s.g; ax = 30; ay = 33;
      g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(15,10,5,0.3)'; g.beginPath(); g.ellipse(ax + 6, ay + 2, 24, 9, 0, 0, 6.3); g.fill(); g.restore();
      var rc = t === 'gold' ? '#8e7e5c' : '#a3a29b';
      [[-12, -2, 11], [10, -1, 12], [-1, -10, 13], [13, -11, 8], [-14, -12, 7], [2, 2, 8]].forEach(function (r, i) {
        var cx = ax + r[0], cy = ay + r[1], rr = r[2], pts = [];
        for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2, d = rr * (0.75 + R() * 0.3); pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.64]); }
        var lg = g.createLinearGradient(cx - rr, cy - rr * 0.6, cx + rr, cy + rr * 0.6);
        lg.addColorStop(0, shade(rc, 0.28)); lg.addColorStop(0.5, shade(rc, (i % 3) * 0.04)); lg.addColorStop(1, shade(rc, -0.35));
        g.fillStyle = lg; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(30,22,14,0.55)'; g.lineWidth = 0.6; g.stroke();
        g.strokeStyle = 'rgba(40,30,20,0.35)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx - rr * 0.3, cy - rr * 0.2); g.lineTo(cx + rr * 0.1, cy + rr * 0.15); g.lineTo(cx + rr * 0.4, cy); g.stroke();
      });
      for (var j = 0; j < 18; j++) {
        var px = ax + (R() - 0.5) * 38, py = ay - 3 - R() * 16;
        if (t === 'gold') {
          var ng = g.createRadialGradient(px - 0.6, py - 0.6, 0.2, px, py, 2.4); ng.addColorStop(0, '#fff3b0'); ng.addColorStop(0.5, '#f0c53a'); ng.addColorStop(1, '#a87a10');
          g.fillStyle = ng; g.beginPath(); g.ellipse(px, py, 2.3 + R(), 1.6, R(), 0, 6.3); g.fill();
        } else { g.fillStyle = R() < 0.5 ? '#dcdad3' : '#7d7c77'; g.beginPath(); g.ellipse(px, py, 1.8 + R(), 1.2, R(), 0, 6.3); g.fill(); }
      }
      if (t === 'gold') for (var sp = 0; sp < 5; sp++) { var sx = ax + (R() - 0.5) * 30, sy = ay - 6 - R() * 12; g.strokeStyle = 'rgba(255,255,230,0.9)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(sx - 2, sy); g.lineTo(sx + 2, sy); g.moveTo(sx, sy - 2); g.lineTo(sx, sy + 2); g.stroke(); }
    } else {
      s = mk(48, 40); g = s.g; ax = 22; ay = 30;
      g.save(); g.filter = 'blur(1.5px)'; g.fillStyle = 'rgba(15,10,5,0.28)'; g.beginPath(); g.ellipse(ax + 6, ay + 1, 16, 6, 0, 0, 6.3); g.fill(); g.restore();
      var bl = [];
      for (var b = 0; b < 16; b++) { var a = R() * Math.PI * 2, rr2 = Math.sqrt(R()); bl.push([ax + Math.cos(a) * rr2 * 11, ay - 9 + Math.sin(a) * rr2 * 7, 4 + R() * 3]); }
      bl.sort(function (p, q) { return p[1] - q[1]; });
      bl.forEach(function (p) {
        var lg2 = g.createRadialGradient(p[0] - 1.5, p[1] - 1.8, 0.4, p[0], p[1], p[2]);
        lg2.addColorStop(0, '#78b04e'); lg2.addColorStop(0.6, '#3f7a30'); lg2.addColorStop(1, '#244a1c');
        g.fillStyle = lg2; g.beginPath(); g.arc(p[0], p[1], p[2], 0, 6.3); g.fill();
      });
      for (var bb = 0; bb < 20; bb++) {
        var bx = ax + (R() - 0.5) * 22, by = ay - 4 - R() * 13;
        g.fillStyle = R() < 0.65 ? '#1d0f26' : '#5a2468'; g.beginPath(); g.arc(bx, by, 1.5, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(bx - 0.7, by - 0.8, 0.6, 0.6);
      }
    }
    s.ax = ax; s.ay = ay;
    cache[key] = s;
    return s;
  };
})();
