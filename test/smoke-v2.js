// Fum v2: meniul, bătălia liberă cu 4 jucători, arborele, finalul. Capturi în test/out.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = process.env.URL || 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(url);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test/out/v2-start.png' });
  await page.click('#bSkirmish'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'test/out/v2-setup.png' });
  await page.click('#sBack');
  const civ = process.env.CIV || 'val';
  await page.evaluate((civ) => { G.Menu.startSkirmish({ civ, mode: '2v2', ai: ['ung', 'oto', 'tat'], map: 'rau', size: 96, startAge: 2, res: 'mult' }); }, civ);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test/out/v2-game0.png' });
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => { for (let i = 0; i < 1200; i++) { G.update(0.05); if (G.S.over) break; } });
    await page.waitForTimeout(300);
  }
  const info = await page.evaluate(() => {
    const f = G.C.units.find(u => u.task && u.task.k === 'atk' && G.C.vis[Math.floor(u.y) * G.S.N + Math.floor(u.x)]) || G.C.units.find(u => u.o === 0);
    if (f) G.R.center(f.x, f.y);
    G.UI.select(G.C.units.filter(u => u.o === 0).slice(0, 12));
    return { t: Math.round(G.S.t), players: G.S.players.map(P => P.civ + ':ep' + P.age + ':pop' + P.pop + (P.alive ? '' : '✝')) };
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test/out/v2-game1.png' });
  await page.evaluate(() => { const b = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); if (b) G.UI.select([b]); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test/out/v2-tc.png' });
  await page.evaluate(() => G.Menu.openTree('tat'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test/out/v2-tree.png' });
  await page.evaluate(() => { G.Menu.show('tree', false); G.finishGame(1, 1); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test/out/v2-end.png' });
  console.log(JSON.stringify(info));
  console.log(errors.length ? 'ERORI:\n' + [...new Set(errors)].slice(0, 15).join('\n') : 'fără erori');
  await browser.close();
})();
