// Oamenii, caii și mașinile de asediu, ca modele 3D cu articulații, plus animațiile lor.
import { THREE } from './core.js';

const mc = {};
export function M(hex, rough = 0.85, metal = 0, double = false) {
  const k = hex + '|' + rough + '|' + metal + '|' + double;
  if (!mc[k]) mc[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: metal, side: double ? THREE.DoubleSide : THREE.FrontSide });
  return mc[k];
}
const METAL = () => M('#a2a8b0', 0.35, 0.85), IRON = () => M('#5e636a', 0.45, 0.8), GOLD = () => M('#d9ab3c', 0.3, 0.9), WOOD = () => M('#6e4b2a', 0.82), LEATHER = () => M('#5a3a22', 0.8);
function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }
function cyl(rt, rb, h, mat, seg = 12, open = false, ts, tl) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), mat); }
function limb(rt, rb, len, mat) { const g = new THREE.CylinderGeometry(rt, rb, len, 9); g.translate(0, -len / 2, 0); return mesh(g, mat); }
function sph(r, mat, ws = 14, hs = 10) { return mesh(new THREE.SphereGeometry(r, ws, hs), mat); }
function box(x, y, z, mat) { return mesh(new THREE.BoxGeometry(x, y, z), mat); }
function cone(r, h, mat, seg = 12) { return mesh(new THREE.ConeGeometry(r, h, seg), mat); }
function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }

// ---------- pălării ----------
const HATS = {
  cusma(h, col = '#231912') { h.add(at(cyl(0.044, 0.048, 0.07, M(col, 1)), 0, 0.042)); },
  helm(h, spike) {
    const d = sph(0.05, METAL(), 14, 8); d.scale.set(1, 0.82, 1); at(d, 0, 0.012); h.add(d);
    h.add(at(cyl(0.052, 0.052, 0.008, IRON(), 16), 0, 0.006));
    h.add(at(box(0.006, 0.034, 0.012, METAL()), 0.048, -0.006));
    if (spike) h.add(at(cone(0.012, 0.04, METAL(), 8), 0, 0.068));
  },
  archer(h, col = '#4c5e2c') {
    const c = sph(0.047, M(col, 0.95), 14, 8); c.scale.set(1.05, 0.7, 1); at(c, -0.004, 0.018); h.add(c);
    h.add(at(cyl(0.004, 0.002, 0.08, M('#b33a2a', 0.9), 5), -0.03, 0.06, 0.02, 0, 0, 0.7));
  },
  crown(h) {
    h.add(at(sph(0.045, M('#5a1a14', 0.9), 12, 8), 0, 0.016));
    h.add(at(cyl(0.05, 0.048, 0.026, GOLD(), 16, true), 0, 0.032));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; h.add(at(cone(0.008, 0.025, GOLD(), 6), Math.cos(a) * 0.048, 0.056, Math.sin(a) * 0.048)); }
    h.add(at(sph(0.006, M('#b02030', 0.3, 0.2)), 0.05, 0.034));
  },
  turban(h, col = '#f1ede2', top = '#b03a2a', big = 1) {
    const t = mesh(new THREE.TorusGeometry(0.036 * big, 0.022 * big, 8, 18), M(col, 0.95));
    at(t, 0, 0.034 * big, 0, Math.PI / 2); h.add(t);
    h.add(at(sph(0.038 * big, M(col, 0.95)), 0, 0.048 * big));
    h.add(at(sph(0.022 * big, M(top, 0.9)), 0, 0.078 * big));
  },
  bork(h) {
    const b = cyl(0.036, 0.046, 0.13, M('#f2eee4', 0.95)); at(b, -0.022, 0.085, 0, 0, 0, 0.42); h.add(b);
    h.add(at(cyl(0.05, 0.05, 0.02, GOLD(), 16), 0, 0.026));
    h.add(at(box(0.008, 0.11, 0.05, M('#f2eee4', 0.95)), -0.06, -0.01));
    h.add(at(cone(0.009, 0.03, GOLD(), 6), 0.04, 0.05, 0, 0, 0, -0.3));
  },
  fez(h, col = '#b0302a') { h.add(at(cyl(0.036, 0.044, 0.06, M(col, 0.9)), 0, 0.04)); h.add(at(cyl(0.003, 0.003, 0.05, M('#222', 0.9), 4), -0.03, 0.04, 0, 0, 0, 0.6)); },
  sipahi(h) {
    const c = cone(0.05, 0.11, METAL(), 14); at(c, 0, 0.065); h.add(c);
    const t = mesh(new THREE.TorusGeometry(0.044, 0.016, 8, 18), M('#f1ede2', 0.95)); at(t, 0, 0.026, 0, Math.PI / 2); h.add(t);
    h.add(at(cyl(0.003, 0.002, 0.07, M('#c8352a', 0.9), 5), 0, 0.13, 0, 0, 0, -0.3));
  },
  pasha(h) {
    const b = sph(0.07, M('#f4f1ea', 0.95), 16, 12); b.scale.set(1, 0.85, 1); at(b, 0, 0.045); h.add(b);
    h.add(at(sph(0.03, M('#2f7d4a', 0.9)), 0, 0.092));
    h.add(at(sph(0.01, GOLD()), 0.062, 0.06));
    h.add(at(cyl(0.004, 0.002, 0.09, M('#f4f1ea', 0.9), 5), 0.05, 0.11, 0, 0, 0, -0.5));
  },
  achingiu(h) { h.add(at(cyl(0.046, 0.05, 0.05, M('#3e2a1a', 1)), 0, 0.03)); h.add(at(sph(0.034, M('#b0302a', 0.9), 12, 8), 0, 0.058)); },
};

