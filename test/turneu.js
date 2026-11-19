// Turneul de echilibru: toate perechile de civilizații, pe mai multe hărți, calculator contra calculator.
// Câștigă cine termină jocul sau, la sfârșitul timpului, cine are scorul mai mare. node test/turneu.js [minute] [hărți]
const fs = require('fs'), vm = require('vm'), path = require('path');
for (const f of ['data', 'map', 'path', 'sim', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G;
const mins = +process.argv[2] || 40, maps = (process.argv[3] || 'rau,stepa,codri').split(',');
const L = G.CIV_LIST, win = {}, games = {}, errs = [];
L.forEach(c => { win[c] = 0; games[c] = 0; });
let n = 0;
for (const map of maps) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const civs = (n % 2) ? [L[j], L[i]] : [L[i], L[j]], seed = 1000 + n * 37; n++;
  try {
    G.newGame({ seed, diff: 'normal', map: { type: map, season: 'vara' }, players: civs.map((c, k) => ({ civ: c, ai: true, team: k + 1 })) });
    const dt = 1 / 20; let steps = 0;
    while (G.S.t < mins * 60 && !G.S.over) { G.update(dt); if (++steps % 600 === 0) G.msgQ.length = 0; }
    const S = G.S, alive = S.players.filter(P => P.alive);
    let w; if (alive.length === 1) w = alive[0].id; else { const sc = S.players.map(P => G.score(P.id)); w = sc[0] >= sc[1] ? 0 : 1; }
    const half = alive.length === 2 && Math.abs(G.score(0) - G.score(1)) < 0.08 * Math.max(G.score(0), G.score(1));
    civs.forEach((c, k) => { games[c]++; if (half) win[c] += 0.5; else if (k === w) win[c]++; });
    console.log(`${map.padEnd(6)} ${civs.join('-').padEnd(8)} ${(S.t / 60).toFixed(0)}min ${alive.length === 1 ? 'câștigă ' + civs[w] : half ? 'egal' : 'la scor ' + civs[w]} | ${S.players.map(P => P.civ + ' ep' + P.age + ' sc' + Math.round(G.score(P.id))).join(' ')}`);
  } catch (e) { errs.push(civs.join('-') + ' ' + e.message); console.log(civs.join('-'), 'EROARE', e.stack.split('\n').slice(0, 3).join(' / ')); }
}
console.log('\nREZULTAT:'); L.forEach(c => console.log(c.padEnd(4), (win[c] + '/' + games[c]).padEnd(7), Math.round(100 * win[c] / games[c]) + '%'));
if (errs.length) console.log('ERORI', errs.length);
