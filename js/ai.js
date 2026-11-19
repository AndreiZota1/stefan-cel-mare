// Calculatorul: își face economia, urcă prin cele 5 epoci, cercetează, ridică oaste după ce are dușmanul și atacă în valuri.
// Moduri (P.aiMode): full = tot; eco = tot, dar atacă doar când îi spune misiunea; defend = doar apără; static = nimic.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var S, C, P, A, D, pid, my, tc, civ;
  var AGE_TECH = ['feudal', 'castle', 'imperial', 'renastere'];
  // ce preferă fiecare civilizație (pondere în alegerea oștenilor)
  var TASTE = {
    mol: { inf: 1.2, arc: 1.2, cav: 1, uniq: 1.4 }, val: { inf: 1.3, arc: 0.9, cav: 1.1, uniq: 1.4 }, ung: { inf: 0.9, arc: 1, cav: 1.4, uniq: 1.4 },
    pol: { inf: 1.0, arc: 1.0, cav: 1.3, uniq: 1.3 }, oto: { inf: 1.1, arc: 1.1, cav: 1, uniq: 1.5 }, tat: { inf: 0.6, arc: 1.4, cav: 1.5, uniq: 1.5 }
  };

  G.aiTick = function (id) {
    S = G.S; C = G.C; pid = id; P = S.players[pid]; civ = P.civ;
    if (P.aiMode === 'static' || !P.alive) return;
    D = pid === 0 ? G.DIFF.normal : (G.DIFF[S.diff] || G.DIFF.normal);
    A = S.ai[pid] || (S.ai[pid] = { wave: 0, next: Math.max(D.first, S.opt.peace || 0), reb: 0, feud: 0, threat: 0, mkt: 0, relic: 0, bell: 0, calm: 0 });
    collect();
    // cere pace și se predă când a pierdut tot (ca în AoE2)
    if (!tc && !S.scen && S.t > 300 && my.vils.length <= 2 && my.army.length + my.navy.length <= 2 && !my.blds.some(function (b) { return b.t === 'cetate'; })) {
      G.msg(G.ppl(pid, true) + ' cer pace și se predau.', G.enemy(0, pid) ? 'good' : 'alert'); G.defeat(pid); return;
    }
    // nomazii: întâi cetatea, unde stau țăranii
    if (!tc && S.opt.nomad && my.vils.length && !my.blds.some(function (b) { return b.t === 'cetate'; })) {
      var cx = 0, cy = 0; my.vils.forEach(function (v) { cx += v.x; cy += v.y; }); cx /= my.vils.length; cy /= my.vils.length;
      var pos = placeNear('cetate', cx, cy, 0, 12, true);
      if (pos) { var nb = G.cmdPlace(pid, 'cetate', pos.tx, pos.ty, my.vils.slice()); if (nb) return; }
    }
    if (tc && P.aiMode !== 'defend') { economy(); buildings(); naval(); palisade(); }
    // aliatul bogat îi trimite omului ce-i lipsește
    if (pid !== 0 && G.ally(0, pid) && !S.players[0].ai && S.t > (A.trib || 240)) {
      A.trib = S.t + 120;
      ['f', 'w', 'g', 's'].some(function (r) { if (P.res[r] > 900 && S.players[0].res[r] < 150) { G.cmdTribute(pid, 0, r, 300); return true; } return false; });
    }
    // Regele dealului: oastea liberă merge să țină monumentul
    if (S.opt.victory === 'deal' && S.koth && S.koth.team !== P.team && S.t > (A.hill || 0)) {
      A.hill = S.t + 25;
      var hillers = my.army.filter(function (u) { return !u.task && !u.raid && G.UNITS[u.t].cls !== 'sie'; });
      if (hillers.length >= Math.min(6, 2 + P.age * 2)) G.cmdMove(hillers, S.koth.x, S.koth.y, true);
    }
    military();
  };

  function resOf(T) {
    var g = T.k === 'gat' ? T : (T.k === 'ret' ? T.back : null);
    if (!g) return null;
    return g.kind === 'tree' ? 'w' : g.kind === 'gold' ? 'g' : g.kind === 'stone' ? 's' : 'f';
  }
  function cur(t) { return G.curType(pid, t); }

  function collect() {
    my = { fishers: [], navy: [], vils: [], army: [], mons: [], blds: [], cnt: {}, built: {}, uc: {}, hero: null, gat: { f: 0, w: 0, g: 0, s: 0 }, byR: { f: [], w: [], g: [], s: [] }, idle: [], builders: {}, siege: 0, cls: {} };
    tc = null;
    C.units.forEach(function (u) {
      if (u.dead || u.o !== pid) return;
      var d = G.UNITS[u.t];
      if (u.t === 'vil') {
        my.vils.push(u);
        var T = u.task;
        if (!T || (T.k === 'move' && !u.path)) { if (!u.bell) my.idle.push(u); return; }
        if (T.k === 'bld') { my.builders[T.id] = 1; return; }
        var r = resOf(T);
        if (r) { my.gat[r]++; my.byR[r].push(u); }
      } else if (d.cls === 'mon') my.mons.push(u);
      else if (d.naval) { if (d.fisher) my.fishers.push(u); else my.navy.push(u); }
      else if (d.cls !== 'car') {
        my.army.push(u);
        my.cls[d.cls] = (my.cls[d.cls] || 0) + 1;
        if (d.hero) my.hero = u;
        if (d.cls === 'sie') my.siege++;
      }
    });
    C.blds.forEach(function (b) {
      if (b.dead || b.o !== pid) return;
      my.blds.push(b);
      my.cnt[b.t] = (my.cnt[b.t] || 0) + 1;
      if (b.built) my.built[b.t] = (my.built[b.t] || 0) + 1; else my.uc[b.t] = (my.uc[b.t] || 0) + 1;
      if (b.t === 'cetate' && b.built && !tc) tc = b;
    });
    my.home = tc || my.blds[0] || my.hero || my.army[0] || null;
  }

  function nextAge() { return P.age < 4 ? AGE_TECH[P.age] : null; }
  // clădirea care lipsește pentru epoca următoare (dacă lipsește vreuna)
  function missingAgeBld() {
    var at = nextAge(); if (!at || (S.opt.maxAge !== undefined && P.age >= S.opt.maxAge)) return null;
    var nb = G.TECHS[at].needB; if (!nb) return null;
    function has(t) { return (my.cnt[t] || 0) > 0; }
    if (nb.n) {
      var have = nb.of.filter(has).length;
      if (have >= nb.n) return null;
      return nb.of.filter(function (t) { return !has(t) && !G.placeError(pid, t).match(/epoc|Epoc/); })[0] || null;
    }
    if (nb.all) for (var i = 0; i < nb.all.length; i++) if (!has(nb.all[i])) return nb.all[i];
    if (nb.any && !nb.any.some(has)) return nb.any[nb.any.length - 1];
    return null;
  }
  function reserve() {
    var r = {}, at = nextAge();
    if (!at || G.queued(pid, at, true) || (S.opt.maxAge !== undefined && P.age >= S.opt.maxAge)) return r;
    var armyN = my.army.length;
    if (S.t > 300 && armyN < 3 + 3 * P.age && A.threat) return r; // întâi apărarea
    var need = [12, 22, 30, 36][P.age] * D.vil;
    if (my.vils.length < Math.round(need) * 0.85 || !tc) return r;
    var mb = missingAgeBld();
    if (mb) { var bc = G.BLDS[mb].cost; for (var kk in bc) r[kk] = bc[kk]; return r; }
    if (my.vils.length < Math.round(need)) return r;
    // strânge pentru epoca următoare doar dacă are deja clădirile și tehnologiile cerute
    var err = G.techError(tc, at);
    if (err && err.indexOf('Îți mai trebuie') !== 0 && err.indexOf('Coada') !== 0) return r;
    var c = G.TECHS[at].cost; for (var k in c) r[k] = c[k];
    return r;
  }

  // ---------- așezarea clădirilor ----------
  function margin(tx, ty, n) {
    var N = S.N;
    for (var y = ty - 1; y <= ty + n; y++) for (var x = tx - 1; x <= tx + n; x++) {
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      if (x >= tx && x < tx + n && y >= ty && y < ty + n) continue;
      var id = C.occ[y * N + x];
      if (!id) continue;
      var e = G.getE(id);
      if (e && e.k === 'b' && !G.BLDS[e.t].walk) return false;
    }
    return true;
  }
  function placeNear(t, cx, cy, rmin, rmax, loose) {
    var n = G.BLDS[t].n;
    for (var r = rmin; r <= rmax; r += 1) {
      var steps = Math.max(8, Math.round(r * 6)), a0 = Math.random() * Math.PI * 2;
      for (var s = 0; s < steps; s++) {
        var a = a0 + s / steps * Math.PI * 2;
        var tx = Math.round(cx + Math.cos(a) * r - n / 2), ty = Math.round(cy + Math.sin(a) * r - n / 2);
        if (!G.canPlace(pid, t, tx, ty)) continue;
        if (!loose && !margin(tx, ty, n)) continue;
        if (!loose && t !== 'cetate' && tc && G.distRect(tx + n / 2, ty + n / 2, G.rectOf(tc)) < n / 2 + 1.5) continue;
        return { tx: tx, ty: ty };
      }
    }
    return null;
  }
  function pickBuilder(x, y) {
    var best = null, bd = 1e9;
    my.vils.forEach(function (v) {
      var T = v.task;
      if ((T && T.k === 'bld') || v.bell) return;
      var r = T ? resOf(T) : null;
      var pen = !T ? 0 : (r === 'w' ? 4 : r === 'f' ? 6 : 30);
      var d = Math.hypot(v.x - x, v.y - y) + pen;
      if (d < bd) { bd = d; best = v; }
    });
    return best;
  }
  function build(t, pos, nb) {
    if (!pos) return null;
    var n = G.BLDS[t].n, v = pickBuilder(pos.tx + n / 2, pos.ty + n / 2);
    if (!v) return null;
    var b = G.cmdPlace(pid, t, pos.tx, pos.ty, [v]);
    if (b) {
      my.cnt[t] = (my.cnt[t] || 0) + 1; my.uc[t] = (my.uc[t] || 0) + 1;
      my.builders[b.id] = 1;
      var i = my.idle.indexOf(v); if (i >= 0) my.idle.splice(i, 1);
      // la clădirile mari mai trimite ajutoare
      for (var k = 1; k < (nb || 1); k++) { var w = pickBuilder(b.x, b.y); if (w) G.cmdBuild([w], b); }
    }
    return b;
  }
  function placeBuild(t, rmin, rmax, nb) { return build(t, placeNear(t, tc.x, tc.y, rmin, rmax), nb); }
  function can(t, R) { return !G.placeError(pid, t) && G.canAfford(P, G.BLDS[t].cost, R); }

  // ---------- economie ----------
  function economy() {
    var vilTarget = Math.min(Math.round([22, 32, 44, 52, 56][P.age] * D.vil), Math.round(S.opt.popMax * 0.56));
    if (my.vils.length < vilTarget && tc.q.length === 0 && P.pop < P.cap && G.canAfford(P, G.UNITS.vil.cost)) G.cmdTrain(tc, 'vil');
    var at = nextAge();
    if (at && !G.queued(pid, at, true) && tc.q.length <= 1 && !(S.opt.maxAge !== undefined && P.age >= S.opt.maxAge)) {
      var need = [13, 22, 30, 36][P.age] * D.vil;
      if (my.vils.length >= Math.round(need) && !G.techError(tc, at)) { G.cmdTech(tc, at); if (P.age === 0) A.feud = 1; }
    }
    // clădirile începute și rămase fără constructor
    my.blds.forEach(function (b) {
      if (b.built || my.builders[b.id] || !my.idle.length) return;
      var v = my.idle.shift();
      G.cmdBuild([v], b); my.builders[b.id] = 1;
    });
    assignGatherers();
    market();
  }

  function wantRatio() {
    var base = P.age === 0 ? (A.feud ? { f: 0.52, w: 0.38, g: 0.1, s: 0 } : { f: 0.55, w: 0.45, g: 0, s: 0 })
      : P.age === 1 ? { f: 0.45, w: 0.3, g: 0.21, s: 0.04 }
      : P.age === 2 ? { f: 0.4, w: 0.25, g: 0.27, s: my.cnt.fortareata ? 0.08 : 0.12 } : { f: 0.38, w: 0.24, g: 0.3, s: 0.08 };
    if (S.opt.victory === 'minune' && P.age >= 3 && !my.cnt.minune) base = { f: 0.28, w: 0.26, g: 0.24, s: 0.22 };
    var out = {}, tot = 0;
    for (var r in base) {
      var st = P.res[r], m = st > 1200 ? 0.25 : st > 600 ? 0.45 : st > 350 ? 0.75 : st < 80 ? 1.3 : 1;
      out[r] = base[r] * m; tot += out[r];
    }
    for (r in out) out[r] /= tot;
    return out;
  }
  function assignGatherers() {
    var want = wantRatio(), cnt = my.gat;
    var total = my.vils.length - Object.keys(my.builders).length;
    function deficit(r) { return want[r] * total - cnt[r]; }
    my.idle.forEach(function (v) {
      var order = ['f', 'w', 'g', 's'].sort(function (a, b) { return deficit(b) - deficit(a); });
      for (var i = 0; i < 4; i++) {
        if (want[order[i]] <= 0) continue;
        if (gatherRes(v, order[i])) { cnt[order[i]]++; return; }
      }
    });
    if (S.t - A.reb > 5) {
      A.reb = S.t;
      var rs = ['f', 'w', 'g', 's'];
      var over = rs.filter(function (r) { return deficit(r) < -1.5; }).sort(function (a, b) { return deficit(a) - deficit(b); })[0];
      var under = rs.filter(function (r) { return deficit(r) > 1.5 && want[r] > 0; }).sort(function (a, b) { return deficit(b) - deficit(a); })[0];
      if (over && under) {
        var v = my.byR[over].find(function (x) { return !x.carry || x.carry.n < 3; }) || my.byR[over][0];
        if (v) gatherRes(v, under);
      }
    }
  }
  function nearRes(kind, rad) {
    // cea mai apropiată resursă de un punct de depozitare
    var best = null, bd = 1e9;
    my.blds.forEach(function (b) {
      if (!b.built) return;
      var dr = G.BLDS[b.t].drop;
      if (!dr) return;
      var r = kind === 'tree' ? 'w' : kind === 'gold' ? 'g' : kind === 'stone' ? 's' : 'f';
      if (dr.indexOf(r) < 0) return;
      var e = G.findRes(pid, kind, b.x, b.y, rad);
      if (e) { var d = G.distRect(e.x, e.y, G.rectOf(b)); if (d < bd) { bd = d; best = e; } }
    });
    return best || G.findRes(pid, kind, tc.x, tc.y, 40);
  }
  function placeFarm() {
    var mills = my.blds.filter(function (b) { return b.built && (b.t === 'moara' || b.t === 'cetate'); });
    for (var i = 0; i < mills.length; i++) {
      var m = mills[i], pos = placeNear('ogor', m.x, m.y, m.t === 'cetate' ? 3 : 2.5, 7, true);
      if (pos) return G.cmdPlace(pid, 'ogor', pos.tx, pos.ty, []);
    }
    // nu mai e loc lângă mori: încă o moară, mai departe, unde e loc
    if (!my.uc.moara && G.canAfford(P, G.BLDS.moara.cost)) {
      var mp = placeNear('moara', tc.x, tc.y, 9, 18);
      if (mp) { var b = build('moara', mp); if (b) return null; }
    }
    return null;
  }
  function gatherRes(v, r) {
    var e = null;
    if (r === 'f') {
      e = G.findRes(pid, 'sheep', tc.x, tc.y, 12) || G.findRes(pid, 'deer', tc.x, tc.y, 19) || G.findRes(pid, 'berry', tc.x, tc.y, 18) || G.findRes(pid, 'fish', tc.x, tc.y, 16) || G.findRes(pid, 'farm', tc.x, tc.y, 40);
      if (!e) {
        if (my.cnt.moara) {
          if (!G.hasBuilt(pid, 'moara') || !G.canAfford(P, G.BLDS.ogor.cost)) return false;
          var b = placeFarm();
          if (b) { G.cmdBuild([v], b); my.builders[b.id] = 1; return true; }
          return false;
        }
        if (G.canAfford(P, G.BLDS.moara.cost)) {
          var pos = placeNear('moara', tc.x, tc.y, 5, 9);
          if (pos) { var mb = G.cmdPlace(pid, 'moara', pos.tx, pos.ty, [v]); if (mb) { my.cnt.moara = 1; my.builders[mb.id] = 1; return true; } }
        }
        return false;
      }
    } else if (r === 'w') e = nearRes('tree', 12);
    else if (r === 'g') e = nearRes('gold', 12);
    else e = nearRes('stone', 12);
    if (!e) return false;
    G.cmdGather([v], e);
    return true;
  }
  function woodFar() {
    var far = null, n = 0;
    my.byR.w.forEach(function (v) {
      var T = v.task.k === 'gat' ? v.task : v.task.back;
      if (!T) return;
      var d = G.findDrop(pid, 'w', T.ox, T.oy);
      if (!d || G.distRect(T.ox, T.oy, G.rectOf(d)) > 6) { n++; far = { x: T.ox, y: T.oy }; }
    });
    return n >= 3 ? far : null;
  }
  function market() {
    if (P.age < 2 || !my.built.targ || S.t - A.mkt < 12) return;
    A.mkt = S.t;
    var rs = ['f', 'w', 's'], hi = rs.filter(function (r) { return P.res[r] > 1300; })[0], lo = rs.filter(function (r) { return P.res[r] < 120; })[0];
    if (hi) G.cmdMarket(pid, 'sell', hi);
    if (lo && P.res.g > 900) G.cmdMarket(pid, 'buy', lo);
  }

  function buildings() {
    var R = reserve();
    // întâi clădirea cerută de epoca următoare
    var mb = missingAgeBld(), needV = [12, 22, 30, 36][P.age] * D.vil;
    if (mb && !my.uc[mb] && my.vils.length >= Math.round(needV) * 0.85 && can(mb)) placeBuild(mb, 6, 16, mb === 'universitate' || mb === 'fortareata' ? 3 : 2);
    var prod = my.blds.filter(function (b) { return b.built && G.BLDS[b.t].train; }).length;
    var room = P.cap - P.pop;
    if (P.cap < S.opt.popMax && room <= 2 + prod && (my.uc.casa || 0) < (P.pop > 30 ? 2 : 1) && can('casa')) placeBuild('casa', 5, 14);

    if (!my.cnt.joagar) {
      if (my.vils.length >= 4 && can('joagar')) {
        var t = G.findRes(pid, 'tree', tc.x, tc.y, 30, false);
        if (t && G.dist(t, tc) > 6) build('joagar', placeNear('joagar', t.x, t.y, 2, 6));
      }
    } else if (my.cnt.joagar < 6 && !my.uc.joagar && can('joagar', R)) {
      var far = woodFar();
      if (far) build('joagar', placeNear('joagar', far.x, far.y, 2, 6));
    }
    if (!my.cnt.moara && my.vils.length >= 7 && can('moara')) {
      var be = G.findRes(pid, 'berry', tc.x, tc.y, 18, false);
      build('moara', be && G.dist(be, tc) > 6 ? placeNear('moara', be.x, be.y, 2, 5) : placeNear('moara', tc.x, tc.y, 5, 9));
    }
    ['gold', 'stone'].forEach(function (k) {
      var need = k === 'gold' ? (my.gat.g >= 2 || A.feud) : my.gat.s >= 2;
      if (!need || my.uc.mina) return;
      var r = G.findRes(pid, k, tc.x, tc.y, 40, false);
      if (!r || G.dist(r, tc) < 7) return;
      var d = G.findDrop(pid, k === 'gold' ? 'g' : 's', r.x, r.y);
      if (d && G.distRect(r.x, r.y, G.rectOf(d)) < 6) return;
      if (!can('mina')) return;
      build('mina', placeNear('mina', r.x, r.y, 2, 5));
    });
    if (my.vils.length >= 10 && !my.cnt.cazarma && can('cazarma')) placeBuild('cazarma', 6, 13);
    if (P.age >= 1) {
      if (!my.cnt.poligon) { if (can('poligon', R)) placeBuild('poligon', 6, 14); }
      else if (!my.cnt.grajd) { if (can('grajd', R)) placeBuild('grajd', 6, 14); }
      else if (!my.cnt.fierarie) { if (can('fierarie', R)) placeBuild('fierarie', 5, 12); }
      else if (!my.cnt.targ && my.vils.length >= 24) { if (can('targ', R)) placeBuild('targ', 6, 14); }
      var towers = (S.diff === 'usor' && pid !== 0) ? 0 : (S.diff === 'greu' || S.diff === 'foarte') ? 3 : 2;
      if (P.res.s > 300) towers += 2;
      if ((my.cnt.turn || 0) < towers && !my.uc.turn && my.cnt.grajd && can('turn', R)) placeBuild('turn', 4, 10);
      if (!my.cnt.manastire && my.army.length >= 6 && my.cnt.fierarie && can('manastire', R)) placeBuild('manastire', 5, 12);
    }
    if (P.age >= 2) {
      if (!my.cnt.universitate && can('universitate', R)) placeBuild('universitate', 6, 15, 2);
      else if (!my.cnt.atelier && can('atelier', R)) placeBuild('atelier', 6, 15);
      else if (!my.cnt.fortareata && P.res.s >= 650 && can('fortareata')) placeBuild('fortareata', 7, 16, 4);
      if ((my.cnt.cazarma || 0) < 2 && can('cazarma', R)) placeBuild('cazarma', 6, 15);
      else if ((my.cnt.grajd || 0) < 2 && my.vils.length >= 26 && can('grajd', R)) placeBuild('grajd', 6, 15);
      else if ((my.cnt.poligon || 0) < 2 && my.vils.length >= 30 && can('poligon', R)) placeBuild('poligon', 6, 15);
    }
    if (P.age >= 3) {
      if (S.opt.victory === 'minune' && !my.cnt.minune && can('minune')) placeBuild('minune', 8, 18, 8);
      if ((my.cnt.cetate || 0) < 2 && my.vils.length >= 34 && can('cetate', R)) placeBuild('cetate', 12, 20, 3);
    }
    // bogat și fără destule locuri de făcut oaste: încă o clădire
    if (P.age >= 2 && P.res.f + P.res.g > 1800 && P.res.w > 300) {
      var mb = ['cazarma', 'poligon', 'grajd'].sort(function (a, b) { return (my.cnt[a] || 0) - (my.cnt[b] || 0); })[0];
      if ((my.cnt[mb] || 0) < 4 && !my.uc[mb] && can(mb)) placeBuild(mb, 7, 17);
    }
  }

  // ---------- oaste ----------
  function enemyComp() {
    var c = { inf: 0, arc: 0, skr: 0, gun: 0, cav: 0, har: 0, sie: 0, mon: 0, tot: 0, bld: 0 };
    C.units.forEach(function (u) { if (G.enemy(pid, u.o)) { var k = G.UNITS[u.t].cls; if (c[k] !== undefined && k !== 'vil') { c[k]++; c.tot++; } } });
    return c;
  }
  function pick(opts) {
    // opts: [[tip, pondere]] — alege la întâmplare, după pondere, dintre cele posibile
    var tot = 0, i;
    for (i = 0; i < opts.length; i++) tot += opts[i][1];
    var r = Math.random() * tot;
    for (i = 0; i < opts.length; i++) { r -= opts[i][1]; if (r <= 0) return opts[i][0]; }
    return opts.length ? opts[opts.length - 1][0] : null;
  }
  function chooseUnit(b, list, en) {
    var tz = TASTE[civ] || TASTE.mol, opts = [];
    function has(t) { var c = cur(t); return list.indexOf(c) >= 0 ? c : null; }
    var vsCav = (en.cav + en.har) / Math.max(1, en.tot), vsRng = (en.arc + en.har + en.gun) / Math.max(1, en.tot), vsInf = (en.inf + en.gun) / Math.max(1, en.tot);
    if (b.t === 'cazarma') {
      if (has('mil')) opts.push([has('mil'), tz.inf * (0.5 + vsInf + vsRng * 0.5)]);
      if (has('spr')) opts.push([has('spr'), tz.inf * (0.2 + vsCav * 2)]);
    } else if (b.t === 'poligon') {
      if (has('arc')) opts.push([has('arc'), tz.arc * (0.4 + vsInf)]);
      if (has('skr')) opts.push([has('skr'), tz.arc * (0.15 + vsRng * 1.5)]);
      if (has('har')) opts.push([has('har'), tz.arc * (civ === 'tat' || civ === 'ung' ? 0.9 : 0.3)]);
      if (has('gun')) opts.push([has('gun'), tz.arc * (0.4 + vsInf)]);
    } else if (b.t === 'grajd') {
      if (has('lcv')) opts.push([has('lcv'), tz.cav * (0.25 + vsRng + (en.sie + en.mon) * 0.1)]);
      if (has('kni') && P.res.g > 150) opts.push([has('kni'), tz.cav * (0.6 + vsRng * 0.5)]);
    } else if (b.t === 'atelier') {
      if (my.siege >= 2 + P.age - 2) return null;
      if (has('ram')) opts.push([has('ram'), 1]);
      if (has('cat')) opts.push([has('cat'), 0.4 + (en.inf + en.arc) / Math.max(1, en.tot)]);
      if (has('can')) opts.push([has('can'), 1.2]);
    } else if (b.t === 'fortareata') {
      var u = has(G.CIVS[civ].uniq);
      if (u) opts.push([u, tz.uniq * 2]);
      if (has('treb') && (my.cls.sie || 0) < 3 && P.age >= 3) opts.push(['treb', 0.5]);
    } else if (b.t === 'manastire') {
      if (my.mons.length < 1 + Math.floor(my.army.length / 12) && list.indexOf('mon') >= 0) return 'mon';
      return null;
    } else return null;
    return pick(opts);
  }
  // ---------- apa: port, bărci de pescuit, flotă ----------
  function portSpot() {
    var best = null, bd = 1e9, N = S.N;
    for (var y = Math.max(1, Math.floor(tc.y) - 24); y < Math.min(N - 4, Math.floor(tc.y) + 24); y++) for (var x = Math.max(1, Math.floor(tc.x) - 24); x < Math.min(N - 4, Math.floor(tc.x) + 24); x++) {
      var d = (x + 1.5 - tc.x) * (x + 1.5 - tc.x) + (y + 1.5 - tc.y) * (y + 1.5 - tc.y);
      if (d >= bd || d < 36) continue;
      if (G.canPlace(pid, 'port', x, y)) { bd = d; best = { tx: x, ty: y }; }
    }
    return best;
  }
  function naval() {
    if (A.noWater && S.t < A.noWater) return;
    // pe apă merge doar dacă e mare de-adevăratelea: hartă de mare/lac sau bancuri de pești în larg aproape
    if (A.waterOK === undefined) { var mt = S.map && S.map.type; A.waterOK = mt === 'mare' || mt === 'lac' || S.ents.some(function (e) { return e.t === 'fishd' && !e.dead && G.dist(e, tc) < 40; }); }
    if (!A.waterOK && !my.blds.some(function (b) { return b.t === 'port'; })) return;
    var port = null, anyPort = false;
    my.blds.forEach(function (b) { if (b.t === 'port') { anyPort = true; if (b.built && !port) port = b; } });
    if (!anyPort) {
      // portul nu așteaptă rezerva (altfel lemnul e mereu „ținut” pentru altceva): ajunge să fie 200 de lemne
      if (my.vils.length < Math.round(11 * D.vil) || G.placeError(pid, 'port') || P.res.w < 200) return;
      var spot = portSpot(); if (!spot) { A.noWater = S.t + 90; return; }
      build('port', spot, 2);
      return;
    }
    if (!port) return;
    // câți pești sunt aproape de port (o dată la jumătate de minut)
    if (!A.fishT || S.t > A.fishT) {
      A.fishT = S.t + 30;
      A.fishN = S.ents.filter(function (e) { return e.k === 'r' && !e.dead && (e.t === 'fishd' || e.t === 'fish') && G.dist(e, port) < 30 && G.accessible(e, true); }).length;
    }
    my.fishers.forEach(function (u) {
      if (u.task) return;
      var f = G.findRes(pid, 'fishd', u.x, u.y, 34, undefined, true) || G.findRes(pid, 'fish', u.x, u.y, 34, undefined, true);
      if (f) G.cmdGather([u], f);
    });
    var R = reserve(), inQ = function (t) { return port.q.filter(function (it) { return it.u === t; }).length; };
    var wantF = Math.min(Math.round(7 * D.vil), (A.fishN || 0) * 2);
    if (my.fishers.length + inQ('pesc') < wantF && port.q.length < 2 && P.pop + 1 < P.cap && G.canAfford(P, G.costOf(pid, 'pesc'), R)) G.cmdTrain(port, 'pesc');
    if (P.age < 1) return;
    // flota: doar dacă dușmanul are corăbii sau port
    var enemyNav = null;
    C.units.forEach(function (e) { if (!enemyNav && !e.dead && G.enemy(pid, e.o) && G.UNITS[e.t].naval) enemyNav = e; });
    var enemyPort = C.blds.find(function (b) { return !b.dead && b.t === 'port' && G.enemy(pid, b.o); });
    if (!enemyNav && !enemyPort) return;
    var wantG = Math.round([0, 4, 7, 9, 12][P.age] * D.army);
    if (my.navy.length + inQ('gal') + inQ('gal2') + inQ('foc') < wantG && port.q.length < 2 && P.pop + 1 < P.cap) {
      var gt = cur('gal'); if (P.age >= 2 && my.navy.length % 3 === 2 && !G.trainError(port, 'foc')) gt = 'foc';
      if (!G.trainError(port, gt) && G.canAfford(P, G.costOf(pid, gt), R)) G.cmdTrain(port, gt);
    }
    // corăbiile libere vânează flota dușmană, apoi bărcile de pescuit, apoi portul
    my.navy.forEach(function (sh) {
      if (sh.task) return;
      var best = null, bd = 1e9;
      C.units.forEach(function (e) { if (e.dead || e.gin || !G.enemy(pid, e.o) || !G.UNITS[e.t].naval) return; var d = G.dist(sh, e); if (d < bd) { bd = d; best = e; } });
      if (!best && enemyPort && G.UNITS[sh.t].rng) best = enemyPort;
      if (best) G.cmdAttack([sh], best);
    });
  }

  function military() {
    var R = reserve(), en = enemyComp();
    var armyCap = Math.max(0, P.cap - my.vils.length);
    // oastea dorită pe epocă; peste ea face oameni doar dacă e atacat sau dacă are resurse din belșug
    var want = Math.round([5, 14, 26, 40, 50][P.age] * D.army), rich = P.res.f > 700 && P.res.g > 500;
    if (my.army.length >= want && !A.threat && !rich && P.aiMode !== 'defend') armyCap = Math.min(armyCap, my.army.length);
    my.blds.forEach(function (b) {
      if (!b.built || b.q.length >= 2 || b.t === 'cetate' || b.t === 'targ' || b.t === 'port') return;
      if (P.aiMode === 'defend' && my.army.length > 40) return;
      var list = G.trainList(b).filter(function (t) { return !G.trainError(b, t) || G.trainError(b, t).indexOf('Îți mai trebuie') === 0; });
      if (!list.length) return;
      var t = chooseUnit(b, list, en);
      if (!t || P.pop + 1 >= P.cap || my.army.length >= armyCap) return;
      if (G.canAfford(P, G.costOf(pid, t), R) && !G.cmdTrain(b, t) && G.UNITS[t].cls === 'sie') my.siege++;
    });
    if (tc && !C.hero[pid] && P.age >= 1 && tc.q.length === 0 && !G.queued(pid, 'hero', false) && G.trainList(tc).indexOf('hero') >= 0 &&
        G.canAfford(P, G.costOf(pid, 'hero'), R)) G.cmdTrain(tc, 'hero');
    techs(R);
    hero();
    monks();
    defend();
    if (P.aiMode === 'full' || (P.aiMode === 'eco' && A.go)) { attack(); retreat(); raid(); }
  }
  // ---------- raidurile: câțiva călăreți repezi lovesc țăranii dușmani departe de cetăți și turnuri ----------
  function guarded(x, y, o) {
    for (var i = 0; i < C.blds.length; i++) { var b = C.blds[i]; if (b.dead || b.o !== o || !b.built || !(b.t === 'cetate' || b.t === 'turn' || b.t === 'fortareata')) continue; if (G.dist(b, { x: x, y: y }) < 9.5) return true; }
    return false;
  }
  function raidPrey(from, p, rad) {
    var best = null, bd = rad * rad;
    C.units.forEach(function (e) {
      if (e.dead || e.gin || e.t !== 'vil' || !G.enemy(pid, e.o) || (p >= 0 && e.o !== p) || guarded(e.x, e.y, e.o)) return;
      var d = (e.x - from.x) * (e.x - from.x) + (e.y - from.y) * (e.y - from.y); if (d < bd) { bd = d; best = e; }
    });
    return best;
  }
  function raid() {
    if (S.diff === 'usor' || P.age < 1 || A.threat || S.t < (S.opt.peace || 0)) return;
    var raiders = my.army.filter(function (u) { return u.raid; });
    raiders.forEach(function (u) {
      if (u.hp < u.mhp * 0.6 || S.t > A.raidEnd) { u.raid = 0; if (my.home) G.cmdMove([u], my.home.x, my.home.y); return; }
      if (u.task && u.task.k === 'atk') return;
      var prey = raidPrey(u, -1, 14);
      if (prey) G.cmdAttack([u], prey); else { u.raid = 0; if (my.home) G.cmdMove([u], my.home.x, my.home.y); }
    });
    if (raiders.length || S.t < (A.raidT || 0)) return;
    A.raidT = S.t + (S.diff === 'foarte' ? 160 : S.diff === 'greu' ? 220 : 300);
    var fast = my.army.filter(function (u) { var c = G.UNITS[u.t].cls; return !u.wave && !(u.task && u.task.k === 'atk') && u.hp > u.mhp * 0.75 && (c === 'cav' || c === 'har') && !G.UNITS[u.t].hero; });
    var nr = S.diff === 'normal' ? 3 : 4;
    if (fast.length < 3 || !my.home) return;
    var p = targetPlayer(), prey = p >= 0 ? raidPrey(my.home, p, 90) : null;
    if (!prey) return;
    var grp = fast.slice(0, nr);
    grp.forEach(function (u) { u.raid = 1; });
    A.raidEnd = S.t + 50;
    G.cmdAttack(grp, prey);
  }
  // ---------- retragerea: un val care pierde se întoarce acasă să se refacă ----------
  function retreat() {
    if (!my.home) return;
    var w = A.wave; if (!w) return;
    var wave = my.army.filter(function (u) { return u.wave === w; });
    if (!wave.length) return;
    var hp = 0, mhp = 0, cx = 0, cy = 0;
    wave.forEach(function (u) { hp += u.hp; mhp += u.mhp; cx += u.x; cy += u.y; }); cx /= wave.length; cy /= wave.length;
    if (!A.wHp || A.wId !== w) { A.wId = w; A.wHp = mhp; A.wT = S.t; return; }
    if (S.t - A.wT < 15 || hp > A.wHp * 0.35) return;
    var foes = 0; C.units.forEach(function (e) { if (!e.dead && !e.gin && G.enemy(pid, e.o) && G.isMil(e) && Math.hypot(e.x - cx, e.y - cy) < 9) foes++; });
    if (foes < wave.length) return;
    wave.forEach(function (u) { u.wave = 0; });
    G.cmdMove(wave, my.home.x, my.home.y);
    A.next = Math.max(A.next, S.t + D.every * 0.6); A.wHp = 0;
    if (G.enemy(0, pid)) G.msg('Oastea ' + G.ppl(pid).replace(/ii$/, 'ilor') + ' se retrage!', 'good', { x: cx, y: cy });
  }
  // ---------- palisada: un gard de pari în jurul satului, cu porți pe fiecare latură ----------
  function palisade() {
    if (A.walled || S.diff === 'usor' || P.age < 2 || S.t < 1000 || P.res.w < 450 || my.vils.length < 28 || S.scen) return;
    A.walled = 1;
    var r = 13, N = S.N, x0 = Math.max(2, Math.round(tc.x - r)), y0 = Math.max(2, Math.round(tc.y - r)), x1 = Math.min(N - 3, Math.round(tc.x + r)), y1 = Math.min(N - 3, Math.round(tc.y + r));
    var bl = [pickBuilder(x0, y0), pickBuilder(x1, y1)].filter(Boolean);
    [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].forEach(function (sd, i) {
      G.cmdPlaceWall(pid, 'palisada', sd[0], sd[1], sd[2], sd[3], i % 2 ? bl.slice(1) : bl.slice(0, 1));
      var mx = Math.round((sd[0] + sd[2]) / 2), myy = Math.round((sd[1] + sd[3]) / 2);
      for (var k = -1; k <= 1; k++) { var gx = sd[0] === sd[2] ? mx : mx + k, gy = sd[1] === sd[3] ? myy : myy + k; if (G.canPlace(pid, 'poartal', gx, gy)) { G.cmdPlace(pid, 'poartal', gx, gy, null); break; } }
    });
  }
  function techs(R) {
    var started = 0;
    function tryT(bt, id) {
      if (started > 1) return;
      id = G.techId(pid, id);
      var b = my.blds.find(function (x) { return x.t === bt && x.built && x.q.length === 0; });
      if (!b || G.techList(b).indexOf(id) < 0 || G.techError(b, id)) return;
      if (!G.canAfford(P, G.TECHS[id].cost, R)) return;
      G.cmdTech(b, id); started++;
    }
    var big = my.army.length >= 8;
    if (my.vils.length >= 15) tryT('cetate', 'razboi');
    if (my.gat.w >= 5) { tryT('joagar', 'topor'); tryT('joagar', 'ferastrau'); tryT('joagar', 'ferastrau2'); }
    if (my.gat.g + my.gat.s >= 4) { tryT('mina', 'tarnacop'); tryT('mina', 'puturi'); }
    if ((my.built.ogor || 0) >= 3) { tryT('moara', 'jug'); tryT('moara', 'plug'); tryT('moara', 'rotatie'); }
    if (my.vils.length >= 18) tryT('cetate', 'roaba');
    if (my.vils.length >= 30) tryT('cetate', 'carut');
    if (my.army.length >= 5) {
      var c = my.cls, mel = (c.inf || 0) + (c.cav || 0), rng = (c.arc || 0) + (c.skr || 0) + (c.har || 0) + (c.gun || 0);
      if (mel >= 3) { tryT('fierarie', 'forja'); tryT('fierarie', 'fonta'); tryT('fierarie', 'furnal'); }
      if ((c.inf || 0) >= 3) { tryT('fierarie', 'zale1'); tryT('fierarie', 'zale2'); tryT('fierarie', 'zale3'); }
      if ((c.cav || 0) >= 3) { tryT('fierarie', 'sab1'); tryT('fierarie', 'sab2'); tryT('fierarie', 'sab3'); }
      if (rng >= 3) { tryT('fierarie', 'pene'); tryT('fierarie', 'varf'); tryT('fierarie', 'bratara'); tryT('fierarie', 'vesta1'); tryT('fierarie', 'vesta2'); }
    }
    // treptele oștenilor pe care îi are
    var lines = {};
    my.army.forEach(function (u) { var d = G.UNITS[u.t]; if (d.line) lines[d.line] = (lines[d.line] || 0) + 1; });
    Object.keys(lines).forEach(function (l) {
      if (lines[l] < 3) return;
      var nxt = G.LINES[l][G.UNITS[cur(G.LINES[l][0])].tier];
      if (!nxt) return;
      for (var id in G.TECHS) {
        var T = G.TECHS[id];
        if (T.up && T.up[1] === nxt) {
          var bt = ['cazarma', 'poligon', 'grajd', 'atelier', 'fortareata'].find(function (x) { return (G.BLDS[x].tech || []).indexOf(id) >= 0 || (x === 'fortareata' && id.indexOf('elite_') === 0); });
          if (bt) tryT(bt, bt === 'fortareata' ? 'elite' : id);
        }
      }
    });
    if (big) { tryT('cazarma', 'mars'); tryT('poligon', 'inel'); tryT('grajd', 'potcoave'); }
    tryT('fortareata', 'ut1'); tryT('fortareata', 'ut2');
    ['zidarie', 'fortificatii', 'balistica', 'chimie', 'inginerie', 'turn2', 'arhitectura', 'turn3', 'tiparnita', 'turn4'].forEach(function (id) { tryT('universitate', id); });
    if (my.mons.length) { tryT('manastire', 'ierburi'); tryT('manastire', 'credinta'); }
    if (big && P.age >= 3) tryT('fortareata', 'recrutare');
  }
  function hero() {
    var h = my.hero;
    if (!h) return;
    var home = my.home;
    if (S.opt.victory === 'regicid' && home && G.dist(h, home) > 8) { h.wave = 0; G.cmdMove([h], home.x + 2, home.y + 3); return; }
    if (h.hp < h.mhp * 0.35 && home && G.dist(h, home) > 6) { h.wave = 0; G.cmdMove([h], home.x + 3, home.y + 3); return; }
    // puterea: când e bătaie în jurul lui
    if (!G.powerError(pid)) {
      var foes = 0, friends = 0, hurt = 0;
      G.forUnitsNear(h.x, h.y, 7, function (u) {
        if (G.enemy(pid, u.o)) foes++;
        else if (u.o === pid) { friends++; if (u.hp < u.mhp * 0.6) hurt++; }
      });
      var pw = G.CIVS[civ].power;
      if ((pw === 'cruciada' ? hurt >= 4 : pw === 'garda' ? foes >= 3 : foes >= 4 && friends >= 3)) G.cmdPower(pid);
    }
  }
  function monks() {
    if (!my.mons.length || S.t - A.relic < 8) return;
    A.relic = S.t;
    var m = my.mons.find(function (u) { return !u.task && !u.relic; });
    if (!m) return;
    var best = null, bd = 60 * 60;
    S.ents.forEach(function (e) {
      if (e.dead || e.k !== 'r' || e.t !== 'relic') return;
      var d = (e.x - m.x) * (e.x - m.x) + (e.y - m.y) * (e.y - m.y);
      if (d < bd) { bd = d; best = e; }
    });
    if (best && G.hasBuilt(pid, 'manastire')) G.cmdGather([m], best);
  }
  function defend() {
    var threat = null, td = 1e9, near = 0;
    my.blds.forEach(function (b) {
      if (b.t === 'ogor' || G.BLDS[b.t].wall) return;
      G.forUnitsNear(b.x, b.y, 12, function (e) {
        if (e.dead || !G.enemy(pid, e.o) || e.t === 'mon' || e.t === 'car') return;
        var d = G.dist(e, b);
        if (d < 12) { near++; if (d < td) { td = d; threat = e; } }
      });
    });
    // aliații atacați aproape
    if (!threat) C.blds.forEach(function (b) {
      if (threat || b.dead || b.o === pid || !G.ally(pid, b.o) || !b.hit || S.t - b.hit > 3) return;
      G.forUnitsNear(b.x, b.y, 10, function (e) { if (!threat && G.enemy(pid, e.o) && !e.dead) threat = e; });
    });
    // țăranii loviți departe de case: fug în cetate, iar oastea vine după cel care i-a lovit
    my.vils.forEach(function (v) {
      if (!v.hit || S.t - v.hit > 2.5) return;
      var att = null, na = 0; G.forUnitsNear(v.x, v.y, 5, function (e) { if (!e.dead && G.enemy(pid, e.o) && G.isMil(e)) { na++; if (!att) att = e; } });
      if (!att) return;
      A.vHit = S.t; if (!threat) { threat = att; near++; }
      if (tc && (na >= 3 || v.hp < v.mhp * 0.5) && G.dist(v, tc) < 30 && !(v.task && v.task.k === 'gar')) G.cmdGarrison([v], tc);
    });
    // s-a liniștit: țăranii adăpostiți ies la treabă
    // ies din cetate când nu mai e niciun dușman în jurul ei (chiar dacă raidurile continuă în altă parte)
    if (tc && tc.gar && tc.gar.length && !P.bell) {
      var nearTc = 0; G.forUnitsNear(tc.x, tc.y, 11, function (e) { if (!e.dead && G.enemy(pid, e.o) && G.isMil(e)) nearTc++; });
      if (!nearTc) { A.tcCalm = A.tcCalm || S.t; if (S.t - A.tcCalm > 4) { G.cmdUngarrison(tc); A.tcCalm = 0; } } else A.tcCalm = 0;
    }
    A.threat = threat ? threat.id : 0;
    // clopotul: când dușmanii mulți sunt lângă cetate și oastea e mică
    if (tc && threat && near >= 5 && my.army.length < near * 0.6 && !P.bell && G.dist(threat, tc) < 14) { G.cmdBell(pid); A.bell = S.t; }
    if (P.bell && !threat) { if (!A.calm) A.calm = S.t; if (S.t - A.calm > 8) { G.cmdBell(pid); A.calm = 0; } } else A.calm = 0;
    if (!threat) return;
    my.army.forEach(function (u) {
      if (u.wave && my.home && G.dist(u, my.home) > 28) return;
      if (u.task && u.task.k === 'atk') return;
      if (G.UNITS[u.t].onlyBld) return;
      u.wave = 0;
      G.cmdAttack([u], threat);
    });
  }
  function targetPlayer() {
    // dușmanul cel mai apropiat (după clădiri)
    var best = -1, bd = 1e9, from = my.home;
    if (!from) return -1;
    C.blds.forEach(function (b) {
      if (b.dead || !G.enemy(pid, b.o) || G.BLDS[b.t].farm) return;
      var d = G.dist(b, from);
      if (d < bd) { bd = d; best = b.o; }
    });
    return best;
  }
  function enemyTarget(from, p) {
    var best = null, bd = 1e9;
    if (S.wonder && G.enemy(pid, S.wonder.o)) { var w = G.getE(S.wonder.id); if (w) return w; }
    C.blds.forEach(function (b) {
      if (b.dead || !G.enemy(pid, b.o) || G.BLDS[b.t].farm || (p >= 0 && b.o !== p)) return;
      var d = G.dist(b, from) + (G.BLDS[b.t].wall ? 6 : 0);
      if (d < bd) { bd = d; best = b; }
    });
    if (!best && p >= 0) return enemyTarget(from, -1);
    if (!best) C.units.forEach(function (u) { if (!u.dead && G.enemy(pid, u.o)) { var d = G.dist(u, from); if (d < bd) { bd = d; best = u; } } });
    return best;
  }
  function attack() {
    if (S.t < (S.opt.peace || 0)) return;
    if ((S.t >= A.next || A.go) && !A.threat) {
      var free = my.army.filter(function (u) {
        return !u.wave && !(u.task && u.task.k === 'atk') && u.hp > u.mhp * 0.5 && !(G.UNITS[u.t].hero && S.opt.victory === 'regicid');
      });
      var need = Math.min(40, D.wave0 + D.waveAdd * A.wave);
      if (A.go) need = Math.min(need, Math.max(1, free.length));
      if (free.length >= need) {
        var p = targetPlayer(), tgt = my.home ? enemyTarget(my.home, p) : null;
        if (tgt) {
          A.wave++; A.go = 0;
          // câțiva călugări merg cu valul: vindecă pe drum și convertesc dușmanii
          if (P.age >= 2) free = free.concat(my.mons.filter(function (m) { return !m.task && !m.relic; }).slice(0, 2));
          free.forEach(function (u) { u.wave = A.wave; });
          G.cmdMove(free, tgt.x, tgt.y, true);
          if (G.enemy(0, pid) && G.ally(0, tgt.o)) {
            G.msg('Iscoadele aduc vești: oastea ' + G.ppl(pid).replace(/ii$/, 'ilor') + ' vine spre ' + (tgt.o === 0 ? 'tine' : 'aliații tăi') + '!', 'alert', { x: free[0].x, y: free[0].y });
            G.sfx('horn');
            // uneori își strigă și atacul, ca în AoE2
            if (Math.random() < 0.3 && G.UI && G.UI.taunt) setTimeout(function () { G.UI.taunt(Math.random() < 0.5 ? 8 : 11, pid); }, 2500);
          }
        }
        A.next = S.t + D.every;
      } else A.next = S.t + 20;
    }
    my.army.forEach(function (u) {
      if (!u.wave || u.task) return;
      // n-a găsit drum (ziduri, porți închise): lovește cel mai apropiat zid sau poartă
      if (u.ign && Object.keys(u.ign).length) {
        var wbest = null, wd = 30;
        C.blds.forEach(function (b) { if (!b.dead && G.enemy(pid, b.o) && G.BLDS[b.t].wall) { var d = G.dist(b, u); if (d < wd) { wd = d; wbest = b; } } });
        if (wbest) { G.cmdAttack([u], wbest); return; }
      }
      var tgt = enemyTarget(u, -1);
      if (tgt) G.cmdMove([u], tgt.x, tgt.y, true); else u.wave = 0;
    });
  }
  G.aiAttackNow = function (id) { var a = G.S.ai[id] || (G.S.ai[id] = { wave: 0, next: 0, reb: 0, feud: 0, threat: 0, mkt: 0, relic: 0, bell: 0, calm: 0 }); a.go = 1; a.next = 0; };
})();
