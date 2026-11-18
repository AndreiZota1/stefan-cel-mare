#!/usr/bin/env python3
"""Narațiunea campaniilor, făcută cu OpenAI (text-to-speech), verificată prin transcriere înapoi (whisper-1).

Citește poveștile (intro/outro) și replicile (T.say) din js/camp-*.js și scrie js/nar/<misiune>.js.
Cheia se ia la fel ca în tools/voci.py (variabila OPENAI_API_KEY, --cheie <fișier> sau --keychain <intrare>).

    python3 tools/nar.py --keychain claude-voce-openai            # toate misiunile
    python3 tools/nar.py --keychain claude-voce-openai st1 st4    # doar unele
"""
import base64, difflib, json, os, re, subprocess, sys, tempfile, unicodedata, urllib.request, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
sys.path.insert(0, HERE)
from voci import tts, key_from_args, MODELS  # noqa: E402

RO = 'Vorbește în limba română, cu pronunție românească corectă (ă, â, î, ș, ț). '
VOICE = {
    'narator': ('onyx', RO + 'Ești povestitorul unui documentar istoric: cald, grav, limpede, rar, cu pauze firești între propoziții.'),
    'stefan': ('ballad', RO + 'Ești Ștefan cel Mare, domnul Moldovei: grav, hotărât, cu autoritate, dar apropiat de oamenii lui.'),
    'vlad': ('ash', RO + 'Ești Vlad Țepeș: voce joasă, rece, apăsată, de om care nu acceptă împotrivire.'),
    'iancu': ('echo', RO + 'Ești Iancu de Hunedoara, un cavaler nobil și curajos: hotărât, limpede, înflăcărat.'),
    'matia': ('verse', RO + 'Ești regele Matia Corvin: mândru, poruncitor.'),
    'albert': ('verse', RO + 'Ești regele Poloniei, Ioan Albert: mândru, poruncitor.'),
    'jagiello': ('verse', RO + 'Ești un rege bătrân și înțelept care își îmbărbătează oastea înaintea bătăliei.'),
    'mehmed': ('fable', RO + 'Ești sultanul Mehmed al II-lea: tânăr, ambițios, rece, cu un ușor accent turcesc.'),
    'soliman': ('fable', RO + 'Ești un pașă otoman: aspru, poruncitor, cu un ușor accent turcesc.'),
    'mengli': ('verse', RO + 'Ești hanul tătarilor din Crimeea: sălbatic, mândru, cu un ușor accent tătar.'),
    'mama': ('sage', RO + 'Ești mama lui Ștefan cel Mare, o femeie bătrână și aprigă, care strigă de pe zidurile cetății: severă, mândră, cu durere ascunsă.'),
    'capitan': ('alloy', RO + 'Ești un căpitan de oaste: voinic, prietenos, hotărât.'),
    'parcalab': ('echo', RO + 'Ești pârcălabul unei cetăți: un comandant încercat, calm sub presiune.'),
    'boier': ('verse', RO + 'Ești un boier bătrân: viclean, prudent, șoptit.'),
    'iscoada': ('alloy', RO + 'Ești o iscoadă care aduce vești urgente: grăbit, cu suflarea tăiată.'),
    'taran': ('ash', RO + 'Ești un țăran simplu de la munte: aspru, sincer.'),
    'petru': ('fable', RO + 'Ești Petru Aron, un domn uzurpator: mânios, disprețuitor.'),
    'capistrano': ('echo', RO + 'Ești un călugăr predicator înflăcărat care strigă către mulțime.'),
    'orban': ('alloy', RO + 'Ești un meșter turnător de tunuri, mândru de lucrarea lui, cu un ușor accent maghiar.'),
    'ienicer': ('fable', RO + 'Ești un ofițer de ieniceri: aspru, strigi o alarmă.'),
    'vitold': ('ash', RO + 'Ești marele duce Vitold al Lituaniei: viclean, încrezător.'),
    'bei': ('verse', RO + 'Ești un bei tătar: mândru.'),
}


