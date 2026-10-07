"""Architectural parts shared by the front-on churches and civic buildings:
arches, windows of every period, walls, buttresses, mouldings, roof bands,
gables with their copings, clocks, and tower tops.

Each part takes a stone ramp so a building's dressings stay one material.
Light comes from the upper left; anything that projects throws its shadow
down and to the right.
"""
import math

from art import front_materials as fm
from art.front_materials import RAMPS, ramp, mix, h2
from art import front_openings as op
from art.front_eave import TONES, COVER

OAK = RAMPS['oak']
DARK = (40, 30, 70, 255)
LIGHT = (255, 244, 220, 255)
VOID = (36, 28, 38, 255)
GOLD = ramp(80, 0.13)
COPPER = ramp(170, 0.07, lift=-0.04)
GLASS_INK = [ramp(262, 0.11, lift=-0.28), ramp(22, 0.15, lift=-0.18), ramp(80, 0.13, lift=-0.08),
             ramp(150, 0.1, lift=-0.2), ramp(300, 0.09, lift=-0.22)]
CLEAR = ramp(225, 0.04, lift=-0.18)

STONE = {
    'limestone': RAMPS['grey-limestone'], 'sandstone': RAMPS['sandstone'], 'granite': RAMPS['granite'],
    'brick': RAMPS['brick'], 'render': RAMPS['render'], 'whitewash': RAMPS['whitewash'],
    'ochre': RAMPS['plaster-ochre'], 'flint': RAMPS['grey-limestone'], 'tar': ramp(32, 0.06, lift=-0.27),
    'falu': ramp(26, 0.13, lift=-0.1),
    'red-sandstone': ramp(30, 0.08, lift=-0.04), 'pink': ramp(20, 0.05, lift=0.02),
}


# ------------------------------------------------------------------ light

def shade(c, x, y, k, to=DARK):
    """Darken (or light) a pixel by a stepped amount: shadows fall in a few
    clean bands, as a pixel artist would paint them, not a smooth ramp."""
    q = c.g(x, y)
    if q[3]:
        k = round(k * 8) / 8
        if k > 0:
            c.p(x, y, mix(q, to, k))


def cast_right(c, x, y0, y1, n=4, k=0.36):
    for i in range(n):
        for y in range(y0 + i, y1):
            shade(c, x + i, y, k * (1 - i / n))


def cast_down(c, x0, x1, y, n=3, k=0.38):
    for i in range(n):
        for x in range(x0 + i, x1):
            shade(c, x, y + i, k * (1 - i / n))


def raised(c, x, y, w, h, r, body=2):
    op.raised(c, x, y, w, h, r, body)


# ------------------------------------------------------------------ arches

def pointed(x, y, x0, spring, w):
    if y >= spring:
        return x0 <= x < x0 + w
    lx = x - x0 + 0.5
    if lx < 0 or lx > w:
        return False
    up = spring - y
    reach = math.sqrt(max(0, w * w - (w - lx) ** 2)) if lx <= w / 2 else math.sqrt(max(0, w * w - lx * lx))
    return up <= reach


def rounded(x, y, x0, spring, w):
    if y >= spring:
        return x0 <= x < x0 + w
    r = w / 2
    return (x - x0 + 0.5 - r) ** 2 + (spring - y) ** 2 <= r * r


def segmental(x, y, x0, spring, w):
    """A flat segmental arch: a shallow curve, as over Baroque windows."""
    if y >= spring:
        return x0 <= x < x0 + w
    t = (x - x0 + 0.5) / w * 2 - 1
    return 0 <= t + 1 <= 2 and spring - y <= round(w * 0.18 * math.sqrt(max(0, 1 - t * t)))


def square(x, y, x0, spring, w):
    return x0 <= x < x0 + w and y >= spring - 1


SHAPES = {'pointed': pointed, 'round': rounded, 'segmental': segmental, 'square': square}


