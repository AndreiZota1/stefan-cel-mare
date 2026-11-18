// Datele jocului: unități, clădiri, tehnologii, resurse, texte.
var G = globalThis.G || (globalThis.G = {});

G.N = 72;          // harta are N x N pătrățele
G.MAXPOP = 80;

G.RES = ['f', 'w', 'g', 's'];
G.RES_NAME = { f: 'Hrană', w: 'Lemn', g: 'Aur', s: 'Piatră' };
G.RES_ICON = { f: '🌾', w: '🪵', g: '🪙', s: '🪨' };

G.AGES = ['Epoca Întunecată', 'Epoca Feudală', 'Epoca Castelelor'];

G.CIVS = {
  mol: { name: 'Moldova', color: '#2f6fd6', light: '#9cc2ff', dark: '#1a3d7c' },
  oto: { name: 'Imperiul Otoman', color: '#d23b2e', light: '#ffa093', dark: '#7c1d15' }
};

// first = secunda primului atac; every = pauza dintre atacuri; wave0/waveAdd = mărimea valurilor
G.DIFF = {
  usor:   { name: 'Ușor',   gather: 0.8, vil: 0.75, first: 720, every: 300, wave0: 4, waveAdd: 2, bonus: 0 },
  normal: { name: 'Normal', gather: 1.0, vil: 1.0,  first: 480, every: 230, wave0: 6, waveAdd: 3, bonus: 0 },
  greu:   { name: 'Greu',   gather: 1.2, vil: 1.1,  first: 360, every: 180, wave0: 7, waveAdd: 4, bonus: 150 }
};

// cls: vil (țăran), inf (infanterie), arc (arcași), cav (călăreți), sie (asediu)
// ma / pa = armură contra loviturilor de aproape / contra săgeților
G.UNITS = {
  vil:  { name: { mol: 'Țăran', oto: 'Țăran' }, cls: 'vil', hp: 25, atk: 3, rng: 0, rof: 2, ma: 0, pa: 0, spd: 0.9, los: 4, cost: { f: 50 }, time: 12, age: 0, r: 0.2, cap: 10 },
  mil:  { name: { mol: 'Oștean', oto: 'Ienicer' }, cls: 'inf', hp: 45, atk: 5, rng: 0, rof: 1.8, ma: 1, pa: 1, spd: 0.9, los: 4, cost: { f: 60, g: 20 }, time: 14, age: 0, r: 0.2,
          desc: 'Pedestraș cu sabie. Bun la toate.' },
  spr:  { name: { mol: 'Lăncier', oto: 'Azap' }, cls: 'inf', hp: 45, atk: 3, rng: 0, rof: 2, ma: 0, pa: 0, spd: 1.0, los: 4, cost: { f: 35, w: 25 }, time: 12, age: 1, r: 0.2, bonus: { cav: 15 },
          desc: 'Ieftin. Foarte tare contra călăreților.' },
  arc:  { name: { mol: 'Arcaș', oto: 'Arcaș otoman' }, cls: 'arc', hp: 30, atk: 4, rng: 4.5, rof: 2, ma: 0, pa: 0, spd: 0.95, los: 6, cost: { w: 25, g: 45 }, time: 13, age: 1, r: 0.2, bonus: { inf: 2 }, proj: 'arrow',
          desc: 'Trage de departe. Bun contra pedestrașilor.' },
  lcv:  { name: { mol: 'Călăraș', oto: 'Achingiu' }, cls: 'cav', hp: 60, atk: 5, rng: 0, rof: 2, ma: 0, pa: 2, spd: 1.5, los: 6, cost: { f: 80 }, time: 13, age: 1, r: 0.3, bonus: { arc: 4, sie: 8 },
          desc: 'Rapid. Vânează arcași, țărani și tunuri.' },
  kni:  { name: { mol: 'Curtean', oto: 'Spahiu' }, cls: 'cav', hp: 100, atk: 10, rng: 0, rof: 1.8, ma: 2, pa: 2, spd: 1.35, los: 5, cost: { f: 60, g: 75 }, time: 18, age: 2, r: 0.3,
          desc: 'Călăreț greu în armură. Cel mai puternic oștean.' },
  ram:  { name: { mol: 'Berbec' }, civ: 'mol', cls: 'sie', hp: 180, atk: 2, rng: 0, rof: 4, ma: 0, pa: 60, spd: 0.6, los: 3, cost: { w: 160, g: 75 }, time: 22, age: 2, r: 0.38, bonus: { bld: 110 }, onlyBld: true,
          desc: 'Dărâmă clădiri. Săgețile nu-i fac nimic, săbiile da.' },
  can:  { name: { oto: 'Tun' }, civ: 'oto', cls: 'sie', hp: 80, atk: 14, rng: 7, rof: 5, ma: 0, pa: 4, spd: 0.6, los: 8, cost: { w: 150, g: 120 }, time: 22, age: 2, r: 0.36, bonus: { bld: 45 }, proj: 'ball',
          desc: 'Tun otoman. Bate de departe în ziduri.' },
  hero: { name: { mol: 'Ștefan cel Mare', oto: 'Soliman Pașa' }, cls: 'cav', hero: true, hp: 320, atk: 14, rng: 0, rof: 1.6, ma: 4, pa: 4, spd: 1.35, los: 7, cost: { f: 200, g: 150 }, time: 30, age: 0, r: 0.32, regen: 1,
          desc: 'Erou. Oștenii din jurul lui lovesc mai tare. Se vindecă singur.' }
};
G.MIL_TYPES = ['mil', 'spr', 'arc', 'lcv', 'kni', 'ram', 'can', 'hero'];

