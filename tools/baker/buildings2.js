// Clădirile v2: fiecare din cele 6 civilizații cu materialele, acoperișurile, turnurile și obiceiurile ei.
// Moldova: var alb, șindrilă abruptă, turnuri cu hurdă. Țara Românească: benzi de cărămidă și piatră, țiglă, arcade.
// Ungaria: case săsești cu bârne, țiglă roșie, coifuri gotice. Polonia: cărămidă roșie, frontoane în trepte, turle de cupru.
// Otomani: piatră cioplită, cupole de plumb, minarete. Tătari: iurte, corturi, streșini pictate, chiparoși.
import {
  THREE, TM, PM, cloth, team, V, mesh, at, box, blk, cyl, cone, dome, lathe, sph, polys, hipRoof, gableRoof, stepGable, win, door, flag, banner,
  crenels, ringCrenels, logPile, ground, timberFace, banded, posts, minaret, finial, yurt, tentStriped, carpet, tug, cypress, barrel, crate, hay,
  fencePosts, wattle, paintedMat, glazedMat, paintedEave, kit, kwalls, kroof, kwin, ktower
} from './bkit.js';

export const NB = { port: 3, cetate: 4, casa: 2, joagar: 2, mina: 2, moara: 2, ogor: 3, cazarma: 3, poligon: 3, grajd: 3, fierarie: 3, targ: 3, turn1: 2, turn2: 2, manastire: 3, universitate: 3, atelier: 3, fortareata: 4, minune: 5 };

// ---------- piese compuse ----------
function winsAlong(g, K, face, a, b, fixed, y0, skip, gap = 0.42, ww = 0.16, wh = 0.17) {
  const n = Math.max(1, Math.floor((b - a) / gap));
  for (let i = 0; i < n; i++) { const c = a + (b - a) * (i + 0.5) / n; if (skip != null && Math.abs(c - skip) < 0.2) continue; kwin(g, K, face, c - ww / 2, c + ww / 2, fixed, y0, y0 + wh); }
}
// o hală simplă în stilul civilizației: ziduri, ușă, ferestre, acoperiș; întoarce înălțimea coamei
function hall(g, K, x0, z0, x1, z1, h, o = {}) {
  kwalls(g, K, x0, z0, x1, z1, 0, h, o);
  const df = o.doorFace || 'z', dc = o.dc !== undefined ? o.dc : (df === 'z' ? (x0 + x1) / 2 : (z0 + z1) / 2), dw = o.dw || 0.22;
  if (o.door !== false) door(g, df, dc - dw / 2, dc + dw / 2, df === 'z' ? z1 : x1, Math.min(h * 0.78, o.dh || 0.36), { style: K.winStyle === 'rect' ? 'rect' : 'arch', col: o.doorCol || '#3a2414' });
  if (o.wins !== false) { const wy = o.wy || Math.max(0.16, h * 0.42); winsAlong(g, K, 'z', x0, x1, z1, wy, df === 'z' ? dc : null); winsAlong(g, K, 'x', z0, z1, x1, wy, df === 'x' ? dc : null); }
  return h + (o.noRoof ? 0 : kroof(g, K, x0, z0, x1, z1, h, o.roof || {}));
}
// arcadă (loggie) pe fața +z sau +x: coloane, arce, brâu deasupra
function arcade(g, face, a, b, fixed, h, n, M, colM) {
  const w = (b - a) / n, r = w / 2 - 0.02, ch = h - r;
  for (let i = 0; i <= n; i++) { const c = a + i * w, col = cyl(0.026, 0.03, ch, colM || M, 10, 2); if (face === 'z') at(col, c, ch / 2, fixed); else at(col, fixed, ch / 2, c); g.add(col); }
  for (let i = 0; i < n; i++) { const c = a + (i + 0.5) * w, ar = mesh(new THREE.TorusGeometry(r, 0.024, 5, 12, Math.PI), M); if (face === 'z') at(ar, c, ch, fixed); else at(ar, fixed, ch, c, 0, Math.PI / 2, 0); g.add(ar); }
  g.add(face === 'z' ? at(box(b - a + 0.06, 0.07, 0.07, M, 2), (a + b) / 2, h + 0.03, fixed) : at(box(0.07, 0.07, b - a + 0.06, M, 2), fixed, h + 0.03, (a + b) / 2));
}
// cupolă pe tambur, cu semilună sau cruce
function domeOn(g, x, z, y, r, M, o = {}) {
  const dh = o.drum !== undefined ? o.drum : r * 0.35;
  if (dh > 0) { g.add(at(cyl(r * 1.02, r * 1.06, dh, o.drumM || PM('#f2ead8', 0.9), o.seg || 16, 2), x, y + dh / 2, z)); if (o.wins) for (let i = 0; i < o.wins; i++) { const a = i / o.wins * Math.PI * 2; g.add(at(box(0.012, dh * 0.55, r * 0.22, PM('#1e1a18', 0.9)), x + Math.cos(a) * r * 1.03, y + dh * 0.5, z + Math.sin(a) * r * 1.03, 0, -a, 0)); } }
  const d = dome(r, M, 24, o.sy || 1); at(d, x, y + dh, z); g.add(d);
  if (o.fin !== false) finial(g, x, y + dh + r * (o.sy || 1), z, o.fin || 'crescent', o.fs || 1);
  return y + dh + r * (o.sy || 1);
}
// coif bulbos (biserici românești, turnuri baroce)
function helmet(g, x, y, z, r, M, fin = 'cross') {
  const h = lathe([[r, 0], [r * 1.08, r * 0.35], [r * 0.85, r * 0.8], [r * 0.32, r * 1.12], [r * 0.12, r * 1.32], [r * 0.16, r * 1.42], [0.001, r * 1.62]], M, 18); at(h, x, y, z); g.add(h);
  finial(g, x, y + r * 1.6, z, fin, 1.1);
  return y + r * 1.62;
}
// tambur răsucit (Curtea de Argeș)
function twisted(g, x, z, y, r, h, M) {
  const geo = new THREE.CylinderGeometry(r, r, h, 32, 10, false), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), a = Math.atan2(pz, px), rr = Math.hypot(px, pz); if (rr < 1e-4) continue; const t = (py / h + 0.5) * 1.6, r2 = rr * (1 + 0.09 * Math.cos(8 * (a + t))); p.setXYZ(i, Math.cos(a) * r2, py, Math.sin(a) * r2); }
  geo.computeVertexNormals(); g.add(at(mesh(geo, M), x, y + h / 2, z));
  return y + h;
}
function chimney(g, K, x, z, y, h = 0.3, s = 0.11) {
  const M = K.civ === 'pol' || K.civ === 'val' ? K.brick : K.civ === 'oto' || K.civ === 'tat' ? K.wall : K.base;
  g.add(blk(x - s / 2, z - s / 2, x + s / 2, z + s / 2, y, h, M, 3));
  if (K.civ === 'oto' || K.civ === 'tat') g.add(at(cone(s * 0.85, s * 0.9, K.roof, 4), x, y + h + s * 0.4, z, 0, Math.PI / 4, 0));
  else g.add(blk(x - s / 2 - 0.015, z - s / 2 - 0.015, x + s / 2 + 0.015, z + s / 2 + 0.015, y + h, 0.03, M, 3));
  return [x, y + h + 0.05, z];
}
function anvil(g, x, z) {
  g.add(at(cyl(0.05, 0.06, 0.1, TM('medieval_wood', '#8a6a48'), 10, 3), x, 0.05, z));
  g.add(at(box(0.16, 0.05, 0.07, PM('#2e3034', 0.45, 0.85)), x, 0.125, z)); g.add(at(cone(0.035, 0.07, PM('#2e3034', 0.45, 0.85), 6), x + 0.11, 0.135, z, 0, 0, -Math.PI / 2));
}
let GLOWM = null;
function glow(w, h) { if (!GLOWM) { GLOWM = PM('#ff8a2a', 0.6, 0, '#ff6a10', 1.6).clone(); GLOWM.userData = { win: true }; } return mesh(new THREE.PlaneGeometry(w, h), GLOWM); }
function target(g, x, z) {
  const rings = new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x2 = c.getContext('2d'); [[32, '#e8dcc0'], [24, '#b8302a'], [16, '#e8dcc0'], [8, '#b8302a']].forEach(r => { x2.fillStyle = r[1]; x2.beginPath(); x2.arc(32, 32, r[0], 0, 6.3); x2.fill(); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), roughness: 0.95 });
  g.add(at(cyl(0.012, 0.012, 0.42, PM('#6e4b2a'), 6), x - 0.06, 0.21, z, 0, 0, 0.12)); g.add(at(cyl(0.012, 0.012, 0.42, PM('#6e4b2a'), 6), x + 0.06, 0.21, z, 0, 0, -0.12));
  const tg = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24), [PM('#c8a860', 0.95), rings, rings]); at(tg, x, 0.36, z + 0.03, Math.PI / 2 - 0.15, Math.PI / 4); g.add(tg);
}
function stall(g, K, x, z, w, d, rot = 0) {
  const s = new THREE.Group(); at(s, x, 0, z, 0, rot, 0); g.add(s);
  [[-w / 2, -d / 2, 0.36], [w / 2, -d / 2, 0.36], [-w / 2, d / 2, 0.3], [w / 2, d / 2, 0.3]].forEach(([px, pz, h]) => s.add(at(cyl(0.012, 0.012, h, K.timber, 6), px, h / 2, pz)));
  s.add(at(box(w, 0.04, d * 0.6, TM('raw_plank_wall', '#d0b090'), 3), 0, 0.16, d * 0.12));
  const n = 6; for (let i = 0; i < n; i++) { const st = polys([[V(-w / 2 - 0.03 + i * (w + 0.06) / n, 0.37, -d / 2 - 0.02), V(-w / 2 - 0.03 + (i + 1) * (w + 0.06) / n, 0.37, -d / 2 - 0.02), V(-w / 2 - 0.03 + (i + 1) * (w + 0.06) / n, 0.29, d / 2 + 0.06), V(-w / 2 - 0.03 + i * (w + 0.06) / n, 0.29, d / 2 + 0.06)]], i % 2 ? team('linen', 0.9) : cloth('#f0e6d0', 'linen', 0.95)); s.add(st); }
  const goods = [PM('#c8402a', 0.8), PM('#e0b040', 0.8), PM('#5a8a3a', 0.8), PM('#8a5a2a', 0.8)];
  for (let i = 0; i < 5; i++) s.add(at(sph(0.025, goods[i % 4], 8, 6), -w / 2 + 0.06 + i * (w - 0.12) / 4, 0.2, d * 0.15));
}
// cumpăna fântânii (Moldova, Țara Românească)
function shadoof(g, x, z) {
  g.add(blk(x - 0.07, z - 0.07, x + 0.07, z + 0.07, 0, 0.1, TM('raw_plank_wall', '#c8a888'), 3));
  g.add(at(cyl(0.016, 0.02, 0.62, PM('#5a3e22'), 6), x + 0.22, 0.31, z - 0.06));
  const sw = cyl(0.01, 0.012, 0.95, PM('#6e4b2a'), 6); at(sw, x + 0.12, 0.58, z - 0.06, 0, 0, -1.05); g.add(sw);
  g.add(at(cyl(0.003, 0.003, 0.3, PM('#3a2a1a'), 4), x - 0.27, 0.62, z - 0.06)); g.add(at(cyl(0.02, 0.016, 0.04, PM('#6a4a2a'), 8), x - 0.27, 0.46, z - 0.06));
}
function cauldron(g, x, z) {
  [0, 2.1, 4.2].forEach(a => { const l = cyl(0.008, 0.008, 0.3, PM('#2e3034', 0.5, 0.8), 5); at(l, x + Math.cos(a) * 0.07, 0.14, z + Math.sin(a) * 0.07, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); g.add(l); });
  const c = lathe([[0.001, 0], [0.06, 0.01], [0.085, 0.05], [0.09, 0.09], [0.095, 0.1]], PM('#b06a3a', 0.4, 0.8), 16); at(c, x, 0.1, z); g.add(c);
}
function shieldsOn(g, face, a, b, fixed, y, n, kind = 'round') {
  for (let i = 0; i < n; i++) {
    const c = a + (b - a) * (i + 0.5) / n;
    let s;
    if (kind === 'heater') { const sh = new THREE.Shape(); sh.moveTo(-0.06, 0.07); sh.lineTo(0.06, 0.07); sh.lineTo(0.06, 0); sh.quadraticCurveTo(0.05, -0.06, 0, -0.09); sh.quadraticCurveTo(-0.05, -0.06, -0.06, 0); sh.lineTo(-0.06, 0.07); s = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }), team('leather', 0.7)); }
    else if (kind === 'pavise') s = box(0.11, 0.24, 0.016, team('leather', 0.7));
    else { s = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.014, 18), team('leather', 0.7)); s.rotation.x = Math.PI / 2; const w = new THREE.Group(); w.add(s); w.add(at(sph(0.018, PM('#c8c8c8', 0.35, 0.8)), 0, 0, 0.012)); s = w; }
    if (face === 'z') at(s, c, y, fixed + 0.02); else at(s, fixed + 0.02, y, c, 0, Math.PI / 2, 0);
    if (kind === 'pavise') s.rotation.x = face === 'z' ? -0.12 : 0;
    g.add(s);
  }
}
function spearRack(g, x, z, n = 5, alongZ = true) {
  for (let i = 0; i < n; i++) { const px = alongZ ? x : x + i * 0.11, pz = alongZ ? z + i * 0.11 : z; g.add(at(cyl(0.007, 0.007, 0.66, PM('#6e4b2a'), 5), px, 0.33, pz)); g.add(at(cone(0.015, 0.06, PM('#c8ccd2', 0.35, 0.8), 6), px, 0.69, pz)); }
  const b = alongZ ? box(0.03, 0.03, n * 0.11, PM('#5a3e22')) : box(n * 0.11, 0.03, 0.03, PM('#5a3e22')); at(b, alongZ ? x : x + (n - 1) * 0.055, 0.42, alongZ ? z + (n - 1) * 0.055 : z); g.add(b);
}
function cart(g, x, z, rot = 0, load) {
  const c = new THREE.Group(); at(c, x, 0, z, 0, rot, 0); g.add(c);
  c.add(at(box(0.36, 0.05, 0.22, TM('raw_plank_wall', '#c8a888'), 3), 0, 0.14, 0)); c.add(at(box(0.36, 0.08, 0.012, TM('raw_plank_wall', '#c8a888'), 3), 0, 0.2, 0.11)); c.add(at(box(0.36, 0.08, 0.012, TM('raw_plank_wall', '#c8a888'), 3), 0, 0.2, -0.11));
  [0.12, -0.12].forEach(wz => { const w = mesh(new THREE.TorusGeometry(0.09, 0.012, 5, 14), PM('#5a3e22')); at(w, 0, 0.09, wz * 1.05); c.add(w); });
  c.add(at(box(0.3, 0.015, 0.015, PM('#5a3e22')), 0.3, 0.13, 0.05)); c.add(at(box(0.3, 0.015, 0.015, PM('#5a3e22')), 0.3, 0.13, -0.05));
  if (load === 'hay') { const h = dome(0.16, TM('reed_roof_04', '#f0d890', 1), 12, 0.6); h.scale.x = 1.25; at(h, 0, 0.17, 0); c.add(h); }
  else if (load) for (let i = 0; i < 4; i++) c.add(at(sph(0.05, cloth('#c8b48a', 'linen'), 8, 6), -0.1 + (i % 2) * 0.12, 0.2 + Math.floor(i / 2) * 0.05, (i % 2 - 0.5) * 0.08));
}
// steag pe acoperiș/turn: pozițiile de vârf ale clădirilor primesc culoarea jucătorului
function topFlag(g, x, y, z, h = 0.32, w = 0.2) { flag(g, x, y, z, h, w); }

