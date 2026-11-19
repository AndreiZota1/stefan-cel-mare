#!/usr/bin/env python3
"""Narațiunea filmului de început (js/nar/film.js), cu vocea cronicarului din campanii, verificată prin transcriere.

    python3 tools/nar_film.py --keychain claude-voce-openai
"""
import base64, difflib, json, os, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from nar import VOICE, make, transcribe, norm  # noqa: E402
from voci import key_from_args  # noqa: E402

# aceleași texte ca în js/cinematic.js (subtitrările)
LINES = {
    'c1': 'Între Carpați și Marea Neagră, la răscrucea marilor imperii, s-au născut trei țări: Țara Românească, Moldova și Transilvania.',
    'c2': 'Din sud venea Imperiul Otoman, cu cea mai mare oaste a lumii. Din apus și din nord, regii și hanii care râvneau aceleași pământuri.',
    'c3': 'Mai puțini la număr, domnii acestor țări și-au apărat pământul cu ce aveau: codrii, munții, apele și oamenii lor.',
    'c4a': 'Mircea cel Bătrân.',
    'c4b': 'Vlad Țepeș.',
    'c4c': 'Ștefan cel Mare.',
    'c4d': 'Mihai Viteazul.',
    'c5': 'Ei au scris istoria cu sabia. Acum e rândul tău.',
    # „Zugravul de la Moldovița”
    'z1': 'Moldovița, anul 1537. Pe zidul de miazăzi al mânăstirii, un zugrav bătrân începe o poveste pe care o știe toată Moldova.',
    'z2': 'Albastrul îl macină din piatră. Roșul, din cinabru. Varul trebuie să fie ud, altfel culoarea nu prinde.',
    'z3': 'Întâi pictează călăreții. Apoi cetatea spre care aleargă.',
    'z4': 'Și, pentru o clipă, i se pare că îi aude.',
    'z5': 'Cetatea e Constantinopolul. Dar vrăjmașii de sub ziduri poartă turbane, iar călăreții seamănă cu oamenii lui Ștefan. Toată lumea înțelege.',
    'z6': 'Pe zidurile acestei țări, fiecare poveste e o bătălie. Și fiecare bătălie, o țară apărată.',
    'z7': 'Iar la sfârșit, îi pictează pe cei care au apărat-o.',
    'z7d': 'Și unul care încă nu se născuse: Mihai Viteazul.',
    'z9': 'Pictura e acolo și azi, după aproape cinci sute de ani.',
}


def main():
    key = key_from_args()
    voice, instr = VOICE['narator']
    instr += ' E deschiderea unui film epic: rar, solemn, cu greutate, cu pauze lungi.'
    dest = os.path.join(HERE, '..', 'js', 'nar', 'film.js')
    out = {}
    if os.path.exists(dest):
        for line in open(dest, encoding='utf8'):
            if line.startswith('G.NAR['):
                kk = json.loads(line[6:line.index(']')]); out[kk] = line[line.index('= "') + 3:line.rindex('"')]
    only = [a for a in sys.argv[1:] if not a.startswith('--') and a not in (sys.argv[sys.argv.index('--keychain') + 1] if '--keychain' in sys.argv else '',)]
    with tempfile.TemporaryDirectory() as tmp:
        for k, text in LINES.items():
            if ('film_' + k) in out and k not in only:
                continue
            best, score = None, -1
            for attempt in range(4):
                enc = make(key, voice, instr, text, tmp)
                sc = difflib.SequenceMatcher(None, norm(text), norm(transcribe(key, enc))).ratio()
                if sc > score:
                    score, best = sc, open(enc, 'rb').read()
                if sc >= 0.85:
                    break
            out['film_' + k] = 'data:audio/mpeg;base64,' + base64.b64encode(best).decode()
            print(k, round(score, 2), flush=True)
    with open(dest, 'w', encoding='utf8') as f:
        f.write('// Generat de tools/nar_film.py (OpenAI text-to-speech).\nvar G = globalThis.G || (globalThis.G = {});\nG.NAR = G.NAR || {};\n')
        for k, v in out.items():
            f.write('G.NAR[' + json.dumps(k) + '] = "' + v + '";\n')
    print('scris', dest)


if __name__ == '__main__':
    main()
