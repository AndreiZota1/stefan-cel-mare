// Natura în 3D: foioase și brazi, mine de aur și de piatră, tufe de mure, oi.
import { THREE } from './core.js';

const R0 = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function mesh(g, m) { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }

// frunziș: pete de frunze pe fundal transparent (decupate cu alphaTest), ca marginile să pară frunze
function leafTex(cols, needles) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), R = R0(cols.length * 7 + (needles ? 3 : 1));
  for (let i = 0; i < (needles ? 1600 : 900); i++) {
    const x = R() * 256, y = R() * 256, col = cols[(R() * cols.length) | 0];
    g.fillStyle = col; g.strokeStyle = col;
    if (needles) { g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 10, y + 6 + R() * 6); g.stroke(); }
    else { g.beginPath(); g.ellipse(x, y, 3 + R() * 4, 2 + R() * 3, R() * 3, 0, 6.3); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}
function blob(r, detail, R, rough) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + (R() - 0.5) * (rough || 0.35); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  g.computeVertexNormals();
  return g;
}
const loader = new THREE.TextureLoader(), texC = {};
function tex(name) { if (!texC[name]) { const t = loader.load('/tex/' + name + '_diff.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; texC[name] = t; } return texC[name]; }

export function tree(v) {
  const g = new THREE.Group(), R = R0(1000 + v * 97), con = v >= 4;
  const bark = new THREE.MeshStandardMaterial({ map: tex('medieval_wood'), color: new THREE.Color(con ? '#c8a888' : '#e0c4a4'), roughness: 0.95 });
  if (!con) {
    const H = 0.75 + R() * 0.25;
    const trunk = mesh(new THREE.CylinderGeometry(0.05, 0.085, H, 9), bark); at(trunk, 0, H / 2, 0, 0, 0, (R() - 0.5) * 0.08); g.add(trunk);
    for (let b = 0; b < 3; b++) { const br = mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.45, 6), bark); const a = b / 3 * Math.PI * 2 + R(); at(br, Math.cos(a) * 0.12, H - 0.05, Math.sin(a) * 0.12, Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(br); }
    const pals = [['#3d6b25', '#4f8530', '#62983a', '#2f5a1e'], ['#4a7a2a', '#5d9234', '#77a842', '#3a6420'], ['#36622a', '#467a34', '#5a9040', '#2a5020'], ['#557a28', '#6a9030', '#86a840', '#46661e']][v];
    const leaves = new THREE.MeshStandardMaterial({ map: leafTex(pals), alphaTest: 0.32, side: THREE.DoubleSide, roughness: 0.82 });
    const inner = new THREE.MeshStandardMaterial({ color: new THREE.Color(pals[3]), roughness: 0.9 });
    const cy = H + 0.38, rx = 0.52 + R() * 0.14, ry = 0.46 + R() * 0.1;
    const core = mesh(blob(0.42, 2, R, 0.25), inner); core.scale.set(rx / 0.5, ry / 0.5, rx / 0.5); at(core, 0, cy, 0); g.add(core);
    for (let i = 0; i < 34; i++) {
      const th = R() * Math.PI * 2, ph = Math.acos(2 * R() - 1), rr = 0.75 + R() * 0.3;
      const x = Math.sin(ph) * Math.cos(th) * rx * rr, y = Math.cos(ph) * ry * rr * 0.85, z = Math.sin(ph) * Math.sin(th) * rx * rr;
      const b2 = mesh(blob(0.15 + R() * 0.08, 1, R, 0.4), leaves); at(b2, x, cy + y, z, R() * 3, R() * 3, R() * 3); g.add(b2);
    }
    return { root: g, h: cy + ry + 0.2 };
  }
  const H = 1.9 + R() * 0.45;
  const trunk = mesh(new THREE.CylinderGeometry(0.03, 0.07, H * 0.55, 8), bark); at(trunk, 0, H * 0.275, 0); g.add(trunk);
  const pals = [['#3a7038', '#4a8444', '#2f5c30', '#58944e'], ['#356438', '#437842', '#2a5230', '#50884c'], ['#3c7434', '#4c8840', '#30602c', '#5c9a4a'], ['#30603a', '#3c7244', '#264e2e', '#4a844e']][v - 4];
  const ndl = new THREE.MeshStandardMaterial({ map: leafTex(pals, true), alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.85 });
  const body = new THREE.MeshStandardMaterial({ color: new THREE.Color(pals[2]), roughness: 0.92 });
  const layers = 7;
  for (let i = 0; i < layers; i++) {
    const t = i / layers, r = 0.46 * (1 - t * 0.82) + 0.04, y = 0.32 + t * (H - 0.45), h = 0.42 - t * 0.12;
    const cg = new THREE.ConeGeometry(r, h, 11, 2, true), p = cg.attributes.position;
    for (let k = 0; k < p.count; k++) { if (p.getY(k) < 0) { const j = 1 + (R() - 0.5) * 0.45; p.setXYZ(k, p.getX(k) * j, p.getY(k) - R() * 0.05, p.getZ(k) * j); } }
    cg.computeVertexNormals();
    g.add(at(mesh(cg, ndl), 0, y + h / 2, 0, 0, R() * 3, 0));
    g.add(at(mesh(new THREE.ConeGeometry(r * 0.82, h * 0.9, 9), body), 0, y + h / 2 - 0.01, 0));
  }
  g.add(at(mesh(new THREE.ConeGeometry(0.06, 0.22, 7), body), 0, H + 0.05, 0));
  return { root: g, h: H + 0.2 };
}

export function mine(kind) {
  const g = new THREE.Group(), R = R0(kind === 'gold' ? 11 : 22);
  const rockM = new THREE.MeshStandardMaterial({ map: tex(kind === 'gold' ? 'rustic_stone_wall' : 'castle_wall_slates'), color: new THREE.Color(kind === 'gold' ? '#e0d0b8' : '#f4f4f2'), roughness: 0.9 });
  [[-0.2, 0.15, 0.2], [0.18, 0.12, 0.22], [0.0, -0.2, 0.24], [0.3, -0.15, 0.16], [-0.3, -0.12, 0.14], [0.05, 0.3, 0.15]].forEach(([x, z, r]) => {
    const m = mesh(blob(r, 1, R, 0.5), rockM); m.scale.set(1, 0.7 + R() * 0.3, 1); at(m, x, r * 0.45, z, R(), R() * 3, R()); g.add(m);
  });
  if (kind === 'gold') {
    const goldM = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f2c440'), metalness: 0.85, roughness: 0.28, emissive: new THREE.Color('#5a3c00'), emissiveIntensity: 0.4 });
    for (let i = 0; i < 26; i++) {
      const th = R() * Math.PI * 2, rr = 0.1 + R() * 0.3;
      g.add(at(mesh(new THREE.DodecahedronGeometry(0.025 + R() * 0.03), goldM), Math.cos(th) * rr, 0.08 + R() * 0.2, Math.sin(th) * rr, R() * 3, R() * 3, 0));
    }
  } else {
    const chip = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e8e6e0'), roughness: 0.6 });
    for (let i = 0; i < 18; i++) { const th = R() * Math.PI * 2, rr = 0.15 + R() * 0.35; g.add(at(mesh(new THREE.DodecahedronGeometry(0.02 + R() * 0.03), chip), Math.cos(th) * rr, 0.02, Math.sin(th) * rr, R() * 3, R() * 3, 0)); }
  }
  return { root: g };
}

export function berry() {
  const g = new THREE.Group(), R = R0(33);
  const pals = ['#2f5a24', '#3d6e2c', '#4e8436', '#264a1e'];
  const leaves = new THREE.MeshStandardMaterial({ map: leafTex(pals), alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.85 });
  const inner = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a4e20'), roughness: 0.9 });
  const core = mesh(blob(0.2, 1, R, 0.3), inner); core.scale.set(1.2, 0.8, 1.2); at(core, 0, 0.16, 0); g.add(core);
  for (let i = 0; i < 16; i++) { const th = R() * Math.PI * 2, rr = 0.12 + R() * 0.14; g.add(at(mesh(blob(0.09 + R() * 0.05, 1, R, 0.4), leaves), Math.cos(th) * rr, 0.12 + R() * 0.16, Math.sin(th) * rr, R() * 3, R() * 3, 0)); }
  const bm = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1c0c26'), roughness: 0.3, metalness: 0.1 });
  const bm2 = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5a2266'), roughness: 0.35 });
  for (let i = 0; i < 40; i++) { const th = R() * Math.PI * 2, ph = R() * 1.3, rr = 0.24; g.add(at(mesh(new THREE.SphereGeometry(0.018, 6, 5), R() < 0.7 ? bm : bm2), Math.cos(th) * Math.sin(ph) * rr * 1.2, 0.16 + Math.cos(ph) * rr * 0.75, Math.sin(th) * Math.sin(ph) * rr * 1.2)); }
  return { root: g };
}

export function sheep(pose) {
  const g = new THREE.Group(), R = R0(44);
  const c = document.createElement('canvas'); c.width = c.height = 128; const cx = c.getContext('2d');
  cx.fillStyle = '#efece4'; cx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) { cx.fillStyle = R() < 0.5 ? '#ffffff' : '#d8d2c4'; cx.beginPath(); cx.arc(R() * 128, R() * 128, 2 + R() * 3, 0, 6.3); cx.fill(); }
  const wt = new THREE.CanvasTexture(c); wt.colorSpace = THREE.SRGBColorSpace;
  const wool = new THREE.MeshStandardMaterial({ map: wt, roughness: 1 }), dark = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a2622'), roughness: 0.8 });
  const body = mesh(blob(0.13, 2, R, 0.15), wool); body.scale.set(1.35, 0.95, 1); at(body, 0, 0.17, 0); g.add(body);
  const head = new THREE.Group(); head.position.set(0.17, pose ? 0.12 : 0.2, 0); g.add(head);
  head.add(at(mesh(new THREE.SphereGeometry(0.05, 10, 8), dark), 0.03, 0, 0)); head.children[0].scale.set(1.4, 0.9, 0.85);
  head.add(at(mesh(new THREE.SphereGeometry(0.045, 10, 8), wool), -0.02, 0.025, 0));
  [[-0.1, 0.06], [0.1, 0.06], [-0.1, -0.06], [0.1, -0.06]].forEach(([x, z]) => g.add(at(mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.11, 6), dark), x, 0.055, z)));
  return { root: g };
}
