"""Civic buildings of pre-industrial Europe, front-on: town halls over open
arcades, brick town halls with crow-stepped frontispieces and copper clock
turrets, timber market halls raised on posts, schools, bath houses, union
halls.

    .venv/bin/python scripts/art/front_civic.py artifacts/front-civic.png

A civic building is an eave-front house (front_eave.EaveHouse) with civic
parts: an arcade or open post floor in place of the ground storey, a
frontispiece rising through the roof, a turret on the ridge, a niche.
"""
from pathlib import Path
import math
import json
import sys
import zlib

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_eave import EaveHouse, WALL  # noqa: E402
from art.front_house import bevel, brace  # noqa: E402
from art.front_parts import raised  # noqa: E402
from art.front_church import rounded, pointed, cast_right, cast_down, shade, gothic_window  # noqa: E402

OAK = RAMPS['oak']
COPPER = ramp(170, 0.07, lift=-0.04)
GOLD = ramp(80, 0.13)
DARK = (40, 30, 70, 255)


def clock(c, cx, cy, R=7, stone=None):
    s = stone or RAMPS['limestone']
    face = ramp(255, 0.06, lift=-0.18)
    for yy in range(-R - 2, R + 3):
        for xx in range(-R - 2, R + 3):
            d = math.hypot(xx, yy)
            if d <= R:
                c.p(cx + xx, cy + yy, face[3] if d > 2 else GOLD[1])
                if abs(d - R + 1.5) < 0.6 and round(math.degrees(math.atan2(yy, xx))) % 30 < 12:
                    c.p(cx + xx, cy + yy, GOLD[1])
            elif d <= R + 2:
                c.p(cx + xx, cy + yy, s[0] if xx + yy < 0 else s[3])
    for i in range(5):
        c.p(cx, cy - i, GOLD[0])
    for i in range(4):
        c.p(cx + i, cy, GOLD[1])


