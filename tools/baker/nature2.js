// Natura v2, realistă: copaci generați cu EZ-Tree (MIT, Dan Greenheck), stânci și cioturi scanate (Poly Haven, CC0),
// tufe de mure, oi mai adevărate, stuf, bușteni, flori. Iarna, foioasele își pierd frunzele și toate țin zăpadă.
import { THREE, ENV } from './core.js';
import { Tree } from '/node_modules/@dgreenheck/ez-tree/build/ez-tree.es.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const R0 = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function mesh(g, m) { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }

// zăpada: fețele care privesc în sus se albesc (în umbră, alb-albăstrui)
export function snowify(root, amount = 1) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach(m => {
      if (m.userData.snowy) return; m.userData.snowy = true;
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev(sh, r);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vUpS;').replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\nvUpS = normalize(mat3(modelMatrix) * objectNormal).y;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vUpS;').replace('#include <map_fragment>', `#include <map_fragment>
          { float sn = smoothstep(0.15, 0.55, vUpS) * ${amount.toFixed(2)}; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.98), sn); }`);
      };
      m.needsUpdate = true;
    });
  });
  return root;
}

// ---------- copacii ----------
// v 0–3: foioase (stejar, frasin), v 4–7: molizi și pini. Înălțimea în laturi de pătrățel.
const TREES = [
  { p: 'Oak Medium', seed: 1201, h: 1.75, leafN: 1.7, leafS: 1.3 },
  { p: 'Ash Medium', seed: 2302, h: 1.8, leafN: 1.7, leafS: 1.25 },
  { p: 'Oak Large', seed: 3403, h: 2.0, leafN: 2.0, leafS: 1.15 },
  { p: 'Ash Small', seed: 4504, h: 1.55, leafN: 1.4, leafS: 1.3 },
  { p: 'Pine Medium', seed: 5605, h: 2.3, leafN: 1.5, leafS: 1.25 },
  { p: 'Pine Large', seed: 6706, h: 2.55, leafN: 1.6, leafS: 1.15 },
  { p: 'Pine Medium', seed: 7807, h: 2.15, leafN: 1.5, leafS: 1.3 },
  { p: 'Pine Small', seed: 8908, h: 1.9, leafN: 1.4, leafS: 1.3 }
];
// frunzișul: normale rotunjite pe coroană (lumina cade ca pe un nor de frunze, nu pe fiecare frunză în parte),
// fără întoarcerea normalei pe dos și cu puțină lumină trecută prin frunze
function foliage(meshL, conifer) {
  const g = meshL.geometry, P = g.attributes.position, Nn = g.attributes.normal;
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()), sz = g.boundingBox.getSize(new THREE.Vector3());
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.set(P.getX(i) - c.x, (P.getY(i) - c.y) * (conifer ? 0.35 : 0.8) + sz.y * (conifer ? 0.12 : 0.18), P.getZ(i) - c.z).normalize();
    n.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i));
    if (n.dot(v) < 0) n.negate();
    n.lerp(v, 0.8).normalize(); Nn.setXYZ(i, n.x, n.y, n.z);
  }
  Nn.needsUpdate = true;
  const old = meshL.material;
  const m = new THREE.MeshStandardMaterial({ map: old.map, color: new THREE.Color(conifer ? 0xd8e6cf : 0xe8f0d8), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.82, emissiveMap: old.map, emissive: new THREE.Color(conifer ? 0x0c140a : 0x16200c) });
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\nvec3 normal = normalize( vNormal );\nvec3 nonPerturbedNormal = normal;'); };
  meshL.material = m; old.dispose();
}
export function tree(v, winter) {
  const d = TREES[v], t = new Tree(), con = v >= 4;
  t.loadPreset(d.p);
  t.options.seed = d.seed;
  t.options.leaves.tint = 0xffffff;
  t.options.leaves.count = Math.round(t.options.leaves.count * d.leafN);
  t.options.leaves.size *= d.leafS;
  if (winter && !con) t.options.leaves.count = 0;
  t.generate();
  if (winter && !con) t.leavesMesh.visible = false;
  if (t.leavesMesh.geometry.attributes.position) foliage(t.leavesMesh, con);
  const bark = t.branchesMesh.material;
  t.branchesMesh.material = new THREE.MeshStandardMaterial({ map: bark.map, normalMap: bark.normalMap, aoMap: bark.aoMap, color: new THREE.Color(0xc8beb0), roughness: 0.95 });
  // la scara jocului: înălțimea dorită, baza în origine
  t.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(t), s = d.h / (bb.max.y - bb.min.y);
  const g = new THREE.Group(); t.scale.setScalar(s); t.position.y = -bb.min.y * s; g.add(t);
  t.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  if (winter) snowify(g, con ? 0.7 : 0.85);
  return { root: g, h: d.h };
}

