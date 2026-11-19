// Oamenii v2: șase civilizații, fiecare cu ținutele, coifurile, scuturile, armele și caii ei, pe trepte de armură.
// Materialele de echipă ('T') ies gri neutru în imagine; jocul le colorează cu culoarea jucătorului (masca).
import { THREE } from './core.js';
import { C, cloth, team, STEEL, IRON, DARKIRON, GOLD, BRONZE, BRASS, MAIL, LAMELLAR, SCALES, WOOD, LEATHER, SKIN as SKINM, HAIR as HAIRM, BLACK } from './mats.js';

function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }
function cyl(rt, rb, h, mat, seg = 12, open = false, ts, tl) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), mat); }
function limb(rt, rb, len, mat) { const g = new THREE.CylinderGeometry(rt, rb, len, 9); g.translate(0, -len / 2, 0); return mesh(g, mat); }
function sph(r, mat, ws = 14, hs = 10) { return mesh(new THREE.SphereGeometry(r, ws, hs), mat); }
function hsph(r, mat, ws = 14, hs = 8) { return mesh(new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2), mat); }
function box(x, y, z, mat) { return mesh(new THREE.BoxGeometry(x, y, z), mat); }
function cone(r, h, mat, seg = 12) { return mesh(new THREE.ConeGeometry(r, h, seg), mat); }
function torus(r, t, mat, rs = 8, ts = 18, arc) { return mesh(new THREE.TorusGeometry(r, t, rs, ts, arc), mat); }
function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }
const M = (c, kind, rough) => (c && c.isMaterial) ? c : C(c, kind || 'wool', rough || 0.9);

// ---------- coifuri, căciuli, pălării (pe cap; +x = înainte) ----------
function aventail(h, mat, len = 0.05) { const a = cyl(0.05, 0.058, len, mat || MAIL(), 16, true, Math.PI * 0.35, Math.PI * 1.3); at(a, -0.004, -0.018); h.add(a); }
function plume(h, col, y = 0.08, x = -0.01, big = 1) {
  for (let i = 0; i < 3; i++) { const p = cyl(0.006 * big, 0.002, 0.08 * big, M(col, 'velvet'), 5); at(p, x - i * 0.012, y + 0.03 * big, (i - 1) * 0.008, 0, 0, 0.55 + i * 0.12); h.add(p); }
}
const HATS = {
  cusma(h, o) { const c = cyl(0.048, 0.052, 0.1, M(o.hatCol || '#1e1712', 'fleece', 1), 14); at(c, 0, 0.052); h.add(c); h.add(at(hsph(0.048, M(o.hatCol || '#1e1712', 'fleece', 1)), 0, 0.1)); },
  kalpak(h, o) {
    const c = cyl(0.04, 0.05, 0.1, M(o.hatCol || '#7a1418', 'velvet'), 14); at(c, -0.008, 0.055, 0, 0, 0, 0.18); h.add(c);
    h.add(at(torus(0.048, 0.012, M('#2a1a10', 'fur'), 6, 16), 0, 0.012, 0, Math.PI / 2));
    h.add(at(sph(0.009, GOLD()), 0.04, 0.05)); plume(h, '#f0ece0', 0.085, -0.03, 0.8);
  },
  spike(h, o) {
    const d = cone(0.052, 0.09, STEEL(), 14); at(d, 0, 0.048); h.add(d);
    h.add(at(cyl(0.053, 0.053, 0.012, IRON(), 16), 0, 0.006)); h.add(at(cyl(0.003, 0.003, 0.04, STEEL(), 5), 0, 0.11));
    aventail(h);
  },
  nasal(h, o) {
    const d = hsph(0.052, STEEL(), 14, 8); d.scale.set(1, 1.25, 1); at(d, 0, 0.004); h.add(d);
    h.add(at(box(0.01, 0.05, 0.008, STEEL()), 0.05, -0.008)); aventail(h, MAIL(), 0.055);
    if (o.plume) plume(h, o.plume, 0.07);
  },
  kettle(h, o) {
    const d = hsph(0.05, STEEL(), 14, 8); d.scale.set(1, 1.1, 1); at(d, 0, 0.01); h.add(d);
    const b = cyl(0.085, 0.085, 0.008, STEEL(), 20); at(b, 0, 0.012, 0, 0, 0, 0.12); h.add(b);
  },
  bascinet(h, o) { const d = sph(0.054, STEEL(), 14, 10); d.scale.set(1, 1.3, 1); at(d, -0.006, 0.02); h.add(d); aventail(h, MAIL(), 0.06); },
  sallet(h, o) {
    const d = sph(0.055, STEEL(), 16, 10); d.scale.set(1.05, 0.95, 1); at(d, -0.004, 0.012); h.add(d);
    const tail = box(0.06, 0.012, 0.09, STEEL()); at(tail, -0.05, -0.012, 0, 0, 0, -0.35); h.add(tail);
    h.add(at(box(0.006, 0.008, 0.08, BLACK()), 0.052, 0.006));
    if (o.plume) plume(h, o.plume, 0.06, -0.02);
  },
  armet(h, o) {
    const d = sph(0.056, STEEL(), 16, 12); d.scale.set(1.05, 1.08, 1); at(d, 0, 0.008); h.add(d);
    h.add(at(cone(0.03, 0.05, STEEL(), 8), 0.052, -0.006, 0, 0, 0, -Math.PI / 2));
    h.add(at(box(0.004, 0.006, 0.06, BLACK()), 0.056, 0.014));
    h.add(at(box(0.07, 0.008, 0.004, STEEL()), 0, 0.06));
    plume(h, o.plume || '#d8d0c0', 0.07, -0.01, 1.3);
  },
  kucsma(h, o) {
    const c = cyl(0.044, 0.05, 0.12, M(o.hatCol || '#2a1c14', 'fur', 1), 14); at(c, -0.01, 0.06, 0, 0, 0, 0.15); h.add(c);
    h.add(at(cyl(0.004, 0.002, 0.13, M('#f4f0e6', 'velvet'), 5), -0.02, 0.15, 0.02, 0, 0, 0.25)); h.add(at(sph(0.01, GOLD()), 0.04, 0.06));
  },
  turban(h, o) {
    const big = o.big || 1;
    h.add(at(torus(0.036 * big, 0.022 * big, M(o.hatCol || '#f1ede2', 'linen'), 8, 18), 0, 0.034 * big, 0, Math.PI / 2));
    h.add(at(sph(0.038 * big, M(o.hatCol || '#f1ede2', 'linen')), 0, 0.048 * big));
    h.add(at(sph(0.022 * big, M(o.hatTop || '#b03a2a', 'velvet')), 0, 0.078 * big));
  },
  cicak(h, o) {
    const c = cone(0.05, 0.11, STEEL(), 14); at(c, 0, 0.065); h.add(c);
    h.add(at(torus(0.044, 0.016, M(o.hatCol || '#f1ede2', 'linen'), 8, 18), 0, 0.026, 0, Math.PI / 2));
    h.add(at(cyl(0.003, 0.002, 0.07, M('#c8352a', 'velvet'), 5), 0, 0.13, 0, 0, 0, -0.3)); aventail(h, MAIL(), 0.05);
  },
  bork(h, o) {
    const b = cyl(0.036, 0.046, 0.13, M('#f2eee4', 'felt'), 12); at(b, -0.022, 0.085, 0, 0, 0, 0.42); h.add(b);
    h.add(at(cyl(0.05, 0.05, 0.02, GOLD(), 16), 0, 0.026));
    h.add(at(box(0.008, 0.12, 0.05, M('#f2eee4', 'felt')), -0.06, -0.02));
    h.add(at(cone(0.009, 0.03, BRASS(), 6), 0.04, 0.05, 0, 0, 0, -0.3));
  },
  fez(h, o) { h.add(at(cyl(0.036, 0.044, 0.06, M(o.hatCol || '#b0302a', 'felt'), 12), 0, 0.04)); h.add(at(cyl(0.003, 0.003, 0.05, M('#222'), 4), -0.03, 0.04, 0, 0, 0, 0.6)); },
  malakhai(h, o) {
    const c = cone(0.048, 0.1, M(o.hatTop || '#8a3a1a', 'velvet'), 12); at(c, 0, 0.07); h.add(c);
    h.add(at(cyl(0.056, 0.056, 0.03, M(o.hatCol || '#6a4a2a', 'fur', 1), 14), 0, 0.022));
    [1, -1].forEach(s => h.add(at(box(0.03, 0.05, 0.012, M(o.hatCol || '#6a4a2a', 'fur', 1)), -0.005, -0.012, 0.05 * s)));
  },
  tathelm(h, o) {
    const d = cone(0.054, 0.1, M('#9a9ea4', 'lamellar', 0.4), 12); at(d, 0, 0.055); h.add(d);
    h.add(at(cyl(0.058, 0.058, 0.022, M('#5a3a1e', 'fur', 1), 14), 0, 0.012));
    h.add(at(cyl(0.004, 0.003, 0.06, M('#b02020', 'velvet'), 5), 0, 0.12)); aventail(h, cloth('#6a4a2a', 'quilt'), 0.05);
  },
  scarf(h, o) {
    const s = sph(0.049, M(o.hatCol || '#f0ebe0', 'linen'), 14, 10); s.scale.set(1.02, 0.92, 1.02); at(s, -0.006, 0.01); h.add(s);
    const tail = box(0.04, 0.09, 0.07, M(o.hatCol || '#f0ebe0', 'linen')); at(tail, -0.04, -0.04); h.add(tail);
    if (o.hatTop) h.add(at(torus(0.046, 0.006, M(o.hatTop, 'embroid'), 5, 18), 0, 0.012, 0, Math.PI / 2));
  },
  brim(h, o) { h.add(at(cyl(0.04, 0.046, 0.06, M(o.hatCol || '#4a3a28', 'felt'), 14), 0, 0.05)); h.add(at(cyl(0.085, 0.085, 0.008, M(o.hatCol || '#4a3a28', 'felt'), 20), 0, 0.022)); },
  kamilavka(h, o) { h.add(at(cyl(0.046, 0.046, 0.075, BLACK(), 16), 0, 0.05)); const v = box(0.03, 0.12, 0.09, BLACK()); at(v, -0.045, 0.01); h.add(v); },
  hood(h, o) { const d = sph(0.052, M(o.hatCol || '#5a3e26', 'wool'), 14, 10); d.scale.set(1, 1.05, 1); at(d, -0.012, 0.004); h.add(d); h.add(at(cone(0.03, 0.07, M(o.hatCol || '#5a3e26'), 8), -0.05, -0.02, 0, 0, 0, 2.2)); },
  sikke(h, o) { const c = cyl(0.036, 0.044, 0.15, M('#8a6a48', 'felt'), 14); at(c, 0, 0.08); h.add(c); },
  crown(h, o) {
    h.add(at(sph(0.045, M('#5a1a14', 'velvet'), 12, 8), 0, 0.016));
    h.add(at(cyl(0.05, 0.048, 0.026, GOLD(), 16, true), 0, 0.032));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; h.add(at(cone(0.008, 0.026, GOLD(), 6), Math.cos(a) * 0.048, 0.056, Math.sin(a) * 0.048)); }
    h.add(at(sph(0.007, cloth('#b02030', 'gold', 0.3, { metal: 0.3 })), 0.05, 0.034));
    if (o.arches) { for (let i = 0; i < 2; i++) { const t = torus(0.046, 0.005, GOLD(), 5, 12, Math.PI); at(t, 0, 0.04, 0, 0, i * Math.PI / 2, 0); h.add(t); } h.add(at(sph(0.009, GOLD()), 0, 0.092)); }
  },
  vladcap(h, o) {
    const c = cyl(0.046, 0.052, 0.08, M('#8c1418', 'velvet'), 16); at(c, -0.004, 0.044, 0, 0, 0, 0.12); h.add(c);
    h.add(at(torus(0.05, 0.012, M('#3a1a10', 'fur'), 6, 18), 0, 0.012, 0, Math.PI / 2));
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; h.add(at(sph(0.006, cloth('#f6f2ea', 'gold', 0.2, { metal: 0.2 })), Math.cos(a) * 0.05, 0.05 + Math.sin(i) * 0.004, Math.sin(a) * 0.05)); }
    h.add(at(sph(0.012, GOLD()), 0.05, 0.06)); plume(h, '#f6f2ea', 0.09, 0.02, 1.1);
  },
  pasha(h, o) {
    const b = sph(0.072, M('#f4f1ea', 'linen'), 16, 12); b.scale.set(1, 0.85, 1); at(b, 0, 0.045); h.add(b);
    h.add(at(sph(0.03, M('#2f7d4a', 'velvet')), 0, 0.094)); h.add(at(sph(0.011, GOLD()), 0.065, 0.06));
    plume(h, '#f4f1ea', 0.1, 0.05, 1);
  },
  khan(h, o) {
    const c = cone(0.05, 0.12, M('#7a1a2a', 'velvet'), 14); at(c, 0, 0.08); h.add(c);
    h.add(at(cyl(0.06, 0.06, 0.04, M('#3a2a1a', 'fur', 1), 16), 0, 0.022)); h.add(at(sph(0.011, GOLD()), 0.058, 0.03)); plume(h, '#f0e6c8', 0.12, 0, 0.9);
  },
  iancu(h, o) { const d = sph(0.055, STEEL(), 16, 10); d.scale.set(1.04, 1.02, 1); at(d, -0.004, 0.012); h.add(d); h.add(at(box(0.004, 0.006, 0.06, BLACK()), 0.054, 0.014)); plume(h, '#f4f0e6', 0.07, -0.02, 1.5); plume(h, '#202020', 0.06, -0.04, 1.1); }
};

