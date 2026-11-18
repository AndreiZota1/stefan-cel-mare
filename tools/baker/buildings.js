// Clădirile în 3D, cu texturi foto (Poly Haven, CC0): zidărie, tencuială, bârne, stuf, șindrilă, țiglă.
import { THREE } from './core.js';

const loader = new THREE.TextureLoader();
const texCache = {}, pending = [];
function tex(name, kind) {
  const k = name + '_' + kind;
  if (!texCache[k]) {
    const t = loader.load('/tex/' + k + '.jpg', undefined, undefined, () => console.error('textură lipsă ' + k));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (kind === 'diff') t.colorSpace = THREE.SRGBColorSpace;
    texCache[k] = t;
    pending.push(new Promise(res => { const iv = setInterval(() => { if (t.image && t.image.complete !== false && (t.image.width || t.image.naturalWidth)) { clearInterval(iv); res(); } }, 20); }));
  }
  return texCache[k];
}
export function texturesReady() { return Promise.all(pending); }
const NOR = new Set(['castle_wall_slates', 'old_stone_wall', 'rustic_stone_wall', 'plastered_wall', 'raw_plank_wall', 'medieval_wood', 'reed_roof_04', 'grey_roof_tiles', 'clay_roof_tiles', 'roof_09', 'forest_ground_04', 'dirt', 'river_small_rocks', 'large_sandstone_blocks', 'clay_plaster']);
const mats = {};
function TM(name, tint = '#ffffff', rough = 0.92, ns = 1) {
  const k = name + tint + rough + ns;
  if (!mats[k]) {
    const m = new THREE.MeshStandardMaterial({ map: tex(name, 'diff'), roughness: rough, color: new THREE.Color(tint) });
    if (NOR.has(name)) { m.normalMap = tex(name, 'nor'); m.normalScale.set(ns, ns); }
    mats[k] = m;
  }
  return mats[k];
}
const plain = {};
function PM(hex, rough = 0.85, metal = 0, emissive) {
  const k = hex + rough + metal + (emissive || '');
  if (!plain[k]) plain[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal, emissive: emissive ? new THREE.Color(emissive) : undefined, emissiveIntensity: emissive ? 1.4 : 0, side: THREE.DoubleSide });
  return plain[k];
}
function canvasMat(w, h, draw, rough = 0.9) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: rough, side: THREE.DoubleSide });
}

