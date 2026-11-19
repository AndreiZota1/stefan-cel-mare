// Datele jocului: civilizații, epoci, unități, clădiri, tehnologii, resurse, texte.
var G = globalThis.G || (globalThis.G = {});

G.N = 72;          // harta are N x N pătrățele (mărimea se alege la începutul jocului)
G.MAXPOP = 100;    // limita de oameni (se alege la începutul jocului)

G.RES = ['f', 'w', 'g', 's'];
G.RES_NAME = { f: 'Hrană', w: 'Lemn', g: 'Aur', s: 'Piatră' };
G.RES_ICON = { f: '🌾', w: '🪵', g: '🪙', s: '🪨' };

G.AGES = ['Epoca Întunecată', 'Epoca Feudală', 'Epoca Cetăților', 'Epoca Imperială', 'Epoca Renașterii'];
G.AGE_ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// fx = efecte, aceeași formă ca la tehnologii (vezi G.TECHS)
G.CIVS = {
  mol: { name: 'Moldova', ppl: 'moldovenii', style: 'mol', hero: 'Ștefan cel Mare', uniq: 'raz', ut: ['bucium', 'oastea'], power: 'bucium', music: 'doina',
         year: 'Ștefan cel Mare, 1457–1504', flag: '🐂',
         bonus: ['Cetatea, fortărețele și turnurile bat mai departe.', 'Lemnul se strânge cu 10% mai repede.', 'Unitatea unică: Răzeșul, țăranul liber care merge la oaste.'],
         fx: [{ b: ['cetate', 'turn', 'fortareata'], s: 'rng', add: 1.5 }, { gather: 'tree', mul: 1.1 }] },
  val: { name: 'Țara Românească', ppl: 'muntenii', style: 'mol', hero: 'Vlad Țepeș', uniq: 'vit', ut: ['noapte', 'tepe'], power: 'teroare', music: 'doina',
         year: 'Vlad Țepeș, 1456–1462', flag: '🦅',
         bonus: ['Pedestrașii au cu 15% mai multă viață.', 'Lângă Vlad Țepeș, dușmanii lovesc cu 20% mai slab.', 'Unitatea unică: Viteazul.'],
         fx: [{ u: { cls: ['inf'] }, s: 'hp', mul: 1.15 }] },
  ung: { name: 'Regatul Ungariei', ppl: 'ungurii', style: 'cat', hero: 'Iancu de Hunedoara', uniq: 'hus', ut: ['armata', 'corbul'], power: 'cruciada', music: 'ungar',
         year: 'Iancu de Hunedoara, 1441–1456', flag: '🐦‍⬛',
         bonus: ['Călăreții costă cu 15% mai puțin și au +1 atac.', 'Grajdul lucrează cu 20% mai repede.', 'Unitatea unică: Husarul.'],
         fx: [{ cost: { cls: ['cav', 'har'] }, mul: 0.85 }, { train: ['grajd'], mul: 1.2 }, { u: { cls: ['cav'] }, s: 'atk', add: 1 }] },
  pol: { name: 'Regatul Poloniei', ppl: 'polonii', style: 'cat', hero: 'Ioan Albert', uniq: 'cpl', ut: ['szlachta', 'inaripati'], power: 'garda', music: 'ungar',
         year: 'Ioan Albert, 1492–1501', flag: '🦅',
         bonus: ['Clădirile au cu 15% mai multă viață.', 'Piatra se strânge cu 20% mai repede.', 'Unitatea unică: Cavalerul polonez.'],
         fx: [{ b: 'all', s: 'hp', mul: 1.15 }, { gather: 'stone', mul: 1.2 }] },
  oto: { name: 'Imperiul Otoman', ppl: 'otomanii', style: 'oto', hero: 'Soliman Pașa', uniq: 'ien', ut: ['bronz', 'garda'], power: 'baterie', music: 'hijaz',
         year: 'Mehmed al II-lea, 1451–1481', flag: '🌙',
         bonus: ['Țăranii se fac cu 10% mai repede.', 'Ogoarele dau cu 10% mai multă hrană.', 'Aurul se strânge cu 20% mai repede.', 'Cazarma lucrează cu 25% mai repede.', 'Pușcașii și ienicerii au cu 25% mai multă viață.', 'Bombardele vin cu o epocă mai devreme și costă cu 20% mai puțin.', 'Unitatea unică: Ienicerul.'],
         fx: [{ gather: 'gold', mul: 1.2 }, { cost: { line: ['can'] }, mul: 0.8 }, { train: ['cazarma'], mul: 1.25 }, { train: ['cetate'], mul: 1.1 }, { gather: 'farm', mul: 1.1 }, { u: { cls: ['gun'] }, s: 'hp', mul: 1.25 }] },
  tat: { name: 'Hanatul Crimeii', ppl: 'tătarii', style: 'tat', hero: 'Mengli Giray', uniq: 'nog', ut: ['arcul', 'jaful'], power: 'navala', music: 'stepa',
         year: 'Mengli Giray, 1478–1515', flag: '🏹',
         bonus: ['Călăreții merg cu 15% mai repede.', 'Oile se strâng cu 30% mai repede.', 'Fără pușcași și fără tunuri.', 'Unitatea unică: Arcașul nogai.'],
         fx: [{ u: { cls: ['cav', 'har'] }, s: 'spd', mul: 1.15 }, { gather: 'sheep', mul: 1.3 }] }
};
G.CIV_LIST = ['mol', 'val', 'ung', 'pol', 'oto', 'tat'];

// culorile jucătorilor, după locul lor în joc (civilizația nu schimbă culoarea)
G.PCOL = [
  { name: 'albastru', color: '#2f6fd6', light: '#9cc2ff', dark: '#1a3d7c' },
  { name: 'roșu', color: '#d23b2e', light: '#ffa093', dark: '#7c1d15' },
  { name: 'verde', color: '#3fa34d', light: '#a6e3a1', dark: '#1d5a26' },
  { name: 'galben', color: '#e3c13a', light: '#fbe7a1', dark: '#7d6512' }
];

// puterile eroilor (se apasă din panou, apoi se reîncarcă)
G.POWERS = {
  bucium:   { name: 'Buciumul', icon: '📯', cd: 90, r: 8, dur: 15, desc: 'Oastea din jur lovește și merge cu 30% mai tare, 15 secunde.' },
  teroare:  { name: 'Teroarea', icon: '💀', cd: 90, r: 7, dur: 15, desc: 'Dușmanii din jur lovesc cu 40% mai slab, 15 secunde.' },
  cruciada: { name: 'Cruciada de la Belgrad', icon: '✝️', cd: 100, r: 8, dur: 0, desc: 'Vindecă oastea din jur cu jumătate din viață.' },
  garda:    { name: 'Garda regală', icon: '👑', cd: 240, r: 0, dur: 0, desc: 'Cheamă 2 cavaleri polonezi lângă rege.' },
  baterie:  { name: 'Bateria', icon: '💥', cd: 90, r: 9, dur: 20, desc: 'Mașinile de asediu din jur lovesc cu 50% mai tare, 20 de secunde.' },
  navala:   { name: 'Năvala', icon: '🐎', cd: 90, r: 10, dur: 15, desc: 'Călăreții din jur: +50% viteză și +2 atac, 15 secunde.' },
  // puterile eroilor din campanii (Mircea cel Bătrân, Mihai Viteazul), care luptă cu oastea Țării Românești
  rovine:   { name: 'Rovinele', icon: '🌾', cd: 90, r: 8, dur: 15, desc: 'Dușmanii din jur se împotmolesc ca în mlaștinile de la Rovine: merg cu 45% mai încet și lovesc cu 20% mai slab, 15 secunde.' },
  sarja:    { name: 'Toporul de la Călugăreni', icon: '🪓', cd: 90, r: 8, dur: 12, desc: 'Mihai se aruncă primul în luptă: oastea din jur lovește cu 60% mai tare și merge cu 30% mai repede, 12 secunde.' }
};

// first = secunda primului atac; every = pauza dintre atacuri; wave0/waveAdd = mărimea valurilor
G.DIFF = {
  usor:   { name: 'Ușor',        gather: 0.8,  vil: 0.8,  army: 0.6, first: 840, every: 330, wave0: 4, waveAdd: 2, bonus: 0 },
  normal: { name: 'Normal',      gather: 1.0,  vil: 1.0,  army: 1.0, first: 600, every: 240, wave0: 6, waveAdd: 3, bonus: 0 },
  greu:   { name: 'Greu',        gather: 1.2,  vil: 1.1,  army: 1.2, first: 480, every: 200, wave0: 8, waveAdd: 4, bonus: 150 },
  foarte: { name: 'Foarte greu', gather: 1.35, vil: 1.15, army: 1.4, first: 380, every: 165, wave0: 9, waveAdd: 5, bonus: 300 }
};

