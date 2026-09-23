"""Steppe and forest dwellings: the felt tent, the tent on a cart, and the
log or turf winter house.

A tent is round, so it has no side wall to shear: it is sampled as a surface
of revolution (wall drum, then a shallow cone, a dome or a steep cone of
roof) and drawn through a depth buffer, each sample lit by its normal against
oblique_style's sun. Depth is squashed by K_ROUND, the same foreshortening the
other round houses use. The winter house is a box in oblique_meso's world
(X right, Y up, Z back) with the settled 12px return.

Everything cultural (tent form, felt, ropes, door, applique pattern and
colours, extras) comes from the profile's `steppe` block in
regional-houses.json. The early domed and conical felt tents are
reconstructions from burial finds and classical descriptions, not surveyed
dwellings.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import INTERIOR, _rgb, dither, h2
from art.oblique_style import side_depth

K_ROUND = .45
LIGHT = (-.55, .55, .62)
MOTIFS = {
    # Ulzii knot, meander, ram's horn and a Pazyryk-style running beast,
    # each as it reads four pixels tall.
    'knot': ["XX.XX.", "X.X.X.", ".X.X..", "X.X.X.", "XX.XX."][:4],
    'meander': ["XXXX.X", "...X.X", "XX.X.X", "X..XXX"],
    'ram-horn': [".XX..XX.", "X..XX..X", "X.X..X.X", ".X....X."],
    'animal': ["...XX...", "XXXXXX..", ".XXXX.X.", ".X..X..."],
    'cloud': [".XX....", "X..X.XX", "X....X.", ".XXXX.."],
}


def lambert(n):
    l = sum(a * b for a, b in zip(n, LIGHT)) / math.sqrt(sum(a * a for a in LIGHT))
    return max(-1, min(1, l))


def ramp_at(r, i):
    return r[max(0, min(len(r) - 1, int(round(i))))]


class ObliqueSteppe:
    def __init__(self, recipe, material):
        r = self.r = recipe
        rng = self.rng = random.Random(recipe['seed'] + 911)
        s = self.st = recipe['steppe']
        self.pal = {k: [_rgb(c) for c in v] for k, v in s['palette'].items()}
        self.plan = recipe['steppePlan']
        self.tier = recipe.get('wealthTier', 1)
        tiered = lambda key: s[key][min(self.tier, len(s[key]) - 1)]
        pick = lambda key, default=None: rng.choice(s.get(key) or [default])
        self.form = pick('tentForms', 'ger')
        self.felt = self.pal[rng.choice(tiered('felts'))]
        self.door = rng.choice(tiered('doors'))
        self.motif = pick('motifs', 'knot')
        self.applique = self.pal[pick('appliqueColours', 'door-red')]
        self.ropes = pick('ropeBands', 2)
        self.decorated = self.tier >= 2 or (self.tier == 1 and rng.random() < .4)
        self.winter_roof = pick('winterRoofs', 'sod')
        self.extras = {e for e in s.get('extras', []) if rng.random() < .45 + .2 * self.tier}
        self.smoke, self.overlays = [], []
        fw, fh = recipe['footprint']
        self.fw, self.fh = fw, fh
        self.no_side = self.plan in ('tent', 'cart')
        self.sw = side_depth(fh)
        self.ox = 12
        self.w = self.ox + fw * 16 + self.sw + 16
        self.h = 150
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.zbuf = {}
        self.roof_top = self.G - 30

    def put(self, x, y, c, z=None):
        if not (0 <= x < self.w and 0 <= y < self.h) or not c: return
        if z is not None:
            if self.zbuf.get((x, y), -1e9) > z: return
            self.zbuf[(x, y)] = z
        self.px[x, y] = c

    # -- the round tent ---------------------------------------------------

    def tent_geometry(self, R, base_y):
        form = self.form
        self.R, self.cx, self.cy = R, self.ox + self.fw * 8, base_y
        if form == 'ger':
            self.hw, self.over, self.rise, self.rc = 25, 2, R * .5 + 3, max(4, R * .24)
        elif form == 'dome':
            self.hw, self.over, self.rise, self.rc = 12, 1, R * .95 + 6, max(3, R * .16)
        else:
            self.hw, self.over, self.rise, self.rc = 0, 0, R * 1.7 + 8, 2

    def to_screen(self, r, phi, hgt):
        x = self.cx + r * math.sin(phi)
        z = r * math.cos(phi)
        y = self.cy + z * K_ROUND - hgt
        return x, y, z + hgt * K_ROUND

    def roof_profile(self, t):
        """Radius and height of the roof at t (eave 0 to crown 1)."""
        R, hw, rise, rc = self.R + self.over, self.hw, self.rise, self.rc
        if self.form == 'dome':
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a), hw + rise * math.sin(a)
        if self.form == 'ger':
            # The roof poles bow very slightly under the felt.
            return R - (R - rc) * t, hw - 1 + rise * (t ** .92)
        return R - (R - rc) * t, hw + rise * t

    def wall_colour(self, phi, hgt, s_arc):
        felt = self.felt
        n = (math.sin(phi), 0, math.cos(phi))
        c = 2.6 + 2.2 * lambert(n)
        seam = int(s_arc) % 11 == 0
        if seam: c -= .8
        bands = [self.hw * f for f in ((.3, .72) if self.ropes == 2 else (.22, .5, .78))]
        for b in bands:
            if abs(hgt - b) < .55: return ramp_at(self.pal['rope'], c - .6)
            if abs(hgt - b - 1) < .5: return ramp_at(self.pal['rope'], c + .8)
        if self.decorated and hgt < 5:
            return self.pattern(s_arc, hgt, c, 5)
        if hgt < 2 and dither(int(s_arc), int(hgt), .5): c -= 1
        if h2(int(s_arc), int(hgt * 2), 7) % 23 == 0: c -= .7
        return ramp_at(felt, c)

    def pattern(self, s_arc, v, c, band_h):
        m = MOTIFS[self.motif]
        j = int(band_h - 1 - v)
        if j <= 0 or j >= band_h - 1 + (0 if band_h > 5 else 1):
            return ramp_at(self.applique, c - 1.2)
        row = m[min(len(m) - 1, j - 1)]
        on = row[int(s_arc) % len(row)] == 'X'
        base = self.pal['felt-white'] if self.applique is not self.pal['felt-white'] else self.pal['blue']
        return ramp_at(self.applique, c - .4) if on else ramp_at(base, c)

    def roof_colour(self, t, phi, s_arc, n):
        c = 2.6 + 2.4 * lambert(n)
        felt = self.felt
        if self.form == 'cone' and 'bark' in self.st.get('coneCover', ''):
            felt = self.pal['bark']
            if int(t * 20) % 4 == 0: c -= 1
            if h2(int(s_arc), int(t * 30)) % 9 == 0: c -= 1.2
        if self.decorated and self.form != 'cone' and t < .14:
            return self.pattern(s_arc * .9, t / .14 * 6, c, 6)
        if t > .82: c -= (t - .82) * 6
        if int(s_arc * 1.3) % 13 == 0 and t < .8: c -= .7
        if self.form == 'ger' and int(t * self.rise) % 7 == 3 and t < .8: c -= .4
        if h2(int(s_arc), int(t * 40), 3) % 29 == 0: c -= .8
        return ramp_at(felt, c)

    def draw_tent(self):
        R = self.R
        # Wall drum.
        if self.hw:
            steps = int(math.pi * R * 3)
            for i in range(steps + 1):
                phi = -math.pi / 2 + math.pi * i / steps
                for k in range(int(self.hw * 2) + 1):
                    hgt = k / 2
                    x, y, z = self.to_screen(R, phi, hgt)
                    self.put(int(x), int(y), self.wall_colour(phi, hgt, (phi + math.pi) * R), z)
        # Roof.
        Rm = R + self.over
        steps = int(2 * math.pi * Rm * 2.2)
        rows = int(self.rise * 2.4) + 8
        for j in range(rows + 1):
            t = j / rows
            r0, h0 = self.roof_profile(t)
            r1, h1 = self.roof_profile(min(1, t + .02))
            dr, dh = r1 - r0, h1 - h0
            ln = math.hypot(dr, dh) or 1
            for i in range(steps):
                phi = -math.pi + 2 * math.pi * i / steps
                if math.cos(phi) < -.2 and t < .9: continue
                n = (dh / ln * math.sin(phi), -dr / ln, dh / ln * math.cos(phi))
                x, y, z = self.to_screen(r0, phi, h0)
                self.put(int(x), int(y), self.roof_colour(t, phi, (phi + math.pi) * r0, n), z)
        # Eave lip: the roof felt's edge hangs over the wall.
        if self.form == 'ger':
            for i in range(int(math.pi * Rm * 3)):
                phi = -math.pi / 2 + math.pi * i / (math.pi * Rm * 3)
                x, y, z = self.to_screen(Rm, phi, self.hw - 1.5)
                n = (math.sin(phi), 0, math.cos(phi))
                self.put(int(x), int(y), ramp_at(self.felt, 1.5 + lambert(n)), z + 5)
        self.crown()
        self.roof_top = int(self.cy - self.hw - self.rise) - 6

    def crown(self):
        """The crown: a timber ring with its spokes, half covered by the felt
        flap that is pulled over it at night; or poles through a cone."""
        wood = self.pal['wood']
        top = self.hw + self.rise
        cx, cy = self.cx, self.cy - top
        if self.form == 'cone':
            for dx, lean in ((-2, -1), (0, 0), (2, 1), (1, 2)):
                for k in range(7):
                    self.put(int(cx + dx + lean * k * .5), int(cy - k), wood[3 if dx < 1 else 1])
            self.smoke.append([int(cx), int(cy - 6), 'vent'])
            return
        rc = self.rc
        ry = rc * K_ROUND
        for i in range(int(rc * 8)):
            a = 2 * math.pi * i / (rc * 8)
            x, y = cx + rc * math.sin(a), cy + ry * math.cos(a)
            self.put(int(x), int(y), wood[4] if math.sin(a) < -.3 else wood[2])
            self.put(int(x), int(y) - 1, wood[1])
        inner = INTERIOR[0]
        for yy in range(int(cy - ry) + 1, int(cy + ry)):
            for xx in range(int(cx - rc) + 2, int(cx + rc) - 1):
                if ((xx - cx) / (rc - 1.5)) ** 2 + ((yy - cy) / max(1, ry - .8)) ** 2 < 1:
                    self.put(xx, yy, inner)
        for xx in range(int(cx - rc) + 2, int(cx + rc) - 1):
            self.put(xx, int(cy), wood[3])
        for yy in range(int(cy - ry) + 1, int(cy + ry)):
            self.put(int(cx), yy, wood[3])
        # The flap folded back over the rear half.
        felt = self.felt
        for yy in range(int(cy - ry) - 2, int(cy)):
            for xx in range(int(cx - rc) - 1, int(cx + rc) + 2):
                if abs(xx - cx) < rc + 1 - (cy - ry - yy) * .3:
                    self.put(xx, yy, felt[3] if xx < cx else felt[2])
        self.d.line((cx - rc - 1, cy - ry - 2, cx + rc + 1, cy - ry - 2), fill=felt[4])
        self.smoke.append([int(cx), int(cy - ry - 2), 'vent'])

    def tent_door(self, ground):
        cx = self.cx
        x, top = cx - DOOR_W // 2, ground - DOOR_H - 1
        d, wood = self.d, self.pal['wood']
        style = self.door
        if style == 'painted':
            red = self.pal['door-red']
            d.rectangle((x - 3, top - 3, x + DOOR_W + 2, ground), fill=wood[2])
            d.line((x - 3, top - 3, x + DOOR_W + 2, top - 3), fill=wood[4])
            d.line((x - 3, top - 3, x - 3, ground), fill=wood[4])
            d.rectangle((x - 1, top - 1, x + DOOR_W, ground), fill=red[1])
            d.rectangle((x, top, x + DOOR_W, ground), fill=INTERIOR[0])
            # Knot panels on the lintel.
            for i in range(0, DOOR_W + 3, 3):
                d.point((x - 2 + i, top - 2), fill=self.pal['ochre'][4])
        else:
            felt = self.felt
            d.rectangle((x - 2, top - 1, x + DOOR_W + 1, ground), fill=wood[1])
            d.rectangle((x, top, x + DOOR_W, ground), fill=INTERIOR[0])
            # The door felt rolled up over the opening.
            d.rectangle((x - 1, top - 1, x + DOOR_W + 1, top + 2), fill=felt[3])
            d.line((x - 1, top - 1, x + DOOR_W + 1, top - 1), fill=felt[5])
            d.line((x - 1, top + 2, x + DOOR_W + 1, top + 2), fill=felt[1])
            if self.decorated:
                for i in range(0, DOOR_W + 2, 2):
                    d.point((x + i, top), fill=self.applique[3])
            d.line((x + 2, top - 2, x + 2, top + 3), fill=self.pal['rope'][2])
            d.line((x + DOOR_W - 2, top - 2, x + DOOR_W - 2, top + 3), fill=self.pal['rope'][2])
        for yy in range(top, ground + 1):
            for xx in range(x + 1, x + 4):
                if dither(xx, yy, .55 - (xx - x) * .16): self.put(xx, yy, INTERIOR[2])
        d.line((x - 1, ground, x + DOOR_W + 1, ground), fill=wood[3])
        self.door_x, self.bottom = cx, ground

    # -- things round a tent ----------------------------------------------

    def fuel_stack(self, x, y):
        dung = self.pal['dung']
        for j in range(7):
            w = 7 - abs(j - 1)
            for i in range(-w, w + 1):
                c = dung[4] if i < -w + 2 else dung[1] if i > w - 2 else dung[3 - (h2(i, j) % 3 == 0)]
                if j % 2 == 0 and (i + j) % 4 == 0: c = dung[1]
                self.put(x + i, y - j, c)

    def standard(self, x, y):
        """A horse-hair standard: a lance with a trident head and a black
        or white tail, planted by an important tent."""
        wood, hair = self.pal['wood'], self.pal['horsehair']
        for k in range(34): self.put(x, y - k, wood[2 if k % 5 else 1]); self.put(x + 1, y - k, wood[4] if k > 30 else None)
        metal = self.pal['stone']
        for dx in (-2, 0, 2): self.put(x + dx, y - 35, metal[5]); self.put(x + dx, y - 36, metal[4] if dx == 0 else None)
        self.d.line((x - 2, y - 34, x + 2, y - 34), fill=metal[3])
        for k in range(10):
            for dx in range(-2 - k // 4, 3 + k // 4):
                if h2(dx, k, x) % 3: self.put(x + dx, y - 33 + k, hair[1 + (dx < 0) + (k < 3)])

    def hitching_line(self, x0, x1, y):
        wood, rope = self.pal['wood'], self.pal['rope']
        for x in (x0, x1):
            for k in range(11): self.put(x, y - k, wood[3 if k % 4 else 2]); self.put(x + 1, y - k, wood[1])
        self.d.line((x0, y - 9, x1, y - 9), fill=rope[3])
        for x in range(x0 + 3, x1, 5): self.put(x, y - 8, rope[1])

    def drying_rack(self, x, y):
        wood, meat = self.pal['wood'], self.pal['meat']
        for dx in (0, 12):
            for k in range(13): self.put(x + dx, y - k, wood[3])
        self.d.line((x, y - 12, x + 12, y - 12), fill=wood[4])
        for i in range(2, 11, 2):
            for k in range(2 + (i * 7) % 4):
                self.put(x + i, y - 11 + k, meat[3 if k == 0 else 2])

    def cart(self, x, y, small=True):
        """A two-wheeled cart parked beside the tent, shafts down."""
        wood = self.pal['wood']
        r = 5 if small else 7
        self.d.rectangle((x, y - r - 5, x + 16, y - r - 3), fill=wood[3])
        self.d.line((x, y - r - 5, x + 16, y - r - 5), fill=wood[4])
        for i in range(0, 17, 4): self.d.line((x + i, y - r - 9, x + i, y - r - 5), fill=wood[2])
        self.d.line((x + 16, y - r - 4, x + 24, y - 1), fill=wood[2])
        self.wheel(x + 6, y - r, r)

    def wheel(self, cx, cy, r):
        wood = self.pal['wood']
        for a in range(0, 360, 6):
            t = math.radians(a)
            self.put(int(cx + r * math.cos(t)), int(cy + r * math.sin(t)), wood[4] if math.sin(t) < 0 else wood[1])
        for a in range(0, 180, 45):
            t = math.radians(a)
            self.d.line((cx - r * math.cos(t), cy - r * math.sin(t), cx + r * math.cos(t), cy + r * math.sin(t)), fill=wood[2])
        self.put(cx, cy, wood[5])

    def render_tent(self):
        fw = self.fw
        R = fw * 8 - 3
        ground = self.G - 2
        self.tent_geometry(R, ground - int(R * K_ROUND))
        if 'fuel' in self.extras:
            self.fuel_stack(self.cx + R - 2, self.cy - int(R * K_ROUND * .6))
        self.draw_tent()
        front = int(self.cy + R * K_ROUND)
        self.tent_door(front)
        if 'standard' in self.extras and self.tier >= 2:
            self.standard(self.cx - DOOR_W // 2 - 8, front + 1)
        if 'hitching' in self.extras and fw >= 3:
            self.hitching_line(self.ox - 8, self.ox + 6, front - 2)
        elif 'rack' in self.extras:
            self.drying_rack(self.ox - 10, front - 3)
        if 'cart' in self.extras and fw >= 3:
            self.cart(self.cx + R - 4, front + 2)

    # -- the tent on a cart ------------------------------------------------

    def render_cart(self):
        """A felt tent lashed to a wagon bed: the house that moved with the
        herds, with its shaft and yoke run out to the left."""
        wood = self.pal['wood']
        W = self.fw * 16
        x0, x1 = self.ox + 4, self.ox + W - 2
        ground = self.G - 2
        wr = 9
        deck = ground - wr - 4
        # Far wheels, the bed, then the tent.
        for wx in (x0 + 8, x1 - 8):
            self.wheel(wx + 6, deck + 1, wr - 1)
        self.d.rectangle((x0, deck - 3, x1, deck + 2), fill=wood[3])
        self.d.line((x0, deck - 3, x1, deck - 3), fill=wood[5])
        self.d.line((x0, deck + 2, x1, deck + 2), fill=wood[1])
        for x in range(x0 + 3, x1, 6): self.put(x, deck, wood[1])
        self.d.polygon([(x0 + 6, deck - 3), (x1 - 6, deck - 3), (x1, deck - 6), (x0 + 12, deck - 6)], fill=wood[4])
        R = (x1 - x0) // 2 - 7
        self.form = 'dome' if self.form == 'cone' else self.form
        self.tent_geometry(R, deck - 4 - int(R * K_ROUND))
        # A cart tent sits low so it clears the road and the wind.
        self.hw = min(self.hw, 14)
        self.cx = (x0 + x1) // 2 + 3
        self.draw_tent()
        self.tent_door(int(self.cy + R * K_ROUND))
        for wx in (x0 + 8, x1 - 8):
            self.wheel(wx, deck + 3, wr)
        # Shaft and yoke.
        self.d.line((x0, deck + 1, x0 - 11, ground - 3), fill=wood[2])
        self.d.line((x0, deck, x0 - 11, ground - 4), fill=wood[4])
        self.d.line((x0 - 14, ground - 5, x0 - 8, ground - 5), fill=wood[3])

    # -- the winter house -------------------------------------------------

    def P(self, X, Y, Z):
        return (round(self.ox + X + Z), round(self.G - Y - Z))

    def face(self, pts, shader):
        scr = [self.P(*p) for p in pts]
        mask = Image.new('1', (self.w, self.h))
        ImageDraw.Draw(mask).polygon(scr, fill=1)
        box = mask.getbbox()
        if not box: return
        m = mask.load()
        O = pts[0]
        a = [pts[1][i] - O[i] for i in range(3)]
        b = [pts[-1][i] - O[i] for i in range(3)]
        ax, ay = a[0] + a[2], -(a[1] + a[2])
        bx, by = b[0] + b[2], -(b[1] + b[2])
        det = ax * by - bx * ay
        if abs(det) < 1e-6: return
        sx, sy = self.ox + O[0] + O[2], self.G - O[1] - O[2]
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                if not m[x, y]: continue
                dx, dy = x + .5 - sx, y + .5 - sy
                u = (dx * by - bx * dy) / det
                v = (ax * dy - dx * ay) / det
                c = shader(O[0] + u * a[0] + v * b[0], O[1] + u * a[1] + v * b[1],
                           O[2] + u * a[2] + v * b[2], x, y)
                if c: self.px[x, y] = c

    def logs(self, lit, along):
        """Round logs laid up in courses: lit crown, shaded belly, a dark
        chink between."""
        wood = self.pal['log']

        def sh(X, Y, Z, x, y):
            k = Y % 4
            u = along(X, Z)
            c = [lit - 2, lit - 1, lit + 1, lit][int(k)]
            if h2(int(Y // 4), int(u) // 5) % 7 == 0 and k >= 2: c -= 1
            if int(u + Y // 4 * 3) % 17 == 0 and k >= 1: c -= 1
            return ramp_at(wood, c)
        return sh

    def render_winter(self):
        W, D = self.fw * 16, self.sw
        pen = self.fh >= 3 and self.fw >= 4
        x0 = 26 if pen else 0
        x1 = W
        wh = 26
        earth, sod, wood = self.pal['earth'], self.pal['sod'], self.pal['wood']
        if pen: self.pen(0, x0 - 2, D)
        self.face([(x1, 0, 0), (x1, 0, D), (x1, wh, D), (x1, wh, 0)], self.logs(2, lambda X, Z: Z * 2))
        self.face([(x0, 0, 0), (x1, 0, 0), (x1, wh, 0), (x0, wh, 0)], self.logs(3, lambda X, Z: X))
        # Log ends crossing at the front corners.
        for X in (x0, x1):
            for Y in range(1, wh, 4):
                sx, sy = self.P(X, Y, 0)
                for dx, dy, c in ((-1, 0, wood[4]), (0, 0, wood[3]), (-1, 1, wood[2]), (0, 1, wood[1]), (1, 0, wood[2])):
                    self.put(sx + dx, sy - 2 + dy, c)
        # Earth banked against the foot for warmth, cut back at the door.
        cx = max(x0 + 9, min(x1 - 9, self.r['entrance'][0] * 16 + 8))
        bank = lambda X, Y, Z, x, y: (None if abs(X - cx) < 8 else
                                      earth[4] if Y > 4 else earth[3] if h2(x, y) % 5 else earth[2])
        self.face([(x0 - 1, 0, -4), (x1, 0, -4), (x1, 6, 0), (x0 - 1, 6, 0)], bank)
        self.face([(x1, 0, -4), (x1, 0, D), (x1, 6, D), (x1, 6, 0)],
                  lambda X, Y, Z, x, y: earth[2] if Y < 6 - (Z < 0) * (-Z) * 1.5 else None)
        roof = self.winter_roof
        ridge = wh + 11
        zc = D / 2
        o = 3
        rsh = self.roof_shader(roof, 3)
        self.face([(x1 + o, wh - 1, -o), (x1 + o, wh - 1, D + o), (x1 + o, ridge, zc)], self.roof_shader(roof, 1))
        self.face([(x1, wh, 0), (x1, wh, D), (x1, ridge - 1, zc)], self.logs(2, lambda X, Z: Z * 2))
        self.face([(x0 - o, wh - 1, -o), (x1 + o, wh - 1, -o), (x1 + o, ridge, zc), (x0 - o, ridge, zc)], rsh)
        a, b = self.P(x0 - o, wh - 1, -o), self.P(x1 + o, wh - 1, -o)
        rp = self.pal[roof]
        self.d.line((a[0], a[1] + 1, b[0], b[1] + 1), fill=rp[0])
        if roof == 'sod':
            for X in range(x0 - o, x1 + o, 3):
                if h2(X, 5) % 3 == 0:
                    sx, sy = self.P(X, wh - 1, -o)
                    self.put(sx, sy + 2, rp[2]); self.put(sx + 1, sy + 3, rp[1])
        p0, p1 = self.P(x0 - o, ridge, zc), self.P(x1 + o, ridge, zc)
        self.d.line((p0[0], p0[1] - 1, p1[0], p1[1] - 1), fill=wood[3])
        self.d.line((p0, p1), fill=wood[1])
        # Smoke hole and its hood.
        hx, hy = self.P((x0 + x1) / 2 + 6, ridge, zc)
        self.d.rectangle((hx - 2, hy - 4, hx + 2, hy), fill=wood[2])
        self.d.line((hx - 3, hy - 5, hx + 3, hy - 5), fill=wood[4])
        self.smoke.append([hx, hy - 6, 'chimney'])
        self.roof_top = hy - 12
        # Door, low under a heavy lintel.
        gx, gy = self.P(cx, 0, 0)
        x, top = gx - DOOR_W // 2, gy - DOOR_H - 1
        self.d.rectangle((x - 2, top - 4, x + DOOR_W + 2, gy), fill=wood[1])
        self.d.rectangle((x - 3, top - 5, x + DOOR_W + 3, top - 3), fill=wood[3])
        self.d.line((x - 3, top - 5, x + DOOR_W + 3, top - 5), fill=wood[5])
        self.d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        felt = self.felt
        self.d.rectangle((x, top, x + DOOR_W, top + 7), fill=felt[3])
        self.d.line((x, top + 7, x + DOOR_W, top + 7), fill=felt[1])
        self.door_x, self.bottom = gx, gy
        if 'fuel' in self.extras: self.fuel_stack(self.P(x1, 0, D)[0] + 4, self.P(x1, 0, D)[1] + 6)

    def roof_shader(self, kind, lit):
        ramp = self.pal[kind]

        def sh(X, Y, Z, x, y):
            if kind == 'bark':
                c = lit + (1 if int(X) % 9 < 7 else -1)
                if h2(int(X) // 3, int(Y)) % 6 == 0: c -= 2
                if int(Y) % 5 == 0: c -= 1
                return ramp_at(ramp, c)
            n = h2(x, y, 11)
            c = lit + (1 if n % 5 == 0 else -1 if n % 7 == 0 else 0)
            if kind == 'sod' and n % 13 == 0: return ramp_at(self.pal['earth'], 2)
            return ramp_at(ramp, c)
        return sh

    def pen(self, x0, x1, D):
        """A fold for the flock: dry-stone or wattle, a trampled floor."""
        stone = self.pal['stone']
        wattle = 'wattle' in self.st.get('pens', [])
        dung = self.pal['dung']
        self.face([(x0, .1, 0), (x1, .1, 0), (x1, .1, D), (x0, .1, D)],
                  lambda X, Y, Z, x, y: dung[3] if h2(x, y) % 4 else dung[2])
        hgt = 8

        def wall(lit):
            def sh(X, Y, Z, x, y):
                if wattle:
                    return self.pal['wood'][lit + (1 if (int(X + Z) + int(Y) // 2) % 3 == 0 else -1 if int(X + Z) % 5 == 0 else 0)]
                row = int(Y // 3)
                u = int(X + Z) + row * 2
                return stone[lit - 2] if Y % 3 < 1 or u % 5 == 0 else stone[lit - (h2(u // 5, row) % 3 == 0)]
            return sh
        self.face([(x0, 0, D), (x1, 0, D), (x1, hgt, D), (x0, hgt, D)], wall(3))
        self.face([(x0, 0, 0), (x0, 0, D), (x0, hgt, D), (x0, hgt, 0)], wall(3))
        self.face([(x0, 0, 0), (x1 - 8, 0, 0), (x1 - 8, hgt, 0), (x0, hgt, 0)], wall(4))

    # -- whole ------------------------------------------------------------

    def render(self):
        {'tent': self.render_tent, 'cart': self.render_cart, 'winter': self.render_winter}[self.plan]()
        self.d.line((self.ox, self.G + 1, self.ox + self.fw * 16 + 6, self.G + 1), fill=(30, 34, 26, 150))
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
