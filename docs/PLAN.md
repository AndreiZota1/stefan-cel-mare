# Planul mare — „Ștefan cel Mare” 2.0

Scris pe 18.11.2026, după cererea lui Andrei: „fă-l extrem de bun… cu feudal, castle și epoca 4 și 5, cu upgrade-uri pe clădiri și oșteni, cu universități… inspiră-te din mai multe jocuri… cu povești, cu campanii, hărți noi”.

Fișierul ăsta e harta lucrului: ce facem, în ce ordine, cum verificăm. Bifele se pun pe măsură ce se termină.

---

## 1. Analiza: ce are jocul acum și ce lipsește

**Are:** 2 civilizații (Moldova, Otomani), 3 epoci, 9 tipuri de oameni, 12 clădiri, 9 tehnologii, o singură hartă (râul cu vaduri), un singur mod (tu contra calculatorului), 3 niveluri de greutate, grafică 3D pre-randată ca la AoE2, teren cu texturi foto, ceață, muzică, voci în română, controale AoE2 pe desktop și controale de telefon, salvare.

**Lipsește față de AoE2:**
- epocile 4 și 5;
- liniile de upgrade la oșteni (Oștean → Spadasin → Campion);
- tehnologiile pe trei trepte de la fierărie;
- Universitatea, Târgul, Fortăreața (castelul), Minunea, zidurile și porțile;
- adăpostirea în clădiri și clopotul de alarmă;
- moaștele, schimbul de resurse, vânătoarea;
- alte moduri de victorie (Minune, Regicid);
- mai mulți jucători (aliați, 2 contra 2);
- campanii cu povești, hărți diferite, statistici la final;
- arborele tehnologiilor.

**Ce merită luat din alte jocuri:**
- **Warcraft 3 și AoM:** eroi cu puteri active, cu reîncărcare (fiecare erou are una).
- **AoE3 și Rise of Nations:** 5 epoci, cu praful de pușcă în ultima.
- **They Are Billions și Stronghold:** modul Supraviețuire (valuri de atacatori) și asediile cu ziduri.
- **AoE2 și StarCraft:** campanii cu misiuni scriptate, dialoguri cu portrete și narațiune între misiuni pe o hartă pictată.
- **Total War:** bonusuri de moral. Aici devin aura eroului și teama lui Vlad.
- **AoE4:** clădirile care ard când sunt avariate; dărâmăturile rămân pe hartă.

---

## 2. Conținutul

### 2.1 Civilizațiile (6)

| Cod | Civilizația | Eroul | Unitatea unică | Avantaje | Stilul clădirilor |
|---|---|---|---|---|---|
| mol | Moldova | Ștefan cel Mare | Răzeș | Cetatea, fortărețele și turnurile bat mai departe; +10% lemn | mol |
| val | Țara Românească | Vlad Țepeș | Viteaz | Pedestrașii +15% viață; teama lui Vlad (lângă el, dușmanii lovesc mai slab) | mol |
| ung | Regatul Ungariei | Iancu de Hunedoara | Husar | Călăreții -15% cost; grajdul +20% mai repede | cat |
| pol | Regatul Poloniei | Ioan Albert | Cavaler polonez | Clădirile +20% viață; +20% piatră | cat |
| oto | Imperiul Otoman | Soliman Pașa / Mehmed | Ienicer | +15% aur; bombardele vin cu o epocă mai devreme și -20% cost | oto |
| tat | Hanatul Crimeii | Mengli Giray | Arcaș nogai | Călăreții +15% viteză; oile +30%; fără pușcași | tat |

Fiecare civilizație are și 2 tehnologii unice la Fortăreață (una în Epoca Cetăților, una în cea Imperială) și o putere activă a eroului:

| Erou | Puterea (reîncărcare ~90 s) |
|---|---|
| Ștefan | **Buciumul**: oastea din jur +30% atac și viteză, 15 s |
| Vlad | **Teroarea**: dușmanii din jur lovesc cu 40% mai slab, 15 s |
| Iancu | **Cruciada de la Belgrad**: vindecă oastea din jur cu 50% |
| Ioan Albert | **Garda regală**: cheamă 3 cavaleri polonezi |
| Soliman | **Bateria**: asediul din jur +50% pagubă, 20 s |
| Mengli Giray | **Năvala**: călăreții din jur +50% viteză și +2 atac, 15 s |

### 2.2 Epocile (5)