G.BLDS = {
  cetate:    { name: { mol: 'Cetatea de Scaun', oto: 'Cetatea Otomană' }, n: 4, hp: 2400, cost: { w: 275, s: 100 }, time: 120, age: 9, los: 8, pop: 5, drop: 'fwgs',
               atk: { atk: 5, rng: 6.5, rof: 2 }, train: ['vil', 'hero'], tech: ['roaba', 'feudal', 'castle'] },
  casa:      { name: 'Casă', n: 2, hp: 550, cost: { w: 25 }, time: 12, age: 0, los: 2, pop: 5, desc: '+5 locuri pentru oameni.' },
  joagar:    { name: 'Joagăr', n: 2, hp: 600, cost: { w: 100 }, time: 15, age: 0, los: 3, drop: 'w', tech: ['topor'], desc: 'Aici duc țăranii lemnul. Pune-l lângă pădure.' },
  mina:      { name: 'Mină', n: 2, hp: 600, cost: { w: 100 }, time: 15, age: 0, los: 3, drop: 'gs', tech: ['tarnacop'], desc: 'Aici duc țăranii aurul și piatra.' },
  moara:     { name: 'Moară', n: 2, hp: 600, cost: { w: 100 }, time: 18, age: 0, los: 3, drop: 'f', tech: ['jug'], desc: 'Aici duc țăranii hrana. Trebuie pentru ogoare.' },
  ogor:      { name: 'Ogor', n: 3, hp: 300, cost: { w: 60 }, time: 10, age: 0, los: 1, walk: true, farm: true, need: 'moara', desc: 'Hrană fără sfârșit. Un țăran pe ogor.' },
  cazarma:   { name: 'Cazarmă', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 0, los: 4, train: ['mil', 'spr', 'ram', 'can'], desc: 'Oșteni, lăncieri și mașini de asediu.' },
  poligon:   { name: 'Poligon', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 1, los: 4, train: ['arc'], desc: 'Arcași.' },
  grajd:     { name: 'Grajd', n: 3, hp: 1200, cost: { w: 175 }, time: 25, age: 1, los: 4, train: ['lcv', 'kni'], desc: 'Călăreți.' },
  fierarie:  { name: 'Fierărie', n: 3, hp: 1200, cost: { w: 150 }, time: 25, age: 1, los: 3, tech: ['sabii', 'sageti', 'zale'], desc: 'Arme și armuri mai bune.' },
  turn:      { name: 'Turn de pază', n: 2, hp: 800, cost: { w: 25, s: 125 }, time: 30, age: 1, los: 8, atk: { atk: 6, rng: 7, rof: 2 }, desc: 'Trage singur cu săgeți în dușmani.' },
  manastire: { name: { mol: 'Mănăstire', oto: 'Geamie' }, n: 3, hp: 1500, cost: { w: 150, s: 100 }, time: 30, age: 1, los: 5, heal: 6, desc: 'Oamenii tăi din jur se vindecă.' }
};
G.BUILD_LIST = ['casa', 'joagar', 'mina', 'moara', 'ogor', 'cazarma', 'poligon', 'grajd', 'fierarie', 'turn', 'manastire'];
G.BLD_ARMOR = { m: 2, p: 8 };