// ---------- uneltele și armele (în mâna dreaptă, spre înainte) ----------
function tool(kind) {
  const g = new THREE.Group();
  const handle = (len, r = 0.007) => { const m = cyl(r, r, len, WOOD(), 6); m.position.y = len / 2 - 0.03; return m; };
  switch (kind) {
    case 'sword': g.add(at(box(0.014, 0.19, 0.005, METAL()), 0, 0.11)); g.add(at(box(0.008, 0.008, 0.05, GOLD()), 0, 0.012)); g.add(at(cyl(0.007, 0.007, 0.04, LEATHER(), 6), 0, -0.012)); break;
    case 'saber': { g.add(at(cyl(0.007, 0.007, 0.04, LEATHER(), 6), 0, -0.012)); const b = box(0.016, 0.18, 0.005, METAL()); at(b, 0.012, 0.1, 0, 0, 0, -0.18); g.add(b); g.add(at(box(0.008, 0.008, 0.04, GOLD()), 0, 0.012)); break; }
    case 'spear': g.add(at(cyl(0.007, 0.007, 0.62, WOOD(), 6), 0, 0.16)); g.add(at(cone(0.014, 0.06, METAL(), 6), 0, 0.5)); break;
    case 'lance': g.add(at(cyl(0.009, 0.006, 0.8, WOOD(), 6), 0, 0.26)); g.add(at(cone(0.014, 0.06, METAL(), 6), 0, 0.69)); g.add(at(box(0.004, 0.05, 0.07, M('#c8352a', 0.9, 0, true)), 0, 0.6, 0.035)); break;
    case 'axe': g.add(handle(0.2)); g.add(at(box(0.03, 0.045, 0.008, IRON()), 0.018, 0.16)); break;
    case 'pick': g.add(handle(0.2)); g.add(at(box(0.11, 0.014, 0.012, IRON()), 0, 0.165, 0, 0, 0, 0.12)); break;
    case 'hammer': g.add(handle(0.15)); g.add(at(box(0.05, 0.03, 0.03, IRON()), 0, 0.12)); break;
    case 'sickle': { g.add(handle(0.08, 0.006)); const s = mesh(new THREE.TorusGeometry(0.04, 0.005, 5, 12, Math.PI * 1.2), METAL()); at(s, 0.035, 0.07, 0); g.add(s); break; }
    case 'bow': { const b = mesh(new THREE.TorusGeometry(0.13, 0.006, 5, 18, Math.PI * 0.85), M('#5e3a1c', 0.7)); at(b, 0, 0, 0, 0, Math.PI / 2, Math.PI / 2 + Math.PI * 0.075); g.add(b); g.add(at(cyl(0.0015, 0.0015, 0.22, M('#ddd', 0.6), 4), -0.035, 0)); break; }
  }
  return g;
}
function shield(col, shape = 'round') {
  const g = new THREE.Group();
  const d = shape === 'round' ? cyl(0.072, 0.072, 0.012, M(col, 0.7), 20) : box(0.11, 0.15, 0.012, M(col, 0.7));
  if (shape === 'round') d.rotation.x = Math.PI / 2;
  g.add(d);
  const boss = sph(0.016, METAL(), 10, 8); boss.position.z = 0.008; g.add(boss);
  if (shape === 'round') { const rim = mesh(new THREE.TorusGeometry(0.072, 0.005, 5, 24), IRON()); g.add(rim); }
  return g;
}

