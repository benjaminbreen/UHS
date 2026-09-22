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
EARTH = ['#4b3b2b', '#735b42', '#9b7b58', '#bea078', '#dac39a']


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
        self.rng = random.Random(recipe['seed'])
        treatments = recipe.get('surfaceTreatments', [])
        self.treatment = (treatments[self.rng.randrange(len(treatments))]
                          if treatments else 'plain')
        if self.treatment == 'limewash':
            self.p = dict(material, wall=['#5d594e', '#8b8677', '#bbb6a5', '#ddd8c8', '#f0ecde'], texture='stucco')
        elif self.treatment == 'creamwash':
            self.p = dict(material, wall=['#594b3b', '#8a745b', '#b59a76', '#d4ba91', '#e7d0a7'], texture='stucco')
        elif self.treatment == 'ochre-geometry':
            self.p = dict(material, wall=['#574438', '#806653', '#ad8d70', '#ceb18e', '#e5cba8'], texture='stucco')
        elif self.treatment == 'earthwash':
            self.p = dict(material, wall=['#4d3827', '#77563a', '#a77c53', '#c79a6c', '#e1bb89'], texture='stucco')
        elif self.treatment == 'warm-grey-wash':
            self.p = dict(material, wall=['#373832', '#66665d', '#96958a', '#bdb9aa', '#ddd8c8'], texture='stucco')
        elif self.treatment == 'soot-timber':
            self.p = dict(material, wall=['#24231f', '#45423a', '#777064', '#aaa08d', '#d8cbb2'], texture='stucco')
        elif self.treatment == 'earth-plaster':
            self.p = dict(material, wall=['#493b2e', '#75614c', '#a18a6e', '#c1aa8b', '#ddc8aa'], texture='stucco')
        elif self.treatment == 'red-brick':
            self.p = dict(material, texture='brick')
        elif self.treatment == 'grey-brick':
            self.p = dict(material, texture='grey-brick')
        else:
            self.p = material
        self.profile = recipe.get('regionalProfile')
        self.detail_set = recipe.get('detailSet', self.profile or 'plain')
        self.wealth = max(0, min(2, int(recipe.get('wealthTier', 1))))
        self.service_style = recipe.get('serviceStyle')
        self.accent = recipe.get('accent', '#8b3f2c')
        self.motif = recipe.get('motifStyle', 'none')
        self.parapet = recipe.get('parapetStyle', 'coping')
        self.roof_style = recipe.get('roofStyle', 'western')
        self.frame_style = recipe.get('frameStyle', 'western')
        fw, fh = recipe['footprint']
        self.tiles = fw
        self.stories = int(recipe.get('stories', 1))
        self.frame = ('timber-frame' in recipe['attachments'] or
                      bool(recipe.get('timber')) or
                      self.frame_style == 'asian-post-beam')
        self.shop = 'urban-shop' in recipe['attachments']
        look = random.Random(recipe['seed'] + 31)
        features = recipe.get('roofFeatures', [])
        self.roof_feature = look.choice(features) if features else None
        turrets = recipe.get('turretStyles', ['none'])
        self.regional_turret = look.choice(turrets)
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
        self.lean = (recipe.get('windowStyle') != 'none' and not self.wing and not self.frontis and not recipe.get('hall') and not recipe.get('theatre') and not recipe.get('regionalHouse')
                     and self.stories == 1 and fw >= 4
                     and recipe['entrance'][0] >= 1 and recipe.get('facing', 'south') == 'south'
                     and look.random() < .4)
        self.fw = (fw - self.lean) * 16
        self.wh = 10 + STOREY * self.stories
        self.sw = recipe.get('sideDepth', side_depth(fh))
        # A flat roof behind a parapet: no rise, no eave, a little more wall.
        self.courtyard = recipe.get('roofForm') == 'courtyard'
        self.flat = recipe.get('roofForm') in ('flat', 'courtyard')
        self.portico = bool(recipe.get('portico')) or 'urban-colonnade' in recipe['attachments']
        if 'urban-colonnade' in recipe['attachments'] and not self.frontis: self.frontis = 'pediment'
        self.rise = 0 if self.flat else roof_rise(self.roof)
        if self.flat: self.wh += 6
        self.depth = self.sw / K
        # Large plans need a legible roof without turning the right wall into
        # isometric perspective. The wall remains 12px; only the roof leans
        # farther back so courts and traversal bands can be read.
        self.roof_depth = self.depth + min(16, max(0, fh - 4) * 2) if recipe.get('regionalHouse') else self.depth
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
        if self.service_style in ('storehouse', 'granary'):
            self.windows = self.windows[:max(1, len(self.windows) // 3)]
        elif self.service_style in ('gatehouse', 'neighborhood-hall', 'devotional-hall'):
            self.windows = [s for s in self.windows if abs(s - self.slot) > 1]
        if self.service_style in ('workshop', 'market-pavilion') and free:
            self.shop = True
            self.shop_slot = min(free, key=lambda s: abs(s - self.slot))
        self.side_windows = [rng.random() < .6 and recipe.get('windowStyle') != 'none' for _ in range(self.stories)]
        self.has_chimney = fw >= 4 and rng.random() < .55 if self.stacks is None else self.stacks > 0
        planter_ok = self.detail_set == 'europe-early-modern' and self.wealth > 0
        self.boxes = [s for s in self.windows if planter_ok and rng.random() < .42]
        self.thatch = look.choice([STRAW, STRAW, ROOFS['thatch'], AGED])

        self.ox = 7 + 16 * self.lean
        roof_return = round(self.roof_depth * K)
        self.w = self.ox + self.fw + max(self.sw, roof_return) + self.verge + 4
        regional_headroom = (26 if self.regional_turret != 'none' or self.roof_feature == 'windcatcher'
                             else 24 if self.service_style == 'neighborhood-hall' else 0)
        self.h = self.wh + self.rise + max(self.sw // 2, roof_return) + max(regional_headroom, 34 if self.turret else 14 if self.has_chimney else 3) + 8
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
        # Stepped value bands replace a computer-smooth gradient: the upper
        # face catches sky light, the foot receives cooler reflected shade.
        # Sparse two-pixel clusters keep broad wall planes quiet.
        if front and width > 24:
            for y in range(2, max(3, b // 5)):
                for x in range(3 + (y % 3) * 5, width - 3, 17):
                    if h2(x, y + self.r['seed']) % 4 == 0:
                        d.line((x, y, min(x + 2, width - 3), y), fill=light)
            for y in range(max(3, b * 4 // 5), b - 6):
                for x in range(6 + (y % 2) * 7, width - 3, 19):
                    if h2(x + self.r['seed'], y) % 3 == 0:
                        d.line((x, y, min(x + 3, width - 3), y), fill=shade)
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
            paint = ((FRAME[0], self.accent) if self.profile else
                     ('#2f5a4a', '#4a7f68') if self.r['seed'] % 3 else
                     ('#6b3a2a', '#96573b') if self.r['seed'] % 3 == 1 else
                     ('#34506a', '#5477a0'))
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
        elif self.lights in ('lattice', 'wood-lattice', 'paper-lattice', 'jali'):
            dark, light = FRAME[0], self.accent
            d.rectangle((cx - 5, y - 1, cx + 4, y + 10), fill=self.p['wall'][4])
            paper = self.lights == 'paper-lattice'
            d.rectangle((cx - 4, y, cx + 3, y + 9), fill='#ded8c6' if paper else '#24221d')
            if self.lights == 'jali':
                for yy in range(y + 1, y + 9, 3):
                    for xx in range(cx - 3 + ((yy - y) // 3) % 2, cx + 4, 3):
                        d.point((xx, yy), fill=dark); d.point((xx + 1, yy + 1), fill=light)
            else:
                for xx in range(cx - 3, cx + 4, 2):
                    d.line((xx, y + 1, xx, y + 8), fill=dark if paper else light)
                for yy in range(y + 2, y + 9, 3):
                    d.line((cx - 4, yy, cx + 3, yy), fill=dark)
            d.line((cx - 5, y + 11, cx + 4, y + 11), fill=self.p['wall'][0])
        else:
            self.window(d, cx - 4, y, 8, 10, box=box)

    def facade_treatment(self, d, b, fw):
        """Profile-controlled finish in quiet facade zones, behind openings."""
        dark, shade, base, light, hi = self.p['wall']
        if self.treatment == 'roman-red-dado':
            d.rectangle((2, b - 18, fw - 3, b - 7), fill='#8f3c2f')
            d.line((2, b - 19, fw - 3, b - 19), fill='#c77855')
        elif self.treatment == 'red-earth-foot':
            d.rectangle((2, b - 13, fw - 3, b - 7), fill='#875039')
        elif self.treatment == 'white-band':
            d.line((2, b - 15, fw - 3, b - 15), fill='#e4dcc4', width=2)
        elif self.treatment == 'brick-reveal':
            x = max(3, fw - 27)
            d.polygon([(x, 7), (fw - 3, 5), (fw - 3, 20), (x + 6, 17)], fill='#8d5d3f')
            for yy in range(8, 19, 4): d.line((x + 4, yy, fw - 4, yy), fill='#5c4132')
        elif self.treatment == 'partial-limewash':
            d.polygon([(2, 3), (fw * 2 // 3, 3), (fw * 2 // 3 - 8, b - 8), (2, b - 12)], fill=light)
            for x in range(8, fw * 2 // 3 - 6, 13):
                d.line((x, b - 14 - (x % 7), x + 5, b - 13 - (x % 7)), fill=base)
        elif self.treatment == 'white-upper' and self.stories > 1:
            split = self.floor_y(1)
            d.rectangle((2, 3, fw - 3, split - 2), fill='#d8d3c3')
            d.line((2, split - 1, fw - 3, split - 1), fill=shade)
        elif self.treatment == 'dark-sill':
            d.rectangle((2, b - 12, fw - 3, b - 7), fill='#4b4540')
        if self.motif == 'roman-panel' or self.treatment == 'roman-ochre-panels':
            y0, y1 = max(5, b - 27), b - 20
            for x in range(4, fw - 8, 16):
                d.rectangle((x, y0, min(x + 11, fw - 4), y1), outline=self.accent)
        elif self.motif == 'key-band':
            y = b - 17
            for x in range(3, fw - 6, 8):
                d.line((x, y, x + 4, y, x + 4, y + 3, x + 7, y + 3), fill=self.accent)
        elif self.motif == 'white-geometry':
            y = b - 16
            for x in range(4, fw - 8, 10):
                d.line((x, y, x + 4, y - 3, x + 8, y), fill='#e8dfc8')
        elif self.motif == 'glazed-spandrel' and self.stories > 1:
            y = self.floor_y(1) + 2
            for x in range(5, fw - 7, 12):
                d.rectangle((x, y, x + 7, y + 2), fill=self.accent)
        elif self.motif == 'painted-border':
            d.line((3, b - 16, fw - 4, b - 16), fill=self.accent)
            for x in range(5, fw - 6, 12):
                d.rectangle((x, b - 18, x + 4, b - 15), outline=self.accent)
        elif self.motif == 'terracotta-band':
            y = b - 17
            for x in range(3, fw - 5, 7):
                d.rectangle((x, y, x + 4, y + 2), fill='#9d583d')
                d.point((x + 2, y + 1), fill='#d39a70')
        elif self.motif == 'painted-beam':
            y = 7
            d.line((2, y, fw - 3, y), fill=self.accent, width=2)
            for x in range(6, fw - 4, 16): d.rectangle((x, y - 2, x + 5, y + 1), fill='#8f493d')
        elif self.motif == 'moon-gate-band':
            y = b - 16
            for x in range(5, fw - 9, 18): d.arc((x, y - 5, x + 10, y + 5), 180, 360, fill=self.accent)

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

    def facade_details(self, d, b):
        """Small profile details occupy facade sockets, never doors or roofs."""
        door = self.slot * 16 + 8
        east = self.detail_set in ('north-chinese', 'south-chinese', 'japanese', 'korean')
        south = self.detail_set in ('north-indian', 'deccan', 'bengali', 'malabar')
        if self.service_style in ('storehouse', 'granary'):
            x0, x1, y0 = door - 9, door + 9, b - DOOR_H + 3
            d.rectangle((x0, y0, x1, b - 3), fill='#493529', outline=FRAME[0])
            d.line((door, y0, door, b - 3), fill=FRAME[2])
            for x in (x0 + 3, x1 - 3):
                for y in range(y0 + 4, b - 4, 6): d.point((x, y), fill='#c49a4d')
        if east:
            # Bracket ends under the eave: plain households show structure;
            # prosperous ones add a restrained second painted member.
            for x in range(7, self.fw - 5, 16):
                d.line((x - 3, 5, x + 3, 5), fill=TIMBER[0], width=2)
                d.line((x, 5, x - 2, 9), fill=TIMBER[1])
                if self.wealth == 2:
                    d.point((x + 2, 6), fill=self.accent)
            if self.wealth > 0:
                for dx in (-10, 10) if self.wealth == 2 else (10,):
                    x = door + dx
                    d.line((x, b - DOOR_H - 7, x, b - DOOR_H - 3), fill=FRAME[0])
                    d.ellipse((x - 2, b - DOOR_H - 3, x + 2, b - DOOR_H + 3),
                              fill=self.accent, outline='#4c2922')
                    d.point((x, b - DOOR_H - 2), fill='#d3a33f')
            if self.service_style in ('workshop', 'neighborhood-hall') or self.shop:
                x = min(self.fw - 8, door + 16)
                d.rectangle((x, b - 30, x + 5, b - 12), fill=FRAME[0])
                d.rectangle((x + 1, b - 29, x + 4, b - 13), fill='#8d5a35')
                for y in range(b - 27, b - 14, 4): d.line((x + 2, y, x + 3, y), fill='#d8b46a')
            if self.wealth == 2 and (self.courtyard or self.service_style in ('gatehouse', 'neighborhood-hall')):
                x0, x1, y = door - 15, door + 15, b - DOOR_H - 8
                d.polygon([(x0, y), (x1, y), (x1 + 3, y - 4), (x0 + 3, y - 4)], fill=ROOFS[self.roof][2])
                d.line((x0, y, x1, y), fill=ROOFS[self.roof][0], width=2)
                d.line((x0 + 3, y - 4, x1 + 3, y - 4), fill=ROOFS[self.roof][4])
            # Household ceramics and planted pots sit against the wall, not
            # in the doorway. Korean jangdok are grouped; the other profiles
            # keep one useful or ornamental vessel rather than generic clutter.
            side = -1 if door > self.fw // 2 else 1
            x = max(5, min(self.fw - 9, door + side * (23 if self.wealth else 19)))
            if self.detail_set == 'korean':
                for dx, hh in ((-4, 5), (2, 7), (7, 4)):
                    d.ellipse((x + dx - 2, b - hh - 1, x + dx + 2, b - hh + 1), fill='#5b3326')
                    d.rectangle((x + dx - 2, b - hh, x + dx + 2, b - 2), fill='#8b5338')
                    d.line((x + dx - 1, b - hh + 1, x + dx + 1, b - hh + 1), fill='#d08a54')
            elif self.wealth > 0:
                d.polygon([(x - 3, b - 7), (x + 3, b - 7), (x + 2, b - 2), (x - 2, b - 2)],
                          fill='#9a5738', outline='#523326')
                d.line((x - 3, b - 7, x + 3, b - 7), fill='#d18a58')
                if self.wealth == 2:
                    d.line((x, b - 8, x - 1, b - 13), fill='#43663c')
                    d.line((x - 1, b - 11, x - 5, b - 13), fill='#587d43')
                    d.line((x - 1, b - 10, x + 4, b - 12), fill='#6f944f')
        elif south:
            if self.wealth > 0:
                # A short toran or textile over the entrance; colour and
                # geometry come from the profile rather than a global flag.
                y = b - DOOR_H - 8
                d.line((door - 8, y, door + 8, y), fill=self.accent, width=2)
                for x in range(door - 7, door + 8, 4):
                    d.polygon([(x, y + 1), (x + 2, y + 4), (x + 4, y + 1)], fill='#d1a34b')
            if self.service_style in ('workshop', 'market-pavilion'):
                x0 = max(3, door - 30); x1 = min(self.fw - 4, door - 12)
                d.line((x0, b - 17, x1, b - 15), fill=FRAME[2])
                for x, tone in ((x0 + 3, '#b54f3f'), (x0 + 9, '#d0a63e'), (x0 + 15, self.accent)):
                    if x + 3 < x1: d.rectangle((x, b - 16, x + 3, b - 9), fill=tone)
            if self.service_style == 'devotional-hall':
                y = b - DOOR_H - 10
                for x in (door - 10, door + 9):
                    d.rectangle((x, y + 4, x + 2, b - 3), fill=self.p['foundation'][2])
                    d.line((x + 2, y + 4, x + 2, b - 3), fill=self.p['foundation'][0])
                d.polygon([(door - 13, y + 4), (door + 13, y + 4),
                           (door + 8, y - 1), (door - 8, y - 1)], fill=self.p['foundation'][1])
                d.line((door - 8, y - 1, door + 8, y - 1), fill=self.p['foundation'][2])
                for x in (door - 14, door + 14):
                    d.line((x, y + 2, x, y - 5), fill=FRAME[1])
                    d.polygon([(x, y - 5), (x + 5, y - 3), (x, y - 1)], fill=self.accent)
            # Red clay water pots, coir or work bundles are more convincing
            # here than a universal flower box. A planted entrance pedestal is
            # reserved for prosperous north-Indian households.
            side = -1 if door > self.fw // 2 else 1
            x = max(6, min(self.fw - 10, door + side * 23))
            pots = 2 if self.detail_set in ('bengali', 'malabar') or self.wealth == 2 else 1
            for i in range(pots):
                px = x + i * 6 * side
                d.ellipse((px - 3, b - 8 - i, px + 3, b - 2), fill='#a65738', outline='#593126')
                d.line((px - 2, b - 7 - i, px + 2, b - 7 - i), fill='#dd9360')
            if self.detail_set == 'north-indian' and self.wealth == 2:
                d.rectangle((x - 4, b - 5, x + 4, b - 2), fill='#b87945', outline='#68422d')
                d.line((x, b - 6, x, b - 13), fill='#4b6e3c')
                for dx, dy in ((-3, -11), (3, -10), (-2, -14), (2, -15)):
                    d.point((x + dx, b + dy), fill='#6f934a')
        elif self.detail_set.startswith('europe'):
            if self.detail_set == 'europe-early-modern' and self.wealth == 2 and self.windows:
                # Individual herb/flower troughs are appropriate here; they
                # are deliberately absent from medieval and prehistoric sets.
                for slot in self.windows[:2]:
                    x, y = slot * 16 + 3, self.window_y(0) + 11
                    d.rectangle((x, y, x + 10, y + 3), fill='#6b452c')
                    d.line((x, y + 4, x + 10, y + 4), fill='#35281e')
                    for xx in range(x + 1, x + 10, 3):
                        d.point((xx, y - 1), fill='#63833e')
                        d.point((xx + 1, y - 2), fill=BLOOMS[(xx + self.r['seed']) % len(BLOOMS)])
            elif self.wealth < 2 and self.windows:
                x = self.windows[0] * 16 + 8
                d.line((x - 5, 7, x + 5, 7), fill=FRAME[1])
                for dx in (-3, 1, 4):
                    d.line((x + dx, 8, x + dx - 1, 12), fill='#92794c')
                    d.point((x + dx - 1, 13), fill='#b29a63')
            if self.wealth > 0:
                side = -1 if door > self.fw // 2 else 1
                x = max(5, min(self.fw - 8, door + side * 22))
                d.polygon([(x - 3, b - 7), (x + 3, b - 7), (x + 2, b - 2), (x - 2, b - 2)],
                          fill='#8e5838', outline='#453126')
                if self.detail_set == 'europe-early-modern' and self.wealth == 2:
                    for dx in (-2, 1, 3):
                        d.line((x, b - 8, x + dx, b - 13 - abs(dx) % 2), fill='#55783f')
                    d.point((x - 3, b - 13), fill=BLOOMS[(self.r['seed'] + 1) % len(BLOOMS)])
        elif self.detail_set.startswith('neolithic'):
            # Drying grain, reeds or fish makes subsistence visible without
            # projecting a later decorative vocabulary backwards.
            side = -1 if door > self.fw // 2 else 1
            x = max(6, min(self.fw - 7, door + side * 22))
            d.line((x - 5, 8, x + 5, 8), fill=FRAME[1])
            for dx in (-3, 0, 3):
                d.line((x + dx, 9, x + dx - 1, 14), fill='#a88749')
                d.point((x + dx - 1, 15), fill='#d0b36a')
            if self.service_style in ('storehouse', 'workshop') or self.wealth > 0:
                bx = max(5, min(self.fw - 10, x + side * 13))
                d.ellipse((bx - 4, b - 7, bx + 4, b - 2), fill='#8a6037', outline='#463322')
                d.line((bx - 2, b - 7, bx + 2, b - 7), fill='#c39a59')

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
        self.facade_treatment(d, b, fw)
        if self.treatment == 'ochre-geometry':
            ochre = '#85402d'
            y = b - 12
            d.line((2, y + 4, fw - 3, y + 4), fill=ochre)
            for x in range(4, fw - 8, 10):
                d.line((x, y, x + 4, y - 3, x + 8, y), fill=ochre)
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
                if self.frame_style == 'asian-post-beam':
                    self.beam(d, 1, fw - 2, top)
                    if foot >= top:
                        for x in range(7, fw - 5, 16): self.post(d, x, top, foot)
                else:
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
            planned = self.windows if self.r.get('goldMaster') or self.r.get('prehistoricExpansion') or self.r.get('regionalHouse') else None
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
        if self.motif == 'door-frame':
            d.line((x - 5, b - DOOR_H - 7, x + DOOR_W + 5, b - DOOR_H - 7), fill=self.accent, width=2)
            d.line((x - 5, b - DOOR_H - 6, x - 5, b - 2), fill=self.accent)
            d.line((x + DOOR_W + 5, b - DOOR_H - 6, x + DOOR_W + 5, b - 2), fill=self.accent)
        elif self.motif == 'voussoir':
            for k in range(6):
                tone = self.p['foundation'][2 if k % 2 else 1]
                d.rectangle((x - 4 + k * 3, b - DOOR_H - 7 - (k in (2, 3)) * 2,
                             x - 2 + k * 3, b - DOOR_H - 4), fill=tone)
        elif self.motif == 'red-gate':
            gate = self.accent if self.wealth else '#69443a'
            d.rectangle((x - 3, b - DOOR_H - 4, x + DOOR_W + 3, b - 2), outline=gate, width=2)
            d.rectangle((x + 1, b - DOOR_H, x + DOOR_W - 1, b - 2), fill=gate)
            d.line((x + DOOR_W // 2, b - DOOR_H, x + DOOR_W // 2, b - 2), fill='#5b241f')
            if self.wealth > 0:
                for xx in (x + 2, x + DOOR_W - 2):
                    for yy in range(b - DOOR_H + 4, b - 3, 6): d.point((xx, yy), fill='#d3a33f')
        elif self.motif == 'noren':
            d.rectangle((x - 2, b - DOOR_H - 4, x + DOOR_W + 2, b - DOOR_H + 5), fill=self.accent)
            for xx in range(x + 1, x + DOOR_W + 1, 4):
                d.line((xx, b - DOOR_H - 3, xx, b - DOOR_H + 5), fill='#243746')
        elif self.motif in ('carved-lintel', 'painted-beam'):
            tone = self.accent if self.motif == 'painted-beam' else FRAME[1]
            d.rectangle((x - 5, b - DOOR_H - 7, x + DOOR_W + 5, b - DOOR_H - 4), fill=tone)
            for xx in range(x - 3, x + DOOR_W + 4, 4): d.point((xx, b - DOOR_H - 6), fill=FRAME[2])
        self.facade_details(d, b)
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
        deck = (ROOFS['pantile'] if self.r.get('roofMaterial') == 'pantile' else
                EARTH if self.r.get('roofMaterial') == 'earth' else self.p['roof'])
        a, b_, c, e = self.proj(0, 0, wh), self.proj(fw, 0, wh), self.proj(fw, self.roof_depth, wh), self.proj(0, self.roof_depth, wh)
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
        self.parapet_detail(d, a, b_)
        self.roof_details(d)

    def parapet_detail(self, d, a, b_):
        """A profile's skyline vocabulary, kept below a person's knee."""
        y, x0, x1 = a[1], a[0] + 2, b_[0] - 2
        dark, shade, base, light, hi = self.p['wall']
        if self.parapet == 'stepped':
            for i, x in enumerate(range(x0, x1, 14)):
                cap = min(x + (8 if i % 2 else 6), x1)
                d.rectangle((x, y - 5, cap, y), fill=base)
                d.line((x - 1, y - 6, min(cap + 1, x1), y - 6), fill=hi)
                d.line((cap, y - 4, cap, y), fill=shade)
        elif self.parapet == 'rounded':
            for x in range(x0 + 3, x1, 12):
                d.ellipse((x - 3, y - 4, x + 3, y + 1), fill=base, outline=shade)
                d.line((x - 2, y - 4, x + 1, y - 4), fill=hi)
        elif self.parapet == 'pierced':
            d.rectangle((x0, y - 4, x1, y), fill=base)
            for x in range(x0 + 4, x1 - 2, 8): d.rectangle((x, y - 3, x + 2, y - 1), fill=dark)
            d.line((x0, y - 4, x1, y - 4), fill=self.accent)
        elif self.parapet == 'screened':
            for x in range(x0, x1, 5):
                d.line((x, y - 6, x, y), fill=FRAME[1])
                if x + 4 < x1: d.line((x, y - 5, x + 4, y - 1), fill=FRAME[2])
            d.line((x0 - 1, y - 7, x1, y - 7), fill=FRAME[2])
        elif self.parapet == 'coping':
            d.rectangle((x0, y - 3, x1, y), fill=base)
            d.line((x0 - 1, y - 4, x1 + 1, y - 4), fill=hi, width=2)
            for x in range(x0 + 9, x1, 12):
                d.line((x, y - 3, x, y), fill=shade)
            for x in (x0, x1 - 2):
                d.rectangle((x, y - 6, x + 3, y), fill=base)
                d.line((x, y - 7, x + 3, y - 7), fill=hi)
        elif self.parapet == 'stone-coping':
            stone = self.p['foundation']
            d.rectangle((x0, y - 3, x1, y), fill=stone[1])
            for i, x in enumerate(range(x0, x1, 8)):
                d.rectangle((x, y - 5 - i % 2, min(x + 7, x1), y - 3), fill=stone[2])
                d.line((x, y - 5 - i % 2, min(x + 7, x1), y - 5 - i % 2), fill=stone[2])
                d.line((min(x + 7, x1), y - 4, min(x + 7, x1), y), fill=stone[0])
        elif self.parapet == 'jali':
            d.rectangle((x0, y - 7, x1, y), fill=base)
            for x in range(x0 + 3, x1 - 3, 7):
                d.polygon([(x, y - 4), (x + 2, y - 6), (x + 4, y - 4), (x + 2, y - 2)], fill=dark)
                d.point((x + 2, y - 5), fill=shade)
            d.line((x0 - 1, y - 8, x1 + 1, y - 8), fill=hi, width=2)
            for x in (x0, x1 - 2):
                d.rectangle((x, y - 10, x + 3, y), fill=base)
                d.line((x, y - 11, x + 3, y - 11), fill=hi)
            if self.detail_set == 'north-indian' and self.wealth == 2 and x1 - x0 > 70:
                # Two tiny corner kiosks enrich an elite haveli without
                # occupying the connected centre of the terrace.
                for x in (x0 + 7, x1 - 8):
                    d.rectangle((x - 2, y - 14, x + 2, y - 8), fill=base, outline=shade)
                    d.polygon([(x - 5, y - 14), (x + 5, y - 14), (x, y - 19)], fill='#b77a4d')
                    d.line((x - 5, y - 14, x, y - 19, x + 5, y - 14), fill='#70442f')

    def roof_details(self, d):
        feature = self.roof_feature
        if self.r.get('roofPlan') == 'tiled-courtyard' and feature in ('plain', 'ridge-finials'):
            return
        if (not feature or feature == 'plain') and self.regional_turret == 'none': return
        x, y = self.proj(self.fw * .72, self.roof_depth * .55, self.wh)
        dark, shade, base, light, hi = self.p['wall']
        if self.regional_turret in ('corner-stair', 'windcatcher') or feature == 'windcatcher':
            tall = 22 if self.regional_turret == 'windcatcher' or feature == 'windcatcher' else 13
            d.rectangle((x - 6, y - tall, x + 5, y), fill=base, outline=dark)
            d.line((x - 5, y - tall + 1, x - 5, y - 2), fill=hi)
            if tall > 15:
                d.rectangle((x - 3, y - tall + 4, x + 2, y - tall + 10), fill='#24221d')
                d.line((x, y - tall + 4, x, y - tall + 10), fill=self.accent)
            d.line((x - 7, y - tall - 1, x + 6, y - tall - 1), fill=hi)
            return
        if feature in ('shade-frame', 'palm-screen'):
            cloth = '#b88a50' if feature == 'shade-frame' else '#8f7b4f'
            for dx in (-10, 10): d.line((x + dx, y - 12, x + dx, y), fill=FRAME[1])
            d.polygon([(x - 11, y - 13), (x + 9, y - 13), (x + 12, y - 9), (x - 8, y - 9)], fill=cloth)
            d.line((x - 11, y - 13, x + 9, y - 13), fill='#d4b27a')
        elif feature == 'laundry':
            d.line((x - 11, y - 11, x - 11, y), fill=FRAME[1]); d.line((x + 11, y - 11, x + 11, y), fill=FRAME[1])
            d.line((x - 11, y - 10, x + 11, y - 8), fill=FRAME[2])
            for dx, colour in ((-7, '#ded4b7'), (-1, self.accent), (6, '#746b56')):
                d.rectangle((x + dx, y - 9, x + dx + 4, y - 4), fill=colour)
        elif feature in ('water-jars', 'terracotta-pots', 'roof-jars'):
            for dx in (-6, 0, 6):
                d.ellipse((x + dx - 2, y - 6, x + dx + 2, y), fill='#9c5938', outline='#533426')
        elif feature == 'ridge-finials':
            for dx in (-9, 9):
                d.line((x + dx, y - 8, x + dx, y - 2), fill=FRAME[0], width=2)
                d.point((x + dx + (1 if dx > 0 else -1), y - 9), fill=self.accent)
        else:
            d.rectangle((x - 5, y - 3, x + 5, y + 1), fill=shade, outline=dark)
            d.line((x - 3, y - 3, x + 3, y - 3), fill=hi)

    def courtyard_top(self, d):
        """A continuous roof ring around a legible open court."""
        wh, fw = self.wh, self.fw
        dark, shade, base, light, hi = self.p['wall']
        tiled_court = self.r.get('roofPlan') == 'tiled-courtyard'
        deck = (ROOFS.get(self.r.get('roofMaterial')) if tiled_court else
                ROOFS['pantile'] if self.r.get('roofMaterial') == 'pantile' else
                EARTH if self.r.get('roofMaterial') == 'earth' else self.p['roof'])
        a, b_, c, e = self.proj(0, 0, wh), self.proj(fw, 0, wh), self.proj(fw, self.roof_depth, wh), self.proj(0, self.roof_depth, wh)
        d.polygon([a, b_, c, e], fill=deck[2])
        if tiled_court:
            # Long pan-and-cover channels make the four ranges read as roofs,
            # while the court below erases their crossing lines.
            for x in range(4, fw, 5):
                p0, p1 = self.proj(x, 0, wh), self.proj(x, self.roof_depth, wh)
                d.line((p0, p1), fill=deck[1])
                d.point((p0[0] + 1, p0[1]), fill=deck[4])
            for y in range(3, round(self.roof_depth), 5):
                p0, p1 = self.proj(0, y, wh), self.proj(fw, y, wh)
                d.line((p0, p1), fill=deck[3])
        cx, cy, cw, ch = self.r['courtyard']
        fh = self.r['footprint'][1]
        depth_y = lambda tile: self.roof_depth * tile / fh
        ia = self.proj(cx * 16, depth_y(cy), wh)
        ib = self.proj((cx + cw) * 16, depth_y(cy), wh)
        ic = self.proj((cx + cw) * 16, depth_y(cy + ch), wh)
        ie = self.proj(cx * 16, depth_y(cy + ch), wh)
        if tiled_court:
            mid = lambda p, q, lift=0: ((p[0] + q[0]) // 2, (p[1] + q[1]) // 2 - lift)
            fa, fb = mid(a, ia, 4), mid(b_, ib, 4)
            ba, bb = mid(e, ie, 3), mid(c, ic, 3)
            # Each range has a raised ridge and two differently lit slopes.
            # The lift is deliberately shallow so the published roof cells
            # remain the usable traversal surface.
            d.polygon([a, b_, fb, fa], fill=deck[3])
            d.polygon([fa, fb, ib, ia], fill=deck[1])
            d.polygon([e, ba, bb, c], fill=deck[1])
            d.polygon([ba, ie, ic, bb], fill=deck[2])
            d.polygon([a, fa, ba, e], fill=deck[3])
            d.polygon([fa, ia, ie, ba], fill=deck[1])
            d.polygon([b_, c, bb, fb], fill=deck[2])
            d.polygon([fb, bb, ic, ib], fill=deck[0])
            # Reassert sparse tile channels on each range after the lighting
            # planes; quiet roof fields remain available for traversal.
            for x in range(a[0] + 4, b_[0] - 2, 5):
                d.line((x, a[1] + 1, x + 4, a[1] - 6), fill=deck[1])
                d.point((x + 1, a[1]), fill=deck[4])
            for p, q in ((fa, fb), (ba, bb), (fa, ba), (fb, bb)):
                d.line((p, q), fill=deck[0], width=2)
                d.line((p[0], p[1] - 1, q[0], q[1] - 1), fill=deck[4])
        court = '#55442f' if self.profile and self.profile.startswith('roman-') else '#8a704d'
        d.polygon([ia, ib, ic, ie], fill=court)
        # Inner walls establish the drop without filling the court with noise.
        d.polygon([ia, ib, (ib[0], ib[1] + 7), (ia[0], ia[1] + 7)], fill=shade)
        d.line((ia[0], ia[1], ib[0], ib[1]), fill=hi)
        d.polygon([ib, ic, (ic[0], ic[1] + 5), (ib[0], ib[1] + 7)], fill=dark)
        if self.profile and self.profile.startswith('roman-'):
            # Impluvium and column hints make the court a room-sized void, not
            # a decorative hole in a single roof slab.
            mx = (ia[0] + ib[0] + ic[0] + ie[0]) // 4
            my = (ia[1] + ib[1] + ic[1] + ie[1]) // 4 + 3
            d.rectangle((mx - 7, my - 2, mx + 7, my + 2), fill='#53717a', outline='#c8b991')
            for px, py in (ia, ib, ic, ie):
                d.rectangle((px - 1, py, px + 1, py + 4), fill=self.p['foundation'][2])
        # Broad, quiet roof bands remain unmistakable traversal space.
        d.line((a[0], a[1], b_[0], b_[1]), fill=deck[min(3, len(deck) - 1)], width=2)
        d.line((e[0], e[1], c[0], c[1]), fill=deck[min(3, len(deck) - 1)])
        if tiled_court:
            d.line((a[0] - 3, a[1] + 2, b_[0] + 3, b_[1] + 2), fill=deck[0], width=2)
            for x in range(a[0], b_[0], 4): d.point((x, a[1] + 3), fill=deck[3])
            for x in (a[0] - 3, b_[0] + 3):
                d.line((x, a[1] + 1, x + (-3 if x < a[0] else 3), a[1] - 2), fill=deck[4], width=2)
            if self.wealth > 0:
                # Chiwen-like ridge terminals, simplified at this scale. The
                # prosperous tier adds a short procession of roof beasts;
                # ordinary compounds retain only the structural ridge cap.
                for x, facing in ((a[0] - 2, -1), (b_[0] + 2, 1)):
                    d.line((x, a[1] - 1, x, a[1] - 7), fill=deck[0], width=2)
                    d.line((x, a[1] - 7, x + facing * 3, a[1] - 10), fill=deck[3], width=2)
                    d.point((x + facing * 4, a[1] - 10), fill=self.accent)
                if self.wealth == 2:
                    for x in range(a[0] + 18, min(b_[0] - 10, a[0] + 50), 9):
                        d.rectangle((x, a[1] - 5, x + 2, a[1] - 3), fill=deck[0])
                        d.point((x + 1, a[1] - 6), fill=self.accent)
        if self.r.get('roofMaterial') == 'pantile':
            for x in range(a[0] + 4, b_[0] - 3, 6):
                d.line((x, a[1] - 1, x + 2, a[1] + 2), fill=deck[1])
        self.parapet_detail(d, a, b_)
        self.roof_details(d)

    def arches(self, d, b):
        """An open ground floor: the market stands under the hall."""
        dark, shade, base, light, hi = self.p['wall']
        for t in range(self.tiles):
            x = t * 16 + 2
            if self.r.get('regionalHouse') == 'roman-insula' and t % 3 == 2:
                self.window(d, x + 2, b - 21, 7, 9)
                continue
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
        mat = darker(self.p, bool(self.r.get('goldMaster') or self.r.get('prehistoricExpansion') or self.r.get('regionalHouse')))
        top, sw = self.rise, self.sw
        im, d = self.wall_face(sw, self.wh + top, mat, False)
        b = self.wh + top
        half = sw / 2
        mid = int(half)
        if self.frame:
            for x in (0, sw - 3): self.post(d, x, top, b - 6)
            if top > 4: self.post(d, mid - 1, 4, top)
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
        elif self.roof_style in ('chinese', 'kawara', 'giwa'):
            d.rectangle((0, 0, width, rows), fill=pal[1])
            for x in range(-2, width + 2, 4):
                d.rectangle((x, 0, x + 1, rows), fill=pal[2])
                d.line((x + 2, 0, x + 2, rows), fill=pal[0])
                d.line((x + 3, 0, x + 3, rows), fill=pal[3])
            for y in range(4, rows, 5):
                d.line((0, y, width, y), fill=pal[0])
                d.line((0, y + 1, width, y + 1), fill=pal[3])
            d.rectangle((0, 0, width, 2), fill=pal[0])
            d.line((0, 0, width, 0), fill=pal[4])
            d.line((0, rows, width, rows), fill=pal[0], width=2)
            for x in range(1, width, 4): d.point((x, rows + 2), fill=pal[3])
        elif self.roof == 'pantile' or self.roof_style in ('bengal', 'malabar'):
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
        self.roof_patina(d, width, rows, pal)
        return im

    def roof_patina(self, d, width, rows, pal):
        """A few coherent weather clusters; never a noise pass."""
        if width < 30 or rows < 8:
            return
        damp = self.detail_set in ('south-chinese', 'japanese', 'korean', 'bengali', 'malabar')
        dusty = self.detail_set in ('north-chinese', 'north-indian', 'deccan')
        european = self.detail_set.startswith('europe')
        prehistoric = self.detail_set.startswith('neolithic')
        count = 3 if damp and width > 100 else 2 if damp or dusty or european else 1 if prehistoric else 0
        for i in range(count):
            seed = self.r['seed'] + i * 37
            x = 8 + abs(h2(seed, 17)) % max(1, width - 16)
            y = rows // 2 + abs(h2(seed, 29)) % max(1, rows // 2 - 2)
            if damp:
                colours = ('#40513b', '#586448', pal[1])
                for dx, dy, c in ((0, 0, colours[0]), (1, 0, colours[1]), (2, -1, colours[1]),
                                  (-1, 1, colours[0]), (3, 1, colours[2])):
                    d.point((x + dx, min(rows - 1, y + dy)), fill=c)
            elif dusty:
                tone = '#796c59' if self.detail_set == 'north-chinese' else '#9c7650'
                d.line((x - 2, y, x + 2, y), fill=tone)
                d.point((x + 1, y - 1), fill=pal[1])
            elif european:
                # A replaced tile or darkened slate course reads as maintenance,
                # not arbitrary texture.
                d.rectangle((x - 2, y - 1, x + 2, y + 1), fill=pal[1])
                d.line((x - 2, y - 1, x + 1, y - 1), fill=pal[3])
            elif prehistoric and self.roof == 'thatch':
                d.line((x - 4, y, x + 4, y + 1), fill=pal[1])
                for dx in (-3, 0, 3): d.line((x + dx, y - 1, x + dx + 1, y + 2), fill=pal[0])

    def regional_roof_trim(self, d, pal, lx, ex, ey, rx, ry, roof_width):
        """Profile-specific eaves and ridges after the common roof projection."""
        style = self.roof_style
        if style not in ('chinese', 'kawara', 'giwa', 'bengal', 'malabar'):
            return
        right = lx + roof_width - 1
        if style in ('chinese', 'kawara', 'giwa'):
            d.line((lx, ey + 1, right, ey + 1), fill=pal[0], width=2)
            for x in range(lx + 2, right - 1, 4):
                d.point((x, ey + 3), fill=pal[3]); d.point((x + 1, ey + 2), fill=pal[1])
            lift = 5 if style == 'chinese' and self.detail_set == 'south-chinese' else 4 if style == 'giwa' else 3
            d.line((lx, ey + 1, lx - 4, ey - lift), fill=pal[3], width=2)
            d.line((right, ey + 1, right + 4, ey - lift), fill=pal[3], width=2)
            ridge_x = lx + (rx - ex)
            d.line((ridge_x, ry - 1, ridge_x + roof_width - 1, ry - 1), fill=pal[0], width=3)
            if style == 'kawara':
                # Japanese ridge tiles terminate in round onigawara-like caps,
                # without borrowing the Chinese procession of roof beasts.
                d.line((ridge_x + 2, ry - 4, ridge_x + roof_width - 3, ry - 4), fill=pal[3], width=2)
                for x in (ridge_x + 1, ridge_x + roof_width - 2):
                    d.ellipse((x - 3, ry - 7, x + 3, ry - 1), fill=pal[1], outline=pal[0])
                    d.point((x, ry - 4), fill=pal[4])
                if self.wealth == 2:
                    d.line((ridge_x + roof_width // 2, ry - 5,
                            ridge_x + roof_width // 2, ry - 10), fill=pal[0], width=2)
                    d.polygon([(ridge_x + roof_width // 2 - 3, ry - 10),
                               (ridge_x + roof_width // 2 + 3, ry - 10),
                               (ridge_x + roof_width // 2, ry - 13)], fill=pal[3])
            else:
                ridge = '#e0d8c3' if style == 'giwa' else pal[3]
                d.line((ridge_x + 1, ry - 3, ridge_x + roof_width - 2, ry - 3), fill=ridge)
            if self.wealth > 0 and style != 'kawara':
                for x in (ridge_x + 1, ridge_x + roof_width - 2):
                    facing = 1 if x > ridge_x + roof_width // 2 else -1
                    d.line((x, ry - 7, x, ry - 2), fill=pal[0], width=2)
                    reach = 4 if self.detail_set == 'south-chinese' else 3
                    d.line((x, ry - 7, x + facing * reach, ry - 10), fill=pal[3], width=2)
                    d.point((x + facing * 4, ry - 10), fill=self.accent)
            if self.wealth == 2 and self.roof_feature == 'ridge-finials' and style == 'chinese':
                for x in range(ridge_x + 14, min(ridge_x + roof_width - 10, ridge_x + 48), 9):
                    d.rectangle((x, ry - 7, x + 2, ry - 4), fill=pal[0])
                    d.point((x + 1, ry - 8), fill=self.accent)
            if style == 'giwa' and self.wealth > 0:
                # Short painted bracket bands suggest dancheong on substantial
                # Korean buildings while leaving ordinary hanok mostly timber.
                for x in range(lx + 8, right - 4, 16):
                    d.rectangle((x, ey + 3, x + 5, ey + 4), fill=self.accent)
                    d.point((x + 2, ey + 3), fill='#c49743')
            if self.roof_feature == 'roof-jars' and self.wealth > 0:
                for dx in (-8, 0, 8):
                    x = ridge_x + roof_width * 3 // 4 + dx
                    d.ellipse((x - 2, ry - 7, x + 2, ry - 2), fill='#8f4932', outline='#4f3026')
        else:
            mid = (lx + right) // 2
            droop = 3 if style == 'bengal' else 1
            d.line((lx - 3, ey - 1, mid, ey + droop, right + 3, ey - 1), fill=pal[0], width=2)
            d.line((lx - 2, ey - 3, mid, ey + droop - 2, right + 2, ey - 3), fill=pal[3])
            if style == 'bengal':
                for x in range(lx, right, 4):
                    d.point((x, ey + droop + 1), fill=pal[1])
                    if self.wealth == 2 and (x - lx) % 12 == 0:
                        d.point((x + 1, ey + droop), fill='#c3794b')
            else:
                # Kerala/Malabar roofs are deep layered weather shields: a
                # timber soffit and doubled fascia matter more than a busy ridge.
                d.line((lx - 2, ey + 1, mid, ey + droop + 2, right + 2, ey + 1), fill=FRAME[0], width=2)
                d.line((lx, ey - 1, mid, ey + droop, right, ey - 1), fill=FRAME[2])
                for x in range(lx + 3, right, 8): d.line((x, ey + 1, x + 2, ey + 3), fill=FRAME[1])
                if self.wealth == 2:
                    ridge_x = lx + (rx - ex) + roof_width // 2
                    d.line((ridge_x, ry - 2, ridge_x, ry - 8), fill='#5a3827', width=2)
                    d.point((ridge_x + 1, ry - 9), fill='#c49a45')

    def european_roof_trim(self, d, pal, lx, ex, ey, rx, ry, roof_width):
        """Regional ridge and verge craft for European pitched roofs."""
        if not self.detail_set.startswith('europe'):
            return
        ridge_x = lx + (rx - ex)
        right = ridge_x + roof_width - 1
        if self.roof == 'thatch':
            # A tied ridge roll and occasional weighted crooks, not a tile cap.
            d.line((ridge_x, ry - 1, right, ry - 1), fill=self.thatch[3], width=2)
            for x in range(ridge_x + 5, right - 3, 10):
                d.line((x - 2, ry - 3, x, ry), fill=self.thatch[1])
                d.line((x + 2, ry - 3, x, ry), fill=self.thatch[1])
        else:
            # Tile or stone ridge pieces read as overlapping caps rather than
            # a perfectly machined stripe.
            d.line((ridge_x, ry - 1, right, ry - 1), fill=pal[0], width=2)
            for x in range(ridge_x + 2, right - 2, 6):
                d.line((x, ry - 3, min(x + 4, right), ry - 3), fill=pal[3])
                d.point((x + 4, ry - 2), fill=pal[1])
        # Pegged or shaped bargeboards animate the visible rake on substantial
        # town houses, without adding a false tower or changing the roof plane.
        if self.detail_set in ('europe-town', 'europe-early-modern') and self.wealth > 0:
            d.line((ex - 2, ey, rx - 2, ry - 1), fill=FRAME[1], width=2)
            steps = max(2, (ey - ry) // 5)
            for i in range(1, steps):
                t = i / steps
                x = round(ex + (rx - ex) * t) - 2
                y = round(ey + (ry - ey) * t)
                d.point((x - 1, y), fill=FRAME[2])
                if self.wealth == 2 and i % 2:
                    d.point((x - 2, y + 1), fill=self.accent)
        if self.detail_set == 'europe-early-modern' and self.wealth == 2:
            cx = ridge_x + roof_width // 2
            d.line((cx, ry - 3, cx, ry - 8), fill=FRAME[0])
            d.line((cx, ry - 8, cx + 4, ry - 7), fill='#c39a3d')

    def service_roof_marker(self, d, pal):
        """A small communal roof element, reserved for neighborhood halls."""
        if self.service_style != 'neighborhood-hall':
            return
        cx, cy = self.proj(self.fw * .55, self.depth / 2, self.wh + self.rise)
        if self.detail_set.startswith('europe'):
            d.rectangle((cx - 6, cy - 12, cx + 6, cy - 3), fill=TIMBER[1], outline=TIMBER[0])
            d.rectangle((cx - 2, cy - 10, cx + 2, cy - 5), fill='#25231d')
            d.ellipse((cx - 1, cy - 9, cx + 1, cy - 5), fill='#b99449')
            d.polygon([(cx - 9, cy - 12), (cx + 9, cy - 12), (cx, cy - 21)], fill=pal[2])
            d.line((cx - 9, cy - 12, cx, cy - 21, cx + 9, cy - 12), fill=pal[0], width=2)
            d.line((cx, cy - 21, cx, cy - 25), fill=TIMBER[0])
            d.point((cx + 2, cy - 24), fill='#c9a23f')
            return
        d.rectangle((cx - 7, cy - 13, cx + 7, cy - 3), fill=self.p['wall'][2], outline=FRAME[0])
        for x in (cx - 5, cx + 5): d.line((x, cy - 12, x, cy - 3), fill=FRAME[1], width=2)
        d.polygon([(cx - 12, cy - 13), (cx + 12, cy - 13),
                   (cx + 6, cy - 20), (cx - 5, cy - 20)], fill=pal[2])
        d.line((cx - 12, cy - 13, cx + 12, cy - 13), fill=pal[0], width=2)
        d.line((cx - 5, cy - 20, cx + 6, cy - 20), fill=pal[4], width=2)
        d.line((cx - 13, cy - 13, cx - 16, cy - 16), fill=pal[3], width=2)
        d.line((cx + 13, cy - 13, cx + 16, cy - 16), fill=pal[3], width=2)
        d.line((cx, cy - 21, cx, cy - 25), fill=pal[0])
        d.point((cx + 1, cy - 26), fill=self.accent)
        # Communal East Asian halls carry a plaque and paired lanterns; this
        # is a building-function marker, not a household shrine pasted onto
        # every facade.
        if self.detail_set in ('north-chinese', 'south-chinese', 'japanese', 'korean'):
            d.rectangle((cx - 4, cy - 11, cx + 4, cy - 7), fill='#4a3022', outline='#c29a4a')
            for dx in (-9, 9):
                d.line((cx + dx, cy - 12, cx + dx, cy - 9), fill=FRAME[0])
                d.ellipse((cx + dx - 2, cy - 9, cx + dx + 2, cy - 4), fill=self.accent, outline='#4c2922')

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
        if self.detail_set == 'europe-early-modern' and self.wealth == 2:
            # Separate clay pots are a small but high-value early-modern
            # skyline cue. They share one stack and therefore one smoke point.
            for dx, tall in ((3, 6), (8, 8)):
                d.rectangle((ax + dx, ty - tall, ax + dx + 3, ty - 3), fill='#8f4c36')
                d.line((ax + dx - 1, ty - tall, ax + dx + 4, ty - tall), fill='#c77d56', width=2)
                d.line((ax + dx + 3, ty - tall + 2, ax + dx + 3, ty - 3), fill='#533126')
            self.smoke.append([ax + 10, ty - 10, 'chimney'])
            return
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
            self.courtyard_top(d) if self.courtyard else self.flat_top(d)
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
        self.regional_roof_trim(d, pal, lx, ex, ey, rx, ry, roof.width)
        self.european_roof_trim(d, pal, lx, ex, ey, rx, ry, roof.width)
        self.service_roof_marker(d, pal)
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
