"""The Persian courtyard house of the plateau, from the library's parts.

    .venv/bin/python scripts/art/front_persian.py artifacts/front-persian.png

Safavid to Qajar vernacular, as at Yazd and Kashan: a street wall of
mud-and-straw plaster with the door deep in a tall brick portal; behind it
the house's flat roofs, one walked-on slab round the court, a dome over each
of the main rooms and a windcatcher at a corner; sunk in the slab the court,
its far range's face with the iwan, its pool and fountain, its trees.

The form reads by value, as the gold masters do: the sunlit roof slab is the
lightest surface, outlined by a lit parapet lip and a dark line inside it;
walls are a step darker; the court is shaded along its left and far edges.
Without the windcatcher and tilework the same parts stand for an older
plateau house.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402

WALL = ramp(56, 0.07, lift=-0.06)
TOP = ramp(68, 0.055, lift=0.05)
BRICK = ramp(58, 0.09, lift=-0.06)
DOME = ramp(62, 0.06, lift=0.02)
FAIENCE = ramp(200, 0.1, lift=-0.06)
LAPIS = ramp(255, 0.11, lift=-0.2)
WOOD = ramp(40, 0.06, lift=-0.16)
PAVE = ramp(48, 0.06, lift=-0.06)
BRASS = ramp(80, 0.11, lift=0.0)


def wall(c, x, y, w, h):
    """Mud-and-straw plaster, with here and there a patch fallen to show the
    mud brick under it."""
    fm.kahgel(c, x, y, w, h, WALL)
    for k in range(max(1, w * h // 6000)):
        cx = x + 14 + h2(k, w, 53) * (w - 28)
        cy = y + 10 + h2(k, h, 54) * (h - 26)
        for yy in range(int(cy) - 3, int(cy) + 4):
            for xx in range(int(cx) - 7, int(cx) + 8):
                if ((xx - cx) / 7) ** 2 + ((yy - cy) / 3.4) ** 2 <= 1:
                    row, ly = (yy - y) // 4, (yy - y) % 4
                    lx = (xx - x + (row % 2) * 4) % 8
                    c.p(xx, yy, WALL[4] if ly == 3 or lx == 7 else WALL[3])
                elif ((xx - cx) / 8) ** 2 + ((yy - cy) / 4.4) ** 2 <= 1:
                    c.p(xx, yy, WALL[1] if yy < cy else WALL[3])


def plaster(c, x, y, w, h):
    fm.kahgel(c, x, y, w, h, WALL)


def slab(c, x, y, w, h):
    """The flat roofs in the sun, never one flat colour: they step from light
    at the upper left to a deeper tone at the lower right, the steps' edges
    wandering as trowelled plaster does, a seam here and there."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            t = 0.55 * (xx - x) / w + 0.45 * (yy - y) / h + 0.06 * math.sin(xx * 0.045 + 1.3) * math.cos(yy * 0.07)
            q = 0 if t < 0.16 else 1 if t < 0.5 else 2 if t < 0.84 else 3
            if (yy - y) % 20 == 19 and h2(xx // 34, yy // 20, 91) > 0.55:
                q = min(4, q + 1)
            c.p(xx, yy, TOP[q])


def brick(c, x, y, w, h):
    fm.brick(c, x, y, w, h, BRICK)


def frame(c, x0, y0, x1, y1, inner=False):
    """Parapets seen from above round a rectangle of roof, three pixels of
    lit coping on every side; where a parapet faces us across the roof (the
    far side of the roof, or round the court the side across from us) its
    face shows below the coping before the roof begins."""
    lip = (TOP[0], TOP[0], TOP[1])
    face = (WALL[1], WALL[2], WALL[2], WALL[3])
    if not inner:
        for xx in range(x0, x1):
            for k, q in enumerate(lip + face):
                c.p(xx, y0 + k, q)
            for k, q in enumerate(lip):
                c.p(xx, y1 - 3 + k, q)
        for yy in range(y0, y1):
            for k, q in enumerate(lip):
                c.p(x0 + k, yy, q)
                c.p(x1 - 1 - k, yy, q)
            c.p(x0 + 3, yy, WALL[3])
    else:
        for xx in range(x0 - 3, x1 + 3):
            for k, q in enumerate(lip):
                c.p(xx, y0 - 3 + k, q)
                c.p(xx, y1 + k, q)
        for yy in range(y0 - 3, y1 + 3):
            for k, q in enumerate(lip):
                c.p(x0 - 3 + k, yy, q)
                c.p(x1 + k, yy, q)


def arch(c, cx, spring, w, bottom, fn):
    x0 = cx - w // 2
    for yy in range(spring - fp.apex('persian', w) - 1, bottom):
        for xx in range(x0, x0 + w):
            if fp.persian(xx, yy, x0, spring, w):
                fn(xx, yy, (xx - x0) / w)


def tile_frame(c, cx, spring, w, bottom, band=3):
    """Turquoise tile round a Persian arch, lit along its outer edge."""
    x0 = cx - w // 2 - band
    for yy in range(spring - fp.apex('persian', w + 2 * band) - 1, bottom):
        for xx in range(x0, x0 + w + 2 * band):
            if fp.persian(xx, yy, x0, spring, w + 2 * band) and not fp.persian(xx, yy, cx - w // 2, spring, w):
                outer = not fp.persian(xx, yy, x0 + 1, spring, w + 2 * band - 2)
                c.p(xx, yy, FAIENCE[1] if outer else FAIENCE[3] if (xx + yy) % 5 else LAPIS[2])


def vault(c, cx, spring, w, bottom):
    """A deep arched recess: its half-dome lit on the right where the sun
    reaches in, dark at the crown and on the left; the back wall in shade."""
    top = spring - fp.apex('persian', w)

    def f(xx, yy, t):
        up = (spring - yy) / max(1, spring - top)
        light = (0.25 + 0.55 * t - 0.35 * up) if yy < spring else 0.18 + 0.22 * t
        q = 2 if light > 0.6 else 3 if light > 0.42 else 4 if light > 0.25 else 5 if light > 0.1 else 6
        c.p(xx, yy, WALL[q])
    arch(c, cx, spring, w, bottom, f)


def tile_band(c, x, y, w, h=5):
    """A frieze of tile: lapis ground, a running turquoise scroll."""
    c.rect(x, y, w, h, LAPIS[3])
    for xx in range(x, x + w):
        yy = y + h // 2 + round(math.sin((xx - x) * 0.6) * (h // 2 - 1))
        c.p(xx, yy, FAIENCE[1] if (xx // 4) % 3 else (240, 236, 220, 255))
    c.rect(x, y - 1, w, 1, FAIENCE[0])
    c.rect(x, y + h, w, 1, FAIENCE[4])


def lattice_window(c, x, y, w, h):
    op.raised(c, x - 2, y - 2, w + 4, h + 4, BRICK, 2)
    op.lattice(c, x, y, w, h)
    op.reveal(c, x, y, w, h, 2)
    c.rect(x - 3, y + h + 2, w + 6, 1, TOP[0])
    op.cast(c, x - 2, y + h + 3, w + 4, 2, 0.7)


def dome(c, cx, by, R):
    """A mud-brick dome on the roof: its courses as rings, lit upper left,
    a low ring at its foot, its shadow down the roof to the lower right."""
    for yy in range(by - 2, by + round(R * so.K) + 4):
        for xx in range(cx - R + 2, cx + R + 7):
            if ((xx - cx - 5) / (R + 1)) ** 2 + ((yy - by - 2) / (R * so.K + 1.5)) ** 2 <= 1:
                fp.shade(c, xx, yy, 0.32)
    so.lathe(c, cx, by, [(0, R + 1.5), (2, R + 1.5)], TOP)
    so.dome(c, cx, by, R, DOME, z0=2, kind='hemi', courses=3)


def windcatcher(c, x, by, w, h, d):
    """A badgir: a tower slotted near its top, its cap's top lit, lit on its
    left and in shade on its right, its shadow down the roof."""
    def face(c, x0, y0, w0, h0):
        for yy in range(y0, y0 + h0):
            for xx in range(x0, x0 + w0):
                t = (xx - x0) / w0
                c.p(xx, yy, WALL[1] if t < 0.2 else WALL[2] if t < 0.7 else WALL[3])
        for yy in range(y0 + 6, y0 + 22):
            for xx in range(x0 + 3, x0 + w0 - 3):
                c.p(xx, yy, (44, 32, 40, 255) if (xx - x0 - 3) % 3 != 2 else WALL[2])
    fy, ty = so.box(c, x, by, w, h, d, face, TOP)
    c.rect(x, ty, w, fy - ty, TOP[0])
    fp.cast_right(c, x + w, fy + 4, by, 6, 0.32)


def portal(c, cx, by, h, w=64, d=8, rw=38):
    """The street door's portal: a brick frame standing proud of the wall and
    over the parapet, a tile frieze across its top, a deep recess under a
    Persian arch framed in tile, a bench either side of the door."""
    foot = by + round(d * so.K)
    fy, ty = so.box(c, cx - w // 2, foot, w, h, d, brick, TOP)
    c.rect(cx - w // 2, ty, w, fy - ty, TOP[0])
    tile_band(c, cx - w // 2 + 5, fy + 5, w - 10)
    spring = foot - 30
    vault(c, cx, spring, rw, foot)
    tile_frame(c, cx, spring, rw, foot)
    for side in (-1, 1):
        bx = cx - rw // 2 if side < 0 else cx + 10
        so.box(c, bx, foot, rw // 2 - 10, 8, 6, TOP)
    op.door_studded(c, cx - 10, foot - 38, 20, 34, wood=WOOD, studs=RAMPS['granite'])
    for (dx, dy) in ((-3, 0), (3, -2)):
        c.p(cx + dx, foot - 21 + dy, BRASS[1]); c.p(cx + dx, foot - 20 + dy, BRASS[3])
    fp.cast_right(c, cx + w // 2, fy + 3, foot, 4, 0.32)


def court_face(c, L, R, top, h):
    """The far range's face across the court, square to us: the iwan in the
    middle under a tile-framed arch, a door either side under coloured glass,
    a raised walk along its foot with pots on it."""
    for yy in range(top, top + h):
        for xx in range(L, R):
            c.p(xx, yy, WALL[2])
    wall(c, L, top, R - L, h)
    cx = (L + R) // 2
    rw = 34
    vault(c, cx, top + h - 18, rw, top + h)
    tile_frame(c, cx, top + h - 18, rw, top + h)
    op.door_studded(c, cx - 8, top + h - 20, 16, 18, wood=WOOD, studs=RAMPS['granite'])
    for side in (-1, 1):
        dx = cx + side * (R - L) // 4 - 8
        op.raised(c, dx - 3, top + h - 30, 22, 30, BRICK, 2)
        for yy in range(top + h - 28, top + h - 20):
            for xx in range(dx, dx + 16):
                g = (ramp(85, 0.14), ramp(150, 0.1, lift=-0.1), ramp(25, 0.15, lift=-0.1))[(xx // 4 + yy // 4) % 3]
                c.p(xx, yy, g[2] if (xx + yy) % 4 else WOOD[3])
        op.door_plank(c, dx, top + h - 19, 16, 19)
    so.box(c, L, top + h + 4, R - L, 3, 8, TOP)
    for x in range(L + 10, R - 6, (R - L - 16) // 5):
        if abs(x - cx) > rw // 2 + 4:
            pr.pot(c, x, top + h + 2, 'flowerpot', pr.CLAY)
            pr.shrub(c, x, top + h - 7, 4)


def court(c, L, R, top, face_h, front):
    """The court from above: brick paving, the pool with its jet, a tree in a
    bed either side, the shade of the ranges along its left and far edges."""
    floor = top + face_h + 4
    for yy in range(floor, front):
        for xx in range(L, R):
            row = (yy - floor) // 4
            j = (xx + (row % 2) * 6) % 12
            c.p(xx, yy, PAVE[3] if j == 0 or (yy - floor) % 4 == 3 else PAVE[2])
    court_face(c, L, R, top, face_h)
    cx = (L + R) // 2
    pw, pd = (R - L) * 2 // 5, (front - floor) * 2 - 16
    pr.pool(c, cx - pw // 2, front - 6, pw, pd, kerb=FAIENCE, water=pr.WATER, depth=3)
    jy = front - 6 - round(pd * so.K / 2)
    so.lathe(c, cx, jy, [(0, 3), (3, 2), (4, 2.5)], RAMPS['marble'])
    for k in range(10):
        c.p(cx, jy - 4 - k, pr.WATER[0]); c.p(cx + 1, jy - 4 - k, pr.WATER[1])
    for side in (-1, 1):
        for k in range(6):
            c.p(cx + side * (2 + k), jy - 13 + k * k // 3, pr.WATER[0])
    so.ellipse(c, cx, jy + 1, 6, 2, pr.WATER[2])
    bw = (R - L - pw) // 2 - 12
    for bx, kind in ((L + 6, 'pomegranate'), (R - 6 - bw, 'orange')):
        pr.tree(c, bx + bw // 2, front - 16, kind, 1.0)
        pr.planter(c, bx, front - 3, bw, 10, ('shrub', 'shrub'), r=BRICK)
    for k in range(10):
        for yy in range(top, front):
            fp.shade(c, L + k, yy, 0.5 * (1 - k / 10))
    for k in range(5):
        for xx in range(L, R):
            fp.shade(c, xx, floor + k, 0.3 * (1 - k / 5))


def street_wall(c, L, R, E, base):
    """The street face: plaster over mud brick, a fired-brick plinth, the
    parapet's lit edge on top and its shadow down the wall, darker toward
    the foot."""
    W = R - L
    wall(c, L, E, W, base - E)
    brick(c, L, base - 10, W, 10)
    c.rect(L, base - 11, W, 1, TOP[1])
    op.cast(c, L, base - 10, W, 1, 0.8)
    for xx in range(L, R):
        c.p(xx, E, TOP[0]); c.p(xx, E + 1, WALL[3])
    for k in range(8):
        for xx in range(L, R):
            fp.shade(c, xx, E + 2 + k, 0.4 * (1 - k / 8))
    for k in range(6):
        for xx in range(L, R):
            fp.shade(c, xx, base - 11 - k, 0.14 * (1 - k / 6))


def roof_slab(c, L, R, B, E):
    """A flat roof with parapets all round, each throwing its shadow onto the
    roof below and to the right of it."""
    slab(c, L, B, R - L, E - B)
    frame(c, L, B, R, E)
    for k in range(5):
        a = 0.3 * (1 - k / 5)
        for xx in range(L + 3, R - 1):
            fp.shade(c, xx, B + 7 + k, a)
        for yy in range(B + 3, E):
            fp.shade(c, L + 3 + k, yy, a)


def spouts(c, L, R, E, skip=()):
    for xx in range(L + 16, R - 10, 54):
        if all(abs(xx - s) > 36 for s in skip):
            so.box(c, xx, E + 5, 3, 3, 8, WOOD)
            op.cast(c, xx, E + 5, 3, 3, 0.7)


def plain_door(c, cx, base, w=20, h=36):
    """A modest door: a shallow arched recess in the wall, a plank door with a
    knocker, a stone step whose top we see."""
    rw = w + 8
    spring = base - h + 4
    vault(c, cx, spring, rw, base)
    op.door_plank(c, cx - w // 2, base - h + 6, w, h - 6)
    c.p(cx + 4, base - h // 2, BRASS[1]); c.p(cx + 4, base - h // 2 + 1, BRASS[3])
    so.box(c, cx - rw // 2 - 2, base + 3, rw + 4, 3, 6, TOP)


def barrel_vaults(c, L, R, E, D, n=2):
    """Rooms roofed in mud-brick barrel vaults running back from the street,
    springing from the top of its wall: each a true half-cylinder, its rings
    arching back up the screen, its arched end over the wall, a gutter and
    a shadow between one vault and the next."""
    vw = (R - L) / n
    for i in range(n):
        a, b = L + i * vw, L + (i + 1) * vw
        cx = (a + b) / 2
        so.vault(c, cx, E, vw / 2 - 1, D, DOME, WALL)
        for yy in range(E - round(D * so.K) - round(vw / 2), E):
            fp.shade(c, round(b) - 1, yy, 0.4)
    for xx in range(L, R):
        c.p(xx, E, TOP[0])


def persian(spec=None, info=None):
    """A courtyard house of any size: below about 220px it takes a plain door
    for the tiled portal, fewer domes and a smaller windcatcher."""
    s = {**dict(W=300, wing=58, street=66, front=24, court=96, far=26, face=40, portal=0.5), **(spec or {})}
    W, wing = s['W'], s['wing']
    small = W < 220
    head = 52 if not small else 40
    H = s['street'] + s['front'] + s['court'] + s['far'] + head + 8
    c = C(W + 24, H)
    L, R = 12, 12 + W
    base = H - 4
    E = base - s['street']
    court_front = E - s['front']
    court_top = court_front - s['court']
    B = court_top - s['far']
    CL, CR = L + wing, R - wing
    slab(c, L, B, W, E - B)
    court(c, CL, CR, court_top, s['face'], court_front)
    frame(c, L, B, R, E)
    frame(c, CL, court_top, CR, court_front, inner=True)
    for k in range(5):
        a = 0.3 * (1 - k / 5)
        for xx in range(L + 3, R - 1):
            fp.shade(c, xx, B + 7 + k, a)
        for yy in range(B + 3, E):
            fp.shade(c, L + 3 + k, yy, a)
        for yy in range(court_top - 3, court_front + 3):
            fp.shade(c, CR + 3 + k, yy, a)
        for xx in range(CL - 3, CR + 3):
            fp.shade(c, xx, court_front + 3 + k, a)
    R1, R2 = min(15, wing // 2 - 5), min(13, wing // 2 - 6)
    domes = [(L + wing // 2, court_top + 30, R1), (R - wing // 2, court_front - 18, R2)]
    if not small:
        domes += [(L + wing // 2, court_front - 18, R2), (R - wing // 2, court_top + 30, R1),
                  (L + wing // 2 + 4, B + 16, 17)]
    for cx, cy, R_ in domes:
        dome(c, cx, cy, R_)
    windcatcher(c, R - wing // 2 - (10 if not small else 7), B + 14, 20 if not small else 14,
                44 if not small else 30, 10)
    street_wall(c, L, R, E, base)
    pcx = L + round(W * s['portal'])
    for wx in (L + 26, L + 64, R - 78, R - 40):
        if abs(wx + 7 - pcx) > (44 if not small else 24) and L < wx < R - 20:
            lattice_window(c, wx, base - 46, 14, 14)
    spouts(c, L, R, E, (pcx,))
    if small:
        plain_door(c, pcx, base)
    else:
        portal(c, pcx, base, s['street'] + 18)
    if info is not None:
        info.update(x0=L, W=W, base=base, door_x=pcx, door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def house(spec=None, info=None):
    """A one-room house of mud brick, as built on the plateau from the
    Achaemenids to now: a flat roof behind a parapet, a dome over the room,
    a door and a small lattice window, a ladder to the roof."""
    s = {**dict(W=124, street=58, depth=44, dome=True, door=0.34), **(spec or {})}
    W = s['W']
    H = s['street'] + s['depth'] + 48
    c = C(W + 24, H)
    L, R = 12, 12 + W
    base = H - 4
    E = base - s['street']
    B = E - s['depth']
    roof_slab(c, L, R, B, E)
    if s['dome']:
        dome(c, L + W * 2 // 3, B + s['depth'] // 2 + 4, min(22, W // 4))
    street_wall(c, L, R, E, base)
    dx = L + round(W * s['door'])
    plain_door(c, dx, base)
    lattice_window(c, L + W - 34, base - 44, 14, 14)
    spouts(c, L, R, E, (dx,))
    ladder(c, L + W - 12, base, s['street'] + 8)
    if info is not None:
        info.update(x0=L, W=W, base=base, door_x=dx, door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def vaulted(spec=None, info=None):
    """A house of rooms under barrel vaults running back from the street, the
    oldest roof the plateau has and still the commonest in Yazd's old town."""
    s = {**dict(W=150, street=54, depth=64, vaults=None), **(spec or {})}
    W = s['W']
    n = s['vaults'] or max(1, round(W / 46))
    H = s['street'] + round(s['depth'] * so.K) + round(W / n / 2) + 16
    c = C(W + 24, H)
    L, R = 12, 12 + W
    base = H - 4
    E = base - s['street']
    B = E - s['depth']
    street_wall(c, L, R, E, base)
    barrel_vaults(c, L, R, E + 1, s['depth'], n)
    vw = W / n
    for i in range(n):
        cx = round(L + (i + 0.5) * vw)
        if i == 0:
            plain_door(c, cx, base)
        else:
            lattice_window(c, cx - 7, base - 42, 14, 14)
    spouts(c, L, R, E, tuple(round(L + (i + 0.5) * vw) for i in range(n)))
    if info is not None:
        info.update(x0=L, W=W, base=base, door_x=round(L + 0.5 * vw), door_h=36)
    finish(c)
    consolidate(c, rare=4)
    return c.im


def ladder(c, x, base, h):
    """A pole ladder leaning on the wall, its rungs lit on top."""
    for k in range(h):
        for dx in (0, 7):
            c.p(x + dx - k // 12, base - k, WOOD[2] if dx == 0 else WOOD[3])
    for k in range(4, h, 7):
        for dx in range(1, 7):
            c.p(x + dx - k // 12, base - k, WOOD[1])
    fp.cast_right(c, x + 8, base - h, base, 2, 0.3)


SHEET = [('courtyard house', persian), ('small courtyard house',
         lambda: persian(dict(W=180, wing=40, street=58, front=18, court=70, far=20, face=32, portal=0.36))),
         ('domed house', house), ('vaulted house', vaulted),
         ('vaulted row', lambda: vaulted(dict(W=230)))]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    ims = [fn() for _, fn in SHEET]
    a = current_adult()
    W = sum(i.width + 8 for i in ims) + a.width + 10
    H = max(i.height for i in ims) + 6
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    x = 4
    for im in ims:
        bg.alpha_composite(im, (x, H - 2 - im.height)); x += im.width + 8
    bg.alpha_composite(a, (x, H - 6 - a.height))
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-persian.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
