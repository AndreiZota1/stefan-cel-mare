#!/usr/bin/env python3
"""Vocile celorlalte civilizații, fiecare în limba ei (OpenAI text-to-speech), verificate prin transcriere.

    python3 tools/voci_civ.py --keychain claude-voce-openai [val ung pol oto tat]

Scrie js/voci_<civ>.js (G.VOCI_CIV[civ]); jocul îl încarcă doar când civilizația e în joc.
"""
import base64, difflib, json, os, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from voci import key_from_args  # noqa: E402
from nar import make, transcribe, norm  # noqa: E402

LINES = {
    'val': {'lang': 'ro', 'say': 'Vorbește în limba română, cu accent muntenesc',
        'vil_sel': ['Da, Măria Ta?', 'Poruncește!', 'Ce-i de făcut?', 'Aici, Doamne.'],
        'vil_ack': ['Mă duc!', 'Îndată!', 'Am înțeles!', 'Bine, Doamne!'],
        'vil_build': ['Construim!', 'Ne apucăm de treabă!'],
        'mil_sel': ['Da, Măria Ta!', 'Gata de luptă!', 'Poruncă!', 'Vitejii sunt gata!'],
        'mil_ack': ['Înainte!', 'Am înțeles!', 'Mergem!'],
        'mil_atk': ['La luptă!', 'Pentru Țara Românească!', 'Fără milă!', 'Loviți!'],
        'hero_sel': ['Ce veste aduci?', 'Eu sunt Vlad, domnul acestei țări.', 'Vorbește.'],
        'hero_ack': ['Așa să fie.', 'Înainte!'],
        'hero_atk': ['Fără milă, oșteni!', 'Să tremure sultanul!', 'Pentru țară!']},
    'ung': {'lang': 'hu', 'say': 'Speak Hungarian',
        'vil_sel': ['Igen, uram?', 'Parancs?', 'Itt vagyok!', 'Mit tegyek?'],
        'vil_ack': ['Megyek!', 'Értem!', 'Azonnal!', 'Rendben!'],
        'vil_build': ['Építünk!', 'Nekilátok!'],
        'mil_sel': ['Igen, uram!', 'Készen állunk!', 'Parancsára!'],
        'mil_ack': ['Előre!', 'Értettem!', 'Indulunk!'],
        'mil_atk': ['Támadás!', 'Rajta!', 'Előre, vitézek!', 'Hajrá!'],
        'hero_sel': ['Hunyadi János vagyok.', 'Mi a hír?', 'Szólj, katona.'],
        'hero_ack': ['Úgy legyen.', 'Előre!'],
        'hero_atk': ['Istennel előre!', 'A hazáért!', 'Rajta, vitézek!']},
    'pol': {'lang': 'pl', 'say': 'Speak Polish',
        'vil_sel': ['Tak, panie?', 'Słucham!', 'Co mam robić?', 'Jestem!'],
        'vil_ack': ['Idę!', 'Rozumiem!', 'Już się robi!', 'Dobrze, panie!'],
        'vil_build': ['Budujemy!', 'Biorę się do pracy!'],
        'mil_sel': ['Tak jest!', 'Gotowi do boju!', 'Rozkaz!'],
        'mil_ack': ['Naprzód!', 'Rozkaz!', 'Ruszamy!'],
        'mil_atk': ['Do boju!', 'Za Polskę!', 'Bij!', 'Naprzód, panowie!'],
        'hero_sel': ['Jestem królem Polski.', 'Mów.', 'Jakie wieści?'],
        'hero_ack': ['Niech tak będzie.', 'Naprzód!'],
        'hero_atk': ['Za króla i ojczyznę!', 'Do boju, rycerze!']},
    'oto': {'lang': 'tr', 'say': 'Speak Turkish',
        'vil_sel': ['Buyrun efendim?', 'Emredersiniz!', 'Ne yapayım?', 'Buradayım!'],
        'vil_ack': ['Gidiyorum!', 'Anlaşıldı!', 'Hemen!', 'Peki efendim!'],
        'vil_build': ['İnşa ediyoruz!', 'İşe başlıyorum!'],
        'mil_sel': ['Emrinizdeyim!', 'Savaşa hazırız!', 'Buyrun!'],
        'mil_ack': ['İleri!', 'Anlaşıldı!', 'Gidiyoruz!'],
        'mil_atk': ['Hücum!', 'Saldırın!', 'Vurun!', 'Durmayın!'],
        'hero_sel': ['Konuş, asker.', 'Ne haber getirdin?', 'Emrimi bekleyin.'],
        'hero_ack': ['Öyle olsun.', 'İleri!'],
        'hero_atk': ['Hücum, yiğitlerim!', 'Zafer bizimdir!', 'Vurun!']},
    'tat': {'lang': 'tr', 'say': 'Speak Crimean Tatar (a Turkic language close to Turkish), with a steppe accent',
        'vil_sel': ['Ebet, beyim?', 'Men mında!', 'Ne yapayım?'],
        'vil_ack': ['Ketem!', 'Tamam!', 'Şimdi!', 'Bek yahşı!'],
        'vil_build': ['Quramız!', 'Tamam, quramız!'],
        'mil_sel': ['Ebet, beyim!', 'Azırmız!', 'Buyurıñız!'],
        'mil_ack': ['Alğa!', 'Ketemiz!', 'Tamam!'],
        'mil_atk': ['Urıñız!', 'Alğa, batırlar!', 'Han içün!', 'Aydañız!'],
        'hero_sel': ['Men Meñli Geray hanman.', 'Ne haber?', 'Söyle.'],
        'hero_ack': ['Öyle olsun.', 'Alğa!'],
        'hero_atk': ['Alğa, batırlar!', 'Urıñız!', 'Zafer bizimdir!']},
}
STYLE = {
    'vil': ('ash', '{say}, as a medieval peasant answering his lord: humble, quick, short and natural. No pause at the start.'),
    'mil': ('onyx', '{say}, as a medieval soldier: determined, loud, almost shouting, short. No pause at the start.'),
    'hero': ('ballad', '{say}, as a medieval ruler and war leader: grave, solemn, sure of himself, with authority.'),
}
VOICE_BY_CIV = {'val': {'vil': 'echo', 'mil': 'ash', 'hero': 'ash'}, 'ung': {'vil': 'alloy', 'mil': 'onyx', 'hero': 'echo'}, 'pol': {'vil': 'echo', 'mil': 'onyx', 'hero': 'verse'},
                'oto': {'vil': 'ash', 'mil': 'onyx', 'hero': 'fable'}, 'tat': {'vil': 'alloy', 'mil': 'ash', 'hero': 'verse'}}


