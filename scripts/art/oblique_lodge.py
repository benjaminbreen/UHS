"""Houses of villages that did not farm fields, or farmed them far off: the
Northwest Coast cedar plank house, the Amazonian maloca under its thatch,
and the Maasai enkang house, low, rounded and plastered with dung.

A box in the world of the other oblique painters (X right, Y up, Z back,
the settled 12px return), each face rasterised with its world point under
every pixel. Form, crest, poles and gear come from the profile's `lodge`
block in regional-houses.json. Illustrative reconstructions from
ethnographic photographs and museum houses, not surveyed plans.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import INTERIOR, _rgb, dither, h2
from art.oblique_steppe import ObliqueSteppe, ramp_at
from art.oblique_style import side_depth

# Formline eye, left half; mirrored for the right. O outline, R red, B
# blue-green, K pupil.
OVOID = ["..OOOOOO..",
         ".OBBBBBBO.",
         "OBBOOOOBBO",
         "OBOKKKKOBO",
         "OBOKKKKOBO",
         "OBBOOOOBBO",
         ".ORRRRRRO.",
         "..OOOOOO.."]
# A crest figure's face on a pole, top to bottom: brow, eyes, nose, mouth.
FACE = ["OOOOOOOOOO",
        "OBBBOOBBBO",
        "O.KK..KK.O",
        "O...RR...O",
        "O........O",
        "O.RRRRRR.O",
        "OOO.OO.OOO"]


class ObliqueLodge(ObliqueSteppe):
    def __init__(self, recipe, material):
        self.r = recipe
        rng = self.rng = random.Random(recipe['seed'] + 613)
        s = self.lg = recipe['lodge']
        self.pal = {k: [_rgb(c) for c in v] for k, v in s['palette'].items()}
        self.form = s['form']
        self.tier = recipe.get('wealthTier', 1)
        self.scale = recipe.get('goldScale', 'medium')
        self.gear = [g for g in s.get('gear', []) if rng.random() < .5 + .15 * self.tier]
        self.smoke, self.overlays = [], []
        fw, fh = recipe['footprint']
        self.fw, self.fh = fw, fh
        self.sw = self.D = side_depth(fh)
        self.ox = 14
        self.w = self.ox + fw * 16 + self.sw + 20
        self.h = 170
        self.G = self.h - 8
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.zbuf = {}
        self.roof_top = self.G - 40
        self.felt = self.pal['mat']

    def front(self, x0, x1, y0, y1, z, sh):
        self.face([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], sh)

    def side(self, x, y0, y1, z0, z1, sh):
        self.face([(x, y0, z0), (x, y0, z1), (x, y1, z1), (x, y1, z0)], sh)

    def doorway(self, cx, ground, frame):
        x, top = cx - DOOR_W // 2, ground - DOOR_H - 1
        self.d.rectangle((x - 2, top - 2, x + DOOR_W + 1, ground), fill=frame[1])
        self.d.line((x - 2, top - 2, x + DOOR_W + 1, top - 2), fill=frame[4])
        self.d.rectangle((x, top, x + DOOR_W, ground), fill=INTERIOR[0])
        for yy in range(top, ground + 1):
            for xx in range(x + 1, x + 4):
                if dither(xx, yy, .5 - (xx - x) * .15): self.put(xx, yy, INTERIOR[2])
        self.door_x, self.bottom = cx, ground

    # -- the cedar plank house --------------------------------------------

    def planks(self, lit, across, weathered):
        ramp = self.pal['cedar-grey' if weathered else 'cedar']

        def sh(X, Y, Z, x, y):
            u = across(X, Z)
            board = int(u // 6)
            c = lit + ((h2(board, 3) % 3) - 1) * .5
            if u % 6 < 1: c = lit - 2
            elif u % 6 > 4.9: c = lit + 1
            if h2(board, int(Y // 9)) % 7 == 0 and int(Y) % 9 == 0: c -= 1
            if h2(x, y, 5) % 17 == 0: c -= 1
            return ramp_at(ramp, c)
        return sh

    def crest(self, cx, y_top):
        """A formline face across the front: two great eyes and a mouth in
        black, red and blue-green on the bare cedar."""
        cols = {'O': self.pal['black'][1], 'R': self.pal['ochre'][3], 'B': self.pal['teal'][3], 'K': self.pal['black'][0]}
        for j, row in enumerate(OVOID):
            for i, ch in enumerate(row):
                if ch == '.': continue
                for sx in (cx - 14 + i, cx + 13 - i):
                    self.put(sx, y_top + j, cols[ch])
        # Brow and the U-forms either side.
        for i in range(-20, 21):
            if abs(i) > 3: self.put(cx + i, y_top - 2, cols['O'])
        for sgn in (-1, 1):
            for k in range(6):
                self.put(cx + sgn * (19 + (k > 3)), y_top + 1 + k, cols['R'] if 0 < k < 5 else cols['O'])

    def pole(self, cx, ground, tall):
        """A frontal pole: stacked crest figures, a bird with its wings out
        on top, and the oval door cut through its foot."""
        cedar, cols = self.pal['cedar'], {'O': self.pal['black'][1], 'R': self.pal['ochre'][3],
                                          'B': self.pal['teal'][3], 'K': self.pal['black'][0]}
        x0, x1 = cx - 6, cx + 6
        top = ground - tall
        for yy in range(top, ground + 1):
            for xx in range(x0, x1):
                self.put(xx, yy, cedar[4] if xx < x0 + 2 else cedar[2] if xx > x1 - 3 else cedar[3])
        for k, y in enumerate(range(top + 10, ground - 26, 9)):
            for j, row in enumerate(FACE):
                for i, ch in enumerate(row):
                    if ch != '.': self.put(x0 + 1 + i, y + j, cols[ch])
        for i in range(-10, 11):
            for j in range(3):
                if abs(i) > 9 - 3 * j: continue
                self.put(cx + i, top + 3 + j + (abs(i) // 4), cols['O'] if j == 0 else cedar[4 - (abs(i) > 5)])
        self.put(cx - 1, top + 1, cols['K']); self.put(cx, top, cedar[4]); self.put(cx + 1, top + 1, cols['R'])
        x, dt = cx - DOOR_W // 2, ground - DOOR_H - 1
        for yy in range(dt, ground + 1):
            for xx in range(x, x + DOOR_W + 1):
                u, v = (xx - cx) / (DOOR_W / 2 + .5), (yy - (dt + ground) / 2) / ((ground - dt) / 2 + .5)
                if u * u + v * v < 1: self.put(xx, yy, INTERIOR[0])
        self.door_x, self.bottom = cx, ground
        self.roof_top = min(self.roof_top, top - 2)

    def canoe(self, x, y, length):
        black, red, cedar = self.pal['black'], self.pal['ochre'], self.pal['cedar']
        for i in range(length):
            u = i / (length - 1)
            rise = int(4 * (max(0, .12 - u) / .12) ** 1.5 + 3 * (max(0, u - .9) / .1) ** 1.5)
            for j in range(3):
                self.put(x + i, y - j - rise * (j == 2), black[2] if j == 0 else black[1] if j == 1 else red[3])
            self.put(x + i, y - 3 - rise, cedar[4] if 0 < u < 1 else black[3])
        for k in range(5): self.put(x - 1, y - 2 - k, black[2]); self.put(x + length, y - 2 - k // 2, black[2])

    def fish_rack(self, x, y):
        wood, fish = self.pal['wood'], self.pal['salmon']
        for dx in (0, 14):
            for k in range(14): self.put(x + dx, y - k, wood[3 if k % 3 else 2])
        self.d.line((x, y - 13, x + 14, y - 13), fill=wood[4])
        for i in range(2, 13, 3):
            for k in range(6): self.put(x + i, y - 12 + k, fish[3 if k < 2 else 2]); self.put(x + i + 1, y - 12 + k, fish[4] if k < 3 else fish[1])

    def render_plank(self):
        W, D = self.fw * 16, self.D
        big = self.scale == 'large'
        wh = 28 if big else 25
        rise = 11 if big else 9
        weathered = self.tier == 0 or self.rng.random() < .4
        xc = W / 2
        # Gable to the water: the ridge runs back from the front.
        self.side(W, 0, wh, 0, D, self.planks(2, lambda X, Z: Z * 2, True))
        self.face([(W, wh, 0), (W, wh, D), (W, wh + 1, D), (W, wh + 1, 0)], lambda *_: self.pal['cedar-grey'][1])
        front = self.planks(4, lambda X, Z: X, weathered)
        self.front(0, W, 0, wh, 0, front)
        self.face([(0, wh, 0), (W, wh, 0), (xc, wh + rise, 0)], front)
        rsh = lambda lit: (lambda X, Y, Z, x, y: ramp_at(self.pal['cedar-grey'], lit + (-1.5 if int(Z * 1.2) % 4 == 0 else 0) + (h2(int(Z), int(Y)) % 3 == 0) * -.6))
        self.face([(-3, wh - 1, -2), (xc, wh + rise, -2), (xc, wh + rise, D + 3), (-3, wh - 1, D + 3)], rsh(3))
        self.face([(xc, wh + rise, -2), (W + 3, wh - 1, -2), (W + 3, wh - 1, D + 3), (xc, wh + rise, D + 3)], rsh(2))
        # Barge boards, and the smoke hole where a roof board is slid aside.
        for a, b in (((-3, wh - 1, -2), (xc, wh + rise, -2)), ((xc, wh + rise, -2), (W + 3, wh - 1, -2))):
            self.d.line((self.P(*a), self.P(*b)), fill=self.pal['cedar'][1])
            p0, p1 = self.P(*a), self.P(*b)
            self.d.line((p0[0], p0[1] - 1, p1[0], p1[1] - 1), fill=self.pal['cedar'][4])
        hx, hy = self.P(xc + 3, wh + rise - 1, D / 2)
        self.d.rectangle((hx - 4, hy - 1, hx + 4, hy + 1), fill=INTERIOR[0])
        self.smoke.append([hx, hy - 2, 'vent'])
        self.roof_top = hy - 12
        gx, ground = self.P(xc, 0, 0)
        if self.tier >= 1:
            self.crest(gx, ground - wh + 3)
        if self.tier >= 1 and (big or self.rng.random() < .6):
            self.pole(gx, ground, wh + rise + 14)
        else:
            self.doorway(gx, ground, self.pal['cedar'])
        if 'canoe' in self.gear:
            self.canoe(self.ox + 2, ground + 6, min(40, W - 30))
        if 'fish-rack' in self.gear:
            self.fish_rack(self.P(W, 0, 0)[0] + 2, ground - 1)

    # -- the maloca ---------------------------------------------------------

    def thatch(self, lit, rows_from, ramp_name='palm'):
        ramp = self.pal[ramp_name]

        def sh(X, Y, Z, x, y):
            k = (Y - rows_from) / 4.2
            course = int(k)
            n = h2(x if lit > 2 else x - y, course)
            f = k - course + (0, 0, 1, 2)[n % 4] / 4.2
            if f >= 1: f -= 1
            c = lit - 2 if f < .12 else lit + 1 if f < .3 else lit if f < .7 else lit - 1
            if n % 9 == 0: c -= 1
            return ramp_at(ramp, c)
        return sh

    def render_maloca(self):
        """Thatch from the ridge nearly to the ground over a low wall of
        poles, the ends hipped round, the doorway cut through the skirt."""
        W, D = self.fw * 16, self.D
        big = self.scale == 'large'
        eave, rise = 7, (34 if big else 28)
        o = 3
        zc = D / 2
        a = W * .22
        L, R = -o, W + o
        ridge = eave + rise
        wall = self.pal['wood']
        self.front(0, W, 0, eave, 0, lambda X, Y, Z, x, y: wall[3 if int(X) % 3 else 1])
        self.side(W, 0, eave, 0, D, lambda X, Y, Z, x, y: wall[2 if int(Z * 2) % 3 else 1])
        self.face([(R, eave, -o), (R, eave, D + o), (R - a, ridge, zc)], self.thatch(2, eave))
        self.face([(L, eave, -o), (R, eave, -o), (R - a, ridge, zc), (L + a, ridge, zc)], self.thatch(3, eave))
        hem = self.pal['palm']
        p0, p1 = self.P(L, eave, -o), self.P(R, eave, -o)
        for x in range(p0[0], p1[0] + 1):
            self.put(x, p0[1] + 1 + (h2(x, 3) % 3 == 0), hem[1])
        r0, r1 = self.P(L + a, ridge, zc), self.P(R - a, ridge, zc)
        for k, c in ((-2, hem[4]), (-1, hem[3]), (0, hem[1])):
            self.d.line((r0[0], r0[1] + k, r1[0], r1[1] + k), fill=c)
        self.roof_top = r0[1] - 6
        gx, ground = self.P(W / 2, 0, 0)
        # The doorway: the thatch cut back under a little gabled hood.
        self.doorway(gx, ground, self.pal['wood'])
        top = ground - DOOR_H - 3
        for i in range(-8, 9):
            for j in range(0, 5 - abs(i) // 2):
                self.put(gx + i, top - j + 2, hem[3 if i < 0 else 2] if j else hem[1])
        self.smoke.append([gx + 10, r0[1] - 1, 'vent'])
        if 'hammock-posts' in self.gear:
            wood = self.pal['wood']
            for dx in (-18, 18):
                for k in range(10): self.put(gx + dx, ground - k, wood[3])
        if 'manioc-trough' in self.gear:
            wood = self.pal['wood']
            x = self.P(W, 0, 0)[0] + 2
            for i in range(14): self.put(x + i, ground - 1, wood[2]); self.put(x + i, ground - 2, wood[4] if i in (0, 13) else wood[1])

    # -- the enkang house ---------------------------------------------------

    def dung(self, lit):
        ramp = self.pal['dung']

        def sh(X, Y, Z, x, y):
            n = h2(x // 2, y // 2, 13)
            c = lit + (.6 if n % 7 == 0 else -.6 if n % 5 == 0 else 0)
            # Hand-smeared: long shallow arcs in the plaster.
            if (x * 3 + y * 5 + int(X)) % 23 == 0: c -= .7
            return ramp_at(ramp, c)
        return sh

    def render_enkang(self):
        """A low loaf of sticks and dung, the roof bowed over, the door at
        the end of a short curved passage."""
        W, D = self.fw * 16, self.D
        wh, bow, rr = 22, 6, 6
        x0, x1 = 2, W - 2

        def rounded(lit, a, b, along):
            base = self.dung(lit)

            def sh(X, Y, Z, x, y):
                u = along(X, Z)
                for c in (a + rr, b - rr):
                    if (u < a + rr) == (c == a + rr) and (u < a + rr or u > b - rr) and Y > top_of(u) - rr:
                        if (u - c) ** 2 + (Y - (top_of(u) - rr)) ** 2 > rr * rr: return None
                return base(X, Y, Z, x, y)
            return sh
        top_of = lambda u: wh
        self.front(x0, x1, 0, wh, 0, rounded(4, x0, x1, lambda X, Z: X))
        steps = 6
        for k in range(steps):
            z0, z1 = D * k / steps, D * (k + 1) / steps
            y0 = wh + bow * math.sin(math.pi * z0 / D)
            y1 = wh + bow * math.sin(math.pi * z1 / D)
            self.face([(x1, 0, z0), (x1, 0, z1), (x1, y1, z1), (x1, y0, z0)], self.dung(3))
            self.face([(x0 + 2, y0, z0), (x1, y0, z0), (x1, y1, z1), (x0 + 2, y1, z1)],
                      self.dung(4.8 if k < steps / 2 else 3.6))
        self.roof_top = self.P(0, wh + bow, D / 2)[1] - 6
        # The entrance passage, a short wing out of the front, lower than
        # the house behind it.
        px = x0 + 6 if self.rng.random() < .5 else x1 - 20
        top_of = lambda u: 25
        self.side(px + 14, 0, 25, -4, 0, rounded(3, -4, 0, lambda X, Z: Z))
        self.front(px, px + 14, 0, 25, -4, rounded(4, px, px + 14, lambda X, Z: X))
        gx, ground = self.P(px + 7, 0, -4)
        x, top = gx - DOOR_W // 2, ground - DOOR_H - 1
        for yy in range(top, ground + 1):
            for xx in range(x, x + DOOR_W + 1):
                u = (xx - gx) / (DOOR_W / 2 + .5)
                if yy - top >= 4 * u * u: self.put(xx, yy, INTERIOR[0])
        self.door_x, self.bottom = gx, ground
        if 'calabashes' in self.gear:
            gourd = self.pal['gourd']
            for i, dx in enumerate((-12, -8)):
                for yy in range(-5, 0):
                    for xx in range(-2, 3):
                        if xx * xx + (yy + 2.5) ** 2 < 7: self.put(gx + dx + xx, ground + yy, gourd[4 if xx < 0 else 2])
                self.put(gx + dx, ground - 6, gourd[1])
        if 'hide-bed' in self.gear:
            hide = self.pal['hide']
            for i in range(10):
                for j in range(3): self.put(self.P(x1, 0, 0)[0] + 3 + i, ground - j, hide[3 - j % 2])

    # -- the Iroquoian longhouse ---------------------------------------------

    def bark(self, lit, along):
        ramp = self.pal['elm-bark']

        def sh(X, Y, Z, x, y):
            u = along(X, Z)
            sheet = int(u // 9)
            c = lit + ((h2(sheet, int(Y // 10)) % 3) - 1) * .5
            if u % 9 < 1: c -= 1.5
            if int(Y) % 10 == 0: c -= 1
            if h2(x // 2, y, 7) % 13 == 0: c -= .8
            return ramp_at(ramp, c)
        return sh

    def render_longhouse(self):
        """Elm bark over a frame of bent saplings, the roof a long barrel
        vault with a smoke hole over each pair of hearths, doors at the ends."""
        W, D = self.fw * 16, self.D
        wh, arch = 17, 10
        pole = self.pal['wood']
        steps = 8
        for k in range(steps):
            z0, z1 = D * k / steps, D * (k + 1) / steps
            y0 = wh + arch * math.sin(math.pi * z0 / D)
            y1 = wh + arch * math.sin(math.pi * z1 / D)
            self.face([(W, 0, z0), (W, 0, z1), (W, y1, z1), (W, y0, z0)], self.bark(2.4, lambda X, Z: Z * 3))
        self.front(0, W, 0, wh, 0, self.bark(3.6, lambda X, Z: X))
        for k in range(steps):
            z0, z1 = D * k / steps, D * (k + 1) / steps
            y0 = wh + arch * math.sin(math.pi * z0 / D)
            y1 = wh + arch * math.sin(math.pi * z1 / D)
            lit = 4.4 if k < steps / 2 else 3.2
            self.face([(-1, y0, z0), (W + 1, y0, z0), (W + 1, y1, z1), (-1, y1, z1)],
                      self.bark(lit, lambda X, Z: X * .9 + 4))
        # Poles laid along the roof to hold the bark down.
        for zf in (.2, .45, .75):
            z = D * zf
            y = wh + arch * math.sin(math.pi * zf)
            a, b = self.P(-1, y + .5, z), self.P(W + 1, y + .5, z)
            self.d.line((a, b), fill=pole[1])
        for X in range(8, W - 6, 26):
            hx, hy = self.P(X + 4, wh + arch, D / 2)
            self.d.rectangle((hx - 3, hy - 1, hx + 3, hy + 1), fill=INTERIOR[0])
            self.d.line((hx - 4, hy - 2, hx + 4, hy - 2), fill=self.pal['elm-bark'][4])
            self.smoke.append([hx, hy - 3, 'vent'])
        self.roof_top = self.P(0, wh + arch, D / 2)[1] - 8
        # The door at the east end, under a bark hood.
        cx = max(10, min(W - 9, self.r['entrance'][0] * 16 + 8))
        gx, ground = self.P(cx, 0, 0)
        self.doorway(gx, ground, pole)
        top = ground - DOOR_H - 3
        bark = self.pal['elm-bark']
        for i in range(-8, 9):
            for j in range(3 - abs(i) // 4):
                self.put(gx + i, top - j, bark[4 if j == 0 else 2])

    # -- the Ainu chise ------------------------------------------------------

    def storehouse(self, x, ground):
        """The pu: a little thatched store on four posts, out of reach of the
        bears and the damp, a notched log leaning up to its door."""
        wood, reed = self.pal['wood'], self.pal['reed']
        for dx in (0, 13):
            for k in range(11):
                self.put(x + dx, ground - k, wood[2]); self.put(x + dx + 1, ground - k, wood[1])
        self.d.rectangle((x - 1, ground - 20, x + 15, ground - 11), fill=reed[3])
        for xx in range(x - 1, x + 16, 2): self.d.line((xx, ground - 20, xx, ground - 11), fill=reed[2])
        for j in range(8):
            self.d.line((x - 3 + j, ground - 21 - j, x + 17 - j, ground - 21 - j), fill=reed[4 if j < 3 else 3])
        for k in range(12):
            self.put(x - 4 + k // 2, ground - k, wood[3])
            if k % 3 == 0: self.put(x - 3 + k // 2, ground - k, wood[1])

    def render_chise(self):
        """Walls and roof alike of bundled reed and grass over a pole frame,
        a hipped roof with smoke holes at the gable ends, the porch on the
        west, the raised store beside it."""
        W, D = self.fw * 16, self.D
        wh, rise = 18, 17
        o = 3
        zc = D / 2
        a = W * .18
        L, R = -o, W + o
        ridge = wh + rise
        reed = self.pal['reed']

        def walls(lit):
            def sh(X, Y, Z, x, y):
                u = int(X if lit > 3 else Z * 2)
                c = lit + (.6 if u % 3 == 0 else -.5 if u % 3 == 2 else 0)
                if int(Y) in (6, 13): c -= 1.2
                if h2(u, int(Y) // 4) % 9 == 0: c -= .6
                return ramp_at(reed, c)
            return sh
        self.front(0, W, 0, wh, 0, walls(3.8))
        self.side(W, 0, wh, 0, D, walls(2.6))
        self.face([(R, wh, -o), (R, wh, D + o), (R - a, ridge, zc)], self.thatch(2, wh, 'reed'))
        self.face([(L, wh, -o), (R, wh, -o), (R - a, ridge, zc), (L + a, ridge, zc)], self.thatch(3, wh, 'reed'))
        r0, r1 = self.P(L + a, ridge, zc), self.P(R - a, ridge, zc)
        for k, c in ((-2, reed[4]), (-1, reed[3]), (0, reed[1])):
            self.d.line((r0[0], r0[1] + k, r1[0], r1[1] + k), fill=c)
        for ex in (r0[0] + 1, r1[0] - 3):
            self.d.polygon([(ex, r0[1] - 1), (ex + 2, r0[1] - 1), (ex + 1, r0[1] + 2)], fill=INTERIOR[0])
        self.smoke.append([r0[0] + 2, r0[1] - 3, 'vent'])
        self.roof_top = r0[1] - 6
        # The porch on the west end: its own small hipped roof, the door in it.
        gx, ground = self.P(10, 0, -4)
        self.front(2, 18, 0, 25, -4, walls(4))
        self.side(18, 0, 25, -4, 0, walls(2.6))
        self.face([(0, 25, -6), (20, 25, -6), (16, 32, -2), (4, 32, -2)], self.thatch(3, 25, 'reed'))
        self.doorway(gx, ground, self.pal['wood'])
        if 'storehouse' in self.gear:
            self.storehouse(self.P(W, 0, 0)[0] + 4, ground)

    def render(self):
        {'plank': self.render_plank, 'maloca': self.render_maloca, 'enkang': self.render_enkang,
         'longhouse': self.render_longhouse, 'chise': self.render_chise}[self.form]()
        self.d.line((self.ox, self.G + 1, self.ox + self.fw * 16 + self.sw // 2, self.G + 1), fill=(30, 34, 26, 150))
        box = self.im.getbbox()
        cut = max(0, box[1] - 2)
        self.im = self.im.crop((0, cut, min(self.w, box[2] + 1), self.h))
        self.w, self.h = self.im.size
        self.G -= cut
        self.bottom -= cut
        self.smoke = [[x, y - cut, k] for x, y, k in self.smoke]
        self.anchor_x = self.ox + self.fw * 8
        self.occlusion = [self.ox, max(0, self.roof_top - cut), self.ox + self.fw * 16 + self.sw // 2, self.G - 1]
        return self.im
