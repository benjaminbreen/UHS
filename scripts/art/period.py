"""Eighteenth- and nineteenth-century street facades: Georgian and Regency
terraces, brownstones, tenements, Victorian shops, and their East and South
Asian contemporaries. Recipes and palettes live in period.json; this file
only knows how to draw a wall texture, a window type, a door type and a roof.

Same native grid and upper-left light as the other compilers. Story pitch is
26px, a little tighter than the urban kit, so a five-story tenement stays
under 200px.
"""
from PIL import Image, ImageDraw
from art.buildings import Building, ROOFS
from art.urban import InfillBuilding

ROOFS.update({
    'kawara': ['#20262a', '#353e44', '#4e5a61', '#6b7880', '#8d9aa2'],
    'giwa': ['#2a2e30', '#474d50', '#646b6d', '#848b8b', '#a4aaa6'],
    'tar': ['#26262a', '#39393a', '#4c4c49', '#5f5f59', '#77766c'],
    'copper': ['#2f4a40', '#43685a', '#5f8874', '#7fa58f', '#a3c2a8'],
})
GLASS = ['#2d4048', '#4f6b73', '#6f8c93', '#9fb6b6']
IRON = ['#1f2326', '#3a4045', '#5b636a']
STONE = ['#6f6b5d', '#a8a391', '#cfcab4', '#e6e1cb']
TRIMS = [
    {'door': '#2c3a3d', 'shutter': '#3f5a49', 'trim': '#efe9d6', 'sign': '#2a3d4a', 'awning': ('#a8523a', '#efdcb8')},
    {'door': '#5c2a24', 'shutter': '#2f4a5b', 'trim': '#f2ecdb', 'sign': '#6a2f26', 'awning': ('#456c77', '#dbe6d6')},
    {'door': '#243f2e', 'shutter': '#4a3b32', 'trim': '#e9e2cf', 'sign': '#243f2e', 'awning': ('#8a6f3a', '#efe0bc')},
    {'door': '#3a2f4a', 'shutter': '#3b5253', 'trim': '#ece6d3', 'sign': '#4a3b32', 'awning': ('#5b4e7a', '#e2dbe8')},
    {'door': '#1f2a3a', 'shutter': '#5e3a2e', 'trim': '#f5efdd', 'sign': '#1f2a3a', 'awning': ('#2f5e6a', '#d7e4dc')},
    {'door': '#8a2d24', 'shutter': '#2a2a2a', 'trim': '#ecd9b0', 'sign': '#8a2d24', 'awning': ('#b33a2e', '#f0d9a6')},
]
RED = ['#7a2621', '#b63a2c', '#d95a3b', '#f2a04e']


