// Atingeri și mouse: un deget mută harta, două degete fac zoom, apăsat lung + tras alege mai mulți.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var In = G.Input = { box: null };
  var pts = new Map(), mode = 'none', start = null, lpTimer = 0, last = null, pinch = null, lastTap = null;
  var MOVE_TOL = 10, LONG_MS = 380;

  In.init = function (cv) {
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', cancel);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.offsetX, e.offsetY, G.cam.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (!G.S || !G.running) return;
      var c = G.cam, s = 1.2 / c.z;
      if (e.key === 'ArrowLeft') { c.x -= s; c.y += s; }
      else if (e.key === 'ArrowRight') { c.x += s; c.y -= s; }
      else if (e.key === 'ArrowUp') { c.x -= s; c.y -= s; }
      else if (e.key === 'ArrowDown') { c.x += s; c.y += s; }
      else if (e.key === 'Escape') { if (G.UI.place) G.UI.cancelPlace(); else G.UI.select([]); }
      G.R.clampCam();
    });
    var mini = document.getElementById('mini');
    var miniDrag = false;
    function miniGo(e) { var r = mini.getBoundingClientRect(), w = G.R.miniToWorld(e.clientX - r.left, e.clientY - r.top); G.R.center(w[0], w[1]); }
    mini.addEventListener('pointerdown', function (e) { if (!G.S) return; miniDrag = true; try { mini.setPointerCapture(e.pointerId); } catch (er) {} miniGo(e); });
    mini.addEventListener('pointermove', function (e) { if (miniDrag) miniGo(e); });
    mini.addEventListener('pointerup', function () { miniDrag = false; });
    mini.addEventListener('pointercancel', function () { miniDrag = false; });
  };

  function pos(e) { var r = e.target.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function zoomAt(sx, sy, nz) {
    var before = G.R.s2w(sx, sy);
    G.cam.z = Math.max(0.55, Math.min(2.2, nz));
    var after = G.R.s2w(sx, sy);
    G.cam.x += before[0] - after[0]; G.cam.y += before[1] - after[1];
    G.R.clampCam();
  }
  function pan(dx, dy) {
    var z = G.cam.z, a = dx / (32 * z), b = dy / (16 * z);
    G.cam.x -= (a + b) / 2; G.cam.y -= (b - a) / 2;
    G.R.clampCam();
  }

  function down(e) {
    if (!G.S || !G.running) return;
    try { e.target.setPointerCapture(e.pointerId); } catch (er) {}
    var p = pos(e);
    pts.set(e.pointerId, p);
    if (e.pointerType === 'mouse' && e.button === 2) { G.UI.commandAt(p.x, p.y); mode = 'none'; return; }
    if (pts.size === 1) {
      start = { x: p.x, y: p.y, t: performance.now() }; last = p; mode = 'pending';
      clearTimeout(lpTimer);
      if (e.pointerType === 'mouse' && e.shiftKey) { mode = 'box'; In.box = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; return; }
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
    if (!pts.has(e.pointerId)) return;
    var p = pos(e);
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
    if (!pts.has(e.pointerId)) return;
    var p = pos(e);
    pts.delete(e.pointerId);
    clearTimeout(lpTimer);
    if (mode === 'pending') {
      var now = performance.now();
      var dbl = lastTap && now - lastTap.t < 330 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 26;
      lastTap = dbl ? null : { x: p.x, y: p.y, t: now };
      G.UI.tapWorld(p.x, p.y, dbl);
    } else if (mode === 'box' && In.box) {
      G.UI.boxSelect(In.box.x0, In.box.y0, In.box.x1, In.box.y1);
    }
    In.box = null;
    if (pts.size === 0) mode = 'none';
    else if (mode === 'pinch') mode = 'after';
  }
  function cancel(e) { pts.delete(e.pointerId); clearTimeout(lpTimer); In.box = null; if (!pts.size) mode = 'none'; }
})();
