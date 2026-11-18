// Fluxuri: antrenare, selecție cu degetul ținut apăsat, salvare + continuare, victorie.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 851, height: 393 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(url); await page.waitForTimeout(500);
  await page.click('#bQuick'); await page.waitForTimeout(600);
  const ff = (sec) => page.evaluate((s) => { for (let i = 0; i < s * 20; i++) G.update(0.05); }, sec);
  // 1. Cetatea -> 2 țărani
  const tcp = await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); const p = G.R.w2s(tc.x, tc.y); return [p[0], p[1] - 30]; });
  await page.touchscreen.tap(tcp[0], tcp[1]); await page.waitForTimeout(400);
  console.log('ales după atingerea cetății:', await page.evaluate(() => G.UI.selEnts().map(e => e.t).join(',')), 'la', tcp.map(Math.round), 'pick:', await page.evaluate((p) => { const e = G.R.pick(p[0], p[1]); return e && e.t; }, tcp));
  const vb = await page.evaluate(() => { const b = [...document.querySelectorAll('#cmds button')].find(b => (b.getAttribute('aria-label')||'').startsWith('Țăran')); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  console.log('buton țăran', !!vb);
  await page.touchscreen.tap(vb[0], vb[1]); await page.waitForTimeout(250);
  await page.touchscreen.tap(vb[0], vb[1]); await page.waitForTimeout(250);
  console.log('coadă cetate:', await page.evaluate(() => G.C.blds.find(b => b.o === 0 && b.t === 'cetate').q.length), 'hrană', await page.evaluate(() => G.S.players[0].res.f));
  await ff(30);
  console.log('populație după 30s:', await page.evaluate(() => G.S.players[0].pop + '/' + G.S.players[0].cap));
  // 2. selecție: apăsat lung și tras peste oamenii din jurul cetății
  const box = await page.evaluate(() => { const us = G.C.units.filter(u => u.o === 0); let a = 1e9, b = -1e9, c = 1e9, d = -1e9; us.forEach(u => { const p = G.R.w2s(u.x, u.y); a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); }); return [a - 15, c - 25, b + 15, d + 10, us.length]; });
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await touch('touchStart', box[0], box[1]);
  await page.waitForTimeout(520);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', box[0] + (box[2] - box[0]) * i / 6, box[1] + (box[3] - box[1]) * i / 6); await page.waitForTimeout(30); }
  await touch('touchEnd');
  await page.waitForTimeout(300);
  console.log('aleși cu degetul ținut:', await page.evaluate(() => G.UI.sel.length), 'din', box[4]);
  await page.screenshot({ path: '/tmp/scm-test/flows-selectie.png' });
  // 3. tras cu un deget = mută harta
  const cam0 = await page.evaluate(() => [G.cam.x, G.cam.y]);
  await touch('touchStart', 400, 200);
  for (let i = 1; i <= 5; i++) { await touch('touchMove', 400 - i * 30, 200 - i * 10); await page.waitForTimeout(20); }
  await touch('touchEnd');
  const cam1 = await page.evaluate(() => [G.cam.x, G.cam.y]);
  console.log('camera mutată:', cam0.map(v => v.toFixed(1)), '->', cam1.map(v => v.toFixed(1)));
  // 4. salvare, reîncărcare, continuare
  const t0 = await page.evaluate(() => { G.saveGame(); return G.S.t; });
  await page.reload(); await page.waitForTimeout(600);
  const contVisible = await page.evaluate(() => getComputedStyle(document.getElementById('bContinue')).display !== 'none' && document.getElementById('bContinue').textContent);
  console.log('buton Continuă:', contVisible);
  await page.click('#bContinue'); await page.waitForTimeout(500);
  console.log('timp salvat', t0.toFixed(1), 'după continuare', (await page.evaluate(() => G.S.t)).toFixed(1), 'pop', await page.evaluate(() => G.S.players[0].pop));
  // 5. victorie
  await page.evaluate(() => { G.S.ents.filter(e => e.o === 1 && (e.t === 'cetate' || e.t === 'vil')).forEach(e => G.kill(e, { o: 0 })); });
  await page.waitForTimeout(1800);
  console.log('ecran final:', await page.evaluate(() => document.getElementById('end').classList.contains('on') && document.getElementById('endT').textContent));
  await page.screenshot({ path: '/tmp/scm-test/flows-victorie.png' });
  console.log(errors.length ? 'ERORI: ' + errors.join(' | ') : 'fără erori');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
