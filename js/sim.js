// Simularea: entități, mers, strâns resurse, construcții, luptă, producție, ceața, salvarea.
// Jucătorii (2–4) au echipe; C.en[a][b] = a și b sunt dușmani. Fiecare jucător are propria grilă de trecere
// (C.pp[o]), ca porțile să se deschidă doar pentru ai lui.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var S = null;
  var C = G.C = { byId: new Map(), occ: null, pass: null, pp: [], gate: null, vis: null, units: [], blds: [], grid: new Map(),
                  sc: [], bc: [], gm: [], fxl: [], hero: [], gcount: {}, budget: 0, en: [], fear: [], tepe: [], mob: [] };

  G.msgQ = [];
  G.msg = function (text, kind, pos) {
    G.msgQ.push({ text: text, kind: kind || 'info', pos: pos || null });
    if (G.msgQ.length > 40) G.msgQ.shift();
  };
  if (!G.sfx) G.sfx = function () {};

  var MIL = {}; G.MIL_TYPES.forEach(function (t) { MIL[t] = 1; });
  var MILB = { cazarma: 1, poligon: 1, grajd: 1, atelier: 1, fortareata: 1 };
  var TEPE_B = { cetate: 1, fortareata: 1, turn: 1 };
  var PSPD = { arrow: 9, bolt: 11, jav: 8, bullet: 30, stone: 6, ball: 8, treb: 5 };
  var PSFX = { arrow: 'arrow', bolt: 'arrow', jav: 'arrow', bullet: 'gun', stone: 'catapult', ball: 'cannon', treb: 'catapult' };

  function def(e) { return e.k === 'u' ? G.UNITS[e.t] : e.k === 'b' ? G.BLDS[e.t] : G.RESD[e.t]; }
  G.def = def;
  G.nm = function (d, civ) { return typeof d.name === 'string' ? d.name : (d.name[civ] || d.name.def || d.name.mol); };
  G.ename = function (e) {
    if (e.k === 'r') return G.RESD[e.t].name;
    if (e.name) return e.name;
    var P = S.players[e.o];
    if (e.k === 'u' && G.UNITS[e.t].hero) return P.heroName || G.CIVS[P.civ].hero;
    return G.nm(def(e), P.civ);
  };
  G.heroName = function (o) { var P = S.players[o]; return P.heroName || G.CIVS[P.civ].hero; };
  G.ppl = function (o, capital) {
    var P = S.players[o], s = P.ppl || G.CIVS[P.civ].ppl;
    return capital ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  };
  G.getE = function (id) { var e = C.byId.get(id); return e && !e.dead ? e : null; };
  var getE = G.getE;
  G.isMil = function (u) { return u.k === 'u' && !!MIL[u.t]; };

  // ---------- echipe ----------
  function setTeams() {
    var n = S.players.length; C.en = [];
    for (var a = 0; a < n; a++) {
      C.en[a] = [];
      for (var b = 0; b < n; b++) { var pa = S.players[a], pb = S.players[b]; C.en[a][b] = a !== b && !(pa.team > 0 && pa.team === pb.team); }
    }
  }
  G.enemy = function (a, b) { return a !== b && a >= 0 && b >= 0 && !!(C.en[a] && C.en[a][b]); };
  G.ally = function (a, b) { return a === b ? a >= 0 : (a >= 0 && b >= 0 && !!C.en[a] && C.en[a][b] === false); };
  G.setTeam = function (o, team) { S.players[o].team = team; G.rebuild(); refreshLists(); };

  var START_RES = { std: { f: 200, w: 200, g: 100, s: 150 }, med: { f: 500, w: 500, g: 300, s: 300 }, mult: { f: 1500, w: 1500, g: 1000, s: 1000 } };
  function mkPlayer(id, o) {
    var r = START_RES[o.res] || START_RES.std;
    return { id: id, civ: o.civ || 'mol', ai: !!o.ai, team: o.team === undefined ? id + 1 : o.team, col: o.col === undefined ? id : o.col,
      name: o.name || '', heroName: o.heroName || '', ppl: o.ppl || '', aiMode: o.aiMode || 'full',
      res: { f: r.f, w: r.w, g: r.g, s: r.s }, age: 0, techs: {}, line: {}, pop: 0, cap: 0, gm: 1, alive: true, pcd: 0, bell: false,
      st: { trained: 0, killed: 0, lost: 0, razed: 0, techs: 0, trade: 0, gath: { f: 0, w: 0, g: 0, s: 0 }, ageT: [0, 0, 0, 0, 0], tl: [] } };
  }

  // ---------- joc nou ----------
  // opt: diff, seed, size, players [{civ, ai, team, col, name, heroName}], map {type, season}, mapSpec, popMax, startAge,
  //      res (std/med/mult), victory (cucerire/minune/regicid/scenariu), peace (minute), reveal (normal/explorat/tot),
  //      noBases (misiunile își pun singure bazele), setup(S, gm), scen (starea misiunii)
  G.newGame = function (opt) {
    opt = opt || {};
    var pl = opt.players || [{ civ: opt.civ0 || 'mol', ai: !!opt.aiBoth, team: 1 }, { civ: opt.civ1 || 'oto', ai: true, team: 2 }];
    S = G.S = { v: 2, N: opt.size || (opt.mapSpec && opt.mapSpec.N) || G.N, t: 0, seed: opt.seed || ((Math.random() * 1e9) | 0), diff: opt.diff || 'normal',
      ents: [], nextId: 1, proj: [], fx: [], over: 0, dirty: 0,
      tm: { fog: 0, ai: 0.3, win: 1, alert: -99, popMsg: -99, trig: 0, tl: 0 },
      players: [], ai: {}, exp: null, ter: null, base: null, decor: [],
      map: { type: (opt.map && opt.map.type) || 'rau', season: (opt.map && opt.map.season) || (opt.mapSpec && opt.mapSpec.season) || 'vara' },
      opt: { victory: opt.victory || 'cucerire', peace: (opt.peace || 0) * 60, popMax: opt.popMax || G.MAXPOP, startAge: opt.startAge || 0,
             reveal: opt.reveal || 'normal', res: opt.res || 'std', maxAge: opt.maxAge, noBuild: opt.noBuild || null, noUnits: opt.noUnits || null, nomad: !!opt.nomad, daynight: !!opt.daynight },
      mkt: { f: 100, w: 100, s: 100 }, wonder: null, losMul: 1, night: 0, fog: 0, vars: {}, scen: opt.scen || null, winTeam: 0 };
    pl.forEach(function (p, i) { S.players.push(mkPlayer(i, Object.assign({ res: S.opt.res }, p))); });
    setTeams();
    var D = G.DIFF[S.diff] || G.DIFF.normal;
    S.players.forEach(function (P) {
      if (P.ai && P.id !== 0) { P.gm = D.gather; if (D.bonus) G.RES.forEach(function (r) { P.res[r] += D.bonus; }); }
      var sa = S.opt.startAge;
      for (var a = 1; a <= sa; a++) P.techs[['feudal', 'castle', 'imperial', 'renastere'][a - 1]] = 1;
      P.age = sa;
      if (sa) G.RES.forEach(function (r) { P.res[r] += sa * 300; });
    });
    var gm = opt.mapSpec ? G.genMapSpec(S, opt.mapSpec) : G.genMap(S);
    if (!S.decor) S.decor = [];
    S.exp = new Uint8Array(S.N * S.N);
    if (S.opt.reveal !== 'normal') S.exp.fill(1);
    G.rebuild();
    (gm.objs || []).forEach(function (o) { if (G.RESD[o.t] && o.x >= 0 && o.y >= 0 && o.x < S.N && o.y < S.N) G.addRes(o.t, o.x, o.y); });
    if (!opt.noBases) {
      var bases = (gm.base || S.base || []).slice(), N = S.N, corners = [[N - 13, N - 13], [13, 13], [13, N - 13], [N - 13, 13]];
      for (var p = 0; p < S.players.length; p++) {
        var b = bases[p] || corners[p];
        // nomazii: fără cetate, cu țărani și lemnul și piatra ei; o așază unde vor
        if (opt.nomad) {
          for (var nv = 0; nv < 4; nv++) { var np = nearestPassable(b[0] + Math.cos(nv * 1.6) * 2.5, b[1] + Math.sin(nv * 1.6) * 2.5) || [b[0], b[1]]; G.addUnit('vil', p, np[0], np[1]); }
          var nh = nearestPassable(b[0], b[1] + 1) || [b[0], b[1]]; G.addUnit('hero', p, nh[0], nh[1]);
          S.players[p].res.w += G.BLDS.cetate.cost.w; S.players[p].res.s += G.BLDS.cetate.cost.s || 0;
          continue;
        }
        clearArea(b[0] - 2, b[1] - 2, 4, 4);
        var tc = G.addBld('cetate', p, b[0] - 2, b[1] - 2, true);
        for (var i = 0; i < 3; i++) { var sp = freeSpot(tc, null); G.addUnit('vil', p, sp[0], sp[1]); }
        var hs = freeSpot(tc, null); G.addUnit('hero', p, hs[0], hs[1]);
      }
    }
    if (opt.setup) opt.setup(S, gm);
    refreshLists();
    G.updFog();
    return S;
  };
  // scoate resursele de pe un loc (pentru baze puse peste o hartă care nu le-a prevăzut)
  function clearArea(tx, ty, w, h) {
    var N = S.N;
    S.ents.forEach(function (e) {
      if (e.k === 'r' && !e.dead && e.tx >= tx - 2 && e.tx < tx + w + 2 && e.ty >= ty - 2 && e.ty < ty + h + 2) { e.dead = 1; occupy(e, false); S.dirty = 1; }
    });
    for (var y = Math.max(0, ty); y < Math.min(N, ty + h); y++) for (var x = Math.max(0, tx); x < Math.min(N, tx + w); x++) {
      if (!G.BUILD_T[S.ter[y * N + x]]) { S.ter[y * N + x] = 0; setPass(y * N + x, 1, -1); }
    }
    if (S.dirty) { S.ents = S.ents.filter(function (e) { if (e.dead) { C.byId.delete(e.id); return false; } return true; }); S.dirty = 0; }
  }
  G.clearArea = function (tx, ty, w, h) { clearArea(tx, ty, w, h); };

  // ---------- ocuparea grilei ----------
  function blocks(e) { return e.k === 'b' || (e.k === 'r' && G.RESD[e.t].block); }
  function setPass(i, v, gateO) {
    C.pass[i] = v;
    for (var p = 0; p < C.pp.length; p++) C.pp[p][i] = (v || (gateO >= 0 && G.ally(gateO, p))) ? 1 : 0;
  }
  function occupy(e, on) {
    var n = e.k === 'b' ? e.n : 1, d = e.k === 'b' ? G.BLDS[e.t] : null, walk = d && d.walk, N = S.N;
    var gateO = d && d.gate && e.built ? e.o : -1;
    for (var y = e.ty; y < e.ty + n; y++) for (var x = e.tx; x < e.tx + n; x++) {
      var i = y * N + x;
      if (on) { C.occ[i] = e.id; setPass(i, walk ? G.PASS_T[S.ter[i]] : 0, gateO); C.gate[i] = gateO >= 0 ? gateO + 1 : 0; if (C.wpass) C.wpass[i] = 0; }
      else if (C.occ[i] === e.id) { C.occ[i] = 0; setPass(i, G.PASS_T[S.ter[i]] ? 1 : 0, -1); C.gate[i] = 0; if (C.wpass) C.wpass[i] = S.ter[i] === 2 ? 1 : 0; }
    }
  }
  G.rebuild = function () {
    var N = S.N, M = N * N, nP = S.players.length, p;
    C.byId = new Map(); C.occ = new Int32Array(M); C.pass = new Uint8Array(M); C.wpass = new Uint8Array(M); C.gate = new Int8Array(M); C.vis = new Uint8Array(M);
    C.pp = []; for (p = 0; p < nP; p++) C.pp.push(new Uint8Array(M));
    C.sc = []; C.bc = []; C.gm = []; C.fxl = []; C.hero = [];
    for (p = 0; p < nP; p++) { C.sc.push({}); C.bc.push({}); C.gm.push({}); C.fxl.push(null); C.hero.push(0); }
    C.gcount = {};
    setTeams();
    for (var i = 0; i < M; i++) { var v = G.PASS_T[S.ter[i]] ? 1 : 0; C.pass[i] = v; C.wpass[i] = S.ter[i] === 2 ? 1 : 0; for (p = 0; p < nP; p++) C.pp[p][i] = v; }
    S.ents.forEach(function (e) {
      C.byId.set(e.id, e);
      if (e.dead) return;
      if (blocks(e)) occupy(e, true);
      if (e.k === 'u' && G.UNITS[e.t].hero) C.hero[e.o] = e.id;
    });
    G.Path.init(N);
  };
  G.passFor = function (o) { return (o >= 0 && C.pp[o]) || C.pass; };
  // corăbiile merg pe apă: altă grilă de trecere și altă cheie pentru căutarea drumului
  function isNaval(u) { return !!(u && u.k === 'u' && G.UNITS[u.t].naval); }
  function pgrid(u) { return isNaval(u) ? C.wpass : (C.pp[u.o] || C.pass); }
  function pk(u) { return isNaval(u) ? 'w' : u.o; }
  G.isNaval = isNaval; G.pgrid = pgrid;
  function addEnt(e) { e.id = S.nextId++; S.ents.push(e); C.byId.set(e.id, e); if (blocks(e)) occupy(e, true); return e; }

  G.addUnit = function (t, o, x, y) {
    var st = ustT(o, t);
    var u = addEnt({ k: 'u', t: t, o: o, x: x, y: y, hp: st.hp, mhp: st.hp, task: null, path: null, pi: 0, carry: null, cd: Math.random(), face: 1, an: Math.random() * 6, mv: 0, wk: 0, sw: 0 });
    if (t === 'vil' && (u.id * 7919) % 5 < 2) u.fem = 1;
    if (G.UNITS[t].hero) C.hero[o] = u.id;
    return u;
  };
  G.addBld = function (t, o, tx, ty, built) {
    var d = G.BLDS[t], mh = bstT(o, t).hp;
    var b = addEnt({ k: 'b', t: t, o: o, tx: tx, ty: ty, n: d.n, x: tx + d.n / 2, y: ty + d.n / 2, hp: built ? mh : 1, mhp: mh, built: !!built, prog: built ? 1 : 0,
      q: [], rally: null, cd: 1, gar: [] });
    pushOut(b);
    if (built && d.wonder) S.wonder = { o: o, id: b.id, t0: S.t };
    return b;
  };
  G.addRes = function (t, tx, ty) {
    var R = G.RESD[t], e = addEnt({ k: 'r', t: t, tx: tx, ty: ty, x: tx + 0.5, y: ty + 0.5, amt: R.amt, v: (G.hash2(tx, ty, 9) * 4) | 0 });
    if (R.hunt) { e.hp = e.mhp = R.hp; e.hx = e.x; e.hy = e.y; e.cd = 0; e.sw = 0; e.mv = 0; e.an = Math.random() * 6; e.dir8 = (Math.random() * 8) | 0; }
    return e;
  };
  // pune n oameni de tipul t lângă (x, y) (pentru misiuni și ajutoare)
  G.placeUnits = function (o, t, n, x, y) {
    var out = [], N = S.N, pass = C.pass, k = 0;
    for (var ring = 0; out.length < n && ring < 14; ring++) {
      for (var dy = -ring; dy <= ring && out.length < n; dy++) for (var dx = -ring; dx <= ring && out.length < n; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        var tx = Math.floor(x) + dx, ty = Math.floor(y) + dy;
        if (tx < 1 || ty < 1 || tx >= N - 1 || ty >= N - 1 || !pass[ty * N + tx]) continue;
        if ((k++ & 1) && ring > 0 && n > 6) continue;
        out.push(G.addUnit(t, o, tx + 0.5 + (Math.random() - 0.5) * 0.3, ty + 0.5 + (Math.random() - 0.5) * 0.3));
      }
    }
    return out;
  };

  // un loc liber lângă clădire, cât mai aproape de țintă
  function freeSpot(b, tgt, grid) {
    var tx = tgt ? tgt[0] : b.x + b.n, ty = tgt ? tgt[1] : b.y + b.n, best = null, bd = 1e9, N = S.N, pass = grid || C.pass;
    for (var ring = 1; ring <= 6 && !best; ring++) {
      for (var y = b.ty - ring; y < b.ty + b.n + ring; y++) for (var x = b.tx - ring; x < b.tx + b.n + ring; x++) {
        if (x > b.tx - ring && x < b.tx + b.n + ring - 1 && y > b.ty - ring && y < b.ty + b.n + ring - 1) continue;
        if (x < 0 || y < 0 || x >= N || y >= N || !pass[y * N + x]) continue;
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
      if (u.dead || u.gin) return;
      var mob = u.k === 'u' || (u.k === 'r' && !G.RESD[u.t].block);
      if (!mob) return;
      if (u.x > b.tx - 0.05 && u.x < b.tx + b.n + 0.05 && u.y > b.ty - 0.05 && u.y < b.ty + b.n + 0.05) {
        var sp = freeSpot(b, [u.x, u.y], isNaval(u) ? C.wpass : null); u.x = sp[0]; u.y = sp[1]; u.path = null;
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
  function accessible(e, naval) {
    if (!G.RESD[e.t].block) return true;
    var N = S.N, pass = naval ? C.wpass : C.pass;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var x = e.tx + dx, y = e.ty + dy;
      if ((dx || dy) && x >= 0 && y >= 0 && x < N && y < N && pass[y * N + x]) return true;
    }
    return false;
  }
  G.accessible = accessible;

  // ---------- statistici: civilizație + tehnologii ----------
  function selU(sel, t, d) {
    return !!((sel.t && sel.t.indexOf(t) >= 0) || (sel.cls && sel.cls.indexOf(d.cls) >= 0) || (sel.line && d.line && sel.line.indexOf(d.line) >= 0));
  }
  function fxl(o) {
    var a = C.fxl[o]; if (a) return a;
    var P = S.players[o]; a = (G.CIVS[P.civ].fx || []).slice();
    for (var id in P.techs) { var T = G.TECHS[id]; if (T && T.fx) a = a.concat(T.fx); }
    return (C.fxl[o] = a);
  }
  function ustT(o, t) {
    var c = C.sc[o][t]; if (c) return c;
    var d = G.UNITS[t], k, s; c = {};
    for (k in d) c[k] = d[k];
    if (d.bonus) { c.bonus = {}; for (k in d.bonus) c.bonus[k] = d.bonus[k]; }
    var add = {}, mul = {}, F = fxl(o);
    for (var i = 0; i < F.length; i++) {
      var f = F[i];
      if (!f.u || !f.s || !selU(f.u, t, d)) continue;
      if (f.add !== undefined) add[f.s] = (add[f.s] || 0) + f.add;
      if (f.mul !== undefined) mul[f.s] = (mul[f.s] || 1) * f.mul;
    }
    for (s in add) { if (s === 'bld') { c.bonus = c.bonus || {}; c.bonus.bld = (c.bonus.bld || 0) + add[s]; } else c[s] = (c[s] || 0) + add[s]; }
    for (s in mul) { if (s === 'bld') { if (c.bonus && c.bonus.bld) c.bonus.bld = Math.round(c.bonus.bld * mul[s]); } else c[s] = (c[s] || 0) * mul[s]; }
    c.hp = Math.round(c.hp);
    return (C.sc[o][t] = c);
  }
  function ust(u) { return ustT(u.o, u.t); }
  G.ust = ust; G.ustT = ustT;
  function bstT(o, t) {
    var c = C.bc[o][t]; if (c) return c;
    var d = G.BLDS[t], A = d.atk, s;
    c = { hp: d.hp, los: d.los, arm: 0, atk: A ? A.atk : 0, rng: A ? A.rng : 0, rof: A ? A.rof : 0, n: A ? (A.n || 1) : 0 };
    var add = {}, mul = {}, F = fxl(o);
    for (var i = 0; i < F.length; i++) {
      var f = F[i];
      if (!f.b || !f.s) continue;
      if (!(f.b === 'all' || (f.b === 'walls' ? !!d.wall : (typeof f.b !== 'string' && f.b.indexOf(t) >= 0)))) continue;
      if (f.add !== undefined) add[f.s] = (add[f.s] || 0) + f.add;
      if (f.mul !== undefined) mul[f.s] = (mul[f.s] || 1) * f.mul;
    }
    for (s in add) c[s] = (c[s] || 0) + add[s];
    for (s in mul) c[s] = (c[s] || 0) * mul[s];
    if (!A) { c.atk = 0; c.rng = 0; }
    c.hp = Math.round(c.hp);
    return (C.bc[o][t] = c);
  }
  G.bstT = bstT;
  G.bst = function (b) { return bstT(b.o, b.t); };
  G.maxHp = function (e) { return e.k === 'u' ? ustT(e.o, e.t).hp : e.k === 'b' ? bstT(e.o, e.t).hp : 0; };
  function gmul(o, kind) {
    var m = C.gm[o][kind]; if (m) return m;
    m = S.players[o].gm;
    var F = fxl(o);
    for (var i = 0; i < F.length; i++) if (F[i].gather === kind) m *= F[i].mul;
    return (C.gm[o][kind] = m);
  }
  G.gmul = gmul;
  G.costOf = function (o, t) {
    var key = '$' + t, c = C.sc[o][key]; if (c) return c;
    var d = G.UNITS[t], F = fxl(o), k; c = {};
    for (k in d.cost) c[k] = d.cost[k];
    for (var i = 0; i < F.length; i++) {
      var f = F[i];
      if (!f.cost || !selU(f.cost, t, d)) continue;
      for (k in c) if (!f.res || f.res === k) c[k] = Math.round(c[k] * f.mul);
    }
    return (C.sc[o][key] = c);
  };
  function trainMul(o, bt) {
    var m = 1, F = fxl(o);
    for (var i = 0; i < F.length; i++) { var f = F[i]; if (f.train && (f.train === 'mil' ? MILB[bt] : f.train.indexOf(bt) >= 0)) m *= f.mul; }
    return m;
  }
  function researchMul(o) { var m = 1, F = fxl(o); for (var i = 0; i < F.length; i++) if (F[i].research) m *= F[i].research; return m; }
  function healMul(o) { var m = 1, F = fxl(o); for (var i = 0; i < F.length; i++) if (F[i].heal) m *= F[i].heal; return m; }
  function resetCaches(o) { C.sc[o] = {}; C.bc[o] = {}; C.gm[o] = {}; C.fxl[o] = null; }
  // otomanii au bombardele cu o epocă mai devreme, fără Chimie
  function ageOfU(P, d) { return d.line === 'can' && P.civ === 'oto' ? d.age - 1 : d.age; }
  function ageOfT(P, T) { return T.up && G.UNITS[T.up[1]].line === 'can' && P.civ === 'oto' ? T.age - 1 : T.age; }
  function reqOkU(P, d) {
    if (!d.req || (d.line === 'can' && P.civ === 'oto')) return true;
    for (var i = 0; i < d.req.length; i++) if (!P.techs[d.req[i]]) return false;
    return true;
  }
  G.ageOfU = function (o, t) { return ageOfU(S.players[o], G.UNITS[t]); };
  G.ageOfT = function (o, id) { return ageOfT(S.players[o], G.TECHS[id]); };

  // ---------- eroul: aura, teama, puterile ----------
  function heroOf(o) { var id = C.hero[o]; var h = id ? getE(id) : null; return h && !h.gin ? h : null; }
  G.heroOf = heroOf;
  function inAura(u) {
    if (G.UNITS[u.t].hero || u.t === 'vil') return false;
    var h = heroOf(u.o); if (!h) return false;
    var r = S.players[u.o].techs.bucium ? 8 : 4;
    return Math.abs(h.x - u.x) < r && Math.abs(h.y - u.y) < r;
  }
  function auraBonus(u) { return u.k === 'u' && inAura(u) ? 2 : 0; }
  G.auraBonus = auraBonus; G.inAura = inAura;
  function atkMul(src) {
    var m = 1, i;
    if (src.buf && src.buf.until > S.t && src.buf.a) m *= src.buf.a;
    if (src.deb && src.deb.until > S.t) m *= src.deb.a;
    if (src.k !== 'u') return m;
    for (i = 0; i < C.fear.length; i++) {
      var h = C.fear[i];
      if (G.enemy(h.o, src.o) && Math.abs(h.x - src.x) < 5 && Math.abs(h.y - src.y) < 5) { m *= 0.8; break; }
    }
    for (i = 0; i < C.tepe.length; i++) {
      var b = C.tepe[i];
      if (G.enemy(b.o, src.o) && distRect(src.x, src.y, rectOf(b)) < 7) { m *= 0.75; break; }
    }
    return m;
  }
  G.atkMul = atkMul;

  // ---------- grila de vecini ----------
  function buildGrid() {
    var grid = C.grid; grid.clear();
    for (var i = 0; i < C.units.length; i++) {
      var u = C.units[i], k = Math.floor(u.y / 2) * 128 + Math.floor(u.x / 2), a = grid.get(k);
      if (!a) grid.set(k, a = []);
      a.push(u);
    }
  }
  function forUnitsNear(x, y, r, fn) {
    var x0 = Math.floor((x - r) / 2), x1 = Math.floor((x + r) / 2), y0 = Math.floor((y - r) / 2), y1 = Math.floor((y + r) / 2);
    for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0) continue;
      var a = C.grid.get(cy * 128 + cx);
      if (a) for (var i = 0; i < a.length; i++) fn(a[i]);
    }
  }
  G.forUnitsNear = forUnitsNear;

  function findEnemy(u, r) {
    var st = ust(u), best = null, bd = 1e9, minr = st.minr || 0, navU = isNaval(u);
    var ign = u.ign, en = C.en[u.o];
    if (ign) for (var k in ign) if (ign[k] < S.t) delete ign[k];
    if (!st.onlyBld) forUnitsNear(u.x, u.y, r, function (e) {
      if (e.dead || e.gin || !en[e.o] || (ign && ign[e.id])) return;
      if (!st.rng && navU !== isNaval(e)) return;
      var dx = e.x - u.x, dy = e.y - u.y, d = dx * dx + dy * dy;
      if (d > r * r || (minr && d < minr * minr)) return;
      if (e.t === 'vil') d += 6;
      // asediul și călugării sunt ținte bune: lovite întâi
      var ecls = G.UNITS[e.t].cls; if (ecls === 'sie') d -= 9; else if (ecls === 'mon') d -= 4;
      if (d < bd) { bd = d; best = e; }
    });
    // lupii din apropiere sunt ținte pentru oșteni
    if (!best && u.k === 'u' && !navU && C.wild && C.wild.length && G.UNITS[u.t].cls !== 'vil') for (var w = 0; w < C.wild.length; w++) {
      var a = C.wild[w]; if (a.dead || a.hp <= 0) continue;
      var d2 = (a.x - u.x) * (a.x - u.x) + (a.y - u.y) * (a.y - u.y); if (d2 <= r * r && d2 < bd) { bd = d2; best = a; }
    }
    if (best) return best;
    if (navU && !st.rng) return null;
    if (st.proj === 'arrow' || st.proj === 'bolt' || st.proj === 'jav') return null; // săgețile nu fac aproape nimic zidurilor
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || !en[b.o] || (G.BLDS[b.t].farm && !st.onlyBld) || (ign && ign[b.id])) continue;
      var dd = distRect(u.x, u.y, rectOf(b)) + (G.BLDS[b.t].wall ? 1.5 : 0);
      if (dd <= r && dd < bd) { bd = dd; best = b; }
    }
    return best;
  }
  G.findEnemy = findEnemy;
  function findWounded(u, r) {
    var best = null, bd = r * r;
    forUnitsNear(u.x, u.y, r, function (e) {
      if (e === u || e.dead || e.gin || !G.ally(u.o, e.o) || G.UNITS[e.t].cls === 'sie') return;
      if (e.hp >= ustT(e.o, e.t).hp - 0.5) return;
      var d = (e.x - u.x) * (e.x - u.x) + (e.y - u.y) * (e.y - u.y);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  // ---------- mers ----------
  function spdOf(u) {
    var s = ust(u).spd;
    if (u.buf && u.buf.until > S.t && u.buf.s) s *= u.buf.s;
    if (G.SLOW_T) { var tt = S.ter[Math.floor(u.y) * S.N + Math.floor(u.x)]; if (G.SLOW_T[tt]) s *= G.SLOW_T[tt]; }
    return s;
  }
  function moveAlong(u, dt) {
    if (!u.path) return true;
    var sp = spdOf(u) * dt, N = S.N, pass = pgrid(u);
    while (sp > 0 && u.pi < u.path.length) {
      var w = u.path[u.pi], dx = w[0] - u.x, dy = w[1] - u.y, dd = Math.sqrt(dx * dx + dy * dy);
      if (!pass[Math.floor(w[1]) * N + Math.floor(w[0])]) { u.path = null; u.rp = 0; return true; }
      if (dd > 0.01) faceTo(u, dx, dy);
      if (dd <= sp) { u.x = w[0]; u.y = w[1]; sp -= dd; u.pi++; }
      else { u.x += dx / dd * sp; u.y += dy / dd * sp; sp = 0; }
    }
    u.mv = 0.15;
    if (u.pi >= u.path.length) { u.path = null; return true; }
    return false;
  }
  function dir8(dx, dy) { var i = Math.round((Math.atan2(dy, dx) - Math.PI / 4) / (Math.PI / 4)); return ((i % 8) + 8) % 8; }
  function faceTo(u, dx, dy) { if (dx * dx + dy * dy < 1e-6) return; u.face = (dx - dy) >= 0 ? 1 : -1; u.dir8 = dir8(dx, dy); }
  G.faceTo = faceTo;
  function setTask(u, T) {
    if (G.qmode && u.task && u.k === 'u') { (u.oq || (u.oq = [])).push(T); return; }
    u.task = T; u.path = null; u.gk = null; u.fails = 0; u.rp = 0;
  }
  G.setTask = setTask;
  function finish(u, T) {
    u.task = T ? (T.then || null) : null; u.path = null; u.gk = null;
    // ordinele puse la coadă cu Shift
    if (!u.task && u.oq && u.oq.length) { u.task = u.oq.shift(); u.fails = 0; u.rp = 0; }
  }

  // apropie unitatea de entitatea e până la distanța reach; true când a ajuns
  function approach(u, e, reach, dt) {
    var dist = G.distTo(u, e);
    if (dist <= reach) { u.path = null; u.fails = 0; return true; }
    var key = e.id;
    if (e.k === 'u' && dist < 1.6 && G.Path.clear(u.x, u.y, e.x, e.y, pk(u))) {
      u.path = [[e.x, e.y]]; u.pi = 0; u.gk = key; u.gx = e.x; u.gy = e.y;
      moveAlong(u, dt);
      return false;
    }
    var moved = e.k === 'u' && u.gk === key && (Math.abs(e.x - u.gx) + Math.abs(e.y - u.gy) > 1.2);
    if (u.gk !== key || moved || (!u.path && u.rp <= 0)) {
      if (C.budget <= 0) return false;
      C.budget--;
      if (u.gk !== key) { u.fails = 0; u.np = 0; u.pd = dist; }
      else {
        if (!moved && !u.path) u.fails = (u.fails || 0) + 1;
        // nu se mai apropie de țintă (de ex. e peste râu sau după zid): renunță
        if (dist > (u.pd === undefined ? 1e9 : u.pd) - 0.25) u.np = (u.np || 0) + 1; else u.np = 0;
        if (dist < u.pd) u.pd = dist;
      }
      if (u.fails > 6 || u.np > 7) return 'fail';
      var p = G.findPath(u.x, u.y, goalFor(e, reach), 5200, pk(u));
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
      var p = G.findPath(u.x, u.y, { x: Math.floor(T.x), y: Math.floor(T.y), r: 0 }, 5200, pk(u));
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
      var st = ust(u);
      if (st.atk) {
        var e = findEnemy(u, st.los * S.losMul);
        if (e) { setTask(u, { k: 'atk', id: e.id, auto: 1, then: T }); return; }
      }
    }
    doMove(u, T, dt);
  }
  // patrularea: du-te-vino între două puncte, cu ochii după dușmani
  function doPatrol(u, T, dt) {
    u.scan = (u.scan || 0) - dt;
    if (u.scan <= 0) { u.scan = 0.5; var st = ust(u); if (st.atk) { var e = findEnemy(u, st.los * S.losMul); if (e) { setTask(u, { k: 'atk', id: e.id, auto: 1, then: T }); return; } } }
    if (Math.hypot(u.x - T.x, u.y - T.y) < 0.8) { T.leg = 1 - T.leg; T.x = T.leg ? T.bx : T.ax; T.y = T.leg ? T.by : T.ay; u.path = null; u.gk = null; }
    var mv = T.mv || (T.mv = { k: 'move', then: T }); mv.x = T.x; mv.y = T.y;
    doMove(u, mv, dt);
    if (u.task !== T && u.task !== mv) return;
    u.task = T;
  }
  G.cmdPatrol = function (units, x, y) {
    units.forEach(function (u) { if (u && !u.dead && !u.gin && u.t !== 'vil' && ust(u).atk) setTask(u, { k: 'patrol', ax: u.x, ay: u.y, bx: x, by: y, leg: 1, x: x, y: y }); });
  };
  function doIdle(u, dt) {
    var d = G.UNITS[u.t];
    if (u.t === 'vil' || d.cls === 'car') return;
    u.scan = (u.scan || 0) - dt;
    if (u.scan > 0) return;
    u.scan = 0.5 + Math.random() * 0.2;
    var st = ust(u);
    if (d.heal) {
      var w = findWounded(u, st.los); if (w) { setTask(u, { k: 'heal', id: w.id, auto: 1 }); return; }
      if (!u.rech || u.rech <= S.t) { var cv = convTarget(u, 6); if (cv) setTask(u, { k: 'conv', id: cv.id, auto: 1 }); }
      return;
    }
    if (!st.atk) return;
    var hold = u.stance === 'hold', e = findEnemy(u, hold ? Math.max(st.rng || 0, 1.2) : st.los * S.losMul);
    if (e) setTask(u, { k: 'atk', id: e.id, auto: 1, hold: hold, def: u.stance === 'def', ox: u.x, oy: u.y });
  }

  // ---------- luptă ----------
  function doAtk(u, T, dt) {
    var e = getE(T.id), st = ust(u), huntE = e && e.k === 'r' && G.RESD[e.t].hunt && e.hp > 0;
    if (!e || e.gin || (e.k === 'r' && !huntE) || (!huntE && !G.enemy(u.o, e.o)) || (st.onlyBld && e.k !== 'b') || !st.atk) { finish(u, T); return; }
    if (T.auto && G.dist(u, e) > st.los + 3) { finish(u, T); return; }
    if (st.minr && e.k === 'u') {
      var dm = G.distTo(u, e);
      if (dm < st.minr) {
        if (T.auto) { finish(u, T); return; }
        var vx = u.x - e.x, vy = u.y - e.y, vl = Math.sqrt(vx * vx + vy * vy) || 1;
        setTask(u, { k: 'move', x: u.x + vx / vl * (st.minr - dm + 1), y: u.y + vy / vl * (st.minr - dm + 1), then: T });
        return;
      }
    }
    var reach = st.rng > 0 ? st.rng : (e.k === 'u' ? st.r + G.UNITS[e.t].r + 0.3 : 0.75);
    if (T.hold && G.distTo(u, e) > reach + 0.25) { finish(u, T); return; }
    if (T.def && T.ox !== undefined && Math.hypot(u.x - T.ox, u.y - T.oy) > 7) { setTask(u, { k: 'move', x: T.ox, y: T.oy }); return; }
    var r = approach(u, e, reach, dt);
    if (r === 'fail') { (u.ign || (u.ign = {}))[e.id] = S.t + 25; finish(u, T); return; }
    if (!r) return;
    faceTo(u, e.x - u.x, e.y - u.y);
    u.wk = 0.25;
    if (u.cd <= 0) { u.cd = st.rof; u.sw = 0.4; strike(u, e, st); }
  }
  function strike(src, e, st) {
    var atk = st.atk * atkMul(src) + auraBonus(src) + (src.buf && src.buf.until > S.t && src.buf.add ? src.buf.add : 0);
    if (st.proj) {
      var d = G.dist(src, e);
      var p = { k: st.proj, sx: src.x, sy: src.y, tx: e.x, ty: e.y, id: e.id, sid: src.id, o: src.o, p: 0,
        dur: Math.max(0.12, d / (PSPD[st.proj] || 9)), atk: atk, bonus: st.bonus || null };
      if (st.splash || st.proj === 'treb') { p.splash = st.splash || 0; p.tid = e.id; p.id = 0; }
      S.proj.push(p);
      G.sfx(PSFX[st.proj] || 'arrow', src.x, src.y);
      if (st.proj === 'ball' || st.proj === 'bullet') S.fx.push({ k: 'smoke', x: src.x, y: src.y, t: S.t, s: st.proj === 'ball' ? 1 : 0.55, d8: src.dir8 || 0 });
    } else {
      applyHit(src, e, atk, st.bonus, false);
      G.sfx(e.k === 'b' ? 'thud' : 'hit', e.x, e.y);
    }
  }
  function applyHit(src, e, atk, bonus, ranged) {
    if (!e || e.dead || e.gin) return;
    if (e.k === 'r') { if (G.RESD[e.t].hunt && e.hp > 0) animalHit(e, atk, src); return; }
    var armor;
    if (e.k === 'b') armor = (ranged ? G.BLD_ARMOR.p : G.BLD_ARMOR.m) + bstT(e.o, e.t).arm;
    else { var es = ust(e); armor = ranged ? es.pa : es.ma; if (S.players[e.o].techs.bucium && inAura(e)) armor += 1; }
    var dmg = Math.max(1, atk - armor);
    if (bonus) { var cls = e.k === 'b' ? 'bld' : G.UNITS[e.t].cls; if (bonus[cls]) dmg += bonus[cls]; }
    damage(e, dmg, src);
  }
  function damage(e, dmg, src) {
    e.hp -= dmg; e.hit = S.t;
    if (e.o === 0 && src && src.o !== undefined && G.enemy(src.o, 0)) alertAttack(e);
    if (e.hp <= 0) { G.kill(e, src); return; }
    // oștenii mușcați de un lup sau de un mistreț se întorc spre el; țăranii se apără și ei, cu cei din jur
    if (e.k === 'u' && src && src.k === 'r' && !src.dead && G.isMil(e) && (!e.task || e.task.k === 'amove')) { setTask(e, { k: 'atk', id: src.id, auto: 1, then: e.task }); return; }
    if (e.k === 'u' && e.t === 'vil' && src && src.k === 'r' && !src.dead && G.RESD[src.t].wild) {
      [e].concat((function () { var a = []; forUnitsNear(e.x, e.y, 3, function (v) { if (v !== e && !v.dead && !v.gin && v.t === 'vil' && v.o === e.o && !(v.task && v.task.k === 'atk')) a.push(v); }); return a; })()).forEach(function (v) {
        if (!(v.task && v.task.k === 'atk')) setTask(v, { k: 'atk', id: src.id, auto: 1, then: v.task && v.task.k !== 'bld' ? v.task : null });
      });
      return;
    }
    if (e.k === 'u' && src && !src.dead && src.o !== undefined && G.enemy(src.o, e.o) && (src.k === 'u' || src.k === 'b')) {
      var ed = G.UNITS[e.t];
      if (ed.cls !== 'vil' && ed.cls !== 'mon' && ed.cls !== 'car' && !(ed.onlyBld && src.k !== 'b') && (!e.task || e.task.k === 'amove')) {
        if (!(e.stance === 'hold' && G.distTo(e, src) > (ust(e).rng || 1.2) + 0.3)) setTask(e, { k: 'atk', id: src.id, auto: 1, then: e.task, hold: e.stance === 'hold', def: e.stance === 'def', ox: e.x, oy: e.y });
      }
    }
  }
  G.damage = damage;
  G.applyHit = applyHit;
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
    var pos = { x: e.x, y: e.y };
    if (e.k === 'u') {
      var P = S.players[e.o];
      if (!e.gin) S.fx.push({ k: 'corpse', x: e.x, y: e.y, t: S.t, ut: e.t, o: e.o, face: e.face, d8: e.dir8 || 0, fem: e.fem });
      P.st.lost++; if (e.t === 'vil') P.st.lostVil = (P.st.lostVil || 0) + 1;
      if (by && by.o !== undefined && G.enemy(by.o, e.o)) S.players[by.o].st.killed++;
      if (e.relic) { var rp = nearestPassable(e.x, e.y); if (rp) G.addRes('relic', Math.floor(rp[0]), Math.floor(rp[1])); e.relic = 0; }
      if (e.gin) { var gb = getE(e.gin); if (gb) gb.gar = gb.gar.filter(function (id) { return id !== e.id; }); }
      if (e.gar && e.gar.length) { var lost = e.gar.slice(); e.gar = []; lost.forEach(function (id) { var pu = getE(id); if (pu) { pu.x = e.x; pu.y = e.y; pu.gin = 0; G.kill(pu, by); } }); }
      if (G.UNITS[e.t].hero && C.hero[e.o] === e.id) {
        C.hero[e.o] = 0;
        var hn = G.ename(e);
        if (e.o === 0) G.msg(hn + ' a căzut!' + (S.opt.victory === 'regicid' || S.scen ? '' : ' Îl poți readuce din Cetatea de Scaun.'), 'alert', pos);
        else G.msg(hn + ' a căzut!', G.enemy(0, e.o) ? 'good' : 'alert', pos);
      }
      G.sfx('death', e.x, e.y);
    } else if (e.k === 'b') {
      var d = G.BLDS[e.t];
      if (!d.wall) S.fx.push({ k: 'rubble', x: e.x, y: e.y, n: e.n, t: S.t, bt: e.t, o: e.o });
      if (by && by.o !== undefined && G.enemy(by.o, e.o)) {
        var BP = S.players[by.o]; BP.st.razed++;
        if (BP.techs.jaful && e.built) { for (var k in d.cost) BP.res[k] += Math.round(d.cost[k] * 0.25); if (by.o === 0) G.msg('Jaful: ai luat un sfert din prețul clădirii.', 'good', pos); }
      }
      if (!d.wall) {
        if (e.o === 0 && by) G.msg('Au dărâmat: ' + G.ename(e) + '.', 'alert', pos);
        else if (by && by.o === 0) G.msg('Ai dărâmat: ' + G.ename(e) + '!', 'good', pos);
      }
      G.sfx(d.wall ? 'thud' : 'collapse', e.x, e.y);
      e.q.forEach(function (it) { refund(S.players[e.o], it.cost || (it.u ? G.costOf(e.o, it.u) : G.TECHS[it.tech].cost)); });
      e.q = [];
      ejectAll(e);
      if (e.relics) { for (var r = 0; r < e.relics; r++) { var sp = freeSpot(e, null); G.addRes('relic', Math.floor(sp[0]), Math.floor(sp[1])); } e.relics = 0; }
      if (S.wonder && S.wonder.id === e.id) { S.wonder = null; G.msg(G.nm(d, S.players[e.o].civ) + ' a căzut! Numărătoarea s-a oprit.', e.o === 0 ? 'alert' : 'good', pos); }
    } else if (e.k === 'r' && e.t === 'tree') {
      S.fx.push({ k: 'stump', x: e.x, y: e.y, t: S.t });
    }
  };
  // îndepărtare fără urme (jucător învins, ziduri înlocuite de porți)
  function vanish(e) { if (e.dead) return; e.dead = 1; S.dirty = 1; if (blocks(e)) occupy(e, false); if (e.k === 'u' && C.hero[e.o] === e.id) C.hero[e.o] = 0; }

  // ---------- corăbiile de transport ----------
  function shipLoad(s) { return (s.gar || []).length; }
  G.shipLoad = shipLoad;
  // apa cea mai apropiată de (x, y) care atinge uscatul (acolo trage corabia la mal)
  function shoreWater(x, y) {
    var N = S.N, fx = Math.floor(x), fy = Math.floor(y), best = null, bd = 1e9;
    for (var dy = -10; dy <= 10; dy++) for (var dx = -10; dx <= 10; dx++) {
      var tx = fx + dx, ty = fy + dy;
      if (tx < 1 || ty < 1 || tx >= N - 1 || ty >= N - 1 || !C.wpass[ty * N + tx]) continue;
      if (!(C.pass[ty * N + tx + 1] || C.pass[ty * N + tx - 1] || C.pass[(ty + 1) * N + tx] || C.pass[(ty - 1) * N + tx])) continue;
      var d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [tx + 0.5, ty + 0.5]; }
    }
    return best;
  }
  G.shoreWater = shoreWater;
  // îmbarcarea: corabia trage la malul cel mai apropiat de oameni, iar ei merg acolo și urcă
  G.cmdBoard = function (units, ship) {
    var land = units.filter(function (u) { return u && !u.dead && !u.gin && !isNaval(u) && u.o === ship.o; });
    if (!land.length) return;
    var cx = 0, cy = 0, N = S.N; land.forEach(function (u) { cx += u.x; cy += u.y; }); cx /= land.length; cy /= land.length;
    var w = shoreWater(cx, cy);
    if (!w) { if (ship.o === 0) G.msg('Duceți oamenii mai aproape de apă.', 'warn'); return; }
    var wx = Math.floor(w[0]), wy = Math.floor(w[1]), L = null;
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (d) { if (!L && C.pass[(wy + d[1]) * N + wx + d[0]]) L = [wx + d[0] + 0.5, wy + d[1] + 0.5]; });
    if (!L) return;
    if (G.dist(ship, { x: w[0], y: w[1] }) > 1.2) setTask(ship, { k: 'move', x: w[0], y: w[1] });
    land.forEach(function (u) { setTask(u, { k: 'board', id: ship.id, mx: L[0], my: L[1], wx: w[0], wy: w[1] }); });
  };
  function doBoard(u, T, dt) {
    var s = getE(T.id);
    if (!s || !G.UNITS[s.t].carry) { u.task = null; return; }
    if (shipLoad(s) >= G.UNITS[s.t].carry) { u.why = 'corabia e plină'; u.task = null; return; }
    if (G.dist(u, s) <= 2.3) { (s.gar || (s.gar = [])).push(u.id); u.gin = s.id; u.task = null; u.path = null; u.carry = null; S.dirty = 1; if (u.o === 0) G.sfx('ack'); return; }
    var r = approach(u, { k: 'p', id: -7, x: T.mx, y: T.my }, 0.45, dt);
    if (r === 'fail') { u.why = 'nu ajunge la mal'; u.task = null; return; }
    // corabia a plecat în altă parte: o chemăm înapoi la locul de îmbarcare
    if (r && !s.task && G.dist(s, { x: T.wx, y: T.wy }) > 1.2) setTask(s, { k: 'move', x: T.wx, y: T.wy });
  }
  G.cmdUnload = function (ship, x, y) {
    if (!shipLoad(ship)) return;
    var w = shoreWater(x, y); if (!w) { if (ship.o === 0) G.msg('Acolo nu e mal unde să tragă corabia.', 'warn'); return; }
    setTask(ship, { k: 'move', x: w[0], y: w[1], then: { k: 'unl', lx: x, ly: y } });
  };
  function unloadShip(s, lx, ly) {
    var N = S.N, ids = s.gar || [], spots = [];
    for (var r = 1; r <= 4 && spots.length < ids.length; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      var tx = Math.floor(s.x) + dx, ty = Math.floor(s.y) + dy;
      if (tx < 0 || ty < 0 || tx >= N || ty >= N || !C.pass[ty * N + tx]) continue;
      spots.push([tx + 0.5, ty + 0.5]);
    }
    if (!spots.length) { if (s.o === 0) G.msg('Corabia nu e lângă mal.', 'warn'); return; }
    var out = [];
    ids.forEach(function (id, i) { var u = getE(id); if (!u) return; var p = spots[i % spots.length]; u.gin = 0; u.x = p[0] + (Math.random() - 0.5) * 0.3; u.y = p[1] + (Math.random() - 0.5) * 0.3; u.task = null; u.path = null; out.push(u); });
    s.gar = []; S.dirty = 1;
    if (lx !== undefined && out.length && C.pass[Math.floor(ly) * N + Math.floor(lx)]) G.cmdMove(out, lx, ly);
  }
  G.unloadShip = unloadShip;

  // ---------- vânatul ----------
  // țăranul aruncă sulița până cade animalul; apoi îl jupoaie ca pe o resursă obișnuită (doGat)
  function doHunt(u, e, T, dt) {
    var r = approach(u, e, 2.2, dt);
    if (r === 'fail') { u.why = 'nu ajunge la vânat'; u.task = null; u.path = null; return; }
    if (!r) return;
    u.path = null; faceTo(u, e.x - u.x, e.y - u.y); u.wk = 0.25;
    if (u.cd > 0) return;
    u.cd = 1.5; u.sw = 0.4;
    S.proj.push({ k: 'jav', sx: u.x, sy: u.y, tx: e.x, ty: e.y, id: e.id, sid: u.id, o: u.o, p: 0, dur: Math.max(0.12, G.dist(u, e) / 9), atk: 5, bonus: null });
    G.sfx('arrow', u.x, u.y);
  }
  function animalHit(e, dmg, src) {
    var R = G.RESD[e.t];
    e.hp -= dmg; e.hit = S.t;
    if (e.hp <= 0) { e.hp = 0; e.mv = 0; e.tgt = 0; G.sfx('death', e.x, e.y); return; }
    if (R.flee && src) { e.flee = S.t + 2.6; e.fx = src.x; e.fy = src.y; }
    else if (src && src.k === 'u' && !src.dead) e.tgt = src.id;
  }
  G.animalHit = animalHit;
  function stepAnimal(e, dx, dy, spd, dt) {
    var l = Math.hypot(dx, dy), N = S.N; if (l < 1e-6) return;
    dx /= l; dy /= l;
    var here = C.pass[Math.floor(e.y) * N + Math.floor(e.x)];
    for (var k = 0; k < 5; k++) {
      var a = [0, 0.9, -0.9, 1.8, -1.8][k], cx = dx * Math.cos(a) - dy * Math.sin(a), cy = dx * Math.sin(a) + dy * Math.cos(a);
      var nx = e.x + cx * spd * dt, ny = e.y + cy * spd * dt, ix = Math.floor(nx), iy = Math.floor(ny);
      // poate ieși de pe un loc blocat și se poate mișca în interiorul aceluiași pătrățel
      if (ix < 1 || iy < 1 || ix >= N - 1 || iy >= N - 1 || !(C.pass[iy * N + ix] || !here || (ix === Math.floor(e.x) && iy === Math.floor(e.y)))) continue;
      e.x = nx; e.y = ny; e.tx = ix; e.ty = iy; e.mv = 0.15; e.an = (e.an || 0) + dt; faceTo(e, cx, cy); return;
    }
  }
  function wildAlert(u) {
    if (S.t - (S.tm.wolf || -99) < 25) return;
    S.tm.wolf = S.t; G.msg('Lupii atacă!', 'alert', { x: u.x, y: u.y }); G.sfx('howl', u.x, u.y);
  }
  // cerbii pasc și fug când sunt loviți; mistrețul se ține de cine l-a lovit; lupii sar la oamenii din apropiere
  function updAnimals(dt) {
    for (var i = 0; i < C.mob.length; i++) {
      var e = C.mob[i], R = G.RESD[e.t];
      if (e.dead || !R.hunt || e.hp <= 0) continue;
      if (e.cd > 0) e.cd -= dt; if (e.sw > 0) e.sw -= dt; if (e.mv > 0) e.mv -= dt;
      var t = e.tgt ? getE(e.tgt) : null;
      if (t && (t.k !== 'u' || t.gin || Math.hypot(e.x - e.hx, e.y - e.hy) > 10)) { e.tgt = 0; t = null; }
      if (!t && R.wild && (e.look = (e.look || 0) - dt) <= 0) {
        e.look = 0.5;
        var bd = 12.25, best = null;
        forUnitsNear(e.x, e.y, 3.5, function (u) { if (u.dead || u.gin || G.UNITS[u.t].cls === 'sie' || G.UNITS[u.t].naval) return; var d = (u.x - e.x) * (u.x - e.x) + (u.y - e.y) * (u.y - e.y); if (d < bd) { bd = d; best = u; } });
        if (best) { e.tgt = best.id; t = best; if (G.ally(0, best.o)) wildAlert(best); }
      }
      if (t) {
        var d = G.dist(e, t);
        if (d > 0.65) stepAnimal(e, t.x - e.x, t.y - e.y, R.spd, dt);
        else { faceTo(e, t.x - e.x, t.y - e.y); if (e.cd <= 0) { e.cd = 1.5; e.sw = 0.4; damage(t, Math.max(1, R.atk - ust(t).ma), e); G.sfx('hit', e.x, e.y); } }
      } else if (e.flee && e.flee > S.t) stepAnimal(e, e.x - e.fx, e.y - e.fy, R.spd, dt);
      else if (Math.hypot(e.x - e.hx, e.y - e.hy) > 4) stepAnimal(e, e.hx - e.x, e.hy - e.y, R.spd * 0.5, dt);
      else if ((e.wt = (e.wt || 0) - dt) <= 0) { e.wt = 3 + Math.random() * 5; e.wa = Math.random() * 6.28; e.wl = Math.random() < 0.5 ? 1.2 : 0; }
      else if (e.wl > 0) { e.wl -= dt; stepAnimal(e, Math.cos(e.wa), Math.sin(e.wa), R.spd * 0.3, dt); }
    }
  }

  // ---------- resurse ----------
  function resKind(e) { return e.k === 'b' ? 'farm' : e.t; }
  function resType(e) { return e.k === 'b' ? 'f' : G.RESD[e.t].r; }
  G.findRes = function (o, kind, x, y, rad, useLim, naval) {
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
      if (!accessible(e, naval)) continue;
      bd = d; best = e;
    }
    return best;
  };
  function findDrop(o, r, x, y, naval) {
    var best = null, bd = 1e9;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || b.o !== o || !b.built) continue;
      var bd0 = G.BLDS[b.t], dr = bd0.drop;
      if (naval ? !bd0.dock : (!dr || dr.indexOf(r) < 0 || bd0.dock)) continue;
      var d = distRect(x, y, rectOf(b));
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  G.findDrop = findDrop;
  function nearestOwn(o, t, x, y, built) {
    var best = null, bd = 1e9;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || b.o !== o || b.t !== t || (built && !b.built)) continue;
      var d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  G.nearestOwn = nearestOwn;

  // un loc liber lângă resursă, ca țăranii să nu stea unul peste altul
  function slotFor(u, e) {
    var best = null, bd = 1e9, N = S.N, pass = pgrid(u);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      var x = e.tx + dx, y = e.ty + dy;
      if (x < 0 || y < 0 || x >= N || y >= N || !pass[y * N + x]) continue;
      if (dx && dy && !pass[e.ty * N + x] && !pass[y * N + e.tx]) continue;
      var cx = x + 0.5, cy = y + 0.5, d = (cx - u.x) * (cx - u.x) + (cy - u.y) * (cy - u.y), taken = 0;
      forUnitsNear(cx, cy, 0.8, function (o) {
        if (o === u || o.o !== u.o || o.t !== u.t || !o.task) return;
        var ot = o.task.k === 'gat' ? o.task : (o.task.k === 'ret' ? o.task.back : null);
        if (ot && ot.slot && Math.abs(ot.slot[0] - cx) < 0.1 && Math.abs(ot.slot[1] - cy) < 0.1) taken++;
      });
      d += taken * 30;
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
    return best;
  }
  function approachSlot(u, e, T, dt) {
    if (G.distTo(u, e) <= 0.78) { u.path = null; u.fails = 0; return true; }
    if (!T.slot || T.slotFor !== e.id) { T.slot = slotFor(u, e); T.slotFor = e.id; u.gk = null; if (!T.slot) return approach(u, e, 0.75, dt); }
    var key = 's' + e.id + ',' + T.slot[0];
    if (u.gk !== key || (!u.path && u.rp <= 0)) {
      if (C.budget <= 0) return false;
      C.budget--;
      if (u.gk === key) { u.fails = (u.fails || 0) + 1; if (u.fails > 3) { T.slot = null; u.fails = 0; return approach(u, e, 0.75, dt); } }
      var p = G.findPath(u.x, u.y, { x: Math.floor(T.slot[0]), y: Math.floor(T.slot[1]), r: 0 }, 5200, pk(u));
      u.gk = key; u.rp = 0.8; u.pi = 0;
      if (p === null) return 'fail';
      if (p.length) { var l = p[p.length - 1]; if (Math.floor(l[0]) === Math.floor(T.slot[0]) && Math.floor(l[1]) === Math.floor(T.slot[1])) { l[0] = T.slot[0]; l[1] = T.slot[1]; } u.path = p; }
      else u.path = [[T.slot[0], T.slot[1]]];
    }
    u.rp -= dt;
    moveAlong(u, dt);
    return false;
  }
  function doGat(u, T, dt) {
    var st = ust(u), e = getE(T.id);
    if (e && e.k === 'b' && (e.o !== u.o || !e.built)) e = null;
    if (!e) {
      var ne = G.findRes(u.o, T.kind, T.ox, T.oy, 11, undefined, isNaval(u));
      if (!ne && isNaval(u)) ne = G.findRes(u.o, T.kind === 'fish' ? 'fishd' : 'fish', T.ox, T.oy, 16, undefined, true);
      if (!ne && (T.kind === 'sheep' || T.kind === 'berry')) {
        ne = G.findRes(u.o, T.kind === 'sheep' ? 'berry' : 'sheep', T.ox, T.oy, 12) || G.findRes(u.o, 'farm', T.ox, T.oy, 12);
        if (ne) { T.kind = ne.k === 'b' ? 'farm' : ne.t; T.slot = null; }
      }
      if (ne) { T.id = ne.id; T.ox = ne.x; T.oy = ne.y; e = ne; u.gk = null; }
      else { u.path = null; u.why = 'nu mai e ' + T.kind + ' aproape'; u.task = (u.carry && u.carry.n >= 1) ? { k: 'ret', back: null } : null; return; }
    }
    if (e.k === 'r' && G.RESD[e.t].hunt && e.hp > 0) { T.hunt = 1; doHunt(u, e, T, dt); return; }
    if (T.hunt) { T.hunt = 0; u.path = null; u.gk = null; }
    var rt = resType(e);
    if (u.carry && u.carry.r !== rt) u.carry = null;
    if (u.carry && u.carry.n >= st.cap) { setTask(u, { k: 'ret', back: T }); return; }
    var r = e.k === 'r' && G.RESD[e.t].block ? approachSlot(u, e, T, dt) : approach(u, e, e.k === 'b' ? 0.05 : 0.4, dt);
    if (r === 'fail') { u.why = 'nu ajunge la ' + T.kind; u.task = null; u.path = null; return; }
    if (!r) return;
    u.wk = 0.25;
    if (e.k !== 'b') faceTo(u, e.x - u.x, e.y - u.y);
    var kind = resKind(e);
    var rate = (kind === 'farm' ? G.FARM_RATE : G.RESD[kind].rate) * gmul(u.o, kind);
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
    if (!d) { d = findDrop(u.o, u.carry.r, u.x, u.y, isNaval(u)); if (!d) { u.why = isNaval(u) ? 'n-are port' : 'nu are unde duce'; u.task = null; return; } T.did = d.id; u.gk = null; }
    var r = approach(u, d, 0.75, dt);
    if (r === 'fail') { u.why = 'nu ajunge la depozit'; u.task = null; return; }
    if (!r) return;
    deposit(u);
    finishRet(u, T);
  }
  function deposit(u) {
    var P = S.players[u.o];
    P.res[u.carry.r] += u.carry.n;
    P.st.gath[u.carry.r] += u.carry.n;
    u.carry = null;
  }
  function finishRet(u, T) {
    if (T.back) setTask(u, T.back); else { u.why = u.why || 'a dus tot'; u.task = null; u.path = null; }
  }

  // ---------- construcții ----------
  function doBld(u, T, dt) {
    var b = getE(T.id);
    if (!b || b.o !== u.o) { u.task = null; return; }
    var d = G.BLDS[b.t], mh = bstT(b.o, b.t).hp;
    if (b.built && b.hp >= mh) { afterBuild(u, b); return; }
    var r = approach(u, b, d.walk ? 0.05 : 0.75, dt);
    if (r === 'fail') { u.task = null; return; }
    if (!r) return;
    u.wk = 0.25;
    if (!d.walk) faceTo(u, b.x - u.x, b.y - u.y);
    if (Math.random() < dt * 1.5) G.sfx('build', b.x, b.y);
    if (!b.built) {
      var inc = dt / d.time;
      if (S.players[b.o].fast) inc *= 40;
      b.prog += inc; b.hp = Math.min(mh, b.hp + mh * inc);
      if (b.prog >= 1) completeBld(b);
    } else {
      b.hp = Math.min(mh, b.hp + mh * dt / (d.time * 3));
    }
  }
  function completeBld(b) {
    var d = G.BLDS[b.t];
    b.prog = 1; b.built = true; b.mhp = bstT(b.o, b.t).hp;
    if (d.gate) occupy(b, true);
    if (d.wonder) {
      S.wonder = { o: b.o, id: b.id, t0: S.t };
      G.msg(b.o === 0 ? 'Minunea ta e gata! Ține-o în picioare 5 minute.' : G.ppl(b.o, true) + ' au terminat ' + G.nm(d, S.players[b.o].civ) + '!',
        b.o === 0 ? 'good' : 'alert', { x: b.x, y: b.y });
      G.sfx('age');
    } else if (b.o === 0 && !d.wall) { G.msg(G.ename(b) + ' e gata.', 'info'); G.sfx('built'); }
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
    if (u.oq && u.oq.length) { setTask(u, u.oq.shift()); return; }
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
    var nb = findUnfinished(u.o, u.x, u.y, d.wall ? 6 : 10);
    if (nb) { setTask(u, { k: 'bld', id: nb.id }); return; }
    var pt = u.prev;
    u.prev = null;
    if (pt && pt.k === 'gat') { var pe = getE(pt.id); if (pe || G.findRes(u.o, pt.kind, pt.ox, pt.oy, 11)) { setTask(u, pt); return; } }
    u.task = null; u.path = null;
  }

  // ---------- călugări: vindecare și moaște ----------
  function doHeal(u, T, dt) {
    var e = getE(T.id), st = ust(u);
    if (!e || e === u || e.gin || e.k !== 'u' || !G.ally(u.o, e.o) || G.UNITS[e.t].cls === 'sie' || e.hp >= ustT(e.o, e.t).hp) { finish(u, T); return; }
    if (T.auto && G.dist(u, e) > st.los + 2) { finish(u, T); return; }
    var r = approach(u, e, 2.2, dt);
    if (r === 'fail') { finish(u, T); return; }
    if (!r) return;
    faceTo(u, e.x - u.x, e.y - u.y); u.wk = 0.25; u.sw = 0.3;
    e.hp = Math.min(ustT(e.o, e.t).hp, e.hp + st.heal * healMul(u.o) * dt);
    if ((u.hfx = (u.hfx || 0) - dt) <= 0) { u.hfx = 0.8; S.fx.push({ k: 'heal', x: e.x, y: e.y, t: S.t }); }
  }
  // ---------- convertirea („Wololo”): călugărul cântă câteva clipe și dușmanul trece de partea lui ----------
  function convertible(e) { var d = G.UNITS[e.t]; return e.k === 'u' && !d.hero && d.cls !== 'sie' && !d.naval && d.cls !== 'mon'; }
  G.convertible = convertible;
  function convTarget(u, r) {
    var best = null, bd = r * r, en = C.en[u.o];
    forUnitsNear(u.x, u.y, r, function (e) {
      if (e.dead || e.gin || !en[e.o] || !convertible(e)) return;
      var d = (e.x - u.x) * (e.x - u.x) + (e.y - u.y) * (e.y - u.y) - (G.UNITS[e.t].cls === 'cav' ? 6 : 0);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }
  G.cmdConvert = function (units, e) { units.forEach(function (u) { if (G.UNITS[u.t].heal && convertible(e)) setTask(u, { k: 'conv', id: e.id }); }); };
  function doConv(u, T, dt) {
    var e = getE(T.id);
    if (!e || e.gin || !G.enemy(u.o, e.o) || !convertible(e)) { finish(u, T); return; }
    if (u.rech && u.rech > S.t) { if (T.auto) { finish(u, T); return; } u.why = 'se odihnește după ultima convertire'; return; }
    if (T.auto && G.dist(u, e) > 9) { finish(u, T); return; }
    var r = approach(u, e, 4, dt);
    if (r === 'fail') { finish(u, T); return; }
    if (!r) { T.ch = 0; return; }
    faceTo(u, e.x - u.x, e.y - u.y); u.wk = 0.25; u.sw = 0.3;
    if (!T.ch) { T.ch = 0.001; G.sfx('convert', u.x, u.y, S.players[u.o].civ); }
    T.ch += dt;
    // după 4 secunde, șanse tot mai mari; după 10 secunde, sigur
    if (T.ch >= 4 && (Math.random() < dt * 0.3 || T.ch >= 10)) {
      var from = e.o;
      e.o = u.o; e.task = null; e.path = null; e.carry = null; e.conv = S.t;
      if (C.hero[from] === e.id) C.hero[from] = 0;
      S.fx.push({ k: 'aura', x: e.x, y: e.y, t: S.t });
      S.players[u.o].st.conv = (S.players[u.o].st.conv || 0) + 1;
      if (u.o === 0) G.msg('Călugărul a adus de partea ta: ' + G.ename(e) + '!', 'good', { x: e.x, y: e.y });
      else if (from === 0) G.msg('Un călugăr dușman ți-a luat un om: ' + G.ename(e) + '!', 'alert', { x: e.x, y: e.y });
      u.rech = S.t + 20; S.dirty = 1;
      finish(u, T);
    }
  }
  function doRelic(u, T, dt) {
    var e = getE(T.id);
    if (u.relic) { goStore(u); return; }
    if (!e || e.k !== 'r' || e.t !== 'relic') { finish(u, T); return; }
    var r = approach(u, e, 0.5, dt);
    if (r === 'fail') { u.task = null; return; }
    if (!r) return;
    u.relic = 1; G.kill(e, null); G.sfx('relic', u.x, u.y);
    if (u.o === 0) G.msg('Ai luat moaștele! Du-le la mănăstire: îți vor aduce aur.', 'good', { x: u.x, y: u.y });
    goStore(u);
  }
  function goStore(u) {
    var m = nearestOwn(u.o, 'manastire', u.x, u.y, true);
    if (m) setTask(u, { k: 'gar', id: m.id });
    else { u.task = null; if (u.o === 0) G.msg('Ai nevoie de o mănăstire ca să păstrezi moaștele.', 'warn'); }
  }

  // ---------- adăpostire ----------
  function canGar(b, u) {
    var d = G.BLDS[b.t];
    return !!(d.gar && b.built && b.o === u.o && b.gar.length < d.gar && d.garr.indexOf(G.UNITS[u.t].cls) >= 0);
  }
  G.canGar = canGar;
  function doGar(u, T, dt) {
    var b = getE(T.id);
    if (!b || !b.built || b.o !== u.o) { u.task = null; return; }
    var d = G.BLDS[b.t];
    var store = u.relic && d.relics;
    if (!store && !canGar(b, u)) { u.task = null; if (u.bell) u.bell = null; return; }
    var r = approach(u, b, 0.75, dt);
    if (r === 'fail') { u.task = null; return; }
    if (!r) return;
    if (store) {
      u.relic = 0; b.relics = (b.relics || 0) + 1; u.task = null;
      if (u.o === 0) { G.msg('Moaștele sunt în mănăstire: primești aur în fiecare clipă.', 'good', { x: b.x, y: b.y }); G.sfx('built'); }
      return;
    }
    if (!canGar(b, u)) { u.task = null; return; }
    if (u.carry && u.carry.n > 0 && d.drop && d.drop.indexOf(u.carry.r) >= 0) deposit(u);
    b.gar.push(u.id); u.gin = b.id; u.path = null; u.task = null; u.mv = 0; u.wk = 0;
  }
  function release(u, b, i) {
    var sp = freeSpot(b, b.rally && !b.dead ? [b.rally.x, b.rally.y] : null);
    u.gin = 0; u.x = sp[0] + (i % 3) * 0.05; u.y = sp[1]; u.path = null; u.task = null;
    if (u.bell) { var bt = u.bell; u.bell = null; if (bt.k) setTask(u, bt); }
    else if (b.rally && !b.dead) setTask(u, { k: 'move', x: b.rally.x, y: b.rally.y });
  }
  function ejectAll(b) {
    if (!b.gar || !b.gar.length) return;
    b.gar.forEach(function (id, i) { var u = C.byId.get(id); if (u && !u.dead) release(u, b, i); });
    b.gar = [];
  }
  G.ejectAll = ejectAll;

  // ---------- negoț ----------
  function farMarket(o, ref, not) {
    var best = null, bd = 10;
    for (var i = 0; i < C.blds.length; i++) {
      var b = C.blds[i];
      if (b.dead || !b.built || b.t !== 'targ' || !G.ally(o, b.o) || (not && b.id === not)) continue;
      var d = G.dist(b, ref);
      if (d > bd) { bd = d; best = b; }
    }
    return best;
  }
  G.farMarket = farMarket;
  function doTrade(u, T, dt) {
    var dst = getE(T.to);
    if (!dst || !dst.built || !G.ally(u.o, dst.o)) {
      var from0 = getE(T.from);
      var nd = farMarket(u.o, from0 || u, T.from);
      if (!nd) { u.task = null; u.why = 'nu are al doilea târg'; return; }
      T.to = nd.id; dst = nd; u.gk = null;
    }
    var r = approach(u, dst, 0.75, dt);
    if (r === 'fail') { u.task = null; u.why = 'nu ajunge la târg'; return; }
    if (!r) return;
    var from = getE(T.from);
    if (from && from.id !== dst.id) {
      var dd = G.dist(from, dst), gold = Math.round(dd * 0.9), P = S.players[u.o];
      if (dd >= 10) { P.res.g += gold; P.st.gath.g += gold; P.st.trade += gold; S.fx.push({ k: 'coin', x: dst.x, y: dst.y, t: S.t, n: gold, o: u.o }); }
    }
    var back = T.from;
    T.from = dst.id;
    T.to = back && getE(back) ? back : ((farMarket(u.o, dst, dst.id) || {}).id || 0);
    u.path = null; u.gk = null;
    if (!T.to) { u.task = null; u.why = 'nu are al doilea târg'; }
  }

  // ---------- unități ----------
  function updUnit(u, dt) {
    var d = G.UNITS[u.t];
    if (u.cd > 0) u.cd -= dt;
    if (u.mv > 0) u.mv -= dt;
    if (u.wk > 0) u.wk -= dt;
    if (u.sw > 0) u.sw -= dt;
    u.an += dt;
    if (d.regen && u.hp < u.mhp) u.hp = Math.min(u.mhp, u.hp + d.regen * dt);
    if (S.players[u.o].techs.corbul && u.hp < u.mhp && inAura(u)) u.hp = Math.min(u.mhp, u.hp + 0.5 * dt);
    var T = u.task;
    if (!T) { doIdle(u, dt); return; }
    // paza contra blocajelor: are drum, nu muncește, dar nu înaintează
    if (u.wk <= 0) {
      u.pt = (u.pt || 0) + dt;
      if (u.pt >= 2) {
        if (u.path && Math.abs(u.x - (u.px || 0)) + Math.abs(u.y - (u.py || 0)) < 0.12) { u.stk = (u.stk || 0) + 1; unstick(u, T); } else u.stk = 0;
        u.pt = 0; u.px = u.x; u.py = u.y;
      }
    }
    switch (T.k) {
      case 'move': doMove(u, T, dt); break;
      case 'amove': doAMove(u, T, dt); break;
      case 'atk': doAtk(u, T, dt); break;
      case 'gat': doGat(u, T, dt); break;
      case 'ret': doRet(u, T, dt); break;
      case 'bld': doBld(u, T, dt); break;
      case 'heal': doHeal(u, T, dt); break;
      case 'conv': doConv(u, T, dt); break;
      case 'patrol': doPatrol(u, T, dt); break;
      case 'relic': doRelic(u, T, dt); break;
      case 'gar': doGar(u, T, dt); break;
      case 'trade': doTrade(u, T, dt); break;
      case 'board': doBoard(u, T, dt); break;
      case 'unl': unloadShip(u, T.lx, T.ly); u.task = null; break;
      default: u.task = null;
    }
  }
  function unstick(u, T) {
    u.path = null; u.gk = null; u.rp = 0;
    if (T.slot) T.slot = null;
    if (T.back && T.back.slot) T.back.slot = null;
    // un pas mic într-o parte, ca să iasă din înghesuială
    var N = S.N, pass = pgrid(u);
    for (var k = 0; k < 6; k++) {
      var a = Math.random() * 6.283, nx = u.x + Math.cos(a) * 0.4, ny = u.y + Math.sin(a) * 0.4;
      if (nx > 0 && ny > 0 && nx < N && ny < N && pass[Math.floor(ny) * N + Math.floor(nx)]) { u.x = nx; u.y = ny; break; }
    }
    if (u.stk >= 4) {
      u.stk = 0;
      if (T.k === 'gat') { T.id = 0; T.slot = null; }
      else if (T.k === 'move' || T.k === 'amove' || T.k === 'atk') finish(u, T);
    }
  }
  function separate(dt) {
    var k = Math.min(1, dt * 10), N = S.N;
    function shift(u, mx, my) {
      var nx = u.x + mx, ny = u.y + my, pass = pgrid(u);
      if (nx > 0 && ny > 0 && nx < N && ny < N && pass[Math.floor(ny) * N + Math.floor(nx)]) { u.x = nx; u.y = ny; }
    }
    for (var i = 0; i < C.units.length; i++) {
      var a = C.units[i];
      if (a.dead) continue;
      var ra = G.UNITS[a.t].r;
      forUnitsNear(a.x, a.y, 1, function (b) {
        if (b.id <= a.id || b.dead || b.gin || isNaval(a) !== isNaval(b)) return;
        var rr = ra + G.UNITS[b.t].r, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) return;
        // cei care merg trec unii prin alții (ca în AoE), ca să nu se blocheze pe drum
        var am = a.mv > 0 && a.path, bm = b.mv > 0 && b.path;
        if (am && bm) return;
        var d = Math.sqrt(d2);
        if (d < 1e-4) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.sqrt(dx * dx + dy * dy) || 1; }
        var over = (rr - d) * k, nx = dx / d, ny = dy / d;
        var wa = a.wk > 0 ? 0.04 : am ? 0.12 : 1, wb = b.wk > 0 ? 0.04 : bm ? 0.12 : 1, s = wa + wb;
        if (a.wk > 0 && b.wk > 0) return;
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
      if (it.left > 0) it.left -= dt * (it.u ? trainMul(b.o, b.t) : researchMul(b.o)) * (S.players[b.o].fast ? 40 : 1);
      if (it.left <= 0) {
        if (it.u) {
          var ut = curType(b.o, it.u);
          if (P.pop < P.cap || G.UNITS[ut].hero) { spawnUnit(b, ut); b.q.shift(); }
          else if (b.o === 0 && S.t - S.tm.popMsg > 12) {
            S.tm.popMsg = S.t;
            G.msg(P.cap >= S.opt.popMax ? 'Ai atins limita de ' + S.opt.popMax + ' de oameni.' : 'Nu mai ai loc. Construiește case! 🏠', 'warn');
          }
        } else { finishTech(P, it.tech); b.q.shift(); }
      }
    }
    if (d.atk) {
      b.cd -= dt;
      if (b.cd <= 0) {
        var bs = bstT(b.o, b.t), R = rectOf(b), rng = bs.rng, en = C.en[b.o], cand = [];
        forUnitsNear(b.x, b.y, rng + b.n / 2 + 1, function (e) {
          if (e.dead || e.gin || !en[e.o]) return;
          var dd = distRect(e.x, e.y, R);
          if (dd <= rng) cand.push([dd, e]);
        });
        if (cand.length) {
          cand.sort(function (a, c) { return a[0] - c[0]; });
          b.cd = bs.rof;
          var cannon = b.t === 'turn' && P.techs.turn4;
          var shots = cannon ? 1 : Math.min(10, bs.n + (b.gar ? b.gar.length : 0));
          var h0 = b.t === 'cetate' ? 1.6 : b.t === 'fortareata' ? 2.2 : 1.9;
          for (var s = 0; s < shots; s++) {
            var tg = cand[s % Math.min(cand.length, 3)][1];
            S.proj.push({ k: cannon ? 'ball' : 'arrow', sx: b.x + (Math.random() - 0.5) * b.n * 0.4, sy: b.y + (Math.random() - 0.5) * b.n * 0.4, tx: tg.x, ty: tg.y, id: tg.id, sid: b.id, o: b.o,
              p: -s * 0.06, h0: h0, dur: Math.max(0.2, G.dist(b, tg) / (cannon ? 8 : 9)), atk: bs.atk, bonus: cannon ? { bld: 25, sie: 10 } : null });
          }
          G.sfx(cannon ? 'cannon' : 'arrow', b.x, b.y);
        } else b.cd = 0.4;
      }
    }
    if (d.heal) {
      b.ht = (b.ht || 0) - dt;
      if (b.ht <= 0) {
        b.ht = 1;
        var hm = 1.5 * healMul(b.o);
        forUnitsNear(b.x, b.y, d.heal + 2, function (u) {
          if (!G.ally(u.o, b.o) || u.dead || u.gin || G.UNITS[u.t].cls === 'sie') return;
          if (distRect(u.x, u.y, rectOf(b)) > d.heal) return;
          var mx = ustT(u.o, u.t).hp;
          if (u.hp < mx) u.hp = Math.min(mx, u.hp + hm);
        });
      }
    }
    if (b.relics) { var g = b.relics * G.RELIC_GOLD * dt; P.res.g += g; P.st.gath.g += g; }
    if (b.gar && b.gar.length) {
      for (var i = 0; i < b.gar.length; i++) { var gu = C.byId.get(b.gar[i]); if (gu && !gu.dead && gu.hp < gu.mhp) gu.hp = Math.min(gu.mhp, gu.hp + dt); }
    }
  }
  function spawnUnit(b, t) {
    var P = S.players[b.o];
    var sp = freeSpot(b, b.rally ? [b.rally.x, b.rally.y] : null, G.UNITS[t].naval ? C.wpass : null);
    var u = G.addUnit(t, b.o, sp[0], sp[1]);
    P.pop++; P.st.trained++;
    if (t === 'car') {
      var to = farMarket(b.o, b, b.id);
      if (to) setTask(u, { k: 'trade', from: b.id, to: to.id });
      else if (b.o === 0) G.msg('Carul are nevoie de încă un târg, cât mai departe de acesta.', 'warn');
    } else if (b.rally) {
      var re = b.rally.id ? getE(b.rally.id) : null;
      if (re && t === 'vil' && (re.k === 'r' || (re.k === 'b' && G.BLDS[re.t].farm && re.o === b.o))) G.cmdGather([u], re);
      else if (re && t === 'vil' && re.k === 'b' && re.o === b.o && !re.built) G.cmdBuild([u], re);
      else G.cmdMove([u], b.rally.x, b.rally.y);
    }
    if (b.o === 0) G.sfx('train');
    return u;
  }
  function curType(o, t) {
    var d = G.UNITS[t];
    if (!d.line) return t;
    return S.players[o].line[d.line] || G.LINES[d.line][0];
  }
  function lineBase(t) { var d = G.UNITS[t]; return d.line ? G.LINES[d.line][0] : t; }
  G.curType = curType; G.lineBase = lineBase;
  function finishTech(P, id) {
    var T = G.TECHS[id], o = P.id;
    P.techs[id] = 1; P.st.techs++;
    resetCaches(o);
    if (T.up) {
      var to = T.up[1], line = G.UNITS[to].line, tier = G.UNITS[to].tier;
      P.line[line] = to;
      S.ents.forEach(function (u) {
        if (u.dead || u.k !== 'u' || u.o !== o) return;
        var ud = G.UNITS[u.t];
        if (ud.line !== line || ud.tier >= tier) return;
        u.t = to;
      });
    }
    // viața maximă poate crește (zidărie, credință, războiul de țesut...): păstrăm procentul
    S.ents.forEach(function (e) {
      if (e.dead || e.o !== o || e.k === 'r') return;
      var nm = G.maxHp(e), om = e.mhp || nm;
      if (nm !== om) { if (e.k === 'u' || e.built) e.hp = e.hp * nm / om; e.mhp = nm; }
    });
    if (T.ageUp) {
      P.age = T.ageUp; P.st.ageT[P.age] = S.t;
      if (o === 0) { G.msg('Ai intrat în ' + G.AGES[P.age] + '!', 'good'); G.sfx('age'); }
      else G.msg(G.ppl(o, true) + ' au intrat în ' + G.AGES[P.age] + '.', G.enemy(0, o) ? 'warn' : 'info');
    } else if (o === 0) { G.msg(T.name + ': gata.', 'info'); G.sfx('built'); }
  }
  G.finishTech = function (o, id) { finishTech(S.players[o], id); };

  // ---------- proiectile ----------
  function updProj(dt) {
    var a = S.proj;
    for (var i = a.length - 1; i >= 0; i--) {
      var p = a[i];
      if (p.p < 0) { p.p += dt / p.dur; continue; }
      var e = p.id ? getE(p.id) : null;
      if (e && !e.gin) { p.tx = e.x; p.ty = e.y; }
      p.p += dt / p.dur;
      if (p.p >= 1) {
        var src = getE(p.sid) || { o: p.o, k: 'x', dead: 1, x: p.sx, y: p.sy };
        if (p.tid) impact(p, src);
        else if (e && !e.gin) applyHit(src, e, p.atk, p.bonus, true);
        if (p.k === 'ball' || p.k === 'stone' || p.k === 'treb') { S.fx.push({ k: 'boom', x: p.tx, y: p.ty, t: S.t, s: p.k === 'treb' ? 1.5 : p.k === 'stone' ? 0.8 : 1 }); G.sfx('boom', p.tx, p.ty); }
        a.splice(i, 1);
      }
    }
  }
  function impact(p, src) {
    var t = getE(p.tid);
    if (t && t.k === 'b' && distRect(p.tx, p.ty, rectOf(t)) < 0.6) applyHit(src, t, p.atk, p.bonus, true);
    if (!p.splash) return;
    var en = C.en[p.o], r = p.splash;
    forUnitsNear(p.tx, p.ty, r + 0.5, function (u) {
      if (u.dead || u.gin || !en || !en[u.o]) return;
      var d = Math.hypot(u.x - p.tx, u.y - p.ty);
      if (d > r) return;
      applyHit(src, u, d < r * 0.5 ? p.atk : p.atk * 0.6, p.bonus, true);
    });
  }

  // ---------- ceața (pentru tine și aliații tăi) ----------
  G.updFog = function () {
    var vis = C.vis, exp = S.exp, N = S.N;
    if (S.opt.reveal === 'tot') { vis.fill(1); exp.fill(1); return; }
    vis.fill(0);
    var lm = S.losMul || 1;
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead || e.gin || e.k === 'r' || !G.ally(0, e.o)) continue;
      var r = e.k === 'u' ? ust(e).los * lm : (e.built ? bstT(e.o, e.t).los * Math.max(0.75, lm) + e.n / 2 : 2);
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
  G.reveal = function (x, y, r) {
    var N = S.N;
    for (var ty = Math.max(0, Math.floor(y - r)); ty <= Math.min(N - 1, Math.floor(y + r)); ty++)
      for (var tx = Math.max(0, Math.floor(x - r)); tx <= Math.min(N - 1, Math.floor(x + r)); tx++)
        if ((tx + 0.5 - x) * (tx + 0.5 - x) + (ty + 0.5 - y) * (ty + 0.5 - y) <= r * r) S.exp[ty * N + tx] = 1;
  };

  // ---------- bucla ----------
  function refreshLists() {
    var nP = S.players.length, us = C.units = [], bs = C.blds = [], pop = [], cap = [], p;
    for (p = 0; p < nP; p++) { pop.push(0); cap.push(0); }
    C.fear = []; C.tepe = []; C.mob = []; C.wild = [];
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead) continue;
      if (e.k === 'r') { if (!G.RESD[e.t].block) { C.mob.push(e); if (G.RESD[e.t].wild && e.hp > 0) C.wild.push(e); } continue; }
      if (e.k === 'u') {
        pop[e.o]++;
        if (!e.gin) { us.push(e); if (G.UNITS[e.t].hero && S.players[e.o].civ === 'val') C.fear.push(e); }
      } else if (e.k === 'b') {
        bs.push(e);
        if (e.built) { cap[e.o] += G.BLDS[e.t].pop || 0; if (TEPE_B[e.t] && S.players[e.o].techs.tepe) C.tepe.push(e); }
      }
    }
    for (p = 0; p < nP; p++) { S.players[p].pop = pop[p]; S.players[p].cap = Math.min(S.opt.popMax, cap[p] + (S.players[p].capBonus || 0)); }
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
    var life = { corpse: 16, rubble: 900, stump: 150, dust: 1.5, boom: 0.9, smoke: 1.6, heal: 1, aura: 1.6, coin: 1.4, fire: 45 };
    S.fx = S.fx.filter(function (f) { return S.t - f.t < (f.life || life[f.k] || 2); });
    if (S.fx.length > 900) S.fx.splice(0, S.fx.length - 900);
  }
  function score(P) {
    var g = P.st.gath, s = (g.f + g.w + g.g * 1.5 + g.s * 1.5) / 10 + P.st.killed * 4 + P.st.razed * 12 + P.st.techs * 15 + P.age * 100;
    return Math.round(s);
  }
  G.score = function (o) { return score(S.players[o]); };
  function defeat(p) {
    var P = S.players[p];
    if (!P.alive) return;
    P.alive = false;
    S.ents.forEach(function (e) { if (!e.dead && e.o === p && e.k !== 'r') vanish(e); });
    if (p === 0) G.msg('Ai fost învins.', 'alert');
    else G.msg(G.ppl(p, true) + ' au fost învinși!', G.enemy(0, p) ? 'good' : 'alert');
    G.sfx(G.enemy(0, p) ? 'win1' : 'lose1');
  }
  G.defeat = defeat;
  function checkWin() {
    if (S.over) return;
    var nP = S.players.length, keyB = [], vil = [], any = [], p;
    for (p = 0; p < nP; p++) { keyB.push(0); vil.push(0); any.push(0); }
    for (var i = 0; i < S.ents.length; i++) {
      var e = S.ents[i];
      if (e.dead || e.k === 'r') continue;
      any[e.o]++;
      if (e.k === 'b' && e.built && G.BLDS[e.t].key) keyB[e.o]++;
      if (e.k === 'u' && e.t === 'vil') vil[e.o]++;
    }
    var vic = S.opt.victory;
    for (p = 0; p < nP; p++) {
      var P = S.players[p];
      if (!P.alive || P.immortal) continue;
      var dead;
      if (vic === 'scenariu') dead = !any[p];
      else if (vic === 'regicid') dead = !C.hero[p] || !any[p];
      else dead = !keyB[p] && !vil[p];
      if (dead) defeat(p);
    }
    if (S.wonder) {
      var w = getE(S.wonder.id);
      if (!w) S.wonder = null;
      else if (vic === 'minune' && w.built) {
        var left = 300 - (S.t - S.wonder.t0), mk = Math.ceil(left / 60);
        if (S.wonder.last !== mk && left > 0) {
          S.wonder.last = mk;
          G.msg((w.o === 0 ? 'Minunea ta' : 'Minunea ' + G.ppl(w.o)) + ': mai sunt ' + mk + (mk === 1 ? ' minut.' : ' minute.'), G.ally(0, w.o) ? 'good' : 'alert', { x: w.x, y: w.y });
        }
        if (left <= 0) { finishGame(G.ally(0, w.o) ? 1 : 2, S.players[w.o].team); return; }
      }
    }
    if (vic === 'deal') {
      var K = S.koth || (S.koth = { x: S.N / 2, y: S.N / 2, team: 0, o: -1, t0: 0 }), teams = {}, owner = -1;
      forUnitsNear(K.x, K.y, 5, function (u) { if (u.dead || u.gin || !S.players[u.o].alive || Math.hypot(u.x - K.x, u.y - K.y) > 5) return; var tm = S.players[u.o].team; teams[tm] = (teams[tm] || 0) + 1; if (owner < 0) owner = u.o; });
      var tlist = Object.keys(teams);
      if (tlist.length === 1 && +tlist[0] !== K.team) { K.team = +tlist[0]; K.o = owner; K.t0 = S.t; K.last = 0; G.msg((G.ally(0, owner) ? (owner === 0 ? 'Ai luat' : 'Aliații au luat') : G.ppl(owner, true) + ' au luat') + ' monumentul din mijloc!', G.ally(0, owner) ? 'good' : 'alert', { x: K.x, y: K.y }); G.sfx('horn2'); }
      if (K.team) {
        var kl = 600 - (S.t - K.t0), km = Math.ceil(kl / 60);
        if (K.last !== km && kl > 0 && km <= 5) { K.last = km; G.msg('Monumentul: mai sunt ' + km + (km === 1 ? ' minut' : ' minute') + ' pentru ' + (G.ally(0, K.o) ? 'tine' : G.ppl(K.o)) + '.', G.ally(0, K.o) ? 'good' : 'alert', { x: K.x, y: K.y }); }
        if (kl <= 0) { finishGame(S.players[0].team === K.team ? 1 : 2, K.team); return; }
      }
    }
    if (vic === 'scenariu') { if (!S.players[0].alive) finishGame(2, 0); return; }
    if (!S.players[0].alive) { finishGame(2, 0); return; }
    var foes = 0;
    for (p = 0; p < nP; p++) if (S.players[p].alive && G.enemy(0, p)) foes++;
    if (!foes) finishGame(1, S.players[0].team);
  }
  function finishGame(res, team) {
    if (S.over) return;
    S.over = res; S.winTeam = team;
    G.sfx(res === 1 ? 'win' : 'lose');
  }
  G.finishGame = finishGame;
  G.update = function (dt) {
    if (!S || S.over) return;
    S.t += dt;
    if (S.opt.daynight) { var dc = (S.t % 720) / 720, dn = dc < 0.62 ? 0 : dc < 0.7 ? (dc - 0.62) / 0.08 : dc < 0.92 ? 1 : 1 - (dc - 0.92) / 0.08; S.night = dn * 0.85; S.losMul = 1 - 0.3 * dn; }
    C.budget = 10 + S.players.length * 2;
    refreshLists();
    for (var i = 0; i < C.units.length; i++) { var u = C.units[i]; if (!u.dead) updUnit(u, dt); }
    updAnimals(dt);
    separate(dt);
    for (var j = 0; j < C.blds.length; j++) { var b = C.blds[j]; if (!b.dead) updBld(b, dt); }
    updProj(dt);
    var tm = S.tm, p;
    if ((tm.fog -= dt) <= 0) { tm.fog = 0.25; G.updFog(); }
    // calculatoarele gândesc pe rând, nu toate în același cadru
    if ((tm.ai -= dt) <= 0) {
      var ais = S.players.filter(function (P) { return P.ai && P.alive; });
      tm.ai = 0.5 / Math.max(1, ais.length);
      if (ais.length && G.aiTick) { tm.aiI = ((tm.aiI || 0) + 1) % ais.length; G.aiTick(ais[tm.aiI].id); }
    }
    if (S.scen && G.Trig && (tm.trig -= dt) <= 0) { tm.trig = 0.25; G.Trig.tick(); }
    if ((tm.tl -= dt) <= 0) { tm.tl = 15; S.players.forEach(function (P) { P.st.tl.push(score(P)); }); }
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
  function nearestPassable(x, y, grid, maxR) {
    var N = S.N, fx = Math.floor(x), fy = Math.floor(y), pass = grid || C.pass;
    if (fx >= 0 && fy >= 0 && fx < N && fy < N && pass[fy * N + fx]) return [x, y];
    for (var r = 1; r < (maxR || 6); r++) {
      var best = null, bd = 1e9;
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var tx = fx + dx, ty = fy + dy;
        if (tx < 0 || ty < 0 || tx >= N || ty >= N || !pass[ty * N + tx]) continue;
        var d = (tx + 0.5 - x) * (tx + 0.5 - x) + (ty + 0.5 - y) * (ty + 0.5 - y);
        if (d < bd) { bd = d; best = [tx + 0.5, ty + 0.5]; }
      }
      if (best) return best;
    }
    return null;
  }
  G.nearestPassable = nearestPassable;
  G.cmdMove = function (units, x, y, amove) {
    units = units.filter(function (u) { return u && !u.dead && !u.gin; });
    if (!units.length) return;
    var nav = units.filter(isNaval);
    if (nav.length && nav.length < units.length) { G.cmdMove(nav, x, y, amove); units = units.filter(function (u) { return !isNaval(u); }); }
    var grid = isNaval(units[0]) ? C.wpass : C.pass;
    var p = nearestPassable(x, y, grid, grid === C.wpass ? 14 : 6); if (!p) return;
    x = p[0]; y = p[1];
    var kind = amove ? 'amove' : 'move';
    if (units.length === 1) { setTask(units[0], { k: kind, x: x, y: y }); return; }
    // așezare în grup, ca să nu stea toți în același punct
    var N = S.N, spots = [], sp = 0.8;
    for (var ring = 0; spots.length < units.length * 2 && ring < 14; ring++) {
      for (var dy = -ring; dy <= ring; dy++) for (var dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        var sx = x + dx * sp, sy = y + dy * sp;
        if (sx < 0 || sy < 0 || sx >= N || sy >= N || !grid[Math.floor(sy) * N + Math.floor(sx)]) continue;
        spots.push([sx, sy]);
      }
    }
    var cx = 0, cy = 0;
    units.forEach(function (u) { cx += u.x; cy += u.y; });
    cx /= units.length; cy /= units.length;
    var order = units.slice().sort(function (a, b) { return ((a.x - x) * (a.x - x) + (a.y - y) * (a.y - y)) - ((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y)); });
    var used = {};
    order.forEach(function (u) {
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
    var movers = [];
    units.forEach(function (u) {
      if (!u || u.dead || u.gin) return;
      var st = ust(u);
      if (!st.atk || (st.onlyBld && e.k !== 'b') || !G.enemy(u.o, e.o)) { movers.push(u); return; }
      setTask(u, { k: 'atk', id: e.id });
    });
    if (movers.length) G.cmdMove(movers, e.x, e.y);
  };
  G.cmdGather = function (units, e) {
    if (e.k === 'r' && e.t === 'relic') {
      var mons = units.filter(function (u) { return u.t === 'mon'; });
      if (mons.length) setTask(mons[0], { k: 'relic', id: e.id });
      var rest = units.filter(function (u) { return u !== mons[0]; });
      if (rest.length) G.cmdMove(rest, e.x, e.y);
      return;
    }
    if (e.k === 'r' && G.RESD[e.t].water) {
      var fishers = units.filter(function (u) { return G.UNITS[u.t].fisher; });
      fishers.forEach(function (u) { setTask(u, { k: 'gat', id: e.id, kind: e.t, ox: e.x, oy: e.y }); });
      units = units.filter(function (u) { return !G.UNITS[u.t].fisher; });
      if (G.RESD[e.t].deep) { if (units.length) G.cmdMove(units, e.x, e.y); return; }
      if (!units.length) return;
    }
    var vils = units.filter(function (u) { return u.t === 'vil'; });
    var others = units.filter(function (u) { return u.t !== 'vil'; });
    // oștenii vânează și ei (lupii, mistreții): atacă, nu doar merg acolo
    if (others.length && e.k === 'r' && G.RESD[e.t].hunt && e.hp > 0) { others.forEach(function (u) { if (ust(u).atk) setTask(u, { k: 'atk', id: e.id }); else G.cmdMove([u], e.x, e.y); }); others = []; }
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
  G.cmdHeal = function (units, e) {
    var mons = units.filter(function (u) { return G.UNITS[u.t].heal; }), rest = units.filter(function (u) { return !G.UNITS[u.t].heal; });
    mons.forEach(function (u) { setTask(u, { k: 'heal', id: e.id }); });
    if (rest.length) G.cmdMove(rest, e.x, e.y);
  };
  G.cmdBuild = function (units, b) {
    units.forEach(function (u) {
      if (!u || u.dead || u.t !== 'vil') return;
      var T = u.task, g = T && (T.k === 'gat' ? T : (T.k === 'ret' && T.back ? T.back : null));
      if (g) u.prev = { k: 'gat', id: g.id, kind: g.kind, ox: g.ox, oy: g.oy };
      else if (!T || T.k !== 'bld') u.prev = null;
      setTask(u, { k: 'bld', id: b.id });
    });
  };
  G.cmdGarrison = function (units, b) {
    var rest = [];
    units.forEach(function (u) {
      if (!u || u.dead || u.gin) return;
      if (G.BLDS[b.t].gar && G.BLDS[b.t].garr.indexOf(G.UNITS[u.t].cls) >= 0 && b.o === u.o) setTask(u, { k: 'gar', id: b.id });
      else if (u.relic && G.BLDS[b.t].relics && b.o === u.o) setTask(u, { k: 'gar', id: b.id });
      else rest.push(u);
    });
    if (rest.length) G.cmdMove(rest, b.x, b.ty + b.n + 0.6);
  };
  G.cmdUngarrison = function (b) { ejectAll(b); };
  G.cmdTrade = function (units, m) {
    units.forEach(function (u) {
      if (u.t !== 'car') return;
      var from = farMarket(u.o, m, m.id);
      if (from) setTask(u, { k: 'trade', from: from.id, to: m.id }); else setTask(u, { k: 'move', x: m.x, y: m.ty + m.n + 0.6 });
    });
  };
  G.cmdStop = function (units) { units.forEach(function (u) { if (u && !u.dead) setTask(u, null); }); };
  G.cmdReturn = function (units) {
    units.forEach(function (u) { if (u && !u.dead && u.carry && u.carry.n > 0) setTask(u, { k: 'ret', back: u.task && u.task.k === 'gat' ? u.task : null }); });
  };
  // clopotul: țăranii fug în cetate, turnuri și fortărețe; încă o dată, se întorc la treabă
  // codurile secrete (ca „cheese steak jimmy's” din AoE2); o partidă cu coduri nu mai dă medalii
  var CHEATS = {
    'mamaliga': function (P) { P.res.f += 1000; return '+1000 hrană'; }, 'padurea': function (P) { P.res.w += 1000; return '+1000 lemn'; },
    'galbeni': function (P) { P.res.g += 1000; return '+1000 aur'; }, 'cariera': function (P) { P.res.s += 1000; return '+1000 piatră'; },
    'iscoade': function () { S.exp.fill(1); S.opt.reveal = 'tot'; return 'toată harta la vedere'; },
    'repede': function (P) { P.fast = !P.fast; return P.fast ? 'construiești și pregătești pe loc' : 'timpul curge iar normal'; },
    'oastea cea mare': function (P) { var tc = C.blds.find(function (b) { return b.o === P.id && b.t === 'cetate'; }) || C.units.find(function (u) { return u.o === P.id; }); if (!tc) return ''; G.placeUnits(P.id, G.curType(P.id, 'kni'), 6, tc.x + 3, tc.y + 3); G.placeUnits(P.id, G.curType(P.id, 'arc'), 6, tc.x + 3, tc.y + 4); return 'a sosit oastea cea mare'; },
    'victorie': function (P) { S.players.forEach(function (Q) { if (G.enemy(P.id, Q.id) && Q.alive) defeat(Q.id); }); return 'victorie!'; }
  };
  G.cheat = function (o, text) {
    var k = (text || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), fn = CHEATS[k];
    if (!fn) return null;
    var P = S.players[o], r = fn(P); S.cheated = 1;
    if (o === 0 && r) { G.msg('Cod secret: ' + r + '.', 'good'); G.sfx('built'); }
    return r;
  };
  // tributul: resurse trimise altui jucător (o zecime se pierde pe drum)
  var RNAME = { f: 'hrană', w: 'lemne', g: 'aur', s: 'piatră' };
  G.cmdTribute = function (from, to, r, amt) {
    var P = S.players[from], Q = S.players[to];
    if (!P || !Q || !Q.alive || from === to) return false;
    amt = Math.min(amt, Math.floor(P.res[r])); if (amt < 10) { if (from === 0) G.msg('N-ai destul de trimis.', 'warn'); return false; }
    P.res[r] -= amt; Q.res[r] += Math.round(amt * 0.9);
    if (from === 0) G.msg('Ai trimis ' + amt + ' ' + RNAME[r] + ' către ' + G.ppl(to) + '.', 'info');
    else if (to === 0) G.msg((G.ally(0, from) ? 'Aliații ' : '') + G.ppl(from) + ' îți trimit ' + Math.round(amt * 0.9) + ' ' + RNAME[r] + '.', 'good');
    G.sfx('coin');
    return true;
  };
  G.cmdBell = function (o) {
    var P = S.players[o];
    if (P.bell) {
      P.bell = false;
      C.blds.forEach(function (b) {
        if (b.dead || b.o !== o || !b.gar || !b.gar.length) return;
        var keep = [];
        b.gar.forEach(function (id, i) { var u = C.byId.get(id); if (u && !u.dead && u.bell) release(u, b, i); else keep.push(id); });
        b.gar = keep;
      });
      C.units.forEach(function (u) { if (u.o === o && u.bell && u.task && u.task.k === 'gar') { var bt = u.bell; u.bell = null; setTask(u, bt.k ? bt : null); } });
      G.sfx('bell');
      return 'back';
    }
    var sh = C.blds.filter(function (b) { return b.o === o && !b.dead && b.built && G.BLDS[b.t].gar; }), room = {};
    if (!sh.length) return 'Nu ai unde adăposti țăranii.';
    P.bell = true;
    sh.forEach(function (b) { room[b.id] = G.BLDS[b.t].gar - b.gar.length; });
    C.units.forEach(function (u) {
      if (u.o !== o || u.t !== 'vil') return;
      var best = null, bd = 40;
      sh.forEach(function (b) { if (room[b.id] <= 0) return; var d = G.dist(u, b); if (d < bd) { bd = d; best = b; } });
      if (!best) return;
      room[best.id]--;
      var T = u.task, keep = T && (T.k === 'gat' || T.k === 'bld') ? T : (T && T.k === 'ret' && T.back ? T.back : null);
      u.bell = keep ? keep : {};
      setTask(u, { k: 'gar', id: best.id });
    });
    G.sfx('bell');
    return '';
  };
  // puterea eroului
  G.powerError = function (o) {
    var P = S.players[o], h = heroOf(o);
    if (!h) return 'Eroul nu e pe câmp.';
    if (S.t < P.pcd) return 'Se reîncarcă: încă ' + Math.ceil(P.pcd - S.t) + ' s.';
    return '';
  };
  G.cmdPower = function (o) {
    var err = G.powerError(o); if (err) return err;
    var P = S.players[o], h = heroOf(o), pw = G.POWERS[G.CIVS[P.civ].power], id = G.CIVS[P.civ].power, r = pw.r, until = S.t + pw.dur, n = 0;
    function near(fn) { forUnitsNear(h.x, h.y, r, function (u) { if (!u.dead && !u.gin && Math.hypot(u.x - h.x, u.y - h.y) <= r) fn(u); }); }
    if (id === 'bucium') near(function (u) { if (u.o === o && u.t !== 'vil') { u.buf = { a: 1.3, s: 1.3, until: until }; n++; } });
    else if (id === 'teroare') near(function (u) { if (G.enemy(o, u.o)) { u.deb = { a: 0.6, until: until }; n++; } });
    else if (id === 'cruciada') near(function (u) { if (G.ally(o, u.o) && G.UNITS[u.t].cls !== 'sie') { var m = ustT(u.o, u.t).hp; u.hp = Math.min(m, u.hp + m * 0.5); n++; } });
    else if (id === 'garda') { G.placeUnits(o, curType(o, 'cpl'), 3, h.x + 1, h.y + 1).forEach(function (u) { u.task = null; }); n = 3; }
    else if (id === 'baterie') near(function (u) { if (u.o === o && G.UNITS[u.t].cls === 'sie') { u.buf = { a: 1.5, until: until }; n++; } });
    else if (id === 'navala') near(function (u) { if (u.o === o && (G.UNITS[u.t].cls === 'cav' || G.UNITS[u.t].cls === 'har')) { u.buf = { a: 1, add: 2, s: 1.5, until: until }; n++; } });
    P.pcd = S.t + pw.cd;
    S.fx.push({ k: 'aura', x: h.x, y: h.y, t: S.t, r: r || 2, p: id });
    G.sfx(id === 'bucium' || id === 'navala' ? 'horn2' : id === 'cruciada' ? 'bell' : 'power', h.x, h.y);
    return '';
  };
  // târgul
  G.marketPrice = function (o, r, op) { var p = S.mkt[r]; return op === 'buy' ? Math.round(p) : Math.round(p * (S.players[o].techs.breasla ? 0.85 : 0.7)); };
  G.cmdMarket = function (o, op, r) {
    var P = S.players[o];
    if (!G.hasBuilt(o, 'targ')) return 'Ai nevoie de un târg.';
    if (op === 'buy') {
      var c = G.marketPrice(o, r, 'buy');
      if (P.res.g < c) return 'Îți trebuie ' + c + ' ' + G.RES_ICON.g + ' aur.';
      P.res.g -= c; P.res[r] += 100; S.mkt[r] = Math.min(300, S.mkt[r] + 4);
    } else {
      if (P.res[r] < 100) return 'Îți trebuie 100 ' + G.RES_ICON[r] + '.';
      P.res[r] -= 100; P.res.g += G.marketPrice(o, r, 'sell'); S.mkt[r] = Math.max(25, S.mkt[r] - 4);
    }
    G.sfx('coin');
    return '';
  };

  G.hasBuilt = function (o, t) { return C.blds.some(function (b) { return !b.dead && b.o === o && b.t === t && b.built; }); };
  G.placeError = function (o, t) {
    var P = S.players[o], d = G.BLDS[t];
    var noCet = t === 'cetate' && !C.blds.some(function (b) { return !b.dead && b.o === o && b.t === 'cetate'; });
    if (d.age > P.age && !noCet) return 'Ai nevoie de ' + G.AGES[d.age] + '.';
    if (S.opt.noBuild && S.opt.noBuild.indexOf(t) >= 0) return 'Nu poți construi asta în această misiune.';
    if (d.need && !G.hasBuilt(o, d.need)) return 'Întâi construiește: ' + G.nm(G.BLDS[d.need], P.civ) + '.';
    if (d.wonder && C.blds.some(function (b) { return !b.dead && b.o === o && b.t === t; })) return 'Ai deja o minune.';
    if (!G.canAfford(P, d.cost)) return G.lackMsg(P, d.cost);
    return '';
  };
  G.canPlace = function (o, t, tx, ty) {
    var d = G.BLDS[t], n = d.n, N = S.N;
    if (tx < 0 || ty < 0 || tx + n > N || ty + n > N) return false;
    for (var y = ty; y < ty + n; y++) for (var x = tx; x < tx + n; x++) {
      var i = y * N + x;
      if (d.dock ? S.ter[i] !== 2 : !G.BUILD_T[S.ter[i]]) return false;
      if (C.occ[i]) {
        var oc = C.byId.get(C.occ[i]);
        if (!(d.gate && oc && oc.k === 'b' && oc.o === o && G.BLDS[oc.t].wall === d.wall && !G.BLDS[oc.t].gate)) return false;
      }
      if (o === 0 && !S.players[0].ai && !S.exp[i]) return false;
    }
    if (d.dock) {
      var shore = false;
      for (var yy = ty - 1; yy <= ty + n && !shore; yy++) for (var xx = tx - 1; xx <= tx + n; xx++) {
        if ((yy === ty - 1 || yy === ty + n || xx === tx - 1 || xx === tx + n) && xx >= 0 && yy >= 0 && xx < N && yy < N && C.pass[yy * N + xx]) { shore = true; break; }
      }
      if (!shore) return false;
    }
    // nu peste dușmani sau oi
    var bad = false;
    forUnitsNear(tx + n / 2, ty + n / 2, n, function (e) { if (!bad && !e.dead && e.o !== o && e.x > tx && e.x < tx + n && e.y > ty && e.y < ty + n) bad = true; });
    if (bad) return false;
    for (var j = 0; j < C.mob.length; j++) {
      var m = C.mob[j];
      if (!m.dead && m.x > tx && m.x < tx + n && m.y > ty && m.y < ty + n) return false;
    }
    return true;
  };
  G.cmdPlace = function (o, t, tx, ty, builders) {
    var P = S.players[o], d = G.BLDS[t];
    if (G.placeError(o, t) || !G.canPlace(o, t, tx, ty)) return null;
    if (d.gate) { var oc = C.byId.get(C.occ[ty * S.N + tx]); if (oc) vanish(oc); }
    G.pay(P, d.cost);
    var b = G.addBld(t, o, tx, ty, false);
    if (builders && builders.length) G.cmdBuild(builders, b);
    return b;
  };
  // un șir de ziduri: drum în 4 direcții de la (x0,y0) la (x1,y1), ca zidul să nu aibă găuri pe diagonală
  G.wallTiles = function (x0, y0, x1, y1) {
    var pts = [[x0, y0]], x = x0, y = y0, sx = x1 > x0 ? 1 : -1, sy = y1 > y0 ? 1 : -1, guard = 0;
    while ((x !== x1 || y !== y1) && guard++ < 500) {
      var nx = x + (x !== x1 ? sx : 0), ny = y + (y !== y1 ? sy : 0);
      var ex = Math.abs((y1 - y0) * (nx - x0) - (x1 - x0) * (y - y0)), ey = Math.abs((y1 - y0) * (x - x0) - (x1 - x0) * (ny - y0));
      if (x !== x1 && (y === y1 || ex <= ey)) x = nx; else y = ny;
      pts.push([x, y]);
    }
    return pts;
  };
  G.cmdPlaceWall = function (o, t, x0, y0, x1, y1, builders) {
    var placed = [];
    G.wallTiles(x0, y0, x1, y1).forEach(function (p) {
      if (G.placeError(o, t)) return;
      var b = G.cmdPlace(o, t, p[0], p[1], null);
      if (b) placed.push(b);
    });
    if (placed.length && builders && builders.length) {
      var c = builders[0], first = placed.slice().sort(function (a, b) { return G.dist(a, c) - G.dist(b, c); })[0];
      G.cmdBuild(builders, first);
    }
    return placed;
  };
  G.unitOK = function (o, t) {
    var d = G.UNITS[t], civ = S.players[o].civ;
    if (d.civ && d.civ !== civ) return false;
    if (d.notCiv && d.notCiv.indexOf(civ) >= 0) return false;
    if (S.opt.noUnits && S.opt.noUnits.indexOf(lineBase(t)) >= 0) return false;
    return true;
  };
  G.trainList = function (b) {
    var P = S.players[b.o], d = G.BLDS[b.t], out = [];
    (d.train || []).forEach(function (t0) {
      var t = t0 === 'uniq' ? G.CIVS[P.civ].uniq : t0;
      if (!G.unitOK(b.o, t)) return;
      if (t === 'hero' && (S.opt.victory === 'regicid' || S.opt.noHero)) return;
      out.push(curType(b.o, t));
    });
    return out;
  };
  function techId(P, id) {
    if (id === 'elite') return 'elite_' + P.civ;
    if (id === 'ut1') return G.CIVS[P.civ].ut[0];
    if (id === 'ut2') return G.CIVS[P.civ].ut[1];
    return id;
  }
  G.techId = function (o, id) { return techId(S.players[o], id); };
  G.techList = function (b) {
    var P = S.players[b.o], d = G.BLDS[b.t], out = [], list = (d.tech || []).map(function (id) { return techId(P, id); });
    list.forEach(function (id) {
      var T = G.TECHS[id];
      if (!T || P.techs[id]) return;
      if (T.civ && T.civ !== P.civ) return;
      if (T.ageUp && (T.ageUp !== P.age + 1 || (S.opt.maxAge !== undefined && T.ageUp > S.opt.maxAge))) return;
      if (S.opt.maxAge !== undefined && ageOfT(P, T) > S.opt.maxAge) return;
      if (T.up && !G.unitOK(b.o, T.up[1])) return;
      // treptele se arată pe rând: întâi cea dinainte, de la aceeași clădire
      if (T.req && T.req.some(function (r) { return list.indexOf(r) >= 0 && !P.techs[r]; })) return;
      out.push(id);
    });
    return out;
  };
  function queued(o, what, isTech) {
    return C.blds.some(function (b) {
      return !b.dead && b.o === o && b.q.some(function (it) { return isTech ? it.tech === what : (it.u === what || (it.u && lineBase(it.u) === lineBase(what))); });
    });
  }
  G.queued = queued;
  function needBErr(o, nb) {
    var P = S.players[o];
    function nm(t) { return G.nm(G.BLDS[t], P.civ); }
    if (nb.n) {
      var have = nb.of.filter(function (t) { return G.hasBuilt(o, t); });
      if (have.length < nb.n) return 'Îți trebuie ' + nb.n + ' clădiri dintre: ' + nb.of.map(nm).join(', ') + ' (ai ' + have.length + ').';
    }
    if (nb.all) for (var i = 0; i < nb.all.length; i++) if (!G.hasBuilt(o, nb.all[i])) return 'Îți trebuie: ' + nm(nb.all[i]) + '.';
    if (nb.any && !nb.any.some(function (t) { return G.hasBuilt(o, t); })) return 'Îți trebuie: ' + nb.any.map(nm).join(' sau ') + '.';
    return '';
  }
  G.needBErr = needBErr;
  G.trainError = function (b, t) {
    var P = S.players[b.o], d = G.UNITS[t], base = G.UNITS[lineBase(t)];
    if (!b.built) return 'Clădirea nu e gata.';
    var a = ageOfU(P, base);
    if (a > P.age) return 'Ai nevoie de ' + G.AGES[a] + '.';
    if (!reqOkU(P, base)) return 'Întâi cercetează: ' + base.req.map(function (r) { return G.TECHS[r].name; }).join(', ') + '.';
    if (d.hero && (C.hero[b.o] || queued(b.o, t, false))) return G.heroName(b.o) + ' e deja cu tine.';
    if (b.q.length >= 5) return 'Coada e plină.';
    var c = G.costOf(b.o, t);
    if (!G.canAfford(P, c)) return G.lackMsg(P, c);
    return '';
  };
  G.cmdTrain = function (b, t) {
    var err = G.trainError(b, t);
    if (err) return err;
    var P = S.players[b.o], d = G.UNITS[t], c = G.costOf(b.o, t);
    G.pay(P, c);
    b.q.push({ u: t, left: d.time, tot: d.time, cost: c });
    return '';
  };
  G.techError = function (b, id) {
    var P = S.players[b.o], T = G.TECHS[id];
    if (!b.built) return 'Clădirea nu e gata.';
    if (P.techs[id] || queued(b.o, id, true)) return 'Deja e în lucru.';
    var a = ageOfT(P, T);
    if (a > P.age) return 'Ai nevoie de ' + G.AGES[a] + '.';
    if (T.req) for (var i = 0; i < T.req.length; i++) {
      var r = T.req[i];
      if (P.techs[r] || (r === 'chimie' && T.up && G.UNITS[T.up[1]].line === 'can' && P.civ === 'oto')) continue;
      return 'Întâi: ' + G.TECHS[r].name + '.';
    }
    if (T.needB) { var e = needBErr(b.o, T.needB); if (e) return e; }
    if (T.ageUp && C.blds.some(function (x) { return !x.dead && x.o === b.o && x.q.some(function (it) { return it.tech && G.TECHS[it.tech].ageUp; }); })) return 'Deja treci în altă epocă.';
    if (b.q.length >= 5) return 'Coada e plină.';
    if (!G.canAfford(P, T.cost)) return G.lackMsg(P, T.cost);
    return '';
  };
  G.cmdTech = function (b, id) {
    var err = G.techError(b, id);
    if (err) return err;
    var P = S.players[b.o], T = G.TECHS[id];
    G.pay(P, T.cost);
    b.q.push({ tech: id, left: T.time, tot: T.time, cost: T.cost });
    return '';
  };
  G.cmdCancel = function (b, i) {
    var it = b.q[i]; if (!it) return;
    refund(S.players[b.o], it.cost || (it.u ? G.costOf(b.o, it.u) : G.TECHS[it.tech].cost));
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
    if (o.v !== 2) throw new Error('Salvare dintr-o versiune veche.');
    o.ter = Uint8Array.from(o.ter); o.exp = Uint8Array.from(o.exp);
    S = G.S = o;
    G.rebuild();
    refreshLists();
    G.updFog();
    return S;
  };
})();
