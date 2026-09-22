"""One shrub per named species, so the plant drawn is the plant the label
names. Keys are species ids from src/content/ecology/flora.ts; the game swaps
in `nature-shrub-<id>` where it exists and keeps the generic sprite otherwise.
Each look is a habit, a leaf colour, and what it carries: flowers, fruit,
spikes or bolls."""
from PIL import Image, ImageDraw
import colorsys
import math
import random
from art.canopy import paint_leaves, paint_wood, skeleton, rgb

SIZES = {'S': ((28, 22), 3.6), 'M': ((36, 30), 4.6), 'L': ((44, 38), 5.6)}
BROWN = '#6e4a2c'


def _hex(r, g, b):
    return '#%02x%02x%02x' % (int(r * 255), int(g * 255), int(b * 255))


def ramp(colour):
    """Seven tones round one colour; hue turns cool in shade, warm in light."""
    r, g, b = (int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    # Darks scale the value down; lights climb a share of the way to white, so
    # a pale sage leaf keeps its steps instead of clipping.
    steps = [(0.05, 1.1, -0.66), (0.035, 1.08, -0.48), (0.015, 1.04, -0.24), (0, 1, 0),
             (-0.015, 0.98, 0.16), (-0.03, 0.92, 0.32), (-0.04, 0.8, 0.48)]
    turn = min(1.0, s * 3)
    return [_hex(*colorsys.hsv_to_rgb((h + dh * turn) % 1, min(1, s * ks), v * (1 + kv) if kv < 0 else v + (1 - v) * kv))
            for dh, ks, kv in steps]


def _put(im, x, y, colour):
    if 1 <= x < im.width - 1 and 1 <= y < im.height - 1:
        im.putpixel((int(x), int(y)), rgb(colour))


def _line(im, pts, colour):
    ImageDraw.Draw(im).line([(int(x), int(y)) for x, y in pts], fill=rgb(colour))


def _scatter(rng, pts, n, gap):
    out = []
    pts = sorted(pts)
    rng.shuffle(pts)
    for p in pts:
        if len(out) >= n:
            break
        if all(abs(p[0] - q[0]) + abs(p[1] - q[1]) >= gap for q in out):
            out.append(p)
    return out


def _carry(im, rng, kind, colour, spots):
    if not kind:
        return
    a = ramp(colour)
    for x, y in spots:
        if kind == 'flower':
            for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
                _put(im, x + dx, y + dy, a[4] if dy < 1 and dx < 1 else a[3])
            _put(im, x, y, '#f4d35a')
        elif kind == 'floret':
            _put(im, x, y, a[4]); _put(im, x + 1, y, a[3])
            if rng.random() < 0.5:
                _put(im, x, y + 1, a[2])
        elif kind == 'berry':
            _put(im, x, y, a[5]); _put(im, x + 1, y, a[3]); _put(im, x, y + 1, a[3]); _put(im, x + 1, y + 1, a[1])
        elif kind == 'bead':
            _put(im, x, y, a[4]); _put(im, x, y + 1, a[2])
        elif kind == 'boll':
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if abs(dx) + abs(dy) < 2 or (dx, dy) == (1, 1):
                        _put(im, x + dx, y + dy, a[2] if dx + dy > 0 else a[4] if dx + dy < 0 else a[3])
        elif kind in ('spike', 'cone'):
            for k in range(5 if kind == 'spike' else 6):
                _put(im, x, y - k, a[4] if k % 2 else a[3])
                if kind == 'cone' and 0 < k < 5:
                    _put(im, x + 1, y - k, a[2]); _put(im, x - 1, y - k, a[4] if k < 3 else a[3])
        elif kind == 'cup':
            for dx in (-2, -1, 0, 1, 2):
                _put(im, x + dx, y, a[3] if dx < 1 else a[2])
                if abs(dx) < 2:
                    _put(im, x + dx, y - 1, a[4]); _put(im, x + dx, y + 1, a[2])
            _put(im, x, y - 1, a[6]); _put(im, x, y - 2, a[4])


def _mound(im, rng, R, leaf, stem, open_=False, low=False, wide=1.0):
    W, H = im.size
    bx, by = W // 2, H - 3
    top = (H - 6 - R) * (0.5 if low else 1.0)
    half = (W / 2 - R - 3) * wide
    clumps = []
    n = 5 if open_ else 9
    for i in range(n):
        t = (0.16 + 0.68 * (i + rng.uniform(-0.3, 0.3)) / (n - 1)) * math.pi
        x = bx - math.cos(t) * half * rng.uniform(0.75, 1.0)
        y = by - R * (0.6 if low else 1.0) - math.sin(t) * top * rng.uniform(0.7, 1.0)
        clumps.append((x, y, R * rng.uniform(0.85, 1.2), (y / H) * R * 2 + rng.uniform(0, R * 0.6),
                       (rng.uniform(0, 6.3), rng.uniform(0, 6.3), rng.uniform(0.08, 0.16), rng.uniform(0.05, 0.1))))
    if not open_:
        clumps.append((bx + rng.uniform(-2, 2), by - R - top * 0.35, R * 1.25, R * 2.4, (0, 1, 0.1, 0.08)))
    wood = ramp(stem)
    for x, y, r, *_ in clumps[:: 1 if open_ else 2]:
        _line(im, [(bx + (x - bx) * 0.15, by), ((bx + x) / 2, (by + y) / 2 + 2), (x, y + r * 0.4)], wood[1])
        _line(im, [(bx + (x - bx) * 0.15 - 1, by), ((bx + x) / 2 - 1, (by + y) / 2 + 2)], wood[3])
    tones = paint_leaves(im.size, clumps, rng, R)
    pal = ramp(leaf)
    for p, t in tones.items():
        _put(im, p[0], p[1], pal[t])
    return [p for p, t in tones.items() if t >= 3]


def _arching(im, rng, leaf, stem):
    W, H = im.size
    bx, by = W // 2, H - 3
    pal, wood = ramp(leaf), ramp(stem)
    spots = []
    n = 9
    for i in range(n):
        side = -1 if i % 2 else 1
        # Canes fan from upright in the middle to long arcs at the sides.
        reach = (W / 2 - 4) * (0.15 + 0.85 * ((i // 2) / (n // 2))) * rng.uniform(0.85, 1.0)
        rise = (H - 7) * rng.uniform(0.6, 1.0)
        tip = (bx + side * reach, by - rise * rng.uniform(0.35, 0.7))
        mid = (bx + side * reach * 0.35, by - rise)
        prev = None
        for k in range(0, 25):
            t = k / 24
            x = (1 - t) ** 2 * bx + 2 * (1 - t) * t * mid[0] + t * t * tip[0]
            y = (1 - t) ** 2 * by + 2 * (1 - t) * t * mid[1] + t * t * tip[1]
            if prev:
                _line(im, [prev, (x, y)], wood[2] if t < 0.5 else pal[1])
            prev = (x, y)
            if k > 5 and k % 3 == 0:
                up = -1 if k % 2 else 1
                _put(im, x, y - 1, pal[4]); _put(im, x + side, y - 2, pal[5] if k % 6 == 0 else pal[4])
                _put(im, x - side, y + up, pal[3]); _put(im, x, y + 1, pal[2])
                spots.append((int(x), int(y) - 2))
    return spots


def _cane(im, rng, leaf, stem, accent_top=True):
    W, H = im.size
    bx, by = W // 2, H - 3
    pal = ramp(leaf)
    d = ImageDraw.Draw(im)
    tops = []
    stems = sorted((rng.uniform(-0.45, 0.45), rng.uniform(0.7, 1.0)) for _ in range(5))
    # Outer canes first, so the middle one stands in front.
    for ang, tall in sorted(stems, key=lambda s: -abs(s[0])):
        L = (H - 7) * tall
        tx, ty = bx + math.sin(ang) * L, by - math.cos(ang) * L
        _line(im, [(bx, by), (tx, ty)], pal[1])
        for k in range(2, 6):
            t = k / 6
            x, y = bx + (tx - bx) * t, by + (ty - by) * t
            side = -1 if (k + int(ang * 10)) % 2 else 1
            ln = 5 + (H / 8) * (1 - abs(t - 0.6))
            ex, ey = x + side * ln * 0.8, y - ln * 0.55
            d.polygon([(x, y), ((x + ex) / 2 - side, (y + ey) / 2 - 2), (ex, ey), ((x + ex) / 2 + side, (y + ey) / 2 + 1)], fill=rgb(pal[3]))
            _line(im, [(x, y), (ex, ey)], pal[5] if side < 0 else pal[4])
            _line(im, [(x + side, y + 1), ((x + ex) / 2 + side, (y + ey) / 2 + 2)], pal[1])
        tops.append((int(tx), int(ty)))
    mid = min(tops, key=lambda p: abs(p[0] - bx))
    return [mid] if accent_top else [(bx + 3, by - 4)]


def _rosette(im, rng, leaf, n=11, stiff=True):
    W, H = im.size
    bx, by = W // 2, H - 3
    pal = ramp(leaf)
    d = ImageDraw.Draw(im)
    blades = [(-1.2 + 2.4 * i / (n - 1) + rng.uniform(-0.08, 0.08)) for i in range(n)]
    for a in sorted(blades, key=lambda a: abs(a)):
        L = min(H - 6, W / 2 - 3) * (rng.uniform(0.8, 1.0) if stiff else rng.uniform(0.6, 1.0)) * (1.0 if abs(a) < 0.9 else 0.85)
        tx, ty = bx + math.sin(a) * L, by - max(2, math.cos(a) * L)
        nx, ny = math.cos(a), math.sin(a)
        w = 1.4
        d.polygon([(bx - nx * w, by - ny * w), (tx, ty), (bx + nx * w, by + ny * w)], fill=rgb(pal[3]))
        _line(im, [(bx - nx * w, by - ny * w), (tx, ty)], pal[5])
        _line(im, [(bx + nx * w, by + ny * w), (tx, ty)], pal[1])
        _put(im, tx, ty, pal[0])
    return [(bx, by - int(min(H - 6, W / 2 - 3) * 0.9))]


def _twiggy(im, rng, leaf, stem, flat=False):
    """Several wiry stems from the ground, leaves only out at the ends. `flat`
    is one trunk under a spreading table of leaf."""
    W, H = im.size
    base = (W // 2, H - 3)
    segs, tips = [], []
    for lean in ((0.0,) if flat else (-0.55, 0.05, 0.6)):
        sg, tp = skeleton(rng, base, (H - 5) * (0.8 if flat else 1.7), 3, 2.6 if flat else 1.8, lean,
                          1.25 if flat else 0.8, 0.34 if flat else 0.2)
        segs += sg
        tips += tp
    wood = ramp(stem)
    for p, t in paint_wood(im.size, segs, rng).items():
        _put(im, p[0], p[1], wood[min(5, t + 1)])
    pal = ramp(leaf)
    if flat:
        top = min(y for _, y, *_ in tips)
        clumps = [(x, top + 2 + rng.uniform(-1, 1), 3.4, x * 0.05, (rng.uniform(0, 6), rng.uniform(0, 6), 0.1, 0.06)) for x, _, *_ in tips]
        tones = paint_leaves(im.size, clumps, rng, 3.4)
        for p, t in tones.items():
            _put(im, p[0], p[1], pal[t])
        return [p for p, t in tones.items() if t >= 3]
    spots = []
    for x, y, *_ in tips:
        for dx, dy in ((0, 0), (-2, -1), (2, 0), (1, -2), (-1, 1)):
            _put(im, x + dx, y + dy - 1, pal[4]); _put(im, x + dx + 1, y + dy - 1, pal[3]); _put(im, x + dx, y + dy, pal[1])
        spots.append((int(x), int(y) - 2))
    return spots


def _broom(im, rng, leaf):
    W, H = im.size
    bx, by = W // 2, H - 3
    pal = ramp(leaf)
    spots = []
    for i in range(16):
        a = -1.0 + 2.0 * i / 15 + rng.uniform(-0.06, 0.06)
        L = (H - 6) * rng.uniform(0.6, 1.0) * (1 - abs(a) * 0.25)
        kx, ky = bx + math.sin(a) * L * 0.5, by - math.cos(a) * L * 0.55
        tx, ty = bx + math.sin(a * 0.8) * L, by - math.cos(a * 0.8) * L
        _line(im, [(bx, by), (kx, ky), (tx, ty)], pal[2 + i % 3])
        _put(im, kx, ky, pal[1])
        spots.append((int(tx), int(ty)))
    return spots


# id: (habit, size, leaf, carried kind, carried colour, how many, options)
LOOKS = {
    'dog-rose': ('arching', 'M', '#4f8a3a', 'flower', '#f0a8c0', 7, {}),
    'blackthorn': ('mound', 'M', '#3f6e34', 'bead', '#3a3f7a', 12, {'open': True, 'stem': '#3a2a24'}),
    'liquorice': ('mound', 'M', '#5a8f3e', 'spike', '#a890d0', 5, {}),
    'henna': ('mound', 'M', '#5d8a3c', 'floret', '#efe6c8', 9, {}),
    'tree-cotton': ('mound', 'M', '#4f8440', 'boll', '#f4f2ea', 5, {'open': True}),
    'karonda': ('mound', 'M', '#2f6a34', 'berry', '#a02848', 6, {}),
    'turmeric': ('cane', 'M', '#5fa040', 'cone', '#f0e0b0', 1, {'low_flower': True}),
    'galangal': ('cane', 'L', '#4a9038', 'spike', '#f0ece0', 1, {}),
    'torch-ginger': ('cane', 'L', '#3f8a36', 'cone', '#e0405a', 1, {'low_flower': True}),
    'melastoma': ('mound', 'M', '#4a8a3c', 'flower', '#c050b0', 6, {}),
    'tea': ('mound', 'M', '#2f6e38', 'floret', '#f4f0e4', 4, {}),
    'paper-mulberry': ('mound', 'L', '#5a9a44', 'berry', '#e0702a', 5, {}),
    'goji': ('arching', 'M', '#6a9a58', 'bead', '#e03a24', 12, {}),
    'coffee': ('mound', 'M', '#2e6a36', 'berry', '#c8302a', 7, {}),
    'sugarbush': ('mound', 'M', '#5e8a5a', 'cup', '#e88aa0', 3, {}),
    'bowstring-hemp': ('rosette', 'S', '#4a7a48', None, None, 0, {'n': 9}),
    'serviceberry': ('mound', 'L', '#5a9040', 'bead', '#6a3a7a', 10, {}),
    'sumac': ('mound', 'L', '#5a8a3a', 'cone', '#a82828', 4, {'open': True}),
    'chiltepin': ('mound', 'S', '#4a8a3a', 'bead', '#e02818', 9, {}),
    'annatto': ('mound', 'L', '#4f8a3e', 'berry', '#c0342a', 6, {}),
    'upland-cotton': ('mound', 'M', '#55883f', 'boll', '#f6f4ec', 6, {'open': True}),
    'sea-island-cotton': ('mound', 'L', '#4c8a44', 'boll', '#f6f4ec', 6, {'open': True}),
    'guava': ('mound', 'L', '#5a8a44', 'berry', '#d8d060', 5, {}),
    'yerba-mate': ('mound', 'L', '#2f6a3a', 'bead', '#c83a2a', 8, {}),
    'wattle': ('mound', 'L', '#6a9458', 'floret', '#f0c828', 22, {}),
    'quandong': ('mound', 'M', '#8aa070', 'berry', '#d83020', 5, {'open': True}),
    'sickle-bush': ('twiggy', 'M', '#6a8a48', 'floret', '#e090c0', 6, {'stem': '#5a4a3a'}),
    'raisin-bush': ('twiggy', 'M', '#7a9050', 'bead', '#c87830', 8, {}),
    'tea-tree': ('mound', 'M', '#4a7048', 'floret', '#f4f0f0', 18, {}),
    'chilca': ('mound', 'M', '#5a8a48', 'floret', '#efe8c8', 10, {}),
    'bush-clover': ('arching', 'M', '#5a9048', 'floret', '#d060a0', 12, {}),
    'kerria': ('arching', 'M', '#58a040', 'flower', '#f0c820', 7, {}),
    'bramble': ('arching', 'M', '#3f7a38', 'bead', '#3a2040', 12, {}),
    'elder': ('mound', 'L', '#4f8a3c', 'floret', '#f0ecd8', 14, {}),
    'broom': ('broom', 'M', '#4a8a40', 'bead', '#f0d020', 12, {}),
    'myrtle': ('mound', 'M', '#2f6a3a', 'floret', '#f6f2ea', 8, {}),
    'mastic': ('mound', 'M', '#3f7040', 'bead', '#b03028', 8, {}),
    'khat': ('mound', 'L', '#4a8a40', None, None, 0, {'open': True, 'stem': '#8a4a38'}),
    'salal': ('mound', 'M', '#2f6e3c', 'bead', '#2a3060', 8, {}),
    'coca': ('mound', 'M', '#5a9a48', 'bead', '#d03828', 8, {}),
    'crowberry': ('cushion', 'S', '#3a6238', 'bead', '#1a1a2a', 9, {}),
    'hazel': ('mound', 'L', '#5a9444', 'bead', '#b08a4a', 5, {'open': True}),
    'gorse': ('mound', 'M', '#3f6e3a', 'floret', '#f0cc20', 20, {}),
    'heather': ('cushion', 'M', '#4a6a40', 'floret', '#b870a8', 24, {}),
    'bell-heather': ('cushion', 'S', '#3f6238', 'floret', '#a8408a', 16, {}),
    'bilberry': ('cushion', 'S', '#5a9040', 'bead', '#3a4a8a', 9, {}),
    'lavender': ('cushion', 'M', '#8a9a88', 'spike', '#8a70c8', 9, {}),
    'azalea': ('mound', 'M', '#3f7838', 'flower', '#e85a80', 9, {}),
    'rooibos': ('broom', 'S', '#6a8a40', 'bead', '#e8c838', 6, {}),
    'lowbush-blueberry': ('cushion', 'S', '#5a8a3e', 'bead', '#4a5aa0', 10, {}),
    'manzanita': ('mound', 'M', '#7a9a70', 'floret', '#f0d0d8', 8, {'open': True, 'stem': '#8a3a28'}),
    'lingonberry': ('cushion', 'S', '#2f6838', 'bead', '#d02828', 10, {}),
    'juniper': ('mound', 'M', '#3a6a58', 'bead', '#6a7a9a', 8, {}),
    'wormwood': ('mound', 'M', '#a8b8a0', 'bead', '#d8c860', 8, {'open': True}),
    'rosemary': ('broom', 'M', '#4a6a58', 'bead', '#a8b0e0', 9, {}),
    'caper': ('arching', 'M', '#6a9050', 'flower', '#f0e8f0', 4, {}),
    'rockrose': ('mound', 'M', '#6a8858', 'flower', '#e070a8', 6, {}),
    'ephedra': ('broom', 'M', '#7a9a50', None, None, 0, {}),
    'sagebrush': ('mound', 'M', '#9aaa98', None, None, 0, {'open': True, 'stem': '#6a5a48'}),
    'yucca': ('rosette', 'L', '#6a8a58', 'stalk', '#f4f0e0', 1, {'n': 15}),
    'creosote': ('twiggy', 'M', '#5a7a30', 'bead', '#e8d030', 7, {}),
    'maguey': ('rosette', 'L', '#6a9a88', None, None, 0, {'n': 11, 'loose': True}),
    'umbrella-thorn': ('twiggy', 'L', '#6a8a40', None, None, 0, {'flat': True, 'stem': '#5a4838'}),
    'saltbush': ('mound', 'M', '#a8b0a0', None, None, 0, {}),
    'pituri': ('mound', 'M', '#6a9050', 'floret', '#f4f0e8', 6, {}),
    'jujube': ('twiggy', 'M', '#5a8a3a', 'bead', '#a84a28', 7, {}),
    'sodom-apple': ('cane', 'L', '#8aa888', 'berry', '#a8c080', 3, {'fruit': True}),
    'spekboom': ('mound', 'M', '#6aa050', None, None, 0, {'open': True, 'stem': '#8a3a30'}),
    'tola': ('cushion', 'M', '#4a6a40', 'bead', '#e0c030', 8, {}),
}


def shrub(species):
    habit, size, leaf, kind, colour, count, opt = LOOKS[species]
    (W, H), R = SIZES[size]
    rng = random.Random(sum(ord(c) * (i + 3) for i, c in enumerate(species)))
    stem = opt.get('stem', BROWN)
    if habit == 'cushion':
        W, H = W + 4, H - 6
    im = Image.new('RGBA', (W, H))
    if habit == 'mound':
        spots = _mound(im, rng, R, leaf, stem, opt.get('open', False))
    elif habit == 'cushion':
        spots = [p for p in _mound(im, rng, R * 0.85, leaf, stem, low=True) if p[1] < H * 0.62]
    elif habit == 'arching':
        spots = _arching(im, rng, leaf, stem)
    elif habit == 'cane':
        spots = _cane(im, rng, leaf, stem, not opt.get('low_flower'))
        if opt.get('fruit'):
            spots = [(W // 2 - 6, H // 2), (W // 2 + 5, H // 2 - 3), (W // 2 + 1, H // 2 + 5)]
    elif habit == 'rosette':
        spots = _rosette(im, rng, leaf, opt.get('n', 11), not opt.get('loose'))
    elif habit == 'twiggy':
        spots = _twiggy(im, rng, leaf, stem, opt.get('flat', False))
    else:
        spots = _broom(im, rng, leaf)
    if kind == 'stalk':
        # A flowering stalk well clear of the leaves, hung with pale bells.
        x, y = spots[0]
        a = ramp(colour)
        for k in range(12):
            yy = y + 4 - k
            _put(im, x, yy, ramp(leaf)[2])
            if k >= 4 and k % 2 == 0:
                _put(im, x - 1, yy, a[4]); _put(im, x + 1, yy + 1, a[3]); _put(im, x - 2, yy + 1, a[2])
    elif kind:
        gap = 3 if kind in ('bead', 'floret') else 5
        _carry(im, rng, kind, colour, _scatter(rng, spots, count, gap))
    return im


def shrubs():
    return {f'nature-shrub-{k}': shrub(k) for k in LOOKS}
