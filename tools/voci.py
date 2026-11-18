#!/usr/bin/env python3
"""Generează replicile vorbite ale jocului cu OpenAI (text-to-speech) și le pune în js/voci.js.

Cheia se ia DOAR din variabila de mediu OPENAI_API_KEY sau din fișierul dat cu --cheie <cale>.
Scriptul nu caută chei pe disc și nu le afișează.

    OPENAI_API_KEY=... python3 tools/voci.py
    python3 tools/voci.py --cheie ~/cale/catre/fisierul-cu-cheia
"""
import base64, json, os, subprocess, sys, tempfile, urllib.request, urllib.error

LINES = {
    'vil_sel':   ['Da, stăpâne?', 'Poruncă!', 'Ce-i de lucru?', 'Aici sunt!', 'Ascult!', 'Spune, stăpâne.'],
    'vil_ack':   ['Mă duc!', 'Am înțeles!', 'Îndată!', 'Bine, stăpâne!', 'S-a făcut!', 'Merg acum.'],
    'vil_build': ['Construiesc!', 'Ridicăm!', 'Gata, mă apuc!'],
    'mil_sel':   ['Da!', 'Gata de luptă!', 'Poruncește!', 'La ordin!', 'Oastea e gata!'],
    'mil_ack':   ['Înainte!', 'Am înțeles!', 'Mergem!', 'Așa vom face!'],
    'mil_atk':   ['La luptă!', 'Pentru Moldova!', 'Loviți!', 'Ura!', 'Nu ne dăm!'],
    'hero_sel':  ['Ce veste aduci?', 'Moldova nu se dă!', 'Ascult, oștene.', 'Eu, Ștefan voievod.'],
    'hero_ack':  ['Înainte, oaste!', 'Așa să fie!', 'Mergem!'],
    'hero_atk':  ['Pentru Moldova! Loviți-i!', 'La luptă, fraților!', 'Cu Dumnezeu, înainte!'],
    'alert':     ['Suntem atacați!', 'Vin turcii!'],
    'oto':       ['Hücum!', 'Saldırın!', 'Vurun!'],
}
STYLE = {
    'vil':   ('ash', 'Vorbește în limba română, cu accent moldovenesc, ca un țăran din Evul Mediu care îi răspunde stăpânului: smerit, sprinten, scurt și firesc. Fără pauze la început.'),
    'mil':   ('onyx', 'Vorbește în limba română, ca un oștean moldovean din Evul Mediu: hotărât, cu voce puternică, aproape strigat, scurt. Fără pauze la început.'),
    'hero':  ('onyx', 'Vorbește în limba română, ca Ștefan cel Mare, voievodul Moldovei: grav, solemn, sigur pe el, cu autoritate. Rar și apăsat.'),
    'alert': ('ash', 'Vorbește în limba română, ca o iscoadă speriată care dă alarma: urgent, tare, grăbit.'),
    'oto':   ('onyx', 'Speak Turkish, as an Ottoman soldier shouting a battle cry: loud, fierce, short.'),
}
MODELS = ['gpt-4o-mini-tts', 'tts-1-hd']


def key_from_args():
    if '--cheie' in sys.argv:
        path = os.path.expanduser(sys.argv[sys.argv.index('--cheie') + 1])
        for line in open(path):
            line = line.strip()
            if line.startswith('OPENAI_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"\'')
            if line.startswith('sk-'):
                return line
        sys.exit('Nu am găsit cheia în fișierul dat.')
    k = os.environ.get('OPENAI_API_KEY')
    if not k:
        sys.exit('Lipsește OPENAI_API_KEY (sau --cheie <fișier>).')
    return k


def tts(key, model, voice, text, instructions):
    body = {'model': model, 'voice': voice, 'input': text, 'response_format': 'mp3'}
    if model.startswith('gpt-'):
        body['instructions'] = instructions
    req = urllib.request.Request('https://api.openai.com/v1/audio/speech', data=json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    return urllib.request.urlopen(req, timeout=60).read()


def main():
    key = key_from_args()
    out, total = {}, 0
    with tempfile.TemporaryDirectory() as tmp:
        for cat, lines in LINES.items():
            voice, instr = STYLE[cat.split('_')[0]]
            out[cat] = []
            for i, text in enumerate(lines):
                data = None
                for model in MODELS:
                    try:
                        data = tts(key, model, voice, text, instr)
                        break
                    except urllib.error.HTTPError as e:
                        print(f'  {model}: {e.code}, încerc următorul model', file=sys.stderr)
                if data is None:
                    sys.exit('OpenAI nu a răspuns la ' + text)
                raw, enc = os.path.join(tmp, 'a.mp3'), os.path.join(tmp, 'b.mp3')
                open(raw, 'wb').write(data)
                # taie liniștea de la capete și egalează volumul
                trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5'
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', trim, '-ac', '1', '-b:a', '64k', enc], check=True)
                b = open(enc, 'rb').read()
                total += len(b)
                out[cat].append({'t': text, 'a': 'data:audio/mpeg;base64,' + base64.b64encode(b).decode()})
                print(cat, text)
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'voci.js')
    open(dest, 'w').write('// Generat de tools/voci.py (OpenAI text-to-speech).\nvar G = globalThis.G || (globalThis.G = {});\nG.VOCI = '
                          + json.dumps(out, ensure_ascii=False) + ';\n')
    print(f'{sum(len(v) for v in out.values())} replici, {total // 1024} KB')


if __name__ == '__main__':
    main()
