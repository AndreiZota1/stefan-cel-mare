// Caută oameni blocați: au o sarcină, dar nu se mișcă și nu muncesc 30 de secunde la rând.
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f });
const G = globalThis.G;
const seeds = process.argv.slice(2).map(Number).filter(Boolean);
for (const seed of (seeds.length ? seeds : [11, 222, 3333])) {
  G.newGame({ diff: 'normal', seed, aiBoth: true });
  const hist = new Map(), stuck = new Map();
  let errs = 0;
  for (let i = 0; i < 28 * 60 * 20; i++) {
    try { G.update(0.05); } catch (e) { if (errs++ < 3) console.log('EXCEPȚIE', e.stack.split('\n').slice(0, 3).join(' | ')); }
    if (i % 200 === 0) {
      for (const u of G.C.units) {
        if (!u.task || u.wk > 0) { hist.delete(u.id); continue; }
        const sig = u.x.toFixed(2) + ',' + u.y.toFixed(2) + ',' + (u.carry ? u.carry.n.toFixed(1) : '') + ',' + (u.wk > 0 ? 'w' : '');
        const h = hist.get(u.id);
        if (h && h.sig === sig && h.task === u.task.k) { h.n++; if (h.n >= 3) stuck.set(u.id, { t: u.t, o: u.o, task: JSON.stringify(u.task).slice(0, 110), x: u.x.toFixed(1), y: u.y.toFixed(1), path: !!u.path, min: (G.S.t / 60).toFixed(1) }); }
        else hist.set(u.id, { sig, task: u.task.k, n: 0 });
      }
    }
    if (G.S.over) break;
  }
  const P = G.S.players;
  console.log(`seed ${seed}: min ${(G.S.t / 60).toFixed(1)}, blocați ${stuck.size}, excepții ${errs}, sat P0 ${G.C.units.filter(u => u.o === 0 && u.t === 'vil').length} P1 ${G.C.units.filter(u => u.o === 1 && u.t === 'vil').length}, oaste P0 ${G.C.units.filter(u => u.o === 0 && u.t !== 'vil').length} P1 ${G.C.units.filter(u => u.o === 1 && u.t !== 'vil').length}, epoci ${P[0].age}/${P[1].age}, câștig ${G.S.over || '-'}`);
  [...stuck.values()].slice(0, 6).forEach(s => console.log('   ', JSON.stringify(s)));
}
