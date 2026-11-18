// Un meci întreg, cu ecranul desenat: prinde erorile de desenare și de interfață.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html') + '?spectate=1');
  await page.waitForTimeout(500);
  await page.click('#bQuick');
  await page.waitForTimeout(800);
  let worst = 0;
  for (let step = 0; step < 50; step++) {
    const r = await page.evaluate(() => {
      for (let i = 0; i < 600; i++) { G.update(0.05); if (G.S.over) break; }
      // camera pe cea mai mare încăierare, cu toate selectate ca să desenăm și barele de viață
      const fighters = G.C.units.filter(u => u.task && u.task.k === 'atk');
      const f = fighters[0] || G.C.units[0];
      if (f) { G.R.center(f.x, f.y); G.UI.select(G.C.units.filter(u => u.o === 0).slice(0, 30)); }
      const t0 = performance.now();
      for (let k = 0; k < 3; k++) { G.R.frame(0.016); G.UI.tick(0.25); }
      return { t: G.S.t, ms: (performance.now() - t0) / 3, over: G.S.over, n: G.S.ents.length };
    });
    worst = Math.max(worst, r.ms);
    if (step % 10 === 0) console.log('min', (r.t / 60).toFixed(1), 'cadru', r.ms.toFixed(1), 'ms, obiecte', r.n);
    if (r.over) { console.log('sfârșit:', r.over === 1 ? 'Moldova' : 'Otomanii'); break; }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/scm-test/qa-final.png' });
  console.log('cel mai lent cadru:', worst.toFixed(1), 'ms');
  console.log(errors.length ? 'ERORI (' + errors.length + '): ' + [...new Set(errors)].slice(0, 6).join(' || ') : 'fără erori');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