// cls: vil (țăran), inf (pedestrași), arc (arcași), skr (plăieși), gun (pușcași), cav (călăreți), har (arcași călare),
//      sie (asediu), mon (călugări), car (care de negoț)
// ma / pa = armură contra loviturilor de aproape / contra săgeților și gloanțelor; minr = cât de aproape nu poate trage
// line + tier = linia de upgrade (oștenii se transformă când cercetezi treapta următoare)
G.UNITS = {
  vil:  { name: { def: 'Țăran' }, cls: 'vil', hp: 25, atk: 3, rng: 0, rof: 2, ma: 0, pa: 0, spd: 0.9, los: 4, cost: { f: 50 }, time: 12, age: 0, r: 0.2, cap: 10,
          desc: 'Strânge resurse și construiește.' },
  hero: { name: { def: 'Erou' }, cls: 'cav', hero: true, hp: 320, atk: 14, rng: 0, rof: 1.6, ma: 4, pa: 4, spd: 1.35, los: 7, cost: { f: 200, g: 150 }, time: 30, age: 0, r: 0.32, regen: 1,
          desc: 'Erou. Oștenii din jurul lui lovesc mai tare. Se vindecă singur și are o putere specială.' },

  // Cazarmă
  mil:  { name: 'Oștean', line: 'mil', tier: 1, cls: 'inf', hp: 45, atk: 5, rng: 0, rof: 1.8, ma: 0, pa: 1, spd: 0.9, los: 4, cost: { f: 60, g: 20 }, time: 14, age: 0, r: 0.2, bonus: { bld: 2 },
          desc: 'Pedestraș cu sabie. Bun la toate, bate și în clădiri.' },
  mil2: { name: 'Oștean în zale', line: 'mil', tier: 2, cls: 'inf', hp: 50, atk: 6, rng: 0, rof: 1.8, ma: 0, pa: 1, spd: 0.9, los: 4, cost: { f: 60, g: 20 }, time: 14, age: 1, r: 0.2, bonus: { bld: 2 },
          desc: 'Pedestraș în zale, cu scut.' },
  mil3: { name: 'Spadasin', line: 'mil', tier: 3, cls: 'inf', hp: 60, atk: 9, rng: 0, rof: 1.8, ma: 1, pa: 1, spd: 0.9, los: 4, cost: { f: 60, g: 20 }, time: 14, age: 2, r: 0.2, bonus: { bld: 3 },
          desc: 'Spadasin cu armură. Bate pedestrașii și clădirile.' },
  mil4: { name: 'Spadasin greu', line: 'mil', tier: 4, cls: 'inf', hp: 65, atk: 11, rng: 0, rof: 1.8, ma: 1, pa: 2, spd: 0.9, los: 4, cost: { f: 60, g: 20 }, time: 14, age: 3, r: 0.2, bonus: { bld: 4 },
          desc: 'Spadă cu două mâini, armură de plăci.' },
  mil5: { name: 'Campion', line: 'mil', tier: 5, cls: 'inf', hp: 75, atk: 13, rng: 0, rof: 1.8, ma: 2, pa: 2, spd: 0.95, los: 5, cost: { f: 60, g: 20 }, time: 14, age: 4, r: 0.2, bonus: { bld: 5 },
          desc: 'Cel mai bun pedestraș cu spadă.' },
  spr:  { name: 'Lăncier', line: 'spr', tier: 1, cls: 'inf', hp: 45, atk: 3, rng: 0, rof: 2, ma: 0, pa: 0, spd: 1.0, los: 4, cost: { f: 35, w: 25 }, time: 12, age: 1, r: 0.2, bonus: { cav: 15, har: 10 },
          desc: 'Ieftin. Foarte tare contra călăreților.' },
  spr2: { name: 'Pichier', line: 'spr', tier: 2, cls: 'inf', hp: 55, atk: 4, rng: 0, rof: 2, ma: 0, pa: 0, spd: 1.0, los: 4, cost: { f: 35, w: 25 }, time: 12, age: 2, r: 0.2, bonus: { cav: 22, har: 14 },
          desc: 'Suliță lungă. Oprește călăreții grei.' },
  spr3: { name: 'Halebardier', line: 'spr', tier: 3, cls: 'inf', hp: 60, atk: 6, rng: 0, rof: 2, ma: 0, pa: 0, spd: 1.0, los: 4, cost: { f: 35, w: 25 }, time: 12, age: 3, r: 0.2, bonus: { cav: 32, har: 20 },
          desc: 'Halebardă. Coșmarul cavalerilor.' },

  // Poligon
  skr:  { name: 'Plăieș', line: 'skr', tier: 1, cls: 'skr', hp: 30, atk: 2, rng: 4, rof: 2.2, ma: 0, pa: 3, spd: 0.95, los: 6, cost: { f: 25, w: 35 }, time: 12, age: 1, r: 0.2, bonus: { arc: 4, har: 3, gun: 2 }, proj: 'jav',
          desc: 'Aruncă sulițe. Ieftin, bun contra arcașilor.' },
  skr2: { name: 'Plăieș de elită', line: 'skr', tier: 2, cls: 'skr', hp: 35, atk: 3, rng: 5, rof: 2.2, ma: 0, pa: 4, spd: 0.95, los: 7, cost: { f: 25, w: 35 }, time: 12, age: 2, r: 0.2, bonus: { arc: 5, har: 4, gun: 3 }, proj: 'jav',
          desc: 'Plăieș cu mai multă armură și bătaie.' },
  arc:  { name: 'Arcaș', line: 'arc', tier: 1, cls: 'arc', hp: 30, atk: 4, rng: 4.5, rof: 2, ma: 0, pa: 0, spd: 0.95, los: 6, cost: { w: 25, g: 45 }, time: 13, age: 1, r: 0.2, bonus: { inf: 1 }, proj: 'arrow',
          desc: 'Trage de departe. Bun contra pedestrașilor.' },
  arc2: { name: 'Arbaletier', line: 'arc', tier: 2, cls: 'arc', hp: 35, atk: 5, rng: 5, rof: 2, ma: 0, pa: 0, spd: 0.95, los: 7, cost: { w: 25, g: 45 }, time: 13, age: 2, r: 0.2, bonus: { inf: 1 }, proj: 'bolt',
          desc: 'Arbaletă. Lovește mai tare și mai departe.' },
  arc3: { name: 'Arbaletier greu', line: 'arc', tier: 3, cls: 'arc', hp: 40, atk: 6, rng: 5.5, rof: 2, ma: 0, pa: 1, spd: 0.95, los: 7, cost: { w: 25, g: 45 }, time: 13, age: 3, r: 0.2, bonus: { inf: 2 }, proj: 'bolt',
          desc: 'Arbaletă grea și armură.' },
  har:  { name: 'Arcaș călare', line: 'har', tier: 1, cls: 'har', hp: 50, atk: 6, rng: 4, rof: 2, ma: 0, pa: 1, spd: 1.4, los: 6, cost: { w: 40, g: 70 }, time: 18, age: 2, r: 0.3, proj: 'arrow',
          desc: 'Trage din șa. Greu de prins.' },
  har2: { name: 'Arcaș călare greu', line: 'har', tier: 2, cls: 'har', hp: 60, atk: 7, rng: 4.5, rof: 2, ma: 1, pa: 1, spd: 1.4, los: 7, cost: { w: 40, g: 70 }, time: 18, age: 3, r: 0.3, proj: 'arrow',
          desc: 'Arcaș călare cu armură.' },
  gun:  { name: 'Pușcaș', line: 'gun', tier: 1, cls: 'gun', hp: 40, atk: 16, rng: 6, rof: 3.4, ma: 1, pa: 0, spd: 0.9, los: 7, cost: { f: 45, g: 50 }, time: 18, age: 3, r: 0.2, bonus: { inf: 8, cav: 2 }, proj: 'bullet',
          req: ['chimie'], notCiv: ['tat'], desc: 'Pușcă cu fitil. Lovește greu, dar trage rar. Cere Chimia.' },
  gun2: { name: 'Muschetar', line: 'gun', tier: 2, cls: 'gun', hp: 50, atk: 18, rng: 7, rof: 3, ma: 1, pa: 1, spd: 0.9, los: 8, cost: { f: 45, g: 50 }, time: 18, age: 4, r: 0.2, bonus: { inf: 10, cav: 3 }, proj: 'bullet',
          notCiv: ['tat'], desc: 'Muschetă. Cel mai tare trăgător.' },

  // Grajd
  lcv:  { name: 'Călăraș', line: 'lcv', tier: 1, cls: 'cav', hp: 55, atk: 5, rng: 0, rof: 2, ma: 0, pa: 2, spd: 1.5, los: 7, cost: { f: 80 }, time: 14, age: 1, r: 0.3, bonus: { arc: 4, har: 3, sie: 8, mon: 6, gun: 4 },
          desc: 'Rapid. Vânează arcași, pușcași, călugări și mașini de asediu.' },
  lcv2: { name: 'Călăraș greu', line: 'lcv', tier: 2, cls: 'cav', hp: 70, atk: 7, rng: 0, rof: 2, ma: 0, pa: 2, spd: 1.5, los: 7, cost: { f: 80 }, time: 14, age: 2, r: 0.3, bonus: { arc: 4, har: 3, sie: 8, mon: 6, gun: 4 },
          desc: 'Călăraș cu armură.' },
  lcv3: { name: 'Călăraș de elită', line: 'lcv', tier: 3, cls: 'cav', hp: 85, atk: 8, rng: 0, rof: 2, ma: 1, pa: 3, spd: 1.5, los: 8, cost: { f: 80 }, time: 14, age: 3, r: 0.3, bonus: { arc: 5, har: 4, sie: 10, mon: 6, gun: 5 },
          desc: 'Cel mai bun călăreț ușor.' },
  kni:  { name: 'Curtean', line: 'kni', tier: 1, cls: 'cav', hp: 100, atk: 10, rng: 0, rof: 1.8, ma: 2, pa: 2, spd: 1.35, los: 5, cost: { f: 60, g: 75 }, time: 18, age: 2, r: 0.3,
          desc: 'Călăreț greu în armură.' },
  kni2: { name: 'Cavaler', line: 'kni', tier: 2, cls: 'cav', hp: 120, atk: 12, rng: 0, rof: 1.8, ma: 2, pa: 2, spd: 1.35, los: 5, cost: { f: 60, g: 75 }, time: 18, age: 3, r: 0.3,
          desc: 'Cavaler cu armură de plăci.' },
  kni3: { name: 'Cavaler de elită', line: 'kni', tier: 3, cls: 'cav', hp: 160, atk: 14, rng: 0, rof: 1.8, ma: 2, pa: 3, spd: 1.35, los: 6, cost: { f: 60, g: 75 }, time: 18, age: 4, r: 0.3,
          desc: 'Cel mai greu călăreț.' },

  // Atelier de asediu
  ram:  { name: 'Berbec', line: 'ram', tier: 1, cls: 'sie', hp: 180, atk: 2, rng: 0, rof: 4, ma: 0, pa: 60, spd: 0.6, los: 3, cost: { w: 160, g: 75 }, time: 22, age: 2, r: 0.38, bonus: { bld: 110 }, onlyBld: true,
          desc: 'Dărâmă clădiri. Săgețile nu-i fac nimic, săbiile da.' },
  ram2: { name: 'Berbec greu', line: 'ram', tier: 2, cls: 'sie', hp: 240, atk: 3, rng: 0, rof: 4, ma: 0, pa: 80, spd: 0.6, los: 3, cost: { w: 160, g: 75 }, time: 22, age: 3, r: 0.38, bonus: { bld: 150 }, onlyBld: true,
          desc: 'Berbec cu cap de fier.' },
  cat:  { name: 'Catapultă', line: 'cat', tier: 1, cls: 'sie', hp: 70, atk: 26, rng: 7, minr: 2.5, rof: 6, ma: 0, pa: 6, spd: 0.6, los: 8, cost: { w: 160, g: 135 }, time: 25, age: 2, r: 0.38, bonus: { bld: 20 },
          proj: 'stone', splash: 0.9, desc: 'Aruncă bolovani peste grupuri de oameni.' },
  cat2: { name: 'Catapultă grea', line: 'cat', tier: 2, cls: 'sie', hp: 90, atk: 34, rng: 8, minr: 2.5, rof: 6, ma: 0, pa: 7, spd: 0.6, los: 9, cost: { w: 160, g: 135 }, time: 25, age: 3, r: 0.38, bonus: { bld: 30 },
          proj: 'stone', splash: 1.25, desc: 'Bolovani mai mari, pe o suprafață mai mare.' },
  can:  { name: 'Bombardă', line: 'can', tier: 1, cls: 'sie', hp: 80, atk: 30, rng: 9, minr: 2, rof: 6, ma: 0, pa: 4, spd: 0.55, los: 9, cost: { w: 175, g: 150 }, time: 25, age: 3, r: 0.36, bonus: { bld: 80 },
          proj: 'ball', req: ['chimie'], notCiv: ['tat'], desc: 'Tun de asediu. Bate de departe în ziduri. Cere Chimia.' },
  can2: { name: 'Tun de asediu', line: 'can', tier: 2, cls: 'sie', hp: 110, atk: 40, rng: 10, minr: 2, rof: 6, ma: 0, pa: 5, spd: 0.55, los: 10, cost: { w: 175, g: 150 }, time: 25, age: 4, r: 0.36, bonus: { bld: 120 },
          proj: 'ball', notCiv: ['tat'], desc: 'Tun de bronz, bate și mai departe.' },
  treb: { name: 'Trebușet', cls: 'sie', hp: 150, atk: 10, rng: 13, minr: 4, rof: 10, ma: 1, pa: 50, spd: 0.45, los: 10, cost: { w: 200, g: 200 }, time: 35, age: 3, r: 0.42, bonus: { bld: 190 },
          onlyBld: true, proj: 'treb', desc: 'Aruncă bolovani uriași peste ziduri, de foarte departe. Doar în clădiri.' },

  // Mănăstire, Târg
  mon:  { name: { def: 'Călugăr', oto: 'Derviș', tat: 'Derviș' }, cls: 'mon', hp: 30, atk: 0, rng: 0, rof: 1, ma: 0, pa: 0, spd: 0.75, los: 9, cost: { g: 100 }, time: 25, age: 1, r: 0.2, heal: 3,
          desc: 'Vindecă oamenii răniți din jur. Duce moaștele la mănăstire. Nu luptă.' },
  // pe apă (se fac la port; merg doar pe apă)
  pesc: { name: 'Barcă de pescuit', cls: 'shp', naval: 1, hp: 60, atk: 0, rng: 0, rof: 1, ma: 0, pa: 4, spd: 1.2, los: 5, cost: { w: 75 }, time: 18, age: 0, r: 0.35, fisher: 1, cap: 15,
          desc: 'Prinde pește la mal și în larg și îl aduce la port. Peștele din larg nu se termină repede.' },
  gal:  { name: 'Galeră', line: 'gal', tier: 1, cls: 'shp', naval: 1, hp: 120, atk: 6, rng: 5, rof: 2.5, ma: 0, pa: 6, spd: 1.25, los: 7, cost: { w: 90, g: 30 }, time: 22, age: 1, r: 0.42, proj: 'arrow', bonus: { shp: 2 },
          desc: 'Corabie de luptă cu arcași. Bună contra bărcilor și a oamenilor de pe mal.' },
  gal2: { name: 'Galeră de război', line: 'gal', tier: 2, cls: 'shp', naval: 1, hp: 150, atk: 7, rng: 5.5, rof: 2.5, ma: 0, pa: 7, spd: 1.3, los: 8, cost: { w: 90, g: 30 }, time: 22, age: 2, r: 0.45, proj: 'arrow', bonus: { shp: 3 },
          desc: 'Galera întărită: mai multă viață, trage mai departe.' },
  foc:  { name: 'Corabie incendiară', cls: 'shp', naval: 1, hp: 100, atk: 2, rng: 0, rof: 0.3, ma: 0, pa: 6, spd: 1.4, los: 5, cost: { w: 75, g: 45 }, time: 25, age: 2, r: 0.42, bonus: { shp: 2 },
          desc: 'Aruncă foc în corăbiile de lângă ea. Topește galerele.' },
  tra:  { name: 'Corabie de transport', cls: 'shp', naval: 1, hp: 100, atk: 0, rng: 0, rof: 1, ma: 0, pa: 6, spd: 1.35, los: 5, cost: { w: 125 }, time: 25, age: 1, r: 0.45, carry: 10,
          desc: 'Duce până la 10 oameni peste apă. Atinge-o cu oamenii aleși ca să urce; apoi atinge malul unde vrei să coboare.' },
  car:  { name: 'Car de negoț', cls: 'car', hp: 70, atk: 0, rng: 0, rof: 1, ma: 0, pa: 2, spd: 1.0, los: 5, cost: { f: 50, w: 100 }, time: 25, age: 1, r: 0.3, garr: false,
          desc: 'Face drumul între târgurile tale și aduce aur. Cu cât drumul e mai lung, cu atât mai mult aur.' },

  // unitățile unice (Fortăreață)
  raz:  { name: 'Răzeș', line: 'raz', tier: 1, civ: 'mol', cls: 'inf', hp: 60, atk: 7, rng: 0, rof: 1.8, ma: 1, pa: 2, spd: 1.0, los: 5, cost: { f: 55, w: 20, g: 20 }, time: 13, age: 2, r: 0.2,
          bonus: { cav: 8, har: 6, sie: 6, bld: 2 }, desc: 'Țăranul liber care merge la oaste: ieftin, rezistent, bun contra călăreților.' },
  raz2: { name: 'Răzeș de elită', line: 'raz', tier: 2, civ: 'mol', cls: 'inf', hp: 75, atk: 9, rng: 0, rof: 1.8, ma: 1, pa: 3, spd: 1.0, los: 5, cost: { f: 55, w: 20, g: 20 }, time: 13, age: 3, r: 0.2,
          bonus: { cav: 12, har: 8, sie: 8, bld: 3 }, desc: 'Răzeș încercat în multe lupte.' },
  vit:  { name: 'Viteaz', line: 'vit', tier: 1, civ: 'val', cls: 'inf', hp: 70, atk: 10, rng: 0, rof: 1.5, ma: 2, pa: 1, spd: 1.0, los: 5, cost: { f: 65, g: 35 }, time: 14, age: 2, r: 0.2, bonus: { bld: 3 },
          desc: 'Oșteanul ales al lui Vlad: lovește repede și greu.' },
  vit2: { name: 'Viteaz de elită', line: 'vit', tier: 2, civ: 'val', cls: 'inf', hp: 85, atk: 13, rng: 0, rof: 1.5, ma: 3, pa: 2, spd: 1.0, los: 5, cost: { f: 65, g: 35 }, time: 14, age: 3, r: 0.2, bonus: { bld: 4 },
          desc: 'Garda lui Vlad.' },
  hus:  { name: 'Husar', line: 'hus', tier: 1, civ: 'ung', cls: 'cav', hp: 75, atk: 7, rng: 0, rof: 1.8, ma: 0, pa: 3, spd: 1.65, los: 7, cost: { f: 80, g: 20 }, time: 15, age: 2, r: 0.3,
          bonus: { arc: 5, har: 5, sie: 10, mon: 6, gun: 5 }, desc: 'Călăreț ușor maghiar, cel mai rapid de pe câmp.' },
  hus2: { name: 'Husar de elită', line: 'hus', tier: 2, civ: 'ung', cls: 'cav', hp: 95, atk: 8, rng: 0, rof: 1.8, ma: 0, pa: 4, spd: 1.65, los: 8, cost: { f: 80, g: 20 }, time: 15, age: 3, r: 0.3,
          bonus: { arc: 6, har: 6, sie: 12, mon: 6, gun: 6 }, desc: 'Husarii lui Matia Corvin.' },
  cpl:  { name: 'Cavaler polonez', line: 'cpl', tier: 1, civ: 'pol', cls: 'cav', hp: 112, atk: 11, rng: 0, rof: 1.9, ma: 3, pa: 3, spd: 1.3, los: 5, cost: { f: 75, g: 100 }, time: 20, age: 2, r: 0.3,
          desc: 'Cavaler greu, în zale și armură de plăci.' },
  cpl2: { name: 'Cavaler polonez de elită', line: 'cpl', tier: 2, civ: 'pol', cls: 'cav', hp: 138, atk: 13, rng: 0, rof: 1.9, ma: 3, pa: 4, spd: 1.3, los: 6, cost: { f: 75, g: 100 }, time: 20, age: 3, r: 0.3,
          desc: 'Floarea cavaleriei polone.' },
  ien:  { name: 'Ienicer', line: 'ien', tier: 1, civ: 'oto', cls: 'gun', hp: 45, atk: 15, rng: 6, rof: 3.2, ma: 1, pa: 1, spd: 0.9, los: 7, cost: { f: 45, g: 48 }, time: 18, age: 2, r: 0.2, bonus: { inf: 8, cav: 3 },
          proj: 'bullet', desc: 'Garda sultanului, cu pușcă. Trage de departe și greu.' },
  ien2: { name: 'Ienicer de elită', line: 'ien', tier: 2, civ: 'oto', cls: 'gun', hp: 55, atk: 17, rng: 7, rof: 3.2, ma: 1, pa: 2, spd: 0.9, los: 8, cost: { f: 45, g: 48 }, time: 18, age: 3, r: 0.2, bonus: { inf: 10, cav: 4 },
          proj: 'bullet', desc: 'Veteranii de la Constantinopol.' },
  nog:  { name: 'Arcaș nogai', line: 'nog', tier: 1, civ: 'tat', cls: 'har', hp: 65, atk: 6, rng: 5, rof: 1.8, ma: 0, pa: 2, spd: 1.55, los: 7, cost: { f: 40, w: 30, g: 45 }, time: 16, age: 2, r: 0.3,
          proj: 'arrow', desc: 'Arcaș călare din stepă, iute și greu de prins.' },
  nog2: { name: 'Arcaș nogai de elită', line: 'nog', tier: 2, civ: 'tat', cls: 'har', hp: 80, atk: 7, rng: 5.5, rof: 1.8, ma: 0, pa: 3, spd: 1.55, los: 8, cost: { f: 40, w: 30, g: 45 }, time: 16, age: 3, r: 0.3,
          proj: 'arrow', desc: 'Hoarda hanului.' }
};
// liniile de upgrade, în ordine: G.LINES.mil = ['mil', 'mil2', ...]
G.LINES = {};
Object.keys(G.UNITS).forEach(function (t) { var d = G.UNITS[t]; if (d.line) (G.LINES[d.line] || (G.LINES[d.line] = []))[d.tier - 1] = t; });
G.MIL_TYPES = Object.keys(G.UNITS).filter(function (t) { var c = G.UNITS[t].cls; return c !== 'vil' && c !== 'car' && c !== 'mon'; });

