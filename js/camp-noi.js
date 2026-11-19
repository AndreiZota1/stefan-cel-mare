// Misiuni noi pentru ceilalți eroi: Vlad (campania de iarnă de la Dunăre), Mehmed (Smederevo),
// Jagiello (asediul Marienburgului), Mengli Giray (căderea Saraiului).
var G = globalThis.G || (globalThis.G = {});
G.MISSIONS = G.MISSIONS || {};
G.CAMPAIGNS = G.CAMPAIGNS || [];

(function () {
  'use strict';
  var M = G.MISSIONS;
  function town(T, o, x, y, vils, tag) { var b = T.bld(o, 'cetate', x - 2, y - 2, true, tag); if (vils) T.spawn(o, [['vil', vils]], x + 1, y + 3); return b; }
  function heroAt(T, o, x, y) { return T.spawn(o, [['hero', 1]], x, y)[0]; }
  function named(units, name) { units.forEach(function (u) { u.name = name; }); return units; }
  function clock(s) { s = Math.max(0, Math.ceil(s)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }

  // ===================== VLAD: IARNA PE DUNĂRE (1462) =====================
  M.vl4 = {
    id: 'vl4', title: 'Iarna pe Dunăre', short: 'Iarna pe Dunăre', year: '1462', place: 'Giurgiu, Turtucaia și Nicopole', lon: 25.97, lat: 43.9,
    view: { lon: 25.8, lat: 44.1, z: 2.0 }, night: 0.45,
    arrows: [{ pts: [[25.46, 44.93], [25.8, 44.4], [25.97, 43.9]], col: '#1c4fa0', t0: 1, t1: 7 }, { pts: [[25.97, 43.9], [26.6, 44.0], [27.26, 44.11]], col: '#1c4fa0', t0: 8, t1: 12 }],
    intro: [
      'Iarna anului 1462. Sultanul îi cere lui Vlad birul și o mie de băieți pentru ieniceri. Apoi îi trimite pe Hamza Bei să-l prindă prin vicleșug, la o întâlnire lângă Giurgiu.',
      'Vlad află de capcană și o întoarce împotriva lor. Apoi trece Dunărea înghețată și arde cetățile turcești de pe mal, de la Giurgiu până spre mare.',
      'Prinde-i pe Hamza Bei și pe oamenii lui în pădure, apoi treci gheața și dă foc celor trei cetăți de pe malul turcesc.'
    ],
    outro: [
      'Într-o scrisoare către regele Matia, Vlad număra peste douăzeci de mii de turci și bulgari uciși în acea iarnă, de la Zimnicea până la mare. Hamza Bei a fost tras în țeapă, cel mai sus dintre toți.',
      'Mehmed al II-lea a înțeles că nu mai are un vasal la nord de Dunăre, ci un dușman. În primăvară, a pornit el însuși spre Țara Românească.'
    ],
    players: [{ civ: 'val', team: 1 }, { civ: 'oto', team: 2, heroName: 'Hamza Bei', aiMode: 'static', techs: ['up_mil2', 'up_arc2'] }],
    map: { N: 96, season: 'iarna', seed: 1462, ground: 'grass', ops: [
      ['river', [[-2, 50], [30, 46], [60, 52], [98, 48]], 5, { fords: [[20, 47], [50, 50], [82, 49]] }],
      ['forest', [[20, 18], [44, 14], [52, 30], [30, 36], [16, 30]], 0.65], ['forest', [[60, 4], [90, 0], [96, 26], [70, 26]], 0.55],
      ['forest', [[0, 0], [16, 0], [10, 30], [0, 34]], 0.55],
      ['road', [[30, 6], [36, 24], [42, 40], [50, 50], [56, 60]], 2],
      ['clear', 70, 12, 9], ['clear', 20, 72, 7], ['clear', 50, 80, 7], ['clear', 84, 70, 7],
      ['res', 'gold', 80, 10, 5], ['res', 'sheep', 62, 18, 5], ['res', 'berry', 84, 20, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 80, keepHero: 'Vlad a căzut pe gheața Dunării.',
    setup: function (S, T) {
      town(T, 0, 70, 12, 4); heroAt(T, 0, 64, 22);
      T.spawn(0, [['lcv', 10], ['vit', 6], ['arc', 8], ['mil', 6]], 60, 24);
      // cetățile turcești de pe malul de sud
      [[20, 72, 'Giurgiu'], [50, 80, 'Turtucaia'], [84, 70, 'Nicopole']].forEach(function (c) {
        var b = T.bld(1, 'turn', c[0], c[1], true, 'cetati'); b.name = c[2]; T.bld(1, 'casa', c[0] + 3, c[1] + 2, true); T.bld(1, 'casa', c[0] - 3, c[1] + 2, true);
        T.spawn(1, [['mil', 4], ['arc', 3]], c[0], c[1] + 4);
      });
      S.players[0].res = { f: 400, w: 300, g: 150, s: 50 };
    },
    start: function (S, T) {
      T.obj('o1', 'Prinde capcana lui Hamza Bei: nimicește-i oamenii pe drumul din pădure.');
      T.say('vlad', 'Hamza vrea să mă prindă ca pe un iepure. Să vadă cum e să fii vânat.', 'say1', 1);
      T.say('capitan', 'Drumul trece prin pădure, Doamne. Acolo îi așteptăm.', 'say2');
    },
    triggers: [
      { id: 'coloana', at: 45, do: function (S, T) {
        T.say('iscoada', 'Hamza Bei vine pe drum, cu ienicerii și cu grecul Katavolinos!', 'say3');
        var h = named(T.spawn(1, [['kni2', 1]], 54, 58, 'hamza'), 'Hamza Bei');
        var col = T.spawn(1, [['ien', 8], ['lcv', 6], ['mil', 6]], 54, 60, 'hamza');
        T.moveTo(h.concat(col), 64, 22);
      } },
      { id: 'o1', after: 'coloana', when: function (S, T) { return T.alive('hamza') === 0; }, do: function (S, T) {
        T.done('o1');
        T.obj('o2', 'Treci Dunărea înghețată și arde cele trei cetăți turcești (0/3).');
        T.say('vlad', 'Acum, peste gheață! Până în zori, malul lor trebuie să ardă.', 'say4');
      } },
      { id: 'o2', after: 'o1', when: function (S, T) {
        var v = S.scen.vars, n = 3 - T.alive('cetati');
        if (n !== v.n) { v.n = n; T.obj('o2', 'Treci Dunărea înghețată și arde cele trei cetăți turcești (' + n + '/3).'); }
        return n >= 3;
      }, do: function (S, T) { T.done('o2'); T.say('vlad', 'Malul turcesc arde de la un capăt la altul. Să afle sultanul cine e domn la nord de Dunăre.', 'say5'); T.win(); } }
    ]
  };

  // ===================== MEHMED: SMEDEREVO (1459) =====================
  M.me3 = {
    id: 'me3', title: 'Cetatea despoților', short: 'Smederevo', year: '1459', place: 'Smederevo, pe Dunăre', lon: 20.93, lat: 44.66,
    view: { lon: 21.4, lat: 43.9, z: 1.8 },
    arrows: [{ pts: [[26.56, 41.68], [24.0, 42.6], [21.9, 43.32], [20.93, 44.66]], col: '#a01818', t0: 1, t1: 9 }],
    intro: [
      'Primăvara anului 1459. Despotatul Serbiei, ultimul stat sârb, e sfâșiat de certuri după moartea bătrânului despot Gheorghe Branković.',
      'Mehmed al II-lea vine să-i pună capăt. Ținta lui e Smederevo, cetatea uriașă de pe Dunăre, cu douăzeci și cinci de turnuri, unde stau despoții.',
      'Sparge turnurile zidului dinspre uscat și ia cetatea înainte să sosească oastea ungurilor din Belgrad.'
    ],
    outro: [
      'Pe 20 iunie 1459, Smederevo s-a predat. Serbia medievală a încetat să mai existe și a devenit pentru aproape patru sute de ani o provincie a Imperiului Otoman.',
      'Mai rămânea un singur zid între sultan și inima Europei: Belgradul, pe care Iancu de Hunedoara îl apărase cu trei ani înainte.'
    ],
    players: [{ civ: 'oto', team: 1, heroName: 'Mehmed al II-lea' }, { civ: 'val', team: 2, ppl: 'sârbii', heroName: 'Despota Ștefan', heroVis: 'mircea', aiMode: 'defend', techs: ['up_mil2', 'up_arc2', 'zale1'], res: { f: 600, w: 600, g: 300, s: 300 } },
      { civ: 'ung', team: 2, ppl: 'ungurii', heroName: 'Mihai Szilágyi', aiMode: 'static', techs: ['up_mil2', 'up_kni2'] }],
    map: { N: 96, season: 'vara', seed: 1459, ground: 'grass', ops: [
      ['river', [[-2, 14], [40, 10], [70, 14], [98, 8]], 6],
      ['river', [[70, 14], [72, 40], [80, 70], [86, 98]], 2.2, { fords: [[76, 54]], bridges: [[72, 34]] }],
      ['forest', [[0, 30], [20, 28], [24, 60], [0, 64]], 0.55], ['forest', [[0, 80], [30, 76], [36, 96], [0, 96]], 0.55],
      ['road', [[40, 92], [44, 70], [50, 50], [54, 36]], 2],
      ['clear', 40, 86, 10], ['clear', 54, 30, 12],
      ['res', 'gold', 24, 70, 6], ['res', 'stone', 60, 82, 6], ['res', 'sheep', 36, 76, 6], ['res', 'berry', 52, 88, 5], ['res', 'gold', 92, 30, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 120, keepHero: 'Sultanul a căzut.',
    setup: function (S, T) {
      town(T, 0, 40, 86, 10); T.bld(0, 'atelier', 46, 80, true); T.bld(0, 'cazarma', 34, 80, true); T.bld(0, 'casa', 34, 90, true); T.bld(0, 'casa', 46, 92, true);
      heroAt(T, 0, 42, 76);
      T.spawn(0, [['ien', 10], ['mil2', 8], ['arc2', 8], ['kni', 6], ['can', 3], ['ram', 2]], 44, 72);
      // cetatea triunghiulară, între Dunăre și Jezava: zidul dinspre uscat are turnuri mari
      T.bld(1, 'fortareata', 54, 20, true, 'smederevo');
      T.wall(1, 40, 30, 66, 30, [13], 'zid'); T.wall(1, 40, 18, 40, 29, [], 'zid'); T.wall(1, 66, 18, 66, 29, [], 'zid');
      [[42, 32], [48, 32], [54, 32], [60, 32], [64, 32]].forEach(function (p) { var b = T.bld(1, 'turn', p[0], p[1], true, 'turnuri'); b.name = 'Turnul despotului'; });
      T.bld(1, 'cazarma', 44, 20, true); T.bld(1, 'casa', 60, 22, true);
      T.spawn(1, [['vil', 5]], 50, 24);
      T.near(1, 'moara', 50, 22, 6); T.near(1, 'ogor', 47, 25, 7); T.near(1, 'ogor', 53, 26, 7); T.near(1, 'ogor', 47, 20, 7); T.near(1, 'ogor', 53, 20, 7);
      T.spawn(1, [['mil2', 8], ['arc2', 8], ['spr2', 6], ['kni', 4]], 52, 26);
      S.players[0].res = { f: 800, w: 800, g: 600, s: 400 };
    },
    start: function (S, T) {
      T.obj('o1', 'Dărâmă turnurile zidului dinspre uscat (0/5).');
      T.obj('o2', 'Ia cetatea: dărâmă fortăreața despoților.');
      T.say('mehmed', 'Serbia se ceartă, iar eu nu aștept. Tunurile la zid! Folosiți bateria.', 'say1', 1);
    },
    timer: function (S) { return S.scen.fired.unguri ? 0 : Math.max(0, 720 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars, n = 5 - T.alive('turnuri');
      if (n !== v.n) { v.n = n; T.obj('o1', 'Dărâmă turnurile zidului dinspre uscat (' + Math.max(0, n) + '/5).'); if (n >= 5) T.done('o1'); }
      if (!T.alive('smederevo') && !T.isDone('o2')) { T.done('o2'); T.say('mehmed', 'Smederevo e al meu. Despotatul nu mai există.', 'say3'); }
      if (T.isDone('o2') && !v.won) { v.won = 1; T.done('o1'); T.win(); }
    },
    triggers: [{ id: 'unguri', at: 720, do: function (S, T) {
      T.say('ienicer', 'Ungurii din Belgrad trec râul Jezava! Vin să-i ajute pe sârbi!', 'say2');
      heroAt(T, 2, 90, 60); T.wave(2, [['kni2', 8], ['hus', 6], ['arc2', 6], ['mil2', 8]], [90, 62], [42, 76], 'unguri');
    } }]
  };

  // ===================== JAGIELLO: MARIENBURG (1410) =====================
  M.pl2 = {
    id: 'pl2', title: 'Asediul Marienburgului', short: 'Marienburg', year: '1410', place: 'Marienburg (Malbork)', lon: 19.03, lat: 54.04,
    view: { lon: 20.0, lat: 53.6, z: 1.8 },
    arrows: [{ pts: [[20.1, 53.48], [19.6, 53.8], [19.03, 54.04]], col: '#1c4fa0', t0: 1, t1: 7 }],
    intro: [
      'Iulie 1410. După Grunwald, drumul spre capitala Ordinului e deschis. Jagiello ajunge la Marienburg, cel mai mare castel de cărămidă din lume.',
      'În castel s-a închis Heinrich von Plauen, cu ultimii cavaleri. Din nord, cavalerii livonieni vin în ajutor.',
      'Ia orașul de lângă castel, oprește oastea livonienilor și ține asediul până când Ordinul cere pace.'
    ],
    outro: [
      'Castelul Marienburg n-a căzut: zidurile lui erau prea groase pentru tunurile vremii. Dar Ordinul era sleit. În 1411, la Toruń, cavalerii au semnat pacea și au plătit o despăgubire uriașă.',
      'Puterea Ordinului Teuton era frântă pentru totdeauna. Polonia și Lituania deveneau stăpânele estului Europei.'
    ],
    players: [{ civ: 'pol', team: 1, heroName: 'Vladislav Jagiello' }, { civ: 'ung', team: 2, ppl: 'cavalerii teutoni', heroName: 'Heinrich von Plauen', aiMode: 'defend', techs: ['up_mil2', 'up_mil3', 'up_kni2', 'forja', 'zale1'], res: { f: 800, w: 800, g: 400, s: 400 } }],
    map: { N: 96, season: 'vara', seed: 1411, ground: 'grass', ops: [
      ['river', [[30, -2], [26, 30], [24, 60], [30, 98]], 4, { fords: [[25, 70]] }],
      ['forest', [[60, 0], [96, 0], [96, 30], [70, 26]], 0.55], ['forest', [[76, 60], [96, 56], [96, 96], [70, 96]], 0.55],
      ['road', [[70, 90], [60, 70], [50, 50], [40, 36]], 2],
      ['clear', 64, 84, 10], ['clear', 42, 34, 12],
      ['res', 'gold', 84, 44, 6], ['res', 'stone', 52, 92, 6], ['res', 'sheep', 58, 78, 6], ['res', 'berry', 76, 80, 5]
    ] },
    startAge: 2, maxAge: 3, popMax: 120, keepHero: 'Regele a căzut sub zidurile Marienburgului.',
    setup: function (S, T) {
      town(T, 0, 64, 84, 10); T.bld(0, 'atelier', 70, 78, true); T.bld(0, 'casa', 58, 88, true); T.bld(0, 'casa', 70, 90, true);
      heroAt(T, 0, 60, 74);
      T.spawn(0, [['cpl', 8], ['kni', 6], ['mil2', 10], ['arc', 10], ['spr', 6], ['ram', 2], ['cat', 2]], 58, 70);
      // castelul (nu poate fi luat) și orașul de lângă el
      T.bld(1, 'fortareata', 34, 20, true, 'castel');
      T.wall(1, 30, 28, 52, 28, [], 'zid'); T.wall(1, 52, 14, 52, 27, [], 'zid');
      T.bld(1, 'cetate', 44, 40, true, 'oras'); T.bld(1, 'turn', 40, 46, true, 'oras'); T.bld(1, 'turn', 52, 44, true, 'oras'); T.bld(1, 'casa', 38, 38, true, 'oras'); T.bld(1, 'casa', 50, 38, true, 'oras');
      heroAt(T, 1, 40, 24);
      T.spawn(1, [['kni2', 6], ['mil2', 8], ['arc2', 8]], 44, 34);
      S.players[0].res = { f: 700, w: 700, g: 400, s: 200 };
    },
    start: function (S, T) {
      T.obj('o1', 'Ia orașul de lângă castel.');
      T.say('jagiello', 'Castelul e prea tare pentru noi. Dar orașul nu. Să-i strângem pe cavaleri în cușca lor de cărămidă.', 'say1', 1);
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (T.alive('oras') === 0 && !T.isDone('o1')) {
        T.done('o1'); v.t2 = S.t + 360;
        T.obj('o2', 'Oprește oastea livonienilor și ține asediul până cere Ordinul pace (6:00).');
        T.say('jagiello', 'Orașul e al nostru. Acum ținem castelul strâns până se predau la masa păcii.', 'say2');
      }
      if (v.t2 && !v.liv && S.t > v.t2 - 330) { v.liv = 1; T.say('iscoada', 'Cavalerii livonieni vin dinspre nord să spargă asediul!', 'say3'); T.wave(1, [['kni2', 8], ['mil2', 8], ['arc2', 6]], [88, 4], [60, 74], 'liv'); }
      if (v.t2 && !T.isDone('o2')) {
        var left = v.t2 - S.t;
        if (Math.ceil(left) !== v.ll) { v.ll = Math.ceil(left); T.obj('o2', 'Oprește oastea livonienilor și ține asediul până cere Ordinul pace (' + clock(left) + ').'); }
        if (left <= 0) { T.done('o2'); T.say('plauen', 'Ordinul cere pace. Dar Marienburgul n-a căzut, să se știe!', 'say4'); if (!v.won) { v.won = 1; T.win(); } }
      }
    },
    triggers: []
  };

  // ===================== MENGLI GIRAY: SARAI (1502) =====================
  M.ta2 = {
    id: 'ta2', title: 'Căderea Saraiului', short: 'Sarai', year: '1502', place: 'Sarai, pe Volga', lon: 45.8, lat: 47.3,
    view: { lon: 41.5, lat: 47.4, z: 1.2 },
    arrows: [{ pts: [[33.86, 44.75], [36.0, 46.2], [40.0, 47.0], [44.0, 47.4], [45.8, 47.3]], col: '#1c4fa0', t0: 1, t1: 10 }],
    intro: [
      'Anul 1502. Din Hoarda de Aur, care a stăpânit odinioară jumătate de lume, a mai rămas Hoarda Mare, cu capitala la Sarai, pe Volga.',
      'Hanul ei, Șeih Ahmed, i-a stat mereu în cale lui Mengli Giray. Acum, Mengli strânge călăreții Crimeii și pornește spre răsărit, peste stepă.',
      'Înfrânge oastea Hoardei Mari și arde Saraiul: cortul hanului și iurtele din jurul lui.'
    ],
    outro: [
      'În 1502, oastea lui Mengli Giray a zdrobit Hoarda Mare, iar Saraiul a fost ars. Așa s-a sfârșit, după aproape trei sute de ani, urmașa Hoardei de Aur a lui Batu Han.',
      'Mengli Giray și-a luat titlul de mare han. Hanatul Crimeii a rămas cea mai mare putere a stepei, încă aproape trei veacuri.'
    ],
    players: [{ civ: 'tat', team: 1 }, { civ: 'tat', team: 2, ppl: 'Hoarda Mare', heroName: 'Șeih Ahmed', aiMode: 'defend', res: { f: 600, w: 400, g: 300, s: 100 } }],
    map: { N: 96, season: 'vara', seed: 1502, ground: 'grass', ops: [
      ['river', [[80, -2], [84, 30], [78, 60], [86, 98]], 5, { fords: [[83, 20], [80, 62]] }],
      ['sand', [[40, 30], [70, 26], [74, 50], [44, 56]]],
      ['lake', 30, 60, 4, 3], ['marsh', 30, 60, 6, 5],
      ['forestc', 14, 30, 5, 0.5], ['forestc', 60, 86, 5, 0.5],
      ['clear', 16, 82, 10], ['clear', 62, 22, 12],
      ['res', 'sheep', 26, 76, 8], ['res', 'gold', 34, 88, 5], ['res', 'berry', 10, 70, 5], ['res', 'sheep', 46, 70, 6]
    ] },
    startAge: 2, maxAge: 3, popMax: 110, keepHero: 'Mengli Giray a căzut.',
    setup: function (S, T) {
      town(T, 0, 16, 82, 6); T.bld(0, 'casa', 10, 86, true); T.bld(0, 'casa', 22, 88, true);
      heroAt(T, 0, 22, 74);
      T.spawn(0, [['nog', 12], ['lcv', 10], ['har', 8], ['mil', 6]], 24, 70);
      T.bld(1, 'cetate', 60, 18, true, 'cort');
      [[52, 14], [68, 14], [52, 26], [68, 28], [58, 32], [64, 8]].forEach(function (p) { T.bld(1, 'casa', p[0], p[1], true, 'iurte'); });
      heroAt(T, 1, 60, 26);
      T.spawn(1, [['nog2', 8], ['lcv2', 8], ['har', 8], ['mil2', 6]], 56, 40, 'hoarda');
      S.players[0].res = { f: 600, w: 300, g: 300, s: 0 };
    },
    start: function (S, T) {
      T.obj('o1', 'Înfrânge oastea Hoardei Mari.');
      T.obj('o2', 'Arde Saraiul: cortul hanului și iurtele din jur (0/7).');
      T.say('mengli', 'Hoarda de Aur a fost a strămoșilor noștri. Azi se încheie. Năvala!', 'say1', 1);
    },
    tick: function (S, T) {
      var v = S.scen.vars, n = 7 - T.alive('iurte') - T.alive('cort');
      if (n !== v.n) { v.n = n; T.obj('o2', 'Arde Saraiul: cortul hanului și iurtele din jur (' + Math.max(0, n) + '/7).'); if (n >= 7) T.done('o2'); }
      if (S.t > 5 && T.alive('hoarda') <= 2 && !T.isDone('o1')) {
        T.done('o1'); var a = G.heroOf(1);
        if (a) { T.say('ahmed', 'Totul e pierdut! Fugiți spre Astrahan!', 'say3'); T.vanish([a]); }
      }
      if (T.isDone('o1') && T.isDone('o2') && !v.won) { v.won = 1; T.say('mengli', 'Saraiul arde. Sunt marele han al stepei.', 'say4'); T.win(); }
    },
    triggers: [{ id: 'atac', at: 200, do: function (S, T) { T.say('bei', 'Călăreții lui Ahmed vin peste noi, Doamne!', 'say2'); T.attackMove(T.byTag('hoarda'), 22, 74); } }]
  };

  // în campaniile lor, în ordinea vremii
  function add(cid, id, before) {
    var c = G.CAMPAIGNS.find(function (x) { return x.id === cid; }); if (!c || c.scen.indexOf(id) >= 0) return;
    var i = before ? c.scen.indexOf(before) : -1;
    if (i >= 0) c.scen.splice(i, 0, id); else c.scen.push(id);
  }
  add('vlad', 'vl4', 'vl3'); add('mehmed', 'me3', 'me2'); add('jagiello', 'pl2'); add('mengli', 'ta2');
})();
