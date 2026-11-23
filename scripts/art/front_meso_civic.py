"""The Nahua civic buildings front-on: the temazcal (sweat bath), the
calmecac (temple school) and the telpochcalli (ward house of youths).
Three looks per size, picked by the town's seed; fires, banners and smoke
are overlays the game animates.

    .venv/bin/python scripts/art/front_meso_civic.py artifacts/meso/civic.png
"""
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, h2, mix  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402


def ramp8(*hexes):
    return [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,) for h in hexes]


# Light to dark, eight steps each.
LIME = ramp8('#fffaee', '#f4ecd8', '#e6d9bf', '#d0bfa3', '#b29f88', '#8c7b6e', '#665759', '#463b47')
TEZ = ramp8('#e3a688', '#c98068', '#a95e4d', '#8a463f', '#6c3436', '#52272e', '#3b1c26', '#29131d')
RED = ramp8('#ffb98e', '#f2905e', '#da6540', '#bb4830', '#983527', '#732823', '#501c20', '#34131a')
TURQ = ramp8('#cdf4de', '#94dfc2', '#58c2a8', '#34a08f', '#257d75', '#1b5b5c', '#153f47', '#0f2a34')
OCHRE = ramp8('#fde6a6', '#f1c978', '#dba654', '#bd833f', '#986434', '#734a2c', '#503425', '#35221c')
WOOD = ramp8('#e6c08e', '#c99d68', '#a97b4c', '#885d39', '#68452c', '#4c3123', '#35221b', '#231713')
STRAW = ramp8('#fbeaa9', '#ead07e', '#d0af5a', '#af8d44', '#8b6d35', '#68502a', '#483720', '#2f2418')
BASALT = ramp8('#d4cdc8', '#b0a8a5', '#8d8584', '#6d6568', '#534b51', '#3d3640', '#2b2630', '#1d1a22')
NIGHT = ramp8('#5a5a80', '#45446a', '#363556', '#2b2945', '#221f38', '#1b182d', '#141223', '#0e0c19')
EMBER = ramp8('#fff2b0', '#ffd36a', '#ffa640', '#f07a2a', '#c8501e', '#94341a', '#622216', '#3c1612')
ADOBE = ramp8('#e8c497', '#d4a978', '#b88b5e', '#9a704b', '#7b583d', '#5e4231', '#433026', '#2d201b')
SHADE = ramp8('#b49a8c', '#9c8079', '#846a68', '#6e5759', '#5a474d', '#473941', '#352b34', '#251e27')
VOID = (34, 24, 32, 255)
DOOR = (12, 37)


def cast_down(c, x0, x1, y, n=3, k=0.4):
    fp.cast_down(c, x0, x1, y, n, k)


def cast_right(c, x, y0, y1, n=3, k=0.36):
    fp.cast_right(c, x, y0, y1, n, k)


def plaster(c, x, y, w, h, r, seed, q=2, blot=0.86, stone=None, foot=0):
    """Lime plaster: one tone, a few soft blots a step down where the
    trowel left it thicker, and at the foot, if `stone` is given, patches
    where the plaster has fallen and the stone shows."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            k = q
            if h2(xx // 5, yy // 3, seed) > blot and h2(xx // 2, yy // 2, seed + 3) > 0.35:
                k = q + 1
            c.p(xx, yy, r[k])
    if stone is not None and foot:
        for xx in range(x, x + w):
            for yy in range(y + h - foot, y + h):
                d = (y + h - yy) / foot
                n = h2(xx // 4, yy // 3, seed + 9) * 0.7 + h2(xx, yy, seed + 5) * 0.3
                if n > 0.55 + d * 0.45:
                    c.p(xx, yy, stone[2 if (xx + yy // 3 * 3) % 5 else 4])
                elif n > 0.5 + d * 0.45:
                    c.p(xx, yy, r[min(7, q + 2)])


def ashlar(c, x, y, w, h, r, seed, q=3, course=4):
    """Tezontle: rough blocks in running bond, each lit along its top and
    left, a step darker along its foot, a pit here and there."""
    c.rect(x, y, w, h, r[q + 2])
    row = 0
    for yy in range(y, y + h, course):
        hh = min(course - 1, y + h - yy)
        bx = x - (row % 2) * 3
        while bx < x + w:
            bw = 5 + int(h2(bx, row, seed) * 5)
            x0, x1 = max(x, bx), min(x + w, bx + bw - 1)
            if x1 > x0:
                t = q + (1 if h2(bx, row, seed + 1) > 0.72 else 0)
                c.rect(x0, yy, x1 - x0, hh, r[t])
                c.rect(x0, yy, x1 - x0, 1, r[t - 1])
                if hh > 2:
                    c.rect(x1 - 1, yy + 1, 1, hh - 1, r[t + 1])
                if bw > 6 and h2(bx, row, seed + 2) > 0.6 and hh > 2:
                    c.p(x0 + 2, yy + 2, r[t + 1])
            bx += bw
        row += 1


def deck(c, x0, x1, top, front, r, seed, rim=2, q=2):
    """A flat roof from above, inside a coping: near-even light, a darker
    ring at the far rim, shade cast by the far and left copings."""
    c.rect(x0, top, x1 - x0, front - top, r[q])
    for xx in range(x0, x1):
        for yy in range(top, front):
            if h2(xx // 6, yy // 2, seed + 21) > 0.9:
                c.p(xx, yy, r[q + 1])
    c.rect(x0, top, x1 - x0, rim, r[0])
    c.rect(x0, top + rim, x1 - x0, 1, r[4])
    cast_down(c, x0, x1, top + rim + 1, 3, 0.22)
    c.rect(x0, top, rim, front - top, r[0])
    c.rect(x1 - rim, top, rim, front - top, r[2])
    c.rect(x1 - rim - 1, top + rim, 1, front - top - rim, r[3])
    cast_right(c, x0 + rim, top + rim, front, 3, 0.2)


def coping(c, x0, x1, y, r, h=4):
    """The front coping of a flat roof: its top a lit strip, its face square
    on, a dark line where it overhangs the wall. Returns its face's top."""
    c.rect(x0, y, x1 - x0, 2, r[0])
    c.rect(x0, y + 2, x1 - x0, h - 2, r[2])
    c.rect(x0, y + h - 1, x1 - x0, 1, r[3])
    c.rect(x1 - 1, y, 1, h, r[3])
    return y + 2


