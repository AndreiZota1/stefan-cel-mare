// Capturi pentru fiecare tip de hartă, vara și iarna, toată harta la vedere: test/out/h-<tip>-<anotimp>.png
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForTimeout(1500);
  const types = (process.env.TYPES || 'rau,codri,stepa,delta,munti').split(',');
  for (const type of types) for (const season of (process.env.SEASONS || 'vara,iarna').split(',')) {
    await page.evaluate(([type, season]) => {
      G.Menu.startSkirmish({ civ: 'mol', mode: process_mode(), ai: ['oto', 'ung', 'tat'], map: type, season, size: 96, reveal: 'tot' });
      function process_mode() { return '1v1'; }
      G.cam.z = +(localStorage.getItem('z') || 0.5); G.R.center(G.S.N / 2, G.S.N / 2);
    }, [type, season]);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `test/out/h-${type}-${season}.png` });
    await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); G.cam.z = 1.1; G.R.center(tc.x + 4, tc.y + 4); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test/out/h-${type}-${season}-aproape.png` });
  }
  console.log(errors.length ? 'ERORI:\n' + [...new Set(errors)].join('\n') : 'fără erori');
  await browser.close();
})();
