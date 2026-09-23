"""Mesoamerican houses, granaries and sweat baths in the oblique view.

Every surface is a plane in a small world (X right, Y up, Z back) projected
as the other oblique painters project by hand: x + Z, ground - Y - Z. A face
is rasterised once and its shader is handed the world point under each pixel,
so thatch courses follow the eave round a hip, stair treads land on whole
pixels and a frieze sits on the wall it belongs to.

Structure comes from the family (jacal, terrace, service) and the scale;
everything cultural (ramps, parapets, friezes, door frames, vents, wall and
thatch forms) comes from the profile in regional-houses.json, picked by seed
and restrained by wealth tier. Illustrative reconstructions.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_style import OVER, VERGE, roof_rise, side_depth

BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
INTERIOR = [(21, 15, 22, 255), (33, 24, 30, 255), (48, 35, 38, 255)]


def dither(x, y, level):
    return BAYER[(y & 3) * 4 + (x & 3)] < level * 16


def _rgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def h2(*v):
    n = 0x9E3779B1
    for a in v:
        n = ((n ^ (int(a) & 0xFFFFFFFF)) * 0x85EBCA6B) & 0xFFFFFFFF
        n ^= n >> 13
    return n


# Stepped fret, the xicalcoliuhqui as it reads at six pixels: interlocking
# stepped hooks, one colour climbing into the other.
FRET = ["XXXXXX......",
        "X....X.XXXXX",
        "X.XX.X.X....",
        "X..X.X.X.XX.",
        "XXXX.XXX..X.",
        "..........X."]
# A long-nosed stucco mask panel for a Maya upper facade.
MASK = ["XXXXXXXXXX",
        "X........X",
        "X.OO..OO.X",
        "X.OO..OO.X",
        "X...NN...X",
        "X.XXNNXX.X",
        "X...NN...X",
        "XXXXNNXXXX",
        "....NN....",
        "....N....."]


class ObliqueMeso:
    # Screen px sideways per px of depth: 1 is the 45-degree return. A precinct
    # piece covers its whole footprint's depth and shears it into 12px.
    zx = 1

    def __init__(self, recipe, material):
        r = self.r = recipe
        rng = self.rng = random.Random(recipe['seed'] + 509)
        self.pal = {k: [_rgb(c) for c in v] for k, v in recipe['palette'].items()}
        self.profile = recipe['regionalProfile']
        self.maya = self.profile == 'maya'
        self.scale = recipe.get('goldScale', 'medium')
        self.tier = recipe.get('wealthTier', 1)
        self.kind = {'meso-jacal': 'jacal', 'meso-terrace': 'terrace'}.get(
            recipe['regionalHouse'], recipe.get('serviceStyle', 'granary'))
        fw, fh = recipe['footprint']
        self.W = fw * 16
        self.sw = self.D = side_depth(fh)
        facing = recipe.get('facing', 'south')
        slot = {'east': fw - 1, 'west': 0}.get(facing, recipe['entrance'][0])
        self.slot = max(0, min(fw - 1, slot))
        pick = lambda key: rng.choice(recipe.get(key) or [None])
        rich = self.tier >= 2 or (self.tier == 1 and rng.random() < .55)

        treatment = recipe.get('surfaceTreatments', ['lime'])[0]
        if self.tier >= 2:
            treatment = 'red' if self.maya and self.kind == 'terrace' and recipe['goldVariant'] % 2 == 0 else 'lime'
        self.treatment = treatment
        self.wallramp = self.pal[{'lime': 'plaster', 'red': 'red', 'ochre-wash': 'ochre',
                                  'bare-adobe': 'adobe'}.get(treatment, 'plaster')]
        self.dado = recipe.get('dado') and treatment in ('lime', 'ochre-wash') and rng.random() < .8
        self.parapet = pick('parapetStyles') if rich else recipe['parapetStyles'][0]
        self.frieze = pick('friezes') if (self.tier >= 2 or rich and self.scale != 'small') else None
        frames = recipe.get('doorFrames', ['timber'])
        self.doorframe = frames[min(len(frames) - 1, rng.randrange(self.tier + 1))]
        self.wallstyle = pick('wallStyles')
        self.thatchform = pick('thatchForms') or 'hip'
        self.feature = pick('roofFeatures')
        self.weathered = self.tier == 0 and rng.random() < .6
        self.thatch = self.pal['thatch-old' if self.weathered else 'thatch']
        self.colorway = rng.randrange(3)
        self.crest = 'comb' if recipe.get('goldVariant', 0) % 2 == 0 else 'merlons'
        self.upper = rng.choice(['masks', 'fret'])
        # Only where the house left beside it is still a house.
        self.ramada = (self.kind in ('jacal', 'terrace') and self.scale != 'large'
                       and fw >= 5 and self.slot >= 2 and rng.random() < .5)

        # Layout: a platform (ph high, the building set back `inset` on it),
        # then the walls and whatever roof the kind carries.
        big = self.scale == 'large'
        self.ph, self.inset = 0, 0
        if self.maya: self.ph, self.inset = (3, 2) if not big else (10, 5)
        elif big and self.kind == 'terrace': self.ph, self.inset = 8, 4
        elif self.kind == 'terrace' and self.scale == 'medium': self.ph, self.inset = 2, 1
        if self.kind in ('granary', 'sweatbath'): self.ph, self.inset = 3, 2
        self.x0 = 3 if self.ph and not big else 0
        self.x1 = self.W - self.x0
        if self.ramada: self.x0 += 20
        self.wh = {'jacal': 37, 'terrace': 38 + (3 if self.scale == 'medium' else 0),
                   'granary': 0, 'sweatbath': 26}[self.kind] + rng.choice([0, 0, 1, 2])
        self.vault = self.maya and big and self.kind == 'terrace'
        self.portico = (not self.maya) and big and self.kind == 'terrace'
        self.colonnade = self.maya and self.kind == 'terrace' and self.scale == 'medium' and self.tier >= 1
        self.roofmat = 'palm' if self.maya else 'zacate'
        self.rise = roof_rise(self.roofmat)

        self.ox = 8
        self.w = self.ox + self.W + self.D + 8
        self.h = 150
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.smoke, self.overlays = [], []

    # -- projection -------------------------------------------------------

    def P(self, X, Y, Z):
        return (round(self.ox + X + Z * self.zx), round(self.G - Y - Z))

    def face(self, pts, shader):
        """Fill a planar polygon given in world points; shader(X, Y, Z, x, y)."""
        scr = [self.P(*p) for p in pts]
        mask = Image.new('1', (self.w, self.h))
        ImageDraw.Draw(mask).polygon(scr, fill=1)
        box = mask.getbbox()
        if not box: return
        m = mask.load()
        O = pts[0]
        a = [pts[1][i] - O[i] for i in range(3)]
        b = [pts[-1][i] - O[i] for i in range(3)]
        ax, ay = a[0] + a[2] * self.zx, -(a[1] + a[2])
        bx, by = b[0] + b[2] * self.zx, -(b[1] + b[2])
        det = ax * by - bx * ay
        if not det: return
        sx, sy = self.ox + O[0] + O[2] * self.zx, self.G - O[1] - O[2]
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                if not m[x, y]: continue
                dx, dy = x + .5 - sx, y + .5 - sy
                s = (dx * by - bx * dy) / det
                t = (ax * dy - dx * ay) / det
                c = shader(O[0] + s * a[0] + t * b[0], O[1] + s * a[1] + t * b[1],
                           O[2] + s * a[2] + t * b[2], x, y)
                if c: self.px[x, y] = c

    def box(self, X0, X1, Y0, Y1, Z0, Z1, front, side, top):
        """An axis box: its top, right face and front, each a shader or None."""
        if top: self.face([(X0, Y1, Z0), (X1, Y1, Z0), (X1, Y1, Z1), (X0, Y1, Z1)], top)
        if side: self.face([(X1, Y0, Z0), (X1, Y0, Z1), (X1, Y1, Z1), (X1, Y1, Z0)], side)
        if front: self.face([(X0, Y0, Z0), (X1, Y0, Z0), (X1, Y1, Z0), (X0, Y1, Z0)], front)

    def flat(self, c):
        return lambda *_: c

    # -- materials --------------------------------------------------------

    def stone(self, lit, coarse=False):
        """Coursed blocks: lit top edge, dark joint below and at the right end."""
        ramp = self.pal['stone']
        porous = not self.maya

        def sh(X, Y, Z, x, y):
            course = 4 if not coarse else 5
            row = int(math.floor(Y / course)) if lit != 'top' else int(Z // 3)
            along = X + Z if lit != 'side' else Z + X * 0
            off = h2(row, 3) % 7
            length = 6 + h2(row, 1) % 4
            u = (along + off) % length
            v = (Y % course) if lit != 'top' else (Z % 3)
            base = 4 if lit == 'front' else 3 if lit == 'side' else 5
            if lit == 'top':
                return ramp[base] if (X + row) % 9 else ramp[4]
            if v < .99: return ramp[1]
            if v < 1.99: return ramp[min(5, base + 1)] if u > 1 else ramp[base]
            if u < 1: return ramp[base - 2]
            c = base - (1 if h2(row, int((along + off) // length)) % 5 == 0 else 0)
            if porous and h2(x, y) % 11 == 0: c -= 2
            return ramp[max(0, c)]
        return sh

    def plaster(self, ramp, front=True, top_y=None, shade_rows=0, damp=True):
        """Lime or earth wash: flat, lit toward the near corner, shaded under
        whatever overhangs it, darkened by splash at the foot."""
        base = 4 if front else 3
        ph = self.ph

        def sh(X, Y, Z, x, y):
            c = base
            if front and X - self.x0 < 1: c = base + 1
            if not front and Z > self.D - 3: c = base - 1
            if top_y is not None and Y > top_y - shade_rows:
                k = (Y - (top_y - shade_rows)) / max(1, shade_rows)
                c = base - 2 if k > .55 else (base - 1 if dither(x, y, k * 1.6) else c)
            if damp and Y - ph < 4 and dither(x, y + 1, (4 - (Y - ph)) / 6): c -= 1
            if self.treatment == 'bare-adobe':
                row = int((Y - ph) // 4)
                if (Y - ph) % 4 < 1 or (X + Z + row * 5) % 11 < 1: c -= 1
            return ramp[max(0, min(5, c))]
        return sh

    def thatch_shader(self, plane, ridge_y, eave_y, span):
        """Courses laid parallel to the eave, drawn a pixel at a time: each
        course is lit at its hanging fringe and darkens up into the shade of
        the course above; single-pixel stems run down it, and the fringe
        hangs ragged by a pixel or two over a line of shadow."""
        ramp = self.thatch
        base = 3 if plane == 'front' else 2
        step = 5.2
        L, R = span

        def sh(X, Y, Z, x, y):
            col = x if plane == 'front' else x - y
            k = (Y - eave_y) / step
            course = int(math.floor(k))
            n = h2(col, course)
            # The fringe hangs lower in some columns, never in blocks.
            drop = (0, 0, 1, 1, 2)[n % 5] / step
            f = k - course + drop
            if f >= 1: course += 1; f -= 1; n = h2(col, course)
            if f < .1: c = base - 2
            elif f < .24: c = base + 1
            elif f < .62: c = base
            else: c = base - 1
            # A stem in shadow now and then, a pixel wide and a course long.
            if .24 <= f < .9 and n % 9 == 0: c = base - 1
            if f < .24 and n % 13 == 0: c = base
            if plane == 'front':
                u = (X - L) / max(1, R - L)
                if u < .3 and .24 <= f < .62 and dither(x, y, (.3 - u) * 2): c += 1
                if u > .9 and f > .55: c -= 1
            if self.weathered and h2(x, y, 7) % 29 == 0: c -= 1
            return ramp[max(0, min(5, c))]
        return sh

    # -- elements ---------------------------------------------------------

    def platform(self):
        ph, W = self.ph, self.W
        if not ph: return
        stone = self.stone
        big = self.scale == 'large'
        self.box(0, W, 0, ph, 0, self.D, stone('front'), stone('side'), None)
        top = self.pal['stone'] if self.maya or not big else self.pal['plaster']
        self.face([(0, ph, 0), (W, ph, 0), (W, ph, self.D), (0, ph, self.D)],
                  lambda X, Y, Z, x, y: top[5] if Z < 1 or X > W - 1 else top[4] if (h2(X // 5, Z // 3) % 6) else top[3])
        if big and not self.maya:
            # Talud: a battered lower face under a projecting cornice.
            plaster = self.pal['plaster']
            self.face([(0, 0, 0), (W, 0, 0), (W, ph - 3, 0), (0, ph - 3, 0)],
                      lambda X, Y, Z, x, y: plaster[4] if Y > 1 else plaster[3])
            self.box(-1, W + 1, ph - 3, ph, -1, self.D, self.flat(self.pal['red'][3]),
                     self.flat(self.pal['red'][2]), self.flat(self.pal['plaster'][5]))
            self.d.line((self.P(-1, ph - 3, -1)[0], self.P(0, ph - 4, 0)[1] + 1,
                         self.P(W, 0, 0)[0], self.P(0, ph - 4, 0)[1] + 1), fill=plaster[2])
        if ph >= 6:
            self.stair()
        elif ph:
            cx = self.slot * 16 + 8
            self.box(cx - 8, cx + 8, 0, ph - 1, -1, 0, stone('front'), stone('side'), self.flat(self.pal['stone'][5]))

    def stair(self):
        """Cut into the platform face: two-pixel risers, one-pixel treads,
        steep as Mesoamerican stairs are, between sloping alfardas."""
        ph = self.ph
        st = self.pal['stone'] if self.maya else self.pal['plaster']
        cx = self.door_cx()
        a, b = cx - 9, cx + 9
        n = ph // 2
        for i in range(n):
            y0, z = i * 2, i * (self.inset / n)
            self.face([(a, y0, z), (b, y0, z), (b, y0 + 2, z), (a, y0 + 2, z)],
                      lambda X, Y, Z, x, y: st[3] if Y - int(Y) < .5 and int(Y) % 2 == 0 else st[4])
            self.face([(a, y0 + 2, z), (b, y0 + 2, z), (b, y0 + 2, z + self.inset / n), (a, y0 + 2, z + self.inset / n)],
                      self.flat(st[5]))
        for e in (a - 3, b):
            self.face([(e, 0, 0), (e + 3, 0, 0), (e + 3, ph + 1, self.inset), (e, ph + 1, self.inset)],
                      lambda X, Y, Z, x, y: st[5] if X < a else st[3])
            self.d.line((self.P(e + 3, 0, 0), self.P(e + 3, ph + 1, self.inset)), fill=st[1])

    def ramada_shed(self):
        """A pole-and-thatch shade against the left end: the outdoor room
        where most of the day's work was done."""
        tim, th = self.pal['timber'], self.thatch
        x1 = self.x0
        x0 = x1 - 20
        y0 = self.ph
        eave = y0 + 20
        z0 = self.inset
        for X in (x0 + 1, x0 + 11):
            for Z, tone in ((z0 + 1, tim[3]), (self.D - 2, tim[1])):
                self.box(X, X + 2, y0, eave, Z, Z + 1, self.flat(tone), self.flat(tim[0]), None)
        mat = self.pal['stone'][2]
        self.face([(x0, y0 + .1, z0), (x1, y0 + .1, z0), (x1, y0 + .1, self.D), (x0, y0 + .1, self.D)],
                  lambda X, Y, Z, x, y: None if dither(x, y, .5) else mat)
        roof = [(x0 - 2, eave, z0 - 2), (x1, eave + 6, z0 - 2), (x1, eave + 6, self.D), (x0 - 2, eave, self.D)]
        self.face(roof, lambda X, Y, Z, x, y: th[4] if int(Z) % 3 else th[3] if (x + y) % 3 else th[5])
        self.face([(x0 - 2, eave - 2, z0 - 2), (x1, eave + 4, z0 - 2), (x1, eave + 6, z0 - 2), (x0 - 2, eave, z0 - 2)],
                  lambda X, Y, Z, x, y: th[1] if h2(x) % 3 else th[2])

    def walls(self):
        x0, x1, ph, D, z0 = self.x0, self.x1, self.ph, self.D, self.inset
        top = ph + self.wh
        shade = 6 if self.kind == 'jacal' else 3
        ramp = self.wallramp
        style = self.wallstyle if self.kind == 'jacal' else 'plaster'
        if style == 'cane':
            front = self.cane(True, top)
            side = self.cane(False, top)
        else:
            front = self.plaster(ramp, True, top, shade)
            side = self.plaster(ramp, False, top, shade)
            if self.portico:
                lit = front
                front = lambda X, Y, Z, x, y: ramp[1] if Y > top - 6 else ramp[max(1, ramp.index(lit(X, Y, Z, x, y)) - 2)]
        wall_top = top + (4 if self.kind == 'terrace' and not self.vault else 0)
        self.face([(x1, ph, z0), (x1, ph, D), (x1, wall_top, D), (x1, wall_top, z0)], side)
        fz = z0 + (3 if self.portico else 0)
        self.face([(x0, ph, fz), (x1, ph, fz), (x1, wall_top, fz), (x0, wall_top, fz)], front)
        self.fz = fz
        self.top = top
        if style == 'daub-stone' or (self.maya and self.kind == 'jacal'):
            footing = 7 if style == 'daub-stone' else 4
            self.face([(x1, ph, z0), (x1, ph, D), (x1, ph + footing, D), (x1, ph + footing, z0)], self.stone('side'))
            self.face([(x0, ph, fz), (x1, ph, fz), (x1, ph + footing, fz), (x0, ph + footing, fz)], self.stone('front'))
        elif not self.maya and self.kind == 'terrace':
            self.face([(x1, ph, z0), (x1, ph, D), (x1, ph + 6, D), (x1, ph + 6, z0)], self.stone('side'))
            self.face([(x0, ph, fz), (x1, ph, fz), (x1, ph + 6, fz), (x0, ph + 6, fz)], self.stone('front'))
            self.dado_at = ph + 6
        if self.dado and style != 'cane':
            lo = getattr(self, 'dado_at', ph + (4 if self.maya else 0))
            red = self.pal['red']
            self.face([(x0, lo, fz), (x1, lo, fz), (x1, lo + 5, fz), (x0, lo + 5, fz)],
                      lambda X, Y, Z, x, y: red[4] if Y > lo + 4 else red[3] if X > x0 + 1 else red[2])
            self.face([(x1, lo, z0), (x1, lo, D), (x1, lo + 5, D), (x1, lo + 5, z0)],
                      lambda X, Y, Z, x, y: red[3] if Y > lo + 4 else red[2])
        # Corner: the front's last column turns into the side's first.
        self.d.line((self.P(x1, ph, z0), self.P(x1, wall_top, z0)), fill=ramp[2] if style != 'cane' else self.pal['timber'][1])
        self.d.line((self.P(x0, ph, fz), self.P(x0, wall_top - 1, fz)), fill=ramp[5] if style != 'cane' else self.pal['timber'][4])
        g = self.P(x0, ph, fz)
        self.d.line((g[0], g[1], self.P(x1, ph, fz)[0], g[1]), fill=ramp[1])

    def cane(self, front, top):
        """Canes or reed stems bound upright, lashed twice, daub in the gaps."""
        tim, th = self.pal['timber'], self.thatch
        ph = self.ph

        def sh(X, Y, Z, x, y):
            u = int(X if front else Z * 1.5)
            lash = Y - ph in (8, 9, 19, 20)
            k = u % 3
            c = [4, 3, 1][k] if front else [3, 2, 0][k]
            if lash: return tim[2] if front and k != 2 else tim[1]
            if h2(u) % 9 == 0: c -= 1
            if Y > top - 6: c -= 1 if dither(x, y, (Y - top + 6) / 5) else 0
            return th[max(0, min(5, c))] if h2(u, 3) % 4 else tim[max(0, c)]
        return sh

    def door_cx(self):
        return max(self.x0 + 9, min(self.x1 - 9, self.slot * 16 + 8))

    def doorway(self):
        """The opening, a curtain rolled above it, and a frame by profile."""
        gx, gy = self.door_x, self.bottom
        x, top = gx - DOOR_W // 2, gy - DOOR_H - 1
        d, ramp = self.d, self.wallramp
        red, tim, acc = self.pal['red'], self.pal['timber'], self.pal['accent']
        # Reveal: the wall's thickness, lit on the right jamb, shaded on the left.
        d.rectangle((x - 2, top - 1, x + DOOR_W + 1, gy), fill=ramp[2])
        d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        for yy in range(top, gy + 1):
            d.point((x + DOOR_W + 1, yy), fill=ramp[4]); d.point((x - 1, yy), fill=ramp[1])
            for xx in range(x + 1, x + 4):
                if dither(xx, yy, .6 - (xx - x) * .18): d.point((xx, yy), fill=INTERIOR[2])
        d.line((x, top + 1, x + DOOR_W, top + 1), fill=INTERIOR[1])
        # The rolled cotton curtain.
        roll = acc if self.tier >= 1 else self.pal['plaster']
        d.rectangle((x, top, x + DOOR_W, top + 2), fill=roll[3])
        d.line((x, top, x + DOOR_W, top), fill=roll[4]); d.line((x, top + 2, x + DOOR_W, top + 2), fill=roll[1])
        for xx in range(x + 1, x + DOOR_W, 3): d.point((xx, top + 1), fill=red[3] if self.tier else roll[2])
        f = self.doorframe
        if f == 'timber':
            d.rectangle((x - 4, top - 4, x + DOOR_W + 4, top - 2), fill=tim[3])
            d.line((x - 4, top - 4, x + DOOR_W + 4, top - 4), fill=tim[4])
            d.line((x - 4, top - 1, x + DOOR_W + 4, top - 1), fill=ramp[1])
            d.point((x - 4, top - 2), fill=tim[2]); d.point((x + DOOR_W + 4, top - 2), fill=tim[1])
        elif f in ('red-frame', 'moulded'):
            c = red if f == 'red-frame' else ramp
            d.rectangle((x - 4, top - 4, x - 3, gy), fill=c[3]); d.line((x - 4, top - 4, x - 4, gy), fill=c[4])
            d.rectangle((x + DOOR_W + 2, top - 4, x + DOOR_W + 3, gy), fill=c[2])
            d.rectangle((x - 4, top - 4, x + DOOR_W + 3, top - 2), fill=c[3])
            d.line((x - 4, top - 4, x + DOOR_W + 3, top - 4), fill=c[5] if f == 'moulded' else c[4])
            d.line((x - 3, top - 1, x + DOOR_W + 2, top - 1), fill=c[1])
            if f == 'moulded':
                d.line((x - 6, top - 6, x + DOOR_W + 5, top - 6), fill=ramp[5])
                d.line((x - 6, top - 5, x + DOOR_W + 5, top - 5), fill=ramp[2])
        elif f == 'fret-lintel':
            lx0, lx1 = x - 6, x + DOOR_W + 6
            d.rectangle((lx0, top - 8, lx1, top - 2), fill=self.pal['stone'][4])
            for i in range(lx1 - lx0 - 1):
                for j in range(5):
                    if FRET[j][(i + 3) % 12] == 'X':
                        d.point((lx0 + 1 + i, top - 7 + j), fill=red[3])
            d.line((lx0, top - 8, lx1, top - 8), fill=self.pal['stone'][5])
            d.line((lx0, top - 1, lx1, top - 1), fill=self.pal['stone'][1])
        elif f == 'colonnade':
            pass
        # Threshold stone.
        d.line((x - 2, gy + 1, x + DOOR_W + 2, gy + 1), fill=self.pal['stone'][5])

    def vents(self):
        """Few openings: small square vents high up, or the T-shaped ik'."""
        style = self.r.get('windowStyle')
        if self.kind != 'terrace' or style in (None, 'none') or (self.frieze and not self.vault): return
        d, ramp = self.d, self.wallramp
        y = self.top - (12 if style == 't-vent' else 9)
        cx = self.door_x
        spots = [s * 16 + 8 for s in range(self.W // 16)]
        spots = [s for s in spots if abs(self.P(s, 0, self.fz)[0] - cx) > 18 and self.x0 + 6 < s < self.x1 - 6]
        for s in spots[::2 if len(spots) > 3 else 1]:
            x, yy = self.P(s, y, self.fz)
            if style == 't-vent':
                d.rectangle((x - 3, yy - 6, x + 3, yy - 4), fill=INTERIOR[0])
                d.rectangle((x - 1, yy - 4, x + 1, yy), fill=INTERIOR[0])
                d.line((x - 3, yy - 7, x + 3, yy - 7), fill=ramp[2])
                d.line((x + 2, yy - 3, x + 2, yy), fill=ramp[5]); d.line((x - 2, yy + 1, x + 2, yy + 1), fill=ramp[5])
            else:
                d.rectangle((x - 2, yy - 3, x + 1, yy), fill=INTERIOR[0])
                d.line((x - 2, yy - 4, x + 1, yy - 4), fill=ramp[2])
                d.line((x - 2, yy + 1, x + 2, yy + 1), fill=ramp[5]); d.point((x + 2, yy - 3), fill=ramp[5])

    def beams(self):
        """Vigas carrying the flat roof run out through the wall."""
        if self.kind != 'terrace' or self.vault: return
        tim = self.pal['timber']
        y = self.top - 3
        for X in range(self.x0 + 5, self.x1 - 3, 9 if self.maya else 8):
            x, yy = self.P(X, y, self.fz)
            self.d.rectangle((x, yy, x + 1, yy + 1), fill=tim[2]); self.d.point((x, yy), fill=tim[4])
            for k in range(1, 4):
                if dither(x + k, yy + k, .75 - k * .15):
                    self.d.point((x + 1 + k // 2, yy + 1 + k), fill=self.wallramp[2])

    def band(self, y0, h, pattern, fg, bg, z=None, x0=None, x1=None):
        """A painted frieze on the front wall."""
        z = self.fz if z is None else z
        x0 = self.x0 if x0 is None else x0
        x1 = self.x1 if x1 is None else x1

        def sh(X, Y, Z, x, y):
            i, j = int(X - x0), int(y0 + h - Y)
            if pattern == 'fret':
                on = FRET[min(5, max(0, j - (h - 6) // 2))][(i + 2) % 12] == 'X' if 0 < j < h else False
            elif pattern == 'disks':
                cx, cy = (i % 10) - 4.5, j - h / 2
                rr = cx * cx + cy * cy
                if rr < 5.5: return fg[5] if cx < -.5 and cy < 0 else fg[3] if rr > 1.5 else bg[4]
                on = False
            else:
                on = j in (1, 2) or j in (h - 2, h - 3)
            if j == 0: return bg[5]
            if j >= h - 1: return bg[1]
            return (fg[3] if on else bg[4]) if X > x0 + 1 else (fg[2] if on else bg[3])
        self.face([(x0, y0, z), (x1, y0, z), (x1, y0 + h, z), (x0, y0 + h, z)], sh)
        self.face([(x1, y0, z), (x1, y0, self.D), (x1, y0 + h, self.D), (x1, y0 + h, z)],
                  lambda X, Y, Z, x, y: bg[2] if int(y0 + h - Y) not in (0,) else bg[4])

    def colours(self):
        """Figure and ground for a frieze: red on lime, lime on red, or turquoise."""
        p = self.pal
        if self.treatment == 'red': return p['plaster'], p['red']
        return [(p['red'], p['plaster']), (p['accent'], p['plaster']), (p['plaster'], p['red'])][self.colorway]

    # -- roofs ------------------------------------------------------------

    def thatch_roof(self):
        x0, x1, D, z0 = self.x0, self.x1, self.D, self.inset
        eave = self.top + 1
        rise = self.rise
        o, v = OVER, VERGE
        zc = (z0 + D) / 2
        ridge = eave + rise
        th = self.thatch
        a = min((x1 - x0) / 2 - 3, (zc - z0 + o) * (.9 if self.thatchform == 'hip' else .45))
        L, R = x0 - o, x1 + o
        front = [(L, eave, z0 - o), (R, eave, z0 - o), (x1 - a, ridge, zc), (x0 + a, ridge, zc)]
        side = [(R, eave, z0 - o), (R, eave, D + o), (x1 - a, ridge, zc)]
        self.face(side, self.thatch_shader('side', ridge, eave, (L, R)))
        self.face([(R, eave - 3, z0 - o), (R, eave - 3, D + o), (R, eave, D + o), (R, eave, z0 - o)],
                  lambda X, Y, Z, x, y: th[1] if h2(int(Z)) % 3 else th[0])
        self.face(front, self.thatch_shader('front', ridge, eave, (L, R)))
        # Hem: the cut ends at the eave, then the shade the overhang lays on the wall.
        self.face([(L, eave - 3, z0 - o), (R, eave - 3, z0 - o), (R, eave, z0 - o), (L, eave, z0 - o)],
                  lambda X, Y, Z, x, y: th[4] if Y > eave - 1 and x % 3 else th[3] if Y > eave - 2 and h2(x) % 3 else th[1] if h2(x, 3) % 4 else th[0])
        for X in range(int(L), int(R)):
            if h2(X, 91) % 4 == 0:
                sx, sy = self.P(X, eave - 3, z0 - o)
                self.px[sx, sy + 1] = th[1]
        # Ridge: a rolled cap of grass bundles, pinned with crossed stakes.
        rx0, rx1 = x0 + a - 1, x1 - a
        p0, p1 = self.P(rx0, ridge, zc), self.P(rx1, ridge, zc)
        cap = th
        for k, c in ((-2, cap[4]), (-1, cap[3]), (0, cap[2]), (1, cap[0])):
            self.d.line((p0[0] - (k < 0), p0[1] + k, p1[0] + (k < 0), p1[1] + k), fill=c)
        self.d.line((p0[0], p0[1] - 2, p0[0] + (p1[0] - p0[0]) // 3, p0[1] - 2), fill=cap[5])
        tim = self.pal['timber']
        for x in range(p0[0] + 3, p1[0] - 1, 7 if self.maya else 6):
            self.d.point((x - 1, p0[1] - 3), fill=tim[4]); self.d.point((x + 1, p0[1] - 3), fill=tim[2])
            self.d.point((x, p0[1] - 2), fill=tim[3])
        # The eave's shadow on the wall, deep under the hem, falling off.
        self.eave_shadow(eave - 3)
        sx, sy = self.P((x0 + x1) / 2 + 4, ridge, zc)
        self.smoke.append([sx, sy - 1, 'vent'])
        self.roof_top = sy - 4

    def eave_shadow(self, y_under):
        x0, x1, fz = self.x0, self.x1, self.fz
        ramp = self.wallramp if self.wallstyle != 'cane' else self.thatch
        for X in range(int(x0), int(x1)):
            for k in range(1, 5):
                sx, sy = self.P(X, y_under - k, fz)
                if 0 <= sx < self.w and 0 <= sy < self.h and self.px[sx, sy][3] and (k < 3 or dither(sx, sy, .55 - (k - 3) * .3)):
                    if self.px[sx, sy][:3] not in [c[:3] for c in INTERIOR]:
                        self.px[sx, sy] = ramp[1] if k < 2 else ramp[2]

    def terrace_roof(self):
        """A beaten-earth deck behind a parapet with thickness."""
        x0, x1, D, z0, fz = self.x0, self.x1, self.D, self.inset, self.fz
        top = self.top
        pp = 4
        ramp = self.wallramp
        if self.portico:
            self.portico_front(top, pp)
        rim = ramp[5]
        for rect in ((x0, x1, D - 2, D), (x0, x0 + 2, z0, D), (x0, x1, z0, z0 + 2), (x1 - 2, x1, z0, D)):
            a, b, c, e = rect
            self.face([(a, top + pp, c), (b, top + pp, c), (b, top + pp, e), (a, top + pp, e)],
                      lambda X, Y, Z, x, y: rim if Z < z0 + 1 or X < x0 + 1 else ramp[4])
        self.d.line((self.P(x0, top + pp, z0), self.P(x1, top + pp, z0)), fill=ramp[5])
        self.roof_top = self.P(0, top + pp, D)[1]
        self.merlons(top + pp, z0)
        self.furniture(top, z0)
        # The coping lip throws a line of shade on the wall under it.
        for X in range(int(x0), int(x1)):
            sx, sy = self.P(X, top + pp - 1, fz)
            if self.px[sx, sy][3] and X > x0: self.px[sx, sy] = ramp[3]

    def deck(self, top, pp, z0):
        x0, x1, D = self.x0, self.x1, self.D
        ramp, deck = self.wallramp, self.pal['adobe']
        self.face([(x0, top, z0), (x1, top, z0), (x1, top, D), (x0, top, D)],
                  lambda X, Y, Z, x, y: deck[2] if dither(x, y, max(.85 - (D - Z - 2) * .3, .8 - (X - x0 - 2) * .25, 0))
                  else deck[3] if (h2(x // 2, y) % 13) else deck[2])
        # Inner faces of the far and left parapets.
        self.face([(x0, top, D - 2), (x1, top, D - 2), (x1, top + pp, D - 2), (x0, top + pp, D - 2)], self.flat(ramp[3]))
        self.face([(x0 + 2, top, z0), (x0 + 2, top, D - 2), (x0 + 2, top + pp, D - 2), (x0 + 2, top + pp, z0)], self.flat(ramp[4]))

    def portico_front(self, top, pp):
        """Square stuccoed piers carrying the roof in front of a shaded porch."""
        x0, x1, z0, ph = self.x0, self.x1, self.inset, self.ph
        ramp, red = self.pal['plaster'], self.pal['red']
        span = x1 - x0
        n = max(3, span // 20)
        # Beam over the piers, then the piers themselves.
        self.box(x0, x1, top - 4, top + pp, z0, z0 + 3, self.plaster(ramp, True), self.flat(ramp[3]), None)
        for i in range(n + 1):
            X = x0 + round(i * (span - 5) / n)
            if abs(X + 2 - (self.slot * 16 + 8)) < 9: continue
            self.box(X, X + 5, ph, top - 4, z0, z0 + 2,
                     lambda Xx, Y, Z, x, y: (red[3] if Y < ph + 6 else ramp[5] if Xx < X + 1.5 else ramp[4]),
                     self.flat(ramp[2]), None)
            # The pier's shadow on the porch floor and back wall.
            for k in range(2, 6):
                sx, sy = self.P(X + 5 + k // 2, ph + 1, z0 + 2 + k // 2)
                if dither(sx, sy, .7): self.px[sx, sy] = ramp[1]

    def merlons(self, y, z0):
        """Almenas along the front and right coping: stepped blocks, cut
        shells, or the Maya apron moulding in their place."""
        style = self.parapet
        x0, x1, D = self.x0, self.x1, self.D
        ramp = self.wallramp
        if style in ('moulding', 'double-moulding'):
            fz = self.fz
            rows = [y - 3] + ([y - 8] if style == 'double-moulding' else [])
            for yy in rows:
                self.box(x0 - 1, x1 + 1, yy - 2, yy, fz - 1, D, self.flat(ramp[5]), self.flat(ramp[3]), None)
                self.face([(x0 - 1, yy, fz - 1), (x1 + 1, yy, fz - 1), (x1 + 1, yy, fz), (x0 - 1, yy, fz)], self.flat(ramp[5]))
                self.face([(x1, yy, fz - 1), (x1 + 1, yy, fz - 1), (x1 + 1, yy, D), (x1, yy, D)], self.flat(ramp[4]))
                a, b = self.P(x0 - 1, yy - 2, fz - 1), self.P(x1 + 1, yy - 2, fz - 1)
                self.d.line((a[0], a[1] + 1, b[0], b[1] + 1), fill=ramp[1])
                self.d.line((a[0] + 1, a[1] + 2, b[0], b[1] + 2), fill=ramp[2])
            return
        if style in (None, 'plain'): return
        spots = []
        for X in range(int(x0) + 1, int(x1) - 6, 9):
            spots.append((X, D - 2))
        for Z in range(int(z0) + 3, D - 3, 5):
            spots.append((x1 - 3, Z))
        for X in range(int(x0) + 1, int(x1) - 6, 9):
            spots.append((X, z0))
        spots.sort(key=lambda s: (-s[1], s[0]))
        for X, Z in spots:
            if style == 'stepped':
                self.box(X, X + 7, y, y + 3, Z, Z + 2, self.flat(ramp[4]), self.flat(ramp[2]), self.flat(ramp[5]))
                self.box(X + 2, X + 5, y + 3, y + 6, Z, Z + 2, self.flat(ramp[4]), self.flat(ramp[2]), self.flat(ramp[5]))
            elif style == 'snail':
                cx, cy = self.P(X + 3.5, y + 3, Z)
                for dx in range(-4, 5):
                    for dy in range(-4, 4):
                        if dx * dx + dy * dy <= 13 and dy <= 2:
                            c = ramp[5] if dx < -1 and dy < 0 else ramp[4] if dx < 2 else ramp[3]
                            self.px[cx + dx, cy + dy] = c
                self.px[cx, cy - 1] = ramp[1]; self.px[cx + 1, cy] = ramp[2]; self.px[cx - 1, cy] = ramp[2]
                self.px[cx + 4, cy] = ramp[2]; self.px[cx + 4, cy + 1] = ramp[1]

    def furniture(self, top, z0):
        """A roof is a yard: a drying mat of chiles or maize, water jars."""
        f = self.feature
        x0, x1, D = self.x0, self.x1, self.D
        if f in (None, 'none') or x1 - x0 < 40: return
        red, pot = self.pal['red'], self.pal['ochre']
        if f == 'mat':
            X = x0 + 6 + self.rng.randrange(0, max(1, (x1 - x0) // 3))
            crop = self.pal['red'] if self.rng.random() < .5 else self.pal['thatch']
            self.face([(X, top + .1, z0 + 3), (X + 12, top + .1, z0 + 3), (X + 12, top + .1, D - 3), (X, top + .1, D - 3)],
                      lambda Xx, Y, Z, x, y: crop[4] if (x + y) % 2 else crop[2] if h2(x, y) % 3 else self.pal['thatch'][4])
        else:
            for n in range(self.rng.choice([1, 2, 2])):
                sx, sy = self.P(x1 - 8 - n * 6, top, D - 4 - n % 2 * 2)
                d = self.d
                d.rectangle((sx - 2, sy - 4, sx + 1, sy), fill=pot[3]); d.line((sx - 2, sy - 4, sx - 2, sy), fill=pot[4])
                d.line((sx + 1, sy - 3, sx + 1, sy), fill=pot[1]); d.line((sx - 1, sy - 5, sx, sy - 5), fill=pot[4])
                d.point((sx - 1, sy - 6), fill=pot[1])
        sx, sy = self.P(x0 + (x1 - x0) * .7, top, (z0 + D) / 2)
        self.d.rectangle((sx - 3, sy - 1, sx + 2, sy), fill=INTERIOR[0])
        self.d.line((sx - 3, sy - 2, sx + 2, sy - 2), fill=self.wallramp[5])
        self.smoke.append([sx, sy - 1, 'vent'])

    def vault_roof(self):
        """A Classic range: medial moulding, the upper facade leaning back
        over the corbel vault, a crest of stucco on the ridge."""
        x0, x1, D, z0, fz = self.x0, self.x1, self.D, self.inset, self.fz
        top = self.top
        red, plaster, acc = self.pal['red'], self.pal['plaster'], self.pal['accent']
        ramp = self.wallramp
        up, lean = 14, 2
        # Medial moulding: three members, the middle one proud.
        self.box(x0 - 1, x1 + 1, top, top + 3, fz - 1, D, self.flat(plaster[4]), self.flat(plaster[2]), self.flat(plaster[5]))
        self.d.line((self.P(x0 - 1, top, fz - 1)[0], self.P(0, top, fz - 1)[1] + 1,
                     self.P(x1 + 1, top, fz - 1)[0], self.P(0, top, fz - 1)[1] + 1), fill=ramp[1])
        y0 = top + 3
        upper = [(x0, y0, fz), (x1, y0, fz), (x1, y0 + up, fz + lean), (x0, y0 + up, fz + lean)]
        self.face([(x1, y0, fz), (x1, y0, D), (x1, y0 + up, D), (x1, y0 + up, fz + lean)],
                  self.plaster(red, False, damp=False))
        if self.treatment != 'red':
            self.d.line((self.P(x0, top - 1, fz), self.P(x1, top - 1, fz)), fill=red[2])
        self.face(upper, lambda X, Y, Z, x, y: red[4] if X < x0 + 2 else red[3] if not dither(x, y, (Y - y0) / up * .5) else red[4])
        if self.upper == 'masks':
            for X in range(int(x0) + 6, int(x1) - 10, 22):
                sx, sy = self.P(X, y0 + up - 2, fz + lean)
                for j, row in enumerate(MASK):
                    for i, ch in enumerate(row):
                        if ch == 'X': self.px[sx + i, sy + j] = plaster[4] if i < 9 and j < 7 else plaster[2]
                        elif ch == 'O': self.px[sx + i, sy + j] = acc[3] if (i + j) % 2 else acc[4]
                        elif ch == 'N': self.px[sx + i, sy + j] = plaster[5] if i == 4 else plaster[3]
        else:
            self.band(y0 + 3, 7, 'fret', plaster, red, z=fz + 1, x0=x0 + 1, x1=x1 - 1)
        # Cornice and flat top.
        yt = y0 + up
        self.box(x0 - 1, x1 + 1, yt, yt + 2, fz + lean - 1, D, self.flat(plaster[5]), self.flat(plaster[2]), self.flat(plaster[5]))
        self.d.line((self.P(x0, yt, fz + lean - 1)[0], self.P(0, yt, fz + lean - 1)[1] + 1,
                     self.P(x1, yt, fz + lean - 1)[0], self.P(0, yt, fz + lean - 1)[1] + 1), fill=red[1])
        if self.crest == 'comb':
            self.comb(yt + 2)
        else:
            for X in range(int(x0) + 1, int(x1) - 4, 7):
                self.box(X, X + 4, yt + 2, yt + 6, fz + lean, fz + lean + 2, self.flat(plaster[4]),
                         self.flat(plaster[2]), self.flat(plaster[5]))
                self.box(X + 1, X + 3, yt + 6, yt + 8, fz + lean, fz + lean + 2, self.flat(plaster[4]),
                         self.flat(plaster[2]), self.flat(plaster[5]))
            self.roof_top = self.P(0, yt + 9, fz + lean)[1]

    def comb(self, y):
        """Openwork roof comb on the centreline: stepped tiers of pierced
        stucco, sky through the slots, a crest of blocks on top."""
        red, plaster = self.pal['red'], self.pal['plaster']
        cxw = self.x0 + (self.x1 - self.x0) / 2
        half = (self.x1 - self.x0) * .2
        zc = (self.inset + self.D) / 2 + 1
        for hw, th in ((half, 8), (half * .7, 7), (half * .42, 5)):
            a, b = cxw - hw, cxw + hw
            self.box(a, b, y, y + th, zc, zc + 2, None, self.flat(red[1]), self.flat(red[4]))

            def sh(X, Y, Z, x, y_, a=a, b=b, y0=y, th=th):
                i, j = X - a, Y - y0
                if 1.5 < j < th - 1.5 and 2 < i < b - a - 2 and int(i - 2) % 5 < 2:
                    return None
                return red[4] if i < 1.5 or j > th - 1 else red[3] if j > 1 else red[2]
            self.face([(a, y, zc), (b, y, zc), (b, y + th, zc), (a, y + th, zc)], sh)
            y += th
        for X in range(int(cxw - half * .42) + 1, int(cxw + half * .42), 3):
            sx, sy = self.P(X, y, zc)
            self.px[sx, sy - 1] = plaster[5]; self.px[sx, sy - 2] = plaster[4]
        self.roof_top = self.P(0, y + 3, zc)[1]

    def colonnade_front(self):
        """Tulum and Mayapan: a wide opening split by round columns."""
        cx = self.door_x
        plaster = self.pal['plaster']
        y0, y1 = self.bottom, self.bottom - DOOR_H - 1
        for dx in (-22, 13):
            x = cx + dx
            self.d.rectangle((x - 5, y1, x + 13, y0), fill=INTERIOR[0])
            for yy in range(y1, y0 + 1):
                for k, c in enumerate((plaster[5], plaster[4], plaster[4], plaster[3], plaster[2], plaster[1])):
                    self.px[x + 1 + k - (0 if dx > 0 else 0), yy] = c if dx > 0 else self.px[x + 1 + k, yy]
            self.d.line((x - 5, y1 - 1, x + 13, y1 - 1), fill=self.wallramp[1])
        for dx in (-9, 8):
            x = cx + dx
            for yy in range(y1, y0 + 1):
                for k, c in enumerate((plaster[5], plaster[4], plaster[3], plaster[2])):
                    self.px[x + k, yy] = c
            self.d.rectangle((x - 1, y1, x + 4, y1 + 1), fill=plaster[5])

    def brazier(self, X, Y, Z, big=False):
        """A clay brazier on its stand; the fire itself is an overlay."""
        sx, sy = self.P(X, Y, Z)
        clay = self.pal['ochre'] if not big else self.pal['stone']
        w = 4 if big else 3
        rows = [(1, 0)] * 2 + [(1, 0)] + [(2, 1)] + [(w, 2)] * 3 + [(w + 1, 3)]
        for k, (half, _) in enumerate(rows):
            y = sy - k
            for dx in range(-half, half + 1):
                u = dx / max(1, half)
                c = clay[5] if u < -.4 else clay[4] if u < .2 else clay[2]
                if k == len(rows) - 1: c = clay[5] if dx < half else clay[3]
                self.px[sx + dx, y] = c
        top = sy - len(rows)
        for dx in range(-w, w + 1):
            self.px[sx + dx, top] = (60, 22, 16, 255) if dx % 2 else (180, 60, 24, 255)
        size = 'flame' if big else 'flame-small'
        fw, fh = (9, 12) if big else (7, 9)
        self.overlays.append([size, sx - fw // 2, top - fh + 1])
        self.smoke.append([sx, top - fh, 'chimney'])

    def banner_pole(self, X, Y, Z):
        """A pole carrying a paper banner; the cloth is an overlay."""
        tim = self.pal['timber']
        sx, sy = self.P(X, Y, Z)
        self.d.line((sx, sy - 18, sx, sy), fill=tim[3])
        self.d.line((sx + 1, sy - 17, sx + 1, sy), fill=tim[1])
        self.d.line((sx - 1, sy - 18, sx + 3, sy - 18), fill=tim[4])
        self.px[sx, sy - 19] = self.pal['accent'][4]
        self.overlays.append(['banner', sx + 1, sy - 17])

    # -- service buildings --------------------------------------------------

    def granary(self):
        """Cuezcomatl: great bellied clay jars on a stone footing, each
        capped with a cone of thatch; a big one and a lesser beside it."""
        base = self.G - self.ph - self.inset
        right = self.ox + self.W + self.D / 2
        big = (right - 18, 15, 38)
        small = (right - 42, 10, 27)
        for cx, rx, hgt in (small, big):
            self.jar(cx, base, rx, hgt)
        self.door_x = round(big[0])
        self.bottom = base
        self.roof_top = base - 38 - 20
        self.top = 38

    def jar(self, cx, base, rx, hgt):
        adobe, red = self.pal['adobe'], self.pal['red']
        for yy in range(hgt):
            t = yy / hgt
            prof = math.sin(math.pi * (.12 + .78 * t)) ** .8
            r_ = rx * (.55 + .45 * prof) if t < .9 else rx * .62
            y = base - yy
            for x in range(int(cx - r_), int(cx + r_) + 1):
                u = (x + .5 - cx) / r_
                i = 4 if u < -.45 else 5 if u < -.15 and t > .35 else 3 if u < .25 else 2 if u < .65 else 1
                if abs(u) > .92: i = max(1, i - 1)
                if yy < 3: i -= 1
                self.px[x, y] = adobe[max(0, min(5, i))]
        if self.tier or self.colorway:
            for x in range(int(cx - rx * .9), int(cx + rx * .9)):
                u = (x - cx) / rx
                self.px[x, base - hgt // 2] = red[3] if u < .3 else red[2]
        top = base - hgt
        cap_r, cap_h = rx + 3, round(rx * .9)
        for yy in range(cap_h + 3):
            r_ = cap_r * min(1, yy / cap_h)
            y = top - cap_h + yy
            for x in range(int(cx - r_), int(cx + r_) + 1):
                u = (x + .5 - cx) / max(1, r_)
                i = 4 if u < -.3 else 3 if u < .2 else 2 if u < .6 else 1
                if (yy + h2(x) % 3) % 5 == 0: i -= 1
                if yy >= cap_h: i = 1 if (x % 3) else 3
                self.px[x, y] = self.thatch[max(0, i)]
        self.d.line((cx, top - cap_h - 3, cx, top - cap_h), fill=self.pal['timber'][3])

    def sweatbath_dome(self):
        """The temazcalli: a plastered dome over the bath, lit like a ball,
        and the stone firebox against its right side where the stones heat."""
        ramp, stone = self.wallramp, self.pal['stone']
        cx = self.ox + (self.x0 + self.x1) / 2 + self.inset
        base = self.G - self.ph - self.inset
        rx, ry = (self.x1 - self.x0) / 2 - 1, 36
        for y in range(base - ry, base + 1):
            v = (base - y) / ry
            half = rx * math.sqrt(max(0, 1 - v * v))
            for x in range(int(cx - half), int(cx + half) + 1):
                u = (x + .5 - cx) / rx
                light = -u * .55 + v * .7 + .15
                i = 5 if light > .78 else 4 if light > .42 else 3 if light > .02 else 2 if light > -.35 else 1
                if h2(x, y, 5) % 37 == 0: i -= 1
                if base - y < 3: i = min(i, 2)
                self.px[x, y] = ramp[max(0, min(5, i))]
        X0 = cx + rx * .55 - self.ox - self.inset
        self.box(X0, X0 + 9, self.ph, self.ph + 12, self.inset + 2, self.inset + 8,
                 self.stone('front'), self.stone('side'), self.flat(stone[5]))
        fx, fy = self.P(X0 + 2, self.ph + 2, self.inset + 2)
        self.d.rectangle((fx, fy - 4, fx + 4, fy), fill=INTERIOR[0])
        self.px[fx + 1, fy] = (236, 140, 60, 255); self.px[fx + 2, fy - 1] = (250, 196, 90, 255)
        self.px[fx + 3, fy] = (200, 90, 40, 255)
        self.overlays.append(['flame-small', fx - 1, fy - 8])
        tx, ty = self.P(X0 + 5, self.ph + 12, self.inset + 5)
        self.smoke.append([tx, ty - 1, 'chimney'])
        self.roof_top = base - ry - 1
        self.top = ry
        self.door_x, self.bottom = round(cx) - 3, base

    def bath_door(self):
        """A low doorway with a stone rim, curtained against the steam."""
        x, gy = self.door_x - DOOR_W // 2, self.bottom
        top = gy - DOOR_H - 1
        stone, acc = self.pal['stone'], self.pal['accent']
        self.d.rectangle((x - 2, top - 2, x + DOOR_W + 2, gy), fill=stone[4])
        self.d.line((x - 2, top - 2, x + DOOR_W + 2, top - 2), fill=stone[5])
        self.d.line((x + DOOR_W + 2, top - 1, x + DOOR_W + 2, gy), fill=stone[2])
        self.d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        for yy in range(top, top + 9):
            for xx in range(x, x + DOOR_W + 1):
                self.px[xx, yy] = acc[3] if (xx - x) % 3 else acc[2]
        self.d.line((x, top + 9, x + DOOR_W, top + 9), fill=acc[1])

    # -- whole ------------------------------------------------------------

    def render(self):
        self.platform()
        if self.kind == 'granary':
            self.granary()
        else:
            if self.kind == 'sweatbath':
                self.sweatbath_dome()
                self.bath_door()
                return self.finish_ground()
            if self.ramada: self.ramada_shed()
            if self.kind == 'terrace' and not self.vault:
                self.deck(self.ph + self.wh, 4, self.inset)
            self.walls()
            self.door_x, self.bottom = self.P(self.door_cx(), self.ph, self.fz)
            if self.kind == 'terrace':
                if self.vault:
                    self.vault_roof()
                    for dx in (-26, 26):
                        self.extra_door(dx)
                else:
                    self.terrace_roof()
                    if self.W >= 128 and not self.portico and not self.colonnade and self.rng.random() < .7:
                        for dx in (-36, 36):
                            self.extra_door(dx)
                fr = self.frieze
                if fr and not self.vault:
                    fg, bg = self.colours()
                    at = self.top - (6 if self.parapet not in ('moulding', 'double-moulding') else 13)
                    self.band(at - 7, 7, fr, fg, bg)
                self.beams()
                self.vents()
            elif self.kind == 'jacal':
                self.thatch_roof()
            self.doorway()
            if self.colonnade: self.colonnade_front()
            if self.r.get('braziers') and self.kind == 'terrace':
                cx = (self.door_x - self.ox - self.fz)
                for X in (cx - 14, cx + 14):
                    self.brazier(X, self.ph, self.fz - 1)
            if self.r.get('banners') and self.kind == 'terrace':
                for X in (self.x0 + 4, self.x1 - 4):
                    self.banner_pole(X, self.top + 4, self.D - 2)
        return self.finish_ground()

    def finish_ground(self):
        gy = self.G
        self.d.line((self.ox, gy + 1, self.ox + self.W + self.D // 2, gy + 1), fill=(30, 34, 26, 150))
        return self.finish()

    def extra_door(self, dx):
        """A range has a doorway into each room; only the middle one is the
        world's, the others stay curtained."""
        x = self.door_x + dx - DOOR_W // 2
        if x - 3 < self.P(self.x0, 0, self.fz)[0] or x + DOOR_W + 3 > self.P(self.x1, 0, self.fz)[0]: return
        top, gy = self.bottom - DOOR_H - 1, self.bottom
        red, acc, ramp = self.pal['red'], self.pal['accent'], self.wallramp
        self.d.rectangle((x - 2, top - 1, x + DOOR_W + 1, gy), fill=ramp[1])
        self.d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        for yy in range(top, gy - 2):
            for xx in range(x, x + DOOR_W + 1):
                self.px[xx, yy] = acc[3] if (xx - x) % 4 else acc[2]
            self.px[x, yy] = acc[4]
        for xx in range(x, x + DOOR_W + 1, 2): self.px[xx, gy - 3] = acc[1]
        self.d.line((x - 2, top - 1, x + DOOR_W + 1, top - 1), fill=red[1])

    def finish(self):
        box = self.im.getbbox()
        cut = max(0, box[1] - 2)
        right = min(self.w, box[2] + 1)
        self.im = self.im.crop((0, cut, right, self.h))
        self.w, self.h = self.im.size
        self.G -= cut
        self.bottom -= cut
        self.smoke = [[x, y - cut, k] for x, y, k in self.smoke]
        self.overlays = [[k, x, y - cut] for k, x, y in self.overlays]
        self.anchor_x = self.ox + self.W / 2
        self.occlusion = [self.ox, self.roof_top - cut, self.ox + self.W + self.D // 2, self.G - 1]
        return self.im
