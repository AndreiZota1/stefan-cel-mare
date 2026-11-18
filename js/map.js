// Generarea hărții: râul cu vaduri și Podul Înalt, păduri, resurse. Harta e simetrică față de centru.
var G = globalThis.G || (globalThis.G = {});

G.T = { GRASS: 0, DIRT: 1, WATER: 2, FORD: 3, BRIDGE: 4 };
G.PASS_T = [1, 1, 0, 1, 1];
G.BUILD_T = [1, 1, 0, 0, 0];

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

  G.genMap = function (S) {
    var N = S.N, C1 = N - 1, R = G.rng(S.seed), T = G.T;
    var ter = S.ter = new Uint8Array(N * N);
    var a1 = 1.8 + R() * 1.2, f1 = 0.07 + R() * 0.05, a2 = 0.6 + R() * 0.7, f2 = 0.2 + R() * 0.1;
    function roff(t) { return a1 * Math.sin(t * f1) + a2 * Math.sin(t * f2); } // funcție impară => râu simetric
    var cr = Math.round(N * 0.4);
    var crosses = [-cr, 0, cr];
    var nseed = (S.seed % 100000) + 17;
    var base = [[N - 14, N - 14], [14, 14]];
    S.base = base;

    function D(i, j) { return i + j + 1 - N; }
    function Tt(i, j) { return i - j; }

    // râul, vadurile și podul
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var d = D(i, j), t = Tt(i, j), dd = d - roff(t);
      if (Math.abs(dd) <= 2.3) {
        var tp = T.WATER;
        if (Math.abs(t) <= 1.3) tp = T.BRIDGE;
        else if (Math.abs(t - cr) <= 1.6 || Math.abs(t + cr) <= 1.6) tp = T.FORD;
        ter[j * N + i] = tp;
      }
    }
    // pământ bătătorit în jurul cetăților
    for (var j2 = 0; j2 < N; j2++) for (var i2 = 0; i2 < N; i2++) {
      var k = j2 * N + i2; if (ter[k] !== T.GRASS) continue;
      for (var b = 0; b < 2; b++) {
        var dx = i2 + 0.5 - base[b][0], dy = j2 + 0.5 - base[b][1];
        var ci = b === 0 ? i2 : C1 - i2, cj = b === 0 ? j2 : C1 - j2;
        if (Math.sqrt(dx * dx + dy * dy) < 4.6 + fbm(ci * 0.4, cj * 0.4, nseed + 3) * 2.2) ter[k] = T.DIRT;
      }
    }

    // obiectele se pun doar pe jumătatea jucătorului (d > 0), apoi se oglindesc
    var blk = new Uint8Array(N * N); // 0 liber, 1 copac, 2 oaie, 3 altă resursă
    var objs = [];
    function free(i, j) {
      if (i < 0 || j < 0 || i >= N || j >= N) return false;
      var k = j * N + i;
      return !blk[k] && G.BUILD_T[ter[k]] && D(i, j) > 1;
    }
    function distBase(i, j) { var dx = i + 0.5 - base[0][0], dy = j + 0.5 - base[0][1]; return Math.sqrt(dx * dx + dy * dy); }
    function put(t, i, j) { blk[j * N + i] = t === 'tree' ? 1 : t === 'sheep' ? 2 : 3; objs.push({ t: t, x: i, y: j }); }
    function unput(i, j) {
      var k = j * N + i; if (!blk[k]) return;
      blk[k] = 0;
      for (var q = objs.length - 1; q >= 0; q--) if (objs[q].x === i && objs[q].y === j) { objs.splice(q, 1); break; }
    }

    // păduri
    for (var j3 = 0; j3 < N; j3++) for (var i3 = 0; i3 < N; i3++) {
      if (D(i3, j3) <= 0 || ter[j3 * N + i3] !== T.GRASS) continue;
      var t3 = Tt(i3, j3), dd3 = D(i3, j3) - roff(t3);
      if (Math.abs(dd3) < 3.6) continue;
      var near = false;
      for (var c = 0; c < 3; c++) if (Math.abs(t3 - crosses[c]) <= 4 && D(i3, j3) < 17) near = true;
      if (near) continue;
      if (distBase(i3, j3) < 9) continue;
      var edge = Math.min(i3, j3, C1 - i3, C1 - j3);
      var thr = 0.6 - (edge < 4 ? (4 - edge) * 0.07 : 0);
      if (fbm(i3 * 0.09, j3 * 0.09, nseed) > thr) put('tree', i3, j3);
    }

    // grupuri de resurse
    function blob(t, cx, cy, count, clearRing) {
      var si = Math.round(cx), sj = Math.round(cy);
      // găsește cel mai apropiat loc liber de pornire
      var best = null, bd = 1e9;
      for (var rj = -4; rj <= 4; rj++) for (var ri = -4; ri <= 4; ri++) {
        var ii = si + ri, jj = sj + rj;
        if (ii < 1 || jj < 1 || ii > N - 2 || jj > N - 2) continue;
        if (!G.BUILD_T[ter[jj * N + ii]] || D(ii, jj) <= 3 || distBase(ii, jj) < 5.5) continue;
        var dd = ri * ri + rj * rj; if (dd < bd) { bd = dd; best = [ii, jj]; }
      }
      if (!best) return [];
      var placed = [], front = [best];
      var seen = {};
      while (placed.length < count && front.length) {
        var idx = Math.floor(R() * front.length);
        var p = front.splice(idx, 1)[0];
        var key = p[0] + ',' + p[1]; if (seen[key]) continue; seen[key] = 1;
        var pk = p[1] * N + p[0];
        if (p[0] < 1 || p[1] < 1 || p[0] > N - 2 || p[1] > N - 2) continue;
        if (!G.BUILD_T[ter[pk]] || D(p[0], p[1]) <= 3 || distBase(p[0], p[1]) < 5.5) continue;
        if (blk[pk]) { if (blk[pk] === 1) unput(p[0], p[1]); else continue; }
        put(t, p[0], p[1]); placed.push(p);
        front.push([p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]);
      }
      // curăță copacii din jur, ca grupul să fie accesibil
      if (clearRing) placed.forEach(function (p) {
        for (var a = -1; a <= 1; a++) for (var b2 = -1; b2 <= 1; b2++) {
          var qi = p[0] + a, qj = p[1] + b2;
          if (qi < 0 || qj < 0 || qi >= N || qj >= N) continue;
          if (blk[qj * N + qi] === 1) unput(qi, qj);
        }
      });
      return placed;
    }
    function at(angDeg, dist) {
      var a = angDeg * Math.PI / 180;
      return [base[0][0] + Math.cos(a) * dist, base[0][1] + Math.sin(a) * dist];
    }
    var jit = function () { return (R() - 0.5) * 30; };
    var p;
    p = at(120 + jit(), 7);       blob('berry', p[0], p[1], 6, true);
    p = at(-30 + jit(), 8.5);     blob('gold', p[0], p[1], 7, true);
    p = at(175 + jit() * 0.5, 9.5); blob('stone', p[0], p[1], 5, true);
    p = at(-80 + jit() * 0.5, 15); blob('gold', p[0], p[1], 6, true);
    p = at(45 + jit(), 11.5);     blob('tree', p[0], p[1], 42, false);
    p = at(95 + jit(), 15);       blob('tree', p[0], p[1], 30, false);
    // resurse disputate lângă râu
    var tc = cr * 0.5 + (R() - 0.5) * 6;
    p = [(N - 1 + tc) / 2 + 5, (N - 1 - tc) / 2 + 5]; blob('gold', p[0], p[1], 5, true);
    p = [(N - 1 - tc) / 2 + 5.5, (N - 1 + tc) / 2 + 5.5]; blob('stone', p[0], p[1], 4, true);

    // oile, aproape de cetate
    var sheep = 0, tries = 0;
    while (sheep < 7 && tries++ < 400) {
      var a = R() * Math.PI * 2, dist = 4.6 + R() * 2.4;
      var si2 = Math.floor(base[0][0] + Math.cos(a) * dist), sj2 = Math.floor(base[0][1] + Math.sin(a) * dist);
      if (!free(si2, sj2)) continue;
      if (Math.abs(si2 + 0.5 - base[0][0]) < 2.6 && Math.abs(sj2 + 0.5 - base[0][1]) < 2.6) continue;
      put('sheep', si2, sj2); sheep++;
    }

    // conectivitate: cetatea mea trebuie să ajungă la râu pe cel puțin un pod/vad
    function blocked(i, j) {
      if (i < 0 || j < 0 || i >= N || j >= N) return true;
      var k = j * N + i;
      if (!G.PASS_T[ter[k]]) return true;
      return blk[k] === 1 || blk[k] === 3;
    }
    function reach() {
      var seen = new Uint8Array(N * N), q = [];
      var si3 = Math.floor(base[0][0]), sj3 = Math.floor(base[0][1]) + 3;
      q.push([si3, sj3]); seen[sj3 * N + si3] = 1;
      while (q.length) {
        var c2 = q.pop();
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          var ni = c2[0] + di, nj = c2[1] + dj;
          if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
          var nk = nj * N + ni;
          if (seen[nk] || blocked(ni, nj)) continue;
          if (di && dj && (blocked(c2[0] + di, c2[1]) || blocked(c2[0], c2[1] + dj))) continue;
          seen[nk] = 1; q.push([ni, nj]);
        }
      }
      return seen;
    }
    function carve(tx, ty) {
      var sx = base[0][0], sy = base[0][1], len = Math.hypot(tx - sx, ty - sy);
      for (var s = 0; s <= len; s += 0.5) {
        var x = sx + (tx - sx) * s / len, y = sy + (ty - sy) * s / len;
        for (var a2 = -1; a2 <= 1; a2++) for (var b3 = -1; b3 <= 1; b3++) {
          var ci2 = Math.floor(x) + a2, cj2 = Math.floor(y) + b3;
          if (ci2 >= 0 && cj2 >= 0 && ci2 < N && cj2 < N && blk[cj2 * N + ci2] === 1) unput(ci2, cj2);
        }
      }
    }
    for (var c3 = 0; c3 < 3; c3++) {
      var seen = reach();
      // punctul de pe malul meu al trecerii c3
      var tt = crosses[c3], ok = false;
      for (var dd4 = 3; dd4 <= 6 && !ok; dd4++) {
        var dsum = roff(tt) + dd4;            // d = i + j + 1 - N
        var ii4 = Math.round((dsum + N - 1 + tt) / 2), jj4 = Math.round((dsum + N - 1 - tt) / 2);
        if (ii4 >= 0 && jj4 >= 0 && ii4 < N && jj4 < N && seen[jj4 * N + ii4]) ok = true;
      }
      if (!ok) {
        var ds = roff(tt) + 4;
        carve((ds + N - 1 + tt) / 2, (ds + N - 1 - tt) / 2);
      }
    }
    // fiecare resursă de lângă cetate trebuie să aibă măcar o vecină accesibilă
    var seen2 = reach();
    objs.forEach(function (o) {
      if (o.t === 'tree') return;
      if (distBase(o.x, o.y) > 20) return;
      var okr = false;
      for (var a3 = -1; a3 <= 1; a3++) for (var b4 = -1; b4 <= 1; b4++) {
        var qi = o.x + a3, qj = o.y + b4;
        if (qi >= 0 && qj >= 0 && qi < N && qj < N && seen2[qj * N + qi]) okr = true;
      }
      if (!okr) carve(o.x + 0.5, o.y + 0.5);
    });

    // oglindire pe jumătatea otomanilor
    var all = objs.slice();
    objs.forEach(function (o) { all.push({ t: o.t, x: C1 - o.x, y: C1 - o.y }); });
    return { objs: all, base: base };
  };
})();
