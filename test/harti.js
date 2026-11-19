// Hărțile: fiecare tip × mărime × număr de jucători × semințe: bazele legate, resursele corecte, timpul.
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G;
const seeds = +(process.env.SEEDS || 6);
let bad = 0;
for (const type of (process.env.TYPES || 'rau,codri,stepa,delta,munti,mare,lac').split(',')) for (const N of [72, 96, 120]) for (const nP of [2, 3, 4]) {
  let worst = 0, fails = [], res = { gold: 0, stone: 0, sheep: 0, relic: 0, tree: 0 };
  for (let s = 0; s < seeds; s++) {
    const t0 = Date.now();
    G.newGame({ seed: 1000 + s * 77, size: N, map: { type, season: 'vara' }, players: Array.from({ length: nP }, (_, i) => ({ civ: G.CIV_LIST[i], ai: true, team: nP === 4 ? (i < 2 ? 1 : 2) : i + 1 })) });
    worst = Math.max(worst, Date.now() - t0);
    const S = G.S, C = G.C;
    // fiecare cetate ajunge la celelalte (drum pentru jucătorul 0)
    const tcs = C.blds.filter(b => b.t === 'cetate');
    for (let i = 1; i < tcs.length; i++) { const p = G.findPath(tcs[0].x, tcs[0].ty + 4.5, { rect: [tcs[i].tx, tcs[i].ty, tcs[i].tx + 3, tcs[i].ty + 3], r: 1 }, 60000, 0); const last = p && p[p.length - 1]; if (!last || Math.hypot(last[0] - tcs[i].x, last[1] - tcs[i].y) > 4) fails.push('s' + s + ': baza ' + i + ' nelegată'); }
    // fiecare bază are resursele ei în 20 de pătrățele
    tcs.forEach((tc, i) => {
      const near = t => S.ents.filter(e => e.k === 'r' && e.t === t && Math.hypot(e.x - tc.x, e.y - tc.y) < 20).length;
      if (near('gold') < 7 || near('stone') < 5 || near('sheep') < 6 || near('tree') < 25) fails.push('s' + s + ' baza ' + i + ': aur ' + near('gold') + ' piatră ' + near('stone') + ' oi ' + near('sheep') + ' copaci ' + near('tree'));
    });
    for (const k in res) res[k] += S.ents.filter(e => e.k === 'r' && e.t === k).length / seeds;
  }
  if (fails.length) bad++;
  console.log(`${type.padEnd(6)} ${N} ${nP}j  ${worst}ms  aur ${res.gold | 0} piatră ${res.stone | 0} oi ${res.sheep | 0} moaște ${res.relic | 0} copaci ${res.tree | 0}  ${fails.length ? 'PROBLEME: ' + fails.slice(0, 3).join('; ') : 'ok'}`);
}
process.exit(bad ? 1 : 0);