// ---------- clădirile ----------
const B = {};
B.casa = (g, K) => {
  const c = K.civ;
  if (c === 'tat') {
    ground(g, 0.15, 0.15, 1.85, 1.85, 'dry_ground_01', '#e8d8b8');
    yurt(g, 0.95, 0.95, 0.6, { top: 'ball' });
    carpet(g, 1.55, 1.45, 0.3, 0.46, 0.7, 1);
    g.add(at(cyl(0.012, 0.014, 0.34, K.timber, 6), 1.75, 0.17, 0.55)); g.add(at(box(0.03, 0.03, 0.4, K.timber), 1.75, 0.3, 0.75)); g.add(at(cyl(0.012, 0.014, 0.34, K.timber, 6), 1.75, 0.17, 0.95));
    barrel(g, 1.62, 1.75, 0.9);
    return;
  }
  ground(g, 0.1, 0.1, 1.9, 1.9);
  if (c === 'mol') {
    kwalls(g, K, 0.38, 0.43, 1.62, 1.47, 0, 0.44);
    door(g, 'z', 0.6, 0.84, 1.47, 0.36); kwin(g, K, 'z', 1.1, 1.32, 1.47, 0.17, 0.33); kwin(g, K, 'x', 0.78, 0.98, 1.62, 0.17, 0.33);
    posts(g, [0.42, 0.98, 1.56], 1.7, 0.46, K.timber);
    g.add(blk(0.36, 1.47, 1.64, 1.76, 0, 0.045, K.planks, 2));
    g.add(at(box(0.4, 0.13, 0.012, team('wool')), 1.27, 0.19, 1.745));
    kroof(g, K, 0.38, 0.43, 1.62, 1.72, 0.46, { m: K.thatch, eave: 0.12 });
    wattle(g, [[1.9, 1.25], [1.9, 1.9], [1.45, 1.9]], 0.16);
  } else if (c === 'val') {
    kwalls(g, K, 0.4, 0.42, 1.6, 1.58, 0, 0.5);
    door(g, 'z', 0.6, 0.84, 1.58, 0.4, { style: 'arch', col: '#4a2a18' }); kwin(g, K, 'z', 1.12, 1.32, 1.58, 0.2, 0.4); kwin(g, K, 'x', 0.8, 1.0, 1.6, 0.2, 0.4); kwin(g, K, 'x', 1.2, 1.4, 1.6, 0.2, 0.4);
    banner(g, 'z', 0.95, 1.58, 0.46, 0.1, 0.2);
    kroof(g, K, 0.4, 0.42, 1.6, 1.58, 0.5);
    chimney(g, K, 0.7, 0.75, 0.6, 0.38);
    barrel(g, 1.75, 1.7); crate(g, 1.72, 1.45, 0.9, 0.4);
  } else if (c === 'ung') {
    kwalls(g, K, 0.45, 0.5, 1.6, 1.5, 0, 0.48);
    door(g, 'z', 0.62, 0.86, 1.5, 0.4, { style: 'arch', col: '#3a5a2a' }); kwin(g, K, 'z', 1.1, 1.28, 1.5, 0.2, 0.36, { style: 'rect' }); kwin(g, K, 'x', 0.7, 0.86, 1.6, 0.2, 0.36, { style: 'rect' }); kwin(g, K, 'x', 1.12, 1.28, 1.6, 0.2, 0.36, { style: 'rect' });
    kroof(g, K, 0.45, 0.5, 1.6, 1.5, 0.48, { alongX: true });
    kwin(g, K, 'x', 0.94, 1.06, 1.6, 0.62, 0.74, { style: 'rect' });
    fencePosts(g, [[1.85, 0.3], [1.85, 1.85], [1.0, 1.85]], 0.18);
  } else if (c === 'pol') {
    kwalls(g, K, 0.45, 0.48, 1.58, 1.52, 0, 0.5);
    door(g, 'z', 0.62, 0.84, 1.52, 0.4, { style: 'arch', col: '#3a2a1a' }); kwin(g, K, 'z', 1.08, 1.26, 1.52, 0.18, 0.4); kwin(g, K, 'x', 0.75, 0.92, 1.58, 0.18, 0.4); kwin(g, K, 'x', 1.1, 1.27, 1.58, 0.18, 0.4);
    kroof(g, K, 0.45, 0.48, 1.58, 1.52, 0.5, { alongX: true });
    kwin(g, K, 'x', 0.93, 1.07, 1.62, 0.64, 0.8);
    banner(g, 'z', 1.35, 1.52, 0.47, 0.09, 0.18);
  } else if (c === 'oto') {
    g.add(blk(0.42, 0.45, 1.58, 1.5, 0, 0.3, K.stone, 1.6));
    door(g, 'z', 0.6, 0.82, 1.5, 0.28, { style: 'arch', col: '#4a2e1a' }); kwin(g, K, 'x', 0.9, 1.06, 1.58, 0.1, 0.24);
    g.add(blk(0.42, 0.45, 1.58, 1.62, 0.3, 0.3, K.wall, 1.6));
    for (let i = 0; i < 4; i++) g.add(at(box(0.025, 0.12, 0.12, K.timber), 0.55 + i * 0.33, 0.25, 1.53, -0.6));
    [0.72, 1.05, 1.36].forEach(x => win(g, 'z', x - 0.07, x + 0.07, 1.62, 0.38, 0.54, { col: '#2a2420', frame: '#7a5a3a', bars: '#6a4a2a' }));
    win(g, 'x', 0.8, 0.96, 1.58, 0.38, 0.54, { col: '#2a2420', frame: '#7a5a3a', bars: '#6a4a2a' }); win(g, 'x', 1.2, 1.36, 1.58, 0.38, 0.54, { col: '#2a2420', frame: '#7a5a3a', bars: '#6a4a2a' });
    kroof(g, K, 0.42, 0.45, 1.58, 1.62, 0.6);
    chimney(g, K, 0.8, 0.75, 0.62, 0.28, 0.09);
    g.add(at(box(0.16, 0.2, 0.01, team('linen')), 1.24, 0.17, 1.505));
  }
};
B.joagar = (g, K) => {
  ground(g, 0.05, 0.05, 1.95, 1.95, 'forest_ground_04', '#d0b890');
  if (K.civ === 'tat') {
    [[0.5, 0.4, 0.55], [1.5, 0.4, 0.55], [0.5, 1.15, 0.32], [1.5, 1.15, 0.32]].forEach(([x, z, h]) => g.add(at(cyl(0.02, 0.02, h, K.timber, 6), x, h / 2, z)));
    g.add(polys([[V(0.4, 0.56, 0.32), V(1.6, 0.56, 0.32), V(1.6, 0.32, 1.22), V(0.4, 0.32, 1.22)]], cloth('#a88458', 'hide', 0.95)));
    tug(g, 1.78, 0.32, 0.7);
  } else {
    posts(g, [0.52, 1.05, 1.55], 1.18, 0.44, K.timber);
    g.add(blk(0.46, 0.3, 1.6, 0.42, 0, 0.44, K.logs, 2)); g.add(blk(0.46, 0.42, 0.58, 1.18, 0, 0.44, K.logs, 2));
    kroof(g, K, 0.46, 0.3, 1.6, 1.2, 0.44, { pitch: Math.min(K.pitch, 1.1) * 0.75, eave: 0.07, steps: false, timber: false, alongX: true, m: K.civ === 'mol' ? K.roof : undefined });
  }
  logPile(g, 1.0, 0.78, 3, 0.62); logPile(g, 0.58, 1.62, 2, 0.42, true);
  g.add(at(cyl(0.09, 0.1, 0.12, TM('medieval_wood', '#a08060'), 12, 2), 1.55, 0.06, 1.6));
  g.add(at(box(0.03, 0.16, 0.012, PM('#555a60', 0.4, 0.8)), 1.58, 0.17, 1.6, 0, 0, 0.3));
  [[1.2, 1.55], [1.36, 1.5]].forEach(([x, z]) => g.add(at(box(0.05, 0.06, 0.05, PM('#c49a64')), x, 0.03, z, 0, 0.5, 0)));
};
B.mina = (g, K) => {
  ground(g, 0.05, 0.05, 1.95, 1.95, 'river_small_rocks', '#c8c0b0');
  // stânca: bolovani mari îngrămădiți
  const RM = TM('castle_wall_slates', '#b8b2a8', 0.95, 1.6), RM2 = TM('old_stone_wall', '#a8a298', 0.95, 1.6);
  [[0.7, 0.62, 0.42, 0.5], [0.42, 0.9, 0.3, 0.32], [1.05, 0.5, 0.3, 0.3], [0.5, 0.45, 0.28, 0.36], [0.95, 0.95, 0.26, 0.26], [0.3, 0.55, 0.22, 0.22]].forEach(([x, z, r, h], i) => { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), i % 2 ? RM2 : RM); b.castShadow = b.receiveShadow = true; b.scale.set(1, h / r, 1); at(b, x, h * 0.55, z, 0, i * 0.7, 0.1 * i); g.add(b); });
  g.add(at(box(0.28, 0.3, 0.06, PM('#0e0a07')), 0.82, 0.15, 1.2));
  [0.66, 0.98].forEach(x => g.add(at(cyl(0.025, 0.025, 0.36, PM('#6e4b2a'), 8), x, 0.18, 1.22)));
  g.add(at(box(0.42, 0.04, 0.06, PM('#5e3e22')), 0.82, 0.36, 1.22));
  [0.85, 1.05].forEach(z => g.add(at(box(0.6, 0.012, 0.02, PM('#4a4a4a', 0.5, 0.6)), 1.3, 0.01, z + 0.25, 0, -0.9, 0)));
  g.add(at(box(0.2, 0.1, 0.14, TM('raw_plank_wall', '#c8a888'), 3), 1.42, 0.09, 1.42, 0, -0.9, 0));
  for (let i = 0; i < 9; i++) g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + (i % 3) * 0.008), i % 2 ? PM('#e6c040', 0.35, 0.8) : PM('#8a8478', 0.9)), 1.36 + (i % 3) * 0.05, 0.16, 1.38 + Math.floor(i / 3) * 0.04));
  if (K.civ === 'tat') tentStriped(g, 1.55, 0.55, 0.26, 0.18, 0.2, 10);
  else { posts(g, [1.3, 1.82], 0.82, 0.32, K.timber); g.add(blk(1.28, 0.3, 1.84, 0.38, 0, 0.32, K.logs, 2)); kroof(g, K, 1.28, 0.3, 1.84, 0.84, 0.32, { pitch: Math.min(K.pitch, 1.2) * 0.8, eave: 0.06, steps: false, timber: false }); barrel(g, 1.55, 0.6); }
  [[0.35, 1.5], [0.5, 1.7]].forEach(([x, z]) => g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.07), TM('castle_wall_slates', '#c8c0b4')), x, 0.05, z)));
};
B.moara = (g, K, info) => {
  ground(g, 0.15, 0.15, 1.85, 1.85);
  const c = K.civ;
  if (c === 'tat') {
    // moară cu cal: piatra de moară, grinda, hambarul din pâslă
    g.add(at(cyl(0.62, 0.62, 0.05, TM('dry_ground_01', '#d8c8a8'), 28, 1), 1.0, 0.025, 1.0));
    g.add(at(cyl(0.2, 0.22, 0.12, TM('castle_wall_slates', '#d8d0c4'), 20, 2), 1.0, 0.11, 1.0)); g.add(at(cyl(0.18, 0.18, 0.06, TM('castle_wall_slates', '#c8c0b4'), 20, 2), 1.0, 0.2, 1.0));
    g.add(at(cyl(0.025, 0.025, 0.3, K.timber, 8), 1.0, 0.36, 1.0)); g.add(at(box(0.9, 0.03, 0.03, K.timber), 1.3, 0.42, 1.0, 0, 0.6, 0));
    yurt(g, 0.5, 0.5, 0.36, { hw: 0.2, hr: 0.2 });
    for (let i = 0; i < 4; i++) g.add(at(sph(0.06, cloth('#d8c8a0', 'linen'), 8, 6), 1.5 + (i % 2) * 0.1, 0.05, 1.55 + Math.floor(i / 2) * 0.1));
    tug(g, 1.75, 0.4, 0.6);
    return;
  }
  if (c === 'mol') {
    g.add(blk(0.6, 0.6, 1.4, 1.4, 0, 0.14, K.base, 3));
    g.add(blk(0.62, 0.62, 1.38, 1.38, 0.14, 0.72, K.logs, 2));
    door(g, 'z', 0.88, 1.12, 1.38, 0.44, { y0: 0.14 }); kwin(g, K, 'x', 0.9, 1.08, 1.38, 0.52, 0.66);
    kroof(g, K, 0.62, 0.62, 1.38, 1.38, 0.86, { eave: 0.1 });
    info.hub = [1.46, 0.72, 1.0];
  } else if (c === 'val') {
    const r = 0.45; for (let y = 0, i = 0; y < 1.0; i++) { const hh = i % 2 ? 0.05 : 0.1; g.add(at(cyl(r - y * 0.06, r - (y + hh) * 0.06 + 0.002, hh, i % 2 ? K.brick : K.wall, 24, 1.6), 1, y + hh / 2, 1)); y += hh; }
    door(g, 'z', 0.89, 1.11, 1.44, 0.36, { style: 'arch' });
    g.add(at(cone(0.5, 0.5, K.roof, 24, 1.6), 1, 1.25, 1));
    info.hub = [1.33, 0.84, 1.33];
  } else if (c === 'ung') {
    kwalls(g, K, 0.62, 0.62, 1.38, 1.38, 0, 0.95);
    door(g, 'z', 0.88, 1.12, 1.38, 0.36, { style: 'arch' }); kwin(g, K, 'x', 0.92, 1.08, 1.38, 0.55, 0.72, { style: 'rect' });
    kroof(g, K, 0.62, 0.62, 1.38, 1.38, 0.95, { alongX: true });
    info.hub = [1.44, 0.78, 1.0];
  } else if (c === 'pol') {
    // moară pe capră (koźlak): picioare încrucișate, cutia de scânduri ridicată, acoperiș în două ape
    [[0.75, 0.75], [1.25, 0.75], [0.75, 1.25], [1.25, 1.25]].forEach(([x, z]) => { const l = cyl(0.02, 0.025, 0.5, K.timber, 6); at(l, (x + 1) / 2, 0.22, (z + 1) / 2, (z - 1) * 0.9, 0, -(x - 1) * 0.9); g.add(l); });
    g.add(at(cyl(0.05, 0.06, 0.5, K.timber, 8), 1, 0.25, 1));
    g.add(blk(0.66, 0.7, 1.34, 1.3, 0.42, 0.62, K.planks, 2));
    door(g, 'z', 0.9, 1.1, 1.3, 0.72, { y0: 0.46 });
    g.add(gableRoof(0.66, 0.7, 1.34, 1.3, 1.04, 0.32, K.roof, true, K.planks, 0.05));
    g.add(at(box(0.3, 0.025, 0.08, K.timber), 0.85, 0.36, 1.32, 0, 0, 0.6));
    info.hub = [1.42, 0.8, 1.0];
  } else if (c === 'oto') {
    g.add(at(cyl(0.44, 0.5, 1.0, K.stone, 24, 1.6), 1, 0.5, 1));
    door(g, 'z', 0.9, 1.1, 1.48, 0.36, { style: 'arch' });
    g.add(at(cyl(0.47, 0.47, 0.05, K.wall, 24, 2), 1, 1.02, 1)); g.add(at(cone(0.52, 0.42, K.roof, 24, 1.6), 1, 1.25, 1)); finial(g, 1, 1.46, 1, 'crescent', 0.8);
    info.hub = [1.45, 0.86, 1.45];
  }
  g.add(at(cyl(0.025, 0.025, 0.14, PM('#3a2a1a'), 8), info.hub[0] - 0.04, info.hub[1], info.hub[2] - 0.0, 0, 0, Math.PI / 2));
  for (let i = 0; i < 3; i++) g.add(at(sph(0.055, cloth('#d8c8a0', 'linen'), 8, 6), 1.62 + (i % 2) * 0.09, 0.05, 0.4 + i * 0.1));
};
B.ogor = (g, K) => {
  const c = K.civ;
  const soil = mesh(new THREE.PlaneGeometry(2.9, 2.9), TM('dirt', c === 'tat' || c === 'oto' ? '#e8d0a8' : '#e0c49a', 1)); at(soil, 1.5, 0.003, 1.5, -Math.PI / 2); soil.castShadow = false; soil.userData.noSnow = true; g.add(soil);
  const uv = soil.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
  const crop = { mol: ['#d8b850', '#c8a840', '#b8b048'], val: ['#d8b850', '#c8a840', '#d0b048'], ung: ['#d8b850', '#c8a840', '#b8b048'], pol: ['#b8a040', '#a89838', '#c0a848'], oto: ['#5a8a3a', '#6a9a40', '#4a7a30'], tat: ['#d8c060', '#e0c868', '#c8b058'] }[c];
  const mats3 = crop.map(h => PM(h, 0.9));
  const geo = c === 'oto' ? new THREE.SphereGeometry(0.05, 6, 4) : c === 'tat' ? new THREE.ConeGeometry(0.03, 0.2, 5) : new THREE.ConeGeometry(0.035, 0.16, 5);
  for (let r = 0; r < 11; r++) {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.01, 0.07), PM('#5e4528', 1)), 1.5, 0.006, 0.2 + r * 0.26 + 0.13));
    for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(geo, mats3[(r + i) % 3]); m.castShadow = true; at(m, 0.18 + i * 0.155 + (r % 2) * 0.07, c === 'oto' ? 0.035 : c === 'tat' ? 0.1 : 0.08, 0.2 + r * 0.26, 0, 0, (i % 3 - 1) * 0.08); g.add(m); if (c === 'oto' && (i + r) % 5 === 0) g.add(at(sph(0.03, PM('#c8402a', 0.7), 6, 4), 0.2 + i * 0.155, 0.04, 0.24 + r * 0.26)); }
  }
  if (c === 'mol') wattle(g, [[0.05, 2.95], [2.95, 2.95], [2.95, 0.05]], 0.14);
  else if (c === 'val') { fencePosts(g, [[0.05, 2.95], [2.95, 2.95], [2.95, 0.05]], 0.14); hay(g, 2.75, 2.7, 0.16); }
  else if (c === 'ung') { [[0.05, 2.95, 2.95, 2.95], [2.95, 0.05, 2.95, 2.95]].forEach(([x0, z0, x1, z1]) => g.add(blk(Math.min(x0, x1) - 0.04, Math.min(z0, z1) - 0.04, Math.max(x0, x1) + 0.04, Math.max(z0, z1) + 0.04, 0, 0.1, TM('rustic_stone_wall', '#e8e0d0'), 3))); }
  else if (c === 'pol') { fencePosts(g, [[0.05, 2.95], [2.95, 2.95], [2.95, 0.05]], 0.15); const sc = new THREE.Group(); sc.add(at(cyl(0.012, 0.012, 0.5, PM('#6e4b2a'), 5), 0, 0.25, 0)); sc.add(at(box(0.3, 0.015, 0.015, PM('#6e4b2a')), 0, 0.38, 0, 0, Math.PI / 4, 0)); sc.add(at(cyl(0.05, 0.07, 0.16, cloth('#7a5a3a', 'wool'), 8), 0, 0.33, 0)); sc.add(at(sph(0.04, cloth('#d8c8a0', 'linen'), 8, 6), 0, 0.46, 0)); sc.add(at(cyl(0.05, 0.05, 0.03, cloth('#3a2a1a', 'felt'), 10), 0, 0.5, 0)); at(sc, 1.5, 0, 1.5); g.add(sc); }
  else if (c === 'oto') { [[0.05, 2.95, 2.95, 2.95], [2.95, 0.05, 2.95, 2.95]].forEach(([x0, z0, x1, z1]) => g.add(blk(Math.min(x0, x1) - 0.04, Math.min(z0, z1) - 0.04, Math.max(x0, x1) + 0.04, Math.max(z0, z1) + 0.04, 0, 0.08, K.stone, 3))); g.add(at(cyl(0.12, 0.13, 0.08, K.stone, 14), 2.75, 0.04, 2.75)); }
  else if (c === 'tat') { g.add(at(cyl(0.012, 0.012, 0.4, K.timber, 5), 2.8, 0.2, 2.8)); g.add(at(box(0.004, 0.06, 0.12, team('velvet')), 2.8, 0.36, 2.86)); }
};
B.cazarma = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9);
  if (c === 'tat') {
    tentStriped(g, 0.75, 0.75, 0.42, 0.3, 0.42, 12); tentStriped(g, 1.65, 1.55, 0.86, 0.42, 0.85, 16); tentStriped(g, 2.45, 0.6, 0.36, 0.26, 0.36, 10);
    spearRack(g, 2.75, 1.5, 5); tug(g, 0.55, 2.4, 0.95); tug(g, 2.55, 2.55, 0.8);
    carpet(g, 1.1, 2.55, 0.5, 0.34, 0.2, 2);
    return;
  }
  if (c === 'mol') {
    for (let x = 0.2; x < 2.85; x += 0.11) g.add(at(cyl(0.035, 0.035, 0.36, TM('medieval_wood', '#a08060'), 7, 2), x, 0.18, 0.18));
    for (let z = 0.3; z < 2.85; z += 0.11) g.add(at(cyl(0.035, 0.035, 0.36, TM('medieval_wood', '#a08060'), 7, 2), 0.18, 0.18, z));
    hall(g, K, 0.45, 0.72, 2.6, 2.3, 0.56, { m: K.logs, plinth: false, dw: 0.4, dc: 1.5, roof: { kind: 'gable', alongX: true, pitch: 1.1, m: K.roof } });
    shieldsOn(g, 'z', 0.5, 1.2, 2.3, 0.3, 2); shieldsOn(g, 'z', 1.8, 2.55, 2.3, 0.3, 2);
    spearRack(g, 2.86, 0.85, 5);
  } else if (c === 'val') {
    kwalls(g, K, 0.45, 0.6, 2.6, 2.1, 0, 0.62);
    g.add(blk(0.45, 2.1, 2.6, 2.4, 0, 0.04, K.base, 2)); arcade(g, 'z', 0.5, 2.55, 2.38, 0.5, 5, K.brick, K.wall);
    door(g, 'z', 1.42, 1.68, 2.1, 0.4, { style: 'arch' });
    kroof(g, K, 0.45, 0.6, 2.6, 2.38, 0.62);
    banner(g, 'x', 1.0, 2.6, 0.58, 0.14, 0.3); banner(g, 'x', 1.7, 2.6, 0.58, 0.14, 0.3);
    spearRack(g, 2.85, 0.9, 5);
  } else if (c === 'ung') {
    hall(g, K, 0.5, 0.6, 2.5, 2.2, 0.62, { dw: 0.34, roof: { alongX: true } });
    shieldsOn(g, 'z', 0.55, 1.2, 2.2, 0.16, 3, 'pavise'); shieldsOn(g, 'x', 0.7, 1.4, 2.5, 0.16, 3, 'pavise');
    spearRack(g, 2.8, 1.0, 5);
  } else if (c === 'pol') {
    hall(g, K, 0.5, 0.65, 2.5, 2.2, 0.66, { dw: 0.32, roof: { alongX: true } });
    shieldsOn(g, 'z', 0.6, 1.25, 2.2, 0.48, 2, 'heater'); shieldsOn(g, 'z', 1.75, 2.45, 2.2, 0.48, 2, 'heater');
    banner(g, 'x', 1.4, 2.5, 0.62, 0.16, 0.34);
    spearRack(g, 2.82, 0.9, 5);
  } else if (c === 'oto') {
    g.add(blk(0.45, 0.6, 2.6, 2.2, 0, 0.62, K.stone, 1.6));
    door(g, 'z', 1.38, 1.68, 2.2, 0.44, { style: 'arch', col: '#3a2414' }); winsAlong(g, K, 'z', 0.45, 2.6, 2.2, 0.26, 1.53); winsAlong(g, K, 'x', 0.6, 2.2, 2.6, 0.26, null);
    kroof(g, K, 0.45, 0.6, 2.6, 2.2, 0.62);
    [0.9, 1.5, 2.1].forEach(x => chimney(g, K, x, 0.95, 0.72, 0.3, 0.08));
    cauldron(g, 1.6, 2.6); topFlag(g, 2.75, 0, 2.75, 0.9, 0.26);
    spearRack(g, 2.85, 0.75, 5);
  }
};
B.poligon = (g, K) => {
  const c = K.civ;
  ground(g, 0.08, 0.08, 2.92, 2.92, 'forest_ground_04', '#d8c8a0');
  if (c === 'tat') { tentStriped(g, 0.85, 0.85, 0.5, 0.3, 0.45, 12); g.add(at(cyl(0.012, 0.012, 0.9, K.timber, 6), 2.4, 0.45, 1.0)); g.add(at(cyl(0.12, 0.12, 0.03, PM('#e8dcc0'), 16), 2.4, 0.92, 1.0)); g.add(at(cyl(0.07, 0.07, 0.035, PM('#b8302a'), 16), 2.4, 0.93, 1.0)); }
  else if (c === 'oto') hall(g, K, 0.35, 0.35, 1.5, 1.35, 0.46, { m: K.stone, dw: 0.2 });
  else hall(g, K, 0.35, 0.35, 1.5, 1.35, 0.46, { dw: 0.2, m: c === 'mol' ? K.logs : undefined, plinth: c !== 'mol', roof: { alongX: true } });
  target(g, 2.25, 2.3); target(g, 2.5, 1.25); if (c !== 'tat') target(g, 1.15, 2.5);
  [[1.9, 0.5], [2.35, 0.6]].forEach(p => g.add(at(cyl(0.12, 0.12, 0.2, PM('#d6b450', 0.95), 14), p[0], 0.1, p[1], 0, 0, Math.PI / 2)));
  for (let i = 0; i < 4; i++) g.add(at(cyl(0.004, 0.004, 0.22, PM('#c8b890'), 4), 1.7 + i * 0.04, 0.12, 1.75, 0.3, 0, 0.2));
  if (c === 'ung' || c === 'pol') shieldsOn(g, 'z', 0.4, 1.4, 1.35, 0.12, 2, 'pavise');
};
B.grajd = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9);
  if (c === 'tat') {
    const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * 0.9 + i / 14 * Math.PI * 1.3; pts.push([1.5 + Math.cos(a) * 1.2, 1.5 + Math.sin(a) * 1.2]); } fencePosts(g, pts, 0.22);
    yurt(g, 0.95, 0.95, 0.42, { hw: 0.24, hr: 0.24, felt: '#d8c8a8' });
    [[1.9, 2.3], [2.3, 1.9]].forEach(([x, z]) => { g.add(at(cyl(0.015, 0.015, 0.3, K.timber, 6), x, 0.15, z)); });
    g.add(at(box(0.6, 0.03, 0.03, K.timber), 2.1, 0.26, 2.1, 0, Math.PI / 4, 0));
    g.add(at(cyl(0.05, 0.06, 0.06, cloth('#7a3a1a', 'embroid'), 10), 2.0, 0.3, 2.0)); hay(g, 2.5, 0.8, 0.2);
    return;
  }
  const M = c === 'mol' ? K.planks : c === 'oto' ? K.stone : undefined;
  kwalls(g, K, 0.4, 0.5, 2.6, 2.25, 0, 0.58, { m: M, timber: c === 'ung' });
  g.add(at(box(0.6, 0.44, 0.03, PM('#3a2614', 0.9)), 1.5, 0.22, 2.26)); [[1.24, 1.76]].forEach(([a, b]) => { g.add(at(box(0.62, 0.025, 0.035, PM('#c8b090')), 1.5, 0.3, 2.28, 0, 0, 0.62)); g.add(at(box(0.62, 0.025, 0.035, PM('#c8b090')), 1.5, 0.3, 2.28, 0, 0, -0.62)); });
  winsAlong(g, K, 'x', 0.5, 2.25, 2.6, 0.3, null, 0.5, 0.18, 0.1);
  kroof(g, K, 0.4, 0.5, 2.6, 2.25, 0.58, { alongX: false, m: c === 'mol' ? K.thatch : undefined, pitch: c === 'oto' || c === 'tat' ? undefined : Math.min(K.pitch, 1.3) });
  if (c === 'ung' || c === 'pol') g.add(at(box(0.18, 0.12, 0.012, team('velvet')), 1.5, 0.84, 2.27));
  hay(g, 2.55, 2.6, 0.26);
  for (let x = 0.3; x < 2.85; x += 0.42) g.add(at(cyl(0.02, 0.02, 0.24, PM('#6e4b2a'), 6), x, 0.12, 2.8));
  [0.08, 0.16].forEach(y => g.add(at(box(2.5, 0.025, 0.025, PM('#6e4b2a')), 1.55, y, 2.8)));
  g.add(at(box(0.4, 0.07, 0.1, TM('raw_plank_wall', '#b89878'), 3), 2.0, 0.04, 2.55));
};
B.fierarie = (g, K, info) => {
  const c = K.civ;
  ground(g, 0.12, 0.12, 2.88, 2.88, 'river_small_rocks', '#b8b0a0');
  if (c === 'tat') {
    yurt(g, 0.95, 0.95, 0.55, { felt: '#d8c8b0' });
    g.add(blk(1.7, 1.4, 2.3, 1.9, 0, 0.3, K.stone, 2)); const gl = glow(0.3, 0.14); at(gl, 2.0, 0.2, 1.905); g.add(gl);
    [[1.6, 1.3, 0.62], [2.4, 1.3, 0.55], [1.6, 2.0, 0.55], [2.4, 2.0, 0.5]].forEach(([x, z, h]) => g.add(at(cyl(0.018, 0.018, h, K.timber, 6), x, h / 2, z)));
    g.add(polys([[V(1.55, 0.62, 1.25), V(2.45, 0.56, 1.25), V(2.45, 0.5, 2.05), V(1.55, 0.55, 2.05)]], cloth('#a88458', 'hide', 0.95)));
    info.chimney = [2.0, 0.6, 1.6];
    anvil(g, 2.0, 2.3); barrel(g, 2.45, 2.4);
    return;
  }
  hall(g, K, 0.5, 0.6, 2.5, 2.4, 0.52, { m: c === 'mol' ? K.stone : c === 'oto' ? K.stone : undefined, door: false, dc: 1.45, roof: { alongX: true, pitch: Math.min(K.pitch, 1.4) } });
  const gl = glow(0.5, 0.36); at(gl, 1.45, 0.18, 2.415); g.add(gl);
  info.chimney = chimney(g, K, 1.95, 0.95, 0.6, c === 'oto' || c === 'tat' ? 0.5 : 0.75, 0.16);
  anvil(g, 1.45, 2.8); barrel(g, 1.9, 2.75); g.add(at(box(0.04, 0.14, 0.012, PM('#2e3034', 0.45, 0.85)), 1.02, 0.07, 2.62, 0, 0, 0.2));
  for (let i = 0; i < 3; i++) g.add(at(box(0.012, 0.18, 0.04, PM('#5a5e64', 0.4, 0.8)), 2.52, 0.3, 0.9 + i * 0.12));
};
B.targ = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9, 'dirt', '#e0ccb0');
  if (c === 'mol') {
    stall(g, K, 1.0, 0.85, 0.7, 0.45); stall(g, K, 2.05, 0.85, 0.7, 0.45); stall(g, K, 0.75, 1.95, 0.6, 0.42, Math.PI / 2);
    shadoof(g, 2.2, 2.1); cart(g, 1.55, 2.55, 0.3, 'hay'); barrel(g, 2.65, 1.3); barrel(g, 2.75, 1.45); crate(g, 1.6, 1.4);
  } else if (c === 'val') {
    // hanul: clădire în U cu arcade spre curte
    kwalls(g, K, 0.3, 0.3, 2.7, 0.95, 0, 0.6); kwalls(g, K, 0.3, 0.95, 0.95, 2.6, 0, 0.6);
    arcade(g, 'z', 0.95, 2.7, 1.12, 0.48, 5, K.brick, K.wall); arcade(g, 'x', 1.12, 2.6, 1.12, 0.48, 4, K.brick, K.wall);
    kroof(g, K, 0.3, 0.3, 2.7, 1.12, 0.6); kroof(g, K, 0.3, 1.12, 1.12, 2.6, 0.6);
    cart(g, 1.9, 2.0, 0.6, 'sacks'); barrel(g, 2.5, 2.5); barrel(g, 2.62, 2.38); shadoof(g, 1.6, 2.6);
    banner(g, 'z', 1.85, 1.13, 0.56, 0.16, 0.18);
  } else if (c === 'ung') {
    // hala de târg: etaj cu bârne pe arcade de piatră
    arcade(g, 'z', 0.5, 2.3, 1.8, 0.4, 4, K.stone); arcade(g, 'x', 0.6, 1.8, 2.3, 0.4, 3, K.stone);
    g.add(blk(0.5, 0.6, 2.3, 0.7, 0, 0.4, K.stone, 1.6)); g.add(blk(0.5, 0.7, 0.6, 1.8, 0, 0.4, K.stone, 1.6));
    kwalls(g, K, 0.5, 0.6, 2.3, 1.8, 0.44, 0.42, { plinth: false });
    kroof(g, K, 0.5, 0.6, 2.3, 1.8, 0.86, { alongX: true });
    stall(g, K, 1.0, 2.4, 0.6, 0.38); stall(g, K, 2.6, 1.1, 0.55, 0.36, Math.PI / 2); barrel(g, 2.6, 2.6); crate(g, 1.8, 2.5);
  } else if (c === 'pol') {
    // hala postăvarilor (Sukiennice): lungă, cu atic alb crenelat
    kwalls(g, K, 0.35, 0.6, 2.65, 1.6, 0, 0.7);
    arcade(g, 'z', 0.4, 2.6, 1.62, 0.44, 6, PM('#efe8dc', 0.9)); g.add(blk(0.35, 1.6, 2.65, 1.66, 0, 0.03, K.base, 2));
    kroof(g, K, 0.35, 0.6, 2.65, 1.6, 0.7, { alongX: true, steps: false, pitch: 1.0 });
    g.add(blk(0.33, 1.6, 2.67, 1.66, 0.7, 0.14, PM('#efe8dc', 0.9))); for (let i = 0; i < 11; i++) g.add(at(box(0.06, 0.1, 0.06, PM('#efe8dc', 0.9)), 0.4 + i * 0.22, 0.89, 1.63));
    g.add(blk(2.65, 0.6, 2.71, 1.66, 0.7, 0.14, PM('#efe8dc', 0.9)));
    stall(g, K, 1.0, 2.3, 0.6, 0.4); stall(g, K, 2.0, 2.3, 0.6, 0.4); cart(g, 2.6, 2.6, 0.9, 'sacks');
  } else if (c === 'oto') {
    // bedesten: hală de piatră cu patru cupole
    g.add(blk(0.5, 0.5, 2.3, 2.0, 0, 0.6, K.stone, 1.6));
    door(g, 'z', 1.25, 1.55, 2.0, 0.44, { style: 'arch' }); door(g, 'x', 1.1, 1.4, 2.3, 0.44, { style: 'arch' });
    [[0.95, 0.9], [1.85, 0.9], [0.95, 1.6], [1.85, 1.6]].forEach(([x, z]) => domeOn(g, x, z, 0.6, 0.32, K.lead, { drum: 0.06, drumM: K.stone, fs: 0.7 }));
    stall(g, K, 1.0, 2.5, 0.6, 0.38); stall(g, K, 2.6, 1.2, 0.55, 0.36, Math.PI / 2); carpet(g, 2.0, 2.55, 0.42, 0.3, 0.3, 0); cypress(g, 2.7, 2.6, 0.75);
  } else if (c === 'tat') {
    tentStriped(g, 0.8, 0.8, 0.42, 0.3, 0.36, 12); tentStriped(g, 1.95, 0.75, 0.36, 0.26, 0.32, 10); tentStriped(g, 0.75, 1.95, 0.36, 0.26, 0.32, 10);
    carpet(g, 1.7, 1.6, 0.44, 0.62, 0.4, 0); carpet(g, 2.4, 1.9, 0.4, 0.56, -0.3, 1); carpet(g, 1.55, 2.45, 0.4, 0.56, 1.2, 2);
    for (let i = 0; i < 5; i++) g.add(at(lathe([[0.001, 0], [0.04, 0.01], [0.05, 0.05], [0.03, 0.09], [0.02, 0.11]], PM(i % 2 ? '#b0602a' : '#c8804a', 0.8), 10), 2.2 + (i % 3) * 0.1, 0.01, 2.5 + Math.floor(i / 3) * 0.1));
    cart(g, 2.5, 1.0, 0.8, 'sacks');
  }
};
B.turn1 = (g, K) => {
  const c = K.civ;
  ground(g, 0.3, 0.3, 1.7, 1.7, 'forest_ground_04', '#c8b8a0');
  const h = 1.05;
  [[0.68, 0.68], [1.32, 0.68], [0.68, 1.32], [1.32, 1.32]].forEach(([x, z]) => g.add(at(cyl(0.035, 0.04, h, K.timber, 8), x, h / 2, z)));
  [[0.68, 1.0, 0.64, 'x'], [1.32, 1.0, 0.64, 'x'], [1.0, 0.68, 0.64, 'z'], [1.0, 1.32, 0.64, 'z']].forEach(([x, z, L, ax]) => { const b = box(ax === 'x' ? 0.025 : L * 1.25, 0.025, ax === 'x' ? L * 1.25 : 0.025, K.timber); at(b, x, h * 0.45, z, ax === 'x' ? 0.9 : 0, 0, ax === 'x' ? 0 : 0.9); g.add(b); });
  g.add(blk(0.58, 0.58, 1.42, 1.42, h, 0.05, K.planks, 2));
  if (c === 'mol') g.add(blk(0.6, 0.6, 1.4, 1.4, h + 0.05, 0.26, K.logs, 2));
  else if (c === 'ung') { g.add(blk(0.6, 0.6, 1.4, 1.4, h + 0.05, 0.28, K.wall, 1.6)); timberFace(g, 'z', 0.6, 1.4, 1.4, h + 0.05, h + 0.33, K.timber); timberFace(g, 'x', 0.6, 1.4, 1.4, h + 0.05, h + 0.33, K.timber); }
  else if (c === 'pol' || c === 'val') g.add(blk(0.6, 0.6, 1.4, 1.4, h + 0.05, 0.26, K.planks, 2));
  else { fencePosts(g, [[0.6, 1.4], [1.4, 1.4], [1.4, 0.6]], 0.2, K.timber); g.translateY(0); g.children.slice(-12).forEach(o => o.position.y += h + 0.05); }
  [[1.0, 1.405, 'z'], [1.405, 1.0, 'x']].forEach(([x, z, f]) => { if (c !== 'oto' && c !== 'tat') g.add(f === 'z' ? at(box(0.12, 0.05, 0.01, PM('#120e0a')), x, h + 0.2, z) : at(box(0.01, 0.05, 0.12, PM('#120e0a')), x, h + 0.2, z)); });
  const y = h + (c === 'oto' || c === 'tat' ? 0.3 : 0.31);
  if (c === 'mol') { g.add(at(cone(0.62, 0.78, K.roof, 4, 1.6), 1, y + 0.39, 1, 0, Math.PI / 4, 0)); topFlag(g, 1, y + 0.76, 1, 0.3); }
  else if (c === 'val') { g.add(hipRoof(0.5, 0.5, 1.5, 1.5, y, 0.45, K.roof)); topFlag(g, 1, y + 0.44, 1, 0.3); }
  else if (c === 'ung') { g.add(at(cone(0.6, 1.0, K.roof, 4, 1.6), 1, y + 0.5, 1, 0, Math.PI / 4, 0)); topFlag(g, 1, y + 0.98, 1, 0.28); }
  else if (c === 'pol') { g.add(hipRoof(0.52, 0.52, 1.48, 1.48, y, 0.8, K.roof)); topFlag(g, 1, y + 0.78, 1, 0.28); }
  else if (c === 'oto') { [[0.62, 0.62], [1.38, 0.62], [0.62, 1.38], [1.38, 1.38]].forEach(([x, z]) => g.add(at(cyl(0.018, 0.018, 0.3, K.timber, 6), x, y - 0.15, z))); g.add(at(cone(0.62, 0.36, K.roof, 4, 1.6), 1, y + 0.18, 1, 0, Math.PI / 4, 0)); topFlag(g, 1, y + 0.34, 1, 0.3); }
  else { [[0.62, 0.62], [1.38, 0.62], [0.62, 1.38], [1.38, 1.38]].forEach(([x, z]) => g.add(at(cyl(0.018, 0.018, 0.3, K.timber, 6), x, y - 0.15, z))); g.add(at(cone(0.68, 0.34, cloth('#a88458', 'hide', 0.95), 4, 1.6), 1, y + 0.17, 1, 0, Math.PI / 4, 0)); tug(g, 1, 1, y + 0.75); }
  g.add(at(box(0.04, 0.9, 0.025, K.timber), 1.42, 0.5, 1.15, 0.0, 0, 0.12));
};
B.turn2 = (g, K) => {
  ground(g, 0.3, 0.3, 1.7, 1.7, 'forest_ground_04', '#c8b8a0');
  const c = K.civ, round = c !== 'pol' && c !== 'tat';
  const top = ktower(g, K, 1, 1, round ? 0.55 : 0.5, 1.5, { m: c === 'val' ? K.stone : K.stone, glazed: true, fin: false });
  door(g, 'z', 0.92, 1.08, round ? 1.54 : 1.5, 0.28, { style: c === 'mol' || c === 'tat' ? 'rect' : 'arch' });
  topFlag(g, 1, top - 0.02, 1, 0.34, 0.22);
};
B.manastire = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9, 'river_small_rocks', '#c8c0b0');
  if (c === 'mol') {
    // biserică pictată (Voroneț): pereți albaștri, streașină largă, turla pe stea
    for (let x = 0.15; x < 2.85; x += 0.6) g.add(blk(x, 0.12, Math.min(2.85, x + 0.58), 0.28, 0, 0.22, K.stone, 2));
    const P = paintedMat(); const nave = blk(0.7, 1.0, 2.4, 2.0, 0, 0.72, P, 1); g.add(nave);
    const uvs = nave.geometry.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 0.35, uvs.getY(i) * 0.5);
    g.add(at(cyl(0.5, 0.5, 0.72, P, 16, 0.5, false, Math.PI, Math.PI), 0.7, 0.36, 1.5));
    g.add(blk(0.68, 0.98, 2.42, 2.02, 0.72, 0.06, K.wall, 2));
    door(g, 'x', 1.32, 1.68, 2.4, 0.46, { style: 'arch', col: '#2a1a10', frame: '#d9b44a' });
    [1.0, 1.9].forEach(x => win(g, 'z', x, x + 0.16, 2.0, 0.38, 0.58, { style: 'arch', col: '#1a1626', frame: '#d9b44a' }));
    g.add(hipRoof(0.48, 0.78, 2.62, 2.22, 0.78, 0.68, K.roof, 1.4));
    const s1 = box(0.42, 0.14, 0.42, K.wall); at(s1, 1.55, 1.42, 1.5, 0, Math.PI / 4, 0); g.add(s1); g.add(at(box(0.42, 0.14, 0.42, K.wall), 1.55, 1.42, 1.5));
    g.add(at(cyl(0.2, 0.2, 0.42, P, 16, 0.5), 1.55, 1.7, 1.5)); g.add(at(cone(0.28, 0.42, K.roof, 16, 1.4), 1.55, 2.12, 1.5)); finial(g, 1.55, 2.33, 1.5, 'cross', 1.2);
    // clopotnița
    ktower(g, K, 2.55, 0.6, 0.22, 0.7, { round: false, top: 'cone', pitch: 2.4 });
    banner(g, 'z', 2.0, 0.28, 0.3, 0.12, 0.22);
  } else if (c === 'val') {
    // biserică în stil muntenesc: benzi de cărămidă, pridvor cu arcade, două turle cu coifuri
    g.add(blk(0.55, 0.85, 2.55, 2.15, 0, 0.06, K.base, 3));
    banded(g, 0.6, 0.9, 2.2, 2.1, 0.06, 0.74, K.wall, K.brick, 0.06);
    g.add(at(cyl(0.6, 0.6, 0.8, K.wall, 16, 1, false, Math.PI, Math.PI), 0.6, 0.46, 1.5));
    g.add(blk(2.2, 0.9, 2.55, 2.1, 0.06, 0.04, K.base, 2)); arcade(g, 'x', 0.95, 2.05, 2.52, 0.62, 3, K.brick, K.wall);
    door(g, 'x', 1.36, 1.64, 2.2, 0.5, { style: 'arch', col: '#2a1a10' });
    [1.0, 1.7].forEach(x => win(g, 'z', x, x + 0.14, 2.1, 0.4, 0.62, { style: 'arch', col: '#1a1626', frame: '#c8b8a0' }));
    g.add(hipRoof(0.5, 0.82, 2.62, 2.18, 0.8, 0.36, K.lead, 1.4));
    g.add(at(cyl(0.24, 0.26, 0.4, K.wall, 16, 2), 1.3, 1.24, 1.5)); helmet(g, 1.3, 1.44, 1.5, 0.24, K.lead);
    g.add(at(cyl(0.15, 0.16, 0.3, K.wall, 12, 2), 2.1, 1.08, 1.5)); helmet(g, 2.1, 1.23, 1.5, 0.15, K.lead);
    banner(g, 'z', 2.4, 2.1, 0.58, 0.12, 0.24);
  } else if (c === 'ung') {
    // biserică gotică: navă de piatră, contraforturi, turn cu coif înalt
    g.add(blk(0.45, 1.0, 2.15, 2.0, 0, 0.82, K.stone, 1.6));
    [0.75, 1.25, 1.75].forEach(x => { g.add(blk(x - 0.05, 2.0, x + 0.05, 2.12, 0, 0.6, K.stone, 2)); win(g, 'z', x + 0.12, x + 0.26, 2.0, 0.28, 0.66, { style: 'lancet', col: '#1e2430', frame: '#e8e0d0' }); });
    g.add(gableRoof(0.45, 1.0, 2.15, 2.0, 0.82, 0.85, K.roof, true, K.stone, 0.06));
    ktower(g, K, 2.42, 1.5, 0.3, 1.45, { round: false, top: 'spire4', pitch: 3.6, glazed: true });
    door(g, 'x', 1.38, 1.62, 2.72, 0.42, { style: 'lancet', col: '#3a2414' });
    banner(g, 'z', 2.42, 1.8, 1.25, 0.12, 0.26);
  } else if (c === 'pol') {
    // biserică gotică de cărămidă, cu două turnuri inegale (Kraków)
    g.add(blk(0.4, 1.0, 2.1, 2.0, 0, 0.86, K.brick, 1.6));
    [0.7, 1.2, 1.7].forEach(x => win(g, 'z', x, x + 0.14, 2.0, 0.3, 0.72, { style: 'lancet', col: '#1a2026', frame: '#efe8dc' }));
    g.add(gableRoof(0.4, 1.0, 2.1, 2.0, 0.86, 0.9, K.roof, true, K.brick, 0.05));
    ktower(g, K, 2.38, 1.18, 0.24, 1.75, { round: false, top: 'pyramid', pitch: 2.2, m: K.brick });
    const t2 = ktower(g, K, 2.38, 1.84, 0.22, 1.35, { round: false, top: 'crenel', m: K.brick, fin: false }); helmet(g, 2.38, t2 - 0.06, 1.84, 0.16, K.copper, 'cross');
    door(g, 'x', 1.38, 1.62, 2.62, 0.44, { style: 'lancet', col: '#3a2414' });
    banner(g, 'z', 2.38, 2.06, 1.0, 0.11, 0.24);
  } else if (c === 'oto') {
    // geamie: sală pătrată, cupolă de plumb, portic cu trei cupole, minaret
    g.add(blk(0.6, 0.6, 2.3, 2.2, 0, 0.66, K.stone, 1.6));
    domeOn(g, 1.45, 1.4, 0.66, 0.72, K.lead, { drum: 0.16, drumM: K.stone, wins: 12, fs: 1.3 });
    [0.6, 2.2].forEach((x, i) => { g.add(blk(i ? x - 0.04 : x, 0.6, i ? x : x + 0.04, 2.2, 0.66, 0.06, K.stone)); });
    g.add(blk(0.6, 2.2, 2.3, 2.6, 0, 0.03, K.base, 2)); arcade(g, 'z', 0.65, 2.25, 2.58, 0.48, 3, PM('#f2ead8', 0.9));
    [0.92, 1.45, 1.98].forEach(x => domeOn(g, x, 2.4, 0.52, 0.2, K.lead, { drum: 0.04, drumM: K.stone, fin: false }));
    g.add(blk(0.6, 2.2, 2.3, 2.6, 0.5, 0.03, K.stone, 2));
    door(g, 'z', 1.3, 1.6, 2.2, 0.46, { style: 'arch', col: '#2a3a3a' }); winsAlong(g, K, 'x', 0.6, 2.2, 2.3, 0.28, null, 0.5);
    minaret(g, 2.62, 0.55, 2.0, K.wall, K.lead, { r: 0.09 });
    cypress(g, 0.35, 2.7, 0.8);
  } else if (c === 'tat') {
    // geamia hanului (Bahcisarai): sală cu acoperiș în patru ape, galerie pictată, două minarete
    kwalls(g, K, 0.55, 0.6, 2.35, 2.0, 0, 0.62);
    g.add(blk(0.55, 2.0, 2.35, 2.3, 0, 0.04, K.base, 2)); posts(g, [0.6, 1.05, 1.5, 1.95, 2.3], 2.28, 0.6, PM('#2a5a8a', 0.7), 0.025);
    door(g, 'z', 1.32, 1.58, 2.0, 0.44, { col: '#2a5a8a' }); winsAlong(g, K, 'z', 0.55, 2.35, 2.0, 0.28, 1.45, 0.4); winsAlong(g, K, 'x', 0.6, 2.0, 2.35, 0.28, null, 0.45);
    kroof(g, K, 0.55, 0.6, 2.35, 2.3, 0.62, { pitch: 0.7 });
    [[0.45, 2.55], [2.55, 0.45]].forEach(([x, z]) => { g.add(at(cyl(0.085, 0.1, 1.9, K.wall, 8, 2), x, 0.95, z)); g.add(at(cyl(0.14, 0.11, 0.06, PM('#2a5a8a', 0.7), 8), x, 1.55, z)); g.add(at(cone(0.1, 0.42, K.lead, 8), x, 2.11, z)); finial(g, x, 2.32, z, 'crescent'); });
    cypress(g, 2.75, 2.5, 0.75); cypress(g, 2.5, 2.78, 0.7);
  }
};
B.universitate = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9, 'river_small_rocks', '#c8c0b0');
  if (c === 'mol') {
    hall(g, K, 0.4, 0.5, 2.6, 1.75, 0.8, { dw: 0.26, wy: 0.42, roof: { eave: 0.14 } });
    winsAlong(g, K, 'z', 0.4, 2.6, 1.75, 0.13, 1.5, 0.42, 0.14, 0.13);
    ktower(g, K, 1.5, 2.05, 0.26, 1.15, { round: false, top: 'cone', pitch: 2.6 });
    win(g, 'z', 1.42, 1.58, 2.31, 0.8, 0.98, { col: '#f0eadc', frame: '#3a2a1a' });
    g.add(at(cyl(0.065, 0.065, 0.01, PM('#f6f2e6', 0.6), 16), 1.5, 0.9, 2.32, Math.PI / 2)); g.add(at(box(0.008, 0.05, 0.004, PM('#1a1410')), 1.5, 0.915, 2.33));
    for (let i = 0; i < 3; i++) g.add(at(box(0.1, 0.03, 0.14, cloth(['#8a2a1a', '#2a4a7a', '#3a5a2a'][i], 'leather')), 2.55 + i * 0.03, 0.03 + i * 0.03, 2.4, 0, 0.3 * i, 0));
  } else if (c === 'val') {
    kwalls(g, K, 0.4, 0.45, 2.6, 1.7, 0, 0.9);
    g.add(blk(0.4, 1.7, 2.6, 2.05, 0, 0.04, K.base, 2)); arcade(g, 'z', 0.45, 2.55, 2.02, 0.5, 6, K.brick, K.wall);
    g.add(blk(0.4, 1.7, 2.6, 2.05, 0.5, 0.4, K.wall, 1.6)); winsAlong(g, K, 'z', 0.4, 2.6, 2.05, 0.6, null, 0.42, 0.14, 0.2);
    winsAlong(g, K, 'x', 0.45, 2.05, 2.6, 0.6, null, 0.42, 0.14, 0.2);
    kroof(g, K, 0.4, 0.45, 2.6, 2.05, 0.9);
    g.add(at(cyl(0.16, 0.17, 0.3, K.wall, 12, 2), 1.5, 1.45, 1.25)); helmet(g, 1.5, 1.6, 1.25, 0.15, K.lead);
  } else if (c === 'ung') {
    kwalls(g, K, 0.4, 0.4, 2.6, 1.3, 0, 0.5, { m: K.stone }); kwalls(g, K, 0.4, 0.4, 2.6, 1.3, 0.5, 0.42, { plinth: false });
    kwalls(g, K, 0.4, 1.3, 1.3, 2.6, 0, 0.5, { m: K.stone }); kwalls(g, K, 0.4, 1.3, 1.3, 2.6, 0.5, 0.42, { plinth: false });
    arcade(g, 'z', 1.3, 2.6, 1.32, 0.42, 3, K.stone); arcade(g, 'x', 1.32, 2.6, 1.32, 0.42, 3, K.stone);
    winsAlong(g, K, 'z', 1.3, 2.6, 1.3, 0.62, null, 0.4, 0.13, 0.18, { style: 'rect' }); winsAlong(g, K, 'x', 1.3, 2.6, 1.3, 0.62, null, 0.4, 0.13, 0.18);
    kroof(g, K, 0.4, 0.4, 2.6, 1.3, 0.92, { alongX: true }); kroof(g, K, 0.4, 1.3, 1.3, 2.6, 0.92, { alongX: false });
    ktower(g, K, 1.32, 1.32, 0.14, 1.35, { round: true, top: 'spire4', pitch: 4.5, glazed: true });
    shadoof(g, 2.2, 2.2);
  } else if (c === 'pol') {
    // Collegium Maius: aripi de cărămidă în jurul unei curți cu arcade
    kwalls(g, K, 0.4, 0.4, 2.6, 1.25, 0, 0.95); kwalls(g, K, 0.4, 1.25, 1.25, 2.6, 0, 0.95);
    arcade(g, 'z', 1.25, 2.6, 1.27, 0.46, 3, PM('#efe8dc', 0.9)); arcade(g, 'x', 1.27, 2.6, 1.27, 0.46, 3, PM('#efe8dc', 0.9));
    winsAlong(g, K, 'z', 1.25, 2.6, 1.25, 0.6, null, 0.4, 0.13, 0.24); winsAlong(g, K, 'x', 1.25, 2.6, 1.25, 0.6, null, 0.4, 0.13, 0.24);
    kroof(g, K, 0.4, 0.4, 2.6, 1.25, 0.95, { alongX: true }); kroof(g, K, 0.4, 1.25, 1.25, 2.6, 0.95, { alongX: false });
    const t = ktower(g, K, 0.85, 0.85, 0.2, 1.55, { round: false, top: 'crenel', m: K.brick, fin: false }); helmet(g, 0.85, t - 0.06, 0.85, 0.15, K.copper, 'spike');
    g.add(blk(1.95, 1.18, 2.25, 1.27, 0.55, 0.32, PM('#efe8dc', 0.9)));
  } else if (c === 'oto') {
    // medrese: chilii cu cupole mici în U, sala mare cu cupolă, fântână în curte
    g.add(blk(0.4, 0.4, 2.6, 1.0, 0, 0.5, K.stone, 1.6)); g.add(blk(0.4, 1.0, 1.0, 2.6, 0, 0.5, K.stone, 1.6));
    [0.75, 1.3, 1.85, 2.35].forEach(x => domeOn(g, x, 0.7, 0.5, 0.22, K.lead, { drum: 0.04, drumM: K.stone, fin: false }));
    [1.3, 1.85, 2.35].forEach(z => domeOn(g, 0.7, z, 0.5, 0.22, K.lead, { drum: 0.04, drumM: K.stone, fin: false }));
    arcade(g, 'z', 1.0, 2.6, 1.04, 0.42, 4, PM('#f2ead8', 0.9)); arcade(g, 'x', 1.04, 2.6, 1.04, 0.42, 4, PM('#f2ead8', 0.9));
    g.add(blk(1.95, 1.95, 2.65, 2.65, 0, 0.62, K.stone, 1.6)); domeOn(g, 2.3, 2.3, 0.62, 0.36, K.lead, { drum: 0.1, drumM: K.stone, wins: 8 });
    door(g, 'z', 2.18, 2.42, 2.65, 0.44, { style: 'arch' });
    g.add(at(cyl(0.14, 0.16, 0.12, K.stone, 8, 2), 1.55, 0.06, 1.55)); domeOn(g, 1.55, 1.55, 0.12, 0.13, K.lead, { drum: 0.05, drumM: K.wall, fs: 0.6 });
    cypress(g, 1.2, 2.3, 0.7);
  } else if (c === 'tat') {
    // medreseaua Zincirli: sală de piatră cu cupolă, galerie pictată, poartă cu arc
    g.add(blk(0.5, 0.5, 1.9, 1.9, 0, 0.62, K.stone, 1.6)); domeOn(g, 1.2, 1.2, 0.62, 0.56, K.lead, { drum: 0.12, drumM: K.stone, wins: 8 });
    g.add(blk(0.5, 1.9, 1.9, 2.25, 0, 0.04, K.base, 2)); posts(g, [0.55, 0.9, 1.25, 1.6, 1.85], 2.2, 0.5, PM('#2a5a8a', 0.7), 0.022);
    g.add(hipRoof(0.45, 1.88, 1.95, 2.32, 0.5, 0.14, K.roof)); paintedEave(g, 0.45, 1.88, 1.95, 2.32, 0.5);
    door(g, 'z', 1.07, 1.33, 1.9, 0.42, { style: 'arch', col: '#2a5a8a' });
    g.add(blk(2.15, 1.0, 2.55, 1.5, 0, 0.7, K.stone, 1.6)); door(g, 'x', 1.12, 1.38, 2.55, 0.46, { style: 'arch', col: '#2a2016' }); g.add(blk(2.12, 0.97, 2.58, 1.53, 0.7, 0.06, PM('#2a5a8a', 0.7)));
    cypress(g, 2.5, 2.4, 0.8); cypress(g, 2.75, 2.1, 0.7); carpet(g, 1.2, 2.6, 0.5, 0.3, 0, 1);
  }
  topFlag(g, c === 'oto' || c === 'tat' ? 2.75 : 2.6, 0, c === 'oto' || c === 'tat' ? 2.75 : 2.7, 0.8, 0.22);
};
B.atelier = (g, K) => {
  const c = K.civ;
  ground(g, 0.1, 0.1, 2.9, 2.9, 'forest_ground_04', '#d8c8a0');
  if (c === 'tat') { yurt(g, 0.8, 0.8, 0.45, { felt: '#d8c8b0' }); tentStriped(g, 2.4, 0.65, 0.3, 0.22, 0.26, 10); }
  else {
    g.add(blk(0.35, 0.35, 2.65, 0.55, 0, 0.62, c === 'mol' ? K.logs : c === 'oto' ? K.stone : K.planks, 2)); g.add(blk(0.35, 0.55, 0.55, 1.6, 0, 0.62, c === 'mol' ? K.logs : c === 'oto' ? K.stone : K.planks, 2));
    posts(g, [1.1, 1.9, 2.6], 1.55, 0.62, K.timber, 0.03);
    kroof(g, K, 0.35, 0.35, 2.65, 1.6, 0.62, { alongX: true, pitch: Math.min(K.pitch, 1.2) * 0.8, steps: false, timber: false });
  }
  // un berbece pe jumătate făcut și o catapultă
  g.add(at(box(0.55, 0.04, 0.26, K.planks), 1.6, 0.12, 2.25)); [[1.4, 2.12], [1.8, 2.12], [1.4, 2.38], [1.8, 2.38]].forEach(([x, z]) => g.add(at(mesh(new THREE.TorusGeometry(0.06, 0.012, 5, 12), PM('#5a3e22')), x, 0.06, z)));
  g.add(at(cyl(0.035, 0.035, 0.7, TM('medieval_wood', '#a08060'), 10, 2), 1.6, 0.2, 2.25, 0, 0, Math.PI / 2)); g.add(at(cone(0.05, 0.1, PM('#4a4e54', 0.45, 0.85), 10), 2.0, 0.2, 2.25, 0, 0, -Math.PI / 2));
  [[0.75, 0.0], [0.75, 0.25]].forEach(([x, dz]) => { g.add(at(box(0.04, 0.5, 0.04, PM('#6e4b2a')), 0.55, 0.25, 2.15 + dz, 0, 0, 0.25)); });
  g.add(at(box(0.6, 0.03, 0.03, PM('#6e4b2a')), 0.75, 0.32, 2.27, 0, 0, -0.5));
  [0, 2.1, 4.2].forEach(a => { const l = cyl(0.012, 0.012, 0.95, PM('#6e4b2a'), 5); at(l, 2.5 + Math.cos(a) * 0.14, 0.44, 1.95 + Math.sin(a) * 0.14, Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); g.add(l); });
  g.add(at(cyl(0.002, 0.002, 0.4, PM('#3a2a1a'), 4), 2.5, 0.68, 1.95)); g.add(at(box(0.08, 0.08, 0.08, TM('castle_wall_slates', '#c8c0b4')), 2.5, 0.45, 1.95));
  logPile(g, 2.3, 2.65, 2, 0.5); [[1.0, 2.7], [1.15, 2.75]].forEach(([x, z]) => g.add(at(mesh(new THREE.TorusGeometry(0.08, 0.014, 5, 12), PM('#5a3e22')), x, 0.08, z, 0, 0.6, 0)));
  topFlag(g, 2.75, 0, 0.3, 0.9, 0.22);
};

