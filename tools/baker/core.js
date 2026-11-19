// Scena 3D pentru randarea sprite-urilor: cameră izometrică (30°, ca în AoE2), soare cu umbre, sol transparent.
// v2: a doua trecere pentru masca de culoare a jucătorului, încadrare automată (celula strânsă), ieșire WebP.
import * as THREE from 'three';
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from '/node_modules/three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
export { THREE };

export const PX = 45.2548; // pixeli pe unitate (latura unui pătrățel) la zoom 1
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x000000, 0);

export const scene = new THREE.Scene();
export const hemi = new THREE.HemisphereLight(0xeef3ff, 0x8a7a58, 1.7);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff0d4, 3.3);
sun.position.set(-4, 6.5, -1.6);
scene.add(sun); scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 3;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.012;
const sc = sun.shadow.camera;
let shadowMapSize = 2048;
export function shadowBox(r, cx = 0, cz = 0) {
  sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 0.1; sc.far = 60; sc.updateProjectionMatrix();
  const want = r > 3.2 ? 4096 : 2048;
  if (want !== shadowMapSize) { shadowMapSize = want; sun.shadow.mapSize.set(want, want); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  sun.target.position.set(cx, 0, cz); sun.position.set(cx - 4 * 2, 13, cz - 1.6 * 2); sun.target.updateMatrixWorld();
}
shadowBox(1.5);

export const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.34 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// reflexii pentru metale: un cer pictat (albastru sus, pământ jos, soarele spre stânga-sus)
const envCanvas = document.createElement('canvas'); envCanvas.width = 512; envCanvas.height = 256;
{
  const c = envCanvas.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#7fa6d8'); gr.addColorStop(0.42, '#cfdbe6'); gr.addColorStop(0.5, '#e8e4d8'); gr.addColorStop(0.53, '#8a8462'); gr.addColorStop(1, '#4a4632');
  c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
  const d = new THREE.Vector3(-4, 6.5, -1.6).normalize(), u = (Math.atan2(d.z, d.x) / (2 * Math.PI) + 0.5) * 512, v = (1 - (Math.asin(d.y) / Math.PI + 0.5)) * 256;
  const sg = c.createRadialGradient(u, v, 0, u, v, 40); sg.addColorStop(0, 'rgba(255,250,235,1)'); sg.addColorStop(0.25, 'rgba(255,244,220,0.8)'); sg.addColorStop(1, 'rgba(255,240,210,0)');
  c.fillStyle = sg; c.fillRect(0, 0, 512, 256);
}
const envTex = new THREE.CanvasTexture(envCanvas); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
const pmrem = new THREE.PMREMGenerator(renderer);
export const ENV = pmrem.fromEquirectangular(envTex).texture;

export const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
const dir = new THREE.Vector3(Math.cos(Math.PI / 4) * Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), Math.sin(Math.PI / 4) * Math.cos(Math.PI / 6));
camera.position.copy(dir.multiplyScalar(120));
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);

// celula W x H (pixeli de ieșire), punctul (0,0,0) cade în (ax, ay); k = pixeli de ieșire per pixel la zoom 1
export function frameCell(W, H, ax, ay, k) {
  const P = PX * k;
  camera.left = -ax / P; camera.right = (W - ax) / P; camera.top = ay / P; camera.bottom = -(H - ay) / P;
  camera.updateProjectionMatrix();
}
// ocluzia ambientală (GTAO): umbre fine la subsuori, sub pălării, între falduri, unde lumina nu ajunge
let composer = null, gtao = null;
function renderAO(w, h, radius) {
  if (!composer) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, w, h); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 1.0;
    composer.addPass(gtao); composer.addPass(new OutputPass());
  }
  composer.setPixelRatio(1); composer.setSize(w, h);
  gtao.updateGtaoMaterial({ radius: radius || 0.08, distanceExponent: 1.6, thickness: 0.05, scale: 1.25, samples: 16, distanceFallOff: 1.0 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 16 });
  composer.render();
}
function renderTo(ctx, dx, dy, W, H, ss, ao) {
  renderer.setSize(W * ss, H * ss, false);
  if (ao) renderAO(W * ss, H * ss, ao); else renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, W * ss, H * ss, dx, dy, W, H);
}
// lumina oamenilor: soarele mai tare, cerul mai slab (volum și contrast), plus o lumină din spate care le desenează conturul
export const rim = new THREE.DirectionalLight(0xdfe8ff, 0); rim.position.set(3.5, 2.8, -4.5); scene.add(rim);
// soarele vine din spate-stânga (umbrele pe sol rămân ca la clădiri), deci fața oamenilor ar sta în umbră;
// o lumină caldă din față-stânga, fără umbră, le dă volum: partea stângă luminată, dreapta în penumbră
export const key = new THREE.DirectionalLight(0xfff2dc, 0); key.position.set(-2.2, 4.2, 4.6); scene.add(key);
function unitLight(on) {
  if (on) { hemi.intensity = 0.85; sun.intensity = 2.6; rim.intensity = 1.6; key.intensity = 2.6; }
  else { hemi.intensity = 1.7; sun.intensity = 3.3; rim.intensity = 0; key.intensity = 0; }
}

