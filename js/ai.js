// Adversarul: Soliman Pașa. Își face economia, urcă în epoci, ridică oaste și atacă în valuri.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var S, C, P, A, D, pid, my, tc;

  G.aiTick = function (id) {
    S = G.S; C = G.C; pid = id; P = S.players[pid];
    D = pid === 1 ? G.DIFF[S.diff] : G.DIFF.normal;
    A = S.ai[pid] || (S.ai[pid] = { wave: 0, next: D.first, reb: 0, feud: 0, threat: 0 });
    collect();
    if (!tc) return;
    economy();
    buildings();
    military();
  };

  function resOf(T) {
    var g = T.k === 'gat' ? T : (T.k === 'ret' ? T.back : null);
    if (!g) return null;
    return g.kind === 'tree' ? 'w' : g.kind === 'gold' ? 'g' : g.kind === 'stone' ? 's' : 'f';
  }

  function collect() {
    my = { vils: [], army: [], blds: [], cnt: {}, built: {}, uc: {}, hero: null, gat: { f: 0, w: 0, g: 0, s: 0 }, byR: { f: [], w: [], g: [], s: [] }, idle: [], builders: {} };
    tc = null;
    C.units.forEach(function (u) {
      if (u.dead || u.o !== pid) return;
      if (u.t === 'vil') {
        my.vils.push(u);
        var T = u.task;
        if (!T || (T.k === 'move' && !u.path)) { my.idle.push(u); return; }
        if (T.k === 'bld') { my.builders[T.id] = 1; return; }
        var r = resOf(T);
        if (r) { my.gat[r]++; my.byR[r].push(u); }
      } else {
        my.army.push(u);
        if (G.UNITS[u.t].hero) my.hero = u;
      }
    });
    C.blds.forEach(function (b) {
      if (b.dead || b.o !== pid) return;
      my.blds.push(b);
      my.cnt[b.t] = (my.cnt[b.t] || 0) + 1;
      if (b.built) my.built[b.t] = (my.built[b.t] || 0) + 1; else my.uc[b.t] = (my.uc[b.t] || 0) + 1;
      if (b.t === 'cetate' && !tc) tc = b;
    });
  }

  function reserve() {
    var r = {};
    var armyN = my.army.filter(function (u) { return !G.UNITS[u.t].hero; }).length;
    if (S.t > 300 && armyN < 3 + 3 * P.age) return r; // întâi apărarea, apoi epoca următoare
    if (P.age === 0 && my.vils.length >= Math.round(12 * D.vil) && !G.queued(pid, 'feudal', true)) r.f = 500;
    if (P.age === 1 && my.vils.length >= Math.round(20 * D.vil) && !G.queued(pid, 'castle', true)) { r.f = 800; r.g = 200; }
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
        if (!loose && t !== 'cetate' && G.distRect(tx + n / 2, ty + n / 2, G.rectOf(tc)) < n / 2 + 1.5) continue;
        return { tx: tx, ty: ty };
      }
    }
    return null;
  }
  function pickBuilder(x, y) {
    var best = null, bd = 1e9;
    my.vils.forEach(function (v) {
      var T = v.task;
      if (T && T.k === 'bld') return;
      var r = T ? resOf(T) : null;
      var pen = !T ? 0 : (r === 'w' ? 4 : r === 'f' ? 6 : 30);
      var d = Math.hypot(v.x - x, v.y - y) + pen;
      if (d < bd) { bd = d; best = v; }
    });
    return best;
  }
  function build(t, pos) {
    if (!pos) return null;
    var n = G.BLDS[t].n, v = pickBuilder(pos.tx + n / 2, pos.ty + n / 2);
    if (!v) return null;
    var b = G.cmdPlace(pid, t, pos.tx, pos.ty, [v]);
    if (b) {
      my.cnt[t] = (my.cnt[t] || 0) + 1; my.uc[t] = (my.uc[t] || 0) + 1;
      my.builders[b.id] = 1;
      var i = my.idle.indexOf(v); if (i >= 0) my.idle.splice(i, 1);
    }
    return b;
  }
  function placeBuild(t, rmin, rmax) { return build(t, placeNear(t, tc.x, tc.y, rmin, rmax)); }

  // ---------- economie ----------
  function economy() {
    var vilTarget = Math.round([20, 28, 34][P.age] * D.vil);
    if (my.vils.length < vilTarget && tc.q.length === 0 && P.pop < P.cap && G.canAfford(P, G.UNITS.vil.cost)) G.cmdTrain(tc, 'vil');
    if (P.age === 0 && !G.queued(pid, 'feudal', true) && my.vils.length >= Math.round(13 * D.vil) && tc.q.length <= 1 && G.canAfford(P, G.TECHS.feudal.cost)) {
      G.cmdTech(tc, 'feudal'); A.feud = 1;
    }
    if (P.age === 1 && !G.queued(pid, 'castle', true) && my.vils.length >= Math.round(20 * D.vil) && (my.built.poligon || my.built.grajd) &&
        tc.q.length <= 1 && G.canAfford(P, G.TECHS.castle.cost)) G.cmdTech(tc, 'castle');
    // clădirile începute și rămase fără constructor
    my.blds.forEach(function (b) {
      if (b.built || my.builders[b.id] || !my.idle.length) return;
      var v = my.idle.shift();
      G.cmdBuild([v], b); my.builders[b.id] = 1;
    });
    assignGatherers();
  }

  function wantRatio() {
    var base = P.age === 0 ? (A.feud ? { f: 0.52, w: 0.38, g: 0.1, s: 0 } : { f: 0.55, w: 0.45, g: 0, s: 0 })
      : P.age === 1 ? { f: 0.45, w: 0.3, g: 0.21, s: 0.04 } : { f: 0.42, w: 0.26, g: 0.28, s: 0.04 };
    // ce se strânge în hambar primește mai puțini oameni
    var out = {}, tot = 0;
    for (var r in base) {
      var st = P.res[r], m = st > 600 ? 0.4 : st > 350 ? 0.7 : st < 80 ? 1.3 : 1;
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
    return best || G.findRes(pid, kind, tc.x, tc.y, 34);
  }
  function placeFarm() {
    var m = my.blds.find(function (b) { return b.t === 'moara'; }) || tc;
    var pos = placeNear('ogor', m.x, m.y, 2.5, 8, true) || placeNear('ogor', tc.x, tc.y, 3, 9, true);
    return pos ? G.cmdPlace(pid, 'ogor', pos.tx, pos.ty, []) : null;
  }
  function gatherRes(v, r) {
    var e = null;
    if (r === 'f') {
      e = G.findRes(pid, 'sheep', tc.x, tc.y, 12) || G.findRes(pid, 'berry', tc.x, tc.y, 18) || G.findRes(pid, 'farm', tc.x, tc.y, 40);
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

  function buildings() {
    var R = reserve();
    var prod = my.blds.filter(function (b) { return b.built && G.BLDS[b.t].train; }).length;
    var room = P.cap - P.pop;
    if (P.cap < G.MAXPOP && room <= 2 + prod && (my.uc.casa || 0) < (P.pop > 30 ? 2 : 1) && G.canAfford(P, G.BLDS.casa.cost)) placeBuild('casa', 5, 13);

    if (!my.cnt.joagar) {
      if (my.vils.length >= 4 && G.canAfford(P, G.BLDS.joagar.cost)) {
        var t = G.findRes(pid, 'tree', tc.x, tc.y, 30, false);
        if (t && G.dist(t, tc) > 6) build('joagar', placeNear('joagar', t.x, t.y, 2, 6));
      }
    } else if (my.cnt.joagar < 5 && !my.uc.joagar && G.canAfford(P, G.BLDS.joagar.cost, R)) {
      var far = woodFar();
      if (far) build('joagar', placeNear('joagar', far.x, far.y, 2, 6));
    }
    if (!my.cnt.moara && my.vils.length >= 7 && G.canAfford(P, G.BLDS.moara.cost)) {
      var be = G.findRes(pid, 'berry', tc.x, tc.y, 18, false);
      build('moara', be && G.dist(be, tc) > 6 ? placeNear('moara', be.x, be.y, 2, 5) : placeNear('moara', tc.x, tc.y, 5, 9));
    }
    ['gold', 'stone'].forEach(function (k) {
      var need = k === 'gold' ? (my.gat.g >= 2 || A.feud) : my.gat.s >= 2;
      if (!need || my.uc.mina) return;
      var r = G.findRes(pid, k, tc.x, tc.y, 34, false);
      if (!r || G.dist(r, tc) < 7) return;
      var d = G.findDrop(pid, k === 'gold' ? 'g' : 's', r.x, r.y);
      if (d && G.distRect(r.x, r.y, G.rectOf(d)) < 6) return;
      if (!G.canAfford(P, G.BLDS.mina.cost)) return;
      build('mina', placeNear('mina', r.x, r.y, 2, 5));
    });
    if (my.vils.length >= 10 && !my.cnt.cazarma && G.canAfford(P, G.BLDS.cazarma.cost)) placeBuild('cazarma', 6, 13);
    if (P.age >= 1) {
      if (!my.cnt.poligon) { if (G.canAfford(P, G.BLDS.poligon.cost, R)) placeBuild('poligon', 6, 14); }
      else if (!my.cnt.grajd) { if (G.canAfford(P, G.BLDS.grajd.cost, R)) placeBuild('grajd', 6, 14); }
      else if (!my.cnt.fierarie) { if (G.canAfford(P, G.BLDS.fierarie.cost, R)) placeBuild('fierarie', 5, 12); }
      var towers = S.diff === 'usor' && pid === 1 ? 0 : S.diff === 'greu' && pid === 1 ? 3 : 2;
      if (P.res.s > 300) towers += 2;
      if ((my.cnt.turn || 0) < towers && !my.uc.turn && my.cnt.grajd && G.canAfford(P, G.BLDS.turn.cost, R)) placeBuild('turn', 4, 9);
      if (!my.cnt.manastire && my.army.length >= 6 && my.cnt.fierarie && G.canAfford(P, G.BLDS.manastire.cost, R)) placeBuild('manastire', 5, 11);
    }
    if (P.age >= 2) {
      if ((my.cnt.cazarma || 0) < 2 && G.canAfford(P, G.BLDS.cazarma.cost, R)) placeBuild('cazarma', 6, 14);
      else if ((my.cnt.grajd || 0) < 2 && my.vils.length >= 26 && G.canAfford(P, G.BLDS.grajd.cost, R)) placeBuild('grajd', 6, 14);
    }
  }

  // ---------- oaste ----------
  function military() {
    var R = reserve();
    var enemy = { cav: 0, inf: 0, arc: 0 };
    C.units.forEach(function (u) { if (u.o !== pid && !u.dead) { var c = G.UNITS[u.t].cls; if (enemy[c] !== undefined) enemy[c]++; } });
    var siege = my.army.filter(function (u) { return G.UNITS[u.t].cls === 'sie'; }).length;
    my.blds.forEach(function (b) {
      if (!b.built || b.q.length >= 2 || b.t === 'cetate') return;
      var list = G.trainList(b).filter(function (t) { return G.UNITS[t].age <= P.age; });
      if (!list.length) return;
      var t = chooseUnit(b, list, enemy, siege);
      if (t && P.pop + 1 < P.cap && G.canAfford(P, G.UNITS[t].cost, R)) { if (!G.cmdTrain(b, t) && G.UNITS[t].cls === 'sie') siege++; }
    });
    if (!C.hero[pid] && P.age >= 1 && tc.q.length === 0 && !G.queued(pid, 'hero', false) && G.canAfford(P, G.UNITS.hero.cost, R)) G.cmdTrain(tc, 'hero');
    techs(R);
    var h = my.hero;
    if (h && h.hp < G.UNITS.hero.hp * 0.35 && G.dist(h, tc) > 6) { h.wave = 0; G.cmdMove([h], tc.x + 3, tc.y + 3); }
    defend();
    attack();
  }
  function chooseUnit(b, list, enemy, siege) {
    if (b.t === 'cazarma') {
      var sie = list.filter(function (t) { return G.UNITS[t].cls === 'sie'; })[0];
      if (sie && siege < 3 && Math.random() < 0.35) return sie;
      if (list.indexOf('spr') >= 0 && (enemy.cav > enemy.inf * 0.7 ? Math.random() < 0.7 : Math.random() < 0.3)) return 'spr';
      return 'mil';
    }
    if (b.t === 'grajd') return list.indexOf('kni') >= 0 && G.canAfford(P, G.UNITS.kni.cost) ? 'kni' : 'lcv';
    return list[0];
  }
  function techs(R) {
    function tryT(bt, id) {
      var b = my.blds.find(function (x) { return x.t === bt && x.built; });
      if (b && b.q.length === 0 && !G.techError(b, id) && G.canAfford(P, G.TECHS[id].cost, R)) G.cmdTech(b, id);
    }
    if (my.gat.w >= 5) tryT('joagar', 'topor');
    if (my.gat.g + my.gat.s >= 3) tryT('mina', 'tarnacop');
    if ((my.built.ogor || 0) >= 3) tryT('moara', 'jug');
    if (P.age >= 1 && my.vils.length >= 18) tryT('cetate', 'roaba');
    if (P.age >= 1 && my.army.length >= 5) { tryT('fierarie', 'sabii'); tryT('fierarie', 'zale'); tryT('fierarie', 'sageti'); }
  }
  function defend() {
    var threat = null, td = 1e9;
    C.units.forEach(function (e) {
      if (e.dead || e.o === pid) return;
      var d = G.dist(e, tc);
      if (d < 16 && d < td) { td = d; threat = e; }
    });
    if (!threat) my.blds.forEach(function (b) {
      if (threat || !b.hit || S.t - b.hit > 3) return;
      C.units.forEach(function (e) {
        if (e.dead || e.o === pid) return;
        var d = G.dist(e, b);
        if (d < 9 && d < td) { td = d; threat = e; }
      });
    });
    A.threat = threat ? threat.id : 0;
    if (!threat) return;
    my.army.forEach(function (u) {
      if (u.wave && G.dist(u, tc) > 25) return;
      if (u.task && u.task.k === 'atk') return;
      if (G.UNITS[u.t].onlyBld) return;
      u.wave = 0;
      G.cmdAttack([u], threat);
    });
  }
  function enemyTarget(from) {
    var best = null, bd = 1e9;
    C.blds.forEach(function (b) {
      if (b.dead || b.o === pid || G.BLDS[b.t].farm) return;
      var d = G.dist(b, from);
      if (d < bd) { bd = d; best = b; }
    });
    return best;
  }
  function attack() {
    if (S.t >= A.next && !A.threat) {
      var free = my.army.filter(function (u) { return !u.wave && !(u.task && u.task.k === 'atk') && u.hp > G.UNITS[u.t].hp * 0.5; });
      var need = Math.min(28, D.wave0 + D.waveAdd * A.wave);
      if (free.length >= need) {
        var tgt = enemyTarget(tc);
        if (tgt) {
          A.wave++;
          free.forEach(function (u) { u.wave = A.wave; });
          G.cmdMove(free, tgt.x, tgt.y, true);
          if (pid === 1) { G.msg('Iscoadele aduc vești: oastea otomană vine spre tine!', 'alert'); G.sfx('horn'); }
        }
        A.next = S.t + D.every;
      } else A.next = S.t + 20;
    }
    my.army.forEach(function (u) {
      if (!u.wave || u.task) return;
      var tgt = enemyTarget(u);
      if (tgt) G.cmdMove([u], tgt.x, tgt.y, true); else u.wave = 0;
    });
  }
})();
