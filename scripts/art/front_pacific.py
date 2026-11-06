"""The Polynesian fare.

    .venv/bin/python scripts/art/front_pacific.py artifacts/front-pacific.png

Society Islands and their neighbours before contact: a house of posts and a
great hipped roof of pandanus or coconut thatch, its ends rounded, its walls
of upright reeds or bamboo set apart so the air moves through, an opening
for a door. The roof is most of the house.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, ramp, h2  # noqa: E402
from art import front_materials as fm  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art.front_kit import finish, consolidate, outline  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel  # noqa: E402

REED = ramp(76, 0.07, lift=0.0)
PANDANUS = ramp(60, 0.06, lift=-0.04)
INSIDE = (46, 34, 42, 255)


def reeds(c, x0, y0, w, h):
    """Upright reeds a finger apart, the dark of the house between them,
    lashed to a rail at mid height."""
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            a = (xx - x0) % 4
            c.p(xx, yy, INSIDE if a == 3 else REED[1] if a == 0 else REED[2] if a == 1 else REED[4])
    for ly in (y0 + 6, y0 + h - 12):
        bevel(c, x0, ly, w, 3, REED, 3)


ev.WALL['reeds'] = reeds
ev.TONES['pandanus'] = PANDANUS


def fare_openings(h):
    """An open doorway: the reeds left out, the house dark inside."""
    c, cx = h.c, h.x0 + h.W // 2
    h.door_x, h.door_h = cx, 40
    c.rect(cx - 11, h.base - 40, 22, 40, INSIDE)
    c.rect(cx - 11, h.base - 3, 22, 3, (70, 54, 56, 255))
    for px in (cx - 15, cx + 11):
        bevel(c, px, h.base - 44, 4, 44, ramp(42, 0.07, lift=-0.2), 2)
    op.cast(c, cx - 11, h.base - 40, 22, 6, 0.6)


ev.OPENINGS['fare'] = fare_openings


def fare(spec=None, info=None):
    s = dict(W=144, storeys=['reeds'], heights=[42], roof='palm', tone='pandanus', hip=True, openings='fare',
             seed=0, wear=0.3)
    s.update(spec or {})
    h = ev.VernacularHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


# ------------------------------------------------------------------ Samoa

SUGARCANE = ramp(66, 0.065, lift=-0.06)
BREADFRUIT = ramp(40, 0.07, lift=-0.18)
BASALT = ramp(255, 0.015, warm=8, cool=14, lift=-0.18)
POLA = ramp(80, 0.07, lift=0.0)
ev.TONES['sugarcane'] = SUGARCANE


def open_sides(c, x0, y0, w, h):
    """No walls: the dark of the house under the roof, its floor of mats
    catching the light at the front, posts of breadfruit wood round the
    edge, and the coconut-leaf blinds (pola) rolled up under the eaves."""
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            c.p(xx, yy, INSIDE)
    for yy in range(y0 + h - 6, y0 + h):
        for xx in range(x0, x0 + w):
            c.p(xx, yy, POLA[3 if (xx - x0) % 3 else 4] if yy > y0 + h - 5 else POLA[5])
    n = max(3, round(w / 24))
    for k in range(n + 1):
        px = round(x0 + k * (w - 5) / n)
        bevel(c, px, y0, 5, h, BREADFRUIT, 2)
    for yy in (y0 + 3, y0 + 7):
        for xx in range(x0, x0 + w):
            c.p(xx, yy, POLA[2]); c.p(xx, yy + 1, POLA[3]); c.p(xx, yy + 2, POLA[5])
    for xx in range(x0 + 10, x0 + w - 6, 22):
        c.rect(xx, y0 + 2, 1, 9, BREADFRUIT[4])


ev.WALL['fale-open'] = open_sides


def fale_openings(h):
    """Open on every side: the way in is anywhere between two posts."""
    h.door_x, h.door_h = h.x0 + h.W // 2, 40


ev.OPENINGS['fale'] = fale_openings


class Fale(ev.VernacularHouse):
    """The fale on its paepae: a platform of basalt stones under the house,
    its top a floor of pebbles, a step up at the front."""

    def __init__(self, spec):
        super().__init__(spec)
        self.ground = self.base + 10
        self.c = C(self.c.w + 8, self.ground + 6)

    def build(self):
        s = self.s
        self.post = ramp(42, 0.07, lift=-0.2)
        self.walls()
        self.openings()
        self.roof()
        x0, x1 = self.x0, self.x0 + self.W
        walls = {(x, y) for y in range(self.eave, self.base) for x in range(x0, x1)}
        weather(self.c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: self.eave, walls=walls,
                             stone=set(), sills=self.sills, chimneys=[]), s['wear'], s['seed'])
        c, g = self.c, self.ground
        fm.rubble(c, x0 - 10, self.base + 1, self.W + 20, g - self.base, BASALT, ramp(250, 0.01, lift=-0.32))
        c.rect(x0 - 10, self.base - 1, self.W + 20, 2, ramp(70, 0.02, lift=0.0)[2])
        c.rect(x0 - 10, self.base - 1, self.W + 20, 1, ramp(70, 0.02, lift=0.0)[1])
        op.cast(c, x0 - 10, self.base + 1, self.W + 20, 3, 0.6)
        so.box(c, self.door_x - 14, g, 28, 5, 5, BASALT)
        self.base = g
        self.roof_span = (x0 - self.over, x1 + self.over)
        self.stacks, self.stack_boxes = [], []
        outline(self.c)
        consolidate(self.c)
        return self.c.im


def fale(spec=None, info=None):
    s = dict(W=150, storeys=['fale-open'], heights=[40], roof='thatch', tone='sugarcane', hip=True,
             openings='fale', seed=0, wear=0.25)
    s.update(spec or {})
    s.setdefault('rise', round(min(70, 32 + s['W'] * 0.22)))
    h = Fale(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h, leaf=False)
    return im


# ------------------------------------------------------------------ Aotearoa

KOKOWAI = ramp(28, 0.13, lift=-0.12)
PAUA = ramp(190, 0.07, lift=0.04)
RAUPO = ramp(70, 0.065, lift=-0.04)
TOETOE = ramp(64, 0.07, lift=-0.1)
TOTARA = ramp(36, 0.07, lift=-0.22)
FACE = ('.ooooo.', 'oLLLLDo', 'oPoLPDo', 'oLLmLDo', 'o.mmm.o', '.o.o.o.')


def carve(c, x, y, pattern, r=KOKOWAI):
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y + j, {'o': r[5], 'L': r[2], 'D': r[4], 'm': r[3], 'P': PAUA[1]}[ch])


def whare(spec=None, info=None):
    """A Maori whare, gable to the front: the bargeboards (maihi) in red
    ochre running down from the carved face at the apex to the corner posts
    (amo), the roof of raupo and toetoe running back from them, and in the
    shade of the deep porch the low front wall with its sliding door and
    small window."""
    s = dict(W=112, seed=0)
    s.update(spec or {})
    W = s['W']
    over, hw = 9, 42
    half = W / 2 + over
    rise = round(half * 0.66)
    D = 22
    c = C(W + 2 * over + 24, D + rise + hw + 22)
    x0 = over + 12
    x1 = x0 + W
    cx = x0 + W // 2
    base = c.h - 5
    eave = base - hw
    apex = eave - rise

    def by(x):
        return round(eave - rise * (1 - abs(x + 0.5 - cx) / half))

    # The roof running back from the bargeboards: the left slope lit, the
    # right in shade, the thatch in courses along the slope.
    for x in range(round(cx - half), round(cx + half)):
        b = by(x)
        for y in range(b - D, b + 2):
            o = b - y
            left = x < cx
            k = 2 if left else 4
            if o % 5 == 0:
                k += 1
            if o >= D - 1:
                k = 1 if left else 3
            if left and abs(x - cx) < 2:
                k = 1
            c.p(x, y, TOETOE[k])
    for y in range(apex - D, apex + 2):
        c.p(cx - 1, y, TOETOE[1]); c.p(cx, y, TOETOE[2]); c.p(cx + 1, y, TOETOE[5])

    # The porch: the front wall set back in its shade, reeds lashed in
    # panels, the floor before it.
    wall_top = {x: by(x) + 5 for x in range(x0, x1)}
    for x in range(x0, x1):
        for y in range(wall_top[x], base + 1):
            a = (x - x0) % 4
            q = RAUPO[2] if a == 0 else RAUPO[3] if a == 1 else RAUPO[4] if a == 2 else RAUPO[6]
            if (y - eave) % 14 == 0:
                q = TOTARA[3]
            c.p(x, y, q)
        for k, t in enumerate((0.55, 0.45, 0.36, 0.28, 0.22, 0.16, 0.1)):
            for y in range(wall_top[x] + k * 3, wall_top[x] + k * 3 + 3):
                fp.shade(c, x, y, t)
    for xx in range(x0, x1):
        for y in range(base - 4, base + 1):
            c.p(xx, y, TOTARA[2] if y == base - 4 else TOTARA[3] if y < base else TOTARA[5])
    # The window high under the porch, the door low beside it.
    side = 1 if s['seed'] % 2 == 0 else -1
    dx = cx - side * round(W * 0.2)
    dw, dh = 16, 38
    c.rect(dx - dw // 2, base - 4 - dh, dw, dh, INSIDE)
    c.rect(dx - dw // 2, base - 4 - dh, 2, dh, (36, 26, 34, 255))
    slide = dx + (dw // 2 - 6 if side > 0 else -dw // 2 - 4)
    bevel(c, slide, base - 4 - dh, 10, dh, TOTARA, 3)
    for px in (dx - dw // 2 - 4, dx + dw // 2):
        bevel(c, px, base - 6 - dh, 4, dh + 2, KOKOWAI, 3)
    bevel(c, dx - dw // 2 - 6, base - 10 - dh, dw + 12, 5, KOKOWAI, 2)
    for xx in range(dx - dw // 2 - 4, dx + dw // 2 + 6, 3):
        c.p(xx, base - 8 - dh, KOKOWAI[5])
    wx = cx + side * round(W * 0.2) - 7
    c.rect(wx - 3, base - 46, 20, 3, KOKOWAI[3]); c.rect(wx - 3, base - 46, 20, 1, KOKOWAI[1])
    c.rect(wx, base - 43, 14, 11, INSIDE)
    bevel(c, wx + (8 if side > 0 else 0), base - 43, 6, 11, TOTARA, 3)
    c.rect(wx - 3, base - 32, 20, 2, TOTARA[2])

    # The bargeboards: broad red boards notched in rows, meeting at the
    # carved face under the apex, fingers at their feet.
    for x in range(round(cx - half), round(cx + half)):
        b = by(x)
        for t in range(6):
            k = 2 if t == 0 else 5 if t == 5 else 3
            if t in (2, 3) and (x // 2) % 2 == 0:
                k = 4 if t == 2 else 2
            c.p(x, b + t, KOKOWAI[k])
    for sgn in (-1, 1):
        ex = round(cx + sgn * half)
        for i in range(7):
            fx = ex + sgn * i - (1 if sgn > 0 else 0)
            c.p(fx, eave, KOKOWAI[2]); c.p(fx, eave + 1, KOKOWAI[4])
            if i % 2 == 0:
                c.p(fx, eave + 2, KOKOWAI[5])
    carve(c, cx - 3, apex + 2, FACE)
    # A small figure stands on the apex.
    fig = ('.ooo.', 'oPLPo', 'oLmDo', '.oDo.', 'oLLDo', 'oLmDo', '.o.o.')
    carve(c, cx - 2, apex - D - 7, fig)
    # The corner posts.
    for px in (x0 - 3, x1 - 4):
        top = by(px) + 5
        for y in range(top, base + 1):
            for i in range(7):
                k = 2 if i < 2 else 5 if i > 5 else 3
                if 1 < i < 6 and (y - top) % 6 in (0, 1):
                    k = 4
                c.p(px + i, y, KOKOWAI[k])
        carve(c, px, top + 1, FACE)
    so.box(c, x0 - 6, base + 3, W + 12, 3, 5, TOTARA)
    finish(c)
    consolidate(c, rare=3)
    if info is not None:
        info.update(x0=x0, W=W, base=base, door_x=dx, door_h=dh, leaf=False)
    return c.im


BUILDERS = {'fare': fare, 'fale': fale, 'whare': whare}
STUDIES = [
    ('fare', 'fare', {}),
    ('fare-small', 'fare', dict(W=100, seed=2)),
    ('fale', 'fale', {}),
    ('fale-small', 'fale', dict(W=104, seed=1)),
    ('whare', 'whare', {}),
    ('whare-small', 'whare', dict(W=90, seed=1)),
]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    ims = [BUILDERS[kind](spec) for _, kind, spec in STUDIES]
    a = current_adult()
    W = sum(i.width + 8 for i in ims) + a.width + 10
    H = max(i.height for i in ims) + 8
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    x = 4
    for im in ims:
        bg.alpha_composite(im, (x, H - 4 - im.height)); x += im.width + 8
    bg.alpha_composite(a, (x, H - 8 - a.height))
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-pacific.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
