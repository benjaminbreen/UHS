"""Mesoamerican temples, ball courts and their animated furniture.

Built on the house painter's planes (art/oblique_meso.py), so a pyramid's
terraces, a stair's treads and a shrine's high roof share its projection,
ramps and shaders. Structure is per scale in meso-landmarks.json; colour
comes from the house profiles in regional-houses.json. Temples and courts are
deep landmarks, so they take the 14/16px return.

Animated parts are not baked in: the painter publishes `overlays`, points in
sprite pixels where the scene cycles a flame, a paper banner or a ball.
"""
import json
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import ObliqueMeso, INTERIOR, MASK, _rgb, dither, h2
from art.oblique_style import side_depth

# A serpent head at the foot of a balustrade: # stone, o eye, r mouth, w fang.
SERPENT = ["..####..",
           ".#o#####",
           "########",
           "#rrrrr##",
           "#wrwrw##",
           ".######."]
FLAME = [(142, 31, 20), (216, 64, 28), (244, 130, 42), (255, 211, 90), (255, 244, 192)]


class ObliqueMesoLandmark(ObliqueMeso):
    def __init__(self, recipe, material):
        r = self.r = recipe
        self.rng = random.Random(recipe['seed'] + 811)
        self.pal = {k: [_rgb(c) for c in v] for k, v in recipe['palette'].items()}
        self.profile = recipe['regionalProfile']
        self.maya = self.profile == 'maya'
        self.scale = recipe.get('goldScale', 'medium')
        self.tier = 2
        self.kind = recipe['mesoLandmark']
        fw, fh = recipe['footprint']
        self.W = fw * 16
        self.sw = self.D = side_depth(fh, deep=True)
        self.slot = fw // 2
        look = recipe.get('lookSpec', {})
        self.body = self.pal[look.get('body', 'plaster')]
        self.bandramp = self.pal[look.get('band', 'red')]
        self.shrineramp = self.pal[look.get('shrine', 'plaster')]
        self.stairramp = self.pal[look.get('stair', 'plaster')]
        self.treatment = 'red' if self.body is self.pal['red'] else 'lime'
        self.wallramp = self.shrineramp
        self.thatch = self.pal['thatch']
        self.weathered, self.colorway = False, 0
        self.wallstyle, self.thatchform = 'daub', 'hip'
        self.x0, self.x1, self.ph, self.inset, self.fz = 0, self.W, 0, 0, 0
        self.parapet, self.frieze, self.feature, self.dado = 'plain', None, None, False
        self.ox = 8
        self.w = self.ox + self.W + self.D + 10
        self.h = 300
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.smoke, self.overlays = [], []

    # -- pyramid ------------------------------------------------------------

    def tier_front(self, X0, X1, y0, y1):
        body, band = self.body, self.bandramp
        rounded = self.r.get('corners') == 'rounded'
        c = 3

        def sh(X, Y, Z, x, y):
            if Y > y1 - c:
                k = 5 if Y > y1 - .8 else 4 if Y > y1 - 2 else 3
                if rounded and (X - X0 < 1 or X1 - X < 1): k -= 1
                return band[k]
            if Y > y1 - c - 1: return body[1]
            k = 4 if Y < y1 - c - 3 else 3
            if rounded:
                if X - X0 < 1: k = 5
                elif X1 - X < 1: k = 2
                elif X1 - X < 2: k -= 1
            if body is self.pal['stone'] and ((int(Y) % 4 == 0) or (int(X + (int(Y) // 4) * 3) % 7 == 0)):
                k -= 1
            elif h2(x, y, 3) % 41 == 0: k -= 1
            return body[max(0, k)]
        return sh

    def pyramid(self):
        n, th = self.r['tiers'], self.r['tierHeight']
        W, D = self.W, self.D
        ta = W * self.r['top'][0]
        tz = D * self.r['top'][1]
        self.H = n * th
        body, band = self.body, self.bandramp
        for i in range(n):
            a, z = ta * i / n, tz * i / n
            y0, y1 = i * th, (i + 1) * th
            X0, X1 = a, W - a
            self.face([(X0, y1, z), (X1, y1, z), (X1, y1, D), (X0, y1, D)],
                      lambda X, Y, Z, x, y: band[5] if Z < z + 1 else body[4] if (x + y) % 9 else body[3])
            self.face([(X1, y0, z), (X1, y0, D), (X1, y1, D), (X1, y1, z)],
                      lambda X, Y, Z, x, y, y1=y1: band[2] if Y > y1 - 3 else body[1] if Y > y1 - 4 else body[2] if Z < D - 3 else body[1])
            self.face([(X0, y0, z), (X1, y0, z), (X1, y1, z), (X0, y1, z)], self.tier_front(X0, X1, y0, y1))
        self.top_x0, self.top_x1, self.top_z = ta, W - ta, tz

    def stair_run(self, s0, s1):
        H, tz, st = self.H, self.top_z, self.stairramp

        def sh(X, Y, Z, x, y):
            k = 5 if Y % 2 < .9 else 3
            if X - s0 < 1: k = min(5, k + 1)
            if s1 - X < 1: k -= 1
            return st[k]
        self.face([(s0, 0, 0), (s1, 0, 0), (s1, H, tz), (s0, H, tz)], sh)

    def balustrade(self, b0, b1):
        H, tz = self.H, self.top_z
        pl, band = self.pal['plaster'], self.bandramp
        self.face([(b1, 0, 0), (b1, H, tz), (b1, 0, tz)], self.flat(pl[2]))
        self.face([(b0, 0, 0), (b1, 0, 0), (b1, H, tz), (b0, H, tz)],
                  lambda X, Y, Z, x, y: pl[5] if X - b0 < 1 else band[3] if b1 - X < 1.2 else pl[4])
        if not self.maya:
            # The Aztec balustrade stands up square at the top of the flight.
            self.box(b0, b1, H - 6, H + 4, tz - 1, tz + 2, self.flat(pl[4]), self.flat(pl[2]), self.flat(pl[5]))
            self.d.line((self.P(b0, H - 6, tz - 1), self.P(b1, H - 6, tz - 1)), fill=band[2])

    def stairs(self):
        W, style = self.W, self.r.get('stair', 'single')
        width = max(20, round(W * (.22 if style == 'single' else .16)))
        centres = [W / 2] if style == 'single' else [W * .33, W * .67]
        bw = 4 if not self.maya or self.scale != 'small' else 3
        for c in centres:
            s0, s1 = c - width / 2, c + width / 2
            self.stair_run(s0, s1)
            self.balustrade(s0 - bw, s0)
            self.balustrade(s1, s1 + bw)
            if self.r.get('serpents'):
                for bx in (s0 - bw, s1):
                    self.serpent(*self.P(bx + bw / 2, 0, 0))
        self.stair_centres = centres

    def serpent(self, cx, gy):
        stone = self.pal['stone'] if self.maya else self.pal['plaster']
        red, green = self.pal['red'], self.pal['accent']
        for j, row in enumerate(SERPENT):
            for i, ch in enumerate(row):
                x, y = cx - 4 + i, gy - 6 + j
                if ch == '#': self.px[x, y] = stone[5] if i < 3 and j < 3 else stone[4] if i < 6 else stone[2]
                elif ch == 'o': self.px[x, y] = green[2]
                elif ch == 'r': self.px[x, y] = red[3]
                elif ch == 'w': self.px[x, y] = stone[5]

    # -- summit ------------------------------------------------------------

    def shrine_box(self, cx, hw, wh, ramp, door=True):
        """Plastered walls of a summit shrine, with its dark doorway."""
        H, z0, D = self.H, self.top_z + 1, self.D - 1
        a, b = cx - hw, cx + hw
        self.ph, self.x0, self.x1, self.inset = H, a, b, z0
        self.face([(b, H, z0), (b, H, D), (b, H + wh, D), (b, H + wh, z0)], self.plaster(ramp, False, damp=False))
        self.face([(a, H, z0), (b, H, z0), (b, H + wh, z0), (a, H + wh, z0)], self.plaster(ramp, True, H + wh, 3, damp=False))
        red = self.pal['red']
        self.face([(a, H, z0), (b, H, z0), (b, H + 3, z0), (a, H + 3, z0)],
                  lambda X, Y, Z, x, y: red[4] if Y > H + 2 else red[3])
        gx, gy = self.P(cx, H, z0)
        if door:
            x, top = gx - DOOR_W // 2, gy - DOOR_H - 1
            self.d.rectangle((x - 2, top - 1, x + DOOR_W + 1, gy), fill=ramp[1])
            self.d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
            for yy in range(top, gy + 1):
                for xx in range(x + 1, x + 4):
                    if dither(xx, yy, .6 - (xx - x) * .18): self.px[xx, yy] = INTERIOR[2]
                self.px[x + DOOR_W + 1, yy] = ramp[4]
            self.d.rectangle((x - 3, top - 4, x + DOOR_W + 3, top - 2), fill=self.bandramp[3])
            self.d.line((x - 3, top - 4, x + DOOR_W + 3, top - 4), fill=self.bandramp[5])
            self.d.line((x - 3, top - 1, x + DOOR_W + 3, top - 1), fill=ramp[1])
        return a, b, z0, gx, gy

    def high_roof(self, a, b, y0, z0, god):
        """The tall painted roof over an Aztec shrine: Tlaloc's in blue and
        white bands, Huitzilopochtli's red with white marks, or a fret."""
        ramp, acc, red, pl = self.shrineramp, self.pal['accent'], self.pal['red'], self.pal['plaster']
        up, lean = 24, 3

        def sh(X, Y, Z, x, y):
            i, j = int(X - a), int(Y - y0)
            if j < 1: return pl[5]
            if god == 'tlaloc':
                c = acc[3] if (i // 3) % 2 else pl[4]
                if (i // 3) % 2 and j % 6 == 3 and i % 3 == 1: c = pl[5]
            elif god == 'huitzil':
                c = red[3]
                if j % 6 in (2, 3) and i % 6 in (2, 3): c = pl[5]
            else:
                c = self.bandramp[3] if (i + (j // 3) * 3) % 8 < 4 else pl[4]
            if i < 1: c = pl[5]
            return c
        self.face([(b, y0, z0), (b, y0, self.D - 1), (b, y0 + up, self.D - 1), (b, y0 + up, z0 + lean)],
                  lambda X, Y, Z, x, y: red[2] if god == 'huitzil' else acc[1] if god == 'tlaloc' else pl[2])
        self.face([(a, y0, z0), (b, y0, z0), (b, y0 + up, z0 + lean), (a, y0 + up, z0 + lean)], sh)
        top = y0 + up
        self.box(a - 1, b + 1, top, top + 2, z0 + lean - 1, self.D - 1, self.flat(pl[5]), self.flat(pl[2]), self.flat(pl[5]))
        # Crest of cut-shell merlons along the ridge.
        for X in range(int(a) + 1, int(b) - 3, 5):
            cx, cy = self.P(X + 2, top + 5, z0 + lean)
            for dx in range(-2, 3):
                for dy in range(-3, 3):
                    if dx * dx + dy * dy <= 6 and dy <= 1:
                        self.px[cx + dx, cy + dy] = pl[5] if dx < 0 else pl[4] if dx < 2 else pl[3]
            self.px[cx, cy - 1] = red[2]
        return top + 5

    def summit(self):
        s, H = self.r['summit'], self.H
        W = self.W
        cx = W / 2
        if s == 'twin':
            hw = (self.top_x1 - self.top_x0) * .18
            doors = []
            for c, god in ((self.W * .33, 'tlaloc'), (self.W * .67, 'huitzil')):
                a, b, z0, gx, gy = self.shrine_box(c, hw, 26, self.pal['plaster'])
                top = self.high_roof(a, b, H + 26, z0, god)
                doors.append((gx, gy))
            self.door_x, self.bottom = doors[1]
            self.roof_top = self.P(0, top + 4, self.top_z)[1]
        elif s == 'shrine':
            hw = (self.top_x1 - self.top_x0) * .3
            a, b, z0, gx, gy = self.shrine_box(cx, hw, 26, self.shrineramp)
            top = self.high_roof(a, b, H + 26, z0, ('tlaloc', 'huitzil', 'fret')[self.r.get('look', 0) % 3])
            self.door_x, self.bottom = gx, gy
            self.roof_top = self.P(0, top + 4, self.top_z)[1]
        elif s == 'comb':
            hw = (self.top_x1 - self.top_x0) * .42
            a, b, z0, gx, gy = self.shrine_box(cx, hw, 26, self.shrineramp)
            self.door_x, self.bottom = gx, gy
            self.maya_upper(a, b, H + 26, z0)
        else:
            hw = (self.top_x1 - self.top_x0) * .36
            a, b, z0, gx, gy = self.shrine_box(cx, hw, 27, self.pal['plaster'])
            self.door_x, self.bottom = gx, gy
            self.top, self.fz, self.D = H + 27, z0, self.D - 1
            self.rise = 26 if not self.maya else 30
            self.thatch_roof()
            self.D += 1

    def maya_upper(self, a, b, y0, z0):
        red, pl, acc = self.pal['red'], self.pal['plaster'], self.pal['accent']
        ramp = self.shrineramp
        self.box(a - 1, b + 1, y0, y0 + 3, z0 - 1, self.D - 1, self.flat(pl[4]), self.flat(pl[2]), self.flat(pl[5]))
        up, lean = 13, 2
        y1 = y0 + 3
        self.face([(b, y1, z0), (b, y1, self.D - 1), (b, y1 + up, self.D - 1), (b, y1 + up, z0 + lean)], self.flat(ramp[2]))
        self.face([(a, y1, z0), (b, y1, z0), (b, y1 + up, z0 + lean), (a, y1 + up, z0 + lean)],
                  lambda X, Y, Z, x, y: ramp[4] if X < a + 1.5 else ramp[3] if (h2(x, y) % 31) else ramp[2])
        sx, sy = self.P((a + b) / 2 - 5, y1 + up - 2, z0 + lean)
        for j, row in enumerate(MASK):
            for i, ch in enumerate(row):
                if ch == 'X': self.px[sx + i, sy + j] = pl[4] if i < 9 and j < 7 else pl[2]
                elif ch == 'O': self.px[sx + i, sy + j] = acc[3] if (i + j) % 2 else acc[4]
                elif ch == 'N': self.px[sx + i, sy + j] = pl[5] if i == 4 else pl[3]
        yt = y1 + up
        self.box(a - 1, b + 1, yt, yt + 2, z0 + lean - 1, self.D - 1, self.flat(pl[5]), self.flat(pl[2]), self.flat(pl[5]))
        self.x0, self.x1 = a, b
        self.inset, save = z0, self.D
        self.D = save - 1
        self.comb(yt + 2, scale=1.0 if self.scale == 'large' else .8)
        self.D = save

    def comb(self, y, scale=.6):
        """A roof comb sized to its temple: pierced tiers, sky through them."""
        red, plaster, acc = self.pal['red'], self.pal['plaster'], self.pal['accent']
        cxw = self.x0 + (self.x1 - self.x0) / 2
        half = (self.x1 - self.x0) * .34 * scale
        zc = (self.inset + self.D) / 2 + 1
        for hw, th in ((half, 10), (half * .74, 9), (half * .48, 7)):
            a, b = cxw - hw, cxw + hw
            self.box(a, b, y, y + th, zc, zc + 2, None, self.flat(red[1]), self.flat(red[4]))

            def sh(X, Y, Z, x, y_, a=a, b=b, y0=y, th=th):
                i, j = X - a, Y - y0
                if 2 < j < th - 2 and 2.5 < i < b - a - 2.5 and int(i - 2.5) % 6 < 2:
                    return None
                if 2 < j < th - 2 and int(i - 2.5) % 6 == 3 and j > th / 2: return acc[3]
                return red[4] if i < 1.5 or j > th - 1 else red[3] if j > 1 else red[2]
            self.face([(a, y, zc), (b, y, zc), (b, y + th, zc), (a, y + th, zc)], sh)
            y += th
        for X in range(int(cxw - half * .48) + 1, int(cxw + half * .48), 3):
            sx, sy = self.P(X, y, zc)
            self.px[sx, sy - 1] = plaster[5]; self.px[sx, sy - 2] = plaster[4]
        self.roof_top = self.P(0, y + 3, zc)[1]

    # -- furniture ---------------------------------------------------------

    def furnish(self):
        H, tz = self.H, self.top_z
        n = self.r.get('braziers', 0)
        ends = (self.top_x0 + 4, self.top_x1 - 4)
        if n:
            spots = [((self.W / 2) - 20, (self.W / 2) + 20)]
            if self.r['summit'] == 'twin': spots = [(self.W * .5 - 6, self.W * .5 + 6)]
            for X in spots[0][:n]:
                self.brazier(X, H, tz + .5)
            if n >= 4:
                for c in self.stair_centres[:1] + self.stair_centres[-1:]:
                    pass
                self.brazier(4, 0, 0, big=True)
                self.brazier(self.W - 5, 0, 0, big=True)
        for X in ends[:self.r.get('banners', 0)]:
            self.banner_pole(X, H, tz + 2)
        if self.r.get('banners', 0) >= 4:
            for X in (self.top_x0 + 10, self.top_x1 - 10):
                self.banner_pole(X, H, self.D - 2)

    # -- ball court --------------------------------------------------------

    def ballcourt(self):
        W, D = self.W, self.D
        pl, red, stone, acc = self.pal['plaster'], self.pal['red'], self.pal['stone'], self.pal['accent']
        end = 24
        zf, zb = 3, D - 5
        # End zones rise first, then the alley between them.
        self.face([(end, .1, zf), (W - end, .1, zf), (W - end, .1, zb), (end, .1, zb)],
                  lambda X, Y, Z, x, y: pl[3] if abs(X - W / 2) < .8 else pl[4] if (h2(x // 3, y) % 11) else pl[3])
        for m in (end + (W - 2 * end) * .2, W / 2, W - end - (W - 2 * end) * .2):
            sx, sy = self.P(m, 0, (zf + zb) / 2)
            for dx in range(-2, 3): self.px[sx + dx, sy] = red[3]
            self.px[sx, sy - 1] = red[4]; self.px[sx, sy + 1] = red[2]
        # Back range: bench sloping up to a sheer wall, the ring set in it.
        wall = 26
        self.face([(end, 0, zb), (W - end, 0, zb), (W - end, 8, zb + 2), (end, 8, zb + 2)],
                  lambda X, Y, Z, x, y: pl[5] if Y > 7.2 else pl[4] if Y > 1 else red[3])
        self.box(end, W - end, 8, wall, zb + 2, D, self.plaster(pl, True, wall, 2, damp=False), None, self.flat(pl[5]))
        self.band(wall - 8, 7, 'fret', red, pl, z=zb + 2, x0=end, x1=W - end)
        for X in range(int(end) + 12, int(W - end) - 4, 16):
            if abs(X - W / 2) > 8:
                self.d.line((self.P(X, 9, zb + 2), self.P(X, wall - 9, zb + 2)), fill=pl[3])
        cx, cy = self.P(W / 2, 14, zb + 2)
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                rr = dx * dx + dy * dy
                if 5 <= rr <= 18:
                    self.px[cx + dx, cy + dy] = stone[5] if dx + dy < -2 else stone[4] if dx + dy < 3 else stone[2]
                elif rr < 5: self.px[cx + dx, cy + dy] = INTERIOR[1]
        for k in range(1, 4): self.px[cx + 4 + k // 2, cy + 3 + k] = pl[3]
        # End buildings close the I; the way in is through the left one.
        for a, b in ((0, end), (W - end, W)):
            self.box(a, b, 0, 30, 0, D, self.plaster(pl, True, 30, 2), self.plaster(pl, False, 30, 2) if b == W else None,
                     lambda X, Y, Z, x, y: pl[5] if Z < 1 or X < a + 1 else pl[4])
            self.face([(a, 0, 0), (b, 0, 0), (b, 3, 0), (a, 3, 0)], self.flat(red[3]))
            self.band(22, 6, 'fret', red, pl, z=0, x0=a, x1=b)
        # Front range: only a low kerb, so the play shows over it.
        self.box(end, W - end, 0, 3, 0, zf, self.flat(pl[4]), None, lambda X, Y, Z, x, y: pl[5])
        self.d.line((self.P(end, 0, 0), self.P(W - end, 0, 0)), fill=red[3])
        self.ph, self.x0, self.x1, self.inset = 0, 0, end, 0
        gx, gy = self.P(end / 2, 0, 0)
        x, top = gx - DOOR_W // 2, gy - DOOR_H - 1
        self.d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        for yy in range(top, gy + 1): self.px[x + DOOR_W + 1, yy] = pl[4]; self.px[x - 1, yy] = pl[2]
        self.d.rectangle((x - 2, top - 3, x + DOOR_W + 2, top - 1), fill=red[3])
        self.door_x, self.bottom = gx, gy
        top_y = wall
        if self.r.get('shrine'):
            a, b = W / 2 - 14, W / 2 + 14
            self.box(a, b, wall, wall + 16, zb + 3, D, self.plaster(pl, True, wall + 16, 2), self.flat(pl[2]),
                     self.flat(pl[5]))
            sx, sy = self.P(W / 2, wall, zb + 3)
            self.d.rectangle((sx - 3, sy - 11, sx + 3, sy), fill=INTERIOR[0])
            self.box(a - 1, b + 1, wall + 16, wall + 19, zb + 2, D, self.flat(red[3]), self.flat(red[1]), self.flat(red[4]))
            top_y = wall + 19
            self.banner_pole(a + 2, wall, zb + 3); self.banner_pole(b - 2, wall, zb + 3)
        self.brazier(end / 2, 30, D / 2)
        self.brazier(W - end / 2, 30, D / 2)
        bx, by = self.P(W / 2 - 20, 0, (zf + zb) / 2)
        self.overlays.append(['ball', bx - 3, by - 9])
        self.roof_top = self.P(0, top_y + 20, D)[1]

    # -- whole -------------------------------------------------------------

    def render(self):
        if self.kind == 'ballcourt':
            self.ballcourt()
        else:
            self.pyramid()
            self.stairs()
            self.summit()
            self.furnish()
        self.d.line((self.ox, self.G + 1, self.ox + self.W + self.D // 2, self.G + 1), fill=(30, 34, 26, 150))
        return self.finish()


def build_meso_animations(sprites):
    """Four frames each: a brazier's fire at two sizes, a paper banner, a ball."""
    for name, (w, h) in (('flame', (9, 12)), ('flame-small', (7, 9))):
        for f in range(4):
            im = Image.new('RGBA', (w, h)); px = im.load()
            sway = (0, 1, 0, -1)[f]
            tall = h - (0, 2, 1, 3)[f]
            for y in range(h):
                t = (h - 1 - y) / tall
                if t > 1: continue
                half = (w / 2 - .5) * math.sin(math.pi * min(1, (1 - t) ** .6 * .95 + .05)) * (1 - t * .35)
                cx = (w - 1) / 2 + sway * t
                for x in range(w):
                    dd = abs(x - cx)
                    if dd > half + .3: continue
                    k = dd / max(.5, half)
                    c = 4 if k < .3 and t < .45 else 3 if k < .55 and t < .7 else 2 if k < .85 else 1
                    if t > .8: c = min(c, 2)
                    px[x, y] = FLAME[c] + (255,)
            if f in (1, 3):
                px[int((w - 1) / 2 - sway * 2), 0] = FLAME[3] + (255,)
            sprites[f'animation-{name}-{f}'] = im
    paper = [(120, 116, 110), (205, 198, 182), (240, 234, 216), (255, 252, 240)]
    for f in range(4):
        im = Image.new('RGBA', (8, 14)); px = im.load()
        for y in range(14):
            off = round(math.sin(y / 3 + f * math.pi / 2) * 1.3 * y / 13)
            nxt = round(math.sin((y + 1) / 3 + f * math.pi / 2) * 1.3 * (y + 1) / 13)
            for x in range(5):
                c = 2 if x else 3
                if x == 4 or (nxt > off and x > 2): c = 1
                if y % 5 == 2 and x in (1, 2): c = -1
                px[min(7, x + off + 1), y] = (40, 30, 36, 255) if c == -1 else paper[c] + (255,)
        sprites[f'animation-banner-{f}'] = im
    for f in range(4):
        im = Image.new('RGBA', (7, 10)); px = im.load()
        lift = (0, 3, 5, 3)[f]
        for dx in range(-2, 3): px[3 + dx, 9] = (0, 0, 0, 90)
        cy = 7 - lift
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                px[3 + dx, cy + dy] = (58, 50, 56, 255)
        px[3, cy - 2] = (38, 32, 38, 255); px[3, cy + 2] = (30, 26, 30, 255)
        px[1, cy] = (48, 42, 46, 255); px[5, cy] = (30, 26, 30, 255)
        px[2, cy - 1] = (120, 110, 104, 255)
        sprites[f'animation-ball-{f}'] = im


def meso_landmark_recipes(root, source):
    data = json.loads((root / 'src/content/graphics/meso-landmarks.json').read_text())
    houses = json.loads((root / 'src/content/graphics/regional-houses.json').read_text())
    out = {}
    base = {'roof': 'flat', 'opening': 'door', 'attachments': [], 'roofMaterial': 'earth',
            'wall': 'lime-plaster', 'stories': 1, 'oblique': True, 'deep': True}
    for profile, spec in data['temples'].items():
        prof = houses['profiles'][profile]
        for scale, shape in spec['scales'].items():
            for look, look_spec in enumerate(spec['looks']):
                fw, fh = shape['footprint']
                name = f'religious-meso-temple-{profile}-{scale}-{look}'
                out[name] = {**base, **shape, 'footprint': [fw, fh], 'entrance': [fw // 2, fh],
                             'palette': prof['palette'], 'regionalProfile': profile,
                             'mesoLandmark': 'temple', 'goldScale': scale, 'look': look, 'lookSpec': look_spec,
                             'religious': True, 'family': 'meso-temple', 'recipe': f'meso-temple-{profile}',
                             'height': shape['tiers'] * shape['tierHeight'] + 48,
                             'seed': 20100 + look * 31 + fw * 7,
                             'label': f"{spec['label']} · {scale}",
                             'description': 'A plastered stepped platform with a stair to the shrine at its summit, where braziers burn before the door. Composed from surviving sites; tiers and colour are illustrative.'}
    nahua = houses['profiles']['nahua']
    for vname, spec in data['venues'].items():
        for scale, shape in spec['scales'].items():
            fw, fh = shape['footprint']
            name = f'{vname}-{scale}-0'
            common = {**base, 'footprint': [fw, fh], 'entrance': [fw // 2, fh], 'palette': nahua['palette'],
                      'regionalProfile': 'nahua', 'goldScale': scale, 'goldVariant': 0, 'height': 60,
                      'seed': 21100 + fw * 13 + len(vname), 'label': f"{spec['label']} · {scale}",
                      'description': spec['description']}
            if spec['painter'] == 'ballcourt':
                out[name] = {**common, **shape, 'mesoLandmark': 'ballcourt'}
            else:
                # Houses in the ordinary sense: the house painter, dressed up.
                common.pop('deep')
                hall = spec['painter'] == 'hall'
                out[name] = {**common, **nahua, 'mesoamerican': True,
                             'regionalHouse': 'meso-terrace' if hall else 'meso-service',
                             'serviceStyle': None if hall else 'sweatbath',
                             'goldScale': spec.get('hallScale', scale) if hall else scale,
                             'wealthTier': 2 if spec.get('hallScale') == 'large' else 1,
                             'surfaceTreatments': ['lime'], 'roofFeatures': ['none'],
                             'banners': hall, 'braziers': hall or scale != 'small',
                             'buildingFunction': vname.removeprefix('meso-'), 'sideDepth': 12,
                             'roofPlan': 'terrace' if hall else 'hip', 'roofAccess': 'none',
                             'roofSurfaces': [{'rect': [0, 0, fw, fh], 'level': 1, 'kind': 'terrace',
                                               'walkable': True}] if hall else []}
    return out