G.TECHS = {
  roaba:    { name: 'Roabă', icon: '🛒', desc: 'Țăranii merg mai repede și duc mai mult.', cost: { f: 150, w: 50 }, time: 25, age: 1 },
  topor:    { name: 'Topor dublu', icon: '🪓', desc: '+20% lemn.', cost: { f: 100, w: 50 }, time: 20, age: 0 },
  tarnacop: { name: 'Târnăcop', icon: '⛏️', desc: '+20% aur și piatră.', cost: { f: 100, w: 75 }, time: 20, age: 0 },
  jug:      { name: 'Jug de boi', icon: '🐂', desc: '+20% hrană de pe ogoare.', cost: { f: 75, w: 75 }, time: 20, age: 0 },
  sabii:    { name: 'Săbii călite', icon: '⚔️', desc: '+1 atac pentru pedestrași și călăreți.', cost: { f: 150, g: 50 }, time: 30, age: 1 },
  sageti:   { name: 'Săgeți de fier', icon: '🎯', desc: '+1 atac pentru arcași, turnuri și cetate.', cost: { f: 100, g: 50 }, time: 30, age: 1 },
  zale:     { name: 'Zale', icon: '🛡️', desc: '+1 armură pentru pedestrași și călăreți.', cost: { f: 150, g: 75 }, time: 30, age: 1 },
  feudal:   { name: 'Epoca Feudală', icon: '⬆️', desc: 'Arcași, călăreți, turnuri, mănăstire.', cost: { f: 500 }, time: 45, age: 0, ageUp: 1 },
  castle:   { name: 'Epoca Castelelor', icon: '🏰', desc: 'Curteni, berbeci și tunuri.', cost: { f: 800, g: 200 }, time: 60, age: 1, ageUp: 2 }
};

G.RESD = {
  tree:  { name: 'Copac', r: 'w', amt: 100, block: true, rate: 0.5, lim: 2 },
  gold:  { name: 'Aur', r: 'g', amt: 800, block: true, rate: 0.4, lim: 3 },
  stone: { name: 'Piatră', r: 's', amt: 350, block: true, rate: 0.38, lim: 3 },
  berry: { name: 'Tufă de mure', r: 'f', amt: 125, block: true, rate: 0.42, lim: 2 },
  sheep: { name: 'Oaie', r: 'f', amt: 100, block: false, rate: 0.55, lim: 4 }
};
G.FARM_RATE = 0.4;

G.FACTS = [
  'Ștefan cel Mare a domnit în Moldova 47 de ani, între 1457 și 1504.',
  'La Podul Înalt, lângă Vaslui, pe 10 ianuarie 1475, oastea Moldovei a învins armata lui Soliman Pașa. Era o ceață deasă.',
  'Se spune că la Vaslui buciumașii ascunși în pădure i-au păcălit pe otomani despre unde e oastea Moldovei.',
  'Papa Sixt al IV-lea l-a numit pe Ștefan „Atletul lui Hristos”.',
  'Mănăstirea Putna a fost ridicată de Ștefan între 1466 și 1469. Acolo e și îngropat.',
  'Tradiția spune că după fiecare luptă câștigată Ștefan a ridicat o biserică.',
  'În 1476, Cetatea Neamțului a rezistat asediului condus chiar de sultanul Mehmed al II-lea.'
];

