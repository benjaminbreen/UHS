"""An eave-front house: the ridge runs along the street and the roof shows as
a band above the wall, seen a little from above. The form behind most
pre-industrial European cottages, farmhouses and town houses.

    .venv/bin/python scripts/art/front_eave.py artifacts/front-eave.png

A house is a spec (see EUROPEAN in front_houses.py): width, storeys and the
wall of each, jetty, roof covering and form (gabled ends or hipped), dormers,
stacks, windows, door, lean-to, wear. Walls, roofs, openings, fixtures and
weathering come from the library; the roof band, its eaves and ridge, and
the dormers are drawn here.
"""
from pathlib import Path
import math
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_fixtures import fixture  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art.front_kit import outline, consolidate  # noqa: E402
from art.front_house import bevel, brace, recess, pot, carve  # noqa: E402

OAK = RAMPS['oak']

# Roof coverings drawn in level courses, as the library swatches are.
COVER = {
    'thatch': (fm.thatch, RAMPS['thatch']),
    'plain': (fm.plain_tiles, RAMPS['clay-tile']),
    'slate': (fm.slate, RAMPS['slate']),
    'pantile': (fm.pantiles, RAMPS['terracotta']),
    'shingle': (lambda c, x, y, w, h, r=None: fm.shingles(c, x, y, w, h, r, tw=8, th=6, mix_=r is None or r is RAMPS['shingle']), RAMPS['shingle']),
    'imbrex': (fm.imbrex, RAMPS['tegula']),
}
# Historical roof colours, chosen per spec by `tone`. Clays, slates and
# straws differ by region and age more than by anything a painter adds.
TONES = {
    'straw': RAMPS['thatch'],                                   # fresh wheat straw
    'straw-old': ramp(68, 0.045, lift=-0.07),                   # straw greys and browns as it weathers
    'reed': ramp(58, 0.065, lift=-0.05),                        # water reed: darker, browner, East Anglia, Low Countries
    'tile-red': RAMPS['clay-tile'],                             # common red clay tile
    'tile-orange': ramp(50, 0.12),                              # Kent, Sussex, northern France
    'tile-brown': ramp(32, 0.07, lift=-0.12),                   # old peg tile, sooted and lichened
    'tile-black': ramp(258, 0.02, lift=-0.2),                   # glazed black, Flanders and Holland, for the well off
    'slate-blue': ramp(268, 0.035, warm=8, cool=12, lift=-0.08),  # Angers and the Ardennes
    'slate-welsh': ramp(292, 0.045, warm=8, cool=12, lift=-0.06),  # Penrhyn purple-grey
    'slate-green': ramp(165, 0.035, warm=8, cool=12, lift=-0.05),  # Westmorland green
    'stone-slate': ramp(76, 0.04, lift=-0.03),                  # Cotswold and Pennine limestone and sandstone slates
    'pantile': RAMPS['terracotta'],                             # Mediterranean terracotta
    'pantile-pale': ramp(58, 0.08, lift=0.02),                  # sun-bleached southern tile
    'pantile-red': ramp(30, 0.12, lift=-0.05),                  # Low Countries and East Anglian pantile
    'pantile-black': ramp(255, 0.02, lift=-0.18),               # glazed black pantile, Holland
    'shingle': RAMPS['shingle'],                                # new oak or larch shingle
    'shingle-silver': ramp(255, 0.015, lift=-0.02),             # weathered to silver: Alps, Scandinavia, eastern Europe
    'tegula': RAMPS['tegula'],                                  # Roman fired tile, Campania and Latium
    'tegula-pale': ramp(52, 0.09, lift=0.02),                   # a lighter, yellower clay, Ostia and the provinces
}
DEFAULT_TONE = {'thatch': 'straw', 'plain': 'tile-red', 'slate': 'slate-blue', 'pantile': 'pantile', 'shingle': 'shingle',
                'imbrex': 'tegula'}