| # | Epoca | Cost | Condiție |
|---|---|---|---|
| 0 | Epoca Întunecată | – | – |
| 1 | Epoca Feudală | 500 hrană | 2 clădiri dintre: Cazarmă, Joagăr, Mină, Moară |
| 2 | Epoca Cetăților | 800 hrană, 200 aur | 2 clădiri feudale (Poligon, Grajd, Fierărie, Târg) |
| 3 | Epoca Imperială | 1.000 hrană, 800 aur | Universitate + (Fortăreață sau Atelier) |
| 4 | Epoca Renașterii | 1.500 hrană, 1.200 aur | Chimia (de la Universitate) |

### 2.3 Oștenii și liniile de upgrade

Upgrade-ul se cercetează la clădirea care îi face. Oștenii vechi se transformă pe loc, ca în AoE2.

| Clădire | Linia (epoca) |
|---|---|
| Cetatea de Scaun | Țăran (0), Erou (0) |
| Cazarmă | Oștean (0) → Oștean în zale (1) → Spadasin (2) → Spadasin greu (3) → Campion (4) |
| | Lăncier (1) → Pichier (2) → Halebardier (3) |
| Poligon | Plăieș (1) → Plăieș de elită (2) |
| | Arcaș (1) → Arbaletier (2) → Arbaletier greu (3) |
| | Arcaș călare (2) → Arcaș călare greu (3) |
| | Pușcaș (3, cere Chimia) → Muschetar (4) |
| Grajd | Călăraș (1) → Călăraș greu (2) → Călăraș de elită (3) |
| | Curtean (2) → Cavaler (3) → Cavaler de elită (4) |
| Atelier de asediu | Berbec (2) → Berbec greu (3); Catapultă (2) → Catapultă grea (3); Bombardă (3) → Tun de asediu (4) |
| Fortăreață | unitatea unică (2) → de elită (3); Trebușet (3) |
| Mănăstire | Călugăr (1): vindecă, duce moaștele |
| Târg | Car de negoț (1): face aur între târguri |

Contrele, ca în AoE2:
- lăncierii bat călăreții;
- călăreții bat arcașii, asediul și călugării;
- arcașii bat pedestrașii;
- plăieșii bat arcașii;
- pușcașii bat pedestrașii;
- berbecii și trebușetele bat clădirile;
- catapultele bat grupurile.

### 2.4 Clădirile

| Epoca | Clădiri |
|---|---|
| 0 | Cetatea de Scaun (încă una se poate ridica din Epoca Cetăților), Casă, Joagăr, Mină, Moară, Ogor, Cazarmă, Gard de pari, Poartă de lemn |
| 1 | Poligon, Grajd, Fierărie, Târg, Turn de pază, Mănăstire, Zid de piatră, Poartă de piatră |
| 2 | Universitate, Atelier de asediu, Fortăreață |
| 3 | Minunea, câte una pe civilizație: Mănăstirea Putna, Mănăstirea Curtea de Argeș, Castelul Huniazilor, Wawel, Hagia Sofia, Hansaray |

Upgrade-uri de clădiri, de la Universitate:
- Turn de pază → Turn de strajă → Donjon → Turn de tunuri;
- Zidărie, Arhitectură (viață), Ziduri întărite.

### 2.5 Tehnologiile (~65)

| Clădire | Tehnologii |
|---|---|
| Cetatea de Scaun | epocile, Războiul de țesut, Roabă, Căruță, Paza de noapte |
| Joagăr | Topor dublu, Ferăstrău, Ferăstrău cu două mânere |
| Mină | Târnăcop, Puțuri adânci |
| Moară | Jug de boi, Plug greu, Rotația culturilor |
| Fierărie (5 linii × 3 trepte) | atac corp la corp, armura pedestrașilor, armura călăreților, atacul arcașilor, armura arcașilor |
| Universitate | Zidărie, Arhitectură, Chimie, Fortificații, Inginerie de asediu, Balistică, turnurile, Ziduri întărite, Tiparnița (în Epoca Renașterii: tehnologiile se fac cu 30% mai repede) |
| Fortăreață | 2 tehnologii unice, Unitatea de elită, Recrutarea |
| Mănăstire | Ierburi de leac, Credință |
| Târg | Breasla negustorilor, Cartografie |
| Cazarmă, Poligon, Grajd, Atelier | liniile de upgrade, Marș forțat, Inelul arcașului, Potcoave |

### 2.6 Economia și luptele, ce se adaugă