// ---------- omul ----------
export function human(o) {
  const R = { root: new THREE.Group(), o };
  const hips = new THREE.Group(); hips.position.y = 0.285; R.root.add(hips); R.hips = hips;
  const torso = new THREE.Group(); hips.add(torso); R.torso = torso;
  const chest = cyl(0.058, 0.05, 0.195, M(o.shirt, 0.9), 14); at(chest, 0, 0.095); chest.scale.set(0.74, 1, 1); torso.add(chest);
  if (o.vest) { const v = cyl(0.062, 0.055, 0.15, M(o.vest, 0.98), 14, true); at(v, 0, 0.1); v.scale.set(0.76, 1, 1); torso.add(v); }
  if (o.armor) { const a = cyl(0.062, 0.055, 0.16, M(o.armor, 0.45, 0.7), 14); at(a, 0, 0.104); a.scale.set(0.76, 1, 1); torso.add(a); }
  const sl = o.len === 'robe' ? 0.25 : o.len === 'tunic' ? 0.15 : 0.1;
  const skirt = cyl(0.051, o.len === 'robe' ? 0.09 : 0.072, sl, M(o.skirt || o.shirt, 0.9, 0, true), 14, true);
  at(skirt, 0, -sl / 2 + 0.012); skirt.scale.set(0.86, 1, 1); torso.add(skirt);
  if (o.belt) { const b = cyl(0.054, 0.054, 0.024, M(o.belt, 0.85), 14); at(b, 0, 0.012); b.scale.set(0.78, 1, 1); torso.add(b); }
  if (o.quiver) { const q = cyl(0.016, 0.014, 0.16, LEATHER(), 8); at(q, -0.05, 0.11, -0.02, 0.3, 0, -0.25); torso.add(q); for (let i = 0; i < 3; i++) torso.add(at(cyl(0.002, 0.002, 0.05, M('#e8dcc0', 0.9), 4), -0.07 - i * 0.004, 0.2, -0.02 + i * 0.008, 0.3, 0, -0.25)); }
  const neck = new THREE.Group(); neck.position.y = 0.19; torso.add(neck);
  neck.add(at(cyl(0.018, 0.02, 0.04, M(o.skin, 0.75)), 0, 0.012));
  const head = new THREE.Group(); head.position.y = 0.058; neck.add(head); R.head = head;
  const hd = sph(0.043, M(o.skin, 0.72), 16, 12); hd.scale.set(0.96, 1.06, 0.9); head.add(hd);
  head.add(at(box(0.014, 0.016, 0.011, M(o.skin, 0.72)), 0.042, -0.004));
  if (o.hair) { const h = sph(0.045, M(o.hair, 0.95), 14, 10); h.scale.set(0.98, 0.72, 0.96); at(h, -0.006, 0.012); head.add(h); }
  if (o.longHair) { const lh = box(0.03, 0.07, 0.07, M(o.hair || '#4a3020', 0.95)); at(lh, -0.03, -0.02); head.add(lh); }
  if (o.mustache) head.add(at(box(0.01, 0.008, 0.04, M(o.mustache, 0.95)), 0.041, -0.02));
  if (o.beard) { const b = sph(0.032, M(o.beard, 0.95), 12, 8); b.scale.set(0.8, 1.05, 1.1); at(b, 0.022, -0.038); head.add(b); }
  if (o.hat) HATS[o.hat](head, o.hatCol, o.hatTop);
  ['L', 'R'].forEach(side => {
    const s = side === 'L' ? 1 : -1;
    const sh = new THREE.Group(); sh.position.set(0, 0.172, 0.071 * s); torso.add(sh);
    sh.add(at(sph(0.022, M(o.sleeve || o.shirt, 0.9)), 0, 0));
    sh.add(limb(0.02, 0.017, 0.115, M(o.sleeve || o.shirt, 0.9)));
    const el = new THREE.Group(); el.position.y = -0.115; sh.add(el);
    el.add(limb(0.017, 0.014, 0.1, M(o.cuff || o.sleeve || o.shirt, 0.9)));
    const hand = new THREE.Group(); hand.position.y = -0.105; el.add(hand);
    hand.add(sph(0.017, M(o.skin, 0.75), 10, 8));
    R['sh' + side] = sh; R['el' + side] = el; R['hand' + side] = hand;
  });
  ['L', 'R'].forEach(side => {
    const s = side === 'L' ? 1 : -1;
    const hip = new THREE.Group(); hip.position.set(0, 0, 0.03 * s); hips.add(hip);
    hip.add(limb(0.025, 0.019, 0.135, M(o.pants, 0.92)));
    const kn = new THREE.Group(); kn.position.y = -0.135; hip.add(kn);
    kn.add(limb(0.019, 0.015, 0.125, M(o.legwrap || o.pants, 0.92)));
    kn.add(at(box(0.058, 0.024, 0.032, M(o.boots, 0.85)), 0.014, -0.128));
    R['hip' + side] = hip; R['kn' + side] = kn;
  });
  if (o.cloak) { const c = cyl(0.064, 0.11, 0.33, M(o.cloak, 0.9, 0, true), 16, true, Math.PI * 1.05, Math.PI * 0.9); at(c, -0.005, 0.03); torso.add(c); R.cloak = c; }
  if (o.weapon) { const w = tool(o.weapon); R.handR.add(w); R.weapon = w; }
  if (o.shield) { const sd = shield(o.shield, o.shieldShape); at(sd, 0.01, -0.05, 0.03); R.elL.add(sd); R.shieldObj = sd; }
  if (o.bow) { const b = tool('bow'); R.handL.add(b); R.bow = b; }
  R.tools = {};
  if (o.tools) o.tools.forEach(k => { const t = tool(k); t.visible = false; R.handR.add(t); R.tools[k] = t; });
  R.reset = function () {
    R.root.position.set(0, R.baseY || 0, 0); R.root.rotation.x = 0; R.root.rotation.z = 0;
    R.hips.position.y = 0.285; R.hips.rotation.set(0, 0, 0);
    R.torso.rotation.set(0, 0, 0); R.head.rotation.set(0, 0, 0);
    R.shL.rotation.set(-0.12, 0, 0.05); R.shR.rotation.set(0.12, 0, 0.05);
    R.elL.rotation.set(0, 0, 0.18); R.elR.rotation.set(0, 0, 0.18);
    ['L', 'R'].forEach(s => { R['hip' + s].rotation.set(0, 0, 0); R['kn' + s].rotation.set(0, 0, 0); });
    if (R.weapon) R.weapon.rotation.set(0, 0, o.weapon === 'spear' || o.weapon === 'lance' ? Math.PI / 2 : 1.25);
    if (o.shield) { R.shL.rotation.z = 0.6; R.elL.rotation.z = 0.9; R.shL.rotation.x = -0.05; }
    if (o.bow) { R.bow.rotation.set(0, 0, 0); }
    Object.values(R.tools).forEach(t => { t.visible = false; t.rotation.set(0, 0, 1.25); });
  };
  R.reset();
  return R;
}