function mesh(g, m) { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }
// cutie cu texturi la aceeași densitate pe toate fețele; x = lățime (lumea x), y = înălțime, z = adâncime (lumea y)
function box(w, h, d, m, s = 1) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  return mesh(g, m);
}
// cutie așezată pe sol, cu colțul în (x0, z0)
function blk(x0, z0, x1, z1, y0, h, m, s) { return at(box(x1 - x0, h, z1 - z0, m, s), (x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); }
function cyl(rt, rb, h, m, seg = 20, s = 1, open = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), uv = g.attributes.uv, circ = Math.PI * 2 * Math.max(rt, rb);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ * s, uv.getY(i) * h * s);
  return mesh(g, m);
}
function cone(r, h, m, seg = 20, s = 1) {
  const g = new THREE.ConeGeometry(r, h, seg, 4), uv = g.attributes.uv, sl = Math.hypot(r, h);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r * s, uv.getY(i) * sl * s);
  return mesh(g, m);
}
function dome(r, m, seg = 24) { return mesh(new THREE.SphereGeometry(r, seg, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); }
// poligoane plane (pante de acoperiș, fronton), cu UV pe planul fiecăruia
function polys(list, m, s = 1) {
  const pos = [], uvs = [];
  list.forEach(P => {
    const o = P[0], u = new THREE.Vector3().subVectors(P[1], P[0]).normalize();
    const nrm = new THREE.Vector3().subVectors(P[1], P[0]).cross(new THREE.Vector3().subVectors(P[2], P[0])).normalize();
    const v = new THREE.Vector3().crossVectors(nrm, u).normalize();
    for (let i = 1; i < P.length - 1; i++) [P[0], P[i], P[i + 1]].forEach(p => {
      pos.push(p.x, p.y, p.z);
      const d = new THREE.Vector3().subVectors(p, o);
      uvs.push(d.dot(u) * s, d.dot(v) * s);
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return mesh(g, m);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// acoperiș în patru ape peste [x0,x1] x [z0,z1], streașina la y, înalt h
function hipRoof(x0, z0, x1, z1, y, h, m, s = 1.4) {
  const w = x1 - x0, d = z1 - z0, A = V(x0, y, z0), B = V(x1, y, z0), C = V(x1, y, z1), D = V(x0, y, z1);
  let R0, R1;
  if (w >= d) { R0 = V(x0 + d / 2, y + h, (z0 + z1) / 2); R1 = V(x1 - d / 2, y + h, (z0 + z1) / 2); }
  else { R0 = V((x0 + x1) / 2, y + h, z0 + w / 2); R1 = V((x0 + x1) / 2, y + h, z1 - w / 2); }
  const list = w >= d ? [[B, A, R0, R1], [D, C, R1, R0], [A, D, R0], [C, B, R1]] : [[B, A, R0], [D, C, R1], [A, D, R1, R0], [C, B, R0, R1]];
  return polys(list, m, s);
}
// acoperiș în două ape, coama de-a lungul lui x (alongX) sau al lui z
function gableRoof(x0, z0, x1, z1, y, h, m, alongX, wallM, s = 1.4) {
  const g = new THREE.Group();
  if (alongX) {
    const zm = (z0 + z1) / 2, R0 = V(x0, y + h, zm), R1 = V(x1, y + h, zm);
    g.add(polys([[V(x1, y, z0), V(x0, y, z0), R0, R1], [V(x0, y, z1), V(x1, y, z1), R1, R0]], m, s));
    if (wallM) g.add(polys([[V(x0 + 0.04, y, z0 + 0.04), V(x0 + 0.04, y, z1 - 0.04), V(x0 + 0.04, y + h - 0.04, zm)], [V(x1 - 0.04, y, z1 - 0.04), V(x1 - 0.04, y, z0 + 0.04), V(x1 - 0.04, y + h - 0.04, zm)]], wallM, 1.2));
  } else {
    const xm = (x0 + x1) / 2, R0 = V(xm, y + h, z0), R1 = V(xm, y + h, z1);
    g.add(polys([[V(x0, y, z0), V(x0, y, z1), R1, R0], [V(x1, y, z1), V(x1, y, z0), R0, R1]], m, s));
    if (wallM) g.add(polys([[V(x1 - 0.04, y, z0 + 0.04), V(x0 + 0.04, y, z0 + 0.04), V(xm, y + h - 0.04, z0 + 0.04)], [V(x0 + 0.04, y, z1 - 0.04), V(x1 - 0.04, y, z1 - 0.04), V(xm, y + h - 0.04, z1 - 0.04)]], wallM, 1.2));
  }
  return g;
}
// fereastră / ușă pe peretele dinspre +z (fața din stânga a ecranului) sau +x (fața din dreapta)
function opening(g, face, a, b, fixed, y0, y1, col = '#20160e', frame = '#5a3a20', shut) {
  const w = b - a, h = y1 - y0, t = 0.012;
  if (face === 'z') {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, h, t), PM(col, 0.9)), (a + b) / 2, (y0 + y1) / 2, fixed + t / 2));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.018, t * 2), PM(frame, 0.8)), (a + b) / 2, y1, fixed + t));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.018, t * 2), PM(frame, 0.8)), (a + b) / 2, y0, fixed + t));
    if (shut) [a - w * 0.28, b + w * 0.28].forEach(x => g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, h, t * 1.5), PM(shut, 0.75)), x, (y0 + y1) / 2, fixed + t)));
  } else {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(t, h, w), PM(col, 0.9)), fixed + t / 2, (y0 + y1) / 2, (a + b) / 2));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(t * 2, 0.018, w + 0.03), PM(frame, 0.8)), fixed + t, y1, (a + b) / 2));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(t * 2, 0.018, w + 0.03), PM(frame, 0.8)), fixed + t, y0, (a + b) / 2));
    if (shut) [a - w * 0.28, b + w * 0.28].forEach(z => g.add(at(new THREE.Mesh(new THREE.BoxGeometry(t * 1.5, h, w * 0.5), PM(shut, 0.75)), fixed + t, (y0 + y1) / 2, z)));
  }
}
function flag(g, x, y, z, h, col, w = 0.16) {
  g.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), PM('#4a3a2a', 0.8)), x, y + h / 2, z));
  const shp = new THREE.PlaneGeometry(w, w * 0.62, 6, 1), p = shp.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w + 0.5) * 3) * 0.015);
  g.add(at(mesh(shp, PM(col, 0.8)), x + w / 2, y + h - w * 0.32, z, 0, Math.PI / 4, 0));
}
function crenels(g, x0, z0, x1, z1, y, m, step = 0.14) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(len / step));
  for (let i = 0; i < n; i += 2) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    g.add(at(box(Math.abs(x1 - x0) > 0.01 ? len / n : 0.1, 0.07, Math.abs(z1 - z0) > 0.01 ? len / n : 0.1, m, 1.5), x, y + 0.035, z));
  }
}
function ringCrenels(g, cx, cz, r, y, m, n = 12) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.add(at(box(0.07, 0.07, 0.07, m, 1.5), cx + Math.cos(a) * r, y + 0.035, cz + Math.sin(a) * r, 0, -a, 0)); }
}
function logPile(g, x, z, n, len = 0.42) {
  for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) {
    const log = cyl(0.045, 0.045, len, TM('medieval_wood', '#b08060'), 10, 2);
    at(log, x, 0.045 + r * 0.078, z + (i - (n - r - 1) / 2) * 0.09 , 0, 0, Math.PI / 2);
    g.add(log);
    const end = mesh(new THREE.CircleGeometry(0.043, 12), PM('#c49a64', 0.8)); at(end, x + len / 2 + 0.001, 0.045 + r * 0.078, z + (i - (n - r - 1) / 2) * 0.09, 0, Math.PI / 2, 0); g.add(end);
  }
}
const H0 = 0.44; // înălțimea unui etaj (unități de lume)

