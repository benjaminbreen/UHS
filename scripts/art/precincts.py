"""Precinct pieces: the stands, ranges and arcades round a court, arena or
market, each a building on the precinct's edge.

A precinct is drawn from one height map over its whole ground: every piece
samples the same function and renders only its own footprint, so neighbours
agree about what stands where. Each piece is drawn in the house projection
(art/oblique_style.py): walls square on, depth sheared up and to the right
and compressed into the deep return, so a stand sits beside a house as one
more oblique building. A drop toward the viewer is drawn as a front wall, a
drop to the east as the sheared right-hand wall; seat rows, podium, arcade
and awning are a matter of what `top` and `wall` return.

Pieces are kept about as deep as they are tall, as houses are, so the sprite
covers its own footprint.
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import INTERIOR, _rgb, dither, h2
from art.oblique_style import side_depth

ROOT = Path(__file__).resolve().parent.parent.parent

TRAVERTINE = ['#3b3530', '#6b6153', '#9d917c', '#c9bda2', '#e6dcc2', '#fbf4e0']
MARBLE = ['#3a3b44', '#6c6e78', '#a3a5ab', '#cfd0d0', '#ecebe6', '#ffffff']
TILE = ['#2e1714', '#5b2a1f', '#8a4029', '#b35b37', '#d27e52', '#eca276']
# Awning and pennant colours by look: Italy, the Greek east, the western
# provinces. Stripe, ground.
AWNINGS = [
    (['#4a0f12', '#7d1a1a', '#b3261e', '#d9473a', '#ee7a5e', '#f7ab8f'],
     ['#6b5c40', '#a38f63', '#cdb98a', '#e8d9ae', '#f6ecca', '#fffaea']),
    (['#101c3e', '#1e2f6a', '#27408b', '#3f63b5', '#6f93d6', '#a9c3ee'],
     ['#5e5c55', '#99968a', '#c9c6b8', '#e5e3d8', '#f5f3ec', '#ffffff']),
    (['#12301b', '#1f4d2b', '#2f6b3a', '#468c4f', '#6fb06f', '#a4d39c'],
     ['#6d4f17', '#a37a24', '#cf9f35', '#e0b53c', '#f0d06a', '#fbe79e']),
]
SKIN = [(196, 142, 104, 255), (150, 98, 66, 255), (112, 72, 50, 255)]
TUNICS = [(236, 228, 208), (178, 58, 44), (122, 82, 54), (70, 92, 140), (214, 170, 80), (96, 120, 70)]


def ramp(hexes):
    return [_rgb(c) for c in hexes]


def spec():
    return json.loads((ROOT / 'src/content/graphics/precincts.json').read_text())


class Heightfield:
    """One precinct's shape, sampled in plan pixels from its north-west corner.

    `height(x, y)` is the surface height or None for open ground; `top` and
    `wall` colour a surface and a south-facing drop."""

    def height(self, x, y):
        raise NotImplementedError

    def top(self, x, y, hgt, sx, sy):
        raise NotImplementedError

    def wall(self, x, y, hgt, above, sx, sy):
        raise NotImplementedError


class PrecinctPiece:
    """Renders the part of a precinct's height map under one piece."""

    def __init__(self, recipe, material):
        self.r = recipe
        fw, fh = recipe['footprint']
        self.W, self.Dz = fw * 16, fh * 16
        self.topdown = getattr(FIELDS[recipe['precinct']], 'topdown', False)
        self.sw = 0 if self.topdown else side_depth(fh, deep=True)
        ax, ay = recipe['at']
        self.px0 = ax * 16
        # Plan y of the piece's south edge, from the precinct's north edge.
        self.py1 = (ay + fh) * 16
        self.field = FIELDS[recipe['precinct']](recipe)
        self.ox = 4
        self.w = self.ox + self.W + self.sw + 4
        self.h = self.field.peak + (self.Dz if self.topdown else self.sw) + 60
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.smoke, self.overlays = [], []

    def zc(self, z):
        """A plan depth, compressed into the return; top-down keeps it whole."""
        return z if self.topdown else round(z * self.sw / self.Dz)

    def render(self):
        f = self.field
        H = f.height
        for z in range(self.Dz - 1, -1, -1):
            py = self.py1 - 1 - z
            zc, zn = self.zc(z), self.zc(z - 1)
            for i in range(self.W):
                x = self.px0 + i
                hgt = H(x, py)
                if hgt is None: continue
                sx, sy = self.ox + i + (0 if self.topdown else zc), self.G - hgt - zc
                self.put(sx, sy, f.top(x, py, hgt, sx, sy))
                # Toward the viewer: a front wall down to whatever is nearer.
                front = H(x, py + 1)
                base = self.G - (front or 0) - zn
                for yy in range(sy + 1, base):
                    self.put(sx, yy, f.wall(x, py, hgt - (yy - sy), hgt, sx, yy))
                # To the east: the sheared right-hand wall.
                east = H(x + 1, py)
                if not self.topdown and (east or 0) < hgt:
                    for yy in range(sy, self.G - (east or 0) - zc):
                        c = f.wall(x, py, hgt - (yy - sy), hgt, sx + 1, yy)
                        self.put(sx + 1, yy, tuple(round(v * .78) for v in c[:3]) + (255,))
        f.finish(self)
        box = self.im.getbbox() or (0, 0, self.w, self.h)
        cut = max(0, box[1] - 2)
        self.im = self.im.crop((0, cut, self.w, self.h))
        self.h -= cut
        self.G -= cut
        self.overlays = [[k, x, y - cut] for k, x, y in self.overlays]
        self.smoke = [[x, y - cut, k] for x, y, k in self.smoke]
        self.anchor_x = self.ox + self.W / 2
        if not hasattr(self, 'door_x'):
            self.door_x, self.bottom = round(self.anchor_x), self.G + cut
        self.bottom -= cut
        self.occlusion = [self.ox, 0, self.ox + self.W + self.sw // 2, self.G - 1]
        return self.im

    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h and c: self.px[x, y] = c

    def screen(self, x, py, hgt):
        """Where a plan point at a height lands in this piece's sprite."""
        zc = self.zc(self.py1 - 1 - py)
        return self.ox + x - self.px0 + (0 if self.topdown else zc), self.G - hgt - zc


# -- amphitheatre -------------------------------------------------------------

class Amphitheatre(Heightfield):
    """An oval cavea round a sand arena: podium, three bands of seats split by
    walkways, a gallery, an attic, and the awning over the upper seats.
    Outside, three storeys of arches and an attic carrying the awning masts."""

    # An oval reads true from straight above, so the arena is drawn top-down
    # rather than in the houses' shear.
    topdown = True

    def __init__(self, r):
        s = spec()['amphitheatre']['scales'][r['goldScale']]
        self.Wt, self.Ht = s['size'][0] * 16, s['size'][1] * 16
        p = {q['key']: q for q in s['pieces']}
        ew, nc = p['west']['footprint'][0] * 16, p['north']['footprint'][1] * 16
        sf = p['south-l']['footprint'][1] * 16
        self.gate = (p['south-l']['footprint'][0] * 16, p['south-r']['at'][0] * 16)
        self.cx = self.Wt / 2
        self.cy = (nc + self.Ht - sf) / 2
        self.ax, self.ay = self.cx - ew, self.cy - nc
        self.podium = 14
        self.seats = {'small': 36, 'medium': 48, 'large': 60}[r['goldScale']]
        self.attic = self.podium + self.seats + 14
        self.peak = self.attic + 30
        look = r.get('look', 0)
        self.stripe, self.cloth = (ramp(c) for c in AWNINGS[look])
        self.look = look
        self.tv, self.mb, self.tile = ramp(TRAVERTINE), ramp(MARBLE), ramp(TILE)
        self.rows = self.seats // 3

    def shape(self, x, y):
        dx, dy = x + .5 - self.cx, y + .5 - self.cy
        ry = self.cy if dy < 0 else self.Ht - self.cy
        eo = math.hypot(dx / self.cx, dy / ry)
        ea = math.hypot(dx / self.ax, dy / self.ay)
        if eo >= 1: return None
        if ea <= 1: return -1, 0, 0
        t = (1 - 1 / ea) / (1 / eo - 1 / ea)
        # Arc length round the ring, for arches, stairs and masts.
        ang = math.atan2(dy / ry, dx / self.cx)
        return t, ang, eo

    def height(self, x, y):
        s = self.shape(x, y)
        if s is None: return None
        t, ang, _ = s
        if t < 0: return 0
        return self.surface(t, ang)[0]

    def surface(self, t, ang):
        """Height and what is there, at a fraction t out from the arena."""
        if t < .03: return self.podium, 'balteus'
        if t < .78:
            u = (t - .03) / .75
            k = int(u * self.rows)
            hgt = self.podium + 1 + k * 3 + (3 if u > 1 / 3 else 0) + (3 if u > 2 / 3 else 0)
            if .62 < t < .78:
                awn = self.attic + 4 - (.78 - t) / .16 * 16
                if awn > hgt: return round(awn), 'awning'
            return hgt, 'seat'
        if t < .9: return self.attic - 4, 'gallery'
        return self.attic, 'attic'

    def arc(self, ang, rx, ry):
        return ang * (rx + ry) / 2

    def top(self, x, y, hgt, sx, sy):
        t, ang, eo = self.shape(x, y)
        tv = self.tv
        if t < 0: return tv[3]
        _, kind = self.surface(t, ang)
        s = self.arc(ang, self.cx, self.cy)
        if kind == 'awning':
            band = int(s // 14) % 2
            c = self.stripe if band else self.cloth
            u = (t - .62) / .16
            k = 4 if u > .7 else 3 if u > .3 else 2
            if int(s) % 14 == 0: k -= 1
            return c[max(0, k)]
        if kind == 'seat':
            stair = s % 44 < 3
            if stair: return tv[5] if (x + y) % 2 else tv[4]
            # Spectators: two pixels each, a head over a tunic, a seat apart.
            n = h2(x // 2, y // 2, 5)
            if n % 100 < 34 and x % 2 == 0:
                if y % 2 == 0: return SKIN[(n >> 4) % len(SKIN)]
                return TUNICS[(n >> 8) % len(TUNICS)] + (255,)
            return tv[4] if (x + hgt) % 7 else tv[3]
        if kind == 'gallery':
            return self.tile[3] if (int(s) % 6) else self.tile[2]
        if kind == 'attic':
            return tv[5] if t > .97 else tv[4]
        return self.mb[4]

    def wall(self, x, y, hgt, above, sx, sy):
        t, ang, eo = self.shape(x, y)
        tv, mb = self.tv, self.mb
        s = self.arc(ang, self.cx, self.cy)
        # How squarely this bit of curve faces the viewer, and the sun.
        face = math.cos(ang - math.pi / 2)
        lit = 1 if math.cos(ang - 2.2) > .2 else 0
        if t < 0 or t < .03:
            # Podium: marble revetment, a dark gate for the beasts now and then.
            if s % 70 < 8 and hgt < 11: return INTERIOR[0]
            return mb[4 if lit else 3] if hgt < self.podium - 2 else mb[5]
        if t < .78:
            kind = self.surface(t, ang)[1]
            if kind == 'awning':
                return self.stripe[2] if int(s // 14) % 2 else self.cloth[2]
            # A riser; the walkway walls carry the vomitoria.
            if s % 44 < 3: return tv[3]
            if (above - self.podium) % 3 == 0 and s % 44 > 18 and s % 44 < 26 and above - hgt < 3:
                return INTERIOR[0]
            return tv[2]
        if t < .9:
            return tv[2]
        return self.facade(s, hgt, lit)

    def facade(self, s, hgt, lit):
        """Three storeys of arches and an attic, orders stacked."""
        tv = self.tv
        storey = (self.attic - 12) / 3
        if hgt >= self.attic - 12:
            # Attic: pilasters, small square windows, corbels for the masts.
            k = (hgt - (self.attic - 12))
            if k > 10 or k < 1: return tv[5]
            p = s % 16
            if p < 2: return tv[5 if lit else 4]
            if 3 < k < 7 and 6 < p < 10: return INTERIOR[1]
            return tv[4 if lit else 3]
        level = int(hgt // storey)
        k = hgt - level * storey
        p = s % 16
        if k >= storey - 2:
            return tv[5] if k >= storey - 1 else tv[2]
        # Arch: 9px opening, round head.
        centre = 9.5
        if 3 <= p <= 11:
            dx = p - 7
            head = storey - 6
            inside = k < head - 1 or (dx * dx + (k - (head - 1)) ** 2 < 16 and k < head + 3)
            if inside:
                if level > 0 and 5 <= p <= 8 and k < 7 and (h2(s // 16, level) % 3 == 0):
                    return tv[5] if p < 7 else tv[3]
                if k < 2: return tv[2]
                return INTERIOR[1] if p > 5 else INTERIOR[2] if p > 3 else tv[2]
        # Pier with an engaged half column, lit on its left.
        if p < 1 or p > 14: return tv[4 if lit else 3]
        if p in (1, 2): return tv[5 if lit else 4]
        return tv[3 if lit else 2]

    def finish(self, piece):
        """Masts round the rim carry the awning ropes and a pennant each."""
        tv = self.tv
        key = piece.r['key']
        for i in range(0, piece.W, 3):
            for z in range(0, piece.Dz, 2):
                py = piece.py1 - 1 - z
                x = piece.px0 + i
                sh = self.shape(x, py)
                if not sh or sh[0] < .95 or sh[0] >= .99: continue
                s = self.arc(sh[1], self.cx, self.cy)
                if int(s) % 48 not in (0, 1) or h2(int(s) // 48, 7) % 2: continue
                sx, sy = piece.screen(x, py, self.attic)
                if not (4 <= sy < piece.h - 20): continue
                for k in range(1, 15):
                    piece.px[sx, sy - k] = _rgb('#5a4630')
                    piece.px[sx + 1, sy - k] = _rgb('#8b6a45')
                piece.overlays.append([f'pennant-{self.look}', sx + 2, sy - 15])
        if key == 'north':
            # The box: a raised podium at the middle, a gate below it.
            cx = piece.W // 2
            base = piece.G
            for i in range(cx - 14, cx + 14):
                for k in range(0, 32):
                    y = base - k
                    edge = i in (cx - 14, cx + 13)
                    c = self.mb[5] if k > 29 else self.mb[2] if edge else self.mb[4]
                    if 26 <= k <= 29: c = self.stripe[3]
                    piece.px[piece.ox + i, y] = c
            x0 = piece.ox + cx - DOOR_W // 2
            ImageDraw.Draw(piece.im).rectangle((x0, base - DOOR_H - 1, x0 + DOOR_W, base), fill=INTERIOR[0])
            piece.door_x, piece.bottom = piece.ox + cx, base
        if key in ('south-l', 'south-r'):
            piece.door_x = piece.ox + (piece.W - 24 if key == 'south-l' else 24)
            piece.bottom = piece.G


# -- ball court ---------------------------------------------------------------

class Ballcourt(Heightfield):
    """Two ranges either side of a plastered alley. The north one shows its
    sloping bench and sheer wall, with the ring; the south one its low outer
    wall, and over it the bench running down to the play."""

    def __init__(self, r):
        s = spec()['ballcourt']['scales'][r['goldScale']]
        self.Wt, self.Ht = s['size'][0] * 16, s['size'][1] * 16
        p = {q['key']: q for q in s['pieces']}
        self.n = p['north']
        self.s = p['south']
        self.nx0 = self.n['at'][0] * 16
        self.nx1 = self.nx0 + self.n['footprint'][0] * 16
        self.ny1 = self.n['footprint'][1] * 16
        self.sy0 = self.s['at'][1] * 16
        with open(ROOT / 'src/content/graphics/regional-houses.json') as fh:
            pal = json.load(fh)['profiles'][r['regionalProfile']]['palette']
        self.pl, self.red, self.st, self.acc = (ramp(pal[k]) for k in ('plaster', 'red', 'stone', 'accent'))
        self.maya = r['regionalProfile'] == 'maya'
        self.wall_h = 36 if r['goldScale'] != 'small' else 30
        self.peak = self.wall_h + 34
        self.temple = r['goldScale'] == 'large'
        mid = (self.nx0 + self.nx1) / 2
        # Flights up the north wall near each end, and one over the south
        # range's outer wall: the way the players and the lords went up.
        self.stairs_n = [(self.nx0 + 24, self.nx0 + 38), (self.nx1 - 26, self.nx1 - 12)]
        self.stairs_s = (mid + 30, mid + 44)

    def stair_n(self, x):
        return any(a <= x < b for a, b in self.stairs_n)

    def stair_s(self, x):
        return self.stairs_s[0] <= x < self.stairs_s[1]

    def height(self, x, y):
        if not self.nx0 <= x < self.nx1:
            # Wing walls round the end fields: the crossbars of the I.
            return 14 if y < 32 or y >= self.Ht - 32 else None
        if y < self.ny1:
            d = self.ny1 - y
            if d < 14: return round(d * .85)
            if self.stair_n(x) and d < 14 + (self.wall_h - 12) * 2 // 3:
                return min(self.wall_h, 12 + ((d - 14) // 2 + 1) * 3)
            if d < 16: return 12
            h = self.wall_h
            if not self.maya and d < 18 and (int(x) // 4) % 2 == 0:
                return h + 3
            # A range building on top, set back from the wall.
            mid = (self.nx0 + self.nx1) / 2
            half = (self.nx1 - self.nx0) * (.34 if self.maya else .16)
            if (self.temple or self.maya) and abs(x + .5 - mid) < half and 24 <= d < self.ny1 - 4:
                roof = h + 20
                back = (24 + self.ny1 - 4) / 2
                if self.maya and abs(d - back) < 1.5:
                    # A pierced comb along the ridge, sky through its slots.
                    k = int(x - mid) % 8
                    return roof + (6 if k in (3, 4) else 14)
                if not self.maya and d < 26 and (int(x) // 4) % 2 == 0:
                    return roof + 4
                return roof
            return h
        if y >= self.sy0:
            d = y - self.sy0
            if d < 14: return round(d * .85)
            out = self.Ht - 1 - y
            if self.stair_s(x) and out < 8: return min(16, (out // 2 + 1) * 4)
            return 16
        return None

    def top(self, x, y, hgt, sx, sy):
        pl, red = self.pl, self.red
        if not self.nx0 <= x < self.nx1:
            return red[3] if y % 32 in (0, 31) else pl[4] if x % 16 == 0 or y % 12 == 0 else pl[5]
        if (y < self.ny1 and self.stair_n(x) and hgt < self.wall_h) or \
                (y >= self.sy0 and self.stair_s(x) and self.Ht - 1 - y < 8):
            return pl[5]
        # Onlookers along the range tops.
        onlook = (y < self.ny1 and 18 <= self.ny1 - y < 30 and hgt == self.wall_h) or \
                 (y >= self.sy0 and y - self.sy0 >= 16 and hgt == 16)
        if onlook:
            n = h2(x // 2, y // 2, 11)
            if n % 100 < 14 and x % 3 == 0:
                return (SKIN[n % 3] if y % 2 == 0 else TUNICS[(n >> 8) % len(TUNICS)] + (255,))
        if hgt >= self.wall_h + 20:
            if self.maya: return red[4] if hgt > self.wall_h + 28 else red[3] if (x + y) % 7 else red[2]
            return pl[5] if hgt > self.wall_h + 22 else pl[4] if (x // 3 + y) % 9 else pl[3]
        if y < self.ny1 and self.ny1 - y < 16:
            return pl[5] if hgt > 10 else pl[4]
        if y >= self.sy0 and y - self.sy0 < 14:
            return pl[3] if (y - self.sy0) % 3 else pl[2]
        edge = (y < self.ny1 and self.ny1 - y < 18) or (y >= self.sy0 and y - self.sy0 >= 30)
        if edge: return red[3]
        # Plastered slabs, jointed.
        return pl[4] if x % 16 == 0 or y % 12 == 0 else pl[5]

    def wall(self, x, y, hgt, above, sx, sy):
        pl, red, acc = self.pl, self.red, self.acc
        if not self.nx0 <= x < self.nx1:
            return red[3] if hgt < 3 else pl[5] if hgt > 12 else pl[4] if x % 24 else pl[3]
        if (y < self.ny1 and self.stair_n(x) and above <= self.wall_h and self.ny1 - y >= 14) or \
                (y >= self.sy0 and self.stair_s(x) and self.Ht - 1 - y < 8):
            return pl[3] if above - hgt > 1 else pl[2]
        if above >= self.wall_h + 20 and hgt >= self.wall_h:
            # The range building's front: doorways into its rooms.
            k = hgt - self.wall_h
            if k > 20: return red[3] if self.maya else pl[4]
            if k > 16: return red[4] if self.maya else red[3]
            if k < 13 and (x - self.nx0) % 22 in range(8, 15): return INTERIOR[0]
            if k in (13, 14): return pl[4]
            return red[3] if self.maya else pl[4]
        if y < self.ny1 and self.ny1 - y < 14:
            return pl[4] if hgt > 1 else red[2]
        if y >= self.sy0 and y - self.sy0 < 14:
            return pl[3]
        if y < self.ny1:
            k = hgt
            if k < 3: return red[2]
            if above == self.wall_h and k >= self.wall_h - 8:
                # Frieze under the coping.
                i, j = (x - self.nx0) % 12, self.wall_h - 1 - k
                on = (i < 6) == (j < 4) if j < 7 else False
                return red[3] if on else pl[4]
            if above == self.wall_h: return pl[4] if (x - self.nx0) % 32 else pl[3]
            return pl[3]
        # South range outer wall.
        if hgt < 3: return red[3]
        if hgt > 13: return pl[5]
        return pl[4] if (x - self.nx0) % 24 else pl[3]

    def finish(self, piece):
        d = ImageDraw.Draw(piece.im)
        pl, st, red = self.pl, self.st, self.red
        if piece.r['key'] == 'north':
            # The ring, standing out from the wall at the middle of the court.
            mid = (self.nx0 + self.nx1) // 2
            for ring_x in ([mid] if not self.maya else [mid - 40, mid, mid + 40]):
                cx, cy = piece.screen(ring_x, self.ny1 - 16, 26 if not self.maya else 18)
                if self.maya:
                    # Maya courts mark the bench with carved panels instead.
                    cx, cy = piece.screen(ring_x, self.ny1 - 7, 6)
                    d.ellipse((cx - 5, cy - 3, cx + 5, cy + 3), fill=st[4], outline=st[2])
                    d.ellipse((cx - 2, cy - 1, cx + 2, cy + 1), outline=red[3])
                    continue
                for dx in range(-8, 9):
                    for dy in range(-8, 9):
                        rr = dx * dx + dy * dy
                        if 14 <= rr <= 52:
                            piece.px[cx + dx, cy + dy] = st[5] if dx + dy < -3 else st[4] if dx + dy < 4 else st[2]
                        elif rr < 14: piece.px[cx + dx, cy + dy] = INTERIOR[1]
                for k in range(1, 5): piece.px[cx + 6 + k // 2, cy + 4 + k] = pl[2]
            # A door into the range at its west end, level with the bench top.
            dx, dy = piece.screen(self.nx0 + 8, self.ny1 - 16, 12)
            piece.door_x, piece.bottom = dx + DOOR_W // 2, dy
            d.rectangle((dx, dy - DOOR_H - 1, dx + DOOR_W, dy), fill=INTERIOR[0])
            for bx in (self.nx0 + 4, self.nx1 - 5):
                self.brazier(piece, *piece.screen(bx, self.ny1 - 24, self.wall_h))
        elif piece.r['key'] == 'south':
            cx = piece.ox + piece.W // 2
            d.rectangle((cx - DOOR_W // 2 - 2, piece.G - DOOR_H - 3, cx + DOOR_W // 2 + 2, piece.G), fill=red[3])
            d.rectangle((cx - DOOR_W // 2, piece.G - DOOR_H - 1, cx + DOOR_W // 2, piece.G), fill=INTERIOR[0])
            piece.door_x, piece.bottom = cx, piece.G
            piece.overlays.append(['ball', cx + 40, piece.G - (piece.Dz - 4) - 24])

    def brazier(self, piece, sx, sy):
        clay = self.st
        for k, half in enumerate((1, 1, 1, 2, 3, 3, 3, 4)):
            for dx in range(-half, half + 1):
                piece.px[sx + dx, sy - k] = clay[5] if dx < 0 else clay[3]
        top = sy - 8
        for dx in range(-3, 4):
            piece.px[sx + dx, top] = (60, 22, 16, 255) if dx % 2 else (180, 60, 24, 255)
        piece.overlays.append(['flame', sx - 4, top - 11])
        piece.smoke.append([sx, top - 12, 'chimney'])


FIELDS = {'amphitheatre': Amphitheatre, 'ballcourt': Ballcourt}


def build_precinct_sprites(sprites):
    """Court markers set in the floor, and a pennant per awning look."""
    stone = ramp(['#2f2c38', '#58545d', '#86807d', '#b1a994', '#d3caae', '#efe7cc'])
    red = ramp(['#34101f', '#62182a', '#962a2d', '#c2432f', '#e0673f', '#f39661'])
    for v in range(3):
        im = Image.new('RGBA', (12, 8)); px = im.load()
        for x in range(12):
            for y in range(8):
                rr = ((x - 5.5) / 5.5) ** 2 + ((y - 3.5) / 3.5) ** 2
                if rr <= 1:
                    px[x, y] = stone[5] if x + y < 6 else stone[4] if rr < .55 else stone[2]
                    if .3 < rr < .55: px[x, y] = red[3] if v != 1 else stone[1]
        sprites[f'precinct-marker-{v}'] = im
    for look, (stripe, cloth) in enumerate(AWNINGS):
        s, c = ramp(stripe), ramp(cloth)
        for f in range(4):
            im = Image.new('RGBA', (10, 6)); px = im.load()
            for x in range(10):
                wave = round(math.sin(x / 2.2 + f * math.pi / 2) * (x / 9) * 1.4)
                length = 6 - x // 3
                for y in range(max(1, length)):
                    yy = min(5, max(0, y + wave + (0 if y < 3 else 0)))
                    col = s[3] if y < 2 else c[4]
                    if x > 7: col = s[2]
                    px[x, yy] = col
            sprites[f'animation-pennant-{look}-{f}'] = im


def precinct_recipes(root, source):
    data = spec()
    houses = json.loads((root / 'src/content/graphics/regional-houses.json').read_text())
    out = {}
    base = {'roof': 'flat', 'opening': 'door', 'attachments': [], 'roofMaterial': 'earth',
            'wall': 'lime-plaster', 'stories': 1, 'precinctPiece': True, 'height': 40,
            'oblique': True, 'deep': True}
    variants = {'ballcourt': [('nahua', 0), ('maya', 0)],
                'amphitheatre': [(None, 0), (None, 1), (None, 2)]}
    for kind, runs in variants.items():
        for scale, shape in data[kind]['scales'].items():
            for piece in shape['pieces']:
                if piece['key'] == 'shrine': continue
                fw, fh = piece['footprint']
                side = piece['key'].split('-')[0]
                entrance = {'west': [fw, fh // 2], 'east': [-1, fh // 2]}.get(side, [fw // 2, fh])
                for profile, look in runs:
                    tag = profile if profile else str(look)
                    name = f'precinct-{kind}-{tag}-{scale}-{piece["key"]}'
                    if kind == 'amphitheatre':
                        look = int(tag)
                    out[name] = {**base, 'precinct': kind, 'key': piece['key'], 'at': piece['at'],
                                 # A wing wall is a boundary, not a building anyone goes into.
                                 'enterable': piece['key'] not in ('nw', 'ne', 'sw', 'se'),
                                 'footprint': [fw, fh], 'entrance': entrance, 'goldScale': scale,
                                 'look': look, 'regionalProfile': profile, 'seed': 30000 + fw * 7 + fh,
                                 'oblique': kind != 'amphitheatre',
                                 'label': f"{data[kind]['label']} · {piece['key']} · {scale}",
                                 'description': f"Part of the {data[kind]['label'].lower()}."}
    return out
