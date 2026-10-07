"""Openings for front-on buildings: a window or door is a frame, an infill
and a head, each drawn once and combined by spec.

    .venv/bin/python scripts/art/front_openings.py artifacts/front-openings.png

Every part follows the same rules as the materials: light from the upper
left, raised parts lit top-left and dark bottom-right, openings deep enough
that their top and left sit in shadow, and anything that projects throws a
shadow on the wall below it. Sizes are set against the 37px adult.
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import (  # noqa: E402
    C, RAMPS, ramp, mix, h2, ashlar, brick, render, adobe, half_timber, boards, whitewash,
)

GLASS = ramp(248, 0.095, warm=30, cool=20, lift=-0.02)
LEAD = ramp(260, 0.02, lift=-0.25)
PAINT = {
    'white': ramp(85, 0.012, lift=0.03),
    'green': ramp(150, 0.1, lift=-0.14),
    'oak': RAMPS['oak'],
    'oxblood': ramp(25, 0.1, lift=-0.18),
    'blue': ramp(250, 0.07, lift=-0.1),
    'grey': ramp(240, 0.02, lift=-0.04),
}
IRON = ramp(265, 0.02, lift=-0.3)
PAPER = ramp(88, 0.025, lift=0.02)


def cast(c, x, y, w, n, k0=0.62):
    """Shadow thrown down onto the wall by anything projecting above it."""
    for i in range(n):
        t = k0 + (1 - k0) * i / n
        for xx in range(x, x + w):
            q = c.g(xx, y + i)
            if q[3]:
                c.p(xx, y + i, (int(q[0] * t * 0.96), int(q[1] * t * 0.95), int(min(255, q[2] * t * 1.04)), 255))


def raised(c, x, y, w, h, r, body=2):
    """A block proud of the wall: lit top and left, dark bottom and right."""
    c.rect(x, y, w, h, r[body])
    c.rect(x, y, w, 1, r[body - 1])
    c.rect(x, y, 1, h, r[body - 1])
    c.rect(x, y + h - 1, w, 1, r[body + 2])
    c.rect(x + w - 1, y + 1, 1, h - 1, r[body + 2])


def reveal(c, x, y, w, h, depth=2):
    """Darken the top and left of an opening: the wall is thick."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            if b < depth or a < depth:
                q = c.g(xx, yy)
                k = 0.58 if (b < depth and a < depth) else 0.7
                c.p(xx, yy, (int(q[0] * k), int(q[1] * k), int(min(255, q[2] * k * 1.1)), 255))


# ------------------------------------------------------------------ infills

def glass(c, x, y, w, h):
    """Glass: dark at the top where the reveal shades it, the sky's light in a
    diagonal streak, a cooler pane below."""
    g = GLASS
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            col = g[5] if b < h * 0.45 else g[4]
            d = a + b
            if b > 2 and d in (8, 9):
                col = g[3]
            if b > 3 and d == 9:
                col = g[1]
            if b > h * 0.55 and d - h // 2 in (6, 7):
                col = g[3]
            c.p(xx, yy, col)