// ---------- arme și unelte (în mâna dreaptă) ----------
function tool(kind) {
  const g = new THREE.Group();
  const handle = (len, r = 0.007) => { const m = cyl(r, r, len, WOOD(), 6); m.position.y = len / 2 - 0.03; return m; };
  switch (kind) {
    case 'sword': g.add(at(box(0.014, 0.2, 0.005, STEEL()), 0, 0.115)); g.add(at(box(0.008, 0.008, 0.055, BRASS()), 0, 0.012)); g.add(at(cyl(0.007, 0.007, 0.045, LEATHER(), 6), 0, -0.012)); break;
    case 'saber': { g.add(at(cyl(0.007, 0.007, 0.045, LEATHER(), 6), 0, -0.012)); const b = box(0.016, 0.19, 0.005, STEEL()); at(b, 0.014, 0.105, 0, 0, 0, -0.2); g.add(b); g.add(at(box(0.008, 0.008, 0.045, BRASS()), 0, 0.012)); break; }
    case 'kilij': { g.add(at(cyl(0.007, 0.007, 0.045, LEATHER(), 6), 0, -0.012)); const b = box(0.02, 0.2, 0.005, STEEL()); at(b, 0.02, 0.105, 0, 0, 0, -0.28); g.add(b); g.add(at(box(0.024, 0.04, 0.006, STEEL()), 0.05, 0.19, 0, 0, 0, -0.55)); g.add(at(box(0.008, 0.008, 0.04, GOLD()), 0, 0.012)); break; }
    case 'greatsword': g.add(at(box(0.018, 0.3, 0.006, STEEL()), 0, 0.17)); g.add(at(box(0.01, 0.01, 0.09, STEEL()), 0, 0.014)); g.add(at(cyl(0.008, 0.008, 0.08, LEATHER(), 6), 0, -0.03)); break;
    case 'baltag': g.add(handle(0.36, 0.008)); g.add(at(box(0.06, 0.07, 0.008, IRON()), 0.03, 0.31)); g.add(at(box(0.016, 0.02, 0.012, IRON()), -0.012, 0.31)); break;
    case 'mace': g.add(handle(0.2)); g.add(at(sph(0.022, IRON(), 8, 6), 0, 0.17)); for (let i = 0; i < 6; i++) g.add(at(box(0.008, 0.03, 0.03, IRON()), Math.cos(i) * 0.02, 0.17, Math.sin(i) * 0.02, 0, i, 0)); break;
    case 'spear': g.add(at(cyl(0.007, 0.007, 0.62, WOOD(), 6), 0, 0.16)); g.add(at(cone(0.014, 0.06, STEEL(), 6), 0, 0.5)); break;
    case 'pike': g.add(at(cyl(0.007, 0.006, 0.86, WOOD(), 6), 0, 0.27)); g.add(at(cone(0.012, 0.07, STEEL(), 6), 0, 0.74)); break;
    case 'halberd': g.add(at(cyl(0.008, 0.007, 0.74, WOOD(), 6), 0, 0.21)); g.add(at(cone(0.012, 0.08, STEEL(), 6), 0, 0.62)); g.add(at(box(0.07, 0.06, 0.006, STEEL()), 0.035, 0.53)); g.add(at(box(0.03, 0.012, 0.006, STEEL()), -0.025, 0.53)); break;
    case 'lance': g.add(at(cyl(0.009, 0.006, 0.82, WOOD(), 6), 0, 0.26)); g.add(at(cone(0.014, 0.06, STEEL(), 6), 0, 0.7)); { const p = box(0.004, 0.05, 0.08, team('velvet')); at(p, 0, 0.6, 0.04); g.add(p); } break;
    case 'javelin': g.add(at(cyl(0.006, 0.005, 0.42, WOOD(), 5), 0, 0.1)); g.add(at(cone(0.01, 0.05, STEEL(), 5), 0, 0.33)); break;
    case 'axe': g.add(handle(0.2)); g.add(at(box(0.03, 0.045, 0.008, IRON()), 0.018, 0.16)); break;
    case 'pick': g.add(handle(0.2)); g.add(at(box(0.11, 0.014, 0.012, IRON()), 0, 0.165, 0, 0, 0, 0.12)); break;
    case 'hammer': g.add(handle(0.15)); g.add(at(box(0.05, 0.03, 0.03, IRON()), 0, 0.12)); break;
    case 'sickle': { g.add(handle(0.08, 0.006)); const s = torus(0.04, 0.005, STEEL(), 5, 12, Math.PI * 1.2); at(s, 0.035, 0.07, 0); g.add(s); break; }
    case 'bow': case 'cbow': {
      const comp = kind === 'cbow';
      const b = torus(0.13, 0.006, LEATHER(comp ? '#3a2414' : '#5e3a1c'), 5, 18, Math.PI * (comp ? 0.75 : 0.85)); at(b, 0, 0, 0, 0, Math.PI / 2, Math.PI / 2 + Math.PI * (comp ? 0.125 : 0.075)); g.add(b);
      if (comp) [1, -1].forEach(s => g.add(at(box(0.008, 0.04, 0.008, BONE()), -0.03, 0.12 * s, 0, 0, 0, s * 0.6)));
      g.add(at(cyl(0.0015, 0.0015, 0.22, cloth('#ddd', 'linen'), 4), -0.035, 0)); break;
    }
    case 'crossbow': g.add(at(box(0.16, 0.022, 0.02, WOOD('#6a4a2a')), 0.06, 0.01)); { const b = torus(0.075, 0.006, IRON(), 5, 14, Math.PI * 0.8); at(b, 0.13, 0.01, 0, Math.PI / 2, 0, Math.PI * 1.1); g.add(b); } break;
    case 'gun': g.add(at(box(0.07, 0.03, 0.022, WOOD('#5a3a1e')), -0.02, 0.0)); g.add(at(cyl(0.008, 0.009, 0.26, DARKIRON(), 8), 0.13, 0.012, 0, 0, 0, Math.PI / 2)); g.add(at(cyl(0.004, 0.004, 0.03, BRASS(), 5), 0.02, 0.03)); break;
    case 'musket': g.add(at(box(0.09, 0.03, 0.022, WOOD('#4a2e16')), -0.03, 0.0)); g.add(at(cyl(0.008, 0.009, 0.34, DARKIRON(), 8), 0.16, 0.012, 0, 0, 0, Math.PI / 2)); g.add(at(cyl(0.004, 0.004, 0.03, BRASS(), 5), 0.02, 0.03)); break;
    case 'cross': g.add(at(box(0.012, 0.11, 0.012, GOLD()), 0, 0.06)); g.add(at(box(0.06, 0.012, 0.012, GOLD()), 0, 0.085)); break;
    case 'beads': g.add(at(torus(0.025, 0.005, cloth('#6a3a1a', 'leather'), 5, 10), 0, 0.0)); break;
    case 'staff': g.add(at(cyl(0.007, 0.008, 0.5, WOOD('#7a5634'), 6), 0, 0.14)); g.add(at(torus(0.02, 0.005, WOOD('#7a5634'), 5, 10, Math.PI), 0, 0.39, 0, 0, 0, Math.PI)); break;
  }
  return g;
}
const BONE = () => cloth('#e8dcc0', 'leather', 0.6);
function shield(kind, col) {
  const g = new THREE.Group(), face = col === 'T' ? team('leather', 0.7) : M(col, 'leather', 0.7);
  if (kind === 'round' || kind === 'kalkan' || kind === 'small') {
    const r = kind === 'small' ? 0.058 : kind === 'kalkan' ? 0.078 : 0.072;
    const d = cyl(r, r, 0.012, face, 22); d.rotation.x = Math.PI / 2; g.add(d);
    g.add(at(sph(kind === 'kalkan' ? 0.024 : 0.016, kind === 'kalkan' ? BRASS() : STEEL(), 10, 8), 0, 0, 0.008));
    g.add(torus(r, 0.005, kind === 'kalkan' ? BRASS() : IRON(), 5, 24));
    if (kind === 'kalkan') g.add(at(torus(r * 0.6, 0.004, BRASS(), 4, 20), 0, 0, 0.006));
  } else if (kind === 'kite') {
    const s = new THREE.Shape(); s.moveTo(0, 0.09); s.quadraticCurveTo(0.065, 0.085, 0.06, 0.02); s.lineTo(0, -0.11); s.lineTo(-0.06, 0.02); s.quadraticCurveTo(-0.065, 0.085, 0, 0.09);
    const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), face); g.add(m); g.add(at(sph(0.014, STEEL(), 8, 6), 0, 0.02, 0.014));
  } else if (kind === 'heater') {
    const s = new THREE.Shape(); s.moveTo(-0.06, 0.08); s.lineTo(0.06, 0.08); s.lineTo(0.06, 0.0); s.quadraticCurveTo(0.05, -0.07, 0, -0.1); s.quadraticCurveTo(-0.05, -0.07, -0.06, 0.0); s.lineTo(-0.06, 0.08);
    g.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), face));
    g.add(at(box(0.05, 0.01, 0.004, cloth('#f2f2f2', 'linen')), 0, 0.02, 0.014)); g.add(at(box(0.012, 0.07, 0.004, cloth('#f2f2f2', 'linen')), 0, 0.0, 0.014));
  } else if (kind === 'hus') {
    const s = new THREE.Shape(); s.moveTo(-0.05, -0.1); s.lineTo(0.05, -0.1); s.lineTo(0.06, 0.06); s.quadraticCurveTo(0.07, 0.14, 0.02, 0.17); s.lineTo(-0.05, 0.09); s.lineTo(-0.05, -0.1);
    g.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), face)); g.add(at(box(0.004, 0.2, 0.004, BRASS()), 0, 0.02, 0.014));
  } else if (kind === 'pavise') {
    const p = box(0.13, 0.24, 0.016, face); g.add(p); g.add(at(box(0.02, 0.24, 0.02, WOOD()), 0, 0, -0.008));
    g.add(at(box(0.05, 0.05, 0.004, cloth('#141210', 'velvet')), 0, 0.05, 0.01));
  }
  return g;
}

