// Partea comună a testului de determinism (test/determinism.js): rulează în Node (V8, motorul din Chrome)
// și în JavaScriptCore (motorul din Safari și de pe iPhone). Scrie amprenta stării în fiecare secundă de joc.
// Primește: ROOT (folderul jocului), LOADF(cale), OUT(text), MIN (minute de joc).
(function () {
  var files = ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte', 'camp-domni', 'camp-noi'];
  files.forEach(function (f) { LOADF(ROOT + '/js/' + f + '.js'); });
  var G = globalThis.G, T = G.Trig;
  function run(name, start, mins, saveAt) {
    start();
    var steps = mins * 60 * 20;
    for (var i = 1; i <= steps && !G.S.over; i++) {
      G.update(0.05);
      if (G.msgQ) G.msgQ.length = 0;
      // la jumătate: salvare și reîncărcare (ca la „Continuă”); jocul trebuie să meargă mai departe identic
      if (saveAt && i === saveAt) G.deserialize(G.serialize());
      if (i % 20 === 0) OUT(name + ' ' + (i / 20) + ' ' + G.stateHash());
    }
    OUT(name + ' final ' + G.stateHash() + ' t=' + Math.round(G.S.t) + ' over=' + G.S.over + ' ents=' + G.S.ents.filter(function (e) { return !e.dead; }).length);
  }
  var L = G.CIV_LIST;
  // 1) patru calculatoare, fiecare cu AI-ul lui, pe hărți diferite
  [['rau', 101], ['stepa', 202], ['munti', 303]].forEach(function (m) {
    run('ai4-' + m[0], function () {
      G.newGame({ seed: m[1], diff: 'normal', map: { type: m[0], season: m[1] === 303 ? 'iarna' : 'vara' },
        players: [0, 1, 2, 3].map(function (k) { return { civ: L[(k + m[1]) % L.length], ai: true, team: k + 1 }; }) });
    }, MIN);
  });
  // 2) aceeași partidă, cu salvare și reîncărcare la jumătate
  run('ai4-rau-salvat', function () {
    G.newGame({ seed: 101, diff: 'normal', map: { type: 'rau', season: 'vara' },
      players: [0, 1, 2, 3].map(function (k) { return { civ: L[(k + 101) % L.length], ai: true, team: k + 1 }; }) });
  }, MIN, MIN * 60 * 10);
  // 3) misiuni din campanie (scripturile lor, valurile de dușmani, ceața, noaptea)
  ['st4', 'vl3', 'mh3'].forEach(function (id) {
    run('misiune-' + id, function () { G.newGame(T.options(id, 'normal')); T.begin(id); }, Math.min(MIN, 6));
  });
})();
