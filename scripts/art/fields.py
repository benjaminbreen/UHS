"""Standing crops and farm props. Every frame is a non-16x16 atlas prop so the
terrain strip never picks one up. Sun from the upper left, 1px ink outline on
masses (leaves, fruit, crowns, timber); stalks and awns stay 1px unoutlined so
grain reads as grain rather than as a blob. Anchor: centre, 2px above the base.
"""
from PIL import Image, ImageDraw
import math
import random

INK = '#2e3a2b'


def ink_for(hex_):
    """Outline in a dark, slightly desaturated version of the mass's own hue,
    the way the reference does it: a flat black keyline round every element
    reads as a sticker, a hue-keyed one reads as form."""
    r, g, b = int(hex_[1:3], 16), int(hex_[3:5], 16), int(hex_[5:7], 16)
    m = (r + g + b) / 3
    return '#%02x%02x%02x' % tuple(
        max(0, min(255, round((c * 0.62 + m * 0.38) * 0.42))) for c in (r, g, b)
    )
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

# Canvas and seedling habit per crop, so a sown cell can draw the right kind
# of young plant on the same footprint as the grown one.
SIZES = {name: (16, 24) for name in GRAINS}
HABIT = {name: 'grass' for name in GRAINS}
for _n in ('maize', 'sugarcane'):
    SIZES[_n], HABIT[_n] = (16, 32), 'grass'
for _n in LOW:
    SIZES[_n], HABIT[_n] = (16, 18), 'broadleaf'
for _n in ('olive', 'orchard'):
    SIZES[_n], HABIT[_n] = (32, 40), 'woody'
SIZES['date'], HABIT['date'] = (32, 48), 'woody'
SIZES['vine'], HABIT['vine'] = (24, 24), 'woody'


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


def parts(im):
    """Draw each element into its own layer and outline it separately, so
    neighbouring leaves keep a dark line between them instead of fusing into
    one blob. Back to front: later parts sit over earlier ones."""
    stack = []

    def part(ink=INK):
        layer_ = Image.new('RGBA', im.size)
        stack.append((layer_, ink))
        return ImageDraw.Draw(layer_)

    def done():
        for layer_, ink in stack:
            im.alpha_composite(outlined(layer_, ink))
        return im

    return part, done


def blob(d, cx, cy, rx, ry, pal, hi=True):
    """Shaded leaf mass: dark body, lit upper-left face, a highlight tick."""
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=pal[1])
    d.ellipse((cx - rx + 1, cy - ry + 1, max(cx - rx + 1, cx + rx - 2), cy), fill=pal[2])
    if hi:
        d.point((cx - rx + 2, cy - ry + 1), fill=pal[3])


# ---------------------------------------------------------------- grains

