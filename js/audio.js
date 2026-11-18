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
    master = A.ac.createGain(); master.gain.value = 0.5; master.connect(A.ac.destination);
    var len = A.ac.sampleRate, buf = A.ac.createBuffer(1, len, A.ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noise = buf;
  };
  A.toggle = function () {
    A.on = !A.on;
    try { localStorage.setItem('scm_sound', A.on ? '1' : '0'); } catch (e) {}
    if (A.on) A.unlock();
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

  var GAP = { chop: 0.12, mine: 0.12, hit: 0.07, arrow: 0.06, thud: 0.12, build: 0.15, death: 0.15 };
  var LOCAL = { chop: 1, mine: 1, hit: 1, arrow: 1, thud: 1, build: 1, death: 1, cannon: 1, boom: 1, collapse: 1 };
  G.sfx = function (name, x, y) {
    if (!A.on || !A.ac || !G.running || G.paused) return;
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
      case 'select': tone('sine', 660, t, 0.04, 0.05); break;
      case 'click': tone('sine', 880, t, 0.03, 0.05); break;
      case 'ack': tone('triangle', 520, t, 0.05, 0.06); tone('triangle', 780, t + 0.05, 0.05, 0.05); break;
      case 'place': burst(t, 0.1, 0.2, 'lowpass', 500, 1); tone('triangle', 392, t, 0.08, 0.06); break;
      case 'err': tone('square', 160, t, 0.12, 0.05); break;
      case 'train': tone('triangle', 784, t, 0.08, 0.06); tone('triangle', 988, t + 0.08, 0.1, 0.05); break;
      case 'built': tone('triangle', 523, t, 0.1, 0.08); tone('triangle', 659, t + 0.1, 0.1, 0.08); tone('triangle', 784, t + 0.2, 0.16, 0.08); break;
      case 'horn': horn(t, 196, 0.7); horn(t + 0.75, 147, 0.9); break;
      case 'age': [392, 523, 659, 784].forEach(function (f, i) { horn(t + i * 0.18, f / 2, 0.5); }); break;
      case 'win': [523, 659, 784, 1047].forEach(function (f, i) { tone('triangle', f, t + i * 0.22, 0.4, 0.1); }); break;
      case 'lose': [392, 349, 311, 262].forEach(function (f, i) { tone('triangle', f, t + i * 0.3, 0.5, 0.09); }); break;
    }
  };
})();