// ---------- modelele scanate (Poly Haven) ----------
const gl = new GLTFLoader(), gcache = {};
export function loadModel(name) {
  if (!gcache[name]) gcache[name] = new Promise((res, rej) => gl.load('/tex/models/' + name + '/' + name + '_1k.gltf', g => res(g.scene), undefined, rej));
  return gcache[name].then(s => s.clone(true));
}
export async function modelPart(name, idx) {
  const s = await loadModel(name), parts = [];
  s.traverse(o => { if (o.isMesh) parts.push(o); });
  return parts;
}
// o bucată dintr-un model scanat, cu baza în origine, la mărimea cerută (cea mai mare latură)
async function piece(name, idx, size, tint) {
  const s = await loadModel(name), parts = [];
  s.traverse(o => { if (o.isMesh) parts.push(o); });
  const src = parts[idx % parts.length], g = src.geometry.clone();
  g.computeBoundingBox(); const b = g.boundingBox, c = b.getCenter(new THREE.Vector3()), z = b.getSize(new THREE.Vector3());
  g.translate(-c.x, -b.min.y, -c.z);
  const k = size / Math.max(z.x, z.y, z.z);
  const m = mesh(g, src.material.clone()); m.scale.setScalar(k);
  m.material.color = new THREE.Color(tint || 0xffffff);
  if (m.material.map) { m.material.emissiveMap = m.material.map; m.material.emissive = new THREE.Color(0x404040); }
  m.material.envMap = null; m.userData.dims = z.clone().multiplyScalar(k);
  return m;
}
// puncte de pe suprafața unei bucăți (vârfuri ale plaselor, cu normala în sus sau în lături)
function surfacePts(m, n, R, minUp) {
  const P = m.geometry.attributes.position, Nn = m.geometry.attributes.normal, out = [], v = new THREE.Vector3(), nn = new THREE.Vector3();
  m.updateMatrixWorld(true);
  for (let tries = 0; out.length < n && tries < n * 40; tries++) {
    const i = (R() * P.count) | 0; nn.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i)).transformDirection(m.matrixWorld);
    if (nn.y < (minUp ?? -0.2)) continue;
    v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m.matrixWorld);
    out.push([v.clone(), nn.clone()]);
  }
  return out;
}

// zgomot 3D (valori pe o rețea, interpolate), pentru vinele de aur
function hash3(x, y, z) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t, c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}

