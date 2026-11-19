// Campaniile: harta pictată pe pergament, povestea dintre misiuni, obiectivele și dialogurile din joc.
var G = globalThis.G || (globalThis.G = {});
G.CAMPAIGNS = G.CAMPAIGNS || [];
G.NAR = G.NAR || {};

(function () {
  'use strict';
  var Camp = G.Camp = {};
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(id, on) { var el = $(id); if (el) el.classList.toggle('on', on); }

  // ---------- progresul ----------
  var prog = {};
  try { prog = JSON.parse(localStorage.getItem('scm_camp') || '{}'); } catch (e) {}
  prog.done = prog.done || {};
  function saveProg() { try { localStorage.setItem('scm_camp', JSON.stringify(prog)); } catch (e) {} }
  function unlocked(c, i) { return i === 0 || !!prog.done[c.scen[i - 1]] || !!prog.all; }
  Camp.unlockAll = function () { prog.all = 1; saveProg(); };

  // ---------- geografia (longitudine, latitudine) ----------
  var GEO = {
    sea: [[29.1, 41.2], [28.0, 41.6], [27.6, 42.5], [27.9, 43.2], [28.6, 44.2], [29.0, 44.8], [29.7, 45.1], [29.8, 45.6], [30.3, 46.1], [30.7, 46.5], [31.5, 46.6], [32.0, 46.5], [32.5, 46.1],
      [33.6, 46.1], [33.4, 45.2], [32.6, 45.4], [33.5, 44.6], [34.2, 44.45], [35.4, 45.0], [35.4, 45.3], [35.0, 45.7], [35.5, 46.3], [36.5, 46.7], [37.5, 47.1], [38.5, 47.1], [38.5, 41.0], [36.0, 41.7], [35.2, 42.0], [33.0, 41.9], [31.0, 41.1]],
    marmara: [[26.7, 40.4], [27.5, 40.3], [28.9, 40.7], [29.0, 41.0], [28.0, 40.95], [27.3, 40.9], [26.9, 40.6]],
    aegean: [[22.5, 39.0], [22.6, 40.2], [23.9, 40.4], [24.8, 40.85], [25.9, 40.85], [26.3, 40.6], [26.2, 40.0], [26.5, 39.0]],
    adriatic: [[12.0, 39.0], [12.0, 45.0], [13.6, 45.7], [14.5, 45.2], [15.0, 44.6], [16.0, 43.5], [17.5, 43.0], [18.6, 42.4], [19.4, 41.8], [19.5, 40.5], [20.0, 39.0]],
    rivers: [
      [[16.4, 48.2], [17.1, 48.14], [18.0, 47.8], [19.05, 47.5], [18.9, 46.8], [18.68, 45.99], [19.2, 45.4], [19.85, 45.26], [20.46, 44.82], [21.5, 44.75], [22.4, 44.72], [22.6, 44.3], [22.88, 43.99], [23.8, 43.75], [24.9, 43.7], [25.97, 43.9], [27.26, 44.1], [28.03, 44.34], [27.96, 45.27], [28.05, 45.43], [28.46, 45.27], [28.8, 45.18], [29.28, 45.43], [29.65, 45.35]],
      [[24.5, 48.1], [25.3, 48.2], [25.94, 48.29], [26.8, 48.27], [27.2, 47.9], [27.8, 47.21], [28.25, 46.48], [28.2, 45.9], [28.29, 45.46]],
      [[25.0, 48.0], [25.8, 47.9], [26.4, 47.6], [26.7, 47.2], [26.92, 46.92], [26.91, 46.57], [27.18, 46.1], [27.6, 45.7], [28.0, 45.42]],
      [[23.0, 49.5], [24.72, 49.12], [26.49, 48.52], [27.8, 48.45], [28.3, 48.16], [29.0, 47.3], [29.6, 46.84], [30.1, 46.4], [30.35, 46.2]],
      [[25.7, 45.9], [24.4, 45.8], [24.37, 45.1], [24.6, 44.3], [24.85, 43.7]],
      [[25.5, 46.9], [24.56, 46.54], [23.58, 46.07], [22.9, 45.88], [21.3, 46.17], [20.15, 46.25]],
      [[23.8, 48.2], [22.4, 48.1], [21.4, 48.12], [20.2, 47.2], [20.15, 46.25], [20.3, 45.15]],
      [[26.1, 45.3], [25.5, 44.6], [26.0, 44.2]],
      [[33.2, 50.5], [32.4, 49.6], [32.0, 48.6], [33.4, 48.0], [34.5, 47.5], [33.9, 46.8], [32.6, 46.6]],
      [[30.6, 51.4], [30.52, 50.45], [31.5, 49.5], [32.4, 49.0], [33.4, 48.0]],
      [[38.8, 52.6], [39.3, 51.3], [40.0, 50.5], [41.2, 49.6], [42.6, 48.9], [41.8, 48.0], [40.4, 47.6], [39.4, 47.2]],
      [[45.5, 52.4], [46.2, 51.5], [46.5, 50.3], [45.6, 49.3], [44.6, 48.7], [45.4, 48.1], [46.3, 47.3], [47.6, 46.4], [48.2, 45.9]]
    ],
    mountains: [
      [[19.5, 49.3], [21.0, 49.4], [22.5, 49.0], [23.8, 48.6], [24.6, 48.1], [25.1, 47.6], [25.5, 47.0], [25.9, 46.5], [26.3, 46.0], [26.1, 45.6], [25.5, 45.45], [24.6, 45.4], [23.6, 45.4], [22.7, 45.3], [22.2, 45.0]],
      [[22.4, 46.3], [22.8, 46.6], [23.3, 46.6]],
      [[22.5, 43.6], [23.5, 43.0], [24.5, 42.8], [25.5, 42.8], [26.5, 42.7], [27.3, 42.8]],
      [[33.6, 44.6], [34.3, 44.7], [35.0, 44.9]]
    ],
    cities: {
      suceava: ['Suceava', 26.26, 47.65], iasi: ['Iași', 27.59, 47.16], vaslui: ['Vaslui', 27.73, 46.64], neamt: ['Neamț', 26.36, 47.2], baia: ['Baia', 26.22, 47.42],
      chilia: ['Chilia', 29.28, 45.43], cetalba: ['Cetatea Albă', 30.34, 46.19], doljesti: ['Doljești', 26.96, 47.0], razboieni: ['Războieni', 26.55, 47.05],
      cosmin: ['Codrii Cosminului', 25.85, 48.25], hotin: ['Hotin', 26.49, 48.52], putna: ['Putna', 25.6, 47.87], targoviste: ['Târgoviște', 25.46, 44.93],
      poenari: ['Poenari', 24.64, 45.35], bucuresti: ['București', 26.1, 44.43], belgrad: ['Belgrad', 20.46, 44.82], buda: ['Buda', 19.04, 47.5],
      hunedoara: ['Hunedoara', 22.9, 45.75], sibiu: ['Sibiu', 24.15, 45.8], brasov: ['Brașov', 25.6, 45.65], constantinopol: ['Constantinopol', 28.98, 41.01],
      edirne: ['Adrianopol', 26.56, 41.68], varna: ['Varna', 27.92, 43.21], cracovia: ['Cracovia', 19.94, 50.06], liov: ['Liov', 24.03, 49.84], kiev: ['Kiev', 30.52, 50.45],
      bahcisarai: ['Bahcisarai', 33.86, 44.75], caffa: ['Caffa', 35.38, 45.03], nicopole: ['Nicopole', 24.9, 43.7], sofia: ['Sofia', 23.32, 42.7], nis: ['Niș', 21.9, 43.32],
      vidin: ['Vidin', 22.88, 43.99], giurgiu: ['Giurgiu', 25.97, 43.9], braila: ['Brăila', 27.96, 45.27], grunwald: ['Grunwald', 20.1, 53.48], sarai: ['Sarai', 45.8, 47.3],
      dristra: ['Dristra', 27.26, 44.11], alba: ['Alba Iulia', 23.58, 46.07], marienburg: ['Marienburg', 19.03, 54.04], astrahan: ['Astrahan', 48.03, 46.35]
    },
    regions: [['MOLDOVA', 27.4, 47.5, 1], ['ȚARA ROMÂNEASCĂ', 25.0, 44.55, 1], ['TRANSILVANIA', 24.2, 46.5, 0.85], ['REGATUL UNGARIEI', 20.2, 47.0, 1], ['REGATUL POLONIEI', 22.6, 50.9, 1],
      ['IMPERIUL OTOMAN', 25.0, 41.9, 1], ['HANATUL CRIMEII', 33.6, 46.9, 0.9], ['MAREA NEAGRĂ', 31.6, 43.4, 1.1], ['SERBIA', 20.8, 43.5, 0.8], ['BUGEAC', 29.3, 46.3, 0.7], ['HOARDA MARE', 44.0, 49.6, 0.9]]
  };
  Camp.GEO = GEO;

  // ---------- desenul hărții ----------
  var paper = null;
  function paperTex(w, h) {
    if (paper && paper.width === w && paper.height === h) return paper;
    paper = document.createElement('canvas'); paper.width = w; paper.height = h;
    var g = paper.getContext('2d'), R = G.rng(77);
    var gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    gr.addColorStop(0, '#efe0b8'); gr.addColorStop(0.7, '#dcc28c'); gr.addColorStop(1, '#a9844c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 260; i++) {
      var x = R() * w, y = R() * h, r = 4 + R() * 40;
      g.fillStyle = 'rgba(' + (R() < 0.5 ? '120,90,40' : '255,245,220') + ',' + (0.02 + R() * 0.05) + ')';
      g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
    }
    for (var k = 0; k < 2400; k++) { g.fillStyle = 'rgba(90,60,20,' + R() * 0.08 + ')'; g.fillRect(R() * w, R() * h, 1, 1); }
    return paper;
  }
  function proj(view, w, h) {
    var s = view.z * Math.min(w / 14, h / 10), cx = view.lon, cy = view.lat, k = Math.cos(46 * Math.PI / 180);
    return function (lon, lat) { return [w / 2 + (lon - cx) * k * s, h / 2 - (lat - cy) * s]; };
  }
  function pathOf(g, P, pts, close) {
    g.beginPath();
    pts.forEach(function (p, i) { var q = P(p[0], p[1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
    if (close) g.closePath();
  }
  function smoothPath(g, P, pts) {
    var q = pts.map(function (p) { return P(p[0], p[1]); });
    g.beginPath(); g.moveTo(q[0][0], q[0][1]);
    for (var i = 1; i < q.length - 1; i++) { var mx = (q[i][0] + q[i + 1][0]) / 2, my = (q[i][1] + q[i + 1][1]) / 2; g.quadraticCurveTo(q[i][0], q[i][1], mx, my); }
    g.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
  }
  // view: {lon, lat, z}; arrows: [{pts: [[lon,lat],...], col, t0, t1}]; marks: [{lon, lat, kind, label, n, st}]
  Camp.drawMap = function (cv, view, arrows, marks, t) {
    var d = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 600, h = cv.clientHeight || 400;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.drawImage(paperTex(Math.round(w), Math.round(h)), 0, 0, w, h);
    var P = proj(view, w, h), z = view.z;
    // mările
    [GEO.sea, GEO.marmara, GEO.aegean, GEO.adriatic].forEach(function (poly) {
      pathOf(g, P, poly, true); g.fillStyle = 'rgba(88,128,150,0.42)'; g.fill();
      g.strokeStyle = 'rgba(50,70,80,0.55)'; g.lineWidth = 1.4; g.stroke();
      g.save(); g.clip(); g.strokeStyle = 'rgba(60,90,110,0.22)'; g.lineWidth = 1;
      for (var i = 1; i < 4; i++) { g.save(); g.translate(0, i * 4); pathOf(g, P, poly, true); g.stroke(); g.restore(); }
      g.restore();
    });
    // râurile
    g.lineCap = 'round'; g.lineJoin = 'round';
    GEO.rivers.forEach(function (r, i) { smoothPath(g, P, r); g.strokeStyle = 'rgba(55,95,125,0.75)'; g.lineWidth = i === 0 ? 2.6 : 1.5; g.stroke(); });
    // munții
    GEO.mountains.forEach(function (m) {
      for (var i = 0; i < m.length - 1; i++) {
        var a = P(m[i][0], m[i][1]), b = P(m[i + 1][0], m[i + 1][1]), L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(L / (11 * Math.max(0.6, z))));
        for (var k = 0; k < n; k++) {
          var f = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, s = 7 * Math.max(0.7, Math.min(1.6, z)) * (0.8 + ((i * 7 + k * 3) % 5) * 0.08);
          g.fillStyle = 'rgba(120,90,50,0.35)'; g.beginPath(); g.moveTo(x - s, y + s * 0.5); g.lineTo(x, y - s); g.lineTo(x + s, y + s * 0.5); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(70,45,20,0.8)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x - s, y + s * 0.5); g.lineTo(x, y - s); g.lineTo(x + s, y + s * 0.5); g.stroke();
          g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.35, y + s * 0.3); g.stroke();
        }
      }
    });
    // țările
    g.textAlign = 'center';
    GEO.regions.forEach(function (r) {
      var p = P(r[1], r[2]); if (p[0] < -100 || p[0] > w + 100 || p[1] < -40 || p[1] > h + 40) return;
      g.font = 'italic ' + Math.round(13 * r[3] * Math.max(0.8, Math.min(1.8, z))) + 'px Georgia, serif';
      g.fillStyle = r[0].indexOf('MAREA') === 0 ? 'rgba(40,70,90,0.6)' : 'rgba(90,40,20,0.55)';
      g.fillText(r[0].split('').join(String.fromCharCode(8202)), p[0], p[1]);
    });
    // orașele
    var C = GEO.cities;
    Object.keys(C).forEach(function (k) {
      var c = C[k], p = P(c[1], c[2]);
      if (p[0] < -20 || p[0] > w + 20 || p[1] < -20 || p[1] > h + 20) return;
      g.fillStyle = '#5a2a10'; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, 6.3); g.fill();
      g.font = Math.round(10.5 * Math.max(0.9, Math.min(1.4, z))) + 'px Georgia, serif'; g.fillStyle = 'rgba(50,25,8,0.85)'; g.fillText(c[0], p[0], p[1] - 6);
    });
    // săgețile campaniei, desenate treptat
    (arrows || []).forEach(function (a) {
      var f = Math.max(0, Math.min(1, ((t || 0) - (a.t0 || 0)) / ((a.t1 || 1) - (a.t0 || 0))));
      if (f <= 0) return;
      var pts = a.pts.map(function (p) { return P(p[0], p[1]); }), seg = [], tot = 0, i;
      for (i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      var want = tot * f, acc = 0; seg.push(pts[0]);
      for (i = 1; i < pts.length && acc < want; i++) {
        var L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (acc + L <= want) { seg.push(pts[i]); acc += L; }
        else { var q = (want - acc) / L; seg.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q]); acc = want; }
      }
      g.strokeStyle = a.col || '#a01818'; g.lineWidth = 4; g.setLineDash([10, 5]);
      g.beginPath(); seg.forEach(function (p, j) { if (j) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); g.setLineDash([]);
      var e = seg[seg.length - 1], pr = seg[Math.max(0, seg.length - 2)], an = Math.atan2(e[1] - pr[1], e[0] - pr[0]);
      g.fillStyle = a.col || '#a01818'; g.beginPath(); g.moveTo(e[0] + Math.cos(an) * 10, e[1] + Math.sin(an) * 10);
      g.lineTo(e[0] + Math.cos(an + 2.5) * 10, e[1] + Math.sin(an + 2.5) * 10); g.lineTo(e[0] + Math.cos(an - 2.5) * 10, e[1] + Math.sin(an - 2.5) * 10); g.closePath(); g.fill();
    });
    // semnele: lupte, misiuni
    (marks || []).forEach(function (m) {
      var p = P(m.lon, m.lat);
      if (m.kind === 'battle') {
        var pul = 1 + Math.sin((t || 0) * 4) * 0.08;
        g.font = Math.round(22 * pul) + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.fillText('⚔️', p[0], p[1] + 8);
      } else {
        var r = 13, col = m.st === 2 ? '#2e6b2a' : m.st === 1 ? '#8a1c14' : '#6a5a48';
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(p[0] + 2, p[1] + 3, r, 0, 6.3); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], r, 0, 6.3); g.fill();
        g.strokeStyle = '#f3dca0'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#f8ecc8'; g.font = 'bold 13px Georgia, serif'; g.fillText(m.st === 2 ? '✓' : m.n, p[0], p[1] + 4.5);
        if (m.label) { g.font = 'bold 11px Georgia, serif'; g.fillStyle = 'rgba(40,20,5,0.9)'; g.fillText(m.label, p[0], p[1] + r + 12); }
      }
    });
    // rama și roza vânturilor
    g.strokeStyle = 'rgba(70,40,15,0.85)'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    g.lineWidth = 1; g.strokeRect(11, 11, w - 22, h - 22);
    var rx = w - 46, ry = h - 50;
    g.strokeStyle = 'rgba(70,40,15,0.7)'; g.fillStyle = 'rgba(120,40,20,0.65)';
    for (var a2 = 0; a2 < 4; a2++) {
      var an2 = a2 * Math.PI / 2 - Math.PI / 2;
      g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.cos(an2 - 0.3) * 8, ry + Math.sin(an2 - 0.3) * 8); g.lineTo(rx + Math.cos(an2) * 24, ry + Math.sin(an2) * 24); g.closePath(); g.fill();
    }
    g.font = 'bold 11px Georgia, serif'; g.fillStyle = 'rgba(70,40,15,0.9)'; g.fillText('N', rx, ry - 28);
    g.textAlign = 'start';
  };

  // ---------- ecranul campaniilor ----------
  var curC = 0, raf = 0;
  Camp.open = function () {
    if (!G.CAMPAIGNS.length) return;
    show('camp', true); render();
  };
  function render() {
    var c = G.CAMPAIGNS[curC];
    var html = '<div class="ctabs">' + G.CAMPAIGNS.map(function (x, i) {
      var done = x.scen.filter(function (id) { return prog.done[id]; }).length;
      return '<button class="' + (i === curC ? 'on' : '') + '" data-c="' + i + '"><img src="' + G.R.icon('u', 'hero', x.heroVis || x.civ) + '" alt=""><b>' + esc(x.name) + '</b><small>' + done + '/' + x.scen.length + '</small></button>';
    }).join('') + '</div>';
    html += '<div class="cbody"><canvas id="campMap"></canvas><div class="clist"><h3>' + esc(c.name) + '</h3><div class="csub">' + esc(c.sub) + '</div>' + c.scen.map(function (id, i) {
      var m = G.MISSIONS[id], ok = unlocked(c, i), d = prog.done[id];
      return '<button class="cm' + (ok ? '' : ' lock') + (d ? ' done' : '') + '" data-m="' + id + '" ' + (ok ? '' : 'disabled') + '><span class="cn">' + (d ? '✓' : i + 1) + '</span><span><b>' + esc(m.title) + '</b><small>' + esc(m.year + ' · ' + m.place) + (d ? ' · terminată (' + esc((G.DIFF[d] || {}).name || d) + ')' : '') + '</small></span></button>';
    }).join('') + '<div class="row2"><button class="btn" id="cBack">Înapoi</button></div></div></div>';
    $('campBox').innerHTML = html;
    $('campBox').querySelectorAll('[data-c]').forEach(function (b) { b.addEventListener('click', function () { curC = +b.dataset.c; render(); }); });
    $('campBox').querySelectorAll('[data-m]').forEach(function (b) { b.addEventListener('click', function () { Camp.story(b.dataset.m, 'intro'); }); });
    $('cBack').addEventListener('click', function () { show('camp', false); cancelAnimationFrame(raf); });
    var t0 = performance.now(), cv = $('campMap');
    var marks = c.scen.map(function (id, i) { var m = G.MISSIONS[id]; return { lon: m.lon, lat: m.lat, n: i + 1, st: prog.done[id] ? 2 : unlocked(c, i) ? 1 : 0, label: '' }; });
    cancelAnimationFrame(raf);
    (function loop() { if (!$('camp').classList.contains('on')) return; Camp.drawMap(cv, c.view, [], marks, (performance.now() - t0) / 1000); raf = requestAnimationFrame(loop); })();
  }

  // ---------- povestea dintre misiuni ----------
  var curM = null, phase = 'intro', audio = null, para = 0, storyT0 = 0;
  Camp.story = function (id, ph) {
    curM = id; phase = ph; para = 0;
    var m = G.MISSIONS[id], texts = m[ph] || [];
    var diffSel = '<label class="sdiff">Greutatea <select id="stDiff">' + Object.keys(G.DIFF).map(function (k) { return '<option value="' + k + '"' + (k === (prog.diff || 'normal') ? ' selected' : '') + '>' + G.DIFF[k].name + '</option>'; }).join('') + '</select></label>';
    var html = '<div class="sbody"><canvas id="storyMap"></canvas><div class="stext"><div class="sy">' + esc(m.year + ' · ' + m.place) + '</div><h2>' + esc(m.title) + '</h2>' +
      (ph === 'lose' ? '<p class="sp on">' + esc(G.S && G.S.scen && G.S.scen.why ? G.S.scen.why : (m.loseText || 'Misiunea a eșuat.')) + '</p>' :
        texts.map(function (p, i) { return '<p class="sp" data-p="' + i + '">' + esc(p) + '</p>'; }).join('')) + '</div></div>';
    html += '<div class="row2">' + (ph === 'intro' ? '<button class="btn" id="stBack">Înapoi</button>' + diffSel + '<button class="btn go" id="stGo">⚔️ Începe misiunea</button>'
      : ph === 'lose' ? '<button class="btn" id="stBack">Campania</button><button class="btn go" id="stRetry">Încearcă din nou</button>'
      : '<button class="btn" id="stBack">Campania</button>' + (nextOf(id) ? '<button class="btn go" id="stNext">Misiunea următoare ▶</button>' : '')) + '</div>';
    $('storyBox').innerHTML = html;
    show('camp', false); show('story', true); show('end', false);
    var sp = $('storyBox').querySelectorAll('.sp[data-p]');
    function playPara(i) {
      para = i;
      sp.forEach(function (e, j) { e.classList.toggle('on', j === i); e.classList.toggle('past', j < i); });
      if (sp[i]) sp[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      stopAudio();
      var key = id + '_' + ph + i, src = G.NAR[key];
      var dur = texts[i] ? Math.max(4, texts[i].length / 14) : 4;
      if (src && G.Audio && G.Audio.on) {
        audio = new Audio(src); audio.volume = 0.95;
        audio.onended = function () { if (para === i && i + 1 < sp.length) setTimeout(function () { if (para === i) playPara(i + 1); }, 500); };
        audio.play().catch(function () {});
      } else setTimeout(function () { if (para === i && i + 1 < sp.length && $('story').classList.contains('on')) playPara(i + 1); }, dur * 1000);
    }
    sp.forEach(function (e, j) { e.addEventListener('click', function () { playPara(j); }); });
    Camp.loadNar(id, function () { if (sp.length) playPara(0); });
    if ($('stBack')) $('stBack').addEventListener('click', function () { stopAudio(); show('story', false); Camp.open(); });
    if ($('stGo')) $('stGo').addEventListener('click', function () { prog.diff = $('stDiff').value; saveProg(); stopAudio(); show('story', false); G.Trig.start(id, prog.diff); });
    if ($('stRetry')) $('stRetry').addEventListener('click', function () { stopAudio(); show('story', false); G.Trig.start(id, prog.diff || 'normal'); });
    if ($('stNext')) $('stNext').addEventListener('click', function () { stopAudio(); Camp.story(nextOf(id), 'intro'); });
    storyT0 = performance.now();
    var cv = $('storyMap'), arrows = (m.arrows || []).map(function (a) { return Object.assign({}, a); });
    var marks = [{ lon: m.lon, lat: m.lat, kind: 'battle' }];
    cancelAnimationFrame(raf);
    (function loop() {
      if (!$('story').classList.contains('on')) return;
      var tt = (performance.now() - storyT0) / 1000;
      Camp.drawMap(cv, m.view || { lon: m.lon, lat: m.lat, z: 2.2 }, ph === 'intro' ? arrows : (m.arrowsOut || []), marks, tt);
      raf = requestAnimationFrame(loop);
    })();
  };
  function stopAudio() { if (audio) { try { audio.pause(); } catch (e) {} audio = null; } }
  function nextOf(id) {
    for (var i = 0; i < G.CAMPAIGNS.length; i++) { var c = G.CAMPAIGNS[i], j = c.scen.indexOf(id); if (j >= 0) return c.scen[j + 1] || null; }
    return null;
  }
  // narațiunea fiecărei misiuni stă în js/nar/<misiune>.js (se încarcă doar când trebuie)
  var narLoaded = {};
  Camp.loadNar = function (id, cb) {
    if (narLoaded[id]) { cb(); return; }
    var s = document.createElement('script'); s.src = 'js/nar/' + id + '.js';
    var done = function () { narLoaded[id] = 1; cb(); };
    s.onload = done; s.onerror = done; document.head.appendChild(s);
  };
  Camp.say = function (key) {
    var src = G.NAR[key]; if (!src || !G.Audio || !G.Audio.on) return;
    var a = new Audio(src); a.volume = 1; a.play().catch(function () {});
  };

  // ---------- sfârșitul misiunii ----------
  Camp.onEnd = function (win) {
    var S = G.S, id = S.scen.id;
    if (win) { prog.done[id] = S.diff; saveProg(); Camp.story(id, 'outro'); }
    else Camp.story(id, 'lose');
  };

  // ---------- obiectivele și dialogurile din joc ----------
  var objSig = '', sayQ = [], sayT = 0;
  Camp.tick = function (dt) {
    var S = G.S;
    var box = $('objs');
    if (!S || !S.scen) { if (box) box.style.display = 'none'; return; }
    box.style.display = '';
    var m = G.MISSIONS[S.scen.id];
    var sig = S.scen.obj.map(function (o) { return o.id + o.st + o.text; }).join('|') + (m && m.timer ? Math.ceil(m.timer(S) || 0) : '');
    if (sig !== objSig) {
      objSig = sig;
      var tm = m && m.timer ? m.timer(S) : null;
      box.innerHTML = '<div class="oh">📜 ' + esc(m ? m.title : '') + (tm ? ' <span class="otm">⏳ ' + Math.floor(tm / 60) + ':' + ('0' + Math.floor(tm % 60)).slice(-2) + '</span>' : '') + '</div>' +
        S.scen.obj.map(function (o) { return '<div class="ob st' + o.st + (o.sec ? ' sec' : '') + '">' + (o.st === 1 ? '☑' : o.st === 2 ? '☒' : '☐') + ' ' + esc(o.text) + '</div>'; }).join('');
    }
    G.Trig.pendingSays().forEach(function (x) { sayQ.push(x); });
    var el = $('say');
    if (sayT > 0) { sayT -= dt; if (sayT <= 0) el.classList.remove('on'); }
    if (sayT <= 0 && sayQ.length) {
      var x = sayQ.shift(), w = G.Trig.WHO[x.who] || { name: x.who, icon: ['u', 'mil', 'mol'] };
      el.innerHTML = '<img src="' + G.R.icon(w.icon[0], w.icon[1], w.icon[2]) + '" alt=""><div><b>' + esc(w.name) + '</b><span>' + esc(x.text) + '</span></div>';
      el.classList.add('on');
      sayT = Math.max(3.5, x.text.length / 14 + 1.5);
      if (x.key) Camp.say(S.scen.id + '_' + x.key);
    }
  };
  Camp.reset = function () { objSig = ''; sayQ = []; sayT = 0; var el = $('say'); if (el) el.classList.remove('on'); };
})();