- **Schimbul la Târg:** vinzi și cumperi hrană, lemn și piatră pe aur, cu prețuri care se mișcă. Carele de negoț fac aur între două târguri.
- **Moaștele:** 5 pe hartă. Un călugăr o duce la Mănăstire și ea dă aur încet.
- **Vânătoarea:** cerbi, care fug, și mistreți, care atacă (în etapa 8).
- **Adăpostirea:** oamenii intră în Cetate, turnuri și Fortăreață, care trag cu mai multe săgeți. Clopotul îi bagă pe toți țăranii înăuntru.
- **Zidurile și porțile:** porțile se deschid doar pentru ai tăi.
- **Pagubele mari:** catapultele lovesc tot grupul, trebușetele bat de departe în ziduri, iar pușcașii și tunurile fac fum.
- **Călugării** vindecă oamenii.

### 2.7 Modurile de joc

- **Campania „Ștefan cel Mare”** (6 misiuni, mai jos).
- **Bătălia liberă**, unde alegi:
  - civilizația ta;
  - 1–3 adversari și aliați (1v1, 2v2, 1v2, toți contra tuturor);
  - harta și mărimea ei;
  - anotimpul (vară sau iarnă);
  - epoca de început;
  - resursele;
  - limita de oameni;
  - victoria: Cucerire, Minune sau Regicid;
  - pacea din primele minute;
  - greutatea.
- **Supraviețuirea:** valuri tot mai mari de atacatori. Câte valuri ții?

### 2.8 Hărțile (bătălia liberă)

| Cod | Harta | Ce o face diferită |
|---|---|---|
| rau | Valea Siretului | râul cu vaduri și poduri (harta de acum) |
| codri | Codrii Cosminului | pădure deasă, poieni, drumuri înguste |
| stepa | Stepa Bugeacului | deschisă, puțini copaci, multe oi, bălți |
| delta | Delta Dunării | multe brațe de apă, ostroave legate prin vaduri |
| munti | Carpații | creste de stâncă de netrecut, trecători, mult aur și piatră |

Mărimi: mică (72), medie (96), mare (120). Iarna: zăpadă pe teren și pe copaci.

### 2.9 Campania „Ștefan cel Mare” (6 misiuni)

Între misiuni se arată o hartă pictată a Moldovei, cu săgeți care se mișcă. Un narator spune povestea, cu voce făcută cu OpenAI. În misiune, personajele vorbesc, cu portret.

1. **Doljești, 1457 — „Dreptul la domnie”.** Ștefan intră în Moldova cu oștenii dați de vărul lui, Vlad Țepeș (aliat verde), ca să-l înfrunte pe Petru Aron. Misiunea e și învățătură: strângi resurse, faci cazarmă, ridici oaste de 15 oameni și spargi tabăra lui Petru Aron. La final, Ștefan e uns domn la Direptate.
2. **Chilia, 1465 — „Cheia Dunării”.** Cetatea Chiliei are garnizoană ungurească și ziduri de piatră. Faci atelier de asediu și bombarde, oprești ajutoarele care vin pe vad și dărâmi cetatea.
3. **Baia, 1467 — „Noaptea de la Baia”.** E iarnă. Matia Corvin a ocupat târgul Baia. Te întărești în dealuri, iar la căderea nopții (întuneric, torțe) aprinzi târgul și îl rănești pe rege.
4. **Vaslui, 1475 — „Podul Înalt”.** E ceață deasă. Oastea uriașă a lui Soliman Pașa vine pe vale. Pui buciumașii în pădure, ca să-i păcălești, și îi lovești din coastă. Câștigi dacă le distrugi oastea și tabăra.
5. **Neamț, 1476 — „Du-te și luptă!”.** Ștefan a pierdut la Valea Albă, iar mama lui nu-i deschide porțile cetății. Partea 1: garnizoana Cetății Neamțului ține asediul lui Mehmed al II-lea. Partea 2: Ștefan strânge oaste nouă în nord și sparge asediul.
6. **Codrii Cosminului, 1497 — „Pădurea care cade”.** Regele Ioan Albert se retrage prin codru. Tai copacii de-a lungul drumului (capcane), apoi îi lovești oastea înainte să iasă din pădure. La final se spune legenda Dumbrăvii Roșii.

Campania ține minte ce misiuni ai terminat și pe ce greutate.

### 2.10 Sunetul

- Vocile fiecărei civilizații în limba ei (OpenAI TTS): română (Moldova, Țara Românească), maghiară, polonă, turcă, tătară crimeeană. Eroii au replicile lor.
- Narațiunea campaniei și dialogurile.
- Muzica pe civilizație: doina moldovenească, scara orientală pentru otomani, stepa pentru tătari.
- Sunete noi: pușcă, tun, catapultă, clopot, foc, prăbușire, nechezat, fanfara de epocă.

### 2.11 Grafica