// ---------- minele (3 așezări diferite, ca grămezile vecine să nu fie identice) ----------
const GOLD_L = [
  [[0, 0.62, -0.18, -0.12, 0.3], [3, 0.5, 0.26, 0.05, 1.7], [5, 0.44, -0.08, 0.3, 2.6], [2, 0.34, 0.36, -0.3, 0.9]],
  [[4, 0.66, 0.05, -0.1, 1.2], [1, 0.46, -0.3, 0.2, 2.9], [2, 0.38, 0.32, 0.26, 0.4], [5, 0.3, -0.25, -0.32, 1.9]],
  [[1, 0.58, -0.05, 0.05, 2.2], [0, 0.48, 0.3, -0.22, 0.7], [3, 0.4, -0.32, -0.18, 1.4], [4, 0.32, 0.12, 0.36, 3.1]]
];
const STONE_L = [
  [[5, 0.62, -0.1, -0.15, 0.4], [3, 0.5, 0.28, 0.12, 2.2], [0, 0.4, -0.3, 0.28, 1.1], [6, 0.36, 0.3, -0.32, 2.9], [1, 0.3, 0.05, 0.4, 0.2]],
  [[4, 0.66, 0.08, 0.0, 1.7], [2, 0.46, -0.3, -0.2, 0.6], [6, 0.38, -0.22, 0.3, 2.4], [0, 0.32, 0.36, 0.28, 1.2]],
  [[3, 0.6, -0.2, 0.1, 2.8], [5, 0.48, 0.25, -0.18, 0.9], [1, 0.4, 0.28, 0.32, 1.6], [2, 0.3, -0.34, -0.3, 0.3], [6, 0.26, 0.0, -0.4, 2.0]]
];
async function goldMine(v, winter) {
  const g = new THREE.Group(), R = R0(91 + v * 13), rocks = [];
  for (const [i, sz, x, z, ry] of GOLD_L[v % 3]) { const m = await piece('rock_moss_set_01', i, sz, 0xf2e6d0); m.position.set(x, -0.03, z); m.rotation.y = ry; g.add(m); rocks.push(m); }
  // vinele de aur: linii șerpuite (unde zgomotul trece prin mijloc), din fulgi metalici, plus câteva pepite căzute
  const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e9b52a'), metalness: 0.75, roughness: 0.32, envMap: ENV, envMapIntensity: 1.1, emissive: new THREE.Color('#5c3a00'), emissiveIntensity: 0.5 });
  const flake = [new THREE.DodecahedronGeometry(0.012, 0), new THREE.DodecahedronGeometry(0.017, 0), new THREE.IcosahedronGeometry(0.024, 0)];
  g.updateMatrixWorld(true);
  rocks.forEach((r, ri) => {
    surfacePts(r, 1100, R, -0.05).forEach(([p, n]) => {
      const a = Math.abs(noise3(p.x * 6 + ri * 3.1, p.y * 6, p.z * 6 + v * 5.3) - 0.5), b = Math.abs(noise3(p.x * 11 + 9, p.y * 11 + ri, p.z * 11) - 0.5);
      if (a > 0.014 && b > 0.006) return;
      const nm = mesh(flake[(R() * 3) | 0], gold); nm.position.copy(p).addScaledVector(n, 0.002); nm.rotation.set(R() * 3, R() * 3, R() * 3);
      const k = 0.8 + R() * 0.6; nm.scale.set(k, k * 0.45, k); g.add(nm);
    });
  });
  for (let i = 0; i < 8; i++) { const th = R() * Math.PI * 2, rr = 0.3 + R() * 0.32, nm = mesh(flake[2], gold); nm.position.set(Math.cos(th) * rr, 0.008, Math.sin(th) * rr); nm.rotation.set(R() * 3, R() * 3, R() * 3); g.add(nm); }
  if (winter) snowify(g, 0.7);
  return { root: g, guess: [96, 80, 46, 52], shadow: 1.4 };
}
async function stoneMine(v, winter) {
  const g = new THREE.Group(), R = R0(92 + v * 17);
  for (const [i, sz, x, z, ry] of STONE_L[v % 3]) { const m = await piece('rock_moss_set_02', i, sz, 0xf0f0f2); m.position.set(x, -0.02, z); m.rotation.y = ry; g.add(m); }
  // așchii de piatră spartă
  const chip = new THREE.MeshStandardMaterial({ color: new THREE.Color('#b4b1a8'), roughness: 0.8 });
  for (let i = 0; i < 16; i++) { const th = R() * Math.PI * 2, rr = 0.3 + R() * 0.32, sz = 0.015 + R() * 0.03, c = mesh(new THREE.DodecahedronGeometry(sz, 0), chip); c.position.set(Math.cos(th) * rr, sz * 0.4, Math.sin(th) * rr); c.rotation.set(R() * 3, R() * 3, R() * 3); g.add(c); }
  if (winter) snowify(g, 0.75);
  return { root: g, guess: [96, 80, 46, 52], shadow: 1.4 };
}

