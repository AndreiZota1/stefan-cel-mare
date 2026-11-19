// Campania „Ștefan cel Mare”: șase misiuni, de la Doljești (1457) la Codrii Cosminului (1497).
var G = globalThis.G || (globalThis.G = {});
G.MISSIONS = G.MISSIONS || {};
G.CAMPAIGNS = G.CAMPAIGNS || [];

(function () {
  'use strict';
  var M = G.MISSIONS;
  // ajutoare comune
  function town(T, o, x, y, vils, tag) { var b = T.bld(o, 'cetate', x - 2, y - 2, true, tag); if (vils) T.spawn(o, [['vil', vils]], x + 1, y + 3); return b; }
  function heroAt(T, o, x, y) { return T.spawn(o, [['hero', 1]], x, y)[0]; }
  function lastWave(S, T, tag) { return T.alive(tag) === 0 && S.scen.vars['sp_' + tag]; }

  // ===================== 1. Doljești, 1457 =====================
  M.st1 = {
    id: 'st1', title: 'Dreptul la domnie', short: 'Doljești', year: '1457', place: 'Doljești, pe Siret', lon: 26.96, lat: 47.0,
    view: { lon: 26.3, lat: 46.2, z: 2.0 },
    arrows: [{ pts: [[25.46, 44.93], [25.9, 45.5], [26.5, 46.2], [26.8, 46.7], [26.96, 47.0]], col: '#1c4fa0', t0: 2, t1: 12 }],
    intro: [
      'Primăvara anului 1457. Pe tronul Moldovei stă Petru Aron, cel care l-a ucis pe Bogdan al II-lea, tatăl tânărului Ștefan.',
      'Ștefan și-a găsit adăpost în Țara Românească, la vărul său, Vlad. Acum, cu oșteni munteni și cu moldovenii care i se alătură pe drum, trece hotarul.',
      'La Doljești, dincolo de Siret, îl așteaptă oastea lui Petru Aron. Strânge-ți oamenii, ridică oaste și ia-ți înapoi tronul.'
    ],
    outro: [
      'La Doljești, pe 12 aprilie 1457, oastea lui Petru Aron a fost risipită. Câteva zile mai târziu, la Orbic, Ștefan îl învinge din nou, iar Petru Aron fuge în Polonia.',
      'Pe câmpia de la Direptate, lângă Suceava, mitropolitul Teoctist îl unge domn al Moldovei. Așa începe o domnie de 47 de ani.'
    ],
    loseText: 'Moldova rămâne în mâinile lui Petru Aron. Mai încearcă o dată.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'mol', team: 2, ppl: 'oamenii lui Petru Aron', heroName: 'Petru Aron', aiMode: 'eco', res: { f: 600, w: 600, g: 300, s: 200 } },
      { civ: 'val', team: 1, ppl: 'muntenii', aiMode: 'static' }],
    map: { N: 96, season: 'vara', seed: 1457, ground: 'grass', ops: [
      ['river', [[60, -2], [58, 18], [52, 36], [55, 52], [50, 70], [54, 98]], 3.2, { fords: [[55, 24], [52, 61]], bridges: [[54, 45]] }],
      ['forest', [[0, 0], [26, 0], [20, 14], [8, 24], [0, 30]], 0.65], ['forest', [[0, 70], [12, 64], [26, 78], [22, 96], [0, 96]], 0.6],
      ['forest', [[70, 0], [96, 0], [96, 24], [84, 28], [74, 14]], 0.6], ['forest', [[76, 70], [96, 62], [96, 96], [70, 96]], 0.6],
      ['forestc', 32, 30, 6, 0.55], ['forestc', 36, 68, 5, 0.5], ['forestc', 84, 40, 4, 0.5], ['forestc', 70, 30, 5, 0.5],
      ['road', [[20, 48], [34, 46], [54, 45], [76, 47]], 2],
      ['clear', 18, 48, 8], ['clear', 78, 47, 10], ['clear', 26, 44, 4],
      ['res', 'sheep', 25, 55, 6], ['res', 'berry', 10, 40, 6], ['res', 'gold', 28, 36, 6], ['res', 'stone', 9, 57, 5],
      ['res', 'gold', 42, 82, 7], ['res', 'stone', 42, 18, 5], ['res', 'sheep', 66, 60, 4], ['res', 'berry', 88, 54, 5], ['res', 'gold', 88, 36, 5], ['res', 'relic', 40, 88, 1]
    ] },
    maxAge: 1, popMax: 75, keepHero: 'Ștefan a căzut. Moldova rămâne în mâinile lui Petru Aron.',
    setup: function (S, T) {
      town(T, 0, 18, 48, 5);
      heroAt(T, 0, 22, 50);
      T.spawn(2, [['mil', 6], ['arc', 4], ['lcv', 2]], 27, 44, 'munteni');
      town(T, 1, 78, 47, 5, 'tabara');
      T.bld(1, 'cazarma', 82, 39, true); T.bld(1, 'casa', 72, 40, true); T.bld(1, 'casa', 84, 51, true); T.bld(1, 'turn', 71, 52, true);
      T.spawn(1, [['mil', 8], ['spr', 4], ['arc', 4], ['lcv', 3]], 74, 47, 'aron');
      heroAt(T, 1, 80, 44);
      S.players[0].res = { f: 300, w: 400, g: 150, s: 100 };
    },
    start: function (S, T) {
      T.obj('o1', 'Strânge o oaste de 12 oșteni (cazarmă, apoi oșteni și lăncieri).');
      T.obj('o2', 'Treci Siretul și dărâmă tabăra lui Petru Aron.');
      T.obj('o3', 'Ștefan trebuie să trăiască.', { sec: 1, quiet: 1 });
      T.say('stefan', 'Am trecut hotarul. Asta e țara tatălui meu, și astăzi o luăm înapoi.', 'say1', 1);
      T.say('capitan', 'Doamne, vărul tău Vlad ne-a trimis să-ți fim de ajutor. Suntem gata când ești și tu.', 'say2');
      T.say('stefan', 'Întâi strângem oaste. Apoi trecem Siretul, la Doljești.', 'say3');
    },
    triggers: [
      { id: 'h1', at: 30, do: function (S, T) { G.msg('Pune țăranii la treabă: hrană, lemn, aur. Construiește o cazarmă din butoanele țăranului.', 'info'); } },
      { id: 'raid', at: 270, do: function (S, T) {
        T.say('iscoada', 'Doamne! Petru Aron a aflat de noi și trimite călăreți spre sat!', 'say4');
        T.wave(1, [['lcv', 3], ['mil', 3]], [70, 47], [18, 48], 'raid');
      } },
      { id: 'army', when: function (S, T) { return T.army(0).length >= 12; }, do: function (S, T) {
        T.done('o1');
        T.say('stefan', 'Oastea e gata. Munteni, cu noi! La Doljești!', 'say5');
        T.mode(2, 'eco'); T.aiGo(2);
      } },
      { id: 'counter', at: 720, do: function (S, T) { T.aiGo(1); } },
      { id: 'half', when: function (S, T) { var b = T.get('tabara'); return b && b.hp < b.mhp * 0.5; }, do: function (S, T) {
        T.say('petru', 'Cine sunteți voi să-mi luați tronul? Țineți-i pe loc!', 'say6');
      } },
      { id: 'win', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) {
        T.done('o2'); T.say('stefan', 'Tabăra a căzut! Petru Aron fuge. Moldova e a noastră.', 'say7'); T.win();
      } }
    ]
  };

  // ===================== 2. Chilia, 1465 =====================
  M.st2 = {
    id: 'st2', title: 'Cheia Dunării', short: 'Chilia', year: '1465', place: 'Chilia, la gurile Dunării', lon: 29.28, lat: 45.43,
    view: { lon: 28.4, lat: 46.0, z: 2.2 },
    arrows: [{ pts: [[26.26, 47.65], [27.0, 46.9], [28.0, 46.2], [28.8, 45.7], [29.28, 45.43]], col: '#1c4fa0', t0: 2, t1: 12 }],
    intro: [
      'Chilia, cetatea de la gurile Dunării, păzește negoțul dintre Marea Neagră și țările creștine. De ani buni, în ea stă o garnizoană ungurească.',
      'Ștefan știe că, fără Chilia, Moldova nu e întreagă. Prima lui încercare, din 1462, s-a încheiat cu o rană la picior care l-a chinuit toată viața.',
      'Acum, în iarna lui 1465, se întoarce cu tunuri. Sparge zidurile și ia cetatea, înainte să ajungă ajutoarele regelui Matia.'
    ],
    outro: [
      'Pe 25 ianuarie 1465, după un asediu scurt, Chilia se predă. Gurile Dunării sunt din nou ale Moldovei.',
      'Pentru otomani, Chilia și Cetatea Albă erau porțile spre nord. Peste câțiva ani, aveau să vină după ele. Dar mai întâi, se supără regele Ungariei.'
    ],
    loseText: 'Asediul a eșuat. Chilia rămâne în mâinile ungurilor.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'ung', team: 2, ppl: 'apărătorii Chiliei', aiMode: 'defend', res: { f: 1500, w: 800, g: 1000, s: 400 }, techs: ['up_mil2', 'up_mil3', 'up_arc2', 'zale1', 'pene'] }],
    map: { N: 96, season: 'iarna', seed: 1465, ground: 'grass', ops: [
      ['river', [[-2, 88], [20, 86], [44, 90], [70, 86], [98, 90]], 13],
      ['marsh', 28, 77, 9, 3], ['marsh', 90, 77, 6, 3],
      ['forest', [[0, 0], [32, 0], [24, 12], [10, 20], [0, 26]], 0.6], ['forest', [[42, 0], [72, 0], [64, 10], [48, 12]], 0.5],
      ['forest', [[0, 40], [10, 36], [16, 50], [8, 60], [0, 62]], 0.55], ['forestc', 36, 40, 6, 0.5], ['forestc', 88, 30, 7, 0.55],
      ['road', [[18, 22], [32, 36], [46, 50], [58, 60]], 2], ['road', [[0, 66], [22, 68], [44, 70], [60, 67]], 2],
      ['clear', 18, 22, 9], ['clear', 71, 66, 14],
      ['res', 'gold', 32, 14, 7], ['res', 'stone', 6, 30, 6], ['res', 'sheep', 26, 30, 6], ['res', 'berry', 10, 12, 6], ['res', 'gold', 40, 28, 5], ['res', 'stone', 50, 22, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 100, keepHero: 'Ștefan a căzut sub zidurile Chiliei.',
    setup: function (S, T) {
      town(T, 0, 18, 22, 8);
      heroAt(T, 0, 24, 26);
      T.spawn(0, [['raz', 8], ['arc', 6], ['ram', 2]], 26, 30);
      T.spawn(0, [['can', 2]], 22, 30, 'bombarde');
      // cetatea Chiliei: ziduri de piatră, turnuri, fortăreața
      T.wall(1, 62, 57, 80, 57, [9]); T.wall(1, 80, 58, 80, 75, [8]); T.wall(1, 62, 75, 79, 75); T.wall(1, 62, 58, 62, 74, [8]);
      T.bld(1, 'fortareata', 69, 64, true, 'chilia');
      T.bld(1, 'turn', 64, 59, true); T.bld(1, 'turn', 77, 59, true); T.bld(1, 'turn', 64, 72, true); T.bld(1, 'turn', 77, 72, true);
      T.bld(1, 'casa', 66, 68, true); T.bld(1, 'casa', 74, 62, true); T.bld(1, 'cazarma', 73, 68, true);
      T.spawn(1, [['arc', 10], ['mil', 8], ['spr', 4]], 71, 61);
      S.players[0].res = { f: 600, w: 900, g: 500, s: 300 };
    },
    start: function (S, T) {
      T.obj('o1', 'Dărâmă fortăreața Chiliei. Bombardele și berbecii sparg zidurile.');
      T.obj('o2', 'Oprește ajutoarele ungurești de pe drumul de vest (0/3).', { sec: 1 });
      T.obj('o3', 'Ștefan trebuie să trăiască.', { sec: 1, quiet: 1 });
      T.say('stefan', 'Iată Chilia. A doua oară nu mai plec de aici fără ea.', 'say1', 1);
      T.say('parcalab', 'Doamne, bombardele sunt gata. Zidurile sunt groase, dar porțile sunt mai slabe.', 'say2');
      T.say('stefan', 'Fă și un atelier de asediu: ne trebuie berbeci și catapulte.', 'say3');
    },
    timer: function (S) { var w = S.scen.vars.waves || 0; return w < 3 ? Math.max(0, [330, 690, 1050][w] - S.t) : 0; },
    tick: function (S, T) {
      var v = S.scen.vars;
      [330, 690, 1050].forEach(function (t, i) {
        if (S.t >= t && (v.waves || 0) === i) {
          v.waves = i + 1; v['sp_w' + i] = 1;
          T.say('iscoada', 'Vin ajutoare ungurești pe drumul de vest!', 'say4');
          T.wave(1, [['hus', 3 + i], ['mil', 4 + i], ['arc', 3]], [3, 66], [24, 28], 'w' + i);
        }
      });
      var stopped = ['w0', 'w1', 'w2'].filter(function (t) { return lastWave(S, T, t); }).length;
      if (stopped !== v.stopped) { v.stopped = stopped; T.obj('o2', 'Oprește ajutoarele ungurești de pe drumul de vest (' + stopped + '/3).', { sec: 1 }); if (stopped === 3) T.done('o2'); }
    },
    triggers: [
      { id: 'breach', when: function (S, T) { return S.scen.vars.breach; }, do: function () {} },
      { id: 'half', when: function (S, T) { var b = T.get('chilia'); return b && b.hp < b.mhp * 0.5; }, do: function (S, T) { T.say('parcalab', 'Fortăreața se clatină! Încă puțin!', 'say5'); } },
      { id: 'win', when: function (S, T) { return !T.alive('chilia'); }, do: function (S, T) { T.done('o1'); T.say('stefan', 'Chilia e a Moldovei!', 'say6'); T.win(); } }
    ]
  };

  // ===================== 3. Baia, 1467 =====================
  M.st3 = {
    id: 'st3', title: 'Noaptea de la Baia', short: 'Baia', year: '1467', place: 'Baia, în nordul Moldovei', lon: 26.22, lat: 47.42,
    view: { lon: 24.6, lat: 46.6, z: 1.7 },
    arrows: [{ pts: [[19.04, 47.5], [21.5, 46.9], [23.6, 46.1], [25.6, 45.65], [26.3, 46.2], [26.4, 46.9], [26.22, 47.42]], col: '#a01818', t0: 2, t1: 12 },
      { pts: [[26.26, 47.65], [26.24, 47.52], [26.23, 47.45]], col: '#1c4fa0', t0: 10, t1: 14 }],
    intro: [
      'Toamna lui 1467. Regele Ungariei, Matia Corvin, nu i-a iertat lui Ștefan nici Chilia, nici ajutorul dat nobililor transilvăneni răsculați.',
      'Cu o oaste mare, regele trece munții și ajunge, în decembrie, la Baia, un târg bogat din nordul Moldovei. Ungurii petrec și se cred în siguranță.',
      'Ștefan așteaptă în pădurile din jur. Când se lasă noaptea, dă foc târgului și lovește-l pe rege.'
    ],
    outro: [
      'În noaptea de 14 spre 15 decembrie 1467, Baia arde. Oastea ungurească e risipită, iar regele Matia, rănit de trei săgeți, abia scapă peste munți.',
      'Niciodată de atunci Ungaria n-a mai încercat să supună Moldova. Dar dinspre sud se apropie o furtună mult mai mare.'
    ],
    loseText: 'Atacul de noapte a eșuat. Regele Matia rămâne stăpân pe Baia.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'ung', team: 2, ppl: 'ungurii', heroName: 'Matia Corvin', aiMode: 'defend', res: { f: 800, w: 500, g: 600, s: 200 }, techs: ['up_mil2', 'up_mil3', 'up_arc2', 'forja', 'zale1'] }],
    map: { N: 96, season: 'iarna', seed: 1467, ground: 'grass', ops: [
      ['forest', [[0, 0], [42, 0], [32, 20], [20, 30], [0, 36]], 0.7], ['forest', [[0, 64], [24, 64], [32, 80], [22, 96], [0, 96]], 0.7],
      ['forest', [[66, 0], [96, 0], [96, 30], [82, 28], [72, 16]], 0.6], ['forest', [[72, 78], [96, 70], [96, 96], [60, 96]], 0.6],
      ['forestc', 32, 48, 6, 0.4], ['forestc', 40, 30, 4, 0.5], ['forestc', 40, 70, 4, 0.5],
      ['river', [[87, -2], [85, 30], [90, 60], [86, 98]], 2, { fords: [[85, 40]], bridges: [[89, 50]] }],
      ['road', [[96, 50], [72, 50], [56, 50], [40, 52], [20, 52]], 2], ['road', [[56, 26], [56, 76]], 2],
      ['clear', 56, 50, 14], ['clear', 14, 52, 7],
      ['res', 'gold', 8, 42, 6], ['res', 'sheep', 22, 58, 5], ['res', 'berry', 10, 60, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 90, keepHero: 'Ștefan a căzut la Baia.',
    setup: function (S, T) {
      T.bld(0, 'cazarma', 8, 46, true); T.bld(0, 'casa', 12, 56, true); T.bld(0, 'casa', 16, 58, true); T.bld(0, 'casa', 9, 52, true); T.bld(0, 'casa', 18, 46, true);
      T.spawn(0, [['vil', 4]], 14, 50);
      heroAt(T, 0, 16, 52);
      T.spawn(0, [['raz', 12], ['arc', 8], ['lcv', 6]], 18, 54);
      T.bld(1, 'cetate', 54, 47, true, 'curtea');
      T.bld(1, 'manastire', 60, 52, true); T.bld(1, 'targ', 46, 46, true);
      var H = [[48, 42], [51, 39], [58, 41], [63, 45], [64, 49], [57, 57], [51, 56], [46, 52], [61, 57], [66, 54]];
      S.scen.vars.houses = H.map(function (h) { var b = T.bld(1, 'casa', h[0], h[1], true, 'casa_baia'); return { id: b.id, x: b.x, y: b.y }; });
      T.spawn(1, [['mil', 12], ['arc', 8], ['kni', 6], ['hus', 4]], 58, 48);
      heroAt(T, 1, 56, 45);
      S.players[0].res = { f: 600, w: 300, g: 300, s: 0 };
    },
    start: function (S, T) {
      T.obj('o1', 'Așteaptă căderea nopții. Dacă ataci ziua, toată oastea ungurească sare asupra ta.');
      T.obj('o2', 'Dă foc târgului: dărâmă 7 case din Baia (0/7).');
      T.obj('o3', 'Rănește-l pe regele Matia: scade-i viața sub jumătate.');
      T.say('stefan', 'Ungurii petrec în târg. Lăsați-i să petreacă. Noaptea e a noastră.', 'say1', 1);
      T.say('iscoada', 'Doamne, regele Matia stă chiar în casele boierești din mijlocul târgului.', 'say2');
    },
    timer: function (S) { return S.night ? 0 : Math.max(0, 240 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars, burnt = 0;
      (v.houses || []).forEach(function (h) { if (!G.getE(h.id)) { burnt++; if (!h.fire) { h.fire = 1; S.fx.push({ k: 'fire', x: h.x, y: h.y, t: S.t, life: 600 }); } } });
      if (burnt !== v.burnt) { v.burnt = burnt; T.obj('o2', 'Dă foc târgului: dărâmă 7 case din Baia (' + Math.min(7, burnt) + '/7).'); if (burnt >= 7) T.done('o2'); }
      // regele fuge când e rănit
      var h = G.heroOf(1);
      if (h && !v.fled && h.hp < h.mhp * 0.5) { v.fled = 1; T.done('o3'); T.say('narator', 'Regele Matia, lovit de săgeți, fuge spre munți!', 'say5'); T.moveTo([h], 95, 22); h.tag = 'matia'; }
      if (v.fled && h && h.x > 92 && h.y < 26) T.vanish([h]);
      if (v.fled && !h && !S.scen.obj.find(function (o) { return o.id === 'o3'; }).st) T.done('o3');
      if (!h && !v.fled) { v.fled = 1; T.done('o3'); }
    },
    triggers: [
      { id: 'early', when: function (S, T) { return !S.night && G.C.units.some(function (u) { return u.o === 1 && u.hit && S.t - u.hit < 1; }); }, do: function (S, T) {
        T.say('narator', 'Ungurii v-au văzut! Toată oastea lor iese din târg.', 'say3');
        T.mode(1, 'eco'); T.aiGo(1);
      } },
      // noaptea, ungurii sunt prinși nepregătiți (dacă nu i-ai trezit ziua): la primul atac sar din somn amețiți,
      // lovesc mai slab și se mișcă greu vreo două minute și jumătate. Fără asta, atacul de noapte nu folosea la nimic.
      { id: 'surpriza', when: function (S, T) { return S.night && !S.scen.fired.early && G.C.units.some(function (u) { return u.o === 1 && u.hit && S.t - u.hit < 1; }); }, do: function (S, T) {
        var until = S.t + 150;
        G.C.units.forEach(function (u) { if (u.o === 1) u.deb = { a: 0.55, s: 0.75, until: until }; });
        T.say('narator', 'Ungurii sar din somn, amețiți de vin și fără armuri. Lovește acum, cât sunt încurcați!', 'say7');
      } },
      { id: 'night', at: 240, do: function (S, T) {
        T.night(1); T.done('o1');
        T.say('stefan', 'S-a lăsat noaptea. Arcașii, săgeți cu foc pe acoperișuri! Înainte!', 'say4');
      } },
      { id: 'win', when: function (S, T) { return T.isDone('o2') && T.isDone('o3'); }, do: function (S, T) { T.say('stefan', 'Baia arde, iar regele fuge. Moldova nu se lasă supusă!', 'say6'); T.win(); } },
      { id: 'win2', when: function (S, T) { return S.t > 60 && T.army(1).length === 0 && !G.heroOf(1); }, do: function (S, T) { T.win(); } }
    ]
  };

  // ===================== 4. Vaslui, 1475 =====================
  var HORNS = [[18, 40], [20, 56], [24, 72]];
  M.st4 = {
    id: 'st4', title: 'Podul Înalt', short: 'Vaslui', year: '1475', place: 'Podul Înalt, lângă Vaslui', lon: 27.73, lat: 46.64,
    view: { lon: 27.4, lat: 45.2, z: 1.7 },
    arrows: [{ pts: [[26.56, 41.68], [27.3, 42.9], [27.9, 44.2], [27.96, 45.27], [27.8, 45.9], [27.73, 46.6]], col: '#a01818', t0: 2, t1: 12 },
      { pts: [[26.26, 47.65], [26.9, 47.2], [27.5, 46.9], [27.7, 46.7]], col: '#1c4fa0', t0: 9, t1: 14 }],
    intro: [
      'Ianuarie 1475. Sultanul Mehmed al II-lea, cuceritorul Constantinopolului, trimite asupra Moldovei o oaste uriașă, condusă de Soliman Pașa, beilerbeiul Rumeliei.',
      'Ștefan are de trei ori mai puțini oameni. Dar are de partea lui țara: pădurile, mlaștinile, oamenii ei. Și o ceață deasă, care acoperă valea Bârladului.',
      'Ascunde buciumași în pădure, ca să-i păcălească pe otomani, și lovește-i când nu se așteaptă.'
    ],
    outro: [
      'Pe 10 ianuarie 1475, în ceața de la Podul Înalt, oastea otomană a fost zdrobită. A fost una dintre cele mai mari înfrângeri ale otomanilor în fața creștinilor.',
      'Papa Sixt al IV-lea l-a numit pe Ștefan „Atletul lui Hristos”. Dar Ștefan știa că sultanul însuși avea să vină.'
    ],
    loseText: 'Oastea otomană a trecut prin Moldova. Mai încearcă o dată.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'oto', team: 2, heroName: 'Soliman Pașa', aiMode: 'static', techs: ['up_mil2', 'up_arc2', 'forja', 'zale1', 'pene'] }],
    map: { N: 96, season: 'iarna', seed: 1475, ground: 'grass', ops: [
      ['river', [[50, 98], [49, 80], [46, 64], [47, 48], [45, 30], [47, 12], [44, -2]], 2.2, { bridges: [[47, 48]], fords: [[45, 30], [49, 78]] }],
      ['marsh', 47, 60, 4, 9], ['marsh', 46, 36, 4, 7],
      ['forest', [[0, 0], [30, 0], [34, 20], [30, 50], [34, 80], [30, 96], [0, 96]], 0.6],
      ['forest', [[64, 0], [96, 0], [96, 96], [62, 96], [66, 70], [62, 40], [66, 16]], 0.6],
      ['road', [[56, 96], [54, 76], [52, 56], [53, 40], [50, 22], [42, 12]], 2],
      ['clear', 42, 12, 9], ['clear', 56, 88, 9], ['clear', 18, 40, 3], ['clear', 20, 56, 3], ['clear', 24, 72, 3],
      // poteci de vânători până la locurile buciumașilor (altfel pădurea e de netrecut)
      ['road', [[38, 40], [18, 40]], 2], ['road', [[38, 56], [20, 56]], 2], ['road', [[38, 72], [24, 72]], 2],
      ['res', 'gold', 26, 10, 6], ['res', 'stone', 56, 6, 5], ['res', 'sheep', 36, 22, 6], ['res', 'berry', 30, 6, 6], ['res', 'gold', 58, 24, 5], ['res', 'sheep', 60, 14, 4]
    ] },
    fog: 1, losMul: 0.55, startAge: 2, maxAge: 2, popMax: 110, keepHero: 'Ștefan a căzut în ceața de la Vaslui.',
    setup: function (S, T) {
      town(T, 0, 42, 12, 10);
      heroAt(T, 0, 45, 17);
      T.spawn(0, [['raz', 10], ['arc', 6], ['lcv', 4]], 46, 20);
      town(T, 1, 56, 88, 0, 'tabara');
      T.bld(1, 'casa', 50, 84, true); T.bld(1, 'casa', 62, 84, true); T.bld(1, 'casa', 52, 92, true); T.bld(1, 'turn', 61, 92, true); T.bld(1, 'turn', 50, 80, true);
      heroAt(T, 1, 56, 82);
      T.spawn(1, [['ien', 6], ['mil', 6]], 58, 80, 'garda');
      S.players[0].res = { f: 800, w: 700, g: 400, s: 300 };
      HORNS.forEach(function (h, i) { T.mark('h' + i, h[0], h[1], 'Buciumaș', '#ffd75a'); });
    },
    start: function (S, T) {
      T.obj('o1', 'Înfrânge oastea otomană care urcă pe vale (0/3 valuri).');
      T.obj('o2', 'Așază buciumași în cele 3 locuri din pădure: trimite câte un oștean la fiecare steag (0/3).', { sec: 1 });
      T.obj('o3', 'Dărâmă tabăra lui Soliman Pașa, din sudul văii.');
      T.say('stefan', 'Ceața e de partea noastră. Ei nu ne văd, dar nici noi pe ei.', 'say1', 1);
      T.say('stefan', 'Ascundeți buciumașii în pădurea din stânga. Când sună, turcii vor crede că oastea noastră e acolo.', 'say2');
    },
    timer: function (S) { var w = S.scen.vars.waves || 0; return w < 3 ? Math.max(0, [300, 560, 820][w] - S.t) : 0; },
    tick: function (S, T) {
      var v = S.scen.vars;
      // buciumașii: un oștean al tău stă 4 secunde lângă steag
      v.hp = v.hp || [0, 0, 0]; v.hd = v.hd || [0, 0, 0];
      HORNS.forEach(function (h, i) {
        if (v.hd[i]) return;
        if (T.inArea(0, h[0], h[1], 1.8, function (u) { return u.t !== 'vil'; }).length) v.hp[i]++; else v.hp[i] = 0;
        if (v.hp[i] >= 16) { v.hd[i] = 1; T.mark('h' + i, h[0], h[1], 'Buciumaș ✓', '#7fdc6a'); G.sfx('horn2'); }
      });
      var nh = v.hd.filter(Boolean).length;
      if (nh !== v.nh) { v.nh = nh; T.obj('o2', 'Așază buciumași în cele 3 locuri din pădure: trimite câte un oștean la fiecare steag (' + nh + '/3).', { sec: 1 }); if (nh === 3) { T.done('o2'); T.say('stefan', 'Buciumașii sunt la locul lor. Acum turcii nu mai știu încotro să lovească!', 'say3'); } }
      [300, 560, 820].forEach(function (t, i) {
        if (S.t >= t && (v.waves || 0) === i) {
          v.waves = i + 1; v['sp_w' + i] = 1;
          var comp = [[['mil', 10], ['arc', 6], ['lcv', 4]], [['mil', 14], ['arc', 8], ['ien', 5], ['kni', 4]], [['mil', 18], ['arc', 10], ['ien', 8], ['kni', 6], ['can', 2]]][i];
          var u = T.spawn(1, comp, 55, 92, 'w' + i);
          if (nh === 3) { T.attackMove(u, 24, 56); u.forEach(function (x) { x.deb = { a: 0.75, until: S.t + 150 }; }); T.say('iscoada', 'Turcii au auzit buciumele și o iau spre pădure! Sunt derutați!', 'say4'); }
          else { T.attackMove(u, 42, 14); T.say('iscoada', 'Vine un val otoman pe vale!', 'say5'); }
        }
      });
      // cei duși la buciumași se întorc spre tabăra ta după ce nu găsesc nimic
      ['w0', 'w1', 'w2'].forEach(function (tg) { T.byTag(tg).forEach(function (u) { if (!u.task && u.wave) T.attackMove([u], 42, 14); }); });
      var beaten = ['w0', 'w1', 'w2'].filter(function (t) { return lastWave(S, T, t); }).length;
      if (beaten !== v.beaten) { v.beaten = beaten; T.obj('o1', 'Înfrânge oastea otomană care urcă pe vale (' + beaten + '/3 valuri).'); if (beaten === 3) { T.done('o1'); T.fog(0); T.say('narator', 'Ceața se ridică. Pe vale, oastea otomană e risipită. Tabăra lui Soliman e descoperită!', 'say6'); T.reveal(56, 88, 12); } }
    },
    triggers: [
      { id: 'win', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) { T.done('o3'); T.say('stefan', 'Podul Înalt e al nostru! Lăudat fie Domnul!', 'say7'); T.win(); } }
    ]
  };

  // ===================== 5. Neamț, 1476 =====================
  M.st5 = {
    id: 'st5', title: 'Du-te și luptă!', short: 'Neamț', year: '1476', place: 'Cetatea Neamțului', lon: 26.36, lat: 47.2,
    view: { lon: 26.8, lat: 45.8, z: 1.6 },
    arrows: [{ pts: [[26.56, 41.68], [27.4, 43.2], [27.96, 45.27], [27.3, 46.2], [26.7, 46.9], [26.55, 47.05]], col: '#a01818', t0: 1, t1: 9 },
      { pts: [[26.55, 47.05], [26.45, 47.12], [26.36, 47.2]], col: '#a01818', t0: 9, t1: 12 }],
    intro: [
      'Vara lui 1476. Sultanul Mehmed al II-lea vine el însuși, cu o oaste cum Moldova nu mai văzuse. Pe 26 iulie, la Valea Albă, lângă Războieni, oastea lui Ștefan e înfrântă.',
      'Rănit, cu puțini oameni, Ștefan ajunge la Cetatea Neamțului. Legenda spune că mama lui i-a strigat de pe ziduri să nu-i deschidă: „Du-te și strânge oaste! Să vii biruitor, și atunci îți voi deschide.”',
      'Ține cetatea împotriva sultanului. În nord, Ștefan strânge o oaste nouă.'
    ],
    outro: [
      'Mehmed al II-lea, cuceritorul Constantinopolului, n-a putut lua Cetatea Neamțului. Lovit de foamete și de boli, hărțuit zi și noapte de oștenii lui Ștefan, sultanul se retrage peste Dunăre.',
      'Moldova a rezistat. Iar Ștefan a ridicat, ca după fiecare luptă, o biserică.'
    ],
    loseText: 'Cetatea Neamțului a căzut. Mai încearcă o dată.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'oto', team: 2, heroName: 'Mehmed al II-lea', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'up_arc2', 'forja', 'fonta', 'zale1', 'pene', 'chimie'] }],
    map: { N: 96, season: 'vara', seed: 1476, ground: 'grass', ops: [
      ['forest', [[0, 0], [96, 0], [96, 6], [72, 12], [62, 30], [30, 30], [20, 10], [0, 8]], 0.55], ['clear', 40, 16, 10],
      ['forest', [[0, 30], [20, 34], [26, 60], [16, 96], [0, 96]], 0.65], ['forest', [[96, 30], [80, 40], [76, 70], [84, 96], [96, 96]], 0.65],
      ['river', [[66, 28], [68, 60], [72, 98]], 2, { fords: [[67, 44]] }],
      ['road', [[40, 16], [44, 40], [49, 54]], 2], ['road', [[49, 74], [50, 96]], 2],
      ['clear', 49, 63, 14], ['clear', 50, 88, 8],
      ['res', 'gold', 28, 16, 6], ['res', 'stone', 54, 10, 6], ['res', 'sheep', 46, 22, 6], ['res', 'berry', 32, 24, 5], ['res', 'gold', 58, 22, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 120, keepHero: 'Ștefan a căzut. Fără el, Moldova nu mai are speranță.',
    setup: function (S, T) {
      // cetatea, apărată de garnizoană
      T.wall(0, 40, 54, 58, 54, [8]); T.wall(0, 58, 55, 58, 72); T.wall(0, 40, 72, 57, 72); T.wall(0, 40, 55, 40, 71, [7]);
      // zidurile groase ale Neamțului: fortăreața ține de două ori mai mult decât una obișnuită
      var nf = T.bld(0, 'fortareata', 47, 61, true, 'neamt'); nf.hpMax = nf.mhp = nf.hp = nf.hp * 2;
      T.bld(0, 'turn', 42, 56, true); T.bld(0, 'turn', 55, 56, true); T.bld(0, 'turn', 42, 69, true); T.bld(0, 'turn', 55, 69, true);
      T.spawn(0, [['arc', 8], ['mil', 6]], 49, 66, 'garnizoana');
      T.spawn(0, [['can', 2]], 46, 58, 'garnizoana');
      // Ștefan, în pădurile din nord
      town(T, 0, 40, 16, 6);
      heroAt(T, 0, 44, 20);
      T.spawn(0, [['lcv', 4]], 46, 20);
      // sultanul
      town(T, 1, 50, 88, 0, 'tabara');
      T.bld(1, 'casa', 44, 84, true); T.bld(1, 'casa', 56, 84, true); T.bld(1, 'casa', 44, 92, true); T.bld(1, 'casa', 56, 92, true);
      heroAt(T, 1, 50, 82);
      T.spawn(1, [['mil', 16], ['arc', 10], ['ien', 8], ['kni', 4], ['can', 2], ['treb', 1]], 50, 79, 'asediu');
      S.players[0].res = { f: 700, w: 600, g: 400, s: 150 };
    },
    start: function (S, T) {
      T.obj('o1', 'Cetatea Neamțului trebuie să reziste 15 minute.');
      T.obj('o2', 'În nord, Ștefan strânge o oaste nouă: 25 de oșteni.');
      T.obj('o3', 'Ștefan trebuie să trăiască.', { sec: 1, quiet: 1 });
      T.say('mama', 'Du-te și strânge oaste! Să vii biruitor, și atunci îți voi deschide.', 'say1', 1);
      T.say('stefan', 'Așa voi face, mamă. Cetatea să țină până mă întorc.', 'say2');
      T.say('parcalab', 'Ne ținem, Doamne! Avem ziduri, avem tunuri.', 'say3');
    },
    timer: function (S) { return Math.max(0, 900 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars;
      // asalturi asupra cetății, din două în două minute
      if (S.t >= 60 && S.t >= (v.next || 60)) {
        v.next = S.t + 120;
        // tunurile și trebușetele intră în luptă abia după ce le așază (minutul 5)
        var f = T.get('neamt'), all = T.byTag('asediu').filter(function (u) { return (!u.task || !u.wave) && (S.t >= 300 || G.UNITS[u.t].cls !== 'sie'); });
        var n = Math.ceil(all.length * 0.5), go = all.slice(0, n);
        if (f) go.forEach(function (u) { if (G.UNITS[u.t].onlyBld || G.UNITS[u.t].cls === 'sie') G.cmdAttack([u], f); else T.attackMove([u], 49, 63); u.wave = 1; });
        if (go.length) T.say('parcalab', 'Turcii atacă zidurile!', 'say4');
      }
      if (S.t >= 270 && !v.guns) { v.guns = 1; T.say('parcalab', 'Doamne, își așază tunurile! Dacă le dărâmăm, zidurile țin.', 'say8'); }
      // întăriri pentru sultan până la ciumă
      if (S.t < 600 && S.t >= (v.reinf || 180)) { v.reinf = S.t + 180; T.spawn(1, [['mil', 5], ['arc', 3]], 50, 92, 'asediu'); }
      if (S.t >= 600 && !v.plague) { v.plague = 1; T.debuff(1, 0.75, 900); T.say('narator', 'Ciuma și foametea bântuie tabăra otomană. Sultanul își pierde oamenii.', 'say5'); }
      if (v.plague && S.t >= (v.pd || 0)) { v.pd = S.t + 20; G.C.units.forEach(function (u) { if (u.o === 1 && !G.UNITS[u.t].hero) G.damage(u, 4, null); }); }
      if (!T.isDone('o2') && T.army(0).filter(function (u) { return u.tag !== 'garnizoana'; }).length >= 25) { T.done('o2'); T.say('stefan', 'Oastea e strânsă. La Neamț!', 'say6'); }
      if (!T.isDone('o1') && S.t >= 900 && T.alive('neamt')) T.done('o1');
      if (T.isDone('o1') && T.isDone('o2') && !v.o4) { v.o4 = 1; T.obj('o4', 'Alungă-l pe sultan: dărâmă tabăra lui.'); }
    },
    triggers: [
      { id: 'lost', when: function (S, T) { return !T.alive('neamt'); }, do: function (S, T) { T.lose('Cetatea Neamțului a căzut.'); } },
      { id: 'win', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) { T.done('o4'); T.say('mama', 'Te-ai întors biruitor, fiule. Porțile îți sunt deschise.', 'say7'); T.win(); } }
    ]
  };

  // ===================== 6. Codrii Cosminului, 1497 =====================
  var ROUTE = [[50, 95], [54, 82], [48, 66], [52, 48], [46, 30], [47, 14], [46, 1]];
  // locurile copacilor tăiați: pe marginea drumului, la două pătrățele de mijlocul lui
  var TRAPS = [[56, 82], [46, 67], [52, 55], [52, 41], [44, 30], [49, 20]];
  // câți poloni pot scăpa: 12 la Normal; pe Greu și Foarte greu oastea lor e mai mare, deci și pragul crește la fel
  function escMax(S) { return Math.round(12 * ({ greu: 1.25, foarte: 1.5 }[S.diff] || 1)); }
  M.st6 = {
    id: 'st6', title: 'Pădurea care cade', short: 'Cosmin', year: '1497', place: 'Codrii Cosminului', lon: 25.85, lat: 48.25,
    view: { lon: 24.2, lat: 48.6, z: 1.8 },
    arrows: [{ pts: [[19.94, 50.06], [22.0, 49.6], [24.03, 49.84], [25.5, 48.6], [26.26, 47.65]], col: '#a01818', t0: 1, t1: 9 },
      { pts: [[26.26, 47.65], [26.0, 48.0], [25.85, 48.25]], col: '#a01818', t0: 9, t1: 13 }],
    intro: [
      '1497. Regele Poloniei, Ioan Albert, vine cu o oaste mare, spunând că merge împotriva turcilor. Dar se oprește la Suceava și o asediază.',
      'Cetatea rezistă. Când regele se retrage spre Polonia, prin Codrii Cosminului, Ștefan îl așteaptă.',
      'Pregătește pădurea: copacii de lângă drum, tăiați pe jumătate, trebuie să cadă peste oastea polonă.'
    ],
    outro: [
      'Pe 26 octombrie 1497, în Codrii Cosminului, copacii au căzut peste oastea polonă. Regele Ioan Albert abia a scăpat.',
      'Legenda spune că Ștefan i-a pus pe prizonierii polonezi să are un câmp și să semene ghinde. Din ele a crescut Dumbrava Roșie. Ștefan a mai domnit șapte ani și e îngropat la Putna. Moldova îl numește, de atunci, Ștefan cel Mare și Sfânt.'
    ],
    loseText: 'Prea mulți poloni au scăpat din pădure.',
    players: [{ civ: 'mol', team: 1 }, { civ: 'pol', team: 2, heroName: 'Ioan Albert', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'forja', 'zale1', 'sab1'] }],
    map: { N: 96, season: 'vara', seed: 1497, ground: 'grass', ops: [
      ['forest', [[0, 0], [96, 0], [96, 96], [0, 96]], 0.6],
      ['road', ROUTE, 3],
      // poteca satului până la drumul mare (altfel pădurea e de netrecut)
      ['road', [[72, 31], [62, 33], [53, 31], [47, 30]], 2],
      ['clear', 78, 30, 10], ['clear', 50, 92, 5]
    ].concat(TRAPS.map(function (t) { return ['clear', t[0] + 0.5, t[1] + 0.5, 2.3]; })).concat([
      ['res', 'gold', 86, 20, 6], ['res', 'stone', 70, 20, 5], ['res', 'sheep', 74, 40, 6], ['res', 'berry', 88, 36, 6]
    ]) },
    startAge: 2, maxAge: 2, popMax: 110, keepHero: 'Ștefan a căzut în Codrii Cosminului.',
    setup: function (S, T) {
      town(T, 0, 78, 30, 10);
      heroAt(T, 0, 74, 34);
      T.spawn(0, [['raz', 10], ['arc', 10], ['lcv', 6], ['kni', 4]], 72, 32);
      TRAPS.forEach(function (t, i) { T.bld(0, 'capcana', t[0], t[1], false, 'cap'); T.reveal(t[0] + 0.5, t[1] + 0.5, 3); T.mark('cap' + i, t[0] + 0.5, t[1] + 0.5, '', '#ffd75a'); });
      // polonii sosesc abia după 4 minute: până atunci nu sunt „învinși”
      S.players[1].immortal = true;
      // drumul mare se vede de la început
      for (var r = 0; r < ROUTE.length - 1; r++) for (var k = 0; k <= 8; k++) T.reveal(ROUTE[r][0] + (ROUTE[r + 1][0] - ROUTE[r][0]) * k / 8, ROUTE[r][1] + (ROUTE[r + 1][1] - ROUTE[r][1]) * k / 8, 3);
      S.players[0].res = { f: 700, w: 400, g: 500, s: 100 };
    },
    start: function (S, T) {
      T.obj('o1', 'Taie copacii de lângă drum: trimite țăranii la cele 6 steaguri galbene (0/6).');
      T.obj('o2', 'Nu lăsa să scape mai mult de ' + escMax(S) + ' poloni spre nord (scăpați: 0).');
      T.obj('o3', 'Înfrânge oastea regelui Ioan Albert.');
      T.say('stefan', 'Regele se întoarce acasă pe drumul ăsta. Nu va ajunge.', 'say1', 1);
      T.say('taran', 'Doamne, tăiem copacii pe jumătate. La un semn, cad toți deodată.', 'say2');
      T.say('taran', 'Poteca din sat duce la drumul mare. Locurile sunt la steagurile galbene: trimite câte doi dintre noi la fiecare.', 'say6');
    },
    timer: function (S) { return Math.max(0, 240 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars;
      var armed = T.byTag('cap').filter(function (b) { return b.built; });
      var built = (v.used || 0) + armed.length;
      if (built !== v.built) { v.built = built; T.obj('o1', 'Taie copacii de lângă drum: trimite țăranii la cele 6 steaguri galbene (' + Math.min(6, built) + '/6).'); if (built >= 6) T.done('o1'); }
      T.byTag('cap').forEach(function (b, i) { if (b.built) T.unmark('cap' + TRAPS.findIndex(function (t) { return t[0] === b.tx && t[1] === b.ty; })); });
      if (S.t >= 240 && !v.spawned) {
        v.spawned = 1;
        var u = T.spawn(1, [['cpl', 10], ['kni', 8], ['mil', 10], ['arc', 8], ['spr', 6]], 50, 92, 'pol').concat(T.spawn(1, [['hero', 1]], 51, 94, 'pol'));
        u.forEach(function (x) { x.wp = 1; });
        T.say('iscoada', 'Vin polonii! Regele e în mijlocul lor.', 'say3');
      }
      // polonii merg pe drum, de la un punct la altul
      T.byTag('pol').forEach(function (u) {
        if (u.y < 3) { v.esc = (v.esc || 0) + 1; T.vanish([u]); return; }
        if (u.task && u.task.k !== 'move') return;
        u.wp = u.wp || 1;
        var w = ROUTE[u.wp];
        if (G.hyp(u.x - w[0], u.y - w[1]) < 3 && u.wp < ROUTE.length - 1) u.wp++;
        if (!u.task || u.lastWp !== u.wp) { u.lastWp = u.wp; w = ROUTE[u.wp]; T.moveTo([u], w[0] + (u.id % 3 - 1) * 0.8, w[1]); }
      });
      if (v.esc !== v.escS) { v.escS = v.esc; T.obj('o2', 'Nu lăsa să scape mai mult de ' + escMax(S) + ' poloni spre nord (scăpați: ' + (v.esc || 0) + ').'); if (v.esc > escMax(S)) T.lose('Prea mulți poloni au scăpat din pădure.'); }
      // capcanele: copacii cad peste dușmani
      armed.forEach(function (b) {
        var hit = G.C.units.some(function (u) { return u.o === 1 && G.hyp(u.x - b.x, u.y - b.y) < 3.4; });
        if (!hit) return;
        G.C.units.forEach(function (u) { if (u.o === 1 && G.hyp(u.x - b.x, u.y - b.y) < 3.8) G.damage(u, G.UNITS[u.t].hero ? 30 : 45, null); });
        T.boom(b.x, b.y, 1.8); G.sfx('collapse', b.x, b.y);
        S.decor.push({ k: 'log0', x: b.x - 0.6, y: b.y + 0.4 }, { k: 'log1', x: b.x + 0.5, y: b.y - 0.3 });
        v.used = (v.used || 0) + 1; T.vanish([b]);
        if (!v.firstTrap) { v.firstTrap = 1; T.say('stefan', 'Acum! Copacii, peste ei!', 'say4'); }
      });
      if (v.spawned && !T.alive('pol') && !v.won) { v.won = 1; T.done('o3'); if ((v.esc || 0) <= escMax(S)) T.done('o2'); T.say('stefan', 'Pădurea și-a făcut datoria. Moldova e liberă.', 'say5'); T.win(); }
    },
    triggers: []
  };

  G.CAMPAIGNS.push({ id: 'stefan', name: 'Ștefan cel Mare', civ: 'mol', sub: 'Atletul lui Hristos, 1457–1504', view: { lon: 27.3, lat: 46.6, z: 2.4 },
    scen: ['st1', 'st2', 'st3', 'st4', 'st5', 'st6'] });
})();