// ---------- calul ----------
export function horse(o) {
  const H = { root: new THREE.Group() };
  const body = new THREE.Group(); body.position.y = 0.36; H.root.add(body); H.body = body;
  const coat = M(o.coat, 0.75), dark = M(o.mane || '#2a1c12', 0.9);
  const torso = mesh(new THREE.CapsuleGeometry(0.085, 0.27, 6, 12), coat); at(torso, 0, 0, 0, 0, 0, Math.PI / 2); torso.scale.set(1, 1, 0.82); body.add(torso);
  const neck = new THREE.Group(); neck.position.set(0.17, 0.04, 0); body.add(neck); H.neck = neck;
  const nk = mesh(new THREE.CapsuleGeometry(0.045, 0.16, 5, 10), coat); at(nk, 0.06, 0.08, 0, 0, 0, -0.75); neck.add(nk);
  neck.add(at(box(0.12, 0.03, 0.018, dark), 0.04, 0.14, 0, 0, 0, -0.75));
  const head = mesh(new THREE.CapsuleGeometry(0.035, 0.11, 5, 10), coat); at(head, 0.17, 0.17, 0, 0, 0, -2.1); neck.add(head);
  neck.add(at(cone(0.012, 0.035, coat, 6), 0.12, 0.25, 0.018));
  neck.add(at(cone(0.012, 0.035, coat, 6), 0.12, 0.25, -0.018));
  const tail = mesh(new THREE.CapsuleGeometry(0.018, 0.16, 4, 8), dark); at(tail, -0.24, -0.04, 0, 0, 0, -0.45); body.add(tail);
  [['FL', 0.15, 0.05], ['FR', 0.15, -0.05], ['BL', -0.15, 0.05], ['BR', -0.15, -0.05]].forEach(([n, x, z]) => {
    const hip = new THREE.Group(); hip.position.set(x, -0.04, z); body.add(hip);
    hip.add(limb(0.028, 0.02, 0.16, coat));
    const kn = new THREE.Group(); kn.position.y = -0.16; hip.add(kn);
    kn.add(limb(0.018, 0.015, 0.15, coat));
    kn.add(at(cyl(0.02, 0.022, 0.025, dark, 8), 0, -0.155));
    H['hip' + n] = hip; H['kn' + n] = kn;
  });
  if (o.saddle) { const s = cyl(0.092, 0.092, 0.07, M(o.saddle, 0.8, 0, true), 16, true, 0, Math.PI); at(s, 0, 0.02, 0, 0, Math.PI / 2, 0); s.scale.set(1, 1, 0.9); body.add(s); }
  if (o.cape) { const c = cyl(0.1, 0.13, 0.2, M(o.cape, 0.85, 0, true), 18, true); at(c, 0, -0.03, 0); c.scale.set(1.9, 1, 1); body.add(c); H.cape = c; }
  H.reset = function () {
    H.root.position.set(0, 0, 0); H.root.rotation.x = 0; H.root.rotation.z = 0;
    H.body.position.y = 0.36; H.body.rotation.set(0, 0, 0); H.neck.rotation.set(0, 0, 0);
    ['FL', 'FR', 'BL', 'BR'].forEach(n => { H['hip' + n].rotation.set(0, 0, 0); H['kn' + n].rotation.set(0, 0, 0); });
  };
  return H;
}