// atk.n = câte săgeți deodată; gar = câți oameni încap înăuntru; key = clădire de care depinde victoria
G.GARR_FOOT = ['vil', 'inf', 'arc', 'skr', 'gun', 'mon'];
G.BLDS = {
  cetate:    { name: { def: 'Cetatea de Scaun', ung: 'Cetatea regală', pol: 'Castelul regal', oto: 'Saraiul', tat: 'Tabăra hanului' }, n: 4, hp: 2400, cost: { w: 275, s: 100 }, time: 150, age: 2, los: 8, pop: 5,
               drop: 'fwgs', atk: { atk: 5, rng: 6.5, rof: 2 }, gar: 15, garr: G.GARR_FOOT, key: true, train: ['vil', 'hero'],
               tech: ['feudal', 'castle', 'imperial', 'renastere', 'razboi', 'roaba', 'carut', 'straja'], desc: 'Inima țării. Aici duci orice resursă și faci țărani. Adăpostește 15 oameni.' },
  casa:      { name: { def: 'Casă', tat: 'Iurtă' }, n: 2, hp: 550, cost: { w: 25 }, time: 12, age: 0, los: 2, pop: 5, desc: '+5 locuri pentru oameni.' },
  joagar:    { name: 'Joagăr', n: 2, hp: 600, cost: { w: 100 }, time: 15, age: 0, los: 3, drop: 'w', tech: ['topor', 'ferastrau', 'ferastrau2'], desc: 'Aici duc țăranii lemnul. Pune-l lângă pădure.' },
  mina:      { name: 'Mină', n: 2, hp: 600, cost: { w: 100 }, time: 15, age: 0, los: 3, drop: 'gs', tech: ['tarnacop', 'puturi'], desc: 'Aici duc țăranii aurul și piatra.' },
  moara:     { name: 'Moară', n: 2, hp: 600, cost: { w: 100 }, time: 18, age: 0, los: 3, drop: 'f', tech: ['jug', 'plug', 'rotatie'], desc: 'Aici duc țăranii hrana. Trebuie pentru ogoare.' },
  ogor:      { name: 'Ogor', n: 3, hp: 300, cost: { w: 60 }, time: 10, age: 0, los: 1, walk: true, farm: true, need: 'moara', desc: 'Hrană pentru un țăran. Se termină după o vreme; moara îl reînnoiește pe lemne (singur, dacă ai lemne).' },
  cazarma:   { name: 'Cazarmă', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 0, los: 4, train: ['mil', 'spr'],
               tech: ['up_mil2', 'up_mil3', 'up_mil4', 'up_mil5', 'up_spr2', 'up_spr3', 'mars'], desc: 'Pedestrași.' },
  palisada:  { name: 'Gard de pari', n: 1, hp: 250, cost: { w: 2 }, time: 3, age: 0, los: 1, wall: 'pal', desc: 'Gard de lemn. Tras cu mouse-ul, pui un șir întreg.' },
  poartal:   { name: 'Poartă de lemn', n: 1, hp: 400, cost: { w: 30 }, time: 10, age: 0, los: 2, wall: 'pal', gate: true, desc: 'Se deschide doar pentru ai tăi. Se poate pune peste gard.' },
  poligon:   { name: 'Poligon', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 1, los: 4, train: ['skr', 'arc', 'har', 'gun'],
               tech: ['up_skr2', 'up_arc2', 'up_arc3', 'up_har2', 'up_gun2', 'inel'], desc: 'Arcași, plăieși, arcași călare și pușcași.' },
  grajd:     { name: 'Grajd', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 1, los: 4, train: ['lcv', 'kni'],
               tech: ['up_lcv2', 'up_lcv3', 'up_kni2', 'up_kni3', 'potcoave'], desc: 'Călăreți.' },
  fierarie:  { name: 'Fierărie', n: 3, hp: 1200, cost: { w: 150 }, time: 25, age: 1, los: 3,
               tech: ['forja', 'fonta', 'furnal', 'zale1', 'zale2', 'zale3', 'sab1', 'sab2', 'sab3', 'pene', 'varf', 'bratara', 'vesta1', 'vesta2', 'vesta3'], desc: 'Arme și armuri mai bune.' },
  port:      { name: { def: 'Port', mol: 'Schela', val: 'Schela' }, n: 3, hp: 1800, cost: { w: 150 }, time: 35, age: 0, los: 6, dock: true, drop: 'n', train: ['pesc', 'tra', 'gal', 'foc'], tech: ['up_gal2', 'carena'],
               desc: 'Se pune pe apă, lângă mal. Bărci de pescuit, corăbii de luptă și de transport.' },
  targ:      { name: { def: 'Târg', oto: 'Bazar', tat: 'Bazar' }, n: 3, hp: 1600, cost: { w: 175 }, time: 30, age: 1, los: 4, market: true, train: ['car'], tech: ['caravana', 'breasla'],
               desc: 'Vinzi și cumperi resurse pe aur. Carele de negoț aduc aur de la alt târg.' },
  turn:      { name: 'Turn de pază', n: 2, hp: 700, cost: { w: 25, s: 125 }, time: 30, age: 1, los: 8, atk: { atk: 5, rng: 7, rof: 2 }, gar: 5, garr: G.GARR_FOOT,
               desc: 'Trage singur cu săgeți. Oamenii adăpostiți înăuntru adaugă săgeți.' },
  zid:       { name: 'Zid de piatră', n: 1, hp: 1600, cost: { s: 5 }, time: 6, age: 1, los: 2, wall: 'zid', desc: 'Zid gros. Tras cu mouse-ul, pui un șir întreg.' },
  poarta:    { name: 'Poartă de piatră', n: 1, hp: 2400, cost: { s: 30 }, time: 20, age: 1, los: 3, wall: 'zid', gate: true, desc: 'Se deschide doar pentru ai tăi. Se poate pune peste zid.' },
  manastire: { name: { def: 'Mănăstire', ung: 'Biserică', pol: 'Biserică', oto: 'Geamie', tat: 'Geamie' }, n: 3, hp: 1600, cost: { w: 175 }, time: 35, age: 1, los: 5, heal: 6, train: ['mon'],
               tech: ['ierburi', 'credinta'], relics: true, desc: 'Vindecă oamenii din jur. Aici se fac călugări și se păstrează moaștele, care dau aur.' },
  universitate: { name: { def: 'Universitate', oto: 'Medrese', tat: 'Medrese' }, n: 3, hp: 2100, cost: { w: 200 }, time: 45, age: 2, los: 4,
               tech: ['zidarie', 'arhitectura', 'fortificatii', 'balistica', 'chimie', 'inginerie', 'turn2', 'turn3', 'turn4', 'ziduri', 'tiparnita'], desc: 'Științele: clădiri mai tari, turnuri, praf de pușcă.' },
  atelier:   { name: 'Atelier de asediu', n: 3, hp: 1500, cost: { w: 200 }, time: 30, age: 2, los: 4, train: ['ram', 'cat', 'can'], tech: ['up_ram2', 'up_cat2', 'up_can2'],
               desc: 'Berbeci, catapulte și bombarde.' },
  fortareata: { name: { def: 'Fortăreață', oto: 'Hisar', tat: 'Cetatea hanului' }, n: 4, hp: 4800, cost: { s: 650 }, time: 120, age: 2, los: 10, pop: 20, atk: { atk: 9, rng: 8, rof: 2, n: 3 },
               gar: 20, garr: G.GARR_FOOT.concat(['cav', 'har']), key: true, train: ['uniq', 'treb'], tech: ['elite', 'ut1', 'ut2', 'recrutare'],
               desc: 'Cetate de piatră. Face unitatea unică și trebușete, are tehnologiile civilizației tale. Adăpostește 20 de oameni.' },
  minune:    { name: { def: 'Minunea', mol: 'Mănăstirea Putna', val: 'Mănăstirea Curtea de Argeș', ung: 'Castelul Huniazilor', pol: 'Castelul Wawel', oto: 'Hagia Sofia', tat: 'Palatul Hanului' },
               n: 5, hp: 4800, cost: { f: 1000, w: 1000, g: 1000, s: 1000 }, time: 300, age: 3, los: 6, wonder: true,
               desc: 'Minunea civilizației tale. Dacă o ții în picioare 5 minute, câștigi (la victoria prin minune).' }
};
G.BLDS.capcana = { name: 'Copaci tăiați', n: 1, hp: 120, cost: {}, time: 12, age: 0, los: 3, walk: true, trap: true, desc: 'Copacii tăiați pe jumătate: când trece dușmanul, cad peste el.' };
G.BUILD_ECO = ['casa', 'joagar', 'mina', 'moara', 'ogor', 'port', 'targ', 'manastire', 'universitate', 'cetate', 'minune'];
G.BUILD_MIL = ['cazarma', 'poligon', 'grajd', 'fierarie', 'atelier', 'fortareata', 'turn', 'palisada', 'poartal', 'zid', 'poarta'];
G.BUILD_LIST = G.BUILD_ECO.concat(G.BUILD_MIL);
G.BLD_ARMOR = { m: 2, p: 8 };

