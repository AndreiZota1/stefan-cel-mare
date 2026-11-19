// Țăranii dușmanilor și ai aliaților nu stau degeaba: în fiecare misiune, după 5 minute de joc, fiecare țăran
// al calculatorului are o treabă (ogor, lemne, construcție). Andrei a văzut pe 19.11, la Dristra, țărani otomani
// care stăteau toată misiunea (modul „doar apărare” oprea și munca lor).
//    node test/taranii.js [ușor|normal|greu]
const fs = require('fs'), vm = require('vm'), path = require('path');
global.localStorage = { getItem: () => null, setItem: () => {} };
for (const f of ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte', 'camp-domni', 'camp-noi']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), { filename: f });
const G = globalThis.G, T = G.Trig, diff = process.argv[2] || 'normal';
let bad = 0;
for (const id of G.CAMPAIGNS.flatMap(c => c.scen)) {
  G.newGame(T.options(id, diff)); T.begin(id);
  for (let i = 0; i < 300 * 20 && !G.S.over; i++) { G.update(0.05); G.msgQ.length = 0; }
  G.S.players.forEach((P, p) => {
    if (!p || !P.ai || P.aiMode === 'static') return;
    const v = G.C.units.filter(u => u.o === p && u.t === 'vil' && !u.dead), idle = v.filter(u => !u.task && !u.gin);
    if (idle.length) { bad++; console.log(`✗ ${id} (${G.MISSIONS[id].title}): ${idle.length} din ${v.length} țărani ai lui ${P.civ} stau degeaba (${[...new Set(idle.map(u => u.why || 'fără motiv'))].join(', ')})`); }
  });
}
console.log(bad ? `\n${bad} PROBLEME` : 'toți țăranii calculatorului muncesc'); process.exit(bad ? 1 : 0);
