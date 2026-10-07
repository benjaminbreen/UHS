"""What a shop shows through its open front, from parts any period shares.

    .venv/bin/python scripts/art/front_goods.py artifacts/front-goods.png

A bay is a small room seen in the house projection: its back wall, a strip
of floor, and fittings set at a depth (an oven against the back wall,
shelves, a counter at the front) carrying goods. A Roman bakery and a
medieval one are the same oven and counter with different loaves on them;
a spec names the fittings and the goods.

    bay(c, x, y, w, h, {'back': 'oven', 'counter': ('travertine', 'loaves:quadratus')})
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402

INTERIOR = ramp(32, 0.04, lift=-0.2)
FLOOR = ramp(40, 0.045, lift=-0.14)
FIRE = ramp(55, 0.16)
BREAD = ramp(62, 0.11, lift=0.0)
TOPS = {'travertine': RAMPS['travertine'], 'oak': RAMPS['oak'], 'marble': RAMPS['marble'],
        'brick': RAMPS['roman-brick'], 'stone': RAMPS['granite']}
CLOTH = [ramp(25, 0.13, lift=-0.1), ramp(80, 0.12), ramp(255, 0.08, lift=-0.14), ramp(150, 0.08, lift=-0.12)]
VENEER = [RAMPS['marble'], ramp(140, 0.05, lift=-0.08), ramp(80, 0.1, lift=-0.04), ramp(26, 0.15, lift=-0.13)]
DEPTH = 24


_STEP = {}


def _ramps():
    if not _STEP:
        for r in [*RAMPS.values(), INTERIOR, FLOOR, FIRE, BREAD, pr.CLAY, pr.LEAF, *CLOTH, *VENEER]:
            for i, q in enumerate(r):
                _STEP.setdefault(tuple(q[:3]), (r, i))
    return _STEP


def dim(c, x, y, w, h, steps=1):
    """Darken what stands at the back of a bay by stepping each colour down
    its own ramp, so the shade stays on the value ladder."""
    table = _ramps()
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            q = c.g(xx, yy)
            if q[3] and tuple(q[:3]) in table:
                r, i = table[tuple(q[:3])]
                c.p(xx, yy, r[min(6, max(i, i + steps if i < 6 else i))])


# ------------------------------------------------------------------ goods

def loaves(c, x0, x1, by, z, kind='quadratus'):
    """A row of loaves on a surface: quadratus (the Roman round, scored in
    eight), cob (a medieval round), long, flat (the Near Eastern flatbread)."""
    step = {'long': 12, 'flat': 10}.get(kind, 8)
    for x in range(x0 + 4, x1 - 3, step):
        if kind == 'long':
            for k in range(-4, 5):
                so.sphere(c, x + k, by, z + 2, 2.5, BREAD, squash=0.8)
        elif kind == 'flat':
            so.ellipse(c, x, by - z - 1, 4.5, 2, BREAD[2]); so.ellipse(c, x, by - z - 1.5, 3.5, 1.2, BREAD[1])
        else:
            so.sphere(c, x, by, z + 2.4, 3.4, BREAD, squash=0.7)
            if kind == 'quadratus':
                c.p(x, by - z - 4, BREAD[5]); c.p(x, by - z - 3, BREAD[5])
                c.p(x - 2, by - z - 3, BREAD[4]); c.p(x + 2, by - z - 3, BREAD[4])


def pots_row(c, x0, x1, by, z, kind='jug', r=None):
    r = r or pr.CLAY
    span = {'jug': 8, 'amphora': 12, 'urn': 10, 'flowerpot': 12}.get(kind, 9)
    for i, x in enumerate(range(x0 + 5, x1 - 3, span)):
        pr.pot(c, x, by, kind, r, z0=z, scale=0.8 if kind == 'amphora' else 1.0)


def cloth_bolts(c, x0, x1, by, z):
    for i, x in enumerate(range(x0 + 2, x1 - 5, 6)):
        r = CLOTH[i % len(CLOTH)]
        so.box(c, x, by, 5, 7, 6, r, z0=z)


def sacks(c, x0, x1, by, z=0):
    sack = ramp(70, 0.05, lift=-0.04)
    for x in range(x0 + 6, x1 - 4, 11):
        so.lathe(c, x, by, [(0, 4), (4, 5.5), (9, 5), (11, 3), (12, 1.5)], sack, z0=z)


GOODS = {'loaves': loaves, 'pots': pots_row, 'cloth': cloth_bolts, 'sacks': sacks}


def place(c, x0, x1, by, z, what):
    if not what:
        return
    name, _, arg = what.partition(':')
    fn = GOODS[name]
    if arg:
        fn(c, x0, x1, by, z, arg)
    else:
        fn(c, x0, x1, by, z)


# ------------------------------------------------------------------ fittings

def oven(c, cx, by, R=12, r=None):
    """A domed bread oven against the back wall, its mouth glowing."""
    r = r or RAMPS['roman-brick']
    so.box(c, cx - R - 2, by, 2 * R + 4, 8, R, r)
    so.dome(c, cx, by - 8, R, r, kind='beehive', courses=3)
    mw, mh = R, 7
    for yy in range(by - 8 - mh, by - 8):
        for xx in range(cx - mw // 2, cx + mw // 2):
            t = math.hypot((xx + 0.5 - cx) / (mw / 2), (yy + 0.5 - (by - 8)) / mh)
            if t < 1:
                c.p(xx, yy, FIRE[1] if t < 0.45 else FIRE[3] if t < 0.75 else FIRE[5])


def counter(c, x, by, w, top='travertine', d=10, h=14, veneer=False, dolia=0):
    """A counter at the front of the bay: its face (plain, or faced in marble
    offcuts as a thermopolium's was) and its top, the dolia's mouths sunk in
    it. Returns the z of its top."""
    r = TOPS[top]

    def face(c, x0, y0, w0, h0):
        for yy in range(y0, y0 + h0):
            for xx in range(x0, x0 + w0):
                if veneer:
                    i, j = (xx + (yy // 6) * 4) // 8, yy // 6
                    k = h2(i, j, 9)
                    p = VENEER[0] if k < 0.6 else VENEER[1 + int((k - 0.6) / 0.4 * 3) % 3]
                    edge = (xx + (yy // 6) * 4) % 8 == 0 or yy % 6 == 0
                    c.p(xx, yy, p[4] if edge else p[2])
                else:
                    c.p(xx, yy, r[3] if (yy - y0) % 6 else r[4])
    so.box(c, x, by, w, h, d, face, r)
    for i in range(dolia):
        cx = x + 8 + i * ((w - 16) // max(1, dolia - 1))
        so.ellipse(c, cx, by - h - d * so.K / 2, 4, 1.8, pr.CLAY[5])
        so.ellipse(c, cx, by - h - d * so.K / 2 + 0.4, 3, 1.1, (34, 24, 30, 255))
    return h


def shelf(c, x, by, w, z, r=None, d=6):
    r = r or RAMPS['oak']
    so.box(c, x, by, w, 2, d, r, z0=z)
    return z + 2


def rack(c, x, by, w, kind='amphora'):
    """Amphorae stood in a rack against the back wall."""
    pots_row(c, x, x + w, by, 0, kind)
    c.rect(x, by - 18, w, 1, RAMPS['oak'][3]); c.rect(x, by - 17, w, 1, RAMPS['oak'][5])


# ------------------------------------------------------------------ the bay

def bay(c, x, y, w, h, spec):
    """Fill an open shopfront's interior (x, y, w, h; boards excluded). Spec
    keys: back ('oven', 'shelves', 'rack', None), shelf (goods on the
    shelves), counter (top material and goods on it, e.g. ('travertine',
    'loaves:quadratus')), veneer, dolia, floor (goods stood on the floor)."""
    floor_h = round(DEPTH * so.K)
    back_by = y + h - floor_h
    for yy in range(y, back_by):
        for xx in range(x, x + w):
            c.p(xx, yy, INTERIOR[5] if (yy - y) % 9 else INTERIOR[6])
    for yy in range(back_by, y + h):
        for xx in range(x, x + w):
            c.p(xx, yy, FLOOR[4] if (xx + (yy // 3) * 5) % 11 else FLOOR[5])
    back = spec.get('back')
    if back == 'oven':
        oven(c, x + w // 3 if spec.get('counter_side') == 'right' else x + w * 2 // 3, back_by + 2)
    elif back == 'shelves':
        for z in (5, 16):
            shelf(c, x + 1, back_by + 2, w - 2, z)
            place(c, x + 1, x + w - 1, back_by + 2 - 3, z + 2, spec.get('shelf'))
    elif back == 'rack':
        rack(c, x + 1, back_by + 2, w - 2, spec.get('rack', 'amphora'))
    dim(c, x, y, w, back_by + 4 - y)
    if spec.get('floor'):
        place(c, x + 1, x + w // 2, y + h - 2, 0, spec['floor'])
    if spec.get('counter'):
        top, goods = spec['counter'] if isinstance(spec['counter'], tuple) else (spec['counter'], None)
        cw = spec.get('counter_w', w - 2)
        cx0 = x + 1 if spec.get('counter_side', 'left') == 'left' else x + w - 1 - cw
        ch = counter(c, cx0, y + h, cw, top, veneer=spec.get('veneer', False), dolia=spec.get('dolia', 0))
        place(c, cx0 + 1, cx0 + cw - 1, y + h - 5, ch, goods)
    dim(c, x, y, w, 2)


SPECS = {
    'Roman bakery': {'back': 'oven', 'counter': ('travertine', 'loaves:quadratus'), 'counter_w': 22,
                     'counter_side': 'right'},
    'medieval bakery': {'back': 'oven', 'counter': ('oak', 'loaves:cob'), 'counter_w': 22},
    'thermopolium': {'back': 'shelves', 'shelf': 'pots:jug', 'counter': 'marble', 'veneer': True, 'dolia': 3},
    'wine shop': {'back': 'rack', 'counter': ('oak', 'pots:jug'), 'counter_w': 20, 'counter_side': 'right'},
    'draper': {'back': 'shelves', 'shelf': 'cloth', 'counter': ('oak', 'cloth'), 'counter_w': 26},
    'grain': {'back': 'shelves', 'shelf': 'pots:urn', 'floor': 'sacks'},
}


def make(out, zoom=3):
    from PIL import Image, ImageDraw, ImageFont
    from art.front_kit import outline
    from art import front_openings as op
    bw, bh, gap = 46, 46, 16
    W = len(SPECS) * (bw + 17 + gap) + gap
    H = bh + 20
    c = C(W, H)
    for i, spec in enumerate(SPECS.values()):
        x = gap + i * (bw + 17 + gap)
        op.shopfront_open(c, x, 10, bw + 17, bh)
        bay(c, x, 10, bw, bh, spec)
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    bg.alpha_composite(c.im)
    bg = bg.resize((W * zoom, H * zoom), Image.NEAREST)
    d = ImageDraw.Draw(bg)
    font = ImageFont.load_default(size=15)
    for i, name in enumerate(SPECS):
        d.text(((gap + i * (bw + 17 + gap)) * zoom, 0), name, font=font, fill=(60, 50, 60))
    bg.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-goods.png')