// ---------- tufele (EZ-Tree, presetul Bush) și murele ----------
function bush(v, berries, winter) {
  const t = new Tree(), R = R0(300 + v * 17);
  t.loadPreset(['Bush 1', 'Bush 2', 'Bush 3'][v % 3]);
  t.options.seed = 4000 + v * 131;
  t.options.leaves.type = v % 2 ? 'oak' : 'ash';
  t.options.leaves.tint = 0xffffff;
  t.options.leaves.count = Math.round(t.options.leaves.count * 1.8);
  t.options.leaves.size *= 1.25;
  if (winter) t.options.leaves.count = Math.round(t.options.leaves.count * 0.15);
  t.generate();
  if (t.leavesMesh.geometry.attributes.position) foliage(t.leavesMesh, false);
  const bark = t.branchesMesh.material;
  t.branchesMesh.material = new THREE.MeshStandardMaterial({ map: bark.map, color: new THREE.Color(0xa89c8c), roughness: 0.95 });
  t.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(t), h = berries ? 0.62 : 0.42 + (v % 3) * 0.08, s = h / (bb.max.y - bb.min.y);
  const g = new THREE.Group(); t.scale.setScalar(s); t.position.y = -bb.min.y * s; g.add(t);
  t.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  if (berries && !winter) {
    // mure: ciorchini de bobițe negre-vinete, câteva încă roșii
    g.updateMatrixWorld(true);
    const ripe = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a1446'), roughness: 0.18, metalness: 0.1, envMap: ENV, envMapIntensity: 0.6 }), red = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c0202e'), roughness: 0.3 });
    const bg = new THREE.SphereGeometry(0.024, 8, 6), cen = new THREE.Box3().setFromObject(t).getCenter(new THREE.Vector3()), pts = surfacePts(t.leavesMesh, 150, R, -0.8);
    pts.forEach(([p]) => {
      const out = p.clone().sub(cen); if (out.length() < 0.16) return; out.normalize();
      for (let j = 0; j < 3; j++) { const b = mesh(bg, R() < 0.7 ? ripe : red); b.position.set(p.x + out.x * 0.02 + (R() - 0.5) * 0.035, p.y + out.y * 0.02 + (R() - 0.5) * 0.035, p.z + out.z * 0.02 + (R() - 0.5) * 0.035); g.add(b); }
    });
  }
  if (winter) snowify(g, 0.8);
  return { root: g, guess: [70, 64, 34, 46], shadow: 1.0 };
}

