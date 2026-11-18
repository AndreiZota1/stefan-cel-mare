// Calculatorul contra calculatorului, pe perechi de civilizații. node test/civ-matrix.js [minute] [perechi...] ex: mol-oto ung-tat
// Raportează epoca atinsă, oastea, cine a câștigat și orice eroare.
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G;
const mins = +process.argv[2] || 35;
let pairs = process.argv.slice(3);
if (!pairs.length) { const L = G.CIV_LIST; pairs = L.map((c, i) => c + '-' + L[(i + 1) % L.length]); }
const opt = JSON.parse(process.env.OPT || '{}');
let fails = 0;
for (const pr of pairs) {
  const civs = pr.split('-');
  const seed = +(process.env.SEED || 777) + pairs.indexOf(pr) * 13;
  const t0 = Date.now();
  try {
    G.newGame(Object.assign({ seed, diff: 'normal', players: civs.map((c, i) => ({ civ: c, ai: true, team: opt.teams ? opt.teams[i] : i + 1 })) }, opt));
    const dt = 1 / 20; let steps = 0;
    while (G.S.t < mins * 60 && !G.S.over) { G.update(dt); if (++steps % 600 === 0) G.msgQ.length = 0; }
    const S = G.S, line = S.players.map(P => {
      const u = G.C.units.filter(x => x.o === P.id), mil = u.filter(x => G.isMil(x)).length;
      return `${P.civ}${P.alive ? '' : '✝'} ep${P.age} vil${u.filter(x => x.t === 'vil').length} oaste${mil} teh${P.st.techs} ucis${P.st.killed}`;
    }).join(' | ');
    console.log(`${pr.padEnd(15)} ${(S.t / 60).toFixed(0)}min ${S.over ? (S.over === 1 ? 'câștigă echipa lui P0' : 'pierde P0') : 'nedecis'} | ${line} | ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } catch (e) { fails++; console.log(pr, 'EROARE', e.stack.split('\n').slice(0, 4).join(' / ')); }
}
process.exit(fails ? 1 : 0);
