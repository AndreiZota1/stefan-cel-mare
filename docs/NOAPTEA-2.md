# A doua noapte (19–20.11.2026): ce fac și unde am rămas

Cerut de Andrei pe 19.11: punctele 2–5 din evaluare (echilibru, vânătoare și pescuit, calculator mai viclean, apă și corăbii) plus orice altceva face jocul mai fain, după o cercetare. Lista i-a fost arătată înainte să se culce. Fiecare pas: teste, commit, publicare.

## Ordinea și starea

- [x] 1. Vânătoarea (commit 1579533): cerbi (fug), mistreți (se apără), lupi (atacă oamenii singuri, în codri); pește la mal (țăranii pescuiesc de pe mal)
- [x] 2. Apa și corăbiile: port; barcă de pescuit; galeră (+upgrade); corabie incendiară; corabie de transport (încarcă/descarcă); pește în larg; hărți noi „mare” (coasta Mării Negre) și „lac”; corăbiile și portul pe civilizații; calculatorul pescuiește și se bate pe apă
- [x] 3. Călugării convertesc dușmanii (cântare bisericească / ezan)
- [x] 4. Calculatorul: raiduri pe țărani, retragere și regrupare, palisade, ținte bune (asediu, călugări, țărani), cere pace când e pierdut, dificultăți reglate
- [x] 5. Ordine: lanț cu Shift, patrulare, atitudini (agresiv / defensiv / pe loc)
- [x] 6. Coduri secrete (mămăligă etc.) și strigăte pe numere
- [x] 7. Moduri: Regele dealului, Nomazi, zi–noapte opțional
- [x] 8. Diplomație: tribut către aliați
- [x] 9. Medalii salvate în browser
- [x] 10. Turneul de echilibru (toate perechile, mai multe hărți), ajustări până la ≤ 60%
- [x] 11. Testele mari, publicarea, rezumatul pentru Andrei

## Echilibrul (turneul calculator contra calculator, 32 de minute, râu + stepă, 10 meciuri pe civilizație)

| | la început | după reglaje |
|---|---|---|
| Polonia | 84–95% | 55% |
| Otomani | 0–20% | 30% |
| Țara Românească | 45% | 65% |
| Moldova | 50% | 60% |
| Tătari | 50% | 60% |
| Ungaria | 60% | 30% (zgomot ±15%) |

Ce a contat:
- Garda regală a polonezilor aducea 3 cavaleri gratuiți la 2 minute. Acum aduce 2 la 4 minute.
- Cavalerul polonez e mai scump și puțin mai slab.
- Otomanii au țărani mai repede, ogoare și aur mai bogate și ieniceri mai ieftini.
- Raidurile sunt mai mici și mai rare.
- Țăranii calculatorului nu mai stau ascunși în cetate la fiecare raid.

## Corăbiile: pașii (făcut)

1. Date: unitățile `pesc` (barcă de pescuit), `gal`/`gal2` (galeră), `foc` (corabie incendiară), `tra` (transport); cls `shp`, `naval: 1`. Clădirea `port` (3×3, pe apă lângă mal, `dock: 1`), cu tehnologiile `up_gal2` și `carena`. Resursa `fishd` (banc de pești, doar pentru bărci).
2. Simularea:
   - grila `C.wpass` (apă liberă), refăcută în `rebuild` și `occupy`;
   - `pgrid(u)`/`pk(u)` în `moveAlong`, `approach`, `doMove`, `separate`, `unstick`, `freeSpot`, `nearestPassable` și `cmdMove`;
   - `findDrop`: bărcile duc peștele doar la port;
   - `canPlace` pentru port;
   - transportul: îmbarcare și debarcare.
3. `path.js`: `o === 'w'` folosește `C.wpass`.
4. Hărțile: „mare” (inel de apă la marginea hărții) și „lac” (lac în mijloc); bancuri de pești în larg.
5. Imaginile: corăbiile pe civilizații (vele pătrate sau latine, castele la unguri și polonezi, scuturi la moldoveni și munteni, semilună la otomani și tătari), portul pe civilizații.
6. Calculatorul: port, bărci de pescuit, galere când dușmanul are apă, atac pe bărci și porturi.

## Note de proiectare

- Animalele sunt resurse (`S.ents`, `k: 'r'`) cu `hp`; vânătoarea = țăranul le lovește întâi, apoi le jupoaie. Cerbul fuge când e lovit; mistrețul răspunde; lupul atacă singur oamenii din apropiere.
- Corăbiile: grilă de trecere separată pentru apă; `findPath(..., o, naval)`; portul se pune pe apă lângă mal.
- Imaginile noi se randează cu `tools/bake2.js` (animalele în `n/`, corăbiile în `u/<tip>_<civ>`, portul în `b/port_<civ>`).

## A treia rundă (cerută de Andrei: clădirile pe epoci, alte lucruri ca în AoE2, verificare pe detalii)

- [x] Clădirile pe epoci. Treapta rustică `_r` (Epoca Întunecată: lemn, lut, stuf, cetatea cu gard de pari), cea de acum (Feudală și a Cetăților) și treapta impunătoare `_g` (Imperială și Renașterea: piatră, brâie, stindarde, cupru la polonezi, țiglă smălțuită la unguri). `render.js` alege după epoca proprietarului.
- [x] Ogoarele se termină: 300 de hrană, +100 pe unealtă. Se reînnoiesc pe 60 de lemne, singure sau plătite dinainte la moară.
- [x] Anunțul mare la trecerea într-o epocă nouă, fumul din hornuri, poverile țăranilor, oaia culcată, butonul 💬, portul în arborele tehnologiilor.
- [x] Muzica: o temă pe stil, care revine; instrumentele cresc cu epocile.
- [x] Verificări:
  - salvarea cu toate noutățile;
  - diacriticele în texte;
  - poveștile campaniilor, verificate istoric;
  - trecerea vizuală prin joc.
- [x] Reparat un bug care ajunsese publicat: clădirile terminate se desenau cu schelă (un `else` lipit de alt `if`). Lecția: testele automate nu văd grafica, deci trecerea vizuală e obligatorie după orice schimbare în `drawBld`.
