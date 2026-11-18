// Un „jucător” care folosește doar mouse-ul și tastatura, ca un om, 12 minute de joc.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [], log = [];
  page.on('pageerror', e => errors.push(e.message + ' | ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(process.env.URL || ('file://' + path.resolve(__dirname, '../index.html')));
  await page.waitForTimeout(500); await page.click('#bQuick'); await page.waitForTimeout(1200);
  const ev = (f, a) => page.evaluate(f, a);
  const ff = s => ev(x => { for (let i = 0; i < x * 20; i++) { G.update(0.05); if (G.S.over) break; } }, s);
  const center = id => ev(i => { const e = G.getE(i); if (e) G.R.center(e.x, e.y); }, id);
  const scr = id => ev(i => { const e = G.getE(i); if (!e) return null; const p = G.R.w2s(e.x, e.y); return [p[0], p[1] - (e.k === 'u' ? 12 : e.k === 'r' ? 6 : 10)]; }, id);
  const keyIdx = name => ev(n => { const bs = [...document.querySelectorAll('#cmds button')]; return bs.findIndex(b => (b.getAttribute('aria-label') || '').startsWith(n)); }, name);
  const GRID = ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'];
  async function pressFor(name) { await page.waitForTimeout(80); const i = await keyIdx(name); if (i < 0) return false; await page.keyboard.press(GRID[i]); return true; }
  async function freeSpot(t) {
    return ev(t2 => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); const n = G.BLDS[t2].n;
      for (let r = 6; r < 16; r++) for (let a = 0; a < 6.28; a += 0.21) { const tx = Math.round(tc.x + Math.cos(a) * r - n / 2), ty = Math.round(tc.y + Math.sin(a) * r - n / 2);
        if (!G.canPlace(0, t2, tx, ty)) continue; let ok = true; for (let y = ty - 1; y <= ty + n && ok; y++) for (let x = tx - 1; x <= tx + n; x++) { const id = G.C.occ[y * G.S.N + x]; if (id && G.getE(id) && G.getE(id).k === 'b') ok = false; }
        if (ok) { G.R.center(tx + n / 2, ty + n / 2); const p = G.R.w2s(tx + n / 2, ty + n / 2); return { p, tx, ty }; } } return null; }, t);
  }
  let built = {}, trained = 0, ordered = 0;
  for (let step = 0; step < 36; step++) {
    const st = await ev(() => { const P = G.S.players[0]; return { t: G.S.t, f: P.res.f, w: P.res.w, g: P.res.g, pop: P.pop, cap: P.cap, age: P.age, idle: G.C.units.filter(u => u.o === 0 && u.t === 'vil' && !u.task).length, vil: G.C.units.filter(u => u.o === 0 && u.t === 'vil').length, caz: G.C.blds.some(b => b.o === 0 && b.t === 'cazarma' && b.built), over: G.S.over }; });
    if (st.over) { log.push('sfârșit ' + st.over); break; }
    // 1. țăranii fără treabă la muncă: punct, apoi clic dreapta pe resursă
    for (let k = 0; k < Math.min(st.idle, 4); k++) {
      await page.keyboard.press('.'); await page.waitForTimeout(60);
      const want = st.f < 250 ? ['sheep', 'berry'] : st.w < 250 ? ['tree'] : ['tree', 'gold'];
      const rid = await ev(w => { const u = G.UI.selOne(); if (!u || u.t !== 'vil') return 0; let b = null, bd = 1e9; G.S.ents.forEach(e => { if (e.k === 'r' && w.includes(e.t) && G.explored(e.x, e.y) && G.accessible(e)) { const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd) { bd = d; b = e; } } }); return b ? b.id : 0; }, want);
      if (!rid) continue;
      await center(rid); await page.waitForTimeout(40);
      const p = await scr(rid); if (!p) continue;
      await page.mouse.click(p[0], p[1], { button: 'right' }); ordered++;
    }
    // 2. case când nu mai e loc
    if (st.cap - st.pop <= 2 && st.w >= 25) {
      await page.keyboard.press('.'); await page.waitForTimeout(50);
      let sel = await ev(() => G.UI.selOne() && G.UI.selOne().t);
      if (sel !== 'vil') { await ev(() => { const u = G.C.units.find(x => x.o === 0 && x.t === 'vil'); G.R.center(u.x, u.y); }); const p = await ev(() => { const u = G.C.units.find(x => x.o === 0 && x.t === 'vil'); const q = G.R.w2s(u.x, u.y); return [q[0], q[1] - 12]; }); await page.mouse.click(p[0], p[1]); }
      if (await pressFor('Casă')) { const sp = await freeSpot('casa'); if (sp) { await page.mouse.move(sp.p[0], sp.p[1]); await page.mouse.click(sp.p[0], sp.p[1]); built.casa = (built.casa || 0) + 1; } }
      await page.keyboard.press('Escape');
    }
    // 3. cazarma după minutul 3
    if (st.t > 180 && !st.caz && !built.cazarma && st.w >= 175) {
      await page.keyboard.press('.'); await page.waitForTimeout(50);
      if (await pressFor('Cazarmă')) { const sp = await freeSpot('cazarma'); if (sp) { await page.mouse.click(sp.p[0], sp.p[1]); built.cazarma = 1; } }
      await page.keyboard.press('Escape');
    }
    // 4. țărani din cetate și oșteni din cazarmă, cu tastele
    await page.keyboard.press('h'); await page.waitForTimeout(60);
    if (st.vil < 22 && st.f >= 60 && await pressFor('Țăran')) trained++;
    if (st.age === 0 && st.f >= 520 && st.vil >= 14) { if (await pressFor('Epoca Feudală')) log.push('feudală cerută la ' + (st.t / 60).toFixed(1)); }
    if (st.caz) { const cid = await ev(() => { const b = G.C.blds.find(x => x.o === 0 && x.t === 'cazarma' && x.built); G.R.center(b.x, b.y); return b.id; }); const p = await scr(cid); await page.mouse.click(p[0], p[1]); if (st.f >= 120 && st.g >= 40) await pressFor('Oștean'); }
    // 5. dușmani aproape: pătrat peste oaste și clic dreapta pe dușman
    const enemy = await ev(() => { const tc = G.C.blds.find(b => b.o === 0 && b.t === 'cetate'); const e = tc && G.C.units.find(u => u.o === 1 && G.visible(u.x, u.y) && Math.hypot(u.x - tc.x, u.y - tc.y) < 16); return e ? e.id : 0; });
    if (enemy) {
      await center(enemy);
      await page.keyboard.press('Escape');
      const ids = await ev(() => G.C.units.filter(u => u.o === 0 && u.t !== 'vil').map(u => u.id));
      if (ids.length) { await ev(a => G.UI.select(a.map(G.getE)), ids); const p = await scr(enemy); if (p) { await page.mouse.click(p[0], p[1], { button: 'right' }); log.push('atac la ' + (st.t / 60).toFixed(1)); } }
    }
    await ff(20);
  }
  const fin = await ev(() => { const P = G.S.players[0]; return { min: (G.S.t / 60).toFixed(1), vil: G.C.units.filter(u => u.o === 0 && u.t === 'vil').length, oaste: G.C.units.filter(u => u.o === 0 && u.t !== 'vil').length, case: G.C.blds.filter(b => b.o === 0 && b.t === 'casa').length, epoca: P.age, strans: Math.round(P.st.gath.f + P.st.gath.w + P.st.gath.g + P.st.gath.s), pierduti: P.st.lost, ucisi: P.st.killed, liberi: G.C.units.filter(u => u.o === 0 && u.t === 'vil' && !u.task).length }; });
  console.log('rezultat', JSON.stringify(fin), 'comenzi', ordered, 'antrenări', trained, JSON.stringify(built));
  console.log(log.join(' · '));
  console.log('de ce stau:', JSON.stringify(await ev(() => { const c = {}; G.C.units.filter(u => u.o === 0 && u.t === 'vil' && !u.task).forEach(u => { const k = u.why || '(n-a primit treabă)'; c[k] = (c[k] || 0) + 1; }); return c; })));
  await page.screenshot({ path: '/tmp/scm-test/desk-play.png' });
  console.log(errors.length ? 'ERORI: ' + [...new Set(errors)].join(' || ') : 'fără erori');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
