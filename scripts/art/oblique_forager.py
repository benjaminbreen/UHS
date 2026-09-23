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
        # High enough over the doorway to take the shared door leaf; a winter
        # house is entered by its tunnel, so the dome itself can sit lower.
        self.rise = (max(22, R * .85) if self.form == 'sodhouse' else
                     max(28, R * 1.05) if self.form == 'snowhouse' else
                     max(27, R * (1.25 if self.form == 'cone' else 1.0)))
        self.rc = 1.5 if self.form == 'cone' else 2.5

    def roof_profile(self, t):
        R, rise, rc = self.R, self.rise, self.rc
        if self.form == 'dome':
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a) ** .8, rise * math.sin(a) ** 1.1
        if self.form == 'snowhouse':
            # A catenary dome of snow blocks, near-vertical at the foot.
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a) ** .7, rise * math.sin(a) ** 1.2
        if self.form == 'sodhouse':
            # A low turf mound over a stone and whalebone frame.
            a = t * math.pi / 2
            return rc + (R - rc) * math.cos(a) ** 1.1, rise * math.sin(a) ** 1.4
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
        elif kind == 'snow':
            # Blocks laid in a rising spiral: each course its own height,
            # the joints staggered and shadowed blue.
            course = t * self.rise / 5
            row = int(course)
            if course % 1 < .16: c -= 1.1
            if (s_arc + row * 4.5) % 9 < .9: c -= .9
            c += ((h2(row, int((s_arc + row * 4.5) // 9)) % 3) - 1) * .25
        elif kind == 'sod':
            course = t * self.rise / 4
            f = course % 1
            c += .6 if f < .25 else -.8 if f > .85 else 0
            if f < .25 and h2(int(s_arc), int(course)) % 3 == 0:
                return ramp_at(self.pal['turf-grass'], c)
        elif kind == 'mat':
            # Rush mats lashed on in rows, each row stitched at intervals.
            band = t * self.rise / 5.5
            f = band % 1
            c += .7 if f < .2 else -.8 if f > .88 else 0
            if f > .2 and int(s_arc + int(band) * 3) % 7 == 0: c -= 1
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

    def tunnel(self, ground):
        """The cold trap: a low arched passage in front, dug down so the warm
        air stays in the house; the door is its mouth."""
        cx, ramp = self.cx, self.felt
        x0, x1 = cx - 9, cx + 9
        top = ground - DOOR_H - 3
        body = set()
        for yy in range(top, ground + 1):
            for xx in range(x0, x1 + 1):
                u = (xx - cx) / 9.5
                if yy < top + 6 * u * u: continue
                body.add((xx, yy))
                lit = 3.6 - 1.4 * u - (yy - top) / (ground - top) * .8
                if self.cover == 'snow' and (yy - top) % 5 == 0: lit -= 1
                self.put(xx, yy, ramp_at(ramp, lit))
        # Its own edge against the dome behind: lit along the crown of the
        # arch, a shadow line down each side.
        for xx, yy in body:
            if (xx, yy - 1) not in body: self.put(xx, yy, ramp[5] if xx < cx + 3 else ramp[3])
            elif (xx - 1, yy) not in body or (xx + 1, yy) not in body: self.put(xx, yy, ramp[1])
        x, dt = cx - DOOR_W // 2, ground - DOOR_H - 1
        for yy in range(dt + 2, ground + 1):
            for xx in range(x, x + DOOR_W + 1):
                u = (xx - cx) / (DOOR_W / 2 + .5)
                if yy - dt - 2 >= 5 * u * u: self.put(xx, yy, INTERIOR[0])
        self.door_x, self.bottom = cx, ground

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
        elif name == 'hide-bag':
            hide = self.pal['mat']
            for j in range(6):
                for i in range(-3 + (j == 5), 4 - (j == 5)): self.put(x + i, y - j, hide[3 if i < 0 else 2])
            self.put(x, y - 6, hide[1])
        elif name == 'kayak':
            skin, bone = self.pal['mat'], self.pal['shell']
            for dx in (4, 26):
                for k in range(6): self.put(x + dx, y - k, self.pal['stone'][3 - (k % 2)])
            for i in range(34):
                u = i / 33
                lift = int(3 * max(0, abs(u - .5) - .35) / .15)
                self.put(x + i - 2, y - 7 - lift, skin[4]); self.put(x + i - 2, y - 6 - lift, skin[2])
            self.d.line((x + 12, y - 8, x + 18, y - 8), fill=skin[0])
            self.put(x + 15, y - 9, bone[4])
        elif name == 'meat-cache':
            stone = self.pal['stone']
            for j in range(7):
                for i in range(-5 + j // 2, 6 - j // 2):
                    self.put(x + i, y - j, stone[2 + (h2(i, j) % 3)])
            self.put(x - 1, y - 8, self.pal['shell'][4]); self.put(x + 1, y - 9, self.pal['shell'][3])
        elif name == 'sled':
            wood = self.pal['wood']
            self.d.line((x, y, x + 22, y), fill=wood[1])
            self.d.line((x + 22, y, x + 24, y - 3), fill=wood[1])
            for i in range(2, 21, 4): self.d.line((x + i, y - 1, x + i, y - 3), fill=wood[3])
            self.d.line((x + 1, y - 3, x + 21, y - 3), fill=wood[4])
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
        winter = self.form in ('snowhouse', 'sodhouse')
        if winter:
            # The tunnel stands out in front of the dome it leads into.
            self.tunnel(front + 5)
        else:
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
