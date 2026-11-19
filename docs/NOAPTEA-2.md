# A doua noapte (19–20.11.2026): ce fac și unde am rămas

Cerut de Andrei pe 19.11: punctele 2–5 din evaluare (echilibru, vânătoare și pescuit, calculator mai viclean, apă și corăbii) plus orice altceva face jocul mai fain, după o cercetare. Lista i-a fost arătată înainte să se culce. Fiecare pas: teste, commit, publicare.

## Ordinea și starea

- [ ] 1. Vânătoarea: cerbi (fug), mistreți (se apără), lupi (atacă oamenii singuri, în codri); pește la mal (țăranii pescuiesc de pe mal)
- [ ] 2. Apa și corăbiile: port; barcă de pescuit; galeră (+upgrade); corabie incendiară; corabie de transport (încarcă/descarcă); pește în larg; hărți noi „mare” (coasta Mării Negre) și „lac”; corăbiile și portul pe civilizații; calculatorul pescuiește și se bate pe apă
- [ ] 3. Călugării convertesc dușmanii (cântare bisericească / ezan)
- [ ] 4. Calculatorul: raiduri pe țărani, retragere și regrupare, palisade, ținte bune (asediu, călugări, țărani), cere pace când e pierdut, dificultăți reglate
- [ ] 5. Ordine: lanț cu Shift, patrulare, atitudini (agresiv / defensiv / pe loc)
- [ ] 6. Coduri secrete (mămăligă etc.) și strigăte pe numere
- [ ] 7. Moduri: Regele dealului, Nomazi, zi–noapte opțional
- [ ] 8. Diplomație: tribut către aliați
- [ ] 9. Medalii salvate în browser
- [ ] 10. Turneul de echilibru (toate perechile, mai multe hărți), ajustări până la ≤ 60%
- [ ] 11. Testele mari, publicarea, rezumatul pentru Andrei

## Note de proiectare

- Animalele sunt resurse (`S.ents`, `k: 'r'`) cu `hp`; vânătoarea = țăranul le lovește întâi, apoi le jupoaie. Cerbul fuge când e lovit; mistrețul răspunde; lupul atacă singur oamenii din apropiere.
- Corăbiile: grilă de trecere separată pentru apă; `findPath(..., o, naval)`; portul se pune pe apă lângă mal.
- Imaginile noi se randează cu `tools/bake2.js` (animalele în `n/`, corăbiile în `u/<tip>_<civ>`, portul în `b/port_<civ>`).
