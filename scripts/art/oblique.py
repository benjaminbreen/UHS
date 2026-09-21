"""Oblique building painter: a front wall, the right-hand side wall, and a
gable roof leaning back over both.

Each face is painted flat at screen resolution, then sheared into place a row
or a column at a time, so every pixel stays a whole pixel. Depth runs up and to
the right at 45 degrees. The front wall sits on the footprint's front edge and
is the footprint's width; the side wall is overhang, not collision.

A recipe opts in with `"oblique": true`. Window count, side windows and the
chimney come from the recipe seed; the door follows the recipe's entrance.
"""
import random
from PIL import Image, ImageDraw
from art.buildings import ROOFS, DOOR_W, DOOR_H, recess
from art.oblique_style import K, STOREY, OVER, VERGE, side_depth, roof_rise

TIMBER = ('#2f2a22', '#453d30', '#8d7350')
# Fresh straw; the shared ROOFS thatch is the weathered alternative.
STRAW = ['#57421f', '#8c672a', '#bd8d39', '#dbac50', '#f0cc7a']
FRAME = ('#3a2a1c', '#6b4a2c', '#9a7444')
BLOOMS = ['#e8c53a', '#d9553f', '#e9e4d2']
# Thatch a few winters old, gone grey at the ridge.
AGED = ['#3f3a2c', '#625a44', '#857b5e', '#a39a7a', '#c2ba9c']


def darker(material, strong=False):
    """The side wall faces away from the sun; gold masters separate it more."""
    w = material['wall']
    return dict(material, wall=([w[0], w[0], w[0], w[1], w[2]] if strong
                                else [w[0], w[0], w[1], w[2], w[3]]))


def h2(x, y):
    return (x * 73856093 ^ y * 19349663) >> 3