// cele 5 direcții randate (ecran): S, SV, V, NV, N; restul se oglindesc
const DIRS = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
export function faceDir(obj, d) {
  const v = DIRS[d], l = Math.hypot(v[0], v[1]);
  obj.rotation.y = Math.atan2(-v[1] / l, v[0] / l);
}

// ---------- culoarea jucătorului ----------
// materialele marcate cu userData.team sunt randate gri neutru; masca are alfa = cât din pixel e „culoarea echipei”
export const TEAM_GRAY = '#d0d0d0';
const maskCache = new WeakMap();
function maskMat(m) {
  let mm = maskCache.get(m);
  if (!mm) {
    const team = !!(m.userData && m.userData.team);
    mm = new THREE.MeshBasicMaterial({ color: team ? 0xffffff : 0x000000, side: m.side, toneMapped: false, alphaTest: m.alphaTest || 0, map: m.alphaTest ? m.map : null });
    maskCache.set(m, mm);
  }
  return mm;
}
export function hasTeam(root) {
  let t = false;
  root.traverse(o => { if (o.isMesh && o.visible) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.userData && m.userData.team) t = true; }); });
  return t;
}
function maskOn(root) {
  const saved = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some(m => m.transparent && !m.depthWrite)) { saved.push([o, o.material, o.visible]); o.visible = false; return; }
    saved.push([o, o.material, o.visible]);
    o.material = Array.isArray(o.material) ? o.material.map(maskMat) : maskMat(o.material);
  });
  ground.visible = false; renderer.shadowMap.autoUpdate = false;
  return () => { saved.forEach(([o, m, v]) => { o.material = m; o.visible = v; }); ground.visible = true; renderer.shadowMap.autoUpdate = true; };
}
// treceri suplimentare pentru clădiri: ferestrele care se aprind noaptea (userData.win) și zăpada de pe fețele de sus
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false });
const BLACKM = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, toneMapped: false });
const SNOW = new THREE.ShaderMaterial({
  vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'varying vec3 vN; void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; float s = smoothstep(0.42, 0.74, n.y); gl_FragColor = vec4(s, s, s, 1.0); }',
  side: THREE.DoubleSide
});
export function hasFlag(root, key) {
  let t = false;
  root.traverse(o => { if (o.isMesh && o.visible) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.userData && m.userData[key]) t = true; }); });
  return t;
}
function passOn(root, pick) {
  const saved = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    saved.push([o, o.material, o.visible]);
    if (mats.some(m => m.transparent && !m.depthWrite) || (o.userData && o.userData.noSnow && pick === snowPick)) { o.visible = false; return; }
    o.material = Array.isArray(o.material) ? o.material.map(pick) : pick(o.material);
  });
  ground.visible = false; renderer.shadowMap.autoUpdate = false;
  return () => { saved.forEach(([o, m, v]) => { o.material = m; o.visible = v; }); ground.visible = true; renderer.shadowMap.autoUpdate = true; };
}
const litPick = m => (m.userData && m.userData.win ? WHITE : BLACKM), snowPick = () => SNOW;
// alfa măștii = acoperirea materialelor de echipă (roșul premultiplicat), RGB alb
function finishMask(c) {
  const ctx = c.getContext('2d'), im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const a = Math.round(d[i] * d[i + 3] / 255); d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a; }
  ctx.putImageData(im, 0, 0);
}

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return c; }
export { mkCanvas };
// cutia ne-transparentă a unei pânze
function bbox(c, thr = 3) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}
export { bbox };

