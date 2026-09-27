"""The modern facade grammar: a building is a crown, a storey repeated, and a
ground floor, each drawn by a style from its own modules.

    python3 scripts/art/modern_grammar.py out.png        # every style, day and night

A style owns its wall, windows, ground floor, crown, side wall and roof
furniture. The grammar owns the projection (oblique_modern.Modern), the bay
rhythm, the door and the lit-room layer, so every style meets the world the
same way. Styles register themselves in STYLES; which ones a city builds, by
land use, region and date, is src/content/settlements/modern-buildings.ts.
"""
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.buildings import DOOR_W, DOOR_H  # noqa: E402
from art.oblique_style import STOREY  # noqa: E402
from art.oblique_modern import (  # noqa: E402
    Face, Modern, h2, night, GLASS, WARM, COOL, TAR, STONE, ALUMINIUM, brick_wall,
)

STYLES = {}


def style(cls):
    STYLES[cls.key] = cls()
    return cls


def shade(c, k):
    """A hex colour lightened (k > 0) or darkened (k < 0) by k/100."""
    c = c.lstrip('#')
    r, g, b = (int(c[i:i + 2], 16) for i in (0, 2, 4))
    if k >= 0:
        r, g, b = (int(v + (255 - v) * k / 100) for v in (r, g, b))
    else:
        r, g, b = (int(v * (1 + k / 100)) for v in (r, g, b))
    return f'#{r:02x}{g:02x}{b:02x}'


def ramp(base, steps=(-45, -25, -10, 0, 18)):
    return [shade(base, k) for k in steps]