// ---------- oaia (țurcană: lână albă-gălbuie, botul și picioarele închise) ----------
function sheep(pose) {
  const g = new THREE.Group(), R = R0(44);
  const c = document.createElement('canvas'); c.width = c.height = 256; const cx = c.getContext('2d');
  cx.fillStyle = '#e9e3d4'; cx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { const x = R() * 256, y = R() * 256, r = 1.5 + R() * 3.5; cx.fillStyle = R() < 0.45 ? 'rgba(255,253,246,0.9)' : R() < 0.7 ? 'rgba(206,196,176,0.8)' : 'rgba(176,164,140,0.6)'; cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.fill(); }
  const wt = new THREE.CanvasTexture(c); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  const wool = new THREE.MeshStandardMaterial({ map: wt, roughness: 1, color: new THREE.Color('#f4efe4') });
  const face = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a2e26'), roughness: 0.75 }), hoof = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2a2420'), roughness: 0.7 });
  // trupul: lâna din ghemotoace care se suprapun
  const body = new THREE.Group(); g.add(body);
  const core = mesh(new THREE.SphereGeometry(0.12, 18, 14), wool); core.scale.set(1.45, 1.0, 1.0); at(core, 0, 0.19, 0); body.add(core);
  for (let i = 0; i < 26; i++) {
    const th = R() * Math.PI * 2, ph = R() * Math.PI * 0.62, rx = 0.16, ry = 0.1, rz = 0.105;
    const x = Math.cos(th) * Math.sin(ph) * rx, y = Math.cos(ph) * ry, z = Math.sin(th) * Math.sin(ph) * rz;
    const b = mesh(new THREE.IcosahedronGeometry(0.045 + R() * 0.025, 1), wool); at(b, x, 0.19 + y, z, R() * 3, R() * 3, R() * 3); body.add(b);
  }
  // capul (în jos, la păscut, în pose 1), urechile, botul
  const head = new THREE.Group(); head.position.set(0.19, pose ? 0.13 : 0.25, 0); head.rotation.z = pose ? -0.9 : -0.15; g.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.048, 14, 10), face); skull.scale.set(1.5, 0.95, 0.85); at(skull, 0.035, 0, 0); head.add(skull);
  const top = mesh(new THREE.SphereGeometry(0.042, 12, 9), wool); at(top, -0.01, 0.028, 0); head.add(top);
  [-1, 1].forEach(sg => { const e = mesh(new THREE.SphereGeometry(0.022, 8, 6), face); e.scale.set(1.6, 0.45, 0.9); at(e, 0.0, 0.01, sg * 0.05, sg * 0.5, 0, -0.3); head.add(e); });
  // picioarele
  [[-0.11, 0.065], [0.11, 0.065], [-0.11, -0.065], [0.11, -0.065]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.13, 7), hoof); at(l, x, 0.065, z); g.add(l); });
  const tail = mesh(new THREE.SphereGeometry(0.03, 8, 6), wool); at(tail, -0.19, 0.2, 0); g.add(tail);
  g.scale.setScalar(1.15);
  return { root: g, guess: [44, 40, 18, 26], shadow: 0.6 };
}

// ---------- stuful (papură cu spice brune) ----------
function reeds(v, winter) {
  const g = new THREE.Group(), R = R0(500 + v * 7);
  const stem = new THREE.MeshStandardMaterial({ color: new THREE.Color(winter ? '#a8946a' : '#6f8a3a'), roughness: 0.85, side: THREE.DoubleSide });
  const leafM = new THREE.MeshStandardMaterial({ color: new THREE.Color(winter ? '#b9a676' : '#7d9a40'), roughness: 0.85, side: THREE.DoubleSide });
  const head = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5a3a22'), roughness: 0.9 });
  const n = 9 + v * 3;
  for (let i = 0; i < n; i++) {
    const th = R() * Math.PI * 2, rr = R() * 0.14, h = 0.42 + R() * 0.3, lean = (R() - 0.5) * 0.25;
    const st = mesh(new THREE.CylinderGeometry(0.004, 0.007, h, 4), stem); at(st, Math.cos(th) * rr, h / 2, Math.sin(th) * rr, lean, 0, (R() - 0.5) * 0.25); g.add(st);
    if (R() < 0.55) { const hd = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.075, 7), head); at(hd, Math.cos(th) * rr + lean * h * 0.0, h - 0.06, Math.sin(th) * rr - lean * h * 0.5, lean, 0, 0); g.add(hd); }
    // frunze lungi, îndoite
    const lf = new THREE.PlaneGeometry(0.018, h * 0.8, 1, 4), P = lf.attributes.position;
    for (let k = 0; k < P.count; k++) { const y = P.getY(k) + h * 0.4; P.setZ(k, (y / h) * (y / h) * 0.12); }
    lf.computeVertexNormals();
    const lm = mesh(lf, leafM); at(lm, Math.cos(th) * rr, h * 0.4, Math.sin(th) * rr, 0, R() * 6.28, 0); g.add(lm);
  }
  return { root: g, guess: [40, 60, 20, 50], shadow: 0.7 };
}