def head(name, md, x, y, pal, side):
    """One ear, drawn into the mass layer so the plant carries one outline.
    (x, y) is where the ear starts; it hangs below that."""
    dk, mid, lt = pal
    if name in ('wheat', 'barley'):
        # Fat spike: a solid three-wide body with paired grains stepping down
        # it, so it reads as an ear rather than as dither.
        md.rectangle((x - 1, y + 1, x + 1, y + 6), fill=mid)
        md.point((x, y), fill=mid)
        for i in (1, 3, 5):
            md.point((x - 1, y + i), fill=lt)
            md.point((x + 1, y + i + 1), fill=dk)
        md.point((x, y + 1), fill=lt)
    elif name == 'rye':
        # Slimmer and longer than wheat, nodding at the tip.
        md.rectangle((x - 1, y + 2, x, y + 8), fill=mid)
        md.rectangle((x - 1 + side, y, x + side, y + 2), fill=mid)
        for i in (2, 4, 6):
            md.point((x - 1, y + i), fill=lt)
            md.point((x, y + i + 1), fill=dk)
        md.point((x - 1 + side, y), fill=lt)
    elif name == 'oats':
        # Open panicle: two heavy spikelets hanging off short branches.
        md.line((x, y, x, y + 7), fill=dk)
        for i, dy in enumerate((1, 5)):
            s = side if i % 2 == 0 else -side
            md.line((x, y + dy, x + s * 2, y + dy + 1), fill=dk)
            md.rectangle((x + s * 2 - 1, y + dy + 1, x + s * 2 + 1, y + dy + 3), fill=mid)
            md.point((x + s * 2 - 1, y + dy + 2), fill=lt)
            md.point((x + s * 2 + 1, y + dy + 3), fill=dk)
    elif name == 'millet':
        # Thick club, nodding over at the tip.
        md.rectangle((x - 1, y + 2, x + 1, y + 8), fill=mid)
        md.rectangle((x - 1 + side, y, x + side, y + 2), fill=mid)
        for i in (2, 4, 6):
            md.point((x - 1, y + i), fill=lt)
            md.point((x + 1, y + i + 1), fill=dk)
        md.point((x + side, y), fill=lt)
    elif name == 'sorghum':
        # A dense rounded panicle sitting on the cane.
        md.ellipse((x - 2, y, x + 2, y + 6), fill=mid)
        md.ellipse((x - 2, y + 1, x, y + 3), fill=lt)
        md.point((x + 2, y + 4), fill=dk)
    elif name == 'teff':
        # Airy panicle: fine branches off a short axis, each tipped with grain.
        md.line((x, y + 1, x, y + 7), fill=mid)
        for dx, dy in ((-3, 0), (-2, 3), (2, 2), (3, 0), (0, -1)):
            md.line((x, y + 3, x + dx, y + dy), fill=mid)
            md.point((x + dx, y + dy), fill=lt)
    else:  # rice, dry-rice: a heavy panicle arching over to one side
        md.line((x, y + 2, x, y + 8), fill=mid)
        arc = [(x, y + 2), (x + side, y), (x + side * 3, y + 1)]
        md.line(arc, fill=mid)
        for px, py in arc[1:]:
            md.rectangle((px, py, px, py + 2), fill=mid)
            md.point((px, py + 1), fill=lt)
        md.point((x + side * 3, y + 3), fill=dk)


def awns(name, d, x, y, colour, side):
    """Bristles, drawn after the outline so they stay one pixel wide: an ear
    that gets outlined at this size turns into a club."""
    if name == 'barley':
        for dx in (-1, 0, 1):
            d.line((x + dx, y, x + dx * 4, y - 5), fill=colour)
    elif name == 'wheat':
        for dx, dy in ((-2, -3), (0, -4), (2, -3)):
            d.line((x, y, x + dx, y + dy), fill=colour)