class PeriodBuilding(Building):
    GLYPHS = InfillBuilding.GLYPHS

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        r = recipe
        self.story = int(r.get('storyHeight', 26))
        self.stories = int(r.get('stories', 2))
        self.top = r['roofDepth'] + 10
        self.style = r['style']
        self.bays = int(r.get('bays', 3))
        self.tone = TRIMS[int(r.get('variant', 0)) % len(TRIMS)]
        self.texture = material.get('texture', 'plain')
        self.window = r.get('window', 'sash')
        self.door = r.get('door', 'fanlight')
        self.cornice = r.get('cornice', 'none')
        self.roof_style = r.get('roofStyle', 'parapet-hip')
        self.extras = set(r.get('extras', []))
        self.sign_text = r.get('sign', '')
        self.centers = [round(14 + i * (self.w - 34) / max(1, self.bays - 1)) for i in range(self.bays)]
        if self.facing == 'south':
            # Snap the door to a bay so the rhythm stays regular; the walkable
            # entrance cell is unchanged because bays sit inside their cells.
            self.door_x = min(self.centers, key=lambda c: abs(c - self.door_x))
        self.door_bay = self.door_x
        # Ground-floor windows sit slightly higher on a raised basement.
        self.basement = 'basement' in self.extras and self.facing == 'south'

    # ---- wall textures -------------------------------------------------
    def wall(self):
        d, w, b, t = self.d, self.w, self.bottom, self.top
        dark, shade, base, light, hi = self.p['wall']
        d.rectangle((4, t, w - 7, b), fill=dark)
        d.rectangle((5, t, self.front, b - 2), fill=base)
        d.rectangle((self.front + 1, t, w - 8, b - 2), fill=shade)
        tex = self.texture
        if tex == 'brick':
            mortar = shade
            for row, y in enumerate(range(t + 2, b - 5, 3)):
                d.line((5, y, self.front, y), fill=mortar)
                off = 0 if row % 2 else 3
                for x in range(5 + off, self.front, 6):
                    d.point((x, y + 1), fill=mortar)
                    d.point((x, y + 2), fill=mortar)
                    if (x * 7 + y * 3 + self.r['seed']) % 11 == 0:
                        d.rectangle((x + 1, y + 1, x + 4, y + 2), fill=light)
                    elif (x * 5 + y + self.r['seed']) % 13 == 0:
                        d.rectangle((x + 1, y + 1, x + 4, y + 2), fill=dark)
        elif tex == 'ashlar':
            for row, y in enumerate(range(t + 4, b - 6, 7)):
                d.line((5, y, self.front, y), fill=shade)
                d.line((5, y + 1, self.front, y + 1), fill=light)
                for x in range(5 + (0 if row % 2 else 8), self.front, 16):
                    d.line((x, y + 2, x, y + 6), fill=shade)
        elif tex == 'stucco':
            for _ in range(max(6, w // 8)):
                x = self.rng.randrange(7, self.front - 8); y = self.rng.randrange(t + 6, b - 12)
                d.line((x, y, x + self.rng.randrange(2, 6), y), fill=self.rng.choice([light, shade]))
        elif tex == 'clapboard':
            for y in range(t + 3, b - 6, 4):
                d.line((5, y, self.front, y), fill=shade)
                d.line((5, y + 1, self.front, y + 1), fill=hi)
        elif tex == 'grey-brick':
            for row, y in enumerate(range(t + 2, b - 5, 3)):
                d.line((5, y, self.front, y), fill=dark)
                for x in range(5 + (0 if row % 2 else 4), self.front, 8):
                    d.line((x, y + 1, x, y + 2), fill=dark)
                    if (x * 3 + y + self.r['seed']) % 9 == 0:
                        d.rectangle((x + 1, y + 1, x + 6, y + 2), fill=light)
        elif tex == 'timber-plaster':
            # Ground floor in dark timber, upper floors in white plaster.
            split = b - 7 - self.story
            d.rectangle((5, split, self.front, b - 2), fill=self.p['timber'][2])
            d.rectangle((self.front + 1, split, w - 8, b - 2), fill=self.p['timber'][1])
            for x in range(5, self.front, 3):
                d.line((x, split + 2, x, b - 4), fill=self.p['timber'][1])
            d.line((5, split, self.front, split), fill=self.p['timber'][0], width=2)
        elif tex == 'panel':
            # Hanok: dark posts divide plaster panels; a raised timber floor below.
            for x in self.centers:
                d.rectangle((x - 9, t, x - 7, b - 6), fill=self.p['timber'][0])
                d.line((x - 9, t, x - 9, b - 6), fill=self.p['timber'][2])
            d.rectangle((self.centers[-1] + 7, t, self.centers[-1] + 9, b - 6), fill=self.p['timber'][0])
        # Left light edge, top shade under the eave, and broad wear at the base.
        d.line((5, t + 2, 5, b - 3), fill=light)
        d.rectangle((5, t, self.front, t + 1), fill=shade)
        d.rectangle((6, b - 8, self.front, b - 2), fill=shade)
        for x in range(8, self.front - 6, 13):
            y = b - self.rng.randrange(6, 10)
            d.polygon([(x, b - 5), (x, y), (x + 4, y - 1), (x + 8, y + 1), (x + 7, b - 5)], fill=base)
        if 'rusticated' in self.extras:
            gb = b - 7 - self.story
            for y in range(gb + 4, b - 6, 6):
                d.line((5, y, self.front, y), fill=shade)
                d.line((5, y + 1, self.front, y + 1), fill=hi)
        if 'quoins' in self.extras:
            for i, y in enumerate(range(t + 2, b - 8, 5)):
                x = 5 if i % 2 else 7
                d.rectangle((x, y, x + 5, y + 3), fill=light)
                d.line((x, y, x + 5, y), fill=hi)
                xr = self.front - 10 if i % 2 else self.front - 8
                d.rectangle((xr, y, xr + 5, y + 3), fill=light)
                d.line((xr, y, xr + 5, y), fill=hi)

    def foundation(self):
        d, b = self.d, self.bottom
        ink, shade, light = self.p['foundation']
        d.rectangle((4, b - 4, self.w - 8, b), fill=ink)
        for x in range(5, self.front - 3, 8):
            d.rectangle((x, b - 4, min(x + 6, self.front), b - 1), fill=shade)
            d.line((x + 1, b - 4, min(x + 5, self.front), b - 4), fill=light)
        d.line((5, b + 1, self.w - 8, b + 1), fill=(30, 34, 26, 155))

    # ---- openings ------------------------------------------------------
    def sash(self, x, y, wd=7, ht=13, arched=False, shutters=False, hood=False):
        d = self.d; trim = self.tone['trim']
        wall = self.p['wall']
        if hood:
            d.rectangle((x - 3, y - 4, x + wd + 2, y - 2), fill=STONE[2])
            d.line((x - 3, y - 4, x + wd + 2, y - 4), fill=STONE[3])
            d.line((x - 3, y - 1, x + wd + 2, y - 1), fill=wall[0])
        elif self.texture in ('brick', 'grey-brick'):
            d.rectangle((x - 1, y - 3, x + wd, y - 2), fill=wall[3] if self.texture == 'brick' else STONE[1])
        else:
            d.line((x - 2, y - 2, x + wd + 1, y - 2), fill=wall[4])
        d.rectangle((x - 1, y - 1, x + wd, y + ht), fill=wall[0])
        d.rectangle((x, y, x + wd - 1, y + ht - 1), fill=GLASS[0])
        d.rectangle((x + 1, y + 1, x + wd - 2, y + ht - 2), fill=GLASS[1])
        d.rectangle((x + 1, y + 1, x + 2, y + 3), fill=GLASS[3])
        d.line((x + 1, y + ht - 2, x + wd - 2, y + ht - 2), fill=GLASS[0])
        # Glazing bars: a meeting rail and one mullion read as a sash at 1x.
        mid = y + ht // 2
        d.line((x, mid, x + wd - 1, mid), fill=trim)
        d.line((x + wd // 2, y, x + wd // 2, y + ht - 1), fill=trim)
        if ht >= 12 and self.window in ('sash', 'sash-arched', 'tall'):
            d.line((x, y + ht // 4, x + wd - 1, y + ht // 4), fill=GLASS[2])
            d.line((x, y + 3 * ht // 4, x + wd - 1, y + 3 * ht // 4), fill=GLASS[2])
        d.rectangle((x - 1, y - 1, x + wd, y - 1), fill=trim)
        d.line((x - 1, y, x - 1, y + ht - 1), fill=trim)
        d.line((x + wd, y, x + wd, y + ht - 1), fill=wall[0])
        if arched:
            d.rectangle((x - 1, y - 3, x + wd, y - 1), fill=wall[0])
            d.rectangle((x, y - 2, x + wd - 1, y), fill=GLASS[1])
            d.point((x, y - 2), fill=wall[2]); d.point((x + wd - 1, y - 2), fill=wall[2])
            d.line((x + 1, y - 3, x + wd - 2, y - 3), fill=trim)
            d.point((x, y - 2), fill=trim); d.point((x + wd - 1, y - 2), fill=trim)
        # Sill: light stone, one pixel proud each side, with its shadow.
        d.rectangle((x - 2, y + ht, x + wd + 1, y + ht + 1), fill=STONE[2])
        d.line((x - 2, y + ht + 2, x + wd + 1, y + ht + 2), fill=wall[0])
        if shutters:
            sh = self.tone['shutter']
            for sx in (x - 5, x + wd + 1):
                d.rectangle((sx, y - 1, sx + 3, y + ht), fill=sh)
                d.line((sx + 1, y + 1, sx + 1, y + ht - 2), fill=wall[0])
                d.line((sx, y - 1, sx + 3, y - 1), fill=wall[4])

    def lattice(self, x, y, wd=9, ht=11, paper=False):
        d = self.d; tim = self.p.get('timber', ['#2a1f18', '#4a3729', '#6a5039', '#866a4c', '#a58862'])
        d.rectangle((x - 1, y - 1, x + wd, y + ht), fill=tim[0])
        d.rectangle((x, y, x + wd - 1, y + ht - 1), fill='#e9e2cb' if paper else GLASS[0])
        grid = tim[1] if paper else tim[3]
        for gx in range(x + 2, x + wd - 1, 3):
            d.line((gx, y, gx, y + ht - 1), fill=grid)
        for gy in range(y + 2, y + ht - 1, 3):
            d.line((x, gy, x + wd - 1, gy), fill=grid)
        d.line((x - 1, y - 1, x + wd, y - 1), fill=tim[3])
        d.rectangle((x - 2, y + ht, x + wd + 1, y + ht + 1), fill=tim[1])
        d.line((x - 2, y + ht + 2, x + wd + 1, y + ht + 2), fill=self.p['wall'][0])

    def bay_window(self, x, y, ht=14):
        d = self.d; trim = self.tone['trim']; wall = self.p['wall']
        d.rectangle((x - 9, y - 2, x + 9, y + ht + 2), fill=wall[0])
        d.rectangle((x - 8, y - 1, x + 8, y + ht + 1), fill=trim)
        for gx, gw in ((x - 7, 4), (x - 2, 5), (x + 4, 4)):
            d.rectangle((gx, y, gx + gw - 1, y + ht - 1), fill=GLASS[1])
            d.line((gx, y + ht // 2, gx + gw - 1, y + ht // 2), fill=trim)
            d.point((gx, y), fill=GLASS[3])
        d.rectangle((x - 9, y - 4, x + 9, y - 3), fill=STONE[2])
        d.rectangle((x - 10, y + ht + 2, x + 10, y + ht + 3), fill=STONE[1])
        d.line((x - 10, y + ht + 4, x + 10, y + ht + 4), fill=wall[0])

    def door_panel(self, x, y, wd, ht, color=None):
        d = self.d; color = color or self.tone['door']
        d.rectangle((x, y, x + wd - 1, y + ht - 1), fill=color)
        d.rectangle((x + 1, y + 2, x + wd // 2 - 1, y + ht // 2 - 1), fill=self.p['wall'][0])
        d.rectangle((x + wd // 2 + 1, y + 2, x + wd - 2, y + ht // 2 - 1), fill=self.p['wall'][0])
        d.rectangle((x + 1, y + ht // 2 + 1, x + wd // 2 - 1, y + ht - 3), fill=self.p['wall'][0])
        d.rectangle((x + wd // 2 + 1, y + ht // 2 + 1, x + wd - 2, y + ht - 3), fill=self.p['wall'][0])
        d.point((x + wd - 3, y + ht // 2), fill='#e1c06b')

    def fanlight_door(self, x, base, steps=2):
        d = self.d; wall = self.p['wall']; trim = self.tone['trim']
        wd, ht = 9, 19
        left = x - wd // 2; top = base - ht - 5
        d.rectangle((left - 3, top - 5, left + wd + 2, base), fill=wall[0])
        d.rectangle((left - 2, top - 4, left + wd + 1, base - 1), fill=trim)
        d.rectangle((left - 1, top - 4, left + wd, top - 1), fill=GLASS[1])
        for fx in (left + 1, left + wd // 2, left + wd - 2):
            d.line((fx, top - 4, left + wd // 2, top - 1), fill=trim)
        d.rectangle((left - 1, top - 1, left + wd, base - 1), fill=wall[0])
        self.door_panel(left, top, wd, ht)
        if 'pediment' in self.extras:
            d.polygon([(left - 5, top - 6), (x, top - 11), (left + wd + 4, top - 6)], fill=STONE[2])
            d.line((left - 5, top - 6, x, top - 11), fill=STONE[3])
            d.line((left - 5, top - 5, left + wd + 4, top - 5), fill=wall[0])
            for px in (left - 4, left + wd + 1):
                d.rectangle((px, top - 4, px + 2, base - 1), fill=STONE[2])
                d.line((px, top - 4, px, base - 1), fill=STONE[3])
        for i in range(steps):
            y = base + i
            d.rectangle((left - 2 - i, y, left + wd + 1 + i, y), fill=STONE[2] if i == 0 else STONE[1])

    def stoop(self, x, base):
        """Brownstone entrance: door on the parlour floor, steps down to the street."""
        d = self.d; wall = self.p['wall']
        rise = self.story - 8
        top = base - rise
        wd = 11; left = x - wd // 2
        d.rectangle((left - 3, top - 22, left + wd + 2, top), fill=wall[0])
        d.rectangle((left - 4, top - 25, left + wd + 3, top - 22), fill=STONE[2])
        d.line((left - 4, top - 25, left + wd + 3, top - 25), fill=STONE[3])
        d.rectangle((left - 1, top - 21, left + wd, top - 19), fill=GLASS[1])
        d.point((left + wd // 2, top - 20), fill=self.tone['trim'])
        self.door_panel(left, top - 18, wd // 2, 17)
        self.door_panel(left + wd // 2 + 1, top - 18, wd // 2, 17)
        d.line((left + wd // 2, top - 18, left + wd // 2, top - 2), fill=wall[0])
        # Steps widen toward the street and cast a small shadow on the wall.
        for i in range(rise // 3 + 1):
            y = top + i * 3
            sw = wd + 2 + i * 2
            d.rectangle((x - sw // 2, y, x + sw // 2, y + 2), fill=STONE[1])
            d.line((x - sw // 2, y, x + sw // 2, y), fill=STONE[3])
            d.line((x - sw // 2 - 1, y + 1, x - sw // 2 - 1, y + 2), fill=wall[0])
        # Cheek walls and iron handrails.
        for side in (-1, 1):
            rx = x + side * (wd // 2 + 3)
            d.line((rx, top - 6, rx + side * (rise // 3 * 2 + 2), base + 2), fill=IRON[1])
            d.line((rx, top - 6, rx, top), fill=IRON[0])
            d.point((rx, top - 7), fill=IRON[2])

    def shopfront(self, base):
        d, w = self.d, self.w; wall = self.p['wall']; trim = self.tone['trim']
        left, right = 7, self.front - 2
        top = base - self.story + 4
        # Fascia board with the shop name, then pilasters, plate glass and a door.
        d.rectangle((left - 2, top - 2, right + 2, top + 8), fill=wall[0])
        d.rectangle((left - 1, top - 1, right + 1, top + 7), fill=self.tone['sign'])
        d.line((left - 1, top - 1, right + 1, top - 1), fill=trim)
        if self.sign_text:
            tw = InfillBuilding._text_width(self, self.sign_text)
            InfillBuilding.pixel_text(self, self.sign_text, (left + right - tw) // 2, top + 1, '#f2e2b0')
        d.rectangle((left - 2, top + 9, right + 2, base), fill=wall[0])
        d.rectangle((left, top + 10, right, base - 1), fill=GLASS[0])
        d.rectangle((left + 1, top + 11, right - 1, base - 3), fill=GLASS[1])
        d.rectangle((left + 1, top + 11, left + 3, top + 14), fill=GLASS[3])
        d.line((left + 1, top + 18, right - 1, top + 18), fill=GLASS[2])
        for px in (left - 2, right):
            d.rectangle((px, top + 9, px + 2, base), fill=self.tone['sign'])
            d.line((px, top + 9, px, base), fill=trim)
        dx = self.door_x; dl = dx - 4
        d.rectangle((dl - 1, top + 10, dl + 8, base), fill=wall[0])
        d.rectangle((dl, top + 11, dl + 7, top + 13), fill=GLASS[1])
        self.door_panel(dl, top + 14, 8, base - top - 15)
        d.rectangle((left, base - 2, right, base - 1), fill=STONE[1])
        if 'awning' in self.extras:
            a, bcol = self.tone['awning']
            ay = top + 8
            d.rectangle((left - 2, ay, right + 2, ay + 2), fill=wall[0])
            for i, x in enumerate(range(left - 1, right + 1, 6)):
                d.polygon([(x, ay + 1), (min(x + 5, right + 1), ay + 1), (min(x + 6, right + 2), ay + 8), (x - 1, ay + 8)], fill=[a, bcol][i % 2])
            d.line((left - 2, ay + 9, right + 2, ay + 9), fill=wall[0])
        if 'wares' in self.extras:
            for i, x in enumerate((left + 2, right - 8)):
                if abs(x - dx) < 8: continue
                d.rectangle((x, base - 9, x + 6, base - 3), fill='#5a4630')
                d.rectangle((x + 1, base - 10, x + 5, base - 4), fill=['#9d7040', '#7c8a44', '#b1533a'][i % 3])

    def shop_panels(self, base):
        """Chinese shophouse ground floor: folding timber shutters and an open bay."""
        d = self.d; tim = self.p['timber']; wall = self.p['wall']
        left, right = 7, self.front - 2
        top = base - self.story + 4
        d.rectangle((left - 2, top, right + 2, base), fill=wall[0])
        d.rectangle((left, top + 1, right, base - 1), fill=tim[1])
        for x in range(left, right, 5):
            d.rectangle((x, top + 2, x + 3, base - 2), fill=tim[2])
            d.line((x, top + 2, x, base - 2), fill=tim[3])
            d.line((x + 1, top + 5, x + 2, top + 5), fill=tim[0])
            d.line((x + 1, base - 6, x + 2, base - 6), fill=tim[0])
        dx = self.door_x
        d.rectangle((dx - 8, top + 1, dx + 8, base - 1), fill='#211d1a')
        d.rectangle((dx - 7, top + 2, dx + 7, base - 2), fill='#2f2924')
        d.rectangle((dx - 6, base - 8, dx + 6, base - 3), fill='#4b3d30')
        d.rectangle((dx - 5, base - 9, dx - 2, base - 6), fill='#a86b3a')
        d.rectangle((dx + 1, base - 9, dx + 5, base - 6), fill='#8b9a4a')
        d.line((dx - 8, top, dx + 8, top), fill=tim[3])
        if 'counter' in self.extras:
            d.rectangle((dx - 8, base - 4, dx + 8, base - 1), fill=tim[0])
            d.line((dx - 8, base - 4, dx + 8, base - 4), fill=tim[3])

    def koshi(self, base):
        """Machiya ground floor: fine vertical lattice with a noren over the door."""
        d = self.d; tim = self.p['timber']
        left, right = 7, self.front - 2
        top = base - self.story + 6
        d.rectangle((left, top, right, base - 1), fill=tim[0])
        for x in range(left + 1, right, 2):
            d.line((x, top + 1, x, base - 2), fill=tim[2])
        d.rectangle((left, top + 8, right, top + 9), fill=tim[1])
        dx = self.door_x
        d.rectangle((dx - 9, top - 1, dx + 9, base - 1), fill='#1d1a17')
        d.rectangle((dx - 8, top, dx + 8, base - 2), fill='#2c2622')
        noren = self.tone.get('noren', '#2c4b74')
        for i, x in enumerate(range(dx - 9, dx + 9, 6)):
            d.rectangle((x, top - 1, x + 4, top + 12), fill=noren)
            d.point((x + 2, top + 5), fill='#e6e0c8')
        d.line((dx - 10, top - 2, dx + 9, top - 2), fill=tim[3])
        d.rectangle((dx - 6, base - 5, dx + 6, base - 2), fill=STONE[1])

    def arcade(self, base):
        """Straits shophouse five-foot way: a covered walk across the frontage."""
        d = self.d; wall = self.p['wall']
        top = base - self.story + 3
        left, right = 6, self.front - 1
        d.rectangle((left, top, right, base - 1), fill='#1f2320')
        d.rectangle((left, top + 1, right, top + 6), fill='#2a2f2b')
        d.rectangle((left + 2, base - 4, right - 2, base - 1), fill=STONE[1])
        d.line((left + 2, base - 4, right - 2, base - 4), fill=STONE[3])
        # Inside the arcade: a shuttered doorway and a dim window.
        dx = self.door_x
        d.rectangle((dx - 5, base - 20, dx + 5, base - 4), fill=self.tone['door'])
        d.rectangle((dx - 3, base - 18, dx - 1, base - 8), fill='#1a1c19')
        d.rectangle((dx + 1, base - 18, dx + 3, base - 8), fill='#1a1c19')
        for wx in (c for c in self.centers if abs(c - dx) > 12):
            d.rectangle((wx - 3, base - 18, wx + 3, base - 9), fill='#1a1c19')
            d.line((wx, base - 18, wx, base - 9), fill='#3a3f3a')
        for x in range(left, right + 1, max(14, (right - left) // (self.bays - 1))):
            d.rectangle((x, top, x + 3, base - 1), fill=wall[1])
            d.rectangle((x, top, x + 1, base - 1), fill=wall[3])
            d.line((x, top, x, base - 1), fill=wall[4])
            d.rectangle((x - 1, top - 1, x + 4, top + 1), fill=wall[3])
        d.rectangle((left, top - 3, right, top - 1), fill=wall[3])
        d.line((left, top - 3, right, top - 3), fill=wall[4])

    def red_gate(self, base):
        """A Chinese courtyard gate: studded vermilion leaves under a lintel."""
        d = self.d; dx = self.door_x; wall = self.p['wall']
        wd = 18; left = dx - wd // 2; top = base - 24
        d.rectangle((left - 4, top - 4, left + wd + 3, base), fill=wall[0])
        d.rectangle((left - 3, top - 3, left + wd + 2, base - 1), fill=STONE[1])
        d.rectangle((left, top, left + wd - 1, base - 1), fill=RED[1])
        d.rectangle((left, top, left + wd - 1, top + 1), fill=RED[2])
        d.line((left + wd // 2, top, left + wd // 2, base - 1), fill=RED[0])
        for gy in range(top + 4, base - 3, 5):
            for gx in range(left + 2, left + wd - 2, 4):
                if gx in (left + wd // 2, left + wd // 2 - 1): continue
                d.point((gx, gy), fill=RED[3])
        for kx in (left + 4, left + wd - 5):
            d.rectangle((kx - 1, top + 10, kx + 1, top + 12), fill='#d9b34a')
        d.rectangle((left - 3, top - 6, left + wd + 2, top - 3), fill=self.p['timber'][2])
        d.line((left - 3, top - 6, left + wd + 2, top - 6), fill=self.p['timber'][3])
        for sx in (left - 6, left + wd + 3):
            d.rectangle((sx, base - 6, sx + 2, base - 1), fill=STONE[1])
            d.rectangle((sx, base - 8, sx + 2, base - 6), fill=STONE[2])
        d.rectangle((left - 3, base, left + wd + 2, base + 1), fill=STONE[2])

    def double_door(self, x, base):
        d = self.d; wall = self.p['wall']; wd = 12; left = x - wd // 2; top = base - 24
        d.rectangle((left - 2, top - 5, left + wd + 1, base), fill=wall[0])
        d.rectangle((left - 1, top - 4, left + wd, top - 1), fill=GLASS[1])
        d.line((left - 1, top - 4, left + wd, top - 4), fill=self.tone['trim'])
        self.door_panel(left, top, wd // 2, 23)
        self.door_panel(left + wd // 2 + 1, top, wd // 2 - 1, 23)
        d.line((left + wd // 2, top, left + wd // 2, base - 1), fill=wall[0])
        d.rectangle((left - 3, base, left + wd + 2, base + 1), fill=STONE[2])

    def openings(self):
        d, b = self.d, self.bottom
        south = self.facing == 'south'
        for floor in range(self.stories):
            base = b - 7 - floor * self.story
            if floor and self.texture not in ('timber-plaster', 'panel'):
                d.line((5, base + 4, self.front, base + 4), fill=self.p['wall'][1])
                d.line((5, base + 3, self.front, base + 3), fill=self.p['wall'][3])
            ground = floor == 0
            if ground and south and self.door in ('shop', 'shop-panels', 'koshi', 'arcade'):
                continue
            for x in self.centers:
                if ground and south and abs(x - self.door_x) < 9:
                    continue
                self.window_at(x, base, floor)
        if not south:
            return
        base = b - 7
        if self.door == 'fanlight': self.fanlight_door(self.door_x, base + 2)
        elif self.door == 'stoop': self.stoop(self.door_x, base + 2)
        elif self.door == 'shop': self.shopfront(base + 2)
        elif self.door == 'shop-panels': self.shop_panels(base + 2)
        elif self.door == 'koshi': self.koshi(base + 2)
        elif self.door == 'arcade': self.arcade(base + 2)
        elif self.door == 'red-gate': self.red_gate(base + 2)
        elif self.door == 'double': self.double_door(self.door_x, base + 2)
        elif self.door == 'sliding':
            dx = self.door_x; tim = self.p['timber']
            d.rectangle((dx - 8, base - 19, dx + 8, base + 1), fill=tim[0])
            self.lattice(dx - 7, base - 18, 6, 17, paper=True)
            self.lattice(dx + 1, base - 18, 6, 17, paper=True)
        if 'railings' in self.extras:
            for x in range(6, self.front - 1, 3):
                if abs(x - self.door_x) < 8: continue
                d.line((x, b - 11, x, b - 1), fill=IRON[0])
                d.point((x, b - 12), fill=IRON[2])
            d.line((6, b - 9, self.front, b - 9), fill=IRON[1])

    def window_at(self, x, base, floor):
        kind = self.window
        tall = 'tall' in self.extras and floor == 1
        if self.basement and floor == 0:
            y = base - self.story + 6
            self.sash(x - 3, y, 6, 8)
            self.sash(x - 3, base - 8, 6, 5)
            return
        if kind == 'lattice':
            self.lattice(x - 5, base - 18)
        elif kind == 'shoji':
            self.lattice(x - 5, base - 18, 9, 11, paper=True)
        elif kind == 'slit':
            # Mushiko-mado: a plastered upper slit window.
            d = self.d
            d.rectangle((x - 6, base - 17, x + 6, base - 9), fill=self.p['wall'][1])
            for gx in range(x - 5, x + 6, 2):
                d.line((gx, base - 16, gx, base - 10), fill=self.p['wall'][3])
        elif kind == 'bay' and floor == 0:
            self.bay_window(x, base - 20)
        elif kind == 'bay':
            self.sash(x - 4, base - 21, 8, 13, arched=True)
        elif kind == 'shuttered':
            self.sash(x - 3, base - 20, 6, 13, shutters=True)
        elif kind == 'sash-arched':
            self.sash(x - 4, base - 20, 7, 12, arched=True, hood='hoods' in self.extras)
        elif kind == 'tall' or tall:
            self.sash(x - 4, base - 22, 7, 16, hood='hoods' in self.extras)
        else:
            self.sash(x - 4, base - 21, 7, 13, hood='hoods' in self.extras)

    # ---- roofs and cornices --------------------------------------------
    def tiles(self, polygon, pal, pitch=4, tw=5, start=8, stagger=True):
        mask = Image.new('L', self.im.size); ImageDraw.Draw(mask).polygon(polygon, fill=255)
        layer = Image.new('RGBA', self.im.size); ld = ImageDraw.Draw(layer)
        ld.rectangle((0, 0, self.w, self.h), fill=pal[0])
        for row, y in enumerate(range(start, self.top + 4, pitch)):
            off = tw // 2 if (stagger and row % 2) else 0
            for x in range(-tw + off, self.w + tw, tw):
                tone = pal[2] if self.rng.random() < .85 else pal[1]
                ld.rectangle((x, y, x + tw - 2, y + pitch - 2), fill=tone)
                ld.line((x, y, x + tw - 3, y), fill=pal[3])
                if (x + row) % 7 == 0: ld.point((x + 1, y + 1), fill=pal[4])
        self.im.paste(layer, (0, 0), mask)

    def chimney(self, x, y, ht=9, pots=2):
        d = self.d; wall = self.p['wall']
        brick = wall if self.texture in ('brick', 'grey-brick') else ['#4a3229', '#7a4a3a', '#a2634c', '#b97d62', '#d19a78']
        d.rectangle((x, y, x + 5, y + ht), fill=brick[1])
        d.rectangle((x, y, x + 2, y + ht), fill=brick[2])
        d.line((x, y, x + 5, y), fill=brick[3])
        d.line((x, y - 1, x + 5, y - 1), fill=brick[0])
        for i in range(pots):
            px = x + 1 + i * 3
            d.rectangle((px, y - 4, px + 1, y - 1), fill='#7a4a3a')
            d.point((px, y - 4), fill='#b97d62')

    def cornice_band(self):
        d, w, t = self.d, self.w, self.top
        wall = self.p['wall']
        if self.cornice == 'none':
            return
        if self.cornice == 'dentil':
            d.rectangle((3, t - 3, w - 6, t + 1), fill=STONE[2])
            d.line((3, t - 3, w - 6, t - 3), fill=STONE[3])
            for x in range(5, w - 7, 3):
                d.point((x, t + 1), fill=wall[0])
            d.line((4, t + 2, w - 7, t + 2), fill=wall[0])
        elif self.cornice == 'bracket':
            d.rectangle((2, t - 5, w - 5, t), fill=self.tone['trim'])
            d.line((2, t - 5, w - 5, t - 5), fill='#ffffff')
            d.line((2, t, w - 5, t), fill=wall[1])
            for x in range(6, w - 8, 7):
                d.rectangle((x, t + 1, x + 2, t + 4), fill=self.tone['trim'])
                d.point((x + 1, t + 5), fill=wall[1])
                d.line((x + 2, t + 1, x + 2, t + 4), fill=wall[1])
            d.line((3, t + 1, w - 6, t + 1), fill=wall[0])
        elif self.cornice == 'corbel':
            for i, y in enumerate((t - 3, t)):
                d.rectangle((4 - i, y, w - 7 + i, y + 2), fill=wall[2])
                d.line((4 - i, y, w - 7 + i, y), fill=wall[3])
                for x in range(6, w - 8, 4 if i else 8):
                    d.point((x, y + 2), fill=wall[0])
            d.line((3, t + 3, w - 6, t + 3), fill=wall[0])
        elif self.cornice == 'eave':
            # Deep timber eave with exposed rafter ends.
            tim = self.p.get('timber', ['#2a1f18', '#4a3729', '#6a5039', '#866a4c', '#a58862'])
            d.rectangle((1, t - 4, w - 3, t), fill=tim[1])
            d.line((1, t - 4, w - 3, t - 4), fill=tim[3])
            for x in range(3, w - 4, 4):
                d.rectangle((x, t + 1, x + 1, t + 3), fill=tim[0])
                d.point((x, t + 1), fill=tim[3])
            d.rectangle((2, t + 1, w - 4, t + 6), fill=(20, 18, 14, 70))

    def roof(self):
        d, w, t = self.d, self.w, self.top
        style = self.roof_style; wall = self.p['wall']
        pal = ROOFS[self.r['roofMaterial']]
        if style == 'parapet-hip':
            self.tiles([(5, t - 4), (13, 9), (w - 17, 9), (w - 9, t - 4)], pal)
            d.line((13, 8, w - 17, 8), fill=pal[0], width=2)
            d.line((13, 7, w - 17, 7), fill=pal[3])
            for x, y in ((13, 9), (w - 17, 9)):
                d.line((x, y, 5 if x < w / 2 else w - 9, t - 4), fill=pal[3])
            # Parapet with stone coping hides the eave.
            d.rectangle((4, t - 5, w - 7, t - 1), fill=wall[2])
            d.line((4, t - 5, w - 7, t - 5), fill=STONE[2])
            d.line((5, t - 6, w - 8, t - 6), fill=STONE[3])
            if 'chimneys' in self.extras:
                self.chimney(9, 4); self.chimney(w - 18, 4)
        elif style == 'hip':
            self.tiles([(1, t + 1), (11, 9), (w - 15, 9), (w - 3, t + 1)], pal)
            d.line((11, 8, w - 15, 8), fill=pal[0], width=2)
            d.line((11, 7, w - 15, 7), fill=pal[3])
            for x in (11, w - 15):
                d.line((x, 9, 1 if x < w / 2 else w - 3, t + 1), fill=pal[3])
            d.line((1, t + 1, w - 3, t + 1), fill=pal[0], width=2)
            d.line((2, t + 2, w - 4, t + 2), fill=pal[1])
            if 'chimneys' in self.extras:
                self.chimney(w // 2 - 3, 3)
        elif style == 'gable':
            self.tiles([(2, t + 1), (2, 12), (w - 4, 12), (w - 4, t + 1)], pal)
            d.line((2, 11, w - 4, 11), fill=pal[0], width=2)
            d.line((2, 10, w - 4, 10), fill=pal[3])
            d.line((2, t + 1, w - 4, t + 1), fill=pal[0], width=2)
            d.line((3, t + 2, w - 5, t + 2), fill=pal[1])
            if 'chimneys' in self.extras:
                self.chimney(3, 5); self.chimney(w - 12, 5)
        elif style == 'pediment':
            # Gable-front temple form: roof slopes back from a pediment over the facade.
            self.tiles([(4, t - 2), (4, 10), (w - 6, 10), (w - 6, t - 2)], pal, pitch=3, tw=4)
            d.polygon([(1, t + 1), (w // 2 - 1, t - 12), (w - 3, t + 1)], fill=wall[0])
            d.polygon([(3, t), (w // 2 - 1, t - 10), (w - 5, t)], fill=wall[3])
            d.polygon([(6, t - 1), (w // 2 - 1, t - 8), (w - 8, t - 1)], fill=wall[2])
            d.line((3, t, w // 2 - 1, t - 10), fill=wall[4])
            d.rectangle((3, t, w - 5, t + 2), fill=wall[4])
            d.line((3, t + 3, w - 5, t + 3), fill=wall[0])
            d.rectangle((w // 2 - 3, t - 5, w // 2 + 1, t - 2), fill=GLASS[1])
        elif style == 'flat':
            d.rectangle((3, 8, w - 5, t), fill=pal[0])
            d.rectangle((5, 10, w - 8, t - 3), fill=pal[2])
            for _ in range(max(8, w // 6)):
                x = self.rng.randrange(7, w - 12); y = self.rng.randrange(12, t - 5)
                d.line((x, y, x + self.rng.randrange(2, 8), y), fill=self.rng.choice([pal[1], pal[3]]))
            d.line((4, 8, w - 6, 8), fill=pal[3], width=2)
            d.line((4, 9, 4, t - 1), fill=pal[3])
            # Parapet in the wall material with a coping course.
            d.rectangle((4, t - 4, w - 7, t), fill=wall[2])
            d.line((4, t - 4, w - 7, t - 4), fill=STONE[2])
            d.line((5, t - 5, w - 8, t - 5), fill=STONE[3])
            d.rectangle((w - 9, 9, w - 6, t - 1), fill=pal[1])
            if 'water-tank' in self.extras:
                x = w - 24
                d.rectangle((x + 1, 21, x + 8, 25), fill=IRON[0])
                d.line((x + 1, 21, x + 1, 25), fill=IRON[2]); d.line((x + 8, 21, x + 8, 25), fill=IRON[2])
                d.rectangle((x, 9, x + 9, 21), fill='#6b4f36')
                d.rectangle((x, 9, x + 3, 21), fill='#8d6b48')
                for y in (12, 17): d.line((x, y, x + 9, y), fill='#3d2c1f')
                d.polygon([(x - 1, 9), (x + 4, 5), (x + 10, 9)], fill='#4a3a2c')
                d.line((x - 1, 9, x + 4, 5), fill='#8d6b48')
            if 'chimneys' in self.extras:
                self.chimney(9, 10, 6, 1); self.chimney(w // 2 + 4, 10, 6, 1)
            if 'skylight' in self.extras:
                d.rectangle((10, 14, 19, 19), fill=GLASS[1])
                d.line((10, 14, 19, 14), fill=GLASS[3]); d.line((14, 14, 14, 19), fill=pal[0])
        elif style == 'mansard':
            # Low upper slope, then a steep slate face with dormers, then the cornice.
            self.tiles([(8, 15), (14, 8), (w - 18, 8), (w - 12, 15)], pal, pitch=3, tw=4)
            d.line((14, 7, w - 18, 7), fill=IRON[1])
            for x in range(15, w - 18, 4): d.point((x, 6), fill=IRON[2])
            self.tiles([(2, t - 2), (8, 15), (w - 12, 15), (w - 5, t - 2)], pal, pitch=3, tw=4, start=15)
            d.line((8, 15, w - 12, 15), fill=pal[3])
            d.line((2, t - 2, w - 5, t - 2), fill=pal[0])
            for x in self.centers:
                d.rectangle((x - 4, t - 12, x + 4, t - 3), fill=self.tone['trim'])
                d.rectangle((x - 3, t - 11, x + 3, t - 4), fill=GLASS[1])
                d.line((x, t - 11, x, t - 4), fill=self.tone['trim'])
                d.polygon([(x - 5, t - 12), (x, t - 15), (x + 5, t - 12)], fill=pal[3])
                d.line((x - 4, t - 3, x + 4, t - 3), fill=pal[0])
            if 'chimneys' in self.extras:
                self.chimney(w - 22, 8, 7); self.chimney(12, 8, 7)
        elif style in ('chinese', 'kawara', 'giwa'):
            self.asian_roof(style, pal)
        elif style == 'verandah-hip':
            self.tiles([(0, t + 3), (12, 8), (w - 15, 8), (w - 1, t + 3)], pal, pitch=3, tw=4)
            d.line((12, 7, w - 15, 7), fill=pal[0], width=2)
            d.line((12, 6, w - 15, 6), fill=pal[3])
            for x in (12, w - 15):
                d.line((x, 8, 0 if x < w / 2 else w - 1, t + 3), fill=pal[3])
            d.line((0, t + 3, w - 1, t + 3), fill=pal[0], width=2)
        self.cornice_band()

    def asian_roof(self, style, pal):
        d, w, t = self.d, self.w, self.top
        over = 3 if style == 'kawara' else 5
        ridge_y = 9
        ridge = [(12 + over, ridge_y), (w - 15 - over, ridge_y)]
        eave = [(-over + 2, t + 1), (w - 3 + over, t + 1)]
        if style == 'giwa':
            # Hanok eaves rise at the corners.
            poly = [(-over + 2, t - 2), (4, t + 1), (w - 6, t + 1), (w - 3 + over, t - 2), ridge[1], ridge[0]]
        else:
            poly = [eave[0], eave[1], ridge[1], ridge[0]]
        pitch = 4; tw = 4
        mask = Image.new('L', self.im.size); ImageDraw.Draw(mask).polygon(poly, fill=255)
        layer = Image.new('RGBA', self.im.size); ld = ImageDraw.Draw(layer)
        ld.rectangle((0, 0, w, self.h), fill=pal[0])
        # Vertical channels of pan tiles with cover tiles between: the classic
        # East Asian roof reads as stripes, not a stagger.
        for x in range(-4, w + 4, tw):
            ld.rectangle((x, 0, x + 1, t + 2), fill=pal[2])
            ld.line((x + 2, 0, x + 2, t + 2), fill=pal[1])
            ld.line((x + 3, 0, x + 3, t + 2), fill=pal[3])
        for y in range(ridge_y + 3, t + 2, pitch):
            ld.line((-4, y, w + 4, y), fill=pal[0])
            ld.line((-4, y + 1, w + 4, y + 1), fill=pal[4] if style != 'kawara' else pal[3])
        self.im.paste(layer, (0, 0), mask)
        # Ridge with raised ends; hanok gets a white-capped ridge.
        d.line((ridge[0][0], ridge_y - 1, ridge[1][0], ridge_y - 1), fill=pal[0], width=3)
        cap = '#e8e2cc' if style == 'giwa' else pal[3]
        d.line((ridge[0][0], ridge_y - 2, ridge[1][0], ridge_y - 2), fill=cap)
        for rx in (ridge[0][0], ridge[1][0]):
            d.rectangle((rx - 1, ridge_y - 5, rx + 1, ridge_y - 1), fill=pal[0])
            d.point((rx, ridge_y - 5), fill=cap)
        # Hips.
        for i, (rx, ry) in enumerate(ridge):
            ex = poly[0][0] if i == 0 else poly[1 if style != 'giwa' else 3][0]
            ey = poly[0][1] if i == 0 else poly[1 if style != 'giwa' else 3][1]
            d.line((rx, ry, ex, ey), fill=pal[0], width=2)
            d.line((rx, ry - 1, ex, ey - 1), fill=cap)
        # Eave lip: round tile ends as alternating dots, over a shadow band.
        y = poly[1][1] if style != 'giwa' else t + 1
        d.line((poly[0][0], y + 1, poly[-1 if style == 'giwa' else 1][0], y + 1), fill=pal[0], width=2)
        x0, x1 = (4, w - 6) if style == 'giwa' else (poly[0][0], poly[1][0])
        for x in range(x0, x1, 4):
            d.rectangle((x, y + 1, x + 1, y + 2), fill=pal[3])
            d.point((x + 2, y + 2), fill=pal[1])
        if style == 'giwa':
            for sx, ex in ((4, poly[0][0]), (w - 6, poly[3][0])):
                d.line((sx, t + 2, ex, t - 1), fill=pal[3], width=2)
        d.rectangle((3, t + 3, w - 6, t + 7), fill=(20, 18, 14, 70))
        if 'chimneys' in self.extras:
            self.chimney(w - 20, 4, 6, 1)

    # ---- extras ----------------------------------------------------------
    def fire_escape(self):
        d, b = self.d, self.bottom
        x = self.centers[-1] if self.door_x < self.w // 2 else self.centers[0]
        x1, x2 = x - 10, x + 10
        for floor in range(1, self.stories):
            base = b - 7 - floor * self.story
            y = base + 1
            d.rectangle((x1, y, x2, y + 1), fill=IRON[0])
            d.line((x1, y, x2, y), fill=IRON[2])
            for px in range(x1, x2 + 1, 4):
                d.line((px, y - 7, px, y - 1), fill=IRON[0])
            d.line((x1, y - 7, x2, y - 7), fill=IRON[1])
            d.line((x1, y - 4, x2, y - 4), fill=IRON[0])
            if floor < self.stories - 1:
                ny = base - self.story + 1
                d.line((x1 + 2, y - 1, x1 + 8, ny + 1), fill=IRON[1], width=1)
                d.line((x1 + 4, y - 1, x1 + 10, ny + 1), fill=IRON[0], width=1)
                for k in range(2, self.story - 2, 3):
                    ty = y - k
                    tx = x1 + 2 + round((y - ty) * 6 / (y - ny))
                    d.line((tx, ty, tx + 2, ty), fill=IRON[2])
            else:
                d.line((x1 + 2, y - 1, x1 + 6, y - 9), fill=IRON[1])
                d.line((x1 + 4, y - 1, x1 + 8, y - 9), fill=IRON[1])

    def balcony(self):
        """Regency ironwork across the first floor."""
        d, b = self.d, self.bottom
        y = b - 7 - self.story + 3
        left, right = 6, self.front
        d.rectangle((left, y - 8, right, y - 1), fill=(20, 24, 26, 90))
        d.line((left, y - 1, right, y - 1), fill=IRON[1])
        d.line((left, y, right, y), fill=IRON[0])
        d.line((left, y - 8, right, y - 8), fill=IRON[2])
        for x in range(left, right + 1, 4):
            d.line((x, y - 8, x, y - 1), fill=IRON[0])
            if (x - left) % 8 == 0:
                d.line((x + 1, y - 6, x + 3, y - 3), fill=IRON[2])
                d.line((x + 3, y - 6, x + 1, y - 3), fill=IRON[1])
        if 'canopy' in self.extras:
            d.polygon([(left - 1, y - 10), (right + 1, y - 10), (right - 1, y - 14), (left + 1, y - 14)], fill='#3f5a49')
            d.line((left + 1, y - 14, right - 1, y - 14), fill='#7fa58f')
            d.line((left - 1, y - 10, right + 1, y - 10), fill='#2f4a40')

    def beside_door(self):
        """Midpoint between the door bay and its nearest neighbour: clear of both."""
        others = [c for c in self.centers if c != self.door_x]
        n = min(others, key=lambda c: abs(c - self.door_x)) if others else self.door_x + 16
        return (self.door_x + n) // 2

    def lanterns(self):
        d, b = self.d, self.bottom
        if self.stories > 1:
            # Hang from the eave at the corners, clear of the upper windows.
            xs, y = (8, self.front - 3), self.top + 7
        else:
            xs, y = (self.door_x - 14, self.door_x + 14), self.top + 7
        for x in xs:
            d.line((x, y - 4, x, y - 1), fill=IRON[0])
            d.rectangle((x - 2, y, x + 2, y + 5), fill=RED[1])
            d.rectangle((x - 1, y - 1, x + 1, y), fill='#d9b34a')
            d.rectangle((x - 1, y + 6, x + 1, y + 6), fill='#d9b34a')
            d.line((x - 2, y + 1, x - 2, y + 4), fill=RED[2])
            d.point((x + 2, y + 3), fill=RED[0])
            d.line((x, y + 7, x, y + 9), fill='#d9b34a')

    def sign_board(self):
        """Vertical shop board beside the door, in the East Asian manner."""
        d, b = self.d, self.bottom
        x = self.beside_door() - 2
        top = b - 7 - self.story - 2
        d.rectangle((x - 1, top - 1, x + 5, top + 17), fill='#1d1a17')
        d.rectangle((x, top, x + 4, top + 16), fill=self.tone['sign'])
        for y in range(top + 2, top + 15, 4):
            d.rectangle((x + 1, y, x + 3, y + 1), fill='#f2e2b0')
        d.line((x, top - 3, x + 4, top - 3), fill=IRON[1])

    def hanging_sign(self):
        d, b = self.d, self.bottom
        x = self.beside_door() - 3
        y = b - 7 - self.story + 2
        d.line((x, y - 4, x + 6, y - 4), fill=IRON[0])
        d.line((x + 3, y - 3, x + 3, y - 1), fill=IRON[1])
        d.rectangle((x, y, x + 6, y + 5), fill=self.tone['sign'])
        d.rectangle((x + 1, y + 1, x + 5, y + 4), fill='#e6c96b')
        d.point((x + 3, y + 2), fill=self.tone['sign'])

    def porch(self):
        """Greek-revival columns carrying an entablature across the front."""
        d, b, w = self.d, self.bottom, self.w
        trim = self.tone['trim']; wall = self.p['wall']
        top = b - 7 - self.story + 1
        d.rectangle((3, top - 3, w - 5, top + 1), fill=trim)
        d.line((3, top - 3, w - 5, top - 3), fill='#ffffff')
        d.line((3, top + 2, w - 5, top + 2), fill=wall[0])
        c = self.centers
        for px in [8] + [(c[i] + c[i + 1]) // 2 for i in range(len(c) - 1)] + [self.front - 3]:
            d.rectangle((px - 1, top + 3, px + 1, b - 2), fill=trim)
            d.line((px + 1, top + 3, px + 1, b - 2), fill=wall[1])
            d.rectangle((px - 2, top + 3, px + 2, top + 4), fill=trim)
            d.rectangle((px - 2, b - 3, px + 2, b - 2), fill=trim)
        d.rectangle((3, b - 1, w - 5, b), fill=STONE[2])

    def verandah(self):
        """A deep colonial verandah on slender posts, with a rail."""
        d, b, w = self.d, self.bottom, self.w
        trim = self.tone['trim']; wall = self.p['wall']
        top = self.top + 4
        d.rectangle((1, top, w - 3, top + 3), fill=trim)
        d.line((1, top, w - 3, top), fill='#ffffff')
        d.line((1, top + 4, w - 3, top + 4), fill=wall[0])
        for x in range(3, w - 4, 12):
            d.rectangle((x, top + 4, x + 1, b - 1), fill=trim)
            d.line((x + 1, top + 5, x + 1, b - 1), fill=wall[1])
        d.line((2, b - 12, w - 4, b - 12), fill=trim)
        for x in range(4, w - 4, 3):
            if abs(x - self.door_x) < 7: continue
            d.line((x, b - 11, x, b - 5), fill=wall[1])
        d.rectangle((1, b - 4, w - 3, b - 2), fill=trim)
        d.rectangle((self.door_x - 6, b - 2, self.door_x + 6, b + 1), fill=STONE[2])

    def maru(self):
        """Hanok raised wooden floor with a step stone."""
        d, b, w = self.d, self.bottom, self.w
        tim = self.p['timber']
        d.rectangle((2, b - 6, w - 4, b - 1), fill=tim[1])
        for x in range(3, w - 4, 4):
            d.line((x, b - 6, x, b - 1), fill=tim[2])
        d.line((2, b - 6, w - 4, b - 6), fill=tim[3])
        d.rectangle((3, b, w - 5, b + 1), fill=STONE[0])
        d.rectangle((self.door_x - 5, b, self.door_x + 5, b + 2), fill=STONE[2])
        d.line((self.door_x - 5, b + 2, self.door_x + 5, b + 2), fill=STONE[0])

    def render(self):
        self.wall()
        self.foundation()
        self.openings()
        self.roof()
        if self.facing == 'south':
            if 'fire-escape' in self.extras: self.fire_escape()
            if 'balcony' in self.extras: self.balcony()
            if 'lanterns' in self.extras: self.lanterns()
            if 'sign-board' in self.extras: self.sign_board()
            if 'hanging-sign' in self.extras: self.hanging_sign()
            if 'porch' in self.extras: self.porch()
            if 'verandah' in self.extras: self.verandah()
            if 'maru' in self.extras: self.maru()
        elif self.facing == 'north' and 'fire-escape' in self.extras:
            self.fire_escape()
        if self.facing in ('east', 'west'):
            x = self.w - 11 if self.facing == 'east' else 3
            self.d.rectangle((x - 2, self.bottom - 22, x + 3, self.bottom), fill='#332e27')
            self.d.line((x - 3, self.bottom - 23, x + 3, self.bottom - 23), fill=self.p['wall'][3])
            self.d.line((x - 3, self.bottom + 1, x + 4, self.bottom + 1), fill=self.p['wall'][4])
        elif self.facing == 'north':
            self.d.rectangle((self.w // 2 - 6, 4, self.w // 2 + 6, 7), fill=self.p['foundation'][1])
            self.d.line((self.w // 2 - 6, 4, self.w // 2 + 6, 4), fill=self.p['foundation'][2])
        return self.im


def period_recipes(root, source):
    import json
    kit = json.loads((root / 'src/content/graphics/period.json').read_text())
    source['materials'].update(kit['materials'])
    out = {}
    for name, r in kit['buildings'].items():
        r = dict(r)
        fw, fh = r['footprint']
        stories = int(r.get('stories', 2)); story = int(r.get('storyHeight', 26))
        r.update(canvas=[fw * 16, r['roofDepth'] + 17 + stories * story],
                 entrance=r.get('entrance', [fw // 2, fh]), opening='door',
                 height=stories * story + 22, roof='flat', attachments=[],
                 period=True, stories=stories,
                 description=r.get('description', 'A period street facade for review. Its form is illustrative, not a surveyed reconstruction.'))
        out[f'period-{name}'] = r
    return out
