// Coloana sonoră: piese adevărate (Kevin MacLeod, CC BY 4.0, assets/muzica/), ca în AoE.
// Tema la meniu, muzică de pace la economie, piese epice când începe bătălia (și înapoi după ce se liniștește),
// orientale la otomani și tătari, victoria, înfrângerea, poveștile misiunilor și filmele.
// Muzica compusă pe loc (music.js) rămâne rezervă, dacă piesele nu se pot încărca.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var Mu = G.Music; if (!Mu || !G.MUZICA) return;
  var Co = G.Coloana = { state: '', civ: 'mol', mood: 'peace', vol: 0.55, duck: 1, failed: false };
  var els = [new Audio(), new Audio()], cur = 0, curKey = '', curGroup = '', fades = [null, null], last = {}, peaceSince = 0;
  els.forEach(function (el, i) {
    el.preload = 'auto';
    el.addEventListener('ended', function () { if (i === cur) next(true); });
    el.addEventListener('error', function () { if (i === cur && el.src) { Co.failed = true; if (Mu.setQuiet) Mu.setQuiet(false); } });
  });
  var EAST = { oto: 1, tat: 1 };
  function group() {
    var M = G.MUZICA, e = EAST[Co.civ];
    if (Co.state === 'joc') return Co.mood === 'battle' ? (e ? 'orient_lupta+lupta' : 'lupta') : (e ? 'orient+pace' : 'pace');
    return Co.state;
  }
  function listOf(g) {
    var M = G.MUZICA, out = [];
    g.split('+').forEach(function (k) { (M[k] || []).forEach(function (t) { out.push(t); }); });
    return out.length ? out : M.pace;
  }
  function target() { return Mu.on ? Co.vol * Co.duck : 0; }
  function fade(i, to, sec, after) {
    var el = els[i], from = el.volume, t0 = performance.now();
    clearInterval(fades[i]);
    fades[i] = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / (sec * 1000));
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) { clearInterval(fades[i]); fades[i] = null; if (after) after(); }
    }, 50);
  }
  // următoarea piesă din grup (nu aceeași de două ori la rând); trecerea durează `sec`
  function play(g, sec) {
    if (!Mu.on) { curGroup = g; els.forEach(function (el) { el.pause(); }); return; }
    var L = listOf(g), pick = L[(Math.random() * L.length) | 0];
    if (L.length > 1) for (var n = 0; n < 6 && (pick === curKey || pick === last[g]); n++) pick = L[(Math.random() * L.length) | 0];
    last[g] = pick; curGroup = g;
    var old = cur; cur = 1 - cur;
    var el = els[cur];
    el.src = 'assets/muzica/' + pick + '.m4a'; el.volume = 0; curKey = pick;
    var p = el.play(); if (p && p.catch) p.catch(function () {});
    fade(cur, target(), sec || 2.5);
    fade(old, 0, (sec || 2.5) * 0.9, function () { els[old].pause(); });
  }
  function next(ended) { if (Co.state) play(curGroup || group(), ended ? 1.2 : 2.5); }

  // stările: tema, joc, poveste, film, film_lupta, trailer, victorie, infrangere
  Co.set = function (state, civ) {
    if (civ) Co.civ = civ;
    if (state === 'joc' && Co.state !== 'joc') Co.mood = 'peace';
    Co.state = state;
    if (!G.Audio.ac || Co.failed) return;
    if (Mu.setQuiet) Mu.setQuiet(true);
    var g = group();
    if (g !== curGroup || els[cur].paused) play(g, state === 'victorie' || state === 'infrangere' ? 1.2 : 2.5);
  };
  // sub narațiune, muzica se dă mai încet
  Co.setDuck = function (d) { Co.duck = d; fade(cur, target(), 0.8); };
  Co.info = function () { var el = els[cur]; return { state: Co.state, group: curGroup, track: curKey, t: el.currentTime, vol: el.volume, paused: el.paused }; };
  Co.refresh = function () { fade(cur, target(), 0.6); if (Mu.on && els[cur].paused && Co.state && G.Audio.ac) play(group(), 1.5); };

  // ---------- legăturile cu muzica veche (aceleași apeluri din joc) ----------
  var baseMood = Mu.setMood, baseToggle = Mu.toggle, baseStart = Mu.start;
  Mu.setMood = function (m) {
    if (baseMood) baseMood.call(Mu, m);
    if (Co.state !== 'joc' || Co.failed) return;
    var now = performance.now();
    // în luptă intră repede; înapoi la pace doar după 20 de secunde liniștite
    if (m === 'battle') { peaceSince = 0; if (Co.mood !== 'battle') { Co.mood = 'battle'; play(group(), 1.5); } }
    else if (Co.mood === 'battle') { if (!peaceSince) peaceSince = now; else if (now - peaceSince > 20000) { Co.mood = 'peace'; play(group(), 4); } }
  };
  Mu.toggle = function () { baseToggle.call(Mu); Co.refresh(); };
  Mu.start = function (ac, dest) {
    baseStart.call(Mu, ac, dest);
    if (!Co.failed && Mu.setQuiet) Mu.setQuiet(true);
    if (Co.state) Co.set(Co.state);
  };
})();