G.INTRO = 'Moldova, 1475. Oastea lui Soliman Pașa a trecut Dunărea și vine spre Suceava. ' +
  'Strânge-ți țăranii, ridică-ți oastea și apără Moldova. Câștigi dacă dărâmi Cetatea Otomană. Dacă îți cade Cetatea de Scaun, ai pierdut.';

G.HELP_DESK = [
  ['🖱️', '<b>Clic stânga</b> pe un om sau o clădire: îl alegi. <b>Tras cu clic stânga</b>: alegi tot ce prinde pătratul (cu Shift adaugi). Dublu clic: toți de același fel de pe ecran.'],
  ['👉', '<b>Clic dreapta</b> dă ordinul: pe pământ merg, pe copac, mină sau oaie strâng, pe dușman atacă, pe o clădire neterminată construiesc. Cu o clădire aleasă, clic dreapta pune locul de adunare.'],
  ['🗺️', '<b>Mută harta</b>: ține apăsat clic dreapta și trage, Spațiu + clic stânga și trage, du mouse-ul la marginea ecranului sau folosește săgețile. Pe trackpad: două degete. <b>Zoom</b>: rotița, ciupit pe trackpad, PageUp/PageDown sau butoanele ＋ －.'],
  ['🔨', '<b>Construiești</b>: alegi un țăran, apeși clădirea (sau litera ei), apoi clic stânga pe hartă (cu Shift mai pui una). Clic dreapta renunță.'],
  ['⌨️', 'Butoanele de jos au litere: Q W E R T, A S D F G, Z X C V B. <b>H</b> = cetatea (de două ori te duce acolo). <b>Punct</b> = țăranul fără treabă. <b>Ctrl+1…9</b> salvezi un grup, <b>1…9</b> îl alegi. <b>Esc</b> renunți, <b>Delete</b> dărâmi, <b>P</b> pauză, <b>+/−</b> viteza, <b>Spațiu</b> ultimul atac.'],
  ['🏠', 'Fiecare casă îți dă 5 locuri pentru oameni. Fără case nu mai poți face oameni.'],
  ['⚔️', 'Lăncierii bat călăreții, călăreții bat arcașii, arcașii bat pedestrașii.'],
  ['🏰', 'Câștigi dacă dărâmi Cetatea Otomană. Păzește-ți Cetatea de Scaun.']
];
G.HELP = [
  ['👆', 'Atinge un om ca să-l alegi. Apoi atinge locul unde vrei să meargă, un copac, o mină sau un dușman.'],
  ['✋', 'Ține degetul apăsat pe hartă și apoi trage: alegi mai mulți oameni deodată.'],
  ['👆👆', 'Atinge de două ori un om: îi alegi pe toți de același fel de pe ecran.'],
  ['🗺️', 'Trage cu un deget ca să muți harta. Apropie sau depărtează două degete pentru zoom.'],
  ['🔨', 'Ca să construiești: alege un țăran, apasă o clădire jos, atinge locul pe hartă, apoi ✔.'],
  ['🏠', 'Fiecare casă îți dă 5 locuri pentru oameni. Fără case, nu mai poți face oameni.'],
  ['💤', 'Butoanele din dreapta: 💤 țăranii fără treabă, ⚔️ toată oastea, 🏰 cetatea ta.'],
  ['⚔️', 'Lăncierii bat călăreții, călăreții bat arcașii, arcașii bat pedestrașii.'],
  ['🏰', 'Câștigi dacă dărâmi Cetatea Otomană. Păzește-ți Cetatea de Scaun.']
];
