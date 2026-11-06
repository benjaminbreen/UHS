"""Worksites beyond Europe: salt, sugar, oil, smithing, glass, kilns, dye,
weaving, caravanserais, plantations, shipyards and factories, each a regional
shed beside its own yard equipment.

    .venv/bin/python scripts/art/front_worksites_world.py artifacts/worksites-world.png
"""
from pathlib import Path
import math
import sys
from PIL import ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from art.front_materials import C, RAMPS, ramp, h2  # noqa: E402
from art import front_materials as fm  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as props  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art import front_africa as africa  # noqa: E402
from art import front_andes  # noqa: E402,F401  registers pirca walls and ichu
from art import front_seasia  # noqa: E402,F401  registers sawali walls
from art import front_pacific  # noqa: E402,F401  registers reed walls and pandanus
from art import front_southasia as sa  # noqa: E402
from art import front_persian as persia  # noqa: E402
from art import front_sinitic as sino  # noqa: E402
from art.front_house import bevel, brace  # noqa: E402
from art.front_kit import consolidate  # noqa: E402

OAK, STONE = RAMPS['oak'], RAMPS['granite']
IRON = ramp(270, .025, lift=-.12)
TEAK = ramp(40, .08, lift=-.14)
CLAY = ramp(40, .07, lift=-.06)
LATERITE = ramp(30, .1, lift=-.08)
BRINE = ramp(205, .045, lift=-.1)
SALT = ramp(250, .01, lift=.12)
COPPER = ramp(48, .085, lift=-.08)
SYRUP = ramp(55, .11, lift=-.16)
OIL = ramp(80, .1, lift=-.16)
INDIGO = ramp(255, .07, lift=-.2)
MADDER = ramp(25, .12, lift=-.08)
SAFFRON = ramp(75, .12, lift=.02)
GLOW = ramp(52, .17, lift=.02)
EARTH = ramp(58, .05, lift=-.08)
ev.TONES.setdefault('kawara', RAMPS['kawara'])


# ------------------------------------------------------------------ sheds

class WorkShed(ev.VernacularHouse):
    """A vernacular shed with a door and an open work bay showing its stock."""


def _bay(h):
    c, x, b, W = h.c, h.x0, h.base, h.W
    h.door_x, h.door_h = x + 30, 42
    door = h.s.get('door_kind', 'plank')
    if door == 'mat':
        africa.mat_door(c, x + 20, b - 42, 20, 42)
    else:
        op.door_plank(c, x + 20, b - 42, 20, 42)
    op.cast(c, x + 18, b - 42, 24, 2, .5)
    bx, bw = x + 60, W - 72
    if bw < 40:
        return
    post = ramp(42, .07, lift=-.2)
    for yy in range(b - 46, b):
        for xx in range(bx, bx + bw):
            c.p(xx, yy, (60, 44, 50, 255) if yy < b - 36 else (76, 56, 56, 255))
    stock(c, bx, b, bw, h.s.get('production'))
    for px in (bx - 4, bx + bw):
        bevel(c, px, b - 48, 5, 48, post, 2)
    bevel(c, bx - 4, b - 50, bw + 9, 5, post, 2)
    op.cast(c, bx, b - 45, bw, 6, .55)


ev.OPENINGS['worksite'] = _bay


