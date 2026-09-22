"""Oblique parish church: a west tower standing forward of a nave and a lower
chancel, each a box with its front and right-hand wall showing.

Same projection as art/oblique.py: faces painted flat, then sheared a row or a
column at a time. The banner over the door is not baked in. The sprite leaves
a bare pole and publishes the rect; the runtime hangs a tinted banner there,
so its colours can follow the region and the year.
"""
import random
from PIL import Image, ImageDraw
from art.buildings import ROOFS, DOOR_W, DOOR_H
from art.oblique import h2
from art.oblique_style import K, side_depth

IRON = '#1f2326'
LEAD = ['#3c4347', '#5a6368', '#7b858a', '#a3acae']
BANNER_W, BANNER_H = 11, 20


def build_banner(sprites):
    """White cloth and a white cross, tinted apart at runtime."""
    cloth = Image.new('RGBA', (BANNER_W, BANNER_H)); d = ImageDraw.Draw(cloth)
    d.rectangle((0, 0, BANNER_W - 1, BANNER_H - 4), fill='#ffffff')
    d.polygon([(0, BANNER_H - 4), (BANNER_W - 1, BANNER_H - 4), (BANNER_W // 2, BANNER_H - 1)], fill='#ffffff')
    d.line((BANNER_W - 1, 1, BANNER_W - 1, BANNER_H - 5), fill='#c9c9c9')
    d.line((BANNER_W - 3, 2, BANNER_W - 3, BANNER_H - 6), fill='#e4e4e4')
    d.line((0, 0, BANNER_W - 1, 0), fill='#b0b0b0')
    sprites['church-banner-cloth'] = cloth
    cross = Image.new('RGBA', (BANNER_W, BANNER_H)); d = ImageDraw.Draw(cross)
    d.rectangle((BANNER_W // 2 - 1, 3, BANNER_W // 2, 13), fill='#ffffff')
    d.rectangle((2, 6, BANNER_W - 3, 7), fill='#ffffff')
    sprites['church-banner-cross'] = cross


def darker(material):
    w = material['wall']
    return dict(material, wall=[w[0], w[0], w[1], w[2], w[3]])


class ObliqueChurch:
    def __init__(self, recipe, material):
        self.r, self.p = recipe, material
        self.rng = random.Random(recipe['seed'])
        fw, fh = recipe['footprint']
        self.fw = fw * 16
        self.tw = 16 * (2 if fw < 9 else 3 if fw < 13 else 4)
        self.th = recipe['towerHeight']
        self.nave_h = recipe['naveHeight']
        self.chancel_h = self.nave_h - 12
        self.sw = side_depth(fh, deep=True)
        self.rise = 26
        self.tower_side = 12
        self.set_back = 16
        self.top = recipe.get('towerTop', 'battlement')
        self.roof = recipe['roofMaterial'] if recipe['roofMaterial'] in ROOFS else 'slate'
        self.ox = 6
        # The tower door is the only door drawn, whichever way the lot faces.
        slot = recipe['entrance'][0] if recipe.get('facing', 'south') == 'south' else fw // 2
        self.door_x = self.ox + slot * 16 + 8
        self.tx = self.door_x - self.ox - self.tw // 2
        cap = self.tw // 2 + 14 if self.top == 'pyramid' else 8
        self.w = self.ox + self.fw + self.sw + 14
        self.h = self.th + self.tw // 2 + cap + 12
        self.bottom = self.h - 6
        self.anchor_x = self.ox + self.fw / 2
        self.im = Image.new('RGBA', (self.w, self.h))
        self.d = ImageDraw.Draw(self.im)

    def proj(self, x, y, z):
        return (round(self.ox + x + y * K), round(self.bottom - z - y * K))

    # -- stone -------------------------------------------------------------

    def stone(self, width, height, material, front):
        """Coursed ashlar: long blocks in level rows, broken bond, a plinth."""
        im = Image.new('RGBA', (width, height)); d = ImageDraw.Draw(im)
        dark, shade, base, light, hi = material['wall']
        d.rectangle((0, 0, width - 1, height - 1), fill=shade)
        for j, y in enumerate(range(height - 5, -5, -5)):
            x = -((j * 5) % 9) - self.rng.randrange(0, 3)
            while x < width:
                wide = self.rng.randrange(6, 11)
                tone = self.rng.choice([base, base, base, light, light, hi] if front else [base, base, light])
                d.rectangle((x, y, x + wide - 2, y + 3), fill=tone)
                if front and tone != hi: d.line((x, y, x + wide - 3, y), fill=hi if tone == light else light)
                if self.rng.random() < .12: d.rectangle((x + 1, y + 1, x + wide - 3, y + 3), fill=shade)
                x += wide
        ink, fshade, flight = material['foundation']
        d.rectangle((0, height - 6, width - 1, height - 1), fill=ink)
        for x in range(0, width, 10):
            d.rectangle((x, height - 6, min(x + 8, width - 1), height - 3), fill=fshade)
            d.line((x, height - 6, min(x + 8, width - 1), height - 6), fill=flight)
        if front: d.line((0, 0, 0, height - 1), fill=dark)
        else: d.line((width - 1, 0, width - 1, height - 1), fill=dark)
        return im, d

    def lancet(self, d, x, y, w, h, material, louvre=False):
        """A pointed window: a dressed surround, dark glass, a lit sill."""
        dark, shade, base, light, hi = material['wall']
        mid = x + w // 2
        d.rectangle((x - 1, y + 3, x + w, y + h), fill=hi)
        d.polygon([(x - 1, y + 3), (mid - 1, y - 2), (mid, y - 2), (x + w, y + 3)], fill=hi)
        d.rectangle((x, y + 3, x + w - 1, y + h - 1), fill='#1c2a33')
        d.polygon([(x, y + 3), (mid - 1, y), (mid, y), (x + w - 1, y + 3)], fill='#1c2a33')
        if louvre:
            for yy in range(y + 3, y + h - 1, 3): d.line((x, yy, x + w - 1, yy), fill='#6b4a2c')
        else:
            d.rectangle((x + 1, y + 4, x + w - 1, y + h - 1), fill='#2f4a58')
            d.line((mid, y + 2, mid, y + h - 1), fill='#1c2a33') if w > 4 else None
            d.point((x + 1, y + 5), fill='#8fb0b8')
        d.line((x - 2, y + h + 1, x + w + 1, y + h + 1), fill=hi)
        d.line((x - 2, y + h + 2, x + w + 1, y + h + 2), fill=dark)
        d.line((x + w, y + 4, x + w, y + h), fill=shade)

    def doorway(self, d, cx, ground, material):
        dark, shade, base, light, hi = material['wall']
        x = cx - DOOR_W // 2; top = ground - DOOR_H - 1
        # Moulded jambs and a pointed head over a square-headed door.
        d.rectangle((x - 4, top - 2, x + DOOR_W + 4, ground), fill=hi)
        d.polygon([(x - 4, top - 2), (cx, top - 13), (cx + 1, top - 13), (x + DOOR_W + 4, top - 2)], fill=hi)
        d.rectangle((x - 2, top, x + DOOR_W + 2, ground), fill=shade)
        d.polygon([(x - 2, top), (cx, top - 9), (cx + 1, top - 9), (x + DOOR_W + 2, top)], fill=shade)
        d.polygon([(x, top), (cx, top - 6), (cx + 1, top - 6), (x + DOOR_W, top)], fill=dark)
        d.rectangle((x, top, x + DOOR_W, ground), fill='#312d27')
        d.rectangle((x + 1, top + 1, x + DOOR_W, ground), fill='#453b2d')
        for xx in range(x + 2, x + DOOR_W, 3): d.line((xx, top + 2, xx, ground), fill='#685237')
        d.line((cx, top + 1, cx, ground), fill='#25201a')
        for yy in (top + 5, ground - 6):
            d.line((x + 1, yy, x + 4, yy), fill=IRON); d.line((x + DOOR_W - 3, yy, x + DOOR_W, yy), fill=IRON)
        d.line((x - 4, top - 2, x - 4, ground), fill=light)

    # -- boxes -------------------------------------------------------------

    def shear_side(self, side, x, y):
        for c in range(side.width):
            self.im.alpha_composite(side.crop((c, 0, c + 1, side.height)), (x + c, y - c))

    def hall(self, x0, width, wh, windows, east_window):
        """A gabled box set back from the tower's face."""
        sw, rise = self.sw, self.rise
        gx, gy = self.proj(x0 + width, self.set_back, 0)
        mat = darker(self.p)
        side, sd = self.stone(sw, wh + rise, mat, False)
        if east_window:
            self.lancet(sd, sw // 2 - 3, rise + 8, 6, 16, mat)
        px = side.load()
        for x in range(sw):
            rake = round(rise * abs(x + .5 - sw / 2) / (sw / 2))
            for y in range(rake): px[x, y] = (0, 0, 0, 0)
            for i, tone in enumerate((mat['wall'][0], mat['wall'][0], mat['wall'][1])):
                if rake + i < wh + rise - 6: sd.point((x, rake + i), fill=tone)
        self.shear_side(side, gx, gy - (wh + rise) - 1)
        front, fd = self.stone(width, wh, self.p, True)
        dark, shade = self.p['wall'][0], self.p['wall'][1]
        for x in windows:
            self.lancet(fd, x, wh - 33, 5, 18, self.p)
        for x in range(0, width, max(24, width // 4)):
            # Stepped buttresses between the bays.
            fd.rectangle((x, 10, x + 3, wh - 1), fill=self.p['wall'][3])
            fd.line((x + 4, 12, x + 4, wh - 1), fill=dark)
            fd.line((x, 10, x + 3, 10), fill=self.p['wall'][4])
            fd.rectangle((x - 1, wh // 2, x + 4, wh - 1), fill=self.p['wall'][3])
            fd.line((x + 5, wh // 2 + 2, x + 5, wh - 1), fill=dark)
        self.im.alpha_composite(front, (gx - width, gy - wh))
        d = self.d
        over, verge = 3, 2
        drop = round(over * rise / sw)
        depth = sw / K
        pal = ROOFS[self.roof]
        y0 = self.set_back
        ex, ey = self.proj(x0 + width + verge, y0 - over, wh - drop)
        rx, ry = self.proj(x0 + width + verge, y0 + depth / 2, wh + rise)
        bx, by = self.proj(x0 + width + verge, y0 + depth + over, wh - drop)
        d.polygon([(rx, ry), (bx, by), (bx, by + 3), (rx, ry + 3)], fill=pal[1])
        d.line((rx, ry, bx, by), fill=pal[3]); d.line((rx, ry + 3, bx, by + 3), fill=pal[0])
        d.polygon([(ex, ey), (rx, ry), (rx, ry + 3), (ex, ey + 3)], fill=pal[1])
        rows = ey - ry
        lx = self.proj(x0 - verge, y0 - over, 0)[0]
        roof = Image.new('RGBA', (width + 2 * verge, rows + 2)); rd = ImageDraw.Draw(roof)
        rd.rectangle((0, 0, roof.width, rows), fill=pal[0])
        n = rows // 4 + 1
        for row in range(n):
            y = 2 + row * 4
            for col, x in enumerate(range(-3 + (row % 2) * 2, roof.width + 3, 5)):
                step = max(0, 3 - round(row / max(n - 1, 1) * 3) - ((col + row) % 3 == 0))
                rd.rectangle((x, y, x + 3, y + 3), fill=pal[step])
                rd.line((x, y, x + 2, y), fill=pal[min(4, step + 1)])
                rd.line((x + 3, y + 1, x + 3, y + 3), fill=pal[max(0, step - 1)])
        rd.rectangle((0, 0, roof.width, 2), fill=pal[0])
        for x in range(0, roof.width, 5):
            rd.line((x, 0, x + 3, 0), fill=pal[4]); rd.line((x, 1, x + 3, 1), fill=pal[3])
        rd.line((0, rows, roof.width, rows), fill=pal[1]); rd.line((0, rows + 1, roof.width, rows + 1), fill=pal[0])
        lean = rx - ex
        for r in range(roof.height):
            shift = round((rows - 1 - min(r, rows - 1)) * lean / (rows - 1))
            self.im.alpha_composite(roof.crop((0, r, roof.width, r + 1)), (lx + shift, ry + r))
        # Eave shade on the wall below.
        skin = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in self.p['wall']}
        pix = self.im.load()
        for i, tone in enumerate((dark, dark, shade, shade)):
            for x in range(gx - width, gx):
                y = ey + 2 + i
                if pix[x, y][:3] in skin: d.point((x, y), fill=tone)
        return rx, ry

    def tower(self):
        tw, th, d = self.tw, self.th, self.d
        sw = self.tower_side
        gx, gy = self.proj(self.tx + tw, 0, 0)
        mat = darker(self.p)
        dark, shade, base, light, hi = self.p['wall']
        side, sd = self.stone(sw, th, mat, False)
        self.lancet(sd, sw // 2 - 3, 10, 6, 14, mat, louvre=True)
        self.lancet(sd, sw // 2 - 2, th // 2, 4, 12, mat)
        for y in (30, th // 2 + 22):
            sd.line((0, y, sw, y), fill=mat['wall'][4]); sd.line((0, y + 1, sw, y + 1), fill=mat['wall'][0])
        self.shear_side(side, gx, gy - th - 1)
        front, fd = self.stone(tw, th, self.p, True)
        for y in (30, th // 2 + 22):
            fd.line((0, y, tw, y), fill=hi); fd.line((0, y + 1, tw, y + 1), fill=dark)
        self.lancet(fd, tw // 2 - 4, 9, 8, 16, self.p, louvre=True)
        # Angle buttresses, stepping in as they climb.
        for edge in (0, tw - 4):
            for k, (top, out) in enumerate(((34, 0), (th // 2 + 24, 1), (th - 26, 2))):
                x = edge - out if edge == 0 else edge + out
                fd.rectangle((max(0, x), top, min(tw - 1, x + 3), th - 1), fill=light)
                fd.line((max(0, x), top, min(tw - 1, x + 3), top), fill=hi)
                fd.line((min(tw - 1, x + 4), top + 2, min(tw - 1, x + 4), th - 7), fill=dark)
        self.doorway(fd, tw // 2, th - 1, self.p)
        # The pole the banner hangs from.
        by = th - DOOR_H - 42
        fd.line((tw // 2 - 7, by, tw // 2 + 7, by), fill='#6b4a2c')
        fd.line((tw // 2 - 7, by + 1, tw // 2 + 7, by + 1), fill=IRON)
        self.im.alpha_composite(front, (gx - tw, gy - th))
        self.banner = [gx - tw + tw // 2 - BANNER_W // 2, gy - th + by + 2, BANNER_W, BANNER_H]
        fx, fy = gx - tw, gy - th
        if self.top == 'pyramid':
            pal = ROOFS[self.roof]
            deep = sw / K
            ax, ay = self.proj(self.tx + tw / 2, deep / 2, th + tw * .8)
            bx, by2 = self.proj(self.tx + tw, deep, th)
            d.polygon([(gx, fy), (bx, by2), (ax, ay)], fill=pal[1])
            d.polygon([(fx - 1, fy), (gx, fy), (ax, ay)], fill=pal[2])
            for t in range(1, 8):
                y = fy - round((fy - ay) * t / 8)
                xl = fx + round((ax - fx) * t / 8); xr = gx - round((gx - ax) * t / 8)
                d.line((xl, y, xr, y), fill=pal[1 if t % 2 else 3])
            d.line((fx - 1, fy, ax, ay), fill=pal[4]); d.line((gx, fy, ax, ay), fill=pal[0])
            d.line((fx - 2, fy, gx + 1, fy), fill=pal[0]); d.line((fx - 2, fy - 1, gx, fy - 1), fill=pal[3])
            tip = (ax, ay)
        else:
            # Lead flat inside a battlemented parapet: the far and left walls
            # show their inner faces, the near and right ones their merlons.
            d.polygon([(fx, fy), (gx, fy), (gx + sw, fy - sw), (fx + sw, fy - sw)], fill=LEAD[1])
            for c in range(sw):
                tall = 6 if (c // 4) % 2 == 0 else 2
                d.line((fx + c + 1, fy - c - tall, fx + c + 1, fy - c), fill=mat['wall'][1])
                d.point((fx + c + 1, fy - c - tall), fill=mat['wall'][3])
            for x in range(fx + sw, gx + sw):
                tall = 6 if ((x - fx - sw) // 4) % 2 == 0 else 2
                d.line((x, fy - sw - tall, x, fy - sw + 2), fill=mat['wall'][2])
                d.point((x, fy - sw - tall), fill=mat['wall'][4])
            d.line((fx + 3, fy - 1, gx - 2, fy - 1), fill=LEAD[0])
            for c in range(sw):
                tall = 6 if (c // 4) % 2 == 0 else 2
                d.line((gx + c, fy - c - tall, gx + c, fy - c), fill=mat['wall'][2])
                d.point((gx + c, fy - c - tall), fill=mat['wall'][4])
            d.rectangle((fx, fy - 2, gx - 1, fy), fill=base); d.line((fx, fy + 1, gx - 1, fy + 1), fill=dark)
            for x in range(fx, gx, 8):
                d.rectangle((x, fy - 7, min(x + 4, gx - 1), fy - 2), fill=light)
                d.line((x, fy - 7, min(x + 4, gx - 1), fy - 7), fill=hi)
                d.line((min(x + 5, gx - 1), fy - 6, min(x + 5, gx - 1), fy - 3), fill=dark)
            tip = (fx + tw // 2 + sw // 2, fy - sw // 2 - 4)
        return tip

    def cross(self, x, y):
        d = self.d
        d.line((x, y - 9, x, y), fill=IRON); d.line((x - 2, y - 6, x + 2, y - 6), fill=IRON)
        d.point((x, y - 9), fill='#c9a23f'); d.point((x - 2, y - 6), fill='#c9a23f')

    def render(self):
        gy = self.bottom
        self.d.line((self.ox + self.tx + 1, gy + 1, self.ox + self.tx + self.tw, gy + 1), fill=(30, 34, 26, 155))
        nave_w = round(self.fw * .66 / 8) * 8
        chancel_w = self.fw - nave_w - 8
        bays = max(2, nave_w // 26)
        nave_windows = [round((i + .5) * nave_w / bays) - 2 for i in range(bays)]
        # The tower hides a bay; no window behind it.
        shift = self.set_back * K
        nave_windows = [x for x in nave_windows if not (self.tx - 8 < x + shift < self.tx + self.tw + 2)]
        self.hall(0, nave_w, self.nave_h, nave_windows, False)
        ridge = self.hall(nave_w, chancel_w, self.chancel_h,
                          [round((i + .5) * chancel_w / 2) - 2 for i in range(2)], True)
        self.cross(*ridge)
        tip = self.tower()
        if self.top == 'pyramid': self.cross(*tip)
        top = min(y for y in range(self.h) if self.im.getpixel((self.door_x, y))[3])
        self.occlusion = [self.ox, top, self.ox + self.fw + self.sw // 2, gy - 1]
        return self.im
