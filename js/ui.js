// Interfața: bara de sus, panoul de jos, butoanele, mesajele, meniurile.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var UI = G.UI = { sel: [], place: null, rallyMode: false };
  var $ = function (id) { return document.getElementById(id); };
  var els = {}, lastSig = '', cmdList = [], msgIdx = 0, idleIdx = 0, delArm = 0, delT = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Math.floor(n); }

  UI.init = function () {
    ['rf', 'rw', 'rg', 'rs', 'pop', 'age', 'clock', 'info', 'cmds', 'msgs', 'bIdle', 'bArmy', 'bHome', 'bSpeed', 'bSound', 'bMenu'].forEach(function (id) { els[id] = $(id); });
    els.cmds.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var c = cmdList[+b.dataset.i]; if (!c) return;
      if (!c.enabled) { if (c.err) G.msg(c.err, 'warn'); G.sfx('err'); return; }
      c.act(); lastSig = '';
    });
    var tip = $('tip');
    els.cmds.addEventListener('mouseover', function (ev) {
      var bt = ev.target.closest('button'); if (!bt || !tip) return;
      var c = cmdList[+bt.dataset.i]; if (!c) return;
      var hk = G.Input && G.Input.GRID[+bt.dataset.i] ? ' <kbd>' + G.Input.GRID[+bt.dataset.i].toUpperCase() + '</kbd>' : '';
      tip.innerHTML = '<b>' + esc(c.label) + '</b>' + hk + (c.cost ? '<div class="tc">' + costHTML(c.cost) + '</div>' : '') + (c.tip ? '<div>' + esc(c.tip) + '</div>' : '') + (!c.enabled && c.err ? '<div class="te">' + esc(c.err) + '</div>' : '');
      var r = bt.getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = Math.max(6, Math.min(window.innerWidth - tip.offsetWidth - 6, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px';
      tip.style.top = (r.top - tip.offsetHeight - 8) + 'px';
    });
    els.cmds.addEventListener('mouseout', function (ev) { if (tip && !ev.relatedTarget || (ev.relatedTarget && !ev.relatedTarget.closest('#cmds button'))) tip.style.display = 'none'; });
    els.info.addEventListener('pointerdown', function (ev) {
      var q = ev.target.closest('[data-q]'); if (!q) return;
      var b = UI.selOne(); if (!b || b.k !== 'b' || b.o !== 0) return;
      G.cmdCancel(b, +q.dataset.q); G.sfx('click'); lastSig = '';
    });
    els.msgs.addEventListener('click', function (ev) {
      var m = ev.target.closest('[data-x]'); if (!m) return;
      G.R.center(+m.dataset.x, +m.dataset.y);
    });
    els.bIdle.addEventListener('click', function () {
      var idle = idleVils();
      if (!idle.length) { G.msg('Toți țăranii au treabă.', 'info'); return; }
      idleIdx = (idleIdx + 1) % idle.length;
      var u = idle[idleIdx]; UI.select([u]); G.R.center(u.x, u.y);
    });
    els.bArmy.addEventListener('click', function () {
      var army = G.C.units.filter(function (u) { return u.o === 0 && !u.dead && u.t !== 'vil'; });
      if (!army.length) { G.msg('Nu ai oaste încă. Fă o cazarmă.', 'info'); return; }
      UI.select(army);
      if (army.length && UI.lastArmyTap && Date.now() - UI.lastArmyTap < 600) { var cx = 0, cy = 0; army.forEach(function (u) { cx += u.x; cy += u.y; }); G.R.center(cx / army.length, cy / army.length); }
      UI.lastArmyTap = Date.now();
    });
    els.bHome.addEventListener('click', function () {
      var tc = G.C.blds.find(function (b) { return b.o === 0 && b.t === 'cetate' && !b.dead; });
      if (tc) { UI.select([tc]); G.R.center(tc.x + 1, tc.y + 1); }
    });
    els.bSpeed.addEventListener('click', function () { if (G.speed >= 2) { G.speed = 1; UI.speed(0); } else UI.speed(1); });
    els.bSound.addEventListener('click', function () {
      G.Audio.toggle(); els.bSound.textContent = G.Audio.on ? '🔊' : '🔇';
    });
    els.bMenu.addEventListener('click', function () { G.pause(); });
    $('bZin').addEventListener('click', function () { G.Input.zoomBy(1.2); });
    $('bZout').addEventListener('click', function () { G.Input.zoomBy(1 / 1.2); });
    $('bFull').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {});
    });
    els.bSpeed.textContent = (G.speed === 1.5 ? '1,5' : G.speed) + '×';
    els.bSound.textContent = G.Audio && G.Audio.on ? '🔊' : '🔇';
  };

  // ---------- selecția ----------
  UI.selEnts = function () {
    var out = [];
    UI.sel = UI.sel.filter(function (id) { var e = G.getE(id); if (e) out.push(e); return !!e; });
    return out;
  };
  UI.selSet = function () { var s = {}; for (var i = 0; i < UI.sel.length; i++) s[UI.sel[i]] = 1; return s; };
  UI.selOne = function () { return UI.sel.length === 1 ? G.getE(UI.sel[0]) : null; };
  UI.select = function (ents) {
    UI.sel = ents.map(function (e) { return e.id; });
    UI.place = null; UI.rallyMode = false; lastSig = ''; acc = 1;
    if (ents.length) G.sfx('select');
  };
  UI.reset = function () { UI.sel = []; UI.place = null; UI.rallyMode = false; lastSig = ''; msgIdx = G.msgQ.length; els.msgs.innerHTML = ''; };
  function idleVils() { return G.C.units.filter(function (u) { return u.o === 0 && !u.dead && u.t === 'vil' && !u.task; }); }
  function mark(x, y, c) { G.R.marks.push({ x: x, y: y, t: performanceClock(), c: c }); }
  function performanceClock() { return G.R.clock ? G.R.clock() : 0; }

  // ---------- ordinele date oamenilor aleși ----------
  var RED = 'rgba(255,80,60,0.95)', YEL = 'rgba(255,224,102,0.95)';
  function mineSel() { return UI.selEnts().filter(function (x) { return x.k === 'u' && x.o === 0; }); }
  function orderUnits(mine, w, e) {
    var vils = mine.filter(function (u) { return u.t === 'vil'; });
    if (!e) { G.cmdMove(mine, w[0], w[1]); mark(w[0], w[1]); G.voice && G.voice(mine, 'ack'); G.sfx('ack'); return; }
    if (e.o === 1) { G.cmdAttack(mine, e); mark(e.x, e.y, RED); G.voice && G.voice(mine, 'atk'); G.sfx('ack'); return; }
    if (e.k === 'r') { G.cmdGather(mine, e); mark(e.x, e.y, YEL); G.voice && G.voice(mine, 'ack'); G.sfx('ack'); return; }
    if (e.k === 'b' && e.o === 0) {
      var d = G.BLDS[e.t], rest = mine.filter(function (u) { return u.t !== 'vil'; });
      if (vils.length && (!e.built || e.hp < d.hp)) { G.cmdBuild(vils, e); if (rest.length) G.cmdMove(rest, e.x, e.ty + e.n + 0.6); mark(e.x, e.y, YEL); G.voice && G.voice(vils, 'build'); G.sfx('ack'); return; }
      if (vils.length && d.farm) { G.cmdGather(vils, e); mark(e.x, e.y, YEL); G.voice && G.voice(vils, 'ack'); G.sfx('ack'); return; }
      if (vils.length && d.drop && vils.some(function (u) { return u.carry && u.carry.n > 0; })) { G.cmdReturn(vils); G.voice && G.voice(vils, 'ack'); G.sfx('ack'); return; }
      G.cmdMove(mine, e.x, e.ty + e.n + 0.6); mark(e.x, e.ty + e.n + 0.6); G.voice && G.voice(mine, 'ack'); G.sfx('ack'); return;
    }
    G.cmdMove(mine, e.x, e.y); mark(e.x, e.y); G.voice && G.voice(mine, 'ack'); G.sfx('ack');
  }
  function setRally(b, w, e) {
    G.cmdRally(b, w[0], w[1], e && (e.k === 'r' || (e.k === 'b' && e.o === 0)) ? e.id : 0);
    mark(w[0], w[1], 'rgba(127,182,255,0.95)'); G.sfx('click'); lastSig = '';
  }

  // ---------- telefonul: o atingere alege sau dă ordinul ----------
  UI.tapWorld = function (sx, sy, dbl) {
    var S = G.S; if (!S || S.over) return;
    var w = G.R.s2w(sx, sy);
    if (UI.place) { setPlace(w); return; }
    var e = G.R.pick(sx, sy);
    if (UI.rallyMode) { var rb = UI.selOne(); if (rb && rb.k === 'b') setRally(rb, w, e); UI.rallyMode = false; lastSig = ''; return; }
    var mine = mineSel();
    if (dbl && e && e.k === 'u' && e.o === 0) { selectSame(e); return; }
    if (mine.length) {
      if (e && e.k === 'u' && e.o === 0) { UI.select([e]); return; }
      if (e && e.k === 'b' && e.o === 0) {
        var d = G.BLDS[e.t], vils = mine.filter(function (u) { return u.t === 'vil'; });
        var useful = vils.length && (!e.built || e.hp < d.hp || d.farm || (d.drop && vils.some(function (u) { return u.carry && u.carry.n > 0; })));
        if (!useful) { UI.select([e]); return; }
      }
      orderUnits(mine, w, e); return;
    }
    UI.select(e ? [e] : []);
  };

  // ---------- calculatorul: clic stânga alege, clic dreapta dă ordinul ----------
  UI.clickSelect = function (sx, sy, m) {
    if (!G.S || G.S.over) return;
    var w = G.R.s2w(sx, sy), e = G.R.pick(sx, sy);
    if (UI.rallyMode) { var rb = UI.selOne(); if (rb && rb.k === 'b') setRally(rb, w, e); UI.rallyMode = false; lastSig = ''; return; }
    if (m.dbl && e && e.k === 'u' && e.o === 0) { selectSame(e); return; }
    if (m.shift && e && e.k === 'u' && e.o === 0) {
      var mine = mineSel();
      if (!mine.length) { UI.select([e]); return; }
      var i = UI.sel.indexOf(e.id);
      if (i >= 0) UI.sel.splice(i, 1); else UI.sel.push(e.id);
      lastSig = ''; G.sfx('select');
      return;
    }
    UI.select(e ? [e] : []);
    if (e && e.k === 'u' && e.o === 0 && G.voice) G.voice([e], 'sel');
  };
  UI.commandAt = function (sx, sy) {
    if (!G.S || G.S.over) return;
    var w = G.R.s2w(sx, sy), e = G.R.pick(sx, sy), mine = mineSel();
    if (mine.length) { orderUnits(mine, w, e); return; }
    var b = UI.selOne();
    if (b && b.k === 'b' && b.o === 0 && b.built && G.BLDS[b.t].train) setRally(b, w, e);
  };
  UI.orderTo = function (x, y) { var mine = mineSel(); if (mine.length) { G.cmdMove(mine, x, y); G.sfx('ack'); } };
  function selectSame(e) {
    var W = G.R.W, H = G.R.H;
    var all = G.C.units.filter(function (u) {
      if (u.o !== 0 || u.dead || u.t !== e.t) return false;
      var p = G.R.w2s(u.x, u.y); return p[0] > 0 && p[0] < W && p[1] > 0 && p[1] < H;
    });
    UI.select(all);
    if (G.voice) G.voice(all, 'sel');
  }
  UI.boxSelect = function (x0, y0, x1, y1, add) {
    var a = Math.min(x0, x1), b = Math.max(x0, x1), c = Math.min(y0, y1), d = Math.max(y0, y1);
    var out = G.C.units.filter(function (u) {
      if (u.o !== 0 || u.dead) return false;
      var p = G.R.w2s(u.x, u.y), py = p[1] - 12 * G.cam.z;
      return p[0] >= a - 5 && p[0] <= b + 5 && py >= c - 12 && py <= d + 12;
    });
    if (add) { var cur = mineSel(); out.forEach(function (u) { if (cur.indexOf(u) < 0) cur.push(u); }); out = cur; }
    if (out.length) { UI.select(out); if (G.voice) G.voice(out, 'sel'); }
    else if (!add) UI.select([]);
  };

  // ---------- mouse-ul deasupra hărții ----------
  var CURS = {};
  function cursor(kind) {
    if (CURS[kind] !== undefined) return CURS[kind];
    var em = { atk: '⚔️', tree: '🪓', gold: '⛏️', stone: '⛏️', berry: '🧺', sheep: '🧺', farm: '🌾', build: '🔨', rally: '🚩' }[kind];
    if (!em) return CURS[kind] = 'default';
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var g = c.getContext('2d'); g.font = '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textBaseline = 'top';
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 3; g.fillText(em, 2, 3);
    return CURS[kind] = 'url(' + c.toDataURL() + ') 6 6, pointer';
  }
  UI.hover = 0;
  UI.hoverAt = function (sx, sy) {
    if (!G.S) return;
    var cv = document.getElementById('cv');
    if (UI.place) { cv.style.cursor = 'crosshair'; return; }
    var e = G.R.pick(sx, sy), kind = 'default';
    UI.hover = e ? e.id : 0;
    var mine = mineSel(), hasVil = mine.some(function (u) { return u.t === 'vil'; });
    if (mine.length && e) {
      if (e.o === 1) kind = 'atk';
      else if (e.k === 'r' && hasVil) kind = e.t;
      else if (e.k === 'b' && e.o === 0 && hasVil && (!e.built || e.hp < G.BLDS[e.t].hp)) kind = 'build';
      else if (e.k === 'b' && e.o === 0 && hasVil && G.BLDS[e.t].farm) kind = 'farm';
    } else if (!mine.length && UI.selOne() && UI.selOne().k === 'b' && UI.selOne().o === 0 && G.BLDS[UI.selOne().t].train && !e) kind = 'rally';
    cv.style.cursor = e && kind === 'default' ? 'pointer' : cursor(kind);
  };

  // ---------- comenzi rapide ----------
  UI.groups = {};
  var grpTap = {};
  UI.setGroup = function (n) {
    var ents = UI.selEnts().filter(function (e) { return e.o === 0; });
    if (!ents.length) return;
    UI.groups[n] = ents.map(function (e) { return e.id; });
    G.msg('Grupul ' + n + ': ' + ents.length + (ents.length === 1 ? ' ales.' : ' aleși.'), 'info');
  };
  UI.getGroup = function (n) {
    var ids = (UI.groups[n] || []).filter(function (id) { return G.getE(id); });
    UI.groups[n] = ids;
    if (!ids.length) return;
    var ents = ids.map(G.getE);
    UI.select(ents);
    if (grpTap[n] && Date.now() - grpTap[n] < 450) { var cx = 0, cy = 0; ents.forEach(function (e) { cx += e.x; cy += e.y; }); G.R.center(cx / ents.length, cy / ents.length); }
    grpTap[n] = Date.now();
  };
  var homeTap = 0;
  UI.goHome = function () {
    var tc = G.C.blds.find(function (b) { return b.o === 0 && b.t === 'cetate' && !b.dead; });
    if (!tc) return;
    UI.select([tc]);
    if (Date.now() - homeTap < 600) G.R.center(tc.x + 1, tc.y + 1);
    homeTap = Date.now();
  };
  UI.nextIdle = function (mil) {
    var list = G.C.units.filter(function (u) { return u.o === 0 && !u.dead && !u.task && (mil ? u.t !== 'vil' : u.t === 'vil'); });
    if (!list.length) { G.msg(mil ? 'Toată oastea are treabă.' : 'Toți țăranii au treabă.', 'info'); return; }
    idleIdx = (idleIdx + 1) % list.length;
    var u = list[idleIdx]; UI.select([u]); G.R.center(u.x, u.y);
  };
  UI.alertPos = null;
  UI.lastAlert = function () { if (UI.alertPos) G.R.center(UI.alertPos.x, UI.alertPos.y); };
  UI.deleteSel = function () {
    var one = UI.selOne();
    if (!one || one.o !== 0) return;
    if (one.k === 'u') { G.cmdDelete(one); UI.select([]); }
    else if (one.t !== 'cetate') confirmDel(one);
  };
  UI.speed = function (dir) {
    var sp = [1, 1.5, 2], i = sp.indexOf(G.speed);
    i = Math.max(0, Math.min(sp.length - 1, (i < 0 ? 0 : i) + dir));
    G.speed = sp[i]; els.bSpeed.textContent = (G.speed === 1.5 ? '1,5' : G.speed) + '×';
    try { localStorage.setItem('scm_speed', G.speed); } catch (e) {}
  };
  UI.hotkey = function (i) {
    cmdList = commandsFor(UI.selEnts());
    var c = cmdList[i]; if (!c || c.id === 'del') return;
    if (!c.enabled) { if (c.err) G.msg(c.err, 'warn'); G.sfx('err'); return; }
    c.act(); lastSig = '';
  };
  UI.escape = function () {
    if (UI.place) { UI.cancelPlace(); return; }
    if (UI.rallyMode) { UI.rallyMode = false; lastSig = ''; return; }
    UI.select([]);
  };

  // ---------- construire ----------
  UI.startPlace = function (t) {
    var err = G.placeError(0, t);
    if (err) { G.msg(err, 'warn'); G.sfx('err'); return; }
    UI.place = { t: t };
    var vils = UI.selEnts().filter(function (u) { return u.t === 'vil'; });
    var w = G.R.s2w(G.R.W / 2, G.R.H * 0.42);
    if (G.Input && G.Input.mouse) w = G.R.s2w(G.Input.mouse.x, G.Input.mouse.y);
    else if (vils.length) {
      var p = G.R.w2s(vils[0].x, vils[0].y);
      if (p[0] > 60 && p[0] < G.R.W - 60 && p[1] > 60 && p[1] < G.R.H - 120) w = [vils[0].x + 1.5, vils[0].y + 1.5];
    }
    setPlace(w);
    lastSig = '';
    G.msg(document.body.classList.contains('desk') ? 'Clic stânga pune ' + G.nm(G.BLDS[t], 'mol') + ' (Shift: mai pune una). Clic dreapta renunță.' : 'Atinge harta unde vrei ' + G.nm(G.BLDS[t], 'mol') + ', apoi apasă ✔.', 'info');
  };
  function setPlace(w) {
    var n = G.BLDS[UI.place.t].n;
    UI.place.tx = Math.round(w[0] - n / 2); UI.place.ty = Math.round(w[1] - n / 2);
  }
  UI.confirmPlace = function () {
    var pl = UI.place; if (!pl) return;
    var vils = UI.selEnts().filter(function (u) { return u.k === 'u' && u.o === 0 && u.t === 'vil'; });
    var err = G.placeError(0, pl.t);
    if (err) { G.msg(err, 'warn'); G.sfx('err'); return; }
    if (!G.canPlace(0, pl.t, pl.tx, pl.ty)) { G.msg('Nu se poate construi aici. Alege alt loc.', 'warn'); G.sfx('err'); return; }
    var b = G.cmdPlace(0, pl.t, pl.tx, pl.ty, vils);
    if (b) { G.sfx('place'); if (G.voice) G.voice(vils, 'build'); UI.place = null; lastSig = ''; }
  };
  UI.cancelPlace = function () { UI.place = null; lastSig = ''; };
  UI.placeHover = function (sx, sy) { if (UI.place) setPlace(G.R.s2w(sx, sy)); };
  UI.placeAt = function (sx, sy, keep) {
    if (!UI.place) return;
    var t = UI.place.t;
    setPlace(G.R.s2w(sx, sy));
    UI.confirmPlace();
    if (!UI.place && keep && !G.placeError(0, t)) { UI.place = { t: t }; setPlace(G.R.s2w(sx, sy)); lastSig = ''; }
  };

  function confirmDel(e) {
    if (delArm === e.id && Date.now() - delT < 2500) { G.cmdDelete(e); UI.select([]); delArm = 0; return; }
    delArm = e.id; delT = Date.now();
    G.msg(e.k === 'b' ? 'Mai apasă o dată ca să dărâmi.' : 'Mai apasă o dată ca să renunți la el.', 'warn');
  }

  // ---------- butoanele ----------
  function lockName(age) { return ['', 'Feudală', 'Castele'][age] || ''; }
  function commandsFor(ents) {
    var S = G.S, P = S.players[0], out = [];
    if (UI.place) return [
      { id: 'pok', icon: '✔', label: 'Construiește', enabled: true, cls: 'ok', act: UI.confirmPlace },
      { id: 'pno', icon: '✖', label: 'Renunță', enabled: true, cls: 'no', act: UI.cancelPlace }
    ];
    var own = ents.filter(function (e) { return e.o === 0 && e.k !== 'r'; });
    if (!own.length) return out;
    var units = own.filter(function (e) { return e.k === 'u'; });
    if (units.length) {
      var vils = units.filter(function (u) { return u.t === 'vil'; });
      if (vils.length) G.BUILD_LIST.forEach(function (t) {
        var d = G.BLDS[t], locked = d.age > P.age, err = G.placeError(0, t);
        out.push({ id: 'b_' + t, img: G.R.icon('b', t, 'mol'), label: G.nm(d, 'mol'), cost: d.cost, enabled: !err, locked: locked, lockTxt: lockName(d.age), err: err,
          tip: d.desc, act: function () { UI.startPlace(t); } });
      });
      out.push({ id: 'stop', icon: '✋', label: 'Stai', enabled: true, act: function () { G.cmdStop(units); } });
      if (units.length === 1) out.push({ id: 'del', icon: '🗑️', label: 'Renunță', enabled: true, act: function () { confirmDel(units[0]); } });
      return out;
    }
    var b = own[0];
    if (b.k !== 'b') return out;
    if (!b.built) { out.push({ id: 'del', icon: '🗑️', label: 'Anulează', enabled: true, act: function () { G.cmdDelete(b); UI.select([]); } }); return out; }
    G.trainList(b).forEach(function (t) {
      var d = G.UNITS[t], locked = d.age > P.age;
      if (d.hero && (G.C.hero[0] || G.queued(0, t, false))) return;
      var err = G.trainError(b, t);
      out.push({ id: 'u_' + t, img: G.R.icon('u', t, 'mol'), label: G.nm(d, 'mol'), cost: d.cost, enabled: !err, locked: locked, lockTxt: lockName(d.age), err: err,
        tip: d.desc, act: function () { var e2 = G.cmdTrain(b, t); if (e2) { G.msg(e2, 'warn'); G.sfx('err'); } else G.sfx('click'); } });
    });
    G.techList(b).forEach(function (id) {
      var T = G.TECHS[id];
      if (G.queued(0, id, true)) return;
      var err = G.techError(b, id), locked = T.age > P.age;
      out.push({ id: 't_' + id, icon: T.icon, label: T.name, cost: T.cost, enabled: !err, locked: locked, lockTxt: lockName(T.age), err: err, tip: T.desc, cls: T.ageUp ? 'age' : '',
        act: function () { var e2 = G.cmdTech(b, id); if (e2) { G.msg(e2, 'warn'); G.sfx('err'); } else G.sfx('click'); } });
    });
    if (G.BLDS[b.t].train) out.push({ id: 'rally', icon: '🚩', label: 'Adunare', enabled: true, act: function () { UI.rallyMode = true; G.msg('Atinge harta: acolo vor merge oamenii noi.', 'info'); } });
    if (b.t !== 'cetate') out.push({ id: 'del', icon: '🗑️', label: 'Dărâmă', enabled: true, act: function () { confirmDel(b); } });
    return out;
  }
  function costHTML(cost) {
    if (!cost) return '';
    return Object.keys(cost).map(function (k) { return '<i>' + cost[k] + G.RES_ICON[k] + '</i>'; }).join('');
  }
  function btnHTML(c, i) {
    var ic = c.img ? '<img src="' + c.img + '" alt="">' : '<span class="em">' + c.icon + '</span>';
    var sub = c.locked ? '<u>🔒 ' + esc(c.lockTxt) + '</u>' : '<s>' + costHTML(c.cost) + '</s>';
    var hk = G.Input && G.Input.GRID[i] && c.id !== 'del' ? '<em class="hk">' + G.Input.GRID[i].toUpperCase() + '</em>' : (c.id === 'del' ? '<em class="hk">Del</em>' : '');
    return '<button class="cb' + (c.enabled ? '' : ' dis') + (c.locked ? ' lock' : '') + (c.cls ? ' ' + c.cls : '') + '" data-i="' + i + '" aria-label="' + esc(c.label) + '">' +
      hk + ic + '<b>' + esc(c.label) + '</b>' + sub + '</button>';
  }

  // ---------- panoul de informații ----------
  var GAT = { tree: 'Taie lemne', gold: 'Scoate aur', stone: 'Scoate piatră', berry: 'Culege mure', sheep: 'Ciobănește', farm: 'Lucrează ogorul' };
  function unitStatus(u) {
    var T = u.task;
    if (!T) return u.t === 'vil' ? 'Fără treabă' : 'Stă de pază';
    switch (T.k) {
      case 'move': return 'Merge';
      case 'amove': return 'Pornit la luptă';
      case 'atk': return 'Luptă';
      case 'bld': var b = G.getE(T.id); return b && b.built ? 'Repară' : 'Construiește';
      case 'gat': return GAT[T.kind] || 'Strânge';
      case 'ret': return 'Duce ' + G.RES_NAME[u.carry ? u.carry.r : 'f'].toLowerCase() + ' acasă';
    }
    return '';
  }
  function hpHTML(e) {
    var mx = G.def(e).hp, f = Math.max(0, Math.min(1, e.hp / mx));
    var col = f > 0.6 ? '#4cd964' : f > 0.3 ? '#f5c542' : '#ff4b3e';
    return '<div class="hp"><div style="width:' + (f * 100).toFixed(0) + '%;background:' + col + '"></div><span>' + Math.ceil(e.hp) + ' / ' + mx + '</span></div>';
  }
  function infoHTML(ents) {
    var S = G.S, P = S.players[0];
    if (UI.place) {
      var dp = G.BLDS[UI.place.t];
      return '<div class="nm">' + esc(G.nm(dp, 'mol')) + '</div><div class="st">Atinge harta ca să alegi locul, apoi apasă ✔.</div><div class="st dim">' + esc(dp.desc || '') + '</div>';
    }
    if (!ents.length) return '<div class="hint">' + esc(hint()) + '</div>';
    if (ents.length > 1) {
      var cnt = {}, order = [];
      ents.forEach(function (e) { var k = e.k + e.t + e.o; if (!cnt[k]) { cnt[k] = { e: e, n: 0 }; order.push(k); } cnt[k].n++; });
      return '<div class="nm">' + ents.length + ' aleși</div><div class="grp">' + order.map(function (k) {
        var c = cnt[k], civ = S.players[c.e.o].civ;
        return '<span>' + (c.e.k === 'u' ? '<img src="' + G.R.icon('u', c.e.t, civ) + '">' : '') + c.n + '× ' + esc(G.ename(c.e)) + '</span>';
      }).join('') + '</div>';
    }
    var e = ents[0], html = '';
    if (e.k === 'r') {
      var rd = G.RESD[e.t];
      return '<div class="nm">' + esc(rd.name) + '</div><div class="st">' + G.RES_ICON[rd.r] + ' ' + Math.ceil(e.amt) + ' rămas</div><div class="st dim">Alege un țăran și atinge-o ca s-o strângă.</div>';
    }
    var owner = e.o === 0 ? '' : ' <em>(otomani)</em>', civ0 = S.players[e.o].civ;
    html += '<img class="portrait" src="' + G.R.icon(e.k === 'u' ? 'u' : 'b', e.t, civ0) + '">';
    html += '<div class="nm">' + esc(G.ename(e)) + owner + '</div>' + hpHTML(e);
    if (e.k === 'u') {
      var st = G.ust(e);
      html += '<div class="st">⚔️ ' + (st.atk + G.auraBonus(e)) + (st.rng ? ' &nbsp;🏹 ' + String(st.rng).replace('.', ',') : '') + ' &nbsp;🛡️ ' + st.ma + '/' + st.pa + '</div>';
      if (e.o === 0) html += '<div class="st">' + esc(unitStatus(e)) + (e.carry && e.carry.n >= 1 ? ' · ' + G.RES_ICON[e.carry.r] + ' ' + fmt(e.carry.n) + '/' + st.cap : '') + '</div>';
      if (G.UNITS[e.t].desc) html += '<div class="st dim">' + esc(G.UNITS[e.t].desc) + '</div>';
      return html;
    }
    var d = G.BLDS[e.t];
    if (!e.built) return html + '<div class="st">Se construiește: ' + Math.floor(e.prog * 100) + '%</div><div class="st dim">Țăranii aleși pot ajuta: atinge clădirea.</div>';
    if (e.o !== 0) return html;
    if (e.q.length) {
      html += '<div class="q">' + e.q.map(function (it, i) {
        var pr = i === 0 ? 1 - Math.max(0, it.left) / it.tot : 0;
        var ic = it.u ? '<img src="' + G.R.icon('u', it.u, 'mol') + '">' : '<span class="em">' + G.TECHS[it.tech].icon + '</span>';
        return '<span class="qi" data-q="' + i + '">' + ic + (i === 0 ? '<i style="width:' + (pr * 100).toFixed(0) + '%"></i>' : '') + '</span>';
      }).join('') + '</div><div class="st dim">Atinge un element din coadă ca să-l anulezi.</div>';
      var first = e.q[0];
      if (first.u && first.left <= 0 && P.pop >= P.cap) html += '<div class="st warn">Nu mai e loc: construiește case!</div>';
    } else {
      var extra = d.pop ? 'Locuri pentru oameni: +' + d.pop : d.drop ? 'Aici se aduc: ' + d.drop.split('').map(function (r) { return G.RES_NAME[r].toLowerCase(); }).join(', ') : d.desc || '';
      if (e.t === 'cetate') extra = 'Trage cu săgeți. Aici se aduc toate resursele.';
      html += '<div class="st dim">' + esc(extra) + '</div>';
    }
    return html;
  }
  function hint() {
    var S = G.S, P = S.players[0], C = G.C;
    var vils = C.units.filter(function (u) { return u.o === 0 && u.t === 'vil'; });
    var working = vils.filter(function (u) { return u.task; }).length;
    if (S.t < 90 && working < 2) return 'Atinge un țăran, apoi o oaie sau o tufă de mure: se apucă de strâns hrană.';
    if (P.pop >= P.cap - 1 && !C.blds.some(function (b) { return b.o === 0 && b.t === 'casa' && !b.built; })) return 'Nu mai ai loc pentru oameni. Alege un țăran și construiește o casă 🏠.';
    var idleL = idleVils(), idle = idleL.length;
    if (idle && idleL.some(function (u) { return /berry|sheep/.test(u.why || ''); }) && !C.blds.some(function (b) { return b.o === 0 && b.t === 'ogor'; }))
      return 'S-au terminat oile și murele din jur. Construiește o moară și ogoare: hrană fără sfârșit.';
    if (idle) return 'Ai ' + idle + (idle === 1 ? ' țăran fără treabă' : ' țărani fără treabă') + (document.body.classList.contains('desk') ? '. Apasă tasta punct (.) sau 💤.' : '. Apasă 💤 din dreapta.');
    if (!C.blds.some(function (b) { return b.o === 0 && b.t === 'joagar'; }) && S.t > 120) return 'Construiește un joagăr lângă pădure: țăranii nu vor mai merge departe cu lemnul.';
    if (P.age === 0 && P.res.f >= 500) return 'Ai 500 de hrană: atinge Cetatea și intră în Epoca Feudală ⬆️.';
    if (!C.blds.some(function (b) { return b.o === 0 && b.t === 'cazarma'; }) && S.t > 240) return 'Construiește o cazarmă. Otomanii vor ataca în curând.';
    if (P.age === 1 && P.res.f >= 800 && P.res.g >= 200) return 'Poți intra în Epoca Castelelor din Cetate 🏰.';
    return 'Atinge Cetatea ca să faci țărani. Țăranii fac totul: hrană, lemn, aur, piatră și clădiri.';
  }

  // ---------- actualizare (de câteva ori pe secundă) ----------
  var acc = 0, miniAcc = 0;
  UI.tick = function (dt) {
    acc += dt; miniAcc += dt;
    flushMsgs();
    if (miniAcc > 0.3) { miniAcc = 0; G.R.drawMini(); }
    if (acc < 0.2) return;
    acc = 0;
    var S = G.S, P = S.players[0];
    els.rf.textContent = fmt(P.res.f); els.rw.textContent = fmt(P.res.w); els.rg.textContent = fmt(P.res.g); els.rs.textContent = fmt(P.res.s);
    els.pop.textContent = P.pop + '/' + P.cap;
    els.pop.parentNode.classList.toggle('full', P.pop >= P.cap);
    els.age.textContent = G.AGES[P.age];
    var m = Math.floor(S.t / 60), s = Math.floor(S.t % 60);
    els.clock.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    var idle = idleVils().length;
    els.bIdle.innerHTML = '💤<b>' + idle + '</b>';
    els.bIdle.classList.toggle('hot', idle > 0);
    var ents = UI.selEnts();
    els.info.innerHTML = infoHTML(ents);
    var list = commandsFor(ents);
    var sig = UI.sel.join(',') + '|' + list.map(function (c) { return c.id + (c.enabled ? 1 : 0); }).join(',') + '|' + (UI.place ? 'p' : '') + (UI.rallyMode ? 'r' : '');
    if (sig !== lastSig) {
      lastSig = sig; cmdList = list;
      els.cmds.innerHTML = list.map(btnHTML).join('');
    } else cmdList = list;
    document.body.classList.toggle('placing', !!UI.place);
  };
  function flushMsgs() {
    while (msgIdx < G.msgQ.length) {
      var m = G.msgQ[msgIdx++];
      // același mesaj deja pe ecran: doar îi prelungim viața
      var same = Array.prototype.find.call(els.msgs.children, function (c) { return c.dataset.t === m.text && !c.classList.contains('out'); });
      if (same) { clearTimeout(same._tm); same._tm = setTimeout(fade(same), m.kind === 'alert' ? 6000 : 4000); continue; }
      var div = document.createElement('div');
      div.dataset.t = m.text;
      div.className = 'msg ' + m.kind;
      div.textContent = m.text;
      if (m.pos) { div.dataset.x = m.pos.x; div.dataset.y = m.pos.y; div.textContent += ' 👁️'; if (m.kind === 'alert') UI.alertPos = m.pos; }
      els.msgs.appendChild(div);
      while (els.msgs.children.length > 3) els.msgs.removeChild(els.msgs.firstChild);
      div._tm = setTimeout(fade(div), m.kind === 'alert' ? 6000 : 4000);
    }
    if (G.msgQ.length > 60) { G.msgQ.splice(0, 30); msgIdx = Math.max(0, msgIdx - 30); }
  }
  function fade(d) { return function () { d.classList.add('out'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 500); }; }
  UI.forceRefresh = function () { lastSig = ''; acc = 1; };
})();