// ---------- texturi pictate ----------
const paintedMat = () => canvasMat(512, 256, (c, w, h) => {
  c.fillStyle = '#2a58a6'; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) {
    const x = i * 32 + 3, y = 6 + r * 62;
    c.fillStyle = 'rgba(240,226,190,0.22)'; c.fillRect(x, y, 26, 54);
    c.strokeStyle = 'rgba(240,210,140,0.6)'; c.lineWidth = 1.5; c.strokeRect(x, y, 26, 54);
    c.fillStyle = '#d9b44a'; c.beginPath(); c.arc(x + 13, y + 12, 6, 0, 6.3); c.fill();
    c.fillStyle = '#e8c9a0'; c.beginPath(); c.arc(x + 13, y + 12, 3.5, 0, 6.3); c.fill();
    c.fillStyle = ['#a8322a', '#e8e2d2', '#3a6a3a', '#b8862a'][(i + r) % 4]; c.fillRect(x + 6, y + 20, 14, 30);
  }
  for (let i = 0; i < 2000; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
});
const tentMat = (col) => canvasMat(256, 64, (c, w, h) => {
  for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#efe6d0' : col; c.fillRect(i * 16, 0, 16, h); }
  for (let i = 0; i < 1500; i++) { c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
}, 0.95);

// ---------- clădirile ----------
export function building(t, civ, team) {
  const g = new THREE.Group(), mol = civ === 'mol', n = { cetate: 4, casa: 2, joagar: 2, mina: 2, moara: 2, ogor: 3, cazarma: 3, poligon: 3, grajd: 3, fierarie: 3, turn: 2, manastire: 3 }[t];
  const info = { n };
  const STONE = mol ? TM('old_stone_wall', '#ffffff', 0.95, 1.2) : TM('old_stone_wall', '#fff2d6', 0.95, 1.2);
  const STONE2 = mol ? TM('castle_wall_slates', '#ffffff', 0.95, 1.2) : TM('old_stone_wall', '#fff0d0', 0.95, 1.2);
  const PLASTER = mol ? TM('plastered_wall', '#f6f2ea', 0.95, 0.8) : TM('plastered_wall', '#f2dfb6', 0.95, 0.8);
  const LOGS = TM('raw_plank_wall', '#d2b090', 0.9, 1.2), PLANKS = TM('medieval_wood', '#d8c2a6', 0.9, 1.2);
  const THATCH = TM('reed_roof_04', '#e8d8b0', 1, 1.4), SHINGLE = TM('grey_roof_tiles', '#a89a88', 0.95, 1.2);
  const TILE = TM('clay_roof_tiles', '#ffffff', 0.85, 1.1), OTILE = TM('roof_09', '#ffffff', 0.85, 1.1);
  const LEAD = PM('#8f9eae', 0.42, 0.55), GOLD = PM('#d9ab3c', 0.3, 0.9), WOOD = PM('#6e4b2a', 0.85);
  const ground = (x0, z0, x1, z1, name = 'dirt', tint = '#e8d2b0') => {
    const m = TM(name, tint, 1).clone();
    const ac = document.createElement('canvas'); ac.width = ac.height = 128; const cx = ac.getContext('2d');
    const gr = cx.createRadialGradient(64, 64, 30, 64, 64, 66); gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, '#bbb'); gr.addColorStop(1, '#000');
    cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    m.alphaMap = new THREE.CanvasTexture(ac); m.transparent = true; m.depthWrite = false;
    m.map = m.map.clone(); m.map.repeat.set(x1 - x0, z1 - z0); m.map.needsUpdate = true;
    if (m.normalMap) { m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(x1 - x0, z1 - z0); m.normalMap.needsUpdate = true; }
    const p = mesh(new THREE.PlaneGeometry(x1 - x0 + 0.3, z1 - z0 + 0.3), m); at(p, (x0 + x1) / 2, 0.003, (z0 + z1) / 2, -Math.PI / 2);
    p.castShadow = false; g.add(p);
  };
  switch (t) {
    case 'casa': {
      ground(0.1, 0.1, 1.9, 1.9);
      if (mol) {
        g.add(blk(0.35, 0.4, 1.65, 1.5, 0, 0.06, STONE2, 3));
        g.add(blk(0.38, 0.43, 1.62, 1.47, 0.06, H0 * 0.95, PLASTER, 1.6));
        opening(g, 'z', 0.62, 0.88, 1.47, 0.06, 0.34);
        opening(g, 'z', 1.12, 1.34, 1.47, 0.18, 0.32, '#2a3440', '#f0eadc', '#3d6fb0');
        opening(g, 'x', 0.75, 0.97, 1.62, 0.18, 0.32, '#2a3440', '#f0eadc', '#3d6fb0');
        [0.42, 0.98, 1.56].forEach(x => g.add(at(cyl(0.022, 0.022, 0.47, WOOD, 8), x, 0.235, 1.68)));
        g.add(blk(0.36, 1.48, 1.64, 1.78, 0, 0.04, PLANKS, 2));
        g.add(hipRoof(0.24, 0.28, 1.76, 1.84, 0.47, 0.55, THATCH, 1.2));
      } else {
        g.add(blk(0.38, 0.42, 1.62, 1.58, 0, H0, PLASTER, 1.6));
        opening(g, 'z', 0.6, 0.86, 1.58, 0, 0.3, '#3a2414', '#6a4a2a');
        opening(g, 'z', 1.12, 1.34, 1.58, 0.16, 0.3, '#2a2a30', '#efe4c8');
        opening(g, 'x', 0.8, 1.02, 1.62, 0.16, 0.3, '#2a2a30', '#efe4c8');
        g.add(hipRoof(0.28, 0.32, 1.72, 1.68, H0, 0.25, OTILE, 1.6));
        g.add(blk(1.2, 0.6, 1.36, 0.76, H0 + 0.1, 0.22, PLASTER, 2));
      }
      break;
    }
    case 'cetate': {
      ground(0.25, 0.25, 3.75, 3.75, 'forest_ground_04', '#c8b8a0');
      const WH = 0.62, tower = (x, z) => {
        g.add(at(cyl(0.42, 0.46, 1.08, STONE2, 24, 1.6), x, 0.54, z));
        ringCrenels(g, x, z, 0.44, 1.08, STONE2);
        if (mol) { const c = cone(0.54, 0.8, TILE, 24, 1.6); at(c, x, 1.08 + 0.4 + 0.07, z); g.add(c); g.add(at(cone(0.02, 0.12, GOLD, 8), x, 1.95, z)); }
        else { const d = dome(0.44, LEAD); at(d, x, 1.15, z); g.add(d); g.add(at(cyl(0.008, 0.008, 0.16, GOLD, 6), x, 1.66, z)); }
      };
      g.add(blk(0.32, 0.32, 3.68, 0.62, 0, WH, STONE, 1.6)); crenels(g, 0.4, 0.47, 3.6, 0.47, WH, STONE);
      g.add(blk(0.32, 0.62, 0.62, 3.68, 0, WH, STONE, 1.6)); crenels(g, 0.47, 0.7, 0.47, 3.6, WH, STONE);
      g.add(blk(0.62, 3.38, 3.68, 3.68, 0, WH, STONE, 1.6)); crenels(g, 0.7, 3.53, 3.6, 3.53, WH, STONE);
      g.add(blk(3.38, 0.62, 3.68, 3.38, 0, WH, STONE, 1.6)); crenels(g, 3.53, 0.7, 3.53, 3.3, WH, STONE);
      [[0.45, 0.45], [3.55, 0.45], [0.45, 3.55], [3.55, 3.55]].forEach(p => tower(p[0], p[1]));
      // donjonul
      g.add(blk(1.3, 1.3, 2.7, 2.7, 0, 1.3, STONE2, 1.6));
      [[1.6, 1.82], [2.15, 2.37]].forEach(p => { opening(g, 'z', p[0], p[1], 2.7, 0.75, 0.98, '#1a140e', '#8a7a64'); opening(g, 'x', p[0], p[1], 2.7, 0.75, 0.98, '#1a140e', '#8a7a64'); });
      if (mol) { g.add(hipRoof(1.18, 1.18, 2.82, 2.82, 1.3, 0.85, TILE, 1.6)); flag(g, 2, 2.1, 2, 0.4, team, 0.24); }
      else {
        const d = dome(0.78, LEAD, 32); at(d, 2, 1.3, 2); g.add(d); g.add(at(cyl(0.01, 0.01, 0.25, GOLD, 6), 2, 2.18, 2));
        g.add(at(cyl(0.12, 0.13, 2.1, PLASTER, 16, 2), 3.02, 1.05, 1.02)); g.add(at(cyl(0.18, 0.18, 0.05, PLASTER, 16, 2), 3.02, 1.6, 1.02));
        g.add(at(cone(0.14, 0.42, LEAD, 16), 3.02, 2.31, 1.02)); flag(g, 2.6, 0.62, 3.53, 0.5, team, 0.22);
      }
      // poarta
      const gate = new THREE.Group(); g.add(gate);
      gate.add(at(box(0.62, 0.52, 0.06, STONE2, 2), 2, 0.26, 3.72));
      gate.add(at(box(0.44, 0.42, 0.03, PLANKS, 3), 2, 0.21, 3.76));
      [1.4, 2.6].forEach(x => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.34), PM(team, 0.8)); at(b, x, 0.4, 3.69); g.add(b); });
      break;
    }
    case 'turn': {
      ground(0.3, 0.3, 1.7, 1.7, 'forest_ground_04', '#c8b8a0');
      g.add(at(cyl(0.52, 0.58, 1.55, STONE2, 24, 1.6), 1, 0.775, 1));
      g.add(at(cyl(0.64, 0.6, 0.12, STONE2, 24, 1.6), 1, 1.6, 1));
      ringCrenels(g, 1, 1, 0.6, 1.66, STONE2, 14);
      [[1.55, 1.0, 0.9], [1.0, 1.55, 0.55], [1.4, 1.4, 1.2]].forEach(p => g.add(at(box(0.03, 0.14, 0.03, PM('#120e0a')), p[0], p[2], p[1])));
      if (mol) { g.add(at(cone(0.7, 0.85, TILE, 24, 1.6), 1, 2.16, 1)); flag(g, 1, 2.55, 1, 0.3, team, 0.2); }
      else { g.add(at(cone(0.66, 0.95, LEAD, 24), 1, 2.2, 1)); flag(g, 1, 2.62, 1, 0.3, team, 0.2); }
      break;
    }
    case 'joagar': {
      ground(0.05, 0.05, 1.95, 1.95, 'forest_ground_04', '#d0b890');
      g.add(blk(0.85, 0.35, 1.72, 0.5, 0, 0.45, LOGS, 2));
      g.add(blk(1.57, 0.5, 1.72, 1.2, 0, 0.45, LOGS, 2));
      [[0.9, 1.15], [1.6, 1.15]].forEach(p => g.add(at(cyl(0.025, 0.025, 0.45, WOOD, 8), p[0], 0.225, p[1])));
      g.add(gableRoof(0.75, 0.25, 1.82, 1.3, 0.45, 0.3, SHINGLE, true, PLANKS));
      logPile(g, 0.75, 1.55, 3);
      g.add(at(cyl(0.09, 0.1, 0.12, TM('medieval_wood', '#a08060'), 12, 2), 1.55, 0.06, 1.62));
      g.add(at(box(0.03, 0.16, 0.012, PM('#555a60', 0.4, 0.8)), 1.58, 0.17, 1.62, 0, 0, 0.3));
      break;
    }
    case 'mina': {
      ground(0.05, 0.05, 1.95, 1.95, 'river_small_rocks', '#c8c0b0');
      const rock = mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), STONE2); rock.scale.set(1.2, 0.8, 0.9); at(rock, 0.85, 0, 0.75); g.add(rock);
      g.add(at(box(0.28, 0.3, 0.06, PM('#0e0a07'), 1), 0.85, 0.15, 1.18));
      [0.68, 1.02].forEach(x => g.add(at(cyl(0.025, 0.025, 0.36, WOOD, 8), x, 0.18, 1.2)));
      g.add(at(box(0.42, 0.04, 0.06, PM('#5e3e22', 0.85), 2), 0.85, 0.36, 1.2));
      g.add(blk(1.25, 1.2, 1.7, 1.58, 0.03, 0.1, PLANKS, 3));
      [[1.3, 1.2], [1.65, 1.2], [1.3, 1.58], [1.65, 1.58]].forEach(p => g.add(at(cyl(0.035, 0.035, 0.02, PM('#2a2018'), 10), p[0], 0.035, p[1], Math.PI / 2)));
      for (let i = 0; i < 9; i++) g.add(at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + (i % 3) * 0.008), i % 2 ? PM('#e6c040', 0.35, 0.8) : PM('#8a8478', 0.9)), 1.33 + (i % 3) * 0.12, 0.17, 1.27 + Math.floor(i / 3) * 0.1));
      break;
    }
    case 'moara': {
      ground(0.15, 0.15, 1.85, 1.85);
      if (mol) {
        g.add(blk(0.6, 0.6, 1.4, 1.4, 0, 0.12, STONE2, 3));
        g.add(blk(0.62, 0.62, 1.38, 1.38, 0.12, 0.88, LOGS, 2));
        opening(g, 'z', 0.88, 1.12, 1.38, 0.12, 0.42);
        opening(g, 'x', 0.88, 1.08, 1.38, 0.6, 0.76, '#2a2018', '#6a4a2a');
        g.add(hipRoof(0.52, 0.52, 1.48, 1.48, 1.0, 0.5, SHINGLE, 1.4));
      } else {
        g.add(at(cyl(0.44, 0.5, 1.0, STONE2, 24, 1.6), 1, 0.5, 1));
        opening(g, 'z', 0.9, 1.1, 1.48, 0, 0.36);
        g.add(at(cone(0.54, 0.55, OTILE, 24, 1.6), 1, 1.27, 1));
      }
      info.hub = [1.45, 0.86, 1.45];
      break;
    }
    case 'ogor': {
      const soil = mesh(new THREE.PlaneGeometry(2.9, 2.9), TM('dirt', '#e0c49a', 1)); at(soil, 1.5, 0.003, 1.5, -Math.PI / 2); soil.castShadow = false; g.add(soil);
      const uv = soil.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
      const wheat = new THREE.ConeGeometry(0.035, 0.16, 5);
      const mats3 = [PM('#d8b850', 0.9), PM('#c8a840', 0.9), PM('#b8b048', 0.9)];
      for (let r = 0; r < 11; r++) {
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.01, 0.07), PM('#5e4528', 1)), 1.5, 0.006, 0.2 + r * 0.26 + 0.13));
        for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(wheat, mats3[(r + i) % 3]); m.castShadow = true; at(m, 0.18 + i * 0.155 + (r % 2) * 0.07, 0.08, 0.2 + r * 0.26, 0, 0, (i % 3 - 1) * 0.08); g.add(m); }
      }
      break;
    }
    case 'cazarma': {
      ground(0.1, 0.1, 2.9, 2.9);
      if (mol) {
        for (let x = 0.2; x < 2.85; x += 0.11) g.add(at(cyl(0.035, 0.035, 0.36, TM('medieval_wood', '#a08060'), 7, 2), x, 0.18, 0.18));
        for (let z = 0.3; z < 2.85; z += 0.11) g.add(at(cyl(0.035, 0.035, 0.36, TM('medieval_wood', '#a08060'), 7, 2), 0.18, 0.18, z));
        g.add(blk(0.45, 0.72, 2.6, 2.3, 0, 0.55, LOGS, 2));
        opening(g, 'z', 1.3, 1.75, 2.3, 0, 0.36);
        opening(g, 'x', 1.25, 1.45, 2.6, 0.24, 0.4, '#20160e', '#6a4a2a');
        g.add(gableRoof(0.32, 0.58, 2.74, 2.44, 0.55, 0.55, SHINGLE, true, PLANKS));
        [0.75, 2.2].forEach(x => { const s = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), PM(team, 0.6)); at(s, x, 0.26, 2.32, Math.PI / 2); g.add(s); g.add(at(mesh(new THREE.SphereGeometry(0.025, 8, 6), PM('#c8c8c8', 0.35, 0.8)), x, 0.26, 2.335)); });
        for (let i = 0; i < 5; i++) { g.add(at(cyl(0.008, 0.008, 0.7, WOOD, 6), 2.86, 0.35, 0.85 + i * 0.22)); g.add(at(cone(0.016, 0.07, PM('#c8ccd2', 0.35, 0.8), 6), 2.86, 0.73, 0.85 + i * 0.22)); }
      } else {
        const TT = tentMat(team);
        g.add(at(cyl(0.42, 0.42, 0.3, TT, 16, 0.4), 0.7, 0.15, 0.7)); g.add(at(cone(0.48, 0.45, TT, 16, 0.4), 0.7, 0.52, 0.7));
        g.add(at(cyl(0.95, 0.95, 0.42, TT, 24, 0.25), 1.6, 0.21, 1.6)); g.add(at(cone(1.04, 0.95, TT, 24, 0.25), 1.6, 0.9, 1.6));
        g.add(at(box(0.36, 0.3, 0.04, PM('#3a1008', 0.9)), 1.6, 0.15, 2.56));
        flag(g, 1.6, 1.36, 1.6, 0.35, '#2f7d4a', 0.24);
      }
      break;
    }
    case 'poligon': {
      ground(0.08, 0.08, 2.92, 2.92, 'forest_ground_04', '#d8c8a0');
      g.add(blk(0.35, 0.35, 1.45, 1.3, 0, H0, mol ? LOGS : PLASTER, 2));
      opening(g, 'z', 0.7, 0.95, 1.3, 0, 0.3);
      g.add(gableRoof(0.25, 0.25, 1.55, 1.4, H0, 0.32, mol ? SHINGLE : OTILE, true, mol ? PLANKS : PLASTER));
      const rings = canvasMat(128, 128, (c) => { [[64, '#e8dcc0'], [48, '#b8302a'], [32, '#e8dcc0'], [16, '#b8302a']].forEach(r => { c.fillStyle = r[1]; c.beginPath(); c.arc(64, 64, r[0], 0, 6.3); c.fill(); }); });
      [[2.25, 2.3], [2.5, 1.2]].forEach(p => {
        g.add(at(cyl(0.012, 0.012, 0.42, WOOD, 6), p[0] - 0.06, 0.21, p[1], 0, 0, 0.12));
        g.add(at(cyl(0.012, 0.012, 0.42, WOOD, 6), p[0] + 0.06, 0.21, p[1], 0, 0, -0.12));
        const tg = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), [PM('#c8a860', 0.95), rings, rings]); at(tg, p[0], 0.36, p[1] + 0.03, Math.PI / 2 - 0.15, Math.PI / 4); g.add(tg);
      });
      [[1.9, 0.5], [2.35, 0.6]].forEach(p => { const b = cyl(0.12, 0.12, 0.2, PM('#d6b450', 0.95), 14); at(b, p[0], 0.1, p[1], 0, 0, Math.PI / 2); g.add(b); });
      break;
    }
    case 'grajd': {
      ground(0.1, 0.1, 2.9, 2.9);
      g.add(blk(0.4, 0.5, 2.6, 2.25, 0, 0.56, PLANKS, 2));
      g.add(at(box(0.8, 0.44, 0.03, PM('#3a2614', 0.9)), 1.5, 0.22, 2.26));
      g.add(gableRoof(0.3, 0.4, 2.7, 2.35, 0.56, 0.6, mol ? THATCH : OTILE, false, PLANKS));
      const hay = mesh(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), TM('reed_roof_04', '#f0d890', 1)); hay.scale.set(1, 0.6, 1); at(hay, 2.55, 0, 2.6); g.add(hay);
      for (let x = 0.3; x < 2.85; x += 0.42) g.add(at(cyl(0.02, 0.02, 0.24, WOOD, 6), x, 0.12, 2.8));
      [0.08, 0.16].forEach(y => g.add(at(box(2.5, 0.025, 0.025, WOOD), 1.55, y, 2.8)));
      break;
    }
    case 'fierarie': {
      ground(0.12, 0.12, 2.88, 2.88, 'river_small_rocks', '#b8b0a0');
      g.add(blk(0.5, 0.6, 2.5, 2.4, 0, 0.5, STONE2, 1.6));
      g.add(at(box(0.5, 0.36, 0.04, PM('#ff8a2a', 0.6, 0, '#ff6a10')), 1.45, 0.18, 2.41));
      g.add(hipRoof(0.4, 0.5, 2.6, 2.5, 0.5, 0.48, mol ? SHINGLE : OTILE, 1.4));
      g.add(blk(1.75, 0.75, 2.1, 1.1, 0.5, 0.75, STONE2, 2));
      info.chimney = [1.92, 1.3, 0.92];
      g.add(at(box(0.2, 0.1, 0.1, PM('#2e3034', 0.45, 0.85)), 1.4, 0.13, 2.85));
      g.add(at(box(0.08, 0.08, 0.06, PM('#2e3034', 0.45, 0.85)), 1.4, 0.04, 2.85));
      break;
    }
    case 'manastire': {
      ground(0.1, 0.1, 2.9, 2.9, 'river_small_rocks', '#c8c0b0');
      if (mol) {
        for (let x = 0.15; x < 2.85; x += 0.6) g.add(blk(x, 0.12, Math.min(2.85, x + 0.58), 0.28, 0, 0.22, STONE2, 2));
        const P = paintedMat();
        const nave = blk(0.7, 1.0, 2.4, 2.0, 0, 0.72, P, 1); g.add(nave);
        const uvs = nave.geometry.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * 0.35, uvs.getY(i) * 0.5);
        g.add(blk(0.68, 0.98, 2.42, 2.02, 0.72, 0.06, PLASTER, 2));
        opening(g, 'x', 1.3, 1.7, 2.42, 0, 0.42, '#2a1a10', '#d9b44a');
        [1.0, 1.9].forEach(x => opening(g, 'z', x, x + 0.18, 2.02, 0.35, 0.56, '#1a1626', '#d9b44a'));
        g.add(hipRoof(0.5, 0.8, 2.6, 2.2, 0.78, 0.6, SHINGLE, 1.4));
        g.add(at(cyl(0.3, 0.3, 0.6, P, 16, 0.6), 1.55, 1.2, 1.5));
        g.add(at(cone(0.38, 0.5, SHINGLE, 16, 1.4), 1.55, 1.75, 1.5));
        g.add(at(box(0.02, 0.3, 0.02, GOLD), 1.55, 2.12, 1.5)); g.add(at(box(0.16, 0.02, 0.02, GOLD), 1.55, 2.18, 1.5, 0, Math.PI / 4));
      } else {
        g.add(blk(0.6, 0.6, 2.4, 2.4, 0, 0.6, PLASTER, 1.6));
        opening(g, 'z', 1.25, 1.75, 2.4, 0, 0.38, '#24485a', '#d9b44a');
        [0.85, 2.05].forEach(x => opening(g, 'z', x, x + 0.2, 2.4, 0.25, 0.45, '#22303a', '#d9b44a'));
        const d = dome(0.86, LEAD, 32); at(d, 1.5, 0.6, 1.5); g.add(d); g.add(at(cyl(0.01, 0.01, 0.25, GOLD, 6), 1.5, 1.58, 1.5));
        g.add(at(cyl(0.14, 0.16, 1.9, PLASTER, 16, 2), 2.7, 0.95, 0.5)); g.add(at(cyl(0.21, 0.21, 0.05, PLASTER, 16, 2), 2.7, 1.4, 0.5));
        g.add(at(cone(0.17, 0.5, LEAD, 16), 2.7, 2.15, 0.5));
      }
      break;
    }
  }
  return { root: g, info };
}