// ---------- asediu ----------
function wheel(r, mat) {
  const g = new THREE.Group();
  const t = mesh(new THREE.TorusGeometry(r, r * 0.12, 6, 18), mat); g.add(t);
  for (let i = 0; i < 6; i++) g.add(at(box(r * 0.1, r * 2, r * 0.1, mat), 0, 0, 0, 0, 0, i * Math.PI / 6));
  g.add(cyl(r * 0.2, r * 0.2, r * 0.4, IRON(), 8));
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  return g;
}
export function ram(team) {
  const S = { root: new THREE.Group(), wheels: [] };
  const wood = M('#6e4b2a', 0.85), hide = M('#7a5a3a', 0.95, 0, true);
  S.root.add(at(box(0.62, 0.05, 0.3, wood), 0, 0.12));
  [[-0.22, 0.17], [0.22, 0.17], [-0.22, -0.17], [0.22, -0.17]].forEach(([x, z]) => { const w = wheel(0.07, wood); at(w, x, 0.07, z); S.root.add(w); S.wheels.push(w); });
  [[-0.27, 0.13], [0.27, 0.13], [-0.27, -0.13], [0.27, -0.13]].forEach(([x, z]) => S.root.add(at(box(0.03, 0.2, 0.03, wood), x, 0.24, z)));
  const roof = new THREE.Group(); roof.position.y = 0.34; S.root.add(roof);
  roof.add(at(box(0.66, 0.012, 0.22, hide), 0, 0.05, 0.08, -0.62));
  roof.add(at(box(0.66, 0.012, 0.22, hide), 0, 0.05, -0.08, 0.62));
  roof.add(at(box(0.68, 0.03, 0.03, M(team, 0.8)), 0, 0.12));
  const log = new THREE.Group(); log.position.y = 0.22; S.root.add(log); S.log = log;
  log.add(at(cyl(0.035, 0.035, 0.75, M('#7a5532', 0.85), 10), 0.05, 0, 0, 0, 0, Math.PI / 2));
  log.add(at(cyl(0.045, 0.04, 0.08, IRON(), 10), 0.44, 0, 0, 0, 0, Math.PI / 2));
  S.reset = function () { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.log.position.x = 0; S.wheels.forEach(w => w.rotation.z = 0); };
  return S;
}
export function cannon(team) {
  const S = { root: new THREE.Group(), wheels: [] };
  const wood = M('#6e4b2a', 0.85);
  [[0.07], [-0.07]].forEach(([z]) => S.root.add(at(box(0.42, 0.05, 0.025, wood), -0.08, 0.1, z, 0, 0, 0.12)));
  [0.1, -0.1].forEach(z => { const w = wheel(0.1, wood); at(w, 0.02, 0.1, z); S.root.add(w); S.wheels.push(w); });
  const barrel = new THREE.Group(); barrel.position.set(0.04, 0.17, 0); S.root.add(barrel); S.barrel = barrel;
  barrel.add(at(cyl(0.035, 0.045, 0.48, M('#a07a3e', 0.35, 0.85), 14), 0.12, 0, 0, 0, 0, Math.PI / 2 - 0.12));
  barrel.add(at(cyl(0.05, 0.05, 0.03, M('#a07a3e', 0.35, 0.85), 14), 0.35, 0.03, 0, 0, 0, Math.PI / 2 - 0.12));
  S.root.add(at(box(0.08, 0.05, 0.004, M(team, 0.8, 0, true)), -0.26, 0.2, 0.07));
  S.reset = function () { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.barrel.position.x = 0.04; S.wheels.forEach(w => w.rotation.z = 0); };
  return S;
}

