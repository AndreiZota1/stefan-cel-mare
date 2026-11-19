#!/usr/bin/env python3
"""Picturile din joc (poveștile misiunilor, filmul de început), făcute cu OpenAI (gpt-image-2).

Cheia se ia ca la voci: --keychain <intrare> (Keychain), nu se afișează și nu se scrie nicăieri.
Ieșirea: tools/poze_src/<cheie>.png (sursele mari, în afara git), apoi `node tools/poze.js` le face WebP în assets/poze/.

    python3 tools/picturi.py --keychain claude-voce-openai              # toate care lipsesc
    python3 tools/picturi.py --keychain claude-voce-openai st1 mh1      # doar unele (le reface)
"""
import base64, json, os, sys, threading, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'poze_src')
sys.path.insert(0, HERE)
from voci import key_from_args  # noqa: E402

STYLE = (' Oil painting in the manner of 19th-century European academic history painting (Jan Matejko, Theodor Aman):'
         ' dramatic natural light, rich but muted earthy colors, visible brushwork, cinematic wide composition,'
         ' historically accurate late-medieval Eastern European costumes, armor and weapons.'
         ' No text, no letters, no writing, no watermark, no signature, no frame, no border.')
MOL = 'Moldavian soldiers in sheepskin coats and black lambskin hats, boyars in mail, red banners with a golden aurochs head'
VAL = 'Wallachian soldiers, banners with a black eagle holding a cross in its beak'
OTO = 'Ottoman janissaries in tall white felt hats, sipahi cavalry in turbans, red and green banners with crescents'

