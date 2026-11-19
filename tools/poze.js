// Picturile (tools/poze_src/*.png) devin WebP în assets/poze/, plus js/poze.js (lista lor, ca jocul să nu ceară ce lipsește).
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const SRC = path.join(__dirname, 'poze_src'), OUT = path.join(__dirname, '..', 'assets', 'poze');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const p = await b.newPage(), keys = [];
  let tot = 0;
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.png')).sort()) {
    const k = f.slice(0, -4), src = 'data:image/png;base64,' + fs.readFileSync(path.join(SRC, f)).toString('base64');
    const url = await p.evaluate(async (src) => {
      const im = new Image(); im.src = src; await im.decode();
      const s = Math.min(1, 1440 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', 0.8);
    }, src);
    const buf = Buffer.from(url.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, k + '.webp'), buf); tot += buf.length; keys.push(k);
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'poze.js'), '// Generat de tools/poze.js: picturile din assets/poze/\nvar G = globalThis.G || (globalThis.G = {});\nG.POZE = ' + JSON.stringify(Object.fromEntries(keys.map(k => [k, 1]))) + ';\n');
  console.log(keys.length, 'picturi,', (tot / 1048576).toFixed(1), 'MB');
})();
