"""Five landmark buildings drawn front-on: the Romanesque church, the Spanish
American mission church, the Elizabethan playhouse, the Georgian and
Victorian playhouse, and the picture house.

    .venv/bin/python scripts/art/front_landmarks.py artifacts/front-landmarks.png

Each is a class with the attributes FrontCivicPainter reads (c, x0, W, base,
door_x, door_size). `landmark_spec` routes a game frame to one.
"""
from pathlib import Path
import math
import re
import sys
import zlib

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2, glazes  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_fixtures as fx  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art.front_kit import outline, consolidate, text, text_w  # noqa: E402
from art.front_eave import COVER, TONES  # noqa: E402
from art.front_solid import dome  # noqa: E402
from art.front_church import Church  # noqa: E402
from art.front_parts import (  # noqa: E402
    STONE, OAK, DARK, LIGHT, VOID, GOLD, shade, cast_right, cast_down, raised, rounded, segmental,
    window, wall, lesene, plinth, string_course, corbel_table, roof_band, finial, pyramid, saddleback, column,
)

IRON = op.IRON
# Bulbs, lit signs and poster cases: glass to the night layer.
BULB = ramp(78, 0.14, lift=0.06)
NEON_RED = ramp(28, 0.16, lift=-0.02)
POSTER = [ramp(28, 0.14, lift=-0.04), ramp(250, 0.1, lift=-0.08), ramp(80, 0.13), ramp(150, 0.09, lift=-0.1)]
glazes(BULB, NEON_RED)
FLAG = ramp(28, 0.16, lift=-0.04)
TEAL = ramp(190, 0.06, lift=-0.06)


def flat(c, x, y, w, h, col):
    c.rect(x, y, w, h, col)


def shade_box(c, x0, y0, x1, y1, k, to=DARK):
    for y in range(y0, y1):
        for x in range(x0, x1):
            shade(c, x, y, k, to)


def finish(c, base, x0, W, wall_top, roof_px, wear, seed):
    walls = {(x, y) for y in range(wall_top, base - 8) for x in range(x0, x0 + W)}
    stone = {(x, y) for y in range(base - 12, base) for x in range(x0, x0 + W)}
    weather(c, dict(roof=roof_px, roof_shade=set(), eave_y=lambda x: wall_top, walls=walls, stone=stone,
                    sills=[], chimneys=[]), wear, seed)
    outline(c)
    consolidate(c)


