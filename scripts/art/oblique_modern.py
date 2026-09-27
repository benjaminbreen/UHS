"""Gold masters for the industrial and modern city, drawn oblique.

    python3 scripts/art/oblique_modern.py out.png      # the review sheet

Three standards: a brick commercial block of about 1895, a sawtooth weaving
shed of about 1910 with its stack, and a curtain-wall office tower of about
1960 assembled from a base, a repeating storey and a crown. Each painter also
fills an emissive layer, the windows lit after dark, so night is one overlay
per building rather than a second sprite.
"""
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.buildings import DOOR_W, DOOR_H  # noqa: E402
from art.oblique_style import STOREY, side_depth  # noqa: E402

BRICK = ['#3f1d16', '#62301f', '#83412c', '#9c5238', '#b86a4a']
COMMON = ['#321a15', '#472619', '#55301f', '#5d3522', '#673c26']
STONE = ['#5f5a4f', '#8a8473', '#b3ac96', '#d2cbb3', '#e9e2c9']
MORTAR = '#8e8272'
CORNICE = ['#18211e', '#27352f', '#3b4e45', '#55705f', '#7a957f']
SHOP = ['#241012', '#3f1a1a', '#5e2624', '#7e3630', '#9c4c3f']
GLASS = ['#1b2a31', '#2d4751', '#476d7b', '#7aa3ab', '#b7d3d0']
TAR = ['#26241f', '#34312a', '#423e35', '#555046']
AWNING = ('#2f6147', '#e4d9bb')
WARM = ['#8a5a26', '#d49a48', '#f2c774', '#fde7a8']
COOL = ['#6d7f86', '#b9cbc8', '#e3efe6']
SLATE = ['#262b31', '#353c44', '#46505a', '#5b6772', '#75838d']
STEEL = ['#20282b', '#34403f', '#4d5b58', '#6f7e78']
CURTAIN = ['#12242c', '#1d3a45', '#2a5563', '#3d7383', '#5f97a3', '#a5cccc']
SPANDREL = ['#14191c', '#1f272b', '#2c3639', '#3c4a4c']
ALUMINIUM = ['#6d7478', '#9aa2a4', '#c8cdcb', '#e6e8e2']
TRAVERTINE = ['#7c7462', '#a89d84', '#cbc0a4', '#e3dac0', '#f1ead3']


