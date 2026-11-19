// Piesele clădirilor v2: geometrie (cutii, acoperișuri, cupole, ferestre) și trusa de stil a fiecărei civilizații.
// Amprenta unei clădiri de n pătrățele e [0,n] x [0,n] pe x și z; camera vede fețele +x (dreapta) și +z (stânga).
import { THREE } from './core.js';
import { TM, PM, cloth, team, canvasTex, rng } from './mats.js';
export { THREE, TM, PM, cloth, team };

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TMBC = {};
export function TMb(name, tint, f, rough = 0.92, ns = 1) { const k = name + tint + f + rough + ns; if (!TMBC[k]) { const m = TM(name, tint, rough, ns).clone(); m.color.multiplyScalar(f); TMBC[k] = m; } return TMBC[k]; }
export function mesh(g, m) { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
export function at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }
// cutie cu textura la aceeași densitate pe toate fețele
export function box(w, h, d, m, s = 1) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * s, uv.getY(k) * dims[f][1] * s); }
  return mesh(g, m);
}
export function blk(x0, z0, x1, z1, y0, h, m, s) { return at(box(x1 - x0, h, z1 - z0, m, s), (x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); }
export function cyl(rt, rb, h, m, seg = 20, s = 1, open = false, ts, tl) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), uv = g.attributes.uv, circ = Math.PI * 2 * Math.max(rt, rb);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ * s, uv.getY(i) * h * s);
  return mesh(g, m);
}
export function cone(r, h, m, seg = 20, s = 1) {
  const g = new THREE.ConeGeometry(r, h, seg, 4), uv = g.attributes.uv, sl = Math.hypot(r, h);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r * s, uv.getY(i) * sl * s);
  return mesh(g, m);
}
export function dome(r, m, seg = 24, sy = 1) { const d = mesh(new THREE.SphereGeometry(r, seg, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); d.scale.y = sy; return d; }
export function lathe(pts, m, seg = 20) { return mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), m); }
export function sph(r, m, ws = 12, hs = 8) { return mesh(new THREE.SphereGeometry(r, ws, hs), m); }
// poligoane plane (pante, frontoane), cu UV pe planul fiecăruia
export function polys(list, m, s = 1) {
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
// acoperiș în patru ape; pe un pătrat iese piramidă
export function hipRoof(x0, z0, x1, z1, y, h, m, s = 1.4) {
  const w = x1 - x0, d = z1 - z0, A = V(x0, y, z0), B = V(x1, y, z0), C = V(x1, y, z1), D = V(x0, y, z1);
  let R0, R1;
  if (w >= d) { R0 = V(x0 + d / 2, y + h, (z0 + z1) / 2); R1 = V(x1 - d / 2, y + h, (z0 + z1) / 2); }
  else { R0 = V((x0 + x1) / 2, y + h, z0 + w / 2); R1 = V((x0 + x1) / 2, y + h, z1 - w / 2); }
  const list = w >= d ? [[B, A, R0, R1], [D, C, R1, R0], [A, D, R0], [C, B, R1]] : [[B, A, R0], [D, C, R1], [A, D, R1, R0], [C, B, R0, R1]];
  return polys(list, m, s);
}
// acoperiș în două ape cu streașină e; frontoanele (pereții de capăt) stau pe zidul [x0,x1]x[z0,z1]
export function gableRoof(x0, z0, x1, z1, y, h, m, alongX, wallM, e = 0.08, s = 1.4) {
  const g = new THREE.Group();
  if (alongX) {
    const zm = (z0 + z1) / 2, hd = (z1 - z0) / 2 + e, sl = h / hd, yw = y + sl * e;
    const R0 = V(x0 - e, y + h, zm), R1 = V(x1 + e, y + h, zm);
    g.add(polys([[V(x1 + e, y, z0 - e), V(x0 - e, y, z0 - e), R0, R1], [V(x0 - e, y, z1 + e), V(x1 + e, y, z1 + e), R1, R0]], m, s));
    if (wallM) g.add(polys([[V(x0, y, z0), V(x0, y, z1), V(x0, yw, z1), V(x0, y + h - 0.02, zm), V(x0, yw, z0)], [V(x1, y, z1), V(x1, y, z0), V(x1, yw, z0), V(x1, y + h - 0.02, zm), V(x1, yw, z1)]], wallM, 1.2));
  } else {
    const xm = (x0 + x1) / 2, hd = (x1 - x0) / 2 + e, sl = h / hd, yw = y + sl * e;
    const R0 = V(xm, y + h, z0 - e), R1 = V(xm, y + h, z1 + e);
    g.add(polys([[V(x0 - e, y, z0 - e), V(x0 - e, y, z1 + e), R1, R0], [V(x1 + e, y, z1 + e), V(x1 + e, y, z0 - e), R0, R1]], m, s));
    if (wallM) g.add(polys([[V(x1, y, z0), V(x0, y, z0), V(x0, yw, z0), V(xm, y + h - 0.02, z0), V(x1, yw, z0)], [V(x0, y, z1), V(x1, y, z1), V(x1, yw, z1), V(xm, y + h - 0.02, z1), V(x0, yw, z1)]], wallM, 1.2));
  }
  return g;
}
// fronton în trepte (gotic de cărămidă), pe capătul dinspre +x (sau +z) al unui acoperiș în două ape
export function stepGable(g, M, face, fixed, a, b, y, h, steps = 4, t = 0.06) {
  const dz = (b - a) / (2 * steps + 1), hs = h / steps;
  for (let i = 0; i < steps; i++) {
    const a1 = a + i * dz, b1 = b - i * dz, y0 = y + i * hs, hh = hs * 1.05 + (i === steps - 1 ? 0.06 : 0.02);
    if (face === 'x') g.add(at(box(t, hh, b1 - a1, M, 1.6), fixed - t / 2 + 0.01, y0 + hh / 2, (a1 + b1) / 2));
    else g.add(at(box(b1 - a1, hh, t, M, 1.6), (a1 + b1) / 2, y0 + hh / 2, fixed - t / 2 + 0.01));
  }
}
// deschideri pe fața +z (planul z = fixed) sau +x (planul x = fixed)
function onFace(g, face, o, c, y, fixed, off = 0.006) { if (face === 'z') at(o, c, y, fixed + off); else at(o, fixed + off, y, c, 0, Math.PI / 2, 0); g.add(o); return o; }
function flat(w, h, m) { return mesh(new THREE.PlaneGeometry(w, h), m); }
// stil: rect | arch | lancet | slit
// sticla ferestrelor: aceeași culoare, dar marcată ca să se aprindă noaptea
const WINM = {};
export function winM(hex, lit = true) { const k = hex + lit; if (!WINM[k]) { const m = PM(hex, 0.9).clone(); if (lit) m.userData = { win: true }; WINM[k] = m; } return WINM[k]; }
export function win(g, face, a, b, fixed, y0, y1, o = {}) {
  const st = o.style || 'rect', w = b - a, c = (a + b) / 2, col = winM(o.col || '#1e1812', o.lit !== false), fr = o.frame ? PM(o.frame, 0.8) : null;
  const top = st === 'rect' || st === 'slit' ? y1 : y1 - w / 2;
  onFace(g, face, flat(w, top - y0, col), c, (y0 + top) / 2, fixed);
  if (st === 'arch') onFace(g, face, mesh(new THREE.CircleGeometry(w / 2, 10, 0, Math.PI), col), c, top, fixed);
  if (st === 'lancet') { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.quadraticCurveTo(w / 2, w * 0.5, 0, w * 0.95); s.quadraticCurveTo(-w / 2, w * 0.5, -w / 2, 0); onFace(g, face, mesh(new THREE.ShapeGeometry(s), col), c, top, fixed); }
  if (fr) {
    onFace(g, face, box(w + 0.03, 0.02, 0.02, fr), c, y0 - 0.005, fixed, 0.01);
    if (st === 'rect') onFace(g, face, box(w + 0.03, 0.02, 0.02, fr), c, y1 + 0.005, fixed, 0.01);
    if (st === 'arch') { const ar = mesh(new THREE.TorusGeometry(w / 2 + 0.008, 0.012, 4, 10, Math.PI), fr); onFace(g, face, ar, c, top, fixed, 0.01); }
  }
  if (o.shut) [c - w * 0.78, c + w * 0.78].forEach(x => onFace(g, face, box(w * 0.52, top - y0, 0.012, PM(o.shut, 0.75)), x, (y0 + top) / 2, fixed, 0.012));
  if (o.bars) for (let i = 1; i < 3; i++) onFace(g, face, box(0.008, top - y0, 0.01, PM(o.bars, 0.7)), a + w * i / 3, (y0 + top) / 2, fixed, 0.01);
}
export function door(g, face, a, b, fixed, h, o = {}) {
  win(g, face, a, b, fixed, o.y0 || 0, h, { style: o.style || 'rect', col: o.col || '#3a2414', frame: o.frame, lit: false });
  if (o.planks !== false) { const w = b - a; for (let i = 1; i < 3; i++) onFace(g, face, box(0.006, (o.style === 'arch' ? h - w / 2 : h) - (o.y0 || 0), 0.008, PM('#1a1008', 0.9)), a + w * i / 3, ((o.y0 || 0) + (o.style === 'arch' ? h - w / 2 : h)) / 2, fixed, 0.009); }
}
// steag pe catarg, culoarea echipei
export function flag(g, x, y, z, h, w = 0.16, pole = '#4a3a2a') {
  const pl = at(mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), PM(pole, 0.8)), x, y + h / 2, z); pl.castShadow = false; g.add(pl);
  const shp = new THREE.PlaneGeometry(w, w * 0.62, 6, 1), p = shp.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w + 0.5) * 3) * 0.015);
  const fl = at(mesh(shp, team('velvet', 0.8)), x + w / 2 * 0.707, y + h - w * 0.32, z - w / 2 * 0.707, 0, Math.PI / 4, 0); fl.castShadow = false; g.add(fl);
  g.add(at(sph(0.014, PM('#d9ab3c', 0.3, 0.9)), x, y + h + 0.01, z));
}
// stindard atârnat pe un perete (culoarea echipei), cu vârf în coadă de rândunică
export function banner(g, face, c, fixed, ytop, w = 0.14, h = 0.3, emblem) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, -h); s.lineTo(0, -h * 0.82); s.lineTo(-w / 2, -h); s.lineTo(-w / 2, 0);
  onFace(g, face, mesh(new THREE.ShapeGeometry(s), team('velvet', 0.8)), c, ytop, fixed, 0.014);
  onFace(g, face, box(w + 0.04, 0.012, 0.012, PM('#3a2a1a', 0.8)), c, ytop + 0.006, fixed, 0.02);
  if (emblem) onFace(g, face, mesh(new THREE.CircleGeometry(w * 0.26, 12), PM(emblem, 0.6)), c, ytop - h * 0.4, fixed, 0.018);
}
export function crenels(g, x0, z0, x1, z1, y, m, step = 0.14, hh = 0.07) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(len / step));
  for (let i = 0; i < n; i += 2) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    g.add(at(box(Math.abs(x1 - x0) > 0.01 ? len / n : 0.1, hh, Math.abs(z1 - z0) > 0.01 ? len / n : 0.1, m, 1.5), x, y + hh / 2, z));
  }
}
export function ringCrenels(g, cx, cz, r, y, m, n = 12, s = 0.07) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.add(at(box(s, s, s, m, 1.5), cx + Math.cos(a) * r, y + s / 2, cz + Math.sin(a) * r, 0, -a, 0)); }
}
export function logPile(g, x, z, n, len = 0.42, alongZ) {
  const L = TM('medieval_wood', '#b08060'), E = PM('#c49a64', 0.8);
  for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) {
    const off = (i - (n - r - 1) / 2) * 0.09, y = 0.045 + r * 0.078;
    if (alongZ) { g.add(at(cyl(0.045, 0.045, len, L, 10, 2), x + off, y, z, Math.PI / 2)); g.add(at(mesh(new THREE.CircleGeometry(0.043, 12), E), x + off, y, z + len / 2 + 0.001)); }
    else { g.add(at(cyl(0.045, 0.045, len, L, 10, 2), x, y, z + off, 0, 0, Math.PI / 2)); g.add(at(mesh(new THREE.CircleGeometry(0.043, 12), E), x + len / 2 + 0.001, y, z + off, 0, Math.PI / 2, 0)); }
  }
}
// petic de pământ bătătorit sub clădire (transparent pe margini; nu intră în mască)
export function ground(g, x0, z0, x1, z1, name = 'dirt', tint = '#e8d2b0') {
  const m = TM(name, tint, 1).clone();
  const ac = document.createElement('canvas'); ac.width = ac.height = 128; const cx = ac.getContext('2d');
  const gr = cx.createRadialGradient(64, 64, 30, 64, 64, 66); gr.addColorStop(0, '#fff'); gr.addColorStop(0.75, '#bbb'); gr.addColorStop(1, '#000');
  cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
  m.alphaMap = new THREE.CanvasTexture(ac); m.transparent = true; m.depthWrite = false;
  m.map = m.map.clone(); m.map.repeat.set(x1 - x0, z1 - z0); m.map.needsUpdate = true;
  if (m.normalMap) { m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(x1 - x0, z1 - z0); m.normalMap.needsUpdate = true; }
  const p = mesh(new THREE.PlaneGeometry(x1 - x0 + 0.3, z1 - z0 + 0.3), m); at(p, (x0 + x1) / 2, 0.003, (z0 + z1) / 2, -Math.PI / 2);
  p.castShadow = false; g.add(p);
}
// bârnele unei case cu schelet de lemn, pe o față
export function timberFace(g, face, a, b, fixed, y0, y1, M, diag = true) {
  const n = Math.max(2, Math.round((b - a) / 0.22)), w = (b - a) / n, t = 0.024;
  for (let i = 0; i <= n; i++) onFace(g, face, box(t, y1 - y0, 0.014, M), a + i * w, (y0 + y1) / 2, fixed, 0.008);
  [y0 + 0.01, (y0 + y1) / 2, y1 - 0.01].forEach(y => onFace(g, face, box(b - a, t, 0.014, M), (a + b) / 2, y, fixed, 0.009));
  if (diag) for (let i = 0; i < n; i += 2) { const L = Math.hypot(w, (y1 - y0) / 2), ang = Math.atan2((y1 - y0) / 2, w) * (i % 4 ? 1 : -1); const d = box(L, t, 0.014, M); onFace(g, face, d, a + (i + 0.5) * w, y0 + (y1 - y0) * 0.25, fixed, 0.01); if (face === 'z') d.rotation.z = ang; else d.rotateZ(ang); }
}
// benzi alternante (cărămidă și piatră) pe un zid
export function banded(g, x0, z0, x1, z1, y0, h, A, B, band = 0.06) {
  let y = y0, i = 0;
  while (y < y0 + h - 0.001) { const hh = Math.min(i % 2 ? band * 0.7 : band * 1.4, y0 + h - y); g.add(blk(x0, z0, x1, z1, y, hh, i % 2 ? B : A, 1.6)); y += hh; i++; }
}
// stâlp cu streașină: pridvor (prispă) pe fața +z
export function posts(g, xs, z, h, M, r = 0.022) { xs.forEach(x => g.add(at(cyl(r, r, h, M, 8), x, h / 2, z))); }
// minaret: fus subțire, balcon, con de plumb, semilună de aur
export function minaret(g, x, z, h, M, capM, o = {}) {
  const r = o.r || 0.08, gold = PM('#d9ab3c', 0.3, 0.9);
  g.add(at(cyl(r * 1.25, r * 1.35, 0.2, M, 12, 2), x, 0.1, z));
  g.add(at(cyl(r, r * 1.12, h * 0.78, M, 14, 2), x, 0.2 + h * 0.39, z));
  const by = 0.2 + h * 0.74; g.add(at(cyl(r * 1.7, r * 1.05, 0.06, M, 14, 2), x, by, z)); g.add(at(cyl(r * 1.75, r * 1.75, 0.035, PM('#d8d0c0', 0.8), 14), x, by + 0.045, z, 0, 0, 0));
  g.add(at(cyl(r * 0.86, r * 0.92, h * 0.16, M, 14, 2), x, 0.2 + h * 0.86, z));
  const ch = o.capH || r * 4.5; g.add(at(cone(r * 1.02, ch, capM, 14), x, 0.2 + h * 0.94 + ch / 2, z));
  const ty = 0.2 + h * 0.94 + ch; g.add(at(cyl(0.006, 0.006, 0.07, gold, 5), x, ty + 0.03, z)); g.add(at(mesh(new THREE.TorusGeometry(0.022, 0.006, 4, 10, Math.PI * 1.4), gold), x, ty + 0.08, z, 0, Math.PI / 4, Math.PI * 0.8));
  return ty + 0.1;
}
// semilună (alem) sau cruce în vârf
export function finial(g, x, y, z, kind = 'cross', s = 1) {
  const gold = PM('#d9ab3c', 0.3, 0.9);
  if (kind === 'cross') { g.add(at(box(0.016 * s, 0.16 * s, 0.016 * s, gold), x, y + 0.08 * s, z)); g.add(at(box(0.09 * s, 0.016 * s, 0.016 * s, gold), x, y + 0.11 * s, z, 0, Math.PI / 4, 0)); }
  else if (kind === 'crescent') { g.add(at(cyl(0.006, 0.006, 0.08 * s, gold, 5), x, y + 0.04 * s, z)); g.add(at(mesh(new THREE.TorusGeometry(0.03 * s, 0.008 * s, 4, 10, Math.PI * 1.4), gold), x, y + 0.1 * s, z, 0, Math.PI / 4, Math.PI * 0.8)); }
  else if (kind === 'ball') { g.add(at(cyl(0.006, 0.006, 0.07 * s, gold, 5), x, y + 0.035 * s, z)); g.add(at(sph(0.025 * s, gold), x, y + 0.08 * s, z)); }
  else if (kind === 'spike') g.add(at(cone(0.012 * s, 0.14 * s, gold, 6), x, y + 0.07 * s, z));
}
// iurtă: perete de pâslă, acoperiș bombat, bandă în culoarea echipei, ușă pictată spre cameră
export function yurt(g, x, z, r, o = {}) {
  const hw = o.hw || r * 0.5, hr = o.hr || r * 0.55, felt = cloth(o.felt || '#efe6d2', 'felt', 0.98), roofF = cloth(o.roof || '#e8dcc4', 'felt', 0.98);
  g.add(at(cyl(r, r * 1.02, hw, felt, 28, 1, false), x, hw / 2, z));
  g.add(at(lathe([[r + 0.035, 0], [r * 0.82, hr * 0.42], [r * 0.52, hr * 0.8], [r * 0.2, hr * 0.98], [0.001, hr]], roofF, 28), x, hw - 0.005, z));
  g.add(at(cyl(r + 0.006, r + 0.006, hw * 0.24, team('felt', 0.9), 28, 1, true), x, hw * 0.66, z));
  [0.2, 0.92].forEach(f => g.add(at(mesh(new THREE.TorusGeometry(r + 0.009, 0.008, 4, 28), PM('#6a4a2a', 0.9)), x, hw * f, z, Math.PI / 2)));
  g.add(at(mesh(new THREE.TorusGeometry(r * 0.2, 0.018, 6, 16), PM(o.crown || '#c8962a', 0.4, 0.6)), x, hw + hr * 0.97, z, Math.PI / 2));
  if (o.top) finial(g, x, hw + hr, z, o.top, 1.2);
  const a = Math.PI / 4, dx = Math.cos(a) * r, dz = Math.sin(a) * r, dw = Math.min(0.2, r * 0.45);
  const d = box(dw, hw * 0.86, 0.03, PM(o.door || '#b0402a', 0.7)); at(d, x + dx, hw * 0.43, z + dz, 0, Math.PI / 4, 0); g.add(d);
  const fr = box(dw + 0.04, 0.03, 0.04, PM('#d8a640', 0.6)); at(fr, x + dx, hw * 0.88, z + dz, 0, Math.PI / 4, 0); g.add(fr);
  return hw + hr;
}
// cort în dungi (culoarea echipei alternând cu alb)
export function tentStriped(g, x, z, r, hw, hr, n = 12, cream = '#efe6d0') {
  const T = team('linen', 0.9), W = cloth(cream, 'linen', 0.95);
  for (let i = 0; i < n; i++) {
    const m = i % 2 ? T : W, ts = i / n * Math.PI * 2, tl = Math.PI * 2 / n;
    g.add(at(mesh(new THREE.CylinderGeometry(r, r, hw, 3, 1, true, ts, tl), m), x, hw / 2, z));
    g.add(at(mesh(new THREE.ConeGeometry(r * 1.08, hr, 3, 1, true, ts, tl), m), x, hw + hr / 2, z));
  }
  g.add(at(cyl(0.008, 0.008, 0.2, PM('#4a3a2a'), 5), x, hw + hr + 0.08, z)); g.add(at(sph(0.02, PM('#d9ab3c', 0.3, 0.9)), x, hw + hr + 0.18, z));
  const a = Math.PI / 4; g.add(at(box(r * 0.5, hw * 0.9, 0.02, PM('#3a1a10', 0.9)), x + Math.cos(a) * r, hw * 0.45, z + Math.sin(a) * r, 0, Math.PI / 4, 0));
}
// covor cu model (romb central, chenar)
const carpets = {};
export function carpetMat(seed) {
  if (carpets[seed]) return carpets[seed];
  const P = [['#8a1c1c', '#1c2a5a', '#e8d8b0', '#c8902a'], ['#1c3a6a', '#8a1c1c', '#efe2c0', '#2a6a3a'], ['#6a1c3a', '#e0b050', '#f0e6d0', '#1c1c2a']][seed % 3];
  const t = canvasTex(128, 192, (c, w, h, R) => {
    c.fillStyle = P[0]; c.fillRect(0, 0, w, h); c.fillStyle = P[1]; c.fillRect(10, 10, w - 20, h - 20); c.fillStyle = P[0]; c.fillRect(18, 18, w - 36, h - 36);
    c.fillStyle = P[2]; c.beginPath(); c.moveTo(w / 2, 34); c.lineTo(w - 30, h / 2); c.lineTo(w / 2, h - 34); c.lineTo(30, h / 2); c.fill();
    c.fillStyle = P[3]; c.beginPath(); c.moveTo(w / 2, 58); c.lineTo(w - 46, h / 2); c.lineTo(w / 2, h - 58); c.lineTo(46, h / 2); c.fill();
    c.fillStyle = P[1]; for (let i = 0; i < 6; i++) { c.fillRect(13, 14 + i * 30, 5, 5); c.fillRect(w - 18, 14 + i * 30, 5, 5); }
    for (let i = 0; i < 900; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'; c.fillRect(R() * w, R() * h, 2, 2); }
  }, 40 + seed);
  return (carpets[seed] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.98, side: THREE.DoubleSide }));
}
export function carpet(g, x, z, w, d, rot = 0, seed = 0, y = 0.006) { const c = mesh(new THREE.PlaneGeometry(w, d), carpetMat(seed)); c.castShadow = false; at(c, x, y, z, -Math.PI / 2, 0, rot); g.add(c); return c; }
// stindardul tătar (tug): prăjină, bilă de aur, coadă de cal, fanion
export function tug(g, x, z, h = 0.8) {
  g.add(at(cyl(0.01, 0.012, h, PM('#3a2a1a', 0.8), 6), x, h / 2, z));
  g.add(at(sph(0.03, PM('#d9ab3c', 0.3, 0.9)), x, h + 0.02, z));
  const tail = cone(0.045, 0.22, cloth('#1a1410', 'fur', 1), 10); at(tail, x, h - 0.12, z, Math.PI); g.add(tail);
  g.add(at(box(0.16, 0.08, 0.004, team('velvet', 0.8)), x + 0.057, h - 0.3, z - 0.057, 0, Math.PI / 4, 0));
}
// chiparos (pentru grădinile otomane și tătare)
export function cypress(g, x, z, h = 0.9) {
  g.add(at(cyl(0.025, 0.03, 0.12, PM('#5a3a22', 0.9), 6), x, 0.06, z));
  const c = lathe([[0.001, 0], [0.11, h * 0.12], [0.13, h * 0.35], [0.1, h * 0.7], [0.001, h]], cloth('#2a4a26', 'fur', 1), 12); at(c, x, 0.08, z); g.add(c);
}
// mici obiecte care dau viață: butoaie, lăzi, fân, roabă
export function barrel(g, x, z, s = 1) { g.add(at(cyl(0.05 * s, 0.05 * s, 0.11 * s, TM('medieval_wood', '#a07850'), 12, 3), x, 0.055 * s, z)); [0.02, 0.09].forEach(y => g.add(at(mesh(new THREE.TorusGeometry(0.051 * s, 0.005, 4, 14), PM('#3a3a3a', 0.6, 0.5)), x, y * s, z, Math.PI / 2))); }
export function crate(g, x, z, s = 1, rot = 0) { g.add(at(box(0.11 * s, 0.09 * s, 0.11 * s, TM('raw_plank_wall', '#d0b090'), 3), x, 0.045 * s, z, 0, rot, 0)); }
export function hay(g, x, z, r = 0.2) { const h = dome(r, TM('reed_roof_04', '#f0d890', 1), 14, 0.75); at(h, x, 0, z); g.add(h); }
export function fencePosts(g, pts, h = 0.2, M = PM('#6e4b2a', 0.85)) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.3));
    for (let k = 0; k <= n; k++) g.add(at(cyl(0.016, 0.016, h, M, 6), x0 + (x1 - x0) * k / n, h / 2, z0 + (z1 - z0) * k / n));
    [h * 0.45, h * 0.85].forEach(y => { const r = box(L, 0.018, 0.018, M); at(r, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, -Math.atan2(z1 - z0, x1 - x0), 0); g.add(r); });
  }
}
// gard împletit din nuiele (Moldova)
export function wattle(g, pts, h = 0.2) {
  const M = cloth('#7a5a38', 'wool', 1);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
    const w = box(L, h, 0.02, M, 3); at(w, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, 0, -Math.atan2(z1 - z0, x1 - x0), 0); g.add(w);
    const n = Math.max(1, Math.round(L / 0.25)); for (let k = 0; k <= n; k++) g.add(at(cyl(0.012, 0.012, h + 0.05, PM('#5a3e22', 0.9), 5), x0 + (x1 - x0) * k / n, (h + 0.05) / 2, z0 + (z1 - z0) * k / n));
  }
}
// textura pictată a bisericilor moldovenești (Voroneț): registre de sfinți pe albastru
export function paintedMat(base = '#2a58a6') {
  const t = canvasTex(512, 256, (c, w, h, R) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) {
      const x = i * 32 + 3, y = 6 + r * 62;
      c.fillStyle = 'rgba(240,226,190,0.22)'; c.fillRect(x, y, 26, 54);
      c.strokeStyle = 'rgba(240,210,140,0.6)'; c.lineWidth = 1.5; c.strokeRect(x, y, 26, 54);
      c.fillStyle = '#d9b44a'; c.beginPath(); c.arc(x + 13, y + 12, 6, 0, 6.3); c.fill();
      c.fillStyle = '#e8c9a0'; c.beginPath(); c.arc(x + 13, y + 12, 3.5, 0, 6.3); c.fill();
      c.fillStyle = ['#a8322a', '#e8e2d2', '#3a6a3a', '#b8862a'][(i + r) % 4]; c.fillRect(x + 6, y + 20, 14, 30);
    }
    for (let i = 0; i < 2000; i++) { c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; c.fillRect(R() * w, R() * h, 2, 2); }
  }, 50);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide });
}
// țiglă smălțuită în romburi (acoperișurile colorate din Transilvania și Ungaria)
export function glazedMat(cols = ['#b8402a', '#e0b040', '#2a6a3a', '#f0e6d0']) {
  const t = canvasTex(128, 128, (c, w, h, R) => {
    c.fillStyle = cols[0]; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { c.fillStyle = cols[1 + ((x + y) / 16) % (cols.length - 1)]; c.beginPath(); c.moveTo(x + 8, y); c.lineTo(x + 16, y + 8); c.lineTo(x + 8, y + 16); c.lineTo(x, y + 8); c.fill(); }
    for (let y = 0; y < h; y += 4) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, w, 1); }
  }, 60);
  t.repeat.set(3, 3);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide });
}
// streașină pictată (Bahcisarai): scânduri în culori
export function paintedEave(g, x0, z0, x1, z1, y, d = 0.07) {
  const cols = ['#2a5a8a', '#b03a2a', '#2a7a4a', '#d8a640'];
  const strip = (a, b, fixedX, alongX, fixedV) => { const n = Math.max(2, Math.round(Math.abs(b - a) / 0.12)); for (let i = 0; i < n; i++) { const m = PM(cols[i % 4], 0.7), s = a + (b - a) * (i + 0.5) / n, L = Math.abs(b - a) / n; g.add(alongX ? at(box(L, d, 0.02, m), s, y - d / 2, fixedV) : at(box(0.02, d, L, m), fixedV, y - d / 2, s)); } };
  strip(x0, x1, 0, true, z1); strip(z0, z1, 0, false, x1);
}

