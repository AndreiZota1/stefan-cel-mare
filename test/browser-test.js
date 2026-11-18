// Test în Chrome, cu ecran de telefon ținut orizontal. Salvează capturi în /tmp/scm-test.
// node test/browser-test.js [scenariu]
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const OUT = '/tmp/scm-test';
fs.mkdirSync(OUT, { recursive: true });
const scen = process.argv[2] || 'basic';

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 851, height: 393 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  const url = 'file://' + path.resolve(__dirname, '../index.html') + (scen === 'spectate' ? '?spectate=1' : '');
  await page.goto(url);
  await page.waitForTimeout(700);
  const shot = async (n) => { await page.screenshot({ path: `${OUT}/${scen}-${n}.png` }); console.log('captură', n); };
  const ff = async (sec) => page.evaluate((s) => { for (let i = 0; i < s * 20; i++) { G.update(0.05); if (G.S.over) break; } }, sec);
  await shot('01-start');
  await page.click('#bQuick');
  await page.waitForTimeout(1200);
  await shot('02-joc');

  if (scen === 'basic') {
    // atinge un țăran
    const v = await page.evaluate(() => { const u = G.C.units.find(u => u.o === 0 && u.t === 'vil'); const p = G.R.w2s(u.x, u.y); return [p[0], p[1] - 10]; });
    await page.touchscreen.tap(v[0], v[1]);
    await page.waitForTimeout(400);
    await shot('03-taran-ales');
    // atinge o oaie
    const s = await page.evaluate(() => { const u = G.C.units.find(u => u.o === 0 && u.t === 'vil'); let best = null, bd = 1e9; G.S.ents.forEach(e => { if (e.t === 'sheep' && !e.dead) { const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd) { bd = d; best = e; } } }); const p = G.R.w2s(best.x, best.y); return [p[0], p[1] - 5]; });
    await page.touchscreen.tap(s[0], s[1]);
    await page.waitForTimeout(300);
    console.log('sarcina țăranului:', await page.evaluate(() => JSON.stringify(G.UI.selEnts().map(u => u.task && u.task.k + ':' + (u.task.kind || '')))));
    await ff(25);
    await page.waitForTimeout(300);
    await shot('04-dupa-25s');
    // construiește o casă
    await page.touchscreen.tap(v[0], v[1]);
    await page.waitForTimeout(300);
    const hb = await page.evaluate(() => { const b = [...document.querySelectorAll('#cmds button')].find(b => (b.getAttribute('aria-label')||'').startsWith('Casă')); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await page.touchscreen.tap(hb[0], hb[1]);
    await page.waitForTimeout(300);
    const spot = await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); for (let r = 4; r < 9; r++) for (let a = 0; a < 6.28; a += 0.3) { const tx = Math.round(tc.x + Math.cos(a) * r - 1), ty = Math.round(tc.y + Math.sin(a) * r - 1); if (G.canPlace(0, 'casa', tx, ty)) { const p = G.R.w2s(tx + 1, ty + 1); if (p[1] > 60 && p[1] < 270 && p[0] > 160 && p[0] < 700) return [p[0], p[1]]; } } return null; });
    console.log('loc casă', spot);
    if (spot) await page.touchscreen.tap(spot[0], spot[1]);
    await page.waitForTimeout(300);
    await shot('05-plasare');
    const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('#cmds button')].find(b => b.classList.contains('ok')); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (ok) await page.touchscreen.tap(ok[0], ok[1]);
    await page.waitForTimeout(300);
    await ff(8);
    await page.waitForTimeout(300);
    await shot('06-casa-incepe');
    // cetatea: fă un țăran
    const tcp = await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); const p = G.R.w2s(tc.x, tc.y); return p; });
    await page.touchscreen.tap(tcp[0], tcp[1] - 20);
    await page.waitForTimeout(400);
    await shot('07-cetate');
    console.log('selecție:', await page.evaluate(() => G.UI.selEnts().map(e => e.t).join(',')));
  }
  if (scen === 'spectate') {
    for (const m of [6, 6, 6]) {
      await ff(m * 60);
      await page.evaluate(() => { const c = G.C.units.filter(u => u.o === 1 && u.t !== 'vil'); const u = c.find(x => x.task && x.task.k === 'atk') || c[0]; if (u) G.R.center(u.x, u.y); });
      await page.waitForTimeout(400);
      await shot('min' + Math.round((await page.evaluate(() => G.S.t)) / 60));
    }
    await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 1 && b.t === 'cetate'); G.R.center(tc.x, tc.y); });
    await page.waitForTimeout(300);
    await shot('baza-otomana');
    await page.evaluate(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); G.R.center(tc.x, tc.y); });
    await page.waitForTimeout(300);
    await shot('baza-moldova');
  }
  console.log(errors.length ? 'ERORI:\n' + errors.join('\n') : 'fără erori în consolă');
  await browser.close();
})().catch(e => { console.error('TEST EȘUAT', e); process.exit(1); });