// ---------- omul ----------
export function human(o) {
  const R = { root: new THREE.Group(), o };
  const hips = new THREE.Group(); hips.position.y = 0.285; R.root.add(hips); R.hips = hips;
  const torso = new THREE.Group(); hips.add(torso); R.torso = torso;
  const chest = cyl(0.058, 0.05, 0.195, M(o.shirt, o.shirtK || 'linen'), 14); at(chest, 0, 0.095); chest.scale.set(0.74, 1, 1); torso.add(chest);
  if (o.vest) { const v = cyl(0.062, 0.055, 0.15, M(o.vest, o.vestK || 'fleece'), 14, true); at(v, 0, 0.1); v.scale.set(0.76, 1, 1); torso.add(v); }
  if (o.armor) { const a = cyl(0.062, 0.056, 0.165, o.armor, 14); at(a, 0, 0.102); a.scale.set(0.77, 1, 1); torso.add(a); }
  if (o.tabard) { const t = cyl(0.064, 0.074, 0.22, M(o.tabard, 'velvet'), 14, true); at(t, 0, 0.06); t.scale.set(0.78, 1, 1); torso.add(t); }
  if (o.cuirass) { const c = sph(0.064, o.cuirass, 14, 10); c.scale.set(0.8, 1.15, 1.02); at(c, 0.01, 0.11); torso.add(c); }
  const sl = o.len === 'robe' ? 0.25 : o.len === 'long' ? 0.2 : o.len === 'tunic' ? 0.15 : 0.1;
  const skirt = cyl(0.051, o.len === 'robe' ? 0.095 : 0.074, sl, M(o.skirt || o.shirt, o.skirtK || o.shirtK || 'wool'), 14, true);
  at(skirt, 0, -sl / 2 + 0.012); skirt.scale.set(0.86, 1, 1); torso.add(skirt);
  if (o.belt) { const b = cyl(0.054, 0.054, 0.024, M(o.belt, o.beltK || 'leather'), 14); at(b, 0, 0.012); b.scale.set(0.78, 1, 1); torso.add(b); }
  if (o.sash) { const b = cyl(0.055, 0.055, 0.04, M(o.sash, 'velvet'), 14); at(b, 0, 0.016); b.scale.set(0.79, 1, 1); torso.add(b); }
  if (o.quiver) { const q = cyl(0.016, 0.014, 0.16, LEATHER(), 8); at(q, -0.05, 0.11, -0.02, 0.3, 0, -0.25); torso.add(q); for (let i = 0; i < 3; i++) torso.add(at(cyl(0.002, 0.002, 0.05, cloth('#e8dcc0', 'linen'), 4), -0.07 - i * 0.004, 0.2, -0.02 + i * 0.008, 0.3, 0, -0.25)); }
  if (o.javelins) for (let i = 0; i < 3; i++) torso.add(at(cyl(0.004, 0.004, 0.3, WOOD(), 5), -0.06, 0.13, -0.03 + i * 0.012, 0.25, 0, -0.35));
  if (o.backPavise) { const p = shield('pavise', o.backPavise); at(p, -0.07, 0.11, 0, 0, Math.PI / 2, 0); torso.add(p); }
  if (o.pauldrons) [1, -1].forEach(s => { const p = sph(0.034, o.pauldrons, 10, 8); p.scale.set(1, 0.7, 1); at(p, 0, 0.18, 0.068 * s); torso.add(p); });
  if (o.cross) { const cr = tool('cross'); cr.scale.set(0.6, 0.6, 0.6); torso.add(at(cr, 0.052, 0.1, 0)); }
  const neck = new THREE.Group(); neck.position.y = 0.19; torso.add(neck);
  neck.add(at(cyl(0.018, 0.02, 0.04, SKINM(o.skin)), 0, 0.012));
  if (o.collar) neck.add(at(torus(0.024, 0.01, M(o.collar, 'fur'), 6, 14), 0, 0.0, 0, Math.PI / 2));
  const head = new THREE.Group(); head.position.y = 0.058; neck.add(head); R.head = head;
  const hd = sph(0.043, SKINM(o.skin), 16, 12); hd.scale.set(0.96, 1.06, 0.9); head.add(hd);
  head.add(at(box(0.014, 0.016, 0.011, SKINM(o.skin)), 0.042, -0.004));
  [0.016, -0.016].forEach(z => head.add(at(sph(0.005, BLACK(), 6, 4), 0.038, 0.01, z)));
  if (o.hair) { const h = sph(0.045, HAIRM(o.hair), 14, 10); h.scale.set(0.98, 0.72, 0.96); at(h, -0.006, 0.012); head.add(h); }
  if (o.longHair) { const lh = box(0.03, 0.08, 0.075, HAIRM(o.hair || '#4a3020')); at(lh, -0.03, -0.025); head.add(lh); }
  if (o.mustache) { const m = box(0.01, 0.009, 0.05, HAIRM(o.mustache)); at(m, 0.041, -0.02); head.add(m); if (o.longMus) [1, -1].forEach(s => head.add(at(box(0.008, 0.03, 0.008, HAIRM(o.mustache)), 0.04, -0.035, 0.026 * s))); }
  if (o.beard) { const b = sph(0.032, HAIRM(o.beard), 12, 8); b.scale.set(0.8, o.longBeard ? 1.6 : 1.05, 1.1); at(b, 0.022, o.longBeard ? -0.05 : -0.038); head.add(b); }
  if (o.hat) HATS[o.hat](head, o);
  ['L', 'R'].forEach(side => {
    const s = side === 'L' ? 1 : -1;
    const sh = new THREE.Group(); sh.position.set(0, 0.172, 0.071 * s); torso.add(sh);
    sh.add(at(sph(0.022, M(o.sleeve || o.shirt, o.sleeveK || o.shirtK || 'linen')), 0, 0));
    sh.add(limb(0.02, 0.017, 0.115, M(o.sleeve || o.shirt, o.sleeveK || o.shirtK || 'linen')));
    const el = new THREE.Group(); el.position.y = -0.115; sh.add(el);
    el.add(limb(0.017, 0.014, 0.1, M(o.cuff || o.sleeve || o.shirt, o.cuffK || o.sleeveK || o.shirtK || 'linen')));
    const hand = new THREE.Group(); hand.position.y = -0.105; el.add(hand);
    hand.add(sph(0.017, o.gauntlet || SKINM(o.skin), 10, 8));
    R['sh' + side] = sh; R['el' + side] = el; R['hand' + side] = hand;
  });
  ['L', 'R'].forEach(side => {
    const s = side === 'L' ? 1 : -1;
    const hip = new THREE.Group(); hip.position.set(0, 0, 0.03 * s); hips.add(hip);
    hip.add(limb(0.025, 0.019, 0.135, M(o.pants, o.pantsK || 'wool')));
    const kn = new THREE.Group(); kn.position.y = -0.135; hip.add(kn);
    kn.add(limb(0.019, 0.015, 0.125, M(o.legwrap || o.pants, o.legK || o.pantsK || 'wool')));
    kn.add(at(box(0.058, 0.024, 0.032, M(o.boots, 'leather')), 0.014, -0.128));
    if (o.highBoots) kn.add(at(cyl(0.02, 0.018, 0.08, M(o.boots, 'leather'), 8), 0, -0.085));
    R['hip' + side] = hip; R['kn' + side] = kn;
  });
  if (o.cloak) { const c = cyl(0.064, 0.115, 0.34, M(o.cloak, 'velvet'), 16, true, Math.PI * 1.05, Math.PI * 0.9); at(c, -0.005, 0.03); torso.add(c); R.cloak = c; }
  if (o.weapon) { const w = tool(o.weapon); R.handR.add(w); R.weapon = w; }
  if (o.shield) { const sd = shield(o.shield, o.shieldCol || 'T'); at(sd, 0.01, -0.05, 0.03, 0, 0, 0); R.elL.add(sd); R.shieldObj = sd; }
  if (o.bow) { const b = tool(o.bow === true ? 'bow' : o.bow); R.handL.add(b); R.bow = b; }
  if (o.offhand) { const t = tool(o.offhand); R.handL.add(t); }
  R.tools = {};
  if (o.tools) o.tools.forEach(k => { const t = tool(k); t.visible = false; R.handR.add(t); R.tools[k] = t; });
  const longW = { spear: 1, pike: 1, halberd: 1, lance: 1, staff: 1 };
  R.reset = function () {
    R.root.position.set(0, R.baseY || 0, 0); R.root.rotation.x = 0; R.root.rotation.z = 0;
    R.hips.position.y = 0.285; R.hips.rotation.set(0, 0, 0);
    R.torso.rotation.set(0, 0, 0); R.head.rotation.set(0, 0, 0);
    R.shL.rotation.set(-0.12, 0, 0.05); R.shR.rotation.set(0.12, 0, 0.05);
    R.elL.rotation.set(0, 0, 0.18); R.elR.rotation.set(0, 0, 0.18);
    ['L', 'R'].forEach(s => { R['hip' + s].rotation.set(0, 0, 0); R['kn' + s].rotation.set(0, 0, 0); });
    if (R.weapon) R.weapon.rotation.set(0, 0, longW[o.weapon] ? (o.mounted ? Math.PI / 2 : -0.05) : o.weapon === 'gun' || o.weapon === 'musket' || o.weapon === 'crossbow' ? 0.3 : 1.25);
    if (o.weapon === 'gun' || o.weapon === 'musket' || o.weapon === 'crossbow') { R.shR.rotation.z = 0.5; R.elR.rotation.z = 1.2; }
    if (o.shield) { R.shL.rotation.z = 0.6; R.elL.rotation.z = 0.9; R.shL.rotation.x = -0.05; }
    if (o.bow) R.bow.rotation.set(0, 0, 0);
    Object.values(R.tools).forEach(t => { t.visible = false; t.rotation.set(0, 0, 1.25); });
  };
  R.reset();
  return R;
}

// ---------- calul ----------
export function horse(o) {
  const H = { root: new THREE.Group() }, sc = o.small ? 0.88 : 1;
  H.root.scale.set(sc, sc, sc);
  const body = new THREE.Group(); body.position.y = 0.36; H.root.add(body); H.body = body;
  const coat = cloth(o.coat, o.dapple ? 'dapple' : 'horse', 0.75), dark = HAIRM(o.mane || '#2a1c12');
  const torso = mesh(new THREE.CapsuleGeometry(0.085, 0.27, 6, 12), coat); at(torso, 0, 0, 0, 0, 0, Math.PI / 2); torso.scale.set(1, 1, 0.82); body.add(torso);
  const neck = new THREE.Group(); neck.position.set(0.17, 0.04, 0); body.add(neck); H.neck = neck;
  const nk = mesh(new THREE.CapsuleGeometry(0.045, 0.16, 5, 10), coat); at(nk, 0.06, 0.08, 0, 0, 0, -0.75); neck.add(nk);
  neck.add(at(box(0.12, 0.03, 0.018, dark), 0.04, 0.14, 0, 0, 0, -0.75));
  const head = mesh(new THREE.CapsuleGeometry(0.035, 0.11, 5, 10), coat); at(head, 0.17, 0.17, 0, 0, 0, -2.1); neck.add(head);
  neck.add(at(cone(0.012, 0.035, coat, 6), 0.12, 0.25, 0.018)); neck.add(at(cone(0.012, 0.035, coat, 6), 0.12, 0.25, -0.018));
  if (o.bridle) neck.add(at(torus(0.036, 0.004, LEATHER('#3a2414'), 4, 12), 0.2, 0.15, 0, 0, Math.PI / 2, 0.5));
  const tail = mesh(new THREE.CapsuleGeometry(0.018, 0.16, 4, 8), dark); at(tail, -0.24, -0.04, 0, 0, 0, -0.45); body.add(tail);
  [['FL', 0.15, 0.05], ['FR', 0.15, -0.05], ['BL', -0.15, 0.05], ['BR', -0.15, -0.05]].forEach(([n, x, z]) => {
    const hip = new THREE.Group(); hip.position.set(x, -0.04, z); body.add(hip);
    hip.add(limb(0.028, 0.02, 0.16, coat));
    const kn = new THREE.Group(); kn.position.y = -0.16; hip.add(kn);
    kn.add(limb(0.018, 0.015, 0.15, coat));
    kn.add(at(cyl(0.02, 0.022, 0.025, dark, 8), 0, -0.155));
    H['hip' + n] = hip; H['kn' + n] = kn;
  });
  if (o.saddle) { const s = cyl(0.092, 0.092, 0.07, M(o.saddle, o.saddleK || 'embroid'), 16, true, 0, Math.PI); at(s, 0, 0.02, 0, 0, Math.PI / 2, 0); s.scale.set(1, 1, 0.9); body.add(s); }
  if (o.cape) { const c = cyl(0.1, 0.13, 0.2, M(o.cape, 'velvet'), 18, true); at(c, 0, -0.03, 0); c.scale.set(1.9, 1, 1); body.add(c); H.cape = c; }
  if (o.barding) { const c = cyl(0.11, 0.14, 0.26, o.barding, 18, true); at(c, 0, -0.05, 0); c.scale.set(1.95, 1, 1); body.add(c); const ch = cyl(0.05, 0.06, 0.12, o.barding, 10, true); at(ch, 0.22, 0.1, 0, 0, 0, -0.75); body.add(ch); }
  if (o.chanfron) neck.add(at(box(0.09, 0.02, 0.05, STEEL()), 0.17, 0.18, 0, 0, 0, -2.1));
  H.reset = function () {
    H.root.position.set(0, 0, 0); H.root.rotation.x = 0; H.root.rotation.z = 0;
    H.body.position.y = 0.36; H.body.rotation.set(0, 0, 0); H.neck.rotation.set(0, 0, 0);
    ['FL', 'FR', 'BL', 'BR'].forEach(n => { H['hip' + n].rotation.set(0, 0, 0); H['kn' + n].rotation.set(0, 0, 0); });
  };
  return H;
}

