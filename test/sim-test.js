// Test fără ecran: calculatorul joacă contra calculatorului și raportăm fiecare minut.
// node test/sim-test.js [dificultate] [seed] [minute]
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
}
const G = globalThis.G;
const diff = process.argv[2] || 'normal', seed = +process.argv[3] || 12345, mins = +process.argv[4] || 25;
const quiet = process.env.QUIET;
let t0 = Date.now();
G.newGame({ diff, seed, aiBoth: true });
console.log('harta generată în', Date.now() - t0, 'ms; entități:', G.S.ents.length,
  'copaci:', G.S.ents.filter(e => e.t === 'tree').length);
const dt = 1 / 30;
let lastMsg = 0;
t0 = Date.now();
function report() {
  const S = G.S, out = [];
  for (const P of S.players) {
    const u = G.C.units.filter(x => x.o === P.id), b = G.C.blds.filter(x => x.o === P.id);
    const vil = u.filter(x => x.t === 'vil').length;
    const army = {}; u.filter(x => x.t !== 'vil').forEach(x => army[x.t] = (army[x.t] || 0) + 1);
    const bl = {}; b.forEach(x => bl[x.t] = (bl[x.t] || 0) + (x.built ? 1 : 0));
    const idle = u.filter(x => x.t === 'vil' && !x.task).length;
    out.push(`  P${P.id} ${P.civ} ep${P.age} pop ${P.pop}/${P.cap} vil ${vil} (lib ${idle}) ` +
      `res f${P.res.f | 0} w${P.res.w | 0} g${P.res.g | 0} s${P.res.s | 0} | oaste ${JSON.stringify(army)} | clădiri ${JSON.stringify(bl)} | ucis ${P.st.killed} pierdut ${P.st.lost} val ${(S.ai[P.id] || {}).wave || 0}`);
  }
  console.log(`min ${(G.S.t / 60).toFixed(1)}`); out.forEach(l => console.log(l));
}
let steps = 0;
for (let i = 0; i < mins * 60 * 30; i++) {
  G.update(dt); steps++;
  if (i % (60 * 30) === 0) report();
  if (!quiet) while (lastMsg < G.msgQ.length) { const m = G.msgQ[lastMsg++]; if (m.kind !== 'info') console.log('    [' + (G.S.t / 60).toFixed(1) + '] ' + m.text); }
  if (G.msgQ.length > 35) { G.msgQ.length = 0; lastMsg = 0; }
  if (G.S.over) { console.log('GATA: câștigă', G.S.over === 1 ? 'Moldova' : 'Otomanii', 'la minutul', (G.S.t / 60).toFixed(1)); break; }
}
report();
const ms = Date.now() - t0;
console.log(`timp: ${ms} ms pentru ${steps} pași (${(ms / steps).toFixed(3)} ms/pas)`);
// salvare și încărcare
const str = G.serialize();
G.deserialize(str);
G.update(dt);
console.log('salvare: ' + (str.length / 1024).toFixed(0) + ' KB, reîncărcat ok');