def h2(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65536


class Face:
    """One flat wall, drawn square on. `em` holds what glows after dark."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h))
        self.em = Image.new('RGBA', (w, h))
        self.d = ImageDraw.Draw(self.im)
        self.e = ImageDraw.Draw(self.em)

    def rect(self, x0, y0, x1, y1, c):
        if x1 >= x0 and y1 >= y0:
            self.d.rectangle((x0, y0, x1, y1), fill=c)

    def px(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.d.point((x, y), fill=c)

    def glow(self, x0, y0, x1, y1, ramp=WARM):
        """A lit room: brighter at the top where the ceiling lamp is."""
        if x1 < x0 or y1 < y0:
            return
        self.e.rectangle((x0, y0, x1, y1), fill=ramp[1])
        self.e.rectangle((x0, y0, x1, y0 + max(0, (y1 - y0) // 3)), fill=ramp[2])
        self.e.line((x0, y0, x1, y0), fill=ramp[0])


def brick_wall(f, x0, y0, x1, y1, pal, seed, course=3, stretch=8, mortar=MORTAR):
    """Stretcher bond: a course every three pixels, each brick its own fired
    tone, mortar joints only on alternate heads so the wall is not a grid."""
    for y in range(y0, y1 + 1):
        row = (y - y0) // course
        joint = (y - y0) % course == course - 1
        for x in range(x0, x1 + 1):
            b = (x + (row % 2) * (stretch // 2)) // stretch
            if joint:
                c = pal[1] if h2(x, y, seed) < 0.55 else mortar
            elif (x + (row % 2) * (stretch // 2)) % stretch == 0 and h2(b, row, seed + 1) < 0.5:
                c = pal[1]
            else:
                v = h2(b, row, seed)
                c = pal[3] if v < 0.18 else pal[2] if v < 0.8 else pal[4] if v < 0.9 else pal[1]
            f.px(x, y, c)


def sash(f, x, y, w, h, lit, frame=STONE):
    """A one-over-one sash in a painted frame; the lower sash is the dark of
    the room, the upper one holds the sky."""
    f.rect(x - 1, y - 1, x + w, y + h, frame[0])
    f.rect(x, y, x + w - 1, y + h - 1, GLASS[1])
    f.rect(x, y, x + w - 1, y + h // 2 - 1, GLASS[2])
    f.px(x, y, GLASS[3])
    f.px(x + 1, y, GLASS[4])
    f.rect(x, y + h // 2, x + w - 1, y + h // 2, frame[3])
    f.rect(x, y + h // 2 + 1, x + w - 1, y + h // 2 + 1, GLASS[0])
    if lit:
        f.glow(x, y, x + w - 1, y + h - 1)
        f.e.line((x, y + h // 2, x + w - 1, y + h // 2), fill=WARM[0])
    elif h2(x, y, 7) < 0.35:
        # A blind half down.
        f.rect(x, y, x + w - 1, y + h // 3, '#d8cfae')
        f.rect(x, y + h // 3, x + w - 1, y + h // 3, '#a89d7c')


def segment_head(f, x, y, w, pal):
    """Gauged brick over a segmental arch: two courses of rubbed headers."""
    for i in range(-1, w + 1):
        lift = 1 if 0 < i < w - 1 else 0
        f.px(x + i, y - 2 - lift, pal[4] if i % 2 else pal[3])
        f.px(x + i, y - 3 - lift, pal[1])


class Modern:
    """Shared projection: a front face, a sheared right face and a flat top."""

    def __init__(self, w_tiles, d_tiles, seed=0, deep=False):
        self.W = w_tiles * 16
        self.sw = side_depth(d_tiles, deep=deep)
        self.seed = seed

    def assemble(self, front, side, top=None, above=0):
        """Front at the left, the side sheared up a pixel per column, then
        whatever sits on the roof. `above` is headroom for stacks and tanks."""
        W, D, H = self.W, self.sw, front.h
        out = Image.new('RGBA', (W + D + 1, H + D + above))
        em = Image.new('RGBA', out.size)
        base = D + above
        out.paste(front.im, (0, base), front.im)
        em.paste(front.em, (0, base), front.em)
        for i in range(D):
            col = side.im.crop((i, 0, i + 1, side.h))
            ecol = side.em.crop((i, 0, i + 1, side.h))
            out.paste(col, (W + i, base - i - 1), col)
            em.paste(ecol, (W + i, base - i - 1), ecol)
        if top:
            out.alpha_composite(top.im, (0, 0))
            em.alpha_composite(top.em, (0, 0))
        self.anchor_x = W // 2
        return out, em

    def flat_top(self, canvas_w, canvas_h, base_y, fill, rim, back_face, inset=2):
        """A flat roof inside its parapet: the coping all round, the roof
        surface inset, and the inner faces of the back and left parapets."""
        W, D = self.W, self.sw
        f = Face(canvas_w, canvas_h)
        y0 = base_y - 1
        poly = [(0, y0), (W - 1, y0), (W - 1 + D, y0 - D), (D, y0 - D)]
        f.d.polygon(poly, fill=rim[3])
        f.d.line(poly[0:2], fill=rim[4])
        f.d.line((poly[3], poly[2]), fill=rim[2])
        inner = [(inset + 1, y0 - 1), (W - inset - 1, y0 - 1),
                 (W - 1 + D - inset - 1, y0 - D + inset), (D + inset, y0 - D + inset)]
        f.d.polygon(inner, fill=fill)
        # The back parapet shows its inner face; the left one its sheared face.
        f.d.line((inner[3][0], inner[3][1] + 1, inner[2][0], inner[2][1] + 1), fill=back_face[0])
        f.d.line((inner[3][0], inner[3][1] + 2, inner[2][0] - 1, inner[2][1] + 2), fill=back_face[1])
        f.d.line((inner[0][0], inner[0][1], inner[3][0], inner[3][1]), fill=back_face[1])
        return f, inner


class CommercialBlock(Modern):
    """A three-storey brick block on a main street, about 1895: two shops
    with plate glass under awnings, a door between them to the offices,
    segmental sashes in paired bays, a pressed-metal cornice and a dated
    parapet."""

    def __init__(self, w_tiles=8, d_tiles=5, seed=0, storeys=3):
        super().__init__(w_tiles, d_tiles, seed)
        self.storeys = storeys

    def render(self):
        W, D, s = self.W, self.sw, self.seed
        ground = STOREY + 10
        cornice, parapet = 9, 8
        H = ground + STOREY * (self.storeys - 1) + cornice + parapet
        f = Face(W, H)
        top = cornice + parapet
        brick_wall(f, 0, top, W - 1, H - 1, BRICK, s)
        bays = [(4, 30), (36, 62), (66, 92), (98, 124)] if W == 128 else \
            [(4 + i * 32, 30 + i * 32) for i in range(W // 32)]
        piers = sorted({0, W - 4} | {b[0] - 4 for b in bays[1:]} | {W // 2 - 2})
        # Upper floors.
        for storey in range(1, self.storeys):
            fy = top + (self.storeys - 1 - storey) * STOREY
            f.rect(0, fy + STOREY - 2, W - 1, fy + STOREY - 1, STONE[2])
            f.rect(0, fy + STOREY - 1, W - 1, fy + STOREY - 1, STONE[1])
            for x0, x1 in bays:
                span = x1 - x0
                for k, wx in enumerate((x0 + span // 4 - 3, x0 + 3 * span // 4 - 3)):
                    wy = fy + 7
                    segment_head(f, wx, wy, 7, BRICK)
                    sash(f, wx, wy, 7, 14, h2(wx, storey, s + 3) < 0.4)
                    f.rect(wx - 2, wy + 15, wx + 8, wy + 15, STONE[3])
                    f.rect(wx - 2, wy + 16, wx + 8, wy + 16, STONE[1])
        # Pilasters: brick piers with stone caps, lit on the left edge.
        for px_ in piers:
            for y in range(top, H - ground):
                f.px(px_, y, BRICK[4] if (y // 3) % 2 else BRICK[3])
                f.px(px_ + 3, y, BRICK[1])
            f.rect(px_ - 1, top, px_ + 4, top + 1, STONE[3])
        # Ground floor: cast-iron columns between shopfronts.
        gy = H - ground
        f.rect(0, gy, W - 1, gy + 1, STONE[3])
        f.rect(0, gy + 2, W - 1, gy + 2, STONE[1])
        mid = W // 2
        self.door_x = mid - DOOR_W // 2
        self.shopfront(f, 4, self.door_x - 4, gy + 3, H - 1, 0)
        self.shopfront(f, self.door_x + DOOR_W + 3, W - 5, gy + 3, H - 1, 1)
        for cx in (0, W - 4, self.door_x - 3, self.door_x + DOOR_W):
            f.rect(cx, gy + 3, cx + 3, H - 1, CORNICE[2])
            f.rect(cx, gy + 3, cx, H - 1, CORNICE[4])
            f.rect(cx + 3, gy + 3, cx + 3, H - 1, CORNICE[0])
            f.rect(cx - 1, gy + 3, cx + 4, gy + 4, CORNICE[3])
            f.rect(cx - 1, H - 3, cx + 4, H - 1, CORNICE[1])
        # The office door, glazed above a panel, with a fanlight and number.
        dx, dy = self.door_x, H - DOOR_H
        f.rect(dx - 1, dy - 6, dx + DOOR_W, H - 1, CORNICE[0])
        f.rect(dx, dy - 5, dx + DOOR_W - 1, dy - 2, GLASS[2])
        f.glow(dx, dy - 5, dx + DOOR_W - 1, dy - 2)
        f.rect(dx, dy, dx + DOOR_W - 1, H - 1, SHOP[2])
        f.rect(dx + 2, dy + 2, dx + DOOR_W - 3, dy + 9, GLASS[1])
        f.rect(dx + 2, dy + 2, dx + DOOR_W - 3, dy + 4, GLASS[2])
        f.rect(dx + 2, dy + 12, dx + DOOR_W - 3, H - 3, SHOP[1])
        f.rect(dx + 2, dy + 12, dx + DOOR_W - 3, dy + 12, SHOP[3])
        f.px(dx + DOOR_W - 3, dy + 11, '#d8b25a')
        f.rect(dx - 2, H - 1, dx + DOOR_W + 1, H - 1, STONE[2])
        # Cornice: fascia, brackets in pairs, a dentil course, the crown.
        cy = parapet
        f.rect(0, cy, W - 1, cy + cornice - 1, CORNICE[2])
        f.rect(0, cy, W - 1, cy + 1, CORNICE[4])
        f.rect(0, cy + 2, W - 1, cy + 2, CORNICE[1])
        for x in range(0, W, 2):
            f.px(x, cy + 3, CORNICE[3])
        for x in list(range(2, W - 2, 8)):
            f.rect(x, cy + 3, x + 2, cy + cornice - 1, CORNICE[3])
            f.px(x, cy + 3, CORNICE[4])
            f.rect(x + 2, cy + 4, x + 2, cy + cornice - 1, CORNICE[0])
            f.px(x + 1, cy + cornice - 1, CORNICE[1])
        f.rect(0, cy + cornice - 1, W - 1, cy + cornice - 1, CORNICE[0])
        # Parapet: brick panels, a raised centre with the name and the date.
        brick_wall(f, 0, 0, W - 1, parapet - 1, BRICK, s + 9)
        f.rect(0, 0, W - 1, 0, STONE[3])
        f.rect(0, 1, W - 1, 1, STONE[1])
        for x0, x1 in bays:
            f.rect(x0 + 2, 3, x1 - 2, parapet - 2, BRICK[1])
            f.rect(x0 + 3, 4, x1 - 3, parapet - 2, BRICK[3])
        return f, H

    def shopfront(self, f, x0, x1, y0, y1, k):
        """Bulkhead, plate glass in three lights, prism transom, fascia, and a
        striped awning let down over the glass."""
        f.rect(x0, y0, x1, y1, SHOP[2])
        fascia = y0 + 6
        f.rect(x0, y0, x1, fascia, SHOP[1])
        f.rect(x0, y0, x1, y0, SHOP[3])
        # Gilt letters on the fascia, a word too small to spell.
        for x in range(x0 + 3, x1 - 2):
            if h2(x, k, 11) < 0.62 and (x - x0) % 5 != 0:
                f.px(x, fascia - 3, '#d9b760')
                if h2(x, k, 12) < 0.5:
                    f.px(x, fascia - 2, '#a8873d')
        f.rect(x0, fascia, x1, fascia, SHOP[0])
        bulk = y1 - 6
        glass_top = fascia + 5
        f.rect(x0 + 1, glass_top - 3, x1 - 1, glass_top - 1, GLASS[3])
        for x in range(x0 + 1, x1, 3):
            f.px(x, glass_top - 2, GLASS[2])
        f.rect(x0 + 1, glass_top, x1 - 1, bulk - 1, GLASS[1])
        for x in range(x0 + 1, x1):
            # Reflections: a pale streak leaning across each light.
            for y in range(glass_top, bulk):
                if (x - y + 40) % 23 in (0, 1) and y < bulk - 3:
                    f.px(x, y, GLASS[3])
        f.rect(x0 + 1, glass_top, x1 - 1, glass_top + 2, GLASS[2])
        # Wares in the window.
        for x in range(x0 + 3, x1 - 2, 4):
            if h2(x, k, 13) < 0.7:
                c = ['#c9a45a', '#7e3a2e', '#e1d6bd', '#46604a'][int(h2(x, k, 14) * 4)]
                hh = 2 + int(h2(x, k, 15) * 4)
                f.rect(x, bulk - 1 - hh, x + 1, bulk - 2, c)
        f.glow(x0 + 1, glass_top, x1 - 1, bulk - 1)
        n = 3
        for i in range(1, n):
            mx = x0 + (x1 - x0) * i // n
            f.rect(mx, glass_top, mx, bulk - 1, SHOP[3])
            f.e.line((mx, glass_top, mx, bulk - 1), fill=WARM[0])
        f.rect(x0, bulk, x1, y1, SHOP[3])
        f.rect(x0 + 2, bulk + 2, x1 - 2, y1 - 2, SHOP[2])
        f.rect(x0, bulk, x1, bulk, SHOP[4])
        # The awning: stripes that narrow as they fall toward the viewer.
        ay = fascia + 1
        for y in range(ay, ay + 7):
            for x in range(x0 - 1, x1 + 2):
                stripe = ((x - x0) // 4) % 2
                c = AWNING[stripe]
                if y == ay:
                    c = '#1d3d2c' if stripe == 0 else '#b3a888'
                elif y >= ay + 5:
                    c = AWNING[stripe] if (x - x0) % 4 not in (0, 3) else '#1d3d2c'
                f.px(x, y, c)
        for x in range(x0 - 1, x1 + 2):
            if (x - x0) % 4 in (1, 2):
                f.px(x, ay + 7, AWNING[((x - x0) // 4) % 2])
        f.rect(x0 - 1, ay + 8, x1 + 1, ay + 8, '#1b2a22')

    def side_face(self, H):
        D = self.sw
        f = Face(D, H)
        brick_wall(f, 0, 9 + 8, D - 1, H - 1, COMMON, self.seed + 5, stretch=6, mortar='#6a5446')
        f.rect(0, 0, D - 1, 16, COMMON[2])
        f.rect(0, 0, D - 1, 0, STONE[2])
        f.rect(0, 1, D - 1, 1, STONE[0])
        f.rect(0, 8, D - 1, 16, CORNICE[1])
        f.rect(0, 8, D - 1, 8, CORNICE[3])
        # A ghost sign for a long-gone tenant, flaking off the party wall.
        f.rect(1, 28, D - 2, 69, '#8f7456')
        for y in range(28, 70):
            for x in range(1, D - 1):
                if h2(x // 2, y // 2, 21) < 0.2:
                    f.px(x, y, COMMON[2])
        for y in range(32, 66, 8):
            f.rect(2, y, D - 3, y + 3, '#a78c68')
            for x in range(3, D - 3):
                if h2(x, y, 23) < 0.55:
                    f.rect(x, y + 1, x, y + 2, '#4d3326')
        f.rect(D - 2, 17, D - 2, H - 1, CORNICE[0])
        return f

    def build(self):
        front, H = self.render()
        side = self.side_face(H)
        above = 10
        top, inner = self.flat_top(self.W + self.sw + 1, self.sw + above + 2, self.sw + above + 1,
                                   TAR[1], STONE, (TAR[0], BRICK[1]))
        # A chimney on the party wall and the stair hatch.
        cx = self.sw + 10
        by = self.sw + above - self.sw
        top.rect(cx, by - 9, cx + 7, by + 3, BRICK[2])
        top.rect(cx, by - 9, cx + 1, by + 3, BRICK[3])
        top.rect(cx + 6, by - 9, cx + 7, by + 3, BRICK[1])
        top.rect(cx - 1, by - 10, cx + 8, by - 9, STONE[3])
        top.rect(cx + 1, by - 11, cx + 2, by - 10, '#6a3a2a')
        top.rect(cx + 4, by - 11, cx + 5, by - 10, '#6a3a2a')
        hx, hy = self.W // 2 + 20, self.sw + above - 5
        top.rect(hx, hy, hx + 9, hy + 3, TAR[3])
        top.rect(hx, hy - 3, hx + 9, hy - 1, STONE[2])
        top.rect(hx + 9, hy - 2, hx + 10, hy + 3, TAR[0])
        for x in range(4, self.W - 8, 17):
            top.px(x + self.sw // 2, self.sw + above - self.sw // 2, TAR[2])
        self.smoke = [[cx + 3, 0, 'chimney']]
        return self.assemble(front, side, top, above)


class SawtoothShed(Modern):
    """A weaving shed of about 1910, its gable end to the street: five teeth
    of glass and slate, pilasters under each peak, tall iron sashes, loading
    doors, a painted name band and the mill stack behind."""

    TOOTH = 32
    RISE = 16

    def __init__(self, w_tiles=10, d_tiles=7, seed=0):
        super().__init__(w_tiles, d_tiles, seed, deep=True)

    def front(self):
        W, T, R, s = self.W, self.TOOTH, self.RISE, self.seed
        wall = STOREY + 22
        H = wall + R
        f = Face(W, H)
        teeth = W // T
        # The wall rises in a zigzag: low at each tooth's left, high at its right.
        for t in range(teeth):
            x0 = t * T
            for x in range(x0, x0 + T):
                ytop = R - (x - x0 + 1) * R // T
                brick_wall(f, x, ytop, x, H - 1, BRICK, s)
                f.px(x, ytop, STONE[3])
                f.px(x, ytop + 1, STONE[1])
        # Pilasters under each peak, and at the ends.
        for t in range(teeth + 1):
            px_ = min(W - 4, max(0, t * T - 2))
            for y in range(0 if t else R, H):
                f.px(px_, y, BRICK[4] if (y // 3) % 2 else BRICK[3])
                f.px(px_ + 1, y, BRICK[3])
                f.px(px_ + 3, y, BRICK[1])
        f.rect(0, H - 4, W - 1, H - 1, STONE[1])
        f.rect(0, H - 4, W - 1, H - 4, STONE[3])
        # A painted name band across the whole front.
        by = R + 3
        f.rect(4, by, W - 5, by + 6, '#2b2320')
        f.rect(4, by, W - 5, by, '#4a3a33')
        for x in range(8, W - 8):
            if (x // 6) % 5 != 4 and h2(x, 1, s + 30) < 0.7:
                f.px(x, by + 2, '#e8e0cc')
                f.px(x, by + 4, '#e8e0cc' if h2(x, 2, s + 31) < 0.6 else '#cfc6b0')
                if h2(x, 3, s + 32) < 0.35:
                    f.px(x, by + 3, '#e8e0cc')
        # Tall iron-framed sashes, one per tooth, and the loading bay.
        self.door_x = None
        for t in range(teeth):
            x0 = t * T + 5
            if t == 1:
                self.loading(f, t * T + 4, H)
                continue
            wx, wy, ww, wh = x0, by + 11, T - 11, wall - 22
            segment_head(f, wx, wy, ww, BRICK)
            f.rect(wx - 1, wy - 1, wx + ww, wy + wh, STEEL[0])
            lit = h2(t, 0, s + 33) < 0.8
            for y in range(wy, wy + wh):
                for x in range(wx, wx + ww):
                    gx, gy = (x - wx) % 4, (y - wy) % 5
                    if gx == 3 or gy == 4:
                        c = STEEL[1]
                    else:
                        v = h2((x - wx) // 4, (y - wy) // 5, s + t)
                        c = GLASS[2] if y < wy + wh // 3 else GLASS[1]
                        if v < 0.08:
                            c = '#a8b8a8'  # a pane painted over
                        elif v < 0.12:
                            c = GLASS[3]   # a pane opened
                    f.px(x, y, c)
            if lit:
                f.glow(wx, wy, wx + ww - 1, wy + wh - 1, COOL)
                for y in range(wy + 4, wy + wh, 5):
                    f.e.line((wx, y, wx + ww - 1, y), fill=COOL[0])
                for x in range(wx + 3, wx + ww, 4):
                    f.e.line((x, wy, x, wy + wh - 1), fill=COOL[0])
            f.rect(wx - 2, wy + wh + 1, wx + ww + 1, wy + wh + 2, STONE[3])
            f.rect(wx - 2, wy + wh + 3, wx + ww + 1, wy + wh + 3, STONE[1])
        return f, H

    def loading(self, f, x0, H):
        """Timber doors on a rail with a small door for the hands beside."""
        T = self.TOOTH
        dh = 34
        dw = T - 17
        y0 = H - dh
        f.rect(x0 - 1, y0 - 3, x0 + dw, y0 - 2, STEEL[1])
        f.rect(x0 - 1, y0 - 2, x0 + dw, y0 - 2, STEEL[3])
        f.rect(x0, y0, x0 + dw - 1, H - 1, '#4a2a22')
        for x in range(x0, x0 + dw):
            f.rect(x, y0, x, H - 1, '#6b3a2c' if (x - x0) % 3 else '#3a2019')
        for y in (y0 + 3, y0 + dh // 2, H - 4):
            f.rect(x0, y, x0 + dw - 1, y, '#2a1712')
        for i in range(dw):
            f.px(x0 + i, y0 + 3 + i * (dh // 2 - 3) // dw, '#8a5038')
        f.rect(x0 + dw // 2, y0, x0 + dw // 2, H - 1, '#2a1712')
        self.door_x = x0 + dw + 1
        dx = self.door_x
        f.rect(dx - 1, H - DOOR_H - 1, dx + DOOR_W, H - 1, STEEL[0])
        f.rect(dx, H - DOOR_H, dx + DOOR_W - 1, H - 1, '#3d5145')
        f.rect(dx + 2, H - DOOR_H + 2, dx + DOOR_W - 3, H - DOOR_H + 8, GLASS[2])
        f.glow(dx + 2, H - DOOR_H + 2, dx + DOOR_W - 3, H - DOOR_H + 8, COOL)
        f.rect(dx + 1, H - DOOR_H + 11, dx + DOOR_W - 2, H - 2, '#2f4036')
        f.px(dx + DOOR_W - 3, H - 12, '#c8b070')

    def side_face(self, wall_h):
        D = self.sw
        f = Face(D, wall_h)
        brick_wall(f, 0, 0, D - 1, wall_h - 1, COMMON, self.seed + 5, stretch=6, mortar='#6a5446')
        f.rect(0, 0, D - 1, 1, STONE[1])
        f.rect(0, wall_h - 4, D - 1, wall_h - 1, STONE[0])
        for y0 in (10, 10 + (wall_h - 22) // 2):
            f.rect(3, y0, D - 4, y0 + (wall_h - 30) // 2, STEEL[0])
            f.rect(4, y0 + 1, D - 5, y0 + (wall_h - 30) // 2 - 1, GLASS[1])
            f.glow(4, y0 + 1, D - 5, y0 + (wall_h - 30) // 2 - 1, COOL)
        return f

    def roof(self, canvas_w, canvas_h, base_y):
        """Each tooth: a slate slope rising to the right, then a glazed face
        dropping back to the gutter, both carried straight back."""
        W, T, R, D = self.W, self.TOOTH, self.RISE, self.sw
        f = Face(canvas_w, canvas_h)
        for t in range(W // T):
            x0, x1 = t * T, t * T + T - 1
            for x in range(x0, x1 + 1):
                yf = base_y - (x - x0 + 1) * R // T
                for j in range(D):
                    y = yf - j - 1
                    course = (j + (x - x0) // 2) % 4
                    c = SLATE[3] if course else SLATE[2]
                    if j == 0:
                        c = SLATE[4]
                    elif j == D - 1:
                        c = SLATE[1]
                    elif h2(x, j, 40 + t) < 0.05:
                        c = SLATE[4]
                    f.px(x + j, y, c)
            # The north light, facing the viewer's right, a strip per tooth.
            gx = x1 + 1
            hi, lo = base_y - R - 1, base_y - 1
            for i in range(D):
                for y in range(hi, lo):
                    yy = y - i - 1
                    band = (y - hi) % 4 == 3 or i % 4 == 3
                    c = STEEL[1] if band else GLASS[2] if y - hi < 5 else GLASS[1]
                    if y == hi:
                        c = STEEL[3]
                    f.px(gx + i, yy, c)
                    if not band and y > hi:
                        f.e.point((gx + i, yy), fill=COOL[1] if (y - hi) < 6 else COOL[0])
            # Gutter at the foot of the next slope.
            for i in range(D):
                f.px(gx + i, lo - i - 1, STEEL[0])
        return f

    def stack(self, f, x, y_base, height):
        """The mill chimney: tapering brick, iron bands, a corbelled cap."""
        for k in range(height):
            y = y_base - k
            half = 7 - k * 3 // height
            for dx in range(-half, half + 1):
                row = k // 3
                v = h2((dx + half + row % 2 * 2) // 4, row, 50)
                c = BRICK[1] if dx == half else BRICK[2] if dx > half // 2 else \
                    BRICK[4] if dx == -half + 1 else BRICK[3] if v < 0.5 else BRICK[2]
                if k % 3 == 2:
                    c = BRICK[1] if dx > 0 else BRICK[2]
                f.px(x + dx, y, c)
            if k in (height // 3, 2 * height // 3):
                for dx in range(-half, half + 1):
                    f.px(x + dx, y, STEEL[1] if dx > 0 else STEEL[3])
        top = y_base - height
        for dx in range(-6, 7):
            f.px(x + dx, top, STONE[3])
            f.px(x + dx, top + 1, BRICK[1])
            f.px(x + dx, top - 1, BRICK[3] if dx < 3 else BRICK[1])
            f.px(x + dx, top - 2, STONE[3] if dx < 3 else STONE[1])
        for dx in range(-4, 5):
            f.px(x + dx, top - 2, '#1a1514')
        self.smoke = [[x, top - 3, 'chimney']]

    def build(self):
        front, H = self.front()
        wall = H - self.RISE
        side = self.side_face(wall)
        D, R = self.sw, self.RISE
        above = 96
        cw, ch = self.W + D + 1, H + D + above
        base = D + above
        out = Image.new('RGBA', (cw, ch))
        em = Image.new('RGBA', (cw, ch))
        chimney = Face(cw, ch)
        self.stack(chimney, 30 + D, base + R - D, above + R - 4)
        out.alpha_composite(chimney.im)
        roof = self.roof(cw, ch, base + R)
        out.alpha_composite(roof.im)
        em.alpha_composite(roof.em)
        out.alpha_composite(front.im, (0, base))
        em.alpha_composite(front.em, (0, base))
        for i in range(D):
            col = side.im.crop((i, 0, i + 1, side.h))
            ecol = side.em.crop((i, 0, i + 1, side.h))
            out.alpha_composite(col, (self.W + i, base + R - i - 1))
            em.alpha_composite(ecol, (self.W + i, base + R - i - 1))
        self.anchor_x = self.W // 2
        return out, em


class CurtainTower(Modern):
    """An office slab of about 1960 in three slices the game stacks at run
    time: a lobby on pilotis, a curtain-wall storey repeated as often as the
    plot's height allows, and a crown of louvred plant room."""

    BAY = 8

    def __init__(self, w_tiles=8, d_tiles=8, seed=0):
        super().__init__(w_tiles, d_tiles, seed, deep=True)

    def storey(self, n):
        """One floor of curtain wall: spandrel, then vision glass split by
        aluminium mullions. Which rooms are lit is seeded per floor."""
        W, D, B = self.W, self.sw, self.BAY
        f = Face(W, STOREY)
        side = Face(D, STOREY)
        for face, width, dark in ((f, W, 0), (side, D, 1)):
            sp = 8
            face.rect(0, 0, width - 1, sp - 1, SPANDREL[2 - dark])
            face.rect(0, 0, width - 1, 0, ALUMINIUM[1 - dark])
            face.rect(0, sp - 1, width - 1, sp - 1, SPANDREL[0])
            for x in range(width):
                bay = x // B
                # Each bay reflects its own patch of sky; the pattern holds
                # from floor to floor, as a glass slab mirrors one sky.
                v = h2(bay, 0, self.seed + dark * 9)
                ramp = CURTAIN[1 + int(v * 3) - dark:] if dark == 0 else CURTAIN[max(0, int(v * 3) - 1):]
                for y in range(sp, STOREY):
                    t = (y - sp) / (STOREY - sp)
                    c = ramp[0] if t > 0.66 else ramp[1] if t > 0.25 else ramp[2]
                    if y == sp and not dark:
                        c = CURTAIN[5] if v > 0.6 else CURTAIN[4]
                    # Venetian blinds let down in a few offices.
                    elif y < sp + 5 and h2(bay, n, self.seed + 80 + dark) < 0.22:
                        c = '#b9b8a6' if (y - sp) % 2 else '#8f9084'
                    face.px(x, y, c)
                if x % B == 0:
                    for y in range(0, STOREY):
                        face.px(x, y, ALUMINIUM[2 - dark] if y >= sp else ALUMINIUM[1 - dark])
            face.rect(0, STOREY - 1, width - 1, STOREY - 1, SPANDREL[1])
            for bay in range(width // B + 1):
                x0 = bay * B + 1
                if h2(bay, n, self.seed + 60 + dark) < 0.45:
                    face.glow(x0, sp, min(width - 1, x0 + B - 2), STOREY - 2,
                              ['#7b8a7a', '#cfe0cf', '#f1f7e8', '#ffffff'])
        return f, side

    def base(self):
        W, D = self.W, self.sw
        h = STOREY + 10
        f = Face(W, h)
        side = Face(D, h)
        # Lobby glass set back under the slab edge, lit all night.
        f.rect(0, 0, W - 1, 5, TRAVERTINE[3])
        f.rect(0, 0, W - 1, 0, TRAVERTINE[4])
        f.rect(0, 5, W - 1, 5, TRAVERTINE[1])
        f.rect(0, 6, W - 1, 8, '#2a2724')
        f.rect(0, 9, W - 1, h - 3, GLASS[1])
        f.rect(0, 9, W - 1, 13, GLASS[2])
        f.glow(0, 9, W - 1, h - 3, ['#8d7a4e', '#e6d3a0', '#fbf0cc', '#ffffff'])
        for x in range(0, W, 16):
            f.rect(x, 9, x, h - 3, ALUMINIUM[1])
            f.e.line((x, 9, x, h - 3), fill='#6d6040')
        # Pilotis: square columns standing proud of the glass.
        for x in range(6, W, 29):
            f.rect(x, 6, x + 5, h - 3, TRAVERTINE[2])
            f.rect(x, 6, x + 1, h - 3, TRAVERTINE[4])
            f.rect(x + 5, 6, x + 5, h - 3, TRAVERTINE[0])
            f.e.rectangle((x, 6, x + 5, h - 3), fill=(0, 0, 0, 0))
        self.door_x = W // 2 - DOOR_W // 2 + 4
        dx = self.door_x
        f.rect(dx - 1, h - DOOR_H - 1, dx + DOOR_W, h - 1, ALUMINIUM[0])
        f.rect(dx, h - DOOR_H, dx + DOOR_W - 1, h - 1, GLASS[2])
        f.rect(dx + DOOR_W // 2, h - DOOR_H, dx + DOOR_W // 2, h - 1, ALUMINIUM[2])
        f.rect(dx + 1, h - 12, dx + DOOR_W - 2, h - 12, ALUMINIUM[3])
        f.rect(0, h - 2, W - 1, h - 1, TRAVERTINE[1])
        f.rect(0, h - 2, W - 1, h - 2, TRAVERTINE[3])
        side.rect(0, 0, D - 1, 5, TRAVERTINE[2])
        side.rect(0, 6, D - 1, h - 1, '#262a2a')
        side.rect(2, 9, D - 1, h - 3, GLASS[0])
        side.glow(2, 9, D - 1, h - 3, ['#6d5f3c', '#b8a67a', '#dccb9c', '#ffffff'])
        side.rect(0, 6, 1, h - 1, TRAVERTINE[1])
        return f, side

    def crown(self):
        W, D = self.W, self.sw
        h = 20
        f = Face(W, h)
        side = Face(D, h)
        for face, width, dark in ((f, W, 0), (side, D, 1)):
            face.rect(0, 0, width - 1, h - 1, ALUMINIUM[1 - dark])
            face.rect(0, 0, width - 1, 1, ALUMINIUM[3 - dark])
            for y in range(4, h - 3, 2):
                face.rect(0, y, width - 1, y, ALUMINIUM[0])
            for x in range(0, width, 16):
                face.rect(x, 2, x, h - 3, SPANDREL[2])
            face.rect(0, h - 3, width - 1, h - 1, SPANDREL[1])
        return f, side

    def build(self, storeys=8):
        W, D = self.W, self.sw
        slices = [self.crown()] + [self.storey(n) for n in range(storeys)] + [self.base()]
        H = sum(fr.h for fr, _ in slices)
        front, side = Face(W, H), Face(D, H)
        y = 0
        self.slices = []
        for fr, sd in slices:
            front.im.alpha_composite(fr.im, (0, y))
            front.em.alpha_composite(fr.em, (0, y))
            side.im.alpha_composite(sd.im, (0, y))
            side.em.alpha_composite(sd.em, (0, y))
            self.slices.append(y)
            y += fr.h
        above = 18
        top, inner = self.flat_top(W + D + 1, D + above + 2, D + above + 1,
                                   '#8c8c82', ALUMINIUM + ['#f2f3ee'], (SPANDREL[1], ALUMINIUM[0]), inset=2)
        # Gravel ballast, a plant penthouse set back, a window-cleaning rail.
        for yy in range(top.h):
            for xx in range(top.w):
                if top.im.getpixel((xx, yy)) == (140, 140, 130, 255) and h2(xx, yy, 70) < 0.25:
                    top.px(xx, yy, '#7a7a70' if h2(xx, yy, 71) < 0.5 else '#9c9c90')
        pw, pd, ph = 44, 8, 12
        px0, py0 = W // 2 - pw // 2 + D // 2, D + above - D // 2 + 2
        top.rect(px0, py0 - ph, px0 + pw - 1, py0, ALUMINIUM[1])
        top.rect(px0, py0 - ph, px0 + pw - 1, py0 - ph + 1, ALUMINIUM[3])
        for yy in range(py0 - ph + 3, py0, 2):
            top.rect(px0, yy, px0 + pw - 1, yy, ALUMINIUM[0])
        for i in range(pd):
            top.rect(px0 + pw + i, py0 - ph - i - 1, px0 + pw + i, py0 - i - 1, ALUMINIUM[0])
        for i in range(pd):
            top.rect(px0 + i + 1, py0 - ph - i - 1, px0 + pw + i - 1, py0 - ph - i - 1, '#a9aca4')
        for x in range(4, W - 2, 6):
            top.px(x + 1, D + above - 1, ALUMINIUM[3])
        return self.assemble(front, side, top, above)


# The game's buildings stand three pixels above their anchor and six above
# the sprite's foot, as the oblique houses do.
FOOT = 7

# name: (painter, footprint, seed, storeys, label)
MODERN_BUILDINGS = {
    'modern-commercial-block-0': ('block', [8, 5], 3, 3, 'Brick commercial block'),
    'modern-commercial-block-1': ('block', [6, 5], 8, 4, 'Brick commercial block'),
    'modern-commercial-block-2': ('block', [5, 4], 13, 3, 'Brick commercial block'),
    'modern-sawtooth-shed-0': ('shed', [10, 7], 2, 1, 'Sawtooth weaving shed'),
    'modern-sawtooth-shed-1': ('shed', [8, 6], 6, 1, 'Sawtooth weaving shed'),
    'modern-curtain-tower-0': ('tower', [6, 6], 9, 5, 'Curtain-wall office tower'),
    'modern-curtain-tower-1': ('tower', [8, 8], 5, 9, 'Curtain-wall office tower'),
    'modern-curtain-tower-2': ('tower', [8, 8], 17, 14, 'Curtain-wall office tower'),
}

ABOUT = {
    'block': 'A main-street block of the railway age: shops with plate glass under awnings, offices over them, a pressed-metal cornice and a dated parapet.',
    'shed': 'A single-storey weaving shed under a sawtooth roof whose glazed faces light the looms, with the mill stack behind.',
    'tower': 'A post-war office slab: a glass lobby on columns, a curtain wall of spandrel and vision glass, a louvred plant room on the roof.',
}


def modern_recipes():
    from art.modern_grammar import STYLES, CATALOG
    out = {}
    from art.city_kit import kit_recipes
    for name, (key, footprint, storeys, seed) in CATALOG.items():
        st = STYLES[key]
        out[name] = {
            'label': st.label, 'footprint': footprint,
            'entrance': [footprint[0] // 2, footprint[1]],
            'wall': st.material, 'roof': 'flat', 'roofMaterial': 'tar',
            'attachments': [], 'opening': 'door', 'height': st.height(storeys),
            'description': st.about, 'obliqueModern': 'grammar', 'style': key,
            'seed': seed, 'stories': storeys, 'deep': storeys >= 6,
        }
    out.update(kit_recipes(side_depth))
    for name, (kind, footprint, seed, storeys, label) in MODERN_BUILDINGS.items():
        fw, fh = footprint
        height = (STOREY + 10 + STOREY * (storeys - 1) + 17 if kind == 'block' else
                  STOREY + 38 if kind == 'shed' else STOREY * (storeys + 1) + 30)
        out[name] = {
            'label': label, 'footprint': footprint, 'entrance': [fw // 2, fh],
            'wall': 'blue-glass' if kind == 'tower' else 'grey-brick',
            'roof': 'flat', 'roofMaterial': 'slate' if kind == 'shed' else 'tar',
            'attachments': [], 'opening': 'door', 'height': height,
            'description': ABOUT[kind], 'obliqueModern': kind, 'seed': seed,
            'stories': storeys, 'deep': kind != 'block',
        }
    return out


class ObliqueModern:
    """The build's view of a modern gold master: one sprite and its glow."""

    def __init__(self, r, material=None):
        fw, fh = r['footprint']
        kind, seed, storeys = r['obliqueModern'], r['seed'], r['stories']
        if kind == 'kit':
            from art.city_kit import kit_building
            b = kit_building(r, side_depth)
            im, em = b.build()
            b.sw = b.sd
            b.door_x -= DOOR_W // 2
        elif kind == 'grammar':
            from art.modern_grammar import Facade
            b = Facade(r['style'], fw, fh, storeys, seed=seed, deep=r['deep'])
            im, em = b.build()
        elif kind == 'block':
            b = CommercialBlock(fw, fh, seed=seed, storeys=storeys)
            im, em = b.build()
        elif kind == 'shed':
            b = SawtoothShed(fw, fh, seed=seed)
            im, em = b.build()
        else:
            b = CurtainTower(fw, fh, seed=seed)
            im, em = b.build(storeys=storeys)
        self.sw, self.anchor_x, self.door_x = b.sw, b.anchor_x, b.door_x + DOOR_W // 2
        self.smoke = getattr(b, 'smoke', None)
        self.w, self.h = im.width, im.height + FOOT
        self.bottom = self.h - 6
        self.image = Image.new('RGBA', (self.w, self.h))
        self.image.alpha_composite(im)
        # A two-row plinth, as the houses stand on, under the doors' sills.
        d = ImageDraw.Draw(self.image)
        W = b.W
        d.rectangle((0, self.bottom - 1, W - 1, self.bottom), fill=STONE[1])
        d.line((0, self.bottom - 1, W - 1, self.bottom - 1), fill=STONE[3])
        for i in range(b.sw):
            d.line((W + i, self.bottom - 2 - i, W + i, self.bottom - 1 - i), fill=STONE[0])
        self.glow = Image.new('RGBA', (self.w, self.h))
        self.glow.alpha_composite(em)

    def render(self):
        return self.image


def night(im, em):
    """Dusk wash over the whole sprite, then the lit rooms at full strength."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r * 0.30 + 8), int(g * 0.34 + 10), int(b * 0.5 + 22), a)
    out.alpha_composite(em)
    return out


def make(out, zoom=3):
    from art.reference import current_adult
    person = current_adult()
    block = CommercialBlock(seed=3)
    block_im, block_em = block.build()
    block2 = CommercialBlock(w_tiles=6, seed=8, storeys=4)
    block2_im, block2_em = block2.build()
    shed = SawtoothShed(seed=2)
    shed_im, shed_em = shed.build()
    tower = CurtainTower(seed=5)
    tower_im, tower_em = tower.build(storeys=8)
    tower_lo = CurtainTower(w_tiles=6, d_tiles=6, seed=9)
    tower_lo_im, tower_lo_em = tower_lo.build(storeys=4)
    rows = [
        ('Brick commercial block · c.1895',
         [('8×5 tiles, 3 storeys', block_im), ('6×5 tiles, 4 storeys', block2_im),
          ('after dark', night(block_im, block_em))]),
        ('Sawtooth weaving shed · c.1910',
         [('10×7 tiles, stack behind', shed_im), ('after dark', night(shed_im, shed_em))]),
        ('Curtain-wall tower · c.1960',
         [('8×8 tiles, 8 storeys', tower_im), ('6×6 tiles, 4 storeys', tower_lo_im),
          ('after dark', night(tower_im, tower_em))]),
    ]
    pad, label_h, title_w = 10, 12, 0
    ground = '#5f8a45'
    street = '#8b8b84'
    blocks = []
    for title, cells in rows:
        rendered = []
        for label, im in cells:
            w = im.width + person.width + 3 * pad
            h = im.height + 2 * pad + 6
            c = Image.new('RGBA', (w, h), ground if 'dark' not in label else '#1c2a22')
            d = ImageDraw.Draw(c)
            d.rectangle((0, h - 12, w, h), fill=street if 'dark' not in label else '#2c2e30')
            c.alpha_composite(im, (pad, h - 8 - im.height))
            p = person if 'dark' not in label else night(person, Image.new('RGBA', person.size))
            c.alpha_composite(p, (pad * 2 + im.width, h - 8 - person.height))
            rendered.append((label, c))
        blocks.append((title, rendered))
    width = max(sum(c.width for _, c in r) + pad * (len(r) + 1) for _, r in blocks)
    height = 22 + sum(max(c.height for _, c in r) + label_h * 2 + pad for _, r in blocks) + pad
    sheet = Image.new('RGBA', (width, height), '#182038')
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 8)
        small = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
    except OSError:
        font = small = ImageFont.load_default()
    d.text((pad, 6), 'MODERN OBLIQUE GOLD MASTERS · live adult for scale · 12/14px returns',
           font=font, fill='#f0d795')
    y = 22
    for title, rendered in blocks:
        d.text((pad, y), title, font=font, fill='#f0d795')
        y += label_h
        x = pad
        for label, c in rendered:
            sheet.alpha_composite(c, (x, y))
            d.text((x + c.width // 2, y + c.height + 2), label, font=small, fill='#aebbd0', anchor='ma')
            x += c.width + pad
        y += max(c.height for _, c in rendered) + label_h + pad
    sheet = sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST)
    sheet.save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/modern-gold-masters.png')
