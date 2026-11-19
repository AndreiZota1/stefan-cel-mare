// Generarea hărților: 5 tipuri (râu, codri, stepă, deltă, munți), 3 mărimi, 2–4 jucători.
// Bazele sunt simetrice (2 jucători: față de centru; 4: rotite cu câte un sfert de cerc), ca nimeni să nu fie avantajat.
// Plus pictorul de hărți pentru misiuni (G.genMapSpec).
var G = globalThis.G || (globalThis.G = {});

G.T = { GRASS: 0, DIRT: 1, WATER: 2, FORD: 3, BRIDGE: 4, ROCK: 5, SAND: 6, MARSH: 7 };
G.PASS_T = [1, 1, 0, 1, 1, 0, 1, 1];
G.BUILD_T = [1, 1, 0, 0, 0, 0, 1, 0];
G.SLOW_T = [0, 0, 0, 0.8, 0, 0, 0, 0.7];     // vadul și mlaștina încetinesc
G.TCOL = [[96, 140, 58], [152, 128, 88], [50, 96, 150], [88, 138, 178], [128, 98, 60], [118, 112, 104], [212, 192, 136], [86, 110, 66]];
G.TCOL_IARNA = [[222, 228, 236], [170, 164, 156], [66, 96, 130], [150, 176, 200], [128, 98, 60], [140, 140, 146], [214, 208, 192], [168, 178, 174]];