def grain(name, stage, v):
    """A clump of three canes in one silhouette: 2px stems so the outline has
    something to hold, deliberate leans rather than jitter, one leaf each."""
    w, h = 16, 24
    im, d = canvas(w, h)
    ground(d, w, h)
    ripe = stage == 'ripe'
    m, md = layer(im)
    if name == 'rice':
        d.rectangle((1, h - 6, w - 2, h - 3), fill=WATER[0])
        for x in (2, 8, 12):
            d.line((x, h - 5, x + 2, h - 5), fill=WATER[1])
    cane = STRAW[1] if ripe else G[1]
    caneLit = STRAW[2] if ripe else G[2]
    leaf = [G[2], G[4]] if not ripe else [STRAW[1], STRAW[3]]
    pal = ramp(HUE[name]) if ripe else [G[1], G[3], G[4]]
    # Three canes leaning out from the middle, the tallest off-centre so the
    # clump has a front and a back rather than reading as a fan.
    canes = [(4, -1, 11), (8, 0, 7), (12, 1, 10)] if v == 0 else [(4, -1, 9), (8, 0, 8), (12, 1, 12)]
    if not ripe:
        canes = [(x, lean, top + 3) for x, lean, top in canes]
    base = h - 3
    for i, (x, lean, top) in enumerate(canes):
        tx = x + lean
        md.line((x, base, tx, top + 1), fill=cane, width=2)
        md.line((x - 1, base, tx - 1, top + 1), fill=caneLit)
        # One blade per cane, a leaf shape rather than a line so the outline
        # wraps it; low on the stem, clear of the ear.
        s = -1 if lean < 0 else 1
        by = base - 3 - i * 3
        md.polygon([(x, by), (x + s * 2, by - 2), (x + s * 4, by - 2), (x + s * 2, by + 1)], fill=leaf[0])
        md.point((x + s * 2, by - 1), fill=leaf[1])
        head(name, md, tx, top - 6, pal, s or 1)
    im.alpha_composite(outlined(m))
    for i, (x, lean, top) in enumerate(canes):
        awns(name, d, x + lean, top - 6, pal[1], -1 if lean < 0 else 1)
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
    part, parts_done = parts(im)
    md = part()
    rng = random.Random(f'{name}{v}')
    pal = G
    # Cotton is left out: its ripe hue is the colour of the lint, and painting
    # the leaves with it is what made the ripe plant read as a heap of stones.
    if name in ('potato', 'yam', 'cassava', 'taro', 'beans', 'vegetables') and ripe:
        pal = [G[0], shade(HUE[name], .75), HUE[name], shade(HUE[name], 1.25)]
    if name == 'squash':
        # Two big lobed leaves on a runner, each outlined on its own so they
        # do not fuse, with the fruit sitting forward on a stem of its own.
        leafInk = ink_for(pal[1])
        md.line([(2, 15), (8, 13), (14, 15)], fill=G[0], width=2)
        for i, (x, y) in enumerate(((4, 11), (12, 11)) if v == 0 else ((4, 12), (12, 10))):
            lp = part(leafInk)
            # A round leaf with a notch cut out of the near side: the lobe is
            # what tells a squash leaf from a general green blob.
            lp.ellipse((x - 4, y - 4, x + 4, y + 3), fill=pal[1])
            lp.ellipse((x - 3, y - 3, x, y), fill=pal[2])
            lp.point((x - 3, y - 3), fill=pal[3])
            lp.polygon([(x - 1, y + 4), (x + 2, y + 4), (x, y)], fill=(0, 0, 0, 0))
            lp.line((x - 2, y + 1, x - 1, y - 1), fill=leafInk)
            lp.line((x + 2, y + 1, x + 1, y - 1), fill=leafInk)
        tp = part(leafInk)
        tp.line([(8, 12), (9, 9), (7, 8), (8, 6)], fill=G[2])
        if ripe:
            fx = 8
            fp = part(ink_for(HUE['squash']))
            fp.ellipse((fx - 3, 12, fx + 3, 16), fill=HUE['squash'])
            fp.line((fx - 2, 13, fx - 2, 15), fill='#f3b45a')
            fp.point((fx - 2, 13), fill='#ffd79a')
            fp.line((fx + 2, 14, fx + 2, 15), fill='#9a5a1c')
        else:
            fp = part(ink_for('#e6c04a'))
            fp.ellipse((7, 7, 10, 10), fill='#e6c04a')
            fp.point((8, 8), fill='#f7e08a')
    elif name in ('potato', 'yam', 'cassava', 'taro'):
        cx = 8
        if name == 'taro':
            d.rectangle((1, h - 6, w - 2, h - 3), fill=WATER[0])
            d.line((3, h - 5, 5, h - 5), fill=WATER[1])
            d.line((10, h - 5, 12, h - 5), fill=WATER[1])
        if name == 'potato':
            # A hilled ridge of loose earth, rounded rather than boxed, with
            # the plant standing on it and tubers turned up when it is ready.
            rp = part(ink_for('#7d6644'))
            rp.ellipse((0, 11, 15, 17), fill='#7d6644')
            rp.ellipse((2, 12, 12, 14), fill='#9c8154')
            rp.point((4, 13), fill='#b09566')
            leafInk = ink_for(pal[1])
            for x, y in ((3, 9), (13, 9), (8, 5)) if v == 0 else ((3, 8), (13, 10), (8, 5)):
                sp = part(leafInk)
                sp.line((8, 13, x, y + 2), fill=G[0], width=2)
                sp.ellipse((x - 3, y - 2, x + 3, y + 2), fill=pal[1])
                sp.ellipse((x - 2, y - 1, x, y + 1), fill=pal[2])
                sp.point((x - 2, y - 1), fill=pal[3])
                sp.line((x, y - 2, x, y + 2), fill=ink_for(pal[1]))
            if ripe:
                for tx in (3, 12):
                    tp = part(ink_for('#c8a468'))
                    tp.ellipse((tx - 2, 13, tx + 2, 16), fill='#c8a468')
                    tp.point((tx - 1, 14), fill='#e4cc98')
            else:
                fp = part(ink_for('#b9b4cc'))
                fp.point((6, 2), fill='#e9e5f2')
                fp.point((10, 3), fill='#e9e5f2')
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
        # One stout stalk carrying the panicle, with a shorter leafy shoot
        # beside it. Two full plants will not fit sixteen pixels without the
        # heads fusing, and the head is what tells quinoa from anything else.
        hp = ramp(HUE['quinoa']) if ripe else [G[1], G[2], G[4]]
        stalk = '#8a6a48' if ripe else G[1]
        mx, sx, s_ = (6, 12, 1) if v == 0 else (10, 4, -1)
        sp = part(ink_for(stalk))
        sp.line((mx, 16, mx, 5), fill=stalk, width=2)
        sp.line((mx - 1, 15, mx - 1, 6), fill=shade(stalk, 1.3))
        for ly in (13, 10):
            lp = part(ink_for(pal[1]))
            # Goosefoot: a broad blade with a squared shoulder.
            lp.polygon([(mx + s_, ly), (mx + s_ * 3, ly - 3), (mx + s_ * 5, ly - 2),
                        (mx + s_ * 3, ly + 1)], fill=pal[1])
            lp.point((mx + s_ * 3, ly - 1), fill=pal[2])
        pp = part(ink_for(hp[1]))
        # A slim nodding panicle: knobs of seed down one axis, not a club.
        for i, dy in enumerate((0, 2, 4, 6)):
            dx = -s_ if i >= 2 else 0
            pp.rectangle((mx + dx - 1, 3 + dy, mx + dx, 4 + dy), fill=hp[1])
            pp.point((mx + dx - 1, 3 + dy), fill=hp[2])
            pp.point((mx + dx, 4 + dy), fill=hp[0])
        # The side shoot: leafy, no head of its own yet.
        op = part(ink_for(stalk))
        op.line((sx, 16, sx, 9), fill=stalk)
        for ly in (14, 11):
            lp = part(ink_for(pal[1]))
            lp.polygon([(sx, ly), (sx - s_ * 2, ly - 3), (sx - s_ * 4, ly - 2),
                        (sx - s_ * 2, ly + 1)], fill=pal[1])
            lp.point((sx - s_ * 2, ly - 1), fill=pal[2])
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
        # An open bush of separate lobed leaves. Ripe bolls are small, sit on
        # the plant and keep a dark husk behind them, so the crop reads as a
        # plant carrying white rather than as a heap of stones.
        leafInk = ink_for(pal[1])
        st = part(ink_for('#6a5a3a'))
        st.line((8, 16, 8, 8), fill='#6a5a3a', width=2)
        for x, y in ((3, 11), (13, 11), (8, 6)) if v == 0 else ((3, 12), (13, 9), (8, 6)):
            lp = part(leafInk)
            lp.line((8, 12, x, y), fill='#6a5a3a')
            lp.polygon([(x - 3, y), (x - 2, y - 3), (x + 1, y - 3), (x + 3, y),
                        (x + 1, y + 2), (x - 2, y + 2)], fill=pal[1])
            lp.line((x - 1, y - 2, x + 1, y - 2), fill=pal[2])
            lp.point((x - 2, y - 2), fill=pal[3])
        if ripe:
            # Small bolls sitting on the bush: two pixels of white in an open
            # husk. Any larger and the crop reads as stones, not cotton.
            for x, y in ((4, 9), (12, 9), (8, 4)) if v == 0 else ((4, 10), (12, 7), (8, 4)):
                bp = part(ink_for('#8a7448'))
                bp.rectangle((x - 1, y - 1, x, y), fill='#f4f1e8')
                bp.point((x - 1, y - 1), fill='#ffffff')
                bp.point((x, y), fill='#d8d2c2')
                bp.point((x - 2, y + 1), fill='#8a7448')
                bp.point((x + 1, y + 1), fill='#8a7448')
    else:
        # A mixed kitchen bed: a leafy head, an allium and a root crop, each
        # outlined separately with a gap between. Three different plants read
        # as a garden; five identical rosettes read as moss.
        leafy = pal if ripe else [G[0], '#4a7a42', '#74a355', '#a8cc78']
        hx, ax, cx_ = (3, 8, 13) if v == 0 else (3, 9, 13)
        hp = part(ink_for(leafy[1]))
        r = 3 if ripe else 2
        hp.ellipse((hx - r, 13 - r * 2, hx + r, 15), fill=leafy[1])
        hp.ellipse((hx - r + 1, 14 - r * 2, hx, 12), fill=leafy[2])
        hp.point((hx - r + 1, 14 - r * 2), fill=leafy[3])
        ap = part(ink_for('#5f8f4a'))
        for dx, top in ((-2, 8), (0, 6), (2, 9)):
            ap.line((ax, 15, ax + dx, top), fill='#5f8f4a')
            ap.point((ax + dx, top), fill='#8cb862')
        if ripe:
            ap.ellipse((ax - 2, 12, ax + 1, 15), fill='#d8cda0')
            ap.point((ax - 1, 13), fill='#f0e8c6')
        cp = part(ink_for('#4f7d3e'))
        for dx, top in ((-2, 9), (0, 7), (2, 9)):
            cp.line((cx_, 15, cx_ + dx, top), fill='#4f7d3e')
            cp.point((cx_ + dx, top), fill='#84ae58')
        if ripe:
            cp.rectangle((cx_ - 1, 13, cx_ + 1, 15), fill='#d2762e')
            cp.point((cx_ - 1, 13), fill='#ef9c4a')
    return parts_done()


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
    part, parts_done = parts(im)
    md = part()
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
        # A short gnarled trunk that forks low, and a crown of separate leaf
        # clumps rather than one cloud: an olive reads by its broken outline
        # and the daylight between its branches.
        barkInk = ink_for('#5a4a38')
        tp = part(barkInk)
        pts = ([(cx - 3, base), (cx - 1, base - 6), (cx - 2, base - 11)] if v == 0
               else [(cx + 3, base), (cx + 1, base - 6), (cx + 2, base - 11)])
        tp.line(pts, fill='#5a4a38', width=5)
        tp.line([(x - 1, y) for x, y in pts], fill='#8f7a5a', width=1)
        tp.point((cx - 1 if v == 0 else cx + 1, base - 8), fill='#3e3225')
        limbs = ([((cx - 2, base - 11), (cx - 9, base - 17)),
                  ((cx - 2, base - 11), (cx + 6, base - 19)),
                  ((cx - 2, base - 13), (cx - 1, base - 21))] if v == 0 else
                 [((cx + 2, base - 11), (cx + 9, base - 17)),
                  ((cx + 2, base - 11), (cx - 6, base - 19)),
                  ((cx + 2, base - 13), (cx + 1, base - 21))])
        for a_, b_ in limbs:
            lp = part(barkInk)
            lp.line([a_, b_], fill='#6a5641', width=2)
        opal = ['#46543f', '#6b7d59', '#93a377', '#c2cba4']
        # Four clumps of silvery leaf, each with its own keyline, hung on the
        # limb ends and left with gaps between.
        clumps = ([(cx - 10, 16, 5, 4), (cx + 8, 13, 5, 4), (cx - 2, 9, 5, 4),
                   (cx + 3, 19, 4, 3)] if v == 0 else
                  [(cx + 10, 16, 5, 4), (cx - 8, 13, 5, 4), (cx + 2, 9, 5, 4),
                   (cx - 3, 19, 4, 3)])
        for i, (lx, ly, rx, ry) in enumerate(clumps):
            cp = part(ink_for(opal[1]))
            cp.ellipse((lx - rx, ly - ry, lx + rx, ly + ry), fill=opal[1])
            cp.ellipse((lx - rx + 1, ly - ry + 1, lx + 1, ly), fill=opal[2])
            cp.point((lx - rx + 2, ly - ry + 1), fill=opal[3])
            # A few leaves breaking the silhouette, the way an olive does.
            for dx, dy in ((-rx - 1, 0), (rx + 1, 1), (0, -ry - 1)):
                cp.point((lx + dx, ly + dy), fill=opal[2])
            if ripe:
                # Two or three olives per clump, hung at different depths so
                # the crop does not read as a pattern stamped on the leaves.
                for dx, dy in (((-2, 1), (2, 0)), ((-1, 2), (2, -1), (0, 0)),
                               ((-3, 0), (1, 2)), ((-1, 1), (2, 1)))[i]:
                    fp = part(ink_for('#4a3555'))
                    fp.point((lx + dx, ly + dy), fill='#4a3555')
                    fp.point((lx + dx, ly + dy - 1), fill='#6d5480')
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
    return parts_done()


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