// ---------- trusa de stil a fiecărei civilizații ----------
export function kit(civ, tier = 1) {
  const K = { civ, gold: PM('#d9ab3c', 0.3, 0.9), lead: PM('#66717c', 0.55, 0.4), dark: PM('#3e2a1a', 0.85) };
  K.planks = TM('medieval_wood', '#d8c2a6', 0.9, 1.2); K.logs = TM('raw_plank_wall', '#d2b090', 0.9, 1.2);
  K.thatch = TM('reed_roof_04', '#e8d8b0', 1, 1.4); K.rubble = TM('old_stone_wall', '#ffffff', 0.95, 1.2);
  switch (civ) {
    case 'mol': Object.assign(K, {
      wall: TM('plastered_wall', '#fbf8f0', 0.95, 0.8), base: TM('castle_wall_slates', '#f0ece4', 0.95, 1.2), stone: TM('castle_wall_slates', '#ffffff', 0.95, 1.2),
      roof: TM('grey_roof_tiles', '#94785e', 0.95, 1.2), timber: PM('#4e3420', 0.85), trim: '#f0eadc', shut: '#3d6fb0', winStyle: 'rect', winCol: '#26303c',
      pitch: 1.5, eave: 0.13, roofKind: 'hip', towerRound: true, towerTop: 'cone', towerPitch: 2.3, fin: 'cross', accent: '#a01c1c' }); break;
    case 'val': Object.assign(K, {
      wall: TM('plastered_wall', '#f6efe4', 0.95, 0.8), brick: TM('castle_brick_07', '#ffffff', 0.9, 1.2), base: TM('castle_wall_slates', '#e8e2d6', 0.95, 1.2), stone: TMb('old_stone_wall', '#f4eee4', 1.45, 0.95, 1.2),
      roof: TM('clay_roof_tiles', '#e8a088', 0.85, 1.1), timber: PM('#5a3424', 0.85), trim: '#c8b8a0', shut: '#7a1a14', winStyle: 'arch', winCol: '#1e1a20', bandedWalls: true,
      pitch: 0.95, eave: 0.09, roofKind: 'hip', towerRound: true, towerTop: 'gallery', towerPitch: 1.7, fin: 'cross', accent: '#8c1418' }); break;
    case 'ung': Object.assign(K, {
      wall: TM('clay_plaster', '#ffe8b0', 0.95, 0.8), base: TM('rustic_stone_wall', '#f4ece0', 0.95, 1.2), stone: TM('rustic_stone_wall', '#fff8ee', 0.95, 1.2),
      roof: TM('roof_tiles', '#ff9c80', 0.85, 1.2), timber: PM('#3a2416', 0.85), trim: '#e8e0d0', shut: '#2a5a2a', winStyle: 'lancet', winCol: '#1e2228', halfTimber: true,
      pitch: 1.75, eave: 0.06, roofKind: 'gable', towerRound: false, towerTop: 'spire4', towerPitch: 3.2, fin: 'ball', accent: '#2a5a2a', glazed: true }); break;
    case 'pol': Object.assign(K, {
      wall: TM('castle_brick_07', '#ffe0d0', 0.9, 1.2), brick: TM('castle_brick_07', '#ffffff', 0.9, 1.2), base: TM('castle_wall_slates', '#e0dcd4', 0.95, 1.2), stone: TM('castle_brick_07', '#f0d0c0', 0.9, 1.2),
      roof: TM('roof_tiles', '#b0584a', 0.85, 1.2), timber: PM('#3a2a20', 0.85), trim: '#f2ece0', shut: '#f2ece0', winStyle: 'lancet', winCol: '#1a2026', stepGable: true,
      pitch: 1.85, eave: 0.05, roofKind: 'gable', towerRound: false, towerTop: 'pyramid', towerPitch: 2.8, fin: 'spike', accent: '#c02828', copper: PM('#467a66', 0.6, 0.3) }); break;
    case 'oto': Object.assign(K, {
      wall: TM('plastered_wall', '#fff6e8', 0.95, 0.8), stone: TMb('large_sandstone_blocks', '#ffe8c4', 1.9, 0.95, 1.2), base: TMb('large_sandstone_blocks', '#f4dcb4', 1.6, 0.95, 1.2),
      roof: TMb('roof_09', '#ff9a70', 1.05, 0.85, 1.1), timber: PM('#5a3a24', 0.85), trim: '#d9b44a', shut: '#2f6a4a', winStyle: 'arch', winCol: '#24343c',
      pitch: 0.42, eave: 0.15, roofKind: 'hip', towerRound: true, towerTop: 'leadcone', towerPitch: 1.5, fin: 'crescent', accent: '#2f7d4a' }); break;
    case 'tat': Object.assign(K, {
      wall: TM('plastered_wall', '#f8f2e6', 0.95, 0.8), stone: TM('old_stone_wall', '#f6ead6', 0.95, 1.2), base: TM('old_stone_wall', '#e8dcc6', 0.95, 1.2),
      roof: TMb('roof_09', '#ff9470', 1.0, 0.85, 1.1), timber: PM('#6a3a1e', 0.8), trim: '#2a5a8a', shut: '#2a5a8a', winStyle: 'rect', winCol: '#2a2420', paintedEaves: true,
      pitch: 0.55, eave: 0.18, roofKind: 'hip', towerRound: false, towerTop: 'woodhip', towerPitch: 0.9, fin: 'crescent', accent: '#2a5a8a', yurts: true }); break;
  }
  if (!K.brick) K.brick = TM('castle_brick_07', '#ffffff', 0.9, 1.2);
  K.tier = tier || 1;
  if (tier === 0) {
    // Epoca Întunecată: lemn, lut și stuf; fără cărămidă, fără piatră cioplită, fără ornamente
    const daub = TM('clay_plaster', civ === 'oto' ? '#f0d8b0' : '#ecdcbc', 0.97, 0.9), logs = TM('raw_plank_wall', '#cfae8c', 0.9, 1.2);
    Object.assign(K, {
      wall: civ === 'mol' || civ === 'val' ? logs : daub, base: TM('old_stone_wall', '#cfc6b8', 0.97, 1.2), stone: logs,
      roof: civ === 'oto' ? TMb('roof_09', '#e8a080', 0.95, 0.9, 1.1) : civ === 'tat' ? cloth('#a88458', 'hide', 0.95) : TM('reed_roof_04', '#dccca0', 1, 1.4),
      halfTimber: civ === 'ung' || civ === 'pol', stepGable: false, bandedWalls: false, paintedEaves: false, glazed: false,
      pitch: civ === 'oto' ? 0.5 : civ === 'tat' ? 0.7 : 1.45, eave: 0.12, roofKind: civ === 'oto' || civ === 'tat' ? 'hip' : civ === 'ung' || civ === 'pol' ? 'gable' : 'hip',
      towerRound: false, towerTop: 'woodhip', towerPitch: 1.2, winStyle: 'rect', shut: '#5a3a22', winCol: '#2a2018', rustic: true
    });
    K.brick = logs;
  } else if (tier === 2) {
    // Epoca Imperială și Renașterea: piatră cioplită, ornamente, aur, acoperișuri bogate
    K.grand = true;
    K.base = TMb('large_sandstone_blocks', '#f4ead8', 1.7, 0.95, 1.2);
    K.gold = PM('#e8b84a', 0.25, 0.95);
    if (civ === 'mol') Object.assign(K, { roof: TM('grey_roof_tiles', '#7a5e48', 0.95, 1.2), stone: TMb('large_sandstone_blocks', '#f0e8dc', 1.6, 0.95, 1.2) });
    else if (civ === 'val') Object.assign(K, { roof: TM('roof_tiles', '#f0a080', 0.85, 1.2), wall: TM('plastered_wall', '#fbf6ee', 0.95, 0.8) });
    else if (civ === 'ung') Object.assign(K, { roof: glazedMat(['#9a3a24', '#d8a838', '#2a5a3a', '#e8dcc0']), stone: TMb('large_sandstone_blocks', '#f4ecdc', 1.7, 0.95, 1.2), glazed: true });
    else if (civ === 'pol') Object.assign(K, { roof: K.copper, attic: true });
    else if (civ === 'oto') Object.assign(K, { wall: TM('plastered_wall', '#ffffff', 0.9, 0.8), stone: TMb('large_sandstone_blocks', '#fff4e0', 2.0, 0.95, 1.2) });
    else if (civ === 'tat') Object.assign(K, { wall: TM('plastered_wall', '#ffffff', 0.9, 0.8), stone: TMb('old_stone_wall', '#fff4e4', 1.6, 0.95, 1.2) });
  }
  return K;
}
// zidurile unei clădiri, în stilul civilizației (soclu, benzi, schelet de lemn)
export function kwalls(g, K, x0, z0, x1, z1, y0, h, o = {}) {
  const pl = o.plinth === false ? 0 : 0.06;
  if (pl) g.add(blk(x0 - 0.02, z0 - 0.02, x1 + 0.02, z1 + 0.02, y0, pl, K.base, 3));
  const M = o.m || K.wall;
  if (K.bandedWalls && !o.m) banded(g, x0, z0, x1, z1, y0 + pl, h - pl, K.wall, K.brick, 0.055);
  else g.add(blk(x0, z0, x1, z1, y0 + pl, h - pl, M, 1.6));
  if (K.halfTimber && !o.m && o.timber !== false) { timberFace(g, 'z', x0, x1, z1, y0 + pl, y0 + h, K.timber); timberFace(g, 'x', z0, z1, x1, y0 + pl, y0 + h, K.timber); }
  if (K.grand && !o.m && h > 0.3) [z1, x1].forEach((f, i) => { const face = i ? 'x' : 'z', a = i ? z0 : x0, b = i ? z1 : x1; onFace(g, face, box(b - a + 0.02, 0.04, 0.025, K.base), (a + b) / 2, y0 + h - 0.02, f, 0.012); onFace(g, face, box(b - a + 0.02, 0.03, 0.02, K.base), (a + b) / 2, y0 + 0.08, f, 0.012); });
  if (K.attic && !o.m && h > 0.3) { [[x0, z1, x1, z1], [x1, z0, x1, z1]].forEach(([ax, az, bx, bz]) => crenels(g, ax, az - (bz === az ? 0.02 : 0), bx, bz, y0 + h, PM('#f4eee2', 0.9), 0.1, 0.09)); }
  if (K.civ === 'pol' && !o.m) [z1, x1].forEach((f, i) => { const face = i ? 'x' : 'z', a = i ? z0 : x0, b = i ? z1 : x1; onFace(g, face, box(b - a, 0.035, 0.02, PM('#efe8dc', 0.9)), (a + b) / 2, y0 + h - 0.06, f, 0.012); });
  if (K.civ === 'oto' && !o.m) [z1, x1].forEach((f, i) => { const face = i ? 'x' : 'z', a = i ? z0 : x0, b = i ? z1 : x1; onFace(g, face, box(b - a, 0.03, 0.02, K.stone), (a + b) / 2, y0 + h - 0.03, f, 0.01); });
}
// acoperișul unei clădiri, în stilul civilizației; întoarce înălțimea coamei
export function kroof(g, K, x0, z0, x1, z1, y, o = {}) {
  const e = o.eave !== undefined ? o.eave : K.eave, m = o.m || K.roof, kind = o.kind || K.roofKind;
  const w = x1 - x0, d = z1 - z0, alongX = o.alongX !== undefined ? o.alongX : w >= d;
  const h = (o.pitch || K.pitch) * (kind === 'gable' ? (alongX ? d : w) : Math.min(w, d)) * 0.5;
  if (kind === 'hip') g.add(hipRoof(x0 - e, z0 - e, x1 + e, z1 + e, y, h, m));
  else {
    g.add(gableRoof(x0, z0, x1, z1, y, h, m, alongX, o.gableM || (K.stepGable ? K.brick : K.wall), e));
    if (K.stepGable && o.steps !== false) { if (alongX) stepGable(g, K.brick, 'x', x1 + 0.03, z0 - 0.02, z1 + 0.02, y, h + 0.06, 4); else stepGable(g, K.brick, 'z', z1 + 0.03, x0 - 0.02, x1 + 0.02, y, h + 0.06, 4); }
    if (K.halfTimber && o.timber !== false) { const hd = (alongX ? d : w) / 2; if (alongX) timberFace(g, 'x', z0 + hd * 0.5, z1 - hd * 0.5, x1, y, y + h * 0.45, K.timber, false); else timberFace(g, 'z', x0 + hd * 0.5, x1 - hd * 0.5, z1, y, y + h * 0.45, K.timber, false); }
  }
  if (K.paintedEaves && kind === 'hip') paintedEave(g, x0 - e, z0 - e, x1 + e, z1 + e, y);
  return h;
}
// fereastră în stilul civilizației
export function kwin(g, K, face, a, b, fixed, y0, y1, o = {}) {
  const st = o.style || K.winStyle;
  win(g, face, a, b, fixed, y0, y1, { style: st, col: K.winCol, frame: K.civ === 'mol' ? '#f0eadc' : K.civ === 'oto' ? '#c8a878' : K.civ === 'pol' ? '#efe8dc' : K.civ === 'tat' ? '#7a4a24' : '#8a7a64', shut: K.civ === 'mol' || K.civ === 'tat' ? K.shut : null, bars: K.civ === 'tat' ? '#6a3a1e' : null });
}
// turn de piatră în stilul civilizației (rotund sau pătrat), cu vârful specific
export function ktower(g, K, x, z, r, h, o = {}) {
  const M = o.m || K.stone, round = o.round !== undefined ? o.round : K.towerRound;
  if (round) g.add(at(cyl(r, r * 1.08, h, M, 24, 1.6), x, h / 2, z)); else g.add(blk(x - r, z - r, x + r, z + r, 0, h, M, 1.6));
  [[r * 0.98, 0.55], [r * 0.7, 0.8]].forEach(([d, f]) => { if (h > 0.6) g.add(at(box(0.03, 0.12, 0.03, PM('#120e0a')), x + d * 0.72, h * f, z + d * 0.72, 0, Math.PI / 4, 0)); });
  const top = o.top || K.towerTop, P = o.pitch || K.towerPitch;
  let y = h;
  if (top === 'cone') {
    // Moldova: galerie de lemn (hurdă) sub un con înalt de șindrilă
    if (round) g.add(at(cyl(r * 1.14, r * 1.14, 0.16, K.planks, 24, 2), x, h + 0.08, z)); else g.add(blk(x - r * 1.14, z - r * 1.14, x + r * 1.14, z + r * 1.14, h, 0.16, K.planks, 2));
    y = h + 0.16; const ch = r * P; g.add(at(round ? cone(r * 1.3, ch, K.roof, 24, 1.6) : cone(r * 1.55, ch, K.roof, 4, 1.6), x, y + ch / 2, z, 0, round ? 0 : Math.PI / 4, 0)); y += ch;
  } else if (top === 'gallery') {
    // Chindia: brâu de creneluri, galerie, coif ascuțit de țiglă
    g.add(at(cyl(r * 1.16, r * 1.04, 0.1, M, 24, 1.6), x, h + 0.05, z)); ringCrenels(g, x, z, r * 1.1, h + 0.1, M, 14, 0.06);
    g.add(at(cyl(r * 0.9, r * 0.9, 0.22, K.wall, 20, 1.6), x, h + 0.21, z)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; g.add(at(box(0.04, 0.1, 0.03, PM('#1a1410')), x + Math.cos(a) * r * 0.91, h + 0.22, z + Math.sin(a) * r * 0.91, 0, -a, 0)); }
    y = h + 0.32; const ch = r * P; g.add(at(cone(r * 1.1, ch, K.roof, 24, 1.6), x, y + ch / 2, z)); y += ch;
  } else if (top === 'spire4') {
    // gotic: coif foarte înalt și patru turnulețe în colțuri
    const ch = r * P, gm = K.glazed && o.glazed ? glazedMat() : K.roof;
    g.add(blk(x - r * 1.08, z - r * 1.08, x + r * 1.08, z + r * 1.08, h, 0.08, M, 1.6));
    g.add(at(cone(r * 1.15, ch, gm, 4, 1.6), x, h + 0.08 + ch / 2, z, 0, Math.PI / 4, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const tx = x + sx * r * 1.02, tz = z + sz * r * 1.02; g.add(at(cyl(r * 0.2, r * 0.2, 0.14, M, 8, 2), tx, h + 0.1, tz)); g.add(at(cone(r * 0.24, r * 1.1, gm, 8, 1.6), tx, h + 0.17 + r * 0.55, tz)); });
    y = h + 0.08 + ch;
  } else if (top === 'pyramid') {
    // Polonia: piramidă abruptă, turlă de cupru verde
    const ch = r * P * 0.6; g.add(blk(x - r * 1.06, z - r * 1.06, x + r * 1.06, z + r * 1.06, h, 0.06, PM('#efe8dc', 0.9), 2));
    g.add(hipRoof(x - r * 1.1, z - r * 1.1, x + r * 1.1, z + r * 1.1, h + 0.06, ch, K.roof)); y = h + 0.06 + ch;
    const sh = r * 1.4; g.add(at(cone(r * 0.2, sh, K.copper || K.roof, 8), x, y + sh / 2 - 0.02, z)); y += sh;
  } else if (top === 'leadcone') {
    // otomani: con de plumb ascuțit (külah) peste un brâu
    g.add(at(cyl(r * 1.08, r * 1.02, 0.06, M, 24, 1.6), x, h + 0.03, z)); const ch = r * P; g.add(at(cone(r * 1.08, ch, K.lead, 24), x, h + 0.06 + ch / 2, z)); y = h + 0.06 + ch;
  } else if (top === 'woodhip') {
    // tătari: foișor de lemn cu acoperiș jos, streașină pictată
    g.add(blk(x - r * 1.05, z - r * 1.05, x + r * 1.05, z + r * 1.05, h, 0.05, K.planks, 2));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(at(cyl(0.018, 0.018, 0.22, K.timber, 6), x + sx * r * 0.95, h + 0.16, z + sz * r * 0.95)));
    const rh = r * P; g.add(hipRoof(x - r * 1.3, z - r * 1.3, x + r * 1.3, z + r * 1.3, h + 0.27, rh, K.roof)); if (K.paintedEaves) paintedEave(g, x - r * 1.3, z - r * 1.3, x + r * 1.3, z + r * 1.3, h + 0.27); y = h + 0.27 + rh;
  } else if (top === 'crenel') { if (round) ringCrenels(g, x, z, r * 0.95, h, M, 12); else { crenels(g, x - r, z + r - 0.04, x + r, z + r - 0.04, h, M); crenels(g, x + r - 0.04, z - r, x + r - 0.04, z + r, h, M); } y = h + 0.07; }
  if (o.fin !== false) finial(g, x, y, z, o.fin || K.fin);
  return y;
}
