// Scena 3D pentru randarea sprite-urilor: cameră izometrică (30°, ca în AoE2), soare cu umbre, sol transparent.
import * as THREE from 'three';
export { THREE };

export const PX = 45.2548; // pixeli pe unitate (latura unui pătrățel) la zoom 1
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

export const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xeef3ff, 0x8a7a58, 1.7));
export const sun = new THREE.DirectionalLight(0xfff0d4, 3.3);
sun.position.set(-4, 6.5, -1.6);
scene.add(sun); scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 3;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.012;
const sc = sun.shadow.camera;
export function shadowBox(r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 0.1; sc.far = 30; sc.updateProjectionMatrix(); }
shadowBox(1.5);

export const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.34 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

export const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const dir = new THREE.Vector3(Math.cos(Math.PI / 4) * Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), Math.sin(Math.PI / 4) * Math.cos(Math.PI / 6));
camera.position.copy(dir.multiplyScalar(60));
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);

// celula W x H (pixeli de ieșire), punctul (0,0,0) cade în (ax, ay); k = pixeli de ieșire per pixel la zoom 1
export function frameCell(W, H, ax, ay, k) {
  const P = PX * k;
  camera.left = -ax / P; camera.right = (W - ax) / P; camera.top = ay / P; camera.bottom = -(H - ay) / P;
  camera.updateProjectionMatrix();
}
export function renderTo(ctx, dx, dy, W, H, ss) {
  renderer.setSize(W * ss, H * ss, false);
  renderer.render(scene, camera);
  ctx.drawImage(renderer.domElement, 0, 0, W * ss, H * ss, dx, dy, W, H);
}

// cele 5 direcții randate (ecran): S, SV, V, NV, N; restul se oglindesc
const DIRS = [[1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
export function faceDir(obj, d) {
  const v = DIRS[d], l = Math.hypot(v[0], v[1]);
  obj.rotation.y = Math.atan2(-v[1] / l, v[0] / l);
}

// o foaie cu toate cadrele: rânduri = acțiune x direcție, coloane = cadre
export function bakeSheet(spec) {
  const A = spec.actions, rows = A.length * 5, cols = Math.max(...A.map(a => a.frames));
  const sheet = document.createElement('canvas');
  sheet.width = cols * spec.W; sheet.height = rows * spec.H;
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  frameCell(spec.W, spec.H, spec.ax, spec.ay, spec.k);
  shadowBox(spec.shadow || 1.5);
  scene.add(spec.root);
  const meta = { W: spec.W, H: spec.H, ax: spec.ax, ay: spec.ay, k: spec.k, actions: {} };
  A.forEach((a, ai) => {
    meta.actions[a.name] = { row: ai * 5, frames: a.frames, loop: a.loop !== false };
    for (let d = 0; d < 5; d++) {
      faceDir(spec.root, d);
      for (let f = 0; f < a.frames; f++) {
        spec.reset();
        a.pose(f / a.frames, f);
        spec.root.updateMatrixWorld(true);
        renderTo(ctx, f * spec.W, (ai * 5 + d) * spec.H, spec.W, spec.H, spec.ss || 2);
      }
    }
  });
  scene.remove(spec.root);
  return { png: sheet.toDataURL('image/png'), meta };
}

// o singură imagine (clădiri, copaci, resurse)
export function bakeStill(spec) {
  const c = document.createElement('canvas');
  c.width = spec.W; c.height = spec.H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  frameCell(spec.W, spec.H, spec.ax, spec.ay, spec.k);
  shadowBox(spec.shadow || 3);
  scene.add(spec.root);
  spec.root.updateMatrixWorld(true);
  renderTo(ctx, 0, 0, spec.W, spec.H, spec.ss || 2);
  scene.remove(spec.root);
  return { png: c.toDataURL('image/png'), meta: { W: spec.W, H: spec.H, ax: spec.ax, ay: spec.ay, k: spec.k } };
}
