// Ghidul robotului din test/joaca-misiuni.js: ce face un om care citește obiectivele fiecărei misiuni.
// Economia și apărarea le face AI-ul jocului pe partea ta (aiMode 'eco': adună, construiește, face oaste, se apără,
// dar nu atacă singur); ghidul dă doar comenzile pe care le-ar da un jucător: unde atacă oastea, unde merge eroul,
// ce se construiește la un steag. Misiunile fără ghid sunt jucate de AI în întregime (aiMode 'full').
// Folosește doar comenzile din interfață (G.cmd*), cu drumurile adevărate.

function H(c) {
  const G = c.G, T = c.T, S = G.S;
  const h = {
    G, T, S,
    hero: () => G.heroOf(0),
    // oastea: oștenii tăi liberi (fără erou, fără țărani, fără cei din clădiri)
    army: (f) => G.C.units.filter(u => u.o === 0 && !u.dead && !u.gin && u.t !== 'vil' && !G.UNITS[u.t].hero && G.UNITS[u.t].cls !== 'mon' && !G.isNaval(u) && (!f || f(u))),
    vils: () => G.C.units.filter(u => u.o === 0 && !u.dead && u.t === 'vil'),
    alive: (tag) => G.S.ents.filter(e => e.tag === tag && !e.dead),
    foes: () => G.C.units.filter(u => !u.dead && !u.gin && G.enemy(0, u.o)),
    foeBlds: () => G.C.blds.filter(b => !b.dead && G.enemy(0, b.o)),
    nearest: (list, p) => { let b = null, bd = 1e9; list.forEach(e => { const d = G.dist(e, p); if (d < bd) { bd = d; b = e; } }); return b; },
    // atacul: fiecare oștean liber merge la cea mai apropiată țintă din listă (cine luptă deja e lăsat în pace)
    attack: (targets, units) => {
      targets = targets.filter(e => e && !e.dead); if (!targets.length) return false;
      (units || h.army()).forEach(u => {
        if (u.task && (u.task.k === 'atk' || u.task.k === 'amove') && u._g === 'atk') return;
        const t = h.nearest(targets, u); if (!t) return;
        G.cmdAttack([u], t); u._g = 'atk';
      });
      return true;
    },
    amove: (x, y, units) => { const us = (units || h.army()).filter(u => !(u.task && u.task.k === 'atk')); if (us.length) G.cmdMove(us, x, y, true); },
    move: (x, y, units) => { const us = units || h.army(); if (us.length) G.cmdMove(us, x, y, false); },
    // asaltul: întâi țintele cu etichetele date, apoi orice dușman (clădiri, apoi oameni);
    // dacă ținta e închisă între ziduri, întâi bucata de zid (sau poarta) cea mai apropiată de ea, ca un om
    assault: (tags, units) => {
      for (const tag of tags) { const t = h.alive(tag); if (t.length) return h.attack(h.breach(t, units)); }
      const fb = h.foeBlds(); if (fb.length) return h.attack(h.breach(fb, units));
      return h.attack(h.foes(), units);
    },
    // ce se poate lovi din locul unde e oastea: ținta, sau zidul care o închide
    breach: (targets, units) => {
      const us = units || h.army(); if (!us.length) return targets;
      const N = G.S.N, pass = G.C.pass, seen = new Uint8Array(N * N), q = [];
      const c0 = us[0], st = Math.floor(c0.y) * N + Math.floor(c0.x); seen[st] = 1; q.push(st);
      while (q.length) { const k = q.pop(), x = k % N, y = (k - x) / N; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) return; const nk = ny * N + nx; if (!seen[nk] && pass[nk]) { seen[nk] = 1; q.push(nk); } }); }
      const touch = (b) => { const n = b.n || 1; for (let y = b.ty - 1; y <= b.ty + n; y++) for (let x = b.tx - 1; x <= b.tx + n; x++) if (x >= 0 && y >= 0 && x < N && y < N && seen[y * N + x]) return true; return false; };
      const ok = targets.filter(t => t.k !== 'b' ? seen[Math.floor(t.y) * N + Math.floor(t.x)] : touch(t));
      if (ok.length) return ok;
      const walls = G.C.blds.filter(b => !b.dead && G.enemy(0, b.o) && G.BLDS[b.t].wall && touch(b));
      if (!walls.length) return targets;
      const goal = h.nearest(targets, us[0]); walls.sort((a, b) => G.dist(a, goal) - G.dist(b, goal));
      return walls.slice(0, 3);
    },
    every: (key, sec) => { const v = c.mem || (c.mem = {}); if ((v[key] || -1e9) + sec <= S.t) { v[key] = S.t; return true; } return false; },
    done: (o) => T.isDone(o),
    v: () => S.scen.vars
  };
  return h;
}

