// Fiecare loc la care o misiune te trimite (steag, vad, loc de cetate): se poate ajunge la el, cu regula drumurilor din joc
// (nu te strecori pe diagonală printre doi copaci)? O pădure deasă a închis așa st6, vl3 și buciumașii din st4.
// La o misiune nouă cu un loc de atins, adaugă-l în CASES.  node test/steaguri.js
const fs = require('fs'), vm = require('vm'), path = require('path');
global.localStorage = { getItem: () => null, setItem: () => {} };
const R = path.join(__dirname, '../js');
for (const f of ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte', 'camp-domni', 'camp-noi']) vm.runInThisContext(fs.readFileSync(path.join(R, f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G, T = G.Trig;
// cine trebuie să ajungă: 'hero' sau 'vil' (construiesc) sau 'mil' (oșteni)
const CASES = [
  ['vl2', 'Poenari (fortăreața)', 52, 30, 4, 'vil'],
  ['vl3', 'Spre munți (Vlad scapă)', 48, 8, 6, 'hero'],
  ['mi2', 'Vadul spre casă', 72, 6, 7, 'hero'],
  ['mh3', 'Alba Iulia', 16, 16, 4, 'hero'],
  ['st4', 'Buciumaș 1', 18, 40, 1.8, 'mil'], ['st4', 'Buciumaș 2', 20, 56, 1.8, 'mil'], ['st4', 'Buciumaș 3', 24, 72, 1.8, 'mil'],
  ['st6', 'Copacii 1..6 (56,82)', 56.5, 82.5, 3, 'vil'],
  ['mi3*', 'Cetatea ta (după cucerire)', 62, 70, 4, 'vil'],
];
let bad = 0;
for (const [id, name, tx, ty, rad, who] of CASES) {
  const mid = id.replace('*', '');
  G.newGame(T.options(mid, 'normal')); T.begin(mid); G.update(0.05);
  if (id.endsWith('*')) { G.C.blds.filter(b => b.o === 1).forEach(b => G.damage(b, 1e6, null)); for (let i = 0; i < 40; i++) G.update(0.05); }
  const N = G.S.N, pass = (G.C.pp && G.C.pp[0]) || G.C.pass;
  const us = G.C.units.filter(u => u.o === 0 && (who === 'hero' ? G.UNITS[u.t].hero : who === 'vil' ? u.t === 'vil' : (G.isMil(u) && !G.UNITS[u.t].hero)));
  if (!us.length) { console.log(id, name, '— nicio unitate de tipul', who); continue; }
  const s = us[0], seen = new Uint8Array(N * N), q = [];
  const st = Math.floor(s.y) * N + Math.floor(s.x); seen[st] = 1; q.push(st);
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  while (q.length) { const c = q.pop(), cx = c % N, cy = (c - cx) / N;
    for (let d = 0; d < 8; d++) { const nx = cx + DX[d], ny = cy + DY[d]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const ni = ny * N + nx;
      if (seen[ni] || !pass[ni]) continue; if (d >= 4 && (!pass[cy * N + nx] || !pass[ny * N + cx])) continue; seen[ni] = 1; q.push(ni); } }
  let best = 1e9; for (let i = 0; i < N * N; i++) if (seen[i]) { const x = i % N + 0.5, y = (i - i % N) / N + 0.5; best = Math.min(best, Math.hypot(x - tx, y - ty)); }
  // drumul real (A*, aceeași limită ca în joc)
  const p = G.findPath(s.x, s.y, { x: Math.floor(tx), y: Math.floor(ty), r: Math.floor(rad) }, undefined, 0);
  const end = p && p.length ? p[p.length - 1] : [s.x, s.y], endD = Math.hypot(end[0] - tx, end[1] - ty);
  console.log(`${id.padEnd(4)} ${name.padEnd(26)} se vede la pornire: ${G.explored(tx, ty) ? 'DA ' : 'NU '} | cel mai aproape posibil: ${best.toFixed(1)} (trebuie ≤ ${rad}) ${best <= rad ? 'OK' : (bad++, '❌ NU SE POATE')} | A*: ajunge la ${endD.toFixed(1)}`);
}
console.log(bad ? bad + ' locuri de neatins' : 'toate locurile se pot atinge'); process.exit(bad ? 1 : 0);