export function camel() {
  const H = { root: new THREE.Group() }, coat = cloth('#c49a68', 'horse', 0.85), dark = cloth('#8a6a44', 'fur', 1);
  const body = new THREE.Group(); body.position.y = 0.5; H.root.add(body); H.body = body;
  const torso = mesh(new THREE.CapsuleGeometry(0.085, 0.26, 6, 12), coat); at(torso, 0, 0, 0, 0, 0, Math.PI / 2); torso.scale.set(1, 1, 0.8); body.add(torso);
  const hump = sph(0.1, coat, 12, 8); hump.scale.set(1.25, 0.95, 0.85); at(hump, -0.01, 0.08, 0); body.add(hump);
  const neck = new THREE.Group(); neck.position.set(0.17, 0.0, 0); body.add(neck); H.neck = neck;
  neck.add(at(mesh(new THREE.CapsuleGeometry(0.034, 0.15, 5, 8), coat), 0.08, -0.03, 0, 0, 0, -2.0));
  neck.add(at(mesh(new THREE.CapsuleGeometry(0.03, 0.15, 5, 8), coat), 0.17, 0.06, 0, 0, 0, -0.3));
  neck.add(at(mesh(new THREE.CapsuleGeometry(0.03, 0.08, 5, 8), coat), 0.22, 0.16, 0, 0, 0, -1.8));
  neck.add(at(torus(0.03, 0.004, LEATHER('#3a2414'), 4, 10), 0.22, 0.15, 0, 0, Math.PI / 2, 0.3));
  body.add(at(mesh(new THREE.CapsuleGeometry(0.012, 0.12, 4, 6), dark), -0.22, -0.06, 0, 0, 0, -0.3));
  [['FL', 0.14, 0.05], ['FR', 0.14, -0.05], ['BL', -0.14, 0.05], ['BR', -0.14, -0.05]].forEach(([n, x, z]) => {
    const hip = new THREE.Group(); hip.position.set(x, -0.05, z); body.add(hip); hip.add(limb(0.026, 0.017, 0.22, coat));
    const kn = new THREE.Group(); kn.position.y = -0.22; hip.add(kn); kn.add(limb(0.016, 0.014, 0.21, coat)); kn.add(at(cyl(0.024, 0.026, 0.02, dark, 8), 0, -0.215));
    H['hip' + n] = hip; H['kn' + n] = kn;
  });
  H.reset = () => { H.root.position.set(0, 0, 0); H.root.rotation.x = 0; H.root.rotation.z = 0; H.body.position.y = 0.5; H.body.rotation.set(0, 0, 0); H.neck.rotation.set(0, 0, 0); ['FL', 'FR', 'BL', 'BR'].forEach(n => { H['hip' + n].rotation.set(0, 0, 0); H['kn' + n].rotation.set(0, 0, 0); }); };
  return H;
}
function barrel0() { const g = new THREE.Group(); g.add(cyl(0.05, 0.05, 0.11, WOOD('#a07850'), 12)); [-0.035, 0.035].forEach(y => g.add(at(torus(0.051, 0.005, IRON(), 4, 14), 0, y, 0, Math.PI / 2))); return g; }

// ---------- asediul ----------
function wheel(r, mat) {
  const g = new THREE.Group();
  g.add(torus(r, r * 0.12, mat, 6, 18));
  for (let i = 0; i < 6; i++) g.add(at(box(r * 0.1, r * 2, r * 0.1, mat), 0, 0, 0, 0, 0, i * Math.PI / 6));
  const hub = cyl(r * 0.2, r * 0.2, r * 0.4, IRON(), 8); hub.rotation.x = Math.PI / 2; g.add(hub);
  return g;
}
function pennant(g, x, y, z, h = 0.18) { g.add(at(cyl(0.005, 0.005, h, WOOD(), 5), x, y + h / 2, z)); g.add(at(box(0.004, 0.045, 0.08, team('velvet')), x, y + h - 0.03, z + 0.04)); }
export function siege(vis, civ) {
  const S = { root: new THREE.Group(), wheels: [] }, wd = WOOD('#6e4b2a');
  if (vis === 'ram1' || vis === 'ram2') {
    const heavy = vis === 'ram2', hide = cloth(heavy ? '#5a4632' : '#7a5a3a', 'hide', 0.95);
    S.root.add(at(box(0.62, 0.05, 0.3, wd), 0, 0.12));
    [[-0.22, 0.17], [0.22, 0.17], [-0.22, -0.17], [0.22, -0.17]].forEach(([x, z]) => { const w = wheel(0.07, wd); at(w, x, 0.07, z); S.root.add(w); S.wheels.push(w); });
    [[-0.27, 0.13], [0.27, 0.13], [-0.27, -0.13], [0.27, -0.13]].forEach(([x, z]) => S.root.add(at(box(0.03, 0.2, 0.03, wd), x, 0.24, z)));
    const roof = new THREE.Group(); roof.position.y = 0.34; S.root.add(roof);
    roof.add(at(box(0.66, 0.012, 0.22, hide), 0, 0.05, 0.08, -0.62)); roof.add(at(box(0.66, 0.012, 0.22, hide), 0, 0.05, -0.08, 0.62));
    if (heavy) { for (let i = 0; i < 5; i++) roof.add(at(box(0.02, 0.014, 0.25, IRON()), -0.26 + i * 0.13, 0.06, 0.08, -0.62)); }
    roof.add(at(box(0.68, 0.03, 0.03, team('velvet')), 0, 0.12));
    const log = new THREE.Group(); log.position.y = 0.22; S.root.add(log); S.log = log;
    log.add(at(cyl(0.035, 0.035, 0.75, WOOD('#7a5532'), 10), 0.05, 0, 0, 0, 0, Math.PI / 2));
    if (heavy) { const hd = cone(0.055, 0.12, IRON(), 10); at(hd, 0.46, 0, 0, 0, 0, -Math.PI / 2); log.add(hd); }
    else log.add(at(cyl(0.045, 0.04, 0.08, IRON(), 10), 0.44, 0, 0, 0, 0, Math.PI / 2));
    pennant(S.root, -0.28, 0.4, 0);
    S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.log.position.x = 0; S.wheels.forEach(w => w.rotation.z = 0); };
    S.atk = t => { S.log.position.x = key([0, -0.08, 0.1, 0.02], t); };
  } else if (vis === 'cat1' || vis === 'cat2') {
    const big = vis === 'cat2' ? 1.18 : 1;
    S.root.scale.set(big, big, big);
    S.root.add(at(box(0.5, 0.05, 0.26, wd), 0, 0.1)); [[-0.18, 0.15], [0.18, 0.15], [-0.18, -0.15], [0.18, -0.15]].forEach(([x, z]) => { const w = wheel(0.075, wd); at(w, x, 0.075, z); S.root.add(w); S.wheels.push(w); });
    [0.11, -0.11].forEach(z => { S.root.add(at(box(0.05, 0.26, 0.04, wd), 0.06, 0.24, z, 0, 0, -0.2)); S.root.add(at(box(0.05, 0.22, 0.04, wd), -0.08, 0.22, z, 0, 0, 0.25)); });
    S.root.add(at(box(0.04, 0.04, 0.26, wd), 0.0, 0.34));
    S.root.add(at(cyl(0.04, 0.04, 0.2, cloth('#8a7a5a', 'linen'), 10), -0.12, 0.14, 0, Math.PI / 2));
    const arm = new THREE.Group(); arm.position.set(-0.12, 0.15, 0); S.root.add(arm); S.arm = arm;
    arm.add(at(box(0.5, 0.03, 0.03, wd), 0.22, 0, 0)); const bk = sph(0.05, LEATHER('#4a3020'), 8, 6); bk.scale.set(1, 0.5, 1); at(bk, 0.46, 0.02, 0); arm.add(bk);
    arm.add(at(sph(0.035, cloth('#8a8478', 'leather', 0.9), 8, 6), 0.46, 0.05, 0));
    if (vis === 'cat2') S.root.add(at(box(0.18, 0.012, 0.3, cloth('#6a5a40', 'hide')), -0.2, 0.32, 0, 0, 0, 0.4));
    pennant(S.root, -0.24, 0.12, 0.12);
    S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.arm.rotation.z = -0.25; S.wheels.forEach(w => w.rotation.z = 0); };
    S.atk = t => { S.arm.rotation.z = key([-0.25, -0.3, 1.25, 1.05, 0.3], t); };
  } else if (vis === 'can1') {
    // bombarda: țeavă groasă de fier pe o sanie de lemn
    S.root.add(at(box(0.56, 0.08, 0.24, wd), 0, 0.05)); [0.1, -0.1].forEach(z => S.root.add(at(box(0.6, 0.03, 0.03, WOOD('#5a3a1e')), 0, 0.02, z)));
    const barrel = new THREE.Group(); barrel.position.set(0, 0.16, 0); S.root.add(barrel); S.barrel = barrel;
    barrel.add(at(cyl(0.075, 0.08, 0.5, DARKIRON(), 16), 0.04, 0, 0, 0, 0, Math.PI / 2 - 0.08));
    for (let i = 0; i < 5; i++) barrel.add(at(torus(0.08, 0.008, IRON(), 5, 16), -0.16 + i * 0.1, 0.004, 0, 0, Math.PI / 2, 0));
    barrel.add(at(cyl(0.05, 0.05, 0.02, cloth('#141210', 'velvet'), 12), 0.3, 0.02, 0, 0, 0, Math.PI / 2));
    pennant(S.root, -0.26, 0.09, 0.1);
    S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.barrel.position.x = 0; };
    S.atk = t => { S.barrel.position.x = key([0, -0.07, -0.04, 0], t); };
  } else if (vis === 'can2') {
    [[0.07], [-0.07]].forEach(([z]) => S.root.add(at(box(0.42, 0.05, 0.025, wd), -0.08, 0.1, z, 0, 0, 0.12)));
    [0.11, -0.11].forEach(z => { const w = wheel(0.11, wd); at(w, 0.02, 0.11, z); S.root.add(w); S.wheels.push(w); });
    const barrel = new THREE.Group(); barrel.position.set(0.04, 0.18, 0); S.root.add(barrel); S.barrel = barrel;
    barrel.add(at(cyl(0.035, 0.05, 0.52, BRONZE(), 16), 0.12, 0, 0, 0, 0, Math.PI / 2 - 0.12));
    barrel.add(at(cyl(0.055, 0.055, 0.03, BRONZE(), 16), 0.37, 0.03, 0, 0, 0, Math.PI / 2 - 0.12));
    barrel.add(at(sph(0.04, BRONZE(), 10, 8), -0.14, -0.03, 0));
    pennant(S.root, -0.3, 0.12, 0.07);
    S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.barrel.position.x = 0.04; S.wheels.forEach(w => w.rotation.z = 0); };
    S.atk = t => { S.barrel.position.x = 0.04 + key([0, -0.06, -0.03, 0], t); };
  } else if (vis === 'treb') {
    S.root.add(at(box(0.7, 0.05, 0.42, wd), 0, 0.03));
    [0.15, -0.15].forEach(z => { S.root.add(at(box(0.05, 0.62, 0.05, wd), -0.1, 0.33, z, 0, 0, -0.32)); S.root.add(at(box(0.05, 0.62, 0.05, wd), 0.1, 0.33, z, 0, 0, 0.32)); });
    S.root.add(at(cyl(0.022, 0.022, 0.36, IRON(), 8), 0, 0.6, 0, Math.PI / 2));
    const arm = new THREE.Group(); arm.position.set(0, 0.6, 0); S.root.add(arm); S.arm = arm;
    arm.add(at(box(0.95, 0.035, 0.035, wd), 0.18, 0, 0));
    arm.add(at(box(0.16, 0.16, 0.16, cloth('#5a5048', 'leather', 0.9)), -0.3, -0.12, 0)); arm.add(at(box(0.18, 0.02, 0.18, IRON()), -0.3, -0.03, 0));
    arm.add(at(cyl(0.003, 0.003, 0.22, cloth('#c8b890', 'linen'), 4), 0.64, -0.11, 0));
    pennant(S.root, 0.3, 0.05, 0.2, 0.3);
    S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.arm.rotation.z = -0.55; };
    S.atk = t => { S.arm.rotation.z = key([-0.55, -0.6, 0.9, 1.4, 0.4], t); };
  } else if (vis === 'car') {
    // carul de negoț: cu boi (Moldova, Țara Românească), căruță cu coviltir (Ungaria, Polonia), chibitcă (tătari), cămilă (otomani)
    if (civ === 'oto') {
      const cm = camel(); S.root.add(cm.root); S.ox = cm;
      const blanket = cyl(0.13, 0.13, 0.2, team('embroid', 0.9), 16, true, 0, Math.PI); at(blanket, 0, 0.56, 0, 0, Math.PI / 2, 0); blanket.scale.set(1, 1, 0.9); S.root.add(blanket);
      [1, -1].forEach(sd => { const bl = box(0.16, 0.13, 0.08, cloth('#c8b48a', 'linen', 0.95)); at(bl, -0.02, 0.48, 0.12 * sd); S.root.add(bl); [0.44, 0.52].forEach(y => S.root.add(at(box(0.17, 0.012, 0.085, LEATHER('#5a3a22')), -0.02, y, 0.12 * sd))); });
      S.root.add(at(cyl(0.05, 0.05, 0.14, cloth('#8a3a1a', 'stripes'), 10), -0.02, 0.66, 0, Math.PI / 2));
      S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; cm.reset(); };
      S.walk = t => { gallop(cm, t * TAU, 0.28); cm.body.position.y = 0.5 + Math.abs(Math.sin(t * TAU)) * 0.012; };
    } else {
      S.root.add(at(box(0.42, 0.04, 0.26, wd), -0.08, 0.16)); [0.15, -0.15].forEach(z => { const w = wheel(0.12, wd); at(w, -0.08, 0.12, z); S.root.add(w); S.wheels.push(w); });
      [0.13, -0.13].forEach(z => S.root.add(at(box(0.42, 0.07, 0.012, wd), -0.08, 0.21, z)));
      S.root.add(at(box(0.4, 0.02, 0.02, wd), 0.22, 0.16, 0));
      if (civ === 'ung' || civ === 'pol') {
        const cov = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.44, 14, 1, true, 0, Math.PI), team('linen', 0.9)); at(cov, -0.08, 0.22, 0, 0, 0, Math.PI / 2); cov.scale.set(1, 1, 0.95); S.root.add(cov);
        [-0.26, 0.1].forEach(x => S.root.add(at(torus(0.15, 0.008, WOOD(), 4, 14, Math.PI), x, 0.22, 0, 0, Math.PI / 2, 0)));
      } else if (civ === 'tat') {
        const d = dome(0.17, cloth('#e8dcc4', 'felt', 0.98)); d.scale.set(1.35, 0.9, 0.95); at(d, -0.08, 0.2, 0); S.root.add(d);
        S.root.add(at(torus(0.165, 0.012, team('felt'), 5, 18), -0.08, 0.26, 0, Math.PI / 2)); S.root.children[S.root.children.length - 1].scale.set(1.35, 0.95, 1);
      } else {
        for (let i = 0; i < 3; i++) S.root.add(at(sph(0.06, cloth('#c8b48a', 'linen'), 8, 6), -0.16 + i * 0.08, 0.24, (i % 2 - 0.5) * 0.08));
        S.root.add(at(barrel0(), -0.02, 0.2, 0.06));
        S.root.add(at(box(0.3, 0.06, 0.012, team('velvet')), -0.08, 0.22, 0.135));
      }
      let ox;
      if (civ === 'mol' || civ === 'val') {
        ox = horse({ coat: civ === 'val' ? '#9a8a78' : '#8a7258', mane: '#3a2a1a' }); ox.root.scale.set(0.85, 0.75, 1.15);
        [1, -1].forEach(sd => { const hn = cone(0.012, 0.09, BONE(), 6); at(hn, 0.13, 0.27, 0.035 * sd, sd * 0.9, 0, -0.4); ox.neck.add(hn); });
      } else ox = horse({ coat: civ === 'tat' ? '#c8a070' : '#6a4a2a', mane: '#2a1c12', small: civ === 'tat', bridle: true });
      at(ox.root, 0.48, 0, 0); if (civ === 'mol' || civ === 'val') ox.root.scale.set(0.85, 0.75, 1.15); S.root.add(ox.root);
      S.ox = ox;
      S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.wheels.forEach(w => w.rotation.z = 0); ox.reset(); };
      S.walk = t => { S.wheels.forEach(w => w.rotation.z = -t * TAU / 3); gallop(ox, t * TAU, 0.3); };
    }
  }
  return S;
}

