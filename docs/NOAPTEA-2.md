# A doua noapte (19–20.11.2026): ce fac și unde am rămas

Cerut de Andrei pe 19.11: punctele 2–5 din evaluare (echilibru, vânătoare și pescuit, calculator mai viclean, apă și corăbii) plus orice altceva face jocul mai fain, după o cercetare. Lista i-a fost arătată înainte să se culce. Fiecare pas: teste, commit, publicare.

## Ordinea și starea

- [x] 1. Vânătoarea (commit 1579533): cerbi (fug), mistreți (se apără), lupi (atacă oamenii singuri, în codri); pește la mal (țăranii pescuiesc de pe mal)
- [x] 2. Apa și corăbiile: port; barcă de pescuit; galeră (+upgrade); corabie incendiară; corabie de transport (încarcă/descarcă); pește în larg; hărți noi „mare” (coasta Mării Negre) și „lac”; corăbiile și portul pe civilizații; calculatorul pescuiește și se bate pe apă
- [x] 3. Călugării convertesc dușmanii (cântare bisericească / ezan)
- [ ] 4. Calculatorul: raiduri pe țărani, retragere și regrupare, palisade, ținte bune (asediu, călugări, țărani), cere pace când e pierdut, dificultăți reglate
- [x] 5. Ordine: lanț cu Shift, patrulare, atitudini (agresiv / defensiv / pe loc)
- [x] 6. Coduri secrete (mămăligă etc.) și strigăte pe numere
- [x] 7. Moduri: Regele dealului, Nomazi, zi–noapte opțional
- [x] 8. Diplomație: tribut către aliați
- [x] 9. Medalii salvate în browser
- [ ] 10. Turneul de echilibru (toate perechile, mai multe hărți), ajustări până la ≤ 60%
- [ ] 11. Testele mari, publicarea, rezumatul pentru Andrei

## Corăbiile: pașii (în lucru)

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
