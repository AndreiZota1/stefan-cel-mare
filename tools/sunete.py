#!/usr/bin/env python3
"""Sunetele jocului: înregistrări adevărate, libere (CC0, de pe Freesound), prelucrate cu ffmpeg.

Caută pe Freesound (doar licența CC0, cele mai descărcate), ia previzualizarea HQ, apoi:
  - sunetele scurte: taie liniștea de la început, scurtează, coada se stinge, volum egal, mono, MP3 64k;
  - fundalurile (bucle): o bucată din mijloc, cusătura netezită (coada trece în început), stereo, MP3 96k.
Ieșirea: js/sunete.js (G.SUNETE, în base64, ca să meargă și din file://) și docs/CREDITE-SUNETE.md.

    python3 tools/sunete.py            # tot ce lipsește
    python3 tools/sunete.py lup corb   # doar unele (le reface)
"""
import base64, html, json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(HERE, 'sunete_src')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; stefan-game-audio)'}
FF = 'ffmpeg'

# cheie: (căutare, durata minimă, durata maximă, câte, fel, lungimea finală[, ce trebuie să scrie în titlu])
# Titlul decide: fără sunete sintetice, de joc vechi, imitații sau filme (BAN).
BAN = r'8[- ]?bit|synth|theremin|mimic|human|werewolf|ghost|nerf|wilhelm|speech|\bdogs?\b|\bcats?\b|cartoon|\bgame\b|retro|\btoy\b|laser|sci-?fi|zombie|monster|dinosaur|booga|german|snarl|funny|horror|scary|robot|magic|anime|kid|child|voice|vocal|imitat|whistle|auto|machine|tank|modern'
CAT = {
    # fundaluri (bucle)
    'amb_padure': ('forest birds ambience', 30, 900, 1, 'loop', 26, r'forest|wood'),
    'amb_camp': ('countryside birds ambience', 30, 900, 1, 'loop', 26, r'country|field|meadow|bird'),
    'amb_mare': ('sea waves beach', 30, 900, 1, 'loop', 24, r'wave|sea|ocean|beach'),
    'amb_rau': ('river stream water', 30, 900, 1, 'loop', 22, r'river|stream|creek|brook'),
    'amb_vant': ('winter wind', 20, 900, 1, 'loop', 24, r'wind'),
    'amb_noapte': ('night crickets ambience', 30, 900, 1, 'loop', 24, r'cricket|night'),
    'amb_foc': ('fire crackling', 15, 900, 1, 'loop', 16, r'fire|crackl'),
    # animale
    'lup': ('wolves howling', 2, 16, 3, 'shot', 6, r'wol|lobo'),
    'corb': ('crow caw', 0.4, 8, 3, 'shot', 3, r'crow|raven|rook'),
    'oaie': ('sheep bleat', 0.4, 6, 3, 'shot', 2.5, r'sheep|lamb|baa|bleat|oveja'),
    'cal': ('horse neigh', 0.8, 6, 2, 'shot', 3, r'horse|neigh|whinn'),
    'mistret': ('pig grunt', 0.4, 5, 2, 'shot', 2, r'pig|boar|swine|hog'),
    'bufnita': ('owl hoot', 1, 8, 2, 'shot', 4, r'owl'),
    # luptă
    'sabie': ('sword clash', 0.2, 3, 4, 'shot', 1.2, r'sword|clash|blade|metal'),
    'arc': ('bow release arrow', 0.2, 3, 3, 'shot', 1.1, r'bow|arrow|archery'),
    'sageata': ('arrow impact', 0.1, 2.5, 2, 'shot', 0.8, r'arrow|impact|hit'),
    'tun': ('cannon shot', 0.5, 8, 2, 'shot', 3.5, r'cannon'),
    'muscheta': ('musket shot', 0.3, 5, 2, 'shot', 2, r'musket|gun|shot|rifle|flintlock'),
    'explozie': ('explosion', 0.5, 8, 2, 'shot', 3, r'explos|blast|boom'),
    'catapulta': ('trebuchet', 0.5, 8, 1, 'shot', 2.5, r'catapult|trebuchet|siege|launch'),
    'moarte': ('male death grunt', 0.3, 3, 3, 'shot', 1.4, r'death|die|dying|pain|grunt|groan|hurt'),
    # muncă și clădiri
    'topor': ('axe chopping wood', 0.2, 4, 3, 'shot', 0.9, r'chop|axe'),
    'tarnacop': ('pickaxe stone', 0.2, 3, 3, 'shot', 0.9, r'pick|stone|rock|mining'),
    'ciocan': ('hammering wood nails', 0.2, 4, 3, 'shot', 0.9, r'hammer'),
    'prabusire': ('wood breaking crash', 1, 8, 2, 'shot', 4, r'crash|break|collapse|destroy|smash|crack'),
    'clopot': ('church bell', 2, 12, 1, 'shot', 7, r'bell'),
    'bucium': ('war horn', 1, 9, 2, 'shot', 4.5, r'horn'),
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()


def search(q, page=1):
    url = 'https://freesound.org/search/?' + urllib.parse.urlencode({'q': q, 'f': 'license:"Creative Commons 0"', 's': 'Downloads most first', 'page': page})
    h = get(url).decode('utf8', 'replace')
    out = []
    for m in re.finditer(r'<div\s+class="bw-player"(.*?)>', h, re.S):
        a = m.group(1)
        f = dict(re.findall(r'data-([a-z0-9-]+)="([^"]*)"', a))
        if 'mp3' not in f:
            continue
        out.append({'id': f.get('sound-id'), 'user': html.unescape(f.get('username', '')), 'title': html.unescape(f.get('title', '')),
                    'dur': float(f.get('duration') or 0), 'dl': int(f.get('num-downloads') or 0), 'mp3': f['mp3'].replace('-lq.mp3', '-hq.mp3')})
    return out


def ff(args):
    r = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y'] + args, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr[-400:])


def dur_of(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def shot(src, dst, length):
    # liniștea de la început, apoi cel mult `length` secunde, coada stinsă, volum egal, mono
    ff(['-i', src, '-af', f'silenceremove=start_periods=1:start_threshold=-45dB,atrim=0:{length},afade=t=out:st={max(0.05, length - 0.25)}:d=0.25,loudnorm=I=-18:TP=-1.5:LRA=11,aresample=44100',
        '-ac', '1', '-b:a', '64k', dst])


def loop(src, dst, length, tmp):
    # o bucată din mijloc; cusătura: ultimele 2 s se topesc în primele 2 s
    d, x = dur_of(src), 2.0
    st = max(0, (d - length) / 2)
    mid = os.path.join(tmp, 'mid.wav')
    ff(['-ss', str(st), '-t', str(length), '-i', src, '-ac', '2', '-ar', '44100', mid])
    L = dur_of(mid)
    ff(['-i', mid, '-filter_complex',
        f'[0]atrim=start={L - x}:end={L},asetpts=PTS-STARTPTS,afade=t=out:st=0:d={x}[t];'
        f'[0]atrim=start=0:end={x},asetpts=PTS-STARTPTS,afade=t=in:st=0:d={x}[h];'
        f'[t][h]amix=inputs=2:normalize=0[xf];'
        f'[0]atrim=start={x}:end={L - x},asetpts=PTS-STARTPTS[m];'
        f'[xf][m]concat=n=2:v=0:a=1,loudnorm=I=-20:TP=-2:LRA=11,aresample=44100[o]', '-map', '[o]', '-b:a', '96k', dst])


def main():
    os.makedirs(SRC, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    credits_path = os.path.join(SRC, 'credits.json')
    credits = json.load(open(credits_path)) if os.path.exists(credits_path) else {}
    for key, spec in CAT.items():
        q, dmin, dmax, n, kind, length = spec[:6]
        must = spec[6] if len(spec) > 6 else ''
        if only and key not in only:
            continue
        if not only and key in credits:
            continue
        res = []
        for page in (1, 2, 3):
            res += [r for r in search(q, page) if dmin <= r['dur'] <= dmax and not re.search(BAN, r['title'], re.I) and (not must or re.search(must, r['title'], re.I))]
            if len(res) >= n:
                break
        picked = res[:n]
        if not picked:
            print('NIMIC pentru', key, q); continue
        credits[key] = []
        for i, r in enumerate(picked):
            src = os.path.join(SRC, f'{key}_{i}_src.mp3')
            open(src, 'wb').write(get(r['mp3']))
            dst = os.path.join(SRC, f'{key}_{i}.mp3')
            with tempfile.TemporaryDirectory() as tmp:
                try:
                    (loop(src, dst, length, tmp) if kind == 'loop' else shot(src, dst, length))
                except Exception as e:
                    print('EȘUAT', key, i, e); continue
            credits[key].append({'file': f'{key}_{i}.mp3', 'id': r['id'], 'title': r['title'], 'user': r['user'], 'dl': r['dl'], 'dur': r['dur']})
            print(f'{key}_{i}: „{r["title"]}” de {r["user"]} ({r["dur"]:.1f} s, {r["dl"]} descărcări)', flush=True)
        json.dump(credits, open(credits_path, 'w'), ensure_ascii=False, indent=1)
    for k in list(credits):
        if k not in CAT:
            del credits[k]
    json.dump(credits, open(credits_path, 'w'), ensure_ascii=False, indent=1)
    # js/sunete.js
    out, tot = {}, 0
    for key, items in credits.items():
        arr = []
        for it in items:
            p = os.path.join(SRC, it['file'])
            if not os.path.exists(p):
                continue
            b = open(p, 'rb').read(); tot += len(b)
            arr.append('data:audio/mpeg;base64,' + base64.b64encode(b).decode())
        if arr:
            out[key] = arr
    js = '// Generat de tools/sunete.py: sunete CC0 de pe Freesound (autorii: docs/CREDITE-SUNETE.md)\nvar G = globalThis.G || (globalThis.G = {});\nG.SUNETE = ' + json.dumps(out) + ';\n'
    open(os.path.join(ROOT, 'js', 'sunete.js'), 'w').write(js)
    md = ['# Sunetele jocului', '', 'Toate sunt de pe [Freesound](https://freesound.org), cu licența CC0 (domeniu public). Le mulțumim autorilor:', '']
    for key, items in credits.items():
        for it in items:
            md.append(f'- `{it["file"]}`: „{it["title"]}”, de {it["user"]} — https://freesound.org/s/{it["id"]}/')
    open(os.path.join(ROOT, 'docs', 'CREDITE-SUNETE.md'), 'w').write('\n'.join(md) + '\n')
    print('scris js/sunete.js:', round(tot / 1024), 'KB')


if __name__ == '__main__':
    main()
