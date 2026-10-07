"""Courtyard houses of the Levant, Arabia, the Nile and the Maghrib, drawn with
the Persian house's parts in each region's materials and details.

    .venv/bin/python scripts/art/front_westasia.py artifacts/front-westasia.png

Levantine: pale limestone, the portal in black-and-white ablaq courses,
little domes on the roofs as at Jerusalem, a fountain and citrus in the court.
Arabian (Najd): red-brown mud brick, parapets stepped in triangular merlons,
triangle vents high in the walls, a painted door, a date palm in the court.
Nile: lime-washed mud brick, projecting mashrabiya on the street, a malqaf
scoop and a dovecote on the roof. Maghrebi: whitewash, green glazed tile
copings, the door under a horseshoe arch in zellige, a riad's fountain.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import RAMPS, ramp, mix  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art import front_persian as pz  # noqa: E402

LIME = ramp(80, 0.03, lift=0.06)
LIME_TOP = ramp(82, 0.025, lift=0.1)
BASALT = ramp(250, 0.015, lift=-0.3)
NAJD = ramp(46, 0.08, lift=-0.04)
NAJD_TOP = ramp(50, 0.07, lift=0.03)
NILE = ramp(72, 0.04, lift=0.04)
NILE_TOP = ramp(74, 0.035, lift=0.08)
WHITE = ramp(92, 0.014, lift=0.13)
WHITE_TOP = ramp(92, 0.01, lift=0.1)
GREEN = ramp(150, 0.12, lift=-0.12)
ZELLIGE = [ramp(150, 0.12, lift=-0.12), ramp(232, 0.1, lift=-0.1), ramp(92, 0.01, lift=0.06), ramp(60, 0.13)]
PAINT = [ramp(25, 0.14, lift=-0.08), ramp(232, 0.1, lift=-0.08), ramp(92, 0.01, lift=0.06)]


def ashlar(c, x, y, w, h):
    fm.ashlar(c, x, y, w, h, LIME, 8, 18)


def whitewash(c, x, y, w, h):
    fm.kahgel(c, x, y, w, h, WHITE)


whitewash_plain = whitewash


# ------------------------------------------------------------------ details

def merlons(c, x0, x1, y, r):
    """Najdi crenellation: stepped triangular merlons along a parapet top,
    whitewashed at their tips, lit on the left and shaded on the right."""
    for x in range(x0 + 1, x1 - 8, 10):
        for k in range(6):
            for i in range(k, 9 - k):
                q = (WHITE if k >= 4 else r)[1 if i < 4 else 3]
                c.p(x + i, y - k, q)


def vents(c, x0, x1, y):
    """Triangular vents high in a Najdi wall, in a row."""
    for x in range(x0 + 8, x1 - 8, 9):
        for k in range(4):
            for i in range(-k, k + 1):
                c.p(x + i, y + k, (44, 30, 34, 255))


def painted_door(c, cx, base, w=20, h=36):
    """A Najdi door of tamarisk boards painted in triangles and bands."""
    x = cx - w // 2
    op.raised(c, x - 4, base - h - 4, w + 8, h + 4, NAJD_TOP, 2)
    for yy in range(base - h, base):
        for xx in range(x, x + w):
            band = (yy - base + h) // 6
            tri = ((xx - x) % 6) <= abs(((yy - base + h) % 6) - 3)
            r = PAINT[band % 3]
            c.p(xx, yy, r[2] if tri else r[4])
    op.reveal(c, x, base - h, w, h, 2)
    so.box(c, x - 4, base + 3, w + 8, 3, 6, NAJD_TOP)


def ablaq_portal(c, cx, base, h, w=56):
    """A Levantine portal: courses of pale limestone and black basalt in
    turn, a round-headed door recessed in it, a stone bench either side."""
    def courses(c, x, y, ww, hh):
        for yy in range(y, y + hh):
            r = BASALT if ((yy - y) // 5) % 2 else LIME
            for xx in range(x, x + ww):
                c.p(xx, yy, r[2] if (yy - y) % 5 else r[1])
    foot = base + 4
    fy, ty = so.box(c, cx - w // 2, foot, w, h, 8, courses, LIME_TOP)
    c.rect(cx - w // 2, ty, w, fy - ty, LIME_TOP[0])
    rw = w - 22
    spring = foot - 34
    for yy in range(spring - rw // 2, foot):
        for xx in range(cx - rw // 2, cx + rw // 2):
            if fp.rounded(xx, yy, cx - rw // 2, spring, rw):
                c.p(xx, yy, mix(LIME[4], (40, 30, 70, 255), 0.35))
    op.door_studded(c, cx - 10, foot - 34, 20, 30, wood=pz.WOOD, studs=RAMPS['granite'])
    fp.cast_right(c, cx + w // 2, fy + 3, foot, 4, 0.32)


def horseshoe_door(c, cx, base, w=24, h=40):
    """A Maghrebi door under a horseshoe arch, framed in a band of zellige
    with a whitewashed alfiz round it."""
    R = w / 2 + 3
    spring = base - h + round(R)
    oy = spring - R * 0.3
    for yy in range(round(oy - R) - 6, base):
        for xx in range(round(cx - R) - 6, round(cx + R) + 7):
            d = math.hypot(xx + 0.5 - cx, yy + 0.5 - oy)
            inside = (d < R and yy < spring) or (abs(xx + 0.5 - cx) < w / 2 and yy >= spring)
            ring = (d < R + 4 and yy < spring + 2) or (abs(xx + 0.5 - cx) < w / 2 + 4 and yy >= spring)
            if inside:
                c.p(xx, yy, pz.WOOD[3] if (xx - cx) % 6 else pz.WOOD[5])
            elif ring:
                z = ZELLIGE[((xx // 2) + (yy // 2)) % len(ZELLIGE)]
                c.p(xx, yy, z[2])
    for xx in range(round(cx - R) - 8, round(cx + R) + 9):
        c.p(xx, round(oy - R) - 8, GREEN[1]); c.p(xx, round(oy - R) - 7, GREEN[3])
    c.p(cx + 4, base - h // 2, pz.BRASS[1]); c.p(cx + 4, base - h // 2 + 1, pz.BRASS[3])
    so.box(c, round(cx - R) - 4, base + 3, round(2 * R) + 8, 3, 6, WHITE_TOP)


def mashrabiya(c, x, base_y, w=22, h=26):
    """A projecting oriel of turned wooden lattice, its top and floor seen."""
    def face(c, x0, y0, w0, h0):
        op.mashrabiya(c, x0, y0, w0, h0)
    so.box(c, x, base_y, w, h, 8, face, pz.WOOD)
    for xx in range(x, x + w):
        c.p(xx, base_y, pz.WOOD[4]); c.p(xx, base_y + 1, pz.WOOD[6])
    op.cast(c, x, base_y + 2, w, 4, 0.6)


def malqaf(c, x, by, w=20, h=30):
    """A malqaf: a tall box with a sloping scoop turned to the north wind."""
    fy, ty = so.box(c, x, by, w, h, 10, NILE, NILE_TOP)
    for i in range(w):
        for k in range(8 - i * 8 // w):
            c.p(x + i, fy - 1 - k - round((fy - ty) * 0), NILE[1] if i < w // 2 else NILE[3])
    c.rect(x + 3, fy + 4, w - 6, 8, (44, 32, 40, 255))
    fp.cast_right(c, x + w, fy + 3, by, 4, 0.3)


def dovecote(c, cx, by, h=34):
    """A dovecote tower: a tapering mud cone set with the clay pots the birds
    nest in, their dark mouths in rows."""
    so.lathe(c, cx, by, [(0, 10), (h * 0.7, 8), (h, 4), (h + 3, 0.5)], NILE, courses=6)
    for row in range(2, int(h * 0.7) // 6):
        y = by - row * 6
        for i in range(-2, 3):
            c.p(cx + i * 3, y, (40, 30, 34, 255)); c.p(cx + i * 3, y - 1, NILE[1])


def green_coping(c, x0, y0, x1, y1):
    """Green glazed tiles along the parapets, lit along their tops."""
    for xx in range(x0, x1):
        c.p(xx, y0, GREEN[1]); c.p(xx, y0 + 1, GREEN[2]); c.p(xx, y0 + 2, GREEN[4])
    for yy in range(y0, y1):
        for k, q in enumerate((1, 2, 4)):
            c.p(x0 + k, yy, GREEN[q])
            c.p(x1 - 1 - k, yy, GREEN[min(7, q + 1)])


# ------------------------------------------------------------------ courts

def paving(c, L, R, y0, y1, kind):
    """A court floor: stone flags, packed sand, brick, or zellige set in a
    four-colour star grid."""
    for yy in range(y0, y1):
        for xx in range(L, R):
            lx, ly = xx - L, yy - y0
            if kind == 'stone':
                row = ly // 7
                j = (lx + (row % 2) * 9) % 18
                col = LIME[3] if j == 0 or ly % 7 == 6 else LIME[2]
            elif kind == 'sand':
                col = NAJD_TOP[2] if (lx * 7 + ly * 13) % 41 else NAJD_TOP[3]
            elif kind == 'brick':
                row = ly // 3
                col = NILE[4] if (lx + (row % 2) * 4) % 8 == 0 or ly % 3 == 2 else NILE[3]
            else:
                # white tiles with a green star at every fourth crossing
                star = (lx % 12 in (5, 6) and ly % 8 in (2, 3, 4, 5)) or (ly % 8 in (3, 4) and lx % 12 in (3, 4, 5, 6, 7, 8))
                col = ZELLIGE[0][2] if star else WHITE[2] if (lx % 6 and ly % 4) else WHITE[3]
            c.p(xx, yy, col)


def liwan_face(c, L, R, top, h):
    """The Levantine court's south face: the liwan, a tall hall open to the
    court under a round arch of ablaq voussoirs, a divan at its back; a door
    either side under a stone lintel with a grilled light above."""
    ashlar(c, L, top, R - L, h)
    cx = (L + R) // 2
    rw = min(72, (R - L) // 2)
    spring = top + 6 + rw // 2
    rad = rw / 2
    for yy in range(top + 2, top + h):
        for xx in range(cx - rw // 2 - 6, cx + rw // 2 + 7):
            d = math.hypot(xx + 0.5 - cx, yy + 0.5 - spring)
            inside = (yy >= spring and abs(xx + 0.5 - cx) < rad) or (yy < spring and d < rad)
            ring = (yy < spring and rad <= d < rad + 6) or (yy >= spring and rad <= abs(xx + 0.5 - cx) < rad + 6)
            if inside:
                t = (xx - cx + rad) / rw
                q = 5 if t < 0.25 else 4 if t < 0.6 else 3
                c.p(xx, yy, LIME[q] if yy > spring else LIME[min(7, q + 1)])
            elif ring:
                a = math.atan2(yy + 0.5 - spring, xx + 0.5 - cx)
                r = BASALT if (int((a + math.pi) * 5) % 2 and yy < spring) or (yy >= spring and ((yy - top) // 6) % 2) else LIME
                c.p(xx, yy, r[1] if d < rad + 1 else r[2])
    so.box(c, cx - rw // 2 + 4, top + h, rw - 8, 6, 10, (ramp(20, 0.12, lift=-0.08)))
    for side in (-1, 1):
        dx = cx + side * (rw // 2 + (R - L - rw) // 4) - 9
        op.raised(c, dx - 4, top + h - 34, 26, 4, LIME, 1)
        op.door_plank(c, dx, top + h - 30, 18, 30)
        op.grille(c, dx + 3, top + h - 44, 12, 8)
    so.box(c, L, top + h + 4, R - L, 3, 8, LIME_TOP)


def plain_face(c, L, R, top, h, wall_fn, ramp_, doors='plain', vents_=False, screens=False):
    """A court face of plain walls: doors, Najdi vents, or Cairene screens."""
    wall_fn(c, L, top, R - L, h)
    n = 3
    for i in range(n):
        dx = round(L + (i + 0.5) * (R - L) / n) - 9
        if doors == 'painted':
            painted_door(c, dx + 9, top + h, 18, 30)
        else:
            op.door_plank(c, dx, top + h - 30, 18, 30)
        if screens:
            op.mashrabiya(c, dx - 2, top + 4, 22, 14)
            op.reveal(c, dx - 2, top + 4, 22, 14, 2)
    if vents_:
        vents(c, L, R, top + 3)
    so.box(c, L, top + h + 4, R - L, 3, 8, ramp_)


def riad_face(c, L, R, top, h):
    """The Maghrebi court's face: an arcade of horseshoe arches over a band of
    zellige, a green-tiled cornice along its top."""
    whitewash(c, L, top, R - L, h)
    bay = 30
    n = max(2, (R - L) // bay)
    span = (R - L) / n
    for i in range(n):
        cx = round(L + (i + 0.5) * span)
        rw = round(span) - 10
        rad = rw / 2 + 2
        spring = top + 8 + round(rad)
        oy = spring - rad * 0.3
        for yy in range(top + 4, top + h - 6):
            for xx in range(cx - rw // 2 - 3, cx + rw // 2 + 4):
                d = math.hypot(xx + 0.5 - cx, yy + 0.5 - oy)
                if (yy < spring and d < rad) or (yy >= spring and abs(xx + 0.5 - cx) < rw / 2):
                    t = (xx - cx + rw / 2) / rw
                    c.p(xx, yy, WHITE[5] if t < 0.3 else WHITE[4])
    for yy in range(top + h - 8, top + h):
        for xx in range(L, R):
            z = ZELLIGE[((xx - L) // 3 + (yy - top) // 3) % 4]
            c.p(xx, yy, z[2] if (xx % 3 and yy % 3) else z[4])
    green_coping(c, L, top, R, top + 3)
    so.box(c, L, top + h + 4, R - L, 3, 8, WHITE_TOP)


def court_of(region):
    """The region's court: its face, floor, centrepiece and planting."""
    def draw(c, L, R, top, face_h, front, face=None, trees=True):
        floor = top + face_h + 4
        paving(c, L, R, floor, front, {'levantine': 'stone', 'arabian': 'sand', 'nile': 'brick',
                                       'maghrebi': 'zellige'}[region])
        if region == 'levantine':
            liwan_face(c, L, R, top, face_h)
        elif region == 'arabian':
            plain_face(c, L, R, top, face_h, lambda c, x, y, w, h: fm.kahgel(c, x, y, w, h, NAJD), NAJD_TOP,
                       'painted', vents_=True)
        elif region == 'nile':
            plain_face(c, L, R, top, face_h, lambda c, x, y, w, h: fm.kahgel(c, x, y, w, h, NILE), NILE_TOP,
                       screens=True)
        else:
            riad_face(c, L, R, top, face_h)
        cx, mid = (L + R) // 2, (floor + front) // 2 + 4
        if region == 'levantine':
            pr.fountain(c, cx, mid + 6, 'tiered', LIME, R=13)
            for x, kind in ((L + 26, 'lemon'), (R - 26, 'orange')):
                pr.tree(c, x, front - 8, kind, 0.95)
        elif region in ('arabian', 'nile'):
            pr.tree(c, L + 30, front - 6, 'palm', 1.0)
            pr.well(c, R - 34, mid + 8, NAJD_TOP if region == 'arabian' else NILE_TOP, R=8)
        else:
            pr.fountain(c, cx, mid + 6, 'basin', ZELLIGE[2], R=11)
            for x in (L + 22, R - 22):
                for y in (floor + 14, front - 6):
                    pr.tree(c, x, y, 'orange', 0.75)
        pz.court_shade(c, L, R, top, floor, front)
    return draw


