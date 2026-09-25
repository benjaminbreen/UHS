"""Fungi: fruiting bodies on the ground, brackets on dead wood, and lichen.
Keys are `nature-fungus-<flora id>`; `nature-understory-fungi` is the generic
cluster placed before a species is named. Light from the upper left."""
from PIL import Image
import math
import random
from art.shrubs import ramp
from art.canopy import rgb
from art.succulents import _new, _put, _blob, _stem, _rng

LITTER = ['#5a4430', '#7a5e3a', '#9a7a48']


def _cap(im, pal, cx, cy, rx, ry, gill, flat=0.0):
    """A domed cap over a gill shadow. `flat` squashes the top."""
    for y in range(int(cy - ry - 1), int(cy + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            u, v = (x - cx) / rx, (y - cy) / ry
            if v > 0 or u * u + v * v * (1 - flat) > 1.02:
                continue
            light = -u * 0.55 - v * 0.5
            t = 2 + light * 3.2
            if u * u + v * v * (1 - flat) > 0.8:
                t = 0 if u > 0.1 else 1
            _put(im, x, y, pal[max(0, min(6, round(t)))])
    for x in range(int(cx - rx + 1), int(cx + rx)):
        _put(im, x, cy + 1, gill)


def _mushroom(im, cap, stem, cx, base, h, rx, ry, gill, lean=0.0, flat=0.0, ring=False):
    top = base - h
    for y in range(int(top), int(base) + 1):
        x = cx + lean * (base - y)
        w = max(1, rx * 0.28 + (0.6 if y > base - 2 else 0))
        for k in range(-int(w), int(w) + 1):
            _put(im, x + k, y, stem[5 if k < 0 else 3 if k == 0 else 2])
    if ring:
        _put(im, cx + lean * h * 0.6 - 2, top + h * 0.35, stem[6]); _put(im, cx + lean * h * 0.6 + 2, top + h * 0.35, stem[3])
    _cap(im, cap, cx + lean * h, top, rx, ry, gill, flat)


def _litter(im, rng, y, x0, x1):
    for x in range(x0, x1):
        if rng.random() < 0.55:
            _put(im, x, y + rng.choice((0, 0, 1)), rng.choice(LITTER))


def _log(im, pal, x0, x1, y, r, rng, moss=None):
    _stem(im, pal, (x0, y), (x1, y), r)
    end = ramp('#b89868')
    for yy in range(int(y - r + 1), int(y + r)):
        for xx in range(int(x1 - 1), int(x1 + 2)):
            if ((xx - x1) / 1.6) ** 2 + ((yy - y) / (r - 0.5)) ** 2 < 1:
                _put(im, xx, yy, end[4] if (yy - y) % 3 else end[2])
    for x in range(int(x0), int(x1 - 2), 3):
        _put(im, x + rng.randrange(0, 2), y + rng.randrange(-1, 2), pal[1])
    if moss:
        m = ramp(moss)
        for x in range(int(x0), int(x1)):
            if rng.random() < 0.45:
                _put(im, x, y - r + 1, m[4]); _put(im, x, y - r + 2, m[2])


def _bracket(im, pal, cx, cy, w, h, bands=None):
    """A shelf growing out of wood: a half-disc, lit on top, banded at the rim."""
    for y in range(int(cy - h), int(cy + 1)):
        for x in range(int(cx - w), int(cx + w + 1)):
            u, v = (x - cx) / w, (y - cy) / h
            if u * u + v * v > 1:
                continue
            r = math.hypot(u, v)
            t = 3 + (-u * 0.3 - v * 0.9)
            if bands:
                t = bands[int(r * len(bands) * 0.999)]
            _put(im, x, y, pal[max(0, min(6, round(t)))])
    for x in range(int(cx - w), int(cx + w + 1)):
        _put(im, x, cy + 1, pal[0])


def generic():
    rng = _rng('fungi')
    cap, stem = ramp('#9a6a40'), ramp('#e8dcc4')
    im = _new(22, 16)
    _litter(im, rng, 13, 3, 19)
    for cx, h, rx in ((7, 6, 3.5), (13, 8, 4.5), (17, 4, 2.5)):
        _mushroom(im, cap, stem, cx, 13, h, rx, 3, '#6a5040')
    return im


def fly_agaric():
    rng = _rng('fly-agaric')
    cap, stem = ramp('#d8302a'), ramp('#eee8da')
    im = _new(28, 26)
    _litter(im, rng, 23, 3, 25)
    for cx, h, rx, ry, flat in ((8, 9, 4, 3, 0.0), (17, 15, 7, 4, 0.5), (23, 5, 2.5, 2.5, 0.0)):
        _mushroom(im, cap, stem, cx, 23, h, rx, ry, '#f0ead8', flat=flat, ring=h > 8)
        top = 23 - h
        for k in range(int(rx * 1.3)):
            _put(im, cx + rng.uniform(-rx + 1, rx - 1), top - rng.uniform(0.5, ry - 0.5), '#f6f2e6')
    return im


def chanterelle():
    rng = _rng('chanterelle')
    pal = ramp('#e8a830')
    im = _new(24, 18)
    _litter(im, rng, 15, 2, 22)
    for cx, h, w in ((6, 6, 3.5), (12, 9, 4.5), (18, 7, 3.5)):
        # A funnel: narrow at the foot, flaring to a wavy rim.
        for y in range(15 - h, 16):
            t = (15 - y) / h
            half = 1 + t * t * w
            for x in range(int(cx - half), int(cx + half) + 1):
                side = (x - cx) / max(1, half)
                _put(im, x, y, pal[5 if side < -0.4 else 3 if side < 0.4 else 2])
        top = 15 - h
        for x in range(int(cx - w), int(cx + w) + 1):
            _put(im, x, top + (1 if (x + cx) % 3 == 0 else 0), pal[6 if x < cx else 4])
            _put(im, x, top + 1 + (1 if (x + cx) % 3 == 0 else 0), pal[1])
    return im


def porcini():
    rng = _rng('porcini')
    cap, stem = ramp('#8a5230'), ramp('#e0d0a8')
    im = _new(26, 22)
    _litter(im, rng, 19, 3, 23)
    for cx, h, rx in ((9, 10, 6), (18, 6, 4)):
        for y in range(19 - h, 20):
            t = (y - (19 - h)) / h
            w = rx * (0.35 + 0.35 * t)
            for k in range(-int(w), int(w) + 1):
                _put(im, cx + k, y, stem[5 if k < -w / 3 else 3 if k < w / 3 else 1])
        _cap(im, cap, cx, 19 - h, rx + 1, rx * 0.8, '#c8b060')
        _put(im, cx - 2, 19 - h - rx * 0.6, cap[6])
    return im


def morel():
    rng = _rng('morel')
    cap, stem = ramp('#8a6a44'), ramp('#e6d8b8')
    im = _new(20, 20)
    _litter(im, rng, 17, 2, 18)
    for cx, h in ((7, 13), (13, 10)):
        for y in range(17 - 4, 18):
            for k in (-1, 0, 1):
                _put(im, cx + k, y, stem[4 - k * 2])
        for y in range(17 - h, 17 - 3):
            t = (y - (17 - h)) / (h - 4)
            w = 0.8 + 2.4 * math.sin(t * math.pi * 0.65)
            for x in range(int(cx - w), int(cx + w) + 1):
                pit = (x + y * 2) % 3 == 0 or (y % 3 == 0)
                _put(im, x, y, cap[1] if pit else cap[5 if x < cx else 3])
    return im


def psilocybe():
    rng = _rng('psilocybe')
    cap, stem = ramp('#b88a50'), ramp('#e8dcc0')
    im = _new(22, 20)
    _litter(im, rng, 17, 2, 20)
    for cx, h, lean in ((6, 10, -0.15), (11, 13, 0.08), (16, 8, 0.2)):
        _mushroom(im, cap, stem, cx, 17, h, 2.6, 3.2, '#5a4038', lean=lean)
        _put(im, cx + lean * h, 17 - h - 3, cap[6])
        _put(im, cx, 16, '#4a6a9a')
    return im


def matsutake():
    rng = _rng('matsutake')
    cap, stem = ramp('#7a5a3e'), ramp('#e8e0cc')
    im = _new(24, 20)
    for x in range(2, 22):
        if rng.random() < 0.6:
            _put(im, x, 17 + rng.choice((0, 1)), '#8a5a2a')
            _put(im, x + 1, 16 + rng.choice((0, 1)), '#a0703a')
    for cx, h, rx in ((9, 9, 5), (16, 6, 3.5)):
        _mushroom(im, cap, stem, cx, 17, h, rx, 3.5, '#e0d4b8', flat=0.3)
    return im


def lingzhi():
    rng = _rng('lingzhi')
    pal = ramp('#8a2a1a')
    stem = ramp('#5a2418')
    im = _new(24, 20)
    _litter(im, rng, 17, 2, 22)
    for cx, cy, w, h in ((8, 9, 6, 3), (16, 12, 5, 2.5)):
        for y in range(int(cy + 1), 18):
            _put(im, cx + (y - cy) * 0.2, y, stem[2]); _put(im, cx + 1 + (y - cy) * 0.2, y, stem[1])
        _bracket(im, pal, cx, cy, w, h * 2, bands=[4, 3, 2, 3, 5])
        # The lacquered shine that made it the mushroom of immortality.
        _put(im, cx - 2, cy - h, '#f0c8a0'); _put(im, cx - 1, cy - h, pal[6])
    return im


def reindeer_lichen():
    rng = _rng('reindeer-lichen')
    pal = ramp('#c8ccb8')
    im = _new(30, 14)
    for _ in range(90):
        x, y = rng.gauss(15, 6), rng.gauss(8, 2.2)
        if not (2 < x < 28 and 2 < y < 12):
            continue
        # Coral tips: a pale point over a shaded fork.
        _put(im, x, y, pal[5 if x < 15 else 4])
        _put(im, x + 1, y + 1, pal[2])
        _put(im, x - 1, y + 1, pal[3])
    return im


def fairy_ring():
    rng = _rng('fairy-ring')
    cap, stem = ramp('#c8a878'), ramp('#eee4cc')
    im = _new(46, 22)
    for k in range(16):
        a = k / 16 * math.tau + rng.uniform(-0.1, 0.1)
        cx, cy = 23 + math.cos(a) * 18, 12 + math.sin(a) * 7
        if rng.random() < 0.2:
            continue
        _mushroom(im, cap, stem, cx, cy + 2, 3, 2, 1.8, '#a08060')
    return im


def termite_mushroom():
    """Termitomyces rising from a termite mound: the termites farm the fungus
    in their galleries, and after rain it fruits through the mound."""
    rng = _rng('termite-mushroom')
    mound = ramp('#a8583a')
    cap, stem = ramp('#d8c8a8'), ramp('#f0ece0')
    im = _new(36, 34)
    for y in range(14, 32):
        t = (y - 14) / 18
        w = 3 + t * 12
        for x in range(int(18 - w), int(18 + w) + 1):
            side = (x - 18) / w
            _put(im, x, y, mound[4 if side < -0.5 else 3 if side < 0 else 2 if side < 0.6 else 1])
    for y in range(16, 31, 3):
        _put(im, 18 + rng.randrange(-4, 5), y, mound[0])
    for cx, h, rx in ((8, 12, 5), (28, 9, 4), (21, 17, 5)):
        _mushroom(im, cap, stem, cx, 31, h, rx, 2.5, '#a89878', flat=0.6)
        _put(im, cx, 31 - h - 3, cap[1]); _put(im, cx, 31 - h - 4, cap[0])
    return im


def stinkhorn():
    """Bridal veil stinkhorn: a dark-tipped stalk hung with a lace skirt."""
    rng = _rng('stinkhorn')
    im = _new(20, 30)
    _litter(im, rng, 27, 3, 17)
    lace = ramp('#f0ead8')
    for y in range(10, 27):
        _put(im, 9, y, lace[5]); _put(im, 10, y, lace[3])
    for y in range(12, 25):
        t = (y - 12) / 13
        w = 2 + t * 5
        for x in range(int(9.5 - w), int(9.5 + w) + 1):
            if (x + y) % 2 == 0 and abs(x - 9.5) > 1:
                _put(im, x, y, lace[4 if x < 9 else 2])
    for y in range(6, 11):
        for x in (8, 9, 10, 11):
            _put(im, x, y, '#3a3a24' if (x + y) % 3 else '#6a6a40')
    return im


def llao_llao():
    """Cyttaria: orange pitted balls on a southern beech branch."""
    rng = _rng('llao-llao')
    bark = ramp('#6a5a4a')
    fruit = ramp('#e89040')
    im = _new(34, 18)
    _log(im, bark, 4, 29, 11, 3.5, rng, moss='#7a9a4a')
    for cx, cy, r in ((10, 6, 3), (17, 5, 3.5), (24, 7, 2.5), (14, 15, 2)):
        _blob(im, fruit, cx, cy, r, r)
        for _ in range(int(r * 2)):
            _put(im, cx + rng.randint(-1, 1), cy + rng.randint(-1, 1), fruit[1])
    return im


def log_with(id_, bark, moss, shelves, pal, bands=None, caps=False):
    rng = _rng(id_)
    im = _new(40, 22)
    _log(im, ramp(bark), 4, 35, 15, 4.5, rng, moss=moss)
    for cx, cy, w, h in shelves:
        if caps:
            _mushroom(im, pal, ramp('#e8dcc4'), cx, cy + 2, 3, w, h, '#e0d0b0', flat=0.4)
            for _ in range(2):
                _put(im, cx + rng.uniform(-w + 1, w - 1), cy - rng.uniform(1, h), pal[6])
        else:
            # Shelves jut from the log's near face, not its top.
            _bracket(im, pal, cx, cy + 5, w, h, bands)
    return im


def cup_fungus():
    """Cookeina: stalked pink cups on a fallen twig in rainforest litter."""
    rng = _rng('cup-fungus')
    pal = ramp('#e0507a')
    im = _new(26, 18)
    _litter(im, rng, 15, 2, 24)
    _stem(im, ramp('#5a4a3a'), (3, 14), (23, 13), 1.2)
    for cx, h, w in ((7, 5, 2.5), (13, 7, 3.5), (19, 4, 2.5)):
        top = 14 - h
        for y in range(top + 3, 14):
            _put(im, cx, y, pal[5])
        # A goblet: the cup flares from the stalk to a fringed rim.
        for k in range(3):
            half = 1 + (w - 1) * (3 - k) / 3
            for x in range(int(cx - half), int(cx + half) + 1):
                _put(im, x, top + k, pal[1] if k == 0 and abs(x - cx) < half - 1 else pal[5 if x < cx else 3])
        _put(im, cx - w, top - 1, '#f0e0c8'); _put(im, cx + w, top - 1, '#f0e0c8')
    return im


def puffball():
    rng = _rng('puffball')
    pal = ramp('#e8e0cc')
    im = _new(22, 14)
    for cx, cy, r in ((7, 9, 3), (13, 8, 4), (18, 10, 2)):
        _blob(im, pal, cx, cy, r, r * 0.85)
        for _ in range(int(r * 2)):
            _put(im, cx + rng.uniform(-r + 1, r - 1), cy - rng.uniform(0, r - 1), pal[3])
    return im


def field_mushroom():
    rng = _rng('field-mushroom')
    cap, stem = ramp('#ece6d8'), ramp('#f2eee4')
    im = _new(22, 16)
    for x in range(3, 19):
        if rng.random() < 0.6:
            _put(im, x, 13 + rng.choice((0, 1)), rng.choice(('#6a8a3a', '#8aa04a')))
    for cx, h, rx in ((7, 5, 3), (13, 7, 4.5), (17, 3, 2)):
        _mushroom(im, cap, stem, cx, 13, h, rx, 2.5, '#b06a6a', flat=0.3)
    return im


def fungi():
    return {
        'nature-understory-fungi': generic(),
        'nature-fungus-fly-agaric': fly_agaric(),
        'nature-fungus-chanterelle': chanterelle(),
        'nature-fungus-porcini': porcini(),
        'nature-fungus-morel': morel(),
        'nature-fungus-psilocybe': psilocybe(),
        'nature-fungus-matsutake': matsutake(),
        'nature-fungus-lingzhi': lingzhi(),
        'nature-fungus-reindeer-lichen': reindeer_lichen(),
        'nature-fungus-fairy-ring': fairy_ring(),
        'nature-fungus-termite-mushroom': termite_mushroom(),
        'nature-fungus-stinkhorn': stinkhorn(),
        'nature-fungus-llao-llao': llao_llao(),
        'nature-fungus-turkey-tail': log_with('turkey-tail', '#6a5040', '#6a8a3a',
            [(12, 11, 4, 3), (19, 12, 5, 3), (27, 11, 4, 3), (16, 16, 3, 2)], ramp('#7a6a78'), bands=[1, 3, 2, 5, 6]),
        'nature-fungus-tinder-fungus': log_with('tinder-fungus', '#d8d4c8', None,
            [(13, 12, 4, 4), (25, 11, 5, 5)], ramp('#8a8478')),
        'nature-fungus-chicken-of-the-woods': log_with('chicken-of-the-woods', '#5a4a3a', '#6a8a3a',
            [(11, 11, 5, 3), (18, 9, 6, 3), (26, 11, 5, 3), (16, 13, 4, 2)], ramp('#f0a030'), bands=[5, 4, 3, 2, 5]),
        'nature-fungus-shiitake': log_with('shiitake', '#5a4a3a', '#6a8a3a',
            [(11, 9, 3, 2.5), (19, 8, 4, 3), (28, 10, 3, 2.5)], ramp('#7a4a2a'), caps=True),
        'nature-fungus-cup-fungus': cup_fungus(),
        'nature-fungus-puffball': puffball(),
        'nature-fungus-field-mushroom': field_mushroom(),
        'nature-fungus-cinnabar-bracket': log_with('cinnabar-bracket', '#5a4a3a', '#5a8a3a',
            [(11, 11, 4, 3), (19, 10, 5, 3), (28, 11, 4, 3)], ramp('#e04a1a'), bands=[5, 4, 4, 3, 2]),
        'nature-fungus-wood-ear': log_with('wood-ear', '#5a4a3a', '#5a8a3a',
            [(12, 12, 3, 3), (18, 11, 4, 4), (26, 12, 3, 3)], ramp('#6a3a2a'), bands=[4, 3, 2, 1, 3]),
        'nature-fungus-ghost-fungus': log_with('ghost-fungus', '#4a4038', None,
            [(12, 11, 5, 3), (20, 10, 6, 4), (29, 11, 4, 3)], ramp('#e0dcc0'), bands=[5, 4, 4, 3, 2]),
    }
