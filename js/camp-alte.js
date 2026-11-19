// Celelalte campanii: Vlad Țepeș, Iancu de Hunedoara, Mehmed Cuceritorul, Vladislav Jagiello, Mengli Giray.
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

  // ===================== VLAD ȚEPEȘ =====================
  M.vl1 = {
    id: 'vl1', title: 'Tronul Țării Românești', short: 'Târgoviște', year: '1456', place: 'Târgoviște', lon: 25.46, lat: 44.93,
    view: { lon: 24.6, lat: 45.3, z: 2.0 },
    arrows: [{ pts: [[24.15, 45.8], [24.6, 45.5], [25.1, 45.2], [25.46, 44.93]], col: '#1c4fa0', t0: 2, t1: 10 }],
    intro: [
      'Vara anului 1456. Vlad, fiul lui Vlad Dracul, a crescut ostatic la curtea sultanului și a învățat acolo cum se poartă războiul.',
      'Acum, din Transilvania, coboară spre Târgoviște, ca să ia tronul de la Vladislav al II-lea, cel vinovat de moartea tatălui său.',
      'Cucerește Curtea Domnească și nu-l lăsa pe Vladislav să scape.'
    ],
    outro: [
      'Pe 20 august 1456, Vladislav al II-lea cade în luptă. Vlad devine domn al Țării Românești.',
      'Va domni cu o mână de fier: boierii trădători și hoții se tem de el, iar sultanul va afla curând ce înseamnă să-l ai dușman.'
    ],
    players: [{ civ: 'val', team: 1 }, { civ: 'val', team: 2, ppl: 'oamenii lui Vladislav', heroName: 'Vladislav al II-lea', aiMode: 'eco', res: { f: 600, w: 600, g: 400, s: 300 } }],
    map: { N: 96, season: 'vara', seed: 1456, ground: 'grass', ops: [
      ['forest', [[0, 0], [40, 0], [30, 14], [12, 22], [0, 24]], 0.65], ['forest', [[0, 50], [14, 46], [24, 64], [16, 96], [0, 96]], 0.6],
      ['forest', [[60, 70], [96, 60], [96, 96], [56, 96]], 0.6], ['forestc', 44, 40, 6, 0.5], ['forestc', 30, 76, 5, 0.5],
      ['river', [[96, 30], [74, 36], [58, 46], [46, 66], [40, 98]], 2.4, { fords: [[66, 41], [43, 82]], bridges: [[52, 54]] }],
      ['road', [[18, 34], [36, 44], [52, 54], [70, 62], [76, 66]], 2],
      ['clear', 18, 34, 8], ['clear', 76, 68, 12],
      ['res', 'gold', 26, 24, 6], ['res', 'stone', 8, 40, 5], ['res', 'sheep', 26, 40, 6], ['res', 'berry', 10, 28, 6], ['res', 'gold', 60, 84, 6], ['res', 'relic', 46, 22, 1]
    ] },
    maxAge: 2, startAge: 1, popMax: 90, keepHero: 'Vlad a căzut. Vladislav rămâne pe tron.',
    setup: function (S, T) {
      town(T, 0, 18, 34, 6); heroAt(T, 0, 22, 38);
      T.spawn(0, [['mil', 8], ['arc', 6], ['lcv', 4]], 24, 40);
      T.wall(1, 68, 58, 86, 58, [9], 'pal'); T.wall(1, 86, 59, 86, 78, [], 'pal'); T.wall(1, 68, 78, 85, 78, [], 'pal'); T.wall(1, 68, 59, 68, 77, [9], 'pal');
      T.bld(1, 'cetate', 75, 66, true, 'curtea'); T.bld(1, 'turn', 70, 60, true); T.bld(1, 'turn', 83, 75, true); T.bld(1, 'cazarma', 80, 61, true); T.bld(1, 'casa', 71, 73, true);
      T.spawn(1, [['vil', 6]], 78, 72);
      T.spawn(1, [['mil', 10], ['spr', 4], ['arc', 6], ['lcv', 4]], 72, 66);
      heroAt(T, 1, 77, 64);
      S.players[0].res = { f: 500, w: 500, g: 300, s: 150 };
    },
    start: function (S, T) {
      T.obj('o1', 'Cucerește Curtea Domnească de la Târgoviște: dărâmă cetatea din spatele gardului.');
      T.obj('o2', 'Vladislav al II-lea nu trebuie să scape.');
      T.say('vlad', 'Târgoviște. Curtea tatălui meu. Astăzi plătește cine l-a trădat.', 'say1', 1);
      T.say('boier', 'Doamne, nu toți boierii îl iubesc pe Vladislav. Unii așteaptă doar un semn.', 'say2');
    },
    triggers: [
      { id: 'raid', at: 300, do: function (S, T) { T.say('iscoada', 'Călăreții lui Vladislav vin spre noi!', 'say3'); T.wave(1, [['lcv', 4], ['mil', 4]], [66, 62], [18, 34], 'raid'); } },
      { id: 'boieri', at: 420, do: function (S, T) {
        T.say('boier', 'Boierii lui Vladislav trec de partea ta, Doamne! Iată-ne!', 'say4');
        T.spawn(0, [['kni', 5]], 52, 50);
      } },
      { id: 'go', at: 780, do: function (S, T) { T.aiGo(1); } },
      { id: 'o2', when: function (S, T) { return S.t > 5 && !G.heroOf(1); }, do: function (S, T) { T.done('o2'); T.say('vlad', 'Vladislav a căzut. Dreptatea s-a făcut.', 'say5'); } },
      { id: 'o1', when: function (S, T) { return !T.alive('curtea'); }, do: function (S, T) { T.done('o1'); } },
      { id: 'win', when: function (S, T) { return T.isDone('o1') && T.isDone('o2'); }, do: function (S, T) { T.win(); } }
    ]
  };
  var PLOT = [52, 30];
  M.vl2 = {
    id: 'vl2', title: 'Cetatea de pe stâncă', short: 'Poenari', year: '1459', place: 'Poenari, pe Argeș', lon: 24.64, lat: 45.35,
    view: { lon: 24.9, lat: 45.0, z: 2.4 },
    arrows: [],
    intro: [
      'Paștele anului 1459. Vlad i-a chemat pe boierii care i-au trădat pe domnii dinaintea lui. Mulți nu s-au mai întors acasă.',
      'Cei rămași au fost trimiși la munte, pe o stâncă de deasupra Argeșului, să ridice cu mâinile lor o cetate de neînvins: Poenari.',
      'Ridică fortăreața pe stâncă și două turnuri lângă ea, în timp ce călăreții turci prădează valea.'
    ],
    outro: [
      'Cetatea Poenari a fost gata. Cocoțată pe stâncă, cu o singură cărare spre ea, devine adăpostul cel mai sigur al lui Vlad.',
      'Legenda spune că boierii au muncit acolo până li s-au rupt hainele de pe ei. Iar turcii au învățat că Țara Românească nu mai plătește bir fără luptă.'
    ],
    players: [{ civ: 'val', team: 1 }, { civ: 'oto', team: 2, aiMode: 'static' }],
    map: { N: 96, season: 'vara', seed: 1459, ground: 'grass', ops: [
      ['rock', [[0, 0], [40, 0], [44, 18], [38, 40], [44, 58], [30, 66], [0, 60]]],
      ['rock', [[60, 0], [96, 0], [96, 56], [70, 50], [62, 36], [64, 22]]],
      ['rock', [[0, 76], [20, 74], [26, 96], [0, 96]]], ['rock', [[74, 72], [96, 70], [96, 96], [70, 96]]],
      ['river', [[52, -2], [54, 30], [50, 52], [56, 76], [50, 98]], 2.4, { fords: [[52, 44], [53, 66]], bridges: [[51, 58]] }],
      ['clear', 52, 30, 5], ['forestc', 34, 74, 6, 0.6], ['forestc', 64, 68, 5, 0.6], ['forestc', 46, 86, 5, 0.6],
      ['road', [[50, 96], [46, 80], [44, 66], [48, 50], [50, 36], [52, 32]], 2],
      ['clear', 40, 74, 8],
      ['res', 'stone', 32, 64, 8], ['res', 'stone', 62, 58, 7], ['res', 'gold', 58, 82, 6], ['res', 'sheep', 46, 70, 6], ['res', 'berry', 30, 82, 6]
    ] },
    startAge: 2, maxAge: 2, popMax: 80, keepHero: 'Vlad a căzut.',
    setup: function (S, T) {
      town(T, 0, 40, 74, 10); heroAt(T, 0, 44, 78);
      T.spawn(0, [['mil', 4], ['arc', 4]], 44, 70);
      S.players[0].res = { f: 500, w: 700, g: 300, s: 300 };
      T.mark('plot', PLOT[0], PLOT[1], 'Stânca de la Poenari', '#ffd75a');
    },
    start: function (S, T) {
      T.obj('o1', 'Ridică o Fortăreață pe stânca de la Poenari (steagul galben). Îți trebuie 650 de piatră.');
      T.obj('o2', 'Ridică două turnuri lângă fortăreață (0/2).');
      T.obj('o3', 'Respinge călăreții turci (0/4 raiduri).', { sec: 1 });
      T.say('vlad', 'Aici, pe stânca asta, va sta cetatea mea. Nimeni nu va urca până la ea.', 'say1', 1);
    },
    timer: function (S) { var w = S.scen.vars.w || 0; return w < 4 ? Math.max(0, (w + 1) * 240 - S.t) : 0; },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (S.t >= ((v.w || 0) + 1) * 240 && (v.w || 0) < 4) {
        var i = v.w || 0; v.w = i + 1; v['sp_r' + i] = 1;
        T.say('iscoada', 'Achingii turci în vale! Păziți țăranii!', 'say2');
        T.wave(1, [['lcv', 4 + i * 2], ['har', 2 + i]], [50, 95], [40, 74], 'r' + i);
      }
      var beaten = [0, 1, 2, 3].filter(function (i) { return waveDone(S, T, 'r' + i); }).length;
      if (beaten !== v.beaten) { v.beaten = beaten; T.obj('o3', 'Respinge călăreții turci (' + beaten + '/4 raiduri).', { sec: 1 }); if (beaten === 4) T.done('o3'); }
      var fort = G.C.blds.find(function (b) { return b.o === 0 && b.t === 'fortareata' && b.built && Math.hypot(b.x - PLOT[0], b.y - PLOT[1]) < 7; });
      if (fort && !T.isDone('o1')) { T.done('o1'); T.say('vlad', 'Poenari stă în picioare. Acum turnurile!', 'say3'); }
      var tw = fort ? G.C.blds.filter(function (b) { return b.o === 0 && b.t === 'turn' && b.built && G.dist(b, fort) < 12; }).length : 0;
      if (tw !== v.tw) { v.tw = tw; T.obj('o2', 'Ridică două turnuri lângă fortăreață (' + Math.min(2, tw) + '/2).'); if (tw >= 2) T.done('o2'); }
      if (T.isDone('o1') && T.isDone('o2') && !v.won) { v.won = 1; T.win(); }
    },
    triggers: []
  };
  // poteca spre munți, prin pădurea din nord: pe aici scapă Vlad
  var VL3_TRAIL = [[48, 26], [47, 14], [48, 0]];
  function trailDist(x, y) {
    var best = 99;
    for (var i = 0; i < VL3_TRAIL.length - 1; i++) {
      var a = VL3_TRAIL[i], b = VL3_TRAIL[i + 1], dx = b[0] - a[0], dy = b[1] - a[1];
      var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy));
    }
    return best;
  }
  M.vl3 = {
    id: 'vl3', title: 'Atacul de noapte', short: 'Atacul de noapte', year: '1462', place: 'Tabăra sultanului, lângă Târgoviște', lon: 25.3, lat: 44.75,
    view: { lon: 26.0, lat: 44.3, z: 1.8 },
    arrows: [{ pts: [[25.97, 43.9], [25.8, 44.3], [25.5, 44.6], [25.3, 44.75]], col: '#a01818', t0: 1, t1: 8 }],
    intro: [
      'Iunie 1462. Vlad a refuzat să mai plătească bir și a trecut Dunărea, lovind cetățile turcești. Sultanul Mehmed al II-lea vine acum cu o oaste uriașă.',
      'Vlad nu poate câștiga o bătălie deschisă. Dar poate face altceva: în noaptea de 17 iunie, cu câteva mii de călăreți, intră chiar în tabăra sultanului.',
      'Pătrunde în tabără, găsește cortul cel mare și dărâmă-l. Apoi scapă spre nord înainte să se lumineze.'
    ],
    outro: [
      'Atacul de noapte a semănat groaza în tabăra otomană. Vlad a ajuns până la corturile vizirilor, dar sultanul a scăpat.',
      'Când oastea turcă a ajuns la Târgoviște, a găsit drumul străjuit de mii de trupuri trase în țeapă. Mehmed s-a întors acasă. Vlad Țepeș a intrat în legendă.'
    ],
    players: [{ civ: 'val', team: 1 }, { civ: 'oto', team: 2, heroName: 'Mehmed al II-lea', aiMode: 'static', techs: ['up_mil2', 'up_arc2'] }],
    map: { N: 96, season: 'vara', seed: 1462, ground: 'grass', ops: [
      ['forest', [[0, 0], [96, 0], [96, 12], [60, 16], [40, 14], [0, 16]], 0.65], ['forest', [[0, 30], [14, 34], [16, 70], [0, 80]], 0.55],
      ['forest', [[96, 30], [84, 36], [86, 72], [96, 80]], 0.55],
      ['river', [[-2, 92], [40, 88], [96, 94]], 4],
      ['clear', 48, 56, 22], ['clear', 48, 22, 6],
      ['road', VL3_TRAIL, 2]
    ] },
    night: 1, losMul: 0.6, popMax: 120, noHero: 1, keepHero: 'Vlad a căzut în tabăra turcească.',
    setup: function (S, T) {
      heroAt(T, 0, 48, 20);
      T.spawn(0, [['lcv', 18], ['kni', 10], ['vit', 8]], 48, 24);
      T.bld(1, 'cetate', 46, 54, true, 'cort');
      var tents = [[36, 44], [40, 40], [56, 40], [60, 46], [62, 56], [58, 64], [44, 66], [36, 62], [32, 52], [52, 70], [66, 50], [30, 44]];
      tents.forEach(function (t) { T.bld(1, 'casa', t[0], t[1], true, 'cortul'); });
      T.spawn(1, [['mil', 18], ['arc', 10], ['ien', 10], ['kni', 8], ['lcv', 6]], 48, 58, 'tabara');
      heroAt(T, 1, 50, 60);
      for (var i = 0; i < 8; i++) T.light(30 + i * 5, 48 + (i % 3) * 6, 2.5);
    },
    start: function (S, T) {
      T.obj('o1', 'Pătrunde în tabără și dărâmă cortul cel mare al sultanului (steagul roșu).');
      T.obj('o2', 'Dă foc corturilor (0/6).', { sec: 1 });
      T.obj('o3', 'Vlad trebuie să trăiască.', { sec: 1, quiet: 1 });
      T.say('vlad', 'Fără torțe până la margine. Când intrăm, să nu rămână un cort în picioare!', 'say1', 1);
    },
    timer: function (S) { return Math.max(0, 900 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars, burnt = 12 - T.alive('cortul');
      // cortul cel mare, cu un steag roșu pe el (și în jocurile începute înainte de steag)
      if (!v.cortMark) { v.cortMark = 1; var ct = T.byTag('cort')[0]; if (ct && !ct.dead) { T.mark('cort', ct.x, ct.y, 'Cortul sultanului', '#ff5a4a'); T.obj('o1', 'Pătrunde în tabără și dărâmă cortul cel mare al sultanului (steagul roșu).'); } }
      if (burnt !== v.burnt) { v.burnt = burnt; T.obj('o2', 'Dă foc corturilor (' + Math.min(6, burnt) + '/6).', { sec: 1 }); if (burnt >= 6) T.done('o2'); }
      if (!v.alarm && G.C.units.some(function (u) { return u.o === 1 && u.hit && S.t - u.hit < 1; })) {
        v.alarm = 1; T.say('ienicer', 'Alarmă! Ghiaurii sunt în tabără!', 'say2'); T.mode(1, 'eco'); T.aiGo(1);
      }
      if (S.t > 900 && !v.dawn) { v.dawn = 1; T.night(0); T.say('narator', 'Se luminează. Toată oastea sultanului se trezește.', 'say3'); T.mode(1, 'eco'); T.aiGo(1); }
      if (T.isDone('o1') && !v.esc) v.esc = 1;
      // fuga: steagul și poteca. Și în jocurile salvate înainte să existe poteca: copacii de pe ea cad acum.
      if (v.esc && !v.trail) {
        v.trail = 1; T.obj('o4', 'Scapă spre munți: du-l pe Vlad la steagul galben din nord, pe poteca prin pădure.'); T.mark('nord', 48, 8, 'Spre munți');
        S.ents.forEach(function (e) { if (e.k === 'r' && e.t === 'tree' && !e.dead && trailDist(e.x, e.y) < 1.6) G.kill(e, null); });
        for (var py = 26; py >= 2; py -= 3) T.reveal(48, py, 3);
      }
      if (v.esc && T.heroIn(0, 48, 8, 6) && !v.won) { v.won = 1; T.done('o4'); T.win(); }
    },
    triggers: [
      { id: 'cort', when: function (S, T) { return !T.alive('cort'); }, do: function (S, T) { T.done('o1'); T.unmark('cort'); T.say('vlad', 'Cortul cel mare arde! Înapoi, spre munți!', 'say4'); } }
    ]
  };

  // ===================== IANCU DE HUNEDOARA =====================
  M.ia1 = {
    id: 'ia1', title: 'Prima victorie', short: 'Sibiu', year: '1442', place: 'Lângă Sibiu', lon: 24.15, lat: 45.8,
    view: { lon: 24.6, lat: 45.2, z: 2.0 },
    arrows: [{ pts: [[25.97, 43.9], [25.5, 44.6], [24.8, 45.3], [24.3, 45.7]], col: '#a01818', t0: 1, t1: 8 }, { pts: [[22.9, 45.75], [23.6, 45.8], [24.1, 45.8]], col: '#1c4fa0', t0: 6, t1: 11 }],
    intro: [
      'Primăvara anului 1442. Mezid Bei trece munții cu o oaste turcească și asediază Sibiul.',
      'Iancu de Hunedoara, voievodul Transilvaniei, vine în ajutor. Știe că turcii îl caută pe el: cine îl ucide pe Iancu, câștigă bătălia.',
      'De aceea, un cavaler credincios, Simion Kamonyai, îi îmbracă armura. Folosește clipa: cât timp turcii îl vânează pe Simion, lovește-le tabăra.'
    ],
    outro: [
      'Simion Kamonyai a căzut purtând armura stăpânului său. Dar oastea lui Mezid Bei a fost zdrobită, iar Mezid însuși a murit pe câmpul de luptă.',
      'A fost prima mare victorie a lui Iancu. Numele lui începe să se audă în toată creștinătatea.'
    ],
    players: [{ civ: 'ung', team: 1 }, { civ: 'oto', team: 2, heroName: 'Mezid Bei', aiMode: 'static', techs: ['up_mil2', 'up_arc2'] }, { civ: 'pol', team: 1, ppl: 'sibienii', aiMode: 'defend', col: 2 }],
    map: { N: 96, season: 'vara', seed: 1442, ground: 'grass', ops: [
      ['forest', [[0, 0], [30, 0], [24, 16], [0, 22]], 0.6], ['forest', [[0, 60], [16, 56], [24, 80], [10, 96], [0, 96]], 0.6], ['forest', [[96, 0], [70, 0], [76, 18], [96, 24]], 0.6],
      ['river', [[96, 40], [70, 46], [52, 60], [40, 96]], 2.4, { fords: [[60, 54]], bridges: [[45, 76]] }],
      ['road', [[14, 34], [30, 40], [46, 44], [60, 50]], 2], ['clear', 48, 40, 11], ['clear', 76, 78, 10], ['clear', 14, 34, 7],
      ['res', 'gold', 10, 44, 6], ['res', 'sheep', 22, 30, 6], ['res', 'berry', 6, 28, 5]
    ] },
    maxAge: 2, startAge: 2, popMax: 100, keepHero: 'Iancu de Hunedoara a căzut.',
    setup: function (S, T) {
      // Sibiul, cu ziduri, apărat de sibieni
      T.wall(2, 40, 32, 56, 32, [8]); T.wall(2, 56, 33, 56, 48, [8]); T.wall(2, 40, 48, 55, 48); T.wall(2, 40, 33, 40, 47, [7]);
      T.bld(2, 'cetate', 46, 38, true, 'sibiu'); T.bld(2, 'turn', 42, 34, true); T.bld(2, 'turn', 52, 44, true);
      T.spawn(2, [['arc', 6], ['spr', 6]], 48, 44);
      town(T, 0, 14, 34, 5); heroAt(T, 0, 18, 38);
      T.spawn(0, [['kni', 6], ['mil', 10], ['arc', 8]], 20, 40);
      named(T.spawn(0, [['kni', 1]], 22, 36, 'simion'), 'Simion Kamonyai');
      town(T, 1, 76, 78, 0, 'tabara'); T.bld(1, 'casa', 70, 72, true); T.bld(1, 'casa', 82, 84, true); T.bld(1, 'turn', 70, 84, true);
      T.spawn(1, [['mil', 14], ['arc', 8], ['lcv', 8], ['ien', 4]], 66, 56, 'asediu');
      heroAt(T, 1, 78, 72);
      S.players[0].res = { f: 600, w: 500, g: 400, s: 200 };
    },
    start: function (S, T) {
      T.obj('o1', 'Sibiul trebuie să reziste.');
      T.obj('o2', 'Simion Kamonyai poartă armura ta: turcii îl vor vâna pe el. Lovește tabăra lui Mezid Bei și dărâm-o.');
      T.say('iancu', 'Simion, îmbracă armura mea. Să creadă că Iancu e acolo unde ești tu.', 'say1', 1);
      T.say('narator', 'Simion Kamonyai: „Pentru tine, stăpâne, și pentru țară.”', 'say2');
    },
    tick: function (S, T) {
      var v = S.scen.vars, sim = T.get('simion');
      // turcii îl vânează pe cel cu armura lui Iancu
      if (S.t >= (v.hunt || 20)) {
        v.hunt = S.t + 6;
        var tgt = sim || T.get('sibiu');
        if (tgt) T.byTag('asediu').forEach(function (u) { if (!u.task || u.task.k === 'amove') G.cmdAttack([u], tgt); });
      }
      if (!sim && !v.simDead && S.t > 5) { v.simDead = 1; T.say('narator', 'Simion Kamonyai a căzut. Turcii strigă că l-au ucis pe Iancu!', 'say3'); T.debuff(0, 1, 1); T.buff(0, 1.25, 1.15, 60); T.say('iancu', 'Iancu trăiește! Pentru Simion, înainte!', 'say4'); }
      if (S.t >= 480 && !v.w2) { v.w2 = 1; T.wave(1, [['mil', 8], ['arc', 6], ['kni', 4]], [76, 70], [48, 40], 'asediu'); }
    },
    triggers: [
      { id: 'lost', when: function (S, T) { return !T.alive('sibiu'); }, do: function (S, T) { T.lose('Sibiul a căzut.'); } },
      { id: 'win', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) { T.done('o1'); T.done('o2'); T.say('iancu', 'Tabăra lui Mezid a căzut! Transilvania e liberă.', 'say5'); T.win(); } }
    ]
  };
  M.ia2 = {
    id: 'ia2', title: 'Iarna cea lungă', short: 'Zlatica', year: '1443', place: 'Trecătoarea Zlatica, în Balcani', lon: 24.0, lat: 42.75,
    view: { lon: 23.0, lat: 43.6, z: 1.9 },
    arrows: [{ pts: [[20.46, 44.82], [21.9, 43.32], [23.32, 42.7], [24.0, 42.75]], col: '#1c4fa0', t0: 1, t1: 10 }],
    intro: [
      'Toamna lui 1443. Iancu și regele Vladislav pornesc „campania cea lungă”, adânc în pământul otoman. Iau Nișul, iau Sofia.',
      'În decembrie, drumul spre Adrianopol trece prin trecătoarea Zlatica. Turcii au închis-o cu ziduri, turnuri și o fortăreață.',
      'E ger, e zăpadă. Sparge trecătoarea înainte să se termine proviziile.'
    ],
    outro: [
      'Oastea creștină a luptat în zăpadă pentru trecătoare. Drumul spre Adrianopol a rămas închis, dar turcii au fost atât de zguduiți încât sultanul a cerut pace.',
      'Pacea n-a ținut mult. Peste un an, la Varna, regele Vladislav avea să cadă. Iancu a scăpat și a continuat lupta.'
    ],
    players: [{ civ: 'ung', team: 1 }, { civ: 'oto', team: 2, aiMode: 'defend', res: { f: 2000, w: 1000, g: 1500, s: 500 }, techs: ['up_mil2', 'up_mil3', 'up_arc2', 'zale1', 'zale2', 'pene', 'turn2'] }],
    map: { N: 96, season: 'iarna', seed: 1443, ground: 'grass', ops: [
      ['rock', [[0, 30], [40, 34], [42, 46], [38, 60], [0, 64]]], ['rock', [[56, 32], [96, 28], [96, 66], [58, 62], [54, 48]]],
      ['road', [[48, 96], [48, 74], [47, 48], [48, 20], [46, 0]], 2], ['clear', 48, 14, 9], ['clear', 48, 84, 9],
      ['forest', [[0, 0], [36, 0], [30, 20], [0, 24]], 0.55], ['forest', [[96, 0], [62, 0], [68, 18], [96, 20]], 0.55],
      ['forest', [[0, 72], [30, 70], [26, 96], [0, 96]], 0.5], ['forest', [[96, 72], [66, 74], [70, 96], [96, 96]], 0.5],
      ['res', 'gold', 30, 10, 6], ['res', 'stone', 64, 8, 6], ['res', 'sheep', 40, 22, 6], ['res', 'berry', 58, 22, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 110, keepHero: 'Iancu a căzut în zăpadă.',
    setup: function (S, T) {
      town(T, 0, 48, 14, 8); heroAt(T, 0, 50, 18);
      T.spawn(0, [['kni', 8], ['mil', 10], ['arc', 8], ['ram', 2], ['cat', 2]], 48, 24);
      // zidul de la trecătoare, cu turnuri, și fortăreața din spatele lui
      T.wall(1, 41, 52, 55, 52, [7]); T.bld(1, 'turn', 43, 54, true); T.bld(1, 'turn', 51, 54, true);
      T.wall(1, 41, 64, 55, 64, [7]);
      T.bld(1, 'fortareata', 46, 72, true, 'fort'); T.bld(1, 'cazarma', 41, 78, true); T.bld(1, 'poligon', 52, 78, true);
      T.spawn(1, [['mil', 10], ['arc', 10], ['spr', 6], ['ien', 4]], 48, 58);
      S.players[0].res = { f: 800, w: 800, g: 500, s: 200 };
    },
    start: function (S, T) {
      T.obj('o1', 'Sparge trecătoarea: dărâmă fortăreața turcească din spatele zidurilor.');
      T.obj('o2', 'Iancu trebuie să trăiască.', { sec: 1, quiet: 1 });
      T.say('iancu', 'Zidurile sunt groase, dar berbecii noștri sunt și mai încăpățânați.', 'say1', 1);
    },
    triggers: [
      { id: 'cold', at: 420, do: function (S, T) { T.say('narator', 'Gerul se întețește. Fiecare zi în trecătoare costă oameni.', 'say2'); } },
      { id: 'attack', at: 600, do: function (S, T) { T.mode(1, 'eco'); T.aiGo(1); } },
      { id: 'win', when: function (S, T) { return !T.alive('fort'); }, do: function (S, T) { T.done('o1'); T.say('iancu', 'Trecătoarea e a noastră!', 'say3'); T.win(); } }
    ]
  };
  M.ia3 = {
    id: 'ia3', title: 'Clopotele de la amiază', short: 'Belgrad', year: '1456', place: 'Belgrad, la Dunăre', lon: 20.46, lat: 44.82,
    view: { lon: 21.4, lat: 44.2, z: 2.0 },
    arrows: [{ pts: [[26.56, 41.68], [24.5, 42.4], [22.6, 43.4], [21.2, 44.3], [20.6, 44.7]], col: '#a01818', t0: 1, t1: 10 }],
    intro: [
      'Iulie 1456. Mehmed al II-lea, cuceritorul Constantinopolului, asediază Belgradul cu tunuri uriașe. Dacă Belgradul cade, drumul spre Buda e deschis.',
      'Iancu de Hunedoara apără cetatea. Din Ungaria vine în ajutor călugărul Ioan de Capistrano, cu o oaste de țărani cruciați.',
      'Ține zidurile până vin ajutoarele. Apoi ieși și distruge marile bombarde ale sultanului.'
    ],
    outro: [
      'Pe 22 iulie 1456, apărătorii Belgradului au ieșit din cetate și au luat tabăra turcească. Sultanul, rănit, s-a retras.',
      'Papa Calixt al III-lea poruncise ca la amiază să bată clopotele în toate bisericile, ca să se roage pentru apărători. De atunci, clopotele de la amiază amintesc de victoria de la Belgrad. Câteva săptămâni mai târziu, Iancu a murit de ciumă.'
    ],
    players: [{ civ: 'ung', team: 1 }, { civ: 'oto', team: 2, heroName: 'Mehmed al II-lea', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'up_arc2', 'chimie', 'forja', 'zale1'] },
      { civ: 'ung', team: 1, ppl: 'cruciații', heroName: 'Ioan de Capistrano', aiMode: 'static', col: 2 }],
    map: { N: 96, season: 'vara', seed: 1456, ground: 'grass', ops: [
      ['river', [[-2, 20], [30, 22], [60, 18], [98, 22]], 9], ['river', [[18, -2], [20, 18]], 6],
      ['road', [[40, 40], [56, 60], [70, 80]], 2], ['clear', 40, 38, 13], ['clear', 70, 80, 11],
      ['forest', [[0, 60], [20, 56], [30, 80], [20, 96], [0, 96]], 0.55], ['forest', [[96, 40], [84, 46], [86, 70], [96, 72]], 0.5],
      ['res', 'gold', 26, 44, 6], ['res', 'stone', 52, 34, 6], ['res', 'sheep', 30, 50, 5]
    ] },
    startAge: 3, maxAge: 3, popMax: 120, keepHero: 'Iancu de Hunedoara a căzut.',
    setup: function (S, T) {
      T.wall(0, 30, 28, 52, 28, [11]); T.wall(0, 52, 29, 52, 50, [10]); T.wall(0, 30, 50, 51, 50, [10]); T.wall(0, 30, 29, 30, 49);
      T.bld(0, 'fortareata', 38, 34, true, 'belgrad'); T.bld(0, 'cetate', 43, 42, true);
      T.bld(0, 'turn', 32, 30, true); T.bld(0, 'turn', 49, 30, true); T.bld(0, 'turn', 32, 47, true); T.bld(0, 'turn', 49, 47, true);
      T.spawn(0, [['vil', 8]], 40, 46);
      heroAt(T, 0, 44, 38);
      T.spawn(0, [['mil', 10], ['arc', 10], ['spr', 6], ['kni', 4], ['gun', 4]], 42, 40);
      town(T, 1, 70, 80, 0, 'tabara'); T.bld(1, 'casa', 64, 76, true); T.bld(1, 'casa', 76, 86, true);
      heroAt(T, 1, 74, 76);
      T.spawn(1, [['can', 4]], 70, 72, 'bombarda');
      T.spawn(1, [['mil', 16], ['arc', 10], ['ien', 10], ['kni', 6]], 66, 70, 'asediu');
      S.players[0].res = { f: 1000, w: 800, g: 800, s: 400 };
    },
    start: function (S, T) {
      T.obj('o1', 'Belgradul trebuie să reziste până la amiază (12 minute).');
      T.obj('o2', 'Distruge marile bombarde ale sultanului (0/4).');
      T.say('iancu', 'Ziduri, tunuri și credință. Atât avem. Va fi de ajuns.', 'say1', 1);
    },
    timer: function (S) { return Math.max(0, 720 - S.t); },
    tick: function (S, T) {
      var v = S.scen.vars, f = T.get('belgrad');
      if (f && S.t >= (v.next || 90)) {
        v.next = S.t + 110;
        // bombardele bat întâi în ce e mai aproape: ziduri și turnuri
        T.byTag('bombarda').forEach(function (u) {
          if (u.task) return;
          var best = null, bd = 1e9;
          G.C.blds.forEach(function (b) { if (b.o === 0 && !b.dead) { var d = G.dist(b, u); if (d < bd) { bd = d; best = b; } } });
          if (best) G.cmdAttack([u], best);
        });
        var go = T.byTag('asediu').filter(function (u) { return !u.task; }).slice(0, 14);
        T.attackMove(go, 41, 39);
      }
      if (S.t < 600 && S.t >= (v.reinf || 150)) { v.reinf = S.t + 150; T.spawn(1, [['mil', 6], ['ien', 3]], 72, 84, 'asediu'); }
      var dead = 4 - T.alive('bombarda');
      if (dead !== v.dead) { v.dead = dead; T.obj('o2', 'Distruge marile bombarde ale sultanului (' + dead + '/4).'); if (dead >= 4) T.done('o2'); }
      if (S.t >= 720 && !v.noon) {
        v.noon = 1; T.done('o1'); G.sfx('bell');
        T.say('capistrano', 'E amiază! Bat clopotele în toată creștinătatea! Înainte, cruciați!', 'say2');
        var c = T.spawn(2, [['mil', 14], ['spr', 10], ['arc', 6]], 20, 70, 'cruciati'); T.attackMove(c, 70, 78);
        T.buff(0, 1.15, 1.1, 300);
      }
      if (T.isDone('o2') && v.noon && !v.won) { v.won = 1; T.say('iancu', 'Bombardele tac. Belgradul e salvat!', 'say3'); T.win(); }
    },
    triggers: [{ id: 'lost', when: function (S, T) { return !T.alive('belgrad'); }, do: function (S, T) { T.lose('Belgradul a căzut.'); } }]
  };

  // ===================== MEHMED CUCERITORUL =====================
  M.me1 = {
    id: 'me1', title: 'Zidurile lui Teodosie', short: 'Constantinopol', year: '1453', place: 'Constantinopol', lon: 28.98, lat: 41.01,
    view: { lon: 28.0, lat: 41.6, z: 2.4 },
    arrows: [{ pts: [[26.56, 41.68], [27.4, 41.4], [28.3, 41.1], [28.9, 41.02]], col: '#a01818', t0: 1, t1: 9 }],
    intro: [
      'Aprilie 1453. Tânărul sultan Mehmed al II-lea, de numai 21 de ani, vrea ce n-a reușit niciun sultan înaintea lui: Constantinopolul, capitala de o mie de ani a Bizanțului.',
      'Orașul e apărat de zidurile lui Teodosie, cele mai puternice din lume. Dar Mehmed are ceva nou: o bombardă uriașă, turnată de meșterul Orban.',
      'Sparge zidurile, cucerește palatul Vlaherne și învinge-l pe ultimul împărat.'
    ],
    outro: [
      'Pe 29 mai 1453, după 53 de zile de asediu, Constantinopolul cade. Ultimul împărat, Constantin al XI-lea, moare luptând pe ziduri.',
      'Mehmed intră în oraș și îl face capitala imperiului său. De acum înainte, lumea îl va numi Mehmed Cuceritorul.'
    ],
    players: [{ civ: 'oto', team: 1, heroName: 'Mehmed al II-lea' }, { civ: 'val', team: 2, ppl: 'bizantinii', heroName: 'Constantin al XI-lea', aiMode: 'defend', res: { f: 2000, w: 1500, g: 1500, s: 800 }, techs: ['up_mil2', 'up_mil3', 'up_arc2', 'up_arc3', 'zale1', 'zale2', 'pene', 'varf', 'zidarie', 'turn2'] }],
    map: { N: 96, season: 'vara', seed: 1453, ground: 'grass', ops: [
      ['river', [[70, -2], [74, 30], [80, 60], [86, 98]], 22], ['river', [[40, -2], [56, 8], [72, 12]], 6],
      ['forest', [[0, 0], [20, 0], [14, 20], [0, 26]], 0.5], ['forest', [[0, 70], [16, 74], [20, 96], [0, 96]], 0.5],
      ['clear', 16, 48, 10], ['road', [[16, 48], [36, 48], [56, 46]], 2],
      ['res', 'gold', 8, 36, 7], ['res', 'stone', 10, 60, 6], ['res', 'sheep', 24, 40, 6], ['res', 'berry', 6, 46, 5], ['res', 'gold', 26, 80, 6]
    ] },
    startAge: 3, maxAge: 3, popMax: 150, keepHero: 'Sultanul a căzut sub ziduri.',
    setup: function (S, T) {
      town(T, 0, 16, 48, 10); heroAt(T, 0, 20, 52);
      T.spawn(0, [['ien', 12], ['mil', 12], ['arc', 8], ['kni', 6]], 24, 48);
      var big = named(T.spawn(0, [['can2', 1]], 22, 44, 'orban'), 'Marea Bombardă');
      big.forEach(function (u) { u.buf = { a: 2.2, until: 1e9 }; });
      T.spawn(0, [['can', 3], ['treb', 2]], 20, 40);
      // zidurile: două șiruri, cu turnuri
      T.wall(1, 36, 12, 36, 86, [24, 50]); T.wall(1, 42, 12, 42, 86, [30]);
      [16, 30, 44, 58, 72].forEach(function (y) { T.bld(1, 'turn', 38, y, true); });
      T.bld(1, 'cetate', 52, 18, true, 'vlaherne'); T.bld(1, 'manastire', 56, 54, true); T.bld(1, 'cazarma', 50, 34, true); T.bld(1, 'poligon', 50, 68, true);
      T.spawn(1, [['mil', 14], ['arc', 12], ['spr', 6], ['gun', 4]], 47, 46);
      heroAt(T, 1, 54, 24);
      S.players[0].res = { f: 1500, w: 1200, g: 1200, s: 400 };
    },
    start: function (S, T) {
      T.obj('o1', 'Sparge zidurile lui Teodosie (bombardele și trebușetele bat zidurile).');
      T.obj('o2', 'Dărâmă palatul Vlaherne.');
      T.obj('o3', 'Învinge-l pe Constantin al XI-lea.');
      T.say('mehmed', 'Fie eu voi lua acest oraș, fie orașul mă va lua pe mine.', 'say1', 1);
      T.say('orban', 'Bombarda e gata, Măria Ta. Niciun zid nu-i stă în cale.', 'say2');
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (!v.breach && G.C.blds.filter(function (b) { return b.o === 1 && G.BLDS[b.t].wall; }).length < (v.w0 || (v.w0 = G.C.blds.filter(function (b) { return b.o === 1 && G.BLDS[b.t].wall; }).length)) - 6) {
        v.breach = 1; T.done('o1'); T.say('mehmed', 'Zidul s-a spart! Ieniceri, înainte!', 'say3');
      }
      if (!G.heroOf(1) && !T.isDone('o3') && S.t > 5) { T.done('o3'); T.say('narator', 'Ultimul împărat al Bizanțului a căzut luptând pe ziduri.', 'say4'); }
      if (T.isDone('o2') && T.isDone('o3') && !v.won) { v.won = 1; T.win(); }
    },
    triggers: [{ id: 'pal', when: function (S, T) { return !T.alive('vlaherne'); }, do: function (S, T) { T.done('o2'); } }]
  };
  M.me2 = {
    id: 'me2', title: 'Valea Albă', short: 'Valea Albă', year: '1476', place: 'Valea Albă, lângă Războieni', lon: 26.55, lat: 47.05,
    view: { lon: 27.0, lat: 45.6, z: 1.6 },
    arrows: [{ pts: [[26.56, 41.68], [27.4, 43.2], [27.96, 45.27], [27.3, 46.2], [26.55, 47.05]], col: '#a01818', t0: 1, t1: 10 }],
    intro: [
      'Vara lui 1476. După rușinea de la Vaslui, Mehmed vine el însuși în Moldova, cu oastea cea mare și cu ienicerii lui.',
      'Ștefan s-a întărit într-o pădure, lângă Războieni, la Valea Albă: șanțuri, garduri de pari, tunuri.',
      'Sparge întăriturile și dărâmă tabăra moldovenilor.'
    ],
    outro: [
      'Pe 26 iulie 1476, la Valea Albă, ienicerii au spart tabăra moldovenească. Ștefan a scăpat cu greu.',
      'Dar victoria nu i-a adus sultanului Moldova: cetățile Sucevei și Neamțului au rezistat, iar foametea și ciuma l-au alungat peste Dunăre.'
    ],
    players: [{ civ: 'oto', team: 1, heroName: 'Mehmed al II-lea' }, { civ: 'mol', team: 2, heroName: 'Ștefan cel Mare', aiMode: 'defend', res: { f: 1500, w: 1200, g: 800, s: 400 }, techs: ['up_mil2', 'up_arc2', 'zale1', 'pene'] }],
    map: { N: 96, season: 'vara', seed: 1476, ground: 'grass', ops: [
      ['forest', [[40, 0], [96, 0], [96, 50], [70, 54], [50, 40], [44, 20]], 0.5], ['clear', 72, 24, 13],
      ['forest', [[0, 60], [24, 56], [30, 96], [0, 96]], 0.55],
      ['river', [[-2, 50], [30, 56], [56, 70], [98, 72]], 2, { fords: [[20, 54], [70, 71]], bridges: [[42, 63]] }],
      ['clear', 20, 82, 9], ['road', [[20, 82], [40, 66], [60, 40], [70, 28]], 2],
      ['res', 'gold', 10, 76, 6], ['res', 'stone', 30, 90, 6], ['res', 'sheep', 26, 74, 6], ['res', 'berry', 8, 88, 5]
    ] },
    startAge: 2, maxAge: 3, popMax: 130, keepHero: 'Sultanul a căzut.',
    setup: function (S, T) {
      town(T, 0, 20, 82, 10); heroAt(T, 0, 24, 78);
      T.spawn(0, [['ien', 10], ['mil', 10], ['arc', 8], ['kni', 6], ['can', 2]], 26, 76);
      T.wall(1, 60, 12, 84, 12, [], 'pal'); T.wall(1, 84, 13, 84, 36, [], 'pal'); T.wall(1, 60, 36, 83, 36, [11], 'pal'); T.wall(1, 60, 13, 60, 35, [11], 'pal');
      T.bld(1, 'cetate', 70, 22, true, 'tabara'); T.bld(1, 'turn', 63, 33, true); T.bld(1, 'turn', 80, 33, true); T.bld(1, 'cazarma', 76, 16, true); T.bld(1, 'poligon', 63, 15, true);
      T.spawn(1, [['vil', 6]], 74, 18);
      T.spawn(1, [['raz', 10], ['arc', 10], ['spr', 6], ['lcv', 6]], 70, 30);
      heroAt(T, 1, 72, 28);
      S.players[0].res = { f: 1000, w: 800, g: 800, s: 300 };
    },
    start: function (S, T) {
      T.obj('o1', 'Dărâmă tabăra întărită a moldovenilor.');
      T.say('mehmed', 'Ștefan s-a ascuns în pădure. Să-l scoatem de acolo.', 'say1', 1);
      T.say('ienicer', 'Măria Ta, gardurile lor de pari nu țin la tunurile noastre.', 'say2');
    },
    triggers: [
      { id: 'raid', at: 420, do: function (S, T) { T.mode(1, 'eco'); T.aiGo(1); T.say('iscoada', 'Moldovenii ies din pădure și ne atacă!', 'say3'); } },
      { id: 'win', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) {
        var h = G.heroOf(1); if (h) { T.moveTo([h], 95, 2); T.say('narator', 'Ștefan scapă cu câțiva oameni, spre cetățile din nord.', 'say4'); }
        T.done('o1'); T.win();
      } }
    ]
  };

  // ===================== POLONIA: GRUNWALD =====================
  M.pl1 = {
    id: 'pl1', title: 'Grunwald', short: 'Grunwald', year: '1410', place: 'Grunwald', lon: 20.1, lat: 53.48,
    view: { lon: 21.0, lat: 51.6, z: 1.4 },
    arrows: [{ pts: [[19.94, 50.06], [20.0, 51.5], [20.1, 53.2]], col: '#1c4fa0', t0: 1, t1: 8 }],
    intro: [
      '15 iulie 1410. Regele Poloniei, Vladislav Jagiello, și vărul său, marele duce Vitold al Lituaniei, înfruntă Ordinul Cavalerilor Teutoni.',
      'Cavalerii în armură albă au stăpânit decenii la rând țărmurile Mării Baltice. Acum, pe câmpul de la Grunwald, se hotărăște cine va stăpâni nordul.',
      'Lituanienii lui Vitold vor lovi primii. Fii pregătit pentru orice: în stepă, călăreții învață să fugă ca să se întoarcă.'
    ],
    outro: [
      'La Grunwald, Ordinul Teuton a suferit cea mai grea înfrângere din istoria lui. Marele maestru Ulrich von Jungingen a căzut pe câmpul de luptă.',
      'Polonia și Lituania devin cea mai mare putere din estul Europei. Peste ani, aceeași Polonie va trece prin Codrii Cosminului.'
    ],
    players: [{ civ: 'pol', team: 1, heroName: 'Vladislav Jagiello' }, { civ: 'ung', team: 2, ppl: 'cavalerii teutoni', heroName: 'Ulrich von Jungingen', aiMode: 'static', techs: ['up_mil2', 'up_mil3', 'up_kni2', 'forja', 'sab1', 'zale1'] },
      { civ: 'tat', team: 1, ppl: 'lituanienii', heroName: 'Vitold', aiMode: 'static', col: 2 }],
    map: { N: 96, season: 'vara', seed: 1410, ground: 'grass', ops: [
      ['forest', [[0, 0], [30, 0], [20, 20], [0, 24]], 0.6], ['forest', [[66, 0], [96, 0], [96, 20], [74, 18]], 0.55],
      ['forest', [[0, 74], [26, 72], [30, 96], [0, 96]], 0.55], ['forestc', 82, 72, 8, 0.55], ['lake', 30, 48, 4, 7],
      ['clear', 48, 80, 10], ['clear', 48, 14, 10]
    ] },
    startAge: 2, maxAge: 2, popMax: 140, keepHero: 'Regele a căzut.',
    setup: function (S, T) {
      town(T, 0, 48, 82, 6, 'tabara0'); heroAt(T, 0, 48, 74);
      T.spawn(0, [['cpl', 10], ['kni', 6], ['mil', 12], ['arc', 10], ['spr', 6]], 50, 70);
      T.spawn(2, [['lcv', 10], ['nog', 8], ['har', 4]], 66, 68, 'lit'); heroAt(T, 2, 68, 72);
      T.bld(1, 'cetate', 46, 12, true, 'tabara'); T.bld(1, 'casa', 40, 10, true); T.bld(1, 'casa', 56, 10, true);
      T.spawn(1, [['kni', 14], ['mil', 14], ['arc', 8], ['spr', 6], ['gun', 4]], 48, 26, 'teutoni');
      heroAt(T, 1, 48, 20);
      S.players[0].res = { f: 800, w: 600, g: 600, s: 200 };
    },
    start: function (S, T) {
      T.obj('o1', 'Învinge-l pe marele maestru Ulrich von Jungingen.');
      T.obj('o2', 'Dărâmă tabăra Ordinului.');
      T.say('jagiello', 'Ei au săbii trimise de mândrie. Noi avem dreptatea. Să înceapă!', 'say1', 1);
      T.say('vitold', 'Lituanienii mei lovesc primii, vere. Ai încredere în noi orice s-ar întâmpla.', 'say2');
    },
    tick: function (S, T) {
      var v = S.scen.vars;
      if (S.t >= 60 && !v.a1) { v.a1 = 1; T.attackMove(T.byTag('lit'), 48, 26); T.attackMove(T.byTag('teutoni').slice(0, 20), 48, 60); }
      if (S.t >= 150 && !v.flee) { v.flee = 1; T.say('narator', 'Lituanienii se retrag! Cavalerii teutoni cred că au câștigat și îi urmăresc.', 'say3'); T.moveTo(T.byTag('lit'), 90, 88); var h = G.heroOf(2); if (h) T.moveTo([h], 90, 90); }
      if (S.t >= 330 && !v.back) { v.back = 1; T.say('vitold', 'Acum ne întoarcem! Loviți-i din spate!', 'say4'); T.attackMove(T.byTag('lit'), 48, 30); T.attackMove(T.byTag('teutoni'), 48, 72); }
      if (S.t >= 200 && !v.all) { v.all = 1; T.attackMove(T.byTag('teutoni'), 48, 72); }
      if (!G.heroOf(1) && !T.isDone('o1') && S.t > 5) { T.done('o1'); T.say('jagiello', 'Marele maestru a căzut! Ordinul e înfrânt!', 'say5'); }
      if (T.isDone('o1') && T.isDone('o2') && !v.won) { v.won = 1; T.win(); }
    },
    triggers: [{ id: 'tab', when: function (S, T) { return !T.alive('tabara'); }, do: function (S, T) { T.done('o2'); } }]
  };

  // ===================== TĂTARII: KIEV =====================
  M.ta1 = {
    id: 'ta1', title: 'Prada hanului', short: 'Kiev', year: '1482', place: 'Kiev, pe Nipru', lon: 30.52, lat: 50.45,
    view: { lon: 32.2, lat: 47.9, z: 1.3 },
    arrows: [{ pts: [[33.86, 44.75], [33.8, 46.2], [33.2, 47.6], [32.0, 48.9], [30.9, 50.0], [30.52, 50.45]], col: '#a01818', t0: 1, t1: 10 }],
    intro: [
      'Toamna lui 1482. Hanul Crimeii, Mengli Giray, e aliatul marelui cneaz al Moscovei. Împreună au un dușman: regele Poloniei și Lituaniei.',
      'Cu hoarda lui de călăreți, hanul urcă pe malul Niprului până la Kiev, cetatea lituanienilor.',
      'Prădă satele din jur, strânge aur, apoi dărâmă cetatea Kievului.'
    ],
    outro: [
      'Pe 1 septembrie 1482, Kievul a ars. Hanul s-a întors în Crimeea încărcat de pradă, iar o parte din ea a trimis-o aliatului său de la Moscova.',
      'Peste douăzeci de ani, același han avea să distrugă Sarai, capitala Hoardei de Aur. Stepa avea un nou stăpân.'
    ],
    players: [{ civ: 'tat', team: 1 }, { civ: 'pol', team: 2, ppl: 'lituanienii', aiMode: 'defend', res: { f: 1200, w: 1200, g: 800, s: 500 }, techs: ['up_mil2', 'up_arc2', 'pene', 'zale1'] }],
    map: { N: 96, season: 'vara', seed: 1482, ground: 'grass', ops: [
      ['river', [[60, -2], [64, 30], [70, 60], [74, 98]], 6, { fords: [[66, 44]] }],
      ['forest', [[0, 0], [40, 0], [34, 14], [0, 18]], 0.5], ['forestc', 30, 54, 6, 0.5], ['forestc', 20, 30, 5, 0.5],
      ['clear', 50, 30, 11], ['clear', 16, 84, 9],
      ['res', 'sheep', 24, 76, 8], ['res', 'gold', 8, 72, 6], ['res', 'berry', 26, 90, 5]
    ] },
    startAge: 2, maxAge: 2, popMax: 120, keepHero: 'Hanul a căzut.',
    setup: function (S, T) {
      town(T, 0, 16, 84, 6); heroAt(T, 0, 20, 80);
      T.spawn(0, [['nog', 14], ['lcv', 10], ['har', 8], ['kni', 4]], 22, 78);
      T.wall(1, 42, 22, 58, 22, [8]); T.wall(1, 58, 23, 58, 38); T.wall(1, 42, 38, 57, 38, [7]); T.wall(1, 42, 23, 42, 37, [7]);
      T.bld(1, 'fortareata', 48, 28, true, 'kiev'); T.bld(1, 'turn', 44, 24, true); T.bld(1, 'turn', 54, 34, true);
      T.spawn(1, [['arc', 8], ['mil', 10], ['spr', 6]], 50, 34);
      var vill = [[24, 50], [30, 40], [36, 64], [52, 56], [44, 70], [16, 40], [56, 66], [34, 48]];
      vill.forEach(function (p, i) { T.bld(1, 'casa', p[0], p[1], true, 'sat'); if (i % 2 === 0) T.bld(1, 'moara', p[0] + 3, p[1] + 1, true, 'sat'); });
      T.spawn(1, [['vil', 8]], 34, 54);
      S.players[0].res = { f: 600, w: 300, g: 100, s: 0 };
      S.players[0].techs.jaful = 1;
    },
    start: function (S, T) {
      T.obj('o1', 'Prădă satele din jurul Kievului: strânge 1.500 de aur (0).');
      T.obj('o2', 'Dărâmă cetatea Kievului.');
      T.say('mengli', 'Nimeni nu întrece călăreții stepei. Prădați, apoi loviți cetatea!', 'say1', 1);
    },
    tick: function (S, T) {
      var v = S.scen.vars, P = S.players[0];
      v.g0 = v.g0 === undefined ? P.st.gath.g + P.res.g : v.g0;
      // fiecare clădire prădată aduce aur
      var sat = T.alive('sat');
      if (v.sat !== undefined && sat < v.sat) { P.res.g += (v.sat - sat) * 150; v.loot = (v.loot || 0) + (v.sat - sat) * 150; G.msg('Pradă: +' + (v.sat - sat) * 150 + ' aur', 'good'); }
      v.sat = sat;
      var have = Math.floor((v.loot || 0) + Math.max(0, P.st.gath.g - (v.gg0 === undefined ? (v.gg0 = P.st.gath.g) : v.gg0)));
      if (have !== v.have) { v.have = have; T.obj('o1', 'Prădă satele din jurul Kievului: strânge 1.500 de aur (' + Math.min(1500, have) + ').'); if (have >= 1500) T.done('o1'); }
      if (T.isDone('o2') && !v.won) { v.won = 1; T.win(); }
    },
    triggers: [{ id: 'kiev', when: function (S, T) { return !T.alive('kiev'); }, do: function (S, T) { T.done('o2'); T.say('mengli', 'Kievul arde! Înapoi în stepă, cu prada!', 'say2'); } }]
  };

  G.CAMPAIGNS.push(
    { id: 'vlad', name: 'Vlad Țepeș', civ: 'val', sub: 'Dracula, domnul Țării Românești', view: { lon: 25.4, lat: 45.0, z: 2.2 }, scen: ['vl1', 'vl2', 'vl3'] },
    { id: 'iancu', name: 'Iancu de Hunedoara', civ: 'ung', sub: 'Cavalerul alb al creștinătății', view: { lon: 22.5, lat: 44.2, z: 1.4 }, scen: ['ia1', 'ia2', 'ia3'] },
    { id: 'mehmed', name: 'Mehmed Cuceritorul', civ: 'oto', sub: 'Sultanul care a luat Constantinopolul', view: { lon: 27.6, lat: 43.6, z: 1.3 }, scen: ['me1', 'me2'] },
    { id: 'jagiello', name: 'Vladislav Jagiello', civ: 'pol', sub: 'Regele Poloniei și bătălia de la Grunwald', view: { lon: 21.5, lat: 51.4, z: 1.3 }, scen: ['pl1'] },
    { id: 'mengli', name: 'Mengli Giray', civ: 'tat', sub: 'Hanul Crimeii și stăpânul stepei', view: { lon: 32.0, lat: 47.8, z: 1.3 }, scen: ['ta1'] }
  );
})();
