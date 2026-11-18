// Poze din joc: pentru fiecare civilizație, toate clădirile și o oaste, la scara reală (test/out/civ-<civ>.png)
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForTimeout(1500);
  const civs = (process.env.CIVS || 'mol,val,ung,pol,oto,tat').split(',');
  for (const civ of civs) {
    await page.evaluate((civ) => {
      G.Menu.startSkirmish({ civ, mode: '1v1', ai: [civ === 'oto' ? 'mol' : 'oto'], map: 'stepa', season: process_season(), size: 96, reveal: 'tot', startAge: 4 });
      function process_season() { return 'vara'; }
      const S = G.S, P = S.players[0]; P.ai = false;
      S.players.forEach(p => { p.ai = false; });
      G.C.units.slice().forEach(u => { u.dead = 1; }); G.C.blds.filter(b => b.t !== 'cetate').forEach(b => { b.dead = 1; });
      const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'), x0 = Math.max(4, Math.min(S.N - 30, tc.tx - 10)), y0 = Math.max(4, Math.min(S.N - 26, tc.ty - 8));
      G.clearArea && G.clearArea(x0, y0, x0 + 28, y0 + 24);
      const L = [['minune', 0, 0], ['fortareata', 6, 0], ['universitate', 11, 0], ['manastire', 15, 0], ['targ', 19, 0], ['atelier', 23, 0],
        ['cazarma', 0, 6], ['poligon', 4, 6], ['grajd', 8, 6], ['fierarie', 12, 6], ['casa', 16, 6], ['casa', 19, 6], ['moara', 22, 6], ['turn', 25, 6],
        ['joagar', 0, 10], ['mina', 3, 10], ['ogor', 6, 10]];
      L.forEach(([t, dx, dy]) => { try { const b = G.addBld(t, 0, x0 + dx, y0 + dy, true); if (b) { b.hp = G.maxHp ? G.maxHp(b) : b.hp; } } catch (e) { console.log(t, e.message); } });
      const U = ['vil', 'vil', 'mon', 'hero', 'mil5', 'mil3', 'spr3', 'skr2', 'arc3', 'gun2', 'lcv3', 'kni3', 'har2', G.CIVS[civ].uniq, G.CIVS[civ].uniq + '2', 'ram2', 'cat2', 'can2', 'treb'];
      U.forEach((t, i) => { if (!G.UNITS[t]) return; if (G.UNITS[t].notCiv && G.UNITS[t].notCiv.indexOf(civ) >= 0) return; const u = G.addUnit(t, 0, x0 + 11 + (i % 7) * 1.4, y0 + 12 + Math.floor(i / 7) * 1.6); if (u) u.dir8 = 1; });
      G.cam.z = 1; G.R.center(x0 + 13, y0 + 10);
      G.paused = true; if (G.S) G.S.paused = true;
    }, civ);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `test/out/civ-${civ}.png` });
  }
  console.log(errors.length ? 'ERORI:\n' + [...new Set(errors)].join('\n') : 'fără erori');
  await browser.close();
})();