class ObliqueBuilding:
    def __init__(self, recipe, material):
        self.r = recipe
        self.p = material
        self.rng = random.Random(recipe['seed'])
        fw, fh = recipe['footprint']
        self.tiles = fw
        self.stories = int(recipe.get('stories', 1))
        self.frame = 'timber-frame' in recipe['attachments'] or bool(recipe.get('timber'))
        self.shop = 'urban-shop' in recipe['attachments']
        look = random.Random(recipe['seed'] + 31)
        roofs = [m for m in recipe.get('roofs', [recipe['roofMaterial']]) if m in ROOFS] or ['thatch']
        self.roof = look.choice(roofs)
        # Thatch over an upper floor is rarer than tile or shingle.
        if self.stories > 1 and self.roof == 'thatch' and look.random() < .6:
            self.roof = look.choice(['shingle', 'terracotta', 'slate'])
        self.wing = bool(recipe.get('wing'))
        # 'timber' cross wing, or a 'stepped' or 'pediment' frontispiece.
        self.frontis = recipe.get('frontispiece')
        self.arcade = bool(recipe.get('arcade'))
        self.turret = recipe.get('turret')
        self.lights = recipe.get('windowStyle', 'casement')
        self.stacks = recipe.get('chimneys')
        # A lean-to takes the footprint's first tile; the house is that much narrower.
        self.lean = (recipe.get('windowStyle') != 'none' and not self.wing and not self.frontis and not recipe.get('hall') and not recipe.get('theatre')
                     and self.stories == 1 and fw >= 4
                     and recipe['entrance'][0] >= 1 and recipe.get('facing', 'south') == 'south'
                     and look.random() < .4)
        self.fw = (fw - self.lean) * 16
        self.wh = 10 + STOREY * self.stories
        self.sw = side_depth(fh)
        # A flat roof behind a parapet: no rise, no eave, a little more wall.
        self.flat = recipe.get('roofForm') == 'flat'
        self.portico = bool(recipe.get('portico')) or 'urban-colonnade' in recipe['attachments']
        if 'urban-colonnade' in recipe['attachments'] and not self.frontis: self.frontis = 'pediment'
        self.rise = 0 if self.flat else roof_rise(self.roof)
        if self.flat: self.wh += 6
        self.depth = self.sw / K
        self.over, self.verge = (0, 0) if self.flat else (OVER, VERGE)
        self.drop = round(self.over * self.rise / (self.depth / 2))
        self.facing = recipe.get('facing', 'south')

        rng = random.Random(recipe['seed'] + 977)
        slot = {'east': fw - 1, 'west': 0}.get(self.facing, recipe['entrance'][0])
        fw -= self.lean
        self.tiles = fw
        self.slot = max(3 if self.wing else 0, min(fw - 1, slot - self.lean))
        free = [s for s in range(fw) if s != self.slot]
        if self.shop and free:
            self.shop_slot = min(free, key=lambda s: abs(s - self.slot))
            free.remove(self.shop_slot)
        count = rng.randint((len(free) + 1) // 2, len(free)) if free else 0
        self.windows = sorted(rng.sample(free, count))
        self.side_windows = [rng.random() < .6 and recipe.get('windowStyle') != 'none' for _ in range(self.stories)]
        self.has_chimney = fw >= 4 and rng.random() < .55 if self.stacks is None else self.stacks > 0
        self.boxes = [s for s in self.windows if rng.random() < .5]
        self.thatch = look.choice([STRAW, STRAW, ROOFS['thatch'], AGED])

        self.ox = 7 + 16 * self.lean
        self.w = self.ox + self.fw + self.sw + self.verge + 4
        self.h = self.wh + self.rise + self.sw // 2 + (34 if self.turret else 14 if self.has_chimney else 3) + 8
        self.bottom = self.h - 6
        self.door_x = self.ox + self.slot * 16 + 8
        self.anchor_x = 7 + recipe['footprint'][0] * 8
        self.im = Image.new('RGBA', (self.w, self.h))
        # Where smoke leaves the building, in sprite px: [x, y, 'chimney' | 'vent'].
        self.smoke = []

    def proj(self, x, y, z):
        return (round(self.ox + x + y * K), round(self.bottom - z - y * K))

    # -- faces, painted flat ------------------------------------------------

    def wall_face(self, width, height, material, front):
        im = Image.new('RGBA', (width, height + 3))
        d = ImageDraw.Draw(im)
        dark, shade, base, light, hi = material['wall']
        b = height
        d.rectangle((0, 0, width - 1, b), fill=base)
        if material.get('texture') == 'rubble':
            # Coursed rubble: uneven stones in rough rows, mortar between.
            d.rectangle((0, 0, width - 1, b), fill=shade)
            for j, y in enumerate(range(0, b - 5, 5)):
                x = -self.rng.randrange(0, 5)
                while x < width:
                    wide = self.rng.randrange(4, 9)
                    tone = self.rng.choice([base, base, light, light, hi] if front else [base, base, light])
                    d.rectangle((x, y, x + wide - 2, y + 3), fill=tone)
                    if front and tone != hi: d.line((x, y, x + wide - 3, y), fill=hi if tone == light else light)
                    x += wide
        texture = material.get('texture')
        if texture in ('brick', 'grey-brick'):
            # Three-pixel courses in stretcher bond; the odd brick burnt dark.
            d.rectangle((0, 0, width - 1, b), fill=shade)
            for j, y in enumerate(range(0, b - 4, 3)):
                for x in range(-(j % 2) * 3, width, 6):
                    k = h2(x + 50, y)
                    tone = dark if k % 17 == 0 else light if k % 5 == 0 and front else base
                    d.rectangle((x, y, x + 4, y + 1), fill=tone)
        elif texture in ('ashlar', 'stucco'):
            # Dressed stone or render: broad quiet faces, a few fine joints.
            if texture == 'ashlar':
                for j, y in enumerate(range(0, b - 5, 7)):
                    d.line((0, y + 6, width - 1, y + 6), fill=shade)
                    for x in range(-(j % 2) * 7, width, 14): d.line((x, y, x, y + 5), fill=shade)
            for _ in range(width // 8 if front else 0):
                x = self.rng.randrange(2, max(3, width - 8)); y = self.rng.randrange(6, b - 12)
                d.line((x, y, x + self.rng.randrange(2, 6), y), fill=light)
        if front and texture in ('rubble', 'brick', 'grey-brick', 'ashlar', 'stucco'):
            d.line((0, 0, 0, b), fill=dark)
        elif front:
            d.rectangle((0, b - 9, width - 1, b), fill=shade)
            for x in range(1, width - 5, 11):
                y = b - self.rng.randrange(7, 13)
                d.polygon([(x, b - 6), (x, y), (x + 3, y - 1), (x + 7, y + 2), (x + 6, b - 6)], fill=base)
            for _ in range(width // 5):
                x = self.rng.randrange(2, width - 6); y = self.rng.randrange(8, b - 13)
                d.rectangle((x, y, x + self.rng.randrange(2, 5), y + 1), fill=self.rng.choice([shade, light]))
            d.line((0, 0, 0, b), fill=dark); d.line((1, 2, 1, b - 6), fill=light)
        else:
            # The sheared wall turns a chip into a dash, so the side only gets
            # damp at the foot and a far edge.
            d.rectangle((0, b - 8, width - 1, b), fill=shade)
            d.line((width - 1, 0, width - 1, b), fill=dark)
        ink, fshade, flight = material['foundation']
        d.rectangle((0, b - 5, width - 1, b), fill=ink)
        for x in range(1, width - 2, 8):
            d.rectangle((x, b - 5, min(x + 6, width - 2), b - 2), fill=fshade)
            d.line((x + 1, b - 5, min(x + 5, width - 2), b - 5), fill=flight)
        return im, d

    def post(self, d, x, y0, y1):
        d.rectangle((x, y0, x + 2, y1), fill=TIMBER[1]); d.line((x, y0, x, y1), fill=TIMBER[2])

    def beam(self, d, x0, x1, y):
        d.rectangle((x0, y, x1, y + 2), fill=TIMBER[1]); d.line((x0, y, x1, y), fill=TIMBER[2])

    def light(self, d, slot, y, box=False):
        """One front window in the house's own fashion, centred on its tile."""
        cx = slot * 16 + 8
        if self.lights == 'none':
            return
        if self.lights == 'mullion':
            # A long stone-mullioned window of three lights.
            hi, dark = self.p['wall'][4], self.p['wall'][0]
            if self.p.get('texture') in ('brick', 'grey-brick'): hi = self.p['foundation'][2]
            d.rectangle((cx - 7, y, cx + 6, y + 9), fill=hi)
            for i in range(3):
                d.rectangle((cx - 6 + i * 4, y + 1, cx - 4 + i * 4, y + 8), fill='#22313a')
                d.rectangle((cx - 5 + i * 4, y + 2, cx - 4 + i * 4, y + 8), fill='#34505c')
            d.point((cx - 5, y + 2), fill='#8fb0b8')
            d.line((cx - 8, y - 1, cx + 7, y - 1), fill=hi); d.line((cx - 8, y + 10, cx + 7, y + 10), fill=dark)
        elif self.lights == 'sash':
            # A tall sash under a flat arch, painted white.
            white = '#e9e6d8'
            d.rectangle((cx - 4, y - 2, cx + 4, y + 11), fill=white)
            d.rectangle((cx - 3, y - 1, cx + 3, y + 10), fill='#22313a')
            d.rectangle((cx - 2, y, cx + 3, y + 10), fill='#34505c')
            d.line((cx, y - 1, cx, y + 10), fill=white); d.line((cx - 3, y + 4, cx + 3, y + 4), fill=white)
            d.point((cx - 2, y), fill='#8fb0b8')
            d.line((cx - 5, y + 12, cx + 5, y + 12), fill=self.p['wall'][4])
            d.line((cx - 5, y + 13, cx + 5, y + 13), fill=self.p['wall'][0])
        elif self.lights == 'shutter':
            # A small opening between painted shutters folded back on the wall.
            paint = ('#2f5a4a', '#4a7f68') if self.r['seed'] % 3 else ('#6b3a2a', '#96573b') if self.r['seed'] % 3 == 1 else ('#34506a', '#5477a0')
            d.rectangle((cx - 3, y, cx + 2, y + 9), fill='#1d2a30')
            d.rectangle((cx - 2, y + 1, cx + 2, y + 9), fill='#2f4650')
            for x0 in (cx - 6, cx + 3):
                d.rectangle((x0, y, x0 + 2, y + 9), fill=paint[1]); d.line((x0 + 2, y, x0 + 2, y + 9), fill=paint[0])
                for yy in range(y + 2, y + 9, 2): d.point((x0 + 1, yy), fill=paint[0])
            d.line((cx - 4, y - 1, cx + 3, y - 1), fill=self.p['wall'][4])
            d.line((cx - 4, y + 10, cx + 3, y + 10), fill=self.p['wall'][4]); d.line((cx - 4, y + 11, cx + 3, y + 11), fill=self.p['wall'][0])
        elif self.lights == 'slit':
            # High and small, against the sun and the street.
            d.rectangle((cx - 2, y - 2, cx + 1, y + 3), fill='#1d1e19')
            d.line((cx - 3, y + 4, cx + 2, y + 4), fill=self.p['wall'][4])
            d.line((cx - 3, y - 3, cx + 2, y - 3), fill=self.p['wall'][0])
        else:
            self.window(d, cx - 4, y, 8, 10, box=box)

    def window(self, d, x, y, w, h, box=False):
        d.rectangle((x - 1, y - 1, x + w + 1, y + h + 1), fill=FRAME[0])
        d.rectangle((x, y, x + w, y + h), fill=FRAME[1])
        d.rectangle((x + 1, y + 1, x + w - 1, y + h - 1), fill='#22313a')
        d.rectangle((x + 2, y + 2, x + w - 1, y + h - 1), fill='#34505c')
        d.line((x + w // 2, y + 1, x + w // 2, y + h - 1), fill=FRAME[1])
        d.line((x + 1, y + h // 2, x + w - 1, y + h // 2), fill=FRAME[1])
        d.point((x + 2, y + 2), fill='#7fa3ab')
        d.line((x - 1, y - 1, x + w + 1, y - 1), fill=FRAME[2])
        d.rectangle((x - 2, y + h + 1, x + w + 2, y + h + 2), fill=self.p['foundation'][2])
        d.line((x - 2, y + h + 3, x + w + 2, y + h + 3), fill=self.p['wall'][0])
        if box:
            d.rectangle((x - 2, y + h + 1, x + w + 2, y + h + 4), fill=FRAME[1])
            d.line((x - 2, y + h + 5, x + w + 2, y + h + 5), fill=FRAME[0])
            for i, xx in enumerate(range(x - 2, x + w + 3)):
                d.line((xx, y + h - 1 - h2(xx, 5) % 2, xx, y + h), fill='#4f7a34' if i % 3 else '#6c9a41')
                if h2(xx, 9) % 3 == 0:
                    d.point((xx, y + h - 2), fill=BLOOMS[h2(xx, 2) % 3])

    def window_y(self, storey):
        """From the wall top. Upper storeys hang from their own band."""
        return self.wh - 25 if storey == 0 else self.floor_y(storey) - 13

    def floor_y(self, storey):
        """The beam under an upper storey, from the wall top."""
        return self.wh - 13 - STOREY * storey

    def front(self):
        im, d = self.wall_face(self.fw, self.wh, self.p, True)
        b, fw = self.wh, self.fw
        dark = self.p['wall'][0]
        for s in range(1, self.stories):
            y = self.floor_y(s)
            if self.frame:
                self.beam(d, 0, fw - 1, y)
                # Joist ends under a jetty, and the shade it throws.
                for x in range(3, fw - 2, 6): d.rectangle((x, y + 3, x + 1, y + 4), fill=TIMBER[1])
                d.line((0, y + 5, fw - 1, y + 5), fill=dark)
            else:
                d.line((1, y + 1, fw - 1, y + 1), fill=self.p['wall'][1])
                d.line((1, y, fw - 1, y), fill=self.p['wall'][3])
        if self.frame:
            door = self.slot * 16 + 8
            for x in [1, *range(15, fw - 8, 16), fw - 4]:
                gap = b - DOOR_H - 5 if abs(x + 1 - door) < 9 else b - 6
                self.post(d, x, 0, gap)
            rail = b - 28
            for s in range(self.stories):
                top = 10 if s == self.stories - 1 else self.floor_y(s + 1) + 6
                foot = rail - 1 if s == 0 else self.floor_y(s) - 1
                for x0, x1 in [(4, 14), (fw - 5, fw - 15)]:
                    d.line((x0, foot, x1, top), fill=TIMBER[1], width=2)
            self.beam(d, 1, fw - 2, rail)
        for s in range(self.stories):
            y = self.window_y(s)
            if s == 0 and self.arcade:
                self.arches(d, b)
                continue
            regular = self.lights != 'casement'
            # A large gold-master facade keeps blank wall between opening
            # groups. Filling every bay made the derived ranges read as grids.
            planned = self.windows if self.r.get('goldMaster') else None
            for slot in (planned if planned is not None else self.windows if s == 0 and not regular else
                         [t for t in range(self.tiles) if regular and not (s == 0 and t == self.slot)
                          and (self.lights != 'mullion' or (t - self.slot) % 3 != 2)
                          or not regular and (t + s + self.r['seed']) % 4]):
                self.light(d, slot, y, box=s == 0 and slot in self.boxes)
        if self.shop and hasattr(self, 'shop_slot'):
            x = self.shop_slot * 16 + 2; y = b - 26
            recess(d, self.p, x, y, 12, 11, niche=True)
            # The shutter let down as a counter, and a pentice board over it.
            d.rectangle((x - 2, y + 12, x + 14, y + 13), fill='#a48653')
            d.line((x - 2, y + 14, x + 14, y + 14), fill='#493c2c')
            for xx in (x - 1, x + 13): d.line((xx, y + 15, xx, y + 17), fill='#493c2c')
            d.polygon([(x - 3, y - 3), (x + 15, y - 3), (x + 16, y - 7), (x - 2, y - 7)], fill='#7e6544')
            d.line((x - 3, y - 3, x + 15, y - 3), fill='#3e3026')
        if self.portico: self.colonnade(d, b)
        if 'ladder' in self.r['attachments']:
            # The way up to the roof, where the day's work is done.
            x = (self.slot * 16 + 8 + 14) if self.slot * 16 + 30 < self.fw else (self.slot * 16 - 12)
            for xx in (x, x + 6): d.line((xx, 2, xx + 2, b - 5), fill='#6b4a2c', width=2)
            for y in range(6, b - 6, 5): d.line((x + 1, y, x + 7, y), fill='#a3804f')
        x = self.slot * 16 + 8 - DOOR_W // 2
        recess(d, self.p, x, b - DOOR_H - 1, DOOR_W, DOOR_H, door=True)
        d.rectangle((x - 3, b - DOOR_H - 5, x + DOOR_W + 3, b - DOOR_H - 3), fill=FRAME[1])
        d.line((x - 3, b - DOOR_H - 5, x + DOOR_W + 3, b - DOOR_H - 5), fill=FRAME[2])
        d.line((x - 3, b - DOOR_H - 2, x + DOOR_W + 3, b - DOOR_H - 2), fill=FRAME[0])
        for yy in (b - DOOR_H + 4, b - 7): d.line((x + 1, yy, x + 4, yy), fill='#1f2326')
        return im

    def colonnade(self, d, b):
        """A walk under a tiled pent roof on stone columns, along the front."""
        dark, shade = self.p['wall'][0], self.p['wall'][1]
        tile = ROOFS['pantile']
        stone = self.p['foundation']
        top = b - 36
        skin = None
        for y in range(top + 7, top + 12):                  # the walk is in shade
            d.line((0, y, self.fw - 1, y), fill=dark if y < top + 9 else shade)
        for x in range(self.fw):
            k = x % 4
            for y in range(top, top + 7):
                d.point((x, y), fill=tile[max(0, (4, 3, 2, 1)[k] - (y > top + 3))])
        d.line((0, top, self.fw - 1, top), fill=tile[4]); d.line((0, top + 7, self.fw - 1, top + 7), fill=tile[0])
        door = self.slot * 16 + 8
        for t in range(self.tiles + 1):
            x = min(self.fw - 4, t * 16)
            if abs(x + 1 - door) < 8: continue
            d.rectangle((x, top + 10, x + 2, b - 5), fill=stone[2]); d.line((x + 2, top + 10, x + 2, b - 5), fill=stone[1])
            d.rectangle((x - 1, top + 8, x + 3, top + 9), fill=stone[2])
            d.rectangle((x - 1, b - 7, x + 3, b - 5), fill=stone[1]); d.line((x - 1, b - 7, x + 3, b - 7), fill=stone[2])

    def flat_top(self, d):
        """The roof terrace seen over its parapet."""
        wh, fw = self.wh, self.fw
        dark, shade, base, light, hi = self.p['wall']
        # Beaten earth over brushwood unless the recipe roofs in tile.
        deck = self.p['roof'] if self.r.get('roofMaterial') in ('pantile', 'terracotta') else [dark, shade, base, light]
        a, b_, c, e = self.proj(0, 0, wh), self.proj(fw, 0, wh), self.proj(fw, self.depth, wh), self.proj(0, self.depth, wh)
        d.polygon([a, b_, c, e], fill=deck[2])
        d.line((e[0], e[1], c[0], c[1]), fill=light)                 # far parapet, its inner face
        d.line((e[0], e[1] + 1, c[0] - 1, c[1] + 1), fill=hi); d.line((e[0] - 1, e[1] + 2, c[0] - 2, c[1] + 2), fill=shade)
        d.line((a[0] + 2, a[1] - 1, b_[0] - 1, b_[1] - 1), fill=deck[0])  # shade inside the near one
        d.line((a[0], a[1], e[0], e[1]), fill=light)
        d.line((a[0], a[1], b_[0], b_[1]), fill=hi)
        d.line((a[0], a[1] + 5, b_[0], b_[1] + 5), fill=shade)       # the parapet's string course
        for k in range(3):
            x = a[0] + 8 + (self.r['seed'] * (k + 3)) % max(9, fw - 20)
            d.line((x, a[1] - 3, x + 3, a[1] - 3), fill=deck[1 if k % 2 else 3])

    def arches(self, d, b):
        """An open ground floor: the market stands under the hall."""
        dark, shade, base, light, hi = self.p['wall']
        for t in range(self.tiles):
            x = t * 16 + 2
            if self.frame:
                d.rectangle((x, b - 25, x + 11, b - 6), fill='#1d1e19')
                d.line((x, b - 25, x + 3, b - 21), fill=TIMBER[1], width=2)
                d.line((x + 11, b - 25, x + 8, b - 21), fill=TIMBER[1], width=2)
            else:
                d.rectangle((x, b - 19, x + 11, b - 6), fill='#1d1e19')
                d.pieslice((x, b - 26, x + 11, b - 13), 180, 360, fill='#1d1e19')
                d.arc((x - 1, b - 27, x + 12, b - 12), 180, 360, fill=hi)
                d.line((x - 1, b - 19, x - 1, b - 6), fill=hi); d.line((x + 12, b - 19, x + 12, b - 6), fill=dark)
            d.rectangle((x, b - 9, x + 11, b - 6), fill='#2b271f')

    def side(self):
        """Wall and gable as one sheet; the apex sits over the middle column."""
        mat = darker(self.p, bool(self.r.get('goldMaster')))
        top, sw = self.rise, self.sw
        im, d = self.wall_face(sw, self.wh + top, mat, False)
        b = self.wh + top
        half = sw / 2
        mid = int(half)
        if self.frame:
            for x in (0, sw - 3): self.post(d, x, top, b - 6)
            self.post(d, mid - 1, 4, top)
            self.beam(d, 0, sw, top)
            self.beam(d, 0, sw, b - 28)
            for s in range(1, self.stories): self.beam(d, 0, sw, top + self.floor_y(s))
        for s, on in enumerate(self.side_windows):
            if on: self.window(d, mid - 3, top + self.window_y(s), 6, 9)
        if self.frame or self.stories > 1:
            self.window(d, mid - 2, top - 10, 4, 6)
        px = im.load()
        dark, shade = mat['wall'][0], mat['wall'][1]
        for x in range(sw):
            rake = round(top * abs(x + .5 - half) / half)
            for y in range(rake):
                px[x, y] = (0, 0, 0, 0)
            for i, tone in enumerate((dark, dark, shade)):
                d.point((x, rake + i), fill=tone)
        return im

    def roof_face(self, width, rows):
        pal = ROOFS[self.roof]
        im = Image.new('RGBA', (width, rows + 3))
        d = ImageDraw.Draw(im)
        if self.roof == 'thatch':
            pal = self.thatch
            for x in range(width):
                strand = h2(x, 11) % 6
                lag = h2(x // 3, 5) % 7
                for y in range(rows):
                    # Straw runs down the slope: tone by strand, with a soft
                    # ragged shadow where each layer laps the one below.
                    band = (y + lag) % 13
                    step = 3 if y < rows * .5 else 2
                    if strand == 0: step -= 1
                    elif strand == 1: step += 1
                    if band == 12: step -= 1
                    if h2(x, y) % 19 == 0: step -= 1
                    d.point((x, y), fill=pal[max(1, min(4, step))])
            # The ridge roll, pegged down with crossed spars.
            d.rectangle((0, 0, width, 4), fill=pal[3])
            for x in range(0, width, 6):
                d.line((x, 1, x + 3, 4), fill=pal[1]); d.line((x + 3, 1, x, 4), fill=pal[1])
            d.line((0, 0, width, 0), fill=pal[4]); d.line((0, 5, width, 5), fill=pal[1])
            for x in range(width):
                hang = (1, 2, 3, 3, 2, 1)[x % 6] - 1
                d.line((x, rows, x, rows + hang), fill=pal[2] if h2(x, 1) % 3 else pal[1])
                d.point((x, rows + hang), fill=pal[0])
                if hang: d.point((x, rows + hang - 1), fill=pal[1])
        elif self.roof == 'pantile':
            # Cover tiles in ridges down the slope, broken by the tile ends.
            for x in range(width):
                k = x % 4
                for y in range(rows):
                    step = (4, 3, 2, 1)[k] - (1 if y > rows * .55 else 0)
                    if (y + (x // 4) % 2 * 3) % 6 == 5: step -= 1
                    d.point((x, y), fill=pal[max(0, min(4, step))])
            d.rectangle((0, 0, width, 1), fill=pal[1])
            for x in range(0, width, 4): d.line((x, 0, x + 1, 0), fill=pal[4])
            for x in range(width):
                d.point((x, rows), fill=pal[1] if x % 4 else pal[3]); d.point((x, rows + 1), fill=pal[0])
        else:
            n = rows // 4 + 1
            d.rectangle((0, 0, width, rows), fill=pal[0])
            for row in range(n):
                y = 2 + row * 4
                for col, x in enumerate(range(-3 + (row % 2) * 2, width + 3, 5)):
                    step = max(0, 3 - round(row / max(n - 1, 1) * 3) - ((col + row) % 3 == 0))
                    d.rectangle((x, y, x + 3, y + 3), fill=pal[step])
                    d.line((x, y, x + 2, y), fill=pal[min(4, step + 1)])
                    d.line((x + 3, y + 1, x + 3, y + 3), fill=pal[max(0, step - 1)])
            d.rectangle((0, 0, width, 2), fill=pal[0])
            for x in range(0, width, 5):
                d.line((x, 0, x + 3, 0), fill=pal[4]); d.line((x, 1, x + 3, 1), fill=pal[3])
            d.rectangle((0, rows, width, rows + 2), fill=(0, 0, 0, 0))
            d.line((0, rows, width, rows), fill=pal[1]); d.line((0, rows + 1, width, rows + 1), fill=pal[0])
        return im

    # -- assembly -----------------------------------------------------------

    def chimney(self, x):
        ink, shade, light = self.p['foundation']
        d = ImageDraw.Draw(self.im)
        y = self.depth / 2 - 4
        z0 = self.wh + self.rise - 4 * self.rise / (self.depth / 2)
        ax, ay = self.proj(x, y, z0); _, ty = self.proj(x, y, self.wh + self.rise + 9)
        d.rectangle((ax, ty, ax + 9, ay), fill=shade)
        for j, yy in enumerate(range(ty, ay, 4)):
            d.line((ax, yy, ax + 9, yy), fill=ink)
            for xx in range(ax + (j % 2) * 3, ax + 10, 6):
                d.line((xx, yy, xx, min(yy + 3, ay)), fill=ink)
            d.line((ax + 1, yy + 1, ax + 8, yy + 1), fill=light)
        for c in range(4):
            d.line((ax + 10 + c, ty - c - 1, ax + 10 + c, ay - c - 7), fill=ink)
            d.point((ax + 10 + c, ty - c - 1), fill=shade)
        d.polygon([(ax, ty), (ax + 9, ty), (ax + 13, ty - 4), (ax + 4, ty - 4)], fill=light)
        d.polygon([(ax + 3, ty - 1), (ax + 8, ty - 1), (ax + 10, ty - 3), (ax + 5, ty - 3)], fill='#25221d')
        self.smoke.append([ax + 6, ty - 3, 'chimney'])

    def lean_to(self, pal):
        """An open-fronted shed against the left wall, stacked with firewood."""
        d = ImageDraw.Draw(self.im)
        zh, zl, deep = self.wh - 8, self.wh - 17, self.depth * .55
        fl, fr = self.proj(-17, -2, zl), self.proj(1, -2, zh)
        bl, br = self.proj(-17, deep, zl), self.proj(1, deep, zh)
        gx, gy = self.proj(-16, 0, 0)
        for x in range(16):
            top = fl[1] + round((fr[1] - fl[1]) * (x + 1) / 17) + 2
            d.line((gx + x, top, gx + x, gy), fill='#241c15')
        for row, y in enumerate(range(gy - 2, gy - 15, -4)):
            for x in range(gx + 2 + row % 2 * 2, gx + 15, 4):
                d.rectangle((x, y - 2, x + 2, y), fill='#a67c46'); d.point((x + 1, y - 1), fill='#5a3d22')
                d.point((x, y - 2), fill='#d2a868')
        self.post(d, gx, fl[1] + 3, gy)
        d.polygon([fl, fr, br, bl], fill=pal[2])
        for t in range(1, 5):
            a = (fl[0] + (bl[0] - fl[0]) * t // 5, fl[1] + (bl[1] - fl[1]) * t // 5)
            b = (fr[0] + (br[0] - fr[0]) * t // 5, fr[1] + (br[1] - fr[1]) * t // 5)
            d.line((a, b), fill=pal[1] if t % 2 else pal[3])
        d.line((bl, br), fill=pal[4]); d.line((fl, fr), fill=pal[1])
        d.line((fl[0], fl[1] + 1, fr[0], fr[1] + 1), fill=pal[0])
        d.line((fl, bl), fill=pal[3])

    def cross_wing(self, pal):
        """A gabled wing at the left end, its gable to the street: with the
        main range behind it, the L of an inn or a merchant's house."""
        d = ImageDraw.Draw(self.im)
        ww, wh = 48, self.wh
        g = min(self.rise - 2, 26)
        back = g / self.rise * self.depth / 2
        dark, shade, base, light, hi = self.p['wall']
        bl_, br_, apex = self.proj(0, 0, wh - 9), self.proj(ww, 0, wh - 9), self.proj(ww / 2, 0, wh + g)
        l, r = self.proj(0, 0, wh), self.proj(ww, 0, wh)
        # The far slope runs back to die into the main roof along a valley.
        far = self.proj(ww / 2, back, wh + g)
        d.polygon([apex, (r[0] + 3, r[1] + 2), far], fill=pal[1])
        for t in range(1, 6):
            a = (apex[0] + (r[0] + 3 - apex[0]) * t // 6, apex[1] + (r[1] + 2 - apex[1]) * t // 6)
            d.line((a, (far[0] + (a[0] - apex[0]) // 3, far[1] + (a[1] - apex[1]) // 2)), fill=pal[0] if t % 2 else pal[2])
        d.line((apex, far), fill=pal[3])
        d.polygon([bl_, br_, r, apex, l], fill=base)
        d.line((l[0], l[1], l[0], bl_[1]), fill=light)
        for k in range(0, g if self.frame else 0, 7):  # studs under the collar
            y = l[1] - k
            half = ww / 2 * (1 - k / g)
            d.line((apex[0] - half + 1, y, apex[0] + half - 1, y), fill=TIMBER[1])
        d.line((apex[0], apex[1] + 3, apex[0], l[1]), fill=TIMBER[1], width=2)
        for x in (l[0] + 12, r[0] - 13) if self.frame else ():
            d.line((x, l[1], apex[0], l[1] - g // 2), fill=TIMBER[1])
        self.window(d, apex[0] - 4, l[1] - 12, 7, 9)
        self.beam(d, l[0], r[0], l[1] - 1)
        # Bargeboards, and the roofing lapping over them.
        for a, b, tone in ((l, apex, pal[3]), (apex, r, pal[1])):
            d.line(((a[0] - 3 if a is l else a[0]), a[1] + (2 if a is l else 0), (b[0] + 3 if b is r else b[0]), b[1] + (2 if b is r else 0)), fill=TIMBER[1], width=2)
            d.line(((a[0] - 3 if a is l else a[0]), a[1] - (0 if a is l else 2), (b[0] + 3 if b is r else b[0]), b[1] - (2 if a is l else 0)), fill=tone, width=2)
        d.line((apex[0], apex[1] - 3, apex[0], apex[1] - 8), fill=TIMBER[0])

    def frontispiece(self, pal):
        """A gabled centrepiece over the door: crow-stepped, or a classical
        pediment on pilasters."""
        d = ImageDraw.Draw(self.im)
        style = self.frontis
        ww = 48 if self.tiles >= 7 else 32
        x0 = self.slot * 16 + 8 - ww // 2
        wh = self.wh
        dark, shade, base, light, hi = self.p['wall']
        # Dressed stone trim, whatever the wall is built of.
        if self.p.get('texture') in ('brick', 'grey-brick'): hi = self.p['foundation'][2]
        g = ww // 4 if style == 'pediment' else min(self.rise - 2, ww // 2 + 8)
        l, r, apex = self.proj(x0, 0, wh), self.proj(x0 + ww, 0, wh), self.proj(x0 + ww / 2, 0, wh + g)
        far = self.proj(x0 + ww / 2, g / self.rise * self.depth / 2, wh + g)
        d.polygon([apex, (r[0] + 2, r[1] + 1), far], fill=pal[1])
        d.line((apex, far), fill=pal[3])
        top = l[1] - 9
        if style == 'stepped':
            steps = max(3, g // 6)
            pts = [(l[0], top + 9)]
            for k in range(steps):
                y = l[1] - round(g * (k + 1) / steps) - 3
                x = l[0] + round(ww / 2 * k / steps)
                pts += [(x, pts[-1][1]), (x, y)]
            mirror = [(l[0] + r[0] - x, y) for x, y in reversed(pts)]
            d.polygon([(l[0], l[1]), *pts, *mirror, (r[0], r[1])], fill=base)
            for (xa, ya), (xb, yb) in zip(pts[1::2], pts[2::2]):
                d.line((xa, yb + 1, l[0] + r[0] - xa, yb + 1), fill=shade)
                d.rectangle((xa - 1, yb - 1, xa + 5, yb), fill=hi)
                d.rectangle((l[0] + r[0] - xa - 5, yb - 1, l[0] + r[0] - xa + 1, yb), fill=hi)
            d.line((l[0], l[1], l[0], pts[1][1]), fill=light)
            self.lancet_round(d, apex[0] - 3, l[1] - g // 2 - 6, 6, 10)
        else:
            d.polygon([(l[0] - 2, top + 9), (r[0] + 2, top + 9), (r[0] + 2, top + 6), (apex[0], top + 6 - g), (l[0] - 2, top + 6)], fill=hi)
            d.polygon([(l[0] + 2, top + 5), (r[0] - 2, top + 5), (apex[0], top + 8 - g)], fill=base)
            d.line((l[0] - 2, top + 9, r[0] + 2, top + 9), fill=dark)
            d.ellipse((apex[0] - 3, top - g // 2 + 4, apex[0] + 3, top - g // 2 + 10), fill='#22313a', outline=hi)
            for x in (l[0], l[0] + ww // 3, r[0] - ww // 3 - 3, r[0] - 3):     # pilasters
                d.rectangle((x, top + 10, x + 2, l[1] + wh - 8), fill=hi)
                d.line((x + 3, top + 10, x + 3, l[1] + wh - 8), fill=shade)

    def lancet_round(self, d, x, y, w, h):
        hi = self.p['wall'][4]
        d.rectangle((x - 1, y + 2, x + w, y + h), fill=hi)
        d.pieslice((x - 1, y - 2, x + w, y + 6), 180, 360, fill=hi)
        d.rectangle((x, y + 3, x + w - 1, y + h - 1), fill='#22313a')
        d.pieslice((x, y, x + w - 1, y + 6), 180, 360, fill='#22313a')

    def clock_turret(self):
        """A bell turret astride the ridge: a clock face, a lead cap, a vane."""
        d = ImageDraw.Draw(self.im)
        lead = ['#3c4347', '#5a6368', '#7b858a', '#a3acae'] if self.turret != 'copper' else ['#1f4a3c', '#2f6b57', '#4f8f78', '#86b9a2']
        cx, cy = self.proj(self.slot * 16 + 8, self.depth / 2, self.wh + self.rise)
        dark, shade, base, light, hi = (TIMBER[0], TIMBER[1], '#8d7350', '#b39a6d', '#d8c398') if self.frame else self.p['wall']
        d.rectangle((cx - 6, cy - 16, cx + 5, cy + 2), fill=base)
        d.line((cx - 6, cy - 16, cx - 6, cy + 2), fill=light)
        for c in range(5): d.line((cx + 6 + c, cy - 17 - c, cx + 6 + c, cy - c), fill=shade)
        d.ellipse((cx - 4, cy - 13, cx + 3, cy - 6), fill='#ece7d6', outline=dark)
        d.line((cx, cy - 9, cx, cy - 12), fill=dark); d.line((cx, cy - 9, cx + 2, cy - 9), fill=dark)
        d.line((cx - 7, cy - 16, cx + 6, cy - 16), fill=hi)
        d.polygon([(cx - 8, cy - 17), (cx + 7, cy - 17), (cx + 12, cy - 22), (cx + 2, cy - 30)], fill=lead[1])
        d.polygon([(cx - 8, cy - 17), (cx + 7, cy - 17), (cx + 2, cy - 30)], fill=lead[2])
        d.line((cx - 8, cy - 17, cx + 2, cy - 30), fill=lead[3]); d.line((cx - 8, cy - 17, cx + 7, cy - 17), fill=lead[0])
        d.line((cx + 2, cy - 30, cx + 2, cy - 37), fill='#1f2326'); d.line((cx + 2, cy - 36, cx + 6, cy - 35), fill='#c9a23f')

    def render(self):
        im, fw, sw, wh = self.im, self.fw, self.sw, self.wh
        d = ImageDraw.Draw(im)
        gx, gy = self.proj(fw, 0, 0)
        d.line((self.ox + 1, gy + 1, gx, gy + 1), fill=(30, 34, 26, 155))

        side = self.side()
        for c in range(sw):
            im.alpha_composite(side.crop((c, 0, c + 1, side.height)),
                               (gx + c, gy - (wh + self.rise) - c - 1))
        im.alpha_composite(self.front(), (self.ox, gy - wh))
        ink, fshade, flight = self.p['foundation']
        x = self.door_x - DOOR_W // 2 - 3
        d.rectangle((x, gy - 1, x + DOOR_W + 6, gy + 3), fill=fshade)
        d.rectangle((x, gy - 1, x + DOOR_W + 6, gy), fill=flight)
        d.line((x, gy + 4, x + DOOR_W + 6, gy + 4), fill=ink)
        d.point((x + 5, gy + 1), fill=ink); d.line((x + 11, gy + 2, x + 12, gy + 2), fill=ink)
        if not self.frame:
            # Quoins: the dressed stones that turn the corner.
            for j, y in enumerate(range(gy - wh + 12, gy - 8, 5)):
                long = 5 if j % 2 else 3
                d.rectangle((gx - long, y, gx - 1, y + 3), fill=flight)
                d.line((gx - long, y + 4, gx - 1, y + 4), fill=fshade)
        # Eave shadow on the front wall, on wall only.
        dark, shade = self.p['wall'][0], self.p['wall'][1]
        skin = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in self.p['wall']}
        px = im.load()
        eave_y = self.proj(0, -self.over, wh - self.drop)[1]
        for i, tone in enumerate(() if self.flat else (dark, dark, dark, shade, shade, shade, shade)):
            for x in range(self.ox, gx):
                y = eave_y + 5 + i
                if px[x, y][:3] in skin and (i < 6 or (x + y) % 2): d.point((x, y), fill=tone)

        pal = self.thatch if self.roof == 'thatch' else ROOFS[self.roof]
        if self.flat:
            self.flat_top(d)
            if self.has_chimney: self.chimney(fw * .7)
            else:
                # The hearth vents through a hole in the roof deck.
                hx, hy = self.proj(fw * .6, self.depth * .5, wh)
                self.smoke.append([hx, hy - 1, 'vent'])
            self.occlusion = [self.ox, gy - wh - sw, gx + sw // 2, gy - 1]
            return im
        edge = pal if self.roof == 'thatch' else (TIMBER[0], TIMBER[1], TIMBER[2])
        ex, ey = self.proj(fw + self.verge, -self.over, wh - self.drop)
        rx, ry = self.proj(fw + self.verge, self.depth / 2, wh + self.rise)
        bx, by = self.proj(fw + self.verge, self.depth + self.over, wh - self.drop)
        t = 4 if self.roof == 'thatch' else 3
        # The far slope faces away; only its cut end shows, down the back rake.
        d.polygon([(rx, ry), (bx, by), (bx, by + t), (rx, ry + t)], fill=edge[1])
        d.line((rx, ry, bx, by), fill=edge[2]); d.line((rx, ry + t, bx, by + t), fill=edge[0])
        d.polygon([(ex, ey), (rx, ry), (rx, ry + t), (ex, ey + t)], fill=edge[1])
        d.line((ex, ey + t, rx, ry + t), fill=edge[0])

        rows = ey - ry
        lx = self.proj(-self.verge, -self.over, 0)[0]
        lean = rx - ex
        roof = self.roof_face(fw + 2 * self.verge, rows)
        for r in range(roof.height):
            shift = round((rows - 1 - min(r, rows - 1)) * lean / (rows - 1))
            im.alpha_composite(roof.crop((0, r, roof.width, r + 1)), (lx + shift, ry + r))
        d.line((ex - 1, ey - 1, rx - 1, ry), fill=pal[3])

        if self.wing: self.cross_wing(pal)
        if self.frontis: self.frontispiece(pal)
        if self.turret: self.clock_turret()
        if self.lean: self.lean_to(pal)
        if self.has_chimney:
            self.chimney(fw * (.22 if self.slot >= self.tiles / 2 and not self.wing else .7))
            if (self.stacks or 0) > 1: self.chimney(fw * .08)
        elif not self.turret and not self.r.get('hall') and not self.r.get('theatre') and (self.roof == 'thatch' or self.stories == 1):
            # No stack: the smoke finds its way out at the ridge, through the
            # thatch or a louver.
            vx, vy = self.proj(fw * .55, self.depth / 2, wh + self.rise)
            self.smoke.append([vx, vy - 1, 'vent'])
        self.occlusion = [self.ox, ry, gx + sw // 2, gy - 1]
        return im


class ObliquePlayhouse(ObliqueBuilding):
    """A polygonal timber playhouse: three of its faces show, under a ring of
    thatch open to the yard within."""

    def __init__(self, recipe, material):
        super().__init__({**recipe, 'timber': True, 'chimneys': 0}, material)
        self.ox = 6
        self.fw = recipe['footprint'][0] * 16
        self.cant = self.fw // 4
        self.w = self.fw + 12
        self.h = self.wh + self.cant // 2 + 82
        self.bottom = self.h - 6
        self.door_x = self.ox + self.fw // 2
        self.anchor_x = self.ox + self.fw / 2
        self.im = Image.new('RGBA', (self.w, self.h))

    def face(self, width, material, door=False):
        im, d = self.wall_face(width, self.wh, material, True)
        b = self.wh
        for x in range(1, width - 2, 12): self.post(d, x, 0, b - 6)
        self.post(d, width - 3, 0, b - 6)
        for st in range(1, self.stories):
            y = self.floor_y(st)
            self.beam(d, 0, width - 1, y)
            d.line((0, y + 4, width - 1, y + 4), fill=material['wall'][0])
        for st in range(self.stories):
            y = self.window_y(st)
            for x in range(7, width - 8, 12):
                if door and st == 0 and abs(x + 3 - width // 2) < 10: continue
                self.window(d, x - 2, y, 5, 8)
        if door:
            x = width // 2 - DOOR_W // 2
            recess(d, material, x, b - DOOR_H - 1, DOOR_W, DOOR_H, door=True)
            d.rectangle((x - 3, b - DOOR_H - 5, x + DOOR_W + 3, b - DOOR_H - 3), fill=FRAME[1])
        return im

    def render(self):
        im = self.im; d = ImageDraw.Draw(im)
        W, cant, wh, gy = self.fw, self.cant, self.wh, self.bottom
        pal = self.thatch
        band = 18
        rise = cant // 2
        top = gy - wh - rise
        # The ring seen from above: far thatch, then the dark of the yard.
        d.ellipse((self.ox, top - band - 26, self.ox + W, top + 10), fill=pal[2])
        d.ellipse((self.ox + 10, top - band - 17, self.ox + W - 10, top + 1), fill=pal[1])
        d.ellipse((self.ox + 14, top - band - 13, self.ox + W - 14, top - 3), fill='#1b1712')
        # A tiring-house roof and its flag above the far side.
        hx = self.ox + W // 2
        d.polygon([(hx - 12, top - band - 22), (hx + 12, top - band - 22), (hx + 8, top - band - 34), (hx - 8, top - band - 34)], fill=pal[3])
        d.line((hx - 12, top - band - 22, hx + 12, top - band - 22), fill=pal[0])
        d.line((hx, top - band - 34, hx, top - band - 50), fill=TIMBER[0])
        d.polygon([(hx + 1, top - band - 50), (hx + 11, top - band - 47), (hx + 1, top - band - 44)], fill='#b3261e')
        faces = [(self.face(cant, self.p), 0, lambda c: (cant - 1 - c) // 2),
                 (self.face(cant, darker(self.p)), W - cant, lambda c: c // 2),
                 (self.face(W - 2 * cant, self.p, door=True), cant, lambda c: 0)]
        for face, x0, lift in faces:
            roof = self.roof_face(face.width, band) if self.roof == 'thatch' else None
            for c in range(face.width):
                up = lift(c)
                im.alpha_composite(face.crop((c, 0, c + 1, face.height)), (self.ox + x0 + c, gy - wh - up))
                if roof:
                    im.alpha_composite(roof.crop((c, 0, c + 1, roof.height)), (self.ox + x0 + c, gy - wh - up - band + 3))
        d.line((self.ox + cant, gy - wh + 4, self.ox + cant, gy - 6), fill=TIMBER[0])
        d.line((self.ox + W - cant, gy - wh + 4, self.ox + W - cant, gy - 6), fill=TIMBER[0])
        d.line((self.ox + cant, gy + 1, self.ox + W - cant, gy + 1), fill=(30, 34, 26, 155))
        self.occlusion = [self.ox, top - band, self.ox + W, gy - 1]
        return im