module.exports = {
  // Ștefan: oastea de 12, apoi tabăra lui Petru Aron
  // (un om strânge o oaste mare și atacă odată cu muntenii, nu câte puțini)
  st1: { tick(c) { const h = H(c); if (h.done('o1') && (h.army().length >= 20 || c.go) && h.every('a', 4)) { c.go = 1; h.assault(['tabara']); } } },
  // Baia: nu lovi ziua; noaptea, casele târgului, apoi regele
  st3: { aiAfter: 240, tick(c) {
    const h = H(c); if (!h.S.night || !h.every('a', 3)) return;
    if (!h.attack(h.alive('casa_baia'))) { const k = h.G.heroOf(1); if (k) h.attack([k]); else h.assault(['curtea']); }
  } },
  // Podul Înalt: trei oșteni la buciumași, oastea apără valea până trec valurile, apoi tabăra lui Soliman
  st4: { tick(c) {
    const h = H(c), v = h.v();
    if (!c.horns) { c.horns = 1; const a = h.army(u => h.G.UNITS[u.t].cls === 'cav').concat(h.army()).slice(0, 3); [[18, 40], [20, 56], [24, 72]].forEach((p, i) => a[i] && h.G.cmdMove([a[i]], p[0], p[1], false)); c.hornU = a.map(u => u.id); }
    if ((v.waves || 0) >= 3 && h.done('o1') && h.every('a', 4)) h.assault(['tabara'], h.army(u => !(c.hornU || []).includes(u.id) || h.done('o2')));
  } },
  // Neamțul: garnizoana stă în ziduri și trage; oastea lui Ștefan lovește tunurile și trebușetele care bat cetatea,
  // apoi, cu oastea nouă, restul asediului și tabăra
  st5: { tick(c) {
    const h = H(c), G = h.G;
    h.alive('garnizoana').forEach(u => { u.noAi = true; });
    const field = h.army(u => u.tag !== 'garnizoana');
    const siege = h.alive('asediu').filter(e => e.k === 'u' && G.UNITS[e.t].cls === 'sie' && G.hyp(e.x - 49, e.y - 63) < 22);
    if (siege.length && h.every('s', 3)) h.attack(siege, field.filter(u => G.UNITS[u.t].cls === 'cav' || field.length >= 12));
    if (h.done('o2') && h.every('a', 4)) h.assault(['asediu', 'tabara'], field);
  } },
  // Rovine: oastea așteaptă turcii la marginea mlaștinii, lovește fiecare val, apoi tabăra
  mi1: { tick(c) {
    const h = H(c);
    if (h.every('d', 3)) { const f = h.foes().filter(u => h.G.hyp(u.x - 46, u.y - 30) < 30); if (f.length) h.attack(f); else h.amove(48, 30); }
    if (h.done('o1') && h.every('a', 4)) h.assault(['marko', 'tabara']);
  } },
  // Nicopole: după șarja francezilor, oastea și Mircea fug la vad
  mi2: { heroFree: (c) => c.T.isDone('o1'), tick(c) {
    const h = H(c); if (!h.done('o1') || !h.every('m', 3)) return;
    const hero = h.hero(); if (hero) h.G.cmdMove([hero], 72, 7, false); h.move(72, 9);
  } },
  // Dristra: berbecii și oastea la fortăreață; apoi cetatea ta pe locul ei, apărată
  mi3: { tick(c) {
    const h = H(c);
    if (!h.done('o1')) { if (h.every('a', 4) && h.army().length >= 12) h.assault(['dristra']); return; }
    if (!c.built && h.every('b', 3)) {
      const vs = h.vils().slice(0, 8), err = h.G.placeError(0, 'cetate');
      if (!err) for (let r = 0; r < 8 && !c.built; r++) for (let a = 0; a < 8 && !c.built; a++) { const x = Math.round(61 + r * Math.cos(a * 0.785)), y = Math.round(69 + r * Math.sin(a * 0.785)); if (h.G.canPlace(0, 'cetate', x, y)) { h.G.cmdPlace(0, 'cetate', x, y, vs); c.built = 1; } }
    }
    if (h.every('d', 4)) { const f = h.foes().filter(u => h.G.hyp(u.x - 62, u.y - 70) < 25); if (f.length) h.attack(f); }
  } },
  // Târgoviște: curtea și Vladislav
  vl1: { tick(c) { const h = H(c); if (h.army().length >= 18 && h.every('a', 4)) { const k = h.G.heroOf(1); h.attack(h.breach(h.alive('curtea').concat(k ? [k] : []))) || h.assault([]); } } },
  // Poenari: piatră, apoi fortăreața la steag și două turnuri lângă ea (turnurile cer și ele piatră)
  vl2: { tick(c) {
    const h = H(c), G = h.G, P = h.S.players[0], vs = h.vils();
    const mine = (t, x, y, r) => G.C.blds.filter(b => b.o === 0 && !b.dead && b.t === t && G.hyp(b.x - x, b.y - y) < r);
    const fort = mine('fortareata', 52, 30, 7)[0], towers = fort ? mine('turn', fort.x, fort.y, 12) : [];
    const needS = !fort ? 650 : towers.length < 2 ? 160 : 0;
    // țăranii la piatră cât timp lipsește
    if (P.res.s < needS && h.every('s', 10)) { const st = G.S.ents.filter(e => e.k === 'r' && e.t === 'stone' && !e.dead); const pick = vs.filter(u => !(u.carry && u.carry.r === 's') && !(u.task && u.task.k === 'bld')).slice(0, 6); if (st.length && pick.length) G.cmdGather(pick, h.nearest(st, pick[0])); }
    const ring = (t, cx, cy, r0, r1) => { for (let r = r0; r <= r1; r++) for (let a = 0; a < 12; a++) { const x = Math.round(cx + r * Math.cos(a * 0.52)), y = Math.round(cy + r * Math.sin(a * 0.52)); if (G.canPlace(0, t, x, y)) return [x, y]; } return null; };
    if (!fort && !mine('fortareata', 52, 30, 7).length && !G.placeError(0, 'fortareata') && h.every('f', 3)) { const p = ring('fortareata', 51, 29, 0, 5); if (p) G.cmdPlace(0, 'fortareata', p[0], p[1], vs.slice(0, 8)); }
    if (fort && fort.built && towers.length < 2 && !G.placeError(0, 'turn') && h.every('t', 4)) { const p = ring('turn', fort.x + 1, fort.y + 1, 4, 9); if (p) G.cmdPlace(0, 'turn', p[0], p[1], vs.slice(0, 4)); }
    // șantierele neterminate de lângă stâncă primesc constructori
    if (h.every('b', 6)) G.C.blds.filter(b => b.o === 0 && !b.dead && !b.built && G.hyp(b.x - 52, b.y - 30) < 16).forEach(b => { const free = vs.filter(u => !(u.task && u.task.k === 'bld')).slice(0, 3); if (free.length) G.cmdBuild(free, b); });
    if (h.every('d', 4)) { const f = h.foes().filter(u => G.hyp(u.x - 46, u.y - 60) < 30); if (f.length) h.attack(f); }
  } },
  // Atacul de noapte: oastea la cortul cel mare, Vlad în spatele ei; după, Vlad fuge la steagul din nord
  vl3: { noAi: true, heroFree: () => true, tick(c) {
    const h = H(c), hero = h.hero();
    if (!h.done('o1')) { if (h.every('a', 4)) h.attack(h.alive('cort')); if (hero && h.every('h', 4)) h.G.cmdMove([hero], 48, 38, false); return; }
    if (hero && h.every('e', 3)) h.G.cmdMove([hero], 48, 8, false);
    if (h.every('m', 4)) h.move(48, 12);
  } },
  // Călugăreni: oastea ține podul, apoi tabăra lui Sinan
  mh1: { tick(c) {
    const h = H(c);
    if (h.every('d', 3)) { const f = h.foes().filter(u => h.G.hyp(u.x - 50, u.y - 46) < 22); if (f.length) h.attack(f); else if (!h.done('o1')) h.amove(50, 40); }
    if (h.done('o1') && h.every('a', 4)) h.assault(['tunuri', 'tabara']);
  } },
  // Șelimbăr: oastea lui Báthory, apoi Mihai intră în Alba Iulia
  mh3: { heroFree: (c) => c.T.isDone('o1'), tick(c) {
    const h = H(c);
    if (!h.done('o1')) { if (h.army().length >= 20 && h.every('a', 4)) { const k = h.G.heroOf(1); h.attack(h.alive('oastea').concat(k ? [k] : [])) || h.assault([]); } return; }
    const hero = h.hero(); if (hero && h.every('e', 3)) h.G.cmdMove([hero], 16, 16, false); if (h.every('m', 4)) h.amove(18, 18);
  } },
  // Unirea: întâi Suceava, apoi Hotinul
  mh4: { tick(c) { const h = H(c); if (h.army().length >= 22 && h.every('a', 4)) h.assault(['suceava', 'garda_sv', 'hotin', 'garda_ho']); } },
  // Iarna cea lungă: zidurile, apoi fortăreața din trecătoare
  ia2: { tick(c) { const h = H(c); if (h.army().length >= 18 && h.every('a', 4)) h.assault(['fort']); } },
  // Constantinopol: bombardele la ziduri, apoi palatul și împăratul
  me1: { tick(c) {
    const h = H(c);
    if (h.army().length >= 20 && h.every('a', 4)) { const k = h.G.heroOf(1); h.attack(h.breach(h.alive('vlaherne').concat(k ? [k] : []))) || h.assault([]); }
  } }
};