// ---------- ținutele celor 6 civilizații ----------
const SK = { mol: '#e2b48c', val: '#dcaa82', ung: '#e6bc96', pol: '#ecc4a0', oto: '#c8956a', tat: '#c79a70' };
// trepte de armură comune: 1 căptușit, 2 zale, 3 zale + plăci, 4 plăci, 5 plăci cu aur
function armorOf(tier) {
  if (tier <= 1) return {};
  if (tier === 2) return { armor: MAIL() };
  if (tier === 3) return { armor: MAIL(), pauldrons: STEEL() };
  return { armor: MAIL(), cuirass: tier >= 5 ? cloth('#d8dde4', 'gold', 0.25, { metal: 0.95, env: 1.4 }) : STEEL(), pauldrons: STEEL(), gauntlet: STEEL() };
}
export function outfit(vis, civ) {
  const base = vis.replace(/\d$/, ''), tier = +(vis.match(/\d$/) || [1])[0], s = SK[civ];
  const A = armorOf(tier);
  const W = Object.assign;
  // ---- țăranii ----
  if (vis === 'vil' || vis === 'vilf') {
    const f = vis === 'vilf', tools = ['axe', 'pick', 'hammer', 'sickle'];
    const V = {
      mol: f ? { shirt: '#f2ede2', skirt: '#2a2420', skirtK: 'stripes', sash: 'T', pants: '#f2ede2', boots: '#5a3a22', hat: 'scarf', hatCol: '#f2ede2', hatTop: '#a01c1c', len: 'robe' }
             : { shirt: '#efe9dc', vest: '#efe4cc', vestK: 'fleece', pants: '#e6e0d2', legwrap: '#d9d0bd', boots: '#6b4a2e', belt: 'T', hat: 'cusma', mustache: '#3a2414', len: 'tunic' },
      val: f ? { shirt: '#f2ede2', skirt: '#7a1a14', skirtK: 'stripes', sash: 'T', pants: '#f2ede2', boots: '#3a2416', hat: 'scarf', hatCol: '#e8d8b8', hatTop: '#1a1a1a', len: 'robe' }
             : { shirt: '#ece6d6', vest: '#5a2a1a', vestK: 'wool', pants: '#d8d0bc', boots: '#3a2416', belt: 'T', hat: 'kalpak', hatCol: '#3a2418', mustache: '#2a1a10', longMus: true, len: 'long' },
      ung: f ? { shirt: '#f0eadc', skirt: '#3a5a2a', skirtK: 'plaid', sash: 'T', pants: '#f0eadc', boots: '#4a3020', hat: 'scarf', hatCol: '#e8d090', hatTop: '#b02a20', len: 'robe' }
             : { shirt: '#e8e0cc', vest: '#3a5a2a', vestK: 'wool', pants: '#3a3a44', boots: '#3a2a1a', belt: 'T', hat: 'brim', hatCol: '#3a3028', mustache: '#5a3a1e', len: 'tunic' },
      pol: f ? { shirt: '#f4efe4', skirt: '#a02020', skirtK: 'stripes', sash: 'T', pants: '#f4efe4', boots: '#4a3020', hat: 'scarf', hatCol: '#f4efe4', hatTop: '#c02828', len: 'robe' }
             : { shirt: '#ece4d0', vest: '#7a5a3a', vestK: 'leather', pants: '#6a5a4a', boots: '#4a3020', belt: 'T', hat: 'hood', hatCol: '#8a6a40', mustache: '#8a5a2a', len: 'tunic' },
      oto: f ? { shirt: '#e8d8b0', skirt: '#2f6a5a', skirtK: 'velvet', sash: 'T', pants: '#e8d8b0', boots: '#7a2a20', hat: 'scarf', hatCol: '#e8e0cc', hatTop: '#c8a040', len: 'robe' }
             : { shirt: '#d8c8a0', skirt: '#cdb98e', pants: '#8a6a48', boots: '#5a3a22', sash: 'T', hat: 'turban', hatCol: '#f1ede2', hatTop: '#d8c8a0', mustache: '#2a1a10', len: 'robe' },
      tat: f ? { shirt: '#b8763a', shirtK: 'quilt', skirt: '#6a3a1a', pants: '#d8c8a0', boots: '#3a2416', sash: 'T', hat: 'malakhai', hatCol: '#5a3a1e', hatTop: '#3a5a7a', len: 'robe' }
             : { shirt: '#9a6a3a', shirtK: 'quilt', skirt: '#8a5a2a', skirtK: 'quilt', pants: '#5a4a3a', boots: '#3a2416', sash: 'T', hat: 'malakhai', hatCol: '#5a3a1e', hatTop: '#7a2a1a', mustache: '#1a1210', len: 'long' }
    }[civ];
    return W({ skin: s, tools, hair: '#3a2416' }, V);
  }
  // ---- călugării ----
  if (vis === 'mon') {
    if (civ === 'mol' || civ === 'val') return { skin: s, shirt: '#16130f', shirtK: 'wool', skirt: '#16130f', pants: '#16130f', boots: '#2a1a10', hat: 'kamilavka', beard: '#5a4a3a', longBeard: true, mustache: '#5a4a3a', len: 'robe', cross: true, offhand: 'beads', sash: 'T', heal: true };
    if (civ === 'ung' || civ === 'pol') return { skin: s, shirt: '#5a3e26', skirt: '#5a3e26', pants: '#5a3e26', boots: '#3a2416', hat: 'hood', hatCol: '#5a3e26', belt: '#d8c8a0', beltK: 'linen', len: 'robe', offhand: 'cross', sash: 'T', heal: true };
    return { skin: s, shirt: '#ece4d0', skirt: '#ece4d0', skirtK: 'linen', pants: '#ece4d0', boots: '#7a5a3a', hat: 'sikke', beard: '#2a1a10', mustache: '#2a1a10', len: 'robe', cloak: '#6a4a2a', sash: 'T', offhand: 'beads', heal: true };
  }
  // ---- eroii ----
  if (vis === 'hero') return {
    mol: { skin: s, shirt: '#7a1a18', shirtK: 'velvet', armor: cloth('#c8a050', 'scales', 0.4, { metal: 0.7 }), sleeve: '#7a1a18', skirt: '#7a1a18', pants: '#5a1210', boots: '#3a2416', belt: '#d9ab3c', hat: 'crown', hair: '#4a3020', longHair: true, mustache: '#3a2414', longMus: true, len: 'tunic', cloak: '#a51d1d', weapon: 'sword', mounted: true, coat: '#efece4', mane: '#d8d0c0', saddle: 'T', cape: 'T', bridle: true },
    val: { skin: s, shirt: '#3a0e10', shirtK: 'velvet', armor: cloth('#2a2a2e', 'scales', 0.45, { metal: 0.6 }), sleeve: '#5a1014', skirt: '#3a0e10', pants: '#1a1010', boots: '#1a1210', belt: '#d9ab3c', hat: 'vladcap', hair: '#1a1210', longHair: true, mustache: '#1a1210', longMus: true, len: 'long', cloak: '#141014', weapon: 'saber', mounted: true, coat: '#1a1612', mane: '#0e0a08', saddle: 'T', cape: 'T', bridle: true },
    ung: { skin: s, shirt: 'T', shirtK: 'velvet', cuirass: STEEL(), pauldrons: STEEL(), gauntlet: STEEL(), armor: MAIL(), sleeve: '#5a5e64', skirt: 'T', pants: '#3a3a44', boots: '#2a2a2e', hat: 'iancu', mustache: '#5a3a1e', longMus: true, len: 'tunic', cloak: '#1e2a1e', weapon: 'mace', mounted: true, coat: '#efece4', saddle: 'T', barding: team('velvet'), chanfron: true, bridle: true },
    pol: { skin: s, shirt: 'T', shirtK: 'velvet', cuirass: cloth('#d8dde4', 'gold', 0.25, { metal: 0.95, env: 1.4 }), pauldrons: STEEL(), gauntlet: STEEL(), armor: MAIL(), sleeve: '#5a5e64', skirt: 'T', pants: '#5a5e64', boots: '#2a2a2e', hat: 'crown', arches: true, hair: '#8a5a2a', longHair: true, len: 'tunic', cloak: '#c8c0b0', weapon: 'sword', mounted: true, coat: '#6a4a2a', saddle: 'T', barding: team('velvet'), bridle: true },
    oto: { skin: s, shirt: '#2f7d4a', shirtK: 'velvet', skirt: '#2f7d4a', sleeve: '#2f7d4a', pants: '#e0d6c0', boots: '#7a2a20', belt: '#d9ab3c', hat: 'pasha', beard: '#1e140c', mustache: '#1e140c', len: 'robe', cloak: '#c8352a', weapon: 'kilij', mounted: true, coat: '#f2eee6', mane: '#c8c0b0', saddle: 'T', cape: 'T', bridle: true },
    tat: { skin: s, shirt: '#7a1a2a', shirtK: 'velvet', armor: LAMELLAR('#c8a050'), skirt: '#7a1a2a', sleeve: '#7a1a2a', pants: '#3a2a1a', boots: '#1a1210', belt: '#d9ab3c', hat: 'khan', beard: '#1a1210', mustache: '#1a1210', longMus: true, len: 'long', cloak: '#3a2a1a', weapon: 'saber', bow: 'cbow', mounted: true, coat: '#c8a070', small: true, saddle: 'T', cape: 'T', bridle: true }
  }[civ];
  // ---- unitățile unice ----
  if (base === 'raz') return W({ skin: s, shirt: '#efe9dc', vest: 'T', vestK: 'fleece', pants: '#e6e0d2', legwrap: '#d9d0bd', boots: '#6b4a2e', belt: 'T', sash: 'T', hat: 'cusma', mustache: '#3a2414', longMus: true, len: 'tunic', weapon: 'baltag' }, tier > 1 ? { armor: MAIL(), shield: 'round' } : {});
  if (base === 'vit') return W({ skin: s, shirt: 'T', sleeve: '#3a2a20', armor: LAMELLAR('#9aa0a8'), skirt: 'T', pants: '#2a1e18', boots: '#1a1210', belt: '#d9ab3c', hat: 'nasal', plume: tier > 1 ? '#c8202a' : null, mustache: '#1a1210', longMus: true, len: 'tunic', weapon: 'saber', shield: 'round', cloak: tier > 1 ? '#3a0e10' : null });
  if (base === 'hus') return W({ skin: s, shirt: 'T', shirtK: 'velvet', sleeve: 'T', skirt: 'T', pants: '#2a2a3a', boots: '#e8d0a0', highBoots: true, belt: '#d9ab3c', hat: 'kucsma', mustache: '#5a3a1e', longMus: true, len: 'tunic', weapon: 'lance', shield: 'hus', mounted: true, coat: '#4a3020', saddle: '#c8a050', saddleK: 'fur', cape: tier > 1 ? '#c8a050' : null, bridle: true }, tier > 1 ? { collar: '#c8a050' } : {});
  if (base === 'cpl') return W({ skin: s, shirt: 'T', armor: MAIL(), cuirass: STEEL(), pauldrons: STEEL(), gauntlet: STEEL(), sleeve: '#5a5e64', skirt: 'T', pants: '#5a5e64', boots: '#2a2a2e', hat: 'armet', plume: '#f0f0f0', len: 'tunic', weapon: 'lance', shield: 'heater', mounted: true, coat: '#3a2a1e', barding: team('velvet'), chanfron: true, bridle: true });
  if (base === 'ien') return { skin: s, shirt: 'T', shirtK: 'velvet', skirt: 'T', skirtK: 'velvet', sleeve: 'T', pants: '#e8e0cc', boots: '#d8b048', sash: 'T', hat: 'bork', mustache: '#1e140c', longMus: true, len: 'robe', weapon: 'gun', cloak: tier > 1 ? '#7a1a18' : null };
  if (base === 'nog') return W({ skin: s, shirt: '#8a5a2a', shirtK: 'quilt', skirt: '#8a5a2a', skirtK: 'quilt', sleeve: '#8a5a2a', pants: '#5a4a3a', boots: '#2a1a10', sash: 'T', hat: 'malakhai', hatCol: '#3a2a1a', hatTop: 'T', mustache: '#1a1210', len: 'long', bow: 'cbow', quiver: true, mounted: true, coat: '#c8a070', small: true, saddle: 'T', bridle: true }, tier > 1 ? { armor: LAMELLAR('#8a7a5a') } : {});
  // ---- oștenii obișnuiți: culorile civilizației sunt închise și neutre, ca să nu se confunde cu ale echipelor ----
  const L = {
    mol: { under: '#efe9dc', skirt: '#efe9dc', skirtK: 'linen', len: 'long', pants: '#e6e0d2', legwrap: '#d9d0bd', boots: '#5a3a22', vest: '#e8dcc0', vestK: 'fleece', hats: ['cusma', 'cusma', 'spike', 'spike', 'spike'], hatCol: '#1e1712', heavy: t => SCALES(t >= 5 ? '#d8b860' : '#b4ac98'), shield: 'round', sword: 'sword', mus: '#3a2414', cloak: '#5a1410', bow: 'bow', coat: '#7a5232' },
    val: { under: '#ece6d6', skirt: '#2e1612', skirtK: 'velvet', len: 'long', pants: '#2a1e18', boots: '#1a1210', highBoots: true, hats: ['kalpak', 'kalpak', 'nasal', 'nasal', 'nasal'], hatCol: '#3a1414', heavy: t => LAMELLAR(t >= 5 ? '#c8a050' : '#7a7e86'), shield: 'round', sword: 'saber', mus: '#1a1210', longMus: true, cloak: '#141014', plume: '#141414', bow: 'bow', coat: '#2a1e16' },
    ung: { under: '#e8e0cc', skirt: '#2e3a2c', len: 'tunic', pants: '#2e3a2c', boots: '#2a2a2e', hats: ['kettle', 'kettle', 'kettle', 'armet', 'armet'], heavy: t => STEEL(), plate: true, shield: 'heater', sword: 'sword', mus: '#5a3a1e', longMus: true, cloak: '#1a221a', plume: '#141414', bow: 'crossbow', pavise: true, coat: '#6a4a2a', tabard: true },
    pol: { under: '#f0eadc', skirt: '#4a4e54', len: 'tunic', pants: '#4a4e54', boots: '#2a2a2e', hats: ['bascinet', 'bascinet', 'sallet', 'sallet', 'sallet'], heavy: t => STEEL(), plate: true, shield: 'heater', sword: 'sword', mus: '#8a5a2a', cloak: '#d8d0c0', plume: '#f4f0e8', bow: 'crossbow', coat: '#5a4030', tabard: true },
    oto: { under: '#ece4d0', skirt: 'T', skirtK: 'velvet', len: 'robe', pants: '#e8e0cc', boots: '#6a3020', sash: '#e8d8a8', hats: ['turban', 'turban', 'cicak', 'cicak', 'cicak'], big: 1.25, heavy: t => MAIL(), shield: 'kalkan', sword: 'kilij', mus: '#1e140c', beard: '#1e140c', cloak: '#e8dcc0', bow: 'cbow', coat: '#5a3a26' },
    tat: { under: '#8a5a2a', underK: 'quilt', skirt: '#7a5030', skirtK: 'quilt', len: 'long', pants: '#4a3a2a', boots: '#2a1a10', hats: ['malakhai', 'malakhai', 'tathelm', 'tathelm', 'tathelm'], hatCol: '#5a3a1e', heavy: t => LAMELLAR(t >= 5 ? '#c8a050' : '#8a7a5a'), shield: 'small', sword: 'saber', mus: '#1a1210', cloak: '#3a2a1a', collar: '#5a3a1e', bow: 'cbow', coat: '#b08458', small: true }
  }[civ];
  const hatAt = i => L.hats[Math.max(0, Math.min(4, i))];
  const base0 = { skin: s, mustache: L.mus, longMus: L.longMus, beard: L.beard, boots: L.boots, highBoots: L.highBoots, pants: L.pants, legwrap: L.legwrap, len: L.len, hatCol: L.hatCol, big: L.big, skirt: L.skirt, skirtK: L.skirtK, sash: L.sash };
  // armura pe trepte: 2 zale, 3 zale + umeri, 4 armura grea a civilizației, 5 aceeași aurită + mantie
  const arm = t => t <= 1 ? {} : t === 2 ? { armor: MAIL() } : t === 3 ? { armor: MAIL(), pauldrons: STEEL() } :
    L.plate ? { armor: MAIL(), cuirass: t >= 5 ? cloth('#d8dde4', 'gold', 0.25, { metal: 0.95, env: 1.4 }) : STEEL(), pauldrons: STEEL(), gauntlet: STEEL() } : { armor: L.heavy(t), pauldrons: t >= 5 ? GOLD() : STEEL(), collar: L.collar };
  if (base === 'mil') return W(base0, arm(tier), { shirt: 'T', sleeve: tier >= 2 ? MAIL() : L.under, sleeveK: L.underK, vest: tier === 1 ? L.vest : null, vestK: L.vestK, belt: '#3a2414', hat: tier === 1 ? hatAt(0) : hatAt(tier), plume: tier >= 4 ? L.plume || '#e8e0d0' : null,
    weapon: tier >= 4 && L.plate && civ === 'ung' ? 'greatsword' : L.sword, shield: tier >= 2 && !(tier >= 4 && civ === 'ung') ? L.shield : null, cloak: tier >= 5 || (tier >= 4 && !L.plate) ? L.cloak : null, tabard: tier >= 3 && L.tabard ? 'T' : null });
  if (base === 'spr') return W(base0, tier >= 2 ? arm(tier) : {}, { shirt: L.under, shirtK: L.underK, vest: 'T', vestK: 'velvet', hat: hatAt(tier === 1 ? 0 : tier + 1), weapon: tier === 1 ? 'spear' : tier === 2 ? 'pike' : 'halberd', shield: tier === 1 && !L.pavise ? L.shield : null, backPavise: L.pavise && tier >= 2 ? 'T' : null, tabard: tier >= 3 && L.tabard ? 'T' : null });
  if (base === 'skr') return W(base0, { shirt: L.under, shirtK: L.underK, vest: 'T', hat: civ === 'oto' && tier >= 2 ? 'fez' : hatAt(0), weapon: 'javelin', javelins: true, shield: 'small', armor: tier >= 2 ? cloth('#7a5a3a', 'leather') : null });
  if (base === 'arc') { const xb = L.bow === 'crossbow' && tier >= 2; return W(base0, tier >= 3 ? { armor: civ === 'tat' || civ === 'val' ? L.heavy(3) : MAIL() } : {}, { shirt: 'T', sleeve: L.under, sleeveK: L.underK, belt: '#3a2414', hat: tier >= 2 ? hatAt(2) : hatAt(0), quiver: true, bow: xb ? null : L.bow === 'crossbow' ? 'bow' : L.bow, weapon: xb ? 'crossbow' : null, backPavise: L.pavise && tier >= 2 ? 'T' : null }); }
  if (base === 'gun') return W(base0, tier >= 2 ? { armor: cloth('#6a4a2a', 'leather') } : {}, { shirt: 'T', sleeve: L.under, belt: '#3a2414', hat: civ === 'oto' ? 'bork' : tier >= 2 ? hatAt(2) : hatAt(0), weapon: tier >= 2 ? 'musket' : 'gun' });
  const horseOf = t => ({ mounted: true, coat: t >= 3 && civ !== 'tat' ? '#e8e4dc' : L.coat, small: L.small, bridle: true });
  if (base === 'lcv') return W(base0, tier >= 2 ? { armor: tier >= 3 ? (L.plate ? MAIL() : L.heavy(3)) : cloth('#7a5a3a', 'leather') } : {}, horseOf(tier - 1), { shirt: 'T', sleeve: L.under, belt: '#3a2414', vest: tier === 1 ? L.vest : null, hat: tier >= 3 ? hatAt(2) : hatAt(0), weapon: civ === 'pol' || civ === 'ung' ? 'lance' : L.sword, shield: tier >= 2 ? L.shield : null, saddle: 'T', cape: tier >= 3 ? 'T' : null });
  if (base === 'kni') return W(base0, arm(tier + 2), horseOf(tier), { shirt: 'T', sleeve: MAIL(), hat: hatAt(tier + 2), plume: tier >= 2 ? L.plume || '#e8e0d0' : null, weapon: 'lance', shield: L.shield, saddle: 'T', cloak: !L.plate && tier >= 2 ? L.cloak : null,
    barding: L.plate && tier >= 2 ? team('velvet') : civ === 'tat' && tier >= 2 ? LAMELLAR('#8a7a5a') : null, cape: L.plate && tier >= 2 ? null : 'T', chanfron: tier >= 3, tabard: L.plate && tier >= 2 ? 'T' : null });
  if (base === 'har') return W(base0, tier >= 2 ? { armor: civ === 'tat' || civ === 'oto' || civ === 'val' ? L.heavy(3) : MAIL() } : {}, horseOf(1), { shirt: 'T', sleeve: L.under, hat: tier >= 2 ? hatAt(2) : hatAt(0), bow: L.bow === 'crossbow' ? 'cbow' : L.bow, quiver: true, saddle: 'T', small: true });
  return null;
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
function sitOnHorse(R) { R.hipL.rotation.set(-0.38, 0, 1.25); R.hipR.rotation.set(0.38, 0, 1.25); R.knL.rotation.z = -1.45; R.knR.rotation.z = -1.45; }
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

// ---------- corăbiile ----------
// coca: o cutie ascuțită la prova și la pupa, cu fundul îngust și capetele ridicate
function hull(len, wid, h, mat) {
  const g = new THREE.BoxGeometry(len, h, wid, 16, 2, 4), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = x / (len / 2);
    z *= (1 - Math.pow(Math.abs(t), 2.6) * 0.92) * (y < 0 ? 0.6 : 1);
    y += t * t * h * 0.7 + (y < 0 ? 0 : 0);
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return mesh(g, mat);
}
const SHIPSTYLE = {
  mol: { sail: 'square', hull: '#5a3e26', shields: 'round', trim: '#e8dcc0' }, val: { sail: 'square', hull: '#4a2e1e', shields: 'round', trim: '#8c1418' },
  ung: { sail: 'square', hull: '#7a5a3a', shields: 'heater', castles: true, trim: '#2e3a2c' }, pol: { sail: 'square', hull: '#6a4a30', shields: 'heater', castles: true, trim: '#f2ece0' },
  oto: { sail: 'lateen', hull: '#6a2a1a', stripe: '#2f7d4a', crescent: true, trim: '#d9ab3c' }, tat: { sail: 'lateen', hull: '#7a4a24', stripe: '#2a5a8a', crescent: true, trim: '#d8a640' }
};
function sailOn(S, st, x, h, w, y0) {
  const g = new THREE.Group(); at(g, x, y0, 0); S.root.add(g);
  g.add(at(cyl(0.012, 0.015, h, WOOD('#5a3a22'), 6), 0, h / 2, 0));
  if (st.sail === 'square') {
    g.add(at(box(0.012, 0.012, w * 1.1, WOOD('#5a3a22')), 0, h * 0.86, 0));
    const sg = new THREE.PlaneGeometry(w, h * 0.55, 6, 4), pp = sg.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.sin((pp.getX(i) / w + 0.5) * Math.PI) * 0.05);
    const sl = mesh(sg, team('linen', 0.9)); at(sl, 0.03, h * 0.57, 0, 0, Math.PI / 2, 0); g.add(sl);
  } else {
    const sh = new THREE.Shape(); sh.moveTo(-w * 0.55, h * 0.95); sh.lineTo(w * 0.55, h * 0.3); sh.lineTo(-w * 0.35, h * 0.22); sh.lineTo(-w * 0.55, h * 0.95);
    // vela latină (otomani, tătari): triunghi pe lungimea corăbiei, cu o vergă înclinată
    const sl = mesh(new THREE.ShapeGeometry(sh), team('linen', 0.9)); at(sl, 0, 0, 0.012); g.add(sl);
    const yard = cyl(0.008, 0.01, w * 1.3, WOOD('#5a3a22'), 5); at(yard, 0, h * 0.62, 0.012, 0, 0, -1.08); g.add(yard);
  }
  if (st.crescent) finialBall(g, 0, h, 0, true); else g.add(at(box(0.004, 0.04, 0.08, team('velvet')), 0, h + 0.01, 0.04));
  return g;
}
function finialBall(g, x, y, z, crescent) { g.add(at(sph(0.012, GOLD(), 6, 4), x, y + 0.01, z)); if (crescent) g.add(at(torus(0.022, 0.005, GOLD(), 4, 10, Math.PI * 1.4), x, y + 0.05, z, 0, 0, Math.PI * 0.8)); }
export function shipModel(vis, civ) {
  if (vis === 'gal1') vis = 'gal';
  const st = SHIPSTYLE[civ] || SHIPSTYLE.mol, S = { root: new THREE.Group(), oars: [] }, W = WOOD(st.hull), deck = WOOD('#8a6a48');
  const big = vis === 'gal2' ? 1.12 : 1;
  const L = { pesc: 0.46, gal: 0.95, gal2: 1.05, foc: 0.8, tra: 0.92 }[vis], Wd = { pesc: 0.17, gal: 0.22, gal2: 0.25, foc: 0.21, tra: 0.32 }[vis], Hh = vis === 'pesc' ? 0.09 : 0.13;
  const hl = hull(L, Wd, Hh, W); at(hl, 0, 0.03, 0); S.root.add(hl);
  S.root.add(at(box(L * 0.82, 0.012, Wd * 0.72, deck, 3), 0, 0.03 + Hh / 2 + 0.004, 0));
  if (st.stripe) S.root.add(at(box(L * 0.9, 0.025, Wd * 1.0, cloth(st.stripe, 'velvet')), 0, 0.03 + Hh * 0.18, 0)).children;
  // bordurile cu scuturi (moldoveni, munteni, unguri, polonezi)
  if (st.shields && (vis === 'gal' || vis === 'gal2' || vis === 'tra')) {
    const n = vis === 'tra' ? 4 : 5;
    [1, -1].forEach(sd => { for (let i = 0; i < n; i++) { const x = -L * 0.32 + i * L * 0.64 / (n - 1), z = sd * Wd * 0.47; let sh; if (st.shields === 'round') { sh = cyl(0.032, 0.032, 0.008, team('leather', 0.7), 12); sh.rotation.x = Math.PI / 2; } else sh = box(0.05, 0.06, 0.008, team('leather', 0.7)); at(sh, x, 0.03 + Hh * 0.62, z); if (st.shields === 'round') sh.rotation.set(Math.PI / 2, 0, 0); S.root.add(sh); } });
  }
  if (st.castles && vis !== 'pesc') { S.root.add(at(box(L * 0.2, 0.09, Wd * 0.8, W, 3), -L * 0.36, 0.03 + Hh / 2 + 0.05, 0)); S.root.add(at(box(L * 0.14, 0.07, Wd * 0.7, W, 3), L * 0.38, 0.03 + Hh / 2 + 0.06, 0)); }
  // vâslele galerelor
  if (vis === 'gal' || vis === 'gal2' || vis === 'foc') {
    const n = vis === 'foc' ? 4 : 6;
    [1, -1].forEach(sd => { for (let i = 0; i < n; i++) { const o = new THREE.Group(); at(o, -L * 0.3 + i * L * 0.6 / (n - 1), 0.03 + Hh * 0.35, sd * Wd * 0.48); const oar = box(0.012, 0.01, 0.2, WOOD('#7a5634')); at(oar, 0, -0.03, sd * 0.09, sd * 0.35, 0, 0); o.add(oar); S.root.add(o); S.oars.push([o, sd]); } });
  }
  const H = vis === 'pesc' ? 0.36 : vis === 'tra' ? 0.62 : 0.66 * big;
  sailOn(S, st, vis === 'pesc' ? 0.02 : 0.02, H, vis === 'pesc' ? 0.2 : vis === 'tra' ? 0.36 : 0.32 * big, 0.03 + Hh / 2);
  if (vis === 'gal2') sailOn(S, st, -L * 0.3, H * 0.7, 0.2, 0.03 + Hh / 2);
  if (vis === 'pesc') { const net = box(0.12, 0.004, 0.1, cloth('#3a3a30', 'stripes', 1)); at(net, -0.12, 0.09, 0.09, 0.4, 0, 0); S.root.add(net); S.root.add(at(cyl(0.012, 0.014, 0.06, cloth('#6a4a2a', 'wool'), 6), 0.1, 0.13, 0)); S.root.add(at(sph(0.013, SKINM('#d8a880'), 6, 4), 0.1, 0.175, 0)); }
  if (vis === 'tra') for (let i = 0; i < 4; i++) S.root.add(at(box(0.07, 0.06, 0.07, WOOD('#a08060')), -0.25 + i * 0.12, 0.03 + Hh / 2 + 0.04, (i % 2 - 0.5) * 0.12));
  if (vis === 'foc') { [[0.32, 0], [0.22, 0.06], [0.22, -0.06]].forEach(([x, z]) => { S.root.add(at(cyl(0.025, 0.018, 0.04, IRON(), 8), x, 0.12, z)); S.root.add(at(cone(0.022, 0.07, cloth('#ff8a2a', 'velvet', 0.6, { metal: 0 }), 8), x, 0.17, z)); }); }
  if (vis === 'gal' || vis === 'gal2' || vis === 'foc') S.root.add(at(cone(0.025, 0.09, DARKIRON(), 6), L * 0.53, 0.02, 0, 0, 0, -Math.PI / 2));
  S.reset = () => { S.root.position.set(0, 0, 0); S.root.rotation.x = 0; S.root.rotation.z = 0; S.oars.forEach(([o]) => o.rotation.set(0, 0, 0)); };
  const actions = [
    { name: 'idle', frames: 1, pose: () => {} },
    { name: 'walk', frames: 4, pose: t => { S.root.rotation.z = Math.sin(t * TAU) * 0.035; S.root.position.y = Math.sin(t * TAU * 2) * 0.006; S.oars.forEach(([o, sd]) => { o.rotation.y = Math.sin(t * TAU) * 0.5 * sd; o.rotation.x = Math.cos(t * TAU) * 0.15 * sd; }); } },
    { name: 'atk', frames: 4, loop: false, pose: t => { S.root.rotation.x = key([0, 0.06, 0.02, 0], t); } },
    { name: 'die', frames: 4, loop: false, pose: t => { const e = Math.min(1, t * 1.3); S.root.rotation.x = e * 0.5; S.root.rotation.z = e * 0.25; S.root.position.y = -e * 0.14; } }
  ];
  return { root: S.root, reset: S.reset, actions, cell: 'siege' };
}