// ---------- portul (pe apă): ponton pe piloni, magazia în stilul civilizației, macara, butoaie ----------
B.port = (g, K) => {
  const c = K.civ, deckM = TM('brown_planks_05', '#e8d4b8', 0.9, 1.2), top = new THREE.Group(); top.position.y = 0.12; g.add(top);
  g.add(blk(0.12, 0.12, 2.88, 2.88, 0.05, 0.07, deckM, 2.2));
  for (let i = 0; i < 5; i++) [[0.16 + i * 0.67, 2.86], [2.86, 0.16 + i * 0.67]].forEach(([x, z]) => g.add(at(cyl(0.045, 0.05, 0.26, TM('medieval_wood', '#8a6a48'), 8, 2), x, -0.02, z)));
  [[2.86, 2.86], [0.16, 2.86], [2.86, 0.16]].forEach(([x, z]) => top.add(at(cyl(0.035, 0.04, 0.12, K.timber, 8), x, 0.06, z)));
  if (c === 'tat') { tentStriped(top, 0.95, 0.95, 0.5, 0.3, 0.38, 12); carpet(top, 1.9, 1.0, 0.4, 0.3, 0.3, 1); }
  else if (c === 'oto') { top.add(blk(0.3, 0.3, 1.5, 1.4, 0, 0.42, K.stone, 1.6)); domeOn(top, 0.9, 0.85, 0.42, 0.3, K.lead, { drum: 0.05, drumM: K.stone, fs: 0.7 }); door(top, 'z', 0.78, 1.02, 1.4, 0.32, { style: 'arch' }); door(top, 'x', 0.72, 0.98, 1.5, 0.32, { style: 'arch' }); }
  else hall(top, K, 0.3, 0.3, 1.55, 1.35, 0.42, { dw: 0.24, roof: { alongX: true, pitch: Math.min(K.pitch, 1.25), steps: K.civ === 'pol' } });
  // macaraua cu o ladă atârnată
  top.add(at(cyl(0.025, 0.03, 0.75, K.timber, 8), 2.4, 0.375, 0.55)); const jib = box(0.6, 0.03, 0.03, K.timber); at(jib, 2.6, 0.72, 0.75, 0, -Math.PI / 4, -0.35); top.add(jib);
  top.add(at(cyl(0.003, 0.003, 0.3, PM('#3a2a1a'), 4), 2.78, 0.62, 0.93)); top.add(at(box(0.1, 0.08, 0.1, TM('raw_plank_wall', '#c8a888'), 3), 2.78, 0.44, 0.93));
  barrel(top, 2.2, 2.3); barrel(top, 2.35, 2.42, 0.9); crate(top, 1.9, 2.55); crate(top, 2.55, 1.95, 1, 0.5); crate(top, 2.6, 2.1, 0.8, 0.2);
  for (let i = 0; i < 3; i++) top.add(at(cyl(0.035, 0.035, 0.03, cloth('#c8b48a', 'linen'), 10), 1.4 + i * 0.12, 0.015 + i * 0.03, 2.5, 0, 0, Math.PI / 2));
  topFlag(top, 2.75, 0, 2.75, 0.85, 0.24);
};