- Clădirile în 4 stiluri: moldovenesc, central-european gotic, otoman, al stepei.
- Toți oștenii pe trepte vizuale (armura crește cu upgrade-ul) și cei 6 eroi.
- **Culoarea jucătorului printr-o mască:** orice civilizație poate avea orice culoare, cum face AoE2. Imaginile sunt în WebP și se încarcă doar stilurile din joc.
- Focul pe clădirile avariate, dărâmăturile, fumul de praf de pușcă, praful de sub pași, stolurile de păsări.
- Decorurile: tufe, pietre, flori, bușteni, stuf.
- Noaptea (Baia), ceața deasă (Vaslui) și iarna.
- Meniuri noi:
  - ecranul de bătălie, cu alegerea civilizației;
  - harta campaniei;
  - arborele tehnologiilor;
  - statisticile de la final, cu grafice.

---

## 3. Cum e construit tehnic

- **Jucătorii:** 2–4, cu `team`. `G.ally(a,b)` și `G.enemy(a,b)` înlocuiesc peste tot `e.o === u.o`. Ceața e comună cu aliații.
- **Culorile:** `G.PCOL[i]`, după locul jucătorului (albastru, roșu, verde, galben). Civilizația dă doar stilul.
- **Statisticile:** `ustT(o,t)` adună tehnologiile, bonusurile civilizației și upgrade-urile. `G.maxHp(e)` și `G.costOf(o,t)` țin cont de civilizație.
- **Liniile de upgrade:** unitatea are `line` și `tier`. Tehnologia are `up: {from, to}`. La cercetare, oamenii se transformă și își păstrează procentul de viață.
- **Declanșatorii (campanie):** liste de `{ when: [condiții], do: [acțiuni], once }`, verificate de 4 ori pe secundă.
  - Condiții: timp, zonă, numărare, distrus, erou mort, obiectiv, variabilă.
  - Acțiuni: mesaj cu vorbitor și voce, obiectiv nou sau îndeplinit, aduce oaste, atacă, dezvăluie, victorie, înfrângere, noapte, ceață, resurse, diplomație, variabile.
- **Hărțile de campanie:** `G.genMapSpec(S, spec)` pictează harta din operații (râu, lac, pădure, drum, stâncă, poiană, resurse).
- **Imaginile:**
  - `assets/<grupă>/<cheie>.webp`, cu masca de culoare `<cheie>_m.webp`;
  - date în `assets/baked.js` (`G.BAKED2`);
  - nuanțarea se face la desenare, cu cache pe cadre;
  - încărcarea e leneșă, pe stilurile din joc.
- **Salvarea:** `scm_save_v2`; salvările vechi nu se mai încarcă.
- **Fișierele noi:**
  - `js/campaign.js`: misiunile, poveștile, declanșatorii;
  - `js/trig.js`: motorul de declanșatori;
  - `js/menu.js`: meniurile, ecranul de bătălie, harta campaniei, arborele tehnologiilor.

---

## 4. Etapele

Fiecare etapă se termină cu testele verzi, commit și publicare. Jocul rămâne jucabil după fiecare.

| # | Etapa | Cine | Gata când |
|---|---|---|---|
| 1 | Motorul: jucători 2–4 și echipe, 6 civilizații, 5 epoci, liniile de upgrade, toate tehnologiile, clădirile noi (logic), unitățile noi, adăpostire și clopot, puterile eroilor, târgul, moaștele, victoriile, salvarea v2 | eu | toate unitățile și tehnologiile merg pentru toate civilizațiile; testele vechi verzi |
| 2 | Grafica 3D: mască de culoare, WebP, 4 stiluri, toți oștenii pe trepte, 6 eroi, clădirile noi, cele 6 minuni, ziduri, decoruri, zăpadă | ajutorul de grafică (în paralel) | foi de contact verificate vizual pe fiecare stil |
| 3 | Hărțile: 5 tipuri, 3 mărimi, 2–4 jucători, iarna, pictorul de hărți pentru campanie | ajutorul de hărți (în paralel) | 20 de semințe pe tip: toate bazele legate, resurse corecte |
| 4 | Calculatorul (AI): epocile 3–4, upgrade-uri, universitate, fortăreață, armată după contre, aliați, mai mulți dușmani, moduri scriptate | eu | AI contra AI pe toate perechile de civilizații: jocuri terminate, niciun blocaj |
| 5 | Interfața: meniul, bătălia liberă, adăpostire, clopot, puteri, târg, arborele tehnologiilor, statistici, culorile jucătorilor | eu | fluxurile de mouse și de telefon trec |
| 6 | Campania: declanșatorii, 6 misiuni, harta pictată, obiective, dialoguri | eu | fiecare misiune pornește și se poate câștiga (test scriptat) |
| 7 | Sunetul: vocile civilizațiilor, narațiunea, muzica pe civilizație, sunetele noi | eu + un ajutor pentru generare | replici verificate prin transcriere |
| 8 | Lustruirea: foc, dărâmături, păsări, praf, noapte, ceață, vânătoarea | eu | capturi verificate |
| 9 | Testarea mare (de 3 ori), echilibrul, viteza, telefonul, publicarea, memoria | eu | toate testele verzi de 3 ori la rând |