// ---------- ținutele ----------
const SKIN = '#e0b089', SKIN2 = '#c9966c';
export function outfit(type, civ, team) {
  const mol = civ === 'mol';
  switch (type) {
    case 'vil': return mol
      ? { skin: SKIN, shirt: '#efe9dc', skirt: '#ebe5d6', pants: '#e6e0d2', legwrap: '#d9d0bd', boots: '#6b4a2e', vest: '#4e3420', belt: team, hat: 'cusma', mustache: '#3a2414', len: 'tunic', tools: ['axe', 'pick', 'hammer', 'sickle'] }
      : { skin: SKIN2, shirt: '#d8c8a0', skirt: '#cdb98e', pants: '#8a6a48', boots: '#5a3a22', belt: team, hat: 'turban', hatCol: '#f1ede2', hatTop: '#d8c8a0', mustache: '#2a1a10', len: 'robe', tools: ['axe', 'pick', 'hammer', 'sickle'] };
    case 'mil': return mol
      ? { skin: SKIN, shirt: team, sleeve: '#8e949b', armor: '#8e949b', skirt: team, pants: '#4e4236', boots: '#3a2a1a', belt: '#4a3020', hat: 'helm', mustache: '#3a2414', len: 'tunic', weapon: 'sword', shield: team }
      : { skin: SKIN2, shirt: '#ece4d0', skirt: team, sleeve: team, vest: team, pants: '#e8e0cc', boots: '#7a2a20', belt: '#d9ab3c', hat: 'bork', mustache: '#1e140c', len: 'robe', weapon: 'saber' };
    case 'spr': return mol
      ? { skin: SKIN, shirt: team, vest: '#bba98a', skirt: '#bba98a', pants: '#5a4a3a', boots: '#3a2a1a', belt: '#4a3020', hat: 'helm', hatCol: true, mustache: '#3a2414', len: 'tunic', weapon: 'spear', shield: team, shieldShape: 'kite', spike: true }
      : { skin: SKIN2, shirt: '#d9b884', vest: team, skirt: '#c8a070', pants: '#e0d6c0', boots: '#5a3a22', belt: '#7a3a20', hat: 'fez', mustache: '#1e140c', len: 'tunic', weapon: 'spear', shield: '#a07840' };
    case 'arc': return mol
      ? { skin: SKIN, shirt: '#56693a', skirt: team, pants: '#5a4a3a', boots: '#4a3020', belt: team, hat: 'archer', mustache: '#3a2414', len: 'tunic', bow: true, quiver: true }
      : { skin: SKIN2, shirt: '#3c6a4a', skirt: '#3c6a4a', pants: '#e0d6c0', boots: '#7a2a20', belt: team, hat: 'turban', hatTop: team, mustache: '#1e140c', len: 'robe', bow: true, quiver: true };
    case 'lcv': return mol
      ? { skin: SKIN, shirt: team, vest: '#4e3420', skirt: team, pants: '#e6e0d2', boots: '#3a2a1a', belt: '#4a3020', hat: 'cusma', mustache: '#3a2414', len: 'tunic', weapon: 'saber', mounted: true, coat: '#7a5232', saddle: '#4a3020' }
      : { skin: SKIN2, shirt: team, skirt: team, pants: '#e0d6c0', boots: '#5a3a22', belt: '#d9ab3c', hat: 'achingiu', mustache: '#1e140c', len: 'tunic', weapon: 'saber', mounted: true, coat: '#8a6a4a', saddle: '#7a2a20' };
    case 'kni': return mol
      ? { skin: SKIN, shirt: team, armor: '#a6abb2', sleeve: '#a6abb2', skirt: team, pants: '#8e949b', boots: '#5e636a', belt: '#4a3020', hat: 'helm', mustache: '#3a2414', len: 'tunic', weapon: 'lance', mounted: true, coat: '#3a2a1e', cape: team }
      : { skin: SKIN2, shirt: team, armor: '#9aa0a8', sleeve: '#9aa0a8', skirt: team, pants: '#e0d6c0', boots: '#7a2a20', belt: '#d9ab3c', hat: 'sipahi', mustache: '#1e140c', len: 'tunic', weapon: 'lance', mounted: true, coat: '#5a3a26', cape: team };
    case 'hero': return mol
      ? { skin: SKIN, shirt: '#7a1a18', armor: '#c8a050', sleeve: '#7a1a18', skirt: '#7a1a18', pants: '#5a1210', boots: '#3a2416', belt: '#d9ab3c', hat: 'crown', hair: '#4a3020', longHair: true, mustache: '#3a2414', len: 'tunic', cloak: '#a51d1d', weapon: 'sword', mounted: true, coat: '#efece4', cape: team }
      : { skin: SKIN2, shirt: '#2f7d4a', skirt: '#2f7d4a', sleeve: '#2f7d4a', pants: '#e0d6c0', boots: '#7a2a20', belt: '#d9ab3c', hat: 'pasha', beard: '#1e140c', mustache: '#1e140c', len: 'robe', cloak: '#c8352a', weapon: 'saber', mounted: true, coat: '#4a3020', cape: '#c8352a' };
  }
}

