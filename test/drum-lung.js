// Oamenii trimiși departe trebuie să ajungă: un țăran, un oștean, un călăreț, un tun și un berbec primesc un drum
// lung (sau un atac departe) și nu au voie să se oprească pe drum. Pe 19.11, câmpurile pentru desenul lin (px, py)
// au călcat peste ale pazei contra blocajelor: orice om care mergea era crezut blocat și își pierdea ordinul după
// vreo 8 secunde. Testul ăsta ar fi prins-o.
//    node test/drum-lung.js
const fs = require('fs'), vm = require('vm'), path = require('path');
global.localStorage = { getItem: () => null, setItem: () => {} };
for (const f of ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte', 'camp-domni', 'camp-noi']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), { filename: f });
const G = globalThis.G, T = G.Trig;
let bad = 0;
// 1) pe o hartă deschisă: drumuri de 40 de pătrățele
G.newGame({ seed: 7, diff: 'normal', size: 96, map: { type: 'stepa', season: 'vara' }, reveal: 'tot', players: [{ civ: 'mol', ai: false, team: 1 }, { civ: 'oto', ai: true, team: 2, aiMode: 'static' }] });
G.S.players[1].aiMode = 'static';
const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate');
const kinds = ['vil', 'mil', 'kni', 'can', 'ram'];
const us = kinds.map(t => G.placeUnits(0, t, 1, tc.x + 4, tc.y + 4)[0]); G.refreshLists();
const goal = [G.S.N / 2, G.S.N / 2];
us.forEach(u => G.cmdMove([u], goal[0], goal[1], false));
for (let i = 0; i < 120 * 20; i++) G.update(0.05);
us.forEach(u => { const d = G.hyp(u.x - goal[0], u.y - goal[1]); const ok = d < 4; if (!ok) bad++; console.log(`${ok ? '✓' : '✗'} ${u.t.padEnd(4)} a mers ${G.hyp(tc.x + 4 - u.x, tc.y + 4 - u.y).toFixed(0)} pătrățele, a rămas la ${d.toFixed(1)} de țintă`); });
// 2) un tun și un berbec trimiși să atace un zid departe își țin ordinul până îl lovesc
G.newGame(T.options('st2', 'normal')); T.begin('st2'); for (let i = 0; i < 20; i++) G.update(0.05);
const can = G.C.units.find(u => u.o === 0 && u.t === 'can'), ram = G.C.units.find(u => u.o === 0 && u.t === 'ram');
const wall = G.C.blds.filter(b => G.enemy(0, b.o) && G.BLDS[b.t].wall).sort((a, b) => G.dist(a, can) - G.dist(b, can))[0];
G.cmdAttack([can], wall); G.cmdAttack([ram], wall);
let hit = 0; for (let i = 0; i < 150 * 20 && !hit; i++) { G.update(0.05); if (wall.hp < G.maxHp(wall)) hit = Math.round(G.S.t); }
console.log(`${hit ? '✓' : '✗'} tunul și berbecul ${hit ? 'lovesc zidul după ' + hit + ' s' : 'n-au ajuns la zid'} (sarcini: ${can.task ? can.task.k : '-'}, ${ram.task ? ram.task.k : '-'})`); if (!hit) bad++;
console.log(bad ? `\n${bad} PROBLEME` : '\ntoți au ajuns'); process.exit(bad ? 1 : 0);