class Style:
    key = ''
    label = ''
    about = ''
    since = 0
    bay = 16
    ground_h = STOREY + 10
    storey_h = STOREY
    crown_h = 12
    material = 'modern-stucco'
    roof_fill = TAR[1]

    def palette(self, seed):
        return {'wall': ramp('#b8a88a')}

    def wall(self, f, x0, y0, x1, y1, p, seed, side=False):
        w = p['wall']
        f.rect(x0, y0, x1, y1, w[2] if side else w[3])
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if h2(x, y, seed + 7) < 0.06:
                    f.px(x, y, w[1] if side else w[2])

    def bays(self, W):
        n = max(1, W // self.bay)
        pad = (W - n * self.bay) // 2
        return [(pad + i * self.bay, pad + (i + 1) * self.bay - 1) for i in range(n)]

    def window(self, f, x, y, w, h, lit, p, frame='#e8e2d2', side=False):
        """A two-light casement: reveal, glass darker below the sky's
        reflection, a mullion and a sill."""
        f.rect(x - 1, y - 1, x + w, y + h, frame if not side else shade(frame, -25))
        f.rect(x, y, x + w - 1, y + h - 1, GLASS[1])
        f.rect(x, y, x + w - 1, y + max(1, h // 3), GLASS[2])
        if not side:
            f.px(x, y, GLASS[3])
        f.rect(x + w // 2, y, x + w // 2, y + h - 1, frame)
        if lit:
            f.glow(x, y, x + w - 1, y + h - 1)
            f.e.line((x + w // 2, y, x + w // 2, y + h - 1), fill=WARM[0])

    def storey(self, b, f, y, n, p):
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            w = min(9, x1 - x0 - 5)
            self.window(f, (x0 + x1 + 1) // 2 - w // 2, y + 7, w, 14,
                        b.lit(i, n), p)

    def ground(self, b, f, y, p):
        self.storey(b, f, y + 10, 0, p)

    def crown(self, b, f, p):
        w = p['wall']
        f.rect(0, 0, b.W - 1, self.crown_h - 1, w[2])
        f.rect(0, 0, b.W - 1, 0, w[4])
        f.rect(0, self.crown_h - 1, b.W - 1, self.crown_h - 1, w[0])

    def side(self, b, f, H, p):
        self.wall(f, 0, 0, f.w - 1, H - 1, p, b.seed + 5, side=True)
        f.rect(0, 0, f.w - 1, self.crown_h - 1, p['wall'][1])
        f.rect(f.w - 2, 0, f.w - 2, H - 1, p['wall'][0])

    def roof(self, b, top, base_y, p):
        pass

    def height(self, storeys):
        return self.ground_h + self.storey_h * (storeys - 1) + self.crown_h


class Facade(Modern):
    """One building of a style, `storeys` high on a `w_tiles` frontage."""

    def __init__(self, style_key, w_tiles, d_tiles, storeys, seed=0, deep=None):
        s = STYLES[style_key]
        super().__init__(w_tiles, d_tiles, seed,
                         deep=storeys >= 6 if deep is None else deep)
        self.s, self.storeys = s, storeys
        self.p = s.palette(seed)

    def lit(self, bay, floor):
        return h2(bay, floor, self.seed + 41) < 0.42

    def build(self):
        s, W, D, p = self.s, self.W, self.sw, self.p
        H = s.height(self.storeys)
        front = Face(W, H)
        s.wall(front, 0, 0, W - 1, H - 1, p, self.seed)
        self.door_x = W // 2 - DOOR_W // 2
        for n in range(self.storeys - 1, 0, -1):
            y = s.crown_h + (self.storeys - 1 - n) * s.storey_h
            s.storey(self, front, y, n, p)
        s.ground(self, front, H - s.ground_h, p)
        s.crown(self, front, p)
        side = Face(D, H)
        s.side(self, side, H, p)
        above = getattr(s, 'headroom', 14)
        rim = p.get('rim', STONE + ['#f1ead3'])
        top, _ = self.flat_top(W + D + 1, D + above + 2, D + above + 1,
                               p.get('roof', s.roof_fill), rim,
                               (TAR[0], p['wall'][1]))
        s.roof(self, top, D + above + 1, p)
        return self.assemble(front, side, top, above)


def door(f, x, H, leaf, frame, glass=None, fan=0):
    """The game's 10x23 leaf opening, framed; `fan` px of lit fanlight above."""
    y = H - DOOR_H
    f.rect(x - 2, y - 2 - fan, x + DOOR_W + 1, H - 1, frame)
    if fan:
        f.rect(x, y - fan, x + DOOR_W - 1, y - 2, GLASS[2])
        f.glow(x, y - fan, x + DOOR_W - 1, y - 2)
    f.rect(x, y, x + DOOR_W - 1, H - 1, leaf[2])
    f.rect(x + 1, y + 1, x + DOOR_W - 2, y + 1, leaf[3])
    if glass:
        f.rect(x + 2, y + 3, x + DOOR_W - 3, y + 11, glass)
    f.rect(x + 2, y + 13, x + DOOR_W - 3, H - 3, leaf[1])
    f.px(x + DOOR_W - 3, y + 12, '#d8b25a')


# --- Gruenderzeit ---------------------------------------------------------

@style
class Gruenderzeit(Style):
    """The rental palace of the European boom rings, 1860-1914: stucco over
    brick, a rusticated ground floor with shops, window surrounds that grow
    grander on the piano nobile, a console cornice."""

    key = 'gruenderzeit'
    label = 'Gruenderzeit tenement'
    about = ('A stuccoed rental block of the boom years: shops under a rusticated '
             'base, pedimented windows on the best floor, a heavy cornice on consoles.')
    since = 1860
    bay = 18
    crown_h = 16

    TONES = ['#cdb98f', '#d8cdb4', '#b9a58a', '#c9b48a', '#aeb0a4', '#d3bfa1', '#c6a987']

    def palette(self, seed):
        base = self.TONES[int(h2(seed, 1, 90) * len(self.TONES))]
        trim = shade(base, 28)
        return {'wall': ramp(base), 'trim': ramp(trim, (-40, -20, -8, 0, 12)),
                'shop': ramp(['#3c2a22', '#27352f', '#2c2f3c', '#4a2626'][int(h2(seed, 2, 90) * 4)])}

    def wall(self, f, x0, y0, x1, y1, p, seed, side=False):
        w = p['wall']
        f.rect(x0, y0, x1, y1, w[2] if side else w[3])
        # Weathered render: a few darker patches, soot under the cornice.
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                v = h2(x // 3, y // 2, seed + 11)
                if v < 0.05:
                    f.px(x, y, w[2] if not side else w[1])
                elif v > 0.985:
                    f.px(x, y, w[4] if not side else w[3])

    def storey(self, b, f, y, n, p):
        t, w = p['trim'], p['wall']
        # String course at the floor line.
        f.rect(0, y + self.storey_h - 2, b.W - 1, y + self.storey_h - 2, t[3])
        f.rect(0, y + self.storey_h - 1, b.W - 1, y + self.storey_h - 1, w[1])
        nobile = n == 1
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            wx, ww, wy, wh = (x0 + x1 + 1) // 2 - 4, 8, y + 7, 15
            # Surround: architrave, and a head that says which floor this is.
            f.rect(wx - 2, wy - 1, wx + ww + 1, wy + wh, t[3])
            f.rect(wx - 2, wy + wh, wx + ww + 1, wy + wh, t[1])
            if nobile:
                # A triangular pediment, alternating with a segmental one.
                if i % 2 == 0:
                    for k in range(4):
                        f.rect(wx - 3 + k, wy - 3 - k, wx + ww + 2 - k, wy - 3 - k, t[4] if k == 3 else t[3])
                    f.rect(wx - 3, wy - 2, wx + ww + 2, wy - 2, t[1])
                else:
                    f.rect(wx - 3, wy - 4, wx + ww + 2, wy - 3, t[3])
                    f.rect(wx - 1, wy - 5, wx + ww, wy - 5, t[4])
                    f.rect(wx - 3, wy - 2, wx + ww + 2, wy - 2, t[1])
            else:
                f.rect(wx - 3, wy - 3, wx + ww + 2, wy - 2, t[3])
                f.rect(wx - 3, wy - 3, wx + ww + 2, wy - 3, t[4])
            # Consoles under the sill.
            f.px(wx - 1, wy + wh + 1, t[2])
            f.px(wx + ww, wy + wh + 1, t[2])
            self.window(f, wx, wy, ww, wh, b.lit(i, n), p, frame='#efe7d4')
            # A transom bar: the upper third is a separate light.
            f.rect(wx, wy + 4, wx + ww - 1, wy + 4, '#efe7d4')

    def ground(self, b, f, y, p):
        t, w, s = p['trim'], p['wall'], p['shop']
        H = y + self.ground_h
        # Rusticated channels: horizontal joints every four pixels.
        f.rect(0, y, b.W - 1, H - 1, t[2])
        for yy in range(y + 3, H - 2, 4):
            f.rect(0, yy, b.W - 1, yy, t[0])
        f.rect(0, y, b.W - 1, y + 1, t[3])
        f.rect(0, y, b.W - 1, y, t[4])
        f.rect(0, H - 3, b.W - 1, H - 1, shade(t[1], -10))
        dx = b.door_x
        # The house door under a round arch; shops either side.
        f.rect(dx - 3, y + 5, dx + DOOR_W + 2, H - 1, t[1])
        for k, (a, c) in enumerate(((dx - 2, dx + DOOR_W + 1), (dx - 1, dx + DOOR_W))):
            f.rect(a, y + 6 + k, c, y + 6 + k, t[3 - k])
        door(f, dx, H, ramp('#4c3322'), t[0], fan=6)
        for x0, x1 in ((4, dx - 7), (dx + DOOR_W + 6, b.W - 5)):
            if x1 - x0 < 10:
                continue
            f.rect(x0, y + 6, x1, H - 3, s[1])
            f.rect(x0 + 1, y + 8, x1 - 1, H - 7, GLASS[1])
            f.rect(x0 + 1, y + 8, x1 - 1, y + 14, '#789594')
            f.rect(x0 + 1, y + 15, x1 - 1, y + 17, '#546f70')
            for sx in range(x0 + 4, x1 - 4, 11):
                f.rect(sx, H - 12, sx + 4, H - 8, '#8b7856')
                f.rect(sx, H - 13, sx + 3, H - 12, '#b5ab84')
            f.d.line((x0 + 2, y + 9, x0 + 8, y + 15), fill='#a2b5a9')
            f.glow(x0 + 1, y + 8, x1 - 1, H - 7)
            for mx in range(x0 + 1 + (x1 - x0) // 3, x1 - 1, max(4, (x1 - x0) // 3)):
                f.rect(mx, y + 8, mx, H - 7, s[3])
                f.e.line((mx, y + 8, mx, H - 7), fill=WARM[0])
            f.rect(x0, H - 6, x1, H - 3, s[2])
            f.rect(x0, y + 6, x1, y + 7, s[3])
            # A name in gilt on the fascia.
            for x in range(x0 + 2, x1 - 1):
                if h2(x, y, b.seed + 17) < 0.5:
                    f.px(x, y + 6, '#d9b760')

    def crown(self, b, f, p):
        t, w = p['trim'], p['wall']
        c = self.crown_h
        # Frieze, a row of consoles, the corona and a low attic.
        f.rect(0, 4, b.W - 1, c - 1, w[3])
        f.rect(0, 0, b.W - 1, 3, t[3])
        f.rect(0, 0, b.W - 1, 0, t[4])
        f.rect(0, 3, b.W - 1, 3, t[0])
        f.rect(0, 4, b.W - 1, 5, t[1])
        for x in range(2, b.W - 2, 6):
            f.rect(x, 6, x + 1, c - 4, t[3])
            f.px(x + 1, c - 4, t[1])
            f.px(x, 6, t[4])
        f.rect(0, c - 3, b.W - 1, c - 2, t[3])
        f.rect(0, c - 1, b.W - 1, c - 1, w[1])

    def side(self, b, f, H, p):
        # A party wall: bare brick where the neighbour has not yet been built.
        w = p['wall']
        f.rect(0, 0, f.w - 1, H - 1, '#7a4a36')
        for y in range(H):
            for x in range(f.w):
                if y % 3 == 2 or (x + (y // 3) * 4) % 8 == 0:
                    f.px(x, y, '#5f3a2c')
                elif h2(x, y, b.seed + 3) < 0.08:
                    f.px(x, y, '#8e5a42')
        f.rect(0, 0, f.w - 1, self.crown_h - 1, p['trim'][1])
        f.rect(0, 0, f.w - 1, 0, p['trim'][3])
        # The render wraps the corner for one pilaster width.
        f.rect(0, self.crown_h, 1, H - 1, w[2])
        f.rect(f.w - 2, 0, f.w - 2, H - 1, '#4c2f24')

    def roof(self, b, top, base_y, p):
        # A pitched tin roof behind the attic, a dormer, and chimney stacks.
        D, W = b.sw, b.W
        for i, cx in enumerate(range(D + 8, W - 6, 30)):
            by = base_y - D // 2 - 2
            top.rect(cx, by - 10, cx + 5, by + 2, '#8a5a44')
            top.rect(cx, by - 10, cx + 1, by + 2, '#a36c52')
            top.rect(cx - 1, by - 11, cx + 6, by - 10, STONE[2])
            b.smoke = (b.smoke if getattr(b, 'smoke', None) else []) + [[cx + 2, by - 12, 'chimney']]


# --- Khrushchyovka --------------------------------------------------------

@style
class Khrushchyovka(Style):
    """The five-storey prefabricated block of the Khrushchev programme,
    1957-1970s: panel seams in a grid, small paired windows, a few glazed or
    open balconies, entrance canopies over each stair, no shops."""

    key = 'khrushchyovka'
    label = 'Five-storey panel block'
    about = ('A five-storey block of factory-made panels from the late 1950s: '
             'seams between the slabs, small windows, a canopy over each stair door.')
    since = 1957
    bay = 20
    ground_h = STOREY + 10
    crown_h = 6
    material = 'concrete-frame'
    roof_fill = '#4b4a46'

    TONES = ['#c9c6bb', '#b9b7ad', '#cfc3a8', '#b7bdb9', '#d0c9bd']

    def palette(self, seed):
        base = self.TONES[int(h2(seed, 1, 91) * len(self.TONES))]
        return {'wall': ramp(base, (-40, -22, -9, 0, 12)),
                'rim': ramp('#9d9b93', (-30, -12, 0, 10, 22)),
                'accent': ['#8a3b32', '#3d5f7a', '#6f8a4a', '#b08a3a'][int(h2(seed, 3, 91) * 4)]}

    def wall(self, f, x0, y0, x1, y1, p, seed, side=False):
        w = p['wall']
        f.rect(x0, y0, x1, y1, w[2] if side else w[3])
        # Panels: seams every bay and every storey, with rust and damp
        # darkening the joints.
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                v = h2(x // 2, y // 2, seed + 12)
                if v < 0.07:
                    f.px(x, y, w[2] if not side else w[1])

    def storey(self, b, f, y, n, p):
        w = p['wall']
        f.rect(0, y + self.storey_h - 1, b.W - 1, y + self.storey_h - 1, w[1])
        f.rect(0, y + self.storey_h - 2, b.W - 1, y + self.storey_h - 2, w[4])
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            f.rect(x1, y, x1, y + self.storey_h - 1, w[1])
            cx = (x0 + x1 + 1) // 2
            balcony = i % 3 == 1
            if balcony:
                # A glazed-in balcony, each tenant's own frame and curtains.
                bx0, bx1 = x0 + 2, x1 - 2
                f.rect(bx0, y + 5, bx1, y + 21, '#6d6a62')
                f.rect(bx0 + 1, y + 6, bx1 - 1, y + 13, GLASS[2] if h2(i, n, b.seed) < 0.5 else GLASS[1])
                for x in range(bx0 + 3, bx1, 4):
                    f.rect(x, y + 6, x, y + 13, '#d8d4c8')
                f.rect(bx0, y + 14, bx1, y + 21, p['accent'] if h2(i, n, b.seed + 5) < 0.4 else w[2])
                f.rect(bx0, y + 14, bx1, y + 14, w[4])
                f.rect(bx0, y + 22, bx1, y + 23, w[0])
                if b.lit(i, n):
                    f.glow(bx0 + 1, y + 6, bx1 - 1, y + 13)
            else:
                self.window(f, cx - 5, y + 8, 10, 12, b.lit(i, n), p, frame='#e4e0d6')
                f.rect(cx - 6, y + 21, cx + 5, y + 21, w[0])

    def ground(self, b, f, y, p):
        w = p['wall']
        H = y + self.ground_h
        f.rect(0, H - 6, b.W - 1, H - 1, shade(w[1], -8))
        f.rect(0, H - 6, b.W - 1, H - 6, w[2])
        self.storey(b, f, y + 4, 0, p)
        dx = b.door_x
        f.rect(dx - 3, y + 2, dx + DOOR_W + 2, H - 1, w[3])
        # The canopy slab over the stair door, on two thin posts.
        f.rect(dx - 5, H - DOOR_H - 6, dx + DOOR_W + 4, H - DOOR_H - 4, w[4])
        f.rect(dx - 5, H - DOOR_H - 3, dx + DOOR_W + 4, H - DOOR_H - 3, w[0])
        door(f, dx, H, ramp('#6b4a2e'), w[1], glass=GLASS[1])
        f.rect(dx - 5, H - DOOR_H - 2, dx - 5, H - 1, '#55524c')
        f.rect(dx + DOOR_W + 4, H - DOOR_H - 2, dx + DOOR_W + 4, H - 1, '#55524c')

    def crown(self, b, f, p):
        r = p['rim']
        f.rect(0, 0, b.W - 1, self.crown_h - 1, r[2])
        f.rect(0, 0, b.W - 1, 0, r[4])
        f.rect(0, self.crown_h - 1, b.W - 1, self.crown_h - 1, r[0])

    def side(self, b, f, H, p):
        self.wall(f, 0, 0, f.w - 1, H - 1, p, b.seed + 5, side=True)
        w = p['wall']
        for y in range(self.crown_h + self.storey_h - 1, H, self.storey_h):
            f.rect(0, y, f.w - 1, y, w[1])
        f.rect(0, 0, f.w - 1, self.crown_h - 1, p['rim'][1])
        f.rect(f.w - 2, 0, f.w - 2, H - 1, w[0])

    def roof(self, b, top, base_y, p):
        # Stair-head vents and a thicket of television aerials.
        D = b.sw
        for i, cx in enumerate(range(D + 14, b.W - 4, 40)):
            by = base_y - D // 2 - 1
            top.rect(cx, by - 5, cx + 6, by + 1, '#77756d')
            top.rect(cx, by - 5, cx + 6, by - 5, '#9a988e')
            ax = cx + 12
            top.rect(ax, by - 14, ax, by, '#2e2e2c')
            for k in range(3):
                top.rect(ax - 3 + k, by - 13 + 3 * k, ax + 3 - k, by - 13 + 3 * k, '#2e2e2c')


# --- Contemporary glass ---------------------------------------------------

@style
class Glass(Style):
    """An office or apartment tower of 1995 on: floor-to-ceiling glazing on
    slim mullions, a band of solid spandrel every storey, a double-height
    lobby, and a projecting blade at the top."""

    key = 'glass'
    label = 'Glass tower'
    about = ('A glass tower of the turn of the millennium: tinted glazing on slim '
             'mullions, a tall lobby, and a blade of solar screens at the top.')
    since = 1995
    bay = 12
    ground_h = STOREY + 18
    crown_h = 14
    material = 'blue-glass'
    roof_fill = '#6f7470'

    TINTS = [
        ['#10252d', '#18394a', '#23556a', '#3c7890', '#7fb3c2', '#c8e3e4'],
        ['#132823', '#1c3d35', '#2a5a4c', '#44806c', '#86b8a4', '#cfe6da'],
        ['#1b2230', '#2a3448', '#3d4d66', '#5d7190', '#9aaec6', '#d7e0ea'],
    ]

    def palette(self, seed):
        return {'wall': ramp('#8f9696', (-45, -25, -10, 0, 20)),
                'glass': self.TINTS[int(h2(seed, 1, 92) * len(self.TINTS))],
                'rim': ramp('#b8bcb8', (-35, -15, 0, 10, 22)),
                'roof': '#6f7470'}

    def wall(self, f, x0, y0, x1, y1, p, seed, side=False):
        f.rect(x0, y0, x1, y1, p['wall'][2] if side else p['wall'][3])

    def glazing(self, b, f, y, h, n, p, width, dark=0):
        g = p['glass']
        for x in range(width):
            bay = x // self.bay
            v = h2(bay // 2, 0, b.seed + dark * 7)
            for yy in range(y, y + h):
                t = (yy - y) / h
                # The sky's reflection slides down the facade across the bays.
                band = ((x + (b.storeys - n) * 3) // 5) % 7
                c = g[1 + dark * 0] if t > 0.7 else g[2 + (band == 0)] if t > 0.2 else g[3 - dark]
                if v > 0.7 and not dark:
                    c = shade(c, 8)
                f.px(x, yy, c)
            if x % self.bay == 0:
                f.rect(x, y, x, y + h - 1, p['rim'][1 - dark])
        for i in range(width // self.bay + 1):
            if b.lit(i, n):
                f.glow(i * self.bay + 1, y + 2, min(width - 1, i * self.bay + self.bay - 1), y + h - 2,
                       ['#8a9aa0', '#d7e6e6', '#f4fbf8', '#ffffff'])

    def storey(self, b, f, y, n, p):
        sp = 5
        f.rect(0, y, b.W - 1, y + sp - 1, p['glass'][0])
        f.rect(0, y, b.W - 1, y, p['rim'][3])
        self.glazing(b, f, y + sp, self.storey_h - sp, n, p, b.W)

    def ground(self, b, f, y, p):
        H = y + self.ground_h
        r = p['rim']
        f.rect(0, y, b.W - 1, y + 4, r[3])
        f.rect(0, y, b.W - 1, y, r[4])
        f.rect(0, y + 4, b.W - 1, y + 4, r[0])
        f.rect(0, y + 5, b.W - 1, H - 3, GLASS[1])
        f.rect(0, y + 5, b.W - 1, y + 12, GLASS[2])
        f.glow(0, y + 5, b.W - 1, H - 3, ['#8d7a4e', '#e6d3a0', '#fbf0cc', '#ffffff'])
        for x in range(0, b.W, 24):
            f.rect(x, y + 5, x + 2, H - 1, r[2])
            f.rect(x, y + 5, x, H - 1, r[4])
        door(f, b.door_x, H, ramp('#48545a'), r[1], glass=GLASS[2])
        f.rect(0, H - 2, b.W - 1, H - 1, '#8a8a82')

    def crown(self, b, f, p):
        g, r = p['glass'], p['rim']
        c = self.crown_h
        # Solar louvres on a blade that overhangs the glass.
        f.rect(0, 0, b.W - 1, c - 1, g[1])
        for yy in range(1, c - 3, 2):
            f.rect(0, yy, b.W - 1, yy, r[3])
        f.rect(0, 0, b.W - 1, 0, r[4])
        f.rect(0, c - 3, b.W - 1, c - 1, r[2])
        f.rect(0, c - 1, b.W - 1, c - 1, r[0])

    def side(self, b, f, H, p):
        f.rect(0, 0, f.w - 1, H - 1, p['glass'][0])
        y = self.crown_h
        for n in range(b.storeys - 1, 0, -1):
            f.rect(0, y, f.w - 1, y + 4, p['glass'][0])
            self.glazing(b, f, y + 5, self.storey_h - 5, n, p, f.w, dark=1)
            y += self.storey_h
        f.rect(0, 0, f.w - 1, self.crown_h - 1, p['rim'][1])
        f.rect(0, H - self.ground_h, f.w - 1, H - 1, p['rim'][1])
        f.rect(1, H - self.ground_h + 6, f.w - 1, H - 4, GLASS[0])

    def roof(self, b, top, base_y, p):
        D = b.sw
        pw = min(40, b.W // 2)
        px0, py0 = b.W // 2 - pw // 2 + D // 2, base_y - D // 2 + 1
        top.rect(px0, py0 - 8, px0 + pw - 1, py0, p['rim'][2])
        top.rect(px0, py0 - 8, px0 + pw - 1, py0 - 7, p['rim'][4])
        for yy in range(py0 - 5, py0, 2):
            top.rect(px0, yy, px0 + pw - 1, yy, p['rim'][0])


@style
class CivicHall(Style):
    key = 'civic-hall'
    label = 'Municipal hall'
    about = 'An illustrative twentieth-century public hall with a pale stone facade, tall windows and a recessed central entrance.'
    since = 1900
    bay = 24
    crown_h = 14
    ground_h = STOREY + 16
    headroom = 30

    def palette(self, seed):
        return {'wall': ramp('#c6c2ac'), 'trim': ramp('#ddd8c4'), 'roof': '#767a72'}

    def storey(self, b, f, y, n, p):
        w, t = p['wall'], p['trim']
        f.rect(0, y + self.storey_h - 2, b.W - 1, y + self.storey_h - 1, t[2])
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            self.window(f, (x0 + x1) // 2 - 5, y + 5, 10, 17, b.lit(i, n), p, t[3])
        for x in (5, 10, b.W - 14, b.W - 9, b.W // 2 - 31, b.W // 2 + 28):
            f.rect(x, y, x + 3, y + self.storey_h - 3, t[2])
            f.rect(x, y, x, y + self.storey_h - 3, t[4])
            f.rect(x - 1, y, x + 4, y + 2, t[3])

    def ground(self, b, f, y, p):
        w, t = p['wall'], p['trim']
        H = f.h
        f.rect(0, y, b.W - 1, H - 1, w[2])
        for yy in range(y + 5, H - 2, 7):
            f.rect(0, yy, b.W - 1, yy, w[1])
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            x = (x0 + x1) // 2
            if abs(x - b.W // 2) < 22:
                continue
            self.window(f, x - 5, y + 10, 10, 20, b.lit(i, 0), p, t[3])
        cx = b.W // 2
        f.rect(cx - 23, y + 2, cx + 23, H - 2, w[0])
        f.rect(cx - 21, y + 4, cx + 21, H - 2, w[1])
        for x in (cx - 25, cx + 20):
            f.rect(x, y + 2, x + 5, H - 3, t[2])
            f.rect(x, y + 2, x + 1, H - 3, t[4])
            f.rect(x - 2, y, x + 7, y + 3, t[3])
        for x in (b.door_x - 13, b.door_x, b.door_x + 13):
            door(f, x, H, ['#261e18', '#3b2e22', '#654936', '#9b7850'], t[1], GLASS[1], fan=5)
        f.rect(cx - 30, y - 3, cx + 30, y - 1, t[3])
        f.rect(cx - 30, y - 3, cx + 30, y - 3, t[4])

    def crown(self, b, f, p):
        t = p['trim']
        for y, tone in [(0, 4), (1, 3), (2, 2), (10, 3), (11, 4), (12, 2), (13, 0)]:
            f.rect(0, y, b.W - 1, y, t[tone])
        for x in range(4, b.W - 3, 6):
            f.rect(x, 5, x + 2, 8, t[3])
            f.rect(x + 2, 7, x + 3, 9, t[0])

    def roof(self, b, top, base_y, p):
        t, cx = p['trim'], b.W // 2 + b.sw // 2
        y = base_y - b.sw // 2
        top.rect(cx - 32, y - 12, cx + 32, y, t[2])
        for k in range(14):
            half = 34 - k * 2
            top.rect(cx - half, y - 12 - k, cx + half, y - 12 - k, t[3])
            top.px(cx - half, y - 12 - k, t[4])
            top.px(cx + half, y - 12 - k, t[0])
        top.rect(cx - 32, y - 11, cx + 32, y - 9, t[4])
        top.d.ellipse((cx - 6, y - 22, cx + 6, y - 10), fill=t[0])
        top.d.ellipse((cx - 5, y - 21, cx + 5, y - 11), fill='#e8dfb9')
        top.d.line((cx, y - 20, cx, y - 16, cx + 3, y - 14), fill='#4e554e')
        for x in range(6, b.W - 5, 9):
            if abs(x - cx) < 36: continue
            top.rect(x, y - 5, x + 2, y, t[2])
            top.rect(x, y - 6, x + 6, y - 5, t[4])


@style
class Works(Style):
    key = 'works'
    label = 'Brick engineering works'
    about = 'A brick workshop range with steel-framed factory windows, loading doors, a hoist beam and a working boiler stack.'
    since = 1880
    bay = 26
    ground_h = STOREY + 16
    crown_h = 9
    headroom = 48
    material = 'grey-brick'

    def palette(self, seed):
        return {'wall': ramp('#9a6250'), 'trim': ramp('#b8b4a0'), 'roof': '#59625b'}

    def wall(self, f, x0, y0, x1, y1, p, seed, side=False):
        pal = [shade(c, -20) for c in p['wall']] if side else p['wall']
        brick_wall(f, x0, y0, x1, y1, pal, seed, mortar='#827a67')

    def storey(self, b, f, y, n, p):
        for i, (x0, x1) in enumerate(self.bays(b.W)):
            x, w = x0 + 5, x1 - x0 - 9
            self.window(f, x, y + 5, w, 19, b.lit(i, n), p, '#798679')
            for yy in (y + 11, y + 17):
                f.rect(x, yy, x + w - 1, yy, '#536055')
            f.rect(x - 2, y + 25, x + w + 1, y + 26, p['trim'][2])
        for x in range(0, b.W, self.bay):
            f.rect(x, y, x + 2, y + self.storey_h - 1, p['wall'][1])
            f.rect(x, y, x, y + self.storey_h - 1, p['wall'][4])

    def ground(self, b, f, y, p):
        self.storey(b, f, y, 0, p)
        for cx in (b.W // 4, b.W * 3 // 4):
            f.rect(cx - 13, y + 6, cx + 13, f.h - 2, p['trim'][1])
            f.rect(cx - 11, y + 8, cx + 11, f.h - 2, '#344b49')
            for yy in range(y + 10, f.h - 2, 4): f.rect(cx - 10, yy, cx + 10, yy, '#546861')
            f.rect(cx, y + 8, cx, f.h - 2, '#233b3b')
            f.rect(cx - 16, y + 3, cx + 16, y + 5, '#343d3a')
            f.px(cx - 14, y + 4, '#a9a48b')
            f.px(cx + 14, y + 4, '#a9a48b')
        door(f, b.door_x, f.h, ramp('#466057'), p['trim'][2], GLASS[1])
        f.rect(b.door_x - 6, y - 1, b.door_x + 16, y + 2, '#3f504c')

    def roof(self, b, top, base_y, p):
        x, y = b.W - 24, base_y - b.sw // 2
        top.rect(x, y - 43, x + 10, y, p['wall'][2])
        top.rect(x, y - 43, x + 2, y, p['wall'][4])
        top.rect(x + 8, y - 43, x + 10, y, p['wall'][0])
        for yy in range(y - 40, y, 5): top.rect(x, yy, x + 10, yy, p['wall'][1])
        top.rect(x - 2, y - 45, x + 12, y - 42, p['wall'][3])
        top.rect(x, y - 45, x + 10, y - 44, '#34372f')
        b.smoke = [[x + 5, y - 45, 'chimney']]
        for vx in range(24, b.W - 45, 38):
            top.rect(vx, y - 8, vx + 10, y, '#56645e')
            top.rect(vx - 2, y - 9, vx + 12, y - 7, '#b2b5a1')


# --- Catalogue ------------------------------------------------------------

# name: (style, footprint, storeys, seed). The atlas frames the city builds.
CATALOG = {
    'modern-civic-hall-0': ('civic-hall', [14, 6], 3, 3),
    'modern-civic-hall-1': ('civic-hall', [18, 7], 3, 11),
    'modern-works-0': ('works', [14, 8], 2, 5),
    'modern-works-1': ('works', [10, 7], 2, 13),
    'modern-works-2': ('works', [8, 6], 1, 21),
    'modern-gruenderzeit-0': ('gruenderzeit', [10, 6], 5, 3),
    'modern-gruenderzeit-1': ('gruenderzeit', [8, 6], 5, 11),
    'modern-gruenderzeit-2': ('gruenderzeit', [8, 6], 4, 19),
    'modern-gruenderzeit-3': ('gruenderzeit', [6, 6], 5, 27),
    'modern-khrushchyovka-0': ('khrushchyovka', [12, 6], 5, 4),
    'modern-khrushchyovka-1': ('khrushchyovka', [10, 6], 5, 12),
    'modern-khrushchyovka-2': ('khrushchyovka', [8, 6], 5, 20),
    'modern-glass-0': ('glass', [8, 8], 14, 5),
    'modern-glass-1': ('glass', [8, 8], 10, 13),
    'modern-glass-2': ('glass', [6, 6], 9, 21),
}


# --- Review sheet ---------------------------------------------------------

SAMPLES = [
    ('works', 14, 8, 2), ('works', 8, 6, 1),
    ('civic-hall', 14, 6, 3),
    ('gruenderzeit', 10, 6, 5), ('gruenderzeit', 8, 6, 4),
    ('khrushchyovka', 12, 6, 5), ('khrushchyovka', 8, 6, 5),
    ('glass', 8, 8, 14), ('glass', 6, 6, 9),
]


def make(out, zoom=3):
    from art.reference import current_adult
    person = current_adult()
    cells = []
    for key, w, d, n in SAMPLES:
        b = Facade(key, w, d, n, seed=len(cells) * 7 + 3)
        im, em = b.build()
        cells.append((f'{STYLES[key].label} · {w}x{d}, {n} storeys', im, em))
    pad = 10
    rows = [cells[i:i + 2] for i in range(0, len(cells), 2)]
    tiles = []
    for row in rows:
        out_row = []
        for label, im, em in row:
            for dark in (False, True):
                w = im.width + person.width + 3 * pad
                h = im.height + 2 * pad + 6
                c = Image.new('RGBA', (w, h), '#1c2a22' if dark else '#5f8a45')
                ImageDraw.Draw(c).rectangle((0, h - 12, w, h), fill='#2c2e30' if dark else '#8b8b84')
                c.alpha_composite(night(im, em) if dark else im, (pad, h - 8 - im.height))
                p = night(person, Image.new('RGBA', person.size)) if dark else person
                c.alpha_composite(p, (pad * 2 + im.width, h - 8 - person.height))
                out_row.append((label + (' · after dark' if dark else ''), c))
        tiles.append(out_row)
    width = max(sum(c.width for _, c in r) + pad * (len(r) + 1) for r in tiles)
    height = 22 + sum(max(c.height for _, c in r) + 24 + pad for r in tiles)
    sheet = Image.new('RGBA', (width, height), '#182038')
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
    except OSError:
        font = ImageFont.load_default()
    d.text((pad, 6), 'MODERN FACADE GRAMMAR · live adult for scale', font=font, fill='#f0d795')
    y = 22
    for r in tiles:
        x = pad
        for label, c in r:
            sheet.alpha_composite(c, (x, y))
            d.text((x + 2, y + c.height + 2), label, font=font, fill='#aebbd0')
            x += c.width + pad
        y += max(c.height for _, c in r) + 24 + pad
    sheet = sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST)
    sheet.save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/modern-grammar.png', zoom=2)
