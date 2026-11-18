// Construiește fiecare clădire, face fiecare unitate și cercetează fiecare tehnologie, ca jucător.
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f });
const G = globalThis.G;
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'OK   ' : 'GREȘ ') + n + (x !== undefined ? ' — ' + x : '')); };
G.newGame({ diff: 'usor', seed: 777 });
const S = G.S, P = S.players[0];
S.exp.fill(1);
P.res = { f: 99999, w: 99999, g: 99999, s: 99999 };
S.players[1].ai = false; // fără atacuri, testăm doar conținutul
const run = sec => { for (let i = 0; i < sec * 20; i++) G.update(0.05); };
const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate');
const vils0 = () => G.C.units.filter(u => u.o === 0 && u.t === 'vil');
for (let h = 0; h < 10; h++) {
  for (let r = 7; r < 26; r++) { let done = false; for (let a = 0; a < 6.28 && !done; a += 0.25) { const tx = Math.round(tc.x + Math.cos(a) * r - 1), ty = Math.round(tc.y + Math.sin(a) * r - 1); let ok2 = G.canPlace(0, 'casa', tx, ty); if (ok2) for (let y = ty - 1; y <= ty + 2 && ok2; y++) for (let x = tx - 1; x <= tx + 2; x++) { const id = G.C.occ[y * S.N + x]; if (id && G.getE(id) && G.getE(id).k === 'b') ok2 = false; } if (ok2) { G.cmdPlace(0, 'casa', tx, ty, vils0()); done = true; } } if (done) break; }
}
run(90);
for (let i = 0; i < 5; i++) G.cmdTrain(tc, 'vil');
run(70);
const vils = () => G.C.units.filter(u => u.o === 0 && u.t === 'vil');
ok('țărani făcuți', vils().length >= 8, vils().length);
function free(tx, ty, n) {
  const N = S.N;
  for (let y = ty - 1; y <= ty + n; y++) for (let x = tx - 1; x <= tx + n; x++) {
    if (x < 0 || y < 0 || x >= N || y >= N) return false;
    const id = G.C.occ[y * N + x]; if (id && G.getE(id) && G.getE(id).k === 'b') return false;
  }
  return true;
}
function place(t) {
  for (let r = 5; r < 26; r++) for (let a = 0; a < 6.28; a += 0.2) {
    const n = G.BLDS[t].n, tx = Math.round(tc.x + Math.cos(a) * r - n / 2), ty = Math.round(tc.y + Math.sin(a) * r - n / 2);
    if (G.canPlace(0, t, tx, ty) && free(tx, ty, n)) return G.cmdPlace(0, t, tx, ty, vils().slice(0, 6));
  }
  return null;
}
// epocile
G.cmdTech(tc, 'feudal'); run(50); ok('Epoca Feudală', P.age === 1);
G.cmdTech(tc, 'castle'); run(65); ok('Epoca Castelelor', P.age === 2);
for (const t of G.BUILD_LIST) {
  const b = place(t);
  if (!b) { ok('pus ' + t, false); continue; }
  run(Math.ceil(G.BLDS[t].time / 4) + 25);
  ok('construit ' + t, b.built && !b.dead, (b.prog * 100 | 0) + '%');
}
ok('populație maximă crescută', P.cap >= 50, P.cap);
// fiecare unitate
const byType = t => G.C.blds.find(b => b.o === 0 && b.t === t && b.built);
const before = {};
G.C.units.filter(u => u.o === 0).forEach(u => before[u.t] = (before[u.t] || 0) + 1);
['cazarma', 'poligon', 'grajd'].forEach(bt => G.trainList(byType(bt)).forEach(t => { const e = G.cmdTrain(byType(bt), t); if (e) console.log('   ', t, e); }));
run(150);
['mil', 'spr', 'arc', 'lcv', 'kni', 'ram'].forEach(t => ok('unitate ' + t, G.C.units.some(u => u.o === 0 && u.t === t)));
// eroul: moare și se readuce
const hero = G.C.units.find(u => u.o === 0 && u.t === 'hero');
G.kill(hero, null); run(1);
ok('eroul se poate readuce', !G.trainError(tc, 'hero'), G.trainError(tc, 'hero'));
G.cmdTrain(tc, 'hero'); run(40);
ok('Ștefan s-a întors', G.C.units.some(u => u.o === 0 && u.t === 'hero'));
// tehnologiile
const techAt = { roaba: 'cetate', topor: 'joagar', tarnacop: 'mina', jug: 'moara', sabii: 'fierarie', sageti: 'fierarie', zale: 'fierarie' };
Object.keys(techAt).forEach(id => { const b = byType(techAt[id]); const e = G.cmdTech(b, id); if (e) console.log('   ', id, e); });
run(100);
Object.keys(techAt).forEach(id => ok('tehnologie ' + id, !!P.techs[id]));
ok('zalele dau armură', G.ust({ o: 0, t: 'mil' }).ma === 2, G.ust({ o: 0, t: 'mil' }).ma);
// turnul și cetatea trag
const turn = byType('turn');
const enemy = G.addUnit('mil', 1, turn.x + 3, turn.y + 3);
run(20);
ok('turnul a lovit dușmanul', enemy.dead || enemy.hp < 45, Math.max(0, enemy.hp | 0) + ' hp');
// mănăstirea vindecă
const hurt = G.C.units.find(u => u.o === 0 && u.t === 'mil');
const m = byType('manastire'); hurt.x = m.x + 2; hurt.y = m.y + 2; hurt.hp = 10; G.setTask(hurt, null);
run(8);
ok('mănăstirea vindecă', hurt.hp > 12, hurt.hp | 0);
// ogorul dă hrană
const farm = byType('ogor'), f0 = P.st.gath.f;
G.cmdGather(vils().slice(0, 1), farm); run(60);
ok('ogorul dă hrană', P.st.gath.f > f0, (P.st.gath.f - f0 | 0) + ' hrană');
// berbecul dărâmă
const ram = G.C.units.find(u => u.o === 0 && u.t === 'ram'), etc = G.C.blds.find(b => b.o === 1 && b.t === 'cetate');
G.cmdAttack([ram], etc); run(200);
ok('berbecul lovește cetatea otomană', etc.hp < 2400, etc.hp | 0);
console.log(fails ? fails + ' probleme' : 'tot conținutul merge');