def casement(c, x, y, w, h, paint='white'):
    """French casement: two leaves, three panes each, the meeting stile lit
    on its left."""
    j = PAINT[paint]
    glass(c, x, y, w, h)
    m = x + w // 2
    for yy in range(y, y + h):
        c.p(x, yy, j[1]); c.p(x + w - 1, yy, j[3])
        c.p(m - 1, yy, j[0]); c.p(m, yy, j[3])
    c.rect(x, y, w, 1, j[1])
    c.rect(x, y + h - 1, w, 1, j[3])
    for ty in range(y + h // 3, y + h - 2, h // 3):
        c.rect(x + 1, ty, m - x - 2, 1, j[1])
        c.rect(m + 1, ty, x + w - m - 2, 1, j[2])


def sash(c, x, y, w, h, paint='white'):
    """Sash window, six over six: the lower sash sits in front, so its top
    rail is lit and throws a line of shadow on the upper glass."""
    j = PAINT[paint]
    glass(c, x, y, w, h)
    mid = y + h // 2
    for yy in range(y, y + h):
        c.p(x, yy, j[1]); c.p(x + w - 1, yy, j[3])
        for k in (1, 2):
            bx = x + k * w // 3
            c.p(bx, yy, j[1] if yy < mid else j[0])
    for ty in (y + h // 4, y + 3 * h // 4):
        c.rect(x + 1, ty, w - 2, 1, j[1])
    c.rect(x, y, w, 1, j[2])
    c.rect(x, mid - 1, w, 1, j[3])
    c.rect(x, mid, w, 2, j[0])
    c.rect(x, mid + 2, w, 1, j[2])
    c.rect(x, y + h - 2, w, 2, j[1])
    c.rect(x, y + h - 1, w, 1, j[3])


def leaded(c, x, y, w, h, paint=None):
    """Leaded lights: diamond quarries of greenish crown glass in lead, an
    iron casement round them."""
    gq = ramp(165, 0.03, lift=-0.08)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            on = (a + b) % 5 == 0 or (a - b) % 5 == 0
            if on:
                col = LEAD[4]
            else:
                q = ((a + b) // 5 + (a - b) // 5) % 3
                col = (gq[3], gq[4], gq[2])[q] if b > 2 else gq[5]
                if (a + b) % 13 == 4 and b > 2:
                    col = gq[1]
            c.p(xx, yy, col)
    for yy in range(y, y + h):
        c.p(x, yy, IRON[2]); c.p(x + w - 1, yy, IRON[4])
    c.rect(x, y, w, 1, IRON[2])
    c.rect(x, y + h - 1, w, 1, IRON[4])
    c.rect(x + w // 2, y, 1, h, IRON[3])


def shutters(c, x, y, w, h, paint='green'):
    """Closed louvred shutters: two leaves, slats lit on top and dark under,
    a stile down each side and the meeting line dark."""
    p = PAINT[paint]
    m = x + w // 2
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            leaf_a = xx - (x if xx < m else m)
            lw = (m - x) if xx < m else (x + w - m)
            if leaf_a < 2 or leaf_a >= lw - 1 or b < 2 or b >= h - 2:
                col = p[2] if leaf_a < 1 or b < 1 else p[3]
                if leaf_a >= lw - 1:
                    col = p[5]
            else:
                ly = (b - 2) % 3
                col = (p[1], p[3], p[5])[ly]
            c.p(xx, yy, col)
    mid = y + h // 2
    c.rect(x + 1, mid, w - 2, 1, p[4])
    for hy in (y + 3, y + h - 4):
        c.p(x, hy, IRON[1]); c.p(x + w - 1, hy, IRON[1])


def lattice(c, x, y, w, h, paint=None):
    """Kōshi lattice: close vertical slats over a dark room, rails across,
    the slats lit on their left."""
    r = RAMPS['cedar']
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            col = mix(PAPER[5], r[7], 0.5) if b > 2 else r[7]
            if a % 3 == 0:
                col = r[3]
            elif a % 3 == 1:
                col = r[5]
            c.p(xx, yy, col)
    for ty in (y, y + h // 3, y + 2 * h // 3, y + h - 2):
        c.rect(x, ty, w, 1, r[2])
        c.rect(x, ty + 1, w, 1, r[5])


def mashrabiya(c, x, y, w, h, paint=None):
    """Turned-wood screen: a grid of beads and spindles, light through the
    gaps, the beads lit on their upper left."""
    r = RAMPS['cedar']
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx - x, yy - y
            ga, gb = a % 4, b % 4
            if ga == 0 or gb == 0:
                col = r[4]
                if ga == 0 and gb == 0:
                    col = r[2]
            elif ga == 2 and gb == 2:
                col = r[3]
            else:
                col = mix(PAPER[2], r[6], 0.55) if b > 2 else r[6]
            c.p(xx, yy, col)
    c.rect(x, y, w, 1, r[3])
    c.rect(x, y + h - 1, w, 1, r[5])


INFILLS = {'casement': casement, 'sash': sash, 'leaded': leaded,
           'shutters': shutters, 'lattice': lattice, 'mashrabiya': mashrabiya}


# ------------------------------------------------------------------ frames
# Each takes the clear opening (x, y, w, h) and draws around it: surround,
# sill, and the shadows they throw. The infill goes in afterwards.

def frame_stone(c, x, y, w, h, wall, r=None):
    r = r or RAMPS['limestone']
    raised(c, x - 4, y - 4, w + 8, h + 5, r, 1)
    c.rect(x - 2, y - 2, w + 4, 1, r[3])
    c.rect(x - 2, y - 2, 1, h + 2, r[3])
    # sill: its top face, its front, the shadow under it
    c.rect(x - 6, y + h + 1, w + 12, 2, r[0])
    c.rect(x - 6, y + h + 3, w + 12, 2, r[2])
    c.rect(x - 6, y + h + 5, w + 12, 1, r[4])
    cast(c, x - 5, y + h + 6, w + 10, 2)


def frame_timber(c, x, y, w, h, wall):
    """Oak frame: posts, a heavy lintel and sill whose ends run past the
    posts, as in a framed wall."""
    o = RAMPS['oak']
    raised(c, x - 3, y - 4, w + 6, h + 8, o, 3)
    c.rect(x - 2, y - 3, w + 4, h + 6, o[3])
    raised(c, x - 6, y - 6, w + 12, 4, o, 2)
    raised(c, x - 6, y + h + 1, w + 12, 4, o, 2)
    c.rect(x - 6, y + h + 1, w + 12, 1, o[1])
    cast(c, x - 5, y - 2, w + 10, 2, 0.7)
    cast(c, x - 5, y + h + 5, w + 10, 2)


def frame_brick(c, x, y, w, h, wall):
    """A brick reveal under a gauged segmental arch, on a stone sill."""
    r = RAMPS['brick']
    s = RAMPS['limestone']
    rise = 4
    cx = x + w / 2 - 0.5
    for yy in range(y - rise - 5, y + 1):
        for xx in range(x - 1, x + w + 1):
            t = (xx - cx) / (w / 2 + 1)
            top = y - rise * math.sqrt(max(0, 1 - t * t))
            if top - 5 <= yy < top:
                ang = math.atan2(yy - (y + 10), xx - cx)
                k = int((ang + math.pi) * 9) % 2
                col = r[3] if k else r[4]
                if yy == int(top - 5):
                    col = r[2]
                c.p(xx, yy, col)
            elif yy >= top:
                c.p(xx, yy, r[6])
    for xx in range(x - 1, x + w + 1):
        t = (xx - cx) / (w / 2 + 1)
        top = int(y - rise * math.sqrt(max(0, 1 - t * t)))
        c.p(xx, top - 5, RAMPS['mortar'][3])
    raised(c, x - 4, y + h + 1, w + 8, 4, s, 1)
    c.rect(x - 4, y + h + 1, w + 8, 1, s[0])
    cast(c, x - 3, y + h + 5, w + 6, 2)
    reveal(c, x - 1, y - rise, w + 2, h + rise, 1)
    self_arch(c, x, y, w, rise)


def self_arch(c, x, y, w, rise):
    """Fill the arched head of the opening with dark reveal."""
    cx = x + w / 2 - 0.5
    for yy in range(y - rise, y):
        for xx in range(x, x + w):
            t = (xx - cx) / (w / 2)
            if yy >= y - rise * math.sqrt(max(0, 1 - t * t)):
                c.p(xx, yy, GLASS[6])


def frame_adobe(c, x, y, w, h, wall):
    """A deep soft reveal in mud plaster, a round-pole lintel bedded over it."""
    a = RAMPS['adobe']
    o = RAMPS['oak']
    for yy in range(y - 2, y + h + 2):
        for xx in range(x - 2, x + w + 2):
            if (xx in (x - 2, x + w + 1)) and (yy in (y - 2, y + h + 1)):
                continue
            c.p(xx, yy, a[4] if (xx < x or yy < y) else a[3])
    for xx in range(x - 6, x + w + 6):
        for k, idx in enumerate((6, 3, 2, 3, 5)):
            c.p(xx, y - 7 + k, o[idx])
        if (xx - x) % 5 == 0:
            c.p(xx, y - 5, o[4])
    cast(c, x - 6, y - 2, w + 12, 1, 0.75)
    for xx in range(x - 3, x + w + 3):
        c.p(xx, y + h + 2, a[1])
        c.p(xx, y + h + 3, a[3])


def frame_asian(c, x, y, w, h, wall):
    """Dark cedar frame; the head rail runs out past the posts with cut ends."""
    r = RAMPS['cedar']
    raised(c, x - 3, y - 3, w + 6, h + 6, r, 4)
    raised(c, x - 7, y - 6, w + 14, 4, r, 3)
    c.rect(x - 7, y - 6, 1, 4, r[2])
    c.rect(x + w + 6, y - 6, 1, 4, r[6])
    raised(c, x - 5, y + h + 3, w + 10, 3, r, 3)
    cast(c, x - 6, y - 2, w + 12, 2, 0.72)
    cast(c, x - 4, y + h + 6, w + 8, 2)


FRAMES = {
    'stone': (frame_stone, lambda c, x, y, w, h: ashlar(c, x, y, w, h)),
    'timber': (frame_timber, lambda c, x, y, w, h: render(c, x, y, w, h)),
    'brick': (frame_brick, lambda c, x, y, w, h: brick(c, x, y, w, h)),
    'adobe': (frame_adobe, lambda c, x, y, w, h: adobe(c, x, y, w, h)),
    'asian': (frame_asian, lambda c, x, y, w, h: boards(c, x, y, w, h, RAMPS['cedar'])),
}


# ------------------------------------------------------------------ heads

def head_keystone(c, x, y, w, h, r=None):
    r = r or RAMPS['limestone']
    cx = x + w // 2
    for k in range(10):
        half = 5 - k // 4
        c.rect(cx - half, y - 10 + k, 2 * half, 1, r[0] if k == 0 else r[1] if k < 9 else r[3])
        c.p(cx - half, y - 10 + k, r[0]); c.p(cx + half - 1, y - 10 + k, r[3])
    cast(c, cx - 4, y - 1, 9, 1, 0.75)


def head_hood(c, x, y, w, h, r=None):
    """A hood cornice on two consoles: top face, front, drip, shadow."""
    r = r or RAMPS['limestone']
    c.rect(x - 5, y - 14, w + 10, 2, r[0])
    for k, idx in enumerate((1, 1, 2, 3, 4)):
        c.rect(x - 5, y - 12 + k, w + 10, 1, r[idx])
    for kx in (x - 5, x + w + 2):
        raised(c, kx, y - 7, 3, 7, r, 1)
    cast(c, x - 4, y - 7, w + 8, 2, 0.72)


def head_pediment(c, x, y, w, h):
    """A triangular pediment over a frieze: raking cornices lit on the left
    slope, shaded on the right, a deep tympanum between."""
    r = RAMPS['limestone']
    cx = x + w / 2 - 0.5
    span = w / 2 + 7
    rise = 7
    c.rect(x - 7, y - 9, w + 14, 3, r[1])
    c.rect(x - 7, y - 9, w + 14, 1, r[0])
    c.rect(x - 7, y - 6, w + 14, 1, r[4])
    for xx in range(int(x - 7), int(x + w + 7)):
        t = abs(xx - cx) / span
        top = round(y - 9 - rise * (1 - t))
        left = xx < cx
        for k in range(3):
            c.p(xx, top + k, (r[0] if left else r[2]) if k == 0 else (r[1] if left else r[3]) if k == 1 else r[4])
        for yy in range(top + 3, y - 9):
            c.p(xx, yy, r[2])
    cast(c, x - 4, y - 5, w + 8, 2, 0.72)


def head_arch(c, x, y, w, h):
    """A brick relieving arch set in the wall over a plain lintel."""
    r = RAMPS['brick']
    cx = x + w / 2 - 0.5
    for yy in range(y - 14, y - 3):
        for xx in range(x - 4, x + w + 4):
            d = math.hypot((xx - cx) / (w / 2 + 3), (yy - (y - 3)) / 9)
            if 0.72 <= d <= 1.0 and yy < y - 3:
                ang = math.atan2(yy - (y - 3), xx - cx)
                col = r[3] if int((ang + math.pi) * 8) % 2 else r[4]
                if d > 0.93:
                    col = r[2]
                c.p(xx, yy, col)
    raised(c, x - 3, y - 4, w + 6, 3, RAMPS['limestone'], 1)


def head_lintel(c, x, y, w, h):
    o = RAMPS['oak']
    raised(c, x - 6, y - 6, w + 12, 4, o, 2)
    cast(c, x - 5, y - 2, w + 10, 2, 0.72)


HEADS = {'keystone': head_keystone, 'hood': head_hood, 'pediment': head_pediment,
         'arch': head_arch, 'lintel': head_lintel, 'none': None}


def window(c, x, y, w, h, frame='stone', infill='casement', head='none', paint='white'):
    FRAMES[frame][0](c, x, y, w, h, None)
    INFILLS[infill](c, x, y, w, h, paint)
    if frame == 'brick':
        self_arch(c, x, y, w, 4)
    reveal(c, x, y, w, h, 2)
    if HEADS.get(head):
        HEADS[head](c, x, y, w, h)


# ------------------------------------------------------------------ accessories

def open_shutters(c, x, y, w, h, paint='green', leaf=8):
    """Shutters folded back against the wall either side: boarded, with a
    Z-brace, lit on the left leaf's face and shading the wall beside it."""
    p = PAINT[paint]
    for sx, left in ((x - leaf - 2, True), (x + w + 2, False)):
        for yy in range(y - 1, y + h + 1):
            for xx in range(sx, sx + leaf):
                a = xx - sx
                col = p[2] if a % 3 else p[3]
                if yy == y - 1:
                    col = p[1]
                elif yy == y + h:
                    col = p[4]
                elif a == 0 and left:
                    col = p[1]
                elif a == leaf - 1:
                    col = p[4]
                c.p(xx, yy, col)
        for by in (y + 3, y + h - 5):
            c.rect(sx, by, leaf, 2, p[1])
            c.rect(sx, by + 1, leaf, 1, p[3])
        for i in range(leaf - 2):
            t = i / (leaf - 3)
            yy = round(y + h - 6 - t * (h - 12))
            c.p(sx + 1 + i, yy, p[1]); c.p(sx + 1 + i, yy + 1, p[3])
        hx = sx + leaf - 1 if left else sx
        for hy in (y + 3, y + h - 5):
            c.p(hx, hy, IRON[1])
        if not left:
            cast_right(c, sx + leaf, y, h)
    cast_right(c, x - 2, y, h)


def cast_right(c, x, y, h, n=2):
    for i in range(n):
        for yy in range(y, y + h + 1):
            q = c.g(x + i, yy)
            if q[3]:
                k = 0.72 + 0.12 * i
                c.p(x + i, yy, (int(q[0] * k), int(q[1] * k), int(min(255, q[2] * k * 1.05)), 255))


def flower_box(c, x, y, w, seed=0, wood='oak'):
    """A window box hung under a sill: its top seen from above full of
    leaves and a few blooms, its front a boarded trough."""
    o = RAMPS[wood]
    leaf = ramp(135, 0.11, lift=-0.08)
    blooms = [ramp(15, 0.17)[2], ramp(350, 0.15)[2], ramp(85, 0.14)[1], ramp(300, 0.1)[2]]
    for k in range(w + 2):
        hgt = 3 + int(h2(k, seed, 211) * 3)
        for j in range(hgt):
            c.p(x - 1 + k, y - j, leaf[3 if (k + j) % 3 else 2] if j < hgt - 1 else leaf[1])
    for k in range(1, w, 4):
        bx, by = x + k + int(h2(k, seed, 212) * 2), y - 3 - int(h2(k, seed, 213) * 3)
        col = blooms[int(h2(k, seed, 214) * 4)]
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1)):
            c.p(bx + dx, by + dy, col)
        c.p(bx, by, mix(col, (255, 250, 235, 255), 0.6))
    raised(c, x - 2, y + 1, w + 4, 6, o, 3)
    c.rect(x - 2, y + 1, w + 4, 1, o[2])
    cast(c, x - 1, y + 7, w + 2, 2)


# ------------------------------------------------------------------ doors

def door_plank(c, x, y, w, h):
    """Ledged plank door in an oak frame: vertical boards, strap hinges with
    spear ends, a ring latch."""
    o = RAMPS['oak']
    raised(c, x - 4, y - 5, w + 8, h + 5, o, 3)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a = (xx - x) % 5
            col = o[3] if a in (1, 2, 3) else o[2] if a == 0 else o[5]
            if a == 2 and h2(xx, yy // 5, 201) < 0.2:
                col = o[4]
            c.p(xx, yy, col)
    for hy in (y + 7, y + h - 10):
        c.rect(x, hy, w - 5, 2, IRON[3])
        c.rect(x, hy, w - 5, 1, IRON[2])
        c.p(x + w - 6, hy - 1, IRON[3]); c.p(x + w - 5, hy, IRON[3]); c.p(x + w - 6, hy + 2, IRON[3])
        for k in range(x + 1, x + w - 6, 4):
            c.p(k, hy, IRON[1])
    for a in range(0, 360, 40):
        c.p(x + w - 6 + round(math.cos(math.radians(a)) * 2), y + h // 2 + round(math.sin(math.radians(a)) * 2), IRON[1] if a > 180 else IRON[3])
    reveal(c, x, y, w, h, 2)
    raised(c, x - 6, y - 7, w + 12, 4, o, 2)
    cast(c, x - 5, y - 3, w + 10, 2, 0.72)


def door_panel(c, x, y, w, h, paint='blue'):
    """Six-panel door under a fanlight, in a stone surround: each panel's
    raised field lit top-left, its moulding shaded."""
    p = PAINT[paint]
    s = RAMPS['limestone']
    fan = 9
    raised(c, x - 5, y - fan - 5, w + 10, h + fan + 5, s, 1)
    glass(c, x, y - fan, w, fan - 1)
    cx = x + w / 2 - 0.5
    for xx in range(x, x + w):
        for k in range(-5, 6):
            ang = math.radians(k * 16)
            px_ = cx + math.sin(ang) * (fan - 1) * ((xx - cx) / max(1, w / 2))
        c.p(xx, y - 1, s[3])
    for k in range(-4, 5):
        ang = math.radians(k * 20)
        for rr in range(1, fan - 1):
            c.p(cx + math.sin(ang) * rr * 1.3, y - 2 - math.cos(ang) * rr * 0.9, s[2])
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, p[3])
    pw, ph = (w - 6) // 2, (h - 10) // 3
    for i in range(2):
        for j in range(3):
            px_, py = x + 2 + i * (pw + 2), y + 2 + j * (ph + 2)
            c.rect(px_, py, pw, ph, p[4])
            c.rect(px_ + 1, py + 1, pw - 2, ph - 2, p[2])
            c.rect(px_ + 1, py + 1, pw - 2, 1, p[1])
            c.rect(px_ + 1, py + 1, 1, ph - 2, p[1])
            c.rect(px_ + pw - 2, py + 2, 1, ph - 3, p[3])
    c.rect(x + w - 5, y + h // 2, 2, 2, mix(p[0], (230, 190, 90, 255), 0.7))
    reveal(c, x, y, w, h, 2)
    for k in range(3):
        c.rect(x - 6 - k, y + h + k, w + 12 + 2 * k, 1, s[k])


def door_carriage(c, x, y, w, h, paint='green', stone=None):
    """Arched carriage door: a radial-barred fanlight, two leaves of
    fielded panels, gilt knobs."""
    p = PAINT[paint]
    s = stone or RAMPS['limestone']
    R = w // 2
    cx = x + w / 2 - 0.5
    for yy in range(y - 5, y + h):
        for xx in range(x - 5, x + w + 5):
            dx, dy = xx - cx, (y + R) - yy
            if dy > 0 and dx * dx + dy * dy > (R + 5) ** 2:
                continue
            c.p(xx, yy, s[1])
    for a in range(0, 181, 20):
        t = math.radians(a)
        for k in range(R, R + 5):
            c.p(cx + math.cos(t) * k, y + R - math.sin(t) * k, s[3])
    raised(c, int(cx) - 2, y - 6, 6, 8, s, 1)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            dx, dy = xx - cx, (y + R) - yy
            if dy > 0 and dx * dx + dy * dy > R * R:
                continue
            a, b = xx - x, yy - y
            if b < R:
                col = IRON[3] if (abs(math.atan2(dy, dx) * 8 / math.pi % 1) < 0.18) else GLASS[5]
            else:
                pa = a % (w // 2)
                col = p[3]
                if pa in (2, w // 2 - 3) or (b - R) % 13 in (2, 11):
                    col = p[4]
                elif 2 < pa < w // 2 - 3 and (b - R) % 13 in (3,):
                    col = p[1]
                if pa == 0:
                    col = p[1]
                elif pa == w // 2 - 1:
                    col = p[5]
            c.p(xx, yy, col)
    c.rect(x, y + R, w, 1, p[5])
    c.rect(x + w // 2 - 1, y + R, 2, h - R, p[5])
    for k in (-3, 2):
        c.rect(x + w // 2 + k, y + R + 16, 2, 2, (238, 196, 92, 255))
    reveal(c, x, y + R, w, h - R, 2)


def door_shop(c, x, y, w, h, paint='green'):
    """Glazed shop door: a tall light over a fielded bottom panel, a brass
    plate and handle, a transom above."""
    p = PAINT[paint]
    raised(c, x - 3, y - 9, w + 6, h + 9, p, 2)
    glass(c, x, y - 7, w, 5)
    c.rect(x, y - 2, w, 2, p[2])
    c.rect(x, y, w, h, p[3])
    glass(c, x + 3, y + 3, w - 6, h * 3 // 5)
    c.rect(x + 3, y + 3 + h * 3 // 5, w - 6, 1, p[1])
    c.rect(x + 4, y + h * 3 // 5 + 7, w - 8, h - h * 3 // 5 - 10, p[2])
    c.rect(x + 4, y + h * 3 // 5 + 7, w - 8, 1, p[1])
    c.rect(x + w - 5, y + h // 2 + 3, 2, 4, (238, 196, 92, 255))
    reveal(c, x, y, w, h, 2)


def door_sliding(c, x, y, w, h, paint=None):
    """Sliding lattice doors in a cedar frame, one drawn half open on the
    dark of the doma."""
    r = RAMPS['cedar']
    raised(c, x - 3, y - 6, w + 6, h + 6, r, 4)
    raised(c, x - 7, y - 9, w + 14, 4, r, 3)
    lattice(c, x, y, w, h)
    for yy in range(y, y + h):
        for xx in range(x + w // 2 - 3, x + w // 2 + 4):
            c.p(xx, yy, r[7] if yy > y + 2 else r[6])
    c.rect(x + w // 2 - 4, y, 1, h, r[2])
    c.rect(x + w // 2 + 4, y, 1, h, r[5])
    cast(c, x - 6, y - 5, w + 12, 2, 0.72)


DOORS = {'plank': (door_plank, 'timber'), 'panel': (door_panel, 'brick'), 'carriage': (door_carriage, 'stone'),
         'shop': (door_shop, 'stone'), 'sliding': (door_sliding, 'asian')}


# ------------------------------------------------------------------ sheet

def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    cw, ch, gap = 44, 62, 6
    frames = list(FRAMES)
    infills = list(INFILLS)
    heads = ['keystone', 'hood', 'pediment', 'arch', 'lintel', 'none']
    doors = list(DOORS)
    top = 26
    W = gap + (len(infills) + 1) * (cw + gap) + 30
    rows_h = len(frames) * (ch + gap) + (ch + gap) + 92 + 40
    c = C(W, top + rows_h)
    c.rect(0, 0, W, c.h, (28, 24, 34, 255))
    labels = []
    for i, fr in enumerate(frames):
        y = top + i * (ch + gap)
        labels.append((gap, y + ch // 2, fr))
        for j, inf in enumerate(infills):
            x = gap + (j + 1) * (cw + gap)
            FRAMES[fr][1](c, x, y, cw, ch)
            window(c, x + (cw - 18) // 2, y + 18, 18, 28, fr, inf, 'none',
                   'green' if inf == 'shutters' else 'white')
    for j, inf in enumerate(infills):
        labels.append((gap + (j + 1) * (cw + gap), top - 9, inf))
    y = top + len(frames) * (ch + gap) + 10
    labels.append((gap, y - 9, 'heads'))
    for j, hd in enumerate(heads):
        x = gap + (j + 1) * (cw + gap)
        ashlar(c, x, y, cw, ch)
        window(c, x + 13, y + 22, 18, 28, 'stone', 'casement', hd)
        labels.append((x, y + ch + 1, hd))
    y += ch + gap + 16
    labels.append((gap, y - 9, 'doors'))
    for j, dk in enumerate(doors):
        x = gap + (j + 1) * (cw + gap)
        fn, wall = DOORS[dk]
        FRAMES[wall][1](c, x, y, cw, 74)
        dw, dh = (24, 50) if dk == 'carriage' else (22, 44)
        fn(c, x + (cw - dw) // 2, y + 74 - dh, dw, dh)
        labels.append((x, y + 75, dk))
    c.im.alpha_composite(adult, (gap + 6 * (cw + gap) + 4, y + 74 - adult.height))
    im = c.im.resize((c.w * zoom, c.h * zoom), Image.NEAREST)
    d = ImageDraw.Draw(im)
    font = ImageFont.load_default(size=16)
    d.text((gap * zoom, 4 * zoom), 'FRONT OPENINGS  ·  frames x infills, heads, doors  ·  adult for scale', font=font, fill=(240, 220, 170))
    for x, y, t in labels:
        d.text((x * zoom, y * zoom), t, font=font, fill=(205, 196, 220))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-openings.png')
