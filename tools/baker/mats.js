// Materialele: texturi foto (Poly Haven, CC0) pentru clădiri și texturi pictate procedural pentru haine, blănuri, zale.
// Materialele de echipă (userData.team) sunt gri neutru: jocul le înmulțește cu culoarea jucătorului.
import { THREE, ENV, TEAM_GRAY } from './core.js';

export const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ---------- texturi foto ----------
const loader = new THREE.TextureLoader();
const texCache = {}, pending = [];
export function tex(name, kind = 'diff') {
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
const NOR = new Set(['castle_wall_slates', 'old_stone_wall', 'rustic_stone_wall', 'plastered_wall', 'raw_plank_wall', 'medieval_wood', 'reed_roof_04', 'grey_roof_tiles', 'clay_roof_tiles', 'roof_09', 'forest_ground_04', 'dirt', 'river_small_rocks', 'large_sandstone_blocks', 'clay_plaster', 'castle_brick_07', 'red_slate_roof_tiles_01', 'roof_tiles', 'roof_planks', 'brown_planks_05', 'aerial_grass_rock', 'dry_ground_01', 'sparse_grass', 'coast_sand_01', 'aerial_mud_1', 'brown_mud_leaves_01', 'leafy_grass', 'forest_leaves_02', 'aerial_sand']);
const mats = {};
// material cu textură foto; tint înmulțește culoarea
export function TM(name, tint = '#ffffff', rough = 0.92, ns = 1, side = THREE.FrontSide) {
  const k = name + tint + rough + ns + side;
  if (!mats[k]) {
    const m = new THREE.MeshStandardMaterial({ map: tex(name, 'diff'), roughness: rough, color: new THREE.Color(tint), side });
    if (NOR.has(name)) { m.normalMap = tex(name, 'nor'); m.normalScale.set(ns, ns); }
    mats[k] = m;
  }
  return mats[k];
}
const plain = {};
// material simplu, pe ambele fețe
export function PM(hex, rough = 0.85, metal = 0, emissive, ei = 1.4) {
  const k = hex + rough + metal + (emissive || '') + ei;
  if (!plain[k]) {
    const o = { color: new THREE.Color(hex), roughness: rough, metalness: metal, side: THREE.DoubleSide };
    if (emissive) { o.emissive = new THREE.Color(emissive); o.emissiveIntensity = ei; }
    plain[k] = new THREE.MeshStandardMaterial(o);
    if (metal > 0.3) { plain[k].envMap = ENV; plain[k].envMapIntensity = 1.1; }
  }
  return plain[k];
}

// ---------- texturi procedurale ----------
function canvasTex(w, h, draw, seed = 1, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h, rng(seed));
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
const noise = (c, w, h, R, n, sz, a0, a1, light = 0.5) => { for (let i = 0; i < n; i++) { const v = R() < light ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${a0 + R() * (a1 - a0)})`; c.fillRect(R() * w, R() * h, sz * (0.5 + R()), sz * (0.5 + R())); } };
const PAT = {};
function pat(kind) {
  if (PAT[kind]) return PAT[kind];
  let t;
  switch (kind) {
    case 'linen': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { c.fillStyle = `rgba(0,0,0,${0.03 + R() * 0.03})`; c.fillRect(0, y, w, 1); } for (let x = 0; x < w; x += 2) { c.fillStyle = `rgba(0,0,0,${0.02 + R() * 0.03})`; c.fillRect(x, 0, 1, h); } noise(c, w, h, R, 900, 2, 0.02, 0.07); }, 11); break;
    case 'wool': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#eeeeee'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 2600, 2.5, 0.03, 0.1); }, 12); break;
    case 'felt': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#ececec'; c.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const v = R() < 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${0.03 + R() * 0.05})`; c.beginPath(); c.arc(R() * w, R() * h, 4 + R() * 10, 0, 7); c.fill(); } noise(c, w, h, R, 1200, 1.5, 0.02, 0.06); }, 13); break;
    case 'quilt': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 1200, 2, 0.02, 0.07); c.strokeStyle = 'rgba(0,0,0,0.32)'; c.lineWidth = 2; for (let x = -h; x < w + h; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h, h); c.stroke(); c.beginPath(); c.moveTo(x + h, 0); c.lineTo(x, h); c.stroke(); } }, 14); break;
    case 'stripes': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,0.28)'; for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 3); noise(c, w, h, R, 400, 2, 0.02, 0.06); }, 15); break;
    case 'velvet': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 500, 4, 0.02, 0.05); }, 16); break;
    case 'fur': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#d8d8d8'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { const v = R() < 0.55 ? 255 : 0, x = R() * w, y = R() * h; c.strokeStyle = `rgba(${v},${v},${v},${0.12 + R() * 0.25})`; c.lineWidth = 1 + R(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 4, y + 3 + R() * 6); c.stroke(); } }, 17); break;
    case 'fleece': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#d4d4d4'; c.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const v = R() < 0.6 ? 255 : 30, x = R() * w, y = R() * h, r = 2 + R() * 3; c.strokeStyle = `rgba(${v},${v},${v},${0.25 + R() * 0.3})`; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r, R() * 6, R() * 6 + 4); c.stroke(); } }, 18); break;
    case 'mail': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#5a5a5a'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) { const v = 170 + R() * 85; c.strokeStyle = `rgb(${v},${v},${v})`; c.lineWidth = 1; c.beginPath(); c.arc(x + 2, y + 2, 1.6, 0, 7); c.stroke(); } }, 19); break;
    case 'lamellar': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = ((y / 16) % 2) * 4; x < w + 8; x += 8) { const v = 190 + R() * 60; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x + 0.8, y + 1, 6.4, 13); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 0.8, y + 11, 6.4, 3); } }, 20); break;
    case 'scales': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#303030'; c.fillRect(0, 0, w, h); for (let y = -8; y < h; y += 10) for (let x = ((y / 10) & 1) * 6; x < w + 12; x += 12) { const v = 180 + R() * 70; c.fillStyle = `rgb(${v},${v},${v})`; c.beginPath(); c.ellipse(x, y + 6, 5.5, 7, 0, 0, Math.PI); c.fill(); } }, 21); break;
    case 'rivets': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 800, 2, 0.02, 0.06); for (let y = 6; y < h; y += 14) for (let x = 6; x < w; x += 12) { c.fillStyle = 'rgba(40,40,40,0.75)'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - 1, y - 1, 1.2, 1.2); } }, 22); break;
    case 'leather': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#e4e4e4'; c.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { const v = R() < 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${0.04 + R() * 0.06})`; c.beginPath(); c.arc(R() * w, R() * h, 2 + R() * 8, 0, 7); c.fill(); } }, 23); break;
    case 'hide': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#d0d0d0'; c.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const v = R() < 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${0.06 + R() * 0.1})`; c.beginPath(); c.ellipse(R() * w, R() * h, 6 + R() * 20, 4 + R() * 10, R() * 3, 0, 7); c.fill(); } for (let i = 0; i < 1500; i++) { const v = R() < 0.5 ? 255 : 0, x = R() * w, y = R() * h; c.strokeStyle = `rgba(${v},${v},${v},0.15)`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 4); c.stroke(); } }, 24); break;
    case 'skin': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 300, 3, 0.02, 0.04); }, 25); break;
    case 'horse': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#ececec'; c.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { const v = R() < 0.5 ? 255 : 0, x = R() * w, y = R() * h; c.strokeStyle = `rgba(${v},${v},${v},${0.04 + R() * 0.05})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5 + R() * 4, y + (R() - 0.5)); c.stroke(); } }, 26); break;
    case 'dapple': t = canvasTex(128, 128, (c, w, h, R) => { c.fillStyle = '#e8e8e8'; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(90,90,90,${0.12 + R() * 0.12})`; c.lineWidth = 2; c.beginPath(); c.arc(R() * w, R() * h, 3 + R() * 5, 0, 7); c.stroke(); } }, 27); break;
    case 'embroid': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#f6f6f6'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 300, 2, 0.02, 0.05); c.fillStyle = '#9a1c1c'; for (let x = 0; x < w; x += 8) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + 4, 34); c.lineTo(x + 8, 40); c.lineTo(x + 4, 46); c.fill(); } c.fillStyle = '#1e1e1e'; c.fillRect(0, 31, w, 2); c.fillRect(0, 48, w, 2); }, 28); break;
    case 'gold': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, w, h); noise(c, w, h, R, 400, 2, 0.03, 0.08); }, 29); break;
    case 'plaid': t = canvasTex(64, 64, (c, w, h, R) => { c.fillStyle = '#efefef'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,0.22)'; for (let i = 0; i < w; i += 16) { c.fillRect(i, 0, 5, h); c.fillRect(0, i, w, 5); } noise(c, w, h, R, 300, 2, 0.02, 0.05); }, 30); break;
    default: return null;
  }
  return (PAT[kind] = t);
}
export { canvasTex, pat };

const MC = {};
// material de haină/piele/blană: culoarea e înmulțită cu un model gri
export function cloth(hex, kind = 'wool', rough = 0.92, opts = {}) {
  const k = 'c' + hex + kind + rough + JSON.stringify(opts);
  if (!MC[k]) {
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: opts.metal || 0, side: opts.single ? THREE.FrontSide : THREE.DoubleSide });
    const p = pat(kind); if (p) m.map = p;
    if (opts.metal > 0.3 || kind === 'mail' || kind === 'lamellar' || kind === 'scales' || kind === 'gold') { m.envMap = ENV; m.envMapIntensity = opts.env || 1.0; }
    MC[k] = m;
  }
  return MC[k];
}
// materialul de echipă (gri; jocul îl colorează)
export function team(kind = 'wool', rough = 0.9) {
  const k = 'team' + kind + rough;
  if (!MC[k]) { const m = cloth(TEAM_GRAY, kind, rough).clone(); m.userData = { team: true }; MC[k] = m; }
  return MC[k];
}
export const isTeam = c => c === 'T' || (typeof c === 'string' && c.startsWith('T:'));
// „T” = culoarea echipei; „T:quilt” = echipă cu model; altfel culoare hex
export function C(col, kind = 'wool', rough = 0.92) {
  if (col && col.isMaterial) return col;
  if (col === 'T') return team(kind, rough);
  if (typeof col === 'string' && col.startsWith('T:')) return team(col.slice(2), rough);
  return cloth(col, kind, rough);
}
// metalele
export const STEEL = () => cloth('#a9aeb6', 'gold', 0.34, { metal: 0.9, env: 1.0 });
export const IRON = () => cloth('#6a6e75', 'gold', 0.45, { metal: 0.85 });
export const DARKIRON = () => cloth('#3e4146', 'gold', 0.5, { metal: 0.8 });
export const GOLD = () => cloth('#e0b445', 'gold', 0.28, { metal: 0.95, env: 1.3 });
export const BRONZE = () => cloth('#b07a3a', 'gold', 0.35, { metal: 0.9, env: 1.2 });
export const BRASS = () => cloth('#c89a48', 'gold', 0.32, { metal: 0.9 });
export const MAIL = () => cloth('#9da3ab', 'mail', 0.46, { metal: 0.85, env: 0.95 });
export const LAMELLAR = (hex = '#a9aeb5') => cloth(hex, 'lamellar', 0.4, { metal: 0.8 });
export const SCALES = (hex = '#b5b9bf') => cloth(hex, 'scales', 0.4, { metal: 0.8 });
export const WOOD = (hex = '#7a5634') => { const k = 'wood' + hex; if (!MC[k]) MC[k] = new THREE.MeshStandardMaterial({ map: tex('medieval_wood'), color: new THREE.Color(hex).multiplyScalar(1.6), roughness: 0.85, side: THREE.DoubleSide }); return MC[k]; };
export const LEATHER = (hex = '#5e3b22') => cloth(hex, 'leather', 0.75);
export const SKIN = (hex) => cloth(hex, 'skin', 0.7);
export const HAIR = (hex) => cloth(hex, 'fur', 0.95);
export const BLACK = () => cloth('#141210', 'wool', 0.9);
export function glow(hex, i = 2) { const k = 'glow' + hex + i; if (!MC[k]) MC[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), emissive: new THREE.Color(hex), emissiveIntensity: i, roughness: 1, side: THREE.DoubleSide }); return MC[k]; }
