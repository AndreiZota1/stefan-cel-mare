#!/usr/bin/env python3
"""Versiunea fișierelor din index.html: fiecare script primește ?v=<amprenta conținutului>.

GitHub Pages ține fișierele 10 minute în cache. Fără versiune, după o reparație un refresh simplu
(sau orice refresh pe telefon) poate încărca tot codul vechi. Cu versiune, un fișier schimbat are
alt nume, deci se descarcă din nou, iar cele neschimbate rămân în cache.
Scripturile încărcate din mers (narațiune, sunete, voci) primesc G.VER, amprenta lor comună.

Se rulează înainte de fiecare commit care schimbă fișiere din js/ sau assets/:

    python3 tools/versiune.py
"""
import glob, hashlib, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
VER_RE = r"<script>var G = globalThis\.G \|\| \(globalThis\.G = \{\}\); G\.VER = '[0-9a-f]+';</script>"


def h(data):
    return hashlib.md5(data).hexdigest()[:8]


def main():
    p = os.path.join(ROOT, 'index.html')
    s = open(p, encoding='utf8').read()

    def stamp(m):
        f = os.path.join(ROOT, m.group(1))
        return m.group(0) if not os.path.exists(f) else f'src="{m.group(1)}?v={h(open(f, "rb").read())}"'

    out = re.sub(r'src="((?:js|assets)/[^"?]+\.js)(?:\?v=[0-9a-f]+)?"', stamp, s)
    files = sorted(glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True))
    ver = "<script>var G = globalThis.G || (globalThis.G = {}); G.VER = '" + h(b''.join(open(f, 'rb').read() for f in files)) + "';</script>"
    if re.search(VER_RE, out):
        out = re.sub(VER_RE, lambda m: ver, out)
    else:
        out = out.replace('<script src="js/data.js', ver + '\n<script src="js/data.js', 1)
    if out != s:
        open(p, 'w', encoding='utf8').write(out)
        print('index.html: versiuni noi')
    else:
        print('index.html: neschimbat')


if __name__ == '__main__':
    main()
