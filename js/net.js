// Jocul online, ca în AoE2: fiecare calculator rulează aceeași simulare și își trimite doar comenzile.
// Timpul e împărțit în ture de 0,2 s (4 pași ai simulării). O comandă dată acum se execută peste 2 ture,
// pe toate calculatoarele deodată, în ordinea locurilor. O tură pornește doar când au sosit ale tuturor
// (fiecare trimite la fiecare tură, fie și nimic): dacă cineva întârzie, jocul îl așteaptă.
// Legătura: Firebase Realtime Database, prin REST și EventSource (fără bibliotecă), cu cont anonim.
// O pagină reîncărcată în mijlocul meciului reia singură jocul, din comenzile păstrate în cameră.
var G = globalThis.G || (globalThis.G = {});

(function () {
  'use strict';
  var CFG = { key: 'AIzaSyAelLU8qZW7aBt7Zw02mhGEqu3dAH_hZUE', db: 'https://joc-voievozi-default-rtdb.europe-west1.firebasedatabase.app' };
  var TURN = 4, DELAY = 2, HASH_EVERY = 50;
  var N = G.Net = { on: false, code: '', uid: '', data: null, seats: [], catching: false, waitT: 0, desync: 0, listeners: [] };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---------- contul anonim (se păstrează în browser, ca o pagină reîncărcată să rămână același jucător) ----------
  var auth = null;
  function setAuth(uid, tok, rt, sec) { auth = { uid: uid, tok: tok, rt: rt, exp: Date.now() + (sec - 300) * 1000 }; N.uid = uid; lsSet('scm_net_auth', JSON.stringify({ rt: rt })); }
  function post(u, body, type) { return fetch(u, { method: 'POST', headers: { 'Content-Type': type || 'application/json' }, body: body }).then(function (r) { return r.json(); }); }
  function signUp() {
    return post('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + CFG.key, '{"returnSecureToken":true}').then(function (d) {
      if (!d.idToken) throw new Error('Nu m-am putut conecta la server.');
      setAuth(d.localId, d.idToken, d.refreshToken, +d.expiresIn);
    });
  }
  function refresh(rt) {
    return post('https://securetoken.googleapis.com/v1/token?key=' + CFG.key, 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(rt), 'application/x-www-form-urlencoded').then(function (d) {
      if (!d.id_token) return signUp();
      setAuth(d.user_id, d.id_token, d.refresh_token, +d.expires_in);
    });
  }
  function token() {
    if (auth && Date.now() < auth.exp) return Promise.resolve(auth.tok);
    if (auth) return refresh(auth.rt).then(function () { return auth.tok; });
    var saved = null; try { saved = JSON.parse(lsGet('scm_net_auth') || 'null'); } catch (e) {}
    return (saved && saved.rt ? refresh(saved.rt) : signUp()).then(function () { return auth.tok; });
  }
  N.signIn = function () { return token().then(function () { return N.uid; }); };

  // ---------- baza de date ----------
  function url(p, tok) { return CFG.db + '/' + p + '.json?auth=' + encodeURIComponent(tok); }
  function req(method, p, body) {
    return token().then(function (tok) {
      return fetch(url(p, tok), { method: method, body: body === undefined ? undefined : JSON.stringify(body) }).then(function (r) {
        return r.json().then(function (d) { if (d && d.error) throw new Error(d.error); return d; });
      });
    });
  }
  N.req = req;

  // oglinda camerei: tot ce e în rooms/<cod>, ținut la zi din EventSource
  var es = null;
  function setPath(p, v) {
    var parts = p.split('/').filter(Boolean);
    if (!parts.length) { N.data = v; return; }
    var o = N.data || (N.data = {});
    for (var i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
    if (v === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = v;
  }
  function listen(code) {
    if (es) es.close();
    return token().then(function (tok) {
      if (N.code !== code) return;
      es = new EventSource(url('rooms/' + code, tok));
      es.addEventListener('put', function (ev) { var m = JSON.parse(ev.data); setPath(m.path, m.data); changed(); });
      es.addEventListener('patch', function (ev) { var m = JSON.parse(ev.data); for (var k in m.data) setPath((m.path === '/' ? '' : m.path) + '/' + k, m.data[k]); changed(); });
      // cheia expiră după o oră: ne reconectăm cu una nouă
      es.addEventListener('auth_revoked', function () { auth && (auth.exp = 0); listen(code); });
      es.addEventListener('cancel', function () { N.error = 'Legătura cu camera s-a închis.'; changed(); });
    });
  }
  N.onChange = function (fn) { N.listeners.push(fn); };
  function changed() {
    checkHashes(); checkChat();
    if (!N.on && N.data && N.data.start && N.data.state === 'playing' && N.wantStart) begin();
    N.listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }

  // ---------- camera ----------
  var ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function newCode() { var s = ''; for (var i = 0; i < 5; i++) s += ABC[(Math.random() * ABC.length) | 0]; return s; }
  function myName() { return (lsGet('scm_net_name') || 'Jucător').slice(0, 24); }
  N.setName = function (n) { lsSet('scm_net_name', String(n || '').trim().slice(0, 24) || 'Jucător'); };
  N.name = myName;
  N.create = function (opts) {
    return N.signIn().then(function () {
      var code = newCode(), m = {}; m[N.uid] = { name: myName(), civ: lsGet('scm_net_civ') || 'mol', team: 0, t: { '.sv': 'timestamp' } };
      return req('PUT', 'rooms/' + code, { host: N.uid, created: { '.sv': 'timestamp' }, ver: G.VER || '', state: 'lobby', opts: opts, members: m })
        .then(function () { return enter(code); });
    });
  };
  N.join = function (code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return N.signIn().then(function () { return req('GET', 'rooms/' + code); }).then(function (d) {
      if (!d) throw new Error('Nu există nicio cameră cu codul ' + code + '.');
      if (d.ver && G.VER && d.ver !== G.VER) throw new Error('Tu și gazda aveți versiuni diferite ale jocului. Reîncărcați amândoi pagina.');
      var mine = d.members && d.members[N.uid], st = d.state;
      if (st !== 'lobby' && !mine) throw new Error('Jocul din camera asta a început deja.');
      var res = function () { return { code: code, state: st }; };
      if (mine) return enter(code).then(res);
      return req('PUT', 'rooms/' + code + '/members/' + N.uid, { name: myName(), civ: lsGet('scm_net_civ') || 'mol', team: 0, t: { '.sv': 'timestamp' } }).then(function () { return enter(code); }).then(res);
    });
  };
  function enter(code) { N.code = code; N.data = null; N.wantStart = true; lsSet('scm_net_room', code); return listen(code).then(function () { return code; }); }
  N.isHost = function () { return !!(N.data && N.data.host === N.uid); };
  N.setMine = function (o) { if (o.civ) lsSet('scm_net_civ', o.civ); return req('PATCH', 'rooms/' + N.code + '/members/' + N.uid, o); };
  N.setOpts = function (o) { return req('PUT', 'rooms/' + N.code + '/opts', o); };
  // jocul s-a terminat: gazda închide camera (cine reîncarcă pagina nu mai intră într-un joc încheiat)
  N.ended = function () { if (N.isHost() && N.code) req('PUT', 'rooms/' + N.code + '/state', 'over').catch(function () {}); };
  // plecarea din joc: lași un semn de la ce tură nu mai trimiți nimic, ca ceilalți să nu te aștepte
  N.quitGame = function () {
    if (!N.on || !N.code || !G.S || G.S.over) return Promise.resolve();
    // de la ce tură pleci: prima pe care serverul n-o are de la tine (ce ai trimis, dar n-a ajuns, nu mai contează)
    var code = N.code, uid = N.uid;
    return drain().then(function () { return req('GET', 'rooms/' + code + '/ack/' + uid); })
      .then(function (a) { return req('PUT', 'rooms/' + code + '/drop/' + uid, (a || DELAY - 1) + 1); }).catch(function () {});
  };
  function drain() {
    return new Promise(function (ok) { var t0 = Date.now(); (function w() { if ((!inFlight && !Object.keys(pend).length) || Date.now() - t0 > 8000) ok(); else setTimeout(w, 50); })(); });
  }
  // gazda: un jucător care nu mai răspunde (a închis pagina, a pierdut netul) e preluat de calculator
  N.dropSeat = function (i) {
    var u = N.seats[i] && N.seats[i].uid; if (!u || !N.isHost()) return Promise.resolve();
    return req('PUT', 'rooms/' + N.code + '/drop/' + u, ackOf(i) + 1).catch(function (e) { console.warn(e); });
  };
  N.leave = function () {
    var code = N.code, host = N.isHost(), st = N.data && N.data.state;
    if (es) { es.close(); es = null; }
    stop(); N.code = ''; N.data = null; N.wantStart = false; lsSet('scm_net_room', '');
    if (!code) return Promise.resolve();
    // gazda șterge camera când pleacă din sala de așteptare sau după final; cine pleacă din joc o lasă celorlalți
    if (host && st !== 'playing') return req('DELETE', 'rooms/' + code).catch(function () {});
    if (st === 'lobby') return req('DELETE', 'rooms/' + code + '/members/' + N.uid).catch(function () {});
    return Promise.resolve();
  };
  // locurile la masă: oamenii în ordinea intrării, apoi calculatoarele adăugate de gazdă
  N.seatsOf = function (d) {
    d = d || N.data || {};
    var hum = Object.keys(d.members || {}).map(function (u) { var m = d.members[u]; return { uid: u, name: m.name, civ: m.civ, team: +m.team || 0, t: m.t || 0 }; })
      .sort(function (a, b) { return a.t - b.t || (a.uid < b.uid ? -1 : 1); });
    var ai = ((d.opts && d.opts.ai) || []).map(function (a) { return { ai: true, civ: a.civ, team: +a.team || 0, name: 'Calculatorul' }; });
    return hum.concat(ai).slice(0, 8);
  };
  N.start = function () {
    if (!N.isHost()) return Promise.reject(new Error('Doar gazda pornește jocul.'));
    var seats = N.seatsOf().map(function (s) { var o = { civ: s.civ, team: s.team, name: s.name }; if (s.ai) o.ai = true; else o.uid = s.uid; return o; });
    if (seats.length < 2) return Promise.reject(new Error('Mai e nevoie de cel puțin un jucător.'));
    var start = { seed: (Math.random() * 1e9) | 0, seats: seats, opts: N.data.opts || {} };
    return req('PUT', 'rooms/' + N.code + '/start', start).then(function () { return req('PUT', 'rooms/' + N.code + '/state', 'playing'); });
  };

  // ---------- jocul ----------
  var out = [], sent = DELAY - 1, applying = false, pend = {}, inFlight = false, hashSent = {};
  function stop() { N.on = false; N.catching = false; out = []; pend = {}; hashSent = {}; G.me = 0; }
  function begin() {
    var st = N.data.start, me = -1;
    st.seats.forEach(function (s, i) { if (s.uid === N.uid) me = i; });
    if (me < 0) { N.error = 'Nu ești la masa acestui joc.'; return; }
    N.seats = st.seats; N.desync = 0; out = []; pend = {}; hashSent = {}; applying = false;
    chatSeen = {}; Object.keys(N.data.chat || {}).forEach(function (k) { chatSeen[k] = 1; });
    var ack = (N.data.ack && N.data.ack[N.uid]) || DELAY - 1;
    sent = ack;
    G.me = me; N.on = true;
    // ai mai fost în joc (pagină reîncărcată): se reia din comenzile păstrate, cât de repede se poate
    N.catching = ack >= DELAY;
    var o = st.opts || {};
    G.startGame({ seed: st.seed, online: true, diff: 'normal', size: o.size || 96, map: { type: o.map || 'rau', season: o.season || 'vara' },
      victory: o.victory || 'cucerire', res: o.res || 'std', startAge: o.startAge || 0, popMax: o.popMax, peace: o.peace || 0,
      players: st.seats.map(function (s) { return { civ: s.civ, ai: !!s.ai, team: s.team || 0, name: s.name }; }) });
    G.speed = 1;
  }
  // oamenii de la masă care încă joacă la tura n (cine a plecat e preluat de calculator de la tura lui de plecare)
  function dropOf(i) { var d = N.data && N.data.drop, u = N.seats[i].uid; return d && d[u] !== undefined ? d[u] : Infinity; }
  function humans(n) { return N.seats.map(function (s, i) { return s.uid && (n === undefined || dropOf(i) > n) ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function ackOf(i) { var a = N.data && N.data.ack, u = N.seats[i].uid; return (a && a[u]) || DELAY - 1; }
  N.waitingFor = function () { var n = Math.floor(G.S.tick / TURN); return humans(n).filter(function (i) { return ackOf(i) < n; }); };
  // poate face simularea pasul următor? La începutul fiecărei ture, doar dacă au sosit comenzile tuturor.
  N.canStep = function () {
    if (!N.on || !N.data) return !N.on;
    var t = G.S.tick; if (t % TURN) return true;
    var n = t / TURN; if (n < DELAY) return true;
    for (var h = humans(n), i = 0; i < h.length; i++) if (ackOf(h[i]) < n) return false;
    return true;
  };
  // la începutul fiecărei ture: comenzile ei, apoi plecăm cu ale noastre pentru tura n + DELAY
  N.beforeTick = function () {
    var t = G.S.tick; if (!N.on || t % TURN) return;
    var n = t / TURN, tn = N.data.turns && N.data.turns['t' + n];
    // cine a plecat la tura asta: de acum îi joacă partea calculatorul
    N.seats.forEach(function (s, i) { if (s.uid && dropOf(i) === n && !G.S.players[i].ai) { G.S.players[i].ai = true; G.msg((s.name || 'Un jucător') + ' a plecat. Calculatorul îi preia oamenii.', 'info'); } });
    if (tn) N.seats.forEach(function (s, i) { if (s.uid && tn[s.uid] && dropOf(i) > n) { try { JSON.parse(tn[s.uid]).forEach(function (c) { exec(i, c); }); } catch (e) { console.error('comandă stricată', e); } } });
    if (n && n % HASH_EVERY === 0 && !hashSent[n]) {
      hashSent[n] = 1; (N.hashes = N.hashes || {})[n] = G.stateHash();
      // după o reîncărcare, amprentele trimise deja de pagina de dinainte nu se mai trimit (serverul le-ar refuza)
      var hd = N.data.hash && N.data.hash['h' + n];
      if (!(hd && hd[N.uid])) send('hash/h' + n + '/' + N.uid, N.hashes[n]);
    }
    var m = n + DELAY;
    if (m > sent) { if (out.length) send('turns/t' + m + '/' + N.uid, JSON.stringify(out)); send('ack/' + N.uid, m); out = []; sent = m; }
  };
  // trimiterile pleacă pe rând: un pachet nu poate ajunge înaintea celui de dinainte (al doilea ar fi respins)
  function send(p, v) { pend[p] = v; flush(); }
  function flush() {
    if (inFlight || !N.code) return;
    var keys = Object.keys(pend); if (!keys.length) return;
    var body = pend; pend = {}; inFlight = true;
    req('PATCH', 'rooms/' + N.code, body).then(function () { inFlight = false; flush(); }, function (e) {
      inFlight = false;
      // nu s-a scris nimic: punem pachetul la loc și reîncercăm. Ce are deja serverul (de exemplu, ultimul pachet al
      // paginii de dinainte de o reîncărcare) nu se mai trimite: altfel serverul l-ar refuza la nesfârșit
      var mine = (N.data && N.data.ack && N.data.ack[N.uid]) || 0;
      if (mine > sent) sent = mine;
      for (var k in body) {
        var mt = /^turns\/t(\d+)\//.exec(k);
        if (mt && +mt[1] <= mine) continue;
        if (/^hash\//.test(k)) continue;
        if (/^ack\//.test(k)) { var v = Math.max(body[k], pend[k] || 0); if (v > mine) pend[k] = v; continue; }
        if (!(k in pend)) pend[k] = body[k];
      }
      console.warn('trimitere refuzată, reîncerc', e.message); setTimeout(flush, 300);
    });
  }
  N.dbg = function () { return { sent: sent, pend: Object.keys(pend), inFlight: inFlight, out: out.length, catching: N.catching, tick: G.S && G.S.tick }; };
  // amprentele: aceeași tură trebuie să dea aceeași stare pe toate calculatoarele
  function checkHashes() {
    var h = N.data && N.data.hash; if (!h || !N.on || N.desync) return;
    Object.keys(h).forEach(function (k) {
      var v = h[k], us = Object.keys(v); if (us.length < humans(+k.slice(1)).length) return;
      var first = v[us[0]];
      if (us.some(function (u) { return v[u] !== first; })) { N.desync = +k.slice(1); console.error('desincronizare la tura', N.desync, v); if (G.msg) G.msg('Jocul s-a desincronizat (tura ' + N.desync + '). Ieșiți și porniți unul nou.', 'alert'); }
    });
  }

  // ---------- comenzile ----------
  // online, comenzile din interfață nu se execută pe loc: pleacă la toți și se execută la tura n + DELAY.
  // mine: argumentele care trebuie să fie ale celui care dă comanda; me: argumentul care e chiar jucătorul.
  var CMD = {
    cmdMove: { mine: [0] }, cmdPatrol: { mine: [0] }, cmdAttack: { mine: [0] }, cmdGather: { mine: [0] }, cmdBuild: { mine: [0] },
    cmdGarrison: { mine: [0] }, cmdHeal: { mine: [0] }, cmdConvert: { mine: [0] }, cmdTrade: { mine: [0] }, cmdBoard: { mine: [0] },
    cmdStop: { mine: [0] }, cmdReturn: { mine: [0] }, cmdDelete: { mine: [0] }, cmdUngarrison: { mine: [0] }, cmdUnload: { mine: [0] },
    cmdRally: { mine: [0] }, cmdTrain: { mine: [0], err: 1 }, cmdTech: { mine: [0], err: 1 }, cmdCancel: { mine: [0] },
    cmdMarket: { me: 0, err: 1 }, cmdReseed: { me: 0, err: 1 }, cmdBell: { me: 0, err: 1 }, cmdPower: { me: 0, err: 1 }, cmdTribute: { me: 0 },
    cmdPlace: { me: 0, mine: [4] }, cmdPlaceWall: { me: 0, mine: [6] }
  };
  function ser(v) { if (v && typeof v === 'object') { if (v.k && v.id !== undefined) return { e: v.id }; if (Array.isArray(v)) return v.map(ser); } return v; }
  function own(v, seat) {
    if (Array.isArray(v)) return v.map(function (x) { return own(x, seat); }).filter(function (x) { return x !== null; });
    if (v && typeof v === 'object' && v.e !== undefined) { var e = G.getE(v.e); return e && e.o === seat ? e : null; }
    return v;
  }
  function ent(v) {
    if (Array.isArray(v)) return v.map(ent).filter(function (x) { return x !== null; });
    if (v && typeof v === 'object' && v.e !== undefined) return G.getE(v.e) || null;
    return v;
  }
  function exec(seat, c) {
    var name = c[0], spec = CMD[name], fn = orig[name]; if (!spec || !fn) return;
    var args = c.slice(1).map(function (a, i) { return (spec.mine && spec.mine.indexOf(i) >= 0) ? own(a, seat) : ent(a); });
    if (spec.me !== undefined) args[spec.me] = seat;
    // o comandă fără oamenii sau clădirea ei (au murit între timp) nu se mai execută
    if (spec.mine && spec.mine.some(function (i) { return args[i] === null || (Array.isArray(args[i]) && !args[i].length && i === 0); })) return;
    applying = true;
    var r; try { r = fn.apply(null, args); } catch (e) { console.error('comanda', name, e); }
    applying = false;
    if (spec.err && seat === G.me && typeof r === 'string' && r && r !== 'back') { G.msg(r, 'warn'); G.sfx('err'); }
  }
  var orig = {}, inSim = false, upd0 = G.update;
  G.update = function (dt) { inSim = true; try { return upd0.call(this, dt); } finally { inSim = false; } };
  Object.keys(CMD).forEach(function (name) {
    orig[name] = G[name];
    G[name] = function () {
      if (!N.on || applying || inSim) return orig[name].apply(this, arguments);
      var a = Array.prototype.slice.call(arguments);
      // ce se poate verifica pe loc, se verifică pe loc (ca să afli imediat că n-ai destule resurse)
      if (name === 'cmdTrain' && G.trainError) { var e1 = G.trainError(a[0], a[1]); if (e1) return e1; }
      if (name === 'cmdTech' && G.techError) { var e2 = G.techError(a[0], a[1]); if (e2) return e2; }
      if (name === 'cmdPower' && G.powerError) { var e3 = G.powerError(G.me); if (e3) return e3; }
      var ret;
      if (name === 'cmdPlaceWall') {
        ret = G.wallTiles(a[2], a[3], a[4], a[5]).filter(function (t) { return G.canPlace(G.me, a[1], t[0], t[1]); });
        if (!ret.length) return ret;
      }
      if (name === 'cmdPlace') ret = { pending: 1 };
      out.push([name].concat(a.map(ser)));
      return ret;
    };
  });
  // codurile secrete nu merg online (ar strica jocul celorlalți)
  var cheat0 = G.cheat;
  G.cheat = function (o, t) {
    if (!N.on) return cheat0.apply(this, arguments);
    if (G.isCheat && G.isCheat(t)) { G.msg('Codurile secrete nu merg în jocul online.', 'warn'); return 'off'; }
    return null;
  };

  // ---------- chatul (nu trece prin ture: nu schimbă jocul) ----------
  // un număr de la 1 la 12 e strigătul cu numărul ăla, ca în AoE2: se aude la toți
  var chatSeen = {};
  N.say = function (text) {
    if (!N.code) return;
    var s = N.seats[G.me], name = (s && s.name) || myName();
    req('POST', 'rooms/' + N.code + '/chat', { uid: N.uid, name: name, text: String(text).slice(0, 200), t: { '.sv': 'timestamp' } })
      .catch(function () { G.msg('Mesajul n-a plecat.', 'warn'); });
  };
  function checkChat() {
    var ch = N.data && N.data.chat; if (!ch || !N.on) return;
    Object.keys(ch).sort().forEach(function (k) {
      if (chatSeen[k]) return; chatSeen[k] = 1;
      var m = ch[k] || {}, seat = -1, txt = String(m.text || '');
      N.seats.forEach(function (s, i) { if (s.uid === m.uid) seat = i; });
      if (/^\d+$/.test(txt) && +txt >= 1 && +txt <= 12 && G.UI && G.UI.taunt) G.UI.taunt(+txt, seat >= 0 ? seat : undefined, m.uid === N.uid ? 'Tu' : m.name);
      else G.msg((m.uid === N.uid ? 'Tu' : (m.name || 'Jucător')) + ': ' + txt, m.uid === N.uid ? 'info' : 'alert');
    });
  }
})();
