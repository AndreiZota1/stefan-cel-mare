// Terenul desenat pixel cu pixel: iarbă, pământ, nisip, apă cu adâncime, relief, flori, podul.
// Se calculează pe bucăți de 256 px, păstrate în memorie. Plus ceața cu margini moi, valurile și norii.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var T = G.Terrain = {};
  var CS = 256, MAXC = 190;
  var cache = new Map(), frameNo = 0;
  var N = 0, V = 0, F = null, shore = [], waterTiles = null;
  var NT = 256, nLow, nMid, nDet, grain;
  var curK = 0, prevK = 0, wantK = 0, wantSince = 0, lastMissing = 0;

  // ---------- zgomot repetabil, precalculat ----------
  function table(periods, weights, seed) {
    var t = new Float32Array(NT * NT), R = G.rng(seed);
    periods.forEach(function (p, pi) {
      var lat = new Float32Array(p * p), L = NT / p, w = weights[pi];
      for (var i = 0; i < lat.length; i++) lat[i] = R();
      for (var y = 0; y < NT; y++) {
        var fy = y / L, y0 = Math.floor(fy), ty = fy - y0, v = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % p;
        for (var x = 0; x < NT; x++) {
          var fx = x / L, x0 = Math.floor(fx), tx = fx - x0, u = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % p;
          var a = lat[y0 * p + x0], b = lat[y0 * p + x1], c = lat[y1 * p + x0], d = lat[y1 * p + x1];
          t[y * NT + x] += w * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
        }
      }
    });
    return t;
  }
  function initNoise() {
    if (nLow) return;
    nLow = table([4, 8, 16], [0.55, 0.3, 0.15], 11);
    nMid = table([16, 32, 64], [0.5, 0.3, 0.2], 23);
    nDet = table([64, 128], [0.62, 0.38], 37);
    grain = new Float32Array(NT * NT);
    var R = G.rng(51);
    for (var i = 0; i < grain.length; i++) grain[i] = R();
  }
  function bil(t, u, v) {
    u -= Math.floor(u / NT) * NT; v -= Math.floor(v / NT) * NT;
    var x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 255;
    var a = t[y0 * NT + x0], b = t[y0 * NT + x1], c = t[y1 * NT + x0], d = t[y1 * NT + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function sm(e0, e1, x) { var t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  // ---------- câmpurile din vârfurile pătrățelelor ----------
  T.build = function () {
    initNoise();
    var S = G.S; N = S.N; V = N + 1;
    var ter = S.ter, M = V * V, i;
    F = { d: new Float32Array(M), w: new Float32Array(M), f: new Float32Array(M), dep: new Float32Array(M), fo: new Float32Array(M), sh: new Float32Array(M) };
    // adâncimea apei = distanța până la mal
    var dist = new Float32Array(N * N), q = [];
    for (i = 0; i < N * N; i++) { if (ter[i] === 2 || ter[i] === 4) dist[i] = 1e9; else { dist[i] = 0; q.push(i); } }
    for (var qi = 0; qi < q.length; qi++) {
      var c = q[qi], cx = c % N, cy = (c - cx) / N;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
        var nx = cx + dd[0], ny = cy + dd[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        var k = ny * N + nx;
        if (dist[k] > dist[c] + 1) { dist[k] = dist[c] + 1; q.push(k); }
      });
    }
    var forest = new Float32Array(N * N);
    S.ents.forEach(function (e) { if (e.k === 'r' && e.t === 'tree') forest[e.ty * N + e.tx] = 1; });
    for (var vy = 0; vy < V; vy++) for (var vx = 0; vx < V; vx++) {
      var cnt = 0, cd = 0, cw = 0, cf = 0, dep = 0, fo = 0;
      for (var dy = -1; dy <= 0; dy++) for (var dx = -1; dx <= 0; dx++) {
        var tx = vx + dx, ty = vy + dy;
        if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
        var k2 = ty * N + tx, tt = ter[k2];
        cnt++;
        if (tt === 1) cd++;
        if (tt === 2 || tt === 4) { cw++; dep += dist[k2]; }
        if (tt === 3) cf++;
        fo += forest[k2];
      }
      var j = vy * V + vx;
      F.d[j] = cd / cnt; F.w[j] = cw / cnt; F.f[j] = cf / cnt; F.dep[j] = dep / cnt; F.fo[j] = fo / cnt;
      var h1 = bil(nLow, vx * 4 - 3, vy * 4), h2 = bil(nLow, vx * 4 + 3, vy * 4), h3 = bil(nLow, vx * 4, vy * 4 - 3), h4 = bil(nLow, vx * 4, vy * 4 + 3);
      F.sh[j] = 1 + ((h1 - h2) * 0.6 + (h3 - h4) * 0.35) * 1.15;
    }
    // malurile, pentru spuma animată
    shore = []; waterTiles = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var t = ter[y * N + x];
      if (t === 2) waterTiles.push(y * N + x);
      if (t > 1) continue;
      var ph = G.hash2(x, y, 5) * 6.28;
      if (y > 0 && ter[(y - 1) * N + x] === 2) shore.push([x, y - 0.12, x + 1, y - 0.12, ph]);
      if (x < N - 1 && ter[y * N + x + 1] === 2) shore.push([x + 1.12, y, x + 1.12, y + 1, ph]);
      if (y < N - 1 && ter[(y + 1) * N + x] === 2) shore.push([x, y + 1.12, x + 1, y + 1.12, ph]);
      if (x > 0 && ter[y * N + x - 1] === 2) shore.push([x - 0.12, y, x - 0.12, y + 1, ph]);
    }
    cache.clear(); curK = 0;
    initFog();
  };

  // ---------- o bucată de teren ----------
  function genChunk(k, cx, cy) {
    var c = document.createElement('canvas'); c.width = CS; c.height = CS;
    var g = c.getContext('2d'), img = g.createImageData(CS, CS), d = img.data;
    var offX = N * 32 * k, X0 = cx * CS, Y0 = cy * CS, i32 = 1 / (32 * k), i16 = 1 / (16 * k);
    var Fd = F.d, Fw = F.w, Ff = F.f, Fdep = F.dep, Ffo = F.fo, Fsh = F.sh, Nm = N - 0.001;
    // culoarea de bază se calculează o dată la 2x2 pixeli; granulația rămâne pe fiecare pixel
    for (var py = 0; py < CS; py += 2) {
      var Yc = Y0 + py + 1, b = Yc * i16;
      for (var px = 0; px < CS; px += 2) {
        var Xc = X0 + px + 1, a = (Xc - offX) * i32;
        var x = (a + b) * 0.5, y = (b - a) * 0.5;
        if (x < -0.05 || y < -0.05 || x >= N + 0.05 || y >= N + 0.05) continue;
        var nm = bil(nMid, x * 9, y * 9), nm2 = bil(nMid, x * 9 + 131, y * 9 + 57);
        var sx = x + (nm - 0.5) * 0.75, sy = y + (nm2 - 0.5) * 0.75;
        if (sx < 0) sx = 0; else if (sx > Nm) sx = Nm;
        if (sy < 0) sy = 0; else if (sy > Nm) sy = Nm;
        var ix = sx | 0, iy = sy | 0, fx = sx - ix, fy = sy - iy;
        var j0 = iy * V + ix, j1 = j0 + 1, j2 = j0 + V, j3 = j2 + 1;
        var w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
        var ww = Fw[j0] * w0 + Fw[j1] * w1 + Fw[j2] * w2 + Fw[j3] * w3;
        var wd = Fd[j0] * w0 + Fd[j1] * w1 + Fd[j2] * w2 + Fd[j3] * w3;
        var wf = Ff[j0] * w0 + Ff[j1] * w1 + Ff[j2] * w2 + Ff[j3] * w3;
        var fo = Ffo[j0] * w0 + Ffo[j1] * w1 + Ffo[j2] * w2 + Ffo[j3] * w3;
        var sh = Fsh[j0] * w0 + Fsh[j1] * w1 + Fsh[j2] * w2 + Fsh[j3] * w3;
        var nl = bil(nLow, x * 4, y * 4), nd = bil(nDet, x * 28, y * 28);
        var r = 70 + 46 * nl, gg = 110 + 36 * nl, bb = 40 + 12 * nl;
        if (nd > 0.6) { var q = (nd - 0.6) * 2.5; r -= 18 * q; gg -= 9 * q; bb -= 7 * q; }
        else if (nd < 0.32) { var q2 = (0.32 - nd) * 2.2; r += 12 * q2; gg += 11 * q2; bb += 3 * q2; }
        if (fo > 0.01) { var fq = Math.min(1, fo * 1.5) * 0.72; r += (64 - r) * fq; gg += (80 - gg) * fq; bb += (36 - bb) * fq; }
        if (wd > 0.01) {
          var dm = sm(0.15, 0.55, wd + (nm - 0.5) * 0.5);
          var dr = 136 + 26 * nl, dg = 108 + 20 * nl, db = 72 + 12 * nl;
          if (nd > 0.7) { dr += 16; dg += 14; db += 12; } else if (nd < 0.3) { dr -= 12; dg -= 10; db -= 8; }
          r += (dr - r) * dm; gg += (dg - gg) * dm; bb += (db - bb) * dm;
        }
        r *= sh; gg *= sh; bb *= sh;
        var wet = ww + wf, stones = 0;
        if (wet > 0.02) {
          var sand = sm(0.05, 0.3, wet + (nm - 0.5) * 0.3);
          r += (192 - r) * sand * 0.85; gg += (174 - gg) * sand * 0.85; bb += (126 - bb) * sand * 0.85;
          var wm = sm(0.3, 0.58, ww + (nm - 0.5) * 0.22);
          if (wm > 0) {
            var dep = Fdep[j0] * w0 + Fdep[j1] * w1 + Fdep[j2] * w2 + Fdep[j3] * w3, dd = sm(0, 2.6, dep), rip = (nd - 0.5) * 12;
            var wr = 72 - 40 * dd + rip, wg = 128 - 54 * dd + rip, wb = 158 - 34 * dd + rip * 0.7;
            r += (wr - r) * wm; gg += (wg - gg) * wm; bb += (wb - bb) * wm;
          }
          var fm = sm(0.3, 0.65, wf + (nm - 0.5) * 0.2);
          if (fm > 0) {
            var fr = 108 + (nd - 0.5) * 34, fg = 148 + (nd - 0.5) * 26, fb = 158 + (nd - 0.5) * 10;
            r += (fr - r) * fm; gg += (fg - gg) * fm; bb += (fb - bb) * fm;
            stones = fm;
          }
        }
        for (var oy = 0; oy < 2; oy++) {
          var Yp = Y0 + py + oy + 0.5, gy = ((Yp | 0) & 255) * 256, bp = Yp * i16;
          for (var ox = 0; ox < 2; ox++) {
            var Xp = X0 + px + ox + 0.5, ap = (Xp - offX) * i32, xx = (ap + bp) * 0.5, yy = (bp - ap) * 0.5;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
            var o = ((py + oy) * CS + px + ox) << 2, gr = grain[gy + ((Xp | 0) & 255)], gv = (gr - 0.5) * 13;
            if (stones > 0.5 && gr > 0.962) { d[o] = 122; d[o + 1] = 118; d[o + 2] = 108; d[o + 3] = 255; continue; }
            d[o] = r + gv; d[o + 1] = gg + gv; d[o + 2] = bb + gv * 0.7; d[o + 3] = 255;
          }
        }
      }
    }
    g.putImageData(img, 0, 0);
    decals(g, k, X0, Y0, offX);
    return c;
  }

  // flori, smocuri, pietricele și podul, desenate peste textură
  var FLOWERS = ['#d8392b', '#f3efe4', '#e8d24a', '#5b7bd8', '#a060c0', '#d8392b'];
  function decals(g, k, X0, Y0, offX) {
    var S = G.S, ter = S.ter;
    var pts = [[X0, Y0], [X0 + CS, Y0], [X0, Y0 + CS], [X0 + CS, Y0 + CS]].map(function (p) {
      var a = (p[0] - offX) / (32 * k), b = p[1] / (16 * k); return [(a + b) / 2, (b - a) / 2];
    });
    var mx0 = Math.max(0, Math.floor(Math.min(pts[0][0], pts[2][0])) - 1), mx1 = Math.min(N - 1, Math.ceil(Math.max(pts[1][0], pts[3][0])) + 1);
    var my0 = Math.max(0, Math.floor(Math.min(pts[0][1], pts[1][1])) - 1), my1 = Math.min(N - 1, Math.ceil(Math.max(pts[2][1], pts[3][1])) + 1);
    function P(x, y) { return [(x - y) * 32 * k + offX - X0, (x + y) * 16 * k - Y0]; }
    g.lineCap = 'round';
    for (var ty = my0; ty <= my1; ty++) for (var tx = mx0; tx <= mx1; tx++) {
      var t = ter[ty * N + tx];
      var c = P(tx + 0.5, ty + 0.5);
      if (c[0] < -70 * k || c[0] > CS + 70 * k || c[1] < -40 * k || c[1] > CS + 40 * k) continue;
      if (t === 4) { bridgeTile(g, k, P, tx, ty, ter); continue; }
      if (t > 1) continue;
      var nearW = false;
      for (var a = -1; a <= 1 && !nearW; a++) for (var b2 = -1; b2 <= 1; b2++) {
        var nx = tx + a, ny = ty + b2;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && ter[ny * N + nx] >= 2) { nearW = true; break; }
      }
      var h = G.hash2(tx, ty, 17);
      if (t === 0) {
        var nt = 3 + ((h * 4) | 0);
        for (var i = 0; i < nt; i++) {
          var hx = G.hash2(tx * 7 + i, ty * 3, 19), hy = G.hash2(tx * 5, ty * 11 + i, 23);
          var p = P(tx + hx, ty + hy);
          var dark = G.hash2(tx + i, ty, 29) < 0.6;
          g.strokeStyle = dark ? 'rgba(38,70,22,0.55)' : 'rgba(150,192,88,0.5)'; g.lineWidth = 0.8 * k;
          g.beginPath();
          for (var s = -1; s <= 1; s++) { g.moveTo(p[0] + s * 1.2 * k, p[1]); g.lineTo(p[0] + s * 2.4 * k, p[1] - (3 + Math.abs(s)) * k); }
          g.stroke();
        }
        if (!nearW && h > 0.62) {
          var fc = FLOWERS[(G.hash2(tx, ty, 31) * FLOWERS.length) | 0], nf = 2 + ((h * 10) | 0) % 4;
          for (var f = 0; f < nf; f++) {
            var p2 = P(tx + G.hash2(tx, ty * 2 + f, 37), ty + G.hash2(tx * 2 + f, ty, 41));
            g.fillStyle = 'rgba(30,50,20,0.35)'; g.beginPath(); g.arc(p2[0], p2[1] + 0.5 * k, 1.1 * k, 0, 6.3); g.fill();
            g.fillStyle = fc; g.beginPath(); g.arc(p2[0], p2[1], 1.05 * k, 0, 6.3); g.fill();
          }
        }
      } else {
        var np = (h * 4) | 0;
        for (var j = 0; j < np; j++) {
          var p3 = P(tx + G.hash2(tx, ty + j, 43), ty + G.hash2(tx + j, ty, 47)), rr = (0.9 + G.hash2(tx, ty, 53 + j)) * k;
          g.fillStyle = 'rgba(60,48,36,0.5)'; g.beginPath(); g.ellipse(p3[0] + 0.4 * k, p3[1] + 0.5 * k, rr * 1.3, rr * 0.8, 0, 0, 6.3); g.fill();
          g.fillStyle = '#9a8f7e'; g.beginPath(); g.ellipse(p3[0], p3[1], rr * 1.2, rr * 0.75, 0, 0, 6.3); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(p3[0] - 0.3 * k, p3[1] - 0.3 * k, rr * 0.6, rr * 0.35, 0, 0, 6.3); g.fill();
        }
      }
    }
  }
  function bridgeTile(g, k, P, tx, ty, ter) {
    var A = P(tx, ty), B = P(tx + 1, ty), C = P(tx + 1, ty + 1), D = P(tx, ty + 1);
    g.save();
    g.beginPath(); g.moveTo(A[0], A[1] - 0.5); g.lineTo(B[0] + 0.5, B[1]); g.lineTo(C[0], C[1] + 0.5); g.lineTo(D[0] - 0.5, D[1]); g.closePath(); g.clip();
    var top = A[1], bot = C[1], left = D[0], right = B[0], ph = 3.6 * k;
    for (var y = top, n = 0; y < bot; y += ph, n++) {
      var hv = G.hash2(tx * 13 + n, ty, 61);
      g.fillStyle = 'rgb(' + ((128 + hv * 26) | 0) + ',' + ((92 + hv * 20) | 0) + ',' + ((56 + hv * 12) | 0) + ')';
      g.fillRect(left, y, right - left, ph);
      g.fillStyle = 'rgba(40,24,10,0.55)'; g.fillRect(left, y + ph - 0.7 * k, right - left, 0.7 * k);
    }
    g.restore();
    // balustrade pe marginile dinspre apă
    g.strokeStyle = '#4a3220'; g.lineWidth = 1.4 * k;
    function rail(p, q) {
      g.strokeStyle = 'rgba(10,20,30,0.35)'; g.lineWidth = 2.2 * k; g.beginPath(); g.moveTo(p[0] + 3 * k, p[1] + 2 * k); g.lineTo(q[0] + 3 * k, q[1] + 2 * k); g.stroke();
      g.strokeStyle = '#5a3c22'; g.lineWidth = 1.3 * k;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 6 * k); g.moveTo(q[0], q[1]); g.lineTo(q[0], q[1] - 6 * k); g.stroke();
      g.beginPath(); g.moveTo(p[0], p[1] - 6 * k); g.lineTo(q[0], q[1] - 6 * k); g.moveTo(p[0], p[1] - 3 * k); g.lineTo(q[0], q[1] - 3 * k); g.stroke();
    }
    var w = function (x, y) { return x >= 0 && y >= 0 && x < N && y < N && ter[y * N + x] === 2; };
    if (w(tx, ty - 1)) rail(A, B);
    if (w(tx + 1, ty)) rail(B, C);
    if (w(tx, ty + 1)) rail(D, C);
    if (w(tx - 1, ty)) rail(A, D);
  }

  // ---------- desenarea bucăților ----------
  function inMap(k, cx, cy) {
    var cxm = N * 32 * k, cym = N * 16 * k;
    var x0 = cx * CS, y0 = cy * CS, x1 = x0 + CS, y1 = y0 + CS;
    var nx = Math.max(x0, Math.min(cxm, x1)), ny = Math.max(y0, Math.min(cym, y1));
    return Math.abs(nx - cxm) / cxm + Math.abs(ny - cym) / cym <= 1.02;
  }
  // bucata are măcar un pătrățel descoperit? (restul stă oricum sub ceață)
  function explored(k, cx, cy) {
    var exp = G.S.exp, offX = N * 32 * k, X0 = cx * CS, Y0 = cy * CS;
    var pts = [[X0, Y0], [X0 + CS, Y0], [X0, Y0 + CS], [X0 + CS, Y0 + CS]].map(function (p) {
      var a = (p[0] - offX) / (32 * k), b = p[1] / (16 * k); return [(a + b) / 2, (b - a) / 2];
    });
    var x0 = Math.max(0, Math.floor(Math.min(pts[0][0], pts[2][0])) - 1), x1 = Math.min(N - 1, Math.ceil(Math.max(pts[1][0], pts[3][0])) + 1);
    var y0 = Math.max(0, Math.floor(Math.min(pts[0][1], pts[1][1])) - 1), y1 = Math.min(N - 1, Math.ceil(Math.max(pts[2][1], pts[3][1])) + 1);
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (exp[y * N + x]) return true;
    return false;
  }
  function pass(ctx, cam, W, H, DPR, k, gen, budgetEnd, draw, margin) {
    var zd = cam.z * DPR, s = zd / k, offX = N * 32 * k;
    var Xc = (cam.x - cam.y) * 32 * k + offX, Yc = (cam.x + cam.y) * 16 * k, Wd = W * DPR, Hd = H * DPR;
    var cx0 = Math.max(0, Math.floor((Xc - Wd / 2 / s) / CS) - margin), cx1 = Math.min(Math.ceil(N * 64 * k / CS) - 1, Math.floor((Xc + Wd / 2 / s) / CS) + margin);
    var cy0 = Math.max(0, Math.floor((Yc - Hd / 2 / s) / CS) - margin), cy1 = Math.min(Math.ceil(N * 32 * k / CS) - 1, Math.floor((Yc + Hd / 2 / s) / CS) + margin);
    var missing = 0;
    for (var cy = cy0; cy <= cy1; cy++) for (var cx = cx0; cx <= cx1; cx++) {
      if (!inMap(k, cx, cy)) continue;
      var key = k + ':' + cx + ':' + cy, ch = cache.get(key);
      if (!ch) {
        if (!explored(k, cx, cy)) continue;
        if (!gen || performance.now() > budgetEnd) { missing++; continue; }
        ch = { c: genChunk(k, cx, cy), used: frameNo };
        cache.set(key, ch);
      }
      ch.used = frameNo;
      if (draw) {
        var dx = Math.floor((cx * CS - Xc) * s + Wd / 2), dy = Math.floor((cy * CS - Yc) * s + Hd / 2), dw = Math.ceil(CS * s) + 1;
        ctx.drawImage(ch.c, dx, dy, dw, dw);
      }
    }
    return missing;
  }
  T.draw = function (ctx, cam, W, H, DPR) {
    if (!F) return;
    frameNo++;
    var zd = cam.z * DPR, kd = zd <= 1.25 ? 1 : zd <= 2.45 ? 2 : 3, now = performance.now();
    if (!curK) { curK = kd; wantK = kd; }
    if (kd !== wantK) { wantK = kd; wantSince = now; }
    if (wantK !== curK && now - wantSince > 220) { prevK = curK; curK = wantK; lastMissing = 1; }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (lastMissing) {
      [prevK, 1, 2, 3].forEach(function (kk, i) { if (kk && kk !== curK && (i === 0 || kk !== prevK)) pass(ctx, cam, W, H, DPR, kk, false, 0, true, 0); });
    }
    lastMissing = pass(ctx, cam, W, H, DPR, curK, true, now + 10, true, 0);
    if (!lastMissing) pass(ctx, cam, W, H, DPR, curK, true, now + 5, false, 1);
    ctx.restore();
    if (cache.size > MAXC) {
      var arr = Array.from(cache.entries()).sort(function (a, b) { return a[1].used - b[1].used; });
      for (var i = 0; i < arr.length - MAXC * 0.8; i++) cache.delete(arr[i][0]);
    }
  };
  T.prewarm = function (cam, W, H, DPR) {
    if (!F) return;
    var zd = cam.z * DPR, k = zd <= 1.25 ? 1 : zd <= 2.45 ? 2 : 3;
    curK = wantK = k;
    pass(null, cam, W, H, DPR, k, true, performance.now() + 4000, false, 0);
  };

  // ---------- apa vie: spumă la mal și sclipiri ----------
  T.water = function (ctx, cam, W, H, t) {
    if (!F) return;
    var S = G.S, vis = G.C.vis, z = cam.z;
    var ox = W / 2 - (cam.x - cam.y) * 32 * z, oy = H / 2 - (cam.x + cam.y) * 16 * z;
    function sx(x, y) { return ox + (x - y) * 32 * z; }
    function sy(x, y) { return oy + (x + y) * 16 * z; }
    ctx.lineCap = 'round';
    for (var i = 0; i < 0; i++) {
      var s = shore[i], mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
      var px = sx(mx, my), py = sy(mx, my);
      if (px < -40 || px > W + 40 || py < -20 || py > H + 20) continue;
      if (!S.exp[Math.floor(my) * N + Math.floor(mx)] && !S.exp[Math.min(N * N - 1, Math.floor(my + 0.5) * N + Math.floor(mx + 0.5))]) continue;
      var a = 0.2 + 0.16 * Math.sin(t * 1.6 + s[4]);
      ctx.strokeStyle = 'rgba(240,248,255,' + a.toFixed(3) + ')'; ctx.lineWidth = 1.5 * z;
      ctx.beginPath(); ctx.moveTo(sx(s[0], s[1]), sy(s[0], s[1])); ctx.lineTo(sx(s[2], s[3]), sy(s[2], s[3])); ctx.stroke();
    }
    var c0 = G.R.s2w(0, 0), c3 = G.R.s2w(W, H);
    for (var j = 0; j < waterTiles.length; j++) {
      var k = waterTiles[j], x = k % N, y = (k - x) / N;
      var qx = sx(x + 0.5, y + 0.5), qy = sy(x + 0.5, y + 0.5);
      if (qx < -40 || qx > W + 40 || qy < -20 || qy > H + 20 || !vis[k]) continue;
      for (var m = 0; m < 2; m++) {
        var hh = G.hash2(x, y, 71 + m), ph = Math.sin(t * (1.1 + hh) + hh * 40);
        if (ph < 0.55) continue;
        var al = (ph - 0.55) * 1.4;
        var ex = qx + (G.hash2(x, y, 73 + m) - 0.5) * 40 * z, ey = qy + (G.hash2(x, y, 79 + m) - 0.5) * 18 * z;
        ctx.fillStyle = 'rgba(255,255,255,' + (al * 0.55).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(ex, ey, 4 * z * (0.6 + al), 0.9 * z, 0, 0, 6.3); ctx.fill();
      }
    }
  };

  // ---------- umbre de nori ----------
  var clouds = null;
  T.clouds = function (ctx, cam, W, H, t) {
    if (!F) return;
    if (!clouds) {
      clouds = []; var R = G.rng(77);
      for (var i = 0; i < 8; i++) {
        var parts = [], np = 3 + ((R() * 3) | 0);
        for (var p = 0; p < np; p++) parts.push([(R() - 0.5) * 7, (R() - 0.5) * 7, 3 + R() * 4]);
        clouds.push({ x: R() * (N + 30) - 15, y: R() * (N + 30) - 15, parts: parts });
      }
    }
    var z = cam.z, span = N + 40;
    ctx.save();
    clouds.forEach(function (c) {
      var x = ((c.x + t * 0.22) % span + span) % span - 20, y = ((c.y + t * 0.07) % span + span) % span - 20;
      c.parts.forEach(function (p) {
        var s = G.R.w2s(x + p[0], y + p[1]), r = p[2] * 32 * z * 1.4;
        if (s[0] < -r * 2 || s[0] > W + r * 2 || s[1] < -r || s[1] > H + r) return;
        var gr = ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], r);
        gr.addColorStop(0, 'rgba(18,22,38,0.13)'); gr.addColorStop(1, 'rgba(18,22,38,0)');
        ctx.fillStyle = gr;
        ctx.setTransform(ctx.getTransform().a, 0, 0, ctx.getTransform().d * 0.55, 0, 0);
        ctx.beginPath(); ctx.arc(s[0], s[1] / 0.55, r, 0, 6.3); ctx.fill();
        ctx.setTransform(ctx.getTransform().a, 0, 0, ctx.getTransform().d / 0.55, 0, 0);
      });
    });
    ctx.restore();
  };

  // ---------- ceața cu margini moi ----------
  var FS = 4, fogC, fogX, fogB, fogBX, fogImg;
  function initFog() {
    fogC = document.createElement('canvas'); fogC.width = fogC.height = N;
    fogX = fogC.getContext('2d'); fogImg = fogX.createImageData(N, N);
    fogB = document.createElement('canvas'); fogB.width = fogB.height = N * FS;
    fogBX = fogB.getContext('2d');
  }
  T.fogUpdate = function () {
    if (!fogC) return;
    var S = G.S, vis = G.C.vis, exp = S.exp, d = fogImg.data;
    for (var i = 0; i < N * N; i++) {
      var o = i << 2;
      d[o] = 8; d[o + 1] = 7; d[o + 2] = 6; d[o + 3] = !exp[i] ? 255 : vis[i] ? 0 : 122;
    }
    fogX.putImageData(fogImg, 0, 0);
    fogBX.clearRect(0, 0, fogB.width, fogB.height);
    fogBX.imageSmoothingEnabled = true;
    fogBX.filter = 'blur(' + (FS * 0.6) + 'px)';
    fogBX.drawImage(fogC, 0, 0, fogB.width, fogB.height);
    fogBX.filter = 'none';
  };
  T.fogDraw = function (ctx, cam, W, H, DPR) {
    if (!fogB) return;
    var z = cam.z, ex = W / 2 - (cam.x - cam.y) * 32 * z, ey = H / 2 - (cam.x + cam.y) * 16 * z, f = 1 / FS;
    ctx.save();
    ctx.setTransform(DPR * 32 * z * f, DPR * 16 * z * f, -DPR * 32 * z * f, DPR * 16 * z * f, DPR * ex, DPR * ey);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fogB, 0, 0);
    ctx.restore();
  };

  // ---------- umbrirea marginilor ecranului ----------
  var vig = null, vigW = 0, vigH = 0;
  T.vignette = function (ctx, W, H) {
    if (!vig || vigW !== W || vigH !== H) {
      vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(10,6,2,0.42)');
      vigW = W; vigH = H;
    }
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  };
})();
