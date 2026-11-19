// Robotul care joacă misiunile ca un om: fără coduri și fără scurtături, doar cu comenzile din joc
// (adună, construiește, antrenează, mută, atacă), cu drumurile adevărate și pe fiecare dificultate.
// Economia și armata le conduce AI-ul jocului, pe partea ta și cu regulile tale (de exemplu, nu construiește
// pe hartă neexplorată); obiectivele speciale (steaguri, evadări, capcane) le face ghidul din test/ghid-misiuni.js.
// Scrie pentru fiecare misiune: rezultatul, timpul, obiectivele și ce l-a încurcat (oameni blocați, eroul în pericol).
//    node test/joaca-misiuni.js [dificultăți: usor,normal,greu] [misiuni: st1,vl3,...] [minute maxime]
const fs = require('fs'), vm = require('vm'), path = require('path');
global.localStorage = { getItem: () => null, setItem: () => {} };
const R = path.join(__dirname, '../js');
for (const f of ['data', 'map', 'path', 'sim', 'ai', 'trig', 'camp-stefan', 'camp-alte', 'camp-domni', 'camp-noi']) vm.runInThisContext(fs.readFileSync(path.join(R, f + '.js'), 'utf8'), { filename: f + '.js' });
const G = globalThis.G, T = G.Trig;
const GHID = fs.existsSync(path.join(__dirname, 'ghid-misiuni.js')) ? require('./ghid-misiuni.js') : {};
const diffs = (process.argv[2] || 'normal').split(','), only = process.argv[3] ? process.argv[3].split(',') : null, MAXMIN = +process.argv[4] || 45;
const ids = G.CAMPAIGNS.flatMap(c => c.scen).filter(id => !only || only.includes(id));
const rows = [];

// eroul la adăpost: în cea mai apropiată cetate, fortăreață sau turn; fără ele, în spatele oastei, departe de dușmani
function safeHero(h, st) {
  h.noAi = true;
  if (h.gin) return;
  if (h.hp < G.maxHp(h) * 0.5) st.heroLow++;
  const homes = G.C.blds.filter(b => b.o === 0 && !b.dead && b.built && G.BLDS[b.t].gar && (b.t === 'cetate' || b.t === 'fortareata' || b.t === 'turn'));
  if (homes.length) { homes.sort((a, b) => G.dist(a, h) - G.dist(b, h)); if (!(h.task && h.task.k === 'gar')) G.cmdGarrison([h], homes[0]); return; }
  let foe = null, fd = 1e9; G.C.units.forEach(u => { if (!u.dead && G.enemy(0, u.o) && G.isMil(u)) { const d = G.dist(u, h); if (d < fd) { fd = d; foe = u; } } });
  if (foe && fd < 12) { const dx = h.x - foe.x, dy = h.y - foe.y, l = Math.sqrt(dx * dx + dy * dy) || 1; G.cmdMove([h], Math.max(1, Math.min(G.S.N - 2, h.x + dx / l * 6)), Math.max(1, Math.min(G.S.N - 2, h.y + dy / l * 6)), false); }
}
function play(id, diff) {
  G.newGame(T.options(id, diff)); T.begin(id);
  const S = G.S, m = G.MISSIONS[id], g = GHID[id] || {}, st = { stuck: 0, heroLow: 0, notes: [] };
  const ctx = { G, T, S, id, diff, note: t => { if (st.notes.length < 6) st.notes.push(t); } };
  // cu ghid: AI-ul face economia și apărarea, ghidul decide atacurile; fără ghid, AI-ul joacă tot
  S.players[0].aiMode = g.tick ? (g.aiMode || 'eco') : 'full';
  // robotul știe harta ca un AI (AI-ul jocului nu trimite iscoade); restul regulilor sunt ale jucătorului.
  // AI-ul îi joacă partea din bucla jocului, ca oricărui jucător AI.
  S.players[0].ai = !g.noAi;
  if (g.start) g.start(ctx);
  let nextAi = 0, nextG = 0;
  for (let i = 0; i < MAXMIN * 60 * 20 && !S.over; i++) {
    G.update(0.05);
    if (G.msgQ) G.msgQ.length = 0;
    // de câteva ori pe secundă, partea ta: AI-ul pentru economie și armată (dacă ghidul nu-l oprește), apoi ghidul
    if (g.aiAfter) S.players[0].aiMode = S.t < g.aiAfter ? 'static' : (g.aiMode || 'eco');
    if (S.t >= nextG) {
      nextG = S.t + 1;
      if (g.tick) g.tick(ctx);
      // eroul: dacă misiunea se pierde odată cu el, un om atent îl ține la adăpost (în cetate, sau în spatele oastei)
      const h = G.heroOf(0);
      if (h && m.keepHero && !(g.heroFree && g.heroFree(ctx))) safeHero(h, st); else if (h) delete h.noAi;
      // oameni care au un drum, dar nu se mișcă de mult (blocați)
      G.C.units.forEach(u => { if (u.o === 0 && u.path && u.path.length) { const k = Math.round(u.x * 2) + ',' + Math.round(u.y * 2); if (u._bk === k) { u._bs = (u._bs || 0) + 1; if (u._bs === 20) st.stuck++; } else { u._bk = k; u._bs = 0; } } });
    }
  }
  const obj = S.scen.obj.map(o => (o.st === 1 ? '✓' : o.st === 2 ? '✗' : '·') + (o.sec ? '(s)' : ''));
  return { id, diff, res: S.over === 1 ? 'VICTORIE' : S.over === 2 ? 'înfrângere' : 'neterminat', min: (S.t / 60).toFixed(1), obj: obj.join(''), why: S.over === 2 ? (S.scen.why || '') : '', stuck: st.stuck, heroLow: st.heroLow, notes: st.notes };
}

const t0 = Date.now();
for (const diff of diffs) for (const id of ids) {
  let r;
  try { r = play(id, diff); } catch (e) { r = { id, diff, res: 'EROARE', min: '-', obj: '', why: e.stack.split('\n').slice(0, 2).join(' / '), stuck: 0, heroLow: 0, notes: [] }; }
  rows.push(r);
  console.log(`${r.id.padEnd(4)} ${r.diff.padEnd(7)} ${r.res.padEnd(11)} ${String(r.min).padStart(5)} min  ${r.obj.padEnd(10)} ${r.stuck ? 'blocați:' + r.stuck + ' ' : ''}${r.heroLow ? 'erou rănit:' + r.heroLow + ' ' : ''}${r.why}${r.notes.length ? ' | ' + r.notes.join('; ') : ''}`);
}
const won = rows.filter(r => r.res === 'VICTORIE').length;
console.log(`\n${won}/${rows.length} câștigate (${Math.round((Date.now() - t0) / 1000)} s)`);