// ---------- florile de câmp (maci, mușețel, albăstrele) ----------
function flowers(v) {
  const g = new THREE.Group(), R = R0(600 + v * 11);
  const stem = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4f7a2a'), roughness: 0.8 });
  const cols = v ? ['#f4f1e6', '#f4f1e6', '#e8c530', '#5a6fd0'] : ['#c8261c', '#d63a1e', '#c8261c', '#f4f1e6'];
  for (let i = 0; i < 16; i++) {
    const th = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.22, h = 0.08 + R() * 0.1, x = Math.cos(th) * rr, z = Math.sin(th) * rr;
    g.add(at(mesh(new THREE.CylinderGeometry(0.003, 0.003, h, 3), stem), x, h / 2, z));
    const col = cols[(R() * cols.length) | 0], pm = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.6, side: THREE.DoubleSide });
    const pet = mesh(new THREE.CircleGeometry(0.016 + R() * 0.008, 7), pm); at(pet, x, h, z, -Math.PI / 2 + (R() - 0.5) * 0.6, 0, 0); g.add(pet);
    if (col === '#f4f1e6') g.add(at(mesh(new THREE.CircleGeometry(0.006, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color('#e8b820') })), x, h + 0.002, z, -Math.PI / 2, 0, 0));
  }
  return { root: g, guess: [36, 24, 18, 14], shadow: 0.5 };
}

// ---------- bușteni, cioturi, bolovani ----------
async function log(v, winter) {
  const g = new THREE.Group(), m = await piece('dead_tree_trunk', 0, v ? 0.85 : 1.0);
  m.scale.y *= 1.9; m.scale.z *= 1.9; m.rotation.y = v ? 0.9 : -0.35; m.position.y = -0.02; g.add(m);
  if (winter) snowify(g, 0.8);
  return { root: g, guess: [70, 40, 35, 22], shadow: 0.9 };
}
async function stump(winter) {
  const g = new THREE.Group(), m = await piece('tree_stump_01', 0, 0.5);
  m.position.y = -0.02; g.add(m);
  if (winter) snowify(g, 0.8);
  return { root: g, guess: [40, 34, 20, 22], shadow: 0.6 };
}
async function rocks(v, winter) {
  const g = new THREE.Group(), R = R0(700 + v);
  const sets = [[[1, 0.42, 0, 0]], [[4, 0.36, -0.1, 0.05], [2, 0.22, 0.18, -0.1]], [[0, 0.3, 0, 0], [6, 0.18, 0.2, 0.12], [5, 0.14, -0.15, -0.16]]][v % 3];
  for (const [i, sz, x, z] of sets) { const m = await piece('rock_moss_set_02', i, sz, 0xd0d2d6); m.position.set(x, -0.02, z); m.rotation.y = R() * 6.28; g.add(m); }
  if (winter) snowify(g, 0.8);
  return { root: g, guess: [50, 40, 25, 26], shadow: 0.7 };
}

// ---------- intrarea comună: nume (fără cifră) + variantă ----------
export async function natModel(kind, v, winter) {
  if (kind === 'gold') return goldMine(v, winter);
  if (kind === 'stone') return stoneMine(v, winter);
  if (kind === 'berry') return bush(v * 3 + 3, true, winter);
  if (kind === 'bush') return bush(v, false, winter);
  if (kind === 'sheep') return sheep(v);
  if (kind === 'reed') return reeds(v, winter);
  if (kind === 'flowers') return flowers(v);
  if (kind === 'log') return log(v, winter);
  if (kind === 'stump') return stump(winter);
  if (kind === 'rock') return rocks(v, winter);
  throw new Error('natură necunoscută: ' + kind);
}
