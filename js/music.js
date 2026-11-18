// Muzica jocului, compusă pe loc: în pace o doină (fluier peste isonul cimpoiului, cu țambal),
// la luptă tobe, bucium și o scară orientală. Fără fișiere audio.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var Mu = G.Music = { on: true, mood: 'peace' };
  try { Mu.on = localStorage.getItem('scm_music') !== '0'; } catch (e) {}
  var ac = null, out = null, rev = null, timer = 0, next = 0, step = 0, droneNodes = [], moodGain = { peace: null, battle: null };
  var R = Math.random;

  // scări (semitonuri față de tonică): minorul românesc (doina) și frigicul dominant (ca la otomani)
  var DOINA = [0, 2, 3, 6, 7, 9, 10], HIJAZ = [0, 1, 4, 5, 7, 8, 10];
  var ROOT = 146.83; // Re
  // stilul fiecărei civilizații: scara de pace, scara de luptă, instrumentele
  var STYLES = {
    doina: { root: 146.83, peace: DOINA, battle: DOINA, lead: 'flute', pluck: 'tambal', war: 'horn' },
    ungar: { root: 164.81, peace: [0, 2, 3, 5, 7, 9, 10], battle: [0, 2, 3, 6, 7, 8, 11], lead: 'recorder', pluck: 'lute', war: 'trumpet' },
    hijaz: { root: 146.83, peace: HIJAZ, battle: HIJAZ, lead: 'ney', pluck: 'oud', war: 'zurna' },
    stepa: { root: 110, peace: [0, 3, 5, 7, 10, 12, 15], battle: [0, 3, 5, 7, 10, 12, 15], lead: 'flute', pluck: 'dombra', war: 'horn', gallop: true }
  };
  var ST = STYLES.doina;
  Mu.setCiv = function (civ) { ST = STYLES[(G.CIVS[civ] || {}).music] || STYLES.doina; ROOT = ST.root; DOINA = ST.peace; HIJAZ = ST.battle; };
  function hz(deg, scale, oct) {
    var n = scale.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n;
    return ROOT * Math.pow(2, (scale[i] + 12 * (o + (oct || 0))) / 12);
  }

  function impulse(sec, decay) {
    var len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  Mu.start = function (ctx, dest) {
    if (ac) return;
    ac = ctx;
    out = ac.createGain(); out.gain.value = Mu.on ? 0.16 : 0; out.connect(dest);
    rev = ac.createConvolver(); rev.buffer = impulse(2.6, 2.4);
    var wet = ac.createGain(); wet.gain.value = 0.35; rev.connect(wet); wet.connect(out);
    moodGain.peace = ac.createGain(); moodGain.peace.gain.value = 1; moodGain.peace.connect(out); moodGain.peace.connect(rev);
    moodGain.battle = ac.createGain(); moodGain.battle.gain.value = 0; moodGain.battle.connect(out); moodGain.battle.connect(rev);
    drone();
    next = ac.currentTime + 0.5;
    timer = setInterval(schedule, 120);
  };
  Mu.toggle = function () {
    Mu.on = !Mu.on;
    try { localStorage.setItem('scm_music', Mu.on ? '1' : '0'); } catch (e) {}
    if (out) out.gain.setTargetAtTime(Mu.on ? 0.16 : 0, ac.currentTime, 0.4);
  };
  Mu.setMood = function (m) {
    if (!ac || m === Mu.mood) return;
    Mu.mood = m;
    var t = ac.currentTime;
    moodGain.peace.gain.setTargetAtTime(m === 'peace' ? 1 : 0.15, t, 1.5);
    moodGain.battle.gain.setTargetAtTime(m === 'battle' ? 1 : 0, t, m === 'battle' ? 0.6 : 2.5);
  };

  // ---------- instrumentele ----------
  function drone() {
    // cimpoiul: tonica și cvinta, cu un vibrato lent
    [[ROOT / 2, 0.05], [ROOT * 0.75, 0.03], [ROOT, 0.018]].forEach(function (p) {
      var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = p[0];
      f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 1.2;
      l.frequency.value = 0.18 + R() * 0.1; lg.gain.value = 0.6; l.connect(lg); lg.connect(o.detune);
      g.gain.value = p[1];
      o.connect(f); f.connect(g); g.connect(moodGain.peace); o.start(); l.start();
      droneNodes.push(o, l);
    });
  }
  function flute(f, t, dur, vel) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
    var g2 = ac.createGain(); g2.gain.value = 0.12; o2.connect(g2); g2.connect(g);
    var a = vel * 0.11;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a, t + 0.06); g.gain.setValueAtTime(a * 0.85, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    // suflul fluierului
    var n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain();
    n.buffer = G.Audio.noiseBuf(); nf.type = 'bandpass'; nf.frequency.value = f * 2; nf.Q.value = 3;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(a * 0.25, t + 0.03); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    n.connect(nf); nf.connect(ng); ng.connect(moodGain.peace);
    o.connect(g); g.connect(moodGain.peace);
    o.start(t); o2.start(t); lfo.start(t); n.start(t, R() * 0.5);
    var e = t + dur + 0.2; o.stop(e); o2.stop(e); lfo.stop(e); n.stop(t + 0.3);
  }
  function tambal(f, t, vel, dest) {
    // țambalul: corzi lovite, două ușor dezacordate, cu stingere rapidă
    [1, 1.003].forEach(function (d) {
      var o = ac.createOscillator(), g = ac.createGain(), o3 = ac.createOscillator(), g3 = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f * d; o3.type = 'sine'; o3.frequency.value = f * d * 3; g3.gain.value = 0.18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.06, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g); o3.connect(g3); g3.connect(g); g.connect(dest || moodGain.peace);
      o.start(t); o3.start(t); o.stop(t + 1.5); o3.stop(t + 1.5);
    });
  }
  function zurna(f, t, dur, vel) {
    var o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; bp.type = 'bandpass'; bp.frequency.value = f * 3.2; bp.Q.value = 2.4;
    l.frequency.value = 6; lg.gain.value = f * 0.018; l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.09, t + 0.05); g.gain.setValueAtTime(vel * 0.08, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(bp); bp.connect(g); g.connect(moodGain.battle); o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1);
  }
  function pluck(f, t, vel, dest, kind) {
    // lăută, oud, dombra: corzi ciupite, mai calde decât țambalul
    var o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = kind === 'dombra' ? 'square' : 'sawtooth'; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(kind === 'oud' ? 2200 : 2800, t); lp.frequency.exponentialRampToValueAtTime(400, t + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'lute' ? 1.6 : 1.0));
    o.connect(lp); lp.connect(g); g.connect(dest || moodGain.peace); o.start(t); o.stop(t + 1.7);
  }
  function plk(f, t, vel, dest) { if (ST.pluck === 'tambal') tambal(f, t, vel, dest); else pluck(f, t, vel, dest, ST.pluck); }
  function lead(f, t, dur, vel) {
    if (ST.lead === 'ney') { flute(f, t, dur, vel * 0.8); var n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain(); n.buffer = G.Audio.noiseBuf(); nf.type = 'bandpass'; nf.frequency.value = f * 1.5; nf.Q.value = 1.5; ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(vel * 0.03, t + 0.1); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(nf); nf.connect(ng); ng.connect(moodGain.peace); n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.05); }
    else if (ST.lead === 'recorder') flute(f * 2, t, dur, vel * 0.8);
    else flute(f, t, dur, vel);
  }
  function drum(t, vel, low) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(low ? 90 : 160, t); o.frequency.exponentialRampToValueAtTime(low ? 45 : 70, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * 0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(moodGain.battle); o.start(t); o.stop(t + 0.35);
    var n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain();
    n.buffer = G.Audio.noiseBuf(); nf.type = 'lowpass'; nf.frequency.value = low ? 600 : 1800;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vel * 0.12, t + 0.003); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(nf); nf.connect(ng); ng.connect(moodGain.battle); n.start(t, R() * 0.5); n.stop(t + 0.15);
  }
  function horn(f, t, dur, vel) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), f1 = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.004;
    f1.type = 'lowpass'; f1.frequency.setValueAtTime(400, t); f1.frequency.linearRampToValueAtTime(1300, t + 0.15); f1.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.07, t + 0.12); g.gain.setValueAtTime(vel * 0.06, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(f1); o2.connect(f1); f1.connect(g); g.connect(moodGain.battle);
    o.start(t); o2.start(t); o.stop(t + dur + 0.25); o2.stop(t + dur + 0.25);
  }

  // ---------- compoziția ----------
  var deg = 4, phraseLeft = 0, rest = 0;
  function nextDegree() {
    var r = R(), d;
    if (r < 0.62) d = R() < 0.5 ? 1 : -1;
    else if (r < 0.85) d = R() < 0.5 ? 2 : -2;
    else d = R() < 0.5 ? 3 : -4;
    deg = Math.max(0, Math.min(11, deg + d));
    return deg;
  }
  function schedule() {
    if (!ac || !Mu.on) return;
    var horizon = ac.currentTime + 0.5;
    while (next < horizon) {
      var t = next, bat = Mu.mood === 'battle';
      if (!bat) {
        // doina: fraze libere de fluier, cu pauze și țambal rar
        if (rest > 0) { rest--; next += 0.42; if (R() < 0.25) plk(hz([0, 2, 4][(R() * 3) | 0], DOINA, 1), t, 0.6); continue; }
        if (phraseLeft <= 0) { phraseLeft = 4 + ((R() * 6) | 0); }
        var d = phraseLeft === 1 ? (R() < 0.6 ? 0 : 4) : nextDegree();
        var len = [0.42, 0.42, 0.84, 0.84, 1.26, 0.28][(R() * 6) | 0] * (phraseLeft === 1 ? 2.2 : 1);
        if (R() < 0.18) lead(hz(d + 1, DOINA, 1), t, 0.07, 0.6); // ornament
        lead(hz(d, DOINA, 1), t + (R() < 0.18 ? 0.07 : 0), len, 0.7 + R() * 0.3);
        if (step % 4 === 0) plk(hz(d - 7, DOINA, 1), t, 0.45);
        phraseLeft--; step++;
        next += len;
        if (phraseLeft <= 0) rest = 2 + ((R() * 5) | 0);
      } else {
        // lupta: tobe pe opt timpi, bucium și țambal pe scara orientală
        var beat = step % 8;
        if (ST.gallop) { // galopul stepei: trei lovituri, o pauză
          if (beat % 4 !== 3) drum(t, beat === 0 ? 1 : 0.55, beat === 0 || beat === 4);
        } else {
          drum(t, beat === 0 ? 1 : beat === 4 ? 0.8 : 0.45, beat === 0 || beat === 4);
          if (beat === 2 || beat === 6 || R() < 0.15) drum(t + 0.13, 0.3, false);
        }
        if (step % 32 === 0) {
          if (ST.war === 'zurna') { var d0 = nextDegree() % 7; zurna(hz(d0, HIJAZ, 1), t, 0.45, 1); zurna(hz(d0 + 1, HIJAZ, 1), t + 0.48, 0.45, 0.9); zurna(hz(d0, HIJAZ, 1), t + 0.96, 0.9, 1); }
          else { horn(hz(0, HIJAZ, ST.war === 'trumpet' ? 0 : -1), t, 0.9, 1); horn(hz(4, HIJAZ, ST.war === 'trumpet' ? 0 : -1), t + 1.0, 1.2, 0.9); }
        }
        if (ST.war === 'zurna' && step % 4 === 2 && R() < 0.5) zurna(hz(nextDegree() % 7, HIJAZ, 1), t, 0.22, 0.6);
        if (step % 2 === 0 && R() < 0.7) plk(hz(nextDegree() % 7, HIJAZ, 1), t, 0.7, moodGain.battle);
        step++;
        next += ST.gallop ? 0.2 : 0.24;
      }
    }
  }
})();
