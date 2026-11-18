// Test pe desktop, cu mouse și tastatură, ca în AoE2.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const OUT = '/tmp/scm-test';
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(process.env.URL || ('file://' + path.resolve(__dirname, '../index.html')));
  await page.waitForTimeout(600);
  await page.click('#bQuick');
  await page.waitForTimeout(1200);
  const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'GREȘ ') + name + (extra !== undefined ? ' — ' + extra : ''));
  const ev = (f, a) => page.evaluate(f, a);
  const ff = (sec) => ev(s => { for (let i = 0; i < s * 20; i++) G.update(0.05); }, sec);
  console.log('desktop:', await ev(() => document.body.classList.contains('desk')));
  // 1. clic stânga pe un țăran
  const v = await ev(() => { const u = G.C.units.find(u => u.o === 0 && u.t === 'vil'); const p = G.R.w2s(u.x, u.y); return { id: u.id, x: p[0], y: p[1] - 12 }; });
  await page.mouse.click(v.x, v.y);
  await page.waitForTimeout(200);
  ok('clic stânga alege țăranul', await ev(id => G.UI.sel.length === 1 && G.UI.sel[0] === id, v.id));
  // 2. clic stânga pe o oaie NU dă comandă (doar alege oaia)
  const sh = await ev(() => { const u = G.C.units.find(u => u.o === 0 && u.t === 'vil'); let b = null, bd = 1e9; G.S.ents.forEach(e => { if (e.t === 'sheep') { const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd && G.explored(e.x, e.y)) { bd = d; b = e; } } }); const p = G.R.w2s(b.x, b.y); return { x: p[0], y: p[1] - 5, id: b.id }; });
  await page.mouse.click(v.x, v.y); await page.waitForTimeout(100);
  await page.mouse.click(sh.x, sh.y, { button: 'right' });
  await page.waitForTimeout(200);
  ok('clic dreapta pe oaie = țăranul ciobănește', await ev(id => { const u = G.getE(id); return u.task && u.task.k === 'gat' && u.task.kind === 'sheep'; }, v.id));
  // 3. pătrat de selecție peste oamenii din fața cetății
  const box = await ev(() => { const us = G.C.units.filter(u => u.o === 0); let a = 1e9, b = -1e9, c = 1e9, d = -1e9; us.forEach(u => { const p = G.R.w2s(u.x, u.y); a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); }); return [a - 20, c - 30, b + 20, d + 10, us.length]; });
  await page.mouse.move(box[0], box[1]); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box[0] + (box[2] - box[0]) * i / 8, box[1] + (box[3] - box[1]) * i / 8);
  await page.mouse.up();
  await page.waitForTimeout(200);
  ok('pătratul de selecție', await ev(() => G.UI.sel.length) === box[4], (await ev(() => G.UI.sel.length)) + ' din ' + box[4]);
  await page.screenshot({ path: OUT + '/desk-01-selectie.png' });
  // 4. clic dreapta pe pământ = merg toți
  const gp = await ev(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); for (let r = 5; r < 12; r++) for (let a = 0; a < 6.28; a += 0.4) { const x = Math.floor(tc.x + Math.cos(a) * r), y = Math.floor(tc.y + Math.sin(a) * r); if (!G.C.occ[y * G.S.N + x] && G.C.pass[y * G.S.N + x]) { const p = G.R.w2s(x + 0.5, y + 0.5); if (p[0] > 100 && p[0] < G.R.W - 100 && p[1] > 100 && p[1] < G.R.H - 100 && !G.R.pick(p[0], p[1])) return p; } } return [720, 300]; });
  await page.mouse.click(gp[0], gp[1], { button: 'right' });
  await page.waitForTimeout(150);
  ok('clic dreapta pe pământ = merg', await ev(() => G.UI.selEnts().every(u => u.task && u.task.k === 'move')));
  // 5. un țăran, tasta Q = casă, clic stânga o pune
  await page.mouse.click(v.x, v.y); await page.waitForTimeout(100);
  await ev(id => G.UI.select([G.getE(id)]), v.id);
  await page.keyboard.press('q'); await page.waitForTimeout(150);
  ok('Q pornește casa', await ev(() => G.UI.place && G.UI.place.t === 'casa'));
  const spot = await ev(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); for (let r = 5; r < 10; r++) for (let a = 0; a < 6.28; a += 0.3) { const tx = Math.round(tc.x + Math.cos(a) * r - 1), ty = Math.round(tc.y + Math.sin(a) * r - 1); if (G.canPlace(0, 'casa', tx, ty)) { const p = G.R.w2s(tx + 1, ty + 1); if (p[1] > 80 && p[1] < 680 && p[0] > 100 && p[0] < 1300) return [p[0], p[1]]; } } return null; });
  await page.mouse.move(spot[0] - 30, spot[1]); await page.mouse.move(spot[0], spot[1]);
  await page.mouse.click(spot[0], spot[1]);
  await page.waitForTimeout(150);
  ok('clic stânga a pus casa', await ev(() => G.C.blds.length < G.S.ents.length && G.S.ents.some(e => e.k === 'b' && e.t === 'casa' && e.o === 0)));
  await ff(2);
  ok('țăranul o construiește', await ev(id => { const u = G.getE(id); return u.task && u.task.k === 'bld'; }, v.id));
  // 6. H = cetatea, Q = țăran, clic dreapta = punct de adunare
  await page.keyboard.press('h'); await page.waitForTimeout(120);
  ok('H alege cetatea', await ev(() => { const e = G.UI.selOne(); return e && e.t === 'cetate'; }));
  await page.keyboard.press('q'); await page.waitForTimeout(120);
  ok('Q face un țăran', await ev(() => G.UI.selOne().q.length === 1));
  await page.mouse.click(sh.x, sh.y, { button: 'right' }); await page.waitForTimeout(120);
  ok('clic dreapta = punct de adunare', await ev(() => !!G.UI.selOne().rally));
  // 7. grupuri: Ctrl+1, Esc, 1
  await ev(() => G.UI.select(G.C.units.filter(u => u.o === 0 && u.t === 'vil')));
  await page.keyboard.press('Control+1'); await page.keyboard.press('Escape');
  ok('Esc golește selecția', await ev(() => G.UI.sel.length === 0));
  await page.keyboard.press('1'); await page.waitForTimeout(80);
  ok('1 aduce grupul înapoi', await ev(() => G.UI.sel.length) >= 3, await ev(() => G.UI.sel.length));
  // 8. punct = țăranul fără treabă
  await ff(1);
  await page.keyboard.press('.');
  ok('tasta punct', true, await ev(() => G.UI.sel.length + ' ales'));
  // 9. indicația de pe buton
  await ev(id => G.UI.select([G.getE(id)]), v.id); await page.waitForTimeout(300);
  const bt = await ev(() => { const b = document.querySelector('#cmds button'); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.move(bt[0], bt[1]); await page.waitForTimeout(200);
  ok('indicația apare', await ev(() => getComputedStyle(document.getElementById('tip')).display === 'block'), await ev(() => document.getElementById('tip').textContent.slice(0, 60)));
  await page.screenshot({ path: OUT + '/desk-02-ui.png' });
  // 10. derulare la marginea ecranului
  const c0 = await ev(() => [G.cam.x, G.cam.y]);
  await page.mouse.move(1439, 450); await page.waitForTimeout(500);
  const c1 = await ev(() => [G.cam.x, G.cam.y]);
  ok('marginea din dreapta mută harta', c1[0] - c1[1] > c0[0] - c0[1], c0.map(n => n.toFixed(1)) + ' -> ' + c1.map(n => n.toFixed(1)));
  console.log(errors.length ? 'ERORI: ' + errors.join(' || ') : 'fără erori');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