// fx: efectele unei tehnologii sau ale unei civilizații
//   { u: {cls|t|line}, s: stat, add|mul }  oamenii (s: hp atk rng ma pa spd los rof cap heal splash bld)
//   { b: [tipuri] | 'all' | 'walls', s: hp|atk|rng|los|rof|arm, add|mul }  clădirile
//   { gather: tree|gold|stone|farm|sheep|berry, mul }   { cost: {cls|t|line}, res?: 'g', mul }
//   { train: [clădiri] | 'mil', mul }  (viteza)   { research: mul }   { heal: mul } (vindecarea)
// req = alte tehnologii cerute; up = [din, în] (linia de upgrade); needB = clădiri cerute pentru epocă
var _INF = { cls: ['inf'] }, _CAV = { cls: ['cav'] }, _RNG = { cls: ['arc', 'skr', 'har'] }, _TOW = ['cetate', 'turn', 'fortareata'];
G.TECHS = {
  // Cetatea de Scaun
  feudal:    { name: 'Epoca Feudală', icon: '🛡️', age: 0, ageUp: 1, cost: { f: 500 }, time: 45, needB: { n: 2, of: ['cazarma', 'joagar', 'mina', 'moara'] },
               desc: 'Arcași, plăieși, călăreți, fierărie, târg, turnuri, ziduri de piatră.' },
  castle:    { name: 'Epoca Cetăților', icon: '🏰', age: 1, ageUp: 2, cost: { f: 800, g: 200 }, time: 60, needB: { n: 2, of: ['poligon', 'grajd', 'fierarie', 'targ'] },
               desc: 'Fortăreața și unitatea unică, universitatea, asediul, călăreții grei.' },
  imperial:  { name: 'Epoca Imperială', icon: '👑', age: 2, ageUp: 3, cost: { f: 1000, g: 800 }, time: 75, needB: { all: ['universitate'], any: ['fortareata', 'atelier'] },
               desc: 'Minunea, trebușetul, praful de pușcă, cele mai bune armuri.' },
  renastere: { name: 'Epoca Renașterii', icon: '📜', age: 3, ageUp: 4, cost: { f: 1500, g: 1200 }, time: 90, req: ['chimie'],
               desc: 'Campioni, muschetari, cavaleri de elită, tunuri de asediu, turnuri de tunuri.' },
  razboi:    { name: 'Războiul de țesut', icon: '🧵', age: 0, cost: { g: 50 }, time: 15, desc: 'Țăranii: +15 viață și +1 armură.',
               fx: [{ u: { t: ['vil'] }, s: 'hp', add: 15 }, { u: { t: ['vil'] }, s: 'ma', add: 1 }, { u: { t: ['vil'] }, s: 'pa', add: 1 }] },
  roaba:     { name: 'Roabă', icon: '🛒', age: 1, cost: { f: 175, w: 50 }, time: 25, desc: 'Țăranii merg cu 10% mai repede și duc mai mult.',
               fx: [{ u: { t: ['vil'] }, s: 'spd', mul: 1.1 }, { u: { t: ['vil'] }, s: 'cap', add: 5 }] },
  carut:     { name: 'Căruță', icon: '🛞', age: 2, cost: { f: 300, w: 200 }, time: 40, req: ['roaba'], desc: 'Țăranii merg încă 10% mai repede și duc și mai mult.',
               fx: [{ u: { t: ['vil'] }, s: 'spd', mul: 1.1 }, { u: { t: ['vil'] }, s: 'cap', add: 5 }] },
  straja:    { name: 'Paza de noapte', icon: '🔥', age: 1, cost: { f: 75 }, time: 15, desc: 'Clădirile văd cu 4 pătrățele mai departe.', fx: [{ b: 'all', s: 'los', add: 4 }] },
  // Joagăr, Mină, Moară
  topor:     { name: 'Topor dublu', icon: '🪓', age: 1, cost: { f: 100, w: 50 }, time: 20, desc: '+20% lemn.', fx: [{ gather: 'tree', mul: 1.2 }] },
  ferastrau: { name: 'Ferăstrău', icon: '🪚', age: 2, cost: { f: 150, w: 100 }, time: 30, req: ['topor'], desc: '+20% lemn.', fx: [{ gather: 'tree', mul: 1.2 }] },
  ferastrau2: { name: 'Ferăstrău cu două mânere', icon: '🪚', age: 3, cost: { f: 300, w: 200 }, time: 40, req: ['ferastrau'], desc: '+10% lemn.', fx: [{ gather: 'tree', mul: 1.1 }] },
  tarnacop:  { name: 'Târnăcop', icon: '⛏️', age: 1, cost: { f: 100, w: 75 }, time: 20, desc: '+15% aur și piatră.', fx: [{ gather: 'gold', mul: 1.15 }, { gather: 'stone', mul: 1.15 }] },
  puturi:    { name: 'Puțuri adânci', icon: '🕳️', age: 2, cost: { f: 200, w: 150 }, time: 30, req: ['tarnacop'], desc: '+15% aur și piatră.', fx: [{ gather: 'gold', mul: 1.15 }, { gather: 'stone', mul: 1.15 }] },
  jug:       { name: 'Jug de boi', icon: '🐂', age: 1, cost: { f: 75, w: 75 }, time: 20, desc: '+15% hrană de pe ogoare.', fx: [{ gather: 'farm', mul: 1.15 }] },
  plug:      { name: 'Plug greu', icon: '🌱', age: 2, cost: { f: 125, w: 125 }, time: 30, req: ['jug'], desc: '+15% hrană de pe ogoare.', fx: [{ gather: 'farm', mul: 1.15 }] },
  rotatie:   { name: 'Rotația culturilor', icon: '🌾', age: 3, cost: { f: 250, w: 250 }, time: 40, req: ['plug'], desc: '+15% hrană de pe ogoare.', fx: [{ gather: 'farm', mul: 1.15 }] },
  // Fierărie
  forja:     { name: 'Forja', icon: '⚒️', age: 1, cost: { f: 150 }, time: 30, desc: 'Pedestrașii și călăreții: +1 atac.', fx: [{ u: { cls: ['inf', 'cav'] }, s: 'atk', add: 1 }] },
  fonta:     { name: 'Fonta', icon: '⚒️', age: 2, cost: { f: 220, g: 120 }, time: 40, req: ['forja'], desc: 'Pedestrașii și călăreții: +1 atac.', fx: [{ u: { cls: ['inf', 'cav'] }, s: 'atk', add: 1 }] },
  furnal:    { name: 'Furnalul', icon: '⚒️', age: 3, cost: { f: 275, g: 225 }, time: 50, req: ['fonta'], desc: 'Pedestrașii și călăreții: +2 atac.', fx: [{ u: { cls: ['inf', 'cav'] }, s: 'atk', add: 2 }] },
  zale1:     { name: 'Zale de solzi', icon: '🛡️', age: 1, cost: { f: 100 }, time: 25, desc: 'Pedestrașii: +1 armură la tot.', fx: [{ u: _INF, s: 'ma', add: 1 }, { u: _INF, s: 'pa', add: 1 }] },
  zale2:     { name: 'Cămașă de zale', icon: '🛡️', age: 2, cost: { f: 200, g: 100 }, time: 35, req: ['zale1'], desc: 'Pedestrașii: +1 armură la tot.', fx: [{ u: _INF, s: 'ma', add: 1 }, { u: _INF, s: 'pa', add: 1 }] },
  zale3:     { name: 'Armură de plăci', icon: '🛡️', age: 3, cost: { f: 300, g: 150 }, time: 45, req: ['zale2'], desc: 'Pedestrașii: +1 armură, +2 contra săgeților.', fx: [{ u: _INF, s: 'ma', add: 1 }, { u: _INF, s: 'pa', add: 2 }] },
  sab1:      { name: 'Șabracă de solzi', icon: '🐴', age: 1, cost: { f: 150 }, time: 25, desc: 'Călăreții: +1 armură la tot.', fx: [{ u: _CAV, s: 'ma', add: 1 }, { u: _CAV, s: 'pa', add: 1 }] },
  sab2:      { name: 'Șabracă de zale', icon: '🐴', age: 2, cost: { f: 250, g: 150 }, time: 35, req: ['sab1'], desc: 'Călăreții: +1 armură la tot.', fx: [{ u: _CAV, s: 'ma', add: 1 }, { u: _CAV, s: 'pa', add: 1 }] },
  sab3:      { name: 'Șabracă de plăci', icon: '🐴', age: 3, cost: { f: 350, g: 200 }, time: 45, req: ['sab2'], desc: 'Călăreții: +1 armură, +2 contra săgeților.', fx: [{ u: _CAV, s: 'ma', add: 1 }, { u: _CAV, s: 'pa', add: 2 }] },
  pene:      { name: 'Săgeți cu pene', icon: '🪶', age: 1, cost: { f: 100, g: 50 }, time: 25, desc: 'Arcașii, plăieșii, turnurile și cetățile: +1 atac și bat mai departe.',
               fx: [{ u: _RNG, s: 'atk', add: 1 }, { u: _RNG, s: 'rng', add: 0.5 }, { b: _TOW, s: 'atk', add: 1 }, { b: _TOW, s: 'rng', add: 0.5 }] },
  varf:      { name: 'Vârfuri de fier', icon: '🎯', age: 2, cost: { f: 200, g: 100 }, time: 35, req: ['pene'], desc: 'Arcașii, plăieșii, turnurile și cetățile: +1 atac și bat mai departe.',
               fx: [{ u: _RNG, s: 'atk', add: 1 }, { u: _RNG, s: 'rng', add: 0.5 }, { b: _TOW, s: 'atk', add: 1 }, { b: _TOW, s: 'rng', add: 0.5 }] },
  bratara:   { name: 'Brățara arcașului', icon: '🏹', age: 3, cost: { f: 300, g: 200 }, time: 45, req: ['varf'], desc: 'Arcașii, plăieșii, turnurile și cetățile: +1 atac și bat mai departe.',
               fx: [{ u: _RNG, s: 'atk', add: 1 }, { u: _RNG, s: 'rng', add: 0.5 }, { b: _TOW, s: 'atk', add: 1 }, { b: _TOW, s: 'rng', add: 0.5 }] },
  vesta1:    { name: 'Vestă căptușită', icon: '🦺', age: 1, cost: { f: 100 }, time: 25, desc: 'Trăgătorii: +1 armură la tot.', fx: [{ u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'ma', add: 1 }, { u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'pa', add: 1 }] },
  vesta2:    { name: 'Vestă de piele', icon: '🦺', age: 2, cost: { f: 150, g: 150 }, time: 35, req: ['vesta1'], desc: 'Trăgătorii: +1 armură la tot.', fx: [{ u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'ma', add: 1 }, { u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'pa', add: 1 }] },
  vesta3:    { name: 'Vestă cu inele', icon: '🦺', age: 3, cost: { f: 250, g: 250 }, time: 45, req: ['vesta2'], desc: 'Trăgătorii: +1 armură, +2 contra săgeților.', fx: [{ u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'ma', add: 1 }, { u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'pa', add: 2 }] },
  // Universitate
  zidarie:   { name: 'Zidărie', icon: '🧱', age: 2, cost: { w: 175, s: 150 }, time: 40, desc: 'Clădirile: +10% viață și +1 armură.', fx: [{ b: 'all', s: 'hp', mul: 1.1 }, { b: 'all', s: 'arm', add: 1 }] },
  arhitectura: { name: 'Arhitectură', icon: '📐', age: 3, cost: { w: 300, s: 200 }, time: 50, req: ['zidarie'], desc: 'Clădirile: încă +10% viață și +1 armură.', fx: [{ b: 'all', s: 'hp', mul: 1.1 }, { b: 'all', s: 'arm', add: 1 }] },
  fortificatii: { name: 'Fortificații', icon: '🏯', age: 2, cost: { f: 100, w: 200 }, time: 35, desc: 'Turnurile, cetatea și fortăreața bat cu 1 pătrățel mai departe.', fx: [{ b: _TOW, s: 'rng', add: 1 }] },
  balistica: { name: 'Balistică', icon: '🎯', age: 2, cost: { w: 300, g: 175 }, time: 40, desc: 'Trăgătorii, turnurile și cetățile trag cu 10–15% mai repede.',
               fx: [{ u: { cls: ['arc', 'skr', 'har', 'gun'] }, s: 'rof', mul: 0.9 }, { b: _TOW, s: 'rof', mul: 0.85 }] },
  chimie:    { name: 'Chimie', icon: '⚗️', age: 3, cost: { f: 300, g: 200 }, time: 50, desc: 'Praful de pușcă: pușcași, bombarde, turnuri de tunuri. Arcașii și asediul: +1 atac.',
               fx: [{ u: { cls: ['arc', 'skr', 'har'] }, s: 'atk', add: 1 }, { u: { line: ['cat'], t: ['treb'] }, s: 'atk', add: 1 }, { b: _TOW, s: 'atk', add: 1 }] },
  inginerie: { name: 'Inginerie de asediu', icon: '⚙️', age: 3, cost: { w: 200, g: 150 }, time: 45, desc: 'Asediul: +1 bătaie și +20% contra clădirilor.',
               fx: [{ u: { line: ['cat', 'can'], t: ['treb'] }, s: 'rng', add: 1 }, { u: { cls: ['sie'] }, s: 'bld', mul: 1.2 }] },
  turn2:     { name: 'Turn de strajă', icon: '🗼', age: 2, cost: { f: 100, w: 250 }, time: 30, desc: 'Turnurile: +60% viață, +2 atac, +1 bătaie.',
               fx: [{ b: ['turn'], s: 'hp', mul: 1.6 }, { b: ['turn'], s: 'atk', add: 2 }, { b: ['turn'], s: 'rng', add: 1 }] },
  turn3:     { name: 'Donjon', icon: '🏰', age: 3, cost: { f: 500, w: 350 }, time: 50, req: ['turn2'], desc: 'Turnurile: +40% viață, +2 atac, mai departe.',
               fx: [{ b: ['turn'], s: 'hp', mul: 1.4 }, { b: ['turn'], s: 'atk', add: 2 }, { b: ['turn'], s: 'rng', add: 0.5 }] },
  turn4:     { name: 'Turn de tunuri', icon: '💣', age: 4, cost: { g: 400, s: 300 }, time: 60, req: ['turn3', 'chimie'], desc: 'Turnurile trag cu ghiulele: lovesc greu oameni și clădiri.',
               fx: [{ b: ['turn'], s: 'atk', add: 18 }, { b: ['turn'], s: 'rof', mul: 2 }] },
  ziduri:    { name: 'Ziduri întărite', icon: '🧱', age: 3, cost: { f: 200, s: 100 }, time: 40, desc: 'Zidurile, gardurile și porțile: +80% viață.', fx: [{ b: 'walls', s: 'hp', mul: 1.8 }] },
  tiparnita: { name: 'Tiparnița', icon: '📖', age: 4, cost: { f: 500, g: 300 }, time: 50, desc: 'Ca la Târgoviște, în 1508: toate tehnologiile se cercetează cu 30% mai repede.', fx: [{ research: 1.43 }] },
  // Mănăstire, Târg
  ierburi:   { name: 'Ierburi de leac', icon: '🌿', age: 1, cost: { g: 150 }, time: 25, desc: 'Vindecarea e de două ori mai rapidă.', fx: [{ heal: 2 }] },
  credinta:  { name: 'Credință', icon: '✝️', age: 2, cost: { g: 120 }, time: 30, desc: 'Călugării au viață dublă.', fx: [{ u: { t: ['mon'] }, s: 'hp', mul: 2 }] },
  caravana:  { name: 'Caravana', icon: '🐫', age: 2, cost: { f: 200, g: 200 }, time: 35, desc: 'Carele de negoț merg cu 50% mai repede.', fx: [{ u: { t: ['car'] }, s: 'spd', mul: 1.5 }] },
  breasla:   { name: 'Breasla negustorilor', icon: '⚖️', age: 3, cost: { f: 300, g: 200 }, time: 40, desc: 'La târg pierzi doar 15% când schimbi, nu 30%.' },
  // Cazarmă
  up_mil2:   { name: 'Oștean în zale', icon: '⬆️', age: 1, cost: { f: 100, g: 40 }, time: 30, up: ['mil', 'mil2'], desc: 'Oștenii devin oșteni în zale: +5 viață, +1 atac.' },
  up_mil3:   { name: 'Spadasin', icon: '⬆️', age: 2, cost: { f: 200, g: 65 }, time: 40, req: ['up_mil2'], up: ['mil2', 'mil3'], desc: 'Devin spadasini: +10 viață, +3 atac, armură.' },
  up_mil4:   { name: 'Spadasin greu', icon: '⬆️', age: 3, cost: { f: 300, g: 100 }, time: 45, req: ['up_mil3'], up: ['mil3', 'mil4'], desc: 'Devin spadasini grei: +2 atac, armură de plăci.' },
  up_mil5:   { name: 'Campion', icon: '⬆️', age: 4, cost: { f: 750, g: 350 }, time: 60, req: ['up_mil4'], up: ['mil4', 'mil5'], desc: 'Devin campioni: cel mai bun pedestraș.' },
  up_spr2:   { name: 'Pichier', icon: '⬆️', age: 2, cost: { f: 215, g: 90 }, time: 40, up: ['spr', 'spr2'], desc: 'Lăncierii devin pichieri: mai tari contra călăreților.' },
  up_spr3:   { name: 'Halebardier', icon: '⬆️', age: 3, cost: { f: 300, g: 600 }, time: 50, req: ['up_spr2'], up: ['spr2', 'spr3'], desc: 'Devin halebardieri.' },
  mars:      { name: 'Marș forțat', icon: '🥾', age: 2, cost: { f: 200 }, time: 30, desc: 'Pedestrașii merg cu 10% mai repede.', fx: [{ u: _INF, s: 'spd', mul: 1.1 }] },
  // Poligon
  up_skr2:   { name: 'Plăieș de elită', icon: '⬆️', age: 2, cost: { w: 230, g: 130 }, time: 40, up: ['skr', 'skr2'], desc: 'Plăieșii: +5 viață, +1 atac, mai departe.' },
  up_arc2:   { name: 'Arbaletier', icon: '⬆️', age: 2, cost: { f: 125, g: 75 }, time: 35, up: ['arc', 'arc2'], desc: 'Arcașii devin arbaletieri.' },
  up_arc3:   { name: 'Arbaletier greu', icon: '⬆️', age: 3, cost: { f: 350, g: 300 }, time: 45, req: ['up_arc2'], up: ['arc2', 'arc3'], desc: 'Devin arbaletieri grei.' },
  up_har2:   { name: 'Arcaș călare greu', icon: '⬆️', age: 3, cost: { f: 900, w: 500 }, time: 50, up: ['har', 'har2'], desc: 'Arcașii călare: +10 viață, +1 atac, armură.' },
  up_gun2:   { name: 'Muschetar', icon: '⬆️', age: 4, cost: { f: 600, g: 400 }, time: 50, up: ['gun', 'gun2'], desc: 'Pușcașii devin muschetari.' },
  inel:      { name: 'Inelul arcașului', icon: '💍', age: 2, cost: { f: 300, w: 250 }, time: 40, desc: 'Arcașii trag cu 15% mai repede.', fx: [{ u: { cls: ['arc', 'har'] }, s: 'rof', mul: 0.85 }] },
  // Grajd
  up_lcv2:   { name: 'Călăraș greu', icon: '⬆️', age: 2, cost: { f: 150, g: 50 }, time: 35, up: ['lcv', 'lcv2'], desc: 'Călărașii: +15 viață, +2 atac.' },
  up_lcv3:   { name: 'Călăraș de elită', icon: '⬆️', age: 3, cost: { f: 500, g: 600 }, time: 50, req: ['up_lcv2'], up: ['lcv2', 'lcv3'], desc: 'Cei mai buni călăreți ușori.' },
  up_kni2:   { name: 'Cavaler', icon: '⬆️', age: 3, cost: { f: 300, g: 300 }, time: 50, up: ['kni', 'kni2'], desc: 'Curtenii devin cavaleri: +20 viață, +2 atac.' },
  up_kni3:   { name: 'Cavaler de elită', icon: '⬆️', age: 4, cost: { f: 1300, g: 750 }, time: 70, req: ['up_kni2'], up: ['kni2', 'kni3'], desc: 'Cei mai grei călăreți.' },
  potcoave:  { name: 'Potcoave', icon: '🧲', age: 2, cost: { f: 150 }, time: 30, desc: 'Călăreții merg cu 10% mai repede.', fx: [{ u: { cls: ['cav', 'har'] }, s: 'spd', mul: 1.1 }] },
  // Atelier de asediu
  up_gal2:   { name: 'Galeră de război', icon: '⬆️', age: 2, cost: { f: 230, g: 100 }, time: 35, up: ['gal', 'gal2'], desc: 'Galerele: mai multă viață, trag mai departe și mai tare.' },
  carena:    { name: 'Carena', icon: '⚓', age: 1, cost: { f: 150, w: 150 }, time: 30, fx: [{ u: { cls: ['shp'] }, s: 'hp', mul: 1.15 }, { u: { cls: ['shp'] }, s: 'pa', add: 1 }], desc: 'Corăbiile: +15% viață și +1 armură la săgeți.' },
  up_ram2:   { name: 'Berbec greu', icon: '⬆️', age: 3, cost: { f: 300 }, time: 40, up: ['ram', 'ram2'], desc: 'Berbecii: mai multă viață și lovesc mai tare.' },
  up_cat2:   { name: 'Catapultă grea', icon: '⬆️', age: 3, cost: { f: 800, g: 500 }, time: 60, up: ['cat', 'cat2'], desc: 'Catapultele lovesc mai tare, mai departe, pe mai mulți.' },
  up_can2:   { name: 'Tun de asediu', icon: '⬆️', age: 4, cost: { f: 1000, g: 800 }, time: 60, up: ['can', 'can2'], desc: 'Bombardele devin tunuri de asediu.' },
  // Fortăreață (ut1 / ut2 / elite se aleg după civilizație)
  recrutare: { name: 'Recrutarea', icon: '📯', age: 3, cost: { f: 150, g: 150 }, time: 40, desc: 'Oștenii se fac cu 33% mai repede.', fx: [{ train: 'mil', mul: 1.33 }] },
  elite_mol: { name: 'Răzeși de elită', icon: '⭐', civ: 'mol', age: 3, cost: { f: 800, g: 500 }, time: 50, up: ['raz', 'raz2'], desc: 'Răzeșii devin răzeși de elită.' },
  elite_val: { name: 'Viteji de elită', icon: '⭐', civ: 'val', age: 3, cost: { f: 900, g: 550 }, time: 50, up: ['vit', 'vit2'], desc: 'Vitejii devin viteji de elită.' },
  elite_ung: { name: 'Husari de elită', icon: '⭐', civ: 'ung', age: 3, cost: { f: 800, g: 500 }, time: 50, up: ['hus', 'hus2'], desc: 'Husarii devin husari de elită.' },
  elite_pol: { name: 'Cavaleri polonezi de elită', icon: '⭐', civ: 'pol', age: 3, cost: { f: 1000, g: 700 }, time: 60, up: ['cpl', 'cpl2'], desc: 'Cavalerii polonezi devin de elită.' },
  elite_oto: { name: 'Ieniceri de elită', icon: '⭐', civ: 'oto', age: 3, cost: { f: 850, g: 750 }, time: 55, up: ['ien', 'ien2'], desc: 'Ienicerii devin de elită.' },
  elite_tat: { name: 'Nogai de elită', icon: '⭐', civ: 'tat', age: 3, cost: { f: 900, w: 500, g: 400 }, time: 55, up: ['nog', 'nog2'], desc: 'Arcașii nogai devin de elită.' },
  bucium:    { name: 'Buciumașii', icon: '📯', civ: 'mol', age: 2, cost: { f: 400, g: 300 }, time: 40, desc: 'Ca la Vaslui: aura lui Ștefan ține de două ori mai departe și dă +1 armură.' },
  oastea:    { name: 'Oastea cea mare', icon: '🌾', civ: 'mol', age: 3, cost: { f: 700, g: 500 }, time: 50, desc: 'Toată țara la oaste: țăranii au +4 atac și +15 viață.',
               fx: [{ u: { t: ['vil'] }, s: 'atk', add: 4 }, { u: { t: ['vil'] }, s: 'hp', add: 15 }] },
  noapte:    { name: 'Atacul de noapte', icon: '🌙', civ: 'val', age: 2, cost: { f: 400, g: 250 }, time: 40, desc: 'Ca la Târgoviște, în 1462: călăreții au +2 atac.', fx: [{ u: _CAV, s: 'atk', add: 2 }] },
  tepe:      { name: 'Pădurea de țepe', icon: '🪵', civ: 'val', age: 3, cost: { w: 600, g: 500 }, time: 50, desc: 'Lângă cetăți, fortărețe și turnuri, dușmanii lovesc cu 25% mai slab.' },
  armata:    { name: 'Armata Neagră', icon: '⚫', civ: 'ung', age: 2, cost: { f: 400, g: 300 }, time: 40, desc: 'Mercenarii lui Matia Corvin: pedestrașii și pușcașii costă cu 20% mai puțin aur.',
               fx: [{ cost: { cls: ['inf', 'gun'] }, res: 'g', mul: 0.8 }] },
  corbul:    { name: 'Corbul Huniazilor', icon: '🐦‍⬛', civ: 'ung', age: 3, cost: { f: 600, g: 450 }, time: 50, desc: 'Eroul are +100 viață, iar oastea din jurul lui se vindecă încet.',
               fx: [{ u: { t: ['hero'] }, s: 'hp', add: 100 }] },
  szlachta:  { name: 'Nobilimea', icon: '🛡️', civ: 'pol', age: 2, cost: { f: 400, g: 300 }, time: 40, desc: 'Cavalerii și cavalerii polonezi costă cu 25% mai puțin aur.',
               fx: [{ cost: { line: ['kni', 'cpl'] }, res: 'g', mul: 0.75 }] },
  inaripati: { name: 'Husarii înaripați', icon: '🪽', civ: 'pol', age: 3, cost: { f: 700, g: 500 }, time: 50, desc: 'Călărașii: +20 viață și +2 atac.',
               fx: [{ u: { line: ['lcv'] }, s: 'hp', add: 20 }, { u: { line: ['lcv'] }, s: 'atk', add: 2 }] },
  bronz:     { name: 'Tunurile de bronz', icon: '💥', civ: 'oto', age: 2, cost: { w: 450, g: 300 }, time: 40, desc: 'Catapultele, bombardele și trebușetele bat cu 2 pătrățele mai departe.',
               fx: [{ u: { line: ['cat', 'can'], t: ['treb'] }, s: 'rng', add: 2 }] },
  garda:     { name: 'Garda sultanului', icon: '🌙', civ: 'oto', age: 3, cost: { f: 600, g: 400 }, time: 50, desc: 'Ienicerii se fac cu 40% mai repede și bat mai departe.',
               fx: [{ u: { line: ['ien'] }, s: 'rng', add: 1 }, { train: ['fortareata'], mul: 1.4 }] },
  arcul:     { name: 'Arcul compozit', icon: '🏹', civ: 'tat', age: 2, cost: { w: 400, g: 300 }, time: 40, desc: 'Arcașii călare și nogaii: +1 atac și +1 bătaie.',
               fx: [{ u: { line: ['har', 'nog'] }, s: 'atk', add: 1 }, { u: { line: ['har', 'nog'] }, s: 'rng', add: 1 }] },
  jaful:     { name: 'Jaful', icon: '💰', civ: 'tat', age: 3, cost: { f: 500, g: 400 }, time: 45, desc: 'Primești un sfert din prețul fiecărei clădiri dușmane dărâmate.' }
};