P = {
    # ---- Ștefan cel Mare ----
    'st1': f'Spring 1457 by the Siret river in Moldavia: young prince Stephen (later Stephen the Great), long brown hair, red velvet tunic, golden crown, leads a cavalry charge across a meadow against the troops of the usurper Petru Aron. {MOL}. Morning light, river and willows.',
    'st2': f'Winter 1465: siege of the stone fortress of Chilia at the mouths of the Danube. Moldavian bombards fire at the walls from earth ramparts, frozen marshes and reeds, grey winter sky, smoke drifting. {MOL}.',
    'st3': 'December 1467, night: battle in the burning wooden market town of Baia in northern Moldavia. Moldavian soldiers attack the Hungarian royal army of King Matthias Corvinus among blazing houses and a stone church; snow, orange firelight reflected on the snow, sparks in the dark sky.',
    'st4': f'January 1475, battle of Vaslui (the High Bridge): thick winter fog in a marshy valley; Moldavian peasants and soldiers ambush the Ottoman army from the forested hills, long wooden alphorn trumpets (bucium) sounding from the forest; Ottoman troops bogged down in mud near a high wooden bridge. {OTO}.',
    'st5': 'Summer 1476, dusk: legend of Neamț fortress. Stephen the Great, wounded and exhausted, on horseback with a few soldiers before the closed gate of the stone fortress of Neamț on a forested hill; his elderly mother in a dark dress and white veil stands on the battlements and points him back toward the battle. Smoke of the Ottoman army on the horizon.',
    'st6': 'Autumn 1497, battle of the Cosmin forest: on a narrow road through an old oak forest, Moldavians cut the pre-sawn trees that crash down onto the column of armored Polish knights; horses rearing, chaos, falling oaks, dust and leaves, red banners with the white eagle among the knights.',
    # ---- Mircea cel Bătrân ----
    'mi1': f'1395, battle of Rovine: Wallachian archers shoot from the edge of a forest at the Ottoman army trapped in a misty marsh (rovine); lances breaking, horses stuck in the reeds. Prince Mircea the Elder, crowned, long grey-brown beard, blue and gold robe, on horseback commands from the forest edge. {VAL}. {OTO}.',
    'mi2': '1396, battle of Nicopolis on the Danube: French and Burgundian crusader knights in shining plate armor and colorful heraldic surcoats charge uphill into rows of sharpened wooden stakes defended by Ottoman infantry archers; dust, banners, the fortress of Nicopolis on a cliff above the river.',
    'mi3': f'1404: the army of Mircea the Elder of Wallachia crosses the Danube in boats to storm the stone fortress of Dârstor (Silistra) on the southern bank; siege ladders, arrows, morning river mist. {VAL}.',
    # ---- Vlad Țepeș ----
    'vl1': 'Summer 1456: Vlad III Dracula (Vlad the Impaler), stern pale face, long black mustache, red velvet cap decorated with pearls and a gold star, dark fur-trimmed cloak, on a black horse at the head of his army before the stone princely court and church of Târgoviște in Wallachia. Banners with a black eagle holding a cross.',
    'vl2': 'Wallachia, 1459: boyars in torn rich clothes forced to carry stones up a steep cliff to build the small stone fortress of Poenari high above the Argeș river gorge, forested mountains, Vlad the Impaler on horseback watching from the path below, overcast sky.',
    'vl4': 'Winter 1462, night: Wallachian horsemen of Vlad the Impaler ride across the frozen Danube under a cold moon; on the far southern bank Ottoman fortresses and villages burn, orange glow on the ice and snow, snowfall.',
    'vl3': 'June 1462, the Night Attack at Târgoviște: the cavalry of Vlad the Impaler storms the vast Ottoman camp at night, torches, burning tents, panicked janissaries in white felt hats, horses, the sultan\'s huge striped tent in the background lit by fires.',
    # ---- Mihai Viteazul ----
    'mh1': 'August 1595, battle of Călugăreni: Michael the Brave (Mihai Viteazul), dark beard, tall fur hat with a long white heron feather, red caftan over armor, swinging a battle axe, leads the charge across a narrow wooden bridge over a marshy river against the Ottoman army; his soldiers follow; Ottoman cannons on the far hill, smoke.',
    'mh2': 'October 1595 at Giurgiu on the Danube: the armies of Wallachia and Transylvania attack the Ottoman rear guard; the long pontoon bridge of boats across the wide river is broken and burning, Ottoman soldiers falling into the water, cannon smoke, autumn light.',
    'mh3': 'October 1599, battle of Șelimbăr near Sibiu: the army of Michael the Brave with Székely light horsemen in fur hats charges the Transylvanian army of Cardinal Andrew Báthory, winged hussars, cannons, the snowy Carpathian mountains in the background, the town of Sibiu with its towers in the distance.',
    'mh4': 'Spring 1600: Michael the Brave on a white horse, fur hat with white heron feather, before the stone fortress of Suceava in Moldavia with his army; three banners fly together above his soldiers: Wallachia (black eagle with a cross), Transylvania and Moldavia (aurochs head); dramatic sky with breaking sunlight.',
    # ---- Iancu de Hunedoara ----
    'ia1': 'Spring 1442 near Sibiu in Transylvania: John Hunyadi (Iancu de Hunedoara), clean-shaven, long hair, silver plate armor, leads armored Hungarian and Transylvanian knights against Ottoman raiders in a green valley, banner with a black raven holding a golden ring, Carpathian foothills.',
    'ia2': 'December 1443, the Long Campaign: the crusader army of John Hunyadi fights through the snowy Zlatica mountain pass in the Balkans; the Ottomans block the pass with felled trees and walls of ice; soldiers in armor climbing in deep snow, bitter cold, grey blizzard.',
    'ia3': 'July 1456, siege of Belgrade: the fortress of Belgrade at the confluence of the Danube and the Sava; the elderly Franciscan friar John of Capistrano raises a wooden cross and leads crowds of peasant crusaders out of the walls against the Ottoman siege cannons below; smoke, banners, church bells.',
    # ---- Mehmed Cuceritorul ----
    'me1': 'May 1453, fall of Constantinople: the young Sultan Mehmed II, turban, short beard, rich caftan, on a white horse watches his giant bronze bombards fire at the massive Theodosian land walls; janissaries in white felt hats storm the breach; smoke; the great dome of Hagia Sophia in the distance.',
    'me3': f'June 1459: the Ottoman army of Sultan Mehmed II besieges the huge triangular Serbian fortress of Smederevo on the Danube with its many tall square towers; tents, cannons, banners. {OTO}.',
    'me2': f'July 1476, battle of Valea Albă (White Valley): Ottoman janissaries storm the fortified Moldavian camp of Stephen the Great in a forested valley; wooden barricades, smoke, fierce close combat among the trees. {OTO}. {MOL}.',
    # ---- Jagiello ----
    'pl1': 'July 1410, battle of Grunwald: the Polish-Lithuanian army clashes with the Teutonic Knights in white mantles with black crosses; King Władysław II Jagiełło, crowned, watches from a hill; Lithuanian light cavalry, Polish knights under red banners with a white eagle; dust and broken lances. Epic composition.',
    'pl2': 'Summer 1410: the Polish-Lithuanian army besieges the enormous red-brick Gothic castle of Marienburg (Malbork) of the Teutonic Order on the river Nogat; camp tents, cannons, banners with the white eagle, summer clouds.',
    # ---- Mengli Giray ----
    'ta1': 'September 1482: Crimean Tatar horse archers of Khan Mengli Giray in fur hats and quilted coats ride across the steppe; the city of Kiev on the hills above the Dnieper burns in the distance under a smoky sky.',
    'ta2': 'Summer 1502: the Crimean Tatar army of Khan Mengli Giray burns Sarai, the capital of the Great Horde on the Volga steppe; felt yurts and a large golden khan\'s tent on fire, horsemen with banners, wide steppe horizon.',
    # ---- filmul de început ----
    'cine_carpati': 'Panoramic landscape at dawn: the Carpathian mountains with fir forests above a wide river valley, a painted Moldavian monastery with a tall roof and a stone fortress on a hill, morning mist, a few horsemen on the road. Epic, peaceful, golden light.',
    'cine_oaste': f'A vast Ottoman army marching across the Balkan plain toward the Danube at sunset: thousands of soldiers, janissaries, sipahi cavalry, war camels, red and green banners with crescents, dust clouds glowing in the low sun; ominous, epic.',
    'cine_titlu': 'A medieval battlefield at dusk after the battle: broken lances and fallen banners in the grass, smoke rising, and on a hill a lone horseman holding a tall banner against a dramatic red and gold sky, embers floating in the air. Epic, solemn.',
    'erou_mircea': 'Portrait of Mircea the Elder, prince of Wallachia (c. 1400), as in the fresco of Cozia monastery: golden crown, long brown beard, blue robe with gold patterns, purple mantle, holding a sword, standing before the Danube with his army behind. Noble, wise, majestic.',
    'erou_vlad': 'Portrait of Vlad III Dracula (Vlad the Impaler), prince of Wallachia (1460s), as in the Ambras castle portrait: red velvet cap with pearls and a gold star, long black mustache, piercing dark eyes, stern pale face, dark fur cloak, a dark forest and a castle behind him at dusk. Intense, dramatic.',
    'erou_stefan': 'Portrait of Stephen the Great, prince of Moldavia (1457–1504), as in the Humor gospel miniature: long brown hair, mustache, golden crown, red velvet robe with gold, holding a sword, a painted Moldavian monastery and green hills behind him. Heroic, proud.',
    'erou_mihai': 'Portrait of Michael the Brave (Mihai Viteazul), prince of Wallachia, Transylvania and Moldavia (1600), as in the Sadeler engraving but in color: tall fur hat with a white heron feather and a jewel, dark full beard, red caftan with fur collar over armor, holding a battle axe, three banners behind him. Brave, determined.',
}
SIZE = {k: ('1536x1024' if not k.startswith('erou_') else '1024x1536') for k in P}


