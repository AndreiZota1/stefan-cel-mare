// Randează sprite-urile v2 din modelele 3D (tools/baker) în assets/<grupă>/<cheie>.webp (+ _m.webp, masca de culoare).
// node tools/bake2.js [--civ mol,val] [--grp u,b,i,j] [--only mil1,casa] [--k 1.5]
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const ROOT = __dirname, OUT = path.join(ROOT, '..', 'assets');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const CIVS = arg('civ', 'mol,val,ung,pol,oto,tat').split(','), GRP = arg('grp', 'u,b,i,j').split(','), ONLY = arg('only', '') ? arg('only').split(',') : null;
const KU = +arg('k', 1.5), KB = +arg('kb', 2);
const UNIQ = { mol: 'raz', val: 'vit', ung: 'hus', pol: 'cpl', oto: 'ien', tat: 'nog' };
const unitsOf = c => ['vil', 'vilf', 'mon', 'hero', 'mil1', 'mil2', 'mil3', 'mil4', 'mil5', 'spr1', 'spr2', 'spr3', 'skr1', 'skr2', 'arc1', 'arc2', 'arc3'].concat(c === 'tat' ? [] : ['gun1', 'gun2'], ['lcv1', 'lcv2', 'lcv3', 'kni1', 'kni2', 'kni3', 'har1', 'har2', UNIQ[c] + '1', UNIQ[c] + '2', 'car', 'pesc', 'gal1', 'gal2', 'foc', 'tra']);
const SIEGE = ['ram1', 'ram2', 'cat1', 'cat2', 'can1', 'can2', 'treb', 'car'];
const BLDS = ['port', 'cetate', 'casa', 'joagar', 'mina', 'moara', 'ogor', 'cazarma', 'poligon', 'grajd', 'fierarie', 'targ', 'turn1', 'turn2', 'manastire', 'universitate', 'atelier', 'fortareata', 'minune'];
const TIER_R = ['cetate', 'casa', 'joagar', 'mina', 'moara', 'cazarma', 'port'];
const TIER_G = ['cetate', 'casa', 'joagar', 'mina', 'moara', 'cazarma', 'port', 'poligon', 'grajd', 'fierarie', 'targ', 'manastire', 'universitate', 'atelier', 'fortareata'];
const WALLS = ['zid_x', 'zid_y', 'zid_p', 'poarta_x', 'poarta_y'];
const SHARED = ['pal_x', 'pal_y', 'pal_p', 'ppal_x', 'ppal_y', 'zid_x', 'zid_y', 'zid_p', 'poarta_x', 'poarta_y', 'ruina2', 'ruina3', 'ruina4', 'ruina5', 'schela2', 'schela3', 'schela4', 'schela5'];
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const save = (rel, dataUrl) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('EROARE pagină:', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[pagină]', m.text()); });
  await page.route('http://bake.local/**', route => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = p.startsWith('/node_modules/') || p.startsWith('/tex/') ? path.join(ROOT, p) : path.join(ROOT, 'baker', p);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'lipsă' });
    route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' } });
  });
  await page.goto('http://bake.local/index2.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const metaFile = path.join(OUT, 'baked.json');
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
  const want = k => !ONLY || ONLY.includes(k);
  const jobs = [];
  for (const c of CIVS) {
    for (const v of unitsOf(c)) if (want(v)) { if (GRP.includes('u')) jobs.push(['u', v, c]); if (GRP.includes('i')) jobs.push(['i', v, c]); }
    for (const t of BLDS) if (want(t)) { if (GRP.includes('b')) jobs.push(['b', t, c]); if (GRP.includes('j')) jobs.push(['j', t, c]); }
    // clădirile pe epoci: _r (Epoca Întunecată: lemn, lut, stuf), _g (Imperială și Renașterea: piatră, ornamente, aur)
    if (GRP.includes('b')) for (const [suf, tier, list] of [['r', 0, TIER_R], ['g', 2, TIER_G]]) for (const t of list) if (want(t) || want(t + '_' + suf)) jobs.push(['b', t, c, tier, suf]);
    for (const t of WALLS) if (want(t)) { if (GRP.includes('b')) jobs.push(['b', t, c]); if (GRP.includes('j') && /_p$|poarta_x/.test(t)) jobs.push(['j', t, c]); }
  }
  if (CIVS.includes('mol')) {
    for (const v of ['deer', 'boar', 'wolf']) if (want(v) && GRP.includes('u')) jobs.push(['u', v, 'all']);
    for (const v of SIEGE) if (want(v)) { if (GRP.includes('u')) jobs.push(['u', v, 'all']); if (GRP.includes('i')) jobs.push(['i', v, 'all']); }
    for (const t of SHARED) if (want(t)) { if (GRP.includes('b')) jobs.push(['b', t, 'all']); if (GRP.includes('j') && !/^(ruina|schela)/.test(t)) jobs.push(['j', t, 'all']); }
  }
  let bytes = 0; const T0 = Date.now();
  for (const [grp, t, c, tier, suf] of jobs) {
    const key = grp + '/' + t + '_' + c + (suf ? '_' + suf : ''), civ = c, t0 = Date.now();
    const fn = { u: 'bakeUnit', i: 'bakeUnitIcon', b: 'bakeBld', j: 'bakeBldIcon' }[grp];
    let r;
    try { r = await page.evaluate(([fn, t, c, k, tier]) => window[fn](t, c, k, tier), [fn, t, civ, grp === 'u' ? KU : KB, tier === undefined ? 1 : tier]); }
    catch (e) { console.log('EȘUAT', key, e.message.split('\n')[0]); continue; }
    save(key + '.webp', r.webp); bytes += r.webp.length * 0.75;
    if (r.mask) { save(key + '_m.webp', r.mask); bytes += r.mask.length * 0.75; }
    if (r.lit) { save(key + '_l.webp', r.lit); bytes += r.lit.length * 0.75; }
    if (r.snow) { save(key + '_s.webp', r.snow); bytes += r.snow.length * 0.75; }
    meta[key] = r.meta;
    console.log(key, (Date.now() - t0) + ' ms', r.meta.W + 'x' + r.meta.H, r.mask ? 'mască' : '');
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  fs.writeFileSync(path.join(OUT, 'baked.js'), '// Generat de tools/bake2.js\nvar G = globalThis.G || (globalThis.G = {});\nG.BAKED2 = ' + JSON.stringify(meta) + ';\n');
  console.log('gata:', jobs.length, 'imagini,', (bytes / 1048576).toFixed(1), 'MB,', ((Date.now() - T0) / 1000).toFixed(0), 's');
  await browser.close();
})().catch(e => { console.error('EȘUAT', e); process.exit(1); });