// ---------- centrul orașului ----------
B.cetate = (g, K) => {
  const c = K.civ;
  ground(g, 0.25, 0.25, 3.75, 3.75, 'forest_ground_04', '#c8b8a0');
  if (c === 'tat') {
    // tabăra hanului: gard de pari, iurta mare cu bandă și vârf de aur, iurte mici, stindarde
    const ring = []; for (let i = 0; i <= 26; i++) { const a = Math.PI * 0.85 + i / 26 * Math.PI * 1.55; ring.push([2 + Math.cos(a) * 1.75, 2 + Math.sin(a) * 1.75]); }
    ring.forEach(([x, z], i) => { if (i % 1 === 0) { g.add(at(cyl(0.03, 0.035, 0.42, TM('medieval_wood', '#a08060'), 6, 2), x, 0.21, z)); g.add(at(cone(0.03, 0.06, TM('medieval_wood', '#a08060'), 6), x, 0.45, z)); } });
    yurt(g, 1.75, 1.75, 0.95, { top: 'crescent', roof: '#f2ead8', door: '#c8962a' });
    yurt(g, 0.85, 2.85, 0.42, {}); yurt(g, 2.95, 0.85, 0.42, {}); yurt(g, 0.8, 1.0, 0.36, { felt: '#d8c8a8' });
    tug(g, 2.85, 2.85, 1.15); tug(g, 2.55, 3.15, 0.95); tug(g, 3.15, 2.55, 0.95);
    carpet(g, 2.75, 2.15, 0.6, 0.4, 0.785, 0); carpet(g, 2.2, 2.85, 0.6, 0.4, 0.785, 2);
    ktower(g, K, 3.35, 3.35, 0.2, 0.75, { round: false, fin: false });
    return;
  }
  const WH = c === 'oto' ? 0.5 : 0.62;
  const wallM = c === 'val' ? null : c === 'oto' ? K.stone : K.stone;
  const wallSeg = (x0, z0, x1, z1) => { if (c === 'val') banded(g, x0, z0, x1, z1, 0, WH, K.stone, K.brick, 0.07); else g.add(blk(x0, z0, x1, z1, 0, WH, wallM, 1.6)); };
  wallSeg(0.32, 0.32, 3.68, 0.62); wallSeg(0.32, 0.62, 0.62, 3.68); wallSeg(0.62, 3.38, 1.7, 3.68); wallSeg(2.3, 3.38, 3.68, 3.68); wallSeg(3.38, 0.62, 3.68, 3.38);
  const cm = c === 'val' ? K.brick : wallM;
  crenels(g, 0.4, 0.47, 3.6, 0.47, WH, cm); crenels(g, 0.47, 0.7, 0.47, 3.6, WH, cm); crenels(g, 0.7, 3.53, 1.65, 3.53, WH, cm); crenels(g, 2.35, 3.53, 3.6, 3.53, WH, cm); crenels(g, 3.53, 0.7, 3.53, 3.3, WH, cm);
  if (c === 'mol') { g.add(blk(0.62, 3.6, 1.7, 3.72, WH, 0.12, K.planks, 2)); g.add(blk(2.3, 3.6, 3.68, 3.72, WH, 0.12, K.planks, 2)); g.add(blk(3.6, 0.62, 3.72, 3.38, WH, 0.12, K.planks, 2)); }
  // poarta
  const gh = WH + 0.28; g.add(blk(1.7, 3.3, 1.88, 3.76, 0, gh, c === 'val' ? K.brick : cm, 2)); g.add(blk(2.12, 3.3, 2.3, 3.76, 0, gh, c === 'val' ? K.brick : cm, 2)); g.add(blk(1.7, 3.3, 2.3, 3.76, WH - 0.04, gh - WH + 0.04, c === 'val' ? K.brick : cm, 2));
  g.add(at(box(0.24, 0.4, 0.03, K.planks, 3), 2.0, 0.2, 3.62)); banner(g, 'z', 1.79, 3.76, gh - 0.04, 0.14, 0.34); banner(g, 'z', 2.21, 3.76, gh - 0.04, 0.14, 0.34);
  if (c === 'mol') {
    [[0.45, 0.45], [3.55, 0.45], [0.45, 3.55], [3.55, 3.55]].forEach(([x, z]) => ktower(g, K, x, z, 0.4, 1.0, { fin: 'ball' }));
    g.add(blk(1.3, 1.3, 2.7, 2.7, 0, 0.62, K.stone, 1.6)); kwalls(g, K, 1.32, 1.32, 2.68, 2.68, 0.62, 0.68, { plinth: false });
    [[1.6, 1.82], [2.15, 2.37]].forEach(p => { kwin(g, K, 'z', p[0], p[1], 2.68, 0.85, 1.07); kwin(g, K, 'x', p[0], p[1], 2.68, 0.85, 1.07); });
    door(g, 'z', 1.88, 2.12, 2.7, 0.42, { style: 'arch' });
    kroof(g, K, 1.32, 1.32, 2.68, 2.68, 1.3, { eave: 0.14, pitch: 1.2 }); topFlag(g, 2, 2.1, 2, 0.4, 0.26);
  } else if (c === 'val') {
    [[3.55, 0.45], [0.45, 3.55], [3.55, 3.55]].forEach(([x, z]) => ktower(g, K, x, z, 0.36, 0.95, { m: K.brick, top: 'cone', pitch: 1.8, fin: 'ball' }));
    ktower(g, K, 0.62, 0.62, 0.5, 1.95, { m: K.stone });
    banded(g, 1.3, 1.25, 2.75, 2.6, 0, 1.0, K.wall, K.brick, 0.07);
    g.add(blk(1.3, 2.6, 2.75, 2.95, 0, 0.04, K.base, 2)); arcade(g, 'z', 1.32, 2.73, 2.93, 0.48, 4, K.brick, K.wall); g.add(blk(1.3, 2.6, 2.75, 2.95, 0.52, 0.48, K.wall, 1.6));
    winsAlong(g, K, 'z', 1.3, 2.75, 2.95, 0.66, null, 0.36, 0.13, 0.2); winsAlong(g, K, 'x', 1.25, 2.95, 2.75, 0.66, null, 0.36, 0.13, 0.2);
    kroof(g, K, 1.3, 1.25, 2.75, 2.95, 1.0); topFlag(g, 2.02, 1.55, 2.1, 0.4, 0.26);
  } else if (c === 'ung') {
    [[3.55, 0.45], [0.45, 3.55], [3.55, 3.55], [0.45, 0.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.3, 0.98, { round: false, top: 'spire4', pitch: 3.0 }));
    kwalls(g, K, 1.25, 1.35, 2.75, 2.6, 0, 0.5, { m: K.stone }); kwalls(g, K, 1.25, 1.35, 2.75, 2.6, 0.5, 0.5, { plinth: false });
    winsAlong(g, K, 'z', 1.25, 2.75, 2.6, 0.2, 2.0, 0.42, 0.14, 0.2); winsAlong(g, K, 'z', 1.25, 2.75, 2.6, 0.66, null, 0.42, 0.14, 0.18, { style: 'rect' }); winsAlong(g, K, 'x', 1.35, 2.6, 2.75, 0.66, null, 0.42, 0.14, 0.18);
    door(g, 'z', 1.88, 2.12, 2.6, 0.4, { style: 'lancet' });
    kroof(g, K, 1.25, 1.35, 2.75, 2.6, 1.0, { alongX: true });
    ktower(g, K, 1.1, 1.15, 0.3, 2.1, { round: false, top: 'spire4', pitch: 3.6, glazed: true });
    win(g, 'z', 1.03, 1.17, 1.45, 1.75, 1.95, { col: '#f0eadc', frame: '#3a2a1a' }); topFlag(g, 2.75, 1.9, 2.0, 0.36, 0.22);
  } else if (c === 'pol') {
    [[3.55, 0.45], [0.45, 3.55], [3.55, 3.55], [0.45, 0.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.32, 1.1, { round: false, m: K.brick }));
    kwalls(g, K, 1.25, 1.35, 2.75, 2.6, 0, 1.05);
    for (let i = 0; i < 4; i++) win(g, 'z', 1.38 + i * 0.34, 1.52 + i * 0.34, 2.6, 0.62, 0.92, { style: 'lancet', col: '#1a2026', frame: '#efe8dc' });
    winsAlong(g, K, 'x', 1.35, 2.6, 2.75, 0.62, null, 0.4, 0.13, 0.28);
    door(g, 'z', 1.88, 2.12, 2.6, 0.42, { style: 'arch', col: '#3a2414' });
    kroof(g, K, 1.25, 1.35, 2.75, 2.6, 1.05, { alongX: true });
    topFlag(g, 2.0, 1.85, 1.97, 0.4, 0.24);
  } else if (c === 'oto') {
    [[3.55, 0.45], [0.45, 3.55], [3.55, 3.55], [0.45, 0.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.36, 0.85));
    g.add(blk(1.25, 1.25, 2.75, 2.75, 0, 0.75, K.stone, 1.6));
    domeOn(g, 2.0, 2.0, 0.75, 0.62, K.lead, { drum: 0.14, drumM: K.stone, wins: 12, fs: 1.3 });
    g.add(blk(1.25, 2.75, 2.75, 3.05, 0, 0.03, K.base, 2)); arcade(g, 'z', 1.28, 2.72, 3.03, 0.52, 4, PM('#f2ead8', 0.9)); g.add(blk(1.25, 2.75, 2.75, 3.05, 0.55, 0.05, K.stone));
    g.add(hipRoof(1.2, 2.72, 2.8, 3.1, 0.6, 0.1, K.roof));
    door(g, 'z', 1.85, 2.15, 2.75, 0.48, { style: 'arch', col: '#2a3a3a' }); winsAlong(g, K, 'x', 1.25, 2.75, 2.75, 0.32, null, 0.4);
    minaret(g, 3.05, 1.4, 2.2, K.wall, K.lead, { r: 0.09 });
    topFlag(g, 1.35, 0.75, 2.6, 0.4, 0.24); cypress(g, 3.1, 3.05, 0.6);
  }
};
// ---------- fortăreața ----------
B.fortareata = (g, K) => {
  const c = K.civ;
  ground(g, 0.2, 0.2, 3.8, 3.8, 'river_small_rocks', '#c0b8a8');
  if (c === 'tat') {
    // cetate de piatră cu val de pământ, turn de poartă cu foișor, iurta hanului înăuntru
    const earth = TM('dry_ground_01', '#d0c0a0', 1);
    [[0.25, 0.25, 3.75, 0.7], [0.25, 0.7, 0.7, 3.75]].forEach(([x0, z0, x1, z1]) => g.add(blk(x0, z0, x1, z1, 0, 0.22, earth, 2)));
    const W = (x0, z0, x1, z1) => { g.add(blk(x0, z0, x1, z1, 0, 0.82, K.stone, 1.6)); };
    W(0.4, 0.4, 3.6, 0.7); W(0.4, 0.7, 0.7, 3.6); W(0.7, 3.3, 1.6, 3.6); W(2.4, 3.3, 3.6, 3.6); W(3.3, 0.7, 3.6, 3.3);
    crenels(g, 0.5, 0.55, 3.5, 0.55, 0.82, K.stone); crenels(g, 0.55, 0.8, 0.55, 3.5, 0.82, K.stone); crenels(g, 0.8, 3.45, 1.55, 3.45, 0.82, K.stone); crenels(g, 2.45, 3.45, 3.5, 3.45, 0.82, K.stone); crenels(g, 3.45, 0.8, 3.45, 3.2, 0.82, K.stone);
    ktower(g, K, 2.0, 3.45, 0.42, 1.25, { fin: 'crescent' }); g.add(at(box(0.36, 0.46, 0.04, PM('#2a2016')), 2.0, 0.23, 3.89)); g.add(blk(1.82, 3.86, 2.18, 3.9, 0.46, 0.05, PM('#2a5a8a', 0.7)));
    [[0.55, 0.55], [3.45, 0.55], [0.55, 3.45], [3.45, 3.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.3, 1.05, { fin: false }));
    yurt(g, 1.9, 1.9, 0.7, { top: 'crescent', door: '#c8962a' }); tug(g, 2.7, 2.6, 1.1); banner(g, 'z', 1.55, 3.6, 0.78, 0.14, 0.32); banner(g, 'z', 2.45, 3.6, 0.78, 0.14, 0.32);
    return;
  }
  if (c === 'oto') {
    // Rumeli Hisarı: trei turnuri uriașe cu conuri de plumb, ziduri care le leagă
    const W = (x0, z0, x1, z1) => { g.add(blk(x0, z0, x1, z1, 0, 0.9, K.stone, 1.6)); };
    W(0.6, 0.4, 3.4, 0.7); W(0.4, 0.6, 0.7, 3.4); W(3.3, 0.6, 3.6, 2.6); W(0.6, 3.3, 2.6, 3.6); W(2.4, 2.4, 3.5, 2.7); W(2.4, 2.4, 2.7, 3.5);
    crenels(g, 0.7, 0.55, 3.3, 0.55, 0.9, K.stone); crenels(g, 0.55, 0.7, 0.55, 3.3, 0.9, K.stone); crenels(g, 3.45, 0.7, 3.45, 2.5, 0.9, K.stone); crenels(g, 0.7, 3.45, 2.5, 3.45, 0.9, K.stone);
    ktower(g, K, 0.75, 0.75, 0.62, 1.7); ktower(g, K, 3.3, 2.95, 0.52, 1.4); ktower(g, K, 2.95, 3.3, 0.5, 1.35);
    door(g, 'z', 1.4, 1.75, 3.6, 0.52, { style: 'arch', col: '#2a2016' }); banner(g, 'z', 1.2, 3.6, 0.86, 0.14, 0.34); banner(g, 'z', 1.95, 3.6, 0.86, 0.14, 0.34);
    minaret(g, 1.9, 1.6, 1.8, K.wall, K.lead, { r: 0.07 }); g.add(blk(1.1, 1.9, 2.0, 2.6, 0, 0.42, K.stone, 1.6)); domeOn(g, 1.55, 2.25, 0.42, 0.3, K.lead, { drum: 0.06, drumM: K.stone });
    return;
  }
  const H = 0.95, wallM = c === 'pol' ? K.brick : K.stone;
  const W = (x0, z0, x1, z1) => { if (c === 'val') banded(g, x0, z0, x1, z1, 0, H, K.stone, K.brick, 0.08); else g.add(blk(x0, z0, x1, z1, 0, H, wallM, 1.6)); };
  if (c === 'val') { const rock = mesh(new THREE.SphereGeometry(2.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), TM('castle_wall_slates', '#c8c0b4', 0.95, 1.5)); rock.scale.set(1, 0.14, 1); at(rock, 2, -0.02, 2); g.add(rock); g.position.y = 0; }
  W(0.4, 0.4, 3.6, 0.72); W(0.4, 0.72, 0.72, 3.6); W(0.72, 3.28, 1.65, 3.6); W(2.35, 3.28, 3.6, 3.6); W(3.28, 0.72, 3.6, 3.28);
  const cm = c === 'val' ? K.brick : wallM;
  crenels(g, 0.5, 0.56, 3.5, 0.56, H, cm); crenels(g, 0.56, 0.8, 0.56, 3.5, H, cm); crenels(g, 0.8, 3.44, 1.6, 3.44, H, cm); crenels(g, 2.4, 3.44, 3.5, 3.44, H, cm); crenels(g, 3.44, 0.8, 3.44, 3.2, H, cm);
  g.add(blk(1.65, 3.2, 2.35, 3.7, 0, H + 0.3, cm, 2)); g.add(at(box(0.32, 0.5, 0.04, PM('#1a140e')), 2.0, 0.25, 3.71)); for (let i = 0; i < 4; i++) g.add(at(box(0.012, 0.48, 0.012, PM('#2e3034', 0.5, 0.8)), 1.88 + i * 0.08, 0.26, 3.73));
  banner(g, 'z', 1.78, 3.7, H + 0.22, 0.14, 0.36); banner(g, 'z', 2.22, 3.7, H + 0.22, 0.14, 0.36);
  if (c === 'mol') {
    // Neamț / Suceava: bastioane semirotunde, donjon alb cu acoperiș abrupt, hurdă de lemn
    [[3.6, 1.5, 'x'], [3.6, 2.6, 'x'], [1.0, 3.6, 'z'], [3.0, 3.6, 'z']].forEach(([x, z, f]) => { g.add(at(cyl(0.3, 0.32, H + 0.1, K.stone, 18, 1.6, false, f === 'x' ? 0 : -Math.PI / 2, Math.PI), x, (H + 0.1) / 2, z)); });
    [[0.55, 0.55], [3.45, 0.55], [0.55, 3.45], [3.45, 3.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.42, 1.3, { fin: 'ball' }));
    g.add(blk(1.3, 1.3, 2.5, 2.5, 0, 1.2, K.stone, 1.6)); kwalls(g, K, 1.32, 1.32, 2.48, 2.48, 1.2, 0.5, { plinth: false });
    kwin(g, K, 'z', 1.8, 2.0, 2.48, 1.35, 1.55); kwin(g, K, 'x', 1.8, 2.0, 2.48, 1.35, 1.55);
    kroof(g, K, 1.32, 1.32, 2.48, 2.48, 1.7, { eave: 0.12, pitch: 1.4 }); topFlag(g, 1.9, 2.5, 1.9, 0.42, 0.26);
  } else if (c === 'val') {
    [[3.45, 0.55], [0.55, 3.45], [3.45, 3.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.4, 1.3, { m: K.stone }));
    ktower(g, K, 0.7, 0.7, 0.55, 2.2, { m: K.stone });
    banded(g, 1.4, 1.4, 2.6, 2.6, 0, 1.3, K.stone, K.brick, 0.08); kroof(g, K, 1.4, 1.4, 2.6, 2.6, 1.3, { pitch: 1.2 }); topFlag(g, 2.0, 1.95, 2.0, 0.42, 0.26);
    winsAlong(g, K, 'z', 1.4, 2.6, 2.6, 0.85, null, 0.4, 0.13, 0.22); winsAlong(g, K, 'x', 1.4, 2.6, 2.6, 0.85, null, 0.4, 0.13, 0.22);
  } else if (c === 'ung') {
    // castel gotic: turnuri rotunde cu coifuri smălțuite, hurde cu bârne
    [[0.55, 0.55, 1.6], [3.45, 0.55, 1.35], [0.55, 3.45, 1.35], [3.45, 3.45, 1.45]].forEach(([x, z, h]) => { ktower(g, K, x, z, 0.38, h, { round: true, top: 'cone', pitch: 3.2, fin: 'ball' }); });
    g.add(blk(1.3, 1.3, 2.7, 2.6, 0, 1.25, K.stone, 1.6)); kwalls(g, K, 1.28, 1.28, 2.72, 2.62, 1.25, 0.32, { plinth: false });
    winsAlong(g, K, 'z', 1.3, 2.7, 2.6, 0.7, null, 0.42, 0.14, 0.28); winsAlong(g, K, 'x', 1.3, 2.6, 2.7, 0.7, null, 0.42, 0.14, 0.28);
    g.add(gableRoof(1.28, 1.28, 2.72, 2.62, 1.57, 1.0, glazedMat(), true, K.wall, 0.06)); topFlag(g, 2.72, 2.55, 1.95, 0.36, 0.24);
  } else if (c === 'pol') {
    // Malbork: patru aripi de cărămidă cu acoperișuri abrupte, turn pătrat cu turlă de cupru
    [[0.55, 0.55], [3.45, 0.55], [0.55, 3.45], [3.45, 3.45]].forEach(([x, z]) => ktower(g, K, x, z, 0.34, 1.35, { round: false, m: K.brick }));
    g.add(blk(1.15, 1.15, 2.85, 1.6, 0, 1.25, K.brick, 1.6)); g.add(blk(1.15, 1.6, 1.6, 2.85, 0, 1.25, K.brick, 1.6));
    kwalls(g, K, 1.6, 2.4, 2.85, 2.85, 0, 1.25); kwalls(g, K, 2.4, 1.6, 2.85, 2.4, 0, 1.25);
    for (let i = 0; i < 4; i++) win(g, 'z', 1.68 + i * 0.29, 1.8 + i * 0.29, 2.85, 0.5, 0.95, { style: 'lancet', col: '#1a2026', frame: '#efe8dc' });
    for (let i = 0; i < 3; i++) win(g, 'x', 1.7 + i * 0.36, 1.82 + i * 0.36, 2.85, 0.5, 0.95, { style: 'lancet', col: '#1a2026', frame: '#efe8dc' });
    kroof(g, K, 1.15, 1.15, 2.85, 1.6, 1.25, { alongX: true, steps: false }); kroof(g, K, 1.15, 1.6, 1.6, 2.85, 1.25, { alongX: false, steps: false });
    kroof(g, K, 1.6, 2.4, 2.85, 2.85, 1.25, { alongX: true }); kroof(g, K, 2.4, 1.6, 2.85, 2.4, 1.25, { alongX: false });
    ktower(g, K, 1.38, 1.38, 0.24, 2.1, { round: false, m: K.brick, top: 'pyramid', pitch: 2.4 });
  }
};
// ---------- minunile ----------
B.minune = (g, K) => {
  const c = K.civ;
  ground(g, 0.2, 0.2, 4.8, 4.8, 'river_small_rocks', '#c8c0b0');
  if (c === 'mol') {
    // Mănăstirea Putna: incintă albă, biserica cu acoperiș abrupt și turlă pe stea, Turnul Tezaurului
    const enc = (x0, z0, x1, z1, h) => { g.add(blk(x0, z0, x1, z1, 0, 0.08, K.base, 2)); g.add(blk(x0, z0, x1, z1, 0.08, h - 0.08, K.wall, 1.6)); g.add(hipRoof(x0 - 0.05, z0 - 0.05, x1 + 0.05, z1 + 0.05, h, 0.1, K.roof)); };
    enc(0.3, 0.3, 4.7, 0.55, 0.62); enc(0.3, 0.55, 0.55, 4.7, 0.62); enc(4.45, 0.55, 4.7, 2.0, 0.62); enc(0.55, 4.45, 2.0, 4.7, 0.62);
    ktower(g, K, 0.75, 0.75, 0.45, 1.7, { round: false, m: K.stone, top: 'cone', pitch: 2.6 });
    kwalls(g, K, 4.2, 2.8, 4.75, 3.6, 0, 1.15); door(g, 'x', 3.05, 3.35, 4.75, 0.5, { style: 'arch' }); kroof(g, K, 4.2, 2.8, 4.75, 3.6, 1.15, { pitch: 2.0 });
    g.add(blk(1.5, 2.0, 3.9, 3.0, 0, 0.1, K.base, 3));
    g.add(blk(1.55, 2.05, 3.85, 2.95, 0.1, 0.95, K.wall, 1.6)); g.add(at(cyl(0.45, 0.45, 1.05, K.wall, 16, 1, false, Math.PI, Math.PI), 1.55, 0.52, 2.5));
    for (let i = 0; i < 9; i++) { win(g, 'z', 1.68 + i * 0.24, 1.84 + i * 0.24, 2.95, 0.72, 0.92, { style: 'arch', col: '#d8d2c4' }); g.add(at(cyl(0.025, 0.025, 0.01, PM(['#2a6a3a', '#c8962a', '#7a3a1a'][i % 3], 0.4), 10), 1.76 + i * 0.24, 0.98, 2.96, Math.PI / 2)); }
    for (let i = 0; i < 4; i++) win(g, 'x', 2.2 + i * 0.16, 2.3 + i * 0.16, 3.85, 0.72, 0.92, { style: 'arch', col: '#d8d2c4' });
    door(g, 'x', 2.36, 2.64, 3.85, 0.52, { style: 'arch', col: '#3a2414', frame: '#d9b44a' });
    win(g, 'z', 2.2, 2.36, 2.95, 0.35, 0.58, { style: 'arch', col: '#1a1626', frame: '#d9b44a' }); win(g, 'z', 3.2, 3.36, 2.95, 0.35, 0.58, { style: 'arch', col: '#1a1626', frame: '#d9b44a' });
    g.add(hipRoof(1.28, 1.8, 4.1, 3.2, 1.05, 1.0, K.roof, 1.4));
    const s1 = box(0.56, 0.18, 0.56, K.wall); at(s1, 2.55, 1.85, 2.5, 0, Math.PI / 4, 0); g.add(s1); g.add(at(box(0.56, 0.18, 0.56, K.wall), 2.55, 1.85, 2.5));
    g.add(at(cyl(0.25, 0.25, 0.5, K.wall, 16, 1), 2.55, 2.18, 2.5)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(at(box(0.012, 0.22, 0.06, PM('#1a1626')), 2.55 + Math.cos(a) * 0.255, 2.2, 2.5 + Math.sin(a) * 0.255, 0, -a, 0)); }
    g.add(at(cone(0.34, 0.52, K.roof, 16, 1.4), 2.55, 2.69, 2.5)); finial(g, 2.55, 2.95, 2.5, 'cross', 1.6);
    banner(g, 'x', 3.0, 4.75, 1.05, 0.16, 0.36); banner(g, 'x', 3.4, 4.75, 1.05, 0.16, 0.36);
    [[3.3, 4.0], [1.0, 3.8], [4.0, 1.0]].forEach(([x, z]) => { g.add(at(cone(0.22, 0.8, cloth('#2a4a2a', 'fur', 1), 8), x, 0.5, z)); g.add(at(cyl(0.03, 0.04, 0.15, PM('#4a3020'), 6), x, 0.07, z)); });
  } else if (c === 'val') {
    // Biserica Episcopală de la Curtea de Argeș: soclu, turle răsucite, ornamente, coifuri de plumb
    g.add(blk(1.2, 1.3, 4.0, 3.7, 0, 0.18, K.base, 3)); for (let i = 0; i < 3; i++) g.add(blk(4.0 + i * 0.1, 2.1, 4.1 + i * 0.1, 2.9, 0, 0.18 - i * 0.06, K.base, 3));
    const WS = TM('plastered_wall', '#f4ecdc', 0.9, 0.8);
    g.add(blk(1.4, 1.5, 3.9, 3.5, 0.18, 1.0, WS, 1.6)); g.add(at(cyl(0.65, 0.65, 1.0, WS, 18, 1, false, Math.PI, Math.PI), 1.4, 0.68, 2.5));
    [0.45, 0.85, 1.12].forEach(y => { g.add(blk(1.38, 1.48, 3.92, 3.52, y, 0.035, K.gold, 2)); });
    for (let i = 0; i < 6; i++) { g.add(at(cyl(0.05, 0.05, 0.012, PM('#7a4a2a', 0.5), 12), 1.75 + i * 0.36, 1.0, 3.51, Math.PI / 2)); win(g, 'z', 1.68 + i * 0.36, 1.82 + i * 0.36, 3.5, 0.55, 0.8, { style: 'arch', col: '#1a1626', frame: '#c8a048' }); }
    for (let i = 0; i < 3; i++) win(g, 'x', 1.85 + i * 0.4, 1.99 + i * 0.4, 3.9, 0.55, 0.8, { style: 'arch', col: '#1a1626', frame: '#c8a048' });
    door(g, 'x', 2.32, 2.68, 3.9, 0.66, { y0: 0.18, style: 'arch', col: '#3a2414', frame: '#d9b44a' });
    g.add(hipRoof(1.3, 1.4, 4.0, 3.6, 1.18, 0.3, K.lead, 1.4));
    twisted(g, 2.1, 2.5, 1.35, 0.42, 0.75, WS); helmet(g, 2.1, 2.1, 2.5, 0.42, K.lead);
    [[3.4, 1.95], [3.4, 3.05]].forEach(([x, z]) => { twisted(g, x, z, 1.3, 0.24, 0.9, WS); helmet(g, x, 2.2, z, 0.24, K.lead); });
    g.add(at(cyl(0.2, 0.22, 0.3, K.stone, 12, 2), 3.9, 0.15, 4.2)); g.add(at(cyl(0.22, 0.22, 0.04, K.stone, 12), 3.9, 0.32, 4.2));
    banner(g, 'x', 2.1, 3.9, 1.1, 0.16, 0.36); banner(g, 'x', 2.9, 3.9, 1.1, 0.16, 0.36);
    [[0.7, 4.2], [4.3, 0.8], [0.8, 0.8]].forEach(([x, z]) => { g.add(at(cone(0.24, 0.85, cloth('#2a4a2a', 'fur', 1), 8), x, 0.52, z)); g.add(at(cyl(0.03, 0.04, 0.15, PM('#4a3020'), 6), x, 0.07, z)); });
  } else if (c === 'ung') {
    // Castelul Huniazilor: pe stâncă, turnuri cu coifuri smălțuite, pod pe piloni
    const gm = glazedMat(['#9a3a24', '#d8a838', '#2a5a3a', '#e8dcc0']);
    const rock = mesh(new THREE.SphereGeometry(2.0, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), TM('castle_wall_slates', '#c8c0b4', 0.95, 1.5)); rock.scale.set(1.05, 0.22, 0.9); at(rock, 2.2, -0.02, 2.1); g.add(rock);
    g.add(blk(1.2, 1.1, 3.5, 2.9, 0.2, 1.3, K.stone, 1.6)); kwalls(g, K, 1.18, 1.08, 3.52, 2.92, 1.5, 0.35, { plinth: false });
    for (let i = 0; i < 5; i++) win(g, 'z', 1.4 + i * 0.42, 1.56 + i * 0.42, 2.9, 0.8, 1.2, { style: 'lancet', col: '#1e2430', frame: '#e8e0d0' });
    for (let i = 0; i < 4; i++) win(g, 'x', 1.3 + i * 0.4, 1.46 + i * 0.4, 3.5, 0.8, 1.2, { style: 'lancet', col: '#1e2430', frame: '#e8e0d0' });
    g.add(gableRoof(1.18, 1.08, 3.52, 2.92, 1.85, 1.15, gm, true, K.wall, 0.06));
    const tw = (x, z, r, h, p) => { g.add(at(cyl(r, r * 1.08, h, K.stone, 20, 1.6), x, h / 2, z)); g.add(at(cyl(r * 1.15, r * 1.15, 0.2, K.wall, 20, 1.6), x, h + 0.1, z)); timberFace(g, 'z', x - r * 0.8, x + r * 0.8, z + r * 1.1, h, h + 0.2, K.timber, false); g.add(at(cone(r * 1.3, r * p, gm, 20, 1.6), x, h + 0.2 + r * p / 2, z)); finial(g, x, h + 0.2 + r * p, z, 'ball', 1.2); };
    tw(1.15, 1.05, 0.36, 2.3, 3.6); tw(3.55, 1.1, 0.3, 2.0, 3.6); tw(1.15, 2.95, 0.3, 1.9, 3.4); tw(3.55, 2.95, 0.34, 2.15, 3.6); tw(2.35, 0.75, 0.24, 2.5, 4.0);
    for (let i = 0; i < 4; i++) { const z = 3.25 + i * 0.4, h = 0.9 - i * 0.12; g.add(blk(2.5, z - 0.07, 2.66, z + 0.07, 0, h, K.stone, 2)); }
    g.add(polys([[V(2.45, 0.92, 2.95), V(2.71, 0.92, 2.95), V(2.71, 0.5, 4.75), V(2.45, 0.5, 4.75)]], K.planks)); fencePosts(g, [[2.45, 3.0], [2.45, 4.7]], 0.1, K.timber);
    banner(g, 'z', 1.8, 2.92, 1.75, 0.16, 0.38); banner(g, 'z', 3.0, 2.92, 1.75, 0.16, 0.38);
  } else if (c === 'pol') {
    // Wawel: castelul cu curte în arcade, catedrala cu capela de aur și turnul cu coif verde
    const WS = TM('plastered_wall', '#f2e2c8', 0.95, 0.8), white = PM('#f4eee2', 0.9);
    g.add(blk(0.5, 0.5, 4.5, 1.5, 0, 1.3, WS, 1.6)); g.add(blk(0.5, 1.5, 1.5, 4.0, 0, 1.3, WS, 1.6));
    for (let fl = 0; fl < 3; fl++) { arcade(g, 'z', 1.5, 4.5, 1.52, 0.36 + fl * 0.0, 6, white); g.children.slice(-14).forEach(o => o.position.y += fl * 0.42); }
    for (let fl = 0; fl < 3; fl++) { arcade(g, 'x', 1.52, 4.0, 1.52, 0.36, 5, white); g.children.slice(-12).forEach(o => o.position.y += fl * 0.42); }
    g.add(hipRoof(0.42, 0.42, 4.58, 1.6, 1.3, 0.55, K.roof)); g.add(hipRoof(0.42, 1.55, 1.6, 4.08, 1.3, 0.55, K.roof));
    g.add(blk(2.3, 2.6, 4.5, 3.5, 0, 1.0, K.brick, 1.6)); for (let i = 0; i < 4; i++) win(g, 'z', 2.45 + i * 0.5, 2.6 + i * 0.5, 3.5, 0.3, 0.86, { style: 'lancet', col: '#1a2026', frame: '#efe8dc' });
    g.add(gableRoof(2.3, 2.6, 4.5, 3.5, 1.0, 0.85, K.roof, true, K.brick, 0.05)); stepGable(g, K.brick, 'x', 4.53, 2.58, 3.52, 1.0, 0.9, 4);
    g.add(blk(2.5, 3.5, 3.1, 4.1, 0, 0.75, WS, 1.6)); g.add(at(cyl(0.24, 0.26, 0.22, WS, 16, 2), 2.8, 0.86, 3.8)); domeOn(g, 2.8, 3.8, 0.97, 0.28, K.gold, { drum: 0, fin: 'cross' }); g.add(at(cyl(0.06, 0.06, 0.14, WS, 8), 2.8, 1.32, 3.8)); domeOn(g, 2.8, 3.8, 1.39, 0.07, K.gold, { drum: 0, fin: 'cross', fs: 0.8 });
    const t = ktower(g, K, 4.25, 2.3, 0.3, 2.0, { round: false, m: K.brick, top: 'crenel', fin: false }); const h1 = helmet(g, 4.25, t - 0.06, 2.3, 0.3, K.copper, 'ball'); g.add(at(cyl(0.08, 0.08, 0.2, PM('#efe8dc'), 8), 4.25, h1 + 0.02, 2.3)); helmet(g, 4.25, h1 + 0.12, 2.3, 0.1, K.copper, 'cross');
    topFlag(g, 0.9, 1.85, 0.9, 0.5, 0.3); banner(g, 'z', 3.4, 3.5, 0.95, 0.16, 0.36);
  } else if (c === 'oto') {
    // Hagia Sofia: cupola uriașă pe tambur cu ferestre, semicupole, patru minarete
    const WS = TM('plastered_wall', '#f0c8a0', 0.95, 0.8);
    g.add(blk(1.2, 1.3, 3.8, 3.7, 0, 0.9, WS, 1.6)); g.add(blk(1.0, 1.7, 1.2, 3.3, 0, 0.7, WS, 1.6)); g.add(blk(3.8, 1.7, 4.0, 3.3, 0, 0.7, WS, 1.6));
    [[1.2, 1.3], [3.8, 1.3], [1.2, 3.7], [3.8, 3.7]].forEach(([x, z]) => g.add(blk(x - 0.18, z - 0.18, x + 0.18, z + 0.18, 0, 1.25, WS, 1.6)));
    for (let i = 0; i < 6; i++) win(g, 'z', 1.45 + i * 0.38, 1.6 + i * 0.38, 3.7, 0.42, 0.72, { style: 'arch', col: '#22303a' });
    for (let i = 0; i < 5; i++) win(g, 'x', 1.55 + i * 0.4, 1.7 + i * 0.4, 3.8, 0.42, 0.72, { style: 'arch', col: '#22303a' });
    [1.6, 3.4].forEach(x => { const d = dome(0.82, K.lead, 24, 0.78); at(d, x, 0.9, 2.5); g.add(d); });
    domeOn(g, 2.5, 2.5, 0.9, 1.05, K.lead, { drum: 0.26, drumM: WS, wins: 24, sy: 0.62, fs: 1.6 });
    [[0.55, 0.55], [4.45, 0.55], [0.55, 4.45], [4.45, 4.45]].forEach(([x, z]) => minaret(g, x, z, 2.6, K.wall, K.lead, { r: 0.1, capH: 0.5 }));
    cypress(g, 4.2, 3.6, 0.9); cypress(g, 3.6, 4.3, 0.85); cypress(g, 0.9, 3.9, 0.8);
    g.add(at(cyl(0.22, 0.26, 0.14, K.stone, 8, 2), 4.2, 2.5, 4.4)); g.add(at(cyl(0.3, 0.3, 0.02, K.stone, 8), 4.2, 0.0, 4.4));
    banner(g, 'z', 2.0, 3.7, 0.88, 0.16, 0.36); banner(g, 'z', 3.0, 3.7, 0.88, 0.16, 0.36);
  } else if (c === 'tat') {
    // Palatul Hanului (Bahcisarai): galerii pictate, acoperișuri largi, geamia cu două minarete, chiparoși, cortul hanului
    kwalls(g, K, 0.8, 0.6, 3.9, 1.7, 0, 0.75); g.add(blk(0.8, 1.7, 3.9, 2.05, 0, 0.04, K.base, 2)); posts(g, [0.85, 1.35, 1.85, 2.35, 2.85, 3.35, 3.85], 2.0, 0.72, PM('#2a5a8a', 0.7), 0.026);
    winsAlong(g, K, 'z', 0.8, 3.9, 1.7, 0.32, null, 0.4); kroof(g, K, 0.8, 0.6, 3.9, 2.0, 0.75, { pitch: 0.55 });
    kwalls(g, K, 0.6, 2.1, 1.6, 4.3, 0, 0.6); winsAlong(g, K, 'x', 2.1, 4.3, 1.6, 0.26, null, 0.4); kroof(g, K, 0.6, 2.1, 1.6, 4.3, 0.6, { pitch: 0.6 });
    kwalls(g, K, 3.1, 2.8, 4.3, 3.9, 0, 0.7); door(g, 'z', 3.55, 3.85, 3.9, 0.5, { col: '#2a5a8a' }); kroof(g, K, 3.1, 2.8, 4.3, 3.9, 0.7, { pitch: 0.7 });
    [[3.0, 2.7], [4.4, 4.0]].forEach(([x, z]) => { g.add(at(cyl(0.085, 0.1, 2.1, K.wall, 8, 2), x, 1.05, z)); g.add(at(cyl(0.15, 0.11, 0.06, PM('#2a5a8a', 0.7), 8), x, 1.7, z)); g.add(at(cone(0.1, 0.44, K.lead, 8), x, 2.32, z)); finial(g, x, 2.54, z, 'crescent'); });
    g.add(blk(2.2, 4.3, 2.9, 4.75, 0, 0.9, K.stone, 1.6)); door(g, 'z', 2.38, 2.72, 4.75, 0.6, { style: 'arch', col: '#2a2016' }); g.add(blk(2.15, 4.25, 2.95, 4.8, 0.9, 0.06, PM('#2a5a8a', 0.7))); paintedEave(g, 2.15, 4.25, 2.95, 4.8, 0.9);
    g.add(blk(1.9, 2.4, 2.4, 2.48, 0, 0.5, PM('#f2eee6', 0.5))); g.add(at(cyl(0.18, 0.2, 0.06, PM('#f2eee6', 0.5), 12), 2.15, 0.03, 2.6));
    yurt(g, 2.6, 3.3, 0.48, { top: 'crescent', door: '#c8962a' });
    [[1.9, 3.6], [1.9, 4.1], [3.5, 2.3], [4.2, 2.3], [4.6, 3.4], [0.5, 4.6]].forEach(([x, z]) => cypress(g, x, z, 0.95));
    tug(g, 3.0, 4.2, 1.1); carpet(g, 2.6, 2.4, 0.5, 0.36, 0, 0);
  }
};