// încadrare automată: randează toate pozele suprapuse într-o celulă mare și păstrează doar cutia lor
function fitCell(k, guess, poses, pad) {
  let [W, H, ax, ay] = guess.map(v => Math.round(v * k));
  for (let attempt = 0; attempt < 5; attempt++) {
    frameCell(W, H, ax, ay, k);
    const acc = mkCanvas(W, H), actx = acc.getContext('2d');
    poses(() => { renderer.setSize(W, H, false); renderer.render(scene, camera); actx.drawImage(renderer.domElement, 0, 0, W, H, 0, 0, W, H); });
    const b = bbox(acc, 2);
    if (!b) return [8, 8, 4, 4];
    const touch = b.x0 <= 1 || b.y0 <= 1 || b.x1 >= W - 2 || b.y1 >= H - 2;
    if (touch) { const gx = Math.round(W * 0.5), gy = Math.round(H * 0.5); W += 2 * gx; H += 2 * gy; ax += gx; ay += gy; continue; }
    const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(W - 1, b.x1 + pad), y1 = Math.min(H - 1, b.y1 + pad);
    return [x1 - x0 + 1, y1 - y0 + 1, ax - x0, ay - y0];
  }
  throw new Error('nu încape în celulă');
}

const Q = 0.88;
// o foaie cu toate cadrele: rânduri = acțiune x direcție, coloane = cadre
// spec: root, reset, actions, k, ss, shadow, guess [W,H,ax,ay] la zoom 1, dirs (implicit 5)
export function bakeSheet(spec) {
  const A = spec.actions, ND = spec.dirs || 5, rows = A.length * ND, cols = Math.max(...A.map(a => a.frames)), k = spec.k, ss = spec.ss || 2;
  shadowBox(spec.shadow || 1.5);
  scene.add(spec.root);
  const each = cb => A.forEach((a, ai) => { for (let d = 0; d < ND; d++) { faceDir(spec.root, d); for (let f = 0; f < a.frames; f++) { spec.reset(); a.pose(f / a.frames, f, d); spec.root.updateMatrixWorld(true); cb(ai, d, f); } } });
  const [W, H, ax, ay] = fitCell(k, spec.guess, cb => each(() => cb()), spec.pad || 3);
  const sheet = mkCanvas(cols * W, rows * H), ctx = sheet.getContext('2d');
  const team = hasTeam(spec.root), msheet = team ? mkCanvas(cols * W, rows * H) : null, mctx = team ? msheet.getContext('2d') : null;
  frameCell(W, H, ax, ay, k);
  const meta = { W, H, ax, ay, k, actions: {} };
  A.forEach((a, ai) => { meta.actions[a.name] = { row: ai * ND, frames: a.frames, loop: a.loop !== false }; });
  if (spec.real) unitLight(true);
  each((ai, d, f) => {
    renderTo(ctx, f * W, (ai * ND + d) * H, W, H, ss, spec.real ? spec.ao || 0.07 : 0);
    if (team) { const undo = maskOn(spec.root); renderTo(mctx, f * W, (ai * ND + d) * H, W, H, ss); undo(); }
  });
  unitLight(false);
  if (spec.real) outline(sheet);
  scene.remove(spec.root);
  if (team) { finishMask(msheet); meta.mask = true; }
  return { webp: sheet.toDataURL('image/webp', Q), mask: team ? msheet.toDataURL('image/webp', Q) : null, meta, canvas: sheet, mcanvas: msheet };
}

// un contur închis, de un pixel, în jurul siluetei (nu și al umbrei de pe sol): oamenii se desprind de iarbă, ca în AoE2
function outline(canvas, a = 0.5) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, im = c.getImageData(0, 0, w, h), d = im.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 160 ? 1 : 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (solid[i]) continue;
    const n = solid[i - 1] + solid[i + 1] + solid[i - w] + solid[i + w], n2 = solid[i - w - 1] + solid[i - w + 1] + solid[i + w - 1] + solid[i + w + 1];
    if (!n && !n2) continue;
    const ao = a * (n ? 1 : 0.5), o = i * 4, ae = d[o + 3] / 255, oa = ae + ao * (1 - ae);
    if (oa <= 0) continue;
    for (let k = 0; k < 3; k++) d[o + k] = Math.round((d[o + k] * ae + [22, 17, 12][k] * ao * (1 - ae)) / oa);
    d[o + 3] = Math.round(oa * 255);
  }
  c.putImageData(im, 0, 0);
}

// conturul simplificat al părții opace (fără umbra de pe sol), în pixeli la zoom 1: jocul îl folosește
// ca să știe ce acoperă un copac (siluetele oamenilor ascunși), fără să citească pixeli
function hull(canvas, k) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, d = c.getImageData(0, 0, w, h).data, L = [], R = [], step = Math.max(2, Math.round(h / 28));
  for (let y = 0; y < h; y += step) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 200) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 >= 0) { L.push([+(x0 / k).toFixed(1), +(y / k).toFixed(1)]); R.push([+((x1 + 1) / k).toFixed(1), +(y / k).toFixed(1)]); }
  }
  return L.concat(R.reverse());
}

