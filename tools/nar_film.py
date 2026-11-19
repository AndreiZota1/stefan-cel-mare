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
}


def main():
    key = key_from_args()
    voice, instr = VOICE['narator']
    instr += ' E deschiderea unui film epic: rar, solemn, cu greutate, cu pauze lungi.'
    out = {}
    with tempfile.TemporaryDirectory() as tmp:
        for k, text in LINES.items():
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
    dest = os.path.join(HERE, '..', 'js', 'nar', 'film.js')
    with open(dest, 'w', encoding='utf8') as f:
        f.write('// Generat de tools/nar_film.py (OpenAI text-to-speech).\nvar G = globalThis.G || (globalThis.G = {});\nG.NAR = G.NAR || {};\n')
        for k, v in out.items():
            f.write('G.NAR[' + json.dumps(k) + '] = "' + v + '";\n')
    print('scris', dest)


if __name__ == '__main__':
    main()