def apex(shape, w):
    return {'pointed': round(w * 0.87), 'round': w // 2, 'segmental': round(w * 0.18), 'square': 0}[shape]


# ------------------------------------------------------------------ glazing

def stained(c, x0, y0, w, h, inside, seed):
    """Stained glass by day from outside: dark, small leaded quarries, the
    colours glinting, the lower lights a little brighter."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if not inside(x, y):
                continue
            a, b = x - x0, y - y0
            if a % 3 == 0 or b % 4 == 0:
                c.p(x, y, (34, 30, 44, 255))
                continue
            k = h2(a // 3, b // 4, seed)
            g = GLASS_INK[0 if k < 0.52 else 1 if k < 0.7 else 2 if k < 0.82 else 3 if k < 0.93 else 4]
            col = g[4] if b < h * 0.35 else g[3]
            if (a // 3 + b // 4) % 6 == 0 and b > 3:
                col = g[1]
            c.p(x, y, col)


def clear(c, x0, y0, w, h, inside, seed, bars=4):
    """Clear glass in small panes: the sky in it, dark above where the
    reveal shades it, a streak of light."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if not inside(x, y):
                continue
            a, b = x - x0, y - y0
            col = CLEAR[4] if b < h * 0.4 else CLEAR[3]
            if (a + b) % 13 in (4, 5) and b > 2:
                col = CLEAR[2]
            if a % bars == bars - 1 or b % (bars + 1) == bars:
                col = mix(CLEAR[6], (230, 226, 216, 255), 0.5)
            c.p(x, y, col)


# ------------------------------------------------------------------ windows

def surround(c, x0, top, w, h, shape, r, depth=3):
    """A moulded surround and its reveal: the frame lit on its upper left,
    the reveal shadowed on the same side, as the wall is thick."""
    spring = top + apex(shape, w)
    f = SHAPES[shape]
    for yy in range(top - depth - 2, top + h + 1):
        for xx in range(x0 - depth, x0 + w + depth):
            if f(xx, yy, x0 - depth, spring, w + 2 * depth) and not f(xx, yy, x0, spring, w):
                col = r[1] if xx < x0 + w // 2 else r[3]
                if yy >= top + h:
                    col = r[2]
                c.p(xx, yy, col)
    return spring


def sill(c, x0, w, y, r):
    c.rect(x0 - 4, y, w + 8, 1, r[0])
    c.rect(x0 - 4, y + 1, w + 8, 2, r[2])
    c.rect(x0 - 4, y + 3, w + 8, 1, r[4])
    cast_down(c, x0 - 3, x0 + w + 4, y + 4, 2)


def hood(c, x0, top, w, shape, r):
    """A hood mould over the head, its ends turned down on carved stops."""
    f = SHAPES[shape]
    spring = top + apex(shape, w)
    for yy in range(top - 9, spring + 2):
        for xx in range(x0 - 6, x0 + w + 6):
            if f(xx, yy, x0 - 6, spring + 1, w + 12) and not f(xx, yy, x0 - 4, spring + 1, w + 8):
                c.p(xx, yy, r[0] if xx < x0 + w // 2 else r[2])
    for sx in (x0 - 6, x0 + w + 3):
        raised(c, sx, spring + 1, 3, 3, r, 1)


def window(c, kind, cx, y, w, h, r, seed=0, glass='stained'):
    """Draw a window of `kind` centred on cx with its head at y. Kinds:
    lancet, tracery, perpendicular, roundhead, oculus, rose, baroque,
    shuttered, lunette, mullion."""
    x0 = cx - w // 2
    fill = stained if glass == 'stained' else clear
    if kind == 'lancet':
        spring = surround(c, x0, y, w, h, 'pointed', r)
        fill(c, x0, y, w, h, lambda xx, yy: pointed(xx, yy, x0, spring, w), seed)
        hood(c, x0, y, w, 'pointed', r)
    elif kind in ('tracery', 'perpendicular'):
        lights = 2 if kind == 'tracery' else 3
        shape = 'pointed' if kind == 'tracery' else 'pointed'
        spring = surround(c, x0, y, w, h, shape, r)
        fill(c, x0, y, w, h, lambda xx, yy: pointed(xx, yy, x0, spring, w), seed)
        lw = (w - (lights - 1)) // lights
        for k in range(1, lights):
            mx = x0 + k * (lw + 1) - 1
            top = y if kind == 'perpendicular' else spring - 4
            for yy in range(top, y + h):
                if pointed(mx, yy, x0, spring, w):
                    c.p(mx, yy, r[1]); c.p(mx + 1, yy, r[3])
        if kind == 'perpendicular':
            for ty in (spring + (y + h - spring) // 3, spring - 2):
                for xx in range(x0, x0 + w):
                    if pointed(xx, ty, x0, spring, w):
                        c.p(xx, ty, r[1])
        else:
            for k in range(lights):
                lx = x0 + k * (lw + 1)
                sp = spring - 1
                for xx in range(lx, lx + lw + 1):
                    for yy in range(sp - lw, sp + 1):
                        if pointed(xx, yy, lx, sp, lw + 1) and not pointed(xx, yy, lx + 1, sp + 1, lw - 1):
                            c.p(xx, yy, r[1] if xx < lx + lw // 2 else r[3])
            rcx, rcy, rr = cx - 0.5, spring - lw - 2, max(2, w // 6)
            for yy in range(int(rcy - rr - 1), int(rcy + rr + 2)):
                for xx in range(int(rcx - rr - 1), int(rcx + rr + 2)):
                    d = math.hypot(xx - rcx, yy - rcy)
                    if rr - 0.6 <= d <= rr + 0.6 and pointed(xx, yy, x0, spring, w):
                        c.p(xx, yy, r[1] if xx + yy < rcx + rcy else r[3])
        hood(c, x0, y, w, 'pointed', r)
    elif kind == 'roundhead':
        spring = y + w // 2
        ow = w + 8
        for yy in range(y - 4, y + h + 1):
            for xx in range(x0 - 4, x0 + w + 4):
                if rounded(xx, yy, x0 - 4, spring, ow) and not rounded(xx, yy, x0, spring, w):
                    col = r[3] if xx < cx else r[2]
                    if xx < x0 - 2 or yy < y - 2:
                        col = r[4] if xx < cx else r[3]
                    c.p(xx, yy, col)
        fill(c, x0, y, w, h, lambda xx, yy: rounded(xx, yy, x0, spring, w), seed)
        for a in range(0, 181, 18):
            t = math.radians(a)
            for k in range(w // 2 + 4, w // 2 + 7):
                c.p(cx - 0.5 + math.cos(t) * k, spring - math.sin(t) * k, r[1] if (a // 18) % 2 else r[2])
    elif kind in ('oculus', 'rose'):
        R = w // 2
        cy = y + R
        for yy in range(y - 4, y + w + 5):
            for xx in range(x0 - 4, x0 + w + 5):
                d = math.hypot(xx - (cx - 0.5), yy - cy)
                if d <= R:
                    if kind == 'rose':
                        ang = math.atan2(yy - cy, xx - (cx - 0.5))
                        spoke = abs(((ang * 12 / math.pi) % 2) - 1) < 0.18
                        ring = abs(d - R * 0.45) < 0.8 or d < 2.5
                        if spoke or ring:
                            c.p(xx, yy, r[1] if xx + yy < cx + cy else r[3])
                            continue
                        g = GLASS_INK[int(h2(int(ang * 4), int(d // 4), 77 + seed) * 5)]
                        c.p(xx, yy, g[3] if d > R * 0.5 else g[2])
                    else:
                        c.p(xx, yy, CLEAR[4] if xx + yy < cx + cy - 2 else CLEAR[5])
                elif d <= R + 3.5:
                    c.p(xx, yy, r[0] if xx + yy < cx + cy else r[3])
    elif kind == 'baroque':
        # a tall segmental-headed window in a moulded architrave with ears,
        # a keystone and an apron below
        spring = surround(c, x0, y, w, h, 'segmental', r, 4)
        fill(c, x0, y, w, h, lambda xx, yy: segmental(xx, yy, x0, spring, w), seed)
        for k in range(1, 3):
            c.rect(x0 + 1, y + k * h // 3, w - 2, 1, mix(CLEAR[6], (230, 226, 216, 255), 0.6))
        c.rect(cx - 1, y + 1, 2, h - 1, mix(CLEAR[6], (230, 226, 216, 255), 0.6))
        for ex in (x0 - 6, x0 + w + 2):
            raised(c, ex, y - 4, 4, 5, r, 1)
        raised(c, cx - 3, y - 7, 6, 8, r, 1)
        raised(c, x0 - 2, y + h + 4, w + 4, 5, r, 1)
    elif kind == 'shuttered':
        # a small southern window: deep plain reveal, iron grille, green
        # shutters folded back
        op.open_shutters(c, x0 - 1, y - 2, w + 2, h + 4, 'green', 5)
        for yy in range(y, y + h):
            for xx in range(x0, x0 + w):
                c.p(xx, yy, VOID if (xx - x0) > 1 and (yy - y) > 1 else mix(r[3], DARK, 0.4))
        for xx in range(x0 + 1, x0 + w, 3):
            c.rect(xx, y, 1, h, op.IRON[3])
        for yy in range(y + 2, y + h, 5):
            c.rect(x0, yy, w, 1, op.IRON[3])
        sill(c, x0, w, y + h, r)
    elif kind == 'lunette':
        spring = y + w // 2
        surround(c, x0, y, w, w // 2, 'round', r, 3)
        fill(c, x0, y, w, w // 2, lambda xx, yy: rounded(xx, yy, x0, spring, w) and yy < spring, seed)
        for k in (1, 2):
            c.rect(x0 + k * w // 3, y + 2, 2, w // 2 - 2, r[1])
        c.rect(x0 - 3, spring, w + 6, 2, r[1])
    elif kind == 'mullion':
        lights = max(2, w // 9)
        op.mullion_window(c, x0, y, lights, (w - 3 * (lights - 1)) // lights, h, True, r)
        return
    if kind not in ('oculus', 'rose', 'shuttered', 'lunette'):
        sill(c, x0, w, y + h, r)


# ------------------------------------------------------------------ walls

def wall(c, x, y, w, h, kind, r=None):
    r = r or STONE.get(kind, RAMPS['grey-limestone'])
    if kind == 'flint':
        fm.flint(c, x, y, w, h)
    elif kind in ('sandstone', 'red-sandstone'):
        fm.ashlar(c, x, y, w, h, r, 8, 16)
    elif kind == 'granite':
        fm.rubble(c, x, y, w, h, r)
    elif kind == 'brick':
        fm.brick(c, x, y, w, h)
    elif kind in ('render', 'whitewash', 'ochre', 'pink'):
        fm.render(c, x, y, w, h, r)
    elif kind == 'boards':
        fm.boards(c, x, y, w, h, RAMPS['cedar'])
    elif kind == 'tar':
        fm.boards(c, x, y, w, h, STONE['tar'])
    elif kind == 'striped':
        # Tuscan banded marble: courses of white and dark green-grey
        dark = ramp(160, 0.025, lift=-0.28)
        for yy in range(y, y + h):
            band = (yy - y) // 7 % 3 == 2
            fm.ashlar(c, x, yy, w, 1, dark if band else RAMPS['grey-limestone'], 7, 18)
    else:
        fm.ashlar(c, x, y, w, h, r, 7, 18)


def buttress(c, x, top, base, r, w=8, pinnacle=False):
    off = top + (base - top) // 2
    raised(c, x - 1, off + 4, w + 2, base - off - 4, r, 1)
    raised(c, x, top + 6, w, off - top - 2, r, 1)
    for k, idx in enumerate((0, 1, 2)):
        c.rect(x - 1, off + 1 + k, w + 2, 1, r[idx])
        c.rect(x, top + 3 + k, w, 1, r[idx])
    if pinnacle:
        for k in range(10):
            half = max(0, 3 - k // 3)
            c.rect(x + w // 2 - half, top - 7 + k, 2 * half + 1, 1, r[1] if k < 8 else r[2])
    cast_right(c, x + w + 1, off + 4, base - 2, 4)
    cast_right(c, x + w, top + 6, off + 2, 3)


def lesene(c, x, top, base, r, w=5):
    """A pilaster strip, flat and only just proud of the wall."""
    raised(c, x, top, w, base - top, r, 1)
    cast_right(c, x + w, top, base, 2, 0.22)


def plinth(c, x, y, w, r):
    c.rect(x - 2, y, w + 4, 2, r[0])
    c.rect(x - 2, y + 2, w + 4, 4, r[2])
    c.rect(x - 2, y + 6, w + 4, 1, r[4])


def string_course(c, x, y, w, r):
    c.rect(x - 1, y, w + 2, 1, r[0])
    c.rect(x - 1, y + 1, w + 2, 2, r[2])
    cast_down(c, x, x + w, y + 3, 2, 0.3)


def corbel_table(c, x0, x1, y, r):
    """Little round arches on corbels under the eaves: the Romanesque frieze."""
    for x in range(x0 + 2, x1 - 6, 7):
        for a in range(0, 181, 30):
            t = math.radians(a)
            c.p(x + 3 + round(math.cos(t) * 3), y + 3 - round(math.sin(t) * 2), r[3])
        raised(c, x, y + 3, 2, 3, r, 1)
    cast_down(c, x0, x1, y + 6, 2, 0.25)


def parapet(c, x, y, w, r, kind='crenel'):
    """A parapet on the wall head: battlements, a plain coping, or the
    swallow-tail merlons of an Italian commune."""
    c.rect(x - 2, y - 2, w + 4, 3, r[0])
    c.rect(x - 2, y + 1, w + 4, 2, r[2])
    cast_down(c, x, x + w, y + 3, 3, 0.4)
    if kind == 'plain':
        raised(c, x - 2, y - 7, w + 4, 6, r, 1)
        return
    for mx in range(x - 2, x + w + 2, 7):
        raised(c, mx, y - 10, 5, 8, r, 1)
        c.rect(mx, y - 10, 5, 1, r[0])
        if kind == 'swallowtail':
            c.p(mx + 2, y - 10, (0, 0, 0, 0)); c.p(mx + 2, y - 9, (0, 0, 0, 0))
            c.p(mx, y - 11, r[0]); c.p(mx + 4, y - 11, r[2])


# ------------------------------------------------------------------ roofs

def roof_band(c, L, R, eave, rise, cover, tone, hip=0.0, cresting=False):
    """A roof slope facing us: courses across, lit toward the eave and
    duller toward the ridge, fascia and shadow under it, a ridge on top."""
    paint = COVER.get(cover, COVER['plain'])[0] if cover not in ('lead', 'copper') else None
    r = tone
    top = eave - rise
    px = set()
    for y in range(top, eave + 3):
        k = y - top
        ins = round((rise - k) * hip)
        a, b = L + ins, R - ins
        if b <= a:
            continue
        if paint is None:
            for x in range(a, b):
                lx = (x - L) % 12
                col = r[3] if lx > 1 else r[2] if lx == 0 else mix(r[3], r[4], 0.6)
                if (y - top) % 30 == 29:
                    col = mix(col, r[5], 0.5)
                c.p(x, y, col)
        else:
            try:
                paint(c, a, y, b - a, 1, r)
            except TypeError:
                paint(c, a, y, b - a, 1)
        for x in range(a, b):
            px.add((x, y))
            t = k / max(1, rise)
            if t < 0.3:
                shade(c, x, y, 0.13)
            elif t > 0.72:
                shade(c, x, y, 0.06, LIGHT)
        if hip:
            for x in range(b - max(1, ins // 2), b):
                shade(c, x, y, 0.22)
    for x in range(L, R):
        for k, idx in enumerate((5, 3, 4, 6)):
            c.p(x, eave + 2 + k, OAK[idx] if paint is not None else r[min(7, idx)])
    cast_down(c, L + 3, R - 3, eave + 6, 5, 0.42)
    cap = ramp(258, 0.025, lift=-0.1) if cover in ('slate', 'lead') else r if cover == 'copper' else [mix(q, (120, 40, 30, 255), 0.12) for q in r]
    ins = round(rise * hip)
    for x in range(L + ins - 1, R - ins + 1):
        for k, idx in enumerate((4, 2, 1, 2, 3, 5)):
            c.p(x, top - 3 + k, cap[idx] if (x - L) % 10 != 9 else cap[min(7, idx + 2)])
        if cresting and (x - L) % 6 == 0:
            c.rect(x, top - 7, 1, 4, op.IRON[3]); c.p(x, top - 8, op.IRON[2])
    return px, top


def tone_for(cover, tone):
    if tone:
        return TONES[tone] if isinstance(tone, str) else tone
    return {'lead': RAMPS['lead'], 'copper': COPPER, 'slate': TONES['slate-blue'], 'plain': TONES['tile-red'],
            'pantile': TONES['pantile'], 'thatch': TONES['straw'], 'shingle': TONES['shingle']}.get(cover, TONES['tile-red'])


# ------------------------------------------------------------------ gables

def gable(c, cx, foot, w, rise, kind, r, coping='stone', roof_tone=None, depth=10, roof_px=None):
    """A gable wall square to us: the triangle (or its stepped or curved
    profile), its coping, and the roof behind it running back `depth` px.
    Copings: stone, crow (crow-stepped), neck (Dutch neck gable), barge
    (timber bargeboards), none."""
    top = foot - rise
    if coping in ('crow', 'neck'):
        steps = 5
        for k in range(steps + 1):
            inset = k * (w // 2 - 5) // steps
            y0 = foot - k * rise // steps
            if coping == 'neck' and k < 3:
                continue
            wall(c, cx - w // 2 + inset, y0 - rise // steps, w - 2 * inset, rise // steps + 1, kind, r if kind != 'brick' else None)
            c.rect(cx - w // 2 + inset - 1, y0 - rise // steps - 2, w - 2 * inset + 2, 2, RAMPS['limestone'][0])
            c.rect(cx - w // 2 + inset - 1, y0 - rise // steps, w - 2 * inset + 2, 1, RAMPS['limestone'][2])
        if coping == 'neck':
            nw = w // 2 + 6
            y0 = foot - 3 * rise // steps
            wall(c, cx - w // 2, y0, w, rise * 3 // steps, kind, r if kind != 'brick' else None)
            for side in (-1, 1):
                for k in range(12):
                    t = k / 11
                    xx = cx + side * (nw // 2 + round((w // 2 - nw // 2) * (1 - math.sin(t * math.pi / 2))))
                    c.p(xx, y0 - 2 + k, RAMPS['limestone'][1])
            wall(c, cx - nw // 2, top, nw, foot - top - 3 * rise // steps, kind, r if kind != 'brick' else None)
            c.rect(cx - nw // 2 - 2, top - 3, nw + 4, 3, RAMPS['limestone'][0])
            for k in range(6):
                c.rect(cx - nw // 2 + 2 + k, top - 4 - k, nw - 4 - 2 * k, 1, RAMPS['limestone'][1 if k < 4 else 2])
        cast_right(c, cx + w // 2, top, foot, 4, 0.4)
        return top
    if roof_tone is not None and depth:
        for i in range(-w // 2 - 3, w // 2 + 4):
            yy = top + round(abs(i) * rise / (w / 2)) - 2
            for d in range(1, depth):
                col = roof_tone[3] if i < 0 else roof_tone[5]
                if (yy - d) % 4 == 0:
                    col = roof_tone[5] if i < 0 else roof_tone[6]
                c.p(cx + i, yy - d, col)
                if roof_px is not None:
                    roof_px.add((cx + i, yy - d))
    for yy in range(top, foot):
        half = (yy - top) * (w / 2) / rise
        wall(c, round(cx - half), yy, round(2 * half), 1, kind, r)
    for i in range(-w // 2 - 3, w // 2 + 4):
        yy = top + round(abs(i) * rise / (w / 2)) - 2
        if coping == 'barge':
            for k, idx in enumerate((2, 3, 3, 5)):
                c.p(cx + i, yy + k, OAK[idx if i < 0 else min(7, idx + 1)])
        elif coping == 'stone':
            for k, idx in enumerate((0, 1, 3)):
                c.p(cx + i, yy + k, r[idx if i < 0 else min(7, idx + 2)])
    if coping != 'none':
        for i in range(-w // 2, w // 2):
            yy = top + round(abs(i) * rise / (w / 2)) + 3
            shade(c, cx + i, yy, 0.3)
    return top


def finial(c, x, y, kind, r=None):
    """What stands on an apex: a cross, a ball, a weathercock."""
    r = r or RAMPS['limestone']
    if kind == 'cross':
        c.rect(x, y - 9, 2, 9, r[1]); c.rect(x - 2, y - 6, 6, 2, r[1])
        c.rect(x + 1, y - 9, 1, 9, r[3])
    elif kind == 'gilt-cross':
        c.rect(x, y - 10, 1, 10, GOLD[2]); c.rect(x - 2, y - 7, 5, 1, GOLD[1]); c.p(x + 1, y - 11, GOLD[0])
    elif kind == 'cock':
        c.rect(x, y - 10, 1, 10, GOLD[2]); c.rect(x - 3, y - 7, 4, 2, GOLD[1]); c.p(x + 1, y - 8, GOLD[0])
    elif kind == 'ball':
        c.rect(x, y - 6, 1, 6, GOLD[2]); c.rect(x - 1, y - 9, 3, 3, GOLD[1]); c.p(x - 1, y - 9, GOLD[0])
    elif kind == 'dragon':
        t = ramp(30, 0.03, lift=-0.4)
        for k in range(8):
            c.p(x + k, y - 2 - k // 2, t[2]); c.p(x + k, y - 1 - k // 2, t[4])
        c.p(x + 8, y - 6, t[2]); c.p(x + 9, y - 7, t[1]); c.p(x + 7, y - 7, t[3])


# ------------------------------------------------------------------ clocks

def clock(c, cx, cy, R=7, r=None):
    r = r or RAMPS['limestone']
    face = ramp(255, 0.06, lift=-0.18)
    for yy in range(-R - 2, R + 3):
        for xx in range(-R - 2, R + 3):
            d = math.hypot(xx, yy)
            if d <= R:
                c.p(cx + xx, cy + yy, face[3] if d > 2 else GOLD[1])
                if abs(d - R + 1.5) < 0.6 and round(math.degrees(math.atan2(yy, xx))) % 30 < 12:
                    c.p(cx + xx, cy + yy, GOLD[1])
            elif d <= R + 2:
                c.p(cx + xx, cy + yy, r[0] if xx + yy < 0 else r[3])
    for i in range(min(5, R - 1)):
        c.p(cx, cy - i, GOLD[0])
    for i in range(min(4, R - 2)):
        c.p(cx + i, cy, GOLD[1])


# ------------------------------------------------------------------ tower tops

def battlements(c, x, top, w, r, pinnacles=True, turret=False):
    parapet(c, x, top, w, r, 'crenel')
    if pinnacles:
        for px in (x - 5, x + w - 2):
            raised(c, px, top - 20, 7, 18, r, 1)
            c.rect(px, top - 21, 7, 1, r[0])
            for k in range(12):
                half = max(0, 3 - k // 3)
                c.rect(px + 3 - half, top - 33 + k, 2 * half + 1, 1, r[1] if k < 9 else r[2])
                c.p(px + 3 + half, top - 33 + k, r[3])
                if k % 3 == 1 and half:
                    c.p(px + 2 - half, top - 33 + k, r[0])
            c.p(px + 3, top - 34, r[0])
            cast_right(c, px + 7, top - 20, top - 2, 2, 0.3)
    if turret:
        # a stair turret at one corner, rising above the parapet with its
        # own little battlement and a vane
        tx = x + w - 12
        raised(c, tx, top - 26, 12, 26, r, 1)
        for yy in range(top - 22, top - 2, 6):
            c.rect(tx + 5, yy, 2, 3, VOID)
        parapet(c, tx, top - 26, 12, r)
        finial(c, tx + 6, top - 38, 'cock')


def spire(c, cx, foot, w, h, tone, kind='broach', roof_px=None):
    """An octagonal spire, two faces toward us, the left lit and the right
    in shade: broaches at its foot, a spire light, a cross. `needle` is the
    slender lead spike of the Baltic and the north."""
    apex_y = foot - h
    for yy in range(apex_y, foot + 1):
        t = (yy - apex_y) / h
        half = w / 2 * t
        for xx in range(round(cx - half), round(cx + half) + 1):
            left = xx < cx
            col = tone[2 if left else 4]
            if (yy - apex_y) % 5 == 4:
                col = tone[4 if left else 6]
            if abs(xx - cx) < 1:
                col = tone[1]
            c.p(xx, yy, col)
            if roof_px is not None:
                roof_px.add((xx, yy))
    if kind == 'broach':
        for side in (-1, 1):
            for k in range(10):
                for j in range(k):
                    c.p(cx + side * (w // 2 - 2 + j - k + 2), foot - 10 + k, tone[2 if side < 0 else 5])
        ly = foot - round(h * 0.35)
        lw = max(3, round(w * 0.16))
        for yy in range(ly - 6, ly + 4):
            for xx in range(cx - lw, cx + lw):
                c.p(xx, yy, VOID if yy > ly - 3 else tone[3])
        for i in range(-lw - 1, lw + 1):
            c.p(cx + i, ly - 6 - (lw - abs(i)) // 2, tone[1])
    finial(c, cx, apex_y, 'gilt-cross')


def pyramid(c, x, top, w, tone, h=34, roof_px=None, kind='pyramid'):
    """A pyramid cap (or a low Italian campanile cap): the face toward us in
    the light, the side face just showing on the right in shade."""
    cx = x + w / 2
    for yy in range(top - h, top + 3):
        t = (yy - (top - h)) / h
        half = (w / 2 + 3) * t
        for xx in range(round(cx - half), round(cx + half)):
            right = xx > cx + half * 0.55
            col = tone[3 if not right else 5]
            if (yy - top) % 5 == 0:
                col = tone[5 if not right else 6]
            c.p(xx, yy, col)
            if roof_px is not None:
                roof_px.add((xx, yy))
    finial(c, round(cx), top - h, 'gilt-cross' if kind == 'pyramid' else 'ball')


def onion(c, cx, foot, w, roof_px=None):
    """A Baroque onion: a bulb of copper, a lantern, a smaller bulb, a cross."""
    t = COPPER

    def bulb(cy, R, hgt):
        for yy in range(cy - hgt, cy + hgt // 2):
            k = (yy - (cy - hgt)) / (hgt * 1.5)
            half = R * math.sin(math.pi * min(1, k * 1.05)) ** 0.7 * (1 if k > 0.15 else k / 0.15)
            for xx in range(round(cx - half), round(cx + half) + 1):
                col = t[1] if xx < cx - half * 0.4 else t[2] if xx < cx + half * 0.3 else t[4]
                c.p(xx, yy, col)
                if roof_px is not None:
                    roof_px.add((xx, yy))
    bulb(foot - 8, w / 2 + 2, 22)
    lw = max(6, w // 3)
    for yy in range(foot - 42, foot - 30):
        for xx in range(cx - lw // 2, cx + lw // 2 + 1):
            c.p(xx, yy, VOID if (xx - cx) % 3 == 0 and foot - 40 < yy < foot - 32 else RAMPS['whitewash'][2])
    bulb(foot - 44, lw / 2 + 1, 12)
    finial(c, cx, foot - 58, 'gilt-cross')


def saddleback(c, x, top, w, tone, rise=22, roof_px=None):
    """A saddleback: a gabled roof across the tower, its slope toward us."""
    px, ridge = roof_band(c, x - 3, x + w + 3, top, rise, 'plain', tone)
    if roof_px is not None:
        roof_px |= px


def wooden_belfry(c, x, top, w, tone, roof_px=None):
    """A boarded timber belfry with louvred openings under a steep spire,
    as on the churches of Scandinavia and the Baltic."""
    bw = w - 6
    bx = x + 3
    for yy in range(top - 22, top + 1):
        for xx in range(bx, bx + bw):
            a = (xx - bx) % 4
            c.p(xx, yy, STONE['tar'][2] if a == 0 else STONE['tar'][3] if a < 3 else STONE['tar'][5])
    for k in range(2):
        lx = bx + 3 + k * (bw // 2)
        for yy in range(top - 18, top - 6):
            for xx in range(lx, lx + bw // 2 - 6):
                c.p(xx, yy, VOID if (yy - top) % 3 else STONE['tar'][2])
    spire(c, x + w // 2, top - 22, w, tone, 'needle', roof_px)
