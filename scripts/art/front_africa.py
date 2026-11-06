"""Houses of West and Central Africa, and the Haitian kay that grew from them.

    .venv/bin/python scripts/art/front_africa.py artifacts/front-africa.png

Kongo (c. 1500): a rectangular house of palm-rib and raffia mats lashed to a
pole frame under a steep grass roof, no windows, one low door, as Kongo
houses appear in the seventeenth-century accounts and drawings.
Haitian kay (nineteenth century): wattle daubed and limewashed, white or a
pale wash, a hipped thatch roof carried forward over a gallery on posts,
board shutters painted, an earth platform underfoot.
Sahel (Timbuktu, Djenne, from the fourteenth century): banco, mud brick
plastered with mud, a flat roof behind its parapet, buttresses rising to
pinnacles, palm-wood toron left standing out of the wall for replastering.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art import front_persian as pz  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel  # noqa: E402
from art import front_parts as fp  # noqa: E402

MATS = ramp(66, 0.07, lift=-0.02)
POLE = ramp(42, 0.07, lift=-0.2)
GRASS = ramp(68, 0.07, lift=-0.03)
WASHES = {'white': RAMPS['whitewash'], 'blue': ramp(225, 0.03, lift=0.05),
          'pink': ramp(22, 0.035, lift=0.05), 'ochre': ramp(78, 0.055, lift=0.03)}
BANCO = ramp(52, 0.075, lift=-0.05)
BANCO_TOP = ramp(56, 0.065, lift=0.02)


def mat_wall(c, x0, y0, w, h):
    """Mats of split palm rib woven in a twill, lashed to poles: panels
    between the posts, a binding lath across each."""
    posts = list(range(x0, x0 + w - 3, max(18, w // max(1, round(w / 22)))))[1:]
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            lx, ly = xx - x0, yy - y0
            cell = (lx // 4 + ly // 3) % 4
            over = cell < 2
            col = MATS[2 if over else 4]
            if over and ly % 3 == 0:
                col = MATS[1]
            if not over and lx % 4 == 3:
                col = MATS[5]
            c.p(xx, yy, col)
    for ly in range(8, h - 6, 15):
        c.rect(x0, y0 + ly, w, 1, POLE[2]); c.rect(x0, y0 + ly + 1, w, 1, POLE[4])
    for px in [x0] + posts + [x0 + w - 4]:
        bevel(c, px, y0, 4, h, POLE, 3)


def wash_wall(tint):
    def paint(c, x, y, w, h):
        fm.whitewash(c, x, y, w, h, WASHES[tint])
    return paint


for _k in WASHES:
    ev.WALL[f'wash-{_k}'] = wash_wall(_k)
ev.WALL['mats'] = mat_wall
ev.TONES['grass'] = GRASS


def mat_door(c, x, y, w, h):
    """A door of palm ribs laid side by side and lashed across, hung inside a
    pole surround."""
    bevel(c, x - 4, y - 4, w + 8, 4, POLE, 3)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a = (xx - x) % 3
            c.p(xx, yy, MATS[4] if a == 0 else MATS[5] if a == 1 else MATS[7])
    for ly in (y + 7, y + h - 9):
        c.rect(x, ly, w, 2, POLE[3]); c.rect(x, ly, w, 1, POLE[2])
    for px in (x - 4, x + w):
        bevel(c, px, y - 4, 4, h + 4, POLE, 3)
    op.reveal(c, x, y, w, h, 3)


def kongo_openings(h):
    """No windows: one low door, a little off centre on most houses."""
    cx = h.x0 + round(h.W * (0.5 if h.s['seed'] % 3 == 0 else 0.38))
    h.door_x, h.door_h = cx, 40
    mat_door(h.c, cx - 10, h.base - 40, 20, 40)


ev.OPENINGS['kongo'] = kongo_openings


def _built(s, info):
    h = ev.VernacularHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


def kongo(spec=None, info=None):
    s = dict(W=124, storeys=['mats'], heights=[44], roof='thatch', tone='grass', hip=False, openings='kongo', seed=0)
    s.update(spec or {})
    return _built(s, info)


def kay(spec=None, info=None):
    s = dict(W=150, storeys=['wash-white'], heights=[50], roof='thatch', tone='straw-old', hip=True,
             windows=('painted', 'boards'), joinery='blue', door='panel', door_paint='blue', gallery=True, seed=1,
             wear=0.05)
    s.update(spec or {})
    return _built(s, info)


# ------------------------------------------------------------------ Sahel

def toron(c, L, R, y, step=12, skip=()):
    """Palm-wood beams left standing out of the wall for the replasterers:
    each shows its lit end and top and throws a short shadow down the wall."""
    for xx in range(L + 6 + (y % 2) * (step // 2), R - 6, step):
        if any(a <= xx <= b for a, b in skip):
            continue
        c.rect(xx, y, 3, 3, POLE[3]); c.rect(xx, y, 3, 1, POLE[1]); c.p(xx, y + 1, POLE[2])
        c.rect(xx + 3, y + 1, 1, 2, POLE[5])
        op.cast(c, xx + 1, y + 3, 4, 3, 0.68)


def pinnacle(c, cx, foot, w, h):
    """A rounded banco cone standing on a buttress or a parapet."""
    for k in range(h):
        t = k / max(1, h - 1)
        half = max(1, round(w / 2 * min(1, (t * 1.6) ** 0.6)))
        for i in range(-half, half):
            q = 1 if i < -half // 2 else 2 if i < half // 3 else 4
            c.p(cx + i, foot - h + k, BANCO_TOP[q] if k < 2 else BANCO[q])


def buttress(c, x, top, base, w=12):
    """An engaged buttress, battered: broad at its foot, narrower at its
    head, lit on its left face and shaded on its right, a pinnacle above."""
    for yy in range(top, base):
        t = (yy - top) / max(1, base - top)
        ww = round(w - 3 + 3 * t)
        x0 = x + (w - ww) // 2
        for i in range(ww):
            q = 1 if i < 2 else 2 if i < ww - 3 else 4
            c.p(x0 + i, yy, BANCO[q])
    pinnacle(c, x + w // 2, top + 1, w - 3, 13)
    op.cast(c, x + w, top + 14, 4, base - top - 24, 0.74)


def street_face(c, L, R, E, base, door, n):
    """The Djenne street front: buttresses along it, a raised entrance bay
    over the door with its own pinnacles, toron in rows, a studded door."""
    tw = 40
    tx = door - tw // 2
    xs = [round(L + k * (R - L - 12) / (n - 1)) for k in range(n)]
    for x in xs:
        if x + 12 < tx - 4 or x > tx + tw + 4:
            buttress(c, x, E - 10, base)
    ttop = E - 22
    fm.kahgel(c, tx, ttop, tw, base - ttop, BANCO)
    c.rect(tx, ttop, tw, 2, BANCO_TOP[1]); c.rect(tx, ttop + 2, tw, 1, BANCO[4])
    for x in (tx - 6, tx + tw - 6):
        buttress(c, x, ttop - 2, base)
    pinnacle(c, door, ttop + 1, 8, 10)
    op.cast(c, tx + tw + 6, ttop + 12, 4, base - ttop - 22, 0.72)
    skip = [(x - 2, x + 14) for x in xs] + [(tx - 8, tx + tw + 8)]
    for y in (E + 9, E + 27):
        toron(c, L, R, y, skip=skip)
    toron(c, tx + 4, tx + tw - 2, ttop + 8, 10)
    op.raised(c, door - 15, base - 48, 30, 48, BANCO_TOP, 2)
    op.door_studded(c, door - 11, base - 44, 22, 44, wood=pz.WOOD, studs=RAMPS['granite'])
    so.box(c, door - 18, base + 3, 36, 3, 6, BANCO_TOP)


def sahel(spec=None, info=None):
    """A banco house on the street: a flat roof behind its parapet, the
    Djenne front of buttresses, pinnacles and toron."""
    s = {**dict(W=140, posts=4, door=0.5), **(spec or {})}

    def extra(c, g):
        street_face(c, g['L'], g['R'], g['E'], g['base'], g['door'], s['posts'])
    with pz.materials(WALL=BANCO, TOP=BANCO_TOP, PAVE=ramp(52, 0.05, lift=-0.06), WALL_FN=None, BRICK=BANCO):
        im = pz.house({**s, 'extra': extra, 'dome': False}, info)
    if info is not None:
        info['door_h'] = 44
    return im


def sahel_court(spec=None, info=None):
    """A larger banco house round a court of packed sand: the same street
    face, the far range's doors across the court, a well and a palm."""
    s = {**dict(W=260, wing=50, street=62, front=22, court=86, far=24, face=38, portal=0.42), **(spec or {})}

    def court(c, L, R, top, face_h, front, face=None, trees=True):
        floor = top + face_h + 4
        for yy in range(floor, front):
            for xx in range(L, R):
                c.p(xx, yy, BANCO_TOP[2] if h2(xx // 3, yy // 2, 811) > 0.12 else BANCO_TOP[3])
        fm.kahgel(c, L, top, R - L, face_h, BANCO)
        for i in range(3):
            dx = round(L + (i + 0.5) * (R - L) / 3) - 9
            op.door_plank(c, dx, top + face_h - 30, 18, 30)
        toron(c, L, R, top + 6)
        so.box(c, L, top + face_h + 4, R - L, 3, 8, BANCO_TOP)
        pr.tree(c, L + 28, front - 6, 'palm', 1.0)
        pr.well(c, R - 32, (floor + front) // 2 + 10, BANCO_TOP, R=8)
        pz.court_shade(c, L, R, top, floor, front)

    def roof(c, g):
        for x in (g['L'] + g['wing'] // 2, g['R'] - g['wing'] // 2):
            toron(c, x - 14, x + 14, g['B'] + 12, 9)

    def door(c, x, base, g):
        street_face(c, g['L'], g['R'], g['E'], base, x, max(4, g['W'] // 44))
    with pz.materials(WALL=BANCO, TOP=BANCO_TOP, DOME=BANCO_TOP, PAVE=ramp(52, 0.05, lift=-0.06), WALL_FN=None,
                      BRICK=BANCO):
        im = pz.compound(s, info, roof=roof, door=door, court_fn=court)
    if info is not None:
        info['door_h'] = 44
    return im


# ------------------------------------------------------------------ Swahili coast and Ethiopian highlands

LIME = ramp(88, 0.022, lift=0.035)
LIME_TOP = ramp(84, 0.02, lift=0.06)
CORAL = ramp(72, 0.04, lift=-0.04)
TEAK = ramp(36, 0.065, lift=-0.22)
BRASS = ramp(78, 0.1, lift=-0.04)
MANGROVE = ramp(30, 0.05, lift=-0.24)
DRYSTONE = ramp(62, 0.035, lift=0.02)
CHINK = ramp(40, 0.03, lift=-0.2)
EARTH = ramp(50, 0.05, lift=-0.08)
JUNIPER = ramp(42, 0.06, lift=-0.18)


def face(c, L, R, E, base, paint, wall, top):
    """A street wall under its parapet: the coping's lit lip, the parapet's
    shadow fading down the wall, the foot a little darker."""
    paint(c, L, E, R - L, base - E)
    for xx in range(L, R):
        c.p(xx, E, top[1]); c.p(xx, E + 1, wall[2])
    for k in range(7):
        for xx in range(L, R):
            fp.shade(c, xx, E + 2 + k, 0.36 * (1 - k / 7))
    for k in range(5):
        for xx in range(L, R):
            fp.shade(c, xx, base - 1 - k, 0.12 * (1 - k / 5))


def boriti(c, L, R, y, step=11, skip=()):
    """Mangrove-pole joists through the wall under the parapet: round ends,
    lit upper left, each throwing a short shadow down the lime."""
    for xx in range(L + 7, R - 6, step):
        if any(a <= xx <= b for a, b in skip):
            continue
        for dx, dy, k in ((1, 0, 2), (2, 0, 3), (0, 1, 2), (1, 1, 1), (2, 1, 3), (3, 1, 4),
                          (0, 2, 3), (1, 2, 3), (2, 2, 4), (3, 2, 5), (1, 3, 5), (2, 3, 5)):
            c.p(xx + dx, y + dy, MANGROVE[k])
        op.cast(c, xx + 1, y + 4, 4, 3, 0.7)


def swahili_door(c, cx, base, w=26, h=46):
    """The carved door of the coast: two teak leaves with a centre post and
    rows of brass bosses, in a heavy frame carved in chain and rope bands,
    a lintel carved across and the whole set deep in the lime wall."""
    x, top = cx - w // 2, base - h
    fw = 6
    # The recess in the wall the frame stands in.
    c.rect(x - fw - 4, top - 12, w + 2 * fw + 8, h + 12, LIME[3])
    op.reveal(c, x - fw - 4, top - 12, w + 2 * fw + 8, h + 12, 3)
    # Posts and lintel, carved: a rope of alternating lit and dark beads,
    # a chain of lozenges down the inner band.
    for px in (x - fw, x + w):
        for yy in range(top - 8, base):
            for i in range(fw):
                k = 3
                if i == 0:
                    k = 2
                elif i == fw - 1:
                    k = 5
                elif i in (1, 2):
                    k = 2 if (yy + i) % 3 == 0 else 4
                elif (yy // 3 + i) % 2 == 0:
                    k = 3 if (yy % 6) < 3 else 4
                c.p(px + i, yy, TEAK[k])
    for yy in range(top - 8, top):
        for xx in range(x - fw, x + w + fw):
            k = 2 if yy == top - 8 else 5 if yy == top - 1 else (3 if ((xx - x) // 3 + yy) % 2 else 4)
            c.p(xx, yy, TEAK[k])
    # Leaves.
    m = x + w // 2
    for yy in range(top, base):
        for xx in range(x, x + w):
            a = xx - x if xx < m else xx - m
            lw = m - x
            k = 3 if 1 < a < lw - 1 else 2 if a <= 1 else 5
            if (yy - top) % 12 == 0:
                k = 4
            c.p(xx, yy, TEAK[k])
    for yy in range(top, base):
        c.p(m - 1, yy, TEAK[2]); c.p(m, yy, TEAK[4]); c.p(m + 1, yy, TEAK[5])
    for yy in range(top + 6, base - 3, 6):
        for xx in range(x + 3, x + w - 2, 5):
            if abs(xx - m) > 2:
                c.p(xx, yy, BRASS[1]); c.p(xx + 1, yy, BRASS[3]); c.p(xx, yy + 1, BRASS[4])
    op.reveal(c, x, top, w, h, 3)
    op.cast(c, x - fw, top, w + 2 * fw, 2, 0.7)


def baraza(c, x, w, base):
    """A stone bench built against the wall beside the door, plastered."""
    so.box(c, x, base + 2, w, 9, 7, LIME, LIME_TOP)
    c.rect(x + w - 1, base - 7, 1, 9, LIME[4])
    op.cast(c, x, base + 2, w, 2, 0.75)


def small_window(c, x, y, w, h, wood, wall):
    """A small window deep in a thick wall, closed by a board shutter."""
    c.rect(x - 2, y - 2, w + 4, h + 4, wall[3])
    c.rect(x, y, w, h, wood[4])
    for xx in range(x, x + w, 3):
        c.rect(xx, y, 1, h, wood[5])
    c.rect(x, y, w, 1, wood[2])
    op.reveal(c, x, y, w, h, 2)
    c.rect(x - 3, y + h + 2, w + 6, 1, wall[1])
    op.cast(c, x - 2, y + h + 3, w + 4, 2, 0.72)


PALM = ramp(70, 0.07, lift=-0.06)


def makuti(c, x0, x1, back, front):
    """A roof shelter of coconut-leaf thatch on mangrove posts, seen from
    above: the fronds running back, the shade it throws on the roof."""
    top = back
    eave = front - 14
    for yy in range(eave, front):
        for xx in range(x0 + 3, x1 + 3):
            fp.shade(c, xx, yy, 0.3)
    for px in (x0 + 2, x1 - 4):
        bevel(c, px, eave, 3, front - eave, MANGROVE, 1)
    for yy in range(top, eave):
        for xx in range(x0, x1):
            k = 2 if (xx - x0) % 4 else 3
            if yy == top:
                k = 1
            elif yy >= eave - 2:
                k = 4 if (xx + yy) % 3 else 5
            elif xx < x0 + 2:
                k = 1
            elif xx > x1 - 3:
                k = 4
            c.p(xx, yy, PALM[k])
    for xx in range(x0, x1, 3):
        c.p(xx, eave, PALM[5])


def coral_wall(c, x, y, w, h):
    fm.whitewash(c, x, y, w, h, LIME, CORAL)


def swahili(spec=None, info=None):
    """A coral-stone house of the Swahili towns: coral rag under lime, a flat
    roof of coral concrete on mangrove poles behind a plain parapet, the
    carved door deep in its frame between two stone benches."""
    s = {**dict(W=150, door=0.5, seed=0), **(spec or {})}

    def extra(c, g):
        L, R, E, base, dx = g['L'], g['R'], g['E'], g['base'], g['door']
        face(c, L, R, E, base, coral_wall, LIME, LIME_TOP)
        boriti(c, L, R, E + 6, 11 + s['seed'] % 3, skip=((dx - 22, dx + 22),))
        swahili_door(c, dx, base)
        bw = min(30, (R - L) // 2 - 28)
        if bw > 10:
            baraza(c, dx - 22 - bw, bw, base)
            baraza(c, dx + 23, bw, base)
        if R - L > 120:
            wx = L + 14 if s['seed'] % 2 else R - 26
            small_window(c, wx, E + 16, 10, 12, TEAK, LIME)
        so.box(c, dx - 20, base + 3, 40, 3, 6, LIME_TOP)
        if R - L > 120:
            sx = R - 58 if s['seed'] % 2 == 0 else L + 12
            makuti(c, sx, sx + 46, g['B'] + 10, E - 4)
    with pz.materials(WALL=LIME, TOP=LIME_TOP, PAVE=LIME_TOP, WALL_FN=coral_wall, BRICK=LIME):
        im = pz.house({**s, 'extra': extra, 'dome': False, 'street': 62}, info)
    if info is not None:
        info['door_h'] = 46
    return im


def drystone(c, x0, y0, w, h):
    """Dry-laid stone in courses, dark chinking between, bound every few
    courses by a timber band with its cross-pieces' round ends standing out:
    the 'monkey heads' of Aksum and Debre Damo."""
    fm.rubble(c, x0, y0, w, h, DRYSTONE, CHINK)
    for by in range(y0 + 11, y0 + h - 8, 17):
        c.rect(x0, by, w, 3, JUNIPER[3]); c.rect(x0, by, w, 1, JUNIPER[1]); c.rect(x0, by + 3, w, 1, JUNIPER[6])
        op.cast(c, x0, by + 4, w, 2, 0.72)
        for xx in range(x0 + 5 + (by // 17 % 2) * 6, x0 + w - 8, 14):
            monkey_head(c, xx, by - 2)


HEAD = ('.dddd.', 'dLLmmd', 'dLmmmD', 'dmmmDD', 'dmmDDD', '.DDDD.')


def monkey_head(c, x, y):
    """A round cross-piece end standing out of the band: end grain lit at its
    upper left, a shadow thrown down and right onto the stone."""
    for i in range(7):
        for j in range(4):
            fp.shade(c, x + 2 + i, y + 4 + j, 0.38 if i < 5 else 0.25)
    for j, row in enumerate(HEAD):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y + j, JUNIPER[{'L': 0, 'm': 2, 'D': 5, 'd': 4}[ch]])


def hidmo(spec=None, info=None):
    """A Tigray highland house: drystone walls bound by timber bands, a flat
    roof of packed earth on juniper beams behind a low parapet, a plank door
    in a timber frame and a small shuttered window."""
    s = {**dict(W=140, door=0.38, seed=0), **(spec or {})}

    def extra(c, g):
        L, R, E, base, dx = g['L'], g['R'], g['E'], g['base'], g['door']
        face(c, L, R, E, base, drystone, DRYSTONE, EARTH)
        boriti(c, L, R, E + 5, 12, skip=())
        bevel(c, dx - 15, base - 46, 30, 4, JUNIPER, 2)
        for px in (dx - 15, dx + 11):
            bevel(c, px, base - 42, 4, 42, JUNIPER, 2)
        op.door_plank(c, dx - 10, base - 40, 20, 40)
        wx = R - 30 if s['seed'] % 2 == 0 else L + 16
        if abs(wx - dx) > 30:
            small_window(c, wx, base - 42, 12, 12, JUNIPER, DRYSTONE)
        so.box(c, dx - 16, base + 3, 32, 3, 6, DRYSTONE)
    with pz.materials(WALL=DRYSTONE, TOP=EARTH, PAVE=EARTH, WALL_FN=drystone, BRICK=DRYSTONE):
        im = pz.house({**s, 'extra': extra, 'dome': False, 'street': 58}, info)
    if info is not None:
        info['door_h'] = 40
    return im


BUILDERS = {'kongo': kongo, 'kay': kay, 'sahel': sahel, 'sahel-court': sahel_court, 'swahili': swahili,
            'hidmo': hidmo}
STUDIES = [
    ('kongo', 'kongo', {}),
    ('kongo-hipped', 'kongo', dict(W=160, hip=True, seed=3)),
    ('kongo-small', 'kongo', dict(W=92, seed=5)),
    ('kay', 'kay', {}),
    ('kay-ochre-gable', 'kay', dict(W=128, storeys=['wash-ochre'], hip=False, joinery='green', door_paint='green', seed=4)),
    ('kay-small', 'kay', dict(W=104, storeys=['wash-blue'], gallery=False, seed=7)),
    ('sahel', 'sahel', {}),
    ('sahel-court', 'sahel-court', {}),
    ('swahili', 'swahili', {}),
    ('swahili-small', 'swahili', dict(W=110, seed=1)),
    ('hidmo', 'hidmo', {}),
    ('hidmo-small', 'hidmo', dict(W=100, seed=1)),
]
if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    built = [BUILDERS[kind](spec) for _, kind, spec in STUDIES]
    rows = [built[:3], built[3:6], built[6:8], built[8:]]
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
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-africa.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