def shadoof():
    """A shaduf: forked post, counterweighted swing beam, bucket on a rope.

    Drawn to the ruler in PROP_ART.md, about 17 source pixels to the metre —
    a post a little over head height and a beam four metres long. The old
    24x40 version put the whole machine inside a metre and a half.
    """
    w, h = 64, 56
    im, d = canvas(w, h)
    ground(d, w, h, inset=20)
    part, parts_done = parts(im)
    base, pivot = h - 3, (30, 14)
    # The channel it lifts from, at the foot of the post.
    wp = part(ink_for(WATER[0]))
    wp.ellipse((40, 44, 61, 52), fill=WATER[0])
    wp.ellipse((44, 46, 54, 49), fill=WATER[1])
    # Forked post, two uprights meeting at the pivot.
    pp = part(ink_for(WOOD[1]))
    pp.polygon([(25, base), (29, base), (32, 18), (28, 18)], fill=WOOD[1])
    pp.polygon([(33, base), (37, base), (34, 18), (30, 18)], fill=WOOD[1])
    pp.line((26, base - 1, 29, 20), fill=WOOD[2])
    pp.line((34, base - 1, 32, 20), fill=WOOD[0])
    # Swing beam: counterweight end low and near, bucket end high and far.
    bp = part(ink_for(WOOD[2]))
    bp.line([(8, 30), pivot, (58, 6)], fill=WOOD[2], width=3)
    bp.line([(8, 29), (pivot[0], pivot[1] - 1), (58, 5)], fill=WOOD[3])
    lp = part(ink_for('#4a4438'))
    lp.line((pivot[0] - 2, pivot[1] - 2, pivot[0] + 2, pivot[1] + 2), fill='#4a4438')
    # Counterweight: a lump of dried mud bound to the short end.
    cp = part(ink_for('#6a5a44'))
    cp.ellipse((2, 26, 15, 38), fill='#6a5a44')
    cp.ellipse((4, 28, 10, 33), fill='#8a7758')
    cp.point((5, 29), fill='#a89372')
    cp.line((8, 26, 8, 38), fill='#4e4132')
    # Rope and bucket, hanging over the water.
    rp = part(ink_for('#9c8a60'))
    rp.line((58, 8, 58, 33), fill='#c5b48a')
    kp = part(ink_for('#7b5c3a'))
    kp.polygon([(53, 33), (63, 33), (61, 43), (55, 43)], fill='#7b5c3a')
    kp.line((55, 35, 55, 41), fill='#a8875a')
    kp.line((54, 36, 62, 36), fill='#5e4529')
    return parts_done()