def lombard(c, x0, x1, y, r, step=8):
    """A Lombard band: a row of small round arches hung from the string
    course, each arch's soffit in shade, little lesene feet between them."""
    for x in range(x0 + 1, x1 - step + 2, step):
        for xx in range(x, x + step - 1):
            for yy in range(y, y + 5):
                inside = rounded(xx, yy, x + 1, y + 3, step - 3)
                ring = rounded(xx, yy, x, y + 3, step - 1)
                if ring and not inside:
                    c.p(xx, yy, r[1] if xx < x + step // 2 else r[3])
                elif inside:
                    shade(c, xx, yy, 0.25)
        c.rect(x + step - 1, y + 2, 1, 4, r[2])
    c.rect(x0, y - 1, x1 - x0, 1, r[0])
    cast_down(c, x0, x1, y + 6, 2, 0.2)


def bell(c, cx, y):
    for j in range(7):
        c.rect(cx - 1 - j // 3, y + j, 3 + j // 3 * 2, 1, GOLD[1 + j // 3])
    c.rect(cx - 3, y + 7, 7, 1, GOLD[4])
    c.p(cx, y + 8, GOLD[5])


# ================================================================== Romanesque

class Romanesque(Church):
    """A Romanesque church of the eleventh and twelfth centuries: a west
    tower in stages under Lombard bands, its belfry paired arches, a low
    pyramid cap; a nave of round-headed windows in deep reveals between
    lesenes; a south portal of receding orders round a carved tympanum, set
    in a shallow frontispiece; an apse; on an abbey, aisles, a transept and a
    crossing tower."""

    LOOKS = [dict(walls='sandstone', dress='sandstone', cover='slate', tone='slate-blue', tower_top='pyramid'),
             dict(walls='limestone', dress='limestone', cover='slate', tone='stone-slate', tower_top='pyramid'),
             dict(walls='sandstone', dress='sandstone', cover='plain', tone='tile-orange', tower_top='pyramid',
                  pitch=0.6)]

    def __init__(self, size='medium', look=0, W=None, seed=0):
        lk = dict(self.LOOKS[look % len(self.LOOKS)])
        super().__init__('romanesque', size, W=W, seed=seed, wear=0.3, porch='frontispiece', corbels=True,
                         clock=False, **lk)
        if size == 'small':
            self.s['layout'] = 'bellcote'
        self.door_size = (20, 42)

    def bays(self, x, w, eave, base, kind, chancel=False):
        c, s = self.c, self.s
        n = max(2 if not chancel else 1, w // 38)
        pitch = w / n
        for k in range(1, n):
            lesene(c, round(x + k * pitch) - 2, eave + 6, base - 7, self.r, 5)
        for k in range(n):
            cx = round(x + (k + 0.5) * pitch)
            window(c, 'roundhead', cx, eave + 18, 10, min(28, self.wall_h - 36), self.d, self.seed + k, s['glass'])
        lombard(c, x, x + w, eave + 3, self.d)

    def tower(self, x, base, campanile=False, crossing=False):
        if crossing:
            return self.crossing(x, base)
        c, s, d = self.c, self.s, self.d
        w, h = self.tower_w, self.tower_h
        top = base - h
        wall(c, x, top, w, h, s['walls'], self.wall_ramp())
        for bx in (x, x + w - 5):
            raised(c, bx, top + 2, 5, h - 8, d, 1)
        stages = [base - round(h * 0.4), base - round(h * 0.68), top + 6]
        for y in stages[:2]:
            string_course(c, x, y, w, d)
        for y in stages:
            lombard(c, x + 5, x + w - 5, y + 4, d, 6)
        window(c, 'roundhead', x + w // 2, stages[0] + 22, 8, 22, d, self.seed + 70, s['glass'])
        # Paired openings, then a triple arcade under the cap: the belfry
        # lightens as it rises.
        self.biforium(x + w // 2, stages[1] + 16, 2, 9, stages[0] - stages[1] - 24)
        self.biforium(x + w // 2, stages[2] + 14, 3 if w >= 50 else 2, 8, stages[1] - stages[2] - 22)
        cast_right(c, x + w, top + 4, base - 4, 4, 0.34)
        if s['tower_top'] == 'saddleback':
            saddleback(c, x, top, w, self.tone, 30, self.roof_px)
        else:
            pyramid(c, x - 2, top, w + 4, self.tone, 30, self.roof_px)
        finial(c, x + w // 2 - 1, top - 31, 'cross', d)
        self.tower_box = (x, w)

    def biforium(self, cx, y, n, lw, lh):
        """Arched lights divided by colonnettes, all under one relieving arch."""
        c, d = self.c, self.d
        gap = 3
        tot = n * lw + (n - 1) * gap
        x0 = cx - tot // 2
        for yy in range(y - tot // 2 - 3, y + lh + 1):
            for xx in range(x0 - 3, x0 + tot + 3):
                if rounded(xx, yy, x0 - 3, y + 2, tot + 6) and not rounded(xx, yy, x0 - 1, y + 2, tot + 2):
                    c.p(xx, yy, d[1] if xx < cx else d[3])
                elif rounded(xx, yy, x0 - 1, y + 2, tot + 2):
                    c.p(xx, yy, d[4])
        for k in range(n):
            lx = x0 + k * (lw + gap)
            for yy in range(y, y + lh):
                for xx in range(lx, lx + lw):
                    if rounded(xx, yy, lx, y + lw // 2, lw):
                        c.p(xx, yy, OAK[6] if (yy - y) % 4 else OAK[5])
            if k:
                c.rect(lx - 2, y + 2, 1, lh - 2, d[1]); c.rect(lx - 1, y + 2, 1, lh - 2, d[3])
                c.rect(lx - 3, y + 1, 4, 1, d[0])
        c.rect(x0 - 3, y + lh, tot + 6, 2, d[1])
        c.rect(x0 - 3, y + lh + 2, tot + 6, 1, d[4])

    def crossing(self, x, base):
        """A square lantern over the crossing under a low pyramid."""
        c, s, d = self.c, self.s, self.d
        w, h = self.tower_w, 54
        top = base - h
        wall(c, x, top, w, h, s['walls'], self.wall_ramp())
        for bx in (x, x + w - 5):
            raised(c, bx, top + 2, 5, h - 2, d, 1)
        lombard(c, x + 5, x + w - 5, top + 4, d, 6)
        self.biforium(x + w // 2, top + 16, 2, 8, 22)
        cast_right(c, x + w, top + 2, base, 4, 0.34)
        pyramid(c, x - 2, top, w + 4, self.tone, 26, self.roof_px)
        finial(c, x + w // 2 - 1, top - 27, 'cross', d)

    def build(self):
        s = self.s
        if self.size == 'large':
            s['layout'] = 'west-tower'
        im = super().build()
        return im

    def aisled_nave(self, x, w, base):
        super().aisled_nave(x, w, base)
        if self.size == 'large':
            tw = self.tower_w
            self.tower(x + round(w * 0.62) - tw // 2, base - self.wall_h - 26 - 40 + 30, crossing=True)

    def transept_gable(self, cx, base, aisle_h):
        c, s, d = self.c, self.s, self.d
        tw = 64
        x = cx - tw // 2
        wh = aisle_h + 30
        from art.front_parts import gable
        wall(c, x, base - wh, tw, wh, s['walls'], self.wall_ramp())
        gable(c, cx, base - wh, tw, 40, s['walls'], self.wall_ramp() or STONE['limestone'], 'stone', self.tone, 10,
              self.roof_px)
        for bx in (x, x + tw - 5):
            raised(c, bx, base - wh + 2, 5, wh - 8, d, 1)
        window(c, 'oculus', cx, base - wh - 22, 16, 16, d, self.seed + 50)
        window(c, 'roundhead', cx, base - wh + 20, 12, wh - 40, d, self.seed + 51, s['glass'])
        lombard(c, x + 5, x + tw - 5, base - wh + 3, d)
        cast_right(c, x + tw, base - wh - 10, base - 8, 5, 0.38)

    def apse(self, x, base, h):
        super().apse(x, base, h)
        c, d = self.c, self.d
        for xx in range(x + 1, x + 24, 6):
            for yy in range(base - h + 8, base - h + 12):
                if rounded(xx + 0, yy, xx, base - h + 10, 5) and not rounded(xx, yy, xx + 1, base - h + 11, 3):
                    c.p(xx, yy, d[2])

    def porch(self, x, base):
        """A frontispiece: the portal block stands a hand proud of the wall
        under its own stone gable, the orders stepping in to the door."""
        c, s, d = self.c, self.s, self.d
        w = 48 if self.size != 'small' else 40
        h = self.wall_h + 4
        cx = x + w // 2
        wall(c, x, base - h, w, h, s['walls'], self.wall_ramp())
        from art.front_parts import gable
        gable(c, cx, base - h, w, 18, s['walls'], self.wall_ramp() or STONE['limestone'], 'stone', self.tone, 6,
              self.roof_px)
        lombard(c, x + 2, x + w - 2, base - h + 3, d, 6)
        self.portal(cx, base, 20, 42)
        cast_right(c, x + w, base - h - 10, base - 4, 5, 0.4)
        self.porch_cx = cx

    def portal(self, cx, base, dw, dh):
        """Three orders of round arch, the middle one chevroned, round a
        tympanum carved with a figure in a mandorla over a lintel."""
        c, d = self.c, self.d
        dx = cx - dw // 2
        spring = base - dh + dw // 2
        for o in range(3, -1, -1):
            ow = dw + o * 6
            ox = dx - o * 3
            for yy in range(spring - ow // 2 - 1, base):
                for xx in range(ox, ox + ow):
                    if not rounded(xx, yy, ox, spring, ow):
                        continue
                    if o == 0:
                        col = d[3] if yy < spring + 2 else VOID if yy < base - 6 else (48, 38, 44, 255)
                    else:
                        col = d[1] if xx < cx else d[3]
                        if o == 2 and (xx + yy) % 4 < 2:
                            col = d[0] if xx < cx else d[2]
                        if o == 1 and yy > spring:
                            col = d[2] if xx < cx else d[4]
                    c.p(xx, yy, col)
        # The tympanum: a mandorla and the lintel under it.
        for yy in range(spring - dw // 2 + 2, spring + 3):
            for xx in range(cx - 3, cx + 3):
                if ((xx - cx + 0.5) / 3) ** 2 + ((yy - spring + 2) / 6) ** 2 <= 1:
                    c.p(xx, yy, d[1] if xx < cx else d[2])
        c.rect(cx - 1, spring - 5, 2, 2, d[0])
        c.rect(dx, spring + 3, dw, 2, d[1]); c.rect(dx, spring + 5, dw, 1, d[4])
        op.door_studded(c, dx + 2, spring + 6, dw - 4, base - spring - 6)
        cast_down(c, dx + 2, dx + dw - 2, spring + 6, 2, 0.4)


# ================================================================== Mission

class Mission:
    """The church of a Spanish American town, seen from its atrio: the
    facade square on, its curved gable or espadaña against the sky, a carved
    stone portal of pilasters, niche and choir window; one bell tower or two
    with cupolas; battered buttresses; a tiled nave roof running back behind
    the gable, a dome over the crossing on the largest; the convento's
    arcade alongside."""

    LOOKS = [dict(walls='whitewash', dress='sandstone', roof='pantile'),
             dict(walls='sandstone', dress='sandstone', roof='pantile'),
             dict(walls='ochre', dress='whitewash', roof='pantile')]

    def __init__(self, size='medium', look=0, W=None, seed=0):
        self.size, self.look, self.seed = size, look % 3, seed
        lk = self.LOOKS[self.look]
        self.wr = STONE[lk['walls']] if lk['walls'] != 'sandstone' else RAMPS['sandstone']
        self.dr = STONE[lk['dress']]
        self.walls = lk['walls']
        self.tone = TONES['pantile'] if self.look != 1 else TONES['pantile-red']
        self.W = W or {'small': 144, 'medium': 224, 'large': 304}[size]
        self.fh = {'small': 62, 'medium': 80, 'large': 94}[size]
        self.base = {'small': 168, 'medium': 232, 'large': 270}[size]
        self.x0 = 16
        self.c = C(self.x0 + self.W + 30, self.base + 8)
        self.roof_px = set()
        self.door_size = (22, 44)

    def face(self, x, y, w, h, r=None, kind=None):
        kind = kind or self.walls
        wall(self.c, x, y, w, h, kind, r or self.wr)

    def build(self):
        c, x0, base, W = self.c, self.x0, self.base, self.W
        towers = {'small': 0, 'medium': 1, 'large': 2}[self.size]
        tw = {'medium': 34, 'large': 38}.get(self.size, 0)
        fw = {'small': 74, 'medium': 96, 'large': 120}[self.size]
        fx0 = x0 + (tw if towers else 4)
        conv_x = fx0 + fw + (tw if towers == 2 else 0)
        # back to front: the nave roof and dome, the convento, the facade, the towers
        cx = fx0 + fw // 2
        top = base - self.fh
        self.nave_roof(fx0 + 4, fx0 + fw - 4, top + 6)
        if self.size == 'large':
            dome(c, cx + 6, top - 2, 26, TONES['pantile'] if self.look == 2 else RAMPS['tufa'], z0=0, courses=5,
                 ribs=8, drum=12, lantern=(5, 12))
            self.roof_px |= {(x, y) for x in range(cx - 22, cx + 34) for y in range(top - 80, top)}
        if conv_x < x0 + W - 20:
            self.convento(conv_x, x0 + W)
        self.facade(fx0, fw)
        if towers:
            self.tower(fx0 - tw, tw, 1)
        if towers == 2:
            self.tower(fx0 + fw, tw, 2)
        self.door_x = cx
        finish(c, base, x0, W, top, self.roof_px, 0.3, self.seed)
        return c.im

    def nave_roof(self, L, R, eave):
        """The nave's tiled roof running back from the facade, its two slopes
        seen from above: one in the light, one in shade."""
        c, t = self.c, self.tone
        cx = (L + R) / 2
        rise = round((R - L) * 0.42)
        for y in range(eave - rise, eave + 1):
            half = (y - (eave - rise)) / rise * (R - L) / 2 + 2
            for x in range(int(cx - half), int(cx + half) + 1):
                d = (y - (eave - rise))
                col = t[2] if (x - L + (0 if x < cx else 4)) % 7 else t[4]
                if d % 8 == 7:
                    col = t[5]
                if x >= cx:
                    col = t[min(7, t.index(col) + 2)] if col in t else col
                c.p(x, y, col)
                self.roof_px.add((x, y))
        for y in range(eave - rise - 2, eave):
            c.p(round(cx), y, t[1]); c.p(round(cx) + 1, y, t[4])

    def gable_profile(self, w):
        """Height above the cornice at each column of the facade: a curved
        baroque gable, or (look 1) a stepped one, or the espadaña of a chapel."""
        out = []
        for i in range(w):
            t = abs((i + 0.5) / w * 2 - 1)
            if self.size == 'small':
                out.append(0)
            elif self.look == 1:
                out.append(30 if t < 0.34 else 18 if t < 0.66 else 8 if t < 0.86 else 0)
            else:
                body = 34 * math.cos(min(1, t / 0.62) * math.pi / 2) ** 0.7 if t < 0.62 else 0
                scroll = 10 * math.sin(min(1, (t - 0.55) / 0.33) * math.pi) if 0.55 < t < 0.88 else 0
                out.append(round(max(body, scroll)))
        return out

    def facade(self, x, w):
        c, base, r, d = self.c, self.base, self.wr, self.dr
        top = base - self.fh
        cx = x + w // 2
        prof = self.gable_profile(w)
        mx = max(prof)
        keep = {(x + i, yy): c.g(x + i, yy) for i, gh in enumerate(prof) for yy in range(top - mx, top - gh - 2)}
        self.face(x, top - mx, w, self.fh + mx)
        for (xx, yy), q in keep.items():
            c.px[xx, yy] = q
        # coping along the whole skyline, cornice across the facade
        for i, gh in enumerate(prof):
            y = top - gh
            c.p(x + i, y - 2, d[0]); c.p(x + i, y - 1, d[1]); c.p(x + i, y, d[3])
            if i and prof[i - 1] != gh:
                lo, hi = sorted((top - prof[i - 1], y))
                for yy in range(lo - 2, hi):
                    c.p(x + i - (1 if prof[i - 1] > gh else 0), yy, d[1] if prof[i - 1] < gh else d[3])
        c.rect(x - 2, top - 1, w + 4, 2, d[1]); c.rect(x - 2, top + 1, w + 4, 2, d[3])
        cast_down(c, x, x + w, top + 3, 3, 0.35)
        if self.size == 'small':
            self.espadana(cx, top)
        else:
            finial(c, cx - 1, top - max(prof) - 3, 'cross', d)
            if self.look != 1:
                for sx in (x + 2, x + w - 6):
                    c.rect(sx, top - 6, 4, 4, d[2]); c.rect(sx, top - 6, 4, 1, d[0])
        # battered buttresses at the corners
        for bx, lit in ((x - 4, True), (x + w - 6, False)):
            for yy in range(top + 18, base):
                k = (yy - top - 18) * 4 // max(1, base - top - 18)
                lx = bx - k if lit else bx
                c.rect(lx, yy, 10 + k, 1, r[1 if lit else 2])
                c.p(lx, yy, r[0] if lit else r[2]); c.p(lx + 9 + k, yy, r[3])
            for yy in range(top + 15, top + 18):
                c.rect(bx, yy, 10, 1, r[yy - top - 15])
        cast_right(c, x + w + 4, top + 18, base - 2, 4, 0.36)
        self.portal(cx, top, base)
        c.rect(x - 6, base - 5, w + 12, 5, d[3]); c.rect(x - 6, base - 5, w + 12, 1, d[1])

    def portal(self, cx, top, base):
        """The retablo facade: paired pilasters either side of a round-arched
        door, an entablature, a niche with its saint, and the choir window."""
        c, d = self.c, self.dr
        pw = 50 if self.size != 'small' else 40
        px = cx - pw // 2
        dw, dh = 22, 44
        dx = cx - dw // 2
        ent = base - dh - 12
        # the frame: a stone field behind the door and the pilasters
        raised(c, px, ent, pw, base - ent - 5, d, 2)
        for lx in (px + 2, px + 8, px + pw - 13, px + pw - 7):
            lesene(c, lx, ent + 3, base - 6, d, 5)
            c.rect(lx - 1, ent + 2, 7, 2, d[0]); c.rect(lx - 1, base - 9, 7, 3, d[2])
        # the door in a deep round-arched reveal
        spring = base - dh + dw // 2
        for yy in range(base - dh - 4, base - 5):
            for xx in range(dx - 3, dx + dw + 3):
                if rounded(xx, yy, dx - 3, spring, dw + 6) and not rounded(xx, yy, dx, spring, dw):
                    c.p(xx, yy, d[1] if xx < cx else d[3])
                    if yy < spring and (math.atan2(spring - yy, xx - cx + 0.5) * 6) % 2 < 0.3:
                        c.p(xx, yy, d[4])
        for yy in range(base - dh, base - 5):
            for xx in range(dx, dx + dw):
                if rounded(xx, yy, dx, spring, dw):
                    c.p(xx, yy, OAK[3] if (xx - dx) % 4 else OAK[5])
        for yy in range(spring, base - 5, 6):
            for xx in range(dx + 1, dx + dw - 1, 4):
                c.p(xx + 1, yy + 2, IRON[2])
        c.rect(cx, spring - dw // 2, 1, base - spring + dw // 2 - 5, OAK[6])
        for yy in range(base - dh, base - 5):
            for xx in range(dx, dx + dw):
                if rounded(xx, yy, dx, spring, dw) and (xx - dx < 2 or yy - (base - dh) < 3):
                    shade(c, xx, yy, 0.35)
        # entablature, then the upper storey of the retablo
        c.rect(px - 3, ent - 4, pw + 6, 2, d[0]); c.rect(px - 3, ent - 2, pw + 6, 2, d[2])
        c.rect(px - 3, ent, pw + 6, 1, d[4])
        cast_down(c, px - 2, px + pw + 3, ent + 1, 2, 0.3)
        if self.size == 'small':
            window(c, 'oculus', cx, top + 4, 10, 10, d, self.seed, 'clear')
            return
        uw, uh = pw - 16, ent - 4 - (top + 2)
        ux = cx - uw // 2
        raised(c, ux, top + 2, uw, uh, d, 2)
        for lx in (ux + 1, ux + uw - 5):
            lesene(c, lx, top + 3, ent - 5, d, 4)
        # the niche and its saint
        nw, ny = 10, ent - 30
        for yy in range(ny, ny + 22):
            for xx in range(cx - nw // 2, cx + nw // 2):
                if rounded(xx, yy, cx - nw // 2, ny + 5, nw):
                    c.p(xx, yy, d[5] if xx < cx - 2 or yy < ny + 3 else d[4])
        for k, (ww, q) in enumerate(((2, 1), (4, 1), (4, 2), (4, 1), (4, 2), (4, 2), (4, 2), (4, 1), (4, 2), (4, 2),
                                     (4, 2), (4, 2), (5, 2), (5, 3), (6, 3))):
            c.rect(cx - ww // 2, ny + 5 + k, ww, 1, d[q] if k else d[0])
        c.rect(cx - 6, ny + 22, 12, 2, d[1])
        window(c, 'oculus', cx, top - max(self.gable_profile(10)) // 2 - 22 if self.look != 1 else top - 20, 12, 12, d,
               self.seed + 2, 'clear')

    def espadana(self, cx, top):
        """The chapel's bell gable: the facade wall carried up, pierced for
        two bells and a third over them, a cross on top."""
        c, r, d = self.c, self.wr, self.dr
        tiers = [(46, 22), (22, 18)]
        y = top
        rows = []
        for iw, ih in tiers:
            bx = cx - iw // 2
            self.face(bx, y - ih, iw, ih + 1)
            c.rect(bx - 1, y - ih - 2, iw + 2, 2, d[0]); c.rect(bx - 1, y - ih, iw + 2, 1, d[3])
            rows.append((bx, iw, y - ih))
            y -= ih
        for k, (bx, iw, ty) in enumerate(rows):
            n = 2 if k == 0 else 1
            for j in range(n):
                ax = bx + (iw - n * 10 - (n - 1) * 6) // 2 + j * 16
                for yy in range(ty + 4, ty + 19):
                    for xx in range(ax, ax + 10):
                        if rounded(xx, yy, ax, ty + 9, 10):
                            c.p(xx, yy, VOID if xx > ax + 1 else mix(VOID, r[3], 0.4))
                bell(c, ax + 5, ty + 9)
        cast_right(c, cx + 23, top - 22, top, 3, 0.3)
        finial(c, cx - 1, y - 2, 'cross', d)

    def tower(self, x, w, which):
        """A bell tower: a plain shaft to the facade cornice, a belfry stage
        of arched openings, a drum and a tiled cupola with its lantern."""
        c, base, r, d = self.c, self.base, self.wr, self.dr
        shaft_top = base - self.fh - 14
        self.face(x, shaft_top, w, base - shaft_top)
        cast_right(c, x + w, shaft_top, base - 4, 4, 0.34) if which == 1 else None
        c.rect(x - 2, shaft_top - 2, w + 4, 2, d[0]); c.rect(x - 2, shaft_top, w + 4, 2, d[3])
        bh = 34
        by = shaft_top - bh
        bw = w - 4
        bx = x + 2
        self.face(bx, by, bw, bh, d if self.look != 0 else None, 'render' if self.look != 1 else 'sandstone')
        aw = bw - 14
        ax = bx + 7
        for yy in range(by + 6, by + bh - 1):
            for xx in range(ax, ax + aw):
                if rounded(xx, yy, ax, by + 6 + aw // 2, aw):
                    c.p(xx, yy, VOID if xx > ax + 1 and yy > by + 7 else mix(VOID, d[3], 0.4))
        bell(c, ax + aw // 2, by + 6 + aw // 2 - 2)
        for lx in (bx, bx + bw - 4):
            raised(c, lx, by, 4, bh, d, 1)
        c.rect(bx - 3, by - 3, bw + 6, 2, d[0]); c.rect(bx - 3, by - 1, bw + 6, 2, d[3])
        cast_down(c, bx, bx + bw, by + 1, 2, 0.3)
        for k in (0, 1):
            ux = bx - 2 if k == 0 else bx + bw - 1
            c.rect(ux, by - 8, 3, 5, d[1]); c.rect(ux - 1, by - 9, 5, 1, d[0])
        cup = TONES['pantile'] if self.look != 1 else RAMPS['tufa']
        dome(c, x + w // 2, by - 2, bw // 2 - 1, cup, courses=3, ribs=6, drum=5, lantern=(3, 7))
        finial(c, x + w // 2 - 1, by - 2 - (bw // 2 - 1) - 22, 'cross', d)
        self.roof_px |= {(xx, yy) for xx in range(x, x + w) for yy in range(by - 40, by)}

    def convento(self, x, R):
        """The convento's arcade: round arches on square piers, the cloister
        walk in shade behind them, a tiled roof over."""
        c, base, r, d = self.c, self.base, self.wr, self.dr
        w = R - x
        h = 50 if self.size != 'large' else 92
        top = base - h
        self.roof_px |= roof_band(c, x - 2, R + 4, top, 24, 'pantile', self.tone, hip=0.0)[0]
        self.face(x, top, w, h)
        ah = 40
        n = max(2, (w - 8) // 26)
        aw = (w - 8) // n
        for k in range(n):
            ax = x + 4 + k * aw + 3
            iw = aw - 6
            for yy in range(base - ah, base - 3):
                for xx in range(ax, ax + iw):
                    if rounded(xx, yy, ax, base - ah + iw // 2, iw):
                        back = r[4] if yy > base - 14 else r[5]
                        c.p(xx, yy, back)
            # the back wall's door or window in the shade
            if k % 2 == 0:
                c.rect(ax + iw // 2 - 4, base - 26, 8, 22, OAK[6])
            else:
                c.rect(ax + iw // 2 - 3, base - 26, 6, 8, r[6])
            for xx in range(ax, ax + iw):
                for yy in range(base - ah, base - ah + iw // 2 + 6):
                    if rounded(xx, yy, ax, base - ah + iw // 2, iw):
                        shade(c, xx, yy, 0.25)
            for xx in range(ax - 1, ax + iw + 1):
                for yy in range(base - ah - 2, base - ah + iw // 2 + 2):
                    if rounded(xx, yy, ax - 1, base - ah + iw // 2, iw + 2) and not rounded(xx, yy, ax, base - ah + iw // 2, iw):
                        c.p(xx, yy, r[0] if xx < ax + iw // 2 else r[2])
        if self.size == 'large':
            for k in range(n):
                wx = x + 4 + k * aw + aw // 2
                op.window(c, wx - 6, top + 14, 12, 18, 'adobe', 'shutters', 'none', 'green')
            c.rect(x, base - ah - 8, w, 2, d[1]); c.rect(x, base - ah - 6, w, 1, d[3])
        c.rect(x - 1, base - 4, w + 1, 4, r[3]); c.rect(x - 1, base - 4, w + 1, 1, r[2])


# ================================================================== Globe

class Globe:
    """An Elizabethan playhouse after the Globe, the Swan and the Rose: a
    polygon of three timber-framed galleries, lath and plaster between the
    oak, under a ring of thatch seen from above. Through the ring, the yard
    in the sun, the galleries' inner faces, the stage under its heavens and
    the hut on top flying the flag of a playing day."""

    def __init__(self, size='medium', W=None, seed=0):
        self.size, self.seed = size, seed
        self.W = W or {'small': 128, 'medium': 160, 'large': 192}[size]
        self.H = {'small': 64, 'medium': 78, 'large': 90}[size]
        self.x0 = 16
        self.rx = self.W // 2
        self.ry = round(self.rx * 0.42)
        self.base = 60 + 2 * self.ry + self.H + 6
        self.c = C(self.x0 + self.W + 30, self.base + 8)
        self.door_size = (22, 40)
        self.roof_px = set()
        self.sides = 16

    def build(self):
        c = self.c
        cx = self.x0 + self.W // 2
        wall_rx = self.rx - 5
        ty = self.base - self.H - round(self.ry * (wall_rx / self.rx))
        self.cx, self.ty = cx, ty
        self.drum(cx, ty, wall_rx)
        self.thatch(cx, ty)
        self.inside(cx, ty)
        self.door(cx)
        finish(c, self.base, self.x0, self.W, ty, self.roof_px, 0.25, self.seed)
        return c.im

    def front_y(self, x, cx, rx, ry, cy):
        """The polygon's front edge: straight facets between vertices."""
        n = self.sides
        best = None
        for k in range(n):
            a0, a1 = (k / n) * 2 * math.pi, ((k + 1) / n) * 2 * math.pi
            x0, x1 = cx + rx * math.cos(a0), cx + rx * math.cos(a1)
            y0, y1 = cy + ry * math.sin(a0), cy + ry * math.sin(a1)
            if min(x0, x1) <= x <= max(x0, x1) and x1 != x0 and (y0 + y1) / 2 > cy:
                y = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
                best = y if best is None else max(best, y)
        return best

    def facet(self, x, cx, rx):
        n = self.sides
        for k in range(n):
            a0, a1 = (k / n) * 2 * math.pi, ((k + 1) / n) * 2 * math.pi
            x0, x1 = cx + rx * math.cos(a0), cx + rx * math.cos(a1)
            if min(x0, x1) <= x <= max(x0, x1) and math.sin((a0 + a1) / 2) > 0:
                return k, (a0 + a1) / 2, min(x0, x1), max(x0, x1)
        return None

    def drum(self, cx, ty, rx):
        c, H = self.c, self.H
        ry = round(self.ry * rx / self.rx)
        plaster = RAMPS['render']
        oak = OAK
        tiers = 3
        th = H // tiers
        for x in range(cx - rx, cx + rx + 1):
            f = self.facet(x, cx, rx)
            if not f:
                continue
            k, mid, fx0, fx1 = f
            # lit from the upper left: a facet turned toward the left is bright
            light = -math.cos(mid)
            q = 1 if light > 0.45 else 2 if light > -0.1 else 3 if light > -0.6 else 4
            top = round(self.front_y(x, cx, rx, ry, ty))
            fwid = fx1 - fx0
            for yy in range(top, top + H):
                v = yy - top
                col = plaster[q]
                tier_v = v % th
                u = (x - fx0) / max(1, fwid)
                if v >= H - 7:
                    col = RAMPS['brick'][min(7, q + 2 + ((v - H + 7) % 3 == 2))]
                    if (x + (v // 3) * 4) % 8 == 0:
                        col = RAMPS['mortar'][q + 1]
                elif tier_v in (0, 1):
                    col = oak[min(7, q + 3 - (tier_v == 0))]
                elif tier_v in (2, 3):
                    col = mix(plaster[q], DARK, 0.3 if tier_v == 2 else 0.15)
                elif abs(x - fx0) < 1.6 or abs(x - fx1) < 1.6:
                    col = oak[min(7, q + 3)]
                elif fwid > 10 and abs(u - 0.5) < 0.5 / max(1, fwid) * 2:
                    col = oak[min(7, q + 3)]
                elif fwid > 10 and v // th == tiers - 1 and abs((tier_v - 4) / max(1, th - 5) - (u * 2 if u < 0.5 else 2 - u * 2)) < 1.6 / max(1, fwid * 0.5) + 0.04:
                    # a brace in each panel of the lowest gallery
                    col = oak[min(7, q + 3)]
                c.p(x, yy, col)
            # small leaded windows high in the top gallery
            if fx1 - fx0 > 12 and k % 2 == 0:
                wx = round((fx0 + fx1) / 2)
                if abs(x - wx) <= 3 and x != wx:
                    for yy in range(top + 6, top + 13):
                        c.p(x, yy, op.LEADED[5] if (x + yy) % 3 else op.LEADED[3])
        # the eave shadow under the thatch
        for x in range(cx - rx, cx + rx + 1):
            top = self.front_y(x, cx, rx, ry, ty)
            if top is None:
                continue
            for i in range(4):
                shade(c, x, round(top) + i, 0.4 * (1 - i / 4))

    def thatch(self, cx, ty):
        """The gallery roof: a ring of thatch, pitched both ways from a ridge
        that runs round the middle of it, seen from above."""
        c = self.c
        rx, ry = self.rx, self.ry
        irx, iry = rx - 22, ry - 12
        mrx, mry = (rx + irx) / 2, (ry + iry) / 2
        t = TONES['straw-old'] if self.size == 'small' else TONES['straw']
        sty = ty - 6
        self.hole = (cx, sty, irx, iry)
        for y in range(sty - ry - 2, sty + ry + 6):
            for x in range(cx - rx - 1, cx + rx + 2):
                dx, dy = x - cx, y - sty
                o = (dx / rx) ** 2 + (dy / ry) ** 2
                i = (dx / irx) ** 2 + (dy / iry) ** 2
                if o > 1 or i < 1:
                    # the thick eave: the near outer edge has a face
                    if o > 1 and dy > 0 and (dx / rx) ** 2 + ((dy - 4) / ry) ** 2 <= 1:
                        c.p(x, y, t[5] if (x // 3) % 2 else t[6])
                        self.roof_px.add((x, y))
                    continue
                m = (dx / mrx) ** 2 + (dy / mry) ** 2
                ang = math.atan2(dy / ry, dx / rx)
                outer = m > 1
                # the outer slope faces away from the yard, the inner toward it
                nx, ny = math.cos(ang), math.sin(ang)
                if not outer:
                    nx, ny = -nx, -ny
                lit = -0.7 * nx - 0.5 * ny + 0.25
                q = 1 if lit > 0.55 else 2 if lit > 0.1 else 3 if lit > -0.35 else 4
                # courses run round the ring
                rr = math.sqrt(o)
                course = int(rr * 40)
                col = t[q]
                if course % 4 == 0:
                    col = t[min(7, q + 1)]
                elif (int((ang + 3.2) * 60) + course * 3) % 7 == 0:
                    col = t[min(7, q + 1)]
                if abs(m - 1) < 0.07:
                    col = t[max(0, q - 1)]
                c.p(x, y, col)
                self.roof_px.add((x, y))

    def inside(self, cx, sty_):
        """Everything seen through the ring, clipped to it, then the stage
        house rising over the far thatch."""
        c = self.c
        hcx, hcy, irx, iry = self.hole
        top = hcy - iry
        gal = max(14, iry - 4)
        earth = RAMPS['sandstone']
        oak = OAK
        plaster = RAMPS['whitewash']
        inside = lambda x, y: ((x - hcx) / irx) ** 2 + ((y - hcy) / iry) ** 2 < 1
        for y in range(top, hcy + iry + 1):
            for x in range(hcx - irx, hcx + irx + 1):
                if not inside(x, y):
                    continue
                v = y - top
                if v < gal:
                    # far galleries: rails lit, the seated rows in shade behind posts
                    tv = v % (gal // 3)
                    col = oak[5] if tv > 1 else plaster[2]
                    if tv == 0:
                        col = oak[3]
                    if (x - hcx) % 7 == 0 and tv > 0:
                        col = oak[4]
                    if tv > 2 and (x * 3 + v * 5) % 11 < 2:
                        col = oak[6]
                else:
                    yv = (v - gal) / max(1, 2 * iry - gal)
                    col = earth[2] if yv > 0.18 else earth[3]
                    if yv > 0.62:
                        col = earth[1]
                    if (x * 7 + y * 13) % 29 == 0:
                        col = earth[3]
                c.p(x, y, col)
        # the left inner wall's shadow falls into the yard
        for y in range(top + gal, hcy + iry):
            for x in range(hcx - irx, hcx - irx + 14):
                if inside(x, y):
                    shade(c, x, y, 0.25)
        # stage: a platform thrust into the yard, with posts and the heavens
        sw = round(irx * 0.9)
        sx = hcx - sw // 2
        sfy = top + gal + 10
        c.rect(sx, top + gal - 2, sw, sfy - (top + gal - 2), oak[2])
        for x in range(sx, sx + sw):
            if (x - sx) % 5 == 0:
                c.rect(x, top + gal - 2, 1, sfy - (top + gal - 2), oak[3])
        c.rect(sx, sfy, sw, 5, oak[5])
        c.rect(sx, sfy, sw, 1, oak[4])
        for x in range(sx + 3, sx + sw - 2, 6):
            c.rect(x, sfy + 1, 1, 4, oak[6])
        cast_down(c, sx, sx + sw + 2, sfy + 5, 3, 0.35)
        # tiring-house doors in the far face
        for dx in (sx + 6, sx + sw - 13):
            c.rect(dx, top + gal - 12, 7, 10, oak[6]); c.rect(dx, top + gal - 12, 7, 1, oak[3])
        hh = gal + 18
        hy = sfy - 2 - hh
        for px in (sx + 4, sx + sw - 7):
            c.rect(px, hy + 6, 3, hh - 4, RAMPS['marble'][2]); c.rect(px, hy + 6, 1, hh - 4, RAMPS['marble'][0])
            c.rect(px + 2, hy + 6, 1, hh - 4, RAMPS['marble'][4])
        # the heavens: a tiled roof over the stage, its ridge running back,
        # the slope toward the sun lit, the gable end facing the yard in plaster
        g = TONES['tile-red']
        gw = sw + 6
        gx = sx - 3
        rise = 16
        gc = gx + gw / 2
        for yy in range(hy - rise, hy + 7):
            for xx in range(gx, gx + gw):
                k = abs(xx + 0.5 - gc) / (gw / 2)
                if yy < hy - rise + k * rise * 0.55:
                    continue
                if yy >= hy + 3:
                    col = oak[4] if yy < hy + 5 else oak[6]
                elif yy >= hy - 3 and k < 0.42:
                    col = RAMPS['render'][2] if xx < gc else RAMPS['render'][3]
                else:
                    left = xx < gc
                    q = 3 if left else 5
                    if (yy - hy) % 3 == 0:
                        q += 1
                    if abs(xx + 0.5 - gc) < 1:
                        q = 1
                    col = g[q]
                c.p(xx, yy, col)
                self.roof_px.add((xx, yy))
        cast_down(c, gx + 2, gx + gw, hy + 7, 3, 0.35)
        # the hut on the heavens, and its flag
        hx, hw = hcx - 8, 16
        hut_y = hy - rise - 6
        c.rect(hx, hut_y, hw, 12, RAMPS['whitewash'][2]); c.rect(hx, hut_y, 1, 12, RAMPS['whitewash'][1])
        c.rect(hx + hw - 2, hut_y, 2, 12, RAMPS['whitewash'][4])
        c.rect(hx + 5, hut_y + 4, 6, 6, oak[6])
        for k in range(6):
            c.rect(hx - 2 + k, hut_y - 6 + k, hw + 4 - 2 * k, 1, g[2] if k < 5 else g[4])
        for k in range(7):
            c.rect(hx - 3 + k, hut_y - 7 + k, 1, 1, g[1])
        c.rect(hx - 2, hut_y, hw + 4, 1, g[4])
        cast_down(c, hx, hx + hw, hut_y + 1, 2, 0.3)
        pole = hcx + 1
        c.rect(pole, hut_y - 26, 1, 20, IRON[3])
        for k in range(9):
            for j in range(13):
                wave = round(math.sin(j / 3) * 1)
                col = FLAG[2] if k < 5 else FLAG[3]
                if j > 9:
                    col = FLAG[4]
                c.p(pole + 1 + j, hut_y - 26 + k + wave, col)
        self.roof_px |= {(x, y) for x in range(hx - 4, hx + hw + 4) for y in range(hut_y - 8, hut_y + 12)}

    def door(self, cx):
        c = self.c
        base = self.base
        dw, dh = 20, 38
        dx = cx - dw // 2
        op.door_plank(c, dx, base - dh, dw, dh)
        # a pentice roof over the door
        t = TONES['tile-red']
        for k in range(6):
            c.rect(dx - 8 + k // 2, base - dh - 14 + k, dw + 16 - k // 2 * 2, 1, t[1 + k // 2])
        c.rect(dx - 8, base - dh - 8, dw + 16, 2, OAK[5])
        cast_down(c, dx - 6, dx + dw + 6, base - dh - 6, 3, 0.4)
        self.door_x = cx


# ================================================================== Playhouse

class Playhouse:
    """A playhouse of the theatre's long nineteenth century, the street front
    of a proscenium house. Look 0: a Regency stucco front with a Tuscan
    colonnade carrying a balcony. Look 1: Victorian brick dressed in stucco,
    an iron and glass canopy, gas lamps. Look 2: a continental Stadttheater,
    an arcade below and a pediment over arched windows."""

    def __init__(self, size='medium', look=0, W=None, seed=0):
        self.size, self.look, self.seed = size, look % 3, seed
        if size == 'small':
            self.look = 1
        self.W = W or {'small': 80, 'medium': 160, 'large': 208}[size]
        self.x0 = 16
        self.g = 50
        self.u = 40 if size == 'small' else 52
        self.base = self.g + self.u + 110
        self.c = C(self.x0 + self.W + 30, self.base + 8)
        self.door_size = (22, 42)
        self.roof_px = set()
        L = self.look
        self.wr = RAMPS['render'] if L == 0 else RAMPS['brick'] if L == 1 else STONE['pink']
        self.dr = RAMPS['render'] if L != 2 else RAMPS['whitewash']

    def build(self):
        c, x0, W, base = self.c, self.x0, self.W, self.base
        r, d = self.wr, self.dr
        L = self.look
        gtop = base - self.g
        utop = gtop - self.u
        ent_h = 12
        etop = utop - ent_h
        # roof first, its slates seen above the parapet
        self.roof_px |= roof_band(c, x0 + 6, x0 + W - 6, etop - 6, 24 if self.size != 'small' else 16, 'slate',
                                  TONES['slate-welsh'], hip=0.7)[0]
        # walls
        if L == 1:
            wall(c, x0, etop, W, base - etop, 'brick')
        else:
            wall(c, x0, etop, W, base - etop, 'render', r)
            fm.rustication(c, x0, gtop, W, self.g, r)
        cx = x0 + W // 2
        n = max(1, (W - 16) // 30)
        bay = (W - 16) / n
        bxs = [round(x0 + 8 + (k + 0.5) * bay) for k in range(n)]
        # upper storey
        if self.u:
            for k, bx in enumerate(bxs):
                if L == 2:
                    window(c, 'roundhead', bx, utop + 12, 12, 30, d, k, 'clear')
                else:
                    op.window(c, bx - 7, utop + 10, 14, 30, 'stone', 'sash', 'pediment' if L == 0 else 'keystone')
            if L != 1:
                for k in range(n + 1):
                    lx = round(x0 + 8 + k * bay) - 3
                    lesene(c, lx, utop + 2, gtop - 2, d, 6)
                    c.rect(lx - 1, utop + 1, 8, 2, d[0])
            else:
                for qx in (x0, x0 + W - 6):
                    for yy in range(utop, gtop, 6):
                        raised(c, qx + (0 if (yy // 6) % 2 else 1), yy, 6 if (yy // 6) % 2 else 5, 6, d, 2)
        # entablature and parapet
        c.rect(x0 - 3, etop, W + 6, 3, d[0]); c.rect(x0 - 3, etop + 3, W + 6, ent_h - 6, d[2])
        c.rect(x0 - 3, etop + ent_h - 3, W + 6, 2, d[1]); c.rect(x0 - 3, etop + ent_h - 1, W + 6, 1, d[4])
        cast_down(c, x0, x0 + W, etop + ent_h, 3, 0.35)
        raised(c, x0 - 2, etop - 7, W + 4, 7, d, 2)
        if self.size != 'small':
            self.pediment(cx, etop - 7, min(W - 30, 96), 22 if L != 1 else 18, segmental=L == 1)
        else:
            self.pediment(cx, etop - 7, W - 16, 14, segmental=True)
        # ground storey
        if L == 0 and self.size != 'small':
            self.colonnade(x0, W, gtop, base, bxs)
        elif L == 2:
            self.arcade(bxs, gtop, base, bay)
        else:
            self.doors(bxs, gtop, base)
            self.canopy(x0 + 10, x0 + W - 10, gtop + 4)
        c.rect(x0 - 2, base - 4, W + 4, 4, d[3]); c.rect(x0 - 2, base - 4, W + 4, 1, d[1])
        self.door_x = cx
        finish(c, base, x0, W, etop, self.roof_px, 0.2, self.seed)
        return c.im

    def pediment(self, cx, foot, w, rise, segmental=False):
        c, d = self.c, self.dr
        for yy in range(foot - rise - 2, foot):
            for xx in range(cx - w // 2, cx + w // 2):
                t = abs(xx - cx + 0.5) / (w / 2)
                edge = foot - (rise * math.sqrt(max(0, 1 - t * t)) if segmental else rise * (1 - t))
                if yy < edge - 3:
                    continue
                col = d[2] if yy >= edge + 1 else d[0] if yy < edge - 1 else d[1]
                c.p(xx, yy, col)
        if rise >= 18:
            window(c, 'oculus', cx, foot - rise + 6, 10, 10, d, self.seed, 'clear')
        cast_down(c, cx - w // 2, cx + w // 2, foot, 2, 0.25)

    def colonnade(self, x0, W, gtop, base, bxs):
        """Columns carrying a balcony over the doors; the doors in the
        shadow of it."""
        c, d = self.c, self.dr
        cx0, cx1 = x0 + 14, x0 + W - 14
        shade_box(c, cx0, gtop + 6, cx1, base - 4, 0.38)
        self.doors(bxs, gtop + 4, base, shaded=True)
        # balcony slab seen from above, a balustrade on it
        sy = gtop - 2
        c.rect(cx0 - 4, sy - 4, cx1 - cx0 + 8, 4, d[1])
        c.rect(cx0 - 4, sy, cx1 - cx0 + 8, 4, d[2]); c.rect(cx0 - 4, sy + 4, cx1 - cx0 + 8, 1, d[4])
        for xx in range(cx0 - 3, cx1 + 4, 4):
            c.rect(xx, sy - 11, 2, 7, d[1]); c.p(xx + 1, sy - 9, d[3])
        c.rect(cx0 - 4, sy - 13, cx1 - cx0 + 8, 2, d[0])
        n = len(bxs) + 1
        for k in range(n):
            px = round(cx0 + k * (cx1 - cx0) / (n - 1))
            column(c, px, sy + 5, base - 4, d, 8, 'tuscan')

    def doors(self, bxs, gtop, base, shaded=False):
        c = self.c
        for k, bx in enumerate(bxs):
            if len(bxs) > 2 and k in (0, len(bxs) - 1) and not shaded:
                op.window(c, bx - 7, gtop + 12, 14, 22, 'stone', 'sash', 'keystone')
                continue
            op.door_panel(c, bx - 10, base - 44, 20, 40, 'oxblood' if self.look == 1 else 'green')

    def arcade(self, bxs, gtop, base, bay):
        c, r, d = self.c, self.wr, self.dr
        aw = round(bay) - 10
        for bx in bxs:
            ax = bx - aw // 2
            spring = gtop + 8 + aw // 2
            for yy in range(gtop + 8, base - 4):
                for xx in range(ax - 3, ax + aw + 3):
                    if rounded(xx, yy, ax, spring, aw):
                        c.p(xx, yy, r[5] if yy > spring else r[6])
                    elif rounded(xx, yy, ax - 3, spring, aw + 6) and yy < spring:
                        c.p(xx, yy, d[1] if xx < bx else d[3])
            op.door_panel(c, bx - 9, base - 42, 18, 38, 'green')
            shade_box(c, ax, gtop + 8, ax + aw, base - 4, 0.12)
        self.canopy(bxs[0] - 14, bxs[-1] + 14, gtop) if False else None

    def canopy(self, L, R, y):
        """A Victorian iron and glass canopy on brackets, its glazed top seen
        from above, its fascia lit, the shadow it throws."""
        c = self.c
        g = op.PAINT['green'] if self.look != 1 else op.PAINT['oxblood']
        c.rect(L, y - 5, R - L, 5, RAMPS['zinc'][1])
        for xx in range(L + 2, R, 6):
            c.rect(xx, y - 5, 1, 5, RAMPS['zinc'][3])
        c.rect(L, y, R - L, 3, g[2]); c.rect(L, y + 3, R - L, 1, g[4])
        for xx in range(L + 1, R, 3):
            c.p(xx, y + 4, g[3])
        for bx in (L + 4, R - 6):
            for k in range(8):
                c.p(bx + (k // 3 if bx < (L + R) // 2 else -(k // 3)), y + 4 + k, IRON[3])
        cast_down(c, L, R, y + 5, 5, 0.38)


# ================================================================== Picture house

class PictureHouse:
    """The cinema. Look 0: an Art Deco front in cream faience, stepped to a
    central fin carrying the blade sign. Look 1: Streamline, horizontal bands
    in cream and green, a rounded canopy. Look 2: an Edwardian brick picture
    house with a curved gable, terracotta dressings and a pair of cupolas.
    All with a canopy over the doors, poster cases either side and the name
    in lights."""

    def __init__(self, size='medium', look=0, W=None, seed=0):
        self.size, self.look, self.seed = size, look % 3, seed
        if size == 'small':
            self.look = 2
        self.W = W or {'small': 80, 'medium': 176, 'large': 240}[size]
        self.fh = {'small': 68, 'medium': 92, 'large': 108}[size]
        self.x0 = 16
        self.base = self.fh + 90
        self.c = C(self.x0 + self.W + 30, self.base + 8)
        self.door_size = (22, 40)
        self.roof_px = set()
        L = self.look
        self.wr = RAMPS['marble'] if L == 0 else RAMPS['render'] if L == 1 else RAMPS['brick']
        self.dr = RAMPS['marble'] if L != 2 else RAMPS['tufa']

    def build(self):
        c, x0, W, base = self.c, self.x0, self.W, self.base
        r, d, L = self.wr, self.dr, self.look
        top = base - self.fh
        cx = x0 + W // 2
        # the auditorium roof behind the front
        self.roof_px |= roof_band(c, x0 + 10, x0 + W - 10, top - 4, 18 if self.size != 'small' else 12, 'slate',
                                  TONES['slate-blue'], hip=0.5)[0]
        if L == 2:
            wall(c, x0, top, W, self.fh, 'brick')
        else:
            self.faience(x0, top, W, self.fh)
        cy = base - 46
        if L == 0:
            self.deco(x0, W, top, cx, cy)
        elif L == 1:
            self.streamline(x0, W, top, cx, cy)
        else:
            self.edwardian(x0, W, top, cx, cy)
        self.entrance(x0, W, cx, cy, base)
        c.rect(x0 - 2, base - 4, W + 4, 4, d[3]); c.rect(x0 - 2, base - 4, W + 4, 1, d[1])
        self.door_x = cx
        finish(c, base, x0, W, top, self.roof_px, 0.15, self.seed)
        return c.im

    def faience(self, x, y, w, h):
        """Glazed faience blocks: one face colour, a lit top edge on each
        course, fine joints."""
        c, r = self.c, self.wr
        for yy in range(y, y + h):
            k = (yy - y) % 8
            for xx in range(x, x + w):
                col = r[0] if k == 0 else r[2] if k == 7 else r[1]
                if k and (xx - x + (yy - y) // 8 * 12) % 24 == 0:
                    col = r[2]
                c.p(xx, yy, col)

    def parapet_steps(self, x0, W, top, steps):
        c, r, d = self.c, self.wr, self.dr
        for k, (inset, hgt) in enumerate(steps):
            x, w = x0 + inset, W - 2 * inset
            self.faience(x, top - hgt, w, hgt + 1)
            c.rect(x - 1, top - hgt - 1, w + 2, 2, d[0]); c.rect(x - 1, top - hgt + 1, w + 2, 1, d[3])
            cast_right(c, x + w, top - hgt, top, 3, 0.3)

    def blade(self, cx, y0, y1, word):
        """The vertical sign: letters stacked on a dark field, a bulb border."""
        c = self.c
        w = 13
        x = cx - w // 2
        raised(c, x - 1, y0 - 1, w + 2, y1 - y0 + 2, TEAL, 4)
        c.rect(x + 1, y0 + 1, w - 2, y1 - y0 - 2, TEAL[6])
        for yy in range(y0 + 1, y1 - 1, 3):
            c.p(x, yy, BULB[1]); c.p(x + w - 1, yy, BULB[1])
        n = len(word)
        gap = (y1 - y0 - 6) // n
        for k, ch in enumerate(word):
            text(c, x + 4, y0 + 4 + k * gap, ch, BULB[1], NEON_RED[4])
        cast_right(c, x + w + 1, y0 + 2, y1, 2, 0.3)

    def deco(self, x0, W, top, cx, cy):
        c, r, d = self.c, self.wr, self.dr
        self.parapet_steps(x0, W, top, [(0, 0), (W // 6, 10), (W // 3, 20)])
        # the fin
        fw = 20
        fy = top - 46 if self.size != 'small' else top - 30
        self.faience(cx - fw // 2, fy, fw, top - fy + 2)
        for k, yy in enumerate(range(fy, fy + 12, 4)):
            c.rect(cx - fw // 2 - 2 + k, yy, fw + 4 - 2 * k, 2, d[0])
        cast_right(c, cx + fw // 2, fy, top, 3, 0.32)
        self.blade(cx, fy + 12, cy - 12, 'CINEMA')
        # tall windows either side, between vertical fins
        for side in (-1, 1):
            for k in range(2 if self.size != 'small' else 1):
                wx = cx + side * (fw // 2 + 16 + k * 22) - 6
                c.rect(wx, top + 8, 12, cy - top - 24, op.GLASS[4])
                c.rect(wx, top + 8, 4, cy - top - 24, op.GLASS[3])
                for yy in range(top + 8, cy - 16, 5):
                    c.rect(wx, yy, 12, 1, op.GLASS[1])
                c.rect(wx + 6, top + 8, 1, cy - top - 24, d[2])
                op.reveal(c, wx, top + 8, 12, cy - top - 24, 2)
                raised(c, wx - 2, cy - 16, 16, 3, d, 1)
                lesene(c, wx + (15 if side > 0 else -6), top + 2, cy - 14, d, 4)
        # speed lines on the wings
        for yy in (top + 10, top + 14, top + 18):
            for x in (x0 + 4, x0 + W - 22):
                c.rect(x, yy, 18, 1, d[3])

    def streamline(self, x0, W, top, cx, cy):
        c, r, d = self.c, self.wr, self.dr
        green = ramp(160, 0.06, lift=-0.1)
        for yy in range(top + 8, cy - 14, 9):
            c.rect(x0, yy, W, 3, green[2]); c.rect(x0, yy, W, 1, green[1]); c.rect(x0, yy + 3, W, 1, green[5])
        # a drum tower at the left corner, banded, a mast on top
        tw = 28
        tx = x0 + 10
        ty = top - 40
        for xx in range(tx, tx + tw):
            t = (xx - tx) / tw
            q = 0 if t < 0.2 else 1 if t < 0.5 else 2 if t < 0.8 else 3
            for yy in range(ty, cy - 14):
                c.p(xx, yy, r[q])
            for yy in range(ty + 6, cy - 14, 9):
                c.p(xx, yy, green[q + 1]); c.p(xx, yy + 1, green[q + 1]); c.p(xx, yy + 2, green[q + 2])
        for xx in range(tx - 2, tx + tw + 2):
            c.p(xx, ty - 1, d[0]); c.p(xx, ty, d[2])
        c.rect(tx + tw // 2, ty - 18, 1, 18, IRON[2])
        cast_right(c, tx + tw, ty, cy - 14, 3, 0.3)
        # the name along the frieze, in lights
        word = 'CINEMA'
        tx2 = cx + 10 - text_w(word) // 2
        raised(c, tx2 - 4, top - 12, text_w(word) + 8, 11, TEAL, 4)
        c.rect(tx2 - 2, top - 10, text_w(word) + 4, 7, TEAL[6])
        text(c, tx2, top - 9, word, BULB[1], NEON_RED[4])
        for x in range(x0 + 44, x0 + W - 8, 16):
            c.rect(x, top + 22, 10, 8, op.GLASS[3]); c.rect(x, top + 22, 10, 1, op.GLASS[1])

    def edwardian(self, x0, W, top, cx, cy):
        c, r, d = self.c, self.wr, self.dr
        gw = min(W - 30, 110)
        rise = 30 if self.size != 'small' else 18
        for yy in range(top - rise - 2, top + 1):
            for xx in range(cx - gw // 2, cx + gw // 2):
                t = abs(xx - cx + 0.5) / (gw / 2)
                edge = top - rise * (math.cos(t * math.pi / 2) ** 1.4 if t < 0.8 else 0.2 * (1 - (t - 0.8) / 0.2) + 0.14)
                if yy < edge:
                    continue
                c.p(xx, yy, d[0] if yy < edge + 2 else RAMPS['brick'][2 + ((yy // 4) % 2 == 0 and (xx // 8 + yy // 4) % 2)])
        c.rect(x0 - 2, top - 2, W + 4, 3, d[1]); c.rect(x0 - 2, top + 1, W + 4, 1, d[4])
        if self.size != 'small':
            window(c, 'oculus', cx, top - rise + 8, 14, 14, d, self.seed, 'clear')
            for qx in (x0, x0 + W - 18):
                wall(c, qx, top - 12, 18, 12, 'brick')
                dome(c, qx + 9, top - 12, 8, RAMPS['zinc'] if False else ramp(170, 0.07, lift=-0.04), courses=2, ribs=4,
                     lantern=(2, 5))
                self.roof_px |= {(x, y) for x in range(qx, qx + 18) for y in range(top - 34, top - 12)}
        word = 'PICTURES' if self.size != 'small' else 'CINEMA'
        bw = text_w(word) + 10
        raised(c, cx - bw // 2, top + 4, bw, 11, d, 1)
        text(c, cx - text_w(word) // 2, top + 7, word, RAMPS['brick'][5], d[2])
        for k, side in enumerate((-1, 1)):
            if self.size == 'small':
                break
            for j in range(2):
                wx = cx + side * (24 + j * 22)
                op.window(c, wx - 6, top + 20, 12, 18, 'stone', 'sash', 'keystone')

    def entrance(self, x0, W, cx, cy, base):
        """Doors in a row, poster cases either side, the canopy over them with
        the bulbs along its edge."""
        c, d = self.c, self.dr
        n = 2 if self.size == 'small' else 4
        dw = 14
        span = n * dw + (n - 1) * 3
        dx0 = cx - span // 2
        shade_box(c, dx0 - 4, cy, dx0 + span + 4, base - 4, 0.3)
        for k in range(n):
            dx = dx0 + k * (dw + 3)
            raised(c, dx, base - 42, dw, 38, RAMPS['brick'] if self.look == 2 else TEAL, 3)
            c.rect(dx + 2, base - 40, dw - 4, 22, op.GLASS[3]); c.rect(dx + 2, base - 40, 2, 22, op.GLASS[1])
            c.rect(dx + dw // 2, base - 30, 1, 6, GOLD[1])
        # poster cases
        if self.size != 'small':
            for k, px in enumerate((dx0 - 24, dx0 + span + 10)):
                raised(c, px - 1, base - 39, 16, 26, GOLD, 3)
                p = POSTER[(k + self.look) % len(POSTER)]
                c.rect(px + 1, base - 37, 12, 22, p[2])
                c.rect(px + 1, base - 37, 12, 6, p[4])
                c.rect(px + 3, base - 29, 8, 10, p[1])
                c.rect(px + 4, base - 28, 3, 4, p[0])
        # the canopy
        L, R = (x0 + 6, x0 + W - 6) if self.size != 'small' else (x0 + 4, x0 + W - 4)
        y = cy - 6
        top_col = RAMPS['zinc'] if self.look != 1 else RAMPS['marble']
        if self.look == 1:
            for yy in range(y - 5, y + 6):
                k = abs(yy - y) / 6
                inset = round(6 - 6 * math.sqrt(max(0, 1 - k * k)))
                c.rect(L + inset, yy, R - L - 2 * inset, 1, top_col[1] if yy < y else TEAL[3] if yy < y + 4 else TEAL[5])
        else:
            c.rect(L, y - 5, R - L, 5, top_col[1]); c.rect(L, y - 5, R - L, 1, top_col[0])
            c.rect(L, y, R - L, 6, TEAL[3] if self.look == 0 else op.PAINT['green'][3])
            c.rect(L, y, R - L, 1, TEAL[1] if self.look == 0 else op.PAINT['green'][1])
            c.rect(L, y + 5, R - L, 1, TEAL[5])
        for xx in range(L + 3, R - 2, 4):
            c.p(xx, y + 2, BULB[1]); c.p(xx, y + 3, BULB[3])
        cast_down(c, L, R, y + 6, 6, 0.42)


# ================================================================== the game hook

def landmark_spec(name, r):
    """The frame's spec and footprint, or None. Churches widen by the civic
    scale as the other front-on churches do; theatres keep their footprint."""
    m = re.match(r'(religious|theatre)-(romanesque-church|mission-church|globe|playhouse|picture-house)-'
                 r'(small|medium|large)-(\d+)(?:-(north|east|west))?$', name)
    if not m:
        return None
    _, kind, size, look = m.group(1), m.group(2), m.group(3), int(m.group(4))
    fw, fh = r['footprint']
    if kind in ('romanesque-church', 'mission-church'):
        from art.front_civic import SCALE
        fw = max(6, round(fw * SCALE))
    spec = dict(kind=kind, size=size, look=look, W=fw * 16, seed=zlib.crc32(name.encode()) % 997)
    return dict(landmark=spec), (fw, fh)


def landmark(spec):
    s = dict(spec)
    kind = s.pop('kind')
    if kind == 'globe':
        s.pop('look')
        return Globe(**s)
    return {'romanesque-church': Romanesque, 'mission-church': Mission, 'playhouse': Playhouse,
            'picture-house': PictureHouse}[kind](**s)


def studies():
    """(label, builder) for every kind, size and look the game bakes."""
    out = []
    for kind, W in (('romanesque-church', {'small': 144, 'medium': 224, 'large': 304}),
                    ('mission-church', {'small': 144, 'medium': 224, 'large': 304}),
                    ('globe', {'small': 128, 'medium': 160, 'large': 192}),
                    ('playhouse', {'small': 80, 'medium': 160, 'large': 208}),
                    ('picture-house', {'small': 80, 'medium': 176, 'large': 240})):
        for size in ('small', 'medium', 'large'):
            for look in range(1 if kind == 'globe' else 3):
                out.append((f'{kind}-{size}-{look}', dict(kind=kind, size=size, look=look, W=W[size], seed=look)))
    return out


def make(out, zoom=2, only=None):
    from art.reference import current_adult
    adult = current_adult()
    rows = {}
    for label, spec in studies():
        if only and not label.startswith(only):
            continue
        rows.setdefault(spec['kind'], []).append((label, landmark(spec).build()))
    pad = 10
    W = max(sum(im.width for _, im in row) + pad * (len(row) + 2) + adult.width for row in rows.values())
    Hs = [max(im.height for _, im in row) + 16 for row in rows.values()]
    s = Image.new('RGBA', (W, sum(Hs)), (70, 90, 60, 255))
    y, labels = 0, []
    for row, H in zip(rows.values(), Hs):
        x = pad
        for n, im in row:
            s.alpha_composite(im, (x, y + H - im.height))
            labels.append((x, y + 2, n))
            x += im.width + pad
        s.alpha_composite(adult, (x, y + H - adult.height - 8))
        y += H
    s = s.resize((W * zoom, s.height * zoom), Image.NEAREST)
    dr = ImageDraw.Draw(s)
    f = ImageFont.load_default(size=16)
    for x, yy, t in labels:
        dr.text((x * zoom, yy * zoom), t, font=f, fill=(255, 240, 190))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out} {s.size}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-landmarks.png', only=sys.argv[2] if len(sys.argv) > 2 else None)
