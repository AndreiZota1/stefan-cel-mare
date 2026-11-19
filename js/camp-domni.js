// Campaniile domnilor Țării Românești: Mircea cel Bătrân (1386–1418) și Mihai Viteazul (1593–1601).
var G = globalThis.G || (globalThis.G = {});
G.MISSIONS = G.MISSIONS || {};
G.CAMPAIGNS = G.CAMPAIGNS || [];

(function () {
  'use strict';
  var M = G.MISSIONS;
  function town(T, o, x, y, vils, tag) { var b = T.bld(o, 'cetate', x - 2, y - 2, true, tag); if (vils) T.spawn(o, [['vil', vils]], x + 1, y + 3); return b; }
  function heroAt(T, o, x, y) { return T.spawn(o, [['hero', 1]], x, y)[0]; }
  function named(units, name) { units.forEach(function (u) { u.name = name; }); return units; }
  function waveDone(S, T, tag) { return S.scen.vars['sp_' + tag] && T.alive(tag) === 0; }
  function tagAll(units, tag) { units.forEach(function (u) { u.tag = tag; }); return units; }
  // valuri la secunde fixe: plan = [[secunda, compoziție, de unde, încotro], ...]; numără câte au fost înfrânte
  function waves(S, T, plan, pfx, o, say) {
    var v = S.scen.vars, i = v[pfx] || 0;
    if (i < plan.length && S.t >= plan[i][0]) {
      v[pfx] = i + 1; v['sp_' + pfx + i] = 1;
      T.wave(o, plan[i][1], plan[i][2], plan[i][3], pfx + i);
      if (say) say(i);
    }
    var n = 0; for (var k = 0; k < plan.length; k++) if (waveDone(S, T, pfx + k)) n++;
    return n;
  }
  var MIRCEA = { civ: 'val', team: 1, heroName: 'Mircea cel Bătrân', heroVis: 'mircea', power: 'rovine' };
  var MIHAI = { civ: 'val', team: 1, heroName: 'Mihai Viteazul', heroVis: 'mihai', power: 'sarja' };

  // ===================== MIRCEA CEL BĂTRÂN =====================
  var W1 = [
    [150, [['mil', 8], ['arc', 4]], [56, 86], [46, 16]],
    [330, [['lcv', 6], ['mil', 6], ['arc', 4]], [56, 86], [46, 16]],
    [510, [['ien', 6], ['mil', 8], ['har', 4]], [56, 86], [46, 16]],
    [690, [['kni', 8], ['lcv', 6], ['ien', 6], ['arc', 4]], [56, 86], [46, 16]]
  ];
  M.mi1 = {
    id: 'mi1', title: 'Rovine', short: 'Rovine', year: '1395', place: 'Rovine, în mlaștinile Argeșului', lon: 25.2, lat: 44.4,
    view: { lon: 25.1, lat: 44.3, z: 2.4 },
    arrows: [{ pts: [[24.9, 43.72], [25.0, 43.95], [25.1, 44.2], [25.2, 44.4]], col: '#a01818', t0: 1, t1: 8 }],
    intro: [
      'Primăvara anului 1395. Sultanul Baiazid, pe care turcii îl numesc Fulgerul, trece Dunărea cu o oaste uriașă. Vrea să facă din Țara Românească un pașalâc, ca Bulgaria.',
      'Mircea cel Bătrân are mai puțini oameni, dar își cunoaște țara: pădurile, apele și mlaștinile pe care oamenii locului le numesc rovine.',
      'Ține oastea la adăpostul pădurii, lasă turcii să se împotmolească în mlaștină și lovește-i acolo. Printre ei luptă și vasalii creștini ai sultanului, ca Marko, craiul sârb.'
    ],
    outro: [
      'Bătălia de la Rovine a fost una dintre cele mai sângeroase ale vremii. Lăncile s-au frânt de atâta lovit, scrie un cronicar sârb. Craiul Marko și despotul Constantin Dragaș au căzut amândoi.',
      'Baiazid s-a retras peste Dunăre. Țara Românească nu a devenit pașalâc: a rămas o țară cu domnul ei, care plătea uneori bir, dar se conducea singură.'
    ],
    players: [MIRCEA, { civ: 'oto', team: 2, heroName: 'Baiazid Fulgerul', aiMode: 'static', techs: ['up_mil2', 'up_arc2'] }],
    map: { N: 96, season: 'vara', seed: 1395, ground: 'grass', ops: [
      ['forest', [[0, 0], [96, 0], [96, 22], [72, 28], [56, 26], [40, 28], [22, 26], [0, 30]], 0.62],
      ['forest', [[0, 34], [24, 32], [32, 42], [16, 46], [0, 46]], 0.72], ['forest', [[64, 34], [96, 30], [96, 46], [76, 46]], 0.72],
      ['marsh', 26, 52, 18, 6], ['marsh', 72, 54, 16, 6], ['marsh', 50, 58, 12, 6],
      ['river', [[-2, 64], [28, 61], [50, 66], [72, 62], [98, 66]], 1.6, { fords: [[52, 66], [18, 62], [84, 64]] }],
      ['road', [[47, 16], [49, 30], [51, 46], [52, 60], [55, 76], [57, 92]], 2],
      ['forest', [[0, 72], [24, 70], [30, 96], [0, 96]], 0.55], ['forest', [[82, 72], [96, 70], [96, 96], [76, 96]], 0.55],
      ['clear', 46, 13, 10], ['clear', 57, 85, 11],
      ['res', 'gold', 34, 12, 6], ['res', 'stone', 60, 10, 5], ['res', 'sheep', 38, 20, 6], ['res', 'berry', 58, 19, 6], ['res', 'gold', 12, 40, 5], ['res', 'relic', 84, 38, 1]
    ] },
    startAge: 1, maxAge: 2, popMax: 90, keepHero: 'Mircea a căzut. Țara rămâne fără domn.',
    setup: function (S, T) {
      town(T, 0, 46, 12, 6); T.bld(0, 'casa', 52, 9, true); T.bld(0, 'casa', 39, 9, true);
      heroAt(T, 0, 49, 20);
      T.spawn(0, [['arc', 10], ['mil', 8], ['spr', 6], ['lcv', 6], ['vit', 4]], 49, 24);
      T.bld(1, 'cetate', 55, 83, true, 'tabara'); T.bld(1, 'casa', 50, 88, true); T.bld(1, 'casa', 62, 88, true);
      heroAt(T, 1, 58, 81);
      T.spawn(1, [['ien', 6], ['kni', 4]], 60, 80, 'garda');
      S.players[0].res = { f: 400, w: 500, g: 200, s: 100 };
    },
    start: function (S, T) {
      T.obj('o1', 'Oprește valurile lui Baiazid în mlaștini (0/4).');
      T.obj('o2', 'Craiul Marko, vasalul sârb al sultanului, trebuie să cadă.', { sec: 1 });
      T.say('mircea', 'Să vină. Pădurea e a noastră, iar mlaștina le va ține caii în loc.', 'say1', 1);
      T.say('capitan', 'Arcașii stau la marginea pădurii, Doamne. Când turcii intră în rovine, îi ploaie cu săgeți.', 'say2');
      T.say('mircea', 'Și când se împotmolesc, le arătăm ce înseamnă Rovinele.', 'say3');
    },
    tick: function (S, T) {
      var beaten = waves(S, T, W1, 'w', 1, function (i) {
        if (i === 3) T.say('iscoada', 'Vine însuși Baiazid cu spahiii și ienicerii! E ultima lor năvală!', 'say5');
        else T.say('iscoada', 'Turcii coboară spre mlaștină, pe drumul de la Dunăre!', 'say4');
        if (i === 1) {
          var mk = named(T.spawn(1, [['kni2', 1]], 58, 86, 'marko'), 'Craiul Marko');
          T.spawn(1, [['kni', 5]], 58, 87, 'w1').forEach(function (u) { u.name = 'Călăreț sârb'; });
          T.attackMove(T.byTag('w1').concat(mk), 46, 16);
          T.say('marko', 'Slujesc sultanului, dar mă rog ca creștinii să biruiască. Și eu să cad primul.', 'say6');
        }
      });
      var v = S.scen.vars;
      if (beaten !== v.beaten) { v.beaten = beaten; T.obj('o1', 'Oprește valurile lui Baiazid în mlaștini (' + beaten + '/4).'); if (beaten === 4) T.done('o1'); }
      if (v.w >= 2 && !T.alive('marko') && !T.isDone('o2')) { T.done('o2'); T.say('mircea', 'Craiul Marko a căzut. Să-l îngropăm cu cinste: a fost viteaz, chiar dacă a slujit altuia.', 'say7'); }
      if (T.isDone('o1') && T.isDone('o2') && !v.won) { v.won = 1; T.say('mircea', 'Baiazid se retrage spre Dunăre. Țara rămâne a noastră.', 'say8'); T.win(); }
    },
    timer: function (S) { var w = S.scen.vars.w || 0; return w < 4 ? Math.max(0, W1[w][0] - S.t) : 0; },
    triggers: []
  };

  var FORD = [72, 6];
  M.mi2 = {
    id: 'mi2', title: 'Cruciada de la Nicopole', short: 'Nicopole', year: '1396', place: 'Nicopole, pe Dunăre', lon: 24.9, lat: 43.7,
    view: { lon: 24.6, lat: 44.2, z: 2.0 },
    arrows: [{ pts: [[19.04, 47.5], [20.46, 44.82], [22.4, 44.4], [24.2, 43.8], [24.9, 43.7]], col: '#1c4fa0', t0: 1, t1: 9 }],
    intro: [
      'Toamna anului 1396. Regele Sigismund al Ungariei a strâns cea mai mare cruciadă a vremii: cavaleri francezi, burgunzi, germani, unguri. Mircea li se alătură cu oastea Țării Românești.',
      'Cruciații asediază cetatea Nicopole, pe Dunăre. Sultanul Baiazid vine în ajutor. Mircea cere să lovească primul, cu oamenii lui, care știu cum luptă turcii.',
      'Dar cavalerii francezi vor gloria primului atac. Ține flancul cât se poate și, dacă bătălia e pierdută, salvează-ți oastea: treci Dunărea înapoi, la vadul din nord.'
    ],
    outro: [
      'La Nicopole, cavalerii francezi au trecut de primele linii, dar au căzut în capcana spahiilor și a călăreților sârbi. Mulți au fost uciși, iar Ioan de Nevers a fost luat prizonier.',
      'Sigismund a scăpat cu o corabie pe Dunăre. Mircea, care văzuse dezastrul venind, și-a adus oastea acasă întreagă. Peste ani, avea s-o folosească din nou.'
    ],
    players: [MIRCEA,
      { civ: 'ung', team: 1, heroName: 'Sigismund de Luxemburg', ppl: 'ungurii', aiMode: 'static' },
      { civ: 'pol', team: 1, heroName: 'Ioan de Nevers', ppl: 'cavalerii francezi', aiMode: 'static' },
      { civ: 'oto', team: 2, heroName: 'Baiazid Fulgerul', aiMode: 'static', techs: ['up_mil2', 'up_arc2', 'forja'] }],
    map: { N: 96, season: 'vara', seed: 1396, ground: 'grass', ops: [
      ['river', [[-2, 12], [30, 9], [60, 13], [98, 10]], 5, { fords: [[72, 11]] }],
      ['rock', [[4, 40], [16, 34], [22, 44], [16, 54], [4, 52]]],
      ['forest', [[84, 20], [96, 18], [96, 52], [86, 50]], 0.6], ['forest', [[0, 60], [18, 62], [22, 96], [0, 96]], 0.55],
      ['forest', [[70, 92], [76, 74], [96, 70], [96, 96]], 0.5],
      ['road', [[72, 14], [68, 30], [56, 44], [50, 60], [52, 80], [56, 96]], 2],
      ['clear', 64, 30, 8], ['clear', 48, 38, 8], ['clear', 56, 84, 10],
      ['res', 'sheep', 60, 24, 6], ['res', 'berry', 76, 34, 5], ['res', 'gold', 30, 30, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 90, keepHero: 'Mircea a căzut la Nicopole.',
    setup: function (S, T) {
      T.bld(0, 'cetate', 62, 28, true, 'tabara0'); T.spawn(0, [['vil', 4]], 66, 33);
      heroAt(T, 0, 66, 36);
      T.spawn(0, [['lcv', 10], ['arc', 8], ['vit', 6], ['spr', 6], ['mil', 6], ['har', 4]], 64, 38);
      T.bld(1, 'cetate', 46, 36, true); heroAt(T, 1, 48, 42);
      T.spawn(1, [['mil2', 8], ['arc2', 6], ['kni', 4]], 44, 44);
      heroAt(T, 2, 38, 48);
      T.spawn(2, [['kni3', 12], ['mil3', 6]], 36, 50, 'franci');
      T.bld(3, 'fortareata', 22, 40, true, 'nicopole');
      T.wall(3, 28, 64, 74, 64, [], 'pal');
      T.spawn(3, [['mil', 12], ['arc', 10]], 52, 68, 'azapi');
      T.spawn(3, [['kni', 14], ['lcv', 8]], 54, 88, 'spahii'); heroAt(T, 3, 58, 90);
      T.spawn(3, [['kni2', 10]], 84, 84, 'sarbi').forEach(function (u) { u.name = 'Călăreț sârb'; });
      S.players[0].res = { f: 300, w: 300, g: 150, s: 50 };
      T.mark('vad', FORD[0], FORD[1], 'Vadul spre casă', '#4f8ff7');
    },
    start: function (S, T) {
      T.obj('o1', 'Ține flancul stâng cât timp cavalerii francezi atacă.');
      T.say('mircea', 'Lăsați-mă să lovesc primul. Oamenii mei știu cum se bat turcii: întâi pedestrașii, apoi capcana.', 'say1', 1);
      T.say('nevers', 'Onoarea primului atac e a cavalerilor Franței! Nu ne ascundem în spatele unor țărani!', 'say2');
      T.say('sigismund', 'Nu-i pot opri, Mircea. Fii gata de orice.', 'say3');
    },
    triggers: [
      { id: 'sarja', at: 40, do: function (S, T) { T.say('narator', 'Cavalerii francezi pornesc în galop spre parii turcilor, fără să mai aștepte pe nimeni.', 'say4'); T.attackMove(T.byTag('franci'), 56, 86); } },
      { id: 'capcana', at: 110, do: function (S, T) {
        T.say('iscoada', 'Spahiii ies din spatele dealului! Și călăreții sârbi îi lovesc pe francezi din coastă!', 'say5');
        T.attackMove(T.byTag('spahii'), 50, 66); T.attackMove(T.byTag('sarbi'), 50, 64);
      } },
      { id: 'retragere', when: function (S, T) { return S.t > 150 && (T.alive('franci') <= 2 || S.t > 260); }, do: function (S, T) {
        T.done('o1');
        T.obj('o2', 'Salvează oastea: adu-l pe Mircea și cel puțin 20 de oșteni la vadul din nord (steagul albastru).');
        T.say('mircea', 'Bătălia e pierdută. Nu-mi las oamenii să moară pentru mândria altora. Înapoi, peste Dunăre!', 'say6');
        T.wave(3, [['kni', 8], ['lcv', 8], ['har', 6]], [56, 88], [64, 30], 'urm1');
      } },
      { id: 'urmarire2', after: 'retragere', at: 330, do: function (S, T) { T.say('iscoada', 'Alți spahii ne taie calea spre vad!', 'say7'); T.wave(3, [['kni', 8], ['har', 6]], [90, 40], [72, 16], 'urm2'); } },
      { id: 'acasa', after: 'retragere', when: function (S, T) { return T.heroIn(0, FORD[0], FORD[1], 7) && T.inArea(0, FORD[0], FORD[1], 8, function (u) { return G.isMil(u) && !G.UNITS[u.t].hero; }).length >= 20; },
        do: function (S, T) { T.done('o2'); T.say('mircea', 'Suntem acasă. Oastea Țării Românești trăiește, și asta e tot ce contează azi.', 'say8'); T.win(); } }
    ]
  };

  var PLOT = [62, 70];
  M.mi3 = {
    id: 'mi3', title: 'Stăpânitorul Dristrei', short: 'Dristra', year: '1404', place: 'Dârstor (Silistra), pe Dunăre', lon: 27.26, lat: 44.11,
    view: { lon: 26.8, lat: 44.4, z: 2.2 },
    arrows: [{ pts: [[25.97, 43.9], [26.5, 44.05], [27.26, 44.11]], col: '#1c4fa0', t0: 1, t1: 7 }],
    intro: [
      'Anul 1404. Departe, în Anatolia, sultanul Baiazid a fost înfrânt și luat prizonier de Timur Lenk. Fiii lui se luptă între ei pentru tron.',
      'Mircea profită. Trece Dunărea și vrea să ia înapoi Dobrogea și cetatea Dârstorului, pe care cronicile o numesc Dristra.',
      'Cucerește fortăreața turcească, ridică acolo o cetate a ta și apăr-o până când turcii renunță.'
    ],
    outro: [
      'Dristra a fost din nou a lui Mircea. În hrisoavele lui, domnul se intitula de acum stăpânitor al Dristrei și al Țărilor Tătărăști, adică al Dobrogei până la mare.',
      'A domnit până în 1418, mai mult decât aproape oricare alt domn al Țării Românești. A fost îngropat la Cozia, mânăstirea pe care o ridicase. De aceea i se spune cel Bătrân: cel mare, cel vechi, cel de neuitat.'
    ],
    players: [MIRCEA, { civ: 'oto', team: 2, heroName: 'Pașa Dristrei', aiMode: 'defend', techs: ['up_mil2', 'up_arc2', 'zale1'], res: { f: 800, w: 800, g: 500, s: 400 } }],
    map: { N: 96, season: 'vara', seed: 1404, ground: 'grass', ops: [
      ['river', [[-2, 40], [30, 44], [60, 40], [98, 46]], 6, { fords: [[22, 43], [80, 44]] }],
      ['forest', [[0, 0], [30, 0], [24, 20], [0, 24]], 0.6], ['forest', [[70, 0], [96, 0], [96, 24], [76, 22]], 0.6],
      ['sand', [[30, 50], [96, 52], [96, 60], [40, 58]]],
      ['forest', [[0, 66], [16, 64], [20, 96], [0, 96]], 0.5],
      ['road', [[48, 14], [40, 30], [22, 43], [34, 60], [56, 70], [74, 86], [80, 96]], 2],
      ['clear', 48, 12, 9], ['clear', 62, 70, 9],
      ['res', 'gold', 36, 10, 6], ['res', 'stone', 60, 14, 6], ['res', 'sheep', 52, 22, 6], ['res', 'berry', 30, 18, 5], ['res', 'stone', 86, 74, 6], ['res', 'gold', 30, 80, 6]
    ] },
    startAge: 2, maxAge: 3, popMax: 100, keepHero: 'Mircea a căzut sub zidurile Dristrei.',
    setup: function (S, T) {
      town(T, 0, 48, 10, 10); T.bld(0, 'casa', 42, 6, true); T.bld(0, 'casa', 54, 6, true); T.bld(0, 'cazarma', 54, 14, true); T.bld(0, 'atelier', 40, 14, true);
      heroAt(T, 0, 46, 20);
      T.spawn(0, [['mil2', 10], ['spr', 6], ['arc', 8], ['lcv', 6], ['vit', 4], ['ram', 3]], 46, 24);
      // Dristra: fortăreața turcească, cu zid și turnuri, pe malul de sud
      T.bld(1, 'fortareata', 64, 66, true, 'dristra');
      T.wall(1, 56, 60, 76, 60, [10], 'zid'); T.wall(1, 76, 61, 76, 78, [], 'zid'); T.wall(1, 56, 78, 75, 78, [9], 'zid'); T.wall(1, 56, 61, 56, 77, [8], 'zid');
      T.bld(1, 'turn', 58, 62, true); T.bld(1, 'turn', 73, 62, true); T.bld(1, 'turn', 58, 75, true); T.bld(1, 'cazarma', 70, 72, true); T.bld(1, 'casa', 60, 72, true);
      T.spawn(1, [['vil', 6]], 66, 74);
      T.spawn(1, [['ien', 8], ['arc', 8], ['mil', 8], ['kni', 4]], 66, 64);
      S.players[0].res = { f: 600, w: 700, g: 400, s: 300 };
    },
    start: function (S, T) {
      T.obj('o1', 'Treci Dunărea și cucerește Dristra: dărâmă fortăreața turcească.');
      T.say('mircea', 'Dristra a fost a noastră. Va fi din nou. Berbecii în față, arcașii în spate.', 'say1', 1);
      T.say('capitan', 'Vadurile sunt la apus și la răsărit, Doamne. Podul l-au ars turcii.', 'say2');
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (T.isDone('o1') && !v.o2) {
        v.o2 = 1; T.mark('plot', PLOT[0], PLOT[1], 'Cetatea ta', '#ffd75a');
        T.obj('o2', 'Ridică o cetate a ta pe locul fortăreței (steagul galben).');
        T.say('mircea', 'Aici, pe malul Dunării, ridicăm cetatea noastră. Grăbiți-vă, turcii nu vor sta mult.', 'say4');
      }
      if (v.o2 && !T.isDone('o2')) {
        var c = G.C.blds.find(function (b) { return b.o === 0 && b.t === 'cetate' && b.built && Math.hypot(b.x - PLOT[0], b.y - PLOT[1]) < 9; });
        if (c) {
          T.done('o2'); T.unmark('plot'); v.t3 = S.t + 300;
          T.obj('o3', 'Apără Dristra până se retrag turcii (5:00).');
          T.say('iscoada', 'Oastea fiilor lui Baiazid vine dinspre mare, prin Dobrogea!', 'say5');
        }
      }
      if (v.t3) {
        var left = Math.max(0, v.t3 - S.t), i = v.r || 0;
        if (i < 3 && S.t >= v.t3 - 290 + i * 95) { v.r = i + 1; T.wave(1, [['kni', 4 + i * 2], ['ien', 4 + i * 2], ['mil', 6], ['can', i]], [86, 94], PLOT, 'r' + i); }
        var mm = Math.floor(left / 60), ss = Math.floor(left % 60);
        if (Math.ceil(left) !== v.lastLeft) { v.lastLeft = Math.ceil(left); T.obj('o3', 'Apără Dristra până se retrag turcii (' + mm + ':' + (ss < 10 ? '0' : '') + ss + ').'); }
        var mine = G.C.blds.some(function (b) { return b.o === 0 && b.t === 'cetate' && !b.dead && Math.hypot(b.x - PLOT[0], b.y - PLOT[1]) < 9; });
        if (!mine && !v.lost) { v.lost = 1; T.lose('Turcii au luat înapoi Dristra.'); }
        if (left <= 0 && !v.won) { v.won = 1; T.done('o3'); T.say('mircea', 'Se retrag. Dristra și Dobrogea sunt ale Țării Românești.', 'say6'); T.win(); }
      }
    },
    triggers: [{ id: 'o1', when: function (S, T) { return !T.alive('dristra'); }, do: function (S, T) { T.done('o1'); T.say('mircea', 'Fortăreața a căzut!', 'say3'); } }]
  };

  // ===================== MIHAI VITEAZUL =====================
  var W4 = [
    [100, [['mil2', 8], ['arc2', 6], ['ien', 4]], [52, 86], [48, 20]],
    [280, [['kni', 8], ['lcv', 8], ['ien', 6]], [52, 86], [48, 20]],
    [460, [['ien2', 8], ['kni2', 6], ['mil2', 8], ['har', 4]], [52, 86], [48, 20]]
  ];
  M.mh1 = {
    id: 'mh1', title: 'Podul de la Călugăreni', short: 'Călugăreni', year: '1595', place: 'Călugăreni, pe Neajlov', lon: 25.83, lat: 44.15,
    view: { lon: 25.9, lat: 44.2, z: 2.6 },
    arrows: [{ pts: [[25.97, 43.9], [25.9, 44.03], [25.83, 44.15]], col: '#a01818', t0: 1, t1: 7 }],
    intro: [
      'August 1595. Mihai, domnul Țării Românești, s-a ridicat împotriva turcilor și le-a ars cetățile de la Dunăre. Marele vizir Sinan Pașa vine să-l pedepsească, cu o oaste de multe ori mai mare.',
      'Mihai îl așteaptă la Călugăreni, unde drumul spre București trece printr-o vale mlăștinoasă, pe un singur pod îngust peste Neajlov.',
      'Ține podul, oprește valurile turcilor și, când vine clipa, aruncă-te asupra tunurilor lui Sinan, de pe dealul de dincolo de apă.'
    ],
    outro: [
      'La Călugăreni, Mihai a luat o secure de la un oștean și s-a aruncat el însuși în luptă. Oastea l-a urmat. Tunurile turcilor au fost capturate, iar Sinan Pașa a căzut de pe pod în mlaștină și și-a pierdut doi dinți.',
      'A fost o victorie strălucită, dar turcii erau încă mulți. Mihai s-a retras la munte, să-și aștepte aliații. Povestea abia începea.'
    ],
    players: [MIHAI, { civ: 'oto', team: 2, heroName: 'Sinan Pașa', aiMode: 'static', techs: ['up_mil2', 'up_arc2', 'forja', 'zale1'] }],
    map: { N: 96, season: 'vara', seed: 1595, ground: 'grass', ops: [
      ['marsh', 48, 50, 46, 7],
      ['river', [[-2, 50], [30, 48], [60, 52], [98, 49]], 2.4, { bridges: [[48, 50]], fords: [[88, 49]] }],
      ['forest', [[0, 0], [30, 0], [26, 24], [0, 30]], 0.62], ['forest', [[68, 0], [96, 0], [96, 30], [74, 26]], 0.62],
      ['forest', [[0, 62], [20, 62], [16, 96], [0, 96]], 0.5], ['forest', [[82, 62], [96, 60], [96, 96], [86, 96]], 0.5],
      ['road', [[48, 2], [48, 30], [48, 50], [50, 68], [52, 92]], 2],
      ['clear', 48, 18, 11], ['clear', 52, 82, 12], ['clear', 52, 70, 6],
      ['res', 'gold', 34, 12, 6], ['res', 'stone', 62, 10, 5], ['res', 'sheep', 40, 26, 6], ['res', 'berry', 60, 26, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 110, keepHero: 'Mihai a căzut la Călugăreni.',
    setup: function (S, T) {
      town(T, 0, 48, 16, 8); T.bld(0, 'casa', 41, 12, true); T.bld(0, 'casa', 55, 12, true); T.bld(0, 'cazarma', 56, 18, true);
      heroAt(T, 0, 48, 28);
      T.spawn(0, [['mil2', 10], ['spr2', 8], ['arc2', 8], ['gun', 6], ['lcv2', 8], ['vit', 6], ['kni', 4]], 48, 32);
      T.bld(1, 'cetate', 50, 82, true, 'tabara'); T.bld(1, 'casa', 44, 88, true); T.bld(1, 'casa', 58, 88, true);
      heroAt(T, 1, 52, 74);
      var tun = T.spawn(1, [['can2', 5]], 52, 70, 'tunuri'); tun.forEach(function (u) { u.name = 'Tunul lui Sinan'; }); S.scen.vars.tun0 = tun.length;
      T.spawn(1, [['ien', 8], ['kni', 6]], 52, 76, 'garda');
      S.players[0].res = { f: 600, w: 500, g: 400, s: 200 };
    },
    start: function (S, T) {
      T.obj('o1', 'Ține podul și oprește valurile lui Sinan (0/3).');
      T.say('mihai', 'Un singur pod, o singură vale. Aici îi oprim, ori aici murim.', 'say1', 1);
      T.say('buzescu', 'Doamne, pușcașii stau la capătul podului, arcașii pe marginea mlaștinii. Turcii nu vor putea ocoli.', 'say2');
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      var beaten = waves(S, T, W4, 'w', 1, function (i) {
        if (i === 2) T.say('iscoada', 'Ienicerii aleși ai lui Sinan trec podul!', 'say4');
        else T.say('iscoada', 'Turcii coboară spre pod!', 'say3');
      });
      if (beaten !== v.beaten) { v.beaten = beaten; T.obj('o1', 'Ține podul și oprește valurile lui Sinan (' + beaten + '/3).'); if (beaten === 3) T.done('o1'); }
      if (T.isDone('o1') && !v.o2) {
        v.o2 = 1;
        T.obj('o2', 'Capturează tunurile lui Sinan: dărâmă tunurile de pe dealul de dincolo de pod (0/' + (v.tun0 || 5) + ').');
        T.say('mihai', 'Acum, după mine! Cine iubește țara, după mine!', 'say5');
        T.say('narator', 'Mihai ia o secure de la un oștean și trece primul podul. Folosește puterea lui: Toporul de la Călugăreni.', 'say6');
        var h = G.heroOf(0); if (h) T.units(0, function (u) { return G.isMil(u) && G.dist(u, h) < 14; }).forEach(function (u) { u.buf = { a: 1.4, s: 1.2, until: S.t + 25 }; });
      }
      if (v.o2) {
        var n0 = v.tun0 || 5, gone = n0 - T.alive('tunuri');
        if (gone !== v.gone) { v.gone = gone; T.obj('o2', 'Capturează tunurile lui Sinan: dărâmă tunurile de pe dealul de dincolo de pod (' + Math.max(0, gone) + '/' + n0 + ').'); }
        if (gone >= n0 && !T.isDone('o2')) {
          T.done('o2');
          T.say('narator', 'Sinan Pașa fuge peste pod, cade în mlaștină și își pierde doi dinți. Ienicerii abia îl scot din noroi.', 'say7');
          var sn = G.heroOf(1); if (sn) T.vanish([sn]);
          T.say('mihai', 'Valea e a noastră! Să nu uite niciodată Călugărenii.', 'say8');
        }
      }
      if (T.isDone('o1') && T.isDone('o2') && !v.won) { v.won = 1; T.win(); }
    },
    timer: function (S) { var w = S.scen.vars.w || 0; return w < 3 ? Math.max(0, W4[w][0] - S.t) : 0; },
    triggers: []
  };

  M.mh2 = {
    id: 'mh2', title: 'Spre Giurgiu', short: 'Giurgiu', year: '1595', place: 'Târgoviște și Giurgiu', lon: 25.97, lat: 43.9,
    view: { lon: 25.6, lat: 44.5, z: 2.2 },
    arrows: [{ pts: [[25.46, 44.93], [25.8, 44.6], [26.1, 44.43], [26.0, 44.1], [25.97, 43.9]], col: '#1c4fa0', t0: 1, t1: 9 }],
    intro: [
      'Octombrie 1595. După Călugăreni, Sinan Pașa a ocupat Bucureștiul și Târgoviștea și le-a întărit cu palisade, ca să facă din țară pașalâc.',
      'Dar Mihai nu mai e singur: vin în ajutor principele Transilvaniei, Sigismund Báthory, și domnul Moldovei, Ștefan Răzvan.',
      'Ia înapoi Târgoviștea, apoi grăbește-te spre Dunăre: Sinan fuge spre Giurgiu cu prada și trece podul de vase. Dărâmă cetatea Giurgiului înainte să scape toți.'
    ],
    outro: [
      'Târgoviștea a fost luată cu asalt pe 18 octombrie. Pe 27 octombrie, tunurile creștinilor au rupt podul de vase de la Giurgiu, iar coada oștirii turcești a fost nimicită pe malul Dunării.',
      'Sinan Pașa s-a întors la Constantinopol învins. Țara Românească era liberă, iar numele lui Mihai se auzea acum în toată Europa.'
    ],
    players: [MIHAI,
      { civ: 'oto', team: 2, heroName: 'Sinan Pașa', aiMode: 'defend', techs: ['up_mil2', 'up_arc2', 'forja', 'zale1'], res: { f: 600, w: 600, g: 400, s: 300 } },
      { civ: 'ung', team: 1, heroName: 'Sigismund Báthory', ppl: 'ardelenii', aiMode: 'static' },
      { civ: 'mol', team: 1, heroName: 'Ștefan Răzvan', ppl: 'moldovenii', aiMode: 'static' }],
    map: { N: 96, season: 'vara', seed: 1596, ground: 'grass', ops: [
      ['river', [[60, 98], [76, 86], [86, 76], [98, 62]], 7],
      ['river', [[-2, 50], [26, 54], [44, 52], [70, 60], [86, 74]], 1.6, { fords: [[30, 54], [58, 57]], bridges: [[44, 52]] }],
      ['forest', [[0, 60], [20, 64], [30, 96], [0, 96]], 0.55], ['forest', [[40, 0], [70, 0], [64, 16], [44, 18]], 0.55],
      ['forest', [[84, 0], [96, 0], [96, 30], [86, 30]], 0.6],
      ['road', [[20, 22], [32, 36], [44, 52], [58, 66], [72, 78], [80, 84]], 2],
      ['clear', 20, 22, 11], ['clear', 74, 80, 9], ['clear', 70, 20, 10],
      ['res', 'gold', 58, 26, 6], ['res', 'stone', 86, 40, 5], ['res', 'sheep', 64, 30, 6], ['res', 'berry', 78, 34, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 120, keepHero: 'Mihai a căzut.',
    setup: function (S, T) {
      town(T, 0, 70, 20, 8); T.bld(0, 'atelier', 76, 26, true); T.bld(0, 'casa', 64, 16, true); T.bld(0, 'casa', 76, 16, true);
      heroAt(T, 0, 66, 28);
      T.spawn(0, [['mil2', 8], ['spr2', 6], ['arc2', 8], ['gun', 6], ['lcv2', 8], ['vit', 6], ['can', 2]], 64, 30);
      heroAt(T, 2, 78, 30); T.spawn(2, [['hus', 8], ['kni2', 6], ['gun', 6]], 80, 32, 'ardeleni');
      heroAt(T, 3, 60, 34); T.spawn(3, [['raz', 8], ['lcv', 6], ['arc', 6]], 58, 36, 'moldoveni');
      // Târgoviștea, întărită de turci
      T.bld(1, 'fortareata', 18, 20, true, 'targoviste');
      T.wall(1, 10, 12, 30, 12, [], 'pal'); T.wall(1, 30, 13, 30, 31, [9], 'pal'); T.wall(1, 10, 31, 29, 31, [10], 'pal'); T.wall(1, 10, 13, 10, 30, [], 'pal');
      T.bld(1, 'turn', 12, 14, true); T.bld(1, 'turn', 27, 28, true);
      T.spawn(1, [['ien', 8], ['arc2', 6], ['mil2', 6]], 22, 24);
      // Giurgiu, la Dunăre: cetatea și coada oștirii
      T.bld(1, 'cetate', 72, 78, true, 'giurgiu'); T.bld(1, 'turn', 68, 76, true); T.bld(1, 'turn', 80, 76, true);
      T.spawn(1, [['ien', 6], ['kni', 6], ['arc2', 6], ['can', 2]], 70, 74, 'coada');
      S.players[0].res = { f: 600, w: 600, g: 400, s: 300 };
    },
    start: function (S, T) {
      T.obj('o1', 'Recucerește Târgoviștea: dărâmă fortăreața lui Sinan.');
      T.say('mihai', 'Întâi Târgoviștea. Nu las niciun turc în scaunul domniei.', 'say1', 1);
      T.say('sigismund_b', 'Ardelenii sunt cu tine, Mihai. Tunurile mele te urmează.', 'say2');
      T.say('razvan', 'Și moldovenii. Azi luptăm pentru aceeași cruce.', 'say3');
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (!T.alive('targoviste') && !T.isDone('o1')) {
        T.done('o1'); v.t2 = S.t + 720;
        T.obj('o2', 'Ajunge la Giurgiu și dărâmă cetatea înainte să treacă toți turcii Dunărea (12:00).');
        T.say('mihai', 'Târgoviștea e liberă! Acum la Dunăre, să nu scape Sinan!', 'say4');
        T.attackMove(T.byTag('ardeleni'), 72, 78); T.attackMove(T.byTag('moldoveni'), 72, 78);
      }
      if (v.t2 && !T.isDone('o2')) {
        var left = Math.max(0, v.t2 - S.t), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
        if (Math.ceil(left) !== v.lastLeft) { v.lastLeft = Math.ceil(left); T.obj('o2', 'Ajunge la Giurgiu și dărâmă cetatea înainte să treacă toți turcii Dunărea (' + mm + ':' + (ss < 10 ? '0' : '') + ss + ').'); }
        if (!T.alive('giurgiu')) { T.done('o2'); T.say('mihai', 'Podul de vase arde, iar coada oștirii lor e a noastră! Sinan a pierdut tot.', 'say5'); if (!v.won) { v.won = 1; T.win(); } }
        else if (left <= 0 && !v.lost) { v.lost = 1; T.lose('Sinan a trecut Dunărea cu toată oastea și cu prada.'); }
      }
    },
    triggers: [{ id: 'iesire', at: 240, do: function (S, T) { T.say('iscoada', 'Ienicerii ies din Târgoviște să ne lovească!', 'say6'); T.wave(1, [['ien', 6], ['kni', 4]], [30, 30], [66, 28], 'iesire'); } }]
  };

  var ALBA = [10, 10];
  M.mh3 = {
    id: 'mh3', title: 'Șelimbăr', short: 'Șelimbăr', year: '1599', place: 'Șelimbăr, lângă Sibiu', lon: 24.2, lat: 45.76,
    view: { lon: 24.2, lat: 45.9, z: 2.4 },
    arrows: [{ pts: [[25.46, 44.93], [25.2, 45.3], [24.6, 45.55], [24.2, 45.76]], col: '#1c4fa0', t0: 1, t1: 8 }, { pts: [[24.2, 45.76], [23.9, 45.95], [23.58, 46.07]], col: '#1c4fa0', t0: 9, t1: 13 }],
    intro: [
      'Toamna anului 1599. În Transilvania domnește acum cardinalul Andrei Báthory, care s-a înțeles cu polonezii și cu turcii împotriva lui Mihai.',
      'Mihai nu așteaptă să fie atacat. Trece munții, iar secuii, nemulțumiți de stăpânii lor, se ridică să lupte alături de el.',
      'Înfrânge oastea lui Andrei Báthory pe câmpul de la Șelimbăr, lângă Sibiu, apoi intră în Alba Iulia, cetatea principilor.'
    ],
    outro: [
      'Pe 28 octombrie 1599, la Șelimbăr, oastea lui Andrei Báthory a fost zdrobită. Cardinalul a fugit spre munții Ciucului, unde secuii l-au prins și l-au ucis.',
      'Pe 1 noiembrie, Mihai a intrat în Alba Iulia ca un împărat, cu steagurile desfășurate. Pentru prima dată, un domn al Țării Românești era și stăpânul Transilvaniei.'
    ],
    players: [MIHAI,
      { civ: 'ung', team: 2, heroName: 'Andrei Báthory', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'up_arc2', 'forja', 'zale1'] },
      { civ: 'ung', team: 1, ppl: 'secuii', heroName: 'Căpitanul secuilor', aiMode: 'static' }],
    map: { N: 96, season: 'vara', seed: 1599, ground: 'grass', ops: [
      ['river', [[-2, 44], [24, 40], [50, 46], [74, 42], [98, 48]], 1.8, { fords: [[36, 43], [62, 44]], bridges: [[50, 46]] }],
      ['forest', [[60, 0], [96, 0], [96, 26], [70, 22]], 0.6], ['forest', [[0, 60], [18, 58], [26, 96], [0, 96]], 0.55],
      ['forest', [[84, 64], [96, 60], [96, 96], [80, 96]], 0.55],
      ['road', [[10, 10], [24, 24], [40, 36], [50, 46], [58, 62], [66, 80], [70, 94]], 2],
      ['clear', 10, 10, 8], ['clear', 66, 80, 10], ['clear', 40, 28, 10],
      ['res', 'gold', 54, 84, 6], ['res', 'stone', 80, 84, 5], ['res', 'sheep', 58, 76, 6], ['res', 'berry', 76, 74, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 120, keepHero: 'Mihai a căzut la Șelimbăr.',
    setup: function (S, T) {
      town(T, 0, 66, 80, 8); T.bld(0, 'casa', 60, 86, true); T.bld(0, 'casa', 72, 86, true); T.bld(0, 'cazarma', 72, 76, true);
      heroAt(T, 0, 66, 76);
      T.spawn(0, [['mil2', 10], ['spr2', 8], ['arc2', 8], ['gun', 8], ['lcv2', 10], ['vit', 6], ['can', 2]], 58, 66);
      // oastea cardinalului, pe câmpul din fața Sibiului
      heroAt(T, 1, 38, 24);
      T.spawn(1, [['hus2', 10], ['kni2', 10], ['mil3', 10], ['arc2', 8], ['gun', 8], ['can', 3]], 40, 28, 'oastea');
      T.bld(1, 'cetate', 8, 8, true, 'alba'); T.bld(1, 'turn', 14, 6, true); T.bld(1, 'turn', 6, 14, true);
      S.players[0].res = { f: 600, w: 500, g: 400, s: 200 };
      T.mark('alba', ALBA[0] + 6, ALBA[1] + 6, 'Alba Iulia', '#ffd75a');
    },
    start: function (S, T) {
      T.obj('o1', 'Înfrânge oastea lui Andrei Báthory la Șelimbăr.');
      T.obj('o2', 'Andrei Báthory nu trebuie să scape.', { sec: 1 });
      T.say('mihai', 'Cardinalul vrea război? Îl va avea. Pentru Ardeal!', 'say1', 1);
      T.say('andrei', 'Un domn de peste munți nu va porunci niciodată în Transilvania!', 'say2');
    },
    triggers: [
      { id: 'atac', at: 60, do: function (S, T) { T.say('iscoada', 'Husarii cardinalului pornesc spre noi!', 'say3'); T.attackMove(T.byTag('oastea'), 56, 62); } },
      { id: 'secui', at: 120, do: function (S, T) {
        T.say('secui', 'Secuii sunt cu tine, Mihai! Ne-ai dat înapoi libertatea!', 'say4');
        heroAt(T, 2, 92, 40); T.attackMove(T.spawn(2, [['lcv2', 10], ['arc', 8], ['spr', 8]], 90, 42, 'secuii'), 40, 30);
      } },
      { id: 'fuga', when: function (S, T) { return S.t > 60 && T.alive('oastea') <= 12 && G.heroOf(1); }, do: function (S, T) {
        T.say('iscoada', 'Cardinalul fuge spre munții Ciucului!', 'say5'); var a = G.heroOf(1); if (a) T.moveTo([a], 92, 4);
      } },
      { id: 'scapat', after: 'fuga', when: function (S, T) { var a = G.heroOf(1); return a && a.x > 88 && a.y < 8; }, do: function (S, T) {
        T.vanish([G.heroOf(1)]); T.fail('o2'); T.say('secui', 'A scăpat, dar nu pentru mult: în munții noștri, secuii îl vor găsi.', 'say6');
      } },
      { id: 'prins', when: function (S, T) { return S.t > 5 && !G.heroOf(1) && !S.scen.fired.scapat; }, do: function (S, T) { T.done('o2'); } },
      { id: 'o1', when: function (S, T) { return S.t > 30 && T.alive('oastea') === 0; }, do: function (S, T) {
        T.done('o1');
        T.obj('o3', 'Intră în Alba Iulia: du-l pe Mihai la steagul galben.');
        T.say('mihai', 'Câmpul e al nostru. Acum, la Alba Iulia!', 'say7');
      } },
      { id: 'alba', after: 'o1', when: function (S, T) { return T.heroIn(0, ALBA[0] + 6, ALBA[1] + 6, 4); }, do: function (S, T) {
        T.done('o3'); T.say('mihai', 'Alba Iulia. Ce n-a putut face nimeni înaintea mea s-a împlinit.', 'say8'); T.win();
      } }
    ]
  };

  M.mh4 = {
    id: 'mh4', title: 'Unirea', short: 'Unirea', year: '1600', place: 'Suceava și Hotin', lon: 26.26, lat: 47.65,
    view: { lon: 25.5, lat: 46.6, z: 1.6 },
    arrows: [{ pts: [[23.58, 46.07], [24.6, 46.5], [25.4, 47.1], [26.26, 47.65]], col: '#1c4fa0', t0: 1, t1: 8 }, { pts: [[26.26, 47.65], [26.4, 48.1], [26.49, 48.52]], col: '#1c4fa0', t0: 9, t1: 13 }],
    intro: [
      'Primăvara anului 1600. Mihai stăpânește Țara Românească și Transilvania. Dar în Moldova domnește Ieremia Movilă, prieten al polonezilor, care vrea să-l pună pe fratele lui pe tronul Țării Românești.',
      'Mihai pornește peste munți, în Moldova. Ieremia se închide în cetăți și așteaptă ajutor de la regele Poloniei.',
      'Ia cetatea Sucevei, apoi Hotinul, pe Nistru, înainte să sosească polonezii. Dacă reușești, cele trei țări vor avea pentru prima dată același domn.'
    ],
    outro: [
      'În mai 1600, Suceava și Hotinul au căzut, iar Ieremia Movilă a fugit în Polonia. Mihai a început să se intituleze domn al Țării Românești, al Ardealului și a toată Țara Moldovei. Pe pecetea lui stăteau, alături, stemele celor trei țări.',
      'Unirea n-a durat mult: în același an, Mihai a fost înfrânt la Mirăslău, iar în august 1601 a fost ucis mișelește pe Câmpia Turzii. Dar ce făcuse el nu s-a mai uitat niciodată. Peste trei sute de ani, românii aveau să-și amintească de Mihai când și-au făcut țara întreagă.'
    ],
    players: [MIHAI,
      { civ: 'mol', team: 2, heroName: 'Ieremia Movilă', ppl: 'oamenii lui Ieremia', aiMode: 'defend', techs: ['up_mil2', 'up_arc2', 'zale1'], res: { f: 800, w: 800, g: 600, s: 500 } },
      { civ: 'pol', team: 2, heroName: 'Hatmanul Zamoyski', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'forja'] }],
    map: { N: 96, season: 'vara', seed: 1600, ground: 'grass', ops: [
      ['river', [[56, -2], [70, 10], [84, 14], [98, 12]], 3.5, { fords: [[70, 10]] }],
      ['forest', [[0, 0], [36, 0], [30, 20], [0, 30]], 0.62], ['forest', [[0, 40], [20, 44], [24, 70], [0, 74]], 0.62],
      ['forest', [[40, 40], [58, 36], [64, 52], [46, 58]], 0.6], ['forest', [[70, 50], [96, 44], [96, 70], [76, 70]], 0.55],
      ['road', [[50, 92], [40, 76], [30, 60], [32, 40], [40, 26], [54, 18], [72, 22], [84, 22]], 2],
      ['clear', 50, 88, 10], ['clear', 32, 34, 9], ['clear', 82, 24, 8],
      ['res', 'gold', 62, 84, 6], ['res', 'stone', 38, 90, 6], ['res', 'sheep', 58, 78, 6], ['res', 'berry', 66, 92, 5], ['res', 'gold', 14, 86, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 130, keepHero: 'Mihai a căzut în Moldova.',
    setup: function (S, T) {
      town(T, 0, 50, 88, 10); T.bld(0, 'casa', 44, 92, true); T.bld(0, 'casa', 56, 92, true); T.bld(0, 'cazarma', 56, 84, true); T.bld(0, 'atelier', 42, 84, true);
      heroAt(T, 0, 46, 78);
      T.spawn(0, [['mil2', 10], ['spr2', 8], ['arc2', 8], ['gun', 8], ['lcv2', 8], ['vit', 6], ['can', 3], ['ram', 2]], 46, 74);
      // Suceava
      T.bld(1, 'fortareata', 30, 30, true, 'suceava');
      T.wall(1, 24, 24, 40, 24, [8], 'zid'); T.wall(1, 40, 25, 40, 40, [], 'zid'); T.wall(1, 24, 40, 39, 40, [7], 'zid'); T.wall(1, 24, 25, 24, 39, [], 'zid');
      T.bld(1, 'turn', 26, 26, true); T.bld(1, 'turn', 37, 37, true); T.bld(1, 'cazarma', 34, 26, true);
      heroAt(T, 1, 33, 33);
      T.spawn(1, [['raz', 8], ['arc2', 8], ['mil2', 8], ['kni', 4]], 32, 44, 'garda_sv');
      // Hotin, pe Nistru
      T.bld(1, 'fortareata', 80, 22, true, 'hotin'); T.bld(1, 'turn', 78, 30, true); T.bld(1, 'turn', 88, 28, true);
      T.spawn(1, [['arc2', 6], ['mil2', 6], ['gun', 4]], 82, 32, 'garda_ho');
      S.players[0].res = { f: 700, w: 700, g: 500, s: 400 };
    },
    start: function (S, T) {
      T.obj('o1', 'Cucerește cetatea Sucevei.');
      T.obj('o2', 'Cucerește Hotinul, pe Nistru.');
      T.say('mihai', 'Moldova, Ardealul și Țara Românească: același neam, aceeași credință. De ce n-ar avea același domn?', 'say1', 1);
      T.say('ieremia', 'Regele Poloniei nu mă va lăsa singur. Zidurile Sucevei vor ține până vin husarii.', 'say2');
    },
    timer: function (S) { return S.scen.fired.polonezi ? 0 : Math.max(0, 960 - S.t); },
    triggers: [
      { id: 'iesire', at: 300, do: function (S, T) { T.say('iscoada', 'Oastea lui Ieremia iese din Suceava!', 'say3'); T.wave(1, [['raz', 6], ['lcv', 6], ['arc', 4]], [32, 44], [46, 78], 'iesire'); } },
      { id: 'polonezi', at: 960, do: function (S, T) {
        T.say('iscoada', 'Husarii polonezi au trecut Nistrul!', 'say4');
        heroAt(T, 2, 74, 6); T.wave(2, [['cpl', 8], ['hus', 6], ['gun', 6], ['mil3', 6]], [74, 4], [46, 78], 'pol');
      } },
      { id: 'o1', when: function (S, T) { return !T.alive('suceava'); }, do: function (S, T) { T.done('o1'); T.say('mihai', 'Suceava e a noastră! Acum Hotinul.', 'say5'); } },
      { id: 'o2', when: function (S, T) { return !T.alive('hotin'); }, do: function (S, T) { T.done('o2'); T.say('mihai', 'Hotinul a căzut. Ieremia a fugit peste Nistru.', 'say6'); } },
      { id: 'win', when: function (S, T) { return T.isDone('o1') && T.isDone('o2'); }, do: function (S, T) {
        T.say('mihai', 'De azi, sunt domn al Țării Românești, al Ardealului și a toată Țara Moldovei.', 'say7'); T.win();
      } }
    ]
  };

  G.CAMPAIGNS.push(
    { id: 'mircea', name: 'Mircea cel Bătrân', civ: 'val', heroVis: 'mircea', sub: 'Rovine, Nicopole și Dunărea', view: { lon: 25.8, lat: 44.3, z: 2.0 }, scen: ['mi1', 'mi2', 'mi3'] },
    { id: 'mihai', name: 'Mihai Viteazul', civ: 'val', heroVis: 'mihai', sub: 'Primul care a unit cele trei țări', view: { lon: 25.0, lat: 45.8, z: 1.45 }, scen: ['mh1', 'mh2', 'mh3', 'mh4'] }
  );
  // ordinea filelor: Ștefan întâi, apoi domnii români în ordinea vremii, apoi ceilalți
  var ORD = ['stefan', 'mircea', 'vlad', 'mihai', 'iancu', 'mehmed', 'jagiello', 'mengli'];
  G.CAMPAIGNS.sort(function (a, b) { var ia = ORD.indexOf(a.id), ib = ORD.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
})();
