"""Round houses: a drum wall under a cone of thatch, a pit house, a bark or
mat dome, a hide tent. A round building looks the same from every side, so
there is no side wall to shear: depth is carried by the base and eave
ellipses and by lighting the form from the upper left.

A recipe opts in with `"round": "cone" | "pit" | "dome" | "tent"`. Wall,
roofing, door dressing and the wattle hurdles by the door vary with the seed.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H

INK = '#24170e'
THATCH = [['#57421f', '#8c672a', '#bd8d39', '#dbac50', '#f0cc7a'],      # new straw
          ['#4a3d24', '#766233', '#a08847', '#c2aa62', '#ddc98a'],      # a few winters
          ['#3c3a2b', '#5f5b42', '#837e5c', '#a39d78', '#c0bb98'],      # grey reed
          ['#2f4524', '#466634', '#5f8444', '#7da259', '#a2c27c']]      # turf
HIDE = [['#4a3526', '#705038', '#97704e', '#b9936a', '#d6b58c'],
        ['#55503f', '#7d765c', '#a39b7c', '#c4bc9c', '#e0d9bd']]
BARK = [['#3a2b1f', '#5b4431', '#7e6046', '#9f7f5f', '#bd9f7e'],
        ['#56502f', '#7c7444', '#a3995c', '#c4ba7a', '#ded69f']]
TIMBER = ('#2f2418', '#4f3a25', '#7a5c38', '#a3804f')


def h2(x, y):
    return (x * 73856093 ^ y * 19349663) >> 3


class ObliqueRound:
    no_side = True

    def __init__(self, recipe, material):
        self.r, self.p = recipe, material
        rng = random.Random(recipe['seed'] + 53)
        self.rng = rng
        fw, fh = recipe['footprint']
        self.form = recipe['round']
        self.W = fw * 16 - 6
        self.rx = self.W / 2
        self.base_ry = max(5, round(self.rx * .24))
        wall = {'cone': 24, 'pit': 7, 'dome': 0, 'tent': 0}[self.form]
        self.wall = wall + (rng.choice([0, 0, 2, 3]) if self.form == 'cone' else 0)
        self.over = 5 if self.form in ('cone', 'pit') else 0
        rise = {'cone': .78, 'pit': .7, 'dome': .9, 'tent': 1.25}[self.form]
        self.rise = round((self.rx + self.over) * rise) + rng.choice([-2, 0, 2])
        covers = {'cone': THATCH, 'pit': THATCH, 'dome': BARK, 'tent': HIDE}[self.form]
        named = recipe.get('covers')
        self.cover = covers[rng.choice(named) if named else rng.randrange(len(covers))]
        treatments = recipe.get('surfaceTreatments', ['plain'])
        self.treatment = treatments[rng.randrange(len(treatments))]
        self.hurdles = self.form == 'cone' and rng.random() < .6
        self.band = (recipe.get('band') and rng.random() < .7) or self.treatment.endswith('-band')
        self.ox = 6 + (8 if self.hurdles else 0)
        self.w = self.W + 2 * self.ox
        self.h = self.wall + self.rise + self.base_ry + 22
        self.bottom = self.h - 6
        self.cx = self.w // 2
        self.door_x = self.cx
        self.anchor_x = self.w / 2
        self.im = Image.new('RGBA', (self.w, self.h))
        self.smoke = []

    def tone(self, ramp, u, extra=0):
        """Across a turned form: lit band left of centre, core shadow right."""
        i = 3 if u < -0.7 else 4 if u < -0.35 else 3 if u < 0.05 else 2 if u < 0.55 else 1
        return ramp[max(0, min(4, i + extra))]

    def drum(self, d, top, bottom):
        dark, shade, base, light, hi = self.p['wall']
        ramp = [dark, shade, base, light, hi]
        if self.treatment == 'whitewash-band':
            ramp = ['#5d5545', '#8e856f', '#beb69d', '#ded8c1', '#f0ecd9']
        elif self.treatment == 'dark-band':
            ramp = ['#40291f', '#694332', '#94634a', '#bb8968', '#d9ad87']
        cx, rx, ry = self.cx, self.rx, self.base_ry
        stone = self.p['foundation']
        rubble = self.p.get('texture') == 'rubble'
        for x in range(int(cx - rx), int(cx + rx) + 1):
            u = (x + .5 - cx) / rx
            if abs(u) > 1: continue
            sag = round(ry * math.sqrt(max(0, 1 - u * u)))
            for y in range(max(top, top + sag - ry), bottom + sag + 1):
                k = h2(x // 3, y // 4)
                extra = (-1 if k % 11 == 0 else 1 if k % 13 == 0 else 0)
                if rubble and ((y + (x // 6) % 2 * 2) % 5 == 0 or (x + (y // 5) * 3) % 7 == 0): extra = -1
                d.point((x, y), fill=self.tone(ramp, u, extra))
            # A footing of field stones keeps the daub out of the wet.
            for y in range(bottom + sag - 3, bottom + sag + 1):
                d.point((x, y), fill=stone[2] if (x // 4 + y) % 2 and u < .4 else stone[1] if u < .7 else stone[0])
            d.point((x, bottom + sag + 1), fill=INK)
        if not rubble:
            # Posts show through the daub, closer together as the wall turns away.
            for a in range(-80, 81, 20):
                x = round(cx + rx * math.sin(math.radians(a)))
                sag = round(ry * math.sqrt(max(0, 1 - ((x - cx) / rx) ** 2)))
                d.line((x, max(top, top + sag - ry + 2), x, bottom + sag - 4), fill=TIMBER[2] if a < 0 else TIMBER[1])
        if self.band:
            stripe = ('#ece4cc' if self.treatment == 'whitewash-band' else
                      '#3f251b' if self.treatment == 'dark-band' else '#8e2a1e')
            stripe_shadow = '#a9a18b' if self.treatment == 'whitewash-band' else '#5a1a14'
            for x in range(int(cx - rx) + 1, int(cx + rx)):
                u = (x - cx) / rx
                sag = round(ry * math.sqrt(max(0, 1 - u * u)))
                d.point((x, bottom + sag - 9), fill=stripe if u < .45 else stripe_shadow)
                if x % 6 in (0, 1):
                    d.point((x, bottom + sag - 12 + (x // 3) % 2 * 2), fill=stripe)

    def cone(self, d, apex_y, eave_y):
        """Thatch laid in courses round a cone, ragged at every lap."""
        cx = self.cx
        rx = self.rx + self.over
        ry = max(5, round(rx * .26))
        ramp = self.cover
        for y in range(apex_y, eave_y + ry + 1):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u0 = (x + .5 - cx) / rx
                if abs(u0) > 1: continue
                sag = ry * math.sqrt(max(0, 1 - u0 * u0))
                # How far down the slope this pixel is, 0 at the apex.
                t = (y - apex_y) / max(1, (eave_y + sag - apex_y))
                if t > 1 or t < 0 or abs(u0) > t + .04: continue
                u = u0 / max(t, .05)
                course = int(t * 5.2 + (h2(x // 3, 3) % 3) * .06)
                lap = (t * 5.2) % 1
                strand = h2(int((u + 1) * 9), course) % 6
                extra = (-2 if lap > .86 else 1 if lap < .12 else 0) + (-1 if strand == 0 else 1 if strand == 1 and lap < .6 else 0)
                if t > .93: extra -= 1
                d.point((x, y), fill=self.tone(ramp, u, extra))
        # A ragged eave, and its shade on the wall below.
        for x in range(int(cx - rx), int(cx + rx) + 1):
            u0 = (x + .5 - cx) / rx
            if abs(u0) > 1: continue
            sag = round(ry * math.sqrt(max(0, 1 - u0 * u0)))
            hang = h2(x // 2, 5) % 3
            for k in range(hang + 1): d.point((x, eave_y + sag + k), fill=ramp[1 if k < hang else 0])
        # The poles cross at the apex and stand proud of the thatch.
        for dx, tone in ((-3, TIMBER[3]), (0, TIMBER[2]), (3, TIMBER[1])):
            d.line((cx + dx, apex_y - 7, cx - dx // 2, apex_y + 3), fill=tone)
        d.ellipse((cx - 3, apex_y - 1, cx + 3, apex_y + 3), fill=ramp[1], outline=ramp[0])
        if self.treatment == 'repaired':
            x = cx - round(rx * .48)
            y = apex_y + round((eave_y - apex_y) * .62)
            d.polygon([(x, y), (x + 10, y - 2), (x + 13, y + 5), (x + 3, y + 8)],
                      fill=ramp[2], outline=ramp[0])
            d.line((x + 2, y + 1, x + 11, y + 4), fill=ramp[3])

    def shell(self, d, top, bottom, ramp, bands, poles=False):
        """One skin from the ground up: a dome of mats or a cone of hides."""
        cx, rx = self.cx, self.rx
        ry = self.base_ry
        for y in range(top, bottom + ry + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                u0 = (x + .5 - cx) / rx
                if abs(u0) > 1: continue
                sag = ry * math.sqrt(max(0, 1 - u0 * u0))
                t = (y - top) / max(1, bottom + sag - top)
                if t > 1: continue
                half = math.sqrt(max(0, 1 - (1 - min(1, t * 1.02)) ** 2)) if not poles else t
                if abs(u0) > half + .02: continue
                u = u0 / max(half, .05)
                lap = (t * bands) % 1
                extra = -2 if lap > .88 else 0
                if poles and h2(int((u + 1) * 3.2), 1) % 2 and abs(((u + 1) * 3.2) % 1 - .5) > .44: extra = -1
                if h2(x // 2, y // 3) % 9 == 0: extra -= 1
                d.point((x, y), fill=self.tone(ramp, u, extra))
        if poles:
            for dx, tone in ((-4, TIMBER[3]), (-1, TIMBER[2]), (2, TIMBER[2]), (5, TIMBER[1])):
                d.line((cx + dx, top - 9, cx - dx // 3, top + 4), fill=tone)
            d.polygon([(cx - 2, top + 2), (cx + 3, top + 2), (cx + 1, top + 9)], fill='#1d1711')   # the smoke flap
        else:
            d.ellipse((cx - 3, top, cx + 3, top + 3), fill='#1d1711')                              # the smoke hole
        self.skin_treatment(d, top, bottom, ramp, poles)

    def skin_treatment(self, d, top, bottom, ramp, poles):
        """Low-contrast seams, repairs and abstract ochre marks, never a
        culture claim encoded by the painter itself."""
        if self.treatment in ('sewn', 'repaired'):
            for side in (-1, 1):
                x0 = self.cx + side * round(self.rx * .48)
                d.line((x0, top + self.rise // 3, x0 + side * 3, bottom - 5),
                       fill=ramp[1])
                for y in range(top + self.rise // 3 + 2, bottom - 5, 5):
                    d.point((x0 + side * ((y // 5) % 2), y), fill=ramp[4])
        if self.treatment == 'repaired':
            x = self.cx - round(self.rx * .55)
            y = top + round(self.rise * .58)
            d.polygon([(x, y), (x + 8, y - 2), (x + 10, y + 6), (x + 2, y + 8)],
                      fill=ramp[2], outline=ramp[1])
            d.line((x + 2, y + 2, x + 8, y + 4), fill=ramp[3])
        if self.treatment == 'ochre':
            ochre = '#8b3f2c'
            y = bottom - 11
            for x in range(self.cx - round(self.rx * .48),
                           self.cx + round(self.rx * .48), 8):
                d.line((x, y, x + 3, y - 3, x + 6, y), fill=ochre)

    def doorway(self, d, gy):
        """Two posts and a lintel set into the roof line: the door is the one
        rectangle the shared leaf overlay must fit."""
        x, top = self.cx - DOOR_W // 2, gy - DOOR_H - 1
        if self.form in ('dome', 'tent'):
            ramp = self.cover
            d.polygon([(x - 2, gy), (self.cx, top + 4), (self.cx + 1, top + 4), (x + DOOR_W + 2, gy)], fill=ramp[1])
            d.polygon([(x + 1, gy), (self.cx, top + 8), (self.cx + 1, top + 8), (x + DOOR_W - 1, gy)], fill='#1d1711')
            d.line((self.cx + 1, top + 5, x + DOOR_W + 2, gy), fill=ramp[3])
            return
        d.rectangle((x - 3, top - 3, x + DOOR_W + 3, gy), fill=TIMBER[1])
        d.rectangle((x, top, x + DOOR_W, gy), fill='#1d1711')
        d.rectangle((x + 1, gy - 4, x + DOOR_W, gy), fill='#2b231a')
        d.line((x - 3, top - 3, x - 3, gy), fill=TIMBER[3]); d.line((x - 2, top - 2, x - 2, gy), fill=TIMBER[2])
        d.line((x + DOOR_W + 3, top - 2, x + DOOR_W + 3, gy), fill=TIMBER[0])
        d.rectangle((x - 4, top - 5, x + DOOR_W + 4, top - 3), fill=TIMBER[2])
        d.line((x - 4, top - 5, x + DOOR_W + 4, top - 5), fill=TIMBER[3]); d.line((x - 4, top - 2, x + DOOR_W + 4, top - 2), fill=INK)
        d.rectangle((x - 1, gy + 1, x + DOOR_W + 1, gy + 3), fill=self.p['foundation'][1])
        d.line((x - 1, gy + 1, x + DOOR_W + 1, gy + 1), fill=self.p['foundation'][2])

    def hurdle(self, d, x0, x1, gy):
        """A run of woven wattle: stakes, and rods laid over and under."""
        step = 1 if x1 > x0 else -1
        for x in range(x0, x1, step):
            lift = abs(x - x0) // 5
            for row in range(3):
                y = gy - 3 - row * 3 - lift
                d.line((x, y, x, y + 1), fill=TIMBER[3] if (x // 3 + row) % 2 else TIMBER[1])
            if (x - x0) % 5 == 0:
                d.line((x, gy - 12 - lift, x, gy - lift), fill=TIMBER[2]); d.point((x, gy - 13 - lift), fill=TIMBER[3])

    def outline(self):
        px = self.im.load()
        edge = [(x, y) for y in range(self.h) for x in range(self.w) if px[x, y][3] == 0 and any(
            0 <= x + dx < self.w and 0 <= y + dy < self.h and px[x + dx, y + dy][3] == 255
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        ink = tuple(int(INK[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for x, y in edge: px[x, y] = ink

    def render(self):
        d = ImageDraw.Draw(self.im)
        gy = self.bottom - self.base_ry
        if self.form in ('cone', 'pit'):
            top = gy - self.wall
            self.drum(d, top, gy)
            eave = top - 1
            self.cone(d, eave - self.rise, eave)
            skin = None
        else:
            self.shell(d, gy - self.rise - (10 if self.form == 'tent' else 0), gy,
                       self.cover, 4.2 if self.form == 'dome' else 3, poles=self.form == 'tent')
        ground = self.bottom
        self.doorway(d, ground)
        if self.hurdles:
            self.hurdle(d, self.cx - DOOR_W // 2 - 8, 1, ground)
            self.hurdle(d, self.cx + DOOR_W // 2 + 9, self.w - 2, ground)
        self.outline()
        top_y = min(y for y in range(self.h) if self.im.getpixel((self.cx, y))[3])
        # The fire is in the middle of the floor; the smoke leaves at the apex.
        self.smoke.append([self.cx, top_y + (6 if self.form in ('cone', 'pit', 'tent') else 1), 'vent'])
        self.occlusion = [self.ox, top_y, self.w - self.ox, ground - 1]
        return self.im
