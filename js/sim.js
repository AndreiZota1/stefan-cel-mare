// Simularea: entități, mers, strâns resurse, construcții, luptă, producție, ceața, salvarea.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var S = null;
  var C = G.C = { byId: new Map(), occ: null, pass: null, vis: null, units: [], blds: [], grid: new Map(), sc: [{}, {}], hero: [0, 0], gcount: {}, budget: 0 };

  G.msgQ = [];
  G.msg = function (text, kind, pos) {
    G.msgQ.push({ text: text, kind: kind || 'info', pos: pos || null });
    if (G.msgQ.length > 40) G.msgQ.shift();
  };
  if (!G.sfx) G.sfx = function () {};

  function def(e) { return e.k === 'u' ? G.UNITS[e.t] : e.k === 'b' ? G.BLDS[e.t] : G.RESD[e.t]; }
  G.def = def;
  G.nm = function (d, civ) { return typeof d.name === 'string' ? d.name : (d.name[civ] || d.name.mol || d.name.oto); };
  G.ename = function (e) { return e.k === 'r' ? G.RESD[e.t].name : G.nm(def(e), S.players[e.o].civ); };
  G.getE = function (id) { var e = C.byId.get(id); return e && !e.dead ? e : null; };
  var getE = G.getE;
  G.isMil = function (u) { return u.k === 'u' && u.t !== 'vil'; };

  function mkPlayer(id, civ, ai) {
    return { id: id, civ: civ, ai: ai, res: { f: 200, w: 200, g: 100, s: 150 }, age: 0, techs: {}, pop: 0, cap: 0, gm: 1,
      st: { trained: 0, killed: 0, lost: 0, razed: 0, gath: { f: 0, w: 0, g: 0, s: 0 } } };
  }

  // ---------- joc nou, indexuri ----------
  G.newGame = function (opt) {
    opt = opt || {};
    S = G.S = { v: 1, N: G.N, t: 0, seed: opt.seed || ((Math.random() * 1e9) | 0), diff: opt.diff || 'normal',
      ents: [], nextId: 1, proj: [], fx: [], over: 0, dirty: 0,
      tm: { fog: 0, ai: 0.3, win: 1, alert: -99, popMsg: -99 },
      players: [mkPlayer(0, 'mol', !!opt.aiBoth), mkPlayer(1, 'oto', true)], ai: {}, exp: null, ter: null, base: null };
    var D = G.DIFF[S.diff];
    S.players[1].gm = D.gather;
    if (D.bonus) G.RES.forEach(function (r) { S.players[1].res[r] += D.bonus; });
    var gm = G.genMap(S);
    S.exp = new Uint8Array(S.N * S.N);
    G.rebuild();
    gm.objs.forEach(function (o) { G.addRes(o.t, o.x, o.y); });
    for (var p = 0; p < 2; p++) {
      var b = gm.base[p];
      var tc = G.addBld('cetate', p, b[0] - 2, b[1] - 2, true);
      for (var i = 0; i < 3; i++) { var sp = freeSpot(tc, null); G.addUnit('vil', p, sp[0], sp[1]); }
      var hs = freeSpot(tc, null); G.addUnit('hero', p, hs[0], hs[1]);
    }
    refreshLists();
    G.updFog();
    return S;
  };

  function blocks(e) { return e.k === 'b' || (e.k === 'r' && G.RESD[e.t].block); }
  function occupy(e, on) {
    var n = e.k === 'b' ? e.n : 1, walk = e.k === 'b' && G.BLDS[e.t].walk, N = S.N;
    for (var y = e.ty; y < e.ty + n; y++) for (var x = e.tx; x < e.tx + n; x++) {
      var i = y * N + x;
      if (on) { C.occ[i] = e.id; C.pass[i] = walk ? G.PASS_T[S.ter[i]] : 0; }
      else if (C.occ[i] === e.id) { C.occ[i] = 0; C.pass[i] = G.PASS_T[S.ter[i]]; }
    }
  }
  G.rebuild = function () {
    var N = S.N, M = N * N;
    C.byId = new Map(); C.occ = new Int32Array(M); C.pass = new Uint8Array(M); C.vis = new Uint8Array(M);
    for (var i = 0; i < M; i++) C.pass[i] = G.PASS_T[S.ter[i]];
    C.sc = [{}, {}]; C.hero = [0, 0]; C.gcount = {};
    S.ents.forEach(function (e) {
      C.byId.set(e.id, e);
      if (blocks(e)) occupy(e, true);
      if (e.k === 'u' && G.UNITS[e.t].hero) C.hero[e.o] = e.id;
    });
    G.Path.init(N);
  };
  function addEnt(e) { e.id = S.nextId++; S.ents.push(e); C.byId.set(e.id, e); if (blocks(e)) occupy(e, true); return e; }

  G.addUnit = function (t, o, x, y) {
    var d = G.UNITS[t];
    var u = addEnt({ k: 'u', t: t, o: o, x: x, y: y, hp: d.hp, task: null, path: null, pi: 0, carry: null, cd: Math.random(), face: 1, an: Math.random() * 6, mv: 0, wk: 0, sw: 0 });
    if (d.hero) C.hero[o] = u.id;
    return u;
  };
  G.addBld = function (t, o, tx, ty, built) {
    var d = G.BLDS[t];
    var b = addEnt({ k: 'b', t: t, o: o, tx: tx, ty: ty, n: d.n, x: tx + d.n / 2, y: ty + d.n / 2, hp: built ? d.hp : 1, built: !!built, prog: built ? 1 : 0, q: [], rally: null, cd: 1 });
    pushOut(b);
    return b;
  };
  G.addRes = function (t, tx, ty) {
    return addEnt({ k: 'r', t: t, tx: tx, ty: ty, x: tx + 0.5, y: ty + 0.5, amt: G.RESD[t].amt, v: (G.hash2(tx, ty, 9) * 4) | 0 });
  };

  // un loc liber lângă clădire, cât mai aproape de țintă
  function freeSpot(b, tgt) {
    var tx = tgt ? tgt[0] : b.x + b.n, ty = tgt ? tgt[1] : b.y + b.n, best = null, bd = 1e9, N = S.N; // implicit: în fața clădirii, spre jos pe ecran
    for (var ring = 1; ring <= 5 && !best; ring++) {
      for (var y = b.ty - ring; y < b.ty + b.n + ring; y++) for (var x = b.tx - ring; x < b.tx + b.n + ring; x++) {
        if (x > b.tx - ring && x < b.tx + b.n + ring - 1 && y > b.ty - ring && y < b.ty + b.n + ring - 1) continue;
        if (x < 0 || y < 0 || x >= N || y >= N || !C.pass[y * N + x]) continue;
        var d = (x + 0.5 - tx) * (x + 0.5 - tx) + (y + 0.5 - ty) * (y + 0.5 - ty) + Math.random() * 0.8;
        if (d < bd) { bd = d; best = [x + 0.5 + (Math.random() - 0.5) * 0.3, y + 0.5 + (Math.random() - 0.5) * 0.3]; }
      }
    }
    return best || [b.x, b.ty + b.n + 0.5];
  }
  G.freeSpot = freeSpot;
  function pushOut(b) {
    if (G.BLDS[b.t].walk) return;
    S.ents.forEach(function (u) {
      if (u.dead) return;
      var mob = u.k === 'u' || (u.k === 'r' && !G.RESD[u.t].block);
      if (!mob) return;
      if (u.x > b.tx - 0.05 && u.x < b.tx + b.n + 0.05 && u.y > b.ty - 0.05 && u.y < b.ty + b.n + 0.05) {
        var sp = freeSpot(b, [u.x, u.y]); u.x = sp[0]; u.y = sp[1]; u.path = null;
        if (u.k === 'r') { u.tx = Math.floor(u.x); u.ty = Math.floor(u.y); }
      }
    });
  }

  // ---------- distanțe ----------
  function rectOf(e) {
    if (e.k === 'b') return [e.tx, e.ty, e.tx + e.n, e.ty + e.n];
    if (e.k === 'r' && G.RESD[e.t].block) return [e.tx, e.ty, e.tx + 1, e.ty + 1];
    return null;
  }
  G.rectOf = rectOf;
  function distRect(x, y, R) {
    var dx = x < R[0] ? R[0] - x : x > R[2] ? x - R[2] : 0, dy = y < R[1] ? R[1] - y : y > R[3] ? y - R[3] : 0;
    return Math.sqrt(dx * dx + dy * dy);
  }
  G.distRect = distRect;
  G.distTo = function (u, e) {
    var R = rectOf(e); if (R) return distRect(u.x, u.y, R);
    var r = e.k === 'u' ? G.UNITS[e.t].r : 0.25;
    return Math.max(0, Math.hypot(e.x - u.x, e.y - u.y) - r);
  };
  G.dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
  function goalFor(e, reach) {
    var R = rectOf(e);
    if (R) {
      if (e.k === 'b' && G.BLDS[e.t].walk) return { x: Math.floor(e.x), y: Math.floor(e.y), r: 0 };
      return { rect: [R[0], R[1], R[2] - 1, R[3] - 1], r: Math.max(1, Math.floor(reach * 0.75)) };
    }
    return { x: Math.floor(e.x), y: Math.floor(e.y), r: Math.max(0, Math.floor(reach * 0.7)) };
  }
  function accessible(e) {
    if (!G.RESD[e.t].block) return true;
    var N = S.N;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var x = e.tx + dx, y = e.ty + dy;
      if ((dx || dy) && x >= 0 && y >= 0 && x < N && y < N && C.pass[y * N + x]) return true;
    }
    return false;
  }
  G.accessible = accessible;

  // ---------- statistici cu tehnologii ----------
  function ustT(o, t) {
    var c = C.sc[o][t]; if (c) return c;
    var P = S.players[o], d = G.UNITS[t]; c = {};
    for (var k in d) c[k] = d[k];
    if (t === 'vil') { c.cap = 10; if (P.techs.roaba) { c.spd *= 1.1; c.cap = 15; } }
    var mel = d.cls === 'inf' || d.cls === 'cav';
    if (P.techs.sabii && mel) c.atk += 1;
    if (P.techs.sageti && d.cls === 'arc') c.atk += 1;
    if (P.techs.zale && mel) { c.ma += 1; c.pa += 1; }
    C.sc[o][t] = c;
    return c;
  }
  function ust(u) { return ustT(u.o, u.t); }
  G.ust = ust; G.ustT = ustT;
  function techMul(P, kind) {
    if (kind === 'tree') return P.techs.topor ? 1.2 : 1;
    if (kind === 'gold' || kind === 'stone') return P.techs.tarnacop ? 1.2 : 1;
    if (kind === 'farm') return P.techs.jug ? 1.2 : 1;
    return 1;
  }
  function auraBonus(u) {
    if (G.UNITS[u.t].hero || u.t === 'vil') return 0;
    var h = C.hero[u.o] ? getE(C.hero[u.o]) : null;
    return h && Math.abs(h.x - u.x) < 4 && Math.abs(h.y - u.y) < 4 ? 2 : 0;
  }
  G.auraBonus = auraBonus;

  // ---------- grila de vecini ----------
  function buildGrid() {
    var grid = C.grid; grid.clear();
    for (var i = 0; i < C.units.length; i++) {
      var u = C.units[i], k = Math.floor(u.y / 2) * 64 + Math.floor(u.x / 2), a = grid.get(k);
      if (!a) grid.set(k, a = []);
      a.push(u);
    }
  }
  function forUnitsNear(x, y, r, fn) {
    var x0 = Math.floor((x - r) / 2), x1 = Math.floor((x + r) / 2), y0 = Math.floor((y - r) / 2), y1 = Math.floor((y + r) / 2);
    for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0) continue;
      var a = C.grid.get(cy * 64 + cx);
      if (a) for (var i = 0; i < a.length; i++) fn(a[i]);
    }
  }
  G.forUnitsNear = forUnitsNear;

  function findEnemy(u, r) {
    var st = ust(u), best = null, bd = 1e9;
    if (!st.onlyBld) forUnitsNear(u.x, u.y, r, function (e) {
      if (e.o === u.o || e.dead) return;
      var d = (e.x - u.x) * (e.x - u.x) + (e.y - u.y) * (e.y - u.y);
      if (d > r * r) return;
      if (e.t === 'vil') d += 6;
      if (d < bd) { bd = d; best = e; }
    });
    if (best) return best;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.o === u.o || b.dead || (G.BLDS[b.t].farm && !st.onlyBld)) continue;
      var dd = distRect(u.x, u.y, rectOf(b));
      if (dd <= r && dd < bd) { bd = dd; best = b; }
    }
    return best;
  }
  G.findEnemy = findEnemy;

  // ---------- mers ----------
  function moveAlong(u, dt) {
    if (!u.path) return true;
    var sp = ust(u).spd * dt, N = S.N;
    while (sp > 0 && u.pi < u.path.length) {
      var w = u.path[u.pi], dx = w[0] - u.x, dy = w[1] - u.y, dd = Math.sqrt(dx * dx + dy * dy);
      if (!C.pass[Math.floor(w[1]) * N + Math.floor(w[0])]) { u.path = null; u.rp = 0; return true; }
      if (dd > 0.01) u.face = (dx - dy) >= 0 ? 1 : -1;
      if (dd <= sp) { u.x = w[0]; u.y = w[1]; sp -= dd; u.pi++; }
      else { u.x += dx / dd * sp; u.y += dy / dd * sp; sp = 0; }
    }
    u.mv = 0.15;
    if (u.pi >= u.path.length) { u.path = null; return true; }
    return false;
  }
  function setTask(u, T) { u.task = T; u.path = null; u.gk = null; u.fails = 0; u.rp = 0; }
  G.setTask = setTask;
  function finish(u, T) { u.task = T ? (T.then || null) : null; u.path = null; u.gk = null; }

  // apropie unitatea de entitatea e până la distanța reach; true când a ajuns
  function approach(u, e, reach, dt) {
    var dist = G.distTo(u, e);
    if (dist <= reach) { u.path = null; u.fails = 0; return true; }
    var key = e.id;
    if (e.k === 'u' && dist < 1.6 && G.Path.clear(u.x, u.y, e.x, e.y)) {
      u.path = [[e.x, e.y]]; u.pi = 0; u.gk = key; u.gx = e.x; u.gy = e.y;
      moveAlong(u, dt);
      return false;
    }
    var moved = e.k === 'u' && u.gk === key && (Math.abs(e.x - u.gx) + Math.abs(e.y - u.gy) > 1.2);
    if (u.gk !== key || moved || (!u.path && u.rp <= 0)) {
      if (C.budget <= 0) return false;
      C.budget--;
      if (u.gk !== key) u.fails = 0;
      else if (!moved && !u.path) u.fails = (u.fails || 0) + 1;
      if (u.fails > 6) return 'fail';
      var p = G.findPath(u.x, u.y, goalFor(e, reach), 2500);
      u.gk = key; u.gx = e.x; u.gy = e.y; u.rp = 0.7; u.pi = 0;
      if (p === null) { u.path = null; return 'fail'; }
      if (p.length === 0) {
        var R = rectOf(e);
        if (R && !(e.k === 'b' && G.BLDS[e.t].walk)) {
          var px = Math.max(R[0], Math.min(R[2], u.x)), py = Math.max(R[1], Math.min(R[3], u.y));
          var vx = u.x - px, vy = u.y - py, vl = Math.sqrt(vx * vx + vy * vy) || 1;
          u.path = [[px + vx / vl * 0.4, py + vy / vl * 0.4]];
        } else u.path = [[e.x, e.y]];
      } else u.path = p;
    }
    u.rp -= dt;
    moveAlong(u, dt);
    return false;
  }

  function doMove(u, T, dt) {
    var dx = T.x - u.x, dy = T.y - u.y;
    if (dx * dx + dy * dy < 0.01) { finish(u, T); return; }
    var key = 'm' + T.x + ',' + T.y;
    if (u.gk !== key || (!u.path && u.rp <= 0)) {
      if (C.budget <= 0) return;
      C.budget--;
      if (u.gk === key) T.n = (T.n || 0) + 1;
      if (T.n > 4) { finish(u, T); return; }
      var p = G.findPath(u.x, u.y, { x: Math.floor(T.x), y: Math.floor(T.y), r: 0 }, 3000);
      u.gk = key; u.rp = 0.8; u.pi = 0;
      if (p === null) { finish(u, T); return; }
      if (p.length) {
        var l = p[p.length - 1];
        if (Math.floor(l[0]) === Math.floor(T.x) && Math.floor(l[1]) === Math.floor(T.y)) { l[0] = T.x; l[1] = T.y; }
        u.path = p;
      } else u.path = [[T.x, T.y]];
    }
    u.rp -= dt;
    if (moveAlong(u, dt) && Math.abs(u.x - T.x) < 0.3 && Math.abs(u.y - T.y) < 0.3) finish(u, T);
  }
  function doAMove(u, T, dt) {
    u.scan = (u.scan || 0) - dt;
    if (u.scan <= 0) {
      u.scan = 0.5;
      var e = findEnemy(u, ust(u).los);
      if (e) { setTask(u, { k: 'atk', id: e.id, auto: 1, then: T }); return; }
    }
    doMove(u, T, dt);
  }
  function doIdle(u, dt) {
    if (u.t === 'vil') return;
    u.scan = (u.scan || 0) - dt;
    if (u.scan > 0) return;
    u.scan = 0.5 + Math.random() * 0.2;
    var e = findEnemy(u, ust(u).los);
    if (e) setTask(u, { k: 'atk', id: e.id, auto: 1 });
  }

  // ---------- luptă ----------
  function doAtk(u, T, dt) {
    var e = getE(T.id), st = ust(u);
    if (!e || e.o === u.o || e.k === 'r' || (st.onlyBld && e.k !== 'b')) { finish(u, T); return; }
    if (T.auto && G.dist(u, e) > st.los + 3) { finish(u, T); return; }
    var reach = st.rng > 0 ? st.rng : (e.k === 'u' ? st.r + G.UNITS[e.t].r + 0.3 : 0.75);
    var r = approach(u, e, reach, dt);
    if (r === 'fail') { finish(u, T); return; }
    if (!r) return;
    u.face = ((e.x - u.x) - (e.y - u.y)) >= 0 ? 1 : -1;
    u.wk = 0.25;
    if (u.cd <= 0) { u.cd = st.rof; u.sw = 0.4; strike(u, e, st); }
  }
  function strike(src, e, st) {
    var atk = st.atk + auraBonus(src);
    if (st.proj) {
      var d = G.dist(src, e);
      S.proj.push({ k: st.proj, sx: src.x, sy: src.y, tx: e.x, ty: e.y, id: e.id, sid: src.id, o: src.o, p: 0,
        dur: Math.max(0.15, d / (st.proj === 'ball' ? 6 : 9)), atk: atk, bonus: st.bonus || null });
      G.sfx(st.proj === 'ball' ? 'cannon' : 'arrow', src.x, src.y);
      if (st.proj === 'ball') S.fx.push({ k: 'smoke', x: src.x, y: src.y, t: S.t });
    } else {
      applyHit(src, e, atk, st.bonus, false);
      G.sfx(e.k === 'b' ? 'thud' : 'hit', e.x, e.y);
    }
  }
  function applyHit(src, e, atk, bonus, ranged) {
    if (!e || e.dead) return;
    var armor;
    if (e.k === 'b') armor = ranged ? G.BLD_ARMOR.p : G.BLD_ARMOR.m;
    else { var es = ust(e); armor = ranged ? es.pa : es.ma; }
    var dmg = Math.max(1, atk - armor);
    if (bonus) { var cls = e.k === 'b' ? 'bld' : G.UNITS[e.t].cls; if (bonus[cls]) dmg += bonus[cls]; }
    damage(e, dmg, src);
  }
  function damage(e, dmg, src) {
    e.hp -= dmg; e.hit = S.t;
    if (e.o === 0 && src && src.o === 1) alertAttack(e);
    if (e.hp <= 0) { G.kill(e, src); return; }
    if (e.k === 'u' && src && !src.dead && src.o !== e.o && (src.k === 'u' || src.k === 'b')) {
      var ed = G.UNITS[e.t];
      if (ed.cls !== 'vil' && !(ed.onlyBld && src.k !== 'b') && (!e.task || e.task.k === 'amove')) {
        setTask(e, { k: 'atk', id: src.id, auto: 1, then: e.task });
      }
    }
  }
  G.damage = damage;
  function alertAttack(e) {
    if (S.t - S.tm.alert < 15) return;
    S.tm.alert = S.t;
    var what = e.k === 'b' ? 'Atac la ' + G.ename(e) + '!' : (e.t === 'vil' ? 'Țăranii tăi sunt atacați!' : 'Oastea ta e atacată!');
    G.msg(what, 'alert', { x: e.x, y: e.y });
    G.sfx('horn');
  }
  G.kill = function (e, by) {
    if (e.dead) return;
    e.dead = 1; e.hp = 0; S.dirty = 1;
    if (blocks(e)) occupy(e, false);
    if (e.k === 'u') {
      S.fx.push({ k: 'corpse', x: e.x, y: e.y, t: S.t, ut: e.t, o: e.o, face: e.face });
      S.players[e.o].st.lost++;
      if (by && by.o !== undefined && by.o !== e.o && S.players[by.o]) S.players[by.o].st.killed++;
      if (G.UNITS[e.t].hero && C.hero[e.o] === e.id) {
        C.hero[e.o] = 0;
        G.msg(e.o === 0 ? 'Ștefan cel Mare a căzut! Îl poți readuce din Cetatea de Scaun.' : 'Soliman Pașa a căzut!', e.o === 0 ? 'alert' : 'good', { x: e.x, y: e.y });
      }
      G.sfx('death', e.x, e.y);
    } else if (e.k === 'b') {
      S.fx.push({ k: 'rubble', x: e.x, y: e.y, n: e.n, t: S.t });
      if (by && by.o !== undefined && by.o !== e.o && S.players[by.o]) S.players[by.o].st.razed++;
      if (e.o === 0 && by) G.msg('Au dărâmat: ' + G.ename(e) + '.', 'alert', { x: e.x, y: e.y });
      if (e.o === 1 && by && by.o === 0) G.msg('Ai dărâmat: ' + G.ename(e) + '!', 'good', { x: e.x, y: e.y });
      G.sfx('collapse', e.x, e.y);
      e.q.forEach(function (it) { refund(S.players[e.o], it.u ? G.UNITS[it.u].cost : G.TECHS[it.tech].cost); });
      e.q = [];
    } else if (e.k === 'r' && e.t === 'tree') {
      S.fx.push({ k: 'stump', x: e.x, y: e.y, t: S.t });
    }
  };

  // ---------- resurse ----------
  function resKind(e) { return e.k === 'b' ? 'farm' : e.t; }
  function resType(e) { return e.k === 'b' ? 'f' : G.RESD[e.t].r; }
  G.findRes = function (o, kind, x, y, rad, useLim) {
    var best = null, bd = rad * rad, i;
    if (kind === 'farm') {
      for (i = 0; i < C.blds.length; i++) {
        var b = C.blds[i];
        if (b.dead || b.o !== o || b.t !== 'ogor' || !b.built || (C.gcount[b.id] || 0) >= 1) continue;
        var db = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
        if (db < bd) { bd = db; best = b; }
      }
      return best;
    }
    var lim = G.RESD[kind].lim, N = S.N;
    for (i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.k !== 'r' || e.dead || e.t !== kind) continue;
      var d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d >= bd) continue;
      if (useLim !== false && (C.gcount[e.id] || 0) >= lim) continue;
      if (o === 0 && !S.players[0].ai && !S.exp[e.ty * N + e.tx]) continue;
      if (!accessible(e)) continue;
      bd = d; best = e;
    }
    return best;
  };
  function findDrop(o, r, x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || b.o !== o || !b.built) continue;
      var dr = G.BLDS[b.t].drop;
      if (!dr || dr.indexOf(r) < 0) continue;
      var d = distRect(x, y, rectOf(b));
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  G.findDrop = findDrop;

  function doGat(u, T, dt) {
    var P = S.players[u.o], st = ust(u), e = getE(T.id);
    if (e && e.k === 'b' && (e.o !== u.o || !e.built)) e = null;
    if (!e) {
      var ne = G.findRes(u.o, T.kind, T.ox, T.oy, 9);
      if (ne) { T.id = ne.id; T.ox = ne.x; T.oy = ne.y; e = ne; u.gk = null; }
      else { u.path = null; u.task = (u.carry && u.carry.n >= 1) ? { k: 'ret', back: null } : null; return; }
    }
    var rt = resType(e);
    if (u.carry && u.carry.r !== rt) u.carry = null;
    if (u.carry && u.carry.n >= st.cap) { setTask(u, { k: 'ret', back: T }); return; }
    var reach = e.k === 'b' ? 0.05 : (G.RESD[e.t].block ? 0.75 : 0.4);
    var r = approach(u, e, reach, dt);
    if (r === 'fail') { u.task = null; u.path = null; return; }
    if (!r) return;
    u.wk = 0.25;
    if (e.k !== 'b') u.face = ((e.x - u.x) - (e.y - u.y)) >= 0 ? 1 : -1;
    var kind = resKind(e);
    var rate = (kind === 'farm' ? G.FARM_RATE : G.RESD[kind].rate) * P.gm * techMul(P, kind);
    var amt = rate * dt;
    if (e.k === 'r') { if (amt > e.amt) amt = e.amt; e.amt -= amt; if (e.amt <= 0.001) G.kill(e, null); }
    if (!u.carry) u.carry = { r: rt, n: 0 };
    u.carry.n += amt;
    if (kind === 'tree' && Math.random() < dt * 1.2) G.sfx('chop', u.x, u.y);
    else if ((kind === 'gold' || kind === 'stone') && Math.random() < dt * 1.2) G.sfx('mine', u.x, u.y);
    if (u.carry.n >= st.cap) { u.carry.n = st.cap; setTask(u, { k: 'ret', back: T }); }
  }
  function doRet(u, T, dt) {
    if (!u.carry || u.carry.n < 0.01) { u.carry = null; finishRet(u, T); return; }
    var d = T.did ? getE(T.did) : null;
    if (!d) { d = findDrop(u.o, u.carry.r, u.x, u.y); if (!d) { u.task = null; return; } T.did = d.id; u.gk = null; }
    var r = approach(u, d, 0.75, dt);
    if (r === 'fail') { u.task = null; return; }
    if (!r) return;
    var P = S.players[u.o];
    P.res[u.carry.r] += u.carry.n;
    P.st.gath[u.carry.r] += u.carry.n;
    u.carry = null;
    finishRet(u, T);
  }
  function finishRet(u, T) {
    if (T.back) setTask(u, T.back); else { u.task = null; u.path = null; }
  }

  // ---------- construcții ----------
  function doBld(u, T, dt) {
    var b = getE(T.id);
    if (!b || b.o !== u.o) { u.task = null; return; }
    var d = G.BLDS[b.t];
    if (b.built && b.hp >= d.hp) { afterBuild(u, b); return; }
    var r = approach(u, b, d.walk ? 0.05 : 0.75, dt);
    if (r === 'fail') { u.task = null; return; }
    if (!r) return;
    u.wk = 0.25;
    if (!d.walk) u.face = ((b.x - u.x) - (b.y - u.y)) >= 0 ? 1 : -1;
    if (Math.random() < dt * 1.5) G.sfx('build', b.x, b.y);
    if (!b.built) {
      var inc = dt / d.time;
      b.prog += inc; b.hp = Math.min(d.hp, b.hp + d.hp * inc);
      if (b.prog >= 1) completeBld(b);
    } else {
      b.hp = Math.min(d.hp, b.hp + d.hp * dt / (d.time * 3));
    }
  }
  function completeBld(b) {
    b.prog = 1; b.built = true;
    if (b.o === 0) { G.msg(G.ename(b) + ' e gata.', 'info'); G.sfx('built'); }
    S.fx.push({ k: 'dust', x: b.x, y: b.y, n: b.n, t: S.t });
  }
  function findUnfinished(o, x, y, rad) {
    var best = null, bd = rad * rad;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || b.o !== o || b.built) continue;
      var d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function afterBuild(u, b) {
    var d = G.BLDS[b.t];
    if (d.farm) { setTask(u, { k: 'gat', id: b.id, kind: 'farm', ox: b.x, oy: b.y }); return; }
    if (d.drop && b.t !== 'cetate') {
      var kinds = d.drop === 'w' ? ['tree'] : d.drop === 'gs' ? ['gold', 'stone'] : ['berry', 'sheep'];
      var best = null, bd = 1e9;
      kinds.forEach(function (k) {
        var r = G.findRes(u.o, k, b.x, b.y, 10);
        if (r && G.dist(r, b) < bd) { bd = G.dist(r, b); best = r; }
      });
      if (best) { setTask(u, { k: 'gat', id: best.id, kind: best.t, ox: best.x, oy: best.y }); return; }
    }
    var nb = findUnfinished(u.o, u.x, u.y, 10);
    if (nb) { setTask(u, { k: 'bld', id: nb.id }); return; }
    u.task = null; u.path = null;
  }

  // ---------- unități ----------
  function updUnit(u, dt) {
    var d = G.UNITS[u.t];
    if (u.cd > 0) u.cd -= dt;
    if (u.mv > 0) u.mv -= dt;
    if (u.wk > 0) u.wk -= dt;
    if (u.sw > 0) u.sw -= dt;
    u.an += dt;
    if (d.regen && u.hp < d.hp) u.hp = Math.min(d.hp, u.hp + d.regen * dt);
    var T = u.task;
    if (!T) { doIdle(u, dt); return; }
    switch (T.k) {
      case 'move': doMove(u, T, dt); break;
      case 'amove': doAMove(u, T, dt); break;
      case 'atk': doAtk(u, T, dt); break;
      case 'gat': doGat(u, T, dt); break;
      case 'ret': doRet(u, T, dt); break;
      case 'bld': doBld(u, T, dt); break;
      default: u.task = null;
    }
  }
  function separate(dt) {
    var k = Math.min(1, dt * 10), N = S.N;
    function shift(u, mx, my) {
      var nx = u.x + mx, ny = u.y + my;
      if (nx > 0 && ny > 0 && nx < N && ny < N && C.pass[Math.floor(ny) * N + Math.floor(nx)]) { u.x = nx; u.y = ny; }
    }
    for (var i = 0; i < C.units.length; i++) {
      var a = C.units[i];
      if (a.dead) continue;
      var ra = G.UNITS[a.t].r;
      forUnitsNear(a.x, a.y, 1, function (b) {
        if (b.id <= a.id || b.dead) return;
        var rr = ra + G.UNITS[b.t].r, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) return;
        var d = Math.sqrt(d2);
        if (d < 1e-4) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.sqrt(dx * dx + dy * dy) || 1; }
        var over = (rr - d) * k, nx = dx / d, ny = dy / d;
        var wa = (a.wk > 0 ? 0.2 : 1) * (a.mv > 0 ? 0.6 : 1), wb = (b.wk > 0 ? 0.2 : 1) * (b.mv > 0 ? 0.6 : 1), s = wa + wb;
        shift(a, -nx * over * wa / s, -ny * over * wa / s);
        shift(b, nx * over * wb / s, ny * over * wb / s);
      });
    }
  }

  // ---------- clădiri ----------
  function updBld(b, dt) {
    var d = G.BLDS[b.t], P = S.players[b.o];
    if (!b.built) return;
    if (b.q.length) {
      var it = b.q[0];
      if (it.left > 0) it.left -= dt;
      if (it.left <= 0) {
        if (it.u) {
          if (P.pop < P.cap || G.UNITS[it.u].hero) { spawnUnit(b, it.u); b.q.shift(); }
          else if (b.o === 0 && S.t - S.tm.popMsg > 12) { S.tm.popMsg = S.t; G.msg('Nu mai ai loc. Construiește case! 🏠', 'warn'); }
        } else { finishTech(P, it.tech); b.q.shift(); }
      }
    }
    if (d.atk) {
      b.cd -= dt;
      if (b.cd <= 0) {
        var R = rectOf(b), rng = d.atk.rng, best = null, bd = 1e9;
        forUnitsNear(b.x, b.y, rng + b.n / 2 + 1, function (e) {
          if (e.o === b.o || e.dead) return;
          var dd = distRect(e.x, e.y, R);
          if (dd <= rng && dd < bd) { bd = dd; best = e; }
        });
        if (best) {
          b.cd = d.atk.rof;
          S.proj.push({ k: 'arrow', sx: b.x, sy: b.y, tx: best.x, ty: best.y, id: best.id, sid: b.id, o: b.o, p: 0, h0: b.t === 'cetate' ? 1.6 : 1.9,
            dur: Math.max(0.2, G.dist(b, best) / 9), atk: d.atk.atk + (P.techs.sageti ? 1 : 0), bonus: null });
          G.sfx('arrow', b.x, b.y);
        } else b.cd = 0.4;
      }
    }
    if (d.heal) {
      b.ht = (b.ht || 0) - dt;
      if (b.ht <= 0) {
        b.ht = 1;
        forUnitsNear(b.x, b.y, d.heal + 2, function (u) {
          if (u.o !== b.o || u.dead || G.UNITS[u.t].cls === 'sie') return;
          if (distRect(u.x, u.y, rectOf(b)) > d.heal) return;
          var mx = G.UNITS[u.t].hp;
          if (u.hp < mx) u.hp = Math.min(mx, u.hp + 1.5);
        });
      }
    }
  }
  function spawnUnit(b, t) {
    var P = S.players[b.o];
    var sp = freeSpot(b, b.rally ? [b.rally.x, b.rally.y] : null);
    var u = G.addUnit(t, b.o, sp[0], sp[1]);
    P.pop++; P.st.trained++;
    if (b.rally) {
      var re = b.rally.id ? getE(b.rally.id) : null;
      if (re && t === 'vil' && (re.k === 'r' || (re.k === 'b' && G.BLDS[re.t].farm && re.o === b.o))) G.cmdGather([u], re);
      else if (re && t === 'vil' && re.k === 'b' && re.o === b.o && !re.built) G.cmdBuild([u], re);
      else G.cmdMove([u], b.rally.x, b.rally.y);
    }
    if (b.o === 0) G.sfx('train');
    return u;
  }
  function finishTech(P, id) {
    var T = G.TECHS[id];
    P.techs[id] = 1; C.sc[P.id] = {};
    if (T.ageUp) {
      P.age = T.ageUp;
      if (P.id === 0) { G.msg('Ai intrat în ' + G.AGES[P.age] + '!', 'good'); G.sfx('age'); }
      else G.msg('Otomanii au intrat în ' + G.AGES[P.age] + '.', 'warn');
    } else if (P.id === 0) { G.msg(T.name + ': gata.', 'info'); G.sfx('built'); }
  }

  function updProj(dt) {
    var a = S.proj;
    for (var i = a.length - 1; i >= 0; i--) {
      var p = a[i], e = getE(p.id);
      if (e) { p.tx = e.x; p.ty = e.y; }
      p.p += dt / p.dur;
      if (p.p >= 1) {
        if (e) {
          var src = getE(p.sid) || { o: p.o, k: 'x', dead: 1 };
          applyHit(src, e, p.atk, p.bonus, true);
          if (p.k === 'ball') { S.fx.push({ k: 'boom', x: e.x, y: e.y, t: S.t }); G.sfx('boom', e.x, e.y); }
        }
        a.splice(i, 1);
      }
    }
  }

  // ---------- ceața (doar pentru jucător) ----------
  G.updFog = function () {
    var vis = C.vis, exp = S.exp, N = S.N;
    vis.fill(0);
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead || e.o !== 0) continue;
      var r = e.k === 'u' ? ust(e).los : (e.built ? G.BLDS[e.t].los + e.n / 2 : 2);
      var cx = e.x, cy = e.y, r2 = r * r;
      var x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(N - 1, Math.floor(cx + r));
      var y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(N - 1, Math.floor(cy + r));
      for (var y = y0; y <= y1; y++) {
        var dy = y + 0.5 - cy;
        for (var x = x0; x <= x1; x++) {
          var dx = x + 0.5 - cx;
          if (dx * dx + dy * dy <= r2) { var k = y * N + x; vis[k] = 1; exp[k] = 1; }
        }
      }
    }
  };
  G.visible = function (x, y) { var N = S.N; return C.vis[Math.floor(y) * N + Math.floor(x)] === 1; };
  G.explored = function (x, y) { var N = S.N; return S.exp[Math.floor(y) * N + Math.floor(x)] === 1; };

  // ---------- bucla ----------
  function refreshLists() {
    var us = C.units = [], bs = C.blds = [], pop = [0, 0], cap = [0, 0];
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead) continue;
      if (e.k === 'u') { us.push(e); pop[e.o]++; }
      else if (e.k === 'b') { bs.push(e); if (e.built) cap[e.o] += G.BLDS[e.t].pop || 0; }
    }
    for (var p = 0; p < 2; p++) { S.players[p].pop = pop[p]; S.players[p].cap = Math.min(G.MAXPOP, cap[p]); }
    buildGrid();
    var gc = C.gcount = {};
    for (var j = 0; j < us.length; j++) {
      var T = us[j].task;
      if (!T) continue;
      var g = T.k === 'gat' ? T : (T.k === 'ret' && T.back ? T.back : null);
      if (g) gc[g.id] = (gc[g.id] || 0) + 1;
    }
  }
  G.refreshLists = refreshLists;
  function sweep() {
    S.ents = S.ents.filter(function (e) { if (e.dead) { C.byId.delete(e.id); return false; } return true; });
    S.dirty = 0;
  }
  function cleanFx() {
    var life = { corpse: 14, rubble: 30, stump: 40, dust: 1.5, boom: 0.8, smoke: 1.2 };
    S.fx = S.fx.filter(function (f) { return S.t - f.t < (life[f.k] || 2); });
  }
  function checkWin() {
    if (S.over) return;
    var has = [false, false];
    C.blds.forEach(function (b) { if (!b.dead && b.t === 'cetate') has[b.o] = true; });
    if (!has[1]) S.over = 1; else if (!has[0]) S.over = 2;
    if (S.over) G.sfx(S.over === 1 ? 'win' : 'lose');
  }
  G.update = function (dt) {
    if (!S || S.over) return;
    S.t += dt;
    C.budget = 14;
    refreshLists();
    for (var i = 0; i < C.units.length; i++) { var u = C.units[i]; if (!u.dead) updUnit(u, dt); }
    separate(dt);
    for (var j = 0; j < C.blds.length; j++) { var b = C.blds[j]; if (!b.dead) updBld(b, dt); }
    updProj(dt);
    var tm = S.tm;
    if ((tm.fog -= dt) <= 0) { tm.fog = 0.25; G.updFog(); }
    if ((tm.ai -= dt) <= 0) { tm.ai = 0.5; for (var p = 0; p < 2; p++) if (S.players[p].ai && G.aiTick) G.aiTick(p); }
    if ((tm.win -= dt) <= 0) { tm.win = 1; checkWin(); cleanFx(); }
    if (S.dirty) sweep();
  };

  // ---------- comenzi (le folosesc și jucătorul, și calculatorul) ----------
  G.canAfford = function (P, cost, reserve) {
    for (var k in cost) if (P.res[k] - ((reserve && reserve[k]) || 0) < cost[k]) return false;
    return true;
  };
  G.pay = function (P, cost) { for (var k in cost) P.res[k] -= cost[k]; };
  function refund(P, cost) { for (var k in cost) P.res[k] += cost[k]; }
  G.lackMsg = function (P, cost) {
    for (var k in cost) if (P.res[k] < cost[k]) return 'Îți mai trebuie ' + Math.ceil(cost[k] - P.res[k]) + ' ' + G.RES_ICON[k] + ' ' + G.RES_NAME[k].toLowerCase() + '.';
    return '';
  };
  function nearestPassable(x, y) {
    var N = S.N, fx = Math.floor(x), fy = Math.floor(y);
    if (fx >= 0 && fy >= 0 && fx < N && fy < N && C.pass[fy * N + fx]) return [x, y];
    for (var r = 1; r < 6; r++) {
      var best = null, bd = 1e9;
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var tx = fx + dx, ty = fy + dy;
        if (tx < 0 || ty < 0 || tx >= N || ty >= N || !C.pass[ty * N + tx]) continue;
        var d = (tx + 0.5 - x) * (tx + 0.5 - x) + (ty + 0.5 - y) * (ty + 0.5 - y);
        if (d < bd) { bd = d; best = [tx + 0.5, ty + 0.5]; }
      }
      if (best) return best;
    }
    return null;
  }
  G.cmdMove = function (units, x, y, amove) {
    units = units.filter(function (u) { return u && !u.dead; });
    if (!units.length) return;
    var p = nearestPassable(x, y); if (!p) return;
    x = p[0]; y = p[1];
    var kind = amove ? 'amove' : 'move';
    if (units.length === 1) { setTask(units[0], { k: kind, x: x, y: y }); return; }
    // așezare în grup, ca să nu stea toți în același punct
    var N = S.N, spots = [], sp = 0.8;
    for (var ring = 0; spots.length < units.length * 2 && ring < 12; ring++) {
      for (var dy = -ring; dy <= ring; dy++) for (var dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        var sx = x + dx * sp, sy = y + dy * sp;
        if (sx < 0 || sy < 0 || sx >= N || sy >= N || !C.pass[Math.floor(sy) * N + Math.floor(sx)]) continue;
        spots.push([sx, sy]);
      }
    }
    var cx = 0, cy = 0;
    units.forEach(function (u) { cx += u.x; cy += u.y; });
    cx /= units.length; cy /= units.length;
    var order = units.slice().sort(function (a, b) { return ((a.x - x) * (a.x - x) + (a.y - y) * (a.y - y)) - ((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y)); });
    var used = {};
    order.forEach(function (u, i) {
      // păstrează aproximativ forma grupului
      var wx = x + (u.x - cx) * 0.35, wy = y + (u.y - cy) * 0.35, best = -1, bd = 1e9;
      for (var s = 0; s < spots.length; s++) {
        if (used[s]) continue;
        var d = (spots[s][0] - wx) * (spots[s][0] - wx) + (spots[s][1] - wy) * (spots[s][1] - wy);
        if (d < bd) { bd = d; best = s; }
      }
      var t = best >= 0 ? spots[best] : [x, y];
      used[best] = 1;
      setTask(u, { k: kind, x: t[0], y: t[1] });
    });
  };
  G.cmdAttack = function (units, e) {
    units.forEach(function (u) {
      if (!u || u.dead) return;
      if (G.UNITS[u.t].onlyBld && e.k !== 'b') return;
      setTask(u, { k: 'atk', id: e.id });
    });
  };
  G.cmdGather = function (units, e) {
    var vils = units.filter(function (u) { return u.t === 'vil'; });
    var others = units.filter(function (u) { return u.t !== 'vil'; });
    if (others.length) G.cmdMove(others, e.x, e.y);
    if (!vils.length) return;
    var kind = e.k === 'b' ? 'farm' : e.t, list = [e];
    if (e.k === 'r' && vils.length > 1) {
      var near = S.ents.filter(function (r) {
        return r.k === 'r' && !r.dead && r.t === e.t && r !== e && Math.abs(r.x - e.x) < 4 && Math.abs(r.y - e.y) < 4 && accessible(r);
      });
      near.sort(function (a, b) { return G.dist(a, e) - G.dist(b, e); });
      list = list.concat(near);
    }
    var lim = e.k === 'r' ? G.RESD[e.t].lim : 1;
    vils.forEach(function (u, i) {
      var r = list[Math.floor(i / lim) % list.length];
      setTask(u, { k: 'gat', id: r.id, kind: kind, ox: r.x, oy: r.y });
    });
  };
  G.cmdBuild = function (units, b) {
    units.forEach(function (u) { if (u && !u.dead && u.t === 'vil') setTask(u, { k: 'bld', id: b.id }); });
  };
  G.cmdStop = function (units) { units.forEach(function (u) { if (u && !u.dead) setTask(u, null); }); };
  G.cmdReturn = function (units) {
    units.forEach(function (u) { if (u && !u.dead && u.carry && u.carry.n > 0) setTask(u, { k: 'ret', back: u.task && u.task.k === 'gat' ? u.task : null }); });
  };

  G.hasBuilt = function (o, t) { return C.blds.some(function (b) { return !b.dead && b.o === o && b.t === t && b.built; }); };
  G.placeError = function (o, t) {
    var P = S.players[o], d = G.BLDS[t];
    if (d.age > P.age) return 'Ai nevoie de ' + G.AGES[d.age] + '.';
    if (d.need && !G.hasBuilt(o, d.need)) return 'Întâi construiește o ' + G.nm(G.BLDS[d.need], P.civ) + '.';
    if (!G.canAfford(P, d.cost)) return G.lackMsg(P, d.cost);
    return '';
  };
  G.canPlace = function (o, t, tx, ty) {
    var d = G.BLDS[t], n = d.n, N = S.N;
    if (tx < 0 || ty < 0 || tx + n > N || ty + n > N) return false;
    for (var y = ty; y < ty + n; y++) for (var x = tx; x < tx + n; x++) {
      var i = y * N + x;
      if (!G.BUILD_T[S.ter[i]] || C.occ[i]) return false;
      if (o === 0 && !S.players[0].ai && !S.exp[i]) return false;
    }
    // nu peste dușmani sau oi
    for (var j = 0; j < S.ents.length; j++) {
      var e = S.ents[j];
      if (e.dead) continue;
      var mob = (e.k === 'u' && e.o !== o) || (e.k === 'r' && !G.RESD[e.t].block);
      if (mob && e.x > tx && e.x < tx + n && e.y > ty && e.y < ty + n) return false;
    }
    return true;
  };
  G.cmdPlace = function (o, t, tx, ty, builders) {
    var P = S.players[o], d = G.BLDS[t];
    if (G.placeError(o, t) || !G.canPlace(o, t, tx, ty)) return null;
    G.pay(P, d.cost);
    var b = G.addBld(t, o, tx, ty, false);
    if (builders && builders.length) G.cmdBuild(builders, b);
    return b;
  };
  G.trainList = function (b) {
    var civ = S.players[b.o].civ, d = G.BLDS[b.t];
    return (d.train || []).filter(function (t) { var u = G.UNITS[t]; return !u.civ || u.civ === civ; });
  };
  G.techList = function (b) {
    var P = S.players[b.o], d = G.BLDS[b.t];
    return (d.tech || []).filter(function (id) {
      var T = G.TECHS[id];
      if (P.techs[id]) return false;
      if (T.ageUp && T.ageUp !== P.age + 1) return false;
      return true;
    });
  };
  function queued(o, what, isTech) {
    return C.blds.some(function (b) {
      return !b.dead && b.o === o && b.q.some(function (it) { return isTech ? it.tech === what : it.u === what; });
    });
  }
  G.queued = queued;
  G.trainError = function (b, t) {
    var P = S.players[b.o], d = G.UNITS[t];
    if (!b.built) return 'Clădirea nu e gata.';
    if (d.age > P.age) return 'Ai nevoie de ' + G.AGES[d.age] + '.';
    if (d.hero && (C.hero[b.o] || queued(b.o, t, false))) return G.nm(d, P.civ) + ' e deja cu tine.';
    if (b.q.length >= 5) return 'Coada e plină.';
    if (!G.canAfford(P, d.cost)) return G.lackMsg(P, d.cost);
    return '';
  };
  G.cmdTrain = function (b, t) {
    var err = G.trainError(b, t);
    if (err) return err;
    var P = S.players[b.o], d = G.UNITS[t];
    G.pay(P, d.cost);
    b.q.push({ u: t, left: d.time, tot: d.time });
    return '';
  };
  G.techError = function (b, id) {
    var P = S.players[b.o], T = G.TECHS[id];
    if (!b.built) return 'Clădirea nu e gata.';
    if (P.techs[id] || queued(b.o, id, true)) return 'Deja e în lucru.';
    if (T.age > P.age) return 'Ai nevoie de ' + G.AGES[T.age] + '.';
    if (b.q.length >= 5) return 'Coada e plină.';
    if (!G.canAfford(P, T.cost)) return G.lackMsg(P, T.cost);
    return '';
  };
  G.cmdTech = function (b, id) {
    var err = G.techError(b, id);
    if (err) return err;
    var P = S.players[b.o], T = G.TECHS[id];
    G.pay(P, T.cost);
    b.q.push({ tech: id, left: T.time, tot: T.time });
    return '';
  };
  G.cmdCancel = function (b, i) {
    var it = b.q[i]; if (!it) return;
    refund(S.players[b.o], it.u ? G.UNITS[it.u].cost : G.TECHS[it.tech].cost);
    b.q.splice(i, 1);
  };
  G.cmdDelete = function (e) {
    if (!e || e.dead) return;
    if (e.k === 'b' && !e.built) {
      var c = G.BLDS[e.t].cost, P = S.players[e.o], f = 1 - e.prog;
      for (var k in c) P.res[k] += Math.floor(c[k] * f * 0.8);
    }
    G.kill(e, null);
  };
  G.cmdRally = function (b, x, y, id) { b.rally = { x: x, y: y, id: id || 0 }; };

  // ---------- salvare ----------
  G.serialize = function () {
    var o = {};
    for (var k in S) o[k] = S[k];
    o.ter = Array.from(S.ter); o.exp = Array.from(S.exp);
    return JSON.stringify(o);
  };
  G.deserialize = function (str) {
    var o = JSON.parse(str);
    o.ter = Uint8Array.from(o.ter); o.exp = Uint8Array.from(o.exp);
    S = G.S = o;
    G.rebuild();
    refreshLists();
    G.updFog();
    return S;
  };
})();