// ---------- zidurile, porțile, ruinele (aceleași pentru toți) ----------
export function wallPiece(kind, dir, civ) {
  const g = new THREE.Group(), stone = TM('castle_wall_slates', '#ece6dc', 0.95, 1.2), wood = TM('medieval_wood', '#a08060'), dark = PM('#4a3020', 0.85);
  // piesa se construiește de-a lungul lui x; pentru „y” se rotește în jurul colțului, cu fața spre +x (spre cameră)
  const along = (fn) => { const s = new THREE.Group(); fn(s); if (dir === 'y') { s.rotation.y = Math.PI / 2; s.position.set(0, 0, 1); } g.add(s); };
  if (kind === 'pal') {
    if (dir === 'p') { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 0.2; g.add(at(cyl(0.05, 0.055, 0.6, wood, 7, 2), 0.5 + Math.cos(a) * r, 0.3, 0.5 + Math.sin(a) * r)); g.add(at(cone(0.05, 0.1, wood, 7), 0.5 + Math.cos(a) * r, 0.65, 0.5 + Math.sin(a) * r)); } g.add(at(cyl(0.06, 0.06, 0.74, wood, 7, 2), 0.5, 0.37, 0.5)); g.add(at(cone(0.06, 0.12, wood, 7), 0.5, 0.8, 0.5)); }
    else along(s => { for (let i = 0; i < 9; i++) { const x = 0.06 + i * 0.11, h = 0.48 + ((i * 7) % 3) * 0.03; s.add(at(cyl(0.048, 0.052, h, wood, 7, 2), x, h / 2, 0.5)); s.add(at(cone(0.048, 0.09, wood, 7), x, h + 0.045, 0.5)); } [0.14, 0.36].forEach(y => s.add(at(box(1.0, 0.025, 0.02, dark), 0.5, y, 0.555))); });
  } else if (kind === 'ppal') {
    along(s => { [0.06, 0.94].forEach(x => { s.add(at(cyl(0.06, 0.065, 0.78, wood, 8, 2), x, 0.39, 0.5)); s.add(at(cone(0.06, 0.1, wood, 8), x, 0.83, 0.5)); }); s.add(at(box(1.0, 0.06, 0.08, wood, 2), 0.5, 0.7, 0.5)); [0.29, 0.71].forEach(x => { s.add(at(box(0.4, 0.5, 0.04, TM('raw_plank_wall', '#c8a888'), 3), x, 0.3, 0.5)); s.add(at(box(0.4, 0.03, 0.05, dark), x, 0.2, 0.5)); s.add(at(box(0.4, 0.03, 0.05, dark), x, 0.42, 0.5)); }); s.add(at(box(0.22, 0.12, 0.012, team('velvet', 0.8)), 0.5, 0.6, 0.555)); });
  } else if (kind === 'zid' || kind === 'poarta') {
    // zidul de piatră în stilul civilizației: Moldova cu galerie acoperită, munteni în benzi, polonezi din cărămidă, otomani cu creneluri ascuțite
    const K = kit(civ || 'mol'), c = civ || 'all', SM = c === 'pol' ? K.brick : c === 'all' ? stone : K.stone;
    const body = (s, x0, z0, x1, z1, h, y0 = 0) => { if (c === 'val') banded(s, x0, z0, x1, z1, y0, h, K.stone, K.brick, 0.07); else s.add(blk(x0, z0, x1, z1, y0, h, SM, 1.6)); };
    const merl = (s, x0, z0, x1, z1, y, step = 0.12) => {
      if (c === 'oto') { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(len / step)); for (let i = 0; i < n; i += 2) { const t = (i + 0.5) / n; s.add(at(box(0.09, 0.05, 0.09, SM, 1.5), x0 + (x1 - x0) * t, y + 0.025, z0 + (z1 - z0) * t)); s.add(at(cone(0.064, 0.07, SM, 4), x0 + (x1 - x0) * t, y + 0.085, z0 + (z1 - z0) * t, 0, Math.PI / 4, 0)); } }
      else crenels(s, x0, z0, x1, z1, y, c === 'val' ? K.brick : SM, step, 0.08);
    };
    const cap = (s, x0, z0, x1, z1, y) => {
      if (c === 'mol') { posts(s, [x0 + 0.06, (x0 + x1) / 2, x1 - 0.06], (z0 + z1) / 2 + 0.12, 0.14, K.timber, 0.014); s.children.slice(-3).forEach(o => o.position.y += y); s.add(gableRoof(x0, z0, x1, z1, y + 0.14, 0.16, K.roof, true, null, 0.05)); }
      else if (c === 'pol') { s.add(blk(x0, z0 - 0.01, x1, z1 + 0.01, y, 0.03, PM('#efe8dc', 0.9))); merl(s, x0 + 0.04, z1 - 0.04, x1 - 0.04, z1 - 0.04, y + 0.03); }
      else if (c === 'tat') { merl(s, x0 + 0.04, z1 - 0.04, x1 - 0.04, z1 - 0.04, y); s.add(blk(x0, z1 - 0.01, x1, z1 + 0.012, y - 0.06, 0.04, PM('#2a5a8a', 0.7))); }
      else merl(s, x0 + 0.04, z1 - 0.04, x1 - 0.04, z1 - 0.04, y);
    };
    if (kind === 'zid') {
      if (dir === 'p') {
        const h = 0.84; if (c === 'val') banded(g, 0.08, 0.08, 0.92, 0.92, 0, h, K.stone, K.brick, 0.07); else g.add(blk(0.08, 0.08, 0.92, 0.92, 0, h, SM, 1.6));
        if (c === 'mol') g.add(hipRoof(0.02, 0.02, 0.98, 0.98, h, 0.5, K.roof)); else if (c === 'ung') g.add(hipRoof(0.04, 0.04, 0.96, 0.96, h, 0.6, K.roof)); else if (c === 'pol') { g.add(blk(0.06, 0.06, 0.94, 0.94, h, 0.04, PM('#efe8dc', 0.9))); g.add(hipRoof(0.06, 0.06, 0.94, 0.94, h + 0.04, 0.62, K.roof)); }
        else { merl(g, 0.12, 0.88, 0.88, 0.88, h, 0.13); merl(g, 0.88, 0.12, 0.88, 0.88, h, 0.13); merl(g, 0.12, 0.12, 0.88, 0.12, h, 0.13); merl(g, 0.12, 0.12, 0.12, 0.88, h, 0.13); }
        g.add(at(box(0.03, 0.1, 0.03, PM('#120e0a')), 0.93, 0.55, 0.5)); g.add(at(box(0.03, 0.1, 0.03, PM('#120e0a')), 0.5, 0.55, 0.93));
      } else along(s => { body(s, 0, 0.3, 1, 0.7, 0.66); cap(s, 0, 0.3, 1, 0.7, 0.66); s.add(blk(0, 0.28, 1, 0.3, 0.6, 0.04, SM, 2)); });
    } else {
      along(s => {
        [[0, 0.24], [0.76, 1]].forEach(([a, b]) => { body(s, a, 0.22, b, 0.78, 0.92); if (c === 'mol' || c === 'ung' || c === 'pol') s.add(hipRoof(a - 0.03, 0.19, b + 0.03, 0.81, 0.92, c === 'mol' ? 0.36 : 0.44, K.roof)); else merl(s, a + 0.02, 0.76, b - 0.02, 0.76, 0.92, 0.11); });
        body(s, 0.24, 0.24, 0.76, 0.76, 0.22, 0.62);
        merl(s, 0.26, 0.74, 0.74, 0.74, 0.84, 0.11);
        const dark = PM('#1a140e'), ar = mesh(new THREE.CircleGeometry(0.26, 12, 0, Math.PI), dark); at(ar, 0.5, 0.36, 0.765); s.add(ar); s.add(at(box(0.52, 0.36, 0.01, dark), 0.5, 0.18, 0.765));
        if (c === 'oto') for (let i = 0; i < 9; i++) { const a2 = i / 8 * Math.PI; s.add(at(box(0.05, 0.06, 0.012, PM(i % 2 ? '#a8402a' : '#f2ead8', 0.8)), 0.5 + Math.cos(a2) * 0.29, 0.36 + Math.sin(a2) * 0.29, 0.772, 0, 0, a2 - Math.PI / 2)); }
        if (c === 'tat') s.add(blk(0.2, 0.75, 0.8, 0.79, 0.64, 0.05, PM('#2a5a8a', 0.7)));
        for (let i = 0; i < 5; i++) s.add(at(box(0.012, 0.5, 0.012, PM('#2e3034', 0.5, 0.8)), 0.3 + i * 0.1, 0.32, 0.775)); s.add(at(box(0.5, 0.012, 0.012, PM('#2e3034', 0.5, 0.8)), 0.5, 0.3, 0.775));
        [0.12, 0.88].forEach(x => { const bn = mesh(new THREE.PlaneGeometry(0.14, 0.3), team('velvet', 0.8)); at(bn, x, 0.68, 0.785); s.add(bn); });
      });
    }
  }
  return g;
}
export function ruin(n) {
  const g = new THREE.Group(), R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(n * 977 + 13);
  ground(g, 0.1, 0.1, n - 0.1, n - 0.1, 'dirt', '#8a7a68');
  const stone = TM('castle_wall_slates', '#d8d0c4', 0.95, 1.4), char = PM('#2a2018', 0.95), ash = PM('#5a524a', 1);
  const seg = (x0, z0, x1, z1, h) => g.add(blk(x0, z0, x1, z1, 0, h, stone, 1.6));
  seg(0.3, 0.3, n * 0.6, 0.5, 0.18 + R() * 0.2); seg(0.3, 0.5, 0.5, n * 0.55, 0.14 + R() * 0.25); seg(n * 0.7, 0.3, n - 0.3, 0.48, 0.1 + R() * 0.12);
  for (let i = 0; i < 10 + n * 5; i++) { const s = 0.05 + R() * 0.08; g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(s), R() < 0.7 ? stone : ash), 0.4 + R() * (n - 0.8), s * 0.6, 0.4 + R() * (n - 0.8), R() * 3, R() * 3, 0)); }
  for (let i = 0; i < 3 + n; i++) { const b = box(0.4 + R() * 0.5, 0.05, 0.05, char); at(b, 0.5 + R() * (n - 1), 0.04 + R() * 0.08, 0.5 + R() * (n - 1), 0, R() * 3, (R() - 0.5) * 0.5); g.add(b); }
  return g;
}

