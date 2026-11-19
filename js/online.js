// Sala de așteptare a jocului online: creezi o cameră și trimiți linkul (pe WhatsApp, de exemplu) sau intri cu un cod.
// Fiecare își alege țara și echipa; gazda alege harta, adaugă calculatoare și pornește jocul.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var N = G.Net; if (!N) return;
  var $ = function (id) { return document.getElementById(id); };
  var MAPS = [['rau', 'Valea Siretului'], ['codri', 'Codrii'], ['stepa', 'Stepa'], ['munti', 'Munții'], ['delta', 'Delta Dunării'], ['lac', 'Lacul']];
  var SIZES = [[72, 'Mică'], [96, 'Medie'], [120, 'Mare']];
  var O = G.Online = { err: '', busy: false, code: '' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(on) { $('online').classList.toggle('on', on); }
  function civName(c) { var C = G.CIVS[c]; return C ? C.flag + ' ' + C.name : c; }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function civSel(id, cur) { return '<select id="' + id + '">' + G.CIV_LIST.map(function (c) { return opt(c, civName(c), cur); }).join('') + '</select>'; }
  function teamSel(id, cur) { return '<select id="' + id + '">' + [0, 1, 2, 3, 4].map(function (t) { return opt(t, t ? 'Echipa ' + t : 'Fără echipă', cur || 0); }).join('') + '</select>'; }
  function link(code) { return location.origin + location.pathname + '?cam=' + code; }

  var sig = '';
  function render(force) {
    if (N.on) { show(false); return; }
    var box = $('onlineBox'), d = N.data, html;
    var s2 = JSON.stringify([N.code, d && d.members, d && d.opts, d && d.host, O.err, O.busy]);
    if (!force && s2 === sig) return; sig = s2;
    if (!N.code) {
      html = '<h2>🌐 Joc online</h2><p class="nsub">Joacă cu prietenii, pe internet. Creezi o cameră și le trimiți linkul.</p>' +
        '<label class="nrow">Numele tău <input id="nName" maxlength="24" value="' + esc(N.name()) + '"></label>' +
        '<button class="btn big go" id="nCreate">⚔️ Creează o cameră</button>' +
        '<div class="nor">sau intră la un prieten</div>' +
        '<div class="row2"><input id="nCode" maxlength="6" placeholder="Codul camerei" value="' + esc(O.code) + '"><button class="btn" id="nJoin">Intră</button></div>';
    } else if (!d) {
      html = '<h2>🌐 Camera ' + esc(N.code) + '</h2><p class="nsub">Se conectează…</p>';
    } else {
      var host = N.isHost(), seats = N.seatsOf(d), o = d.opts || {};
      html = '<h2>🌐 Camera <b class="ncode">' + esc(N.code) + '</b></h2>' +
        '<button class="btn" id="nShare">📤 Trimite invitația</button>' +
        '<table class="nseats">' + seats.map(function (s, i) {
          var me = s.uid === N.uid, isHost = s.uid && s.uid === d.host;
          var nm = (s.ai ? '🤖 ' : '') + esc(s.name || 'Jucător') + (isHost ? ' 👑' : '') + (me ? ' <i>(tu)</i>' : '');
          var civ = me ? civSel('nCiv', s.civ) : (s.ai && host ? civSel('nAiCiv' + i, s.civ) : civName(s.civ));
          var team = me ? teamSel('nTeam', s.team) : (s.ai && host ? teamSel('nAiTeam' + i, s.team) : (s.team ? 'Echipa ' + s.team : 'Fără echipă'));
          var rm = s.ai && host ? '<button class="btn nrm" data-ai="' + (i - seats.filter(function (x) { return !x.ai; }).length) + '">✕</button>' : '';
          return '<tr><td>' + (i + 1) + '.</td><td>' + nm + '</td><td>' + civ + '</td><td>' + team + '</td><td>' + rm + '</td></tr>';
        }).join('') + '</table>' +
        (host ? '<div class="row2"><label>Harta <select id="nMap">' + MAPS.map(function (m) { return opt(m[0], m[1], o.map || 'rau'); }).join('') + '</select></label>' +
          '<label>Mărimea <select id="nSize">' + SIZES.map(function (m) { return opt(m[0], m[1], o.size || 96); }).join('') + '</select></label></div>'
          : '<p class="nsub">Harta: ' + esc((MAPS.find(function (m) { return m[0] === (o.map || 'rau'); }) || MAPS[0])[1]) + ', ' + esc((SIZES.find(function (m) { return m[0] === (o.size || 96); }) || SIZES[1])[1]).toLowerCase() + '. Gazda pornește jocul.</p>') +
        '<div class="row2">' + (host && seats.length < 8 ? '<button class="btn" id="nAddAi">🤖 Adaugă un calculator</button>' : '') +
        (host ? '<button class="btn go" id="nStart"' + (seats.length < 2 ? ' disabled' : '') + '>⚔️ Pornește</button>' : '') + '</div>';
    }
    html += (O.err ? '<p class="nerr">' + esc(O.err) + '</p>' : '') + '<button class="btn" id="nBack">' + (N.code ? 'Ieși din cameră' : 'Înapoi') + '</button>';
    box.innerHTML = html;
    wire();
  }
  function act(p) { O.err = ''; O.busy = true; render(true); return p.then(function () { O.busy = false; render(true); }, function (e) { O.busy = false; O.err = e.message || String(e); render(true); }); }
  function wire() {
    var d = N.data;
    function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
    on('nName', 'change', function () { N.setName(this.value); });
    on('nCreate', 'click', function () { N.setName($('nName').value); act(N.create({ map: 'rau', size: 96, ai: [] })); });
    on('nJoin', 'click', function () { N.setName($('nName').value); O.code = $('nCode').value; act(N.join(O.code)); });
    on('nCode', 'keydown', function (e) { if (e.key === 'Enter') $('nJoin').click(); });
    on('nBack', 'click', function () { if (N.code) { act(N.leave()); } else show(false); });
    on('nCiv', 'change', function () { act(N.setMine({ civ: this.value })); });
    on('nTeam', 'change', function () { act(N.setMine({ team: +this.value })); });
    on('nMap', 'change', function () { act(N.setOpts(Object.assign({}, d.opts, { map: this.value }))); });
    on('nSize', 'change', function () { act(N.setOpts(Object.assign({}, d.opts, { size: +this.value }))); });
    on('nAddAi', 'click', function () {
      var used = N.seatsOf().map(function (s) { return s.civ; }), free = G.CIV_LIST.filter(function (c) { return used.indexOf(c) < 0; });
      var ai = ((d.opts && d.opts.ai) || []).concat([{ civ: (free[0] || G.CIV_LIST[0]), team: 0 }]);
      act(N.setOpts(Object.assign({}, d.opts, { ai: ai })));
    });
    document.querySelectorAll('#onlineBox .nrm').forEach(function (b) { b.addEventListener('click', function () {
      var ai = ((d.opts && d.opts.ai) || []).slice(); ai.splice(+b.dataset.ai, 1); act(N.setOpts(Object.assign({}, d.opts, { ai: ai })));
    }); });
    var nh = N.seatsOf().filter(function (s) { return !s.ai; }).length;
    N.seatsOf().forEach(function (s, i) {
      if (!s.ai) return; var k = i - nh;
      on('nAiCiv' + i, 'change', function () { var ai = d.opts.ai.slice(); ai[k] = Object.assign({}, ai[k], { civ: this.value }); act(N.setOpts(Object.assign({}, d.opts, { ai: ai }))); });
      on('nAiTeam' + i, 'change', function () { var ai = d.opts.ai.slice(); ai[k] = Object.assign({}, ai[k], { team: +this.value }); act(N.setOpts(Object.assign({}, d.opts, { ai: ai }))); });
    });
    on('nStart', 'click', function () { act(N.start()); });
    on('nShare', 'click', function () {
      var u = link(N.code), txt = 'Hai la o bătălie în Era Domnitorilor! Camera ' + N.code + ': ' + u;
      if (navigator.share) navigator.share({ title: 'Era Domnitorilor', text: 'Hai la o bătălie în Era Domnitorilor! Camera ' + N.code, url: u }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { O.err = ''; G.msg && G.msg('Linkul e copiat.', 'info'); var b = $('nShare'); if (b) b.textContent = '✓ Linkul e copiat'; });
    });
  }
  O.open = function (code) { if (code) O.code = code; O.err = ''; render(true); show(true); };
  N.onChange(function () { render(); });

  // după joc: meniul principal te scoate și din cameră (cine pleacă în mijlocul jocului e preluat de calculator)
  var toMenu0 = G.toMenu;
  G.toMenu = function () {
    if (N.code) { var q = N.on ? N.quitGame() : Promise.resolve(); q.then(function () { return N.leave(); }); }
    return toMenu0.apply(this, arguments);
  };

  window.addEventListener('load', function () {
    if ($('bOnline')) $('bOnline').addEventListener('click', function () { O.open(); });
    if ($('netWait')) $('netWait').querySelector('button').addEventListener('click', function () { if (G.netContinueWithout) G.netContinueWithout(); });
    var qs = new URLSearchParams(location.search), cam = qs.get('cam');
    if (cam) { history.replaceState(null, '', location.pathname); O.open(cam.toUpperCase()); return; }
    // pagina s-a reîncărcat în timpul unui joc online: reintri singur, iar jocul se reia de unde a rămas
    var last = null; try { last = localStorage.getItem('scm_net_room'); } catch (e) {}
    if (last) N.join(last).then(function (r) {
      if (r.state === 'lobby') O.open(); else if (r.state !== 'playing') N.leave();
    }, function () { try { localStorage.setItem('scm_net_room', ''); } catch (e) {} N.code = ''; });
  });
})();
