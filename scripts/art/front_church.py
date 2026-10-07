"""Churches from a spec, seen from the south as you meet them: tower or
bellcote at the west end (left), nave and chancel running right, the porch
coming toward you.

    .venv/bin/python scripts/art/front_church.py artifacts/front-church.png

Everything that differs between a Kentish parish church, a Norman abbey, a
Tuscan pieve, a whitewashed Andalusian chapel, a Danish village church, a
Norwegian stave church, a Lübeck brick church and a Bavarian Baroque one is
a choice in the spec: layout, walls and dressings, roof, windows, buttresses,
porch, tower and its top, chancel or apse, aisles and transept. STYLES holds
regional presets; church(style, size, **overrides) builds one.
"""
from pathlib import Path
import math
import random
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art.front_kit import outline, consolidate  # noqa: E402
from art.front_parts import (  # noqa: E402
    STONE, OAK, DARK, VOID, GOLD, COPPER, shade, cast_right, cast_down, raised, pointed, rounded,
    window, wall, buttress, lesene, plinth, string_course, corbel_table, parapet, roof_band,
    tone_for, gable, finial, clock, battlements, spire, pyramid, onion, saddleback, wooden_belfry,
)


def gothic_window(c, cx, y, w, h, r, seed=0, lights=2):
    """Kept for the civic module."""
    window(c, 'tracery' if lights == 2 else 'perpendicular', cx, y, w, h, r, seed)


STYLES = {
    'english-gothic': dict(walls='limestone', dress='limestone', layout='west-tower', cover='plain', tone='tile-red',
                           nave_win='tracery', chancel_win='perpendicular', tower_top='battlement', turret=True,
                           buttress='stepped', chancel='square', porch='gabled', portal='pointed', clock=True),
    'english-flint': dict(walls='flint', dress='limestone', layout='round-tower', cover='thatch', tone='reed',
                          nave_win='tracery', chancel_win='lancet', tower_top='battlement', buttress='stepped',
                          chancel='square', porch='gabled', portal='pointed', clock=False),
    'french-gothic': dict(walls='limestone', dress='limestone', layout='west-tower', cover='slate', tone='slate-blue',
                          nave_win='lancet', chancel_win='lancet', tower_top='spire', buttress='stepped',
                          pinnacles=True, chancel='apse', porch='none', portal='pointed', clock=True),
    'romanesque': dict(walls='sandstone', dress='sandstone', layout='west-tower', cover='slate', tone='slate-blue',
                       nave_win='roundhead', chancel_win='roundhead', tower_top='pyramid', buttress='lesene',
                       corbels=True, chancel='apse', porch='gabled', portal='round', clock=False),
    'italian-romanesque': dict(walls='striped', dress='limestone', layout='campanile', cover='pantile', tone='pantile',
                               nave_win='roundhead', chancel_win='roundhead', tower_top='campanile', buttress='lesene',
                               corbels=True, chancel='apse', porch='loggia', portal='round', pitch=0.55, clock=False),
    'mediterranean': dict(walls='whitewash', dress='sandstone', layout='espadana', cover='pantile', tone='pantile-pale',
                          nave_win='roundhead', chancel_win='shuttered', buttress='massive', chancel='square',
                          porch='none', portal='round', pitch=0.5, glass='clear', clock=False),
    'danish': dict(walls='whitewash', dress='whitewash', layout='west-tower', cover='plain', tone='tile-red',
                   nave_win='roundhead', chancel_win='roundhead', tower_top='crow', buttress='none',
                   chancel='square', porch='crow', portal='round', glass='clear', clock=False),
    'stave': dict(walls='tar', dress='tar', layout='stave', cover='shingle', tone='shingle-tar', clock=False),
    'baltic-brick': dict(walls='brick', dress='limestone', layout='west-tower', cover='plain', tone='tile-red',
                         nave_win='lancet', chancel_win='lancet', tower_top='needle', buttress='stepped',
                         chancel='square', porch='crow', portal='pointed', clock=True),
    'baroque': dict(walls='pink', dress='whitewash', layout='west-tower', cover='plain', tone='tile-red',
                    nave_win='baroque', chancel_win='lunette', tower_top='onion', buttress='pilaster',
                    chancel='apse', porch='none', portal='round', glass='clear', clock=True),
}
SHINGLE_TAR = ramp(38, 0.06, lift=-0.22)