WALL = {
    'render': lambda c, x, y, w, h: fm.render(c, x, y, w, h),
    'ochre': lambda c, x, y, w, h: fm.render(c, x, y, w, h, RAMPS['plaster-ochre']),
    'whitewash': lambda c, x, y, w, h: fm.whitewash(c, x, y, w, h),
    'brick': lambda c, x, y, w, h: fm.brick(c, x, y, w, h),
    'flemish': lambda c, x, y, w, h: fm.brick(c, x, y, w, h, bond='flemish'),
    'rubble': lambda c, x, y, w, h: fm.rubble(c, x, y, w, h, RAMPS['granite']),
    'ashlar': lambda c, x, y, w, h: fm.ashlar(c, x, y, w, h, RAMPS['limestone']),
    'sandstone': lambda c, x, y, w, h: fm.ashlar(c, x, y, w, h, RAMPS['sandstone'], 8, 16),
    'boards': lambda c, x, y, w, h: fm.clapboard(c, x, y, w, h),
    'falu': lambda c, x, y, w, h: fm.boards(c, x, y, w, h, fm.ramp(26, 0.13, lift=-0.1)),
    'tar': lambda c, x, y, w, h: fm.boards(c, x, y, w, h, fm.ramp(32, 0.06, lift=-0.27)),
    'testaceum': lambda c, x, y, w, h: fm.testaceum(c, x, y, w, h),
    'reticulatum': lambda c, x, y, w, h: fm.reticulatum(c, x, y, w, h),
    'stucco': lambda c, x, y, w, h: fm.stucco(c, x, y, w, h),
    'stucco-ochre': lambda c, x, y, w, h: fm.stucco(c, x, y, w, h, RAMPS['plaster-ochre']),
    'kahgel': lambda c, x, y, w, h: fm.kahgel(c, x, y, w, h),
}


ANTEFIX = ('.ooo.', 'oLmLo', 'oLLLo', '.oDo.', '..o..')


def antefix(c, x, foot, r):
    """A terracotta palmette standing on the eave at the foot of each imbrex
    row, as Greek and Roman roofs end."""
    for j, row in enumerate(ANTEFIX):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x - 2 + i, foot - 5 + j, {'o': r[5], 'L': r[1], 'm': r[3], 'D': r[3]}[ch])


def mix_ramp(r):
    """Ridge tiles are bedded in mortar and a shade richer than the field."""
    return [mix(q, (120, 40, 30, 255), 0.12) for q in r]


