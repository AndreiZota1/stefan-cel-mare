#!/usr/bin/env python3
"""Strigătele pe numere (ca în AoE2): 12 replici scurte, rostite cu OpenAI TTS și verificate prin transcriere.

Cheia se ia DOAR din Keychain, intrarea dată cu --keychain (de ex. claude-voce-openai). Nu se afișează și nu se scrie nicăieri.

    python3 tools/strigate.py --keychain claude-voce-openai
"""
import base64, json, os, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from voci import key_from_args  # noqa: E402
from nar import transcribe, norm, MODELS  # noqa: E402
from voci import tts  # noqa: E402
import subprocess


def make(key, voice, instr, text, tmp):
    # ca în nar.py, dar cu tăierea liniștii mai blândă: începuturile încete („Aur”) nu se mai pierd
    data, last = None, None
    for model in MODELS:
        try:
            data = tts(key, model, voice, text, instr)
            break
        except Exception as e:  # noqa: BLE001
            last = e
    if data is None:
        raise SystemExit('OpenAI nu a răspuns: ' + str(last))
    raw, enc = os.path.join(tmp, 'a.mp3'), os.path.join(tmp, 'b.mp3')
    open(raw, 'wb').write(data)
    trim = 'silenceremove=start_periods=1:start_threshold=-62dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,adelay=60,loudnorm=I=-16:TP=-1.5'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', trim, '-ac', '1', '-b:a', '40k', enc], check=True)
    return enc

LINES = ['Da.', 'Nu.', 'Hrană, vă rog!', 'Lemne, vă rog!', 'Aur, vă rog!', 'Niște piatră, vă rog!', 'Aaah!',
         'Toată lumea la atac!', 'Ești gata?', 'Mai stai puțin!', 'Ha, ha, ha!', 'Pentru țară, înainte!']
INSTR = ('Vorbește în limba română, ca un oștean bătrân, glumeț și plin de viață dintr-un joc de strategie medieval: '
         'tare, limpede, cu haz, cu energie. Fără pauze la început.')


def main():
    key = key_from_args()
    out = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, text in enumerate(LINES):
            best = None
            for attempt in range(3):
                enc = make(key, 'onyx', INSTR, text, tmp)
                heard = transcribe(key, enc)
                a, b = set(norm(text)), set(norm(heard))
                score = len(a & b) / max(1, len(a)) if a else 1.0
                if best is None or score > best[0]:
                    best = (score, open(enc, 'rb').read(), heard)
                if score >= 0.75 or i in (6, 10):  # „Aaah!” și râsul nu au cuvinte de verificat
                    break
            print(f'{i + 1:2d}  {text:28s} auzit: {best[2]!r}  potrivire {best[0]:.2f}')
            out.append({'t': text, 'a': 'data:audio/mpeg;base64,' + base64.b64encode(best[1]).decode()})
    dest = os.path.join(os.path.dirname(__file__), '..', 'js', 'strigate.js')
    with open(dest, 'w') as f:
        f.write('// Generat de tools/strigate.py (OpenAI text-to-speech), verificat prin transcriere.\n')
        f.write('var G = globalThis.G || (globalThis.G = {});\nG.STRIGATE = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    print('scris', os.path.normpath(dest))


if __name__ == '__main__':
    main()
