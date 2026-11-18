// Randează sprite-urile din modelele 3D (tools/baker) și le scrie în assets/.
// node tools/bake.js [unitati...]   ex: node tools/bake.js vil_mol mil_oto
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const ROOT = __dirname, OUT = path.join(ROOT, '..', 'assets'), K = 1.5;
const TYPES = { mol: ['vil', 'mil', 'spr', 'arc', 'lcv', 'kni', 'hero', 'ram'], oto: ['vil', 'mil', 'spr', 'arc', 'lcv', 'kni', 'hero', 'can'] };
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('EROARE pagină:', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[pagină]', m.text()); });
  await page.route('http://bake.local/**', route => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = p.startsWith('/node_modules/') || p.startsWith('/tex/') ? path.join(ROOT, p) : path.join(ROOT, 'baker', p);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'lipsă' });
    route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' } });
  });
  await page.goto('http://bake.local/index.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const metaFile = path.join(OUT, 'sprites.json');
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
  for (const civ of ['mol', 'oto']) for (const t of TYPES[civ]) {
    const key = t + '_' + civ;
    if (only.length && !only.includes(key) && !only.includes('unitati')) continue;
    const t0 = Date.now();
    const r = await page.evaluate(([t, c, k]) => window.bakeUnit(t, c, k), [t, civ, K]);
    fs.writeFileSync(path.join(OUT, 'u_' + key + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
    meta[key] = r.meta;
    const ic = await page.evaluate(([t, c]) => window.bakeIcon(t, c), [t, civ]);
    fs.writeFileSync(path.join(OUT, 'i_' + key + '.png'), Buffer.from(ic.png.split(',')[1], 'base64'));
    meta['i_' + key] = { W: 96, H: 96 };
    console.log(key, (Date.now() - t0) + ' ms', r.meta.W + 'x' + r.meta.H);
  }
  const BLDS = ['cetate', 'casa', 'joagar', 'mina', 'moara', 'ogor', 'cazarma', 'poligon', 'grajd', 'fierarie', 'turn', 'manastire'];
  for (const civ of ['mol', 'oto']) for (const t of BLDS) {
    const key = 'b_' + t + '_' + civ;
    if (only.length && !only.includes(key) && !only.includes('cladiri')) continue;
    const t0 = Date.now();
    const r = await page.evaluate(([t, c]) => window.bakeBuilding(t, c, 2), [t, civ]);
    fs.writeFileSync(path.join(OUT, key + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
    meta[key] = r.meta;
    const ic = await page.evaluate(([t, c]) => window.bakeBldIcon(t, c), [t, civ]);
    fs.writeFileSync(path.join(OUT, 'j_' + t + '_' + civ + '.png'), Buffer.from(ic.png.split(',')[1], 'base64'));
    meta['j_' + t + '_' + civ] = { W: 96, H: 96 };
    console.log(key, (Date.now() - t0) + ' ms', r.meta.W + 'x' + r.meta.H);
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  fs.writeFileSync(path.join(OUT, 'sprites.js'), '// Generat de tools/bake.js\nvar G = globalThis.G || (globalThis.G = {});\nG.BAKED = ' + JSON.stringify(meta) + ';\n');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
