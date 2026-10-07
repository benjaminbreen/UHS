"""Roman and Persian buildings wired into the game's frames.

`adopt` points every frame of the families below at a spec for the Roman
or Persian builders, with the footprint the new sprite stands on;
`FrontAncientPainter` is what scripts/art/buildings.py asks to draw it.

    house-roman-ob-N[-urban-FORM]     front_roman: casa, insula, shop row, stall, domus, temple
    hall-thermae-*                    front_roman: the baths
    roman-domus-roman-*               front_roman: the domus in Italian, African and Eastern walls
    hall-schola-* (new)               front_roman: a school's columned hall
    religious-roman-temple-* (new)    front_roman: Corinthian, Ionic and Tuscan temples
    religious-greek-temple-* (new)    front_roman: Doric temples
    westasian-courtyard-iranian-*     front_persian: domed, vaulted and courtyard houses
    westasian-courtyard-{levantine,arabian,nile,maghrebi}-*
                                      front_westasia: the same forms in each region's walls
    religious-persian-mosque-*        front_persian: Safavid, Seljuk and mud-brick mosques
    hall-hammam-*-3, hall-madrasa-*-3 front_persian: the Iranian look of the bath and the
                                      madrasa (new frames; regional-looks.json routes Iran to them)

Footprints widen by SCALE, as the European houses' do: these are drawn at
the adult's scale, where the old frames were drawn small.
"""
from pathlib import Path
import json
import re
import sys
import zlib

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_roman as rome  # noqa: E402
from art import front_persian as persia  # noqa: E402
from art import front_westasia as wa  # noqa: E402
from art.front_classical import BUILDERS as CLASSICAL_BUILDERS  # noqa: E402

SCALE = 1.45
WALLS = ['stucco', 'stucco-ochre', 'stucco', 'render']
SHOPS = [('bakery', 'wine'), ('thermopolium', 'cloth'), ('wine', 'bakery'), ('cloth', 'thermopolium')]