G.RESD = {
  tree:  { name: 'Copac', r: 'w', amt: 100, block: true, rate: 0.5, lim: 2 },
  gold:  { name: 'Aur', r: 'g', amt: 800, block: true, rate: 0.4, lim: 3 },
  stone: { name: 'Piatră', r: 's', amt: 350, block: true, rate: 0.38, lim: 3 },
  berry: { name: 'Tufă de mure', r: 'f', amt: 125, block: true, rate: 0.42, lim: 2 },
  sheep: { name: 'Oaie', r: 'f', amt: 100, block: false, rate: 0.55, lim: 4 },
  relic: { name: 'Moaște', r: null, amt: 0, block: false, rate: 0, lim: 0, relic: true },
  // vânatul: întâi îl dobori (hp), apoi îl jupoi (amt); cerbul fuge, mistrețul se apără, lupul atacă singur
  deer:  { name: 'Cerb', r: 'f', amt: 140, block: false, rate: 0.62, lim: 3, hunt: 1, hp: 5, spd: 2.0, flee: 1 },
  boar:  { name: 'Mistreț', r: 'f', amt: 340, block: false, rate: 0.62, lim: 6, hunt: 1, hp: 60, atk: 5, spd: 1.35 },
  wolf:  { name: 'Lup', r: 'f', amt: 40, block: false, rate: 0.5, lim: 2, hunt: 1, hp: 25, atk: 3, spd: 1.75, wild: 1 },
  fish:  { name: 'Pește', r: 'f', amt: 220, block: true, rate: 0.45, lim: 3, water: 1 },
  fishd: { name: 'Banc de pești', r: 'f', amt: 450, block: true, rate: 0.55, lim: 4, water: 1, deep: 1 }
};
G.FARM_RATE = 0.4;
G.FARM_FOOD = 300; // hrana unui ogor nou; +100 cu fiecare unealtă de la moară
G.RELIC_GOLD = 0.5; // aur pe secundă pentru fiecare moaște din mănăstire

