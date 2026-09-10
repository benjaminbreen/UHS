"""Standing crops and farm props. Every frame is a non-16x16 atlas prop so the
terrain strip never picks one up. Sun from the upper left, 1px ink outline on
masses (leaves, fruit, crowns, timber); stalks and awns stay 1px unoutlined so
grain reads as grain rather than as a blob. Anchor: centre, 2px above the base.
"""
from PIL import Image, ImageDraw
import math
import random

INK = '#2e3a2b'
SHADOW = (39, 44, 32, 65)
G = ['#2f4a2c', '#4c7239', '#6d9646', '#9bbb58', '#c6d67a']
STRAW = ['#6e5a2f', '#a08a48', '#c4ab5c', '#e0cb7d', '#f1e3a2']
WOOD = ['#3a2e20', '#6b5236', '#957143', '#bf9a5e']
WATER = ['#2f4f4d', '#4a7470']

# Ripe accents from src/content/agriculture/crops.ts hue fields.
HUE = {'wheat': '#d9b45a', 'barley': '#cfb163', 'rye': '#c7a866', 'oats': '#d8c27a', 'millet': '#d6b04c',
       'sorghum': '#b5713a', 'teff': '#c9a25e', 'rice': '#d9c05a', 'dry-rice': '#d1b95c', 'maize': '#e0b640',
       'beans': '#7f9a4a', 'squash': '#d98a2e', 'potato': '#8fa04e', 'quinoa': '#c66a5a', 'yam': '#9fae4c',
       'cassava': '#7c9648', 'taro': '#5f8f4a', 'sugarcane': '#8fa85a', 'olive': '#6f7d3f', 'vine': '#6b4c7a',
       'date': '#b8823c', 'orchard': '#c25b4a', 'flax': '#8fa3c9', 'cotton': '#e8e2d2', 'vegetables': '#6f9a48'}

GRAINS = ['wheat', 'barley', 'rye', 'oats', 'millet', 'sorghum', 'teff', 'rice', 'dry-rice']
LOW = ['beans', 'squash', 'potato', 'quinoa', 'yam', 'cassava', 'taro', 'flax', 'cotton', 'vegetables']


def shade(hex_, f):
    r, g, b = int(hex_[1:3], 16), int(hex_[3:5], 16), int(hex_[5:7], 16)
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(c * f))) for c in (r, g, b))


def ramp(hue):
    return [shade(hue, .62), hue, shade(hue, 1.22)]


def canvas(w, h):
    im = Image.new('RGBA', (w, h))
    im.info['anchor'] = [w / 2, h - 2]
    return im, ImageDraw.Draw(im)


def ground(d, w, h, inset=2):
    d.ellipse((inset, h - 7, w - 1 - inset, h - 2), fill=SHADOW)


def layer(im):
    l = Image.new('RGBA', im.size)
    return l, ImageDraw.Draw(l)


