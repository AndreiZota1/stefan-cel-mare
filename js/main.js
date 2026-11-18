// Pornirea: ecranul de start, bucla jocului, pauza, salvarea, sfârșitul.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var SAVE = 'scm_save_v1';
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
    var tc = G.C.blds.find(function (b) { return b.o === 0 && b.t === 'cetate'; });
    if (camSaved) { G.cam.x = camSaved.x; G.cam.y = camSaved.y; G.cam.z = camSaved.z; }
    else if (tc) { G.cam.z = document.body.classList.contains('desk') ? 1.25 : 1.15; G.R.resize(); G.R.center(tc.x + 0.8, tc.y + 0.8); }
    G.UI.reset();
    G.running = true; G.paused = false;
    show('start', false); show('menu', false); show('end', false); show('help', false);
    document.body.classList.add('playing');
    G.R.resize(); G.R.resizeMini(); G.UI.forceRefresh();
    G.Terrain.build(); G.Terrain.fogUpdate(); G.Terrain.prewarm(G.cam, G.R.W, G.R.H, G.R.DPR);
  }
  G.startGame = function (diff) {
    if (G.Audio.on) G.Audio.unlock();
    goFull();
    G.newGame({ diff: diff, aiBoth: !!G.spectate });
    afterLoad(null);
    G.msg('Moldova, 1475. Oastea lui Soliman Pașa vine spre Suceava.', 'good');
    G.msg('Atinge un țăran, apoi o oaie sau o tufă de mure.', 'info');
  };
  G.continueGame = function () {
    var str = null, meta = null;
    try { str = localStorage.getItem(SAVE); meta = JSON.parse(localStorage.getItem(SAVE + '_meta')); } catch (e) {}
    if (!str) return;
    if (G.Audio.on) G.Audio.unlock();
    goFull();
    try { G.deserialize(str); } catch (e) { alert('Salvarea nu s-a putut citi.'); return; }
    afterLoad(meta && meta.cam);
    G.msg('Continuăm de unde ai rămas.', 'info');
  };
  G.saveGame = function () {
    if (!G.S || G.S.over || G.spectate) return;
    try {
      localStorage.setItem(SAVE, G.serialize());
      localStorage.setItem(SAVE + '_meta', JSON.stringify({ t: G.S.t, diff: G.S.diff, when: Date.now(), cam: { x: G.cam.x, y: G.cam.y, z: G.cam.z } }));
    } catch (e) {}
  };
  G.pause = function () { if (!G.running) return; G.paused = true; G.saveGame(); show('menu', true); };
  G.resume = function () { G.paused = false; show('menu', false); show('help', false); };
  G.toStart = function () {
    G.saveGame();
    G.running = false; G.paused = false;
    document.body.classList.remove('playing');
    show('menu', false); show('end', false);
    refreshStart(); show('start', true);
  };

  function refreshStart() {
    var meta = null;
    try { meta = JSON.parse(localStorage.getItem(SAVE + '_meta')); } catch (e) {}
    var cb = $('bContinue');
    if (meta && localStorage.getItem(SAVE)) {
      cb.style.display = '';
      cb.querySelector('small').textContent = G.DIFF[meta.diff].name + ' · minutul ' + Math.floor(meta.t / 60);
    } else cb.style.display = 'none';
    $('fact').textContent = G.FACTS[Math.floor(Math.random() * G.FACTS.length)];
  }

  function endCheck() {
    var S = G.S;
    if (!S.over || $('end').classList.contains('on')) return;
    var win = S.over === 1, P = S.players[0], E = S.players[1];
    $('endT').textContent = win ? 'Victorie!' : 'Înfrângere';
    $('endT').className = win ? 'win' : 'lose';
    $('endS').textContent = win ? 'Cetatea Otomană a căzut. Moldova e liberă!' : 'Cetatea de Scaun a căzut. Mai încerci o dată?';
    var m = Math.floor(S.t / 60), g = P.st.gath;
    $('endStats').innerHTML =
      '<tr><td></td><th>Moldova</th><th>Otomanii</th></tr>' +
      '<tr><td>Oameni făcuți</td><td>' + P.st.trained + '</td><td>' + E.st.trained + '</td></tr>' +
      '<tr><td>Dușmani doborâți</td><td>' + P.st.killed + '</td><td>' + E.st.killed + '</td></tr>' +
      '<tr><td>Clădiri dărâmate</td><td>' + P.st.razed + '</td><td>' + E.st.razed + '</td></tr>' +
      '<tr><td>Resurse strânse</td><td>' + Math.floor(g.f + g.w + g.g + g.s) + '</td><td>' + Math.floor(E.st.gath.f + E.st.gath.w + E.st.gath.g + E.st.gath.s) + '</td></tr>' +
      '<tr><td>Durata</td><td colspan="2">' + m + ' minute · ' + G.DIFF[S.diff].name + '</td></tr>';
    show('end', true);
    G.running = false;
    document.body.classList.remove('playing');
    try { localStorage.removeItem(SAVE); localStorage.removeItem(SAVE + '_meta'); } catch (e) {}
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (G.S && G.running && !G.paused) {
      var sim = dt * G.speed;
      while (sim > 1e-6) { var st = Math.min(0.05, sim); G.update(st); sim -= st; }
      endCheck();
    }
    if (G.S && (G.running || G.S.over)) {
      G.Input.tick(dt);
      G.R.frame(G.paused ? 0 : dt);
      G.UI.tick(dt);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('load', function () {
    var qs = new URLSearchParams(location.search);
    if (qs.get('spectate')) G.spectate = true;
    G.R.init($('cv')); G.R.initMini($('mini')); G.UI.init(); G.Input.init($('cv'));
    G.R.preloadBaked(); G.R.preloadBld(); G.R.preloadNature(); G.Terrain.loadTextures();
    function layout() {
      var desk = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 && window.innerHeight >= 520;
      document.body.classList.toggle('desk', desk);
      G.R.resize(); G.R.resizeMini(); G.UI.forceRefresh();
    }
    layout();
    window.addEventListener('resize', layout);
    document.addEventListener('visibilitychange', function () { if (document.hidden && G.running && !G.paused) G.pause(); });
    document.querySelectorAll('[data-diff]').forEach(function (b) { b.addEventListener('click', function () { G.startGame(b.dataset.diff); }); });
    $('bContinue').addEventListener('click', G.continueGame);
    $('bHelp').addEventListener('click', function () { show('help', true); });
    $('helpClose').addEventListener('click', function () { show('help', false); });
    $('mResume').addEventListener('click', G.resume);
    $('mHelp').addEventListener('click', function () { show('help', true); });
    $('mExit').addEventListener('click', G.toStart);
    $('eAgain').addEventListener('click', function () { show('end', false); refreshStart(); show('start', true); });
    $('helpList').innerHTML = G.HELP.map(function (h) { return '<li><span>' + h[0] + '</span>' + h[1] + '</li>'; }).join('');
    $('intro').textContent = G.INTRO;
    $('startArt').innerHTML = '<img src="' + G.R.icon('u', 'hero', 'mol') + '"><img class="big" src="' + G.R.icon('b', 'cetate', 'mol') + '"><img src="' + G.R.icon('u', 'mil', 'mol') + '">';
    refreshStart();
    setInterval(function () { if (G.running && !G.paused) G.saveGame(); }, 30000);
    window.addEventListener('pagehide', function () { if (G.running) G.saveGame(); });
    requestAnimationFrame(frame);
  });
})();