class EaveHouse:
    def __init__(self, spec):
        s = dict(W=140, storeys=['render'], heights=None, jetty=False, frame=False, roof='plain', hip=False,
                 rise=None, dormers=0, dormer='gable', stacks='ends', windows=('timber', 'leaded'),
                 shutters=None, boxes=False, door='plank', lean_to=False, plinth='rubble', quoins=False,
                 wear=0.5, seed=0, sign=None, lantern=None, string=False, tone=None, shop=False)
        s.update(spec)
        self.s = s
        n = len(s['storeys'])
        self.heights = s['heights'] or ([50] if n == 1 else [56] + [46] * (n - 1))
        # A roof's depth follows the frontage: a small house carries a small
        # roof, never one taller than its walls.
        full = {'thatch': 74, 'pantile': 44, 'slate': 58, 'plain': 64, 'shingle': 60, 'imbrex': 52}[s['roof']]
        self.rise = s['rise'] or min(full, round(full * (0.42 + 0.58 * min(1.0, s['W'] / 140))))
        self.tone = TONES[s['tone'] or DEFAULT_TONE[s['roof']]]
        self.lean = 40 if s['lean_to'] else 0
        self.x0 = 14 + self.lean
        self.W = s['W']
        self.base = 30 + self.rise + 26 + sum(self.heights)
        self.c = C(self.x0 + self.W + 40, self.base + 6)

    # ---------------------------------------------------------------- walls

    def walls(self):
        c, s = self.c, self.s
        x0, x1, W = self.x0, self.x0 + self.W, self.W
        y = self.base
        self.floors = []
        for i, (mat, h) in enumerate(zip(s['storeys'], self.heights)):
            top = y - h
            jet = 3 if (s['jetty'] and i > 0) else 0
            self.floors.append((top, h, jet))
            y = top
        self.eave = y
        for i, (top, h, jet) in enumerate(self.floors):
            mat = s['storeys'][i]
            WALL[mat](c, x0 - jet, top, W + 2 * jet, h)
            if s['frame'] and mat in ('render', 'whitewash', 'ochre'):
                self.framing(x0 - jet, top, W + 2 * jet, h, i)
            if jet:
                bevel(c, x0 - jet - 1, top + h - 5, W + 2 * jet + 2, 6, OAK, 3)
                if s.get('studding') == 'close':
                    # a carved bressumer: a running vine cut along the beam
                    for k in range(x0 - jet + 2, x1 + jet - 2):
                        c.p(k, top + h - 3 + round(math.sin(k * 0.6)), OAK[5])
                        if k % 6 == 0:
                            c.p(k, top + h - 4, OAK[2])
                for k in range(x0 - jet + 3, x1 + jet - 4, 9):
                    bevel(c, k, top + h + 1, 5, 4, OAK, 3)
                op.cast(c, x0, top + h + 1, W, 5, 0.68)
            if s['quoins'] and mat not in ('rubble',):
                self.quoins(x0 - jet, top, W + 2 * jet, h)
            if s['string'] and i > 0:
                r = RAMPS['limestone']
                c.rect(x0 - 1, top + h - 3, W + 2, 1, r[0])
                c.rect(x0 - 1, top + h - 2, W + 2, 2, r[2])
                op.cast(c, x0, top + h, W, 2)
        if s['plinth']:
            WALL['rubble' if s['plinth'] == 'rubble' else 'ashlar'](c, x0, self.base - 10, W, 10)
            c.rect(x0, self.base - 11, W, 1, mix(c.g(x0 + 4, self.base - 12), (40, 30, 50, 255), 0.35))

    def framing(self, x, y, w, h, storey):
        c = self.c
        solid = set()
        bevel(c, x, y, 5, h, OAK, mask=solid)
        bevel(c, x + w - 5, y, 5, h, OAK, mask=solid)
        bevel(c, x, y, w, 5, OAK, mask=solid)
        bevel(c, x, y + h - 5, w, 5, OAK, mask=solid)
        if self.s.get('studding') == 'close':
            # close studding: posts shoulder to shoulder, the mark of money
            for px in range(x + 9, x + w - 6, 9):
                bevel(c, px, y, 4, h, OAK, mask=solid)
            bevel(c, x, y + h // 2 - 2, w, 4, OAK, mask=solid)
            recess(c, [(xx, yy) for yy in range(y, y + h) for xx in range(x, x + w)], solid)
            return
        n = max(2, w // 26)
        pitch = (w - 5) / n
        for k in range(1, n):
            bevel(c, round(x + k * pitch), y, 5, h, OAK, mask=solid)
        if storey == 0:
            bevel(c, x, y + h // 2 - 2, w, 4, OAK, mask=solid)
        for k in range(n):
            if k % 2:
                continue
            px = round(x + k * pitch) + 5
            brace(c, px, y + h - 6, px + round(pitch) - 10, y + 6, OAK, 4, solid)
        recess(c, [(xx, yy) for yy in range(y, y + h) for xx in range(x, x + w)], solid)

    def quoins(self, x, y, w, h):
        c, r = self.c, RAMPS['limestone']
        for k, yy in enumerate(range(y, y + h - 3, 7)):
            for qx, qw in ((x, 9 if k % 2 else 5), (x + w - (9 if k % 2 else 5), 9 if k % 2 else 5)):
                op.raised(c, qx, yy, qw, 6, r, 1)

    # ---------------------------------------------------------------- openings

    def openings(self):
        c, s = self.c, self.s
        x0, W = self.x0, self.W
        frame, infill = s['windows']
        n = max(2, W // 44)
        cols = [x0 + round(W * (k + 0.5) / n) for k in range(n)]
        door_col = n // 2 if n % 2 else n // 2 - (1 if self.s['seed'] % 2 else 0)
        dw, dh = (22, 44) if s['door'] != 'panel' else (22, 44)
        self.door_h = dh
        self.sills = []
        skip = getattr(self, 'skip', None)
        for i, (top, h, jet) in enumerate(self.floors):
            for k, cx in enumerate(cols):
                if i == 0 and k == door_col:
                    continue
                if skip and skip[0] <= cx <= skip[1]:
                    continue
                if frame == 'mullion':
                    lights = 3 if W / n >= 44 else 2
                    lw = 7
                    ww = lights * lw + (lights - 1) * 3
                    wy = top + (14 if i == 0 else 10)
                    op.mullion_window(c, cx - ww // 2, wy, lights, lw, h - (wy - top) - 12, True)
                    self.sills.append((cx - ww // 2 - 5, wy + h - (wy - top) - 12 + 2, ww + 10))
                    continue
                ww = 18 if i else 20
                wh = h - 26 if i else h - 30
                wy = top + (13 if i else 15)
                op.FRAMES[frame][0](c, cx - ww // 2, wy, ww, wh, None)
                op.INFILLS[infill](c, cx - ww // 2, wy, ww, wh, s.get('joinery') or ('oak' if frame == 'timber' and infill == 'casement' else 'white'))
                op.reveal(c, cx - ww // 2, wy, ww, wh, 2)
                if s['shutters']:
                    op.open_shutters(c, cx - ww // 2 - 3, wy - 4, ww + 6, wh + 8, s['shutters'], 6)
                if s['boxes'] and i == 0:
                    op.flower_box(c, cx - ww // 2, wy + wh + 6, ww, seed=cx)
                self.sills.append((cx - ww // 2 - 6, wy + wh + 5, ww + 12))
        if s['shop']:
            # the bay beside the door opens as a shop: the lower shutter let
            # down as a counter, the upper propped out as a hood
            k = door_col + 1 if door_col + 1 < len(cols) else door_col - 1
            top, h, _ = self.floors[0]
            self.shop_counter(cols[k], top + 10, max(26, self.W // len(cols) - 12), h - 22)
        cx = cols[door_col]
        self.door_x = cx
        self.cols, self.door_col = cols, door_col
        if skip and skip[0] - 14 <= cx <= skip[1] + 14:
            return
        dx, dy = cx - dw // 2, self.base - dh
        if s['door'] == 'panel':
            op.door_panel(c, dx, dy, dw, dh, s.get('door_paint', 'blue'))
        else:
            op.door_plank(c, dx, dy, dw, dh)
        for k in range(3):
            c.rect(dx - 6 - k, self.base + k, dw + 12 + 2 * k, 1, RAMPS['granite'][k + 1])

    def shop_counter(self, cx, y, w, h):
        c = self.c
        x = cx - w // 2
        o = OAK
        op.raised(c, x - 3, y - 3, w + 6, h + 6, o, 3)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                c.p(xx, yy, (60, 42, 44, 255) if yy - y > 4 else (44, 30, 36, 255))
        for xx in range(x + 3, x + w - 3, 5):
            c.rect(xx, y + 5, 3, 1, (150, 110, 70, 255))
        # propped hood: its underside dark, its front edge lit
        c.rect(x - 4, y - 7, w + 8, 4, o[3])
        c.rect(x - 4, y - 7, w + 8, 1, o[2])
        c.rect(x - 4, y - 4, w + 8, 1, o[5])
        op.cast(c, x - 2, y - 3, w + 4, 3, 0.62)
        # counter: its top face, goods on it, its board front
        cy = y + h - 7
        c.rect(x - 4, cy, w + 8, 3, o[2])
        c.rect(x - 4, cy, w + 8, 1, o[1])
        goods = [ramp(65, 0.12)[2], ramp(40, 0.12)[3], ramp(150, 0.08)[3], ramp(85, 0.04)[1]]
        for k, xx in enumerate(range(x, x + w - 2, 4)):
            col = goods[int(h2(xx, y, 701) * 4)]
            c.rect(xx, cy - 2, 3, 2, col)
            c.p(xx, cy - 2, mix(col, (255, 250, 230, 255), 0.4))
        op.raised(c, x - 4, cy + 3, w + 8, 8, o, 3)
        for xx in range(x - 3, x + w + 3, 6):
            c.rect(xx, cy + 4, 1, 6, o[4])

    # ---------------------------------------------------------------- roof

    def roof(self):
        """The front slope as a band: courses across, a stepped light from a
        brighter eave to a duller ridge, hips that turn away, an old ridge
        that sags."""
        c, s = self.c, self.s
        x0, x1 = self.x0, self.x0 + self.W
        over, rise = (7 if s['roof'] == 'thatch' else 5), self.rise
        eave = self.eave
        top = eave - rise
        paint, _ = COVER[s['roof']]
        r = self.tone
        self.roof_px = set()
        hip = s['hip']
        k_hip = 0.55
        old = s['wear'] > 0.5 and s['roof'] in ('thatch', 'plain', 'shingle')
        amp = 2 + (s['wear'] > 0.75)
        span = x1 - x0 + 2 * over

        def sag(x):
            return round(amp * math.sin(math.pi * (x - x0 + over) / span)) if old else 0

        for y in range(top - 1, eave + 3):
            k = y - top
            inset = round((rise - k) * k_hip) if hip else 0
            L, R = x0 - over + inset, x1 + over - inset
            if R <= L:
                continue
            paint_r = r
            paint(c, L, y, R - L, 1) if paint_r is None else self.paint_row(paint, L, y, R - L, paint_r)
            for x in range(L, R):
                if y < top + sag(x):
                    c.px[x, y] = (0, 0, 0, 0)
                    continue
                self.roof_px.add((x, y))
                t = (y - top - sag(x)) / rise
                col = c.g(x, y)
                if t < 0.3:
                    c.p(x, y, mix(col, (40, 30, 70, 255), 0.14))
                elif t > 0.72:
                    c.p(x, y, mix(col, (255, 244, 220, 255), 0.06))
            if hip:
                hw = inset
                for x in range(L, min(R, L + hw // 2 + 1)):
                    c.p(x, y, mix(c.g(x, y), (255, 244, 220, 255), 0.1))
                for x in range(max(L, R - hw // 2 - 1), R):
                    c.p(x, y, mix(c.g(x, y), (40, 30, 70, 255), 0.25))
        self.eave_edge(x0 - over, x1 + over, eave, s['roof'], r)
        ins = round(rise * k_hip) if hip else 0
        if hip:
            # ridge tiles run down each hip to the eave corner
            for y in range(top, eave + 2):
                d = round((rise - (y - top)) * k_hip)
                for xx, cols in ((x0 - over + d, (r[2], r[3])), (x1 + over - d - 2, (r[4], r[5]))):
                    if s['roof'] == 'thatch':
                        c.p(xx, y, r[4]); c.p(xx + 1, y, r[5])
                    else:
                        cap = self.cap_ramp(s['roof'])
                        c.p(xx, y, cap[2]); c.p(xx + 1, y, cap[4])
        else:
            self.verges(x0 - over, x1 + over, top, eave, s['roof'], r, sag)
        self.ridge(x0 - over + ins, x1 + over - ins, top, s['roof'], r, sag)
        self.top, self.over = top, over

    def paint_row(self, paint, x, y, w, r):
        try:
            paint(self.c, x, y, w, 1, r)
        except TypeError:
            paint(self.c, x, y, w, 1)

    def cap_ramp(self, kind):
        if kind == 'slate':
            return ramp(258, 0.025, lift=-0.1)
        if kind in ('plain', 'pantile', 'shingle', 'imbrex'):
            return mix_ramp(self.tone)
        return self.tone

    def verges(self, L, R, top, eave, kind, r, sag):
        """Gable ends seen edge-on: a barge board for tile and slate, the
        straw rolled over for thatch, each casting a sliver of shadow."""
        c = self.c
        for y in range(top, eave + 3):
            for x, left in ((L, True), (R - 1, False)):
                if y < top + sag(x):
                    continue
                if kind == 'thatch':
                    for k, idx in enumerate((3, 4, 5)):
                        c.p(x + (k if left else -k), y, r[idx if left else min(7, idx + 1)])
                else:
                    for k, idx in enumerate((2, 3, 5)):
                        c.p(x + (k if left else -k), y, OAK[idx if left else min(7, idx + 1)])

    def eave_edge(self, L, R, eave, kind, r):
        c = self.c
        if kind == 'thatch':
            # the thatch ends in a thick rounded lip that shades the wall
            for x in range(L, R):
                rag = int(h2(x // 2, 0, 501) * 2)
                for k, idx in enumerate((2, 2, 3, 4, 5, 6)):
                    c.p(x, eave - 1 + k + rag, r[idx])
                    self.roof_px.add((x, eave - 1 + k + rag))
            op.cast(c, L + 7, eave + 6, R - L - 14, 6, 0.6)
        else:
            fascia = OAK if kind in ('plain', 'shingle', 'slate') else r
            for x in range(L, R):
                for k, idx in enumerate((5, 3, 4, 6)):
                    c.p(x, eave + 2 + k, fascia[idx])
            op.cast(c, L + 5, eave + 6, R - L - 10, 5, 0.62)
            if kind == 'imbrex' and self.s.get('antefixes', True):
                for x in range(L + 1, R - 2, 9):
                    antefix(c, x + 1, eave + 2, r)

    def ridge(self, L, R, y, kind, r, sag=lambda x: 0):
        c = self.c
        if kind == 'thatch':
            # a block-cut ridge with its lower edge cut in points, liggers crossed on it
            for x in range(L - 2, R + 2):
                pt = 3 - abs((x - L) % 8 - 4) // 2 if L + 2 < x < R - 2 else 0
                y0 = y + sag(x)
                for k in range(-3, 6 + pt):
                    col = r[2] if k < 0 else r[3] if k < 3 else r[4] if k < 5 + pt else r[6]
                    if (x - L + k) % 7 == 0 and 0 <= k < 4:
                        col = OAK[4]
                    c.p(x, y0 + k, col)
            return
        cap = ramp(258, 0.025, lift=-0.1) if kind == 'slate' else RAMPS['terracotta'] if kind == 'pantile' else ramp(38, 0.11, lift=-0.06)
        for x in range(L - 1, R + 1):
            seg = (x - L) % 10
            for k, idx in enumerate((4, 2, 1, 2, 3, 5)):
                col = cap[idx]
                if seg == 9:
                    col = cap[min(7, idx + 2)]
                c.p(x, y - 3 + k, col)
        op.cast(c, L, y + 3, R - L, 2, 0.7)

    def dormers(self):
        c, s = self.c, self.s
        if not s['dormers']:
            return
        n = s['dormers']
        cols = self.cols
        picks = [cols[i] for i in range(len(cols)) if i != self.door_col][:n] if n < len(cols) else cols[:n]
        if n == 1:
            picks = [cols[self.door_col]]
        for cx in picks:
            if s['dormer'] == 'eyebrow':
                self.eyebrow(cx)
            else:
                self.gable_dormer(cx)

    def gable_dormer(self, cx):
        """A small gabled dormer: a timber front with a casement, its own
        little roof in the house's covering, bargeboards, a shadow under."""
        c, s = self.c, self.s
        w, fh = 22, 18
        foot = self.eave - 4
        y = foot - fh
        paint, r = COVER[s['roof']]
        WALL['render'](c, cx - w // 2, y, w, fh)
        bevel(c, cx - w // 2, y, 4, fh, OAK, 3)
        bevel(c, cx + w // 2 - 4, y, 4, fh, OAK, 3)
        op.frame_timber(c, cx - 6, y + 4, 12, fh - 8, None)
        op.INFILLS[s['windows'][1] if s['windows'][1] != 'sash' else 'casement'](c, cx - 6, y + 4, 12, fh - 8, 'oak')
        op.reveal(c, cx - 6, y + 4, 12, fh - 8, 2)
        rise = 11
        for yy in range(y - rise - 2, y + 1):
            half = round((yy - (y - rise - 2)) * (w / 2 + 3) / (rise + 2))
            self.paint_row(paint, cx - half, yy, 2 * half, r)
        for i in range(-w // 2 - 3, w // 2 + 4):
            yy = y - rise - 2 + round(abs(i) * (rise + 2) / (w / 2 + 3))
            for k, idx in enumerate((2, 3, 5)):
                c.p(cx + i, yy + k, OAK[idx if i < 0 else min(7, idx + 1)])
        op.cast(c, cx - w // 2, y + 2, w, 2, 0.7)
        op.cast(c, cx - w // 2 - 2, foot + 1, w + 4, 2, 0.7)

    def eyebrow(self, cx):
        """An eyebrow window in thatch: the straw lifts over a small window."""
        c = self.c
        paint, r = COVER['thatch']
        w, h = 26, 14
        foot = self.eave - 2
        for x in range(cx - w // 2, cx + w // 2):
            t = (x - cx) / (w / 2)
            lift = round(math.sqrt(max(0, 1 - t * t)) * 8)
            for k, idx in enumerate((1, 2, 3, 4, 5)):
                c.p(x, foot - h - lift + k, r[idx])
        op.frame_timber(c, cx - 6, foot - h + 2, 12, 9, None)
        op.leaded(c, cx - 6, foot - h + 2, 12, 9)
        op.cast(c, cx - 8, foot - h + 1, 16, 1, 0.65)

    def draw_stacks(self):
        c, s = self.c, self.s
        x0, x1 = self.x0, self.x0 + self.W
        hip = round(self.rise * 0.55) if s['hip'] else 0
        sw, sh = 16, 30
        foot = self.top + 16
        xs = {'ends': [x0 + hip + 6, x1 - hip - 6 - sw], 'center': [x0 + self.W // 2 - sw // 2],
              'one': [x1 - hip - 10 - sw]}.get(s['stacks'], [])
        self.stack_boxes = []
        stone = s['storeys'][0] in ('rubble', 'ashlar', 'sandstone')
        for x in xs:
            top = foot - sh
            if stone:
                fm.ashlar(c, x, top, sw, sh, RAMPS['sandstone' if 'sandstone' in s['storeys'] else 'limestone'], 6, 10)
            else:
                fm.brick(c, x, top, sw, sh, ramp(30, 0.09, lift=-0.13))
            c.rect(x, top, 2, sh, mix(c.g(x + 3, top + 2), (255, 240, 220, 255), 0.22))
            sr = RAMPS['limestone']
            c.rect(x - 2, top - 6, sw + 4, 6, sr[2])
            c.rect(x - 2, top - 6, sw + 4, 1, sr[0]); c.rect(x - 2, top - 6, 1, 6, sr[1])
            c.rect(x + 3, top - 4, sw - 6, 2, sr[7])
            c.rect(x - 2, top - 1, sw + 4, 1, sr[4])
            pot(c, x + 1, top - 13)
            pot(c, x + sw - 8, top - 13)
            for yy in range(top, foot + 4):
                for xx in range(x + sw, x + sw + 5):
                    if (xx, yy) in self.roof_px and xx - (x + sw) < 5 - max(0, yy - foot):
                        c.p(xx, yy, mix(c.g(xx, yy), (40, 30, 70, 255), 0.33))
            z = RAMPS['zinc']
            c.rect(x - 1, foot - 1, sw + 2, 2, z[3]); c.rect(x - 1, foot - 1, sw + 2, 1, z[2])
            self.stack_boxes.append((x - 2, top - 6, sw + 4))

    def lean_to(self):
        if not self.lean:
            return
        c = self.c
        lx0, lw, lh = 6, self.lean + 8, 40
        top = self.base - lh
        WALL[self.s['storeys'][0]](c, lx0, top, lw, lh)
        bevel(c, lx0, top, 5, lh, OAK, 3)
        op.frame_timber(c, lx0 + 12, top + 12, 12, 14, None)
        op.leaded(c, lx0 + 12, top + 12, 12, 14)
        op.reveal(c, lx0 + 12, top + 12, 12, 14, 2)
        paint, r = COVER[self.s['roof'] if self.s['roof'] != 'thatch' else 'thatch']
        for y in range(top - 24, top + 2):
            paint(c, lx0 - 4, y, lw + 6, 1)
        for x in range(lx0 - 4, lx0 + lw + 2):
            c.p(x, top + 2, OAK[5]); c.p(x, top + 3, OAK[6])
        op.cast(c, lx0, top + 4, lw, 3)

    # ---------------------------------------------------------------- build

    def build(self):
        s = self.s
        self.lean_to()
        self.walls()
        self.openings()
        self.roof()
        self.dormers()
        self.draw_stacks()
        x0, x1 = self.x0, self.x0 + self.W
        if s['sign']:
            fixture(self.c, x1 - 3, self.floors[0][0] + 10, 1, 'sign', s['sign'][0], s['sign'][1])
        if s['lantern']:
            fixture(self.c, self.door_x + 14, self.floors[0][0] + 8, 1, 'lantern', s['lantern'])
        walls = {(x, y) for y in range(self.eave, self.base - 10) for x in range(x0, x1)}
        stone = {(x, y) for y in range(self.base - 10, self.base) for x in range(x0, x1)}
        weather(self.c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: self.eave, walls=walls,
                             stone=stone, sills=self.sills, chimneys=self.stack_boxes), s['wear'], s['seed'])
        self.roof_span = (x0 - self.over, x1 + self.over)
        self.stacks = [(x, w) for x, _, w in self.stack_boxes]
        if s.get('edge') == 'finish':
            from art.front_kit import finish
            finish(self.c)
            consolidate(self.c, rare=4)
        else:
            outline(self.c)
            consolidate(self.c)
        return self.c.im
