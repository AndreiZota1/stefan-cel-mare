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
      for (const tag of tags) { const t = h.alive(tag); if (t.length) return h.siege(h.breach(t, units), units); }
      const fb = h.foeBlds(); if (fb.length) return h.siege(h.breach(fb, units), units);
      return h.attack(h.foes(), units);
    },
    // la ziduri, ca un om: mașinile de asediu și arcașii lovesc zidul, pedestrașii și călăreții îi păzesc
    // (atacă pe oricine iese la ei) și nu se aruncă în zid; la clădiri fără ziduri, atacă toți
    siege: (targets, units) => {
      const us = units || h.army(); if (!targets.length) return false;
      if (!targets.every(t => t.k === 'b' && G.BLDS[t.t].wall)) return h.attack(targets, us);
      const cls = u => G.UNITS[u.t].cls, ranged = us.filter(u => cls(u) === 'sie' || cls(u) === 'arc' || cls(u) === 'gun'), guard = us.filter(u => !ranged.includes(u));
      h.attack(targets, ranged.length ? ranged : us);
      if (ranged.length) {
        const c = ranged[0], near = h.foes().filter(e => G.hyp(e.x - c.x, e.y - c.y) < 10);
        if (near.length) h.attack(near, guard); else guard.forEach(u => { if (!u.task) G.cmdMove([u], c.x + (u.id % 5 - 2), c.y + (u.id % 3 - 1), false); });
      }
      return true;
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
    // ---------- asediul, ca un om: adună oastea la adăpost, tunurile bat de departe, pedestrașii le păzesc, apoi asaltul ----------
    // o: { tags: ținte (în ordine), min: câți oșteni strânge înainte, wait: câte secunde așteaptă cel mult, home: [x,y] }
    shooters: () => G.C.blds.filter(b => !b.dead && b.built && G.enemy(0, b.o) && G.BLDS[b.t].atk),
    range: (u) => (G.UNITS[u.t].rng || 0),
    campaign: (o) => {
      const targets = [].concat(...(o.tags || []).map(t => h.alive(t))).filter(e => !e.dead);
      const goal = targets[0] || h.foeBlds()[0] || h.foes()[0]; if (!goal) return;
      if (c.camp && c.camp.gid !== (o.tags || []).join()) c.camp = null;
      const st = c.camp || (c.camp = { ph: 'mass', t0: S.t, gid: (o.tags || []).join(), stage: o.stage || null });
      const army = h.army(), shoot = h.shooters();
      const home = o.home || (G.C.blds.find(b => b.o === 0 && b.t === 'cetate') || army[0] || goal);
      // locul de adunare: acasă, la câteva pătrățele de cetatea ta, spre țintă (departe de zona pe care o apără dușmanul)
      if (!st.stage) {
        const dx = goal.x - home.x, dy = goal.y - home.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
        for (let d = 7; d >= 3 && !st.stage; d--) { const x = home.x + dx / l * d, y = home.y + dy / l * d; if (G.C.pass[Math.floor(y) * S.N + Math.floor(x)]) st.stage = [x, y]; }
        st.stage = st.stage || [home.x + 3, home.y + 3];
      }
      if (st.ph === 'mass') {
        if (h.every('mass', 5)) army.forEach(u => { if (!u.task || u.task.k !== 'atk') if (G.hyp(u.x - st.stage[0], u.y - st.stage[1]) > 5) G.cmdMove([u], st.stage[0] + (u.id % 7 - 3) * 0.7, st.stage[1] + (u.id % 5 - 2) * 0.7, false); });
        // cine vine peste oastea adunată primește bătaie; cine fugărește prea departe e chemat înapoi
        const near = h.foes().filter(e => G.hyp(e.x - st.stage[0], e.y - st.stage[1]) < 12); if (near.length) h.attack(near, army);
        army.forEach(u => { if (G.hyp(u.x - st.stage[0], u.y - st.stage[1]) > 20 && u.task && u.task.k === 'atk') G.cmdMove([u], st.stage[0], st.stage[1], false); });
        // pornește când oastea e destul de mare, a avut timp să crească (o.after) și cea mai mare parte e strânsă la loc
        const here = army.filter(u => G.hyp(u.x - st.stage[0], u.y - st.stage[1]) < 8).length;
        if ((army.length >= (o.min || 20) && S.t >= (o.after === undefined ? 360 : o.after) && here >= army.length * 0.7) || S.t - st.t0 > (o.wait || 900)) { st.ph = 'siege'; }
        return;
      }
      if (h.every('ws', 6)) h.workshop(o.siege || 4);
      // oastea s-a topit: înapoi acasă, refacere, apoi încă un asalt (nu câte unul sub turnuri)
      if (army.length < (o.min || 20) * 0.35 && !(goal.k === 'b' && goal.hp < G.maxHp(goal) * 0.3)) { st.ph = 'mass'; st.t0 = S.t; army.forEach(u => G.cmdMove([u], st.stage[0], st.stage[1], false)); return; }
      if (!h.every('siege', 2)) return;
      const sie = army.filter(u => G.UNITS[u.t].cls === 'sie'), far = sie.filter(u => h.range(u) >= 7), rams = sie.filter(u => !h.range(u));
      const rest = army.filter(u => G.UNITS[u.t].cls !== 'sie');
      // când vin dușmani peste mașini, mașinile se trag în spatele oastei, iar oastea îi oprește; abia apoi asediul merge mai departe
      if (sie.length && rest.length) {
        // primejdie: dușmanii ieșiți de sub turnuri care se apropie de mașini (cei de sub turnuri nu le ajung: tunurile bat mai departe)
        const sc = sie[0], danger = h.foes().filter(e => G.hyp(e.x - sc.x, e.y - sc.y) < 14 && shoot.every(b => G.hyp(b.x - e.x, b.y - e.y) > 8.5));
        if (danger.length) {
          h.attack(danger, rest);
          const back = st.stage; sie.forEach(u => { if (G.hyp(u.x - back[0], u.y - back[1]) > 4) G.cmdMove([u], back[0] + (u.id % 3 - 1), back[1] + (u.id % 2), false); });
          return;
        }
      }
      const reach = h.breach(targets.length ? targets : [goal], army.length ? army : undefined);
      const open = reach.some(t => !(t.k === 'b' && G.BLDS[t.t].wall));
      // tunurile: întâi turnurile care ne pot lovi, apoi ținta (dacă bat până la ea), apoi zidul care o închide
      if (far.length) {
        const c0 = far[0], tw = shoot.filter(b => G.hyp(b.x - c0.x, b.y - c0.y) < 20).sort((a, b) => G.dist(a, c0) - G.dist(b, c0));
        h.attack(tw.length ? tw.slice(0, 1) : (open ? reach : reach.slice(0, 1)).concat(targets), far);
      }
      // berbecii: la zid sau la poartă unde nu bate niciun turn; fără tunuri care să dărâme turnurile, merg oricum, cu oastea după ei
      if (rams.length) { const w = reach.filter(t => shoot.every(b => G.hyp(b.x - t.x, b.y - t.y) > 7.5)); h.attack(w.length ? w : (open || !far.length ? reach : []), rams); }
      // pedestrașii: lovesc pe oricine se apropie de mașini; altfel stau lângă ele, în afara bătăii turnurilor
      const anchor = sie[0] || rest[0];
      const foesNear = anchor ? h.foes().filter(e => G.hyp(e.x - anchor.x, e.y - anchor.y) < 11) : [];
      const towersLeft = shoot.filter(b => anchor && G.hyp(b.x - anchor.x, b.y - anchor.y) < 16).length;
      if (open && (!towersLeft || !sie.length)) { st.ph = 'storm'; }
      if (st.ph === 'storm' || !sie.length) { h.attack(foesNear.length ? foesNear : reach.concat(targets), rest); return; }
      if (foesNear.length) h.attack(foesNear, rest);
      else rest.forEach(u => { if (!(u.task && u.task.k === 'atk') && anchor && G.hyp(u.x - anchor.x, u.y - anchor.y) > 4) G.cmdMove([u], anchor.x + (u.id % 5 - 2), anchor.y + (u.id % 3 - 1), false); });
    },
    // oaste pe bandă, ca un om grăbit: o cazarmă lângă casă (dacă nu e), apoi oșteni din fiecare clădire de oaste
    trainArmy: (types, where) => {
      const home = G.C.blds.find(b => b.o === 0 && b.t === 'cetate' && b.built);
      const mil = G.C.blds.filter(b => b.o === 0 && !b.dead && (b.t === 'cazarma' || b.t === 'poligon' || b.t === 'grajd'));
      if (!mil.some(b => b.t === 'cazarma') && home && !G.placeError(0, 'cazarma') && !c.placedBarracks) {
        for (let r = 5; r < 12 && !c.placedBarracks; r++) for (let a = 0; a < 12 && !c.placedBarracks; a++) { const x = Math.round(home.x + r * Math.cos(a * 0.52)), y = Math.round(home.y + r * Math.sin(a * 0.52)); if (G.canPlace(0, 'cazarma', x, y)) { G.cmdPlace(0, 'cazarma', x, y, h.vils().slice(0, 3)); c.placedBarracks = 1; } }
      }
      mil.filter(b => b.built && (!b.q || b.q.length < 2)).forEach(b => { for (const t of types) if (!G.trainError(b, t)) { G.cmdTrain(b, t); break; } });
    },
    workshop: (want) => {
      const P = S.players[0], home = G.C.blds.find(b => b.o === 0 && b.t === 'cetate' && b.built);
      const ws = G.C.blds.filter(b => b.o === 0 && !b.dead && b.t === 'atelier');
      if (!ws.length) {
        if (!home || G.placeError(0, 'atelier')) return;
        for (let r = 6; r < 14; r++) for (let a = 0; a < 12; a++) { const x = Math.round(home.x + r * Math.cos(a * 0.52)), y = Math.round(home.y + r * Math.sin(a * 0.52)); if (G.canPlace(0, 'atelier', x, y)) { G.cmdPlace(0, 'atelier', x, y, h.vils().slice(0, 3)); return; } }
        return;
      }
      const sie = G.C.units.filter(u => u.o === 0 && !u.dead && G.UNITS[u.t].cls === 'sie').length;
      ws.filter(b => b.built && (!b.q || b.q.length < 2)).forEach(b => { if (sie >= want) return; for (const t of ['can', 'ram', 'cat']) if (!G.trainError(b, t)) { G.cmdTrain(b, t); break; } });
    },
    every: (key, sec) => { const v = c.mem || (c.mem = {}); if ((v[key] || -1e9) + sec <= S.t) { v[key] = S.t; return true; } return false; },
    done: (o) => T.isDone(o),
    v: () => S.scen.vars
  };
  return h;
}