G.FACTS = [
  'Ștefan cel Mare a domnit în Moldova 47 de ani, între 1457 și 1504.',
  'La Podul Înalt, lângă Vaslui, pe 10 ianuarie 1475, oastea Moldovei a învins armata lui Soliman Pașa. Era o ceață deasă.',
  'Se spune că la Vaslui buciumașii ascunși în pădure i-au păcălit pe otomani despre unde e oastea Moldovei.',
  'Papa Sixt al IV-lea l-a numit pe Ștefan „Atletul lui Hristos”.',
  'Mănăstirea Putna a fost ridicată de Ștefan între 1466 și 1469. Acolo e și îngropat.',
  'Tradiția spune că după fiecare luptă câștigată Ștefan a ridicat o biserică.',
  'În 1476, Cetatea Neamțului a rezistat asediului condus chiar de sultanul Mehmed al II-lea.',
  'Vlad Țepeș, vărul lui Ștefan, l-a ajutat cu oaste să ia tronul Moldovei în 1457.',
  'Iancu de Hunedoara i-a învins pe otomani la Belgrad, în 1456. De atunci, în toată lumea creștină bat clopotele la amiază.',
  'Regele Poloniei Ioan Albert a fost învins de Ștefan în Codrii Cosminului, în 1497.',
  'Ienicerii erau garda pedestră a sultanului, printre primii oșteni cu pușcă din Europa.',
  'Hanul Mengli Giray al Crimeii a fost când aliatul, când dușmanul Moldovei.',
  'Prima carte tipărită pe pământ românesc, Liturghierul lui Macarie, a apărut în 1508, în Țara Românească.',
  'Cetatea Albă și Chilia erau „cheile” Moldovei la Marea Neagră și la Dunăre.'
];