def roman_spec(form, v, nw, seed):
    """The builder and spec for a Roman frame of `form`, variant v, nw cells wide."""
    W = nw * 16
    shops = SHOPS[v % len(SHOPS)]
    if form in (None, 'cottage', 'hut'):
        heights = [64] if form == 'hut' or v % 2 == 0 else [64, 46]
        return 'casa', dict(W=W, storeys=[WALLS[v % len(WALLS)]], heights=heights, seed=seed)
    if form == 'row':
        return 'insula', dict(W=W, heights=[76, 56], seed=seed, shops=shops * 3,
                              tone='tegula-pale' if v % 2 else 'tegula')
    if form == 'tall':
        return 'insula', dict(W=W, heights=[76, 56, 50, 46][:3 + v % 2], seed=seed, shops=shops * 3)
    if form == 'shop':
        return 'tabernae', dict(W=W, shops=shops[:max(1, min(2, W // 80))], seed=seed)
    if form == 'inn':
        return 'tabernae', dict(W=W, shops=('thermopolium', 'wine', 'cloth')[:max(1, min(3, W // 76))], seed=seed)
    if form == 'wide':
        return 'domus', dict(W=W, seed=seed, shops=shops * 2)
    if form == 'stall':
        goods = ('loaves:quadratus', 'pots:jug', 'cloth', 'pots:amphora')[v % 4]
        return 'stall', dict(W=W, goods=goods, awning=v)
    if form in ('hall', 'colonnade'):
        cols = max(4, min(8, round((W - 24) / 30) + 1))
        return 'temple', dict(columns=cols - cols % 2)
    return None


def persian_spec(size, v, nw, seed):
    W = nw * 16
    if size == 'small':
        return ('house', dict(W=W, dome=v != 2)) if v != 1 else ('vaulted', dict(W=W))
    if size == 'medium':
        return 'persian', dict(W=W, wing=max(36, W // 5), street=58, front=18, court=70, far=20, face=32,
                               portal=0.36 + 0.1 * (v % 2))
    return 'persian', dict(W=W, wing=round(W * 0.19), portal=0.42 + 0.06 * (v % 2))


def spec_for(name, r):
    base = re.sub(r'-(north|east|west)$', '', name)
    fw, fh = r['footprint']
    nw = max(3, round(fw * SCALE))
    seed = zlib.crc32(base.encode()) % 997
    m = re.match(r'house-roman-ob-(\d+)(?:-urban-([a-z]+))?$', base)
    if m:
        got = roman_spec(m.group(2), int(m.group(1)), nw, seed)
        return got and (got, (nw, fh))
    m = re.match(r'roman-domus-roman-(italian|north-african|eastern)-(medium|large)-(\d+)$', base)
    if m:
        region, v = m.group(1), int(m.group(3))
        wall = {'italian': 'stucco', 'north-african': 'stucco-ochre', 'eastern': 'sandstone'}[region]
        return ('domus', dict(W=nw * 16, storeys=[wall], tone='tegula-pale' if region == 'north-african' else 'tegula',
                              seed=seed, shops=SHOPS[v % len(SHOPS)] * 2)), (nw, fh)
    m = re.match(r'hall-thermae-(small|medium|large)-\d+$', base)
    if m:
        return ('thermae', dict(W=nw * 16)), (nw, fh)
    m = re.match(r'religious-persian-mosque-(small|medium|large)-(\d+)$', base)
    if m:
        nw = max(12, round(fw * 1.2))
        return ('mosque', dict(W=nw * 16, look=MOSQUES[int(m.group(2)) % 3],
                               court=max(80, fh * 8))), (nw, fh)
    m = re.match(r'westasian-courtyard-iranian-(small|medium|large)-(\d+)$', base)
    if m:
        return persian_spec(m.group(1), int(m.group(2)), nw, seed), (nw, fh)
    m = re.match(r'westasian-courtyard-(levantine|arabian|nile|maghrebi)-(small|medium|large)-(\d+)$', base)
    if m:
        region, size, v = m.group(1), m.group(2), int(m.group(3))
        W = nw * 16
        if size == 'small':
            return ('wa-small', dict(region=region, W=W, dome=region == 'levantine' and v != 1)), (nw, fh)
        if size == 'medium':
            return ('wa-court', dict(region=region, W=W, wing=max(36, W // 5), street=58, front=18, court=70,
                                     far=20, face=34, portal=0.36 + 0.1 * (v % 2))), (nw, fh)
        return ('wa-court', dict(region=region, W=W, wing=round(W * 0.19), portal=0.42 + 0.06 * (v % 2))), (nw, fh)
    return None


TEMPLE_LOOKS = {'roman-temple': ('corinthian', 'ionic', 'tuscan'), 'greek-temple': ('doric', 'doric', 'ionic')}
TEMPLE_COLUMNS = {'small': 4, 'medium': 6, 'large': 8}


def temple_width(kind, n):
    k = rome.TEMPLES[kind]
    return (n - 1) * k['span'] + k['d'] + 36


def new_recipes(recipes):
    """Frames the game has no family for yet: the schola, cloned from the
    union hall, and the Roman and Greek temples, cloned from a precinct."""
    for scale in ('small', 'medium', 'large'):
        src = recipes.get(f'hall-union-hall-{scale}-0')
        if src:
            n = {'small': 4, 'medium': 4, 'large': 6}[scale]
            fw = -(-temple_width('ionic', n) // 16)
            recipes[f'hall-schola-{scale}-0'] = {
                **src, 'label': {'small': 'Schola', 'medium': 'Schola', 'large': 'Schola'}[scale],
                'description': 'A school under a columned porch: the master\'s chair, benches, and boys at their wax tablets.',
                'family': 'schola', 'footprint': [fw, src['footprint'][1]],
                'frontAncient': ('temple', dict(kind='ionic', columns=n, podium=10, col_h=56, depth=52,
                                                dedication='SCHOLA'))}
        tmpl = recipes.get(f'religious-mesopotamian-temple-{scale}-0')
        for recipe, looks in TEMPLE_LOOKS.items():
            for look, kind in enumerate(looks):
                n = TEMPLE_COLUMNS[scale] - (2 if kind == 'tuscan' and scale != 'small' else 0)
                fw = -(-temple_width(kind, n) // 16)
                fh = {'small': 8, 'medium': 10, 'large': 12}[scale]
                spec = dict(kind=kind, columns=n, depth=60 + fh * 2)
                if recipe == 'greek-temple' or kind == 'tuscan':
                    spec['dedication'] = ''
                elif scale == 'large':
                    spec['dedication'] = 'IOVI OPTIMO MAXIMO'
                recipes[f'religious-{recipe}-{scale}-{look}'] = {
                    **{k: v for k, v in tmpl.items() if k not in ('sacredVoxel', 'style', 'shadowFrame')},
                    'label': {'small': 'Temple', 'medium': 'Temple', 'large': 'Great temple'}[scale],
                    'description': 'A temple on its podium: the god\'s image inside, the altar before the steps.',
                    'wall': 'lime-plaster', 'roof': 'gable', 'roofMaterial': 'tile', 'height': 140,
                    'footprint': [fw, fh], 'entrance': [fw // 2, fh],
                    'religious': True, 'family': recipe, 'recipe': recipe,
                    'frontAncient': ('temple', spec), 'front': True}


PERSIAN_LOOK = 3
MOSQUES = ('safavid', 'seljuk', 'vernacular')


def persian_civic(recipes):
    """The Iranian look of the bath and the madrasa, as frames of their own
    beside the shared ones the Ottoman, Arab and Maghrebi towns build."""
    for fam, kind in (('hall-hammam', 'hammam'), ('hall-madrasa', 'madrasa')):
        for scale in ('small', 'medium', 'large'):
            src = recipes.get(f'{fam}-{scale}-0')
            if not src:
                continue
            fw, fh = src['footprint']
            nw = max(8, round(fw * 1.3))
            spec = dict(W=nw * 16)
            if kind == 'madrasa':
                spec.update(wing=max(36, nw * 16 // 6), court=max(70, fh * 10))
            recipes[f'{fam}-{scale}-{PERSIAN_LOOK}'] = {
                **{k: v for k, v in src.items() if k != 'shadowFrame'},
                'footprint': [nw, fh], 'entrance': [nw // 2, fh], 'frontAncient': (kind, spec), 'front': True}


def adopt(recipes):
    """Point the Roman and Persian frames at these builders, and add the
    frames they need that the game had no family for."""
    new_recipes(recipes)
    persian_civic(recipes)
    from art.front_classical import game_recipes
    game_recipes(recipes)
    n = 0
    for name, r in recipes.items():
        if r.get('frontAncient'):
            continue
        got = spec_for(name, r)
        if not got:
            continue
        spec, (fw, fh) = got
        r['frontAncient'] = spec
        r['front'] = True
        # The court is painted with its own shade; the runtime court light is
        # for the old sprites, whose void this would misplace.
        r.pop('roofVoid', None)
        r['footprint'] = [fw, fh]
        r['entrance'] = [fw // 2, fh]
        n += 1
    return n


BUILDERS = {
    **CLASSICAL_BUILDERS,
    'casa': lambda s, i: _house(rome.Casa, s, i),
    'insula': lambda s, i: _house(rome.Insula, s, i),
    'tabernae': lambda s, i: _house(rome.Tabernae, s, i),
    'domus': lambda s, i: rome.domus(s, i),
    'thermae': lambda s, i: rome.thermae(s, i),
    'stall': lambda s, i: rome.stall(s, i),
    'temple': lambda s, i: rome.temple(s, i),
    'house': lambda s, i: persia.house(s, i),
    'vaulted': lambda s, i: persia.vaulted(s, i),
    'persian': lambda s, i: persia.persian(s, i),
    'mosque': lambda s, i: persia.mosque(s, i),
    'wa-court': lambda s, i: wa.courtyard(s['region'], {k: v for k, v in s.items() if k != 'region'}, i),
    'wa-small': lambda s, i: wa.small(s['region'], {k: v for k, v in s.items() if k != 'region'}, i),
    'madrasa': lambda s, i: persia.madrasa(s, i),
    'hammam': lambda s, i: persia.hammam(s, i),
}


def _house(cls, spec, info):
    b = cls(spec)
    im = b.build()
    info.update(x0=b.x0, W=b.W, base=b.base, door_x=b.door_x, door_h=getattr(b, 'door_h', 44))
    return im


_PAINTED = {}


class FrontAncientPainter:
    """What scripts/art/buildings.py needs from a painter. A frame's turned
    copies share its spec, so each spec is painted once."""

    def __init__(self, r, material=None):
        key = json.dumps(r['frontAncient'], sort_keys=True, default=str)
        if key in _PAINTED:
            self.__dict__.update(_PAINTED[key])
            return
        kind, spec = r['frontAncient']
        info = {}
        im = BUILDERS[kind](spec, info)
        self.image = im
        self.w, self.h = im.size
        self.anchor_x = info['x0'] + info['W'] // 2
        self.door_x = info['door_x']
        self.door_size = (info.get('door_width', 22), info['door_h'])
        self.door_ground = info.get('door_base', info['base']) + 1
        self.no_door = info.get('doorless', False)
        self.bottom = info['base'] + 1
        _PAINTED[key] = dict(self.__dict__)

    def render(self):
        return self.image