def missions():
    """Poveștile se citesc cu node (exact cum le vede jocul); replicile, din sursă."""
    js = r"""
      global.globalThis = global; var G = global.G = {};
      for (const f of process.argv.slice(1)) require('vm').runInThisContext(require('fs').readFileSync(f, 'utf8'));
      const out = {}; for (const [id, m] of Object.entries(G.MISSIONS)) out[id] = { intro: m.intro || [], outro: m.outro || [] };
      console.log(JSON.stringify(out));
    """
    files = sorted(os.path.join(ROOT, 'js', f) for f in os.listdir(os.path.join(ROOT, 'js')) if f.startswith('camp-') and f.endswith('.js'))
    data = json.loads(subprocess.run(['node', '-e', js] + files, capture_output=True, text=True, check=True).stdout)
    for f in files:
        cur = None
        for line in open(f, encoding='utf8'):
            m = re.search(r"\bM\.(\w+) = \{", line)
            if m:
                cur = m.group(1)
            for w, t, k in re.findall(r"T\.say\('(\w+)', '([^']*)', '(\w+)'", line):
                if cur in data:
                    data[cur].setdefault('says', []).append((k, w, t))
    return data


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', ' ', s).split()


def transcribe(key, path, lang='ro'):
    b = '----' + uuid.uuid4().hex
    body = b''
    for name, val in (('model', 'whisper-1'), ('language', lang)):
        body += f'--{b}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode()
    body += f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode() + open(path, 'rb').read() + f'\r\n--{b}--\r\n'.encode()
    req = urllib.request.Request('https://api.openai.com/v1/audio/transcriptions', data=body,
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'multipart/form-data; boundary=' + b})
    return json.loads(urllib.request.urlopen(req, timeout=90).read())['text']


def make(key, voice, instr, text, tmp):
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
    trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', trim, '-ac', '1', '-b:a', '40k', enc], check=True)
    return enc


def main():
    key = key_from_args()
    only = [a for a in sys.argv[1:] if not a.startswith('--') and a not in (sys.argv[sys.argv.index('--keychain') + 1] if '--keychain' in sys.argv else '',)]
    data = missions()
    os.makedirs(os.path.join(ROOT, 'js', 'nar'), exist_ok=True)
    weak = []
    with tempfile.TemporaryDirectory() as tmp:
        for mid, m in data.items():
            if only and mid not in only:
                continue
            items = [(mid + '_intro' + str(i), 'narator', t) for i, t in enumerate(m['intro'])]
            items += [(mid + '_outro' + str(i), 'narator', t) for i, t in enumerate(m['outro'])]
            items += [(mid + '_' + k, w, t) for k, w, t in m.get('says', [])]
            out, total = {}, 0
            for k, who, text in items:
                voice, instr = VOICE.get(who, VOICE['narator'])
                best, score = None, -1
                for attempt in range(2):
                    enc = make(key, voice, instr, text, tmp)
                    heard = transcribe(key, enc)
                    a, b = norm(text), norm(heard)
                    sc = difflib.SequenceMatcher(None, a, b).ratio()
                    if sc > score:
                        score, best = sc, open(enc, 'rb').read()
                    if sc >= 0.8:
                        break
                total += len(best)
                out[k] = 'data:audio/mpeg;base64,' + base64.b64encode(best).decode()
                flag = '' if score >= 0.8 else '  <-- slab'
                if score < 0.8:
                    weak.append((k, round(score, 2), text[:60]))
                print(f'{k} [{who}] {score:.2f}{flag}', flush=True)
            dest = os.path.join(ROOT, 'js', 'nar', mid + '.js')
            with open(dest, 'w', encoding='utf8') as f:
                f.write('// Generat de tools/nar.py (OpenAI text-to-speech).\nvar G = globalThis.G || (globalThis.G = {});\nG.NAR = G.NAR || {};\n')
                for k, v in out.items():
                    f.write('G.NAR[' + json.dumps(k) + '] = "' + v + '";\n')
            print(f'== {mid}: {len(out)} replici, {total // 1024} KB', flush=True)
    if weak:
        print('\nREPLICI SLABE (sub 0,8):')
        for w in weak:
            print('  ', w)


if __name__ == '__main__':
    main()
