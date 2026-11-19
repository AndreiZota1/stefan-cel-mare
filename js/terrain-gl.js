// Terenul desenat pe placa video (WebGL2), cu aceeași cameră ca oamenii și clădirile (30°, ca în AoE2):
// relief 3D (dealuri, munți colțuroși, albii sub apă), texturi foto amestecate după tipul terenului, pantă și înălțime,
// lumina soarelui cu umbrele aruncate de munți și ocluzie în văi, apă cu adâncime, valuri, sclipiri și spumă,
// ceața războiului urmând relieful. Dacă placa video nu poate, rămâne terenul vechi (G.Terrain).
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var T = G.TerrainGL = { ok: false };
  var cv = null, gl = null, P = {}, TX = {}, B = {}, aniso = null;
  var texState = 0;               // 0 nimic, 1 se încarcă, 2 gata
  var built = null;               // S-ul pentru care s-a construit
  var N = 0, RF = 4, FW = 0, FH = null, patches = [], wpatch = [], occ = [], bridges = [], occAt = null;
  var PS = 32, NIDX = PS * PS * 6, inst = null, typeT1 = null, lastT1 = -1e9, fogBuf = null;
  var HS = 16 / 39.19;            // o unitate de înălțime, în laturi de pătrățel (16 px față de 39,19 px pe unitate la zoom 1)
  var SUN = (function () { var x = -4, y = -1.6, z = 6.5, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();

  // ---------- umbrele (GLSL) ----------
  var VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aL;
layout(location=1) in vec2 aO;
uniform highp sampler2D uH;
uniform vec4 uXf;    // scara (px la zoom 1 = 1), deplasarea X, deplasarea Y, N
uniform vec4 uVp;    // lățimea și înălțimea vederii (px), RF, ultimul indice fin
uniform float uFlat; // 1 = luciul apei (înălțimea 0)
out vec3 vP;
void main() {
  vec2 g = min(aO + aL, vec2(uVp.w));
  float h = texelFetch(uH, ivec2(g), 0).r;
  vec2 p = g / uVp.z;
  vP = vec3(p, h);
  float hd = mix(h, 0.0, uFlat), k = uXf.x;
  float X = (p.x - p.y) * 32.0 * k + uXf.y, Y = ((p.x + p.y) * 16.0 - hd * 16.0) * k + uXf.z;
  float c = p.x + p.y + hd / 3.0;
  gl_Position = vec4(X * 2.0 / uVp.x - 1.0, 1.0 - Y * 2.0 / uVp.y, 1.0 - 2.0 * (c + 8.0) / (2.0 * uXf.w + 24.0), 1.0);
}`;

  var LIGHT = `
const vec3 SUN = vec3(${SUN[0].toFixed(4)}, ${SUN[1].toFixed(4)}, ${SUN[2].toFixed(4)});
const vec3 SUNC = vec3(1.0, 0.871, 0.658) * 3.3;
const vec3 SKYC = vec3(0.855, 0.896, 1.0) * 1.7;
const vec3 GNDC = vec3(0.254, 0.195, 0.098) * 1.7;
const vec3 VIEW = vec3(0.6124, 0.6124, 0.5);
float sat(float x) { return clamp(x, 0.0, 1.0); }
vec3 srgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
// tonurile ca la randarea oamenilor și clădirilor (ACES, expunere 1,55)
vec3 aces(vec3 c) {
  c *= 1.55 / 0.6;
  c = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777) * c;
  vec3 a = c * (c + 0.0245786) - 0.000090537, b = c * (0.983729 * c + 0.4329510) + 0.238081;
  c = a / b;
  return clamp(mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602) * c, 0.0, 1.0);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
  var COMMON = `#version 300 es
precision highp float;
precision highp sampler2D;
precision mediump sampler2DArray;
in vec3 vP;
out vec4 oC;
uniform vec4 uMap;   // N, iarnă, uscăciune (stepă), verdeață (codri)
uniform vec4 uMisc;  // timp, RF, latura grilei fine (FW), mare (1) sau râu (0)
uniform sampler2D uNz, uNL, uH;
` + LIGHT + `
vec2 fineUV(vec2 p) { return (p * uMisc.y + 0.5) / uMisc.z; }
`;

  // ---------- firele de iarbă: smocuri de câte 3 fire, pictate în bucățile de teren ----------
  // Nu au nevoie de liste: fiecare instanță își calculează locul din numărul ei (o grilă peste pătrățelele bucății),
  // iar locul, înălțimea, aplecarea și culoarea vin din zgomot. Cresc doar unde terenul e iarbă.
  var VS_GRASS = `#version 300 es
precision highp float;
precision highp sampler2D;
layout(location=0) in vec3 aB;   // x: colțul de jos (-1, 1) sau vârful (0); y: 0 jos, 1 sus; z: firul din smoc
uniform sampler2D uH, uT0, uT1, uNL, uNz;
uniform vec4 uXf, uVp, uMap, uMisc;
uniform vec4 uG;                 // x0, y0, coloane (pătrățele), celule pe latura unui pătrățel
out vec3 vC;
` + LIGHT + `
void main() {
  float cpt = uG.w; int cols = int(uG.z * cpt + 0.5), id = gl_InstanceID, row = id / cols;
  vec2 base = uG.xy + vec2(float(id - row * cols), float(row)) / cpt;
  float h1 = hash(base * 1.37 + 0.11), h2 = hash(base * 2.71 + 3.7), h4 = hash(base * 3.33 + 1.9);
  vec2 p = base + vec2(h1, h2) / cpt;
  float Nm = uMap.x, winter = uMap.y, dry = uMap.z;
  vec2 tq = p / Nm, fu = (p * uVp.z + 0.5) / uMisc.z;
  vec4 t0 = textureLod(uT0, tq, 0.0), t1 = textureLod(uT1, tq, 0.0);
  vec4 n1 = textureLod(uNz, p * 0.019, 0.0), n2 = textureLod(uNz, p * 0.071 + 0.31, 0.0), n3 = textureLod(uNz, p * 0.29 + 0.57, 0.0);
  vec4 L0 = textureLod(uNL, fu, 0.0);
  float hgt = textureLod(uH, fu, 0.0).r;
  vec3 nn = vec3(L0.r * 2.0 - 1.0, L0.g * 2.0 - 1.0, 0.0); nn.z = sqrt(max(0.02, 1.0 - dot(nn.xy, nn.xy)));
  // unde crește: nu pe pământ, nisip, stâncă, apă; rar sub copaci; deloc lângă clădiri, la mal și pe pante abrupte
  float bare = max(max(t0.r * 1.1, t0.g), max(t0.b * 1.25, t1.r * 1.6));
  float g = 1.0 - smoothstep(0.2, 0.48, bare + (n3.x - 0.5) * 0.28);
  g *= 1.0 - 0.65 * smoothstep(0.3, 0.7, t1.b);
  g *= 1.0 - smoothstep(0.2, 0.55, t1.a + (n3.y - 0.5) * 0.2);
  g *= 1.0 - 0.45 * t0.a;
  g *= smoothstep(0.1, 0.2, hgt) * (1.0 - smoothstep(0.22, 0.38, 1.0 - nn.z));
  float clump = textureLod(uNz, p * 1.31 + 0.77, 0.0).w;
  float dens = mix(0.45, 1.0, smoothstep(0.3, 0.7, n2.y)) * mix(0.55, 1.1, smoothstep(0.3, 0.7, clump)) * (winter > 0.5 ? 0.1 : 1.0);
  if (h4 > g * dens) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vC = vec3(0.0); return; }
  // firul: aplecat într-o parte, mai lung pe stepă și în pâlcurile dese
  float bi = aB.z, a = hash(base + bi * 1.73) * 6.2832;
  vec2 dir = vec2(cos(a), sin(a)), side = vec2(-dir.y, dir.x);
  vec2 off = (vec2(hash(base + bi * 5.1), hash(base + bi * 7.9)) - 0.5) * (0.7 / cpt);
  float tall = mix(0.035, 0.09, hash(base + bi * 3.3)) * (1.0 + dry * 0.8) * mix(0.6, 1.45, n2.y * n2.y) * mix(0.8, 1.2, clump) * (winter > 0.5 ? 0.8 : 1.0);
  float lean = mix(0.15, 0.6, hash(base + bi * 9.7)), w = 0.013;
  vec2 xy = p + off + side * aB.x * w * (1.0 - aB.y) + dir * lean * tall * aB.y * aB.y;
  float hh = hgt + tall * aB.y * (1.0 - 0.3 * lean * lean) * 2.449;
  float k = uXf.x;
  float X = (xy.x - xy.y) * 32.0 * k + uXf.y, Y = ((xy.x + xy.y) * 16.0 - hh * 16.0) * k + uXf.z;
  float c = xy.x + xy.y + hh / 3.0;
  gl_Position = vec4(X * 2.0 / uVp.x - 1.0, 1.0 - Y * 2.0 / uVp.y, 1.0 - 2.0 * (c + 8.0) / (2.0 * uXf.w + 24.0) - 0.00003, 1.0);
  // culoarea: verde de pajiște, pai pe stepă și iarna, câteva fire uscate peste tot
  float hv = hash(base + bi * 2.2);
  vec3 green = hv < 0.5 ? mix(vec3(0.028, 0.07, 0.018), vec3(0.06, 0.125, 0.026), hv * 2.0) : mix(vec3(0.06, 0.125, 0.026), vec3(0.085, 0.15, 0.04), hv * 2.0 - 1.0);
  vec3 straw = mix(vec3(0.25, 0.2, 0.09), vec3(0.42, 0.35, 0.17), hash(base + bi * 4.4));
  float dryness = sat(dry * smoothstep(0.32, 0.68, n1.y) * 1.1 + smoothstep(2.2, 4.2, hgt) * 0.25 + winter);
  if (hash(base + bi * 6.6) < 0.05) dryness = max(dryness, 0.75);
  vec3 alb = mix(green, straw, dryness) * (0.85 + 0.3 * n2.z);
  // rădăcina în umbra celorlalte fire, vârful prinde lumina; lumina ca la sol
  float ndl = max(dot(nn, SUN), 0.0) * mix(0.55, 1.0, aB.y);
  vec3 hemi = mix(GNDC, SKYC, nn.z * 0.5 + 0.5);
  vec3 tip = mix(vec3(1.0), vec3(1.1, 1.14, 1.0), aB.y);
  vC = alb * tip / 3.14159 * (SUNC * 1.12 * ndl * L0.a + hemi * 0.78 * (0.25 + 0.75 * L0.b) * mix(0.3, 1.0, aB.y));
}`;
  var FS_GRASS = `#version 300 es
precision highp float;
in vec3 vC;
out vec4 oC;
` + LIGHT + `
void main() { oC = vec4(srgb(aces(vC)), 1.0); }`;

  var FS_TER = COMMON + `
uniform sampler2D uT0, uT1;
uniform mediump sampler2DArray uA, uB;
uniform vec3 uGain[16];
vec2 gdx, gdy;
vec3 accA, accN;
// un strat de textură, fără model repetat: două citiri cu deplasări diferite, amestecate după zgomot
void lay(float L, float sc, vec2 p, float w) {
  vec2 uv = p * sc, dx = gdx * sc, dy = gdy * sc;
  float k = textureLod(uNz, p * 0.043 + L * 0.137, 0.0).a * 6.0;
  float ia = floor(k), f = fract(k);
  vec2 oa = fract(sin(vec2(3.1, 7.7) * (ia + L * 13.0)) * 43.7), ob = fract(sin(vec2(3.1, 7.7) * (ia + 1.0 + L * 13.0)) * 43.7);
  float b = smoothstep(0.3, 0.7, f);
  vec3 ca = textureGrad(uA, vec3(uv + oa, L), dx, dy).rgb, cb = textureGrad(uA, vec3(uv + ob, L), dx, dy).rgb;
  vec2 na = textureGrad(uB, vec3(uv + oa, L), dx, dy).rg, nb = textureGrad(uB, vec3(uv + ob, L), dx, dy).rg;
  accA += w * mix(ca, cb, b) * uGain[int(L)];
  vec2 nn = mix(na, nb, b) * 2.0 - 1.0;
  accN += w * vec3(nn.x, -nn.y, 0.0);
}
void main() {
  vec2 p = vP.xy; float h = vP.z;
  gdx = dFdx(p); gdy = dFdy(p);
  float Nm = uMap.x, winter = uMap.y;
  vec4 L0 = texture(uNL, fineUV(p));
  vec3 Nn = vec3(L0.r * 2.0 - 1.0, L0.g * 2.0 - 1.0, 0.0); Nn.z = sqrt(max(0.02, 1.0 - dot(Nn.xy, Nn.xy)));
  float ao = L0.b, sh = L0.a, slope = 1.0 - Nn.z;
  vec4 n1 = texture(uNz, p * 0.019), n2 = texture(uNz, p * 0.071 + 0.31), n3 = texture(uNz, p * 0.29 + 0.57);
  // tipul terenului, citit cu margini neregulate
  vec2 q = p + (n2.xy - 0.5) * 1.15 + (n3.zw - 0.5) * 0.4;
  vec4 t0 = texture(uT0, q / Nm), t1 = texture(uT1, q / Nm);
  float e3 = (n3.x - 0.5) * 0.28;
  float wDirt = smoothstep(0.42, 0.62, t0.r + e3) * (1.0 - 0.6 * uMap.z * smoothstep(0.35, 0.6, n2.x));
  float wFringe = smoothstep(0.1, 0.42, t0.r + e3) * (1.0 - wDirt);
  float wSand = smoothstep(0.4, 0.6, t0.g + e3);
  float rockT = texture(uT0, (p + (n3.xy - 0.5) * 0.5) / Nm).b;
  float wRock = max(smoothstep(0.42, 0.66, rockT + e3 * 1.3), smoothstep(0.36, 0.58, slope));
  float wRockG = smoothstep(0.04, 0.42, rockT + e3) * (1.0 - wRock);
  float wMarsh = smoothstep(0.35, 0.6, t0.a + e3);
  float wForest = smoothstep(0.3, 0.62, t1.b + e3);
  float wWorn = smoothstep(0.25, 0.6, t1.a + e3);
  float under = 1.0 - smoothstep(-0.06, 0.04, h);   // albia, sub apă
  float shore = (1.0 - smoothstep(0.03, 0.13 + 0.1 * n3.y, h)) * smoothstep(0.15, 0.6, t1.g);      // malul ud: o fâșie îngustă, doar lângă apă
  accA = vec3(0.0); accN = vec3(0.0);
  // iarba: pajiște cu petice, mai deasă la umbră și lângă ape, uscată pe stepă și pe culmi
  float gB = smoothstep(0.35, 0.68, n1.x);
  float gK = sat(smoothstep(0.52, 0.78, n1.z) * 0.85 + uMap.w * 0.25 + shore * 0.35 - uMap.z * 0.4);
  float gY = sat(uMap.z * smoothstep(0.32, 0.68, n1.y) * 1.1 + smoothstep(2.2, 4.2, h) * 0.45 * smoothstep(0.45, 0.65, n2.w) - shore);
  float wG = 1.0;
  float sA = (1.0 - gB) * (1.0 - gK) * (1.0 - gY), sB = gB * (1.0 - gK) * (1.0 - gY), sK = gK * (1.0 - gY), sY = gY;
  if (sA > 0.01) lay(0.0, 0.31, p, sA);
  if (sB > 0.01) lay(1.0, 0.29, p, sB);
  if (sK > 0.01) lay(2.0, 0.33, p, sK);
  if (sY > 0.01) lay(3.0, 0.3, p, sY);
  vec3 A = accA, Nd = accN;
  // straturile de deasupra ierbii, în ordinea în care se acoperă
  #define OVER(L, sc, w) if (w > 0.01) { accA = vec3(0.0); accN = vec3(0.0); lay(L, sc, p, 1.0); A = mix(A, accA, w); Nd = mix(Nd, accN, w); }
  float wFor = wForest * (1.0 - wRock);
  OVER(9.0, 0.34, wFor * (1.0 - smoothstep(0.55, 0.8, n2.z)))
  OVER(10.0, 0.36, wFor * smoothstep(0.55, 0.8, n2.z))
  OVER(4.0, 0.3, max(wFringe, wWorn * 0.85) * (1.0 - wRock))
  OVER(5.0, 0.33, wDirt * (1.0 - wRock))
  OVER(2.0, 0.33, wMarsh * (1.0 - wRock))
  OVER(11.0, 0.3, wMarsh * (1.0 - wRock) * smoothstep(0.45, 0.7, n3.x))
  OVER(6.0, 0.29, max(wSand, shore * smoothstep(0.35, 0.65, n2.y) * (1.0 - wMarsh)) * (1.0 - wRock))
  OVER(15.0, 0.26, wRockG)
  float wGrav = wRock * smoothstep(0.5, 0.75, n2.w) * (1.0 - smoothstep(0.3, 0.55, slope));
  OVER(7.0, 0.21, wRock * (1.0 - wGrav))
  OVER(8.0, 0.3, wGrav)
  OVER(14.0, 0.4, under)
  // iarna: zăpadă peste tot, mai subțire pe cărări și sub copaci; stânca abruptă rămâne goală
  if (winter > 0.5) {
    float sn = (1.0 - mix(smoothstep(0.42, 0.62, slope), smoothstep(0.1, 0.26, slope + (n3.y - 0.5) * 0.12), wRock)) * (1.0 - under) * (1.0 - shore * 0.3);
    sn *= 1.0 - wDirt * 0.5 * smoothstep(0.35, 0.65, n3.y) - wForest * 0.3 * (1.0 - n3.x);
    sn = sat(sn * (0.85 + 0.3 * n2.y));
    vec3 a0 = A, n0 = Nd;
    accA = vec3(0.0); accN = vec3(0.0);
    lay(wRock > 0.5 ? 13.0 : 12.0, 0.25, p, 1.0);
    accA = mix(accA, vec3(0.8, 0.83, 0.88) * (0.92 + 0.08 * n3.y), wRock > 0.5 ? 0.15 : 0.5);
    A = mix(a0, accA, sn); Nd = mix(n0, accN * 0.6, sn);
  }
  // sub firele de iarbă, solul stă în umbra lor
  float grassy = (1.0 - max(max(max(wDirt, wSand), max(wRock, wWorn)), max(max(wFor * 0.65, wMarsh * 0.45), max(under, shore)))) * (1.0 - winter);
  A *= mix(1.0, 0.62, grassy);
  // iarna, stânca e rece și cenușie (mușchiul doarme sub ger)
  if (winter > 0.5) { float lr = dot(A, vec3(0.3, 0.55, 0.15)); A = mix(A, vec3(lr) * vec3(0.95, 0.98, 1.05), wRock * 0.65); }
  // pădurea face umbră pe sol; nisipul și pământul de la mal sunt ude
  A *= mix(1.0, 0.72, wFor * (1.0 - winter * 0.5));
  A *= mix(1.0, 0.62, shore * (1.0 - under) * (1.0 - winter));
  // variație mare de culoare, ca să nu fie o singură pastă verde
  A *= 0.93 + 0.14 * n1.w;
  A = mix(A, A * vec3(1.08, 1.0, 0.82), smoothstep(0.55, 0.8, n1.y) * 0.5 * (1.0 - winter));
  // lumina: soarele (cu umbrele munților) și cerul (cu ocluzia văilor)
  vec3 Nf = normalize(vec3(Nn.xy + Nd.xy * 0.55, Nn.z));
  float ndl = max(dot(Nf, SUN), 0.0);
  vec3 hemi = mix(GNDC, SKYC, Nf.z * 0.5 + 0.5);
  vec3 col = A / 3.14159 * (SUNC * 1.12 * ndl * sh + hemi * 0.78 * (0.25 + 0.75 * ao));
  // luciul din bălți (mlaștină)
  float pud = wMarsh * smoothstep(0.64, 0.7, n3.y) * smoothstep(0.4, 0.6, n2.w) * (1.0 - winter);
  col = mix(col, vec3(0.05, 0.08, 0.08) + vec3(0.12, 0.17, 0.22) * (0.6 + 0.4 * sh), pud * 0.8);
  oC = vec4(srgb(aces(col)), 1.0);
}`;

  var FS_WAT = COMMON + `
uniform sampler2D uWn, uWv;
void main() {
  vec2 p = vP.xy;
  float bed = texture(uH, fineUV(p)).r, d = max(-bed, 0.0), on = step(0.0005, d);
  // apa ascunsă de malul din față (calculat o dată, la construirea hărții)
  on *= texture(uWv, fineUV(p)).r;
  float t = uMisc.x, sea = uMisc.w, winter = uMap.y;
  vec2 w1 = texture(uWn, p * 0.21 + vec2(t * 0.019, t * 0.011)).rg * 2.0 - 1.0;
  vec2 w2 = texture(uWn, mat2(0.8, 0.6, -0.6, 0.8) * p * 0.33 - vec2(t * 0.015, -t * 0.022)).rg * 2.0 - 1.0;
  vec2 w3 = texture(uWn, p * 1.05 + vec2(-t * 0.045, t * 0.037)).rg * 2.0 - 1.0;
  vec3 Nw = normalize(vec3((w1 + w2) * 0.2 + w3 * 0.07, 1.0));
  float k = 1.0 - exp(-d * 2.4);
  vec3 shallowC = mix(vec3(0.075, 0.13, 0.085), vec3(0.04, 0.15, 0.15), sea), deepC = mix(vec3(0.014, 0.042, 0.04), vec3(0.01, 0.036, 0.06), sea);
  vec3 body = mix(shallowC, deepC, k);
  float alpha = mix(0.45, 0.96, smoothstep(0.0, 0.4, d));
  float sh = texture(uNL, fineUV(p)).a;
  float fres = 0.02 + 0.98 * pow(1.0 - sat(dot(Nw, VIEW)), 5.0);
  vec3 sky = vec3(0.30, 0.45, 0.72);
  vec3 col = body * (0.55 + 0.45 * sh) + sky * fres * 1.4;
  vec3 Hh = normalize(SUN + VIEW);
  float sp = pow(sat(dot(Nw, Hh)), 260.0) * sh;
  col += SUNC * sp * 1.6;
  // spuma de la mal, care vine și pleacă
  float fn = texture(uNz, p * 0.8 + vec2(t * 0.02, -t * 0.013)).b;
  float foam = (1.0 - smoothstep(0.0, 0.06, d)) * smoothstep(0.42, 0.66, fn + 0.18 * sin(t * 1.3 + (p.x + p.y) * 2.1));
  col = mix(col, vec3(0.62, 0.66, 0.66), foam * 0.6); alpha = max(alpha, foam * 0.7);
  // iarna: gheață la mal, apă rece în larg
  if (winter > 0.5) {
    float ice = (1.0 - smoothstep(0.18, 0.5, d + (fn - 0.5) * 0.35));
    vec3 ic = vec3(0.62, 0.7, 0.78) * (0.85 + 0.15 * texture(uNz, p * 1.7).r) * (0.6 + 0.4 * sh);
    col = mix(col * vec3(0.8, 0.9, 1.0), ic, ice); alpha = mix(alpha, 0.97, ice);
  }
  vec3 c = srgb(aces(col));
  alpha *= on;
  oC = vec4(c * alpha, alpha);
}`;

  var FS_FOG = COMMON + `
uniform sampler2D uFog;
void main() {
  float f = texture(uFog, vP.xy / uMap.x).r;
  float un = 1.0 - smoothstep(0.1, 0.42, f), ex = 1.0 - smoothstep(0.6, 0.94, f);
  float a = max(un, ex * 0.5);
  vec3 c = mix(vec3(0.02, 0.025, 0.04), vec3(0.03, 0.027, 0.024), un);
  oC = vec4(c * a, a);
}`;

  function compile(vs, fs) {
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var a = gl.getActiveUniform(p, i), nm = a.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, a.name); }
    return { p: p, u: u };
  }

  // ---------- pornirea ----------
  T.init = function () {
    if (gl || T.failed) return T.ok;
    try {
      cv = document.createElement('canvas');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('fără WebGL2');
      P.ter = compile(VS, FS_TER); P.wat = compile(VS, FS_WAT); P.fog = compile(VS, FS_FOG); P.grass = compile(VS_GRASS, FS_GRASS);
      aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      // peticul de grilă: (PS+1)² vârfuri, desenat de câte ori trebuie, mutat cu un decalaj pe instanță
      var v = new Float32Array((PS + 1) * (PS + 1) * 2), k = 0, i, j;
      for (j = 0; j <= PS; j++) for (i = 0; i <= PS; i++) { v[k++] = i; v[k++] = j; }
      var idx = new Uint16Array(NIDX); k = 0;
      for (j = 0; j < PS; j++) for (i = 0; i < PS; i++) {
        var a = j * (PS + 1) + i, b = a + 1, c = a + PS + 1, d = c + 1;
        if ((i + j) & 1) { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
        else { idx[k++] = a; idx[k++] = c; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = b; }
      }
      B.vao = gl.createVertexArray(); gl.bindVertexArray(B.vao);
      B.v = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.v); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      B.inst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.inst); gl.bufferData(gl.ARRAY_BUFFER, 8 * 1024, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
      B.idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      // un smoc: 3 fire, fiecare un triunghi subțire
      var gv = new Float32Array(27); for (var b3 = 0; b3 < 3; b3++) gv.set([-1, 0, b3, 1, 0, b3, 0, 1, b3], b3 * 9);
      B.gvao = gl.createVertexArray(); gl.bindVertexArray(B.gvao);
      B.gv = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, B.gv); gl.bufferData(gl.ARRAY_BUFFER, gv, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      TX.nz = noiseTex(); TX.wn = waveTex();
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); T.ok = false; T.failed = true; });
      T.ok = true;
    } catch (e) {
      if (window.console) console.warn('Terenul 3D nu pornește:', e && e.message);
      gl = null; T.ok = false; T.failed = true;
    }
    return T.ok;
  };

  function newTex(target) {
    var t = gl.createTexture(); gl.bindTexture(target || gl.TEXTURE_2D, t); return t;
  }
  function params(target, filt, wrap, mip) {
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : filt);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap);
  }
  // zgomot care se repetă fără cusături (4 canale, scări diferite)
  function noiseTex() {
    var S = 256, d = new Uint8Array(S * S * 4);
    function layer(ch, periods, weights, seed) {
      var t = new Float32Array(S * S), R = G.rng(seed);
      periods.forEach(function (p, pi) {
        var lat = new Float32Array(p * p), L = S / p, w = weights[pi];
        for (var i = 0; i < lat.length; i++) lat[i] = R();
        for (var y = 0; y < S; y++) {
          var fy = y / L, y0 = Math.floor(fy), ty = fy - y0, v = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % p;
          for (var x = 0; x < S; x++) {
            var fx = x / L, x0 = Math.floor(fx), tx = fx - x0, u = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % p;
            var a = lat[y0 * p + x0], b = lat[y0 * p + x1], c = lat[y1 * p + x0], e = lat[y1 * p + x1];
            t[y * S + x] += w * (a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v);
          }
        }
      });
      // întins pe toată plaja 0..1
      var lo = 1, hi = 0, i;
      for (i = 0; i < t.length; i++) { if (t[i] < lo) lo = t[i]; if (t[i] > hi) hi = t[i]; }
      for (i = 0; i < t.length; i++) d[i * 4 + ch] = Math.round((t[i] - lo) / (hi - lo) * 255);
    }
    layer(0, [4, 8, 16], [0.55, 0.3, 0.15], 11);
    layer(1, [8, 16, 32], [0.5, 0.3, 0.2], 23);
    layer(2, [16, 32, 64], [0.55, 0.3, 0.15], 37);
    layer(3, [6, 12, 24], [0.6, 0.28, 0.12], 41);
    var t = newTex(); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.generateMipmap(gl.TEXTURE_2D); params(gl.TEXTURE_2D, gl.LINEAR, gl.REPEAT, true);
    return t;
  }
  // valurile: o sumă de unde cu frecvențe întregi (se repetă fără cusături), păstrată ca normale
  function waveTex() {
    var S = 256, R = G.rng(77), W = [], d = new Uint8Array(S * S * 4), i;
    for (i = 0; i < 28; i++) {
      var kx = Math.round((R() - 0.5) * 22), ky = Math.round((R() - 0.5) * 22); if (!kx && !ky) kx = 1;
      var kl = Math.hypot(kx, ky); W.push([kx, ky, 0.55 / Math.pow(kl, 1.15), R() * 6.283]);
    }
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var gx = 0, gy = 0, hh = 0;
      for (i = 0; i < W.length; i++) {
        var w = W[i], ph = (w[0] * x + w[1] * y) / S * 6.283 + w[3], c = Math.cos(ph) * w[2];
        gx += c * w[0]; gy += c * w[1]; hh += Math.sin(ph) * w[2];
      }
      var o = (y * S + x) * 4, sc = 0.09;
      d[o] = Math.max(0, Math.min(255, 128 - gx * sc * 128)); d[o + 1] = Math.max(0, Math.min(255, 128 - gy * sc * 128)); d[o + 2] = Math.max(0, Math.min(255, 128 + hh * 120)); d[o + 3] = 255;
    }
    var t = newTex(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.generateMipmap(gl.TEXTURE_2D); params(gl.TEXTURE_2D, gl.LINEAR, gl.REPEAT, true);
    return t;
  }

  // texturile foto: se încarcă în fundal (fișier separat, ~2 MB), terenul vechi ține locul până atunci
  T.loadTextures = function () {
    if (!T.init() || texState) return;
    texState = 1;
    function go() {
      var X = G.TEXT; if (!X) { texState = 0; return; }
      var n = X.names.length;
      Promise.all(X.d.concat(X.n).map(function (src) { var im = new Image(); im.src = src; return im.decode().then(function () { return im; }); })).then(function (ims) {
        if (!gl) return;
        TX.alb = newTex(gl.TEXTURE_2D_ARRAY);
        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 10, gl.SRGB8_ALPHA8, 512, 512, n);
        TX.nor = null;
        for (var i = 0; i < n; i++) { gl.bindTexture(gl.TEXTURE_2D_ARRAY, TX.alb); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, 512, 512, 1, gl.RGBA, gl.UNSIGNED_BYTE, ims[i]); }
        gl.generateMipmap(gl.TEXTURE_2D_ARRAY); params(gl.TEXTURE_2D_ARRAY, gl.LINEAR, gl.REPEAT, true);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        TX.nor = newTex(gl.TEXTURE_2D_ARRAY);
        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 9, gl.RGBA8, 256, 256, n);
        for (i = 0; i < n; i++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, 256, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, ims[n + i]);
        gl.generateMipmap(gl.TEXTURE_2D_ARRAY); params(gl.TEXTURE_2D_ARRAY, gl.LINEAR, gl.REPEAT, true);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        texState = 2;
      }).catch(function (e) { if (window.console) console.warn('Texturile terenului:', e && e.message); T.ok = false; T.failed = true; });
    }
    if (G.TEXT) go();
    else { var s = document.createElement('script'); s.src = 'js/tex-teren.js'; s.onload = go; s.onerror = function () { T.ok = false; T.failed = true; }; document.head.appendChild(s); }
  };
  T._gl = function () { return gl; };
  T.active = function () { return T.ok && texState === 2 && built === G.S && !!G.S; };

  // ---------- construirea pe hartă ----------
  T.build = function () {
    var S = G.S; built = null;
    if (!T.ok || !S) return;
    if (!S.hgt && G.heightField) S.hgt = G.heightField({ N: S.N, ter: S.ter, seed: (S.seed % 1000000) + 17 }, (S.map && S.map.type) || 'rau', S.base || [], !!S.scen);
    var F = G.relief(); if (!F) return;
    N = S.N; RF = F.RF; FW = F.W; FH = F.h;
    // înălțimile
    TX.h = TX.h || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, TX.h);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, FW, FW, 0, gl.RED, gl.FLOAT, FH);
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
    // lumina gătită o dată: normale, umbrele munților, ocluzia văilor
    TX.nl = TX.nl || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, TX.nl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, FW, FW, 0, gl.RGBA, gl.UNSIGNED_BYTE, bakeLight());
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
    // luciul apei (înălțimea 0) se vede doar dacă raza spre cameră (+1, +1 și +2 în înălțime pe pas) nu e tăiată de mal
    var wv = new Uint8Array(FW * FW);
    for (var wy = 0; wy < FW; wy++) for (var wx = 0; wx < FW; wx++) {
      if (FH[wy * FW + wx] > 0.3) continue;
      var x0 = wx / RF, y0 = wy / RF, ex = -1;
      for (var st = 1; st <= 18; st++) { var tt = st * 0.12, v = fAt(x0 + tt, y0 + tt) - 2 * tt; if (v > ex) ex = v; }
      wv[wy * FW + wx] = Math.round((1 - smooth(-0.03, 0.05, ex)) * 255);
    }
    TX.wv = TX.wv || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, TX.wv); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FW, FW, 0, gl.RED, gl.UNSIGNED_BYTE, wv);
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
    // tipurile de teren
    var t0 = new Uint8Array(N * N * 4); typeT1 = new Uint8Array(N * N * 4);
    // apropierea de apă (pentru malul ud): distanța în pătrățele până la apă sau vad
    var dw = new Float32Array(N * N), q = [], qi;
    for (var i = 0; i < N * N; i++) { var tw = S.ter[i]; if (tw === 2 || tw === 3 || tw === 4) { dw[i] = 0; q.push(i); } else dw[i] = 1e9; }
    for (qi = 0; qi < q.length; qi++) {
      var c0 = q[qi], cx0 = c0 % N, cy0 = (c0 - cx0) / N;
      for (var dd = 0; dd < 4; dd++) {
        var nx0 = cx0 + (dd === 0 ? 1 : dd === 1 ? -1 : 0), ny0 = cy0 + (dd === 2 ? 1 : dd === 3 ? -1 : 0);
        if (nx0 < 0 || ny0 < 0 || nx0 >= N || ny0 >= N) continue;
        var j0 = ny0 * N + nx0; if (dw[j0] > dw[c0] + 1) { dw[j0] = dw[c0] + 1; q.push(j0); }
      }
    }
    for (i = 0; i < N * N; i++) {
      var t = S.ter[i];
      t0[i * 4] = t === 1 ? 255 : 0; t0[i * 4 + 1] = t === 6 ? 255 : 0; t0[i * 4 + 2] = t === 5 ? 255 : 0; t0[i * 4 + 3] = t === 7 ? 255 : 0;
      typeT1[i * 4] = t === 2 || t === 4 ? 255 : 0; typeT1[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, 1 - (dw[i] - 0.5) / 2)) * 255);
    }
    TX.t0 = TX.t0 || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, TX.t0); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, t0);
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
    TX.t1 = TX.t1 || gl.createTexture(); lastT1 = -1e9; updateT1(true);
    // ceața
    fogBuf = new Uint8Array(N * N * 4);
    TX.fog = TX.fog || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, TX.fog);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, N * 2, N * 2, 0, gl.RED, gl.UNSIGNED_BYTE, fogBuf);
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
    // peticele, cu înălțimea minimă și maximă (ca să desenăm doar ce se vede)
    patches = []; wpatch = [];
    var np = Math.ceil((FW - 1) / PS);
    for (var py = 0; py < np; py++) for (var px = 0; px < np; px++) {
      var lo = 1e9, hi = -1e9, wet = false;
      for (var y = py * PS; y <= Math.min(FW - 1, py * PS + PS); y++) for (var x = px * PS; x <= Math.min(FW - 1, px * PS + PS); x++) {
        var hv = FH[y * FW + x]; if (hv < lo) lo = hv; if (hv > hi) hi = hv; if (hv < 0) wet = true;
      }
      var pc = { ox: px * PS, oy: py * PS, x0: px * PS / RF, y0: py * PS / RF, x1: Math.min(FW - 1, px * PS + PS) / RF, y1: Math.min(FW - 1, py * PS + PS) / RF, lo: Math.min(lo, 0), hi: Math.max(hi, 0) };
      patches.push(pc); if (wet) wpatch.push(pc);
    }
    // pătrățelele de stâncă înalte: ascund ce e în spatele lor (redesenate după oamenii din spate)
    occ = []; occAt = new Uint8Array(N * N); bridges = [];
    for (var ty = 0; ty < N; ty++) for (var tx = 0; tx < N; tx++) {
      var tt = S.ter[ty * N + tx];
      if (tt === 4) bridges.push([tx, ty]);
      if (tt !== 5) continue;
      var mx = 0;
      for (var fy = ty * RF; fy <= ty * RF + RF; fy++) for (var fx = tx * RF; fx <= tx * RF + RF; fx++) mx = Math.max(mx, FH[fy * FW + fx]);
      if (mx > 1.1) { occ.push([tx, ty]); occAt[ty * N + tx] = 1; }
    }
    hiAll = 0; loAll = 0;
    for (var q = 0; q < FH.length; q++) { if (FH[q] > hiAll) hiAll = FH[q]; if (FH[q] < loAll) loAll = FH[q]; }
    cache.clear(); curK = 0; frameNo = 0;
    built = S; fogDirty = true; fogReady = null;
  };

  // pădurea (copacii vii) și pământul bătătorit din jurul clădirilor; se reface din când în când
  function updateT1(force) {
    var S = G.S, now = performance.now();
    if (!force && now - lastT1 < 1500) return;
    lastT1 = now;
    var d = typeT1, i, prev = d.slice();
    for (i = 0; i < N * N; i++) { d[i * 4 + 2] = 0; d[i * 4 + 3] = 0; }
    S.ents.forEach(function (e) {
      if (e.dead) return;
      if (e.k === 'r' && e.t === 'tree') d[(Math.floor(e.y) * N + Math.floor(e.x)) * 4 + 2] = 255;
      else if (e.k === 'b' && e.built !== undefined) {
        var n = e.n || 1, wall = G.BLDS[e.t] && G.BLDS[e.t].wall;
        if (wall || e.t === 'ogor') return;
        for (var y = e.ty - 1; y <= e.ty + n; y++) for (var x = e.tx - 1; x <= e.tx + n; x++) {
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          var inside = x >= e.tx && y >= e.ty && x < e.tx + n && y < e.ty + n, o = (y * N + x) * 4 + 3;
          d[o] = Math.max(d[o], inside ? 255 : 150);
        }
      }
    });
    if (!force) {
      var ch = [];
      for (i = 0; i < N * N; i++) if (prev[i * 4 + 2] !== d[i * 4 + 2] || prev[i * 4 + 3] !== d[i * 4 + 3]) ch.push([i % N, (i / N) | 0]);
      if (!ch.length) return;
      invalidate(ch);
    }
    gl.bindTexture(gl.TEXTURE_2D, TX.t1); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    params(gl.TEXTURE_2D, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  }

  function fAt(x, y) {
    var M = FW - 1.001; x *= RF; y *= RF; x = x < 0 ? 0 : x > M ? M : x; y = y < 0 ? 0 : y > M ? M : y;
    var ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, j = iy * FW + ix;
    return (FH[j] * (1 - fx) + FH[j + 1] * fx) * (1 - fy) + (FH[j + FW] * (1 - fx) + FH[j + FW + 1] * fx) * fy;
  }
  // normale, umbra aruncată de relief spre soare și ocluzia (cât cer vede fiecare punct)
  function bakeLight() {
    var out = new Uint8Array(FW * FW * 4), e = 1 / RF;
    var lh = Math.hypot(SUN[0], SUN[1]), sdx = SUN[0] / lh, sdy = SUN[1] / lh, rise = SUN[2] / lh / HS;
    var DIRS = []; for (var a = 0; a < 8; a++) DIRS.push([Math.cos(a * Math.PI / 4 + 0.39), Math.sin(a * Math.PI / 4 + 0.39)]);
    var RAD = [0.3, 0.75, 1.6, 3.0];
    for (var j = 0; j < FW; j++) for (var i = 0; i < FW; i++) {
      var o = j * FW + i, h0 = Math.max(FH[o], -0.02), x = i * e, y = j * e;
      var hl = FH[j * FW + Math.max(0, i - 1)], hr = FH[j * FW + Math.min(FW - 1, i + 1)], hu = FH[Math.max(0, j - 1) * FW + i], hd = FH[Math.min(FW - 1, j + 1) * FW + i];
      var dx = (hr - hl) * RF * 0.5 * HS, dy = (hd - hu) * RF * 0.5 * HS, nl = Math.hypot(dx, dy, 1), nx = -dx / nl, ny = -dy / nl;
      // umbra: mergem spre soare și vedem dacă relieful trece peste rază
      var ex = -1;
      for (var s = 1; s <= 16; s++) {
        var dd = s * 0.22, px = x + sdx * dd, py = y + sdy * dd;
        if (px < 0 || py < 0 || px > N || py > N) break;
        var v = fAt(px, py) - (h0 + dd * rise); if (v > ex) ex = v;
      }
      var shd = 1 - smooth(-0.04, 0.3, ex);
      // ocluzia: cât de sus se ridică orizontul în jur
      var occl = 0;
      for (var k = 0; k < 8; k++) {
        var best = 0;
        for (var r = 0; r < 4; r++) {
          var qx = x + DIRS[k][0] * RAD[r], qy = y + DIRS[k][1] * RAD[r];
          var tn = (Math.max(fAt(qx, qy), -0.02) - h0) * HS / RAD[r]; if (tn > best) best = tn;
        }
        occl += best / Math.sqrt(1 + best * best);
      }
      var ao = 1 - Math.min(0.85, occl / 8 * 1.35);
      out[o * 4] = Math.round((nx * 0.5 + 0.5) * 255); out[o * 4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[o * 4 + 2] = Math.round(ao * 255); out[o * 4 + 3] = Math.round(shd * 255);
    }
    return out;
  }
  function smooth(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  // ---------- desenarea ----------
  // corecția de culoare pe strat (texturile foto vin din locuri diferite): iarba spre verde, pământul spre brun
  var GAIN = [
    [0.84, 1.0, 0.8], [0.84, 0.98, 0.82], [0.86, 1.02, 0.86], [0.92, 0.92, 0.8], [0.84, 0.84, 0.76], [0.78, 0.7, 0.62], [0.98, 0.88, 0.7], [0.9, 0.93, 0.9],
    [0.88, 0.88, 0.88], [0.86, 0.9, 0.8], [0.9, 0.86, 0.8], [0.8, 0.78, 0.72], [1.0, 1.0, 1.0], [0.95, 0.97, 1.0], [0.5, 0.52, 0.42], [0.86, 0.92, 0.84]
  ];
  var gainArr = null;
  // vederea: X = (x - y)·32·k + dx, Y = ((x + y)·16 - h·16)·k + dy, pe o suprafață vw × vh
  function setCommon(pr, V, t) {
    var S = G.S, u = pr.u, ty = (S.map && S.map.type) || 'rau';
    gl.uniform4f(u.uXf, V.k, V.dx, V.dy, N);
    gl.uniform4f(u.uVp, V.vw, V.vh, RF, FW - 1);
    if (u.uMap) gl.uniform4f(u.uMap, N, S.map && S.map.season === 'iarna' ? 1 : 0, ty === 'stepa' ? 1 : 0.15, ty === 'codri' ? 1 : ty === 'delta' ? 0.6 : 0.3);
    if (u.uMisc) gl.uniform4f(u.uMisc, t, RF, FW, ty === 'mare' || ty === 'lac' ? 1 : 0);
    var unit = 0;
    function bind(name, tex, target) { if (u[name] === undefined || u[name] === null) return; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(target || gl.TEXTURE_2D, tex); gl.uniform1i(u[name], unit); unit++; }
    bind('uH', TX.h); bind('uNz', TX.nz); bind('uNL', TX.nl);
    return bind;
  }
  function screenView(cam, W, H) { return { k: cam.z, dx: W / 2 - (cam.x - cam.y) * 32 * cam.z, dy: H / 2 - (cam.x + cam.y) * 16 * cam.z, vw: W, vh: H }; }
  function visible(V, list, box) {
    var out = [], k = V.k;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var x0 = (p.x0 - p.y1) * 32 * k + V.dx, x1 = (p.x1 - p.y0) * 32 * k + V.dx;
      var y0 = ((p.x0 + p.y0) * 16 - p.hi * 16) * k + V.dy, y1 = ((p.x1 + p.y1) * 16 - p.lo * 16) * k + V.dy;
      if (x1 < 0 || x0 > V.vw || y1 < 0 || y0 > V.vh) continue;
      out.push(p.ox, p.oy);
      if (box) { box[0] = Math.min(box[0], x0); box[1] = Math.min(box[1], y0); box[2] = Math.max(box[2], x1); box[3] = Math.max(box[3], y1); }
    }
    return out;
  }
  function drawPatches(arr) {
    if (!arr.length) return;
    if (!inst || inst.length < arr.length) inst = new Float32Array(Math.max(arr.length, 512));
    inst.set(arr);
    gl.bindVertexArray(B.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, B.inst); gl.bufferData(gl.ARRAY_BUFFER, inst.subarray(0, arr.length), gl.DYNAMIC_DRAW);
    gl.drawElementsInstanced(gl.TRIANGLES, NIDX, gl.UNSIGNED_SHORT, 0, arr.length / 2);
  }
  // pânza WebGL are măcar mărimea ecranului (și a unei bucăți de teren)
  function fit(w, h) {
    w = Math.max(CS, Math.round(w)); h = Math.max(CS, Math.round(h));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  }
  // pânza WebGL: sus apa (pe ecranele dese, la jumătate: valurile nu pierd nimic), dedesubt ceața (la jumătate, are margini moi)
  function layout(W, H, DPR) {
    var Wd = Math.round(W * DPR), Hd = Math.round(H * DPR), wq = DPR >= 1.5 ? DPR / 2 : DPR;
    return { Wd: Wd, Hd: Hd, wq: wq, Ww: Math.ceil(W * wq), Hw: Math.ceil(H * wq), Wf: Math.ceil(Wd / 2), Hf: Math.ceil(Hd / 2) };
  }
  function fitAll(W, H, DPR) { var L = layout(W, H, DPR); fit(Math.max(L.Ww, L.Wf), L.Hw + L.Hf); }

  // ---------- bucățile de teren, pictate o dată și păstrate (ca la terenul vechi) ----------
  // Spațiul unei trepte de zoom k: X = (x - y)·32k + offX, Y = ((x + y)·16 - h·16)·k + offY; bucăți de CS × CS pixeli.
  var CS = 512, MAXC = 72, cache = new Map(), frameNo = 0, curK = 0, prevK = 0, wantK = 0, wantSince = 0, lastMissing = 0;
  var hiAll = 0, loAll = 0, dirtyTiles = null;
  function offX(k) { return N * 32 * k; }
  function offY(k) { return (hiAll + 0.6) * 16 * k; }
  function kOf(zd) { return zd <= 1.25 ? 1 : zd <= 2.45 ? 2 : 3; }
  // pătrățelele din care poate veni o bucată (relieful ridică pe ecran pătrățele de mai jos)
  function chunkTiles(k, cx, cy) {
    var X0 = cx * CS - offX(k), X1 = X0 + CS, Y0 = cy * CS - offY(k), Y1 = Y0 + CS;
    var a0 = X0 / (32 * k), a1 = X1 / (32 * k), b0 = Y0 / (16 * k) + loAll, b1 = Y1 / (16 * k) + hiAll;
    // x - y ∈ [a0, a1], x + y ∈ [b0, b1]
    return [Math.max(0, Math.floor((a0 + b0) / 2) - 1), Math.min(N - 1, Math.ceil((a1 + b1) / 2) + 1), Math.max(0, Math.floor((b0 - a1) / 2) - 1), Math.min(N - 1, Math.ceil((b1 - a0) / 2) + 1)];
  }
  function chunkUseful(k, cx, cy) {
    var r = chunkTiles(k, cx, cy), exp = G.S.exp;
    if (r[0] > r[1] || r[2] > r[3]) return false;
    var X0 = cx * CS - offX(k), X1 = X0 + CS, Y0 = cy * CS - offY(k), Y1 = Y0 + CS;
    for (var y = r[2]; y <= r[3]; y++) for (var x = r[0]; x <= r[1]; x++) {
      if (!exp[y * N + x]) continue;
      var a = (x - y) * 32 * k, b = (x + y) * 16 * k;
      if (a + 64 * k < X0 || a - 64 * k > X1) continue;
      if (b + 48 * k - loAll * 16 * k < Y0 || b - 16 * k - hiAll * 16 * k > Y1) continue;
      return true;
    }
    return false;
  }
  // ținta cu netezire a marginilor (firele de iarbă sunt mai subțiri decât un pixel)
  function chunkFBO() {
    if (B.fbo !== undefined) return !!B.fbo;
    try {
      var sm = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0); if (sm < 2) { B.fbo = null; return false; }
      B.fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo);
      var rc = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rc); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, sm, gl.RGBA8, CS, CS);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rc);
      var rd = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rd); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, sm, gl.DEPTH_COMPONENT24, CS, CS);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rd);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) B.fbo = null;
    } catch (e) { B.fbo = null; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return !!B.fbo;
  }
  function drawGrass(V, k, cx, cy, t) {
    var r = chunkTiles(k, cx, cy), cpt = 8, cols = r[1] - r[0] + 1, rows = r[3] - r[2] + 1;
    if (cols <= 0 || rows <= 0) return;
    gl.useProgram(P.grass.p);
    var u = P.grass.u, bind = setCommon(P.grass, V, t);
    bind('uT0', TX.t0); bind('uT1', TX.t1);
    gl.uniform4f(u.uG, r[0], r[2], cols, cpt);
    gl.bindVertexArray(B.gvao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 9, cols * cpt * rows * cpt);
  }
  function genChunk(k, cx, cy, t) {
    var c = document.createElement('canvas'); c.width = c.height = CS;
    var V = { k: k, dx: offX(k) - cx * CS, dy: offY(k) - cy * CS, vw: CS, vh: CS }, ms = chunkFBO();
    if (ms) gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo);
    gl.viewport(0, 0, CS, CS); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, CS, CS);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
    gl.useProgram(P.ter.p);
    var bind = setCommon(P.ter, V, t);
    bind('uT0', TX.t0); bind('uT1', TX.t1); bind('uA', TX.alb, gl.TEXTURE_2D_ARRAY); bind('uB', TX.nor, gl.TEXTURE_2D_ARRAY);
    if (!gainArr) { gainArr = new Float32Array(48); GAIN.forEach(function (g, i) { gainArr.set(g, i * 3); }); }
    gl.uniform3fv(P.ter.u.uGain, gainArr);
    gl.uniform1f(P.ter.u.uFlat, 0);
    drawPatches(visible(V, patches));
    if (T.grass !== false) drawGrass(V, k, cx, cy, t);
    gl.disable(gl.SCISSOR_TEST);
    if (ms) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, B.fbo); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(0, 0, CS, CS, 0, 0, CS, CS, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    c.getContext('2d').drawImage(cv, 0, cv.height - CS, CS, CS, 0, 0, CS, CS);
    return c;
  }
  function pass(ctx, cam, W, H, DPR, k, gen, budgetEnd, draw, margin, t) {
    var zd = cam.z * DPR, s = zd / k, Wd = W * DPR, Hd = H * DPR;
    var Xc = (cam.x - cam.y) * 32 * k + offX(k), Yc = (cam.x + cam.y) * 16 * k + offY(k);
    var cx0 = Math.max(0, Math.floor((Xc - Wd / 2 / s) / CS) - margin), cx1 = Math.min(Math.ceil(N * 64 * k / CS) - 1, Math.floor((Xc + Wd / 2 / s) / CS) + margin);
    var cy0 = Math.max(0, Math.floor((Yc - Hd / 2 / s) / CS) - margin), cy1 = Math.min(Math.ceil((N * 32 * k + offY(k) - loAll * 16 * k + 32 * k) / CS) - 1, Math.floor((Yc + Hd / 2 / s) / CS) + margin);
    var missing = 0;
    for (var cy = cy0; cy <= cy1; cy++) for (var cx = cx0; cx <= cx1; cx++) {
      var key = k + ':' + cx + ':' + cy, ch = cache.get(key);
      if ((!ch || ch.stale) && gen && performance.now() < budgetEnd && chunkUseful(k, cx, cy)) {
        ch = { c: genChunk(k, cx, cy, t), used: frameNo }; cache.set(key, ch);
      } else if (!ch) { if (gen && chunkUseful(k, cx, cy)) missing++; continue; }
      else if (ch.stale) missing++;
      ch.used = frameNo;
      if (draw) {
        var dx = Math.floor((cx * CS - Xc) * s + Wd / 2), dy = Math.floor((cy * CS - Yc) * s + Hd / 2), dw = Math.ceil(CS * s) + 1;
        ctx.drawImage(ch.c, dx, dy, dw, dw);
      }
    }
    return missing;
  }
  // bucățile atinse de pădurea tăiată sau de clădirile noi se repictează
  function invalidate(tiles) {
    if (!tiles.length) return;
    cache.forEach(function (ch, key) {
      var a = key.split(':'), k = +a[0], cx = +a[1], cy = +a[2], X0 = cx * CS - offX(k), Y0 = cy * CS - offY(k);
      for (var i = 0; i < tiles.length; i++) {
        var x = tiles[i][0], y = tiles[i][1], X = (x - y) * 32 * k, Y = (x + y) * 16 * k;
        if (X + 120 * k < X0 || X - 120 * k > X0 + CS) continue;
        if (Y + 80 * k - loAll * 16 * k < Y0 || Y - 50 * k - hiAll * 16 * k > Y0 + CS) continue;
        ch.stale = true; break;
      }
    });
  }
  T.draw = function (ctx, cam, W, H, DPR, t) {
    if (!T.active()) return false;
    frameNo++;
    updateT1(false);
    var zd = cam.z * DPR, kd = kOf(zd), now = performance.now();
    if (!curK) { curK = kd; wantK = kd; }
    if (kd !== wantK) { wantK = kd; wantSince = now; }
    if (wantK !== curK && now - wantSince > 220) { prevK = curK; curK = wantK; lastMissing = 1; }
    fitAll(W, H, DPR);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (lastMissing) [prevK, 1, 2, 3].forEach(function (kk, i) { if (kk && kk !== curK && (i === 0 || kk !== prevK)) pass(ctx, cam, W, H, DPR, kk, false, 0, true, 0, t); });
    lastMissing = pass(ctx, cam, W, H, DPR, curK, true, now + 9, true, 0, t);
    if (!lastMissing) pass(ctx, cam, W, H, DPR, curK, true, now + 4, false, 1, t);
    ctx.restore();
    if (cache.size > MAXC) {
      var arr = Array.from(cache.entries()).sort(function (a, b) { return a[1].used - b[1].used; });
      for (var i = 0; i < arr.length - MAXC * 0.8; i++) cache.delete(arr[i][0]);
    }
    // un singur cadru WebGL pe cadru de joc (copierea în desenul 2D costă la fel pentru una sau mai multe bucăți):
    // sus, apa vie (mărime întreagă); dedesubt, ceața (jumătate de mărime, are oricum margini moi)
    var L = layout(W, H, DPR);
    fitAll(W, H, DPR);
    if (fogDirty) { fogDirty = false; gl.bindTexture(gl.TEXTURE_2D, TX.fog); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N * 2, N * 2, gl.RED, gl.UNSIGNED_BYTE, fogBuf); }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var V = screenView(cam, W, H), box = [1e9, 1e9, -1e9, -1e9], arr2 = wpatch.length ? visible(V, wpatch, box) : [];
    if (arr2.length) {
      gl.viewport(0, cv.height - L.Hw, L.Ww, L.Hw);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(P.wat.p);
      var b2 = setCommon(P.wat, V, t);
      b2('uWn', TX.wn); b2('uWv', TX.wv);
      gl.uniform1f(P.wat.u.uFlat, 1);
      drawPatches(arr2);
    }
    gl.viewport(0, cv.height - L.Hw - L.Hf, L.Wf, L.Hf);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
    gl.useProgram(P.fog.p);
    var b3 = setCommon(P.fog, V, t);
    b3('uFog', TX.fog);
    gl.uniform1f(P.fog.u.uFlat, 0);
    drawPatches(visible(V, patches));
    fogReady = L;
    if (arr2.length) {
      var bx0 = Math.max(0, Math.floor(box[0])), by0 = Math.max(0, Math.floor(box[1])), bx1 = Math.min(W, Math.ceil(box[2])), by1 = Math.min(H, Math.ceil(box[3]));
      if (bx1 > bx0 && by1 > by0) {
        var q = L.wq;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
        ctx.drawImage(cv, bx0 * q, by0 * q, (bx1 - bx0) * q, (by1 - by0) * q, bx0 * DPR, by0 * DPR, (bx1 - bx0) * DPR, (by1 - by0) * DPR);
        ctx.restore();
      }
    }
    return true;
  };
  T.prewarm = function (cam, W, H, DPR) {
    if (!T.active()) return;
    var k = kOf(cam.z * DPR); curK = wantK = k; fitAll(W, H, DPR);
    pass(null, cam, W, H, DPR, k, true, performance.now() + 5000, false, 0, 0);
  };

  // ceața războiului, pe relief: se pregătește aici, se urcă pe placa video la următorul cadru
  var fogDirty = false, fogReady = null;
  // la rezoluție dublă și netezită, ca marginea ceții să fie moale, nu în trepte
  var fogRaw = null, fogTmp = null;
  T.fogUpdate = function () {
    if (!T.active()) return;
    var S = G.S, vis = G.C.vis, exp = S.exp, M = N * 2, i, x, y;
    if (!fogRaw || fogRaw.length !== N * N) { fogRaw = new Float32Array(N * N); fogTmp = new Float32Array(M * M); }
    for (i = 0; i < N * N; i++) fogRaw[i] = !exp[i] ? 0 : vis[i] ? 255 : 128;
    // dublare (fiecare pătrățel în 2 × 2), apoi două treceri de netezire [1 2 1] pe fiecare axă
    for (y = 0; y < M; y++) for (x = 0; x < M; x++) fogTmp[y * M + x] = fogRaw[(y >> 1) * N + (x >> 1)];
    for (var it = 0; it < 2; it++) {
      for (y = 0; y < M; y++) { var r = y * M, a = fogTmp[r], b = fogTmp[r]; for (x = 0; x < M; x++) { var c = fogTmp[r + Math.min(M - 1, x + 1)]; var v = (a + 2 * b + c) * 0.25; a = b; b = c; fogTmp[r + x] = v; } }
      for (x = 0; x < M; x++) { var a2 = fogTmp[x], b2 = fogTmp[x]; for (y = 0; y < M; y++) { var c2 = fogTmp[Math.min(M - 1, y + 1) * M + x]; var v2 = (a2 + 2 * b2 + c2) * 0.25; a2 = b2; b2 = c2; fogTmp[y * M + x] = v2; } }
    }
    for (i = 0; i < M * M; i++) fogBuf[i] = fogTmp[i];
    fogDirty = true;
  };
  // după oameni și clădiri: doar copiem ceața desenată la începutul cadrului
  T.fogDraw = function (ctx, cam, W, H, DPR, t) {
    if (!T.active() || !fogReady) return false;
    var f = fogReady; fogReady = null;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv, 0, f.Hw, f.Wf, f.Hf, 0, 0, f.Wd, f.Hd);
    ctx.restore();
    return true;
  };

  // ---------- munții care ascund ce e în spatele lor ----------
  // Pentru fiecare pătrățel de stâncă înalt de pe ecran: un obiect în lista de desenare, cu cheia colțului din spate.
  T.occluders = function (minX, maxX, minY, maxY, exp) {
    if (!T.active()) return [];
    var out = [];
    for (var i = 0; i < occ.length; i++) {
      var o = occ[i]; if (o[0] < minX - 1 || o[0] > maxX + 1 || o[1] < minY - 1 || o[1] > maxY + 1) continue;
      if (!exp[o[1] * N + o[0]]) continue;
      out.push({ k: 'occ', x: o[0], y: o[1], tx: o[0], ty: o[1] });
    }
    return out;
  };
  T.isOcc = function (tx, ty) { return !!(occAt && tx >= 0 && ty >= 0 && tx < N && ty < N && occAt[ty * N + tx]); };
  // redesenează suprafața pătrățelului (tăiată pe forma lui) din bucățile de teren păstrate, peste ce s-a desenat înainte
  T.drawOcc = function (ctx, o, cam, W, H, DPR) {
    var z = cam.z, cx = cam.x - cam.y, cy = cam.x + cam.y, tx = o.tx, ty = o.ty, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    function Pt(x, y) { var h = FH[Math.round(y * RF) * FW + Math.round(x * RF)]; return [((x - y - cx) * 32 * z + W / 2) * DPR, ((x + y - cy) * 16 * z + H / 2 - h * 16 * z) * DPR]; }
    var pts = [], st = 1 / RF, i, j;
    for (j = 0; j <= RF; j++) { pts[j] = []; for (i = 0; i <= RF; i++) { var p = Pt(tx + i * st, ty + j * st); pts[j][i] = p; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } }
    var Wd = W * DPR, Hd = H * DPR;
    if (x1 < 0 || x0 > Wd || y1 < 0 || y0 > Hd) return;
    var k = curK || kOf(z * DPR), s = z * DPR / k, Xc = (cam.x - cam.y) * 32 * k + offX(k), Yc = (cam.x + cam.y) * 16 * k + offY(k);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    for (j = 0; j < RF; j++) for (i = 0; i < RF; i++) {
      var a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
    }
    ctx.clip('nonzero');
    // bucățile care acoperă dreptunghiul pătrățelului
    var X0 = (x0 - Wd / 2) / s + Xc, X1 = (x1 - Wd / 2) / s + Xc, Y0 = (y0 - Hd / 2) / s + Yc, Y1 = (y1 - Hd / 2) / s + Yc;
    for (var qy = Math.floor(Y0 / CS); qy <= Math.floor(Y1 / CS); qy++) for (var qx = Math.floor(X0 / CS); qx <= Math.floor(X1 / CS); qx++) {
      var ch = cache.get(k + ':' + qx + ':' + qy); if (!ch) continue;
      var dx = Math.floor((qx * CS - Xc) * s + Wd / 2), dy = Math.floor((qy * CS - Yc) * s + Hd / 2), dw = Math.ceil(CS * s) + 1;
      ctx.drawImage(ch.c, dx, dy, dw, dw);
    }
    ctx.restore();
  };

  // podurile: scânduri peste apă, cu balustrade pe marginile dinspre apă
  T.drawBridges = function (ctx, cam, W, H, exp) {
    if (!T.active() || !bridges.length) return;
    var S = G.S, ter = S.ter, z = cam.z;
    function P(x, y) { return G.R.w2sAt(x, y, 0.06); }
    function w(x, y) { return x >= 0 && y >= 0 && x < N && y < N && ter[y * N + x] === 2; }
    bridges.forEach(function (b) {
      var tx = b[0], ty = b[1]; if (!exp[ty * N + tx]) return;
      var A = P(tx, ty), Bq = P(tx + 1, ty), C = P(tx + 1, ty + 1), D = P(tx, ty + 1);
      if (Bq[0] < -40 || D[0] > W + 40 || C[1] < -40 || A[1] > H + 40) return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(A[0] + 3 * z, A[1] + 5 * z); ctx.lineTo(Bq[0] + 3 * z, Bq[1] + 5 * z); ctx.lineTo(C[0] + 3 * z, C[1] + 5 * z); ctx.lineTo(D[0] + 3 * z, D[1] + 5 * z); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(A[0], A[1] - 0.5); ctx.lineTo(Bq[0] + 0.5, Bq[1]); ctx.lineTo(C[0], C[1] + 0.5); ctx.lineTo(D[0] - 0.5, D[1]); ctx.closePath(); ctx.clip();
      var top = A[1], bot = C[1], left = D[0], right = Bq[0], ph = 3.6 * z;
      for (var y = top, n = 0; y < bot; y += ph, n++) {
        var hv = G.hash2(tx * 13 + n, ty, 61);
        ctx.fillStyle = 'rgb(' + ((112 + hv * 26) | 0) + ',' + ((82 + hv * 20) | 0) + ',' + ((52 + hv * 12) | 0) + ')';
        ctx.fillRect(left, y, right - left, ph);
        ctx.fillStyle = 'rgba(40,24,10,0.55)'; ctx.fillRect(left, y + ph - 0.7 * z, right - left, 0.7 * z);
      }
      ctx.restore();
      function rail(p, q) {
        ctx.strokeStyle = 'rgba(10,20,30,0.35)'; ctx.lineWidth = 2.2 * z; ctx.beginPath(); ctx.moveTo(p[0] + 3 * z, p[1] + 2 * z); ctx.lineTo(q[0] + 3 * z, q[1] + 2 * z); ctx.stroke();
        ctx.strokeStyle = '#5a3c22'; ctx.lineWidth = 1.3 * z;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 6 * z); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - 6 * z); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p[0], p[1] - 6 * z); ctx.lineTo(q[0], q[1] - 6 * z); ctx.moveTo(p[0], p[1] - 3 * z); ctx.lineTo(q[0], q[1] - 3 * z); ctx.stroke();
      }
      if (w(tx, ty - 1)) rail(A, Bq);
      if (w(tx + 1, ty)) rail(Bq, C);
      if (w(tx, ty + 1)) rail(D, C);
      if (w(tx - 1, ty)) rail(A, D);
    });
  };
})();
