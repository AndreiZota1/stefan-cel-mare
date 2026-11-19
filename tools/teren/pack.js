// Împachetează texturile terenului în js/tex-teren.js (WebP în base64, ca să meargă și din file://, unde WebGL refuză imaginile de pe disc).
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const NAMES = ['grassA', 'grassB', 'grassK', 'grassY', 'worn', 'dirt', 'sand', 'rock', 'gravel', 'forest', 'forestK', 'mud', 'snow', 'snowR', 'bed', 'rockG'];
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const p = await b.newPage();
  const out = { names: NAMES, d: [], n: [] };
  let tot = 0;
  for (const nm of NAMES) {
    for (const [k, q] of [['d', 0.8], ['n', 0.86]]) {
      const src = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'out', `${nm}_${k}.jpg`)).toString('base64');
      const url = await p.evaluate(async ([src, q]) => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/webp', q);
      }, [src, q]);
      out[k].push(url); tot += url.length;
    }
  }
  await b.close();
  const js = '// Texturile terenului (CC0: ambientCG, Poly Haven), generat de tools/teren/pack.js\nvar G = globalThis.G || (globalThis.G = {});\nG.TEXT = ' + JSON.stringify(out) + ';\n';
  fs.writeFileSync(path.join(__dirname, '../../js/tex-teren.js'), js);
  console.log('scris', (js.length / 1024).toFixed(0), 'KB');
})();