def stock(c, x, b, w, kind):
    """What stands inside the open bay, by trade."""
    if kind in ('salt',):
        for k, xx in enumerate(range(x + 10, x + w - 8, 17)):
            props.pot(c, xx, b - 2, 'basket', RAMPS['thatch'], fill=SALT, scale=.75)
    elif kind == 'sugar':
        for k, xx in enumerate(range(x + 8, x + w - 8, 12)):
            so.lathe(c, xx, b - 3, [(0, 1), (3, 4), (16, 6), (17, 5)], CLAY)
            so.lathe(c, xx, b - 20, [(0, 5), (2, 2)], SALT)
    elif kind in ('oil', 'pots'):
        for xx in range(x + 9, x + w - 8, 15):
            props.pot(c, xx, b - 2, 'jug' if kind == 'pots' else 'amphora', scale=.6)
    elif kind in ('iron', 'glass'):
        bevel(c, x + 6, b - 30, w - 12, 3, OAK, 3)
        for xx in range(x + 9, x + w - 9, 6):
            c.rect(xx, b - 27, 2, 18, IRON[2] if kind == 'iron' else IRON[3])
            c.p(xx, b - 27, IRON[0])
        so.box(c, x + 8, b - 1, w - 16, 7, 8, OAK)
    elif kind in ('cloth', 'dye'):
        for row, yy in enumerate((b - 16, b - 31)):
            for k in range(max(1, (w - 10) // 24)):
                r = (INDIGO, MADDER, RAMPS['limestone'])[(k + row) % (3 if kind == 'dye' else 1) if kind == 'dye' else 2]
                so.box(c, x + 5 + k * 24, yy, 19, 6, 10, r)
    elif kind == 'weave':
        beam = b - 14
        for xx in range(x + 8, x + w - 8):
            c.p(xx, beam, TEAK[2]); c.p(xx, beam + 1, TEAK[4])
        for xx in range(x + 10, x + w - 10, 3):
            for yy in range(b - 38, beam):
                c.p(xx, yy, (232, 222, 196, 255) if yy % 3 else (206, 194, 168, 255))
    elif kind == 'leaf':
        for row in range(2):
            for xx in range(x + 6 + row * 5, x + w - 6, 10):
                top = b - 44 + row * 18
                c.rect(xx, top, 6, 13, ramp(70, .09, lift=-.12)[2 + row])
                c.rect(xx + 1, top + 13, 4, 2, ramp(70, .09, lift=-.12)[4])
                c.rect(xx, top - 2, 6, 2, OAK[4])
    else:
        for k, xx in enumerate(range(x + 9, x + w - 8, 18)):
            so.box(c, xx, b - 2, 13, 10 + k % 2 * 4, 9, OAK)


def vern(spec, info):
    h = WorkShed({**dict(openings='worksite', seed=7, wear=.35), **spec})
    im = h.build()
    # The mat door's weathered shade reaches near black; tint it as outlines are.
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] and max(px[x, y][:3]) < 14:
                px[x, y] = africa.POLE[6]
    info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


def shed(look, W, production=None, info=None):
    """A worksite's main building in its region's materials."""
    info = {} if info is None else info
    s = dict(W=W, production=production)
    if look == 'europe':
        from art.front_worksites import ProductionShed
        b = ProductionShed(dict(W=W, storeys=['rubble'], heights=[66], roof='pantile', rise=38, tone='pantile',
                                stacks=False, wear=.45, seed=171, production=production))
        im = b.build(); info.update(x0=b.x0, W=b.W, base=b.base, door_x=b.door_x, door_h=b.door_h)
        return im
    if look == 'colonial':
        from art.front_worksites import ProductionShed
        b = ProductionShed(dict(W=W, storeys=['ochre'], heights=[66], roof='pantile', rise=38, tone='pantile-pale',
                                stacks=False, wear=.4, seed=173, production=production))
        im = b.build(); info.update(x0=b.x0, W=b.W, base=b.base, door_x=b.door_x, door_h=b.door_h)
        return im
    if look == 'westasia':
        from art.front_worksites import ProductionShed
        b = ProductionShed(dict(W=W, storeys=['sandstone'], heights=[64], roof='pantile', rise=34, tone='pantile-pale',
                                stacks=False, wear=.35, seed=175, production=production))
        im = b.build(); info.update(x0=b.x0, W=b.W, base=b.base, door_x=b.door_x, door_h=b.door_h)
        return im
    if look == 'sahel':
        im = africa.sahel(dict(W=W - 14, posts=3, door=.3), info)
        return im
    if look == 'sinitic':
        return sino.hall(dict(W=W, bays=3, tone='tile', posts='timber', wall='white', lattice='bars', curve=1,
                              ridge='plain'), info)
    if look == 'india-open':
        return sa.monsoon_service('bengali', 'workshop', dict(W=W + 16), info)
    specs = {
        'westafrica': dict(storeys=['kahgel'], heights=[48], roof='thatch', tone='grass', hip=True, door_kind='mat'),
        'swahili': dict(storeys=['whitewash'], heights=[52], roof='palm', tone='attap', hip=True),
        'india': dict(storeys=['kahgel'], heights=[50], roof='thatch', tone='straw-old', hip=True),
        'seasia': dict(storeys=['sawali'], heights=[48], roof='palm', tone='attap', saddle=7),
        'pacific': dict(storeys=['reeds'], heights=[44], roof='palm', tone='pandanus', hip=True),
        'andes': dict(storeys=['pirca'], heights=[50], roof='thatch', tone='ichu'),
        'meso': dict(storeys=['whitewash'], heights=[50], roof='thatch', tone='straw-old', hip=True),
    }
    return vern({**s, **specs[look]}, info)


def store(look, info):
    if look == 'sahel':
        return africa.sahel(dict(W=104, posts=2, door=.5), info)
    return shed(look, 108, None, info)


def yard(look, production, W=174, top=0, bottom=44, width=354):
    """A canvas with the shed on the left; returns it and the yard's frame."""
    info = {}
    im = shed(look, W, production, info)
    c = C(max(width, im.width), im.height + top + bottom)
    c.im.alpha_composite(im, (0, top)); c.px = c.im.load()
    base = info['base'] + top
    g = dict(x0=info['x0'], base=base, door_x=info['door_x'], door_h=info['door_h'],
             yard=info['x0'] + info['W'] + 14, width=width)
    return c, g


def done(c, g, info):
    info.update(x0=g['x0'], W=g['width'] - 2 * g['x0'], base=g['base'], door_x=g['door_x'], door_h=g['door_h'])
    consolidate(c, rare=6)
    return c.im


def ground(c, x, y, w, h, r=EARTH):
    """Beaten earth in irregular bands, as the processing yards are paved."""
    yy, row = y, 0
    while yy < y + h:
        depth = 3 + int(h2(row, 41) * 3)
        xx, col = x - 13 * (row % 2), 0
        while xx < x + w:
            ww = 24 + int(h2(row, col, 9) * 20)
            a = max(x, xx); e = min(x + w, xx + ww - 1)
            c.rect(a, yy, max(0, e - a), min(depth - 1, y + h - yy), r[2 + int(h2(col, row, 5) * 2)])
            xx += ww; col += 1
        yy += depth; row += 1


def glow_mouth(c, cx, by, w, h):
    """A fire mouth: a dark arch with embers at its foot."""
    d = ImageDraw.Draw(c.im)
    d.rounded_rectangle((cx - w // 2, by - h, cx + w // 2 - 1, by - 1), radius=w // 2, fill=IRON[7])
    c.rect(cx - w // 2 + 2, by - 4, w - 4, 3, GLOW[2])
    c.rect(cx - w // 2 + 3, by - 6, w - 6, 2, GLOW[4])
    c.rect(cx - 1, by - 3, 2, 2, GLOW[0])


def chimney(c, x, by, h, w=15):
    fm.brick(c, x, by - h, w, h)
    c.rect(x - 2, by - h - 2, w + 4, 4, RAMPS['clay-tile'][2])
    c.rect(x + 3, by - h - 4, w - 6, 2, IRON[6])


# ------------------------------------------------------------------ equipment

def salt_pans(c, x, by, boil=False, terraced=False):
    """Shallow clay-lined pans in two rows seen from above, brine in some,
    crust in others; the raked salt heaped to dry."""
    bund = EARTH if not terraced else RAMPS['adobe']
    cols = 2 if boil else 3
    for row in range(2):
        for col in range(cols):
            px = x + col * 44 + (row * 8 if terraced else 0)
            py = by + 4 + row * 28 - (col * 5 if terraced else 0)
            w, h = 40, 22
            ripe = (row + col) % 3 == 1
            r = SALT if ripe else BRINE
            c.rect(px - 3, py - 3, w + 6, h + 6, bund[2])
            c.rect(px - 3, py - 3, w + 6, 1, bund[1])
            c.rect(px, py, w, 2, bund[4])
            for yy in range(py + 2, py + h):
                c.rect(px, yy, w, 1, r[3 if ripe else 4] if yy < py + 4 else r[2 if ripe else 3])
            for k in range(4 if not ripe else 12):
                c.rect(px + 3 + int(h2(k, row, col) * 30), py + 6 + int(h2(col, k, row) * 13),
                       5 if not ripe else 1, 1, r[1] if not ripe else r[4])
            c.rect(px - 3, py + h + 2, w + 6, 1, bund[4])
            if terraced:
                c.rect(px - 3, py + h + 3, w + 6, 4, bund[5])
    for hx, hb in ((x + 14, by - 6), (x + 44, by - 3)):
        so.lathe(c, hx, hb, [(0, 14), (5, 12), (16, 5), (20, 1)], SALT)
    d = ImageDraw.Draw(c.im)
    d.line((x + 66, by - 4, x + 80, by - 38), fill=OAK[3], width=2)
    c.rect(x + 61, by - 6, 11, 3, OAK[4])
    if boil:
        hx = x + 92
        so.box(c, hx, by + 30, 40, 18, 28, lambda c, x, y, w, h: fm.brick(c, x, y, w, h))
        so.lathe(c, hx + 20, by + 12, [(0, 16), (3, 19), (5, 19)], IRON, hollow=(17, 2), fill=(4, BRINE), inside=IRON)
        glow_mouth(c, hx + 20, by + 30, 12, 10)


def cane_press(c, cx, by, rollers=STONE):
    """Three upright rollers in a frame, turned by a sweep; the juice runs
    off in a trough."""
    so.box(c, cx - 30, by + 6, 60, 6, 34, OAK)
    for k in (-1, 0, 1):
        so.lathe(c, cx + k * 15, by - 1, [(0, 7), (34, 7)], rollers)
    for px in (cx - 30, cx + 25):
        bevel(c, px, by - 54, 5, 54, OAK, 4)
    bevel(c, cx - 34, by - 58, 68, 6, OAK, 4)
    d = ImageDraw.Draw(c.im)
    d.line((cx, by - 62, cx + 66, by - 30), fill=OAK[5], width=5)
    d.line((cx, by - 64, cx + 66, by - 32), fill=OAK[2], width=2)
    so.box(c, cx + 30, by + 14, 30, 4, 10, OAK)
    so.recess(c, cx + 33, by + 12, 24, 8, 2, OAK, OAK, SYRUP)


def boiling_train(c, x, by, n=4, chimney_h=120):
    """The copper train: kettles set in one brick bench over a flue, the
    largest first, a chimney at the end."""
    w = n * 30 + 10
    if chimney_h:
        chimney(c, x + w - 16, by - 18, chimney_h)
    so.box(c, x, by, w, 20, 32, lambda c, x, y, w, h: fm.brick(c, x, y, w, h))
    for k in range(n):
        R = 13 - k * 2
        so.lathe(c, x + 18 + k * 30, by - 22, [(0, R - 3), (6, R), (9, R + 1)], COPPER, hollow=(R, 3),
                 fill=(7, SYRUP), inside=COPPER, z0=0)
    glow_mouth(c, x + 16, by, 12, 12)


def edge_runner(c, cx, by):
    """A stone basin with an upright millstone rolled round it on a beam."""
    so.lathe(c, cx, by, [(0, 30), (12, 30), (14, 27)], RAMPS['limestone'], hollow=(25, 10), fill=(11, OIL))
    bevel(c, cx - 3, by - 64, 6, 52, OAK, 4)
    d = ImageDraw.Draw(c.im)
    r = RAMPS['limestone']
    d.ellipse((cx - 22, by - 52, cx + 8, by - 22), fill=r[3], outline=r[5], width=2)
    d.arc((cx - 20, by - 50, cx + 6, by - 24), 140, 300, fill=r[1], width=2)
    d.ellipse((cx - 10, by - 40, cx - 4, by - 34), fill=OAK[5])
    d.line((cx - 7, by - 37, cx + 52, by - 46), fill=OAK[5], width=4)
    d.line((cx - 7, by - 38, cx + 52, by - 47), fill=OAK[2], width=1)


def beam_press(c, x, by):
    """A lever press: a long beam pinned in two posts, weighted at its end
    by a stone, bearing on the stacked baskets of crushed fruit."""
    for px in (x, x + 12):
        bevel(c, px, by - 66, 6, 66, OAK, 4)
    for k in range(4):
        so.lathe(c, x + 42, by - k * 5, [(0, 11), (5, 11)], RAMPS['thatch'])
    so.lathe(c, x + 42, by + 6, [(0, 18), (3, 18)], RAMPS['limestone'], hollow=(16, 1), fill=(2, OIL))
    d = ImageDraw.Draw(c.im)
    d.line((x + 6, by - 46, x + 108, by - 24), fill=OAK[5], width=6)
    d.line((x + 6, by - 48, x + 108, by - 26), fill=OAK[2], width=2)
    d.line((x + 104, by - 24, x + 104, by - 8), fill=OAK[4], width=1)
    so.box(c, x + 94, by + 2, 22, 12, 14, STONE)


def ghani(c, cx, by):
    """A bullock-turned oil mill: a deep wooden mortar, the pestle leaning in
    it, the sweep that drags it round."""
    so.lathe(c, cx, by, [(0, 14), (6, 13), (26, 10), (32, 12), (35, 12)], TEAK, hollow=(9, 12),
             fill=(26, OIL), inside=TEAK)
    d = ImageDraw.Draw(c.im)
    d.line((cx - 2, by - 34, cx - 22, by - 72), fill=TEAK[4], width=5)
    d.line((cx - 3, by - 35, cx - 23, by - 73), fill=TEAK[1], width=1)
    d.line((cx + 6, by - 8, cx + 74, by + 10), fill=TEAK[5], width=5)
    d.line((cx + 6, by - 10, cx + 74, by + 8), fill=TEAK[2], width=1)
    so.box(c, cx + 62, by + 16, 16, 6, 10, TEAK)
    for k in range(3):
        props.pot(c, cx - 44 + k * 18, by + 18, 'jug', scale=1.0)


def palm_oil(c, x, by):
    """Palm fruit boiled in big pots on three stones, pounded in a trough."""
    for k in range(2):
        px = x + 18 + k * 44
        for s in (-12, 0, 12):
            so.lathe(c, px + s, by + 6 - abs(s) // 3, [(0, 4), (6, 3)], STONE)
        so.lathe(c, px, by, [(0, 9), (8, 17), (20, 18), (28, 13), (31, 14)], CLAY, hollow=(12, 20),
                 fill=(27, ramp(35, .14, lift=-.08)), inside=CLAY, z0=4)
        glow_mouth(c, px, by + 6, 10, 6)
    so.box(c, x + 6, by + 34, 90, 10, 16, TEAK)
    so.recess(c, x + 12, by + 22, 78, 10, 4, TEAK, TEAK, ramp(55, .12, lift=-.1))


def forge(c, x, by):
    """A smith's yard: a brick hearth under its hood and stack, the bellows
    at its side, the anvil on its block, the quenching trough."""
    chimney(c, x + 16, by - 50, 74, 16)
    d = ImageDraw.Draw(c.im)
    d.polygon([(x + 2, by - 30), (x + 46, by - 30), (x + 34, by - 52), (x + 14, by - 52)],
              fill=RAMPS['brick'][3], outline=RAMPS['brick'][5])
    so.box(c, x, by, 48, 28, 30, lambda c, x, y, w, h: fm.brick(c, x, y, w, h))
    for k in range(14):
        c.p(x + 8 + int(h2(k, 3) * 32), by - 36 + int(h2(k, 7) * 6), GLOW[int(h2(k, 9) * 4)])
    d.polygon([(x - 26, by - 22), (x - 2, by - 30), (x - 2, by - 20), (x - 26, by - 12)],
              fill=ramp(38, .07, lift=-.2)[3], outline=ramp(38, .07, lift=-.2)[6])
    bevel(c, x - 30, by - 22, 6, 12, OAK, 3)
    ax = x + 74
    so.lathe(c, ax, by + 2, [(0, 9), (16, 8)], OAK)
    d.polygon([(ax - 16, by - 22), (ax + 12, by - 22), (ax + 12, by - 15), (ax + 4, by - 15),
               (ax + 4, by - 13), (ax - 6, by - 13), (ax - 6, by - 17), (ax - 16, by - 20)], fill=IRON[4])
    c.rect(ax - 14, by - 22, 26, 2, IRON[1])
    so.box(c, x + 98, by + 10, 34, 12, 14, OAK)
    so.recess(c, x + 101, by - 2, 28, 10, 3, OAK, OAK, BRINE)


def box_bellows(c, x, by):
    """The Chinese double-acting box bellows lying beside a low hearth."""
    so.box(c, x, by, 56, 16, 14, OAK)
    c.rect(x + 4, by - 13, 48, 1, OAK[1])
    bevel(c, x + 56, by - 9, 18, 3, OAK, 3)
    bevel(c, x + 72, by - 14, 3, 12, OAK, 3)
    so.box(c, x + 82, by, 34, 18, 28, lambda c, x, y, w, h: fm.brick(c, x, y, w, h))
    for k in range(10):
        c.p(x + 88 + int(h2(k, 2) * 22), by - 28 + int(h2(k, 5) * 5), GLOW[int(h2(k, 8) * 4)])


def anvil(c, ax, by):
    so.lathe(c, ax, by + 2, [(0, 9), (16, 8)], OAK)
    ImageDraw.Draw(c.im).polygon([(ax - 16, by - 22), (ax + 12, by - 22), (ax + 12, by - 15), (ax + 4, by - 15),
                                  (ax + 4, by - 13), (ax - 6, by - 13), (ax - 6, by - 17), (ax - 16, by - 20)], fill=IRON[4])
    c.rect(ax - 14, by - 22, 26, 2, IRON[1])


def bloomery(c, cx, by):
    """A clay shaft furnace: tuyeres round its foot, the slag tapped beside
    it, and two pot bellows worked by hand."""
    red = LATERITE
    so.lathe(c, cx, by, [(0, 22), (8, 21), (40, 15), (70, 10), (78, 9)], red, hollow=(7, 50), inside=IRON,
             surface=None)
    for yy in range(by - 70, by - 6, 9):
        c.rect(cx - 8, yy, 16, 1, red[4])
    for dx in (-17, 0, 17):
        c.rect(cx + dx - 2, by - 8, 4, 7, CLAY[2])
        c.rect(cx + dx - 1, by - 2, 2, 2, GLOW[1])
    glow_mouth(c, cx, by + 6, 12, 10)
    so.lathe(c, cx + 46, by + 14, [(0, 16), (4, 14), (8, 8), (10, 3)], ramp(270, .03, lift=-.24))
    for k in range(2):
        px = cx - 52 + k * 20
        so.lathe(c, px, by + 6, [(0, 6), (6, 9), (14, 8)], CLAY)
        so.lathe(c, px, by - 8, [(0, 8), (2, 7)], ramp(40, .06, lift=-.02))
        bevel(c, px - 1, by - 30, 2, 22, OAK, 2)
        c.rect(px + 2, by, 30 - k * 20, 2, CLAY[3])


def glass_furnace(c, cx, by):
    """A beehive glass furnace with its glory holes alight, the annealing
    oven beside it, a rack of blowpipes."""
    from art.front_worksites import curved_masonry
    r = RAMPS['roman-brick']
    so.lathe(c, cx, by, [(0, 36), (30, 36), (44, 31), (58, 21), (66, 10), (69, 1)], r,
             surface=curved_masonry(r, 36, 7, 15))
    for dx, z in ((-22, 22), (0, 30), (22, 22)):
        glow_mouth(c, cx + dx, by - z, 8, 9)
    so.box(c, cx + 40, by + 6, 46, 30, 30, lambda c, x, y, w, h: fm.brick(c, x, y, w, h))
    glow_mouth(c, cx + 63, by + 6, 12, 10)
    for k in range(9):
        c.p(cx - 40 + int(h2(k, 3) * 24), by + 16 + int(h2(k, 5) * 5), ramp(150, .05, lift=.04)[1 + k % 3])
    for k in range(5):
        bevel(c, cx - 64 + k * 4, by - 50 + k, 2, 46 - k, IRON, 2)
    bevel(c, cx - 68, by - 52, 24, 3, OAK, 3)


def dragon_kiln(c, x, by, steps=7, roof=None):
    """A climbing kiln: a long vaulted tube stepping up the hill, a stoke
    hole in every chamber, firebox at the foot and flue at the head, all
    under a long roof on posts."""
    clay = ramp(36, .08, lift=-.1)
    hill = EARTH
    d = ImageDraw.Draw(c.im)
    sw, rise = 24, 10
    end = x + steps * sw
    d.polygon([(x - 8, by + 4), (end + 10, by + 4), (end + 10, by - steps * rise - 4), (x - 8, by - 2)],
              fill=hill[3])
    for yy in range(by - steps * rise - 4, by + 4, 3):
        for xx in range(x - 8, end + 10, 7):
            if c.g(xx, yy)[3] and h2(xx // 7, yy // 3, 3) > .6:
                c.rect(xx, yy, 5, 1, hill[2 if h2(xx, yy) > .5 else 4])
    for i in range(steps):
        sx, base = x + i * sw, by - i * rise
        top = base - 30
        fm.brick(c, sx, top + 8, sw + 1, 30 - 8, clay)
        d.chord((sx - 1, top, sx + sw + 1, top + 16), 180, 360, fill=clay[2], outline=clay[4])
        c.rect(sx + 2, top + 2, sw - 4, 2, clay[1])
        c.rect(sx, top + 8, 1, 22, clay[5])
        if i:
            glow_mouth(c, sx + sw // 2, base - 6, 6, 8)
    glow_mouth(c, x + 8, by, 12, 14)
    fm.brick(c, end - 2, by - steps * rise - 52, 14, 24, clay)
    roof = roof or RAMPS['kawara']
    for i in range(0, steps + 1, 2):
        px = x - 4 + i * sw
        bevel(c, px, by - i * rise - 58, 4, 58 - 30 + 2, OAK, 3)
    # One roof runs up the hill over every chamber, its tiles in rows along the slope.
    for xx in range(x - 8, end + 6):
        ty = round(by - 72 - (xx - x) * rise / sw)
        for k in range(14):
            col = roof[1 + k // 4] if (xx - x + k * 2) % 9 else roof[5]
            c.p(xx, ty + k, col)
        c.p(xx, ty, roof[0])
        c.rect(xx, ty + 14, 1, 2, roof[6])
        op.cast(c, xx, ty + 16, 1, 4, .6)
    for k in range(4):
        so.lathe(c, x + 6 + k * 13, by + 26, [(0, 6), (9, 6)], ramp(40, .05, lift=-.02))
        so.lathe(c, x + 6 + k * 13, by + 17, [(0, 6), (9, 6)], ramp(40, .05, lift=-.02))


def open_firing(c, x, by):
    """Pots fired in the open: the stack of pots under its mound of fuel,
    the fired ones cooling, a smoothing slab."""
    straw = ramp(68, .07, lift=-.03)
    so.lathe(c, x + 40, by + 8, [(0, 36), (8, 34), (20, 26), (30, 12), (34, 2)], straw, courses=4)
    for k in range(10):
        c.p(x + 14 + int(h2(k, 1) * 52), by - 8 + int(h2(k, 4) * 12), GLOW[1 + int(h2(k, 6) * 3)])
    for k, px in enumerate(range(x + 88, x + 136, 16)):
        props.pot(c, px, by + 12 + k % 2 * 8, 'jug', CLAY, scale=1.1)
    so.lathe(c, x + 104, by - 6, [(0, 12), (6, 12)], STONE)


def dye_pits(c, x, by):
    """Pits sunk in a raised earthen floor, each ringed by a clay rim and
    full of indigo; the dyed cloth drying on a line above."""
    cloth_line(c, x + 4, by - 6, 130, (INDIGO, INDIGO, ramp(250, .05, lift=-.08)))
    clay = ramp(48, .06, lift=-.04)
    for row in range(2):
        for col in range(3):
            cx = x + 22 + col * 42 + row * 20
            pb = by + 18 + row * 22
            so.lathe(c, cx, pb, [(0, 15), (4, 14), (6, 11)], clay, hollow=(11, 0), fill=(3, INDIGO), inside=clay)


def cloth_line(c, x, by, w, colours):
    """Lengths of dyed cloth hung over a pole on two forked posts."""
    post = ramp(42, .07, lift=-.2)
    for px in (x, x + w - 4):
        bevel(c, px, by - 58, 4, 58, post, 2)
    c.rect(x - 2, by - 58, w + 4, 2, post[2]); c.rect(x - 2, by - 56, w + 4, 1, post[5])
    n = max(1, (w - 16) // 26)
    for k in range(n):
        r = colours[k % len(colours)]
        xx = x + 8 + k * 26
        for i in range(20):
            col = r[2 if i % 9 < 3 else 4 if i % 9 > 6 else 3]
            c.rect(xx + i, by - 56, 1, 30 + (i // 7) % 2, col)
        c.rect(xx, by - 56, 20, 1, r[1])
        c.rect(xx, by - 26, 20, 1, r[5])


def tall_racks(c, x, by):
    """The tall drying frames of a southern Chinese dye works, long blue
    cloth hanging from the top bar."""
    for px in (x, x + 58, x + 116):
        bevel(c, px, by - 104, 5, 104, OAK, 3)
    bevel(c, x - 3, by - 106, 126, 5, OAK, 3)
    for k in range(5):
        xx = x + 8 + k * 22
        r = INDIGO if k % 2 == 0 else ramp(245, .05, lift=-.02)
        for i in range(14):
            c.rect(xx + i, by - 101, 1, 78 + (k * 7 % 11), r[2 if i < 4 else 3 if i < 10 else 4])
        c.rect(xx, by - 101, 14, 1, r[1])


def fez_vats(c, x, by):
    """A honeycomb of stone vats, lime white at the back, dyes in front."""
    stone = RAMPS['sandstone']
    liquids = (SALT, ramp(70, .1, lift=-.02), MADDER, ramp(45, .08, lift=-.18), SAFFRON, ramp(30, .06, lift=-.22))
    for row in range(3):
        for col in range(4):
            cx = x + 16 + col * 32 + (row % 2) * 16
            pb = by + 2 + row * 16
            so.lathe(c, cx, pb, [(0, 15), (4, 15), (5, 12)], stone, hollow=(12, 0),
                     fill=(3, liquids[(row * 4 + col) % len(liquids)]), inside=stone)


def stepped_vats(c, x, by, indigo=True):
    """Indigo works: steeping vat above, beating vat below, a settling vat
    at the foot, the liquor run from one to the next."""
    brick = lambda c, x, y, w, h: fm.brick(c, x, y, w, h, RAMPS['roman-brick'])
    liquor = (ramp(140, .07, lift=-.1), ramp(220, .07, lift=-.14), INDIGO)
    for k in range(3):
        h = 34 - k * 12
        vx, vb = x + k * 42, by + 14 + k * 10
        so.box(c, vx, vb, 44, h, 40, brick, lambda c, x, y, w, h: c.rect(x, y, w, h, RAMPS['roman-brick'][1]))
        so.recess(c, vx + 4, vb - h, 36, 32, 4, RAMPS['roman-brick'], RAMPS['roman-brick'], liquor[k])
    d = ImageDraw.Draw(c.im)
    d.line((x + 66, by - 30, x + 78, by - 4), fill=OAK[3], width=2)
    c.rect(x + 74, by - 6, 8, 3, OAK[4])


def warp_line(c, x, by, w, sledge=False):
    """A long warp laid out along the ground on sticks, or, for the West
    African strip loom, the warp dragged out to a weighted sledge."""
    yarn = (232, 222, 196, 255), (206, 194, 168, 255)
    for k in range(4):
        bevel(c, x + k * (w // 3), by - 22, 3, 22, OAK, 2)
    for i in range(6):
        c.rect(x, by - 20 + i * 2, w, 1, yarn[i % 2])
    if sledge:
        so.box(c, x + w - 18, by + 8, 22, 6, 14, OAK)
        so.lathe(c, x + w - 7, by - 1, [(0, 7), (5, 6), (8, 2)], STONE)


def sawpit(c, x, by):
    """A log on trestles over the sawpit, the long saw standing in its cut;
    seasoning timber stacked by."""
    so.recess(c, x, by + 12, 70, 18, 10, EARTH, EARTH)
    for px in (x + 6, x + 56):
        bevel(c, px, by - 18, 5, 22, OAK, 3)
    so.box(c, x - 6, by - 14, 84, 10, 10, TEAK)
    c.rect(x + 30, by - 34, 2, 44, IRON[3]); c.rect(x + 25, by - 36, 12, 3, OAK[3])
    for k in range(4):
        so.box(c, x + 92, by + 18 - k * 6, 44, 6, 14, TEAK)


def factory_yard(c, x, by):
    so.box(c, x, by + 4, 60, 18, 18, OAK)
    for k in range(3):
        so.lathe(c, x + 80 + k * 18, by + 8, [(0, 8), (18, 8)], IRON)


# ------------------------------------------------------------------ frames

class Filature(ev.EaveHouse):
    """A long reeling hall: brick, tall sash windows, a tiled roof."""


class Sawtooth(ev.EaveHouse):
    """A one-storey factory under north-light roof teeth."""
    def roof(self):
        c, x, y, W = self.c, self.x0 - 4, self.eave, self.W + 8
        glass = ramp(215, .04, lift=-.06)
        r = RAMPS['limestone']
        teeth = max(3, W // 44)
        tw = W // teeth
        self.top = y - 36
        for k in range(teeth):
            tx = x + k * tw
            for row in range(5):
                c.rect(tx, y - 34 + row * 6, tw - 10, 6, r[1 + row // 2])
            c.rect(tx + tw - 10, y - 34, 10, 30, glass[2]); c.rect(tx + tw - 10, y - 34, 10, 2, glass[0])
            for xx in range(tx + tw - 9, tx + tw, 3):
                c.rect(xx, y - 32, 1, 28, glass[5])
            c.rect(tx, y - 36, tw, 2, r[0])
        c.rect(x, y - 4, W, 4, r[4])
        self.roof_px = {(xx, yy) for yy in range(y - 36, y) for xx in range(x, x + W)}
        self.over = 4


def factory(style, info):
    if style == 'filature':
        b = Filature(dict(W=288, storeys=['flemish'], heights=[70], roof='plain', tone='kawara', rise=46,
                          windows=('timber', 'sash'), stacks=False, door='panel', wear=.2, seed=181, string=True))
    else:
        b = Sawtooth(dict(W=288, storeys=['render'], heights=[64], roof='slate', windows=('timber', 'sash'),
                          stacks=False, door='panel', wear=.15, seed=183, plinth=None))
    im = b.build()
    c = C(354, im.height + 64)
    chimney(c, b.x0 + b.W + 12, b.base + 64 - 10, 150 if style == 'filature' else 130, 18)
    c.im.alpha_composite(im, (0, 64)); c.px = c.im.load()
    base = b.base + 64
    g = dict(x0=b.x0, base=base, door_x=b.door_x, door_h=b.door_h, width=354)
    return done(c, g, info)


def caravanserai(style, info):
    looks = {
        'persian': {},
        'ottoman': dict(WALL=ramp(70, .03, lift=.02), TOP=ramp(72, .025, lift=.08), BRICK=ramp(70, .03, lift=.02),
                        DOME=ramp(250, .015, lift=-.04), PAVE=ramp(60, .03, lift=-.04)),
        'mughal': dict(WALL=sa.REDSTONE, TOP=sa.REDSTONE_TOP, BRICK=sa.REDSTONE, DOME=sa.CHUNA_TOP,
                       PAVE=ramp(34, .06, lift=.02)),
    }[style]
    spec = dict(W=256, wing=42, street=62, front=20, court=76, far=28, face=44, portal=.5)

    def court(c, L, R, top, face_h, front, face=None, trees=True):
        floor = top + face_h + 4
        pave = persia.PAVE
        for yy in range(floor, front):
            for xx in range(L, R):
                c.p(xx, yy, pave[2] if h2(xx // 6, yy // 3, 23) > .15 else pave[3])
        persia.wall(c, L, top, R - L, face_h)
        n = max(3, (R - L) // 34)
        for i in range(n):
            cx = round(L + (i + .5) * (R - L) / n)
            persia.vault(c, cx, top + face_h - 24, 24, top + face_h)
        so.box(c, L, top + face_h + 4, R - L, 3, 8, persia.TOP)
        persia.pr.well(c, (L + R) // 2, (floor + front) // 2 + 8, persia.TOP, R=9)
        for k, xx in enumerate((L + 16, R - 34)):
            so.box(c, xx, front - 6, 20, 8, 14, ramp(68, .08, lift=-.02))
            so.box(c, xx + 2, front - 14, 16, 6, 10, ramp(68, .08, lift=.02))
        persia.court_shade(c, L, R, top, floor, front)

    def roof(c, g):
        for x in (g['L'] + 9, g['R'] - 31):
            c.rect(x, g['B'] - 6, 22, 5, persia.WALL[1])

    def door(c, cx, base, g):
        persia.portal(c, cx, base, 86, w=62, rw=40)
        persia.op.door_studded(c, cx - 13, base - 48, 26, 48, wood=persia.WOOD, studs=STONE)
    with persia.materials(**looks):
        im = persia.compound(spec, info, roof=roof, door=door, court_fn=court)
    info['door_h'] = 48
    return im


def tobacco_barn(info):
    class Barn(ev.EaveHouse):
        def openings(self):
            c, x, b = self.c, self.x0, self.base
            self.door_x, self.door_h, self.sills = x + self.W // 2, 60, []
            dw = 44
            dx = self.door_x - dw // 2
            for yy in range(b - 62, b):
                for xx in range(dx, dx + dw):
                    c.p(xx, yy, (60, 44, 50, 255))
            stock(c, dx + 2, b - 4, dw - 4, 'leaf')
            for px in (dx - 22, dx + dw + 2):
                fm.clapboard(c, px, b - 62, 20, 62)
                c.rect(px, b - 62, 20, 1, OAK[5])
            bevel(c, dx - 3, b - 66, dw + 6, 4, OAK, 3)
    b = Barn(dict(W=150, storeys=['boards', 'boards'], heights=[62, 40], roof='shingle', rise=46, tone='shingle-silver',
                  stacks=False, wear=.55, seed=191, plinth=None))
    im = b.build()
    c = C(354, im.height + 40)
    c.im.alpha_composite(im, (0, 0)); c.px = c.im.load()
    x, by = b.x0 + b.W + 24, b.base
    cloth_line(c, x, by + 6, 120, (ramp(70, .09, lift=-.12),))
    so.box(c, x + 10, by + 34, 60, 10, 16, OAK)
    g = dict(x0=b.x0, base=b.base, door_x=b.door_x, door_h=b.door_h, width=354)
    return done(c, g, info)


FRAMES = {
    # style: (look, production, painter(c, x, by), top margin)
    'saltpans-europe': ('europe', 'salt', lambda c, g: salt_pans(c, g['yard'], g['base']), 0),
    'saltpans-sinitic': ('sinitic', 'salt', lambda c, g: salt_pans(c, g['yard'] - 4, g['base'], boil=True), 0),
    'saltpans-india': ('india', 'salt', lambda c, g: salt_pans(c, g['yard'], g['base']), 0),
    'saltpans-westafrica': ('westafrica', 'salt', lambda c, g: salt_pans(c, g['yard'] - 4, g['base'], boil=True), 0),
    'saltpans-andes': ('andes', 'salt', lambda c, g: salt_pans(c, g['yard'], g['base'], terraced=True), 0),
    'saltpans-pacific': ('pacific', 'salt', lambda c, g: salt_pans(c, g['yard'], g['base']), 0),
    'sugarworks-colonial': ('colonial', 'sugar', lambda c, g: (boiling_train(c, g['yard'] + 58, g['base'] + 4, 3),
                                                               cane_press(c, g['yard'] + 32, g['base'] + 42, OAK)), 50, 150),
    'sugarworks-india': ('india', 'sugar', lambda c, g: (boiling_train(c, g['yard'] + 70, g['base'] + 4, 2, 0),
                                                        cane_press(c, g['yard'] + 32, g['base'] + 42, TEAK)), 0, 150),
    'sugarworks-sinitic': ('sinitic', 'sugar', lambda c, g: (boiling_train(c, g['yard'] + 64, g['base'] + 4, 3, 0),
                                                            cane_press(c, g['yard'] + 32, g['base'] + 42, STONE)), 0, 150),
    'oilpress-mediterranean': ('europe', 'oil', lambda c, g: (beam_press(c, g['yard'] + 30, g['base'] - 10),
                                                             edge_runner(c, g['yard'] + 38, g['base'] + 38)), 0),
    'oilpress-levant': ('westasia', 'oil', lambda c, g: (beam_press(c, g['yard'] + 30, g['base'] - 10),
                                                        edge_runner(c, g['yard'] + 38, g['base'] + 38)), 0),
    'oilpress-india': ('india', 'oil', lambda c, g: ghani(c, g['yard'] + 50, g['base'] + 12), 0),
    'oilpress-westafrica': ('westafrica', 'oil', lambda c, g: palm_oil(c, g['yard'] + 4, g['base'] + 4), 0),
    'forge-europe': ('europe', 'iron', lambda c, g: forge(c, g['yard'] + 32, g['base'] + 20), 30),
    'forge-westafrica': ('westafrica', 'iron', lambda c, g: (bloomery(c, g['yard'] + 76, g['base'] + 10),
                                                            anvil(c, g['yard'] + 18, g['base'] + 34)), 0),
    'forge-sinitic': ('sinitic', 'iron', lambda c, g: (box_bellows(c, g['yard'] + 4, g['base'] + 10),
                                                      anvil(c, g['yard'] + 60, g['base'] + 36)), 0),
    'forge-india': ('india', 'iron', lambda c, g: (bloomery(c, g['yard'] + 76, g['base'] + 10),
                                                  anvil(c, g['yard'] + 18, g['base'] + 34)), 0),
    'glassworks-europe': ('europe', 'glass', lambda c, g: glass_furnace(c, g['yard'] + 66, g['base'] + 14), 0),
    'glassworks-westasia': ('westasia', 'glass', lambda c, g: glass_furnace(c, g['yard'] + 66, g['base'] + 14), 0),
    'dragonkiln-sinitic': ('sinitic', 'pots', lambda c, g: dragon_kiln(c, g['yard'] - 4, g['base'] + 8, 6), 20),
    'dragonkiln-seasia': ('seasia', 'pots', lambda c, g: dragon_kiln(c, g['yard'] - 4, g['base'] + 8, 6,
                                                                    ramp(58, .05, lift=-.08)), 20),
    'openfiring-westafrica': ('westafrica', 'pots', lambda c, g: open_firing(c, g['yard'], g['base'] + 10), 0),
    'openfiring-india': ('india', 'pots', lambda c, g: open_firing(c, g['yard'], g['base'] + 10), 0),
    'openfiring-andes': ('andes', 'pots', lambda c, g: open_firing(c, g['yard'], g['base'] + 10), 0),
    'openfiring-meso': ('meso', 'pots', lambda c, g: open_firing(c, g['yard'], g['base'] + 10), 0),
    'dyepits-sahel': ('sahel', 'dye', lambda c, g: dye_pits(c, g['yard'], g['base'] + 8), 0),
    'dyeyard-india': ('india-open', 'dye', lambda c, g: (cloth_line(c, g['yard'], g['base'] + 4, 136, (MADDER, INDIGO, SAFFRON)),
                                                        [so.lathe(c, g['yard'] + 24 + k * 44, g['base'] + 30, [(0, 15), (4, 16), (8, 14)], CLAY,
                                                                  hollow=(12, 1), fill=(6, (MADDER, INDIGO, SAFFRON)[k]), inside=CLAY)
                                                         for k in range(3)]), 0),
    'dyeyard-sinitic': ('sinitic', 'dye', lambda c, g: (tall_racks(c, g['yard'] + 4, g['base'] + 12),
                                                       [sino.vat(c, g['yard'] + 30 + k * 50, g['base'] + 32, 12) for k in range(2)]), 40),
    'tannery-fez': ('westasia', 'cloth', lambda c, g: fez_vats(c, g['yard'] - 2, g['base'] + 4), 0),
    'indigo-india': ('india', 'dye', lambda c, g: stepped_vats(c, g['yard'] + 4, g['base'] - 6), 0),
    'indigo-colonial': ('colonial', 'dye', lambda c, g: stepped_vats(c, g['yard'] + 4, g['base'] - 6), 0),
    'weaving-india': ('india-open', 'weave', lambda c, g: warp_line(c, g['yard'], g['base'] + 18, 130), 0),
    'weaving-westafrica': ('westafrica', 'weave', lambda c, g: warp_line(c, g['yard'], g['base'] + 18, 130, True), 0),
    'dhow-yard': ('swahili', 'wood', lambda c, g: sawpit(c, g['yard'], g['base'] + 10), 0),
    'junk-yard': ('sinitic', 'wood', lambda c, g: sawpit(c, g['yard'], g['base'] + 10), 0),
}
STORES = ('westafrica', 'sahel', 'india', 'seasia', 'pacific', 'andes', 'swahili', 'meso')


def draw(style, info):
    if style.startswith('store-'):
        return store(style[6:], info)
    if style in ('filature', 'sawtooth'):
        return factory(style, info)
    if style.startswith('caravanserai-'):
        return caravanserai(style.split('-', 1)[1], info)
    if style == 'tobacco-barn':
        return tobacco_barn(info)
    look, production, paint, top, *W = FRAMES[style]
    c, g = yard(look, production, W=W[0] if W else 174, top=top)
    paint(c, g)
    return done(c, g, info)


STYLES = list(FRAMES) + ['filature', 'sawtooth', 'tobacco-barn'] + \
    [f'caravanserai-{k}' for k in ('persian', 'ottoman', 'mughal')] + [f'store-{k}' for k in STORES]


if __name__ == '__main__':
    from art.front_review import sheet
    only = sys.argv[2:]
    sheet([(s, draw(s, {})) for s in STYLES if not only or any(o in s for o in only)],
          sys.argv[1] if len(sys.argv) > 1 else 'artifacts/worksites-world.png', columns=4)