// ---------- animațiile ----------
const TAU = Math.PI * 2;
function key(arr, t) { const n = arr.length, f = t * n, i = Math.floor(f) % n, j = (i + 1) % n, u = f - Math.floor(f); return arr[i] + (arr[j] - arr[i]) * u; }
function walkLegs(R, a, amp = 0.5) {
  const s = Math.sin(a);
  R.hipL.rotation.z = amp * s; R.hipR.rotation.z = -amp * s;
  R.knL.rotation.z = -Math.max(0, Math.cos(a)) * 0.95 - 0.05;
  R.knR.rotation.z = -Math.max(0, -Math.cos(a)) * 0.95 - 0.05;
  R.hips.position.y = 0.285 - 0.005 + Math.abs(Math.cos(a)) * 0.009;
}
function sitOnHorse(R) {
  R.hipL.rotation.set(-0.38, 0, 1.25); R.hipR.rotation.set(0.38, 0, 1.25);
  R.knL.rotation.z = -1.45; R.knR.rotation.z = -1.45;
}
function gallop(H, a, amp = 0.55) {
  const ph = { FL: 0, FR: 0.5, BL: 2.6, BR: 3.1 };
  Object.keys(ph).forEach(n => {
    const s = Math.sin(a + ph[n]);
    H['hip' + n].rotation.z = amp * s * (n[0] === 'F' ? 1 : 0.9);
    H['kn' + n].rotation.z = n[0] === 'F' ? Math.max(0, -Math.cos(a + ph[n])) * 1.2 : -Math.max(0, Math.cos(a + ph[n])) * 0.9;
  });
  H.body.position.y = 0.36 + Math.abs(Math.sin(a)) * 0.022;
  H.body.rotation.z = Math.sin(a) * 0.06;
  H.neck.rotation.z = -Math.sin(a) * 0.12;
}

