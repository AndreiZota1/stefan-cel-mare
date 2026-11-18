#!/usr/bin/env python3
"""Generează replicile vorbite ale jocului (vocile Ioana și Yelda de pe macOS + ffmpeg)
și le pune, codate base64, în js/voci.js. Rulează: python3 tools/voci.py"""
import base64, json, os, subprocess, tempfile

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
# (voce, viteza de vorbire, ton, tempo, efecte în plus)
STYLE = {
    'vil':   ('Ioana (Enhanced)', 185, 0.80, 1.06, 'equalizer=f=160:t=q:w=1:g=3'),
    'mil':   ('Ioana (Enhanced)', 200, 0.74, 1.12, 'equalizer=f=140:t=q:w=1:g=4,acompressor=threshold=-18dB:ratio=3'),
    'hero':  ('Ioana (Enhanced)', 165, 0.69, 0.98, 'equalizer=f=120:t=q:w=1:g=4,aecho=0.8:0.6:38:0.16'),
    'alert': ('Ioana (Enhanced)', 210, 0.80, 1.12, 'equalizer=f=160:t=q:w=1:g=3'),
    'oto':   ('Yelda', 200, 0.72, 1.1, 'equalizer=f=140:t=q:w=1:g=4,aecho=0.8:0.55:30:0.14'),
}
TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'

out, total = {}, 0
with tempfile.TemporaryDirectory() as tmp:
    for cat, lines in LINES.items():
        voice, rate, pitch, tempo, fx = STYLE[cat.split('_')[0]]
        out[cat] = []
        for i, text in enumerate(lines):
            raw, enc = os.path.join(tmp, f'{cat}{i}.aiff'), os.path.join(tmp, f'{cat}{i}.m4a')
            subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', raw, text], check=True)
            af = (f'{TRIM},asetrate={int(22050 * pitch)},aresample=44100,atempo={tempo / pitch:.4f},'
                  f'highpass=f=90,lowpass=f=7500,{fx},loudnorm=I=-16:TP=-1.5')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ac', '1', '-ar', '44100',
                            '-c:a', 'aac', '-b:a', '48k', enc], check=True)
            data = open(enc, 'rb').read()
            total += len(data)
            out[cat].append({'t': text, 'a': base64.b64encode(data).decode()})
js = ('// Generat de tools/voci.py: replicile vorbite (vocile macOS Ioana și Yelda, prelucrate cu ffmpeg).\n'
      'var G = globalThis.G || (globalThis.G = {});\nG.VOCI = ' + json.dumps(out, ensure_ascii=False) + ';\n')
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'voci.js')
open(dest, 'w').write(js)
print(f'{sum(len(v) for v in out.values())} replici, {total / 1024:.0f} KB audio, voci.js {len(js) / 1024:.0f} KB')
