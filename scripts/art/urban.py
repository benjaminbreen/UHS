"""Dimension-driven urban facades. Materials and eligible forms live in content.

One native pixel grid and upper-left light are shared with the original compiler.
The building's ground footprint remains separate from its projected upper floors.
"""
import math
from functools import lru_cache

from PIL import Image, ImageDraw
from art import front_materials as fm
from art import front_solid as solid
from art.buildings import Building, ROOFS
from art.roof_light import course_tone


class UrbanBuilding(Building):
    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.top = recipe['roofDepth'] + 10
        # Infill forms are one bay wide; the door takes the bay, so windows
        # are placed by hand instead of on the shared bay rhythm.
        self.infill = bool(recipe.get('infill'))

    def wall(self):
        super().wall()
        d,b,w=self.d,self.bottom,self.w
        dark,shade,base,light,hi=self.p['wall']
        # A few connected plaster losses establish scale without speckling every bay.
        for i in range(max(2,w//35)):
            x=self.rng.randrange(9,w-23);y=self.rng.randrange(self.top+8,b-12)
            d.polygon([(x,y),(x+4,y),(x+4,y+2),(x+8,y+2),(x+8,y+5),(x+2,y+5),(x+2,y+3),(x,y+3)],fill=shade)
            d.line((x+2,y+6,x+7,y+6),fill=light)

    def flat_roof(self):
        d,w,t=self.d,self.w,self.top
        ink,shade,base,hi=self.p['roof']
        d.rectangle((3,8,w-5,t),fill=ink)
        d.rectangle((5,10,w-8,t-3),fill=base)
        d.rectangle((8,13,w-11,t-7),fill=shade)
        d.rectangle((11,17,w-13,t-9),fill=base)
        d.line((4,8,w-6,8),fill=hi,width=2)
        d.line((4,9,4,t-1),fill=hi)
        d.rectangle((5,t-5,w-7,t),fill=shade)
        d.line((5,t-5,w-7,t-5),fill=hi)
        # Recessed earthen roof, worn in broad quiet patches rather than a blank panel.
        d.rectangle((8,14,11,t-8),fill=ink)
        d.rectangle((11,14,w-12,17),fill=shade)
        for _ in range(max(8,w//7)):
            x=self.rng.randrange(14,w-18);y=self.rng.randrange(19,t-10)
            length=self.rng.randrange(2,7)
            d.line((x,y,x+length,y),fill=shade if self.rng.random()<.65 else hi)
            if self.rng.random()<.3:d.line((x+2,y+1,x+length,y+1),fill=shade)

    def openings(self):
        d, b, t = self.d, self.bottom, self.top
        bays, stories = self.r['bays'], self.r['stories']
        wall = self.p['wall']
        # Upper floors use the same bay rhythm at every orientation. Side/rear
        # entrances are authored separately, never by mirroring the light.
        centers = [round(15 + i * (self.w - 36) / max(1, bays - 1)) for i in range(bays)]
        if self.infill:
            centers = self.infill_centers()
        for floor in range(stories):
            base = b - 7 - floor * 31
            if floor:
                d.line((5, base+3, self.front, base+3), fill=wall[1])
                d.line((5, base+2, self.front, base+2), fill=wall[3])
            for x in centers:
                if floor == 0 and abs(x-self.door_x) < 18 and self.facing == 'south':
                    continue
                self.recess(x-4, base-23, 8, 14)
                if (int(x)+floor+self.r['seed']) % 3 == 0:
                    d.rectangle((x-7,base-24,x-6,base-9),fill='#655b3b')
                    d.line((x-7,base-23,x-7,base-11),fill='#998653')
        if self.facing == 'south':
            self.recess(self.door_x-6,b-29,12,28,True)
            d.line((self.door_x-8,b+2,self.door_x+8,b+2),fill=wall[4])

    def infill_centers(self):
        w = self.w
        if self.facing != 'south':
            return [w // 2]
        if w < 64:
            return []
        return [14 if self.door_x > w // 2 else w - 22]

    def tiled_roof(self):
        d,w,t=self.d,self.w,self.top
        pal=ROOFS[self.r['roofMaterial']]
        # Roof depth is explicit: broad houses have substantial roof planes,
        # taller houses gain wall height instead of stretching the same bitmap.
        roof=[(2,t-2),(9,8),(w-13,8),(w-3,t-2)]
        mask=Image.new('L',self.im.size);ImageDraw.Draw(mask).polygon(roof,fill=255)
        layer=Image.new('RGBA',self.im.size);ld=ImageDraw.Draw(layer)
        ld.rectangle((0,0,w,t),fill=pal[0])
        rows=list(range(9,t,5))
        for row,y in enumerate(rows):
            for col,x in enumerate(range(-2,w+4,6)):
                tone=course_tone(pal,row,len(rows),col)
                ld.rectangle((x,y,x+4,y+4),fill=tone)
                # Curved tile highlight, shaded channel, overlapping lower lip.
                ld.line((x+1,y+1,x+2,y+1),fill=pal[4])
                ld.point((x+3,y+2),fill=pal[3])
                ld.line((x,y+2,x,y+3),fill=pal[3])
                ld.line((x+4,y+1,x+4,y+4),fill=pal[1])
                ld.line((x+1,y+4,x+3,y+4),fill=pal[0])
        self.im.paste(layer,(0,0),mask)
        d.line((9,7,w-13,7),fill=pal[0],width=3)
        for x in range(9,w-13,6):
            d.rectangle((x,5,x+4,7),fill=pal[2]);d.line((x+1,5,x+3,5),fill=pal[4])
        d.line((2,t-2,w-3,t-2),fill=pal[0],width=2)
        d.line((4,t-1,w-5,t-1),fill=pal[3])
        d.rectangle((5,t,self.front,t+4),fill=self.p['wall'][0])
        d.line((6,t+5,self.front,t+5),fill=self.p['wall'][1])

    def attachment(self,kind):
        if kind == 'urban-colonnade':
            d,b,w=self.d,self.bottom,self.w
            dark,shade,base,light,hi=self.p['wall']
            d.rectangle((6,b-42,w-10,b-7),fill=dark)
            d.rectangle((5,b-47,w-9,b-41),fill=light)
            d.line((5,b-48,w-9,b-48),fill=hi,width=2)
            for x in range(12,w-17,23):
                d.rectangle((x,b-39,x+6,b-8),fill=shade)
                d.rectangle((x,b-39,x+3,b-8),fill=light)
                d.line((x+1,b-38,x+1,b-9),fill=hi)
                for y in [b-41,b-9]:
                    d.rectangle((x-2,y,x+8,y+2),fill=light)
                    d.line((x-2,y,x+8,y),fill=hi)
            for row in range(3):
                y=b-5+row*3
                d.rectangle((4-row,y,w-7+row,y+2),fill=shade)
                d.line((4-row,y,w-7+row,y),fill=hi)
            return
        if kind == 'timber-frame' and self.infill:
            # Two corner posts and a lintel beam; the full frame's braces would
            # cross the door on a canvas this narrow.
            d,b,w=self.d,self.bottom,self.w
            for x in [6,w-15]:
                d.rectangle((x,self.top+3,x+3,b-6),fill='#453d30');d.line((x,self.top+4,x,b-7),fill='#8d7350')
            d.line((6,b-33,w-13,b-33),fill='#514431',width=3)
            return
        if kind != 'urban-shop':
            return super().attachment(kind)
        d,b=self.d,self.bottom
        left,right=9,self.w-15
        colors=[('#ac5237','#eed3a0'),('#456c77','#bbd0bd'),('#9b813e','#ead3a0')][self.r['seed']%3]
        d.rectangle((left,b-33,right,b-5),fill='#34382f')
        for i,x in enumerate(range(left,right,7)):
            d.polygon([(x,b-38),(min(x+6,right),b-38),(min(x+7,right+2),b-23),(x-1,b-23)],fill=colors[i%2])
            d.line((x,b-37,min(x+5,right),b-37),fill='#efdbb3')
            d.line((x-1,b-22,min(x+6,right),b-22),fill='#63543b')
        for x in [left-2,right+2]:
            d.rectangle((x,b-24,x+1,b),fill='#473b28');d.line((x,b-22,x,b-1),fill='#b99559')
        d.rectangle((left,b-8,right,b-3),fill='#513e29')
        d.line((left,b-9,right,b-9),fill='#c29a57')
        for x in range(left+3,right-2,9):
            d.rectangle((x,b-17,x+5,b-10),fill='#805533')
            d.rectangle((x+1,b-18,x+4,b-11),fill='#bf8748')
            d.line((x+1,b-18,x+4,b-18),fill='#e3b674')


class InfillBuilding(UrbanBuilding):
    """Small modern facades for irregular urban gaps.

    These are intentionally authored separately from the large urban forms:
    the recipe can vary frontage, sign, roof detail and colorway without
    making a tiny building inherit a mid-rise silhouette.
    """

    GLYPHS = {
        'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
        'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
        'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
        'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'],
        'I': ['111', '010', '010', '010', '111'], 'K': ['101', '101', '110', '101', '101'],
        'L': ['100', '100', '100', '100', '111'], 'M': ['10001', '11011', '10101', '10101', '10101'],
        'N': ['1001', '1101', '1011', '1001', '1001'], 'O': ['010', '101', '101', '101', '010'],
        'P': ['110', '101', '110', '100', '100'], 'R': ['110', '101', '110', '101', '101'],
        'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
        'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'],
        'W': ['10101', '10101', '10101', '11011', '01010'], 'X': ['101', '101', '010', '101', '101'],
        'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
        '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
        '2': ['110', '001', '010', '100', '111'], '3': ['110', '001', '010', '001', '110'],
        '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'],
        '6': ['011', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
        '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '110'],
    }
    COLORWAYS = [
        {'trim': '#a15d4f', 'trimDark': '#5d3f3a', 'light': '#d1ad83', 'sign': '#bb8f4c'},
        {'trim': '#527c82', 'trimDark': '#2f555e', 'light': '#9bb7aa', 'sign': '#b69b58'},
        {'trim': '#786d79', 'trimDark': '#494455', 'light': '#b5a5b3', 'sign': '#b99c62'},
        {'trim': '#6e7b5b', 'trimDark': '#45523e', 'light': '#b2bd89', 'sign': '#b99c58'},
        {'trim': '#9b795c', 'trimDark': '#5f493d', 'light': '#d5b68a', 'sign': '#b96e57'},
        {'trim': '#a37584', 'trimDark': '#624354', 'light': '#d3a7a8', 'sign': '#be9a5f'},
    ]
    WINDOW_COLORS = ['#6e9aa0', '#55778a', '#83a9a4', '#718fa0', '#9bb9ae', '#607782']

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.variant = int(recipe.get('variant', 0)) % len(self.COLORWAYS)
        self.colors = self.COLORWAYS[self.variant]
        self.kind = recipe.get('candidateType', 'shop')
        self.sign_text = recipe.get('sign', '')
        self.body_top = self.top + (10 if recipe.get('roofStyle') in ('gable', 'hip') else 0)
        self.window = self.WINDOW_COLORS[self.variant]
        # Published in the model; the renderer draws the word into it.
        self.sign_band = None
        self.sign_paint = None

    def pixel_text(self, text, x, y, color, scale=1):
        """Draw tiny bitmap lettering; no font rasterizer or antialiasing."""
        cursor = x
        for char in str(text).upper():
            glyph = self.GLYPHS.get(char)
            if glyph is None:
                cursor += 4 * scale
                continue
            for row, bits in enumerate(glyph):
                for col, bit in enumerate(bits):
                    if bit == '1':
                        self.d.rectangle((cursor + col * scale, y + row * scale,
                                          cursor + (col + 1) * scale - 1,
                                          y + (row + 1) * scale - 1), fill=color)
            cursor += (len(glyph[0]) + 1) * scale

    def _text_width(self, text, scale=1):
        return sum((len(self.GLYPHS.get(char.upper(), ['000'])[0]) + 1) * scale for char in str(text)) - scale

    def _window(self, x, y, width=8, height=10):
        d = self.d
        frame = self.colors['trimDark']
        d.rectangle((x - 2, y - 2, x + width + 1, y + height + 1), fill=self.p['wall'][4])
        d.rectangle((x - 1, y - 1, x + width, y + height), fill=frame)
        d.rectangle((x, y, x + width - 1, y + height - 1), fill=self.window)
        d.rectangle((x + 1, y + 1, x + width - 2, y + 2), fill=self.p['wall'][4])
        d.line((x + width // 2, y, x + width // 2, y + height - 1), fill=frame)
        d.line((x + 1, y + height - 2, x + width - 2, y + height - 2), fill=self.p['wall'][1])
        if (x + y + self.variant) % 3 == 0:
            d.line((x + 2, y + 4, x + 2, y + height - 3), fill=self.p['wall'][2])
            d.line((x + width - 3, y + 4, x + width - 3, y + height - 3), fill=self.p['wall'][2])

    def _door(self, x=None, double=False):
        d, b = self.d, self.bottom
        x = self.door_x if x is None else x
        width = 12 if double else 9
        left = x - width // 2
        d.rectangle((left - 2, b - 27, left + width + 1, b + 1), fill=self.p['wall'][4])
        d.rectangle((left, b - 25, left + width - 1, b), fill=self.colors['trimDark'])
        d.rectangle((left + 2, b - 23, left + width - 2, b - 2), fill=self.colors.get('door', '#35454a'))
        d.line((left + width // 2, b - 23, left + width // 2, b - 2), fill=self.colors['trim'])
        d.point((left + width - 3, b - 12), fill='#e1c06b')
        d.rectangle((left - 3, b + 1, left + width + 2, b + 2), fill=self.p['foundation'][1])

    def _storefront(self, y, bottom=None):
        d, w = self.d, self.w
        bottom = y + 18 if bottom is None else bottom
        d.rectangle((5, y - 2, w - 7, bottom + 2), fill=self.colors['trimDark'])
        d.rectangle((7, y, w - 9, bottom), fill='#29444d')
        d.rectangle((9, y + 2, w - 11, bottom - 3), fill=self.window)
        for x in range(14, w - 10, 10):
            d.rectangle((x, y + 1, x + 2, bottom - 2), fill=self.colors['trimDark'])
        d.line((9, y + 3, w - 11, y + 3), fill=self.p['wall'][4])
        d.line((9, bottom - 3, w - 11, bottom - 3), fill=self.colors['trim'])

    def _sign(self, text=None, y=None, fill=None):
        """The board, not the word.

        The lettering is drawn at runtime (`src/render/sign-texture.ts`) so one
        sprite can be Guzman's, a bakery or a cafe, in whatever language the
        place speaks. Baking it here meant one sprite was one word forever.
        The board is drawn full width and its rect is published in the model as
        a `band` shop sign; the renderer centres the word in it.
        """
        if not self.sign_text or self.facing != 'south':
            return
        d, w = self.d, self.w
        sign_w = w - 10
        left = (w - sign_w) // 2
        y = self.body_top + 4 if y is None else y
        fill = fill or self.colors['sign']
        d.rectangle((left - 2, y - 2, left + sign_w + 1, y + 9), fill=self.colors['trimDark'])
        d.rectangle((left, y, left + sign_w - 1, y + 7), fill=fill)
        d.line((left, y, left + sign_w - 1, y), fill=self.colors['light'])
        self.sign_band = [left, y, sign_w, 8]
        self.sign_paint = fill

    def _awning(self, y):
        d, w = self.d, self.w
        left, right = 5, w - 7
        d.rectangle((left, y, right, y + 3), fill=self.colors['trimDark'])
        stripe = [self.colors['light'], self.colors['trim']]
        for i, x in enumerate(range(left + 1, right, 7)):
            d.polygon([(x, y + 1), (min(x + 5, right), y + 1),
                       (min(x + 6, right), y + 8), (x - 1, y + 8)], fill=stripe[i % 2])
        d.line((left - 1, y + 8, right + 1, y + 8), fill=self.colors['trimDark'])

    def _roof(self):
        d, w, t = self.d, self.w, self.top
        roof = ROOFS['grey-tile']
        style = self.r.get('roofStyle', 'flat')
        if style == 'gable':
            d.polygon([(2, self.body_top + 3), (w // 2, 7), (w - 3, self.body_top + 3)], fill=roof[0])
            d.polygon([(7, self.body_top + 1), (w // 2, 11), (w - 8, self.body_top + 1)], fill=roof[2])
            for y in range(14, self.body_top - 1, 5):
                half = max(5, (y - 8) * (w // 2 - 7) // max(1, self.body_top - 8))
                d.line((w // 2 - half, y, w // 2 + half, y), fill=roof[1])
            d.line((w // 2, 7, w - 3, self.body_top + 3), fill=roof[4], width=2)
            d.line((2, self.body_top + 3, w - 3, self.body_top + 3), fill=roof[0], width=2)
        elif style == 'hip':
            d.polygon([(2, self.body_top + 3), (11, 9), (w - 13, 9), (w - 3, self.body_top + 3)], fill=roof[0])
            d.polygon([(8, self.body_top + 1), (14, 12), (w - 16, 12), (w - 8, self.body_top + 1)], fill=roof[2])
            d.line((11, 9, w - 13, 9), fill=roof[4], width=2)
        else:
            d.rectangle((3, 7, w - 5, t + 2), fill=roof[0])
            d.rectangle((6, 10, w - 8, t - 2), fill=roof[2])
            d.line((4, 7, w - 6, 7), fill=roof[4], width=2)
            d.line((5, t - 1, w - 7, t - 1), fill=roof[1])
            for x in range(10, w - 10, 10):
                d.line((x, 14, x + 4, 14), fill=roof[1])
        if self.r.get('roofDetail') == 'hvac':
            x = w - 19
            d.rectangle((x, 15, x + 9, 22), fill='#414d4d')
            d.rectangle((x + 2, 13, x + 7, 16), fill='#73817a')
            d.line((x + 2, 18, x + 7, 18), fill='#a9b299')
        elif self.r.get('roofDetail') == 'solar':
            d.polygon([(w - 24, 19), (w - 9, 14), (w - 7, 22), (w - 22, 26)], fill='#345c72')
            d.line((w - 21, 22, w - 9, 18), fill='#9ec7c6')
            d.line((w - 16, 17, w - 14, 24), fill='#9ec7c6')
        elif self.r.get('roofDetail') == 'vent':
            d.rectangle((w // 2 - 3, 15, w // 2 + 4, 22), fill='#4a514c')
            d.line((w // 2 - 5, 15, w // 2 + 6, 15), fill='#a9b299')

    def _body(self):
        d, w, b = self.d, self.w, self.bottom
        wall = self.p['wall']
        d.rectangle((4, self.body_top, w - 6, b), fill=wall[0])
        d.rectangle((6, self.body_top + 2, w - 9, b - 6), fill=wall[2])
        d.rectangle((6, self.body_top + 2, w - 9, self.body_top + 6), fill=wall[3])
        d.line((5, self.body_top, w - 7, self.body_top), fill=self.colors['trimDark'])
        d.line((5, b - 6, w - 7, b - 6), fill=self.colors['trimDark'])
        if self.r.get('downspout'):
            x = 8 if self.variant % 2 else w - 11
            d.rectangle((x, self.body_top + 2, x + 2, b - 5), fill=self.colors['trimDark'])
            d.point((x + 1, self.body_top + 4), fill=self.colors['light'])
        if self.r.get('siding'):
            for y in range(self.body_top + 10, b - 8, 5):
                d.line((7, y, w - 10, y), fill=wall[1])
                d.line((7, y + 1, w - 10, y + 1), fill=wall[3])
        d.rectangle((5, b - 5, w - 7, b), fill=self.p['foundation'][0])
        d.line((6, b - 5, w - 8, b - 5), fill=self.p['foundation'][2])
        for x in range(8, w - 9, 9):
            d.rectangle((x, b - 4, x + 5, b - 2), fill=self.p['foundation'][1])

    def _home_frontage(self):
        d, w, b = self.d, self.w, self.bottom
        stories = int(self.r.get('stories', 1))
        if stories > 1:
            y = self.body_top + 8
            for x in (10, w - 20):
                self._window(x, y, 9, 10)
            d.line((6, b - 36, w - 8, b - 36), fill=self.colors['trimDark'])
        else:
            y = self.body_top + 12
            for x in (9, w - 19):
                self._window(x, y, 9, 10)
        if self.r.get('garage'):
            left = 7 if self.door_x > w // 2 else w - 25
            d.rectangle((left - 2, b - 26, left + 19, b + 1), fill=self.colors['trimDark'])
            d.rectangle((left, b - 23, left + 16, b - 2), fill='#65716c')
            for y in range(b - 19, b - 3, 5):
                d.line((left + 1, y, left + 15, y), fill='#a8b0a2')
            for x in range(left + 4, left + 15, 5):
                d.line((x, b - 22, x, b - 3), fill='#4e5c5b')
            self._door(self.door_x)
        else:
            self._door(self.door_x, double=self.r.get('doubleDoor', False))
        if self.r.get('porch'):
            y = b - 30
            d.rectangle((self.door_x - 14, y, self.door_x + 14, y + 3), fill=self.colors['trimDark'])
            d.line((self.door_x - 12, y + 4, self.door_x - 12, b - 3), fill=self.colors['trim'])
            d.line((self.door_x + 12, y + 4, self.door_x + 12, b - 3), fill=self.colors['trimDark'])
            d.line((self.door_x - 14, b - 4, self.door_x + 14, b - 4), fill=self.colors['light'])
            d.rectangle((self.door_x - 19, b - 2, self.door_x - 14, b), fill=self.colors['trim'])
            d.rectangle((self.door_x + 14, b - 2, self.door_x + 19, b), fill=self.colors['trim'])

    def _business_frontage(self):
        d, w, b = self.d, self.w, self.bottom
        # The board is hung last: a canopy or an awning drawn after it painted
        # over the top of it, which left the runtime lettering floating on a
        # strip of canopy instead of on a sign.
        store_y = self.body_top + (18 if self.sign_text else 8)
        if self.r.get('awning'):
            self._awning(store_y - 2)
            store_y += 8
        self._storefront(store_y, min(b - 10, store_y + 20))
        if self.r.get('doorSide') == 'left':
            self._door(13)
        elif self.r.get('doorSide') == 'right':
            self._door(w - 17)
        else:
            self._door(self.door_x)
        if self.r.get('canopy'):
            y = self.body_top + 10
            d.rectangle((4, y, w - 6, y + 4), fill=self.colors['trimDark'])
            d.rectangle((6, y - 2, w - 8, y), fill=self.colors['light'])
            for x in (8, w - 12):
                d.rectangle((x, y + 5, x + 2, b - 4), fill=self.colors['trimDark'])
                d.line((x + 1, y + 5, x + 1, b - 4), fill=self.colors['light'])
        if self.r.get('pylon'):
            x = 7 if self.door_x > w // 2 else w - 12
            d.rectangle((x, self.body_top - 3, x + 3, b - 1), fill=self.colors['trimDark'])
            d.rectangle((x - 2, self.body_top - 7, x + 5, self.body_top + 3), fill=self.colors['sign'])
            # Blank panel: the pylon is three characters wide and the word now
            # comes from the runtime, which draws the fascia board instead.
            d.line((x - 1, self.body_top - 5, x + 4, self.body_top - 5),
                   fill=self.colors['light'])
        if self.kind in ('pharmacy', 'clinic'):
            x, y = w - 14, self.body_top + 7
            d.rectangle((x, y, x + 3, y + 10), fill='#e85c55')
            d.rectangle((x - 3, y + 3, x + 6, y + 6), fill='#e85c55')
        if self.kind == 'workshop':
            d.rectangle((6, b - 28, w - 8, b - 10), fill=self.colors['trimDark'])
            d.rectangle((8, b - 25, w - 10, b - 12), fill='#5e716e')
            for y in range(b - 22, b - 11, 4):
                d.line((9, y, w - 11, y), fill='#a7b4a4')
        self._sign()

    def _side_frontage(self):
        d, w, b = self.d, self.w, self.bottom
        x = 9 if self.facing == 'west' else max(12, w - 22)
        self._window(x, self.body_top + 13, 8, 11)
        self._door(self.door_x)
        if self.r.get('roofDetail') == 'hvac':
            d.rectangle((w // 2 - 4, self.body_top + 5, w // 2 + 5, self.body_top + 8), fill=self.colors['trimDark'])

    def render(self):
        self._body()
        self._roof()
        if self.facing == 'south':
            if self.kind == 'home':
                self._home_frontage()
            else:
                self._business_frontage()
        elif self.facing == 'north':
            for x in (10, self.w - 20):
                self._window(x, self.body_top + 12, 9, 10)
        else:
            self._side_frontage()
        # A single hard pixel at the contact line keeps the small silhouette
        # grounded without baking a directional cast shadow into the art.
        self.d.line((6, self.bottom + 1, self.w - 8, self.bottom + 1), fill=(30, 34, 26, 155))
        return self.im


def build_animated_details(sprites):
    """Four native-pixel roof-fan poses for optional quiet building motion."""
    blades = ['#657874', '#82998d', '#a9b9a0']
    for phase in range(4):
        im = Image.new('RGBA', (16, 16))
        d = ImageDraw.Draw(im)
        # A two-blade rotor turns in 45-degree steps; the opaque hub keeps the
        # small overlay legible without needing a baked shadow.
        if phase % 2 == 0:
            d.rectangle((2, 7, 13, 8), fill=blades[0])
            d.rectangle((7, 2, 8, 13), fill=blades[1])
        else:
            for points in [[(3, 4), (7, 8)], [(9, 8), (13, 12)]]:
                d.line(points, fill=blades[0], width=1)
            for points in [[(11, 3), (8, 7)], [(7, 9), (4, 13)]]:
                d.line(points, fill=blades[1], width=1)
        d.rectangle((6, 6, 9, 9), fill='#3f4d4b')
        d.rectangle((7, 7, 8, 8), fill=blades[2])
        sprites[f'animation-roof-fan-{phase}'] = im


def urban_recipes(root, source, bases=None, halls=()):
    """Street forms of the kit's bases, or of `bases` drawn from `source`;
    `halls` are extra bases that also get the civic hall form."""
    import json
    from art.modern import modern_form_allowed, modern_label, modernise
    kit=json.loads((root/'src/content/graphics/urban.json').read_text())
    out={}
    for base in bases or kit['bases']:
        original=source['buildings'][base]
        for form,shape in {**kit['forms'],**kit['civicForms']}.items():
            if 'bases' in shape and base not in shape['bases'] and not (form=='hall' and base in halls):
                continue
            modern_base=base.startswith('modern-')
            if form in ('midrise','office') and not modern_base:
                continue
            # Only the oblique painter can draw a cross wing.
            if shape.get('wing') and not original.get('oblique'):
                continue
            if modern_base and not modern_form_allowed(kit,base,form,original):
                continue
            r={**original,**shape}
            r['wall']=kit.get('wallOverrides',{}).get(base,original['wall'])
            modern=modernise(r,kit,base,form) if modern_base else {}
            fw,fh=r['footprint']
            r.update(canvas=[fw*16,r['roofDepth']+17+r['stories']*31],
                     entrance=[fw//2,fh],opening='door',height=r['stories']*31+24,
                     attachments=([part for part in original['attachments'] if part == 'timber-frame'] + (['urban-colonnade'] if shape.get('colonnade') else ['urban-shop'] if shape.get('shop') else [])),
                     seed=original['seed']+len(form)*19,
                     label={'row':'Street-front house','shop':'Shop and workshop','wide':'Broad courtyard range','tall':'Tall residential house','midrise':'Mid-rise apartment block','office':'Glass office tower','hall':'Public hall','colonnade':'Colonnaded civic hall','cottage':'Cottage','hut':'Hut','stall':'Market stall','inn':'Inn'}[form],
                     description='A procedural urban building: shared street frontage, recessed openings and a rear court. Its form is illustrative, not a surveyed reconstruction.',
                     urban=True,infill=bool(shape.get('infill')),**modern)
            if modern_base:
                r['label']=modern_label(r['modernStyle'],form,r['label'])
            out[f'{base}-urban-{form}']=r
    return out


def build_urban_furniture(sprites):
    """Small market counters share the building palette and remain object sprites."""
    for index,(stripe,light) in enumerate([('#9f5338','#ebd3a4'),('#466d78','#c4d7c6')]):
        im=Image.new('RGBA',(48,44));d=ImageDraw.Draw(im)
        d.rectangle((5,26,42,40),fill='#473c2a')
        d.rectangle((7,29,40,38),fill='#916b3e')
        for x in [7,39]:
            d.rectangle((x,14,x+1,42),fill='#473c2a')
            d.line((x,16,x,40),fill='#ba935b')
        for i,x in enumerate(range(4,43,6)):
            d.polygon([(x,8),(x+5,8),(x+7,21),(x-2,21)],fill=stripe if i%2 else light)
            d.line((x,8,x+4,8),fill='#efdbb3')
            d.line((x-2,22,x+6,22),fill='#695337')
        for i,x in enumerate(range(10,38,8)):
            d.rectangle((x,26,x+5,32),fill='#513f2c')
            d.rectangle((x+1,25,x+4,30),fill=['#be8e49','#a75b37','#71813d'][i%3])
            d.point((x+2,25),fill='#e2ba70')
        d.line((5,33,42,33),fill='#d1a362')
        d.line((6,41,42,41),fill=(30,30,25,130))
        sprites[f'urban-stall-{index}']=im


WALL_H = 40
WALL_FRAME = 28 + WALL_H
GROUND = WALL_FRAME - 16
CAP_TOP = GROUND - WALL_H
CAP_BOT = CAP_TOP + 15
FACE_TOP = CAP_BOT + 1
FOOT = 2


def _wall_style(stone, surface, crenels=None, course=6, block=12, **details):
    r = fm.RAMPS[stone]
    return dict(stone=stone, surface=surface, ramp=(r[7], r[5], r[3], r[2], r[1]),
                crenels=crenels, coursed=surface != 'earth', course=course, block=block, **details)


WALL_STYLES = {
    'masonry': _wall_style('grey-limestone', 'rubble', 'square'),
    'earth': _wall_style('plaster-ochre', 'earth'),
    'palisade': _wall_style('oak', 'stockade'),
    'mudbrick': _wall_style('adobe', 'plaster', 'stepped', 4, 9),
    'brick': _wall_style('lead', 'brick', 'broad', 4, 8),
    'limestone': _wall_style('limestone', 'ashlar', 'pointed', 7, 17),
    'laterite': _wall_style('brick-dark', 'ashlar', course=8, block=14, pitted=True),
    'drystone': _wall_style('granite', 'ashlar', course=3, block=8, chevron=True),
}


@lru_cache(None)
def _fabric(stone, surface, course, block):
    c = fm.C(256, 112)
    r = fm.RAMPS[stone]
    base = r[2] if stone == 'limestone' else r[4] if surface == 'brick' else r[3]
    quiet = [fm.mix(base, col, 0.43) for col in r]
    if surface == 'rubble':
        stone = fm.mix(r[3], fm.RAMPS['granite'][4], .44)
        fieldstone = [fm.mix(stone, granite, .35) for granite in fm.RAMPS['granite']]
        fm.rubble(c, 0, 0, c.w, c.h, fieldstone, [fm.mix(col, stone, .5) for col in quiet])
        fm.ashlar(c, 0, 27, c.w, 4, quiet, course=4, block=13)
    elif surface == 'plaster':
        fm.adobe(c, 0, 0, c.w, c.h, quiet)
    elif surface == 'earth':
        fm.render(c, 0, 0, c.w, c.h, quiet)
        for y in range(9, c.h, 12):
            for x in range(-12, c.w, 23):
                start = x + int(fm.h2(x, y, 91) * 12)
                c.rect(start, y, 6 + int(fm.h2(x, y, 37) * 9), 1, quiet[3])
    elif surface == 'brick':
        fm.brick(c, 0, 0, c.w, c.h, quiet, mortar=quiet)
    else:
        fm.ashlar(c, 0, 0, c.w, c.h, quiet, course, block)
    return c.im


def _face(style, w, h, seed):
    skin = _fabric(style['stone'], style['surface'], style['course'], style['block'])
    x, y = min((seed * 16) % 64, skin.width - w), 8
    im = skin.crop((x, y, x + w, y + h))
    d = ImageDraw.Draw(im)
    dark, shade, body, light, high = style['ramp']
    if style.get('pitted'):
        for yy in range(3, h - 3, 9):
            for xx in range(-6, w, 12):
                k = int(fm.h2(xx + x, yy, 7) * 10)
                d.line((xx + k, yy, xx + k + 1, yy), fill=fm.mix(body, shade, .55))
                d.point((xx + k, yy + 1), fill=fm.mix(body, light, .55))
    if style.get('chevron'):
        for xx in range(w):
            yy = 5 + abs((xx + x) % 8 - 4)
            d.point((xx, yy), fill=shade)
            d.point((xx, yy + 1), fill=light)
    damp = fm.mix(shade, (85, 94, 69), .45) if style['surface'] == 'rubble' else shade
    for xx in range(w):
        u = xx + x
        rise = 2 + round(2 * math.sin(u * math.tau / 64) + fm.h2(u // 5, 0, 19))
        for yy in range(max(0, h - rise), h):
            d.point((xx, yy), fill=fm.mix(im.getpixel((xx, yy)), damp, .6))
    d.line((0, h - 1, w - 1, h - 1), fill=shade)
    return im


def _merlon(d, style, x0, x1, cap, height=6):
    dark, shade, body, light, high = style['ramp']
    width = x1 - x0 + 1
    mid = (width - 1) / 2
    for i in range(width):
        inset = 0
        if style['crenels'] == 'pointed':
            inset = round(3 * abs(i - mid) / max(1, mid))
        elif style['crenels'] == 'stepped':
            edge = min(i, width - 1 - i)
            inset = 4 if edge == 0 else 2 if edge < 3 else 0
        top = cap - height + inset
        x = x0 + i
        d.line((x, top, x, cap + 2), fill=shade if i >= width - 2 else body)
        d.line((x, top, x, top + 1), fill=light if i == width - 1 else high)
        if i == 0:
            d.line((x, top + 2, x, cap + 1), fill=light)
    if style['crenels'] in ('square', 'broad'):
        top = cap - height
        d.line((x0 + 1, top + 2, x1 - 2, top + 2), fill=light)
        d.line((x1 - 1, top + 2, x1 - 1, cap + 1), fill=fm.mix(body, shade, .55))


def _wall_cap(d, style, v, mask, outside):
    dark, shade, body, light, high = style['ramp']
    deck = fm.mix(body, light, .52)
    joint = fm.mix(deck, shade, .40)
    d.rectangle((0, CAP_TOP, 15, CAP_BOT), fill=deck)
    if style['coursed']:
        for row, y in enumerate((CAP_TOP + 3, CAP_TOP + 10)):
            x = (v * 5 + row * 7) % 16
            d.line((0, y, 15, y), fill=fm.mix(deck, joint, .57))
            d.line((x, y + 1, x, y + 5), fill=joint)
    crenels = style['crenels']
    if not mask & 1:
        d.rectangle((0, CAP_TOP - 1, 15, CAP_TOP + 2), fill=body)
        d.line((0, CAP_TOP - 2, 15, CAP_TOP - 2), fill=light)
        d.line((0, CAP_TOP + 3, 15, CAP_TOP + 3), fill=shade)
        if crenels and outside & 1:
            width = 10 if crenels == 'broad' else 8
            _merlon(d, style, 2, 1 + width, CAP_TOP, height=8)
            d.polygon([(3, CAP_TOP + 3), (width + 1, CAP_TOP + 3),
                       (width + 4, CAP_TOP + 7), (7, CAP_TOP + 7)], fill=joint)
    for bit, x in ((8, 0), (2, 12)):
        if mask & bit: continue
        broad = bool(outside & bit)
        edge = x if broad or bit == 8 else 14
        width = 4 if broad else 2
        d.rectangle((edge, CAP_TOP, edge + width - 1, CAP_BOT), fill=light)
        d.line((edge + width - 1, CAP_TOP, edge + width - 1, CAP_BOT), fill=shade)
        d.line((edge, CAP_TOP + 8, edge + width - 1, CAP_TOP + 8), fill=body)
        if broad and crenels:
            # A merlon facing across the street shows its long top and narrow end.
            y = CAP_TOP + 5
            d.rectangle((x, y - 6, x + 3, y + 6), fill=body if bit == 8 else shade)
            d.rectangle((x, y - 6, x + 3, y), fill=light)
            d.line((x, y - 6, x, y), fill=high)
            d.line((x, y + 7, x + 3, y + 7), fill=shade)
            if bit == 8: d.rectangle((4, y + 1, 5, y + 6), fill=joint)
    if not mask & 4:
        d.rectangle((0, CAP_BOT - 3, 15, CAP_BOT), fill=light)
        d.line((0, CAP_BOT - 3, 15, CAP_BOT - 3), fill=high)
        d.line((0, CAP_BOT - 1, 15, CAP_BOT - 1), fill=body)
        d.line((0, CAP_BOT, 15, CAP_BOT), fill=shade)
        if style['coursed']:
            x = (5 + v * 3) % 16
            d.line((x, CAP_BOT - 3, x, CAP_BOT - 1), fill=body)
        if crenels and outside & 4:
            _merlon(d, style, 2, 10 if crenels == 'broad' else 9, CAP_BOT - 3, height=7)


_BARK = [fm.mix(oak, grey, .46) for oak, grey in zip(fm.RAMPS['oak'], fm.RAMPS['grey-limestone'])]


def _stakes(d, left, right, crest, foot, seed):
    x = left
    while x <= right:
        noise = fm.h2(x, 7, seed)
        end = min(right, x + 4 + int(3 * noise))
        if right - end <= 3:
            end = right
        top = crest + int(fm.h2(x, 1, seed) * 4)
        waist = fm.mix(_BARK[3], _BARK[5], noise * .78)
        d.rectangle((x, top + 2, end, foot), fill=waist)
        d.line((end, top + 2, end, foot), fill=_BARK[6])
        d.line((end - 1, top + 3, end - 1, foot), fill=fm.mix(waist, _BARK[6], .48))
        d.line((x, top + 2, x, foot), fill=fm.mix(waist, _BARK[2], .42))
        d.polygon([(x, top + 1), (x + 2, top - 1), (end - 1, top), (end, top + 2),
                   (end - 2, top + 3), (x + 1, top + 2)], fill=_BARK[2])
        d.line((x + 1, top, end - 2, top), fill=_BARK[1])
        for y in range(top + 7, foot - 3, 11):
            flake = fm.h2(x, y, seed)
            if flake < .56:
                dx = x + 1 + int(flake * 4)
                col = fm.mix(waist, _BARK[2] if flake < .25 else _BARK[6], .6)
                d.line((dx, y, dx, min(foot, y + 3 + int(noise * 6))), fill=col)
                d.line((dx + 1, y - 1, dx + 1, y + 2), fill=col)
        if foot - top > 24:
            damp = foot - 2 - int(noise * 4)
            d.rectangle((x + 1, damp, end - 2, foot), fill=fm.mix(waist, _BARK[6], .43))
            d.point((x + 1, damp - 1), fill=fm.mix(waist, _BARK[5], .4))
        x = end + 1


def _pole(d, left, right, y, tie):
    d.rectangle((left, y, right, y + 3), fill=_BARK[4])
    d.line((left, y, right, y), fill=_BARK[3])
    d.line((left, y + 3, right, y + 3), fill=_BARK[6])
    if left < tie < right - 2:
        d.line((tie, y - 1, tie + 1, y + 3), fill=_BARK[2])
        d.line((tie + 2, y, tie + 3, y + 3), fill=_BARK[3])


def _timber_deck(d, left, right, back, front, vertical, seed):
    wood = fm.mix(_BARK[2], fm.RAMPS['pine'][3], .4)
    seam = fm.mix(wood, _BARK[5], .54)
    d.rectangle((left, back, right, front), fill=wood)
    if vertical:
        for x in range(left + 2, right + 1, 5):
            d.line((x, back, x, front), fill=seam)
    else:
        for y in range(back + 3, front + 1, 5):
            d.line((left, y, right, y), fill=seam)
            grain = left + int(fm.h2(y, 1, seed) * (right - left - 4))
            d.line((grain, y - 2, grain + 4, y - 2), fill=fm.mix(wood, seam, .35))
            if (seed + y) % 4 == 0:
                d.line((grain, y - 4, grain, y - 1), fill=seam)
    d.rectangle((left, back, right, back + 2), fill=seam)


def _stockade(mask, v):
    im = Image.new('RGBA', (16, WALL_FRAME))
    d = ImageDraw.Draw(im)
    g = WALL_FRAME - 1
    d.rectangle((0, g - 3, 15, g), fill=(52, 43, 32, 86))
    _stakes(d, 0, 15, CAP_TOP + 2, g - 2, v)
    if not mask & 4:
        _pole(d, 0, 15, FACE_TOP + 11, 5 if v % 2 else -1)
        if v == 1:
            d.polygon([(0, FACE_TOP + 3), (11, FACE_TOP + 14),
                       (11, FACE_TOP + 10), (3, FACE_TOP + 2)], fill=_BARK[4])
    _timber_deck(d, 0, 15, CAP_TOP, CAP_BOT, mask == 5, v)
    if not mask & 1:
        _stakes(d, 0, 15, CAP_TOP - 8, CAP_TOP + 2, v)
        _pole(d, 0, 15, CAP_TOP, -1)
    for bit, x in ((8, 0), (2, 12)):
        if not mask & bit:
            for y in range(CAP_TOP + 1, CAP_BOT + 1, 4):
                _stakes(d, x, x + 3, y - 7, y + 1, v + y)
    if not mask & 4:
        _pole(d, 0, 15, CAP_BOT - 1, 12 if v == 2 else -1)
        if v % 2:
            d.rectangle((2, CAP_BOT - 1, 5, CAP_BOT + 3), fill=_BARK[5])
            d.rectangle((2, CAP_BOT - 1, 4, CAP_BOT + 1), fill=_BARK[2])
    return im


def _wall_tile(style, mask, v, straight=False, reverse=False):
    if style['surface'] == 'stockade':
        return _stockade(mask, v)
    im = Image.new('RGBA', (16, WALL_FRAME))
    foot = 0 if mask & 4 else FOOT
    im.paste(_face(style, 16, WALL_H - foot, v), (0, FACE_TOP))
    d = ImageDraw.Draw(im)
    if foot:
        d.rectangle((0, WALL_FRAME - foot, 15, WALL_FRAME - 1), fill=(43, 40, 38, 76))
    dark, shade, body, light, high = style['ramp']
    if not mask & 4:
        for y, depth in ((FACE_TOP, .85), (FACE_TOP + 1, .65), (FACE_TOP + 2, .30)):
            for x in range(16):
                d.point((x, y), fill=fm.mix(im.getpixel((x, y)), shade, depth))
    if straight and style['surface'] == 'rubble' and v == 0:
        sill = WALL_FRAME - foot - 7
        for x in range(2, 14):
            y = FACE_TOP + 8 + (abs(2 * x - 15) // 4) ** 2
            for yy in range(y + 3, sill):
                depth = .7 if x < 4 or yy < y + 6 else .36
                d.point((x, yy), fill=fm.mix(im.getpixel((x, yy)), shade, depth))
            d.line((x, y, x, y + 2), fill=light if x in (3, 6, 7, 10) else body)
            d.point((x, y + 3), fill=shade)
        d.line((3, sill, 12, sill), fill=light)
        d.rectangle((6, sill - 12, 8, sill - 4), fill=shade)
        d.line((7, sill - 12, 7, sill - 5), fill=dark)
    if straight and v == 2 and style['surface'] in ('rubble', 'plaster'):
        base = WALL_FRAME - foot - 1
        top = FACE_TOP + (9 if style['surface'] == 'rubble' else 3)
        d.polygon([(4, top + 3), (5, top), (9, top), (11, top + 4),
                   (12, base), (3, base)], fill=body)
        d.polygon([(9, top), (11, top + 4), (12, base), (10, base)], fill=shade)
        d.line((4, top + 3, 9, top + 3), fill=light)
        if style['surface'] == 'rubble':
            for yy, left, right in ((top + 8, 5, 9), (base - 12, 3, 11)):
                d.rectangle((left, yy, right, yy + 2), fill=light)
                d.line((left, yy + 3, right, yy + 3), fill=shade)
    if mask == 5: outside = 2 if reverse else 8
    elif mask == 10: outside = 4 if reverse else 1
    else: outside = 0 if reverse else 15 ^ mask
    _wall_cap(d, style, v, mask, outside)
    if mask in (0, 1, 2, 4, 8):
        _wall_pier(d, style)
    return im


def _wall_step(mask, run):
    im = Image.new('RGBA', (16, WALL_FRAME))
    rising = mask in (6, 9)
    # Shear the horizontal curtain through the cell. Only the cell containing
    # the physical lip owns its raised teeth or the face hanging below it.
    for x in range(16):
        back = (0 if mask in (9, 3) else 16) - (x if rising else 15 - x)
        if back == 16:
            continue
        front = back + 15
        start = 0 if back >= 0 else CAP_TOP - back
        stop = WALL_FRAME if front < 16 else CAP_TOP + 16 - back
        strip = run.crop((x, start, x + 1, stop))
        im.paste(strip, (x, start + back))
    return im


def _wall_pier(d, style):
    """A free end stands as a squat pier with a capstone, not a sawn-off run."""
    mortar, shade, body, light, high = style["ramp"]
    top = CAP_TOP - 4
    d.rectangle((1, top, 14, CAP_BOT), fill=light)
    d.rectangle((2, top + 2, 13, CAP_BOT - 2), fill=body)
    d.line((1, top, 14, top), fill=high)
    d.line((1, top, 1, CAP_BOT), fill=high)
    d.line((14, top, 14, CAP_BOT), fill=shade)
    d.line((1, CAP_BOT, 14, CAP_BOT), fill=mortar)


def build_city_walls(sprites):
    build_gatehouses(sprites)
    build_wall_towers(sprites)
    build_wall_stairs(sprites)
    _build_wall_tiles(sprites)
    # Stands in for a wall cell a tower or gate is drawn over, so the cell
    # keeps its place in the circuit without drawing anything.
    sprites["wall-none"] = Image.new("RGBA", (1, 1))


def _build_wall_tiles(sprites):
    for material, style in WALL_STYLES.items():
        for v in range(8):
            reverse = v >= 4
            for mask in range(16):
                if reverse and (mask not in (3, 5, 6, 9, 10, 12) or material == 'palisade'): continue
                sprites[f'wall-{material}-{mask}-{v}'] = _wall_tile(style, mask, v % 4, straight=mask == 10, reverse=reverse)
            if reverse and material == 'palisade': continue
            run = _wall_tile(style, 10, v % 4, reverse=reverse)
            for mask in (3, 6, 9, 12):
                side = run.copy()
                face = side.crop((0, FACE_TOP, 16, WALL_FRAME - FOOT))
                shadow = Image.new('RGBA', face.size, style['ramp'][1])
                side.paste(Image.blend(face, shadow, .38 if mask in (6, 9) else .12), (0, FACE_TOP))
                sprites[f'wall-{material}-{mask}d-{v}'] = _wall_step(mask, side)


# How each circuit's gate is finished: the arch over the passage and what
# crowns the towers.
GATE_STYLES = {
    "masonry": {"arch": "round", "crown": "merlons", "portcullis": True, "flank": "round"},
    "earth": {"arch": "flat", "crown": "toron"},
    "mudbrick": {"arch": "round", "crown": "merlons", "recess": True},
    "brick": {"arch": "round", "crown": "pavilion"},
    "limestone": {"arch": "pointed", "crown": "merlons", "ablaq": True},
    "laterite": {"arch": "corbel", "crown": "prasat"},
    "drystone": {"arch": "flat", "crown": "round"},
}
GATE_H = 168


def _gate_face(im, style, x0, y0, x1, y1, seed):
    im.paste(_face(style, x1 - x0 + 1, y1 - y0 + 1, seed), (x0, y0))
    d = ImageDraw.Draw(im)
    dark, shade, body, light, high = style['ramp']
    for row, y in enumerate(range(y0 + 1, y1 - 2, 7)):
        w = 3 + (row % 2) * 2
        d.rectangle((x0, y, x0 + w, min(y1 - 1, y + 5)), fill=body)
        d.line((x0, y, x0 + w - 1, y), fill=light)
        d.rectangle((x1 - w, y, x1, min(y1 - 1, y + 5)), fill=fm.mix(body, shade, .45))
    d.line((x1, y0, x1, y1), fill=shade)
    d.line((x0, y0, x1, y0), fill=shade)


def _gate_cap(d, style, x0, y0, x1, y1):
    mortar, shade, body, light, high = style["ramp"]
    d.rectangle((x0, y0, x1, y1), fill=light)
    d.rectangle((x0 + 3, y0 + 3, x1 - 3, y1 - 3), fill=fm.mix(body, shade, .35))
    if style['coursed'] and y1 - y0 >= 10:
        for y in range(y0 + 5, y1 - 3, 5):
            d.line((x0 + 4, y, x1 - 4, y), fill=fm.mix(body, shade, .52))
            for x in range(x0 + 7 + ((y - y0) // 5 % 2) * 6, x1 - 4, 13):
                d.line((x, y + 1, x, min(y + 4, y1 - 3)), fill=fm.mix(body, shade, .63))
    d.line((x0 + 3, y0 + 4, x0 + 3, y1 - 4), fill=shade)
    d.line((x0 + 3, y0 + 3, x1 - 3, y0 + 3), fill=shade)
    d.line((x0, y0, x1, y0), fill=high)
    d.line((x0, y1 - 2, x1, y1 - 2), fill=high)
    d.line((x0, y1, x1, y1), fill=shade)


def _gate_crown(d, style, gate, x0, x1, top):
    """What stands on a tower's top, whose far edge is at `top`."""
    mortar, shade, body, light, high = style["ramp"]
    crown = gate["crown"]
    if crown == "merlons":
        x = x0
        while x + 6 <= x1:
            _merlon(d, style, x, x + 6, top + 1)
            x += 12
    elif crown == "toron":
        # Sahel earth gates bristle with the palm-wood beams left in for
        # replastering, and rise to rounded pinnacles.
        for x in (x0 + 2, x1 - 4):
            d.rectangle((x, top - 8, x + 3, top), fill=body)
            d.line((x, top - 8, x + 3, top - 8), fill=light)
    elif crown == "round":
        d.ellipse((x0, top - 4, x1, top + 4), fill=light)
        d.line((x0 + 2, top - 4, x1 - 2, top - 4), fill=high)


def _toron(d, x0, x1, y0, y1, seed):
    """Palm-wood beam ends left in an earth wall, in staggered rows."""
    for j in range((y1 - y0) // 9):
        for i in range((x1 - x0) // 8 + 1):
            x = x0 + 3 + i * 8 + (j % 2) * 4
            y = y0 + 4 + j * 9
            if x + 2 < x1:
                d.line((x, y, x + 2, y), fill="#8a6a44")
                d.line((x, y + 1, x + 2, y + 1), fill="#4e3820")


def _passage(d, style, gate, x0, x1, spring, bottom):
    dark, shade, body, light, high = style['ramp']
    arch = gate['arch']
    span = x1 - x0 + 1
    rise = min(17, span // 4)
    blocks = max(7, span // 6) | 1
    for x in range(x0, x1 + 1):
        t = (2 * (x - x0) + 1) / span - 1
        if arch == 'round':
            head = spring - round(rise * math.sqrt(1 - t * t))
        elif arch == 'pointed':
            head = spring - round((rise + 2) * math.sqrt(1 - abs(t)))
        elif arch == 'corbel':
            head = spring - min(4, (x - x0) // 3, (x1 - x) // 3) * 3
        else:
            head = spring
        course = blocks * (math.asin(t) / math.pi + .5)
        key = int(course) == blocks // 2
        stone = high if key else light
        if gate.get('ablaq') and int(course) % 2:
            stone = fm.RAMPS['sandstone'][4]
        if gate.get('recess'):
            d.line((x, spring - rise - 10, x, head - 6), fill=fm.mix(body, shade, .42))
        if arch == 'flat':
            stone = fm.RAMPS['oak'][4]
        thick = 5 + (2 if key and arch in ('round', 'pointed') else 0)
        d.line((x, head - thick, x, head - 1), fill=stone)
        if arch != 'flat' and course % 1 < .13:
            d.line((x, head - thick + 1, x, head - 2), fill=shade)
        d.point((x, head - thick - 1), fill=body)
        reveal = 4 + round(3 * (1 - t) / 2)
        d.line((x, head, x, head + reveal - 2), fill=shade if t > .15 else fm.mix(shade, dark, .45))
        d.line((x, head + reveal - 1, x, head + reveal), fill=dark)
        d.line((x, head + reveal + 1, x, bottom), fill=(0, 0, 0, 0))
        if gate.get('portcullis') and (x - x0) % 7 in (2, 3):
            d.line((x, head + reveal, x, head + reveal + 3 + (x % 7 == 2)), fill=fm.RAMPS['oak'][6])
    for x in (x0, x1 - 2):
        d.rectangle((x, spring + 1, x + 2, bottom), fill=shade)
        d.line((x + 2, spring + 3, x + 2, bottom), fill=dark)


def _pavilion(im, x0, x1, base):
    from art.front_sinitic import Hall, RED, GREEN, STONE, DARK_TIMBER
    width = x1 - x0 - 8
    height = 23 if width >= 40 else 16
    hall = Hall(dict(W=width, form='hip', curve=2, rise=min(22, width // 2),
                     ridge='upturn', wall_h=height, plinth=0))
    hall.over = 5
    c, left, foot = hall.c, hall.x0, hall.base
    eave = foot - height
    c.rect(left, eave + 5, width, height - 4, DARK_TIMBER[6])
    bays = max(2, round(width / 18))
    for k in range(bays + 1):
        x = left + round(k * (width - 3) / bays)
        if k < bays and height > 16:
            end = left + round((k + 1) * (width - 3) / bays) - 2
            c.rect(x + 4, foot - 12, end - x - 4, 8, RED[5])
            for bar in range(x + 5, end, 4):
                c.rect(bar, foot - 12, 1, 7, RED[3])
            c.rect(x + 4, foot - 10, end - x - 4, 1, RED[3])
        c.rect(x, eave + 5, 3, height - 5, RED[3])
        c.rect(x, eave + 5, 1, height - 5, RED[2])
        c.rect(x - 1, eave + 8, 5, 2, GREEN[3])
        c.rect(x - 1, foot - 2, 5, 2, STONE[2])
    c.rect(left, foot - 5, width, 2, RED[3])
    hall.roof(eave)
    im.alpha_composite(c.im, (x0 + 4 - left, base - foot))


def _side_gate(sprites, material, style, gate):
    dark, shade, body, light, high = style['ramp']
    for end in ('back', 'front'):
        pier = Image.new('RGBA', (76, 128))
        d = ImageDraw.Draw(pier)
        cx, foot, head = 38, 126, 54
        if gate.get('flank') == 'round' or gate['crown'] == 'round':
            _tower_round(pier, style, 32, cx, foot, 70, 22, 'round')
        else:
            _gate_face(pier, style, cx - 19, head, cx + 18, foot, 32)
            _gate_cap(d, style, cx - 20, head - 13, cx + 19, head)
            _gate_crown(d, style, gate, cx - 18, cx + 17, head - 13)
            _arrow_loop(d, style, cx, head + 13)
            if gate['crown'] == 'toron':
                _toron(d, cx - 18, cx + 18, head + 2, foot - 4, 1)
            elif gate['crown'] == 'pavilion':
                _pavilion(pier, cx - 20, cx + 19, head - 6)
            elif gate['crown'] == 'prasat':
                from art.front_sacred_seasia import corncob, SAND_GREY
                crown = fm.C(76, 128)
                corncob(crown, cx, head - 6, 23, 3, SAND_GREY, 7)
                pier.alpha_composite(crown.im)
        pier.info['trim'] = True
        sprites[f'gate-{material}-pier-{end}'] = pier
    for n in range(3, 12):
        for bay in range(n):
            im = Image.new('RGBA', (76, 106))
            d = ImageDraw.Draw(im)
            def section(j):
                u = (bay * 16 + j + .5) / (16 * n)
                return 23, 52, 90 + j, u
            for j in range(16):
                l, r, foot, u = section(j)
                arch = gate['arch']
                curve = math.sqrt(1 - (2 * u - 1) ** 2) if arch == 'round' else 1 - abs(2 * u - 1)
                opening = 36 + round(curve * 26) if arch != 'flat' else 53
                if arch == 'corbel': opening = opening // 4 * 4
                floor, soffit = foot - 74, foot - opening
                joint = int(13 * u) % 2
                for edge, sign in ((l, 1), (r, -1)):
                    x0, x1 = sorted((edge, edge + sign * 5))
                    d.rectangle((x0, floor, x1, soffit), fill=shade)
                    rim = fm.RAMPS['oak'][4] if arch == 'flat' else (light if joint else body)
                    if gate.get('ablaq') and joint: rim = fm.RAMPS['sandstone'][4]
                    d.line((edge, floor, edge, soffit - 7), fill=body if sign > 0 else shade)
                    d.line((edge, soffit - 6, edge, soffit - 2), fill=rim)
                    d.line((x0, soffit, x1, soffit), fill=dark)
            for j in range(16):
                l, r, foot, u = section(j)
                y = foot - 74
                d.line((l, y, r, y), fill=body)
                if j % 8 == 0: d.line((l + 2, y, r - 2, y), fill=fm.mix(body, shade, .55))
                for x in range(l + 5 + (j // 8 % 2) * 7, r - 3, 14):
                    d.point((x, y), fill=fm.mix(body, shade, .5))
                for x in (l, r - 3):
                    d.line((x, y - 3, x + 3, y - 3), fill=high if x == l else light)
                    d.line((x + 3, y - 2, x + 3, y), fill=shade)
            if style['crenels']:
                for j in (4, 13):
                    l, r, foot, _ = section(j)
                    for x in (l, r - 4):
                        _merlon(d, style, x, x + 4, foot - 76, height=5)
            im.info['trim'] = True
            sprites[f'gate-{material}-side-{n}-{bay}'] = im


def build_gatehouses(sprites):
    """Each circuit's gate, as one sprite over a gap of n cells and the wall
    cell either side, or a depth-sorted wall walk between two piers."""
    for material, gate in GATE_STYLES.items():
        style = WALL_STYLES[material]
        mortar, shade, body, light, high = style["ramp"]
        _side_gate(sprites, material, style, gate)
        for n in range(3, 12):
            # Overhang goes outside the flank cells to keep the entire gap clear.
            pavilion = gate['crown'] == 'pavilion'
            out = 18 if gate.get('flank') == 'round' or pavilion else 12
            w = (n + 2) * 16 + 2 * out
            tw = 16 + out
            im = Image.new("RGBA", (w, GATE_H))
            d = ImageDraw.Draw(im)
            g = GATE_H - 1
            # The raised portcullis must clear the 37px adult at both jambs.
            span_face, span_cap = 70, 12
            tower_face, tower_cap = 77, 14
            d.rectangle((0, g - 1, w - 1, g), fill=(24, 26, 20, 110))
            sx0, sx1 = (4, w - 5) if pavilion else (tw - 2, w - tw + 1)
            _gate_cap(d, style, sx0, g - span_face - span_cap, sx1, g - span_face)
            _gate_face(im, style, sx0, g - span_face, sx1, g - 1, n)
            _passage(d, style, gate, tw, w - tw - 1, g - (48 if pavilion else 52), g)
            if pavilion:
                for edge, sign in ((sx0, -1), (sx1, 1)):
                    d.polygon([(edge, g - span_face), (edge + 4 * sign, g), (edge, g)],
                              fill=body if sign < 0 else shade)
                d.rectangle((sx0, g - span_face, sx1, g - span_face + 2), fill=shade)
                for x in range(sx0 + 3, sx1 - 4, 9):
                    d.line((x, g - span_face + 2, x + 4, g - span_face + 2), fill=body)
                for x in (sx0 + 4, sx1 - 10):
                    _merlon(d, style, x, x + 6, g - span_face - span_cap + 2, height=5)
                _pavilion(im, sx0 + 13, sx1 - 13, g - span_face - span_cap + 6)
            elif gate["crown"] == "prasat":
                from art.front_sacred_seasia import corncob, SAND_GREY
                crown = fm.C(w, GATE_H)
                corncob(crown, w // 2, g - span_face - span_cap + 5, 29, 4, SAND_GREY, 7)
                im.alpha_composite(crown.im)
            elif gate["crown"] == "merlons":
                _gate_crown(d, style, gate, sx0 + 2, sx1 - 2, g - span_face - span_cap)
            if gate["crown"] == "toron":
                _toron(d, sx0, sx1, g - span_face, g - 56, 7)
            for tx in (() if pavilion else (0, w - tw)):
                top = g - tower_face - tower_cap
                if gate.get('flank') == 'round':
                    _tower_round(im, style, n + tx, tx + tw / 2, g - 1, tower_face, tw / 2, 'round')
                    continue
                _gate_cap(d, style, tx, top, tx + tw - 1, g - tower_face)
                _gate_face(im, style, tx, g - tower_face, tx + tw - 1, g - 1, tx + n)
                _gate_crown(d, style, gate, tx + 2, tx + tw - 3, top)
                if gate["crown"] == "toron":
                    _toron(d, tx, tx + tw - 1, g - tower_face, g - 4, tx)
                _arrow_loop(d, style, tx + tw // 2, g - tower_face + 11)
            sprites[f"gate-{material}-{n}"] = im


# Three walkable cells rise to WALL_H, four treads per cell.
STAIR_FRAME = 16 + WALL_H + 4


def _stair(style, art, step):
    dark, shade, body, light, high = style['ramp']
    im = Image.new('RGBA', (16, STAIR_FRAME))
    d = ImageDraw.Draw(im)
    g = STAIR_FRAME - 1
    heights = [round(WALL_H * (4 * (step - 1) + i) / 12) for i in range(5)]
    timber = style['surface'] == 'stockade'
    if timber:
        shade, body, light, high = _BARK[6], _BARK[4], _BARK[3], _BARK[2]
    if art == 'north':
        if timber:
            for x in (1, 12):
                d.rectangle((x, g - 15 - heights[-1], x + 2, g - 15), fill=body)
        for i in reversed(range(4)):
            h = heights[i + 1]
            front = g - 4 * i - h
            d.rectangle((0, front - 3, 15, front), fill=light)
            d.line((1, front, 14, front), fill=high)
            bottom = front + 2 if timber else g - 4 * i
            d.rectangle((0, front + 1, 15, bottom), fill=shade)
            d.line((1, front + 1, 14, front + 1), fill=body)
    else:
        if timber:
            x = 13 if art == 'east' else 1
            for y in (g - 13, g - 1):
                d.rectangle((x, y - heights[-1] + 1, x + 2, y), fill=body)
                d.line((x, y - heights[-1] + 1, x, y), fill=light)
                low, tall = (0, 15) if art == 'east' else (15, 0)
                d.line((low, y - heights[0] + 4, tall, y - heights[-1] + 4), fill=shade, width=3)
                d.line((low, y - heights[0] + 3, tall, y - heights[-1] + 3), fill=body)
        else:
            masonry = _face(style, 16, heights[-1], step)
        for i, h in enumerate(heights[1:]):
            x = i * 4 if art == 'east' else 12 - i * 4
            top, front = g - 15 - h, g - h
            if timber:
                d.rectangle((x, front + 1, x + 3, front + 3), fill=shade)
                d.line((x, front + 1, x + 3, front + 1), fill=body)
            else:
                im.paste(masonry.crop((x, heights[-1] - h, x + 4, heights[-1])), (x, front + 1))
            d.rectangle((x, top, x + 3, front), fill=light)
            lip = x if art == 'east' else x + 3
            d.line((lip, top, lip, front), fill=high if art == 'east' else body)
            d.line((x, front + 1, x + 3, front + 1), fill=shade)
            inside = x + 3 if art == 'east' else x
            d.line((inside, top, inside, front - 1), fill=fm.mix(body, shade, .35))
    return im


def build_wall_stairs(sprites):
    """Frames are stair-{material}-{art}-{step}, and the top step also names
    the side it leads onto the wall: stair-masonry-east-3n."""
    for material, style in WALL_STYLES.items():
        for art in ("east", "west", "north"):
            for step in (1, 2, 3):
                im = _stair(style, art, step)
                sprites[f"stair-{material}-{art}-{step}"] = im
                if step == 3:
                    for onto in "new":
                        sprites[f"stair-{material}-{art}-{step}{onto}"] = im


# Tower shapes per circuit: a is the common one, b a second form seen along
# the same wall, c the grander tower that marks a turn.
TOWER_SHAPES = {
    "masonry": ("round", "square", "cone"),
    "earth": ("sahel", "sahel", "sahel"),
    "palisade": ("bastion", "bastion", "bastion"),
    "mudbrick": ("square", "round", "square"),
    "brick": ("square", "square", "pavilion"),
    "limestone": ("square", "round", "round"),
    "laterite": ("square", "square", "square"),
    "drystone": ("round", "round", "round"),
}
TOWER_FACE, TOWER_TOP = WALL_H + 14, 16
TOWER_W, TOWER_H = 32, TOWER_FACE + TOWER_TOP + 30


def _arrow_loop(d, style, x, y):
    dark, shade, body, light, high = style['ramp']
    d.polygon([(x - 3, y), (x, y - 3), (x + 3, y - 1), (x + 3, y + 8),
               (x - 3, y + 8)], fill=body)
    d.line((x - 3, y - 1, x - 1, y - 3), fill=light)
    d.polygon([(x - 1, y + 1), (x, y - 1), (x + 1, y), (x + 2, y + 7),
               (x - 1, y + 7)], fill=shade)
    d.line((x, y, x, y + 7), fill=dark)
    d.line((x - 2, y + 8, x + 2, y + 8), fill=light)
    d.line((x - 1, y + 9, x + 3, y + 9), fill=shade)


def _tower_square(im, style, seed):
    d = ImageDraw.Draw(im)
    dark, shade, body, light, high = style['ramp']
    g = TOWER_H - 2
    ft = g - TOWER_FACE
    tt = ft - TOWER_TOP
    x0, x1 = 1, TOWER_W
    _gate_face(im, style, x0 + 2, ft, x1 - 2, g, seed)
    _gate_face(im, style, x0, g - 8, x1, g - 1, seed)
    d.line((x0 + 1, g - 9, x1 - 1, g - 9), fill=light)
    d.line((x0, g, x1, g), fill=shade)
    d.rectangle((x0 + 2, ft, x1 - 2, ft + 4), fill=shade)
    for x in range(x0 + 2, x1 - 2, 8):
        d.polygon([(x, ft), (x + 5, ft), (x + 4, ft + 6), (x + 2, ft + 7)], fill=shade)
        d.rectangle((x, ft + 1, x + 3, ft + 3), fill=light)
        d.line((x + 1, ft + 4, x + 3, ft + 4), fill=body)
    _gate_cap(d, style, x0, tt, x1, ft)
    if style['crenels']:
        for x in (x0 + 1, x0 + 13, x1 - 6):
            _merlon(d, style, x, x + 5, tt)
        for x in (x0, x1 - 3):
            _merlon(d, style, x, x + 3, tt + 8, height=6)
        for x in (x0, x1 - 6):
            _merlon(d, style, x, x + 6, ft - 2, height=5)
    if style['surface'] == 'rubble':
        d.line((x0 + 1, ft + 9, x1 - 1, ft + 9), fill=light)
        d.line((x0 + 2, ft + 11, x1 - 2, ft + 11), fill=shade)
    _arrow_loop(d, style, TOWER_W // 2, ft + 17)


def _tower_bastion(d, seed):
    g = TOWER_H - 2
    ft = g - TOWER_FACE
    back = ft - TOWER_TOP
    d.rectangle((2, g - 3, TOWER_W - 1, g + 1), fill=(49, 42, 34, 85))
    _stakes(d, 5, TOWER_W - 4, ft - 4, g - 1, seed)
    d.rectangle((5, ft + 3, TOWER_W - 4, ft + 9), fill=_BARK[6])
    _pole(d, 5, TOWER_W - 4, ft + 21, 10)
    for x in (4, TOWER_W - 8):
        _stakes(d, x, x + 4, ft - 3, g, seed + x)
    for end, heel in ((2, 9), (TOWER_W - 1, TOWER_W - 8)):
        d.line((end, ft + 5, heel, ft + 16), fill=_BARK[6], width=4)
        d.line((end - 1, ft + 5, heel - 1, ft + 14), fill=_BARK[3], width=2)
    _timber_deck(d, 1, TOWER_W, back, ft, False, seed)
    _stakes(d, 1, TOWER_W, back - 6, back + 3, seed + 3)
    for x in (1, TOWER_W - 4):
        for y in range(back + 4, ft + 1, 5):
            _stakes(d, x, x + 4, y - 7, y + 1, seed + y)
    for x in (1, TOWER_W - 5):
        _stakes(d, x, x + 5, ft - 12, ft + 4, seed + x)
    _pole(d, 1, TOWER_W, ft - 8, 4)
    _pole(d, 0, TOWER_W + 1, ft + 1, TOWER_W - 5)
    for x in (4, TOWER_W - 7):
        d.rectangle((x, ft + 4, x + 4, ft + 7), fill=_BARK[5])
        d.rectangle((x, ft + 4, x + 3, ft + 6), fill=_BARK[2])
        d.point((x + 1, ft + 5), fill=_BARK[3])


def _tower_round(im, style, seed, cx, ground, height, radius, crown):
    stone = fm.RAMPS[style['stone']]
    c = fm.C(im.width, im.height)
    by = ground - math.ceil(radius * solid.K)
    skin = _face(style, 96, height, seed)
    dressed = _fabric(style['stone'], 'ashlar', 6, 12) if style['surface'] == 'rubble' else None
    belt = height - 33
    def surface(x, y, z, tone):
        if z < 2 or height - 11 < z < height - 8:
            return stone[min(7, tone + 1)]
        if z > height - 8:
            return stone[min(7, tone + int(height - 5 < z < height - 3))]
        u = int((math.atan2(y, x) / math.tau + .5) * 96) % 96
        if 8 < z < 10:
            return stone[max(2, tone - 1)]
        v = height - 1 - int(z)
        if dressed and belt - 2 < z < belt + 2:
            return stone[min(7, tone + 1) if z < belt else max(1, tone - 1)]
        if dressed and z > belt:
            texel = dressed.getpixel((u + seed % 16, v))
            return fm.mix(texel, stone[tone], .44 if tone < 5 else .66)
        texel = skin.getpixel((u, v))
        return fm.mix(texel, stone[tone], .59 if tone < 5 else .77)
    profile = [(0, radius), (3, radius), (9, radius - 1), (11, radius - 3),
               *([(belt - 2, radius - 3), (belt, radius - 1.5), (belt + 2, radius - 3)] if dressed else []),
               (height - 11, radius - 3), (height - 7, radius),
               (height - 3, radius - .5), (height - 2, radius), (height, radius)]
    solid.lathe(c, cx, by, profile, stone, hollow=(radius - 3, height - 5),
                fill=(height - 4.8, [stone[5]] * 3 + [stone[4]] * 5), inside=stone, surface=surface)
    deck = by - height
    d = ImageDraw.Draw(c.im)
    _arrow_loop(d, style, round(cx - radius * .24), deck + 21)
    if dressed and height > TOWER_FACE:
        _arrow_loop(d, style, round(cx + radius * .31), deck + height - 24)
    if crown == 'cone':
        slate = [fm.mix(col, fm.RAMPS['lead'][6], .46) for col in fm.RAMPS['slate']]
        def tile(x, y, z, tone):
            course = int(z) // 4
            joint = int(math.atan2(y, x) / math.tau * 90 + course * 3) % 7
            return slate[min(7, tone + 1 + int(int(z) % 4 == 0 or joint == 0))]
        solid.lathe(c, cx, deck, [(0, radius), (2, radius + .8), (25, 1)], slate, surface=tile)
        d.line((cx, deck - 28, cx, deck - 25), fill=slate[6])
        d.point((cx, deck - 29), fill=fm.RAMPS['oak'][2])
    elif style['crenels']:
        for a in sorted((k * math.tau / 8 + math.pi / 8 for k in range(8)), key=math.sin):
            x = round(cx + (radius - 2) * math.cos(a))
            y = round(deck + (radius - 2) * solid.K * math.sin(a))
            half = 2 if abs(math.cos(a)) > .8 else 3
            _merlon(d, style, x - half, x + half, y, height=5)
    im.alpha_composite(c.im)


def _tower_sahel(d, style):
    """A Sahelian earth tower: battered sides narrowing to a rounded crown,
    smoothed by replastering, bristling with toron."""
    mortar, shade, body, light, high = style["ramp"]
    g = TOWER_H - 1
    top = g - TOWER_FACE - 18
    clay = fm.RAMPS[style['stone']]
    for y in range(top, g + 1):
        k = (y - top) / (g - top)
        half = 9 + 6 * k
        if y < top + 7:
            # The crown rounds over.
            half = 9 * (1 - ((top + 7 - y) / 7) ** 2) ** 0.5
        cx = TOWER_W / 2
        for x in range(int(cx - half), int(cx + half) + 1):
            t = (x + 0.5 - cx) / max(half, 1)
            col = clay[2 if t < -.53 else 3 if t < .17 else 4 if t < .7 else 5]
            if y < top + 7 and t < 0.2 and y < top + 3:
                col = high
            if y > g - 3 - round(1.5 * math.sin(x / 3)):
                col = fm.mix(col, shade, .58)
            d.point((x, y), fill=col)
    for j, y in enumerate(range(top + 11, g - 5, 12)):
        k = (y - top) / (g - top)
        half = 9 + 6 * k
        for x in range(int(TOWER_W / 2 - half) + 2 + (j % 2) * 3, int(TOWER_W / 2 + half) - 2, 6):
            d.line((x + 1, y + 1, x + 3, y + 3), fill=shade)
            d.line((x - 1, y, x + 1, y), fill=fm.RAMPS['oak'][3])
            d.line((x, y + 1, x + 2, y + 1), fill=fm.RAMPS['oak'][5])
    d.rectangle((TOWER_W // 2 - 1, g - 22, TOWER_W // 2, g - 15), fill="#2b2420")
    d.line((int(TOWER_W / 2 - 15), g, int(TOWER_W / 2 + 15), g), fill=mortar)


def build_wall_towers(sprites):
    """Towers for each circuit, standing on a wall cell or astride a jog.
    A little taller than the wall, so a run reads as curtain and towers."""
    for material, style in WALL_STYLES.items():
        for variant, shape in zip("abc", TOWER_SHAPES[material]):
            im = Image.new("RGBA", (TOWER_W + 2, TOWER_H))
            d = ImageDraw.Draw(im)
            seed = ord(variant)
            if shape in ("square", "pavilion"):
                _tower_square(im, style, seed)
                if shape == "pavilion":
                    _pavilion(im, 1, TOWER_W - 2, TOWER_H - 1 - TOWER_FACE - 6)
            elif shape == "sahel":
                _tower_sahel(d, style)
            elif shape == "bastion":
                _tower_bastion(d, seed)
            else:
                _tower_round(im, style, seed, (TOWER_W + 2) / 2, TOWER_H - 1,
                             TOWER_FACE, TOWER_W / 2, shape)
            sprites[f"tower-{material}-{variant}"] = im


def build_square_furniture(sprites):
    """Ornaments for a public square. Recipes live in art/square.py; content
    decides which a place and date gets."""
    from art.square import build_square, build_altar
    build_square(sprites)
    build_altar(sprites)

    im = Image.new("RGBA", (32, 32)); d = ImageDraw.Draw(im)
    d.ellipse((3, 24, 28, 31), fill=(39, 44, 32, 70))
    d.rectangle((5, 18, 26, 28), fill="#5b4a33")
    d.rectangle((6, 17, 25, 25), fill="#8a6c45")
    for x in range(8, 25, 5):
        d.rectangle((x, 19, x + 2, 24), fill="#b0894f")
    for x in [6, 25]:
        d.rectangle((x, 10, x + 1, 27), fill="#4b3d2b")
    d.polygon([(2, 12), (15, 5), (29, 12), (29, 14), (2, 14)], fill="#7a3b2c")
    d.polygon([(4, 12), (15, 6), (27, 12)], fill="#a8543a")
    d.line((2, 14, 29, 14), fill="#59291f")
    sprites["kiosk"] = im
