// Fiecare misiune pornește, rulează 3 minute de joc fără erori; capturi în test/out/m-<id>.png
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForTimeout(1000);
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => G.CAMPAIGNS.flatMap(c => c.scen));
  for (const id of ids) {
    errors.length = 0;
    await page.evaluate((id) => { G.Camp.story(id, 'intro'); }, id);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test/out/s-${id}.png` });
    await page.evaluate((id) => { G.Menu.show('story', false); G.Trig.start(id, 'normal'); }, id);
    await page.waitForTimeout(700);
    const mins = +(process.env.MIN || 3);
    const r = await page.evaluate((mins) => { for (let i = 0; i < mins * 60 * 20; i++) { G.update(0.05); if (G.S.over) break; } return { t: Math.round(G.S.t), over: G.S.over, obj: G.S.scen.obj.map(o => (o.st ? (o.st === 1 ? '✓' : '✗') : '·') + o.text.slice(0, 40)), units: G.C.units.length, why: G.S.scen.why || '' }; }, mins);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test/out/m-${id}.png` });
    console.log(id, JSON.stringify(r));
    if (errors.length) console.log('  ERORI:', [...new Set(errors)].slice(0, 6).join('\n  '));
    await page.evaluate(() => { G.running = false; G.Menu.show('end', false); G.Menu.show('story', false); });
  }
  await browser.close();
})();
