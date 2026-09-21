"""Mudbrick houses: squat plastered boxes under a flat working roof.

The form is simple, so the drawing has to carry it: a parapet with thickness
and a deck sunk behind it, shade under the lip and along the left wall laid
in ordered dither, beam ends below the parapet each throwing a streak, plaster
fallen away from the brick in patches, damp rising from the foot of the wall.
The way in from the roof, the hatch, is also where the smoke comes out.

Same view as art/oblique.py: front square on, a 12px right-hand wall sheared
up at 45 degrees. Width, an annex, the ladder, the roof's clutter and the
patches of bare brick all come from the seed.
"""
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_style import side_depth

WOOD = ('#2f2418', '#4f3a25', '#7a5c38', '#a3804f')
POT = ('#4a2a1c', '#8d5836', '#c58f63')


def _rgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def _mix(a, b, t):
    A, B = _rgb(a), _rgb(b)
    return tuple(round(A[i] + (B[i] - A[i]) * t) for i in range(3)) + (255,)


# Ordered dither: how much of tone b shows through tone a at level 0..1.
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]


def dither(x, y, level):
    return BAYER[(y & 3) * 4 + (x & 3)] < level * 16


class ObliqueMudbrick:
    def __init__(self, recipe, material):
        self.r, self.p = recipe, material
        rng = random.Random(recipe['seed'] + 211)
        self.rng = rng
        fw, fh = recipe['footprint']
        self.tiles = fw
        self.fw = fw * 16
        self.sw = side_depth(fh)
        self.wh = recipe.get('wallHeight', 31 + rng.choice([0, 2, 3]))
        self.lip = 4
        facing = recipe.get('facing', 'south')
        slot = {'east': fw - 1, 'west': 0}.get(facing, recipe['entrance'][0])
        self.slot = max(0, min(fw - 1, slot))
        # A lower room built against the left end, where the door leaves room.
        self.annex = 32 if fw >= 5 and self.slot >= 2 and rng.random() < .55 else 0
        self.ladder = rng.choice(['lean', 'lean', 'straight', 'pole', 'none'])
        self.slits = recipe.get('windowStyle') == 'slit'
        self.ox = 5
        self.w = self.ox + self.fw + self.sw + 2
        self.h = self.wh + self.sw + 16
        self.bottom = self.h - 6
        self.door_x = self.ox + self.slot * 16 + 8
        self.anchor_x = self.ox + self.fw / 2
        self.im = Image.new('RGBA', (self.w, self.h))
        self.smoke = []
        dark, shade, base, light, hi = material['wall']
        self.tone = dict(dark=dark, shade=shade, base=base, light=light, hi=hi,
                         deck=_mix(light, '#b9a67c', .45), deck_lo=_mix(base, '#8f7d58', .4))

    # -- faces ----------------------------------------------------------------

    def wall(self, width, height, side=False):
        t = self.tone
        im = Image.new('RGBA', (width, height)); px = im.load()
        lit, mid, low, deep = (t['base'], t['shade'], t['shade'], t['dark']) if side else (t['light'], t['base'], t['shade'], t['dark'])
        lip = self.lip
        for y in range(height):
            for x in range(width):
                # The parapet's face, then the shade its lip throws, easing out.
                if y < lip:
                    c = lit if not side else mid
                elif y == lip:
                    c = deep
                elif y < lip + 7:
                    c = low if dither(x, y, 1 - (y - lip) / 7) else mid
                # Damp rising from the ground, strongest at the foot.
                elif y > height - 13:
                    c = low if dither(x + 1, y, (y - (height - 13)) / 12) else mid
                else:
                    # A slow left-to-right falloff so the face is not one flat tone.
                    # Flat plaster: only the lit third by the near corner, and the
                    # far end of the side wall, break into a second tone.
                    if side: c = low if dither(x, y, max(0, (x / width - .45) * .9)) else mid
                    else: c = lit if dither(x, y + 2, max(0, .5 - x / (width * .34)) ) else mid
                px[x, y] = _rgb(c)
        d = ImageDraw.Draw(im)
        # Courses telegraph faintly through the plaster.
        for y in range(lip + 9, height - 6, 4):
            for x in range((y // 4) % 2 * 5, width, 10):
                if self.rng.random() < .45:
                    d.line((x, y, x + self.rng.randrange(2, 6), y), fill=low)
        # Where plaster has fallen away the brick shows: courses and joints.
        for _ in range(0 if side else max(1, width // 40)):
            pw, ph = self.rng.randrange(9, 17), self.rng.randrange(7, 12)
            if height - ph - 8 <= lip + 9: continue
            x0 = self.rng.randrange(3, max(4, width - pw - 3)); y0 = self.rng.randrange(lip + 9, height - ph - 8)
            if abs(x0 + pw / 2 - (self.slot * 16 + 8 - (0 if not self.annex else 0))) < 14: continue
            for y in range(y0, y0 + ph):
                for x in range(x0, x0 + pw):
                    edge = (x - x0 < 2 or x0 + pw - x <= 2 or y - y0 < 1 or y0 + ph - y <= 1)
                    if edge and (x * 7 + y * 5) % 3 == 0: continue        # a ragged margin
                    row = (y - y0) // 3
                    joint = (y - y0) % 3 == 2 or (x + row * 3) % 6 == 0
                    px[x, y] = _rgb(low if joint else (lit if (x // 6 + row) % 3 == 0 else mid))
            d.line((x0 + 1, y0 + ph, x0 + pw - 2, y0 + ph), fill=lit)     # the plaster's broken lower edge, lit
        # A hairline crack or two.
        for _ in range(0 if side or height < lip + 26 else 2):
            x, y = self.rng.randrange(6, width - 6), self.rng.randrange(lip + 8, height - 16)
            for k in range(self.rng.randrange(4, 9)):
                px[min(width - 1, x), min(height - 1, y + k)] = _rgb(low)
                x += self.rng.choice([-1, 0, 0, 1])
        # A low mud bench along the foot.
        d.rectangle((0, height - 4, width - 1, height - 1), fill=low)
        d.line((0, height - 4, width - 1, height - 4), fill=lit if not side else mid)
        d.line((0, height - 1, width - 1, height - 1), fill=deep)
        return im, d

    def beams(self, d, width, y):
        """Roof beams run through the wall and stand proud of it."""
        t = self.tone
        for x in range(6, width - 5, self.rng.choice([9, 10, 11])):
            d.rectangle((x, y, x + 1, y + 1), fill=WOOD[1]); d.point((x, y), fill=WOOD[3])
            for k in range(1, 5):
                if dither(x + k, y + k + 1, .7 - k * .12): d.point((x + 1 + k // 2, y + 1 + k), fill=t['shade'])

    def slit(self, d, x, y, side=False):
        t = self.tone
        d.rectangle((x, y, x + 2, y + 4), fill='#1d1711')
        d.line((x, y - 1, x + 2, y - 1), fill=t['dark']); d.line((x - 1, y + 5, x + 3, y + 5), fill=t['base'] if side else t['hi'])
        d.point((x + 2, y + 1), fill='#33291e')

    def doorway(self, d, cx, ground):
        t = self.tone
        x, top = cx - DOOR_W // 2, ground - DOOR_H - 1
        d.rectangle((x - 2, top - 1, x + DOOR_W + 2, ground), fill=t['shade'])          # the reveal
        d.line((x - 2, top - 1, x - 2, ground), fill=t['light'])
        for y in range(top, ground, 1):                                                   # shade falling into it
            for xx in range(x + DOOR_W + 3, x + DOOR_W + 6):
                if dither(xx, y, .5 - (xx - x - DOOR_W - 3) * .15): d.point((xx, y), fill=t['shade'])
        d.rectangle((x, top, x + DOOR_W, ground), fill='#312d27')
        d.rectangle((x + 1, top + 1, x + DOOR_W, ground), fill='#453b2d')
        for xx in range(x + 2, x + DOOR_W, 3): d.line((xx, top + 2, xx, ground), fill='#685237')
        d.point((x + DOOR_W - 2, ground - DOOR_H // 2), fill='#c4a26c')
        d.rectangle((x - 4, top - 4, x + DOOR_W + 4, top - 2), fill=WOOD[2])             # a timber lintel
        d.line((x - 4, top - 4, x + DOOR_W + 4, top - 4), fill=WOOD[3]); d.line((x - 4, top - 1, x + DOOR_W + 4, top - 1), fill=t['dark'])
        d.rectangle((x - 2, ground + 1, x + DOOR_W + 2, ground + 2), fill=t['light'])     # the worn threshold
        d.line((x - 2, ground + 3, x + DOOR_W + 2, ground + 3), fill=t['dark'])

    def deck(self, width):
        """The roof from above, flat: parapet tops all round, the far wall's
        inner face, and the shade the left and far walls lay on the deck."""
        t = self.tone
        sw = self.sw
        im = Image.new('RGBA', (width, sw)); px = im.load()
        for r in range(sw):
            for x in range(width):
                on_top = r >= sw - 2 or x < 2 or x >= width - 2 or r == 0
                if on_top:
                    c = t['hi'] if (r >= sw - 2 or x < 2) else t['light']
                elif r <= 2:
                    c = t['base'] if r == 1 else t['shade']                   # far parapet: inner face, then its foot
                else:
                    shade = max(.85 - (r - 3) * .28, .8 - (x - 2) * .2, 0)
                    c = t['deck_lo'] if dither(x, r, shade) else t['deck']
                    if not dither(x, r, shade) and (x * 7 + r * 13) % 23 == 0: c = t['deck_lo']
                px[x, r] = c if isinstance(c, tuple) else _rgb(c)
        return im

    def box(self, x0, width, wh, door=False, ladder=False):
        """One plastered block, its roof and what stands on it."""
        im, t, sw = self.im, self.tone, self.sw
        d = ImageDraw.Draw(im)
        gx, gy = self.ox + x0 + width, self.bottom
        side, sd = self.wall(sw, wh, side=True)
        if self.slits or self.rng.random() < .4: self.slit(sd, sw // 2 - 1, self.lip + 10, side=True)
        sd.line((0, 0, 0, wh - 1), fill=t['light'])                                     # the corner catches the light
        sd.line((sw - 1, 0, sw - 1, wh - 1), fill=t['dark'])
        for c in range(sw):
            im.alpha_composite(side.crop((c, 0, c + 1, wh)), (gx + c, gy - wh - c))
        front, fd = self.wall(width, wh)
        self.beams(fd, width, self.lip + 2)
        if self.slits:
            for s in range(width // 16):
                if not door or abs(s * 16 + 8 - (self.door_x - self.ox - x0)) > 12:
                    if self.rng.random() < .7: self.slit(fd, s * 16 + 7, self.lip + 11)
        fd.line((0, 0, 0, wh - 1), fill=t['dark'])
        if door: self.doorway(fd, self.door_x - self.ox - x0, wh - 1)
        im.alpha_composite(front, (gx - width, gy - wh))
        deck = self.deck(width)
        for r in range(sw):
            k = sw - 1 - r
            im.alpha_composite(deck.crop((0, r, width, r + 1)), (gx - width + k + 1, gy - wh - k - 1))
        # Hand-made: the parapet's top line wanders a pixel, the corners are worn.
        px = im.load()
        for x in range(gx - width + 3, gx - 2):
            if self.rng.random() < .1: px[x, gy - wh] = _rgb(t['light'])
        px[gx - width, gy - wh] = (0, 0, 0, 0)
        return gx, gy

    def hatch(self, x, y):
        """The way down into the house, kerbed against the rain; the inside
        ladder's poles stand out of it, and so does the smoke."""
        d = ImageDraw.Draw(self.im)
        t = self.tone
        d.polygon([(x, y), (x + 8, y), (x + 11, y - 3), (x + 3, y - 3)], fill='#1b1510')
        d.line((x + 3, y - 4, x + 11, y - 4), fill=t['hi']); d.line((x - 1, y, x + 2, y - 3), fill=t['hi'])
        d.line((x, y + 1, x + 8, y + 1), fill=t['shade']); d.line((x + 9, y, x + 12, y - 3), fill=t['shade'])
        for px_, tone in ((x + 4, WOOD[3]), (x + 8, WOOD[2])):
            d.line((px_, y - 9, px_, y - 2), fill=tone)
        d.line((x + 4, y - 6, x + 8, y - 6), fill=WOOD[3])
        self.smoke.append([x + 6, y - 5, 'vent'])

    def clutter(self, gx, gy, width):
        """A roof is a yard: a mat laid out to dry something, a jar or two."""
        d = ImageDraw.Draw(self.im)
        top = gy - self.wh
        if self.rng.random() < .7:
            x = gx - width + self.rng.randrange(8, max(9, width // 2 - 14)); y = top - 4
            for r in range(3):
                for k in range(9):
                    d.point((x + k + (2 - r), y - r), fill=_rgb('#d8c48a') if (k + r) % 2 else _rgb('#a98f52'))
            d.line((x + 2, y - 3, x + 10, y - 3), fill=_rgb('#7d6a3b'))
        for n in range(self.rng.choice([0, 1, 2])):
            x = gx - 14 - n * 7 - self.rng.randrange(0, 5); y = top - 3 - n % 2 * 3
            d.rectangle((x, y - 3, x + 3, y), fill=POT[1]); d.line((x, y - 3, x, y), fill=POT[2])
            d.line((x + 3, y - 2, x + 3, y), fill=POT[0]); d.line((x + 1, y - 4, x + 2, y - 4), fill=POT[2]); d.point((x + 4, y), fill=self.tone['deck_lo'])

    def climb(self, gx, gy, width):
        """Up to the roof from outside: a ladder leaned or stood against the
        wall, or a log with steps cut in it. It throws its shade on the plaster."""
        if self.ladder == 'none': return
        d = ImageDraw.Draw(self.im); px = self.im.load()
        t = self.tone
        door = self.door_x
        left = gx - width
        x = door + 16 if door + 30 < gx else door - 26
        if x < left + 3: return
        top, foot = gy - self.wh - 5, gy - 1
        skin = {_rgb(t[k])[:3] for k in ('base', 'light', 'shade')}
        def shade(xx, yy):
            if 0 <= xx < self.w and 0 <= yy < self.h and px[xx, yy][:3] in skin and dither(xx, yy, .6):
                px[xx, yy] = _rgb(t['shade'])
        if self.ladder == 'pole':
            for y in range(top + 2, foot + 1):
                k = (foot - y) // 6
                lean = (foot - y) // 7
                shade(x + 5 - lean, y + 1)
                d.line((x + 1 - lean, y, x + 3 - lean, y), fill=WOOD[2]); d.point((x + 1 - lean, y), fill=WOOD[3])
                if (foot - y) % 6 == 0: d.line((x + 1 - lean, y, x + 3 - lean, y), fill=WOOD[0])
            return
        run = 8 if self.ladder == 'lean' else 0
        span = foot - top
        for y in range(top, foot + 1):
            off = round(run * (y - top) / span)
            for rail, tone in ((0, WOOD[3]), (7, WOOD[1])):
                shade(x + off + rail + 3, y + 2)
                d.point((x + off + rail, y), fill=tone)
                d.point((x + off + rail + 1, y), fill=WOOD[2] if rail == 0 else WOOD[0])
        for y in range(top + 4, foot - 1, 5):
            off = round(run * (y - top) / span)
            d.line((x + off + 2, y, x + off + 6, y), fill=WOOD[3]); d.line((x + off + 2, y + 1, x + off + 6, y + 1), fill=WOOD[0])

    def render(self):
        d = ImageDraw.Draw(self.im)
        main_x = self.annex
        if self.annex:
            self.box(0, self.annex + 2, self.wh - 9)
        gx, gy = self.box(main_x, self.fw - main_x, self.wh, door=True)
        width = self.fw - main_x
        top = gy - self.wh
        self.hatch(gx - width + round(width * (.62 if self.slot * 16 < width * .5 + main_x else .3)), top - 4)
        self.clutter(gx, gy, width)
        self.climb(gx, gy, width)
        d.line((self.ox, gy + 1, gx, gy + 1), fill=(30, 34, 26, 150))
        self.occlusion = [self.ox, top - self.sw, gx + self.sw // 2, gy - 1]
        return self.im
