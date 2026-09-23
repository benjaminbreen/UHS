"""Market pitches, built from parts, one kit per culture.

A pitch is a base (a mat, a table, a counter, a bench), a cover (none, a
cloth or palm shade, an awning, a peaked canopy, a parasol, a roofed booth),
a size, and the goods of one trade. The kit says which parts a culture used
and in what colours; the variant picks the trade and the size, and a seed
does the rest. Trades and kits are listed in market-kits.json, which the
market planner reads to lay one trade to a row.

Cloth moves: covered pitches carry `-m1..-m3` frames, the valance or fringe
stirring, the hangings swinging a pixel.
"""
import json
import math
import random
from pathlib import Path
from .core import Canvas, RAMPS, soft_outline

ROOT = Path(__file__).resolve().parents[3]
KITS = json.loads((ROOT / 'src/content/graphics/market-kits.json').read_text())
FORMS = KITS['forms']

# Five-step ramps, dark to light.
CLOTH = {
    'cotton': ['#6b5e48', '#948469', '#bfae8c', '#ddcfb0', '#f4ead2'],
    'madder': ['#5d2320', '#8a3529', '#b04a33', '#cd6a44', '#e59a6c'],
    'cochineal': ['#4d1224', '#7a1b34', '#a82a45', '#cf4a5c', '#ea8088'],
    'indigo': ['#15243c', '#223a5c', '#31557f', '#4a78a2', '#7ea6c6'],
    'woad': ['#23364a', '#34506a', '#4a6e8a', '#6c90a8', '#9ab6c6'],
    'weld': ['#5e4a14', '#8a6e1f', '#b8952e', '#dcbd4c', '#f0dc86'],
    'ochre': ['#5a3a18', '#84562a', '#ae7640', '#cf9a5c', '#e8c08a'],
    'green': ['#1f3a24', '#2f5634', '#437a47', '#63a062', '#95c68e'],
    'saffron': ['#6a3410', '#9a4e18', '#cc6e22', '#ec9636', '#f8c26a'],
    'purple': ['#3a1d3a', '#5a2c56', '#7c4274', '#a0649a', '#c898c0'],
    'black': ['#141216', '#211e24', '#302c34', '#454048', '#625c66'],
}
STRAW = ['#4a3c20', '#6f5a2a', '#93793a', '#b39a4f', '#d2bd76']
PALM = ['#3a3a1c', '#5e5a28', '#857c38', '#aba04e', '#cdc47a']
WICKER = ['#513c1c', '#70552b', '#8e703c', '#a88a52', '#c8ab74']
TERRACOTTA = ['#4a2a1c', '#6b3f27', '#8d5836', '#ab7149', '#cf9a6c']
BUFF = ['#4f4128', '#705c38', '#8f7a4c', '#ab9765', '#d2c092']
STONE = ['#4b4539', '#6f6756', '#958b74', '#bdb298', '#ddd4ba']
PLASTER = ['#6e6470', '#a39a98', '#d2c8b6', '#eee4ca', '#fffaea']
BRASS = ['#4b3711', '#6f541c', '#a07c2e', '#d0b257', '#f6e6a4']
TILE = ['#2a2c33', '#3d414a', '#565c66', '#767d86', '#9aa1a8']
SHINGLE = ['#3a2a1c', '#5a4028', '#7a5836', '#9a744a', '#bc9666']
LACQUER = ['#3a0f0c', '#5e1a14', '#8c2a1e', '#b8432c', '#de6a48']
WOOD = RAMPS['oak7'][1:6]
DARKWOOD = RAMPS['walnut7'][1:6]


def ramp_of(kit, name):
    return CLOTH[name] if name in CLOTH else globals()[name.upper()]


# -- goods ----------------------------------------------------------------------

