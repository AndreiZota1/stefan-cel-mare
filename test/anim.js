// Fâșii de animație: pentru fiecare cheie, toate acțiunile (rânduri) și cadrele (coloane), într-o direcție
// node test/anim.js u/vil_mol,u/kni3_pol out.png [direcția 0-4] [scara]
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const ROOT = path.join(__dirname, '..');
const [keys, outFile, dirArg, scArg] = process.argv.slice(2);
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/baked.json'), 'utf8'));
  const list = keys.split(',').map(k => ({ k, m: meta[k] })).filter(x => x.m);
  const html = `<body style="margin:0"><canvas id=c></canvas><script>
  const L=${JSON.stringify(list)}, D=${+(dirArg || 1)}, S=${+(scArg || 2)};
  const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;});
  (async()=>{ let H=0,Wm=0; for(const x of L){ x.img=await load('file://${ROOT}/assets/'+x.k+'.webp'); x.mask=x.m.mask?await load('file://${ROOT}/assets/'+x.k+'_m.webp'):null; const A=Object.values(x.m.actions); H+=A.length*x.m.H*S/x.m.k+16; Wm=Math.max(Wm,Math.max(...A.map(a=>a.frames))*x.m.W*S/x.m.k+90); }
    const cv=document.getElementById('c'); cv.width=Wm; cv.height=H; const g=cv.getContext('2d'); g.fillStyle='#7d9656'; g.fillRect(0,0,Wm,H); g.font='11px sans-serif'; let y=0;
    for(const x of L){ const m=x.m; for(const [an,A] of Object.entries(m.actions)){ g.fillStyle='#fff'; g.fillText(x.k.split('/')[1]+' '+an,2,y+14);
      for(let f=0;f<A.frames;f++){ const sx=f*m.W, sy=(A.row+D)*m.H, t=document.createElement('canvas'); t.width=m.W;t.height=m.H; const tg=t.getContext('2d'); tg.drawImage(x.img,sx,sy,m.W,m.H,0,0,m.W,m.H);
        if(x.mask){ const q=document.createElement('canvas'); q.width=m.W;q.height=m.H; const qg=q.getContext('2d'); qg.drawImage(x.mask,sx,sy,m.W,m.H,0,0,m.W,m.H); qg.globalCompositeOperation='source-in'; qg.fillStyle='#d23b2e'; qg.fillRect(0,0,m.W,m.H); qg.globalCompositeOperation='multiply'; qg.drawImage(x.img,sx,sy,m.W,m.H,0,0,m.W,m.H); qg.globalCompositeOperation='destination-in'; qg.drawImage(x.mask,sx,sy,m.W,m.H,0,0,m.W,m.H); tg.drawImage(q,0,0); }
        g.drawImage(t,90+f*m.W*S/m.k,y,m.W*S/m.k,m.H*S/m.k); }
      y+=m.H*S/m.k; } y+=16; }
    document.title='ok'; })();<\/script></body>`;
  fs.writeFileSync('/tmp/scm/anim.html', html);
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); await p.goto('file:///tmp/scm/anim.html'); await p.waitForFunction(() => document.title === 'ok');
  await (await p.$('#c')).screenshot({ path: outFile }); await b.close(); console.log('scris', outFile);
})();
