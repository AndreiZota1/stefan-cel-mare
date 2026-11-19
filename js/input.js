// Comenzi: pe calculator ca în AoE2 (clic stânga alege, clic dreapta dă comanda, tras = pătrat de selecție),
// pe telefon cu degetul (atingere, apăsat lung + tras, două degete pentru zoom).
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var In = G.Input = { box: null, mouse: null };
  var cv, pts = new Map(), mode = 'none', start = null, lpTimer = 0, last = null, pinch = null, lastTap = null, lastClick = null;
  var keys = {}, hoverT = 0, spaceAt = 0;
  var MOVE_TOL = 10, LONG_MS = 380, GRID = ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'];
  In.GRID = GRID;

  In.init = function (canvas) {
    cv = canvas;
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', cancel);
    cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && mode !== 'box') In.mouse = null; });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('auxclick', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY, dx = e.deltaMode === 1 ? e.deltaX * 33 : e.deltaX;
      var trackpad = !e.ctrlKey && e.deltaMode === 0 && (Math.abs(dx) > 0.5 || Math.abs(dy) % 1 !== 0 || Math.abs(dy) < 40);
      if (trackpad) pan(-dx, -dy);
      else zoomAt(e.offsetX, e.offsetY, G.cam.z * Math.pow(e.ctrlKey ? 1.01 : 1.0015, -dy));
    }, { passive: false });
    // poziția mouse-ului oriunde în fereastră (și peste bare), pentru derularea la margini
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') In.mouseWin = { x: e.clientX, y: e.clientY }; });
    document.addEventListener('mouseleave', function () { In.mouseWin = null; });
    document.addEventListener('contextmenu', function (e) { if (G.running) e.preventDefault(); });
    window.addEventListener('blur', function () { keys = {}; In.mouse = null; });
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', function (e) {
      keys[e.key] = false;
      if (e.key === ' ' && performance.now() - spaceAt < 250 && G.running && mode !== 'mpan') G.UI.lastAlert();
    });
    var mini = document.getElementById('mini'), miniDrag = false;
    function miniW(e) { var r = mini.getBoundingClientRect(); return G.R.miniToWorld(e.clientX - r.left, e.clientY - r.top); }
    mini.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    mini.addEventListener('pointerdown', function (e) {
      if (!G.S) return;
      var w = miniW(e);
      if (e.button === 2) { G.UI.orderTo(w[0], w[1]); return; }
      miniDrag = true; try { mini.setPointerCapture(e.pointerId); } catch (er) {}
      G.R.center(w[0], w[1]);
    });
    mini.addEventListener('pointermove', function (e) { if (miniDrag) { var w = miniW(e); G.R.center(w[0], w[1]); } });
    mini.addEventListener('pointerup', function () { miniDrag = false; });
    mini.addEventListener('pointercancel', function () { miniDrag = false; });
  };

  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function zoomAt(sx, sy, nz) {
    var before = G.R.s2w(sx, sy);
    G.cam.z = Math.max(0.55, Math.min(2.4, nz));
    var after = G.R.s2w(sx, sy);
    G.cam.x += before[0] - after[0]; G.cam.y += before[1] - after[1];
    G.R.clampCam();
  }
  function pan(dx, dy) {
    var z = G.cam.z, a = dx / (32 * z), b = dy / (16 * z);
    G.cam.x -= (a + b) / 2; G.cam.y -= (b - a) / 2;
    G.R.clampCam();
  }
  In.pan = pan;
  In.zoomBy = function (f) { zoomAt(G.R.W / 2, G.R.H / 2, G.cam.z * f); };

  // derularea hărții: săgeți și marginile ecranului
  In.tick = function (dt) {
    if (!G.S || !G.running || G.paused) return;
    var vx = 0, vy = 0, sp = 950 * dt;
    if (keys.ArrowLeft) vx -= sp; if (keys.ArrowRight) vx += sp; if (keys.ArrowUp) vy -= sp; if (keys.ArrowDown) vy += sp;
    var m = In.mouseWin || In.mouse;
    if (m && mode !== 'mpan' && mode !== 'rpan' && document.hasFocus()) {
      var W = window.innerWidth, H = window.innerHeight, e = 4;
      if (m.x <= e) vx -= sp; else if (m.x >= W - e) vx += sp;
      if (m.y <= e) vy -= sp; else if (m.y >= H - e) vy += sp;
    }
    if (vx || vy) {
      pan(-vx, -vy);
      if (In.box && m) { In.box.x0 -= vx; In.box.y0 -= vy; }
    }
  };

  function down(e) {
    if (!G.S || !G.running) return;
    var p = pos(e);
    if (e.pointerType === 'mouse') {
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      In.mouse = p;
      if (e.button === 2) { mode = 'rpend'; start = p; last = p; return; }
      if (e.button === 1 || (e.button === 0 && keys[' '])) { mode = 'mpan'; last = p; e.preventDefault(); return; }
      if (e.button !== 0) return;
      if (G.UI.place) { G.UI.placeAt(p.x, p.y, e.shiftKey); mode = 'none'; return; }
      mode = 'lpend'; start = p; last = p;
      return;
    }
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    pts.set(e.pointerId, p);
    if (pts.size === 1) {
      start = { x: p.x, y: p.y, t: performance.now() }; last = p; mode = 'pending';
      clearTimeout(lpTimer);
      lpTimer = setTimeout(function () {
        if (mode !== 'pending' || G.UI.place) return;
        mode = 'box'; In.box = { x0: start.x, y0: start.y, x1: last.x, y1: last.y };
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) {}
      }, LONG_MS);
    } else if (pts.size === 2) {
      clearTimeout(lpTimer); In.box = null;
      var a = Array.from(pts.values());
      pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), z: G.cam.z, mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2 };
      mode = 'pinch';
    }
  }
  function move(e) {
    var p = pos(e);
    if (e.pointerType === 'mouse') {
      In.mouse = p;
      if (G.UI.place) G.UI.placeHover(p.x, p.y);
      if (mode === 'lpend' && Math.hypot(p.x - start.x, p.y - start.y) > 5) { mode = 'box'; In.box = { x0: start.x, y0: start.y, x1: p.x, y1: p.y }; }
      else if (mode === 'box' && In.box) { In.box.x1 = p.x; In.box.y1 = p.y; }
      else if (mode === 'mpan' || mode === 'rpan') { pan(p.x - last.x, p.y - last.y); last = p; }
      else if (mode === 'rpend' && Math.hypot(p.x - start.x, p.y - start.y) > 6) { mode = 'rpan'; pan(p.x - last.x, p.y - last.y); last = p; cv.style.cursor = 'grabbing'; }
      var now = performance.now();
      if (now - hoverT > 50) { hoverT = now; G.UI.hoverAt(p.x, p.y); }
      return;
    }
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, p);
    if (mode === 'pending') {
      if (Math.hypot(p.x - start.x, p.y - start.y) > MOVE_TOL) { mode = 'pan'; clearTimeout(lpTimer); }
      else { last = p; return; }
    }
    if (mode === 'pan') { pan(p.x - last.x, p.y - last.y); last = p; }
    else if (mode === 'box') { In.box.x1 = p.x; In.box.y1 = p.y; last = p; }
    else if (mode === 'pinch' && pts.size >= 2) {
      var a = Array.from(pts.values());
      var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx = (a[0].x + a[1].x) / 2, my = (a[0].y + a[1].y) / 2;
      zoomAt(mx, my, pinch.z * d / Math.max(20, pinch.d));
      pan(mx - pinch.mx, my - pinch.my);
      pinch.mx = mx; pinch.my = my;
    }
  }
  function up(e) {
    var p = pos(e);
    if (e.pointerType === 'mouse') {
      if (e.button === 0) {
        if (mode === 'box' && In.box) G.UI.boxSelect(In.box.x0, In.box.y0, In.box.x1, In.box.y1, e.shiftKey);
        else if (mode === 'lpend') {
          var now = performance.now();
          var dbl = lastClick && now - lastClick.t < 330 && Math.hypot(p.x - lastClick.x, p.y - lastClick.y) < 8;
          lastClick = dbl ? null : { x: p.x, y: p.y, t: now };
          G.UI.clickSelect(p.x, p.y, { shift: e.shiftKey, dbl: dbl });
        }
        In.box = null; mode = 'none';
      } else if (e.button === 2) {
        if (mode === 'rpend') { if (G.UI.place) G.UI.cancelPlace(); else G.UI.commandAt(p.x, p.y, e.shiftKey); }
        if (mode === 'rpan') cv.style.cursor = '';
        mode = 'none';
      } else if (mode === 'mpan') mode = 'none';
      return;
    }
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    clearTimeout(lpTimer);
    if (mode === 'pending') {
      var now2 = performance.now();
      var dbl2 = lastTap && now2 - lastTap.t < 330 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 26;
      lastTap = dbl2 ? null : { x: p.x, y: p.y, t: now2 };
      G.UI.tapWorld(p.x, p.y, dbl2);
    } else if (mode === 'box' && In.box) G.UI.boxSelect(In.box.x0, In.box.y0, In.box.x1, In.box.y1, false);
    In.box = null;
    if (pts.size === 0) mode = 'none'; else if (mode === 'pinch') mode = 'after';
  }
  function cancel(e) { pts.delete(e.pointerId); clearTimeout(lpTimer); In.box = null; if (!pts.size) mode = 'none'; }

  function keydown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (!G.S || !G.running) return;
    var k = e.key, lk = k.length === 1 ? k.toLowerCase() : k;
    if (G.paused) { if (k === 'Escape' || lk === 'p' || k === 'F3') { G.resume(); e.preventDefault(); } return; }
    if (k.indexOf('Arrow') === 0) { keys[k] = true; e.preventDefault(); return; }
    if (/^Digit[1-9]$/.test(e.code)) {
      var n = +e.code.slice(5);
      if (e.ctrlKey || e.metaKey || e.altKey) G.UI.setGroup(n); else G.UI.getGroup(n);
      e.preventDefault(); return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'Enter') { G.UI.openChat(); e.preventDefault(); return; }
    if (k === 'Escape') G.UI.escape();
    else if (lk === 'h') G.UI.goHome();
    else if (k === '.' || k === ',') G.UI.nextIdle(k === ',');
    else if (k === ' ') { if (!e.repeat) { keys[' '] = true; spaceAt = performance.now(); } }
    else if (k === 'PageUp' || k === ']') zoomAt(G.R.W / 2, G.R.H / 2, G.cam.z * 1.15);
    else if (k === 'PageDown' || k === '[') zoomAt(G.R.W / 2, G.R.H / 2, G.cam.z / 1.15);
    else if (k === 'Delete' || k === 'Backspace') G.UI.deleteSel();
    else if (lk === 'p' || k === 'F3') G.pause();
    else if (k === '+' || k === '=') G.UI.speed(1);
    else if (k === '-') G.UI.speed(-1);
    else if (GRID.indexOf(lk) >= 0) G.UI.hotkey(GRID.indexOf(lk));
    else return;
    e.preventDefault();
  }
})();
