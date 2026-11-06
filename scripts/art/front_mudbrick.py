"""Mud-brick houses before the Iron Age, drawn front-on, one look per region.

    .venv/bin/python scripts/art/front_mudbrick.py artifacts/mudbrick/sheet.png [study ...]

Çatalhöyük: cells built wall to wall with no doors; people came in down a
ladder through the roof, and the hatch let out the smoke. Mesopotamia:
mud plaster on a bitumened footing, palm-log beams through the wall, a
reed-mat shade on the roof; the large house is Old Babylonian Ur's, two
storeys round a court. Egypt: lime-washed, the door frame painted red,
stone-grilled windows high up, beehive granaries beside the house (Deir
el-Medina, Amarna). Indus: fired brick laid in courses, no windows on the
street, a chute from the upper floor into the covered street drain
(Mohenjo-daro). Levant: a fieldstone footing under the brick, the stone
pillars of the stable bay, a stone roller kept on the roof to pack it.

The upper rooms of Indus houses are inferred from stairs and wall thickness;
their timber screens are a guess. Everything else follows excavated houses.

A block's wall is square on; its flat roof is a deck seen from above behind
the parapet, shaded under the back and left parapets. Palettes are six
steps, dark to light, as in front_huts.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, h2  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art.front_huts import PAL as HUT, _rgb, turn, DARK, DOORWAY  # noqa: E402

PAL = dict(HUT)
PAL.update({k: [_rgb(c) for c in v] for k, v in {
    'catal': ['#3e3226', '#625040', '#86725c', '#a8967c', '#c6b69a', '#ddd0b6'],
    'tan': ['#432c1e', '#6a4a32', '#906a48', '#b28a62', '#cca880', '#e2c49c'],
    'lime': ['#4e463e', '#7c7264', '#a8a08c', '#cec8b4', '#e8e4d2', '#f8f5ea'],
    'nile-mud': ['#3c2a20', '#5e4432', '#7e5e46', '#9e7a5c', '#b89676', '#ceb090'],
    'brick': ['#3e2420', '#60382a', '#844e36', '#a26644', '#ba805a', '#d09e78'],
    'levant': ['#4a3c2e', '#72604a', '#9a8668', '#bca886', '#d6c4a2', '#eadcbe'],
    'field': ['#38322e', '#5a524a', '#7c7266', '#9c9282', '#b8ae9c', '#d2cab8'],
    'bitumen': ['#221c22', '#30282c', '#403436', '#524444', '#665656', '#7c6c6a'],
    'dung': ['#2e2218', '#4a3624', '#6a5034', '#8a6c48', '#a68a62', '#bea67e'],
    'frond': ['#1e2e1c', '#2e4426', '#3e5c2e', '#52763a', '#6c9046', '#8aaa58'],
    'date': ['#4a1c10', '#7a3016', '#a8481c', '#c8642a', '#dc8838', '#eaaa50'],
    'clay': ['#40221a', '#683824', '#905034', '#b06a44', '#c88a5c', '#dcaa7c'],
    'blue': ['#1e2836', '#2c3c52', '#3e546e', '#567090', '#7690ac', '#9cb2c6'],
}.items()})


def P(pal, k):
    return pal[max(0, min(5, k))]


# ------------------------------------------------------------------ walls

def plaster(seed):
    """Mud plaster: straw and trowel marks in short strokes, a step dark and
    a step light, and runnels under the ledge where rain carried mud down."""
    def at(x, y, k):
        if k == 3:
            if h2((x + 2 * (y % 3)) // 3, y, seed) > 0.955:
                k = 2
            elif h2((x + y) // 4, y, seed + 5) > 0.96:
                k = 4
        if y < 18 and h2(x, 1, seed + 2) > 0.93 - y * 0.003:
            k -= 1
        return k
    return at


def bricks(seed, course=3, length=7, bond=True):
    """Fired brick in courses: low contrast, the joint a step down, each
    brick's top lit where a few have weathered proud."""
    def at(x, y, k):
        row = y // course
        if y % course == course - 1:
            return k - 1
        off = (length // 2) * (row % 2) if bond else 0
        if (x + off) % length == 0:
            return k - 1
        if h2((x + off) // length, row, seed) > 0.86:
            return k + (1 if y % course == 0 else 0)
        return k
    return at


def fieldstone(seed):
    """Rounded fieldstones packed in mud: each stone lit on its top-left,
    shaded on its bottom-right, the mud between them dark."""
    cells = {}

    def stone(gx, gy):
        if (gx, gy) not in cells:
            cells[(gx, gy)] = (gx * 9 + h2(gx, gy, seed) * 5, gy * 6 + h2(gx, gy, seed + 1) * 3,
                               3.5 + h2(gx, gy, seed + 2) * 2, 2.4 + h2(gx, gy, seed + 3))
        return cells[(gx, gy)]

    def at(x, y, k):
        best = None
        for gx in (x // 9 - 1, x // 9, x // 9 + 1):
            for gy in (y // 6 - 1, y // 6, y // 6 + 1):
                sx, sy, rx, ry = stone(gx, gy)
                d = ((x - sx) / rx) ** 2 + ((y - sy) / ry) ** 2
                if d < 1 and (best is None or d < best[0]):
                    best = (d, (x - sx) / rx, (y - sy) / ry)
        if best is None:
            return 1
        d, u, v = best
        if d > 0.7:
            return 2 if u + v > 0 else 4
        return 4 if u + v < -0.6 else 3
    return at


def wall(c, x0, x1, top, base, pal, tex=None, foot=None, seed=0):
    """A wall face square on: lit down its left edge, rolled into shade at its
    right, damp or a footing course along its foot."""
    for x in range(x0, x1):
        damp = 3 + int(h2(x // 3, 2, seed) * 3)
        for y in range(top, base + 1):
            k = 4 if x - x0 < 1 else 2 if x1 - 1 - x < 2 else 3
            if tex:
                k = tex(x - x0, y - top, k)
            col = P(pal, k)
            if foot is None and base - y < damp:
                col = P(pal, k - 1)
            c.p(x, y, col)
    if foot:
        fpal, fh, ftex = foot
        for x in range(x0, x1):
            for y in range(base - fh + 1, base + 1):
                k = 4 if y == base - fh + 1 else 2 if x1 - 1 - x < 2 else 3
                if ftex:
                    k = ftex(x - x0, y - base + fh, k)
                c.p(x, y, P(fpal, k))


def deck(c, x0, x1, eave, depth, pal, seed=0, edge=None, ledge=6, speck=0.93):
    """A flat roof: a thick plastered ledge along the front, lit along its top
    and throwing a band of shade down the wall; behind it the deck, sunk
    inside parapets whose tops catch the light. The back parapet shows its
    inner face; it and the left parapet shade the deck. `eave` is the row
    where the ledge's face begins; returns the roof's top row."""
    edge = edge or pal
    top = eave - depth
    for x in range(x0, x1):
        for i, f in enumerate((0.6, 0.74, 0.88)):
            q = c.g(x, eave + ledge + i)
            if q[3]:
                c.p(x, eave + ledge + i, tuple(round(q[j] * f) for j in range(3)) + (255,))
    face = [5, 4, 4, 4, 3, 1][-ledge:] if ledge <= 6 else [5] + [4] * (ledge - 3) + [3, 1]
    for x in range(x0 - 1, x1 + 1):
        for i, k in enumerate(face):
            kk = k - (1 if x >= x1 - 1 and 0 < i < ledge - 1 else 0)
            if i and i < ledge - 2 and h2(x // 3, eave + i, seed + 6) > 0.94:
                kk -= 1
            c.p(x, eave + i, P(edge, kk))
    for x in range(x0 - 1, x1 + 1):
        for y in range(top, eave):
            lx, rx = x - (x0 - 1), x1 - x
            if y >= eave - 3:
                k = 5 if y >= eave - 2 else 4
            elif lx < 4:
                k = 5 if lx else 4
            elif rx < 4:
                k = 4 if rx > 1 else 3
            elif y < top + 3:
                k = 5 if y > top else 4
            elif y < top + 6:
                k = 3
                c.p(x, y, P(edge, k))
                continue
            else:
                k = 3
                if y < top + 8 or lx < 7 or y == eave - 4:
                    k = 2 if not (lx < 5) else 1
                elif h2(x, y, seed + 3) > speck:
                    k = 4
                elif h2(x, y, seed + 4) < 1 - speck - 0.02:
                    k = 2
                c.p(x, y, P(pal, k))
                continue
            c.p(x, y, P(edge, k))
    for x in (x0 - 1, x1):
        c.rect(x, top, 1, 1, (0, 0, 0, 0))
    return top


def bare(c, x, y, w, h, pal, seed=0):
    """Plaster fallen away: brick courses inside a ragged hole, its top-left
    lip in shade, the plaster's broken edge lit below and right."""
    cx, cy = x + w / 2, y + h / 2
    inside = set()
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            r = ((xx - cx) / (w / 2)) ** 2 + ((yy - cy) / (h / 2)) ** 2
            if r < 0.75 + 0.35 * h2(xx // 2, yy // 2, seed):
                inside.add((xx, yy))
    br = bricks(seed, 3, 6)
    for (xx, yy) in inside:
        k = br(xx, yy, 2)
        if (xx - 1, yy) not in inside or (xx, yy - 1) not in inside:
            k = 1
        c.p(xx, yy, P(pal, k))
    for (xx, yy) in inside:
        for nx, ny in ((xx + 1, yy), (xx, yy + 1)):
            if (nx, ny) not in inside and c.g(nx, ny)[3]:
                c.p(nx, ny, P(pal, 4))


def beams(c, x0, x1, y, wallpal, step=11, seed=0):
    """Palm-log roof beams run through the wall: their ends in a row under
    the parapet, each weeping a dark streak down the plaster."""
    wood = PAL['wood']
    for x in range(x0 + 6, x1 - 6, step):
        run = 3 + int(h2(x, 4, seed) * 6)
        for k in range(run):
            c.p(x + 1, y + 3 + k, P(wallpal, 2))
        for dx, dy, kk in ((0, 0, 2), (1, 0, 3), (2, 0, 2), (0, 1, 3), (1, 1, 5), (2, 1, 1),
                           (0, 2, 1), (1, 2, 1), (2, 2, 0)):
            c.p(x + dx, y + dy, wood[kk])


def spout(c, x, y, wallpal):
    """A clay or palm-trunk spout out of the parapet, and the stain under it."""
    for k in range(10):
        c.p(x + 1, y + 3 + k, P(wallpal, 2 if k < 7 else 3))
    c.rect(x, y, 4, 2, PAL['clay'][3]); c.rect(x, y, 4, 1, PAL['clay'][5]); c.p(x + 3, y + 1, PAL['clay'][1])


# ------------------------------------------------------------------ openings

def door(c, cx, base, w, h, wallpal, kind='plank', paint=None, lintel='log'):
    """A street door in a thick wall: the reveal shaded left and lit right,
    the leaf of planks behind it, a lintel over it, a sill before it.
    `kind` 'mat' hangs a reed mat rolled up over the dark doorway instead."""
    x = cx - w // 2
    wood = PAL['wood']
    c.rect(x - 4, base - h - 4, w + 8, h + 5, P(wallpal, 0))
    for i, k in enumerate((1, 1, 0)):
        c.rect(x - 3 + i, base - h - 3 + i, 1, h + 4 - i, P(wallpal, k))
    for i, k in enumerate((3, 4, 4)):
        c.rect(x + w + 2 - i, base - h - 3 + i, 1, h + 4 - i, P(wallpal, k))
    c.rect(x - 2, base - h - 3, w + 4, 3, P(wallpal, 0))
    if kind == 'mat':
        c.rect(x, base - h, w, h + 1, DARK)
        c.rect(x, base - h, 3, h + 1, DOORWAY)
        reed = PAL['straw-old']
        for xx in range(x - 1, x + w + 1):
            for k, kk in enumerate((4, 5, 3, 2, 1)):
                c.p(xx, base - h + k, reed[kk if (xx - x) % 4 else max(1, kk - 1)])
        for xx in (x + 3, x + w - 4):
            for k in range(7):
                c.p(xx, base - h + k, reed[1] if k > 4 else PAL['wood'][1])
        for xx in range(x, x + w):
            for yy in range(base - h + 5, base - h + 9):
                c.p(xx, yy, reed[3 if (xx - x) % 3 else 2] if yy < base - h + 8 else reed[1])
    else:
        leaf = paint or wood
        for xx in range(x, x + w):
            seam = (xx - x) % 5 == 4
            for yy in range(base - h, base + 1):
                k = 0 if seam else 3 if (xx - x) % 5 == 0 else 2
                if h2(xx, yy // 3, 31) > 0.9 and not seam:
                    k += 1
                if yy < base - h + 4 or xx < x + 2:
                    k -= 1
                c.p(xx, yy, leaf[max(0, k)])
        for by in (base - h + 8, base - 9):
            c.rect(x + 2, by, w - 2, 3, leaf[3]); c.rect(x + 2, by, w - 2, 1, leaf[4]); c.rect(x + 2, by + 3, w - 2, 1, leaf[0])
            c.rect(x, by, 2, 3, leaf[2])
        c.rect(x + w - 5, base - h // 2 - 1, 3, 3, PAL['field'][1]); c.p(x + w - 5, base - h // 2 - 1, PAL['field'][4])
    if lintel == 'log':
        lw = PAL['wood']
        c.rect(x - 6, base - h - 5, w + 12, 3, lw[3])
        c.rect(x - 6, base - h - 5, w + 12, 1, lw[5])
        c.rect(x - 6, base - h - 3, w + 12, 1, lw[1])
        for ex in (x - 7, x + w + 5):
            c.rect(ex, base - h - 5, 2, 3, lw[2]); c.p(ex, base - h - 5, lw[4])
        for xx in range(x - 5, x + w + 6):
            c.p(xx, base - h - 2, P(wallpal, 1))
    elif lintel == 'painted':
        red = PAL['paint-red']
        c.rect(x - 4, base - h - 6, w + 8, 5, red[2]); c.rect(x - 4, base - h - 6, w + 8, 1, red[4])
        c.rect(x - 4, base - h - 2, w + 8, 1, red[1])
        c.rect(x - 4, base - h - 1, 3, h + 2, red[3]); c.rect(x - 4, base - h - 1, 1, h + 2, red[4])
        c.rect(x + w + 1, base - h - 1, 3, h + 2, red[2]); c.rect(x + w + 3, base - h - 1, 1, h + 2, red[1])
    elif lintel == 'stone':
        st = PAL['field']
        c.rect(x - 5, base - h - 6, w + 10, 5, st[3]); c.rect(x - 5, base - h - 6, w + 10, 1, st[5])
        c.rect(x - 5, base - h - 2, w + 10, 1, st[1]); c.rect(x - 5, base - h - 6, 1, 5, st[4])
    st = PAL['field']
    c.rect(x - 5, base, w + 10, 3, st[3]); c.rect(x - 5, base, w + 10, 1, st[5]); c.rect(x - 5, base + 1, 1, 2, st[4])
    c.rect(x + w + 4, base + 1, 1, 2, st[1]); c.rect(x - 5, base + 3, w + 10, 1, st[0])
    return dict(door_x=cx, door_h=h, door_width=w, door_base=base, leaf=kind != 'mat')


def window(c, x, y, w, h, wallpal, kind='grille'):
    """A small high window, deep in the wall: its top and left reveal in
    shade, a grille of stone or wood bars lit down their left sides."""
    c.rect(x - 1, y - 1, w + 2, h + 2, P(wallpal, 1))
    c.rect(x, y, w, h, DARK)
    c.rect(x + w, y, 1, h + 1, P(wallpal, 4)); c.rect(x - 1, y + h, w + 2, 1, P(wallpal, 4))
    if kind == 'grille':
        st = PAL['lime'] if wallpal is PAL['lime'] else PAL['field']
        for bx in range(x + 1, x + w - 1, 3):
            c.rect(bx, y, 2, h, st[3]); c.rect(bx, y, 1, h, st[5])
    elif kind == 'lattice':
        t = PAL['clay']
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if (xx - x + yy - y) % 4 == 0 or (xx - x - (yy - y)) % 4 == 0:
                    c.p(xx, yy, t[4 if (xx - x + yy - y) % 4 == 0 else 2])
    elif kind == 'screen':
        wood = PAL['wood']
        for bx in range(x, x + w, 2):
            c.rect(bx, y, 1, h, wood[3])
        c.rect(x, y + h // 2, w, 1, wood[4])
    c.rect(x - 2, y + h + 1, w + 4, 1, P(wallpal, 5))


# ------------------------------------------------------------------ things

def ladder(c, x, y0, y1, lean=4, wood=None):
    """Two poles and lashed rungs, the left pole lit."""
    wood = wood or PAL['wood']
    n = y1 - y0
    for k in range(n + 1):
        y = y1 - k
        dx = round(lean * k / max(1, n))
        c.p(x + dx, y, wood[4]); c.p(x + dx + 1, y, wood[2])
        c.p(x + dx + 8, y, wood[3]); c.p(x + dx + 9, y, wood[1])
        if k % 5 == 3:
            for i in range(2, 8):
                c.p(x + dx + i, y, wood[3] if i < 5 else wood[2])
            c.p(x + dx + 2, y + 1, wood[1])


def hatch(c, cx, y, ladder_up=True):
    """A smoke hole and entrance in the roof: a raised mud rim round a dark
    square, the ladder's poles standing up out of it."""
    mud = PAL['catal']
    c.rect(cx - 6, y - 3, 12, 6, mud[4]); c.rect(cx - 6, y - 3, 12, 1, mud[5])
    c.rect(cx - 4, y - 2, 8, 4, DARK); c.rect(cx - 4, y - 2, 8, 1, DOORWAY)
    c.rect(cx + 6, y - 3, 1, 6, mud[2])
    if ladder_up:
        wood = PAL['wood']
        for k in range(14):
            c.p(cx - 3 + (k // 7), y - k, wood[4]); c.p(cx + 2 + (k // 7), y - k, wood[2])
        for k in (4, 9):
            c.rect(cx - 2 + (k // 7), y - k, 4, 1, wood[3])


def arish(c, x0, x1, deck_y, rise=11, md=6, reed=None, posts=None):
    """A reed-mat shade on poles: the mat seen from above, its reeds running
    back, its shadow laid on the deck under it, the front poles holding it."""
    reed = reed or PAL['straw-old']
    posts = posts or PAL['wood']
    for x in range(x0 + 2, x1 + 2):
        for y in range(deck_y - md + 1, deck_y + 1):
            q = c.g(x, y)
            if q[3]:
                c.p(x, y, tuple(round(q[i] * 0.78) for i in range(3)) + (255,))
    for px in (x0 + 1, x1 - 2):
        for y in range(deck_y - rise, deck_y + 1):
            c.p(px, y, posts[3]); c.p(px + 1, y, posts[1])
    top = deck_y - rise - md
    for x in range(x0, x1):
        for y in range(top, top + md):
            k = 4 if (x - x0) % 3 else 3
            if y == top + md - 1:
                k = 5
            elif y == top:
                k = 3
            if h2(x, 3, 41) > 0.9:
                k -= 1
            c.p(x, y, reed[k])
    for x in range(x0, x1):
        c.p(x, top + md, reed[1])


def jar(c, cx, by, R=3, H=8, pal=None):
    pal = pal or PAL['clay']

    def r(z):
        t = z / H
        return R * (0.55 + 0.6 * math.sin(math.pi * min(1, t * 0.95 + 0.05))) if t < 0.86 else R * 0.55
    turn(c, cx, by, H, r, pal)
    c.rect(round(cx - R * 0.5), round(by - H - 1), max(2, round(R)), 1, pal[0])


def oven(c, cx, by, pal=None):
    """A tannur: a clay beehive oven, its mouth dark at the front."""
    pal = pal or PAL['clay']
    turn(c, cx, by, 10, lambda z: 7 * math.sqrt(max(0.0, 1 - (z / 10) ** 2)) + 0.6, pal)
    c.rect(cx - 2, by - 5, 4, 4, DARK); c.rect(cx - 2, by - 5, 4, 1, pal[1])
    c.rect(cx - 2, by - 11, 4, 1, pal[1])


def granary(c, cx, by, R=10, H=26, pal=None):
    """An Egyptian granary: a whitewashed beehive filled through a hatch at
    its top and emptied through one at its foot."""
    pal = pal or PAL['lime']
    turn(c, cx, by, H, lambda z: R * math.sqrt(max(0.0, 1 - (z / H) ** 1.8)) + 0.8, pal)
    c.rect(cx - 2, by - H - 2, 5, 3, pal[2]); c.rect(cx - 1, by - H - 2, 3, 1, DARK)
    c.rect(cx - 3, by - 9, 6, 6, P(pal, 1)); c.rect(cx - 2, by - 8, 4, 5, DARK)
    c.rect(cx - 3, by - 3, 6, 1, pal[4])


def dung(c, x, y, cols, rows):
    """Fuel cakes of dung and straw pressed on a wall to dry."""
    d = PAL['dung']
    for j in range(rows):
        for i in range(cols):
            cx, cy = x + i * 6 + (3 if j % 2 else 0), y + j * 5
            for dx, dy, k in ((1, 0, 3), (2, 0, 3), (3, 0, 2), (0, 1, 3), (1, 1, 4), (2, 1, 3), (3, 1, 2),
                              (4, 1, 1), (0, 2, 2), (1, 2, 3), (2, 2, 2), (3, 2, 2), (4, 2, 1), (1, 3, 1),
                              (2, 3, 1), (3, 3, 1)):
                c.p(cx + dx, cy + dy, d[k])


def mastaba(c, x, w, base, pal, h=6):
    """A mud bench built against the wall beside the door."""
    c.rect(x, base - h - 3, w, 4, P(pal, 4)); c.rect(x, base - h - 3, w, 1, P(pal, 5))
    c.rect(x, base - h + 1, w, h, P(pal, 2)); c.rect(x + w - 1, base - h - 3, 1, h + 4, P(pal, 1))
    c.rect(x, base - h + 1, w, 1, P(pal, 1))


def mat(c, x, y, w, d, pal=None, grain=None):
    """A mat laid on the roof, grain or dates spread on it to dry."""
    pal = pal or PAL['straw-old']
    for xx in range(x, x + w):
        for yy in range(y, y + d):
            k = 4 if (xx - x) % 2 else 3
            c.p(xx, yy, pal[k])
    if grain:
        for xx in range(x + 1, x + w - 1):
            for yy in range(y + 1, y + d - 1):
                if h2(xx, yy, 77) > 0.45:
                    c.p(xx, yy, grain[4 if h2(xx, yy, 78) > 0.5 else 3])
    c.rect(x, y + d, w, 1, pal[1])


def date_palm(c, cx, by, H=52):
    """A date palm: the trunk ringed with old leaf bases, a crown of arched
    fronds, the left ones lit, dates hanging orange under them."""
    t = PAL['palm']
    for k in range(H):
        y = by - k
        x = cx + round(math.sin(k / H * 1.4) * 3)
        ring = (k // 2) % 2
        c.p(x - 1, y, t[4 if ring else 3]); c.p(x, y, t[3 if ring else 2]); c.p(x + 1, y, t[1])
    top = (cx + round(math.sin(1.4) * 3), by - H)
    f = PAL['frond']
    for a in (-160, -132, -105, -80, -52, -25, 0, 25, -95):
        ang = math.radians(a)
        L = 20 if a in (-95,) else 24
        for s in range(L):
            u = s / L
            x = top[0] + math.cos(ang) * s
            y = top[1] + math.sin(ang) * s * 0.7 + u * u * 16
            lit = math.cos(ang) < 0.3
            c.p(x, y, f[4 if lit else 2]); c.p(x, y + 1, f[2 if lit else 1])
            if s > 4 and s % 2 == 0:
                c.p(x - 1, y + 2, f[3 if lit else 1]); c.p(x + 1, y + 2, f[3 if lit else 1])
    d = PAL['date']
    for dx in (-4, 3):
        for k in range(5):
            for i in range(3 - k // 2):
                c.p(top[0] + dx + i, top[1] + 3 + k, d[4 if i == 0 else 2])


def roller(c, x, y):
    """The stone roller kept on a roof to pack the mud after rain."""
    st = PAL['field']
    c.rect(x, y, 12, 5, st[3]); c.rect(x, y, 12, 1, st[5]); c.rect(x, y + 4, 12, 1, st[1])
    c.rect(x - 1, y, 2, 5, st[4]); c.rect(x + 11, y, 2, 5, st[2])


# ------------------------------------------------------------------ houses

LOOKS = {
    'catal': dict(wall='catal', roof='catal'),
    'mesopotamia': dict(wall='tan', roof='tan'),
    'egypt': dict(wall='lime', roof='nile-mud'),
    'indus': dict(wall='brick', roof='tan'),
    'levant': dict(wall='levant', roof='levant'),
    'plain-levant': dict(wall='levant', roof='levant'),
    'plain-catal': dict(wall='catal', roof='catal'),
    'plain-mesopotamia': dict(wall='tan', roof='tan'),
    'plain-egypt': dict(wall='lime', roof='nile-mud'),
}
REGIONS = ('catal', 'mesopotamia', 'egypt', 'indus', 'levant')
HW, HW2 = 50, 92
DOOR = (20, 38)


def block(c, x0, x1, base, hw, depth, look, seed, beams_=True):
    """One flat-roofed room or range of rooms; returns its deck's rows."""
    L = LOOKS[look]
    wp, rp = PAL[L['wall']], PAL[L['roof']]
    top = base - hw
    if look == 'indus':
        wall(c, x0, x1, top, base, wp, bricks(seed), seed=seed)
    elif look == 'levant':
        wall(c, x0, x1, top, base, wp, plaster(seed), foot=(PAL['field'], 16, fieldstone(seed)), seed=seed)
    elif look == 'mesopotamia':
        wall(c, x0, x1, top, base, wp, plaster(seed), foot=(PAL['bitumen'], 4, None), seed=seed)
    elif look == 'egypt':
        wall(c, x0, x1, top, base, wp, plaster(seed), seed=seed)
        nm = PAL['nile-mud']
        for x in range(x0, x1):
            worn = 4 + int(h2(x // 4, 5, seed) * 5) + (3 if h2(x // 9, 6, seed) > 0.7 else 0)
            for y in range(base - worn, base + 1):
                c.p(x, y, P(nm, 3 if y > base - worn else 4))
    else:
        wall(c, x0, x1, top, base, wp, plaster(seed), seed=seed)
    deck_top = deck(c, x0, x1, top, depth, rp, seed, rp if look == 'indus' else wp)
    if beams_ and look in ('mesopotamia', 'levant', 'egypt'):
        beams(c, x0, x1, top + 8, wp, 12 if look != 'egypt' else 14, seed)
    return deck_top, top


def sprinkle_bare(c, x0, x1, top, base, look, seed, n=1):
    if look in ('indus',):
        return
    pal = PAL[LOOKS[look]['wall']] if look != 'egypt' else PAL['nile-mud']
    for i in range(n):
        x = x0 + 6 + int(h2(i, 1, seed) * max(1, x1 - x0 - 26))
        y = top + 12 + int(h2(i, 2, seed) * max(1, base - top - 34))
        bare(c, x, y, 12 + int(h2(i, 3, seed) * 6), 7, pal, seed + i)


def house(s):
    look, size, seed = s['look'], s['size'], s['seed']
    W = s['W']
    L = LOOKS[look]
    wp = PAL[L['wall']]
    mx = 12
    tall = size == 'large' and look in ('mesopotamia', 'indus')
    hw = HW2 if tall else HW
    depth = {'small': 26, 'medium': 28, 'large': 40 if tall else 30}[size]
    head = 40
    c = C(W + 2 * mx, hw + depth + head + 6)
    x0, x1, base = mx, mx + W, c.h - 4
    info = dict(x0=x0, W=W, base=base)
    side = 1 if seed % 2 else -1
    if look == 'catal':
        return catal(c, s, info)

    annex = 0
    if size == 'medium' and look in ('mesopotamia', 'egypt', 'indus'):
        annex = 34
    ax0, ax1 = (x0, x0 + annex) if side > 0 else (x1 - annex, x1)
    mx0, mx1 = (x0 + annex, x1) if side > 0 else (x0, x1 - annex)

    if look == 'levant' and size != 'small':
        bay = 44 if size == 'medium' else 52
        bx0, bx1 = (x0, x0 + bay) if side > 0 else (x1 - bay, x1)
        deck_top, eave = block(c, x0, x1, base, hw, depth, look, seed)
        pillared_bay(c, bx0, bx1, base, hw, seed)
        mx0, mx1 = (bx1, x1) if side > 0 else (x0, bx0)
    else:
        deck_top, eave = block(c, mx0, mx1, base, hw, depth, look, seed)
        if annex:
            ahw = 32
            block(c, ax0, ax1, base, ahw, 20, look, seed + 5, beams_=False)
            if look == 'mesopotamia':
                dung(c, ax0 + 6, base - ahw + 10, 3, 2)
    sprinkle_bare(c, mx0, mx1, base - hw, base, look, seed, 1 if size == 'small' else 2)

    # Door: off-centre, toward the side away from the annex.
    span = mx1 - mx0
    dcx = mx0 + round(span * (0.32 if side > 0 else 0.68)) if size != 'small' else \
        x0 + round(W * (0.3 if side > 0 else 0.7))
    if look == 'levant' and size != 'small':
        dcx = mx0 + span // 2
    dkind = 'mat' if look == 'mesopotamia' and seed % 3 == 0 else 'plank'
    lintel = {'egypt': 'painted', 'levant': 'stone', 'indus': 'log'}.get(look, 'log')
    paint = PAL['blue'] if look == 'egypt' and seed % 3 == 1 else None
    info.update(door(c, dcx, base - 2, DOOR[0], DOOR[1], wp, dkind, paint, lintel))
    if tall and look == 'mesopotamia':
        beams(c, mx0, mx1, base - hw // 2 - 2, wp, 12, seed + 3)
        a0 = dcx + 14 if side > 0 else dcx - 46
        mastaba(c, a0 + 2, 28, base, wp)
        arish(c, a0, a0 + 32, base - 2, 30, 6)

    # Windows: none on an Indus street front; high and small elsewhere.
    wy = base - hw + 12
    wins = []
    if look == 'egypt':
        wins = [dcx + side * 30, dcx - side * 28 if size != 'small' else None]
    elif look == 'mesopotamia' and size != 'small':
        wins = [dcx + side * 34]
    elif look == 'levant':
        wins = [mx0 + span - 22 if side > 0 else mx0 + 10]
    for wx in wins:
        if wx and mx0 + 6 < wx < mx1 - 18:
            window(c, wx, wy if not tall else base - hw + 14, 12, 12, wp, 'grille')
    if tall:
        for wx in (mx0 + 16, mx1 - 30, (mx0 + mx1) // 2 - 6):
            if abs(wx + 6 - dcx) > 16:
                window(c, wx, base - hw + 14, 12, 12, wp, 'screen' if look == 'indus' else 'grille')

    if look == 'indus':
        chute_x = mx1 - 16 if side > 0 else mx0 + 10
        chute(c, chute_x, base - hw + 8, base)
        drain(c, x0 - 2, x1 + 2, base)
    if look == 'mesopotamia':
        spout(c, mx1 - 14 if side > 0 else mx0 + 10, eave + 1, wp)
        if size != 'large':
            mastaba(c, dcx + side * 14 - (0 if side > 0 else 18), 18, base, wp)
    if look == 'egypt' and size == 'small':
        mastaba(c, dcx + side * 14 - (0 if side > 0 else 16), 16, base, PAL['nile-mud'])

    roof_life(c, s, mx0, mx1, deck_top, eave, look, size, info)

    # Things standing beside the house, in the margin.
    if look == 'mesopotamia':
        oven(c, x0 - 2 if side < 0 else x1 + 2, base + 1)
    if look == 'egypt' and size != 'small':
        gx = x1 - 4 if side > 0 else x0 + 4
        granary(c, gx, base + 1, 10, 26)
    if look == 'egypt' and size == 'large':
        date_palm(c, x0 + 2 if side > 0 else x1 - 2, base + 1, 64)
    if look == 'levant' and size == 'large':
        jar(c, x1 + 4 if side > 0 else x0 - 4, base + 1, 5, 14)
    return c, info


def pillared_bay(c, x0, x1, base, hw, seed):
    """The stable of a four-room house, open to the front between stone
    pillars, its floor in shade, a manger along the back."""
    st = PAL['field']
    top = base - hw + 8
    lv = PAL['levant']
    for y in range(top, base + 1):
        for x in range(x0 + 2, x1 - 2):
            k = 0 if y < top + 4 else 1 if y < base - 4 else 2
            c.p(x, y, lv[k] if x > x0 + 12 or k == 0 else PAL['field'][0])
    c.rect(x0 + 6, base - 9, x1 - x0 - 12, 4, st[2]); c.rect(x0 + 6, base - 9, x1 - x0 - 12, 1, st[3])
    n = 3 if x1 - x0 > 48 else 2
    for i in range(n):
        px = x0 + 2 + round(i * (x1 - x0 - 10) / (n - 1))
        for y in range(top, base + 1):
            band = (y - top) // 7 % 2
            c.p(px, y, st[4]); c.p(px + 1, y, st[3 if band else 4]); c.p(px + 2, y, st[3])
            c.p(px + 3, y, st[3 if band else 2]); c.p(px + 4, y, st[1])
        c.rect(px - 1, top - 2, 7, 2, st[5]); c.rect(px - 1, top, 7, 1, st[2])
    beam = PAL['wood']
    c.rect(x0, top - 4, x1 - x0, 3, beam[3]); c.rect(x0, top - 4, x1 - x0, 1, beam[4]); c.rect(x0, top - 2, x1 - x0, 1, beam[1])


def chute(c, x, top, base):
    """A brick chute from an upper bathroom down the wall to the drain."""
    b = PAL['brick']
    for y in range(top, base - 2):
        k = 4 if (y - top) % 3 else 2
        c.p(x, y, b[k]); c.p(x + 1, y, b[3]); c.p(x + 2, y, b[3]); c.p(x + 3, y, b[1])
        c.p(x + 4, y, P(PAL['brick'], 1))
    c.rect(x, top - 1, 4, 1, b[5])


def drain(c, x0, x1, base):
    """The covered brick street drain the house stands over, its cover
    slabs lifted at a soak jar."""
    b = PAL['brick']
    y = base + 1
    for x in range(x0, x1):
        c.p(x, y, b[4] if (x - x0) % 7 else b[2]); c.p(x, y + 1, b[3] if (x - x0) % 7 else b[1])
        c.p(x, y + 2, b[1])
    gap = (x0 + x1) // 2 + 18
    c.rect(gap, y, 8, 2, PAL['blue'][1]); c.rect(gap, y, 8, 1, PAL['blue'][2])


def roof_life(c, s, x0, x1, deck_top, eave, look, size, info):
    """What lives on a flat roof: a room or shade, things drying, jars,
    the stair's head, the smoke. Placed by the seed, never all at once."""
    seed = s['seed']
    side = 1 if seed % 2 else -1
    W = x1 - x0
    rp = PAL[LOOKS[look]['roof']]
    mid = (deck_top + eave) // 2
    smoke = []
    if size == 'large' and look in ('mesopotamia', 'indus'):
        court(c, x0 + W // 2 - 26, x0 + W // 2 + 26, deck_top + 5, eave - 8, look, seed)
        a0 = x0 + 6 if side > 0 else x1 - 34
        arish(c, a0, a0 + 26, eave - 7, 10, 5)
        jar(c, x1 - 12 if side > 0 else x0 + 12, eave - 6, 3, 7)
        info['smoke'] = [[x1 - 22 if side > 0 else x0 + 22, deck_top - 2, 'vent']]
        return
    if size != 'small' and look in ('mesopotamia', 'egypt', 'indus', 'levant'):
        rw = 40 if size == 'medium' else 48
        r0 = x1 - rw - 6 if side > 0 else x0 + 6
        roof_room(c, r0, r0 + rw, eave - 8, look, seed)
        free0, free1 = (x0 + 6, r0 - 4) if side > 0 else (r0 + rw + 4, x1 - 6)
    else:
        free0, free1 = x0 + 6, x1 - 6
    span = free1 - free0
    if look == 'mesopotamia' or (look == 'egypt' and size == 'small'):
        aw = min(30, span - 6)
        a0 = free0 if side > 0 else free1 - aw
        arish(c, a0, a0 + aw, eave - 6, 10, 5)
        rest0, rest1 = (a0 + aw + 3, free1) if side > 0 else (free0, a0 - 3)
    else:
        rest0, rest1 = free0, free1
    if rest1 - rest0 > 20:
        crop = PAL['date'] if look == 'egypt' else PAL['straw']
        mat(c, rest0 + 2, mid - 2, min(18, rest1 - rest0 - 8), 5, grain=crop if seed % 2 == 0 else None)
        jar(c, rest1 - 4, eave - 6, 3, 7)
    elif rest1 - rest0 > 8:
        jar(c, (rest0 + rest1) // 2, eave - 6, 3, 7)
    if look == 'levant':
        roller(c, x1 - 26 if side < 0 else x0 + 8, deck_top + 4)
    hx = x1 - 12 if side > 0 else x0 + 12
    if size == 'small':
        ladder(c, hx - 4, deck_top - 8, eave - 6, 0)
        smoke.append([hx - 12 * side, deck_top - 1, 'vent'])
    info['smoke'] = smoke or [[hx, deck_top - 2, 'vent']]


def roof_room(c, x0, x1, base, look, seed):
    """A room on the roof, set back from the parapet: in Egypt an open
    loggia on painted posts, elsewhere a closed room with its own door."""
    rp = PAL[LOOKS[look]['wall']]
    hw = 30
    if look == 'egypt':
        top = base - hw
        c.rect(x0, top + 6, x1 - x0, hw - 6, rp[1])
        c.rect(x0, top + 6, x1 - x0, 4, rp[0])
        c.rect(x0, base - 4, x1 - x0, 5, PAL['nile-mud'][2])
        dx = x0 + (x1 - x0) // 4
        c.rect(dx, base - 20, 10, 16, DARK)
        red, blue = PAL['paint-red'], PAL['blue']
        for px in (x0, x0 + (x1 - x0) // 2 - 2, x1 - 4):
            for y in range(top + 6, base + 1):
                c.p(px, y, rp[5]); c.p(px + 1, y, rp[4]); c.p(px + 2, y, rp[3]); c.p(px + 3, y, rp[2])
            c.rect(px - 1, top + 6, 6, 3, red[3]); c.rect(px - 1, top + 6, 6, 1, red[4])
        c.rect(x0 - 2, top + 2, x1 - x0 + 4, 4, PAL['nile-mud'][3])
        deck(c, x0 - 2, x1 + 2, top + 3, 16, PAL['straw-old'], seed + 9)
        return
    if look == 'indus':
        top = base - hw
        wood = PAL['wood']
        c.rect(x0, top, x1 - x0, hw + 1, wood[2])
        for x in range(x0, x1):
            for y in range(top, base + 1):
                if (x - x0) % 12 in (0, 1):
                    c.p(x, y, wood[1 if (x - x0) % 12 else 3])
                elif top + 6 <= y <= base - 6:
                    c.p(x, y, PAL['reed'][3 if (x - x0) % 2 else 4])
        c.rect(x0, top + 5, x1 - x0, 1, wood[1]); c.rect(x0, base - 5, x1 - x0, 1, wood[4])
        deck(c, x0 - 2, x1 + 2, top + 2, 16, PAL['tan'], seed + 9)
        return
    block(c, x0, x1, base, hw, 16, 'plain-' + look, seed + 9, beams_=False)
    dx = x0 + 6 if seed % 2 else x1 - 20
    c.rect(dx - 1, base - 22, 14, 23, P(rp, 1))
    c.rect(dx, base - 21, 12, 22, DARK); c.rect(dx, base - 21, 2, 22, DOORWAY)
    c.rect(dx + 12, base - 21, 1, 22, P(rp, 4))


def court(c, x0, x1, y0, y1, look, seed):
    """The open court of a two-storey house seen from above, sunk in the
    roof: the far range's face lit, a timber gallery along it at the upper
    floor, the court's floor in shade under the near range."""
    wp = PAL[LOOKS[look]['wall']]
    wood = PAL['wood']
    tex = bricks(seed) if look == 'indus' else plaster(seed)
    face = y1 - y0 - 4
    for x in range(x0, x1):
        for y in range(y0, y1):
            if y < y0 + face:
                col = P(wp, tex(x - x0, y - y0, 4 if look != 'indus' else 3))
            else:
                col = P(PAL['field'], 2 if (x - x0) % 6 else 1)
            if x < x0 + 4 or y < y0 + 2:
                col = tuple(round(v * 0.7) for v in col[:3]) + (255,)
            c.p(x, y, col)
    g = y0 + face // 2
    for x in range(x0 + 7, x1 - 8, 13):
        c.rect(x, y0 + 2, 5, g - y0 - 3, P(wp, 1))
        c.rect(x, y0 + 2, 5, 1, DARK)
    c.rect(x0, g, x1 - x0, 2, wood[4]); c.rect(x0, g + 2, x1 - x0, 1, wood[1])
    for x in range(x0 + 3, x1 - 1, 6):
        c.rect(x, g + 3, 1, face - face // 2 - 3, wood[2])
    if look == 'indus':
        cx = (x0 + x1) // 2 + 8
        b = PAL['brick']
        c.rect(cx - 5, y1 - 4, 10, 4, b[4]); c.rect(cx - 5, y1 - 4, 10, 1, b[5]); c.rect(cx - 3, y1 - 3, 6, 2, PAL['blue'][1])


def catal(c, s, info):
    """A Çatalhöyük house among its neighbours: cells of different heights
    built wall to wall, entered from the roof. The ladder leaning on the
    front wall is the way up, and stands where a door would."""
    seed, size, W = s['seed'], s['size'], s['W']
    x0, base = info['x0'], info['base']
    n = {'small': 2, 'medium': 3, 'large': 4}[size]
    cuts = sorted(round(W * (i + h2(i, 1, seed) * 0.5 - 0.25) / n) for i in range(1, n))
    edges = [0] + cuts + [W]
    hws = [40 + int(h2(i, 2, seed) * 14) for i in range(n)]
    order = sorted(range(n), key=lambda i: -hws[i])
    decks = {}
    for i in order:
        a, b = x0 + edges[i], x0 + edges[i + 1]
        back = 0 if i == 0 else int(h2(i, 3, seed) * 3) * 3
        decks[i] = block(c, a, b, base - back, hws[i], 22 + back, 'catal', seed + i, beams_=False) + (a, b, back)
        sprinkle_bare(c, a, b, base - back - hws[i], base - back, 'catal', seed + i, 1)
        for vx in ((a + b) // 2 - 3,):
            if h2(i, 4, seed) > 0.4:
                window(c, vx, base - back - hws[i] + 9, 6, 5, PAL['catal'], 'none')
    main = max(range(n), key=lambda i: (decks[i][3] - decks[i][2]) + h2(i, 6, seed) * 20)
    deck_top, eave, a, b, back = decks[main]
    hx = (a + b) // 2 + (6 if seed % 2 else -6)
    hatch(c, hx, (deck_top + eave) // 2 + 1)
    smoke = [[hx, deck_top - 8, 'vent']]
    for i, (dt, ev, aa, bb, bk) in decks.items():
        if i == main:
            continue
        w = bb - aa
        if w > 30 and h2(i, 8, seed) > 0.55:
            arish(c, aa + 4, bb - 6, ev - 6, 9, 5)
        elif w > 26 and h2(i, 7, seed) > 0.4:
            mat(c, aa + 5, (dt + ev) // 2 - 2, min(16, w - 12), 4, grain=PAL['straw'])
        elif w > 14:
            jar(c, aa + w // 2, ev - 6, 3, 7, PAL['catal'])
    lx = (a + b) // 2 - 4 + (8 if seed % 3 == 0 else -8)
    lx = max(x0 + 4, min(x0 + W - 16, lx))
    ladder(c, lx, base - back - hws[main] + 2 - 10, base, -5)
    if size != 'small':
        oven(c, x0 + W + 2 if seed % 2 else x0 - 2, base + 1, PAL['catal'])
    info.update(door_x=lx + 4, door_h=24, door_width=14, door_base=base, leaf=False, smoke=smoke)
    return c, info


def built(fn):
    def make(spec=None, info=None):
        s = dict(seed=0, size='small', W=80, look='mesopotamia')
        s.update(spec or {})
        c, i = fn(s)
        finish(c)
        consolidate(c, rare=3)
        if info is not None:
            info.update(i)
        return c.im
    return make


BUILDERS = {'mudbrick': built(house)}
WIDTH = {'small': 80, 'medium': 112, 'large': 144}

STUDIES = [(f'{look}-{size}-{v}', 'mudbrick',
            dict(look=look, size=size, seed=11 * v + i * 3 + 1, W=WIDTH[size] - (16 if size == 'small' and v else 0)))
           for i, look in enumerate(REGIONS)
           for size, v in (('small', 0), ('small', 1), ('medium', 0), ('large', 0))]


# The game's frames: the old shared ones become Mesopotamia's; each other
# region gets its own, picked by place and date in geography/pack.ts.
VARIANTS = (('small', 0, 4), ('small', 1, 5), ('small', 2, 6), ('medium', 0, 7), ('medium', 1, 7), ('large', 0, 9))
DEPTH = {'small': 3, 'medium': 5, 'large': 6}
ABOUT = {
    'catal': ('House entered from the roof',
              'A mud-brick house built wall to wall with its neighbours. There is no street door: people climb '
              'a ladder to the roof and go down through the hatch, which also lets out the smoke.'),
    'egypt': ('Mud-brick house',
              'A whitewashed mud-brick house with a red-painted door frame and small barred windows set high. '
              'The family sleeps on the roof in summer and keeps its grain in a beehive granary.'),
    'indus': ('Brick house',
              'A house of fired brick with no windows onto the street. A brick chute carries waste water from '
              'the upper floor down to the covered drain in the street.'),
    'levant': ('Mud-brick house',
               'A mud-brick house on a footing of fieldstones. Animals are stabled in the bay behind the stone '
               'pillars, and a stone roller on the roof packs the mud down after rain.'),
    'mesopotamia': ('Mud-brick house',
                    'A mud-brick house with a flat roof on palm-log beams. People work and sleep on the roof in '
                    'summer, in the shade of a reed mat.'),
}


def spec(look, size, v, fw):
    return dict(look=look, size=size, W=fw * 16, seed=7 + v * 13 + len(look) * 5)


def door_cell(sp):
    """The footprint column under the painted door (or the ladder's foot)."""
    _, info = house(dict(sp))
    return max(0, min(sp['W'] // 16 - 1, (info['door_x'] - info['x0']) // 16))


def frame(src, look, size, fw, sp):
    label, about = ABOUT[look]
    r = {k: v for k, v in src.items() if k not in ('oblique', 'mud', 'windowStyle')}
    r.update(label=label, description=about, footprint=[fw, DEPTH[size]],
             entrance=[door_cell(sp), DEPTH[size]], frontAncient=('mudbrick', sp), front=True)
    return r


def game_recipes(recipes):
    """Redraw the shared frames as Mesopotamia's and add the other regions'."""
    import re
    src = recipes.get('house-mudbrick-ob-0')
    if not src:
        return
    for name, r in list(recipes.items()):
        m = re.match(r'house-mudbrick-ob-(?:(\d)|gold-(medium|large)-(\d))$', name)
        if m:
            size = m.group(2) or 'small'
            v = int(m.group(1) or m.group(3))
            fw = r['footprint'][0]
            recipes[name] = frame(r, 'mesopotamia', size, fw, spec('mesopotamia', size, v, fw))
    for look in ('catal', 'egypt', 'indus', 'levant'):
        for size, v, fw in VARIANTS:
            recipes[f'house-mudbrick-{look}-{size}-{v}'] = frame(src, look, size, fw, spec(look, size, v, fw))


def sheet(names, out):
    from PIL import Image
    from art.reference import current_adult
    rows = []
    for look in REGIONS:
        rows.append([BUILDERS[k](sp) for n, k, sp in STUDIES
                     if n.startswith(look) and (not names or n in names)])
    rows = [r for r in rows if r]
    a = current_adult()
    W = max(sum(i.width + 6 for i in r) for r in rows) + a.width + 12
    H = sum(max(i.height for i in r) + 8 for r in rows)
    bg = Image.new('RGBA', (W, H), (170, 152, 118, 255))
    y = 0
    for r in rows:
        h = max(i.height for i in r)
        x = 4
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height)); x += im.width + 6
        bg.alpha_composite(a, (x, y + h - 6 - a.height))
        y += h + 8
    bg.resize((W * 3, H * 3), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    sheet(sys.argv[2:], sys.argv[1] if len(sys.argv) > 1 else 'artifacts/mudbrick/sheet.png')
