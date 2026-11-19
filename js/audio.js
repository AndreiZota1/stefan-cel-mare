// Sunete făcute din cod (WebAudio): topor, săbii, săgeți, bucium, fanfară.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var A = G.Audio = { on: true, ac: null };
  try { A.on = localStorage.getItem('scm_sound') !== '0'; } catch (e) {}
  var master, noise, lastAt = {};

  A.unlock = function () {
    if (A.ac) { if (A.ac.state === 'suspended') A.ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ac = new AC();
    master = A.ac.createGain(); master.gain.value = 0.5; master.connect(A.ac.destination); A.master = master;
    var len = A.ac.sampleRate, buf = A.ac.createBuffer(1, len, A.ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = buf;
    master.gain.value = A.on ? 0.5 : 0;
    ambient();
    decodeVoices();
    if (G.Music) G.Music.start(A.ac, master);
  };
  A.noiseBuf = function () { return noise; };
  // fundalul: vânt și păsări, foarte încet
  var amb = null;
  function ambient() {
    if (amb || !A.ac || !noise) return;
    var src = A.ac.createBufferSource(), f = A.ac.createBiquadFilter(), g = A.ac.createGain(), lfo = A.ac.createOscillator(), lg = A.ac.createGain();
    src.buffer = noise; src.loop = true; f.type = 'lowpass'; f.frequency.value = 380;
    g.gain.value = 0.035; lfo.frequency.value = 0.07; lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(g.gain); src.connect(f); f.connect(g); g.connect(master); src.start(); lfo.start();
    amb = { g: g };
    (function bird() {
      setTimeout(function () {
        if (A.on && (G.running || G.cine) && !G.paused && A.ac) {
          var t = A.ac.currentTime, n = 2 + ((Math.random() * 3) | 0), base = 2200 + Math.random() * 1600;
          for (var i = 0; i < n; i++) {
            var o = A.ac.createOscillator(), gg = A.ac.createGain(), t0 = t + i * (0.09 + Math.random() * 0.05);
            o.type = 'sine'; o.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), t0); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.3), t0 + 0.07);
            gg.gain.setValueAtTime(0.0001, t0); gg.gain.exponentialRampToValueAtTime(0.022, t0 + 0.012); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
            o.connect(gg); gg.connect(master); o.start(t0); o.stop(t0 + 0.1);
          }
        }
        bird();
      }, 3500 + Math.random() * 6000);
    })();
  }
  A.toggle = function () {
    A.on = !A.on;
    try { localStorage.setItem('scm_sound', A.on ? '1' : '0'); } catch (e) {}
    if (A.on) A.unlock();
    if (master) master.gain.setTargetAtTime(A.on ? 0.5 : 0, A.ac.currentTime, 0.1);
  };

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(type, f, t, dur, peak, f2) {
    var o = A.ac.createOscillator(), g = A.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.01, peak, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function burst(t, dur, peak, type, freq, q, f2) {
    var s = A.ac.createBufferSource(), f = A.ac.createBiquadFilter(), g = A.ac.createGain();
    s.buffer = noise; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.005, peak, dur); s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function horn(t, f, dur) {
    var o = A.ac.createOscillator(), f1 = A.ac.createBiquadFilter(), g = A.ac.createGain(), lfo = A.ac.createOscillator(), lg = A.ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; f1.type = 'lowpass'; f1.frequency.value = 900; f1.Q.value = 2;
    lfo.frequency.value = 5; lg.gain.value = 3; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.12); g.gain.setValueAtTime(0.22, t + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); f1.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  // ---------- vocile: G.VOCI (Moldova) și G.VOCI_CIV[civ] (celelalte, în js/voci_<civ>.js) ----------
  var vbuf = {}, vlast = {}, vsrc = null, vtime = 0;
  function bankOf(civ) { return civ && civ !== 'mol' && G.VOCI_CIV && G.VOCI_CIV[civ] ? G.VOCI_CIV[civ] : G.VOCI; }
  function decodeBank(civ) {
    var key = civ && G.VOCI_CIV && G.VOCI_CIV[civ] && civ !== 'mol' ? civ : 'mol', V = bankOf(civ);
    if (!V || !A.ac || vbuf[key]) return vbuf[key];
    var B = vbuf[key] = {};
    Object.keys(V).forEach(function (cat) {
      B[cat] = [];
      V[cat].forEach(function (clip, i) {
        var bin = atob(clip.a.split(',')[1]), arr = new Uint8Array(bin.length);
        for (var j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        A.ac.decodeAudioData(arr.buffer, function (buf) { B[cat][i] = buf; }, function () {});
      });
    });
    return B;
  }
  function decodeVoices() { decodeBank('mol'); }
  A.voicesReady = function () { var n = 0; Object.keys(vbuf).forEach(function (b) { Object.keys(vbuf[b]).forEach(function (c) { vbuf[b][c].forEach(function (x) { if (x) n++; }); }); }); return n; };
  G.Voci = {
    load: function (civ) {
      if (!civ || civ === 'mol' || (G.VOCI_CIV && G.VOCI_CIV[civ]) || G.Voci['l_' + civ]) return;
      G.Voci['l_' + civ] = 1;
      var sc = document.createElement('script'); sc.src = 'js/voci_' + civ + '.js'; sc.onerror = function () {}; document.head.appendChild(sc);
    }
  };
  // units: oamenii cărora li s-a vorbit; kind: sel | ack | atk | build | alert | oto (strigătul dușmanului)
  G.voice = function (units, kind) {
    if (!A.on || !A.ac || !G.running || G.paused || !G.S) return;
    var cat, civ;
    if (kind === 'alert') { cat = 'alert'; civ = 'mol'; }
    else if (kind === 'oto') {
      var foes = G.S.players.filter(function (P) { return G.enemy(0, P.id) && P.alive; });
      var foe = foes[(Math.random() * foes.length) | 0];
      if (!foe) return;
      civ = foe.civ; cat = civ === 'mol' || !(G.VOCI_CIV && G.VOCI_CIV[civ]) ? (civ === 'oto' ? 'oto' : 'mil_atk') : 'mil_atk';
    } else {
      units = units || [];
      if (!units.length) return;
      civ = G.S.players[units[0].o].civ;
      var who = units.some(function (u) { return G.UNITS[u.t].hero; }) ? 'hero' : units.some(function (u) { return u.t !== 'vil' && G.UNITS[u.t].cls !== 'mon'; }) ? 'mil' : 'vil';
      if (who === 'vil') cat = kind === 'sel' ? 'vil_sel' : kind === 'build' ? 'vil_build' : 'vil_ack';
      else cat = who + '_' + (kind === 'sel' ? 'sel' : kind === 'atk' ? 'atk' : 'ack');
    }
    var B = decodeBank(civ); if (!B) return;
    var list = B[cat]; if (!list) return;
    var now = A.ac.currentTime;
    if (now - vtime < 0.35) return;
    var idx = [], n = list.length, lk = civ + cat;
    for (var i = 0; i < n; i++) if (list[i] && i !== vlast[lk]) idx.push(i);
    if (!idx.length) return;
    var k = idx[(Math.random() * idx.length) | 0];
    vlast[lk] = k; vtime = now;
    if (vsrc) try { vsrc.stop(); } catch (e) {}
    var src = A.ac.createBufferSource(), g = A.ac.createGain();
    src.buffer = list[k]; src.playbackRate.value = 0.97 + Math.random() * 0.06;
    g.gain.value = kind === 'oto' ? 0.55 : 0.9;
    src.connect(g); g.connect(master); src.start(now + 0.02);
    vsrc = src;
  };

  var GAP = { chop: 0.12, mine: 0.12, hit: 0.07, arrow: 0.06, thud: 0.12, build: 0.15, death: 0.15, gun: 0.08, catapult: 0.15 };
  var LOCAL = { chop: 1, mine: 1, hit: 1, arrow: 1, thud: 1, build: 1, death: 1, cannon: 1, boom: 1, collapse: 1, gun: 1, catapult: 1 };
  G.sfx = function (name, x, y, civ) {
    if (!A.on || !A.ac || (!G.running && !G.cine) || G.paused) return;
    if (LOCAL[name] && x !== undefined) {
      var p = G.R.w2s(x, y);
      if (p[0] < -40 || p[0] > G.R.W + 40 || p[1] < -40 || p[1] > G.R.H + 40) return;
    }
    var now = A.ac.currentTime;
    if (lastAt[name] && now - lastAt[name] < (GAP[name] || 0.05)) return;
    lastAt[name] = now;
    var t = now + 0.01;
    switch (name) {
      case 'chop': burst(t, 0.07, 0.25, 'bandpass', 900, 3); tone('square', 180, t, 0.04, 0.05); break;
      case 'mine': burst(t, 0.05, 0.18, 'bandpass', 3200, 4); tone('triangle', 1700 + Math.random() * 300, t, 0.08, 0.06); break;
      case 'build': burst(t, 0.05, 0.2, 'bandpass', 600, 2); break;
      case 'hit': burst(t, 0.06, 0.2, 'highpass', 2500, 1); tone('triangle', 520 + Math.random() * 200, t, 0.05, 0.05); break;
      case 'thud': burst(t, 0.12, 0.22, 'lowpass', 400, 1); break;
      case 'arrow': burst(t, 0.14, 0.09, 'bandpass', 3000, 2, 900); break;
      case 'cannon': burst(t, 0.5, 0.5, 'lowpass', 500, 1, 120); tone('sine', 70, t, 0.3, 0.3, 40); break;
      case 'boom': burst(t, 0.35, 0.35, 'lowpass', 700, 1, 150); break;
      case 'collapse': burst(t, 0.9, 0.35, 'lowpass', 600, 1, 80); break;
      case 'death': tone('sine', 220, t, 0.18, 0.06, 90); break;
      // cântarea călugărului: ison bisericesc (ortodocși), cânt gregorian (catolici), melismă (derviși)
      case 'convert': {
        var st2 = civ === 'oto' || civ === 'tat' ? [294, 330, 311, 294, 262, 294] : civ === 'ung' || civ === 'pol' ? [262, 294, 330, 294, 262] : [196, 220, 233, 220, 196];
        if (!(civ === 'oto' || civ === 'tat')) tone('sine', st2[0] / 2, t, 1.9, 0.035);
        st2.forEach(function (f, i) { tone('triangle', f, t + i * 0.32, 0.36, 0.045, civ === 'oto' || civ === 'tat' ? f * 1.06 : f); });
        break;
      }
      case 'howl': tone('sine', 360, t, 0.55, 0.06, 640); tone('sine', 640, t + 0.55, 1.1, 0.055, 430); tone('sine', 720, t + 0.05, 0.5, 0.02, 1280); break;
      case 'select': tone('sine', 660, t, 0.04, 0.05); break;
      case 'click': tone('sine', 880, t, 0.03, 0.05); break;
      case 'ack': tone('triangle', 520, t, 0.05, 0.06); tone('triangle', 780, t + 0.05, 0.05, 0.05); break;
      case 'place': burst(t, 0.1, 0.2, 'lowpass', 500, 1); tone('triangle', 392, t, 0.08, 0.06); break;
      case 'err': tone('square', 160, t, 0.12, 0.05); break;
      case 'train': tone('triangle', 784, t, 0.08, 0.06); tone('triangle', 988, t + 0.08, 0.1, 0.05); break;
      case 'built': tone('triangle', 523, t, 0.1, 0.08); tone('triangle', 659, t + 0.1, 0.1, 0.08); tone('triangle', 784, t + 0.2, 0.16, 0.08); break;
      case 'horn': horn(t, 196, 0.7); horn(t + 0.75, 147, 0.9); setTimeout(function () { G.voice(null, Math.random() < 0.35 ? 'oto' : 'alert'); }, 1700); break;
      case 'age': [392, 523, 659, 784].forEach(function (f, i) { horn(t + i * 0.18, f / 2, 0.5); }); break;
      case 'win': [523, 659, 784, 1047].forEach(function (f, i) { tone('triangle', f, t + i * 0.22, 0.4, 0.1); }); break;
      case 'lose': [392, 349, 311, 262].forEach(function (f, i) { tone('triangle', f, t + i * 0.3, 0.5, 0.09); }); break;
      case 'gun': burst(t, 0.18, 0.55, 'highpass', 900, 1, 300); burst(t + 0.02, 0.4, 0.2, 'lowpass', 700, 1, 120); tone('sine', 95, t, 0.15, 0.25, 50); break;
      case 'catapult': burst(t, 0.25, 0.25, 'bandpass', 300, 2, 120); tone('triangle', 140, t, 0.2, 0.08, 70); break;
      case 'bell': [0, 0.7, 1.4].forEach(function (d) { tone('sine', 523, t + d, 1.4, 0.12); tone('sine', 1046 * 1.003, t + d, 1.0, 0.05); tone('sine', 784, t + d, 1.2, 0.05); }); break;
      case 'horn2': horn(t, 220, 0.5); horn(t + 0.5, 294, 0.8); break;
      case 'power': burst(t, 0.6, 0.25, 'lowpass', 300, 1, 60); tone('sawtooth', 110, t, 0.6, 0.06, 55); break;
      case 'relic': [784, 988, 1175, 1568].forEach(function (f, i) { tone('sine', f, t + i * 0.09, 0.5, 0.06); }); break;
      case 'coin': tone('triangle', 1318, t, 0.06, 0.05); tone('triangle', 1760, t + 0.06, 0.12, 0.05); break;
      case 'obj': tone('triangle', 587, t, 0.12, 0.08); tone('triangle', 880, t + 0.12, 0.25, 0.08); break;
      case 'win1': [659, 784, 988].forEach(function (f, i) { tone('triangle', f, t + i * 0.15, 0.3, 0.08); }); break;
      case 'lose1': [330, 294, 262].forEach(function (f, i) { tone('triangle', f, t + i * 0.2, 0.35, 0.07); }); break;
    }
  };
})();
