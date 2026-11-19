// Motorul misiunilor: obiective, dialoguri, declanșatori, valuri de atacatori, efecte.
// O misiune e în G.MISSIONS[id]; starea ei (ce s-a întâmplat deja) stă în S.scen, ca să se poată salva.
var G = globalThis.G || (globalThis.G = {});
G.MISSIONS = G.MISSIONS || {};

(function () {
  'use strict';
  var T = G.Trig = {};
  function S() { return G.S; }
  function M() { var s = S(); return s && s.scen ? G.MISSIONS[s.scen.id] : null; }
  T.mission = M;

  // vorbitorii: numele și portretul (iconița unei unități)
  var WHO = {
    narator: { name: 'Cronicarul', icon: ['u', 'mon', 'mol'] },
    stefan: { name: 'Ștefan cel Mare', icon: ['u', 'hero', 'mol'] },
    vlad: { name: 'Vlad Țepeș', icon: ['u', 'hero', 'val'] },
    iancu: { name: 'Iancu de Hunedoara', icon: ['u', 'hero', 'ung'] },
    matia: { name: 'Matia Corvin', icon: ['u', 'hero', 'ung'] },
    albert: { name: 'Ioan Albert', icon: ['u', 'hero', 'pol'] },
    jagiello: { name: 'Vladislav Jagiello', icon: ['u', 'hero', 'pol'] },
    mehmed: { name: 'Mehmed al II-lea', icon: ['u', 'hero', 'oto'] },
    soliman: { name: 'Soliman Pașa', icon: ['u', 'hero', 'oto'] },
    mengli: { name: 'Mengli Giray', icon: ['u', 'hero', 'tat'] },
    mama: { name: 'Mama lui Ștefan', icon: ['u', 'vil', 'mol'], fem: 1 },
    capitan: { name: 'Căpitanul muntean', icon: ['u', 'mil', 'val'] },
    iscoada: { name: 'Iscoada', icon: ['u', 'lcv', 'mol'] },
    parcalab: { name: 'Pârcălabul', icon: ['u', 'mil', 'mol'] },
    boier: { name: 'Boierul', icon: ['u', 'kni', 'mol'] },
    taran: { name: 'Un țăran', icon: ['u', 'vil', 'mol'] },
    petru: { name: 'Petru Aron', icon: ['u', 'kni', 'mol'] },
    capistrano: { name: 'Ioan de Capistrano', icon: ['u', 'mon', 'ung'] },
    constantin: { name: 'Constantin al XI-lea', icon: ['u', 'hero', 'mol'] },
    orban: { name: 'Meșterul Orban', icon: ['u', 'vil', 'ung'] },
    ienicer: { name: 'Agă de ieniceri', icon: ['u', 'ien', 'oto'] },
    vitold: { name: 'Vitold', icon: ['u', 'kni', 'pol'] },
    bei: { name: 'Beiul', icon: ['u', 'nog', 'tat'] },
    mircea: { name: 'Mircea cel Bătrân', icon: ['u', 'hero', 'mircea'] },
    mihai: { name: 'Mihai Viteazul', icon: ['u', 'hero', 'mihai'] },
    baiazid: { name: 'Baiazid Fulgerul', icon: ['u', 'hero', 'oto'] },
    marko: { name: 'Craiul Marko', icon: ['u', 'kni2', 'val'] },
    nevers: { name: 'Ioan de Nevers', icon: ['u', 'kni3', 'pol'] },
    sigismund: { name: 'Sigismund de Luxemburg', icon: ['u', 'kni3', 'ung'] },
    sinan: { name: 'Sinan Pașa', icon: ['u', 'hero', 'oto'] },
    buzescu: { name: 'Radu Buzescu', icon: ['u', 'kni2', 'val'] },
    sigismund_b: { name: 'Sigismund Báthory', icon: ['u', 'kni2', 'ung'] },
    razvan: { name: 'Ștefan Răzvan', icon: ['u', 'kni', 'mol'] },
    andrei: { name: 'Andrei Báthory', icon: ['u', 'hero', 'ung'] },
    secui: { name: 'Căpitanul secuilor', icon: ['u', 'lcv2', 'ung'] },
    ieremia: { name: 'Ieremia Movilă', icon: ['u', 'kni2', 'mol'] },
    plauen: { name: 'Heinrich von Plauen', icon: ['u', 'kni3', 'ung'] },
    ahmed: { name: 'Șeih Ahmed', icon: ['u', 'hero', 'tat'] }
  };
  T.WHO = WHO;

  // ---------- pornirea unei misiuni ----------
  T.options = function (id, diff) {
    var m = G.MISSIONS[id];
    var players = m.players.map(function (p, i) { return Object.assign({ ai: i !== 0 }, p); });
    return {
      diff: diff || 'normal', seed: m.seed || 1000 + id.length * 77, players: players, mapSpec: m.map, noBases: true, victory: 'scenariu',
      popMax: m.popMax || 120, startAge: m.startAge || 0, maxAge: m.maxAge, noBuild: m.noBuild, noUnits: m.noUnits, reveal: m.reveal || 'normal',
      scen: { id: id, title: m.title, obj: [], fired: {}, vars: {}, marks: [], done: 0 },
      setup: function (S, gm) { if (m.setup) m.setup(S, T); }
    };
  };
  T.begin = function (id) {
    var m = G.MISSIONS[id], S = G.S;
    if (m.night) S.night = m.night;
    if (m.fog) { S.fog = m.fog; }
    if (m.losMul) S.losMul = m.losMul;
    if (m.noHero) S.opt.noHero = true;
    S.players.forEach(function (P, i) { var p = m.players[i]; if (p.res) G.RES.forEach(function (r) { if (p.res[r] !== undefined) P.res[r] = p.res[r]; }); if (p.techs) p.techs.forEach(function (t) { G.finishTech(i, t); }); });
    G.msgQ.length = 0; if (G.UI && G.UI.reset) G.UI.reset();
    // oastea dată la început nu are case: îi lăsăm loc, plus câteva locuri libere
    G.refreshLists();
    S.players.forEach(function (P) { var built = 0; G.C.blds.forEach(function (b) { if (b.o === P.id && b.built) built += G.BLDS[b.t].pop || 0; }); P.capBonus = Math.max(0, P.pop - built) + (P.id === 0 ? 8 : 20); });
    if (m.start) m.start(S, T);
    G.refreshLists(); G.updFog();
  };
  T.start = function (id, diff) {
    G.startGame(T.options(id, diff));
    T.begin(id);
    var hero = G.heroOf(0) || G.C.blds.find(function (b) { return b.o === 0; }) || G.C.units.find(function (u) { return u.o === 0; });
    if (hero) G.R.center(hero.x, hero.y);
  };

  // ---------- fiecare sfert de secundă ----------
  T.tick = function () {
    var s = S(), m = M();
    if (!s || !m || s.over) return;
    var sc = s.scen;
    resend(s);
    (m.triggers || []).forEach(function (tr, i) {
      var id = tr.id || ('t' + i);
      if (tr.once !== false && sc.fired[id]) return;
      if (tr.after && !sc.fired[tr.after]) return;
      if (tr.at !== undefined && s.t < tr.at) return;
      var ok = true;
      try { ok = tr.when ? tr.when(s, T) : true; } catch (e) { ok = false; if (!T._err) { T._err = 1; console.error('declanșator', id, e); } }
      if (!ok) return;
      sc.fired[id] = s.t;
      try { tr.do(s, T); } catch (e) { console.error('acțiune', id, e); }
    });
    // eroul tău trebuie să trăiască (dacă misiunea o cere)
    if (m.keepHero && sc.heroSeen && !G.C.hero[0] && !s.over) T.lose(typeof m.keepHero === 'string' ? m.keepHero : G.heroName(0) + ' a căzut.');
    if (G.C.hero[0]) sc.heroSeen = 1;
    if (m.tick) m.tick(s, T);
  };

  // ---------- obiective ----------
  T.obj = function (id, text, opt) {
    var sc = S().scen, o = sc.obj.find(function (x) { return x.id === id; });
    if (!o) { o = { id: id, text: text, st: 0, sec: !!(opt && opt.sec) }; sc.obj.push(o); if (!(opt && opt.quiet)) G.msg('Obiectiv nou: ' + text, 'obj'); G.sfx('obj'); }
    else if (text) o.text = text;
    if (G.UI && G.UI.forceRefresh) G.UI.forceRefresh();
    return o;
  };
  T.done = function (id) {
    var o = S().scen.obj.find(function (x) { return x.id === id; });
    if (!o || o.st) return;
    o.st = 1; G.msg('✔ ' + o.text, 'good'); G.sfx('built');
  };
  T.fail = function (id) { var o = S().scen.obj.find(function (x) { return x.id === id; }); if (o && !o.st) { o.st = 2; G.msg('✖ ' + o.text, 'alert'); } };
  T.isDone = function (id) { var o = S().scen.obj.find(function (x) { return x.id === id; }); return !!(o && o.st === 1); };

  // ---------- dialoguri ----------
  // T.say('stefan', 'text', 'cheie-voce'); se arată pe rând, fiecare cu portretul și vocea lui
  T.say = function (who, text, key, delay) {
    var s = S(); s.scen.says = s.scen.says || [];
    s.scen.says.push({ who: who, text: text, key: key || null, at: Math.max(s.t + (delay || 0), s.scen.lastSay || 0) });
    s.scen.lastSay = Math.max(s.t + (delay || 0), s.scen.lastSay || 0) + Math.max(3.2, text.length / 15);
  };
  T.pendingSays = function () {
    var s = S(); if (!s || !s.scen || !s.scen.says) return [];
    var out = []; s.scen.says = s.scen.says.filter(function (x) { if (x.at <= s.t) { out.push(x); return false; } return true; });
    return out;
  };

  // ---------- etichete pe entități ----------
  T.tag = function (e, tag) { if (e) e.tag = tag; return e; };
  T.byTag = function (tag) { return S().ents.filter(function (e) { return !e.dead && e.tag === tag; }); };
  T.alive = function (tag) { return T.byTag(tag).length; };
  T.get = function (tag) { return T.byTag(tag)[0] || null; };

  // ---------- numărări și zone ----------
  T.units = function (o, f) { return G.C.units.filter(function (u) { return u.o === o && !u.dead && (!f || f(u)); }); };
  T.army = function (o) { return T.units(o, function (u) { return G.isMil(u) && !G.UNITS[u.t].hero; }); };
  T.count = function (o, t) { return S().ents.filter(function (e) { return !e.dead && e.o === o && (e.t === t || (e.k === 'u' && G.lineBase(e.t) === t)) && (e.k !== 'b' || e.built); }).length; };
  T.inArea = function (o, x, y, r, f) {
    var n = 0, list = [];
    G.C.units.forEach(function (u) { if ((o === -1 || u.o === o) && !u.dead && G.hyp(u.x - x, u.y - y) <= r && (!f || f(u))) { n++; list.push(u); } });
    return list;
  };
  T.heroIn = function (o, x, y, r) { var h = G.heroOf(o); return !!(h && G.hyp(h.x - x, h.y - y) <= r); };

  // ---------- oaste nouă, atacuri ----------
  // comp: [['mil', 5], ['arc', 3]]; tipurile de bază se transformă în treapta jucătorului
  T.spawn = function (o, comp, x, y, tag) {
    var out = [], s = S(), mul = G.enemy(0, o) ? ({ usor: 0.7, normal: 1, greu: 1.25, foarte: 1.5 }[s.diff] || 1) : 1;
    comp.forEach(function (c) {
      if (mul !== 1 && c[1] > 1 && c[0] !== 'vil') c = [c[0], Math.max(1, Math.round(c[1] * mul))];
      var d0 = G.UNITS[c[0]], t = d0.line && G.LINES[d0.line][0] === c[0] ? G.curType(o, c[0]) : c[0];
      G.placeUnits(o, t, c[1], x, y).forEach(function (u) { if (tag) u.tag = tag; out.push(u); });
    });
    G.refreshLists();
    return out;
  };
  // oamenii trimiși de misiune își țin minte ținta: dacă rămân fără ordin înainte s-o atingă (o înghesuială le-a anulat
  // drumul, de exemplu), îl primesc din nou (vezi T.tick). Altfel un val pornit dintr-o tabără strâmtă rămânea pe loc.
  T.attackMove = function (units, x, y) { G.cmdMove(units.filter(function (u) { return !u.dead; }), x, y, true); units.forEach(function (u) { u.wave = 99; u.sx = x; u.sy = y; u.sa = 1; }); };
  T.moveTo = function (units, x, y) { G.cmdMove(units.filter(function (u) { return !u.dead; }), x, y, false); units.forEach(function (u) { u.sx = x; u.sy = y; u.sa = 0; }); };
  function resend(s) {
    if ((s.vars._rs = (s.vars._rs || 0) - 0.25) > 0) return;
    s.vars._rs = 2;
    G.C.units.forEach(function (u) {
      if (u.dead || u.gin || u.task || u.o === 0 || u.sx === undefined) return;
      if (G.hyp(u.x - u.sx, u.y - u.sy) > 3) G.cmdMove([u], u.sx, u.sy, !!u.sa); else u.sx = undefined;
    });
  }
  T.wave = function (o, comp, from, to, tag) { var u = T.spawn(o, comp, from[0], from[1], tag); T.attackMove(u, to[0], to[1]); return u; };
  T.aiGo = function (o) { if (G.aiAttackNow) G.aiAttackNow(o); };
  T.mode = function (o, mode) { S().players[o].aiMode = mode; };
  T.give = function (o, res) { var P = S().players[o]; for (var k in res) P.res[k] += res[k]; };
  T.debuff = function (o, a, secs) { var until = S().t + secs; G.C.units.forEach(function (u) { if (u.o === o) u.deb = { a: a, until: until }; }); };
  T.buff = function (o, a, s, secs) { var until = S().t + secs; G.C.units.forEach(function (u) { if (u.o === o) u.buf = { a: a, s: s, until: until }; }); };
  T.vanish = function (units) { units.forEach(function (u) { if (!u.dead) { u.dead = 1; S().dirty = 1; if (G.C.hero[u.o] === u.id) G.C.hero[u.o] = 0; } }); };

  // ---------- clădiri ----------
  T.bld = function (o, t, x, y, built, tag) { var b = G.addBld(t, o, x, y, built !== false); if (tag) b.tag = tag; return b; };
  // un zid de la (x0,y0) la (x1,y1), cu porți la pozițiile date (indici în șir)
  T.wall = function (o, x0, y0, x1, y1, gates, kind) {
    var tiles = G.wallTiles(x0, y0, x1, y1), out = [];
    tiles.forEach(function (p, i) {
      var t = (gates && gates.indexOf(i) >= 0) ? (kind === 'pal' ? 'poartal' : 'poarta') : (kind === 'pal' ? 'palisada' : 'zid');
      var N = S().N, k = p[1] * N + p[0];
      if (p[0] < 0 || p[1] < 0 || p[0] >= N || p[1] >= N || G.C.occ[k] || !G.BUILD_T[S().ter[k]]) return;
      out.push(G.addBld(t, o, p[0], p[1], true));
    });
    return out;
  };

  // ---------- semne pe hartă, efecte ----------
  // steagul unui obiectiv: locul din jur se dezvăluie, ca să-l vezi de oriunde (se desenează peste ceață și pe harta mică)
  T.mark = function (id, x, y, label, col) { var sc = S().scen; sc.marks = sc.marks.filter(function (m) { return m.id !== id; }); sc.marks.push({ id: id, x: x, y: y, label: label || '', col: col || '#ffd75a' }); G.reveal(x, y, 3); };
  T.unmark = function (id) { var sc = S().scen; sc.marks = sc.marks.filter(function (m) { return m.id !== id; }); };
  T.reveal = function (x, y, r) { G.reveal(x, y, r); };
  T.night = function (v) { S().night = v; S().losMul = v ? Math.min(S().losMul || 1, 0.65) : 1; };
  T.fog = function (v) { S().fog = v; S().losMul = v ? 0.55 : 1; };
  T.light = function (x, y, r) { var s = S(); (s.lights || (s.lights = [])).push({ x: x, y: y, r: r || 3 }); };
  T.boom = function (x, y, s) { S().fx.push({ k: 'boom', x: x, y: y, t: S().t, s: s || 1.4 }); G.sfx('boom', x, y); };
  T.fire = function (x, y) { S().fx.push({ k: 'fire', x: x, y: y, t: S().t }); };
  T.camera = function (x, y) { G.R.center(x, y); };

  // ---------- pictorul de rezervă pentru hărțile misiunilor ----------
  if (!G.genMapSpec) G.genMapSpec = function (S, spec) {
    var N = S.N, ter = S.ter = new Uint8Array(N * N), R = G.rng(spec.seed || 7), objs = [], blk = new Uint8Array(N * N);
    S.decor = [];
    var g0 = spec.ground === 'dirt' ? 1 : 0; ter.fill(g0);
    var W = 2, F = 3, B = 4, D = 1, ROCK = G.T.ROCK !== undefined ? G.T.ROCK : 2, MARSH = G.T.MARSH !== undefined ? G.T.MARSH : 1, SAND = G.T.SAND !== undefined ? G.T.SAND : 1;
    function set(x, y, t) { if (x >= 0 && y >= 0 && x < N && y < N) ter[y * N + x] = t; }
    function line(pts, w, fn) {
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], L = G.hyp(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L * 2);
        for (var k = 0; k <= n; k++) {
          var x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n, r = w / 2;
          for (var yy = Math.floor(y - r - 1); yy <= Math.ceil(y + r + 1); yy++) for (var xx = Math.floor(x - r - 1); xx <= Math.ceil(x + r + 1); xx++)
            if (G.hyp(xx + 0.5 - x, yy + 0.5 - y) <= r) fn(xx, yy);
        }
      }
    }
    function inPoly(x, y, P) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; }
    function free(x, y) { return x >= 0 && y >= 0 && x < N && y < N && !blk[y * N + x] && G.BUILD_T[ter[y * N + x]]; }
    function put(t, x, y) { if (!free(x, y)) return; blk[y * N + x] = 1; objs.push({ t: t, x: x, y: y }); }
    (spec.ops || []).forEach(function (op) {
      var k = op[0];
      if (k === 'river') { line(op[1], op[2], function (x, y) { set(x, y, W); }); var o = op[3] || {}; (o.fords || []).forEach(function (f) { line([f, f], op[2] + 2, function (x, y) { if (ter[y * N + x] === W) set(x, y, F); }); }); (o.bridges || []).forEach(function (f) { line([f, f], op[2] + 1.6, function (x, y) { if (ter[y * N + x] === W) set(x, y, B); }); }); }
      else if (k === 'lake' || k === 'marsh') { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var dx = (x + 0.5 - op[1]) / op[3], dy = (y + 0.5 - op[2]) / op[4]; if (dx * dx + dy * dy <= 1) set(x, y, k === 'lake' ? W : MARSH); } }
      else if (k === 'rock' || k === 'sand') { for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) if (inPoly(x2 + 0.5, y2 + 0.5, op[1])) set(x2, y2, k === 'rock' ? ROCK : SAND); }
      else if (k === 'road') line(op[1], op[2], function (x, y) { if (ter[y * N + x] !== W && ter[y * N + x] !== B && ter[y * N + x] !== F) set(x, y, D); });
    });
    (spec.ops || []).forEach(function (op) {
      var k = op[0];
      if (k === 'forest' || k === 'forestc') {
        var dens = (k === 'forest' ? op[2] : op[4]) || 0.6;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          var inside = k === 'forest' ? inPoly(x + 0.5, y + 0.5, op[1]) : G.hyp(x + 0.5 - op[1], y + 0.5 - op[2]) <= op[3];
          if (inside && ter[y * N + x] === g0 && R() < dens) put('tree', x, y);
        }
      } else if (k === 'res') { var n = op[4] || 1; for (var i = 0, tries = 0; i < n && tries < n * 30; tries++) { var a = R() * 6.28, r = Math.sqrt(R()) * (1 + n * 0.22); var xx = Math.round(op[2] + G.dcos(a) * r), yy = Math.round(op[3] + G.dsin(a) * r); if (free(xx, yy)) { put(op[1], xx, yy); i++; } } }
      else if (k === 'decor') S.decor.push({ k: op[1], x: op[2], y: op[3] });
    });
    (spec.ops || []).forEach(function (op) {
      if (op[0] !== 'clear') return;
      objs = objs.filter(function (o) { return G.hyp(o.x + 0.5 - op[1], o.y + 0.5 - op[2]) > op[3]; });
    });
    S.base = [];
    return { objs: objs };
  };

  // ---------- sfârșitul ----------
  T.win = function () { var s = S(); if (s.over) return; s.scen.done = 1; G.finishGame(1, s.players[0].team); };
  T.lose = function (why) { var s = S(); if (s.over) return; s.scen.why = why || ''; G.finishGame(2, 0); };
  T.timeLeft = function (key, secs) { var sc = S().scen; if (sc.vars[key] === undefined) sc.vars[key] = S().t + secs; return Math.max(0, sc.vars[key] - S().t); };
})();
