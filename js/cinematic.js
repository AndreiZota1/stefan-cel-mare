// Filmele jocului, ca filmul de la pornirea lui AoE2. Filmul de început: zugravul de la Moldovița pictează Asediul
// Constantinopolului, iar fresca prinde viață (picturi cu mișcare lentă, bătălii jucate chiar de motorul jocului,
// portretele domnilor, narațiunea cronicarului, muzica și titlul). Plus trailerul cu bătălii.
// Totul se desenează pe o singură pânză (#cineCv), ca filmul să se poată și înregistra (trailerul, cu G.Cine.record).
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var Cine = G.Cine = { active: false };
  var TXT = {
    c1: 'Între Carpați și Marea Neagră, la răscrucea marilor imperii, s-au născut trei țări: Țara Românească, Moldova și Transilvania.',
    c2: 'Din sud venea Imperiul Otoman, cu cea mai mare oaste a lumii. Din apus și din nord, regii și hanii care râvneau aceleași pământuri.',
    c3: 'Mai puțini la număr, domnii acestor țări și-au apărat pământul cu ce aveau: codrii, munții, apele și oamenii lor.',
    c5: 'Ei au scris istoria cu sabia. Acum e rândul tău.',
    z1: 'Moldovița, anul 1537. Pe zidul de miazăzi al mânăstirii, un zugrav bătrân începe o poveste pe care o știe toată Moldova.',
    z2: 'Albastrul îl macină din piatră. Roșul, din cinabru. Varul trebuie să fie ud, altfel culoarea nu prinde.',
    z3: 'Întâi pictează călăreții. Apoi cetatea spre care aleargă.',
    z4: 'Și, pentru o clipă, i se pare că îi aude.',
    z5: 'Cetatea e Constantinopolul. Dar vrăjmașii de sub ziduri poartă turbane, iar călăreții seamănă cu oamenii lui Ștefan. Toată lumea înțelege.',
    z6: 'Pe zidurile acestei țări, fiecare poveste e o bătălie. Și fiecare bătălie, o țară apărată.',
    z7: 'Iar la sfârșit, îi pictează pe cei care au apărat-o.',
    z7d: 'Și unul care încă nu se născuse: Mihai Viteazul.',
    z9: 'Pictura e acolo și azi, după aproape cinci sute de ani.'
  };
  var HEROES = [
    { k: 'hero', img: 'erou_mircea', name: 'Mircea cel Bătrân', years: 'Țara Românească, 1386–1418', line: 'c4a', min: 2.9, quick: 1 },
    { k: 'hero', img: 'erou_vlad', name: 'Vlad Țepeș', years: 'Țara Românească, 1456–1462 și 1476', line: 'c4b', min: 2.9, quick: 1 },
    { k: 'hero', img: 'erou_stefan', name: 'Ștefan cel Mare', years: 'Moldova, 1457–1504', line: 'c4c', min: 2.9, quick: 1 }
  ];
  // k: pic (pictură), morph (fresca prinde viață), game (scenă din joc), hero (portret), title; min = durata minimă (s)
  // kb = mișcarea lentă [z0, x0, y0, z1, x1, y1] (deplasare); kf = la fel, dar cu punctul din pictură ținut în mijloc [z0, fx0, fy0, z1, fx1, fy1]
  var FILMS = {
    // filmul de început: zugravul de la Moldovița pictează Asediul Constantinopolului, iar fresca prinde viață
    zugravul: [
      { k: 'pic', img: 'z_manastire', line: 'z1', min: 9.5, kf: [1.0, 0.5, 0.5, 1.16, 0.58, 0.42], mood: 'peace', prep: 'asediu' },
      { k: 'pic', img: 'z_pigment', line: 'z2', min: 8, kf: [1.25, 0.36, 0.55, 1.05, 0.42, 0.5] },
      { k: 'pic', img: 'z_pensula', line: 'z3', min: 5.5, kf: [1.05, 0.5, 0.45, 1.28, 0.45, 0.42] },
      { k: 'morph', img: 'z_fresca', img2: 'z_viu', line: 'z4', min: 7, kf: [1.05, 0.5, 0.5, 1.4, 0.42, 0.55], flashOut: 1 },
      { k: 'game', scene: 'asediu', line: 'z5', min: 12.5, mood: 'battle', flashIn: 1 },
      { k: 'pic', img: 'z_zid', line: 'z6', min: 8, kf: [1.0, 0.5, 0.5, 1.15, 0.45, 0.4], mood: 'peace', prep: 'campie' },
      { k: 'pic', img: 'z_chip', line: 'z7', min: 5.5, kf: [1.0, 0.5, 0.5, 1.14, 0.45, 0.4] }
    ].concat(HEROES, [
      { k: 'hero', img: 'erou_mihai', name: 'Mihai Viteazul', years: 'Țara Românească, Ardealul și Moldova, 1593–1601', line: 'z7d', min: 4.2, quick: 1 },
      { k: 'game', scene: 'campie', line: 'c5', min: 10, mood: 'battle' },
      { k: 'pic', img: 'z_final', line: 'z9', min: 9, kf: [2.3, 0.36, 0.8, 1.0, 0.5, 0.5], mood: 'peace' },
      { k: 'title', img: 'z_final', min: 8, kf: [1.0, 0.5, 0.5, 1.04, 0.5, 0.45] }
    ]),
    // trailerul: Carpații, oastea otomană, ambuscada de la vad, domnii, bătălia din câmpie
    trailer: [
      { k: 'pic', img: 'cine_carpati', line: 'c1', min: 9, kb: [1.0, 0, 0.02, 1.13, -0.03, -0.01], mood: 'peace', prep: 'vad' },
      { k: 'pic', img: 'cine_oaste', line: 'c2', min: 9, kb: [1.14, 0.03, 0, 1.0, -0.02, 0.01] },
      { k: 'game', scene: 'vad', line: 'c3', min: 11.5, mood: 'battle' },
      HEROES[0], HEROES[1], HEROES[2],
      { k: 'hero', img: 'erou_mihai', name: 'Mihai Viteazul', years: 'Țara Românească, Ardealul și Moldova, 1593–1601', line: 'c4d', min: 3.3, quick: 1 },
      { k: 'game', scene: 'campie', line: 'c5', min: 10.5, mood: 'battle' },
      { k: 'title', img: 'cine_titlu', min: 8, mood: 'peace', kb: [1.08, 0.01, 0, 1.0, 0, 0] }
    ]
  };
  FILMS.trailer[3] = Object.assign({}, HEROES[0], { prep: 'campie' });
  var SHOTS = FILMS.zugravul;
  var LINE_TXT = function (k) { return TXT[k] || ''; };

  // ---------- scenele jucate de joc ----------
  function keep(S) { S.players.forEach(function (P) { P.immortal = true; }); }
  var SCENES = {
    // ambuscada de la vad: coloana otomană trece râul, moldovenii ies din pădure
    vad: {
      opts: { seed: 1475, players: [{ civ: 'mol', ai: false, team: 1 }, { civ: 'oto', ai: false, team: 2 }], startAge: 2, reveal: 'tot', noBases: true, victory: 'scenariu', popMax: 200,
        mapSpec: { N: 64, season: 'vara', seed: 1475, ground: 'grass', amp: 1.0, ops: [
          ['river', [[-2, 33], [18, 36], [30, 34], [44, 32], [66, 35]], 3, { fords: [[30, 34]] }],
          ['forest', [[0, 0], [25, 0], [25, 29], [0, 31]], 0.75], ['forest', [[36, 0], [64, 0], [64, 31], [35, 29]], 0.75],
          ['forest', [[0, 42], [24, 41], [22, 64], [0, 64]], 0.6], ['forest', [[37, 41], [64, 42], [64, 64], [38, 64]], 0.6],
          ['road', [[30, 66], [30, 34], [30, -2]], 2], ['clear', 30, 34, 4]
        ] } },
      setup: function (S, T) {
        T.bld(0, 'casa', 2, 2, true); T.bld(1, 'casa', 60, 60, true);
        T.attackMove(T.spawn(1, [['ien', 8], ['mil2', 6], ['kni', 4], ['arc', 6]], 30, 52, 'col'), 30, 8);
        T.spawn(0, [['raz', 9], ['arc', 6], ['lcv', 4]], 23, 28, 'mw'); T.spawn(0, [['raz', 7], ['spr', 4], ['arc', 4]], 37, 27, 'me');
        T.spawn(0, [['hero', 1]], 22, 26, 'mw');
        keep(S);
      },
      pre: 5.5,
      events: [[0.6, function (T) { T.attackMove(T.byTag('mw'), 30, 39); T.attackMove(T.byTag('me'), 30, 39); }]],
      cam: [[30.5, 40, 1.95], [29.5, 35.5, 1.5]]
    },
    // asediul din frescă: tunurile turcești bat zidul cetății, călăreții moldoveni lovesc din stânga
    asediu: {
      opts: { seed: 1537, players: [{ civ: 'mol', ai: false, team: 1 }, { civ: 'oto', ai: false, team: 2 }, { civ: 'val', ai: false, team: 1, col: 4 }], startAge: 4, reveal: 'tot', noBases: true, victory: 'scenariu', popMax: 300,
        mapSpec: { N: 72, season: 'vara', seed: 1537, ground: 'grass', amp: 0.9, ops: [
          ['forest', [[0, 30], [22, 40], [20, 72], [0, 72]], 0.6], ['forestc', 36, 56, 6, 0.6], ['forestc', 62, 52, 5, 0.6],
          ['road', [[20, 60], [40, 36], [52, 24], [64, 12]], 2], ['clear', 44, 32, 12]
        ] } },
      setup: function (S, T) {
        // cetatea: un zid lung, cu turnuri, și cetatea din spatele lui (în dreapta ecranului)
        T.wall(2, 42, 20, 54, 32, [], 'zid');
        T.bld(2, 'turn', 46, 21, true); T.bld(2, 'turn', 51, 26, true); T.bld(2, 'fortareata', 53, 17, true);
        T.spawn(2, [['arc2', 10]], 50, 22, 'aparatori');
        // tabăra și tunurile turcilor (la mijloc)
        T.bld(1, 'casa', 43, 37, true); T.bld(1, 'casa', 40, 35, true); T.bld(1, 'casa', 46, 39, true);
        T.spawn(1, [['can2', 6]], 46, 32, 'tun'); T.spawn(1, [['treb', 1]], 43, 32, 'tun');
        T.spawn(1, [['ien', 12], ['mil2', 10], ['arc2', 8]], 49, 30, 'ot');
        // călăreții care vin în ajutor (din stânga)
        T.spawn(0, [['kni2', 14], ['lcv2', 10]], 37, 40, 'cal'); T.spawn(0, [['hero', 1]], 36, 41, 'cal');
        T.attackMove(T.byTag('cal'), 46, 32);
        var wall = G.C.blds.filter(function (b) { return b.o === 2 && G.BLDS[b.t].wall; });
        if (wall.length) G.cmdAttack(T.byTag('tun'), wall[(wall.length / 2) | 0]);
        T.attackMove(T.byTag('ot'), 48, 26);
        keep(S);
      },
      pre: 2.2,
      events: [],
      cam: [[43, 33, 1.8], [45, 33, 1.55]]
    },
    // bătălia din câmpie: oastea lui Mihai Viteazul se izbește de otomani, pe dealuri
    campie: {
      opts: { seed: 1595, players: [{ civ: 'val', ai: false, team: 1, heroVis: 'mihai', heroName: 'Mihai Viteazul' }, { civ: 'oto', ai: false, team: 2 }], startAge: 3, reveal: 'tot', noBases: true, victory: 'scenariu', popMax: 300,
        mapSpec: { N: 72, season: 'vara', seed: 1595, ground: 'grass', amp: 1.5, ops: [
          ['forest', [[0, 0], [30, 0], [22, 18], [0, 24]], 0.65], ['forest', [[48, 72], [72, 48], [72, 72]], 0.65],
          ['forestc', 26, 27, 5, 0.7], ['forestc', 48, 49, 5, 0.7], ['forestc', 52, 22, 4, 0.6], ['clear', 36, 38, 9]
        ] } },
      setup: function (S, T) {
        T.bld(0, 'fortareata', 18, 50, true); T.bld(1, 'cetate', 50, 16, true);
        T.spawn(0, [['kni2', 10], ['vit', 8], ['mil3', 12], ['arc2', 10], ['lcv2', 6]], 30, 45, 'a');
        T.spawn(0, [['hero', 1]], 32, 43, 'a');
        T.spawn(1, [['ien', 12], ['kni', 10], ['mil2', 12], ['arc2', 10], ['can', 2]], 43, 31, 'b');
        T.attackMove(T.byTag('a'), 46, 28); T.attackMove(T.byTag('b'), 27, 47);
        keep(S);
      },
      pre: 3.2,
      events: [],
      cam: [[36.5, 38.5, 2.05], [37.5, 37.5, 1.6]]
    }
  };

  // ---------- pregătirea ----------
  var imgs = {}, bufs = {}, cv = null, g = null, W = 0, H = 0, DPR = 1, shot = -1, shotT = 0, shotDur = 0, src = null, onEnd = null, scene = null, sceneT = 0, rec = null, chunks = [];
  function loadImg(k) {
    if (imgs[k]) return imgs[k];
    var im = new Image(); im.src = 'assets/poze/' + k + '.webp'; imgs[k] = im; return im;
  }
  function decode(k) {
    var A = G.Audio; if (bufs[k] !== undefined || !A.ac || !G.NAR['film_' + k]) return Promise.resolve();
    bufs[k] = null;
    var b64 = G.NAR['film_' + k].split(',')[1], bin = atob(b64), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Promise(function (res) { A.ac.decodeAudioData(arr.buffer, function (b) { bufs[k] = b; res(); }, function () { res(); }); });
  }
  function needNar() {
    if (G.NAR && G.NAR.film_c1) return Promise.resolve();
    return new Promise(function (res) { var s = document.createElement('script'); s.src = 'js/nar/film.js' + (G.VER ? '?v=' + G.VER : ''); s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }
  var prepQ = [];
  function prep(name) {
    var sc = SCENES[name];
    scene = { name: name, sc: sc, ev: 0, ready: false };
    prepQ = [
      function () { G.newGame(JSON.parse(JSON.stringify(sc.opts))); sc.setup(G.S, G.Trig); if (G.refreshLists) G.refreshLists(); G.R.preloadBaked(); G.R.preloadBld(); },
      function () { G.Terrain.build(); G.Terrain.fogUpdate(); },
      function () { if (G.TerrainGL) { G.TerrainGL.build(); G.TerrainGL.fogUpdate(); } },
      function () { var c0 = sc.cam[0]; G.cam.x = c0[0]; G.cam.y = c0[1]; G.cam.z = c0[2]; for (var t = 0; t < sc.pre; t += 0.05) G.update(0.05); scene.ready = true; }
    ];
  }
  // un pas de pregătire pe cadru; când scena e gata, o desenăm ascuns (sub film), ca bucățile de teren să fie gata la tăietură
  function prepStep() {
    if (prepQ.length) { prepQ.shift()(); return; }
    if (scene && scene.ready && SHOTS[shot].k !== 'game') { var c0 = scene.sc.cam[0]; G.cam.x = c0[0]; G.cam.y = c0[1]; G.cam.z = c0[2]; G.R.frame(0); }
  }

  // ---------- pornirea și oprirea ----------
  Cine.FILMS = FILMS;
  Cine.play = function (opt) {
    if (Cine.active) return;
    opt = opt || {};
    SHOTS = FILMS[opt.film] || FILMS.zugravul;
    Cine.film = FILMS[opt.film] ? opt.film : 'zugravul';
    onEnd = opt.onEnd || null;
    Cine.active = true; G.cine = true; G.demo = false;
    if (G.Audio.on) G.Audio.unlock();
    if (G.Music) { if (G.Music.setCiv) G.Music.setCiv('mol'); if (G.Music.setAge) G.Music.setAge(3); }
    SHOTS.forEach(function (s) { if (s.img) loadImg(s.img); });
    cv = document.createElement('canvas'); cv.id = 'cineCv';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:90;background:#000;cursor:pointer';
    document.body.appendChild(cv); g = cv.getContext('2d');
    var skip = document.createElement('button'); skip.id = 'cineSkip'; skip.textContent = 'Treci peste ▶▶';
    skip.style.cssText = 'position:fixed;right:18px;bottom:16px;z-index:91;padding:7px 14px;border-radius:7px;border:1px solid #8a6a3a;background:#1a120acc;color:#f3ead6;font:14px system-ui;opacity:0.75';
    if (!opt.record) document.body.appendChild(skip);
    var stop = function (e) { if (e && e.type === 'keydown' && e.key !== 'Escape' && e.key !== ' ' && e.key !== 'Enter') return; Cine.stop(); };
    skip.onclick = stop; cv.onclick = stop; document.addEventListener('keydown', stop);
    Cine._stopKey = stop;
    resize(); window.addEventListener('resize', resize);
    var keys = SHOTS.filter(function (x) { return x.line; }).map(function (x) { return x.line; });
    SHOTS.forEach(function (x) { if (x.img2) loadImg(x.img2); });
    var ready = needNar().then(function () { return Promise.all(keys.map(decode)); });
    // aceeași pictură poate apărea de două ori (finalul și titlul): așteptăm fiecare imagine o singură dată
    var keysI = [].concat.apply([], SHOTS.map(function (s) { return [s.img, s.img2].filter(Boolean); })).filter(function (k, i, a) { return a.indexOf(k) === i; });
    var imgsOk = Promise.all(keysI.map(function (k) { var im = loadImg(k); return im.complete ? 0 : new Promise(function (r) { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }); }));
    shot = -1; Cine.started = false;
    return Promise.all([ready, imgsOk, new Promise(function (r) { setTimeout(r, 400); })]).then(function () {
      if (!Cine.active) return;
      if (opt.record) startRec();
      SHOTS.forEach(function (x) { delete x._sfx; });
      Cine.started = true; next();
    });
  };
  Cine.stop = function () {
    if (!Cine.active) return;
    Cine.active = false; G.cine = false;
    if (src) { try { src.stop(); } catch (e) {} src = null; }
    if (G.Music && G.Music.setMood) G.Music.setMood('peace');
    if (G.Coloana) G.Coloana.setDuck(1);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', Cine._stopKey);
    var sk = document.getElementById('cineSkip'); if (sk) sk.remove();
    var done = function () { if (cv) { cv.remove(); cv = null; } scene = null; try { localStorage.setItem('scm_film', '1'); } catch (e) {} if (onEnd) onEnd(); };
    if (rec && rec.state !== 'inactive') { rec.onstop = function () { Cine.video = new Blob(chunks, { type: rec.mimeType }); done(); }; rec.stop(); }
    else done();
  };
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    if (cv) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    if (G.R && G.R.resize) G.R.resize();
  }
  function next() {
    if (src) { try { src.stop(); } catch (e) {} src = null; }
    shot++;
    if (shot >= SHOTS.length) { Cine.stop(); return; }
    var s = SHOTS[shot], b = s.line ? bufs[s.line] : null;
    shotT = 0; shotDur = Math.max(s.min, b ? b.duration + (s.quick ? 0.7 : 1.6) : s.min);
    if (s.mood && G.Music && G.Music.setMood) G.Music.setMood(s.mood);
    // coloana sonoră: trailerul are piesa lui; filmul de început trece din liniște în luptă, iar titlul vine cu tema
    if (G.Coloana) {
      if (Cine.film === 'trailer') { if (shot === 0) G.Coloana.set('trailer'); }
      else if (s.k === 'title') G.Coloana.set('tema');
      else if (s.mood) G.Coloana.set(s.mood === 'battle' ? 'film_lupta' : 'film');
      G.Coloana.setDuck(b ? 0.5 : 1);
    }
    if (s.prep) prep(s.prep);
    if (s.k === 'game') { if (!scene || scene.name !== s.scene) prep(s.scene); while (prepQ.length) prepQ.shift()(); sceneT = 0; }
    if (s.k === 'title' && G.sfx) setTimeout(function () { G.sfx('age'); }, 600);
    if (b && G.Audio.ac && G.Audio.master) {
      var A = G.Audio, gn = A.ac.createGain(); gn.gain.value = 1.6;
      src = A.ac.createBufferSource(); src.buffer = b; src.connect(gn); gn.connect(A.master);
      src.start(A.ac.currentTime + (s.quick ? 0.15 : 0.6));
    }
  }

  // ---------- fiecare cadru ----------
  Cine.tick = function (dt) {
    if (!Cine.active || !g) return;
    if (!Cine.started) { g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); return; }
    shotT += dt;
    var s = SHOTS[shot]; if (!s) return;
    if (s.k !== 'game') prepStep();
    var p = Math.min(1, shotT / shotDur), e = p * p * (3 - 2 * p), w = cv.width, h = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    if (s.k === 'pic' || s.k === 'title') drawPic(imgs[s.img], s.kb, e, s.k === 'title' ? 0.5 : 1, s.kf);
    else if (s.k === 'morph') drawMorph(s, p, e);
    else if (s.k === 'hero') drawHero(s, e);
    else if (s.k === 'game' && scene) {
      var sc = scene.sc;
      while (scene.ev < sc.events.length && sceneT >= sc.events[scene.ev][0]) { sc.events[scene.ev][1](G.Trig); scene.ev++; }
      sceneT += dt;
      var sim = dt * 0.9; while (sim > 1e-6) { var st = Math.min(0.05, sim); G.update(st); sim -= st; }
      var a = sc.cam[0], b2 = sc.cam[1];
      G.cam.x = a[0] + (b2[0] - a[0]) * e; G.cam.y = a[1] + (b2[1] - a[1]) * e; G.cam.z = a[2] + (b2[2] - a[2]) * e;
      G.R.frame(dt);
      var gcv = document.getElementById('cv'); g.drawImage(gcv, 0, 0, gcv.width, gcv.height, 0, 0, w, h);
      var vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
    }
    if (s.k === 'title') drawTitle(Math.min(1, shotT / 2.2));
    // benzile negre de film și subtitrarea
    var bar = Math.round(h * 0.085);
    g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, w, bar); g.fillRect(0, h - bar, w, bar);
    if (s.line && TXT[s.line] && shotT > 0.5) subtitle(TXT[s.line], h - bar * 0.5, Math.min(1, (shotT - 0.5) / 0.5) * Math.min(1, (shotDur - shotT) / 0.5));
    // trecerea prin negru între cadre (la portrete, mai repede)
    var fd = s.quick ? 0.22 : 0.65, fa = Math.min(1, s.flashIn ? 1 : shotT / fd, s.flashOut ? 1 : (shotDur - shotT) / fd);
    if (shot === 0) fa = Math.min(fa, shotT / 1.6);
    if (fa < 1) { g.globalAlpha = 1 - Math.max(0, fa); g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.globalAlpha = 1; }
    if (s.flashIn && shotT < 0.6) { g.fillStyle = 'rgba(255,248,235,' + (1 - shotT / 0.6) + ')'; g.fillRect(0, 0, w, h); }
    if (shotT >= shotDur) next();
  };
  // pictura, acoperind cadrul, cu mișcarea lentă (Ken Burns)
  function drawPic(im, kb, e, dim, kf) {
    if (!im || !im.naturalWidth) return;
    var w = cv.width, h = cv.height, k = kb || [1, 0, 0, 1.1, 0, 0];
    if (kf) {
      // punctul (fx, fy) al picturii ține mijlocul ecranului, fără margini goale
      var zf = kf[0] + (kf[3] - kf[0]) * e, fx = kf[1] + (kf[4] - kf[1]) * e, fy = kf[2] + (kf[5] - kf[2]) * e;
      var sf = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zf, dwf = im.naturalWidth * sf, dhf = im.naturalHeight * sf;
      var xf = Math.min(0, Math.max(w - dwf, w / 2 - fx * dwf)), yf = Math.min(0, Math.max(h - dhf, h / 2 - fy * dhf));
      g.drawImage(im, xf + (Cine.shake || 0) * w, yf, dwf, dhf);
      if (dim < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - dim) + ')'; g.fillRect(0, 0, w, h); }
      return;
    }
    var z = k[0] + (k[3] - k[0]) * e, ox = k[1] + (k[4] - k[1]) * e, oy = k[2] + (k[5] - k[2]) * e;
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * z, dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    g.drawImage(im, (w - dw) / 2 + ox * w, (h - dh) / 2 + oy * h, dw, dh);
    if (dim < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - dim) + ')'; g.fillRect(0, 0, w, h); }
  }
  // fresca prinde viață: aceeași compoziție trece din frescă în pictură, se cutremură, apoi un fulger alb taie spre bătălie
  function drawMorph(s, p, e) {
    Cine.shake = p > 0.62 ? (Math.random() - 0.5) * 0.006 * (p - 0.62) / 0.38 : 0;
    drawPic(imgs[s.img], null, e, 1, s.kf);
    var m = Math.max(0, Math.min(1, (p - 0.32) / 0.45)); m = m * m * (3 - 2 * m);
    if (m > 0) { g.globalAlpha = m; drawPic(imgs[s.img2], null, e, 1, s.kf); g.globalAlpha = 1; }
    Cine.shake = 0;
    if (p > 0.45 && !s._sfx) { s._sfx = 1; if (G.Music && G.Music.setMood) G.Music.setMood('battle'); if (G.Coloana) G.Coloana.set('film_lupta'); if (G.sfx) G.sfx('horn2'); }
    if (s.flashOut && p > 0.9) { g.fillStyle = 'rgba(255,248,235,' + Math.min(1, (p - 0.9) / 0.1) + ')'; g.fillRect(0, 0, cv.width, cv.height); }
  }
  // portretul: fundal din aceeași pictură, încețoșat; chipul în dreapta, numele în stânga
  function drawHero(s, e) {
    var im = imgs[s.img], w = cv.width, h = cv.height;
    if (!im || !im.naturalWidth) return;
    g.save(); g.filter = 'blur(' + Math.round(h * 0.02) + 'px) brightness(0.42)';
    var sb = Math.max(w / im.naturalWidth, h / im.naturalHeight) * 1.15; g.drawImage(im, (w - im.naturalWidth * sb) / 2, (h - im.naturalHeight * sb) / 2, im.naturalWidth * sb, im.naturalHeight * sb);
    g.restore();
    var sh = h * 0.86 / im.naturalHeight * (1 + 0.05 * e), dw = im.naturalWidth * sh, dh = im.naturalHeight * sh, x = w * 0.66 - dw / 2, y = (h - dh) / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = h * 0.04; g.drawImage(im, x, y, dw, dh); g.restore();
    g.strokeStyle = 'rgba(214,170,90,0.85)'; g.lineWidth = Math.max(2, h * 0.004); g.strokeRect(x, y, dw, dh);
    var a = Math.min(1, shotT / 0.5), fs = Math.round(h * 0.075);
    g.globalAlpha = a; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = 'bold ' + fs + 'px Georgia, "Times New Roman", serif'; g.fillStyle = '#f3d27a'; g.shadowColor = '#000'; g.shadowBlur = fs * 0.3;
    g.fillText(s.name, w * 0.07, h * 0.47);
    g.font = Math.round(fs * 0.34) + 'px Georgia, serif'; g.fillStyle = '#e8dcc0'; g.fillText(s.years, w * 0.07 + 2, h * 0.47 + fs * 0.85);
    g.shadowBlur = 0; g.globalAlpha = 1;
  }
  function drawTitle(a) {
    var w = cv.width, h = cv.height, fs = Math.round(Math.min(w * 0.085, h * 0.15));
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold ' + fs + 'px Georgia, "Times New Roman", serif';
    g.shadowColor = 'rgba(200,120,30,0.65)'; g.shadowBlur = fs * 0.35;
    var gr = g.createLinearGradient(0, h * 0.4 - fs / 2, 0, h * 0.4 + fs / 2); gr.addColorStop(0, '#fff1c0'); gr.addColorStop(0.55, '#e8b44a'); gr.addColorStop(1, '#9a6420');
    g.fillStyle = gr; g.fillText('AGE OF EMPIRES', w / 2, h * 0.42);
    g.shadowBlur = 0;
    var f2 = Math.round(fs * 0.55); g.font = 'bold ' + f2 + 'px Georgia, serif';
    var txt = 'R O M Â N I A', tw = g.measureText(txt).width, x0 = w / 2 - tw / 2;
    var tri = g.createLinearGradient(x0, 0, x0 + tw, 0); tri.addColorStop(0, '#2f5fc8'); tri.addColorStop(0.333, '#2f5fc8'); tri.addColorStop(0.334, '#f2c94a'); tri.addColorStop(0.666, '#f2c94a'); tri.addColorStop(0.667, '#d23a2e'); tri.addColorStop(1, '#d23a2e');
    g.fillStyle = tri; g.fillText(txt, w / 2, h * 0.42 + fs * 0.95);
    g.restore();
  }
  function subtitle(t, y, a) {
    var w = cv.width, h = cv.height, fs = Math.round(Math.max(14 * DPR, h * 0.03));
    g.save(); g.globalAlpha = Math.max(0, a); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'italic ' + fs + 'px Georgia, "Times New Roman", serif'; g.fillStyle = '#f1e6cc';
    // pe două rânduri, dacă e lung
    var words = t.split(' '), lines = [''], maxW = w * 0.8;
    words.forEach(function (wd) { var test = (lines[lines.length - 1] + ' ' + wd).trim(); if (g.measureText(test).width > maxW && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = test; });
    var lh = fs * 1.25, y0 = y - (lines.length - 1) * lh / 2 - (lines.length > 1 ? h * 0.004 : 0);
    lines.forEach(function (ln, i) { g.fillText(ln, w / 2, y0 + i * lh); });
    g.restore();
  }

  // ---------- înregistrarea (trailerul) ----------
  function startRec() {
    var A = G.Audio, vs = cv.captureStream(30), tracks = vs.getVideoTracks().slice();
    if (A.ac && A.master) { var dst = A.ac.createMediaStreamDestination(); A.master.connect(dst); dst.stream.getAudioTracks().forEach(function (t) { tracks.push(t); }); }
    var types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'], type = types.find(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); });
    chunks = []; rec = new MediaRecorder(new MediaStream(tracks), { mimeType: type, videoBitsPerSecond: 8000000 });
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.start(1000);
  }
})();