def outlined(mass, ink=INK):
    """Outer 1px outline, 4-neighbour, so masses read against any ground."""
    w, h = mass.size
    px = mass.load()
    out = Image.new('RGBA', (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3]:
                    op[x, y] = tuple(int(ink[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
                    break
    out.alpha_composite(mass)
    return out


def finish(im, mass):
    im.alpha_composite(outlined(mass))
    return im


def blob(d, cx, cy, rx, ry, pal, hi=True):
    """Shaded leaf mass: dark body, lit upper-left face, a highlight tick."""
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=pal[1])
    d.ellipse((cx - rx + 1, cy - ry + 1, max(cx - rx + 1, cx + rx - 2), cy), fill=pal[2])
    if hi:
        d.point((cx - rx + 2, cy - ry + 1), fill=pal[3])


# ---------------------------------------------------------------- grains

def head(name, d, x, y, pal, side, rng):
    dk, md, lt = pal
    if name in ('wheat', 'barley'):
        # Dense chevron spike, three wide. Barley carries long pale awns.
        for i in range(7):
            d.point((x, y + i), fill=lt if i % 2 == 0 else md)
            d.point((x - 1, y + i), fill=md if i % 2 == 0 else lt)
            d.point((x + 1, y + i), fill=dk if i % 2 == 0 else md)
        d.point((x, y - 1), fill=md)
        if name == 'wheat':
            d.point((x - 2, y - 2), fill=dk)
            d.point((x + 2, y - 2), fill=dk)
        else:
            d.line((x - 1, y - 1, x - 3, y - 5), fill=dk)
            d.line((x, y - 2, x, y - 6), fill=dk)
            d.line((x + 1, y - 1, x + 3, y - 5), fill=dk)
            d.line((x + 2, y + 2, x + 4, y - 1), fill=dk)
            d.line((x - 2, y + 2, x - 4, y - 1), fill=dk)
    elif name == 'rye':
        # Long slender spike that nods at the tip.
        for i in range(9):
            xx = x + side * (2 if i < 2 else 1 if i < 5 else 0)
            d.point((xx, y + i), fill=lt if i % 2 == 0 else md)
            d.point((xx + side, y + i), fill=dk)
        d.line((x + side * 2, y - 1, x + side * 4, y - 3), fill=lt)
        d.line((x + side, y + 3, x + side * 3, y + 1), fill=lt)
    elif name == 'oats':
        d.line((x, y, x, y + 7), fill=dk)
        for i, dy in enumerate((0, 3, 5)):
            s = side if i % 2 == 0 else -side
            d.line((x, y + dy, x + s * 2, y + dy + 2), fill=md)
            d.rectangle((x + s * 2 - (1 if s < 0 else 0), y + dy + 2, x + s * 2 + (1 if s > 0 else 0), y + dy + 4), fill=md)
            d.point((x + s * 2, y + dy + 2), fill=lt)
            d.point((x + s * 2 + s, y + dy + 4), fill=dk)
    elif name == 'millet':
        # Thick cylinder that nods over at the tip.
        for i in range(8):
            xx = x + side * (2 if i == 0 else 1 if i < 3 else 0)
            d.line((xx - 1, y + i, xx + 1, y + i), fill=md)
            d.point((xx - 1, y + i), fill=lt if i % 2 else md)
            d.point((xx + 1, y + i), fill=dk)
    elif name == 'sorghum':
        d.ellipse((x - 2, y, x + 2, y + 6), fill=md)
        for yy in range(y + 1, y + 6):
            d.point((x - 1 if yy % 2 else x, yy), fill=lt)
            d.point((x + 2, yy), fill=dk)
        d.point((x, y), fill=dk)
    elif name == 'teff':
        for dx, dy in ((-2, -1), (0, -3), (2, -1), (-3, 2), (3, 2)):
            d.line((x, y + 3, x + dx, y + dy), fill=dk)
            d.point((x + dx, y + dy), fill=lt)
            d.point((x + dx // 2, y + 3 + (dy - 3) // 2), fill=md)
    else:  # rice, dry-rice: arching panicle heavy with grain
        pts = [(x, y + 2), (x + side, y), (x + side * 2, y + 1), (x + side * 3, y + 3), (x + side * 3, y + 6)]
        d.line(pts, fill=dk)
        for i, (px, py) in enumerate(pts[1:]):
            d.point((px, py), fill=lt if i % 2 else md)
            d.point((px + side, py + 1), fill=md)


def grain(name, stage, v):
    w, h = 16, 24
    im, d = canvas(w, h)
    ground(d, w, h)
    rng = random.Random(f'{name}{v}')
    ripe = stage == 'ripe'
    if name == 'rice':
        d.rectangle((1, h - 6, w - 2, h - 3), fill=WATER[0])
        for x in (2, 8, 12):
            d.line((x, h - 5, x + 2, h - 5), fill=WATER[1])
    stalk, blade = (STRAW[1], STRAW[2]) if ripe else (G[1], G[2])
    pal = ramp(HUE[name]) if ripe else [G[1], G[2], G[4]]
    xs = [3, 7, 11, 14] if v == 0 else [2, 5, 9, 13]
    if name in ('rice', 'dry-rice', 'teff') and v == 1:
        xs = [2, 4, 7, 10, 13]
    base = h - 3
    lift = 0 if ripe else 3
    for i, x in enumerate(xs):
        lean = rng.choice((-1, 0, 1))
        top = 5 + lift + (i * 3) % 5 + rng.randrange(2)
        if name in ('millet', 'sorghum'):
            top += 1
        d.line((x, base, x + lean, top), fill=stalk)
        d.point((x + lean, top + 2), fill=blade)
        side = 1 if i % 2 else -1
        by = base - 5 - rng.randrange(4)
        d.line((x, by, x + side * 2, by - 3), fill=blade if ripe else G[3])
        head(name, d, x + lean, top - (2 if name in ('oats', 'millet', 'rice', 'dry-rice') else 0), pal, side, rng)
    return im


# ---------------------------------------------------------------- tall crops

def maize(stage, v):
    w, h = 16, 32
    im, d = canvas(w, h)
    ground(d, w, h)
    ripe = stage == 'ripe'
    m, md = layer(im)
    leaf = [G[0], G[1], G[2], G[3]] if not ripe else [G[0], '#6e8a3e', '#93a84a', '#c4bf62']
    for x, top in ((6, 5), (11, 8)) if v == 0 else ((5, 7), (10, 4)):
        base = h - 3
        d.line((x, base, x, top), fill=G[0])
        d.line((x + 1, base, x + 1, top), fill=leaf[2])
        # Tassel on top.
        tas = STRAW[2] if ripe else G[3]
        for dx in (-2, 0, 2):
            d.line((x, top, x + dx, top - 3), fill=tas)
        first = (x + top) % 2
        for i, ly in enumerate(range(base - 4, top + 4, -5)):
            s = 1 if (i + first) % 2 else -1
            md.polygon([(x, ly), (x + s * 7, ly - 4), (x + s * 6, ly - 1), (x + s * 2, ly + 1)], fill=leaf[1])
            md.line((x + s, ly - 1, x + s * 5, ly - 3), fill=leaf[2])
            md.point((x + s * 3, ly - 3), fill=leaf[3])
        if ripe:
            cy = base - 12
            md.rectangle((x - 2, cy, x, cy + 6), fill=HUE['maize'])
            md.line((x - 2, cy, x - 2, cy + 6), fill='#f0d478')
            md.line((x, cy + 1, x, cy + 6), fill='#a8802c')
            md.line((x - 3, cy + 2, x - 3, cy + 7), fill=G[1])
            md.line((x - 1, cy - 2, x - 2, cy - 1), fill='#8a6b3a')
    return finish(im, m)


def sugarcane(stage, v):
    w, h = 16, 32
    im, d = canvas(w, h)
    ground(d, w, h)
    ripe = stage == 'ripe'
    m, md = layer(im)
    cane = ('#c8b060', '#8c7442', '#7b4f4a') if ripe else ('#a9bd6a', '#6f8c44', '#4c6a34')
    canes = [(4, 4, 1), (8, 2, 0), (12, 5, -1)] if v == 0 else [(3, 3, 0), (7, 6, 1), (11, 2, 0), (14, 8, -1)]
    for x, top, lean in canes:
        base = h - 3
        md.line((x, base, x + lean, top), fill=cane[1], width=2)
        md.line((x, base, x + lean, top), fill=cane[0])
        for yy in range(base - 3, top + 3, -5):
            md.line((x - 1, yy, x + 1, yy), fill=cane[2])
        # Leaves arch off the upper nodes.
        for i, yy in enumerate(range(top + 6, top - 1, -3)):
            s = 1 if i % 2 else -1
            xx = x + lean
            d.line([(xx, yy), (xx + s * 3, yy - 3), (xx + s * 6, yy - 1)], fill=G[2] if not ripe else '#9fb35a')
            d.point((xx + s * 3, yy - 3), fill=G[3])
        if ripe:
            d.line((x + lean, top, x + lean, top - 3), fill='#d8d0bc')
            d.point((x + lean - 1, top - 3), fill='#d8d0bc')
            d.point((x + lean + 1, top - 2), fill='#d8d0bc')
    return finish(im, m)


# ---------------------------------------------------------------- low crops

def low(name, stage, v):
    w, h = 16, 18
    im, d = canvas(w, h)
    ground(d, w, h)
    ripe = stage == 'ripe'
    m, md = layer(im)
    rng = random.Random(f'{name}{v}')
    pal = G
    if name in ('potato', 'yam', 'cassava', 'taro', 'beans', 'cotton', 'vegetables') and ripe:
        pal = [G[0], shade(HUE[name], .75), HUE[name], shade(HUE[name], 1.25)]
    if name == 'squash':
        # Sprawling runner with lobed leaves, an orange fruit when ripe.
        run = [(1, 13), (5, 11), (9, 13), (13, 10)] if v == 0 else [(2, 11), (6, 13), (10, 10), (14, 12)]
        d.line(run, fill=G[1])
        for i, (x, y) in enumerate(run):
            md.polygon([(x - 3, y), (x - 1, y - 3), (x + 2, y - 3), (x + 3, y), (x + 1, y + 1)], fill=pal[1])
            md.line((x - 1, y - 2, x + 1, y - 2), fill=pal[2])
            md.point((x - 1, y - 2), fill=pal[3])
        if ripe:
            fx = 11 if v == 0 else 4
            md.ellipse((fx - 2, 11, fx + 2, 14), fill=HUE['squash'])
            md.line((fx - 1, 12, fx, 12), fill='#f3b45a')
            md.point((fx + 2, 14), fill='#9a5a1c')
            md.point((fx, 10), fill=G[1])
        else:
            md.point((8 if v == 0 else 6, 9), fill='#e6c04a')
    elif name in ('potato', 'yam', 'cassava', 'taro'):
        cx = 8
        if name == 'taro':
            d.rectangle((1, h - 6, w - 2, h - 3), fill=WATER[0])
            d.line((3, h - 5, 5, h - 5), fill=WATER[1])
            d.line((10, h - 5, 12, h - 5), fill=WATER[1])
        if name == 'potato':
            # Hilled earth ridge, leafy mound on top.
            d.rectangle((2, 12, 13, 15), fill='#8a7248')
            d.line((3, 12, 12, 12), fill='#a68b58')
            for x, y, r in ((5, 9, 3), (10, 9, 3), (8, 6, 3)) if v == 0 else ((4, 8, 3), (9, 10, 3), (10, 6, 3)):
                blob(md, x, y, r, r - 1, pal)
            if not ripe:
                md.point((8, 3), fill='#e9e5f2')
                md.point((11 if v == 0 else 5, 5), fill='#e9e5f2')
        elif name == 'yam':
            # Vine twines up a stake.
            sx = 8 if v == 0 else 7
            d.line((sx, 15, sx, 2), fill=WOOD[1])
            d.point((sx, 2), fill=WOOD[3])
            for i, y in enumerate((13, 10, 7, 4)):
                s = 1 if (i + v) % 2 else -1
                d.line((sx, y, sx + s * 3, y - 1), fill=pal[1])
                md.polygon([(sx + s * 3, y - 3), (sx + s * 5, y - 1), (sx + s * 3, y + 1), (sx + s * 1, y - 1)], fill=pal[1])
                md.point((sx + s * 3, y - 2), fill=pal[2])
        elif name == 'cassava':
            for x, top in ((5, 6), (10, 3)) if v == 0 else ((4, 4), (9, 7), (13, 5)):
                d.line((x, 15, x, top), fill='#8a4c3c')
                d.point((x, 14), fill='#b0705a')
                # Palmate leaf: fingers radiating from the stem tip.
                for dx, dy in ((-3, -1), (-2, -3), (0, -4), (2, -3), (3, -1)):
                    md.line((x, top, x + dx, top + dy), fill=pal[1])
                    md.point((x + dx, top + dy), fill=pal[2])
                md.point((x, top), fill=pal[2])
        else:  # taro: big arrow leaves on tall petioles
            for x, top, s in ((4, 5, -1), (9, 3, 1), (12, 7, 1)) if v == 0 else ((5, 4, 1), (10, 6, -1)):
                d.line((x, 14, x + s, top + 3), fill=G[1])
                md.polygon([(x + s, top - 2), (x + s + 3, top + 1), (x + s + 1, top + 5), (x + s - 1, top + 5), (x + s - 3, top + 1)], fill=pal[1])
                md.line((x + s, top - 1, x + s, top + 3), fill=pal[2])
                md.point((x + s - 1, top), fill=pal[3])
    elif name == 'beans':
        # Bushy plant with trifoliate leaves; pods hang when ripe.
        for x, y in ((4, 10), (11, 11), (8, 5)) if v == 0 else ((5, 6), (11, 9), (7, 12)):
            d.line((8, 15, x, y), fill=G[1])
            for dx, dy in ((-2, 1), (2, 1), (0, -2)):
                blob(md, x + dx, y + dy, 2, 1, pal, hi=False)
            md.point((x - 2, y - 2), fill=pal[3])
        if ripe:
            for x, y in ((6, 12), (11, 10), (9, 14)):
                d.line((x, y, x, y + 3), fill='#a9a55c')
                d.point((x, y + 3), fill='#7e7c40')
    elif name == 'quinoa':
        for x, top in ((5, 3), (10, 5)) if v == 0 else ((4, 5), (8, 2), (12, 6)):
            d.line((x, 15, x, top + 2), fill=G[1] if not ripe else '#8a6a48')
            d.line((x - 2, 12, x + 2, 12), fill=G[2])
            d.line((x, 10, x + 2, 9), fill=G[2])
            hp = ramp(HUE['quinoa']) if ripe else [G[0], G[1], G[3]]
            md.polygon([(x, top - 2), (x + 2, top + 1), (x + 2, top + 5), (x - 2, top + 5), (x - 2, top + 1)], fill=hp[1])
            for yy in range(top, top + 5):
                md.point((x - 1 if yy % 2 else x, yy), fill=hp[2])
                md.point((x + 1, yy + 1), fill=hp[0])
    elif name == 'flax':
        stem = STRAW[1] if ripe else G[1]
        xs = (2, 5, 8, 11, 14) if v == 0 else (3, 6, 9, 12)
        for i, x in enumerate(xs):
            top = 3 + (i * 2) % 3
            d.line((x, 15, x, top), fill=stem)
            d.point((x + (1 if i % 2 else -1), 10), fill=STRAW[2] if ripe else G[2])
            if ripe:
                md.rectangle((x - 1, top - 1, x, top), fill='#b59a55')
                md.point((x - 1, top - 1), fill='#dcc27a')
            else:
                md.rectangle((x - 1, top - 1, x + 1, top + 1), fill='#6f8ec4')
                md.point((x - 1, top - 1), fill='#b9cbe8')
                md.point((x, top), fill='#ffffff')
    elif name == 'cotton':
        for x, y in ((4, 10), (9, 12), (11, 7), (6, 5)) if v == 0 else ((5, 12), (10, 9), (4, 6), (12, 12)):
            d.line((8, 15, x, y), fill='#6a5a3a')
            md.polygon([(x - 3, y), (x - 1, y - 3), (x + 2, y - 3), (x + 3, y + 1), (x, y + 1)], fill=pal[1])
            md.line((x - 1, y - 2, x + 1, y - 2), fill=pal[2])
        if ripe:
            for x, y in ((4, 8), (9, 11), (11, 5)) if v == 0 else ((5, 10), (10, 7), (12, 12)):
                md.rectangle((x - 1, y - 1, x, y), fill='#f4f1e8')
                md.point((x - 1, y - 1), fill='#ffffff')
                md.point((x, y), fill='#d2cbbb')
    else:  # vegetables: two rows of rosettes, a cabbage head when ripe
        for i, (x, y) in enumerate(((3, 12), (8, 13), (13, 12), (5, 7), (11, 8)) if v == 0 else ((2, 8), (7, 7), (12, 8), (4, 13), (10, 13))):
            r = 3 if (ripe and i % 2 == 0) else 2
            blob(md, x, y, r, r - 1, pal if i % 2 else [G[0], '#5c8a4e', '#8db35e', '#c9dd8a'])
            if ripe and i % 2 == 0:
                md.point((x, y), fill='#d9e8a3')
        if ripe:
            d.point((8, 15), fill='#c05a3a')
    return finish(im, m)


# ---------------------------------------------------------------- tree crops

def crown(md, cx, cy, rx, ry, pal, rng, n=6):
    for i in range(n):
        a = i * 6.283 / n
        x = cx + round(rx * .55 * math.cos(a)) + rng.randrange(-1, 2)
        y = cy + round(ry * .5 * math.sin(a)) + rng.randrange(-1, 2)
        blob(md, x, y, rx // 2 + 2, ry // 2 + 1, pal, hi=False)
    blob(md, cx, cy, rx // 2 + 2, ry // 2 + 1, pal, hi=False)
    md.ellipse((cx - rx // 2, cy - ry + 1, cx + rx // 3, cy - 1), fill=pal[2])
    for i in range(4):
        md.point((cx - rx // 2 + rng.randrange(rx), cy - ry + 1 + rng.randrange(ry // 2)), fill=pal[3])


def tree(name, stage, v):
    w, h = (32, 48) if name == 'date' else (32, 40)
    im, d = canvas(w, h)
    ground(d, w, h, inset=6)
    ripe = stage == 'ripe'
    rng = random.Random(f'{name}{v}')
    m, md = layer(im)
    base = h - 3
    cx = 16
    if name == 'date':
        # Ringed trunk with a slight lean; fronds radiate from the top.
        lean = 2 if v == 0 else -2
        top = 14
        pts = [(cx, base), (cx + lean, base - 12), (cx + lean * 2, top)]
        md.line(pts, fill='#6a5238', width=3)
        md.line([(x - 1, y) for x, y in pts], fill='#9a7b52')
        for i, yy in enumerate(range(base - 2, top + 2, -3)):
            xx = cx + round(lean * min(2, (base - yy) / 12))
            md.line((xx - 1, yy, xx + 1 if i % 2 else xx, yy), fill='#3f3021')
        tx = cx + lean * 2
        fr = ['#2b5232', '#4d7f3a', '#7ea447', '#b5c65a']
        fronds = [((-6, -6), (-13, 1)), ((-4, -8), (-8, -10)), ((-1, -9), (2, -12)), ((3, -8), (9, -9)), ((6, -6), (13, 1)), ((-5, -2), (-12, 7)), ((5, -2), (12, 7)), ((1, -5), (-3, -11))]
        if v == 1:
            fronds = [((-dx, dy), (-ex, ey)) for (dx, dy), (ex, ey) in fronds]
        for (dx, dy), (ex, ey) in fronds:
            mx, my, fx, fy = tx + dx, top + dy, tx + ex, top + ey
            md.line([(tx, top), (mx, my), (fx, fy)], fill=fr[1], width=2)
            md.line([(tx, top - 1), (mx, my - 1), (fx, fy - 1)], fill=fr[2])
            # Leaflets hang off the rachis on the drooping half.
            for t in (0.3, 0.65):
                px, py = round(mx + (fx - mx) * t), round(my + (fy - my) * t)
                md.line((px, py, px, py + 2), fill=fr[0])
                md.point((px + (1 if ex > 0 else -1), py + 1), fill=fr[2])
        md.rectangle((tx - 1, top - 3, tx + 1, top - 1), fill=fr[3])
        if ripe:
            for dx in (-4, 4):
                md.polygon([(tx + dx - 2, top + 1), (tx + dx + 2, top + 1), (tx + dx + 1, top + 7), (tx + dx - 1, top + 7)], fill='#b8823c')
                md.line((tx + dx - 1, top + 2, tx + dx - 1, top + 5), fill='#dba85a')
                md.point((tx + dx + 1, top + 6), fill='#7a5028')
    elif name == 'olive':
        # Gnarled trunk, grey-green crown, dark fruit when ripe.
        pts = [(cx - 2, base), (cx + 1, base - 5), (cx - 3, base - 10), (cx + 2, base - 15)] if v == 0 else [(cx + 2, base), (cx - 1, base - 6), (cx + 3, base - 11), (cx - 1, base - 15)]
        md.line(pts, fill='#5a4a38', width=4)
        md.line([(x - 1, y) for x, y in pts], fill='#8f7a5a', width=1)
        md.line((pts[1][0], pts[1][1], pts[1][0] + 6, pts[1][1] - 6), fill='#5a4a38', width=2)
        md.line((pts[2][0], pts[2][1], pts[2][0] - 6, pts[2][1] - 5), fill='#5a4a38', width=2)
        pal = ['#3f4f3c', '#66785a', '#8e9f73', '#b9c49c']
        crown(md, cx, 14, 12, 8, pal, rng, n=7)
        if ripe:
            for i in range(9):
                x, y = 7 + rng.randrange(18), 9 + rng.randrange(10)
                md.line((x, y, x + 1, y), fill='#3a2c4a')
    else:  # orchard: straight trunk, round crown, red and yellow fruit
        md.line((cx, base, cx, 18), fill='#5a4a38', width=3)
        md.line((cx - 1, base, cx - 1, 18), fill='#8f7a5a')
        md.line((cx, 22, cx - 5, 17), fill='#5a4a38', width=2)
        md.line((cx, 22, cx + 5, 16), fill='#5a4a38', width=2)
        pal = [G[0], '#4f7a3a', '#74a04a', '#a9c862'] if not ripe else [G[0], '#4f7a3a', '#729a46', '#a2bc5c']
        crown(md, cx, 13, 12 if v == 0 else 11, 9, pal, rng, n=6)
        if not ripe:
            for i in range(5):
                md.point((8 + rng.randrange(16), 7 + rng.randrange(8)), fill='#f4e4ea')
        else:
            for i in range(7):
                x, y = 7 + rng.randrange(18), 8 + rng.randrange(10)
                c = HUE['orchard'] if i % 3 else '#e2c24a'
                md.rectangle((x, y, x + 1, y + 1), fill=c)
                md.point((x, y), fill=shade(c, 1.3))
    return finish(im, m)


def vine(stage, v):
    w, h = 24, 24
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    ripe = stage == 'ripe'
    rng = random.Random(f'vine{v}')
    m, md = layer(im)
    base = h - 3
    # Trellis: two posts, two rails.
    for x in (3, 20):
        md.rectangle((x, 7, x + 1, base), fill=WOOD[1])
        md.line((x, 8, x, base - 1), fill=WOOD[2])
    for y in (9, 15):
        md.line((2, y, 21, y), fill=WOOD[2])
        md.line((2, y + 1, 21, y + 1), fill=WOOD[0])
    # Stems climb the posts and run along the rails.
    for x in ((5, 18) if v == 0 else (6, 17)):
        d.line([(x, base), (x + 1, 15), (x, 9)], fill='#6a4a30')
    d.line((5, 9, 18, 9), fill='#6a4a30')
    pal = [G[0], '#3f7038', '#6a9b46', '#a5c35a'] if not ripe else [G[0], '#5b7a3a', '#8aa04a', '#c8b95c']
    leaves = [(6, 12), (10, 8), (14, 12), (18, 8), (9, 17), (16, 17)] if v == 0 else [(5, 8), (9, 12), (13, 7), (17, 12), (8, 18), (15, 18)]
    for x, y in leaves:
        md.polygon([(x - 2, y - 1), (x, y - 3), (x + 2, y - 1), (x + 2, y + 1), (x, y + 2), (x - 2, y + 1)], fill=pal[1])
        md.line((x - 1, y - 1, x, y), fill=pal[2])
        md.point((x - 1, y - 1), fill=pal[3])
    if ripe:
        for x, y in ((8, 13), (15, 13), (12, 18)) if v == 0 else ((7, 14), (12, 12), (17, 15)):
            md.polygon([(x - 2, y), (x + 2, y), (x + 1, y + 3), (x, y + 4), (x - 1, y + 3)], fill='#5a3f6e')
            md.point((x - 1, y + 1), fill='#8a6a9c')
            md.point((x + 1, y + 2), fill='#3f2a4e')
    return finish(im, m)


# ---------------------------------------------------------------- farm props

def haystack():
    w, h = 24, 24
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    m, md = layer(im)
    md.polygon([(3, 21), (2, 14), (5, 7), (11, 3), (13, 3), (19, 7), (22, 14), (21, 21)], fill=STRAW[1])
    md.polygon([(4, 18), (4, 13), (7, 7), (11, 4), (12, 5), (12, 18)], fill=STRAW[2])
    for x, y in ((6, 9), (9, 6), (8, 13), (5, 15), (11, 10)):
        md.line((x, y, x + 2, y), fill=STRAW[3])
    for x, y in ((15, 8), (17, 12), (14, 15), (18, 17), (10, 18)):
        md.line((x, y, x + 2, y + 1), fill=STRAW[0])
    md.line((12, 1, 12, 5), fill=WOOD[0])
    md.point((12, 1), fill=WOOD[2])
    return finish(im, m)


def hayrick():
    w, h = 32, 28
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    m, md = layer(im)
    # A long rick: rectangular stack under a thatched ridge.
    md.rectangle((3, 12, 28, 25), fill=STRAW[1])
    md.rectangle((4, 12, 15, 24), fill=STRAW[2])
    md.polygon([(1, 12), (6, 4), (25, 4), (30, 12)], fill=STRAW[2])
    md.polygon([(2, 12), (6, 5), (15, 5), (15, 12)], fill=STRAW[3])
    md.line((6, 4, 25, 4), fill=STRAW[4])
    for y in (7, 10):
        md.line((3, y, 28, y), fill=STRAW[1])
    md.line((30, 12, 30, 13), fill=STRAW[0])
    for x, y in ((6, 15), (10, 19), (18, 16), (23, 20), (26, 14), (14, 22)):
        md.line((x, y, x + 3, y), fill=STRAW[0])
    md.line((3, 25, 28, 25), fill=STRAW[0])
    return finish(im, m)


def scarecrow():
    w, h = 16, 28
    im, d = canvas(w, h)
    ground(d, w, h, inset=4)
    m, md = layer(im)
    md.rectangle((7, 12, 8, 25), fill=WOOD[1])
    md.line((7, 12, 7, 25), fill=WOOD[2])
    md.line((1, 11, 14, 11), fill=WOOD[1])
    # Ragged coat on the crossbar.
    md.polygon([(3, 12), (12, 12), (13, 19), (10, 21), (5, 21), (2, 19)], fill='#6b5a4a')
    md.polygon([(4, 13), (7, 13), (7, 19), (4, 18)], fill='#8a7660')
    md.line((3, 12, 12, 12), fill='#4f4234')
    md.line((1, 13, 3, 15), fill=STRAW[2])
    md.line((14, 13, 12, 15), fill=STRAW[2])
    for x in (4, 10):
        md.line((x, 21, x, 23), fill=STRAW[2])
    # Sack head under a straw hat.
    md.rectangle((5, 5, 10, 10), fill='#c9b48a')
    md.line((6, 6, 6, 9), fill='#e0cfa6')
    md.point((7, 8), fill='#3a2e20')
    md.point((9, 8), fill='#3a2e20')
    md.polygon([(2, 5), (6, 2), (10, 2), (14, 5)], fill=STRAW[1])
    md.line((3, 5, 13, 5), fill=STRAW[0])
    md.line((6, 2, 9, 2), fill=STRAW[3])
    return finish(im, m)


def sheaf():
    w, h = 16, 18
    im, d = canvas(w, h)
    ground(d, w, h, inset=2)
    m, md = layer(im)
    # Bound shock: stalks fan out below the band and heads fan out above.
    md.polygon([(3, 15), (6, 9), (10, 9), (13, 15)], fill=STRAW[1])
    md.polygon([(4, 15), (6, 9), (8, 9), (7, 15)], fill=STRAW[2])
    md.polygon([(5, 9), (7, 2), (10, 2), (12, 9)], fill=STRAW[2])
    md.polygon([(5, 9), (7, 3), (8, 3), (8, 9)], fill=STRAW[3])
    for x in (6, 8, 10):
        md.line((x, 3, x, 8), fill=STRAW[0])
        md.line((x, 10, x, 15), fill=STRAW[0])
    for x, y in ((6, 2), (8, 1), (10, 2), (12, 4)):
        md.point((x, y), fill=STRAW[3])
        md.point((x, y + 1), fill=STRAW[1])
    md.rectangle((5, 8, 11, 9), fill='#8a6a3c')
    md.line((6, 8, 10, 8), fill='#b08a50')
    return finish(im, m)


def cart():
    w, h = 24, 20
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    m, md = layer(im)
    # Two-wheeled cart, seen from the side, shafts to the right.
    md.rectangle((3, 6, 16, 12), fill=WOOD[1])
    md.rectangle((4, 7, 9, 11), fill=WOOD[2])
    for x in (7, 11):
        md.line((x, 6, x, 12), fill=WOOD[0])
    md.line((3, 6, 16, 6), fill=WOOD[3])
    md.line((16, 9, 22, 8), fill=WOOD[2], width=2)
    md.line((16, 9, 22, 8), fill=WOOD[1])
    for cx in (7, 13):
        md.ellipse((cx - 3, 10, cx + 3, 16), fill=WOOD[0])
        md.ellipse((cx - 2, 11, cx + 2, 15), fill=WOOD[2])
        md.point((cx, 13), fill=WOOD[0])
        md.line((cx, 11, cx, 15), fill=WOOD[1])
        md.line((cx - 2, 13, cx + 2, 13), fill=WOOD[1])
    # Load of hay heaped over the bed.
    md.polygon([(3, 6), (5, 3), (10, 1), (15, 3), (17, 6)], fill=STRAW[2])
    md.line((6, 3, 10, 2), fill=STRAW[4])
    md.point((13, 4), fill=STRAW[0])
    return finish(im, m)


def shadoof():
    w, h = 24, 40
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    m, md = layer(im)
    # Water in a channel at the base, upright forked post, counterweighted pole.
    md.rectangle((1, 31, 11, 36), fill=WATER[0])
    md.line((3, 33, 6, 33), fill=WATER[1])
    md.line((2, 31, 10, 31), fill='#5a5a48')
    md.rectangle((14, 14, 16, 36), fill=WOOD[1])
    md.line((14, 15, 14, 35), fill=WOOD[2])
    md.line((14, 14, 12, 10), fill=WOOD[1], width=2)
    md.line((16, 14, 18, 10), fill=WOOD[1], width=2)
    md.line([(2, 2), (15, 12), (22, 20)], fill=WOOD[1], width=2)
    md.line([(2, 1), (15, 11), (22, 19)], fill=WOOD[3])
    # Counterweight stone at the short end, rope and bucket at the long end.
    md.ellipse((19, 18, 23, 24), fill='#6a6a5c')
    md.line((20, 19, 21, 19), fill='#9c9c88')
    md.line((3, 3, 3, 22), fill='#c5b48a')
    md.polygon([(1, 23), (6, 23), (5, 27), (2, 27)], fill='#7b5c3a')
    md.line((2, 24, 2, 26), fill='#a8875a')
    return finish(im, m)


def gate():
    w, h = 16, 18
    im, d = canvas(w, h)
    ground(d, w, h, inset=1)
    m, md = layer(im)
    for x in (1, 13):
        md.rectangle((x, 3, x + 1, 15), fill=WOOD[1])
        md.line((x, 4, x, 14), fill=WOOD[2])
    for y in (5, 8, 11, 14):
        md.line((3, y, 12, y), fill=WOOD[2])
        md.line((3, y + 1, 12, y + 1), fill=WOOD[0])
    md.line((3, 14, 12, 5), fill=WOOD[3])
    md.line((7, 5, 7, 15), fill=WOOD[1])
    return finish(im, m)


def stile():
    w, h = 12, 14
    im, d = canvas(w, h)
    ground(d, w, h, inset=0)
    m, md = layer(im)
    for x in (2, 9):
        md.rectangle((x, 2, x, 11), fill=WOOD[1])
    md.line((3, 4, 8, 4), fill=WOOD[2])
    md.line((3, 8, 8, 8), fill=WOOD[2])
    # Two step boards on the near side.
    md.rectangle((0, 9, 5, 10), fill=WOOD[3])
    md.line((0, 11, 5, 11), fill=WOOD[0])
    md.rectangle((3, 6, 8, 7), fill=WOOD[3])
    md.line((3, 8, 8, 8), fill=WOOD[0])
    md.line((5, 11, 5, 11), fill=WOOD[1])
    return finish(im, m)


def build_fields():
    frames = {}
    for stage in ('green', 'ripe'):
        for v in (0, 1):
            for name in GRAINS:
                frames[f'crop-{name}-{stage}-{v}'] = grain(name, stage, v)
            frames[f'crop-maize-{stage}-{v}'] = maize(stage, v)
            frames[f'crop-sugarcane-{stage}-{v}'] = sugarcane(stage, v)
            for name in LOW:
                frames[f'crop-{name}-{stage}-{v}'] = low(name, stage, v)
            for name in ('olive', 'date', 'orchard'):
                frames[f'crop-{name}-{stage}-{v}'] = tree(name, stage, v)
            frames[f'crop-vine-{stage}-{v}'] = vine(stage, v)
    frames.update({
        'farm-haystack': haystack(), 'farm-hayrick': hayrick(), 'farm-scarecrow': scarecrow(),
        'farm-sheaf': sheaf(), 'farm-cart': cart(), 'farm-well-shadoof': shadoof(),
        'farm-gate': gate(), 'farm-stile': stile(),
    })
    for name, im in frames.items():
        assert im.size != (16, 16), name
    return frames
