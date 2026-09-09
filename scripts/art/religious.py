"""Religious buildings, composed from parts so one recipe yields several
sizes, looks and facings. Source pixels throughout; light from the upper
left. Recipes live in src/content/graphics/religious.json."""
import random
from PIL import Image, ImageDraw
from art.buildings import ROOFS

OUTLINE = '#2f2a22'
BELL = ['#5c4a2a', '#9a7a3c', '#d1ac58']
GRASS = ['#4f6b33', '#6d8a3f', '#89a24c', '#a7b95c']


class ReligiousBuilding:
    def __init__(self, recipe, material):
        self.r = recipe
        self.p = material
        self.rng = random.Random(recipe['seed'])
        self.w, self.h = recipe['canvas']
        self.im = Image.new('RGBA', (self.w, self.h))
        self.d = ImageDraw.Draw(self.im)
        self.facing = recipe.get('facing', 'south')
        self.ground = self.h - 6
        fw, fh = recipe['footprint']
        # Parts grow with the footprint: a wider church gets a broader tower
        # and apse, a deeper one taller walls, so the sprite covers its cells.
        # Bounded so a narrow footprint still leaves a nave between them.
        self.tower_w = min(16 * max(2, round(fw / 3.5)), self.w // 3)
        self.apse_w = min(8 * max(2, round(fh / 2.5)), self.w // 5)
        self.rise = max(0, fh - 5) * 6

    # --- masonry -----------------------------------------------------------
    def courses(self, x0, y0, x1, y1, shade=False):
        """Coursed rubble: staggered blocks in three tones, a lit top edge on
        each block and a dark joint below. Shaded walls drop a tone."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        if x1 <= x0 or y1 <= y0:
            return
        tones = [sh, base, base, light] if not shade else [dark, sh, sh, base]
        d.rectangle((x0, y0, x1, y1), fill=dark)
        row = 0
        for y in range(y0, y1, 5):
            off = (row % 2) * 4
            for x in range(x0 - off, x1, 8):
                bx0, bx1 = max(x0, x + 1), min(x1, x + 7)
                by1 = min(y1, y + 3)
                if bx1 <= bx0:
                    continue
                d.rectangle((bx0, y, bx1, by1), fill=self.rng.choice(tones))
                d.line((bx0, y, bx1, y), fill=(light if not shade else base))
            row += 1

    def plaster(self, x0, y0, x1, y1, shade=False):
        """Rendered wall: flat tone, a little wear at the base, a lit edge."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        if x1 <= x0 or y1 <= y0:
            return
        d.rectangle((x0, y0, x1, y1), fill=base if shade else light)
        d.line((x0, y0, x0, y1), fill=hi if not shade else light)
        d.line((x1, y0, x1, y1), fill=sh)
        d.rectangle((x0, y1 - 5, x1, y1), fill=base if not shade else sh)
        for _ in range((x1 - x0) // 10):
            x = self.rng.randrange(x0 + 2, max(x0 + 3, x1 - 4))
            y = self.rng.randrange(y1 - 12, y1 - 5)
            d.rectangle((x, y, x + self.rng.randrange(2, 5), y + 1), fill=base)

    def arch(self, cx, top, w, h, orders=1, dark_inside=True):
        """Round-arched opening with receding orders."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        for o in range(orders, 0, -1):
            ww = w + o * 4
            x0, x1 = cx - ww // 2, cx + ww // 2
            y0 = top - o * 2
            tone = light if o % 2 else sh
            d.rectangle((x0, y0 + ww // 2, x1, y0 + h), fill=tone)
            d.ellipse((x0, y0, x1, y0 + ww), fill=tone)
            d.arc((x0, y0, x1, y0 + ww), 180, 360, fill=hi if o % 2 else base)
        x0, x1 = cx - w // 2, cx + w // 2
        inner = '#26221c' if dark_inside else '#3a4a50'
        d.rectangle((x0, top + w // 2, x1, top + h), fill=inner)
        d.ellipse((x0, top, x1, top + w), fill=inner)
        d.line((x0, top + w // 2, x0, top + h), fill=OUTLINE)

    def window(self, cx, top, h=11):
        self.arch(cx, top, 5, h, orders=1, dark_inside=False)
        self.d.line((cx, top + 4, cx, top + h - 1), fill='#5b7078')

    def square_window(self, cx, top, w=5, h=8):
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        d.rectangle((cx - w // 2 - 1, top - 1, cx + w // 2 + 1, top + h + 1), fill=sh)
        d.rectangle((cx - w // 2, top, cx + w // 2, top + h), fill='#3a4a50')
        d.line((cx - w // 2 - 1, top - 1, cx + w // 2 + 1, top - 1), fill=hi)
        d.line((cx, top + 1, cx, top + h - 1), fill='#5b7078')

    def corbel_table(self, x0, x1, y):
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        for x in range(x0 + 2, x1 - 2, 5):
            d.rectangle((x, y, x + 2, y + 2), fill=dark)
            d.point((x, y), fill=light)

    def cross(self, ax, ay):
        d = self.d
        d.rectangle((ax, ay - 9, ax, ay - 1), fill=OUTLINE)
        d.rectangle((ax - 2, ay - 7, ax + 2, ay - 7), fill=OUTLINE)
        d.point((ax, ay - 9), fill='#e6dcc2')

    def bell(self, cx, top):
        d = self.d
        d.polygon([(cx - 2, top), (cx + 2, top), (cx + 4, top + 6), (cx - 4, top + 6)], fill=BELL[1], outline=BELL[0])
        d.line((cx - 1, top + 1, cx - 1, top + 4), fill=BELL[2])
        d.point((cx, top + 7), fill=BELL[0])

    # --- roofs -------------------------------------------------------------
    def slate(self, polygon, shade=0):
        pal = ROOFS[self.r['roofMaterial']]
        mask = Image.new('L', self.im.size)
        ImageDraw.Draw(mask).polygon(polygon, fill=255)
        layer = Image.new('RGBA', self.im.size)
        ld = ImageDraw.Draw(layer)
        ld.rectangle((0, 0, self.w, self.h), fill=pal[0])
        ys = [p[1] for p in polygon]
        for row, y in enumerate(range(min(ys), max(ys) + 4, 4)):
            for col, x in enumerate(range(-4 + (row % 2) * 3, self.w + 4, 6)):
                t = pal[2 + shade] if self.rng.random() < .75 else pal[1 + shade]
                ld.rectangle((x, y, x + 4, y + 3), fill=t)
                ld.line((x, y, x + 3, y), fill=pal[3 + shade] if shade < 1 else pal[3])
                ld.point((x + 4, y + 3), fill=pal[0])
        self.im.paste(layer, (0, 0), mask)
        self.d.line(polygon + [polygon[0]], fill=pal[0])

    def gable_roof(self, x0, x1, eave, ridge_y):
        pal = ROOFS[self.r['roofMaterial']]
        self.slate([(x0 - 3, eave), (x0 + 8, ridge_y), (x1 - 8, ridge_y), (x1 + 3, eave)])
        self.d.line((x0 + 8, ridge_y - 1, x1 - 8, ridge_y - 1), fill=pal[4])
        self.d.line((x0 - 3, eave, x1 + 3, eave), fill=pal[0], width=2)
        self.d.line((x0 - 2, eave + 1, x1 + 2, eave + 1), fill=pal[3])

    # --- basilica ----------------------------------------------------------
    def nave(self):
        r = self.r
        tower = r['tower']
        tw = self.tower_w - 2
        left = 4 + (tw if tower == 'west' else 0)
        right = self.w - 8 - (self.apse_w if r['apse'] else 0) - (tw if tower == 'east' else 0)
        top = self.ground - r['naveHeight'] - self.rise
        self.courses(left, top, right, self.ground)
        ink, sh, light = self.p['foundation']
        self.d.rectangle((left, self.ground - 4, right, self.ground), fill=ink)
        self.d.line((left, self.ground - 4, right, self.ground - 4), fill=light)
        if r['lesenes']:
            for x in range(left + 2, right - 4, max(12, (right - left) // (r['bays'] + 1))):
                self.d.rectangle((x, top, x + 2, self.ground - 4), fill=self.p['wall'][3])
                self.d.line((x + 2, top, x + 2, self.ground - 4), fill=self.p['wall'][1])
        if r['corbels']:
            self.corbel_table(left, right, top + 1)
        self.gable_roof(left, right, top, top - r['roofPitch'] - self.rise // 2)
        cx = r['entrance'][0] * 16 + 8 if self.facing == 'south' else (left + right) // 2
        span = right - left
        for i in range(r['bays']):
            wx = left + span * (i + 1) // (r['bays'] + 1)
            if abs(wx - cx) > 10 or self.facing != 'south':
                self.window(wx, top + 12)
        if self.facing == 'south':
            self.arch(cx, self.ground - 26, 10, 25, orders=2)
        else:
            self.window(cx, top + 12)
        return left, right, top

    def apse(self, right, top):
        d = self.d
        x0, x1 = right - 2, right + self.apse_w - 2
        atop = top + 10
        self.courses(x0, atop, x1, self.ground, shade=True)
        self.courses(x0, atop, x0 + 8, self.ground)
        pal = ROOFS[self.r['roofMaterial']]
        mid = (x0 + x1) // 2
        self.slate([(x0 - 2, atop), (mid - 4, atop - 14 - self.rise // 3), (x1 - 4, atop - 8), (x1 + 2, atop)], shade=1)
        d.line((x0 - 2, atop, x1 + 2, atop), fill=pal[0], width=2)
        for wx in range(x0 + 9, x1 - 6, 12):
            self.window(wx, atop + 10, 9)
        ink, sh2, l2 = self.p['foundation']
        d.rectangle((x0, self.ground - 4, x1, self.ground), fill=ink)

    def tower(self, left):
        r = self.r
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        tw = self.tower_w
        x0 = 4 if r['tower'] == 'west' else self.w - tw - 6
        x1 = x0 + tw
        top = self.ground - r['towerHeight'] - self.rise
        self.courses(x0, top, x1 - 6, self.ground)
        self.courses(x1 - 6, top, x1, self.ground, shade=True)
        d.line((x0, top + 22, x1, top + 22), fill=light)
        d.line((x0, top + 23, x1, top + 23), fill=dark)
        mid = (x0 + x1) // 2
        for cx in (mid - 5, mid + 5):
            self.arch(cx, top + 8, 5, 12, orders=1)
        d.rectangle((mid - 1, top + 10, mid, top + 20), fill=light)
        for wy in range(top + 40, self.ground - 30, 34):
            self.window(mid, wy, 10)
        if r['corbels']:
            self.corbel_table(x0, x1, top + 1)
        ink, sh2, l2 = self.p['foundation']
        d.rectangle((x0, self.ground - 4, x1, self.ground), fill=ink)
        d.line((x0, self.ground - 4, x1, self.ground - 4), fill=l2)
        pal = ROOFS[self.r['roofMaterial']]
        if r['towerRoof'] == 'pyramid':
            apex = (mid, top - tw // 2 - 11)
            self.slate([(x0 - 2, top), apex, (x1 + 2, top)])
            d.line((x0 - 2, top, apex[0], apex[1]), fill=pal[4])
            d.line((apex[0], apex[1], x1 + 2, top), fill=pal[0])
        else:
            self.gable_roof(x0, x1, top, top - 18)
            apex = (mid, top - 18)
        if r['finial'] == 'cross':
            self.cross(*apex)
        d.line((x0 - 2, top, x1 + 2, top), fill=pal[0], width=2)

    def basilica(self):
        left, right, top = self.nave()
        if self.r['apse']:
            self.apse(right, top)
        if self.r['tower'] != 'none':
            self.tower(left)

    # --- mission -----------------------------------------------------------
    def mission_tower(self, x0, top):
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        tw = self.tower_w
        x1 = x0 + tw
        mid = (x0 + x1) // 2
        self.plaster(x0, top, x1 - 5, self.ground)
        self.plaster(x1 - 5, top, x1, self.ground, shade=True)
        # Belfry stage: arched openings with bells, a cornice, a tiled cupola.
        d.line((x0, top + 24, x1, top + 24), fill=sh)
        d.line((x0, top + 23, x1, top + 23), fill=hi)
        for cx in ((mid,) if tw < 40 else (mid - 7, mid + 7)):
            self.arch(cx, top + 6, 7, 14, orders=1)
            self.bell(cx, top + 9)
        self.square_window(mid, top + 44, 5, 9)
        pal = ROOFS[self.r['roofMaterial']]
        d.ellipse((x0 - 2, top - tw // 2, x1 + 2, top + 8), fill=pal[2], outline=pal[0])
        d.rectangle((x0 - 3, top - 1, x1 + 3, top + 2), fill=light)
        d.line((x0 - 3, top - 1, x1 + 3, top - 1), fill=hi)
        d.rectangle((x0, top + 2, x1, top + 4), fill=sh)
        d.arc((x0 - 2, top - tw // 2, x1 + 2, top + 8), 200, 300, fill=pal[3])
        for x in range(x0 + 4, x1 - 2, 7):
            d.line((x, top - tw // 4, x, top - 2), fill=pal[1])
        d.rectangle((mid - 1, top - tw // 2 - 6, mid + 1, top - tw // 2 + 1), fill=light, outline=sh)
        if self.r['finial'] == 'cross':
            self.cross(mid, top - tw // 2 - 6)
        ink, sh2, l2 = self.p['foundation']
        d.rectangle((x0, self.ground - 3, x1, self.ground), fill=ink)

    def espadana(self, cx, top):
        """Bell gable: a pierced wall above the facade holding the bells."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        w = 30
        x0, x1 = cx - w // 2, cx + w // 2
        d.polygon([(x0, top), (x0, top - 22), (x0 + 6, top - 22), (x0 + 8, top - 30), (cx - 3, top - 30), (cx, top - 36), (cx + 3, top - 30), (x1 - 8, top - 30), (x1 - 6, top - 22), (x1, top - 22), (x1, top)], fill=light, outline=sh)
        for bx in (cx - 8, cx + 8):
            self.arch(bx, top - 20, 6, 14, orders=1)
            self.bell(bx, top - 17)
        if self.r['finial'] == 'cross':
            self.cross(cx, top - 36)

    def mission(self):
        r = self.r
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        towers = r['towers']
        tw = self.tower_w
        left = 4 + (tw if towers in ('one', 'twin') else 0)
        right = self.w - 8 - (tw if towers == 'twin' else 0)
        top = self.ground - r['naveHeight'] - self.rise
        # The facade stays centred on the nave whichever way the door faces;
        # a side-facing frame keeps its gable and bells, only the portal moves.
        cx = r['entrance'][0] * 16 + 8 if self.facing == 'south' else (left + right) // 2
        self.plaster(left, top, right, self.ground)
        # Buttress strips and a stone plinth.
        for x in range(left + 3, right - 6, max(14, (right - left) // (r['bays'] + 1))):
            d.rectangle((x, top + 6, x + 3, self.ground - 3), fill=base)
            d.line((x, top + 6, x, self.ground - 3), fill=hi)
        ink, sh2, l2 = self.p['foundation']
        d.rectangle((left, self.ground - 3, right, self.ground), fill=ink)
        d.line((left, self.ground - 3, right, self.ground - 3), fill=l2)
        pal = ROOFS[self.r['roofMaterial']]
        self.gable_roof(left, right, top, top - r['roofPitch'] - self.rise // 2)
        if r['dome']:
            dm = (left + right) // 2 + 10
            dw = min(40, (right - left) // 2)
            dt = top - r['roofPitch'] - self.rise // 2
            d.ellipse((dm - dw // 2, dt - dw // 2 - 6, dm + dw // 2, dt + 6), fill=pal[2], outline=pal[0])
            d.arc((dm - dw // 2, dt - dw // 2 - 6, dm + dw // 2, dt + 6), 200, 320, fill=pal[3], width=2)
            for x in range(dm - dw // 2 + 6, dm + dw // 2 - 2, 8):
                d.line((x, dt - dw // 4, x, dt + 2), fill=pal[1])
            d.rectangle((dm - 2, dt - dw // 2 - 12, dm + 2, dt - dw // 2 - 5), fill=light, outline=sh)
            self.cross(dm, dt - dw // 2 - 12)
        # Front gable over the portal, plain or with baroque scrolls.
        gx0, gx1 = cx - 22, cx + 22
        if r['gable'] == 'baroque':
            d.polygon([(gx0, top + 2), (gx0, top - 6), (gx0 + 6, top - 6), (gx0 + 9, top - 14), (gx0 + 14, top - 14), (cx - 4, top - 24), (cx + 4, top - 24), (gx1 - 14, top - 14), (gx1 - 9, top - 14), (gx1 - 6, top - 6), (gx1, top - 6), (gx1, top + 2)], fill=light, outline=sh)
            d.line((gx0 + 1, top - 5, gx1 - 1, top - 5), fill=hi)
            for sx in (gx0 + 7, gx1 - 9):
                d.ellipse((sx - 2, top - 12, sx + 2, top - 8), outline=sh)
            if r['finial'] == 'cross' and towers == 'none':
                self.cross(cx, top - 24)
        else:
            d.polygon([(gx0, top + 2), (cx, top - 16), (gx1, top + 2)], fill=light, outline=sh)
        if towers == 'espadana':
            self.espadana(cx, top - (24 if r['gable'] == 'baroque' else 16) + 2)
        # Portal with a stone surround and a niche above it.
        if self.facing == 'south':
            self.arch(cx, self.ground - 28, 10, 27, orders=2)
            if r['niche']:
                self.arch(cx, self.ground - 46, 5, 10, orders=1)
                d.rectangle((cx - 1, self.ground - 43, cx + 1, self.ground - 38), fill=light)
            d.line((cx - 13, top + 4, cx + 13, top + 4), fill=sh)
        span = right - left
        for i in range(r['bays']):
            wx = left + span * (i + 1) // (r['bays'] + 1)
            if abs(wx - cx) > 16 or self.facing != 'south':
                self.square_window(wx, top + 14)
        ttop = self.ground - r['towerHeight'] - self.rise
        if towers in ('one', 'twin'):
            self.mission_tower(4, ttop)
        if towers == 'twin':
            self.mission_tower(self.w - tw - 6, ttop)

    # --- platform ----------------------------------------------------------
    def platform(self):
        r = self.r
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        tiers, th = r['tiers'], r['tierHeight']
        earth = r['face'] == 'earth'
        cx = self.w // 2
        inset = max(6, (self.w // 2 - 10) // max(1, tiers))
        stair_w = max(14, self.w // 6)
        y = self.ground
        summit_top = None
        for t in range(tiers):
            x0, x1 = 4 + t * inset, self.w - 8 - t * inset
            face_top = y - th
            # Front face of the tier, then its tread which reads as the top.
            if earth:
                d.rectangle((x0, face_top, x1, y), fill=self.p['wall'][2])
                d.rectangle((x1 - 4, face_top, x1, y), fill=self.p['wall'][1])
                for _ in range((x1 - x0) // 6):
                    gx = self.rng.randrange(x0, x1 - 2)
                    gy = self.rng.randrange(face_top + 1, y - 1)
                    d.line((gx, gy, gx + 1, gy), fill=self.p['wall'][3 if self.rng.random() < .6 else 1])
                d.rectangle((x0, face_top - 4, x1, face_top), fill=GRASS[2])
                d.line((x0, face_top - 4, x1, face_top - 4), fill=GRASS[3])
                d.line((x0, face_top, x1, face_top), fill=GRASS[0])
                for gx in range(x0 + 3, x1 - 2, 9):
                    d.line((gx, face_top - 3, gx, face_top - 1), fill=GRASS[1])
            else:
                self.courses(x0, face_top, x1 - 5, y)
                self.courses(x1 - 5, face_top, x1, y, shade=True)
                d.rectangle((x0, face_top - 3, x1, face_top), fill=light)
                d.line((x0, face_top - 3, x1, face_top - 3), fill=hi)
                d.line((x0, face_top, x1, face_top), fill=dark)
            y = face_top - (4 if earth else 3)
            summit_top = y
        # Stairway up the front, full height, with balustrades on stone.
        stairs = [cx] if r['stair'] == 'single' else [cx - self.w // 5, cx + self.w // 5]
        for sx in stairs:
            s0, s1 = sx - stair_w // 2, sx + stair_w // 2
            d.rectangle((s0, summit_top, s1, self.ground), fill=base if not earth else self.p['wall'][2])
            for sy in range(summit_top + 2, self.ground, 3):
                d.line((s0 + 1, sy, s1 - 1, sy), fill=hi if not earth else self.p['wall'][3])
                d.line((s0 + 1, sy + 1, s1 - 1, sy + 1), fill=sh)
            if r['balustrade'] and not earth:
                for bx in (s0 - 3, s1 + 1):
                    d.rectangle((bx, summit_top - 2, bx + 2, self.ground), fill=light, outline=dark)
        # Summit temple.
        pal = ROOFS['thatch' if r['summit'] == 'thatch-temple' else self.r['roofMaterial']]
        tx0, tx1 = cx - self.w // 5, cx + self.w // 5
        if r['summit'] == 'thatch-temple':
            wt = summit_top - 18
            d.rectangle((tx0, wt, tx1, summit_top), fill='#a3865c', outline='#4a3c2a')
            d.rectangle((cx - 4, summit_top - 12, cx + 4, summit_top), fill='#26221c')
            th_pal = ROOFS['thatch']
            self.r_roof = th_pal
            d.polygon([(tx0 - 6, wt), (cx, wt - 22), (tx1 + 6, wt)], fill=th_pal[2], outline=th_pal[0])
            for ty in range(wt - 18, wt, 4):
                d.line((cx - (wt - ty) // 2 + 2, ty, cx + (wt - ty) // 2 - 2, ty), fill=th_pal[3])
        elif r['summit'] == 'stone-temple':
            wt = summit_top - 22
            self.courses(tx0, wt, tx1 - 4, summit_top)
            self.courses(tx1 - 4, wt, tx1, summit_top, shade=True)
            # Trapezoidal doorway and a flat roof with a lit edge.
            d.polygon([(cx - 6, summit_top), (cx - 4, wt + 6), (cx + 4, wt + 6), (cx + 6, summit_top)], fill='#26221c')
            d.rectangle((tx0 - 2, wt - 4, tx1 + 2, wt), fill=light)
            d.line((tx0 - 2, wt - 4, tx1 + 2, wt - 4), fill=hi)
            d.line((tx0 - 2, wt, tx1 + 2, wt), fill=dark)
            if r['crest']:
                ct = wt - 4
                d.rectangle((tx0 + 4, ct - 16, tx1 - 4, ct), fill=base, outline=dark)
                for gx in range(tx0 + 7, tx1 - 6, 5):
                    d.rectangle((gx, ct - 13, gx + 1, ct - 4), fill=dark)
                d.line((tx0 + 4, ct - 16, tx1 - 4, ct - 16), fill=hi)

    def render(self):
        family = self.r['family']
        if family == 'mission':
            self.mission()
        elif family == 'platform':
            self.platform()
        else:
            self.basilica()
        if family != 'platform':
            if self.facing in ('east', 'west'):
                x = self.w - 11 if self.facing == 'east' else 3
                self.d.rectangle((x - 2, self.ground - 22, x + 3, self.ground), fill='#332e27')
                self.d.line((x - 3, self.ground - 23, x + 3, self.ground - 23), fill=self.p['wall'][3])
            elif self.facing == 'north':
                self.d.rectangle((self.w // 2 - 6, 4, self.w // 2 + 6, 7), fill=self.p['foundation'][1])
        self.d.line((5, self.ground + 1, self.w - 8, self.ground + 1), fill=(30, 34, 26, 155))
        return self.im


def expand(name, base):
    """One recipe becomes size x look variants; the base itself is kept as
    the medium default so a single frame name always exists."""
    scales = base.get('scales') or {'medium': {}}
    looks = base.get('looks') or [{}]
    out = {}
    for scale, sv in scales.items():
        for i, look in enumerate(looks):
            r = {k: v for k, v in base.items() if k not in ('scales', 'looks')}
            # The scale wins over the look: a small earth mound stays earth
            # whatever stone the look names.
            r.update(look)
            r.update(sv)
            out[f'{name}-{scale}-{i}'] = r
    return out


def religious_recipes(root, source):
    import json
    kit = json.loads((root / 'src/content/graphics/religious.json').read_text())
    source['materials'].update(kit.get('materials', {}))
    out = {}
    for base_name, base in kit['buildings'].items():
        for name, r in expand(base_name, base).items():
            # The largest buildings in the game: never past 14 cells a side.
            fw, fh = (max(3, min(14, int(v))) for v in r['footprint'])
            r = {**r, 'footprint': [fw, fh]}
            rise = max(0, fh - 5) * 6
            tower_w = min(16 * max(2, round(fw / 3.5)), fw * 16 // 3)
            fam = r['family']
            if fam == 'platform':
                height = r['tiers'] * (r['tierHeight'] + 4) + 50
            elif fam == 'mission':
                height = max(r['naveHeight'] + r['roofPitch'] + rise + 40,
                             r['towerHeight'] + rise + tower_w // 2 + 20 if r['towers'] in ('one', 'twin') else 0)
            else:
                height = max(r['naveHeight'] + r['roofPitch'] + rise,
                             r['towerHeight'] + rise + tower_w // 2 + 24 if r['tower'] != 'none' else 0)
            out[f'religious-{name}'] = {
                **r, 'canvas': [fw * 16, height + 20], 'height': height, 'roof': 'gable',
                'opening': 'door', 'attachments': [], 'religious': True, 'recipe': base_name,
            }
    return out
