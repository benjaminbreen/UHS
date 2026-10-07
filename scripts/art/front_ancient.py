"""Roman and Persian buildings wired into the game's frames.

`adopt` points every frame of the families below at a spec for the Roman
or Persian builders, with the footprint the new sprite stands on;
`FrontAncientPainter` is what scripts/art/buildings.py asks to draw it.

    house-roman-ob-N[-urban-FORM]     front_roman: casa, insula, shop row, domus, temple
    westasian-courtyard-iranian-*     front_persian: domed, vaulted and courtyard houses

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
    m = re.match(r'westasian-courtyard-iranian-(small|medium|large)-(\d+)$', base)
    if m:
        return persian_spec(m.group(1), int(m.group(2)), nw, seed), (nw, fh)
    return None


def adopt(recipes):
    """Point the Roman and Persian frames at these builders."""
    n = 0
    for name, r in recipes.items():
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
    'casa': lambda s, i: _house(rome.Casa, s, i),
    'insula': lambda s, i: _house(rome.Insula, s, i),
    'tabernae': lambda s, i: _house(rome.Tabernae, s, i),
    'domus': lambda s, i: rome.domus(s, i),
    'temple': lambda s, i: rome.temple(s, i),
    'house': lambda s, i: persia.house(s, i),
    'vaulted': lambda s, i: persia.vaulted(s, i),
    'persian': lambda s, i: persia.persian(s, i),
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
        self.door_size = (22, info['door_h'])
        self.door_ground = info['base'] + 1
        self.bottom = info['base'] + 1
        _PAINTED[key] = dict(self.__dict__)

    def render(self):
        return self.image