class Church:
    def __init__(self, style='english-gothic', size='medium', W=None, seed=0, wear=0.45, **over):
        s = dict(walls='limestone', dress='limestone', layout='west-tower', cover='plain', tone=None, pitch=None,
                 nave_win='tracery', chancel_win='tracery', tower_win=None, glass='stained', tower_top='battlement',
                 turret=False, pinnacles=False, buttress='stepped', corbels=False, parapet=None, chancel='square',
                 porch='gabled', portal='pointed', clock=True, aisles=None, transept=None)
        s.update(STYLES.get(style, {}))
        s.update(over)
        if s['tone'] == 'shingle-tar':
            s['tone'] = SHINGLE_TAR
        self.s, self.style, self.size = s, style, size
        self.r = STONE.get(s['walls'], STONE['limestone'])
        self.d = STONE.get(s['dress'], STONE['limestone'])
        self.tone = tone_for(s['cover'], s['tone'])
        big = size == 'large'
        self.aisles = s['aisles'] if s['aisles'] is not None else big and s['layout'] not in ('espadana', 'stave')
        self.transept = s['transept'] if s['transept'] is not None else big and s['layout'] not in ('espadana', 'stave')
        if size == 'small' and s['layout'] in ('west-tower', 'round-tower', 'crossing-tower', 'campanile'):
            s['layout'] = 'bellcote'
        self.W = W or {'small': 150, 'medium': 230, 'large': 320}[size]
        self.seed, self.wear = seed, wear
        self.wall_h = {'small': 54, 'medium': 64, 'large': 54}[size]
        self.pitch = s['pitch'] or (0.84 if s['buttress'] != 'lesene' else 0.74)
        tw = {'small': 0, 'medium': 44, 'large': 54}[size]
        self.tower_w = tw if s['layout'] in ('west-tower', 'round-tower', 'campanile', 'crossing-tower') else 0
        self.tower_h = {'small': 0, 'medium': 150, 'large': 176}[size]
        if s['layout'] == 'campanile':
            self.tower_h += 20
        self.base = 30 + max(self.tower_h + 110, self.wall_h + 150)
        self.x0 = 16
        self.c = C(self.x0 + self.W + 30, self.base + 8)
        self.roof_px = set()

    def wall_ramp(self, kind=None):
        kind = kind or self.s['walls']
        return None if kind in ('striped', 'brick', 'flint') else STONE.get(kind, STONE['limestone'])

    # ---------------------------------------------------------------- build

    def build(self):
        s, c = self.s, self.c
        if s['layout'] == 'stave':
            return self.stave()
        base, x0 = self.base, self.x0
        tw = self.tower_w
        west = s['layout'] in ('west-tower', 'round-tower')
        nave_x = x0 + tw - 4 if west else x0
        east_room = tw + 10 if s['layout'] == 'campanile' else 0
        rest = self.W - (nave_x - x0) - east_room
        apse = s['chancel'] == 'apse' and self.size != 'small'
        chan_w = round(rest * (0.22 if apse else 0.3)) if s['chancel'] != 'none' else 0
        nave_w = rest - chan_w - (20 if apse else 0)
        chan_x = nave_x + nave_w
        if chan_w:
            self.chancel(chan_x, chan_w, base, apse)
        if self.aisles:
            self.aisled_nave(nave_x, nave_w, base)
        else:
            self.nave(nave_x, nave_w, base)
        plinth(c, nave_x, base - 7, nave_w + chan_w + (20 if apse else 0),
               self.d if s['dress'] not in ('tar',) else STONE['limestone'])
        if s['layout'] == 'west-tower':
            self.tower(x0, base)
        elif s['layout'] == 'round-tower':
            self.round_tower(x0, base)
        elif s['layout'] == 'campanile':
            self.tower(x0 + self.W - tw, base, campanile=True)
        elif s['layout'] == 'espadana':
            self.espadana(nave_x, base - self.wall_h)
        elif s['layout'] == 'bellcote':
            self.bellcote(nave_x + 10, base - self.wall_h)
        elif s['layout'] == 'crossing-tower':
            self.tower(nave_x + round(nave_w * 0.62) - tw // 2, base - self.wall_h + 10, crossing=True)
        self.porch(nave_x + (14 if west else 30), base)
        self.finish(x0, base)
        return c.im

    def finish(self, x0, base):
        c = self.c
        walls = {(x, y) for y in range(base - self.wall_h, base - 8) for x in range(x0, x0 + self.W)}
        stone = {(x, y) for y in range(base - 14, base) for x in range(x0, x0 + self.W)}
        weather(c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: base - self.wall_h, walls=walls,
                        stone=stone, sills=[], chimneys=[]), self.wear, self.seed)
        outline(c)
        consolidate(c)
        self.door_x = getattr(self, 'porch_cx', x0 + self.W // 2)
        self.anchor_x = x0 + self.W // 2

    # ---------------------------------------------------------------- body

    def roof(self, L, R, eave, rise, cresting=False):
        px, top = roof_band(self.c, L, R, eave, rise, self.s['cover'], self.tone,
                            cresting=cresting and self.s['cover'] == 'lead')
        self.roof_px |= px
        return top

    def gable_end(self, x, top, eave):
        """A gable seen edge-on at a roof's end: its coping standing a little
        proud, a cross on its apex."""
        c, r = self.c, self.d
        if self.s['cover'] == 'thatch':
            return
        for y in range(top - 3, eave + 4):
            c.p(x - 1, y, r[1]); c.p(x, y, r[2]); c.p(x + 1, y, r[3])
        cast_right(c, x + 2, top, eave + 4, 2, 0.3)
        finial(c, x - 1, top - 3, 'cross', r)

    def bays(self, x, w, eave, base, kind, chancel=False):
        """Windows between buttresses (or lesenes, or pilasters, or nothing)."""
        c, s, d = self.c, self.s, self.d
        n = max(2 if not chancel else 1, w // 40)
        pitch = w / n
        b = s['buttress']
        for k in range(n + 1):
            bx = round(x + k * pitch) - 4
            if k == 0 and not chancel:
                continue
            if b == 'stepped':
                buttress(c, bx, eave + 6, base - 6, d, 8, s['pinnacles'])
            elif b == 'lesene':
                lesene(c, bx + 1, eave + 4, base - 6, self.r)
            elif b == 'pilaster':
                lesene(c, bx, eave + 2, base - 6, d, 6)
                c.rect(bx - 1, eave + 2, 8, 2, d[0])
            elif b == 'massive' and k in (0, n):
                raised(c, bx - 2, eave + 14, 12, base - eave - 20, self.r, 1)
                for yy in range(eave + 10, eave + 16):
                    c.rect(bx - 2, yy, 12, 1, self.r[(yy - eave - 10) // 2])
                cast_right(c, bx + 10, eave + 14, base - 6, 5, 0.4)
        for k in range(n):
            cx = round(x + (k + 0.5) * pitch)
            if kind in ('tracery', 'perpendicular'):
                window(c, kind, cx, eave + 14, 18 if kind == 'tracery' else 20, self.wall_h - 30, d, self.seed + k, s['glass'])
            elif kind == 'lancet':
                window(c, kind, cx, eave + 12, 10, self.wall_h - 26, d, self.seed + k, s['glass'])
            elif kind == 'roundhead':
                window(c, kind, cx, eave + 16, 10, self.wall_h - 34, d, self.seed + k, s['glass'])
            elif kind == 'baroque':
                window(c, kind, cx, eave + 14, 14, self.wall_h - 30, d, self.seed + k, s['glass'])
            elif kind == 'lunette':
                window(c, kind, cx, eave + 16, 22, 12, d, self.seed + k, s['glass'])
            elif kind == 'shuttered':
                window(c, kind, cx, eave + 20, 8, 12, d, self.seed + k, s['glass'])
        if s['corbels']:
            corbel_table(c, x, x + w, eave + 2, self.r)

    def nave(self, x, w, base):
        c, s = self.c, self.s
        eave = base - self.wall_h
        wall(c, x, eave, w, self.wall_h, s['walls'], self.wall_ramp())
        if s['parapet']:
            parapet(c, x, eave, w, self.d, s['parapet'])
            top = self.roof(x + 2, x + w - 2, eave - 10, round(self.wall_h * self.pitch * 0.7))
        else:
            top = self.roof(x - 4, x + w + 4, eave, round(self.wall_h * self.pitch), cresting=True)
        self.gable_end(x + w + 1, top, eave)
        self.bays(x, w, eave, base, s['nave_win'])
        if s['buttress'] == 'pilaster':
            c.rect(x - 2, eave - 2, w + 4, 3, self.d[0])
            c.rect(x - 2, eave + 1, w + 4, 2, self.d[2])

    def aisled_nave(self, x, w, base):
        """A large church: a lean-to aisle in front, the clerestory over it,
        a transept gable halfway along."""
        c, s, d = self.c, self.s, self.d
        aisle_h, clere = self.wall_h, 40
        nave_eave = base - aisle_h - 26 - clere
        wall(c, x + 4, nave_eave, w - 8, clere + 20, s['walls'], self.wall_ramp())
        top = self.roof(x, x + w, nave_eave, 62, cresting=True)
        self.gable_end(x + w - 1, top, nave_eave)
        n = max(3, w // 34)
        pitch = w / n
        ck = 'lancet' if s['nave_win'] in ('tracery', 'perpendicular', 'lancet') else s['nave_win']
        for k in range(n):
            cx = round(x + (k + 0.5) * pitch)
            if ck == 'lancet':
                window(c, 'lancet', cx, nave_eave + 9, 9, clere - 12, d, self.seed + 30 + k, s['glass'])
            elif ck in ('roundhead', 'baroque'):
                window(c, 'roundhead', cx, nave_eave + 10, 8, clere - 16, d, self.seed + 30 + k, s['glass'])
            else:
                window(c, ck, cx, nave_eave + 12, 16, 10, d, self.seed + 30 + k, s['glass'])
        wall(c, x, base - aisle_h, w, aisle_h, s['walls'], self.wall_ramp())
        self.roof(x - 4, x + w + 4, base - aisle_h, 26)
        self.bays(x, w, base - aisle_h, base, s['nave_win'])
        if self.transept and w > 150:
            self.transept_gable(x + round(w * 0.62), base, aisle_h)

    def transept_gable(self, cx, base, aisle_h):
        c, s, d = self.c, self.s, self.d
        tw = 70
        x = cx - tw // 2
        wh = aisle_h + 34
        rise = 52
        wall(c, x, base - wh, tw, wh, s['walls'], self.wall_ramp())
        gable(c, cx, base - wh, tw, rise, s['walls'] if s['walls'] != 'striped' else 'limestone',
              self.wall_ramp() or STONE['limestone'], 'stone' if s['walls'] != 'brick' else 'crow',
              self.tone, 12, self.roof_px)
        finial(c, cx - 1, base - wh - rise - 2, 'cross', d)
        if s['buttress'] == 'stepped':
            for bx in (x - 3, x + tw - 5):
                buttress(c, bx, base - wh + 10, base - 6, d, 8, s['pinnacles'])
        win = 'rose' if s['nave_win'] in ('tracery', 'perpendicular', 'lancet') else 'oculus'
        window(c, win, cx, base - wh - 22, 34, 34, d, self.seed + 50)
        lower = 'perpendicular' if win == 'rose' else s['nave_win']
        window(c, lower, cx, base - wh + 34, 26 if lower == 'perpendicular' else 12, wh - 48, d, self.seed + 51, s['glass'])
        cast_right(c, x + tw, base - wh - 20, base - 8, 6, 0.4)

    def chancel(self, x, w, base, apse):
        s = self.s
        h = self.wall_h - 10
        wall(self.c, x, base - h, w, h, s['walls'], self.wall_ramp())
        top = self.roof(x - 2, x + w + 5, base - h, round(h * self.pitch))
        if not apse:
            self.gable_end(x + w + 2, top, base - h)
        self.bays(x, w, base - h, base, s['chancel_win'], chancel=True)
        if apse:
            self.apse(x + w, base, h)

    def apse(self, x, base, h):
        """A half-round apse: its wall curving away into shade, under a
        half-cone of roof whose courses curve round it."""
        c, s, r = self.c, self.s, self.r
        w = 26
        for xx in range(x, x + w):
            t = (xx - x) / w
            for yy in range(base - h + 6, base):
                c.p(xx, yy, mix(r[1] if (yy // 7 + (xx - x) // 6) % 2 else r[2], DARK, 0.12 + 0.45 * t))
        for i, xx in enumerate((x + 6, x + 15)):
            window(c, 'roundhead' if s['chancel_win'] not in ('lancet', 'tracery') else 'lancet', xx + 2,
                   base - h + 18, 7, h - 34, self.d, self.seed + 60 + i, s['glass'])
        tone, rise, eave = self.tone, 30, base - h + 4
        for xx in range(x - 2, x + w + 3):
            t = (xx - x + 2) / (w + 4)
            top = eave - round(rise * math.sqrt(max(0, 1 - t * t)))
            for yy in range(top, eave + 2):
                col = tone[3] if (xx + (eave - yy) // 5 * 3) % 7 else tone[4]
                if (eave - yy) % 5 == 4:
                    col = tone[5]
                c.p(xx, yy, mix(col, DARK, 0.08 + 0.42 * t))
                self.roof_px.add((xx, yy))
        cast_down(c, x, x + w, eave + 2, 3, 0.4)

    # ---------------------------------------------------------------- towers

    def tower(self, x, base, campanile=False, crossing=False):
        c, s, d = self.c, self.s, self.d
        w, h = self.tower_w, self.tower_h if not crossing else 60
        top = base - h
        walls = s['walls'] if not campanile else ('brick' if s['walls'] == 'striped' else s['walls'])
        wall(c, x, top, w, h, walls, self.wall_ramp(walls))
        stages = [base - round(h * 0.42), base - round(h * 0.7)] if not crossing else [base - h // 2]
        for y in stages:
            string_course(c, x, y, w, d)
        if s['buttress'] == 'stepped' and not crossing:
            for bx, lit in ((x - 3, True), (x + w - 5, False)):
                raised(c, bx, top + 18, 8, h - 18, d, 1 if lit else 2)
                for yy in stages + [top + 18]:
                    c.rect(bx, yy - 2, 8, 2, d[0]); c.rect(bx, yy, 8, 1, d[2])
            cast_right(c, x + w + 3, top + 20, base - 4, 5, 0.4)
        elif s['buttress'] in ('lesene', 'pilaster'):
            for bx in (x + 2, x + w - 7):
                lesene(c, bx, top + 4, base - 4, d if s['buttress'] == 'pilaster' else self.r)
            cast_right(c, x + w, top + 6, base - 4, 4, 0.34)
        else:
            cast_right(c, x + w, top + 6, base - 4, 5, 0.38)
        if campanile:
            # stage upon stage of arched openings, more of them as it rises,
            # under a low cap
            for k, n in enumerate((1, 2, 3)):
                ly = top + 14 + k * 30
                lw = (w - 10 - (n - 1) * 3) // n
                for j in range(n):
                    lx = x + 5 + j * (lw + 3)
                    for yy in range(ly, ly + 20):
                        for xx in range(lx, lx + lw):
                            if rounded(xx, yy, lx, ly + lw // 2, lw):
                                c.p(xx, yy, VOID)
                    if j:
                        raised(c, lx - 3, ly + lw // 2, 3, 20 - lw // 2, d, 1)
                string_course(c, x, ly + 22, w, d)
            corbel_table(c, x, x + w, top + 2, d)
            pyramid(c, x, top, w, self.tone, 18, self.roof_px, 'campanile')
            self.tower_box = (x, w)
            return
        if crossing:
            self.belfry(x, top + 6, w, 20)
            spire(c, x + w // 2, top - 4, w - 10, 70, RAMPS['lead'], 'broach', self.roof_px)
            return
        k = s['tower_win'] or ('lancet' if s['nave_win'] in ('tracery', 'perpendicular') else s['nave_win'])
        if k in ('lancet', 'roundhead', 'baroque'):
            window(c, k, x + w // 2, stages[0] + 16, 10 if k != 'baroque' else 12, round(h * 0.18), d, self.seed + 70, s['glass'])
        if s['clock']:
            clock(c, x + w // 2, stages[1] + (stages[0] - stages[1]) // 2, 7, d)
        self.belfry(x, top + 10, w, stages[1] - top - 16)
        t = s['tower_top']
        if t == 'battlement':
            battlements(c, x, top, w, d, True, s['turret'])
        elif t == 'spire':
            parapet(c, x, top, w, d, 'crenel')
            spire(c, x + w // 2, top - 4, w - 14, 96, RAMPS['lead'] if s['cover'] != 'plain' else RAMPS['slate'], 'broach', self.roof_px)
        elif t == 'needle':
            c.rect(x - 2, top - 2, w + 4, 3, d[0])
            spire(c, x + w // 2, top, w - 2, 120, COPPER, 'needle', self.roof_px)
        elif t == 'pyramid':
            pyramid(c, x, top, w, self.tone, 34, self.roof_px)
        elif t == 'onion':
            c.rect(x - 2, top - 3, w + 4, 4, d[0]); c.rect(x - 2, top + 1, w + 4, 1, d[3])
            onion(c, x + w // 2, top - 4, w - 8, self.roof_px)
        elif t == 'crow':
            gable(c, x + w // 2, top + 2, w + 4, 46, s['walls'], self.wall_ramp() or STONE['whitewash'], 'crow')
            finial(c, x + w // 2, top - 46, 'cock')
        elif t == 'saddleback':
            saddleback(c, x, top, w, self.tone, 22, self.roof_px)
        elif t == 'belfry':
            wooden_belfry(c, x, top, w, RAMPS['lead'], self.roof_px)
        self.tower_box = (x, w)

    def round_tower(self, x, base):
        """The round flint towers of East Anglia: a cylinder lit on the left,
        a belfry stage, a battlement."""
        c, s, d = self.c, self.s, self.d
        w, h = self.tower_w - 6, self.tower_h - 20
        top = base - h
        fm.flint(c, x, top, w, h)
        for xx in range(x, x + w):
            t = (xx - x) / w
            for yy in range(top, base):
                if t > 0.35:
                    shade(c, xx, yy, 0.5 * (t - 0.35))
                elif t < 0.25:
                    shade(c, xx, yy, 0.4 * (0.25 - t), (255, 244, 220, 255))
        for y in (base - round(h * 0.45), top + 30):
            for xx in range(x - 1, x + w + 1):
                c.p(xx, y, d[1]); c.p(xx, y + 1, d[3])
        for k in range(2):
            lx = x + w // 2 - 6 + k * 7
            for yy in range(top + 8, top + 24):
                for xx in range(lx, lx + 5):
                    if pointed(xx, yy, lx, top + 12, 5):
                        c.p(xx, yy, VOID)
        window(c, 'lancet', x + w // 2, base - round(h * 0.4), 6, 16, d, self.seed + 71)
        parapet(c, x, top, w, d, 'crenel')
        cast_right(c, x + w, top, base - 4, 5, 0.38)
        self.tower_w = w
        self.tower_box = (x, w)

    def belfry(self, x, y, w, h):
        c, s, d = self.c, self.s, self.d
        lw, gap = 9, 4
        total = 2 * lw + gap
        lx0 = x + (w - total) // 2
        lh = min(30, h - 6)
        romanesque = s['portal'] == 'round'
        shape = rounded if romanesque else pointed
        for k in range(2):
            lx = lx0 + k * (lw + gap)
            spring = y + (lw // 2 if romanesque else round(lw * 0.9))
            for yy in range(y - 6, y + lh):
                for xx in range(lx - 2, lx + lw + 2):
                    if shape(xx, yy, lx, spring, lw):
                        slat = (yy - y) % 4
                        c.p(xx, yy, (40, 32, 40, 255) if slat == 3 else OAK[5] if slat == 0 else OAK[6])
                    elif shape(xx, yy, lx - 2, spring, lw + 4):
                        c.p(xx, yy, d[1] if xx < lx + lw // 2 else d[3])
        raised(c, lx0 + lw + gap // 2 - 1, y + 2, 3, lh - 2, d, 1)
        c.rect(lx0 - 3, y + lh, total + 6, 2, d[0])
        c.rect(lx0 - 3, y + lh + 2, total + 6, 1, d[3])

    def bellcote(self, x, eave):
        c, d = self.c, self.d
        w, h = 16, 22
        y = eave - round(self.wall_h * self.pitch) + 4 - h
        raised(c, x, y, w, h, d, 1)
        for yy in range(y + 4, y + h - 2):
            for xx in range(x + 4, x + w - 4):
                if rounded(xx, yy, x + 4, y + 8, w - 8):
                    c.p(xx, yy, VOID)
        for k in range(5):
            c.rect(x + w // 2 - 1 - k // 2, y + 9 + k, 3 + k // 2 * 2, 1, GOLD[1 + k // 3])
        for i in range(-w // 2 - 2, w // 2 + 3):
            c.p(x + w // 2 + i, y - 6 + abs(i) * 6 // (w // 2 + 2), d[0] if i < 0 else d[3])
        finial(c, x + w // 2, y - 6, 'cross', d)

    def espadana(self, x, eave):
        """A Spanish bell-gable: the west wall carried up as a stepped screen
        pierced for its bells, a cross on top."""
        c, d, r = self.c, self.d, self.r
        w = 44
        rise = round(self.wall_h * self.pitch)
        foot = eave - rise + 6
        tiers = [(w, 24), (w - 16, 16), (12, 10)]
        y = foot
        for iw, ih in tiers:
            bx = x + (w - iw) // 2
            raised(c, bx, y - ih, iw, ih + (6 if y == foot else 0), r, 1)
            c.rect(bx - 1, y - ih - 2, iw + 2, 2, d[0])
            y -= ih
        for bx in (x + 8, x + w - 20):
            for yy in range(foot - 22, foot - 2):
                for xx in range(bx, bx + 12):
                    if rounded(xx, yy, bx, foot - 16, 12):
                        c.p(xx, yy, VOID)
            for j in range(5):
                c.rect(bx + 5 - j // 2, foot - 14 + j, 2 + j // 2 * 2, 1, GOLD[1 + j // 3])
        cast_right(c, x + w, y + 10, eave, 5, 0.4)
        finial(c, x + w // 2, y - 2, 'cross', d)

    # ---------------------------------------------------------------- porches

    def porch(self, x, base):
        c, s, d = self.c, self.s, self.d
        kind = s['porch']
        if kind == 'none':
            self.portal(x + 20, base, 22, 44)
            self.porch_cx = x + 20
            return
        if kind == 'loggia':
            lw = 66
            for k in range(3):
                ax = x + 4 + k * 20
                for yy in range(base - 34, base):
                    for xx in range(ax - 2, ax + 18):
                        if rounded(xx, yy, ax, base - 26, 16):
                            c.p(xx, yy, VOID if yy < base - 2 else mix(VOID, d[3], 0.3))
                        elif rounded(xx, yy, ax - 2, base - 26, 20):
                            c.p(xx, yy, d[1] if xx < ax + 8 else d[3])
                raised(c, ax - 3, base - 26, 3, 26, d, 1)
            px, _ = roof_band(c, x - 2, x + lw + 2, base - 36, 14, s['cover'], self.tone)
            self.roof_px |= px
            self.porch_cx = x + 34
            return
        w, h = 40, 48
        cx = x + w // 2
        rise = 22 if s['portal'] == 'round' else 26
        walls = s['walls'] if s['walls'] != 'striped' else 'limestone'
        r = self.wall_ramp(walls) or STONE['limestone']
        wall(c, x, base - h, w, h, walls, self.wall_ramp(walls))
        coping = 'crow' if kind == 'crow' else 'barge' if kind == 'timber' else 'stone'
        gable(c, cx, base - h, w, rise if coping != 'crow' else 30, walls, r, coping, self.tone, 12, self.roof_px)
        if coping != 'crow':
            finial(c, cx, base - h - rise - 2, 'cross', d)
        self.portal(cx, base, 22, 40)
        cast_right(c, x + w, base - h - rise // 2, base - 4, 6, 0.42)
        self.porch_cx = cx

    def portal(self, cx, base, dw, dh):
        """A doorway of moulded orders, the dark of the church beyond, a
        boarded inner door."""
        c, s, d = self.c, self.s, self.d
        dx = cx - dw // 2
        shape = rounded if s['portal'] == 'round' else pointed
        spring = base - dh + (dw // 2 if s['portal'] == 'round' else round(dw * 0.5))
        orders = 3 if s['portal'] == 'round' and s['corbels'] else 2
        for o in range(orders, -1, -1):
            ow = dw + o * 6
            for yy in range(base - dh - o * 4 - 10, base):
                for xx in range(dx - o * 3, dx - o * 3 + ow):
                    if shape(xx, yy, dx - o * 3, spring, ow):
                        if o == 0:
                            c.p(xx, yy, (34, 26, 34, 255) if yy < base - 6 else (48, 38, 44, 255))
                        else:
                            col = d[1] if xx < cx else d[3]
                            if s['portal'] == 'round' and o == 2 and (xx + yy) % 4 < 2:
                                col = d[0] if xx < cx else d[2]
                            c.p(xx, yy, col)
        for xx in range(dx + 5, dx + dw - 5):
            c.p(xx, base - 16, OAK[4] if (xx - dx) % 4 else OAK[6])
        for yy in range(base - 22, base - 4):
            c.p(dx + 6, yy, OAK[5]); c.p(dx + dw - 7, yy, OAK[5])

    # ---------------------------------------------------------------- stave

    def stave(self):
        """A Norwegian stave church: tiered steep roofs of tarred shingle
        stepping up to a ridge turret, dragon heads on the gables, an
        arcaded gallery round the foot."""
        c, base, x0 = self.c, self.base, self.x0
        tar = STONE['tar']
        tone = self.tone
        cx = x0 + self.W // 2
        tiers = [(self.W, 34, 24), (round(self.W * 0.66), 30, 28), (round(self.W * 0.4), 26, 28)]
        y = base
        for i, (tw, wh, rise) in enumerate(tiers):
            x = cx - tw // 2
            fm.boards(c, x, y - wh, tw, wh, tar)
            if i == 0:
                for ax in range(x + 2, x + tw - 10, 10):
                    for yy in range(y - wh + 6, y - 2):
                        for xx in range(ax, ax + 8):
                            if rounded(xx, yy, ax, y - wh + 10, 8):
                                c.p(xx, yy, VOID)
                    raised(c, ax - 2, y - wh + 10, 2, wh - 12, tar, 2)
            else:
                for k in range(2):
                    lx = x + tw // 3 * (k + 1) - 3
                    for yy in range(y - wh + 8, y - wh + 18):
                        for xx in range(lx, lx + 6):
                            if rounded(xx, yy, lx, y - wh + 11, 6):
                                c.p(xx, yy, VOID)
            px, top = roof_band(c, x - 6, x + tw + 6, y - wh, rise, 'shingle', tone)
            self.roof_px |= px
            finial(c, x - 15, top + 2, 'dragon')
            finial(c, x + tw + 6, top + 2, 'dragon')
            y = top + 4
        fm.boards(c, cx - 8, y - 18, 16, 18, tar)
        spire(c, cx, y - 18, 18, 30, tone, 'needle', self.roof_px)
        self.porch_cx = cx
        self.wall_h = 34
        self.portal(cx, base, 20, 30)
        self.finish(x0, base)
        return c.im


def church(style, size, **kw):
    return Church(style, size, **kw).build()


# ------------------------------------------------------------------ sheet

def make(out, zoom=2):
    from art.reference import current_adult
    adult = current_adult()
    rows = [
        [('English Gothic', 'english-gothic', 'medium'), ('East Anglian flint', 'english-flint', 'medium'),
         ('French Gothic', 'french-gothic', 'medium')],
        [('Romanesque', 'romanesque', 'medium'), ('Italian Romanesque', 'italian-romanesque', 'medium'),
         ('Mediterranean', 'mediterranean', 'medium')],
        [('Danish', 'danish', 'medium'), ('Norwegian stave', 'stave', 'medium'), ('Baltic brick Gothic', 'baltic-brick', 'medium')],
        [('Bavarian Baroque', 'baroque', 'medium'), ('English chapel', 'english-gothic', 'small'),
         ('Mediterranean chapel', 'mediterranean', 'small')],
        [('English great church', 'english-gothic', 'large'), ('Romanesque abbey', 'romanesque', 'large')],
    ]
    built = [[(n, church(st, sz, seed=i * 7 + j)) for j, (n, st, sz) in enumerate(row)] for i, row in enumerate(rows)]
    pad = 12
    W = max(sum(im.width for _, im in row) + pad * (len(row) + 1) + adult.width + pad for row in built)
    Hs = [max(im.height for _, im in row) + 20 for row in built]
    s = Image.new('RGBA', (W, sum(Hs)), (28, 24, 34, 255))
    y, labels = 0, []
    for row, H in zip(built, Hs):
        x = pad
        for n, im in row:
            s.alpha_composite(im, (x, y + H - im.height))
            labels.append((x, y + 4, n))
            x += im.width + pad
        s.alpha_composite(adult, (x, y + H - adult.height - 10))
        y += H
    s = s.resize((W * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    f = ImageFont.load_default(size=20)
    for x, yy, t in labels:
        d.text((x * zoom, yy * zoom), t, font=f, fill=(240, 220, 170))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out} {s.size}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-church.png')