// o singură imagine (clădiri, copaci, resurse)
export function bakeStill(spec) {
  const k = spec.k, ss = spec.ss || 2;
  shadowBox(spec.shadow || 3, spec.scx || 0, spec.scz || 0);
  scene.add(spec.root); spec.root.updateMatrixWorld(true);
  const [W, H, ax, ay] = spec.fixed || fitCell(k, spec.guess, cb => cb(), spec.pad || 3);
  const c = mkCanvas(W, H), ctx = c.getContext('2d');
  frameCell(W, H, ax, ay, k);
  renderTo(ctx, 0, 0, W, H, ss);
  const team = !spec.noMask && hasTeam(spec.root);
  let mc = null;
  if (team) { mc = mkCanvas(W, H); const undo = maskOn(spec.root); renderTo(mc.getContext('2d'), 0, 0, W, H, ss); undo(); finishMask(mc); }
  const meta = { W, H, ax, ay, k };
  if (team) meta.mask = true;
  if (spec.hull) meta.hull = hull(c, k);
  let lc = null, sc2 = null;
  if (spec.lit && hasFlag(spec.root, 'win')) { lc = mkCanvas(W, H); const undo = passOn(spec.root, litPick); renderTo(lc.getContext('2d'), 0, 0, W, H, ss); undo(); finishMask(lc); meta.lit = true; }
  if (spec.snow) { sc2 = mkCanvas(W, H); const undo = passOn(spec.root, snowPick); renderTo(sc2.getContext('2d'), 0, 0, W, H, ss); undo(); finishMask(sc2); meta.snow = true; }
  const proj = p => { const v = new THREE.Vector3(p[0], p[1], p[2]).project(camera); return [+(((v.x + 1) / 2 * W) / k).toFixed(1), +(((1 - v.y) / 2 * H) / k).toFixed(1)]; };
  scene.remove(spec.root);
  return { webp: c.toDataURL('image/webp', Q), mask: team ? mc.toDataURL('image/webp', Q) : null, lit: lc ? lc.toDataURL('image/webp', Q) : null, snow: sc2 ? sc2.toDataURL('image/webp', Q) : null, meta, proj, canvas: c, mcanvas: mc };
}

// nuanțarea cu culoarea jucătorului, exact cum o va face jocul: baza × culoare acolo unde e masca
export function tint(base, mask, col) {
  const w = base.width, h = base.height, t = mkCanvas(w, h), tc = t.getContext('2d');
  tc.drawImage(mask, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, w, h);
  const o = mkCanvas(w, h), oc = o.getContext('2d');
  oc.drawImage(base, 0, 0); oc.globalCompositeOperation = 'multiply'; oc.drawImage(t, 0, 0);
  oc.globalCompositeOperation = 'destination-in'; oc.drawImage(base, 0, 0);
  return o;
}

// iconiță 96x96: figura (fără umbră) încadrată, apoi randată cu umbră; culoarea echipei aplicată ca în joc
export function bakeIcon(spec) {
  const size = spec.size || 96, k0 = spec.k0 || 3;
  shadowBox(spec.shadow || 2, spec.scx || 0, spec.scz || 0);
  scene.add(spec.root); spec.root.updateMatrixWorld(true);
  ground.visible = false;
  let [W, H, ax, ay] = spec.guess.map(v => Math.round(v * k0)), b;
  for (let i = 0; i < 5; i++) {
    frameCell(W, H, ax, ay, k0);
    const c = mkCanvas(W, H); renderTo(c.getContext('2d'), 0, 0, W, H, 1);
    b = bbox(c, 10);
    if (b && (b.x0 <= 1 || b.y0 <= 1 || b.x1 >= W - 2 || b.y1 >= H - 2)) { W *= 2; H *= 2; ax += W / 4; ay += H / 4; continue; }
    break;
  }
  ground.visible = true;
  const fit = size * (spec.fill || 0.86), bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1, f = Math.min(fit / bw, fit / bh), k = k0 * f;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const iax = size / 2 - (cx - ax) * f, iay = size / 2 - (cy - ay) * f + (spec.dy || 0);
  const c = mkCanvas(size, size); frameCell(size, size, iax, iay, k); renderTo(c.getContext('2d'), 0, 0, size, size, 3);
  let out = c;
  if (hasTeam(spec.root)) { const m = mkCanvas(size, size), undo = maskOn(spec.root); renderTo(m.getContext('2d'), 0, 0, size, size, 3); undo(); finishMask(m); out = tint(c, m, spec.team || '#2f6fd6'); }
  scene.remove(spec.root);
  return { webp: out.toDataURL('image/webp', 0.9), meta: { W: size, H: size }, canvas: out };
}
