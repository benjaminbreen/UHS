"""Dimension-driven urban facades. Materials and eligible forms live in content.

One native pixel grid and upper-left light are shared with the original compiler.
The building's ground footprint remains separate from its projected upper floors.
"""
from PIL import Image, ImageDraw
from art.buildings import Building, ROOFS


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
        for row,y in enumerate(range(9,t,5)):
            for col,x in enumerate(range(-2,w+4,6)):
                tone=pal[2] if self.rng.random()<.84 else pal[1]
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
        text = self.sign_text if text is None else text
        if not text or self.facing != 'south':
            return
        d, w = self.d, self.w
        scale = 1
        width = self._text_width(text, scale)
        sign_w = min(w - 10, width + 8)
        left = (w - sign_w) // 2
        y = self.body_top + 4 if y is None else y
        fill = fill or self.colors['sign']
        d.rectangle((left - 2, y - 2, left + sign_w + 1, y + 9), fill=self.colors['trimDark'])
        d.rectangle((left, y, left + sign_w - 1, y + 7), fill=fill)
        self.pixel_text(text, left + (sign_w - width) // 2, y + 1, '#fff0bd', scale)

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
        self._sign()
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
            sign = self.sign_text or 'OPEN'
            if len(sign) <= 3:
                self.pixel_text(sign, x - 1, self.body_top - 5, '#fff0bd')
        if self.kind in ('pharmacy', 'clinic'):
            x, y = w - 14, self.body_top + 7
            d.rectangle((x, y, x + 3, y + 10), fill='#e85c55')
            d.rectangle((x - 3, y + 3, x + 6, y + 6), fill='#e85c55')
        if self.kind == 'workshop':
            d.rectangle((6, b - 28, w - 8, b - 10), fill=self.colors['trimDark'])
            d.rectangle((8, b - 25, w - 10, b - 12), fill='#5e716e')
            for y in range(b - 22, b - 11, 4):
                d.line((9, y, w - 11, y), fill='#a7b4a4')

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


def urban_recipes(root, source):
    import json
    kit=json.loads((root/'src/content/graphics/urban.json').read_text())
    out={}
    for base in kit['bases']:
        original=source['buildings'][base]
        for form,shape in {**kit['forms'],**kit['civicForms']}.items():
            if 'bases' in shape and base not in shape['bases']:
                continue
            if form in ('midrise','office') and not base.startswith('modern-'):
                continue
            r={**original,**shape}
            r['wall']=kit.get('wallOverrides',{}).get(base,original['wall'])
            fw,fh=r['footprint']
            r.update(canvas=[fw*16,r['roofDepth']+17+r['stories']*31],
                     entrance=[fw//2,fh],opening='door',height=r['stories']*31+24,
                     attachments=([part for part in original['attachments'] if part == 'timber-frame'] + (['urban-colonnade'] if shape.get('colonnade') else ['urban-shop'] if shape.get('shop') else [])),
                     seed=original['seed']+len(form)*19,
                     label={'row':'Street-front house','shop':'Shop and workshop','wide':'Broad courtyard range','tall':'Tall residential house','midrise':'Mid-rise apartment block','office':'Glass office tower','hall':'Public hall','colonnade':'Colonnaded civic hall','cottage':'Cottage','hut':'Hut','stall':'Market stall'}[form],
                     description='A procedural urban building: shared street frontage, recessed openings and a rear court. Its form is illustrative, not a surveyed reconstruction.',
                     urban=True,infill=bool(shape.get('infill')))
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


def build_city_walls(sprites):
    """Defensive circuits as tiling wall segments, drawn once per perimeter cell.

    Two materials only, because two is what the content table distinguishes: a
    coursed masonry curtain and a battered earth rampart. Each is 16 wide so it
    tiles along a cell edge, and taller than a cell so it reads as an obstacle
    rather than as ground. Corner turrets and gate jambs close the silhouette;
    the opening itself is a gap in the run, not a sprite.
    """
    from PIL import ImageOps
    for material, ramp, cap in [
        ("masonry", ["#6b6857", "#8e8a74", "#a9a48b", "#c0baa0"], "#4f4d41"),
        ("earth", ["#7d6440", "#9a7d52", "#b39468", "#c9ab7f"], "#5d4a30"),
    ]:
        dark, mid, light, top = ramp
        for kind in ["run", "corner", "jamb"]:
            im = Image.new("RGBA", (16, 32))
            d = ImageDraw.Draw(im)
            d.ellipse((0, 26, 15, 31), fill=(39, 44, 32, 70))
            batter = material == "earth"
            for row in range(8, 30):
                # An earth rampart leans back to its base. The taper is shading,
                # not silhouette: tapering the sprite would open a seam between
                # every pair of segments in the run.
                d.line((0, row, 15, row), fill=mid)
                if batter and row > 10:
                    d.point((0, row), fill=light)
                    d.point((15, row), fill=dark)
            if batter:
                # Weathered gullies down the face, not courses.
                for x, start in [(4, 12), (9, 10), (12, 15)]:
                    d.line((x, start, x, 29), fill=dark)
            else:
                for row in range(11, 30, 5):
                    d.line((0, row, 15, row), fill=dark)
                    for x in range(2 if row % 10 else 7, 16, 10):
                        d.line((x, row, x, min(row + 4, 29)), fill=dark)
            # The crest runs flat across the whole circuit; insetting it here
            # would scallop the top edge once per cell.
            d.line((0, 8, 15, 8), fill=light)
            d.line((0, 9, 15, 9), fill=top)
            if kind == "corner":
                # A turret breaks the run so a right angle does not read as a seam.
                d.rectangle((2, 3, 13, 29), fill=mid)
                d.rectangle((2, 3, 13, 4), fill=light)
                for x in range(2, 14, 4):
                    d.rectangle((x, 0, x + 1, 3), fill=mid)
                d.line((2, 3, 2, 29), fill=light)
                d.line((13, 3, 13, 29), fill=cap)
            elif kind == "jamb":
                d.rectangle((5, 5, 15, 29), fill=mid)
                d.rectangle((5, 5, 15, 6), fill=light)
                d.line((5, 6, 5, 29), fill=cap)
            elif not batter:
                for x in range(1, 15, 5):
                    d.rectangle((x, 5, x + 2, 9), fill=mid)
                    d.line((x, 5, x + 2, 5), fill=light)
            d.line((0, 29, 15, 29), fill=cap)
            sprites[f"wall-{material}-{kind}"] = im
            if kind == "jamb":
                sprites[f"wall-{material}-jamb-left"] = ImageOps.mirror(im)


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
