// Fiecare misiune trebuie să se poată câștiga: îndeplinim obiectivele pe scurtătură și verificăm victoria.
const fs = require('fs'), vm = require('vm'), path = require('path');
global.localStorage = { getItem: () => null, setItem: () => {} };
for (const f of ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G, T = G.Trig;
G.startGame = o => G.newGame(o);
const kill = tag => T.byTag(tag).forEach(e => G.kill(e, { o: 0 }));
const killHero = o => { const h = G.heroOf(o); if (h) G.kill(h, { o: 0 }); };
const step = s => { for (let i = 0; i < s * 20 && !G.S.over; i++) G.update(0.05); };
const CHEAT = {
  st1: () => kill('tabara'),
  st2: () => kill('chilia'),
  st3: () => { kill('casa_baia'); step(1); const h = G.heroOf(1); h.hp = h.mhp * 0.3; },
  st4: () => kill('tabara'),
  st5: () => { T.spawn(0, [['raz', 26]], 40, 20); G.S.t = 905; step(2); kill('tabara'); },
  st6: () => { G.S.t = 241; step(2); kill('pol'); },
  vl1: () => { kill('curtea'); killHero(1); },
  vl2: () => { T.bld(0, 'fortareata', 50, 28, true); T.bld(0, 'turn', 46, 34, true); T.bld(0, 'turn', 56, 34, true); },
  vl3: () => { kill('cort'); step(1); const h = G.heroOf(0); h.x = 48; h.y = 8; },
  ia1: () => kill('tabara'),
  ia2: () => kill('fort'),
  ia3: () => { G.S.t = 721; step(1); kill('bombarda'); },
  me1: () => { kill('vlaherne'); killHero(1); },
  me2: () => kill('tabara'),
  pl1: () => { killHero(1); kill('tabara'); },
  ta1: () => { kill('sat'); step(2); kill('kiev'); }
};
let bad = 0;
for (const id of Object.keys(CHEAT)) {
  try {
    G.newGame(T.options(id, 'normal')); T.begin(id);
    step(5); CHEAT[id](); step(6);
    const ok = G.S.over === 1;
    if (!ok) bad++;
    console.log(id.padEnd(4), ok ? 'VICTORIE' : 'NU (' + (G.S.over === 2 ? 'înfrângere: ' + G.S.scen.why : 'încă în joc') + ')', G.S.scen.obj.map(o => (o.st === 1 ? '✓' : o.st === 2 ? '✗' : '·')).join(''));
  } catch (e) { bad++; console.log(id, 'EROARE', e.stack.split('\n').slice(0, 3).join(' / ')); }
}
process.exit(bad ? 1 : 0);
