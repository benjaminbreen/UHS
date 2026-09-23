"""Foragers' shelters: the bark gunyah, the grass or spinifex dome, the brush
wickiup and the San grass hut, each with its family's fire and gear.

A shelter is the steppe tent's surface of revolution with no drum: a low
dome or cone of poles under its cover, lit by its normals through the same
depth buffer (oblique_steppe). Cover, form, size and the things round it come
from the profile's `forager` block in regional-houses.json. Reconstructions
from ethnographic descriptions and photographs; forms varied by season and
by who was building.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import INTERIOR, _rgb, dither, h2
from art.oblique_steppe import ObliqueSteppe, K_ROUND, lambert, ramp_at
from art.oblique_style import side_depth


class ObliqueForager(ObliqueSteppe):
    no_side = True

    def __init__(self, recipe, material):
        self.r = recipe
        rng = self.rng = random.Random(recipe['seed'] + 457)
        s = self.fg = recipe['forager']
        self.pal = {k: [_rgb(c) for c in v] for k, v in s['palette'].items()}
        self.form = rng.choice(s['forms'])
        self.cover = rng.choice(s['covers'])
        self.felt = self.pal[self.cover]
        self.gear = [g for g in s.get('gear', []) if rng.random() < .55]
        self.windbreak = s.get('windbreak') and rng.random() < .6
        self.decorated = False
        self.smoke, self.overlays = [], []
        fw, fh = recipe['footprint']
        self.fw, self.fh = fw, fh
        self.sw = side_depth(fh)
        self.plan = 'shelter'
        self.ox = 14
        self.w = self.ox + fw * 16 + 26
        self.h = 110
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.zbuf = {}
        self.roof_top = self.G - 30

    def tent_geometry(self, R, base_y):
        self.R, self.cx, self.cy = R, self.ox + self.fw * 8, base_y
        self.hw, self.over = 0, 0
        # High enough over the doorway to take the shared door leaf.
        self.rise = max(27, R * (1.25 if self.form == 'cone' else 1.0))
        self.rc = 1.5 if self.form == 'cone' else 2.5

    def roof_profile(self, t):
        R, rise, rc = self.R, self.rise, self.rc
        if self.form == 'dome':
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a) ** .8, rise * math.sin(a) ** 1.1
        if self.form == 'beehive':
            # Steep sides pulled in to a rounded top, the San and Khoe hut.
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a) ** 1.4, rise * math.sin(a) ** .8
        return R - (R - rc) * t, rise * t

    def roof_colour(self, t, phi, s_arc, n):
        ramp = self.felt
        c = 2.5 + 2.3 * lambert(n)
        kind = self.cover
        if kind.startswith('bark'):
            # Sheets of bark laid up the frame, each its own tone, a dark
            # crack where two meet and a lap every hand's breadth.
            sheet = int(s_arc / 6.5 + (int(t * 4) % 2) * .5)
            c += ((h2(sheet, int(t * 4)) % 5) - 2) * .35
            if (s_arc / 6.5 + (int(t * 4) % 2) * .5) % 1 < .16: c -= 1.3
            if (t * 4) % 1 < .07: c -= 1
            if h2(int(s_arc), int(t * 50), 3) % 11 == 0: c -= .7
        elif kind in ('grass', 'spinifex'):
            course = t * self.rise / 3.2
            f = course % 1 + (h2(int(s_arc), int(course)) % 3) * .12
            c += .8 if f < .25 else -.9 if f > .85 else 0
            if kind == 'spinifex' and h2(int(s_arc * 2), int(course * 3)) % 4 == 0: c -= .8
        elif kind == 'brush':
            n2 = h2(int(s_arc / 3), int(t * self.rise / 3))
            c += ((n2 % 5) - 2) * .45
            if n2 % 7 == 0:
                return ramp_at(self.pal['branch'], c - .5)
        if t > .9: c -= .8
        return ramp_at(ramp, c)

    def crown(self):
        wood = self.pal['branch']
        top = self.rise
        cx, cy = self.cx, self.cy - top
        if self.cover.startswith('bark') or self.form == 'cone':
            for dx, lean in ((-2, -1), (0, 0), (2, 1)):
                for k in range(4 + (dx == 0)):
                    self.put(int(cx + dx + lean * k * .6), int(cy - k), wood[3 if dx < 1 else 1])
        else:
            self.put(int(cx), int(cy - 1), self.felt[4]); self.put(int(cx) + 1, int(cy - 1), self.felt[2])
        self.smoke.append([int(cx), int(cy - 5), 'vent'])

    def shelter_door(self, ground):
        """An opening, not a door: the cover pulled back over a low arch, the
        dark of the inside, sleeping mats on the floor."""
        cx = self.cx
        x, top = cx - DOOR_W // 2, ground - DOOR_H - 1
        rim = self.felt
        for yy in range(top - 2, ground + 1):
            for xx in range(x - 2, x + DOOR_W + 3):
                u = (xx - cx) / (DOOR_W / 2 + 2)
                arch = top - 2 + (DOOR_H * .3) * (1 - math.sqrt(max(0, 1 - u * u)))
                if yy < arch: continue
                inside = abs(xx - cx) <= DOOR_W / 2 and yy >= arch + 2
                self.put(xx, yy, INTERIOR[0] if inside else rim[1] if xx < cx else rim[2])
        for yy in range(top + 6, ground + 1):
            for xx in range(x + 1, x + 4):
                if dither(xx, yy, .5 - (xx - x) * .14): self.put(xx, yy, INTERIOR[2])
        mat = self.pal['mat']
        for xx in range(x + 1, x + DOOR_W):
            self.put(xx, ground - 1, mat[2 + (xx % 3 == 0)])
        self.door_x, self.bottom = cx, ground

    # -- the family's fire and gear ----------------------------------------

    def hearth(self, x, y):
        stone, ash = self.pal['stone'], self.pal['ash']
        for i in range(-4, 5):
            for j in range(-1, 2):
                if (i / 4.5) ** 2 + j * j / 2.2 < 1: self.put(x + i, y + j, ash[2 + (h2(i, j) % 2)])
        for i, j in ((-5, 0), (5, 0), (-3, -2), (3, -2), (-3, 2), (3, 2), (0, 2)):
            self.put(x + i, y + j, stone[3]); self.put(x + i, y + j - 1, stone[4])
        ember = self.pal['ember']
        for i, j, k in ((-1, 0, 4), (0, -1, 5), (1, 0, 3), (0, 0, 2)):
            self.put(x + i, y + j, ember[k])
        for k in range(3):
            self.put(x - 2 + k * 2, y - 1 + (k % 2), self.pal['branch'][1 + k % 2])
        self.smoke.append([x, y - 3, 'fire'])

    def windbreak_screen(self, x0, x1, ground):
        """A crescent of brush on the windward side, the day's shelter."""
        br, leaf = self.pal['branch'], self.pal['brush']
        for x in range(x0, x1):
            u = (x - x0) / max(1, x1 - x0 - 1)
            hgt = int(9 + 3 * math.sin(u * math.pi))
            base = ground - int(4 * math.sin(u * math.pi))
            for k in range(hgt):
                n = h2(x, k, 29)
                c = br[1 + n % 3] if n % 3 == 0 else leaf[2 + (n % 4 == 0) - (k < 2)]
                self.put(x, base - k, c)
            if h2(x, 7) % 3 == 0: self.put(x, base - hgt, leaf[4])

    def gear_piece(self, name, x, y):
        wood, stone, br = self.pal['wood'], self.pal['stone'], self.pal['branch']
        if name == 'coolamon':
            for i in range(-4, 5):
                self.put(x + i, y, wood[2]); self.put(x + i, y - 1, wood[4] if abs(i) > 2 else wood[1])
            self.put(x - 4, y - 1, wood[3]); self.put(x + 4, y - 1, wood[3])
        elif name == 'grindstone':
            for i in range(-4, 5): self.put(x + i, y, stone[2]); self.put(x + i, y - 1, stone[4])
            for i in range(-1, 2): self.put(x + i, y - 2, stone[5]); self.put(x + i, y - 3, stone[4] if i else stone[5])
        elif name == 'spears':
            for k in range(26):
                self.put(x + k // 6, y - k, br[3 if k % 4 else 2]); self.put(x + 2 + k // 5, y - k, br[2])
            self.put(x + 4, y - 26, stone[5]); self.put(x + 7, y - 26, stone[4])
        elif name == 'digging-stick':
            for k in range(18): self.put(x - k // 5, y - k, wood[3 if k % 3 else 2])
        elif name == 'shells':
            shell = self.pal['shell']
            for i in range(-5, 6):
                for j in range(0, 3 - abs(i) // 2):
                    self.put(x + i, y - j, shell[2 + h2(i, j) % 3])
        elif name == 'bow':
            for k in range(20):
                self.put(x + int(2 * math.sin(k / 19 * math.pi)), y - k, wood[3])
            self.d.line((x, y, x, y - 19), fill=self.pal['mat'][1])
        elif name == 'ostrich-eggs':
            egg = self.pal['shell']
            for i in (0, 4):
                for yy in range(-4, 1):
                    for xx in range(-1, 2): self.put(x + i + xx, y + yy, egg[4 if xx < 0 else 3])
        elif name == 'net':
            for k in range(12):
                for i in range(0, 8, 2): self.put(x + i + (k % 2), y - k, self.pal['mat'][2])
            self.d.line((x - 1, y - 12, x + 9, y - 12), fill=br[3])

    def render(self):
        fw = self.fw
        R = fw * 8 - 1
        ground = self.G - 8
        self.tent_geometry(R, ground - int(R * K_ROUND))
        if self.windbreak:
            self.windbreak_screen(self.ox - 12, self.ox + 4, ground - 2)
        self.draw_tent()
        front = int(self.cy + R * K_ROUND)
        self.shelter_door(front)
        self.hearth(self.cx + R + 2, front + 4)
        spots = [(self.ox - 6, front + 3), (self.cx + R + 12, front + 1), (self.ox + 2, front + 5)]
        for name, (x, y) in zip(self.gear, spots):
            self.gear_piece(name, x, y)
        self.d.line((self.ox, self.G + 1, self.ox + fw * 16 + 6, self.G + 1), fill=(30, 34, 26, 150))
        box = self.im.getbbox()
        cut = max(0, box[1] - 2)
        self.im = self.im.crop((0, cut, min(self.w, box[2] + 1), self.h))
        self.w, self.h = self.im.size
        self.G -= cut
        self.bottom -= cut
        self.smoke = [[x, y - cut, k] for x, y, k in self.smoke]
        self.anchor_x = self.ox + fw * 8
        self.occlusion = [self.ox, max(0, self.roof_top - cut), self.ox + fw * 16, self.G - 1]
        return self.im