G.rng = function (seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

G.hash2 = function (x, y, s) {
  var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

(function () {
  'use strict';
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = G.hash2(xi, yi, s), b = G.hash2(xi + 1, yi, s), c = G.hash2(xi, yi + 1, s), d = G.hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) {
    return vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.28 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.12;
  }
  G.fbm = fbm;
  var T = G.T, GR = 0, DI = 1, WA = 2, FO = 3, BR = 4, RO = 5, SA = 6, MA = 7;

  // ---------- unealta comună: grila, obiectele, desenatul ----------
  function Canvas(N, seed) {
    var C = { N: N, ter: new Uint8Array(N * N), blk: new Uint8Array(N * N), objs: [], decor: [], R: G.rng(seed), seed: seed };
    C.ok = function (x, y) { return x >= 0 && y >= 0 && x < N && y < N; };
    C.get = function (x, y) { return C.ok(x, y) ? C.ter[y * N + x] : RO; };
    C.set = function (x, y, t) { if (C.ok(x, y)) C.ter[y * N + x] = t; };
    C.free = function (x, y) { return C.ok(x, y) && !C.blk[y * N + x] && G.BUILD_T[C.ter[y * N + x]]; };
    C.put = function (t, x, y) { if (!C.free(x, y)) return false; C.blk[y * N + x] = t === 'tree' ? 1 : 2; C.objs.push({ t: t, x: x, y: y }); return true; };
    C.clearObjs = function (fn) { C.objs = C.objs.filter(function (o) { if (fn(o)) { C.blk[o.y * N + o.x] = 0; return false; } return true; }); };
    C.disc = function (cx, cy, r, fn) {
      for (var y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) for (var x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
        if (C.ok(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) fn(x, y);
    };
    C.line = function (pts, w, fn) {
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L * 2));
        for (var k = 0; k <= n; k++) C.disc(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, w / 2, fn);
      }
    };
    // un grup natural de n obiecte, crescut din punctul cel mai apropiat liber
    C.cluster = function (t, cx, cy, n, avoid) {
      var best = null, bd = 1e9;
      for (var dy = -5; dy <= 5; dy++) for (var dx = -5; dx <= 5; dx++) {
        var x = Math.round(cx) + dx, y = Math.round(cy) + dy;
        if (!C.free(x, y) || (avoid && avoid(x, y))) continue;
        var d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) return 0;
      var front = [best], seen = {}, placed = 0;
      while (placed < n && front.length) {
        var p = front.splice(Math.floor(C.R() * front.length), 1)[0], key = p[0] * 1000 + p[1];
        if (seen[key]) continue; seen[key] = 1;
        if (!C.free(p[0], p[1]) || (avoid && avoid(p[0], p[1]))) continue;
        C.put(t, p[0], p[1]); placed++;
        front.push([p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]);
      }
      return placed;
    };
    return C;
  }

  // ---------- simetria ----------
  // 2 jucători: punct față de centru; 4 jucători: rotație cu 90°; 3 jucători: fără
  function symFns(N, nP) {
    var M = N - 1;
    if (nP === 2) return [function (x, y) { return [M - x, M - y]; }];
    if (nP === 4) return [function (x, y) { return [M - y, x]; }, function (x, y) { return [M - x, M - y]; }, function (x, y) { return [y, M - x]; }];
    return [];
  }
  function canonical(N, nP, x, y) {
    var M = N - 1;
    if (nP === 2) return x + y > M || (x + y === M && x >= y);
    if (nP === 4) return x >= N / 2 && y >= N / 2 || (x === y && x >= N / 2);
    return true;
  }
  // copiază zona canonică peste celelalte (teren + obiecte + decor)
  function symmetrize(C, nP) {
    var N = C.N, fns = symFns(N, nP);
    if (!fns.length) return;
    var ter2 = new Uint8Array(C.ter);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (!canonical(N, nP, x, y)) continue;
      fns.forEach(function (f) { var p = f(x, y); ter2[p[1] * N + p[0]] = C.ter[y * N + x]; });
    }
    C.ter = ter2;
    var objs = C.objs.filter(function (o) { return canonical(N, nP, o.x, o.y); }), dec = C.decor.filter(function (d) { return canonical(N, nP, Math.floor(d.x), Math.floor(d.y)); });
    C.blk = new Uint8Array(N * N); C.objs = []; C.decor = [];
    objs.forEach(function (o) {
      var bv = o.t === 'tree' ? 1 : 2;
      C.objs.push(o); C.blk[o.y * N + o.x] = bv;
      fns.forEach(function (f) { var p = f(o.x, o.y); if (!C.blk[p[1] * N + p[0]]) { C.objs.push({ t: o.t, x: p[0], y: p[1] }); C.blk[p[1] * N + p[0]] = bv; } });
    });
    dec.forEach(function (d) { C.decor.push(d); fns.forEach(function (f) { var p = f(d.x, d.y); C.decor.push({ k: d.k, x: p[0], y: p[1] }); }); });
  }

  // ---------- râurile ----------
  // de-a lungul direcției (dx, dy), prin centru; m(s) e impar, ca râul să fie simetric față de centru
  function river(C, dir, w, amp, fords, bridge, ph) {
    var N = C.N, cx = (N - 1) / 2, cy = (N - 1) / 2, nx = -dir[1], ny = dir[0];
    var f1 = 0.06 + C.R() * 0.04, f2 = 0.15 + C.R() * 0.08, a1 = amp, a2 = amp * 0.35;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var px = x + 0.5 - cx - 0.5, py = y + 0.5 - cy - 0.5, s = px * dir[0] + py * dir[1], d = px * nx + py * ny;
      var m = a1 * Math.sin(s * f1 + (ph || 0)) + a2 * Math.sin(s * f2);
      var ww = w * (0.85 + 0.3 * Math.abs(Math.sin(s * 0.11)));
      var off = Math.abs(d - m);
      if (off < ww) {
        var t = WA;
        fords.forEach(function (f) { if (Math.abs(s - f) < 1.8) t = FO; });
        if (bridge !== null && Math.abs(s - bridge) < 1.2) t = BR;
        C.set(x, y, t);
      } else if (off < ww + 1.3 && C.get(x, y) === GR && fbm(x * 0.3, y * 0.3, C.seed + 5) > 0.55) C.set(x, y, SA);
    }
  }
  function stream(C, pts, w, fordEvery) {
    var n = 0;
    C.line(pts, w, function (x, y) { C.set(x, y, WA); });
    // vaduri la intervale
    var tot = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (var k = 0; k < L; k += 1) { tot += 1; if (tot % fordEvery === Math.floor(fordEvery / 2)) C.disc(a[0] + (b[0] - a[0]) * k / L, a[1] + (b[1] - a[1]) * k / L, w / 2 + 1.2, function (x, y) { if (C.get(x, y) === WA) { C.set(x, y, FO); n++; } }); }
    }
    return n;
  }
  function meander(C, a, b, amp, seg) {
    var pts = [], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, ph = C.R() * 6.28;
    for (var i = 0; i <= seg; i++) { var t = i / seg, o = Math.sin(t * Math.PI * 2.2 + ph) * amp * Math.sin(t * Math.PI); pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
    return pts;
  }

  // ---------- locurile bazelor ----------
  function basesFor(N, players) {
    var nP = players.length, m = Math.max(14, Math.round(N * 0.19)), M = N - 1;
    var pos;
    if (nP === 2) pos = [[M - m, M - m], [m, m]];
    else if (nP === 4) pos = [[M - m, M - m], [m, M - m], [m, m], [M - m, m]];
    else {
      var c = M / 2, r = N * 0.36;
      pos = [0, 1, 2].map(function (i) { var a = Math.PI / 4 + i * Math.PI * 2 / 3; return [Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r)]; });
    }
    // coechipierii stau alături: ordonăm jucătorii după echipă
    var order = players.map(function (p, i) { return i; }).sort(function (a, b) { return (players[a].team || 99 + a) - (players[b].team || 99 + b) || a - b; });
    var out = [];
    order.forEach(function (pi, k) { out[pi] = pos[k]; });
    return out;
  }

  // ---------- resursele unei baze (aceleași pentru toți) ----------
  function baseRes(C, b, kind) {
    var N = C.N, cx = (N - 1) / 2, cy = (N - 1) / 2, toC = Math.atan2(cy - b[1], cx - b[0]);
    function near(x, y) { return Math.hypot(x + 0.5 - b[0], y + 0.5 - b[1]) < 6.5; }
    function at(ang, dist) { return [b[0] + Math.cos(toC + ang) * dist, b[1] + Math.sin(toC + ang) * dist]; }
    // loc curat pentru zăcământ: fără copaci, fără apă sau stâncă
    function spot(t, ang, dist, n, r) {
      var p = at(ang, dist);
      C.disc(p[0], p[1], r, function (x, y) { if (near(x, y)) return; var tt = C.get(x, y); if (tt === WA || tt === RO || tt === MA || tt === FO || tt === BR) C.set(x, y, GR); });
      C.clearObjs(function (o) { return o.t === 'tree' && Math.hypot(o.x + 0.5 - p[0], o.y + 0.5 - p[1]) <= r + 0.6; });
      C.cluster(t, p[0], p[1], n, near);
    }
    // totul în fața și în lateralul bazei (în spate e colțul hărții)
    spot('sheep', 0.9, 8, 4, 1.8);
    spot('sheep', -0.9, 8, 4, 1.8);
    spot('berry', 1.6, 9, 6, 2.2);
    spot('gold', -1.6, 10.5, 7, 2.4);
    spot('gold', 0.35, 15, 4, 2);
    spot('stone', -0.45, 12, 5, 2.2);
    spot('stone', 1.15, 15, 4, 2);
    if (kind === 'munti') { spot('gold', 0.95, 18, 5, 2.2); spot('stone', -1.0, 18, 5, 2.2); }
    // vânatul: o turmă de cerbi mai încolo, un mistreț pe o latură
    spot('deer', -1.0, 16, kind === 'stepa' ? 5 : 4, 2.2);
    spot('boar', -2.0, 11.5, 1, 1.4);
    if (kind === 'stepa') spot('sheep', 0, 13, 4, 1.8);
    // dacă ceva n-a încăput, completăm în altă parte, tot în fața bazei
    var want = { gold: 11, stone: 9, sheep: 8, berry: 5 };
    Object.keys(want).forEach(function (t) {
      for (var tries = 0; tries < 12; tries++) {
        var have = C.objs.filter(function (o) { return o.t === t && Math.hypot(o.x + 0.5 - b[0], o.y + 0.5 - b[1]) < 18; }).length;
        if (have >= want[t]) return;
        spot(t, (C.R() - 0.5) * 2.6, 9 + C.R() * 7, Math.min(7, want[t] - have), 2.2);
      }
    });
    var p;
    // pădurea din spatele bazei
    if (kind !== 'codri') {
      for (var k = 0; k < 3; k++) {
        p = at(k === 1 ? Math.PI : (k === 0 ? 1.95 : -1.95), k === 1 ? 10.5 : 11.5);
        C.disc(p[0], p[1], kind === 'stepa' ? 2.6 : 3.4, function (x, y) { if (!near(x, y) && C.R() < 0.82 && Math.hypot(x + 0.5 - b[0], y + 0.5 - b[1]) > 8) C.put('tree', x, y); });
      }
    }
    // vânatul, mai departe
    p = at(0.9, 15); C.cluster('deer', p[0], p[1], 3, near);
    p = at(-1.6, 16); C.cluster('boar', p[0], p[1], 1, near);
  }

  // ---------- drumurile: fiecare bază trebuie să ajungă la toate celelalte ----------
  function reach(C, from) {
    var N = C.N, seen = new Uint8Array(N * N), q = [from[1] * N + from[0]];
    seen[q[0]] = 1;
    for (var i = 0; i < q.length; i++) {
      var c = q[i], x = c % N, y = (c - x) / N;
      for (var d = 0; d < 4; d++) {
        var nx = x + [1, -1, 0, 0][d], ny = y + [0, 0, 1, -1][d];
        if (!C.ok(nx, ny)) continue;
        var k = ny * N + nx;
        if (seen[k] || !G.PASS_T[C.ter[k]] || C.blk[k] === 2) continue;
        if (C.blk[k] === 1) continue; // copacii opresc drumul
        seen[k] = 1; q.push(k);
      }
    }
    return seen;
  }
  // taie drum de la a la b: apa devine vad, stânca drum, copacii dispar (cât mai puțin)
  function carve(C, a, b) {
    var N = C.N, cost = new Float32Array(N * N).fill(1e9), prev = new Int32Array(N * N).fill(-1), done = new Uint8Array(N * N);
    var st = a[1] * N + a[0], goal = b[1] * N + b[0], open = [st]; cost[st] = 0;
    while (open.length) {
      var bi = 0; for (var i = 1; i < open.length; i++) if (cost[open[i]] < cost[open[bi]]) bi = i;
      var c = open.splice(bi, 1)[0]; if (done[c]) continue; done[c] = 1;
      if (c === goal) break;
      var x = c % N, y = (c - x) / N;
      for (var d = 0; d < 4; d++) {
        var nx = x + [1, -1, 0, 0][d], ny = y + [0, 0, 1, -1][d];
        if (!C.ok(nx, ny)) continue;
        var k = ny * N + nx, t = C.ter[k], w = 1 + (t === WA ? 6 : t === RO ? 9 : 0) + (C.blk[k] === 1 ? 2.5 : C.blk[k] === 2 ? 30 : 0);
        if (cost[c] + w < cost[k]) { cost[k] = cost[c] + w; prev[k] = c; open.push(k); }
      }
      if (open.length > 4000) open.sort(function (p, q) { return cost[p] - cost[q]; }).splice(2000);
    }
    for (var p = goal; p !== -1 && p !== st; p = prev[p]) {
      var px = p % N, py = (p - px) / N;
      if (C.ter[p] === WA) C.ter[p] = FO; else if (C.ter[p] === RO) C.ter[p] = DI;
      if (C.blk[p] === 1) C.clearObjs(function (o) { return o.x === px && o.y === py; });
    }
  }

  // ---------- decorurile ----------
  function decorate(C, season) {
    var N = C.N, R = G.rng(C.seed + 99), ter = C.ter;
    function nearT(x, y, t, r) { for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) if (C.get(x + dx, y + dy) === t) return true; return false; }
    var trees = new Uint8Array(N * N); C.objs.forEach(function (o) { if (o.t === 'tree') trees[o.y * N + o.x] = 1; });
    function nearTree(x, y) { for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var X = x + dx, Y = y + dy; if (C.ok(X, Y) && trees[Y * N + X]) return true; } return false; }
    for (var y = 1; y < N - 1; y++) for (var x = 1; x < N - 1; x++) {
      var t = ter[y * N + x], r = R(), fx = x + 0.2 + R() * 0.6, fy = y + 0.2 + R() * 0.6;
      if (C.blk[y * N + x]) continue;
      if (t === RO) { if (r < 0.1 && !nearT(x, y, GR, 1)) C.decor.push({ k: 'mount' + ((R() * 4) | 0), x: x + 0.5, y: y + 0.5 }); else if (r < 0.22) C.decor.push({ k: 'rock' + ((R() * 3) | 0), x: fx, y: fy }); continue; }
      if (t === MA) { if (r < 0.28) C.decor.push({ k: 'reed' + ((R() * 2) | 0), x: fx, y: fy }); continue; }
      if ((t === GR || t === SA) && nearT(x, y, WA, 1) && r < 0.16) { C.decor.push({ k: 'reed' + ((R() * 2) | 0), x: fx, y: fy }); continue; }
      if (t !== GR && t !== DI) continue;
      var nf = nearTree(x, y);
      if (nf && r < 0.05) C.decor.push({ k: 'bush' + ((R() * 3) | 0), x: fx, y: fy });
      else if (nf && r < 0.065) C.decor.push({ k: 'log' + ((R() * 2) | 0), x: fx, y: fy });
      else if (nf && r < 0.075) C.decor.push({ k: 'stump0', x: fx, y: fy });
      else if (!nf && t === GR && season !== 'iarna' && fbm(x * 0.2, y * 0.2, C.seed + 31) > 0.58 && r < 0.09) C.decor.push({ k: 'flowers' + ((R() * 2) | 0), x: fx, y: fy });
      else if (!nf && r < 0.012) C.decor.push({ k: 'rock' + ((R() * 3) | 0), x: fx, y: fy });
      else if (!nf && r < 0.02) C.decor.push({ k: 'bush' + ((R() * 3) | 0), x: fx, y: fy });
    }
  }

  // ---------- harta pentru bătălia liberă ----------
  G.genMap = function (S) {
    var opt = G.MAP_OPT || {}, players = (S.players && S.players.length) ? S.players : [{ team: 1 }, { team: 2 }];
    var N = S.N, nP = players.length, type = (S.map && S.map.type) || opt.type || 'rau', season = (S.map && S.map.season) || opt.season || 'vara';
    var C = Canvas(N, (S.seed % 1000000) + 17), R = C.R, M = N - 1, cx = M / 2, cy = M / 2;
    var bases = basesFor(N, players);
    var sym = nP === 2 || nP === 4 ? nP : 0;
    // 1. relieful, după tipul hărții
    if (type === 'rau') {
      if (nP === 4) { river(C, [1, 0], 1.6, 2.2, [-N * 0.3, N * 0.3], 0, 0.7); river(C, [0, 1], 1.6, 2.2, [-N * 0.3, N * 0.3], 0, 0.7); }
      else river(C, [Math.SQRT1_2, -Math.SQRT1_2], 1.9, 2.6, [-N * 0.33, -N * 0.12, N * 0.12, N * 0.33], 0, 0);
      for (var i = 0; i < N * N * 0.0035; i++) { var px = R() * N, py = R() * N; if (C.get(px | 0, py | 0) === GR) C.disc(px, py, 2.5 + R() * 3, function (x, y) { if (C.get(x, y) === GR && R() < 0.75) C.put('tree', x, y); }); }
    } else if (type === 'codri') {
      var paths = [];
      bases.forEach(function (b) { paths.push(meander(C, b, [cx, cy], 3, 10)); });
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (fbm(x * 0.09, y * 0.09, C.seed + 3) > 0.42 && R() < 0.8) C.put('tree', x, y);
      // poieni
      for (var k = 0; k < 6; k++) { var a = R() * 6.28, rr = R() * N * 0.3; C.clearObjs((function (qx, qy, r) { return function (o) { return Math.hypot(o.x - qx, o.y - qy) < r; }; })(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3 + R() * 3)); }
      stream(C, meander(C, [0, R() * N], [N, R() * N], 4, 16), 1.4, 9);
      paths.forEach(function (p) { C.line(p, 2.2, function (x, y) { if (C.get(x, y) !== WA && C.get(x, y) !== FO) C.set(x, y, DI); }); C.clearObjs(function (o) { return C.get(o.x, o.y) === DI; }); });
    } else if (type === 'stepa') {
      for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) { var f = fbm(x2 * 0.07, y2 * 0.07, C.seed + 11); if (f > 0.6) C.set(x2, y2, DI); else if (f < 0.3 && fbm(x2 * 0.2, y2 * 0.2, C.seed + 12) > 0.6) C.set(x2, y2, SA); }
      for (var k2 = 0; k2 < 3 + N / 40; k2++) { var lx = 8 + R() * (N - 16), ly = 8 + R() * (N - 16), lr = 1.5 + R() * 2.2; C.disc(lx, ly, lr, function (x, y) { C.set(x, y, WA); }); C.disc(lx, ly, lr + 1.4, function (x, y) { if (C.get(x, y) !== WA && R() < 0.5) C.set(x, y, MA); }); C.cluster('sheep', lx + lr + 2, ly, 3); }
      for (var k3 = 0; k3 < N * N / 450; k3++) { var gx = R() * N, gy = R() * N; C.disc(gx, gy, 1.2 + R() * 1.8, function (x, y) { if (R() < 0.7) C.put('tree', x, y); }); }
    } else if (type === 'delta') {
      var nCh = 3 + (N > 90 ? 1 : 0);
      for (var c2 = 0; c2 < nCh; c2++) {
        var y0 = N * (c2 + 0.7) / (nCh + 0.4);
        var pts = meander(C, [-2, y0 + (R() - 0.5) * 6], [N + 2, y0 + (R() - 0.5) * 6], 4 + R() * 3, 20);
        stream(C, pts, 1.8 + R() * 1.2, 7);
      }
      for (var y3 = 0; y3 < N; y3++) for (var x3 = 0; x3 < N; x3++) {
        if (C.get(x3, y3) !== GR) continue;
        var nearW = false; for (var dy = -2; dy <= 2 && !nearW; dy++) for (var dx = -2; dx <= 2; dx++) if (C.get(x3 + dx, y3 + dy) === WA) { nearW = true; break; }
        if (nearW && fbm(x3 * 0.25, y3 * 0.25, C.seed + 21) > 0.5) C.set(x3, y3, MA);
        else if (nearW && R() < 0.2) C.set(x3, y3, SA);
      }
      for (var k4 = 0; k4 < N * N / 380; k4++) { var wx = R() * N, wy = R() * N; C.disc(wx, wy, 1 + R() * 2, function (x, y) { if (C.get(x, y) === GR && R() < 0.65) C.put('tree', x, y); }); }
    } else if (type === 'munti') {
      var nR = 3 + (N > 90 ? 1 : 0);
      for (var r2 = 0; r2 < nR; r2++) {
        var ang = R() * Math.PI, ox = cx + (R() - 0.5) * N * 0.5, oy = cy + (R() - 0.5) * N * 0.5;
        var a0 = [ox - Math.cos(ang) * N * 0.45, oy - Math.sin(ang) * N * 0.45], a1 = [ox + Math.cos(ang) * N * 0.45, oy + Math.sin(ang) * N * 0.45];
        var rp = meander(C, a0, a1, 5, 18), gaps = [0.3 + R() * 0.1, 0.65 + R() * 0.1];
        for (var s2 = 0; s2 < rp.length - 1; s2++) {
          var tt = s2 / (rp.length - 1);
          if (gaps.some(function (g) { return Math.abs(tt - g) < 0.06; })) continue;
          C.line([rp[s2], rp[s2 + 1]], 3 + R() * 2.5, function (x, y) { C.set(x, y, RO); });
        }
      }
      for (var y4 = 0; y4 < N; y4++) for (var x4 = 0; x4 < N; x4++) {
        if (C.get(x4, y4) !== GR) continue;
        var nr = false; for (var dy2 = -2; dy2 <= 2 && !nr; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) if (C.get(x4 + dx2, y4 + dy2) === RO) { nr = true; break; }
        if (nr && fbm(x4 * 0.15, y4 * 0.15, C.seed + 41) > 0.45 && R() < 0.7) C.put('tree', x4, y4);
        else if (nr && R() < 0.25) C.set(x4, y4, DI);
      }
      for (var k5 = 0; k5 < N * N / 900; k5++) { var mx = R() * N, my = R() * N; if (C.get(mx | 0, my | 0) === GR) C.cluster(R() < 0.5 ? 'gold' : 'stone', mx, my, 4 + ((R() * 3) | 0)); }
    }
    if (type === 'mare' || type === 'lac') {
      // marea de jur împrejur (Țărmul Mării Negre) sau un lac mare în mijloc; plaje de nisip; crânguri pe uscat
      for (var y5 = 0; y5 < N; y5++) for (var x5 = 0; x5 < N; x5++) {
        var wob = (fbm(x5 * 0.06, y5 * 0.06, C.seed + 51) - 0.5) * N * 0.06, dw;
        if (type === 'mare') dw = Math.min(x5, y5, M - x5, M - y5) - (N * 0.1 + wob);
        else dw = Math.hypot(x5 - cx, y5 - cy) - (N * 0.2 + wob);
        if (dw < 0) C.set(x5, y5, WA); else if (dw < 1.6) C.set(x5, y5, SA);
      }
      for (var k6 = 0; k6 < N * N * 0.0055; k6++) { var tx6 = R() * N, ty6 = R() * N; if (C.get(tx6 | 0, ty6 | 0) === GR) C.disc(tx6, ty6, 2.2 + R() * 2.8, function (x, y) { if (C.get(x, y) === GR && R() < 0.72) C.put('tree', x, y); }); }
      // bancurile de pești în larg (doar pentru bărci)
      var placedF = 0;
      for (var tf = 0; tf < 600 && placedF < Math.ceil(N / 9 / (sym || 1)); tf++) {
        var fx6 = (R() * N) | 0, fy6 = (R() * N) | 0;
        if (C.get(fx6, fy6) !== WA || C.blk[fy6 * N + fx6] || (sym && !canonical(N, sym, fx6, fy6))) continue;
        var deep = true; for (var dy6 = -2; dy6 <= 2 && deep; dy6++) for (var dx6 = -2; dx6 <= 2; dx6++) if (C.get(fx6 + dx6, fy6 + dy6) !== WA) { deep = false; break; }
        if (!deep || C.objs.some(function (o) { return o.t === 'fishd' && Math.hypot(o.x - fx6, o.y - fy6) < 6; })) continue;
        C.blk[fy6 * N + fx6] = 2; C.objs.push({ t: 'fishd', x: fx6, y: fy6 });
        if (C.get(fx6 + 1, fy6) === WA && !C.blk[fy6 * N + fx6 + 1]) { C.blk[fy6 * N + fx6 + 1] = 2; C.objs.push({ t: 'fishd', x: fx6 + 1, y: fy6 }); }
        placedF++;
      }
    }
    // 2. bazele: poienile lor curate
    bases.forEach(function (b) {
      var cr = type === 'codri' ? 9.5 : 7.5;
      C.disc(b[0], b[1], cr, function (x, y) { var t = C.get(x, y); if (t !== GR && t !== DI) C.set(x, y, GR); });
      C.clearObjs(function (o) { return Math.hypot(o.x + 0.5 - b[0], o.y + 0.5 - b[1]) < cr; });
      C.disc(b[0], b[1], 3.2, function (x, y) { if (fbm(x * 0.5, y * 0.5, C.seed + 77) > 0.4) C.set(x, y, DI); });
    });
    // 3. resursele bazelor și cele din mijloc (doar în zona canonică, apoi oglindite)
    var canon = sym ? [bases[0]] : bases;
    if (sym === 4) canon = [bases.find(function (b) { return canonical(N, 4, b[0], b[1]); }) || bases[0]];
    if (sym === 2) canon = [bases.find(function (b) { return canonical(N, 2, b[0], b[1]); }) || bases[0]];
    canon.forEach(function (b) { baseRes(C, b, type); });
    var extra = type === 'munti' ? 5 : type === 'stepa' ? 4 : 3;
    for (var e = 0; e < extra * Math.max(1, N / 72); e++) {
      var ex = R() * N, ey = R() * N, far = bases.every(function (b) { return Math.hypot(ex - b[0], ey - b[1]) > 18; });
      if (!far || (sym && !canonical(N, sym, ex | 0, ey | 0))) continue;
      C.cluster(['gold', 'stone', 'sheep', 'berry', 'gold'][e % 5], ex, ey, 4 + ((R() * 3) | 0));
    }
    // vânatul din mijloc: turme de cerbi, iar prin păduri haite de lupi
    var packs = [['deer', 3, 2 + (type === 'stepa' ? 2 : 0)], ['wolf', 2, type === 'codri' ? 4 : type === 'munti' ? 3 : 1]];
    packs.forEach(function (pk) {
      for (var pn = 0, pt = 0; pn < Math.ceil(pk[2] * Math.max(1, N / 96) / (sym || 1)) && pt++ < 300;) {
        var hx = (R() * (N - 10) + 5) | 0, hy = (R() * (N - 10) + 5) | 0;
        if (!C.free(hx, hy) || (sym && !canonical(N, sym, hx, hy))) continue;
        if (bases.some(function (b) { return Math.hypot(hx - b[0], hy - b[1]) < (pk[0] === 'wolf' ? 24 : 19); })) continue;
        C.cluster(pk[0], hx, hy, pk[1]); pn++;
      }
    });
    // peștele de la mal: pe apă, lângă uscat, la câțiva pași unul de altul (țăranii pescuiesc de pe mal)
    var fishAt = [];
    for (var fy = 3; fy < N - 3; fy++) for (var fx = 3; fx < N - 3; fx++) {
      if (C.get(fx, fy) !== WA || C.blk[fy * N + fx] || (sym && !canonical(N, sym, fx, fy))) continue;
      var land = 0; for (var q = 0; q < 8; q++) { var tt2 = C.get(fx + [1, -1, 0, 0, 1, 1, -1, -1][q], fy + [0, 0, 1, -1, 1, -1, 1, -1][q]); if (tt2 === GR || tt2 === DI || tt2 === SA) land++; }
      if (land < 2 || R() > 0.2) continue;
      if (fishAt.some(function (f) { return Math.hypot(f[0] - fx, f[1] - fy) < 7; })) continue;
      if (bases.some(function (b) { return Math.hypot(fx - b[0], fy - b[1]) < 9; })) continue;
      fishAt.push([fx, fy]); C.blk[fy * N + fx] = 2; C.objs.push({ t: 'fish', x: fx, y: fy });
    }
    // moaștele: 5 la doi jucători, +2 pentru fiecare jucător în plus
    var relics = 5 + (nP - 2) * 2, placed = 0, tries = 0;
    while (placed < (sym ? Math.ceil(relics / sym) : relics) && tries++ < 400) {
      var rx = (R() * (N - 8) + 4) | 0, ry = (R() * (N - 8) + 4) | 0;
      if (!C.free(rx, ry) || (sym && !canonical(N, sym, rx, ry))) continue;
      if (bases.some(function (b) { return Math.hypot(rx - b[0], ry - b[1]) < 18; })) continue;
      if (C.put('relic', rx, ry)) placed++;
    }
    if (sym) symmetrize(C, sym);
    // 4. orice bază ajunge la toate celelalte; orice resursă de lângă bază are o latură liberă
    for (var it = 0; it < 4; it++) {
      var seen = reach(C, [Math.floor(bases[0][0]), Math.floor(bases[0][1])]), all = true;
      bases.forEach(function (b, bi) { if (bi && !seen[Math.floor(b[1]) * N + Math.floor(b[0])]) { all = false; carve(C, [Math.floor(bases[0][0]), Math.floor(bases[0][1])], [Math.floor(b[0]), Math.floor(b[1])]); } });
      if (all) break;
    }
    var seen2 = reach(C, [Math.floor(bases[0][0]), Math.floor(bases[0][1])]);
    C.objs.forEach(function (o) {
      if (o.t === 'tree' || o.t === 'sheep' || o.t === 'deer' || o.t === 'boar' || o.t === 'wolf' || o.t === 'fish' || o.t === 'fishd' || o.t === 'relic') return;
      if (!bases.some(function (b) { return Math.hypot(o.x - b[0], o.y - b[1]) < 22; })) return;
      var ok = false;
      for (var dy3 = -1; dy3 <= 1; dy3++) for (var dx3 = -1; dx3 <= 1; dx3++) { var X = o.x + dx3, Y = o.y + dy3; if (C.ok(X, Y) && seen2[Y * N + X]) ok = true; }
      if (!ok) carve(C, [Math.floor(bases[0][0]), Math.floor(bases[0][1])], [o.x, o.y]);
    });
    decorate(C, season);
    S.ter = C.ter; S.decor = C.decor; S.base = bases; S.hgt = heightField(C, type, bases, false);
    return { base: bases, objs: C.objs.filter(function (o) { return G.RESD[o.t]; }) };
  };

  // ---------- relieful ----------
  // S.hgt: înălțimea în colțurile pătrățelelor ((N+1)², 0 = luciul apei, 16 px pe unitate la zoom 1).
  // Dealuri line, văi spre ape, munți pe crestele de stâncă, albii sub apă, platouri la baze.
  // Forma fină (colți de stâncă, ondulații) se calculează din S.hgt în G.reliefFine, la încărcare.
  function smh(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function bfs(C, isSrc) {
    var N = C.N, d = new Float32Array(N * N), q = [], i;
    for (i = 0; i < N * N; i++) { if (isSrc(C.ter[i])) { d[i] = 0; q.push(i); } else d[i] = 1e9; }
    for (var qi = 0; qi < q.length; qi++) {
      var c = q[qi], cx = c % N, cy = (c - cx) / N;
      for (var k = 0; k < 4; k++) {
        var nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var j = ny * N + nx; if (d[j] > d[c] + 1) { d[j] = d[c] + 1; q.push(j); }
      }
    }
    return d;
  }
  function isWet(t) { return t === WA || t === FO || t === BR; }
  function heightField(C, type, bases, mission) {
    var N = C.N, V = N + 1, H = new Float32Array(V * V), seed = C.seed + 97, i, vx, vy;
    var amp = mission ? 0.6 : ({ munti: 1.45, codri: 1.15, rau: 1.0, delta: 0.35, stepa: 0.8, mare: 0.9, lac: 0.95 }[type] || 0.9);
    var dW = bfs(C, isWet), dL = bfs(C, function (t) { return !isWet(t); }), dR = bfs(C, function (t) { return t !== RO; });
    var wet = new Uint8Array(V * V);   // 0 uscat, 1 mal, 2 apă
    function hills(x, y) { var f = fbm(x * 0.045, y * 0.045, seed), f2 = fbm(x * 0.11, y * 0.11, seed + 7); return Math.max(0, smh(0.32, 0.86, f) * 2.3 * amp + (f2 - 0.5) * 0.4 * amp); }
    var plat = bases.map(function (b) { return Math.min(0.7, hills(b[0], b[1])); });
    for (vy = 0; vy <= N; vy++) for (vx = 0; vx <= N; vx++) {
      var cnt = 0, nW = 0, nRo = 0, dw = 1e9, dr = 0, dep = 0;
      for (var dy = -1; dy <= 0; dy++) for (var dx = -1; dx <= 0; dx++) {
        var tx = vx + dx, ty = vy + dy; if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
        var k2 = ty * N + tx, t = C.ter[k2]; cnt++;
        if (isWet(t)) { nW++; dep += t === FO ? -0.16 : -(0.5 + 0.24 * Math.min(4, dL[k2])); }
        else if (dW[k2] < dw) dw = dW[k2];
        if (t === RO) { nRo++; dr += dR[k2]; }
      }
      var j = vy * V + vx, h;
      if (nW === cnt) { H[j] = dep / cnt; wet[j] = 2; continue; }
      if (nW) { H[j] = nW * 2 > cnt ? -0.12 : -0.04; wet[j] = 1; continue; }
      // dealurile coboară spre ape
      h = hills(vx, vy) * smh(0.6, 6.5, dw);
      // munții: urcă spre mijlocul crestei, cu vârfuri diferite
      if (nRo) {
        var depth = dr / nRo, pk = 0.8 + fbm(vx * 0.16, vy * 0.16, seed + 31) * 0.8;
        h += (nRo / cnt) * Math.min(5.4, 1.0 + depth * 1.1) * pk * (type === 'munti' ? 1.2 : 0.95);
      }
      bases.forEach(function (b, bi) { var d = Math.hypot(vx - b[0], vy - b[1]); if (d < 11) { var w = smh(6.5, 11, d); h = plat[bi] + (h - plat[bi]) * w; } });
      h *= smh(0, 4, Math.min(vx, vy, N - vx, N - vy));
      H[j] = 0.08 + h;
    }
    // o netezire ușoară pe uscat, ca dealurile să fie rotunde; malurile și apa rămân pe loc
    var H2 = new Float32Array(H);
    for (vy = 1; vy < N; vy++) for (vx = 1; vx < N; vx++) {
      var jj = vy * V + vx; if (wet[jj]) continue;
      var s = H[jj] * 4, w = 4;
      [jj - 1, jj + 1, jj - V, jj + V].forEach(function (q) { if (!wet[q]) { s += H[q]; w++; } });
      H2[jj] = Math.max(0.08, s / w);
    }
    for (i = 0; i < H2.length; i++) H2[i] = Math.round(Math.max(-2, Math.min(7.5, H2[i])) * 100) / 100;
    return H2;
  }
  G.heightField = heightField;

  // ---------- relieful fin: 4 puncte pe latura unui pătrățel, netezit (spline cubic) ----------
  // Pe stânci: colți și văgăuni (zgomot cu creste); pe uscat: ondulații mici care prind lumina.
  // Se calculează din S.hgt și S.ter, deci nu se salvează; aceeași hartă dă mereu același relief.
  function ridged(x, y, s) { var a = 1 - Math.abs(vnoise(x, y, s) * 2 - 1), b = 1 - Math.abs(vnoise(x * 2.03, y * 2.03, s + 5) * 2 - 1), c = 1 - Math.abs(vnoise(x * 4.1, y * 4.1, s + 9) * 2 - 1); return a * a * 0.55 + b * b * a * 0.3 + c * c * b * 0.15; }
  G.reliefFine = function (S) {
    var N = S.N, V = N + 1, RF = 4, W = N * RF + 1, Hc = S.hgt, F = new Float32Array(W * W), seed = (S.seed % 1000000) + 5;
    var rk = new Float32Array(V * V), vx, vy;
    for (vy = 0; vy <= N; vy++) for (vx = 0; vx <= N; vx++) {
      var c = 0, r = 0;
      for (var dy = -1; dy <= 0; dy++) for (var dx = -1; dx <= 0; dx++) { var tx = vx + dx, ty = vy + dy; if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue; c++; if (S.ter[ty * N + tx] === RO) r++; }
      rk[vy * V + vx] = r / c;
    }
    function cv(ix, iy) { ix = ix < 0 ? 0 : ix > N ? N : ix; iy = iy < 0 ? 0 : iy > N ? N : iy; return Hc[iy * V + ix]; }
    // spline cubic uniform (B-spline): fără depășiri la marginile abrupte
    var Bw = [], t, u;
    for (var f = 0; f < RF; f++) { t = f / RF; u = 1 - t; Bw.push([u * u * u / 6, (3 * t * t * t - 6 * t * t + 4) / 6, (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6, t * t * t / 6]); }
    for (var fy = 0; fy < W; fy++) {
      var iy = Math.min(N - 1, (fy / RF) | 0), wy = Bw[fy - iy * RF] || [0, 0, 1, 0];
      if (fy === W - 1) { iy = N - 1; wy = [0, 1 / 6, 4 / 6, 1 / 6]; }
      for (var fx = 0; fx < W; fx++) {
        var ix = Math.min(N - 1, (fx / RF) | 0), wx = Bw[fx - ix * RF] || [0, 0, 1, 0];
        if (fx === W - 1) { ix = N - 1; wx = [0, 1 / 6, 4 / 6, 1 / 6]; }
        var h = 0;
        for (var a = 0; a < 4; a++) { var row = 0; for (var b = 0; b < 4; b++) row += wx[b] * cv(ix - 1 + b, iy - 1 + a); h += wy[a] * row; }
        var x = fx / RF, y = fy / RF;
        var rx = Math.min(N, Math.max(0, x)), ry = Math.min(N, Math.max(0, y)), i0 = Math.min(N - 1, rx | 0), j0 = Math.min(N - 1, ry | 0), ax = rx - i0, ay = ry - j0;
        var r = (rk[j0 * V + i0] * (1 - ax) + rk[j0 * V + i0 + 1] * ax) * (1 - ay) + (rk[(j0 + 1) * V + i0] * (1 - ax) + rk[(j0 + 1) * V + i0 + 1] * ax) * ay;
        if (r > 0.02) {
          var rr = r * r * (3 - 2 * r);
          h += rr * (ridged(x * 0.42, y * 0.42, seed) - 0.3) * (1.1 + Math.min(1.6, h * 0.35));
          h += rr * (fbm(x * 1.6, y * 1.6, seed + 3) - 0.5) * 0.55;
        }
        if (h > 0.08) h += (fbm(x * 1.25, y * 1.25, seed + 9) - 0.5) * 0.12;
        F[fy * W + fx] = h;
      }
    }
    return { RF: RF, W: W, h: F };
  };

  // ---------- pictorul de hărți pentru misiuni ----------
  // spec: { N, season, seed, ground, ops: [['river', pts, w, {fords, bridges}], ['lake', cx, cy, rx, ry], ['marsh', ...], ['rock', poly], ['sand', poly],
  //   ['forest', poly, dens], ['forestc', cx, cy, r, dens], ['clear', cx, cy, r], ['road', pts, w], ['res', t, x, y, n], ['decor', k, x, y]] }
  function inPoly(x, y, P) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; }
  G.genMapSpec = function (S, spec) {
    var N = S.N, C = Canvas(N, spec.seed || 7), R = C.R, g0 = spec.ground === 'dirt' ? DI : spec.ground === 'sand' ? SA : GR;
    C.ter.fill(g0);
    var ops = spec.ops || [];
    ops.forEach(function (op) {
      var k = op[0];
      if (k === 'river') {
        C.line(op[1], op[2], function (x, y) { C.set(x, y, WA); });
        var o = op[3] || {};
        (o.fords || []).forEach(function (f) { C.disc(f[0], f[1], op[2] / 2 + 1.6, function (x, y) { if (C.get(x, y) === WA) C.set(x, y, FO); }); });
        (o.bridges || []).forEach(function (f) { C.disc(f[0], f[1], op[2] / 2 + 1.2, function (x, y) { if (C.get(x, y) === WA) C.set(x, y, BR); }); });
      } else if (k === 'lake' || k === 'marsh') {
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          var dx = (x + 0.5 - op[1]) / op[3], dy = (y + 0.5 - op[2]) / op[4], d = dx * dx + dy * dy, jit = (fbm(x * 0.4, y * 0.4, C.seed) - 0.5) * 0.5;
          if (d <= 1 + jit) C.set(x, y, k === 'lake' ? WA : (fbm(x * 0.5, y * 0.5, C.seed + 3) > 0.62 ? WA : MA));
        }
      } else if (k === 'rock' || k === 'sand') { for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) if (inPoly(x2 + 0.5, y2 + 0.5, op[1])) C.set(x2, y2, k === 'rock' ? RO : SA); }
      else if (k === 'road') C.line(op[1], op[2], function (x, y) { var t = C.get(x, y); if (t !== WA && t !== BR && t !== FO) C.set(x, y, DI); });
    });
    ops.forEach(function (op) {
      var k = op[0];
      if (k === 'forest' || k === 'forestc') {
        var dens = (k === 'forest' ? op[2] : op[4]) || 0.6;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          var inside = k === 'forest' ? inPoly(x + 0.5, y + 0.5, op[1]) : Math.hypot(x + 0.5 - op[1], y + 0.5 - op[2]) <= op[3];
          if (inside && C.get(x, y) === g0 && R() < dens * (0.75 + fbm(x * 0.3, y * 0.3, C.seed + 9) * 0.5)) C.put('tree', x, y);
        }
      }
    });
    ops.forEach(function (op) { if (op[0] === 'clear') C.clearObjs(function (o) { return Math.hypot(o.x + 0.5 - op[1], o.y + 0.5 - op[2]) <= op[3]; }); });
    ops.forEach(function (op) {
      if (op[0] === 'res') C.cluster(op[1], op[2], op[3], op[4] || 1);
      else if (op[0] === 'decor') C.decor.push({ k: op[1], x: op[2], y: op[3] });
    });
    decorate(C, spec.season || 'vara');
    S.ter = C.ter; S.decor = C.decor; S.base = []; S.hgt = heightField(C, 'spec', [], true);
    return { objs: C.objs.filter(function (o) { return G.RESD[o.t]; }) };
  };
})();