def dome(c, cx, y, r, ramp, speck=None):
    """A heap seen from the front: lit up and left, each item a pixel or two."""
    for dy in range(r + 1):
        half = int(round(math.sqrt(max(0, r * r - (dy * 1.6) ** 2)) + .2))
        for dx in range(-half, half + 1):
            u = dx / max(1, half)
            t = 4 if u < -.3 and dy > 0 else 3 if u < .35 else 2
            if dy == 0: t -= 1
            if speck and (dx * 3 + dy * 5) % 4 == 0: t = max(0, t - 1)
            c.set(cx + dx, y - dy, ramp[t])
        if speck and half > 1:
            c.set(cx - half // 2, y - dy, speck)


def pot(c, cx, y, h, w, ramp, neck=True):
    for k in range(h):
        t = k / max(1, h - 1)
        half = w / 2 * (0.55 + 0.45 * math.sin(math.pi * (0.15 + 0.8 * t))) if t < .85 else w / 2 * .45
        hw = max(1, int(half))
        for dx in range(-hw, hw + 1):
            u = dx / hw
            c.set(cx + dx, y - k, ramp[4 if u < -.4 else 3 if u < .2 else 2 if u < .7 else 1])
    if neck:
        c.hline(cx - int(w * .25), cx + int(w * .25), y - h, ramp[4])


def amphora(c, cx, y, ramp):
    for k in range(13):
        half = [0, 1, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1, 1][k]
        for dx in range(-half, half + 1):
            c.set(cx + dx, y - k, ramp[4 if dx < 0 else 3 if dx == 0 else 1])
    c.set(cx - 2, y - 11, ramp[2]); c.set(cx + 2, y - 11, ramp[1])
    c.hline(cx - 1, cx + 1, y - 13, ramp[4])


def basket(c, x, y, w, h, contents=None, speck=None):
    for k in range(h):
        for i in range(w):
            c.set(x + i, y - k, WICKER[3 if (i + k) % 2 else 2] if 0 < i < w - 1 else WICKER[1])
    c.hline(x, x + w - 1, y - h, WICKER[4])
    if contents:
        dome(c, x + w // 2, y - h - 1, max(2, w // 2 - 1), contents, speck)


def cone(c, cx, y, h, ramp):
    for k in range(h):
        half = int((h - k) * .55)
        for dx in range(-half, half + 1):
            c.set(cx + dx, y - k, ramp[4 if dx < 0 else 3 if dx == 0 else 2])
    c.set(cx, y - h, ramp[4])


def bolt(c, x, y, h, ramp):
    for k in range(h):
        c.set(x, y - k, ramp[4]); c.set(x + 1, y - k, ramp[3]); c.set(x + 2, y - k, ramp[1])
    c.hline(x, x + 2, y - h, ramp[4])


def folded(c, x, y, w, n, ramp, border):
    for i in range(n):
        yy = y - i * 2
        c.hline(x, x + w, yy, ramp[2 + (i % 2)])
        c.hline(x, x + w, yy - 1, ramp[4])
        c.set(x, yy, border[3]); c.set(x + w, yy - 1, border[2])
        for bx in range(x + 1, x + w, 3): c.set(bx, yy, border[3])


def disc(c, cx, y, r, ramp, score=None):
    for dx in range(-r, r + 1):
        h = int(round(math.sqrt(max(0, r * r - dx * dx)) * .55)) + 1
        for k in range(h):
            c.set(cx + dx, y - k, ramp[4 if dx < -r // 3 else 3 if dx < r // 3 else 2])
    if score: c.hline(cx - r // 2, cx + r // 2, y - 1, score)


def fish(c, x, y, ramp):
    c.hline(x + 1, x + 5, y, ramp[3]); c.hline(x + 1, x + 4, y - 1, ramp[4])
    c.set(x, y, ramp[1]); c.set(x, y - 1, ramp[1]); c.set(x + 5, y - 1, '#141216')


def cob(c, x, y, ramp):
    for i in range(5):
        c.set(x + i, y, ramp[3 if i % 2 else 2]); c.set(x + i, y - 1, ramp[4 if i % 2 else 3])
    c.set(x + 5, y, STRAW[3]); c.set(x + 5, y - 1, STRAW[4])


def plume(c, x, y, h, ramp, lean=0):
    for k in range(h):
        xx = x + round(lean * k / h)
        c.set(xx, y - k, ramp[4 if k > h * .6 else 3]); c.set(xx + 1, y - k, ramp[2])
    c.set(x + lean, y - h, ramp[4])


def bird(c, x, y, ramp, wattle='#b8322a'):
    body = [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (0, -1), (1, -1), (2, -1), (3, -1), (4, -1),
            (1, -2), (2, -2), (3, -2), (0, -2), (-1, -2), (-1, -3)]
    for dx, dy in body: c.set(x + dx, y + dy, ramp[2] if dy > -1 else ramp[3])
    c.set(x - 1, y - 4, ramp[1]); c.set(x - 2, y - 3, wattle); c.set(x + 5, y - 1, ramp[1])
    c.set(x + 1, y + 1, STRAW[1]); c.set(x + 3, y + 1, STRAW[1])


def lantern(c, x, y, ramp):
    c.set(x + 1, y - 6, '#141216')
    for k in range(5):
        half = 2 if 0 < k < 4 else 1
        for dx in range(-half, half + 1):
            c.set(x + 1 + dx, y - k, ramp[4 if dx < 0 else 3 if dx == 0 else 2])
    c.hline(x, x + 2, y + 1, '#141216')


GOODS = {}


def goods(*names):
    def reg(fn):
        for n in names: GOODS[n] = fn
        return fn
    return reg


@goods('maize')
def _maize(c, x0, x1, y, rng, hang):
    kinds = [CLOTH['weld'], CLOTH['madder'], CLOTH['indigo'], CLOTH['cotton']]
    x = x0 + 1
    while x < x1 - 7:
        k = rng.randrange(len(kinds))
        for row in range(3):
            for i in range(3 - row):
                cob(c, x + i * 3 + row, y - row * 2, kinds[(k + i + row) % 4])
        x += 11
    if hang: hang(lambda hx, hy: [cob(c, hx - 1, hy + k * 2, kinds[k % 4]) for k in range(3)])


@goods('chiles', 'spices')
def _heaps(c, x0, x1, y, rng, hang, trade=None):
    palettes = ([CLOTH['madder'], CLOTH['green'], CLOTH['saffron'], CLOTH['cochineal']] if trade != 'spices'
                else [CLOTH['saffron'], CLOTH['madder'], CLOTH['weld'], CLOTH['ochre'], CLOTH['green']])
    x = x0 + 4
    while x < x1 - 3:
        p = palettes[rng.randrange(len(palettes))]
        if trade == 'spices':
            for i in range(3): c.hline(x - 3, x + 3, y - i, BUFF[2 + i % 2])
            cone(c, x, y - 3, 6 + rng.randrange(3), p)
        else:
            dome(c, x, y, 3, p, speck=p[4])
        x += 8
    if hang and trade != 'spices':
        hang(lambda hx, hy: [c.set(hx + (k % 2), hy + k, CLOTH['madder'][3 - k % 2]) for k in range(7)])


@goods('pottery', 'porcelain')
def _pots(c, x0, x1, y, rng, hang, trade=None):
    ramps = [TERRACOTTA, BUFF] if trade != 'porcelain' else [['#27405e', '#4a6a8c', '#b9c6cc', '#e2e7e6', '#fbfcf8']]
    x = x0 + 3
    while x < x1 - 4:
        r = ramps[rng.randrange(len(ramps))]
        h, w = rng.choice([(6, 5), (8, 6), (5, 7), (10, 7)])
        pot(c, x, y, h, w, r)
        if trade == 'porcelain':
            c.hline(x - 1, x + 1, y - h // 2, '#2d4d7a')
        x += w + 2
    if rng.random() < .6:
        for i in range(3): disc(c, x1 - 5, y - i * 2, 3, ramps[0])


@goods('mantas', 'cloth', 'silk')
def _cloth(c, x0, x1, y, rng, hang, trade=None):
    dyes = {'mantas': ['cotton', 'cotton', 'indigo', 'cochineal', 'weld'],
            'cloth': ['madder', 'woad', 'weld', 'cotton', 'indigo', 'green'],
            'silk': ['cochineal', 'saffron', 'green', 'purple', 'indigo']}[trade]
    x = x0 + 1
    while x < x1 - 8:
        if trade == 'silk' or rng.random() < .4:
            for i in range(2): bolt(c, x + i * 3, y, 7 + rng.randrange(3), CLOTH[rng.choice(dyes)])
            x += 8
        else:
            folded(c, x, y, 7, 3 + rng.randrange(2), CLOTH[rng.choice(dyes)], CLOTH[rng.choice(dyes)])
            x += 10
    if hang:
        d = CLOTH[rng.choice(dyes)]; b = CLOTH[rng.choice(dyes)]
        hang(lambda hx, hy: [c.hline(hx - 2, hx + 3, hy + k, (b if k % 3 == 0 else d)[3 if k < 5 else 2]) for k in range(8)])


@goods('cacao', 'kola', 'shea', 'dates', 'yams', 'greens', 'fruit')
def _baskets(c, x0, x1, y, rng, hang, trade=None):
    fill = {'cacao': (CLOTH['ochre'], '#3a2014'), 'kola': (CLOTH['madder'], '#f0dcc0'),
            'shea': (['#8a7a5a', '#b3a57e', '#d6cba6', '#ece4c6', '#fbf6e2'], None),
            'dates': (['#2a1410', '#4a2418', '#6c3a20', '#8e552c', '#b07a44'], None),
            'yams': (['#3a2618', '#5a3c26', '#7a5536', '#9c724c', '#be9468'], None),
            'greens': (CLOTH['green'], '#c8e0a0'), 'fruit': (CLOTH['saffron'], '#7a3a8a')}[trade]
    x = x0 + 1
    while x < x1 - 8:
        if rng.random() < .55: basket(c, x, y, 8, 4, fill[0], fill[1])
        else: dome(c, x + 4, y, 4, fill[0], fill[1])
        x += 10
    if trade == 'cacao' and x < x1 - 4:
        for i in range(2): pot(c, x + 2 + i * 4, y, 4, 3, CLOTH['madder'], False)


@goods('feathers')
def _feathers(c, x0, x1, y, rng, hang):
    plumes = [CLOTH['green'], CLOTH['cochineal'], CLOTH['weld'], CLOTH['indigo']]
    x = x0 + 3
    while x < x1 - 4:
        pot(c, x, y, 5, 5, TERRACOTTA)
        for k in range(3):
            plume(c, x - 1 + k, y - 5, 7 + rng.randrange(4), plumes[rng.randrange(4)], lean=k - 1)
        x += 9


@goods('obsidian')
def _obsidian(c, x0, x1, y, rng, hang):
    c.hline(x0 + 1, x1 - 1, y, CLOTH['cotton'][3])
    for x in range(x0 + 2, x1 - 2, 3):
        c.set(x, y - 1, CLOTH['black'][1]); c.set(x, y - 2, CLOTH['black'][3]); c.set(x + 1, y - 1, CLOTH['black'][2])
        if rng.random() < .3: c.set(x, y - 3, CLOTH['black'][4])
    for mx in (x0 + 6, x1 - 8):
        disc(c, mx, y - 1, 3, CLOTH['black'])
        c.set(mx - 1, y - 3, '#b8c4d0')


@goods('fowl')
def _fowl(c, x0, x1, y, rng, hang):
    x = x0 + 2
    while x < x1 - 8:
        if rng.random() < .5:
            basket(c, x, y, 8, 5)
            bird(c, x + 2, y - 6, ['#1d1a1c', '#2e2a2e', '#4a3f3a', '#6c5a4c', '#8e7a66'])
        else:
            bird(c, x + 2, y, ['#1d1a1c', '#2e2a2e', '#4a3f3a', '#6c5a4c', '#8e7a66'])
        x += 10


@goods('fish')
def _fish(c, x0, x1, y, rng, hang):
    silver = ['#33403f', '#4f6360', '#748984', '#9aaca4', '#d2ddd4']
    x = x0 + 1
    while x < x1 - 7:
        if rng.random() < .4:
            basket(c, x, y, 8, 4)
            for k in range(2): fish(c, x + 1, y - 5 - k * 2, silver)
            x += 10
        else:
            for k in range(3): fish(c, x + (k % 2), y - k * 2, silver)
            x += 8
    if hang: hang(lambda hx, hy: [fish(c, hx - 2, hy + 2 + k * 3, silver) for k in range(2)])


@goods('amphorae')
def _amphorae(c, x0, x1, y, rng, hang):
    x = x0 + 3
    while x < x1 - 3:
        amphora(c, x, y, rng.choice([TERRACOTTA, BUFF]))
        x += 6


@goods('bread', 'cheese', 'calabashes')
def _rounds(c, x0, x1, y, rng, hang, trade=None):
    r = {'bread': (['#4a2a14', '#7a4a22', '#a86c34', '#cc9250', '#e8b878'], '#5a3418'),
         'cheese': (['#6a5418', '#9a7e28', '#c8a63c', '#e4c85a', '#f6e496'], None),
         'calabashes': (['#5a3a18', '#8a6230', '#b88a48', '#dcb06a', '#f2d29a'], None)}[trade]
    x = x0 + 4
    while x < x1 - 4:
        for tier in range(1 + rng.randrange(3)):
            disc(c, x, y - tier * 3, 3, r[0], r[1])
        x += 8


@goods('brass', 'lanterns')
def _brass(c, x0, x1, y, rng, hang, trade=None):
    x = x0 + 3
    while x < x1 - 4:
        if trade == 'lanterns': lantern(c, x, y, CLOTH['madder'])
        elif rng.random() < .5: disc(c, x, y, 3, BRASS)
        else: pot(c, x, y, 7, 5, BRASS)
        x += 7
    if hang:
        hang(lambda hx, hy: lantern(c, hx, hy + 6, CLOTH['madder'] if trade == 'lanterns' else BRASS))


@goods('tea')
def _tea(c, x0, x1, y, rng, hang):
    x = x0 + 1
    while x < x1 - 7:
        for k in range(1 + rng.randrange(3)):
            c.rect(x, y - 2 - k * 3, x + 5, y - k * 3, DARKWOOD[3 - k % 2])
            c.hline(x, x + 5, y - 2 - k * 3, DARKWOOD[4])
        pot(c, x + 8, y, 6, 5, ['#27405e', '#4a6a8c', '#b9c6cc', '#e2e7e6', '#fbfcf8'])
        x += 13


@goods('rugs')
def _rugs(c, x0, x1, y, rng, hang):
    for x in range(x0 + 1, x1 - 5, 7):
        p = CLOTH[rng.choice(['madder', 'indigo', 'cochineal'])]
        for k in range(4): c.hline(x, x + 5, y - k, p[2 + k % 2])
        c.hline(x, x + 5, y - 4, p[4])
    if hang:
        p, q = CLOTH[rng.choice(['madder', 'cochineal'])], CLOTH[rng.choice(['indigo', 'weld'])]
        hang(lambda hx, hy: [c.hline(hx - 3, hx + 4, hy + k, (q if k in (0, 9) or (k % 3 == 1 and (hx + k) % 2) else p)[3]) for k in range(11)])


# -- bases ----------------------------------------------------------------------

def base_mat(c, x0, x1, g, ramp):
    for k in range(2):
        for x in range(x0, x1 + 1):
            c.set(x, g - k, ramp[3 if (x // 2 + k) % 2 else 2] if k else ramp[1 + (x // 2) % 2])
    return g - 2


def base_rug(c, x0, x1, g, ramp):
    for k in range(2):
        for x in range(x0, x1 + 1):
            c.set(x, g - k, ramp[3] if (x % 4 < 2) == (k == 0) else ramp[1])
    c.hline(x0, x1, g - 2, ramp[4])
    return g - 2


def base_table(c, x0, x1, g, w, h=7):
    top = g - h
    c.hline(x0, x1, top, w[4]); c.hline(x0, x1, top + 1, w[2])
    for lx in (x0 + 1, x1 - 2):
        for k in range(top + 2, g + 1): c.set(lx, k, w[2]); c.set(lx + 1, k, w[1])
    return top - 1


def base_counter(c, x0, x1, g, w, front, h=13):
    top = g - h
    c.hline(x0, x1, top, w[4]); c.hline(x0, x1, top + 1, w[3]); c.hline(x0, x1, top + 2, w[1])
    for y in range(top + 3, g + 1):
        for x in range(x0 + 1, x1):
            c.set(x, y, front[3] if (x + y // 3) % 9 else front[2])
    c.hline(x0 + 1, x1 - 1, top + 3, front[1])
    c.vline(x0, top, g, w[2]); c.vline(x1, top, g, w[1])
    return top - 1


def base_masonry(c, x0, x1, g, paint):
    top = g - 13
    c.rect(x0, top, x1, g, STONE[3])
    c.hline(x0, x1, top, STONE[4]); c.hline(x0, x1, top + 1, STONE[2])
    c.rect(x0 + 2, top + 4, x1 - 2, g - 2, PLASTER[3])
    c.hline(x0 + 2, x1 - 2, top + 4, paint[2]); c.hline(x0 + 2, x1 - 2, g - 2, paint[2])
    c.vline(x0 + 2, top + 4, g - 2, paint[2]); c.vline(x1 - 2, top + 4, g - 2, paint[1])
    # Jars let into the counter top, as in a street bar.
    for jx in range(x0 + 5, x1 - 4, 9):
        c.hline(jx - 1, jx + 1, top, '#2a1e18')
    return top - 1


def base_bench(c, x0, x1, g, rug):
    top = g - 9
    c.rect(x0, top, x1, g, PLASTER[3]); c.hline(x0, x1, top, PLASTER[4]); c.vline(x1, top, g, PLASTER[1])
    for y in range(top + 1, g - 1):
        for x in range(x0 + 3, x1 - 3):
            c.set(x, y, rug[3] if (x + y) % 4 else rug[1])
    c.hline(x0 + 3, x1 - 3, g - 1, rug[4])
    return top - 1


def post(c, x, y0, y1, w):
    c.vline(x, y0, y1, w[3]); c.vline(x + 1, y0, y1, w[1])


# -- covers ---------------------------------------------------------------------

def wave(i, motion, amp=1):
    return round(math.sin(i * .9 + motion * math.pi / 2) * amp)


def cover_shade(c, x0, x1, top, g, cloth, border, w, motion, palm=False):
    for px in (x0, x1 - 1): post(c, px, top, g, w)
    thick = 5 if palm else 4
    for k in range(thick):
        for x in range(x0 - 2, x1 + 3):
            if palm:
                col = cloth[3 if (x + k) % 3 else 2] if k < thick - 1 else cloth[1]
            else:
                col = cloth[4] if k == 0 else cloth[3] if k < thick - 1 else cloth[2]
            c.set(x, top + k, col)
    edge = top + thick
    for i, x in enumerate(range(x0 - 2, x1 + 3)):
        if palm:
            drop = 1 + (x * 7 + 3) % 3 + (1 if wave(i, motion) > 0 else 0)
            for k in range(drop): c.set(x, edge + k, cloth[2 - min(1, k)])
        else:
            c.set(x, edge, border[3 if i % 4 < 2 else 1])
            if wave(i, motion) > 0: c.set(x, edge + 1, border[2])
    return edge + 3


def cover_awning(c, x0, x1, top, g, a, b, w, motion):
    for px in (x0, x1 - 1): post(c, px, top + 2, g, w)
    for i, x in enumerate(range(x0 - 2, x1 + 3)):
        band = a if (i // 5) % 2 else b
        for k in range(6):
            c.set(x, top + k + (1 if i > (x1 - x0) // 2 and k == 0 else 0), band[4] if k == 0 else band[3] if k < 4 else band[2])
        # Scalloped valance, stirring.
        sc = 2 if i % 5 in (1, 2, 3) else 1
        sc += wave(i, motion) if i % 5 == 2 else 0
        for k in range(max(0, sc)): c.set(x, top + 6 + k, band[2 - min(1, k)])
    c.hline(x0 - 2, x1 + 2, top, a[4])
    return top + 9


def cover_canopy(c, x0, x1, top, g, a, b, w, motion):
    mid = (x0 + x1) // 2
    post(c, mid, top, g, w); post(c, x0, top + 9, g, w); post(c, x1 - 1, top + 9, g, w)
    for k in range(10):
        half = int((x1 - x0) / 2 * (k + 1) / 10) + 2
        for x in range(mid - half, mid + half + 1):
            band = a if ((x - mid + 40) // 4) % 2 else b
            c.set(x, top + k, band[4 if x < mid - 1 else 3 if x < mid + 2 else 2])
    for i, x in enumerate(range(x0 - 2, x1 + 3)):
        band = a if ((x - mid + 40) // 4) % 2 else b
        c.set(x, top + 10, band[1])
        if i % 3 == 0: c.set(x, top + 11 + (wave(i, motion) > 0), band[2])
    c.set(mid, top - 1, BRASS[4]); c.set(mid, top - 2, BRASS[3])
    return top + 13


def cover_parasol(c, x0, x1, top, g, a, b, w, motion):
    mid = (x0 + x1) // 2
    post(c, mid, top + 2, g - 6, w)
    r = (x1 - x0) // 2 + 3
    for dx in range(-r, r + 1):
        h = int(round(math.sqrt(max(0, r * r - dx * dx)) * .38))
        for k in range(h + 1):
            band = a if ((dx + 40) // 4) % 2 else b
            c.set(mid + dx, top + 6 - k, band[4 if dx < -r // 3 else 3 if dx < r // 3 else 2])
        if dx % 2 == 0: c.set(mid + dx, top + 7 + (wave(dx, motion) > 0), (a if ((dx + 40) // 4) % 2 else b)[1])
    c.set(mid, top + 6 - int(r * .38) - 1, w[4])
    return top + 9


def cover_booth(c, x0, x1, top, g, roof, w, motion, hang=None):
    for px in (x0, x1 - 1): post(c, px, top + 4, g, w)
    for k in range(7):
        grow = k // 2
        for x in range(x0 - 3 - grow, x1 + 4 + grow):
            c.set(x, top + k, roof[4] if k == 0 else roof[3 if (x // 3 + k) % 2 else 2] if k < 6 else roof[1])
    # Raised ends, as on an East Asian roof or a steep shingled one.
    c.set(x0 - 7, top + 5, roof[3]); c.set(x1 + 7, top + 5, roof[3])
    c.hline(x0, x1, top + 8, w[3])
    return top + 9


# -- the pitch ------------------------------------------------------------------

STYLE = {
    'tianguis': dict(bases=['mat', 'mat', 'mat'], covers=[['none'], ['shade', 'palm'], ['palm', 'shade']],
                     mat=PALM, cloths=['cotton'], borders=['cochineal', 'indigo', 'weld'],
                     wood=RAMPS['palewood'][1:6]),
    'roman': dict(bases=['table', 'counter', 'masonry'], covers=[['none'], ['awning'], ['awning']],
                  cloths=['madder', 'weld', 'cotton'], borders=['cotton'], wood=WOOD, front='cotton'),
    'souk': dict(bases=['rug', 'bench', 'bench'], covers=[['none'], ['awning', 'shade'], ['canopy']],
                 mat=CLOTH['madder'], cloths=['indigo', 'madder', 'green'], borders=['cotton', 'weld'], wood=WOOD),
    'eastasia': dict(bases=['table', 'counter', 'counter'], covers=[['parasol'], ['awning', 'parasol'], ['booth']],
                     cloths=['indigo', 'cotton'], borders=['cotton'], wood=['#2a1210'] + LACQUER[1:], roof=TILE,
                     front='indigo'),
    'westafrica': dict(bases=['mat', 'table', 'table'], covers=[['none'], ['parasol'], ['palm', 'parasol']],
                       mat=STRAW, cloths=['indigo', 'weld', 'madder', 'green'], borders=['weld', 'cotton'], wood=DARKWOOD),
    'medieval': dict(bases=['table', 'counter', 'counter'], covers=[['none'], ['awning'], ['booth', 'awning']],
                     cloths=['madder', 'woad', 'weld'], borders=['cotton'], wood=WOOD, roof=SHINGLE, front='woad'),
}


def pitch(kit, v, motion=0):
    trades = KITS['kits'][kit]['trades']
    trade = trades[(v // FORMS) % len(trades)]
    form = v % FORMS
    rng = random.Random(f'{kit}-{v}')
    st = STYLE[kit]
    width = [28, 40, 52][form] + rng.choice([-2, 0, 2])
    cover = rng.choice(st['covers'][form])
    height = {'none': 26, 'shade': 36, 'palm': 38, 'awning': 38, 'canopy': 46, 'parasol': 40, 'booth': 46}[cover]
    height += [0, 0, 6][form]
    c = Canvas(width + 8, height)
    x0, x1, g = 4, width + 3, height - 1
    w = st['wood']
    cloth = CLOTH[rng.choice(st['cloths'])]
    alt = CLOTH[rng.choice([n for n in st['cloths'] if CLOTH[n] is not cloth] or st['cloths'])]
    border = CLOTH[rng.choice(st['borders'])]
    # Cover behind the goods first where it has back posts; its front later.
    top = 2
    hang_at = []
    if cover == 'shade' or cover == 'palm':
        under = cover_shade(c, x0 + 1, x1 - 1, top, g, PALM if cover == 'palm' else cloth, border, w, motion, cover == 'palm')
    elif cover == 'awning':
        under = cover_awning(c, x0 + 1, x1 - 1, top + 2, g, cloth, alt if kit != 'roman' else CLOTH['cotton'], w, motion)
    elif cover == 'canopy':
        under = cover_canopy(c, x0 + 2, x1 - 2, top, g, cloth, CLOTH['cotton'], w, motion)
    elif cover == 'parasol':
        under = cover_parasol(c, x0 + 3, x1 - 3, top, g, cloth, alt, w, motion)
    elif cover == 'booth':
        under = cover_booth(c, x0 + 1, x1 - 1, top + 2, g, st['roof'], w, motion)
    else:
        under = None
    base = st['bases'][form]
    if base == 'mat': surf = base_mat(c, x0, x1, g, st['mat'])
    elif base == 'rug': surf = base_rug(c, x0, x1, g, st['mat'])
    elif base == 'table': surf = base_table(c, x0 + 1, x1 - 1, g, w, 7 + form)
    elif base == 'counter': surf = base_counter(c, x0 + 1, x1 - 1, g, w, CLOTH[st.get('front', 'cotton')])
    elif base == 'masonry': surf = base_masonry(c, x0, x1, g, CLOTH['madder'])
    else: surf = base_bench(c, x0, x1, g, CLOTH[rng.choice(['madder', 'indigo'])])

    def hang(draw):
        if under is None: return
        for hx in range(x0 + 5, x1 - 4, 9 if form else 12):
            if rng.random() < .75:
                sway = wave(hx, motion) if cover in ('shade', 'awning', 'booth') else 0
                draw(hx + (1 if sway > 0 else 0), under - 2)
    fn = GOODS[trade]
    args = (c, x0 + 1, x1 - 1, surf, rng, hang)
    if 'trade' in fn.__code__.co_varnames: fn(*args, trade=trade)
    else: fn(*args)
    # A little life at the foot of the pitch.
    if rng.random() < .45:
        ex = rng.choice([x0 - 2, x1 - 1])
        if kit in ('tianguis', 'westafrica'): basket(c, ex, g, 5, 4, CLOTH['weld'] if kit == 'tianguis' else None)
        else: pot(c, ex + 2, g, 6, 5, TERRACOTTA)
    soft_outline(c, w[0], w[2])
    im = c.image()
    return im


def _family(kit):
    def draw(v, motion=0):
        return pitch(kit, v, motion)
    return draw


PITCHES = {f'pitch-{kit}': _family(kit) for kit in KITS['kits']}
COUNT = {kit: FORMS * len(spec['trades']) for kit, spec in KITS['kits'].items()}
