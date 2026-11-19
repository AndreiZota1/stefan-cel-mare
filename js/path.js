// Căutarea drumului (A*) pe grila hărții, cu netezirea drumului găsit.
var G = globalThis.G || (globalThis.G = {});

(function () {
  var N = 0, g, came, gen, closed, curGen = 0, fv;
  var heap = [];
  var DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  var SQ2 = Math.SQRT2;

  function init(n) {
    N = n; var M = n * n;
    g = new Float32Array(M); came = new Int32Array(M); gen = new Uint32Array(M); closed = new Uint32Array(M); fv = new Float32Array(M);
    curGen = 0;
  }

  function push(i) {
    heap.push(i);
    var k = heap.length - 1, f = fv[i];
    while (k > 0) {
      var p = (k - 1) >> 1;
      if (fv[heap[p]] <= f) break;
      heap[k] = heap[p]; k = p;
    }
    heap[k] = i;
  }
  function pop() {
    var top = heap[0], last = heap.pop();
    if (heap.length) {
      var k = 0, n = heap.length, f = fv[last];
      for (;;) {
        var l = 2 * k + 1; if (l >= n) break;
        var r = l + 1, c = (r < n && fv[heap[r]] < fv[heap[l]]) ? r : l;
        if (fv[heap[c]] >= f) break;
        heap[k] = heap[c]; k = c;
      }
      heap[k] = last;
    }
    return top;
  }
  function octile(dx, dy) { dx = Math.abs(dx); dy = Math.abs(dy); return dx > dy ? dx + (SQ2 - 1) * dy : dy + (SQ2 - 1) * dx; }

  // linia dintre două puncte trece doar prin pătrățele accesibile?
  function clear(pass, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.ceil(len / 0.2);
    var nx = -dy / (len || 1) * 0.22, ny = dx / (len || 1) * 0.22;
    for (var s = 1; s < steps; s++) {
      var x = x0 + dx * s / steps, y = y0 + dy * s / steps;
      if (!pass[(Math.floor(y + ny)) * N + Math.floor(x + nx)]) return false;
      if (!pass[(Math.floor(y - ny)) * N + Math.floor(x - nx)]) return false;
      if (!pass[Math.floor(y) * N + Math.floor(x)]) return false;
    }
    return true;
  }

  // goal: {x, y, r} (pătrățel, acceptă la distanța r) sau {rect:[x0,y0,x1,y1], r} (pătrățele incluse)
  // întoarce o listă de puncte [x, y]; [] dacă suntem deja acolo; null dacă nu se poate pleca deloc
  function findPath(sx, sy, goal, maxNodes, o) {
    var pass = o === 'w' ? G.C.wpass : (o !== undefined && o >= 0 && G.C.pp && G.C.pp[o]) || G.C.pass;
    if (N !== G.S.N) init(G.S.N);
    maxNodes = maxNodes || 3000;
    var stx = Math.max(0, Math.min(N - 1, Math.floor(sx))), sty = Math.max(0, Math.min(N - 1, Math.floor(sy)));
    var start = sty * N + stx;
    curGen++;
    if (curGen > 4000000000) { gen.fill(0); closed.fill(0); curGen = 1; }
    var R = goal.rect, rr = goal.r || 0, hx, hy;
    var isGoal;
    if (R) {
      hx = (R[0] + R[2]) / 2; hy = (R[1] + R[3]) / 2;
      isGoal = function (x, y) {
        var dx = x < R[0] ? R[0] - x : (x > R[2] ? x - R[2] : 0);
        var dy = y < R[1] ? R[1] - y : (y > R[3] ? y - R[3] : 0);
        return dx <= rr && dy <= rr;
      };
    } else {
      hx = goal.x; hy = goal.y;
      isGoal = function (x, y) { return Math.abs(x - goal.x) <= rr && Math.abs(y - goal.y) <= rr; };
    }
    function h(x, y) {
      if (R) {
        var dx = x < R[0] ? R[0] - x : (x > R[2] ? x - R[2] : 0);
        var dy = y < R[1] ? R[1] - y : (y > R[3] ? y - R[3] : 0);
        return octile(Math.max(0, dx - rr), Math.max(0, dy - rr));
      }
      return octile(Math.max(0, Math.abs(x - hx) - rr), Math.max(0, Math.abs(y - hy) - rr));
    }
    if (isGoal(stx, sty) && pass[start]) return [];

    heap.length = 0;
    gen[start] = curGen; g[start] = 0; came[start] = -1; fv[start] = h(stx, sty);
    push(start);
    var best = start, bestH = fv[start], found = -1, expanded = 0;
    while (heap.length) {
      var cur = pop();
      if (closed[cur] === curGen) continue;
      closed[cur] = curGen;
      var cx = cur % N, cy = (cur - cx) / N;
      if (cur !== start || pass[start]) {
        if (isGoal(cx, cy)) { found = cur; break; }
      }
      var hc = h(cx, cy);
      if (hc < bestH) { bestH = hc; best = cur; }
      if (++expanded > maxNodes) break;
      for (var d = 0; d < 8; d++) {
        var nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var ni = ny * N + nx;
        if (!pass[ni] || closed[ni] === curGen) continue;
        if (d >= 4 && (!pass[cy * N + nx] || !pass[ny * N + cx])) continue;
        var ng = g[cur] + (d >= 4 ? SQ2 : 1);
        if (gen[ni] !== curGen || ng < g[ni]) {
          gen[ni] = curGen; g[ni] = ng; came[ni] = cur; fv[ni] = ng + h(nx, ny) * 1.001;
          push(ni);
        }
      }
    }
    var end = found >= 0 ? found : best;
    if (end === start) return found >= 0 ? [] : null;
    var cells = [];
    for (var c = end; c !== -1 && c !== start; c = came[c]) cells.push(c);
    cells.reverse();
    // netezire: sare peste punctele intermediare dacă linia e liberă
    var pts = cells.map(function (c2) { var x = c2 % N; return [x + 0.5, (c2 - x) / N + 0.5]; });
    var out = [], ax = sx, ay = sy, i = 0;
    while (i < pts.length) {
      var j = Math.min(pts.length - 1, i + 10);
      while (j > i && !clear(pass, ax, ay, pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); ax = pts[j][0]; ay = pts[j][1]; i = j + 1;
    }
    return out;
  }

  G.Path = { init: init, find: findPath, clear: function (x0, y0, x1, y1, o) { return clear(o === 'w' ? G.C.wpass : (o !== undefined && o >= 0 && G.C.pp && G.C.pp[o]) || G.C.pass, x0, y0, x1, y1); } };
  G.findPath = findPath;
})();