// schela unei clădiri în construcție (aceeași pentru toți): stâlpi, podini pe fețele văzute, contrafișe, scară, materiale jos
export function scaffold(n) {
  const g = new THREE.Group(), P = PM('#8a6a44', 0.9), PL = TM('raw_plank_wall', '#d8bc98', 0.9, 1.2), h = 0.45 + n * 0.16, e = 0.12;
  const xs = [], m = Math.max(2, Math.round(n / 0.55));
  for (let i = 0; i <= m; i++) xs.push(e + (n - 2 * e) * i / m);
  xs.forEach(x => { g.add(at(cyl(0.014, 0.016, h, P, 6), x, h / 2, n - e)); g.add(at(cyl(0.014, 0.016, h, P, 6), n - e, h / 2, x)); });
  g.add(at(cyl(0.014, 0.016, h, P, 6), e, h / 2, e));
  [0.32, 0.62, 0.92].map(f => f * h).forEach((y, k) => {
    g.add(at(box(n - 2 * e, 0.018, 0.09, PL, 2), n / 2, y, n - e + 0.02)); g.add(at(box(0.09, 0.018, n - 2 * e, PL, 2), n - e + 0.02, y, n / 2));
    g.add(at(box(n - 2 * e, 0.012, 0.012, P), n / 2, y + 0.1, n - e + 0.06)); g.add(at(box(0.012, 0.012, n - 2 * e, P), n - e + 0.06, y + 0.1, n / 2));
  });
  for (let i = 0; i < m; i += 2) { const a = xs[i], b = xs[i + 1], L = Math.hypot(b - a, h * 0.3), ang = Math.atan2(h * 0.3, b - a);
    g.add(at(box(L, 0.012, 0.012, P), (a + b) / 2, h * 0.47, n - e + 0.03, 0, 0, ang)); const d2 = box(0.012, 0.012, L, P); at(d2, n - e + 0.03, h * 0.47, (a + b) / 2, -ang, 0, 0); g.add(d2); }
  const lad = new THREE.Group(); [-0.05, 0.05].forEach(z => lad.add(at(box(0.014, h * 0.75, 0.014, P), 0, h * 0.375, z))); for (let i = 0; i < 6; i++) lad.add(at(box(0.012, 0.012, 0.1, P), 0, 0.06 + i * h * 0.12, 0)); at(lad, n - e + 0.16, 0, n * 0.62, 0, 0, 0.18); g.add(lad);
  logPile(g, n * 0.3, n + 0.12, 2, 0.4); for (let i = 0; i < 4; i++) g.add(at(box(0.09, 0.06, 0.07, TM('castle_wall_slates', '#d8d0c4')), n + 0.08 + (i % 2) * 0.1, 0.03 + Math.floor(i / 2) * 0.06, n * 0.3 + (i % 2) * 0.05));
  return g;
}
export function building2(t, civ) {
  const K = kit(civ), g = new THREE.Group(), info = { n: NB[t] };
  B[t](g, K, info);
  return { root: g, info };
}
