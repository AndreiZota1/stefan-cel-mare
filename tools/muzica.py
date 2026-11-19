#!/usr/bin/env python3
"""Muzica jocului: piese de Kevin MacLeod (incompetech.com), licența Creative Commons Attribution 4.0.

Descarcă piesele, le face AAC (m4a, 96 kbps, cu encoderul Apple: afconvert) în assets/muzica/,
scrie js/muzica.js (G.MUZICA: piesele pe stări) și docs/CREDITE-MUZICA.md (atribuirea cerută de licență).

    python3 tools/muzica.py
"""
import json, os, re, subprocess, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(HERE, 'muzica_src')
OUT = os.path.join(ROOT, 'assets', 'muzica')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; stefan-game-audio)'}

# starea jocului -> piesele (titlurile exacte din catalogul incompetech)
LIST = {
    'tema': ['Noble Race'],
    'pace': ['Village Consort', 'Thatched Villagers', 'Lord of the Land', 'Midnight Tale', 'Industrious Ferret', 'The Pyre'],
    'lupta': ['Clash Defiant', 'Five Armies', 'Death and Axes', 'Crusade', 'Heavy Interlude', 'The Descent'],
    'orient': ['Tabuk', 'Ibn Al-Noor', 'Desert City'],
    'orient_lupta': ['Curse of the Scarab'],
    'film': ['Tempting Secrets'],
    'film_lupta': ['Five Armies'],
    'trailer': ['Exciting Trailer'],
    'victorie': ['Heroic Age'],
    'infrangere': ['For the Fallen'],
    'poveste': ['Night Vigil'],
}


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def main():
    os.makedirs(SRC, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    titles = sorted({t for v in LIST.values() for t in v})
    for t in titles:
        src = os.path.join(SRC, slug(t) + '.mp3'); dst = os.path.join(OUT, slug(t) + '.m4a')
        if not os.path.exists(src):
            url = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/' + urllib.parse.quote(t + '.mp3')
            open(src, 'wb').write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read())
        if not os.path.exists(dst):
            subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', '-q', '127', src, dst], check=True)
        print(t, os.path.getsize(dst) // 1024, 'KB', flush=True)
    data = {k: [slug(t) for t in v] for k, v in LIST.items()}
    names = {slug(t): t for t in titles}
    open(os.path.join(ROOT, 'js', 'muzica.js'), 'w').write(
        '// Generat de tools/muzica.py: muzica de Kevin MacLeod (incompetech.com), licența CC BY 4.0\n'
        'var G = globalThis.G || (globalThis.G = {});\nG.MUZICA = ' + json.dumps(data) + ';\nG.MUZICA_TITLURI = ' + json.dumps(names, ensure_ascii=False) + ';\n')
    md = ['# Muzica jocului', '', 'Toate piesele sunt de **Kevin MacLeod** ([incompetech.com](https://incompetech.com)),',
          'licența [Creative Commons: By Attribution 4.0](http://creativecommons.org/licenses/by/4.0/).', '']
    md += [f'- „{t}” — Kevin MacLeod (incompetech.com), CC BY 4.0' for t in titles]
    open(os.path.join(ROOT, 'docs', 'CREDITE-MUZICA.md'), 'w').write('\n'.join(md) + '\n')
    tot = sum(os.path.getsize(os.path.join(OUT, slug(t) + '.m4a')) for t in titles)
    print(len(titles), 'piese,', round(tot / 1048576, 1), 'MB')


if __name__ == '__main__':
    main()