G.INTRO = 'Secolul al XV-lea. Între Carpați, Dunăre și Marea Neagră, șase țări se luptă pentru pământ, credință și glorie. ' +
  'Alege-ți poporul, strânge-ți țăranii, ridică cetăți, treci prin cinci epoci și condu-ți oastea la victorie.';

G.HELP_DESK = [
  ['🖱️', '<b>Clic stânga</b> pe un om sau o clădire: îl alegi. <b>Tras cu clic stânga</b>: alegi tot ce prinde pătratul (cu Shift adaugi). Dublu clic: toți de același fel de pe ecran.'],
  ['👉', '<b>Clic dreapta</b> dă ordinul: pe pământ merg, pe copac, mină sau oaie strâng, pe dușman atacă, pe o clădire neterminată construiesc. Cu o clădire aleasă, clic dreapta pune locul de adunare.'],
  ['🗺️', '<b>Mută harta</b>: ține apăsat clic dreapta și trage, Spațiu + clic stânga și trage, du mouse-ul la marginea ecranului sau folosește săgețile. Pe trackpad: două degete. <b>Zoom</b>: rotița, ciupit pe trackpad, PageUp/PageDown sau butoanele ＋ －.'],
  ['🔨', '<b>Construiești</b>: alegi un țăran, apeși clădirea (sau litera ei), apoi clic stânga pe hartă (cu Shift mai pui una). Clic dreapta renunță.'],
  ['⌨️', 'Butoanele de jos au litere: Q W E R T, A S D F G, Z X C V B. <b>H</b> = cetatea (de două ori te duce acolo). <b>Punct</b> = țăranul fără treabă. <b>Ctrl+1…9</b> salvezi un grup, <b>1…9</b> îl alegi. <b>Esc</b> renunți, <b>Delete</b> dărâmi, <b>P</b> pauză, <b>+/−</b> viteza, <b>Spațiu</b> ultimul atac.'],
  ['🏠', 'Fiecare casă îți dă 5 locuri pentru oameni. Fără case nu mai poți face oameni.'],
  ['⚔️', 'Lăncierii bat călăreții, călăreții bat arcașii și asediul, arcașii bat pedestrașii, plăieșii bat arcașii, berbecii și trebușetele bat zidurile.'],
  ['🔔', 'Când vin dușmanii, <b>Clopotul</b> din Cetate îi adăpostește pe țărani: cetatea trage cu mai multe săgeți. Clic dreapta cu oameni pe o cetate, turn sau fortăreață îi adăpostește.'],
  ['⭐', 'Fiecare erou are o <b>putere</b> (butonul din panou). Clădirile au <b>upgrade-uri</b>: oștenii se transformă când cercetezi treapta următoare.'],
  ['🧱', 'Zidurile se pun cu două clicuri: unde începe și unde se termină. Porțile se pun peste zid și se deschid doar pentru ai tăi.'],
  ['📋', '<b>Shift + clic dreapta</b> pune ordinul la coadă: mergi aici, apoi acolo; construiește trei case pe rând. Oștenii au <b>Patrulează</b> (dus-întors, atacând ce întâlnesc) și <b>atitudine</b>: Agresiv, Defensiv (se întorc la locul lor) sau Pe loc.'],
  ['🦌', '<b>Vânătoarea</b>: cerbii fug când sunt loviți, mistrețul se apără (trimite trei țărani deodată), lupii atacă oamenii singuri. Peștele de la mal îl prind țăranii; cel din larg, bărcile.'],
  ['⚓', '<b>Portul</b> se pune pe apă, lângă mal. Bărci de pescuit, galere, corăbii incendiare (bune contra galerelor) și de transport: alegi oamenii și atingi corabia ca să urce, apoi alegi corabia și atingi malul unde coboară.'],
  ['✨', 'Călugării vindecă și <b>convertesc</b>: clic dreapta pe un dușman și, după câteva clipe, trece de partea ta.'],
  ['💬', '<b>Enter</b> deschide caseta de mesaje: strigăte cu numere de la 1 la 12 (11 = Ha, ha, ha!) și coduri secrete. Clic pe un jucător din lista de sus: îi trimiți resurse.'],
  ['🏰', 'Câștigi când toți dușmanii sunt învinși: fără cetăți, fortărețe și țărani. La victoria prin minune, ține-ți minunea în picioare 5 minute; la Regele dealului, ține monumentul din mijloc 10 minute.']
];
G.HELP = [
  ['👆', 'Atinge un om ca să-l alegi. Apoi atinge locul unde vrei să meargă, un copac, o mină sau un dușman.'],
  ['✋', 'Ține degetul apăsat pe hartă și apoi trage: alegi mai mulți oameni deodată.'],
  ['👆👆', 'Atinge de două ori un om: îi alegi pe toți de același fel de pe ecran.'],
  ['🗺️', 'Trage cu un deget ca să muți harta. Apropie sau depărtează două degete pentru zoom.'],
  ['🔨', 'Ca să construiești: alege un țăran, apasă o clădire jos, atinge locul pe hartă, apoi ✔.'],
  ['🏠', 'Fiecare casă îți dă 5 locuri pentru oameni. Fără case, nu mai poți face oameni.'],
  ['💤', 'Butoanele din dreapta: 💤 țăranii fără treabă, ⚔️ toată oastea, 🏰 cetatea ta.'],
  ['⚔️', 'Lăncierii bat călăreții, călăreții bat arcașii și asediul, arcașii bat pedestrașii, plăieșii bat arcașii, berbecii și trebușetele bat zidurile.'],
  ['🦌', 'Cerbii și mistreții se vânează; mistrețul se apără, trimite mai mulți țărani. Lupii atacă oamenii singuri.'],
  ['⚓', 'Portul se pune pe apă. Ca să urce oamenii pe corabia de transport, alege-i și atinge corabia; apoi alege corabia și atinge malul.'],
  ['🏰', 'Câștigi când toți dușmanii sunt învinși: fără cetăți, fortărețe și țărani.']
];

