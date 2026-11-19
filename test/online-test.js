// Jocul online, de la cap la coadă, pe baza de date adevărată: două browsere separate (doi jucători anonimi),
// unul creează camera, celălalt intră cu linkul, gazda pornește, amândoi dau comenzi. Verifică:
// amprentele identice la fiecare 10 s, timpul jocului ține pasul cu ceasul, reluarea după o pagină reîncărcată,
// plecarea din joc (calculatorul preia oamenii). La final camera se șterge.
//    node test/online-test.js [secunde]
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const ROOT = path.join(__dirname, '..'), SECS = +process.argv[2] || 60;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.m4a': 'audio/mp4', '.json': 'application/json', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); } });
}).listen(8765);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(page, fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return true; await sleep(250); } throw new Error('n-a apărut: ' + what); }
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const pages = [], errs = [];
  for (const who of ['gazda', 'oaspete']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(who + ' ' + r.status() + ' ' + r.url().replace(/auth=[^&]+/, 'auth=…').slice(0, 140)); }); p.on('console', m => { if (m.type() === 'error') errs.push(who + ' console: ' + m.text()); });
    pages.push(p);
  }
  const [A, B] = pages;
  let code = '';
  try {
    await A.goto('http://localhost:8765/'); await sleep(1500);
    await A.evaluate(() => { G.Net.setName('Andrei'); G.Online.open(); });
    await A.click('#nCreate'); await until(A, () => G.Net.data && G.Net.data.host === G.Net.uid, 15000, 'camera');
    code = await A.evaluate(() => G.Net.code); console.log('camera', code);
    await B.goto('http://localhost:8765/?cam=' + code); await sleep(1500);
    await B.fill('#nName', 'Mihai'); await B.click('#nJoin');
    await until(A, () => G.Net.seatsOf().length === 2, 15000, 'al doilea jucător');
    await B.selectOption('#nCiv', 'val'); await sleep(800);
    await A.click('#nAddAi'); await until(A, () => G.Net.seatsOf().length === 3, 10000, 'calculatorul'); await sleep(500);
    await A.selectOption('#nSize', '72'); await sleep(800);
    console.log('sala:', await A.evaluate(() => G.Net.seatsOf().map(s => s.name + ' ' + s.civ).join(' | ')));
    await A.click('#nStart');
    await until(A, () => G.Net.on && G.running, 20000, 'pornirea la gazdă'); await until(B, () => G.Net.on && G.running, 20000, 'pornirea la oaspete');
    console.log('pornit:', await A.evaluate(() => 'gazda e jucătorul ' + G.me), '/', await B.evaluate(() => 'oaspetele e jucătorul ' + G.me));
    // comenzi de la amândoi: țăranii la hrană și la lemne, cetatea face țărani
    const play = () => {
      const me = G.me, vils = G.C.units.filter(u => u.o === me && u.t === 'vil' && !u.task), tc = G.C.blds.find(b => b.o === me && b.t === 'cetate');
      const food = G.C.units.concat(G.S.ents).find(e => e.k === 'r' && (e.t === 'sheep' || e.t === 'berry') && G.hyp(e.x - tc.x, e.y - tc.y) < 12);
      const wood = G.S.ents.find(e => e.k === 'r' && e.t === 'tree' && G.hyp(e.x - tc.x, e.y - tc.y) < 14);
      if (vils.length && food) G.cmdGather(vils.slice(0, 2), food);
      if (vils.length > 2 && wood) G.cmdGather(vils.slice(2), wood);
      if (tc && (!tc.q || tc.q.length < 2)) G.cmdTrain(tc, 'vil');
      return G.S.t;
    };
    const t0 = Date.now(), g0 = await A.evaluate(() => G.S.t);
    let reloaded = false;
    while (Date.now() - t0 < SECS * 1000) {
      await A.evaluate(play); await B.evaluate(play).catch(() => {});
      if (!reloaded && Date.now() - t0 > SECS * 500) {
        reloaded = true; console.log('oaspetele reîncarcă pagina…');
        await B.reload(); await until(B, () => G.Net && G.Net.on && G.running && !G.Net.catching, 60000, 'reluarea după reîncărcare');
        console.log('reluat la minutul', await B.evaluate(() => (G.S.t / 60).toFixed(1)));
      }
      await sleep(3000);
    }
    const real = (Date.now() - t0) / 1000, g1 = await A.evaluate(() => G.S.t);
    console.log(`timpul jocului: ${(g1 - g0).toFixed(0)} s în ${real.toFixed(0)} s reale`);
    const ha = await A.evaluate(() => G.Net.hashes || {}), hb = await B.evaluate(() => G.Net.hashes || {});
    const common = Object.keys(ha).filter(k => hb[k]), same = common.filter(k => ha[k] === hb[k]);
    console.log(`amprente comune: ${common.length}, identice: ${same.length}`, common.length && same.length === common.length ? '✓' : '✗');
    console.log('desincronizare:', await A.evaluate(() => G.Net.desync) || 'nu');
    const pop = await A.evaluate(() => G.S.players.map(P => P.civ + ' ' + G.C.units.filter(u => u.o === P.id).length + ' oameni').join(' | '));
    console.log('populație (la gazdă):', pop);
    // oaspetele pleacă: calculatorul îi preia oamenii, gazda nu mai așteaptă
    await B.evaluate(() => G.toMenu()); await sleep(4000);
    const after = await A.evaluate(() => ({ ai: G.S.players[1].ai, t: G.S.t }));
    console.log('calculatorul (locul 3) are', await A.evaluate(() => G.C.units.filter(u => u.o === 2).length), 'oameni și', await A.evaluate(() => G.C.blds.filter(b => b.o === 2).length), 'clădiri');
    await sleep(3000);
    const after2 = await A.evaluate(() => G.S.t);
    console.log('după plecarea oaspetelui: calculatorul îi joacă partea:', after.ai, '| jocul merge mai departe:', (after2 - after.t).toFixed(1), 's în 3 s');
  } catch (e) { console.log('EȘEC:', e.message); }
  finally {
    if (code) await A.evaluate(c => G.Net.req('DELETE', 'rooms/' + c), code).catch(() => {});
    console.log(errs.length ? 'ERORI:\n  ' + [...new Set(errs)].slice(0, 8).join('\n  ') : 'fără erori');
    await browser.close(); srv.close();
  }
})();