# ---------------------------------------------------------------- seedlings

def sprout(name, kind, v):
    """What a crop looks like in the weeks after sowing. Three habits cover
    every crop: grasses come up as blades, broadleaves push up a pair of seed
    leaves, and the woody crops are set out as a rooted cutting."""
    w, h = SIZES[name]
    im, d = canvas(w, h)
    ground(d, w, h, inset=max(1, w // 2 - 4))
    part, parts_done = parts(im)
    cx, base = w // 2, h - 3
    if name in ('rice', 'taro'):
        # Only the puddle the seedling stands in, not the whole cell.
        d.rectangle((cx - 5, h - 6, cx + 5, h - 3), fill=WATER[0])
        d.line((cx - 3, h - 5, cx, h - 5), fill=WATER[1])
    if kind == 'grass':
        # A tuft of blades from one crown, one leaning each way.
        gp = part(ink_for(G[2]))
        for dx, up in ((-3, 7), (0, 9), (2, 6)) if v == 0 else ((-2, 6), (0, 8), (3, 7)):
            gp.line((cx, base, cx + dx, base - up), fill=G[2])
            gp.point((cx + dx, base - up), fill=G[4])
        gp.point((cx, base - 1), fill=G[3])
    elif kind == 'woody':
        # A cutting: a short stick, a couple of leaves, a ring of dug earth.
        ep = part(ink_for('#6f5a3c'))
        ep.ellipse((cx - 4, base - 3, cx + 4, base), fill='#6f5a3c')
        sp = part(ink_for('#5a4a38'))
        sp.line((cx, base - 2, cx, base - 10), fill='#7a5f3e')
        for dx, dy in ((-3, -7), (3, -10)) if v == 0 else ((3, -7), (-3, -10)):
            lp = part(ink_for(G[2]))
            lp.line((cx, base + dy + 1, cx + dx, base + dy), fill=G[1])
            lp.ellipse((cx + dx - 2, base + dy - 2, cx + dx + 2, base + dy + 1), fill=G[2])
            lp.point((cx + dx - 1, base + dy - 1), fill=G[4])
    else:
        # Broadleaf: a pair of seed leaves and the first true leaf between.
        # They sit at slightly different heights; a symmetrical pair reads as
        # a moth rather than as a seedling.
        st = part(ink_for(G[1]))
        st.line((cx, base, cx, base - 5), fill=G[1])
        for dx, rise in ((-1, 1), (1, 0)) if v == 0 else ((-1, 0), (1, 1)):
            lp = part(ink_for(G[2]))
            lp.ellipse((cx + dx * 4 - 2, base - 7 - rise, cx + dx * 4 + 2, base - 4 - rise), fill=G[2])
            lp.point((cx + dx * 4 - 1, base - 6 - rise), fill=G[4])
        tp = part(ink_for(G[3]))
        tp.ellipse((cx - 1, base - 9, cx + 1, base - 6), fill=G[3])
        tp.point((cx, base - 8), fill=G[4])
    return parts_done()


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
    # Seedlings: sown ground shows the crop coming up rather than nothing.
    for name, habit in HABIT.items():
        for v in (0, 1):
            frames[f'crop-{name}-sprout-{v}'] = sprout(name, habit, v)
    # The shaduf is the one farm prop this module still owns; the cart, rick,
    # stack, sheaf, gate, stile and scarecrow lived here at about half life
    # size and were never placed. Prop set B has them drawn to the ruler.
    frames['farm-well-shadoof'] = shadoof()
    for name, im in frames.items():
        assert im.size != (16, 16), name
    return frames
