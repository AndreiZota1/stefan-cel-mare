// Planșă de comparație: rânduri = chei, coloane = civilizații; nuanțează masca cu culorile jucătorilor.
// node test/contact.js <grupă u|b|i|j> <chei separate prin virgulă> <ieșire.png> [civ-uri] [scara] [acțiune:cadru]
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'safeads-prospect-audit/node_modules/playwright-core'));
const ROOT = path.join(__dirname, '..');
const [grp, keys, outFile, civsArg, scaleArg, actArg] = process.argv.slice(2);
const civs = (civsArg || 'mol,val,ung,pol,oto,tat').split(','), scale = +(scaleArg || 1);
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/baked.json'), 'utf8'));
  const cols = ['#2f6fd6', '#d23b2e', '#3fa34d', '#e3c13a', '#2f6fd6', '#d23b2e'];
  const cells = [];
  keys.split(',').forEach(k => civs.forEach((c, ci) => { const key = grp + '/' + k + '_' + (meta[grp + '/' + k + '_' + c] ? c : 'all'); if (meta[key]) cells.push({ key, m: meta[key], col: cols[ci], row: k, ci }); }));
  const html = `<body style="margin:0;background:#6f8a4a"><canvas id=c></canvas><script>
  const cells=${JSON.stringify(cells)}, civs=${JSON.stringify(civs)}, S=${scale}, act=${JSON.stringify(actArg || '')};
  const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=s;});
  (async()=>{
    for (const c of cells){ c.img=await load('file://${ROOT}/assets/'+c.key+'.webp'); c.mask=c.m.mask?await load('file://${ROOT}/assets/'+c.key+'_m.webp'):null; }
    const rows=[...new Set(cells.map(c=>c.row))];
    const fw=(c)=>c.m.actions?c.m.W:c.m.W, fh=(c)=>c.m.actions?c.m.H:c.m.H;
    const colW=civs.map((_,i)=>Math.max(60,...cells.filter(c=>c.ci===i).map(c=>fw(c)*S/ (c.m.k||1)))+16);
    const rowH=rows.map(r=>Math.max(...cells.filter(c=>c.row===r).map(c=>fh(c)*S/(c.m.k||1)))+18);
    const cv=document.getElementById('c'); cv.width=colW.reduce((a,b)=>a+b,0)+70; cv.height=rowH.reduce((a,b)=>a+b,0)+20;
    const g=cv.getContext('2d'); g.fillStyle='#7d9656'; g.fillRect(0,0,cv.width,cv.height); g.font='11px sans-serif';
    civs.forEach((cv2,i)=>{g.fillStyle='#fff';g.fillText(cv2,70+colW.slice(0,i).reduce((a,b)=>a+b,0)+4,12);});
    cells.forEach(c=>{ if(!c.img) return;
      const ri=rows.indexOf(c.row), x=70+colW.slice(0,c.ci).reduce((a,b)=>a+b,0)+8, y=20+rowH.slice(0,ri).reduce((a,b)=>a+b,0);
      if(c.ci===0){g.fillStyle='#fff';g.fillText(c.row,4,y+14);}
      let sx=0,sy=0,w=c.m.W,h=c.m.H;
      if(c.m.actions){ const [an,fr]=(act||'idle:0').split(':'); const A=c.m.actions[an]||c.m.actions.idle; sx=Math.min(+fr||0,A.frames-1)*w; sy=(A.row+1)*h; }
      const t=document.createElement('canvas'); t.width=w; t.height=h; const tg=t.getContext('2d');
      tg.drawImage(c.img,sx,sy,w,h,0,0,w,h);
      if(c.mask){ const m=document.createElement('canvas'); m.width=w;m.height=h; const mg=m.getContext('2d'); mg.drawImage(c.mask,sx,sy,w,h,0,0,w,h); mg.globalCompositeOperation='source-in'; mg.fillStyle=c.col; mg.fillRect(0,0,w,h); mg.globalCompositeOperation='multiply'; mg.drawImage(c.img,sx,sy,w,h,0,0,w,h); mg.globalCompositeOperation='destination-in'; mg.drawImage(c.mask,sx,sy,w,h,0,0,w,h); tg.drawImage(m,0,0); }
      const k=c.m.k||1; g.drawImage(t,x,y,w*S/k,h*S/k);
    });
    document.title='ok';
  })();<\/script></body>`;
  fs.writeFileSync('/tmp/scm/contact.html', html);
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto('file:///tmp/scm/contact.html'); await p.waitForFunction(() => document.title === 'ok', null, { timeout: 60000 });
  const el = await p.$('#c'); await el.screenshot({ path: outFile }); await b.close(); console.log('scris', outFile);
})();