---

## 5. Cum testăm

1. **Simulare fără ecran (node):**
   - conținutul: fiecare unitate și tehnologie, pe fiecare civilizație și epocă;
   - AI contra AI: 6×6 civilizații × 2 semințe, cu durata jocului și câștigătorul;
   - blocajele (oameni care nu se mai mișcă);
   - salvarea și încărcarea în mijlocul jocului;
   - hărțile: 20 de semințe × 5 tipuri × 3 mărimi × 2–4 jucători.
2. **În browser (Chrome fără ecran):**
   - fluxurile de desktop și de telefon;
   - jucătorul care folosește doar mouse-ul;
   - capturi pentru fiecare stil, hartă, anotimp, noapte și ceață;
   - fiecare misiune de campanie: pornește, declanșatorii merg, câștig scriptat;
   - viteza: cadrul cel mai lent, cu 300 de oameni.
3. **Ochiul:** mă uit la fiecare captură înainte să public.
4. **Repetat:** după fiecare etapă, apoi de 3 ori la final, cu alte semințe.

## 6. Riscuri

| Risc | Ce facem |
|---|---|
| Prea mult conținut, care nu se termină | etapele livrează pe rând, iar jocul merge după fiecare |
| Imaginile prea mari | WebP, încărcare doar pe stilurile din joc |
| Viteza la 4 jucători | limită de oameni reglabilă, măsurată în test |
| AI-ul slab cu 5 epoci | testele AI contra AI și reglaje |

## 7. Progres

- [x] Muzica (doina, lupta), apoi câte un stil pe civilizație (doină, modul unguresc, scara orientală cu zurna, stepa în galop)
- [x] Etapa 1 — motorul: 2–4 jucători și echipe, 6 civilizații, 5 epoci, liniile de upgrade, ~85 de tehnologii, adăpostire și clopot, ziduri și porți, puterile eroilor, târg și care de negoț, moaște, victorii (cucerire, minune, regicid), salvarea v2
- [ ] Etapa 2 — grafica 3D (ajutorul de grafică lucrează; până atunci, imaginile vechi țin locul celor noi)
- [ ] Etapa 3 — hărțile (ajutorul de hărți lucrează; până atunci, harta râului și pictorul de rezervă pentru misiuni)
- [x] Etapa 4 — calculatorul: epocile 3–4, upgrade-uri, universitate, fortăreață, contre după armata dușmanului, ajutor pentru aliați, clopot, piață, moaște, puteri, sparge zidurile; gândește pe rând (fără sacadări)
- [x] Etapa 5 — interfața: meniul nou cu bătălie demonstrativă în spate, bătălia liberă, arborele tehnologiilor, ecranul de final cu grafic, butoanele noi, lista jucătorilor
- [x] Etapa 6 — campaniile: 16 misiuni în 6 campanii (Ștefan 6, Vlad 3, Iancu 3, Mehmed 2, Jagiello 1, Mengli Giray 1), harta pe pergament, obiective, dialoguri, noapte, ceață, capcane
- [x] Etapa 7 — sunetul: vocile celor 5 civilizații noi în limba lor, narațiunea tuturor misiunilor (156 de replici, verificate prin transcriere), sunete noi
- [ ] Etapa 8 — lustruirea (ninsoare, foc, noapte, ceață: gata; vânătoarea: după hărți și grafică)
- [ ] Etapa 9 — testarea mare de 3 ori și publicarea finală

### Teste (rulează din rădăcina proiectului)

| Test | Ce verifică |
|---|---|
| `node test/sim-test.js normal 12345 40` | calculatorul contra calculatorului, salvarea |
| `node test/stuck-test.js 11 222 3333 4444` | nimeni blocat 30 de secunde |
| `node test/civ-matrix.js 40 [mol-oto ...]` | perechi de civilizații, cine câștigă, erori |
| `node test/camp-win.js` | fiecare misiune se poate câștiga |
| `node test/camp-smoke.js [id...]` | fiecare misiune pornește în browser, capturi |
| `node test/smoke-v2.js` | meniul, bătălia 2v2, arborele, finalul |
| `node test/desk-flows.js`, `node test/flows-test.js` | mouse și telefon |