// vânatul: cerb, mistreț, lup (scheletul calului, cu alte proporții); ultimul cadru din „die” e animalul doborât
function animalModel(kind) {
  const o = kind === 'deer' ? { coat: '#a8784a', mane: '#7a5634' } : kind === 'boar' ? { coat: '#3e3026', mane: '#1e1610' } : { coat: '#8a8a90', mane: '#4a4a50' };
  const H = horse(o), bone = BONE(), wrap = new THREE.Group(); wrap.add(H.root);
  if (kind === 'deer') {
    H.root.scale.set(0.72, 0.84, 0.6);
    [1, -1].forEach(sd => {
      const a = cyl(0.006, 0.009, 0.16, bone, 5); at(a, 0.11, 0.33, 0.03 * sd, sd * 0.35, 0, 0.45); H.neck.add(a);
      [0.05, 0.1].forEach((h, i) => { const tn = cyl(0.004, 0.006, 0.07, bone, 4); at(tn, 0.09 + i * 0.02, 0.32 + h, 0.04 * sd, sd * 0.5, 0, -0.3 + i * 0.4); H.neck.add(tn); });
    });
    H.body.add(at(sph(0.03, cloth('#f2ece0', 'fur', 1), 8, 6), -0.25, 0.02, 0));
  } else if (kind === 'boar') {
    H.root.scale.set(0.8, 0.5, 1.05);
    [1, -1].forEach(sd => { const tk = cone(0.008, 0.05, bone, 5); at(tk, 0.25, 0.13, 0.022 * sd, 0, 0, -0.6); H.neck.add(tk); });
    H.body.add(at(box(0.3, 0.05, 0.03, cloth('#1e1610', 'fur', 1)), 0.02, 0.09, 0));
    const hump = sph(0.11, cloth('#3e3026', 'fur', 1), 12, 8); hump.scale.set(1.4, 1.05, 1.0); at(hump, 0.08, 0.03, 0); H.body.add(hump);
  } else {
    H.root.scale.set(0.62, 0.6, 0.5);
    const tail = cone(0.035, 0.2, cloth('#6a6a70', 'fur', 1), 8); at(tail, -0.27, -0.02, 0, 0, 0, 2.2); H.body.add(tail);
  }
  const reset = () => H.reset(), off = { deer: 0, boar: -0.6, wolf: -0.55 }[kind];
  const actions = [
    { name: 'idle', frames: 1, pose: () => { H.neck.rotation.z = kind === 'deer' ? -0.6 : off; } },
    { name: 'walk', frames: 6, pose: t => { gallop(H, t * TAU, kind === 'boar' ? 0.45 : 0.6); H.neck.rotation.z += off; } },
    { name: 'atk', frames: 4, loop: false, pose: t => { H.neck.rotation.z = key([0, -0.5, 0.25, 0], t) + off; H.body.rotation.z = key([0, 0.12, -0.15, 0], t); } },
    { name: 'die', frames: 4, loop: false, pose: t => { const e = Math.min(1, t * 1.35); H.neck.rotation.z = off; H.root.rotation.x = e * 1.45; H.root.position.y = e * 0.03; ['FL', 'FR', 'BL', 'BR'].forEach(n => H['hip' + n].rotation.z = (n[0] === 'F' ? 0.5 : -0.5) * e); } }
  ];
  return { root: wrap, reset, actions, cell: 'cav' };
}