def vigas(c, x0, x1, y, step, wood=WOOD):
    """Roof beam ends through the wall top, each lit above with a shadow
    under it on the plaster."""
    for vx in range(x0, x1 - 3, step):
        c.rect(vx, y, 4, 3, wood[3]); c.rect(vx, y, 4, 1, wood[1]); c.p(vx + 3, y + 1, wood[5])
        c.rect(vx + 1, y + 1, 2, 1, wood[2])
        for k in range(2):
            fp.shade(c, vx + 1 + k, y + 3 + k, 0.3); fp.shade(c, vx + 2 + k, y + 3 + k, 0.3)
            fp.shade(c, vx + 3 + k, y + 3 + k, 0.3)


def spout(c, x, y, wood=WOOD):
    """A roof drain spout jutting from the parapet, its top lit."""
    c.rect(x, y, 3, 2, wood[2]); c.rect(x, y, 3, 1, wood[0]); c.rect(x + 1, y + 2, 2, 2, wood[4])
    c.p(x + 1, y + 2, wood[3])
    fp.shade(c, x + 2, y + 4, 0.3); fp.shade(c, x + 3, y + 4, 0.25); fp.shade(c, x + 2, y + 5, 0.2)


def mat_curtain(c, x, y, w, h, roll=5, cloth=None, stripe=None):
    """A cloth hung in a doorway and drawn aside to the left jamb: folds in
    upright bands, a border woven across its foot, tied at the waist."""
    cloth, stripe = cloth or STRAW, stripe or RED
    cw = max(4, w * 3 // 5)
    for yy in range(y, y + h):
        t = (yy - y) / max(1, h - 1)
        reach = cw if yy < y + 4 else round(cw - (cw - 3) * min(1, (t - 0.2) * 1.6)) if t > 0.2 else cw
        if yy > y + h * 0.55:
            reach = round(3 + (cw - 3) * (t - 0.55) * 1.4)
        for xx in range(x, x + max(3, reach)):
            k = (1, 2, 2, 3)[(xx - x) % 4]
            if xx == x + max(3, reach) - 1:
                k = 4
            c.p(xx, yy, cloth[k])
    c.rect(x, y + h - 3, max(3, round(3 + (cw - 3) * 0.45 * 1.4)), 2, stripe[3])
    by = y + round(h * 0.55)
    c.rect(x, by, 3, 1, stripe[2])
    c.rect(x, y, w, 2, cloth[1]); c.rect(x, y + 2, w, 1, cloth[4])


def doorway(c, cx, base, w, h, frame, lintel, curtain=True, step=True, cloth=None, stripe=None):
    """A plain Nahua doorway: a dark room behind square jambs, a heavy lintel
    lit along its top, a mat rolled half up, a stone sill."""
    x = cx - w // 2
    c.rect(x - 3, base - h - 1, w + 6, h + 1, frame[4])
    c.rect(x - 3, base - h - 1, 1, h + 1, frame[2])
    c.rect(x - 2, base - h, 2, h, frame[2]); c.rect(x + w, base - h, 2, h, frame[4])
    c.rect(x + w + 2, base - h, 1, h, frame[5])
    c.rect(x, base - h, w, h, VOID)
    c.rect(x, base - h, 1, h, mix(VOID, frame[5], 0.35))
    if curtain:
        mat_curtain(c, x, base - h, w, h - 2, cloth=cloth, stripe=stripe)
    lw = w + 10
    c.rect(cx - lw // 2, base - h - 5, lw, 5, lintel[3])
    c.rect(cx - lw // 2, base - h - 5, lw, 1, lintel[1])
    c.rect(cx - lw // 2, base - h - 4, 1, 4, lintel[2])
    c.rect(cx - lw // 2, base - h - 1, lw, 1, lintel[5])
    c.rect(cx + lw // 2 - 1, base - h - 4, 1, 4, lintel[5])
    cast_down(c, x - 3, cx + lw // 2, base - h, 2, 0.32)
    if step:
        c.rect(x - 4, base, w + 8, 2, BASALT[2]); c.rect(x - 4, base, w + 8, 1, BASALT[0])
    return dict(door_x=cx, door_h=h, door_width=w, door_base=base, leaf=False)


def woodpile(c, x, by, cols, rows, seed):
    """Split firewood stacked with its ends to us: each end a pale disc in
    its bark, the stack's top logs lit."""
    for r in range(rows):
        n = cols - (r if r > 1 else 0)
        off = (r % 2) * 2 + (r if r > 1 else 0) * 2
        for i in range(n):
            lx, ly = x + off + i * 5, by - 5 - r * 4
            c.rect(lx + 1, ly, 3, 5, WOOD[5]); c.rect(lx, ly + 1, 5, 3, WOOD[5])
            k = 1 if h2(i, r, seed) > 0.4 else 2
            c.rect(lx + 1, ly + 1, 3, 3, WOOD[k]); c.p(lx + 1, ly + 1, WOOD[k - 1])
            c.p(lx + 2, ly + 2, WOOD[k + 2]); c.p(lx + 3, ly + 3, WOOD[k + 1])
            c.p(lx + 4, ly + 2, WOOD[6]); c.p(lx + 2, ly + 4, WOOD[6])
    cast_right(c, x + cols * 5 + 2, by - rows * 4 + 2, by, 3, 0.3)


def zacatapayolli(c, cx, by):
    """The grass ball a novice stuck with the maguey spines he had bled
    with, carved in stone on a little drum: a lattice of grass in relief,
    two spines standing out of it."""
    c.rect(cx - 5, by - 4, 11, 4, BASALT[3]); c.rect(cx - 5, by - 4, 11, 1, BASALT[1])
    c.rect(cx + 5, by - 3, 1, 3, BASALT[5])
    so.sphere(c, cx, by - 4, 5, 5, ramp8('#e8dfc4', '#d6c9a6', '#bfae88', '#a2916f', '#857559', '#685b48',
                                         '#4d4339', '#352e2b'))
    for yy in range(by - 13, by - 4):
        for xx in range(cx - 4, cx + 5):
            if (xx + yy) % 3 == 0 and c.g(xx, yy)[3]:
                fp.shade(c, xx, yy, 0.18)
    for (sx, sy, dx) in ((cx - 2, by - 12, -1), (cx + 2, by - 13, 1)):
        for i in range(5):
            c.p(sx + dx * (i // 2), sy - i, OCHRE[0] if i < 3 else OCHRE[2])


def eye_band(c, x, y, w, h=6, seed=0):
    """The starry band of night: a dark ground set with white eyes, each a
    ring with its pupil, as painted round the eaves of Tenochtitlan's temples."""
    c.rect(x, y, w, h, NIGHT[4])
    c.rect(x, y, w, 1, NIGHT[2])
    for ex in range(x + 4, x + w - 3, 10):
        cy = y + h // 2
        c.rect(ex - 1, cy - 2, 3, 1, LIME[1]); c.rect(ex - 1, cy + 1, 3, 1, LIME[2])
        c.rect(ex - 2, cy - 1, 1, 2, LIME[1]); c.rect(ex + 2, cy - 1, 1, 2, LIME[3])
        c.rect(ex - 1, cy - 1, 3, 2, LIME[0]); c.p(ex, cy, NIGHT[6]); c.p(ex, cy - 1, NIGHT[5])


def conch(c, x, y, r, back=False):
    """The cut conch, ehecacozcatl, Quetzalcoatl's wind jewel, as a merlon:
    a shell sliced across, its whorl showing as a hooked cut, lit from the
    left. From behind (the far parapet) it is the plain back of the shell."""
    rows = ('..LLMM..',
            '.LLMMMS.',
            'LLDDDMMS',
            'LD..LMMS',
            'LD.LMMMS',
            'LMDMMMMS',
            '.LMMMMS.',
            '..LMMS..',
            '.LMMMMS.',
            'LLMMMMMS')
    tone = {'L': r[0], 'M': r[2], 'S': r[4], 'D': r[5], '.': r[6]}
    if back:
        tone = {'L': r[3], 'M': r[4], 'S': r[5], 'D': r[4], '.': r[4]}
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.' and not (1 < j < 6 and 0 < i < 6):
                continue
            c.p(x + i, y + j, tone[ch])
    return 8, len(rows)


def stepped(c, x, y, r):
    """A stepped merlon, the plain almena of a house or ward hall."""
    for i, (dx, w) in enumerate(((0, 9), (1, 7), (2, 5), (3, 3))):
        yy = y - 3 * (i + 1)
        c.rect(x + dx, yy, w, 3, r[2]); c.rect(x + dx, yy, w, 1, r[0])
        c.rect(x + dx, yy + 1, 1, 2, r[1]); c.rect(x + dx + w - 1, yy + 1, 1, 2, r[4])


def mirror(c, cx, cy):
    """Tezcatlipoca's smoking mirror: an obsidian disc in an ochre rim, a
    glint on its upper left, two curls of smoke rising off it."""
    for dy in range(-6, 7):
        for dx in range(-6, 7):
            d = math.hypot(dx + 0.3, dy + 0.3)
            if d <= 6.4:
                if d > 4.9:
                    col = OCHRE[1] if dx + dy < -2 else OCHRE[2] if dx + dy < 3 else OCHRE[4]
                else:
                    col = BASALT[6] if dx + dy > -3 else BASALT[5]
                c.p(cx + dx, cy + dy, col)
    c.p(cx - 2, cy - 3, BASALT[1]); c.p(cx - 3, cy - 2, BASALT[2]); c.p(cx - 1, cy - 3, BASALT[3])
    c.p(cx - 3, cy - 1, BASALT[3])
    curl = ((0, 0), (0, -1), (1, -2), (2, -3), (2, -4), (1, -5), (0, -5), (-1, -6), (-1, -7), (0, -8), (1, -8))
    for sx, s in ((cx - 3, 1), (cx + 3, -1)):
        for i, (dx, dy) in enumerate(curl):
            c.p(sx + s * dx, cy - 7 + dy, LIME[0] if i < 6 else LIME[2])
            if i < 6:
                c.p(sx + s * dx + 1, cy - 7 + dy, LIME[3])
    cast_right(c, cx + 7, cy - 4, cy + 7, 2, 0.25)


def shield(c, cx, cy):
    """A chimalli of woven cane faced with feathers, a fringe of plumes
    hanging from its foot."""
    for dy in range(-4, 5):
        for dx in range(-4, 5):
            d = math.hypot(dx, dy)
            if d <= 4.4:
                col = OCHRE[1] if d > 3.3 else (TURQ[2] if dy < 0 else TURQ[3])
                if d <= 3.3 and abs(dx) < 1:
                    col = LIME[1]
                c.p(cx + dx, cy + dy, col)
    for i, tx in enumerate(range(cx - 3, cx + 4, 2)):
        c.rect(tx, cy + 5, 1, 3 + i % 2, (RED[2], TURQ[2])[i % 2])
    cast_right(c, cx + 5, cy - 3, cy + 6, 2, 0.25)


def brazier(c, cx, by, overlays):
    """A tripod copal brazier of fired clay, its fire an overlay."""
    rows = [(4, 2), (4, 3), (4, 3), (3, 3), (2, 4), (1, 5), (1, 5)]
    y = by
    for half, k in reversed(rows):
        for dx in range(-half, half + 1):
            u = dx / max(1, half)
            c.p(cx + dx, y, RED[k - 1] if u < -0.4 else RED[k] if u < 0.4 else RED[k + 2])
        y -= 1
    c.p(cx - 3, by + 1, RED[5]); c.p(cx + 3, by + 1, RED[6])
    top = by - len(rows)
    for dx in range(-4, 5):
        c.p(cx + dx, top, RED[1] if dx < 0 else RED[2])
    c.rect(cx - 3, top + 1, 7, 1, EMBER[3])
    overlays.append(['flame-small', cx - 3, top - 8])


def banner(c, x, by, overlays, h=20):
    c.rect(x, by - h, 1, h, WOOD[2]); c.rect(x + 1, by - h + 1, 1, h - 1, WOOD[4])
    c.rect(x - 1, by - h, 4, 1, WOOD[1]); c.p(x, by - h - 1, OCHRE[1])
    overlays.append(['banner', x + 1, by - h + 1])
    fp.shade(c, x + 2, by, 0.3); fp.shade(c, x + 3, by, 0.2)


def thatch_lean(c, x0, x1, y, h, seed):
    """A lean-to of zacate grass: bundled courses, each lit along its belly,
    a feathered eave, the deep shade it throws under."""
    for yy in range(y, y + h):
        t = (yy - y) / max(1, h - 1)
        course = (yy - y) % 3
        for xx in range(x0 - round(t * 2), x1 + round(t * 2)):
            k = (1, 2, 3)[course]
            if h2(xx // 2, (yy - y) // 3, seed) > 0.7:
                k += 1
            if xx > x1 - 3:
                k += 1
            c.p(xx, yy, STRAW[k])
    for xx in range(x0 - 2, x1 + 2):
        if h2(xx, 1, seed) > 0.35:
            c.p(xx, y + h, STRAW[3 if xx % 2 else 4])
        if h2(xx, 2, seed) > 0.75:
            c.p(xx, y + h + 1, STRAW[4])
    c.rect(x0, y - 1, x1 - x0, 1, STRAW[0])


def post(c, x, top, base, w=3):
    c.rect(x, top, w, base - top, WOOD[3]); c.rect(x, top, 1, base - top, WOOD[1])
    c.rect(x + w - 1, top, 1, base - top, WOOD[5])
    c.rect(x - 1, base - 2, w + 2, 2, BASALT[3]); c.rect(x - 1, base - 2, w + 2, 1, BASALT[1])


def huehuetl(c, cx, by):
    """The upright drum on its three cut feet, a jaguar-skin head lit on top."""
    so.lathe(c, cx, by, [(0, 4.5), (4, 4.5), (5, 3.6), (12, 4.2), (13, 4.4)], WOOD)
    for x in (cx - 3, cx, cx + 3):
        c.rect(x, by - 3, 1, 3, WOOD[6])
    c.rect(cx - 3, by - 12, 7, 2, OCHRE[1])
    c.p(cx - 1, by - 12, OCHRE[4]); c.p(cx + 2, by - 11, OCHRE[4])
    c.rect(cx - 3, by - 8, 7, 1, RED[3])




def glow(info, x, y, w, h, lv):
    """Mark a region lit at night: 1 for fire, 2 for a dark room."""
    lit = info.setdefault('lit', {})
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            lit[(xx, yy)] = lv


# ------------------------------------------------------------------ temazcal

def temazcal(s):
    """The temazcalli: a plastered dome over a tezontle footing, the low door
    framed in dressed stone with the face of Temazcalteci over it, the
    firebox (xictli) built against one side, firewood stacked at the other.
    Looks: which side the firebox stands, the cloth's colour, how much
    plaster has fallen, how high the dome rises."""
    W, size, seed, look = s['W'], s['size'], s['seed'], s.get('look', 0) % 3
    small, large = size == 'small', size == 'large'
    side = -1 if look == 1 else 1
    cloth = (TURQ, RED, OCHRE)[look]
    wear = (0.9, 0.95, 0.84)[look]
    R = {'small': 16, 'medium': 21, 'large': 24}[size]
    H = round(R * (1.02, 0.94, 1.1)[look])
    ph = 4 if small else 5
    pd = 8 if small else 12
    c = C(W + 24, ph + pd + H + 24)
    x0, base = 12, c.h - 4
    info = dict(x0=x0, W=W, base=base, smoke=[], overlays=[])
    top = base - ph
    c.rect(x0, top - pd, W, pd, LIME[2])
    c.rect(x0, top - pd, W, 2, LIME[3]); c.rect(x0, top - pd, 1, pd, LIME[1])
    c.rect(x0 + W - 2, top - pd, 2, pd, LIME[3])
    for xx in range(x0 + 2, x0 + W - 2):
        if h2(xx // 6, 0, seed + 4) > 0.75:
            c.p(xx, top - pd + 3 + int(h2(xx // 6, 3, seed) * (pd - 4)), LIME[3])
    c.rect(x0, top - 1, W, 1, LIME[1])
    ashlar(c, x0, top, W, ph + 1, TEZ, seed)
    cx = x0 + W // 2 - (4 if small else 5) * side
    foot = top - pd // 2 + 1

    def skin(x, y, z, q):
        a = math.atan2(y, x)
        if z < 3.5:
            u = (a + 4) * R / 4 + int(z // 2) * 0.5
            return TEZ[min(7, q + (2 if u % 1 < 0.22 else 0))]
        if z < 5:
            return LIME[min(7, q + 1)]
        if h2(int((a + 4) * R / 5), int(z / 4), seed + 7) > wear and 6 < z < H - 5:
            fine = h2(int((a + 4) * R / 2.5), int(z / 2), seed + 8)
            return TEZ[min(7, q + 1)] if fine > 0.35 else LIME[min(7, q + 2)]
        return LIME[min(7, q)]
    prof = [(0, R)] + [(H * i / 14, R * (1 - (i / 14) ** 1.8) ** 0.6) for i in range(1, 15)]
    so.lathe(c, cx, foot, prof, LIME, surface=skin)
    vy = foot - H - 1
    c.rect(cx - 3, vy, 7, 3, TEZ[2]); c.rect(cx - 3, vy, 7, 1, TEZ[1]); c.rect(cx - 2, vy + 1, 4, 1, VOID)
    c.rect(cx + 3, vy, 1, 3, TEZ[4])
    info['smoke'].append([cx, vy - 1, 'vent'])
    # the low door: tezontle jambs and lintel, hot stones glowing at the back
    dw, dh = (9, 14) if small else (11, 16) if not large else (12, 17)
    fx = cx - dw // 2
    ly = top - dh - 4
    for jx in (fx - 2, fx + dw):
        c.rect(jx, top - dh, 2, dh, TEZ[2]); c.p(jx, top - dh, TEZ[1])
        c.rect(jx + 1, top - dh + 1, 1, dh - 1, TEZ[3])
    c.rect(fx - 4, ly, dw + 8, 4, TEZ[2]); c.rect(fx - 4, ly, dw + 8, 1, TEZ[0])
    c.rect(fx - 4, ly + 3, dw + 8, 1, TEZ[4]); c.rect(fx + dw + 3, ly, 1, 4, TEZ[5])
    c.rect(fx, top - dh, dw, dh, VOID)
    glow(info, fx, top - dh + 3, dw, dh - 7, 2)
    c.rect(fx + 1, top - 4, dw - 2, 3, EMBER[6]); c.rect(fx + 2, top - 3, dw - 4, 2, EMBER[5])
    c.rect(fx + 3, top - 2, dw - 6, 1, EMBER[3])
    glow(info, fx + 3, top - 2, dw - 6, 1, 1)
    c.rect(fx - 1, top - dh, dw + 2, 3, cloth[2]); c.rect(fx - 1, top - dh, dw + 2, 1, cloth[1])
    c.rect(fx - 1, top - dh + 2, dw + 2, 1, cloth[4])
    stripe = RED if cloth is not RED else OCHRE
    c.rect(fx + 2, top - dh, 1, 3, stripe[3]); c.rect(fx + dw - 3, top - dh, 1, 3, stripe[3])
    cast_down(c, fx - 1, fx + dw + 1, top - dh + 3, 2, 0.35)
    c.rect(fx - 3, top, dw + 6, 2, BASALT[2]); c.rect(fx - 3, top, dw + 6, 1, BASALT[0])
    # Temazcalteci, grandmother of the baths, in her cotton headband
    face = ('.TTTTT.',
            'TTOTOTT',
            '.LFFFS.',
            'ELKFKSE',
            'ELFFFSE',
            '.LFRFS.',
            '..LFS..')
    tones = {'T': RED[3], 'O': LIME[0], 'L': LIME[1], 'F': LIME[2], 'S': LIME[4], 'K': NIGHT[5],
             'R': RED[3], 'E': TURQ[2]}
    my = ly - 8
    for j, row in enumerate(face):
        for i, ch in enumerate(row):
            if ch in tones:
                c.p(cx - 3 + i, my + j, tones[ch])
    cast_right(c, cx + 4, my + 1, my + 7, 2, 0.3)
    info.update(door_x=cx, door_h=dh, door_width=dw, door_base=top, leaf=False)
    # the firebox against the dome's side, its mouth to the front
    bw, bh = (11, 11) if small else (13, 13)
    bx = cx + R - 7 if side > 0 else cx - R + 7 - bw
    stone_top = lambda c_, x, y, w, h: (c_.rect(x, y, w, h, TEZ[1]), c_.rect(x, y, w, 1, TEZ[0]),
                                        c_.rect(x + w - 1, y, 1, h, TEZ[3]))
    fy, ty = so.box(c, bx, top, bw, bh, 8, lambda c_, x, y, w, h: ashlar(c_, x, y, w, h, TEZ, seed + 5), stone_top)
    c.rect(bx + bw - 1, fy, 1, bh, TEZ[5])
    mx = bx + bw // 2 - 3
    c.rect(mx - 1, top - 8, 8, 2, TEZ[1]); c.rect(mx - 1, top - 6, 8, 1, TEZ[4])
    c.rect(mx, top - 6, 6, 6, VOID)
    c.rect(mx + 1, top - 3, 4, 2, EMBER[3]); c.rect(mx + 2, top - 3, 2, 1, EMBER[1])
    glow(info, mx + 1, top - 3, 4, 2, 1)
    info['overlays'].append(['flame-small', mx - 1, top - 10])
    c.rect(bx + bw // 2 - 2, ty + 1, 4, 2, VOID)
    info['smoke'].append([bx + bw // 2, ty, 'chimney'])
    cast_right(c, bx + bw, fy, top, 3, 0.3)
    if not small:
        cols = 3 if not large else 4
        woodpile(c, x0 + 2 if side > 0 else x0 + W - 4 - cols * 5, top - 1, cols, 3, seed)
    if large:
        so.lathe(c, x0 + W - 6 if side > 0 else x0 + 6, top - 1,
                 [(0, 2.5), (2, 4.2), (5, 4.6), (8, 3.6), (10, 2.2), (11, 2.6)], RED, hollow=(2.0, 8))
    return c, info


# ------------------------------------------------------------------ calmecac

def stair(c, cx, base, h, w, band=RED):
    """A stair between alfardas, each ending at the top in the square dado
    of Aztec stairs."""
    treads = h // 3
    for i in range(treads):
        y = base - h + i * 3
        c.rect(cx - w // 2, y, w, 1, LIME[0])
        c.rect(cx - w // 2, y + 1, w, 2, LIME[3])
        c.rect(cx - w // 2, y + 2, w, 1, LIME[4])
    c.rect(cx - w // 2, base - h + treads * 3, w, h - treads * 3 + 1, LIME[3])
    for side in (-1, 1):
        ax = cx - w // 2 - 6 if side < 0 else cx + w // 2
        c.rect(ax, base - h, 6, h + 1, LIME[1])
        if side < 0:
            c.rect(ax, base - h, 1, h + 1, LIME[0])
        c.rect(ax + 5, base - h, 1, h + 1, LIME[3])
        c.rect(ax + 1, base - h + 2, 4, h - 2, band[3]); c.rect(ax + 1, base - h + 2, 1, h - 2, band[2])
        c.rect(ax + 4, base - h + 2, 1, h - 2, band[4])
        dy = base - h - 7
        c.rect(ax - 1, dy, 8, 3, LIME[0]); c.rect(ax - 1, dy + 3, 8, 5, LIME[2])
        c.rect(ax - 1, dy + 3, 1, 5, LIME[1]); c.rect(ax + 6, dy, 1, 8, LIME[4])
        c.rect(ax + 1, dy + 4, 4, 2, band[3])
    cast_right(c, cx + w // 2 + 6, base - h - 6, base + 1, 2, 0.25)


def talud_tablero(c, x0, x1, base, h, seed):
    """The platform: a sloping talud, then the tablero, a framed panel
    standing proud of it and painted red within its frame."""
    tl = h * 2 // 5
    for i in range(tl):
        inset = (tl - i) // 2
        c.rect(x0 + inset - tl // 2 + 1, base - i, x1 - x0 - 2 * (inset - tl // 2 + 1), 1, LIME[2 if i < tl - 1 else 1])
    plaster(c, x0, base - tl + 1, x1 - x0, tl, LIME, seed + 31, q=2, blot=0.93)
    ty = base - h
    c.rect(x0, ty, x1 - x0, h - tl + 1, LIME[1])
    c.rect(x0, ty, x1 - x0, 1, LIME[0])
    c.rect(x0 + 3, ty + 3, x1 - x0 - 6, h - tl - 5, RED[3])
    c.rect(x0 + 3, ty + 3, x1 - x0 - 6, 1, RED[5]); c.rect(x0 + 3, ty + 3, 1, h - tl - 5, RED[5])
    c.rect(x0 + 3, ty + h - tl - 3, x1 - x0 - 6, 1, RED[2])
    c.rect(x0, base - tl + 1, x1 - x0, 1, LIME[4])
    c.rect(x1 - 1, ty, 1, h - tl + 1, LIME[3])
    cast_down(c, x0, x1, base - tl + 2, 2, 0.3)


def frieze(c, x, y, w, kind):
    """The band over the piers: the starry night, the stepped fret, or
    jade discs on red."""
    if kind == 'eyes':
        eye_band(c, x, y, w, 7)
    elif kind == 'fret':
        from art.front_meso import fret
        c.rect(x, y, w, 7, LIME[1])
        fret(c, x + 1, y + 1, w - 2, 5, RED[3], LIME[1])
        c.rect(x, y + 6, w, 1, LIME[3])
    else:
        c.rect(x, y, w, 7, RED[3]); c.rect(x, y, w, 1, RED[2]); c.rect(x, y + 6, w, 1, RED[5])
        for dx in range(x + 4, x + w - 3, 9):
            c.rect(dx - 1, y + 1, 3, 5, TURQ[2]); c.rect(dx - 2, y + 2, 5, 3, TURQ[2])
            c.p(dx - 1, y + 2, TURQ[0]); c.p(dx, y + 3, TURQ[5]); c.rect(dx + 1, y + 4, 2, 1, TURQ[4])


def calmecac(s):
    """The calmecac, where priests schooled the sons of nobles under
    Quetzalcoatl: a long hall behind square piers on a talud-tablero
    platform, a stair between alfardas. A bench painted with a procession
    inside the porch, a frieze over the piers, merlons on the parapet,
    braziers on the landing, paper banners on the roof, the novice's spined
    grass ball carved in stone by the stair. Looks: the frieze (starry
    night, fret, jade discs), the merlons, the porch mural, the cloth."""
    W, size, seed, look = s['W'], s['size'], s['seed'], s.get('look', 0) % 3
    small, large = size == 'small', size == 'large'
    band = ('eyes', 'fret', 'discs')[look]
    cloth = (TURQ, RED, OCHRE)[look]
    dado = (RED, OCHRE, RED)[look]
    ph = 12 if small else 14
    land, pier_h, ent = 7, 40, 15
    roof_d = 22 if not large else 24
    c = C(W + 24, ph + land + pier_h + ent + roof_d + (26 if large else 0) + 30)
    x0, base = 12, c.h - 4
    x1 = x0 + W
    cx = x0 + W // 2
    info = dict(x0=x0, W=W, base=base, smoke=[], overlays=[])
    floor = base - ph - land
    eave = floor - pier_h
    roof_front = eave - ent
    roof_top = roof_front - roof_d
    hx0, hx1 = x0 + 4, x1 - 4
    deck(c, hx0, hx1, roof_top, roof_front, LIME, seed)
    coping(c, hx0 - 2, hx1 + 2, roof_front - 2, LIME, h=5)
    ey = roof_front + 3
    c.rect(hx0, ey, hx1 - hx0, 2, RED[3]); c.rect(hx0, ey, hx1 - hx0, 1, RED[2])
    frieze(c, hx0, ey + 2, hx1 - hx0, band)
    c.rect(hx0, ey + 9, hx1 - hx0, 2, RED[3]); c.rect(hx0, ey + 10, hx1 - hx0, 1, RED[5])
    c.rect(hx0 - 1, eave - 3, hx1 - hx0 + 2, 3, WOOD[3]); c.rect(hx0 - 1, eave - 3, hx1 - hx0 + 2, 1, WOOD[1])
    c.rect(hx0 - 1, eave - 1, hx1 - hx0 + 2, 1, WOOD[5])
    c.rect(hx1 - 1, roof_front, 1, eave - roof_front, LIME[4])
    # the porch: the hall's front wall deep in warm shade behind the piers
    c.rect(hx0, eave, hx1 - hx0, floor - eave, SHADE[2])
    if look != 1:
        # the feathered serpent painted along the porch wall
        for xx in range(hx0 + 2, hx1 - 2):
            y = eave + 13 + round(3 * math.sin((xx - hx0 + seed) / 7.0))
            c.p(xx, y, mix(TURQ[3], SHADE[2], 0.35)); c.p(xx, y + 1, mix(TURQ[4], SHADE[2], 0.35))
            if (xx - hx0) % 4 == 0:
                c.p(xx, y - 1, mix(OCHRE[2], SHADE[2], 0.4)); c.p(xx + 1, y + 2, mix(RED[3], SHADE[2], 0.35))
    cast_down(c, hx0, hx1, eave, 6, 0.4)
    by = floor - 9
    c.rect(hx0, by, hx1 - hx0, 2, SHADE[0])
    c.rect(hx0, by + 2, hx1 - hx0, 7, SHADE[1])
    c.rect(hx0, by + 2, hx1 - hx0, 1, RED[4]); c.rect(hx0, by + 8, hx1 - hx0, 1, RED[5])
    for i, fx in enumerate(range(hx0 + 3, hx1 - 4, 6)):
        if abs(fx - cx) < 12:
            continue
        col = (RED[4], OCHRE[3], TURQ[4])[(i + look) % 3]
        c.rect(fx, by + 4, 2, 3, col); c.p(fx, by + 3, OCHRE[4]); c.p(fx + 2, by + 4, col)
        c.p(fx - 1, by + 3, TURQ[3] if i % 2 else RED[3])
    c.rect(hx0, floor - 2, hx1 - hx0, 2, SHADE[3])
    dh = min(DOOR[1], pier_h - 4)
    info.update(doorway(c, cx, floor - 1, DOOR[0] + 2, dh, TURQ, WOOD, step=False, cloth=cloth,
                        stripe=RED if cloth is not RED else OCHRE))
    glow(info, cx - DOOR[0] // 2 - 1, floor - 1 - dh, DOOR[0] + 2, dh, 2)
    n = 4 if small else 6 if size == 'medium' else 8
    gap = (hx1 - hx0 - 8) / (n - 1)
    for i in range(n):
        px = round(hx0 + i * gap)
        if abs(px + 4 - cx) < 12:
            continue
        c.rect(px, eave, 8, floor - eave, LIME[2])
        c.rect(px, eave, 2, floor - eave, LIME[1]); c.rect(px + 6, eave, 2, floor - eave, LIME[3])
        c.rect(px + 7, eave, 1, floor - eave, LIME[4])
        c.rect(px, floor - 9, 8, 9, dado[3]); c.rect(px, floor - 9, 2, 9, dado[2]); c.rect(px + 6, floor - 9, 2, 9, dado[4])
        c.rect(px, floor - 9, 8, 1, dado[1])
        c.rect(px - 1, eave, 10, 2, LIME[1]); c.rect(px - 1, eave + 2, 10, 1, LIME[4])
        cast_right(c, px + 8, eave + 3, floor, 3, 0.32)
    c.rect(x0, floor, W, land, LIME[1])
    c.rect(x0, floor, W, 1, LIME[3])
    c.rect(x1 - 2, floor, 2, land, LIME[2])
    cast_down(c, x0, x1, floor, 2, 0.28)
    talud_tablero(c, x0, x1, base, ph, seed)
    stair(c, cx, base, ph, 20 if small else 24)
    if look == 2:
        n = max(4, (hx1 - hx0) // 14)
        for i in range(n):
            mx = round(hx0 + i * (hx1 - hx0 - 9) / (n - 1))
            stepped(c, mx, roof_front - 2, LIME)
            cast_right(c, mx + 9, roof_front - 13, roof_front - 2, 3, 0.25)
    else:
        for mx in range(hx0 + 1, hx1 - 8, 11):
            conch(c, mx, roof_front - 12, LIME)
            cast_right(c, mx + 8, roof_front - 10, roof_front - 2, 3, 0.25)
    banner(c, hx0 + 4, roof_top + 6, info['overlays'])
    banner(c, hx1 - 6, roof_top + 6, info['overlays'])
    if large:
        # the god's room on the roof, at the back of the deck
        sw = 40
        sx = cx - sw // 2
        sb = roof_top + 14
        c.rect(sx - 2, sb - 26, sw + 4, 4, LIME[0]); c.rect(sx - 2, sb - 22, sw + 4, 2, LIME[3])
        plaster(c, sx, sb - 20, sw, 20, LIME, seed + 5, q=2)
        c.rect(sx, sb - 6, sw, 6, RED[3]); c.rect(sx, sb - 6, sw, 1, RED[2])
        frieze(c, sx, sb - 20, sw, band)
        c.rect(sx + sw - 1, sb - 20, 1, 20, LIME[4])
        c.rect(cx - 4, sb - 12, 8, 12, VOID); c.rect(cx - 5, sb - 13, 10, 1, WOOD[2])
        glow(info, cx - 4, sb - 12, 8, 12, 2)
        for mx in range(sx + 1, sx + sw - 6, 10):
            if look == 2:
                stepped(c, mx, sb - 26, LIME)
            else:
                conch(c, mx, sb - 36, LIME)
        cast_down(c, sx, sx + sw + 3, sb, 3, 0.3)
        cast_right(c, sx + sw, sb - 22, sb, 4, 0.3)
        info['smoke'].append([cx, sb - 14, 'vent'])
    for bx in (cx - 17, cx + 17):
        brazier(c, bx, floor + 4, info['overlays'])
    if not small:
        zacatapayolli(c, x0 + 12 if look != 1 else x1 - 12, floor + 5)
    return c, info


# ------------------------------------------------------------------ telpochcalli

def telpochcalli(s):
    """The telpochcalli, the ward's house of youths under Tezcatlipoca:
    plain plastered adobe under a flat roof on beams, a painted dado, one
    wide door under the smoking mirror, water spouts at the parapet. The
    youths fetched wood for the temple fires, stacked on the roof and by
    the wall. Medium and large have a grass ramada for work, large a drum
    under it. Looks: the ramada's side, the dado (red; black with a yellow
    band; ochre), merlons or a plain parapet, war shields by the door."""
    W, size, seed, look = s['W'], s['size'], s['seed'], s.get('look', 0) % 3
    small, large = size == 'small', size == 'large'
    ram = 0 if small else (30 if large else 26)
    left = look != 1
    dr, dq = ((RED, 3), (BASALT, 5), (OCHRE, 3))[look]
    ph, wall_h = 4, 56
    roof_d = 18 if not large else 24
    c = C(W + 24, ph + wall_h + roof_d + 34)
    x0, base = 12, c.h - 4
    x1 = x0 + W
    info = dict(x0=x0, W=W, base=base, smoke=[], overlays=[])
    hx0, hx1 = (x0 + ram, x1) if left else (x0, x1 - ram)
    cx = hx0 + (hx1 - hx0) // 2
    wb = base - ph
    eave = wb - wall_h
    roof_front = eave - 4
    roof_top = roof_front - roof_d
    deck(c, hx0, hx1, roof_top, roof_front, LIME, seed)
    woodpile(c, hx1 - 30, roof_front - 12, 3, 2, seed + 1)
    if not small:
        woodpile(c, hx0 + 14, roof_front - 12, 2, 2, seed + 2)
    banner(c, hx0 + 4, roof_top + 6, info['overlays'], h=18)
    banner(c, hx1 - 6, roof_top + 6, info['overlays'], h=18)
    coping(c, hx0 - 1, hx1 + 1, roof_front - 2, LIME, h=5)
    plaster(c, hx0, eave + 3, hx1 - hx0, wall_h - 3, LIME, seed, q=2, blot=0.91)
    c.rect(hx0, wb - 13, hx1 - hx0, 13, dr[dq])
    for xx in range(hx0, hx1):
        if h2(xx // 3, 0, seed + 8) > 0.55:
            c.p(xx, wb - 14, dr[dq])
        for yy in range(wb - 12, wb):
            if h2(xx // 4, yy // 2, seed + 13) > 0.82:
                c.p(xx, yy, dr[dq + 1])
    c.rect(hx0, wb - 13, hx1 - hx0, 1, dr[dq - 1])
    if look == 1:
        c.rect(hx0, wb - 16, hx1 - hx0, 2, OCHRE[2]); c.rect(hx0, wb - 16, hx1 - hx0, 1, OCHRE[1])
    for xx in range(hx0, hx1):
        for yy in range(wb - 11, wb):
            n = h2(xx // 4, yy // 3, seed + 17) * 0.75 + h2(xx, yy, seed + 18) * 0.25
            if n > 0.72 + (wb - yy) * 0.02:
                c.p(xx, yy, ADOBE[2 if (xx + (yy // 3) * 4) % 8 and yy % 3 else 4])
    c.rect(hx1 - 1, eave + 3, 1, wall_h - 3, LIME[4])
    vigas(c, hx0 + 4, hx1 - 2, eave + 3, 10)
    for sx in range(hx0 + 14, hx1 - 8, 34):
        spout(c, sx, roof_front)
    if look != 1:
        n = max(3, (hx1 - hx0) // 16)
        for i in range(n):
            mx = round(hx0 + 1 + i * (hx1 - hx0 - 11) / (n - 1))
            stepped(c, mx, roof_front - 2, LIME)
            cast_right(c, mx + 9, roof_front - 13, roof_front - 2, 3, 0.25)
    info.update(doorway(c, cx, wb, DOOR[0] + 4, DOOR[1] - 2, WOOD, WOOD, cloth=STRAW, stripe=NIGHT))
    glow(info, cx - DOOR[0] // 2 - 2, wb - DOOR[1] + 2, DOOR[0] + 4, DOOR[1] - 2, 2)
    mirror(c, cx, wb - DOOR[1] - 9)
    if look == 2:
        for sx in (cx - 22, cx + 22):
            if hx0 + 6 < sx < hx1 - 6:
                shield(c, sx, wb - 30)
    else:
        for vx in (cx - 30, cx + 26):
            if hx0 + 4 < vx < hx1 - 8:
                c.rect(vx, eave + 16, 5, 3, VOID); c.rect(vx, eave + 19, 5, 1, LIME[0])
                c.rect(vx - 1, eave + 15, 7, 1, LIME[4])
    woodpile(c, hx1 - 20 if left else hx0 + 4, wb, 3, 3 if not small else 2, seed + 3)
    info['smoke'].append([cx + 10, roof_top + roof_d // 2, 'vent'])
    if ram:
        rx0 = x0 if left else x1 - ram
        ry = eave + 6
        for px in (rx0 + 2, rx0 + ram - 4):
            post(c, px, ry + 4, wb)
        c.rect(rx0 + 1, ry + 4, ram, 2, WOOD[2]); c.rect(rx0 + 1, ry + 4, ram, 1, WOOD[0])
        c.rect(rx0, wb - 3, ram + 1, 3, LIME[3]); c.rect(rx0, wb - 3, ram + 1, 1, LIME[2])
        thatch_lean(c, rx0 - 1, rx0 + ram + 2, ry - 4, 9, seed)
        cast_down(c, rx0, rx0 + ram + 1, ry + 6, 4, 0.35)
        shield(c, rx0 + ram - 3 if left else rx0 + 4, ry + 14)
        if large:
            huehuetl(c, rx0 + ram // 2 - 2, wb - 2)
        else:
            c.rect(rx0 + 8, wb - 6, 11, 3, BASALT[2]); c.rect(rx0 + 8, wb - 6, 11, 1, BASALT[0])
            c.rect(rx0 + 10, wb - 8, 6, 2, BASALT[1])
    return c, info


def built(fn):
    def make(spec, info=None):
        c, i = fn(dict(spec))
        finish(c)
        consolidate(c, rare=3)
        if i.get('lit'):
            from art.front_sinitic import night_image
            i['night'] = night_image(c.im, i.pop('lit'))
        if info is not None:
            info.update(i)
        return c.im
    return make


BUILDERS = {'meso-temazcal': built(temazcal), 'meso-calmecac': built(calmecac),
            'meso-telpochcalli': built(telpochcalli)}


def sheet(out, zoom=2):
    from PIL import Image
    from art.reference import current_adult
    adult = current_adult()
    sizes = {'meso-temazcal': (3, 4, 5), 'meso-calmecac': (7, 9, 11), 'meso-telpochcalli': (6, 8, 9)}
    rows = []
    for kind, fws in sizes.items():
        for size, fw in zip(('small', 'medium', 'large'), fws):
            rows.append([BUILDERS[kind](dict(size=size, W=fw * 16, seed=1 + look * 7, look=look)) for look in range(3)])
    W = max(sum(i.width + adult.width + 8 for i in r) for r in rows) + 8
    H = sum(max(i.height for i in r) + 8 for r in rows) + 8
    bg = Image.new('RGBA', (W, H), (176, 180, 160, 255))
    y = 8
    for r in rows:
        h = max(i.height for i in r)
        x = 8
        for im in r:
            bg.alpha_composite(im, (x, y + h - im.height))
            bg.alpha_composite(adult, (x + im.width, y + h - adult.height - 2))
            x += im.width + adult.width + 8
        y += h + 8
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    bg.resize((W * zoom, H * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/meso/civic.png')