// întoarce { root, reset, actions } pentru un tip de unitate
export function unitModel(type, civ, team) {
  if (type === 'ram' || type === 'can') {
    const S = type === 'ram' ? ram(team) : cannon(team);
    const actions = [
      { name: 'idle', frames: 1, pose: () => {} },
      { name: 'walk', frames: 4, pose: t => S.wheels.forEach(w => w.rotation.z = -t * TAU / 3) },
      { name: 'atk', frames: 4, loop: false, pose: t => { if (S.log) S.log.position.x = key([0, -0.08, 0.1, 0.02], t); else S.barrel.position.x = 0.04 + key([0, -0.06, -0.03, 0], t); } },
      { name: 'die', frames: 1, loop: false, pose: () => { S.root.rotation.x = 0.25; S.root.position.y = -0.02; } }
    ];
    return { root: S.root, reset: S.reset, actions, cell: 'siege' };
  }
  const o = outfit(type, civ, team);
  const R = human(o);
  if (o.mounted) {
    const H = horse(o);
    const wrap = new THREE.Group(); wrap.add(H.root); H.root.add(R.root);
    R.baseY = 0.2;
    const reset = () => { H.reset(); R.reset(); R.root.position.set(-0.02, 0.2, 0); sitOnHorse(R); };
    const swing = t => { R.shR.rotation.z = key([0.6, 2.3, 2.7, 1.0, 0.3], t); R.elR.rotation.z = key([0.3, 0.9, 0.5, 0.1, 0.2], t); R.torso.rotation.y = key([0, 0.2, 0.25, -0.2, -0.1], t); };
    const thrust = t => { R.shR.rotation.z = key([0.5, 0.4, 0.9, 1.25, 0.9], t); R.elR.rotation.z = key([1.0, 1.2, 0.5, 0.1, 0.6], t); R.torso.rotation.z = -key([0, -0.05, 0.1, 0.2, 0.05], t); };
    const actions = [
      { name: 'idle', frames: 1, pose: () => { H.neck.rotation.z = -0.15; } },
      { name: 'walk', frames: 6, pose: t => { gallop(H, t * TAU); R.root.position.y = 0.2 + Math.abs(Math.sin(t * TAU)) * 0.015; } },
      { name: 'atk', frames: 5, loop: false, pose: t => { (o.weapon === 'lance' ? thrust : swing)(t); H.neck.rotation.z = -0.1; } },
      { name: 'die', frames: 4, loop: false, pose: t => { const e = Math.min(1, t * 1.35); H.root.rotation.x = e * 1.35; H.root.position.y = e * 0.02; R.root.rotation.z = e * 0.5; ['FL', 'FR', 'BL', 'BR'].forEach(n => H['hip' + n].rotation.z = (n[0] === 'F' ? 0.6 : -0.6) * e); } }
    ];
    return { root: wrap, reset, actions, cell: 'cav' };
  }
  const reset = () => R.reset();
  const swing = t => {
    R.shR.rotation.z = key([0.6, 2.3, 2.75, 1.1, 0.3], t); R.elR.rotation.z = key([0.3, 0.9, 0.55, 0.15, 0.2], t);
    R.torso.rotation.y = key([0, 0.22, 0.28, -0.18, -0.12], t); R.torso.rotation.z = -key([0, -0.05, 0, 0.15, 0.12], t);
    R.hipL.rotation.z = 0.25; R.hipR.rotation.z = -0.2; R.knR.rotation.z = -0.15;
  };
  const thrust = t => {
    R.shR.rotation.z = key([0.9, 0.75, 1.15, 1.55, 1.3], t); R.elR.rotation.z = key([1.25, 1.5, 0.6, 0.05, 0.4], t);
    R.torso.rotation.z = -key([0, -0.05, 0.12, 0.24, 0.1], t);
    R.hipL.rotation.z = 0.35; R.hipR.rotation.z = -0.25; R.knR.rotation.z = -0.2;
  };
  const shoot = t => {
    R.shL.rotation.set(0, 0, 1.45); R.elL.rotation.z = 0.05;
    R.shR.rotation.z = key([1.3, 1.38, 1.4, 1.3, 1.1], t); R.shR.rotation.x = 0.1;
    R.elR.rotation.z = key([1.6, 2.3, 2.55, 2.55, 0.9], t);
    R.torso.rotation.y = 0.25; R.hipL.rotation.z = 0.2; R.hipR.rotation.z = -0.2;
  };
  const work = (toolName, sh, el, lean, both) => t => {
    R.tools[toolName].visible = true;
    R.shR.rotation.z = key(sh, t); R.elR.rotation.z = key(el, t);
    if (both) { R.shL.rotation.z = key(sh, t); R.elL.rotation.z = key(el, t); R.shL.rotation.x = 0.4; R.shR.rotation.x = -0.4; }
    R.torso.rotation.z = -key(lean, t);
    R.hipL.rotation.z = 0.22; R.hipR.rotation.z = -0.15; R.knL.rotation.z = -0.15; R.knR.rotation.z = -0.25;
  };
  const die = t => {
    const e = Math.min(1, t * 1.35), s = e * e * (3 - 2 * e);
    R.root.rotation.z = s * 1.5; R.root.position.y = s * 0.02;
    R.shL.rotation.z = -s * 0.9; R.shR.rotation.z = -s * 0.7; R.knL.rotation.z = -s * 0.5; R.hipL.rotation.z = s * 0.4;
  };
  const actions = [
    { name: 'idle', frames: 1, pose: () => {} },
    { name: 'walk', frames: 6, pose: t => { const a = t * TAU; walkLegs(R, a); if (!o.shield && !o.bow) R.shL.rotation.z = -0.4 * Math.sin(a); R.shR.rotation.z = 0.4 * Math.sin(a) + (o.weapon === 'spear' ? 0.5 : 0); R.elR.rotation.z = 0.3; } }
  ];
  if (type === 'vil') {
    actions.push(
      { name: 'axe', frames: 5, pose: work('axe', [2.7, 2.95, 1.9, 0.75, 0.55], [0.6, 0.35, 0.15, 0.1, 0.25], [-0.05, -0.08, 0.12, 0.38, 0.4], true) },
      { name: 'pick', frames: 5, pose: work('pick', [2.3, 2.5, 1.6, 0.8, 0.6], [0.5, 0.3, 0.15, 0.1, 0.25], [0, 0, 0.18, 0.42, 0.45], true) },
      { name: 'hammer', frames: 5, pose: work('hammer', [1.5, 2.3, 1.8, 0.85, 0.7], [1.0, 1.6, 1.1, 0.3, 0.4], [0.25, 0.22, 0.28, 0.34, 0.3], false) },
      { name: 'sickle', frames: 5, pose: t => { work('sickle', [0.5, 0.85, 1.15, 0.9, 0.55], [0.6, 0.4, 0.2, 0.3, 0.5], [0.55, 0.6, 0.62, 0.6, 0.55], false)(t); R.shR.rotation.x = key([-0.4, -0.1, 0.3, 0.5, 0.1], t); R.hips.position.y = 0.26; R.hipL.rotation.z = 0.5; R.hipR.rotation.z = 0.3; R.knL.rotation.z = -0.7; R.knR.rotation.z = -0.6; } },
    );
  } else if (o.bow) actions.push({ name: 'atk', frames: 5, loop: false, pose: shoot });
  else actions.push({ name: 'atk', frames: 5, loop: false, pose: o.weapon === 'spear' ? thrust : swing });
  actions.push({ name: 'die', frames: 4, loop: false, pose: die });
  return { root: R.root, reset, actions, cell: 'foot' };
}