def main():
    key = key_from_args()
    civs = [a for a in sys.argv[1:] if a in LINES] or list(LINES)
    with tempfile.TemporaryDirectory() as tmp:
        for civ in civs:
            spec, out, total = LINES[civ], {}, 0
            for cat, lines in spec.items():
                if cat in ('lang', 'say'):
                    continue
                kind = cat.split('_')[0]
                voice = VOICE_BY_CIV[civ][kind]
                instr = STYLE[kind][1].format(say=spec['say'])
                out[cat] = []
                for text in lines:
                    best, score = None, -1
                    for _ in range(2):
                        enc = make(key, voice, instr, text, tmp)
                        try:
                            heard = transcribe(key, enc, spec['lang'])
                        except Exception:  # noqa: BLE001
                            heard = ''
                        sc = difflib.SequenceMatcher(None, norm(text), norm(heard)).ratio()
                        if sc > score:
                            score, best = sc, open(enc, 'rb').read()
                        if sc >= 0.6:
                            break
                    total += len(best)
                    out[cat].append({'t': text, 'a': 'data:audio/mpeg;base64,' + base64.b64encode(best).decode()})
                    print(f'{civ} {cat} {text!r} {score:.2f}', flush=True)
            dest = os.path.join(HERE, '..', 'js', 'voci_' + civ + '.js')
            open(dest, 'w', encoding='utf8').write('// Generat de tools/voci_civ.py (OpenAI text-to-speech).\nvar G = globalThis.G || (globalThis.G = {});\nG.VOCI_CIV = G.VOCI_CIV || {};\nG.VOCI_CIV.'
                                                   + civ + ' = ' + json.dumps(out, ensure_ascii=False) + ';\n')
            print(f'== {civ}: {sum(len(v) for v in out.values())} replici, {total // 1024} KB', flush=True)


if __name__ == '__main__':
    main()
