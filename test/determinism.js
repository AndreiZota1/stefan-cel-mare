// Jocul online merge ca AoE2: fiecare calculator rulează aceeași simulare din aceleași comenzi, deci simularea
// trebuie să dea exact același rezultat pe orice dispozitiv. Testul rulează aceleași partide (test/det-run.js)
// de două ori în Node (V8, motorul din Chrome) și o dată în JavaScriptCore (motorul din Safari și de pe iPhone)
// și compară amprenta stării (G.stateHash) în fiecare secundă de joc. Verifică și că o salvare cu reîncărcare
// la jumătatea partidei nu schimbă nimic.
//    node test/determinism.js [minute]
const { execFileSync } = require('child_process'), path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.join(__dirname, '..'), MIN = +process.argv[2] || 5;
const JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc';
const shim = 'var localStorage = { getItem: function () { return null; }, setItem: function () {} };';

function v8() {
  const code = shim.replace('var localStorage', 'global.localStorage') + `global.ROOT = ${JSON.stringify(ROOT)}; global.MIN = ${MIN};
    global.OUT = function (s) { console.log(s); };
    global.LOADF = function (f) { require('vm').runInThisContext(require('fs').readFileSync(f, 'utf8'), { filename: f }); };
    require(${JSON.stringify(path.join(__dirname, 'det-run.js'))});`;
  return execFileSync(process.execPath, ['-e', code], { maxBuffer: 1 << 26 }).toString();
}
function jsc() {
  if (!fs.existsSync(JSC)) return null;
  const w = path.join(os.tmpdir(), 'det-jsc-' + process.pid + '.js');
  fs.writeFileSync(w, shim + `var console = { log: print, warn: print, error: print, info: print };
    var ROOT = ${JSON.stringify(ROOT)}, MIN = ${MIN};
    var OUT = function (s) { print(s); }, LOADF = function (f) { load(f); };
    load(${JSON.stringify(path.join(__dirname, 'det-run.js'))});`);
  try { return execFileSync(JSC, [w], { maxBuffer: 1 << 26 }).toString(); } finally { fs.unlinkSync(w); }
}
function parse(txt) {
  const m = {};
  txt.split('\n').forEach(l => { const p = l.split(' '); if (p.length >= 3 && /^[0-9a-f]+$/.test(p[2])) (m[p[0]] = m[p[0]] || []).push([p[1], p[2], l]); });
  return m;
}
function compare(a, b, la, lb) {
  let bad = 0;
  Object.keys(a).forEach(k => {
    const x = a[k], y = b[k] || [];
    const i = x.findIndex((r, j) => !y[j] || y[j][1] !== r[1]);
    if (i < 0 && x.length === y.length) console.log(`  ✓ ${k.padEnd(18)} ${x.length} amprente identice (${x[x.length - 1][2].split(' ').slice(3).join(' ')})`);
    else { bad++; console.log(`  ✗ ${k.padEnd(18)} se despart la secunda ${x[i] ? x[i][0] : '?'}: ${la} ${x[i] && x[i][1]} / ${lb} ${y[i] && y[i][1]}`); }
  });
  return bad;
}

const t0 = Date.now();
const A = parse(v8()), B = parse(v8()), J0 = jsc(), J = J0 && parse(J0);
let bad = 0;
console.log('V8 cu V8 (aceeași partidă, de două ori):'); bad += compare(A, B, 'V8', 'V8');
const rau = A['ai4-rau'], sav = A['ai4-rau-salvat'];
const si = rau.findIndex((r, j) => !sav[j] || sav[j][1] !== r[1]);
console.log(si < 0 ? '  ✓ salvare + reîncărcare la jumătate: partida continuă identic' : `  ✗ după salvare + reîncărcare, partida se desparte la secunda ${rau[si][0]}`); if (si >= 0) bad++;
if (J) { console.log('V8 cu JavaScriptCore (Chrome față de Safari / iPhone):'); bad += compare(A, J, 'V8', 'JSC'); }
else console.log('JavaScriptCore lipsește: n-am putut compara cu motorul din Safari.');
console.log(bad ? `\n${bad} PROBLEME` : `\nsimularea e identică (${Math.round((Date.now() - t0) / 1000)} s)`);
process.exit(bad ? 1 : 0);