def gen(key, k, quality):
    body = {'model': 'gpt-image-2', 'prompt': P[k] + STYLE, 'size': SIZE[k], 'quality': quality, 'n': 1}
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    for attempt in range(3):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=400))
            open(os.path.join(OUT, k + '.png'), 'wb').write(base64.b64decode(r['data'][0]['b64_json']))
            return k, r.get('usage', {}).get('output_tokens', 0)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code in (400, 401, 403):
                return k, 'EROARE ' + str(e.code) + ' ' + msg
        except Exception as e:  # rețea
            msg = str(e)
    return k, 'EȘUAT ' + msg


def main():
    key = key_from_args()
    os.makedirs(OUT, exist_ok=True)
    args = [a for a in sys.argv[1:] if not a.startswith('--') and a not in (sys.argv[sys.argv.index('--keychain') + 1] if '--keychain' in sys.argv else '',)]
    quality = 'high' if '--high' in sys.argv else 'medium'
    todo = args or [k for k in P if not os.path.exists(os.path.join(OUT, k + '.png'))]
    lock = threading.Lock()
    tot = 0
    with ThreadPoolExecutor(4) as ex:
        for k, res in ex.map(lambda k: gen(key, k, quality), todo):
            with lock:
                if isinstance(res, int):
                    tot += res
                print(k, res, flush=True)
    print('jetoane de imagine:', tot)


if __name__ == '__main__':
    main()
