// Pornirea: ecranul de start, bucla jocului, pauza, salvarea, sfârșitul.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var SAVE = 'scm_save_v2';
  try { localStorage.removeItem('scm_save_v1'); localStorage.removeItem('scm_save_v1_meta'); } catch (e) {}
  G.speed = 1;
  try { var sp = parseFloat(localStorage.getItem('scm_speed')); if (sp) G.speed = sp; } catch (e) {}
  G.running = false; G.paused = false;
  var $ = function (id) { return document.getElementById(id); };
  function show(id, on) { $(id).classList.toggle('on', on); }

  function goFull() {
    var el = document.documentElement;
    try {
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
      if (p && p.then) p.then(function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
      }).catch(function () {});
    } catch (e) {}
  }

  function afterLoad(camSaved) {
    var tc = G.C.blds.find(function (b) { return b.o === G.me && b.t === 'cetate'; });
    if (camSaved) { G.cam.x = camSaved.x; G.cam.y = camSaved.y; G.cam.z = camSaved.z; }
    else if (tc) { G.cam.z = document.body.classList.contains('desk') ? 1.25 : 1.15; G.R.resize(); G.R.center(tc.x + 0.8, tc.y + 0.8); }
    G.UI.reset();
    G.running = true; G.paused = false;
    show('start', false); show('menu', false); show('end', false); show('help', false); show('setup', false); show('tree', false); if ($('camp')) show('camp', false); if ($('story')) show('story', false);
    G.R.preloadBaked(); G.R.preloadBld();
    document.body.classList.add('playing');
    G.R.resize(); G.R.resizeMini(); G.UI.forceRefresh();
    G.Terrain.build(); G.Terrain.fogUpdate();
    if (G.TerrainGL) { G.TerrainGL.build(); G.TerrainGL.fogUpdate(); }
    if (G.TerrainGL && G.TerrainGL.active()) G.TerrainGL.prewarm(G.cam, G.R.W, G.R.H, G.R.DPR); else G.Terrain.prewarm(G.cam, G.R.W, G.R.H, G.R.DPR);
  }
  // bătălia din spatele meniului: două civilizații la întâmplare, camera urmărește luptele
  var demoT = 0, demoTgt = null;
  function startDemo() {
    if (G.running || (G.Cine && G.Cine.active) || !document.body.classList.contains('desk')) return;
    var L = G.CIV_LIST.slice().sort(function () { return Math.random() - 0.5; }), types = ['rau', 'codri', 'stepa', 'delta', 'munti'];
    try {
      G.newGame({ seed: (Math.random() * 1e9) | 0, size: 72, diff: 'normal', startAge: 2, res: 'mult', popMax: 70, reveal: 'tot',
        map: { type: types[(Math.random() * 5) | 0], season: Math.random() < 0.3 ? 'iarna' : 'vara' }, players: [{ civ: L[0], ai: true, team: 1 }, { civ: L[1], ai: true, team: 2 }] });
    } catch (e) { return; }
    G.demo = true; demoT = 0; demoTgt = null;
    G.cam.z = 1.05; G.R.resize(); G.R.center(G.S.N / 2, G.S.N / 2);
    G.R.preloadBaked(); G.R.preloadBld();
    G.Terrain.build(); G.Terrain.fogUpdate();
    if (G.TerrainGL) { G.TerrainGL.build(); G.TerrainGL.fogUpdate(); }
    for (var i = 0; i < 1500; i++) G.update(0.1);
  }
  G.startDemo = startDemo;
  function demoCam(dt) {
    demoT -= dt;
    if (demoT <= 0 || !demoTgt) {
      demoT = 9;
      var f = G.C.units.filter(function (u) { return u.task && u.task.k === 'atk'; });
      var u = f.length ? f[(Math.random() * f.length) | 0] : G.C.blds[(Math.random() * G.C.blds.length) | 0];
      demoTgt = u ? [u.x, u.y] : [G.S.N / 2, G.S.N / 2];
    }
    var c = G.cam, w = G.R.s2w(G.R.W / 2, G.R.H / 2), k = Math.min(1, dt * 0.6);
    G.R.center(w[0] + (demoTgt[0] - w[0]) * k, w[1] + (demoTgt[1] - w[1]) * k);
    if (G.S.over || G.S.t > 2400) startDemo();
  }

  G.startGame = function (o) {
    G.demo = false;
    if (typeof o === 'string') o = { diff: o };
    o = o || {};
    if (!o.scen) G.lastStart = JSON.parse(JSON.stringify(o));
    if (G.Audio.on) G.Audio.unlock();
    goFull();
    if (o.aiBoth === undefined) o.aiBoth = !!G.spectate;
    if (o.aiBoth && o.players) o.players[G.me].ai = true;
    G.newGame(o);
    afterLoad(null);
    if (G.Voci && G.Voci.load) G.S.players.forEach(function (P) { G.Voci.load(P.civ); });
    if (G.Music && G.Music.setCiv) { G.Music.setCiv(G.S.players[G.me].civ); if (G.Music.setAge) G.Music.setAge(G.S.players[G.me].age); }
    if (G.Coloana) G.Coloana.set('joc', G.S.players[G.me].civ);
    if (!o.scen) {
      var S = G.S, me = S.players[G.me], foes = S.players.filter(function (P) { return G.enemy(G.me, P.id); }), fr = S.players.filter(function (P) { return P.id && G.ally(G.me, P.id); });
      G.msg('Ești ' + G.CIVS[me.civ].name + '. Te înfrunți cu: ' + foes.map(function (P) { return G.CIVS[P.civ].name; }).join(', ') + (fr.length ? '. Aliați: ' + fr.map(function (P) { return G.CIVS[P.civ].name; }).join(', ') : '') + '.', 'good');
      if (S.opt.peace) G.msg('Pace ' + Math.round(S.opt.peace / 60) + ' minute: nimeni nu te atacă până atunci.', 'info');
      G.msg('Alege un țăran, apoi o oaie sau o tufă de mure.', 'info');
    }
  };
  G.continueGame = function () {
    G.demo = false;
    var str = null, meta = null;
    try { str = localStorage.getItem(SAVE); meta = JSON.parse(localStorage.getItem(SAVE + '_meta')); } catch (e) {}
    if (!str) return;
    if (G.Audio.on) G.Audio.unlock();
    goFull();
    try { G.deserialize(str); } catch (e) { alert('Salvarea nu s-a putut citi.'); return; }
    afterLoad(meta && meta.cam);
    if (G.Voci && G.Voci.load) G.S.players.forEach(function (P) { G.Voci.load(P.civ); });
    if (G.Music && G.Music.setCiv) { G.Music.setCiv(G.S.players[G.me].civ); if (G.Music.setAge) G.Music.setAge(G.S.players[G.me].age); }
    if (G.Coloana) G.Coloana.set('joc', G.S.players[G.me].civ);
    if (G.S.scen && G.Camp && G.Camp.loadNar) G.Camp.loadNar(G.S.scen.id, function () {});
    G.msg('Continuăm de unde ai rămas.', 'info');
  };
  G.saveGame = function () {
    if (!G.S || G.S.over || G.spectate) return;
    try {
      localStorage.setItem(SAVE, G.serialize());
      localStorage.setItem(SAVE + '_meta', JSON.stringify({ t: G.S.t, diff: G.S.diff, civ: G.S.players[G.me].civ, scen: G.S.scen ? G.S.scen.title || G.S.scen.id : '', when: Date.now(), cam: { x: G.cam.x, y: G.cam.y, z: G.cam.z } }));
    } catch (e) {}
  };
  G.pause = function () { if (!G.running) return; G.paused = true; G.saveGame(); show('menu', true); };
  G.resume = function () { G.paused = false; show('menu', false); show('help', false); };
  G.toStart = function () { G.saveGame(); G.toMenu(); };
  // meniul principal, fără salvare (după o misiune terminată nu e nimic de continuat)
  G.toMenu = function () {
    G.running = false; G.paused = false; G.endCamp = null;
    document.body.classList.remove('playing');
    show('menu', false); show('end', false); if ($('camp')) show('camp', false); if ($('story')) show('story', false);
    refreshStart(); show('start', true);
    setTimeout(startDemo, 50);
  };

  function refreshStart() {
    if (G.Coloana && !G.Cine.active) G.Coloana.set('tema');
    var meta = null;
    try { meta = JSON.parse(localStorage.getItem(SAVE + '_meta')); } catch (e) {}
    var cb = $('bContinue');
    if (meta && localStorage.getItem(SAVE)) {
      cb.style.display = '';
      cb.querySelector('small').textContent = (meta.scen ? meta.scen : (G.CIVS[meta.civ] ? G.CIVS[meta.civ].name : '')) + ' · ' + (G.DIFF[meta.diff] || G.DIFF.normal).name + ' · minutul ' + Math.floor(meta.t / 60);
    } else cb.style.display = 'none';
    $('fact').textContent = G.FACTS[Math.floor(Math.random() * G.FACTS.length)];
  }

  function endCheck() {
    var S = G.S;
    if (!S.over || $('end').classList.contains('on')) return;
    var win = G.iWon();
    if (G.Coloana) G.Coloana.set(win ? 'victorie' : 'infrangere');
    G.running = false;
    document.body.classList.remove('playing');
    try { localStorage.removeItem(SAVE); localStorage.removeItem(SAVE + '_meta'); } catch (e) {}
    if (S.scen && G.Camp && G.Camp.onEnd) { G.Camp.onEnd(win); return; }
    G.endCamp = null;
    G.Menu.endScreen(S, win);
    $('eNext').style.display = 'none'; $('eRetry').style.display = ''; $('eRetry').textContent = 'Mai joacă o dată'; $('eCamp').style.display = 'none';
    show('end', true);
  }

  var last = performance.now();
  // simularea merge în pași ficși de 0,05 s, la fel pe orice calculator (jocul online cere asta);
  // între doi pași, oamenii și proiectilele se desenează la mijlocul drumului, ca mișcarea să rămână lină
  var STEP = 0.05, acc = 0;
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    // filmul de început ține tot ecranul
    if (G.Cine && G.Cine.active) { G.Cine.tick(dt); requestAnimationFrame(frame); return; }
    if (G.S && G.running && !G.paused) {
      acc = Math.min(acc + dt * G.speed, STEP * 6);
      while (acc >= STEP && G.running) { G.update(STEP); acc -= STEP; endCheck(); }
    } else acc = 0;
    if (G.demo && G.S && !G.running) {
      var simd = dt * 1.5;
      while (simd > 1e-6) { var st2 = Math.min(0.05, simd); G.update(st2); simd -= st2; }
      demoCam(dt);
      G.R.frame(dt);
    } else if (G.S && (G.running || G.S.over)) {
      G.Input.tick(dt);
      G.R.lerp(G.running && !G.paused ? acc / STEP : 0);
      G.R.frame(G.paused ? 0 : dt);
      G.R.unlerp();
      G.UI.tick(dt);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('load', function () {
    var qs = new URLSearchParams(location.search);
    if (qs.get('spectate')) G.spectate = true;
    G.R.init($('cv')); G.R.initMini($('mini')); G.UI.init(); G.Input.init($('cv'));
    G.R.preloadNature(); G.Terrain.loadTextures(); if (G.TerrainGL) G.TerrainGL.loadTextures();
    function layout() {
      var desk = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 && window.innerHeight >= 520;
      document.body.classList.toggle('desk', desk);
      G.R.resize(); G.R.resizeMini(); G.UI.forceRefresh();
    }
    layout();
    window.addEventListener('resize', layout);
    document.addEventListener('visibilitychange', function () { if (document.hidden && G.running && !G.paused) G.pause(); });
    $('bSkirmish').addEventListener('click', G.Menu.openSetup);
    $('bQuick').addEventListener('click', function () { G.Menu.startSkirmish(); });
    $('bTree').addEventListener('click', function () { G.Menu.openTree(); });
    if ($('bMedals')) $('bMedals').addEventListener('click', function () { G.Menu.openMedals(); });
    if ($('bChat')) $('bChat').addEventListener('click', function () { G.UI.openChat(); });
    if (G.Camp && G.Camp.open) $('bCamp').addEventListener('click', G.Camp.open); else $('bCamp').style.display = 'none';
    $('mTree').addEventListener('click', function () { G.Menu.openTree(); });
    $('eRetry').addEventListener('click', function () {
      show('end', false);
      if (G.endCamp) G.Trig.start(G.endCamp.id, G.endCamp.diff);
      else if (G.lastStart) G.startGame(JSON.parse(JSON.stringify(G.lastStart)));
    });
    // la campanii: povestea de după victorie, apoi harta campaniei
    $('eNext').addEventListener('click', function () { if (G.endCamp && G.endCamp.win) { show('end', false); G.Camp.story(G.endCamp.id, 'outro'); } });
    $('eCamp').addEventListener('click', function () { show('end', false); G.Camp.open(); });
    $('bContinue').addEventListener('click', G.continueGame);
    $('bHelp').addEventListener('click', function () { show('help', true); });
    $('helpClose').addEventListener('click', function () { show('help', false); });
    $('mResume').addEventListener('click', G.resume);
    $('mHelp').addEventListener('click', function () { show('help', true); });
    $('mExit').addEventListener('click', G.toStart);
    $('eAgain').addEventListener('click', function () { G.toMenu(); });
    function fillHelp() {
      var desk = document.body.classList.contains('desk');
      $('helpList').innerHTML = (desk ? G.HELP_DESK : G.HELP).map(function (h) { return '<li><span>' + h[0] + '</span><div>' + h[1] + '</div></li>'; }).join('');
    }
    fillHelp(); window.addEventListener('resize', fillHelp);
    $('intro').textContent = G.INTRO;
    function art() { $('startArt').innerHTML = '<img src="' + G.R.icon('u', 'hero', 'val') + '"><img src="' + G.R.icon('u', 'hero', 'mol') + '"><img class="big" src="' + G.R.icon('b', 'cetate', 'mol') + '"><img src="' + G.R.icon('u', 'hero', 'oto') + '"><img src="' + G.R.icon('u', 'hero', 'tat') + '">'; }
    art(); setTimeout(art, 1500);
    refreshStart();
    setInterval(function () { if (G.running && !G.paused) G.saveGame(); }, 30000);
    window.addEventListener('pagehide', function () { if (G.running) G.saveGame(); });
    requestAnimationFrame(frame);
    // filmul: prima dată pornește singur (după o apăsare, ca să se audă), apoi din butonul 🎬 Filmul
    function film(name) {
      show('start', false); show('films', false);
      G.Cine.play({ film: name || 'zugravul', onEnd: function () { refreshStart(); show('start', true); setTimeout(startDemo, 50); } });
    }
    if ($('bFilm')) $('bFilm').addEventListener('click', function () { if (!G.running) show('films', true); });
    if ($('fZugrav')) $('fZugrav').addEventListener('click', function () { film('zugravul'); });
    if ($('fTrailer')) $('fTrailer').addEventListener('click', function () { film('trailer'); });
    if ($('fClose')) $('fClose').addEventListener('click', function () { show('films', false); });
    var firstTouch = function () {
      document.removeEventListener('pointerdown', firstTouch, true); document.removeEventListener('keydown', firstTouch, true);
      if (G.Audio.on) G.Audio.unlock();
      if (G.Coloana && !G.running && !(G.Cine && G.Cine.active)) G.Coloana.set('tema');
    };
    document.addEventListener('pointerdown', firstTouch, true); document.addEventListener('keydown', firstTouch, true);
    var seen = false; try { seen = !!localStorage.getItem('scm_film'); } catch (e) {}
    if (G.Cine && !seen && !navigator.webdriver && !G.spectate) {
      show('splash', true);
      $('splash').addEventListener('click', function () { show('splash', false); film('zugravul'); }, { once: true });
    } else setTimeout(startDemo, 300);
  });
})();
