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
    'shingle': (lambda c, x, y, w, h: fm.shingles(c, x, y, w, h, tw=8, th=6), RAMPS['shingle']),
}
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
}


class EaveHouse:
    def __init__(self, spec):
        s = dict(W=140, storeys=['render'], heights=None, jetty=False, frame=False, roof='plain', hip=False,
                 rise=None, dormers=0, dormer='gable', stacks='ends', windows=('timber', 'leaded'),
                 shutters=None, boxes=False, door='plank', lean_to=False, plinth='rubble', quoins=False,
                 wear=0.5, seed=0, sign=None, lantern=None, string=False)
        s.update(spec)
        self.s = s
        n = len(s['storeys'])
        self.heights = s['heights'] or ([50] if n == 1 else [56] + [46] * (n - 1))
        self.rise = s['rise'] or {'thatch': 62, 'pantile': 34, 'slate': 46, 'plain': 52, 'shingle': 48}[s['roof']]
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
        for i, (top, h, jet) in enumerate(self.floors):
            for k, cx in enumerate(cols):
                if i == 0 and k == door_col:
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
                op.INFILLS[infill](c, cx - ww // 2, wy, ww, wh, 'oak' if frame == 'timber' and infill == 'casement' else 'white')
                op.reveal(c, cx - ww // 2, wy, ww, wh, 2)
                if s['shutters']:
                    op.open_shutters(c, cx - ww // 2 - 3, wy - 4, ww + 6, wh + 8, s['shutters'], 6)
                if s['boxes'] and i == 0:
                    op.flower_box(c, cx - ww // 2, wy + wh + 6, ww, seed=cx)
                self.sills.append((cx - ww // 2 - 6, wy + wh + 5, ww + 12))
        cx = cols[door_col]
        self.door_x = cx
        dx, dy = cx - dw // 2, self.base - dh
        if s['door'] == 'panel':
            op.door_panel(c, dx, dy, dw, dh, s.get('door_paint', 'blue'))
        else:
            op.door_plank(c, dx, dy, dw, dh)
        for k in range(3):
            c.rect(dx - 6 - k, self.base + k, dw + 12 + 2 * k, 1, RAMPS['granite'][k + 1])
        self.cols, self.door_col = cols, door_col

    # ---------------------------------------------------------------- roof

    def roof(self):
        c, s = self.c, self.s
        x0, x1 = self.x0, self.x0 + self.W
        over, rise = (7 if s['roof'] == 'thatch' else 5), self.rise
        eave = self.eave
        top = eave - rise
        paint, r = COVER[s['roof']]
        self.roof_px = set()
        hip = s['hip']
        for y in range(top, eave + 3):
            k = y - top
            inset = round((rise - k) * 0.55) if hip else 0
            L, R = x0 - over + inset, x1 + over - inset
            paint(c, L, y, R - L, 1)
            for x in range(L, R):
                self.roof_px.add((x, y))
            if hip:
                # hip faces turn away: the left catches light, the right falls into shade
                hw = max(0, round((rise - k) * 0.55))
                for x in range(L, min(R, L + hw // 2 + 1)):
                    c.p(x, y, mix(c.g(x, y), (255, 244, 220, 255), 0.12))
                for x in range(max(L, R - hw // 2 - 1), R):
                    c.p(x, y, mix(c.g(x, y), (40, 30, 70, 255), 0.25))
        # gently darker toward the ridge: the slope tips away from the sky
        for y in range(top, top + rise // 3):
            for x in range(x0 - over, x1 + over):
                if (x, y) in self.roof_px:
                    c.p(x, y, mix(c.g(x, y), (40, 30, 70, 255), 0.12 * (1 - (y - top) / (rise / 3))))
        self.eave_edge(x0 - over, x1 + over, eave, s['roof'], r)
        if not hip:
            for x in (x0 - over, x1 + over - 1):
                for y in range(top, eave + 3):
                    c.p(x, y, r[5] if x > x0 else r[3])
        self.ridge(x0 - over + (round(rise * 0.55) if hip else 0), x1 + over - (round(rise * 0.55) if hip else 0), top, s['roof'], r)
        self.top, self.over = top, over

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

    def ridge(self, L, R, y, kind, r):
        c = self.c
        if kind == 'thatch':
            # a block-cut ridge with its lower edge cut in points, liggers crossed on it
            for x in range(L - 2, R + 2):
                pt = 3 - abs((x - L) % 8 - 4) // 2 if L + 2 < x < R - 2 else 0
                for k in range(-3, 6 + pt):
                    col = r[2] if k < 0 else r[3] if k < 3 else r[4] if k < 5 + pt else r[6]
                    if (x - L + k) % 7 == 0 and 0 <= k < 4:
                        col = OAK[4]
                    c.p(x, y + k, col)
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
            paint(c, cx - half, yy, 2 * half, 1)
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
        outline(self.c)
        consolidate(self.c)
        return self.c.im