# ------------------------------------------------------------------ regions

def _roof_domes(c, g, R=12):
    for x in (g['L'] + g['wing'] // 2, g['R'] - g['wing'] // 2):
        for y in (g['court_top'] + 24, g['court_front'] - 16):
            pz.dome(c, x, y, min(R, g['wing'] // 2 - 6))


REGIONS = {
    'levantine': dict(
        ramps=dict(WALL=LIME, TOP=LIME_TOP, DOME=LIME_TOP, PAVE=ramp(80, 0.03, lift=-0.02), WALL_FN=ashlar),
        roof=lambda c, g: _roof_domes(c, g),
        door=lambda c, x, base, g: ablaq_portal(c, x, base, 70),
        small_extra=lambda c, g: None, small_dome=True),
    'arabian': dict(
        ramps=dict(WALL=NAJD, TOP=NAJD_TOP, PAVE=ramp(46, 0.06, lift=-0.08), WALL_FN=None),
        roof=lambda c, g: [merlons(c, g['L'], g['R'], g['B'] + 1, NAJD_TOP),
                           merlons(c, g['L'], g['R'], g['E'] - 1, NAJD_TOP)],
        door=lambda c, x, base, g: [vents(c, g['L'], g['R'], g['E'] + 8), painted_door(c, x, base)],
        small_extra=lambda c, g: [merlons(c, g['L'], g['R'], g['E'] - 1, NAJD_TOP),
                                  merlons(c, g['L'], g['R'], g['B'] + 1, NAJD_TOP),
                                  vents(c, g['L'], g['R'], g['E'] + 8)],
        small_dome=False),
    'nile': dict(
        ramps=dict(WALL=NILE, TOP=NILE_TOP, PAVE=ramp(60, 0.05, lift=-0.04), WALL_FN=None),
        roof=lambda c, g: [malqaf(c, g['R'] - g['wing'] // 2 - 10, g['B'] + 18),
                           dovecote(c, g['L'] + g['wing'] // 2, g['court_top'] + 30)],
        door=lambda c, x, base, g: [pz.plain_door(c, x, base),
                                    mashrabiya(c, g['L'] + 24, g['E'] + 34),
                                    mashrabiya(c, g['R'] - 48, g['E'] + 34)],
        small_extra=lambda c, g: dovecote(c, g['R'] - 26, g['B'] + 20, 28),
        small_dome=False),
    'maghrebi': dict(
        ramps=dict(WALL=WHITE, TOP=WHITE_TOP, PAVE=ramp(150, 0.04, lift=0.0), WALL_FN=whitewash_plain),
        roof=lambda c, g: [green_coping(c, g['L'], g['B'], g['R'], g['E']),
                           green_coping(c, g['CL'] - 3, g['court_top'] - 3, g['CR'] + 3, g['court_front'] + 3)],
        door=lambda c, x, base, g: horseshoe_door(c, x, base),
        small_extra=lambda c, g: green_coping(c, g['L'], g['B'], g['R'], g['E']),
        small_dome=False),
}


def courtyard(region, spec=None, info=None):
    """A courtyard house of the region, its size from the spec's width."""
    rg = REGIONS[region]
    s = {**dict(W=300, wing=58, street=66, front=24, court=96, far=26, face=40, portal=0.5), **(spec or {})}
    with pz.materials(**rg['ramps']):
        return pz.compound(s, info, roof=rg['roof'], door=rg['door'], court_fn=court_of(region))


def small(region, spec=None, info=None):
    """A one-room house of the region: a flat roof behind its parapet, a
    little dome in the Levant, the region's parapet and door."""
    rg = REGIONS[region]
    s = {**dict(W=140, dome=rg['small_dome']), **(spec or {})}
    s['extra'] = rg['small_extra']
    with pz.materials(**rg['ramps']):
        return pz.house(s, info)


SHEET = [(f'{r} courtyard', (lambda r: lambda: courtyard(r))(r)) for r in REGIONS] + \
        [(f'{r} small', (lambda r: lambda: small(r))(r)) for r in REGIONS]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    rows = [[fn() for name, fn in SHEET if 'courtyard' in name], [fn() for name, fn in SHEET if 'small' in name]]
    a = current_adult()
    W = max(sum(i.width + 8 for i in r) for r in rows) + a.width + 10
    H = sum(max(i.height for i in r) + 8 for r in rows)
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 8
        bg.alpha_composite(a, (x, y + h - 4 - a.height))
        y += h + 8
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-westasia.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
