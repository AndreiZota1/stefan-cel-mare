// Meniurile: ecranul principal, bătălia liberă, arborele tehnologiilor, ecranul de final.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var M = G.Menu = {};
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(id, on) { var el = $(id); if (el) el.classList.toggle('on', on); }
  M.show = show;

  var MAPS = [['rau', 'Valea Siretului', 'Un râu cu vaduri și poduri desparte țările.'], ['codri', 'Codrii Cosminului', 'Pădure deasă, poieni și drumuri înguste.'],
    ['stepa', 'Stepa Bugeacului', 'Câmpie deschisă, bălți, multe turme.'], ['delta', 'Delta Dunării', 'Brațe de apă, stuf și ostroave legate prin vaduri.'],
    ['munti', 'Carpații', 'Creste de stâncă, trecători, aur și piatră din belșug.'],
    ['mare', 'Țărmul Mării Negre', 'Marea de jur împrejur: porturi, pescuit în larg, bătălii pe apă.'], ['lac', 'Lacul', 'Un lac mare în mijloc, cu bancuri de pești. Cine ține apa, ține mijlocul.'],
    ['rnd', 'La întâmplare', 'O hartă aleasă de soartă.']];
  var MODES = [['1v1', '1 contra 1', [2]], ['1v2', '1 contra 2', [2, 2]], ['2v2', '2 contra 2', [1, 2, 2]], ['ffa3', 'Toți contra toți (3)', [2, 3]], ['ffa4', 'Toți contra toți (4)', [2, 3, 4]], ['1v3', '1 contra 3', [2, 2, 2]]];
  var DEF = { civ: 'mol', mode: '1v1', ai: ['oto', 'rnd', 'rnd'], map: 'rau', size: 0, season: 'vara', diff: 'normal', victory: 'cucerire', startAge: 0, res: 'std', popMax: 100, peace: 0, reveal: 'normal' };
  var cfg = Object.assign({}, DEF);
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem('scm_setup') || '{}')); } catch (e) {}

  function opt(v, label, cur) { return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function civOpts(cur, rnd) { return (rnd ? opt('rnd', '🎲 La întâmplare', cur) : '') + G.CIV_LIST.map(function (c) { return opt(c, G.CIVS[c].flag + ' ' + G.CIVS[c].name, cur); }).join(''); }

  // ---------- bătălia liberă ----------
  M.openSetup = function () { renderSetup(); show('setup', true); };
  function renderSetup() {
    var mode = MODES.find(function (m) { return m[0] === cfg.mode; }) || MODES[0];
    var html = '<h2>Bătălie liberă</h2><div class="civs">' + G.CIV_LIST.map(function (c) {
      var C = G.CIVS[c];
      return '<button class="civc' + (cfg.civ === c ? ' on' : '') + '" data-civ="' + c + '"><img src="' + G.R.icon('u', 'hero', c) + '" alt=""><b>' + esc(C.name) + '</b><small>' + esc(C.hero) + '</small></button>';
    }).join('') + '</div>';
    var C0 = G.CIVS[cfg.civ];
    html += '<div class="civinfo"><img src="' + G.R.icon('u', C0.uniq, cfg.civ) + '" alt=""><div><b>' + esc(C0.name) + '</b> — ' + esc(C0.year) + '<ul>' + C0.bonus.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
      '<li>Puterea eroului: <b>' + esc(G.POWERS[C0.power].name) + '</b> — ' + esc(G.POWERS[C0.power].desc) + '</li></ul>' +
      // cum arată civilizația: clădirile și oamenii ei
      '<div class="civlook">' + [['b', 'cetate'], ['b', 'casa'], ['b', 'manastire'], ['b', 'fortareata'], ['b', 'minune'], ['u', 'vil'], ['u', 'mil3'], ['u', 'arc2'], ['u', 'kni2'], ['u', C0.uniq + '2']].map(function (q) {
        var t = q[1], d = q[0] === 'b' ? G.BLDS[t] : G.UNITS[t], nm = d ? G.nm(d, cfg.civ) : t;
        return '<img src="' + G.R.icon(q[0], t, cfg.civ) + '" title="' + esc(nm) + '" alt="">';
      }).join('') + '</div></div></div>';
    html += '<div class="grid2">';
    html += '<label>Jucători<select data-k="mode">' + MODES.map(function (m) { return opt(m[0], m[1], cfg.mode); }).join('') + '</select></label>';
    mode[2].forEach(function (team, i) {
      html += '<label>' + (team === 1 ? '🤝 Aliatul tău' : '⚔️ Adversar' + (mode[2].length > 1 ? ' ' + (i + 1) : '')) + '<select data-ai="' + i + '">' + civOpts(cfg.ai[i] || 'rnd', true) + '</select></label>';
    });
    html += '<label>Harta<select data-k="map">' + MAPS.map(function (m) { return opt(m[0], m[1], cfg.map); }).join('') + '</select></label>';
    html += '<label>Mărimea<select data-k="size">' + opt(0, 'Potrivită', cfg.size) + opt(72, 'Mică', cfg.size) + opt(96, 'Medie', cfg.size) + opt(120, 'Mare', cfg.size) + '</select></label>';
    html += '<label>Anotimpul<select data-k="season">' + opt('vara', '☀️ Vară', cfg.season) + opt('iarna', '❄️ Iarnă', cfg.season) + '</select></label>';
    html += '<label>Greutatea<select data-k="diff">' + Object.keys(G.DIFF).map(function (d) { return opt(d, G.DIFF[d].name, cfg.diff); }).join('') + '</select></label>';
    html += '<label>Victoria<select data-k="victory">' + opt('cucerire', 'Cucerire', cfg.victory) + opt('minune', 'Minune (sau cucerire)', cfg.victory) + opt('regicid', 'Regicid: cade eroul, pierzi', cfg.victory) + opt('deal', 'Regele dealului: ține monumentul 10 minute', cfg.victory) + '</select></label>';
    html += '<label>Începutul<select data-k="start">' + opt('cetate', 'Cu cetate', cfg.start) + opt('nomazi', 'Nomazi: fără cetate', cfg.start) + '</select></label>';
    html += '<label>Ziua și noaptea<select data-k="daynight">' + opt(0, 'Doar zi', cfg.daynight) + opt(1, 'Zi și noapte', cfg.daynight) + '</select></label>';
    html += '<label>Începi în<select data-k="startAge">' + G.AGES.map(function (a, i) { return opt(i, a, cfg.startAge); }).join('') + '</select></label>';
    html += '<label>Resurse<select data-k="res">' + opt('std', 'Puține', cfg.res) + opt('med', 'Medii', cfg.res) + opt('mult', 'Multe', cfg.res) + '</select></label>';
    html += '<label>Limita de oameni<select data-k="popMax">' + [75, 100, 150, 200].map(function (n) { return opt(n, n, cfg.popMax); }).join('') + '</select></label>';
    html += '<label>Pace la început<select data-k="peace">' + opt(0, 'Fără', cfg.peace) + opt(5, '5 minute', cfg.peace) + opt(10, '10 minute', cfg.peace) + opt(20, '20 de minute', cfg.peace) + '</select></label>';
    html += '<label>Harta se vede<select data-k="reveal">' + opt('normal', 'Doar ce descoperi', cfg.reveal) + opt('explorat', 'Explorată', cfg.reveal) + opt('tot', 'Toată', cfg.reveal) + '</select></label>';
    html += '</div><div class="mapinfo">' + esc((MAPS.find(function (m) { return m[0] === cfg.map; }) || MAPS[0])[2]) + '</div>';
    html += '<div class="row2"><button class="btn" id="sBack">Înapoi</button><button class="btn go" id="sGo">⚔️ Începe bătălia</button></div>';
    $('setupBox').innerHTML = html;
    $('setupBox').querySelectorAll('[data-civ]').forEach(function (b) { b.addEventListener('click', function () { cfg.civ = b.dataset.civ; save(); renderSetup(); G.sfx && G.sfx('click'); }); });
    $('setupBox').querySelectorAll('select[data-k]').forEach(function (s) {
      s.addEventListener('change', function () { var k = s.dataset.k, v = s.value; cfg[k] = /^(size|startAge|popMax|peace)$/.test(k) ? +v : v; save(); renderSetup(); });
    });
    $('setupBox').querySelectorAll('select[data-ai]').forEach(function (s) { s.addEventListener('change', function () { cfg.ai[+s.dataset.ai] = s.value; save(); }); });
    $('sBack').addEventListener('click', function () { show('setup', false); });
    $('sGo').addEventListener('click', function () { show('setup', false); M.startSkirmish(); });
  }
  function save() { try { localStorage.setItem('scm_setup', JSON.stringify(cfg)); } catch (e) {} }
  M.cfg = function () { return cfg; };
  M.startSkirmish = function (over) {
    var c = Object.assign({}, cfg, over || {}), mode = MODES.find(function (m) { return m[0] === c.mode; }) || MODES[0];
    var used = {}, players = [{ civ: c.civ, ai: false, team: 1 }];
    used[c.civ] = 1;
    mode[2].forEach(function (team, i) {
      var civ = c.ai[i] || 'rnd';
      if (civ === 'rnd') { var free = G.CIV_LIST.filter(function (x) { return !used[x]; }); civ = (free.length ? free : G.CIV_LIST)[Math.floor(Math.random() * (free.length || G.CIV_LIST.length))]; }
      used[civ] = 1;
      players.push({ civ: civ, ai: true, team: team });
    });
    var mapT = c.map === 'rnd' ? MAPS[Math.floor(Math.random() * (MAPS.length - 1))][0] : c.map;
    var size = c.size || (players.length > 2 ? 96 : 72);
    G.startGame({ diff: c.diff, players: players, size: size, map: { type: mapT, season: c.season }, victory: c.victory, startAge: c.startAge, res: c.res,
      popMax: c.popMax, peace: c.peace, reveal: c.reveal, aiBoth: !!G.spectate, nomad: c.start === 'nomazi', daynight: +c.daynight === 1 });
  };

  // ---------- arborele tehnologiilor ----------
  var treeCiv = null;
  M.openTree = function (civ) { treeCiv = civ || treeCiv || (G.S && G.S.players[0] ? G.S.players[0].civ : cfg.civ); renderTree(); show('tree', true); };
  function renderTree() {
    var civ = treeCiv, C = G.CIVS[civ];
    var blds = ['cetate', 'cazarma', 'poligon', 'grajd', 'atelier', 'fortareata', 'port', 'manastire', 'targ', 'fierarie', 'universitate', 'joagar', 'mina', 'moara'];
    var html = '<h2>Arborele tehnologiilor</h2><div class="treeciv">' + G.CIV_LIST.map(function (c) { return '<button class="' + (c === civ ? 'on' : '') + '" data-tc="' + c + '">' + G.CIVS[c].flag + ' ' + esc(G.CIVS[c].name) + '</button>'; }).join('') + '</div>';
    html += '<div class="tree"><div class="trow head"><div class="tb"></div>' + G.AGES.map(function (a, i) { return '<div class="tage">' + G.AGE_ROMAN[i] + '<small>' + esc(a.replace('Epoca ', '')) + '</small></div>'; }).join('') + '</div>';
    blds.forEach(function (bt) {
      var d = G.BLDS[bt], cols = [[], [], [], [], []];
      (d.train || []).forEach(function (t0) {
        var t = t0 === 'uniq' ? C.uniq : t0, u = G.UNITS[t];
        if (u.civ && u.civ !== civ) return;
        var line = u.line ? G.LINES[u.line] : [t];
        line.forEach(function (tt) {
          var ud = G.UNITS[tt], no = ud.notCiv && ud.notCiv.indexOf(civ) >= 0, a = ud.line === 'can' && civ === 'oto' ? ud.age - 1 : ud.age;
          cols[a].push('<span class="tu' + (no ? ' no' : '') + '" title="' + esc((ud.hero ? C.hero : G.nm(ud, civ)) + ': ' + (ud.desc || '')) + '"><img src="' + G.R.icon('u', tt, civ) + '" alt="">' + esc(ud.hero ? C.hero : G.nm(ud, civ)) + '</span>');
        });
      });
      (d.tech || []).forEach(function (id0) {
        var id = id0 === 'elite' ? 'elite_' + civ : id0 === 'ut1' ? C.ut[0] : id0 === 'ut2' ? C.ut[1] : id0, T = G.TECHS[id];
        if (!T || T.up) return;
        if (T.civ && T.civ !== civ) return;
        cols[T.age].push('<span class="tt' + (T.civ ? ' uniq' : '') + '" title="' + esc(T.name + ': ' + T.desc) + '">' + T.icon + ' ' + esc(T.name) + '</span>');
      });
      if (!cols.some(function (c) { return c.length; })) return;
      html += '<div class="trow"><div class="tb"><img src="' + G.R.icon('b', bt, civ) + '" alt=""><b>' + esc(G.nm(d, civ)) + '</b><small>' + G.AGE_ROMAN[bt === 'cetate' ? 0 : d.age] + '</small></div>' +
        cols.map(function (c) { return '<div class="tc">' + c.join('') + '</div>'; }).join('') + '</div>';
    });
    html += '</div><div class="row2"><button class="btn" id="tClose">Închide</button></div>';
    $('treeBox').innerHTML = html;
    $('treeBox').querySelectorAll('[data-tc]').forEach(function (b) { b.addEventListener('click', function () { treeCiv = b.dataset.tc; renderTree(); }); });
    $('tClose').addEventListener('click', function () { show('tree', false); });
  }

  // ---------- ecranul de final ----------
  // ---------- medaliile (se păstrează în browser) ----------
  var MEDALS = [
    ['prima', '🥇', 'Prima victorie', 'Câștigă o bătălie liberă.'], ['fara', '🛡️', 'Niciun țăran pierdut', 'Câștigă fără să pierzi vreun țăran.'],
    ['iute', '⚡', 'Fulgerul', 'Câștigă în mai puțin de 20 de minute.'], ['greu', '⚔️', 'Oștean încercat', 'Câștigă pe Greu.'],
    ['foarte', '👑', 'Voievod', 'Câștigă pe Foarte greu.'], ['minune', '🏛️', 'Ctitorul', 'Câștigă prin minune.'],
    ['deal', '🗿', 'Regele dealului', 'Câștigă ținând monumentul 10 minute.'], ['nomad', '🐎', 'Nomadul', 'Câștigă pornind fără cetate.'],
    ['mare', '⚓', 'Stăpânul mării', 'Câștigă pe Țărmul Mării Negre.'], ['wololo', '✨', 'Wololo', 'Convertește 5 dușmani într-o partidă.'],
    ['doi', '🤝', 'Frați de arme', 'Câștigă un 2 contra 2.'], ['toate', '🌍', 'Toate neamurile', 'Câștigă cu fiecare din cele 6 civilizații.'],
    ['camp_st', '📜', 'Ștefan cel Mare', 'Termină campania lui Ștefan.'], ['vaslui', '🔔', 'Vaslui, 1475', 'Câștigă Podul Înalt pe Foarte greu.']
  ];
  function medalsGot() { try { return JSON.parse(localStorage.getItem('scm_medals') || '{}'); } catch (e) { return {}; } }
  // întoarce medaliile noi câștigate acum
  M.award = function (S, win) {
    if (!win || S.cheated || G.spectate) return [];
    var got = medalsGot(), now = [], P = S.players[0], give = function (id) { if (!got[id]) { got[id] = new Date().toISOString().slice(0, 10); now.push(id); } };
    if (S.scen) {
      var sid = S.scen.id || (G.Camp && G.Camp.cur);
      if (sid === 'st6') give('camp_st');
      if (sid === 'st4' && S.diff === 'foarte') give('vaslui');
    } else {
      give('prima');
      if (!P.st.lostVil) give('fara');
      if (S.t < 1200) give('iute');
      if (S.diff === 'greu' || S.diff === 'foarte') give('greu');
      if (S.diff === 'foarte') give('foarte');
      if (S.opt.victory === 'minune' && S.wonder && S.wonder.o === 0) give('minune');
      if (S.opt.victory === 'deal' && S.koth && S.koth.o >= 0 && G.ally(0, S.koth.o)) give('deal');
      if (S.opt.nomad) give('nomad');
      if (S.map && S.map.type === 'mare') give('mare');
      if (S.players.length === 4 && S.players.filter(function (Q) { return Q.team === P.team; }).length === 2) give('doi');
      var wins = {}; try { wins = JSON.parse(localStorage.getItem('scm_wins') || '{}'); } catch (e) {}
      wins[P.civ] = 1; try { localStorage.setItem('scm_wins', JSON.stringify(wins)); } catch (e) {}
      if (G.CIV_LIST.every(function (c) { return wins[c]; })) give('toate');
    }
    if ((P.st.conv || 0) >= 5) give('wololo');
    try { localStorage.setItem('scm_medals', JSON.stringify(got)); } catch (e) {}
    return now;
  };
  M.medalsHTML = function (fresh) {
    var got = medalsGot();
    return '<div class="medals">' + MEDALS.map(function (m) { var has = got[m[0]], nw = fresh && fresh.indexOf(m[0]) >= 0; return '<div class="md' + (has ? ' on' : '') + (nw ? ' new' : '') + '" title="' + esc(m[3]) + '"><i>' + m[1] + '</i><b>' + esc(m[2]) + '</b><small>' + esc(has ? (nw ? 'Nouă!' : 'din ' + has) : m[3]) + '</small></div>'; }).join('') + '</div>';
  };
  M.openMedals = function () {
    var got = medalsGot(), n = MEDALS.filter(function (m) { return got[m[0]]; }).length;
    $('treeBox').innerHTML = '<h2>🏅 Medalii: ' + n + ' din ' + MEDALS.length + '</h2>' + M.medalsHTML(null) + '<div class="row2"><button class="btn" id="mdBack">Înapoi</button></div>';
    show('tree', true);
    $('mdBack').addEventListener('click', function () { show('tree', false); });
  };
  M.endScreen = function (S, win, title, sub) {
    $('endT').textContent = title || (win ? 'Victorie!' : 'Înfrângere');
    $('endT').className = win ? 'win' : 'lose';
    $('endS').textContent = sub || (win ? 'Dușmanii tăi au fost învinși. Țara e liberă!' : 'Ai pierdut de data asta. Mai încerci o dată?');
    var fresh = M.award(S, win), md = $('endMd');
    if (!md) { md = document.createElement('div'); md.id = 'endMd'; $('endS').parentNode.insertBefore(md, $('endS').nextSibling); }
    md.innerHTML = fresh.length ? '<div class="mdnew">🏅 Medalii noi: ' + MEDALS.filter(function (x) { return fresh.indexOf(x[0]) >= 0; }).map(function (x) { return x[1] + ' ' + esc(x[2]); }).join(' · ') + '</div>' : '';
    var P = S.players, m = Math.floor(S.t / 60);
    function row(lbl, f) { return '<tr><td>' + lbl + '</td>' + P.map(function (p) { return '<td>' + f(p) + '</td>'; }).join('') + '</tr>'; }
    $('endStats').innerHTML = '<tr><td></td>' + P.map(function (p, i) { return '<th style="color:' + G.R.pcol(i).light + '">' + G.CIVS[p.civ].flag + ' ' + esc(i === 0 ? 'Tu' : G.CIVS[p.civ].name) + (p.alive ? '' : ' ✝') + '</th>'; }).join('') + '</tr>' +
      row('Scor', function (p) { return '<b>' + G.score(p.id) + '</b>'; }) +
      row('Epoca', function (p) { return G.AGE_ROMAN[p.age]; }) +
      row('Oameni făcuți', function (p) { return p.st.trained; }) +
      row('Dușmani doborâți', function (p) { return p.st.killed; }) +
      row('Oameni pierduți', function (p) { return p.st.lost; }) +
      row('Clădiri dărâmate', function (p) { return p.st.razed; }) +
      row('Tehnologii', function (p) { return p.st.techs; }) +
      row('Resurse strânse', function (p) { var g = p.st.gath; return Math.floor(g.f + g.w + g.g + g.s); }) +
      '<tr><td>Durata</td><td colspan="' + P.length + '">' + m + ' minute · ' + (G.DIFF[S.diff] || G.DIFF.normal).name + '</td></tr>';
    drawGraph(S);
  };
  function drawGraph(S) {
    var cv = $('endGraph'); if (!cv) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 360, h = cv.clientHeight || 120;
    cv.width = w * d; cv.height = h * d;
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    var mx = 1, n = 1;
    S.players.forEach(function (p) { p.st.tl.forEach(function (v) { mx = Math.max(mx, v); }); n = Math.max(n, p.st.tl.length); });
    g.strokeStyle = '#ffffff22'; g.lineWidth = 1;
    for (var k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, h * k / 4); g.lineTo(w, h * k / 4); g.stroke(); }
    S.players.forEach(function (p, i) {
      g.strokeStyle = G.R.pcol(i).color; g.lineWidth = 2.2; g.beginPath();
      p.st.tl.forEach(function (v, j) { var x = n > 1 ? j / (n - 1) * (w - 4) + 2 : 2, y = h - 3 - v / mx * (h - 8); if (j) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
    });
  }
})();