// ---------- calcule identice pe orice dispozitiv (pentru jocul online) ----------
// Online, jocul merge ca AoE2: fiecare calculator rulează aceeași simulare din aceleași comenzi.
// Math.sin, Math.cos, Math.atan2 și Math.hypot pot ieși diferit în ultima zecimală de la un browser la altul,
// iar diferența crește până desparte jocurile. Simularea folosește variantele de mai jos: doar adunări,
// înmulțiri, împărțiri și radical, care dau exact același rezultat peste tot.
// jucătorul de la acest calculator: 0 când joci singur; online, locul tău la masă.
// Doar interfața, desenul și mesajele îl folosesc; regulile jocului nu au voie (ar diferi de la un calculator la altul).
G.me = 0;
G.hyp = function (a, b) { return Math.sqrt(a * a + b * b); };
(function () {
  var PIO2_1 = 1.5707963267341256, PIO2_1T = 6.077100506506192e-11;
  function kSin(x) { var z = x * x; return x + x * z * (-1.66666666666666324348e-01 + z * (8.33333333332248946124e-03 + z * (-1.98412698298579493134e-04 + z * (2.75573137070700676789e-06 + z * (-2.50507602534068634195e-08 + z * 1.58969099521155010221e-10))))); }
  function kCos(x) { var z = x * x; return 1 - 0.5 * z + z * z * (4.16666666666666019037e-02 + z * (-1.38888888888741095749e-03 + z * (2.48015872894767294178e-05 + z * (-2.75573143513906633035e-07 + z * (2.08757232129817482790e-09 + z * -1.13596475577881948265e-11))))); }
  // x = n·π/2 + r, cu |r| ≤ π/4
  function red(x) { var n = Math.round(x * 0.6366197723675814); return [n & 3, (x - n * PIO2_1) - n * PIO2_1T]; }
  G.dsin = function (x) { var q = red(x), r = q[1]; return q[0] === 0 ? kSin(r) : q[0] === 1 ? kCos(r) : q[0] === 2 ? -kSin(r) : -kCos(r); };
  G.dcos = function (x) { var q = red(x), r = q[1]; return q[0] === 0 ? kCos(r) : q[0] === 1 ? -kSin(r) : q[0] === 2 ? -kCos(r) : kSin(r); };
  // atan pentru t ≥ 0: 1/t peste 1, apoi π/4 + atan((t−1)/(t+1)), apoi unghiul înjumătățit și seria
  function datan(t) {
    var inv = t > 1; if (inv) t = 1 / t;
    var add = 0; if (t > 0.41421356237309503) { t = (t - 1) / (t + 1); add = 0.7853981633974483; }
    var h = t / (1 + Math.sqrt(1 + t * t)), z = h * h, s = 0;
    for (var k = 25; k >= 1; k -= 2) s = 1 / k - z * s;
    var r = add + 2 * h * s;
    return inv ? 1.5707963267948966 - r : r;
  }
  G.datan2 = function (y, x) {
    if (x === 0 && y === 0) return 0;
    var a = x === 0 ? 1.5707963267948966 : datan(Math.abs(y) / Math.abs(x));
    if (x < 0) a = 3.141592653589793 - a;
    return y < 0 ? -a : a;
  };
})();
// numerele „la întâmplare” ale simulării: aceeași serie pe toate calculatoarele, pornită din seed și păstrată în salvare
G.rand = function () {
  var S = G.S, t = (S.rs = (S.rs + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