class CivicHall(EaveHouse):
    def __init__(self, spec):
        civic = dict(arcade=False, posts=False, frontispiece=None, turret=None, niche=False, wings=None, stair=False)
        for k in list(civic):
            if k in spec:
                civic[k] = spec[k]
        self.civic = civic
        super().__init__({k: v for k, v in spec.items() if k not in civic})
        if civic['frontispiece']:
            fw = max(44, round(self.W * 0.34)) if civic['frontispiece'] == 'crow' else max(48, round(self.W * 0.3))
            if civic['frontispiece'] == 'neck':
                fw = max(48, round(self.W * 0.3))
            cx = self.x0 + self.W // 2
            self.skip = (cx - fw // 2 - 10, cx + fw // 2 + 10)
        self.base += 30
        self.c = type(self.c)(self.c.w, self.base + 6)

    # ground storeys --------------------------------------------------------

    def openings(self):
        super().openings()
        top, h, _ = self.floors[0]
        if self.civic['arcade']:
            self.arcade(top, h)
        elif self.civic['posts']:
            self.open_posts(top, h)

    def arcade(self, top, h):
        """An open arcade: round arches on square piers, impost mouldings, the
        dark of the loggia behind with the market's stalls in it."""
        c, x0, W = self.c, self.x0, self.W
        r = RAMPS['limestone']
        n = max(3, W // 30)
        pitch = W / n
        spring = top + 18
        wall_body = mix(r[2], DARK, 0.1)
        for y in range(top + 4, self.base):
            for x in range(x0, x0 + W):
                c.p(x, y, r[1])
        for k in range(n):
            ax = round(x0 + k * pitch) + 5
            aw = round(pitch) - 10
            for y in range(top + 2, self.base):
                for x in range(ax - 3, ax + aw + 3):
                    if rounded(x, y, ax - 3, spring, aw + 6) and not rounded(x, y, ax, spring, aw):
                        col = r[1] if (x - ax) < aw // 2 else r[2]
                        ang = math.atan2(spring - y, x - (ax + aw / 2))
                        if y < spring and int((ang + math.pi) * 7) % 2:
                            col = r[0] if (x - ax) < aw // 2 else r[2]
                        c.p(x, y, col)
                    elif rounded(x, y, ax, spring, aw):
                        depth = y - (spring - aw // 2)
                        col = (40, 32, 42, 255) if depth < 10 else (54, 42, 48, 255)
                        c.p(x, y, col)
            # a stall in the loggia, under its awning, lit from the open side
            sy = self.base - 14
            c.rect(ax + 3, sy, aw - 6, 6, OAK[4]); c.rect(ax + 3, sy, aw - 6, 1, OAK[3])
            for gx in range(ax + 4, ax + aw - 4, 3):
                c.p(gx, sy - 1, [ramp(65, 0.12)[2], ramp(30, 0.12)[3], ramp(140, 0.09)[3]][int(h2(gx, k, 801) * 3)])
            cast_down(c, ax, ax + aw, spring - aw // 2 + 2, 5, 0.3)
        for k in range(n + 1):
            px = round(x0 + k * pitch) - 3
            op.raised(c, px, spring - 2, 6, self.base - spring + 2, r, 1)
            c.rect(px - 1, spring - 3, 8, 2, r[0])
            c.rect(px - 1, spring - 1, 8, 1, r[3])
        self.door_x = round(x0 + (n // 2 + 0.5) * pitch)

    def open_posts(self, top, h):
        """A market floor open under the hall: oak posts with knee braces, the
        jettied floor above, the shade beneath, stalls and sacks in it."""
        c, x0, W = self.c, self.x0, self.W
        for y in range(top, self.base):
            for x in range(x0, x0 + W):
                c.p(x, y, (52, 40, 44, 255) if y - top < 14 else (66, 52, 54, 255))
        n = max(3, W // 26)
        pitch = (W - 6) / n
        for k in range(n + 1):
            px = round(x0 + k * pitch)
            bevel(c, px, top, 6, self.base - top, OAK, 3)
            if k < n:
                brace(c, px + 6, top + 12, px + 14, top + 3, OAK, 3)
            if k > 0:
                brace(c, px - 8, top + 3, px, top + 12, OAK, 3)
        for k in range(n):
            sx = round(x0 + (k + 0.5) * pitch) - 8
            c.rect(sx, self.base - 12, 16, 5, OAK[4]); c.rect(sx, self.base - 12, 16, 1, OAK[2])
            for gx in range(sx + 1, sx + 15, 3):
                c.p(gx, self.base - 13, ramp(70, 0.08)[1])
        cast_down(c, x0, x0 + W, top, 8, 0.45)
        self.door_x = x0 + W // 2

    # above the roof ---------------------------------------------------------

    def turret(self):
        kind = self.civic['turret']
        if not kind:
            return
        c = self.c
        cx = self.x0 + self.W // 2
        ridge = self.top
        if kind == 'bellcote':
            r = RAMPS['limestone']
            x = self.x0 + 10
            op.raised(c, x, ridge - 22, 14, 20, r, 1)
            for yy in range(ridge - 18, ridge - 6):
                for xx in range(x + 3, x + 11):
                    if rounded(xx, yy, x + 3, ridge - 14, 8):
                        c.p(xx, yy, (40, 32, 40, 255))
            for k in range(4):
                c.rect(x + 6 - k // 2, ridge - 13 + k, 2 + k // 2 * 2, 1, GOLD[1 + k // 3])
            for i in range(-9, 10):
                c.p(x + 7 + i, ridge - 28 + abs(i) * 6 // 9, r[0] if i < 0 else r[3])
            return
        w = 16 if kind != 'cupola' else 14
        x = cx - w // 2
        # a boarded or stone stage standing on the ridge, its foot flashed
        body_h = 22
        stage = RAMPS['limestone'] if kind == 'clock-copper' else OAK
        y = ridge - body_h
        if kind == 'clock-copper':
            op.raised(c, x, y, w, body_h, stage, 1)
            clock(c, cx, y + 10, 5)
        else:
            for yy in range(y, ridge + 2):
                for xx in range(x, x + w):
                    c.p(xx, yy, OAK[2] if xx == x else OAK[5] if xx == x + w - 1 else OAK[3] if (xx - x) % 3 else OAK[4])
            for yy in range(y + 5, y + 16):
                for xx in range(x + 3, x + w - 3):
                    c.p(xx, yy, (40, 32, 40, 255) if (yy - y) % 3 == 0 else OAK[6])
        cast_right(c, x + w, y + 2, ridge + 2, 4, 0.3)
        c.rect(x - 2, y - 2, w + 4, 3, stage[1] if kind == 'clock-copper' else OAK[2])
        c.rect(x - 2, y + 1, w + 4, 1, stage[3] if kind == 'clock-copper' else OAK[5])
        # the cap
        cap = COPPER if kind in ('clock-copper', 'cupola') else RAMPS['slate']
        ch = 26 if kind == 'clock-copper' else 14 if kind == 'cupola' else 18
        for k in range(ch):
            t = k / ch
            if kind == 'clock-copper':
                half = (w / 2 + 2) * (0.25 + 0.75 * math.sin(math.pi * min(1, (1 - t) * 1.1)) ** 0.8)
            elif kind == 'cupola':
                half = (w / 2 + 1) * math.sqrt(max(0, 1 - (1 - t) ** 2))
            else:
                half = (w / 2 + 3) * t
            yy = y - 3 - ch + k
            for xx in range(round(cx - half), round(cx + half) + 1):
                col = cap[2] if xx < cx - half * 0.3 else cap[3] if xx < cx + half * 0.4 else cap[5]
                if kind != 'cupola' and k % 4 == 3:
                    col = cap[min(7, cap.index(col) + 1)]
                c.p(xx, yy, col)
        c.rect(cx, y - ch - 10, 1, 8, GOLD[2])
        c.rect(cx - 3, y - ch - 7, 4, 2, GOLD[1])
        c.p(cx + 1, y - ch - 11, GOLD[0])

    def frontispiece(self):
        kind = self.civic['frontispiece']
        if not kind:
            return
        c = self.c
        cx = self.x0 + self.W // 2
        if kind == 'neck':
            from art.front_parts import gable
            w = max(48, round(self.W * 0.3)) // 2 * 2
            fm.brick(c, cx - w // 2, self.eave, w, self.base - self.eave)
            gable(c, cx, self.eave + 2, w, self.eave - self.top + 30, 'brick', None, 'neck')
            cast_right(c, cx + w // 2, self.top - 20, self.base - 2, 5, 0.42)
            op.mullion_window(c, cx - 13, self.eave - 34, 3, 7, 22, True) if False else None
            from art.front_parts import window as pwin
            pwin(c, 'oculus', cx, self.top - 10, 14, 14, RAMPS['limestone'])
            op.door_panel(c, cx - 12, self.base - 46, 24, 46, 'green')
            self.door_x = cx
            return
        if kind == 'crow':
            # a crow-stepped brick gable standing through the roof, the steps
            # coped in stone, a door below and windows up its face
            w = max(44, round(self.W * 0.34)) // 2 * 2
            x = cx - w // 2
            top = self.top - 26
            steps = 5
            sh = (self.eave - top) // steps
            for k in range(steps + 1):
                inset = k * (w // 2 - 6) // steps
                y0 = self.eave - k * sh
                fm.brick(c, x + inset, y0 - sh, w - 2 * inset, sh + 1)
                s = RAMPS['limestone']
                c.rect(x + inset - 1, y0 - sh - 2, w - 2 * inset + 2, 2, s[0])
                c.rect(x + inset - 1, y0 - sh, w - 2 * inset + 2, 1, s[2])
            fm.brick(c, x, self.eave, w, self.base - self.eave)
            cast_right(c, x + w, top, self.base - 2, 5, 0.42)
            gothic_window(c, cx, top + 24, 12, 20, RAMPS['limestone'], 3)
            op.mullion_window(c, cx - 13, self.eave + 8, 3, 7, 22, True)
            dw = 24
            op.door_panel(c, cx - dw // 2, self.base - 46, dw, 46, 'oxblood')
            self.door_x = cx
        elif kind == 'pediment':
            # a classical centre: pilasters, an entablature, a pediment with
            # an oculus, a pedimented door
            s = RAMPS['limestone']
            w = max(48, round(self.W * 0.3))
            x = cx - w // 2
            for px in (x, x + w - 6):
                op.raised(c, px, self.eave - 2, 6, self.base - self.eave, s, 1)
            c.rect(x - 3, self.eave - 6, w + 6, 4, s[1]); c.rect(x - 3, self.eave - 6, w + 6, 1, s[0])
            rise = 18
            for yy in range(self.eave - 6 - rise, self.eave - 6):
                half = (yy - (self.eave - 6 - rise)) * (w / 2 + 3) / rise
                for xx in range(round(cx - half), round(cx + half)):
                    c.p(xx, yy, s[2])
            for i in range(-w // 2 - 4, w // 2 + 5):
                yy = self.eave - 6 - rise + round(abs(i) * rise / (w / 2 + 3)) - 2
                for k, idx in enumerate((0, 1, 3)):
                    c.p(cx + i, yy + k, s[idx if i < 0 else min(7, idx + 2)])
            for yy in range(-4, 5):
                for xx in range(-4, 5):
                    d = math.hypot(xx, yy)
                    if d <= 3:
                        c.p(cx + xx, self.eave - 14 + yy, op.GLASS[4])
                    elif d <= 4.5:
                        c.p(cx + xx, self.eave - 14 + yy, s[1] if xx + yy < 0 else s[3])
            cast_down(c, x - 2, x + w + 2, self.eave - 2, 3, 0.35)
            op.door_panel(c, cx - 12, self.base - 46, 24, 46, 'green')
            self.door_x = cx

    def cross_wings(self):
        """Gabled cross wings at both ends, square to the street: jettied in
        timber with bargeboards, or in stone or brick with copings."""
        kind = self.civic['wings']
        if not kind:
            return
        from art.front_parts import gable, finial
        c, s = self.c, self.s
        ww = max(40, round(self.W * 0.24)) // 2 * 2
        mat = s['storeys'][-1]
        for wx in (self.x0 - 6, self.x0 + self.W - ww + 6):
            cx = wx + ww // 2
            for i, (top, h, jet) in enumerate(self.floors):
                j = 3 if (kind == 'timber' and i > 0) else 0
                WALL[s['storeys'][i]](c, wx - j, top, ww + 2 * j, h)
                if kind == 'timber' and s['storeys'][i] in ('render', 'whitewash'):
                    self.framing(wx - j, top, ww + 2 * j, h, i)
                if j:
                    bevel(c, wx - j - 1, top + h - 5, ww + 2 * j + 2, 6, OAK, 3)
                    cast_down(c, wx, wx + ww, top + h + 1, 4, 0.6)
                wy = top + (12 if i else 14)
                wh = h - (24 if i else 28)
                if s['windows'][0] == 'mullion':
                    op.mullion_window(c, cx - 12, wy, 3, 6, wh, True)
                else:
                    op.FRAMES[s['windows'][0]][0](c, cx - 10, wy, 20, wh, None)
                    op.INFILLS[s['windows'][1]](c, cx - 10, wy, 20, wh, s.get('joinery') or 'white')
                    op.reveal(c, cx - 10, wy, 20, wh, 2)
            top = self.floors[-1][0]
            r = RAMPS['limestone']
            coping = 'barge' if kind == 'timber' else 'crow' if kind == 'crow' else 'stone'
            gable(c, cx, top, ww + (6 if kind == 'timber' else 0), round(ww * 0.62), mat if mat in ('render', 'brick', 'ashlar') else 'render',
                  None if mat == 'brick' else RAMPS['render'] if kind == 'timber' else r, coping, self.tone, 12, self.roof_px)
            if kind == 'timber':
                bevel(c, cx - 2, top - round(ww * 0.62) + 8, 4, round(ww * 0.62) - 8, OAK, 3)
            cast_right(c, wx + ww + 3, top - 20, self.base - 2, 5, 0.42)
        if self.door_x < self.x0 + ww or self.door_x > self.x0 + self.W - ww:
            self.door_x = self.x0 + self.W // 2

    def stair(self):
        """An outside stair to the hall on the upper floor: a flight of stone
        treads climbing left along the front on a rubble side wall, a rail,
        a door at the head."""
        if not self.civic['stair']:
            return
        c = self.c
        top, h, _ = self.floors[-1]
        r = RAMPS['limestone']
        g = RAMPS['granite']
        foot_x = self.x0 + self.W - 18
        land = top + h - 2
        rise = self.base - land
        steps = rise // 5
        run = 6
        # the side wall carrying the flight, in rubble
        for k in range(steps):
            x = foot_x - (k + 1) * run
            y = self.base - (k + 1) * 5
            fm.rubble(c, x, y + 2, run, self.base - y - 2, g)
        lx = foot_x - steps * run - 14
        fm.rubble(c, lx, land + 2, 14, self.base - land - 2, g)
        cast_right(c, foot_x, self.base - 6, self.base, 3, 0.35)
        # treads: each lit on top, its riser in shade
        for k in range(steps):
            x = foot_x - (k + 1) * run
            y = self.base - (k + 1) * 5
            c.rect(x - 1, y, run + 2, 2, r[0])
            c.rect(x - 1, y + 2, run + 2, 1, r[3])
        c.rect(lx - 1, land, 16, 2, r[0])
        c.rect(lx - 1, land + 2, 16, 1, r[3])
        # the iron rail along the outer edge
        for k in range(steps + 1):
            c.rect(foot_x - k * run, self.base - k * 5 - 12, 1, 10, op.IRON[3])
        for i in range(steps * run):
            c.p(foot_x - i, self.base - 12 - round(i * 5 / run), op.IRON[2])
        op.door_plank(c, lx - 2, land - 40, 18, 40)

    def niche(self):
        """A charity school's niche: a statue of a pupil in the school's blue
        coat, the founders' pride."""
        if not self.civic['niche']:
            return
        c, s = self.c, RAMPS['limestone']
        top, h, _ = self.floors[-1]
        cx = self.x0 + self.W // 2
        y = top + 6
        for yy in range(y, y + 24):
            for xx in range(cx - 7, cx + 7):
                if rounded(xx, yy, cx - 7, y + 7, 14):
                    c.p(xx, yy, s[1] if not rounded(xx, yy, cx - 5, y + 7, 10) else mix(s[3], DARK, 0.2))
        coat = ramp(258, 0.1, lift=-0.08)
        c.rect(cx - 2, y + 6, 4, 3, s[0])
        c.rect(cx - 3, y + 9, 6, 9, coat[3]); c.rect(cx - 3, y + 9, 2, 9, coat[2])
        c.rect(cx - 2, y + 18, 1, 3, s[2]); c.rect(cx + 1, y + 18, 1, 3, s[2])
        c.rect(cx - 6, y + 22, 12, 2, s[0])

    def build(self):
        s = self.s
        self.lean_to()
        self.walls()
        self.openings()
        self.roof()
        self.dormers()
        self.draw_stacks()
        self.cross_wings()
        self.stair()
        self.turret()
        self.frontispiece()
        self.niche()
        from art.front_weather import weather
        from art.front_kit import outline, consolidate
        x0, x1 = self.x0, self.x0 + self.W
        walls = {(x, y) for y in range(self.eave, self.base - 10) for x in range(x0, x1)}
        stone = {(x, y) for y in range(self.base - 10, self.base) for x in range(x0, x1)}
        weather(self.c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: self.eave, walls=walls,
                             stone=stone, sills=self.sills, chimneys=self.stack_boxes), s['wear'], s['seed'])
        self.roof_span = (x0 - self.over, x1 + self.over)
        self.stacks = [(x, w) for x, _, w in self.stack_boxes]
        outline(self.c)
        consolidate(self.c)
        return self.c.im


# The halls of halls.json that stand in pre-industrial European towns, each
# with regional variants: the frame variant number picks one.
HALL_STYLES = {
    'town-hall': [
        ('French arcaded hall', dict(storeys=['ashlar', 'ashlar'], roof='slate', tone='slate-blue', hip=True,
                                     arcade=True, turret='clock-copper', windows=('stone', 'casement'), stacks='ends',
                                     plinth=None, string=True, wear=0.35)),
        ('Italian broletto', dict(storeys=['brick', 'brick'], roof='pantile', tone='pantile', arcade=True,
                                  turret='bell', windows=('stone', 'casement'), stacks=None, plinth=None,
                                  string=True, wear=0.45)),
        ('Flemish stepped hall', dict(storeys=['brick', 'brick'], roof='slate', tone='slate-blue', arcade=True,
                                      frontispiece='crow', turret='clock-copper', windows=('mullion', 'leaded'),
                                      stacks='ends', plinth=None, string=True, wear=0.35)),
    ],
    'rathaus': [
        ('North German Rathaus', dict(storeys=['flemish', 'flemish'], roof='plain', tone='tile-red',
                                      windows=('mullion', 'leaded'), frontispiece='crow', turret='clock-copper',
                                      stacks='ends', plinth='ashlar', string=True, wear=0.35)),
        ('Dutch stadhuis', dict(storeys=['brick', 'brick'], roof='slate', tone='slate-blue', hip=True,
                                windows=('stone', 'sash'), frontispiece='neck', turret='cupola', stacks='ends',
                                plinth='ashlar', string=True, door='panel', wear=0.3)),
        ('Swiss timber Rathaus', dict(storeys=['ashlar', 'render'], frame=True, jetty=True, roof='plain',
                                      tone='tile-brown', windows=('timber', 'leaded'), turret='bell', wings='timber',
                                      stacks='one', wear=0.4)),
    ],
    'moot-hall': [
        ('English moot hall', dict(storeys=['render', 'render'], frame=True, studding='close', jetty=True, posts=True,
                                   roof='plain', tone='tile-brown', windows=('timber', 'leaded'), turret='bell',
                                   stacks=None, plinth=None, stair=True, wear=0.5)),
        ('Dutch weigh house', dict(storeys=['brick', 'brick'], roof='slate', tone='slate-blue', arcade=True,
                                   frontispiece='crow', turret='bell', windows=('mullion', 'leaded'), stacks=None,
                                   plinth=None, wear=0.4)),
        ('Swedish hall', dict(storeys=['falu', 'falu'], roof='plain', tone='tile-red', windows=('painted', 'casement'),
                              joinery='white', turret='bell', stacks='ends', plinth='rubble', wear=0.4)),
    ],
    'grammar-hall': [
        ('English grammar school', dict(storeys=['rubble'], heights=[62], roof='slate', tone='stone-slate',
                                        windows=('mullion', 'leaded'), turret='bellcote', stacks='one', wear=0.5)),
        ('Tudor schoolhouse', dict(storeys=['brick', 'render'], frame=True, studding='close', jetty=True, roof='plain',
                                   tone='tile-orange', windows=('timber', 'leaded'), wings='timber', turret='bell',
                                   stacks='one', wear=0.45)),
        ('Danish school', dict(storeys=['whitewash'], heights=[56], roof='thatch', tone='reed',
                               windows=('painted', 'casement'), joinery='white', turret='bellcote', stacks='one',
                               wear=0.5)),
    ],
    'charity-school': [
        ('Georgian charity school', dict(storeys=['flemish', 'flemish'], roof='slate', tone='slate-welsh', hip=True,
                                         windows=('stone', 'sash'), door='panel', turret='cupola', niche=True,
                                         quoins=True, string=True, plinth='ashlar', stacks='ends', wear=0.3)),
        ('Dutch orphanage', dict(storeys=['brick', 'brick'], roof='plain', tone='tile-black', windows=('stone', 'sash'),
                                 door='panel', frontispiece='neck', turret='cupola', niche=True, plinth='ashlar',
                                 stacks='ends', string=True, wear=0.3)),
        ('German Fachwerk school', dict(storeys=['ashlar', 'render'], frame=True, jetty=True, roof='plain',
                                        tone='tile-red', windows=('timber', 'casement'), wings='timber', turret='bell',
                                        stacks='one', wear=0.4)),
    ],
    'stew': [
        ('Medieval stew', dict(storeys=['render'], frame=True, roof='shingle', tone='shingle-silver',
                               windows=('timber', 'leaded'), stacks='ends', wear=0.7)),
        ('Finnish bath house', dict(storeys=['tar'], roof='shingle', tone='shingle', windows=('painted', 'casement'),
                                    joinery='white', stacks='one', plinth='rubble', wear=0.6)),
        ('German Badstube', dict(storeys=['ashlar', 'render'], frame=True, jetty=True, roof='plain', tone='tile-brown',
                                 windows=('timber', 'leaded'), stacks='ends', wear=0.6)),
    ],
    'bagnio': [
        ('London bagnio', dict(storeys=['render', 'render'], roof='slate', tone='slate-blue', hip=True,
                               windows=('stone', 'sash'), door='panel', frontispiece='pediment', quoins=True,
                               string=True, plinth='ashlar', stacks='ends', wear=0.35)),
    ],
    'union-hall': [
        ('Brick union hall', dict(storeys=['brick', 'brick'], roof='slate', tone='slate-welsh',
                                  windows=('stone', 'sash'), frontispiece='pediment', string=True, plinth='ashlar',
                                  stacks='ends', wear=0.3)),
    ],
}
HALLS = {k: v[0][1] for k, v in HALL_STYLES.items()}

LABELS = {'town-hall': 'Town hall over an arcade', 'rathaus': 'Brick Rathaus', 'moot-hall': 'Moot hall on posts',
          'grammar-hall': 'Grammar school', 'charity-school': 'Charity school', 'stew': 'Stew (bath house)',
          'bagnio': 'Bagnio', 'union-hall': 'Union hall'}


def make(out, zoom=2):
    from art.reference import current_adult
    adult = current_adult()
    rows = []
    for fam, variants in HALL_STYLES.items():
        rows.append([(label, CivicHall(dict(sp, W=190 if fam in ('town-hall', 'rathaus', 'moot-hall') else 160,
                                            seed=i)).build()) for i, (label, sp) in enumerate(variants)])
    pad = 12
    W = max(sum(im.width for _, im in row) + pad * (len(row) + 1) + adult.width + pad for row in rows)
    Hs = [max(im.height for _, im in row) + 20 for row in rows]
    s = Image.new('RGBA', (W, sum(Hs)), (28, 24, 34, 255))
    y, labels = 0, []
    for row, H in zip(rows, Hs):
        x = pad
        for n, im in row:
            s.alpha_composite(im, (x, y + H - im.height))
            labels.append((x, y + 4, n))
            x += im.width + pad
        s.alpha_composite(adult, (x, y + H - adult.height - 8))
        y += H
    s = s.resize((W * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    f = ImageFont.load_default(size=20)
    for x, yy, t in labels:
        d.text((x * zoom, yy * zoom), t, font=f, fill=(240, 220, 170))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out} {s.size}')


# ------------------------------------------------------------------ the game hook
# Churches and halls of pre-industrial European towns are drawn front-on at
# the adult's scale; footprints widen by about a third.
SCALE = 1.35
# Which style each regional look draws. The game picks the look by region
# from src/content/graphics/regional-looks.json; look i of a family is drawn
# in the style named there at position i.
LOOKS = json.loads((ROOT / 'src/content/graphics/regional-looks.json').read_text())['looks']
CHURCH_REGION = {
    # The parish church rule covers 900 to 1150: the Romanesque centuries.
    'parish-church': {
        'france': dict(style='romanesque'),
        'england': dict(style='romanesque', walls='limestone', dress='limestone', cover='plain', tone='tile-red'),
        'italy': dict(style='italian-romanesque'),
        'denmark': dict(style='danish', tower_top='pyramid'),
        'norway': dict(style='stave'),
        'germany': dict(style='romanesque', walls='red-sandstone', dress='red-sandstone'),
        'iberia': dict(style='mediterranean', walls='sandstone', tone='pantile'),
    },
    'gothic': {
        'france': dict(style='french-gothic'),
        'england': dict(style='english-gothic'),
        'germany': dict(style='french-gothic', walls='red-sandstone', dress='red-sandstone'),
        'east-anglia': dict(style='english-flint'),
        'baltic': dict(style='baltic-brick'),
        'denmark': dict(style='danish'),
        'norway': dict(style='stave'),
        'sweden': dict(style='danish', cover='shingle', tone='shingle-tar', tower_top='belfry'),
        'italy': dict(style='italian-romanesque', nave_win='tracery'),
        'iberia': dict(style='mediterranean'),
        'low-countries': dict(style='baltic-brick', cover='slate', tone='slate-blue'),
        'baroque': dict(style='baroque'),
    },
    'mission-church': {},
}
MISSION = [dict(style='mediterranean'), dict(style='mediterranean', walls='ochre', tone='pantile'),
           dict(style='mediterranean', layout='campanile', tower_top='campanile', walls='whitewash')]


def civic_spec(name, r):
    import re
    m = re.match(r'(religious|hall)-(.+)-(small|medium|large)-(\d+)(?:-(north|east|west))?$', name)
    if not m:
        return None
    kind, fam, size, v = m.group(1), m.group(2), m.group(3), int(m.group(4))
    fw, fh = r['footprint']
    nw = max(6, round(fw * SCALE))
    if kind == 'religious' and fam in CHURCH_REGION:
        looks = LOOKS.get(f'religious-{fam}')
        if looks:
            region = looks[v] if v < len(looks) and looks[v] else looks[0]
            base = CHURCH_REGION[fam][region]
        else:
            base = MISSION[v % len(MISSION)]
        spec = dict(base, size=size, W=nw * 16, seed=zlib.crc32(name.encode()) % 997)
        if spec.get('tone') == 'shingle-tar':
            from art.front_church import SHINGLE_TAR
            spec['tone'] = SHINGLE_TAR
        return dict(church=spec), (nw, fh)
    if kind == 'hall' and fam in HALL_STYLES:
        variants = HALL_STYLES[fam]
        spec = dict(variants[v % len(variants)][1], W=nw * 16, seed=zlib.crc32(name.encode()) % 997 + v)
        return dict(hall=spec), (nw, fh)
    return None


def regional_frames(recipes):
    """Every regional look of a family at every size it is drawn at: a
    look missing from the old catalogue copies that size's first frame."""
    import re
    added = 0
    for family, looks in LOOKS.items():
        firsts = {m.group(1): k for k in list(recipes) if (m := re.fullmatch(re.escape(family) + r'-(small|medium|large)-0', k))}
        for size, first in firsts.items():
            for i in range(len(looks)):
                name = f'{family}-{size}-{i}'
                if name not in recipes:
                    recipes[name] = dict(recipes[first])
                    added += 1
    return added


def adopt(recipes):
    regional_frames(recipes)
    n = 0
    for name, r in recipes.items():
        got = civic_spec(name, r)
        if not got:
            continue
        spec, (fw, fh) = got
        r['frontCivic'] = spec
        r['front'] = True
        # City-kit churches arrive as modern gold masters with a lit-room
        # layer; drawn front-on they have none, and they belong on the sacred
        # page with the other churches.
        r.pop('obliqueModern', None)
        if 'church' in spec:
            fam = name.split('-')[1] if name.startswith('religious-gothic') else r.get('family', 'parish')
            r['religious'] = True
            r.setdefault('family', fam)
            r.setdefault('recipe', 'gothic' if name.startswith('religious-gothic') else r.get('recipe'))
        r['footprint'] = [fw, fh]
        r['entrance'] = [fw // 2, fh]
        n += 1
    return n


_PAINTED = {}


class FrontCivicPainter:
    """What scripts/art/buildings.py needs from a painter. A frame's turned
    copies share its spec, so each spec is painted once."""

    def __init__(self, r, material=None):
        key = json.dumps(r['frontCivic'], sort_keys=True, default=str)
        if key in _PAINTED:
            self.__dict__.update(_PAINTED[key])
            return
        self._paint(r)
        _PAINTED[key] = dict(self.__dict__)

    def _paint(self, r):
        from art.front_church import Church
        spec = r['frontCivic']
        if 'church' in spec:
            s = dict(spec['church'])
            b = Church(style=s.pop('style'), size=s.pop('size'), **{k: v for k, v in s.items()})
            im = b.build()
            self.door_x, self.door_size = b.porch_cx, (22, 40)
            self.anchor_x = b.x0 + b.W // 2
        else:
            b = CivicHall(spec['hall'])
            im = b.build()
            self.door_x, self.door_size = b.door_x, (22, 44)
            self.anchor_x = b.x0 + b.W // 2
        self.image = im
        self.w, self.h = im.size
        self.door_ground = b.base + 1
        self.bottom = b.base + 1

    def render(self):
        return self.image


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-civic.png')