// { root, reset, actions, cell } pentru o imagine de unitate (vis = vil, mil3, hero, raz...)
export function unitModel(vis, civ) {
  if (vis === 'deer' || vis === 'boar' || vis === 'wolf') return animalModel(vis);
  if (/^(pesc|gal1|gal2|foc|tra)$/.test(vis)) return shipModel(vis, civ);
  if (/^(ram|cat|can|treb|car)/.test(vis)) {
    const S = siege(vis, civ);
    const actions = [
      { name: 'idle', frames: 1, pose: () => {} },
      { name: 'walk', frames: 4, pose: t => { if (S.walk) S.walk(t); else S.wheels.forEach(w => w.rotation.z = -t * TAU / 3); } },
      { name: 'atk', frames: vis === 'treb' || /^cat/.test(vis) ? 5 : 4, loop: false, pose: t => { if (S.atk) S.atk(t); } },
      { name: 'die', frames: 1, loop: false, pose: () => { S.root.rotation.x = 0.25; S.root.position.y = -0.02; } }
    ];
    return { root: S.root, reset: S.reset, actions, cell: 'siege' };
  }
  const o = outfit(vis, civ);
  const R = human(o);
  const gun = o.weapon === 'gun' || o.weapon === 'musket', xbow = o.weapon === 'crossbow';
  if (o.mounted) {
    const H = horse(o);
    const wrap = new THREE.Group(); wrap.add(H.root); H.root.add(R.root);
    const sc = o.small ? 0.88 : 1; R.root.scale.setScalar(1 / sc);
    const ry = (0.2 - (1 - sc) * 0.43) / sc;
    const reset = () => { H.reset(); R.reset(); R.root.position.set(-0.02, ry, 0); sitOnHorse(R); };
    const swing = t => { R.shR.rotation.z = key([0.6, 2.3, 2.7, 1.0, 0.3], t); R.elR.rotation.z = key([0.3, 0.9, 0.5, 0.1, 0.2], t); R.torso.rotation.y = key([0, 0.2, 0.25, -0.2, -0.1], t); };
    const thrust = t => { R.shR.rotation.z = key([0.5, 0.4, 0.9, 1.25, 0.9], t); R.elR.rotation.z = key([1.0, 1.2, 0.5, 0.1, 0.6], t); R.torso.rotation.z = -key([0, -0.05, 0.1, 0.2, 0.05], t); };
    const shoot = t => { R.shL.rotation.set(0, 0, 1.45); R.elL.rotation.z = 0.05; R.shR.rotation.z = key([1.3, 1.38, 1.4, 1.3, 1.1], t); R.shR.rotation.x = 0.1; R.elR.rotation.z = key([1.6, 2.3, 2.55, 2.55, 0.9], t); R.torso.rotation.y = 0.35; };
    const actions = [
      { name: 'idle', frames: 1, pose: () => { H.neck.rotation.z = -0.15; } },
      { name: 'walk', frames: 6, pose: t => { gallop(H, t * TAU); R.root.position.y = ry + Math.abs(Math.sin(t * TAU)) * 0.015; } },
      { name: 'atk', frames: 5, loop: false, pose: t => { (o.bow ? shoot : o.weapon === 'lance' ? thrust : swing)(t); H.neck.rotation.z = -0.1; } },
      { name: 'die', frames: 4, loop: false, pose: t => { const e = Math.min(1, t * 1.35); H.root.rotation.x = e * 1.35; H.root.position.y = e * 0.02; R.root.rotation.z = e * 0.5; ['FL', 'FR', 'BL', 'BR'].forEach(n => H['hip' + n].rotation.z = (n[0] === 'F' ? 0.6 : -0.6) * e); } }
    ];
    return { root: wrap, reset, actions, cell: 'cav' };
  }
  const reset = () => R.reset();
  const swing = t => { R.shR.rotation.z = key([0.6, 2.3, 2.75, 1.1, 0.3], t); R.elR.rotation.z = key([0.3, 0.9, 0.55, 0.15, 0.2], t); R.torso.rotation.y = key([0, 0.22, 0.28, -0.18, -0.12], t); R.torso.rotation.z = -key([0, -0.05, 0, 0.15, 0.12], t); R.hipL.rotation.z = 0.25; R.hipR.rotation.z = -0.2; R.knR.rotation.z = -0.15; };
  const big = t => { R.shR.rotation.z = key([0.8, 2.6, 2.9, 1.2, 0.5], t); R.shL.rotation.z = key([0.8, 2.6, 2.9, 1.2, 0.5], t); R.elR.rotation.z = R.elL.rotation.z = key([0.4, 0.8, 0.4, 0.1, 0.3], t); R.torso.rotation.z = -key([0, -0.08, 0, 0.2, 0.15], t); R.hipL.rotation.z = 0.3; R.hipR.rotation.z = -0.25; };
  const thrust = t => { R.weapon.rotation.z = Math.PI / 2; R.shR.rotation.z = key([0.9, 0.75, 1.15, 1.55, 1.3], t); R.elR.rotation.z = key([1.25, 1.5, 0.6, 0.05, 0.4], t); R.torso.rotation.z = -key([0, -0.05, 0.12, 0.24, 0.1], t); R.hipL.rotation.z = 0.35; R.hipR.rotation.z = -0.25; R.knR.rotation.z = -0.2; };
  const shoot = t => { R.shL.rotation.set(0, 0, 1.45); R.elL.rotation.z = 0.05; R.shR.rotation.z = key([1.3, 1.38, 1.4, 1.3, 1.1], t); R.shR.rotation.x = 0.1; R.elR.rotation.z = key([1.6, 2.3, 2.55, 2.55, 0.9], t); R.torso.rotation.y = 0.25; R.hipL.rotation.z = 0.2; R.hipR.rotation.z = -0.2; };
  const aim = t => { R.shR.rotation.z = 1.35; R.elR.rotation.z = key([0.4, 0.3, 0.3, 0.6, 0.4], t); R.shL.rotation.set(-0.2, 0, 1.25); R.elL.rotation.z = 0.5; R.torso.rotation.z = -key([0.05, 0.05, 0.05, -0.08, 0], t); R.hipL.rotation.z = 0.3; R.hipR.rotation.z = -0.2; R.weapon.rotation.z = 0.05; };
  const thrw = t => { R.shR.rotation.z = key([2.4, 2.9, 2.0, 0.9, 0.6], t); R.elR.rotation.z = key([1.2, 1.3, 0.5, 0.1, 0.2], t); R.torso.rotation.y = key([-0.3, -0.35, 0.1, 0.3, 0.1], t); R.hipL.rotation.z = 0.3; R.hipR.rotation.z = -0.25; R.weapon.visible = t < 0.55; };
  const heal = t => { R.shL.rotation.z = key([1.6, 2.4, 2.6, 2.4, 1.6], t); R.shR.rotation.z = key([1.6, 2.4, 2.6, 2.4, 1.6], t); R.elL.rotation.z = R.elR.rotation.z = 0.3; R.head.rotation.z = key([0, 0.15, 0.25, 0.15, 0], t); };
  const work = (toolName, sh, el, lean, both) => t => {
    R.tools[toolName].visible = true;
    R.shR.rotation.z = key(sh, t); R.elR.rotation.z = key(el, t);
    if (both) { R.shL.rotation.z = key(sh, t); R.elL.rotation.z = key(el, t); R.shL.rotation.x = 0.4; R.shR.rotation.x = -0.4; }
    R.torso.rotation.z = -key(lean, t);
    R.hipL.rotation.z = 0.22; R.hipR.rotation.z = -0.15; R.knL.rotation.z = -0.15; R.knR.rotation.z = -0.25;
  };
  const die = t => { const e = Math.min(1, t * 1.35), s2 = e * e * (3 - 2 * e); R.root.rotation.z = s2 * 1.5; R.root.position.y = s2 * 0.02; R.shL.rotation.z = -s2 * 0.9; R.shR.rotation.z = -s2 * 0.7; R.knL.rotation.z = -s2 * 0.5; R.hipL.rotation.z = s2 * 0.4; };
  const long = o.weapon === 'spear' || o.weapon === 'pike' || o.weapon === 'halberd';
  const actions = [
    { name: 'idle', frames: 1, pose: () => {} },
    { name: 'walk', frames: 6, pose: t => { const a = t * TAU; walkLegs(R, a); if (!o.shield && !o.bow && !gun) R.shL.rotation.z = -0.4 * Math.sin(a); if (!gun && !xbow) { if (long) { R.shR.rotation.z = 0.05; R.elR.rotation.z = 0.6; R.weapon.rotation.z = -0.5; } else { R.shR.rotation.z = 0.4 * Math.sin(a); R.elR.rotation.z = 0.3; } } } }
  ];
  if (vis === 'vil' || vis === 'vilf') {
    actions.push(
      { name: 'axe', frames: 5, pose: work('axe', [2.7, 2.95, 1.9, 0.75, 0.55], [0.6, 0.35, 0.15, 0.1, 0.25], [-0.05, -0.08, 0.12, 0.38, 0.4], true) },
      { name: 'pick', frames: 5, pose: work('pick', [2.3, 2.5, 1.6, 0.8, 0.6], [0.5, 0.3, 0.15, 0.1, 0.25], [0, 0, 0.18, 0.42, 0.45], true) },
      { name: 'hammer', frames: 5, pose: work('hammer', [1.5, 2.3, 1.8, 0.85, 0.7], [1.0, 1.6, 1.1, 0.3, 0.4], [0.25, 0.22, 0.28, 0.34, 0.3], false) },
      { name: 'sickle', frames: 5, pose: t => { work('sickle', [0.5, 0.85, 1.15, 0.9, 0.55], [0.6, 0.4, 0.2, 0.3, 0.5], [0.55, 0.6, 0.62, 0.6, 0.55], false)(t); R.shR.rotation.x = key([-0.4, -0.1, 0.3, 0.5, 0.1], t); R.hips.position.y = 0.26; R.hipL.rotation.z = 0.5; R.hipR.rotation.z = 0.3; R.knL.rotation.z = -0.7; R.knR.rotation.z = -0.6; } }
    );
  } else if (o.heal) actions.push({ name: 'atk', frames: 5, loop: false, pose: heal });
  else if (o.bow) actions.push({ name: 'atk', frames: 5, loop: false, pose: shoot });
  else if (gun || xbow) actions.push({ name: 'atk', frames: 5, loop: false, pose: aim });
  else if (o.weapon === 'javelin') actions.push({ name: 'atk', frames: 5, loop: false, pose: thrw });
  else if (o.weapon === 'greatsword') actions.push({ name: 'atk', frames: 5, loop: false, pose: big });
  else actions.push({ name: 'atk', frames: 5, loop: false, pose: long ? thrust : swing });
  actions.push({ name: 'die', frames: 4, loop: false, pose: die });
  return { root: R.root, reset, actions, cell: 'foot' };
}