module.exports = {
  // Baia: ziua strângi oaste (fără să lovești), noaptea casele târgului, apoi regele
  st3: { tick(c) {
    const h = H(c); if (!h.S.night || !h.every('a', 3)) return;
    if (!c.go && h.army().length < 32 && h.S.t < 420) return; c.go = 1;
    if (!h.attack(h.alive('casa_baia'))) { const k = h.G.heroOf(1); if (k) h.attack([k]); else h.assault(['curtea']); }
  } },
  // Podul Înalt: trei oșteni la buciumași, oastea apără valea până trec valurile, apoi tabăra lui Soliman
  st4: { tick(c) {
    const h = H(c), v = h.v();
    if (!c.horns) { c.horns = 1; const a = h.army(u => h.G.UNITS[u.t].cls === 'cav').concat(h.army()).slice(0, 3); [[18, 40], [20, 56], [24, 72]].forEach((p, i) => a[i] && h.G.cmdMove([a[i]], p[0], p[1], false)); c.hornU = a.map(u => u.id); }
    if (h.done('o1')) h.campaign({ tags: ['tabara', 'garda'], min: 25, after: 0 });
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
  // Doljești: o oaste mare, adunată pe malul nostru, apoi tabăra lui Petru Aron (cu muntenii)
  st1: { tick(c) {
    const h = H(c); if (h.every('tr', 3)) h.trainArmy(['spr', 'mil', 'arc']);
    if (!h.done('o1')) { h.army().forEach(u => { if (u.x > 50 && u.task && u.task.k === 'atk') h.G.cmdMove([u], 28, 46, false); }); return; }
    h.campaign({ tags: ['tabara'], min: 18, after: 0, stage: [44, 46] });
  } },
  // Chilia: tunurile dărâmă turnurile de departe, berbecii poarta, apoi fortăreața
  st2: { tick(c) { H(c).campaign({ tags: ['chilia'], min: 32, after: 420 }); } },
  // Dristra: asediul fortăreței; apoi cetatea ta pe locul ei, apărată
  mi3: { tick(c) {
    const h = H(c);
    if (!h.done('o1')) { h.campaign({ tags: ['dristra'], min: 34, after: 420 }); return; }
    if (!c.built && h.every('b', 3)) {
      const vs = h.vils().slice(0, 8), err = h.G.placeError(0, 'cetate');
      if (!err) for (let r = 0; r < 8 && !c.built; r++) for (let a = 0; a < 8 && !c.built; a++) { const x = Math.round(61 + r * Math.cos(a * 0.785)), y = Math.round(69 + r * Math.sin(a * 0.785)); if (h.G.canPlace(0, 'cetate', x, y)) { h.G.cmdPlace(0, 'cetate', x, y, vs); c.built = 1; } }
    }
    if (h.every('d', 4)) { const f = h.foes().filter(u => h.G.hyp(u.x - 62, u.y - 70) < 25); if (f.length) h.attack(f); }
  } },
  // Târgoviște: palisada, curtea și Vladislav
  vl1: { tick(c) { const h = H(c); h.campaign({ tags: ['curtea'], min: 24, after: 960 }); const k = h.G.heroOf(1); if (k && c.camp && c.camp.ph === 'storm' && h.every('k', 4)) h.attack([k], h.army(u => h.G.UNITS[u.t].cls === 'cav')); } },
  // Unirea: întâi Suceava, apoi Hotinul
  mh4: { tick(c) { const h = H(c); h.campaign({ tags: h.alive('suceava').length ? ['suceava'] : ['hotin'], min: 45, after: 300 }); } },
  // Iarna cea lungă: zidurile trecătorii, apoi fortăreața
  // (turcii atacă ei primii, la minutul 10: îi aștepți acasă, apoi contraataci)
  ia2: { tick(c) { H(c).campaign({ tags: ['fort'], min: 30, after: 780 }); } },
  // Constantinopol: tunurile și trebușetele sparg zidul, apoi palatul Vlaherne și împăratul
  me1: { tick(c) { const h = H(c); h.campaign({ tags: ['vlaherne'], min: 30 }); const k = h.G.heroOf(1); if (k && c.camp && c.camp.ph === 'storm' && h.every('k', 4)) h.attack([k], h.army(u => h.G.UNITS[u.t].cls !== 'sie')); } },
  // Valea Albă: tunurile la palisadă, apoi tabăra lui Ștefan
  me2: { tick(c) { H(c).campaign({ tags: ['tabara'], min: 30 }); } }
};
